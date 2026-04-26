import { prisma } from "../lib/prismadb.js";

/* =========================================================
   TYPES
========================================================= */

export type PermissionString = `${string}:${string}` | "*";

export const SUPER_ADMIN_ROLE = "SUPER_ADMIN";

/* =========================================================
   CORE: RESOLVE PERMISSIONS
========================================================= */

export async function resolvePermissions(
  roleId: string
): Promise<Set<PermissionString>> {
  const role = await prisma.role.findUnique({
    where: { id: roleId },
    include: {
      rolePermissions: {
        include: {
          permission: true,
        },
      },
      rolePermissionGroups: {
        include: {
          group: {
            include: {
              permissionAssignments: {
                include: {
                  permission: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!role) return new Set();

  // 🚀 SUPER ADMIN SHORT-CIRCUIT (case-safe)
  if (role.name?.toUpperCase() === SUPER_ADMIN_ROLE) {
    return new Set(["*"]);
  }

  const permissions = new Set<PermissionString>();

  /* ---------------- Direct Permissions ---------------- */
  for (const rp of role.rolePermissions) {
    if (rp.permission) {
      permissions.add(
        `${rp.permission.resource}:${rp.permission.action}`
      );
    }
  }

  /* ---------------- Group Permissions ---------------- */
  for (const rpg of role.rolePermissionGroups) {
    const group = rpg.group;

    if (!group) continue;

    for (const pa of group.permissionAssignments) {
      if (pa.permission) {
        permissions.add(
          `${pa.permission.resource}:${pa.permission.action}`
        );
      }
    }
  }

  return permissions;
}

/* =========================================================
   PERMISSION CHECKER
========================================================= */

export function hasPermission(
  permissions: Set<PermissionString>,
  required: PermissionString
): boolean {
  // 🔥 Super admin wildcard
  if (permissions.has("*")) return true;

  // ✅ Exact match
  if (permissions.has(required)) return true;

  // ✅ Resource wildcard (e.g. product:*)
  const [resource] = required.split(":");
  if (permissions.has(`${resource}:*` as PermissionString)) return true;

  return false;
}