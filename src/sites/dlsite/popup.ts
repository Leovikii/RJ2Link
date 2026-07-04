import { createPopupManager } from '../../core/popupManager';
import PopupComponent from './Popup.vue';
import { reactive } from 'vue';
import type { PopupState } from '../../types';

// Extend base popup state if needed
export const popupManager = createPopupManager(PopupComponent);
export const popupState = popupManager.state;
