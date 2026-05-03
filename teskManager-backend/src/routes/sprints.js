import { Router } from "express";
import { z } from "zod";
import { nanoid } from "nanoid";
import { query, rowToCamel, rowsToCamel } from "../db.js";
import { ApiError, asyncHandler } from "../errors.js";
import { validate } from "../validate.js";
import { requireAuth, requireOwnerOrAdmin } from "../auth.js";

const router = Router();

const STATUSES = ["planned", "active", "completed"];
const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "expected YYYY-MM-DD");

const createSchema = z.object({
  name:      z.string().min(1).max(120),
  goal:      z.string().max(500).optional().default(""),
  startDate: dateStr,
  endDate:   dateStr,
  status:    z.enum(STATUSES).optional().default("planned"),
});

const updateSchema = z.object({
  name:      z.string().min(1).max(120).optional(),
  goal:      z.string().max(500).optional(),
  startDate: dateStr.optional(),
  endDate:   dateStr.optional(),
  status:    z.enum(STATUSES).optional(),
});

const sprintCols = `
  id, name, goal, start_date, end_date, status,
  created_at, started_at, completed_at
`;

router.use(requireAuth);

// GET /api/sprints — list with task counts
router.get(
  "/",
  asyncHandler(async (_req, res) => {
    const { rows } = await query(
      `SELECT s.id, s.name, s.goal, s.start_date, s.end_date, s.status,
              s.created_at, s.started_at, s.completed_at,
              COUNT(t.id)::int AS task_count,
              COUNT(t.id) FILTER (WHERE t.status = 'complete')::int AS completed_count
       FROM sprints s
       LEFT JOIN tasks t ON t.sprint_id = s.id
       GROUP BY s.id
       ORDER BY (s.status = 'active') DESC, s.start_date DESC`
    );
    res.json(rowsToCamel(rows));
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const { rows } = await query(`SELECT ${sprintCols} FROM sprints WHERE id = $1`, [req.params.id]);
    if (!rows[0]) throw new ApiError(404, "Sprint not found", "not_found");
    res.json(rowToCamel(rows[0]));
  })
);

router.post(
  "/",
  requireOwnerOrAdmin,
  validate(createSchema),
  asyncHandler(async (req, res) => {
    const { name, goal, startDate, endDate, status } = req.body;
    if (startDate > endDate) throw new ApiError(400, "Start date must be on/before end date", "bad_dates");
    const id = nanoid(10);
    const { rows } = await query(
      `INSERT INTO sprints (id, name, goal, start_date, end_date, status${status === "active" ? ", started_at" : ""})
       VALUES ($1,$2,$3,$4,$5,$6${status === "active" ? ", NOW()" : ""})
       RETURNING ${sprintCols}`,
      [id, name, goal, startDate, endDate, status]
    );
    res.status(201).json(rowToCamel(rows[0]));
  })
);

router.patch(
  "/:id",
  requireOwnerOrAdmin,
  validate(updateSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { rows: existingRows } = await query(`SELECT ${sprintCols} FROM sprints WHERE id = $1`, [id]);
    const existing = existingRows[0];
    if (!existing) throw new ApiError(404, "Sprint not found", "not_found");

    const colMap = { name: "name", goal: "goal", startDate: "start_date", endDate: "end_date", status: "status" };
    const fields = [];
    const values = [];
    for (const [k, col] of Object.entries(colMap)) {
      if (req.body[k] !== undefined) {
        values.push(req.body[k]);
        fields.push(`${col} = $${values.length}`);
      }
    }
    if (req.body.status === "active" && existing.status !== "active") {
      fields.push(`started_at = COALESCE(started_at, NOW())`);
    }
    if (req.body.status === "completed" && existing.status !== "completed") {
      fields.push(`completed_at = NOW()`);
    }
    if (!fields.length) throw new ApiError(400, "No fields to update", "no_fields");

    // Validate date order if either changed.
    const nextStart = req.body.startDate ?? existing.start_date;
    const nextEnd = req.body.endDate ?? existing.end_date;
    if (new Date(nextStart) > new Date(nextEnd)) {
      throw new ApiError(400, "Start date must be on/before end date", "bad_dates");
    }

    values.push(id);
    const { rows } = await query(
      `UPDATE sprints SET ${fields.join(", ")} WHERE id = $${values.length} RETURNING ${sprintCols}`,
      values
    );
    res.json(rowToCamel(rows[0]));
  })
);

router.delete(
  "/:id",
  requireOwnerOrAdmin,
  asyncHandler(async (req, res) => {
    // Detach any tasks from this sprint, then delete.
    await query("UPDATE tasks SET sprint_id = NULL WHERE sprint_id = $1", [req.params.id]);
    const { rowCount } = await query("DELETE FROM sprints WHERE id = $1", [req.params.id]);
    if (!rowCount) throw new ApiError(404, "Sprint not found", "not_found");
    res.status(204).end();
  })
);

export default router;
