import type { Response } from "express";

import { CourierService } from "../services/shipment/courier.service.js";

import type { TypedRequest } from "../types/express.js";

import type {
  CourierIdParamInput,
  CourierWebhookLogIdParamInput,
} from "../schemas/shipment/courier.schema.js";

export class CourierController {
  /* =========================================================
  COURIER
  ========================================================= */

  static async create(
    req: TypedRequest,
    res: Response
  ) {
    const courier =
      await CourierService.createCourier(req.body);

    return res.status(201).json(courier);
  }

  static async getAll(
    _req: TypedRequest,
    res: Response
  ) {
    const couriers =
      await CourierService.getAllCouriers();

    return res.json(couriers);
  }

  static async getById(
    req: TypedRequest<CourierIdParamInput>,
    res: Response
  ) {
    const courier =
      await CourierService.getCourierById(
        req.params.id
      );

    return res.json(courier);
  }

  static async update(
    req: TypedRequest<CourierIdParamInput>,
    res: Response
  ) {
    const courier =
      await CourierService.updateCourier(
        req.params.id,
        req.body
      );

    return res.json(courier);
  }

  static async toggleStatus(
    req: TypedRequest<CourierIdParamInput>,
    res: Response
  ) {
    const courier =
      await CourierService.toggleCourierStatus(
        req.params.id
      );

    return res.json(courier);
  }

  static async delete(
    req: TypedRequest<CourierIdParamInput>,
    res: Response
  ) {
    await CourierService.deleteCourier(
      req.params.id
    );

    return res.json({
      message: "Courier deleted successfully",
    });
  }

  /* =========================================================
  COURIER WEBHOOK LOGS
  ========================================================= */

  static async createWebhookLog(
    req: TypedRequest,
    res: Response
  ) {
    const webhookLog =
      await CourierService.createWebhookLog(
        req.body
      );

    return res.status(201).json(webhookLog);
  }

  static async getWebhookLogsByCourier(
    req: TypedRequest<CourierIdParamInput>,
    res: Response
  ) {
    const logs =
      await CourierService.getWebhookLogsByCourier(
        req.params.id
      );

    return res.json(logs);
  }

  static async updateWebhookLog(
    req: TypedRequest<CourierWebhookLogIdParamInput>,
    res: Response
  ) {
    const webhookLog =
      await CourierService.updateWebhookLog(
        req.params.id,
        req.body
      );

    return res.json(webhookLog);
  }

  static async deleteWebhookLog(
    req: TypedRequest<CourierWebhookLogIdParamInput>,
    res: Response
  ) {
    await CourierService.deleteWebhookLog(
      req.params.id
    );

    return res.json({
      message:
        "Courier webhook log deleted successfully",
    });
  }
}