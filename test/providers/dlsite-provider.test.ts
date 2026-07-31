import { describe, expect, it, vi } from 'vitest';
import { parseRjCode } from '../../src/domain/rj-code';
import { QueryCache } from '../../src/infrastructure/cache/query-cache';
import { QueryClient } from '../../src/infrastructure/cache/query-client';
import type { HttpClient, HttpRequest, HttpResponse } from '../../src/infrastructure/http/http-client';
import { MemoryKeyValueStorage } from '../../src/infrastructure/storage/key-value-storage';
import { DlsiteMetadataProvider } from '../../src/providers/dlsite/metadata-provider';

class FakeHttpClient implements HttpClient {
  readonly request = vi.fn(async (request: HttpRequest): Promise<HttpResponse> => {
    const api2 = request.url.includes('product.json');
    return {
      status: 200,
      statusText: 'OK',
      finalUrl: request.url,
      headers: '',
      text: JSON.stringify(api2
        ? [{ work_name: 'Work', work_type: 'SOU', dl_count: 1 }]
        : { RJ123456: { work_name: 'Work', dl_count: 2 } }),
    };
  });
}

describe('DlsiteMetadataProvider', () => {
  it('reuses prefetched API2 data when the user opens the popup', async () => {
    const http = new FakeHttpClient();
    const provider = new DlsiteMetadataProvider(
      http,
      new QueryClient(new QueryCache(new MemoryKeyValueStorage())),
    );
    const code = parseRjCode('RJ123456')!;

    await provider.prefetchWork(code);
    const work = await provider.getWork(code);

    expect(work.sales).toBe(1);
    expect(http.request).toHaveBeenCalledTimes(2);
    expect(http.request.mock.calls.filter(([request]) => request.url.includes('product.json'))).toHaveLength(1);
  });
});

