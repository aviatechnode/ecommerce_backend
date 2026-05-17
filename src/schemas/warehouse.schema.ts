import { z } from "zod";

/* ================= CREATE ================= */
export const createWarehouseSchema = z.object({
  name: z.string().min(1, "Name is required").trim(),
  stateId: z.string().uuid("Invalid state ID"),
  city: z.string().min(1, "City is required").trim(),
});

/* ================= UPDATE ================= */
export const updateWarehouseSchema = z.object({
  name: z.string().min(1).trim().optional(),
  stateId: z.string().uuid("Invalid state ID").optional(),
  city: z.string().min(1).trim().optional(),
});

/* ================= PARAMS ================= */
export const warehouseIdSchema = z.object({
  id: z.string().uuid("Invalid warehouse ID"),
});