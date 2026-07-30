import type { RjCode } from '../domain/rj-code';
import { toAppError } from '../domain/errors';
import type { QueryState } from '../domain/query-state';
import type { ResourceResult, WorkSummary } from '../domain/work';
import type { ProviderRegistry } from '../services/provider-registry';

export interface ResourceControllerState {
  code: RjCode | null;
  work: QueryState<WorkSummary>;
  resources: Record<string, QueryState<ResourceResult[]>>;
}

export interface LoadOptions {
  force?: boolean;
  work?: boolean;
  resources?: boolean;
  resourceProviderIds?: readonly string[];
  excludeResourceProviderIds?: readonly string[];
}

type Listener = () => void;

export class ResourceController {
  private state: ResourceControllerState = {
    code: null,
    work: { status: 'idle' },
    resources: {},
  };
  private readonly listeners = new Set<Listener>();
  private generation = 0;
  private abortController: AbortController | null = null;

  constructor(private readonly providers: ProviderRegistry) {}

  getSnapshot = (): ResourceControllerState => this.state;

  subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  isBusy(): boolean {
    return this.state.work.status === 'loading'
      || Object.values(this.state.resources).some((state) => state.status === 'loading');
  }

  getResourceProviderName(id: string): string {
    return this.providers.resource(id)?.displayName ?? id;
  }

  async load(code: RjCode, options: LoadOptions = {}): Promise<void> {
    if (this.state.code === code && this.isBusy()) return;
    const sameCode = this.state.code === code;
    const generation = ++this.generation;
    this.abortController?.abort();
    this.abortController = new AbortController();
    const signal = this.abortController.signal;
    const loadWork = options.work !== false;
    const loadResources = options.resources !== false;

    const allowed = options.resourceProviderIds ? new Set(options.resourceProviderIds) : null;
    const excluded = new Set(options.excludeResourceProviderIds ?? []);
    const resourceProviders = loadResources
      ? this.providers.resourcesFor(code).filter((provider) =>
        (!allowed || allowed.has(provider.id)) && !excluded.has(provider.id))
      : [];
    const resources: ResourceControllerState['resources'] = sameCode
      ? { ...this.state.resources }
      : {};
    for (const provider of resourceProviders) {
      const previous = sameCode ? this.state.resources[provider.id] : undefined;
      resources[provider.id] = previous?.status === 'success'
        ? { status: 'loading', previous: previous.data }
        : { status: 'loading' };
    }
    const previousWork = sameCode && this.state.work.status === 'success'
      ? this.state.work.data
      : undefined;
    this.replace({
      code,
      work: loadWork
        ? previousWork ? { status: 'loading', previous: previousWork } : { status: 'loading' }
        : sameCode ? this.state.work : { status: 'idle' },
      resources,
    });

    const tasks: Promise<void>[] = [];
    if (loadWork) {
      const metadata = this.providers.metadataFor(code)[0];
      if (!metadata) {
        this.patchIfCurrent(generation, code, { work: { status: 'empty' } });
      } else {
        tasks.push(metadata.getWork(code, { force: options.force, signal, priority: 'interaction' })
          .then((data) => this.patchIfCurrent(generation, code, { work: { status: 'success', data } }))
          .catch((error) => {
            if (signal.aborted) return;
            this.patchIfCurrent(generation, code, { work: { status: 'error', error: toAppError(error) } });
          }));
      }
    }

    for (const provider of resourceProviders) {
      tasks.push(provider.search(code, { force: options.force, signal, priority: 'interaction' })
        .then((data) => this.patchResourceIfCurrent(
          generation,
          code,
          provider.id,
          data.length ? { status: 'success', data } : { status: 'empty' },
        ))
        .catch((error) => {
          if (signal.aborted) return;
          this.patchResourceIfCurrent(generation, code, provider.id, {
            status: 'error',
            error: toAppError(error),
          });
        }));
    }
    await Promise.allSettled(tasks);
  }

  refresh(code: RjCode, options: Omit<LoadOptions, 'force'> = {}): Promise<void> {
    return this.load(code, { ...options, force: true });
  }

  dispose(): void {
    this.generation += 1;
    this.abortController?.abort();
    this.abortController = null;
    this.listeners.clear();
  }

  private patchIfCurrent(
    generation: number,
    code: RjCode,
    patch: Partial<ResourceControllerState>,
  ): void {
    if (generation !== this.generation || this.state.code !== code) return;
    this.replace({ ...this.state, ...patch });
  }

  private patchResourceIfCurrent(
    generation: number,
    code: RjCode,
    providerId: string,
    resourceState: QueryState<ResourceResult[]>,
  ): void {
    if (generation !== this.generation || this.state.code !== code) return;
    this.replace({
      ...this.state,
      resources: { ...this.state.resources, [providerId]: resourceState },
    });
  }

  private replace(state: ResourceControllerState): void {
    this.state = state;
    for (const listener of this.listeners) listener();
  }
}
