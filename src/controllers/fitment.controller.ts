import type { Request, Response } from "express";
import {
  processProductFitments,
  searchFitments,
} from "../services/fitment.service.js";

import { fitmentSearchSchema, type FitmentSearchInput } from "../schemas/fitment.schema.js";

//////////////////////////////////////////////////////////
// HELPERS (ZOD VALIDATION)
//////////////////////////////////////////////////////////

const parseSearchQuery = (query: Request["query"]): FitmentSearchInput => {
  const parsed = fitmentSearchSchema.safeParse(query);

  if (!parsed.success) {
    throw new Error("Invalid search query");
  }

  // 🔥 REMOVE undefined keys (CRITICAL FIX)
  const cleaned = Object.fromEntries(
    Object.entries(parsed.data).filter(([_, v]) => v !== undefined)
  ) as FitmentSearchInput;

  return cleaned;
};
//////////////////////////////////////////////////////////
// PROCESS PRODUCT
//////////////////////////////////////////////////////////

export const processFitments = async (
  req: Request<{ productId: string }>,
  res: Response
) => {
  try {
    const { productId } = req.params;

    const result = await processProductFitments(productId);

    return res.status(200).json(result);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Failed to process fitments",
    });
  }
};

//////////////////////////////////////////////////////////
// SEARCH
//////////////////////////////////////////////////////////

export const searchFitmentProducts = async (
  req: Request,
  res: Response
) => {
  try {
    const input = parseSearchQuery(req.query);

    const result = await searchFitments(input);

    return res.status(200).json(result);
  } catch (error) {
    console.error(error);

    return res.status(400).json({
      message: "Invalid search query",
    });
  }
};