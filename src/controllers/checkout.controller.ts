import type { Request, Response } from "express";
import { prisma } from "../lib/prismadb.js";
import { Prisma, AddressType, NigerianState } from "@prisma/client";
import { checkoutSchema } from "../schemas/checkout.schema.js";
import { createAddressSchema } from "../schemas/address.schema.js";

import { allocateVariantStock } from "../services/warehouse-allocation.service.js";
import {
  calculateOrderMetrics,
  calculateShippingFee,
} from "../services/shipping.service.js";
import { normalizePhone } from "../utils/phone.utils.js";

/* ======================================================
ORDER NUMBER GENERATOR
====================================================== */
function generateOrderNumber() {
  return `ORD-${Date.now()}`;
}

const RESERVATION_TTL_MINUTES = 15;

/* ======================================================
CHECKOUT CONTROLLER (FINAL - STOCK SAFE + COUPON SAFE)
====================================================== */

export const checkout = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!req.idempotencyKey) {
      return res.status(400).json({ message: "Missing Idempotency Key" });
    }

    const userId = req.user.id;

    const parsed = checkoutSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid checkout data",
        errors: parsed.error.flatten(),
      });
    }

    const { couponCode, address } = parsed.data;
    const addressId = req.body.addressId as string | undefined;

    const result = await prisma.$transaction(async (tx) => {
      /* ======================================================
      IDEMPOTENCY
      ====================================================== */
      const existingKey = await tx.idempotencyKey.findUnique({
        where: { key: req.idempotencyKey! },
      });

      if (existingKey) {
        return {
          isDuplicate: true,
          response: existingKey.response,
        };
      }

      /* ======================================================
      CART
      ====================================================== */
      const cart = await tx.cart.findUnique({
        where: { userId },
        include: {
          items: {
            include: {
              variant: {
                include: { product: true },
              },
            },
          },
        },
      });

      if (!cart || cart.items.length === 0) {
        throw new Error("Cart is empty");
      }

      /* ======================================================
      ADDRESS
      ====================================================== */
      let resolvedAddress;

      if (addressId) {
        resolvedAddress = await tx.address.findFirst({
          where: { id: addressId, userId },
        });

        if (!resolvedAddress) throw new Error("Invalid address");
      } else if (address) {
        const parsedAddress = createAddressSchema.safeParse(address);

        if (!parsedAddress.success) {
          throw new Error("Invalid address data");
        }

        resolvedAddress = await tx.address.create({
          data: {
            userId,
            type: parsedAddress.data.type ?? AddressType.DELIVERY,
            street: parsedAddress.data.street,
            city: parsedAddress.data.city,
            state: parsedAddress.data.state,
            lga: parsedAddress.data.lga,
            phone: normalizePhone(parsedAddress.data.phone),
            country: parsedAddress.data.country ?? "Nigeria",
            landmark: parsedAddress.data.landmark ?? null,
            postalCode: parsedAddress.data.postalCode ?? null,
            isDefault: false,
          },
        });
      } else {
        resolvedAddress = await tx.address.findFirst({
          where: {
            userId,
            type: AddressType.DELIVERY,
            isDefault: true,
          },
        });

        if (!resolvedAddress) {
          throw new Error("No default delivery address found");
        }
      }

      if (
        !Object.values(NigerianState).includes(
          resolvedAddress.state as NigerianState
        )
      ) {
        throw new Error("Invalid delivery state");
      }

      /* ======================================================
      STOCK RESERVATION + SUBTOTAL
      ====================================================== */
      let subtotal = new Prisma.Decimal(0);
      const orderItems: Prisma.OrderItemCreateWithoutOrderInput[] = [];

      for (const item of cart.items) {
        const variant = item.variant;
        if (!variant) throw new Error("Variant missing");

        const allocations = await allocateVariantStock(
          variant.id,
          item.quantity,
          resolvedAddress.state as NigerianState
        );

        for (const alloc of allocations) {
          // 🔐 LOCK STOCK (increase reserved, NOT decrement stock)
          const updated = await tx.productInventory.updateMany({
            where: {
              id: alloc.inventoryId,
              stock: { gte: alloc.quantity },
            },
            data: {
              reserved: { increment: alloc.quantity },
            },
          });

          if (updated.count === 0) {
            throw new Error("Stock conflict");
          }

          // 🧾 CREATE RESERVATION
          await tx.stockReservation.create({
            data: {
              variantId: variant.id,
              warehouseId: alloc.warehouseId,
              quantity: alloc.quantity,
              expiresAt: new Date(
                Date.now() + RESERVATION_TTL_MINUTES * 60 * 1000
              ),
            },
          });
        }

        const price = new Prisma.Decimal(variant.price);
        subtotal = subtotal.add(price.mul(item.quantity));

        orderItems.push({
          variant: { connect: { id: variant.id } },
          productName: variant.product.name,
          variantName: variant.name,
          sku: variant.sku,
          unitPrice: price,
          quantity: item.quantity,
        });
      }

      /* ======================================================
      COUPON
      ====================================================== */
      let discount = new Prisma.Decimal(0);
      let appliedCouponId: string | null = null;

      if (couponCode) {
        const coupon = await tx.coupon.findUnique({
          where: { code: couponCode.toUpperCase() },
        });

        if (!coupon || !coupon.isActive) {
          throw new Error("Invalid coupon");
        }

        if (coupon.expiresAt && coupon.expiresAt < new Date()) {
          throw new Error("Coupon expired");
        }

        if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
          throw new Error("Coupon limit reached");
        }

        // ✅ PER USER LIMIT
        const usageCount = await tx.couponUsage.count({
          where: {
            couponId: coupon.id,
            userId,
          },
        });

        if (coupon.perUserLimit && usageCount >= coupon.perUserLimit) {
          throw new Error("Coupon usage limit reached for this user");
        }

        if (coupon.minOrder && subtotal.lt(coupon.minOrder)) {
          throw new Error(`Minimum order is ${coupon.minOrder}`);
        }

        discount =
          coupon.type === "FIXED"
            ? new Prisma.Decimal(coupon.value)
            : subtotal.mul(coupon.value).div(100);

        if (discount.gt(subtotal)) discount = subtotal;

        const updated = await tx.coupon.updateMany({
          where: {
            id: coupon.id,
            OR: [
              { usageLimit: null },
              { usageLimit: { gt: coupon.usedCount } },
            ],
          },
          data: {
            usedCount: { increment: 1 },
          },
        });

        if (updated.count === 0) {
          throw new Error("Coupon exhausted");
        }

        appliedCouponId = coupon.id;
      }

      /* ======================================================
      CREATE ORDER
      ====================================================== */
      const order = await tx.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          userId,
          status: "PENDING",
          paymentStatus: "PENDING",
          subtotal,
          discountAmount: discount,
          deliveryFee: new Prisma.Decimal(0),
          totalAmount: subtotal.sub(discount),
          currency: "NGN",
          couponId: appliedCouponId,
          items: { create: orderItems },
          address: {
            create: {
              name: req.user.name ?? "Customer",
              phone: resolvedAddress.phone,
              street: resolvedAddress.street,
              city: resolvedAddress.city,
              state: resolvedAddress.state,
              lga: resolvedAddress.lga,
              country: resolvedAddress.country,
            },
          },
        },
        include: { items: true, address: true },
      });

      /* ======================================================
      ATTACH RESERVATIONS TO ORDER
      ====================================================== */
      await tx.stockReservation.updateMany({
        where: {
          orderId: null,
          variantId: { in: cart.items.map(i => i.variantId) },
        },
        data: {
          orderId: order.id,
        },
      });

      /* ======================================================
      COUPON USAGE LOG
      ====================================================== */
      if (appliedCouponId) {
        await tx.couponUsage.create({
          data: {
            couponId: appliedCouponId,
            userId,
            orderId: order.id,
          },
        });
      }

      /* ======================================================
      SHIPPING
      ====================================================== */
      const metrics = await calculateOrderMetrics(order.id);

      const warehouse = await tx.warehouse.findFirst();
      if (!warehouse) throw new Error("No warehouse");

      const shipping = await calculateShippingFee(
        warehouse.state,
        resolvedAddress.state,
        metrics.chargeableWeight
      );

      const deliveryFee = new Prisma.Decimal(shipping.fee);
      const totalAmount = order.totalAmount.add(deliveryFee);

      await tx.order.update({
        where: { id: order.id },
        data: { deliveryFee, totalAmount },
      });

      /* ======================================================
      PAYMENT
      ====================================================== */
      const payment = await tx.payment.create({
        data: {
          orderId: order.id,
          reference: `PAY-${Date.now()}`,
          amount: totalAmount,
          status: "PENDING",
        },
      });

      /* ======================================================
      CLEAR CART
      ====================================================== */
      await tx.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      /* ======================================================
      IDEMPOTENCY SAVE
      ====================================================== */
      const responsePayload = {
        orderId: order.id,
        paymentId: payment.id,
      };

      await tx.idempotencyKey.create({
        data: {
          key: req.idempotencyKey!,
          userId,
          response: responsePayload,
        },
      });

      return {
        isDuplicate: false,
        order,
        payment,
        shipping,
        metrics,
      };
    });

    if (result.isDuplicate) {
      return res.status(200).json({
        message: "Duplicate request",
        data: result.response,
      });
    }

    return res.status(201).json({
      message: "Order created successfully",
      order: result.order,
      payment: result.payment,
      shippingFee: result.shipping.fee,
      distanceKm: result.shipping.distance,
      metrics: result.metrics,
    });
  } catch (error: any) {
    console.error(error);

    if (error.message === "Stock conflict") {
      return res.status(409).json({
        message: "Some items are out of stock",
      });
    }

    return res.status(400).json({
      message: error.message || "Checkout failed",
    });
  }
};