import type { Request, Response } from "express";

import { FulfillmentService } from "../services/shipment/fulfillment.service.js";

import {
  createFulfillmentSchema,
  updateFulfillmentSchema,
} from "../schemas/shipment/fulfillment.schema.js";

export class FulfillmentController {
  static async create(req: Request, res: Response) {
    try {
      const validated =
        createFulfillmentSchema.parse(req.body);

      const fulfillment =
        await FulfillmentService.create(validated);

      return res.status(201).json({
        success: true,
        data: fulfillment,
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
      const fulfillments =
        await FulfillmentService.findAll();

      return res.status(200).json({
        success: true,
        data: fulfillments,
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

      const fulfillment =
        await FulfillmentService.findById(id);

      if (!fulfillment) {
        return res.status(404).json({
          success: false,
          message: "Fulfillment not found",
        });
      }

      return res.status(200).json({
        success: true,
        data: fulfillment,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  static async findByOrder(
    req: Request,
    res: Response
  ) {
    try {
      const orderId = String(req.params.orderId);

      const fulfillments =
        await FulfillmentService.findByOrder(
          orderId
        );

      return res.status(200).json({
        success: true,
        data: fulfillments,
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
        updateFulfillmentSchema.parse(req.body);

      const fulfillment =
        await FulfillmentService.update(
          id,
          validated
        );

      return res.status(200).json({
        success: true,
        data: fulfillment,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const id = String(req.params.id);

      await FulfillmentService.delete(id);

      return res.status(200).json({
        success: true,
        message: "Fulfillment deleted successfully",
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
}