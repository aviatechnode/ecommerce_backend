import type { Request, Response } from "express";
import { prisma } from "../lib/prismadb.js";
import {
  Prisma,
  PaymentStatus,
  CouponType,
  CouponStatus,
  ShippingMethod,
  ShipmentStatus,
  OrderStatus,
  CouponReservationStatus,
} from "@prisma/client";
import { checkoutSchema } from "../schemas/checkout.schema.js";
import { createAddressSchema } from "../schemas/address.schema.js";
import { normalizePhone } from "../utils/phone.utils.js";
import { ShippingRateService } from "../services/shipment/shipping-rate.service.js";
import { PaymentService } from "../services/payment/payment.service.js";
import { StockReservationService } from "../services/inventory/stock.reservation.service.js";
import { WarehouseService } from "../services/shipment/warehouse.service.js";
import { CheckoutSessionService } from "../services/shipment/checkout-session.service.js";
import { ShippingQuoteService } from "../services/shipment/shipping-quote.service.js";
import { FulfillmentService } from "../services/shipment/fulfillment.service.js";

function generateOrderNumber() {
  return `ORD-${Date.now()}`;
}

function generateTrackingNumber() {
  return `TRK-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
}

const RESERVATION_TTL_MINUTES = 15;
const SESSION_TTL_MINUTES = 30;

const buildFullAddress = (a: any) => `${a.street}, ${a.city}`;

async function calculateTotalWeight(cartItems: any[]) {
  let totalWeight = 0;
  for (const item of cartItems) {
    const weight = item.variant?.weight ?? 0;
    totalWeight += Number(weight) * item.quantity;
  }
  return totalWeight;
}

async function getShippingEstimate(params: {
  stateId: string;
  lgaId: string;
  shippingMethod: ShippingMethod;
  pickupStationId?: string | null;
  cartItems: any[];
}) {
  const { stateId, lgaId, shippingMethod, pickupStationId, cartItems } = params;

  if (shippingMethod === ShippingMethod.PICKUP_STATION) {
    if (!pickupStationId) throw new Error("pickupStationId is required");
    const station = await prisma.pickupStation.findFirst({
      where: { id: pickupStationId, isActive: true },
      include: { courier: true },
    });
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

  const activeCourier = await prisma.courier.findFirst({ where: { isActive: true } });
  if (!activeCourier) throw new Error("No active courier available");

  const totalWeight = await calculateTotalWeight(cartItems);
  const bestRate = await ShippingRateService.findBestRate({
    courierId: activeCourier.id,
    zoneId: zone.id,
    weight: totalWeight,
  });
  if (!bestRate) throw new Error("No suitable shipping rate found");

  let deliveryFee = new Prisma.Decimal(bestRate.baseFee);
  if (bestRate.perKgFee && totalWeight > 0) {
    deliveryFee = deliveryFee.add(new Prisma.Decimal(bestRate.perKgFee).mul(totalWeight));
  }
  if (bestRate.fixedFee) deliveryFee = deliveryFee.add(new Prisma.Decimal(bestRate.fixedFee));

  let estimatedDays = 3;
  const sla = await prisma.deliverySLA.findMany({ where: { courierId: activeCourier.id } });
  const matchingSla = sla.find(s => s.zoneId === zone.id);
  if (matchingSla) estimatedDays = matchingSla.minDays;

  return {
    shippingMethod,
    deliveryFee: deliveryFee.toNumber(),
    estimatedDays,
    courier: activeCourier,
    pickupStation: null,
    shippingRate: bestRate,
    zone,
    weight: totalWeight,
  };
}

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

    const { couponCode, address, shippingMethod, pickupStationId } = parsed.data;
    const addressId = req.body.addressId as string | undefined;

    // 1. Get cart and resolve address
    const cart = await prisma.cart.findUnique({
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
    if (!cart || cart.items.length === 0) throw new Error("Cart is empty");

    let resolvedAddress: any;
    if (addressId) {
      resolvedAddress = await prisma.address.findFirst({ where: { id: addressId, userId } });
      if (!resolvedAddress) throw new Error("Invalid address");
    } else if (address) {
      const parsedAddress = createAddressSchema.safeParse(address);
      if (!parsedAddress.success) throw new Error("Invalid address data");
      const addr = parsedAddress.data;
      resolvedAddress = await prisma.address.create({
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
      resolvedAddress = await prisma.address.findFirst({ where: { userId, isDefault: true } });
      if (!resolvedAddress) throw new Error("No default delivery address found");
    }

    // 2. Calculate subtotal and discount preview
    let subtotal = new Prisma.Decimal(0);
    for (const item of cart.items) {
      const variant = item.variant;
      if (!variant) throw new Error("Variant missing");
      subtotal = subtotal.add(new Prisma.Decimal(variant.price).mul(item.quantity));
    }

    let discount = new Prisma.Decimal(0);
    let appliedCoupon: any = null;
    if (couponCode) {
      appliedCoupon = await prisma.coupon.findUnique({ where: { code: couponCode.toUpperCase() } });
      if (!appliedCoupon) throw new Error("Invalid coupon");
      if (appliedCoupon.status !== CouponStatus.ACTIVE || !appliedCoupon.isActive)
        throw new Error("Coupon is inactive");
      const now = new Date();
      if (appliedCoupon.startsAt && appliedCoupon.startsAt > now) throw new Error("Coupon not started");
      if (appliedCoupon.expiresAt && appliedCoupon.expiresAt < now) throw new Error("Coupon expired");
      if (appliedCoupon.minimumOrderAmount && subtotal.lt(appliedCoupon.minimumOrderAmount))
        throw new Error("Minimum order not met");

      switch (appliedCoupon.type) {
        case CouponType.FIXED_AMOUNT:
          discount = new Prisma.Decimal(appliedCoupon.amountOff ?? 0);
          break;
        case CouponType.PERCENTAGE:
          discount = subtotal.mul(appliedCoupon.percentOff ?? 0).div(100);
          if (appliedCoupon.maxDiscountAmount && discount.gt(appliedCoupon.maxDiscountAmount))
            discount = new Prisma.Decimal(appliedCoupon.maxDiscountAmount);
          break;
        case CouponType.FREE_SHIPPING:
          discount = new Prisma.Decimal(0);
          break;
      }
      if (discount.gt(subtotal)) discount = subtotal;
    }

    // 3. Create a checkout session
    const sessionExpiresAt = new Date(Date.now() + SESSION_TTL_MINUTES * 60 * 1000);
    const session = await CheckoutSessionService.create({
      cartId: cart.id,
      userId,
      deliveryLgaId: resolvedAddress.lgaId,
      subtotal: subtotal.toNumber(),
      deliveryFee: 0,
      totalAmount: subtotal.sub(discount).toNumber(),
      expiresAt: sessionExpiresAt,
    });

    // 4. Generate a shipping quote for the selected method
    const shippingEstimate = await getShippingEstimate({
      stateId: resolvedAddress.stateId,
      lgaId: resolvedAddress.lgaId,
      shippingMethod,
      pickupStationId: pickupStationId ?? null,
      cartItems: cart.items,
    });

    const weightValue = shippingEstimate.weight ?? 0;
    const volumetricWeightValue = weightValue;
    const chargeableWeightValue = weightValue;

    const shippingQuote = await ShippingQuoteService.create({
      checkoutSessionId: session.id,
      courierName: shippingEstimate.courier.name,
      shippingMethod: shippingEstimate.shippingMethod,
      zoneName: shippingEstimate.zone?.name ?? "Unknown",
      weight: weightValue,
      volumetricWeight: volumetricWeightValue,
      chargeableWeight: chargeableWeightValue,
      baseFee: shippingEstimate.deliveryFee,
      surcharges: 0,
      totalFee: shippingEstimate.deliveryFee,
      estimatedMinDays: shippingEstimate.estimatedDays,
      estimatedMaxDays: shippingEstimate.estimatedDays + 1,
      rawCalculation: {},
    });

    const totalAmountAfterShipping = subtotal.sub(discount).add(shippingEstimate.deliveryFee);
    await CheckoutSessionService.update(session.id, {
      deliveryFee: shippingEstimate.deliveryFee,
      totalAmount: totalAmountAfterShipping.toNumber(),
      shippingQuoteId: shippingQuote.id,
    });

    // 5. Create order (within transaction)
    const result = await prisma.$transaction(async (tx) => {
      const existingKey = await tx.idempotencyKey.findUnique({
        where: { key: req.idempotencyKey! },
      });
      if (existingKey) {
        return { isDuplicate: true as const, response: existingKey.response };
      }

      // Build order items
      const orderItemsData: Prisma.OrderItemCreateWithoutOrderInput[] = [];
      for (const item of cart.items) {
        const variant = item.variant!;
        orderItemsData.push({
          variant: { connect: { id: variant.id } },
          productName: variant.product.name,
          variantName: variant.name,
          sku: variant.sku,
          unitPrice: variant.price,
          quantity: item.quantity,
        });
      }

      const orderExpiresAt = new Date(Date.now() + RESERVATION_TTL_MINUTES * 60 * 1000);
      const order = await tx.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          userId,
          status: OrderStatus.PENDING_PAYMENT,
          paymentStatus: PaymentStatus.PENDING,
          subtotal,
          discountAmount: discount,
          deliveryFee: new Prisma.Decimal(shippingEstimate.deliveryFee),
          totalAmount: totalAmountAfterShipping,
          currency: "NGN",
          couponId: appliedCoupon?.id ?? null,
          expiresAt: orderExpiresAt,
          items: { create: orderItemsData },
          address: {
            create: {
              name: resolvedAddress.name,
              phone: resolvedAddress.phone,
              stateId: resolvedAddress.stateId,
              lgaId: resolvedAddress.lgaId,
              city: resolvedAddress.city,
              area: resolvedAddress.area ?? null,
              street: resolvedAddress.street,
              landmark: resolvedAddress.landmark ?? null,
              fullAddress: resolvedAddress.fullAddress,
            },
          },
          events: { create: { type: "ORDER_CREATED", message: "Order created" } },
        },
        include: { items: true }, // ✅ include items so we have their IDs
      });

      // Stock reservation with warehouse selection
      const stockItems = cart.items.map(item => ({
        variantId: item.variantId,
        quantity: item.quantity,
      }));
      const warehouse = await WarehouseService.findBestWarehouseForDelivery(
        resolvedAddress.stateId,
        resolvedAddress.lgaId,
        stockItems
      );
      await StockReservationService.reserveItems({
        orderId: order.id,
        items: stockItems,
        expiresInMinutes: RESERVATION_TTL_MINUTES,
        warehouseId: warehouse.id,
      });

      if (appliedCoupon && appliedCoupon.type !== CouponType.FREE_SHIPPING && discount.gt(0)) {
        await tx.couponReservation.create({
          data: {
            couponId: appliedCoupon.id,
            userId,
            orderId: order.id,
            status: CouponReservationStatus.ACTIVE,
            reservedDiscountAmount: discount,
            expiresAt: new Date(Date.now() + 15 * 60 * 1000),
          },
        });
      }

      // Fulfillment & shipment creation
      let finalDeliveryFee = new Prisma.Decimal(shippingEstimate.deliveryFee);
      let shipment = null;

      // Prepare fulfillment items from the order items
      const fulfillmentItems = order.items.map(orderItem => ({
        orderItemId: orderItem.id,
        quantity: orderItem.quantity,
      }));

      if (shippingMethod === ShippingMethod.PICKUP_STATION) {
        if (!pickupStationId) throw new Error("pickupStationId required");
        const station = await tx.pickupStation.findFirst({
          where: { id: pickupStationId, isActive: true },
          include: { courier: true },
        });
        if (!station) throw new Error("Invalid pickup station");
        finalDeliveryFee = new Prisma.Decimal(0);

        // ✅ Use FulfillmentService to create fulfillment (and its items)
        const fulfillment = await FulfillmentService.create({
          orderId: order.id,
          warehouseId: warehouse.id,
          status: "PENDING",
          items: fulfillmentItems,
        });

        shipment = await tx.shipment.create({
          data: {
            fulfillmentId: fulfillment.id,
            type: "OUTBOUND",
            courierId: station.courierId,
            trackingNumber: generateTrackingNumber(),
            status: ShipmentStatus.PENDING,
            shippingMethod,
            deliveryFee: 0,
            weight: await calculateTotalWeight(cart.items),
            orderId: order.id,
            pickupStationId: station.id,
          },
        });
      } else {
        const activeCourier = shippingEstimate.courier;
        const totalWeight = shippingEstimate.weight;
        const bestRate = shippingEstimate.shippingRate;

        // ✅ Use FulfillmentService to create fulfillment (and its items)
        const fulfillment = await FulfillmentService.create({
          orderId: order.id,
          warehouseId: warehouse.id,
          status: "PENDING",
          items: fulfillmentItems,
        });

        shipment = await tx.shipment.create({
          data: {
            fulfillmentId: fulfillment.id,
            type: "OUTBOUND",
            courierId: activeCourier.id,
            shippingRateId: bestRate!.id,
            trackingNumber: generateTrackingNumber(),
            status: ShipmentStatus.PENDING,
            shippingMethod,
            deliveryFee: finalDeliveryFee.toNumber(),
            weight: totalWeight ?? null,
            chargeableWeight: totalWeight ?? null,
            orderId: order.id,
          },
        });
      }

      if (appliedCoupon?.type === CouponType.FREE_SHIPPING) {
        finalDeliveryFee = new Prisma.Decimal(0);
      }

      await tx.order.update({
        where: { id: order.id },
        data: {
          deliveryFee: finalDeliveryFee,
          totalAmount: order.totalAmount.add(finalDeliveryFee),
        },
      });

      // Payment initialization
      const paymentInit = await PaymentService.initializePayment({
        orderId: order.id,
        email: req.user.email,
        amount: Number(order.totalAmount.add(finalDeliveryFee)),
        metadata: { orderNumber: order.orderNumber },
      });

      await tx.idempotencyKey.create({
        data: {
          key: req.idempotencyKey!,
          userId,
          response: { orderId: order.id, paymentId: paymentInit.payment.id },
        },
      });

      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

      // Mark session as completed
      await CheckoutSessionService.complete(session.id);

      return {
        isDuplicate: false as const,
        order,
        payment: paymentInit.payment,
        shipment,
        authorizationUrl: paymentInit.authorizationUrl,
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
      shipment: result.shipment,
      authorizationUrl: result.authorizationUrl,
    });
  } catch (error: any) {
    console.error(error);
    return res.status(400).json({
      message: error?.message || "Checkout failed",
    });
  }
};