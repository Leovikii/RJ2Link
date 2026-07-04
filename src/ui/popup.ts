import { createApp, reactive, App } from 'vue';
import PopupComponent from './Popup.vue';
import { VOICELINK_CLASS, RJCODE_ATTRIBUTE } from '../config/constants';
import { getVoiceLinkTarget, isInDLSite, getOS } from '../utils/common';
import type { PopupState } from '../types';

export const popupState = reactive<PopupState>({
    display: false,
    rjCode: '',
    x: 0,
    y: 0,
    found: true,
    loading: false
});

let popupApp: App<Element> | null = null;
let popupMountPoint: HTMLElement | null = null;
let hideTimer: number | null = null;

export const Popup = {
    makePopup(display = false) {
        if (!popupApp) {
            const container = document.createElement("div");
            container.id = `${VOICELINK_CLASS}-vue-container`;
            container.style.position = 'absolute';
            container.style.top = '0';
            container.style.left = '0';
            container.style.zIndex = '2147483647';
            container.style.pointerEvents = 'none'; // let child popup manage its own pointer events
            document.body.appendChild(container);

            popupApp = createApp(PopupComponent, {
                state: popupState
            });
            popupMountPoint = document.createElement("div");
            container.appendChild(popupMountPoint);
            popupApp.mount(popupMountPoint);
            
            // Global click listener to close popup if clicked outside
            document.addEventListener('click', (e: MouseEvent) => {
                if (!popupState.display) return;
                
                // If clicking inside the popup, do nothing
                if (popupMountPoint?.contains(e.target as Node)) {
                    return;
                }
                
                // If clicking on another RJ link, do nothing (it will be handled by Popup.click)
                const target = getVoiceLinkTarget(e.target as HTMLElement);
                if (target && target.classList.contains(VOICELINK_CLASS)) {
                    return;
                }
                
                // Otherwise close
                popupState.display = false;
            });
            
            // Handle hovering over the popup itself to keep it open
            popupMountPoint.style.pointerEvents = 'auto'; // allow mouse events on the popup content
            popupMountPoint.addEventListener('mouseenter', () => {
                if (hideTimer) {
                    window.clearTimeout(hideTimer);
                    hideTimer = null;
                }
            });
            popupMountPoint.addEventListener('mouseleave', () => {
                // If it's not mobile, start hide timer
                if (window.innerWidth > 768) {
                    hideTimer = window.setTimeout(() => {
                        popupState.display = false;
                    }, 300);
                }
            });
        }
        popupState.display = display !== false;
    },

    click(e: MouseEvent) {
        e.preventDefault(); // Stop default navigation to DLSite
        e.stopPropagation();

        const target = isInDLSite() ? e.target as HTMLElement : getVoiceLinkTarget(e.target as HTMLElement);
        if (!target || !target.classList.contains(VOICELINK_CLASS)) return;

        const rjCode = target.getAttribute(RJCODE_ATTRIBUTE);
        if (!rjCode) return;

        Popup.makePopup(true);
        popupState.rjCode = rjCode;
        popupState.x = e.clientX;
        popupState.y = e.clientY;
    },

    mouseenter(e: MouseEvent) {
        if (window.innerWidth <= 768) return; // Desktop only
        
        if (hideTimer) {
            window.clearTimeout(hideTimer);
            hideTimer = null;
        }

        const target = isInDLSite() ? e.target as HTMLElement : getVoiceLinkTarget(e.target as HTMLElement);
        if (!target || !target.classList.contains(VOICELINK_CLASS)) return;

        const rjCode = target.getAttribute(RJCODE_ATTRIBUTE);
        if (!rjCode) return;

        Popup.makePopup(true);
        popupState.rjCode = rjCode;
        popupState.x = e.clientX;
        popupState.y = e.clientY;
    },

    mouseleave(e: MouseEvent) {
        if (window.innerWidth <= 768) return; // Desktop only
        
        hideTimer = window.setTimeout(() => {
            popupState.display = false;
        }, 300);
    }
};
