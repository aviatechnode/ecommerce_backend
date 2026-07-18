import type { Request } from "express";
import type { AuthUser } from "../../types/auth.types.js";

declare module "express-serve-static-core" {
  interface Request {
    user?: AuthUser;
    idempotencyKey?: string;
  }
}

export type TypedRequest<
  TParams = {},
  TBody = {},
  TQuery = {},
> = Request<TParams, any, TBody, TQuery>;

export {};