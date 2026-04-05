// @ts-nocheck
/**
 * Cache service backed by Redis (via ioredis).
 *
 * If REDIS_URL is not set (or the connection fails), all operations silently
 * become no-ops so the app continues working without a cache.
 */

import IoRedis from "ioredis";

type RedisClient = InstanceType<typeof IoRedis>;
type RedisClientWithFlag = RedisClient & { _loggedError?: boolean };

let client: RedisClientWithFlag | null = null;
let connected = false;

if (process.env.REDIS_URL) {
  try {
    client = new IoRedis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      lazyConnect: true,
    }) as RedisClientWithFlag;

    client.on("connect", () => {
      connected = true;
      console.log("✅ Redis connected");
    });

    client.on("error", (err: Error) => {
      connected = false;
      if (!client?._loggedError) {
        console.warn("⚠️  Redis unavailable — caching disabled:", err.message);
        if (client) client._loggedError = true;
      }
    });

    void client.connect().catch(() => {
      // Connection errors handled by the 'error' event above
    });
  } catch {
    client = null;
  }
}

const get = async <T = unknown>(key: string): Promise<T | null> => {
  if (!client || !connected) return null;
  try {
    const raw = await client.get(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
};

const set = async <T>(key: string, value: T, ttlSeconds = 300): Promise<void> => {
  if (!client || !connected) return;
  try {
    await client.set(key, JSON.stringify(value), "EX", ttlSeconds);
  } catch {
    // Swallow; cache miss is acceptable
  }
};

const del = async (...keys: string[]): Promise<void> => {
  if (!client || !connected || !keys.length) return;
  try {
    await client.del(...keys);
  } catch {
    // Swallow
  }
};

const delByPattern = async (pattern: string): Promise<void> => {
  if (!client || !connected) return;
  try {
    let cursor = "0";
    do {
      const [nextCursor, keyList] = await client.scan(
        cursor,
        "MATCH",
        pattern,
        "COUNT",
        100
      );
      cursor = nextCursor;
      if (keyList.length) await client.del(...keyList);
    } while (cursor !== "0");
  } catch {
    // Swallow
  }
};

const getOrSet = async <T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttlSeconds = 300
): Promise<T> => {
  const cached = await get<T>(key);
  if (cached !== null) return cached;

  const fresh = await fetchFn();
  await set(key, fresh, ttlSeconds);
  return fresh;
};

const keys = {
  storeCategories: (storeId: string) => `store:${storeId}:categories`,
  storeDishes: (storeId: string) => `store:${storeId}:dishes`,
  storeToppings: (storeId: string) => `store:${storeId}:toppings`,
  storePromotions: (storeId: string) => `store:${storeId}:promotions:active`,
  storeShiftTemplates: (storeId: string) => `store:${storeId}:shift-templates`,
  storeSettings: (storeId: string) => `store:${storeId}:settings`,
  storeAll: (storeId: string) => `store:${storeId}:*`,
};

export { get, set, del, delByPattern, getOrSet, keys };