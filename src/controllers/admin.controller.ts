import type { Request, Response } from "express";
import { resolvePermissions, hasPermission } from "../utils/rbac.js";
import { prisma } from "../lib/prismadb.js";

/* =========================================================
   SIDEBAR CONFIG (SHARED LOGIC)
========================================================= */

export type SidebarItem = {
  label: string;
  path: string;
  icon?: string;
  permission?: string;
};

export type SidebarSection = {
  title: string;
  items: SidebarItem[];
};

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
      {label:"Fitments", path: "/admin/fitments", permission: "fitment:read"},
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
   GET ADMIN SIDEBAR (DYNAMIC)
========================================================= */

export const getAdminSidebar = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // 🔥 THIS IS THE FIX
    const permissions = await resolvePermissions(req.user.roleId);

    console.log("FINAL PERMISSIONS:", [...permissions]);

    const filteredSidebar: SidebarSection[] = adminSidebar
      .map((section) => {
        const items = section.items.filter((item) => {
          if (!item.permission) return true;

          return hasPermission(
            permissions,
            item.permission as `${string}:${string}`
          );
        });

        return { ...section, items };
      })
      .filter((section) => section.items.length > 0);

    return res.json(filteredSidebar);
  } catch (error) {
    console.error("Sidebar Error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};


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

    res.json({
      unreadNotifications,
      notifications,
      unreadMessages: unreadMessages._sum.unreadCount || 0,
    });
  } catch (error) {
    console.error("Header Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};