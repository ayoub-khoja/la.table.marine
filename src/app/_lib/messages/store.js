import { randomUUID } from "crypto";
import { getDb } from "@library/mongodb/client";
import { buildPagination, parsePagination } from "@library/mongodb/pagination";

const COLLECTION = "messages";

/**
 * @param {object} payload
 */
export async function createMessage(payload) {
  const message = {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    first_name: payload.first_name,
    last_name: payload.last_name,
    fullName: payload.fullName,
    email: payload.email,
    phone: payload.phone || "",
    message: payload.message,
    preview:
      payload.message.length > 120
        ? `${payload.message.slice(0, 120)}…`
        : payload.message,
  };

  const db = await getDb();
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
