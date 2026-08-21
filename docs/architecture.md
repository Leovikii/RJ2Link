# 目标架构

状态：v1.3.0 架构、迁移和发布候选验证已完成；v1.3.1 沿用本架构，不改变模块边界。

## 1. 重构目标

v1.3.0 先解耦业务核心，再把 Vue UI 迁移到 Preact。重构没有逐文件翻译旧组件，而是解决了以下问题：

- GM API、网络请求、缓存和 UI 状态相互耦合。
- 请求缺少统一超时、取消、去重和结构化错误。
- 全局响应式状态容易被并发请求和旧响应覆盖。
- 站点 DOM 解析、应用流程和 UI 生命周期边界不清楚。
- 核心模块缺少严格类型和可替换的测试接口。
- South Plus 全页面扫描和逐节点事件绑定存在性能优化空间。

## 2. 架构原则

### 2.1 单向依赖

允许的依赖方向如下：

```text
entrypoints / site adapters / Preact UI
                    ↓
             application controllers
                    ↓
              domain services
                    ↓
       infrastructure ports and adapters
```

禁止下层模块反向引用上层：

- `domain` 不得引用 Preact、DOM、GM 全局变量或具体网站页面。
- `services` 不得引用 Preact 组件或页面挂载逻辑。
- `infrastructure` 实现端口，但不得控制 UI 状态。
- `ui` 不得直接调用 `GM_xmlhttpRequest`、解析远端 HTML 或拼接缓存键。
- `sites` 负责页面识别和 DOM 增强，不负责业务缓存和远端数据合并。

### 2.2 框架无关核心

除 `src/ui/` 和 Preact 挂载入口外，其他模块不得依赖 `preact`、`preact/hooks` 或 `preact/compat`。未来替换 UI 框架时，领域模型、服务、解析器、缓存和网络层应保持不变。

### 2.3 端口与适配器

外部能力通过接口暴露：

```ts
export interface HttpClient {
  request<T>(request: HttpRequest): Promise<HttpResponse<T>>;
}

export interface KeyValueStorage {
  get<T>(key: string, fallback: T): Promise<T>;
  set<T>(key: string, value: T): Promise<void>;
  delete(key: string): Promise<void>;
  list(): Promise<string[]>;
}
```

生产环境使用 Tampermonkey 适配器，测试使用内存适配器。业务模块不得判断 `typeof GM_getValue`。

## 3. 实际目录

```text
src/
├─ application/       # 控制器与预取编排
├─ common/            # 主题等跨站能力
├─ config/            # 本地化配置
├─ domain/            # RJ、作品、错误与查询状态
├─ infrastructure/    # cache、coordination、GM、HTTP、logging、storage
├─ providers/         # DLsite、South Plus、ASMR ONE 数据来源
├─ services/          # Provider 协议与显式注册表
├─ sites/             # South Plus、DLsite 宿主适配器
├─ types/             # userscript/浏览器环境声明
├─ ui/                # Preact 组件、Hook、站点应用与统一样式
└─ main.ts
```

生产入口静态可达性审计覆盖 `src/` 的 39 个可导入生产模块（另有一个 `src/types/globals.d.ts` 环境声明文件），39 个均可由 `src/main.ts` 到达，没有遗留的不可达生产模块。

## 4. 领域模型

### 4.1 RJ code

RJ code 必须经过单一解析函数归一化，禁止各模块分别调用正则和 `toUpperCase()`：

```ts
export type RjCode = string & { readonly __brand: 'RjCode' };

export function parseRjCode(input: string): RjCode | null;
```

该函数负责支持范围、大小写、长度和前缀校验。缓存键、请求参数和 UI 状态只接受归一化后的 `RjCode`。

### 4.2 查询状态

异步查询使用可判别联合，不使用多个可能冲突的布尔值：

```ts
export type QueryState<T> =
  | { status: 'idle' }
  | { status: 'loading'; previous?: T }
  | { status: 'success'; data: T }
  | { status: 'empty' }
  | { status: 'error'; error: AppError };
```

“没有资源”“作品不存在”和“网络失败”是不同状态。

### 4.3 错误模型

错误至少区分：

- `network`
- `timeout`
- `aborted`
- `http`
- `not-found`
- `unauthorized`
- `rate-limited`
- `parse`
- `invalid-data`

底层保留调试信息，UI 使用本地化后的用户消息。禁止通过匹配自然语言字符串判断错误种类。

## 5. 网络与查询层

统一请求层必须提供：

- 默认超时和每请求覆盖。
- `onerror`、`ontimeout`、`onabort` 的一致结算。
- HTTP 状态校验。
- JSON/HTML 解析错误包装。
- 请求取消句柄或等价机制。
- 可配置但默认关闭的重试。
- 调试日志脱敏。

查询服务在请求层之上提供：

- 按规范化查询键进行 in-flight Promise 去重。
- 内存缓存和 GM 持久缓存。
- `force` 明确绕过缓存，但仍可复用同一个强制请求。
- 请求序号或 generation，阻止旧响应覆盖新状态。
- 针对预取与用户操作的不同优先级。

## 6. 缓存

缓存键只能由 `cache-keys.ts` 生成：

```ts
cacheKeys.work(rjCode, locale);
cacheKeys.southPlus(rjCode, domain);
cacheKeys.asmrOne(rjCode);
cacheKeys.linkage(rjCode, languages);
```

缓存记录包含：

```ts
interface CacheEntry<T> {
  schemaVersion: number;
  createdAt: number;
  expiresAt: number;
  value: T;
}
```

缓存要求：

- 强制刷新只处理目标查询，不扫描和清理所有无关键。
- 正常读取可以顺便删除当前键的过期值。
- 全量过期清理只能在空闲阶段进行，并限制每次处理数量。
- 不持久化进行中的 Promise、DOM 节点或框架响应式对象。

## 7. 应用控制器

控制器协调服务并向 UI 暴露状态，但不渲染 DOM。控制器需要支持：

- `subscribe()` / `getSnapshot()`。
- `load(rjCode)`。
- `refresh(rjCode)`。
- `prefetch(rjCode)`。
- `dispose()`。

Preact Hook 通过订阅控制器获得快照。组件不维护服务层的重复副本状态。

### 7.1 Provider 扩展协议

为了支持未来接入更多元数据站点、论坛和资源站，应用层依赖能力协议而不是具体站点类：

```ts
export interface MetadataProvider {
  readonly id: string;
  supports(code: RjCode): boolean;
  getWork(code: RjCode, context: QueryContext): Promise<WorkSummary>;
  isWorkCached?(code: RjCode): Promise<boolean>;
  prefetchWork?(code: RjCode, context: QueryContext): Promise<void>;
}

export interface ResourceProvider {
  readonly id: string;
  readonly displayName: string;
  supports(code: RjCode): boolean;
  search(code: RjCode, context: QueryContext): Promise<ResourceResult[]>;
}
```

Provider Registry 负责注册和按能力选择 Provider。控制器只遍历 Registry 返回的 Provider，不直接 import DLsite、South Plus 或 ASMR ONE 实现。

扩展边界保持克制：

- 通用协议只包含至少两个站点会复用的概念。
- 站点登录、表单、限流、URL 和 HTML 解析保留在具体 Provider 内部。
- 通用 UI 渲染归一化后的 `WorkSummary`、`ResourceResult` 和 `ProviderStatus`。
- 某站点的专有字段进入 `metadata` 扩展对象，不能污染所有 Provider 的必填接口。
- 新站点接入原则上只需新增 Provider、fixture、注册项和必要的 userscript metadata 权限。
- Provider 注册必须显式完成，不采用运行时扫描目录或动态执行第三方代码。

`sites/` 与 `providers/` 职责不同：`sites/` 表示脚本当前注入的宿主网页，负责 DOM 和挂载；`providers/` 表示数据来源，可以在任意宿主页面被查询。一个网站可以同时是宿主适配器和数据 Provider，但两部分代码仍需分离。

### 7.2 扩展性评估

当前抽象已经足够支撑近期新增站点，不再为 v1.3.0 增加大型插件框架：

- 新资源站只需实现 `ResourceProvider`、注册到 `ProviderRegistry`，通用 DLsite 结果 UI 会按 Provider 名称和查询状态渲染。
- 新元数据来源实现 `MetadataProvider`；站点特有字段放入 `WorkSummary.metadata`，只有稳定复用的字段才提升为领域字段。
- 新宿主网站在 `sites/<site>/` 实现 DOM 适配器，再在入口显式选择；宿主适配器不能兼任远端数据服务。
- Provider 的登录、Cookie、URL、限流和解析均留在自身目录，不能进入 Registry 或通用控制器。

暂不引入动态插件发现、依赖注入容器或通用 `SiteAdapter` 注册表。只有出现第三个宿主站点、且入口分派和生命周期代码确实重复时，再提取宿主适配器协议；这避免为尚不存在的需求增加运行时和维护成本。

## 8. Preact UI

### 8.1 技术选择

- `preact`
- `@preact/preset-vite`
- TypeScript TSX
- CSS Modules 或单一 `rwg-` 命名空间样式表
- Vitest
- Testing Library

默认不引入 Redux、MobX、Zustand、路由器或大型组件库。确有第三方 React 依赖时才使用 `preact/compat`。

### 8.2 挂载模型

- South Plus 页面只挂载一个弹窗 Root。
- DLsite 页面挂载一个悬浮入口 Root，弹窗可位于同一应用树中。
- 不为每个 RJ 文本创建 Preact Root。
- RJ 文本增强继续由站点适配器和事件委托完成。
- Root 卸载时必须释放控制器订阅、Observer、事件和定时器。

### 8.3 样式

Vue scoped CSS 迁移到 CSS Modules，或集中到仅使用 `rwg-` 前缀选择器的单一样式表。宿主网站可能定义广泛的标签样式，因此组件样式不得依赖浏览器默认值。Shadow DOM 作为后续增强选项，不作为 v1.3.0 的强制条件。

## 9. 站点适配器

South Plus 适配器负责：

- 判断支持的域名和页面。
- 扫描与归一化 RJ code。
- 使用事件委托打开弹窗。
- 批处理 MutationObserver 记录。
- 启动符合预算的 RJ 元数据预取。

DLsite 适配器负责：

- 从 URL 提取 RJ code。
- 创建和销毁 Preact Root。
- 处理站点内导航导致的 RJ code 变化。

适配器不得自行获取作品详情；它只能调用应用控制器。

## 10. 已完成的迁移顺序

1. 补齐类型、测试和 GM 端口。
2. 将网络、缓存、限流和纯解析器迁出 Vue 代码。
3. 建立框架无关控制器并通过过渡适配器接入旧 UI。
4. 引入 Preact 并迁移共享组件。
5. 迁移 DLsite UI。
6. 迁移 South Plus UI。
7. 删除 Vue、旧 store、兼容桥接层和迁移期类型残留。

v1.3.0 发布候选只包含 Preact runtime；生产依赖、Vite 配置、源码和构建产物均没有 Vue runtime 或 Vue 构建插件。

## 11. Vue → Preact 性能与成本审计

| 指标 | v1.2 基线 | v1.3.0 RC | 变化 |
| --- | ---: | ---: | ---: |
| userscript 原始体积 | 约 314 kB | 130.14 kB | 约 -58.6% |
| gzip 体积 | 约 75.9 kB | 35.67 kB | 约 -53.0% |

主要收益：Vue runtime 已完全移除；每页 Root 数量固定，不随 RJ 数量增长；South Plus 以事件委托替代逐 RJ 监听器，并用一个 MutationObserver 批处理新增节点；控制器、Provider、缓存和网络层保持框架无关；请求去重、取消、超时和 generation 保护减少重复工作及旧响应覆盖。

主要成本与权衡：分层控制器和诊断能力增加了少量对象分配与维护代码；单文件 userscript 会静态包含两个站点适配器，因此每个页面都会解析当前页面用不到的另一套适配器代码，考虑到 userscript 不能可靠拆成按需 chunk，v1.3.0 不为此引入动态加载复杂度；South Plus 初次挂载仍需一次完整 TreeWalker 扫描，后续才转为增量批处理；最多两个 DLsite 元数据预取会增加受预算控制的后台请求；移动视口兼容增加固定数量的 resize、orientation 和 visualViewport 监听器，但都不随 RJ 数量增长。

本地浏览器夹具在 Vite 开发模式下的冷加载 trace 为 LCP 66 ms、CLS 0.0003、最长关键请求链 76 ms，DevTools 估算可节省 0 ms，没有发现初始化主线程或布局瓶颈。该 trace 包含 HMR、Preact debug/prefresh 和未打包模块，只用于验证交互初始化，不代表生产 userscript 的网络依赖成本；生产性能以构建体积、固定 Root/监听器数量和请求预算为主要基线。
