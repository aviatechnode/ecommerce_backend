export const getPagination = (
  page: number,
  limit: number
) => ({
  skip: (page - 1) * limit,
  take: limit,
});

export const getPaginationMeta = (
  page: number,
  limit: number,
  total: number
) => ({
  page,
  limit,
  total,
  totalPages: Math.ceil(total / limit),
});