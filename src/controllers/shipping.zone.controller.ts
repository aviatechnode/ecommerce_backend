import type { Response } from "express";

import type { TypedRequest } from "../types/express.js";

import type {
  ShippingZoneIdParamInput,
} from "../schemas/shipment/shipment.zone.schema.js";

import type {
  ShippingZoneStateIdParamInput,
} from "../schemas/shipment/shipment.zone.state.js";

import type {
  ShippingZoneLGAIdParamInput,
} from "../schemas/shipment/shipment.zone.lga.schema.js";

import { ShippingZoneService } from "../services/shipment/shipping-zone.service.js";

import { ShippingZoneStateService } from "../services/shipment/shipping-zone-state.service.js";

import { ShippingZoneLGAService } from "../services/shipment/shipping-zone-lga.service.js";

export class ShippingZoneController {
  /* =========================================================
     SHIPPING ZONES
  ========================================================= */

  static async createZone(
    req: TypedRequest,
    res: Response
  ) {
    const zone = await ShippingZoneService.create(
      req.body
    );

    return res.status(201).json(zone);
  }

  static async getAllZones(
    _req: TypedRequest,
    res: Response
  ) {
    const zones =
      await ShippingZoneService.getAll();

    return res.json(zones);
  }

  static async getZoneById(
    req: TypedRequest<ShippingZoneIdParamInput>,
    res: Response
  ) {
    const zone =
      await ShippingZoneService.getById(
        req.params.id
      );

    return res.json(zone);
  }

  static async updateZone(
    req: TypedRequest<ShippingZoneIdParamInput>,
    res: Response
  ) {
    const zone =
      await ShippingZoneService.update(
        req.params.id,
        req.body
      );

    return res.json(zone);
  }

  static async toggleZoneStatus(
    req: TypedRequest<ShippingZoneIdParamInput>,
    res: Response
  ) {
    const zone =
      await ShippingZoneService.toggleStatus(
        req.params.id
      );

    return res.json(zone);
  }

  static async deleteZone(
    req: TypedRequest<ShippingZoneIdParamInput>,
    res: Response
  ) {
    await ShippingZoneService.delete(
      req.params.id
    );

    return res.json({
      message:
        "Shipping zone deleted successfully",
    });
  }

  static async getActiveZones(
    _req: TypedRequest,
    res: Response
  ) {
    const zones =
      await ShippingZoneService.getActiveZones();

    return res.json(zones);
  }

  /* =========================================================
     SHIPPING ZONE STATES
  ========================================================= */

  static async createStateMapping(
    req: TypedRequest,
    res: Response
  ) {
    const mapping =
      await ShippingZoneStateService.createMapping(
        req.body
      );

    return res.status(201).json(mapping);
  }

  static async getAllStateMappings(
    _req: TypedRequest,
    res: Response
  ) {
    const mappings =
      await ShippingZoneStateService.getAllMappings();

    return res.json(mappings);
  }

  static async getStateMappingById(
    req: TypedRequest<ShippingZoneStateIdParamInput>,
    res: Response
  ) {
    const mapping =
      await ShippingZoneStateService.getMappingById(
        req.params.id
      );

    return res.json(mapping);
  }

  static async updateStateMapping(
    req: TypedRequest<ShippingZoneStateIdParamInput>,
    res: Response
  ) {
    const mapping =
      await ShippingZoneStateService.updateMapping(
        req.params.id,
        req.body
      );

    return res.json(mapping);
  }

  static async deleteStateMapping(
    req: TypedRequest<ShippingZoneStateIdParamInput>,
    res: Response
  ) {
    await ShippingZoneStateService.deleteMapping(
      req.params.id
    );

    return res.json({
      message:
        "Shipping zone state mapping deleted successfully",
    });
  }

  static async bulkAssignStates(
    req: TypedRequest,
    res: Response
  ) {
    const result =
      await ShippingZoneStateService.bulkAssignStates(
        req.body
      );

    return res.status(201).json(result);
  }

  static async clearZoneStates(
    req: TypedRequest<ShippingZoneIdParamInput>,
    res: Response
  ) {
    const result =
      await ShippingZoneStateService.clearZone(
        req.params.id
      );

    return res.json(result);
  }

  static async getZonesByState(
    req: TypedRequest,
    res: Response
  ) {
    const zones =
      await ShippingZoneStateService.getZonesByState(
        req.params.stateId
      );

    return res.json(zones);
  }

  /* =========================================================
     SHIPPING ZONE LGAS
  ========================================================= */

  static async createLGAMapping(
    req: TypedRequest,
    res: Response
  ) {
    const mapping =
      await ShippingZoneLGAService.createMapping(
        req.body
      );

    return res.status(201).json(mapping);
  }

  static async getAllLGAMappings(
    _req: TypedRequest,
    res: Response
  ) {
    const mappings =
      await ShippingZoneLGAService.getAllMappings();

    return res.json(mappings);
  }

  static async getLGAMappingById(
    req: TypedRequest<ShippingZoneLGAIdParamInput>,
    res: Response
  ) {
    const mapping =
      await ShippingZoneLGAService.getMappingById(
        req.params.id
      );

    return res.json(mapping);
  }

  static async updateLGAMapping(
    req: TypedRequest<ShippingZoneLGAIdParamInput>,
    res: Response
  ) {
    const mapping =
      await ShippingZoneLGAService.updateMapping(
        req.params.id,
        req.body
      );

    return res.json(mapping);
  }

  static async deleteLGAMapping(
    req: TypedRequest<ShippingZoneLGAIdParamInput>,
    res: Response
  ) {
    await ShippingZoneLGAService.deleteMapping(
      req.params.id
    );

    return res.json({
      message:
        "Shipping zone LGA mapping deleted successfully",
    });
  }

  static async bulkAssignLGAs(
    req: TypedRequest,
    res: Response
  ) {
    const result =
      await ShippingZoneLGAService.bulkAssignLGAs(
        req.body
      );

    return res.status(201).json(result);
  }

  static async clearZoneLGAs(
    req: TypedRequest<ShippingZoneIdParamInput>,
    res: Response
  ) {
    const result =
      await ShippingZoneLGAService.clearZone(
        req.params.id
      );

    return res.json(result);
  }

  static async getLGAsByZone(
    req: TypedRequest<ShippingZoneIdParamInput>,
    res: Response
  ) {
    const lgas =
      await ShippingZoneLGAService.getLGAsByZone(
        req.params.id
      );

    return res.json(lgas);
  }

  static async getZonesByLGA(
    req: TypedRequest,
    res: Response
  ) {
    const zones =
      await ShippingZoneLGAService.getZonesByLGA(
        req.params.lgaId
      );

    return res.json(zones);
  }
}