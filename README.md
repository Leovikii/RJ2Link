# <img src="./assets/icon.svg" width="36" height="36" /> RJ Warp Gate

[![License: GPL v3](https://img.shields.io/badge/License-GPL_v3-blue.svg)](./LICENSE)

[🇨🇳 简体中文](./README-zh.md) | [🇭🇰/🇹🇼 繁體中文](./README-zh-TW.md)

**RJ Warp Gate** is a powerful Tampermonkey script that bridges South Plus forums, DLsite, and ASMR ONE. It transforms static RJ codes into an interactive, beautifully designed experience and provides seamless cross-site resource searching.

Project homepage: [GitHub](https://github.com/Leovikii/RJ-Warp-Gate). The userscript metadata also points here for source code, documentation, and releases.

![RJ Warp Gate Demo](./assets/demo.png)

## 🌟 Features

- **Metadata Preview Card**: Click any RJ code in the forum to instantly preview DLsite metadata via a viewport-safe, single-page card without internal scrolling, including cover art, title, voice actors, visually distinct category tags, date-only release information, and sales data. Its touch-friendly mobile layout stays within half the viewport height.
- **DLsite Global FAB**: Automatically injected into DLsite work pages; hover or click it to inspect ASMR ONE and South Plus results. The bottom-right control uses compact source-status chips, fades in without shifting on hover, can be dragged, remembers separate desktop and mobile positions, and keeps its result panel attached inside the viewport. Long result lists scroll independently. South Plus searches are queued across tabs to respect the forum cooldown; compact per-source retry controls only rerun the failed/empty source, and privacy-safe diagnostics appear only for actionable network failures.
- **Dedicated SVG Icon**: The script and floating control share a lightweight, optically centered RJ vector mark that stays crisp at every display scale.
- **ASMR ONE Integration**: Features a built-in redirection engine with a one-click shortcut to ASMR ONE online streaming pages.
- **Native Dark Mode**: Includes a built-in dark mode for South Plus forums to ensure a consistent visual experience that perfectly matches the popup UI.
- **Auto-Localization**: The interface automatically adapts between English, Simplified Chinese, and Traditional Chinese based on your browser environment.
- **Smart Metadata Prefetch**: On supported forum pages, up to two nearby RJ codes are prefetched during browser idle time when network conditions allow, reducing the delay of the first preview without preloading images or media.

## 🚀 Installation

First, install a user script manager such as [Tampermonkey](https://www.tampermonkey.net/). Then, choose one of the following methods to install RJ Warp Gate:

- **Method A: Install via SleazyFork (Recommended)**
  Click **[Here](https://sleazyfork.org/zh-CN/scripts/583340-rj-warp-gate)** to install and get automatic updates.

- **Method B: Install via GitHub Release**
  Click **[Here](https://github.com/Leovikii/RJ-Warp-Gate/releases/latest/download/rj-warp-gate.user.js)** to install the latest build directly from our GitHub Actions CI/CD.

## Documentation

Development, architecture, and contribution documentation is maintained separately in [`docs/`](./docs/README.md). This README remains focused on users and installation.

## License

Copyright © 2026 Viki. RJ Warp Gate is licensed under the [GNU General Public License version 3 only](./LICENSE) (`GPL-3.0-only`).
