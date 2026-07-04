<template>
  <FloatingButton
    :is-clickable="isClickable"
    :is-loading="isLoading"
    :is-error="isError"
    :is-expanded="popupState.display"
    :class="VOICELINK_CLASS"
    :rjcode="rjCode"
    @hover-enter="onHoverEnter"
    @hover-leave="onHoverLeave"
    @click="onClick"
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
  </FloatingButton>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import FloatingButton from '../../ui/FloatingButton.vue';
import { VOICELINK_CLASS } from '../../config/constants';
import { localize } from '../../config/localization';
import { popupManager, popupState } from './popup';
import { isLoading, isError, errorMessage, asmrOneUrl, results, spState, fetchDLsiteData } from './store';

const props = defineProps<{
  rjCode: string;
}>();

const t = {
  noResource: localize('no_resources'),
  searchFailed: localize('search_failed'),
  clickToRetry: localize('click_to_retry'),
};

const hasAnyResource = computed(() => asmrOneUrl.value !== null || results.value.length > 0);
const isClickable = computed(() => !isLoading.value && (hasAnyResource.value || isError.value || spState.value === 'empty'));

function onHoverEnter(e: MouseEvent) {
  if (isClickable.value && !isLoading.value && !isError.value && hasAnyResource.value) {
    popupManager.mouseenter(e);
  }
}

function onHoverLeave(e: MouseEvent) {
  popupManager.mouseleave(e);
}

function onClick(e: MouseEvent) {
  if (isLoading.value) return;
  if (isError.value || (!hasAnyResource.value && spState.value === 'empty')) {
    fetchDLsiteData(props.rjCode, true); // Force retry bypasses cache
    return;
  }
  if (isClickable.value) {
    popupManager.click(e);
  }
}

onMounted(() => {
  fetchDLsiteData(props.rjCode);
});
</script>

<style scoped>
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
  font-size: 20px;
  letter-spacing: -0.5px;
}

.badge-icon {
  width: 22px;
  height: 22px;
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
  font-size: 18px;
  font-weight: 700;
  line-height: 1;
}

@media screen and (max-width: 768px) {
  .sp-text-logo {
    font-size: 15px;
  }
  .badge-icon {
    width: 16px;
    height: 16px;
  }
  .badge-text {
    font-size: 14px;
  }
}
</style>
