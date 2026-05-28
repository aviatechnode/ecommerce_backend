import { prisma } from "../../lib/prismadb.js";

import { Prisma, ShipmentStatus } from "@prisma/client";

import {
  createShipmentSchema,
  updateShipmentSchema,
  shipmentIdParamSchema,
  type CreateShipmentInput,
  type UpdateShipmentInput,
} from "../../schemas/shipment/shipment.schema.js";

import { ShipmentEventService } from "./shipment-event.service.js";

/* =========================================================
HELPER: SAFE JSON NORMALIZER (CRITICAL FIX)
========================================================= */

const jsonField = (key: string, value: unknown) => {
  if (value === undefined || value === null) return {};
  return { [key]: value as Prisma.InputJsonValue };
};

/* =========================================================
SHIPMENT SERVICE
========================================================= */

export class ShipmentService {
  /* =========================================================
  CREATE SHIPMENT
  ========================================================= */

  static async createShipment(payload: CreateShipmentInput) {
    const parsed = createShipmentSchema.parse(payload);

    const order = await prisma.order.findUnique({
      where: { id: parsed.orderId },
      include: { items: true },
    });

    if (!order) throw new Error("Order not found");

    const fulfillment = await prisma.fulfillment.findUnique({
      where: { id: parsed.fulfillmentId },
    });

    if (!fulfillment) throw new Error("Fulfillment not found");

    const courier = await prisma.courier.findUnique({
      where: { id: parsed.courierId },
    });

    if (!courier) throw new Error("Courier not found");

    if (parsed.pickupStationId) {
      const pickupStation = await prisma.pickupStation.findUnique({
        where: { id: parsed.pickupStationId },
      });

      if (!pickupStation || !pickupStation.isActive) {
        throw new Error("Invalid or inactive pickup station");
      }
    }

    if (parsed.shippingRateId) {
      const shippingRate = await prisma.shippingRate.findUnique({
        where: { id: parsed.shippingRateId },
      });

      if (!shippingRate || !shippingRate.isActive) {
        throw new Error("Invalid or inactive shipping rate");
      }
    }

    if (parsed.returnRequestId) {
      const returnRequest = await prisma.returnRequest.findUnique({
        where: { id: parsed.returnRequestId },
      });

      if (!returnRequest) {
        throw new Error("Return request not found");
      }
    }

    const orderItemIds = order.items.map((i) => i.id);

    for (const item of parsed.items) {
      if (!orderItemIds.includes(item.orderItemId)) {
        throw new Error(
          `Order item ${item.orderItemId} does not belong to this order`
        );
      }

      const orderItem = order.items.find(
        (i) => i.id === item.orderItemId
      );

      if (!orderItem) throw new Error("Order item not found");

      if (item.quantity > orderItem.quantity) {
        throw new Error(
          `Shipment quantity exceeds order quantity for item ${item.orderItemId}`
        );
      }
    }

    const trackingNumber =
      parsed.trackingNumber ??
      `TRK-${Date.now()}-${Math.floor(Math.random() * 999999)}`;

    const shipment = await prisma.shipment.create({
      data: {
        fulfillmentId: parsed.fulfillmentId,
        orderId: parsed.orderId,
        type: parsed.type,
        courierId: parsed.courierId,
        shippingRateId: parsed.shippingRateId ?? null,
        trackingNumber,
        status: parsed.status ?? ShipmentStatus.PENDING,
        shippingMethod: parsed.shippingMethod,
        deliveryFee: parsed.deliveryFee,
        weight: parsed.weight ?? null,
        volumetricWeight: parsed.volumetricWeight ?? null,
        chargeableWeight: parsed.chargeableWeight ?? null,
        estimatedDeliveryDate: parsed.estimatedDeliveryDate ?? null,
        pickupStationId: parsed.pickupStationId ?? null,
        handedToCourierAt: parsed.handedToCourierAt ?? null,
        inTransitAt: parsed.inTransitAt ?? null,
        deliveredAt: parsed.deliveredAt ?? null,
        failedAt: parsed.failedAt ?? null,
        failureReason: parsed.failureReason ?? null,
        ...(parsed.metadata != null && {
  metadata: parsed.metadata as Prisma.InputJsonValue,
}),

        returnRequestId: parsed.returnRequestId ?? null,

        items: {
          create: parsed.items.map((item) => ({
            orderItemId: item.orderItemId,
            quantity: item.quantity,
          })),
        },
      },

      include: {
        fulfillment: true,
        courier: true,
        shippingRate: true,
        pickupStation: true,
        order: true,
        items: { include: { orderItem: true } },
        events: true,
      },
    });

    await ShipmentEventService.addSystemEvent({
      shipmentId: shipment.id,
      status: shipment.status,
      title: "Shipment created",
      description: "Shipment has been created successfully",
    });

    return shipment;
  }

  /* =========================================================
  GET ALL
  ========================================================= */

  static async getAll(params?: {
    page?: number;
    limit?: number;
    status?: ShipmentStatus;
    courierId?: string;
    search?: string;
  }) {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 20;

    const where: any = {};

    if (params?.status) where.status = params.status;
    if (params?.courierId) where.courierId = params.courierId;

    if (params?.search) {
      where.OR = [
        {
          trackingNumber: {
            contains: params.search,
            mode: "insensitive",
          },
        },
        {
          orderId: {
            contains: params.search,
            mode: "insensitive",
          },
        },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.shipment.findMany({
        where,
        include: {
          fulfillment: true,
          courier: true,
          order: true,
          shippingRate: true,
          pickupStation: true,
          items: { include: { orderItem: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.shipment.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /* =========================================================
  GET BY ID
  ========================================================= */

  static async getById(id: string) {
    const { id: shipmentId } = shipmentIdParamSchema.parse({ id });

    const shipment = await prisma.shipment.findUnique({
      where: { id: shipmentId },
      include: {
        fulfillment: true,
        courier: true,
        order: true,
        shippingRate: true,
        pickupStation: true,
        items: { include: { orderItem: true } },
        events: { orderBy: { createdAt: "asc" } },
      },
    });

    if (!shipment) throw new Error("Shipment not found");

    return shipment;
  }

  /* =========================================================
  UPDATE SHIPMENT
  ========================================================= */

  static async updateShipment(id: string, payload: UpdateShipmentInput) {
    const { id: shipmentId } = shipmentIdParamSchema.parse({ id });
    const parsed = updateShipmentSchema.parse(payload);

    const existing = await prisma.shipment.findUnique({
      where: { id: shipmentId },
      include: { items: true },
    });

    if (!existing) throw new Error("Shipment not found");

    const updated = await prisma.shipment.update({
      where: { id: shipmentId },
      data: {
        ...(parsed.metadata != null && {
        metadata: parsed.metadata as Prisma.InputJsonValue,
        }),
        ...(parsed.fulfillmentId !== undefined
          ? { fulfillmentId: parsed.fulfillmentId }
          : {}),

        ...(parsed.type !== undefined ? { type: parsed.type } : {}),
        ...(parsed.courierId !== undefined
          ? { courierId: parsed.courierId }
          : {}),
        ...(parsed.shippingRateId !== undefined
          ? { shippingRateId: parsed.shippingRateId }
          : {}),
        ...(parsed.pickupStationId !== undefined
          ? { pickupStationId: parsed.pickupStationId }
          : {}),
        ...(parsed.returnRequestId !== undefined
          ? { returnRequestId: parsed.returnRequestId }
          : {}),
        ...(parsed.trackingNumber !== undefined
          ? { trackingNumber: parsed.trackingNumber }
          : {}),
        ...(parsed.status !== undefined
          ? { status: parsed.status }
          : {}),
        ...(parsed.shippingMethod !== undefined
          ? { shippingMethod: parsed.shippingMethod }
          : {}),
        ...(parsed.deliveryFee !== undefined
          ? { deliveryFee: parsed.deliveryFee }
          : {}),
        ...(parsed.weight !== undefined
          ? { weight: parsed.weight }
          : {}),
        ...(parsed.volumetricWeight !== undefined
          ? { volumetricWeight: parsed.volumetricWeight }
          : {}),
        ...(parsed.chargeableWeight !== undefined
          ? { chargeableWeight: parsed.chargeableWeight }
          : {}),
        ...(parsed.estimatedDeliveryDate !== undefined
          ? { estimatedDeliveryDate: parsed.estimatedDeliveryDate }
          : {}),
        ...(parsed.handedToCourierAt !== undefined
          ? { handedToCourierAt: parsed.handedToCourierAt }
          : {}),
        ...(parsed.inTransitAt !== undefined
          ? { inTransitAt: parsed.inTransitAt }
          : {}),
        ...(parsed.deliveredAt !== undefined
          ? { deliveredAt: parsed.deliveredAt }
          : {}),
        ...(parsed.failedAt !== undefined
          ? { failedAt: parsed.failedAt }
          : {}),
        ...(parsed.failureReason !== undefined
          ? { failureReason: parsed.failureReason }
          : {}),

        ...(parsed.items
          ? {
              items: {
                deleteMany: {},
                create: parsed.items.map((item) => ({
                  orderItemId: item.orderItemId,
                  quantity: item.quantity,
                })),
              },
            }
          : {}),
      },

      include: {
        fulfillment: true,
        courier: true,
        order: true,
        shippingRate: true,
        pickupStation: true,
        items: { include: { orderItem: true } },
        events: true,
      },
    });

    if (parsed.status && parsed.status !== existing.status) {
      await ShipmentEventService.logStatusChange({
        shipmentId,
        status: parsed.status,
      });
    }

    return updated;
  }

  /* =========================================================
  UPDATE STATUS
  ========================================================= */

  static async updateStatus(params: {
    id: string;
    status: ShipmentStatus;
    location?: string;
    failureReason?: string;
  }) {
    const shipment = await this.getById(params.id);

    const updateData: any = {
      status: params.status,
    };

    if (params.status === ShipmentStatus.IN_TRANSIT) {
      updateData.inTransitAt = new Date();
    }

    if (params.status === ShipmentStatus.DELIVERED) {
      updateData.deliveredAt = new Date();
    }

    if (params.status === ShipmentStatus.FAILED) {
      updateData.failedAt = new Date();
      updateData.failureReason = params.failureReason ?? null;
    }

    const updated = await prisma.shipment.update({
      where: { id: shipment.id },
      data: updateData,
    });

    await ShipmentEventService.logStatusChange({
      shipmentId: shipment.id,
      status: params.status,
      ...(params.location !== undefined
        ? { location: params.location }
        : {}),
    });

    return updated;
  }

  /* =========================================================
  DELETE
  ========================================================= */

  static async deleteShipment(id: string) {
    const { id: shipmentId } = shipmentIdParamSchema.parse({ id });

    const shipment = await prisma.shipment.findUnique({
      where: { id: shipmentId },
      include: { events: true },
    });

    if (!shipment) throw new Error("Shipment not found");

    if (shipment.events.length > 0) {
      throw new Error("Cannot delete shipment with tracking history");
    }

    return prisma.shipment.delete({
      where: { id: shipmentId },
    });
  }

  /* =========================================================
  TRACK
  ========================================================= */

  static async trackShipment(trackingNumber: string) {
    const shipment = await prisma.shipment.findUnique({
      where: { trackingNumber },
      include: {
        courier: true,
        pickupStation: true,
        items: { include: { orderItem: true } },
        events: { orderBy: { createdAt: "asc" } },
      },
    });

    if (!shipment) throw new Error("Shipment not found");

    return shipment;
  }
}