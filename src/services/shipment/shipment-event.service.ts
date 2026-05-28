import {
  Prisma,
  ShipmentEventSource,
  ShipmentStatus,
} from "@prisma/client";

import { prisma } from "../../lib/prismadb.js";

import {
  createShipmentEventSchema,
  shipmentEventIdParamSchema,
  updateShipmentEventSchema,
} from "../../schemas/shipment/shipment.event.schema.js";

export class ShipmentEventService {
  static async createEvent(data: unknown) {
    const parsed = createShipmentEventSchema.parse(data);

    const shipment = await prisma.shipment.findUnique({
      where: { id: parsed.shipmentId },
    });

    if (!shipment) {
      throw new Error("Shipment not found");
    }

    const createData: Prisma.ShipmentEventCreateInput = {
      shipment: {
        connect: {
          id: parsed.shipmentId,
        },
      },

      status: parsed.status,

      source:
        parsed.source ??
        ShipmentEventSource.ADMIN,

      title: parsed.title,

      description:
        parsed.description ?? null,

      location:
        parsed.location ?? null,
    };

    if (parsed.metadata !== undefined) {
      createData.metadata =
        parsed.metadata as Prisma.InputJsonValue;
    }

    const event =
      await prisma.shipmentEvent.create({
        data: createData,
      });

    await prisma.shipment.update({
      where: {
        id: parsed.shipmentId,
      },

      data: {
        status: parsed.status,
      },
    });

    return event;
  }

  static async getShipmentEvents(
    shipmentId: string
  ) {
    return prisma.shipmentEvent.findMany({
      where: { shipmentId },

      orderBy: {
        createdAt: "asc",
      },
    });
  }

  static async getEventById(id: string) {
    const { id: eventId } =
      shipmentEventIdParamSchema.parse({
        id,
      });

    const event =
      await prisma.shipmentEvent.findUnique({
        where: { id: eventId },

        include: {
          shipment: true,
        },
      });

    if (!event) {
      throw new Error(
        "Shipment event not found"
      );
    }

    return event;
  }

  static async updateEvent(
    id: string,
    data: unknown
  ) {
    const { id: eventId } =
      shipmentEventIdParamSchema.parse({
        id,
      });

    const parsed =
      updateShipmentEventSchema.parse(data);

    const existing =
      await prisma.shipmentEvent.findUnique({
        where: { id: eventId },
      });

    if (!existing) {
      throw new Error(
        "Shipment event not found"
      );
    }

    const updateData: Prisma.ShipmentEventUpdateInput =
      {};

    if (parsed.status !== undefined) {
      updateData.status = parsed.status;
    }

    if (parsed.source !== undefined) {
      updateData.source = parsed.source;
    }

    if (parsed.title !== undefined) {
      updateData.title = parsed.title;
    }

    if (parsed.description !== undefined) {
      updateData.description =
        parsed.description;
    }

    if (parsed.location !== undefined) {
      updateData.location =
        parsed.location;
    }

    if (parsed.metadata !== undefined) {
      updateData.metadata =
        parsed.metadata as Prisma.InputJsonValue;
    }

    return prisma.shipmentEvent.update({
      where: { id: eventId },

      data: updateData,
    });
  }

  static async deleteEvent(id: string) {
    const { id: eventId } =
      shipmentEventIdParamSchema.parse({
        id,
      });

    const existing =
      await prisma.shipmentEvent.findUnique({
        where: { id: eventId },
      });

    if (!existing) {
      throw new Error(
        "Shipment event not found"
      );
    }

    return prisma.shipmentEvent.delete({
      where: { id: eventId },
    });
  }

  static async addSystemEvent(params: {
    shipmentId: string;
    status: ShipmentStatus;
    title: string;
    description?: string;
    location?: string;
    metadata?: Prisma.InputJsonValue;
  }) {
    const createData: Prisma.ShipmentEventCreateInput =
      {
        shipment: {
          connect: {
            id: params.shipmentId,
          },
        },

        status: params.status,

        source:
          ShipmentEventSource.SYSTEM,

        title: params.title,

        description:
          params.description ?? null,

        location:
          params.location ?? null,
      };

    if (params.metadata !== undefined) {
      createData.metadata =
        params.metadata;
    }

    return prisma.shipmentEvent.create({
      data: createData,
    });
  }

  static async logStatusChange(params: {
    shipmentId: string;
    status: ShipmentStatus;
    location?: string;
  }) {
    const statusMessages: Record<
      ShipmentStatus,
      string
    > = {
      PENDING:
        "Shipment created and pending processing",

      PROCESSING:
        "Shipment is being processed",

      SHIPPED:
        "Products has been shipped",

      IN_TRANSIT:
        "Shipment is in transit",

      ARRIVED_AT_HUB:
        "Shipment arrived at sorting hub",

      OUT_FOR_DELIVERY:
        "Shipment is out for delivery",

      LABEL_CREATED:
        "Shipping label has been created",

      HANDED_TO_COURIER:
        "Shipment handed over to courier",

      DELIVERED:
        "Shipment delivered successfully",

      FAILED:
        "Delivery attempt failed",

      RETURNED:
        "Shipment returned to sender",

      CANCELLED:
        "Shipment cancelled",
    };

    return prisma.shipmentEvent.create({
      data: {
        shipment: {
          connect: {
            id: params.shipmentId,
          },
        },

        status: params.status,

        source:
          ShipmentEventSource.SYSTEM,

        title:
          statusMessages[
            params.status
          ],

        location:
          params.location ?? null,
      },
    });
  }
}