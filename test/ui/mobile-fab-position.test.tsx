import { cleanup, fireEvent, render } from '@testing-library/preact';
import { afterEach, describe, expect, it } from 'vitest';
import { MemoryKeyValueStorage } from '../../src/infrastructure/storage/key-value-storage';
import { clampFabPosition, snapFabPosition, useMobileFabPosition } from '../../src/ui/hooks/use-mobile-fab-position';

afterEach(cleanup);

function DragHarness() {
  const fab = useMobileFabPosition(new MemoryKeyValueStorage());
  return <button
    ref={fab.buttonRef}
    style={fab.style}
    onPointerDown={fab.onPointerDown}
    onPointerMove={fab.onPointerMove}
    onPointerUp={fab.onPointerUp}
    onPointerCancel={fab.onPointerCancel}
  >Drag</button>;
}

describe('mobile FAB positioning', () => {
  it('clamps a dragged position inside the viewport', () => {
    expect(clampFabPosition(
      { x: 500, y: -20 },
      { width: 360, height: 640 },
      { width: 64, height: 48 },
    )).toEqual({ x: 296, y: 0 });
  });

  it('snaps to the nearest horizontal edge', () => {
    const viewport = { width: 360, height: 640 };
    const element = { width: 64, height: 48 };
    expect(snapFabPosition({ x: 20, y: 100 }, viewport, element)).toEqual({ x: 0, y: 100 });
    expect(snapFabPosition({ x: 250, y: 100 }, viewport, element)).toEqual({ x: 296, y: 100 });
  });

  it('moves and snaps after a pointer drag', () => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 360 });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 640 });
    const { getByRole } = render(<DragHarness />);
    const button = getByRole('button', { name: 'Drag' });

    fireEvent.pointerDown(button, { pointerId: 1, isPrimary: true, button: 0, clientX: 10, clientY: 100 });
    fireEvent.pointerMove(button, { pointerId: 1, isPrimary: true, clientX: 270, clientY: 150 });
    fireEvent.pointerUp(button, { pointerId: 1, isPrimary: true, clientX: 270, clientY: 150 });

    expect(button.style.getPropertyValue('--rwg-fab-left')).toBe('232px');
    expect(button.style.getPropertyValue('--rwg-fab-top')).toBe('50px');
  });

  it('supports free dragging on desktop', () => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1024 });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 768 });
    const { getByRole } = render(<DragHarness />);
    const button = getByRole('button', { name: 'Drag' });

    fireEvent.pointerDown(button, { pointerId: 1, isPrimary: true, button: 0, clientX: 10, clientY: 100 });
    fireEvent.pointerMove(button, { pointerId: 1, isPrimary: true, clientX: 270, clientY: 150 });
    fireEvent.pointerUp(button, { pointerId: 1, isPrimary: true, clientX: 270, clientY: 150 });

    expect(button.style.getPropertyValue('--rwg-fab-left')).toBe('260px');
    expect(button.style.getPropertyValue('--rwg-fab-top')).toBe('50px');
  });

  it('settles and snaps a moved pointer when the browser cancels the gesture', () => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 360 });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 640 });
    const { getByRole } = render(<DragHarness />);
    const button = getByRole('button', { name: 'Drag' });

    fireEvent.pointerDown(button, { pointerId: 1, isPrimary: true, button: 0, clientX: 300, clientY: 500 });
    fireEvent.pointerMove(button, { pointerId: 1, isPrimary: true, clientX: 80, clientY: 300 });
    fireEvent.pointerCancel(button, { pointerId: 1, isPrimary: true, clientX: 80, clientY: 300 });

    expect(button.style.getPropertyValue('--rwg-fab-left')).toBe('0px');
    expect(button.style.getPropertyValue('--rwg-fab-top')).toBe('0px');
  });
});
