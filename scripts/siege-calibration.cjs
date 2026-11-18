const { chromium } = require("./playwright-runtime.cjs");
const { writeFileSync, mkdirSync } = require("node:fs");
(async () => {
  const browser = await chromium.launch({ headless: true, channel: "msedge" });
  try {
    const page = await browser.newPage();
    await page.goto("http://127.0.0.1:5173/?debug");
    await page.getByRole("button", { name: /出发，守住/ }).click();
    await page.locator(".choice-card").filter({ hasText: "游侠" }).click();
    const results = await page.evaluate(async () => {
      const { TOWER_TUNING, enemyStats, eliteStats, bossStats } =
        await import("/balance.js");
      const s = __game.scene.getScene("garden");
      s.scene.pause();
      const results = [];
      for (const seconds of [0, 180, 480])
        for (const type of TOWER_TUNING) {
          for (const scenario of ["single", "three", "elite", "boss"]) {
            s.enemies.forEach((e) => e.s.destroy());
            s.enemies = [];
            s.hostile.forEach((b) => b.s.destroy());
            s.hostile = [];
            for (const t of [...s.defenses.towers]) s.defenses.destroyTower(t);
            s.damageNumbers.destroy();
            s.mode = "play";
            s.runTime = seconds;
            s.combat.time = 0;
            s.invincible = 999;
            s.bossTimes = [];
            s.spawnClock = 999;
            s.nextEliteAt = 999;
            s.weaponClock = 999;
            s.player.setPosition(500, 1000);
            s.defenses.stock = 100;
            s.defenses.build(type, { x: 1000, y: 1000 });
            const tower = s.defenses.towers[0];
            tower.remaining = 999; // No return fire/support: sustained incoming pressure only.
            const hp = tower.hp;
            const stat =
              scenario === "boss"
                ? bossStats(seconds === 0 ? 0 : seconds === 180 ? 2 : 7)
                : scenario === "elite"
                  ? eliteStats(seconds)
                  : enemyStats("bug", seconds);
            const count = scenario === "three" ? 3 : 1;
            for (let i = 0; i < count; i++) {
              const angle = (i * Math.PI * 2) / count,
                r = stat.r + 32;
              s.enemies.push({
                ...stat,
                s: s.add.image(
                  1000 + Math.cos(angle) * r,
                  1000 + Math.sin(angle) * r,
                  "bug",
                ),
              });
            }
            for (let i = 0; i < 2700 && tower.hp > 0; i++) s.step(0, 1000 / 30);
            results.push({
              minute: seconds / 60,
              tower: type.name,
              hp,
              scenario,
              destroyedIn:
                tower.hp <= 0
                  ? Math.round((s.runTime - seconds) * 10) / 10
                  : null,
            });
          }
        }
      return results;
    });
    mkdirSync("artifacts", { recursive: true });
    writeFileSync(
      "artifacts/siege-calibration.json",
      JSON.stringify(
        {
          note: "Real scene simulation; towers and hero do not return fire. Measures sustained siege pressure, not actual player survival or win rate.",
          results,
        },
        null,
        2,
      ),
    );
    console.table(results);
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
