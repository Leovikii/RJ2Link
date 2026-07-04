import { getHttpAsync } from '../utils/common';
import { Csp } from '../utils/csp';
import * as DLsiteParser from '../sites/dlsite/parser';

export async function getAnnouncePromise(rjCode, parentRJ) {
            const url = `https://www.dlsite.com/maniax/announce/=/product_id/${rjCode}.html`;
            let resp = await getHttpAsync(url);
            if (resp.readyState === 4 && resp.status === 200) {
                const dom = new DOMParser().parseFromString(Csp.createHTML(resp.responseText), "text/html");
                const workInfo = DLsiteParser.parseWorkDOM(dom, rjCode);
                workInfo.parentWork = parentRJ === rjCode ? null : parentRJ;
                workInfo.is_announce = true;
                return workInfo;
            }
            else if (resp.readyState === 4 && resp.status === 404) {
                return {
                    parentWork: parentRJ === rjCode ? null : parentRJ,
                    is_announce: false
                };
            }

        }

export async function getHtmlPromise(rjCode) {
            const url = `https://www.dlsite.com/maniax/work/=/product_id/${rjCode}.html`;
            let resp = await getHttpAsync(url);
            if (resp.readyState === 4 && resp.status === 200) {
                const dom = new DOMParser().parseFromString(Csp.createHTML(resp.responseText), "text/html");
                const workInfo = DLsiteParser.parseWorkDOM(dom, rjCode);
                workInfo.parentWork = DLsiteParser.getParentWorkRjCode(resp.finalUrl);
                workInfo.parentWork = workInfo.parentWork === rjCode ? null : workInfo.parentWork;
                workInfo.is_announce = false;
                return workInfo;
            }
            else if (resp.readyState === 4 && resp.status === 404) {
                return await getAnnouncePromise(rjCode, DLsiteParser.getParentWorkRjCode(resp.finalUrl));
            }
        }

export async function getApi2Promise(rjCode, locale = undefined) {
            let url = `https://www.dlsite.com/maniax/api/=/product.json?workno=${rjCode}` + (locale ? `&locale=${locale}` : "");
            let resp = await getHttpAsync(url);
            let data;
            if (resp.readyState === 4 && resp.status === 200) {
                data = JSON.parse(resp.responseText);
                data = data ? data[0] : {};
                data = data ? data : {}
            }
            else if (resp.readyState === 4 && resp.status === 404) {
                return {};
            }
            else {
                throw new Error(`无法通过API2获取${rjCode}的信息：${resp.status} ${resp.statusText}`);
            }

            return DLsiteParser.parseApi2Data(rjCode, data);
        }

export async function getApiPromise(rjCode, locale = undefined) {
            let url = `https://www.dlsite.com/maniax/product/info/ajax?product_id=${rjCode}&cdn_cache_min=1` + (locale ? `&locale=${locale}` : "");
            let resp = await getHttpAsync(url);
            let data;
            if (resp.readyState === 4 && resp.status === 200) {
                data = JSON.parse(resp.responseText);
                data = data ? data[rjCode] : {};
                data = data ? data : {};
            }
            else if (resp.readyState === 4 && resp.status === 404) {
                return {};
            }
            else {
                throw new Error(`无法通过API获取${rjCode}的信息：${resp.status} ${resp.statusText}`);
            }

            const translation_info = data.translation_info ? data.translation_info : {};
            data.lang = DLsiteParser.getLangCode(translation_info.lang);

            return DLsiteParser.parseApiData(rjCode, data);
        }

export async function getCirclePromise(rjCode, apiPromise) {
            let apiData = await apiPromise;
            if (!apiData.maker_id) return null;
            const maker_id = apiData.maker_id;

            let url;
            let resp;
            let data;
            try {
                url = `https://media.ci-en.jp/dlsite/lookup/${maker_id}.json`;
                resp = await getHttpAsync(url);
                data = undefined;
                if (resp.readyState === 4 && resp.status === 200) {
                    data = JSON.parse(resp.responseText);
                    data = data ? data[0] : {};
                    data = data ? data : {};
                    data.maker_id = maker_id;
                }
            } catch (e) { }

            if (!data || !data.name) {
                url = `https://www.dlsite.com/maniax/circle/profile/=/maker_id/${maker_id}.html`;
                resp = await getHttpAsync(url);
                data = data ? data : {};
                if (resp.readyState === 4 && resp.status === 200) {
                    let doc = new DOMParser().parseFromString(Csp.createHTML(resp.responseText), "text/html");
                    let nameElement = doc.querySelector("strong.prof_maker_name");
                    data.name = nameElement ? (nameElement as HTMLElement).innerText : null;
                }
            }

            return data;
        }

export async function getTranslatablePromise(rjCode, site = "maniax") {
            rjCode = rjCode.toUpperCase();
            const result = {
                translation_request_english: {
                    agree: undefined,
                    request: undefined,
                    sale: undefined
                },
                translation_request_simplified_chinese: {
                    agree: undefined,
                    request: undefined,
                    sale: undefined
                },
                translation_request_traditional_chinese: {
                    agree: undefined,
                    request: undefined,
                    sale: undefined
                },
                translation_request_korean: {
                    agree: undefined,
                    request: undefined,
                    sale: undefined
                },
                translation_request_spanish: {
                    agree: undefined,
                    request: undefined,
                    sale: undefined
                },
                translation_request_german: {
                    agree: undefined,
                    request: undefined,
                    sale: undefined
                },
                translation_request_french: {
                    agree: undefined,
                    request: undefined,
                    sale: undefined
                },
                translation_request_indonesian: {
                    agree: undefined,
                    request: undefined,
                    sale: undefined
                },
                translation_request_italian: {
                    agree: undefined,
                    request: undefined,
                    sale: undefined
                },
                translation_request_portuguese: {
                    agree: undefined,
                    request: undefined,
                    sale: undefined
                },
                translation_request_swedish: {
                    agree: undefined,
                    request: undefined,
                    sale: undefined
                },
                translation_request_thai: {
                    agree: undefined,
                    request: undefined,
                    sale: undefined
                },
                translation_request_vietnamese: {
                    agree: undefined,
                    request: undefined,
                    sale: undefined
                },
            };
            const data = await getTranslatableApiPromise(rjCode, site);
            if (!data.translationStatusForTranslator) {
                return result;
            }

            const map = {
                translation_request_english: "ENG",
                translation_request_simplified_chinese: "CHI_HANS",
                translation_request_traditional_chinese: "CHI_HANT",
                translation_request_korean: "KO_KR",
                translation_request_spanish: "SPA",
                translation_request_german: "GER",
                translation_request_french: "FRE",
                translation_request_indonesian: "IND",
                translation_request_italian: "ITA",
                translation_request_portuguese: "POR",
                translation_request_swedish: "SWE",
                translation_request_thai: "THA",
                translation_request_vietnamese: "VIE",
            };
            for (let key in map) {
                let lang = map[key];
                let status = data.translationStatusForTranslator[lang];
                if (!status) {
                    continue;
                }
                result[key].agree = status.available;
                result[key].request = status.count;
                result[key].sale = status.on_sale_count;
            }

            return result;
        }

export async function getTranslatableApiPromise(rjCode, site = "maniax") {
            rjCode = rjCode.toUpperCase();
            let url = `https://www.dlsite.com/${site}/api/=/translatableProducts.json?keyword=${rjCode}`;
            let resp = await getHttpAsync(url, true);
            let data;
            if (resp.readyState === 4 && resp.status === 200) {
                data = JSON.parse(resp.responseText);
            }
            else {
                throw new Error(`无法通过API获取${rjCode}的翻译信息：${resp.status} ${resp.statusText}`);
            }

            if (data.meta && data.meta.code !== 200) {
                throw new Error(`无法通过API查询${rjCode}的翻译信息：${data.meta.code} - ${data.meta.errorType} - ${data.meta.errorMessage}`);
            }
            if (!data.data || !Array.isArray(data.data.products)) {
                throw new Error(`无法通过API查询${rjCode}的翻译信息：未预料到的响应格式。`);
            }

            for (const work of data.data.products) {
                if (work.id === rjCode) {
                    return work;
                }
            }

            return {};

        }

export function getWorkRequestPromise(rjCode) {
            return {
                _info: undefined,
                _api: undefined,
                _api2: undefined,
                _circle: undefined,
                _translatable: undefined,
                _translated_title: undefined,
                get info() {
                    return this._info ? this._info : this._info = getHtmlPromise(rjCode);
                },
                get api() {
                    return this._api ? this._api : this._api = getApiPromise(rjCode);
                },
                get api2() {
                    return this._api2 ? this._api2 : this._api2 = getApi2Promise(rjCode);
                },
                get circle() {
                    return this._circle ? this._circle : this._circle = getCirclePromise(rjCode, this.api);
                },
                get translatable() {
                    async function getter(t) {
                        let api = await t.api2;
                        if (!api.site_id) api = await t.api;

                        return t._translatable ? t._translatable : t._translatable = getTranslatablePromise(rjCode,
                            api.site_id ? api.site_id : "maniax");
                    }
                    return getter(this);
                },
                get translated_title() {
                    async function getter(t) {
                        if (t._translated_title) return t._translated_title;

                        let api = await t.api2;
                        if (api.translation_info) {
                            if (!api.translation_info.is_original) {
                                api = await getApi2Promise(rjCode, api.lang);
                            }
                            t._translated_title = api.work_name;
                            return t._translated_title;
                        }

                        api = await t.api;
                        if (!api.translation_info) {
                            t._translated_title = null;
                            return null;
                        }

                        if (!api.translation_info.is_original) {
                            api = await getApiPromise(rjCode, api.lang);
                        }
                        t._translated_title = api.work_name;
                        return t._translated_title;
                    }

                    return getter(this);
                }
            }
        }

