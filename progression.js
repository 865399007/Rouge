import { BALANCE, skillStats } from "./balance.js";
import { skills } from "./battle-skills.js";

const weaponMasteryStep = 0.25;
export const ATTRIBUTES = [
  { id: "weaponMastery", name: "武器专精", description: "职业武器伤害 +25%", max: 5 },
  {
    id: "power",
    name: "火力训练",
    description: "职业武器、技能和塔伤害 +8%",
    max: 5,
  },
  {
    id: "haste",
    name: "快速装填",
    description: "职业武器、技能和塔冷却缩短 6%",
    max: 5,
  },
  {
    id: "vitality",
    name: "强化体魄",
    description: "最大生命 +12，并恢复 12 生命",
    max: 5,
  },
  {
    id: "armor",
    name: "加固护甲",
    description: "护甲 +5，按 100 / (100 + 护甲) 减伤",
    max: 5,
  },
  { id: "evasion", name: "疾跑训练", description: "疾跑冷却缩短 0.5 秒，满级冷却 12.5 秒", max: 5 },
  { id: "speed", name: "轻装步伐", description: "移动速度 +4%", max: 5 },
  {
    id: "magnet",
    name: "拾荒直觉",
    description: "经验与材料吸取范围 +15%",
    max: 4,
  },
  { id: "regen", name: "战地恢复", description: "每秒恢复 0.2 生命", max: 3 },
  {
    id: "crit",
    name: "弱点识破",
    description: "直接伤害暴击率 +4%，暴击造成 150% 伤害",
    max: 5,
  },
];
export class Build {
  constructor(seed = Math.floor(Math.random() * 0xffffffff)) {
    this.heroLevel = 1;
    this.active = [];
    this.attributes = {};
    this.random = () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 4294967296;
    };
  }
  get power() {
    const level = this.heroLevel;
    const growth = 1 + .04 * (level - 1) + .14 * Math.max(0, level - 5) + .20 * Math.max(0, level - 12);
    return growth * (1 + .04*(this.profile?.stats.power || 0)) * (1 + 0.08 * (this.attributes.power || 0));
  }
  weaponDamage(base, level = this.attributes.weaponMastery || 0) {
    const rank = this.profile?.gear["weapon-"+this.job?.id]?.rank || 1;
    return base * (1 + .15*(rank-1)) * this.power * (1 + level * weaponMasteryStep);
  }
  get haste() {
    return 0.06 * (this.attributes.haste || 0);
  }
  get rollCooldown() {
    return BALANCE.roll.cooldown - 0.5 * (this.attributes.evasion || 0);
  }
  get critChance() {
    return (this.job?.crit ?? 0.05) + 0.04 * (this.attributes.crit || 0);
  }
  get armor() {
    return (this.job?.armor || 0) + 2*(this.profile?.stats.armor || 0) + 5 * (this.attributes.armor || 0);
  }
  get regen() {
    return 0.2 * (this.attributes.regen || 0);
  }
  get pickupMultiplier() {
    return 1 + 0.15 * (this.attributes.magnet || 0);
  }
  add(id, heroLevel = 1) {
    const existing = this.active.find((s) => s.id === id);
    if (existing) {
      if (
        existing.level >= 5 ||
        heroLevel < BALANCE.skillLevelGates[existing.level]
      )
        return false;
      existing.level++;
      return true;
    }
    const skill = skills.find((s) => s.id === id);
    if (!skill || this.active.length >= 4) return false;
    this.active.push({ ...skill, level: 1, remaining: 0 });
    return true;
  }
  options(heroLevel) {
    const equipped = this.active
      .filter(
        (s) => s.level < 5 && heroLevel >= BALANCE.skillLevelGates[s.level],
      )
      .map((s) => ({
        ...s,
        kind: "skill",
        level: s.level + 1,
        previous: s.level,
      }));
    const take = (pool) =>
      pool.splice(Math.floor(this.random() * pool.length), 1)[0];
    const stats = ATTRIBUTES.filter(
      (a) => (this.attributes[a.id] || 0) < a.max,
    ).map((a) => ({
      ...a,
      kind: "attribute",
      level: (this.attributes[a.id] || 0) + 1,
    }));
    const supply = {
        id: "heal_supply",
        kind: "supply",
        name: "战地补给",
        description: "恢复 30 生命",
        level: 1,
    };
    if (this.active.length >= 4) {
      const choices = [];
      const others = [...stats, supply];
      const maximum = Math.min(3, equipped.length);
      const minimum = Math.min(maximum, Math.max(1, 3 - others.length));
      const count = minimum + Math.floor(this.random() * (maximum - minimum + 1));
      while (choices.length < count) choices.push(take(equipped));
      while (choices.length < 3 && others.length) choices.push(take(others));
      return choices;
    }
    const fresh = skills
      .filter((s) => !this.active.some((a) => a.id === s.id))
      .map((s) => ({ ...s, kind: "skill", level: 1, previous: 0 }));
    const choices = [];
    if (equipped.length) choices.push(take(equipped));
    if (fresh.length) choices.push(take(fresh));
    if (stats.length) choices.push(take(stats));
    const rest = [...equipped, ...fresh, ...stats];
    while (choices.length < 3 && rest.length) choices.push(take(rest));
    if (choices.length < 3)
      choices.push(supply);
    return choices;
  }
  apply(choice, scene) {
    if (choice.kind === "skill") return this.add(choice.id, scene.level);
    if (choice.kind === "supply") {
      scene.hp = Math.min(scene.maxHp, scene.hp + 30);
      return true;
    }
    const a = ATTRIBUTES.find((x) => x.id === choice.id);
    if (!a || (this.attributes[a.id] || 0) >= a.max) return false;
    this.attributes[a.id] = (this.attributes[a.id] || 0) + 1;
    if (a.id === "evasion" && scene.roll) {
      scene.roll.cooldown = Math.max(0, scene.roll.cooldown - 0.5);
      scene.roll.sync();
    }
    scene.maxHp =
      (this.job?.hp ?? BALANCE.player.hp) + 8*(this.profile?.stats.hp || 0) +
      12 * (this.attributes.vitality || 0);
    if (a.id === "vitality") scene.hp = Math.min(scene.maxHp, scene.hp + 12);
    scene.speed = Math.round(
      (this.job?.speed ?? BALANCE.player.speed) *
        (1 + 0.04 * (this.attributes.speed || 0)),
    );
    return true;
  }
  // Compatibility for inactive legacy weapons; active combat uses named modifiers.
  p() {
    return 0;
  }
}

export function upgradeDescription(choice, build) {
  if (choice.id === "weaponMastery" && build.job) {
    const { weapon, damage } = build.job;
    const hit = level => Number(build.weaponDamage(damage, level).toFixed(1));
    return `${weapon}伤害 +25%\n单次伤害 ${hit(choice.level - 1)} → ${hit(choice.level)}`;
  }
  if (choice.kind !== "skill") return choice.description;
  const next = skillStats(choice, choice.level, build),
    old = choice.previous ? skillStats(choice, choice.previous, build) : null;
  const delta = (label, key, suffix = "") =>
    `${label} ${old ? old[key] + suffix + " → " : ""}${next[key]}${suffix}`;
  let detail = `${choice.description}\n${delta(["pull", "drain"].includes(choice.type) ? "每跳伤害" : "命中伤害", "damage")}\n${delta("冷却", "cooldown", "s")}`;
  if (choice.type === "chain") detail += `\n${delta("连锁目标", "links")}`;
  else if (choice.type === "projectile")
    detail += `\n${delta("弹数", "projectiles")}（多弹每发 72% 伤害）`;
  else if (choice.type === "orbit")
    detail += `\n${delta("星刃数量", "blades")}`;
  else detail += `\n${delta("范围", "radius")}`;
  if (choice.level < 5)
    detail += `\n下阶需 Lv.${BALANCE.skillLevelGates[choice.level]}`;
  return detail;
}
