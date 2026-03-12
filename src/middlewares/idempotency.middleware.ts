import type { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prismadb.js";


export const idempotencyMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const key = req.headers["idempotency-key"] as string;

  if (!key) {
    return res.status(400).json({
      message: "Missing Idempotency-Key header",
    });
  }

  const existing = await prisma.idempotencyKey.findUnique({
    where: { key },
  });

  if (existing?.response) {
    return res.status(200).json(existing.response);
  }

  (req as any).idempotencyKey = key;

  next();
};