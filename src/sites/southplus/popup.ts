import { createPopupManager } from '../../core/popupManager';
import PopupComponent from './Popup.vue';

export const Popup = createPopupManager(PopupComponent);
export const popupState = Popup.state;
