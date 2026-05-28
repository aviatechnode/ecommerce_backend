import { prisma } from "../../lib/prismadb.js";

import {
  type CreateFulfillmentInput,
  type UpdateFulfillmentInput,
} from "../../schemas/shipment/fulfillment.schema.js";

export class FulfillmentService {
  static async create(data: CreateFulfillmentInput) {
  return prisma.fulfillment.create({
    data: {
      orderId: data.orderId,
      warehouseId: data.warehouseId,
      status: data.status,

      ...(data.pickingStartedAt !== undefined && {
        pickingStartedAt: data.pickingStartedAt,
      }),

      ...(data.packedAt !== undefined && {
        packedAt: data.packedAt,
      }),

      ...(data.dispatchedAt !== undefined && {
        dispatchedAt: data.dispatchedAt,
      }),

      ...(data.notes !== undefined && {
        notes: data.notes,
      }),

      // ✅ IMPORTANT FIX: conditional object spread (NOT ternary with undefined)
      ...(data.items && {
        items: {
          create: data.items.map((item) => ({
            orderItemId: item.orderItemId,
            quantity: item.quantity,
          })),
        },
      }),
    },

    include: {
      order: true,
      warehouse: true,
      items: {
        include: {
          orderItem: true,
        },
      },
      shipments: true,
    },
  });
}

  static async findAll() {
    return prisma.fulfillment.findMany({
      include: {
        order: true,

        warehouse: true,

        items: {
          include: {
            orderItem: true,
          },
        },

        shipments: true,
      },

      orderBy: {
        createdAt: "desc",
      },
    });
  }

  static async findById(id: string) {
    return prisma.fulfillment.findUnique({
      where: { id },

      include: {
        order: true,

        warehouse: true,

        items: {
          include: {
            orderItem: true,
          },
        },

        shipments: true,
      },
    });
  }

  static async findByOrder(orderId: string) {
    return prisma.fulfillment.findMany({
      where: {
        orderId,
      },

      include: {
        warehouse: true,

        items: {
          include: {
            orderItem: true,
          },
        },

        shipments: true,
      },

      orderBy: {
        createdAt: "desc",
      },
    });
  }

  static async update(id: string, data: UpdateFulfillmentInput) {
    return prisma.fulfillment.update({
      where: { id },

      data: {
        ...(data.orderId && {
          orderId: data.orderId,
        }),

        ...(data.warehouseId && {
          warehouseId: data.warehouseId,
        }),

        ...(data.status && {
          status: data.status,
        }),

        ...(data.pickingStartedAt !== undefined && {
          pickingStartedAt: data.pickingStartedAt,
        }),

        ...(data.packedAt !== undefined && {
          packedAt: data.packedAt,
        }),

        ...(data.dispatchedAt !== undefined && {
          dispatchedAt: data.dispatchedAt,
        }),

        ...(data.notes !== undefined && {
          notes: data.notes,
        }),
      },

      include: {
        order: true,

        warehouse: true,

        items: {
          include: {
            orderItem: true,
          },
        },

        shipments: true,
      },
    });
  }

  static async delete(id: string) {
    return prisma.fulfillment.delete({
      where: { id },
    });
  }
}