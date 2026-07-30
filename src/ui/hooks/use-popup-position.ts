import { useEffect, useMemo, useState } from 'preact/hooks';

export function usePopupPosition(x: number, y: number, width = 650, height = 550) {
  const [, rerender] = useState(0);
  useEffect(() => {
    const resize = () => rerender((value) => value + 1);
    window.addEventListener('resize', resize, { passive: true });
    return () => window.removeEventListener('resize', resize);
  }, []);

  return useMemo(() => {
    if (window.innerWidth <= 768) return {};
    const style: Record<string, string> = {};
    if (x + 15 + width <= window.innerWidth) style.left = `${x + 15}px`;
    else style.right = `${Math.max(10, window.innerWidth - x + 15)}px`;
    if (y + 15 + height <= window.innerHeight) style.top = `${y + 15}px`;
    else style.bottom = `${Math.max(10, window.innerHeight - y + 15)}px`;
    return style;
  }, [x, y, width, height]);
}

