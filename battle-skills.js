import { SKILL_TUNING } from "./balance.js";
import { icon } from "./presentation.js";
// Each equipped skill uses the same slots and upgrade rules.
export const skills = [
  [
    "meteor",
    "陨石坠落",
    "☄",
    "fire",
    "area",
    85,
    5,
    "陨石轰击最近敌人，爆炸波及周围目标",
  ],
  [
    "frost",
    "冰霜新星",
    "❄",
    "ice",
    "nova",
    34,
    3.8,
    "向四周释放冰晶，冻结近敌 0.85 秒，首领抗冻结",
  ],
  [
    "venom",
    "毒液飞弹",
    "☣",
    "poison",
    "projectile",
    18,
    1.1,
    "毒弹命中后持续掉血，重复命中叠加毒层",
  ],
  [
    "arc",
    "闪电链",
    "ϟ",
    "lightning",
    "chain",
    28,
    2.2,
    "电弧在相邻敌人间跳跃，每跳伤害递减",
  ],
  [
    "slash",
    "裂阵斩",
    "⚔",
    "physical",
    "cone",
    52,
    1.5,
    "向前方挥出宽刃，击退扇形内的敌人",
  ],
  [
    "vortex",
    "真空漩涡",
    "◎",
    "wind",
    "pull",
    22,
    6,
    "留下持续三秒的风眼，将附近敌人拉向中心",
  ],
  [
    "siphon",
    "生命虹吸",
    "♥",
    "shadow",
    "drain",
    18,
    6,
    "持续三秒，每半秒汲取近敌并恢复 0.6 生命",
  ],
  [
    "orbit",
    "星刃环绕",
    "✦",
    "holy",
    "orbit",
    20,
    0.3,
    "星刃环绕自身旋转，接触敌人造成伤害",
  ],
  [
    "rail",
    "轨道炮",
    "↗",
    "mechanical",
    "beam",
    88,
    4,
    "高速光束贯穿一条直线上的所有敌人",
  ],
  [
    "mine",
    "震荡地雷",
    "✹",
    "time",
    "trap",
    100,
    3,
    "脚下布雷，保留八秒；敌人靠近时全额爆炸一次",
  ],
].map(([id, name, icon, element, type, base, cd, description]) => ({
  id,
  name,
  icon,
  element,
  type,
  base,
  cd,
  description,
  ...SKILL_TUNING[id],
  maxLevel: 5,
}));

export function renderLoadout(panel, equipped) {
  const key = equipped.map((skill) => skill.id + skill.level + (skill.branch || "")).join(",");
  if (panel.dataset.skills === key) return;
  panel.dataset.skills = key;
  panel.replaceChildren(
    ...equipped.map((skill) => {
      const slot = document.createElement("span");
      slot.title = slot.ariaLabel = skill.name + " Lv." + skill.level +
        (skill.branch ? " · " + (skill.branch === "spread" ? "扩散" : "回流") : "");
      slot.innerHTML = icon(skill.id);
      const level = document.createElement("small");
      level.textContent = skill.level;
      slot.append(level);
      return slot;
    }),
  );
}

export function castArt(scene, skill, target, radius, color) {
  const level = skill.level || 1;
  const spokes = 4 + level * 2;
  const g = scene.add.graphics().setDepth(7);
  const center = ["nova", "drain", "trap", "cone"].includes(skill.type)
    ? scene.player
    : target.s;
  g.setPosition(center.x, center.y);
  g.lineStyle(3, color, 0.9);
  switch (skill.type) {
    case "area":
      for (let i = 1; i <= level + 1; i++) {
        const offset = (i % 2 ? -1 : 1) * (5 + i * 2);
        g.lineStyle(3, 0xffa453, 0.8).lineBetween(-i*13+offset,-i*22,-i*13+offset-12,-i*22-24);
      }
      for (let i = 1; i < level; i++) {
        const side = i % 2 ? -1 : 1;
        const x = side * (12 + i * 5), y = -8 * i;
        g.fillStyle(0xf58a47).fillTriangle(x, y, x-12, y-30, x+5, y-4)
          .fillStyle(0xffdc80).fillCircle(x,y,3+i);
      }
      g.lineStyle(20, 0x503d30, 0.8).lineBetween(-60, -105, 0, 0);
      g.lineStyle(13, color, 1).lineBetween(-60, -105, 0, 0);
      g.lineStyle(5, 0xffedb1, 1).lineBetween(-52, -90, 0, 0);
      g.fillStyle(color, 0.12).fillCircle(0, 0, radius);
      g.lineStyle(5, color).strokeCircle(0, 0, radius * 0.8);
      g.lineStyle(2, 0xffedb1).strokeCircle(0, 0, radius * 0.65);
      for (let i = 0; i < spokes; i++) {
        const a = (i * Math.PI * 2) / spokes;
        g.lineStyle(4, color).lineBetween(
          Math.cos(a) * radius * 0.85,
          Math.sin(a) * radius * 0.85,
          Math.cos(a) * radius,
          Math.sin(a) * radius,
        );
      }
      break;
    case "nova":
      g.fillStyle(color, 0.12).fillCircle(0, 0, radius);
      for (let i = 0; i < 6; i++) {
        const a = i*Math.PI/3 + 0.26;
        g.lineStyle(2, color, 0.8).beginPath().arc(0,0,radius*0.96,a,a+0.7).strokePath();
      }
      g.lineStyle(3, 0xe9fbf4, 0.9).strokeCircle(0, 0, radius * 0.8);
      for (let i = 0; i < spokes; i++) {
        const a = (i * Math.PI * 2) / spokes;
        const x = Math.cos(a) * radius * 0.8,
          y = Math.sin(a) * radius * 0.8;
        g.lineStyle(3, color).lineBetween(
          Math.cos(a) * 20,
          Math.sin(a) * 20,
          x,
          y,
        );
        const points = [
          { x: x + Math.cos(a) * 15, y: y + Math.sin(a) * 15 },
          { x: x + Math.sin(a) * 7, y: y - Math.cos(a) * 7 },
          { x: x - Math.cos(a) * 9, y: y - Math.sin(a) * 9 },
          { x: x - Math.sin(a) * 7, y: y + Math.cos(a) * 7 },
        ];
        if (level >= 3) {
          g.lineStyle(2, 0xcaf9ff).lineBetween(x,y,x-12*Math.cos(a+0.6),y-12*Math.sin(a+0.6))
            .lineBetween(x,y,x-12*Math.cos(a-0.6),y-12*Math.sin(a-0.6));
        }
        g.fillStyle(0xeaf9ef)
          .fillPoints(points, true)
          .lineStyle(2, 0x628d98)
          .strokePoints(points, true);
      }
      break;
    case "cone":
      g.rotation = Math.atan2(target.s.y - center.y, target.s.x - center.x);
      for (let i=0; i<level; i++) {
        g.lineStyle(2+i*0.65, color, 0.65).beginPath()
          .arc(0,0,radius*(0.54+i*0.09),-1.25+i*0.18,0.55+i*0.28).strokePath();
      }
      g.lineStyle(14, color, 0.65)
        .beginPath()
        .arc(0, 0, radius + 30, -1.2, 1.2)
        .strokePath();
      g.lineStyle(3, 0xfff5d5)
        .beginPath()
        .arc(0, 0, radius + 37, -1.1, 1.1)
        .strokePath();
      break;
    case "pull":
      for (let i = 1; i <= level+1; i++)
        g.beginPath()
          .arc(0, 0, (radius * i) / (level+1), i, i + 4.5)
          .strokePath();
      break;
    case "drain":
      g.strokeCircle(0, 0, radius);
      g.lineStyle(2, 0xe0bcd8, 0.5).strokeCircle(0, 0, radius - 8);
      for (let i = 0; i < spokes; i++) {
        const a = i * 2 * Math.PI / spokes,
          x = Math.cos(a) * radius,
          y = Math.sin(a) * radius;
        g.lineStyle(3, 0xe0bcd8)
          .lineBetween(x - 4, y, x + 4, y)
          .lineBetween(x, y - 4, x, y + 4);
      }
      break;
    case "trap":
      g.fillStyle(0x554d3d)
        .fillCircle(0, 0, 18)
        .lineStyle(3, color)
        .strokeCircle(0, 0, 18);
      for (let i=0; i<level+2; i++) {
        const a = 2*Math.PI*i/(level+2);
        g.lineStyle(3,color).beginPath().arc(0,0,26,a,a+3/(level+2)).strokePath();
      }
      g.fillStyle(color).fillTriangle(0, -10, 10, 8, -10, 8);
      g.lineStyle(2, 0x554d3d).lineBetween(0, -5, 0, 2);
      break;
    default:
      g.destroy();
      return;
  }
  scene.effect(g, 0.26 + level*0.035, 0, 0, 0.12 + level*0.02);
}
