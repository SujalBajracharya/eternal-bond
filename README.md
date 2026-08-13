# 💍 EternalBond — Matrimonial Platform

> A full-stack, production-ready matrimonial platform with AI-assisted matchmaking, real-time messaging, Stripe monetization, and Kundali compatibility matching.

---

## 📖 Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Running Locally](#running-locally)
- [Database Migrations](#database-migrations)
- [API Overview](#api-overview)
- [Monetization & Stripe](#monetization--stripe)
- [Admin Panel](#admin-panel)
- [Testing](#testing)
- [Deployment](#deployment)

---

## Overview

**EternalBond** is a modern matrimonial web application built for South Asian audiences. It combines traditional matchmaking with modern technology — offering Kundali (astrological) compatibility scoring, real-time chat, profile verification (KYC), and a tiered premium subscription system powered by Stripe.

The platform runs as two separate services:

| Service         | Technology                   | Port                    |
| --------------- | ---------------------------- | ----------------------- |
| **Frontend**    | React 18 + Vite + TypeScript | `8080`                  |
| **Backend API** | Spring Boot 3.3 + Java 17    | `8081`                  |
| **Database**    | PostgreSQL via Supabase      | Cloud / `54322` (local) |

---

## Tech Stack

### Frontend

| Tool                  | Purpose                 |
| --------------------- | ----------------------- |
| React 18 + TypeScript | UI framework            |
| Vite                  | Build tool & dev server |
| React Router v6       | Client-side routing     |
| TanStack Query v5     | Server state management |
| shadcn/ui + Radix UI  | Component library       |
| Tailwind CSS          | Styling                 |
| Framer Motion         | Animations              |
| Lucide React          | Icons                   |
| Sonner                | Toast notifications     |
| React Hook Form + Zod | Form validation         |

### Backend

| Tool                        | Purpose                |
| --------------------------- | ---------------------- |
| Spring Boot 3.3             | Web framework          |
| Spring Security + JJWT      | Authentication & JWT   |
| Spring Data JPA + Hibernate | ORM & database access  |
| PostgreSQL                  | Relational database    |
| WebSocket (STOMP)           | Real-time messaging    |
| Stripe Java SDK             | Payment processing     |
| OpenPDF                     | PDF receipt generation |
| Spring Boot Actuator        | Health monitoring      |
| Spring Mail                 | Email delivery         |
| Google OAuth2               | Social sign-in         |
| Lombok                      | Boilerplate reduction  |

### Infrastructure

| Tool           | Purpose                             |
| -------------- | ----------------------------------- |
| Supabase       | Managed PostgreSQL + Auth + Storage |
| Stripe         | Subscription payments & webhooks    |
| GitHub Actions | CI/CD                               |

---

## Features

### 👤 User Authentication

- Email/password registration & login (JWT-based)
- Email verification flow
- Google OAuth sign-in
- Password reset via email link
- Protected routes with role-based access

### 💑 Matchmaking

- Daily curated match discovery (`/today`)
- Like / skip swipe actions
- Advanced filters (age, religion, caste, location, height, etc.)
- Mutual match detection
- Undo-skip (premium entitlement)

### 💬 Real-time Chat

- WebSocket-powered messaging (STOMP)
- Match-based conversation threads
- Chat expiry system with extension entitlement
- Photo sharing within chats
- Report messages / photos

### 🔮 Kundali Compatibility

- Astrological matching via Free Astrology API
- 36-point Guna Milan score
- Create and view Kundali profiles
- Compatibility scores shown on match cards

### 🔔 Notifications

- Real-time system announcements (admin-broadcast)
- Personal purchase/payment notifications
- Read/unread tracking

### 💳 Monetization (Stripe)

- Three-tier subscription model (Free / Silver / Gold)
- One-time purchase items (reveal likes, undo-skip, chat extension)
- Stripe Checkout hosted sessions
- Webhook-driven entitlement provisioning
- Transaction receipt PDF generation & download
- Billing history page

### 🪪 Profile & KYC

- Multi-step onboarding wizard
- Photo upload & management
- KYC document verification (admin-reviewed)
- Profile boost entitlement

### 🛠️ Admin Panel (`/admin`)

- Dashboard analytics
- User management
- KYC review queue
- Photo moderation
- Report management
- Match & conversation monitoring
- Revenue tracking
- CMS (broadcast notifications)
- Filter configuration
- Badge management
- Audit logs
- Role management

---

## Project Structure

```
eternal-bond/
├── src/                          # Frontend (React)
│   ├── api/                      # API client functions
│   ├── components/               # Reusable UI components
│   │   ├── admin/
│   │   ├── auth/
│   │   ├── landing/
│   │   ├── matches/
│   │   ├── premium/
│   │   └── userSide/
│   ├── hooks/                    # Custom React hooks
│   ├── integrations/             # Auth guards, third-party integrations
│   ├── lib/                      # Utility functions
│   └── pages/                    # Route-level page components
│       ├── admin/                # Admin panel pages
│       └── *.tsx                 # User-facing pages
│
├── eternal-bond-backend/         # Backend (Spring Boot)
│   └── src/main/java/com/eternalbond/api/
│       ├── config/               # Security, WebSocket, CORS config
│       ├── controller/           # REST API controllers
│       ├── dto/                  # Data Transfer Objects
│       ├── model/                # JPA entity models
│       ├── repository/           # Spring Data JPA repositories
│       └── service/              # Business logic layer
│
├── supabase/
│   └── migrations/               # Ordered SQL migration files
│
├── postman/                      # Postman collection for API testing
├── .env.example                  # Frontend environment variable template
├── run_instructions.md           # Detailed local setup guide
└── vite.config.ts                # Vite configuration
```

---

## Prerequisites

Ensure the following are installed before running the project:

| Requirement    | Version | Check                                |
| -------------- | ------- | ------------------------------------ |
| Java JDK       | 17+     | `java -version`                      |
| Maven          | 3.8+    | `mvn -version`                       |
| Node.js        | 18+     | `node -v`                            |
| npm or Bun     | latest  | `npm -v` / `bun -v`                  |
| Docker Desktop | latest  | Required for local Supabase          |
| Supabase CLI   | latest  | `supabase --version`                 |
| Stripe CLI     | latest  | `stripe --version` (for webhook dev) |

---

## Environment Setup

### Frontend (`.env`)

Copy `.env.example` to `.env` and fill in your values:

```env
# Supabase
VITE_SUPABASE_URL="https://your-project-ref.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="your-anon-key"
VITE_SUPABASE_PROJECT_ID="your-project-id"

# Backend API
VITE_API_BASE_URL="http://localhost:8081"
```

### Backend (`eternal-bond-backend/.env` or environment variables)

The Spring Boot backend reads configuration from `application.properties` and can be overridden with environment variables:

```env
SUPABASE_DB_HOST=your-db-host
SUPABASE_DB_USER=postgres
SUPABASE_DB_PASSWORD=your-db-password
SUPABASE_JWT_SECRET=your-supabase-jwt-secret

STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

SPRING_MAIL_USERNAME=your-email@gmail.com
SPRING_MAIL_PASSWORD=your-app-password
```

---

## Running Locally

### 1. Database

**Option A — Supabase Cloud (Recommended):**

1. Create a project at [supabase.com](https://supabase.com)
2. Apply migrations via the Supabase SQL editor or CLI:
   ```bash
   supabase db push --db-url "YOUR_TRANSACTION_POOLING_CONNECTION_STRING"
   ```

**Option B — Local Supabase (Docker):**

```bash
# Start Docker Desktop, then:
supabase start
supabase db reset
```

---

### 2. Backend

```bash
cd eternal-bond-backend

# Windows PowerShell — set env vars
$env:SUPABASE_DB_HOST="db.your-project-ref.supabase.co"
$env:SUPABASE_DB_USER="postgres"
$env:SUPABASE_DB_PASSWORD="your-password"
$env:SUPABASE_JWT_SECRET="your-jwt-secret"

# Run the application
mvn clean spring-boot:run
```

The backend will start on **http://localhost:8081**.

To build a standalone JAR:

```bash
mvn clean package
java -jar target/api-0.0.1-SNAPSHOT.jar
```

---

### 3. Frontend

```bash
# From the project root
npm install       # or: bun install

npm run dev       # or: bun dev
```

The frontend will start on **http://localhost:8080**.

---

### 4. Stripe Webhooks (for local payment testing)

In a third terminal, forward Stripe events to your local backend:

```bash
stripe listen --forward-to localhost:8081/api/monetize/webhook
```

Copy the `whsec_...` webhook signing secret printed by the CLI and set it as `STRIPE_WEBHOOK_SECRET` in your backend environment.

---

## Database Migrations

All schema changes are managed as ordered SQL files in `supabase/migrations/`. Files are applied in chronological order by filename.

To apply new migrations to your local database:

```bash
supabase db reset
```

To apply to a remote Supabase project:

```bash
supabase db push --db-url "YOUR_CONNECTION_STRING"
```

---

## API Overview

The backend exposes a RESTful JSON API on port `8081`. All protected endpoints require a `Bearer` token in the `Authorization` header.

| Domain               | Base Path                                      | Auth Required         |
| -------------------- | ---------------------------------------------- | --------------------- |
| Authentication       | `/api/auth/**`                                 | No (public)           |
| User Profile         | `/api/profile/**`                              | Yes                   |
| Matches / Swipe      | `/api/matches/**`, `/api/swipe/**`             | Yes                   |
| Conversations & Chat | `/api/conversations/**`, `/api/messages/**`    | Yes                   |
| Notifications        | `/api/notifications/**`                        | Yes                   |
| Entitlements         | `/api/monetize/entitlements`                   | Yes                   |
| Payments / Checkout  | `/create-checkout-session`, `/api/monetize/**` | Yes                   |
| Transactions         | `/api/transactions/**`                         | Yes                   |
| Stripe Webhooks      | `/api/monetize/webhook`                        | No (Stripe signature) |
| Admin                | `/api/admin/**`                                | Yes (Admin role)      |
| Actuator / Health    | `/actuator/**`                                 | Configurable          |

A full Postman collection is available in the `postman/` directory.

---

## Monetization & Stripe

EternalBond uses a **three-tier** subscription model:

| Tier       | Description                                                  |
| ---------- | ------------------------------------------------------------ |
| **Free**   | Limited likes per day, no reveals                            |
| **Silver** | Increased daily likes, reveal likes, basic filters           |
| **Gold**   | Unlimited likes, all features, profile boost, Kundali access |

**One-time purchasable items:**

- Reveal a hidden liker
- Undo a skip
- Extend an expiring chat by 24 hours

Payments flow: Stripe Checkout Session → Stripe Webhook → `MonetizationService` → `user_entitlements` table.

---

## Admin Panel

Access the admin panel at `/admin` (requires the `ADMIN` role assigned in the database).

Key admin capabilities:

- **Dashboard** — platform overview metrics
- **Users** — view, search, manage all users
- **KYC** — review and approve/reject identity documents
- **Photos** — moderate user-uploaded photos
- **Reports** — handle content/user reports
- **Notifications (CMS)** — broadcast system-wide notifications
- **Revenue** — view payment history and Stripe revenue
- **Audit Logs** — track all admin actions

---

## Testing

### Frontend

```bash
npm run test          # Run all tests once
npm run test:watch    # Run tests in watch mode
```

### Backend

```bash
cd eternal-bond-backend
mvn test
```

Backend integration tests use an in-memory H2 database and do not require a live PostgreSQL instance.

---

## Deployment

> The project is designed to be deployed as two separate services.

**Frontend:** Build the static bundle and deploy to any static host (Vercel, Netlify, S3, etc.):

```bash
npm run build
# Output is in /dist
```

**Backend:** Build and deploy the JAR to any Java-compatible host (Railway, Render, EC2, etc.):

```bash
cd eternal-bond-backend
mvn clean package -DskipTests
# Deploy: target/api-0.0.1-SNAPSHOT.jar
```

Set all required environment variables on your hosting provider and ensure the `VITE_API_BASE_URL` in the frontend build points to your deployed backend URL.

---

## License

This project is a university final-year project. All rights reserved.
