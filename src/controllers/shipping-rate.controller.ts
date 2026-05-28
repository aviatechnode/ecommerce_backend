import type { Request, Response } from "express";

import { ShippingRateService } from "../services/shipment/shipping-rate.service.js";

export class ShippingRateController {
  /**
   * CREATE SHIPPING RATE
   */
  static async create(
    req: Request,
    res: Response
  ) {
    try {
      const shippingRate =
        await ShippingRateService.createRate(
          req.body
        );

      return res.status(201).json({
        success: true,
        message:
          "Shipping rate created successfully",
        data: shippingRate,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message:
          error.message ??
          "Failed to create shipping rate",
      });
    }
  }

  /**
   * GET ALL SHIPPING RATES
   */
  static async findAll(
    _req: Request,
    res: Response
  ) {
    try {
      const shippingRates =
        await ShippingRateService.getAllRates();

      return res.status(200).json({
        success: true,
        data: shippingRates,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message:
          error.message ??
          "Failed to fetch shipping rates",
      });
    }
  }

  /**
   * GET SHIPPING RATE BY ID
   */
  static async findById(
    req: Request,
    res: Response
  ) {
    try {
      const rateId =
        typeof req.params.id === "string"
          ? req.params.id
          : null;

      if (!rateId) {
        return res.status(400).json({
          success: false,
          message:
            "Shipping rate ID is required",
        });
      }

      const shippingRate =
        await ShippingRateService.getRateById(
          rateId
        );

      return res.status(200).json({
        success: true,
        data: shippingRate,
      });
    } catch (error: any) {
      return res.status(404).json({
        success: false,
        message:
          error.message ??
          "Shipping rate not found",
      });
    }
  }

  /**
   * UPDATE SHIPPING RATE
   */
  static async update(
    req: Request,
    res: Response
  ) {
    try {
      const rateId =
        typeof req.params.id === "string"
          ? req.params.id
          : null;

      if (!rateId) {
        return res.status(400).json({
          success: false,
          message:
            "Shipping rate ID is required",
        });
      }

      const shippingRate =
        await ShippingRateService.updateRate(
          rateId,
          req.body
        );

      return res.status(200).json({
        success: true,
        message:
          "Shipping rate updated successfully",
        data: shippingRate,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message:
          error.message ??
          "Failed to update shipping rate",
      });
    }
  }

  /**
   * TOGGLE SHIPPING RATE STATUS
   */
  static async toggleActive(
    req: Request,
    res: Response
  ) {
    try {
      const rateId =
        typeof req.params.id === "string"
          ? req.params.id
          : null;

      if (!rateId) {
        return res.status(400).json({
          success: false,
          message:
            "Shipping rate ID is required",
        });
      }

      const shippingRate =
        await ShippingRateService.toggleRateStatus(
          rateId
        );

      return res.status(200).json({
        success: true,
        message:
          "Shipping rate status updated successfully",
        data: shippingRate,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message:
          error.message ??
          "Failed to toggle shipping rate status",
      });
    }
  }

  /**
   * DELETE SHIPPING RATE
   */
  static async delete(
    req: Request,
    res: Response
  ) {
    try {
      const rateId =
        typeof req.params.id === "string"
          ? req.params.id
          : null;

      if (!rateId) {
        return res.status(400).json({
          success: false,
          message:
            "Shipping rate ID is required",
        });
      }

      await ShippingRateService.deleteRate(
        rateId
      );

      return res.status(200).json({
        success: true,
        message:
          "Shipping rate deleted successfully",
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message:
          error.message ??
          "Failed to delete shipping rate",
      });
    }
  }

  /**
   * FIND BEST SHIPPING RATE
   */
  static async findBestRate(
    req: Request,
    res: Response
  ) {
    try {
      if (
        typeof req.body.courierId !==
        "string"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Courier ID is required",
        });
      }

      if (
        typeof req.body.zoneId !==
        "string"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Zone ID is required",
        });
      }

      const weight = Number(
        req.body.weight
      );

      if (
        Number.isNaN(weight) ||
        weight <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Weight must be a valid number greater than 0",
        });
      }

      const rate =
        await ShippingRateService.findBestRate(
          {
            courierId:
              req.body.courierId,
            zoneId: req.body.zoneId,
            weight,
          }
        );

      return res.status(200).json({
        success: true,
        data: rate,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message:
          error.message ??
          "Failed to find best shipping rate",
      });
    }
  }
}