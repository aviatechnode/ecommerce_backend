import { shipmentService } from "../services/csl/shipping.service.js";
import type { Request, Response } from "express";
import { prisma } from "../lib/prismadb.js";
import { addToCartSchema, updateQuantitySchema } from "../schemas/cart.schema.js";

import { allocateVariantStock } from "../services/csl/warehouse-allocation.service.js";

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
// SHIPPING (NEW SYSTEM)
//////////////////////////////////////////////////////////

async function calculateCartShipping(cartId: string) {
  try {
    const cart = await prisma.cart.findUnique({
      where: { id: cartId },
      include: {
        items: {
          include: { variant: true },
        },
      },
    });

    if (!cart || cart.items.length === 0) return null;

    // ⚠️ create temp order-like structure
    const fakeOrder = await prisma.order.create({
      data: {
        orderNumber: `TEMP-${Date.now()}`,
        userId: "temp",
        status: "PENDING",
        paymentStatus: "PENDING",
        subtotal: 0,
        deliveryFee: 0,
        totalAmount: 0,
        currency: "NGN",
      },
    });

    // attach items
    for (const item of cart.items) {
      await prisma.orderItem.create({
        data: {
          orderId: fakeOrder.id,
          variantId: item.variantId,
          productName: "temp",
          variantName: "temp",
          sku: "temp",
          unitPrice: item.unitPrice,
          quantity: item.quantity,
        },
      });
    }

    const shipping = await shipmentService.calculate(fakeOrder.id);

    // cleanup
    await prisma.order.delete({
      where: { id: fakeOrder.id },
    });

    return shipping;
  } catch (err) {
    return null; // ⚠️ never crash cart because of shipping
  }
}

//////////////////////////////////////////////////////////
// GET CART
//////////////////////////////////////////////////////////

export const getMyCart = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

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
    const shipping = await calculateCartShipping(cart.id);

    return res.json({
      cart: fullCart,
      totals,
      shipping: shipping?.selected ?? null,
      grandTotal:
        totals.subtotal +
        (shipping?.selected?.finalFee ?? 0),
    });
  } catch (error) {
    console.error("Get Cart Error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

//////////////////////////////////////////////////////////
// ADD TO CART
//////////////////////////////////////////////////////////

export const addToCart = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const parsed = addToCartSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        errors: parsed.error.format(),
      });
    }

    const { variantId, quantity } = parsed.data;

    const variant = await prisma.productVariant.findUnique({
      where: { id: variantId },
      include: {
        product: true,
        inventories: true,
      },
    });

    if (!variant) {
      return res.status(404).json({ message: "Variant not found" });
    }

    if (!variant.product.isActive || !variant.isActive) {
      return res.status(400).json({ message: "Product inactive" });
    }

    const address = await prisma.address.findFirst({
      where: { userId: req.user.id, isDefault: true },
    });

    let allocations: any[] = [];

    if (address) {
      allocations = await allocateVariantStock(
        variantId,
        quantity,
        address.stateId
      );
    } else {
      const availableInventory = variant.inventories.find(
        (inv) => inv.stock - (inv.reserved ?? 0) >= quantity
      );

      if (!availableInventory) {
        return res.status(400).json({ message: "Out of stock" });
      }

      allocations = [
        {
          inventoryId: availableInventory.id,
          quantity,
        },
      ];
    }

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
      addressUsed: !!address,
    });
  } catch (error: any) {
    console.error("Add To Cart Error:", error);

    return res.status(500).json({
      message: error.message || "Server error",
    });
  }
};

//////////////////////////////////////////////////////////
// UPDATE CART ITEM
//////////////////////////////////////////////////////////

export const updateCartItem = async (
  req: Request<{ id: string }>,
  res: Response
) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const parsed = updateQuantitySchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        errors: parsed.error.format(),
      });
    }

    const { quantity } = parsed.data;

    const item = await prisma.cartItem.findUnique({
      where: { id: req.params.id },
      include: {
        cart: true,
        variant: { include: { inventories: true } },
      },
    });

    if (!item || item.cart.userId !== req.user.id) {
      return res.status(404).json({
        message: "Cart item not found",
      });
    }

    const inventory = item.variant.inventories.find(
      (inv) => inv.stock > 0
    );

    if (!inventory) {
      return res.status(400).json({
        message: "Inventory missing",
      });
    }

    const difference = quantity - item.quantity;

    if (
      difference > 0 &&
      inventory.stock - inventory.reserved < difference
    ) {
      return res.status(400).json({
        message: "Insufficient stock",
      });
    }

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

    return res.status(500).json({
      message: "Server error",
    });
  }
};

//////////////////////////////////////////////////////////
// REMOVE CART ITEM
//////////////////////////////////////////////////////////

export const removeCartItem = async (
  req: Request<{ id: string }>,
  res: Response
) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const item = await prisma.cartItem.findUnique({
      where: { id: req.params.id },
      include: {
        cart: true,
        variant: { include: { inventories: true } },
      },
    });

    if (!item || item.cart.userId !== req.user.id) {
      return res.status(404).json({
        message: "Cart item not found",
      });
    }

    const inventory = item.variant.inventories.find(
      (inv) => inv.stock > 0
    );

    if (!inventory) {
      return res.status(400).json({
        message: "Inventory missing",
      });
    }

    await prisma.$transaction(async (tx) => {
      await tx.productInventory.update({
        where: { id: inventory.id },
        data: {
          reserved: { decrement: item.quantity },
        },
      });

      await tx.cartItem.delete({
        where: { id: item.id },
      });
    });

    return res.json({ message: "Item removed" });
  } catch (error) {
    console.error("Remove Cart Error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

//////////////////////////////////////////////////////////
// CLEAR CART
//////////////////////////////////////////////////////////

export const clearCart = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    const cart = await prisma.cart.findUnique({
      where: { userId: req.user.id },
      include: {
        items: { include: { variant: { include: { inventories: true } } } },
      },
    });

    if (!cart) return res.json({ message: "Cart already empty" });

    await prisma.$transaction(async (tx) => {
      for (const item of cart.items) {
        const inv = item.variant.inventories[0];

        if (inv) {
          await tx.productInventory.update({
            where: { id: inv.id },
            data: {
              reserved: { decrement: item.quantity },
            },
          });
        }
      }

      await tx.cartItem.deleteMany({
        where: { cartId: cart.id },
      });
    });

    return res.json({ message: "Cart cleared" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};