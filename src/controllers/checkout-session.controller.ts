import type { Request, Response } from "express";

import { CheckoutSessionService } from "../services/shipment/checkout-session.service.js";

import {
  createCheckoutSessionSchema,
  updateCheckoutSessionSchema,
} from "../schemas/shipment/checkout-session.schema.js";

export class CheckoutSessionController {
  static async create(req: Request, res: Response) {
    try {
      const validated =
        createCheckoutSessionSchema.parse(req.body);

      const checkoutSession =
        await CheckoutSessionService.create(
          validated
        );

      return res.status(201).json({
        success: true,
        data: checkoutSession,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  static async findAll(req: Request, res: Response) {
    try {
      const checkoutSessions =
        await CheckoutSessionService.findAll();

      return res.status(200).json({
        success: true,
        data: checkoutSessions,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  static async findById(req: Request, res: Response) {
    try {
      const id = String(req.params.id);

      const checkoutSession =
        await CheckoutSessionService.findById(id);

      if (!checkoutSession) {
        return res.status(404).json({
          success: false,
          message:
            "Checkout session not found",
        });
      }

      return res.status(200).json({
        success: true,
        data: checkoutSession,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  static async findByUser(
    req: Request,
    res: Response
  ) {
    try {
      const userId = String(req.params.userId);

      const checkoutSessions =
        await CheckoutSessionService.findByUser(
          userId
        );

      return res.status(200).json({
        success: true,
        data: checkoutSessions,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const id = String(req.params.id);

      const validated =
        updateCheckoutSessionSchema.parse(
          req.body
        );

      const checkoutSession =
        await CheckoutSessionService.update(
          id,
          validated
        );

      return res.status(200).json({
        success: true,
        data: checkoutSession,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  static async complete(req: Request, res: Response) {
    try {
      const id = String(req.params.id);

      const checkoutSession =
        await CheckoutSessionService.complete(id);

      return res.status(200).json({
        success: true,
        data: checkoutSession,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const id = String(req.params.id);

      await CheckoutSessionService.delete(id);

      return res.status(200).json({
        success: true,
        message:
          "Checkout session deleted successfully",
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
}