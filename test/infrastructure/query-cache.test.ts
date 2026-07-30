import { describe, expect, it, vi } from 'vitest';
import { QueryCache } from '../../src/infrastructure/cache/query-cache';
import { QueryClient } from '../../src/infrastructure/cache/query-client';
import { MemoryKeyValueStorage } from '../../src/infrastructure/storage/key-value-storage';

class FailingStorage extends MemoryKeyValueStorage {
  override get<T>(_key: string, _fallback: T): Promise<T> {
    return Promise.reject(new Error('read unavailable'));
  }

  override set<T>(_key: string, _value: T): Promise<void> {
    return Promise.reject(new Error('write unavailable'));
  }
}

describe('QueryCache and QueryClient', () => {
  it('expires cached values', async () => {
    let now = 100;
    const cache = new QueryCache(new MemoryKeyValueStorage(), () => now);
    await cache.set('key', 'value', 50);
    expect(await cache.get('key')).toBe('value');
    now = 151;
    expect(await cache.get('key')).toBeUndefined();
  });

  it('deduplicates concurrent requests', async () => {
    const client = new QueryClient(new QueryCache(new MemoryKeyValueStorage()));
    let resolve!: (value: string) => void;
    const deferred = new Promise<string>((done) => { resolve = done; });
    const loader = vi.fn(() => deferred);

    const first = client.query('key', loader, { ttlMs: 1000 });
    const second = client.query('key', loader, { ttlMs: 1000 });
    resolve('value');

    await expect(Promise.all([first, second])).resolves.toEqual(['value', 'value']);
    expect(loader).toHaveBeenCalledOnce();
  });

  it('bypasses cached values on force without clearing unrelated keys', async () => {
    const cache = new QueryCache(new MemoryKeyValueStorage());
    const client = new QueryClient(cache);
    await cache.set('target', 'cached', 1000);
    await cache.set('other', 'other-value', 1000);

    await expect(client.query('target', async () => 'fresh', { force: true, ttlMs: 1000 }))
      .resolves.toBe('fresh');
    await expect(cache.get('other')).resolves.toBe('other-value');
  });

  it('does not persist failed requests', async () => {
    const cache = new QueryCache(new MemoryKeyValueStorage());
    const client = new QueryClient(cache);
    await expect(client.query('key', async () => { throw new Error('no'); }, { ttlMs: 1000 }))
      .rejects.toThrow('no');
    await expect(cache.get('key')).resolves.toBeUndefined();
  });

  it('detects valid persistent values without invoking a loader', async () => {
    const storage = new MemoryKeyValueStorage();
    await new QueryCache(storage).set('key', 'persisted', 1000);
    const client = new QueryClient(new QueryCache(storage));

    await expect(client.hasCached('key')).resolves.toBe(true);
    await expect(client.hasCached('missing')).resolves.toBe(false);
  });

  it('serves loader results when persistent storage is unavailable', async () => {
    const client = new QueryClient(new QueryCache(new FailingStorage()));
    const loader = vi.fn(async () => 'network-value');

    await expect(client.query('key', loader, { ttlMs: 1000 })).resolves.toBe('network-value');
    await expect(client.query('key', loader, { ttlMs: 1000 })).resolves.toBe('network-value');
    expect(loader).toHaveBeenCalledOnce();
  });
});
