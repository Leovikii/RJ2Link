import { describe, expect, it, vi } from 'vitest';
import { parseRjCode } from '../../src/domain/rj-code';
import { PrefetchController, selectPrefetchCandidates } from '../../src/application/prefetch-controller';

const codes = ['RJ100000', 'RJ200000', 'RJ300000'].map((value) => parseRjCode(value)!);

describe('prefetch', () => {
  it('selects visible and nearest unique candidates', () => {
    expect(selectPrefetchCandidates([
      { code: codes[0], top: 500, visible: false, order: 0 },
      { code: codes[1], top: 200, visible: true, order: 1 },
      { code: codes[0], top: 100, visible: true, order: 2 },
      { code: codes[2], top: 50, visible: false, order: 3 },
    ])).toEqual([codes[0], codes[1]]);
  });

  it('prefetches at most two candidates sequentially', async () => {
    const calls: string[] = [];
    let active = 0;
    const provider = {
      id: 'dlsite',
      supports: () => true,
      getWork: async () => { throw new Error(); },
      prefetchWork: vi.fn(async (code: string) => {
        expect(active).toBe(0);
        active += 1;
        calls.push(code);
        await Promise.resolve();
        active -= 1;
      }),
    };
    const controller = new PrefetchController(
      provider,
      () => ({ online: true, visible: true, saveData: false, effectiveType: '4g' }),
    );
    await controller.run(codes);
    expect(calls).toEqual(codes.slice(0, 2));
    expect(controller.consumedBudget).toBe(2);
  });

  it('skips cached candidates without consuming the network budget', async () => {
    const prefetchWork = vi.fn(async (_code: string) => {});
    const provider = {
      id: 'dlsite',
      supports: () => true,
      getWork: async () => { throw new Error(); },
      isWorkCached: vi.fn(async (code: string) => code === codes[0]),
      prefetchWork,
    };
    const controller = new PrefetchController(
      provider,
      () => ({ online: true, visible: true, saveData: false, effectiveType: '4g' }),
    );

    await controller.run(codes);

    expect(prefetchWork.mock.calls.map(([code]) => code)).toEqual(codes.slice(1));
    expect(controller.consumedBudget).toBe(2);
  });

  it.each([
    { online: false, visible: true, saveData: false },
    { online: true, visible: false, saveData: false },
    { online: true, visible: true, saveData: true },
    { online: true, visible: true, saveData: false, effectiveType: '2g' },
  ])('skips disallowed network state %#', async (network) => {
    const prefetchWork = vi.fn();
    const controller = new PrefetchController(
      { id: 'dlsite', supports: () => true, getWork: async () => { throw new Error(); }, prefetchWork },
      () => network,
    );
    await controller.run(codes);
    expect(prefetchWork).not.toHaveBeenCalled();
  });

  it('stops before the next candidate when an interaction becomes busy', async () => {
    let busy = false;
    const prefetchWork = vi.fn(async () => { busy = true; });
    const controller = new PrefetchController(
      { id: 'dlsite', supports: () => true, getWork: async () => { throw new Error(); }, prefetchWork },
      () => ({ online: true, visible: true, saveData: false, effectiveType: '4g' }),
      () => busy,
    );

    await controller.run(codes);

    expect(prefetchWork).toHaveBeenCalledOnce();
  });
});
