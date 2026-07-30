import { cleanup, render, screen, waitFor } from '@testing-library/preact';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PopupController } from '../../src/application/popup-controller';
import { ResourceController } from '../../src/application/resource-controller';
import { parseRjCode } from '../../src/domain/rj-code';
import type { WorkSummary } from '../../src/domain/work';
import type { TextClipboard } from '../../src/infrastructure/gm/clipboard';
import { ProviderRegistry } from '../../src/services/provider-registry';
import { SouthPlusApp } from '../../src/ui/southplus/app';

const code = parseRjCode('RJ123456')!;
const work: WorkSummary = {
  rjCode: code,
  title: 'Test Work',
  imageUrl: 'https://example.test/cover.jpg',
  circle: 'Test Circle',
  sales: 42,
  ratingAverage: 4.5,
  ratingCount: 10,
  releaseDate: '2026-07-25 00:00:00',
  ageRating: 'R18',
  workType: 'Voice / ASMR',
  workTypeId: 0,
  fileSize: 1_048_576,
  voiceActors: ['Voice Actor'],
  genres: ['Genre Tag'],
  isGirls: false,
};

beforeEach(() => {
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1024 });
  Object.defineProperty(window, 'innerHeight', { configurable: true, value: 768 });
});

afterEach(cleanup);

describe('South Plus metadata popup', () => {
  it('places actions under the cover and differentiates voice and genre tags', async () => {
    const registry = new ProviderRegistry()
      .registerMetadata({ id: 'dlsite', supports: () => true, getWork: async () => work })
      .registerResource({
        id: 'asmr-one',
        displayName: 'ASMR ONE',
        supports: () => true,
        search: async () => [],
      });
    const resources = new ResourceController(registry);
    const popup = new PopupController();
    const clipboard: TextClipboard = { writeText: vi.fn(async () => undefined) };
    popup.open(code, { left: 100, top: 100, width: 20, height: 20 } as DOMRect, true);
    const { container } = render(
      <SouthPlusApp
        popup={popup}
        resources={resources}
        clipboard={clipboard}
        cancelHide={() => {}}
        startHide={() => {}}
      />,
    );

    await screen.findByText('Test Work');
    await waitFor(() => expect(container.querySelector('.rwg-work__cover-column')).toBeTruthy());
    const coverColumn = container.querySelector('.rwg-work__cover-column')!;
    expect(coverColumn.querySelectorAll('.rwg-action')).toHaveLength(2);
    expect(screen.getByText('2026-07-25')).toBeTruthy();
    expect(screen.queryByText(/00:00:00/)).toBeNull();
    expect(container.querySelector('.rwg-badge--voice')?.textContent).toBe('Voice Actor');
    expect(container.querySelector('.rwg-badge--genre')?.textContent).toBe('Genre Tag');
    resources.dispose();
  });
});
