import crypto from "crypto";

export const generateCsrfToken = (): string => {
  return crypto.randomBytes(32).toString("hex");
};

export const hashCsrfToken = (token: string): string => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

/**
 * Create CSRF token for a session
 * (used during login / refresh)
 */
export const createCsrfPair = () => {
  const raw = generateCsrfToken();
  const hash = hashCsrfToken(raw);

  return {
    rawToken: raw,
    hashedToken: hash,
  };
};

/**
 * Validate CSRF token with support for rotation window
 */
export const isValidCsrf = (
  incomingToken: string,
  currentHash: string,
  prevHash?: string | null
): boolean => {
  const incomingHash = hashCsrfToken(incomingToken);

  const matchesCurrent = incomingHash === currentHash;
  const matchesPrevious =
    typeof prevHash === "string" && incomingHash === prevHash;

  return matchesCurrent || matchesPrevious;
};