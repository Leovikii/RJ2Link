import { defineConfig } from 'vite';
import monkey from 'vite-plugin-monkey';
import preact from '@preact/preset-vite';

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
        license: 'MIT',
        description: {
          '': 'Injects bidirectional cross-site resource search into South Plus and DLsite, featuring detailed metadata preview cards and one-click redirection to ASMR ONE.',
          'zh': '为南+论坛和 DLsite 注入双向资源检索与高亮功能，提供详尽的元数据预览卡片及 ASMR ONE 在线试听一键跳转。',
          'zh-CN': '为南+论坛和 DLsite 注入双向资源检索与高亮功能，提供详尽的元数据预览卡片及 ASMR ONE 在线试听一键跳转。',
          'zh-TW': '為南+論壇和 DLsite 注入雙向資源檢索與高亮功能，提供詳盡的元數據預覽卡片及 ASMR ONE 在線試聽一鍵跳轉。'
        },
        homepageURL: 'https://sleazyfork.org/zh-CN/scripts/583340-rj-warp-gate',
        supportURL: 'https://github.com/Leovikii/RJ-Warp-Gate/issues',
        match: [
          '*://*.south-plus.net/*',
          '*://*.spring-plus.net/*',
          '*://*.level-plus.net/*',
          '*://*.dlsite.com/*',
          '*://*.dlsite.com.tw/*',
        ],
        icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Cdefs%3E%3ClinearGradient id='bg' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%238b5cf6'/%3E%3Cstop offset='100%25' stop-color='%23ec4899'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='64' height='64' rx='14' fill='url(%23bg)'/%3E%3Ctext x='29' y='44' font-family='Arial,sans-serif' font-weight='900' font-style='italic' font-size='36' fill='%23ffffff' text-anchor='middle' letter-spacing='-1'%3ERJ%3C/text%3E%3C/svg%3E",
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
