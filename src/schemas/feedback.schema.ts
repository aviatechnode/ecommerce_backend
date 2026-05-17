import { z } from "zod";

export const createFeedbackSchema = z.object({
  userName: z.string().optional(),

  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email address"),

  phoneNumber: z.string().optional(),

  productName: z
    .string()
    .min(1, "Product name is required"),

  productNumber: z.string().optional(),
  usageDuration: z.string().optional(),
  buyAgain: z.string().optional(),
  buyingExperience: z.number().min(0).max(4).optional(),
  concern: z.string().optional(),

  ratings: z.array(
    z.object({
      criteria: z.string(),
      score: z.number().min(1).max(4),
    })
  ),
});