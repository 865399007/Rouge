# 末日小队 · 街区守夜

Phaser 3 驱动的 HTML5 生存游戏。移动避敌，技能自动施放，收集经验升级，击败首领获取材料并建造防御塔。目标是坚持十分钟并击败最终首领。

## 本地运行

需要 Node.js 18 或以上版本，无需安装运行依赖：

```sh
npm run dev
```

打开 http://127.0.0.1:5173 。请通过 HTTP 服务运行，直接双击 HTML 无法可靠加载 ES modules。

## 操作

- WASD / 方向键移动；空格暂停、继续。
- 触屏按住画面左侧拖动，出现浮动摇杆。
- 按住右侧塔型时暂停战斗，在出现的圆盘内拖动，松开建造并恢复；移出轮盘松手取消。绿色预览可建，红色预览不可建；外圈表示攻击范围。拖放中按空格会取消建塔并保持手动暂停。
- 直接命中会产生轻微屏幕抖动，暴击和击杀略强；群攻限制触发频率，持续伤害不触发抖动。
- 初始 3 材料（机械师为 4）；普通首领掉落 3–5 材料。三种塔消耗分别为 3 / 5 / 7。
- 开局从游侠、破阵者、炼焰师、机械师、铁卫中选择职业；职业武器自动攻击且不占技能槽。升级时选择技能或属性，最多 4 种技能、每种 5 级；高阶要求角色 Lv.3 / 6 / 10 / 15。

## 当前代码入口

| 文件 | 职责 |
| --- | --- |
| `index.html`、`style.css` | 页面、HUD、响应式菜单 |
| `game.js` | 场景、移动、音频、升级与胜负 |
| `balance.js`、`progression.js` | 统一数值、经验曲线、升级选择与属性 |
| `classes.js`、`combat.js` | 五职业武器、十种技能、状态和持续领域 |
| `damage-numbers.js` | 实际伤害跳字、合并和数量限制 |
| `vendor/phaser.js` | 从原运行包分离的引擎，保留原许可证说明 |
| `presentation.js` | SVG 加载清单、菜单、地面、战斗表现 |
| `battle-skills.js` | 10 种技能定义、技能栏与施法特效 |
| `defenses.js`、`geometry.js` | 建塔、塔攻击、圆形碰撞 |
| `assets/` | 原创角色、怪物、武器、晶体和塔的 SVG |
| `scripts/create-art.py` | SVG 生成源，只在修改基础美术时使用 |

目录中旧的 `index-*.js/css` 是历史产物，当前 HTML 不再加载它们。没有删除历史文件。当前 `game.js` 从原运行版本提取并格式化，仍含历史技能分支，并非完整重写。

## 验证

```sh
npm test
```

运行 21 项回归测试，覆盖经验、职业基础属性、技能门槛、升级收益、圆形碰撞、伤害跳字、首领冻结抗性与地雷伤害。

开发服务启动后，可运行浏览器检查：

```sh
npm run test:browser
node scripts/skill-smoke.cjs
node scripts/combat-test.cjs
node scripts/placement-feedback-test.cjs
```

浏览器脚本需要 Playwright 和本机 Microsoft Edge。优先查找本项目 Playwright，其次使用 Codex 附带运行库；也可通过 `PLAYWRIGHT_MODULE_PATH` 指定模块路径。其他机器可先执行 `npm install --no-save playwright`。

交互检查覆盖技能选择、移动、浮动摇杆、真实拖动建塔及扣费、暂停恢复、升级、首领 HUD、重开，以及桌面和手机横竖屏布局。技能冒烟检查执行全部 10 种技能的表现路径。截图输出到 `artifacts/`；部分战斗截图使用注入敌人的确定性测试场景，并非自然流程录像。

建塔与打击反馈检查覆盖拖放期间时间、移动、生命、冷却及动画冻结，松手恢复、无效放置、手动暂停与取消清理，以及命中抖动的频率和持续伤害豁免。

`?debug` 仅在显式添加时暴露 `window.__game`，供自动化检查调用。普通入口不暴露此对象。

本次数值方案、职业差异和模拟限制见 [BALANCE_NOTES.md](./BALANCE_NOTES.md)。

早期版本的项目分析与后续优先级见 [PROJECT_ANALYSIS.md](./PROJECT_ANALYSIS.md)。
