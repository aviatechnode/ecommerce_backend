import type { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prismadb.js";
import {
  generateCsrfToken,
  hashCsrfToken,
  isValidCsrf,
} from "../utils/csrf.js";

export const csrfMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const unsafeMethods = ["POST", "PUT", "PATCH", "DELETE"];

  if (!unsafeMethods.includes(req.method)) {
    return next();
  }

  const headerToken = req.headers["x-csrf-token"] as string | undefined;
  const refreshToken = req.cookies?.refreshToken as string | undefined;

  if (!headerToken) {
    res.status(403).json({ message: "Missing CSRF token" });
    return;
  }

  if (!refreshToken) {
    res.status(403).json({ message: "No session" });
    return;
  }

  // 🔐 Find session
  const session = await prisma.refreshToken.findUnique({
    where: { token: refreshToken },
  });

  if (!session) {
    res.status(403).json({ message: "Invalid session" });
    return;
  }

  // ✅ Validate CSRF (with previous token support)
  const valid = isValidCsrf(
    headerToken,
    session.csrfHash,
    session.csrfPrevHash
  );

  if (!valid) {
    res.status(403).json({ message: "Invalid CSRF token" });
    return;
  }

  // 🔁 ROTATE TOKEN
  const newRaw = generateCsrfToken();
  const newHash = hashCsrfToken(newRaw);

  await prisma.refreshToken.update({
    where: { token: refreshToken },
    data: {
      csrfPrevHash: session.csrfHash, // keep last valid token
      csrfHash: newHash,
    },
  });

  // send new token back to frontend
  res.setHeader("x-csrf-token", newRaw);

  next();
};