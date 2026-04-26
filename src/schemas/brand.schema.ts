import { z } from "zod";

export const createBrandSchema = z.object({
  name: z.string().min(1, "Name is required").trim(),
});

export const updateBrandSchema = z.object({
  name: z.string().min(1).trim().optional(),
});