export function normalizePhone(phone: string) {
  const cleaned = phone.replace(/\s+/g, "");

  if (cleaned.startsWith("+234")) return cleaned;
  if (cleaned.startsWith("234")) return "+" + cleaned;
  if (cleaned.startsWith("0")) return "+234" + cleaned.slice(1);

  throw new Error("Invalid Nigerian phone number");
}