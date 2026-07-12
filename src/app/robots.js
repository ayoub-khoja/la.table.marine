import { SEO_CONFIG } from "@library/seo/config";
import { ROBOTS_DISALLOW_PREFIXES } from "@library/seo/routes";

/** @returns {import('next').MetadataRoute.Robots} */
export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ROBOTS_DISALLOW_PREFIXES,
      },
    ],
    sitemap: `${SEO_CONFIG.siteUrl}/sitemap.xml`,
    host: SEO_CONFIG.siteUrl,
  };
}
