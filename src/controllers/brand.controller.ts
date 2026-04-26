// controllers/brand.controller.ts
import type { Request, Response } from "express";
import { prisma } from "../lib/prismadb.js";
import { createBrandSchema, updateBrandSchema } from "../schemas/brand.schema.js";
import { generateSlug, generateUniqueSlug } from "../helpers/generate.slug.helper.js";

/* =========================================================
CREATE
========================================================= */
export const createBrand = async (req: Request, res: Response) => {
  try {
    const parsed = createBrandSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        errors: parsed.error.format(),
      });
    }

    const { name } = parsed.data;

    const baseSlug = generateSlug(name);
    const slug = await generateUniqueSlug(baseSlug, prisma.brand);

    const brand = await prisma.brand.create({
      data: { name, slug },
    });

    return res.status(201).json({
      message: "Brand created",
      brand,
    });
  } catch (error) {
    console.error("Create Brand Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* =========================================================
GET ALL
========================================================= */
export const getBrands = async (_req: Request, res: Response) => {
  try {
    const brands = await prisma.brand.findMany({
      orderBy: { name: "asc" },
    });

    return res.json(brands);
  } catch (error) {
    console.error("Get Brands Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* =========================================================
GET ONE
========================================================= */
export const getBrand = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);

    const brand = await prisma.brand.findUnique({
      where: { id },
      include: {
        _count: { select: { products: true } },
      },
    });

    if (!brand) {
      return res.status(404).json({ message: "Brand not found" });
    }

    return res.json(brand);
  } catch (error) {
    console.error("Get Brand Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* =========================================================
UPDATE
========================================================= */
export const updateBrand = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);

    const parsed = updateBrandSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        errors: parsed.error.format(),
      });
    }

    const existing = await prisma.brand.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({ message: "Brand not found" });
    }

    const data: any = {};

    if (parsed.data.name && parsed.data.name !== existing.name) {
      data.name = parsed.data.name;

      const baseSlug = generateSlug(parsed.data.name);
      data.slug = await generateUniqueSlug(baseSlug, prisma.brand);
    }

    const brand = await prisma.brand.update({
      where: { id },
      data,
    });

    return res.json({
      message: "Brand updated",
      brand,
    });
  } catch (error) {
    console.error("Update Brand Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* =========================================================
DELETE
========================================================= */
export const deleteBrand = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);

    const brand = await prisma.brand.findUnique({
      where: { id },
      include: {
        _count: { select: { products: true } },
      },
    });

    if (!brand) {
      return res.status(404).json({ message: "Brand not found" });
    }

    if (brand._count.products > 0) {
      return res.status(400).json({
        message: "Cannot delete brand with products",
      });
    }

    await prisma.brand.delete({
      where: { id },
    });

    return res.json({ message: "Brand deleted" });
  } catch (error) {
    console.error("Delete Brand Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};