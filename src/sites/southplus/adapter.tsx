import { render } from 'preact';
import { PopupController } from '../../application/popup-controller';
import { PrefetchController, schedulePrefetch, selectPrefetchCandidates, type PrefetchCandidate } from '../../application/prefetch-controller';
import { ResourceController } from '../../application/resource-controller';
import { clipboard, dlsiteProvider, providerRegistry, storage } from '../../application/runtime';
import { findRjCodes, parseRjCode, RJ_CODE_SEARCH_PATTERN, type RjCode } from '../../domain/rj-code';
import { SouthPlusApp } from '../../ui/southplus/app';

const LINK_CLASS = 'rwg-rj-link';
const CODE_ATTR = 'data-rwg-code';
const DL_SITE_URL = /dlsite\.com\/.*\/product_id\/(?:R[JE]|[VB]J)\d{6}(?:\d{2})?/i;
const PREFETCH_CACHE_PROBE_LIMIT = 6;

export function initSouthPlus(): () => void {
  void storage.set('last_forum_domain', location.hostname);
  const mount = document.createElement('div');
  mount.id = 'rwg-southplus-root';
  mount.className = 'rwg-root';
  document.body.appendChild(mount);

  const popup = new PopupController();
  const resources = new ResourceController(providerRegistry);
  let hideTimer: number | null = null;
  const cancelHide = () => {
    if (hideTimer !== null) window.clearTimeout(hideTimer);
    hideTimer = null;
  };
  const startHide = () => {
    if (window.innerWidth <= 768 || popup.getSnapshot().pinned) return;
    cancelHide();
    hideTimer = window.setTimeout(() => popup.hideHover(), 250);
  };

  render(<SouthPlusApp popup={popup} resources={resources} clipboard={clipboard} cancelHide={cancelHide} startHide={startHide} />, mount);
  enhanceSouthPlusNode(document.body);

  const initialCandidates = collectCandidates();
  const selected = selectPrefetchCandidates(initialCandidates, PREFETCH_CACHE_PROBE_LIMIT);
  const prefetch = new PrefetchController(dlsiteProvider, undefined, () => resources.isBusy());
  const cancelScheduledPrefetch = schedulePrefetch(() => { void prefetch.run(selected); });
  const cancelPrefetchWhenHidden = () => {
    if (document.visibilityState === 'hidden') prefetch.cancel();
  };
  document.addEventListener('visibilitychange', cancelPrefetchWhenHidden);

  const queued = new Set<Node>();
  let scanScheduled = false;
  const observer = new MutationObserver((records) => {
    for (const record of records) for (const node of record.addedNodes) queued.add(node);
    if (scanScheduled) return;
    scanScheduled = true;
    queueMicrotask(() => {
      scanScheduled = false;
      const nodes = [...queued];
      queued.clear();
      for (const node of nodes) enhanceSouthPlusNode(node);
    });
  });
  observer.observe(document.body, { childList: true, subtree: true });

  const getLink = (target: EventTarget | null) =>
    target instanceof Element ? target.closest<HTMLElement>(`.${LINK_CLASS}`) : null;

  const onClick = (event: MouseEvent) => {
    const link = getLink(event.target);
    if (!link) {
      if (popup.getSnapshot().display && !mount.contains(event.target as Node)) popup.unpinAndClose();
      return;
    }
    if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    const code = parseRjCode(link.getAttribute(CODE_ATTR) ?? '');
    if (!code) return;
    event.preventDefault();
    event.stopPropagation();
    cancelHide();
    popup.open(code, link.getBoundingClientRect(), true);
  };

  const onMouseOver = (event: MouseEvent) => {
    if (window.innerWidth <= 768 || popup.getSnapshot().pinned) return;
    const link = getLink(event.target);
    if (!link || link.contains(event.relatedTarget as Node | null)) return;
    const code = parseRjCode(link.getAttribute(CODE_ATTR) ?? '');
    if (!code) return;
    cancelHide();
    popup.open(code, link.getBoundingClientRect(), false);
  };

  const onMouseOut = (event: MouseEvent) => {
    const link = getLink(event.target);
    if (!link || link.contains(event.relatedTarget as Node | null)) return;
    startHide();
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const link = getLink(event.target);
    if (!link || link instanceof HTMLAnchorElement) return;
    const code = parseRjCode(link.getAttribute(CODE_ATTR) ?? '');
    if (!code) return;
    event.preventDefault();
    cancelHide();
    popup.open(code, link.getBoundingClientRect(), true);
  };

  document.addEventListener('click', onClick);
  document.addEventListener('mouseover', onMouseOver);
  document.addEventListener('mouseout', onMouseOut);
  document.addEventListener('keydown', onKeyDown);

  return () => {
    cancelScheduledPrefetch();
    prefetch.cancel();
    observer.disconnect();
    cancelHide();
    document.removeEventListener('click', onClick);
    document.removeEventListener('mouseover', onMouseOver);
    document.removeEventListener('mouseout', onMouseOut);
    document.removeEventListener('keydown', onKeyDown);
    document.removeEventListener('visibilitychange', cancelPrefetchWhenHidden);
    resources.dispose();
    render(null, mount);
    mount.remove();
  };
}

export function enhanceSouthPlusNode(root: Node): void {
  if (root instanceof HTMLElement && (root.closest('.rwg-root') || root.closest(`.${LINK_CLASS}`))) return;
  if (root.nodeType === Node.TEXT_NODE) {
    linkifyText(root as Text);
    return;
  }
  if (!(root instanceof Element || root instanceof DocumentFragment || root instanceof Document)) return;

  if (root instanceof HTMLAnchorElement) enhanceAnchor(root);
  root.querySelectorAll?.('a[href]').forEach((anchor) => enhanceAnchor(anchor as HTMLAnchorElement));

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent || !node.nodeValue || !RJ_CODE_SEARCH_PATTERN.test(node.nodeValue)) return NodeFilter.FILTER_REJECT;
      RJ_CODE_SEARCH_PATTERN.lastIndex = 0;
      if (parent.closest('.rwg-root, .rwg-rj-link, script, style, textarea, input, [contenteditable="true"]')) {
        return NodeFilter.FILTER_REJECT;
      }
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  const texts: Text[] = [];
  while (walker.nextNode()) texts.push(walker.currentNode as Text);
  for (const text of texts) linkifyText(text);
}

function enhanceAnchor(anchor: HTMLAnchorElement): void {
  if (!DL_SITE_URL.test(anchor.href)) return;
  const code = findRjCodes(anchor.href).at(-1);
  if (!code) return;
  anchor.classList.add(LINK_CLASS);
  anchor.setAttribute(CODE_ATTR, code);
}

function linkifyText(textNode: Text): void {
  const value = textNode.nodeValue ?? '';
  const matches = [...value.matchAll(new RegExp(RJ_CODE_SEARCH_PATTERN.source, RJ_CODE_SEARCH_PATTERN.flags))];
  if (!matches.length || !textNode.parentNode) return;
  const fragment = document.createDocumentFragment();
  let cursor = 0;
  for (const match of matches) {
    const index = match.index ?? 0;
    if (index > cursor) fragment.append(value.slice(cursor, index));
    const code = parseRjCode(match[0]);
    if (code) fragment.append(createCodeElement(code));
    else fragment.append(match[0]);
    cursor = index + match[0].length;
  }
  if (cursor < value.length) fragment.append(value.slice(cursor));
  textNode.replaceWith(fragment);
}

function createCodeElement(code: RjCode): HTMLSpanElement {
  const element = document.createElement('span');
  element.className = LINK_CLASS;
  element.setAttribute(CODE_ATTR, code);
  element.textContent = code;
  element.tabIndex = 0;
  element.setAttribute('role', 'button');
  return element;
}

function collectCandidates(): PrefetchCandidate[] {
  return [...document.querySelectorAll<HTMLElement>(`.${LINK_CLASS}`)].map((element, order) => {
    const code = parseRjCode(element.getAttribute(CODE_ATTR) ?? '')!;
    const rect = element.getBoundingClientRect();
    return {
      code,
      top: Math.abs(rect.top),
      visible: rect.bottom >= 0 && rect.top <= window.innerHeight,
      order,
    };
  });
}
