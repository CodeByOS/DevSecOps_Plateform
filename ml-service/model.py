import os
import json
import joblib
import numpy as np
import pandas as pd
from features import FEATURE_NAMES

MODEL_PATH = os.environ.get("MODEL_PATH", "model.pkl")
INFO_PATH  = os.environ.get("INFO_PATH",  "model_info.json")

# Load at module import time
# This runs once when app.py does "from model import predict".
# Any error here will crash startup — which is intentional (fail fast).

_pipeline   = None
_model_info = {}


def load():
    global _pipeline, _model_info

    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError(
            f"Model file not found: {MODEL_PATH}\n"
            f"Run 'python train.py' first to generate it."
        )

    _pipeline = joblib.load(MODEL_PATH)
    print(f"[Model] Loaded: {MODEL_PATH}")

    if os.path.exists(INFO_PATH):
        with open(INFO_PATH) as f:
            _model_info = json.load(f)
        print(f"[Model] Version: {_model_info.get('version')} | Algorithm: {_model_info.get('algorithm')}")
    else:
        _model_info = {"version": "unknown", "algorithm": "unknown"}


def predict(features: dict) -> dict:
    """
    Takes a dict of feature values, returns a risk score (0–100)
    plus probability and feature importances.

    Args:
        features: dict with keys matching FEATURE_NAMES

    Returns:
        {
          "score":               int (0-100),
          "probability":         float (0.0-1.0),
          "label":               "risky" | "safe",
          "feature_importances": dict,
          "model_version":       str,
          "algorithm":           str,
        }
    """
    if _pipeline is None:
        raise RuntimeError("Model not loaded. Call model.load() first.")

    # Build the feature vector as a DataFrame to preserve column names
    # (avoids sklearn warning about feature name mismatch)
    X = pd.DataFrame([[features.get(name, 0) for name in FEATURE_NAMES]], columns=FEATURE_NAMES)

    # Probability that this pipeline is "risky" (class 1)
    probability = float(_pipeline.predict_proba(X)[0][1])

    # Convert probability to a 0-100 risk score
    # We use a slight amplification to spread scores across the full range
    score = min(100, int(round(probability * 100)))

    label = "risky" if score >= _model_info.get("threshold", 70) else "safe"

    return {
        "score":               score,
        "probability":         round(probability, 4),
        "label":               label,
        "feature_importances": _model_info.get("feature_importances", {}),
        "model_version":       _model_info.get("version", "unknown"),
        "algorithm":           _model_info.get("algorithm", "unknown"),
    }


def get_info() -> dict:
    """Returns all metadata about the currently loaded model."""
    return _model_info
