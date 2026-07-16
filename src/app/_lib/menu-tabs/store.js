import { getDb } from "@library/mongodb/client";
import { DEFAULT_MENU_TABS } from "@library/menu-tabs/constants";

const COLLECTION = "menu_tabs";

function slugifyLabel(label) {
  return label
    .toString()
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function ensureDefaultTabs(collection) {
  const count = await collection.countDocuments();
  if (count === 0) {
    const now = new Date().toISOString();
    await collection.insertMany(
      DEFAULT_MENU_TABS.map((tab) => ({
        ...tab,
        createdAt: now,
      }))
    );
    return;
  }

  // Retire l'ancien onglet système « Carte des Vins » s'il est encore en base.
  await collection.deleteOne({ id: "wines", system: true, kind: "wines" });
}

export async function listMenuTabs() {
  const db = await getDb();
  const collection = db.collection(COLLECTION);
  await ensureDefaultTabs(collection);

  return collection.find({}).sort({ sortOrder: 1, createdAt: 1 }).toArray();
}

/**
 * @param {object} payload
 */
export async function createMenuTab(payload) {
  const label = (payload.label || "").toString().trim();
  const icon = (payload.icon || "fa-utensils").toString().trim() || "fa-utensils";

  if (!label) {
    throw new Error("Le nom de l’onglet est obligatoire.");
  }

  const db = await getDb();
  const collection = db.collection(COLLECTION);
  await ensureDefaultTabs(collection);

  const baseSlug = slugifyLabel(label) || "onglet";
  let slug = baseSlug;
  let attempt = 1;
  while (await collection.findOne({ id: slug })) {
    attempt += 1;
    slug = `${baseSlug}-${attempt}`;
  }

  const last = await collection
    .find({})
    .sort({ sortOrder: -1 })
    .limit(1)
    .toArray();
  const sortOrder = (last[0]?.sortOrder ?? 0) + 1;

  const tab = {
    id: slug,
    label,
    icon,
    kind: "custom",
    system: false,
    sortOrder,
    createdAt: new Date().toISOString(),
  };

  await collection.insertOne(tab);
  return tab;
}

/**
 * @param {string} id
 * @param {object} payload
 */
export async function updateMenuTab(id, payload) {
  const db = await getDb();
  const collection = db.collection(COLLECTION);
  const tab = await collection.findOne({ id });

  if (!tab) {
    throw new Error("Onglet introuvable.");
  }

  const updates = {};

  if (payload.label !== undefined) {
    const label = payload.label.toString().trim();
    if (!label) throw new Error("Le nom de l’onglet est obligatoire.");
    updates.label = label;
  }

  if (payload.icon !== undefined) {
    const icon = payload.icon.toString().trim();
    if (icon) updates.icon = icon;
  }

  if (!Object.keys(updates).length) {
    return tab;
  }

  await collection.updateOne({ id }, { $set: updates });
  return { ...tab, ...updates };
}

/**
 * @param {string} id
 * @param {"left"|"right"} direction
 */
export async function moveMenuTab(id, direction) {
  const tabs = await listMenuTabs();
  const index = tabs.findIndex((tab) => tab.id === id);

  if (index < 0) {
    throw new Error("Onglet introuvable.");
  }

  const targetIndex = direction === "left" ? index - 1 : index + 1;

  if (targetIndex < 0 || targetIndex >= tabs.length) {
    return tabs;
  }

  const current = tabs[index];
  const neighbor = tabs[targetIndex];
  const db = await getDb();
  const collection = db.collection(COLLECTION);

  await Promise.all([
    collection.updateOne(
      { id: current.id },
      { $set: { sortOrder: neighbor.sortOrder } }
    ),
    collection.updateOne(
      { id: neighbor.id },
      { $set: { sortOrder: current.sortOrder } }
    ),
  ]);

  return listMenuTabs();
}

/**
 * @param {string[]} orderedIds
 */
export async function reorderMenuTabs(orderedIds) {
  if (!Array.isArray(orderedIds) || !orderedIds.length) {
    throw new Error("Liste d’onglets invalide.");
  }

  const db = await getDb();
  const collection = db.collection(COLLECTION);

  await Promise.all(
    orderedIds.map((id, index) =>
      collection.updateOne({ id }, { $set: { sortOrder: index } })
    )
  );

  return listMenuTabs();
}

/**
 * @param {string} id
 */
export async function deleteMenuTab(id) {
  const db = await getDb();
  const collection = db.collection(COLLECTION);
  const tab = await collection.findOne({ id });

  if (!tab) return { deleted: false, reason: "not_found" };

  const total = await collection.countDocuments();
  if (total <= 1) {
    return { deleted: false, reason: "last" };
  }

  const result = await collection.deleteOne({ id });
  return { deleted: result.deletedCount > 0, tab };
}
