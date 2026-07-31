import { defineConfig } from 'vite';
import monkey from 'vite-plugin-monkey';
import preact from '@preact/preset-vite';
import { readFileSync } from 'node:fs';

const iconSvg = readFileSync(new URL('./assets/icon.svg', import.meta.url), 'utf8');
const iconDataUrl = `data:image/svg+xml,${encodeURIComponent(iconSvg)}`;

export default defineConfig({
  plugins: [
    preact(),
    monkey({
      entry: 'src/main.ts',
      userscript: {
        name: {
          '': 'RJ Warp Gate',
          'zh': 'RJ号折跃门',
          'zh-CN': 'RJ号折跃门',
          'zh-TW': 'RJ號折躍門'
        },
        namespace: 'Leovikii',
        author: 'Leovikii',
        license: 'GPL-3.0-only',
        description: {
          '': 'Injects bidirectional cross-site resource search into South Plus and DLsite, featuring detailed metadata preview cards and one-click redirection to ASMR ONE.',
          'zh': '为南+论坛和 DLsite 注入双向资源检索与高亮功能，提供详尽的元数据预览卡片及 ASMR ONE 在线试听一键跳转。',
          'zh-CN': '为南+论坛和 DLsite 注入双向资源检索与高亮功能，提供详尽的元数据预览卡片及 ASMR ONE 在线试听一键跳转。',
          'zh-TW': '為南+論壇和 DLsite 注入雙向資源檢索與高亮功能，提供詳盡的元數據預覽卡片及 ASMR ONE 在線試聽一鍵跳轉。'
        },
        homepageURL: 'https://github.com/Leovikii/RJ-Warp-Gate',
        supportURL: 'https://github.com/Leovikii/RJ-Warp-Gate/issues',
        match: [
          '*://*.south-plus.net/*',
          '*://*.spring-plus.net/*',
          '*://*.level-plus.net/*',
          '*://*.dlsite.com/*',
          '*://*.dlsite.com.tw/*',
        ],
        icon: iconDataUrl,
        version: '1.3.0',
        connect: [
          'www.dlsite.com',
          'api.asmr-200.com',
          'south-plus.net',
          'www.south-plus.net',
          '*.south-plus.net',
          'spring-plus.net',
          'www.spring-plus.net',
          '*.spring-plus.net',
          'level-plus.net',
          'www.level-plus.net',
          '*.level-plus.net'
        ],
        grant: [
          'GM_setClipboard',
          'GM_setValue',
          'GM_getValue',
          'GM_deleteValue',
          'GM_listValues',
          'GM.xmlHttpRequest',
          'GM_xmlhttpRequest',
          'GM_registerMenuCommand',
          'GM_unregisterMenuCommand'
        ],
        'run-at': 'document-start',

      },
    }),
  ],
});
