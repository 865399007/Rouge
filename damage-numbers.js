// Aggregate rapid hits per enemy/channel while keeping an explicit object budget.
export class DamageNumbers {
  constructor(scene) {
    this.scene = scene;
    this.items = [];
    this.pending = new WeakMap();
  }
  add(
    enemy,
    amount,
    { crit = false, dot = false, element = "physical", structure = false } = {},
  ) {
    if (amount <= 0 || !Number.isFinite(amount)) return;
    const now = this.scene.combat.time,
      key = dot ? "dot" : crit ? "crit" : "normal";
    let channels = this.pending.get(enemy);
    if (!channels) {
      channels = {};
      this.pending.set(enemy, channels);
    }
    const old = channels[key];
    if (old && old.sprite.active && now - old.created < 0.12) {
      old.amount += amount;
      old.sprite.setText(
        `${crit ? "暴击 " : ""}${Math.max(1, Math.round(old.amount))}`,
      );
      return;
    }
    if (this.items.length >= 64) this.items.shift().sprite.destroy();
    const colors = { poison: "#c2ee80", fire: "#ffbb82", shadow: "#e2b0ed" };
    const sprite = this.scene.add
      .text(
        enemy.s.x + ((this.items.length % 3) - 1) * 13,
        enemy.s.y - enemy.r - (structure ? 38 : 8),
        `${crit ? "暴击 " : ""}${Math.max(1, Math.round(amount))}`,
        {
          fontFamily: "Arial, Microsoft YaHei, sans-serif",
          fontSize: crit ? "20px" : dot ? "13px" : "16px",
          fontStyle: "bold",
          color: structure
            ? "#ff9a80"
            : crit
              ? "#ffe27b"
              : dot
                ? colors[element] || "#c8d5ef"
                : "#fff7dd",
          stroke: "#302b25",
          strokeThickness: 3,
        },
      )
      .setOrigin(0.5, 1)
      .setDepth(16);
    const item = {
      sprite,
      created: now,
      amount,
      life: crit ? 0.8 : 0.62,
      total: crit ? 0.8 : 0.62,
    };
    channels[key] = item;
    this.items.push(item);
  }
  update(dt) {
    this.items = this.items.filter((item) => {
      item.life -= dt;
      if (item.life <= 0 || !item.sprite.active) {
        item.sprite.destroy();
        return false;
      }
      item.sprite.y -= 34 * dt;
      item.sprite.setAlpha(Math.min(1, item.life / 0.22));
      return true;
    });
  }
  destroy() {
    for (const item of this.items) item.sprite.destroy();
    this.items = [];
    this.pending = new WeakMap();
  }
}
