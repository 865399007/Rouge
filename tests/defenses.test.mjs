import test from "node:test";
import assert from "node:assert/strict";
import { Defenses } from "../defenses.js";
import {
  eliteStats,
  enemyStats,
  bossStats,
  materialDrop,
  TOWER_TUNING,
  towerMaxHp,
} from "../balance.js";
import { segmentCircleEntry, TOWER_RADIUS } from "../geometry.js";

const drawable = () => {
  const obj = {
    active: true,
    destroy() {
      this.active = false;
    },
  };
  for (const method of [
    "setAngle",
    "setStrokeStyle",
    "setDepth",
    "clear",
    "fillStyle",
    "fillRect",
    "fillRoundedRect",
    "setText",
    "setTint",
    "lineStyle",
    "strokeCircle",
    "lineBetween",
  ])
    obj[method] = () => obj;
  return obj;
};
function fixture() {
  const d = Object.create(Defenses.prototype);
  Object.assign(d, {
    towers: [],
    drops: [],
    stock: 0,
    width: 2000,
    height: 2000,
    refresh() {},
  });
  d.scene = {
    mode: "play",
    player: { x: 900, y: 100 },
    distance: (a, b) => Math.hypot(a.x - b.x, a.y - b.y),
    add: { rectangle: drawable, circle: drawable },
    damageNumbers: { add() {} },
    enemyTelegraphs: drawable(),
    tweens: { killTweensOf() {} },
    burst() {},
    effect() {},
  };
  const tower = { x: 200, y: 100, hp: 180, maxHp: 180, r: TOWER_RADIUS };
  for (const key of ["s", "barrel", "hub", "health", "label"])
    tower[key] = drawable();
  d.towers.push(tower);
  return { d, tower };
}
test("精英与所有Boss掉材料，普通重装怪不掉材料", () => {
  assert.equal(materialDrop(enemyStats("brute", 300)), 0);
  assert.equal(materialDrop(eliteStats(25)), 1);
  assert.equal(materialDrop(eliteStats(180)), 2);
  assert.ok(eliteStats(25).hp > enemyStats("brute", 25).hp);
  for (let i = 0; i < 9; i++) assert.ok(materialDrop(bossStats(i)) >= 3);
});
test("击杀掉落仅结算一次，最终Boss立即入账", () => {
  const { d } = fixture();
  const elite = { ...eliteStats(25), s: { x: 100, y: 100 } };
  d.drop(elite);
  d.drop(elite);
  assert.equal(d.drops.length, 1);
  assert.equal(d.drops[0].value, 1);
  const final = { ...bossStats(8), s: elite.s };
  d.drop(final);
  d.drop(final);
  assert.equal(d.stock, 6);
});
test("怪物选择附近塔，贴身玩家优先，远塔不吸引全场", () => {
  const { d, tower } = fixture();
  const enemy = { s: { x: 270, y: 100 }, r: 20 };
  assert.equal(d.targetFor(enemy), tower);
  d.scene.player.x = 275;
  assert.equal(d.targetFor(enemy), null);
  enemy.s.x = 600;
  d.scene.player.x = 900;
  assert.equal(d.targetFor(enemy), null);
});
test("近战拆塔有前摇和间隔，离开范围取消攻击", () => {
  const { d, tower } = fixture();
  const enemy = {
    s: { x: 252, y: 100 },
    r: 20,
    damage: 20,
    towerTarget: tower,
  };
  d.attackTower(enemy, 0.2);
  assert.equal(tower.hp, 180);
  d.attackTower(enemy, 0.21);
  assert.equal(tower.hp, 160);
  d.attackTower(enemy, 0.5);
  assert.equal(tower.hp, 160);
  enemy.towerCooldown = 0;
  d.attackTower(enemy, 0.2);
  enemy.s.x = 450;
  d.attackTower(enemy, 0.3);
  assert.equal(tower.hp, 160);
  assert.equal(enemy.towerWindup, null);
});
test("塔受伤和摧毁移除全部部件与碰撞；暂停不掉血", () => {
  const { d, tower } = fixture();
  d.scene.mode = "placement";
  assert.equal(d.damage(tower, 99), 0);
  d.scene.mode = "play";
  assert.equal(d.damage(tower, 30), 30);
  assert.equal(d.damage(tower, 1000), 150);
  assert.equal(d.damage(tower, 1000), 0);
  assert.equal(d.towers.length, 0);
  for (const key of ["s", "barrel", "hub", "health", "label"])
    assert.equal(tower[key].active, false);
  const actor = { x: 140, y: 100 };
  d.move(actor, 100, 0, 20);
  assert.equal(actor.x, 240);
  assert.deepEqual(
    TOWER_TUNING.map((t) => t.hp),
    [180, 240, 320],
  );
});
test("高速弹丸命中第一座塔，擦边与起点重叠也正确", () => {
  const { d, tower } = fixture();
  d.towers.unshift({ x: 100, y: 100, hp: 100 });
  assert.equal(
    d.projectileHit({ x: 350, y: 100 }, { x: 0, y: 100 }).tower,
    tower,
  );
  assert.equal(
    segmentCircleEntry({ x: 0, y: 132 }, { x: 400, y: 132 }, tower, 32),
    0.5,
  );
  assert.equal(segmentCircleEntry(tower, tower, tower, 32), 0);
  assert.equal(
    segmentCircleEntry({ x: 0, y: 200 }, { x: 400, y: 200 }, tower, 32),
    null,
  );
});
test("防御塔逐分钟加固，旧塔维持血量比例，最高增加70%", () => {
  const { d, tower } = fixture();
  tower.type = TOWER_TUNING[0];
  tower.hp = 90;
  tower.remaining = 999;
  d.scene.runTime = 180;
  d.scene.enemies = [];
  d.scene.build = { pickupMultiplier: 1 };
  d.update(1 / 30);
  assert.equal(tower.maxHp, 218);
  assert.equal(tower.hp, 109);
  assert.equal(towerMaxHp(TOWER_TUNING[0], 600), 306);
  assert.equal(towerMaxHp(TOWER_TUNING[0], 9999), 306);
});
