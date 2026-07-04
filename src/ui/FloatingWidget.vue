<template>
  <div class="rj-fab-container" 
       :class="{ 'is-expanded': isExpanded, 'is-left-half': isLeftHalf, 'is-transitioning': isTransitioning }" 
       :style="fabStyle"
       ref="fabContainerRef"
       @mouseenter="onContainerMouseEnter"
       @mouseleave="onContainerMouseLeave">
    
    <!-- Expanded Modal -->
    <PopupPanel
      :display="isExpanded"
      theme="default"
      :transformOrigin="popupTransformOrigin"
      :positionStyle="popupPositionStyle"
      @close="isExpanded = false; isPinned = false"
    >
      <div class="panel-body">
        <!-- ASMR ONE Button -->
        <ActionButton 
          v-if="asmrOneUrl"
          theme="asmrone"
          :href="asmrOneUrl"
          :title="t.asmrOne"
        />

        <!-- South Plus Results -->
        <div class="southplus-section" v-if="results.length > 0">
          <div class="sp-header"><span class="sp-text-logo">SP</span> {{ t.spResources }} ({{ results.length }})</div>
          <ul class="results-list">
            <li v-for="(result, index) in results" :key="index">
              <a :href="result.url" target="_blank" class="result-link">
                <span class="result-title">{{ result.title }}</span>
                <span class="result-meta" v-if="result.author">{{ result.author }} · {{ result.date }}</span>
              </a>
            </li>
          </ul>
        </div>
      </div>
    </PopupPanel>

    <!-- FAB Trigger -->
    <div 
      class="fab-trigger" 
      :class="{ 'is-clickable': isClickable, 'is-loading': isLoading, 'is-error': isError }"
      @mousedown="onDragStart"
      @touchstart="onDragStart"
    >
      <div class="fab-content">
        <div class="fab-status">
          <span class="status-badge rj-logo" title="RJ Warp Gate">
            <svg class="badge-icon" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="rj-bg" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#8b5cf6" />
                  <stop offset="100%" stop-color="#ec4899" />
                </linearGradient>
              </defs>
              <rect width="64" height="64" rx="14" fill="url(#rj-bg)" />
              <text x="29" y="44" font-family="Arial, 'Helvetica Neue', Helvetica, sans-serif" font-weight="900" font-style="italic" font-size="36" fill="#ffffff" text-anchor="middle" letter-spacing="-1">RJ</text>
            </svg>
          </span>
          <span v-if="isLoading" class="status-badge rj-loading">
            <svg class="spin-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
            </svg>
          </span>
          <span v-else-if="isError" class="status-badge rj-error" :title="errorMessage ? `${errorMessage} (${t.clickToRetry})` : `${t.searchFailed} (${t.clickToRetry})`">
            <svg class="badge-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </span>
          <template v-else>
            <span v-if="!hasAnyResource" class="status-badge rj-empty" :title="t.clickToRetry">
              <svg class="badge-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="8" y1="12" x2="16" y2="12"></line>
              </svg>
              <span class="badge-text">{{ t.noResource }}</span>
            </span>
            <template v-else>
              <span v-if="asmrOneUrl" class="status-badge rj-asmr" title="ASMRone 可用">
                <svg class="badge-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M3 18v-6a9 9 0 0 1 18 0v6"></path>
                  <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path>
                </svg>
              </span>
              <span v-if="results.length > 0" class="status-badge rj-sp" title="南+有资源">
                <span class="sp-text-logo">SP</span>
                <span class="badge-text">{{ results.length }}</span>
              </span>
            </template>
          </template>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { searchSouthPlus, cleanupCache, SouthPlusSearchResult } from '../sites/southplus/search';
import { WorkPromise } from '../common/scraper';
import ActionButton from './ActionButton.vue';
import PopupPanel from './PopupPanel.vue';
import { localize } from '../config/localization';

const t = {
  title: localize('rj_warp_gate_title'),
  searching: localize('searching'),
  noResource: localize('no_resources'),
  spResources: localize('southplus_resources'),
  asmrOne: localize('go_to_asmrone'),
  searchFailed: localize('search_failed'),
  clickToRetry: localize('click_to_retry'),
};

const props = defineProps<{
  rjCode: string;
}>();

const isExpanded = ref(false);
const isPinned = ref(false);
const fabContainerRef = ref<HTMLElement | null>(null);

function handleClickOutside(event: MouseEvent) {
  if (isExpanded.value && fabContainerRef.value && !fabContainerRef.value.contains(event.target as Node)) {
    isExpanded.value = false;
    isPinned.value = false;
  }
}

// Drag & Drop State
const fabPos = ref({ x: -1, y: -1 });
const isTransitioning = ref(false);

const isLeftHalf = computed(() => {
  if (fabPos.value.x === -1) return false;
  return fabPos.value.x < window.innerWidth / 2;
});

const fabStyle = computed(() => {
  if (fabPos.value.x !== -1) {
    if (isDragging.value) {
      // While dragging, exactly follow the mouse (left/top)
      return {
        left: `${fabPos.value.x}px`,
        top: `${fabPos.value.y}px`,
        bottom: 'auto',
        right: 'auto'
      };
    } else {
      // Desktop: Keep exactly where dragged (free floating).
      // Mobile: Edge snapping (no padding, snaps directly to edge).
      const isMobile = window.innerWidth <= 768;
      
      if (!isMobile) {
        return {
          left: `${fabPos.value.x}px`,
          top: `${fabPos.value.y}px`,
          bottom: 'auto',
          right: 'auto'
        };
      }
      
      const padding = 0;
      if (isLeftHalf.value) {
        return {
          left: `${padding}px`,
          top: `${fabPos.value.y}px`,
          bottom: 'auto',
          right: 'auto'
        };
      } else {
        return {
          right: `${padding}px`,
          top: `${fabPos.value.y}px`,
          bottom: 'auto',
          left: 'auto'
        };
      }
    }
  }
  return {};
});

const popupPositionStyle = computed(() => {
  if (!isExpanded.value) return {};
  if (window.innerWidth <= 768) return {};

  const style: Record<string, string> = {};
  let x = fabPos.value.x;
  let y = fabPos.value.y;
  let width = 64;
  let height = 48;

  if (fabContainerRef.value) {
    const rect = fabContainerRef.value.getBoundingClientRect();
    x = rect.left;
    y = rect.top;
    width = rect.width;
    height = rect.height;
  } else if (x === -1) {
    x = window.innerWidth - 30 - width;
    y = window.innerHeight - 100 - height;
  }

  const isLeft = x < window.innerWidth / 2;
  const isTop = y < window.innerHeight / 2;

  if (isLeft) {
    style.left = `${x}px`;
  } else {
    style.right = `${window.innerWidth - x - width}px`;
  }

  if (isTop) {
    style.top = `${y + height + 16}px`;
  } else {
    style.bottom = `${window.innerHeight - y + 16}px`;
  }

  return style;
});

const popupTransformOrigin = computed(() => {
  if (window.innerWidth <= 768) return 'bottom center';
  
  let x = fabPos.value.x;
  let y = fabPos.value.y;
  if (fabContainerRef.value) {
    const rect = fabContainerRef.value.getBoundingClientRect();
    x = rect.left;
    y = rect.top;
  } else if (x === -1) {
    x = window.innerWidth - 94;
    y = window.innerHeight - 148;
  }
  
  const isLeft = x < window.innerWidth / 2;
  const isTop = y < window.innerHeight / 2;
  
  return `${isTop ? 'top' : 'bottom'} ${isLeft ? 'left' : 'right'}`;
});

let hoverTimer: number | null = null;

function onContainerMouseEnter() {
  if (window.innerWidth <= 768) return;
  if (hoverTimer) {
    clearTimeout(hoverTimer);
    hoverTimer = null;
  }
  if (!isDragging.value && isClickable.value && !isExpanded.value) {
    isExpanded.value = true;
  }
}

function onContainerMouseLeave() {
  if (window.innerWidth <= 768) return;
  if (isPinned.value) return; // Don't close if pinned
  if (isExpanded.value) {
    hoverTimer = window.setTimeout(() => {
      isExpanded.value = false;
    }, 300);
  }
}

let dragStartX = 0;
let dragStartY = 0;
let initialFabX = 0;
let initialFabY = 0;
const isDragging = ref(false);
let dragDistance = 0;
let lastTouchTime = 0;

function clampPosition() {
  if (fabPos.value.x !== -1) {
    const fabWidth = fabContainerRef.value ? fabContainerRef.value.offsetWidth : 64;
    const fabHeight = fabContainerRef.value ? fabContainerRef.value.offsetHeight : 48;
    
    const maxX = Math.max(0, window.innerWidth - fabWidth);
    const maxY = Math.max(0, window.innerHeight - fabHeight);
    
    const newX = Math.max(0, Math.min(fabPos.value.x, maxX));
    const newY = Math.max(0, Math.min(fabPos.value.y, maxY));
    
    if (newX !== fabPos.value.x || newY !== fabPos.value.y) {
      fabPos.value = { x: newX, y: newY };
    }
  }
}

function onDragStart(e: MouseEvent | TouchEvent) {
  if (e.type === 'touchstart') {
    lastTouchTime = Date.now();
  } else if (e.type === 'mousedown') {
    if (Date.now() - lastTouchTime < 500) return; // Prevent double trigger from emulated mousedown
    if ((e as MouseEvent).button !== 0) return; // Only left click
  }
  
  isDragging.value = false;
  dragDistance = 0;
  isTransitioning.value = false;
  
  const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
  const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
  
  dragStartX = clientX;
  dragStartY = clientY;
  
  if (fabContainerRef.value) {
    const rect = fabContainerRef.value.getBoundingClientRect();
    initialFabX = rect.left;
    initialFabY = rect.top;
    
    if (fabPos.value.x === -1) {
      fabPos.value = { x: rect.left, y: rect.top };
    }
  }

  window.addEventListener('mousemove', onDragMove);
  window.addEventListener('touchmove', onDragMove, { passive: false });
  window.addEventListener('mouseup', onDragEnd);
  window.addEventListener('touchend', onDragEnd);
}

function onDragMove(e: MouseEvent | TouchEvent) {
  const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
  const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
  
  const dx = clientX - dragStartX;
  const dy = clientY - dragStartY;
  
  dragDistance = Math.sqrt(dx * dx + dy * dy);
  
  if (dragDistance > 5) {
    isDragging.value = true;
    if ('touches' in e && e.cancelable) {
       e.preventDefault();
    }
    
    let newX = initialFabX + dx;
    let newY = initialFabY + dy;
    
    if (fabContainerRef.value) {
      const rect = fabContainerRef.value.getBoundingClientRect();
      const maxX = window.innerWidth - rect.width;
      const maxY = window.innerHeight - rect.height;
      newX = Math.max(0, Math.min(newX, maxX));
      newY = Math.max(0, Math.min(newY, maxY));
    }
    
    fabPos.value = { x: newX, y: newY };
  }
}

function onDragEnd() {
  window.removeEventListener('mousemove', onDragMove);
  window.removeEventListener('touchmove', onDragMove);
  window.removeEventListener('mouseup', onDragEnd);
  window.removeEventListener('touchend', onDragEnd);
  
  const isMobile = window.innerWidth <= 768;
  const storageKey = isMobile ? 'rj_warp_gate_fab_pos_mobile' : 'rj_warp_gate_fab_pos_desktop';

  if (!isDragging.value || dragDistance <= 5) {
    togglePanel();
  } else {
    if (isMobile) {
      // Snap to edge on mobile
      if (fabContainerRef.value) {
        isTransitioning.value = true;
        const rect = fabContainerRef.value.getBoundingClientRect();
        const snapX = isLeftHalf.value ? 0 : window.innerWidth - rect.width;
        fabPos.value.x = snapX;
        
        if (typeof GM_setValue !== 'undefined') {
          GM_setValue(storageKey, JSON.stringify(fabPos.value));
        }
        
        setTimeout(() => {
          isTransitioning.value = false;
        }, 300);
      }
    } else {
      // Free floating on desktop
      if (typeof GM_setValue !== 'undefined') {
        GM_setValue(storageKey, JSON.stringify(fabPos.value));
      }
    }
  }
}

const asmrOneState = ref<'loading' | 'success' | 'empty'>('loading');
const asmrOneUrl = ref<string | null>(null);

const spState = ref<'loading' | 'success' | 'empty' | 'error'>('loading');
const results = ref<SouthPlusSearchResult[]>([]);
const errorMessage = ref('');

function fetchSouthPlus(force = false) {
  spState.value = 'loading';
  searchSouthPlus(props.rjCode, force).then(response => {
    if (response.isCooldown || !response.success) {
      spState.value = 'error';
      errorMessage.value = localize(response.errorMsg) || response.errorMsg || t.searchFailed;
      return;
    }
    if (response.results.length === 0) {
      spState.value = 'empty';
    } else {
      results.value = response.results;
      spState.value = 'success';
    }
  });
}

onMounted(async () => {
  // Bind click outside listener
  document.addEventListener('click', handleClickOutside);
  window.addEventListener('resize', clampPosition);

  // Restore position
  if (typeof GM_getValue !== 'undefined') {
    const isMobile = window.innerWidth <= 768;
    const storageKey = isMobile ? 'rj_warp_gate_fab_pos_mobile' : 'rj_warp_gate_fab_pos_desktop';
    
    // Fallback migration from old universal key for desktop
    let saved = GM_getValue(storageKey, null);
    if (!saved && !isMobile) {
      saved = GM_getValue('rj_warp_gate_fab_pos', null);
      if (saved) GM_setValue(storageKey, saved);
    }
    
    if (saved) {
      try {
        const pos = JSON.parse(saved);
        if (pos && typeof pos.x === 'number' && pos.x !== -1) {
          fabPos.value = pos;
          setTimeout(clampPosition, 50); // Clamp after DOM might be ready
        }
      } catch (e) {}
    } else if (isMobile) {
      // Mobile default (hidden on right edge by default)
      fabPos.value = { x: window.innerWidth, y: window.innerHeight * 0.45 };
      setTimeout(clampPosition, 50);
    }
  }

  // Clean up legacy or expired caches
  cleanupCache();

  // Fire both searches in parallel
  WorkPromise.checkAsmrOne(props.rjCode).then(url => {
    asmrOneUrl.value = url;
    asmrOneState.value = url ? 'success' : 'empty';
  });

  fetchSouthPlus(false);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
  window.removeEventListener('resize', clampPosition);
});

const isLoading = computed(() => asmrOneState.value === 'loading' || spState.value === 'loading');
const isError = computed(() => spState.value === 'error');
const hasAnyResource = computed(() => asmrOneUrl.value !== null || results.value.length > 0);
const isClickable = computed(() => !isLoading.value && (hasAnyResource.value || isError.value || spState.value === 'empty'));

function togglePanel() {
  if (isLoading.value) return;
  if (isError.value || (!hasAnyResource.value && spState.value === 'empty')) {
    fetchSouthPlus(true); // Force retry bypasses cache
    return;
  }
  if (isClickable.value) {
    if (window.innerWidth <= 768) {
      isExpanded.value = !isExpanded.value;
    } else {
      // Desktop pinning logic
      if (!isPinned.value) {
        isPinned.value = true;
        isExpanded.value = true;
      } else {
        isPinned.value = false;
        isExpanded.value = false;
      }
    }
  }
}
</script>

<style scoped>
.rj-fab-container {
  position: fixed;
  bottom: 100px;
  right: 30px;
  z-index: 2147483647;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

@media screen and (max-width: 768px) {
  .rj-fab-container {
    bottom: auto;
    top: 45vh;
    right: 0;
  }
}

.rj-fab-container.is-transitioning {
  transition: left 0.3s cubic-bezier(0.25, 1, 0.5, 1), top 0.3s cubic-bezier(0.25, 1, 0.5, 1);
}

/* FAB Trigger */
.fab-trigger {
  background: rgba(30, 30, 30, 0.85);
  backdrop-filter: blur(12px) saturate(120%);
  -webkit-backdrop-filter: blur(12px) saturate(120%);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 22px;
  padding: 0 13px;
  height: 44px;
  display: flex;
  align-items: center;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
  transition: all 0.3s cubic-bezier(0.25, 1, 0.5, 1);
  user-select: none;
  opacity: 0.65;
}

.fab-trigger.is-clickable {
  cursor: pointer;
}

.rj-fab-container.is-expanded .fab-trigger,
.fab-trigger.is-clickable:hover {
  transform: translateY(-4px) scale(1.02);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.4);
  background: rgba(45, 45, 45, 0.9);
  border-color: rgba(255, 255, 255, 0.3);
  opacity: 1;
}

.fab-trigger.is-clickable:active {
  transform: translateY(0) scale(0.98);
}

@media screen and (max-width: 768px) {
  .rj-fab-container:not(.is-expanded) .fab-trigger {
    transform: translateX(14px); /* Hides the right edge padding like a bookmark */
    opacity: 0.9;
  }
  
  .rj-fab-container:not(.is-expanded).is-left-half .fab-trigger {
    transform: translateX(-14px); /* Hides the left edge padding */
  }
  
  .rj-fab-container:not(.is-expanded) .fab-trigger:active,
  .rj-fab-container:not(.is-expanded) .fab-trigger.is-loading,
  .rj-fab-container:not(.is-expanded) .fab-trigger.is-error {
    transform: translateX(0); /* Reveal fully when interacting or erroring */
    opacity: 1;
  }
}

.fab-content {
  display: flex;
  align-items: center;
  white-space: nowrap;
}

.fab-status {
  display: flex;
  align-items: center;
  gap: 14px;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  gap: 6px;
  transition: all 0.3s ease;
}

.status-badge.rj-loading, .status-badge.rj-empty {
  color: #fff;
  opacity: 0.85;
}

.sp-text-logo {
  font-weight: 900;
  font-size: 15px;
  letter-spacing: -0.5px;
}

.badge-icon {
  width: 16px;
  height: 16px;
}

.spin-icon {
  width: 18px;
  height: 18px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  100% { transform: rotate(360deg); }
}

.status-badge.rj-asmr {
  color: #51d8cf;
}

.status-badge.rj-sp {
  color: #a78bfa;
}

.status-badge.rj-error {
  color: #fca5a5;
}

.badge-text {
  font-size: 14px;
  font-weight: 700;
  line-height: 1;
}


.panel-body {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Premium Buttons */
.rj-premium-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 16px;
  border-radius: 12px;
  text-decoration: none;
  color: #ffffff;
  font-weight: 600;
  font-size: 15px;
  transition: all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.rj-premium-btn:hover {
  transform: translateY(-2px);
  filter: brightness(1.15);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3);
}

.theme-asmrone {
  background: linear-gradient(135deg, #00d2ff 0%, #3a7bd5 100%);
}

/* South Plus Section */
.southplus-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sp-header {
  font-size: 13px;
  font-weight: 600;
  color: #a78bfa;
  padding-left: 8px;
  border-left: 3px solid #a78bfa;
  display: flex;
  align-items: center;
  gap: 6px;
}

.results-list {
  list-style: none;
  margin: 0;
  padding: 0;
  max-height: 250px;
  overflow-y: auto;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.results-list::-webkit-scrollbar {
  width: 6px;
}
.results-list::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.02);
}
.results-list::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 3px;
}

.results-list li {
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.results-list li:last-child {
  border-bottom: none;
}

.result-link {
  display: flex;
  flex-direction: column;
  padding: 12px;
  text-decoration: none;
  transition: background 0.2s;
}

.result-link:hover {
  background: rgba(255, 255, 255, 0.05);
}

.result-title {
  color: #e2e8f0;
  font-size: 13px;
  line-height: 1.4;
  margin-bottom: 4px;
}

.result-link:hover .result-title {
  color: #60a5fa;
}

.result-meta {
  color: #94a3b8;
  font-size: 11px;
}

@media screen and (max-width: 600px) {
  .rj-fab-container {
    bottom: 100px;
    right: 16px;
  }
  .fab-trigger {
    height: 42px;
    padding: 6px 14px;
    border-radius: 24px;
  }
  .fab-logo {
    font-size: 18px;
  }
  .fab-status {
    font-size: 13px;
  }
  .results-list {
    max-height: 200px;
  }
}
</style>
