import { prisma } from "../lib/prismadb.js";

export class ShippingZoneService {
  static async getAll() {
    return prisma.shippingZone.findMany({
      include: {
        states: {
          select: {
            id: true,
            name: true,
          },
        },
        lgas: {
          select: {
            id: true,
            name: true,
            stateId: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });
  }

  static async getById(id: string) {
    return prisma.shippingZone.findUnique({
      where: { id },
      include: {
        states: true,
        lgas: {
          include: {
            state: true,
          },
        },
        rates: true,
      },
    });
  }

  static async create(data: {
    name: string;
    stateIds?: string[];
    lgaIds?: string[];
  }) {
    return prisma.shippingZone.create({
      data: {
        name: data.name,

        states: {
          connect:
            data.stateIds?.map((id) => ({
              id,
            })) || [],
        },

        lgas: {
          connect:
            data.lgaIds?.map((id) => ({
              id,
            })) || [],
        },
      },
      include: {
        states: true,
        lgas: true,
      },
    });
  }

  static async update(
    id: string,
    data: {
      name?: string;
      stateIds?: string[];
      lgaIds?: string[];
      isActive?: boolean;
    }
  ) {
    return prisma.shippingZone.update({
      where: { id },

      data: {
        ...(data.name && { name: data.name }),

        ...(data.isActive !== undefined && {
          isActive: data.isActive,
        }),

        ...(data.stateIds && {
          states: {
            set: [],
            connect: data.stateIds.map((id) => ({
              id,
            })),
          },
        }),

        ...(data.lgaIds && {
          lgas: {
            set: [],
            connect: data.lgaIds.map((id) => ({
              id,
            })),
          },
        }),
      },

      include: {
        states: true,
        lgas: true,
      },
    });
  }

  static async delete(id: string) {
    return prisma.shippingZone.delete({
      where: { id },
    });
  }

  static async toggleStatus(id: string, isActive: boolean) {
    return prisma.shippingZone.update({
      where: { id },
      data: { isActive },
    });
  }
}