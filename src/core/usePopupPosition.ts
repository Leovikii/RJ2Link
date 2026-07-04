import { computed, Ref } from 'vue';

export function usePopupPosition(
  x: Ref<number>,
  y: Ref<number>,
  estimatedWidth: number = 650,
  estimatedMaxHeight: number = 550
) {
  return computed(() => {
    let left: number | string = x.value + 15;
    let top: number | string = y.value + 15;
    let bottom: number | string = 'auto';
    let right: number | string = 'auto';
    
    // Keep within bounds
    if (typeof window !== 'undefined') {
      if (left + estimatedWidth > window.innerWidth) {
        left = 'auto';
        right = window.innerWidth - x.value + 15;
        // If screen is extremely narrow, fallback to left: 10
        if (window.innerWidth - (right as number) < estimatedWidth) {
           left = 10;
           right = 'auto';
        }
      }
      
      // Vertical flip: if it might hit bottom, set bottom edge relative to cursor
      if (top + estimatedMaxHeight > window.innerHeight) {
        top = 'auto';
        bottom = window.innerHeight - y.value + 15;
      }
    }
    
    return {
      left: left === 'auto' ? 'auto' : `${left}px`,
      right: right === 'auto' ? 'auto' : `${right}px`,
      top: top === 'auto' ? 'auto' : `${top}px`,
      bottom: bottom === 'auto' ? 'auto' : `${bottom}px`
    };
  });
}
