<template>
  <PopupPanel
    :display="state.display"
    :theme="isGirls ? 'girls' : 'maniax'"
    :positionStyle="positionStyle"
    transformOrigin="top left"
    @close="closePopup"
  >
    <div v-if="loading" class="popup-skeleton">
        <div class="skeleton-header">
          <div class="skeleton-eyebrow shimmer"></div>
          <div class="skeleton-title shimmer"></div>
          <div class="skeleton-title short shimmer"></div>
        </div>
        <div class="skeleton-panels">
          <div class="skeleton-left">
            <div class="skeleton-cover shimmer"></div>
            <div class="skeleton-buttons-container">
              <div class="skeleton-btn shimmer"></div>
              <div class="skeleton-btn shimmer"></div>
            </div>
          </div>
          <div class="skeleton-right">
            <div class="skeleton-row">
              <div class="skeleton-label shimmer"></div>
              <div class="skeleton-text shimmer"></div>
            </div>
            <div class="skeleton-row">
              <div class="skeleton-label shimmer"></div>
              <div class="skeleton-tags">
                <div class="skeleton-tag shimmer" style="width: 80px;"></div>
                <div class="skeleton-tag shimmer" style="width: 120px;"></div>
                <div class="skeleton-tag shimmer" style="width: 90px;"></div>
                <div class="skeleton-tag shimmer" style="width: 70px;"></div>
              </div>
            </div>
            <div class="skeleton-row">
              <div class="skeleton-label shimmer"></div>
              <div class="skeleton-tags">
                <div class="skeleton-tag shimmer" style="width: 100px;"></div>
                <div class="skeleton-tag shimmer" style="width: 85px;"></div>
              </div>
            </div>
            <div class="skeleton-row">
              <div class="skeleton-label shimmer"></div>
              <div class="skeleton-tags">
                <div class="skeleton-tag shimmer" style="width: 75px;"></div>
                <div class="skeleton-tag shimmer" style="width: 110px;"></div>
                <div class="skeleton-tag shimmer" style="width: 60px;"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-else-if="!workFound" class="popup-not-found">
        <div class="error-icon">?</div>
        <div>Work Not Found</div>
        <div class="error-sub">{{ state.rjCode }}</div>
      </div>

      <div v-else class="popup-content">
        <div class="popup-header">
          <div class="header-main">
            <div class="rj-eyebrow" :title="copyHint" @click.stop="onCopyRjCode">{{ state.rjCode.toUpperCase() }}</div>
            <div class="work-title" :title="titleHint" @click="onCopyTitle">
              {{ title || 'Loading...' }}
            </div>
          </div>
        </div>

        <div class="panel-container">
          <!-- Left Panel: Cover Image and DLsite Link -->
          <div class="panel-left">
            <div class="dlsite-cover-container">
              <Cover :src="imgLink" :alt="title" />
            </div>
            <div class="buttons-container">
              <ActionButton 
                :href="'https://www.dlsite.com/maniax/work/=/product_id/' + state.rjCode.toUpperCase() + '.html'"
                theme="dlsite"
              />
              
              <ActionButton 
                :href="asmrOneUrl"
                :disabled="!asmrOneUrl"
                theme="asmrone"
              />
            </div>
          </div>

          <!-- Right Panel: Information -->
          <div class="panel-right">
            <div class="tags-section" v-if="circle">
              <div class="section-title">社团</div>
              <div class="tags-flow circle-name-text">
                {{ circle }}
              </div>
            </div>

            <div class="tags-section" v-if="sales || ratingAvg > 0 || releaseDate || ageRating || workType || fileSize">
              <div class="section-title">基础信息</div>
              <div class="tags-flow">
                <Badge v-if="sales" theme="sales" :text="`售出: ${sales}`" />
                <Badge v-if="ratingAvg > 0" theme="rating" :text="`评价: ${ratingAvg.toFixed(2)}★ (${ratingCount})`" />
                <Badge v-if="releaseDate" theme="basic" :text="releaseDate" />
                <Badge v-if="ageRating" :theme="ageRating.includes('18') ? 'r18' : 'basic'" :text="ageRating" />
                <Badge v-if="workType" :theme="workTypeId >= 0 ? `type-${workTypeId}` : 'basic'" :text="workType" />
                <Badge v-if="fileSize" theme="basic" :text="fileSize" />
              </div>
            </div>

            <div class="tags-section" v-if="cv.length">
              <div class="section-title">声优</div>
              <div class="tags-flow">
                <Badge v-for="actor in cv" :key="actor" theme="cv" :text="actor" />
              </div>
            </div>

            <div class="tags-section" v-if="genreTags.length">
              <div class="section-title">分类</div>
              <div class="tags-flow">
                <Badge v-for="tag in genreTags" :key="tag" theme="genre" :text="tag" />
              </div>
            </div>
          </div>
        </div>
      </div>
  </PopupPanel>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue';
import type { PopupState } from '../../types';
import { WorkPromise } from '../../common/scraper';
import { localizePopup, localizationMap } from '../../config/localization';
import { VOICELINK_CLASS } from '../../config/constants';

import Cover from '../../ui/Cover.vue';
import ActionButton from '../../ui/ActionButton.vue';
import Badge from '../../ui/Badge.vue';
import PopupPanel from '../../ui/PopupPanel.vue';

const props = defineProps<{
  state: PopupState;
}>();

// State variables
const workFound = ref(true);
const loading = ref(true);
const title = ref('');
const imgLink = ref('');
const sales = ref<string>('');
const ratingAvg = ref<number>(0);
const ratingCount = ref<number>(0);
const circle = ref<string>('');
const releaseDate = ref<string>('');
const cv = ref<string[]>([]);
const ageRating = ref<string>('');
const workType = ref<string>('');
const workTypeId = ref<number>(-1);
const fileSize = ref<string>('');
const genreTags = ref<string[]>([]);
const isGirls = ref(false);
const asmrOneUrl = ref<string | null>(null);

const titleHint = computed(() => localizePopup(localizationMap.click_to_copy_title));
const copyHint = computed(() => localizePopup(localizationMap.click_to_copy));

// Calculate position based on mouse click coordinates
const positionStyle = computed(() => {
  // Use fixed positioning relative to viewport
  // Fallback widths
  const width = 650;
  const height = 400; // estimated
  
  let left: number | string = props.state.x + 15;
  let top: number | string = props.state.y + 15;
  let bottom: number | string = 'auto';
  
  // Keep within bounds
  if (typeof window !== 'undefined') {
    if (left + width > window.innerWidth) {
      left = props.state.x - width - 15;
      if (left < 0) left = 10;
    }
    
    // Vertical flip: if it might hit bottom, set bottom edge relative to cursor
    const estimatedMaxHeight = 550; // Increased to account for many tags
    if (top + estimatedMaxHeight > window.innerHeight) {
      top = 'auto';
      bottom = window.innerHeight - props.state.y + 15;
    }
  }
  
  return {
    left: `${left}px`,
    top: top === 'auto' ? 'auto' : `${top}px`,
    bottom: bottom === 'auto' ? 'auto' : `${bottom}px`
  };
});

const closePopup = () => {
  props.state.display = false;
  props.state.pinned = false;
};

const onCopyTitle = (e: MouseEvent) => {
  if (title.value && typeof GM_setClipboard !== 'undefined') {
    GM_setClipboard(title.value, 'text');
    const target = e.target as HTMLElement;
    const oldColor = target.style.color;
    target.style.color = '#4ade80';
    setTimeout(() => {
      target.style.color = oldColor;
    }, 500);
  }
};

const onCopyRjCode = (e: MouseEvent) => {
  if (props.state.rjCode && typeof GM_setClipboard !== 'undefined') {
    GM_setClipboard(props.state.rjCode.toUpperCase(), 'text');
    const target = e.target as HTMLElement;
    const oldColor = target.style.color;
    target.style.color = '#4ade80';
    setTimeout(() => {
      target.style.color = oldColor;
    }, 500);
  }
};

const updatePopupData = async () => {
  if (!props.state.display || !props.state.rjCode) return;
  const rjCode = props.state.rjCode;
  
  loading.value = true;
  workFound.value = false;
  title.value = '';
  imgLink.value = '';
  sales.value = '';
  ratingAvg.value = 0;
  ratingCount.value = 0;
  circle.value = '';
  releaseDate.value = '';
  cv.value = [];
  ageRating.value = '';
  workType.value = '';
  workTypeId.value = -1;
  fileSize.value = '';
  genreTags.value = [];

  try {
    let found = await WorkPromise.getFound(rjCode);
    workFound.value = found;
    if (!found) {
      loading.value = false;
      return;
    }
  } catch (e) {
    console.error(e);
  }

  // Fetch parallel data
  Promise.allSettled([
    WorkPromise.getWorkTitle(rjCode).then(t => { if (rjCode === props.state.rjCode) title.value = t; }),
    WorkPromise.getImgLink(rjCode).then(link => {
      if (rjCode === props.state.rjCode && typeof link === 'string') imgLink.value = link;
    }),
    WorkPromise.getGirls(rjCode).then(g => { if (rjCode === props.state.rjCode) isGirls.value = !!g; }),
    WorkPromise.checkAsmrOne(rjCode).then(url => { if (rjCode === props.state.rjCode) asmrOneUrl.value = url; }),
    
    // Properties
    WorkPromise.getWorkType(rjCode).then(v => { if (rjCode === props.state.rjCode) workTypeId.value = v; }),
    WorkPromise.getWorkTypeText(rjCode).then(v => { if (rjCode === props.state.rjCode) workType.value = v; }),
    WorkPromise.getRateAvg(rjCode).then(v => { if (rjCode === props.state.rjCode) ratingAvg.value = v; }),
    WorkPromise.getRateCount(rjCode).then(v => { if (rjCode === props.state.rjCode) ratingCount.value = v; }),
    WorkPromise.getDLCount(rjCode).then(v => { if (rjCode === props.state.rjCode && v) sales.value = String(v); }),
    WorkPromise.getCircle(rjCode).then(v => { if (rjCode === props.state.rjCode && v) circle.value = v; }),
    WorkPromise.getReleaseDate(rjCode).then(v => { if (rjCode === props.state.rjCode && v && v[0]) releaseDate.value = v[0]; }),
    WorkPromise.getCV(rjCode).then(v => { if (rjCode === props.state.rjCode && v) cv.value = v; }),
    WorkPromise.getAgeRating(rjCode).then(v => { if (rjCode === props.state.rjCode && v) ageRating.value = v; }),
    WorkPromise.getFileSize(rjCode).then(v => { if (rjCode === props.state.rjCode && v) fileSize.value = v; }),
    WorkPromise.getTags(rjCode).then(v => { if (rjCode === props.state.rjCode && v) genreTags.value = v; }),
  ]).finally(() => {
    if (rjCode === props.state.rjCode) loading.value = false;
  });
};

watch(() => props.state.rjCode, (newVal) => {
  if (newVal) updatePopupData();
});

watch(() => props.state.display, (newVal) => {
  if (newVal) {
    updatePopupData();
  }
});
</script>

<style scoped>
.popup-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 12px;
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding-right: 24px;
}

.header-main {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.rj-eyebrow {
  align-self: flex-start;
  background-color: rgba(236, 72, 153, 0.15);
  color: rgb(244, 114, 182);
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 0.95em;
  font-weight: 700;
  border: 1px solid rgba(236, 72, 153, 0.3);
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
}

.rj-eyebrow:hover {
  background-color: rgba(236, 72, 153, 0.25);
  transform: scale(0.96);
  box-shadow: 0 1px 2px rgba(0,0,0,0.1);
}

.work-title {
  font-size: 1.4em;
  font-weight: 700;
  line-height: 1.3;
  cursor: pointer;
  transition: color 0.2s;
  padding-right: 20px; /* Space for close btn */
  flex: 1;
}

.panel-container {
  display: flex;
  flex-direction: row;
  flex: 1;
  gap: 20px;
  min-height: 0; /* Important for scrollable children */
}

.panel-left {
  flex: 0 0 240px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.buttons-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 86px; /* Space for 2 buttons to prevent reflow */
}

.dlsite-cover-container {
  display: block;
  margin-bottom: 12px;
}

.panel-right {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  padding-right: 8px;
}

/* Custom scrollbar */
.panel-right::-webkit-scrollbar {
  width: 6px;
}
.panel-right::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
}
.panel-right::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
}

.work-title:hover {
  color: #93c5fd; /* Blue 300 */
}

.circle-name-text {
  font-size: 1.05em;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.95);
  line-height: 1.5;
  margin-top: 1px;
}

.tags-section {
  display: flex;
  margin-bottom: 12px;
}

.section-title {
  width: 65px;
  flex-shrink: 0;
  font-size: 0.9em;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 0;
  margin-top: 4px; /* Align with the first row of capsules */
  font-weight: 600;
  letter-spacing: 1px;
}

.tags-flow {
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 6px; /* slightly tighter to compress height */
}

/* Skeleton Loader */
.popup-skeleton {
  display: flex;
  flex-direction: column;
  padding: 4px;
}

.skeleton-header {
  margin-bottom: 16px;
}

.skeleton-eyebrow {
  width: 80px;
  height: 22px;
  border-radius: 4px;
  margin-bottom: 12px;
  background: rgba(255, 255, 255, 0.1);
}

.skeleton-title {
  width: 90%;
  height: 21px;
  border-radius: 6px;
  margin-bottom: 8px;
  background: rgba(255, 255, 255, 0.1);
}

.skeleton-title.short {
  width: 60%;
}

.skeleton-panels {
  display: flex;
  flex: 1;
  gap: 20px;
}

.skeleton-left {
  flex: 0 0 240px;
  width: 240px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.skeleton-cover {
  width: 100%;
  aspect-ratio: 1;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
}

.skeleton-buttons-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.skeleton-btn {
  width: 100%;
  height: 38px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.15);
}

.skeleton-right {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.skeleton-row {
  display: flex;
}

.skeleton-label {
  width: 65px;
  height: 20px;
  border-radius: 4px;
  margin-top: 4px;
  margin-right: 0;
  background: rgba(255, 255, 255, 0.08);
  flex-shrink: 0;
}

.skeleton-text {
  width: 150px;
  height: 20px;
  border-radius: 4px;
  margin-top: 5px;
  background: rgba(255, 255, 255, 0.08);
}

.skeleton-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  flex: 1;
}

.skeleton-tag {
  height: 24px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.1);
}

.shimmer {
  position: relative;
  overflow: hidden;
}

.shimmer::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 200%;
  height: 100%;
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0) 0%,
    rgba(255, 255, 255, 0.05) 20%,
    rgba(255, 255, 255, 0.25) 50%,
    rgba(255, 255, 255, 0.05) 80%,
    rgba(255, 255, 255, 0) 100%
  );
  animation: sweep 1.5s infinite linear;
}

@keyframes sweep {
  0% { transform: translateX(-50%); }
  100% { transform: translateX(50%); }
}

/* Not Found */
.popup-not-found {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: rgba(255, 255, 255, 0.6);
}

.error-icon {
  font-size: 48px;
  font-weight: bold;
  margin-bottom: 16px;
  color: rgba(255, 255, 255, 0.2);
}

.error-sub {
  font-family: monospace;
  margin-top: 8px;
  padding: 4px 8px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
}

@media screen and (max-width: 768px) {
  .popup-header {
    padding-right: 0;
  }
  .work-title {
    font-size: 1.1em;
    padding-right: 0;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    overflow: hidden;
  }
  .header-main {
    gap: 4px;
  }
  .panel-container, .skeleton-panels {
    flex-direction: column;
    overflow-y: auto;
    gap: 12px;
  }
  .panel-left, .skeleton-left {
    flex: 0 0 auto;
    width: 100%;
    flex-direction: row;
    align-items: center;
    gap: 12px;
    margin-bottom: 4px;
  }
  .dlsite-cover-container, .skeleton-cover {
    /* Prioritize cover size */
    width: 38%;
    min-width: 110px;
    max-width: 160px;
    flex-shrink: 0;
    margin-bottom: 0;
  }
  .skeleton-cover {
    aspect-ratio: 4/3;
  }
  .buttons-container, .skeleton-buttons-container {
    /* flex: 1 ensures it dynamically takes up the remaining horizontal space after the cover */
    flex: 1;
    min-height: auto;
    gap: 8px;
    /* Stretch buttons to fill this dynamic container completely */
    align-items: stretch;
  }
  /* Wrapper for skeleton buttons on mobile so they stack vertically inside the remaining space */
  .skeleton-left .skeleton-btn {
    height: 32px;
  }
  .tags-section {
    margin-bottom: 4px;
    align-items: center; /* keep title aligned with compressed tags */
  }
  .section-title {
    font-size: 0.85em;
    margin-top: 2px;
    width: 55px;
  }
  .tags-flow {
    gap: 3px;
  }
  
  .skeleton-right {
    gap: 4px;
  }
  .skeleton-label {
    width: 55px;
    margin-top: 2px;
  }
  .skeleton-tags {
    gap: 3px;
  }
}
</style>
