# SecOps Platform — Frontend

A modern, responsive dashboard for DevSecOps orchestration, built with React and Tailwind CSS.

## 🚀 Overview

The frontend serves as the primary interface for users to manage security pipelines, visualize risk assessments, and configure security gates. It features a high-performance "Glassmorphism" UI design with real-time status updates.

## 🛠️ Tech Stack

- **Framework:** React 18 (Vite)
- **Styling:** Tailwind CSS + Vanilla CSS (Custom Glassmorphism)
- **State Management:** Custom Context API & Hooks
- **Icons:** Lucide-React
- **Animations:** Framer Motion
- **Charts:** Recharts

## 📁 Folder Structure

- `src/api/`: Axios client and service-specific API calls.
- `src/components/`: Reusable UI components (Cards, Modals, Gauges, Layout).
- `src/context/`: Auth and Toast providers for global state.
- `src/hooks/`: Custom React hooks for data fetching and UI logic.
- `src/pages/`: Main application views (Dashboard, Pipelines, Project Details).

## ⚡ Key Features

- **Unified Dashboard:** Real-time visualization of pipeline health and security posture.
- **Pipeline Execution:** Detailed breakdown of SAST (Semgrep), SCA, and DAST (ZAP) scans.
- **Project Management:** Configure GitHub webhooks and risk thresholds per project.
- **Security Gating:** Visualize ML-based risk scores and perform administrative overrides.

## 🛠️ Setup & Development

```bash
# 1. Install dependencies
npm install

# 2. Start development server
npm run dev
```

The app will be available at `http://localhost:5173`.
