import { AuthUser } from './../../types/auth.types';
declare module "express-serve-static-core" {
  interface Request {
    user?: AuthUser;
    idempotencyKey?: string;
  }
}

export {};