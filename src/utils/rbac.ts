import { prisma } from "../lib/prismadb.js";

export type PermissionString = `${string}:${string}`;

export const SUPER_ADMIN_ROLE = "SUPER_ADMIN";

/**
 * Resolve permissions:
 * - Direct permissions
 * - Permission groups
 * - Parent roles (if ever used)
 */
export async function resolvePermissions(roleId: string) {
  const result = await prisma.$queryRaw<
    { permission: string }[]
  >`
    WITH RECURSIVE role_tree AS (
      SELECT id, "parentId"
      FROM "Role"
      WHERE id = ${roleId}

      UNION ALL

      SELECT r.id, r."parentId"
      FROM "Role" r
      INNER JOIN role_tree rt ON r.id = rt."parentId"
    )

    SELECT DISTINCT (p.resource || ':' || p.action) AS permission
    FROM role_tree rt
    LEFT JOIN "RolePermission" rp ON rp."roleId" = rt.id
    LEFT JOIN "Permission" p ON p.id = rp."permissionId"

    UNION

    SELECT DISTINCT (p.resource || ':' || p.action) AS permission
    FROM role_tree rt
    LEFT JOIN "RolePermissionGroup" rpg ON rpg."roleId" = rt.id
    LEFT JOIN "PermissionAssignment" pa ON pa."groupId" = rpg."groupId"
    LEFT JOIN "Permission" p ON p.id = pa."permissionId"
  `;

  return new Set(
    result
      .map((r) => r.permission)
      .filter(Boolean) as PermissionString[]
  );
}

/**
 * Check if role is SUPER_ADMIN
 */
export async function isSuperAdmin(roleId: string) {
  const role = await prisma.role.findUnique({
    where: { id: roleId },
    select: { name: true },
  });

  return role?.name === SUPER_ADMIN_ROLE;
}