# Episode 0 — Foundation, RBAC Scope, Mock Auth, and Role-Scoped Documents

## Objective
Build a stable baseline for the Secure Enterprise AI platform with:
- Backend + Frontend running locally
- PostgreSQL + pgvector ready
- Alembic migrations working
- Seeded RBAC data
- Mock authentication and role-based document access
- Initial CI workflows

---

## Completed Work

### 0.1 — RBAC scope and seed document structure
- Defined 3 roles: `developer`, `hr`, `finance`
- Created role-based seed directories:
  - `data/seed_documents/developer/`
  - `data/seed_documents/hr/`
  - `data/seed_documents/finance/`
- Added architecture note for RBAC matrix.

### 0.4 — Core SQLAlchemy models
- Added core models:
  - `Role`
  - `User`
  - `Document`
  - `DocumentChunk`
- Added model registry/import wiring.

### 0.5 — Alembic + pgvector migration baseline
- Initialized Alembic in `backend/alembic/`
- Generated and applied initial schema migration
- Confirmed tables:
  - `roles`
  - `users`
  - `documents`
  - `document_chunks`
  - `alembic_version`
- Confirmed extension `vector` enabled in PostgreSQL.

### 0.6 — Idempotent seed data
- Added seed script and executed successfully
- Seed is rerunnable (no duplication)
- Seeded:
  - 3 roles
  - 3 users
  - 18 role-scoped document records (6 per role)

### 0.7 / 0.8 — API + Frontend integration
- Backend endpoints operational:
  - `POST /api/v1/auth/mock-login`
  - `GET /api/v1/me`
  - `GET /api/v1/documents`
  - `GET /health/db`
- Frontend:
  - Mock login page
  - Dashboard with current user + role
  - Role-filtered documents display
- Fixed CORS between Vite (`localhost:5173`) and FastAPI (`127.0.0.1:8000`)
- Fixed type-only imports in TS (`import type { ... }`) and API error rendering.

### 0.9 — CI baseline
- Added GitHub Actions:
  - Backend CI (dependency install + app import smoke check)
  - Frontend CI (`npm ci` + `npm run build`)

---

## Validation Evidence

- Backend running on `http://127.0.0.1:8000`
- Swagger available at `/docs`
- Health DB response: `{"status":"ok","database":"reachable"}`
- Mock login succeeds for seeded users
- `/api/v1/me` returns authenticated user data
- `/api/v1/documents` returns documents filtered by role
- Frontend dashboard confirms user role and authorized documents
- Docker services up:
  - PostgreSQL (pgvector)
  - Adminer

---

## Known Limitations (Expected in Episode 0)
- Authentication is mock-based (no password hash flow yet)
- No real face recognition yet (planned next episodes)
- Documents are metadata-seeded; full ingestion/chunking pipeline comes next
- No production deployment pipeline yet (only baseline CI)

---

## Episode 0 Status
✅ **Completed**

## Suggested Tag
`v0.1.0-episode0`