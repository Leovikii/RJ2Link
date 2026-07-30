export type DiagnosticPhase = 'start' | 'load' | 'error' | 'timeout' | 'abort';
export type DiagnosticTransport = 'legacy' | 'modern' | 'injected' | 'unavailable';

export interface HttpDiagnosticInput {
  label?: string;
  phase: DiagnosticPhase;
  method: 'GET' | 'POST';
  url: string;
  transport: DiagnosticTransport;
  durationMs?: number;
  status?: number;
  statusText?: string;
  cause?: unknown;
}

export interface DiagnosticRecorder {
  record(input: HttpDiagnosticInput): void;
}

export interface DiagnosticReportSource {
  format(): string;
}

interface DiagnosticEntry {
  timestamp: string;
  label: string;
  phase: DiagnosticPhase;
  method: 'GET' | 'POST';
  url: string;
  transport: DiagnosticTransport;
  durationMs?: number;
  status?: number;
  statusText?: string;
  details?: Record<string, string | number | boolean>;
}

const SAFE_CAUSE_KEYS = ['readyState', 'status', 'statusText', 'error', 'message'] as const;
const URL_PATTERN = /https?:\/\/[^\s"'<>]+/giu;
const CREDENTIAL_PATTERN = /\b(authorization|cookie|set-cookie)\s*[:=]\s*[^\s,;]+/giu;

function sanitizeUrl(value: string): string {
  try {
    const url = new URL(value);
    return `${url.origin}${url.pathname}`;
  } catch {
    return '(invalid-url)';
  }
}

function sanitizeText(value: string): string {
  return value
    .replace(URL_PATTERN, (url) => sanitizeUrl(url))
    .replace(CREDENTIAL_PATTERN, '$1=[redacted]')
    .slice(0, 160);
}

function safeCauseDetails(cause: unknown): Record<string, string | number | boolean> | undefined {
  if (typeof cause !== 'object' || cause === null) return undefined;
  const source = cause as Record<string, unknown>;
  const details: Record<string, string | number | boolean> = {};
  for (const key of SAFE_CAUSE_KEYS) {
    const value = source[key];
    if (typeof value === 'string') details[key] = sanitizeText(value);
    if (typeof value === 'number' && Number.isFinite(value)) details[key] = value;
    if (typeof value === 'boolean') details[key] = value;
  }
  return Object.keys(details).length > 0 ? details : undefined;
}

export class DiagnosticBuffer implements DiagnosticRecorder, DiagnosticReportSource {
  private readonly entries: DiagnosticEntry[] = [];

  constructor(
    private readonly capacity = 50,
    private readonly now: () => Date = () => new Date(),
  ) {}

  record(input: HttpDiagnosticInput): void {
    const causeDetails = safeCauseDetails(input.cause);
    const status = input.status
      ?? (typeof causeDetails?.status === 'number' ? causeDetails.status : undefined);
    const statusText = input.statusText
      ?? (typeof causeDetails?.statusText === 'string' ? causeDetails.statusText : undefined);
    const details = causeDetails ? { ...causeDetails } : undefined;
    if (details) {
      delete details.status;
      delete details.statusText;
    }

    this.entries.push({
      timestamp: this.now().toISOString(),
      label: sanitizeText(input.label ?? 'unlabeled'),
      phase: input.phase,
      method: input.method,
      url: sanitizeUrl(input.url),
      transport: input.transport,
      durationMs: input.durationMs === undefined ? undefined : Math.max(0, Math.round(input.durationMs)),
      status,
      statusText: statusText === undefined ? undefined : sanitizeText(statusText),
      details: details && Object.keys(details).length > 0 ? details : undefined,
    });
    if (this.entries.length > this.capacity) {
      this.entries.splice(0, this.entries.length - this.capacity);
    }
  }

  format(): string {
    const lines = [
      'RJ Warp Gate diagnostic log',
      `Generated: ${this.now().toISOString()}`,
      `Entries: ${this.entries.length}`,
    ];
    for (const entry of this.entries) {
      const fields = [
        `[${entry.timestamp}]`,
        entry.label,
        entry.phase,
        entry.method,
        entry.url,
        `transport=${entry.transport}`,
      ];
      if (entry.durationMs !== undefined) fields.push(`durationMs=${entry.durationMs}`);
      if (entry.status !== undefined) fields.push(`status=${entry.status}`);
      if (entry.statusText) fields.push(`statusText=${JSON.stringify(entry.statusText)}`);
      if (entry.details) fields.push(`details=${JSON.stringify(entry.details)}`);
      lines.push(fields.join(' '));
    }
    return lines.join('\n');
  }
}
