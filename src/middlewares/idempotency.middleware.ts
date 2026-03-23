import type { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prismadb.js";

export const idempotencyMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  /* =========================================================
     ✅ SKIP ROUTES THAT SHOULD NOT USE IDEMPOTENCY
  ========================================================= */
  const skipPaths = [
    "/api/auth/google",
    "/api/auth/google/callback",
  ];

  if (
    req.method === "GET" || // ✅ never apply to GET
    skipPaths.some((path) => req.path.startsWith(path))
  ) {
    return next();
  }

  /* =========================================================
     REQUIRE IDEMPOTENCY KEY
  ========================================================= */
  const key = req.headers["idempotency-key"] as string;

  if (!key) {
    return res.status(400).json({
      message: "Missing Idempotency-Key header",
    });
  }

  /* =========================================================
     CHECK EXISTING REQUEST
  ========================================================= */
  const existing = await prisma.idempotencyKey.findUnique({
    where: { key },
  });

  if (existing?.response) {
    return res.status(200).json(existing.response);
  }

  /* =========================================================
     ATTACH KEY TO REQUEST
  ========================================================= */
  (req as any).idempotencyKey = key;

  next();
};