import { CouponType, Prisma } from "@prisma/client";

/* =========================================================
TX-SAFE COUPON VALIDATION
========================================================= */

export const validateAndLockCoupon = async ({
  tx,
  code,
  orderAmount,
}: {
  tx: Prisma.TransactionClient;
  code: string;
  orderAmount: number;
}) => {
  const coupon = await tx.coupon.findUnique({
    where: { code: code.toUpperCase() },
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
    orderAmount < Number(coupon.minOrder)
  ) {
    throw new Error(`Minimum order is ${coupon.minOrder}`);
  }

  // 🔒 ATOMIC LOCK (CRITICAL)
  const locked = await tx.coupon.updateMany({
    where: {
      id: coupon.id,
      isActive: true,
      OR: [
        { usageLimit: null },
        { usedCount: { lt: coupon.usageLimit ?? 0 } },
      ],
      AND: [
        {
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } },
          ],
        },
      ],
    },
    data: {},
  });

  if (locked.count === 0) {
    throw new Error("Coupon unavailable");
  }

  let discount = 0;

  if (coupon.type === CouponType.FIXED) {
    discount = Number(coupon.value);
  } else {
    discount = (orderAmount * Number(coupon.value)) / 100;
  }

  discount = Math.min(discount, orderAmount);

  return {
    coupon,
    discount,
  };
};