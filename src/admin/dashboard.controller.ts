import type { Request, Response } from "express";
import { getDashboardChartWithToday, getDashboardStats } from "../services/dashboard.service.js";

/* =========================================================
   DASHBOARD STATS
========================================================= */
export const dashboardStats = async (_: Request, res: Response) => {
  try {
    const stats = await getDashboardStats();

    return res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Dashboard Stats Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard stats",
    });
  }
};

/* =========================================================
   DASHBOARD CHART
========================================================= */
export const dashboardChart = async (req: Request, res: Response) => {
  try {
    const days = Number(req.query.days) || 7;

    const chart = await getDashboardChartWithToday(days);

    return res.json({
      success: true,
      data: chart,
    });
  } catch (error) {
    console.error("Dashboard Chart Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard chart",
    });
  }
};