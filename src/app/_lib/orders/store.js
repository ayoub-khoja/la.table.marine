import { randomUUID } from "crypto";
import { formatMoney, normalizeItems, paymentLabel } from "@library/email/order";
import { getDb } from "@library/mongodb/client";
import { buildPagination, parsePagination } from "@library/mongodb/pagination";

const COLLECTION = "orders";

function computeTotal(items) {
  return items.reduce((sum, it) => sum + it.price * it.quantity, 0);
}

function escapeRegex(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getOrderPeriodRange(period) {
  if (!period || period === "all") {
    return null;
  }

  const now = new Date();

  if (period === "today") {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);
    return { from: start, to: end };
  }

  if (period === "week") {
    const current = new Date(now);
    const weekday = current.getDay();
    const diffToMonday = weekday === 0 ? -6 : 1 - weekday;
    const monday = new Date(current);
    monday.setDate(current.getDate() + diffToMonday);
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    return { from: monday, to: sunday };
  }

  if (period === "month") {
    const first = new Date(now.getFullYear(), now.getMonth(), 1);
    first.setHours(0, 0, 0, 0);
    const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    last.setHours(23, 59, 59, 999);
    return { from: first, to: last };
  }

  return null;
}

function buildOrderFilter(searchParams) {
  const filter = {};

  const type = (searchParams.get("type") || "all").trim();
  if (type === "delivery") {
    filter.state = "Livraison";
  } else if (type === "takeaway") {
    filter.state = "À emporter";
  }

  const payment = (searchParams.get("payment") || "all").trim();
  if (payment && payment !== "all") {
    filter.payment_method = payment;
  }

  const period = (searchParams.get("period") || "all").trim();
  const periodRange = getOrderPeriodRange(period);
  if (periodRange) {
    filter.createdAt = {};
    if (periodRange.from) {
      filter.createdAt.$gte = periodRange.from.toISOString();
    }
    if (periodRange.to) {
      filter.createdAt.$lte = periodRange.to.toISOString();
    }
  }

  const q = (searchParams.get("q") || "").trim();
  if (q) {
    const re = new RegExp(escapeRegex(q), "i");
    filter.$or = [
      { fullName: re },
      { email: re },
      { tel: re },
      { address: re },
      { city: re },
      { postcode: re },
      { message: re },
      { id: re },
      { "items.title": re },
    ];
  }

  return filter;
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
  const filter = buildOrderFilter(searchParams);
  const db = await getDb();
  const collection = db.collection(COLLECTION);

  const total = await collection.countDocuments(filter);
  const pagination = buildPagination(page, limit, total);

  const orders = await collection
    .find(filter)
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
