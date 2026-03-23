import type { Request, Response } from "express";
import { getAdminStats } from "./admin.service.js";

export const dashboardStats = async (
  req: Request,
  res: Response
) => {
  const stats = await getAdminStats();
  res.json(stats);
};