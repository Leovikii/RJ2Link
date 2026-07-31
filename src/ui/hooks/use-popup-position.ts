import type { JSX, RefObject } from 'preact';
import { useEffect, useMemo, useState } from 'preact/hooks';
import type { FabPosition } from './use-mobile-fab-position';

interface ViewportSize {
  width: number;
  height: number;
}

export interface PopupViewportMetrics {
  layoutWidth: number;
  layoutHeight: number;
  hasViewportMeta: boolean;
  mobileUserAgent: boolean;
  screenWidth: number;
  screenHeight: number;
  visualWidth: number;
  visualHeight: number;
  visualOffsetLeft: number;
  visualOffsetTop: number;
  visualScale: number;
  coarsePointer: boolean;
}

export interface PopupViewportState {
  mobile: boolean;
  left: number;
  bottom: number;
  width: number;
  maxHeight: number;
  workMaxHeight: number;
  inverseScale: number;
}

interface AnchorRect {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

const clamp = (value: number, minimum: number, maximum: number): number =>
  Math.max(minimum, Math.min(value, Math.max(minimum, maximum)));

export const hasMobileUserAgent = (userAgent: string, userAgentDataMobile = false): boolean =>
  userAgentDataMobile || /Android|iPhone|iPad|iPod|Mobile/i.test(userAgent);

export function calculatePopupViewportState(metrics: PopupViewportMetrics): PopupViewportState {
  const compactWidth = metrics.layoutWidth <= 768 || metrics.visualWidth <= 768;
  const compactLandscape = metrics.visualWidth <= 1024 && metrics.visualHeight <= 600;
  const handheldScreen = metrics.coarsePointer
    && Math.min(metrics.screenWidth, metrics.screenHeight) <= 768;
  const legacyHandheld = !metrics.hasViewportMeta
    && (metrics.coarsePointer || metrics.mobileUserAgent);
  const mobile = compactWidth || compactLandscape || handheldScreen || legacyHandheld;
  const pageScale = metrics.visualScale > 0 && metrics.visualScale < 1
    ? metrics.visualScale
    : 1;
  const visualHeight = Math.max(0, metrics.visualHeight * pageScale);
  const maxHeight = Math.floor(Math.max(0, Math.min(visualHeight - 12, visualHeight * 0.82)));

  return {
    mobile,
    left: Math.round(Math.max(0, metrics.visualOffsetLeft)),
    bottom: Math.round(Math.max(
      0,
      metrics.layoutHeight - metrics.visualOffsetTop - metrics.visualHeight,
    )),
    width: Math.floor(Math.max(0, metrics.visualWidth * pageScale)),
    maxHeight,
    workMaxHeight: visualHeight <= 600 ? maxHeight : Math.floor(visualHeight * 0.5),
    inverseScale: 1 / pageScale,
  };
}

function readPopupViewportState(): PopupViewportState {
  const visualViewport = window.visualViewport;
  const layoutHeight = document.documentElement.clientHeight || window.innerHeight;
  return calculatePopupViewportState({
    layoutWidth: window.innerWidth,
    layoutHeight,
    hasViewportMeta: Boolean(document.querySelector('meta[name="viewport"]')),
    mobileUserAgent: hasMobileUserAgent(
      navigator.userAgent,
      Boolean((navigator as Navigator & { userAgentData?: { mobile?: boolean } }).userAgentData?.mobile),
    ),
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    visualWidth: visualViewport?.width ?? window.innerWidth,
    visualHeight: visualViewport?.height ?? window.innerHeight,
    visualOffsetLeft: visualViewport?.offsetLeft ?? 0,
    visualOffsetTop: visualViewport?.offsetTop ?? 0,
    visualScale: visualViewport?.scale ?? 1,
    coarsePointer: window.matchMedia?.('(pointer: coarse)').matches ?? false,
  });
}

export function usePopupViewport(): {
  mobile: boolean;
  style?: JSX.CSSProperties;
} {
  const [viewport, setViewport] = useState(readPopupViewportState);

  useEffect(() => {
    const update = () => setViewport(readPopupViewportState());
    window.addEventListener('resize', update, { passive: true });
    window.addEventListener('orientationchange', update, { passive: true });
    window.visualViewport?.addEventListener('resize', update, { passive: true });
    window.visualViewport?.addEventListener('scroll', update, { passive: true });
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
      window.visualViewport?.removeEventListener('resize', update);
      window.visualViewport?.removeEventListener('scroll', update);
    };
  }, []);

  return useMemo(() => ({
    mobile: viewport.mobile,
    style: viewport.mobile ? ({
      '--rwg-popup-left': `${viewport.left}px`,
      '--rwg-popup-bottom': `${viewport.bottom}px`,
      '--rwg-popup-width': `${viewport.width}px`,
      '--rwg-popup-max-height': `${viewport.maxHeight}px`,
      '--rwg-work-popup-max-height': `${viewport.workMaxHeight}px`,
      '--rwg-popup-inverse-scale': String(viewport.inverseScale),
    } as JSX.CSSProperties) : undefined,
  }), [viewport]);
}

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
  const availableRight = viewport.width - margin - x - gap;
  const availableLeft = x - gap - margin;
  const preferredLeft = availableRight >= popupWidth
    ? x + gap
    : availableLeft >= popupWidth
      ? x - gap - popupWidth
      : x - popupWidth / 2;
  const availableBelow = Math.max(0, viewport.height - margin - y - gap);
  const availableAbove = Math.max(0, y - gap - margin);
  const placeBelow = availableBelow >= Math.min(height, availableAbove);
  const maxHeight = Math.max(80, Math.min(height, placeBelow ? availableBelow : availableAbove));
  return {
    left: `${Math.round(clamp(preferredLeft, margin, viewport.width - popupWidth - margin))}px`,
    maxHeight: `${Math.round(maxHeight)}px`,
    ...(placeBelow
      ? { top: `${Math.round(y + gap)}px` }
      : { bottom: `${Math.round(viewport.height - y + gap)}px` }),
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
