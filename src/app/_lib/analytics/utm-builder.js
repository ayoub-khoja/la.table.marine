/**
 * @param {string} baseUrl
 * @param {{ source?: string, medium?: string, campaign?: string, content?: string, term?: string }} params
 * @returns {{ url: string | null, error: string | null }}
 */
export function buildUtmUrl(baseUrl, params) {
  const source = params.source?.trim();
  const medium = params.medium?.trim();
  const campaign = params.campaign?.trim();

  if (!baseUrl?.trim()) {
    return { url: null, error: "L'URL de destination est requise." };
  }

  let url;
  try {
    url = new URL(baseUrl.trim());
  } catch {
    return { url: null, error: "URL de destination invalide." };
  }

  if (!source || !medium || !campaign) {
    return {
      url: null,
      error: "Les champs source, medium et campagne sont obligatoires.",
    };
  }

  url.searchParams.set("utm_source", source);
  url.searchParams.set("utm_medium", medium);
  url.searchParams.set("utm_campaign", campaign);

  if (params.content?.trim()) {
    url.searchParams.set("utm_content", params.content.trim());
  }
  if (params.term?.trim()) {
    url.searchParams.set("utm_term", params.term.trim());
  }

  return { url: url.toString(), error: null };
}
