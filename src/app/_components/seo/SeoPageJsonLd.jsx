import JsonLd from "@components/seo/JsonLd";
import { buildSecondaryPageSchemas } from "@library/seo/json-ld";
import { PAGE_SEO } from "@library/seo/page-metadata";

/**
 * @param {{ pageKey: keyof typeof PAGE_SEO, breadcrumbs?: Array<{ name: string, path: string }> }} props
 */
const SeoPageJsonLd = ({ pageKey, breadcrumbs }) => {
  const page = PAGE_SEO[pageKey];
  if (!page) return null;

  const crumbs = breadcrumbs || [
    { name: "Accueil", path: "/" },
    { name: page.title, path: page.path },
  ];

  return (
    <JsonLd
      data={buildSecondaryPageSchemas({
        path: page.path,
        title: page.title,
        description: page.description,
        breadcrumbs: crumbs,
      })}
    />
  );
};

export default SeoPageJsonLd;
