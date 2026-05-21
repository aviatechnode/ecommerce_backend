import type {
  Request,
  Response,
  NextFunction,
} from "express";

import { prisma } from "../lib/prismadb.js";

import {
  isValidCsrf,
} from "../utils/csrf.js";

export const csrfMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const unsafeMethods = [
    "POST",
    "PUT",
    "PATCH",
    "DELETE",
  ];

  if (
    !unsafeMethods.includes(req.method)
  ) {
    return next();
  }

  const headerToken =
    req.headers[
      "x-csrf-token"
    ] as string | undefined;

  const refreshToken =
    req.cookies?.refreshToken as
      | string
      | undefined;

  if (!headerToken) {
    res.status(403).json({
      message: "Missing CSRF token",
    });

    return;
  }

  if (!refreshToken) {
    res.status(403).json({
      message: "No session",
    });

    return;
  }

  const session =
    await prisma.refreshToken.findUnique({
      where: {
        token: refreshToken,
      },
    });

  if (!session) {
    res.status(403).json({
      message: "Invalid session",
    });

    return;
  }

  const valid = isValidCsrf(
    headerToken,
    session.csrfHash
  );

  if (!valid) {
    res.status(403).json({
      message: "Invalid CSRF token",
    });

    return;
  }

  next();
};