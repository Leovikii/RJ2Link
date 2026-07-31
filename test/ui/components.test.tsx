import { cleanup, fireEvent, render, screen } from '@testing-library/preact';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ActionButton } from '../../src/ui/components/action-button';
import { PopupPanel } from '../../src/ui/components/popup-panel';
import {
  calculateAttachedPopupPosition,
  hasMobileUserAgent,
  resolveLayoutViewportHeight,
  calculatePopupViewportState,
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

  it('keeps a closing popup mounted until its native exit animation finishes', () => {
    const close = vi.fn();
    const { rerender } = render(
      <PopupPanel display title="Animated" onClose={close}>Body</PopupPanel>,
    );
    rerender(<PopupPanel display={false} title="Animated" onClose={close}>Body</PopupPanel>);
    const dialog = screen.getByRole('dialog', { hidden: true });
    expect(dialog.classList.contains('rwg-popup--closing')).toBe(true);
    fireEvent.animationEnd(dialog);
    expect(screen.queryByRole('dialog', { hidden: true })).toBeNull();
  });

  it('dismisses a mobile popup when the page starts scrolling', () => {
    const originalWidth = window.innerWidth;
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 390 });
    const close = vi.fn();
    render(
      <PopupPanel display title="Mobile" onClose={close} dismissOnViewportScroll>Body</PopupPanel>,
    );
    fireEvent.scroll(window);
    expect(close).toHaveBeenCalledOnce();
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: originalWidth });
  });

  it('keeps a desktop popup open while the page scrolls', () => {
    const originalWidth = window.innerWidth;
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1024 });
    const close = vi.fn();
    render(
      <PopupPanel display title="Desktop" onClose={close} dismissOnViewportScroll>Body</PopupPanel>,
    );
    fireEvent.scroll(window);
    expect(close).not.toHaveBeenCalled();
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: originalWidth });
  });

  it('prevents navigation for a disabled action', () => {
    render(<ActionButton theme="asmrone" href={null} />);
    const brand = screen.getByText('ASMR.one');
    const link = brand.closest('a')!;
    expect(brand.classList.contains('rwg-action__brand')).toBe(true);
    expect(link.getAttribute('href')).toBeNull();
    expect(link.getAttribute('aria-disabled')).toBe('true');
    expect(link.querySelector('.rwg-unavailable-icon')).toBeTruthy();
    expect(link.textContent).not.toContain('⊘');
  });

  it('renders an enabled action as an external navigation link', () => {
    render(<ActionButton theme="dlsite" href="https://www.dlsite.com/work/example" />);
    const brand = screen.getByText('DLsite');
    const link = brand.closest('a')!;
    expect(brand.classList.contains('rwg-action__brand')).toBe(true);
    expect(link.getAttribute('href')).toBe('https://www.dlsite.com/work/example');
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('aria-disabled')).toBe('false');
    expect(link.classList.contains('is-disabled')).toBe(false);
    expect(link.querySelector('.rwg-external-icon')).toBeTruthy();
    expect(link.textContent).not.toContain('↗');
  });

  it('clamps a large popup inside the viewport when neither side fully fits', () => {
    expect(calculatePopupPosition(416, 300, { width: 1024, height: 768 }, 650, 680)).toEqual({
      left: '91px',
      maxHeight: '443px',
      top: '315px',
    });
  });

  it('anchors an above-click popup by its bottom edge instead of an estimated height', () => {
    expect(calculatePopupPosition(170, 653, { width: 800, height: 684 }, 580, 520)).toEqual({
      left: '185px',
      maxHeight: '520px',
      bottom: '46px',
    });
  });

  it('uses explicit mobile browser signals without treating all touch support as mobile', () => {
    expect(hasMobileUserAgent('Mozilla/5.0 (Linux; Android 16; Pixel 9)')).toBe(true);
    expect(hasMobileUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64)')).toBe(false);
    expect(hasMobileUserAgent('desktop browser', true)).toBe(true);
  });

  it('uses the fixed-position containing block height for quirks-mode mobile pages', () => {
    expect(resolveLayoutViewportHeight(10_624, true, 915, 2_084, 938, 412)).toBe(2_084);
    expect(resolveLayoutViewportHeight(10_624, true, 375, 390, 844, 828.67)).toBe(375);
    expect(resolveLayoutViewportHeight(829, false, 2_120, 844, 390, 374.67)).toBe(829);
    expect(resolveLayoutViewportHeight(0, false, 2_120, 844, 390, 374.67)).toBe(844);
  });

  it('aligns a quirks-mode mobile popup with a scrolled visual viewport', () => {
    const layoutHeight = resolveLayoutViewportHeight(
      10_624,
      true,
      915,
      2_084,
      938,
      412,
    );
    expect(calculatePopupViewportState({
      layoutWidth: 938,
      layoutHeight,
      hasViewportMeta: true,
      mobileUserAgent: true,
      screenWidth: 412,
      screenHeight: 915,
      visualWidth: 412,
      visualHeight: 915.3333,
      visualOffsetLeft: 0,
      visualOffsetTop: 255.3333,
      visualScale: 1,
      coarsePointer: true,
    })).toMatchObject({
      mobile: true,
      bottom: 913,
      width: 412,
    });
  });

  it('removes the horizontal scrollbar gutter from a quirks-mode landscape popup', () => {
    const layoutHeight = resolveLayoutViewportHeight(
      10_624,
      true,
      375,
      390,
      844,
      828.67,
    );
    expect(calculatePopupViewportState({
      layoutWidth: 844,
      layoutHeight,
      hasViewportMeta: false,
      mobileUserAgent: true,
      screenWidth: 844,
      screenHeight: 390,
      visualWidth: 828.67,
      visualHeight: 374.67,
      visualOffsetLeft: 0,
      visualOffsetTop: 0,
      visualScale: 1,
      coarsePointer: true,
    })).toMatchObject({
      mobile: true,
      bottom: 0,
      width: 828,
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

  it('uses a visual-viewport bottom sheet on mobile pages with a desktop-sized layout viewport', () => {
    expect(calculatePopupViewportState({
      layoutWidth: 980,
      layoutHeight: 1743,
      hasViewportMeta: false,
      mobileUserAgent: false,
      screenWidth: 980,
      screenHeight: 2120,
      visualWidth: 980,
      visualHeight: 1600,
      visualOffsetLeft: 0,
      visualOffsetTop: 100,
      visualScale: 0.4,
      coarsePointer: true,
    })).toEqual({
      mobile: true,
      left: 0,
      bottom: 43,
      width: 392,
      maxHeight: 524,
      workMaxHeight: 320,
      inverseScale: 2.5,
    });
  });

  it('uses the bottom sheet in a compact mobile landscape viewport', () => {
    expect(calculatePopupViewportState({
      layoutWidth: 844,
      layoutHeight: 390,
      hasViewportMeta: true,
      mobileUserAgent: false,
      screenWidth: 1920,
      screenHeight: 1080,
      visualWidth: 844,
      visualHeight: 390,
      visualOffsetLeft: 0,
      visualOffsetTop: 0,
      visualScale: 1,
      coarsePointer: false,
    })).toMatchObject({
      mobile: true,
      width: 844,
      maxHeight: 319,
      workMaxHeight: 319,
      inverseScale: 1,
    });
  });

  it('does not treat the layout viewport scrollbar gutter as a bottom offset', () => {
    expect(calculatePopupViewportState({
      layoutWidth: 390,
      layoutHeight: 829,
      hasViewportMeta: true,
      mobileUserAgent: false,
      screenWidth: 390,
      screenHeight: 844,
      visualWidth: 374.6667,
      visualHeight: 828.6667,
      visualOffsetLeft: 0,
      visualOffsetTop: 0,
      visualScale: 1,
      coarsePointer: false,
    }).bottom).toBe(0);
  });

  it('keeps a fine-pointer touch desktop on a legacy page in desktop mode', () => {
    expect(calculatePopupViewportState({
      layoutWidth: 960,
      layoutHeight: 1619,
      hasViewportMeta: false,
      mobileUserAgent: false,
      screenWidth: 1280,
      screenHeight: 720,
      visualWidth: 944.6667,
      visualHeight: 1619.3334,
      visualOffsetLeft: 0,
      visualOffsetTop: 0,
      visualScale: 1,
      coarsePointer: false,
    }).mobile).toBe(false);
  });

  it('uses the bottom sheet for a mobile browser on a legacy wide layout viewport', () => {
    expect(calculatePopupViewportState({
      layoutWidth: 980,
      layoutHeight: 2120,
      hasViewportMeta: false,
      mobileUserAgent: true,
      screenWidth: 980,
      screenHeight: 2120,
      visualWidth: 980,
      visualHeight: 2120,
      visualOffsetLeft: 0,
      visualOffsetTop: 0,
      visualScale: 1,
      coarsePointer: false,
    }).mobile).toBe(true);
  });

  it('keeps a regular desktop viewport in anchored-popup mode', () => {
    expect(calculatePopupViewportState({
      layoutWidth: 1024,
      layoutHeight: 768,
      hasViewportMeta: true,
      mobileUserAgent: false,
      screenWidth: 1920,
      screenHeight: 1080,
      visualWidth: 1024,
      visualHeight: 768,
      visualOffsetLeft: 0,
      visualOffsetTop: 0,
      visualScale: 1,
      coarsePointer: false,
    }).mobile).toBe(false);
  });
});
