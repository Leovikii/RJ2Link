# <img src="./assets/icon.svg" width="36" height="36" /> RJ號折躍門

[🌐 English](./README.md) | [🇨🇳 简体中文](./README-zh.md)

**RJ號折躍門** 是一款極客風油猴腳本。它以 RJ 號為魔法媒介，無縫串聯了南+（South Plus）論壇、DLsite 的元數據網絡以及 ASMR ONE 的在線視聽資源，提供強大的雙向跨站檢索體驗。

專案主頁：[GitHub](https://github.com/Leovikii/RJ-Warp-Gate)。腳本元資料中的主頁入口也統一指向這裡，方便查看原始碼、文件和版本發佈。

![RJ號折躍門 Demo](./assets/demo.png)

## 🌟 主要特性

- **資訊預覽卡片**：在論壇點擊 RJ 號，即可透過不會溢出視窗的卡片預覽 DLsite 作品元數據（含封面、標題、聲優、差異化分類標籤、僅日期的發售資訊及銷量等）；行動端採用緊湊版面，彈窗高度不超過半屏。
- **DLsite 全局懸浮艙**：自動注入 DLsite 作品詳情頁，懸停或點擊即可查看 ASMR ONE 與南+檢索結果；右下角控制項使用緊湊的資料來源狀態標籤，懸停時原位淡入，並支援拖曳、分別記憶桌面端與行動端位置，彈窗會貼近控制項並保持在視窗內。南+搜尋會跨分頁排隊以遵守論壇冷卻時間；各資料來源旁的小型重試控制項只重跑對應的失敗或空結果，只有可處理的網絡故障才顯示隱私脫敏診斷資訊。
- **獨立 SVG 圖示**：腳本與懸浮控制項共用經過光學置中的輕量 RJ 向量圖示，在不同顯示倍率下保持清晰。
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

## 開源授權

Copyright © 2026 Viki。RJ 號折躍門僅採用 [GNU 通用公眾授權條款第 3 版](./LICENSE)（`GPL-3.0-only`）授權。
