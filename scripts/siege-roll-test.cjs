const { chromium } = require("./playwright-runtime.cjs");
const assert = require("node:assert/strict");

(async () => {
  const browser = await chromium.launch({ headless: true, channel: "msedge" });
  const page = await browser.newPage({
    viewport: { width: 1280, height: 800 },
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("http://127.0.0.1:5173/?debug");
  await page.getByRole("button", { name: /出发，守住/ }).click();
  await page.locator(".choice-card").filter({ hasText: "游侠" }).click();
  await page.waitForFunction(
    () => __game.scene.getScene("garden").mode === "play",
  );
  await page.evaluate(async () => {
    const s = __game.scene.getScene("garden");
    const tuning = await import("/balance.js");
    window.__tuning = tuning;
    s.scene.pause(); // Drive the real scene in exact simulation steps.
    window.__reset = () => {
      s.mode = "play";
      s.closePanel();
      for (const e of s.enemies) e.s.destroy();
      s.enemies = [];
      for (const b of s.hostile) b.s.destroy();
      s.hostile = [];
      for (const t of [...s.defenses.towers]) s.defenses.destroyTower(t);
      for (const d of s.defenses.drops) d.sprite.destroy();
      s.defenses.drops = [];
      for (const g of s.gems) g.destroy();
      s.gems = [];
      s.bossTimes = [];
      s.spawnClock = 999;
      s.weaponClock = 999;
      s.nextEliteAt = 999;
      s.runTime = 0;
      s.combat.time = 0;
      s.hp = s.maxHp;
      s.invincible = 0;
      s.xp = 0;
      s.player.setPosition(1000, 1000);
      s.roll.cooldown = 0;
      s.roll.remaining = 0;
      s.roll.facing = { x: 1, y: 0 };
      s.roll.sync();
      s.defenses.stock = 20;
      s.defenses.refresh();
    };
    window.__enemy = (x, y, stats = {}) => {
      const e = {
        ...tuning.enemyStats("bug", 0),
        ...stats,
        s: s.add.image(x, y, stats.kind || "bug").setDepth(4),
      };
      s.enemies.push(e);
      return e;
    };
    window.__ticks = (count) => {
      for (let i = 0; i < count; i++) s.step(0, 1000 / 30);
    };
    window.__tower = (x = 1150, y = 1000) => {
      s.defenses.build(tuning.TOWER_TUNING[0], { x, y });
      const t = s.defenses.towers.at(-1);
      t.remaining = 999;
      return t;
    };
    __reset();
  });
  const loot = await page.evaluate(() => {
    const s = __game.scene.getScene("garden");
    const normal = __enemy(1080, 1000, { hp: 1 });
    s.hit(normal, 100);
    const ordinaryDrops = s.defenses.drops.length;
    const elite = __enemy(1080, 1000, { ...__tuning.eliteStats(25), hp: 1 });
    s.hit(elite, 100);
    const boss = __enemy(1080, 1000, { ...__tuning.bossStats(0), hp: 1 });
    s.hit(boss, 100);
    const values = s.defenses.drops.map((d) => d.value);
    for (let i = 0; i < 20; i++) s.defenses.update(1 / 30);
    return {
      ordinaryDrops,
      values,
      stock: s.defenses.stock,
      left: s.defenses.drops.length,
    };
  });
  assert.deepEqual(loot, {
    ordinaryDrops: 0,
    values: [1, 3],
    stock: 24,
    left: 0,
  });
  const spawning = await page.evaluate(() => {
    __reset();
    const s = __game.scene.getScene("garden");
    s.runTime = 24.9;
    s.nextEliteAt = 25;
    s.spawnClock = 0;
    __ticks(1);
    const early = s.enemies.filter((e) => e.elite).length;
    s.runTime = 25;
    s.spawnClock = 0;
    __ticks(1);
    return {
      early,
      elites: s.enemies.filter((e) => e.elite).length,
      next: s.nextEliteAt,
    };
  });
  assert.equal(spawning.early, 0);
  assert.equal(spawning.elites, 1);
  assert.ok(spawning.next >= 55);
  const siege = await page.evaluate(() => {
    __reset();
    const s = __game.scene.getScene("garden");
    const tower = __tower();
    const e = __enemy(1250, 1000, { hp: 9999, maxHp: 9999 });
    __ticks(36);
    const afterMelee = tower.hp,
      targeting = e.towerTarget === tower;
    const beforePause = tower.hp;
    s.beginPlacement();
    __ticks(60);
    const duringPause = tower.hp;
    s.endPlacement();
    e.frozenUntil = s.combat.time + 10;
    __ticks(40);
    const frozenHp = tower.hp;
    e.frozenUntil = 0;
    e.s.setPosition(1400, 1000);
    e.ranged = true;
    e.speed = 0;
    e.shot = 0;
    __ticks(44);
    const afterRanged = tower.hp;
    e.ranged = false;
    e.boss = true;
    e.shot = 0;
    __ticks(44);
    const afterBoss = tower.hp;
    s.defenses.damage(tower, 9999);
    __ticks(1);
    return {
      afterMelee,
      targeting,
      beforePause,
      duringPause,
      frozenHp,
      afterRanged,
      afterBoss,
      destroyed: s.defenses.towers.length === 0,
      spritesGone: [
        tower.s,
        tower.barrel,
        tower.hub,
        tower.health,
        tower.label,
      ].every((p) => !p.active),
      retargeted: e.towerTarget === null,
      playerHp: s.hp,
    };
  });
  assert.equal(siege.targeting, true);
  assert.ok(siege.afterMelee < 180);
  assert.equal(siege.beforePause, siege.duringPause);
  assert.equal(siege.frozenHp, siege.beforePause);
  assert.ok(siege.afterRanged < siege.frozenHp);
  assert.ok(siege.afterBoss < siege.afterRanged);
  assert.equal(siege.destroyed, true);
  assert.equal(siege.spritesGone, true);
  assert.equal(siege.retargeted, true);
  assert.equal(siege.playerHp, 85);
  const blocking = await page.evaluate(() => {
    __reset();
    const s = __game.scene.getScene("garden"),
      tower = __tower();
    s.hostile.push({
      s: s.add.image(1300, 1000, "orb"),
      vx: -12000,
      vy: 0,
      life: 4,
      damage: 25,
    });
    __ticks(1);
    return { hp: s.hp, tower: tower.hp, bullets: s.hostile.length };
  });
  assert.deepEqual(blocking, { hp: 85, tower: 155, bullets: 0 });
  // Use the actual persistent button, not just the start method.
  await page.evaluate(() => __reset());
  await page.locator("#roll").click();
  const rolling = await page.evaluate(() => {
    const s = __game.scene.getScene("garden");
    const e = __enemy(1000, 1000, { speed: 0, hp: 9999 });
    const startCooldown = s.roll.cooldown;
    for (let i = 0; i < 9; i++) {
      e.s.setPosition(s.player.x + 150 / 9, s.player.y);
      s.hostile.push({
        s: s.add.image(e.s.x, e.s.y, "orb"),
        vx: 0,
        vy: 0,
        life: 4,
        damage: 50,
      });
      __ticks(1);
    }
    const safeHp = s.hp,
      distance = s.player.x - 1000;
    s.hostile.forEach((b) => b.s.destroy());
    s.hostile = [];
    e.s.setPosition(s.player.x, s.player.y);
    __ticks(1);
    const afterRollHp = s.hp;
    s.enemies.forEach((e) => e.s.destroy());
    s.enemies = [];
    const cooldown = s.roll.cooldown;
    s.beginPlacement();
    __ticks(90);
    const pausedCooldown = s.roll.cooldown;
    s.endPlacement();
    __ticks(139);
    const earlyStart = s.roll.start();
    __ticks(1);
    return {
      startCooldown,
      safeHp,
      distance,
      afterRollHp,
      cooldown,
      pausedCooldown,
      earlyStart,
      ready: s.roll.cooldown === 0,
      remaining: s.roll.remaining,
    };
  });
  assert.equal(rolling.startCooldown, 5);
  assert.equal(rolling.safeHp, 85);
  assert.ok(Math.abs(rolling.distance - 150) < 0.01);
  assert.ok(rolling.afterRollHp < 85);
  assert.equal(rolling.cooldown, rolling.pausedCooldown);
  assert.equal(rolling.earlyStart, false);
  assert.equal(rolling.ready, true);
  await page.evaluate(() => {
    const s = __game.scene.getScene("garden");
    s.hitStopUntil = 0;
    s.scene.resume();
  });
  await page.keyboard.press("Shift");
  assert.ok(
    (await page.evaluate(() => __game.scene.getScene("garden").roll.cooldown)) >
      4.7,
  );
  await page.evaluate(() => __game.scene.getScene("garden").scene.pause());
  const collision = await page.evaluate(() => {
    __reset();
    const s = __game.scene.getScene("garden");
    __tower(1100, 1000);
    s.roll.start();
    __ticks(9);
    return s.player.x;
  });
  assert.ok(collision <= 1043.01);
  // Screenshot a deterministic encounter showing tower HP and the elite marker.
  await page.evaluate(() => {
    __reset();
    const s = __game.scene.getScene("garden");
    const tower = __tower(1120, 1060);
    s.defenses.damage(tower, 55);
    __enemy(1280, 1080, { ...__tuning.eliteStats(25), speed: 0, hp: 150 });
    s.scene.resume();
  });
  await page.waitForTimeout(160);
  await page.screenshot({ path: "artifacts/siege-roll-desktop.png" });
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 844, height: 390 },
  ]) {
    await page.setViewportSize(viewport);
    await page.waitForTimeout(100);
    await page.evaluate(() => {
      const s = __game.scene.getScene("garden");
      s.roll.cooldown = 0;
      s.roll.remaining = 0;
      s.roll.sync();
    });
    const rect = await page.locator("#roll").boundingBox();
    assert.ok(
      rect.x >= 0 &&
        rect.y >= 0 &&
        rect.x + rect.width <= viewport.width &&
        rect.y + rect.height <= viewport.height,
    );
    const covered = await page.evaluate(() => {
      const r = document.getElementById("roll").getBoundingClientRect();
      return document
        .elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)
        ?.closest("#roll")?.id;
    });
    assert.equal(covered, "roll");
    const cdp = await page.context().newCDPSession(page);
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [
        { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 },
      ],
    });
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
    await page.waitForTimeout(100);
    assert.ok(
      (await page.evaluate(
        () => __game.scene.getScene("garden").roll.cooldown,
      )) > 4,
    );
    await page.screenshot({
      path: `artifacts/siege-roll-${viewport.width}.png`,
    });
    await cdp.detach();
  }
  await page.evaluate(() => __game.scene.getScene("garden").scene.restart());
  await page.waitForTimeout(150);
  await page.getByRole("button", { name: /出发，守住/ }).click();
  await page.locator(".choice-card").filter({ hasText: "游侠" }).click();
  await page.waitForTimeout(60);
  assert.equal(
    await page.evaluate(() => __game.scene.getScene("garden").roll.cooldown),
    0,
  );
  assert.equal(
    await page.evaluate(
      () => __game.scene.getScene("garden").defenses.towers.length,
    ),
    0,
  );
  assert.deepEqual(errors, []);
  console.log(
    "PASS: elite/Boss loot and pickup, elite schedule, melee/ranged/Boss siege, frozen attackers, pause, destruction, projectile blocking, button/Shift/touch roll, invulnerability, exact cooldown, collision, responsive layout and restart",
  );
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
