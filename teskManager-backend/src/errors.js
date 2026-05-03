export class ApiError extends Error {
  constructor(status, message, code) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

export function errorMiddleware(err, req, res, _next) {
  if (err instanceof ApiError) {
    return res.status(err.status).json({ error: err.message, code: err.code });
  }
  if (err?.name === "ZodError") {
    return res.status(400).json({ error: "Invalid input", code: "validation", issues: err.issues });
  }
  // Postgres unique violation
  if (err?.code === "23505") {
    return res.status(409).json({ error: "Resource already exists", code: "duplicate" });
  }
  console.error("[error]", err);
  res.status(500).json({ error: "Internal server error", code: "server_error" });
}
