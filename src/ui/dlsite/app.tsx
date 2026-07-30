import { useEffect, useRef, useState } from 'preact/hooks';
import type { RjCode } from '../../domain/rj-code';
import type { ResourceController } from '../../application/resource-controller';
import { useExternalStore } from '../hooks/use-external-store';
import { PopupPanel } from '../components/popup-panel';
import { ActionButton } from '../components/action-button';
import { localize } from '../../config/localization';
import type { KeyValueStorage } from '../../infrastructure/storage/key-value-storage';
import { useMobileFabPosition } from '../hooks/use-mobile-fab-position';
import type { DiagnosticReportSource } from '../../infrastructure/logging/diagnostics';
import type { TextClipboard } from '../../infrastructure/gm/clipboard';
import { useAttachedPopupPosition } from '../hooks/use-popup-position';
import { normalizeDateOnly } from '../../domain/date';

interface DlsiteAppProps {
  code: RjCode;
  controller: ResourceController;
  storage: KeyValueStorage;
  diagnostics: DiagnosticReportSource;
  clipboard: TextClipboard;
}

export function DlsiteApp({ code, controller, storage, diagnostics, clipboard }: DlsiteAppProps) {
  const state = useExternalStore(controller);
  const [open, setOpen] = useState(false);
  const [diagnosticsCopied, setDiagnosticsCopied] = useState(false);
  const fab = useMobileFabPosition(storage);
  const popupPosition = useAttachedPopupPosition(fab.buttonRef, open, fab.position);
  const hideTimer = useRef<number | null>(null);
  const copyFeedbackTimer = useRef<number | null>(null);

  const cancelHide = () => {
    if (hideTimer.current !== null) window.clearTimeout(hideTimer.current);
    hideTimer.current = null;
  };
  const startHide = () => {
    if (window.innerWidth <= 768) return;
    cancelHide();
    hideTimer.current = window.setTimeout(() => setOpen(false), 300);
  };

  useEffect(() => {
    void controller.load(code, { work: false });
  }, [code, controller]);

  useEffect(() => () => {
    cancelHide();
    if (copyFeedbackTimer.current !== null) window.clearTimeout(copyFeedbackTimer.current);
  }, []);

  const asmr = state.resources['asmr-one'];
  const resourceEntries = Object.entries(state.resources);
  const loading = resourceEntries.some(([, resource]) => resource.status === 'loading');
  const resourceGroups = resourceEntries
    .filter(([providerId]) => providerId !== 'asmr-one')
    .map(([providerId, resource]) => ({
      providerId,
      displayName: controller.getResourceProviderName(providerId),
      state: resource,
      results: resource.status === 'success' ? resource.data : [],
    }));
  const results = resourceGroups.flatMap((group) => group.results);
  const asmrUrl = asmr?.status === 'success' ? asmr.data[0]?.url : null;
  const hasResource = Boolean(asmrUrl || results.length);
  const allDone = resourceEntries.length > 0 && resourceEntries.every(([, resource]) => resource.status !== 'loading');
  const hasError = resourceEntries.some(([, resource]) => resource.status === 'error');
  const retryable = allDone && (hasError || !hasResource);
  const accessibleLabel = loading
    ? `RJ Warp Gate · ${localize('searching')}`
    : `RJ Warp Gate · SP ${results.length}`;

  const click = () => {
    if (!fab.consumeClick()) return;
    if (window.innerWidth > 768) {
      setOpen(true);
      return;
    }
    setOpen((value) => !value);
  };

  const retry = () => {
    cancelHide();
    setOpen(true);
    void controller.refresh(code, { work: false });
  };

  const copyDiagnostics = async () => {
    try {
      await clipboard.writeText(diagnostics.format());
      setDiagnosticsCopied(true);
      if (copyFeedbackTimer.current !== null) window.clearTimeout(copyFeedbackTimer.current);
      copyFeedbackTimer.current = window.setTimeout(() => setDiagnosticsCopied(false), 1_200);
    } catch {
      setDiagnosticsCopied(false);
    }
  };

  return (
    <>
      <button
        ref={fab.buttonRef}
        class={`rwg-fab${loading ? ' is-loading' : ''}${fab.dragging ? ' is-dragging' : ''}${open ? ' is-open' : ''}`}
        style={fab.style}
        type="button"
        onPointerDown={fab.onPointerDown}
        onPointerMove={fab.onPointerMove}
        onPointerUp={fab.onPointerUp}
        onPointerCancel={fab.onPointerCancel}
        onMouseEnter={() => {
          if (window.innerWidth > 768) {
            cancelHide();
            setOpen(true);
          }
        }}
        onMouseLeave={startHide}
        onClick={click}
        aria-expanded={open}
        aria-label={accessibleLabel}
      >
        <span class="rwg-fab__brand" aria-hidden="true">RJ</span>
        <strong class="rwg-fab__count">{loading ? '…' : `SP ${results.length}`}</strong>
        {asmrUrl && <span class="rwg-fab__audio" aria-hidden="true">♫</span>}
      </button>
      <PopupPanel
        display={open}
        title="Search Result"
        position={popupPosition}
        onClose={() => setOpen(false)}
        onMouseEnter={cancelHide}
        onMouseLeave={startHide}
      >
        <div class="rwg-resource-panel">
          {asmr?.status === 'loading' && <span class="rwg-skeleton" />}
          <ActionButton theme="asmrone" href={asmrUrl} />
          {asmr?.status === 'error' && <div class="rwg-status"><strong>ASMR ONE · {localize('search_failed')}</strong><small>{asmr.error.message}</small></div>}
          {resourceGroups.map((group) => <section key={group.providerId}>
            <h3>{group.providerId === 'southplus' ? localize('southplus_resources') : group.displayName} {group.results.length > 0 && `(${group.results.length})`}</h3>
            {group.state.status === 'loading' && <div class="rwg-loading"><span class="rwg-skeleton" /><span class="rwg-skeleton" /></div>}
            {group.state.status === 'error' && <div class="rwg-status"><strong>{localize('search_failed')}</strong><small>{group.state.error.message}</small></div>}
            {group.state.status === 'empty' && <div class="rwg-status">{localize('no_resources')}</div>}
            {group.state.status === 'success' && <ul class="rwg-results">{group.results.map((result) => (
              <li key={`${result.providerId}:${result.id}`}><a href={result.url} target="_blank" rel="noreferrer"><strong>{result.title}</strong><small>{[result.author, normalizeDateOnly(result.date)].filter(Boolean).join(' ')}</small></a></li>
            ))}</ul>}
          </section>)}
          {hasError && <button class="rwg-retry" type="button" onClick={() => { void copyDiagnostics(); }}>
            {diagnosticsCopied ? localize('diagnostics_copied') : localize('copy_diagnostics')}
          </button>}
          {retryable && <button class="rwg-retry" type="button" onClick={retry}>{localize('click_to_retry')}</button>}
        </div>
      </PopupPanel>
    </>
  );
}
