import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/preact';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ResourceController } from '../../src/application/resource-controller';
import { localize } from '../../src/config/localization';
import { AppError } from '../../src/domain/errors';
import { parseRjCode } from '../../src/domain/rj-code';
import { MemoryKeyValueStorage } from '../../src/infrastructure/storage/key-value-storage';
import type { TextClipboard } from '../../src/infrastructure/gm/clipboard';
import { ProviderRegistry } from '../../src/services/provider-registry';
import { DlsiteApp } from '../../src/ui/dlsite/app';
import type { ResourceResult } from '../../src/domain/work';

const code = parseRjCode('RJ123456')!;

beforeEach(() => {
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1024 });
});

afterEach(cleanup);

function renderApp(search: () => Promise<ResourceResult[]>) {
  const registry = new ProviderRegistry().registerResource({
    id: 'southplus',
    displayName: 'South Plus',
    supports: () => true,
    search,
  });
  const controller = new ResourceController(registry);
  const clipboard: TextClipboard = { writeText: vi.fn(async () => undefined) };
  render(
    <DlsiteApp
      code={code}
      controller={controller}
      storage={new MemoryKeyValueStorage()}
      diagnostics={{ format: () => 'redacted diagnostic report' }}
      clipboard={clipboard}
    />,
  );
  return { controller, clipboard };
}

describe('DLsite app interactions', () => {
  it('opens the popup on hover and exposes retry after an error', async () => {
    const search = vi.fn<() => Promise<never[]>>(
      async () => { throw new AppError('unauthorized', 'Login required'); },
    );
    const { controller, clipboard } = renderApp(search);
    const trigger = await screen.findByRole('button', { name: 'RJ Warp Gate · SP 0' });

    fireEvent.mouseEnter(trigger);

    expect(screen.getByRole('dialog', { name: 'Search Result' })).toBeTruthy();
    expect(screen.getByText('Login required')).toBeTruthy();
    fireEvent.click(trigger);
    expect(screen.getByRole('dialog', { name: 'Search Result' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: localize('copy_diagnostics') }));
    await waitFor(() => expect(clipboard.writeText).toHaveBeenCalledWith('redacted diagnostic report'));
    expect(screen.getByRole('button', { name: localize('diagnostics_copied') })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: localize('click_to_retry') }));
    await waitFor(() => expect(search).toHaveBeenCalledTimes(2));
    expect(screen.getByRole('dialog', { name: 'Search Result' })).toBeTruthy();
    controller.dispose();
  });

  it('opens empty results on the first click without silently retrying', async () => {
    const search = vi.fn<() => Promise<never[]>>(async () => []);
    const { controller } = renderApp(search);
    const trigger = await screen.findByRole('button', { name: 'RJ Warp Gate · SP 0' });

    fireEvent.click(trigger);

    expect(screen.getByRole('dialog', { name: 'Search Result' })).toBeTruthy();
    expect(search).toHaveBeenCalledOnce();
    controller.dispose();
  });

  it('shows resource dates without time components', async () => {
    const search = vi.fn<() => Promise<ResourceResult[]>>(async () => [{
      id: '1',
      providerId: 'southplus',
      title: 'Forum result',
      url: 'https://example.test/result',
      author: 'Author',
      date: '2026-07-30 15:50',
    }]);
    const { controller } = renderApp(search);
    const trigger = await screen.findByRole('button', { name: 'RJ Warp Gate · SP 1' });

    fireEvent.click(trigger);

    expect(screen.getByText('Author 2026-07-30')).toBeTruthy();
    expect(screen.queryByText(/15:50/u)).toBeNull();
    controller.dispose();
  });

  it('uses a closable bottom-sheet interaction on mobile', async () => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 390 });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 844 });
    const search = vi.fn<() => Promise<ResourceResult[]>>(async () => []);
    const { controller } = renderApp(search);
    const trigger = await screen.findByRole('button', { name: 'RJ Warp Gate · SP 0' });

    fireEvent.click(trigger);

    expect(screen.getByRole('dialog', { name: 'Search Result' })).toBeTruthy();
    expect(trigger.classList.contains('is-open')).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('dialog', { name: 'Search Result' })).toBeNull();
    controller.dispose();
  });
});
