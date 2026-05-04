const clean = (value?: string | null) => {
  if (!value) return null;

  const trimmed = value.trim().replace(/\s+/g, " ");
  if (!trimmed) return null;

  return trimmed;
};

// Capitalize each word: "lekki phase 1" → "Lekki Phase 1"
const toTitleCase = (value: string) => {
  return value
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

// Optional: normalize state (if enum already, this is safe)
const formatState = (state: string) => {
  return toTitleCase(state);
};

export const formatAddress = (input: {
  street: string;
  area?: string | null;
  landmark?: string | null;
  city: string;
  lga: string;
  state: string;
}) => {
  const parts = [
    clean(input.street),
    clean(input.area),
    clean(input.landmark),
    clean(input.city),
    clean(input.lga),
    formatState(input.state),
  ]
    .filter(Boolean)
    .map((part) => toTitleCase(part as string));

  return parts.join(", ");
};