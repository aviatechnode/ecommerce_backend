import type { Request, Response } from "express";
import { prisma } from "../lib/prismadb.js";
import {
  PaymentProvider,
  Prisma,
  PaymentStatus,
  CouponType,
  CouponStatus,
} from "@prisma/client";

import { checkoutSchema } from "../schemas/checkout.schema.js";
import { createAddressSchema } from "../schemas/address.schema.js";

import { ShipmentService } from "../services/shipment/shipment.service.js";
import { ShippingCalculatorService } from "../services/shipment/shipping-calculator.service.js";
import { DistanceService } from "../services/shipment/distance.service.js";

import { normalizePhone } from "../utils/phone.utils.js";

/* ======================================================
INIT SERVICES
====================================================== */
const shipmentService = new ShipmentService(prisma);
const distanceService = new DistanceService(prisma);
const shippingCalculatorService =
  new ShippingCalculatorService(
    prisma,
    distanceService
  );

/* ======================================================
ORDER NUMBER GENERATOR
====================================================== */
function generateOrderNumber() {
  return `ORD-${Date.now()}`;
}

const RESERVATION_TTL_MINUTES = 15;

/* ======================================================
HELPER
====================================================== */
const buildFullAddress = (a: any) =>
  `${a.street}, ${a.city}`;

/* ======================================================
CHECKOUT CONTROLLER
====================================================== */
export const checkout = async (
  req: Request,
  res: Response
) => {
  try {
    /* ======================================================
    AUTH
    ====================================================== */
    if (!req.user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    if (!req.idempotencyKey) {
      return res.status(400).json({
        message: "Missing Idempotency Key",
      });
    }

    const userId = req.user.id;

    /* ======================================================
    VALIDATE REQUEST
    ====================================================== */
    const parsed = checkoutSchema.safeParse(
      req.body
    );

    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid checkout data",
        errors: parsed.error.flatten(),
      });
    }

    const { couponCode, address } =
      parsed.data;

    const addressId = req.body
      .addressId as string | undefined;

    /* ======================================================
    TRANSACTION
    ====================================================== */
    const result = await prisma.$transaction(
      async (tx) => {
        /* ======================================================
        IDEMPOTENCY
        ====================================================== */
        const existingKey =
          await tx.idempotencyKey.findUnique({
            where: {
              key: req.idempotencyKey!,
            },
          });

        if (existingKey) {
          return {
            isDuplicate: true as const,
            response: existingKey.response,
          };
        }

        /* ======================================================
        CART
        ====================================================== */
        const cart = await tx.cart.findUnique({
          where: {
            userId,
          },
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

        if (
          !cart ||
          cart.items.length === 0
        ) {
          throw new Error("Cart is empty");
        }

        /* ======================================================
        ADDRESS
        ====================================================== */
        let resolvedAddress: any;

        if (addressId) {
          resolvedAddress =
            await tx.address.findFirst({
              where: {
                id: addressId,
                userId,
              },
            });

          if (!resolvedAddress) {
            throw new Error(
              "Invalid address"
            );
          }
        } else if (address) {
          const parsedAddress =
            createAddressSchema.safeParse(
              address
            );

          if (!parsedAddress.success) {
            throw new Error(
              "Invalid address data"
            );
          }

          const addr =
            parsedAddress.data;

          resolvedAddress =
            await tx.address.create({
              data: {
                userId,
                name: addr.name,
                phone: normalizePhone(
                  addr.phone
                ),
                stateId: addr.stateId,
                lgaId: addr.lgaId,
                city: addr.city,
                area:
                  addr.area ?? null,
                street: addr.street,
                landmark:
                  addr.landmark ??
                  null,
                fullAddress:
                  buildFullAddress(
                    addr
                  ),
                isDefault: false,
              },
            });
        } else {
          resolvedAddress =
            await tx.address.findFirst({
              where: {
                userId,
                isDefault: true,
              },
            });

          if (!resolvedAddress) {
            throw new Error(
              "No default delivery address found"
            );
          }
        }

        /* ======================================================
        SUBTOTAL + ORDER ITEMS
        ====================================================== */
        let subtotal =
          new Prisma.Decimal(0);

        const orderItems: Prisma.OrderItemCreateWithoutOrderInput[] =
          [];

        for (const item of cart.items) {
          const variant =
            item.variant;

          if (!variant) {
            throw new Error(
              "Variant missing"
            );
          }

          const price =
            new Prisma.Decimal(
              variant.price
            );

          subtotal = subtotal.add(
            price.mul(item.quantity)
          );

          orderItems.push({
            variant: {
              connect: {
                id: variant.id,
              },
            },
            productName:
              variant.product.name,
            variantName:
              variant.name,
            sku: variant.sku,
            unitPrice: price,
            quantity:
              item.quantity,
          });
        }

        /* ======================================================
        COUPON
        ====================================================== */
        let discount =
          new Prisma.Decimal(0);

        let appliedCouponId:
          | string
          | null = null;

        let appliedCoupon: any =
          null;

        if (couponCode) {
          appliedCoupon =
            await tx.coupon.findUnique({
              where: {
                code:
                  couponCode.toUpperCase(),
              },
            });

          if (!appliedCoupon) {
            throw new Error(
              "Invalid coupon"
            );
          }

          if (
            appliedCoupon.status !==
              CouponStatus.ACTIVE ||
            !appliedCoupon.isActive
          ) {
            throw new Error(
              "Coupon is inactive"
            );
          }

          const now =
            new Date();

          if (
            appliedCoupon.startsAt &&
            appliedCoupon.startsAt >
              now
          ) {
            throw new Error(
              "Coupon not started"
            );
          }

          if (
            appliedCoupon.expiresAt &&
            appliedCoupon.expiresAt <
              now
          ) {
            throw new Error(
              "Coupon expired"
            );
          }

          if (
            appliedCoupon.minimumOrderAmount &&
            subtotal.lt(
              appliedCoupon.minimumOrderAmount
            )
          ) {
            throw new Error(
              "Minimum order not met"
            );
          }

          switch (
            appliedCoupon.type
          ) {
            case CouponType.FIXED_AMOUNT:
              discount =
                new Prisma.Decimal(
                  appliedCoupon.amountOff ??
                    0
                );
              break;

            case CouponType.PERCENTAGE:
              discount =
                subtotal
                  .mul(
                    appliedCoupon.percentOff ??
                      0
                  )
                  .div(100);

              if (
                appliedCoupon.maxDiscountAmount &&
                discount.gt(
                  appliedCoupon.maxDiscountAmount
                )
              ) {
                discount =
                  new Prisma.Decimal(
                    appliedCoupon.maxDiscountAmount
                  );
              }
              break;

            case CouponType.FREE_SHIPPING:
              discount =
                new Prisma.Decimal(
                  0
                );
              break;

            default:
              discount =
                new Prisma.Decimal(
                  0
                );
          }

          if (
            discount.gt(
              subtotal
            )
          ) {
            discount = subtotal;
          }

          appliedCouponId =
            appliedCoupon.id;
        }

        /* ======================================================
        CREATE ORDER
        ====================================================== */
        const expiresAt =
          new Date(
            Date.now() +
              RESERVATION_TTL_MINUTES *
                60 *
                1000
          );

        const order =
          await tx.order.create({
            data: {
              orderNumber:
                generateOrderNumber(),
              userId,

              status:
                "PENDING",
              paymentStatus:
                "PENDING",

              subtotal,
              discountAmount:
                discount,
              deliveryFee:
                new Prisma.Decimal(
                  0
                ),

              totalAmount:
                subtotal.sub(
                  discount
                ),

              currency: "NGN",

              couponId:
                appliedCouponId,

              expiresAt,

              items: {
                create:
                  orderItems,
              },

              address: {
                create: {
                  name:
                    resolvedAddress.name,
                  phone:
                    resolvedAddress.phone,
                  stateId:
                    resolvedAddress.stateId,
                  lgaId:
                    resolvedAddress.lgaId,
                  city:
                    resolvedAddress.city,
                  area:
                    resolvedAddress.area ??
                    null,
                  street:
                    resolvedAddress.street,
                  landmark:
                    resolvedAddress.landmark ??
                    null,
                  fullAddress:
                    resolvedAddress.fullAddress,
                },
              },

              events: {
                create: {
                  type:
                    "ORDER_CREATED",
                  message:
                    "Order created successfully",
                },
              },
            },
          });

        /* ======================================================
        SHIPPING
        ====================================================== */
        const shippingItems =
          cart.items.map(
            (item) => ({
              variantId:
                item.variantId,
              quantity:
                item.quantity,
            })
          );

        const shippingOptions =
          await shippingCalculatorService.calculateShippingOptions(
            shippingItems,
            resolvedAddress.stateId,
            resolvedAddress.lgaId
          );

        if (
          !shippingOptions.length
        ) {
          throw new Error(
            "No shipping option available for this delivery location"
          );
        }

        const selectedShipping = shippingOptions[0];

        const shipment = await shipmentService.createShipment(
            order.id,
            selectedShipping.courierId,
            selectedShipping.warehouseId,
            selectedShipping.fee
          );

        let finalDeliveryFee = new Prisma.Decimal(selectedShipping.fee);
        let finalTotalAmount = order.totalAmount.add(finalDeliveryFee);

        if (
          appliedCoupon?.type === CouponType.FREE_SHIPPING
        ) {
          finalDeliveryFee = new Prisma.Decimal(0);

          finalTotalAmount = order.totalAmount;
        }

        const updatedOrder = await tx.order.update({
            where: {
              id: order.id,
            },
            data: {
              deliveryFee:
                finalDeliveryFee,
              totalAmount:
                finalTotalAmount,
            },
          });

        await tx.orderEvent.create({
          data: {
            orderId:
              order.id,
            type:
              "SHIPPING_SELECTED",
            message: `Shipping assigned via ${selectedShipping.courierName}`,
            metadata: {
              courierId:
                selectedShipping.courierId,
              courierName:
                selectedShipping.courierName,
              warehouseId:
                selectedShipping.warehouseId,
              warehouseName:
                selectedShipping.warehouseName,
              fee:
                selectedShipping.fee,
              distanceKm:
                selectedShipping.distanceKm,
              estimatedMinDays:
                selectedShipping.estimatedMinDays,
              estimatedMaxDays:
                selectedShipping.estimatedMaxDays,
            },
          },
        });

        /* ======================================================
        PAYMENT
        ====================================================== */
        const payment =
          await tx.payment.create({
            data: {
              orderId:
                order.id,
              reference: `PAY-${Date.now()}`,
              provider:
                PaymentProvider.PAYSTACK,
              amount:
                updatedOrder.totalAmount,
              currency:
                "NGN",
              status:
                PaymentStatus.PENDING,
            },
          });

        /* ======================================================
        RETURN
        ====================================================== */
        return {
          isDuplicate:
            false as const,
          order:
            updatedOrder,
          payment,
          shipment,
        };
      }
    );

    /* ======================================================
    DUPLICATE REQUEST
    ====================================================== */
    if (result.isDuplicate) {
      return res.status(200).json({
        message:
          "Duplicate request",
        data:
          result.response,
      });
    }

    /* ======================================================
    SUCCESS
    ====================================================== */
    return res.status(201).json({
      message:
        "Order created successfully",
      order:
        result.order,
      payment:
        result.payment,
      shipment:
        result.shipment,
    });
  } catch (error: any) {
    console.error(error);

    if (
      error.message ===
      "Stock conflict"
    ) {
      return res.status(409).json({
        message:
          "Some items are out of stock",
      });
    }

    return res.status(400).json({
      message:
        error.message ||
        "Checkout failed",
    });
  }
};