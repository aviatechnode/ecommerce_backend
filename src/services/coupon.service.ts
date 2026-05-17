// services/coupon.service.ts

import {
  Prisma,
  CouponStatus,
  CouponType,
  CouponScope,
  CouponAppliesTo,
  CouponLogAction,
} from "@prisma/client";

import { prisma } from "../lib/prismadb.js";

import type {
  CartContext,
  DiscountCalculation,
  CouponValidationResult,
} from "../types/coupon.types.js";

import type {
  CreateCouponInput,
  UpdateCouponInput,
} from "../schemas/coupon.schema.js";

//////////////////////////////////////////////////////////
// TYPES
//////////////////////////////////////////////////////////

type CouponWithTargeting = Prisma.CouponGetPayload<{
  include: {
    productRules: true;
    categoryRules: true;
    customerRules: true;
  };
}>;

//////////////////////////////////////////////////////////
// SERVICE
//////////////////////////////////////////////////////////

export class CouponService {
  //////////////////////////////////////////////////////////
  // CREATE COUPON
  //////////////////////////////////////////////////////////

  async createCoupon(
    data: CreateCouponInput,
    adminId: string
  ): Promise<CouponWithTargeting> {
    const {
      productIds,
      categoryIds,
      customerIds,
      metadata,
      ...rest
    } = data;

    return prisma.$transaction(async (tx) => {
      const coupon = await tx.coupon.create({
        data: {
          code: rest.code,
          name: rest.name,

          ...(rest.description !== undefined && {
            description: rest.description,
          }),

          type: rest.type,
          scope: rest.scope,
          priority: rest.priority,

          ...(rest.internalNotes !== undefined && {
            internalNotes: rest.internalNotes,
          }),

          ...(rest.amountOff !== undefined && {
            amountOff: rest.amountOff,
          }),

          ...(rest.percentOff !== undefined && {
            percentOff: rest.percentOff,
          }),

          ...(rest.maxDiscountAmount !== undefined && {
            maxDiscountAmount: rest.maxDiscountAmount,
          }),

          freeShipping: rest.freeShipping,

          ...(rest.minimumOrderAmount !== undefined && {
            minimumOrderAmount: rest.minimumOrderAmount,
          }),

          ...(rest.minimumItemQuantity !== undefined && {
            minimumItemQuantity: rest.minimumItemQuantity,
          }),

          firstOrderOnly: rest.firstOrderOnly,
          appliesTo: rest.appliesTo,
          status: rest.status,

          ...(rest.startsAt !== undefined && {
            startsAt: rest.startsAt,
          }),

          ...(rest.expiresAt !== undefined && {
            expiresAt: rest.expiresAt,
          }),

          ...(rest.usageLimit !== undefined && {
            usageLimit: rest.usageLimit,
          }),

          perUserLimit: rest.perUserLimit,
          isStackable: rest.isStackable,
          excludeSaleItems: rest.excludeSaleItems,

          version: 1,
          createdById: adminId,
          updatedById: adminId,

          metadata: metadata ?? Prisma.JsonNull,
        },
      });

      if (productIds.length) {
        await tx.couponProductRule.createMany({
          data: productIds.map((productId) => ({
            couponId: coupon.id,
            productId,
          })),
        });
      }

      if (categoryIds.length) {
        await tx.couponCategoryRule.createMany({
          data: categoryIds.map((categoryId) => ({
            couponId: coupon.id,
            categoryId,
          })),
        });
      }

      if (customerIds.length) {
        await tx.couponCustomerRule.createMany({
          data: customerIds.map((userId) => ({
            couponId: coupon.id,
            userId,
          })),
        });
      }

      const created = await tx.coupon.findUnique({
        where: {
          id: coupon.id,
        },
        include: {
          productRules: true,
          categoryRules: true,
          customerRules: true,
        },
      });

      if (!created) {
        throw new Error("Failed to create coupon");
      }

      await tx.couponAuditLog.create({
        data: {
          couponId: coupon.id,
          adminId,
          action: CouponLogAction.APPLIED,
          message: `Coupon created: ${coupon.code}`,
          metadata: {
            created: true,
          },
        },
      });

      return created;
    });
  }

  //////////////////////////////////////////////////////////
  // UPDATE COUPON
  //////////////////////////////////////////////////////////

  async updateCoupon(
    id: string,
    data: UpdateCouponInput,
    adminId: string
  ): Promise<CouponWithTargeting> {
    const {
      productIds,
      categoryIds,
      customerIds,
      metadata,
      ...rest
    } = data;

    return prisma.$transaction(async (tx) => {
      const current = await tx.coupon.findUnique({
        where: { id },
      });

      if (!current) {
        throw new Error("Coupon not found");
      }

      await tx.coupon.update({
        where: { id },
        data: {
          ...(rest.code !== undefined && {
            code: rest.code,
          }),

          ...(rest.name !== undefined && {
            name: rest.name,
          }),

          ...(rest.description !== undefined && {
            description: rest.description,
          }),

          ...(rest.type !== undefined && {
            type: rest.type,
          }),

          ...(rest.scope !== undefined && {
            scope: rest.scope,
          }),

          ...(rest.priority !== undefined && {
            priority: rest.priority,
          }),

          ...(rest.internalNotes !== undefined && {
            internalNotes: rest.internalNotes,
          }),

          ...(rest.amountOff !== undefined && {
            amountOff: rest.amountOff,
          }),

          ...(rest.percentOff !== undefined && {
            percentOff: rest.percentOff,
          }),

          ...(rest.maxDiscountAmount !== undefined && {
            maxDiscountAmount: rest.maxDiscountAmount,
          }),

          ...(rest.freeShipping !== undefined && {
            freeShipping: rest.freeShipping,
          }),

          ...(rest.minimumOrderAmount !== undefined && {
            minimumOrderAmount: rest.minimumOrderAmount,
          }),

          ...(rest.minimumItemQuantity !== undefined && {
            minimumItemQuantity: rest.minimumItemQuantity,
          }),

          ...(rest.firstOrderOnly !== undefined && {
            firstOrderOnly: rest.firstOrderOnly,
          }),

          ...(rest.appliesTo !== undefined && {
            appliesTo: rest.appliesTo,
          }),

          ...(rest.status !== undefined && {
            status: rest.status,
          }),

          ...(rest.startsAt !== undefined && {
            startsAt: rest.startsAt,
          }),

          ...(rest.expiresAt !== undefined && {
            expiresAt: rest.expiresAt,
          }),

          ...(rest.usageLimit !== undefined && {
            usageLimit: rest.usageLimit,
          }),

          ...(rest.perUserLimit !== undefined && {
            perUserLimit: rest.perUserLimit,
          }),

          ...(rest.isStackable !== undefined && {
            isStackable: rest.isStackable,
          }),

          ...(rest.excludeSaleItems !== undefined && {
            excludeSaleItems: rest.excludeSaleItems,
          }),

          ...(metadata !== undefined && {
            metadata: metadata ?? Prisma.JsonNull,
          }),

          version: current.version + 1,
          updatedById: adminId,
          updatedAt: new Date(),
        },
      });

      if (productIds !== undefined) {
        await tx.couponProductRule.deleteMany({
          where: {
            couponId: id,
          },
        });

        if (productIds.length) {
          await tx.couponProductRule.createMany({
            data: productIds.map((productId) => ({
              couponId: id,
              productId,
            })),
          });
        }
      }

      if (categoryIds !== undefined) {
        await tx.couponCategoryRule.deleteMany({
          where: {
            couponId: id,
          },
        });

        if (categoryIds.length) {
          await tx.couponCategoryRule.createMany({
            data: categoryIds.map((categoryId) => ({
              couponId: id,
              categoryId,
            })),
          });
        }
      }

      if (customerIds !== undefined) {
        await tx.couponCustomerRule.deleteMany({
          where: {
            couponId: id,
          },
        });

        if (customerIds.length) {
          await tx.couponCustomerRule.createMany({
            data: customerIds.map((userId) => ({
              couponId: id,
              userId,
            })),
          });
        }
      }

      const updated = await tx.coupon.findUnique({
        where: {
          id,
        },
        include: {
          productRules: true,
          categoryRules: true,
          customerRules: true,
        },
      });

      if (!updated) {
        throw new Error("Failed to update coupon");
      }

      await tx.couponAuditLog.create({
        data: {
          couponId: id,
          adminId,
          action: CouponLogAction.APPLIED,
          message: `Coupon updated to version ${updated.version}`,
          metadata: {
            updated: true,
          },
        },
      });

      return updated;
    });
  }

  //////////////////////////////////////////////////////////
  // VALIDATE COUPON
  //////////////////////////////////////////////////////////

  async validateCoupon(
    couponCode: string,
    context: CartContext
  ): Promise<CouponValidationResult> {
    const coupon = await prisma.coupon.findFirst({
      where: {
        code: couponCode,
        deletedAt: null,
      },
      include: {
        productRules: true,
        categoryRules: true,
        customerRules: true,
      },
    });

    if (!coupon) {
      return {
        valid: false,
        reasons: ["Coupon not found"],
      };
    }

    const reasons: string[] = [];

    if (coupon.status !== CouponStatus.ACTIVE) {
      reasons.push("Coupon is not active");
    }

    if (coupon.startsAt && coupon.startsAt > new Date()) {
      reasons.push("Coupon has not started yet");
    }

    if (coupon.expiresAt && coupon.expiresAt < new Date()) {
      reasons.push("Coupon has expired");
    }

    if (
      coupon.minimumOrderAmount &&
      context.orderSubtotal <
        Number(coupon.minimumOrderAmount)
    ) {
      reasons.push("Minimum order amount not met");
    }

    if (coupon.minimumItemQuantity) {
      const totalItems = context.items.reduce(
        (sum, item) => sum + item.quantity,
        0
      );

      if (totalItems < coupon.minimumItemQuantity) {
        reasons.push("Minimum item quantity not met");
      }
    }

    if (coupon.firstOrderOnly && !context.isFirstOrder) {
      reasons.push("Coupon is for first order only");
    }

    if (
      !coupon.isStackable &&
      context.appliedCouponIds &&
      context.appliedCouponIds.length > 0
    ) {
      reasons.push(
        "Coupon cannot be combined with other promotions"
      );
    }

    if (reasons.length > 0) {
      return {
        valid: false,
        coupon,
        reasons,
      };
    }

    const discount = await this.calculateDiscount(
      coupon,
      context
    );

    return {
      valid: discount.isValid,
      coupon,
      discountAmount: discount.discountAmount,
      reasons: discount.isValid
        ? []
        : ["Invalid discount"],
    };
  }


  //////////////////////////////////////////////////////////
  // CALCULATE DISCOUNT
  //////////////////////////////////////////////////////////

  async calculateDiscount(
    coupon: CouponWithTargeting,
    context: CartContext
  ): Promise<DiscountCalculation> {
    let eligibleSubtotal = context.orderSubtotal;
    let discountAmount = 0;

    if (coupon.scope === CouponScope.PRODUCT_ONLY) {
      if (
        coupon.appliesTo ===
        CouponAppliesTo.SPECIFIC_PRODUCTS
      ) {
        const eligibleProductIds =
          coupon.productRules.map(
            (rule) => rule.productId
          );

        eligibleSubtotal = context.items
          .filter((item) =>
            eligibleProductIds.includes(
              item.productId
            )
          )
          .reduce(
            (sum, item) =>
              sum +
              item.unitPrice * item.quantity,
            0
          );
      }
    }

    switch (coupon.type) {
      case CouponType.FIXED_AMOUNT:
        discountAmount = Math.min(
          Number(coupon.amountOff ?? 0),
          eligibleSubtotal
        );
        break;

      case CouponType.PERCENTAGE: {
        let calculated =
          (eligibleSubtotal *
            Number(coupon.percentOff ?? 0)) /
          100;

        if (coupon.maxDiscountAmount) {
          calculated = Math.min(
            calculated,
            Number(coupon.maxDiscountAmount)
          );
        }

        discountAmount = Math.min(
          calculated,
          eligibleSubtotal
        );
        break;
      }

      case CouponType.FREE_SHIPPING:
        discountAmount = 0;
        break;
    }

    return {
      isValid:
        discountAmount > 0 ||
        coupon.type ===
          CouponType.FREE_SHIPPING,

      discountAmount,

      breakdown: {
        type: coupon.type,

        value:
          coupon.type ===
          CouponType.PERCENTAGE
            ? Number(coupon.percentOff ?? 0)
            : Number(coupon.amountOff ?? 0),

        ...(coupon.maxDiscountAmount && {
          cappedAt: Number(
            coupon.maxDiscountAmount
          ),
        }),
      },
    };
  }

    //////////////////////////////////////////////////////////
  // GET COUPON BY ID
  //////////////////////////////////////////////////////////

  async getCouponById(
    id: string
  ): Promise<CouponWithTargeting | null> {
    return prisma.coupon.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        productRules: true,
        categoryRules: true,
        customerRules: true,
      },
    });
  }

  //////////////////////////////////////////////////////////
  // GET COUPON BY CODE
  //////////////////////////////////////////////////////////

  async getCouponByCode(
    code: string
  ): Promise<CouponWithTargeting | null> {
    return prisma.coupon.findFirst({
      where: {
        code,
        deletedAt: null,
      },
      include: {
        productRules: true,
        categoryRules: true,
        customerRules: true,
      },
    });
  }

  //////////////////////////////////////////////////////////
  // LIST COUPONS
  //////////////////////////////////////////////////////////

  async listCoupons(params: {
    status?: CouponStatus;
    isActive?: boolean;
    page?: number;
    limit?: number;
  }) {
    const {
      status,
      isActive,
      page = 1,
      limit = 20,
    } = params;

    const skip = (page - 1) * limit;

    const where: Prisma.CouponWhereInput = {
      deletedAt: null,
    };

    if (status !== undefined) {
      where.status = status;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [coupons, total] = await Promise.all([
      prisma.coupon.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          {
            priority: "desc",
          },
          {
            createdAt: "desc",
          },
        ],
        include: {
          productRules: true,
          categoryRules: true,
          customerRules: true,
          _count: {
            select: {
              usages: true,
              reservations: true,
            },
          },
        },
      }),

      prisma.coupon.count({
        where,
      }),
    ]);

    return {
      coupons,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  //////////////////////////////////////////////////////////
  // SOFT DELETE COUPON
  //////////////////////////////////////////////////////////

  async softDeleteCoupon(
    id: string,
    adminId: string
  ): Promise<void> {
    await prisma.$transaction(async (tx) => {
      const existing = await tx.coupon.findUnique({
        where: {
          id,
        },
      });

      if (!existing) {
        throw new Error("Coupon not found");
      }

      await tx.coupon.update({
        where: {
          id,
        },
        data: {
          deletedAt: new Date(),
          isActive: false,
          status: CouponStatus.ARCHIVED,
          updatedById: adminId,
          updatedAt: new Date(),
        },
      });

      await tx.couponAuditLog.create({
        data: {
          couponId: id,
          adminId,
          action: CouponLogAction.APPLIED,
          message: "Coupon soft deleted",
          metadata: {
            deleted: true,
          },
        },
      });
    });
  }

  //////////////////////////////////////////////////////////
  // EXPIRE EXPIRED COUPONS
  //////////////////////////////////////////////////////////

  async expireExpiredCoupons(): Promise<number> {
    const now = new Date();

    const result = await prisma.coupon.updateMany({
      where: {
        deletedAt: null,
        status: CouponStatus.ACTIVE,
        expiresAt: {
          lte: now,
        },
      },
      data: {
        status: CouponStatus.EXPIRED,
        updatedAt: now,
      },
    });

    return result.count;
  }

  //////////////////////////////////////////////////////////
  // RELEASE EXPIRED RESERVATIONS
  //////////////////////////////////////////////////////////

  async releaseExpiredReservations(): Promise<number> {
    const now = new Date();

    const result =
      await prisma.couponReservation.updateMany({
        where: {
          status: "ACTIVE",
          expiresAt: {
            lte: now,
          },
        },
        data: {
          status: "EXPIRED",
          updatedAt: now,
        },
      });

    return result.count;
  }

  //////////////////////////////////////////////////////////
  // GET COUPON STATS
  //////////////////////////////////////////////////////////

  async getCouponStats(couponId: string) {
    const [
      totalUsage,
      successfulUsage,
      activeReservations,
    ] = await Promise.all([
      prisma.couponUsage.count({
        where: {
          couponId,
        },
      }),

      prisma.couponUsage.count({
        where: {
          couponId,
          status: "SUCCESS",
        },
      }),

      prisma.couponReservation.count({
        where: {
          couponId,
          status: "ACTIVE",
        },
      }),
    ]);

    return {
      totalUsage,
      successfulUsage,
      activeReservations,
    };
  }
}



