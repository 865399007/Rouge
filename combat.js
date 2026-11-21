import {roleDefense} from "./role-combat.js";
import { segmentCircleEntry } from "./geometry.js";
import { BALANCE, skillStats } from "./balance.js";
import { castArt } from "./battle-skills.js";
import { drawArc, drawOrbit } from "./presentation.js";

export const ELEMENT_COLORS = {
  fire: 0xefae65,
  ice: 0xa7d8ec,
  frost: 0xa7d8ec,
  lightning: 0xf0d477,
  poison: 0xadc86b,
  physical: 0xe1d6bb,
  wind: 0x91cbb2,
  shadow: 0xc599c5,
  holy: 0xffe9a3,
  mechanical: 0xa5c5d0,
  time: 0xd5baac,
};

class SpatialHash {
  constructor() {
    this.cells = new Map();
    this.size = 120;
  }
  rebuild(enemies) {
    this.cells.clear();
    for (const enemy of enemies) {
      if (!enemy.s.active) continue;
      const key = `${Math.floor(enemy.s.x / this.size)},${Math.floor(enemy.s.y / this.size)}`;
      if (!this.cells.has(key)) this.cells.set(key, []);
      this.cells.get(key).push(enemy);
    }
  }
  query(x, y, r) {
    const result = [];
    for (
      let i = Math.floor((x - r - 60) / this.size);
      i <= Math.floor((x + r + 60) / this.size);
      i++
    )
      for (
        let j = Math.floor((y - r - 60) / this.size);
        j <= Math.floor((y + r + 60) / this.size);
        j++
      )
        for (const e of this.cells.get(`${i},${j}`) || [])
          if (e.s.active && Math.hypot(e.s.x - x, e.s.y - y) <= r + e.r)
            result.push(e);
    return result;
  }
}

export class Combat {
  constructor(scene, playSound = () => {}) {
    this.s = scene;
    this.playSound = playSound;
    this.hash = new SpatialHash();
    this.time = 0;
    this.zones = [];
    this.orbitHits = new WeakMap();
  }
  clash(index, x, y) {
    const [orb] = this.s.hostile.splice(index, 1);
    orb.s.destroy();
    const spark = this.s.add.star(x, y, 4, 3, 12, 0xffeaa2).setDepth(8);
    this.s.effect(spark, 0.16, 0, 0, 0.6);
  }
  cancelArea(x, y, radius, angle = 0, halfAngle = Math.PI) {
    const orbs = this.s.hostile;
    for (let i = orbs.length - 1; i >= 0; i--) {
      const p = orbs[i].s, dx = p.x-x, dy = p.y-y;
      if (Math.hypot(dx,dy) <= radius+5 &&
          Math.cos(Math.atan2(dy,dx)-angle) >= Math.cos(halfAngle))
        this.clash(i,p.x,p.y);
    }
  }
  cancelLine(from, to, width) {
    const orbs = this.s.hostile;
    for (let i = orbs.length - 1; i >= 0; i--) {
      const p = orbs[i].s;
      if (segmentCircleEntry(from,to,p,width+5) !== null) this.clash(i,p.x,p.y);
    }
  }
  intercept(shot, dt) {
    let first = Infinity, index = -1;
    for (let i=0; i<this.s.hostile.length; i++) {
      const orb = this.s.hostile[i];
      const end = { x: shot.s.x + (shot.vx-orb.vx)*dt, y: shot.s.y + (shot.vy-orb.vy)*dt };
      const time = segmentCircleEntry(shot.s, end, orb.s, shot.returning ? 18 : 11);
      if (time !== null && time < first) { first = time; index = i; }
    }
    if (index < 0) return false;
    this.clash(index, shot.s.x + shot.vx*dt*first, shot.s.y + shot.vy*dt*first);
    return true;
  }
  receive(amount, attacker) {
    const s = this.s;
    amount = roleDefense(s,amount,attacker);
    const armor = s.build.armor + (s.mount?.type.armor || 0);
    let damage = (amount * 100) / (100 + armor);
    if (s.mount?.shield > 0) {
      const absorbed = Math.min(s.mount.shield, damage);
      s.mount.shield -= absorbed;
      damage -= absorbed;
    }
    if (damage > 0 && s.hp > 0) s.playerHurt();
    s.hp = Math.max(0, s.hp - damage);
    s.impact(s.player.x, s.player.y, 0xef796a, false, false);
    s.cameras.main.shake(80, 0.002);
    s.sync();
    return damage;
  }
  damage(enemy, amount, element = "physical", dot = false) {
    if (!enemy.s.active || amount <= 0) return 0;
    enemy.status ??= {};
    if (!dot) {
      if (element === "ice") {
        // Bosses are briefly interrupted, never held in a permanent freeze.
        if ((enemy.freezeImmuneUntil || 0) <= this.time) {
          const duration = enemy.boss ? 0.22 : 0.85;
          enemy.frozenUntil = this.time + duration;
          enemy.freezeImmuneUntil =
            this.time + duration + (enemy.boss ? 2.5 : 0.4);
        }
        enemy.status.ice = this.time + 2;
      }
      if (element === "poison") {
        enemy.poison = Math.min(
          5,
          (enemy.status.poison > this.time ? enemy.poison || 0 : 0) + 1,
        );
        enemy.poisonDamage = amount * 0.18;
        enemy.status.poison = this.time + 3;
      }
      if (element === "fire") {
        enemy.burnDamage = amount * 0.12 * (1 + .1*(this.s.build.attributes.元素精通 || 0));
        enemy.status.fire = this.time + 2.5;
      }
      enemy.dotAt ??= this.time + 1;
    }
    if(!dot && this.s.build.attributes.元素主宰 && ["ice","frost","fire","lightning"].includes(element)){
      if(enemy.lastElement && enemy.lastElement!==element && enemy.elementTime+3>=this.time && !(enemy.reactUntil>this.time)){
        amount+=this.s.build.weaponDamage(this.s.job.damage);enemy.reactUntil=this.time+1;
      }
      enemy.lastElement=element;enemy.elementTime=this.time;
    }
    const mitigated = (amount * 100) / (100 + (enemy.armor || 0));
    return this.s.hit(enemy, mitigated, ELEMENT_COLORS[element], {
      dot,
      element,
    });
  }
  update(dt) {
    const s = this.s;
    this.time += dt;
    this.hash.rebuild(s.enemies);
    s.skillGraphics.clear();
    for (const enemy of [...s.enemies]) {
      if(enemy.armorUntil && enemy.armorUntil<=this.time){enemy.armor=enemy.armorBase;enemy.armorUntil=0;}
      if(enemy.bleedUntil>=this.time && enemy.bleedTick<=this.time){enemy.bleedTick=this.time+1;this.damage(enemy,enemy.bleedDmg,"physical",true);}
      enemy.status ??= {};
      enemy.slow = enemy.arrowIceUntil > this.time ? enemy.arrowSlow : enemy.status.ice > this.time ? (enemy.boss ? 0.9 : 0.72) : 1;
      if (enemy.dotAt <= this.time) {
        enemy.dotAt = this.time + 1;
        if (enemy.status.fire > this.time)
          this.damage(enemy, enemy.burnDamage || 0, "fire", true);
        if (enemy.status.poison > this.time)
          this.damage(
            enemy,
            (enemy.poisonDamage || 0) * (enemy.poison || 0),
            "poison",
            true,
          );
      }
    }
    for (const skill of s.build.active) {
      const stat = skillStats(skill, skill.level, s.build),
        color = ELEMENT_COLORS[skill.element];
      skill.remaining = Math.max(0, skill.remaining - dt);
      if (skill.type === "orbit") {
        for (let i = 0; i < stat.blades; i++) {
          const angle = this.time * 1.8 + (i * Math.PI * 2) / stat.blades,
            x = s.player.x + Math.cos(angle) * stat.radius,
            y = s.player.y + Math.sin(angle) * stat.radius;
          this.cancelArea(x, y, 10);
          drawOrbit(s.skillGraphics, x, y, color, angle, skill.level);
          for (const target of this.hash.query(x, y, 10))
            if ((this.orbitHits.get(target) || 0) <= this.time) {
              this.orbitHits.set(target, this.time + stat.cooldown);
              this.damage(target, stat.damage, skill.element);
            }
        }
        continue;
      }
      if (skill.remaining > 0) continue;
      const local = ["nova", "cone", "drain"].includes(skill.type);
      const range = local
        ? stat.radius
        : skill.type === "pull"
          ? 400
          : skill.type === "beam"
            ? stat.radius
            : 480;
      const target = this.hash
        .query(s.player.x, s.player.y, range)
        .sort(
          (a, b) => s.distance(s.player, a.s) - s.distance(s.player, b.s),
        )[0];
      if (!target && skill.type !== "trap") continue;
      this.cast(skill, target, stat.damage, stat.radius, color);
      skill.remaining = stat.cooldown;
      if (s.mode !== "play") break;
    }
    this.updateZones(dt);
  }
  cast(skill, target, damage, radius, color) {
    const s = this.s,
      stat = skillStats(skill, skill.level, s.build),
      type = skill.type;
    castArt(s, skill, target, radius, color);
    this.playSound(
      type === "chain"
        ? "chain"
        : type === "cone"
          ? "blade"
          : skill.element === "fire"
            ? "fire"
            : "pea",
    );
    const aoe = (x, y, r, amount) => {
      this.cancelArea(x,y,r);
      s.impact(x, y, color, false, false);
      for (const enemy of this.hash.query(x, y, r))
        this.damage(enemy, amount, skill.element);
    };
    if (type === "area") {
      aoe(target.s.x, target.s.y, radius, damage);
      return;
    }
    if (type === "nova") {
      aoe(s.player.x, s.player.y, radius, damage);
      return;
    }
    if (type === "chain") {
      let from = s.player, last = null;
      const used = new Set();
      const strike = (origin, enemy, amount) => {
        const point = { x: enemy.s.x, y: enemy.s.y };
        const g = s.add.graphics().setDepth(8);
        this.cancelLine(origin,point,3);
        drawArc(g, origin, point, color, skill.level);
        s.effect(g, 0.18);
        used.add(enemy);
        this.damage(enemy, amount, skill.element);
        return point;
      };
      const nearby = (origin, range) => this.hash.query(origin.x,origin.y,range)
        .filter(e => !used.has(e))
        .sort((a,b) => s.distance(origin,a.s) - s.distance(origin,b.s));
      for (let i = 0; i < stat.links && s.mode === "play"; i++) {
        const next = nearby(from, i ? 165 : stat.radius)[0];
        if (!next) {
          if (skill.branch === "return" && last?.s.active) {
            strike(s.player,last,damage * 0.85);
          }
          break;
        }
        from = strike(from,next,damage * stat.decay ** i);
        last = next;
        if (skill.branch === "spread" && !next.s.active) {
          for (const extra of nearby(from,200).slice(0,2)) {
            if (s.mode === "play") strike(from,extra,damage * 0.6);
          }
        }
      }
      return;
    }
    if (["pull", "drain", "trap"].includes(type)) {
      if (this.zones.length >= 16) this.zones.shift();
      this.zones.push({
        owner: skill.id,
        level: skill.level,
        kind: type,
        x: type === "trap" ? s.player.x : target.s.x,
        y: type === "trap" ? s.player.y : target.s.y,
        r: radius,
        damage,
        color,
        element: skill.element,
        life: stat.duration,
        tick: 0,
        heal: stat.heal || 0,
      });
      return;
    }
    const angle = Math.atan2(target.s.y - s.player.y, target.s.x - s.player.x);
    if (type === "cone") {
      this.cancelArea(s.player.x,s.player.y,radius,angle,1.1);
      for (const e of this.hash.query(s.player.x, s.player.y, radius)) {
        const offset =
          Math.atan2(e.s.y - s.player.y, e.s.x - s.player.x) - angle;
        if (Math.abs(Math.atan2(Math.sin(offset), Math.cos(offset))) > 1.1)
          continue;
        this.damage(e, damage, skill.element);
        if (e.s.active)
          s.defenses.move(
            e.s,
            Math.cos(angle) * (e.boss ? 4 : 22),
            Math.sin(angle) * (e.boss ? 4 : 22),
            e.r,
          );
      }
      return;
    }
    if (type === "beam") {
      const g = s.add.graphics().setDepth(8),
        x = s.player.x + Math.cos(angle) * radius,
        y = s.player.y + Math.sin(angle) * radius;
      this.cancelLine(s.player,{x,y},7);
      for (let offset of [-6, 6]) {
        const ox = -Math.sin(angle)*offset, oy = Math.cos(angle)*offset;
        g.lineStyle(2, color, 0.8).lineBetween(s.player.x+ox,s.player.y+oy,x+ox,y+oy);
      }
      for (let i = 1; i < skill.level; i++) {
        const t = i / skill.level;
        const gate = 8 + 2 * skill.level;
        const cx = s.player.x + (x-s.player.x)*t, cy = s.player.y + (y-s.player.y)*t;
        g.lineStyle(2,color).strokeCircle(cx,cy,gate)
          .lineStyle(2,0xffe49b).lineBetween(cx-Math.sin(angle)*gate,cy+Math.cos(angle)*gate,
            cx+Math.sin(angle)*gate,cy-Math.cos(angle)*gate);
      }
      g.lineStyle(10 + 2 * skill.level, color, 0.24)
        .lineBetween(s.player.x, s.player.y, x, y)
        .lineStyle(3, 0xfff4d1)
        .lineBetween(s.player.x, s.player.y, x, y);
      s.effect(g, 0.18);
      for (const e of this.hash.query(s.player.x, s.player.y, radius)) {
        const dx = e.s.x - s.player.x,
          dy = e.s.y - s.player.y,
          along = dx * Math.cos(angle) + dy * Math.sin(angle);
        if (
          along >= 0 &&
          along <= radius &&
          Math.abs(dx * Math.sin(angle) - dy * Math.cos(angle)) <= e.r + 7
        )
          this.damage(e, damage, skill.element);
      }
      return;
    }
    for (let i = 0; i < stat.projectiles && s.bullets.length < 250; i++) {
      const a = angle + (i - (stat.projectiles - 1) / 2) * 0.13;
      const sprite = s.add
        .ellipse(s.player.x, s.player.y, 14, 8, color)
        .setStrokeStyle(2, 0x494b34)
        .setRotation(a)
        .setDepth(7);
      s.bullets.push({
        s: sprite,
        vx: Math.cos(a) * 430,
        vy: Math.sin(a) * 430,
        life: 1.3,
        damage: damage * (stat.projectiles > 1 ? 0.72 : 1),
        pierce: 1,
        color,
        element: skill.element,
        skillLevel: skill.level,
        hit: new Set(),
        trail: 0,
        age: 0,
      });
    }
  }
  updateZones(dt) {
    const s = this.s,
      g = s.skillGraphics;
    this.zones = this.zones.filter((zone) => {
      zone.life -= dt;
      if (zone.life <= 0 || !s.build.active.some((k) => k.id === zone.owner))
        return false;
      const x = zone.kind === "drain" ? s.player.x : zone.x,
        y = zone.kind === "drain" ? s.player.y : zone.y;
      const level = zone.level || 1;
      const targets = this.hash.query(x, y, zone.r);
      if (zone.kind === "trap") {
        g.fillStyle(zone.color, 0.16)
          .fillCircle(x, y, zone.r)
          .lineStyle(3, zone.color)
          .strokeTriangle(x, y - 10, x + 12, y + 9, x - 12, y + 9);
        for (let i = 0; i < level; i++) {
          const angle = this.time * 2 + i * Math.PI * 2 / level;
          g.fillStyle(0xffdf91).fillCircle(x+18*Math.cos(angle),y+18*Math.sin(angle),3);
        }
        if (!this.hash.query(x, y, 28).length) return true;
        this.cancelArea(x,y,zone.r);
        for (const e of targets) this.damage(e, zone.damage, zone.element);
        s.impact(x, y, zone.color, false, true);
        return false;
      }
      g.fillStyle(zone.color, 0.09)
        .fillCircle(x, y, zone.r)
        .lineStyle(2, zone.color, 0.7)
        .strokeCircle(x, y, zone.r);
      for (let i = 0; i < level+2; i++) {
        const phase = this.time * (zone.kind === "pull" ? 3 : -2) + i * Math.PI * 2 / (level+2);
        const r = zone.r * (0.45 + 0.45 * ((this.time + i / (level+2)) % 1));
        g.lineStyle(3, zone.color, 0.65).beginPath().arc(x, y, r, phase, phase + 1.25).strokePath();
        g.fillStyle(0xffefd6, 0.85).fillCircle(x + r*Math.cos(phase), y + r*Math.sin(phase), 2);
      }
      if (zone.kind === "drain") {
        for (const e of targets.slice(0, level)) {
          const t = 1 - (this.time * 2 % 1);
          g.lineStyle(1.5, zone.color, 0.65).lineBetween(e.s.x,e.s.y,x,y)
            .fillStyle(0xfacde9).fillCircle(x+(e.s.x-x)*t,y+(e.s.y-y)*t,2+level/2);
        }
      }
      zone.tick -= dt;
      if (zone.tick > 0) return true;
      zone.tick = 0.5;
      this.cancelArea(x,y,zone.r);
      for (const e of targets) {
        if (zone.kind === "pull") {
          const d = Math.max(1, s.distance({ x, y }, e.s)),
            pull = e.boss ? 3 : 13;
          s.defenses.move(
            e.s,
            ((x - e.s.x) / d) * pull,
            ((y - e.s.y) / d) * pull,
            e.r,
          );
        }
        this.damage(e, zone.damage, zone.element, true);
      }
      if (zone.heal && targets.length)
        s.hp = Math.min(s.maxHp, s.hp + zone.heal);
      return true;
    });
  }
}
