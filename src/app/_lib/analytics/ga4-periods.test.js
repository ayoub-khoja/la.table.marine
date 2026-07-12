import { describe, expect, it } from "vitest";

import {
  buildPeriod,
  computeEvolution,
  safeConversionRate,
} from "./ga4-periods";
import { Ga4ValidationError } from "./ga4-errors";

describe("ga4-periods", () => {
  it("construit une période 30 jours", () => {
    const period = buildPeriod("30d");
    expect(period.range).toBe("30d");
    expect(period.days).toBe(30);
    expect(period.startDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(period.endDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("active le mode horaire pour aujourd'hui", () => {
    const period = buildPeriod("today");
    expect(period.hourly).toBe(true);
  });

  it("rejette une période personnalisée invalide", () => {
    expect(() => buildPeriod("custom", { start: "bad", end: "2026-01-01" })).toThrow(
      Ga4ValidationError
    );
  });

  it("rejette une date de début après la fin", () => {
    expect(() =>
      buildPeriod("custom", { start: "2026-07-10", end: "2026-07-01" })
    ).toThrow(Ga4ValidationError);
  });

  it("calcule une hausse", () => {
    const evo = computeEvolution(120, 100);
    expect(evo.direction).toBe("up");
    expect(evo.percent).toBe(20);
    expect(evo.label).toBe("Hausse");
  });

  it("calcule une baisse", () => {
    const evo = computeEvolution(80, 100);
    expect(evo.direction).toBe("down");
    expect(evo.percent).toBe(-20);
  });

  it("gère la division par zéro pour le taux de conversion", () => {
    expect(safeConversionRate(5, 0)).toBe(0);
    expect(safeConversionRate(5, 100)).toBe(5);
  });
});
