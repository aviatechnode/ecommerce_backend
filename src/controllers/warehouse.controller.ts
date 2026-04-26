import type { Request, Response } from "express";
import { prisma } from "../lib/prismadb.js";
import {
  createWarehouseSchema,
  updateWarehouseSchema,
  warehouseIdSchema,
} from "../schemas/warehouse.schema.js";

/* ================= CREATE ================= */
export const createWarehouse = async (req: Request, res: Response) => {
  try {
    const parsed = createWarehouseSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        errors: parsed.error.format(),
      });
    }

    const warehouse = await prisma.warehouse.create({
      data: parsed.data,
    });

    return res.status(201).json({
      message: "Warehouse created",
      warehouse,
    });
  } catch (error) {
    console.error("Create Warehouse Error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

/* ================= GET ALL ================= */
export const getWarehouses = async (_req: Request, res: Response) => {
  try {
    const warehouses = await prisma.warehouse.findMany({
      orderBy: { name: "asc" },
    });

    return res.json(warehouses);
  } catch (error) {
    console.error("Get Warehouses Error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

/* ================= UPDATE ================= */
export const updateWarehouse = async (req: Request, res: Response) => {
  try {
    /* validate params */
    const paramsParsed = warehouseIdSchema.safeParse(req.params);

    if (!paramsParsed.success) {
      return res.status(400).json({
        errors: paramsParsed.error.format(),
      });
    }

    const { id } = paramsParsed.data;

    /* validate body */
    const bodyParsed = updateWarehouseSchema.safeParse(req.body);

    if (!bodyParsed.success) {
      return res.status(400).json({
        errors: bodyParsed.error.format(),
      });
    }

    const existing = await prisma.warehouse.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({
        message: "Warehouse not found",
      });
    }

    /* IMPORTANT: remove undefined fields */
    const data = Object.fromEntries(
      Object.entries(bodyParsed.data).filter(([_, v]) => v !== undefined)
    );

    const warehouse = await prisma.warehouse.update({
      where: { id },
      data,
    });

    return res.json({
      message: "Warehouse updated",
      warehouse,
    });
  } catch (error) {
    console.error("Update Warehouse Error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

/* ================= DELETE ================= */
export const deleteWarehouse = async (req: Request, res: Response) => {
  try {
    const paramsParsed = warehouseIdSchema.safeParse(req.params);

    if (!paramsParsed.success) {
      return res.status(400).json({
        errors: paramsParsed.error.format(),
      });
    }

    const { id } = paramsParsed.data;

    const existing = await prisma.warehouse.findUnique({
      where: { id },
      include: {
        inventories: true,
        routes: true,
      },
    });

    if (!existing) {
      return res.status(404).json({
        message: "Warehouse not found",
      });
    }

    if (existing.inventories.length > 0) {
      return res.status(400).json({
        message: "Cannot delete warehouse with inventory",
      });
    }

    if (existing.routes.length > 0) {
      return res.status(400).json({
        message: "Cannot delete warehouse with routes",
      });
    }

    await prisma.warehouse.delete({
      where: { id },
    });

    return res.json({
      message: "Warehouse deleted",
    });
  } catch (error) {
    console.error("Delete Warehouse Error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};