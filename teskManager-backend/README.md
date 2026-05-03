# TaskFlow Backend

Express + PostgreSQL + JWT API for the TaskFlow task manager.

## Stack
- **Express 4** — HTTP server
- **PostgreSQL** via `pg` — relational store
- **bcrypt** — password hashing
- **jsonwebtoken** — stateless auth
- **zod** — request validation
- **nanoid** — id generation

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
Copy `.env.example` to `.env` and fill in your local Postgres password:
```bash
cp .env.example .env
```

`.env` keys:
| Key | Default | Notes |
| --- | --- | --- |
| `PORT` | `4000` | API port |
| `DATABASE_URL` | `postgres://postgres:postgres@localhost:5432/taskflow` | Connection string |
| `JWT_SECRET` | _(none)_ | **Required**. Use a long random string. |
| `JWT_EXPIRES_IN` | `7d` | Token lifetime |
| `CORS_ORIGIN` | `http://localhost:5173` | Comma-separated allowed origins |
| `SEED_PASSWORD` | `password123` | Password used for every seeded user |

### 3. Create the database
Open `psql` and run:
```sql
CREATE DATABASE taskflow;
```

### 4. Run migrations and seed
```bash
npm run migrate
npm run seed
```

To wipe and re-seed in one step:
```bash
npm run reset
```

### 5. Start
```bash
npm run dev    # auto-restart on change
npm start      # production
```

You should see:
```
✓ TaskFlow API listening on http://localhost:4000
```

Health check: `GET /health`.

## Seeded users

All seeded users share the password `password123` (configurable via `SEED_PASSWORD`).

| Role | Email/Username |
| --- | --- |
| Owner | `owner@123.com` |
| Employee | `alex` |
| Employee | `sara` |
| Employee | `mike` |
| Employee | `priya` |

## API

All endpoints (except `/api/auth/login` and `/health`) require an `Authorization: Bearer <token>` header.

### Auth
- `POST /api/auth/login` → `{ token, user }`
- `GET /api/auth/me` → `{ user }`

### Users (owner manages employees)
- `GET /api/users` — list
- `POST /api/users` — create employee (owner only)
- `PATCH /api/users/:id` — owner can edit any; employee can edit self
- `DELETE /api/users/:id` — owner only

### Tasks
- `GET /api/tasks?assigneeId=&date=&mine=1` — employees see only their own
- `POST /api/tasks` — owner only
- `PATCH /api/tasks/:id` — owner can update anything; employee can only update `status` of their own task
- `DELETE /api/tasks/:id` — owner only
- `GET /api/tasks/:id/activity` — chronological action log

### Remarks
- `GET /api/tasks/:taskId/remarks`
- `POST /api/tasks/:taskId/remarks` — body: `{ body: string }`
- `DELETE /api/tasks/:taskId/remarks/:remarkId` — author or owner

### Settings
- `GET /api/settings` — returns `{ dayView, weekView }`
- `PUT /api/settings` — owner only

## Schema

Five tables: `users`, `tasks`, `remarks`, `activity`, `settings`. See [src/migrate.js](src/migrate.js).

Activity is automatically written when a task is created, status-changed, or extended.

## Production notes
- Replace `JWT_SECRET` with a cryptographically random string.
- Run behind HTTPS.
- Tighten `CORS_ORIGIN` to your real frontend domain(s).
- Rotate the seeded `owner` password after first login.
