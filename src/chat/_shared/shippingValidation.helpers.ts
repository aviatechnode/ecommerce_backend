import { prisma } from "../../lib/prismadb.js";

/* =========================================================
EXISTENCE CHECKERS
========================================================= */

export async function assertExists(
  model: "courier" | "shippingZone",
  id: string,
  message?: string
) {
  const record = await (prisma as any)[model].findUnique({
    where: { id },
    select: { id: true },
  });

  if (!record) {
    throw new Error(message ?? `${model} not found`);
  }

  return record;
}

/* =========================================================
PRISMA UNIQUE CHECK
========================================================= */

export async function assertUniqueShippingRate(params: {
  courierId: string;
  zoneId: string;
  minWeight: number;
  maxWeight: number;
  excludeId?: string;
}) {
  const { courierId, zoneId, minWeight, maxWeight, excludeId } =
    params;

  const overlap = await prisma.shippingRate.findFirst({
    where: {
      // courierId,
      zoneId,
      isActive: true,

      ...(excludeId
        ? {
            id: { not: excludeId },
          }
        : {}),

      AND: [
        { minWeight: { lte: maxWeight } },
        { maxWeight: { gte: minWeight } },
      ],
    },
  });

  if (overlap) {
    throw new Error(
      "Overlapping shipping rate exists for this courier/zone weight range"
    );
  }

  return true;
}

/* =========================================================
RANGE VALIDATION
========================================================= */

export function assertValidRange(
  min: number,
  max: number,
  label: string
) {
  if (max < min) {
    throw new Error(`${label}: max must be >= min`);
  }
}

/* =========================================================
STRING NORMALIZERS
IMPORTANT: NEVER RETURN undefined (Prisma strict mode fix)
========================================================= */

export function normalizeString(
  value?: string | null
): string | null {
  if (value == null) return null;

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : null;
}

export function normalizeEmail(
  value?: string | null
): string | null {
  const normalized = normalizeString(value);

  return normalized ? normalized.toLowerCase() : null;
}

/* =========================================================
PRISMA SAFE UPDATE BUILDER
========================================================= */

export function buildUpdateData<T extends Record<string, any>>(
  data: T
) {
  return Object.fromEntries(
    Object.entries(data).filter(
      ([_, value]) => value !== undefined
    )
  );
}

/* =========================================================
COURIER UNIQUENESS
========================================================= */

export async function assertUniqueCourier(params: {
  name: string;
  excludeId?: string;
}) {

  // const existing = await prisma.courier.findFirst({
  //   where: {
  //     name: params.name,

  //     ...(params.excludeId
  //       ? {
  //           NOT: {
  //             id: params.excludeId,
  //           },
  //         }
  //       : {}),
  //   },

  //   select: {
  //     id: true,
  //   },
  // });

  // if (existing) {
  //   throw new Error("Courier with this name already exists");
  // }

  // return true;
}