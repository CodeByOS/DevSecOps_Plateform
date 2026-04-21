# SecOps Platform — Backend API

Express.js REST API with MVC architecture for the SecOps Platform.

## Folder Structure

```
secops-backend/
├── config/
│   └── db.js                  # MongoDB connection
├── controllers/
│   ├── authController.js      # Register, login, logout, refresh
│   ├── projectController.js   # CRUD projects + team members
│   ├── pipelineController.js  # List, detail, override, stats
│   ├── webhookController.js   # GitHub webhook receiver
│   └── auditController.js     # Read-only audit trail
├── middleware/
│   ├── auth.js                # JWT protect + role authorize
│   └── errorHandler.js        # Central error handler
├── models/
│   ├── User.js                # Users with JWT methods
│   ├── Project.js             # Projects + gate config
│   ├── Pipeline.js            # Pipeline runs + steps
│   ├── ScanResult.js          # SAST / SCA / DAST / ML results
│   └── AuditLog.js            # Immutable audit trail
├── routes/
│   ├── authRoutes.js
│   ├── projectRoutes.js
│   ├── pipelineRoutes.js
│   ├── webhookRoutes.js
│   └── auditRoutes.js
├── utils/
│   ├── asyncHandler.js        # Wraps async controllers
│   ├── notifications.js       # Slack + email helpers
│   └── pipelineRunner.js      # Core pipeline orchestrator
├── .env.example
├── package.json
└── server.js                  # Entry point
```

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Copy and fill environment variables
cp .env.example .env

# 3. Start in development mode
npm run dev

# 4. Or start in production
npm start
```

## API Endpoints

### Auth
| Method | Endpoint             | Description              | Auth |
|--------|----------------------|--------------------------|------|
| POST   | /api/auth/register   | Register a new user      | No   |
| POST   | /api/auth/login      | Login and get tokens     | No   |
| POST   | /api/auth/refresh    | Refresh access token     | No   |
| POST   | /api/auth/logout     | Logout (invalidate token)| Yes  |
| GET    | /api/auth/me         | Get current user         | Yes  |

### Projects
| Method | Endpoint                              | Description           | Auth  |
|--------|---------------------------------------|-----------------------|-------|
| GET    | /api/projects                         | List projects         | Yes   |
| POST   | /api/projects                         | Create project        | Yes   |
| GET    | /api/projects/:id                     | Get project           | Yes   |
| PUT    | /api/projects/:id                     | Update project        | Yes   |
| DELETE | /api/projects/:id                     | Delete project        | Yes   |
| POST   | /api/projects/:id/members             | Add team member       | Yes   |
| DELETE | /api/projects/:id/members/:userId     | Remove team member    | Yes   |

### Pipelines
| Method | Endpoint                                       | Description         | Auth  |
|--------|------------------------------------------------|---------------------|-------|
| GET    | /api/projects/:projectId/pipelines             | List pipelines      | Yes   |
| GET    | /api/projects/:projectId/pipelines/stats       | Dashboard stats     | Yes   |
| GET    | /api/pipelines/:id                             | Pipeline + results  | Yes   |
| POST   | /api/pipelines/:id/override                    | Override gate       | Admin |

### Webhooks
| Method | Endpoint              | Description              | Auth           |
|--------|-----------------------|--------------------------|----------------|
| POST   | /api/webhooks/github  | GitHub push webhook      | HMAC signature |

### Audit
| Method | Endpoint    | Description       | Auth  |
|--------|-------------|-------------------|-------|
| GET    | /api/audit  | Get audit logs    | Yes   |

## GitHub Webhook Setup

1. Go to your GitHub repo → **Settings → Webhooks → Add webhook**
2. Set Payload URL to: `https://your-domain.com/api/webhooks/github`
3. Content type: `application/json`
4. Secret: copy the `webhookSecret` from your project (GET /api/projects/:id)
5. Events: select **Just the push event**

## Pipeline Flow

```
GitHub push
    │
    ▼
POST /api/webhooks/github
    │  (verify HMAC signature)
    │  (create Pipeline document)
    │  (respond 200 immediately)
    │
    ▼ [async - non-blocking]
pipelineRunner.js
    │
    ├─► SAST  (SonarQube API)
    ├─► SCA   (Dependency Check)
    ├─► DAST  (OWASP ZAP API)
    ├─► ML    (Flask /score endpoint)
    └─► Gate  (score vs threshold)
              │
              ├─ approved → Pipeline status: completed
              └─ blocked  → Pipeline status: blocked
                           → Slack + email notification
```

## Environment Variables

| Variable              | Description                            |
|-----------------------|----------------------------------------|
| PORT                  | Server port (default: 5000)            |
| MONGO_URI             | MongoDB connection string              |
| JWT_SECRET            | Secret for access tokens               |
| JWT_REFRESH_SECRET    | Secret for refresh tokens              |
| GITHUB_WEBHOOK_SECRET | Default webhook secret (overridden per project) |
| SONARQUBE_URL         | SonarQube base URL                     |
| SONARQUBE_TOKEN       | SonarQube API token                    |
| ZAP_URL               | OWASP ZAP daemon URL                   |
| ZAP_API_KEY           | ZAP API key                            |
| ML_SERVICE_URL        | Python Flask ML service URL            |
| SLACK_WEBHOOK_URL     | Slack incoming webhook URL             |
| SMTP_*                | Email (Nodemailer) configuration       |
