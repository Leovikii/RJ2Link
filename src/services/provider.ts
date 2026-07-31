import type { RjCode } from '../domain/rj-code';
import type { ResourceResult, WorkSummary } from '../domain/work';

export interface QueryContext {
  force?: boolean;
  signal?: AbortSignal;
  priority?: 'interaction' | 'prefetch';
}

export interface MetadataProvider {
  readonly id: string;
  supports(code: RjCode): boolean;
  getWork(code: RjCode, context?: QueryContext): Promise<WorkSummary>;
  isWorkCached?(code: RjCode): Promise<boolean>;
  prefetchWork?(code: RjCode, context?: QueryContext): Promise<void>;
}

export interface ResourceProvider {
  readonly id: string;
  readonly displayName: string;
  supports(code: RjCode): boolean;
  search(code: RjCode, context?: QueryContext): Promise<ResourceResult[]>;
}
