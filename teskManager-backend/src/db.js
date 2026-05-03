import pg from "pg";
import "dotenv/config";

// Return DATE columns as plain 'YYYY-MM-DD' strings so the frontend can compare
// task.date directly with calendar slot keys instead of timezone-shifted ISO timestamps.
pg.types.setTypeParser(1082, (v) => v);

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set. Copy .env.example to .env and fill in your Postgres connection string.");
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });

pool.on("error", (err) => {
  console.error("[db] unexpected idle client error", err);
});

export async function query(text, params) {
  return pool.query(text, params);
}

// Convert snake_case columns to camelCase for JSON responses.
const toCamel = (s) => s.replace(/_([a-z])/g, (_, c) => c.toUpperCase());

export function rowToCamel(row) {
  if (!row || typeof row !== "object") return row;
  const out = {};
  for (const [k, v] of Object.entries(row)) out[toCamel(k)] = v;
  return out;
}

export function rowsToCamel(rows) {
  return rows.map(rowToCamel);
}
