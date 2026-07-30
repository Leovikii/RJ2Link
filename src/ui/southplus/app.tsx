import { useEffect, useRef, useState } from 'preact/hooks';
import type { PopupController } from '../../application/popup-controller';
import type { ResourceController } from '../../application/resource-controller';
import { formatFileSize } from '../../providers/dlsite/parser';
import { useExternalStore } from '../hooks/use-external-store';
import { usePopupPosition } from '../hooks/use-popup-position';
import { PopupPanel } from '../components/popup-panel';
import { ActionButton } from '../components/action-button';
import { Badge } from '../components/badge';
import { Cover } from '../components/cover';
import { localize } from '../../config/localization';
import type { TextClipboard } from '../../infrastructure/gm/clipboard';
import { normalizeDateOnly } from '../../domain/date';

interface SouthPlusAppProps {
  popup: PopupController;
  resources: ResourceController;
  clipboard: TextClipboard;
  cancelHide(): void;
  startHide(): void;
}

export function SouthPlusApp({ popup, resources, clipboard, cancelHide, startHide }: SouthPlusAppProps) {
  const popupState = useExternalStore(popup);
  const state = useExternalStore(resources);
  const position = usePopupPosition(popupState.x, popupState.y, 650, 680);
  const [titleCopied, setTitleCopied] = useState(false);
  const copyFeedbackTimer = useRef<number | null>(null);

  useEffect(() => {
    if (popupState.display && popupState.code) {
      void resources.load(popupState.code, { excludeResourceProviderIds: ['southplus'] });
    }
  }, [popupState.code, popupState.display, resources]);

  useEffect(() => () => {
    if (copyFeedbackTimer.current !== null) window.clearTimeout(copyFeedbackTimer.current);
  }, []);

  const asmrState = state.resources['asmr-one'];
  const asmrUrl = asmrState?.status === 'success' ? asmrState.data[0]?.url : null;
  const work = state.work.status === 'success' ? state.work.data : null;
  const releaseDate = normalizeDateOnly(work?.releaseDate);
  const loading = state.work.status === 'loading';
  const error = state.work.status === 'error' ? state.work.error : null;
  const copyTitle = async () => {
    if (!work?.title) return;
    try {
      await clipboard.writeText(work.title);
      setTitleCopied(true);
      if (copyFeedbackTimer.current !== null) window.clearTimeout(copyFeedbackTimer.current);
      copyFeedbackTimer.current = window.setTimeout(() => setTitleCopied(false), 600);
    } catch {
      // Clipboard failure does not affect the metadata popup.
    }
  };

  return (
    <PopupPanel
      display={popupState.display}
      title={popupState.code ?? 'RJ Warp Gate'}
      theme={work?.isGirls ? 'girls' : 'maniax'}
      position={position}
      onClose={() => popup.unpinAndClose()}
      onMouseEnter={cancelHide}
      onMouseLeave={startHide}
    >
      {loading && <LoadingCard />}
      {error && <StatusMessage title={localize('search_failed')} message={error.message} />}
      {state.work.status === 'empty' && <StatusMessage title={localize('no_resources')} />}
      {work && (
        <div class="rwg-work">
          <div class="rwg-work__hero">
            <div class="rwg-work__cover-column">
              <div class="rwg-work__cover"><Cover src={work.imageUrl} alt={work.title} /></div>
              <div class="rwg-actions rwg-actions--cover">
                <ActionButton theme="dlsite" href={`https://www.dlsite.com/maniax/work/=/product_id/${work.rjCode}.html`} />
                <ActionButton theme="asmrone" href={asmrUrl} />
              </div>
            </div>
            <div class="rwg-work__main">
              <button
                class={`rwg-work__title${titleCopied ? ' is-copied' : ''}`}
                type="button"
                title={localize('click_to_copy_title')}
                onClick={() => { void copyTitle(); }}
              >{work.title}</button>
              {work.circle && <p class="rwg-work__circle">{work.circle}</p>}
              <div class="rwg-badges">
                {work.sales !== null && <Badge theme="sales" text={`${localize('dl_count')} ${work.sales}`} />}
                {work.ratingAverage !== null && <Badge theme="rating" text={`★ ${work.ratingAverage.toFixed(2)}${work.ratingCount ? ` (${work.ratingCount})` : ''}`} />}
                {releaseDate && <Badge text={releaseDate} />}
                {work.ageRating && <Badge theme={work.ageRating === 'R18' ? 'danger' : 'default'} text={work.ageRating} />}
                {work.workType && <Badge theme="type" text={localizeWorkType(work.workTypeId, work.workType)} />}
                {work.fileSize !== null && <Badge text={formatFileSize(work.fileSize) ?? ''} />}
              </div>
              {work.voiceActors.length > 0 && <InfoGroup title={localize('voice_actor')} items={work.voiceActors} theme="voice" />}
              {work.genres.length > 0 && <InfoGroup title={localize('genre')} items={work.genres} theme="genre" />}
            </div>
          </div>
        </div>
      )}
    </PopupPanel>
  );
}

function InfoGroup({ title, items, theme }: { title: string; items: string[]; theme: 'voice' | 'genre' }) {
  return <div class="rwg-info"><strong>{title}</strong><div class="rwg-badges">{items.map((item) => <Badge key={item} text={item} theme={theme} />)}</div></div>;
}

function LoadingCard() {
  return <div class="rwg-loading"><span class="rwg-skeleton" /><span class="rwg-skeleton" /><span class="rwg-skeleton" /></div>;
}

function StatusMessage({ title, message }: { title: string; message?: string }) {
  return <div class="rwg-status"><strong>{title}</strong>{message && <small>{message}</small>}</div>;
}

function localizeWorkType(id: number, fallback: string): string {
  const keys = [
    'work_type_voice', 'work_type_game', 'work_type_comic', 'work_type_illustration',
    'work_type_novel', 'work_type_video', 'work_type_music', 'work_type_tool',
    'work_type_voice_comic', 'work_type_other',
  ];
  return keys[id] ? localize(keys[id]) : fallback;
}
