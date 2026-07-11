import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { getDb } from "@library/mongodb/client";
import { buildPagination, parsePagination } from "@library/mongodb/pagination";
import {
  REVIEWS_COLLECTION,
  REVIEW_STATUSES,
  formatReview,
  formatReviewDate,
} from "@library/reviews/model";

const STATIC_REVIEWS_FILE = path.join(
  process.cwd(),
  "src",
  "data",
  "sliders",
  "testimonial.json"
);

async function loadStaticSeed() {
  try {
    const raw = await fs.readFile(STATIC_REVIEWS_FILE, "utf8");
    const parsed = JSON.parse(raw);
    const items = Array.isArray(parsed.items) ? parsed.items : [];
    const now = new Date().toISOString();

    return items.map((item) => {
      const review = {
        id: randomUUID(),
        createdAt: now,
        updatedAt: now,
        title: (item.title || "").toString(),
        text: (item.text || "").toString(),
        name: (item.name || "").toString(),
        email: "",
        rating: Number(item.rating) || 5,
        date: (item.date || formatReviewDate(now)).toString(),
        status: REVIEW_STATUSES.APPROVED,
        source: "seed",
      };

      review.preview =
        review.text.length > 120
          ? `${review.text.slice(0, 120)}…`
          : review.text;

      return review;
    });
  } catch {
    return [];
  }
}

async function ensureReviewsIndexes() {
  const db = await getDb();
  const collection = db.collection(REVIEWS_COLLECTION);

  await collection.createIndex({ id: 1 }, { unique: true });
  await collection.createIndex({ status: 1, createdAt: -1 });
  await collection.createIndex({ createdAt: -1 });
}

async function ensureReviewsSeed() {
  const db = await getDb();
  const collection = db.collection(REVIEWS_COLLECTION);
  const count = await collection.countDocuments();
  return { inserted: 0, total: count };
}

/**
 * Initialise indexes et données de départ (local + production).
 */
export async function initializeReviews() {
  await ensureReviewsIndexes();
  return ensureReviewsSeed();
}

function buildReviewDocument(payload, options = {}) {
  const now = new Date().toISOString();
  const text = (payload.text || "").toString().trim();
  const status =
    options.status ||
    (options.source === "admin"
      ? REVIEW_STATUSES.APPROVED
      : REVIEW_STATUSES.PENDING);

  const review = {
    id: randomUUID(),
    createdAt: now,
    updatedAt: now,
    title: (payload.title || "").toString().trim(),
    text,
    name: (payload.name || "").toString().trim(),
    email: (payload.email || "").toString().trim(),
    rating: Math.min(5, Math.max(1, Number(payload.rating) || 5)),
    date: formatReviewDate(now),
    status,
    source: options.source || "customer",
    preview: text.length > 120 ? `${text.slice(0, 120)}…` : text,
  };

  return review;
}

/**
 * @param {object} payload
 */
export async function createReview(payload) {
  await initializeReviews();

  const review = buildReviewDocument(payload, { source: "customer" });
  const db = await getDb();
  await db.collection(REVIEWS_COLLECTION).insertOne(review);

  return formatReview(review);
}

/**
 * @param {object} payload
 */
export async function createReviewAdmin(payload) {
  await initializeReviews();

  const review = buildReviewDocument(payload, {
    source: "admin",
    status: REVIEW_STATUSES.APPROVED,
  });

  const db = await getDb();
  await db.collection(REVIEWS_COLLECTION).insertOne(review);

  return formatReview(review);
}

/**
 * @param {URLSearchParams} searchParams
 */
export async function listPublishedReviews(searchParams) {
  await initializeReviews();

  const { page, limit } = parsePagination(searchParams);
  const db = await getDb();
  const collection = db.collection(REVIEWS_COLLECTION);
  const filter = { status: REVIEW_STATUSES.APPROVED };

  const total = await collection.countDocuments(filter);
  const pagination = buildPagination(page, limit, total);

  const reviews = await collection
    .find(filter)
    .sort({ createdAt: -1 })
    .skip(pagination.skip)
    .limit(limit)
    .toArray()
    .then((items) => items.map(formatReview));

  return {
    reviews,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      totalPages: pagination.totalPages,
      hasNext: pagination.hasNext,
      hasPrev: pagination.hasPrev,
    },
  };
}

/**
 * @param {URLSearchParams} searchParams
 */
export async function listReviewsAdmin(searchParams) {
  await initializeReviews();

  const { page, limit } = parsePagination(searchParams);
  const status = (searchParams.get("status") || "all").toString().trim();

  const filter = {};
  if (
    status &&
    status !== "all" &&
    Object.values(REVIEW_STATUSES).includes(status)
  ) {
    filter.status = status;
  }

  const db = await getDb();
  const collection = db.collection(REVIEWS_COLLECTION);

  const total = await collection.countDocuments(filter);
  const pagination = buildPagination(page, limit, total);

  const reviews = await collection
    .find(filter)
    .sort({ createdAt: -1 })
    .skip(pagination.skip)
    .limit(limit)
    .toArray()
    .then((items) => items.map(formatReview));

  return {
    reviews,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      totalPages: pagination.totalPages,
      hasNext: pagination.hasNext,
      hasPrev: pagination.hasPrev,
    },
  };
}

/**
 * @param {string} id
 * @param {object} updates
 */
export async function updateReview(id, updates) {
  await initializeReviews();

  const db = await getDb();
  const collection = db.collection(REVIEWS_COLLECTION);

  const existing = await collection.findOne({ id });
  if (!existing) return null;

  const patch = {
    updatedAt: new Date().toISOString(),
  };

  if (updates.status && Object.values(REVIEW_STATUSES).includes(updates.status)) {
    patch.status = updates.status;
  }

  if (updates.title !== undefined) {
    patch.title = (updates.title || "").toString().trim();
  }

  if (updates.text !== undefined) {
    const text = (updates.text || "").toString().trim();
    patch.text = text;
    patch.preview = text.length > 120 ? `${text.slice(0, 120)}…` : text;
  }

  if (updates.name !== undefined) {
    patch.name = (updates.name || "").toString().trim();
  }

  if (updates.rating !== undefined) {
    patch.rating = Math.min(5, Math.max(1, Number(updates.rating) || 5));
  }

  if (updates.email !== undefined) {
    patch.email = (updates.email || "").toString().trim();
  }

  await collection.updateOne({ id }, { $set: patch });

  const updated = await collection.findOne({ id });
  return formatReview(updated);
}

/**
 * @param {string} id
 */
export async function deleteReview(id) {
  await initializeReviews();

  const db = await getDb();
  const result = await db.collection(REVIEWS_COLLECTION).deleteOne({ id });

  return result.deletedCount > 0;
}
