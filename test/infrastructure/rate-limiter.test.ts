import { describe, expect, it } from 'vitest';
import { SouthPlusRateLimiter } from '../../src/infrastructure/coordination/southplus-rate-limiter';
import { MemoryKeyValueStorage } from '../../src/infrastructure/storage/key-value-storage';

describe('SouthPlusRateLimiter', () => {
  it('keeps the acquired lease for the full start-to-start cooldown', async () => {
    const storage = new MemoryKeyValueStorage();
    const limiter = new SouthPlusRateLimiter(storage, () => 1000, async () => {}, () => 'owner-a');
    await limiter.acquire({ cooldownMs: 10_500 });

    expect(await storage.list()).toEqual(['rwg:v1:southplus-search-lease']);
    expect(await storage.get('rwg:v1:southplus-search-lease', null)).toMatchObject({
      owner: 'owner-a', acquiredAt: 1000, expiresAt: 11_500,
    });
  });

  it('times out instead of waiting forever', async () => {
    let now = 1000;
    const storage = new MemoryKeyValueStorage();
    await storage.set('rwg:v1:southplus-search-lease', {
      owner: 'other', acquiredAt: now, expiresAt: now + 10000,
    });
    const limiter = new SouthPlusRateLimiter(
      storage,
      () => now,
      async (ms) => { now += ms; },
      () => 'owner-a',
    );
    await expect(limiter.acquire({ maxWaitMs: 500, pollMs: 100 }))
      .rejects.toMatchObject({ kind: 'rate-limited' });
    expect((await storage.list()).filter((key) => key.includes('waiter'))).toEqual([]);
  });

  it('orders simultaneous tabs by enqueue time and owner', async () => {
    let now = 1000;
    const storage = new MemoryKeyValueStorage();
    const sleep = async (ms: number) => { now += ms; };
    const options = { cooldownMs: 100, maxWaitMs: 1000, pollMs: 10 };
    await new SouthPlusRateLimiter(storage, () => now, sleep, () => 'owner-a').acquire(options);

    const order: string[] = [];
    const second = new SouthPlusRateLimiter(storage, () => now, sleep, () => 'owner-b')
      .acquire(options).then(() => { order.push('owner-b'); });
    const third = new SouthPlusRateLimiter(storage, () => now, sleep, () => 'owner-c')
      .acquire(options).then(() => { order.push('owner-c'); });
    await Promise.all([second, third]);

    expect(order).toEqual(['owner-b', 'owner-c']);
  });

  it('removes a cancelled waiter without consuming the cooldown', async () => {
    const storage = new MemoryKeyValueStorage();
    const abort = new AbortController();
    abort.abort();
    const limiter = new SouthPlusRateLimiter(storage, () => 1000, async () => {}, () => 'owner-a');

    await expect(limiter.acquire({ signal: abort.signal })).rejects.toMatchObject({ kind: 'aborted' });
    expect(await storage.list()).toEqual([]);
  });
});
