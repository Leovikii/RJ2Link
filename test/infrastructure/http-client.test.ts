import { afterEach, describe, expect, it, vi } from 'vitest';
import { AppError } from '../../src/domain/errors';
import { GmHttpClient, assertHttpSuccess, parseJson } from '../../src/infrastructure/http/http-client';
import { DiagnosticBuffer } from '../../src/infrastructure/logging/diagnostics';

afterEach(() => vi.unstubAllGlobals());

describe('GmHttpClient', () => {
  it('maps a successful GM response', async () => {
    const client = new GmHttpClient((options) => {
      options.onload?.({
        readyState: 4,
        status: 200,
        statusText: 'OK',
        responseText: '{"ok":true}',
        finalUrl: 'https://example.test/final',
      });
    });

    const response = await client.request({ url: 'https://example.test' });
    expect(parseJson<{ ok: boolean }>(response)).toEqual({ ok: true });
    expect(response.finalUrl).toBe('https://example.test/final');
  });

  it('prefers the legacy Tampermonkey requester when both APIs exist', async () => {
    const legacy = vi.fn((options: GmRequestOptions) => {
      options.onload?.({
        readyState: 4,
        status: 200,
        statusText: 'OK',
        responseText: '',
        finalUrl: options.url,
      });
    });
    const modern = vi.fn();
    vi.stubGlobal('GM_xmlhttpRequest', legacy);
    vi.stubGlobal('GM', { xmlHttpRequest: modern });

    const diagnostics = new DiagnosticBuffer();
    await new GmHttpClient(undefined, 10_000, diagnostics).request({
      url: 'https://example.test',
      diagnosticLabel: 'test.legacy',
    });

    expect(legacy).toHaveBeenCalledOnce();
    expect(modern).not.toHaveBeenCalled();
    expect(diagnostics.hasEntries()).toBe(false);
    expect(diagnostics.format()).toContain('Entries: 0');
  });

  it('records a redacted diagnostic for a failed POST request', async () => {
    const diagnostics = new DiagnosticBuffer(50, () => new Date('2026-07-30T12:00:00.000Z'));
    const client = new GmHttpClient((options) => {
      options.onerror?.({
        readyState: 4,
        status: 0,
        statusText: 'Blocked https://example.test/search.php?token=secret',
        error: 'Cookie=session-secret',
        responseText: 'private-response-body',
        responseHeaders: 'Set-Cookie: session-secret',
      });
    }, 10_000, diagnostics);

    await expect(client.request({
      method: 'POST',
      url: 'https://example.test/search.php?step=2&token=secret',
      headers: { Cookie: 'session-secret' },
      body: 'keyword=RJ123456&token=body-secret',
      diagnosticLabel: 'southplus.search-submit',
    })).rejects.toMatchObject({ kind: 'network' });

    const report = diagnostics.format();
    expect(diagnostics.hasEntries()).toBe(true);
    expect(report).toContain('southplus.search-submit error POST https://example.test/search.php transport=injected');
    expect(report).toContain('status=0');
    expect(report).toContain('readyState');
    expect(report).not.toContain('token=secret');
    expect(report).not.toContain('session-secret');
    expect(report).not.toContain('private-response-body');
    expect(report).not.toContain('keyword=RJ123456');
  });

  it.each([
    ['onerror', 'network'],
    ['ontimeout', 'timeout'],
    ['onabort', 'aborted'],
  ] as const)('maps %s to %s', async (callback, kind) => {
    const client = new GmHttpClient((options) => {
      options[callback]?.({});
    });
    await expect(client.request({ url: 'https://example.test' })).rejects.toMatchObject({ kind });
  });

  it('aborts the underlying request when AbortSignal fires', async () => {
    const abort = vi.fn();
    const client = new GmHttpClient(() => ({ abort }));
    const controller = new AbortController();
    const request = client.request({ url: 'https://example.test', signal: controller.signal });
    controller.abort();
    await expect(request).rejects.toMatchObject({ kind: 'aborted' });
    expect(abort).toHaveBeenCalledOnce();
  });

  it('does not retain an abort listener after a synchronous response', async () => {
    const abort = vi.fn();
    const client = new GmHttpClient((options) => {
      options.onload?.({
        readyState: 4,
        status: 200,
        statusText: 'OK',
        responseText: '',
        finalUrl: 'https://example.test',
      });
      return { abort };
    });
    const controller = new AbortController();

    await client.request({ url: 'https://example.test', signal: controller.signal });
    controller.abort();

    expect(abort).not.toHaveBeenCalled();
  });

  it('classifies HTTP status codes', () => {
    const response = { status: 404, statusText: '', text: '', finalUrl: '', headers: '' };
    expect(() => assertHttpSuccess(response)).toThrowError(AppError);
    try {
      assertHttpSuccess(response);
    } catch (error) {
      expect(error).toMatchObject({ kind: 'not-found', status: 404 });
    }
  });
});
