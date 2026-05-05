import os
import json
import joblib
import numpy as np
import pandas as pd
from datetime import datetime
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    classification_report,
    confusion_matrix,
    roc_auc_score,
    f1_score,
)
from features import FEATURE_NAMES

# Reproducibility
RANDOM_SEED = 42
np.random.seed(RANDOM_SEED)

MODEL_PATH    = "model.pkl"
INFO_PATH     = "model_info.json"
N_SAMPLES     = 600   # number of synthetic samples to generate
RISKY_LABEL   = 1     # pipeline score >= threshold → risky
SAFE_LABEL    = 0     # pipeline score < threshold  → safe


# Step 1: Generate synthetic training data
def generate_dataset(n=N_SAMPLES):
    """
    Creates realistic synthetic scan results.
    Each row represents one pipeline run with 11 security features.
    Labels are derived by a rule-based formula that mirrors the gate logic:
      - If the weighted sum of issues exceeds 70 → risky (1)
      - Otherwise → safe (0)
    """
    records = []

    for _ in range(n):
        # SAST features — most pipelines have low issue counts
        nb_critical = int(np.random.exponential(scale=1.2))
        nb_high     = int(np.random.exponential(scale=3.0))
        nb_medium   = int(np.random.exponential(scale=6.0))

        # SCA features
        nb_critical_cves = int(np.random.exponential(scale=0.8))
        nb_high_cves     = int(np.random.exponential(scale=2.0))
        max_cvss         = round(np.random.beta(2, 5) * 10, 1)  # 0-10, skewed low
        outdated_count   = int(np.random.exponential(scale=4.0))

        # DAST features
        nb_high_alerts   = int(np.random.exponential(scale=1.5))
        nb_medium_alerts = int(np.random.exponential(scale=3.0))
        nb_xss           = int(np.random.exponential(scale=0.6))
        nb_sqli          = int(np.random.exponential(scale=0.3))

        #  Rule-based label ─
        # Mirrors the weighted scoring logic in pipelineRunner.js fallback
        raw_score = (
            nb_critical      * 15 +
            nb_high          * 7  +
            nb_medium        * 1  +
            nb_critical_cves * 20 +
            nb_high_cves     * 10 +
            max_cvss         * 3  +
            nb_high_alerts   * 10 +
            nb_xss           * 8  +
            nb_sqli          * 12
        )
        label = RISKY_LABEL if raw_score >= 70 else SAFE_LABEL

        records.append([
            nb_critical, nb_high, nb_medium,
            nb_critical_cves, nb_high_cves, max_cvss, outdated_count,
            nb_high_alerts, nb_medium_alerts, nb_xss, nb_sqli,
            label,
        ])

    df = pd.DataFrame(records, columns=FEATURE_NAMES + ["label"])
    return df


#  Step 2: Train and evaluate models 
def train(df):
    X = df[FEATURE_NAMES]
    y = df["label"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=RANDOM_SEED, stratify=y
    )

    # Candidate 1: Logistic Regression ─
    # Good for: interpretable coefficients, fast inference, small datasets
    lr_pipeline = Pipeline([
        ("scaler", StandardScaler()),
        ("clf",    LogisticRegression(
            max_iter=500,
            random_state=RANDOM_SEED,
            class_weight="balanced",   # handles class imbalance
        )),
    ])

    # Candidate 2: Random Forest
    # Good for: non-linear patterns, feature importance, no need to scale
    rf_pipeline = Pipeline([
        ("scaler", StandardScaler()),
        ("clf",    RandomForestClassifier(
            n_estimators=100,
            random_state=RANDOM_SEED,
            class_weight="balanced",
        )),
    ])

    candidates = {
        "LogisticRegression": lr_pipeline,
        "RandomForest":       rf_pipeline,
    }

    results = {}

    print("\n=== Training Results ===")
    for name, pipe in candidates.items():
        pipe.fit(X_train, y_train)
        y_pred  = pipe.predict(X_test)
        y_proba = pipe.predict_proba(X_test)[:, 1]

        f1  = f1_score(y_test, y_pred, average="binary")
        auc = roc_auc_score(y_test, y_proba)

        results[name] = {"pipeline": pipe, "f1": f1, "auc": auc}

        print(f"\n--- {name} ---")
        print(f"  F1 Score : {f1:.3f}")
        print(f"  AUC-ROC  : {auc:.3f}")
        print(classification_report(y_test, y_pred, target_names=["safe", "risky"]))

    # Pick the best model (highest AUC)
    best_name = max(results, key=lambda n: results[n]["auc"])
    best      = results[best_name]

    print(f"\n=== Best model: {best_name} (AUC={best['auc']:.3f}) ===\n")

    # Feature importances (Logistic Regression coefficients)
    if best_name == "LogisticRegression":
        coefs = best["pipeline"].named_steps["clf"].coef_[0]
        importances = dict(zip(FEATURE_NAMES, [round(float(c), 4) for c in coefs]))
    else:
        importances_raw = best["pipeline"].named_steps["clf"].feature_importances_
        importances = dict(zip(FEATURE_NAMES, [round(float(v), 4) for v in importances_raw]))

    print("Feature importances:")
    for feat, val in sorted(importances.items(), key=lambda x: -abs(x[1])):
        print(f"  {feat:20s} : {val:+.4f}")

    return best["pipeline"], best_name, best["f1"], best["auc"], importances


# Step 3: Save model and metadata
def save(pipeline, algorithm, f1, auc, importances):
    joblib.dump(pipeline, MODEL_PATH)
    print(f"\nModel saved → {MODEL_PATH}")

    info = {
        "version":             "1.0.0",
        "algorithm":           algorithm,
        "features":            FEATURE_NAMES,
        "feature_importances": importances,
        "f1_score":            round(f1, 4),
        "auc_roc":             round(auc, 4),
        "training_samples":    N_SAMPLES,
        "trained_at":          datetime.utcnow().isoformat() + "Z",
    }

    with open(INFO_PATH, "w") as f:
        json.dump(info, f, indent=2)

    print(f"Model info saved → {INFO_PATH}")
    return info


# Entry point
if __name__ == "__main__":
    print("Generating synthetic dataset...")
    df = generate_dataset(N_SAMPLES)

    risky_count = int(df["label"].sum())
    safe_count  = N_SAMPLES - risky_count
    print(f"Dataset: {N_SAMPLES} samples — {safe_count} safe ({safe_count/N_SAMPLES*100:.0f}%) · {risky_count} risky ({risky_count/N_SAMPLES*100:.0f}%)")

    pipeline, algo, f1, auc, importances = train(df)
    info = save(pipeline, algo, f1, auc, importances)

    print("\n=== Done ===")
    print(f"  Algorithm : {info['algorithm']}")
    print(f"  F1 Score  : {info['f1_score']}")
    print(f"  AUC-ROC   : {info['auc_roc']}")
    print(f"  Trained at: {info['trained_at']}")
    print(f"\nNext step: python app.py")
