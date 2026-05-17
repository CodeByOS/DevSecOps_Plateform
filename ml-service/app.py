"""
app.py – Flask ML service for SecOps risk scoring.

Fixes applied vs original:
  - Startup: load() failure logs a warning instead of crashing gunicorn workers;
    the /score endpoint returns 503 until the model is available.
  - /retrain runs in a background thread so the HTTP response is immediate;
    status can be polled via /retrain/status.
  - Input values are validated and clamped (no upper bound was enforced before).
  - /score returns a 503 (not 500) when the model hasn't loaded yet.
  - Thread-safe model reload after retrain using the lock in model.py.
"""

import os
import json
import threading
import numpy as np
from datetime import datetime, timezone
from flask import Flask, request, jsonify

import model
from features import FEATURE_NAMES

app = Flask(__name__)

# Attempt to load the model at startup; log but don't crash if missing.
_model_ready = model.load()
if not _model_ready:
    print("[App] WARNING – model not loaded at startup. "
          "Run 'python train.py' then restart the service.")

# ── Retrain state (for non-blocking retrain) ──────────────────────────────────
_retrain_lock   = threading.Lock()
_retrain_status = {"running": False, "result": None, "error": None}


# ── Routes ────────────────────────────────────────────────────────────────────

@app.route("/health", methods=["GET"])
def health():
    info = model.get_info()
    status = "ok" if _model_ready else "degraded"
    return jsonify({
        "status":        status,
        "model_loaded":  _model_ready,
        "model_version": info.get("version", "unknown"),
        "algorithm":     info.get("algorithm", "unknown"),
    }), 200 if _model_ready else 503


@app.route("/model-info", methods=["GET"])
def model_info():
    return jsonify(model.get_info()), 200


@app.route("/score", methods=["POST"])
def score():
    if not _model_ready and model.get_info().get("version") == "unknown":
        return jsonify({
            "error": "ML model is not loaded. "
                     "The service will retry automatically; use the rule-based fallback for now."
        }), 503

    body = request.get_json(silent=True)
    if not body:
        return jsonify({"error": "Request body must be JSON"}), 400

    features = body.get("features")
    if not features or not isinstance(features, dict):
        return jsonify({"error": "'features' must be a non-empty object"}), 400

    # Validate, coerce and clamp each feature
    MAX_VAL = 999.0
    clean = {}
    for name in FEATURE_NAMES:
        raw = features.get(name, 0)
        try:
            val = float(raw)
        except (TypeError, ValueError):
            return jsonify({"error": f"Feature '{name}' must be numeric, got '{raw}'"}), 400
        if val < 0:
            return jsonify({"error": f"Feature '{name}' must be >= 0, got {val}"}), 400
        clean[name] = min(val, MAX_VAL)

    try:
        result = model.predict(clean)
        return jsonify(result), 200
    except RuntimeError as exc:
        return jsonify({"error": str(exc)}), 503
    except Exception as exc:
        print(f"[Score] Unexpected inference error: {exc}")
        return jsonify({"error": "Scoring failed", "detail": str(exc)}), 500


@app.route("/retrain", methods=["POST"])
def retrain():
    """
    Kick off a background retraining job.
    Returns immediately with 202 Accepted.
    Poll /retrain/status to check progress.
    """
    with _retrain_lock:
        if _retrain_status["running"]:
            return jsonify({"error": "A retrain job is already running"}), 409

        body = request.get_json(silent=True)
        if not body:
            return jsonify({"error": "Request body must be JSON"}), 400

        samples = body.get("samples", [])
        if len(samples) < 50:
            return jsonify({"error": "At least 50 labeled samples are required"}), 400

        _retrain_status["running"] = True
        _retrain_status["result"]  = None
        _retrain_status["error"]   = None

    thread = threading.Thread(target=_run_retrain, args=(samples,), daemon=True)
    thread.start()

    return jsonify({"message": "Retraining started", "poll": "/retrain/status"}), 202


@app.route("/retrain/status", methods=["GET"])
def retrain_status():
    with _retrain_lock:
        status = dict(_retrain_status)
    return jsonify(status), 200


# ── Background retrain worker ─────────────────────────────────────────────────

def _run_retrain(samples: list):
    """
    Runs in a daemon thread.  Re-trains a LogisticRegression on the provided
    samples, saves the model, then hot-reloads it into model.py.
    """
    global _model_ready

    try:
        import joblib
        from sklearn.linear_model  import LogisticRegression
        from sklearn.preprocessing import StandardScaler
        from sklearn.pipeline      import Pipeline

        # Parse samples
        X_rows, y_rows = [], []
        for i, s in enumerate(samples):
            feats = s.get("features", {})
            label = s.get("label")
            if label not in (0, 1):
                raise ValueError(f"Sample {i}: label must be 0 or 1, got {label!r}")
            row = [float(feats.get(name, 0)) for name in FEATURE_NAMES]
            X_rows.append(row)
            y_rows.append(int(label))

        X = np.array(X_rows)
        y = np.array(y_rows)

        new_pipeline = Pipeline([
            ("scaler", StandardScaler()),
            ("clf",    LogisticRegression(
                max_iter=1000,
                class_weight="balanced",
                random_state=42,
            )),
        ])
        new_pipeline.fit(X, y)

        # Bump patch version
        current  = model.get_info()
        parts    = current.get("version", "1.0.0").split(".")
        new_ver  = f"{parts[0]}.{parts[1]}.{int(parts[2]) + 1}"

        # Extract importances from live model
        clf    = new_pipeline.named_steps["clf"]
        coefs  = clf.coef_[0].tolist()
        importances = {
            name: round(float(c), 4)
            for name, c in zip(FEATURE_NAMES, coefs)
        }

        new_info = {
            **current,
            "version":             new_ver,
            "algorithm":           "LogisticRegression",
            "feature_importances": importances,
            "training_samples":    len(samples),
            "trained_at":          datetime.now(timezone.utc).isoformat(),
            # Preserve the threshold from the previous model
            "threshold":           current.get("threshold", 70),
        }

        # Atomic save
        import tempfile, os
        tmp_model = "model.pkl.tmp"
        tmp_info  = "model_info.json.tmp"
        joblib.dump(new_pipeline, tmp_model)
        os.replace(tmp_model, "model.pkl")
        with open(tmp_info, "w") as f:
            json.dump(new_info, f, indent=2)
        os.replace(tmp_info, "model_info.json")

        # Hot-reload into model.py
        _model_ready = model.load()

        with _retrain_lock:
            _retrain_status["running"] = False
            _retrain_status["result"]  = {
                "new_version":  new_ver,
                "samples_used": len(samples),
                "trained_at":   new_info["trained_at"],
            }

    except Exception as exc:
        print(f"[Retrain] ERROR: {exc}")
        with _retrain_lock:
            _retrain_status["running"] = False
            _retrain_status["error"]   = str(exc)


# ── Main ──────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    port  = int(os.environ.get("PORT", 5001))
    debug = os.environ.get("FLASK_ENV") == "development"
    print(f"[App] Starting ML service on :{port} (debug={debug})")
    app.run(host="0.0.0.0", port=port, debug=debug)