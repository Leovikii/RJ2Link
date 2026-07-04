import { ref } from 'vue';
import { searchSouthPlus, cleanupCache, SouthPlusSearchResult } from '../southplus/search';
import { WorkPromise } from '../../common/scraper';

export const isLoading = ref(true);
export const isError = ref(false);
export const errorMessage = ref('');
export const asmrOneUrl = ref<string | null>(null);
export const results = ref<SouthPlusSearchResult[]>([]);
export const spState = ref<'empty' | 'results' | 'error' | 'loading'>('loading');

export async function fetchDLsiteData(rjCode: string, force = false) {
  if (force) {
    cleanupCache(); // cleanupCache doesn't take args
  }
  
  isLoading.value = true;
  isError.value = false;
  spState.value = 'loading';
  errorMessage.value = '';

  try {
    const searchRes = await searchSouthPlus(rjCode);
    results.value = searchRes.results || [];
    spState.value = results.value.length > 0 ? 'results' : 'empty';

    // WorkPromise is an object, checkAsmrOne is the method
    const asmrUrl = await WorkPromise.checkAsmrOne(rjCode);
    asmrOneUrl.value = asmrUrl || null;
  } catch (err: any) {
    isError.value = true;
    spState.value = 'error';
    errorMessage.value = err?.message || String(err);
    console.error('[RJ Warp Gate] Fetch failed:', err);
  } finally {
    isLoading.value = false;
  }
}
