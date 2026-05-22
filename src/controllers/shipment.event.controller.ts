import type { Request, Response, NextFunction } from "express";
import { ShipmentEventService } from "../services/shipment/shipment-event.service.js";

type IdParam = {
  id: string;
};

type ShipmentIdParam = {
  shipmentId: string;
};

export class ShipmentEventController {
  /**
   * Create shipment event
   * POST /shipment-events
   */
  static async createEvent(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const event = await ShipmentEventService.createEvent(req.body);

      return res.status(201).json({
        success: true,
        message: "Shipment event created successfully",
        data: event,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all shipment events
   * GET /shipment-events/shipment/:shipmentId
   */
  static async getShipmentEvents(
    req: Request<ShipmentIdParam>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { shipmentId } = req.params;

      const events =
        await ShipmentEventService.getShipmentEvents(shipmentId);

      return res.status(200).json({
        success: true,
        data: events,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get single shipment event
   * GET /shipment-events/:id
   */
  static async getEventById(
    req: Request<IdParam>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { id } = req.params;

      const event = await ShipmentEventService.getEventById(id);

      return res.status(200).json({
        success: true,
        data: event,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update shipment event
   * PATCH /shipment-events/:id
   */
  static async updateEvent(
    req: Request<IdParam>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { id } = req.params;

      const event = await ShipmentEventService.updateEvent(
        id,
        req.body
      );

      return res.status(200).json({
        success: true,
        message: "Shipment event updated successfully",
        data: event,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete shipment event
   * DELETE /shipment-events/:id
   */
  static async deleteEvent(
    req: Request<IdParam>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { id } = req.params;

      await ShipmentEventService.deleteEvent(id);

      return res.status(200).json({
        success: true,
        message: "Shipment event deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  }
}