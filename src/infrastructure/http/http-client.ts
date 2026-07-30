import { AppError } from '../../domain/errors';

export interface HttpRequest {
  method?: 'GET' | 'POST';
  url: string;
  headers?: Record<string, string>;
  body?: string;
  timeoutMs?: number;
  anonymous?: boolean;
  signal?: AbortSignal;
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

function defaultRequester(options: GmRequestOptions): GmRequestHandle | void {
  if (typeof GM_xmlhttpRequest === 'function') {
    return GM_xmlhttpRequest(options);
  }
  if (typeof GM !== 'undefined' && GM?.xmlHttpRequest) {
    return GM.xmlHttpRequest(options);
  }
  throw new AppError('network', 'GM.xmlHttpRequest is unavailable');
}

export class GmHttpClient implements HttpClient {
  constructor(
    private readonly requester: GmRequester = defaultRequester,
    private readonly defaultTimeoutMs = 10_000,
  ) {}

  request(request: HttpRequest): Promise<HttpResponse> {
    if (request.signal?.aborted) {
      return Promise.reject(new AppError('aborted', 'Request aborted'));
    }

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
        finish(() => reject(new AppError('aborted', 'Request aborted')));
      };

      try {
        handle = this.requester({
          method: request.method ?? 'GET',
          url: request.url,
          headers: request.headers,
          data: request.body,
          timeout: request.timeoutMs ?? this.defaultTimeoutMs,
          anonymous: request.anonymous,
          onload: (response) => finish(() => resolve({
            status: response.status,
            statusText: response.statusText,
            text: response.responseText,
            finalUrl: response.finalUrl || request.url,
            headers: response.responseHeaders ?? '',
          })),
          onerror: (cause) => finish(() => reject(
            new AppError('network', 'Network request failed', { cause }),
          )),
          ontimeout: (cause) => finish(() => reject(
            new AppError('timeout', 'Network request timed out', { cause }),
          )),
          onabort: (cause) => finish(() => reject(
            new AppError('aborted', 'Network request aborted', { cause }),
          )),
        });
        if (!settled) request.signal?.addEventListener('abort', onSignalAbort, { once: true });
      } catch (cause) {
        finish(() => reject(cause instanceof AppError
          ? cause
          : new AppError('network', 'Unable to start network request', { cause })));
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
