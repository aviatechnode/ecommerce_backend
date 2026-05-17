import { prisma } from "../../lib/prismadb.js";
import {
  createShipmentEventSchema,
  updateShipmentEventSchema,
  shipmentEventIdParamSchema,
} from "../../schemas/shipment/shipment.event.schema.js";
import { ShipmentStatus } from "@prisma/client";

/* =========================================================
SHIPMENT EVENT SERVICE (PRISMA STRICT SAFE)
========================================================= */

export class ShipmentEventService {
  /**
   * Create shipment event (tracking update)
   */
  static async createEvent(data: unknown) {
    const parsed = createShipmentEventSchema.parse(data);

    const shipment = await prisma.shipment.findUnique({
      where: { id: parsed.shipmentId },
    });

    if (!shipment) throw new Error("Shipment not found");

    const event = await prisma.shipmentEvent.create({
      data: {
        shipmentId: parsed.shipmentId,
        status: parsed.status,
        title: parsed.title,
        description: parsed.description ?? null,
        location: parsed.location ?? null,
      },
    });

    await prisma.shipment.update({
      where: { id: parsed.shipmentId },
      data: {
        status: parsed.status,
      },
    });

    return event;
  }

  /**
   * Get all events for a shipment
   */
  static async getShipmentEvents(shipmentId: string) {
    return prisma.shipmentEvent.findMany({
      where: { shipmentId },
      orderBy: { createdAt: "asc" },
    });
  }

  /**
   * Get single event by ID
   */
  static async getEventById(id: string) {
    const { id: eventId } = shipmentEventIdParamSchema.parse({ id });

    const event = await prisma.shipmentEvent.findUnique({
      where: { id: eventId },
      include: { shipment: true },
    });

    if (!event) throw new Error("Shipment event not found");

    return event;
  }

  /**
   * Update shipment event (PRISMA SAFE FIX)
   */
  static async updateEvent(id: string, data: unknown) {
    const { id: eventId } = shipmentEventIdParamSchema.parse({ id });
    const parsed = updateShipmentEventSchema.parse(data);

    const existing = await prisma.shipmentEvent.findUnique({
      where: { id: eventId },
    });

    if (!existing) throw new Error("Shipment event not found");

    /**
     * IMPORTANT FIX:
     * Build update object manually instead of spreading Partial<T>
     * This avoids exactOptionalPropertyTypes conflicts
     */
    const updateData: any = {};

    if (parsed.status !== undefined) {
      updateData.status = parsed.status;
    }

    if (parsed.title !== undefined) {
      updateData.title = parsed.title;
    }

    if (parsed.description !== undefined) {
      updateData.description = parsed.description;
    }

    if (parsed.location !== undefined) {
      updateData.location = parsed.location;
    }

    return prisma.shipmentEvent.update({
      where: { id: eventId },
      data: updateData,
    });
  }

  /**
   * Delete shipment event
   */
  static async deleteEvent(id: string) {
    const { id: eventId } = shipmentEventIdParamSchema.parse({ id });

    const existing = await prisma.shipmentEvent.findUnique({
      where: { id: eventId },
    });

    if (!existing) throw new Error("Shipment event not found");

    return prisma.shipmentEvent.delete({
      where: { id: eventId },
    });
  }

  /**
   * Add system-generated tracking event
   */
  static async addSystemEvent(params: {
    shipmentId: string;
    status: ShipmentStatus;
    title: string;
    description?: string;
    location?: string;
  }) {
    return prisma.shipmentEvent.create({
      data: {
        shipmentId: params.shipmentId,
        status: params.status,
        title: params.title,
        description: params.description ?? null,
        location: params.location ?? null,
      },
    });
  }

  /**
   * Auto tracking timeline helper
   */
  static async logStatusChange(params: {
    shipmentId: string;
    status: ShipmentStatus;
    location?: string;
  }) {
    const statusMessages: Record<ShipmentStatus, string> = {
      PENDING: "Shipment created and pending processing",
      PROCESSING: "Shipment is being processed",
      SHIPPED: "Shipment has been shipped",
      IN_TRANSIT: "Shipment is in transit",
      ARRIVED_AT_HUB: "Shipment arrived at sorting hub",
      OUT_FOR_DELIVERY: "Out for delivery",
      DELIVERED: "Shipment delivered successfully",
      FAILED: "Delivery attempt failed",
      RETURNED: "Shipment returned",
      CANCELLED: "Shipment cancelled",
    };

    return prisma.shipmentEvent.create({
      data: {
        shipmentId: params.shipmentId,
        status: params.status,
        title: statusMessages[params.status],
        location: params.location ?? null,
      },
    });
  }
}