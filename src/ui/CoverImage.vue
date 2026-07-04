<template>
  <div class="rj-warp-gate-img-container">
    <img 
      v-if="src" 
      :src="src" 
      @mouseenter="isHovered = true" 
      @mouseleave="isHovered = false"
      :class="{ 'is-hovered': isHovered }"
    />
    <div v-else class="rj-warp-gate-img-placeholder">
      <div class="rj-warp-gate-img-skeleton"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{
  src?: string;
}>();

const isHovered = ref(false);
</script>

<style scoped>
.rj-warp-gate-img-container {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  /* Removed height: 100% and min-height to allow tight wrapping of image */
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  overflow: hidden;
}

.rj-warp-gate-img-container img {
  width: 100%;
  height: auto;
  max-height: 350px;
  object-fit: cover; /* fill the container */
  border-radius: 8px;
  transition: transform 0.3s ease;
  display: block; /* prevent phantom margins */
}

.rj-warp-gate-img-container img.is-hovered {
  transform: scale(1.05);
}

.rj-warp-gate-img-placeholder {
  width: 100%;
  height: 100%;
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.rj-warp-gate-img-skeleton {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: linear-gradient(90deg, rgba(255,255,255,0.1) 25%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.1) 75%);
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
