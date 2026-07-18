import type { Socket } from "socket.io";
import { prisma } from "../../lib/prismadb.js";
import { resolvePermissions } from "../../utils/rbac.js";
import { BusinessRuleError } from "../_shared/business-rule-error.js";

export async function authenticateSocket(
  socket: Socket,
  next: (err?: Error) => void,
) {
  try {
    const refreshToken =
      socket.handshake.auth.refreshToken;

    if (!refreshToken) {
      return next(
        new BusinessRuleError(
          "Unauthorized",
        ),
      );
    }

    const session =
      await prisma.refreshToken.findUnique({
        where: {
          token: refreshToken,
        },
      });

    if (!session) {
      return next(
        new BusinessRuleError(
          "Unauthorized",
        ),
      );
    }

    const user =
      await prisma.user.findUnique({
        where: {
          id: session.userId,
        },
        include: {
          role: true,
        },
      });

    if (!user || !user.role) {
      return next(
        new BusinessRuleError(
          "Unauthorized",
        ),
      );
    }

    const permissions =
      await resolvePermissions(
        user.role.id,
      );

    socket.data.actor = {
      userId: user.id,
      roleId: user.role.id,
      roleName: user.role.name,
      permissions,
      isAuthenticated: true,
      isGuest: false,
      isSuperAdmin: permissions.has("*"),
    };

    next();
  } catch (e) {
    next(e as Error);
  }
}