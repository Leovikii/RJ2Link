# <img src="./assets/icon.svg" width="36" height="36" /> RJ号折跃门

[🌐 English](./README.md) | [🇭🇰/🇹🇼 繁體中文](./README-zh-TW.md)

**RJ号折跃门** 是一款极客风油猴脚本。它以 RJ 号为魔法媒介，无缝串联了南+（South Plus）论坛、DLsite 的元数据网络以及 ASMR ONE 的在线视听资源，提供强大的双向跨站检索体验。

项目主页：[GitHub](https://github.com/Leovikii/RJ-Warp-Gate)。脚本元数据中的主页入口也统一指向这里，便于查看源码、文档和版本发布。

![RJ号折跃门 Demo](./assets/demo.png)

## 🌟 主要特性

- **信息预览卡片**：在论坛点击 RJ 号，即可通过不会溢出视口的卡片预览 DLsite 作品元数据（含封面、标题、声优、差异化分类标签、仅日期的发售信息及销量等）；移动端采用紧凑布局，弹窗高度不超过半屏。
- **DLsite 全局悬浮舱**：自动注入 DLsite 作品详情页，悬停或点击即可查看 ASMR ONE 与南+检索结果；右下角控件使用紧凑的数据源状态标签，悬停时原位淡入，并支持拖曳、分别记忆桌面端和移动端位置，弹窗会贴近控件并保持在视口内。南+搜索会跨标签排队以遵守论坛冷却时间；各数据源旁的小型重试控件只重跑对应的失败或空结果，仅可处理的网络故障显示隐私脱敏诊断信息。
- **独立 SVG 图标**：脚本和悬浮控件共用经过光学居中的轻量 RJ 矢量图标，在不同显示倍率下保持清晰。
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

## 开源许可

Copyright © 2026 Viki。RJ 号折跃门仅采用 [GNU 通用公共许可证第 3 版](./LICENSE)（`GPL-3.0-only`）授权。
