import { describe, expect, it } from "vitest";

import { absoluteUrl } from "./config";
import {
  buildRestaurantVideoObjectSchema,
  buildRestaurantVideoPageSchemas,
  buildHomeSchemas,
} from "./json-ld";
import { getPageMetadata } from "./page-metadata";
import {
  RESTAURANT_VIDEO,
  getRestaurantVideoContentUrl,
  getRestaurantVideoEmbedUrl,
  getRestaurantVideoThumbnailUrl,
} from "./video";

const ISO_8601_DURATION = /^PT\d+(?:\.\d+)?S$/;
const ABSOLUTE_URL = /^https:\/\/[^/]+\/.+/;

describe("restaurant video seo", () => {
  it("expose des URLs absolues stables pour la vidéo", () => {
    expect(getRestaurantVideoContentUrl()).toMatch(ABSOLUTE_URL);
    expect(getRestaurantVideoThumbnailUrl()).toMatch(ABSOLUTE_URL);
    expect(getRestaurantVideoEmbedUrl()).toMatch(ABSOLUTE_URL);
    expect(getRestaurantVideoContentUrl()).toContain(RESTAURANT_VIDEO.contentPath);
    expect(getRestaurantVideoThumbnailUrl()).toContain(RESTAURANT_VIDEO.posterPath);
    expect(getRestaurantVideoEmbedUrl()).toContain(RESTAURANT_VIDEO.embedPath);
    expect(getRestaurantVideoContentUrl()).not.toMatch(/[?&](token|signature|expires)=/i);
    expect(getRestaurantVideoThumbnailUrl()).not.toMatch(/[?&](token|signature|expires)=/i);
  });

  it("construit un VideoObject complet sans valeurs vides", () => {
    const schema = buildRestaurantVideoObjectSchema();

    expect(schema["@type"]).toBe("VideoObject");
    expect(schema.name).toBeTruthy();
    expect(schema.description).toBeTruthy();
    expect(schema.thumbnailUrl).toBe(getRestaurantVideoThumbnailUrl());
    expect(schema.contentUrl).toBe(getRestaurantVideoContentUrl());
    expect(schema.embedUrl).toBe(getRestaurantVideoEmbedUrl());
    expect(schema.uploadDate).toBe(RESTAURANT_VIDEO.uploadDate);
    expect(schema.duration).toMatch(ISO_8601_DURATION);
    expect(schema.publisher).toBeTruthy();
    expect(schema.publisher.name).toBeTruthy();

    for (const field of [
      "name",
      "description",
      "thumbnailUrl",
      "uploadDate",
      "duration",
      "contentUrl",
      "embedUrl",
    ]) {
      expect(schema[field], `${field} ne doit pas être vide`).toBeTruthy();
    }
  });

  it("inclut VideoObject sur l'accueil et la page dédiée", () => {
    const homeTypes = buildHomeSchemas().map((item) => item["@type"]);
    const pageTypes = buildRestaurantVideoPageSchemas().map((item) => item["@type"]);

    expect(homeTypes).toContain("VideoObject");
    expect(pageTypes).toContain("VideoObject");
    expect(pageTypes).toContain("WebPage");
    expect(pageTypes).toContain("BreadcrumbList");
  });

  it("définit un canonical unique pour la page vidéo", () => {
    const metadata = getPageMetadata("restaurantVideo");

    expect(metadata.alternates?.canonical).toBe(
      absoluteUrl(RESTAURANT_VIDEO.embedPath)
    );
    expect(metadata.robots?.index).toBe(true);
  });
});
