<template>
  <PopupPanel
    :display="state.display"
    theme="default"
    :positionStyle="positionStyle"
    transformOrigin="bottom right"
    @close="closePopup"
  >
    <div class="panel-body">
      <!-- ASMR ONE Button -->
      <template v-if="isAsmrLoading">
        <div class="skeleton-btn"></div>
      </template>
      <ActionButton 
        v-else-if="asmrOneUrl"
        theme="asmrone"
        :href="asmrOneUrl"
        :title="t.asmrOne"
      />

      <!-- South Plus Results -->
      <div class="southplus-section">
        <div class="sp-header">
          <span class="sp-text-logo">SP</span> {{ t.spResources }}
          <span v-if="!isSpLoading && results.length > 0">({{ results.length }})</span>
        </div>
        
        <template v-if="isSpLoading">
          <ul class="results-list">
             <li v-for="i in 2" :key="i">
                <div class="skeleton-result">
                  <div class="skeleton-line title"></div>
                  <div class="skeleton-line meta"></div>
                </div>
             </li>
          </ul>
        </template>
        
        <template v-else-if="spState === 'error'">
           <div class="sp-error-box">
             <svg class="error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
             <div class="error-text">
               <div class="error-title">检索失败</div>
               <div class="error-desc">{{ getSpErrorText(spErrorMsg) }}</div>
             </div>
           </div>
        </template>

        <template v-else-if="results.length > 0">
          <ul class="results-list">
            <li v-for="(result, index) in results" :key="index">
              <a :href="result.url" target="_blank" class="result-link">
                <span class="result-title">{{ result.title }}</span>
                <span class="result-meta" v-if="result.author">{{ result.author }} · {{ result.date }}</span>
              </a>
            </li>
          </ul>
        </template>
        
        <template v-else>
           <div class="sp-empty">未找到相关资源</div>
        </template>
      </div>
    </div>
  </PopupPanel>
</template>

<script setup lang="ts">
import { toRefs, watch } from 'vue';
import type { PopupState } from '../../types';
import PopupPanel from '../../ui/PopupPanel.vue';
import ActionButton from '../../ui/ActionButton.vue';
import { usePopupPosition } from '../../core/usePopupPosition';
import { localize } from '../../config/localization';
import { isSpLoading, isAsmrLoading, spState, spErrorMsg, asmrOneUrl, results, fetchDLsiteData } from './store';

const props = defineProps<{
  state: PopupState;
}>();

const t = {
  spResources: localize('southplus_resources'),
  asmrOne: localize('go_to_asmrone'),
};

const getSpErrorText = (msg: string) => {
  if (msg === 'error_form_not_found') return '未登录南+或论坛结构改变，请检查登录状态。';
  if (msg === 'error_no_results') return '无权限或触发了论坛的安全防护策略。';
  if (msg.includes('上次搜索时间') || msg.includes('不能少于')) return '搜索过于频繁，受到论坛限制。';
  if (msg.includes('Network error')) return '网络连接超时或遭到拦截。';
  return msg || '未知错误';
};

// Use the generic position hook (estimated width 350, height 400 for DLsite results)
const { x, y } = toRefs(props.state);
const positionStyle = usePopupPosition(x, y, 350, 400);

const closePopup = () => {
  props.state.display = false;
  props.state.pinned = false;
};

// Fetch data when popup tries to open for a new RJ code
watch(() => props.state.rjCode, (newRjCode) => {
  if (newRjCode) {
    fetchDLsiteData(newRjCode);
  }
}, { immediate: true });
</script>

<style scoped>
.panel-body {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.southplus-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.sp-header {
  font-size: 15px;
  font-weight: 700;
  color: #a78bfa;
  display: flex;
  align-items: center;
  gap: 6px;
}

.sp-text-logo {
  font-weight: 900;
  font-size: 14px;
  background: #a78bfa;
  color: #1e1e1e;
  padding: 2px 6px;
  border-radius: 4px;
  line-height: 1;
}

.results-list {
  list-style: none;
  padding: 0 4px 0 0; /* Add 4px right padding for hover transform */
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 300px;
  overflow-y: auto;
  overflow-x: hidden; /* Hide horizontal scrollbar caused by hover translateX */
}

.results-list::-webkit-scrollbar {
  width: 6px;
  height: 6px; /* Just in case */
}

.results-list::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 3px;
}

.results-list::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
}

.result-link {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  text-decoration: none;
  color: #e5e7eb;
  transition: all 0.2s ease;
}

.result-link:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: #a78bfa;
  transform: translateX(4px);
}

.result-title {
  font-size: 13px;
  font-weight: 500;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.result-meta {
  font-size: 11px;
  color: #9ca3af;
}

/* Skeleton UI */
.skeleton-btn {
  height: 48px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.05);
  position: relative;
  overflow: hidden;
}

.skeleton-result {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  position: relative;
  overflow: hidden;
}

.skeleton-line {
  height: 14px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  position: relative;
  overflow: hidden;
}

.skeleton-line.title { width: 85%; }
.skeleton-line.meta { width: 40%; height: 11px; margin-top: 4px; }

/* Shimmer animation */
.skeleton-btn::after, .skeleton-result::after {
  content: "";
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  transform: translateX(-100%);
  background-image: linear-gradient(90deg, rgba(255, 255, 255, 0) 0, rgba(255, 255, 255, 0.05) 20%, rgba(255, 255, 255, 0.1) 60%, rgba(255, 255, 255, 0));
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  100% { transform: translateX(100%); }
}

/* Error Box */
.sp-error-box {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 16px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 8px;
  color: #f87171;
}

.error-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  margin-top: 2px;
}

.error-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.error-title {
  font-size: 13px;
  font-weight: 600;
}

.error-desc {
  font-size: 12px;
  color: #fca5a5;
  line-height: 1.4;
}

.sp-empty {
  font-size: 13px;
  color: #9ca3af;
  text-align: center;
  padding: 16px 0;
}
</style>
