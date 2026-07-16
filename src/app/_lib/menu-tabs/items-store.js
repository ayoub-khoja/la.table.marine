import { randomUUID } from "crypto";
import { getDb } from "@library/mongodb/client";
import { buildPagination, parsePagination } from "@library/mongodb/pagination";

const COLLECTION = "menu_tab_items";

export function formatTabItemPrice(price) {
  const raw = (price || "0").toString().trim();
  return `${raw.replace(".", ",")}€`;
}

function formatItem(item) {
  return {
    ...item,
    priceFormatted: item.priceFormatted || formatTabItemPrice(item.price),
  };
}

/**
 * @param {object} payload
 */
export async function createTabItem(payload) {
  const tabId = (payload.tabId || "").toString().trim();
  const title = (payload.title || "").toString().trim();
  const price = (payload.price || "").toString().trim();
  const short = (payload.short || "").toString().trim();
  const section = (payload.section || "").toString().trim() || "Général";

  if (!tabId) throw new Error("Onglet manquant.");
  if (!title || !price) {
    throw new Error("Le titre et le prix sont obligatoires.");
  }

  const item = formatItem({
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    tabId,
    section,
    title,
    short,
    price,
    currency: "€",
  });

  const db = await getDb();
  await db.collection(COLLECTION).insertOne(item);
  return item;
}

/**
 * @param {string} tabId
 * @param {URLSearchParams} searchParams
 */
export async function listTabItems(tabId, searchParams) {
  const { page, limit } = parsePagination(searchParams);
  const db = await getDb();
  const collection = db.collection(COLLECTION);
  const filter = { tabId };

  const total = await collection.countDocuments(filter);
  const pagination = buildPagination(page, limit, total);

  const items = await collection
    .find(filter)
    .sort({ section: 1, createdAt: -1 })
    .skip(pagination.skip)
    .limit(limit)
    .toArray()
    .then((rows) => rows.map(formatItem));

  return { items, pagination };
}

/**
 * @param {string} tabId
 */
export async function listAllTabItems(tabId) {
  const db = await getDb();
  return db
    .collection(COLLECTION)
    .find({ tabId })
    .sort({ section: 1, createdAt: -1 })
    .toArray()
    .then((rows) => rows.map(formatItem));
}

/**
 * @param {string} id
 */
export async function deleteTabItem(id) {
  const db = await getDb();
  const result = await db.collection(COLLECTION).deleteOne({ id });
  return result.deletedCount > 0;
}

/**
 * @param {string} tabId
 */
export async function deleteTabItemsByTab(tabId) {
  const db = await getDb();
  const result = await db.collection(COLLECTION).deleteMany({ tabId });
  return result.deletedCount;
}

export function groupTabItemsBySection(items) {
  const map = new Map();

  for (const item of items) {
    const section = (item.section || "Général").toString().trim() || "Général";
    if (!map.has(section)) map.set(section, []);
    map.get(section).push(item);
  }

  return Array.from(map.entries()).map(([name, sectionItems]) => ({
    id: name,
    name,
    items: sectionItems,
  }));
}
