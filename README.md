# Odoo_fleetflow
# FleetFlow

**Fleet & Logistics Management System** — built for the Odoo Hackathon 2026.

End-to-end fleet operations: vehicle lifecycle, trip dispatch, driver compliance, maintenance scheduling, and financial reporting — in a single lightweight stack.

---

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | React + TypeScript + Vite | Fast HMR, strict typing |
| Styling | Vanilla CSS (custom design system) | Zero runtime overhead, full control |
| State | Zustand | Minimal boilerplate, no context hell |
| Routing | React Router v6 | Nested routes map cleanly to the layout |
| Backend | Node.js + Express | Thin, fast, easy to reason about |
| Database | SQLite (via better-sqlite3) | Zero-config, embedded, good enough for scope |
| Auth | JWT (httpOnly-ready) + bcrypt | Stateless, portable |
| HTTP Client | Axios | Interceptors for auth token injection |

---

## Architecture

```
client/                         # React SPA
├── src/
│   ├── api/client.ts           # Axios instance — auth interceptors, 401 handling
│   ├── components/Layout.tsx   # Sidebar shell, theme toggle, auth-gated outlet
│   ├── pages/                  # One file per route, self-contained data fetching
│   ├── store/authStore.ts      # Zustand — user session, login/logout/register
│   └── globals.css             # Single CSS file — variables, dark mode, components

server/                         # Express API
├── routes/                     # /vehicles, /trips, /drivers, /maintenance, /expenses
├── middleware/auth.js           # JWT verification
└── db.js                       # SQLite connection + schema bootstrap
```

**Data flow is intentionally boring:** React page → Axios (with Bearer token) → Express route → SQLite → JSON response. No over-engineering.

---

## Features

- **Command Center** — KPI tiles (active fleet, maintenance alerts, utilization rate, pending cargo) with live filtering by type / status / region
- **Vehicle Registry** — full CRUD, capacity tracking, odometer, acquisition cost
- **Trip Dispatcher** — cargo weight validation against vehicle capacity, Draft → Dispatched → Completed lifecycle with odometer capture
- **Maintenance Logs** — service history per vehicle, auto-sets status to "In Shop" on log, next service scheduling
- **Expense & Fuel Logging** — per-trip fuel and misc costs, approval workflow, spend summaries
- **Driver Profiles** — license expiry warnings (60-day lookahead), safety scores, duty status, completion rates
- **Analytics** — fleet ROI, utilization rate, top vehicles by revenue, monthly P&L
- **Auth** — JWT-based login/signup with role support (Manager, Dispatcher, SafetyOfficer, FinancialAnalyst)
- **Dark / Light mode** — CSS variable-based, persisted to localStorage, system preference aware

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Install & Run

```bash
# Clone
git clone <repo-url>
cd fleetflow

# Install server deps
cd server
npm install

# Install client deps
cd ../client
npm install
```

```bash
# Run backend (from /server)
npm run dev
# Starts on http://localhost:3000

# Run frontend (from /client)
npm run dev
# Starts on http://localhost:5173
```

The SQLite database is created automatically on first server start — no migration step needed.

### Default Credentials

```
Email:    admin@fleetflow.com
Password: admin123
Role:     Manager
```

---
```

---

## What We'd Do With More Time

The current stack was chosen to ship fast within hackathon constraints. Here's what a production path looks like:

**Observability & Logging**

Right now logs go to stdout. The right move is a two-tier setup: recent operational logs in [ClickHouse](https://clickhouse.com/) for sub-second aggregation queries, with a background job that packages older logs into compressed files and ships them to S3 Glacier for cold archival. This keeps query performance tight without burning storage costs on hot data you'll never read again.

**Database**

SQLite is fine for this demo — it's synchronous, zero-config, and plenty fast for single-server workloads. Under write-heavy production load (concurrent trip dispatches, high-frequency odometer updates) you'd migrate to Postgres. The schema is intentionally relational so the migration is a port, not a rewrite. Connection pooling via `pg-pool`, read replicas for analytics queries.

**Storage Tiering**

Same philosophy as logs — hot data (active trips, current vehicle states) stays in Postgres, warm data (last 90 days of maintenance/expense history) stays queryable, cold data (archived trip records, old financials) moves to object storage. This is a solved problem with the right tooling, just not one worth solving in 8 hours.

**Auth**

httpOnly cookie instead of localStorage for the JWT, refresh token rotation, RBAC middleware that actually enforces role permissions per route rather than just storing the role string.

---

