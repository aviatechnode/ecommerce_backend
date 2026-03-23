import type { Request } from "express";

export const getRequestInfo = (req: Request) => {
  const forwarded = req.headers["x-forwarded-for"];

  const ipAddress =
    typeof forwarded === "string"
      ? forwarded.split(",")[0]
      : req.socket?.remoteAddress || null;

  const userAgent = req.headers["user-agent"] || null;

  return {
    ipAddress,
    userAgent,
  };
};