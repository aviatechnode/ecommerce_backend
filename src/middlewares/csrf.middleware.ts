import crypto from "crypto";
import type { RequestHandler } from "express";


// Middleware to generate CSRF token
export const csrfMiddleware: RequestHandler = (req, res, next) => {
  if (!req.cookies?.csrfToken) {
    const token = crypto.randomBytes(32).toString("hex");
    res.cookie("csrfToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 3600_000, // 1 hour
    });
    req.headers["x-csrf-token"] = token;
  }
  next();
};
