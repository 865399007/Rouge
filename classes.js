export const CLASSES = [
  {
    id: "ranger",
    name: "游侠",
    weapon: "双弩",
    icon: "rail",
    texture: "crossbow",
    hp: 85,
    speed: 230,
    armor: 0,
    power: 1,
    crit: 0.1,
    cooldown: 0.72,
    damage: 13,
    range: 470,
    color: 0xe6cc7d,
    description: "双弩齐射，远距离集中点杀。高机动、低生命，保持距离。",
    strengths: "单体连射 · 快速游走",
    weakness: "生命较低，缺少范围清场",
  },
  {
    id: "vanguard",
    name: "破阵者",
    weapon: "重斧",
    icon: "slash",
    texture: "axe",
    hp: 135,
    speed: 190,
    armor: 4,
    power: 1,
    crit: 0.05,
    cooldown: 1.05,
    damage: 39,
    range: 112,
    color: 0xe6bb91,
    description:
      "重斧横扫前方大扇形，击退普通敌人。高生命、低移速，需要贴近战斗。",
    strengths: "扇形近战 · 群体击退",
    weakness: "攻击距离短，需要冒险接敌",
  },
  {
    id: "pyromancer",
    name: "炼焰师",
    weapon: "焰心法杖",
    icon: "meteor",
    texture: "fire-staff",
    hp: 75,
    speed: 205,
    armor: 0,
    power: 1,
    crit: 0.05,
    cooldown: 1.65,
    damage: 40,
    range: 420,
    color: 0xf0a06b,
    description:
      "发射慢速火球，命中后爆炸并灼烧。清理密集敌群很强，但空窗较长。",
    strengths: "爆炸火球 · 持续灼烧",
    weakness: "生命最低，容易被快速敌人贴身",
  },
  {
    id: "engineer",
    name: "机械师",
    weapon: "部署器",
    icon: "mine",
    texture: "deployer",
    hp: 100,
    speed: 200,
    armor: 3,
    power: 1,
    crit: 0.05,
    cooldown: 8,
    damage: 17,
    range: 310,
    color: 0xa7c4b4,
    materials: 4,
    description:
      "每 8 秒布置一座自动哨塔，持续 14 秒，最多 2 座。起始材料多 1 点。",
    strengths: "临时哨塔 · 固定阵地",
    weakness: "离开火力区后输出显著下降",
  },
  {
    id: "warden",
    name: "铁卫",
    weapon: "回旋盾",
    icon: "orbit",
    texture: "shield",
    hp: 115,
    speed: 195,
    armor: 12,
    power: 1,
    crit: 0.05,
    cooldown: 1.9,
    damage: 30,
    range: 400,
    color: 0xadc6d6,
    description:
      "投掷回旋盾贯穿敌人，返程可再次命中。高护甲，走位决定回程路线。",
    strengths: "去返穿透 · 护甲减伤",
    weakness: "直线之外的目标难以命中",
  },
];
export function classById(id) {
  return CLASSES.find((c) => c.id === id);
}

export function updateClassWeapon(scene, dt) {
  const job = scene.job;
  if (!job) return;
  scene.weaponClock = Math.max(0, (scene.weaponClock || 0) - dt);
  const enemies = scene.enemies.filter((e) => e.s.active);
  const nearest = (origin, range) =>
    enemies
      .filter((e) => scene.distance(origin, e.s) < range + e.r)
      .sort(
        (a, b) => scene.distance(origin, a.s) - scene.distance(origin, b.s),
      )[0];
  if (job.id === "engineer") {
    if (scene.weaponClock <= 0) {
      const x = scene.player.x,
        y = scene.player.y;
      const art = scene.add.graphics({ x, y }).setDepth(3);
      art
        .fillStyle(0x344a40)
        .fillCircle(0, 0, 18)
        .lineStyle(3, 0xd4dec6)
        .strokeCircle(0, 0, 18)
        .fillStyle(0xa7c4b4)
        .fillCircle(0, 0, 10);
      const barrel = scene.add
        .rectangle(x, y, 25, 7, 0xf1ddb0)
        .setOrigin(0, 0.5)
        .setDepth(4);
      scene.classTurrets.push({ x, y, art, barrel, life: 14, clock: 0 });
      scene.weaponClock = job.cooldown * (1 - scene.build.haste);
      if (scene.classTurrets.length > 2) {
        const old = scene.classTurrets.shift();
        old.art.destroy();
        old.barrel.destroy();
      }
    }
    scene.classTurrets = scene.classTurrets.filter((t) => {
      t.life -= dt;
      if (t.life <= 0) {
        t.art.destroy();
        t.barrel.destroy();
        return false;
      }
      t.art.setAlpha(Math.min(1, t.life / 2));
      t.clock -= dt;
      const target = enemies
        .filter((e) => scene.distance(t, e.s) < job.range + e.r)
        .sort(
          (a, b) =>
            Number(b.boss || false) - Number(a.boss || false) ||
            scene.distance(t, a.s) - scene.distance(t, b.s),
        )[0];
      if (!target || t.clock > 0) return true;
      const a = Math.atan2(target.s.y - t.y, target.s.x - t.x);
      t.barrel.setRotation(a);
      const beam = scene.add
        .graphics()
        .setDepth(7)
        .lineStyle(2, job.color)
        .lineBetween(t.x, t.y, target.s.x, target.s.y);
      scene.effect(beam, 0.12);
      scene.combat.damage(target, job.damage * scene.build.power, "physical");
      t.clock = 0.65 * (1 - scene.build.haste);
      return true;
    });
    return;
  }
  const target = nearest(scene.player, job.range);
  if (!target || scene.weaponClock > 0) return;
  scene.weaponClock = job.cooldown * (1 - scene.build.haste);
  const angle = Math.atan2(
      target.s.y - scene.player.y,
      target.s.x - scene.player.x,
    ),
    damage = job.damage * scene.build.power;
  if (job.id === "vanguard") {
    const g = scene.add
      .graphics({ x: scene.player.x, y: scene.player.y })
      .setDepth(8);
    g.lineStyle(16, job.color, 0.6)
      .beginPath()
      .arc(0, 0, job.range, angle - 1.2, angle + 1.2)
      .strokePath();
    scene.effect(g, 0.2);
    for (const e of enemies) {
      if (scene.distance(scene.player, e.s) > job.range + e.r) continue;
      const a =
        Math.atan2(e.s.y - scene.player.y, e.s.x - scene.player.x) - angle;
      if (Math.abs(Math.atan2(Math.sin(a), Math.cos(a))) > 1.2) continue;
      scene.combat.damage(e, damage, "physical");
      if (e.s.active)
        scene.defenses.move(
          e.s,
          Math.cos(angle) * (e.boss ? 5 : 28),
          Math.sin(angle) * (e.boss ? 5 : 28),
          e.r,
        );
    }
    return;
  }
  const returning = job.id === "warden",
    explosive = job.id === "pyromancer",
    count = job.id === "ranger" ? 2 : 1;
  for (let i = 0; i < count && scene.bullets.length < 250; i++) {
    const a = angle + (i - (count - 1) / 2) * 0.07,
      speed = returning ? 320 : explosive ? 300 : 560;
    const sprite = returning
      ? scene.add.image(scene.player.x, scene.player.y, "shield").setScale(0.7)
      : scene.add
          .ellipse(
            scene.player.x,
            scene.player.y,
            explosive ? 18 : 15,
            explosive ? 18 : 6,
            job.color,
          )
          .setStrokeStyle(2, 0x4e4937);
    sprite.setDepth(7).setRotation(a);
    scene.bullets.push({
      s: sprite,
      vx: Math.cos(a) * speed,
      vy: Math.sin(a) * speed,
      life: returning ? 1.8 : 1.65,
      damage,
      pierce: returning ? 99 : 1,
      color: job.color,
      trail: 0,
      hit: new Set(),
      element: explosive ? "fire" : "physical",
      explosive,
      blastRadius: 68,
      returning,
      returnAt: 0.65,
      returnSpeed: 360,
      age: 0,
    });
  }
}
