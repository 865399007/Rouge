import { mounts, ride } from "./mounts.js";
import { BALANCE, TOWER_TUNING, materialDrop } from "./balance.js";
import {
  TOWER_RADIUS,
  circlesOverlap,
  moveCircle,
} from "./geometry.js";
const types = TOWER_TUNING;
const halfTower = TOWER_RADIUS;
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

function startPickupFlight(sprite, player) {
  if (sprite.pickupFlight) return;
  const distance = Math.hypot(player.x - sprite.x, player.y - sprite.y);
  sprite.pickupFlight = { x: sprite.x, y: sprite.y, elapsed: 0,
    duration: clamp(distance / 750, .28, .8) };
}

export function advancePickupFlight(sprite, player, dt) {
  const flight = sprite.pickupFlight;
  flight.elapsed += dt;
  const t = Math.min(1, flight.elapsed / flight.duration);
  sprite.x = flight.x + (player.x - flight.x) * t * t;
  sprite.y = flight.y + (player.y - flight.y) * t * t - Math.sin(Math.PI * t) * 24;
  return t === 1;
}

export class Defenses {
  constructor(scene) {
    this.scene = scene;
    const bounds = document.getElementById("game").getBoundingClientRect();
    const ratio = bounds.width / Math.max(1, bounds.height);
    const screenWidth = Math.max(900, Math.round(620 * ratio));
    const screenHeight = Math.max(620, Math.round(900 / ratio));
    const side = Math.round(Math.sqrt(6 * screenWidth * screenHeight));
    this.width = side;
    this.height = side;
    scene.cameras.main.setBounds(0, 0, this.width, this.height);
    scene.add
      .rectangle(
        this.width / 2,
        this.height / 2,
        this.width - 8,
        this.height - 8,
      )
      .setStrokeStyle(5, 0x64747c)
      .setDepth(0);
    this.stock = BALANCE.initialMaterials;
    this.towers = [];
    this.drops = [];
    this.upgradeButton = document.getElementById("tower-upgrade");
    this.upgradeButton.hidden = true;
    this.upgradeButton.onclick = () => {
      const tower = this.selectedTower;
      if (scene.mode !== "play" || !tower || this.upgradeButton.disabled) return;
      this.upgradeTower(tower);
      this.selectTower(null);
    };
    scene.events.on("render", this.positionUpgrade, this);
    scene.events.once("shutdown", () => {
      scene.events.off("render", this.positionUpgrade, this);
      this.upgradeButton.onclick = null;
      this.selectTower(null);
    });
    this.tools = document.getElementById("tower-tools");
    this.tools.replaceChildren();
    this.counter = document.createElement("output");
    this.tools.append(this.counter);
    this.buttons = types.map((type, i) => {
      const button = document.createElement("button");
      const image = ["build-rapid", "build-frost", "build-blast"][i];
      button.innerHTML = `<img src="./assets/${image}.svg" alt=""><span class="tower-caption"><b>${type.name.slice(0, -1)}</b><small>◆${type.cost}</small></span>`;
      button.title = `${type.name} · ${type.cost} 材料 · 点击原地建造`;
      button.setAttribute("aria-label", button.title);
      button.onpointerdown = event => {
        if (event.button !== 0) return;
        event.preventDefault();
        this.buildAtPlayer(type);
      };
      button.onclick = event => {
        if (!event.detail) this.buildAtPlayer(type);
      };
      this.tools.append(button);
      return button;
    });
    this.refresh();
  }
  refresh() {
    if (this.selectedTower) this.refreshUpgrade(this.selectedTower);
    this.counter.textContent = `材料 ◆ ${this.stock}`;
    this.refreshBuildButtons();
  }
  siteOccupied() {
    return this.towers.some(t => this.overlaps(t, this.scene.player, halfTower)) || !this.clearScenery(this.scene.player, halfTower);
  }
  refreshBuildButtons() {
    const blocked = this.scene.mode !== "play" || this.siteOccupied();
    this.buttons.forEach((button, i) => {
      const disabled = blocked || this.stock < types[i].cost;
      if (button.disabled !== disabled) button.disabled = disabled;
    });
  }
  buildAtPlayer(type) {
    if (this.scene.mode !== "play" || this.stock < type.cost) return;
    const p = this.scene.player;
    if (this.siteOccupied()) {
      this.counter.textContent = `此处无法建造 · ◆ ${this.stock}`;
      return;
    }
    this.exitTower = this.build(type, p);
  }
  overlaps(tower, actor, radius) {
    return circlesOverlap(tower, halfTower, actor, radius);
  }
  clearScenery(point, radius) {
    return !(this.scene.world?.solids || []).some(s => circlesOverlap(s,s.radius,point,radius));
  }
  move(actor, dx, dy, radius) {
    let obstacles = this.towers;
    if (actor === this.scene.player && this.exitTower) {
      obstacles = obstacles.filter(t => t !== this.exitTower);
    }
    const reach = radius + Math.abs(dx) + Math.abs(dy) + 2;
    const nearby = (this.scene.world?.solids || []).filter(s =>
      Math.abs(s.x-actor.x) <= s.radius+reach && Math.abs(s.y-actor.y) <= s.radius+reach);
    moveCircle(actor, dx, dy, radius, nearby.length ? obstacles.concat(nearby) : obstacles, this.width, this.height);
    if (actor === this.scene.player && this.exitTower && !this.overlaps(this.exitTower, actor, radius)) {
      this.exitTower = null;
    }
  }
  confine(sprite, padding) {
    sprite.x = clamp(sprite.x, padding, this.width - padding);
    sprite.y = clamp(sprite.y, padding, this.height - padding);
  }
  spawn(dx, dy, radius = 55) {
    const margin = Math.max(60, radius);
    const player = this.scene.player;
    const reflect = (pos, delta, size) =>
      pos + delta < margin || pos + delta > size - margin ? pos - delta : pos + delta;
    const point = {
      x: clamp(reflect(player.x, dx, this.width), margin, this.width - margin),
      y: clamp(reflect(player.y, dy, this.height), margin, this.height - margin),
    };
    const clear = (p) =>
      this.towers.every((tower) => !this.overlaps(tower, p, radius)) && this.clearScenery(p,radius);
    if (clear(point)) return point;
    let closest = null,
      distance = Infinity;
    for (let x = margin; x <= this.width - margin; x += 64)
      for (let y = margin; y <= this.height - margin; y += 64) {
        const candidate = { x, y },
          d = this.scene.distance(point, candidate);
        if (d < distance && clear(candidate)) {
          closest = candidate;
          distance = d;
        }
      }
    return closest;
  }
  build(type, point) {
    const { x, y } = point,
      scene = this.scene;
    const key = ["tower-rapid", "tower-frost", "tower-blast"][
      types.indexOf(type)
    ];
    const base = scene.add.image(x, y - 12, key).setDepth(3);
    const barrel = scene.add.graphics({ x, y: y - 30 }).setDepth(4);
    const outline = 0x37322a;
    if (type.element === "physical") {
      for (const offset of [-5, 3]) {
        barrel.fillStyle(outline).fillRect(0, offset-2, 32, 7)
          .fillStyle(type.color).fillRect(2, offset, 27, 3);
      }
    } else if (type.element === "fire") {
      barrel.fillStyle(outline).fillRoundedRect(-5,-8,33,16,3)
        .fillStyle(0xbd7752).fillRect(1,-5,21,10)
        .fillStyle(outline).fillRect(21,-10,10,20)
        .fillStyle(0xffb96b).fillRect(27,-6,3,12);
    }
    const label = scene.add
      .text(x, y - 55, "", {
        fontFamily: "Arial, Microsoft YaHei, sans-serif",
        fontSize: "11px",
        color: "#fff2d0",
        stroke: "#302b25",
        strokeThickness: 3,
      })
      .setOrigin(0.5, 1)
      .setDepth(9);
    const tower = {
      x,
      y,
      type,
      barrel,
      s: base,
      label,
      level: 1,
      lifetime: 60,
      r: halfTower,
      remaining: 0,
    };
    this.towers.push(tower);
    this.updateLabel(tower);
    this.stock -= type.cost;
    this.refresh();
    scene.effect(
      scene.add.circle(x, y, 32).setStrokeStyle(4, type.color).setDepth(7),
      0.4,
      0,
      0,
      1.5,
    );
    return tower;
  }
  drop(enemy) {
    if (enemy.lootDropped) return;
    enemy.lootDropped = true;
    const value = materialDrop(enemy, this.scene.build.random());
    if (enemy.boss || (enemy.elite && this.scene.build.random() < 0.25)) {
      const type = mounts[Math.floor(this.scene.build.random() * mounts.length)];
      const sprite = this.scene.add.image(enemy.s.x - 20, enemy.s.y, "mount-" + type.id)
        .setDisplaySize(60, 42).setDepth(3);
      this.confine(sprite, 30);
      this.drops.push({ kind: "mount", type, sprite });
    }
    if (enemy.final) {
      this.stock += value;
      this.refresh();
      return;
    }
    const roll = this.scene.build.random();
    const kind = roll < 0.045 ? "health" : roll < 0.055 ? "magnet" : null;
    if (kind) {
      const sprite = this.scene.add.image(enemy.s.x + 12, enemy.s.y, "drop-" + kind)
        .setDisplaySize(44, 44).setDepth(3.1);
      this.confine(sprite, 22);
      this.drops.push({ sprite, kind });
    }
    if (!value) return;
    const sprite = this.scene.add
      .rectangle(enemy.s.x, enemy.s.y, 12, 12, 0xfac969)
      .setAngle(45)
      .setStrokeStyle(2, 0x725527)
      .setDepth(3);
    this.confine(sprite, 12);
    this.drops.push({ sprite, value });
  }
  updateLabel(tower) {
    const cost = tower.type.cost + tower.level - 1;
    tower.label.setText(tower.level === 5 ? "Lv.5 · 永久" :
      `Lv.${tower.level} · ${Math.ceil(tower.lifetime)}秒 · 升级◆${cost}`);
  }
  selectTower(tower) {
    clearTimeout(this.upgradeTimer);
    this.selectedTower = tower;
    this.upgradeButton.hidden = !tower;
    if (!tower) return;
    this.refreshUpgrade(tower);
    this.positionUpgrade();
    this.upgradeTimer = setTimeout(() => this.selectTower(null), 2000);
  }
  refreshUpgrade(tower) {
    const cost = tower.type.cost + tower.level - 1;
    const full = tower.level >= 5;
    this.upgradeButton.disabled = full || this.stock < cost;
    this.upgradeButton.textContent = full ? "已满级" : `↑ 升级 ◆${cost}`;
  }
  positionUpgrade() {
    if (!this.selectedTower) return;
    const view = this.scene.cameras.main.worldView;
    this.upgradeButton.style.left = (this.selectedTower.x - view.x) / view.width * 100 + "%";
    this.upgradeButton.style.top = (this.selectedTower.s.y - view.y) / view.height * 100 + "%";
  }
  towerAtPointer(event) {
    if (this.scene.mode !== "play") return false;
    const box = event.target.getBoundingClientRect();
    const scale = this.scene.scale;
    const point = this.scene.cameras.main.getWorldPoint(
      (event.clientX - box.left) * scale.width / box.width,
      (event.clientY - box.top) * scale.height / box.height
    );
    return this.towers.find(t => this.scene.distance(t, point) <= halfTower ||
      (Math.abs(t.x - point.x) <= 24 && point.y >= t.y - 53 && point.y <= t.y));
  }
  upgradeTower(tower) {
    const cost = tower.type.cost + tower.level - 1;
    if (tower.level >= 5 || this.stock < cost) return;
    this.stock -= cost;
    tower.level++;
    tower.lifetime = tower.level === 5 ? Infinity : 60 * tower.level;
    this.updateLabel(tower);
    this.refresh();
  }
  destroyTower(tower) {
    const index = this.towers.indexOf(tower);
    if (index < 0) return;
    if (this.selectedTower === tower) this.selectTower(null);
    this.towers.splice(index, 1);
    if (this.exitTower === tower) this.exitTower = null;
    this.scene.tweens.killTweensOf(tower.barrel);
    for (const part of [
      tower.s,
      tower.barrel,
      tower.label,
    ])
      part.destroy();
    this.scene.burst(tower.x, tower.y, 0xa98b64, 12, 120);
    this.scene.effect(
      this.scene.add
        .circle(tower.x, tower.y, 32)
        .setStrokeStyle(4, 0xef9471)
        .setDepth(7),
      0.35,
      0,
      0,
      2,
    );
  }
  update(dt) {
    const scene = this.scene, player = scene.player;
    if (scene.mode !== "play") return;
    this.refreshBuildButtons();
    for (let i = this.drops.length - 1; i >= 0; i--) {
      const drop = this.drops[i];
      const { sprite, value, kind } = drop,
        d = scene.distance(sprite, player);
      if (!kind && d < BALANCE.player.pickup * scene.build.pickupMultiplier)
        startPickupFlight(sprite, player);
      if (sprite.pickupFlight || (kind && d < 24)) {
        if (sprite.pickupFlight && !advancePickupFlight(sprite, player, dt)) continue;
        sprite.destroy();
        this.drops.splice(i, 1);
        if (!kind) {
          this.stock += value;
          this.refresh();
        } else if (kind === "mount") {
          ride(scene, drop.type);
        } else if (kind === "magnet") {
          for (const gem of scene.gems) startPickupFlight(gem, player);
          for (const other of this.drops) startPickupFlight(other.sprite, player);
        } else if (kind === "health") {
          scene.hp = Math.min(scene.maxHp, scene.hp + 25);
          scene.sync();
        }
      } else if (d < BALANCE.player.pickup * scene.build.pickupMultiplier) {
        sprite.x += ((player.x - sprite.x) / d) * 300 * dt;
        sprite.y += ((player.y - sprite.y) / d) * 300 * dt;
      }
    }
    for (const tower of [...this.towers]) {
      if (scene.mode !== "play") break;
      tower.lifetime -= dt;
      if (tower.lifetime <= 0) {
        this.destroyTower(tower);
        continue;
      }
      this.updateLabel(tower);
      const rank = tower.level - 1;
      tower.remaining -= dt;
      if (tower.remaining > 0) continue;
      const { type, x, y } = tower;
      let target = null,
        nearest = type.range * (1 + 0.10 * rank);
      for (const enemy of scene.enemies) {
        const d = scene.distance(tower, enemy.s);
        if (d <= nearest) {
          target = enemy;
          nearest = d;
        }
      }
      if (!target) continue;
      tower.remaining = type.cooldown * (1 - 0.08 * rank) * (1 - scene.build.haste);
      const impact = { x: target.s.x, y: target.s.y };
      const pivotY = tower.barrel.y;
      const angle = Math.atan2(impact.y - pivotY, impact.x - x);
      tower.barrel.setRotation(angle);
      const reach = type.element === "ice" ? 0 : 31;
      const muzzleX = x + reach * Math.cos(angle),
        muzzleY = pivotY + reach * Math.sin(angle);
      scene.effect(
        scene.add.circle(muzzleX, muzzleY, 8, type.color).setDepth(7),
        0.16,
        0,
        0,
        1,
      );
      const shot = scene.add
        .graphics()
        .setDepth(7)
        .lineStyle(3, type.color)
        .lineBetween(muzzleX, muzzleY, impact.x, impact.y);
      shot.lineStyle(1.5, 0xfff4d3).lineBetween(muzzleX, muzzleY, impact.x, impact.y);
      const blastRadius = type.blastRadius ? type.blastRadius + 5 * rank : 0;
      if (type.element === "ice") {
        for (let i=1; i<=4; i++) {
          const px = muzzleX + (impact.x-muzzleX)*i/5, py = muzzleY + (impact.y-muzzleY)*i/5;
          shot.fillStyle(type.color).fillTriangle(px-4,py,px,py-8,px+4,py).fillTriangle(px-4,py,px,py+5,px+4,py);
        }
      } else if (blastRadius) {
        shot.fillStyle(type.color,.17).fillCircle(impact.x,impact.y,blastRadius)
          .lineStyle(4,type.color,.85).strokeCircle(impact.x,impact.y,blastRadius)
          .lineStyle(2,0xffdc87).strokeCircle(impact.x,impact.y,blastRadius*.64);
      } else {
        shot.lineStyle(2,type.color).strokeCircle(impact.x,impact.y,9);
      }
      scene.effect(shot, 0.19);
      scene.tweens.add({
        targets: tower.barrel,
        scaleX: 0.82,
        duration: 65,
        yoyo: true,
      });
      if (blastRadius) {
        scene.impact(impact.x, impact.y, type.color, false, true);
        for (const enemy of [...scene.enemies])
          if (scene.distance(impact, enemy.s) <= blastRadius + (enemy.r || 0))
            scene.combat.damage(
              enemy,
              type.damage * (1 + 0.25 * rank) * scene.build.power,
              type.element,
            );
      } else {
        if (type.element === "ice") {
          target.chilledUntil = scene.combat.time + 1.65;
        }
        scene.combat.damage(
          target,
          type.damage * (1 + 0.25 * rank) * scene.build.power,
          type.element,
        );
      }
    }
  }
}
