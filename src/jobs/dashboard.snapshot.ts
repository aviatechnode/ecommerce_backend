import { prisma } from "../lib/prismadb.js";

export const generateDashboardSnapshot = async () => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);

  const exists = await prisma.dashboardSnapshot.findUnique({
    where: { date },
  });

  if (exists) return;

  const [totalUsers, totalOrders, revenueAgg] = await Promise.all([
    prisma.user.count(),
    prisma.order.count(),
    prisma.order.aggregate({
      _sum: { totalAmount: true },
      where: { paymentStatus: "SUCCESS" },
    }),
  ]);

  await prisma.dashboardSnapshot.create({
    data: {
      date,
      totalUsers,
      totalOrders,
      totalRevenue: revenueAgg._sum.totalAmount || 0,
    },
  });

  console.log("✅ Snapshot created");
};