import {catalogs} from "./role-cards.js";
import { rangerCards, evolutions, rangerDraft } from "./ranger.js";
import { BALANCE, skillStats } from "./balance.js";
import { skills } from "./battle-skills.js";

const weaponMasteryStep = 0.25;
export const ATTRIBUTES = [
  { id: "weaponMastery", name: "武器专精", description: "职业武器伤害 +25%", max: 5 },
  {
    id: "power",
    name: "力量",
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
  { id: "speed", name: "移动速度", description: "移动速度 +4%", max: 5 },
  {
    id: "magnet",
    name: "拾荒直觉",
    description: "经验与材料吸取范围 +15%",
    max: 4,
  },
  { id: "regen", name: "回血速度", description: "每秒恢复 0.2 生命", max: 3 },
  {
    id: "crit",
    name: "暴击率",
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
    return base * (1 + .15*(this.attributes.strong || 0)) * (1 + .15*(rank-1)) * this.power * (1 + level * weaponMasteryStep);
  }
  get haste() {
    return 0.06 * (this.attributes.haste || 0);
  }
  get rollCooldown() {
    return BALANCE.roll.cooldown - 0.5 * (this.attributes.evasion || 0);
  }
  get critChance() {
    return (this.job?.crit ?? 0.05) + .08*(this.attributes.暴击剑术||0) + .06*(this.attributes.法术暴击||0) + .08*(this.attributes.aim || 0) + 0.04 * (this.attributes.crit || 0);
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
  attributePool() {
    return this.job?.id === "ranger" ? [...ATTRIBUTES, ...rangerCards, ...evolutions] : [...ATTRIBUTES,...(catalogs[this.job?.name] || [])];
  }
  availableAttributes() {
    return this.attributePool().filter(
      (a) => (this.attributes[a.id] || 0) < a.max && (!this.route || !a.route || a.route === this.route),
    ).map((a) => ({
      ...a,
      kind: "attribute",
      level: (this.attributes[a.id] || 0) + 1,
    }));
  }
  draftAttributes() {
    const pool = this.availableAttributes();
    if (this.job?.id === "ranger") return rangerDraft(this, pool.filter(c=>ATTRIBUTES.some(a=>a.id===c.id)));
    const catalog=catalogs[this.job?.name];
    if(catalog){
      const legal=pool.filter(c=>catalog.some(k=>k.id===c.id) && (!c.needs || c.needs.every(id=>this.attributes[id]>=3)));
      const picks=[];
      const evolved=catalog.filter(c=>c.needs && this.attributes[c.id]).length<2 ? legal.filter(c=>c.needs) : [];
      if(evolved.length)picks.push(evolved[Math.floor(this.random()*evolved.length)]);
      const shared=pool.filter(c=>ATTRIBUTES.some(a=>a.id===c.id));
      const linked=new Set(catalog.filter(c=>c.needs?.some(id=>this.attributes[id])).flatMap(c=>c.needs));
      while(picks.length<4){
        if(picks.length===3 && shared.length){picks.push(shared.splice(Math.floor(this.random()*shared.length),1)[0]);break;}
        let options=legal.filter(c=>!c.needs && !picks.includes(c));
        const synergy=options.filter(c=>linked.has(c.id));
        if(!picks.length && synergy.length)options=synergy;
        if(!options.length)break;
        const weight=c=>({普通:55,稀有:30,史诗:12,传说:3}[c.rarity]||12);
        let roll=this.random()*options.reduce((n,c)=>n+weight(c),0);
        picks.push(options.find(c=>(roll-=weight(c))<0)||options.at(-1));
      }
      return [...picks,...shared].slice(0,4);
    }
    const choices = [];
    while (pool.length && choices.length < 4) {
      const index = Math.floor(this.random() * pool.length);
      choices.push(pool.splice(index, 1)[0]);
    }
    return choices;
  }
  options(heroLevel, size = 3) {
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
    const stats = this.availableAttributes();
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
      const maximum = Math.min(size, equipped.length);
      const minimum = Math.min(maximum, Math.max(1, size - others.length));
      const count = minimum + Math.floor(this.random() * (maximum - minimum + 1));
      while (choices.length < count) choices.push(take(equipped));
      while (choices.length < size && others.length) choices.push(take(others));
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
    while (choices.length < size && rest.length) choices.push(take(rest));
    if (choices.length < size)
      choices.push(supply);
    return choices;
  }
  apply(choice, scene) {
    if (choice.kind === "skill") return this.add(choice.id, scene.level);
    if (choice.kind === "supply") {
      scene.hp = Math.min(scene.maxHp, scene.hp + 30);
      return true;
    }
    const a = this.attributePool().find((x) => x.id === choice.id);
    if (a?.needs && (!a.needs.every(id=>this.attributes[id]>=3) || catalogs[this.job.name].filter(c=>c.needs && this.attributes[c.id]).length>=2)) return false;
    if (!a || (this.attributes[a.id] || 0) >= a.max) return false;
    if (a.requires && (!a.requires.every(id=>this.attributes[id]>=3) || evolutions.filter(c=>this.attributes[c.id]).length>=2)) return false;
    if (a.route && this.route && a.route !== this.route) return false;
    if (a.route) this.route = a.route;
    const oldMaxHp = scene.maxHp;
    this.attributes[a.id] = (this.attributes[a.id] || 0) + 1;
    if (a.id === "evasion" && scene.roll) {
      scene.roll.cooldown = Math.max(0, scene.roll.cooldown - 0.5);
      scene.roll.sync();
    }
    scene.maxHp =
      Math.round((this.job?.hp ?? BALANCE.player.hp) * (1 + .2*(this.attributes.health || 0))) + 8*(this.profile?.stats.hp || 0) +
      12 * (this.attributes.vitality || 0);
    if (a.id === "health") scene.hp += scene.maxHp - oldMaxHp;
    if (a.id === "vitality") scene.hp = Math.min(scene.maxHp, scene.hp + 12);
    scene.speed = Math.round(
      (this.job?.speed ?? BALANCE.player.speed) *
        (1 + 0.04 * (this.attributes.speed || 0) + .1*(this.attributes.stride || 0)),
    );
    return true;
  }
  // Compatibility for inactive legacy weapons; active combat uses named modifiers.
  p() {
    return 0;
  }
}

export function upgradeDescription(choice, build, mountSpeedBonus = 0) {
  if (choice.id === "crit") {
    const current = Math.round(build.critChance * 100);
    return `直接伤害暴击率 ${current}% → ${current + 4}%\n暴击造成 150% 伤害`;
  }
  if (choice.id === "regen") {
    return `每秒恢复生命 ${build.regen.toFixed(1)} → ${(build.regen + 0.2).toFixed(1)}`;
  }
  if (choice.id === "speed") {
    const base = build.job?.speed ?? BALANCE.player.speed;
    const speed = rank => Math.round(Math.round(base * (1 + 0.04 * rank)) * (1 + mountSpeedBonus));
    return `基础移速 +4%\n移动速度 ${speed(choice.level - 1)} → ${speed(choice.level)}`;
  }
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
