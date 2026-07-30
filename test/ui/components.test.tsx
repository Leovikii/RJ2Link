import { cleanup, fireEvent, render, screen } from '@testing-library/preact';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ActionButton } from '../../src/ui/components/action-button';
import { PopupPanel } from '../../src/ui/components/popup-panel';

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
});
