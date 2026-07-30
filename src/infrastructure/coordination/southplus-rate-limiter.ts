import { AppError } from '../../domain/errors';
import type { KeyValueStorage } from '../storage/key-value-storage';

interface SearchLease {
  owner: string;
  acquiredAt: number;
  expiresAt: number;
}

export interface RateLimiterOptions {
  leaseMs?: number;
  maxWaitMs?: number;
  pollMs?: number;
}

export class SouthPlusRateLimiter {
  private readonly key = 'rwg:v1:southplus-search-lease';

  constructor(
    private readonly storage: KeyValueStorage,
    private readonly now: () => number = Date.now,
    private readonly sleep: (ms: number) => Promise<void> =
      (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
    private readonly createOwner: () => string = () =>
      globalThis.crypto?.randomUUID?.()
      ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`,
  ) {}

  async acquire(options: RateLimiterOptions = {}): Promise<() => Promise<void>> {
    const leaseMs = options.leaseMs ?? 16_000;
    const maxWaitMs = options.maxWaitMs ?? 20_000;
    const pollMs = options.pollMs ?? 250;
    const owner = this.createOwner();
    const deadline = this.now() + maxWaitMs;

    while (this.now() <= deadline) {
      const now = this.now();
      const lease = await this.storage.get<SearchLease | null>(this.key, null);
      if (!lease || lease.expiresAt <= now || lease.acquiredAt > now + 60_000) {
        const candidate: SearchLease = { owner, acquiredAt: now, expiresAt: now + leaseMs };
        await this.storage.set(this.key, candidate);
        const confirmed = await this.storage.get<SearchLease | null>(this.key, null);
        if (confirmed?.owner === owner) {
          return async () => {
            const current = await this.storage.get<SearchLease | null>(this.key, null);
            if (current?.owner === owner) await this.storage.delete(this.key);
          };
        }
      }
      const remaining = deadline - this.now();
      if (remaining <= 0) break;
      await this.sleep(Math.min(pollMs, remaining));
    }

    throw new AppError('rate-limited', 'Timed out waiting for South Plus search lease', {
      retryAfterMs: pollMs,
    });
  }
}
