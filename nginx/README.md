# SecOps Platform — Nginx Gateway

Central reverse proxy and security gateway for the SecOps Platform.

## 🛡️ Overview

Nginx acts as the entry point for all traffic, handling SSL termination, static file serving, and routing requests to the appropriate microservices (Frontend, Backend API, ML Service).

## ⚙️ Configuration

The configuration is located in `nginx.conf` and handles:

- **HTTP Redirection:** Automatically redirects all port 80 traffic to HTTPS (port 443).
- **SSL Termination:** Uses Let's Encrypt certificates for secure communication.
- **Routing:**
  - `/`: Proxies to the React Frontend (port 5173).
  - `/api/`: Proxies to the Express Backend (port 4000).
  - `/health`: Direct health check endpoint for the backend.
- **Security Headers:** Implements HSTS, X-Frame-Options, X-Content-Type-Options, and XSS Protection headers.
- **File Blocking:** Explicitly denies access to hidden files (e.g., `.git`, `.env`).

## 🚀 Docker Integration

When running via `docker-compose.yml`, the Nginx container:
1. Mounts the `nginx.conf` as a read-only volume.
2. Mounts Let's Encrypt certificates from the host machine.
3. Depends on the backend and frontend services being healthy before starting.

## 🛠️ Maintenance

To reload the configuration without stopping the container:
```bash
docker exec nginx nginx -s reload
```
