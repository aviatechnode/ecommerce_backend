import type { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prismadb.js";
import { AddressType, NigerianState, Prisma } from "@prisma/client";

/* =========================================================
   ZOD SCHEMAS
========================================================= */

const createAddressSchema = z.object({
  type: z.nativeEnum(AddressType),

  street: z.string().min(2),
  area: z.string().optional(),
  city: z.string().min(2),
  state: z.nativeEnum(NigerianState),
  lga: z.string().min(2),
  landmark: z.string().optional(),
  postalCode: z.string().optional(),
  phone: z.string().min(7),

  isDefault: z.boolean().optional(),
});

const updateAddressSchema = createAddressSchema.partial();

/* =========================================================
   CREATE ADDRESS
========================================================= */

export const createAddress = async (
  req: Request,
  res: Response
) => {
  try {
    if (!req.user)
      return res.status(401).json({ message: "Unauthorized" });

    const parsed = createAddressSchema.safeParse(req.body);
    if (!parsed.success)
      return res.status(400).json({ errors: parsed.error.format() });

    const data = parsed.data;

    const address = await prisma.$transaction(async (tx) => {
      if (data.isDefault) {
        await tx.address.updateMany({
          where: {
            userId: req.user!.id,
            type: data.type,
          },
          data: { isDefault: false },
        });
      }

      return tx.address.create({
        data: {
          userId: req.user!.id,
          type: data.type,

          street: data.street,
          area: data.area ?? null,
          city: data.city,
          state: data.state,
          lga: data.lga,
          landmark: data.landmark ?? null,
          postalCode: data.postalCode ?? null,
          phone: data.phone,
          isDefault: data.isDefault ?? false,
        },
      });
    });

    return res.status(201).json({
      message: "Address created successfully",
      address,
    });
  } catch (error) {
    console.error("Create Address Error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

/* =========================================================
   GET MY ADDRESSES
========================================================= */

export const getMyAddresses = async (
  req: Request,
  res: Response
) => {
  try {
    if (!req.user)
      return res.status(401).json({ message: "Unauthorized" });

    const addresses = await prisma.address.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: "desc" },
    });

    return res.json({ addresses });
  } catch (error) {
    console.error("Get Addresses Error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

/* =========================================================
   GET SINGLE ADDRESS
========================================================= */

export const getAddress = async (
  req: Request<{ id: string }>,
  res: Response
) => {
  try {
    if (!req.user)
      return res.status(401).json({ message: "Unauthorized" });

    const { id } = req.params;

    const address = await prisma.address.findUnique({
      where: { id },
    });

    if (!address || address.userId !== req.user.id) {
      return res.status(404).json({ message: "Address not found" });
    }

    return res.json({ address });
  } catch (error) {
    console.error("Get Address Error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

/* =========================================================
   UPDATE ADDRESS
========================================================= */

export const updateAddress = async (
  req: Request<{ id: string }>,
  res: Response
) => {
  try {
    if (!req.user)
      return res.status(401).json({ message: "Unauthorized" });

    const { id } = req.params;

    const parsed = updateAddressSchema.safeParse(req.body);
    if (!parsed.success)
      return res.status(400).json({ errors: parsed.error.format() });

    const existing = await prisma.address.findUnique({
      where: { id },
    });

    if (!existing || existing.userId !== req.user.id) {
      return res.status(404).json({ message: "Address not found" });
    }

    const data = parsed.data;

    const updateData: Prisma.AddressUpdateInput = {};

    if (data.street !== undefined) updateData.street = data.street;
    if (data.area !== undefined) updateData.area = data.area ?? null;
    if (data.city !== undefined) updateData.city = data.city;
    if (data.state !== undefined) updateData.state = data.state;
    if (data.lga !== undefined) updateData.lga = data.lga;
    if (data.landmark !== undefined)
      updateData.landmark = data.landmark ?? null;
    if (data.postalCode !== undefined)
      updateData.postalCode = data.postalCode ?? null;
    if (data.phone !== undefined) updateData.phone = data.phone;

    const address = await prisma.$transaction(async (tx) => {
      if (data.isDefault) {
        await tx.address.updateMany({
          where: {
            userId: req.user!.id,
            type: existing.type,
          },
          data: { isDefault: false },
        });
      }

      return tx.address.update({
        where: { id },
        data: {
          ...updateData,
          ...(data.isDefault !== undefined && {
            isDefault: data.isDefault,
          }),
        },
      });
    });

    return res.json({
      message: "Address updated successfully",
      address,
    });
  } catch (error) {
    console.error("Update Address Error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

/* =========================================================
   DELETE ADDRESS
========================================================= */

export const deleteAddress = async (
  req: Request<{ id: string }>,
  res: Response
) => {
  try {
    if (!req.user)
      return res.status(401).json({ message: "Unauthorized" });

    const { id } = req.params;

    const existing = await prisma.address.findUnique({
      where: { id },
    });

    if (!existing || existing.userId !== req.user.id) {
      return res.status(404).json({ message: "Address not found" });
    }

    await prisma.address.delete({
      where: { id },
    });

    return res.json({ message: "Address deleted" });
  } catch (error) {
    console.error("Delete Address Error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

/* =========================================================
   SET DEFAULT ADDRESS
========================================================= */

export const setDefaultAddress = async (
  req: Request<{ id: string }>,
  res: Response
) => {
  try {
    if (!req.user)
      return res.status(401).json({ message: "Unauthorized" });

    const { id } = req.params;

    const address = await prisma.address.findUnique({
      where: { id },
    });

    if (!address || address.userId !== req.user.id) {
      return res.status(404).json({ message: "Address not found" });
    }

    await prisma.$transaction([
      prisma.address.updateMany({
        where: {
          userId: req.user.id,
          type: address.type,
        },
        data: { isDefault: false },
      }),
      prisma.address.update({
        where: { id },
        data: { isDefault: true },
      }),
    ]);

    return res.json({ message: "Default address updated" });
  } catch (error) {
    console.error("Set Default Error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};