import type { Prisma } from "@prisma/client";
import { prisma } from "../lib/prismadb.js";

import {
  createVehicleMakeSchema,
  updateVehicleMakeSchema,
  getVehicleMakesQuerySchema,

  createVehicleModelSchema,
  updateVehicleModelSchema,
  getVehicleModelsQuerySchema,

  createVehicleGenerationSchema,
  updateVehicleGenerationSchema,
  getVehicleGenerationsQuerySchema,

  createVehicleEngineSchema,
  updateVehicleEngineSchema,
  getVehicleEnginesQuerySchema,

  createVehicleTrimSchema,
  updateVehicleTrimSchema,
  getVehicleTrimsQuerySchema,
} from "../schemas/vehicle.schema.js";
import { getPagination, getPaginationMeta } from "../validation/shared/pagination-helper.js";

export class VehicleService {
  //////////////////////////////////////////////////////////
  // VEHICLE MAKE
  //////////////////////////////////////////////////////////

  static async createMake(data: unknown) {
    const validated =
      createVehicleMakeSchema.parse(data);

    return prisma.vehicleMake.create({
      data: {
        name: validated.name,
        slug: validated.slug,

        ...(validated.isActive !== undefined && {
          isActive: validated.isActive,
        }),
      },
    });
  }

  static async findMakes(query: unknown) {
    const validated = getVehicleMakesQuerySchema.parse(query);
      const page = validated.page;
      const limit = validated.limit;
    const where: Prisma.VehicleMakeWhereInput = {
      ...(validated.isActive !== undefined && {
        isActive: validated.isActive,
      }),

      ...(validated.search && {
        OR: [
          {
            name: {
              contains: validated.search,
              mode: "insensitive",
            },
          },
          {
            slug: {
              contains: validated.search,
              mode: "insensitive",
            },
          },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      prisma.vehicleMake.findMany({
      where,
      ...getPagination(page, limit),
      include: {
        _count: {
          select: {
            models: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    }),

    prisma.vehicleMake.count({
      where,
    }),
  ]);

  return {
    data,

    meta: getPaginationMeta(
      page,
      limit,
      total
    ),
  }
}

  static async findMakeById(id: string) {
    return prisma.vehicleMake.findUnique({
      where: { id },
      include: {
        models: true,
      },
    });
  }

  static async updateMake(
    id: string,
    data: unknown
  ) {
    const validated = updateVehicleMakeSchema.parse(data);

    const updateData: Prisma.VehicleMakeUpdateInput = {
      ...(validated.name !== undefined && {
        name: validated.name
      }),

      ...(validated.slug !== undefined && {
        slug: validated.slug
      }),

      ...(validated.isActive !== undefined && {
        isActive: validated.isActive
      })
    }
    return prisma.vehicleMake.update({
      where: { id },
      data: updateData,
    });
  }

  static async deleteMake(id: string) {
    return prisma.vehicleMake.delete({
      where: { id },
    });
  }

  //////////////////////////////////////////////////////////
  // VEHICLE MODEL
  //////////////////////////////////////////////////////////

  static async createModel(data: unknown) {
    const validated =
      createVehicleModelSchema.parse(data);

    return prisma.vehicleModel.create({
      data: {
        makeId: validated.makeId,
        name: validated.name,
        slug: validated.slug,


        ...(validated.isActive !== undefined && {
          isActive: validated.isActive,
        }),
      },
    });
  }

  static async findModels(query: unknown) {
    const validated =
      getVehicleModelsQuerySchema.parse(query);

      const page = validated.page;
      const limit = validated.limit;

    const where: Prisma.VehicleModelWhereInput = {
      ...(validated.makeId && {
        makeId: validated.makeId,
      }),

      ...(validated.isActive !== undefined && {
        isActive: validated.isActive,
      }),

      ...(validated.search && {
        OR: [
          {
            name: {
              contains: validated.search,
              mode: "insensitive",
            },
          },
          {
            slug: {
              contains: validated.search,
              mode: "insensitive",
            },
          },
        ],
      }),
    };

     const [data, total] = await Promise.all([
      prisma.vehicleModel.findMany({
        where,

        ...getPagination(page, limit),

        include: {
          make: true,
          _count: {
            select: {
              generations: true,
            },
          },
        },

        orderBy: {
          name: "asc",
        },
      }),

      prisma.vehicleModel.count({
        where,
      }),
    ]);

    return {
      data,
      meta: getPaginationMeta(
        page,
        limit,
        total
      ),
    };
  }

  static async findModelById(id: string) {
    return prisma.vehicleModel.findUnique({
      where: { id },
      include: {
        make: true,
        generations: true,
      },
    });
  }

  static async updateModel(
    id: string,
    data: unknown
  ) {
    const validated =
      updateVehicleModelSchema.parse(data);

      const updateData: Prisma.VehicleModelUpdateInput = {
        ...(validated.makeId !== undefined && {
          make: {
            connect:{
              id: validated.makeId
            },
          },
        }),

        ...(validated.name !== undefined && {
          name: validated.name
        }),

        ...(validated.slug !== undefined && {
          slug: validated.slug
        }),


        ...(validated.isActive !== undefined && {
          isActive: validated.isActive
        }),
      }

    return prisma.vehicleModel.update({
      where: { id },
      data: updateData,
    });
  }

  static async deleteModel(id: string) {
    return prisma.vehicleModel.delete({
      where: { id },
    });
  }

  //////////////////////////////////////////////////////////
  // VEHICLE GENERATION
  //////////////////////////////////////////////////////////

  static async createGeneration(data: unknown) {
    const validated = createVehicleGenerationSchema.parse(data);
    return prisma.vehicleGeneration.create({
      data: {
        modelId: validated.modelId,
        name: validated.name,
        yearStart: validated.yearStart,
        
        ...(validated.slug !== undefined && {
          slug: validated.slug,
        }),
        ...(validated.chassisCode !== undefined && {
          chassisCode: validated.chassisCode,
        }),

        ...(validated.yearEnd !== undefined && {
          yearEnd: validated.yearEnd
        }),

        ...(validated.isActive !== undefined && {
          isActive: validated.isActive
        }),
        
      },
    });
  }

  static async findGenerations(query: unknown) {
  const validated =
    getVehicleGenerationsQuerySchema.parse(query);

  const page = validated.page;
  const limit = validated.limit;

  const where: Prisma.VehicleGenerationWhereInput = {
    ...(validated.modelId && {
      modelId: validated.modelId,
    }),

    ...(validated.isActive !== undefined && {
      isActive: validated.isActive,
    }),

    ...(validated.chassisCode && {
      chassisCode: {
        contains: validated.chassisCode,
        mode: "insensitive",
      },
    }),

    ...(validated.year && {
      yearStart: {
        lte: validated.year,
      },

      OR: [
        {
          yearEnd: null,
        },
        {
          yearEnd: {
            gte: validated.year,
          },
        },
      ],
    }),
  };

  const [data, total] = await Promise.all([
    prisma.vehicleGeneration.findMany({
      where,

      ...getPagination(page, limit),

      include: {
        model: true,
        _count: {
          select: {
            engines: true,
          },
        },
      },

      orderBy: {
        yearStart: "desc",
      },
    }),

    prisma.vehicleGeneration.count({
      where,
    }),
  ]);

  return {
    data,
    meta: getPaginationMeta(
      page,
      limit,
      total
    ),
  };
}
  static async findGenerationById(id: string) {
    return prisma.vehicleGeneration.findUnique({
      where: { id },
      include: {
        model: true,
        engines: true,
      },
    });
  }

  static async updateGeneration(
    id: string,
    data: unknown
  ) {
    const validated =
      updateVehicleGenerationSchema.parse(data);

      const updateData: Prisma.VehicleGenerationUpdateInput = {
        ...(validated.modelId !== undefined && {
          model: {
            connect: {
              id: validated.modelId,
            },
          },
        }),
        ...(validated.name !== undefined && {
          name: validated.name
        }),
        ...(validated.yearStart !== undefined && {
          yearStart: validated.yearStart
        }),
        ...(validated.slug !== undefined && {
          slug: validated.slug
        }),
         ...(validated.chassisCode !== undefined && {
          chassisCode: validated.chassisCode,
        }),
        ...(validated.yearEnd !== undefined && {
          yearEnd: validated.yearEnd
        }),
        ...(validated.isActive !== undefined && {
          isActive: validated.isActive
        })
      }

    return prisma.vehicleGeneration.update({
      where: { id },
      data: updateData,
    });
  }

  static async deleteGeneration(id: string) {
    return prisma.vehicleGeneration.delete({
      where: { id },
    });
  }

  //////////////////////////////////////////////////////////
  // VEHICLE ENGINE
  //////////////////////////////////////////////////////////

  static async createEngine(data: unknown) {
    const validated =
      createVehicleEngineSchema.parse(data);

    return prisma.vehicleEngine.create({
      data: {
        generationId: validated.generationId,
        engineCode: validated.engineCode,
        
        ...(validated.engineName !== undefined && {
          engineName: validated.engineName
        }),
        ...(validated.fuelType !== undefined && {
          fuelType: validated.fuelType
        }),
        ...(validated.aspiration !== undefined && {
          aspiration: validated.aspiration
        }),
        ...(validated.cylinders !== undefined && {
          cylinders: validated.cylinders
        }),
        ...(validated.horsepower !== undefined && {
          horsepower: validated.horsepower
        }),
        ...(validated.displacementCc !== undefined && {
          displacementCc: validated.displacementCc
        }),
        ...(validated.displacementLabel !== undefined && {
          displacementLabel: validated.displacementLabel
        }),
        ...(validated.drivetrain !== undefined && {
          drivetrain: validated.drivetrain
        }),
        ...(validated.transmissionType !== undefined && {
          transmissionType: validated.transmissionType
        }),
        ...(validated.isActive !== undefined && {
          isActive: validated.isActive
        })
      },
    });
  }

  static async findEngines(query: unknown) {
    const validated =
      getVehicleEnginesQuerySchema.parse(query);

      const page = validated.page;
      const limit = validated.limit;
    const where: Prisma.VehicleEngineWhereInput = {
      ...(validated.generationId && {
        generationId: validated.generationId,
      }),

      ...(validated.fuelType && {
        fuelType: validated.fuelType,
      }),

      ...(validated.drivetrain && {
        drivetrain: validated.drivetrain,
      }),

      ...(validated.isActive !== undefined && {
        isActive: validated.isActive,
      }),
    };

    const [data, total] = await Promise.all([
      prisma.vehicleEngine.findMany({
      where,
      ...getPagination(page, limit),
      include: {
        generation: true,
        _count: {
          select: {
            trims: true,
          },
        },
      },
      orderBy: {
        engineCode: "asc",
      },
    }),

    prisma.vehicleEngine.count({
      where,
    }),
  ]);
    return {
      data, 
      meta: getPaginationMeta(
        page,
        limit,
        total
      )
    }
  }

  static async findEngineById(id: string) {
    return prisma.vehicleEngine.findUnique({
      where: { id },
      include: {
        generation:{
          include: {
            model: {
              include:{
                make: true
              },
            },
          },
        },
        trims: true,
      },
    });
  }

  static async updateEngine(
  id: string,
  data: unknown
) {
  const validated =
    updateVehicleEngineSchema.parse(data);

  const updateData: Prisma.VehicleEngineUpdateInput = {
    ...(validated.generationId !== undefined && {
      generation: {
        connect: {
          id: validated.generationId,
        },
      },
    }),

    ...(validated.engineCode !== undefined && {
      engineCode: validated.engineCode,
    }),

    ...(validated.engineName !== undefined && {
      engineName: validated.engineName,
    }),

    ...(validated.fuelType !== undefined && {
      fuelType: validated.fuelType,
    }),

    ...(validated.aspiration !== undefined && {
      aspiration: validated.aspiration,
    }),

    ...(validated.cylinders !== undefined && {
      cylinders: validated.cylinders,
    }),

    ...(validated.horsepower !== undefined && {
      horsepower: validated.horsepower,
    }),

    ...(validated.displacementCc !== undefined && {
      displacementCc: validated.displacementCc,
    }),

    ...(validated.displacementLabel !== undefined && {
      displacementLabel: validated.displacementLabel,
    }),

    ...(validated.drivetrain !== undefined && {
      drivetrain: validated.drivetrain,
    }),

    ...(validated.transmissionType !== undefined && {
      transmissionType: validated.transmissionType,
    }),

    ...(validated.isActive !== undefined && {
      isActive: validated.isActive,
    }),
  };

  return prisma.vehicleEngine.update({
    where: { id },
    data: updateData,
  });
}

  static async deleteEngine(id: string) {
    return prisma.vehicleEngine.delete({
      where: { id },
    });
  }

  //////////////////////////////////////////////////////////
  // VEHICLE TRIM
  //////////////////////////////////////////////////////////

  static async createTrim(data: unknown) {
    const validated =
      createVehicleTrimSchema.parse(data);

      const trimData: Prisma.VehicleTrimUncheckedCreateInput =
      {
        engineId: validated.engineId,
        name: validated.name,

        ...(validated.bodyType !== undefined && {
          bodyType: validated.bodyType,
        }),

        ...(validated.doors !== undefined && {
          doors: validated.doors,
        }),

        ...(validated.isActive !== undefined && {
          isActive: validated.isActive,
        }),
      };

      return prisma.vehicleTrim.create({
        data: trimData,
      });
  }

  static async findTrims(query: unknown) {
    const validated =
      getVehicleTrimsQuerySchema.parse(query);

      const page = validated.page;
      const limit = validated.limit;

    const where: Prisma.VehicleTrimWhereInput = {
      ...(validated.engineId && {
        engineId: validated.engineId,
      }),

      ...(validated.bodyType && {
        bodyType: validated.bodyType,
      }),

      ...(validated.isActive !== undefined && {
        isActive: validated.isActive,
      }),
    };

    const [data, total] = await Promise.all([
      prisma.vehicleTrim.findMany({
      where,
      ...getPagination(page, limit),
      include: {
        engine: true,
      },
      orderBy: {
        name: "asc",
      },
    }),
    
    prisma.vehicleTrim.count({
      where,
    }),
    ]);
    return {
      data,
      meta: getPaginationMeta(
        page,
        limit,
        total
      )
    }
  }

  static async findTrimById(id: string) {
    return prisma.vehicleTrim.findUnique({
      where: { id },
      include: {
        engine: true,
      },
    });
  }

static async updateTrim(
  id: string,
  data: unknown
) {
  const validated =
    updateVehicleTrimSchema.parse(data);

  const updateData: Prisma.VehicleTrimUncheckedUpdateInput =
  {
    ...(validated.engineId !== undefined && {
      engineId: validated.engineId,
    }),

    ...(validated.name !== undefined && {
      name: validated.name,
    }),

    ...(validated.bodyType !== undefined && {
      bodyType: validated.bodyType,
    }),

    ...(validated.doors !== undefined && {
      doors: validated.doors,
    }),

    ...(validated.isActive !== undefined && {
      isActive: validated.isActive,
    }),
  };

  return prisma.vehicleTrim.update({
    where: { id },
    data: updateData,
  });
}

  static async deleteTrim(id: string) {
    return prisma.vehicleTrim.delete({
      where: { id },
    });
  }
}