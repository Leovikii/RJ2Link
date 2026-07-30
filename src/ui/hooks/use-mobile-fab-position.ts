import type { JSX } from 'preact';
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import type { KeyValueStorage } from '../../infrastructure/storage/key-value-storage';

export interface FabPosition {
  x: number;
  y: number;
}

interface Size {
  width: number;
  height: number;
}

interface DragState {
  pointerId: number;
  startX: number;
  startY: number;
  origin: FabPosition;
  latest: FabPosition;
  moved: boolean;
}

const STORAGE_KEY = 'rj_warp_gate_fab_pos_mobile';
const DRAG_THRESHOLD = 5;

export function clampFabPosition(position: FabPosition, viewport: Size, element: Size): FabPosition {
  return {
    x: Math.max(0, Math.min(position.x, Math.max(0, viewport.width - element.width))),
    y: Math.max(0, Math.min(position.y, Math.max(0, viewport.height - element.height))),
  };
}

export function snapFabPosition(position: FabPosition, viewport: Size, element: Size): FabPosition {
  const clamped = clampFabPosition(position, viewport, element);
  return {
    x: clamped.x + element.width / 2 < viewport.width / 2
      ? 0
      : Math.max(0, viewport.width - element.width),
    y: clamped.y,
  };
}

function parseStoredPosition(value: unknown): FabPosition | null {
  let candidate = value;
  if (typeof value === 'string') {
    try {
      candidate = JSON.parse(value) as unknown;
    } catch {
      return null;
    }
  }
  if (!candidate || typeof candidate !== 'object') return null;
  const record = candidate as Record<string, unknown>;
  return Number.isFinite(record.x) && Number.isFinite(record.y)
    ? { x: Number(record.x), y: Number(record.y) }
    : null;
}

export function useMobileFabPosition(storage: KeyValueStorage) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const drag = useRef<DragState | null>(null);
  const suppressClick = useRef(false);
  const [mobile, setMobile] = useState(() => window.innerWidth <= 768);
  const [position, setPosition] = useState<FabPosition | null>(null);

  const elementSize = (): Size => ({
    width: buttonRef.current?.offsetWidth || 64,
    height: buttonRef.current?.offsetHeight || 48,
  });
  const viewportSize = (): Size => ({ width: window.innerWidth, height: window.innerHeight });
  const persist = (value: FabPosition) => {
    void storage.set(STORAGE_KEY, value).catch(() => {});
  };

  useEffect(() => {
    let active = true;
    void storage.get<unknown>(STORAGE_KEY, null).then((stored) => {
      const parsed = parseStoredPosition(stored);
      if (!active || !parsed) return;
      setPosition(clampFabPosition(parsed, viewportSize(), elementSize()));
    });
    return () => { active = false; };
  }, [storage]);

  useEffect(() => {
    const resize = () => {
      setMobile(window.innerWidth <= 768);
      setPosition((current) => current
        ? clampFabPosition(current, viewportSize(), elementSize())
        : current);
    };
    window.addEventListener('resize', resize, { passive: true });
    return () => window.removeEventListener('resize', resize);
  }, []);

  const onPointerDown = (event: JSX.TargetedPointerEvent<HTMLButtonElement>) => {
    if (!mobile || !event.isPrimary || event.button !== 0) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const origin = { x: rect.left, y: rect.top };
    drag.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      origin,
      latest: origin,
      moved: false,
    };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const onPointerMove = (event: JSX.TargetedPointerEvent<HTMLButtonElement>) => {
    const current = drag.current;
    if (!current || current.pointerId !== event.pointerId) return;
    const dx = event.clientX - current.startX;
    const dy = event.clientY - current.startY;
    if (!current.moved && Math.hypot(dx, dy) <= DRAG_THRESHOLD) return;
    current.moved = true;
    event.preventDefault();
    current.latest = clampFabPosition(
      { x: current.origin.x + dx, y: current.origin.y + dy },
      viewportSize(),
      elementSize(),
    );
    setPosition(current.latest);
  };

  const finishDrag = (event: JSX.TargetedPointerEvent<HTMLButtonElement>, cancelled = false) => {
    const current = drag.current;
    if (!current || current.pointerId !== event.pointerId) return;
    drag.current = null;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    suppressClick.current = current.moved;
    if (!current.moved || cancelled) return;
    const snapped = snapFabPosition(current.latest, viewportSize(), elementSize());
    setPosition(snapped);
    persist(snapped);
  };

  const style = useMemo<JSX.CSSProperties | undefined>(() => mobile && position ? {
    left: `${position.x}px`,
    right: 'auto',
    top: `${position.y}px`,
    transform: 'none',
  } : undefined, [mobile, position]);

  return {
    buttonRef,
    style,
    onPointerDown,
    onPointerMove,
    onPointerUp: (event: JSX.TargetedPointerEvent<HTMLButtonElement>) => finishDrag(event),
    onPointerCancel: (event: JSX.TargetedPointerEvent<HTMLButtonElement>) => finishDrag(event, true),
    consumeClick(): boolean {
      if (!suppressClick.current) return true;
      suppressClick.current = false;
      return false;
    },
  };
}
