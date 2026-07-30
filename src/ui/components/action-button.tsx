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
      <span aria-hidden="true">{disabled ? '⊘' : '↗'}</span>
    </a>
  );
}
