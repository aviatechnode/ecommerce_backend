import { prisma } from "../../lib/prismadb.js";
import { ShipmentStatus, ShippingMethod } from "@prisma/client";

import {
  createShipmentSchema,
  updateShipmentSchema,
  shipmentIdParamSchema,
  type CreateShipmentInput,
  type UpdateShipmentInput,
} from "../../schemas/shipment/shipment.schema.js";
import { ShipmentEventService } from "./shipment-event.service.js";

// SHIPMENT SERVICE
export class ShipmentService {
  
  // CREATE SHIPMENT
  static async createShipment(payload: CreateShipmentInput) {
    const parsed = createShipmentSchema.parse(payload);

   // 1. Validate order
    const order = await prisma.order.findUnique({
      where: { id: parsed.orderId },
    });
    if (!order) throw new Error("Order not found");

    // 2. Validate courier
    const courier = await prisma.courier.findUnique({
      where: { id: parsed.courierId },
    });
    if (!courier) throw new Error("Courier not found");

    // 3. Validate pickup station
    if (parsed.pickupStationId) {
      const station = await prisma.pickupStation.findUnique({
        where: { id: parsed.pickupStationId },
      });

      if (!station || !station.isActive) {
        throw new Error("Invalid or inactive pickup station");
      }
    }
    
    // 4. Validate shipping rate (if provided)
    if (parsed.shippingRateId) {
      const rate = await prisma.shippingRate.findUnique({
        where: { id: parsed.shippingRateId },
      });

      if (!rate || !rate.isActive) {
        throw new Error("Invalid or inactive shipping rate");
      }
    }

    // 5. Generate tracking number
    const trackingNumber = `TRK-${Date.now()}-${Math.floor(
      Math.random() * 9999
    )}`;

    // 6. Create shipment
    const shipment = await prisma.shipment.create({
      data: {
        orderId: parsed.orderId,
        courierId: parsed.courierId,
        shippingRateId: parsed.shippingRateId ?? null,

        trackingNumber,
        status: parsed.status ?? ShipmentStatus.PENDING,

        shippingMethod: parsed.shippingMethod,

        deliveryFee: parsed.deliveryFee,
        heavyItemSurcharge: parsed.heavyItemSurcharge ?? null,
        fragileFee: parsed.fragileFee ?? null,
        sameDayFee: parsed.sameDayFee ?? null,

        weight: parsed.weight ?? null,
        volumetricWeight: parsed.volumetricWeight ?? null,
        chargeableWeight: parsed.chargeableWeight ?? null,

        estimatedDays: parsed.estimatedDays ?? null,

        shippedAt: parsed.shippedAt ?? null,
        deliveredAt: parsed.deliveredAt ?? null,

        pickupStationId: parsed.pickupStationId ?? null,

        notes: parsed.notes ?? null,
        failedReason: parsed.failedReason ?? null,
      },
      include: {
        courier: true,
        order: true,
        shippingRate: true,
        pickupStation: true,
        events: true,
      },
    });

    // 7. Initial event
    await ShipmentEventService.addSystemEvent({
      shipmentId: shipment.id,
      status: shipment.status,
      title: "Shipment created",
      description: "Shipment has been created successfully",
    });

    return shipment;
  }

  // GET ALL
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
          courier: true,
          order: true,
          pickupStation: true,
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

  
  // GET BY ID
  static async getById(id: string) {
    const { id: shipmentId } = shipmentIdParamSchema.parse({ id });

    const shipment = await prisma.shipment.findUnique({
      where: { id: shipmentId },
      include: {
        courier: true,
        order: true,
        shippingRate: true,
        pickupStation: true,
        events: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!shipment) throw new Error("Shipment not found");

    return shipment;
  }

  // UPDATE SHIPMENT (SAFE PATCH)
  static async updateShipment(
    id: string,
    payload: UpdateShipmentInput
  ) {
    const { id: shipmentId } = shipmentIdParamSchema.parse({ id });
    const parsed = updateShipmentSchema.parse(payload);

    const existing = await prisma.shipment.findUnique({
      where: { id: shipmentId },
    });

    if (!existing) throw new Error("Shipment not found");

    // Build update safely (NO unsafe spread)
    const updateData: any = {};

    Object.entries(parsed).forEach(([key, value]) => {
      if (value !== undefined) {
        updateData[key] = value;
      }
    });

    const updated = await prisma.shipment.update({
      where: { id: shipmentId },
      data: updateData,
      include: {
        courier: true,
        order: true,
        shippingRate: true,
        pickupStation: true,
        events: true,
      },
    });

    // Status change tracking
    if (parsed.status && parsed.status !== existing.status) {
      await ShipmentEventService.logStatusChange({
        shipmentId,
        status: parsed.status,
      });
    }

    return updated;
  }

  
  // UPDATE STATUS ONLY
  static async updateStatus(params: {
    id: string;
    status: ShipmentStatus;
    location?: string;
  }) {
    const shipment = await this.getById(params.id);

    const updated = await prisma.shipment.update({
      where: { id: shipment.id },
      data: {
        status: params.status,
      },
    });

    await ShipmentEventService.logStatusChange({
      shipmentId: shipment.id,
      status: params.status,
      ...(params.location !== undefined ? { location: params.location } : {}),
    });

    return updated;
  }

  // DELETE SHIPMENT
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

  // TRACK SHIPMENT
  static async trackShipment(trackingNumber: string) {
    const shipment = await prisma.shipment.findUnique({
      where: { trackingNumber },
      include: {
        events: {
          orderBy: { createdAt: "asc" },
        },
        courier: true,
        pickupStation: true,
      },
    });

    if (!shipment) throw new Error("Shipment not found");

    return shipment;
  }
}