import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";

const DATA_DIR = path.join(process.cwd(), "data");
const PRODUCTS_FILE = path.join(DATA_DIR, "products.json");
const STATIC_PRODUCTS_FILE = path.join(process.cwd(), "src", "data", "products.json");

async function loadStaticSeed() {
  try {
    const raw = await fs.readFile(STATIC_PRODUCTS_FILE, "utf8");
    const parsed = JSON.parse(raw);
    const items = Array.isArray(parsed.items) ? parsed.items : [];
    const now = new Date().toISOString();

    return items.map((item) => ({
      id: randomUUID(),
      createdAt: now,
      image: (item.image || "").toString(),
      title: (item.title || "").toString(),
      old_price: (item.old_price || "").toString(),
      price: (item.price || "").toString(),
      currency: (item.currency || "$").toString(),
      short: (item.short || "").toString(),
    }));
  } catch {
    return [];
  }
}

async function ensureStore() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(PRODUCTS_FILE);
  } catch {
    const seed = await loadStaticSeed();
    await fs.writeFile(PRODUCTS_FILE, JSON.stringify(seed, null, 2), "utf8");
  }
}

async function readAllProducts() {
  await ensureStore();
  const raw = await fs.readFile(PRODUCTS_FILE, "utf8");
  const parsed = JSON.parse(raw);
  return Array.isArray(parsed) ? parsed : [];
}

async function writeAllProducts(products) {
  await ensureStore();
  const tmp = `${PRODUCTS_FILE}.${process.pid}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(products, null, 2), "utf8");
  await fs.rename(tmp, PRODUCTS_FILE);
}

function parsePagination(searchParams) {
  const page = Math.max(1, Number.parseInt(searchParams.get("page") || "1", 10) || 1);
  const limit = Math.min(
    50,
    Math.max(1, Number.parseInt(searchParams.get("limit") || "10", 10) || 10)
  );
  return { page, limit };
}

export function formatProductPrice(product) {
  const currency = product.currency || "$";
  const price = product.price || "0";
  return `${currency}${price}`;
}

/**
 * @param {object} payload
 */
export async function createProduct(payload) {
  const product = {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    image: (payload.image || "").toString().trim(),
    title: (payload.title || "").toString().trim(),
    old_price: (payload.old_price || "").toString().trim(),
    price: (payload.price || "").toString().trim(),
    currency: (payload.currency || "$").toString().trim(),
    short: (payload.short || "").toString().trim(),
    priceFormatted: formatProductPrice({
      currency: payload.currency || "$",
      price: payload.price,
    }),
  };

  const all = await readAllProducts();
  all.unshift(product);
  await writeAllProducts(all);

  return product;
}

/**
 * @param {URLSearchParams} searchParams
 */
export async function listProducts(searchParams) {
  const { page, limit } = parsePagination(searchParams);
  const all = await readAllProducts();
  const sorted = [...all].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * limit;

  const products = sorted.slice(start, start + limit).map((product) => ({
    ...product,
    priceFormatted: product.priceFormatted || formatProductPrice(product),
  }));

  return {
    products,
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
