import { mounts, ride } from "./mounts.js";
import { BALANCE, TOWER_TUNING, materialDrop } from "./balance.js";
import {
  TOWER_RADIUS,
  circlesOverlap,
  moveCircle,
} from "./geometry.js";
const types = TOWER_TUNING;
const halfTower = TOWER_RADIUS;
const reach = 200;
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

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
      .setStrokeStyle(8, 0xe4ce8f)
      .setDepth(0);
    this.stock = BALANCE.initialMaterials;
    this.towers = [];
    this.drops = [];
    this.preview = scene.add.graphics().setDepth(12);
    this.tools = document.getElementById("tower-tools");
    this.tools.replaceChildren();
    this.counter = document.createElement("output");
    this.tools.append(this.counter);
    this.wheel = document.createElement("div");
    this.wheel.className = "placement-wheel";
    this.wheel.hidden = true;
    this.knob = document.createElement("i");
    this.wheel.append(this.knob);
    this.tools.append(this.wheel);
    this.buttons = types.map((type) => {
      const button = document.createElement("button");
      button.innerHTML = `<img src="./assets/${["tower-rapid", "tower-frost", "tower-blast"][types.indexOf(type)]}.svg" alt=""><span>${type.name}<small>${type.cost} 材料 · 60 秒</small></span>`;
      button.setAttribute(
        "aria-label",
        `${type.name}，${type.cost} 材料，按住拖动建造`,
      );
      button.title = "按住后在轮盘上拖动选址，松手建造";
      this.tools.append(button);
      button.onpointerdown = (event) => {
        if (scene.mode !== "play" || this.drag || event.button !== 0) return;
        event.preventDefault();
        button.setPointerCapture(event.pointerId);
        this.drag = {
          id: event.pointerId,
          button,
          type,
          startX: event.clientX,
          startY: event.clientY,
          x: event.clientX,
          y: event.clientY,
        };
        scene.beginPlacement();
        this.wheel.style.top =
          button.offsetTop + button.offsetHeight / 2 + "px";
        this.wheel.hidden = false;
        this.drawPreview();
      };
      button.onpointermove = (event) => {
        if (this.drag?.id !== event.pointerId) return;
        Object.assign(this.drag, { x: event.clientX, y: event.clientY });
        this.drawPreview();
      };
      button.onpointerup = (event) => {
        if (this.drag?.id !== event.pointerId) return;
        Object.assign(this.drag, { x: event.clientX, y: event.clientY });
        const point = this.location();
        const moved =
          Math.hypot(
            event.clientX - this.drag.startX,
            event.clientY - this.drag.startY,
          ) >= 4;
        if (moved && scene.mode === "placement" && point && this.valid(point))
          this.build(type, point);
        this.cancel();
      };
      button.onlostpointercapture = button.onpointercancel = (event) => {
        if (this.drag?.id === event.pointerId) this.cancel();
      };
      return button;
    });
    const tip = document.createElement("small");
    tip.className = "build-tip";
    tip.textContent = "松手建造 · 点塔升级";
    this.tools.append(tip);
    this.refresh();
    const cancelOnBlur = () => this.cancel();
    const cancelWhenHidden = () => {
      if (document.hidden) this.cancel();
    };
    window.addEventListener("blur", cancelOnBlur);
    window.addEventListener("resize", cancelOnBlur);
    document.addEventListener("visibilitychange", cancelWhenHidden);
    scene.events.once("shutdown", () => {
      window.removeEventListener("blur", cancelOnBlur);
      window.removeEventListener("resize", cancelOnBlur);
      document.removeEventListener("visibilitychange", cancelWhenHidden);
    });
  }
  refresh() {
    this.counter.innerHTML = `<span>防御工坊</span><b>◆ ${this.stock}</b>`;
    this.buttons.forEach((button, i) => {
      button.disabled = this.stock < types[i].cost;
      button.querySelector("small").innerHTML =
        `材料 ${types[i].cost}<br>持续 60 秒`;
    });
  }
  cancel() {
    const drag = this.drag;
    this.drag = null;
    this.wheel.hidden = true;
    this.preview.clear();
    if (drag?.button?.hasPointerCapture(drag.id))
      drag.button.releasePointerCapture(drag.id);
    this.scene.endPlacement();
  }
  location() {
    const rect = this.wheel.getBoundingClientRect();
    const radius = rect.width / 2;
    const dx = this.drag.x - rect.left - radius;
    const dy = this.drag.y - rect.top - radius;
    if (!radius || Math.hypot(dx, dy) > radius) {
      this.knob.style.transform = "translate(-50%, -50%)";
      return null;
    }
    this.knob.style.transform = `translate(-50%, -50%) translate(${dx}px, ${dy}px)`;
    const player = this.scene.player;
    return {
      x: player.x + (dx / radius) * reach,
      y: player.y + (dy / radius) * reach,
    };
  }
  valid(point) {
    return (
      this.stock >= this.drag.type.cost &&
      point.x >= halfTower &&
      point.y >= halfTower &&
      point.x <= this.width - halfTower &&
      point.y <= this.height - halfTower &&
      !this.overlaps(point, this.scene.player, 25) &&
      this.scene.enemies.every(
        (enemy) => !this.overlaps(point, enemy.s, enemy.r),
      ) &&
      this.towers.every((tower) => !this.overlaps(tower, point, halfTower + 4))
    );
  }
  overlaps(tower, actor, radius) {
    return circlesOverlap(tower, halfTower, actor, radius);
  }
  move(actor, dx, dy, radius) {
    moveCircle(actor, dx, dy, radius, this.towers, this.width, this.height);
  }
  drawPreview() {
    if (!this.drag) return;
    const point = this.location(),
      player = this.scene.player;
    this.preview
      .clear()
      .lineStyle(2, 0xd7efdc, 0.8)
      .strokeCircle(player.x, player.y, reach);
    if (!point) return;
    const color = this.valid(point) ? 0x90f4aa : 0xff7777;
    this.preview
      .fillStyle(color, 0.12)
      .fillCircle(point.x, point.y, this.drag.type.range)
      .lineStyle(2, color, 0.3)
      .strokeCircle(point.x, point.y, this.drag.type.range)
      .fillStyle(color, 0.5)
      .fillCircle(point.x, point.y, halfTower)
      .lineStyle(3, 0x292822, 1)
      .strokeCircle(point.x, point.y, halfTower);
  }

  confine(sprite, padding) {
    sprite.x = clamp(sprite.x, padding, this.width - padding);
    sprite.y = clamp(sprite.y, padding, this.height - padding);
  }
  spawn(dx, dy) {
    const player = this.scene.player;
    const reflect = (pos, delta, size) =>
      pos + delta < 60 || pos + delta > size - 60 ? pos - delta : pos + delta;
    const point = {
      x: clamp(reflect(player.x, dx, this.width), 60, this.width - 60),
      y: clamp(reflect(player.y, dy, this.height), 60, this.height - 60),
    };
    const clear = (p) =>
      this.towers.every((tower) => !this.overlaps(tower, p, 55));
    if (clear(point)) return point;
    let closest = null,
      distance = Infinity;
    for (let x = 60; x <= this.width - 60; x += 64)
      for (let y = 60; y <= this.height - 60; y += 64) {
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
    const base = scene.add.image(x, y + 2, key).setDepth(3);
    const barrel = scene.add.graphics({ x, y }).setDepth(4);
    barrel.fillStyle(0x292822).fillRoundedRect(4, -8, 37, 16, 4);
    barrel.fillStyle(type.color).fillRoundedRect(6, -5, 32, 10, 2);
    barrel.fillStyle(0x657163).fillRect(31, -5, 6, 10);
    const hub = scene.add
      .circle(x, y, 10, 0xe5d6ab)
      .setStrokeStyle(3, 0x292822)
      .setDepth(5);
    const label = scene.add
      .text(x, y - 34, "", {
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
      hub,
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
  }
  drop(enemy) {
    const value = materialDrop(enemy);
    if (enemy.lootDropped) return;
    enemy.lootDropped = true;
    if ((enemy.elite || enemy.boss) && this.scene.build.random() < (enemy.boss ? 0.55 : 0.25)) {
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
      const sprite = this.scene.add.text(enemy.s.x + 12, enemy.s.y,
        kind === "health" ? "✚" : "🧲", { fontSize: "24px", color: "#fff", backgroundColor: kind === "health" ? "#a53236" : "#493e33" }
      ).setOrigin(0.5).setDepth(3);
      this.confine(sprite, 14);
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
  tapTower(event) {
    if (this.scene.mode !== "play") return false;
    const box = event.target.getBoundingClientRect();
    const scale = this.scene.scale;
    const point = this.scene.cameras.main.getWorldPoint(
      (event.clientX - box.left) * scale.width / box.width,
      (event.clientY - box.top) * scale.height / box.height
    );
    const tower = this.towers.find(t => this.scene.distance(t, point) <= halfTower);
    if (!tower) return false;
    this.upgradeTower(tower);
    return true;
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
    this.towers.splice(index, 1);
    this.scene.tweens.killTweensOf(tower.barrel);
    for (const part of [
      tower.s,
      tower.barrel,
      tower.hub,
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
    this.drawPreview();
    for (let i = this.drops.length - 1; i >= 0; i--) {
      const drop = this.drops[i];
      const { sprite, value, kind } = drop,
        d = scene.distance(sprite, player);
      if (!kind && (drop.flight || drop.magnetized || d < BALANCE.player.pickup * scene.build.pickupMultiplier)) {
        drop.flight ??= { x: sprite.x, y: sprite.y, elapsed: 0,
          duration: clamp(d / 550, 0.28, 0.8) };
        const flight = drop.flight;
        flight.elapsed += dt;
        const t = Math.min(1, flight.elapsed / flight.duration);
        const progress = t * t;
        sprite.x = flight.x + (player.x - flight.x) * progress;
        sprite.y = flight.y + (player.y - flight.y) * progress - Math.sin(Math.PI * t) * 24;
        if (t < 1) continue;
        sprite.destroy();
        this.drops.splice(i, 1);
        this.stock += value;
        this.refresh();
      } else if (kind && d < 24) {
        sprite.destroy();
        this.drops.splice(i, 1);
        if (kind === "mount") {
          ride(scene, drop.type);
        } else if (kind === "magnet") {
          for (const gem of scene.gems) gem.setPosition(player.x, player.y);
          for (const other of this.drops) {
            if (other.kind) other.sprite.setPosition(player.x, player.y);
            else other.magnetized = true;
          }
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
      const angle = Math.atan2(impact.y - y, impact.x - x);
      tower.barrel.setRotation(angle);
      const muzzleX = x + 38 * Math.cos(angle),
        muzzleY = y + 38 * Math.sin(angle);
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
      if (type.element === "ice") {
        for (let i=1; i<=4; i++) {
          const px = muzzleX + (impact.x-muzzleX)*i/5, py = muzzleY + (impact.y-muzzleY)*i/5;
          shot.fillStyle(type.color).fillTriangle(px-4,py,px,py-8,px+4,py).fillTriangle(px-4,py,px,py+5,px+4,py);
        }
      } else if (type.element === "fire") {
        shot.lineStyle(4,type.color,0.8).strokeCircle(impact.x,impact.y,45)
          .lineStyle(2,0xffdc87).strokeCircle(impact.x,impact.y,66);
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
      if (type === types[2]) {
        scene.impact(impact.x, impact.y, type.color, false, true);
        for (const enemy of [...scene.enemies])
          if (scene.distance(impact, enemy.s) <= 70)
            scene.combat.damage(
              enemy,
              type.damage * (1 + 0.25 * rank) * scene.build.power,
              type.element,
            );
      } else {
        scene.combat.damage(
          target,
          type.damage * (1 + 0.25 * rank) * scene.build.power,
          type.element,
        );
      }
    }
  }
}
