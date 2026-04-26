import type { Request, Response } from "express";
import { prisma } from "../lib/prismadb.js";
import {
  createReviewSchema,
  updateReviewSchema,
} from "../schemas/product.review.schema.js";

//////////////////////////////////////////////////////////
// CREATE REVIEW
//////////////////////////////////////////////////////////

export const createReview = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const parsed = createReviewSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json(parsed.error.format());
    }

    const { productId, rating, comment } = parsed.data;

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const review = await prisma.productReview.create({
      data: {
        userId: req.user.id,
        productId,
        rating,
        comment: comment ?? null,
      },
    });

    return res.status(201).json({
      message: "Review created",
      review,
    });
  } catch (error: any) {
    if (error.code === "P2002") {
      return res.status(400).json({
        message: "You already reviewed this product",
      });
    }

    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

//////////////////////////////////////////////////////////
// UPDATE REVIEW
//////////////////////////////////////////////////////////

export const updateReview = async (
  req: Request<{ id: string }>,
  res: Response
) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const parsed = updateReviewSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json(parsed.error.format());
    }

    const review = await prisma.productReview.findUnique({
      where: { id: req.params.id },
    });

    if (!review || review.userId !== req.user.id) {
      return res.status(404).json({ message: "Review not found" });
    }

    const updated = await prisma.productReview.update({
      where: { id: review.id },
      data: {
        rating: parsed.data.rating,
        comment: parsed.data.comment ?? null,
      },
    });

    return res.json({
      message: "Review updated",
      review: updated,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

//////////////////////////////////////////////////////////
// DELETE REVIEW
//////////////////////////////////////////////////////////

export const deleteReview = async (
  req: Request<{ id: string }>,
  res: Response
) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const review = await prisma.productReview.findUnique({
      where: { id: req.params.id },
    });

    if (!review || review.userId !== req.user.id) {
      return res.status(404).json({ message: "Review not found" });
    }

    await prisma.productReview.delete({
      where: { id: review.id },
    });

    return res.json({
      message: "Review deleted",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

//////////////////////////////////////////////////////////
// GET PRODUCT REVIEWS
//////////////////////////////////////////////////////////

export const getProductReviews = async (
  req: Request<{ productId: string }>,
  res: Response
) => {
  try {
    const reviews = await prisma.productReview.findMany({
      where: {
        productId: req.params.productId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.json({ reviews });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

//////////////////////////////////////////////////////////
// GET PRODUCT RATING SUMMARY
//////////////////////////////////////////////////////////

export const getProductRatingSummary = async (
  req: Request<{ productId: string }>,
  res: Response
) => {
  try {
    const stats = await prisma.productReview.aggregate({
      where: {
        productId: req.params.productId,
      },
      _avg: {
        rating: true,
      },
      _count: {
        rating: true,
      },
    });

    return res.json({
      averageRating: stats._avg.rating ?? 0,
      totalReviews: stats._count.rating,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};