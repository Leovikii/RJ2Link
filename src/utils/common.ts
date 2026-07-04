import { VOICELINK_CLASS } from '../config/constants';


    /**
     * Work promise cache
     * @type {{info:{}, api:{}, api2: {}, circle: {}}}
     */
    export const work_promise = {};

    export function getAdditionalPopupClasses() {
        const hostname = document.location.hostname;
        switch (hostname) {
            case "boards.4chan.org": return "post reply";
            case "discordapp.com": return `${VOICELINK_CLASS}_discord-dark`;
            default: return null;
        }
    }

    export function getOS() {
        const userAgent = navigator.userAgent;
        if (userAgent.indexOf("Windows NT 10.0") !== -1) return "Windows 10";
        if (userAgent.indexOf("Windows NT 6.2") !== -1) return "Windows 8";
        if (userAgent.indexOf("Windows NT 6.1") !== -1) return "Windows 7";
        if (userAgent.indexOf("Windows NT 6.0") !== -1) return "Windows Vista";
        if (userAgent.indexOf("Windows NT 5.1") !== -1) return "Windows XP";
        if (userAgent.indexOf("Windows NT 5.0") !== -1) return "Windows 2000";
        if (userAgent.indexOf("Mac") !== -1) return "Mac";
        if (userAgent.indexOf("X11") !== -1) return "UNIX";
        if (userAgent.indexOf("Linux") !== -1) return "Linux";
        return "Other";
    }

    export function getVoiceLinkTarget(target) {
        while (target && !target.classList.contains(VOICELINK_CLASS)) {
            target = target.parentElement;
        }
        return target;
    }

    export function isInDLSite() {
        return document.location.hostname.endsWith("dlsite.com");
    }

    /**
     * Convert to valid file name.
     * @param {String} original
     */
    export function convertToValidFileName(original) {
        const charMapRegs = {
            "\\/": "／",
            "\\\\": "＼",
            "\\:": "：",
            "\\*": "＊",
            "\\?": "？",
            "\"": "＂",
            "\\<": "＜",
            "\\>": "＞",
            "\\|": "｜"
        }

        let fileName = original;
        for (let key in charMapRegs) {
            fileName = fileName.replaceAll(new RegExp(key, "g"), charMapRegs[key]);
        }
        return fileName;
    }

    export function getXmlHttpRequest() {
        return (typeof GM !== "undefined" && GM !== null ? GM.xmlHttpRequest : GM_xmlhttpRequest);
    }

    export function getHttpAsync(url, anonymous = false, cacheAge = 0, customHeaders = {}): Promise<any> {
        let headers = { ...customHeaders };
        headers["Accept"] = "text/xml";
        headers["User-Agent"] = "Mozilla/5.0 (Windows NT 6.1; Win64; x64; rv:67.0)";
        headers["Cache-Control"] = cacheAge <= 0 ? "no-cache" : "max-age=" + cacheAge;
        return new Promise<any>((resolve, reject) => {
            getXmlHttpRequest()({
                method: "GET",
                url,
                headers: headers,
                onload: resolve,
                onerror: resp => {
                    reject(resp);
                },
                anonymous: anonymous
            });
        })
    }

