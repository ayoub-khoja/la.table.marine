import AppData from "@data/app.json";

function getConfig(overrides = {}) {
  return { ...AppData.settings.googleMaps, ...overrides };
}

function getGoogleMapsApiKey() {
  return process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() || "";
}

function useLegacyGoogleMapsEmbed() {
  if (process.env.NEXT_PUBLIC_GOOGLE_MAPS_LEGACY_EMBED === "true") {
    return true;
  }

  // En local, l'embed sans clé évite les erreurs de restriction HTTP referrer.
  return process.env.NODE_ENV === "development";
}

function buildLegacyEmbedUrl(config) {
  const q = encodeURIComponent(config.query || config.address);
  const z = config.zoom || 16;
  const hl = config.lang || "fr";
  return `https://maps.google.com/maps?q=${q}&hl=${hl}&z=${z}&output=embed`;
}

export function getGoogleMapsEmbedUrl(overrides = {}) {
  const config = getConfig(overrides);
  const apiKey = getGoogleMapsApiKey();

  if (!apiKey || useLegacyGoogleMapsEmbed()) {
    return buildLegacyEmbedUrl(config);
  }

  const z = config.zoom || 16;
  const hl = config.lang || "fr";
  const params = new URLSearchParams({
    key: apiKey,
    q: config.placeId ? `place_id:${config.placeId}` : (config.query || config.address),
    zoom: String(z),
    language: hl,
  });

  return `https://www.google.com/maps/embed/v1/place?${params.toString()}`;
}

export function getGoogleMapsDirectionsUrl(overrides = {}) {
  const config = getConfig(overrides);
  const dest = encodeURIComponent(config.query || config.address);
  return `https://www.google.com/maps/dir/?api=1&destination=${dest}`;
}

export function getGoogleMapsPlaceUrl(overrides = {}) {
  const config = getConfig(overrides);
  const q = encodeURIComponent(config.query || config.address);
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
}
