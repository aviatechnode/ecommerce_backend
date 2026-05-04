import { prisma } from "../src/lib/prismadb.js";
import bcrypt from "bcrypt";

/* =========================================================
   CONFIG
========================================================= */

const DEFAULT_SUPER_ADMIN_EMAIL = process.env.DEFAULT_SUPER_ADMIN_EMAIL!;
const DEFAULT_SUPER_ADMIN_PASSWORD = process.env.DEFAULT_SUPER_ADMIN_PASSWORD!;
const SALT_ROUNDS = 10;

/* =========================================================
   PERMISSION MATRIX
========================================================= */

const permissionMatrix: Record<string, readonly string[]> = {
  user: ["create", "read", "update", "delete"],
  role: ["create", "read", "update", "delete"],

  product: ["create", "read", "update", "delete"],
  category: ["create", "read", "update", "delete"],
  brand: ["create", "read", "update", "delete"],

  review: ["create", "read", "update", "delete"], 

  order: ["create", "read", "update", "delete"],
  payment: ["read", "update"],
  shipment: ["read", "update"],

  inventory: ["read", "update"],
  warehouse: ["create", "read", "update", "delete"],

  coupon: ["create", "read", "update", "delete"],

  wishlist: ["create", "read", "delete"],
  conversation: ["create", "read", "update", "delete"],
  message: ["create", "read", "update", "delete"],
  fitment: ["create", "read", "update", "delete"],

  address: ["create", "read", "update", "delete"],

  audit: ["read"],
};

/* =========================================================
   PERMISSION GROUPS
========================================================= */

const permissionGroups: Record<string, readonly string[]> = {
  USER_MANAGEMENT: [
    "user:create",
    "user:read",
    "user:update",
    "user:delete",
  ],

  PRODUCT_MANAGEMENT: [
    "product:create",
    "product:read",
    "product:update",
    "product:delete",

    "category:create",
    "category:read",
    "category:update",
    "category:delete",

    "brand:create",
    "brand:read",
    "brand:update",
    "brand:delete",

    // 🔥 FIX: FULL REVIEW ACCESS FOR ADMIN
    "review:create",
    "review:read",
    "review:update",
    "review:delete",
  ],

  INVENTORY_MANAGEMENT: [
    "inventory:read",
    "inventory:update",

    "warehouse:create",
    "warehouse:read",
    "warehouse:update",
    "warehouse:delete",
  ],

  ORDER_MANAGEMENT: [
    "order:create",
    "order:read",
    "order:update",
    "order:delete",

    "shipment:read",
    "shipment:update",
  ],

  PAYMENT_MANAGEMENT: [
    "payment:read",
    "payment:update",
  ],

  MARKETING_MANAGEMENT: [
    "coupon:create",
    "coupon:read",
    "coupon:update",
    "coupon:delete",
  ],

  ROLE_MANAGEMENT: [
    "role:create",
    "role:read",
    "role:update",
    "role:delete",
  ],

  CHAT_MANAGEMENT: [
    "conversation:create",
    "conversation:read",
    "conversation:update",
    "conversation:delete",
    "message:create",
    "message:read",
    "message:update",
    "message:delete",
  ],

  FITMENT_MANAGEMENT: [
    "fitment:create",
    "fitment:read",
    "fitment:update",
    "fitment:delete",
  ],

  SYSTEM_MANAGEMENT: [
    "audit:read",
  ],
};

/* =========================================================
   ROLE DEFINITIONS
========================================================= */

type RoleDef = {
  name: string;
  description: string;
  groups?: readonly string[];
  directPermissions?: readonly string[];
};

const roleDefinitions: readonly RoleDef[] = [
  {
    name: "SUPER_ADMIN",
    description: "Full system access",
    groups: Object.keys(permissionGroups),
  },
  {
    name: "ADMIN",
    description: "Administrative access",
    groups: [
      "USER_MANAGEMENT",
      "PRODUCT_MANAGEMENT",
      "ORDER_MANAGEMENT",
      "INVENTORY_MANAGEMENT",
      "MARKETING_MANAGEMENT",
      "SYSTEM_MANAGEMENT",
      "CHAT_MANAGEMENT",
      "FITMENT_MANAGEMENT",
    ],
  },
  {
    name: "CUSTOMER",
    description: "Customer access",
    directPermissions: [
      "product:read",
      "category:read",
      "order:create",
      "order:read",
      "order:update",
      "wishlist:create",
      "wishlist:read",
      "wishlist:delete",
      "conversation:create",
      "message:create",
      "conversation:read",

      "review:create",
      "review:read",

      "address:create",
      "address:read",
      "address:update",
      "address:delete",
    ],
  },
];

/* =========================================================
   MAIN SEED
========================================================= */

async function main() {
  console.log("🌱 RBAC Seeding Started...\n");

  const createdPermissions = new Map<string, string>();

  /* ---------------- Permissions ---------------- */
  for (const [resource, actions] of Object.entries(permissionMatrix)) {
    for (const action of actions) {
      const name = `${resource}:${action}`;

      const permission = await prisma.permission.upsert({
        where: { name },
        update: {},
        create: {
          name,
          description: `${action} ${resource}`,
          resource,
          action,
        },
      });

      createdPermissions.set(name, permission.id);
    }
  }

  console.log("✅ Permissions seeded");

  /* ---------------- Groups ---------------- */

  const createdGroups = new Map<string, string>();

  for (const [groupName, perms] of Object.entries(permissionGroups)) {
    const group = await prisma.permissionGroup.upsert({
      where: { name: groupName },
      update: {},
      create: {
        name: groupName,
        description: `${groupName} permissions`,
      },
    });

    createdGroups.set(groupName, group.id);

    for (const perm of perms) {
      const permissionId = createdPermissions.get(perm);

      if (!permissionId) {
        throw new Error(`Missing permission in matrix: ${perm}`);
      }

      await prisma.permissionAssignment.upsert({
        where: {
          groupId_permissionId: {
            groupId: group.id,
            permissionId,
          },
        },
        update: {},
        create: {
          groupId: group.id,
          permissionId,
        },
      });
    }
  }

  console.log("✅ Permission groups seeded");

  /* ---------------- Roles ---------------- */

  const createdRoles = new Map<string, string>();

  for (const role of roleDefinitions) {
    const created = await prisma.role.upsert({
      where: { name: role.name },
      update: {},
      create: {
        name: role.name,
        description: role.description,
        parentId: null,
      },
    });

    createdRoles.set(role.name, created.id);
  }

  console.log("✅ Roles seeded");

  /* ---------------- Attach Groups ---------------- */

  for (const role of roleDefinitions) {
    if (!role.groups) continue;

    const roleId = createdRoles.get(role.name)!;

    for (const groupName of role.groups) {
      const groupId = createdGroups.get(groupName)!;

      await prisma.rolePermissionGroup.upsert({
        where: {
          roleId_groupId: { roleId, groupId },
        },
        update: {},
        create: { roleId, groupId },
      });
    }
  }

  console.log("✅ Groups attached");

  /* ---------------- Direct Permissions ---------------- */

  for (const role of roleDefinitions) {
    if (!role.directPermissions) continue;

    const roleId = createdRoles.get(role.name)!;

    for (const perm of role.directPermissions) {
      const permissionId = createdPermissions.get(perm);

      if (!permissionId) continue;

      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: { roleId, permissionId },
        },
        update: {},
        create: { roleId, permissionId },
      });
    }
  }

  console.log("✅ Direct permissions attached");

  /* ---------------- Super Admin ---------------- */

  const superAdminRoleId = createdRoles.get("SUPER_ADMIN")!;

  const existingSuperAdmin = await prisma.user.findUnique({
    where: { email: DEFAULT_SUPER_ADMIN_EMAIL },
  });

  if (!existingSuperAdmin) {
    const hashedPassword = await bcrypt.hash(
      DEFAULT_SUPER_ADMIN_PASSWORD,
      SALT_ROUNDS
    );

    await prisma.user.create({
      data: {
        email: DEFAULT_SUPER_ADMIN_EMAIL,
        password: hashedPassword,
        name: "System Super Admin",
        roleId: superAdminRoleId,
        emailVerified: true,
      },
    });

    console.log("✅ Default Super Admin created");
  }

  console.log("\n🎉 RBAC Seeding Completed Successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });