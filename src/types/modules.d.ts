declare module "hpp" {
  import { RequestHandler } from "express";
  const hpp: () => RequestHandler;
  export default hpp;
}

declare module "csurf" {
  import { RequestHandler } from "express";

  interface CookieOptions {
    key?: string;
    path?: string;
    signed?: boolean;
    secure?: boolean;
    maxAge?: number;
    httpOnly?: boolean;
    sameSite?: boolean | "lax" | "strict" | "none";
  }

  interface CsurfOptions {
    cookie?: boolean | CookieOptions;
    value?: (req: any) => string;
    ignoreMethods?: string[];
  }

  const csrf: (options?: CsurfOptions) => RequestHandler;
  export default csrf;
}