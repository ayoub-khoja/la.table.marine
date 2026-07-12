import { describe, expect, it } from "vitest";

import { buildCsvContent, exportOverviewCsv } from "./ga4-csv";

describe("ga4-csv", () => {
  it("génère un CSV UTF-8 avec séparateur point-virgule", () => {
    const csv = buildCsvContent([
      ["Indicateur", "Valeur"],
      ["Sessions", "100"],
      ["Titre avec;point-virgule", "10"],
    ]);

    expect(csv.charCodeAt(0)).toBe(0xfeff);
    expect(csv).toContain("Indicateur;Valeur");
    expect(csv).toContain('"Titre avec;point-virgule"');
  });

  it("exporte l'overview avec colonnes françaises", () => {
    const csv = exportOverviewCsv(
      {
        kpis: [
          {
            label: "Sessions",
            value: 100,
            previousValue: 80,
            evolution: { percent: 25, label: "Hausse" },
          },
        ],
      },
      { startDate: "2026-07-01", endDate: "2026-07-31" }
    );

    expect(csv).toContain("Sessions");
    expect(csv).toContain("2026-07-01");
    expect(csv).toContain("Hausse");
  });
});
