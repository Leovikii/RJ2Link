import type { KeyValueStorage } from '../storage/key-value-storage';

export interface CacheEntry<T> {
  schemaVersion: number;
  createdAt: number;
  expiresAt: number;
  value: T;
}

const SCHEMA_VERSION = 1;

export class QueryCache {
  private readonly memory = new Map<string, CacheEntry<unknown>>();

  constructor(
    private readonly storage: KeyValueStorage,
    private readonly now: () => number = Date.now,
  ) {}

  async get<T>(key: string): Promise<T | undefined> {
    const memoryEntry = this.memory.get(key) as CacheEntry<T> | undefined;
    if (memoryEntry) return this.readEntry(key, memoryEntry);

    const stored = await this.storage.get<CacheEntry<T> | null>(key, null);
    if (!stored) return undefined;
    const value = await this.readEntry(key, stored);
    if (value !== undefined) this.memory.set(key, stored);
    return value;
  }

  async set<T>(key: string, value: T, ttlMs: number): Promise<void> {
    const createdAt = this.now();
    const entry: CacheEntry<T> = {
      schemaVersion: SCHEMA_VERSION,
      createdAt,
      expiresAt: createdAt + Math.max(0, ttlMs),
      value,
    };
    this.memory.set(key, entry);
    await this.storage.set(key, entry);
  }

  async delete(key: string): Promise<void> {
    this.memory.delete(key);
    await this.storage.delete(key);
  }

  hasMemory(key: string): boolean {
    const entry = this.memory.get(key);
    return Boolean(entry && entry.schemaVersion === SCHEMA_VERSION && entry.expiresAt > this.now());
  }

  private async readEntry<T>(key: string, entry: CacheEntry<T>): Promise<T | undefined> {
    const now = this.now();
    const invalid = entry.schemaVersion !== SCHEMA_VERSION
      || !Number.isFinite(entry.expiresAt)
      || entry.expiresAt <= now
      || entry.createdAt > now + 5 * 60_000;
    if (!invalid) return entry.value;
    await this.delete(key);
    return undefined;
  }
}

