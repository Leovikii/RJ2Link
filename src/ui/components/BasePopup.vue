<template>
  <Transition name="fade">
    <div 
      v-if="display"
      ref="popupRef" 
      class="rj-warp-gate-popup"
      :class="[`theme-${theme}`, { 'is-centered': isCentered, 'is-mobile-expanded': isExpandedMobile }]"
      :style="[positionStyle, (dynamicHeight && !isMobile) ? { height: dynamicHeight + 'px' } : {}, transformOrigin ? { transformOrigin } : {}]"
      @touchstart="onTouchStart"
      @touchmove="onTouchMove"
      @touchend="onTouchEnd"
    >
      <div class="popup-drag-handle">
        <div class="drag-pill"></div>
      </div>
      <div class="popup-close-btn" @click="$emit('close')">✕</div>

      <div class="popup-inner-wrapper" ref="innerWrapperRef">
        <slot></slot>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, computed, onMounted, onUnmounted } from 'vue';

const props = withDefaults(defineProps<{
  display: boolean;
  theme?: 'maniax' | 'girls' | 'default';
  positionStyle?: Record<string, any>;
  transformOrigin?: string;
}>(), {
  theme: 'default',
  positionStyle: () => ({})
});

const isCentered = computed(() => Object.keys(props.positionStyle).length === 0);

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const popupRef = ref<HTMLElement | null>(null);
const innerWrapperRef = ref<HTMLElement | null>(null);
const dynamicHeight = ref<number | null>(null);
let resizeObserver: ResizeObserver | null = null;

const isMobile = ref(false);
const isExpandedMobile = ref(false);

function checkMobile() {
  // Use 768px to cover wider mobile devices like tablets/foldables elegantly
  isMobile.value = window.innerWidth <= 768;
}

onMounted(() => {
  checkMobile();
  window.addEventListener('resize', checkMobile);
});
onUnmounted(() => {
  window.removeEventListener('resize', checkMobile);
});

let touchStartY = 0;
let touchCurrentY = 0;
let isDraggingHandle = false;

function onTouchStart(e: TouchEvent) {
  if (!isMobile.value) return;
  const target = e.target as HTMLElement;
  const isHandle = target.closest('.popup-drag-handle');
  const scrollContainer = target.closest('.popup-inner-wrapper, .panel-right, .results-list');
  const isAtTop = scrollContainer ? scrollContainer.scrollTop <= 0 : true;

  if (isHandle || isAtTop) {
    touchStartY = e.touches[0].clientY;
    touchCurrentY = touchStartY;
    isDraggingHandle = true;
  }
}

function onTouchMove(e: TouchEvent) {
  if (!isDraggingHandle) return;
  touchCurrentY = e.touches[0].clientY;
}

function onTouchEnd() {
  if (!isDraggingHandle) return;
  isDraggingHandle = false;
  const dy = touchCurrentY - touchStartY;
  
  if (dy > 50) {
    if (isExpandedMobile.value) {
      isExpandedMobile.value = false;
    } else {
      emit('close');
    }
  } else if (dy < -50) {
    isExpandedMobile.value = true;
  }
}

watch(() => props.display, (newVal) => {
  if (newVal) {
    isExpandedMobile.value = false; // Reset on open
    nextTick(() => {
      if (innerWrapperRef.value) {
        if (!resizeObserver) {
          resizeObserver = new ResizeObserver((entries) => {
            window.requestAnimationFrame(() => {
              for (const entry of entries) {
                dynamicHeight.value = (entry.target as HTMLElement).offsetHeight + 32;
              }
            });
          });
        }
        resizeObserver.observe(innerWrapperRef.value);
      }
    });
  } else {
    if (resizeObserver) {
      resizeObserver.disconnect();
      resizeObserver = null;
    }
    dynamicHeight.value = null;
  }
});
</script>

<style scoped>
.rj-warp-gate-popup {
  position: fixed;
  z-index: 2147483646;
  width: 650px;
  max-width: 90vw;
  min-height: 250px;
  max-height: 85vh;
  
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  font-size: 14px;
  color: #f1f5f9;
  
  background-color: rgba(30, 30, 30, 0.85); /* Dark translucent background */
  backdrop-filter: blur(12px) saturate(120%);
  -webkit-backdrop-filter: blur(12px) saturate(120%);
  
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4), 0 8px 10px rgba(0, 0, 0, 0.2);
  
  padding: 16px;
  box-sizing: border-box;
  
  display: flex;
  flex-direction: column;
  pointer-events: auto; /* Allow mouse interaction within the popup */
  user-select: text;    /* Allow text selection */
  transition: height 0.35s cubic-bezier(0.25, 1, 0.5, 1);
  overflow: hidden;
}

.rj-warp-gate-popup.is-centered {
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.popup-inner-wrapper {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.theme-maniax {
  border-top: 2px solid rgba(236, 72, 153, 0.4);
}

.theme-girls {
  border-top: 2px solid rgba(249, 115, 22, 0.4);
}

.theme-default {
  border-top: 2px solid rgba(255, 255, 255, 0.15);
}

.popup-close-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 14px;
  z-index: 10;
  transition: all 0.2s ease;
}

.popup-close-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: scale(1.1);
}

.popup-drag-handle {
  display: none;
  width: 100%;
  height: 20px;
  justify-content: center;
  align-items: center;
  margin-top: -8px;
  margin-bottom: 8px;
  cursor: grab;
}

.drag-pill {
  width: 40px;
  height: 4px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 4px;
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
  /* Removed fixed transform-origin to allow dynamic prop or default centering */
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

@media screen and (max-width: 768px) {
  .popup-close-btn {
    display: none;
  }
  
  .popup-drag-handle {
    display: flex;
  }
  
  .rj-warp-gate-popup {
    width: 100% !important;
    max-width: 100% !important;
    left: 0 !important;
    top: auto !important;
    bottom: 0 !important;
    border-radius: 20px 20px 0 0;
    max-height: 50vh !important;
    padding: 16px 12px;
    padding-bottom: max(16px, env(safe-area-bottom));
    transition: max-height 0.3s cubic-bezier(0.25, 1, 0.5, 1), transform 0.35s cubic-bezier(0.2, 0.8, 0.2, 1);
  }
  
  .rj-warp-gate-popup.is-mobile-expanded {
    max-height: 90vh !important;
  }
  
  .rj-warp-gate-popup.is-centered {
    top: auto !important;
    left: 0 !important;
    transform: none !important;
  }
  
  /* Slide up animation for mobile */
  .fade-enter-from,
  .fade-leave-to {
    opacity: 0;
    transform: translateY(100%);
  }
  .fade-enter-active,
  .fade-leave-active {
    transition: transform 0.35s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.3s ease;
  }
}
</style>
