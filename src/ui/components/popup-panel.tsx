import type { ComponentChildren, JSX } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { usePopupViewport } from '../hooks/use-popup-position';

const POPUP_EXIT_FALLBACK_MS = 220;

interface PopupPanelProps {
  display: boolean;
  title?: string;
  theme?: 'maniax' | 'girls' | 'default';
  className?: string;
  position?: JSX.CSSProperties;
  onClose(): void;
  dismissOnViewportScroll?: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  children: ComponentChildren;
}

export function PopupPanel({
  display,
  title,
  theme = 'default',
  className,
  position,
  onClose,
  dismissOnViewportScroll = false,
  onMouseEnter,
  onMouseLeave,
  children,
}: PopupPanelProps) {
  const viewport = usePopupViewport();
  const [rendered, setRendered] = useState(display);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (display) {
      setRendered(true);
      setClosing(false);
      return undefined;
    }
    if (!rendered) return undefined;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setRendered(false);
      setClosing(false);
      return undefined;
    }
    setClosing(true);
    const fallback = window.setTimeout(() => {
      setRendered(false);
      setClosing(false);
    }, POPUP_EXIT_FALLBACK_MS);
    return () => window.clearTimeout(fallback);
  }, [display, rendered]);

  useEffect(() => {
    if (!display || !viewport.mobile || !dismissOnViewportScroll) return undefined;
    const dismiss = () => onClose();
    window.addEventListener('scroll', dismiss, { passive: true });
    window.visualViewport?.addEventListener('scroll', dismiss, { passive: true });
    return () => {
      window.removeEventListener('scroll', dismiss);
      window.visualViewport?.removeEventListener('scroll', dismiss);
    };
  }, [dismissOnViewportScroll, display, onClose, viewport.mobile]);

  if (!rendered) return null;
  return (
    <section
      class={`rwg-popup rwg-theme-${theme}${viewport.mobile ? ' rwg-popup--mobile' : ''}${closing ? ' rwg-popup--closing' : ''}${className ? ` ${className}` : ''}`}
      style={viewport.mobile ? { ...position, ...viewport.style } : position}
      role="dialog"
      aria-modal="false"
      aria-label={title || 'RJ Warp Gate'}
      aria-hidden={closing}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onAnimationEnd={(event) => {
        if (event.target !== event.currentTarget || !closing || display) return;
        setRendered(false);
        setClosing(false);
      }}
    >
      <header class="rwg-popup__header">
        <strong>{title}</strong>
        <button class="rwg-popup__close" type="button" onClick={onClose} aria-label="Close">×</button>
      </header>
      <div class="rwg-popup__body">{children}</div>
    </section>
  );
}
