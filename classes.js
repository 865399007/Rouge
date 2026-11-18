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
  {
    id: "astronomer", name: "引星师", weapon: "星盘", icon: "constellation", texture: "star-dial",
    hp: 95, speed: 208, armor: 2, power: 1, crit: 0.05,
    cooldown: 2.3, damage: 38, range: 360, color: 0xc9a5f0,
    description: "星盘标记最多三个敌人，0.8 秒后同时引爆星印。",
    strengths: "三重星印 · 延时引爆", weakness: "伤害延迟生效",
  },
];
export function classById(id) {
  return CLASSES.find((c) => c.id === id);
}

function updateConstellation(scene, job, enemies, dt) {
  if (!scene.constellation) {
    if (scene.weaponClock > 0) return;
    const targets = enemies.filter(e => scene.distance(scene.player, e.s) <= job.range)
      .sort((a, b) => scene.distance(scene.player, a.s) - scene.distance(scene.player, b.s)).slice(0, 3);
    if (!targets.length) return;
    scene.constellation = { targets, remaining: 0.8, art: scene.add.graphics().setDepth(7) };
    scene.weaponClock = job.cooldown * (1 - scene.build.haste);
  }
  const marks = scene.constellation;
  marks.remaining -= dt;
  const art = marks.art.clear(), alive = marks.targets.filter(e => e.s.active);
  const radius = 8 + Math.max(0, marks.remaining) * 15;
  let previous;
  for (const enemy of alive) {
    const {x,y} = enemy.s;
    if (previous) art.lineStyle(2,job.color,0.7).lineBetween(previous.x,previous.y,x,y);
    art.lineStyle(2,job.color).strokeCircle(x,y,radius)
      .fillStyle(0xffe3a0).fillTriangle(x,y-radius-4,x-4,y-radius+2,x+4,y-radius+2);
    previous = enemy.s;
  }
  if (marks.remaining > 0 && alive.length) return;
  art.destroy();
  scene.constellation = null;
  for (const enemy of alive) {
    if (scene.mode !== "play") break;
    scene.combat.cancelArea(enemy.s.x, enemy.s.y, 23);
    scene.effect(scene.add.star(enemy.s.x, enemy.s.y, 4, 5, 23, 0xf4d6ff).setDepth(8), 0.25, 0, 0, 0.6);
    scene.combat.damage(enemy, scene.build.weaponDamage(job.damage), "holy");
  }
}

export function updateClassWeapon(scene, dt) {
  const job = scene.job;
  if (!job) return;
  scene.weaponClock = Math.max(0, (scene.weaponClock || 0) - dt);
  const enemies = scene.enemies.filter((e) => e.s.active);
  if (job.id === "astronomer") return updateConstellation(scene, job, enemies, dt);
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
        .lineStyle(7, job.color, 0.45)
        .lineBetween(t.x, t.y, target.s.x, target.s.y)
        .lineStyle(2, 0xfff2c8)
        .lineBetween(t.x, t.y, target.s.x, target.s.y);
      scene.combat.cancelLine(t, target.s, 2);
      scene.effect(beam, 0.12);
      scene.combat.damage(target, scene.build.weaponDamage(job.damage), "physical");
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
    damage = scene.build.weaponDamage(job.damage);
  if (job.id === "vanguard") {
    scene.combat.cancelArea(scene.player.x,scene.player.y,job.range,angle,1.2);
    const g = scene.add
      .graphics({ x: scene.player.x, y: scene.player.y })
      .setDepth(8);
    for (let i=0; i<3; i++) {
      g.lineStyle(3+i, job.color, 0.7).beginPath()
        .arc(0,0,job.range*(0.58+i*0.12),angle-1.3+i*0.12,angle+0.65+i*0.2).strokePath();
    }
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
