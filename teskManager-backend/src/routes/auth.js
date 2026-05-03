import { Router } from "express";
import { z } from "zod";
import { nanoid } from "nanoid";
import { query, rowToCamel } from "../db.js";
import { ApiError, asyncHandler } from "../errors.js";
import { validate } from "../validate.js";
import { comparePassword, hashPassword, signToken, requireAuth } from "../auth.js";

const router = Router();

const loginSchema = z.object({
  email: z.string().min(1),
  password: z.string().min(1),
  role: z.enum(["owner", "admin", "employee"]).optional(),
});

const registerSchema = z.object({
  name:     z.string().min(1).max(100),
  email:    z.string().min(1).max(120),
  password: z.string().min(4).max(200),
  color:    z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
});

router.post(
  "/login",
  validate(loginSchema),
  asyncHandler(async (req, res) => {
    const { email, password, role } = req.body;
    const sql = role
      ? "SELECT * FROM users WHERE email = $1 AND role = $2"
      : "SELECT * FROM users WHERE email = $1";
    const params = role ? [email, role] : [email];
    const { rows } = await query(sql, params);
    const user = rows[0];
    if (!user) throw new ApiError(401, "Invalid credentials", "bad_credentials");

    const ok = await comparePassword(password, user.password_hash);
    if (!ok) throw new ApiError(401, "Invalid credentials", "bad_credentials");

    const token = signToken(user);
    const { password_hash, ...safe } = user;
    res.json({ token, user: rowToCamel(safe) });
  })
);

// Public self-signup. Always creates an `employee`-role account; the workspace
// owner can later promote via the Team page. Email must be unique.
router.post(
  "/register",
  validate(registerSchema),
  asyncHandler(async (req, res) => {
    const { name, email, password, color } = req.body;

    const { rows: existing } = await query("SELECT id FROM users WHERE email = $1", [email]);
    if (existing[0]) throw new ApiError(409, "An account with that email/username already exists", "email_taken");

    const id = nanoid(10);
    const hash = await hashPassword(password);
    await query(
      `INSERT INTO users (id, name, email, password_hash, role, color)
       VALUES ($1,$2,$3,$4,'employee',$5)`,
      [id, name, email, hash, color || "#6c8ef5"]
    );

    const { rows } = await query(
      "SELECT id, name, email, role, color, created_at FROM users WHERE id = $1",
      [id]
    );
    const user = rowToCamel(rows[0]);
    const token = signToken({ id: user.id, role: user.role });
    res.status(201).json({ token, user });
  })
);

router.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => res.json({ user: req.user }))
);

export default router;
