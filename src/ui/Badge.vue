<template>
  <span class="rj-warp-gate-capsule" :class="`theme-${theme || 'default'}`">
    {{ text }}
  </span>
</template>

<script setup lang="ts">
defineProps<{
  text: string;
  theme?: string;
}>();
</script>

<style scoped>
.rj-warp-gate-capsule {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 0.92em;
  font-weight: 500;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  white-space: nowrap;
}

.theme-genre {
  background-color: #334155; /* Slate 700 */
  color: #f8fafc; /* Slate 50 */
  border: 1px solid #64748b; /* Slate 500 */
}

.theme-cv {
  background-color: #581c87; /* Purple 900 */
  color: #e9d5ff; /* Purple 200 */
  border: 1px solid #9333ea; /* Purple 600 */
}

.theme-basic {
  background-color: #134e4a; /* Teal 900 */
  color: #ccfbf1; /* Teal 100 */
  border: 1px solid #0f766e; /* Teal 700 */
}

.theme-r18, .theme-sales {
  background-color: #7f1d1d; /* Red 900 */
  color: #fecaca; /* Red 200 */
  border: 1px solid #dc2626; /* Red 600 */
}

.theme-rating {
  background-color: #713f12; /* Yellow 900 */
  color: #fef08a; /* Yellow 200 */
  border: 1px solid #eab308; /* Yellow 500 */
}

/* DLsite Work Type Colors */
.theme-type-0 { background-color: #78350f; color: #fde68a; border: 1px solid #b45309; } /* Voice */
.theme-type-1 { background-color: #881337; color: #fecdd3; border: 1px solid #e11d48; } /* Game */
.theme-type-2 { background-color: #064e3b; color: #a7f3d0; border: 1px solid #059669; } /* Comic */
.theme-type-3 { background-color: #1e3a8a; color: #bfdbfe; border: 1px solid #2563eb; } /* CG/Illust */
.theme-type-4 { background-color: #312e81; color: #c7d2fe; border: 1px solid #4f46e5; } /* Novel */
.theme-type-5 { background-color: #164e63; color: #cffafe; border: 1px solid #0891b2; } /* Video */
.theme-type-6 { background-color: #4c1d95; color: #ddd6fe; border: 1px solid #7c3aed; } /* Music */
.theme-type-7 { background-color: #1e293b; color: #cbd5e1; border: 1px solid #475569; } /* Tool */
.theme-type-8 { background-color: #134e4a; color: #ccfbf1; border: 1px solid #0d9488; } /* Voice Comic */
.theme-type-9 { background-color: #3f3f46; color: #e4e4e7; border: 1px solid #71717a; } /* Other */

@media screen and (max-width: 768px) {
  .rj-warp-gate-capsule {
    padding: 2px 6px;
    font-size: 0.85em;
    border-radius: 4px;
    line-height: 1.2;
  }
}

.theme-default {
  background-color: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.2);
}
</style>
