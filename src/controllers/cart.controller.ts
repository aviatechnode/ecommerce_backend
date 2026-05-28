import type { Request, Response } from "express";
import { Prisma, ShippingMethod } from "@prisma/client";
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

import { ShippingRateService } from "../services/shipment/shipping-rate.service.js";
import { PickupStationService } from "../services/shipment/pickup-station.service.js";
import { DeliverySLAService } from "../services/shipment/delivery-sla.service.js";

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

async function calculateTotalVolume(cartItems: any[]) {
  let totalVolume = 0;
  for (const item of cartItems) {
    const length = item.variant?.length ?? 0;
    const width = item.variant?.width ?? 0;
    const height = item.variant?.height ?? 0;
    const volume = (length * width * height) * item.quantity;
    totalVolume += volume;
  }
  return totalVolume;
}

async function getEstimatedDeliveryDays(courierId: string, zoneId: string, shippingMethod: ShippingMethod): Promise<number> {
  try {
    // Find SLA for this courier, zone, and shipping method
    const slas = await DeliverySLAService.findByCourier(courierId);
    
    // Find matching SLA for the zone and shipping method
    const matchingSLA = slas.find(
      sla => sla.zoneId === zoneId && sla.shippingMethod === shippingMethod
    );
    
    if (matchingSLA) {
      // Return average of min and max days, or just min days
      return Math.ceil((matchingSLA.minDays + matchingSLA.maxDays) / 2);
    }
    
    // Fallback: find any SLA for this courier and shipping method
    const fallbackSLA = slas.find(
      sla => sla.shippingMethod === shippingMethod
    );
    
    if (fallbackSLA) {
      return Math.ceil((fallbackSLA.minDays + fallbackSLA.maxDays) / 2);
    }
    
    // Default fallback
    return 3;
  } catch (error) {
    console.warn("Failed to calculate SLA, using default:", error);
    return 3;
  }
}

async function estimateShipping(params: {
  stateId: string;
  lgaId: string;
  shippingMethod: ShippingMethod;
  pickupStationId?: string | null;
  cartItems: any[];
  subtotal?: number;
}) {
  const { stateId, lgaId, shippingMethod, pickupStationId, cartItems, subtotal = 0 } = params;

  if (shippingMethod === ShippingMethod.PICKUP_STATION) {
    if (!pickupStationId) throw new Error("pickupStationId is required");

    const station = await PickupStationService.findById(pickupStationId);
    if (!station?.isActive) throw new Error("Pickup station is inactive");

    return {
      shippingMethod,
      deliveryFee: 0,
      estimatedDays: 0,
      courier: station.courier,
      pickupStation: station,
      shippingRate: null,
      zone: null,
      weight: 0,
    };
  }

  // Get shipping zone from LGA or State
  const zoneLga = await prisma.shippingZoneLGA.findFirst({
    where: { lgaId },
    include: { zone: true },
  });

  const zoneState = await prisma.shippingZoneState.findFirst({
    where: { stateId },
    include: { zone: true },
  });

  const zone = zoneLga?.zone ?? zoneState?.zone;
  if (!zone) throw new Error("No shipping zone covers this location");

  // Get active courier
  const courier = await prisma.courier.findFirst({
    where: { isActive: true },
  });

  if (!courier) throw new Error("No active courier available");

  // Calculate weight and volume
  const totalWeight = await calculateTotalWeight(cartItems);
  const totalVolume = await calculateTotalVolume(cartItems);
  
  // Check if remote area (you can implement this logic based on your business rules)
  const isRemoteArea = false; // TODO: Implement remote area detection

  // ✅ USE SHIPPING RATE SERVICE FOR CALCULATION
  const rateCalculation = await ShippingRateService.calculateRate({
    courierId: courier.id,
    zoneId: zone.id,
    actualWeight: totalWeight,
    subtotal: subtotal,
    totalVolume: totalVolume,
    isRemoteArea: isRemoteArea,
  });

  // Get estimated delivery days from SLA service
  const estimatedDays = await getEstimatedDeliveryDays(
    courier.id,
    zone.id,
    shippingMethod
  );

  return {
    shippingMethod,
    deliveryFee: rateCalculation.deliveryFee,
    estimatedDays,
    courier,
    pickupStation: null,
    shippingRate: rateCalculation.shippingRate,
    zone,
    weight: totalWeight,
    volumetricWeight: rateCalculation.volumetricWeight,
    chargeableWeight: rateCalculation.chargeableWeight,
  };
}

export const getMyCart = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    const { stateId, lgaId, shippingMethod, pickupStationId } = req.query;

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
    const totals = calculateTotals(items);
    let shipping: any = null;

    if (stateId && lgaId && shippingMethod) {
      try {
        shipping = await estimateShipping({
          stateId: String(stateId),
          lgaId: String(lgaId),
          shippingMethod: shippingMethod as ShippingMethod,
          pickupStationId: pickupStationId ? String(pickupStationId) : null,
          cartItems: items,
          subtotal: totals.subtotal,
        });
      } catch (err: any) {
        shipping = { error: err?.message || "Shipping calculation failed" };
      }
    }

    const grandTotal = totals.subtotal + (shipping?.deliveryFee || 0);
    return res.json({ cart: fullCart, totals, shipping, grandTotal });
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
    if (!variant) return res.status(404).json({ message: "Variant not found" });
    if (!variant.product.isActive || !variant.isActive) {
      return res.status(400).json({ message: "Product inactive" });
    }

    const cart = await getOrCreateCart(user.id);
    const item = await prisma.$transaction(async (tx) => {
      const existing = await tx.cartItem.findUnique({
        where: { cartId_variantId: { cartId: cart.id, variantId } },
      });
      if (existing) {
        return tx.cartItem.update({
          where: { id: existing.id },
          data: { quantity: existing.quantity + quantity },
        });
      }
      return tx.cartItem.create({
        data: { cartId: cart.id, variantId, quantity, unitPrice: variant.price },
      });
    });

    return res.status(201).json({ message: "Added to cart", item });
  } catch (error: any) {
    console.error("Add To Cart Error:", error);
    return res.status(500).json({ message: error?.message || "Server error" });
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
    if (parsed.data.shippingZoneId !== undefined)
      updateData.shippingZoneId = parsed.data.shippingZoneId;

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

    const totals = calculateTotals(fullCart.items);
    
    const shipping = await estimateShipping({
      stateId: deliveryStateId,
      lgaId: deliveryLgaId,
      shippingMethod: ShippingMethod.STANDARD,
      pickupStationId: null,
      cartItems: fullCart.items,
      subtotal: totals.subtotal,
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