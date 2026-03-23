import type { Request, Response } from "express";
import { prisma } from "../lib/prismadb.js";
import { NigerianState } from "@prisma/client";
import { addToCartSchema, updateQuantitySchema } from "../schemas/cart.schema.js";
import { allocateVariantStock } from "../services/warehouse-allocation.service.js";
import type { PermissionString } from "../utils/rbac.js";
import { calculateShippingFee } from "../services/shipping.service.js";

interface AuthUser {
  id: string;
  roleId: string;
  permissions: PermissionString[];
  isSuperAdmin: boolean;
}

interface AuthRequest extends Request {
  user?: AuthUser;
}

//////////////////////////////////////////////////////////
// CART HELPERS
//////////////////////////////////////////////////////////

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

//////////////////////////////////////////////////////////
// CART METRICS
//////////////////////////////////////////////////////////

function calculateCartMetrics(items: any[]) {
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
}

//////////////////////////////////////////////////////////
// SHIPPING
//////////////////////////////////////////////////////////

async function calculateCartShipping(cartId: string, userId: string) {
  const cart = await prisma.cart.findUnique({
    where: { id: cartId },
    include: {
      items: {
        include: { variant: true },
      },
    },
  });

  if (!cart || !cart.items.length) return 0;

  const address = await prisma.address.findFirst({
    where: {
      userId,
      type: "DELIVERY",
      isDefault: true,
    },
  });

  if (!address) return 0;

  const warehouse = await prisma.warehouse.findFirst();

  if (!warehouse) return 0;

  const metrics = calculateCartMetrics(cart.items);

  const shipping = await calculateShippingFee(
    warehouse.state as NigerianState,
    address.state,
    metrics.chargeableWeight
  );

  return shipping.fee;
}

//////////////////////////////////////////////////////////
// GET CART
//////////////////////////////////////////////////////////

export const getMyCart = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user)
      return res.status(401).json({ message: "Unauthorized" });

    const cart = await getOrCreateCart(req.user.id);

    const fullCart = await prisma.cart.findUnique({
      where: { id: cart.id },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: {
                  include: { medias: true },
                },
              },
            },
          },
        },
      },
    });

    const totals = calculateTotals(fullCart?.items || []);

    const shipping = await calculateCartShipping(cart.id, req.user.id);

    return res.json({
      cart: fullCart,
      totals,
      shipping,
      grandTotal: totals.subtotal + shipping,
    });
  } catch (error) {
    console.error("Get Cart Error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

//////////////////////////////////////////////////////////
// ADD TO CART (WITH WAREHOUSE ALLOCATION)
//////////////////////////////////////////////////////////

export const addToCart = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user)
      return res.status(401).json({ message: "Unauthorized" });

    const parsed = addToCartSchema.safeParse(req.body);

    if (!parsed.success)
      return res.status(400).json({ errors: parsed.error.format() });

    const { variantId, quantity } = parsed.data;

    const variant = await prisma.productVariant.findUnique({
      where: { id: variantId },
      include: {
        product: true,
      },
    });

    if (!variant)
      return res.status(404).json({ message: "Variant not found" });

    if (!variant.product.isActive)
      return res.status(400).json({ message: "Product inactive" });

    const address = await prisma.address.findFirst({
      where: {
        userId: req.user.id,
        type: "DELIVERY",
        isDefault: true,
      },
    });

    if (!address)
      return res.status(400).json({
        message: "Delivery address required",
      });

    const allocations = await allocateVariantStock(
      variantId,
      quantity,
      address.state as NigerianState
    );

    const cart = await getOrCreateCart(req.user.id);

    const item = await prisma.$transaction(async (tx) => {

      const existing = await tx.cartItem.findUnique({
        where: {
          cartId_variantId: {
            cartId: cart.id,
            variantId,
          },
        },
      });

      for (const alloc of allocations) {
        await tx.productInventory.update({
          where: { id: alloc.inventoryId },
          data: {
            reserved: { increment: alloc.quantity },
          },
        });
      }

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
      allocations,
    });

  } catch (error: any) {

    if (error.message === "Out of stock")
      return res.status(400).json({ message: "Out of stock" });

    if (error.message === "Insufficient stock across warehouses")
      return res.status(400).json({ message: error.message });

    console.error("Add To Cart Error:", error);

    return res.status(500).json({ message: "Server error" });
  }
};

//////////////////////////////////////////////////////////
// UPDATE CART ITEM
//////////////////////////////////////////////////////////

export const updateCartItem = async (
  req: AuthRequest & Request<{ id: string }>,
  res: Response
) => {
  try {
    if (!req.user)
      return res.status(401).json({ message: "Unauthorized" });

    const parsed = updateQuantitySchema.safeParse(req.body);

    if (!parsed.success)
      return res.status(400).json({ errors: parsed.error.format() });

    const { quantity } = parsed.data;

    const item = await prisma.cartItem.findUnique({
      where: { id: req.params.id },
      include: {
        cart: true,
        variant: { include: { inventories: true } },
      },
    });

    if (!item || item.cart.userId !== req.user.id)
      return res.status(404).json({ message: "Cart item not found" });

    const inventory = item.variant.inventories[0];

    if (!inventory)
      return res.status(400).json({ message: "Inventory missing" });

    const difference = quantity - item.quantity;

    await prisma.$transaction(async (tx) => {
      await tx.productInventory.update({
        where: { id: inventory.id },
        data: {
          reserved:
            difference > 0
              ? { increment: difference }
              : { decrement: Math.abs(difference) },
        },
      });

      await tx.cartItem.update({
        where: { id: item.id },
        data: { quantity },
      });
    });

    return res.json({ message: "Cart updated" });
  } catch (error) {
    console.error("Update Cart Error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

//////////////////////////////////////////////////////////
// REMOVE CART ITEM
//////////////////////////////////////////////////////////

export const removeCartItem = async (
  req: AuthRequest & Request<{ id: string }>,
  res: Response
) => {
  try {
    if (!req.user)
      return res.status(401).json({ message: "Unauthorized" });

    const item = await prisma.cartItem.findUnique({
      where: { id: req.params.id },
      include: {
        cart: true,
        variant: { include: { inventories: true } },
      },
    });

    if (!item || item.cart.userId !== req.user.id)
      return res.status(404).json({ message: "Cart item not found" });

    const inventory = item.variant.inventories[0];

    if (!inventory)
      return res.status(400).json({ message: "Inventory missing" });

    await prisma.$transaction(async (tx) => {
      await tx.productInventory.update({
        where: { id: inventory.id },
        data: { reserved: { decrement: item.quantity } },
      });

      await tx.cartItem.delete({
        where: { id: item.id },
      });
    });

    return res.json({ message: "Item removed" });
  } catch (error) {
    console.error("Remove Cart Error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

//////////////////////////////////////////////////////////
// CLEAR CART
//////////////////////////////////////////////////////////

export const clearCart = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user)
      return res.status(401).json({ message: "Unauthorized" });

    const cart = await prisma.cart.findUnique({
      where: { userId: req.user.id },
      include: {
        items: {
          include: {
            variant: {
              include: {
                inventories: true,
              },
            },
          },
        },
      },
    });

    if (!cart)
      return res.json({ message: "Cart already empty" });

    await prisma.$transaction(async (tx) => {
      for (const item of cart.items) {
        const inventory = item.variant.inventories[0];

        if (!inventory) continue;

        await tx.productInventory.update({
          where: { id: inventory.id },
          data: {
            reserved: { decrement: item.quantity },
          },
        });
      }

      await tx.cartItem.deleteMany({
        where: { cartId: cart.id },
      });
    });

    return res.json({
      message: "Cart cleared",
    });
  } catch (error) {
    console.error("Clear Cart Error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};