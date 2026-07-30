interface TrustedTypePolicyLike {
  createHTML(input: string): string | TrustedHTML;
}

interface TrustedTypePolicyFactoryLike {
  defaultPolicy?: TrustedTypePolicyLike;
  createPolicy(
    name: string,
    rules: { createHTML(input: string): string },
  ): TrustedTypePolicyLike;
}

interface Window {
  trustedTypes?: TrustedTypePolicyFactoryLike;
}

interface NavigatorConnection {
  saveData?: boolean;
  effectiveType?: string;
}

interface Navigator {
  connection?: NavigatorConnection;
}

interface GmRequestResponse {
  readyState: number;
  status: number;
  statusText: string;
  responseText: string;
  finalUrl: string;
  responseHeaders?: string;
}

interface GmRequestOptions {
  method: string;
  url: string;
  headers?: Record<string, string>;
  data?: string;
  timeout?: number;
  anonymous?: boolean;
  onload?(response: GmRequestResponse): void;
  onerror?(response: unknown): void;
  ontimeout?(response: unknown): void;
  onabort?(response: unknown): void;
}

interface GmRequestHandle {
  abort(): void;
}

interface GmModernApi {
  xmlHttpRequest(options: GmRequestOptions): GmRequestHandle | void;
}

interface GmInfo {
  script: { name: string };
}

declare const GM: GmModernApi | undefined;
declare const GM_info: GmInfo | undefined;
declare function GM_xmlhttpRequest(options: GmRequestOptions): GmRequestHandle | void;
declare function GM_getValue<T>(key: string, fallback?: T): T | Promise<T>;
declare function GM_setValue<T>(key: string, value: T): void | Promise<void>;
declare function GM_deleteValue(key: string): void | Promise<void>;
declare function GM_listValues(): string[] | Promise<string[]>;
declare function GM_setClipboard(value: string, type?: string): void | Promise<void>;
declare function GM_openInTab(url: string, options?: unknown): unknown;
declare function GM_registerMenuCommand(label: string, callback: () => void): number;
declare function GM_unregisterMenuCommand(id: number): void;
