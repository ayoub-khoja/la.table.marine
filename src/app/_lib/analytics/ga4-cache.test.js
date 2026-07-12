import { beforeEach, describe, expect, it, vi } from "vitest";

import { clearAnalyticsCache, getCachedReport } from "./ga4-cache";

describe("ga4-cache", () => {
  beforeEach(() => {
    clearAnalyticsCache();
  });

  it("met en cache le résultat", async () => {
    const fetcher = vi.fn().mockResolvedValue({ value: 42 });
    const first = await getCachedReport("test-key", 60000, fetcher);
    const second = await getCachedReport("test-key", 60000, fetcher);

    expect(first).toEqual({ value: 42 });
    expect(second).toEqual({ value: 42 });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("force l'actualisation", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce({ value: 1 })
      .mockResolvedValueOnce({ value: 2 });

    await getCachedReport("force-key", 60000, fetcher);
    const refreshed = await getCachedReport("force-key", 60000, fetcher, { force: true });

    expect(refreshed).toEqual({ value: 2 });
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
});
