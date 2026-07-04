import { URL_REGEX, VOICELINK_IGNORED_CLASS, RJCODE_ATTRIBUTE, VOICELINK_CLASS, RJ_REGEX } from '../config/constants';
import { Popup } from '../ui/popup';

export const Parser = {
    walkNodes: function (elem: Node) {
        const rjNodeTreeWalker = document.createTreeWalker(
            elem,
            NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT,
            {
                acceptNode: function (node: any) {
                    let el = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
                    while (el && el !== document.body) {
                        if (el.classList?.contains('rj-warp-gate-popup') || el.classList?.contains(VOICELINK_IGNORED_CLASS)) {
                            return NodeFilter.FILTER_REJECT;
                        }
                        el = el.parentElement;
                    }

                    if (node.nodeName === "SCRIPT" || node.parentElement && node.parentElement.nodeName === "SCRIPT") {
                        return NodeFilter.FILTER_REJECT;
                    }

                    if (node.parentElement?.isContentEditable) {
                        return NodeFilter.FILTER_SKIP;
                    }

                    if (node.nodeName === "A") {
                        let href = (node as HTMLAnchorElement).href;
                        if (href.match(URL_REGEX) && !(node as HTMLElement).classList.contains(VOICELINK_IGNORED_CLASS)) {
                            return NodeFilter.FILTER_ACCEPT;
                        }
                    }

                    if (node.nodeName !== "#text") return NodeFilter.FILTER_SKIP;
                    if (node.parentElement?.hasAttribute(RJCODE_ATTRIBUTE)) {
                        return NodeFilter.FILTER_SKIP;
                    }

                    if (node.parentElement?.classList.contains(VOICELINK_CLASS))
                        return NodeFilter.FILTER_ACCEPT;
                    if (node.nodeValue?.match(RJ_REGEX))
                        return NodeFilter.FILTER_ACCEPT;

                    return NodeFilter.FILTER_SKIP;
                }
            },
        );
        while (rjNodeTreeWalker.nextNode()) {
            const node = rjNodeTreeWalker.currentNode;

            if (node.parentElement?.nodeName === "TEXTAREA") {
                continue;
            }

            if (node.parentElement?.classList.contains(VOICELINK_CLASS)) {
                Parser.rebindEvents(node.parentElement as HTMLElement);
            } else if (node.nodeName === "A") {
                Parser.linkifyURL(node as HTMLAnchorElement);
            } else {
                Parser.linkify(node as Text);
            }
        }
    },

    wrapPlaceholder: function (content: string) {
        let e = document.createElement("span");
        e.classList.add(VOICELINK_CLASS);
        e.innerText = content;
        e.classList.add(VOICELINK_IGNORED_CLASS);
        e.setAttribute(RJCODE_ATTRIBUTE, "");
        return e;
    },

    wrapRJCode: function (rjCode: string) {
        let e = document.createElement("span");
        e.classList.add(VOICELINK_CLASS);
        e.innerText = rjCode;
        e.classList.add(VOICELINK_IGNORED_CLASS);
        
        // Style it as a subtle interactive button
        e.style.cursor = "pointer";
        e.style.borderBottom = "1px dashed rgba(244, 114, 182, 0.7)";
        e.style.backgroundColor = "rgba(244, 114, 182, 0.05)";
        e.style.borderRadius = "3px";
        e.style.padding = "1px 3px";
        e.style.margin = "0 2px";
        e.style.display = "inline-block";
        e.style.transition = "background-color 0.2s, border-bottom-color 0.2s";
        e.style.color = "#f472b6"; // Sakura pink
        
        // Add hover effect via listeners because it's inline styled
        e.addEventListener("mouseenter", (evt) => {
            e.style.backgroundColor = "rgba(244, 114, 182, 0.15)";
            e.style.borderBottomColor = "rgba(244, 114, 182, 1)";
            Popup.mouseenter(evt);
        });
        e.addEventListener("mouseleave", (evt) => {
            e.style.backgroundColor = "rgba(244, 114, 182, 0.05)";
            e.style.borderBottomColor = "rgba(244, 114, 182, 0.7)";
            Popup.mouseleave(evt);
        });

        e.setAttribute(RJCODE_ATTRIBUTE, rjCode.toUpperCase());
        e.setAttribute("voicelink-linkified", "true");
        e.addEventListener("click", Popup.click);
        return e;
    },

    calculateCoverage: function (text: string) {
        const matches = text.match(RJ_REGEX);
        if (!matches) return 0;
        const coverSize = matches.reduce((total, current) => total + current.length, 0);
        return (coverSize / text.length) * 100;
    },

    linkifyURL: function (node: HTMLAnchorElement) {
        const e = node;
        const href = e.href;
        const rjs = href.match(RJ_REGEX);
        if (!rjs) return;
        const rj = rjs[rjs.length - 1];
        if (!rj) return;

        e.classList.add(VOICELINK_CLASS);
        e.setAttribute(RJCODE_ATTRIBUTE, rj.toUpperCase());
        
        // Remove href to avoid bottom-left URL prompt, make it a button-like element
        e.removeAttribute("href");
        e.removeAttribute("target");
        e.removeAttribute("rel");
        e.style.cursor = "pointer";
        e.style.borderBottom = "1px dashed rgba(244, 114, 182, 0.7)";
        e.style.backgroundColor = "rgba(244, 114, 182, 0.05)";
        e.style.borderRadius = "3px";
        e.style.padding = "1px 3px";
        e.style.transition = "background-color 0.2s, border-bottom-color 0.2s";
        e.style.color = "#f472b6"; // Sakura pink
        e.addEventListener("mouseenter", (evt) => {
            e.style.backgroundColor = "rgba(244, 114, 182, 0.15)";
            e.style.borderBottomColor = "rgba(244, 114, 182, 1)";
            Popup.mouseenter(evt);
        });
        e.addEventListener("mouseleave", (evt) => {
            e.style.backgroundColor = "rgba(244, 114, 182, 0.05)";
            e.style.borderBottomColor = "rgba(244, 114, 182, 0.7)";
            Popup.mouseleave(evt);
        });

        e.addEventListener("click", Popup.click);
    },

    linkify: function (textNode: Text) {
        const nodeOriginalText = textNode.nodeValue || "";
        const matches: any[] = [];

        let insert = "before_rj";
        let tagA = textNode.parentElement?.closest("a");
        let tagB = textNode.parentElement?.closest("button");
        let tag = tagA ? tagA : tagB;
        if ((!tagA && !tagB) || insert.trim() !== "none" && this.calculateCoverage(tag?.innerText || "") < 71) {
            insert = "none";
        }

        let match;
        while (match = RJ_REGEX.exec(nodeOriginalText)) {
            matches.push({
                index: match.index,
                value: match[0],
            });
        }
        if (matches.length === 0) return;

        textNode.nodeValue = nodeOriginalText.substring(0, matches[0].index);
        
        let prevNode: Node | null = null;
        for (let i = 0; i < matches.length; ++i) {
            let code = matches[i].value;
            let rjLinkNode: HTMLElement = Parser.wrapRJCode(code);
            
            if (insert.startsWith("before_rj")) {
                rjLinkNode.innerText = "🔗";
                textNode.parentNode?.insertBefore(
                    rjLinkNode,
                    prevNode ? prevNode.nextSibling : textNode.nextSibling,
                );
                prevNode = rjLinkNode;
                rjLinkNode = Parser.wrapPlaceholder(code);
            }
            
            textNode.parentNode?.insertBefore(
                rjLinkNode,
                prevNode ? prevNode.nextSibling : textNode.nextSibling,
            );
            
            let nextRJ = undefined;
            if (i < matches.length - 1) {
                nextRJ = matches[i + 1].index;
            }
            let substring = nodeOriginalText.substring(matches[i].index + matches[i].value.length, nextRJ);

            if (substring) {
                const subtextNode = document.createTextNode(substring);
                textNode.parentNode?.insertBefore(
                    subtextNode,
                    rjLinkNode.nextElementSibling,
                );
                prevNode = subtextNode;
            } else {
                prevNode = rjLinkNode;
            }
        }
    },

    rebindEvents: function (elem: HTMLElement) {
        if (elem.nodeName === "A") {
            elem.addEventListener("click", Popup.click);
            elem.addEventListener("mouseenter", Popup.mouseenter);
            elem.addEventListener("mouseleave", Popup.mouseleave);
        } else {
            const voicelinks = elem.querySelectorAll("." + VOICELINK_CLASS);
            for (let i = 0, j = voicelinks.length; i < j; i++) {
                const voicelink = voicelinks[i] as HTMLElement;
                voicelink.addEventListener("click", Popup.click);
                voicelink.addEventListener("mouseenter", Popup.mouseenter);
                voicelink.addEventListener("mouseleave", Popup.mouseleave);
            }
        }
    },

    parseEnglishDateStr: function (dateStr: string, nums: any[], lang: string) {
        if (!dateStr.match(/[a-zA-Z]{3}\/\d{1,2}\/\d{4}/)) {
            return null;
        }
        const monthMap: Record<string, number> = {
            "Jan": 0, "Feb": 1, "Mar": 2,
            "Apr": 3, "May": 4, "Jun": 5,
            "Jul": 6, "Aug": 7, "Sep": 8,
            "Oct": 9, "Nov": 10, "Dec": 11
        }
        let monthStr = dateStr.substring(0, dateStr.indexOf("/")).toLowerCase();
        monthStr = monthStr[0].toUpperCase() + monthStr.substring(1);
        return new Date(nums[1], monthMap[monthStr], nums[0])
    },
    parseSpanishDateStr: function (dateStr: string, nums: any[], lang: string) {
        if (lang !== "es-es" || !dateStr.match(/\d{1,2}\/\d{1,2}\/\d{4}/)) {
            return null;
        }
        return new Date(nums[2], nums[0] - 1, nums[1]);
    },
    parseEuropeanDateStr: function (dateStr: string, nums: any[], lang: string) {
        if (lang === "es-es" || !dateStr.match(/\d{1,2}\/\d{1,2}\/\d{4}/)) {
            return null;
        }
        return new Date(nums[2], nums[1] - 1, nums[0]);
    },
    getCountDownDateElement: function (date: Date) {
        if (!date) return "";

        const today = new Date();
        today.setHours(0);
        today.setMinutes(0);
        today.setSeconds(0);
        today.setMilliseconds(0);
        date.setHours(0);
        date.setMinutes(0);
        date.setSeconds(0);
        date.setMilliseconds(0);

        if (date.getTime() < today.getTime()) return "";
        let days = (date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
        let element = document.createElement("span");
        element.innerText = `(Coming in ${days} day${(days > 1 ? "s" : "")})`;
        element.style.setProperty("color", "#ffeb3b", "important");
        element.style.setProperty("font-style", "italic", "important");
        return element;
    }
}