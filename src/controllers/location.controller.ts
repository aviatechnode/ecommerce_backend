import type { Request, Response } from "express";
import { prisma } from "../lib/prismadb.js";

type StateParams = {
  stateId: string;
};

export async function getStates(_req: Request, res: Response) {
  try {
    const states = await prisma.state.findMany({
      orderBy: {
        name: "asc",
      },
      select: {
        id: true,
        name: true,
      },
    });

    return res.status(200).json({
      success: true,
      data: states,
    });
  } catch (error) {
    console.error("Failed to fetch states:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch states",
    });
  }
}

export async function getLgasByState(
  req: Request<StateParams>,
  res: Response
) {
  try {
    const { stateId } = req.params;

    if (!stateId) {
      return res.status(400).json({
        success: false,
        message: "stateId is required",
      });
    }

    const lgas = await prisma.lGA.findMany({
      where: {
        stateId,
      },
      orderBy: {
        name: "asc",
      },
      select: {
        id: true,
        name: true,
      },
    });

    return res.status(200).json({
      success: true,
      data: lgas,
    });
  } catch (error) {
    console.error("Failed to fetch LGAs:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch LGAs",
    });
  }
}