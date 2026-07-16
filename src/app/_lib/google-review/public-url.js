import { getSiteUrl } from "@library/menu/public-url";

import { PERMANENT_GOOGLE_REVIEW_PATH } from "./constants";

export { PERMANENT_GOOGLE_REVIEW_PATH };

/** URL permanente encodée dans le QR — jamais le lien Google direct. */
export function getPermanentGoogleReviewUrl() {
  return `${getSiteUrl()}${PERMANENT_GOOGLE_REVIEW_PATH}`;
}
