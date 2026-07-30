import type { ComponentChildren, JSX } from 'preact';

interface PopupPanelProps {
  display: boolean;
  title?: string;
  theme?: 'maniax' | 'girls' | 'default';
  className?: string;
  position?: JSX.CSSProperties;
  onClose(): void;
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
  onMouseEnter,
  onMouseLeave,
  children,
}: PopupPanelProps) {
  if (!display) return null;
  return (
    <section
      class={`rwg-popup rwg-theme-${theme}${className ? ` ${className}` : ''}`}
      style={position}
      role="dialog"
      aria-modal="false"
      aria-label={title || 'RJ Warp Gate'}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <header class="rwg-popup__header">
        <strong>{title}</strong>
        <button class="rwg-popup__close" type="button" onClick={onClose} aria-label="Close">×</button>
      </header>
      <div class="rwg-popup__body">{children}</div>
    </section>
  );
}
