import { useEffect, useState } from 'preact/hooks';

export function Cover({ src, alt }: { src?: string | null; alt: string }) {
  const [loaded, setLoaded] = useState(false);
  useEffect(() => setLoaded(false), [src]);
  return (
    <div class="rwg-cover">
      {src && <img src={src} alt={alt} loading="lazy" decoding="async" onLoad={() => setLoaded(true)} />}
      {!loaded && <span class="rwg-skeleton rwg-cover__placeholder" />}
    </div>
  );
}

