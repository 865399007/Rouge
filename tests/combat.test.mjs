import test from "node:test";
import assert from "node:assert/strict";
import { Combat } from "../combat.js";
import { Build } from "../progression.js";

const graphics = () => new Proxy({}, { get: () => () => graphics() });
function fixture() {
  const hits = [];
  const target = {
    s: { x: 100, y: 100, active: true },
    r: 20,
    hp: 1000,
    armor: 25,
  };
  const s = {
    build: new Build(1),
    enemies: [target],
    player: { x: 100, y: 100 },
    hp: 40,
    maxHp: 100,
    skillGraphics: graphics(),
    impact() {},
    hit(e, n, c, meta) {
      hits.push({ n, ...meta });
      return n;
    },
    distance: (a, b) => Math.hypot(a.x - b.x, a.y - b.y),
    defenses: { move() {} },
    sync() {},
    cameras: { main: { shake() {} } },
  };
  const combat = new Combat(s);
  combat.hash.rebuild(s.enemies);
  return { s, combat, target, hits };
}
test("护甲后的实际伤害传给跳字，持续伤害保留类型且不附加新状态", () => {
  const { combat, target, hits } = fixture();
  combat.damage(target, 50, "poison");
  assert.equal(hits[0].n, 40);
  combat.damage(target, 10, "poison", true);
  assert.equal(hits[1].n, 8);
  assert.equal(hits[1].dot, true);
  assert.equal(target.poison, 1);
});
test("Boss 冻结有抗性间隔，重复命中不会永久冻结", () => {
  const { combat, target } = fixture();
  target.boss = true;
  combat.damage(target, 10, "ice");
  assert.equal(target.frozenUntil, 0.22);
  combat.time = 0.15;
  combat.damage(target, 10, "ice");
  assert.equal(target.frozenUntil, 0.22);
  combat.time = 3;
  combat.damage(target, 10, "ice");
  assert.equal(target.frozenUntil, 3.22);
});
test("地雷只触发一次并造成全额伤害，未触发时保持待命", () => {
  const { s, combat, target, hits } = fixture();
  s.build.add("mine");
  combat.zones = [
    {
      owner: "mine",
      kind: "trap",
      x: 100,
      y: 100,
      r: 80,
      damage: 82,
      color: 0,
      element: "time",
      life: 8,
      tick: 0,
    },
  ];
  target.s.x = 170;
  combat.hash.rebuild(s.enemies);
  combat.updateZones(0.1);
  assert.equal(hits.length, 0);
  assert.equal(combat.zones.length, 1);
  target.s.x = 110;
  combat.hash.rebuild(s.enemies);
  combat.updateZones(0.1);
  assert.equal(hits.length, 1);
  assert.equal(hits[0].n, 65.6);
  assert.equal(combat.zones.length, 0);
  combat.updateZones(0.5);
  assert.equal(hits.length, 1);
});
test("虹吸按每跳回复，不随目标数成倍增长", () => {
  const { s, combat, target } = fixture();
  s.build.add("siphon");
  s.enemies.push({ ...target, s: { ...target.s, x: 110 } });
  combat.hash.rebuild(s.enemies);
  combat.zones = [
    {
      owner: "siphon",
      kind: "drain",
      r: 90,
      damage: 8,
      color: 0,
      element: "shadow",
      life: 3,
      tick: 0,
      heal: 0.6,
    },
  ];
  combat.updateZones(0.1);
  assert.equal(s.hp, 40.6);
  combat.updateZones(0.1);
  assert.equal(s.hp, 40.6);
});
test("空间查询包含碰撞圆触及范围、但中心跨过格子边缘的大型敌人", () => {
  const { combat, s, target } = fixture();
  target.s.x = 121;
  target.s.y = 100;
  target.r = 38;
  combat.hash.rebuild(s.enemies);
  assert.equal(combat.hash.query(100, 100, 10).length, 1);
});
