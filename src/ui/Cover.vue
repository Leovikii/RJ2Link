<template>
  <div class="rj-warp-gate-img-container" :style="{ aspectRatio }">
    <img 
      v-if="src" 
      :src="src" 
      @load="onImageLoad"
      @mouseenter="isHovered = true" 
      @mouseleave="isHovered = false"
      :class="{ 'is-hovered': isHovered, 'is-loaded': isLoaded }"
    />
    <div v-if="!src || !isLoaded" class="rj-warp-gate-img-placeholder">
      <div class="rj-warp-gate-img-skeleton"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

const props = withDefaults(defineProps<{
  src?: string;
  aspectRatio?: string;
}>(), {
  aspectRatio: '4/3' // Default to 4/3 for DLsite covers
});

const isHovered = ref(false);
const isLoaded = ref(false);

const onImageLoad = () => {
  isLoaded.value = true;
};

// Reset loading state when src changes
watch(() => props.src, (newSrc, oldSrc) => {
  if (newSrc !== oldSrc) {
    isLoaded.value = false;
  }
});
</script>

<style scoped>
.rj-warp-gate-img-container {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  background-color: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  overflow: hidden;
  position: relative;
}

.rj-warp-gate-img-container img {
  width: 100%;
  height: 100%;
  object-fit: cover; /* fill the container while preserving aspect ratio */
  border-radius: 8px;
  transition: transform 0.3s ease, opacity 0.4s ease;
  display: block;
  opacity: 0; /* Starts transparent */
  z-index: 2;
  position: relative;
}

.rj-warp-gate-img-container img.is-loaded {
  opacity: 1;
}

.rj-warp-gate-img-container img.is-hovered {
  transform: scale(1.05);
}

.rj-warp-gate-img-placeholder {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
}

.rj-warp-gate-img-skeleton {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(90deg, rgba(255,255,255,0.05) 25%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.05) 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
}

@keyframes skeleton-loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
</style>
