import type { Request, Response } from "express";
import { prisma } from "../lib/prismadb.js";
import { Prisma, AddressType } from "@prisma/client";
import type { PermissionString } from "../utils/rbac.js";

/* ======================================================
   TYPES
====================================================== */

interface AuthUser {
  id: string;
  roleId: string;
  permissions: PermissionString[];
  isSuperAdmin: boolean;
}

interface AuthRequest extends Request {
  user?: AuthUser;
  idempotencyKey?: string;
}

/* ======================================================
   ORDER NUMBER GENERATOR
====================================================== */

function generateOrderNumber() {
  return `ORD-${Date.now()}`;
}

/* ======================================================
   SELECT INVENTORY (MULTI-WAREHOUSE SAFE)
====================================================== */

function selectInventory(
  inventories: {
    id: string;
    stock: number;
    reserved: number;
    warehouseId: string;
  }[],
  quantity: number
) {
  const inventory = inventories.find(
    (inv) => inv.stock - inv.reserved >= quantity
  );

  if (!inventory) {
    throw new Error("No warehouse has enough available stock");
  }

  return inventory;
}

/* ======================================================
   CHECKOUT CONTROLLER
====================================================== */

export const checkout = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user)
      return res.status(401).json({ message: "Unauthorized" });

    if (!req.idempotencyKey)
      return res.status(400).json({ message: "Missing Idempotency Key" });

    const userId = req.user.id;

    /* ================================================
       CHECK IDEMPOTENCY
    ================================================= */

    const existingKey = await prisma.idempotencyKey.findUnique({
      where: { key: req.idempotencyKey },
    });

    if (existingKey) {
      return res.status(200).json({
        message: "Duplicate request prevented",
        data: existingKey.response,
      });
    }

    /* ================================================
       GET CART
    ================================================= */

    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              include: {
                variants: {
                  include: {
                    pricings: true,
                    inventories: true,
                  },
                },
                specifications: true,
              },
            },
          },
        },
      },
    });

    if (!cart || cart.items.length === 0)
      return res.status(400).json({ message: "Cart is empty" });

    /* ================================================
       GET DELIVERY ADDRESS
    ================================================= */

    const address = await prisma.address.findFirst({
      where: {
        userId,
        type: AddressType.DELIVERY,
        isDefault: true,
      },
    });

    if (!address) {
      return res.status(400).json({
        message: "No default DELIVERY address found",
      });
    }

    /* ================================================
       TRANSACTION
    ================================================= */

    const result = await prisma.$transaction(async (tx) => {

      let subtotal = new Prisma.Decimal(0);

      const orderItems: Prisma.OrderItemCreateWithoutOrderInput[] = [];

      for (const item of cart.items) {

        const product = item.product;

        const variant = product.variants[0];

        if (!variant)
          throw new Error("Product variant missing");

        const pricing = variant.pricings[0];

        if (!pricing)
          throw new Error("Product pricing missing");

        const inventory = selectInventory(
          variant.inventories,
          item.quantity
        );

        /* ============================================
           ATOMIC STOCK LOCK
        ============================================ */

        const stockUpdate = await tx.productInventory.updateMany({
          where: {
            id: inventory.id,
            stock: { gte: item.quantity },
          },
          data: {
            stock: { decrement: item.quantity },
          },
        });

        if (stockUpdate.count === 0) {
          throw new Error("Stock conflict");
        }

        const unitPrice = pricing.salesPrice ?? pricing.price;

        const totalPrice = unitPrice.mul(item.quantity);

        subtotal = subtotal.add(totalPrice);

        orderItems.push({
          product: { connect: { id: product.id } },
          productName: product.name,
          unitPrice,
          quantity: item.quantity,
          totalPrice,
        });
      }

      /* ================================================
         DELIVERY (simplified — can expand later)
      ================================================= */

      const deliveryFee = new Prisma.Decimal(0);

      const totalAmount = subtotal.add(deliveryFee);

      /* ================================================
         CREATE ORDER
      ================================================= */

      const order = await tx.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          user: { connect: { id: userId } },
          subtotal,
          deliveryFee,
          totalAmount,
          currency: "NGN",

          items: {
            create: orderItems,
          },

          address: {
            create: {
              name: address.street,
              phone: address.phone,
              street: address.street,
              city: address.city,
              state: address.state,
              lga: address.lga,
              country: address.country,
            },
          },
        },
        include: {
          items: true,
          address: true,
        },
      });

      /* ================================================
         CREATE PAYMENT
      ================================================= */

      const payment = await tx.payment.create({
        data: {
          orderId: order.id,
          reference: `PAY-${Date.now()}`,
          amount: totalAmount,
          currency: "NGN",
        },
      });

      /* ================================================
         CLEAR CART
      ================================================= */

      await tx.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      /* ================================================
         STORE IDEMPOTENCY
      ================================================= */

      await tx.idempotencyKey.create({
        data: {
          key: req.idempotencyKey!,
          userId,
          response: {
            order,
            payment,
          },
        },
      });

      return { order, payment };
    });

    /* ================================================
       RESPONSE
    ================================================= */

    return res.status(201).json({
      message: "Order created successfully",
      order: result.order,
      payment: result.payment,
    });

  } catch (error: any) {

    if (error.message === "Stock conflict") {
      return res.status(409).json({
        message: "Some items are no longer available",
      });
    }

    console.error("Checkout Error:", error);

    return res.status(400).json({
      message: error.message || "Checkout failed",
    });
  }
};