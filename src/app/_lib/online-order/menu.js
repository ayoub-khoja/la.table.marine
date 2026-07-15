import { listAllCategories } from "@library/categories/store";
import { listAllProducts } from "@library/products/store";

function parseProductPrice(product) {
  const raw = (product?.price ?? "").toString().trim().replace(",", ".");
  const value = Number(raw);
  return Number.isFinite(value) ? value : 0;
}

function normalizeAccompaniments(rawAccompaniments) {
  if (!Array.isArray(rawAccompaniments)) return [];
  return rawAccompaniments.map((item) => item.toString().trim()).filter(Boolean);
}

/**
 * Construit le menu commande en ligne depuis MongoDB.
 */
export async function getOnlineOrderMenu() {
  const [categories, products] = await Promise.all([
    listAllCategories(),
    listAllProducts(),
  ]);

  const productsByCategoryId = new Map();
  const productsByCategorySlug = new Map();

  for (const product of products) {
    const item = {
      id: product.id,
      name: (product.title || "").toString().trim(),
      description: (product.short || "").toString().trim(),
      price: parseProductPrice(product),
    };

    if (product.categoryId) {
      if (!productsByCategoryId.has(product.categoryId)) {
        productsByCategoryId.set(product.categoryId, []);
      }
      productsByCategoryId.get(product.categoryId).push(item);
    }

    if (product.categorySlug) {
      if (!productsByCategorySlug.has(product.categorySlug)) {
        productsByCategorySlug.set(product.categorySlug, []);
      }
      productsByCategorySlug.get(product.categorySlug).push(item);
    }
  }

  const categoryCards = categories.map((category) => ({
    id: category.slug || category.id,
    name: category.name,
    image: (category.image || "").toString().trim(),
  }));

  const sections = categories.map((category, index) => {
    const sectionId = category.slug || category.id;
    const items =
      productsByCategoryId.get(category.id) ||
      productsByCategorySlug.get(category.slug) ||
      [];

    return {
      id: sectionId,
      name: category.name,
      image: (category.image || "").toString().trim(),
      defaultOpen: index === 0,
      accompaniments: normalizeAccompaniments(category.accompaniments),
      items,
    };
  });

  return {
    categories: categoryCards,
    sections,
  };
}
