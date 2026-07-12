import { serializeJsonLd } from "@library/seo/json-ld";

/**
 * @param {{ data: Record<string, unknown> | Record<string, unknown>[] }} props
 */
const JsonLd = ({ data }) => {
  const payload = Array.isArray(data) ? data : [data];

  return (
    <>
      {payload.map((item, index) => (
        <script
          key={item["@id"] || item["@type"] || index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(item) }}
        />
      ))}
    </>
  );
};

export default JsonLd;
