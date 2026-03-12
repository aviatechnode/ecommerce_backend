import type { Request, Response } from "express";
import { prisma } from "../lib/prismadb.js";
import { uploadToCloudinary } from "../utils/cloudinaryUpload.js";
import { Prisma, MediaType } from "@prisma/client";
import { createProductSchema, updateProductSchema } from "../schemas/product.schema.js";
import { generateSlug } from "../helpers/product.helper.js";




/* =========================================================
CREATE PRODUCT
========================================================= */

export const createProduct = async (req: Request, res: Response) => {
  try {
    const parsed = createProductSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json(parsed.error.format());
    }

    const data = parsed.data;

    const slug = generateSlug(data.name);

    /* IMAGE UPLOAD */

    const imageUrls: string[] = [];

    if (req.files && Array.isArray(req.files)) {
      for (const file of req.files as Express.Multer.File[]) {
        const url = await uploadToCloudinary(file.buffer);
        imageUrls.push(url);
      }
    }

    const productId = await prisma.$transaction(async (tx) => {
      /* PRODUCT */

      const product = await tx.product.create({
        data: {
          name: data.name,
          slug,
          description: data.description ?? null,
          brandId: data.brandId,
          categoryId: data.categoryId,
          oemNumber: data.oemNumber ?? null,
        },
      });

      /* VARIANT */

      const variant = await tx.productVariant.create({
        data: {
          productId: product.id,
          name: data.variantName,
          sku: data.sku,
          price: new Prisma.Decimal(data.price),
          costPrice:
            data.costPrice !== undefined
              ? new Prisma.Decimal(data.costPrice)
              : null,
          weight: data.weight ?? null,
        },
      });

      /* INVENTORY */

      await tx.productInventory.create({
        data: {
          variantId: variant.id,
          warehouseId: data.warehouseId,
          stock: data.stock,
          threshold: data.threshold ?? null,
        },
      });

      /* SPECIFICATIONS */

      if (data.specifications?.length) {
        await tx.productSpecification.createMany({
          data: data.specifications.map((s) => ({
            productId: product.id,
            name: s.name,
            value: s.value,
          })),
        });
      }

      /* VEHICLE FITMENTS */

      if (data.fitments?.length) {
        await tx.productFitment.createMany({
          data: data.fitments.map((f) => ({
            productId: product.id,
            trimId: f.trimId,
            notes: f.notes ?? null,
          })),
        });
      }

      /* MEDIA */

      if (imageUrls.length) {
        await tx.productMedia.createMany({
          data: imageUrls.map((url, index) => ({
            productId: product.id,
            url,
            type: MediaType.IMAGE,
            position: index,
          })),
        });
      }

      return product.id;
    });

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        brand: true,
        category: true,
        variants: {
          include: {
            inventories: {
              include: { warehouse: true },
            },
            attributes: {
              include: {
                value: {
                  include: { attribute: true },
                },
              },
            },
          },
        },
        medias: true,
        specifications: true,
      },
    });

    return res.status(201).json({
      message: "Product created successfully",
      product,
    });
  } catch (error) {
    console.error("Create Product Error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

/* =========================================================
GET PRODUCTS
========================================================= */

export const getProducts = async (_req: Request, res: Response) => {
  try {
    const products = await prisma.product.findMany({
      include: {
        brand: true,
        category: true,
        variants: {
          include: {
            inventories: {
              include: { warehouse: true },
            },
          },
        },
        medias: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return res.json({ products });
  } catch (error) {
    console.error("Get Products Error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

/* =========================================================
GET SINGLE PRODUCT
========================================================= */

export const getProduct = async (
  req: Request<{ id: string }>,
  res: Response
) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        brand: true,
        category: true,
        variants: {
          include: {
            inventories: {
              include: { warehouse: true },
            },
            attributes: {
              include: {
                value: {
                  include: { attribute: true },
                },
              },
            },
          },
        },
        medias: true,
        specifications: true,
        reviews: true,
        productFitments: {
        include: {
          trim: {
            include: {
              engine: {
                include: {
                  generation: {
                    include: {
                      model: {
                        include: {
                          make: true
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
      },
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    return res.json({ product });
  } catch (error) {
    console.error("Get Product Error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

/* =========================================================
GET PRODUCTS BY VEHICLE
========================================================= */

export const getProductsByVehicle = async (req: Request, res: Response) => {
  const { make, model, year } = req.query;

  const products = await prisma.product.findMany({
    where: {
      productFitments: {
        some: {
          trim: {
            engine: {
              generation: {
                yearStart: { lte: Number(year) },
                OR: [
                  { yearEnd: null },
                  { yearEnd: { gte: Number(year) } }
                ],
                model: {
                  name: String(model),
                  make: {
                    name: String(make)
                  }
                }
              }
            }
          }
        }
      }
    },
    include: {
      medias: true,
      brand: true
    }
  });

  res.json({ products });
};

/* =========================================================
GET VEHICLE MAKE
========================================================= */

export const getVehicleMakes = async (_req: Request, res: Response) => {
  const makes = await prisma.vehicleMake.findMany({
    orderBy: { name: "asc" },
  });

  res.json({ makes });
};

/* =========================================================
UPDATE PRODUCT
========================================================= */

export const updateProduct = async (
  req: Request<{ id: string }>,
  res: Response
) => {
  try {
    const { id } = req.params;

    const parsed = updateProductSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json(parsed.error.format());
    }

    const data = parsed.data;

    const updateData: Prisma.ProductUpdateInput = {};

    if (data.name !== undefined) {
      updateData.name = data.name;
      updateData.slug = generateSlug(data.name);
    }

    if (data.description !== undefined)
      updateData.description = data.description ?? null;

    if (data.brandId !== undefined) updateData.brand = { connect: { id: data.brandId } };

    if (data.categoryId !== undefined)
      updateData.category = { connect: { id: data.categoryId } };

    if (data.oemNumber !== undefined)
      updateData.oemNumber = data.oemNumber ?? null;

    const product = await prisma.product.update({
      where: { id },
      data: updateData,
    });

    return res.json({
      message: "Product updated successfully",
      product,
    });
  } catch (error: any) {
    if (error.code === "P2025") {
      return res.status(404).json({ message: "Product not found" });
    }

    console.error("Update Product Error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

/* =========================================================
DELETE PRODUCT
========================================================= */

export const deleteProduct = async (
  req: Request<{ id: string }>,
  res: Response
) => {
  try {
    await prisma.product.delete({
      where: { id: req.params.id },
    });

    return res.json({ message: "Product deleted" });
  } catch (error: any) {
    if (error.code === "P2025") {
      return res.status(404).json({ message: "Product not found" });
    }

    console.error("Delete Product Error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};