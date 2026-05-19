// src/services/inventory/stock-reservation.service.ts

import {
  Prisma,
  StockReservationStatus,
} from "@prisma/client";

import { prisma } from "../lib/prismadb.js";

import {
  createStockReservationSchema,
  updateStockReservationStatusSchema,
  stockReservationIdParamSchema,
} from "../schemas/stock.reservation.schema.js";

export class StockReservationService {
  ////////////////////////////////////////////////////////////
  // CREATE RESERVATION
  ////////////////////////////////////////////////////////////

  static async createReservation(data: unknown) {
    const parsed = createStockReservationSchema.parse(data);

    return await prisma.$transaction(async (tx) => {
      ////////////////////////////////////////////////////////
      // VALIDATE VARIANT
      ////////////////////////////////////////////////////////

      const variant = await tx.productVariant.findUnique({
        where: {
          id: parsed.variantId,
        },
      });

      if (!variant) {
        throw new Error("Product variant not found");
      }

      ////////////////////////////////////////////////////////
      // VALIDATE WAREHOUSE INVENTORY
      ////////////////////////////////////////////////////////

      const inventory = await tx.productInventory.findUnique({
        where: {
          variantId_warehouseId: {
            variantId: parsed.variantId,
            warehouseId: parsed.warehouseId,
          },
        },
      });

      if (!inventory) {
        throw new Error("Inventory record not found");
      }

      ////////////////////////////////////////////////////////
      // CHECK AVAILABLE STOCK
      ////////////////////////////////////////////////////////

      const availableStock =
        inventory.stock - inventory.reserved;

      if (availableStock < parsed.quantity) {
        throw new Error(
          `Insufficient stock. Available: ${availableStock}`
        );
      }

      ////////////////////////////////////////////////////////
      // UPDATE RESERVED STOCK
      ////////////////////////////////////////////////////////

      await tx.productInventory.update({
        where: {
          variantId_warehouseId: {
            variantId: parsed.variantId,
            warehouseId: parsed.warehouseId,
          },
        },
        data: {
          reserved: {
            increment: parsed.quantity,
          },
        },
      });

      ////////////////////////////////////////////////////////
      // CREATE RESERVATION
      ////////////////////////////////////////////////////////
      const reservation = await tx.stockReservation.create({
        data: {
            variantId: parsed.variantId,
            warehouseId: parsed.warehouseId,
            orderId: parsed.orderId ?? null,
            quantity: parsed.quantity,
            expiresAt: parsed.expiresAt,
            status: StockReservationStatus.RESERVED,
            },
        include: {
          variant: true,
          warehouse: true,
          order: true,
        },
      });

      return reservation;
    });
  }

  ////////////////////////////////////////////////////////////
  // CONFIRM RESERVATION
  ////////////////////////////////////////////////////////////

  static async confirmReservation(id: string) {
    const parsed =
      stockReservationIdParamSchema.parse({ id });

    return await prisma.$transaction(async (tx) => {
      const reservation =
        await tx.stockReservation.findUnique({
          where: {
            id: parsed.id,
          },
        });

      if (!reservation) {
        throw new Error(
          "Stock reservation not found"
        );
      }

      if (
        reservation.status !==
        StockReservationStatus.RESERVED
      ) {
        throw new Error(
          "Only RESERVED reservations can be confirmed"
        );
      }

      ////////////////////////////////////////////////////////
      // REDUCE STOCK + RESERVED
      ////////////////////////////////////////////////////////

      await tx.productInventory.update({
        where: {
          variantId_warehouseId: {
            variantId: reservation.variantId,
            warehouseId: reservation.warehouseId,
          },
        },
        data: {
          stock: {
            decrement: reservation.quantity,
          },
          reserved: {
            decrement: reservation.quantity,
          },
        },
      });

      ////////////////////////////////////////////////////////
      // CREATE INVENTORY MOVEMENT
      ////////////////////////////////////////////////////////

      await tx.inventoryMovement.create({
        data: {
          variantId: reservation.variantId,
          warehouseId: reservation.warehouseId,
          type: "SALE",
          quantity: reservation.quantity,
          note: `Stock reservation confirmed (${reservation.id})`,
        },
      });

      ////////////////////////////////////////////////////////
      // UPDATE RESERVATION STATUS
      ////////////////////////////////////////////////////////

      return await tx.stockReservation.update({
        where: {
          id: reservation.id,
        },
        data: {
          status: StockReservationStatus.CONFIRMED,
        },
        include: {
          variant: true,
          warehouse: true,
          order: true,
        },
      });
    });
  }

  ////////////////////////////////////////////////////////////
  // RELEASE RESERVATION
  ////////////////////////////////////////////////////////////

  static async releaseReservation(id: string) {
    const parsed =
      stockReservationIdParamSchema.parse({ id });

    return await prisma.$transaction(async (tx) => {
      const reservation =
        await tx.stockReservation.findUnique({
          where: {
            id: parsed.id,
          },
        });

      if (!reservation) {
        throw new Error(
          "Stock reservation not found"
        );
      }

      if (
        reservation.status !==
        StockReservationStatus.RESERVED
      ) {
        throw new Error(
          "Only RESERVED reservations can be released"
        );
      }

      ////////////////////////////////////////////////////////
      // DECREMENT RESERVED STOCK
      ////////////////////////////////////////////////////////

      await tx.productInventory.update({
        where: {
          variantId_warehouseId: {
            variantId: reservation.variantId,
            warehouseId: reservation.warehouseId,
          },
        },
        data: {
          reserved: {
            decrement: reservation.quantity,
          },
        },
      });

      ////////////////////////////////////////////////////////
      // UPDATE RESERVATION
      ////////////////////////////////////////////////////////

      return await tx.stockReservation.update({
        where: {
          id: reservation.id,
        },
        data: {
          status: StockReservationStatus.RELEASED,
        },
        include: {
          variant: true,
          warehouse: true,
          order: true,
        },
      });
    });
  }

  ////////////////////////////////////////////////////////////
  // EXPIRE RESERVATION
  ////////////////////////////////////////////////////////////

  static async expireReservation(id: string) {
    const parsed =
      stockReservationIdParamSchema.parse({ id });

    return await prisma.$transaction(async (tx) => {
      const reservation =
        await tx.stockReservation.findUnique({
          where: {
            id: parsed.id,
          },
        });

      if (!reservation) {
        throw new Error(
          "Stock reservation not found"
        );
      }

      if (
        reservation.status !==
        StockReservationStatus.RESERVED
      ) {
        throw new Error(
          "Only RESERVED reservations can expire"
        );
      }

      ////////////////////////////////////////////////////////
      // RELEASE RESERVED STOCK
      ////////////////////////////////////////////////////////

      await tx.productInventory.update({
        where: {
          variantId_warehouseId: {
            variantId: reservation.variantId,
            warehouseId: reservation.warehouseId,
          },
        },
        data: {
          reserved: {
            decrement: reservation.quantity,
          },
        },
      });

      ////////////////////////////////////////////////////////
      // UPDATE STATUS
      ////////////////////////////////////////////////////////

      return await tx.stockReservation.update({
        where: {
          id: reservation.id,
        },
        data: {
          status: StockReservationStatus.EXPIRED,
        },
        include: {
          variant: true,
          warehouse: true,
          order: true,
        },
      });
    });
  }

  ////////////////////////////////////////////////////////////
  // EXPIRE ALL OVERDUE RESERVATIONS
  ////////////////////////////////////////////////////////////

  static async expireOverdueReservations() {
    const overdueReservations =
      await prisma.stockReservation.findMany({
        where: {
          status: StockReservationStatus.RESERVED,
          expiresAt: {
            lte: new Date(),
          },
        },
      });

    const results = [];

    for (const reservation of overdueReservations) {
      const expired =
        await this.expireReservation(reservation.id);

      results.push(expired);
    }

    return results;
  }

  ////////////////////////////////////////////////////////////
  // GET RESERVATION
  ////////////////////////////////////////////////////////////

  static async getReservationById(id: string) {
    const parsed =
      stockReservationIdParamSchema.parse({ id });

    const reservation =
      await prisma.stockReservation.findUnique({
        where: {
          id: parsed.id,
        },
        include: {
          variant: {
            include: {
              product: true,
            },
          },
          warehouse: {
            include: {
              state: true,
            },
          },
          order: true,
        },
      });

    if (!reservation) {
      throw new Error(
        "Stock reservation not found"
      );
    }

    return reservation;
  }

  ////////////////////////////////////////////////////////////
  // GET ALL RESERVATIONS
  ////////////////////////////////////////////////////////////

  static async getReservations(filters?: {
    status?: StockReservationStatus;
    orderId?: string;
    variantId?: string;
  }) {
    const where: Prisma.StockReservationWhereInput =
      {};

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.orderId) {
      where.orderId = filters.orderId;
    }

    if (filters?.variantId) {
      where.variantId = filters.variantId;
    }

    return await prisma.stockReservation.findMany({
      where,
      include: {
        variant: {
          include: {
            product: true,
          },
        },
        warehouse: true,
        order: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  ////////////////////////////////////////////////////////////
  // UPDATE STATUS
  ////////////////////////////////////////////////////////////

  static async updateReservationStatus(
    id: string,
    data: unknown
  ) {
    const parsedId =
      stockReservationIdParamSchema.parse({ id });

    const parsed =
      updateStockReservationStatusSchema.parse(
        data
      );

    const reservation =
      await prisma.stockReservation.findUnique({
        where: {
          id: parsedId.id,
        },
      });

    if (!reservation) {
      throw new Error(
        "Stock reservation not found"
      );
    }

    return await prisma.stockReservation.update({
      where: {
        id: parsedId.id,
      },
      data: {
        status: parsed.status,
      },
    });
  }

  ////////////////////////////////////////////////////////////
  // DELETE RESERVATION
  ////////////////////////////////////////////////////////////

  static async deleteReservation(id: string) {
    const parsed =
      stockReservationIdParamSchema.parse({ id });

    const reservation =
      await prisma.stockReservation.findUnique({
        where: {
          id: parsed.id,
        },
      });

    if (!reservation) {
      throw new Error(
        "Stock reservation not found"
      );
    }

    //////////////////////////////////////////////////////////
    // RELEASE RESERVED STOCK FIRST
    //////////////////////////////////////////////////////////

    if (
      reservation.status ===
      StockReservationStatus.RESERVED
    ) {
      await prisma.productInventory.update({
        where: {
          variantId_warehouseId: {
            variantId: reservation.variantId,
            warehouseId: reservation.warehouseId,
          },
        },
        data: {
          reserved: {
            decrement: reservation.quantity,
          },
        },
      });
    }

    return await prisma.stockReservation.delete({
      where: {
        id: parsed.id,
      },
    });
  }
}