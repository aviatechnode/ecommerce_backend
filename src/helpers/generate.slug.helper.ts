export const generateSlug = (text: string) => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "") // remove special chars
    .replace(/\s+/g, "-") // spaces -> dash
    .replace(/-+/g, "-"); // remove duplicate dashes
};

// ensure uniqueness
export const generateUniqueSlug = async (
  baseSlug: string,
  model: any
) => {
  let slug = baseSlug;
  let count = 1;

  while (true) {
    const existing = await model.findUnique({
      where: { slug },
    });

    if (!existing) return slug;

    slug = `${baseSlug}-${count}`;
    count++;
  }
};