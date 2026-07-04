import { POPUP_CSS, VOICELINK_CLASS } from "./config/constants";
import { Parser } from "./sites/southplus/parser";
import { Popup } from "./sites/southplus/popup";
import { Csp } from "./utils/csp";
import { initThemeManager } from "./common/theme";
import { initDLSiteInjector } from "./sites/dlsite/injector";

// Initialize dark mode as early as possible (run-at: document-start)
if (!document.location.hostname.includes("dlsite.com")) {
    if (typeof GM_setValue !== "undefined") {
        GM_setValue("last_forum_domain", document.location.hostname);
    }
    initThemeManager();
}

export let isInit = false;
export let observing = false;

export function init() {
    if (document.location.hostname.includes("dlsite.com")) {
        initDLSiteInjector();
        return;
    }

    if (!isInit) {
        isInit = true;
    }

    setTimeout(() => {
        if (!document.body || observing) {
            return;
        }

        Parser.walkNodes(document.body);
        if (!document.getElementById(`${VOICELINK_CLASS}-vue-container`)) Popup.makePopup(false);

        const observer = new MutationObserver(function (m) {
            for (let i = 0; i < m.length; ++i) {
                let addedNodes = m[i].addedNodes;
                
                for (let j = 0; j < addedNodes.length; ++j) {
                    Parser.walkNodes(addedNodes[j]);
                }
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });

        observing = true;
    }, 100);
}

if (document.readyState === 'loading') {
    document.addEventListener("DOMContentLoaded", init);
} else {
    init();
}