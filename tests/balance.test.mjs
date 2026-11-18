import test from "node:test";
import assert from "node:assert/strict";
import {
  BALANCE,
  xpToNext,
  enemyStats,
  bossStats,
  spawnInterval,
  skillStats,
} from "../balance.js";
import { Build, ATTRIBUTES, upgradeDescription } from "../progression.js";
import { skills } from "../battle-skills.js";
import { CLASSES } from "../classes.js";
import { DamageNumbers } from "../damage-numbers.js";

test("前期8 只普通敌人才升一级，经验曲线持续增长", () => {
  assert.equal(xpToNext(1), 24);
  assert.equal(Math.ceil(xpToNext(1) / enemyStats("bug", 0).xp), 8);
  for (let i = 2; i < 60; i++) assert.ok(xpToNext(i) > xpToNext(i - 1));
});
test("首领时间固定为45秒起步，常规间隔60秒，最终首领9分钟", () => {
  assert.equal(BALANCE.bosses[0], 45);
  assert.equal(BALANCE.bosses.at(-1), 540);
  for (let i = 1; i < 8; i++)
    assert.equal(BALANCE.bosses[i] - BALANCE.bosses[i - 1], 60);
  for (let i = 1; i < 9; i++) assert.ok(bossStats(i).hp > bossStats(i - 1).hp);
});
test("小怪强度增长有上限，首领期间降低杂兵生成频率", () => {
  for (const kind of ["bug", "brute", "spitter", "runner"]) {
    const early = enemyStats(kind, 0),
      late = enemyStats(kind, 600);
    assert.ok(late.hp > early.hp);
    assert.ok(late.speed < 150);
    assert.ok(late.damage <= 25);
  }
  assert.ok(spawnInterval(300, true) > spawnInterval(300, false));
  assert.ok(spawnInterval(600) >= 0.22);
});
test("技能高阶等级门槛生效，不能开局升满", () => {
  const b = new Build(123);
  assert.equal(b.add("meteor"), true);
  assert.equal(b.add("meteor", 2), false);
  assert.equal(b.add("meteor", 3), true);
  assert.equal(b.add("meteor", 5), false);
  assert.equal(b.add("meteor", 6), true);
  assert.equal(b.add("meteor", 10), true);
  assert.equal(b.add("meteor", 15), true);
  assert.equal(b.add("meteor", 99), false);
});
test("升级选择无重复，并保留技能升级和属性的取舍", () => {
  for (let seed = 1; seed < 50; seed++) {
    const b = new Build(seed);
    b.add("meteor");
    const choices = b.options(3);
    assert.equal(choices.length, 3);
    assert.equal(new Set(choices.map((c) => c.id)).size, 3);
    assert.ok(choices.some((c) => c.id === "meteor" && c.previous === 1));
    assert.ok(choices.some((c) => c.kind === "attribute"));
  }
});
test("四技能满槽不再提供新技能，所有属性有上限", () => {
  const b = new Build(123);
  for (const k of skills.slice(0, 4)) b.add(k.id);
  assert.equal(b.add(skills[4].id), false);
  const counts = new Set(), kinds = new Set();
  for (let i = 0; i < 100; i++) {
    const cards = b.options(15);
    assert.equal(new Set(cards.map(c => c.id)).size, 3);
    const upgrades = cards.filter(c => c.kind === "skill");
    assert.ok(upgrades.length >= 1 && upgrades.every(c => b.active.some(s => s.id === c.id)));
    counts.add(upgrades.length);
    cards.forEach(c => kinds.add(c.kind));
  }
  assert.equal(counts.size, 3);
  assert.equal(kinds.size, 3);
  assert.ok(b.options(1).every(c => c.kind !== "skill"));
  for (const skill of b.active.slice(1)) skill.level = 5;
  assert.deepEqual(b.options(15).filter(c => c.kind === "skill").map(c => c.id), [b.active[0].id]);
  b.active[0].level = 5;
  assert.ok(b.options(15).every(c => c.kind !== "skill"));
  const scene = { level: 20, hp: 80, maxHp: 100, speed: 210 };
  for (const a of ATTRIBUTES) {
    for (let i = 0; i < a.max; i++)
      assert.equal(b.apply({ ...a, kind: "attribute" }, scene), true);
    assert.equal(b.apply({ ...a, kind: "attribute" }, scene), false);
  }
  assert.equal(b.haste, 0.3);
  assert.equal(b.armor, 25);
});
test("职业基础生命、移动和护甲不会被属性升级重置", () => {
  for (const job of CLASSES) {
    const b = new Build(1);
    b.job = job;
    const scene = { hp: job.hp - 15, maxHp: job.hp, speed: job.speed };
    b.apply({ id: "power", kind: "attribute" }, scene);
    assert.equal(scene.maxHp, job.hp);
    assert.equal(scene.speed, job.speed);
    assert.equal(b.armor, job.armor);
    b.apply({ id: "vitality", kind: "attribute" }, scene);
    assert.equal(scene.maxHp, job.hp + 12);
    assert.equal(scene.hp, job.hp - 3);
  }
});
test("升级卡与运行时共用伤害和冷却公式", () => {
  const b = new Build(1);
  b.attributes.power = 2;
  b.attributes.haste = 1;
  for (const skill of skills) {
    const stat = skillStats(skill, 3, b);
    assert.ok(stat.damage > skill.base);
    assert.ok(stat.cooldown < skill.cd);
    const text = upgradeDescription(
      { ...skill, kind: "skill", previous: 2, level: 3 },
      b,
    );
    assert.ok(text.includes(String(stat.damage)));
    assert.ok(text.includes(String(stat.cooldown)));
  }
});
test("五职业的武器、参数和定位均不同", () => {
  assert.equal(CLASSES.length, 5);
  assert.equal(new Set(CLASSES.map((c) => c.texture)).size, 5);
  assert.equal(new Set(CLASSES.map((c) => c.hp)).size, 5);
  assert.equal(new Set(CLASSES.map((c) => c.id)).size, 5);
});
function textStub() {
  return {
    active: true,
    setOrigin() {
      return this;
    },
    setDepth() {
      return this;
    },
    setText(t) {
      this.text = t;
      return this;
    },
    setAlpha() {
      return this;
    },
    destroy() {
      this.active = false;
    },
  };
}
test("伤害跳字同目标短窗口合并、最多64条、到期清理", () => {
  const scene = {
      combat: { time: 0 },
      add: { text: (x, y, t) => ({ ...textStub(), x, y, text: t }) },
    },
    numbers = new DamageNumbers(scene),
    enemy = { s: { x: 10, y: 20 }, r: 20 };
  numbers.add(enemy, 10);
  numbers.add(enemy, 7);
  assert.equal(numbers.items.length, 1);
  assert.equal(numbers.items[0].sprite.text, "17");
  numbers.add(enemy, 5, { dot: true });
  assert.equal(numbers.items.length, 2);
  for (let i = 0; i < 100; i++) numbers.add({ s: { x: i, y: i }, r: 10 }, 1);
  assert.equal(numbers.items.length, 64);
  numbers.update(2);
  assert.equal(numbers.items.length, 0);
});
