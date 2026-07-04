<template>
  <div class="rj-warp-gate-tags-container" v-if="tags && tags.length > 0">
    <span 
      v-for="(tag, index) in tags" 
      :key="index" 
      class="rj-warp-gate-tag" 
      :class="[tag.class, tag.small ? 'is-small' : '']"
      @click="tag.onClick ? tag.onClick() : null"
      :style="tag.onClick ? 'cursor: pointer;' : ''"
    >
      {{ tag.text }}
    </span>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  tags: { text: string; class?: string; small?: boolean; onClick?: () => void }[];
}>();
</script>

<style scoped>
.rj-warp-gate-tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
  margin-bottom: 8px;
}

.rj-warp-gate-tag {
  padding: 2px 8px;
  border-radius: 4px;
  background-color: rgba(255, 255, 255, 0.15);
  color: #fff;
  font-size: 0.85em;
  line-height: 1.2;
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(4px);
}

.rj-warp-gate-tag.is-small {
  font-size: 0.75em;
  padding: 2px 6px;
}

/* Base tag colors translated from old CSS to modern equivalents */
:deep(.voicelink-tag-blue) { background-color: rgba(18, 62, 121, 0.8); border-color: #00224b; }
:deep(.voicelink-tag-red) { background-color: rgba(164, 34, 23, 0.8); border-color: #730600; }
:deep(.voicelink-tag-green) { background-color: rgba(39, 129, 43, 0.8); border-color: #015004; }
:deep(.voicelink-tag-orange) { background-color: rgba(191, 100, 3, 0.8); border-color: #944b00; }
:deep(.voicelink-tag-purple) { background-color: rgba(85, 39, 129, 0.8); border-color: #36016c; }
:deep(.voicelink-tag-yellow) { background-color: rgba(175, 155, 15, 0.8); border-color: #8c7b04; }
</style>
