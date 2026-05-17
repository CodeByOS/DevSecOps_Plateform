# SecOps Platform - Backend

This is the backend service for the SecOps Platform, built with Node.js and Express. It provides a RESTful API for managing projects, executing security pipelines, and integrating with external security tools and ML services.

## 🚀 Features

- **Authentication & Authorization**: Secure JWT-based authentication with refresh tokens stored in HTTP-only cookies.
- **Project Management**: CRUD operations for managing development projects.
- **Security Pipelines**: Orchestration of security scans (SAST, SCA, DAST).
- **Tool Integration**:
  - **SAST**: Static Application Security Testing.
  - **SCA**: Software Composition Analysis.
  - **DAST**: Dynamic Application Security Testing (OWASP ZAP).
- **Webhook Integration**: GitHub webhook support for automated pipeline triggering.
- **ML Service Integration**: Connection to a Python-based ML service for advanced vulnerability analysis.
- **Notifications**: Support for Slack and Email notifications.
- **Audit Logging**: Comprehensive logging of system activities.
- **Security**: Implementation of security best practices using Helmet, CORS, and Rate Limiting.

## 🛠 Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (via Mongoose)
- **Security**: JWT, bcryptjs, helmet, express-rate-limit
- **Logging**: Morgan
- **Communication**: Axios, Nodemailer

## 📋 Prerequisites

- [Node.js](https://nodejs.org/) (v18+ recommended)
- [MongoDB](https://www.mongodb.com/) (Local or Atlas)

## 🔧 Installation

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   Copy the `.env.example` file to `.env` and update the values with your local configuration.
   ```bash
   cp .env.example .env
   ```

## 🚦 Running the Application

- **Development Mode** (with auto-reload):
  ```bash
  npm run dev
  ```

- **Production Mode**:
  ```bash
  npm start
  ```

The server will be available at `http://localhost:4000` (by default).
Health check endpoint: `http://localhost:4000/health`

## 📂 Project Structure

- `src/server.js`: Application entry point.
- `src/config/`: Configuration files (Database, etc.).
- `src/controllers/`: Request handlers for different routes.
- `src/models/`: Mongoose schemas and models.
- `src/routes/`: API route definitions.
- `src/middleware/`: Custom middleware (Auth, Error Handling).
- `src/utils/`: Helper functions and services.
  - `src/utils/services/`: Specific services for SAST, SCA, DAST, etc.

## 🔒 Security Note

Ensure `JWT_SECRET` and other sensitive keys in your `.env` file are kept secure and never committed to version control.
