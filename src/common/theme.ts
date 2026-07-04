import { localize } from '../config/localization';

const STORAGE_KEY = 'sp_dark_mode_enabled';

let menuCommandId: any = null;
let styleElement: HTMLStyleElement | null = null;
let metaElement: HTMLMetaElement | null = null;

const darkThemeCss = `
  /* 1. Global dark background */
  html.rj-warp-gate-dark-mode,
  html.rj-warp-gate-dark-mode body,
  html.rj-warp-gate-dark-mode #wrap,
  html.rj-warp-gate-dark-mode .wrap,
  html.rj-warp-gate-dark-mode #main,
  html.rj-warp-gate-dark-mode .main,
  html.rj-warp-gate-dark-mode .main-wrap,
  html.rj-warp-gate-dark-mode #header,
  html.rj-warp-gate-dark-mode .header,
  html.rj-warp-gate-dark-mode #u-wrap2 {
    background: #121212 !important;
    background-color: #121212 !important;
    background-image: none !important;
    color: #d1d5db !important;
  }

  /* 2. Darken main forum tables and containers */
  html.rj-warp-gate-dark-mode .t_table,
  html.rj-warp-gate-dark-mode .t_table td,
  html.rj-warp-gate-dark-mode .t_table th,
  html.rj-warp-gate-dark-mode .f_one,
  html.rj-warp-gate-dark-mode .f_two,
  html.rj-warp-gate-dark-mode .t_one,
  html.rj-warp-gate-dark-mode .t_two,
  html.rj-warp-gate-dark-mode .r_one,
  html.rj-warp-gate-dark-mode .r_two,
  html.rj-warp-gate-dark-mode .tr3,
  html.rj-warp-gate-dark-mode .tr3 td,
  html.rj-warp-gate-dark-mode .tr2,
  html.rj-warp-gate-dark-mode .tr2 td,
  html.rj-warp-gate-dark-mode .tr1,
  html.rj-warp-gate-dark-mode .tr1 td,
  html.rj-warp-gate-dark-mode .tpc_content,
  html.rj-warp-gate-dark-mode .read_t,
  html.rj-warp-gate-dark-mode .read_m,
  html.rj-warp-gate-dark-mode .t5,
  html.rj-warp-gate-dark-mode #u-sidebar,
  html.rj-warp-gate-dark-mode #u-content,
  html.rj-warp-gate-dark-mode #u-contentmain,
  html.rj-warp-gate-dark-mode #u-contentside,
  html.rj-warp-gate-dark-mode .u-table,
  html.rj-warp-gate-dark-mode .u-table td,
  html.rj-warp-gate-dark-mode .u-table th,
  html.rj-warp-gate-dark-mode .bgA,
  html.rj-warp-gate-dark-mode #u-top,
  html.rj-warp-gate-dark-mode #u-top-nav,
  html.rj-warp-gate-dark-mode .gonggao,
  html.rj-warp-gate-dark-mode #cate_thread,
  html.rj-warp-gate-dark-mode .dcsns-li,
  html.rj-warp-gate-dark-mode .dcsns-li .inner,
  html.rj-warp-gate-dark-mode .section-text {
    background: #1e1e1e !important;
    background-color: #1e1e1e !important;
    border-color: #333 !important;
    color: #e5e7eb !important;
  }

  /* 3. Slightly lighter headers and title bars for depth */
  html.rj-warp-gate-dark-mode .h,
  html.rj-warp-gate-dark-mode .h td,
  html.rj-warp-gate-dark-mode .h th,
  html.rj-warp-gate-dark-mode .h b,
  html.rj-warp-gate-dark-mode .h span,
  html.rj-warp-gate-dark-mode #u-top-nav ul.b li,
  html.rj-warp-gate-dark-mode .pages,
  html.rj-warp-gate-dark-mode .pagesone,
  html.rj-warp-gate-dark-mode .u-h1,
  html.rj-warp-gate-dark-mode .u-h5,
  html.rj-warp-gate-dark-mode .gongul,
  html.rj-warp-gate-dark-mode .gongul li {
    background: #2a2a2a !important;
    background-color: #2a2a2a !important;
    border-color: #444 !important;
    color: #f3f4f6 !important;
  }

  /* 4. Adjust link colors for dark background */
  html.rj-warp-gate-dark-mode a {
    color: #60a5fa !important;
  }
  html.rj-warp-gate-dark-mode a:hover {
    color: #93c5fd !important;
  }

  /* 5. Fix inline white backgrounds and black text often included in user posts */
  html.rj-warp-gate-dark-mode .tpc_content font[color="#000000"],
  html.rj-warp-gate-dark-mode .tpc_content font[color="black"],
  html.rj-warp-gate-dark-mode .tpc_content [style*="color: #000"],
  html.rj-warp-gate-dark-mode .tpc_content [style*="color: black"],
  html.rj-warp-gate-dark-mode .tpc_content [style*="color:#000"] {
    color: #d1d5db !important;
  }
  
  /* 6. Fix inline white backgrounds and various white blocks (like purchase boxes, quote boxes) */
  html.rj-warp-gate-dark-mode [style*="background-color: #fff"],
  html.rj-warp-gate-dark-mode [style*="background-color:#fff"],
  html.rj-warp-gate-dark-mode [style*="background-color: white"],
  html.rj-warp-gate-dark-mode [style*="background-color:#ffffff"],
  html.rj-warp-gate-dark-mode [style*="background: #fff"],
  html.rj-warp-gate-dark-mode [style*="background: white"],
  html.rj-warp-gate-dark-mode [style*="background:#fff"],
  html.rj-warp-gate-dark-mode [style*="background-color: grey"],
  html.rj-warp-gate-dark-mode [bgcolor="#ffffff"],
  html.rj-warp-gate-dark-mode [bgcolor="#fff"],
  html.rj-warp-gate-dark-mode blockquote,
  html.rj-warp-gate-dark-mode .blockquote,
  html.rj-warp-gate-dark-mode .quote,
  html.rj-warp-gate-dark-mode .section-intro {
    background: #2d2d2d !important;
    background-color: #2d2d2d !important;
    border-color: #444 !important;
    color: #d1d5db !important;
  }

  /* 7. Darken input fields and textareas */
  html.rj-warp-gate-dark-mode input[type="text"],
  html.rj-warp-gate-dark-mode input[type="password"],
  html.rj-warp-gate-dark-mode textarea,
  html.rj-warp-gate-dark-mode select {
    background: #2a2a2a !important;
    background-color: #2a2a2a !important;
    color: #e5e7eb !important;
    border: 1px solid #444 !important;
  }

  /* 8. Fix harsh pure blue fonts to a bright blue suitable for dark backgrounds */
  html.rj-warp-gate-dark-mode font[color="#0000FF" i],
  html.rj-warp-gate-dark-mode font[color="blue" i],
  html.rj-warp-gate-dark-mode [style*="color: #0000FF" i],
  html.rj-warp-gate-dark-mode [style*="color:#0000FF" i],
  html.rj-warp-gate-dark-mode [style*="color: blue" i],
  html.rj-warp-gate-dark-mode [style*="color:blue" i] {
    color: #60a5fa !important;
  }
`;

export function initThemeManager() {
  // Only run on target domains
  const hostname = window.location.hostname;
  if (!hostname.includes('south-plus') && 
      !hostname.includes('spring-plus') && 
      !hostname.includes('level-plus') && 
      !hostname.includes('imoutolove')) {
    return;
  }

  // Inject early if enabled
  const isEnabled = GM_getValue(STORAGE_KEY, true);
  if (isEnabled) {
    applyDarkMode();
  }

  registerMenu();
}

function registerMenu() {
  if (menuCommandId !== null && typeof GM_unregisterMenuCommand !== 'undefined') {
    GM_unregisterMenuCommand(menuCommandId);
  }

  const isEnabled = GM_getValue(STORAGE_KEY, true);
  const menuTitle = isEnabled ? localize('switch_to_light_mode') : localize('switch_to_dark_mode');
  
  if (typeof GM_registerMenuCommand !== 'undefined') {
    menuCommandId = GM_registerMenuCommand(menuTitle, () => {
      toggleDarkMode();
    });
  }
}

function toggleDarkMode() {
  const isEnabled = GM_getValue(STORAGE_KEY, true);
  const newState = !isEnabled;
  GM_setValue(STORAGE_KEY, newState);
  
  if (newState) {
    applyDarkMode();
  } else {
    removeDarkMode();
  }
  
  registerMenu();
}

function applyDarkMode() {
  if (document.documentElement) {
    document.documentElement.classList.add('rj-warp-gate-dark-mode');
  }

  const insertElements = () => {
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.textContent = darkThemeCss;
      const target = document.head || document.documentElement;
      if (target) target.appendChild(styleElement);
    }

    if (!metaElement) {
      metaElement = document.createElement('meta');
      metaElement.name = 'darkreader-lock';
      const target = document.head || document.documentElement;
      if (target) target.appendChild(metaElement);
    }
  };

  if (document.head || document.documentElement) {
    insertElements();
  } else {
    document.addEventListener("DOMContentLoaded", () => {
      document.documentElement?.classList.add('rj-warp-gate-dark-mode');
      insertElements();
    }, { once: true });
  }
}

function removeDarkMode() {
  if (document.documentElement) {
    document.documentElement.classList.remove('rj-warp-gate-dark-mode');
  }
  
  if (styleElement) {
    styleElement.remove();
    styleElement = null;
  }

  if (metaElement) {
    metaElement.remove();
    metaElement = null;
  }
}
