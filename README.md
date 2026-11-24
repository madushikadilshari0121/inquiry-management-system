# Customer Inquiry Management System

A small full-stack app for tracking customer inquiries. A staff member signs in, records an inquiry, finds it later and moves it through its lifecycle (**New → In Progress → Resolved**).

**Stack:** React (Vite) · Node.js + Express · PostgreSQL · Docker (for the database)

See [DECISIONS.md](./DECISIONS.md) for assumptions, design choices and trade-offs.

---

## Prerequisites

- **Node.js 18+** and npm
- **Docker Desktop** (runs PostgreSQL). Make sure it is open and the engine is running.

## Setup and run locally

### 1. Clone and start the database

```bash
git clone https://github.com/madushikadilshari0121/inquiry-management-system.git
cd inquiry-management-system
docker compose up -d
```

This starts PostgreSQL on **port 5433** and creates the tables from `backend/migrations/` on first run.

### 2. Backend (API on http://localhost:4000)

```bash
cd backend
npm install
cp .env.example .env        # Windows (PowerShell/cmd): copy .env.example .env
npm run seed                # creates test accounts and sample inquiries
npm run dev
```

> If `npm run seed` fails right after `docker compose up`, wait ~10 seconds for the database to finish starting and run it again.

### 3. Frontend (app on http://localhost:5173)

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173** and sign in with a test account.

## Test accounts

| Role  | Email                | Password  | Can see                                  |
|-------|----------------------|-----------|------------------------------------------|
| Admin | admin@example.com    | Admin@123 | All inquiries                            |
| Staff | staff1@example.com   | Staff@123 | Inquiries they created or are assigned to |
| Staff | staff2@example.com   | Staff@123 | Inquiries they created or are assigned to |

Seed data gives **staff1** two inquiries and **staff2** one, so the access rule can be checked by signing in as each user.

## Running tests

Backend (needs the database running and seeded):

```bash
cd backend
npm test
```

Frontend (no backend needed, the API is mocked):

```bash
cd frontend
npm test
```

`backend/api.http` contains manual API requests (VS Code REST Client extension) covering validation, access, invalid transitions and stale updates.

## API overview

All inquiry endpoints require a signed-in user (JWT in an httpOnly cookie).

| Method | Endpoint                      | Description                                   |
|--------|-------------------------------|-----------------------------------------------|
| POST   | `/api/auth/login`             | Sign in                                       |
| POST   | `/api/auth/logout`            | Sign out                                      |
| GET    | `/api/auth/me`                | Current user                                  |
| GET    | `/api/inquiries`              | List (`?status=NEW&search=text`)              |
| POST   | `/api/inquiries`              | Create                                        |
| GET    | `/api/inquiries/:id`          | Get one                                       |
| PATCH  | `/api/inquiries/:id/status`   | Change status (body: `{ status, version }`)   |

Errors always use the same shape:

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "Some fields are invalid", "details": [] } }
```

## Project structure

```
backend/
  migrations/      SQL schema (run automatically by Docker on first start)
  seeds/           Test users and sample data
  src/
    routes/        URL → middleware → controller
    controllers/   Read the request, send the response
    services/      Business rules (access, status transitions, duplicates, locking)
    middleware/    Auth, validation, error handling
    validation/    Zod schemas
  tests/           Jest + Supertest
frontend/
  src/
    api/           Fetch wrapper and API functions
    auth/          Auth context (current user)
    hooks/         Data-loading hooks
    pages/         Login, list, new inquiry, detail
    components/    Shared UI pieces
```

## Troubleshooting

| Problem | Fix |
|---|---|
| Sign in shows "Something went wrong" | The database isn't running. Run `docker compose up -d` and check `docker ps` shows `inquiry_db`. |
| `failed to connect to the docker API` | Open Docker Desktop and wait until the engine is running. |
| "The server is not responding" in the app | The backend isn't running. Start it with `npm run dev` in `backend/`. |
| Want a clean database | `docker compose down -v` then `docker compose up -d` and `npm run seed` again (**deletes all data**). |