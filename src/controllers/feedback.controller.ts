import type { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prismadb.js";
import { createFeedbackSchema } from "../schemas/feedback.schema.js";

export class FeedbackController {
  createFeedback = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const validated = createFeedbackSchema.parse(req.body);

      const feedback = await prisma.feedback.create({
        data: {
          ...(validated.userName
            ? { userName: validated.userName }
            : {}),

          email: validated.email,

          ...(validated.phoneNumber
            ? { phoneNumber: validated.phoneNumber }
            : {}),

          productName: validated.productName,

          ...(validated.productNumber
            ? { productNumber: validated.productNumber }
            : {}),

          ...(validated.usageDuration
            ? { usageDuration: validated.usageDuration }
            : {}),

          ...(validated.buyAgain
            ? { buyAgain: validated.buyAgain }
            : {}),

          buyingExperience: validated.buyingExperience || 0,

          ...(validated.concern
            ? { concern: validated.concern }
            : {}),

          ratings: {
            create: validated.ratings.map((rating) => ({
              criteria: rating.criteria,
              score: rating.score,
            })),
          },
        },

        include: {
          ratings: true,
        },
      });

      res.status(201).json({
        success: true,
        message: "Feedback submitted successfully",
        data: feedback,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          errors: error.errors,
        });
        return;
      }

      res.status(500).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Server error",
      });
    }
  };
}