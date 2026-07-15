import { randomUUID } from "crypto";
import { getDb } from "@library/mongodb/client";
import { buildPagination, parsePagination } from "@library/mongodb/pagination";
import {
  countProductsByCategory,
  deleteProductsByCategory,
} from "@library/products/store";

const COLLECTION = "product_categories";

export function slugifyCategoryName(name) {
  return name
    .toString()
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeAccompaniments(rawAccompaniments) {
  if (!Array.isArray(rawAccompaniments)) return [];
  return rawAccompaniments.map((item) => item.toString().trim()).filter(Boolean);
}

/**
 * @param {object} payload
 */
export async function createCategory(payload) {
  const name = (payload.name || "").toString().trim();
  const slugInput = (payload.slug || "").toString().trim();
  const slug = slugInput || slugifyCategoryName(name);
  const description = (payload.description || "").toString().trim();
  const image = (payload.image || "").toString().trim();
  const accompaniments = normalizeAccompaniments(payload.accompaniments);

  if (!name) {
    throw new Error("Le nom de la catégorie est obligatoire.");
  }

  const db = await getDb();
  const collection = db.collection(COLLECTION);

  const existing = await collection.findOne({ slug });
  if (existing) {
    throw new Error("Une catégorie avec ce slug existe déjà.");
  }

  const category = {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    name,
    slug,
    description,
    image,
    accompaniments,
  };

  await collection.insertOne(category);

  return category;
}

export async function listAllCategories() {
  const db = await getDb();
  return db.collection(COLLECTION).find({}).sort({ name: 1 }).toArray();
}

/**
 * @param {URLSearchParams} searchParams
 */
export async function listCategories(searchParams) {
  const { page, limit } = parsePagination(searchParams);
  const db = await getDb();
  const collection = db.collection(COLLECTION);

  const total = await collection.countDocuments();
  const pagination = buildPagination(page, limit, total);

  const categories = await collection
    .find({})
    .sort({ name: 1 })
    .skip(pagination.skip)
    .limit(limit)
    .toArray();

  const categoriesWithCounts = await Promise.all(
    categories.map(async (category) => ({
      ...category,
      productCount: await countProductsByCategory(category),
    }))
  );

  return {
    categories: categoriesWithCounts,
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
export async function updateCategory(id, updates) {
  const db = await getDb();
  const collection = db.collection(COLLECTION);

  const existing = await collection.findOne({ id });
  if (!existing) return null;

  const patch = {};

  if (updates.name !== undefined) {
    const name = (updates.name || "").toString().trim();
    if (!name) {
      throw new Error("Le nom de la catégorie est obligatoire.");
    }
    patch.name = name;
  }

  if (updates.slug !== undefined) {
    const slugInput = (updates.slug || "").toString().trim();
    patch.slug = slugInput || slugifyCategoryName(patch.name || existing.name);
  } else if (updates.name !== undefined && !existing.slug) {
    patch.slug = slugifyCategoryName(patch.name);
  }

  if (updates.description !== undefined) {
    patch.description = (updates.description || "").toString().trim();
  }

  if (patch.slug) {
    const duplicate = await collection.findOne({
      slug: patch.slug,
      id: { $ne: id },
    });
    if (duplicate) {
      throw new Error("Une catégorie avec ce slug existe déjà.");
    }
  }

  if (!Object.keys(patch).length) {
    return existing;
  }

  await collection.updateOne({ id }, { $set: patch });

  return collection.findOne({ id });
}

/**
 * @param {string} id
 */
export async function getCategoryById(id) {
  const db = await getDb();
  return db.collection(COLLECTION).findOne({ id });
}

/**
 * @param {string} id
 */
export async function deleteCategory(id) {
  const db = await getDb();
  const collection = db.collection(COLLECTION);
  const category = await collection.findOne({ id });

  if (!category) {
    return { deleted: false, deletedProducts: 0 };
  }

  const deletedProducts = await deleteProductsByCategory(category);
  const result = await collection.deleteOne({ id });

  return {
    deleted: result.deletedCount > 0,
    deletedProducts,
  };
}

/**
 * @param {string} id
 */
export async function getCategoryProductCount(id) {
  const category = await getCategoryById(id);
  if (!category) return 0;

  return countProductsByCategory(category);
}
