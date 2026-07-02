export const REVIEWS_COLLECTION = "reviews";

export const REVIEW_STATUSES = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
};

/**
 * @param {import("mongodb").Document} doc
 */
export function formatReview(doc) {
  if (!doc) return null;

  const createdAt = doc.createdAt || new Date().toISOString();

  return {
    id: doc.id,
    createdAt,
    updatedAt: doc.updatedAt || createdAt,
    title: doc.title || "",
    text: doc.text || "",
    name: doc.name || "",
    email: doc.email || "",
    rating: Number(doc.rating) || 5,
    date: doc.date || formatReviewDate(createdAt),
    status: doc.status || REVIEW_STATUSES.PENDING,
    source: doc.source || "customer",
    preview:
      doc.preview ||
      (doc.text?.length > 120 ? `${doc.text.slice(0, 120)}…` : doc.text || ""),
  };
}

export function formatReviewDate(iso) {
  try {
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    })
      .format(new Date(iso))
      .replace(/\//g, ".");
  } catch {
    return "";
  }
}
