import { getSortedPostsData } from "@library/posts";
import { absoluteUrl } from "@library/seo/config";
import { INDEXABLE_STATIC_ROUTES } from "@library/seo/routes";

function toValidLastModified(dateValue) {
  if (!dateValue) return undefined;
  const date = new Date(dateValue);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

/** @returns {Promise<import('next').MetadataRoute.Sitemap>} */
export default async function sitemap() {
  const staticEntries = INDEXABLE_STATIC_ROUTES.map((route) => ({
    url: absoluteUrl(route.path),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  let blogEntries = [];
  try {
    const posts = getSortedPostsData();
    blogEntries = posts.map((post) => ({
      url: absoluteUrl(`/blog/${post.id}`),
      lastModified: toValidLastModified(post.date),
      changeFrequency: "monthly",
      priority: 0.5,
    }));
  } catch (error) {
    console.error("[sitemap] Impossible de charger les articles du blog :", error);
    blogEntries = [];
  }

  return [...staticEntries, ...blogEntries];
}
