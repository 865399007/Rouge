// All active progression and combat tuning lives here. Times are simulation seconds.
export const BALANCE = {
  duration: 600,
  overtime: 30,
  player: { hp: 100, speed: 210, invulnerability: 0.65, pickup: 100 },
  bosses: [45, 105, 165, 225, 285, 345, 405, 465, 540],
  bossWarning: 8,
  enemyCap: 240,
  initialMaterials: 3,
  elites: { first: 25, interval: 30 },
  roll: { cooldown: 5, duration: 0.3, distance: 150 },
  skillLevelGates: [1, 3, 6, 10, 15],
  damageScales: [1, 1.35, 2.4, 4.1, 7.2],
  cooldownScales: [1, 0.96, 0.90, 0.82, 0.72],
  statCap: 5,
};

export const SKILL_TUNING = {
  meteor: { base: 88, cd: 4.5, radius: 78, radiusStep: 6 },
  frost: { base: 31, cd: 4.2, radius: 100, radiusStep: 8, freeze: 0.85 },
  venom: { base: 22, cd: 1.15, radius: 480, radiusStep: 0 },
  arc: { base: 30, cd: 2.6, radius: 440, radiusStep: 0, decay: 0.78 },
  slash: { base: 49, cd: 1.5, radius: 115, radiusStep: 5 },
  vortex: { base: 13, cd: 6, radius: 85, radiusStep: 6, duration: 3 },
  siphon: { base: 10, cd: 7, radius: 90, radiusStep: 5, duration: 3, heal: 0.6 },
  orbit: { base: 18, cd: 0.5, radius: 78, radiusStep: 4 },
  rail: { base: 84, cd: 3.8, radius: 580, radiusStep: 0 },
  mine: { base: 107, cd: 4.2, radius: 82, radiusStep: 5, duration: 8 },
};

export const TOWER_TUNING = [
  {
    name: "速射塔",
    icon: "➶",
    cost: 3,
    color: 0xf4c875,
    range: 300,
    cooldown: 0.6,
    damage: 15,
    element: "physical",
  },
  {
    name: "冰晶塔",
    icon: "❄",
    cost: 5,
    color: 0x94e4ff,
    range: 260,
    cooldown: 1.8,
    damage: 20,
    element: "ice",
  },
  {
    name: "爆裂塔",
    icon: "✹",
    cost: 7,
    color: 0xff9468,
    range: 280,
    cooldown: 2.5,
    damage: 48,
    element: "fire",
  },
];

export function xpToNext(level) {
  return Math.ceil(15 + 7 * level + 1.35 * level ** 1.7);
}
export function spawnInterval(seconds, bossAlive = false) {
  return Math.max(0.22, 0.78 / (1 + seconds / 140)) * (bossAlive ? 1.35 : 1);
}
export function packSize(seconds) {
  if (seconds >= 480) return 4;
  if (seconds >= 330) return 3;
  if (seconds >= 150) return 2;
  return 1;
}
// New packs join the original four species progressively during a run.
export const variants = {
  moth:    { name: "鬼面蛾", at: 18, base: [20, 105, 6, 3], sway: 0.85, r: 15 },
  crab:    { name: "铁钳蟹", at: 35, base: [45, 52, 12, 5], plating: 22, r: 23 },
  hopper:  { name: "弹簧蚤", at: 55, base: [27, 81, 10, 4], surge: 1.6, r: 16 },
  pod:     { name: "孢囊菇", at: 85, base: [38, 39, 6, 5], shots: 3, spread: 0.23, reload: 3.6, projectile: 124 },
  wisp:    { name: "灯笼灵", at: 115, base: [23, 76, 8, 4], shots: 1, sway: 0.62, reach: 315, reload: 1.5, projectile: 205 },
  ram:     { name: "撞槌兽", at: 155, base: [66, 64, 16, 6], surge: 2.5, r: 24 },
  snail:   { name: "涡壳蜗", at: 200, base: [58, 32, 9, 6], shots: 5, spread: 0.37, reload: 4.6, projectile: 110, plating: 12 },
  needle:  { name: "针尾蝎", at: 250, base: [35, 67, 14, 6], shots: 1, reload: 3.2, projectile: 295, reach: 375 },
  twin:    { name: "双瞳哨兵", at: 305, base: [48, 55, 9, 6], shots: 2, spread: 0.15, reload: 2.2, projectile: 200 },
  saw:     { name: "锯轮虫", at: 365, base: [43, 98, 13, 6], sway: 0.48, plating: 8, r: 19 },
};
const variantPool = Object.entries(variants);
const originalStats = {
  bug: [30, 68, 9, 3], runner: [24, 103, 8, 3],
  spitter: [33, 51, 10, 4], brute: [70, 43, 15, 6],
};
export function enemyStats(kind, seconds) {
  const minute = Math.min(10, seconds / 60);
  const growth = 1 + 0.15 * minute + 0.014 * minute * minute;
  const variant = variants[kind] || {};
  const [health, speed, damage, xp] = variant.base || originalStats[kind];
  const hp = Math.round(health * growth);
  return {
    hp, maxHp: hp, xp,
    speed: Math.round(speed * (1 + minute * 0.018)),
    damage: Math.round(damage + minute * 0.7),
    armor: variant.plating || (kind === "brute" ? Math.min(18, Math.floor(minute) * 2) : 0),
    r: variant.r || (kind === "brute" ? 25 : 20),
    ranged: kind === "spitter" || !!variant.shots,
    shots: variant.shots || 1, spread: variant.spread || 0,
    sway: variant.sway || 0, surge: variant.surge || 0, reach: variant.reach || 260,
    shot: variant.reload || 2.4, shotCooldown: variant.reload || 2.4,
    bulletSpeed: (variant.projectile || 170) + minute * 3,
  };
}
export function enemyKind(seconds, roll) {
  const available = variantPool.filter(([, v]) => seconds >= v.at);
  if (available.length) {
    const share = Math.min(0.60, available.length * 0.10);
    if (roll < share) return available[Math.floor(roll / share * available.length)][0];
    roll = (roll - share) / (1 - share);
  }
  if (roll < 0.12 + Math.min(0.12, seconds / 3000)) return "brute";
  if (seconds >= 75 && roll > 0.82) return "spitter";
  if (seconds >= 25 && roll > 0.6) return "runner";
  return "bug";
}
export function eliteStats(seconds) {
  const base = enemyStats("brute", seconds);
  const hp = Math.round(base.hp * 2.6);
  return {
    ...base,
    hp,
    maxHp: hp,
    elite: true,
    kind: "brute",
    r: 30,
    speed: Math.round(base.speed * 1.15),
    damage: Math.round(base.damage * 1.35),
    xp: 12,
    materials: seconds < 180 ? 1 : 2,
  };
}
export function materialDrop(enemy) {
  if (!enemy.boss && !enemy.elite) return 0;
  return Math.max(0, Math.floor(enemy.materials ?? (enemy.boss ? 3 : 1)));
}
export function bossStats(index) {
  const final = index === BALANCE.bosses.length - 1;
  const hp = final
    ? 6200
    : Math.round(600 * (1 + index * 0.38 + index * index * 0.09));
  return {
    hp,
    maxHp: hp,
    speed: final ? 66 : 49 + index * 1.6,
    r: final ? 55 : 38,
    damage: final ? 26 : 17 + index,
    xp: final ? 120 : 32 + index * 7,
    armor: final ? 20 : 8 + index,
    boss: true,
    final,
    shot: 2,
    shotCooldown: final ? 1.7 : 2.8,
    bulletSpeed: final ? 205 : 175,
    materials: final ? 6 : 3 + Math.floor(index / 3),
  };
}
export function skillStats(skill, level = skill.level || 1, build) {
  const tuning = SKILL_TUNING[skill.id],
    i = Math.max(0, Math.min(4, level - 1));
  return {
    ...tuning,
    damage:
      Math.round(
        tuning.base * BALANCE.damageScales[i] * (build?.power || 1) * 10,
      ) / 10,
    cooldown:
      Math.round(
        tuning.cd * BALANCE.cooldownScales[i] * (1 - (build?.haste || 0)) * 100,
      ) / 100,
    radius: tuning.radius + tuning.radiusStep * [0, 1, 2, 4, 7][i],
    projectiles: [1, 1, 2, 3, 4][i],
    blades: [2, 2, 3, 4, 6][i],
    links: [3, 3, 4, 6, 8][i],
  };
}
