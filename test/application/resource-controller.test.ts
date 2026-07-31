import { describe, expect, it } from 'vitest';
import { ResourceController } from '../../src/application/resource-controller';
import { parseRjCode, type RjCode } from '../../src/domain/rj-code';
import type { WorkSummary } from '../../src/domain/work';
import { ProviderRegistry } from '../../src/services/provider-registry';

const firstCode = parseRjCode('RJ100000')!;
const secondCode = parseRjCode('RJ200000')!;

function summary(code: RjCode, title: string): WorkSummary {
  return {
    rjCode: code, title, imageUrl: null, circle: null, sales: null,
    ratingAverage: null, ratingCount: null, releaseDate: null, ageRating: null,
    workType: null, workTypeId: -1, fileSize: null, voiceActors: [], genres: [], isGirls: false,
  };
}

describe('ResourceController', () => {
  it('does not allow an older response to overwrite a newer code', async () => {
    let resolveFirst!: (value: WorkSummary) => void;
    const first = new Promise<WorkSummary>((resolve) => { resolveFirst = resolve; });
    const registry = new ProviderRegistry().registerMetadata({
      id: 'metadata',
      supports: () => true,
      getWork: (code) => code === firstCode ? first : Promise.resolve(summary(code, 'second')),
    });
    const controller = new ResourceController(registry);
    const firstLoad = controller.load(firstCode, { resources: false });
    await controller.load(secondCode, { resources: false });
    resolveFirst(summary(firstCode, 'first'));
    await firstLoad;
    expect(controller.getSnapshot().code).toBe(secondCode);
    expect(controller.getSnapshot().work).toMatchObject({ status: 'success', data: { title: 'second' } });
  });

  it('does not carry work data across codes when only resources are requested', async () => {
    const registry = new ProviderRegistry().registerMetadata({
      id: 'metadata',
      supports: () => true,
      getWork: (code) => Promise.resolve(summary(code, 'first')),
    });
    const controller = new ResourceController(registry);
    await controller.load(firstCode, { resources: false });

    await controller.load(secondCode, { work: false });

    expect(controller.getSnapshot()).toMatchObject({
      code: secondCode,
      work: { status: 'idle' },
    });
  });

  it('preserves completed providers during a partial same-code load', async () => {
    const registry = new ProviderRegistry()
      .registerResource({
        id: 'one', displayName: 'One', supports: () => true,
        search: async () => [{ id: 'one', providerId: 'one', title: 'One', url: 'https://one.test' }],
      })
      .registerResource({
        id: 'two', displayName: 'Two', supports: () => true,
        search: async () => [{ id: 'two', providerId: 'two', title: 'Two', url: 'https://two.test' }],
      });
    const controller = new ResourceController(registry);
    await controller.load(firstCode, { work: false, resourceProviderIds: ['one'] });

    await controller.load(firstCode, { work: false, resourceProviderIds: ['two'] });

    expect(controller.getSnapshot().resources.one.status).toBe('success');
    expect(controller.getSnapshot().resources.two.status).toBe('success');
  });

  it('does not start a duplicate force load while the same code is busy', async () => {
    let resolve!: (value: WorkSummary) => void;
    const pending = new Promise<WorkSummary>((done) => { resolve = done; });
    let calls = 0;
    const registry = new ProviderRegistry().registerMetadata({
      id: 'metadata', supports: () => true,
      getWork: () => { calls += 1; return pending; },
    });
    const controller = new ResourceController(registry);

    const firstLoad = controller.load(firstCode, { resources: false });
    await controller.refresh(firstCode, { resources: false });
    resolve(summary(firstCode, 'done'));
    await firstLoad;

    expect(calls).toBe(1);
  });
});
