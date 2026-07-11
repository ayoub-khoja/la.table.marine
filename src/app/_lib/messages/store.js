import { randomUUID } from "crypto";
import { getDb } from "@library/mongodb/client";
import { buildPagination, parsePagination } from "@library/mongodb/pagination";

const COLLECTION = "messages";

let indexesReady = false;

async function ensureIndexes(db) {
  if (indexesReady) return;
  const collection = db.collection(COLLECTION);

  await Promise.all([
    collection.createIndex({ createdAt: -1 }),
    collection.createIndex({ email: 1, createdAt: -1 }),
    collection.createIndex({ status: 1, createdAt: -1 }),
  ]);

  indexesReady = true;
}

/**
 * @param {object} payload
 */
export async function createMessage(payload) {
  const messageText = (payload.message || "").toString();

  const message = {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    first_name: payload.first_name,
    last_name: payload.last_name,
    fullName: payload.fullName,
    email: payload.email,
    phone: payload.phone || "",
    message: messageText,
    preview:
      messageText.length > 120 ? `${messageText.slice(0, 120)}…` : messageText,
    status: "new",
    readAt: null,
    archivedAt: null,
  };

  const db = await getDb();
  await ensureIndexes(db);
  await db.collection(COLLECTION).insertOne(message);

  return message;
}

/**
 * @param {URLSearchParams} searchParams
 */
export async function listMessages(searchParams) {
  const { page, limit } = parsePagination(searchParams);
  const db = await getDb();
  const collection = db.collection(COLLECTION);

  const total = await collection.countDocuments();
  const pagination = buildPagination(page, limit, total);

  const messages = await collection
    .find({})
    .sort({ createdAt: -1 })
    .skip(pagination.skip)
    .limit(limit)
    .toArray();

  return {
    messages,
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
