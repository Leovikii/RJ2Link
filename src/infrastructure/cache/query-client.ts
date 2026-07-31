import type { QueryCache } from './query-cache';

export interface QueryOptions {
  force?: boolean;
  ttlMs: number | ((value: unknown) => number);
  persist?: boolean;
}

export class QueryClient {
  private readonly inFlight = new Map<string, Promise<unknown>>();

  constructor(private readonly cache: QueryCache) {}

  async query<T>(
    key: string,
    loader: () => Promise<T>,
    options: QueryOptions,
  ): Promise<T> {
    const active = this.inFlight.get(key) as Promise<T> | undefined;
    if (active) return active;

    if (!options.force) {
      let cached: T | undefined;
      try {
        cached = await this.cache.get<T>(key);
      } catch {
        // Persistent cache is an optimization; storage failures fall through to the loader.
      }
      if (cached !== undefined) return cached;
      const afterCache = this.inFlight.get(key) as Promise<T> | undefined;
      if (afterCache) return afterCache;
    }

    const promise = loader()
      .then(async (value) => {
        const ttlMs = typeof options.ttlMs === 'function' ? options.ttlMs(value) : options.ttlMs;
        if (options.persist !== false) {
          try {
            await this.cache.set(key, value, ttlMs);
          } catch {
            // Keep serving the successful result when GM persistence is unavailable or full.
          }
        }
        return value;
      })
      .finally(() => {
        if (this.inFlight.get(key) === promise) this.inFlight.delete(key);
      });
    this.inFlight.set(key, promise);
    return promise;
  }

  isInFlight(key: string): boolean {
    return this.inFlight.has(key);
  }

  hasMemory(key: string): boolean {
    return this.cache.hasMemory(key);
  }

  async hasCached(key: string): Promise<boolean> {
    if (this.inFlight.has(key) || this.cache.hasMemory(key)) return true;
    try {
      const value = await this.cache.get<unknown>(key);
      return value !== undefined || this.inFlight.has(key);
    } catch {
      return this.inFlight.has(key);
    }
  }

  async invalidate(key: string): Promise<void> {
    await this.cache.delete(key);
  }
}
