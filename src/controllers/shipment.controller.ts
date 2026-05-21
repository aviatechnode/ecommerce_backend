import type { Request, Response } from "express";
import { ShipmentStatus } from "@prisma/client";

import { ShipmentService } from "../services/shipment/shipment.service.js";

/* =========================================================
SHIPMENT CONTROLLER
========================================================= */

export class ShipmentController {
  /* =========================================================
  CREATE SHIPMENT
  ========================================================= */
  static async create(req: Request, res: Response) {
    try {
      const shipment = await ShipmentService.createShipment(req.body);

      return res.status(201).json({
        success: true,
        message: "Shipment created successfully",
        data: shipment,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message ?? "Failed to create shipment",
      });
    }
  }

  /* =========================================================
  GET ALL SHIPMENTS
  ========================================================= */
  static async getAll(req: Request, res: Response) {
    try {
      const query: {
        page?: number;
        limit?: number;
        status?: ShipmentStatus;
        courierId?: string;
        search?: string;
      } = {};

      // PAGE
      if (
        typeof req.query.page === "string" &&
        req.query.page.trim() !== ""
      ) {
        query.page = Number(req.query.page);
      }

      // LIMIT
      if (
        typeof req.query.limit === "string" &&
        req.query.limit.trim() !== ""
      ) {
        query.limit = Number(req.query.limit);
      }

      // STATUS
      if (typeof req.query.status === "string") {
        query.status = req.query.status as ShipmentStatus;
      }

      // COURIER ID
      if (typeof req.query.courierId === "string") {
        query.courierId = req.query.courierId;
      }

      // SEARCH
      if (typeof req.query.search === "string") {
        query.search = req.query.search;
      }

      const shipments = await ShipmentService.getAll(query);

      return res.status(200).json({
        success: true,
        ...shipments,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message ?? "Failed to fetch shipments",
      });
    }
  }

  /* =========================================================
  GET SHIPMENT BY ID
  ========================================================= */
  static async getById(req: Request, res: Response) {
    try {
      const shipmentId =
        typeof req.params.id === "string"
          ? req.params.id
          : null;

      if (!shipmentId) {
        return res.status(400).json({
          success: false,
          message: "Shipment ID is required",
        });
      }

      const shipment = await ShipmentService.getById(
        shipmentId
      );

      return res.status(200).json({
        success: true,
        data: shipment,
      });
    } catch (error: any) {
      return res.status(404).json({
        success: false,
        message: error.message ?? "Shipment not found",
      });
    }
  }

  /* =========================================================
  UPDATE SHIPMENT
  ========================================================= */
  static async update(req: Request, res: Response) {
    try {
      const shipmentId =
        typeof req.params.id === "string"
          ? req.params.id
          : null;

      if (!shipmentId) {
        return res.status(400).json({
          success: false,
          message: "Shipment ID is required",
        });
      }

      const shipment = await ShipmentService.updateShipment(
        shipmentId,
        req.body
      );

      return res.status(200).json({
        success: true,
        message: "Shipment updated successfully",
        data: shipment,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message ?? "Failed to update shipment",
      });
    }
  }

  /* =========================================================
  UPDATE SHIPMENT STATUS
  ========================================================= */
  static async updateStatus(req: Request, res: Response) {
    try {
      const shipmentId =
        typeof req.params.id === "string"
          ? req.params.id
          : null;

      if (!shipmentId) {
        return res.status(400).json({
          success: false,
          message: "Shipment ID is required",
        });
      }

      if (!req.body.status) {
        return res.status(400).json({
          success: false,
          message: "Shipment status is required",
        });
      }

      const shipment = await ShipmentService.updateStatus({
        id: shipmentId,
        status: req.body.status as ShipmentStatus,
        ...(typeof req.body.location === "string"
          ? { location: req.body.location }
          : {}),
      });

      return res.status(200).json({
        success: true,
        message: "Shipment status updated successfully",
        data: shipment,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message ?? "Failed to update shipment status",
      });
    }
  }

  /* =========================================================
  DELETE SHIPMENT
  ========================================================= */
  static async remove(req: Request, res: Response) {
    try {
      const shipmentId =
        typeof req.params.id === "string"
          ? req.params.id
          : null;

      if (!shipmentId) {
        return res.status(400).json({
          success: false,
          message: "Shipment ID is required",
        });
      }

      await ShipmentService.deleteShipment(shipmentId);

      return res.status(200).json({
        success: true,
        message: "Shipment deleted successfully",
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message ?? "Failed to delete shipment",
      });
    }
  }

  /* =========================================================
  TRACK SHIPMENT
  ========================================================= */
  static async trackShipment(req: Request, res: Response) {
    try {
      const trackingNumber =
        typeof req.params.trackingNumber === "string"
          ? req.params.trackingNumber
          : null;

      if (!trackingNumber) {
        return res.status(400).json({
          success: false,
          message: "Tracking number is required",
        });
      }

      const shipment = await ShipmentService.trackShipment(
        trackingNumber
      );

      return res.status(200).json({
        success: true,
        data: shipment,
      });
    } catch (error: any) {
      return res.status(404).json({
        success: false,
        message: error.message ?? "Shipment not found",
      });
    }
  }
}