import { describe, expect, it, vi } from 'vitest';
import { parseRjCode } from '../../src/domain/rj-code';
import { QueryCache } from '../../src/infrastructure/cache/query-cache';
import { QueryClient } from '../../src/infrastructure/cache/query-client';
import { SouthPlusRateLimiter } from '../../src/infrastructure/coordination/southplus-rate-limiter';
import type { HttpClient, HttpRequest, HttpResponse } from '../../src/infrastructure/http/http-client';
import { MemoryKeyValueStorage } from '../../src/infrastructure/storage/key-value-storage';
import { SouthPlusResourceProvider } from '../../src/providers/southplus/resource-provider';

class FakeSouthPlusHttpClient implements HttpClient {
  readonly request = vi.fn(async (request: HttpRequest): Promise<HttpResponse> => ({
    status: 200,
    statusText: 'OK',
    finalUrl: request.url,
    headers: '',
    text: request.method === 'POST'
      ? '<table><tr><td><a href="read.php?tid-123.html">Result</a></td><td></td><td></td><td><a href="u.php?uid=4">Author</a> 2026-01-01</td></tr></table>'
      : '<form action="search.php" name="schform"><input name="keyword" value=""><input name="token" value="csrf"><select name="sch_time"><option value="30" selected>30</option></select></form>',
  }));
}

describe('SouthPlusResourceProvider', () => {
  it('replays the form, parses results, and reuses the persistent query cache', async () => {
    const storage = new MemoryKeyValueStorage();
    await storage.set('last_forum_domain', 'www.spring-plus.net');
    const http = new FakeSouthPlusHttpClient();
    const provider = new SouthPlusResourceProvider(
      http,
      storage,
      new QueryClient(new QueryCache(storage)),
      new SouthPlusRateLimiter(storage, () => 1_000, async () => {}, () => 'test-owner'),
    );
    const code = parseRjCode('rj123456')!;

    const first = await provider.search(code);
    const second = await provider.search(code);

    expect(first).toEqual(second);
    expect(first[0]).toMatchObject({
      id: '123',
      providerId: 'southplus',
      url: 'https://www.spring-plus.net/read.php?tid-123.html',
    });
    expect(http.request).toHaveBeenCalledTimes(2);
    const post = http.request.mock.calls[1][0];
    expect(http.request.mock.calls[0][0].anonymous).toBe(false);
    expect(post.anonymous).toBe(false);
    expect(post.method).toBe('POST');
    expect(new URLSearchParams(post.body).get('keyword')).toBe('RJ123456');
    expect(new URLSearchParams(post.body).get('token')).toBe('csrf');
  });
});
