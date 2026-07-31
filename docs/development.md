# 开发规范

本规范适用于人工贡献者和 AI agents。除非版本计划明确说明，新增代码应遵守目标架构，而不是继续扩展旧耦合模式。

## 1. 基本工作流

1. 阅读 [目标架构](architecture.md) 和当前版本计划。
2. 确认工作区现有修改，不覆盖无关改动。
3. 先定义行为、类型和测试，再实现业务逻辑。
4. 修改保持小范围、可审查；迁移与视觉重设计分开进行。
5. 运行与改动风险相称的类型检查、测试和构建。
6. 更新受影响的开发文档或用户文档。

### 1.1 当前本地环境

当前仓库以 Node.js 20（与 CI 一致）和 npm 为基线：

```bash
npm ci
npm run dev
npm run build
```

- `npm run dev` 启动 Vite 开发构建。
- `npm run build` 生成 `dist/rj-warp-gate.user.js`。
- 使用 `npm ci` 验证锁文件，只有明确更新依赖时才运行会修改锁文件的安装命令。
- v1.3.0 已提供稳定的 typecheck/test/lint/build 命令；交付记录必须写明实际执行结果，不能用 Vite 构建代替类型检查或测试。
- `test/harness.html` 与 `test/dlsite-harness.html` 是保留的本地浏览器冒烟夹具：运行 `npm run dev` 后分别模拟论坛页和 DLsite 页。论坛夹具的 `?legacy-mobile=1` 模式用于复现南+缺少 viewport 声明、移动设备仍保留桌面布局视口的场景，`?bottom-anchor=1` 模式用于复现长列表底部点击和桌面弹窗向上展开。它们不属于 Vitest fixture，也不得当作无引用文件删除。

## 2. TypeScript

- v1.3.0 目标是开启 `strict: true`。
- 禁止新增隐式 `any`；外部数据先作为 `unknown` 验证。
- 公共函数参数和返回值必须显式标注。
- 优先使用可判别联合表达状态和错误。
- RJ code、缓存键等容易混淆的字符串使用 branded type 或集中构造函数。
- 不使用非空断言掩盖缺失状态，除非同一作用域内已经完成可证明的校验。
- 禁止把 DOM 节点、Promise 或框架响应式对象写入 GM 存储。

## 3. 模块与依赖

- 遵循 `architecture.md` 的单向依赖。
- 单个模块只承担一个明确职责。
- 不创建新的全局可变对象作为跨模块状态容器。
- 循环依赖视为架构错误，不能通过延迟 import 掩盖。
- UI 文案通过本地化层获取；服务和解析器不得生成面向用户的自然语言。
- 新依赖必须说明必要性、gzip 成本、维护状态和可替代方案。
- 控制器和通用 UI 不得 import 具体资源站 Provider；通过 Provider Registry 和归一化模型访问。
- 新站点特有的选择器、登录判断、请求头、限流和响应解析必须留在对应 Provider 或宿主站点适配器内。
- 只有至少两个 Provider 共同需要的行为才提升到公共协议，避免为假设中的站点提前设计大型插件系统。

## 4. 网络规范

所有网络请求必须经过统一 `HttpClient`：

- 默认超时：交互请求建议 10 秒，后台预取不超过 6 秒。
- 默认不重试非幂等请求。
- 后台预取不重试。
- 所有请求必须处理错误、超时和取消。
- 同查询键的并发请求必须去重。
- 用户操作优先级高于后台预取；如果用户打开正在预取的 RJ，应提升或复用现有请求，而不是新建请求。
- South Plus 搜索必须遵循 [跨标签搜索协调规格](features/southplus-search-coordination.md)：按队列串行启动、间隔至少 10.5 秒、等待最长 60 秒且不自动重试。
- 手动重试只重跑失败或空结果的 Provider，不得重复请求已经成功的独立数据源。
- 禁止使用无限等待循环；队列和锁必须有最大等待时间。
- 不记录完整响应正文、认证信息、Cookie 或可能包含隐私的数据。

## 5. 缓存规范

- 缓存键集中生成，不得在业务模块散落字符串模板。
- 缓存 schema 必须带版本。
- TTL 使用绝对时间戳并对未来异常时间做保护。
- `force` 的语义是绕过目标查询的可复用结果，不代表清空所有缓存。
- 空结果可以缓存，但 TTL 应短于稳定的成功结果。
- 网络错误、超时和解析失败默认不持久缓存。
- 缓存清理必须有批量上限，不能在用户交互路径遍历全部 GM 键。

## 6. 异步状态

- 使用 `idle/loading/success/empty/error`，禁止用多个布尔值组合隐含状态。
- 每次查询必须具备稳定查询键。
- 写回状态前检查 generation 或查询键，旧请求不得覆盖新请求。
- `finally` 只能结束其所属请求的 loading 状态。
- 组件卸载后不得继续写入组件状态。

## 7. DOM 与渲染性能

- South Plus 只允许一个 MutationObserver。
- 同一轮 MutationObserver 记录必须批处理，避免逐记录同步全量扫描。
- 扫描前先做低成本文本或元素筛选。
- 优先使用事件委托，不为每个 RJ 元素重复注册匿名监听器。
- 每个页面的 Preact Root 数量保持固定，不随 RJ 数量增长。
- 读取布局和写入样式分阶段执行，避免循环中交替调用 `getBoundingClientRect()` 和样式写入。
- 移动弹窗不能只依据 layout viewport 宽度判断；南+等无 viewport 声明的旧页面必须结合 `visualViewport`、紧凑横屏和粗指针设备识别。弹窗应限制在实际可视区域内，底部偏移须使用 `position: fixed` 的实际包含块高度：标准模式取排除滚动条槽的 `documentElement.clientHeight`；`document.scrollingElement === document.body` 的 BackCompat/无 doctype 页面若布局宽度相对 visual viewport 明显放大（当前阈值 1.25）则取 `window.innerHeight`，接近 1:1 时取排除横向滚动条槽的 `body.clientHeight`，再结合 `visualViewport.offsetTop` 与 `visualViewport.height` 计算。不能通过新增或改写宿主页面的 viewport meta 解决，也不得在打开时扩大 `documentElement.scrollWidth` 或改变页面缩放。
- South Plus 移动弹窗在页面或 visual viewport 开始滚动时必须关闭，避免 BackCompat 页滚动期间反复修正 fixed 偏移而产生追随运动；桌面锚定弹窗不受该规则影响，弹窗外点击仍应关闭。弹窗收回使用浏览器原生 CSS animation 与 `animationend` 后卸载，保留短超时兜底；`prefers-reduced-motion` 下立即卸载，不引入独立动画组件库。
- South Plus 简版列表的连续 RJ 编号等不可断行标题必须在脚本判定的移动布局类内使用 `overflow-wrap:anywhere` 作为兜底，并限制卡片、正文和标题容器宽度。标题沿用论坛原有约四行高度，通过原生多行截断隐藏额外内容，避免换行文本覆盖作者/回复区域。不得通过给整个页面设置 `overflow-x:hidden` 隐藏问题；目标是让宿主标题本身不再扩大 `scrollWidth`，桌面布局保持原站行为。
- 无 viewport 的手持设备必须直接进入移动底部弹窗；粗指针只以主指针的 `matchMedia('(pointer: coarse)')` 为准，并以浏览器明确的 mobile UA 信号兜底。`navigator.maxTouchPoints` 只能表示设备支持触控，不能单独用来判定手机，否则会把带触摸屏、主指针仍为 fine 且支持 hover 的桌面设备误判为移动端。
- 桌面弹窗在点击点附近翻转时不得用固定预估高度反推 `top`。点击点下方空间不足时应以 `bottom` 锚定并向上自然展开，同时按该侧实际可用空间设置 `max-height`，以兼容系统 DPI 缩放、内容高度变化和长列表滚动位置。
- 动画应支持 `prefers-reduced-motion`。
- 图片默认懒加载；后台 RJ 预取不预取封面图片。

## 8. Preact

- 组件保持纯渲染，副作用进入 Hook 或控制器。
- Effect 必须返回清理函数，或明确证明无需清理。
- 不在 Effect 中无保护地启动不可取消请求。
- 避免在渲染路径创建新的控制器、Observer 或全局监听器。
- 列表 key 使用稳定业务标识，不使用数组索引。
- `preact/compat` 只为明确依赖 React 的第三方库启用。
- CSS 使用 CSS Modules，或集中在只使用 `rwg-` 前缀选择器的样式表；需要覆盖子组件时通过公开 class API，不依赖 Vue `:deep()` 风格。

## 9. 测试

v1.3.0 最低测试层级：

### 单元测试

- RJ code 归一化和拒绝规则。
- DLsite API/HTML 解析。
- South Plus 搜索表单与结果解析。
- 缓存 TTL、schema 和 force 语义。
- 请求去重、超时、取消和旧响应保护。
- 跨标签页限流租约。
- 预取候选选择和网络预算。

### 组件测试

- loading、empty、error、success 状态。
- 弹窗打开、固定、关闭和移动端行为。
- 预取结果被用户打开时正确复用。

### 集成检查

- 生产 userscript 可以构建。
- metadata 中的 match、connect 和 grant 与使用情况一致。
- South Plus 页面不会破坏原链接基本语义。
- DLsite 页面只挂载一次 UI。

测试不得依赖真实 DLsite、South Plus 或 ASMR ONE 网络。使用固定 fixture 和内存 GM 适配器。

## 10. 建议命令

v1.3.0 应在 `package.json` 建立以下稳定命令：

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

CI 至少执行 `typecheck`、`test` 和 `build`。文档提交可以跳过完整发布，但链接和 Markdown 仍需检查。

### CI 与正式发布

- 所有指向 `main` 的 pull request（包括纯 README/资源变更）都必须运行名为 `quality-checks` 的必需状态检查；仓库 Ruleset 应选择该检查。该任务只执行质量检查，不创建或更新 GitHub Release。
- 纯 Markdown/展示资源合并后的 `main` push 可以跳过重复质量任务；包含代码、配置或工作流的普通 `main` push 仍执行质量检查，但不会发布。
- 只有推送与 `package.json` 版本一致的 `v*` tag 才进入正式发布任务；例如 `package.json` 为 `1.3.1` 时，只接受 `v1.3.1`。
- tag 构建通过同一质量任务生成 userscript，并通过短期 workflow artifact 原样交给发布任务，避免发布阶段二次构建。
- 发布任务检测到同名 GitHub Release 已存在时必须明确跳过，不能覆盖既有说明或附件。
- README、Markdown 文档和展示资源变更在 PR 阶段仍执行必需检查；相对链接和三语言一致性还需在本地检查。

## 11. 日志

- 生产构建默认关闭 debug 日志。
- 错误日志包含模块、错误类型和查询键，不输出完整 HTML 或搜索结果正文。
- 开发日志通过单一 logger 控制，禁止在业务模块散落永久 `console.log`。
- 真实 GM 网络故障使用最多 12 条的内存诊断缓冲区；只记录网络错误、超时和非 2xx HTTP 响应，每条记录仅允许包含阶段、请求方式、脱敏后的 origin/path、传输 API、状态和耗时。
- 可复制的诊断信息不得包含 URL 查询参数、请求 headers、POST body、Cookie、认证信息、响应正文或页面内容；缓冲区只存在于当前页面，刷新后清空。

## 12. 文档与发布

- 根 README 面向用户，不写内部架构和 AI 操作说明。
- AI 指令写入 `docs/agents.md`，根 `AGENTS.md` 只负责入口发现。
- 尚未上线的功能必须标记目标版本。
- 版本计划中的任务完成后更新状态和验证记录。
- 用户可见行为变化必须同步三个语言版本 README。
- 发布前检查 userscript 的 `homepageURL`、`supportURL` 与 `package.json` 仓库信息保持一致，并清理不再参与构建、测试、文档或人工冒烟验证的旧快照和重复资源。
- 项目许可证统一使用 SPDX 标识 `GPL-3.0-only`；发布前必须核对根 `LICENSE`、`package.json`、根包 lockfile 字段、userscript `@license` 和三语言 README，且不得改写第三方依赖各自的许可证字段。

## 13. 正式版候选检查

从干净依赖树开始执行完整门禁：

```bash
npm ci
npm run typecheck
npm run lint
npm run test
npm run build
npm audit --omit=dev
npm audit
git diff --check
```

`npm audit --omit=dev` 必须无生产依赖漏洞。完整 `npm audit` 的开发工具链告警需要逐项记录；若上游只提供破坏性升级，不得为了得到零告警而绕过锁文件或引入未经验证的主版本。构建后还必须检查：

- `dist/rj-warp-gate.user.js` 的版本、SHA-256、原始体积和 gzip 体积。
- 产物不含 Vue、Preact debug/devtools 或 `sourceMappingURL`。
- `@match`、`@connect`、`@grant` 与实际站点和 GM 调用一致，不使用 `@connect *`。
- 39 个可导入生产模块均可由 `src/main.ts` 静态到达，`src/types/globals.d.ts` 作为独立环境声明保留；新增删除操作必须重新核对入口和引用链。
- 两份 HTML harness 继续分别覆盖 South Plus 与 DLsite，本地夹具不作为可清理的临时文件。
- 三语言 README 的用户可见行为一致，`docs/` 中不再保留已完成事项的未来式状态。
