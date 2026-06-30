import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { formatMoney, normalizeItems, paymentLabel } from "@library/email/order";

const DATA_DIR = path.join(process.cwd(), "data");
const ORDERS_FILE = path.join(DATA_DIR, "orders.json");

async function ensureStore() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(ORDERS_FILE);
  } catch {
    await fs.writeFile(ORDERS_FILE, "[]", "utf8");
  }
}

async function readAllOrders() {
  await ensureStore();
  const raw = await fs.readFile(ORDERS_FILE, "utf8");
  const parsed = JSON.parse(raw);
  return Array.isArray(parsed) ? parsed : [];
}

async function writeAllOrders(orders) {
  await ensureStore();
  const tmp = `${ORDERS_FILE}.${process.pid}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(orders, null, 2), "utf8");
  await fs.rename(tmp, ORDERS_FILE);
}

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

  const orders = await readAllOrders();
  orders.unshift(order);
  await writeAllOrders(orders);

  return order;
}

function parsePagination(searchParams) {
  const page = Math.max(1, Number.parseInt(searchParams.get("page") || "1", 10) || 1);
  const limit = Math.min(
    50,
    Math.max(1, Number.parseInt(searchParams.get("limit") || "10", 10) || 10)
  );
  return { page, limit };
}

/**
 * @param {URLSearchParams} searchParams
 */
export async function listOrders(searchParams) {
  const { page, limit } = parsePagination(searchParams);
  const all = await readAllOrders();
  const sorted = [...all].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * limit;
  const orders = sorted.slice(start, start + limit);

  return {
    orders,
    pagination: {
      page: safePage,
      limit,
      total,
      totalPages,
      hasNext: safePage < totalPages,
      hasPrev: safePage > 1,
    },
  };
}
