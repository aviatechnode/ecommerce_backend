import { prisma } from "../../lib/prismadb.js";
import { StockReservationStatus } from "@prisma/client";

export class StockReservationService {
  /**
   * Reserve multiple items for an order (used at checkout)
   */
  static async reserveItems(input: {
    orderId: string;
    items: Array<{ variantId: string; quantity: number }>;
    expiresInMinutes?: number;
    warehouseId?: string;
  }) {
    const { orderId, items, expiresInMinutes = 15, warehouseId } = input;
    const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);

    const variantIds = items.map(i => i.variantId);
    // Build where clause: optionally filter by warehouseId
    const whereCondition: any = { variantId: { in: variantIds } };
    if (warehouseId) {
      whereCondition.warehouseId = warehouseId;
    }
    const inventories = await prisma.productInventory.findMany({
      where: whereCondition,
    });

    // Check availability
    for (const item of items) {
      const inv = inventories.find(i => i.variantId === item.variantId);
      if (!inv) {
        throw new Error(
          warehouseId
            ? `No inventory for variant ${item.variantId} at warehouse ${warehouseId}`
            : `No inventory for variant ${item.variantId}`
        );
      }
      const available = inv.stock - inv.reserved;
      if (available < item.quantity) {
        throw new Error(`Insufficient stock for variant ${item.variantId}. Available: ${available}`);
      }
    }

    // Create reservations in transaction
    const reservations = await prisma.$transaction(async (tx) => {
      const created = [];
      for (const item of items) {
        const inv = inventories.find(i => i.variantId === item.variantId)!;
        await tx.productInventory.update({
          where: { id: inv.id },
          data: { reserved: { increment: item.quantity } },
        });
        const reservation = await tx.stockReservation.create({
          data: {
            variantId: item.variantId,
            warehouseId: inv.warehouseId,
            orderId,
            quantity: item.quantity,
            expiresAt,
            status: StockReservationStatus.RESERVED,
          },
        });
        created.push(reservation);
      }
      return created;
    });

    return { reservations, expiresAt };
  }

  /**
   * Release all reservations for an order (payment failed / order expired)
   */
  static async releaseReservations(input: { orderId: string }) {
    const { orderId } = input;
    const reservations = await prisma.stockReservation.findMany({
      where: { orderId, status: StockReservationStatus.RESERVED },
    });
    if (reservations.length === 0) return { released: 0 };

    await prisma.$transaction(async (tx) => {
      for (const res of reservations) {
        await tx.productInventory.update({
          where: {
            variantId_warehouseId: {
              variantId: res.variantId,
              warehouseId: res.warehouseId,
            },
          },
          data: { reserved: { decrement: res.quantity } },
        });
        await tx.stockReservation.update({
          where: { id: res.id },
          data: { status: StockReservationStatus.RELEASED },
        });
      }
    });
    return { released: reservations.length };
  }

  /**
   * Confirm reservations (payment succeeded) – deduct stock permanently
   */
  static async confirmReservations(input: { orderId: string }) {
    const { orderId } = input;
    const reservations = await prisma.stockReservation.findMany({
      where: { orderId, status: StockReservationStatus.RESERVED },
      include: { variant: { include: { product: true } } },
    });
    if (reservations.length === 0) return { confirmed: 0 };

    await prisma.$transaction(async (tx) => {
      for (const res of reservations) {
        await tx.productInventory.update({
          where: {
            variantId_warehouseId: {
              variantId: res.variantId,
              warehouseId: res.warehouseId,
            },
          },
          data: {
            stock: { decrement: res.quantity },
            reserved: { decrement: res.quantity },
          },
        });
        await tx.stockReservation.update({
          where: { id: res.id },
          data: { status: StockReservationStatus.CONFIRMED },
        });
        await tx.inventoryMovement.create({
          data: {
            variantId: res.variantId,
            warehouseId: res.warehouseId,
            type: "SALE",
            quantity: res.quantity,
            note: `Order ${orderId} confirmed`,
          },
        });
        await tx.product.update({
          where: { id: res.variant.product.id },
          data: { soldCount: { increment: res.quantity } },
        });
      }
    });
    return { confirmed: reservations.length };
  }

  /**
   * Check stock availability without reserving
   */
  static async checkAvailability(input: {
    items: Array<{ variantId: string; quantity: number }>;
  }) {
    const { items } = input;
    const variantIds = items.map(i => i.variantId);
    const inventories = await prisma.productInventory.findMany({
      where: { variantId: { in: variantIds } },
    });

    const availability = items.map(item => {
      const inv = inventories.find(i => i.variantId === item.variantId);
      const available = inv ? inv.stock - inv.reserved : 0;
      return {
        variantId: item.variantId,
        requested: item.quantity,
        available,
        sufficient: available >= item.quantity,
      };
    });
    const allSufficient = availability.every(a => a.sufficient);
    return { allSufficient, availability };
  }

  /**
   * Clean up expired reservations (run via cron every few minutes)
   */
  static async releaseExpiredReservations() {
    const expired = await prisma.stockReservation.findMany({
      where: {
        status: StockReservationStatus.RESERVED,
        expiresAt: { lt: new Date() },
      },
    });
    let released = 0;
    for (const res of expired) {
      if (res.orderId) {
        await this.releaseReservations({ orderId: res.orderId });
        released++;
      }
    }
    return { released };
  }

  // ------------------------------------------------------------------
  // Single‑item versions (kept for flexibility, used internally if needed)
  // ------------------------------------------------------------------
  static async reserve(input: {
    variantId: string;
    warehouseId: string;
    quantity: number;
    orderId?: string;
    expiresInMinutes?: number;
  }) {
    const { variantId, warehouseId, quantity, orderId, expiresInMinutes = 15 } = input;
    const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);

    return prisma.$transaction(async (tx) => {
      const inventory = await tx.productInventory.findUniqueOrThrow({
        where: { variantId_warehouseId: { variantId, warehouseId } },
      });
      const available = inventory.stock - inventory.reserved;
      if (available < quantity) throw new Error("Out of stock");

      await tx.productInventory.update({
        where: { variantId_warehouseId: { variantId, warehouseId } },
        data: { reserved: { increment: quantity } },
      });

      return tx.stockReservation.create({
        data: {
          variantId,
          warehouseId,
          quantity,
          orderId: orderId ?? null,
          status: StockReservationStatus.RESERVED,
          expiresAt,
        },
      });
    });
  }

  static async release(reservationId: string) {
    return prisma.$transaction(async (tx) => {
      const reservation = await tx.stockReservation.findUniqueOrThrow({
        where: { id: reservationId },
      });
      await tx.productInventory.update({
        where: {
          variantId_warehouseId: {
            variantId: reservation.variantId,
            warehouseId: reservation.warehouseId,
          },
        },
        data: { reserved: { decrement: reservation.quantity } },
      });
      return tx.stockReservation.update({
        where: { id: reservationId },
        data: { status: StockReservationStatus.RELEASED },
      });
    });
  }

  static async confirm(orderId: string) {
    return this.confirmReservations({ orderId });
  }
}