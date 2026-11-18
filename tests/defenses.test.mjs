import test from "node:test";
import assert from "node:assert/strict";
import { Defenses } from "../defenses.js";
import {
  eliteStats,
  enemyStats,
  bossStats,
  materialDrop,
  TOWER_TUNING,
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
    mode: "play", build: { random: () => 0.9, pickupMultiplier: 1 }, enemies: [], gems: [],
    player: { x: 900, y: 100 },
    distance: (a, b) => Math.hypot(a.x - b.x, a.y - b.y),
    add: { rectangle: drawable, circle: drawable },
    damageNumbers: { add() {} },
    enemyTelegraphs: drawable(),
    tweens: { killTweensOf() {} },
    burst() {},
    effect() {},
  };
  const tower = { x: 200, y: 100, level: 1, lifetime: 60, remaining: 999, type: TOWER_TUNING[0], r: TOWER_RADIUS };
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
test("塔升级刷新寿命，材料不足保留原状态，满级永久", () => {
  const {d, tower} = fixture();
  tower.lifetime = 2;
  d.upgradeTower(tower);
  assert.equal(tower.lifetime, 2);
  d.stock = 18;
  for (const duration of [120, 180, 240, Infinity]) {
    d.upgradeTower(tower);
    assert.equal(tower.lifetime, duration);
  }
  assert.equal(d.stock, 0);
  d.update(1000);
  assert.equal(d.towers.length, 1);
});
test("暂停冻结计时，到期清除塔和碰撞", () => {
  const {d, tower} = fixture();
  d.scene.mode = "pause";
  d.update(60);
  assert.equal(tower.lifetime, 60);
  d.scene.mode = "play";
  d.update(60);
  assert.equal(d.towers.length, 0);
  assert.equal(tower.s.active, false);
});
test("磁铁收集远处的经验、材料和血包，治疗不超上限", () => {
  const {d} = fixture();
  const scene = d.scene;
  scene.hp = 90;
  scene.maxHp = 100;
  scene.sync = () => {};
  const sprite = (x) => ({x, y:100, destroy(){}, setPosition(x,y){Object.assign(this,{x,y});}});
  scene.gems.push(sprite(0));
  d.drops.push({sprite:sprite(0), kind:"health"}, {sprite:sprite(40),value:3},
    {sprite:sprite(900),kind:"magnet"});
  d.update(1/30);
  assert.equal(scene.gems[0].x, 900);
  assert.equal(scene.hp, 100);
  assert.equal(d.stock, 0);
  assert.ok(d.drops[0].sprite.x > 40 && d.drops[0].sprite.x < 900);
  for (let i = 0; i < 25; i++) d.update(1/30);
  assert.equal(d.stock, 3);
  assert.equal(d.drops.length, 0);
});
