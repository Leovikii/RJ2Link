<template>
  <div class="rj-warp-gate-info-row" v-if="items && items.length > 0">
    <span 
      class="rj-warp-gate-info-title" 
      :title="copyHint"
      @click="onCopy(copyText || title, $event)"
    >
      {{ title }}
    </span>
    <span class="rj-warp-gate-info-content">
      <template v-for="(item, index) in items" :key="index">
        <span 
          v-if="item.text" 
          :class="['rj-warp-gate-info-item', item.class]" 
          :title="copyHint"
          @click="onCopy(item.text, $event)"
        >
          {{ item.text }}
        </span>
        <span v-if="index < items.length - 1" class="rj-warp-gate-info-separator">{{ separator || ' ' }}</span>
      </template>
    </span>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{
  title: string;
  items: { text: string; class?: string }[];
  separator?: string;
  copyText?: string;
  copyHint?: string;
}>();

const onCopy = (text: string, e: MouseEvent) => {
  if (text && typeof GM_setClipboard !== 'undefined') {
    GM_setClipboard(text, 'text');
    // Simple visual feedback
    const target = e.target as HTMLElement;
    const oldColor = target.style.color;
    target.style.color = '#4ade80';
    setTimeout(() => {
      target.style.color = oldColor;
    }, 500);
  }
};
</script>

<style scoped>
.rj-warp-gate-info-row {
  display: flex;
  align-items: flex-start;
  margin-bottom: 4px;
  font-size: 0.95em;
  line-height: 1.4;
}

.rj-warp-gate-info-title {
  font-weight: 600;
  margin-right: 8px;
  color: rgba(255, 255, 255, 0.9);
  white-space: nowrap;
  cursor: pointer;
  transition: color 0.2s;
}

.rj-warp-gate-info-title::after {
  content: ":";
}

.rj-warp-gate-info-title:hover {
  text-decoration: underline;
  color: #fff;
}

.rj-warp-gate-info-content {
  flex: 1;
  color: rgba(255, 255, 255, 0.8);
}

.rj-warp-gate-info-item {
  cursor: pointer;
  transition: color 0.2s;
}

.rj-warp-gate-info-item:hover {
  text-decoration: underline;
  color: #fff;
}

.rj-warp-gate-info-separator {
  color: rgba(255, 255, 255, 0.5);
  margin: 0 2px;
}

/* Specific styling for age ratings translated from old CSS */
:deep(.voicelink-age-18) {
  color: #ef4444;
  background-color: rgba(255, 255, 255, 0.9);
  padding: 1px 6px;
  border-radius: 4px;
  font-weight: bold;
  font-size: 0.85em;
}

:deep(.voicelink-age-all) {
  color: #22c55e;
  background-color: rgba(255, 255, 255, 0.9);
  padding: 1px 6px;
  border-radius: 4px;
  font-weight: bold;
  font-size: 0.85em;
}
</style>
