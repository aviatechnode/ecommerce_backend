import type { Request } from "express";

export function getParam(
  req: Request,
  key: string
): string {
  const value = req.params[key];

  if (!value || Array.isArray(value)) {
    throw new Error(`Invalid param: ${key}`);
  }

  return value;
}