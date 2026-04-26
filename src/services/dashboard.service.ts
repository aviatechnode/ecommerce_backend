import { prisma } from "../lib/prismadb.js";

/* =========================================================
   HELPERS
========================================================= */
const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

/* =========================================================
   MAIN DASHBOARD STATS
========================================================= */
export const getDashboardStats = async () => {
  const today = startOfToday();

  const [
    // OVERVIEW (ALL TIME)
    totalUsers,
    totalOrders,
    totalProducts,
    revenueAgg,

    // TODAY (REAL-TIME)
    todayUsers,
    todayOrders,
    todayRevenueAgg,

    // OPERATIONS
    pendingOrders,
    activeCarts,

    // ENGAGEMENT
    unreadMessages,
    unreadNotifications,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.order.count(),
    prisma.product.count(),

    prisma.order.aggregate({
      _sum: { totalAmount: true },
      where: { paymentStatus: "SUCCESS" },
    }),

    prisma.user.count({
      where: { createdAt: { gte: today } },
    }),

    prisma.order.count({
      where: { createdAt: { gte: today } },
    }),

    prisma.order.aggregate({
      _sum: { totalAmount: true },
      where: {
        createdAt: { gte: today },
        paymentStatus: "SUCCESS",
      },
    }),

    prisma.order.count({
      where: { status: "PENDING" },
    }),

    prisma.cart.count(),

    prisma.message.count({
      where: { isRead: false },
    }),

    prisma.notification.count({
      where: { isRead: false },
    }),
  ]);

  /* =========================================================
     LOW STOCK (FIXED - RAW SQL)
  ========================================================= */
  const lowStockResult = await prisma.$queryRaw<
    { count: number }[]
  >`
    SELECT COUNT(*)::int AS count
    FROM "ProductInventory"
    WHERE threshold IS NOT NULL
    AND stock <= threshold
  `;

  const lowStockProducts = lowStockResult[0]?.count || 0;

  return {
    overview: {
      users: totalUsers,
      orders: totalOrders,
      products: totalProducts,
      revenue: revenueAgg._sum.totalAmount?.toNumber() || 0,
    },

    today: {
      users: todayUsers,
      orders: todayOrders,
      revenue: todayRevenueAgg._sum.totalAmount?.toNumber() || 0,
    },

    operations: {
      pendingOrders,
      lowStockProducts,
      activeCarts,
    },

    engagement: {
      unreadMessages,
      unreadNotifications,
    },
  };
};

/* =========================================================
   SNAPSHOT-BASED CHART (FAST 🚀)
========================================================= */
export const getDashboardChart = async (days = 7) => {
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - days);

  const snapshots = await prisma.dashboardSnapshot.findMany({
    where: {
      date: { gte: fromDate },
    },
    orderBy: { date: "asc" },
  });

  return snapshots.map((s) => ({
    date: s.date,
    revenue: s.totalRevenue.toNumber(),
    orders: s.totalOrders,
    users: s.totalUsers,
  }));
};

/* =========================================================
   HYBRID CHART (SNAPSHOT + TODAY LIVE)
========================================================= */
export const getDashboardChartWithToday = async (days = 7) => {
  const today = startOfToday();

  const [chart, todayOrders, todayUsers, todayRevenueAgg] =
    await Promise.all([
      getDashboardChart(days),

      prisma.order.count({
        where: { createdAt: { gte: today } },
      }),

      prisma.user.count({
        where: { createdAt: { gte: today } },
      }),

      prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: {
          createdAt: { gte: today },
          paymentStatus: "SUCCESS",
        },
      }),
    ]);

  chart.push({
    date: new Date(),
    revenue: todayRevenueAgg._sum.totalAmount?.toNumber() || 0,
    orders: todayOrders,
    users: todayUsers,
  });

  return chart;
};