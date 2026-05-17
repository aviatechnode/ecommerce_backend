import type { Request, Response } from "express";
import { prisma } from "../lib/prismadb.js";
import type { PermissionString } from "../utils/rbac.js";

interface AuthUser {
  id: string;
  roleId: string;
  permissions: PermissionString[];
  isSuperAdmin: boolean;
}

interface AuthRequest extends Request {
  user?: AuthUser;
}

//////////////////////////////////////////////////////////
// GET USER WISHLIST
//////////////////////////////////////////////////////////

export const getWishlist = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.user) {
      return res
        .status(401)
        .json({ message: "Unauthorized" });
    }

    const wishlist = await prisma.wishlist.findUnique({
      where: {
        userId: req.user.id,
      },
      include: {
        items: {
          include: {
            product: {
              include: {
                medias: true,
              },
            },
          },
        },
      },
    });

    return res.json({
      wishlist: wishlist ?? {
        items: [],
      },
    });
  } catch (error) {
    console.error("Get wishlist error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

//////////////////////////////////////////////////////////
// ADD ITEM TO WISHLIST
//////////////////////////////////////////////////////////

export const addWishlistItem = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.user) {
      return res
        .status(401)
        .json({ message: "Unauthorized" });
    }

    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({
        message: "productId is required",
      });
    }

    const product =
      await prisma.product.findUnique({
        where: {
          id: productId,
        },
      });

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    //////////////////////////////////////////////////////////
    // ENSURE WISHLIST EXISTS
    //////////////////////////////////////////////////////////

    let wishlist =
      await prisma.wishlist.findUnique({
        where: {
          userId: req.user.id,
        },
      });

    if (!wishlist) {
      wishlist =
        await prisma.wishlist.create({
          data: {
            userId: req.user.id,
          },
        });
    }

    //////////////////////////////////////////////////////////
    // CREATE ITEM
    //////////////////////////////////////////////////////////

    const item =
      await prisma.wishlistItem.create({
        data: {
          wishlistId: wishlist.id,
          productId,
        },
        include: {
          product: {
            include: {
              medias: true,
            },
          },
        },
      });

    return res.status(201).json({
      message: "Item added to wishlist",
      item,
    });
  } catch (error: any) {
    if (error?.code === "P2002") {
      return res.status(400).json({
        message:
          "Item already exists in wishlist",
      });
    }

    console.error(
      "Add wishlist item error:",
      error
    );

    return res.status(500).json({
      message: "Server error",
    });
  }
};

//////////////////////////////////////////////////////////
// REMOVE ITEM FROM WISHLIST
//////////////////////////////////////////////////////////

export const removeWishlistItem = async (
  req: AuthRequest &
    Request<{ id: string }>,
  res: Response
) => {
  try {
    if (!req.user) {
      return res
        .status(401)
        .json({ message: "Unauthorized" });
    }

    const wishlist =
      await prisma.wishlist.findUnique({
        where: {
          userId: req.user.id,
        },
      });

    if (!wishlist) {
      return res.status(404).json({
        message: "Wishlist not found",
      });
    }

    const item =
      await prisma.wishlistItem.findUnique({
        where: {
          id: req.params.id,
        },
      });

    if (
      !item ||
      item.wishlistId !== wishlist.id
    ) {
      return res.status(404).json({
        message:
          "Item not found in wishlist",
      });
    }

    await prisma.wishlistItem.delete({
      where: {
        id: item.id,
      },
    });

    return res.json({
      message: "Item removed from wishlist",
    });
  } catch (error) {
    console.error(
      "Remove wishlist item error:",
      error
    );

    return res.status(500).json({
      message: "Server error",
    });
  }
};

//////////////////////////////////////////////////////////
// CLEAR WISHLIST
//////////////////////////////////////////////////////////

export const clearWishlist = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.user) {
      return res
        .status(401)
        .json({ message: "Unauthorized" });
    }

    const wishlist =
      await prisma.wishlist.findUnique({
        where: {
          userId: req.user.id,
        },
      });

    if (!wishlist) {
      return res.status(404).json({
        message: "Wishlist not found",
      });
    }

    await prisma.wishlistItem.deleteMany({
      where: {
        wishlistId: wishlist.id,
      },
    });

    return res.json({
      message: "Wishlist cleared",
    });
  } catch (error) {
    console.error(
      "Clear wishlist error:",
      error
    );

    return res.status(500).json({
      message: "Server error",
    });
  }
};

//////////////////////////////////////////////////////////
// TOGGLE WISHLIST
//////////////////////////////////////////////////////////

export const toggleWishlist = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.user) {
      return res
        .status(401)
        .json({ message: "Unauthorized" });
    }

    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({
        message: "productId is required",
      });
    }

    //////////////////////////////////////////////////////////
    // VALIDATE PRODUCT
    //////////////////////////////////////////////////////////

    const product =
      await prisma.product.findUnique({
        where: {
          id: productId,
        },
      });

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    //////////////////////////////////////////////////////////
    // ENSURE WISHLIST EXISTS
    //////////////////////////////////////////////////////////

    let wishlist =
      await prisma.wishlist.findUnique({
        where: {
          userId: req.user.id,
        },
      });

    if (!wishlist) {
      wishlist =
        await prisma.wishlist.create({
          data: {
            userId: req.user.id,
          },
        });
    }

    //////////////////////////////////////////////////////////
    // CHECK EXISTING ITEM
    //////////////////////////////////////////////////////////

    const existing =
      await prisma.wishlistItem.findFirst({
        where: {
          wishlistId: wishlist.id,
          productId,
        },
      });

    //////////////////////////////////////////////////////////
    // REMOVE IF EXISTS
    //////////////////////////////////////////////////////////

    if (existing) {
      await prisma.wishlistItem.delete({
        where: {
          id: existing.id,
        },
      });

      return res.json({
        message:
          "Item removed from wishlist",
        removed: true,
        productId,
      });
    }

    //////////////////////////////////////////////////////////
    // ADD IF NOT EXISTS
    //////////////////////////////////////////////////////////

    const item =
      await prisma.wishlistItem.create({
        data: {
          wishlistId: wishlist.id,
          productId,
        },
        include: {
          product: {
            include: {
              medias: true,
            },
          },
        },
      });

    return res.status(201).json({
      message: "Item added to wishlist",
      added: true,
      item,
    });
  } catch (error) {
    console.error(
      "Toggle wishlist error:",
      error
    );

    return res.status(500).json({
      message: "Server error",
    });
  }
};