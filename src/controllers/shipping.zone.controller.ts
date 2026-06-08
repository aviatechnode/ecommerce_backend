import type { Request, Response } from "express";
import { ShippingZoneService } from "../services/shipping-zones.service.js";
import { getParam } from "../utils/getParam.js";

export class ShippingZoneController {
  static async getAll(req: Request, res: Response) {
    const zones = await ShippingZoneService.getAll();

    return res.status(200).json({
      success: true,
      data: zones,
    });
  }

  static async getById(req: Request, res: Response) {
    const id = getParam(req, "id");

    const zone = await ShippingZoneService.getById(id);

    if (!zone) {
      return res.status(404).json({
        success: false,
        message: "Shipping zone not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: zone,
    });
  }

  static async create(req: Request, res: Response) {
    const zone = await ShippingZoneService.create(req.body);

    return res.status(201).json({
      success: true,
      data: zone,
    });
  }

  static async update(req: Request, res: Response) {
    const id = getParam(req, "id");

    const zone = await ShippingZoneService.update(
      id,
      req.body
    );

    return res.status(200).json({
      success: true,
      data: zone,
    });
  }

  static async delete(req: Request, res: Response) {
    const id = getParam(req, "id");

    await ShippingZoneService.delete(id);

    return res.status(200).json({
      success: true,
      message: "Shipping zone deleted",
    });
  }

  static async toggleStatus(req: Request, res: Response) {
    const id = getParam(req, "id");

    const zone = await ShippingZoneService.toggleStatus(
      id,
      req.body.isActive
    );

    return res.status(200).json({
      success: true,
      data: zone,
    });
  }
}