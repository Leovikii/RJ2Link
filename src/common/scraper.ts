import { work_promise } from '../utils/common';
import { DateParser } from '../utils/date';
import * as DLsite from './api';
import * as Linkage from '../sites/southplus/linkage';
import { LANG_MAP } from '../config/constants';
import { localizePopup, localizationMap } from '../config/localization';

export const WorkPromise = {
    checkNotNull: function (obj) {
            if (obj === null || obj === undefined) throw new Error();
            return obj;
        },

    getWorkPromise: function (rjCode) {
            if (work_promise[rjCode]) {
                return work_promise[rjCode];
            }
            work_promise[rjCode] = DLsite.getWorkRequestPromise(rjCode);
            return work_promise[rjCode];
        },

    getFound: async function (rjCode) {
            try {
                const data = await WorkPromise.getWorkPromise(rjCode).api2;
                if (data && data.product_id !== undefined) return true;

                const api = await WorkPromise.getWorkPromise(rjCode).api;
                return api && api.is_sale !== undefined;
            } catch (e) {
                delete work_promise[rjCode];
                return true;
            }
        },

    getTranslationInfo: async function (rjCode) {
            const p = WorkPromise.getWorkPromise(rjCode);
            let data = await p.api2;
            if (data.translation_info) return data.translation_info;

            data = await p.api;
            return data.translation_info ? data.translation_info : {};
        },

    getParentRJ: async function (rjCode) {
            try {
                const p = WorkPromise.getWorkPromise(rjCode);
                let trans = await WorkPromise.getTranslationInfo(rjCode);
                if (trans.is_original || trans.is_parent) return rjCode;
                if (trans.parent_workno) return trans.parent_workno;

                let data = await p.info;
                return data.parentWork;
            } catch (e) {
                return null;
            }
        },

    getGirls: async function (rjCode) {
            const p = WorkPromise.getWorkPromise(rjCode);
            let data = await p.api2;
            if (data.sex_category && data.sex_category === 2) return true;
            if (data.site_id === "girls") return true;

            data = await WorkPromise.getWorkPromise(rjCode).api;
            WorkPromise.checkNotNull(data.is_girls)
            return data.is_girls;
        },

    getAnnounce: async function (rjCode) {
            const p = WorkPromise.getWorkPromise(rjCode);
            const info = await p.info;
            return info.is_announce;
        },

    getSale: async function (rjCode, checkAnnounce = true) {
            const p = WorkPromise.getWorkPromise(rjCode);
            let data = await p.api;
            if (!checkAnnounce) {
                return data.is_sale;
            }
            return data.is_sale || await WorkPromise.getAnnounce(rjCode);
        },

    getDLCount: async function (rjCode) {
            const p = WorkPromise.getWorkPromise(rjCode);
            let data = await p.api;
            WorkPromise.checkNotNull(data.dl_count);
            return data.dl_count;
        },

    getRateAvg: async function (rjCode) {
            const p = WorkPromise.getWorkPromise(rjCode);
            let data = await p.api;
            if (data.rate_average_2dp) return data.rate_average_2dp;

            data = await p.api2;
            this.checkNotNull(data.rate_count_detail);
            let sum = 0;
            let count = 0;
            for (const key in data.rate_count_detail) {
                let rate = parseInt(key);
                let cot = parseInt(data.rate_count_detail[key]);
                count += cot
                sum += rate * cot;
            }
            return sum / count;
        },

    getRateCount: async function (rjCode) {
            const p = WorkPromise.getWorkPromise(rjCode);
            let data = await p.api;
            if (data.rate_count) return data.rate_count;

            data = await p.api2;
            this.checkNotNull(data.rate_count_detail);
            let count = 0;
            for (const key in data.rate_count_detail) {
                count += parseInt(data.rate_count_detail[key]);
            }
            return count;
        },

    getWishlistCount: async function (rjCode) {
            const p = WorkPromise.getWorkPromise(rjCode);
            let data = await p.api;
            this.checkNotNull(data.wishlist_count);
            return data.wishlist_count;
        },

    getPriceText: async function (rjCode) {
            const p = WorkPromise.getWorkPromise(rjCode);
        },

    getBonus: async function (rjCode) {
            const p = WorkPromise.getWorkPromise(rjCode);
            let data = await p.api;
            return !data.is_sale && data.is_free && data.is_oly && data.wishlist_count === 0;
            // return data.is_bonus;
        },

    getHasBonus: async function (rjCode) {
            const p = WorkPromise.getWorkPromise(rjCode);
            let data = await p.api;
            return data.bonuses && data.bonuses.length > 0;
        },

    getTranslatable: async function (rjCode) {
            const trans = await WorkPromise.getTranslationInfo(rjCode);
            return trans.is_translation_agree === true;
        },

    getTranslated: async function (rjCode) {
            const trans = await WorkPromise.getTranslationInfo(rjCode);
            return trans.is_parent === true || trans.is_child === true;
        },

    getLanguages: async function (rjCode) {
            const p = WorkPromise.getWorkPromise(rjCode);
            let api = await p.api2;
            api = api.options ? api : await p.api;
            const options = api.options?.split("#");
            const result = [];
            for (const key in LANG_MAP) {
                const lang = LANG_MAP[key];
                if (options?.includes(key)) result.push(lang);
            }
            return result;
        },

    getFileFormats: async function (rjCode) {
            const result = [];
            const p = WorkPromise.getWorkPromise(rjCode);
            let api = await p.api2;
            if (api.file_type === "EXE") {
                result.push("EXE");
            } else if (api.file_type_string) {
                result.push(api.file_type_string);
            }
            if (api.file_type_special) result.push(api.file_type_special);

            if (!api.options) api = await p.api;
            if (api.options && api.options.includes("WPD")) {
                result.push("PDF");
            }
            if (api.options && api.options.includes("WAP")) {
                result.push("APK");
            }

            return result;
        },

    getAIUsedText: async function (rjCode) {
            const p = WorkPromise.getWorkPromise(rjCode);
            let api = await p.api2;
            api = api.options ? api : await p.api;
            const options = api.options ? api.options : "";
            if (options.includes("AIG")) {
                return localizePopup(localizationMap.tag_aig);
            } else if (options.includes("AIP")) {
                return localizePopup(localizationMap.tag_aip);
            }
            return null;
        },

    getDebug: async function (rjCode) {
            return "";
            const work = WorkPromise.getWorkPromise(rjCode);
            const api2 = await work.api2;
            const api = await work.api;
            const info = await work.info;
            const circle = work.circle;

            return `is_ana_api2: ${api2.is_ana}<br/>
                    is_ana_api: ${api.is_ana}`;
        },

    getWorkCategory: async function (rjCode) {
            const type = await WorkPromise.getWorkType(rjCode);
            switch (type) {
                case 0:
                    return "voice";
                case 1:
                    return "game";
                case 2:
                case 3:
                case 8:
                    return "manga";
                case 5:
                    return "video";
                case 4:
                    return "novel";
                default:
                    return "other";
            }
        },

    getWorkTypeText: async function (rjCode) {
            const mapping = [
                localizePopup(localizationMap.work_type_voice),
                localizePopup(localizationMap.work_type_game),
                localizePopup(localizationMap.work_type_comic),
                localizePopup(localizationMap.work_type_illustration),
                localizePopup(localizationMap.work_type_novel),
                localizePopup(localizationMap.work_type_video),
                localizePopup(localizationMap.work_type_music),
                localizePopup(localizationMap.work_type_tool),
                localizePopup(localizationMap.work_type_voice_comic),
                localizePopup(localizationMap.work_type_other),
            ];
            return mapping[await WorkPromise.getWorkType(rjCode)];
        },

    getWorkType: async function (rjCode) {
            const p = WorkPromise.getWorkPromise(rjCode);
            const api2 = await p.api2;
            let workType = api2.work_type;
            if (!workType) workType = (await p.api).work_type;

            switch (workType) {
                case "SOU":
                    return 0;
                case (["ACN", "QIZ", "ADV", "RPG", "TBL", "DNV", "SLN", "TYP", "STG", "PZL", "ETC"]
                    .includes(workType) ? workType : "ERR"):
                    return 1;
                case (["MNG", "SCM", "WBT"]
                    .includes(workType) ? workType : "ERR"):
                    return 2;
                case "ICG":
                    return 3;
                case (["NRE", "KSV"].includes(workType) ? workType : "ERR"):
                    return 4;
                case "MOV":
                    return 5;
                case "MUS":
                    return 6;
                case (["TOL", "IMT", "AMT"]
                    .includes(workType) ? workType : "ERR"):
                    return 7;
                case "VCM":
                    return 8;
                case "ET3":
                    return 9;
                default:
                    throw new Error("无法获取作品类型/未知作品类型：" + workType);
            }
        },

    getImgLink: async function (rjCode) {
            let link = undefined;
            const p = WorkPromise.getWorkPromise(rjCode);

            try {
                let data = await p.api2;
                if (data.image_main && data.image_main.url) link = "https:" + data.image_main.url;
            } catch (e) { }

            if (link && !link.includes("no_img_main.gif")) {
                return link;
            }

            try {
                const info = await p.info;
                WorkPromise.checkNotNull(info.img);
                return info.img;
            } catch (e) {
            }

            try {
                const apiData = await WorkPromise.getWorkPromise(rjCode).api;
                if (apiData.work_image) return "https:" + apiData.work_image;
            } catch (e) { }

            throw new Error("无法获取图片链接");
        },

    getWorkTitle: async function (rjCode) {
            return await WorkPromise.getWorkPromise(rjCode).translated_title;
        },

    getAgeRating: async function (rjCode) {
            let p = WorkPromise.getWorkPromise(rjCode);
            let api = await p.api2;
            if (!api.age_category) api = await p.api;
            switch (api.age_category) {
                case 1:
                    return "All";
                case 2:
                    return "R15";
                case 3:
                    return "R18";
            }

            const info = await p.info;
            WorkPromise.checkNotNull(info.rating);
            return info.rating;
        },

    getCircle: async function (rjCode, findOriginal = true) {
            let trans = await WorkPromise.getTranslationInfo(rjCode);
            if (!trans.is_original && findOriginal) {
                rjCode = trans.original_workno ? trans.original_workno : rjCode;
            }

            let work = WorkPromise.getWorkPromise(rjCode);
            let api2 = await work.api2;
            if (api2.maker_name) return api2.maker_name;

            /**
             * 接下来有两种搜索方式：
             * 1. api1 + circle接口
             * 2. info搜索
             * 前者成功率更高（下架后还能获取到api1，社团没解散就能获得社团信息），两个加载速度不确定谁快谁慢，所以把1放在前面
             */

            const circleInfo = await work.circle;
            if (circleInfo && circleInfo.name) return circleInfo.name;

            let info = await work.info;
            if (info.circle) return info.circle.trim();

            throw new Error("无法获取社团信息");
        },

    getTranslatorName: async function (rjCode) {
            let trans = await WorkPromise.getTranslationInfo(rjCode);
            if (!trans.is_child) throw new Error("非翻译作品RJ号");
            return await WorkPromise.getCircle(rjCode, false);
        },

    getReleaseDate: async function (rjCode) {
            const p = WorkPromise.getWorkPromise(rjCode);
            const info = await p.info;
            if (info && !info.is_announce && info.date) return [info.date.trim(), false];
            if (info && info.is_announce && info.dateAnnounce) return [info.dateAnnounce.trim(), true];

            let api = await p.api2;
            api = api.regist_date ? api : await p.api;
            WorkPromise.checkNotNull(api.regist_date)

            return [api.regist_date, api.is_announce];
        },

    getReleaseCountDownElement: async function (rjCode) {
            const p = WorkPromise.getWorkPromise(rjCode);
            const info = await p.info;
            if (info && info.is_announce && info.dateAnnounce) {
                return DateParser.getCountDownDateElement(DateParser.parseDateStr(info.dateAnnounce, info.lang));
            }
            return null;
        },

    getUpdateDate: async function (rjCode) {
            const p = WorkPromise.getWorkPromise(rjCode);
            const info = await p.info;
            if (info["update"]) return info["update"].trim();

            throw new Error();
        },

    getCV: async function (rjCode) {
            const p = WorkPromise.getWorkPromise(rjCode);
            const api2 = await p.api2;
            if (api2.creaters && api2.creaters.voice_by && api2.creaters.voice_by.length > 0) {
                return api2.creaters.voice_by.map(v => v.name);
            }

            const info = await WorkPromise.getWorkPromise(rjCode).info;
            WorkPromise.checkNotNull(info.cv);
            return info.cv;
        },

    getMusic: async function (rjCode) {
            const p = WorkPromise.getWorkPromise(rjCode);
            const api2 = await p.api2;
            if (api2.creaters && api2.creaters.music_by && api2.creaters.music_by.length > 0) {
                return api2.creaters.music_by.map(v => v.name);
            }

            const info = await WorkPromise.getWorkPromise(rjCode).info;
            WorkPromise.checkNotNull(info.music);
            return info.music;
        },

    getTags: async function (rjCode) {
            const p = WorkPromise.getWorkPromise(rjCode);
            const api2 = await p.api2;
            if (api2.genres && api2.genres.length > 0) {
                return api2.genres.map(genre => genre.name);
            }

            const info = await p.info;
            WorkPromise.checkNotNull(info.tags);
            return info.tags;
        },

    getFileSizeStr: function (byteCount = 0) {
            const units = ["B", "KB", "MB", "GB", "TB"];
            let unit = "B";
            for (let i = 1; byteCount >= 1024; i++) {
                byteCount /= 1024;
                unit = units[i];
            }
            return `${Math.round(byteCount * 100) / 100}${unit}`;
        },

    getFileSize: async function (rjCode) {
            const trans = await WorkPromise.getTranslationInfo(rjCode);
            if (trans.is_parent) {
                rjCode = trans.original_workno ? trans.original_workno : rjCode;
            }

            const p = WorkPromise.getWorkPromise(rjCode);
            let api2 = await p.api2;
            if (api2.contents_file_size && api2.contents_file_size > 0) {
                return WorkPromise.getFileSizeStr(api2.contents_file_size);
            }

            let info = trans.is_child && trans.original_workno ? await WorkPromise.getWorkPromise(trans.original_workno).info : await p.info;
            if (info.filesize) return info.filesize;

            throw new Error("无法获取文件大小信息");
        },

    checkAsmrOne: async function (rjCode: string, force = false): Promise<string | null> {
            const p: any = WorkPromise.getWorkPromise(rjCode);
            if (!force && p._asmrone !== undefined) return p._asmrone;

            p._asmrone = new Promise(async (resolve) => {
                const cacheKey = `asmr_cache_${rjCode.toUpperCase()}`;
                if (!force && typeof GM_getValue !== "undefined") {
                    const cached: any = await GM_getValue(cacheKey);
                    if (cached && Date.now() - cached.time < 24 * 3600 * 1000) {
                        return resolve(cached.data);
                    }
                }

                const rjNumber = rjCode.toUpperCase().replace('RJ', '');
                const apiUrl = `https://api.asmr-200.com/api/work/${rjNumber}`;
                
                // Using Tampermonkey's GM_xmlhttpRequest to avoid CORS issues
                GM_xmlhttpRequest({
                    method: 'GET',
                    url: apiUrl,
                    headers: { "Referer": "https://www.asmr.one/" },
                    onload: async function(response) {
                        if (response.status === 200) {
                            const url = `https://www.asmr.one/work/${rjCode.toUpperCase()}`;
                            if (typeof GM_setValue !== "undefined") await GM_setValue(cacheKey, { data: url, time: Date.now() });
                            resolve(url);
                        } else {
                            if (typeof GM_setValue !== "undefined") await GM_setValue(cacheKey, { data: null, time: Date.now() });
                            resolve(null);
                        }
                    },
                    onerror: function() {
                        resolve(null);
                    }
                });
            });
            return p._asmrone;
        },


    mergeLinkage: Linkage.mergeLinkage,
    cacheLinkage: Linkage.cacheLinkage,
    getLinkageFromCache: Linkage.getLinkageFromCache,
    getLinkedWorks: Linkage.getLinkedWorks,
    getLinkedWorksFull: Linkage.getLinkedWorksFull,
    getKikoeruSearchResult: Linkage.getKikoeruSearchResult
};

// Re-export WorkPromise and DLsite to maintain identical public API
export { DLsite };
