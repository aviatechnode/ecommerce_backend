import type { Request, Response } from "express";
import { Prisma, ShippingMethod } from "@prisma/client";

import { prisma } from "../lib/prismadb.js";

import {
  addToCartSchema,
  updateQuantitySchema,
} from "../schemas/cart.schema.js";

import { PickupStationService } from "../services/shipment/pickup-station.service.js";
// HELPERS
async function getOrCreateCart(userId: string) {
  return prisma.cart.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });
}

function calculateTotals(items: any[]) {
  let subtotal = 0;
  let totalItems = 0;

  for (const item of items) {
    subtotal += Number(item.unitPrice) * item.quantity;
    totalItems += item.quantity;
  }

  return { subtotal, totalItems };
}

async function calculateTotalWeight(cartItems: any[]) {
  let totalWeight = 0;

  for (const item of cartItems) {
    const weight = item.variant?.weight ?? 0;

    totalWeight += Number(weight) * item.quantity;
  }

  return totalWeight;
}

// SHIPPING ESTIMATOR
async function estimateShipping(params: {
  stateId: string;
  lgaId: string;
  shippingMethod: ShippingMethod;
  pickupStationId?: string | null;
  cartItems: any[];
}) {
  const {
    stateId,
    lgaId,
    shippingMethod,
    pickupStationId,
    cartItems,
  } = params;

  // PICKUP STATION SHIPPING
  if (
    shippingMethod ===
    ShippingMethod.PICKUP_STATION
  ) {
    if (!pickupStationId) {
      throw new Error(
        "pickupStationId is required"
      );
    }

    const station =
      await PickupStationService.findById(
        pickupStationId
      );

    if (!station.isActive) {
      throw new Error(
        "Pickup station is inactive"
      );
    }

    return {
      shippingMethod,
      deliveryFee: 0,
      estimatedDays: 0,
      courier: station.courier,
      pickupStation: station,
      shippingRate: null,
      zone: null,
    };
  }

  // FIND SHIPPING ZONE
  const zoneLga =
    await prisma.shippingZoneLGA.findFirst({
      where: {
        lgaId,
      },

      include: {
        zone: true,
      },
    });

  const zoneState =
    await prisma.shippingZoneState.findFirst({
      where: {
        stateId,
      },

      include: {
        zone: true,
      },
    });

  const zone =
    zoneLga?.zone ??
    zoneState?.zone;

  if (!zone) {
    throw new Error(
      "No shipping zone covers this location"
    );
  }

  // ACTIVE COURIER
  const activeCourier =
    await prisma.courier.findFirst({
      where: {
        isActive: true,
      },
    });

  if (!activeCourier) {
    throw new Error(
      "No active courier available"
    );
  }

  // TOTAL WEIGHT
  const totalWeight = await calculateTotalWeight(cartItems);

  // BEST SHIPPING RATE
  const bestRate = await prisma.shippingRate.findFirst({
      where: {
        courierId: activeCourier.id,

        zoneId: zone.id,

        isActive: true,

        minWeight: {
          lte: totalWeight,
        },

        maxWeight: {
          gte: totalWeight,
        },
      },

      orderBy: [
        {
          baseFee: "asc",
        },

        {
          perKgFee: "asc",
        },
      ],
    });

  if (!bestRate) {
    throw new Error(
      "No shipping rate available"
    );
  }

  // CALCULATE DELIVERY FEE
  let deliveryFee = new Prisma.Decimal(
      bestRate.baseFee
    );

  if (
    bestRate.perKgFee &&
    totalWeight > 0
  ) {
    deliveryFee = deliveryFee.add(
      new Prisma.Decimal(
        bestRate.perKgFee
      ).mul(totalWeight)
    );
  }

  if (bestRate.fixedFee) {
    deliveryFee = deliveryFee.add(
      new Prisma.Decimal(
        bestRate.fixedFee
      )
    );
  }

  return {
    shippingMethod,

    deliveryFee:
      deliveryFee.toNumber(),

    estimatedDays:
      bestRate.estimatedDaysMin,

    courier: activeCourier,

    pickupStation: null,

    shippingRate: bestRate,

    zone,

    weight: totalWeight,
  };
}

// GET CART
export const getMyCart = async (
  req: Request,
  res: Response
) => {
  try {
    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    // QUERY PARAMS
    const {
      stateId,
      lgaId,
      shippingMethod,
      pickupStationId,
    } = req.query;

    // CART
    const cart =
      await getOrCreateCart(user.id);

    const fullCart =
      await prisma.cart.findUnique({
        where: {
          id: cart.id,
        },

        include: {
          items: {
            include: {
              variant: {
                include: {
                  product: {
                    include: {
                      medias: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

    const items =
      fullCart?.items || [];

    // TOTALS
    const totals =
      calculateTotals(items);

    let shipping: any = null;

    // OPTIONAL SHIPPING ESTIMATION
    if (
      stateId &&
      lgaId &&
      shippingMethod
    ) {
      try {
        shipping =
          await estimateShipping({
            stateId: String(stateId),

            lgaId: String(lgaId),

            shippingMethod:
              shippingMethod as ShippingMethod,

            pickupStationId:
              pickupStationId
                ? String(
                    pickupStationId
                  )
                : null,

            cartItems: items,
          });
      } catch (err: any) {
        shipping = {
          error:
            err?.message ||
            "Shipping calculation failed",
        };
      }
    }

    // GRAND TOTAL
    const grandTotal =
      totals.subtotal +
      (shipping?.deliveryFee || 0);

    // RESPONSE
    return res.json({
      cart: fullCart,

      totals,

      shipping,

      grandTotal,
    });
  } catch (error) {
    console.error(
      "Get Cart Error:",
      error
    );

    return res.status(500).json({
      message: "Server error",
    });
  }
};

// ADD TO CART
export const addToCart = async (
  req: Request,
  res: Response
) => {
  try {
    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const parsed =
      addToCartSchema.safeParse(
        req.body
      );

    if (!parsed.success) {
      return res.status(400).json({
        errors:
          parsed.error.format(),
      });
    }

    const {
      variantId,
      quantity,
    } = parsed.data;

    const variant =
      await prisma.productVariant.findUnique(
        {
          where: {
            id: variantId,
          },

          include: {
            product: true,
          },
        }
      );

    if (!variant) {
      return res.status(404).json({
        message:
          "Variant not found",
      });
    }

    if (
      !variant.product.isActive ||
      !variant.isActive
    ) {
      return res.status(400).json({
        message:
          "Product inactive",
      });
    }

    const cart =
      await getOrCreateCart(
        user.id
      );

    const item =
      await prisma.$transaction(
        async (tx) => {
          const existing =
            await tx.cartItem.findUnique(
              {
                where: {
                  cartId_variantId:
                    {
                      cartId:
                        cart.id,

                      variantId,
                    },
                },
              }
            );

          if (existing) {
            return tx.cartItem.update(
              {
                where: {
                  id: existing.id,
                },

                data: {
                  quantity:
                    existing.quantity +
                    quantity,
                },
              }
            );
          }

          return tx.cartItem.create({
            data: {
              cartId: cart.id,

              variantId,

              quantity,

              unitPrice:
                variant.price,
            },
          });
        }
      );

    return res.status(201).json({
      message:
        "Added to cart",

      item,
    });
  } catch (error: any) {
    console.error(
      "Add To Cart Error:",
      error
    );

    return res.status(500).json({
      message:
        error?.message ||
        "Server error",
    });
  }
};

// UPDATE CART ITEM
export const updateCartItem = async (
  req: Request<{ id: string }>,
  res: Response
) => {
  try {
    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const parsed =
      updateQuantitySchema.safeParse(
        req.body
      );

    if (!parsed.success) {
      return res.status(400).json({
        errors:
          parsed.error.format(),
      });
    }

    const { quantity } =
      parsed.data;

    const item =
      await prisma.cartItem.findUnique(
        {
          where: {
            id: req.params.id,
          },

          include: {
            cart: true,
          },
        }
      );

    if (
      !item ||
      item.cart.userId !==
        user.id
    ) {
      return res.status(404).json({
        message:
          "Cart item not found",
      });
    }

    await prisma.cartItem.update({
      where: {
        id: item.id,
      },

      data: {
        quantity,
      },
    });

    return res.json({
      message:
        "Cart updated",
    });
  } catch (error) {
    console.error(
      "Update Cart Error:",
      error
    );

    return res.status(500).json({
      message: "Server error",
    });
  }
};

// REMOVE CART ITEM
export const removeCartItem = async (
  req: Request<{ id: string }>,
  res: Response
) => {
  try {
    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const item =
      await prisma.cartItem.findUnique(
        {
          where: {
            id: req.params.id,
          },

          include: {
            cart: true,
          },
        }
      );

    if (
      !item ||
      item.cart.userId !==
        user.id
    ) {
      return res.status(404).json({
        message:
          "Cart item not found",
      });
    }

    await prisma.cartItem.delete({
      where: {
        id: item.id,
      },
    });

    return res.json({
      message:
        "Item removed",
    });
  } catch (error) {
    console.error(
      "Remove Cart Error:",
      error
    );

    return res.status(500).json({
      message: "Server error",
    });
  }
};

// CLEAR CART
export const clearCart = async (
  req: Request,
  res: Response
) => {
  try {
    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const cart =
      await prisma.cart.findUnique({
        where: {
          userId: user.id,
        },
      });

    if (!cart) {
      return res.json({
        message:
          "Cart already empty",
      });
    }

    await prisma.cartItem.deleteMany({
      where: {
        cartId: cart.id,
      },
    });

    return res.json({
      message:
        "Cart cleared",
    });
  } catch (error) {
    console.error(
      "Clear Cart Error:",
      error
    );

    return res.status(500).json({
      message: "Server error",
    });
  }
};