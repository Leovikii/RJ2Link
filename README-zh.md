# <img src="./assets/icon.svg" width="36" height="36" /> RJ号折跃门

[🌐 English](./README.md) | [🇭🇰/🇹🇼 繁體中文](./README-zh-TW.md)

**RJ号折跃门** 是一款极客风油猴脚本。它以 RJ 号为魔法媒介，无缝串联了南+（South Plus）论坛、DLsite 的元数据网络以及 ASMR ONE 的在线视听资源，提供强大的双向跨站检索体验。

![RJ号折跃门 Demo](./assets/demo.png)

## 🌟 主要特性

- **信息预览卡片**：在论坛点击 RJ 号，即可通过沉浸式卡片快速预览 DLsite 作品元数据（含封面、标题、声优、标签及销量等）。
- **DLsite 全局悬浮舱**：自动注入 DLsite 作品详情页，提供跨站检索功能，快速查询 ASMR ONE 在线资源及南+论坛相关讨论。
- **ASMR ONE 快捷试听**：内置跳转引擎，提供一键直达 ASMR ONE 在线播放页面的快捷入口。
- **原生夜间模式**：内置南+论坛全局夜间模式，提供一致的视觉体验，并兼容现有暗色主题弹窗。
- **多语言适配**：根据浏览器语言环境，界面自动在简体中文、繁体中文和英文间智能切换。
- **智能元数据预取**：在网络条件允许时，脚本会利用浏览器空闲时间预取页面附近最多两个 RJ 号的轻量元数据，降低首次打开预览的延迟，同时不会预加载图片或媒体资源。

## 🚀 安装指南

首先，请在浏览器中安装用户脚本管理器，强烈推荐使用 [Tampermonkey (油猴)](https://www.tampermonkey.net/)。然后，选择以下任意一种方式安装：

- **方式 A：通过 SleazyFork 安装（推荐）**
  点击 **[此处](https://sleazyfork.org/zh-CN/scripts/583340-rj-warp-gate)** 安装，支持后续自动更新。

- **方式 B：通过 GitHub Release 安装**
  点击 **[此处](https://github.com/Leovikii/RJ-Warp-Gate/releases/latest/download/rj-warp-gate.user.js)** 安装由 GitHub Actions 全自动打包的最新主线版本。

## 开发文档

架构设计、开发规范和版本计划已单独收束到 [`docs/`](./docs/README.md)。本 README 继续只面向脚本用户和安装场景。
