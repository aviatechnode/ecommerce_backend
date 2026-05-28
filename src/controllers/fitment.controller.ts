import type { Request, Response } from "express";
import { prisma } from "../lib/prismadb.js";
import { FitmentLevel } from "@prisma/client";
import slugify from "slugify";


const getParamId = (id: unknown): string => {
  if (typeof id !== "string") {
    throw new Error("Invalid id parameter");
  }

  return id;
};

// CREATE MAKE
export const createMake = async (
  req: Request,
  res: Response
) => {
  const make = await prisma.vehicleMake.create({
    data: {
      name: req.body.name,
      slug:
        req.body.slug ||
        slugify(req.body.name, {
          lower: true,
          strict: true,
        }),
      isActive: req.body.isActive ?? true,
    },
  });

  res.status(201).json(make);
};

// CREATE MODEL
export const createModel = async (
  req: Request,
  res: Response
) => {
  const model = await prisma.vehicleModel.create({
    data: {
      makeId: req.body.makeId,
      name: req.body.name,
      slug:
        req.body.slug ||
        slugify(req.body.name, {
          lower: true,
          strict: true,
        }),
      isActive: req.body.isActive ?? true,
    },
  });

  res.status(201).json(model);
};

// CREATE GENERATION
export const createGeneration = async (
  req: Request,
  res: Response
) => {
  const generation = await prisma.vehicleGeneration.create({
    data: {
      modelId: req.body.modelId,
      name: req.body.name,
      slug:
        req.body.slug ||
        slugify(req.body.name, {
          lower: true,
          strict: true,
        }),
      chassisCode: req.body.chassisCode,
      yearStart: req.body.yearStart,
      yearEnd: req.body.yearEnd,
      isActive: req.body.isActive ?? true,
    },
  });

  res.status(201).json(generation);
};

// CREATE ENGINE
export const createEngine = async (
  req: Request,
  res: Response
) => {
  const engine = await prisma.vehicleEngine.create({
    data: {
      generationId: req.body.generationId,

      engineCode: req.body.engineCode,

      engineName: req.body.engineName,

      fuelType: req.body.fuelType,

      aspiration: req.body.aspiration,

      cylinders: req.body.cylinders,

      horsepower: req.body.horsepower,

      displacementCc: req.body.displacementCc,

      displacementLabel: req.body.displacementLabel,

      drivetrain: req.body.drivetrain,

      transmissionType: req.body.transmissionType,

      isActive: req.body.isActive ?? true,
    },
  });

  res.status(201).json(engine);
};

// CREATE TRIM
export const createTrim = async (
  req: Request,
  res: Response
) => {
  const trim = await prisma.vehicleTrim.create({
    data: {
      engineId: req.body.engineId,

      name: req.body.name,

      bodyType: req.body.bodyType,

      doors: req.body.doors,

      isActive: req.body.isActive ?? true,
    },
  });

  res.status(201).json(trim);
};

// ASSIGN SINGLE PRODUCT FITMENT
export const assignProductFitment = async (
  req: Request,
  res: Response
) => {
  const fitment =
    await prisma.productFitment.create({
      data: {
        productId: req.body.productId,

        level: req.body.level,

        makeId: req.body.makeId,

        modelId: req.body.modelId,

        generationId: req.body.generationId,

        engineId: req.body.engineId,

        trimId: req.body.trimId,

        yearStart: req.body.yearStart,

        yearEnd: req.body.yearEnd,

        notes: req.body.notes,

        position: req.body.position,

        quantityRequired:
          req.body.quantityRequired,

        isUniversal:
          req.body.isUniversal ?? false,
      },
    });

  res.status(201).json(fitment);
};

// BULK ASSIGN PRODUCT FITMENT
export const bulkAssignProductFitment =
  async (
    req: Request,
    res: Response
  ) => {
    const {
      productId,
      trimIds,
      notes,
      position,
      quantityRequired,
    } = req.body;

    const trims =
      await prisma.vehicleTrim.findMany({
        where: {
          id: {
            in: trimIds,
          },
        },
        include: {
          engine: {
            include: {
              generation: {
                include: {
                  model: {
                    include: {
                      make: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

    const fitments = trims.map((trim) => ({
      productId,

      level: FitmentLevel.TRIM,

      makeId:
        trim.engine.generation.model.make.id,

      modelId:
        trim.engine.generation.model.id,

      generationId:
        trim.engine.generation.id,

      engineId: trim.engine.id,

      trimId: trim.id,

      yearStart:
        trim.engine.generation.yearStart,

      yearEnd:
        trim.engine.generation.yearEnd,

      notes,

      position,

      quantityRequired,

      isUniversal: false,
    }));

    await prisma.productFitment.createMany({
      data: fitments,
      skipDuplicates: true,
    });

    // FITMENT INDEX GENERATION
    const fitmentIndexes = [];

    for (const trim of trims) {
      const generation =
        trim.engine.generation;

      const yearEnd =
        generation.yearEnd ||
        generation.yearStart;

      for (
        let year = generation.yearStart;
        year <= yearEnd;
        year++
      ) {
        fitmentIndexes.push({
          productId,

          makeId:
            generation.model.make.id,

          make:
            generation.model.make.name,

          modelId:
            generation.model.id,

          model:
            generation.model.name,

          generationId:
            generation.id,

          generation: generation.name,

          engineId: trim.engine.id,

          engineCode:
            trim.engine.engineCode,

          trimId: trim.id,

          trim: trim.name,

          year,

          searchableText: `
            ${generation.model.make.name}
            ${generation.model.name}
            ${generation.name}
            ${trim.engine.engineCode}
            ${trim.name}
            ${year}
          `,
        });
      }
    }

    if (fitmentIndexes.length > 0) {
      await prisma.fitmentIndex.createMany({
        data: fitmentIndexes,
        skipDuplicates: true,
      });
    }

    res.status(201).json({
      message:
        "Fitments assigned successfully",
    });
  };

// GET PRODUCTS BY FITMENT
export const getProductsByFitment =
  async (
    req: Request,
    res: Response
  ) => {
    const {
      makeId,
      modelId,
      generationId,
      engineId,
      trimId,
      year,
    } = req.query;

    const fitmentWhere: any = {};

    if (makeId)
      fitmentWhere.makeId =
        makeId as string;

    if (modelId)
      fitmentWhere.modelId =
        modelId as string;

    if (generationId)
      fitmentWhere.generationId =
        generationId as string;

    if (engineId)
      fitmentWhere.engineId =
        engineId as string;

    if (trimId)
      fitmentWhere.trimId =
        trimId as string;

    if (year) {
      fitmentWhere.OR = [
        {
          yearStart: null,
        },
        {
          AND: [
            {
              yearStart: {
                lte: Number(year),
              },
            },
            {
              OR: [
                {
                  yearEnd: null,
                },
                {
                  yearEnd: {
                    gte: Number(year),
                  },
                },
              ],
            },
          ],
        },
      ];
    }

    const products =
      await prisma.product.findMany({
        where: {
          isActive: true,

          productFitments: {
            some: fitmentWhere,
          },
        },

        include: {
          brand: true,

          category: true,

          medias: true,

          variants: {
            include: {
              inventories: true,
            },
          },
        },
      });

    res.json(products);
  };

// GET FITMENT TREE
export const getVehicleTree = async (
  req: Request,
  res: Response
) => {
  const makes =
    await prisma.vehicleMake.findMany({
      where: {
        isActive: true,
      },

      include: {
        models: {
          where: {
            isActive: true,
          },

          include: {
            generations: {
              where: {
                isActive: true,
              },

              include: {
                engines: {
                  where: {
                    isActive: true,
                  },

                  include: {
                    trims: {
                      where: {
                        isActive: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

  res.json(makes);
};



 // DELETE

export const deleteMake = async (
  req: Request,
  res: Response
) => {
  const id = getParamId(req.params.id);

  await prisma.vehicleMake.delete({
    where: { id },
  });

  res.status(200).json({
    message: "Make deleted",
  });
};

export const deleteModel = async (
  req: Request,
  res: Response
) => {
  const id = getParamId(req.params.id);

  await prisma.vehicleModel.delete({
    where: { id },
  });

  res.status(200).json({
    message: "Model deleted",
  });
};

export const deleteGeneration = async (
  req: Request,
  res: Response
) => {
  const id = getParamId(req.params.id);

  await prisma.vehicleGeneration.delete({
    where: { id },
  });

  res.status(200).json({
    message: "Generation deleted",
  });
};

export const deleteEngine = async (
  req: Request,
  res: Response
) => {
  const id = getParamId(req.params.id);

  await prisma.vehicleEngine.delete({
    where: { id },
  });

  res.status(200).json({
    message: "Engine deleted",
  });
};

export const deleteTrim = async (
  req: Request,
  res: Response
) => {
  const id = getParamId(req.params.id);

  await prisma.vehicleTrim.delete({
    where: { id },
  });

  res.status(200).json({
    message: "Trim deleted",
  });
};

// UPDATE

export const updateMake = async (
  req: Request,
  res: Response
) => {
  const id = getParamId(req.params.id);

  const { name, slug, isActive } = req.body;

  const make = await prisma.vehicleMake.update({
    where: { id },
    data: {
      name,
      slug:
        slug ||
        slugify(name, {
          lower: true,
          strict: true,
        }),
      isActive,
    },
  });

  res.status(200).json(make);
};

export const updateModel = async (
  req: Request,
  res: Response
) => {
  const id = getParamId(req.params.id);

  const { makeId, name, slug, isActive } =
    req.body;

  const model = await prisma.vehicleModel.update({
    where: { id },
    data: {
      makeId,
      name,
      slug:
        slug ||
        slugify(name, {
          lower: true,
          strict: true,
        }),
      isActive,
    },
  });

  res.status(200).json(model);
};

export const updateGeneration = async (
  req: Request,
  res: Response
) => {
  const id = getParamId(req.params.id);

  const {
    modelId,
    name,
    slug,
    chassisCode,
    yearStart,
    yearEnd,
    isActive,
  } = req.body;

  const generation =
    await prisma.vehicleGeneration.update({
      where: { id },
      data: {
        modelId,
        name,
        slug:
          slug ||
          slugify(name, {
            lower: true,
            strict: true,
          }),
        chassisCode,
        yearStart,
        yearEnd,
        isActive,
      },
    });

  res.status(200).json(generation);
};

export const updateEngine = async (
  req: Request,
  res: Response
) => {
  const id = getParamId(req.params.id);

  const {
    generationId,
    engineCode,
    engineName,
    fuelType,
    aspiration,
    cylinders,
    horsepower,
    displacementCc,
    displacementLabel,
    drivetrain,
    transmissionType,
    isActive,
  } = req.body;

  const engine =
    await prisma.vehicleEngine.update({
      where: { id },
      data: {
        generationId,
        engineCode,
        engineName,
        fuelType,
        aspiration,
        cylinders,
        horsepower,
        displacementCc,
        displacementLabel,
        drivetrain,
        transmissionType,
        isActive,
      },
    });

  res.status(200).json(engine);
};

export const updateTrim = async (
  req: Request,
  res: Response
) => {
  const id = getParamId(req.params.id);

  const {
    engineId,
    name,
    bodyType,
    doors,
    isActive,
  } = req.body;

  const trim = await prisma.vehicleTrim.update({
    where: { id },
    data: {
      engineId,
      name,
      bodyType,
      doors,
      isActive,
    },
  });

  res.status(200).json(trim);
};