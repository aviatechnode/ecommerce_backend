import type {
  Request,
  Response,
  NextFunction,
} from "express";

import type {
  CouponStatus,
} from "@prisma/client";

import { CouponService } from "../services/coupon.service.js";

const couponService = new CouponService();

export class CouponController {
  //////////////////////////////////////////////////////////
  // CREATE COUPON
  //////////////////////////////////////////////////////////

  async createCoupon(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      //////////////////////////////////////////////////////
      // AUTH CHECK
      //////////////////////////////////////////////////////

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const adminId = req.user.id;

      const coupon =
        await couponService.createCoupon(
          req.body,
          adminId
        );

      return res.status(201).json({
        success: true,
        data: coupon,
      });
    } catch (err) {
      next(err);
    }
  }

  //////////////////////////////////////////////////////////
  // UPDATE COUPON
  //////////////////////////////////////////////////////////

  async updateCoupon(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const id = String(req.params.id);

      const adminId = req.user.id;

      const coupon =
        await couponService.updateCoupon(
          id,
          req.body,
          adminId
        );

      return res.status(200).json({
        success: true,
        data: coupon,
      });
    } catch (err) {
      next(err);
    }
  }

  //////////////////////////////////////////////////////////
  // GET COUPON BY ID
  //////////////////////////////////////////////////////////

  async getCouponById(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const id = String(req.params.id);

      const coupon =
        await couponService.getCouponById(id);

      if (!coupon) {
        return res.status(404).json({
          success: false,
          message: "Coupon not found",
        });
      }

      return res.json({
        success: true,
        data: coupon,
      });
    } catch (err) {
      next(err);
    }
  }

  //////////////////////////////////////////////////////////
  // GET COUPON BY CODE
  //////////////////////////////////////////////////////////

  async getCouponByCode(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const code = String(req.params.code);

      const coupon =
        await couponService.getCouponByCode(code);

      if (!coupon) {
        return res.status(404).json({
          success: false,
          message: "Coupon not found",
        });
      }

      return res.json({
        success: true,
        data: coupon,
      });
    } catch (err) {
      next(err);
    }
  }

  //////////////////////////////////////////////////////////
  // LIST COUPONS
  //////////////////////////////////////////////////////////

  async listCoupons(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const {
        status,
        isActive,
        page,
        limit,
      } = req.query;

      const filters: {
        status?: CouponStatus;
        isActive?: boolean;
        page?: number;
        limit?: number;
      } = {};

      //////////////////////////////////////////////////////
      // STATUS
      //////////////////////////////////////////////////////

      if (typeof status === "string") {
        filters.status =
          status as CouponStatus;
      }

      //////////////////////////////////////////////////////
      // IS ACTIVE
      //////////////////////////////////////////////////////

      if (typeof isActive === "string") {
        filters.isActive =
          isActive === "true";
      }

      //////////////////////////////////////////////////////
      // PAGE
      //////////////////////////////////////////////////////

      if (typeof page === "string") {
        filters.page = Number(page);
      }

      //////////////////////////////////////////////////////
      // LIMIT
      //////////////////////////////////////////////////////

      if (typeof limit === "string") {
        filters.limit = Number(limit);
      }

      const result =
        await couponService.listCoupons(
          filters
        );

      return res.json({
        success: true,
        ...result,
      });
    } catch (err) {
      next(err);
    }
  }

  //////////////////////////////////////////////////////////
  // VALIDATE COUPON
  //////////////////////////////////////////////////////////

  async validateCoupon(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const code = String(req.body.code);

      const context = req.body.context;

      const result =
        await couponService.validateCoupon(
          code,
          context
        );

      return res.json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  //////////////////////////////////////////////////////////
  // DELETE COUPON
  //////////////////////////////////////////////////////////

  async deleteCoupon(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const id = String(req.params.id);

      const adminId = req.user.id;

      await couponService.softDeleteCoupon(
        id,
        adminId
      );

      return res.json({
        success: true,
        message: "Coupon deleted",
      });
    } catch (err) {
      next(err);
    }
  }

  //////////////////////////////////////////////////////////
  // GET COUPON STATS
  //////////////////////////////////////////////////////////

  async getCouponStats(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const id = String(req.params.id);

      const stats =
        await couponService.getCouponStats(id);

      return res.json({
        success: true,
        data: stats,
      });
    } catch (err) {
      next(err);
    }
  }

  //////////////////////////////////////////////////////////
  // EXPIRE COUPONS
  //////////////////////////////////////////////////////////

  async expireCoupons(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const count =
        await couponService.expireExpiredCoupons();

      return res.json({
        success: true,
        expired: count,
      });
    } catch (err) {
      next(err);
    }
  }

  //////////////////////////////////////////////////////////
  // RELEASE RESERVATIONS
  //////////////////////////////////////////////////////////

  async releaseReservations(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const count =
        await couponService.releaseExpiredReservations();

      return res.json({
        success: true,
        released: count,
      });
    } catch (err) {
      next(err);
    }
  }
}

export default new CouponController();