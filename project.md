# 787-10 Flight Deck Simulator · 项目说明

> 本文档基于 commit `597fc6d` 的实际代码整理，描述当前仓库的真实状态。

## 一、项目概况

浏览器端波音 787-10 驾驶舱飞行模拟器，定位为**教学/娱乐性质的简化演示**，不复现真实 787 的认证航电、飞行模型或操作程序。

项目提供两种等价的运行形态：

| 形态 | 入口 | 说明 |
|---|---|---|
| Next.js 应用 | `src/app/page.tsx` | 通过 iframe 嵌入下面的独立页面 |
| 独立静态页 | `public/boeing787-simulator.html` | 单文件自包含，可脱离构建直接双击运行 |

**关键架构特征**：全部模拟器逻辑（物理、渲染、交互）都集中在 `public/boeing787-simulator.html` 这一个 109 行的高度压缩文件里（JS 约 15.5 KB、CSS 约 15.3 KB）。Next.js 侧只是一个 iframe 外壳，`src/app/page.tsx` 仅 5 行。

这意味着：**修改模拟器行为应改 HTML 文件，而不是 `src/` 下的 TypeScript**。

## 二、技术栈

| 项 | 版本/说明 |
|---|---|
| Next.js | 16.4.5（App Router，Turbopack） |
| React | 19 |
| TypeScript | 5.9（严格模式） |
| Tailwind CSS | 4.3.3（配 `@tailwindcss/postcss`） |
| 渲染 | HTML5 Canvas 2D（PFD）+ CSS 变换/SVG（外部视景） |
| 音频 | Web Audio API（警报音，无外部音频文件） |
| 包管理 | pnpm（仅此一种，npm/yarn 会被钩子拒绝） |

无后端、无数据库、无第三方运行时依赖 —— `dependencies` 只有 next / react / react-dom。

## 三、运行方式

```bash
pnpm install
pnpm dev          # 开发模式，端口由 package.json 的 dev 脚本指定
pnpm build        # 生产构建
pnpm start        # 生产启动
```

独立版可直接用浏览器打开 `public/boeing787-simulator.html`，无需任何服务。

> ⚠️ 升级 Next.js 版本后必须停掉旧 dev server 并删除 `.next` 缓存，否则会出现
> `TypeError: routeModule.ensureInstrumentation is not a function` 导致全站 500。

## 四、目录结构

```
project/
├── public/
│   ├── boeing787-simulator.html   ← 模拟器本体（109 行，自包含）
│   ├── outside-scene.svg          ← 外部地景（山峦/田野/城市/道路）
│   └── images/
│       └── img_20261023_140214_842035.jpg   ← 早期原型遗留图，当前未被引用
├── src/
│   ├── app/
│   │   ├── page.tsx               ← 5 行，仅渲染 <FlightDeckFrame />
│   │   ├── layout.tsx             ← 根布局，lang="zh-CN"，dark 类
│   │   ├── globals.css            ← 设计令牌 + flight-deck-* 外壳样式
│   │   └── menu-structure.json    ← 菜单结构（单路由 "/"，群体"飞行员"）
│   ├── components/
│   │   ├── FlightDeckFrame.tsx    ← iframe 外壳 + "打开独立版"链接
│   │   └── AttitudeIndicator.tsx  ← ⚠ 死代码（230 行）
│   ├── hooks/
│   │   └── useFlightSimulation.ts ← ⚠ 死代码（158 行）
│   └── lib/
│       ├── flight-physics.ts      ← ⚠ 死代码（126 行）
│       ├── autopilot.ts           ← ⚠ 死代码（183 行）
│       ├── keyboard-handler.ts    ← ⚠ 死代码（74 行）
│       └── types.ts               ← ⚠ 死代码（65 行）
├── README.md                      ← 英文简要说明
└── project.md                     ← 本文档
```

### 死代码说明（836 行）

`src/lib/*`、`src/hooks/useFlightSimulation.ts`、`src/components/AttitudeIndicator.tsx` 这 6 个文件**互相引用形成闭环，但没有任何页面或组件引用它们**（`page.tsx` 只用 `FlightDeckFrame`）。

它们是早期版本的实现（能量法物理模型 + PID 自动驾驶 + 方形 Canvas 姿态仪），在 commit `597fc6d` 重构为 iframe 架构后失去入口。目前仍会被 TypeScript 编译检查（构建能通过），但对运行时无任何影响。

**建议**：确认不再需要后删除，可减少 836 行维护负担。

## 五、详细功能列表

### 5.1 顶栏（topbar）

| 功能 | 元素 | 说明 |
|---|---|---|
| 品牌标识 | `.brand` | "NIGHT DECK / 787-10" + "SIMULATED FLIGHT SYSTEMS" |
| 本地时钟 | `#clock` | 实时显示 `LOCAL HH:MM:SS`（en-GB 24 小时制） |
| 昼夜主题 | `#themeBtn` | 切换 `.app.day` 类，`☼ DAY` / `☾ NIGHT`，带 `aria-pressed` |
| 暂停/继续 | `#pauseBtn` | `Ⅱ PAUSE` / `▶ RESUME`，冻结物理推进 |
| 重置 | `#resetBtn` | 全部状态归零（见 5.9） |
| 全屏 | `#fullBtn` | Fullscreen API 切换 |

### 5.2 外部视景（viewport）

| 图层 | 元素 | 行为 |
|---|---|---|
| 天空 | `.sky` | 渐变背景，随俯仰/滚转做 `translateY` + `rotate`（CSS 变量 `--pitch`/`--bank`，0.08s 线性过渡） |
| 地景 | `.outside-scene` | 引用 `outside-scene.svg`，随航向做水平平移（`--scene-x`，正弦映射 ±80px），随高度下移并缩小（`--scene-y`/`--scene-scale`） |
| 云层 | `.cloud-layer` | 高度 >1800ft 开始渐显，7000ft 内线性增至 0.92 不透明度；4 组径向渐变云团 + 36s 漂移动画 |
| 跑道 | `.runway` | 透视梯形（`clip-path`）+ 双边线 + 中线虚线；高度 >2200ft 完全淡出 |
| 高空模式 | `.sky.high-altitude` | 高度 >8000ft 时地景降至 0.22 不透明度并模糊去饱和，云层增强至 0.98 |
| 舷窗效果 | `.window-glow` / `.window-frame` | 径向暗角 + 16px 边框模拟驾驶舱窗框 |
| 准星 | `.crosshair` | 中心固定十字准星 |
| HUD | `.hud` | 飞行模式 chip（`ON GROUND` / `AUTOPILOT` / `MANUAL FLIGHT`）+ 绿色状态点 + SIM 计时 `MM:SS` |
| 视景标签 | `.view-label` | `RUNWAY`（<40ft）/ `CLIMB`（<3000ft）/ `CRUISE` |

昼夜主题会同步改变天空渐变、云层、舷窗反光、HUD 配色。

### 5.3 主飞行显示器 PFD（Canvas `#pfd`）

单一 canvas 绘制三合一布局，`getBoundingClientRect()` + `devicePixelRatio` 做高清适配，每帧重绘。

| 区域 | 内容 |
|---|---|
| 左带 | **IAS 空速带**：每 20kt 一刻度，随空速滚动（27px/20kt），顶部大字读数，中心带青色边框数字框 |
| 右带 | **ALT 高度带**：每 500ft 一刻度，随高度滚动，同上结构 |
| 中央 | **姿态仪**：天空 `#3b7296` / 地面 `#9c8a67` 分色，随 bank 旋转、随 pitch 平移；俯仰刻度每 5°（每 10° 加长并标数字，±30° 范围）；黄色飞机符号（`#ffd769`）随姿态移动 |
| 固定符号 | 青色（`#50d7ff`）飞机参考符号叠加在姿态仪上，不随姿态动 |
| 底部左 | `HDG nnn` 航向读数 |
| 底部右 | `±nnnn FPM` 垂直速度（青色/琥珀色区分） |

姿态仪区域用 `clip()` 限制在中央带内，两侧刻度带独立绘制背景遮罩。

### 5.4 警报系统（alert-strip）

三级视觉状态：默认（绿）/ `.warn`（琥珀）/ `.danger`（红），危险级文字转粉红。

**触发条件与告警项**：

| 告警 | 条件 | 级别 |
|---|---|---|
| `ALL ENGINES OFF` | 双发均关且 IAS > 20 | danger |
| `ENG FAILURE` | 单发关闭且 IAS > 100 | warn |
| `STALL` | IAS < 失速速度（`125 + flap×0.6`）且 ALT > 100 | danger |
| `OVERSPEED` | IAS > 340 | warn |
| `GPWS · SINK RATE` | 100 < ALT < 900 且 VSI < -600 | danger |
| `ALTITUDE DEVIATION` | AP 接通且 \|ALT − 目标\| > 50 | warn |

多条告警用 `·` 拼接同时显示。

**正常状态提示**（无告警时）：
- 反推激活 → `REVERSERS ACTIVE · Advance THRUST to increase simulated braking`
- 地面 → `SYSTEMS NOMINAL · Advance throttles to begin takeoff`
- AP 接通 → `AUTOPILOT ENGAGED · Holding captured targets`
- 手动 → `MANUAL FLIGHT · Monitor speed and altitude`

**音效**：Web Audio API 合成方波警报（740Hz → 560Hz，0.25s，指数包络），仅在告警内容**发生变化**时触发（`lastAlert` 去重）。首次 `pointerdown` 解锁 AudioContext（规避浏览器自动播放策略）。

另有 `flashAlert()` 用于操作被拒绝时的临时提示（2.5s 后恢复），如 AP/反推互锁。

### 5.5 飞行控制面板（FLIGHT CONTROLS）

| 控件 | 类型 | 说明 |
|---|---|---|
| THRUST | range 滑块 0–100 | 可拖动，`touch-action: pan-x` 支持触摸；与 W/S 键双向同步 |
| FLAPS | 7 档分段按钮 | 0 / 5 / 10 / 15 / 20 / 25 / 30，激活档高亮 |
| GEAR | 切换按钮 | `▾ GEAR DOWN` / `▴ GEAR UP` |
| REVERSERS | 切换按钮 | 反推，带互锁条件（见 5.8）；不满足条件时按钮 `disabled` |
| AP | 切换按钮 | `AP OFF` / `AP ON` |

### 5.6 引擎监控（ENGINE MONITOR · GE NX-1B SIM）

双发对称布局，每发包含：

| 项 | 实现 |
|---|---|
| N1 圆形仪表 | `conic-gradient` 画刻度环（58% 起琥珀、79% 起红区），指针 `rotate(-47 + n1×1.18 deg)` |
| N1 数字 | 百分比读数 |
| EGT | `20 + N1 × 5.25` °C |
| FF 燃油流量 | `N1 × 0.083` |
| 状态标签 | `RUN` / `OFF` |
| 启动按钮 | `1 · ENGINE 1 OFF/ON`，激活时 `.on` 类 |

N1 用一阶惯性响应（`lerp` + `1-exp(-dt×k)`），启动时 k=2.4、关机时 k=3.5，因此有关车转速衰减过程。EGT 同样惯性跟随（k=2.2）。

### 5.7 自动驾驶（AP + MCP 面板）

**接通条件**（全部满足）：双发运行 + IAS > 150 kt + ALT > 1000 ft。
不满足时拒绝并提示 `AP INHIBIT · Engines ON, IAS > 150 kt, altitude > 1000 ft required`。

**接通瞬间捕获当前状态为目标**：IAS 取整到 5 的倍数（限 150–330）、ALT 取整到 500（限 1000–45000）、HDG 取整。

**MCP 旋钮面板**（`AUTOPILOT MCP`）：

| 旋钮 | 步进 | 范围 | 显示 |
|---|---|---|---|
| HEADING | ±5° | 0–359（环形） | `nnn°` |
| IAS | ±5 kt | 150–330 | `nnn kt` |
| ALT | ±500 ft | 1000–45000 | `nnnnn ft` |

每个旋钮有两种操作方式：点击圆形旋钮面（`knob-face`，带指针旋转动画 `--dial-angle`）或下方 `−` / `+` 步进按钮。AP 断开时整组 `aria-disabled="true"` 且按钮 `disabled`，显示 `—`。

**控制律**：
- **速度**：估算当前阻力 → 由速度误差算请求加速度（限 ±12）→ 反解目标功率 → 油门一阶跟随（k=1.8）
- **高度**：`pitchTarget = (目标ALT − 当前ALT)×0.0015 − VSI×0.00035`，限 −3°~+8°，一阶跟随（k=1.8）
- **航向**：`hdgError` 经 ±180° 归一化 → `bank = clamp(hdgError×0.8, −25, 25)`，一阶跟随（k=1.3）
- **保护覆盖**：失速时强制 `pitchTarget ≤ −2`（推头）；IAS > 340 时强制 `pitchTarget ≥ 3`（拉杆）

**状态显示**：
- `NAV / SYSTEMS` 面板：AP STATUS（`CMD / ACTIVE` / `DISENGAGED`）、CAPTURED（`IAS nnn · ALT nnnn · HDG nnn`）
- `FMA` 面板：THRUST（`IDLE` <5% / `THRUST` / `TOGA` >85% / `REVERSE`）、VERTICAL（`SPEED` / `ALT HOLD`）、LATERAL（`HDG` / `HDG HOLD`）
- HUD 飞行模式 chip 显示 `AUTOPILOT`

### 5.8 反推（REVERSERS）

**接通条件**（全部满足）：ALT < 40 ft + 起落架放下 + 双发运行 + AP 断开。
不满足时提示 `REV INHIBIT · Ground, gear down, both engines running, AP off required`。

**效果**：推力反向为 `−thrust × 0.72`，用于落地滑跑减速。

**自动解除**：ALT ≥ 40 ft、或收起落架、或接通 AP，任一发生立即关闭反推。

按钮可用性实时联动：`disabled = !reverse && !(满足接通条件)`。

### 5.9 其他状态与系统

| 项 | 说明 |
|---|---|
| 飞机状态面板 | IAS / ALTITUDE / VERTICAL SPEED / HEADING / ATTITUDE·BANK 实时读数 |
| 燃油 | 初始 94.8 t，消耗率 `ePower × 0.012 × dt`，最低 0 |
| SIM 计时 | HUD 内 `MM:SS`，暂停时冻结 |
| 快速指南 | 内置键位表 + 中文免责声明 |
| 暂停 | `sim.running=false`，`physics()` 直接 return，但渲染与 UI 继续（画面冻结而非黑屏） |
| 重置 | 全部状态归零：IAS/ALT/VSI=0、HDG=360、pitch/bank=0、throttle=0、flaps=0、gear=down、AP=off、reverse=off、fuel=94.8t、双发 OFF、警报清空、计时归零、暂停按钮复位 |

### 5.10 输入处理

**键盘**（`keydown`）：

| 键 | 动作 | 增量 |
|---|---|---|
| `1` / `2` | 启动/关闭引擎 1 / 2 | 切换 |
| `W` / `S` | 油门增减 | ±2% |
| `↑` / `↓` | 俯仰 | ±0.7°（限 −12~+15） |
| `←` / `→` | 坡度 | ±2°（限 −35~+35） |
| `[` / `]` | 襟翼收/放 | 沿 7 档位移动 |
| `P` | 自动驾驶 | 切换（带互锁） |
| `R` | 反推 | 切换（带互锁） |
| `Space` | 暂停/继续 | 切换 |

**输入冲突规避**（处理得比较细致）：
- 焦点在 `TEXTAREA`/`SELECT`/可编辑元素/非 range 的 `INPUT` 时不拦截
- `Ctrl`/`Meta`/`Alt` 组合键不拦截（保留浏览器快捷键）
- 焦点在 `BUTTON` 上时的 `Space`/`Enter` 不拦截（保留按钮原生激活行为）
- 仅对已识别的键调用 `preventDefault()`，其余键放行
- 任意有效按键会触发 `unlockAudio()`

**指针/触摸**：油门滑块可拖动、襟翼与 AP 旋钮可点击、所有按钮可点，`touch-action` 已适配移动端。首次 `pointerdown` 解锁音频。

### 5.11 响应式布局

| 断点 | 变化 |
|---|---|
| > 980px | 主区双列（视景 `1fr` + 侧栏 310px），底部三列 |
| ≤ 980px | 主区单列，侧栏转 2 列网格，底部 2 列，末面板跨列 |
| ≤ 620px | 顶栏压缩至 58px、隐藏时钟与副标题、全屏按钮图标化、视景高度改 67vw、舷窗边框减至 10px、侧栏与底部改纵向堆叠、字号整体下调 |

## 六、物理模型

采用**简化经验公式**，非真实气动建模：

```
失速速度   = 125 + flap × 0.6                     (kt)
阻力       = IAS×0.018 + IAS²×0.00032 + flap×0.65 + (gear ? IAS×0.012 : 0)
推力       = (Σ N1/100 ÷ 2) × 240
加速度     = (推力 − 阻力) × 0.12
IAS        = clamp(IAS + 加速度×dt, 0, 390)
爬升量     = pitch×95 + max(0,推力)×0.38 + flap×0.7×2.2
             − (失速 ? 58 : 0) − (IAS>340 ? 30 : 0) − (gear且ALT>80 ? 8 : 0)
VSI        = lerp → 爬升量 × 12                   (fpm，一阶惯性 k=1.7)
ALT        = clamp(ALT + VSI/60×dt, 0, 45000)
航向       = (HDG + bank×0.11×dt) mod 360
```

所有一阶惯性用 `lerp(a, b, 1 − exp(−dt×k))` 实现，保证帧率无关。
`dt` 上限 0.05s（防切后台后大步长跳变）。

## 七、已知问题

以下为实测发现，均不影响可运行性：

| # | 问题 | 现象 | 成因 |
|---|---|---|---|
| 1 | 地面静止时 VSI 显示负值 | 停机状态 VSI ≈ −569 fpm | IAS=0 低于失速速度 125，触发 `−58` 失速惩罚项；ALT 已被 clamp 在 0 不会真下降，但仪表读数不真实 |
| 2 | 加速/爬升偏快 | 约 4.5s 离地，10s 到 264kt，243ft 高度即达 367kt 触发 OVERSPEED | 经验公式推力/阻力比例未按真实 787 标定（真实滑跑约 30s、离地 150–160kt） |
| 3 | 高度偏差告警过敏 | AP 接通后实际仅偏差约 50ft 却持续报 `ALTITUDE DEVIATION` | 阈值设为 `>50` ft，与 AP 实际控制精度同量级 |
| 4 | 死代码 836 行 | `src/lib/*`、`src/hooks/*`、`AttitudeIndicator.tsx` 无引用入口 | `597fc6d` 重构为 iframe 架构后遗留 |
| 5 | 遗留图片未引用 | `public/images/img_20261023_140214_842035.jpg`（166,595 bytes） | 早期原型背景图，现已被 `outside-scene.svg` 取代 |
| 6 | 构建期 MODULE_TYPELESS 警告 | `next.config.js` / `postcss.config.js` 被当 CJS 重新解析 | `package.json` 缺 `"type": "module"`，仅性能提示，不影响产物 |

## 八、验证记录

`597fc6d` 已通过的验证：

- **构建**：`pnpm build` 成功，TypeScript 严格模式无错误，静态页面生成正常
- **服务**：`/`、`/boeing787-simulator.html`、`/outside-scene.svg`、`/images/*.jpg` 全部 HTTP 200
- **首页结构**：iframe 正确指向 `/boeing787-simulator.html`，`flight-deck-shell` / `flight-deck-frame` / `flight-deck-open` 类齐全
- **JS 实跑**（mock DOM 环境执行真实脚本）：
  - IIFE 执行无异常，主循环正常排帧
  - 引擎启动 / 襟翼 / 油门 / 起落架响应正常
  - 成功离地并爬升至 1503 ft
  - AP 接通条件校验生效，接通后捕获 `IAS 320 · ALT 1500 · HDG 000`
  - FMA 正确显示 `ALT HOLD` / `HDG HOLD`
  - AP 保持高度 15 秒偏差 50 ft
  - 暂停功能冻结状态、重置功能完整归零
  - PFD 持续重绘（2518 帧，累计 76416 次 fillText）

## 九、版本历史

| Commit | 作者 | 时间 | 内容 |
|---|---|---|---|
| `74f2674` | VibeCoder | 2026-11-21 16:13 UTC | 初版：Next.js 驾驶舱 + 独立 HTML，能量法物理模型、PID 自动驾驶、方形 Canvas 姿态仪 |
| `597fc6d` | Codex | 2026-11-22 00:36 +0800 | **重构**：改为 iframe 架构，HTML 压缩至 109 行自包含；新增 SVG 外部视景、云层、跑道、昼夜主题、暂停/重置/全屏、反推、AP MCP 旋钮面板、音效警报、FMA、燃油消耗、响应式与触摸支持；净删除 1428 行 |

`597fc6d` 用经验公式物理模型替换了 `74f2674` 的能量法模型，前者功能面更广但物理真实度更低。

## 十、远程仓库

https://github.com/hongzenghuang/zhengyang787 （分支 `main`）
