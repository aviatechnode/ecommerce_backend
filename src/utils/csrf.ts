import crypto from "crypto";

export const generateCsrfToken =
  (): string => {
    return crypto
      .randomBytes(32)
      .toString("hex");
  };

export const hashCsrfToken = (
  token: string
): string => {
  return crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
};

export const createCsrfPair = () => {
  const rawToken =
    generateCsrfToken();

  const hashedToken =
    hashCsrfToken(rawToken);

  return {
    rawToken,
    hashedToken,
  };
};

export const isValidCsrf = (
  incomingToken: string,
  currentHash: string
): boolean => {
  const incomingHash =
    hashCsrfToken(incomingToken);

  return incomingHash === currentHash;
};