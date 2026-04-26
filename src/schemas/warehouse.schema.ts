import { z } from "zod";
import { NigerianStateEnum } from "../validation/shared/nigerian-state.enum.js";

/* ================= CREATE ================= */
export const createWarehouseSchema = z.object({
  name: z.string().min(1, "Name is required").trim(),
  state: NigerianStateEnum,
  city: z.string().min(1, "City is required").trim(),
});

/* ================= UPDATE ================= */
export const updateWarehouseSchema = z.object({
  name: z.string().min(1).trim().optional(),
  state: NigerianStateEnum.optional(),
  city: z.string().min(1).trim().optional(),
});

/* ================= PARAMS ================= */
export const warehouseIdSchema = z.object({
  id: z.string().uuid("Invalid warehouse ID"),
});




