import type { Request, Response } from "express";
import { prisma } from "../lib/prismadb.js";
import { NigerianState } from "@prisma/client";

import {
  createShipmentSchema,
  updateShipmentStatusSchema,
} from "../schemas/shipping.schema.js";

import {
  calculateOrderMetrics,
  calculateShippingFee,
} from "../services/shipping.service.js";

//////////////////////////////////////////////////////////
// CREATE SHIPMENT
//////////////////////////////////////////////////////////

export const createShipment = async (req: Request, res: Response) => {
  try {
    const parsed = createShipmentSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json(parsed.error.format());
    }

    const { orderId, courierId, trackingNo } = parsed.data;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        address: true,
      },
    });

    if (!order || !order.address) {
      return res.status(404).json({
        message: "Order or address not found",
      });
    }

    //////////////////////////////////////////////////////
    // CALCULATE ORDER METRICS
    //////////////////////////////////////////////////////

    const metrics = await calculateOrderMetrics(orderId);

    //////////////////////////////////////////////////////
    // CALCULATE SHIPPING
    //////////////////////////////////////////////////////

    const shipping = await calculateShippingFee(
      NigerianState.AKWA_IBOM,
      order.address.state,
      metrics.chargeableWeight
    );

    //////////////////////////////////////////////////////
    // CREATE SHIPMENT
    //////////////////////////////////////////////////////

    const shipment = await prisma.shipment.create({
      data: {
        orderId,
        courierId: courierId ?? shipping.courierId,
        trackingNo: trackingNo ?? null,
        status: "PENDING",
      },
    });

    //////////////////////////////////////////////////////
    // UPDATE ORDER DELIVERY FEE
    //////////////////////////////////////////////////////

    await prisma.order.update({
      where: { id: orderId },
      data: {
        deliveryFee: shipping.fee,
      },
    });

    res.status(201).json({
      shipment,
      deliveryFee: shipping.fee,
      metrics,
      distanceKm: shipping.distance,
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to create shipment",
    });
  }
};

//////////////////////////////////////////////////////////
// UPDATE SHIPMENT STATUS
//////////////////////////////////////////////////////////

export const updateShipmentStatus = async (
  req: Request,
  res: Response
) => {
  try {
    const parsed = updateShipmentStatusSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json(parsed.error.format());
    }

    const shipmentId = String(req.params.id);
    const { status } = parsed.data;

    const shipment = await prisma.shipment.update({
      where: { id: shipmentId },
      data: {
        status,
        ...(status === "SHIPPED" && { shippedAt: new Date() }),
        ...(status === "DELIVERED" && { deliveredAt: new Date() }),
      },
    });

    res.json(shipment);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Shipment update failed",
    });
  }
};

//////////////////////////////////////////////////////////
// GET SHIPMENT
//////////////////////////////////////////////////////////

export const getShipment = async (req: Request, res: Response) => {
  try {
    const shipmentId = String(req.params.id);

    const shipment = await prisma.shipment.findUnique({
      where: { id: shipmentId },
      include: {
        courier: true,
        order: true,
      },
    });

    if (!shipment) {
      return res.status(404).json({
        message: "Shipment not found",
      });
    }

    res.json(shipment);

  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch shipment",
    });
  }
};