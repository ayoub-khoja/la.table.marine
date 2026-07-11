import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { getDb } from "@library/mongodb/client";
import { buildPagination, parsePagination } from "@library/mongodb/pagination";

const COLLECTION = "products";
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
      priceFormatted: formatProductPrice({
        currency: item.currency || "$",
        price: item.price,
      }),
    }));
  } catch {
    return [];
  }
}

async function ensureProductsSeed() {
  const db = await getDb();
  const collection = db.collection(COLLECTION);
  const count = await collection.countDocuments();

  if (count > 0) return;

  const seed = await loadStaticSeed();
  if (seed.length) {
    await collection.insertMany(seed);
  }
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
  await ensureProductsSeed();

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

  const db = await getDb();
  await db.collection(COLLECTION).insertOne(product);

  return product;
}

/**
 * @param {URLSearchParams} searchParams
 */
export async function listProducts(searchParams) {
  await ensureProductsSeed();

  const { page, limit } = parsePagination(searchParams);
  const db = await getDb();
  const collection = db.collection(COLLECTION);

  const total = await collection.countDocuments();
  const pagination = buildPagination(page, limit, total);

  const products = await collection
    .find({})
    .sort({ createdAt: -1 })
    .skip(pagination.skip)
    .limit(limit)
    .toArray()
    .then((items) =>
      items.map((product) => ({
        ...product,
        priceFormatted: product.priceFormatted || formatProductPrice(product),
      }))
    );

  return {
    products,
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
