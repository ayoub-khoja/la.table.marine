const cacheStore = new Map();
const inflightStore = new Map();

/**
 * @param {string} key
 */
export function invalidateCacheKey(key) {
  cacheStore.delete(key);
  inflightStore.delete(key);
}

/**
 */
export function clearAnalyticsCache() {
  cacheStore.clear();
  inflightStore.clear();
}

/**
 * @template T
 * @param {string} key
 * @param {number} ttlMs
 * @param {() => Promise<T>} fetcher
 * @param {{ force?: boolean }} [options]
 * @returns {Promise<T>}
 */
export async function getCachedReport(key, ttlMs, fetcher, options = {}) {
  if (options.force) {
    invalidateCacheKey(key);
  }

  const cached = cacheStore.get(key);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.value;
  }

  const inflight = inflightStore.get(key);
  if (inflight) {
    return inflight;
  }

  const promise = fetcher()
    .then((value) => {
      cacheStore.set(key, {
        value,
        expiresAt: Date.now() + ttlMs,
      });
      inflightStore.delete(key);
      return value;
    })
    .catch((error) => {
      inflightStore.delete(key);
      throw error;
    });

  inflightStore.set(key, promise);
  return promise;
}
