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
- 按住右侧塔型，在出现的圆盘内拖动，松开建造。绿色预览可建，红色预览不可建；外圈表示攻击范围。
- 初始 3 材料；首领死亡掉落 4 材料。三种塔消耗分别为 3 / 5 / 7。
- 选择 1 个初始技能；升级可增加或强化技能，最多装备 4 种，每种最高 Lv.5。

## 当前代码入口

| 文件 | 职责 |
| --- | --- |
| `index.html`、`style.css` | 页面、HUD、响应式菜单 |
| `game.js` | 场景、移动、战斗、音频、升级与胜负 |
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

运行 6 个圆形碰撞回归测试，覆盖圆角空隙、高速位移、沿圆周滑动、重叠恢复、边界和塔间通道。

开发服务启动后，可运行浏览器检查：

```sh
npm run test:browser
node scripts/skill-smoke.cjs
```

浏览器脚本需要 Playwright 和本机 Microsoft Edge。优先查找本项目 Playwright，其次使用 Codex 附带运行库；也可通过 `PLAYWRIGHT_MODULE_PATH` 指定模块路径。其他机器可先执行 `npm install --no-save playwright`。

交互检查覆盖技能选择、移动、浮动摇杆、真实拖动建塔及扣费、暂停恢复、升级、首领 HUD、重开，以及桌面和手机横竖屏布局。技能冒烟检查执行全部 10 种技能的表现路径。截图输出到 `artifacts/`；部分战斗截图使用注入敌人的确定性测试场景，并非自然流程录像。

`?debug` 仅在显式添加时暴露 `window.__game`，供自动化检查调用。普通入口不暴露此对象。

项目分析与后续优先级见 [PROJECT_ANALYSIS.md](./PROJECT_ANALYSIS.md)。
