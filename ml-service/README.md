# SecOps Platform — ML Service

Python-based microservice for security risk scoring and vulnerability prediction using Machine Learning.

## 🧠 Overview

This service evaluates the risk of a pipeline execution based on findings from SAST, SCA, and DAST scans. It provides a probability score that is used by the backend to automatically block or approve deployments.

## 🛠️ Tech Stack

- **Language:** Python 3.10
- **Framework:** Flask
- **ML Libraries:** Scikit-Learn, NumPy, Joblib
- **Algorithm:** Logistic Regression (with balanced class weights)

## 📡 API Endpoints

- `POST /score`: Calculates a risk score (0-100) based on input features (vulnerability counts, CVSS scores, etc.).
- `POST /retrain`: Triggers a background retraining job with new labeled samples.
- `GET /retrain/status`: Polls the status of the current or last retraining job.
- `GET /model-info`: Returns metadata about the current model (version, algorithm, feature importances).
- `GET /health`: Basic health check.

## 🔬 ML Model

The model is a `LogisticRegression` pipeline that includes:
1. **StandardScaler**: Normalizes input counts and scores.
2. **Classifier**: Predicts the probability of a "High Risk" event.

### Features Weighted:
- Critical/High vulnerabilities (SAST)
- Critical/High CVEs (SCA)
- High/Medium alerts (DAST)
- Max CVSS scores
- Specific attack types (XSS, SQLi)

## 🚀 Setup & Development

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Train the initial model (if model.pkl is missing)
python train.py

# 3. Start the service
python app.py
```

The service runs on port `5001` by default.
