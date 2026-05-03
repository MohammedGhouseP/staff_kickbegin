import { Router } from "express";
import { z } from "zod";
import { pool, query, rowsToCamel } from "../db.js";
import { ApiError, asyncHandler } from "../errors.js";
import { validate } from "../validate.js";
import { requireAuth, requireOwnerOrAdmin } from "../auth.js";

const router = Router();

const STATUSES = ["yet-to-start", "in-progress", "complete"];
const transitionSchema = z.object({
  from: z.enum(STATUSES),
  to:   z.enum(STATUSES),
});
const replaceSchema = z.object({
  transitions: z.array(transitionSchema),
});

router.use(requireAuth);

router.get(
  "/",
  asyncHandler(async (_req, res) => {
    const { rows } = await query(
      "SELECT from_status, to_status FROM status_transitions ORDER BY from_status, to_status"
    );
    res.json(rowsToCamel(rows));
  })
);

router.post(
  "/",
  requireOwnerOrAdmin,
  validate(transitionSchema),
  asyncHandler(async (req, res) => {
    const { from, to } = req.body;
    await query(
      `INSERT INTO status_transitions (from_status, to_status) VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [from, to]
    );
    res.status(201).json({ from, to });
  })
);

router.delete(
  "/:from/:to",
  requireOwnerOrAdmin,
  asyncHandler(async (req, res) => {
    const { from, to } = req.params;
    if (!STATUSES.includes(from) || !STATUSES.includes(to)) {
      throw new ApiError(400, "Unknown status", "bad_status");
    }
    await query(
      "DELETE FROM status_transitions WHERE from_status = $1 AND to_status = $2",
      [from, to]
    );
    res.status(204).end();
  })
);

// Replace the entire matrix in one shot — convenient for the settings UI.
router.put(
  "/",
  requireOwnerOrAdmin,
  validate(replaceSchema),
  asyncHandler(async (req, res) => {
    const { transitions } = req.body;
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("DELETE FROM status_transitions");
      for (const t of transitions) {
        await client.query(
          "INSERT INTO status_transitions (from_status, to_status) VALUES ($1, $2) ON CONFLICT DO NOTHING",
          [t.from, t.to]
        );
      }
      await client.query("COMMIT");
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
    res.json({ transitions });
  })
);

export default router;
