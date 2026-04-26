import jwt, { type SignOptions } from "jsonwebtoken";
import crypto from "crypto";
import type { PermissionString } from "./rbac.js";

/* ================= ENV ================= */
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error("JWT_SECRET is not defined");

/* ================= TYPES ================= */
export interface AccessTokenPayload {
  id: string;
  roleId: string;
  roleName: string;
  permissions: PermissionString[];
  isSuperAdmin?: boolean;
}

/* ================= HELPERS ================= */
function normalizePermissions(
  permissions: PermissionString[] = []
): PermissionString[] {
  return Array.from(new Set(permissions));
}

/* ================= ACCESS TOKEN ================= */
export const generateAccessToken = (
  payload: AccessTokenPayload
): string => {
  return jwt.sign(
    {
      ...payload,
      permissions: normalizePermissions(payload.permissions),
    },
    JWT_SECRET,
    {
      expiresIn: "15m",
    } as SignOptions
  );
};

/* ================= REFRESH TOKEN ================= */
// 🔥 NOT JWT anymore
export const generateRefreshToken = (): string => {
  return crypto.randomBytes(64).toString("hex");
};