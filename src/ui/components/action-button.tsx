interface ActionButtonProps {
  href?: string | null;
  theme: 'dlsite' | 'asmrone';
  label?: string;
}

export function ActionButton({ href, theme, label }: ActionButtonProps) {
  const disabled = !href;
  const brand = label ?? (theme === 'dlsite' ? 'DLsite' : 'ASMR.one');
  return (
    <a
      class={`rwg-action rwg-action--${theme}${disabled ? ' is-disabled' : ''}`}
      href={href ?? undefined}
      target={disabled ? undefined : '_blank'}
      rel="noreferrer"
      aria-disabled={disabled}
      onClick={disabled ? (event) => event.preventDefault() : undefined}
    >
      <strong class="rwg-action__brand">{brand}</strong>
      {disabled ? <UnavailableIcon /> : <ExternalLinkIcon />}
    </a>
  );
}

export function ExternalLinkIcon() {
  return (
    <svg class="rwg-external-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 16 17 7M10 7h7v7" />
    </svg>
  );
}

function UnavailableIcon() {
  return (
    <svg class="rwg-unavailable-icon" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="7" />
      <path d="m7 17 10-10" />
    </svg>
  );
}
