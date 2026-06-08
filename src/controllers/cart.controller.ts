import type { Request, Response } from "express";
import { ShippingMethod, DeliveryMethod } from "@prisma/client";
import { prisma } from "../lib/prismadb.js";

import {
  addToCartSchema,
  updateQuantitySchema,
  removeCartItemSchema,
  clearCartSchema,
  updateCartDeliverySchema,
  calculateCartShippingSchema,
  mergeCartSchema,
} from "../schemas/cart.schema.js";

import { ShippingService } from "../services/shipping.service.js";

async function getOrCreateCart(userId: string) {
  return prisma.cart.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });
}

function calculateCartMetrics(items: any[]) {
  return items.reduce(
    (acc, item) => {
      const qty = Number(item.quantity || 0);
      const price = Number(item.unitPrice || 0);

      const weight = Number(item.variant?.weight || 0);
      const length = Number(item.variant?.length || 0);
      const width = Number(item.variant?.width || 0);
      const height = Number(item.variant?.height || 0);

      acc.subtotal += price * qty;
      acc.totalItems += qty;

      acc.totalWeight += weight * qty;
      acc.totalVolume += length * width * height * qty;

      return acc;
    },
    {
      subtotal: 0,
      totalItems: 0,
      totalWeight: 0,
      totalVolume: 0,
    }
  );
}

async function estimateShipping(params: {
  stateId: string;
  lgaId: string;
  shippingMethod: ShippingMethod;
  cartItems: any[];
}) {
  const {
    stateId,
    lgaId,
    shippingMethod,
    cartItems,
  } = params;

  const metrics = calculateCartMetrics(cartItems);

  if (!cartItems.length) {
    throw new Error("Cart is empty");
  }

  const shippingService = new ShippingService();

  const zone = await shippingService.findZone({
    stateId,
    lgaId,
    deliveryMethod: shippingMethod as DeliveryMethod,
  });

  if (!zone) {
    throw new Error("No shipping zone covers this location");
  }

  const deliveryFee = await shippingService.getShippingFee({
    stateId,
    lgaId,
    weight: metrics.totalWeight,
    orderValue: metrics.subtotal,
    deliveryMethod: shippingMethod as DeliveryMethod,
  });

  const eligibleRates = zone.rates.filter(
    (rate) => rate.deliveryMethod === shippingMethod && rate.isActive
  );
  const estimatedDays = eligibleRates[0]?.estimatedDaysMax || 3;

  return {
    shippingMethod,
    deliveryFee,
    estimatedDays,
    zone,
    weight: metrics.totalWeight,
    volumetricWeight: 0,
    chargeableWeight: metrics.totalWeight,
  };
}

export const getMyCart = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    const { stateId, lgaId, shippingMethod } = req.query;

    const cart = await getOrCreateCart(user.id);

    const fullCart = await prisma.cart.findUnique({
      where: { id: cart.id },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: { include: { medias: true } },
              },
            },
          },
        },
      },
    });

    const items = fullCart?.items || [];
    const totals = calculateCartMetrics(items);

    let shipping: any = null;

    if (stateId && lgaId && shippingMethod) {
      try {
        shipping = await estimateShipping({
          stateId: String(stateId),
          lgaId: String(lgaId),
          shippingMethod: shippingMethod as ShippingMethod,
          cartItems: items,
        });
      } catch (err: any) {
        shipping = { error: err.message };
      }
    }

    const grandTotal = totals.subtotal + (shipping?.deliveryFee ?? 0);

    return res.json({
      cart: fullCart,
      totals,
      shipping,
      grandTotal,
    });
  } catch (error) {
    console.error("Get Cart Error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const addToCart = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    const parsed = addToCartSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ errors: parsed.error.format() });
    }

    const { variantId, quantity } = parsed.data;

    const variant = await prisma.productVariant.findUnique({
      where: { id: variantId },
      include: { product: true },
    });

    if (!variant) {
      return res.status(404).json({ message: "Variant not found" });
    }

    const cart = await getOrCreateCart(user.id);

    const item = await prisma.$transaction(async (tx) => {
      const existing = await tx.cartItem.findUnique({
        where: {
          cartId_variantId: {
            cartId: cart.id,
            variantId,
          },
        },
      });

      if (existing) {
        return tx.cartItem.update({
          where: { id: existing.id },
          data: {
            quantity: existing.quantity + quantity,
          },
        });
      }

      return tx.cartItem.create({
        data: {
          cartId: cart.id,
          variantId,
          quantity,
          unitPrice: variant.price,
        },
      });
    });

    return res.status(201).json({
      message: "Added to cart",
      item,
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};

export const updateCartItem = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    const parsed = updateQuantitySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ errors: parsed.error.format() });
    }

    const { quantity } = parsed.data;
    const item = await prisma.cartItem.findUnique({
      where: { id: req.params.id },
      include: { cart: true },
    });
    if (!item || item.cart.userId !== user.id) {
      return res.status(404).json({ message: "Cart item not found" });
    }

    await prisma.cartItem.update({
      where: { id: item.id },
      data: { quantity },
    });
    return res.json({ message: "Cart updated" });
  } catch (error) {
    console.error("Update Cart Error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const removeCartItem = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    const parsed = removeCartItemSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ errors: parsed.error.format() });
    }

    const { variantId } = parsed.data;
    const cart = await getOrCreateCart(user.id);
    const existing = await prisma.cartItem.findUnique({
      where: { cartId_variantId: { cartId: cart.id, variantId } },
    });
    if (!existing) {
      return res.status(404).json({ message: "Cart item not found" });
    }

    await prisma.cartItem.delete({ where: { id: existing.id } });
    return res.json({ message: "Item removed" });
  } catch (error) {
    console.error("Remove Cart Error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const clearCart = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    const parsed = clearCartSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ errors: parsed.error.format() });
    }

    const cart = await prisma.cart.findUnique({ where: { userId: user.id } });
    if (!cart) return res.json({ message: "Cart already empty" });

    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    return res.json({ message: "Cart cleared" });
  } catch (error) {
    console.error("Clear Cart Error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const updateCartDelivery = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    const parsed = updateCartDeliverySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ errors: parsed.error.format() });
    }

    const cart = await getOrCreateCart(user.id);

    const updateData: Record<string, any> = {};
    if (parsed.data.deliveryStateId !== undefined)
      updateData.deliveryStateId = parsed.data.deliveryStateId;
    if (parsed.data.deliveryLgaId !== undefined)
      updateData.deliveryLgaId = parsed.data.deliveryLgaId;

    const updatedCart = await prisma.cart.update({
      where: { id: cart.id },
      data: updateData,
    });

    return res.json({ message: "Delivery info updated", cart: updatedCart });
  } catch (error) {
    console.error("Update Cart Delivery Error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const calculateCartShipping = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    const parsed = calculateCartShippingSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ errors: parsed.error.format() });
    }

    const { deliveryStateId, deliveryLgaId } = parsed.data;
    const cart = await getOrCreateCart(user.id);
    const fullCart = await prisma.cart.findUnique({
      where: { id: cart.id },
      include: { items: { include: { variant: true } } },
    });
    if (!fullCart?.items.length) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    const shipping = await estimateShipping({
      stateId: deliveryStateId,
      lgaId: deliveryLgaId,
      shippingMethod: ShippingMethod.STANDARD,
      cartItems: fullCart.items,
    });

    return res.json(shipping);
  } catch (error: any) {
    console.error("Calculate Shipping Error:", error);
    return res.status(500).json({ message: error?.message || "Server error" });
  }
};

export const mergeCart = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    const parsed = mergeCartSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ errors: parsed.error.format() });
    }

    const { items } = parsed.data;
    const userCart = await getOrCreateCart(user.id);

    for (const item of items) {
      await prisma.$transaction(async (tx) => {
        const existing = await tx.cartItem.findUnique({
          where: { cartId_variantId: { cartId: userCart.id, variantId: item.variantId } },
        });
        if (existing) {
          await tx.cartItem.update({
            where: { id: existing.id },
            data: { quantity: existing.quantity + item.quantity },
          });
        } else {
          const variant = await tx.productVariant.findUnique({ where: { id: item.variantId } });
          if (variant?.isActive) {
            await tx.cartItem.create({
              data: {
                cartId: userCart.id,
                variantId: item.variantId,
                quantity: item.quantity,
                unitPrice: variant.price,
              },
            });
          }
        }
      });
    }

    return res.json({ message: "Guest cart merged successfully" });
  } catch (error) {
    console.error("Merge Cart Error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};