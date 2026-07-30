import type { RjCode } from '../../domain/rj-code';
import type { ResourceResult } from '../../domain/work';
import { AppError } from '../../domain/errors';
import { cacheKeys } from '../../infrastructure/cache/cache-keys';
import type { QueryClient } from '../../infrastructure/cache/query-client';
import type { SouthPlusRateLimiter } from '../../infrastructure/coordination/southplus-rate-limiter';
import { assertHttpSuccess, type HttpClient } from '../../infrastructure/http/http-client';
import type { KeyValueStorage } from '../../infrastructure/storage/key-value-storage';
import type { QueryContext, ResourceProvider } from '../../services/provider';
import { parseSouthPlusResults, parseSouthPlusSearchForm } from './parser';

export class SouthPlusResourceProvider implements ResourceProvider {
  readonly id = 'southplus';
  readonly displayName = 'South Plus';

  constructor(
    private readonly http: HttpClient,
    private readonly storage: KeyValueStorage,
    private readonly queries: QueryClient,
    private readonly limiter: SouthPlusRateLimiter,
  ) {}

  supports(_code: RjCode): boolean {
    return true;
  }

  async search(code: RjCode, context: QueryContext = {}): Promise<ResourceResult[]> {
    const domain = await this.storage.get('last_forum_domain', 'www.south-plus.net');
    const key = cacheKeys.southPlus(code, domain);
    return this.queries.query(key, async () => {
      // The lease also enforces South Plus's minimum start-to-start cooldown, so it expires naturally.
      await this.limiter.acquire({ leaseMs: 16_000, maxWaitMs: 20_000 });
      const searchUrl = `https://${domain}/search.php`;
      const getResponse = assertHttpSuccess(await this.http.request({
        url: searchUrl,
        timeoutMs: 10_000,
        signal: context.signal,
        anonymous: false,
        diagnosticLabel: 'southplus.search-form',
      }));
      if (/\/login\.php(?:[?#]|$)/i.test(getResponse.finalUrl)) {
        throw new AppError('unauthorized', `South Plus login is required on ${domain}`);
      }
      const body = parseSouthPlusSearchForm(getResponse.text, code);
      const postResponse = assertHttpSuccess(await this.http.request({
        method: 'POST',
        url: `${searchUrl}?step=2`,
        body,
        timeoutMs: 10_000,
        signal: context.signal,
        anonymous: false,
        diagnosticLabel: 'southplus.search-submit',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Referer: searchUrl,
          Origin: `https://${domain}`,
        },
      }));
      if (/\/login\.php(?:[?#]|$)/i.test(postResponse.finalUrl)) {
        throw new AppError('unauthorized', `South Plus login is required on ${domain}`);
      }
      return parseSouthPlusResults(postResponse.text, domain);
    }, {
      force: context.force,
      ttlMs: (value) => Array.isArray(value) && value.length === 0
        ? 30 * 60_000
        : 12 * 60 * 60_000,
    });
  }
}
