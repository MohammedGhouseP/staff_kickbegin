import { pool } from "./db.js";

const DROP = process.argv.includes("--drop");

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id           TEXT PRIMARY KEY,
  name         TEXT NOT NULL,
  email        TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role         TEXT NOT NULL CHECK (role IN ('owner','admin','employee')),
  color        TEXT NOT NULL DEFAULT '#6c8ef5',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE SEQUENCE IF NOT EXISTS task_seq START 1;

CREATE TABLE IF NOT EXISTS tasks (
  id           TEXT PRIMARY KEY,
  issue_key    TEXT UNIQUE,
  issue_type   TEXT NOT NULL DEFAULT 'task' CHECK (issue_type IN ('epic','story','task','bug','subtask')),
  parent_id    TEXT REFERENCES tasks(id) ON DELETE SET NULL,
  title        TEXT NOT NULL,
  description  TEXT NOT NULL DEFAULT '',
  assignee_id  TEXT REFERENCES users(id) ON DELETE CASCADE,
  task_date    DATE NOT NULL,
  due_date     DATE NOT NULL,
  status       TEXT NOT NULL CHECK (status IN ('yet-to-start','in-progress','complete')),
  priority     TEXT NOT NULL CHECK (priority IN ('low','medium','high')),
  extended     BOOLEAN NOT NULL DEFAULT FALSE,
  rank         DOUBLE PRECISION NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_date ON tasks(task_date);

CREATE TABLE IF NOT EXISTS remarks (
  id           TEXT PRIMARY KEY,
  task_id      TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  author_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body         TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_remarks_task ON remarks(task_id, created_at);

CREATE TABLE IF NOT EXISTS activity (
  id           TEXT PRIMARY KEY,
  task_id      TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  actor_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action       TEXT NOT NULL,
  details      JSONB,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_activity_task ON activity(task_id, created_at DESC);

CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS status_transitions (
  from_status TEXT NOT NULL,
  to_status   TEXT NOT NULL,
  PRIMARY KEY (from_status, to_status)
);

CREATE TABLE IF NOT EXISTS sprints (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  goal          TEXT NOT NULL DEFAULT '',
  start_date    DATE NOT NULL,
  end_date      DATE NOT NULL,
  status        TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned','active','completed')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at    TIMESTAMPTZ,
  completed_at  TIMESTAMPTZ,
  CHECK (start_date <= end_date)
);
CREATE INDEX IF NOT EXISTS idx_sprints_status ON sprints(status);
`;

const UPGRADE_SQL = `
-- Bring pre-existing 'tasks' tables up to the new schema.
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS issue_type TEXT NOT NULL DEFAULT 'task',
  ADD COLUMN IF NOT EXISTS parent_id  TEXT REFERENCES tasks(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS issue_key  TEXT;

-- Migrate legacy status='bug' rows to issue_type='bug', status='in-progress'.
UPDATE tasks SET issue_type = 'bug', status = 'in-progress' WHERE status = 'bug';

-- Replace the old status CHECK (which allowed 'bug') with the new one.
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_status_check;
ALTER TABLE tasks ADD CONSTRAINT tasks_status_check
  CHECK (status IN ('yet-to-start','in-progress','complete'));

-- Ensure issue_type CHECK exists with the full set.
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_issue_type_check;
ALTER TABLE tasks ADD CONSTRAINT tasks_issue_type_check
  CHECK (issue_type IN ('epic','story','task','bug','subtask'));

-- Backfill issue_key for any rows missing one.
UPDATE tasks SET issue_key = 'TF-' || nextval('task_seq') WHERE issue_key IS NULL;

-- Lock issue_key down: NOT NULL + UNIQUE.
ALTER TABLE tasks ALTER COLUMN issue_key SET NOT NULL;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tasks_issue_key_key'
  ) THEN
    ALTER TABLE tasks ADD CONSTRAINT tasks_issue_key_key UNIQUE (issue_key);
  END IF;
END $$;

-- Indexes on the new columns (placed here so they run after ADD COLUMN).
CREATE INDEX IF NOT EXISTS idx_tasks_parent ON tasks(parent_id);
CREATE INDEX IF NOT EXISTS idx_tasks_type ON tasks(issue_type);

-- Sprint linkage on tasks.
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS sprint_id TEXT REFERENCES sprints(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_sprint ON tasks(sprint_id);

-- Allow 'admin' role on existing databases (drop+recreate the role CHECK).
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check
  CHECK (role IN ('owner','admin','employee'));

-- Manual ordering rank for backlog/sprint prioritization.
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS rank DOUBLE PRECISION NOT NULL DEFAULT 0;
-- Backfill ranks for any rows still at default 0, spacing them by 1024 by created_at.
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) * 1024.0 AS r
  FROM tasks WHERE rank = 0
)
UPDATE tasks t SET rank = ranked.r FROM ranked WHERE t.id = ranked.id;
CREATE INDEX IF NOT EXISTS idx_tasks_rank ON tasks(rank);
`;

const DROP_SQL = `
DROP TABLE IF EXISTS activity CASCADE;
DROP TABLE IF EXISTS remarks CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS sprints CASCADE;
DROP TABLE IF EXISTS status_transitions CASCADE;
DROP TABLE IF EXISTS settings CASCADE;
DROP TABLE IF EXISTS users CASCADE;
`;

async function main() {
  const client = await pool.connect();
  try {
    if (DROP) {
      console.log("→ dropping existing tables");
      await client.query(DROP_SQL);
    }
    console.log("→ applying schema");
    await client.query(SCHEMA);
    console.log("→ applying upgrades (alter/backfill)");
    await client.query(UPGRADE_SQL);
    console.log("✓ migration complete");
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error("✗ migration failed:", err.message);
  process.exit(1);
});
