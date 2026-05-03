import "dotenv/config";
import express from "express";
import cors from "cors";

import { errorMiddleware } from "./errors.js";
import authRouter from "./routes/auth.js";
import usersRouter from "./routes/users.js";
import tasksRouter from "./routes/tasks.js";
import remarksRouter from "./routes/remarks.js";
import settingsRouter from "./routes/settings.js";
import sprintsRouter from "./routes/sprints.js";
import transitionsRouter from "./routes/transitions.js";

const app = express();
const PORT = Number(process.env.PORT) || 4004;
const ORIGINS = (process.env.CORS_ORIGIN || "http://localhost:5173")
  .split(",").map((s) => s.trim()).filter(Boolean);

// Allow any localhost/127.0.0.1 port in dev so Vite picking 5174/5175 doesn't blow up CORS.
const isDev = process.env.NODE_ENV !== "production";
const corsOrigin = (origin, cb) => {
  if (!origin) return cb(null, true); // same-origin / curl
  if (ORIGINS.includes(origin)) return cb(null, true);
  if (isDev && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return cb(null, true);
  cb(new Error(`Origin ${origin} not allowed by CORS`));
};

app.use(cors({ origin: corsOrigin, credentials: true }));
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => res.json({ ok: true, ts: new Date().toISOString() }));

app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);
app.use("/api/tasks", tasksRouter);
app.use("/api/tasks/:taskId/remarks", remarksRouter);
app.use("/api/settings", settingsRouter);
app.use("/api/sprints", sprintsRouter);
app.use("/api/transitions", transitionsRouter);

app.use((req, res, _next) => res.status(404).json({ error: "Not found", path: req.path }));
app.use(errorMiddleware);

app.listen(PORT, () => {
  console.log(`✓ TaskFlow API listening on http://localhost:${PORT}`);
  console.log(`  CORS allowed origins: ${ORIGINS.join(", ")}`);
});
