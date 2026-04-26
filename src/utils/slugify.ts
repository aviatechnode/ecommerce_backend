export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\\s-]/g, "") // remove special chars
    .replace(/\\s+/g, "-")         // spaces → hyphen
    .replace(/-+/g, "-");         // collapse multiple -
}