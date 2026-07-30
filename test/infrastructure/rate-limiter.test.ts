import { describe, expect, it } from 'vitest';
import { SouthPlusRateLimiter } from '../../src/infrastructure/coordination/southplus-rate-limiter';
import { MemoryKeyValueStorage } from '../../src/infrastructure/storage/key-value-storage';

describe('SouthPlusRateLimiter', () => {
  it('acquires and releases its own lease', async () => {
    const storage = new MemoryKeyValueStorage();
    const limiter = new SouthPlusRateLimiter(storage, () => 1000, async () => {}, () => 'owner-a');
    const release = await limiter.acquire();
    expect((await storage.list()).length).toBe(1);
    await release();
    expect(await storage.list()).toEqual([]);
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
  });
});

