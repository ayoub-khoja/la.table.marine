import { randomUUID } from "crypto";
import { getDb } from "@library/mongodb/client";
import { buildPagination, parsePagination } from "@library/mongodb/pagination";

const COLLECTION = "products";

export function formatProductPrice(product) {
  const price = (product.price || "0").toString().trim();
  return `${price.replace(".", ",")}€`;
}

export async function listAllProducts() {
  const db = await getDb();
  return db
    .collection(COLLECTION)
    .find({})
    .sort({ createdAt: -1 })
    .toArray()
    .then((items) =>
      items.map((product) => ({
        ...product,
        priceFormatted: product.priceFormatted || formatProductPrice(product),
      }))
    );
}

/**
 * @param {object} payload
 */
export async function createProduct(payload) {
  const title = (payload.title || "").toString().trim();
  const price = (payload.price || "").toString().trim();
  const image = (payload.image || "").toString().trim();
  const old_price = (payload.old_price || "").toString().trim();
  const short = (payload.short || "").toString().trim();
  const categoryId = (payload.categoryId || "").toString().trim();

  if (!title || !price) {
    throw new Error("Le titre et le prix sont obligatoires.");
  }

  if (!categoryId) {
    throw new Error("La catégorie est obligatoire.");
  }

  const db = await getDb();
  const category = await db.collection("product_categories").findOne({ id: categoryId });

  if (!category) {
    throw new Error("Catégorie introuvable.");
  }

  const product = {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    image,
    title,
    old_price,
    price,
    currency: "€",
    short,
    categoryId: category.id,
    categorySlug: category.slug,
    priceFormatted: formatProductPrice({
      currency: "€",
      price,
    }),
  };

  await db.collection(COLLECTION).insertOne(product);

  return product;
}

/**
 * @param {URLSearchParams} searchParams
 */
export async function listProducts(searchParams) {
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

/**
 * @param {{ id: string, slug?: string }} category
 */
export async function deleteProductsByCategory(category) {
  const db = await getDb();
  const filters = [{ categoryId: category.id }];

  if (category.slug) {
    filters.push({ categorySlug: category.slug });
  }

  const result = await db.collection(COLLECTION).deleteMany({ $or: filters });

  return result.deletedCount;
}

/**
 * @param {{ id: string, slug?: string }} category
 */
export async function countProductsByCategory(category) {
  const db = await getDb();
  const filters = [{ categoryId: category.id }];

  if (category.slug) {
    filters.push({ categorySlug: category.slug });
  }

  return db.collection(COLLECTION).countDocuments({ $or: filters });
}
