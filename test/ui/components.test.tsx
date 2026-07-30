import { cleanup, fireEvent, render, screen } from '@testing-library/preact';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ActionButton } from '../../src/ui/components/action-button';
import { PopupPanel } from '../../src/ui/components/popup-panel';
import {
  calculateAttachedPopupPosition,
  calculatePopupPosition,
} from '../../src/ui/hooks/use-popup-position';

afterEach(cleanup);

describe('Preact shared components', () => {
  it('does not render a closed popup', () => {
    render(<PopupPanel display={false} title="Hidden" onClose={() => {}}>Body</PopupPanel>);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('renders and closes an open popup', () => {
    const close = vi.fn();
    render(<PopupPanel display title="Result" onClose={close}>Body</PopupPanel>);
    expect(screen.getByRole('dialog').textContent).toContain('Body');
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(close).toHaveBeenCalledOnce();
  });

  it('prevents navigation for a disabled action', () => {
    render(<ActionButton theme="asmrone" href={null} />);
    const link = screen.getByText('ASMR.one').closest('a')!;
    expect(link.getAttribute('href')).toBeNull();
    expect(link.getAttribute('aria-disabled')).toBe('true');
  });

  it('renders an enabled action as an external navigation link', () => {
    render(<ActionButton theme="dlsite" href="https://www.dlsite.com/work/example" />);
    const link = screen.getByText('DLsite').closest('a')!;
    expect(link.getAttribute('href')).toBe('https://www.dlsite.com/work/example');
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('aria-disabled')).toBe('false');
    expect(link.classList.contains('is-disabled')).toBe(false);
  });

  it('clamps a large popup inside the viewport when neither side fully fits', () => {
    expect(calculatePopupPosition(416, 300, { width: 1024, height: 768 }, 650, 680)).toEqual({
      left: '10px',
      top: '10px',
    });
  });

  it('attaches a resource popup above a bottom-right FAB', () => {
    expect(calculateAttachedPopupPosition(
      { left: 820, right: 936, top: 680, bottom: 738 },
      { width: 960, height: 768 },
    )).toMatchObject({
      left: '576px',
      bottom: '100px',
      width: '360px',
    });
  });
});
