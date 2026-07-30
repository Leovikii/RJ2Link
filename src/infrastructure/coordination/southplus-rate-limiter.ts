import { AppError } from '../../domain/errors';
import type { KeyValueStorage } from '../storage/key-value-storage';

interface SearchLease {
  owner: string;
  acquiredAt: number;
  expiresAt: number;
}

interface SearchWaiter {
  owner: string;
  enqueuedAt: number;
  expiresAt: number;
}

export interface RateLimiterOptions {
  cooldownMs?: number;
  maxWaitMs?: number;
  pollMs?: number;
  signal?: AbortSignal;
}

export class SouthPlusRateLimiter {
  private readonly leaseKey = 'rwg:v1:southplus-search-lease';
  private readonly waiterPrefix = 'rwg:v1:southplus-search-waiter:';

  constructor(
    private readonly storage: KeyValueStorage,
    private readonly now: () => number = Date.now,
    private readonly sleep: (ms: number) => Promise<void> =
      (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
    private readonly createOwner: () => string = () =>
      globalThis.crypto?.randomUUID?.()
      ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`,
  ) {}

  async acquire(options: RateLimiterOptions = {}): Promise<void> {
    const cooldownMs = options.cooldownMs ?? 10_500;
    const maxWaitMs = options.maxWaitMs ?? 60_000;
    const pollMs = options.pollMs ?? 500;
    const heartbeatMs = Math.max(5_000, pollMs * 4);
    const owner = this.createOwner();
    const waiterKey = `${this.waiterPrefix}${owner}`;
    const enqueuedAt = this.now();
    const deadline = enqueuedAt + maxWaitMs;

    try {
      while (this.now() <= deadline) {
        if (options.signal?.aborted) throw new AppError('aborted', 'South Plus search queue was cancelled');
        const now = this.now();
        await this.storage.set<SearchWaiter>(waiterKey, {
          owner,
          enqueuedAt,
          expiresAt: now + heartbeatMs,
        });
        const waiters = await this.readWaiters(now);
        const lease = await this.storage.get<SearchLease | null>(this.leaseKey, null);
        const leaseAvailable = !lease
          || lease.expiresAt <= now
          || lease.acquiredAt > now + 60_000;

        if (waiters[0]?.owner === owner && leaseAvailable) {
          if (options.signal?.aborted) throw new AppError('aborted', 'South Plus search queue was cancelled');
          const candidate: SearchLease = { owner, acquiredAt: now, expiresAt: now + cooldownMs };
          await this.storage.set(this.leaseKey, candidate);
          const confirmed = await this.storage.get<SearchLease | null>(this.leaseKey, null);
          if (confirmed?.owner === owner) return;
        }
        const remaining = deadline - this.now();
        if (remaining <= 0) break;
        await this.sleep(Math.min(pollMs, remaining));
      }
    } finally {
      await this.storage.delete(waiterKey);
    }

    throw new AppError('rate-limited', 'Timed out waiting for South Plus search lease', {
      retryAfterMs: cooldownMs,
    });
  }

  private async readWaiters(now: number): Promise<SearchWaiter[]> {
    const keys = (await this.storage.list()).filter((key) => key.startsWith(this.waiterPrefix));
    const entries = await Promise.all(keys.map(async (key) => ({
      key,
      value: await this.storage.get<SearchWaiter | null>(key, null),
    })));
    const waiters: SearchWaiter[] = [];
    for (const entry of entries) {
      const waiter = entry.value;
      if (!waiter
        || typeof waiter.owner !== 'string'
        || typeof waiter.enqueuedAt !== 'number'
        || typeof waiter.expiresAt !== 'number'
        || waiter.expiresAt <= now
        || waiter.enqueuedAt > now + 60_000
        || !entry.key.endsWith(waiter.owner)) {
        await this.storage.delete(entry.key);
        continue;
      }
      waiters.push(waiter);
    }
    return waiters.sort((left, right) =>
      left.enqueuedAt - right.enqueuedAt || left.owner.localeCompare(right.owner));
  }
}
