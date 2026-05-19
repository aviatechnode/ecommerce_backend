import type { Request, Response } from "express";
import { prisma } from "../lib/prismadb.js";
import {
  PaymentProvider,
  Prisma,
  PaymentStatus,
  CouponType,
  CouponStatus,
  ShippingMethod,
  ShipmentStatus,
} from "@prisma/client";

import { checkoutSchema } from "../schemas/checkout.schema.js";
import { createAddressSchema } from "../schemas/address.schema.js";
import { normalizePhone } from "../utils/phone.utils.js";
import { ShipmentService } from "../services/shipment/shipment.service.js";
import type { CreateShipmentInput } from "../schemas/shipment/shipment.schema.js";

// ======================================================
// HELPERS
// ======================================================

function generateOrderNumber() {
  return `ORD-${Date.now()}`;
}

function generateTrackingNumber() {
  return `TRK-${Date.now()}-${Math.floor(
    1000 + Math.random() * 9000
  )}`;
}

const RESERVATION_TTL_MINUTES = 15;

const buildFullAddress = (a: any) =>
  `${a.street}, ${a.city}`;

async function calculateTotalWeight(cartItems: any[]) {
  let totalWeight = 0;

  for (const item of cartItems) {
    const weight = item.variant?.weight ?? 0;
    totalWeight += Number(weight) * item.quantity;
  }

  return totalWeight;
}

// ======================================================
// CHECKOUT CONTROLLER
// ======================================================

export const checkout = async (
  req: Request,
  res: Response
) => {
  try {
    // ==================================================
    // AUTH
    // ==================================================

    if (!req.user) {
      return res
        .status(401)
        .json({ message: "Unauthorized" });
    }

    if (!req.idempotencyKey) {
      return res.status(400).json({
        message: "Missing Idempotency Key",
      });
    }

    const userId = req.user.id;

    // ==================================================
    // VALIDATION
    // ==================================================

    const parsed = checkoutSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid checkout data",
        errors: parsed.error.flatten(),
      });
    }

    const {
      couponCode,
      address,
      shippingMethod,
      pickupStationId,
      paymentProvider,
    } = parsed.data;

    const addressId = req.body.addressId as
      | string
      | undefined;

    // ==================================================
    // TRANSACTION
    // ==================================================

    const result = await prisma.$transaction(
      async (tx) => {
        // ==============================================
        // IDEMPOTENCY
        // ==============================================

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

        // ==============================================
        // CART
        // ==============================================

        const cart = await tx.cart.findUnique({
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

        if (!cart || cart.items.length === 0) {
          throw new Error("Cart is empty");
        }

        // ==============================================
        // ADDRESS RESOLUTION
        // ==============================================

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
            throw new Error("Invalid address");
          }
        } else if (address) {
          const parsedAddress =
            createAddressSchema.safeParse(address);

          if (!parsedAddress.success) {
            throw new Error("Invalid address data");
          }

          const addr = parsedAddress.data;

          resolvedAddress = await tx.address.create({
            data: {
              userId,
              name: addr.name,
              phone: normalizePhone(addr.phone),
              stateId: addr.stateId,
              lgaId: addr.lgaId,
              city: addr.city,
              area: addr.area ?? null,
              street: addr.street,
              landmark: addr.landmark ?? null,
              fullAddress: buildFullAddress(addr),
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

        // ==============================================
        // SUBTOTAL & ORDER ITEMS
        // ==============================================

        let subtotal = new Prisma.Decimal(0);

        const orderItems: Prisma.OrderItemCreateWithoutOrderInput[] =
          [];

        for (const item of cart.items) {
          const variant = item.variant;

          if (!variant) {
            throw new Error("Variant missing");
          }

          const price = new Prisma.Decimal(
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

            productName: variant.product.name,
            variantName: variant.name,
            sku: variant.sku,
            unitPrice: price,
            quantity: item.quantity,
          });
        }

        // ==============================================
        // COUPON
        // ==============================================

        let discount = new Prisma.Decimal(0);

        let appliedCouponId: string | null = null;

        let appliedCoupon: any = null;

        if (couponCode) {
          appliedCoupon =
            await tx.coupon.findUnique({
              where: {
                code: couponCode.toUpperCase(),
              },
            });

          if (!appliedCoupon) {
            throw new Error("Invalid coupon");
          }

          if (
            appliedCoupon.status !==
              CouponStatus.ACTIVE ||
            !appliedCoupon.isActive
          ) {
            throw new Error("Coupon is inactive");
          }

          const now = new Date();

          if (
            appliedCoupon.startsAt &&
            appliedCoupon.startsAt > now
          ) {
            throw new Error(
              "Coupon not started"
            );
          }

          if (
            appliedCoupon.expiresAt &&
            appliedCoupon.expiresAt < now
          ) {
            throw new Error("Coupon expired");
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

          switch (appliedCoupon.type) {
            case CouponType.FIXED_AMOUNT:
              discount = new Prisma.Decimal(
                appliedCoupon.amountOff ?? 0
              );
              break;

            case CouponType.PERCENTAGE:
              discount = subtotal
                .mul(
                  appliedCoupon.percentOff ?? 0
                )
                .div(100);

              if (
                appliedCoupon.maxDiscountAmount &&
                discount.gt(
                  appliedCoupon.maxDiscountAmount
                )
              ) {
                discount = new Prisma.Decimal(
                  appliedCoupon.maxDiscountAmount
                );
              }

              break;

            case CouponType.FREE_SHIPPING:
              discount = new Prisma.Decimal(0);
              break;
          }

          if (discount.gt(subtotal)) {
            discount = subtotal;
          }

          appliedCouponId = appliedCoupon.id;
        }

        // ==============================================
        // CREATE ORDER
        // ==============================================

        const expiresAt = new Date(
          Date.now() +
            RESERVATION_TTL_MINUTES *
              60 *
              1000
        );

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

            expiresAt,

            items: {
              create: orderItems,
            },

            address: {
              create: {
                name: resolvedAddress.name,
                phone: resolvedAddress.phone,
                stateId: resolvedAddress.stateId,
                lgaId: resolvedAddress.lgaId,
                city: resolvedAddress.city,
                area:
                  resolvedAddress.area ?? null,
                street: resolvedAddress.street,
                landmark:
                  resolvedAddress.landmark ??
                  null,
                fullAddress:
                  resolvedAddress.fullAddress,
              },
            },

            events: {
              create: {
                type: "ORDER_CREATED",
                message: "Order created",
              },
            },
          },
        });

        // ==============================================
        // SHIPPING CALCULATION
        // ==============================================

        let finalDeliveryFee =
          new Prisma.Decimal(0);

        let shipment = null;

        const deliveryStateId =
          resolvedAddress.stateId;

        const deliveryLgaId =
          resolvedAddress.lgaId;

        // ==============================================
        // PICKUP STATION SHIPPING
        // ==============================================

        if (
          shippingMethod ===
          ShippingMethod.PICKUP_STATION
        ) {
          if (!pickupStationId) {
            throw new Error(
              "pickupStationId required for pickup station shipping"
            );
          }

          const station =
            await tx.pickupStation.findFirst({
              where: {
                id: pickupStationId,
                isActive: true,
              },
            });

          if (!station) {
            throw new Error(
              "Invalid or inactive pickup station"
            );
          }

          finalDeliveryFee =
            new Prisma.Decimal(0);

          // Optional shipment creation for pickup
          const pickupShipmentPayload: CreateShipmentInput =
            {
              orderId: order.id,

              courierId:
                station.courierId,

              shippingRateId: null,

              pickupStationId,

              trackingNumber:
                generateTrackingNumber(),

              status:
                ShipmentStatus.PENDING,

              shippingMethod,

              deliveryFee: 0,

              supportsCOD: false,

              weight:
                await calculateTotalWeight(
                  cart.items
                ),

              estimatedDays: 0,

              notes:
                "Pickup station shipment created",
            };

          shipment =
            await ShipmentService.createShipment(
              pickupShipmentPayload
            );
        } else {
          // ============================================
          // FIND SHIPPING ZONE
          // ============================================

          const zoneLga =
            await tx.shippingZoneLGA.findFirst({
              where: {
                lgaId: deliveryLgaId,
              },
              include: {
                zone: true,
              },
            });

          const zoneState =
            await tx.shippingZoneState.findFirst({
              where: {
                stateId: deliveryStateId,
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
              "No shipping zone covers this delivery location"
            );
          }

          // ============================================
          // ACTIVE COURIER
          // ============================================

          const activeCourier =
            await tx.courier.findFirst({
              where: {
                isActive: true,
              },
            });

          if (!activeCourier) {
            throw new Error(
              "No active courier available"
            );
          }

          // ============================================
          // TOTAL WEIGHT
          // ============================================

          const totalWeight =
            await calculateTotalWeight(
              cart.items
            );

          // ============================================
          // BEST SHIPPING RATE
          // ============================================

          const bestRate =
            await tx.shippingRate.findFirst({
              where: {
                courierId:
                  activeCourier.id,

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
              "No applicable shipping rate for this order"
            );
          }

          // ============================================
          // CALCULATE DELIVERY FEE
          // ============================================

          let deliveryFee =
            new Prisma.Decimal(
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

          finalDeliveryFee = deliveryFee;

          // ============================================
          // CREATE SHIPMENT PAYLOAD
          // ============================================

          const shipmentPayload: CreateShipmentInput =
            {
              orderId: order.id,

              courierId:
                bestRate.courierId,

              shippingRateId:
                bestRate.id,

              pickupStationId: null,

              trackingNumber:
                generateTrackingNumber(),

              status:
                ShipmentStatus.PENDING,

              shippingMethod,

              deliveryFee:
                finalDeliveryFee.toNumber(),

              heavyItemSurcharge: null,

              supportsCOD: false,

              fragileFee: null,

              sameDayFee:
                shippingMethod ===
                ShippingMethod.SAME_DAY
                  ? 0
                  : null,

              weight: totalWeight,

              volumetricWeight: null,

              chargeableWeight:
                totalWeight,

              estimatedDays:
                bestRate.estimatedDaysMin,

              shippedAt: null,

              deliveredAt: null,

              notes: null,

              failedReason: null,
            };

          // ============================================
          // CREATE SHIPMENT
          // ============================================

          shipment =
            await ShipmentService.createShipment(
              shipmentPayload
            );
        }

        // ==============================================
        // FREE SHIPPING COUPON
        // ==============================================

        if (
          appliedCoupon?.type ===
          CouponType.FREE_SHIPPING
        ) {
          finalDeliveryFee =
            new Prisma.Decimal(0);
        }

        // ==============================================
        // UPDATE ORDER TOTALS
        // ==============================================

        const updatedOrder =
          await tx.order.update({
            where: {
              id: order.id,
            },

            data: {
              deliveryFee:
                finalDeliveryFee,

              totalAmount:
                order.totalAmount.add(
                  finalDeliveryFee
                ),
            },
          });

        // ==============================================
        // CREATE PAYMENT
        // ==============================================

        const payment =
          await tx.payment.create({
            data: {
              orderId: order.id,

              reference: `PAY-${Date.now()}`,

              provider:
                paymentProvider as PaymentProvider,

              amount:
                updatedOrder.totalAmount,

              currency: "NGN",

              status:
                PaymentStatus.PENDING,
            },
          });

        // ==============================================
        // STORE IDEMPOTENCY KEY
        // ==============================================

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

        // ==============================================
        // CLEAR CART
        // ==============================================

        await tx.cartItem.deleteMany({
          where: {
            cartId: cart.id,
          },
        });

        // ==============================================
        // RETURN
        // ==============================================

        return {
          isDuplicate: false as const,
          order: updatedOrder,
          payment,
          shipment,
        };
      }
    );

    // ==================================================
    // DUPLICATE RESPONSE
    // ==================================================

    if (result.isDuplicate) {
      return res.status(200).json({
        message: "Duplicate request",
        data: result.response,
      });
    }

    // ==================================================
    // SUCCESS RESPONSE
    // ==================================================

    return res.status(201).json({
      message: "Order created successfully",

      order: result.order,

      payment: result.payment,

      shipment: result.shipment,
    });
  } catch (error: any) {
    console.error(error);

    return res.status(400).json({
      message:
        error?.message || "Checkout failed",
    });
  }
};