import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import "dotenv/config";
import { ApiError } from "./errors.js";
import { query, rowToCamel } from "./db.js";

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
const BCRYPT_ROUNDS = 10;

if (!JWT_SECRET) throw new Error("JWT_SECRET is not set");

export const hashPassword = (pw) => bcrypt.hash(pw, BCRYPT_ROUNDS);
export const comparePassword = (pw, hash) => bcrypt.compare(pw, hash);

export const signToken = (user) =>
  jwt.sign({ sub: user.id, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

export const requireAuth = async (req, _res, next) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return next(new ApiError(401, "Missing auth token", "no_token"));
  const payload = verifyToken(token);
  if (!payload) return next(new ApiError(401, "Invalid or expired token", "bad_token"));

  const { rows } = await query(
    "SELECT id, name, email, role, color FROM users WHERE id = $1",
    [payload.sub]
  );
  if (!rows[0]) return next(new ApiError(401, "User no longer exists", "no_user"));

  req.user = rowToCamel(rows[0]);
  next();
};

export const requireOwner = (req, _res, next) => {
  if (req.user?.role !== "owner") return next(new ApiError(403, "Owner role required", "forbidden"));
  next();
};

// For most management actions, both owners and admins are allowed.
// Owner-exclusive actions (e.g. promoting/demoting admins) keep using requireOwner.
export const requireOwnerOrAdmin = (req, _res, next) => {
  if (req.user?.role !== "owner" && req.user?.role !== "admin") {
    return next(new ApiError(403, "Owner or admin role required", "forbidden"));
  }
  next();
};
