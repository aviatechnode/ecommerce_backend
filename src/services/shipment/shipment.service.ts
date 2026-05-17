import { prisma } from "../../lib/prismadb.js";
import {
  createShipmentSchema,
  updateShipmentSchema,
  updateShipmentStatusSchema,
  shipmentIdParamSchema,
} from "../../schemas/shipment/shipment.schema.js";

import { ShipmentEventService } from "./shipment-event.service.js";

/* =========================================================
SHIPMENT SERVICE
========================================================= */

export class ShipmentService {
  /**
   * CREATE SHIPMENT
   */
  static async createShipment(data: unknown) {
    const parsed = createShipmentSchema.parse(data);

    // ensure order exists
    const order = await prisma.order.findUnique({
      where: { id: parsed.orderId },
    });

    if (!order) throw new Error("Order not found");

    // ensure courier exists
    const courier = await prisma.courier.findUnique({
      where: { id: parsed.courierId },
    });

    if (!courier) throw new Error("Courier not found");

    const shipment = await prisma.shipment.create({
      data: parsed,
    });

    // log event
    await ShipmentEventService.addSystemEvent({
      shipmentId: shipment.id,
      status: shipment.status,
      title: "Shipment created",
      description: "Shipment successfully created",
    });

    return shipment;
  }

  /**
   * GET ALL SHIPMENTS
   */
  static async getAllShipments() {
    return prisma.shipment.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        courier: true,
        order: true,
        events: true,
      },
    });
  }

  /**
   * GET BY ID
   */
  static async getShipmentById(id: string) {
    const parsed = shipmentIdParamSchema.parse({ id });

    const shipment = await prisma.shipment.findUnique({
      where: { id: parsed.id },
      include: {
        courier: true,
        order: true,
        events: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!shipment) throw new Error("Shipment not found");

    return shipment;
  }

  /**
   * UPDATE SHIPMENT
   */
  static async updateShipment(id: string, data: unknown) {
    const parsedId = shipmentIdParamSchema.parse({ id });
    const parsedData = updateShipmentSchema.parse(data);

    const existing = await prisma.shipment.findUnique({
      where: { id: parsedId.id },
    });

    if (!existing) throw new Error("Shipment not found");

    const updated = await prisma.shipment.update({
      where: { id: parsedId.id },
      data: parsedData,
    });

    // log event if status changed
    if (parsedData.status && parsedData.status !== existing.status) {
      await ShipmentEventService.logStatusChange({
        shipmentId: id,
        status: parsedData.status,
      });
    }

    return updated;
  }

  /**
   * UPDATE STATUS ONLY
   */
  static async updateShipmentStatus(id: string, data: unknown) {
    const parsedId = shipmentIdParamSchema.parse({ id });
    const parsed = updateShipmentStatusSchema.parse(data);

    const shipment = await prisma.shipment.findUnique({
      where: { id: parsedId.id },
    });

    if (!shipment) throw new Error("Shipment not found");

    const updated = await prisma.shipment.update({
      where: { id: parsedId.id },
      data: {
        status: parsed.status,
        failedReason: parsed.failedReason ?? shipment.failedReason,
      },
    });

    await ShipmentEventService.logStatusChange({
      shipmentId: id,
      status: parsed.status,
    });

    return updated;
  }

  /**
   * DELETE SHIPMENT
   */
  static async deleteShipment(id: string) {
    const parsed = shipmentIdParamSchema.parse({ id });

    const shipment = await prisma.shipment.findUnique({
      where: { id: parsed.id },
    });

    if (!shipment) throw new Error("Shipment not found");

    return prisma.shipment.delete({
      where: { id: parsed.id },
    });
  }
}