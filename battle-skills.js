// Each equipped skill uses the same slots and upgrade rules.
export const skills = [
  ["meteor", "陨石坠落", "☄", "fire", "area", 85, 5, "陨石轰击最近敌人，爆炸波及周围目标"],
  ["frost", "冰霜新星", "❄", "ice", "nova", 34, 3.8, "向四周释放冰晶，冻结近敌 1.3 秒"],
  ["venom", "毒液飞弹", "☣", "poison", "projectile", 18, 1.1, "毒弹命中后持续掉血，重复命中叠加毒层"],
  ["arc", "闪电链", "ϟ", "lightning", "chain", 28, 2.2, "电弧在相邻敌人间跳跃，每跳伤害递减"],
  ["slash", "裂阵斩", "⚔", "physical", "cone", 52, 1.5, "向前方挥出宽刃，击退扇形内的敌人"],
  ["vortex", "真空漩涡", "◎", "wind", "pull", 22, 6, "留下持续四秒的风眼，将附近敌人拉向中心"],
  ["siphon", "生命虹吸", "♥", "shadow", "drain", 18, 6, "移动吸血领域每次汲取敌人时恢复生命"],
  ["orbit", "星刃环绕", "✦", "holy", "orbit", 20, .3, "星刃环绕自身旋转，接触敌人造成伤害"],
  ["rail", "轨道炮", "↗", "mechanical", "beam", 88, 4, "高速光束贯穿一条直线上的所有敌人"],
  ["mine", "震荡地雷", "✹", "time", "trap", 100, 3, "脚下布雷，敌人靠近时引爆范围震荡"]
].map(([id,name,icon,element,type,base,cd,description]) =>
  ({id,name,icon,element,type,base,cd,description,maxLevel:5}));

export function renderLoadout(panel, equipped) {
  const key = equipped.map(skill => skill.id + skill.level).join(",");
  if (panel.dataset.skills === key) return;
  panel.dataset.skills = key;
  panel.replaceChildren(...equipped.map(skill => {
    const slot = document.createElement("span");
    slot.title = slot.ariaLabel = skill.name + " Lv." + skill.level;
    slot.textContent = skill.icon;
    const level = document.createElement("small");
    level.textContent = skill.level;
    slot.append(level);
    return slot;
  }));
}

export function castArt(scene, skill, target, radius, color) {
  const g = scene.add.graphics().setDepth(7);
  const center = ["nova","drain","trap","cone"].includes(skill.type) ? scene.player : target.s;
  g.setPosition(center.x, center.y);
  g.lineStyle(3,color,.9);
  switch (skill.type) {
    case "area":
      g.lineStyle(12,color,.8).lineBetween(-65,-120,0,0);
      g.strokeCircle(0,0,radius);
      break;
    case "nova":
      for (let i=0;i<8;i++) {
        const a=i*Math.PI/4;
        g.lineBetween(0,0,radius*Math.cos(a),radius*Math.sin(a));
      }
      break;
    case "cone":
      g.rotation=Math.atan2(target.s.y-center.y,target.s.x-center.x);
      g.beginPath().arc(0,0,radius+30,-1.2,1.2).strokePath();
      break;
    case "pull":
      for(let i=1;i<=3;i++) g.beginPath().arc(0,0,radius*i/3,i,i+4.5).strokePath();
      break;
    case "drain":
      g.strokeCircle(0,0,radius);
      break;
    case "trap":
      g.strokeTriangle(0,-15,16,12,-16,12);
      break;
    default:
      g.destroy();
      return;
  }
  scene.effect(g,.35,0,0,.15);
}
