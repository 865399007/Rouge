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
test("疾跑持续5秒，移动加成30%，启动后冷却15秒", () => {
  const r = fixture();
  assert.ok(r.start());
  assert.equal(r.scene.invincible,0);
  assert.equal(r.step(4),5.2);
  assert.equal(r.step(2),2.3);
  assert.equal(r.start(),false);
  r.step(9);
  assert.ok(r.start());
});
test("灵巧闪避立即缩短当前和后续翻滚冷却，五级封顶", () => {
  const roll = fixture(), scene = roll.scene;
  scene.roll = roll;
  roll.start();
  for (let level = 1; level <= 5; level++) {
    assert.ok(scene.build.apply({ kind: "attribute", id: "evasion" }, scene));
    assert.equal(roll.cooldown, 15 - level * 0.5);
  }
  assert.equal(scene.build.apply({ kind: "attribute", id: "evasion" }, scene), false);
  for (let i = 0; i < 376; i++) roll.step(1/30, { x: 0, y: 0 });
  assert.ok(roll.start());
  assert.equal(roll.cooldown, 12.5);
});
