import type { Request, Response } from "express";

import { DeliverySLAService } from "../services/shipment/delivery-sla.service.js";

import {
  createDeliverySLASchema,
  updateDeliverySLASchema,
} from "../schemas/shipment/delivery-sla.schema.js";

export class DeliverySLAController {
  static async create(req: Request, res: Response) {
    try {
      const validated =
        createDeliverySLASchema.parse(req.body);

      const deliverySLA =
        await DeliverySLAService.create(
          validated
        );

      return res.status(201).json({
        success: true,
        data: deliverySLA,
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
      const deliverySLAs =
        await DeliverySLAService.findAll();

      return res.status(200).json({
        success: true,
        data: deliverySLAs,
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

      const deliverySLA =
        await DeliverySLAService.findById(id);

      if (!deliverySLA) {
        return res.status(404).json({
          success: false,
          message: "Delivery SLA not found",
        });
      }

      return res.status(200).json({
        success: true,
        data: deliverySLA,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  static async findByCourier(
    req: Request,
    res: Response
  ) {
    try {
      const courierId = String(req.params.courierId);

      const deliverySLAs =
        await DeliverySLAService.findByCourier(
          courierId
        );

      return res.status(200).json({
        success: true,
        data: deliverySLAs,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  static async findByZone(
    req: Request,
    res: Response
  ) {
    try {
      const zoneId = String(req.params.zoneId);

      const deliverySLAs =
        await DeliverySLAService.findByZone(
          zoneId
        );

      return res.status(200).json({
        success: true,
        data: deliverySLAs,
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
        updateDeliverySLASchema.parse(req.body);

      const deliverySLA =
        await DeliverySLAService.update(
          id,
          validated
        );

      return res.status(200).json({
        success: true,
        data: deliverySLA,
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

      await DeliverySLAService.delete(id);

      return res.status(200).json({
        success: true,
        message:
          "Delivery SLA deleted successfully",
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
}