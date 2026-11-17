# 架构与模块索引

本文描述当前代码的实际结构（版本 0.17.1），用于新人定位与后续重构。玩法参数与操作说明见 [README](../README.md)，版本变更见 [CHANGELOG](../CHANGELOG.md)。

## 1. 分层边界

项目只有一个场景 `assets/scenes/Facility.scene`。受 Cocos 约束，Scene 根节点不能挂业务组件，启动脚本 `Blackout` 挂在普通子节点 **Game Bootstrap** 上；`tools/test-input.mjs` 用引擎替身专门保护这条约束。

```
assets/scripts/
  ├── 纯 TypeScript（26 个）     不 import 'cc'，可在 Node 中直接加载与测试
  │     ├── 玩法规则            Core / Levels / Operation / Tactical / AimAssist / Heroes
  │     ├── 局外系统            Shop / WeaponMods / LootCases / Backpack / DailyMissions /
  │     │                      CheckIn / Achievements / ClueReader / Tutorial / TutorialGuide
  │     ├── 表现状态            Presentation / AmbientWildlife / FloorDetails / ExitGuide
  │     └── 图集与裁切常量      TrainingArt / ShopArt / CaseArt / BackpackArt /
  │                            CampaignArt / OperationArt
  └── 依赖 Cocos（3 个）
        Art.ts                 Graphics 绘制场景、家具、角色、弹道与粒子
        TutorialGuideArt.ts    教学气泡与操作示意绘制
        Blackout.ts            场景启动、输入、全部 UI、音效、存档与模式状态
```

`Core.ts` 开头明确标注 "Pure gameplay code: no browser or engine dependencies"。纯逻辑层不依赖 DOM、HTML 控件或浏览器专属音频接口，这是同一套玩法代码可用于微信小游戏的前提，也是 `npm test` 能在 Node 中直接 transpile 后运行的原因。

## 2. 完整模块清单

| 模块 | 职责 |
| --- | --- |
| `Core.ts` | 几何与碰撞、射线／视野多边形、门扇扫掠、战斗模拟、声音事件、流场寻路、角色属性、存档读写与 v1→v5 迁移 |
| `Levels.ts` | 宿舍两层、街景、公寓与行动关卡的布局数据、房间／门／敌人分布与按 seed 的生成 |
| `Operation.ts` | 第四章「断翼行动」城市／营地／防守三阶段关卡与增援规则 |
| `Tactical.ts` | 手雷／震撼弹等投掷物、声音传播与几何衰减定义 |
| `AimAssist.ts` | 移动端辅助瞄准意图、目标稳定与快速扫动抑制 |
| `Heroes.ts` | 3 名角色的武器、生命、移速、射速、弹匣与视距配置 |
| `Shop.ts` / `WeaponMods.ts` | 商店商品、武器改装槽位与品质、安装／升级／拆解规则 |
| `LootCases.ts` / `CaseArt.ts` | 开箱奖池、抽取动画进度与图集裁切 |
| `Backpack.ts` / `BackpackArt.ts` | 背包筛选、物品明细与图集裁切 |
| `DailyMissions.ts` / `CheckIn.ts` | 每日任务、活跃度、签到奖励与按本地时间重置 |
| `Achievements.ts` / `ClueReader.ts` | 成就分类与奖励、三条剧情线索目录与阅读器状态 |
| `Tutorial.ts` / `TutorialGuide.ts` / `TutorialGuideArt.ts` | 教学步骤与存档、气泡动画逻辑、Graphics 绘制 |
| `Presentation.ts` | 羽化场、后坐镜头、受击／低血量视觉状态与角色姿态 |
| `AmbientWildlife.ts` / `FloorDetails.ts` / `ExitGuide.ts` | 环境小动物、地面装饰散布、撤离方向指引 |
| `CampaignArt.ts` / `OperationArt.ts` / `TrainingArt.ts` / `ShopArt.ts` | 各页面图集文件名、裁切坐标与显示参数常量 |
| `Art.ts` / `Blackout.ts` | Graphics 绘制原语与场景／UI 控制器（依赖 `cc`） |
| `assets/resources/effects/visibility.effect` | 统一调色、严格动态单位合成、枪口光与屏幕红色渐晕 |

## 3. 运行时状态

- **模式**：`Blackout.ts` 的 `Mode` 是字符串联合类型（首页、章节、选人、成就、任务、签到、战斗、加载、倒地、复活、背包、名册、培养、商店、开箱、招募、设置、帮助、暂停、结算、过场等）。模式切换由 `open(mode)` 统一处理，配合 `readerLayer`、`tutorialPrompt`、`fallTime` 等字段表示叠加状态；目前没有显式状态机，输入冻结由各分支自行判定。
- **存档**：`PROFILE_VERSION = 5`，写入 `sys.localStorage` 的 `blackout.prototype.v1`。键名保持 v1 是兼容性设计，不代表存档格式。`readProfile` 逐版本迁移并清洗脏值：v1 主角更换、v2→v3 保留解锁与培养、v4 退役角色退款与武器补偿、v5 增加新局外系统字段；解析失败回退新档，写入失败给出提示。
- **战斗**：`Battle.update(dt, controls)` 是纯逻辑主循环，`dt` 被钳制在 0–0.05 秒以避免长帧穿透；关卡随机性来自 `Math.random()` 生成的 seed，目前 PRNG 不可注入，浏览器验收脚本通过临时覆盖全局 `Math.random` 造固定场景夹具。
- **资源**：`Blackout` 在 `onLoad` 后由十余个 `load*Art()` 分别加载 `assets/resources/**`，失败时只输出 `console.warn`；README 中说明角色、宿舍素材与视野材质加载完成后才能开始。

## 4. 测试策略

| 层次 | 入口 | 覆盖与局限 |
| --- | --- | --- |
| 纯逻辑回归 | `tools/test.mjs` 及 9 个专项脚本（由 `npm test` 串联） | 用 `typescript.transpileModule` 直接加载真实 TS 源码，覆盖遮挡、碰撞、射击、换弹、存档迁移、养成、结算、教学、线索、辅助瞄准、战术与门交互 |
| 控制器接线 | `tools/test-input.mjs`、`test-clue-final.mjs` 等 | 用不渲染的 Cocos 引擎替身运行真实 `Blackout` 与 `Battle`，检查启动、按钮、键鼠、多指输入、暂停与冻结清理；不替代浏览器渲染 |
| 类型检查 | `npm run typecheck`（`tsconfig.check.json`） | 26 个纯逻辑模块的严格检查；3 个依赖 `cc` 声明的文件由本机 `tsconfig.json`（`extends temp/tsconfig.cocos.json`）负责 |
| CI | `.github/workflows/ci.yml` | Ubuntu + Node 22，`npm ci` → `typecheck` → `npm test`；不跑构建（构建需要 Cocos 编辑器与 Windows PowerShell） |
| 浏览器验收 | 本地一次性 CDP 脚本（未纳入版本库） | 历史上做过桌面与 Android 模拟触摸验收，记录见 `docs/qa/`；截图／日志为本地产物，未入库 |

尚未覆盖：实体手机、微信小游戏真机、性能与帧率一致性、完整真实关卡的端到端通关（浏览器脚本使用固定 seed 与场景夹具）。

## 5. 构建与发布

- `tools/build.ps1` 调用 Cocos Creator CLI，默认本机 3.8.8 安装路径，可用 `COCOS_CREATOR_PATH` 覆盖；退出码 36 视为成功，并避免等待残留 Chromium 进程。
- `config/build-web-mobile.json` 输出横屏 H5 到 `build/web-mobile`；`tools/serve.mjs` 默认只监听 `127.0.0.1:8088`，`--lan` 才开放局域网。
- `config/build-wechatgame.json` 输出微信小游戏，`appid` 需自行填写；未接入登录、广告、支付与云存档。
- `build/`、`temp/`、`logs/`、`library/`、`local/`、`profiles/` 均不入库；克隆后需先 `npm run build` 才能预览。

## 6. 已知技术债

1. `Blackout.ts` 约 4.8k 行、180+ 方法，同时承担场景、资源、输入、全部 UI、音效、存档与过场；建议按 UI 原语／面板构建器／资源注册表／输入状态逐步抽出，并引入显式模式转换表。
2. 关卡随机性依赖全局 `Math.random`，缺少可注入 PRNG 与本局 seed 记录，复现玩家问题较困难。
3. `dt` 采用钳制而非固定步长累加器，低帧率设备上游戏时间会变慢；40 敌人与视野多边形的真机帧率未测。
4. 浏览器 CDP 验收脚本仍散落在本地任务目录，硬编码 Chrome 路径与预览端口，且直接访问控制器私有字段；应迁到 `tools/e2e/` 并提供稳定调试接口。
5. `tools/setup.mjs` 会重写场景与构建配置，仅应在初始化时使用。
