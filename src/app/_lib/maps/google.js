import AppData from "@data/app.json";

function getConfig(overrides = {}) {
  return { ...AppData.settings.googleMaps, ...overrides };
}

export function getGoogleMapsEmbedUrl(overrides = {}) {
  const config = getConfig(overrides);
  const q = encodeURIComponent(config.query || config.address);
  const z = config.zoom || 16;
  const hl = config.lang || "fr";
  return `https://maps.google.com/maps?q=${q}&hl=${hl}&z=${z}&output=embed`;
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
