import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prismadb.js";

import {
  pickupStationSchema,
  updatePickupStationSchema,
  shipmentDeliverySchema,
  type CreatePickupStationDTO,
  type UpdatePickupStationDTO,
  type ShipmentDeliveryDTO,
} from "../../schemas/shipment/pickup-station.schema.js";

export class PickupStationService {
  // VALIDATE STATE + LGA
  private static async validateStateAndLGA(
    stateId: string,
    lgaId: string
  ) {
    const [state, lga] = await Promise.all([
      prisma.state.findUnique({
        where: { id: stateId },
      }),

      prisma.lGA.findUnique({
        where: { id: lgaId },
      }),
    ]);

    if (!state) {
      throw new Error("State not found");
    }

    if (!lga) {
      throw new Error("LGA not found");
    }

    if (lga.stateId !== stateId) {
      throw new Error(
        "LGA does not belong to selected state"
      );
    }

    return { state, lga };
  }

  // CREATE
  static async create(
    payload: CreatePickupStationDTO
  ) {
    const parsed =
      pickupStationSchema.parse(payload);

    await this.validateStateAndLGA(
      parsed.stateId,
      parsed.lgaId
    );

    // VALIDATE COURIER
    const courier =
      await prisma.courier.findUnique({
        where: {
          id: parsed.courierId,
        },
      });

    if (!courier) {
      throw new Error("Courier not found");
    }

    // CREATE DATA
    const data: Prisma.PickupStationCreateInput =
      {
        name: parsed.name,

        courier: {
          connect: {
            id: parsed.courierId,
          },
        },

        state: {
          connect: {
            id: parsed.stateId,
          },
        },

        lga: {
          connect: {
            id: parsed.lgaId,
          },
        },

        address: parsed.address,

        landmark:
          parsed.landmark ?? null,

        phone: parsed.phone ?? null,

        latitude:
          parsed.latitude ?? null,

        longitude:
          parsed.longitude ?? null,

        openingHours:
          parsed.openingHours ?? null,

        isActive:
          parsed.isActive ?? true,
      };

    return prisma.pickupStation.create({
      data,

      include: {
        courier: true,
        state: true,
        lga: true,
      },
    });
  }

  // UPDATE
  static async update(
    id: string,
    payload: UpdatePickupStationDTO
  ) {

    // FIND EXISTING
    const station =
      await prisma.pickupStation.findUnique({
        where: { id },
      });

    if (!station) {
      throw new Error(
        "Pickup station not found"
      );
    }

    // VALIDATE PAYLOAD
    const parsed =
      updatePickupStationSchema.parse(
        payload
      );

    // VALIDATE STATE/LGA
    if (
      parsed.stateId ||
      parsed.lgaId
    ) {
      await this.validateStateAndLGA(
        parsed.stateId ??
          station.stateId,

        parsed.lgaId ??
          station.lgaId
      );
    }

    // VALIDATE COURIER
    if (parsed.courierId) {
      const courier =
        await prisma.courier.findUnique({
          where: {
            id: parsed.courierId,
          },
        });

      if (!courier) {
        throw new Error(
          "Courier not found"
        );
      }
    }

    // UPDATE DATA
    const data: Prisma.PickupStationUpdateInput =
      {};

    if (parsed.name !== undefined) {
      data.name = parsed.name;
    }

    if (
      parsed.courierId !== undefined
    ) {
      data.courier = {
        connect: {
          id: parsed.courierId,
        },
      };
    }

    if (
      parsed.stateId !== undefined
    ) {
      data.state = {
        connect: {
          id: parsed.stateId,
        },
      };
    }

    if (
      parsed.lgaId !== undefined
    ) {
      data.lga = {
        connect: {
          id: parsed.lgaId,
        },
      };
    }

    if (
      parsed.address !== undefined
    ) {
      data.address = parsed.address;
    }

    if (
      parsed.landmark !== undefined
    ) {
      data.landmark =
        parsed.landmark ?? null;
    }

    if (
      parsed.phone !== undefined
    ) {
      data.phone =
        parsed.phone ?? null;
    }

    if (
      parsed.latitude !== undefined
    ) {
      data.latitude =
        parsed.latitude ?? null;
    }

    if (
      parsed.longitude !== undefined
    ) {
      data.longitude =
        parsed.longitude ?? null;
    }

    if (
      parsed.openingHours !==
      undefined
    ) {
      data.openingHours =
        parsed.openingHours ?? null;
    }

    if (
      parsed.isActive !== undefined
    ) {
      data.isActive =
        parsed.isActive;
    }

    // UPDATE
    return prisma.pickupStation.update({
      where: { id },

      data,

      include: {
        courier: true,
        state: true,
        lga: true,
      },
    });
  }

  // GET ALL
  static async findAll(params?: {
    page?: number;
    limit?: number;
    stateId?: string;
    lgaId?: string;
    courierId?: string;
    isActive?: boolean;
    search?: string;
  }) {
    const page =
      params?.page ?? 1;

    const limit =
      params?.limit ?? 20;

    const where: Prisma.PickupStationWhereInput =
      {};

    // FILTERS
    if (params?.stateId) {
      where.stateId =
        params.stateId;
    }

    if (params?.lgaId) {
      where.lgaId =
        params.lgaId;
    }

    if (params?.courierId) {
      where.courierId =
        params.courierId;
    }

    if (
      typeof params?.isActive ===
      "boolean"
    ) {
      where.isActive =
        params.isActive;
    }

    // SEARCH
    if (params?.search) {
      where.OR = [
        {
          name: {
            contains:
              params.search,
            mode: "insensitive",
          },
        },

        {
          address: {
            contains:
              params.search,
            mode: "insensitive",
          },
        },

        {
          landmark: {
            contains:
              params.search,
            mode: "insensitive",
          },
        },
      ];
    }

    // QUERY
    const [items, total] =
      await Promise.all([
        prisma.pickupStation.findMany({
          where,

          include: {
            courier: true,
            state: true,
            lga: true,
          },

          skip:
            (page - 1) * limit,

          take: limit,

          orderBy: {
            createdAt: "desc",
          },
        }),

        prisma.pickupStation.count({
          where,
        }),
      ]);

    // RESPONSE
    return {
      data: items,

      meta: {
        total,
        page,
        limit,

        totalPages:
          Math.ceil(total / limit),
      },
    };
  }

  // GET ONE
  static async findById(id: string) {
    const station =
      await prisma.pickupStation.findUnique(
        {
          where: { id },

          include: {
            courier: true,

            state: true,

            lga: true,

            shipments: {
              include: {
                order: true,
              },
            },
          },
        }
      );

    if (!station) {
      throw new Error(
        "Pickup station not found"
      );
    }

    return station;
  }

  // ACTIVE STATIONS
  static async getActiveStations(
    stateId?: string,
    lgaId?: string,
    courierId?: string
  ) {
    return prisma.pickupStation.findMany({
      where: {
        isActive: true,

        ...(stateId && {
          stateId,
        }),

        ...(lgaId && {
          lgaId,
        }),

        ...(courierId && {
          courierId,
        }),
      },

      include: {
        courier: true,
        state: true,
        lga: true,
      },

      orderBy: {
        name: "asc",
      },
    });
  }

  // VALIDATE DELIVERY
  static async validateShipmentDelivery(
    payload: ShipmentDeliveryDTO
  ) {
    const data =
      shipmentDeliverySchema.parse(
        payload
      );

    // VALIDATE PICKUP STATION
    if (data.pickupStationId) {
      const station =
        await prisma.pickupStation.findFirst(
          {
            where: {
              id: data.pickupStationId,

              isActive: true,
            },

            include: {
              courier: true,
              state: true,
              lga: true,
            },
          }
        );

      if (!station) {
        throw new Error(
          "Pickup station not found or inactive"
        );
      }

      return {
        ...data,
        pickupStation: station,
      };
    }

    return data;
  }

  // TOGGLE ACTIVE
  static async toggleActive(
    id: string
  ) {
    const station =
      await prisma.pickupStation.findUnique(
        {
          where: { id },
        }
      );

    if (!station) {
      throw new Error(
        "Pickup station not found"
      );
    }

    return prisma.pickupStation.update({
      where: { id },

      data: {
        isActive:
          !station.isActive,
      },

      include: {
        courier: true,
        state: true,
        lga: true,
      },
    });
  }

  // DELETE
  static async delete(id: string) {
    const station =
      await prisma.pickupStation.findUnique(
        {
          where: { id },

          include: {
            shipments: {
              take: 1,
            },
          },
        }
      );

    if (!station) {
      throw new Error(
        "Pickup station not found"
      );
    }

    // PREVENT DELETE
    if (
      station.shipments.length > 0
    ) {
      throw new Error(
        "Cannot delete pickup station already linked to shipments"
      );
    }
    
    // DELETE
    return prisma.pickupStation.delete({
      where: { id },
    });
  }
}