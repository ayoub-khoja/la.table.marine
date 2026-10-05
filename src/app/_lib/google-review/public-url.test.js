import { afterEach, describe, expect, it } from "vitest";

import {
  getPermanentGoogleReviewUrl,
  PERMANENT_GOOGLE_REVIEW_PATH,
} from "./public-url";

const ORIGINAL_SITE = process.env.SITE_URL;
const ORIGINAL_PUBLIC = process.env.NEXT_PUBLIC_SITE_URL;

afterEach(() => {
  if (ORIGINAL_SITE === undefined) delete process.env.SITE_URL;
  else process.env.SITE_URL = ORIGINAL_SITE;

  if (ORIGINAL_PUBLIC === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
  else process.env.NEXT_PUBLIC_SITE_URL = ORIGINAL_PUBLIC;
});

describe("public-url google review", () => {
  it("expose le chemin permanent /avis-google", () => {
    expect(PERMANENT_GOOGLE_REVIEW_PATH).toBe("/avis-google");
  });

  it("construit l'URL permanente à partir de NEXT_PUBLIC_SITE_URL", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://latablemarine.com/";
    delete process.env.SITE_URL;

    expect(getPermanentGoogleReviewUrl()).toBe(
      "https://latablemarine.com/avis-google"
    );
  });

  it("reste stable si GOOGLE_REVIEW_URL change", () => {
    process.env.SITE_URL = "https://latablemarine.com";
    process.env.GOOGLE_REVIEW_URL =
      "https://search.google.com/local/writereview?placeid=ABC";

    const before = getPermanentGoogleReviewUrl();
    process.env.GOOGLE_REVIEW_URL =
      "https://search.google.com/local/writereview?placeid=XYZ";
    const after = getPermanentGoogleReviewUrl();

    expect(before).toBe(after);
    expect(after).toBe("https://latablemarine.com/avis-google");
  });
});
