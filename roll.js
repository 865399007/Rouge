import { BALANCE } from "./balance.js";

// Uses simulation time so every pause freezes both movement and cooldown.
export class Roll {
  constructor(scene) {
    this.scene = scene;
    this.cooldown = 0;
    this.remaining = 0;
    this.facing = { x: 1, y: 0 };
    this.direction = { ...this.facing };
    this.trailClock = 0;
    this.button = document.getElementById("roll");
    this.button.onpointerdown = (event) => {
      if (event.button !== 0) return;
      event.preventDefault();
      this.start();
    };
    this.button.onclick = (event) => {
      if (!event.detail) this.start();
    };
    const onKey = (event) => {
      if (!event.repeat && !event.target.closest("input,textarea"))
        this.start();
    };
    scene.input.keyboard.on("keydown-SHIFT", onKey);
    scene.events.once("shutdown", () => {
      scene.input.keyboard.off("keydown-SHIFT", onKey);
      this.button.onpointerdown = this.button.onclick = null;
    });
    this.sync();
  }
  start() {
    if (this.scene.mode !== "play" || this.cooldown > 0 || this.remaining > 0)
      return false;
    const input = this.scene.movementInput();
    const length = Math.hypot(input.x, input.y);
    if (length) this.facing = { x: input.x / length, y: input.y / length };
    this.direction = { ...this.facing };
    this.remaining = BALANCE.roll.duration;
    this.cooldown = this.scene.build.rollCooldown;
    this.scene.invincible = Math.max(this.scene.invincible, this.remaining);
    this.trailClock = 0;
    this.sync();
    return true;
  }
  step(dt, input) {
    this.cooldown = Math.max(0, this.cooldown - dt);
    if (this.cooldown < 1e-8) this.cooldown = 0;
    if (this.remaining <= 0) {
      const length = Math.hypot(input.x, input.y);
      if (length) this.facing = { x: input.x / length, y: input.y / length };
      this.sync();
      return false;
    }
    const seconds = Math.min(dt, this.remaining);
    const distance = (BALANCE.roll.distance * seconds) / BALANCE.roll.duration;
    this.scene.defenses.move(
      this.scene.player,
      this.direction.x * distance,
      this.direction.y * distance,
      25,
    );
    this.remaining = Math.max(0, this.remaining - dt);
    if (this.remaining < 1e-8) this.remaining = 0;
    // Include the final movement step; contact checks happen after this method.
    this.scene.invincible = Math.max(this.scene.invincible, dt);
    const progress = 1 - this.remaining / BALANCE.roll.duration;
    this.scene.player.rotation =
      progress * Math.PI * 2 * (this.direction.x < 0 ? -1 : 1);
    this.trailClock -= dt;
    if (this.trailClock <= 0) {
      this.trailClock = 0.06;
      const p = this.scene.player;
      const ghost = this.scene.add
        .image(p.x, p.y, p.texture.key)
        .setScale(p.scaleX, p.scaleY)
        .setRotation(p.rotation)
        .setTint(0xffe4a0)
        .setAlpha(0.32)
        .setDepth(3);
      this.scene.effect(ghost, 0.23, -this.direction.x*42, -this.direction.y*42);
    }
    this.sync();
    return true;
  }
  sync() {
    this.button.disabled = this.scene.mode !== "play" || this.cooldown > 0;
    this.button.classList.toggle("is-ready", this.cooldown === 0);
    this.button.style.setProperty(
      "--roll-ready",
      `${(1 - this.cooldown / this.scene.build.rollCooldown) * 100}%`,
    );
    this.button.setAttribute(
      "aria-label",
      this.cooldown > 0
        ? `翻滚，冷却 ${this.cooldown.toFixed(1)} 秒`
        : `翻滚，冷却 ${this.scene.build.rollCooldown} 秒，期间无敌，快捷键 Shift`,
    );
  }
}
