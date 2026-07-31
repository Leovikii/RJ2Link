import type { RjCode } from '../../domain/rj-code';
import type { ResourceResult } from '../../domain/work';
import { AppError } from '../../domain/errors';
import { cacheKeys } from '../../infrastructure/cache/cache-keys';
import type { QueryClient } from '../../infrastructure/cache/query-client';
import type { HttpClient } from '../../infrastructure/http/http-client';
import type { QueryContext, ResourceProvider } from '../../services/provider';

export class AsmrOneResourceProvider implements ResourceProvider {
  readonly id = 'asmr-one';
  readonly displayName = 'ASMR ONE';

  constructor(private readonly http: HttpClient, private readonly queries: QueryClient) {}

  supports(code: RjCode): boolean {
    return code.startsWith('RJ');
  }

  search(code: RjCode, context: QueryContext = {}): Promise<ResourceResult[]> {
    return this.queries.query(cacheKeys.asmrOne(code), async () => {
      const response = await this.http.request({
        url: `https://api.asmr-200.com/api/work/${code.slice(2)}`,
        headers: { Referer: 'https://www.asmr.one/' },
        timeoutMs: 8_000,
        signal: context.signal,
      });
      if (response.status === 404) return [];
      if (response.status < 200 || response.status >= 300) {
        throw new AppError('http', `ASMR ONE returned ${response.status}`, { status: response.status });
      }
      return [{
        id: code,
        providerId: this.id,
        title: code,
        url: `https://www.asmr.one/work/${code}`,
      }];
    }, {
      force: context.force,
      ttlMs: (value) => Array.isArray(value) && value.length === 0
        ? 6 * 60 * 60_000
        : 24 * 60 * 60_000,
    });
  }
}
