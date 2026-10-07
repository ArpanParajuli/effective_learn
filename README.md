# EffectiveLearn 📖

**EffectiveLearn** is a production-grade, full-stack knowledge management and learning journal platform. It enables engineers, students, and writers to organize complex learning domains into **Subjects** and detailed **Chapters**, complete with embedded video lectures, website preview bookmarks, code snippets, and rich external links.

---

## ✨ Core Features

* **Hierarchical Learning Organization**:
  * **Subjects / Categories**: Organize by domain (e.g. *ASP.NET Core 10*, *System Design*, *PostgreSQL*, *DevOps*).
  * **Chapters & Articles**: Write modular notes and articles inside each subject with ordered chapter navigation.
* **Rich Embeds & Writing Canvas**:
  * 🎥 **Embedded Video Lectures**: Insert responsive video players (YouTube, Vimeo, HTML5 videos) directly inside articles with `[video:URL]`.
  * 🌐 **Website Preview Bookmarks**: Embed rich link cards with `[website:URL|Title]`.
  * 🔗 **Hyperlinks & Code**: Standard markdown links and syntax-highlighted code blocks with one-click copying.
  * 👁 **Authoring Tools**: Quick insert toolbar with real-time **Write**, **Preview**, and **Split View** modes.
* **Clean Human Design**:
  * Inspired by Notion, Canva, Substack, and Medium — minimal, readable, and distraction-free.
  * Native **Light & Dark Theme** toggle with persistent user preferences.
  * Accessible **shadcn/ui** components and crisp typography.

---

## 🏛 Architecture Overview

### Backend (.NET 10 LTS Clean Architecture)
* **Domain Layer** (`backend/src/EffectiveLearn.Domain`):
  * Entities: `Subject` (Categories) and `Chapter` (Rich articles/blogs with embeds).
* **Application Layer** (`backend/src/EffectiveLearn.Application`):
  * CQRS mediated by `MediatR` (`GetSubjectsQuery`, `GetChaptersBySubjectQuery`, `CreateChapterCommand`, etc.).
  * Automated validation pipeline with `FluentValidation`.
* **Infrastructure Layer** (`backend/src/EffectiveLearn.Infrastructure`):
  * PostgreSQL 17 persistence via Entity Framework Core 10 (`Npgsql.EntityFrameworkCore.PostgreSQL`).
  * Automated database schema migrations and initial seed data.
* **API Layer** (`backend/src/EffectiveLearn.Api`):
  * REST controllers (`SubjectsController`, `ChaptersController`).
  * RFC 7807 `ProblemDetails` exception handling middleware.
  * Serilog structured logging and Health Check probes (`/health/live`, `/health/ready`).

### Frontend (Vite + React 19 + TypeScript + Tailwind CSS)
* **Framework**: React 19 + TypeScript on Vite 8.
* **Styling**: Tailwind CSS v4 with clean neutral palette (no gamified purple glows), supporting both Light and Dark modes.
* **Components**: `shadcn/ui` UI primitives, `lucide-react` iconography, `sonner` notifications.
* **State & Server Cache**: TanStack Query v5 (`@tanstack/react-query`).
* **Rich Content Renderer**: Custom markdown and media embed parser supporting embedded YouTube lectures and website cards.

---

## 🚀 Quick Start (Local Development)

### 1. Environment Setup
```bash
cp .env.example .env
```

### 2. Run with Docker Compose
```bash
docker compose up --build
```
* **Frontend Web App**: [http://localhost:3000](http://localhost:3000)
* **Backend API**: [http://localhost:5000](http://localhost:5000)
* **API Health Check**: [http://localhost:5000/health/live](http://localhost:5000/health/live)

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

---

## 🔒 Security & CI/CD Pipelines

* **Zero Secret Leakage**:
  * All credentials injected via environment variables.
  * Git ignore rules prevent committing secrets, `node_modules`, or build artifacts.
* **Hardened Multi-Stage Containers**:
  * Backend runs under unprivileged non-root user (`USER app`).
  * Frontend served via unprivileged Nginx with security headers (`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`).
* **GitHub Actions CI/CD**:
  * `.github/workflows/ci.yml`: Automated TypeScript check, production build, .NET tests, and Gitleaks secret scan.
  * `.github/workflows/cd.yml`: Multi-stage Docker image build and push to GitHub Container Registry (`ghcr.io`).
