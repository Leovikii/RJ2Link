import { useEffect, useState } from 'preact/hooks';

export interface ExternalStore<T> {
  getSnapshot(): T;
  subscribe(listener: () => void): () => void;
}

export function useExternalStore<T>(store: ExternalStore<T>): T {
  const [snapshot, setSnapshot] = useState(store.getSnapshot());
  useEffect(() => {
    setSnapshot(store.getSnapshot());
    return store.subscribe(() => setSnapshot(store.getSnapshot()));
  }, [store]);
  return snapshot;
}

