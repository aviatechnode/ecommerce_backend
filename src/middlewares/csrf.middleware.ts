import type {
  Request,
  Response,
  NextFunction,
} from "express";

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

  if (!unsafeMethods.includes(req.method)) {
    return next();
  }

  const headerToken = req.headers["x-csrf-token"] as string | undefined;
  if (!headerToken) {
    res.status(403).json({
      message: "Missing CSRF token",
    });
    return;
  }
  const isValidFormat =
    typeof headerToken === "string" &&
    headerToken.length >= 32;

  if (!isValidFormat) {
    res.status(403).json({
      message: "Invalid CSRF token format",
    });
    return;
  }
  return next();
};