import { prisma } from "../lib/prismadb.js";
import { ConversationStatus } from "@prisma/client";

const startOfToday = () => {
  const d = new Date();

  d.setHours(0, 0, 0, 0);

  return d;
};

export const getDashboardStats = async () => {
  const today = startOfToday();

  const [
    totalUsers,
    totalOrders,
    totalProducts,
    totalConversations,
    openConversations,
    revenueAgg,
    todayUsers,
    todayOrders,
    todayRevenueAgg,
    pendingOrders,
    activeCarts,
    unreadMessages,
    unreadNotifications,
  ] = await Promise.all([
    // =========================================================
    // TOTAL COUNTS
    // =========================================================

    prisma.user.count(),

    prisma.order.count(),

    prisma.product.count(),

    prisma.conversation.count(),

    prisma.conversation.count({
      where: {
        status: {
          in: [
            ConversationStatus.OPEN,
            ConversationStatus.PENDING_CUSTOMER,
            ConversationStatus.PENDING_SUPPORT
          ],
        },
      },
    }),

    // =========================================================
    // REVENUE
    // =========================================================

    prisma.order.aggregate({
      _sum: {
        totalAmount: true,
      },

      where: {
        paymentStatus: "PAID",
      },
    }),

    // =========================================================
    // TODAY STATS
    // =========================================================

    prisma.user.count({
      where: {
        createdAt: {
          gte: today,
        },
      },
    }),

    prisma.order.count({
      where: {
        createdAt: {
          gte: today,
        },
      },
    }),

    prisma.order.aggregate({
      _sum: {
        totalAmount: true,
      },

      where: {
        createdAt: {
          gte: today,
        },

        paymentStatus: "PAID",
      },
    }),

    // =========================================================
    // OPERATIONS
    // =========================================================

    prisma.order.count({
      where: {
        status: "PENDING_PAYMENT",
      },
    }),

    prisma.cart.count(),

    // =========================================================
    // UNREAD MESSAGES
    // =========================================================
    // Since Message no longer has `isRead`,
    // unread = messages without readAt
    // or delivery not read

    prisma.message.count({
      where: {
        deletedAt: null,

        OR: [
          {
            readAt: null,
          },

          {
            deliveryStatus: {
              not: "READ",
            },
          },
        ],
      },
    }),

    // =========================================================
    // NOTIFICATIONS
    // =========================================================

    prisma.notification.count({
      where: {
        isRead: false,
      },
    }),
  ]);

  // =========================================================
  // LOW STOCK
  // =========================================================

  const lowStockResult = await prisma.$queryRaw<
    { count: number }[]
  >`
    SELECT COUNT(*)::int AS count
    FROM "ProductInventory"
    WHERE threshold IS NOT NULL
    AND stock <= threshold
  `;

  const lowStockProducts =
    lowStockResult[0]?.count || 0;

  return {
    overview: {
      users: totalUsers,

      orders: totalOrders,

      products: totalProducts,

      conversations: totalConversations,

      revenue:
        revenueAgg._sum.totalAmount?.toNumber() || 0,
    },

    today: {
      users: todayUsers,

      orders: todayOrders,

      revenue:
        todayRevenueAgg._sum.totalAmount?.toNumber() ||
        0,
    },

    operations: {
      pendingOrders,

      lowStockProducts,

      activeCarts,

      openConversations,
    },

    engagement: {
      unreadMessages,

      unreadNotifications,
    },
  };
};

export const getDashboardChart = async (
  days = 7
) => {
  const fromDate = new Date();

  fromDate.setDate(
    fromDate.getDate() - days
  );

  const snapshots =
    await prisma.dashboardSnapshot.findMany({
      where: {
        date: {
          gte: fromDate,
        },
      },

      orderBy: {
        date: "asc",
      },
    });

  return snapshots.map((s) => ({
    date: s.date,

    revenue: s.totalRevenue.toNumber(),

    orders: s.totalOrders,

    users: s.totalUsers,
  }));
};

export const getDashboardChartWithToday =
  async (days = 7) => {
    const today = startOfToday();

    const [
      chart,
      todayOrders,
      todayUsers,
      todayRevenueAgg,
    ] = await Promise.all([
      getDashboardChart(days),

      prisma.order.count({
        where: {
          createdAt: {
            gte: today,
          },
        },
      }),

      prisma.user.count({
        where: {
          createdAt: {
            gte: today,
          },
        },
      }),

      prisma.order.aggregate({
        _sum: {
          totalAmount: true,
        },

        where: {
          createdAt: {
            gte: today,
          },

          paymentStatus: "PAID",
        },
      }),
    ]);

    chart.push({
      date: new Date(),

      revenue:
        todayRevenueAgg._sum.totalAmount?.toNumber() ||
        0,

      orders: todayOrders,

      users: todayUsers,
    });

    return chart;
  };

// =========================================================
// OPTIONAL: CONVERSATION ANALYTICS
// =========================================================

export const getConversationStats = async () => {
  const [
    totalConversations,
    openConversations,
    resolvedConversations,
    highPriorityConversations,
    unreadConversationParticipants,
    messagesToday,
  ] = await Promise.all([
    prisma.conversation.count(),

    prisma.conversation.count({
      where: {
        status: "OPEN",
      },
    }),

    prisma.conversation.count({
      where: {
        status: "RESOLVED",
      },
    }),

    prisma.conversation.count({
      where: {
        priority: "HIGH",
      },
    }),

    prisma.conversationParticipant.count({
      where: {
        unreadCount: {
          gt: 0,
        },
      },
    }),

    prisma.message.count({
      where: {
        createdAt: {
          gte: startOfToday(),
        },

        deletedAt: null,
      },
    }),
  ]);

  return {
    totalConversations,

    openConversations,

    resolvedConversations,

    highPriorityConversations,

    unreadConversationParticipants,

    messagesToday,
  };
};