import { Redis } from "@upstash/redis";

/**
 * Cache layer: Upstash Redis (REST) when configured, otherwise an in-memory
 * Map with TTL so the app works out of the box in local development.
 */

interface MemoryEntry {
  value: unknown;
  expiresAt: number;
}

const globalForCache = globalThis as unknown as { __memoryCache?: Map<string, MemoryEntry> };
const memory = (globalForCache.__memoryCache ??= new Map<string, MemoryEntry>());

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

export const cacheEnabled = Boolean(redis);

export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    if (redis) {
      return (await redis.get<T>(key)) ?? null;
    }
    const entry = memory.get(key);
    if (!entry) return null;
    if (entry.expiresAt < Date.now()) {
      memory.delete(key);
      return null;
    }
    return entry.value as T;
  } catch {
    return null;
  }
}

export async function cacheSet(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  try {
    if (redis) {
      await redis.set(key, value, { ex: ttlSeconds });
      return;
    }
    memory.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
  } catch {
    // Cache failures must never break requests.
  }
}

export async function cacheDelete(prefixOrKey: string): Promise<void> {
  try {
    if (redis) {
      await redis.del(prefixOrKey);
      return;
    }
    for (const key of Array.from(memory.keys())) {
      if (key === prefixOrKey || key.startsWith(prefixOrKey)) {
        memory.delete(key);
      }
    }
  } catch {
    // ignore
  }
}

/** Read-through cache helper. */
export async function cached<T>(key: string, ttlSeconds: number, loader: () => Promise<T>): Promise<T> {
  const hit = await cacheGet<T>(key);
  if (hit !== null) return hit;
  const fresh = await loader();
  await cacheSet(key, fresh, ttlSeconds);
  return fresh;
}
