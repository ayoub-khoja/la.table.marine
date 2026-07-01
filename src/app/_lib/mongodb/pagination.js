export function parsePagination(searchParams) {
  const page = Math.max(
    1,
    Number.parseInt(searchParams.get("page") || "1", 10) || 1
  );
  const limit = Math.min(
    50,
    Math.max(1, Number.parseInt(searchParams.get("limit") || "10", 10) || 10)
  );

  return { page, limit };
}

export function buildPagination(page, limit, total) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(page, totalPages);
  const skip = (safePage - 1) * limit;

  return {
    page: safePage,
    limit,
    total,
    totalPages,
    hasNext: safePage < totalPages,
    hasPrev: safePage > 1,
    skip,
  };
}
