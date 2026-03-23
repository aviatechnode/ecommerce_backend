import { z } from "zod";

export const vehicleHierarchySchema = z.object({
  make: z.string(),
  model: z.string(),
  generation: z.string(),
  yearStart: z.number(),
  yearEnd: z.number().optional(),
  engine: z.string(),
  displacement: z.string().optional(),
  trim: z.string(),
});