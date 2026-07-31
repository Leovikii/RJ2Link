import { render } from 'preact';
import { ResourceController } from '../../application/resource-controller';
import { clipboard, diagnostics, providerRegistry, storage } from '../../application/runtime';
import { parseRjCode } from '../../domain/rj-code';
import { DlsiteApp } from '../../ui/dlsite/app';

export function initDlsite(): (() => void) | null {
  const match = location.href.match(/(?:R[JE]|[VB]J)\d{6}(?:\d{2})?/i);
  const code = parseRjCode(match?.[0] ?? '');
  if (!code) return null;
  if (document.getElementById('rwg-dlsite-root')) return null;

  const mount = document.createElement('div');
  mount.id = 'rwg-dlsite-root';
  mount.className = 'rwg-root';
  document.body.appendChild(mount);
  const controller = new ResourceController(providerRegistry);
  render(
    <DlsiteApp
      code={code}
      controller={controller}
      storage={storage}
      diagnostics={diagnostics}
      clipboard={clipboard}
    />,
    mount,
  );

  return () => {
    controller.dispose();
    render(null, mount);
    mount.remove();
  };
}
