"""
model.py – Inference wrapper for the SecOps risk-scoring model.

Fixes applied vs original:
  - Score is now a calibrated 0-100 value using the raw decision function
    (log-odds) instead of raw probability, giving a better spread across
    the full range rather than a bimodal distribution.
  - Feature importances are read from the LIVE pipeline object (not just
    the JSON file), so they're always in sync with the loaded model.
  - Input values are clamped to a sane maximum (999) before inference to
    prevent edge-case score distortion.
  - Threshold is written to model_info.json by train.py and respected here.
  - load() returns True/False instead of raising, letting app.py decide
    whether to abort startup or degrade gracefully.
  - Thread-safety: a module-level lock guards model replacement during retrain.
"""

import os
import json
import threading
import joblib
import numpy as np
import pandas as pd

from features import FEATURE_NAMES

MODEL_PATH = os.environ.get("MODEL_PATH", "model.pkl")
INFO_PATH  = os.environ.get("INFO_PATH",  "model_info.json")

# Default gate threshold if not specified in model_info.json
DEFAULT_THRESHOLD = 70

_pipeline   = None
_model_info = {}
_lock       = threading.RLock()    # guards replacement during /retrain


# ── Load ──────────────────────────────────────────────────────────────────────

def load() -> bool:
    """
    Load (or reload) the model from disk.

    Returns True on success, False on failure.
    Thread-safe: holds _lock while swapping the global references.
    """
    global _pipeline, _model_info

    if not os.path.exists(MODEL_PATH):
        print(
            f"[Model] ERROR – model file not found: {MODEL_PATH}\n"
            f"        Run 'python train.py' first."
        )
        return False

    try:
        new_pipeline = joblib.load(MODEL_PATH)
    except Exception as exc:
        print(f"[Model] ERROR – failed to load model: {exc}")
        return False

    new_info = {}
    if os.path.exists(INFO_PATH):
        try:
            with open(INFO_PATH) as f:
                new_info = json.load(f)
        except Exception as exc:
            print(f"[Model] WARNING – could not read model_info.json: {exc}")

    # Enrich with live feature importances extracted from the pipeline itself
    new_info = _enrich_importances(new_pipeline, new_info)

    with _lock:
        _pipeline   = new_pipeline
        _model_info = new_info

    print(
        f"[Model] Loaded  : {MODEL_PATH}\n"
        f"[Model] Version : {_model_info.get('version', 'unknown')}\n"
        f"[Model] Algorithm: {_model_info.get('algorithm', 'unknown')}\n"
        f"[Model] Threshold: {_model_info.get('threshold', DEFAULT_THRESHOLD)}"
    )
    return True


def _enrich_importances(pipeline, info: dict) -> dict:
    """
    Extract feature importances / coefficients from the live sklearn pipeline
    and overwrite whatever was stored in model_info.json.
    This keeps the dashboard's feature-importance chart accurate after retrain.
    """
    try:
        clf = pipeline.named_steps.get("clf")
        if clf is None:
            return info

        if hasattr(clf, "coef_"):
            # LogisticRegression – coefficients (can be negative)
            coefs = clf.coef_[0].tolist()
            importances = {
                name: round(float(c), 4)
                for name, c in zip(FEATURE_NAMES, coefs)
            }
        elif hasattr(clf, "feature_importances_"):
            # RandomForest / GradientBoosting – always positive
            fi = clf.feature_importances_.tolist()
            importances = {
                name: round(float(v), 4)
                for name, v in zip(FEATURE_NAMES, fi)
            }
        else:
            return info

        info = {**info, "feature_importances": importances}
    except Exception as exc:
        print(f"[Model] WARNING – could not extract feature importances: {exc}")

    return info


# ── Predict ───────────────────────────────────────────────────────────────────

# Upper bound for any single feature (clamp to avoid score distortion)
_MAX_FEATURE_VALUE = 999.0


def predict(features: dict) -> dict:
    """
    Score a pipeline run.

    Parameters
    ----------
    features : dict
        Keys must match FEATURE_NAMES.  Missing keys default to 0.
        Values are clamped to [0, _MAX_FEATURE_VALUE].

    Returns
    -------
    dict with keys:
        score               int  0-100 (higher = riskier)
        probability         float 0.0-1.0
        label               "risky" | "safe"
        feature_importances dict
        model_version       str
        algorithm           str
        threshold           int
    """
    with _lock:
        pipeline  = _pipeline
        model_info = dict(_model_info)

    if pipeline is None:
        raise RuntimeError("Model not loaded – call model.load() first.")

    threshold = int(model_info.get("threshold", DEFAULT_THRESHOLD))

    # Build feature vector; clamp each value to a sane range
    row = []
    for name in FEATURE_NAMES:
        raw = features.get(name, 0)
        try:
            val = float(raw)
        except (TypeError, ValueError):
            val = 0.0
        val = max(0.0, min(val, _MAX_FEATURE_VALUE))
        row.append(val)

    X = pd.DataFrame([row], columns=FEATURE_NAMES)

    # Raw probability (class 1 = risky)
    probability = float(pipeline.predict_proba(X)[0][1])

    # ── Score calibration ────────────────────────────────────────────────────
    # Using raw probability gives a bimodal distribution for well-separated
    # classes: most samples score near 0 or near 100, with little in between.
    # Instead we use the decision function (log-odds = logit(p)) and map it
    # onto [0, 100] via a sigmoid-like stretch, giving a more uniform spread.
    #
    # For LogisticRegression the decision function IS available.
    # For tree-based models (RF, GBT) we fall back to the probability directly
    # but apply a mild power transform to spread the distribution.

    clf = pipeline.named_steps.get("clf")
    if hasattr(clf, "decision_function"):
        # Logistic Regression path
        decision = float(pipeline.decision_function(X)[0])
        # Map log-odds to [0, 100].
        # logit = 0 → p = 0.5 → score = 50 (boundary).
        # We use a scale factor so that logit ±4 maps roughly to 0/100.
        SCALE = 4.0
        clamped = max(-SCALE, min(decision, SCALE))
        score = int(round((clamped / SCALE + 1) / 2 * 100))
    else:
        # Tree-based model path: apply square-root stretch to spread mid-range
        score = int(round(probability ** 0.7 * 100))

    # Final safety clamp
    score = max(0, min(score, 100))

    label = "risky" if score >= threshold else "safe"

    return {
        "score":               score,
        "probability":         round(probability, 4),
        "label":               label,
        "feature_importances": model_info.get("feature_importances", {}),
        "model_version":       model_info.get("version", "unknown"),
        "algorithm":           model_info.get("algorithm", "unknown"),
        "threshold":           threshold,
    }


# ── Metadata ──────────────────────────────────────────────────────────────────

def get_info() -> dict:
    """Return a copy of the current model metadata."""
    with _lock:
        return dict(_model_info)