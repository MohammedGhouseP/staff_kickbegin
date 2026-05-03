import { Router } from "express";
import { z } from "zod";
import { nanoid } from "nanoid";
import { query, rowToCamel, rowsToCamel } from "../db.js";
import { ApiError, asyncHandler } from "../errors.js";
import { validate } from "../validate.js";
import { requireAuth, requireOwnerOrAdmin, hashPassword } from "../auth.js";

const router = Router();

const PUBLIC_COLS = "id, name, email, role, color, created_at";

const createSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().min(1).max(120),
  password: z.string().min(4).max(200),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  role: z.enum(["employee", "admin"]).optional().default("employee"),
});

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().min(1).max(120).optional(),
  password: z.string().min(4).max(200).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  role: z.enum(["employee", "admin"]).optional(),
});

router.use(requireAuth);

router.get(
  "/",
  asyncHandler(async (_req, res) => {
    const { rows } = await query(`SELECT ${PUBLIC_COLS} FROM users ORDER BY role DESC, name ASC`);
    res.json(rowsToCamel(rows));
  })
);

router.post(
  "/",
  requireOwnerOrAdmin,
  validate(createSchema),
  asyncHandler(async (req, res) => {
    const { name, email, password, color, role } = req.body;
    // Only owner can create admins; admins can only create employees.
    if (role === "admin" && req.user.role !== "owner") {
      throw new ApiError(403, "Only the owner can create admins", "forbidden");
    }
    const id = nanoid(10);
    const hash = await hashPassword(password);
    await query(
      `INSERT INTO users (id, name, email, password_hash, role, color)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [id, name, email, hash, role, color || "#6c8ef5"]
    );
    const { rows } = await query(`SELECT ${PUBLIC_COLS} FROM users WHERE id = $1`, [id]);
    res.status(201).json(rowToCamel(rows[0]));
  })
);

router.patch(
  "/:id",
  validate(updateSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { rows: targetRows } = await query("SELECT id, role FROM users WHERE id = $1", [id]);
    const target = targetRows[0];
    if (!target) throw new ApiError(404, "User not found", "not_found");

    const isSelf = req.user.id === id;
    const myRole = req.user.role;

    // Permission rules:
    //   owner    → can edit anyone
    //   admin    → can edit self and employees (not other admins, not owner)
    //   employee → can edit only self
    if (!isSelf) {
      if (myRole === "employee") {
        throw new ApiError(403, "Cannot edit other users", "forbidden");
      }
      if (myRole === "admin" && target.role !== "employee") {
        throw new ApiError(403, "Admins can only edit employees", "forbidden");
      }
    }

    // Role changes: only owner can promote/demote between employee↔admin.
    if (req.body.role !== undefined && req.body.role !== target.role) {
      if (myRole !== "owner") {
        throw new ApiError(403, "Only the owner can change a user's role", "forbidden");
      }
      if (target.role === "owner") {
        throw new ApiError(400, "Cannot change the owner's role", "bad_request");
      }
    }

    const fields = [];
    const values = [];
    const map = {
      name: "name",
      email: "email",
      color: "color",
      role:  "role",
    };
    for (const [k, col] of Object.entries(map)) {
      if (req.body[k] !== undefined) {
        values.push(req.body[k]);
        fields.push(`${col} = $${values.length}`);
      }
    }
    if (req.body.password !== undefined) {
      values.push(await hashPassword(req.body.password));
      fields.push(`password_hash = $${values.length}`);
    }
    if (!fields.length) throw new ApiError(400, "No fields to update", "no_fields");

    values.push(id);
    const { rows, rowCount } = await query(
      `UPDATE users SET ${fields.join(", ")} WHERE id = $${values.length} RETURNING ${PUBLIC_COLS}`,
      values
    );
    if (!rowCount) throw new ApiError(404, "User not found", "not_found");
    res.json(rowToCamel(rows[0]));
  })
);

router.delete(
  "/:id",
  requireOwnerOrAdmin,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (id === req.user.id) throw new ApiError(400, "Cannot delete yourself", "self_delete");

    const { rows: targetRows } = await query("SELECT role FROM users WHERE id = $1", [id]);
    const target = targetRows[0];
    if (!target) throw new ApiError(404, "User not found", "not_found");
    if (target.role === "owner") throw new ApiError(400, "Cannot delete the owner", "bad_request");
    if (req.user.role === "admin" && target.role !== "employee") {
      throw new ApiError(403, "Admins can only delete employees", "forbidden");
    }

    const { rowCount } = await query("DELETE FROM users WHERE id = $1", [id]);
    if (!rowCount) throw new ApiError(404, "User not found", "not_found");
    res.status(204).end();
  })
);

export default router;
