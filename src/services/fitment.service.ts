import { prisma } from "../lib/prismadb.js";

//////////////////////////////////////////////////////////
// TYPES
//////////////////////////////////////////////////////////

type FitmentScore = {
  trimId: string;
  score: number;
};

//////////////////////////////////////////////////////////
// CORE: SCORE ENGINE
//////////////////////////////////////////////////////////

export const scoreFitments = async (
  productId: string
): Promise<FitmentScore[]> => {
  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product) return [];

  const keywords = product.name.toLowerCase().split(" ");

  const trims = await prisma.vehicleTrim.findMany({
    include: {
      engine: {
        include: {
          generation: {
            include: {
              model: {
                include: { make: true },
              },
            },
          },
        },
      },
    },
  });

  return trims
    .map((trim) => {
      let score = 0;

      const fullText = [
        trim.name,
        trim.engine.engineCode,
        trim.engine.generation.name,
        trim.engine.generation.model.name,
        trim.engine.generation.model.make.name,
      ]
        .join(" ")
        .toLowerCase();

      for (const word of keywords) {
        if (fullText.includes(word)) score += 10;
      }

      return {
        trimId: trim.id,
        score,
      };
    })
    .filter((t) => t.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 50);
};

//////////////////////////////////////////////////////////
// AUTO ASSIGN (MAIN ENTRY)
//////////////////////////////////////////////////////////

export const autoAssignFitments = async (productId: string) => {
  const scored = await scoreFitments(productId);

  const best = scored.filter((s) => s.score >= 20);

  if (!best.length) return [];

  await prisma.productFitment.createMany({
    data: best.map((b) => ({
      productId,
      trimId: b.trimId,
    })),
    skipDuplicates: true,
  });

  return best;
};

//////////////////////////////////////////////////////////
// INDEX BUILDER (PERFORMANCE)
//////////////////////////////////////////////////////////

export const rebuildFitmentIndex = async (productId: string) => {
  const fitments = await prisma.productFitment.findMany({
    where: { productId },
    include: {
      trim: {
        include: {
          engine: {
            include: {
              generation: {
                include: {
                  model: {
                    include: { make: true },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  const data = fitments.flatMap((f) => {
    const gen = f.trim.engine.generation;

    const years = [];
    for (let y = gen.yearStart; y <= (gen.yearEnd ?? gen.yearStart); y++) {
      years.push(y);
    }

    return years.map((year) => ({
      productId,
      make: gen.model.make.name,
      model: gen.model.name,
      year,
    }));
  });

  await prisma.fitmentIndex.deleteMany({ where: { productId } });

  await prisma.fitmentIndex.createMany({
    data,
    skipDuplicates: true,
  });
};

//////////////////////////////////////////////////////////
// FULL PIPELINE (🔥 USE THIS)
//////////////////////////////////////////////////////////

export const processProductFitments = async (productId: string) => {
  // 1. Auto assign
  await autoAssignFitments(productId);

  // 2. Build index
  await rebuildFitmentIndex(productId);

  return { success: true };
};

//////////////////////////////////////////////////////////
// SEARCH (FRONTEND USES THIS)
//////////////////////////////////////////////////////////

export const searchFitments = async ({
  make,
  model,
  year,
}: {
  make?: string;
  model?: string;
  year?: number;
}) => {
  const where: any = {};

  if (make) {
    where.make = { contains: make, mode: "insensitive" };
  }

  if (model) {
    where.model = { contains: model, mode: "insensitive" };
  }

  if (year) {
    where.year = year;
  }

  // FAST INDEX
  const indexed = await prisma.fitmentIndex.findMany({
    where,
    take: 200,
  });

  const productIds = indexed.map((i) => i.productId);

  // FALLBACK
  if (!productIds.length) {
    return prisma.productFitment.findMany({
      where: {
        trim: {
          engine: {
            generation: {
              ...(model && {
                model: {
                  name: { contains: model, mode: "insensitive" },
                },
              }),
              ...(make && {
                model: {
                  make: {
                    name: { contains: make, mode: "insensitive" },
                  },
                },
              }),
            },
          },
        },
      },
      include: { product: true },
    });
  }

  return prisma.product.findMany({
    where: { id: { in: productIds } },
  });
};