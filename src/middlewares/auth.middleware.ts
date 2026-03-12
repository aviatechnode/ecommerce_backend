import type { Request, Response, NextFunction } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import type { PermissionString } from "../utils/rbac.js";
import { SUPER_ADMIN_ROLE } from "../utils/rbac.js";

/* ================= ENV ================= */
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error("JWT_SECRET is not defined");

/* ================= Extend Express ================= */
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        roleId: string;
        permissions: PermissionString[];
        isSuperAdmin: boolean;
      };
    }
  }
}

/* ================= Token Payload ================= */
interface TokenPayload extends JwtPayload {
  id: string;
  roleId: string;
  roleName: string;
  permissions: PermissionString[];
  type: "access";
}

/* ================= Type Guard ================= */
function isTokenPayload(payload: unknown): payload is TokenPayload {
  if (!payload || typeof payload !== "object") return false;

  const p = payload as TokenPayload;

  return (
    p.type === "access" &&
    typeof p.id === "string" &&
    typeof p.roleId === "string" &&
    typeof p.roleName === "string" &&
    Array.isArray(p.permissions)
  );
}

/* ================= PROTECT ================= */
export const protect = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const token = authHeader.slice(7);
    if (!token) {
      return res.status(401).json({ message: "Token missing" });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    if (!isTokenPayload(decoded)) {
      return res.status(401).json({ message: "Invalid token" });
    }

    const isSuperAdmin =
      decoded.roleName === SUPER_ADMIN_ROLE;

    req.user = {
      id: decoded.id,
      roleId: decoded.roleId,
      permissions: decoded.permissions,
      isSuperAdmin,
    };

    next();
  } catch {
    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }
};

/* ================= REQUIRE PERMISSION ================= */
export const requirePermission =
  (...required: PermissionString[]) =>
  (req: Request, res: Response, next: NextFunction) => {
    if (!req.user)
      return res.status(401).json({ message: "Unauthorized" });

    if (req.user.isSuperAdmin) return next();

    const hasAll = required.every((perm) =>
      req.user!.permissions.includes(perm)
    );

    if (!hasAll)
      return res
        .status(403)
        .json({ message: "Insufficient permissions" });

    next();
  };

/* ================= REQUIRE OWNERSHIP ================= */
export const requireOwnership =
  (getResourceUserId: (req: Request) => Promise<string>) =>
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user)
      return res.status(401).json({ message: "Unauthorized" });

    if (req.user.isSuperAdmin) return next();

    try {
      const ownerId = await getResourceUserId(req);

      if (ownerId !== req.user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }

      next();
    } catch {
      return res
        .status(500)
        .json({ message: "Ownership validation failed" });
    }
  };