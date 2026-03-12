import jwt, { type SignOptions } from "jsonwebtoken";
import type { PermissionString } from "./rbac.js";

const JWT_SECRET = process.env.JWT_SECRET!;
const REFRESH_SECRET = process.env.REFRESH_SECRET!;

export interface TokenPayload {
  id: string;
  roleId: string;
  roleName: string;
  permissions: PermissionString[];
  type: "access" | "refresh";
}

/* ---------------- ACCESS TOKEN ---------------- */
export const generateAccessToken = (
  payload: Omit<TokenPayload, "type">
) =>
  jwt.sign(
    { ...payload, type: "access" },
    JWT_SECRET,
    { expiresIn: "15m" } as SignOptions
  );

/* ---------------- REFRESH TOKEN ---------------- */
export const generateRefreshToken = (
  payload: Omit<TokenPayload, "type">
) =>
  jwt.sign(
    { ...payload, type: "refresh" },
    REFRESH_SECRET,
    { expiresIn: "7d" } as SignOptions
  );