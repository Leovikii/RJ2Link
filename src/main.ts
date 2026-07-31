import './ui/styles.css';
import { initThemeManager } from './common/theme';
import { initDlsite } from './sites/dlsite/adapter';
import { initSouthPlus } from './sites/southplus/adapter';

function isDlsiteHost(hostname: string): boolean {
  return hostname === 'dlsite.com'
    || hostname.endsWith('.dlsite.com')
    || hostname === 'dlsite.com.tw'
    || hostname.endsWith('.dlsite.com.tw');
}

function init(): void {
  if (!document.body) return;
  if (isDlsiteHost(location.hostname)) {
    initDlsite();
    return;
  }
  initThemeManager();
  initSouthPlus();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init, { once: true });
} else {
  init();
}
