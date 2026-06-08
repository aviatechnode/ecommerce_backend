import crypto from "crypto";

export const generateCsrfToken = (): string => {
  return crypto.randomBytes(32).toString("hex");
};

export const hashCsrfToken = (token: string): string => {
  return crypto.createHash("sha256").update(token).digest("hex");
};