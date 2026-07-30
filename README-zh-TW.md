# <img src="./assets/icon.svg" width="36" height="36" /> RJ號折躍門

[🌐 English](./README.md) | [🇨🇳 简体中文](./README-zh.md)

**RJ號折躍門** 是一款極客風油猴腳本。它以 RJ 號為魔法媒介，無縫串聯了南+（South Plus）論壇、DLsite 的元數據網絡以及 ASMR ONE 的在線視聽資源，提供強大的雙向跨站檢索體驗。

![RJ號折躍門 Demo](./assets/demo.png)

## 🌟 主要特性

- **資訊預覽卡片**：在論壇點擊 RJ 號，即可透過沉浸式卡片快速預覽 DLsite 作品元數據（含封面、標題、聲優、標籤及銷量等）。
- **DLsite 全局懸浮艙**：自動注入 DLsite 作品詳情頁，提供跨站檢索功能，快速查詢 ASMR ONE 在線資源及南+論壇相關討論。
- **ASMR ONE 快捷試聽**：內建跳轉引擎，提供一鍵直達 ASMR ONE 在線播放頁面的快捷入口。
- **原生夜間模式**：內建南+論壇全局夜間模式，提供一致的視覺體驗，並相容現有暗色主題彈窗。
- **多語言適配**：根據瀏覽器語言環境，介面自動在簡體中文、繁體中文和英文間智能切換。
- **智能元數據預取**：在網絡條件允許時，腳本會利用瀏覽器空閒時間預取頁面附近最多兩個 RJ 號的輕量元數據，降低首次開啟預覽的延遲，同時不會預載圖片或媒體資源。

## 🚀 安裝指南

首先，請在瀏覽器中安裝用戶腳本管理器，強烈推薦使用 [Tampermonkey (油猴)](https://www.tampermonkey.net/)。然後，選擇以下任意一種方式安裝：

- **方式 A：通過 SleazyFork 安裝（推薦）**
  點擊 **[此處](https://sleazyfork.org/zh-TW/scripts/583340-rj-warp-gate)** 安裝，支持後續自動更新。

- **方式 B：通過 GitHub Release 安裝**
  點擊 **[此處](https://github.com/Leovikii/RJ-Warp-Gate/releases/latest/download/rj-warp-gate.user.js)** 安裝由 GitHub Actions 全自動打包的最新主線版本。

## 開發文件

架構設計、開發規範和版本計畫已單獨收束到 [`docs/`](./docs/README.md)。本 README 繼續只面向腳本使用者和安裝情境。
