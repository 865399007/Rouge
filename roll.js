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
    this.remaining = BALANCE.roll.duration;
    this.cooldown = this.scene.build.rollCooldown;
    this.sync();
    return true;
  }
  step(dt) {
    const boosted = Math.min(dt, this.remaining);
    this.cooldown = Math.max(0, this.cooldown - dt);
    this.remaining = Math.max(0, this.remaining - dt);
    this.sync();
    return dt + boosted * BALANCE.roll.speedBonus;
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
        ? `疾跑，冷却 ${this.cooldown.toFixed(1)} 秒`
        : `疾跑，冷却 ${this.scene.build.rollCooldown} 秒，移速提升30%，持续5秒，快捷键 Shift`,
    );
  }
}
