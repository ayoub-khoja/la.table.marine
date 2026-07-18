import { randomUUID } from "crypto";
import { getDb } from "@library/mongodb/client";
import { buildPagination, parsePagination } from "@library/mongodb/pagination";

const COLLECTION = "products";

export function formatProductPrice(product) {
  const price = (product.price || "0").toString().trim();
  return `${price.replace(".", ",")}€`;
}

function formatProduct(product) {
  return {
    ...product,
    priceFormatted: product.priceFormatted || formatProductPrice(product),
  };
}

export async function listAllProducts() {
  const db = await getDb();
  return db
    .collection(COLLECTION)
    .find({})
    .sort({ sortOrder: 1, createdAt: 1 })
    .toArray()
    .then((items) => items.map(formatProduct));
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

  const lastInCategory = await db
    .collection(COLLECTION)
    .find({ categoryId: category.id })
    .sort({ sortOrder: -1 })
    .limit(1)
    .toArray();
  const sortOrder = (lastInCategory[0]?.sortOrder ?? -1) + 1;

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
    sortOrder,
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
    .sort({ sortOrder: 1, createdAt: 1 })
    .skip(pagination.skip)
    .limit(limit)
    .toArray()
    .then((items) => items.map(formatProduct));

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
 * @param {string} id
 */
export async function deleteProduct(id) {
  const db = await getDb();
  const result = await db.collection(COLLECTION).deleteOne({ id });
  return result.deletedCount > 0;
}

/**
 * Déplace un article dans sa section (catégorie).
 * @param {string} id
 * @param {"up"|"down"} direction
 */
export async function moveProduct(id, direction) {
  const db = await getDb();
  const collection = db.collection(COLLECTION);
  const product = await collection.findOne({ id });

  if (!product) {
    throw new Error("Article introuvable.");
  }

  const siblings = await collection
    .find({ categoryId: product.categoryId })
    .sort({ sortOrder: 1, createdAt: 1 })
    .toArray();

  const index = siblings.findIndex((item) => item.id === id);
  if (index < 0) {
    throw new Error("Article introuvable.");
  }

  const targetIndex = direction === "up" ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= siblings.length) {
    return siblings.map(formatProduct);
  }

  const reordered = [...siblings];
  const [moved] = reordered.splice(index, 1);
  reordered.splice(targetIndex, 0, moved);

  await Promise.all(
    reordered.map((item, sortOrder) =>
      collection.updateOne({ id: item.id }, { $set: { sortOrder } })
    )
  );

  return reordered.map(formatProduct);
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
