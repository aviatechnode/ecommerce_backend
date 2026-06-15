import type { Request, Response } from "express";
import { resolvePermissions } from "../utils/rbac.js";
import { prisma } from "../lib/prismadb.js";

/* =========================================================
   TYPES
========================================================= */

export type Permission = `${string}:${string}`;

export type SidebarItem = {
  label: string;
  path: string;
  icon?: string;
  permission?: Permission | `${string}:*` | "*";
};

export type SidebarSection = {
  title: string;
  items: SidebarItem[];
};

/* =========================================================
   SIDEBAR CONFIG (SOURCE OF TRUTH)
========================================================= */

const adminSidebar: SidebarSection[] = [
  {
    title: "Dashboard",
    items: [{ label: "Overview", path: "/admin" }],
  },
  {
    title: "Catalog",
    items: [
      { label: "Products", path: "/admin/products", permission: "product:read" },
      { label: "Categories", path: "/admin/categories", permission: "category:read" },
      { label: "Brands", path: "/admin/brands", permission: "brand:read" },
      { label: "Fitments", path: "/admin/fitments", permission: "fitment:read" },
      { label: "Vehicles", path: "/admin/vehicles", permission: "vehicle:read" },
    ],
  },
  {
    title: "Orders",
    items: [
      { label: "Orders", path: "/admin/orders", permission: "order:read" },
    ],
  },
  {
    title: "Users & Roles",
    items: [
      { label: "Users", path: "/admin/users", permission: "user:read" },
      { label: "Roles", path: "/admin/roles", permission: "role:read" },
    ],
  },
  {
  title: "Logistics",
  items: [
    { label: "Shipments", path: "/admin/logistics/shipments", permission: "shipment:read" },
    { label: "Tracking", path: "/admin/logistics/shipments/tracking", permission: "shipment:read" },
    { label: "Events", path: "/admin/logistics/shipments/events", permission: "shipment:event:read" },

    { label: "Couriers", path: "/admin/logistics/couriers", permission: "courier:read" },
    { label: "Zones", path: "/admin/logistics/zones", permission: "shipping_zone:read" },
    { label: "Rates", path: "/admin/logistics/rates", permission: "shipping_rate:read" },
    { label: "Pickup Stations", path: "/admin/logistics/stations", permission: "pickup_station:read" },
  ],
},
  {
    title: "Inventory",
    items: [
      { label: "Warehouses", path: "/admin/warehouses", permission: "inventory:read" },
    ],
  },
  {
    title: "Marketing",
    items: [
      { label: "Coupons", path: "/admin/coupons", permission: "coupon:read" },
    ],
  },
  {
    title: "System",
    items: [
      { label: "Audit Logs", path: "/admin/audit-logs", permission: "audit:read" },
    ],
  },
];

/* =========================================================
   🔥 PERMISSION ENGINE (FIXED)
========================================================= */

const checkPermission = (
  userPermissions: string[],
  required?: string
): boolean => {
  if (!required) return true;

  // super admin bypass
  if (userPermissions.includes("*")) return true;

  const [resource, action] = required.split(":");

  return userPermissions.some((perm) => {
    if (perm === "*") return true;
    if (perm === required) return true;

    const [pResource, pAction] = perm.split(":");

    // wildcard support: product:*
    if (pResource === resource && pAction === "*") return true;

    return false;
  });
};

/* =========================================================
   GET ADMIN SIDEBAR (DYNAMIC + RBAC)
========================================================= */

export const getAdminSidebar = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    /**
     * ✅ FIX: ensure array (NOT Set)
     * resolvePermissions was returning Set before
     */
    const permissionsSet = await resolvePermissions(req.user.roleId);

    const permissions: string[] = Array.isArray(permissionsSet)
      ? permissionsSet
      : Array.from(permissionsSet);

    const filteredSidebar: SidebarSection[] = adminSidebar
      .map((section) => {
        const items = section.items.filter((item) =>
          checkPermission(permissions, item.permission)
        );

        return { ...section, items };
      })
      .filter((section) => section.items.length > 0);

    return res.json(filteredSidebar);
  } catch (error) {
    console.error("Sidebar Error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

/* =========================================================
   HEADER DATA (UNCHANGED)
========================================================= */

export const getAdminHeaderData = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = req.user.id;

    const [unreadNotifications, notifications, unreadMessages] =
      await Promise.all([
        prisma.notification.count({
          where: {
            userId,
            isRead: false,
          },
        }),

        prisma.notification.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
          take: 5,
        }),

        prisma.conversationParticipant.aggregate({
          where: { userId },
          _sum: {
            unreadCount: true,
          },
        }),
      ]);

    return res.json({
      unreadNotifications,
      notifications,
      unreadMessages: unreadMessages._sum.unreadCount || 0,
    });
  } catch (error) {
    console.error("Header Error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};