# RJ Warp Gate 开发文档

本目录集中存放面向维护者和 AI agents 的工程文档。根目录的 `README.md`、`README-zh.md` 和 `README-zh-TW.md` 只面向脚本用户，介绍功能、安装和使用方式；实现细节、开发命令和版本计划不应继续写入用户 README。

## 文档导航

- [目标架构](architecture.md)：v1.3.0 重构后的模块边界、依赖方向和后续补丁版本约束。
- [开发规范](development.md)：类型、网络、缓存、状态、DOM、性能、测试和文档规范。
- [AI agents 指南](agents.md)：AI 修改仓库前必须遵循的入口、工作流程和验证要求。
- [South Plus RJ 元数据预取](features/southplus-rj-prefetch.md)：预加载功能的网络预算、调度算法和验收标准。
- [South Plus 搜索协调](features/southplus-search-coordination.md)：跨标签页冷却队列、等待预算、手动重试和精简诊断策略。
- [v1.3.1 修复计划](plans/v1.3.1.md)：当前版本范围、DLsite 长标题溢出修复方案和验收标准。
- [v1.3.0 重构计划](plans/v1.3.0.md)：已完成架构版本的范围、里程碑和验证记录。

## 文档职责

| 位置 | 受众 | 内容 |
| --- | --- | --- |
| 根目录 `README*` | 脚本用户 | 功能、安装、兼容范围、使用方式 |
| `docs/README.md` | 开发者 | 开发文档总入口 |
| `docs/architecture.md` | 开发者和评审者 | 架构与依赖约束 |
| `docs/development.md` | 贡献者 | 可执行的编码与验证规范 |
| `docs/features/` | 实现者和测试者 | 功能级设计与验收标准 |
| `docs/plans/` | 维护者 | 版本范围、里程碑、风险和退出条件 |
| 根目录 `AGENTS.md` | AI 工具 | 指向 `docs/agents.md` 的最小入口 |

## 更新规则

1. 架构边界发生变化时，同一提交必须更新 `architecture.md`。
2. 功能语义、网络预算或缓存行为变化时，更新相应的 `docs/features/` 文档。
3. 版本范围或里程碑变化时，更新对应的 `docs/plans/` 文档。
4. 用户可见功能、安装方式或兼容范围变化时，更新三个用户 README。
5. 文档描述的是预期行为；如果代码暂未实现，应明确标注目标版本或状态，不能写成已经上线。
