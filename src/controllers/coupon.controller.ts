import type { Request, Response } from "express";
import { prisma } from "../lib/prismadb.js";
import {
  createCouponSchema,
  applyCouponSchema,
} from "../schemas/coupon.schema.js";

import { CouponType, Prisma } from "@prisma/client";

/* =========================================================
UTILITY: GET REAL CART SUBTOTAL FROM DB
========================================================= */

const getCartSubtotal = async (userId: string) => {
  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: {
      items: true,
    },
  });

  if (!cart || cart.items.length === 0) {
    throw new Error("Cart is empty");
  }

  let subtotal = new Prisma.Decimal(0);

  for (const item of cart.items) {
    subtotal = subtotal.add(
      new Prisma.Decimal(item.unitPrice).mul(item.quantity)
    );
  }

  return subtotal;
};

/* =========================================================
UTILITY: VALIDATE COUPON (SAFE + DB DRIVEN)
========================================================= */

const validateCouponPublic = async ({
  code,
  userId,
}: {
  code: string;
  userId: string;
}) => {
  const subtotal = await getCartSubtotal(userId);

  const coupon = await prisma.coupon.findUnique({
    where: {
      code: code.toUpperCase(),
    },
  });

  if (!coupon || !coupon.isActive) {
    throw new Error("Invalid coupon");
  }

  if (coupon.expiresAt && coupon.expiresAt < new Date()) {
    throw new Error("Coupon expired");
  }

  if (
    coupon.usageLimit &&
    coupon.usedCount >= coupon.usageLimit
  ) {
    throw new Error("Coupon limit reached");
  }

  if (
    coupon.minOrder &&
    subtotal.lt(coupon.minOrder)
  ) {
    throw new Error(`Minimum order is ${coupon.minOrder}`);
  }

  // per-user validation
  const usageCount = await prisma.couponUsage.count({
    where: {
      couponId: coupon.id,
      userId,
    },
  });

  if (
    coupon.perUserLimit &&
    usageCount >= coupon.perUserLimit
  ) {
    throw new Error(
      "Coupon usage limit reached for this user"
    );
  }

  let discount =
    coupon.type === CouponType.FIXED
      ? new Prisma.Decimal(coupon.value)
      : subtotal.mul(coupon.value).div(100);

  if (discount.gt(subtotal)) {
    discount = subtotal;
  }

  const finalAmount = subtotal.sub(discount);

  return {
    coupon,
    subtotal,
    discount,
    finalAmount,
  };
};

/* =========================================================
CREATE COUPON (ADMIN)
========================================================= */

export const createCoupon = async (
  req: Request,
  res: Response
) => {
  try {
    const parsed = createCouponSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid coupon data",
        errors: parsed.error.flatten(),
      });
    }

    const data = parsed.data;

    const coupon = await prisma.coupon.create({
      data: {
        code: data.code,
        type: data.type,
        value: data.value,
        minOrder: data.minOrder ?? null,
        usageLimit: data.usageLimit ?? null,
        perUserLimit: data.perUserLimit ?? null,
        expiresAt: data.expiresAt
          ? new Date(data.expiresAt)
          : null,
      },
    });

    return res.status(201).json({
      message: "Coupon created",
      coupon,
    });
  } catch (error) {
    console.error("Create Coupon Error:", error);

    return res.status(500).json({
      message: "Failed to create coupon",
    });
  }
};

/* =========================================================
APPLY COUPON (PREVIEW ONLY — NO SIDE EFFECTS)
========================================================= */

export const applyCoupon = async (
  req: Request,
  res: Response
) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const parsed = applyCouponSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid coupon request",
        errors: parsed.error.flatten(),
      });
    }

    const { code } = parsed.data;

    const result = await validateCouponPublic({
      code,
      userId: req.user.id,
    });

    return res.json({
      coupon: {
        id: result.coupon.id,
        code: result.coupon.code,
        type: result.coupon.type,
        value: result.coupon.value,
      },
      subtotal: result.subtotal,
      discount: result.discount,
      finalAmount: result.finalAmount,
    });
  } catch (error: any) {
    return res.status(400).json({
      message: error.message || "Coupon failed",
    });
  }
};

/* =========================================================
DEACTIVATE COUPON (STRICT TYPE SAFE)
========================================================= */

export const deactivateCoupon = async (
  req: Request,
  res: Response
) => {
  try {
    const rawId = req.params.id;

    if (!rawId || Array.isArray(rawId)) {
      return res.status(400).json({
        message: "Invalid coupon id",
      });
    }

    await prisma.coupon.update({
      where: {
        id: rawId,
      },
      data: {
        isActive: false,
      },
    });

    return res.json({
      message: "Coupon deactivated",
    });
  } catch (error) {
    console.error("Deactivate Coupon Error:", error);

    return res.status(500).json({
      message: "Failed to deactivate coupon",
    });
  }
};