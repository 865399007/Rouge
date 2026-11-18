import test from "node:test";
import assert from "node:assert/strict";
import { circlesOverlap, moveCircle, TOWER_RADIUS } from "../geometry.js";

const tower = { x: 200, y: 200 };
test("圆形边界：允许从原方形的空角经过", () => {
  assert.equal(circlesOverlap(tower, 32, { x: 245, y: 245 }, 25), false);
  assert.equal(circlesOverlap(tower, 32, { x: 240, y: 240 }, 25), true);
  assert.equal(circlesOverlap(tower, 32, { x: 257, y: 200 }, 25), false);
});
test("高速穿越：长位移不会穿过塔心", () => {
  const actor = { x: 60, y: 200 };
  moveCircle(actor, 400, 0, 25, [tower], 600, 600);
  assert.ok(actor.x <= 143.001);
  assert.ok(Math.hypot(actor.x - 200, actor.y - 200) >= 57 - 0.001);
});
test("斜向绕塔：碰撞沿圆周滑动，不会卡在旧方角", () => {
  const actor = { x: 143, y: 200 };
  for (let i = 0; i < 20; i++) moveCircle(actor, 4, 4, 25, [tower], 600, 600);
  assert.ok(actor.y > 255);
  assert.ok(actor.x > 165);
  assert.ok(Math.hypot(actor.x - 200, actor.y - 200) >= 57 - 0.001);
});
test("起点重叠：恢复到有效圆周，数值保持有限", () => {
  const actor = { ...tower };
  moveCircle(actor, 0, 0, 25, [tower], 600, 600);
  assert.ok(Number.isFinite(actor.x) && Number.isFinite(actor.y));
  assert.ok(Math.hypot(actor.x - 200, actor.y - 200) >= 57 - 0.001);
});
test("世界边界：长距离移动仍限制在地图内部", () => {
  const actor = { x: 60, y: 60 };
  moveCircle(actor, -1000, 1000, 25, [], 600, 600);
  assert.deepEqual(actor, { x: 25, y: 575 });
});
test("塔间通道：多次移动不进入任何圆形塔体", () => {
  const towers = [
    { x: 200, y: 150 },
    { x: 200, y: 270 },
  ];
  const actor = { x: 60, y: 210 };
  for (let i = 0; i < 80; i++) {
    moveCircle(actor, 4, 0, 25, towers, 600, 600);
    for (const t of towers)
      assert.ok(
        Math.hypot(actor.x - t.x, actor.y - t.y) >= TOWER_RADIUS + 25 - 0.001,
      );
  }
  assert.ok(actor.x > 300);
});
