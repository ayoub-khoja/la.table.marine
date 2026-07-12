import { describe, expect, it } from "vitest";

import { buildPeriodSummary } from "./ga4-summary";

describe("ga4-summary", () => {
  it("génère un résumé avec les chiffres fournis", () => {
    const text = buildPeriodSummary({
      period: {
        startDate: "2026-07-01",
        endDate: "2026-07-31",
      },
      kpis: [
        {
          id: "activeUsers",
          value: 1245,
          evolution: { percent: 12, direction: "up", label: "Hausse" },
        },
        {
          id: "reservation_completed",
          value: 48,
          evolution: { percent: 0, direction: "stable", label: "Stable" },
        },
      ],
      sources: [{ label: "Google", sessions: 500 }],
      pages: [{ title: "Menu", views: 320 }],
      sessions: 1500,
    });

    expect(text).toMatch(/1[\s\u202f]245/);
    expect(text).toContain("Google");
    expect(text).toContain("Menu");
    expect(text).toContain("48");
    expect(text).not.toContain("undefined");
  });

  it("gère les valeurs nulles", () => {
    const text = buildPeriodSummary({
      period: { startDate: "2026-07-01", endDate: "2026-07-31" },
      kpis: [
        { id: "activeUsers", value: 0, evolution: { percent: null, direction: "neutral", label: "Nouveau" } },
        { id: "reservation_completed", value: 0, evolution: { percent: 0, direction: "stable", label: "Stable" } },
      ],
      sources: [],
      pages: [],
      sessions: 0,
    });

    expect(text).toContain("0 utilisateur");
    expect(text).toContain("Aucune réservation terminée");
  });
});
