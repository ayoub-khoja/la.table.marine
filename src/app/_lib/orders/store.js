import { randomUUID } from "crypto";
import { formatMoney, normalizeItems, paymentLabel } from "@library/email/order";
import { getDb } from "@library/mongodb/client";
import { buildPagination, parsePagination } from "@library/mongodb/pagination";

const COLLECTION = "orders";

function computeTotal(items) {
  return items.reduce((sum, it) => sum + it.price * it.quantity, 0);
}

/**
 * @param {object} payload — champs formulaire checkout
 */
export async function createOrder(payload) {
  const items = normalizeItems(payload.items);
  const currency = items[0]?.currency || "$";
  const total = computeTotal(items);

  const order = {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    firstname: payload.firstname,
    lastname: payload.lastname,
    fullName: payload.fullName,
    email: payload.email,
    tel: payload.tel,
    address: payload.address,
    city: payload.city,
    state: payload.state || "",
    postcode: payload.postcode || "",
    message: payload.message || "",
    payment_method: payload.payment_method || "",
    paymentLabel: paymentLabel(payload.payment_method),
    items,
    total,
    currency,
    totalFormatted: formatMoney(total, currency),
  };

  const db = await getDb();
  await db.collection(COLLECTION).insertOne(order);

  return order;
}

/**
 * @param {URLSearchParams} searchParams
 */
export async function listOrders(searchParams) {
  const { page, limit } = parsePagination(searchParams);
  const db = await getDb();
  const collection = db.collection(COLLECTION);

  const total = await collection.countDocuments();
  const pagination = buildPagination(page, limit, total);

  const orders = await collection
    .find({})
    .sort({ createdAt: -1 })
    .skip(pagination.skip)
    .limit(limit)
    .toArray();

  return {
    orders,
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
