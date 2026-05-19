import type { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prismadb.js";
import {
  resolvePermissions,
  type PermissionString,
} from "../utils/rbac.js";


  // AUTH MIDDLEWARE
export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ message: "No session" });
    }

    const session = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    });

    if (!session) {
      return res.status(401).json({ message: "Invalid session" });
    }

    if (session.expiresAt < new Date()) {
      return res.status(401).json({ message: "Session expired" });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: { role: true },
    });

    if (!user || !user.role) {
      return res.status(401).json({ message: "User not found" });
    }

    const permissions = await resolvePermissions(user.role.id);

    req.user = {
      id: user.id,
      roleId: user.role.id,
      roleName: user.role.name,
      permissions,
      isSuperAdmin: permissions.has("*"),
    };

    next();
  } catch (error) {
    console.error("AUTH ERROR:", error);
    return res.status(401).json({ message: "Unauthorized" });
  }
};


  // PERMISSION CHECKER
function hasPermission(
  permissions: Set<PermissionString>,
  required: PermissionString
): boolean {
  if (permissions.has("*")) return true;
  if (permissions.has(required)) return true;

  const [resource] = required.split(":");
  if (permissions.has(`${resource}:*` as PermissionString)) return true;

  return false;
}


  // REQUIRE PERMISSION MIDDLEWARE
export const requirePermission =
  (...required: PermissionString[]) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const permissions = req.user.permissions;

      // 🔥 super admin shortcut
      if (permissions.has("*")) {
        return next();
      }

      const hasAll = required.every((perm) =>
        hasPermission(permissions, perm)
      );

      if (!hasAll) {
        return res.status(403).json({
          message: "Insufficient permissions",
        });
      }

      next();
    } catch (error) {
      console.error("Permission check error:", error);
      return res.status(500).json({ message: "Server Error" });
    }
  };