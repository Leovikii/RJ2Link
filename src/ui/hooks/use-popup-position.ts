import type { JSX, RefObject } from 'preact';
import { useEffect, useMemo, useState } from 'preact/hooks';
import type { FabPosition } from './use-mobile-fab-position';

interface ViewportSize {
  width: number;
  height: number;
}

interface AnchorRect {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

const clamp = (value: number, minimum: number, maximum: number): number =>
  Math.max(minimum, Math.min(value, Math.max(minimum, maximum)));

export function calculatePopupPosition(
  x: number,
  y: number,
  viewport: ViewportSize,
  width = 650,
  height = 550,
  gap = 15,
  margin = 10,
): JSX.CSSProperties {
  const popupWidth = Math.min(width, Math.max(0, viewport.width - margin * 2));
  const popupHeight = Math.min(height, Math.max(0, viewport.height - margin * 2));
  const preferredLeft = x + gap + popupWidth <= viewport.width - margin
    ? x + gap
    : x - gap - popupWidth;
  const preferredTop = y + gap + popupHeight <= viewport.height - margin
    ? y + gap
    : y - gap - popupHeight;
  return {
    left: `${Math.round(clamp(preferredLeft, margin, viewport.width - popupWidth - margin))}px`,
    top: `${Math.round(clamp(preferredTop, margin, viewport.height - popupHeight - margin))}px`,
  };
}

export function calculateAttachedPopupPosition(
  anchor: AnchorRect,
  viewport: ViewportSize,
  width = 360,
  preferredHeight = 520,
  gap = 12,
  margin = 12,
): JSX.CSSProperties {
  const popupWidth = Math.min(width, Math.max(0, viewport.width - margin * 2));
  const left = clamp(anchor.right - popupWidth, margin, viewport.width - popupWidth - margin);
  const availableAbove = Math.max(0, anchor.top - gap - margin);
  const availableBelow = Math.max(0, viewport.height - anchor.bottom - gap - margin);
  const placeAbove = availableAbove >= Math.min(preferredHeight, availableBelow);
  const maxHeight = Math.max(80, Math.min(preferredHeight, placeAbove ? availableAbove : availableBelow));
  return {
    left: `${Math.round(left)}px`,
    width: `${Math.round(popupWidth)}px`,
    maxHeight: `${Math.round(maxHeight)}px`,
    ...(placeAbove
      ? { bottom: `${Math.round(viewport.height - anchor.top + gap)}px` }
      : { top: `${Math.round(anchor.bottom + gap)}px` }),
  };
}

export function usePopupPosition(x: number, y: number, width = 650, height = 550): JSX.CSSProperties {
  const [revision, rerender] = useState(0);
  useEffect(() => {
    const resize = () => rerender((value) => value + 1);
    window.addEventListener('resize', resize, { passive: true });
    return () => window.removeEventListener('resize', resize);
  }, []);

  return useMemo(() => window.innerWidth <= 768
    ? {}
    : calculatePopupPosition(x, y, {
      width: window.innerWidth,
      height: window.innerHeight,
    }, width, height), [x, y, width, height, revision]);
}

export function useAttachedPopupPosition<T extends HTMLElement>(
  elementRef: RefObject<T>,
  display: boolean,
  position: FabPosition | null,
): JSX.CSSProperties {
  const [style, setStyle] = useState<JSX.CSSProperties>({
    right: '24px',
    bottom: '88px',
    width: '360px',
  });

  useEffect(() => {
    if (!display) return undefined;
    const update = () => {
      if (window.innerWidth <= 768) {
        setStyle({});
        return;
      }
      const rect = elementRef.current?.getBoundingClientRect();
      if (!rect) return;
      setStyle(calculateAttachedPopupPosition(rect, {
        width: window.innerWidth,
        height: window.innerHeight,
      }));
    };
    update();
    window.addEventListener('resize', update, { passive: true });
    return () => window.removeEventListener('resize', update);
  }, [display, elementRef, position?.x, position?.y]);

  return style;
}
