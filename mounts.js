export const mounts = [
  { id: "walker", shield: 35, passiveIcon: "shield", passiveName: "护盾", name: "四足巡猎机器人", range: 380, cooldown: 0.42, damage: 22, color: 0x7ce2d5 },
  { id: "stag", regen: 1.5, passiveIcon: "regen", passiveName: "回血", name: "霜角鹿", range: 160, cooldown: 2.4, damage: 32, color: 0x8cdcff },
  { id: "drake", crit: 0.10, passiveIcon: "crit", passiveName: "暴击", name: "赤焰翼龙", range: 225, cooldown: 1.7, damage: 36, color: 0xff9863 },
  { id: "lynx", speed: 0.20, passiveIcon: "speed", passiveName: "疾行", name: "雷纹猞猁", range: 260, cooldown: 1.65, damage: 30, color: 0xf9cd58 },
  { id: "boar", armor: 12, passiveIcon: "armor", passiveName: "护甲", name: "铁棘战猪", range: 250, cooldown: 1.9, damage: 46, color: 0xd8ac81 },
];

// Local coordinates relative to the chassis centre. Far and near feet land
// on separate tracks, with diagonally opposite legs sharing a swing phase.
const walkerLegs = [
  { hipX: -31, hipY: 1, footX: -53, ground: 36, bend: -1, phase: 0, far: true },
  { hipX: 20, hipY: 1, footX: 48, ground: 35, bend: 1, phase: Math.PI, far: true },
  { hipX: -22, hipY: 11, footX: -32, ground: 42, bend: -1, phase: Math.PI, far: false },
  { hipX: 13, hipY: 11, footX: 30, ground: 42, bend: 1, phase: 0, far: false },
];

function animateWalker(mount, player, dt) {
  const gait = mount.gait;
  const dx = player.x - gait.lastX, dy = player.y - gait.lastY;
  const distance = Math.hypot(dx, dy);
  gait.lastX = player.x;
  gait.lastY = player.y;
  gait.phase += Math.min(distance / 18, dt * 18);
  const moving = distance > 0.01;
  const blend = Math.min(1, dt * 16);
  gait.stride += ((moving ? 1 : 0) - gait.stride) * blend;
  if (Math.abs(dx) > 0.01) mount.sprite.setFlipX(dx < 0);
  const bob = Math.cos(2 * gait.phase) * gait.stride * 3;
  mount.sprite.setPosition(player.x, player.y + 20 + bob);
  for (const layer of gait.layers) {
    layer.clear().setPosition(player.x, player.y + 20).setScale(mount.sprite.flipX ? -1 : 1, 1);
  }
  for (const leg of walkerLegs) {
    const g = gait.layers[leg.far ? 0 : 1];
    const phase = gait.phase + leg.phase;
    const swing = Math.max(0, Math.sin(phase));
    const footX = leg.footX - 19 * Math.cos(phase) * gait.stride;
    const footY = leg.ground - 23 * swing * gait.stride;
    const hipY = leg.hipY + bob;
    const x = footX - leg.hipX, y = footY - hipY;
    const length = Math.hypot(x, y);
    // Two equal-length links meet at the knee, so lifting a foot folds the joint.
    const offset = leg.bend * Math.sqrt(Math.max(0, 34 ** 2 - length ** 2 / 4)) / length;
    const kneeX = leg.hipX + x / 2 + y * offset;
    const kneeY = hipY + y / 2 - x * offset;
    // Separate armoured thigh and bright piston make the hinge readable in profile.
    g.lineStyle(10, 0x293a3d).lineBetween(leg.hipX, hipY, kneeX, kneeY)
      .lineStyle(6, leg.far ? 0x567175 : 0x8db8ad).lineBetween(leg.hipX, hipY, kneeX, kneeY)
      .lineStyle(6, 0x293a3d).lineBetween(kneeX, kneeY, footX, footY)
      .lineStyle(3, leg.far ? 0x849699 : 0xd7e1ce).lineBetween(kneeX, kneeY, footX, footY)
      .fillStyle(0x293a3d).fillCircle(kneeX, kneeY, 5.5)
      .fillStyle(leg.far ? 0xa78453 : 0xffca65).fillCircle(kneeX, kneeY, 3.5)
      .lineStyle(5, 0x344447).lineBetween(footX-4, footY, footX+8, footY-swing*gait.stride*4);

  }
}

const animalGaits = {
  boar: { hips: [-32, 13], hipY: 11, ground: 38, reach: 12, lift: 12, period: 13, bob: 2.5,
    thigh: 10, shin: 6, near: 0xac6a48, far: 0x724735, offsets: [0, 0.5, 0.5, 0] },
  lynx: { hips: [-24, 12], hipY: 5, ground: 33, reach: 22, lift: 17, period: 19, bob: 4,
    thigh: 7, shin: 4, near: 0x966dac, far: 0x574565, offsets: [0, 0.54, 0.12, 0.68] },
  stag: { hips: [-24, 9], hipY: 4, ground: 43, reach: 17, lift: 24, period: 18, bob: 3,
    thigh: 6, shin: 3, near: 0xbadad4, far: 0x73949e, offsets: [0, 0.5, 0.54, 0.04] },
};

function animateAnimal(mount, player, dt) {
  const gait = mount.gait, profile = animalGaits[mount.type.id];
  const dx = player.x - gait.lastX, dy = player.y - gait.lastY;
  const distance = Math.hypot(dx, dy);
  gait.lastX = player.x;
  gait.lastY = player.y;
  gait.phase += Math.min(distance / profile.period, dt * 19);
  gait.stride += ((distance > 0.01 ? 1 : 0) - gait.stride) * Math.min(1, dt * 14);
  if (Math.abs(dx) > 0.01) mount.sprite.setFlipX(dx < 0);
  const bob = Math.cos(gait.phase * 2) * profile.bob * gait.stride;
  mount.sprite.setPosition(player.x, player.y + 20 + bob);
  gait.layers.forEach(layer => layer.clear().setPosition(player.x, player.y + 20)
    .setScale(mount.sprite.flipX ? -1 : 1, 1));
  profile.offsets.forEach((offset, i) => {
    const near = i >= 2, fore = i % 2 === 1;
    const g = gait.layers[near ? 1 : 0];
    const phase = gait.phase + offset * Math.PI * 2;
    const swing = Math.max(0, Math.sin(phase)) * gait.stride;
    const hipX = profile.hips[i % 2] + (near ? -2 : 4);
    const hipY = profile.hipY + bob;
    const footX = hipX + (fore ? 6 : -8) - profile.reach * gait.stride * Math.cos(phase);
    const footY = profile.ground - (near ? 0 : 6) - profile.lift * swing;
    const x = footX - hipX, y = footY - hipY, length = Math.hypot(x, y);
    const link = (profile.ground - profile.hipY) * 0.67;
    const bend = (fore ? -1 : 1) * Math.sqrt(Math.max(0, link*link - length*length/4)) / length;
    const kneeX = hipX + x/2 + y*bend, kneeY = hipY + y/2 - x*bend;
    const coat = near ? profile.near : profile.far;
    g.lineStyle(profile.thigh+2, 0x3b3437).lineBetween(hipX,hipY,kneeX,kneeY)
      .lineStyle(profile.thigh,coat).lineBetween(hipX,hipY,kneeX,kneeY)
      .lineStyle(profile.shin+2,0x3b3437).lineBetween(kneeX,kneeY,footX,footY)
      .lineStyle(profile.shin,coat).lineBetween(kneeX,kneeY,footX,footY)
      .fillStyle(coat).fillCircle(kneeX,kneeY,profile.shin/2);
    if (mount.type.id === "lynx") g.fillStyle(0x403449).fillEllipse(footX+2,footY,10,5);
    else g.fillStyle(0x403b38).fillTriangle(footX-3,footY-4,footX+5,footY+1,footX-3,footY+1);
  });
}

function trailStamp(scene, id, x, y, angle, side) {
  const art = scene.add.graphics({ x, y }).setDepth(2.5).setRotation(angle);
  switch (id) {
    case "walker":
      for (const lane of [-1, 1]) {
        const heel = lane * side * 5;
        art.fillStyle(0x253e41, 0.8).fillRoundedRect(heel-5, lane*13-3, 11, 6, 2)
          .lineStyle(2, 0x74ffdc).lineBetween(heel-2, lane*13, heel+3, lane*13);
      }
      break;
    case "stag":
      art.lineStyle(2, 0x83d6ed).lineBetween(-12, 0, 8, 0)
        .lineBetween(-6, 0, -12, -5).lineBetween(-3, 0, -9, 6)
        .fillStyle(0xe3ffff).fillTriangle(1, 0, 6, -9*side, 9, 0);
      break;
    case "drake":
      art.fillStyle(0xe55736, 0.85).fillTriangle(9, -5, -21, side*6, 6, 6)
        .fillStyle(0xffc14f).fillTriangle(7, -2, -12, side*3, 6, 3)
        .fillCircle(-23, -side*5, 2);
      break;
    case "lynx": {
      const bolt = [{x:9,y:0},{x:-1,y:side*7},{x:-4,y:-side*4},{x:-17,y:side*3}];
      art.lineStyle(5, 0x8454ad, 0.8).strokePoints(bolt)
        .lineStyle(2, 0xffec81).strokePoints(bolt);
      break;
    }
    case "boar":
      art.lineStyle(3, 0x735640).lineBetween(5,-4,-2,0).lineBetween(-2,0,-12,-3)
        .lineBetween(-2,0,-7,6).fillStyle(0xb48d64,0.8)
        .fillCircle(-8,side*9,5).fillCircle(-15,side*12,3)
        .fillTriangle(3,side*7,7,side*11,0,side*12);
      break;
  }
  scene.effect(art, id === "lynx" ? 0.52 : 0.85, 0, 0, id === "boar" ? 0.5 : 0);
}

function updateMountTrail(scene, mount) {
  const trail = mount.trail, p = scene.player;
  const dx = p.x - trail.x, dy = p.y - trail.y, distance = Math.hypot(dx, dy);
  if (!distance) return;
  // Sample the ground contact line beneath the body, independent of travel direction.
  const ground = animalGaits[mount.type.id]?.ground ??
    (mount.type.id === "walker" ? walkerLegs[2].ground : mount.sprite.displayHeight * .4);
  const footOffset = 20 + ground;
  const spacing = 19;
  if (distance < 120) {
    const angle = Math.atan2(dy, dx);
    for (let step = spacing - trail.carry; step <= distance; step += spacing) {
      const fraction = step / distance;
      trailStamp(scene, mount.type.id, trail.x + dx*fraction, trail.y + dy*fraction + footOffset, angle, trail.side);
      trail.side *= -1;
    }
    trail.carry = (trail.carry + distance) % spacing;
  } else {
    trail.carry = 0;
  }
  trail.x = p.x;
  trail.y = p.y;
}

export function ride(scene, type) {
  scene.mount?.sprite.destroy();
  scene.mount?.label.destroy();
  const { x, y } = scene.player;
  const walker = type.id === "walker";
  const animal = animalGaits[type.id];
  const texture = walker ? "mount-walker-chassis" : "mount-" + type.id + (animal ? "-body" : "");
  const sprite = scene.add.image(x, y + 20, texture).setDepth(4.9);
  const label = scene.add.text(x, y + 47, type.name + " · " + type.passiveName + " · 60秒", {
    fontSize: "12px", color: "#fff2cf", stroke: "#342d26", strokeThickness: 3,
  }).setOrigin(0.5, 0).setDepth(9);
  const rank = scene.profile?.gear["mount-"+type.id]?.rank || 1;
  scene.mount = { rank, type, sprite, label, shield: type.shield || 0, remaining: 60, cooldown: 0 };
  scene.mount.trail = { x, y, carry: 0, side: 1 };
  if (walker || animal) {
    const layers = [4.8, 4.95].map(depth => scene.add.graphics().setDepth(depth));
    scene.mount.gait = { animate: walker ? animateWalker : animateAnimal, layers, phase: 0, stride: 0, lastX: x, lastY: y };
    sprite.once("destroy", () => {
      for (const layer of layers) if (layer.active) layer.destroy();
    });
    scene.mount.gait.animate(scene.mount, scene.player, 0);
  }
  scene.sync();
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
    scene.sync();
    return;
  }
  const p = scene.player;
  updateMountTrail(scene, mount);
  const input = scene.movementInput();
  if (mount.gait) mount.gait.animate(mount, p, dt);
  else {
    if (input.x) sprite.setFlipX(input.x < 0);
    sprite.setPosition(p.x, p.y + 20 + (input.x || input.y ? Math.sin(scene.runTime * 18) * 2 : 0));
  }
  label.setPosition(p.x, p.y + (mount.gait ? 67 : 47)).setText(type.name + (type.shield && !mount.shield ? "" : " · " + type.passiveName) + " · " + Math.ceil(mount.remaining) + "秒");
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
    if (scene.mode === "play") scene.combat.damage(e, type.damage * (1 + .15*(mount.rank-1)) * scene.build.power * factor, element);
  };
  switch (type.id) {
    case "walker":
      g.lineStyle(7, type.color, 0.4).lineBetween(p.x, p.y + 15, target.s.x, target.s.y)
        .lineStyle(2, 0xe9ffff).lineBetween(p.x, p.y + 15, target.s.x, target.s.y)
        .strokeCircle(target.s.x, target.s.y, 9);
      scene.burst(target.s.x, target.s.y, type.color, 4, 95);
      hit(target, "physical");
      break;
    case "stag":
      g.lineStyle(2, type.color, 0.7).strokeCircle(p.x, p.y, type.range);
      const wave = scene.add.graphics({ x: p.x, y: p.y }).setDepth(7);
      wave.lineStyle(3, 0xd8ffff).strokeCircle(0, 0, type.range * 0.62);
      for (let i = 0; i < 12; i++) {
        const a = i * Math.PI / 6, x = Math.cos(a), y = Math.sin(a), r = type.range * 0.62;
        wave.fillStyle(type.color).fillTriangle(x*r-y*4, y*r+x*4, x*(r+13), y*(r+13), x*r+y*4, y*r-x*4);
      }
      scene.effect(wave, 0.35, 0, 0, 1.6);
      for (const e of enemies) if (scene.distance(p, e.s) <= type.range) hit(e, "ice");
      break;
    case "drake":
      for (let i = -3; i <= 3; i++) {
        const a = angle + i * 0.15;
        const flame = scene.add.graphics({ x: p.x, y: p.y + 6 }).setDepth(7).setRotation(a);
        const length = type.range * (1 - Math.abs(i) * 0.09);
        flame.fillStyle(0xfb733b, 0.75).fillTriangle(8, 0, length * 0.64, -14, length, 0)
          .fillStyle(0xffc853, 0.9).fillTriangle(5, 0, length * 0.49, 11, length * 0.82, 0);
        scene.effect(flame, 0.28, Math.cos(a)*70, Math.sin(a)*70);
      }
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
        const dx = point.x - from.x, dy = point.y - from.y;
        const len = Math.max(1, Math.hypot(dx, dy));
        const bolt = [from, ...[1, 2, 3].map(i => {
          const offset = (i % 2 ? 1 : -1) * Math.min(11, len / 5);
          return { x: from.x + dx*i/4 - dy*offset/len, y: from.y + dy*i/4 + dx*offset/len };
        }), point];
        g.lineStyle(7, 0x9454cb, 0.75).strokePoints(bolt)
          .lineStyle(2.5, 0xffe782).strokePoints(bolt);
        scene.burst(point.x, point.y, type.color, 3, 70);
        visited.add(next);
        hit(next, "lightning", 0.85 ** (visited.size - 1));
        from = point;
        next = nearest(from, 145, enemies.filter(e => e.s.active && !visited.has(e)));
      }
      break;
    }
    case "boar": {
      const dx = Math.cos(angle), dy = Math.sin(angle);
      for (let i = 1; i <= 5; i++) {
        const x = p.x + dx * i * type.range / 5, y = p.y + dy * i * type.range / 5;
        const tusk = scene.add.graphics({ x, y }).setDepth(7).setRotation(angle);
        for (const side of [-1, 1]) {
          tusk.fillStyle(0x845646).fillTriangle(-16, side*16, 10, side*5, -5, side*17)
            .fillStyle(0xffe4a4).fillTriangle(-13, side*15, 10, side*5, -4, side*13);
        }
        scene.effect(tusk, 0.26, dx*70, dy*70);
      }
      scene.burst(p.x + dx*type.range, p.y + dy*type.range, 0xc5a17a, 9, 135);
      for (const e of enemies) {
        const x = e.s.x - p.x, y = e.s.y - p.y, along = x * dx + y * dy;
        if (along >= 0 && along <= type.range && Math.abs(x * dy - y * dx) <= 15 + e.r) hit(e, "physical");
      }
      break;
    }
  }
  scene.effect(g, 0.18);
}
