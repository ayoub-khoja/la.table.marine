import { getSortedPostsData } from "@library/posts";
import { absoluteUrl } from "@library/seo/config";
import { INDEXABLE_STATIC_ROUTES } from "@library/seo/routes";

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
      lastModified: post.date ? new Date(post.date) : undefined,
      changeFrequency: "monthly",
      priority: 0.5,
    }));
  } catch {
    blogEntries = [];
  }

  return [...staticEntries, ...blogEntries];
}
