import type { Request, Response } from "express";
import { prisma } from "../lib/prismadb.js";
import { Prisma, AddressType, NigerianState } from "@prisma/client";
import { allocateVariantStock } from "../services/warehouse-allocation.service.js";
import { calculateOrderMetrics, calculateShippingFee } from "../services/shipping.service.js";
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
CHECKOUT CONTROLLER
====================================================== */

export const checkout = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user)
      return res.status(401).json({ message: "Unauthorized" });

    if (!req.idempotencyKey)
      return res.status(400).json({ message: "Missing Idempotency Key" });

    const userId = req.user.id;

    //////////////////////////////////////////////////////
    // IDEMPOTENCY CHECK
    //////////////////////////////////////////////////////

    const existingKey = await prisma.idempotencyKey.findUnique({
      where: { key: req.idempotencyKey },
    });

    if (existingKey) {
      return res.status(200).json({
        message: "Duplicate request prevented",
        data: existingKey.response,
      });
    }

    //////////////////////////////////////////////////////
    // GET CART
    //////////////////////////////////////////////////////

    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: true,
              },
            },
          },
        },
      },
    });

    if (!cart || cart.items.length === 0)
      return res.status(400).json({ message: "Cart is empty" });

    //////////////////////////////////////////////////////
    // GET DELIVERY ADDRESS
    //////////////////////////////////////////////////////

    const address = await prisma.address.findFirst({
      where: {
        userId,
        type: AddressType.DELIVERY,
        isDefault: true,
      },
    });

    if (!address)
      return res.status(400).json({
        message: "No default DELIVERY address found",
      });

    //////////////////////////////////////////////////////
    // TRANSACTION
    //////////////////////////////////////////////////////

    const result = await prisma.$transaction(async (tx) => {

      let subtotal = new Prisma.Decimal(0);

      const orderItems: Prisma.OrderItemCreateWithoutOrderInput[] = [];

      ////////////////////////////////////////////////////
      // STOCK ALLOCATION
      ////////////////////////////////////////////////////

      for (const item of cart.items) {

        const variant = item.variant;

        if (!variant)
          throw new Error("Variant missing");

        const allocations = await allocateVariantStock(
          variant.id,
          item.quantity,
          address.state as NigerianState
        );

        //////////////////////////////////////////////////
        // DECREMENT STOCK PER WAREHOUSE
        //////////////////////////////////////////////////

        for (const alloc of allocations) {

          const update = await tx.productInventory.updateMany({
            where: {
              id: alloc.inventoryId,
              stock: { gte: alloc.quantity },
            },
            data: {
              stock: { decrement: alloc.quantity },
            },
          });

          if (update.count === 0)
            throw new Error("Stock conflict");
        }

        //////////////////////////////////////////////////
        // PRICE CALCULATION
        //////////////////////////////////////////////////

        const unitPrice = new Prisma.Decimal(variant.price);

        const totalPrice = unitPrice.mul(item.quantity);

        subtotal = subtotal.add(totalPrice);

        //////////////////////////////////////////////////
        // CREATE ORDER ITEM
        //////////////////////////////////////////////////

        orderItems.push({
          variant: { connect: { id: variant.id } },
          productName: variant.product.name,
          variantName: variant.name,
          sku: variant.sku,
          unitPrice,
          quantity: item.quantity,
        });
      }

      ////////////////////////////////////////////////////
      // CREATE ORDER FIRST (needed for shipping metrics)
      ////////////////////////////////////////////////////

      const order = await tx.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          user: { connect: { id: userId } },

          status: "PENDING",
          paymentStatus: "PENDING",

          subtotal,
          deliveryFee: new Prisma.Decimal(0),
          totalAmount: subtotal,

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

      ////////////////////////////////////////////////////
      // CALCULATE SHIPPING
      ////////////////////////////////////////////////////

      const metrics = await calculateOrderMetrics(order.id);

      const warehouse = await tx.warehouse.findFirst();

      if (!warehouse)
        throw new Error("No warehouse configured");

      const shipping = await calculateShippingFee(
        warehouse.state,
        address.state,
        metrics.chargeableWeight
      );

      ////////////////////////////////////////////////////
      // UPDATE ORDER WITH SHIPPING
      ////////////////////////////////////////////////////

      const deliveryFee = new Prisma.Decimal(shipping.fee);

      const totalAmount = subtotal.add(deliveryFee);

      await tx.order.update({
        where: { id: order.id },
        data: {
          deliveryFee,
          totalAmount,
        },
      });

      ////////////////////////////////////////////////////
      // CREATE PAYMENT
      ////////////////////////////////////////////////////

      const payment = await tx.payment.create({
        data: {
          orderId: order.id,
          reference: `PAY-${Date.now()}`,
          amount: totalAmount,
          status: "PENDING",
        },
      });

      ////////////////////////////////////////////////////
      // CLEAR CART
      ////////////////////////////////////////////////////

      await tx.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      ////////////////////////////////////////////////////
      // STORE IDEMPOTENCY RESPONSE
      ////////////////////////////////////////////////////

      await tx.idempotencyKey.create({
        data: {
          key: req.idempotencyKey!,
          userId,
          response: {
            orderId: order.id,
            paymentId: payment.id,
          },
        },
      });

      return {
        order,
        payment,
        shipping,
        metrics,
      };

    });

    //////////////////////////////////////////////////////
    // RESPONSE
    //////////////////////////////////////////////////////

    return res.status(201).json({
      message: "Order created successfully",
      order: result.order,
      payment: result.payment,
      shippingFee: result.shipping.fee,
      distanceKm: result.shipping.distance,
      metrics: result.metrics,
    });

  } catch (error: any) {

    if (error.message === "Stock conflict") {
      return res.status(409).json({
        message: "Some items are no longer available",
      });
    }

    if (error.message === "Out of stock") {
      return res.status(400).json({
        message: "Item is out of stock",
      });
    }

    console.error("Checkout Error:", error);

    return res.status(400).json({
      message: error.message || "Checkout failed",
    });
  }
};