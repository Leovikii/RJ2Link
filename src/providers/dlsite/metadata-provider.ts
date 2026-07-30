import type { RjCode } from '../../domain/rj-code';
import type { WorkSummary } from '../../domain/work';
import { AppError } from '../../domain/errors';
import { cacheKeys } from '../../infrastructure/cache/cache-keys';
import type { QueryClient } from '../../infrastructure/cache/query-client';
import { assertHttpSuccess, parseJson, type HttpClient } from '../../infrastructure/http/http-client';
import type { MetadataProvider, QueryContext } from '../../services/provider';
import { mergeDlsiteApi1, parseDlsiteApi1Payload, parseDlsiteApi2Payload } from './parser';

export class DlsiteMetadataProvider implements MetadataProvider {
  readonly id = 'dlsite';

  constructor(
    private readonly http: HttpClient,
    private readonly queries: QueryClient,
  ) {}

  supports(_code: RjCode): boolean {
    return true;
  }

  async getWork(code: RjCode, context: QueryContext = {}): Promise<WorkSummary> {
    const key = cacheKeys.work(code);
    return this.queries.query(key, async () => {
      let api2: WorkSummary | null = null;
      try {
        api2 = await this.getApi2(code, context);
      } catch (error) {
        if (error instanceof AppError && error.kind === 'aborted') throw error;
      }
      try {
        const payload = await this.getApi1(code, context);
        return api2 ? mergeDlsiteApi1(api2, payload) : parseDlsiteApi1Payload(payload, code);
      } catch (error) {
        if (error instanceof AppError && error.kind === 'aborted') throw error;
        if (api2) return api2;
        throw error;
      }
    }, { force: context.force, ttlMs: 6 * 60 * 60_000 });
  }

  async prefetchWork(code: RjCode, context: QueryContext = {}): Promise<void> {
    await this.getApi2(code, { ...context, priority: 'prefetch' });
  }

  isWorkCached(code: RjCode): Promise<boolean> {
    return this.queries.hasCached(this.api2CacheKey(code));
  }

  private async getApi2(code: RjCode, context: QueryContext): Promise<WorkSummary> {
    const key = this.api2CacheKey(code);
    return this.queries.query(key, async () => {
      const response = assertHttpSuccess(await this.http.request({
        url: `https://www.dlsite.com/maniax/api/=/product.json?workno=${code}`,
        timeoutMs: context.priority === 'prefetch' ? 6_000 : 10_000,
        signal: context.signal,
      }));
      return parseDlsiteApi2Payload(parseJson<unknown>(response), code);
    }, { force: context.force, ttlMs: 24 * 60 * 60_000 });
  }

  private async getApi1(code: RjCode, context: QueryContext): Promise<unknown> {
    const response = assertHttpSuccess(await this.http.request({
      url: `https://www.dlsite.com/maniax/product/info/ajax?product_id=${code}&cdn_cache_min=1`,
      timeoutMs: context.priority === 'prefetch' ? 6_000 : 10_000,
      signal: context.signal,
    }));
    return parseJson<unknown>(response);
  }

  private api2CacheKey(code: RjCode): string {
    return `${cacheKeys.work(code)}:api2`;
  }
}
