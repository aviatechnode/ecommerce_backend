import type { Request, Response, NextFunction } from "express";
import { requestContext } from "../lib/requestContext.js";

export const requestContextMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const userId = (req as any).user?.id ?? undefined;

  const ipAddress =
    typeof req.headers["x-forwarded-for"] === "string"
      ? req.headers["x-forwarded-for"].split(",")[0]
      : req.socket?.remoteAddress ?? null;

  const userAgent = req.headers["user-agent"] ?? null;

  requestContext.run(
    {
      userId,
      ipAddress,
      userAgent,
    },
    next
  );
};