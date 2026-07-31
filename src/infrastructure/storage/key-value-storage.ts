export interface KeyValueStorage {
  get<T>(key: string, fallback: T): Promise<T>;
  set<T>(key: string, value: T): Promise<void>;
  delete(key: string): Promise<void>;
  list(): Promise<string[]>;
}

export class MemoryKeyValueStorage implements KeyValueStorage {
  private readonly values = new Map<string, unknown>();

  async get<T>(key: string, fallback: T): Promise<T> {
    return this.values.has(key) ? (this.values.get(key) as T) : fallback;
  }

  async set<T>(key: string, value: T): Promise<void> {
    this.values.set(key, structuredClone(value));
  }

  async delete(key: string): Promise<void> {
    this.values.delete(key);
  }

  async list(): Promise<string[]> {
    return [...this.values.keys()];
  }
}

