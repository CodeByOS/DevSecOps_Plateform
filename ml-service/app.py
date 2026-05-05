import os
from flask import Flask, request, jsonify
import model
from features import FEATURE_NAMES

app = Flask(__name__)

model.load()


# GET /health 
# Used by Docker Compose healthcheck and the Node.js circuit breaker.
@app.route("/health", methods=["GET"])
def health():
    info = model.get_info()
    return jsonify({
        "status":        "ok",
        "model_version": info.get("version", "unknown"),
        "algorithm":     info.get("algorithm", "unknown"),
    }), 200


# GET /model-info
# Returns full model metadata shown in the SecOps dashboard ML tab.
@app.route("/model-info", methods=["GET"])
def model_info():
    return jsonify(model.get_info()), 200


# POST /score 
# Main scoring endpoint called by pipelineRunner.js after each pipeline run.
#
# Request body:
# {
#   "features": {
#     "nb_critical":      2,
#     "nb_high":          5,
#     "nb_medium":        8,
#     "nb_critical_cves": 1,
#     "nb_high_cves":     3,
#     "max_cvss":         9.1,
#     "outdated_count":   4,
#     "nb_high_alerts":   2,
#     "nb_medium_alerts": 3,
#     "nb_xss":           1,
#     "nb_sqli":          0
#   }
# }
#
# Response:
# {
#   "score":               78,
#   "probability":         0.782,
#   "label":               "risky",
#   "feature_importances": { "nb_critical": 0.42, ... },
#   "model_version":       "1.0.0",
#   "algorithm":           "LogisticRegression"
# }
@app.route("/score", methods=["POST"])
def score():
    body = request.get_json(silent=True)

    # Validate request body
    if not body:
        return jsonify({"error": "Request body must be JSON"}), 400

    features = body.get("features")
    if not features or not isinstance(features, dict):
        return jsonify({"error": "'features' key is required and must be an object"}), 400

    # Validate and coerce each feature
    # Missing features default to 0 (safe assumption).
    # Non-numeric values are rejected.
    clean = {}
    for name in FEATURE_NAMES:
        raw = features.get(name, 0)
        try:
            val = float(raw)
            if val < 0:
                return jsonify({"error": f"Feature '{name}' must be >= 0, got {val}"}), 400
            clean[name] = val
        except (TypeError, ValueError):
            return jsonify({"error": f"Feature '{name}' must be a number, got '{raw}'"}), 400

    # Run inference
    try:
        result = model.predict(clean)
        return jsonify(result), 200
    except Exception as e:
        print(f"[Score] Inference error: {e}")
        return jsonify({"error": "Scoring failed", "detail": str(e)}), 500


# POST /retrain
# Re-trains the model using a new labeled dataset provided in the request.
# Called manually by an admin from the SecOps dashboard.
#
# Request body:
# {
#   "samples": [
#     { "features": { "nb_critical": 2, ... }, "label": 1 },
#     { "features": { "nb_critical": 0, ... }, "label": 0 },
#     ...
#   ]
# }
@app.route("/retrain", methods=["POST"])
def retrain():
    body = request.get_json(silent=True)

    if not body:
        return jsonify({"error": "Request body must be JSON"}), 400

    samples = body.get("samples", [])

    if len(samples) < 50:
        return jsonify({"error": "At least 50 samples are required to retrain"}), 400

    # Parse samples
    import numpy as np
    from sklearn.linear_model import LogisticRegression
    from sklearn.preprocessing import StandardScaler
    from sklearn.pipeline import Pipeline
    import joblib
    import json
    from datetime import datetime

    X_rows, y_rows = [], []

    for i, s in enumerate(samples):
        feats = s.get("features", {})
        label = s.get("label")

        if label not in (0, 1):
            return jsonify({"error": f"Sample {i}: label must be 0 or 1"}), 400

        row = [float(feats.get(name, 0)) for name in FEATURE_NAMES]
        X_rows.append(row)
        y_rows.append(int(label))

    X = np.array(X_rows)
    y = np.array(y_rows)

    # Train new pipeline
    new_pipeline = Pipeline([
        ("scaler", StandardScaler()),
        ("clf",    LogisticRegression(max_iter=500, class_weight="balanced")),
    ])
    new_pipeline.fit(X, y)

    # Save new model
    # Bump version number based on current version
    current_info = model.get_info()
    current_version = current_info.get("version", "1.0.0")
    parts = current_version.split(".")
    new_version = f"{parts[0]}.{parts[1]}.{int(parts[2]) + 1}"

    joblib.dump(new_pipeline, "model.pkl")

    coefs = new_pipeline.named_steps["clf"].coef_[0]
    importances = dict(zip(FEATURE_NAMES, [round(float(c), 4) for c in coefs]))

    new_info = {
        **current_info,
        "version":             new_version,
        "feature_importances": importances,
        "training_samples":    len(samples),
        "trained_at":          datetime.utcnow().isoformat() + "Z",
    }

    with open("model_info.json", "w") as f:
        json.dump(new_info, f, indent=2)

    # Reload model in memory
    model.load()

    return jsonify({
        "success": True,
        "new_version": new_version,
        "samples_used": len(samples),
    }), 200


# Run
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5001))
    debug = os.environ.get("FLASK_ENV") == "development"
    print(f"[App] Starting ML service on port {port} (debug={debug})")
    app.run(host="0.0.0.0", port=port, debug=debug)
