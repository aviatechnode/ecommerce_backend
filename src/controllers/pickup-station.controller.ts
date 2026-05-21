import type { Response } from "express";

import type { TypedRequest } from "../types/express.js";

import type {
  PickupStationIdParamDTO,
} from "../schemas/shipment/pickup-station.schema.js";

import { PickupStationService } from "../services/shipment/pickup-station.service.js";

export class PickupStationController {
  // CREATE
  static async create(
    req: TypedRequest,
    res: Response
  ) {
    const station =
      await PickupStationService.create(
        req.body
      );

    return res.status(201).json(station);
  }

  // GET ALL
  static async getAll(
    req: TypedRequest,
    res: Response
  ) {
    const filters = {
      ...(req.query.page && {
        page: Number(req.query.page),
      }),

      ...(req.query.limit && {
        limit: Number(req.query.limit),
      }),

      ...(req.query.stateId && {
        stateId:
          req.query.stateId as string,
      }),

      ...(req.query.lgaId && {
        lgaId:
          req.query.lgaId as string,
      }),

      ...(req.query.courierId && {
        courierId:
          req.query.courierId as string,
      }),

      ...(req.query.search && {
        search:
          req.query.search as string,
      }),

      ...(req.query.isActive !==
        undefined && {
        isActive:
          req.query.isActive ===
          "true",
      }),
    };

    const stations =
      await PickupStationService.findAll(
        filters
      );

    return res.json(stations);
  }

  // GET ONE
  static async getById(
    req: TypedRequest<PickupStationIdParamDTO>,
    res: Response
  ) {
    const station =
      await PickupStationService.findById(
        req.params.id
      );

    return res.json(station);
  }

  // UPDATE
  static async update(
    req: TypedRequest<PickupStationIdParamDTO>,
    res: Response
  ) {
    const station =
      await PickupStationService.update(
        req.params.id,
        req.body
      );

    return res.json(station);
  }

  // ACTIVE STATIONS
  static async getActive(
    req: TypedRequest,
    res: Response
  ) {
    const stations =
      await PickupStationService.getActiveStations(
        req.query.stateId as string,
        req.query.lgaId as string,
        req.query.courierId as string
      );

    return res.json(stations);
  }

  // VALIDATE DELIVERY
  static async validateDelivery(
    req: TypedRequest,
    res: Response
  ) {
    const result =
      await PickupStationService.validateShipmentDelivery(
        req.body
      );

    return res.json(result);
  }

  // TOGGLE ACTIVE
  static async toggleActive(
    req: TypedRequest<PickupStationIdParamDTO>,
    res: Response
  ) {
    const station =
      await PickupStationService.toggleActive(
        req.params.id
      );

    return res.json(station);
  }

  // DELETE
  static async delete(
    req: TypedRequest<PickupStationIdParamDTO>,
    res: Response
  ) {
    await PickupStationService.delete(
      req.params.id
    );

    return res.json({
      message:
        "Pickup station deleted successfully",
    });
  }
}