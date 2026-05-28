import crypto from "crypto";

export function verifyPaystackSignature(
  body: string,
  signature: string
) {
  const hash = crypto
    .createHmac(
      "sha512",
      process.env.PAYSTACK_SECRET!
    )
    .update(body)
    .digest("hex");

  return hash === signature;
}