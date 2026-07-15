const GENERIC_SOCIAL_HOSTS = new Set([
  "facebook.com",
  "www.facebook.com",
  "instagram.com",
  "www.instagram.com",
  "twitter.com",
  "www.twitter.com",
  "x.com",
  "www.x.com",
  "youtube.com",
  "www.youtube.com",
]);

/**
 * @param {string} pathname
 */
function hasProfilePath(pathname) {
  return pathname.split("/").filter(Boolean).length > 0;
}

/**
 * @param {unknown} url
 */
export function isValidSocialProfileUrl(url) {
  if (!url || typeof url !== "string") return false;

  const trimmed = url.trim();
  if (!trimmed || trimmed === "#" || trimmed === "#.") return false;
  if (!trimmed.startsWith("https://")) return false;

  let parsed;
  try {
    parsed = new URL(trimmed);
  } catch {
    return false;
  }

  if (parsed.protocol !== "https:") return false;

  const host = parsed.hostname.toLowerCase();
  if (GENERIC_SOCIAL_HOSTS.has(host) && !hasProfilePath(parsed.pathname)) {
    return false;
  }

  return true;
}

/**
 * @param {Array<{ link?: string }> | null | undefined} items
 */
export function getRenderableSocialItems(items) {
  return (items || []).filter((item) => isValidSocialProfileUrl(item?.link));
}
