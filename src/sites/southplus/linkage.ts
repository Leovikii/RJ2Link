import { getHttpAsync } from '../../utils/common';
import { DataCacheStorage } from '../../utils/cache';
import { WorkPromise } from '../../common/scraper';

export class SearchWorkInfo {
    constructor(public workno: string, public type: string, public lang: string) {}
}

const DEFAULT_LANGS = ["CHI_HANS", "CHI_HANT", "CHI"]; // Fallback languages if settings is undefined

export function mergeLinkage(l1: Record<string, any>, l2: Record<string, any>) {
            let linkage: Record<string, any> = {}
            for (const work of Object.values(l1)) {
                if (!work || !(work as any).workno) continue;
                linkage[(work as any).workno] = work;
            }
            for (const work of Object.values(l2)) {
                if (!work || !(work as any).workno) continue;
                linkage[(work as any).workno] = work;
            }
            return linkage;
        }

export function cacheLinkage(originalWorkno: string, linkage: Record<string, any>) {

            function getExpireTime() {
                const now = new Date();
                const nowMs = now.getTime();
                const utc9Ms = nowMs + now.getTimezoneOffset() * 60000 + 9 * 3600 * 1000;
                const localeOffset = utc9Ms - nowMs;
                const dayMs = 24 * 3600 * 1000;
                const nextDayUtc9 = utc9Ms - (utc9Ms % dayMs) + dayMs;
                return nextDayUtc9 - localeOffset;
            }

            let maxLinkMapSize = 128;
            let linkCache = DataCacheStorage.open(
                "work-linkages", maxLinkMapSize, true, true, true);

            let langs = (typeof (window as any).settings !== 'undefined' ? (window as any).settings._ss_cue_lang : DEFAULT_LANGS).join();
            let data = linkCache.get(originalWorkno);
            if (Array.isArray(data)) {
                data = mergeLinkage(data, linkage);
            } else {
                data = linkage;
            }
            linkCache.commit(`${originalWorkno}|${langs}`, data, getExpireTime());
        }

export function getLinkageFromCache(originalWorkno: string) {
            const langs = (typeof (window as any).settings !== 'undefined' ? (window as any).settings._ss_cue_lang : DEFAULT_LANGS).join();
            const hashKey = `${originalWorkno}|${langs}`;
            let storage = DataCacheStorage.open("work-linkages", 128, true, true, true);
            return storage.get(hashKey);
        }

export async function getLinkedWorks(rjCode) {
            try {
                let trans = await WorkPromise.getTranslationInfo(rjCode);
                let p = await WorkPromise.getWorkPromise(rjCode);
                let api = await p.api2;
                let result = {};
                if (trans.is_original) {
                    result[rjCode] = { workno: rjCode, type: "original", lang: "JPN" };
                    let languageEditions = api.language_editions;
                    if (!Array.isArray(languageEditions)) languageEditions = Object.values(languageEditions);
                    for (let edition of languageEditions) {
                        result[edition.workno] = { workno: edition.workno, type: "parent", lang: edition.lang };
                    }
                } else if (trans.is_parent) {
                    result[trans.original_workno] = { workno: trans.original_workno, type: "original", lang: "JPN" };
                    result[rjCode] = { workno: rjCode, type: "parent", lang: trans.lang };
                    for (let workno of trans.child_worknos) {
                        result[workno] = { workno: workno, type: "child", lang: trans.lang }
                    }
                } else if (trans.is_child) {
                    result[trans.original_workno] = { workno: trans.original_workno, type: "original", lang: "JPN" };
                    result[trans.parent_workno] = { workno: trans.parent_workno, type: "parent", lang: trans.lang };
                    result[rjCode] = { workno: rjCode, type: "child", lang: trans.lang };
                }

                return result;
            } catch (e) {
                console.error(e);
                return {};
            }

        }

export async function getLinkedWorksFull(rjCode, useCache = true, saveCache = true) {
            let trans = await WorkPromise.getTranslationInfo(rjCode);
            if (trans.is_original === undefined || trans.is_original === null) return {};
            if (!trans.is_original) {
                let result = await getLinkedWorksFull(trans.original_workno, useCache, saveCache);
                result = mergeLinkage(result, await getLinkedWorks(rjCode));
                return result;
            }

            let cache = getLinkageFromCache(rjCode)
            if (cache) {
                return cache;
            }

            let p = await WorkPromise.getWorkPromise(rjCode);
            let api = await p.api2;
            let result = {};

            result[rjCode] = { workno: rjCode, type: "original", lang: "JPN" };
            let languageEditions = api.language_editions;
            if (!Array.isArray(languageEditions)) languageEditions = Object.values(languageEditions);
            for (let edition of languageEditions) {
                const cueLang = typeof (window as any).settings !== 'undefined' ? (window as any).settings._ss_cue_lang : DEFAULT_LANGS;
                if (!cueLang.includes(edition.lang)) continue;
                result = mergeLinkage(result, await getLinkedWorks(edition.workno));
            }

            if (saveCache) cacheLinkage(rjCode, result);
            return result;
        }

export async function getKikoeruSearchResult(rjCode, searchProfile, linkages) {
            let url = searchProfile.searchUrlTemplate?.replaceAll("%s", rjCode);

            try {
                let resp = await getHttpAsync(url, false, 180, searchProfile.customHeaders);
                if (!(resp.readyState === 4 && resp.status === 200)) {
                    return;
                }

                let data = JSON.parse(resp.responseText);
                if (!Array.isArray(data.works)) {
                    throw new Error("Invalid Response.");
                } else if (data.works.length <= 0) {
                    return [];
                }

                let result = [];
                for (const work of data.works) {
                    let rj = work.id > 999999 ? `RJ0${work.id}` : `RJ${work.id}`;
                    let link = linkages[rj];
                    if (!link) continue;

                    result.push(new SearchWorkInfo(link.workno, link.type, link.lang));
                }

                return result;
            } catch (e) {
                console.error(e);
                return null;
            }

        }

