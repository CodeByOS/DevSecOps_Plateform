# DevSecOps Platform

An integrated DevSecOps platform built to streamline secure software development pipelines. The platform features a React/Vite frontend, a Node.js/Express backend, and a Python Machine Learning service. It seamlessly integrates with industry-standard security tools like SonarQube and OWASP ZAP to provide continuous security analysis.

## Architecture

The system is composed of several microservices coordinated via Docker Compose:

- **Frontend:** React + Vite application styled with TailwindCSS, providing an intuitive dashboard for managing security pipelines, project configurations, and audit logs.
- **Backend:** Node.js + Express REST API managing users, authentication (JWT), GitHub webhook events, Slack notifications, and orchestration of security scans. Uses MongoDB Atlas as the primary database.
- **ML Service:** A Python (Flask + Scikit-Learn) service designed to run machine learning models, likely for threat detection, anomaly analysis, or security predictions.
- **Nginx:** Acts as a reverse proxy, routing traffic to the frontend and backend services.
- **SonarQube:** Integrated for Continuous Code Quality and Static Application Security Testing (SAST).
- **OWASP ZAP:** Integrated for Dynamic Application Security Testing (DAST) on web applications.

## Prerequisites

Before running the application, ensure you have the following installed:
- [Docker](https://docs.docker.com/get-docker/) & [Docker Compose](https://docs.docker.com/compose/install/)
- [Node.js](https://nodejs.org/) (v18+ recommended)
- [Python](https://www.python.org/) (v3.9+ recommended)

## Getting Started

### 1. Clone the repository

```bash
git clone <repository_url>
cd DevSecOps_Plateforme
```

### 2. Environment Variables

You need to set up `.env` files for the services. Look for sample `.env` files in the directories. Key configurations include:

**Backend (`backend/.env`):**
- `MONGO_URI`: MongoDB connection string.
- `JWT_SECRET`, `JWT_REFRESH_SECRET`: Secrets for JWT authentication.
- `SONARQUBE_URL`, `SONARQUBE_TOKEN`: Connection details for SonarQube.
- `ZAP_URL`, `ZAP_API_KEY`: Connection details for OWASP ZAP.
- `SLACK_WEBHOOK_URL`: Slack webhook for notifications.
- `SMTP_*`: Settings for email notifications.
- `GITHUB_WEBHOOK_SECRET`: Secret for securing GitHub webhooks.

### 3. Running with Docker Compose

You can launch the entire stack using Docker Compose:

```bash
# Start all core services in detached mode
docker-compose up -d
```

> **Note:** SonarQube and OWASP ZAP are configured not to restart automatically to save resources. You can run them manually when needed:
> ```bash
> docker-compose up -d sonarqube zap
> ```

## Services and Ports

When running locally, the services are mapped to the following ports:

| Service | Port | Description |
|---|---|---|
| **Nginx** | `80` | Main entry point routing to frontend/backend |
| **Frontend** | `5173` | React development server (if run directly) |
| **Backend** | `4000` | Node.js REST API |
| **ML Service** | `5001` | Flask API for Machine Learning |
| **SonarQube** | `9000` | Code quality and SAST dashboard |
| **OWASP ZAP** | `8090` | DAST API / proxy |

## Development Guide

If you wish to run services individually for development without Docker:

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Backend
```bash
cd backend
npm install
npm run dev
```

### ML Service
```bash
cd ml-service
python -m venv .venv
# Activate the environment
# Windows: .venv\Scripts\activate
# Linux/Mac: source .venv/bin/activate
pip install -r requirements.txt
python app.py # Or using flask run
```

## Features
- **Dashboard:** Interactive dashboard with data visualization using Recharts.
- **Pipeline Management:** Monitor security analysis pipelines from code push to deployment.
- **Vulnerability Scanning:** Automated SAST (SonarQube) and DAST (ZAP) integration.
- **AI-Powered Insights:** ML Service integration for intelligent security analytics.
- **Alerting & Notifications:** Slack and Email integrations for real-time alerts.

## License
MIT License
