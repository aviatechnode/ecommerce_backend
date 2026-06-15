import { prisma } from "../src/lib/prismadb.js";
import bcrypt from "bcrypt";

/* =========================================================
   CONFIG
========================================================= */

const DEFAULT_SUPER_ADMIN_EMAIL =
  process.env.DEFAULT_SUPER_ADMIN_EMAIL!;
const DEFAULT_SUPER_ADMIN_PASSWORD =
  process.env.DEFAULT_SUPER_ADMIN_PASSWORD!;
const SALT_ROUNDS = 10;

/* =========================================================
   PERMISSION MATRIX
========================================================= */

const permissionMatrix: Record<string, readonly string[]> =
  {
    user: ["create", "read", "update", "delete"],
    role: ["create", "read", "update", "delete"],

    product: ["create", "read", "update", "delete"],
    category: ["create", "read", "update", "delete"],
    brand: ["create", "read", "update", "delete"],
    vehicle: ["create", "read", "update", "delete"],

    review: ["create", "read", "update", "delete"],

    order: ["create", "read", "update", "delete"],
    payment: ["read", "update"],
    shipment: [
      "create",
      "read",
      "update",
      "delete",
    ],

    "shipment:event": [
      "create",
      "read",
      "update",
      "delete",
    ],
    "shipment:tracking": ["read"],

    courier: [
      "create",
      "read",
      "update",
      "delete",
    ],
    shipping_zone: [
      "create",
      "read",
      "update",
      "delete",
    ],
    shipping_rate: [
      "create",
      "read",
      "update",
      "delete",
    ],
    pickup_station: [
      "create",
      "read",
      "update",
      "delete",
    ],

    inventory: ["read", "update"],
    warehouse: [
      "create",
      "read",
      "update",
      "delete",
    ],
    feedback: [
      "create",
      "read",
      "update",
      "delete",
    ],

    coupon: [
      "create",
      "read",
      "update",
      "delete",
    ],

    wishlist: ["create", "read", "delete"],

    conversation: [
      "create",
      "read",
      "update",
      "delete",
      "assign",
      "close",
    ],

    message: [
      "create",
      "read",
      "update",
      "delete",
      "read_all",
      "delete_any",
    ],

    chat: [
      "read",
      "send",
      "moderate",
      "pin",
      "delete_any",
    ],

    fitment: [
      "create",
      "read",
      "update",
      "delete",
    ],

    address: [
      "create",
      "read",
      "update",
      "delete",
    ],

    audit: ["read"],
  };

/* =========================================================
   PERMISSION GROUPS
========================================================= */

const permissionGroups: Record<string, readonly string[]> =
  {
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

      "review:create",
      "review:read",
      "review:update",
      "review:delete",

      "feedback:create",
      "feedback:read",
      "feedback:update",
      "feedback:delete",
    ],

    VEHICLE_MANAGEMENT: [
      "vehicle:create",
      "vehicle:read",
      "vehicle:update",
      "vehicle:delete",
    ],

    LOGISTICS_MANAGEMENT: [
      "shipment:create",
      "shipment:read",
      "shipment:update",
      "shipment:delete",

      "shipment:tracking:read",

      "shipment:event:create",
      "shipment:event:read",
      "shipment:event:update",
      "shipment:event:delete",

      "courier:create",
      "courier:read",
      "courier:update",
      "courier:delete",

      "shipping_zone:create",
      "shipping_zone:read",
      "shipping_zone:update",
      "shipping_zone:delete",

      "shipping_rate:create",
      "shipping_rate:read",
      "shipping_rate:update",
      "shipping_rate:delete",

      "pickup_station:create",
      "pickup_station:read",
      "pickup_station:update",
      "pickup_station:delete",
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
      "shipment:create",
      "shipment:delete",
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
      "conversation:assign",
      "conversation:close",

      "message:create",
      "message:read",
      "message:update",
      "message:delete",
      "message:read_all",
      "message:delete_any",

      "chat:read",
      "chat:send",
      "chat:moderate",
      "chat:pin",
      "chat:delete_any",
    ],

    FITMENT_MANAGEMENT: [
      "fitment:create",
      "fitment:read",
      "fitment:update",
      "fitment:delete",
    ],

    SYSTEM_MANAGEMENT: ["audit:read"],
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
      "LOGISTICS_MANAGEMENT",
      "VEHICLE_MANAGEMENT",
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
      "conversation:read",

      "message:create",
      "message:read",

      "chat:read",
      "chat:send",

      "feedback:create",
      "feedback:read",

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

  const createdPermissions = new Map<
    string,
    string
  >();

  for (const [resource, actions] of Object.entries(
    permissionMatrix
  )) {
    for (const action of actions) {
      const name = `${resource}:${action}`;

      const permission =
        await prisma.permission.upsert({
          where: { name },
          update: {},
          create: {
            name,
            description: `${action} ${resource}`,
            resource,
            action,
          },
        });

      createdPermissions.set(
        name,
        permission.id
      );
    }
  }

  console.log("✅ Permissions seeded");

  const createdGroups = new Map<
    string,
    string
  >();

  for (const [
    groupName,
    perms,
  ] of Object.entries(permissionGroups)) {
    const group =
      await prisma.permissionGroup.upsert({
        where: { name: groupName },
        update: {},
        create: {
          name: groupName,
          description: `${groupName} permissions`,
        },
      });

    createdGroups.set(groupName, group.id);

    for (const perm of perms) {
      const permissionId =
        createdPermissions.get(perm);

      if (!permissionId) {
        throw new Error(
          `Missing permission: ${perm}`
        );
      }

      await prisma.permissionAssignment.upsert(
        {
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
        }
      );
    }
  }

  console.log("✅ Permission groups seeded");

  const createdRoles = new Map<
    string,
    string
  >();

  for (const role of roleDefinitions) {
    const created =
      await prisma.role.upsert({
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

  for (const role of roleDefinitions) {
    if (!role.groups) continue;

    const roleId = createdRoles.get(
      role.name
    )!;

    for (const groupName of role.groups) {
      const groupId =
        createdGroups.get(groupName)!;

      await prisma.rolePermissionGroup.upsert(
        {
          where: {
            roleId_groupId: {
              roleId,
              groupId,
            },
          },
          update: {},
          create: {
            roleId,
            groupId,
          },
        }
      );
    }
  }

  console.log("✅ Groups attached");

  for (const role of roleDefinitions) {
    if (!role.directPermissions) continue;

    const roleId = createdRoles.get(
      role.name
    )!;

    for (const perm of role.directPermissions) {
      const permissionId =
        createdPermissions.get(perm);

      if (!permissionId) continue;

      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId,
            permissionId,
          },
        },
        update: {},
        create: {
          roleId,
          permissionId,
        },
      });
    }
  }

  console.log("✅ Direct permissions attached");

  const superAdminRoleId =
    createdRoles.get("SUPER_ADMIN")!;

  const existingSuperAdmin =
    await prisma.user.findUnique({
      where: {
        email: DEFAULT_SUPER_ADMIN_EMAIL,
      },
    });

  if (!existingSuperAdmin) {
    const hashedPassword =
      await bcrypt.hash(
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

    console.log(
      "✅ Default Super Admin created"
    );
  }

  console.log(
    "\n🎉 RBAC Seeding Completed Successfully!"
  );
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });