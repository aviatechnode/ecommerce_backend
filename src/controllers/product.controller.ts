import type { Request, Response } from "express";
import { prisma } from "../lib/prismadb.js";
import { Prisma, MediaType } from "@prisma/client";
import {
  createProductSchema,
  updateProductSchema,
} from "../schemas/product.schema.js";
import { generateSlug } from "../helpers/product.helper.js";

//////////////////////////////////////////////////////////
// CREATE PRODUCT
//////////////////////////////////////////////////////////

export const createProduct = async (req: Request, res: Response) => {
  try {
    const parsed = createProductSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json(parsed.error.format());
    }

    const data = parsed.data;
    const slug = data.slug || generateSlug(data.name);

    const productId = await prisma.$transaction(async (tx) => {
      //////////////////////////////////////////////////////////
      // PRODUCT
      //////////////////////////////////////////////////////////

      const product = await tx.product.create({
        data: {
          name: data.name,
          slug,
          description: data.description ?? null,

          brandId: data.brandId,
          categoryId: data.categoryId,

          isActive: data.isActive ?? true,
          isFeatured: data.isFeatured ?? false,
          searchKeywords: data.searchKeywords ?? null,
        },
      });

      //////////////////////////////////////////////////////////
      // OEM NUMBERS (FIXED)
      //////////////////////////////////////////////////////////

      if (data.oemNumbers?.length) {
        await tx.productOEM.createMany({
          data: data.oemNumbers.map((oem) => ({
            productId: product.id,
            oemNumber: oem.oemNumber.trim(),
          })),
          skipDuplicates: true,
        });
      }

      //////////////////////////////////////////////////////////
      // VARIANTS
      //////////////////////////////////////////////////////////

      if (data.variants?.length) {
        for (const variantData of data.variants) {
          const variant = await tx.productVariant.create({
            data: {
              productId: product.id,

              name: variantData.name,
              sku: variantData.sku,

              price: new Prisma.Decimal(variantData.price),

              costPrice:
                variantData.costPrice !== undefined
                  ? new Prisma.Decimal(variantData.costPrice)
                  : null,

              compareAtPrice:
                variantData.compareAtPrice !== undefined
                  ? new Prisma.Decimal(variantData.compareAtPrice)
                  : null,

              weight: variantData.weight ?? null,
              length: variantData.length ?? null,
              width: variantData.width ?? null,
              height: variantData.height ?? null,

              barcode: variantData.barcode?.trim()
                ? variantData.barcode.trim()
                : null,
              isActive: variantData.isActive ?? true,
            },
          });

          //////////////////////////////////////////////////////////
          // INVENTORIES (SAFE GUARD ADDED)
          //////////////////////////////////////////////////////////

          if (variantData.inventories?.length) {
            const validInventories = variantData.inventories.filter(
              (inv) => inv.warehouseId && inv.warehouseId.length > 0
            );

            if (validInventories.length) {
              await tx.productInventory.createMany({
                data: validInventories.map((inv) => ({
                  variantId: variant.id,
                  warehouseId: inv.warehouseId,

                  stock: inv.stock,
                  reserved: inv.reserved ?? 0,
                  threshold: inv.threshold ?? null,
                })),
                skipDuplicates: true,
              });
            }
          }

          //////////////////////////////////////////////////////////
          // ATTRIBUTES
          //////////////////////////////////////////////////////////

          if (variantData.attributes?.length) {
            await tx.variantAttribute.createMany({
              data: variantData.attributes.map((attr) => ({
                variantId: variant.id,
                valueId: attr.valueId,
              })),
              skipDuplicates: true,
            });
          }
        }
      }

      //////////////////////////////////////////////////////////
      // SPECIFICATIONS
      //////////////////////////////////////////////////////////

      if (data.specifications?.length) {
        await tx.productSpecification.createMany({
          data: data.specifications.map((spec) => ({
            productId: product.id,
            name: spec.name,
            value: spec.value,
          })),
          skipDuplicates: true,
        });
      }

      //////////////////////////////////////////////////////////
      // FITMENTS
      //////////////////////////////////////////////////////////

      if (data.productFitments?.length) {
        await tx.productFitment.createMany({
          data: data.productFitments.map((fitment) => ({
            productId: product.id,
            trimId: fitment.trimId,
            notes: fitment.notes ?? null,
          })),
          skipDuplicates: true,
        });
      }

      //////////////////////////////////////////////////////////
      // MEDIA
      //////////////////////////////////////////////////////////

      if (data.medias?.length) {
        await tx.productMedia.createMany({
          data: data.medias.map((media) => ({
            productId: product.id,
            url: media.url,
            type: media.type as MediaType,
            position: media.position,
          })),
          skipDuplicates: true,
        });
      }

      //////////////////////////////////////////////////////////
      // SEARCH INDEX
      //////////////////////////////////////////////////////////

      const searchableText = [
        data.name,
        data.description,
        data.searchKeywords,
        ...(data.oemNumbers?.map((o) => o.oemNumber) || []),
      ]
        .filter(Boolean)
        .join(" ");

      await tx.productSearchIndex.create({
        data: {
          productId: product.id,
          searchableText,
        },
      });

      return product.id;
    });

    //////////////////////////////////////////////////////////
    // RETURN CREATED PRODUCT
    //////////////////////////////////////////////////////////

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        brand: true,
        category: true,
        oemNumbers: true,

        variants: {
          include: {
            inventories: {
              include: {
                warehouse: true,
              },
            },
            attributes: {
              include: {
                value: {
                  include: {
                    attribute: true,
                  },
                },
              },
            },
          },
        },

        medias: true,
        specifications: true,
        productFitments: true,
        productSearchIndexes: true,
      },
    });

    return res.status(201).json({
      message: "Product created successfully",
      product,
    });
  } catch (error) {
    console.error("Create Product Error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};
//////////////////////////////////////////////////////////
// GET ALL PRODUCTS
//////////////////////////////////////////////////////////

export const getProducts = async (_req: Request, res: Response) => {
  try {
    const products = await prisma.product.findMany({
      where: {
        deletedAt: null,
      },

      include: {
        brand: true,
        category: true,
        oemNumbers: true,

        variants: {
          include: {
            inventories: {
              include: {
                warehouse: true,
              },
            },
            attributes: {
              include: {
                value: {
                  include: {
                    attribute: true,
                  },
                },
              },
            },
          },
        },

        medias: true,
        specifications: true,
        productFitments: true,
      },

      orderBy: {
        createdAt: "desc",
      },
    });

    return res.json({ products });
  } catch (error) {
    console.error("Get Products Error:", error);
    return res.status(500).json({
      message: "Server error",
    });
  }
};

//////////////////////////////////////////////////////////
// GET SINGLE PRODUCT
//////////////////////////////////////////////////////////

export const getProduct = async (
  req: Request<{ id: string }>,
  res: Response
) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findFirst({
      where: {
        id,
        deletedAt: null,
      },

      include: {
        brand: true,
        category: true,
        oemNumbers: true,

        variants: {
          include: {
            inventories: {
              include: {
                warehouse: true,
              },
            },
            attributes: {
              include: {
                value: {
                  include: {
                    attribute: true,
                  },
                },
              },
            },
          },
        },

        medias: true,
        specifications: true,
        productFitments: true,

        reviews: {
          where: {
            isApproved: true,
          },
        },
      },
    });

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    await prisma.product.update({
      where: { id },
      data: {
        viewCount: {
          increment: 1,
        },
      },
    });

    return res.json({ product });
  } catch (error) {
    console.error("Get Product Error:", error);
    return res.status(500).json({
      message: "Server error",
    });
  }
};

//////////////////////////////////////////////////////////
// UPDATE PRODUCT
//////////////////////////////////////////////////////////

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
      updateData.slug = data.slug || generateSlug(data.name);
    }

    if (data.description !== undefined) {
      updateData.description = data.description ?? null;
    }

    if (data.brandId !== undefined) {
      updateData.brand = {
        connect: {
          id: data.brandId,
        },
      };
    }

    if (data.categoryId !== undefined) {
      updateData.category = {
        connect: {
          id: data.categoryId,
        },
      };
    }

    if (data.isActive !== undefined) {
      updateData.isActive = data.isActive;
    }

    if (data.isFeatured !== undefined) {
      updateData.isFeatured = data.isFeatured;
    }

    if (data.searchKeywords !== undefined) {
      updateData.searchKeywords = data.searchKeywords ?? null;
    }

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
      return res.status(404).json({
        message: "Product not found",
      });
    }

    console.error("Update Product Error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

//////////////////////////////////////////////////////////
// DELETE PRODUCT (SOFT DELETE)
//////////////////////////////////////////////////////////

export const deleteProduct = async (
  req: Request<{ id: string }>,
  res: Response
) => {
  try {
    await prisma.product.update({
      where: {
        id: req.params.id,
      },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    });

    return res.json({
      message: "Product deleted successfully",
    });
  } catch (error: any) {
    if (error.code === "P2025") {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    console.error("Delete Product Error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};