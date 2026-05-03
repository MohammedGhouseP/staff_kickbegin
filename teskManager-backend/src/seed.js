import "dotenv/config";
import { pool } from "./db.js";
import { hashPassword } from "./auth.js";

const SEED_PASSWORD = process.env.SEED_PASSWORD || "password123";

const today = () => new Date().toISOString().split("T")[0];

const USERS = [
  { id: "owner", name: "Owner",       email: "owner@123.com", role: "owner",    color: "#6c8ef5" },
  { id: "emp1",  name: "Alex Turner", email: "alex",          role: "employee", color: "#f59e0b" },
  { id: "emp2",  name: "Sara Chen",   email: "sara",          role: "employee", color: "#10b981" },
  { id: "emp3",  name: "Mike Ramos",  email: "mike",          role: "employee", color: "#ef4444" },
  { id: "emp4",  name: "Priya Nair",  email: "priya",         role: "employee", color: "#a78bfa" },
];

const TASKS = [
  { id: "t1", title: "Design Homepage Mockup", description: "Create Figma wireframes for landing page",   assignee_id: "emp1", status: "in-progress", priority: "high"   },
  { id: "t2", title: "Fix Login Bug",          description: "OAuth callback fails on mobile browsers",    assignee_id: "emp2", status: "bug",         priority: "high"   },
  { id: "t3", title: "Write API Docs",         description: "Document all REST endpoints with Swagger",   assignee_id: "emp3", status: "yet-to-start",priority: "medium" },
  { id: "t4", title: "Onboarding Flow QA",     description: "Full QA on onboarding flow for new users",   assignee_id: "emp4", status: "complete",    priority: "low"    },
];

async function main() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const hash = await hashPassword(SEED_PASSWORD);
    for (const u of USERS) {
      await client.query(
        `INSERT INTO users (id, name, email, password_hash, role, color)
         VALUES ($1,$2,$3,$4,$5,$6)
         ON CONFLICT (id) DO UPDATE
           SET name = EXCLUDED.name,
               email = EXCLUDED.email,
               password_hash = EXCLUDED.password_hash,
               role = EXCLUDED.role,
               color = EXCLUDED.color`,
        [u.id, u.name, u.email, hash, u.role, u.color]
      );
    }

    const d = today();
    for (const t of TASKS) {
      await client.query(
        `INSERT INTO tasks (id, title, description, assignee_id, task_date, due_date, status, priority)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
         ON CONFLICT (id) DO NOTHING`,
        [t.id, t.title, t.description, t.assignee_id, d, d, t.status, t.priority]
      );
    }

    await client.query(
      `INSERT INTO settings (key, value) VALUES ('permissions', $1::jsonb)
       ON CONFLICT (key) DO NOTHING`,
      [JSON.stringify({ dayView: true, weekView: true })]
    );

    await client.query("COMMIT");
    console.log(`✓ seeded ${USERS.length} users, ${TASKS.length} tasks`);
    console.log(`  all seeded users share password: ${SEED_PASSWORD}`);
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error("✗ seed failed:", err.message);
  process.exit(1);
});
