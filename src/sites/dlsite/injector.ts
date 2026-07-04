import { createApp } from 'vue';
import DlsiteIntegration from './DlsiteIntegration.vue';

export function initDLSiteInjector() {
  // Extract RJ code from URL
  const url = window.location.href;
  const match = url.match(/(RJ\d{6,8})/i);
  if (!match) return;

  const rjCode = match[1].toUpperCase();

  // Prevent double injection
  if (document.getElementById('rj-warp-gate-dlsite-mount')) return;

  // We use a global fixed FAB, so we can mount it directly to the body!
  const mountPoint = document.createElement('div');
  mountPoint.id = 'rj-warp-gate-dlsite-mount';
  document.body.appendChild(mountPoint);

  // Mount the Vue app
  const app = createApp(DlsiteIntegration, {
    rjCode
  });
  app.mount(mountPoint);
}
