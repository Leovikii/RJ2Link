import type { KeyValueStorage } from '../storage/key-value-storage';

export class GmKeyValueStorage implements KeyValueStorage {
  async get<T>(key: string, fallback: T): Promise<T> {
    if (typeof GM_getValue !== 'function') return fallback;
    return await GM_getValue(key, fallback);
  }

  async set<T>(key: string, value: T): Promise<void> {
    if (typeof GM_setValue === 'function') await GM_setValue(key, value);
  }

  async delete(key: string): Promise<void> {
    if (typeof GM_deleteValue === 'function') await GM_deleteValue(key);
  }

  async list(): Promise<string[]> {
    if (typeof GM_listValues !== 'function') return [];
    return await GM_listValues();
  }
}

