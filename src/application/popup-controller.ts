import type { RjCode } from '../domain/rj-code';

export interface PopupSnapshot {
  display: boolean;
  pinned: boolean;
  code: RjCode | null;
  x: number;
  y: number;
}

type Listener = () => void;

export class PopupController {
  private snapshot: PopupSnapshot = { display: false, pinned: false, code: null, x: 0, y: 0 };
  private readonly listeners = new Set<Listener>();

  getSnapshot = (): PopupSnapshot => this.snapshot;

  subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  open(code: RjCode, rect: DOMRect, pinned: boolean): void {
    if (this.snapshot.pinned && !pinned) return;
    this.set({
      display: true,
      pinned,
      code,
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    });
  }

  unpinAndClose(): void {
    this.set({ ...this.snapshot, display: false, pinned: false });
  }

  hideHover(): void {
    if (!this.snapshot.pinned) this.set({ ...this.snapshot, display: false });
  }

  private set(snapshot: PopupSnapshot): void {
    this.snapshot = snapshot;
    for (const listener of this.listeners) listener();
  }
}

