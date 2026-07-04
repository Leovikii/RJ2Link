import { ref } from 'vue';
import { searchSouthPlus, cleanupCache, SouthPlusSearchResult } from '../southplus/search';
import { WorkPromise } from '../../common/scraper';

export const isSpLoading = ref(true);
export const isAsmrLoading = ref(true);
export const spErrorMsg = ref('');
export const asmrErrorMsg = ref('');
export const asmrOneUrl = ref<string | null>(null);
export const results = ref<SouthPlusSearchResult[]>([]);
export const spState = ref<'empty' | 'results' | 'error' | 'loading'>('loading');
export const asmrState = ref<'empty' | 'results' | 'error' | 'loading'>('loading');

export async function fetchDLsiteData(rjCode: string, force = false) {
  if (force) {
    cleanupCache();
  }
  
  isSpLoading.value = true;
  isAsmrLoading.value = true;
  spState.value = 'loading';
  asmrState.value = 'loading';
  spErrorMsg.value = '';
  asmrErrorMsg.value = '';
  results.value = [];
  asmrOneUrl.value = null;

  // Run searches in parallel without blocking each other
  const spPromise = searchSouthPlus(rjCode).then(searchRes => {
    results.value = searchRes.results || [];
    if (!searchRes.success && searchRes.errorMsg) {
      spState.value = 'error';
      spErrorMsg.value = searchRes.errorMsg;
    } else {
      spState.value = results.value.length > 0 ? 'results' : 'empty';
    }
  }).catch(err => {
    spState.value = 'error';
    spErrorMsg.value = err?.message || String(err);
    console.error('[RJ Warp Gate] SouthPlus Fetch failed:', err);
  }).finally(() => {
    isSpLoading.value = false;
  });

  const asmrPromise = WorkPromise.checkAsmrOne(rjCode).then(asmrUrl => {
    asmrOneUrl.value = asmrUrl || null;
    asmrState.value = asmrUrl ? 'results' : 'empty';
  }).catch(err => {
    asmrState.value = 'error';
    asmrErrorMsg.value = err?.message || String(err);
    console.error('[RJ Warp Gate] ASMRone Fetch failed:', err);
  }).finally(() => {
    isAsmrLoading.value = false;
  });

  await Promise.allSettled([spPromise, asmrPromise]);
}
