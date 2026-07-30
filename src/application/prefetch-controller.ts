import type { RjCode } from '../domain/rj-code';
import type { MetadataProvider } from '../services/provider';

export interface PrefetchNetworkState {
  online: boolean;
  visible: boolean;
  saveData: boolean;
  effectiveType?: string;
}

export interface PrefetchCandidate {
  code: RjCode;
  top: number;
  visible: boolean;
  order: number;
}

export function selectPrefetchCandidates(
  candidates: readonly PrefetchCandidate[],
  limit = 2,
): RjCode[] {
  const byCode = new Map<RjCode, PrefetchCandidate>();
  for (const candidate of candidates) {
    const existing = byCode.get(candidate.code);
    if (!existing || candidate.visible && !existing.visible || candidate.top < existing.top) {
      byCode.set(candidate.code, candidate);
    }
  }
  return [...byCode.values()]
    .sort((a, b) => Number(b.visible) - Number(a.visible) || a.top - b.top || a.order - b.order)
    .slice(0, Math.max(0, limit))
    .map(({ code }) => code);
}

export function browserPrefetchNetworkState(): PrefetchNetworkState {
  return {
    online: navigator.onLine !== false,
    visible: document.visibilityState === 'visible',
    saveData: navigator.connection?.saveData === true,
    effectiveType: navigator.connection?.effectiveType,
  };
}

export function canPrefetch(state: PrefetchNetworkState): boolean {
  return state.online
    && state.visible
    && !state.saveData
    && state.effectiveType !== 'slow-2g'
    && state.effectiveType !== '2g';
}

export class PrefetchController {
  private consumed = 0;
  private cancelled = false;

  constructor(
    private readonly provider: MetadataProvider,
    private readonly networkState: () => PrefetchNetworkState = browserPrefetchNetworkState,
    private readonly interactionBusy: () => boolean = () => false,
    private readonly budget = 2,
  ) {}

  async run(codes: readonly RjCode[]): Promise<void> {
    for (const code of codes) {
      if (this.cancelled || this.consumed >= this.budget) return;
      if (!canPrefetch(this.networkState()) || this.interactionBusy()) return;
      if (!this.provider.supports(code) || !this.provider.prefetchWork) continue;
      try {
        if (await this.provider.isWorkCached?.(code)) continue;
      } catch {
        // A cache probe failure must not disable the normal best-effort prefetch path.
      }
      if (this.cancelled || !canPrefetch(this.networkState()) || this.interactionBusy()) return;
      this.consumed += 1;
      try {
        await this.provider.prefetchWork(code, { priority: 'prefetch' });
      } catch {
        // Background prefetch degrades silently by design.
      }
    }
  }

  cancel(): void {
    this.cancelled = true;
  }

  get consumedBudget(): number {
    return this.consumed;
  }
}

export function schedulePrefetch(task: () => void): () => void {
  if (typeof requestIdleCallback === 'function') {
    const id = requestIdleCallback(task, { timeout: 2_000 });
    return () => cancelIdleCallback(id);
  }
  const id = window.setTimeout(task, 800 + Math.random() * 400);
  return () => window.clearTimeout(id);
}
