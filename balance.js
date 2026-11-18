// All active progression and combat tuning lives here. Times are simulation seconds.
export const BALANCE = {
  duration: 600,
  overtime: 30,
  player: { hp: 100, speed: 210, invulnerability: 0.65, pickup: 100 },
  bosses: [45, 105, 165, 225, 285, 345, 405, 465, 540],
  bossWarning: 8,
  enemyCap: 240,
  initialMaterials: 3,
  skillLevelGates: [1, 3, 6, 10, 15],
  damageScales: [1, 1.22, 1.48, 1.78, 2.12],
  cooldownScales: [1, 0.96, 0.92, 0.88, 0.84],
  statCap: 5,
};

export const SKILL_TUNING = {
  meteor: { base: 68, cd: 4.5, radius: 78, radiusStep: 6 },
  frost: { base: 24, cd: 4.2, radius: 100, radiusStep: 8, freeze: 0.85 },
  venom: { base: 17, cd: 1.15, radius: 480, radiusStep: 0 },
  arc: { base: 23, cd: 2.6, radius: 440, radiusStep: 0, decay: 0.78 },
  slash: { base: 38, cd: 1.5, radius: 115, radiusStep: 5 },
  vortex: { base: 10, cd: 6, radius: 85, radiusStep: 6, duration: 3 },
  siphon: { base: 8, cd: 7, radius: 90, radiusStep: 5, duration: 3, heal: 0.6 },
  orbit: { base: 14, cd: 0.5, radius: 78, radiusStep: 4 },
  rail: { base: 65, cd: 3.8, radius: 580, radiusStep: 0 },
  mine: { base: 82, cd: 4.2, radius: 82, radiusStep: 5, duration: 8 },
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
  return Math.ceil(30 + 10 * level + 2 * level ** 1.7);
}
export function spawnInterval(seconds, bossAlive = false) {
  return Math.max(0.22, 0.78 / (1 + seconds / 140)) * (bossAlive ? 1.35 : 1);
}
export function enemyStats(kind, seconds) {
  const minute = Math.min(10, seconds / 60),
    growth = 1 + 0.16 * minute + 0.022 * minute * minute;
  const base = {
    bug: [30, 68, 9, 3],
    runner: [24, 103, 8, 3],
    spitter: [33, 51, 10, 4],
    brute: [70, 43, 15, 6],
  }[kind];
  return {
    hp: Math.round(base[0] * growth),
    maxHp: Math.round(base[0] * growth),
    speed: Math.round(base[1] * (1 + minute * 0.018)),
    damage: Math.round(base[2] + minute * 0.7),
    xp: base[3],
    armor: kind === "brute" ? Math.min(18, Math.floor(minute) * 2) : 0,
    r: kind === "brute" ? 25 : 20,
    ranged: kind === "spitter",
    shot: 2.4,
    shotCooldown: 2.4,
    bulletSpeed: 170 + minute * 3,
  };
}
export function enemyKind(seconds, roll) {
  if (roll < 0.12 + Math.min(0.12, seconds / 3000)) return "brute";
  if (seconds >= 75 && roll > 0.82) return "spitter";
  if (seconds >= 25 && roll > 0.6) return "runner";
  return "bug";
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
    materials: final ? 0 : 3 + Math.floor(index / 3),
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
    radius: tuning.radius + tuning.radiusStep * i,
    projectiles: [1, 1, 2, 2, 3][i],
    blades: [2, 2, 3, 3, 4][i],
    links: [3, 3, 4, 4, 5][i],
  };
}
