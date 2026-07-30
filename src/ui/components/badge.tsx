interface BadgeProps {
  text: string;
  theme?: string;
}

export function Badge({ text, theme = 'default' }: BadgeProps) {
  return <span class={`rwg-badge rwg-badge--${theme}`}>{text}</span>;
}

