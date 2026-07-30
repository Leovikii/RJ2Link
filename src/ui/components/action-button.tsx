interface ActionButtonProps {
  href?: string | null;
  theme: 'dlsite' | 'asmrone';
  label?: string;
}

export function ActionButton({ href, theme, label }: ActionButtonProps) {
  const disabled = !href;
  return (
    <a
      class={`rwg-action rwg-action--${theme}${disabled ? ' is-disabled' : ''}`}
      href={href ?? undefined}
      target={disabled ? undefined : '_blank'}
      rel="noreferrer"
      aria-disabled={disabled}
      onClick={disabled ? (event) => event.preventDefault() : undefined}
    >
      <strong>{label ?? (theme === 'dlsite' ? 'DLsite' : 'ASMR.one')}</strong>
      <span aria-hidden="true">{disabled ? '⊘' : '↗'}</span>
    </a>
  );
}

