import { prisma } from "../lib/prismadb.js";
import type { AdminStats } from "../types/admin.js";

export const getAdminStats = async (): Promise<AdminStats> => {
  const [
    users,
    orders,
    revenueAgg,
    products,
    pendingOrders,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.order.count(),
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: { status: "SUCCESS" },
    }),
    prisma.product.count(),
    prisma.order.count({
      where: { status: "PENDING" },
    }),
  ]);

  return {
    users,
    orders,
    revenue: Number(revenueAgg._sum.amount ?? 0),
    products,
    pendingOrders,
  };
};