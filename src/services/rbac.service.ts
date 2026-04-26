// services/rbac.service.ts
import { prisma } from "../lib/prismadb.js";
import { createRoleSchema, updateRoleSchema } from "../schemas/rbac.schema.js";

/**
 * Helper: REMOVE undefined fields
 */
function clean<T extends object>(obj: T) {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, v]) => v !== undefined)
  );
}

/* =========================================================
   ROLE CRUD
========================================================= */

export async function createRole(input: unknown) {
  const data = createRoleSchema.parse(input);

  return prisma.role.create({
    data: {
      name: data.name,
      description: data.description ?? null,
      parentId: data.parentId ?? null,
    },
  });
}

export async function updateRole(roleId: string, input: unknown) {
  const data = updateRoleSchema.parse(input);

  return prisma.role.update({
    where: { id: roleId },
    data: clean({
      name: data.name,
      description: data.description ?? null,
      parentId: data.parentId ?? null,
    }),
  });
}

export async function deleteRole(roleId: string) {
  return prisma.role.delete({
    where: { id: roleId },
  });
}

export async function listRoles() {
  return prisma.role.findMany({
    include: {
      children: true,
      parent: true,
    },
  });
}

export async function getRoleDetails(roleId: string) {
  return prisma.role.findUnique({
    where: { id: roleId },
    include: {
      children: true,
      parent: true,
      rolePermissions: true,
      rolePermissionGroups: true,
    },
  });
}

/* =========================================================
   ASSIGNMENTS
========================================================= */

export async function assignRoleToUser(userId: string, roleId: string) {
  return prisma.user.update({
    where: { id: userId },
    data: { roleId },
  });
}

export async function attachPermissionToRole(
  roleId: string,
  permissionId: string
) {
  return prisma.rolePermission.upsert({
    where: {
      roleId_permissionId: { roleId, permissionId },
    },
    update: {},
    create: { roleId, permissionId },
  });
}

export async function attachGroupToRole(
  roleId: string,
  groupId: string
) {
  return prisma.rolePermissionGroup.upsert({
    where: {
      roleId_groupId: { roleId, groupId },
    },
    update: {},
    create: { roleId, groupId },
  });
}