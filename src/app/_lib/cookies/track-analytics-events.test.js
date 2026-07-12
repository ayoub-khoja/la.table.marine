import { describe, expect, it } from "vitest";

import {
  isDirectionsHref,
  isMenuHref,
} from "./track-analytics-events";

describe("track-analytics-events", () => {
  it("détecte un lien itinéraire Google Maps", () => {
    expect(
      isDirectionsHref(
        "https://www.google.com/maps/dir/?api=1&destination=La%20Table%20Marine"
      )
    ).toBe(true);
  });

  it("détecte un lien carte menu", () => {
    expect(isMenuHref("/api/menu/file")).toBe(true);
    expect(isMenuHref("/menu")).toBe(true);
    expect(isMenuHref("/about")).toBe(false);
  });
});
