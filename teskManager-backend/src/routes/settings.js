import { Router } from "express";
import { z } from "zod";
import { query } from "../db.js";
import { asyncHandler } from "../errors.js";
import { validate } from "../validate.js";
import { requireAuth, requireOwnerOrAdmin } from "../auth.js";

const router = Router();

const permsSchema = z.object({
  dayView: z.boolean(),
  weekView: z.boolean(),
  enforceWorkflow: z.boolean().optional(),
  empCanCreateTask:    z.boolean().optional(),
  empCanEditOwnTask:   z.boolean().optional(),
  empCanExtendOwnTask: z.boolean().optional(),
  empCanDeleteOwnTask: z.boolean().optional(),
});

const DEFAULTS = {
  dayView: true,
  weekView: true,
  enforceWorkflow: false,
  empCanCreateTask:    false,
  empCanEditOwnTask:   false,
  empCanExtendOwnTask: false,
  empCanDeleteOwnTask: false,
};

router.use(requireAuth);

router.get(
  "/",
  asyncHandler(async (_req, res) => {
    const { rows } = await query("SELECT value FROM settings WHERE key = 'permissions'");
    res.json({ ...DEFAULTS, ...(rows[0]?.value || {}) });
  })
);

router.put(
  "/",
  requireOwnerOrAdmin,
  validate(permsSchema),
  asyncHandler(async (req, res) => {
    const merged = { ...DEFAULTS, ...req.body };
    const value = JSON.stringify(merged);
    await query(
      `INSERT INTO settings (key, value) VALUES ('permissions', $1::jsonb)
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
      [value]
    );
    res.json(merged);
  })
);

export default router;
