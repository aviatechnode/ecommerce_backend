import type { Request, Response } from "express";
import { prisma } from "../lib/prismadb.js";
import {
  createAddressSchema,
  updateAddressSchema,
} from "../schemas/address.schema.js";
import { normalizePhone } from "../utils/phone.utils.js";

/* =========================================================
HELPER
========================================================= */

const buildFullAddress = (data: {
  street: string;
  area?: string | null;
  landmark?: string | null;
  city: string;
}) =>
  [data.street, data.area, data.landmark, data.city]
    .filter(Boolean)
    .join(", ");

/* =========================================================
CREATE ADDRESS
========================================================= */

export const createAddress = async (
  req: Request,
  res: Response
) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const parsed = createAddressSchema.safeParse(
      req.body
    );

    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid address data",
        errors: parsed.error.flatten(),
      });
    }

    const data = parsed.data;

    const lga = await prisma.lGA.findFirst({
      where: {
        id: data.lgaId,
        stateId: data.stateId,
      },
      select: { id: true },
    });

    if (!lga) {
      return res.status(400).json({
        message:
          "Selected LGA does not belong to selected state",
      });
    }

    const address = await prisma.$transaction(
      async (tx) => {
        if (data.isDefault) {
          await tx.address.updateMany({
            where: {
              userId: req.user!.id,
            },
            data: {
              isDefault: false,
            },
          });
        }

        return tx.address.create({
          data: {
            userId: req.user!.id,
            name: data.name,
            phone: normalizePhone(data.phone),
            stateId: data.stateId,
            lgaId: data.lgaId,
            city: data.city,
            area: data.area ?? null,
            street: data.street,
            landmark: data.landmark ?? null,
            fullAddress: data.fullAddress,
            isDefault: data.isDefault ?? false,
          },
        });
      }
    );

    return res.status(201).json({
      message: "Address created successfully",
      address,
    });
  } catch (error: any) {
    console.error("Create Address Error:", error);

    return res.status(500).json({
      message:
        error.message ||
        "Failed to create address",
    });
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
    if (!req.user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const addresses = await prisma.address.findMany({
      where: {
        userId: req.user.id,
      },
      orderBy: [
        { isDefault: "desc" },
        { id: "desc" },
      ],
      include: {
        state: true,
        lga: true,
      },
    });

    return res.json({ addresses });
  } catch (error) {
    console.error("Get Addresses Error:", error);

    return res.status(500).json({
      message: "Failed to fetch addresses",
    });
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
    if (!req.user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const { id } = req.params;

    const address = await prisma.address.findFirst({
      where: {
        id,
        userId: req.user.id,
      },
      include: {
        state: true,
        lga: true,
      },
    });

    if (!address) {
      return res.status(404).json({
        message: "Address not found",
      });
    }

    return res.json({ address });
  } catch (error) {
    console.error("Get Address Error:", error);

    return res.status(500).json({
      message: "Failed to fetch address",
    });
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
    if (!req.user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const { id } = req.params;

    const parsed = updateAddressSchema.safeParse(
      req.body
    );

    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid address data",
        errors: parsed.error.flatten(),
      });
    }

    const existing = await prisma.address.findFirst({
      where: {
        id,
        userId: req.user.id,
      },
    });

    if (!existing) {
      return res.status(404).json({
        message: "Address not found",
      });
    }

    const data = parsed.data;

    const nextStateId =
      data.stateId ?? existing.stateId;
    const nextLgaId = data.lgaId ?? existing.lgaId;

    if (
      data.stateId !== undefined ||
      data.lgaId !== undefined
    ) {
      const lga = await prisma.lGA.findFirst({
        where: {
          id: nextLgaId,
          stateId: nextStateId,
        },
        select: { id: true },
      });

      if (!lga) {
        return res.status(400).json({
          message:
            "Selected LGA does not belong to selected state",
        });
      }
    }

    const fullAddress = buildFullAddress({
      street: data.street ?? existing.street,
      area:
        data.area !== undefined
          ? data.area
          : existing.area,
      landmark:
        data.landmark !== undefined
          ? data.landmark
          : existing.landmark,
      city: data.city ?? existing.city,
    });

    const address = await prisma.$transaction(
      async (tx) => {
        if (data.isDefault === true) {
          await tx.address.updateMany({
            where: {
              userId: req.user!.id,
            },
            data: {
              isDefault: false,
            },
          });
        }

        return tx.address.update({
          where: { id },
          data: {
            ...(data.name !== undefined && {
              name: data.name,
            }),

            ...(data.phone !== undefined && {
              phone: normalizePhone(data.phone),
            }),

            ...(data.stateId !== undefined && {
              stateId: data.stateId,
            }),

            ...(data.lgaId !== undefined && {
              lgaId: data.lgaId,
            }),

            ...(data.city !== undefined && {
              city: data.city,
            }),

            ...(data.area !== undefined && {
              area: data.area ?? null,
            }),

            ...(data.street !== undefined && {
              street: data.street,
            }),

            ...(data.landmark !== undefined && {
              landmark:
                data.landmark ?? null,
            }),

            fullAddress,

            ...(data.isDefault !== undefined && {
              isDefault: data.isDefault,
            }),
          },
        });
      }
    );

    return res.json({
      message: "Address updated successfully",
      address,
    });
  } catch (error: any) {
    console.error("Update Address Error:", error);

    return res.status(500).json({
      message:
        error.message ||
        "Failed to update address",
    });
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
    if (!req.user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const { id } = req.params;

    const existing = await prisma.address.findFirst({
      where: {
        id,
        userId: req.user.id,
      },
    });

    if (!existing) {
      return res.status(404).json({
        message: "Address not found",
      });
    }

    await prisma.address.delete({
      where: { id },
    });

    return res.json({
      message: "Address deleted",
    });
  } catch (error) {
    console.error("Delete Address Error:", error);

    return res.status(500).json({
      message: "Failed to delete address",
    });
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
    if (!req.user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const { id } = req.params;

    const address = await prisma.address.findFirst({
      where: {
        id,
        userId: req.user.id,
      },
    });

    if (!address) {
      return res.status(404).json({
        message: "Address not found",
      });
    }

    await prisma.$transaction([
      prisma.address.updateMany({
        where: {
          userId: req.user.id,
        },
        data: {
          isDefault: false,
        },
      }),

      prisma.address.update({
        where: { id },
        data: {
          isDefault: true,
        },
      }),
    ]);

    return res.json({
      message: "Default address updated",
    });
  } catch (error) {
    console.error("Set Default Error:", error);

    return res.status(500).json({
      message: "Failed to set default address",
    });
  }
};