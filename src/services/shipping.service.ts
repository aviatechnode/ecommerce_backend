import { prisma } from "../lib/prismadb.js";
import { NigerianState } from "@prisma/client";

//////////////////////////////////////////////////////////
// CALCULATE ORDER WEIGHT + VOLUME
//////////////////////////////////////////////////////////

export const calculateOrderMetrics = async (orderId: string) => {
  const items = await prisma.orderItem.findMany({
    where: { orderId },
    include: {
      variant: true,
    },
  });

  let actualWeight = 0;
  let volumetricWeight = 0;

  for (const item of items) {
    const v = item.variant;

    const weight = v.weight ?? 0;
    const length = v.length ?? 0;
    const width = v.width ?? 0;
    const height = v.height ?? 0;

    actualWeight += weight * item.quantity;

    const volume = length * width * height;

    const volumetric = volume / 5000;

    volumetricWeight += volumetric * item.quantity;
  }

  const chargeableWeight = Math.max(actualWeight, volumetricWeight);

  return {
    actualWeight,
    volumetricWeight,
    chargeableWeight,
  };
};

//////////////////////////////////////////////////////////
// GET STATE DISTANCE
//////////////////////////////////////////////////////////

export const getStateDistance = async (
  originState: NigerianState,
  destinationState: NigerianState
) => {
  const route = await prisma.stateDistance.findUnique({
    where: {
      originState_destinationState: {
        originState,
        destinationState,
      },
    },
  });

  if (!route) {
    throw new Error("Distance not defined for route");
  }

  return route.distanceKm;
};

//////////////////////////////////////////////////////////
// CALCULATE SHIPPING FEE
//////////////////////////////////////////////////////////

export const calculateShippingFee = async (
  originState: NigerianState,
  destinationState: NigerianState,
  chargeableWeight: number
) => {
  const distance = await getStateDistance(originState, destinationState);

  const rates = await prisma.shippingRate.findMany({
    where: {
      originState,
      destinationState,
    },
  });

  if (!rates.length) {
    throw new Error("Shipping route not supported");
  }

  let bestOption: any = null;

  for (const rate of rates) {
    const base = Number(rate.baseFee);
    const perKg = Number(rate.perKgFee);
    const perKm = Number(rate.perKmFee);

    const fee =
      base +
      chargeableWeight * perKg +
      distance * perKm;

    if (!bestOption || fee < bestOption.fee) {
      bestOption = {
        fee,
        courierId: rate.courierId,
        distance,
      };
    }
  }

  return bestOption;
};