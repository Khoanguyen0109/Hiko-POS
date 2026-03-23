/**
 * Cache service backed by Redis (via ioredis).
 *
 * If REDIS_URL is not set (or the connection fails), all operations silently
 * become no-ops so the app continues working without a cache.
 *
 * Usage:
 *   const cache = require('./services/cacheService');
 *
 *   // Read-through helper
 *   const data = await cache.getOrSet('my:key', () => expensiveQuery(), 120);
 *
 *   // Manual set / get / del
 *   await cache.set('my:key', value, 300);
 *   const val = await cache.get('my:key');
 *   await cache.del('my:key');
 *
 *   // Invalidate all keys for a store
 *   await cache.delByPattern(`store:${storeId}:*`);
 */

const Redis = require('ioredis');

let client = null;
let connected = false;

if (process.env.REDIS_URL) {
    try {
        client = new Redis(process.env.REDIS_URL, {
            maxRetriesPerRequest: 1,
            enableOfflineQueue: false,
            lazyConnect: true,
        });

        client.on('connect', () => {
            connected = true;
            console.log('✅ Redis connected');
        });

        client.on('error', (err) => {
            connected = false;
            // Suppress repeated noise; only log first occurrence per session
            if (!client._loggedError) {
                console.warn('⚠️  Redis unavailable — caching disabled:', err.message);
                client._loggedError = true;
            }
        });

        client.connect().catch(() => {
            // Connection errors handled by the 'error' event above
        });
    } catch {
        client = null;
    }
}

// ─── Core helpers ────────────────────────────────────────────────────────────

/**
 * Retrieve a cached value. Returns null when not found or when Redis is down.
 * @param {string} key
 * @returns {Promise<any|null>}
 */
const get = async (key) => {
    if (!client || !connected) return null;
    try {
        const raw = await client.get(key);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
};

/**
 * Store a value in the cache.
 * @param {string} key
 * @param {any} value  — must be JSON-serialisable
 * @param {number} [ttlSeconds=300]
 */
const set = async (key, value, ttlSeconds = 300) => {
    if (!client || !connected) return;
    try {
        await client.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch {
        // Swallow; cache miss is acceptable
    }
};

/**
 * Delete one or more keys.
 */
const del = async (...keys) => {
    if (!client || !connected || !keys.length) return;
    try {
        await client.del(...keys);
    } catch {
        // Swallow
    }
};

/**
 * Delete all keys matching a glob pattern (e.g. `store:abc123:*`).
 * Uses SCAN to avoid blocking Redis.
 */
const delByPattern = async (pattern) => {
    if (!client || !connected) return;
    try {
        let cursor = '0';
        do {
            const [nextCursor, keys] = await client.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
            cursor = nextCursor;
            if (keys.length) await client.del(...keys);
        } while (cursor !== '0');
    } catch {
        // Swallow
    }
};

/**
 * Read-through cache helper.
 * Returns the cached value if present; otherwise calls `fetchFn`, caches
 * the result, and returns it.
 *
 * @param {string} key
 * @param {() => Promise<any>} fetchFn  — called on cache miss
 * @param {number} [ttlSeconds=300]
 * @returns {Promise<any>}
 */
const getOrSet = async (key, fetchFn, ttlSeconds = 300) => {
    const cached = await get(key);
    if (cached !== null) return cached;

    const fresh = await fetchFn();
    await set(key, fresh, ttlSeconds);
    return fresh;
};

// ─── Key builders (centralised, prevents typos) ──────────────────────────────

const keys = {
    storeCategories:    (storeId) => `store:${storeId}:categories`,
    storeDishes:        (storeId) => `store:${storeId}:dishes`,
    storeToppings:      (storeId) => `store:${storeId}:toppings`,
    storePromotions:    (storeId) => `store:${storeId}:promotions:active`,
    storeShiftTemplates:(storeId) => `store:${storeId}:shift-templates`,
    storeSettings:      (storeId) => `store:${storeId}:settings`,
    storeAll:           (storeId) => `store:${storeId}:*`,
};

module.exports = { get, set, del, delByPattern, getOrSet, keys };
