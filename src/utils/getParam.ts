import type { Request } from "express";

export function getParam(req: Request, key: string): string {
  const value = req.params[key];

  if (typeof value === "string") return value;

  throw new Error(`Invalid or missing param: ${key}`);
}