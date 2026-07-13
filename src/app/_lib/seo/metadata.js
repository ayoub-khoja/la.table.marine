import { absoluteUrl, SEO_CONFIG } from "./config";

/**
 * @param {object} options
 * @param {string} options.title
 * @param {string} options.description
 * @param {string} [options.path="/"]
 * @param {string} [options.image]
 * @param {"website"|"article"} [options.type="website"]
 * @param {boolean} [options.noindex=false]
 * @param {boolean} [options.nofollow=false]
 * @returns {import('next').Metadata}
 */
export function buildPageMetadata({
  title,
  description,
  path = "/",
  image,
  type = "website",
  noindex = false,
  nofollow = false,
}) {
  const canonical = absoluteUrl(path);
  const ogImage = image || SEO_CONFIG.defaultOgImage;
  const fullTitle = title.includes(SEO_CONFIG.siteName)
    ? title
    : `${title} | ${SEO_CONFIG.siteName}`;

  const robots = {
    index: !noindex,
    follow: !nofollow,
    ...(noindex ? { noarchive: true } : {}),
  };

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    robots,
    openGraph: {
      type,
      locale: SEO_CONFIG.locale,
      url: canonical,
      siteName: SEO_CONFIG.siteName,
      title: fullTitle,
      description,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `${SEO_CONFIG.businessName} — restaurant à Plaisir`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [ogImage],
    },
  };
}

/**
 * @returns {import('next').Metadata}
 */
export function buildRootMetadata() {
  const verification = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION?.trim();

  return {
    metadataBase: new URL(SEO_CONFIG.siteUrl),
    title: {
      default: SEO_CONFIG.defaultTitle,
      template: SEO_CONFIG.titleTemplate,
    },
    description: SEO_CONFIG.defaultDescription,
    applicationName: SEO_CONFIG.siteName,
    publisher: SEO_CONFIG.businessName,
    category: "restaurant",
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    openGraph: {
      type: "website",
      locale: SEO_CONFIG.locale,
      url: absoluteUrl("/"),
      siteName: SEO_CONFIG.siteName,
      title: SEO_CONFIG.defaultTitle,
      description: SEO_CONFIG.defaultDescription,
      images: [
        {
          url: SEO_CONFIG.defaultOgImage,
          width: 1200,
          height: 630,
          alt: "Restaurant La Table Marine à Plaisir",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: SEO_CONFIG.defaultTitle,
      description: SEO_CONFIG.defaultDescription,
      images: [SEO_CONFIG.defaultOgImage],
    },
    icons: {
      icon: [
        { url: "/icons/favicon-48x48.png", sizes: "48x48", type: "image/png" },
        { url: "/icons/favicon-96x96.png", sizes: "96x96", type: "image/png" },
        { url: "/icons/favicon-192x192.png", sizes: "192x192", type: "image/png" },
      ],
      shortcut: "/icons/favicon-48x48.png",
      apple: "/icons/favicon-192x192.png",
    },
    manifest: "/site.webmanifest",
    ...(verification
      ? {
          verification: {
            google: verification,
          },
        }
      : {}),
  };
}
