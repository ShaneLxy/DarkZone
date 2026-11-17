# 变更日志

本文件记录可核实的版本与工程变更。早期逐版说明见 `docs/release-0.2.md` ~ `docs/release-0.9.md`、`docs/art-prompts-*.md` 与 `docs/qa/验收记录.md`。

> 说明：项目从 0.1 迭代到 0.17 期间未持续维护逐版变更记录，`docs/` 中的发布说明止于 0.9。下面对 0.10–0.17 只按**当前源码与文档中可确认的功能模块**汇总，不推测具体版本号、日期或改动顺序；逐版细节以本次建立 Git 历史之后的提交记录为准。

## [0.17.1] - 2026-11-17 — 工程基线版

本次只改工程配置、测试依赖与文档，**未改动任何玩法逻辑、关卡数据、数值或存档格式**。

### Added
- `.gitignore` / `.gitattributes` / `LICENSE`（MIT）。忽略浏览器缓存目录、构建产物、IDE 历史与本机日志；标记二进制资源。
- `tsconfig.check.json`：不依赖 Cocos 生成声明的严格类型检查配置（覆盖 26 个纯逻辑模块）。
- `npm run typecheck`、`npm run check`、`npm run dev`；`devDependencies` 加入 `typescript`，`engines` 要求 Node ≥ 20.11。
- `.github/workflows/ci.yml`：干净的 Ubuntu + Node 22 环境自动执行 `npm ci`、类型检查与全量回归。
- `docs/ARCHITECTURE.md`（分层、模块清单、状态、测试与平台边界）、本 CHANGELOG、`docs/qa/`（历史验收资料归档）。
- `package.json` 补 repository / bugs / homepage / license 元数据，接入 GitHub 仓库 `ShaneLxy/DarkZone`。

### Changed
- 10 个 `tools/test*.mjs` 改为从项目 `devDependencies` 加载 TypeScript，不再依赖 `E:/cocos/Creator/3.8.8` 中的编译器；换机器与 CI 可直接运行 `npm test`。
- README 与源码对齐：版本 0.17.1、四章战役、3 名角色（凛／幽灵／维川）、存档内部版本 v5 与迁移规则、推荐招募规则、视距与后坐力参数、代码位置按层索引、构建与检查命令、构建产物不入库。
- 清理本地一次性浏览器缓存目录（约 76 个 Chrome profile、5 万余文件），保留并归档验收文档与教程截图；根目录散落图片移入 `docs/art-review/`。

## [0.10 – 0.17] — 功能汇总（逐版记录缺失）

按当前源码与文档可确认的内容：

- **章节**：在第一章「静默宿舍」、第二章「归途」之外增加第三章「归巢」（公寓应急供电、直达电梯）与第四章「断翼行动」（前传，城市／营地／防守三阶段、空中支援、据点防守）。
- **局外系统**：商店与武器改装（槽位、品质、升级、拆解）、开箱与奖池、背包筛选、每日任务与活跃度、连续签到、成就与奖励、剧情线索阅读器、角色培养与装备配置。
- **战斗与表现**：辅助瞄准与 AUTO 自动开火、投掷物与声音传播调查、门扇受控转轴与强开、严格视野遮罩与羽化、枪口光／后坐／受击／低血量反馈、翻滚与倒地帧、环境生物与地面装饰。
- **教学**：首次进入真实二楼宿舍的四步教学、跳过与重播、步骤存进存档、纯 Graphics 绘制的操作示意气泡。
- **存档**：从 v3 演进到 v5，逐版本迁移并清洗脏值，键名保持 `blackout.prototype.v1`。
- **验收**：历史上以 `npm test`、指定 `tsc`、Web Mobile 构建与 Chrome CDP 桌面／Android 模拟触摸逐轮验收；详见 `docs/qa/验收记录.md`。模拟环境不等于实体手机或微信真机。
