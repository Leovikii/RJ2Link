<template>
  <div class="rj-fab-container" 
       :class="{ 'is-left-half': isLeftHalf, 'is-transitioning': isTransitioning, 'is-expanded': isExpanded }" 
       :style="fabStyle"
       ref="fabContainerRef"
       @mouseenter="onMouseEnter"
       @mouseleave="onMouseLeave">
    
    <div 
      class="fab-trigger" 
      ref="fabTriggerRef"
      :class="{ 'is-clickable': isClickable, 'is-loading': isLoading, 'is-error': isError }"
      @mousedown="onDragStart"
      @touchstart="onDragStart"
      @click="onClick"
    >
      <slot></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';

const props = defineProps<{
  isClickable?: boolean;
  isLoading?: boolean;
  isError?: boolean;
  isExpanded?: boolean;
}>();

const emit = defineEmits(['hover-enter', 'hover-leave', 'click']);

const fabContainerRef = ref<HTMLElement | null>(null);
const fabTriggerRef = ref<HTMLElement | null>(null);

// Drag & Drop State
const fabPos = ref({ x: -1, y: -1 });
const isTransitioning = ref(false);
const isDragging = ref(false);

const isLeftHalf = computed(() => {
  if (fabPos.value.x === -1) return false;
  return fabPos.value.x < window.innerWidth / 2;
});

const fabStyle = computed(() => {
  if (window.innerWidth > 768) return {}; // Fixed by CSS on desktop

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
      // Mobile: Edge snapping
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
          left: 'auto',
          right: `${padding}px`,
          top: `${fabPos.value.y}px`,
          bottom: 'auto'
        };
      }
    }
  }
  return {};
});

let dragStartX = 0;
let dragStartY = 0;
let initialFabX = 0;
let initialFabY = 0;
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
  if (window.innerWidth > 768) return; // Disable dragging on desktop

  if (e.type === 'touchstart') {
    lastTouchTime = Date.now();
  } else if (e.type === 'mousedown') {
    // Only left click
    if ((e as MouseEvent).button !== 0) return;
  }

  isTransitioning.value = false;
  isDragging.value = true;
  dragDistance = 0;

  const clientX = e.type === 'touchstart' ? (e as TouchEvent).touches[0].clientX : (e as MouseEvent).clientX;
  const clientY = e.type === 'touchstart' ? (e as TouchEvent).touches[0].clientY : (e as MouseEvent).clientY;

  dragStartX = clientX;
  dragStartY = clientY;

  if (fabContainerRef.value) {
    const rect = fabContainerRef.value.getBoundingClientRect();
    initialFabX = rect.left;
    initialFabY = rect.top;
    fabPos.value = { x: initialFabX, y: initialFabY };
  }

  if (e.type === 'mousedown') {
    e.preventDefault(); // Prevent text selection
  }

  window.addEventListener('mousemove', onDragMove, { passive: false });
  window.addEventListener('touchmove', onDragMove, { passive: false });
  window.addEventListener('mouseup', onDragEnd);
  window.addEventListener('touchend', onDragEnd);
}

function onDragMove(e: MouseEvent | TouchEvent) {
  if (!isDragging.value) return;
  
  if (e.type === 'touchmove') {
    e.preventDefault(); // Prevent scrolling while dragging
  }

  const clientX = e.type === 'touchmove' ? (e as TouchEvent).touches[0].clientX : (e as MouseEvent).clientX;
  const clientY = e.type === 'touchmove' ? (e as TouchEvent).touches[0].clientY : (e as MouseEvent).clientY;

  const dx = clientX - dragStartX;
  const dy = clientY - dragStartY;
  
  dragDistance = Math.sqrt(dx * dx + dy * dy);

  fabPos.value = {
    x: initialFabX + dx,
    y: initialFabY + dy
  };
}

function onDragEnd(e: MouseEvent | TouchEvent) {
  window.removeEventListener('mousemove', onDragMove);
  window.removeEventListener('touchmove', onDragMove);
  window.removeEventListener('mouseup', onDragEnd);
  window.removeEventListener('touchend', onDragEnd);
  
  if (isDragging.value && dragDistance <= 5) {
    // Small drag distance counts as click on mobile
    emit('click', e);
  }
  
  isDragging.value = false;
  isTransitioning.value = true;
  clampPosition();
  
  setTimeout(() => {
    isTransitioning.value = false;
  }, 300);
}

function onClick(e: MouseEvent) {
  if (window.innerWidth > 768) {
    emit('click', e);
  }
}

function onMouseEnter(e: MouseEvent) {
  emit('hover-enter', e);
}

function onMouseLeave(e: MouseEvent) {
  emit('hover-leave', e);
}

onMounted(() => {
  window.addEventListener('resize', clampPosition);
});

onUnmounted(() => {
  window.removeEventListener('resize', clampPosition);
  window.removeEventListener('mousemove', onDragMove);
  window.removeEventListener('touchmove', onDragMove);
  window.removeEventListener('mouseup', onDragEnd);
  window.removeEventListener('touchend', onDragEnd);
});
</script>

<style scoped>
.rj-fab-container {
  position: fixed;
  bottom: 120px;
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
  background: #242424; /* Solid color */
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 27px;
  padding: 0 16px;
  height: 54px;
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
  background: #2d2d2d;
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

  .fab-trigger {
    height: 44px;
    padding: 0 13px;
    border-radius: 22px;
  }
}
</style>
