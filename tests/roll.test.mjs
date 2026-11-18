import test from "node:test";
import assert from "node:assert/strict";
import { Build } from "../progression.js";
import { Roll } from "../roll.js";
import { moveCircle } from "../geometry.js";
function fixture() {
  const r = Object.create(Roll.prototype);
  const image = new Proxy({}, { get: () => () => image });
  Object.assign(r, {
    cooldown: 0,
    remaining: 0,
    facing: { x: 1, y: 0 },
    direction: { x: 1, y: 0 },
    sync() {},
  });
  r.scene = {
    mode: "play",
    build: new Build(1),
    invincible: 0,
    player: { x: 500, y: 500, texture: { key: "hero-ranger" } },
    movementInput: () => ({ x: 0, y: 0 }),
    defenses: {
      move: (p, x, y, radius) => moveCircle(p, x, y, radius, [], 2000, 2000),
    },
    add: { image: () => image },
    effect() {},
  };
  return r;
}
test("翻滚沿最后移动方向走150，期间无敌，冷却严格5秒", () => {
  const r = fixture();
  r.step(0.01, { x: -1, y: 0 });
  assert.equal(r.start(), true);
  assert.equal(r.cooldown, 5);
  assert.equal(r.start(), false);
  for (let i = 0; i < 9; i++) {
    r.scene.invincible -= 1 / 30;
    assert.equal(r.step(1 / 30, { x: 1, y: 0 }), true);
    assert.ok(r.scene.invincible > 0);
  }
  assert.ok(Math.abs(r.scene.player.x - 350) < 1e-6);
  assert.equal(r.remaining, 0);
  for (let i = 0; i < 140; i++) r.step(1 / 30, { x: 0, y: 0 });
  assert.equal(r.start(), false);
  r.step(1 / 30, { x: 0, y: 0 });
  assert.equal(r.start(), true);
});
test("翻滚不能在菜单或建塔时启动，斜向距离不加速，也不能穿塔", () => {
  const r = fixture();
  for (const mode of ["ready", "pause", "placement", "upgrade", "end"]) {
    r.scene.mode = mode;
    assert.equal(r.start(), false);
  }
  r.scene.mode = "play";
  r.scene.movementInput = () => ({ x: 1, y: 1 });
  r.start();
  for (let i = 0; i < 9; i++) r.step(1 / 30, { x: 0, y: 0 });
  assert.ok(
    Math.abs(Math.hypot(r.scene.player.x - 500, r.scene.player.y - 500) - 150) <
      1e-6,
  );
  const blocked = fixture();
  blocked.scene.defenses.move = (p, x, y, radius) =>
    moveCircle(p, x, y, radius, [{ x: 600, y: 500 }], 2000, 2000);
  blocked.start();
  for (let i = 0; i < 9; i++) blocked.step(1 / 30, { x: 0, y: 0 });
  assert.ok(blocked.scene.player.x <= 543.001);
});

test("灵巧闪避立即缩短当前和后续翻滚冷却，五级封顶", () => {
  const roll = fixture(), scene = roll.scene;
  scene.roll = roll;
  roll.start();
  for (let level = 1; level <= 5; level++) {
    assert.ok(scene.build.apply({ kind: "attribute", id: "evasion" }, scene));
    assert.equal(roll.cooldown, 5 - level * 0.5);
  }
  assert.equal(scene.build.apply({ kind: "attribute", id: "evasion" }, scene), false);
  for (let i = 0; i < 75; i++) roll.step(1/30, { x: 0, y: 0 });
  assert.ok(roll.start());
  assert.equal(roll.cooldown, 2.5);
});
