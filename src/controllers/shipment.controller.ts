import type { Request, Response } from "express";
import { ShipmentService } from "../services/shipment/shipment.service.js";

/* =========================================================
SHIPMENT CONTROLLER
========================================================= */

export class ShipmentController {
  static async create(req: Request, res: Response) {
    try {
      const data = await ShipmentService.createShipment(req.body);
      res.status(201).json(data);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  }

  static async getAll(req: Request, res: Response) {
    try {
      const data = await ShipmentService.getAllShipments();
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const data = await ShipmentService.getShipmentById(req.params.id);
      res.json(data);
    } catch (err: any) {
      res.status(404).json({ message: err.message });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const data = await ShipmentService.updateShipment(
        req.params.id,
        req.body
      );
      res.json(data);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  }

  static async updateStatus(req: Request, res: Response) {
    try {
      const data = await ShipmentService.updateShipmentStatus(
        req.params.id,
        req.body
      );
      res.json(data);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  }

  static async remove(req: Request, res: Response) {
    try {
      await ShipmentService.deleteShipment(req.params.id);
      res.json({ message: "Shipment deleted successfully" });
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  }
}