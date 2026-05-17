import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/* =========================================================
SHIPPING ZONE UNIQUENESS CHECKS
========================================================= */

export async function ensureShippingZoneUnique({
  name,
  code,
}: {
  name?: string;
  code?: string;
}) {
  const or: any[] = [];

  if (name) or.push({ name });
  if (code) or.push({ code });

  if (or.length === 0) return;

  const existing = await prisma.shippingZone.findFirst({
    where: {
      OR: or,
    },
    select: { id: true, name: true, code: true },
  });

  if (existing) {
    throw new Error(
      JSON.stringify({
        message: "Shipping zone already exists",
        conflict: existing,
      })
    );
  }
}

/* =========================================================
ZONE ↔ STATE
========================================================= */

export async function ensureZoneStateUnique(zoneId: string, stateId: string) {
  const existing = await prisma.shippingZoneState.findUnique({
    where: {
      zoneId_stateId: {
        zoneId,
        stateId,
      },
    },
  });

  if (existing) {
    throw new Error("This state is already assigned to the zone");
  }
}

/* =========================================================
ZONE ↔ LGA
========================================================= */

export async function ensureZoneLgaUnique(zoneId: string, lgaId: string) {
  const existing = await prisma.shippingZoneLGA.findUnique({
    where: {
      zoneId_lgaId: {
        zoneId,
        lgaId,
      },
    },
  });

  if (existing) {
    throw new Error("This LGA is already assigned to the zone");
  }
}