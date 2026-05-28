import { prisma } from "../../lib/prismadb.js";

import {
  createCourierSchema,
  updateCourierSchema,
  courierIdParamSchema,
  createCourierWebhookLogSchema,
  updateCourierWebhookLogSchema,
  courierWebhookLogIdParamSchema,
} from "../../schemas/shipment/courier.schema.js";

import type {
  CreateCourierInput,
  UpdateCourierInput,
  CreateCourierWebhookLogInput,
  UpdateCourierWebhookLogInput,
} from "../../schemas/shipment/courier.schema.js";

import {
  normalizeString,
  normalizeEmail,
  buildUpdateData,
  assertUniqueCourier,
} from "../_shared/shippingValidation.helpers.js";

/* =========================================================
COURIER SERVICE
========================================================= */

export class CourierService {
  /* =========================================================
  CREATE COURIER
  ========================================================= */

  static async createCourier(data: unknown) {
    const parsed: CreateCourierInput =
      createCourierSchema.parse(data);

    const normalizedName = normalizeString(parsed.name);

    if (!normalizedName) {
      throw new Error("Courier name is required");
    }

    await assertUniqueCourier({
      name: normalizedName,
    });

    const phone = parsed.phone ?? null;
    const email = parsed.email ?? null;
    const website = parsed.website ?? null;

    const courierData: any = {
      name: normalizedName,
      isActive: parsed.isActive,
    };

    const normalizedPhone =
      phone !== null ? normalizeString(phone) : null;

    const normalizedEmail =
      email !== null ? normalizeEmail(email) : null;

    const normalizedWebsite =
      website !== null
        ? normalizeString(website)
        : null;

    if (normalizedPhone !== null) {
      courierData.phone = normalizedPhone;
    }

    if (normalizedEmail !== null) {
      courierData.email = normalizedEmail;
    }

    if (normalizedWebsite !== null) {
      courierData.website = normalizedWebsite;
    }

    return prisma.courier.create({
      data: courierData,
      include: {
        rates: true,
        shipments: true,
        pickupStations: true,
        deliverySLAs: true,
        courierWebhookLogs: true,
        returnShipments: true,
      },
    });
  }

  /* =========================================================
  GET ALL COURIERS
  ========================================================= */

  static async getAllCouriers() {
    return prisma.courier.findMany({
      include: {
        rates: true,
        shipments: true,
        pickupStations: true,
        deliverySLAs: true,
        courierWebhookLogs: {
          orderBy: {
            createdAt: "desc",
          },
        },
        returnShipments: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  /* =========================================================
  GET COURIER BY ID
  ========================================================= */

  static async getCourierById(id: string) {
    const parsed = courierIdParamSchema.parse({ id });

    const courier = await prisma.courier.findUnique({
      where: {
        id: parsed.id,
      },
      include: {
        rates: true,
        shipments: true,
        pickupStations: true,
        deliverySLAs: true,
        courierWebhookLogs: {
          orderBy: {
            createdAt: "desc",
          },
        },
        returnShipments: true,
      },
    });

    if (!courier) {
      throw new Error("Courier not found");
    }

    return courier;
  }

  /* =========================================================
  UPDATE COURIER
  ========================================================= */

  static async updateCourier(
    id: string,
    data: unknown
  ) {
    const parsedId = courierIdParamSchema.parse({
      id,
    });

    const parsedData: UpdateCourierInput =
      updateCourierSchema.parse(data);

    const existing = await prisma.courier.findUnique({
      where: {
        id: parsedId.id,
      },
      select: {
        id: true,
      },
    });

    if (!existing) {
      throw new Error("Courier not found");
    }

    const normalizedName =
      parsedData.name !== undefined
        ? normalizeString(parsedData.name)
        : undefined;

    if (normalizedName) {
      await assertUniqueCourier({
        name: normalizedName,
        excludeId: parsedId.id,
      });
    }

    const normalizedPhone =
      parsedData.phone !== undefined
        ? parsedData.phone === null
          ? null
          : normalizeString(parsedData.phone)
        : undefined;

    const normalizedEmail =
      parsedData.email !== undefined
        ? parsedData.email === null
          ? null
          : normalizeEmail(parsedData.email)
        : undefined;

    const normalizedWebsite =
      parsedData.website !== undefined
        ? parsedData.website === null
          ? null
          : normalizeString(parsedData.website)
        : undefined;

    const updateData = buildUpdateData({
      name: normalizedName,
      phone: normalizedPhone,
      email: normalizedEmail,
      website: normalizedWebsite,
      isActive: parsedData.isActive,
    });

    return prisma.courier.update({
      where: {
        id: parsedId.id,
      },
      data: updateData,
      include: {
        rates: true,
        shipments: true,
        pickupStations: true,
        deliverySLAs: true,
        courierWebhookLogs: {
          orderBy: {
            createdAt: "desc",
          },
        },
        returnShipments: true,
      },
    });
  }

  /* =========================================================
  TOGGLE COURIER STATUS
  ========================================================= */

  static async toggleCourierStatus(id: string) {
    const courier = await this.getCourierById(id);

    return prisma.courier.update({
      where: {
        id: courier.id,
      },
      data: {
        isActive: !courier.isActive,
      },
      include: {
        rates: true,
        shipments: true,
        pickupStations: true,
        deliverySLAs: true,
        courierWebhookLogs: true,
        returnShipments: true,
      },
    });
  }

  /* =========================================================
  DELETE COURIER
  ========================================================= */

  static async deleteCourier(id: string) {
    const parsed = courierIdParamSchema.parse({
      id,
    });

    const courier = await prisma.courier.findUnique({
      where: {
        id: parsed.id,
      },
      include: {
        rates: {
          select: {
            id: true,
          },
        },

        shipments: {
          select: {
            id: true,
          },
        },

        pickupStations: {
          select: {
            id: true,
          },
        },

        deliverySLAs: {
          select: {
            id: true,
          },
        },

        courierWebhookLogs: {
          select: {
            id: true,
          },
        },

        returnShipments: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!courier) {
      throw new Error("Courier not found");
    }

    if (courier.rates.length > 0) {
      throw new Error(
        "Cannot delete courier with shipping rates"
      );
    }

    if (courier.shipments.length > 0) {
      throw new Error(
        "Cannot delete courier with shipments"
      );
    }

    if (courier.pickupStations.length > 0) {
      throw new Error(
        "Cannot delete courier with pickup stations"
      );
    }

    if (courier.deliverySLAs.length > 0) {
      throw new Error(
        "Cannot delete courier with delivery SLAs"
      );
    }

    if (courier.returnShipments.length > 0) {
      throw new Error(
        "Cannot delete courier with return shipments"
      );
    }

    // Delete webhook logs automatically
    await prisma.courierWebhookLog.deleteMany({
      where: {
        courierId: parsed.id,
      },
    });

    return prisma.courier.delete({
      where: {
        id: parsed.id,
      },
    });
  }

  /* =========================================================
  CREATE COURIER WEBHOOK LOG
  ========================================================= */

  static async createWebhookLog(data: unknown) {
    const parsed: CreateCourierWebhookLogInput =
      createCourierWebhookLogSchema.parse(data);

    const courier = await prisma.courier.findUnique({
      where: {
        id: parsed.courierId,
      },
      select: {
        id: true,
      },
    });

    if (!courier) {
      throw new Error("Courier not found");
    }

    const normalizedEventType = normalizeString(
      parsed.eventType
    );

    if (!normalizedEventType) {
      throw new Error("Event type is required");
    }

    return prisma.courierWebhookLog.create({
      data: {
        courierId: parsed.courierId,
        eventType: normalizedEventType,
        payload: parsed.payload,
        processed: parsed.processed,
        error:
          parsed.error !== null &&
          parsed.error !== undefined
            ? normalizeString(parsed.error)
            : null,
      },
      include: {
        courier: true,
      },
    });
  }

  /* =========================================================
  GET WEBHOOK LOGS BY COURIER
  ========================================================= */

  static async getWebhookLogsByCourier(
    courierId: string
  ) {
    const parsed = courierIdParamSchema.parse({
      id: courierId,
    });

    return prisma.courierWebhookLog.findMany({
      where: {
        courierId: parsed.id,
      },
      include: {
        courier: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  /* =========================================================
  UPDATE WEBHOOK LOG
  ========================================================= */

  static async updateWebhookLog(
    id: string,
    data: unknown
  ) {
    const parsedId =
      courierWebhookLogIdParamSchema.parse({
        id,
      });

    const parsedData: UpdateCourierWebhookLogInput =
      updateCourierWebhookLogSchema.parse(data);

    const existing =
      await prisma.courierWebhookLog.findUnique({
        where: {
          id: parsedId.id,
        },
      });

    if (!existing) {
      throw new Error("Webhook log not found");
    }

    const normalizedError =
      parsedData.error !== undefined
        ? parsedData.error === null
          ? null
          : normalizeString(parsedData.error)
        : undefined;

    return prisma.courierWebhookLog.update({
      where: {
        id: parsedId.id,
      },
      data: buildUpdateData({
        processed: parsedData.processed,
        error: normalizedError,
      }),
      include: {
        courier: true,
      },
    });
  }

  /* =========================================================
  DELETE WEBHOOK LOG
  ========================================================= */

  static async deleteWebhookLog(id: string) {
    const parsed =
      courierWebhookLogIdParamSchema.parse({
        id,
      });

    const existing =
      await prisma.courierWebhookLog.findUnique({
        where: {
          id: parsed.id,
        },
      });

    if (!existing) {
      throw new Error("Webhook log not found");
    }

    return prisma.courierWebhookLog.delete({
      where: {
        id: parsed.id,
      },
    });
  }
}