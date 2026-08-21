import type { ComponentChildren, JSX } from 'preact';
import { useEffect, useRef } from 'preact/hooks';

const SCROLLBAR_FADE_DELAY_MS = 850;
const MIN_THUMB_HEIGHT = 32;

interface OverlayScrollAreaProps {
  children: ComponentChildren;
}

interface DragState {
  pointerId: number;
  startY: number;
  startScrollTop: number;
}

export function OverlayScrollArea({ children }: OverlayScrollAreaProps) {
  const shellRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const fadeTimer = useRef<number | null>(null);
  const drag = useRef<DragState | null>(null);

  const clearFadeTimer = () => {
    if (fadeTimer.current !== null) window.clearTimeout(fadeTimer.current);
    fadeTimer.current = null;
  };

  const revealScrollbar = () => {
    const shell = shellRef.current;
    if (!shell?.classList.contains('is-scrollable')) return;
    clearFadeTimer();
    shell.classList.add('is-scrolling');
    fadeTimer.current = window.setTimeout(() => {
      if (!drag.current) shell.classList.remove('is-scrolling');
      fadeTimer.current = null;
    }, SCROLLBAR_FADE_DELAY_MS);
  };

  const updateScrollbar = (reveal = false) => {
    const shell = shellRef.current;
    const list = listRef.current;
    const track = trackRef.current;
    const thumb = thumbRef.current;
    if (!shell || !list || !track || !thumb) return;

    const maximumScroll = Math.max(0, list.scrollHeight - list.clientHeight);
    const trackHeight = track.clientHeight;
    const scrollable = maximumScroll > 1 && trackHeight > 0;
    shell.classList.toggle('is-scrollable', scrollable);
    if (!scrollable) {
      shell.classList.remove('is-scrolling', 'is-dragging');
      return;
    }

    const thumbHeight = Math.min(
      trackHeight,
      Math.max(MIN_THUMB_HEIGHT, Math.round(trackHeight * list.clientHeight / list.scrollHeight)),
    );
    const thumbTravel = Math.max(0, trackHeight - thumbHeight);
    const thumbTop = Math.round(thumbTravel * list.scrollTop / maximumScroll);
    thumb.style.height = `${thumbHeight}px`;
    thumb.style.transform = `translateY(${thumbTop}px)`;
    if (reveal) revealScrollbar();
  };

  const finishDrag = (event: JSX.TargetedPointerEvent<HTMLDivElement>) => {
    if (drag.current?.pointerId !== event.pointerId) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    drag.current = null;
    shellRef.current?.classList.remove('is-dragging');
    revealScrollbar();
  };

  useEffect(() => {
    updateScrollbar(true);
  });

  useEffect(() => {
    const list = listRef.current;
    if (!list) return undefined;
    const update = () => updateScrollbar();
    window.addEventListener('resize', update, { passive: true });
    const resizeObserver = typeof ResizeObserver === 'undefined'
      ? null
      : new ResizeObserver(update);
    resizeObserver?.observe(list);
    return () => {
      clearFadeTimer();
      resizeObserver?.disconnect();
      window.removeEventListener('resize', update);
    };
  }, []);

  return (
    <div
      ref={shellRef}
      class="rwg-results-scroll"
      onPointerMove={() => revealScrollbar()}
      onFocusIn={() => revealScrollbar()}
    >
      <ul
        ref={listRef}
        class="rwg-results"
        onScroll={() => updateScrollbar(true)}
      >
        {children}
      </ul>
      <div
        ref={trackRef}
        class="rwg-results-scrollbar"
        aria-hidden="true"
        onPointerDown={(event) => {
          if (event.target !== event.currentTarget) return;
          const list = listRef.current;
          const track = trackRef.current;
          if (!list || !track) return;
          const trackRect = track.getBoundingClientRect();
          const ratio = Math.max(0, Math.min(1, (event.clientY - trackRect.top) / trackRect.height));
          list.scrollTop = ratio * Math.max(0, list.scrollHeight - list.clientHeight);
          updateScrollbar(true);
        }}
      >
        <div
          ref={thumbRef}
          class="rwg-results-scrollbar__thumb"
          onPointerDown={(event) => {
            const list = listRef.current;
            if (!list) return;
            event.preventDefault();
            event.currentTarget.setPointerCapture(event.pointerId);
            drag.current = {
              pointerId: event.pointerId,
              startY: event.clientY,
              startScrollTop: list.scrollTop,
            };
            clearFadeTimer();
            shellRef.current?.classList.add('is-scrolling', 'is-dragging');
          }}
          onPointerMove={(event) => {
            const currentDrag = drag.current;
            const list = listRef.current;
            const track = trackRef.current;
            const thumb = thumbRef.current;
            if (!currentDrag || currentDrag.pointerId !== event.pointerId || !list || !track || !thumb) return;
            const maximumScroll = Math.max(0, list.scrollHeight - list.clientHeight);
            const thumbTravel = Math.max(1, track.clientHeight - thumb.offsetHeight);
            list.scrollTop = currentDrag.startScrollTop
              + (event.clientY - currentDrag.startY) * maximumScroll / thumbTravel;
          }}
          onPointerUp={finishDrag}
          onPointerCancel={finishDrag}
        />
      </div>
    </div>
  );
}
