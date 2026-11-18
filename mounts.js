export const mounts = [
  { id: "walker", name: "四足巡猎机器人", range: 380, cooldown: 0.42, damage: 22, color: 0x7ce2d5 },
  { id: "stag", name: "霜角鹿", range: 160, cooldown: 2.4, damage: 32, color: 0x8cdcff },
  { id: "drake", name: "赤焰翼龙", range: 225, cooldown: 1.7, damage: 36, color: 0xff9863 },
  { id: "lynx", name: "雷纹猞猁", range: 260, cooldown: 1.65, damage: 30, color: 0xf9cd58 },
  { id: "boar", name: "铁棘战猪", range: 250, cooldown: 1.9, damage: 46, color: 0xd8ac81 },
];

export function ride(scene, type) {
  scene.mount?.sprite.destroy();
  scene.mount?.label.destroy();
  const { x, y } = scene.player;
  const sprite = scene.add.image(x, y + 20, "mount-" + type.id).setDepth(4.9);
  const label = scene.add.text(x, y + 47, type.name + " · 60秒", {
    fontSize: "12px", color: "#fff2cf", stroke: "#342d26", strokeThickness: 3,
  }).setOrigin(0.5, 0).setDepth(9);
  scene.mount = { type, sprite, label, remaining: 60, cooldown: 0 };
}

export function updateMount(scene, dt) {
  const mount = scene.mount;
  if (!mount || scene.mode !== "play") return;
  const { type, sprite, label } = mount;
  mount.remaining -= dt;
  if (mount.remaining < 1e-8) {
    sprite.destroy();
    label.destroy();
    scene.mount = null;
    return;
  }
  const p = scene.player;
  const input = scene.movementInput();
  if (input.x) sprite.setFlipX(input.x < 0);
  sprite.setPosition(p.x, p.y + 20 + (input.x || input.y ? Math.sin(scene.runTime * 18) * 2 : 0));
  label.setPosition(p.x, p.y + 47).setText(type.name + " · " + Math.ceil(mount.remaining) + "秒");
  mount.cooldown -= dt;
  if (mount.cooldown > 0) return;
  const enemies = scene.enemies.filter(e => e.s.active);
  const nearest = (origin, radius, candidates) => {
    let best;
    for (const e of candidates) {
      const d = scene.distance(origin, e.s);
      if (d <= radius) { radius = d; best = e; }
    }
    return best;
  };
  const target = nearest(p, type.range, enemies);
  if (!target) return;
  mount.cooldown = type.cooldown;
  const g = scene.add.graphics().setDepth(7).lineStyle(4, type.color, 0.85);
  const angle = Math.atan2(target.s.y - p.y, target.s.x - p.x);
  const hit = (e, element, factor = 1) => {
    if (scene.mode === "play") scene.combat.damage(e, type.damage * scene.build.power * factor, element);
  };
  switch (type.id) {
    case "walker":
      g.lineBetween(p.x, p.y + 15, target.s.x, target.s.y);
      hit(target, "physical");
      break;
    case "stag":
      g.strokeCircle(p.x, p.y, type.range);
      for (const e of enemies) if (scene.distance(p, e.s) <= type.range) hit(e, "ice");
      break;
    case "drake":
      g.fillStyle(type.color, 0.32).slice(p.x, p.y, type.range, angle - 0.58, angle + 0.58).fillPath();
      for (const e of enemies) {
        const delta = Math.atan2(e.s.y - p.y, e.s.x - p.x) - angle;
        if (scene.distance(p, e.s) <= type.range && Math.cos(delta) >= Math.cos(0.58)) hit(e, "fire");
      }
      break;
    case "lynx": {
      const visited = new Set();
      let from = p, next = target;
      while (next && visited.size < 3 && scene.mode === "play") {
        const point = { x: next.s.x, y: next.s.y };
        g.lineBetween(from.x, from.y, point.x, point.y);
        visited.add(next);
        hit(next, "lightning", 0.85 ** (visited.size - 1));
        from = point;
        next = nearest(from, 145, enemies.filter(e => e.s.active && !visited.has(e)));
      }
      break;
    }
    case "boar": {
      const dx = Math.cos(angle), dy = Math.sin(angle);
      g.lineStyle(11, type.color, 0.65).lineBetween(p.x, p.y, p.x + type.range * dx, p.y + type.range * dy);
      for (const e of enemies) {
        const x = e.s.x - p.x, y = e.s.y - p.y, along = x * dx + y * dy;
        if (along >= 0 && along <= type.range && Math.abs(x * dy - y * dx) <= 15 + e.r) hit(e, "physical");
      }
      break;
    }
  }
  scene.effect(g, 0.18);
}
