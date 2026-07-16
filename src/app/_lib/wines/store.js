import { randomUUID } from "crypto";
import { getDb } from "@library/mongodb/client";
import { buildPagination, parsePagination } from "@library/mongodb/pagination";
import { WINE_SECTIONS } from "@library/wines/constants";

const COLLECTION = "wines";

export { WINE_SECTIONS };
export function formatWinePrice(price) {
  const raw = (price || "0").toString().trim();
  return `${raw.replace(".", ",")}€`;
}

function formatWineDocument(wine) {
  return {
    ...wine,
    priceFormatted: wine.priceFormatted || formatWinePrice(wine.price),
  };
}

/**
 * @param {object} payload
 */
export async function createWine(payload) {
  const title = (payload.title || "").toString().trim();
  const price = (payload.price || "").toString().trim();
  const short = (payload.short || "").toString().trim();
  const section = (payload.section || "").toString().trim();
  const image = (payload.image || "").toString().trim();

  if (!title || !price) {
    throw new Error("Le titre et le prix sont obligatoires.");
  }

  if (!section) {
    throw new Error("La section est obligatoire.");
  }

  const wine = formatWineDocument({
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    section,
    title,
    short,
    price,
    image,
    currency: "€",
  });

  const db = await getDb();
  await db.collection(COLLECTION).insertOne(wine);

  return wine;
}

export async function listAllWines() {
  const db = await getDb();
  return db
    .collection(COLLECTION)
    .find({})
    .sort({ section: 1, createdAt: -1 })
    .toArray()
    .then((items) => items.map(formatWineDocument));
}

/**
 * @param {URLSearchParams} searchParams
 */
export async function listWines(searchParams) {
  const { page, limit } = parsePagination(searchParams);
  const db = await getDb();
  const collection = db.collection(COLLECTION);

  const total = await collection.countDocuments();
  const pagination = buildPagination(page, limit, total);

  const wines = await collection
    .find({})
    .sort({ section: 1, createdAt: -1 })
    .skip(pagination.skip)
    .limit(limit)
    .toArray()
    .then((items) => items.map(formatWineDocument));

  return { wines, pagination };
}

/**
 * @param {string} id
 */
export async function deleteWine(id) {
  const db = await getDb();
  const result = await db.collection(COLLECTION).deleteOne({ id });
  return result.deletedCount > 0;
}

/**
 * Group wines by section for accordion display.
 * @param {Array} wines
 */
export function groupWinesBySection(wines) {
  const order = [...WINE_SECTIONS];
  const map = new Map();

  for (const wine of wines) {
    const section = (wine.section || "Autres").toString().trim() || "Autres";
    if (!map.has(section)) map.set(section, []);
    map.get(section).push(wine);
  }

  const sections = [];

  for (const name of order) {
    if (map.has(name)) {
      sections.push({ id: name, name, items: map.get(name) });
      map.delete(name);
    }
  }

  for (const [name, items] of map.entries()) {
    sections.push({ id: name, name, items });
  }

  return sections;
}
