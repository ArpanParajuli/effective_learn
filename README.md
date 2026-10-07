# EffectiveLearn 🧠

**EffectiveLearn** is a production-grade, full-stack platform engineered to maximize knowledge retention and study efficiency. By combining **Spaced Repetition (SRS via SuperMemo SM-2 / FSRS principles)**, **Active Recall**, and structured **Knowledge Roadmaps**, EffectiveLearn transforms passive studying into active, permanent mastery.

---

## 🏛 Architecture Overview

### Backend (.NET 10 LTS Clean Architecture)
* **Domain Layer** (`backend/src/EffectiveLearn.Domain`):
  * Aggregate roots: `Deck`, `Flashcard`, `StudySessionLog`.
  * Encapsulated domain logic: SM-2 algorithm calculating interval progression, ease factors, and card states (`New`, `Learning`, `Review`, `Mastered`).
* **Application Layer** (`backend/src/EffectiveLearn.Application`):
  * CQRS pattern mediated by `MediatR`.
  * Automated validation pipeline with `FluentValidation`.
  * Decoupled interfaces (`IApplicationDbContext`).
* **Infrastructure Layer** (`backend/src/EffectiveLearn.Infrastructure`):
  * PostgreSQL 17 integration via Entity Framework Core 10 (`Npgsql.EntityFrameworkCore.PostgreSQL`).
  * Automatic migration and development seeding.
* **API Layer** (`backend/src/EffectiveLearn.Api`):
  * RESTful endpoints with OpenAPI/Swagger.
  * Structured logging via `Serilog`.
  * RFC 7807 `ProblemDetails` global exception handling middleware.
  * Health probes at `/health/live` and `/health/ready`.

### Frontend (Vite + React 19 + TypeScript + Tailwind CSS)
* **Design & Styling**:
  * Tailwind CSS v4 with bespoke dark-mode theme tokens.
  * `shadcn/ui` accessible UI primitives.
  * `lucide-react` iconography.
  * Sleek glassmorphism and micro-animations.
* **Scalable Feature-Sliced Structure**:
  * `src/features/overview`: Learning streaks, metrics, and daily review triggers.
  * `src/features/decks`: Deck catalog, search, tag filters, and deck creation modal.
  * `src/features/study`: Active Recall study deck session, flashcard flip mechanics, and SM-2 scoring controls.
  * `src/features/analytics`: Forgetting curve index, SRS memory stages, weekly review charts, and habit heatmaps.
* **Server State & Data Layer**:
  * TanStack Query v5 (`@tanstack/react-query`) with caching and optimistic updates.
  * Resilient Axios client with auth interceptors and error extraction.

---

## 🚀 Quick Start (Local Development)

### Prerequisites
* [.NET 10 SDK](https://dotnet.microsoft.com/download)
* [Node.js 24+](https://nodejs.org/) & `npm`
* [Docker Desktop](https://www.docker.com/) (optional for full container run)

### 1. Environment Setup
Copy the environment template and adjust any custom values:
```bash
cp .env.example .env
```

### 2. Run with Docker Compose (Recommended)
Launch PostgreSQL, .NET 10 API, and Nginx React frontend in isolated containers:
```bash
docker compose up --build
```
* **Frontend Web App**: [http://localhost:3000](http://localhost:3000)
* **Backend API**: [http://localhost:5000](http://localhost:5000)
* **API Health Check**: [http://localhost:5000/health/live](http://localhost:5000/health/live)
* **PostgreSQL**: `localhost:5432`

---

## 💻 Running Without Docker

### Run Backend
```bash
cd backend
dotnet restore EffectiveLearn.slnx
dotnet run --project src/EffectiveLearn.Api
```

### Run Tests
```bash
cd backend
dotnet test EffectiveLearn.slnx
```

### Run Frontend
```bash
cd frontend
npm install
npm run dev
```
The frontend dev server runs at [http://localhost:5173](http://localhost:5173) and proxies `/api` requests to the .NET backend.

---

## 🔒 Security & Secret Hygiene

1. **Zero Secret Leakage**:
   * All sensitive tokens, database passwords, and signing keys are read exclusively from environment variables.
   * Root `.gitignore` prevents any `.env`, `.suo`, `.user`, `bin/`, `obj/`, or `node_modules/` files from reaching version control.
2. **Hardened Docker Containers**:
   * Backend container executes under unprivileged `.NET` user (`USER app`).
   * Frontend serves static assets via `nginxinc/nginx-unprivileged:alpine-slim`.
   * Production Nginx enforces strict security headers (`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`).
3. **Automated CI Secret Scanning**:
   * GitHub Actions runs `gitleaks` on all commits and pull requests to prevent credential leaks.

---

## ⚙️ GitHub Actions CI/CD Pipeline

* **Continuous Integration (`.github/workflows/ci.yml`)**:
  * **Frontend**: Installs dependencies (`npm ci`), runs TypeScript compiler check (`tsc -b`), and verifies production bundle build.
  * **Backend**: Restores packages, builds in `Release` mode, runs unit tests with coverage reporting.
  * **Security**: Runs Gitleaks secret scanning across the repository history.
* **Continuous Deployment (`.github/workflows/cd.yml`)**:
  * Triggers on releases or pushes to `main`.
  * Builds multi-stage Docker images using GitHub Actions caching (`type=gha`).
  * Tags images with semantic versions and Git SHAs.
  * Pushes images to GitHub Container Registry (`ghcr.io`) using the scoped repository `GITHUB_TOKEN`.
