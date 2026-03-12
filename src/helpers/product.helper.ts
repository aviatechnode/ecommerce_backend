export const generateSlug = (name: string) =>
  name.toLowerCase().replace(/\s+/g, "-") + "-" + Date.now();
