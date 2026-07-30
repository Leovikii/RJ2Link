import { AppError } from '../../domain/errors';
import type {
  DiagnosticRecorder,
  DiagnosticTransport,
} from '../logging/diagnostics';

export interface HttpRequest {
  method?: 'GET' | 'POST';
  url: string;
  headers?: Record<string, string>;
  body?: string;
  timeoutMs?: number;
  anonymous?: boolean;
  signal?: AbortSignal;
  diagnosticLabel?: string;
}

export interface HttpResponse {
  status: number;
  statusText: string;
  text: string;
  finalUrl: string;
  headers: string;
}

export interface HttpClient {
  request(request: HttpRequest): Promise<HttpResponse>;
}

export type GmRequester = (options: GmRequestOptions) => GmRequestHandle | void;

function defaultRequester(): { requester: GmRequester; transport: DiagnosticTransport } {
  if (typeof GM_xmlhttpRequest === 'function') {
    return { requester: GM_xmlhttpRequest, transport: 'legacy' };
  }
  if (typeof GM !== 'undefined' && GM?.xmlHttpRequest) {
    return { requester: GM.xmlHttpRequest.bind(GM), transport: 'modern' };
  }
  throw new AppError('network', 'GM.xmlHttpRequest is unavailable');
}

export class GmHttpClient implements HttpClient {
  constructor(
    private readonly requester?: GmRequester,
    private readonly defaultTimeoutMs = 10_000,
    private readonly diagnostics?: DiagnosticRecorder,
  ) {}

  request(request: HttpRequest): Promise<HttpResponse> {
    const method = request.method ?? 'GET';
    const startedAt = Date.now();
    let activeRequester: GmRequester;
    let transport: DiagnosticTransport;

    if (request.signal?.aborted) {
      this.diagnostics?.record({
        label: request.diagnosticLabel,
        phase: 'abort',
        method,
        url: request.url,
        transport: this.requester ? 'injected' : 'unavailable',
        durationMs: 0,
      });
      return Promise.reject(new AppError('aborted', 'Request aborted'));
    }

    try {
      if (this.requester) {
        activeRequester = this.requester;
        transport = 'injected';
      } else {
        ({ requester: activeRequester, transport } = defaultRequester());
      }
    } catch (cause) {
      this.diagnostics?.record({
        label: request.diagnosticLabel,
        phase: 'start',
        method,
        url: request.url,
        transport: 'unavailable',
      });
      this.diagnostics?.record({
        label: request.diagnosticLabel,
        phase: 'error',
        method,
        url: request.url,
        transport: 'unavailable',
        durationMs: Date.now() - startedAt,
        cause,
      });
      return Promise.reject(cause instanceof AppError
        ? cause
        : new AppError('network', 'Unable to start network request', { cause }));
    }

    this.diagnostics?.record({
      label: request.diagnosticLabel,
      phase: 'start',
      method,
      url: request.url,
      transport,
    });

    return new Promise<HttpResponse>((resolve, reject) => {
      let settled = false;
      let handle: GmRequestHandle | void;

      const finish = (callback: () => void) => {
        if (settled) return;
        settled = true;
        request.signal?.removeEventListener('abort', onSignalAbort);
        callback();
      };

      const onSignalAbort = () => {
        if (handle) handle.abort();
        finish(() => {
          this.diagnostics?.record({
            label: request.diagnosticLabel,
            phase: 'abort',
            method,
            url: request.url,
            transport,
            durationMs: Date.now() - startedAt,
          });
          reject(new AppError('aborted', 'Request aborted'));
        });
      };

      try {
        handle = activeRequester({
          method,
          url: request.url,
          headers: request.headers,
          data: request.body,
          timeout: request.timeoutMs ?? this.defaultTimeoutMs,
          anonymous: request.anonymous,
          onload: (response) => finish(() => {
            this.diagnostics?.record({
              label: request.diagnosticLabel,
              phase: 'load',
              method,
              url: request.url,
              transport,
              durationMs: Date.now() - startedAt,
              status: response.status,
              statusText: response.statusText,
            });
            resolve({
              status: response.status,
              statusText: response.statusText,
              text: response.responseText,
              finalUrl: response.finalUrl || request.url,
              headers: response.responseHeaders ?? '',
            });
          }),
          onerror: (cause) => finish(() => {
            this.diagnostics?.record({
              label: request.diagnosticLabel,
              phase: 'error',
              method,
              url: request.url,
              transport,
              durationMs: Date.now() - startedAt,
              cause,
            });
            reject(new AppError('network', 'Network request failed', { cause }));
          }),
          ontimeout: (cause) => finish(() => {
            this.diagnostics?.record({
              label: request.diagnosticLabel,
              phase: 'timeout',
              method,
              url: request.url,
              transport,
              durationMs: Date.now() - startedAt,
              cause,
            });
            reject(new AppError('timeout', 'Network request timed out', { cause }));
          }),
          onabort: (cause) => finish(() => {
            this.diagnostics?.record({
              label: request.diagnosticLabel,
              phase: 'abort',
              method,
              url: request.url,
              transport,
              durationMs: Date.now() - startedAt,
              cause,
            });
            reject(new AppError('aborted', 'Network request aborted', { cause }));
          }),
        });
        if (!settled) request.signal?.addEventListener('abort', onSignalAbort, { once: true });
      } catch (cause) {
        finish(() => {
          this.diagnostics?.record({
            label: request.diagnosticLabel,
            phase: 'error',
            method,
            url: request.url,
            transport,
            durationMs: Date.now() - startedAt,
            cause,
          });
          reject(cause instanceof AppError
            ? cause
            : new AppError('network', 'Unable to start network request', { cause }));
        });
      }
    });
  }
}

export function assertHttpSuccess(response: HttpResponse): HttpResponse {
  if (response.status >= 200 && response.status < 300) return response;
  if (response.status === 404) {
    throw new AppError('not-found', 'Resource not found', { status: 404 });
  }
  if (response.status === 401 || response.status === 403) {
    throw new AppError('unauthorized', 'Request is not authorized', { status: response.status });
  }
  if (response.status === 429) {
    throw new AppError('rate-limited', 'Request was rate limited', { status: 429 });
  }
  throw new AppError('http', `Unexpected HTTP status ${response.status}`, {
    status: response.status,
  });
}

export function parseJson<T>(response: HttpResponse): T {
  try {
    return JSON.parse(response.text) as T;
  } catch (cause) {
    throw new AppError('parse', 'Response was not valid JSON', { cause });
  }
}
