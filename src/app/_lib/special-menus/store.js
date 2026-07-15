import { randomUUID } from "crypto";
import { getDb } from "@library/mongodb/client";
import { buildPagination, parsePagination } from "@library/mongodb/pagination";

const COLLECTION = "special_menus";

export function slugifySpecialMenuName(name) {
  return name
    .toString()
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function formatSpecialMenuPrice(price) {
  const value = Number(price);
  if (!Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

export function normalizeCourses(rawCourses) {
  if (!Array.isArray(rawCourses)) return [];

  return rawCourses
    .map((course) => ({
      title: (course?.title || "").toString().trim(),
      items: Array.isArray(course?.items)
        ? course.items.map((item) => item.toString().trim()).filter(Boolean)
        : [],
    }))
    .filter((course) => course.title && course.items.length);
}

export function normalizeAccompaniments(rawAccompaniments) {
  if (!Array.isArray(rawAccompaniments)) return [];
  return rawAccompaniments.map((item) => item.toString().trim()).filter(Boolean);
}

function formatMenuDocument(menu) {
  return {
    ...menu,
    priceFormatted: menu.priceFormatted || formatSpecialMenuPrice(menu.price),
    courses: normalizeCourses(menu.courses),
    accompaniments: normalizeAccompaniments(menu.accompaniments),
  };
}

/**
 * @param {object} payload
 */
export async function createSpecialMenu(payload) {
  const name = (payload.name || "").toString().trim();
  const price = Number(payload.price);
  const image = (payload.image || "").toString().trim();
  const subtitle = (payload.subtitle || "").toString().trim();
  const courses = normalizeCourses(payload.courses);
  const accompaniments = normalizeAccompaniments(payload.accompaniments);

  if (!name) {
    throw new Error("Le nom du menu est obligatoire.");
  }

  if (!Number.isFinite(price) || price <= 0) {
    throw new Error("Le prix du menu est obligatoire.");
  }

  if (!courses.length) {
    throw new Error("Ajoutez au moins une étape au menu.");
  }

  const slug = slugifySpecialMenuName(name);
  const db = await getDb();
  const collection = db.collection(COLLECTION);

  const existing = await collection.findOne({ slug });
  if (existing) {
    throw new Error("Un menu avec ce nom existe déjà.");
  }

  const menu = formatMenuDocument({
    id: randomUUID(),
    slug,
    createdAt: new Date().toISOString(),
    name,
    price,
    image,
    subtitle,
    courses,
    accompaniments,
  });

  await collection.insertOne(menu);

  return menu;
}

/**
 * @param {URLSearchParams} searchParams
 */
export async function listSpecialMenus(searchParams) {
  const { page, limit } = parsePagination(searchParams);
  const db = await getDb();
  const collection = db.collection(COLLECTION);

  const total = await collection.countDocuments();
  const pagination = buildPagination(page, limit, total);

  const menus = await collection
    .find({})
    .sort({ createdAt: -1 })
    .skip(pagination.skip)
    .limit(limit)
    .toArray()
    .then((items) => items.map(formatMenuDocument));

  return {
    menus,
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

export async function listPublishedSpecialMenus() {
  const db = await getDb();
  const menus = await db
    .collection(COLLECTION)
    .find({})
    .sort({ createdAt: -1 })
    .toArray()
    .then((items) => items.map(formatMenuDocument));

  return menus;
}

/**
 * @param {string} id
 * @param {object} updates
 */
export async function updateSpecialMenu(id, updates) {
  const db = await getDb();
  const collection = db.collection(COLLECTION);
  const existing = await collection.findOne({ id });

  if (!existing) return null;

  const patch = {};

  if (updates.name !== undefined) {
    const name = (updates.name || "").toString().trim();
    if (!name) {
      throw new Error("Le nom du menu est obligatoire.");
    }
    patch.name = name;
    patch.slug = slugifySpecialMenuName(name);
  }

  if (updates.price !== undefined) {
    const price = Number(updates.price);
    if (!Number.isFinite(price) || price <= 0) {
      throw new Error("Le prix du menu est obligatoire.");
    }
    patch.price = price;
    patch.priceFormatted = formatSpecialMenuPrice(price);
  }

  if (updates.image !== undefined) {
    patch.image = (updates.image || "").toString().trim();
  }

  if (updates.subtitle !== undefined) {
    patch.subtitle = (updates.subtitle || "").toString().trim();
  }

  if (updates.courses !== undefined) {
    const courses = normalizeCourses(updates.courses);
    if (!courses.length) {
      throw new Error("Ajoutez au moins une étape au menu.");
    }
    patch.courses = courses;
  }

  if (updates.accompaniments !== undefined) {
    patch.accompaniments = normalizeAccompaniments(updates.accompaniments);
  }

  if (patch.slug) {
    const duplicate = await collection.findOne({
      slug: patch.slug,
      id: { $ne: id },
    });
    if (duplicate) {
      throw new Error("Un menu avec ce nom existe déjà.");
    }
  }

  if (!Object.keys(patch).length) {
    return formatMenuDocument(existing);
  }

  await collection.updateOne({ id }, { $set: patch });

  const updated = await collection.findOne({ id });
  return formatMenuDocument(updated);
}

/**
 * @param {string} id
 */
export async function deleteSpecialMenu(id) {
  const db = await getDb();
  const result = await db.collection(COLLECTION).deleteOne({ id });

  return result.deletedCount > 0;
}
