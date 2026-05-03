import { Router } from "express";
import { z } from "zod";
import { nanoid } from "nanoid";
import { query, rowToCamel, rowsToCamel } from "../db.js";
import { ApiError, asyncHandler } from "../errors.js";
import { validate } from "../validate.js";
import { requireAuth } from "../auth.js";

const router = Router({ mergeParams: true });

const createSchema = z.object({
  body: z.string().min(1).max(2000),
});

router.use(requireAuth);

const isStaff = (user) => user?.role === "owner" || user?.role === "admin";

async function ensureCanAccessTask(req) {
  const { taskId } = req.params;
  const { rows } = await query("SELECT assignee_id FROM tasks WHERE id = $1", [taskId]);
  const t = rows[0];
  if (!t) throw new ApiError(404, "Task not found", "not_found");
  if (!isStaff(req.user) && t.assignee_id !== req.user.id) {
    throw new ApiError(403, "Not your task", "forbidden");
  }
}

router.get(
  "/",
  asyncHandler(async (req, res) => {
    await ensureCanAccessTask(req);
    const { rows } = await query(
      `SELECT r.id, r.task_id, r.body, r.created_at,
              u.id AS author_id, u.name AS author_name, u.color AS author_color, u.role AS author_role
       FROM remarks r JOIN users u ON u.id = r.author_id
       WHERE r.task_id = $1
       ORDER BY r.created_at ASC`,
      [req.params.taskId]
    );
    res.json(rowsToCamel(rows));
  })
);

router.post(
  "/",
  validate(createSchema),
  asyncHandler(async (req, res) => {
    await ensureCanAccessTask(req);
    const id = nanoid(10);
    const { rows } = await query(
      `INSERT INTO remarks (id, task_id, author_id, body) VALUES ($1,$2,$3,$4)
       RETURNING id, task_id, body, created_at, author_id`,
      [id, req.params.taskId, req.user.id, req.body.body]
    );
    const r = rows[0];
    res.status(201).json({
      ...rowToCamel(r),
      authorName: req.user.name,
      authorColor: req.user.color,
      authorRole: req.user.role,
    });
  })
);

router.delete(
  "/:remarkId",
  asyncHandler(async (req, res) => {
    const { rows } = await query("SELECT author_id FROM remarks WHERE id = $1", [req.params.remarkId]);
    const r = rows[0];
    if (!r) throw new ApiError(404, "Remark not found", "not_found");
    if (!isStaff(req.user) && r.author_id !== req.user.id) {
      throw new ApiError(403, "Cannot delete others' remarks", "forbidden");
    }
    await query("DELETE FROM remarks WHERE id = $1", [req.params.remarkId]);
    res.status(204).end();
  })
);

export default router;
