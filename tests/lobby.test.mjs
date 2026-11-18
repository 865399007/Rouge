import test from "node:test";
import assert from "node:assert/strict";
import { stages, stageWaves, rewardVictory, drawShards, upgradeGear } from "../lobby.js";
import { Build } from "../progression.js";
import { skillStats } from "../balance.js";

test("每关十波都有首领和有限配额，按约五分钟设计投放节奏", () => {
  assert.equal(stages.length, 10);
  const layouts = stages.map((stage,index) => {
    const run = stageWaves(index);
    assert.equal(run.length,10);
    assert.equal(run[9].bossIndex,8);
    const seconds = run.reduce((sum,w)=>sum+(Math.ceil(w.total/w.count)-1)*w.interval,36);
    assert.equal(Math.round(seconds),236);
    return JSON.stringify(run.map(w=>w.kinds));
  });
  assert.equal(new Set(layouts).size,10);
});

test("通关授予经验和券，大厅属性、武器和技能成长在战斗中生效", () => {
  const profile={level:1,xp:0,points:0,tickets:0,wins:{},stats:{power:1,armor:1},skills:{meteor:1},gear:{}};
  rewardVictory(profile,0);
  assert.deepEqual([profile.level,profile.points,profile.tickets,profile.wins[0]],[2,2,3,1]);
  const build=new Build(1);build.job={id:"ranger"};build.profile=profile;
  const base=build.weaponDamage(100);
  drawShards(profile,"weapon",()=>0);
  assert.ok(upgradeGear(profile,"weapon","ranger"));
  assert.ok(Math.abs(build.weaponDamage(100)-base*1.15)<1e-8);
  assert.equal(build.armor,2);
  assert.equal(Math.round(skillStats({id:"meteor"},1,build).damage),Math.round(88*1.04*1.08));
});

test("碎片逐阶扣除，满级后无法再升级", () => {
  const p={gear:{},tickets:1};
  drawShards(p,"mount",()=>0);
  const record=p.gear["mount-walker"];
  for(const cost of [4,8,14,22]) {
    record.shards=cost-1;
    assert.equal(upgradeGear(p,"mount","walker"),false);
    record.shards++;
    assert.equal(upgradeGear(p,"mount","walker"),true);
    assert.equal(record.shards,0);
  }
  assert.equal(record.rank,5);
  assert.equal(upgradeGear(p,"mount","walker"),false);
  assert.equal(drawShards(p,"mount"),"");
});
