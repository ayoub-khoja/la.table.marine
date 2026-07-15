import { describe, expect, it } from "vitest";

import {
  getRenderableSocialItems,
  isValidSocialProfileUrl,
} from "./profile-url";

describe("social profile urls", () => {
  it("rejette les URLs vides, ancres et non HTTPS", () => {
    expect(isValidSocialProfileUrl("")).toBe(false);
    expect(isValidSocialProfileUrl("#")).toBe(false);
    expect(isValidSocialProfileUrl("#.")).toBe(false);
    expect(isValidSocialProfileUrl("http://facebook.com/latablemarine")).toBe(false);
    expect(isValidSocialProfileUrl("ftp://facebook.com/latablemarine")).toBe(false);
  });

  it("rejette les domaines génériques sans chemin de profil", () => {
    expect(isValidSocialProfileUrl("https://facebook.com")).toBe(false);
    expect(isValidSocialProfileUrl("https://www.facebook.com/")).toBe(false);
    expect(isValidSocialProfileUrl("https://instagram.com")).toBe(false);
    expect(isValidSocialProfileUrl("https://www.instagram.com/")).toBe(false);
  });

  it("accepte les vraies URLs de profil", () => {
    expect(isValidSocialProfileUrl("https://www.facebook.com/latablemarine")).toBe(true);
    expect(isValidSocialProfileUrl("https://www.instagram.com/latablemarine/")).toBe(true);
  });

  it("filtre les entrées sociales non rendables", () => {
    const items = getRenderableSocialItems([
      { link: "https://facebook.com", title: "Facebook", icon: "fab fa-facebook-f" },
      { link: "https://instagram.com", title: "Instagram", icon: "fab fa-instagram" },
      {
        link: "https://www.instagram.com/latablemarine",
        title: "Instagram",
        icon: "fab fa-instagram",
      },
    ]);

    expect(items).toHaveLength(1);
    expect(items[0].link).toBe("https://www.instagram.com/latablemarine");
  });
});
