"""
train.py – Generates synthetic training data and trains the SecOps risk model.

Fixes applied vs original:
  - Labelling formula now matches the pipelineRunner.js fallback EXACTLY
    (same feature weights, same threshold = 70) so the model learns to predict
    the same decision boundary used when the ML service is unreachable.
  - 'threshold' is written to model_info.json so model.py can read it.
  - Synthetic data uses slightly wider distributions to produce more
    intermediate-risk samples, reducing the bimodal clustering effect.
  - Both Logistic Regression and Random Forest are evaluated; the winner
    (by AUC-ROC) is saved.
  - Model info JSON is saved atomically (write to temp then rename).
  - Feature importances extracted from the LIVE model object (not hardcoded).
"""

import os
import json
import tempfile
import joblib
import numpy as np
import pandas as pd
from datetime import datetime, timezone

from sklearn.linear_model    import LogisticRegression
from sklearn.ensemble        import GradientBoostingClassifier
from sklearn.preprocessing   import StandardScaler
from sklearn.pipeline        import Pipeline
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
from sklearn.metrics         import (
    classification_report,
    roc_auc_score,
    f1_score,
)
from sklearn.calibration     import CalibratedClassifierCV

from features import FEATURE_NAMES

# ── Configuration ─────────────────────────────────────────────────────────────

RANDOM_SEED    = 42
MODEL_PATH     = "model.pkl"
INFO_PATH      = "model_info.json"
N_SAMPLES      = 800   # more samples → better generalisation
RISKY_LABEL    = 1
SAFE_LABEL     = 0

# !! MUST MATCH pipelineRunner.js fallback weights and threshold !!
# If you change these, update pipelineRunner.js runMlScoring fallback too.
GATE_THRESHOLD = 70

FEATURE_WEIGHTS = {
    "nb_critical":      15,
    "nb_high":           7,
    "nb_medium":         2,   # added (was missing in original fallback)
    "nb_critical_cves": 20,
    "nb_high_cves":     10,
    "max_cvss":          3,   # added (was missing in original fallback)
    "outdated_count":    0,   # low signal, keep at 0
    "nb_high_alerts":   10,
    "nb_medium_alerts":  2,   # added (was missing in original fallback)
    "nb_xss":            8,
    "nb_sqli":          12,
}

np.random.seed(RANDOM_SEED)


# ── Synthetic data generation ─────────────────────────────────────────────────

def _raw_score(row: dict) -> float:
    """Compute the rule-based risk score for a feature row."""
    return sum(row.get(f, 0) * w for f, w in FEATURE_WEIGHTS.items())


def generate_dataset(n: int = N_SAMPLES) -> pd.DataFrame:
    """
    Generate realistic synthetic pipeline scan results.

    Distribution notes:
    - We use a mix of exponential (most runs are clean) and occasionally
      higher values to simulate problematic pipelines.
    - A small 'noise' percentage (5%) randomly flips labels to teach the
      model that the boundary isn't perfectly crisp.
    """
    records = []

    for i in range(n):
        # SAST – most pipelines: few issues; some: many issues
        if i % 5 == 0:  # ~20 % "noisy" pipelines with more issues
            nb_critical = int(np.random.poisson(lam=2.5))
            nb_high     = int(np.random.poisson(lam=6.0))
            nb_medium   = int(np.random.poisson(lam=10.0))
        else:
            nb_critical = int(np.random.exponential(scale=0.8))
            nb_high     = int(np.random.exponential(scale=2.5))
            nb_medium   = int(np.random.exponential(scale=5.0))

        # SCA
        nb_critical_cves = int(np.random.exponential(scale=0.6))
        nb_high_cves     = int(np.random.exponential(scale=1.8))
        # CVSS: beta distribution; shift slightly higher than original to
        # generate more mid-range scores
        max_cvss         = round(np.random.beta(2.5, 4.0) * 10, 1)
        outdated_count   = int(np.random.exponential(scale=3.5))

        # DAST
        nb_high_alerts   = int(np.random.exponential(scale=1.2))
        nb_medium_alerts = int(np.random.exponential(scale=2.5))
        nb_xss           = int(np.random.exponential(scale=0.5))
        nb_sqli          = int(np.random.exponential(scale=0.25))

        row = {
            "nb_critical":      nb_critical,
            "nb_high":          nb_high,
            "nb_medium":        nb_medium,
            "nb_critical_cves": nb_critical_cves,
            "nb_high_cves":     nb_high_cves,
            "max_cvss":         max_cvss,
            "outdated_count":   outdated_count,
            "nb_high_alerts":   nb_high_alerts,
            "nb_medium_alerts": nb_medium_alerts,
            "nb_xss":           nb_xss,
            "nb_sqli":          nb_sqli,
        }

        raw = _raw_score(row)
        label = RISKY_LABEL if raw >= GATE_THRESHOLD else SAFE_LABEL

        # 5 % label noise to prevent overconfident decision boundary
        if np.random.random() < 0.05:
            label = 1 - label

        records.append({**row, "label": label})

    df = pd.DataFrame(records, columns=FEATURE_NAMES + ["label"])
    return df


# ── Model training ────────────────────────────────────────────────────────────

def _extract_importances(pipeline: Pipeline) -> dict:
    """Pull feature importances from the fitted estimator."""
    clf = pipeline.named_steps.get("clf")

    # Handle CalibratedClassifierCV wrapper
    if hasattr(clf, "estimator"):
        clf = clf.estimator
    if hasattr(clf, "base_estimator"):
        clf = clf.base_estimator

    if hasattr(clf, "coef_"):
        coefs = clf.coef_[0].tolist()
        return {name: round(float(c), 4) for name, c in zip(FEATURE_NAMES, coefs)}

    if hasattr(clf, "feature_importances_"):
        fi = clf.feature_importances_.tolist()
        return {name: round(float(v), 4) for name, v in zip(FEATURE_NAMES, fi)}

    return {}


def train(df: pd.DataFrame):
    X = df[FEATURE_NAMES]
    y = df["label"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=RANDOM_SEED, stratify=y
    )

    candidates = {
        "LogisticRegression": Pipeline([
            ("scaler", StandardScaler()),
            ("clf",    LogisticRegression(
                max_iter=1000,
                random_state=RANDOM_SEED,
                class_weight="balanced",
                C=1.0,
            )),
        ]),
        "GradientBoosting": Pipeline([
            ("scaler", StandardScaler()),
            ("clf",    GradientBoostingClassifier(
                n_estimators=200,
                max_depth=3,
                learning_rate=0.05,
                subsample=0.8,
                random_state=RANDOM_SEED,
            )),
        ]),
    }

    results = {}
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=RANDOM_SEED)

    print("\n=== Training Results ===")
    for name, pipe in candidates.items():
        pipe.fit(X_train, y_train)

        y_pred  = pipe.predict(X_test)
        y_proba = pipe.predict_proba(X_test)[:, 1]

        f1  = f1_score(y_test, y_pred, average="binary")
        auc = roc_auc_score(y_test, y_proba)
        cv_auc = cross_val_score(pipe, X, y, cv=cv, scoring="roc_auc").mean()

        results[name] = {"pipeline": pipe, "f1": f1, "auc": auc, "cv_auc": cv_auc}

        print(f"\n--- {name} ---")
        print(f"  F1 Score     : {f1:.4f}")
        print(f"  AUC-ROC      : {auc:.4f}")
        print(f"  CV AUC-ROC   : {cv_auc:.4f}")
        print(classification_report(y_test, y_pred, target_names=["safe", "risky"]))

    best_name = max(results, key=lambda n: results[n]["cv_auc"])
    best      = results[best_name]
    print(f"\n=== Best model: {best_name} (CV AUC={best['cv_auc']:.4f}) ===\n")

    importances = _extract_importances(best["pipeline"])
    print("Feature importances:")
    for feat, val in sorted(importances.items(), key=lambda x: -abs(x[1])):
        print(f"  {feat:20s} : {val:+.4f}")

    return best["pipeline"], best_name, best["f1"], best["auc"], importances


# ── Persist model + metadata ──────────────────────────────────────────────────

def save(pipeline: Pipeline, algorithm: str, f1: float, auc: float, importances: dict):
    """Save model and metadata atomically (write to temp then rename)."""

    # Model file
    tmp_model = MODEL_PATH + ".tmp"
    joblib.dump(pipeline, tmp_model)
    os.replace(tmp_model, MODEL_PATH)
    print(f"\nModel saved → {MODEL_PATH}")

    # Metadata
    info = {
        "version":             "1.0.0",
        "algorithm":           algorithm,
        "features":            FEATURE_NAMES,
        "feature_importances": importances,
        "f1_score":            round(f1, 4),
        "auc_roc":             round(auc, 4),
        "training_samples":    N_SAMPLES,
        "threshold":           GATE_THRESHOLD,  # ← NEW: stored so model.py can read it
        "trained_at":          datetime.now(timezone.utc).isoformat(),
    }

    tmp_info = INFO_PATH + ".tmp"
    with open(tmp_info, "w") as f:
        json.dump(info, f, indent=2)
    os.replace(tmp_info, INFO_PATH)
    print(f"Model info saved → {INFO_PATH}")

    return info


# ── Entry point ───────────────────────────────────────────────────────────────

if __name__ == "__main__":
    print(f"Generating {N_SAMPLES} synthetic samples…")
    df = generate_dataset(N_SAMPLES)

    risky_count = int(df["label"].sum())
    safe_count  = N_SAMPLES - risky_count
    print(
        f"Dataset balance: {safe_count} safe "
        f"({safe_count / N_SAMPLES * 100:.0f}%)  ·  "
        f"{risky_count} risky ({risky_count / N_SAMPLES * 100:.0f}%)"
    )

    pipeline, algo, f1, auc, importances = train(df)
    info = save(pipeline, algo, f1, auc, importances)

    print("\n=== Done ===")
    print(f"  Algorithm  : {info['algorithm']}")
    print(f"  F1 Score   : {info['f1_score']}")
    print(f"  AUC-ROC    : {info['auc_roc']}")
    print(f"  Threshold  : {info['threshold']}")
    print(f"  Trained at : {info['trained_at']}")
    print(f"\nNext step: python app.py  (or docker compose up)")