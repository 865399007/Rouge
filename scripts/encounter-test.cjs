const assert = require("node:assert/strict");
const { chromium } = require("./playwright-runtime.cjs");

(async () => {
  const browser = await chromium.launch({channel:"msedge"});
  try {
    const page = await browser.newPage();
    await page.goto("http://127.0.0.1:5173/?debug");
    await page.waitForFunction(() => window.__game?.scene.getScene("garden")?.player);
    const results = await page.evaluate(async () => {
      const s = __game.scene.getScene("garden");
      const {updateSupply,updateBossRing} = await import("./encounters.js");
      const {skills} = await import("./battle-skills.js");
      s.selectClass("warden");
      s.scene.pause();
      const times = [...s.bossTimes];
      s.bossTimes = [];
      s.weaponClock = 999;
      const packs = [];
      for (const time of [0,52,65,121,171,226,406]) {
        s.enemies.forEach(e=>e.s.destroy());
        s.enemies = [];
        s.nextEliteAt = Infinity;
        s.runTime=time;
        s.spawnClock=0;
        s.step(0,1000/30);
        packs.push(s.enemies.map(e=>e.bounty ? "bounty" : e.kind));
      }
      const post=s.supply, stock=s.defenses.stock;
      s.player.setPosition(post.x,post.y);
      updateSupply(s,4);
      s.player.x+=160;
      updateSupply(s,4);
      const banked=post.progress;
      s.player.x-=160;
      updateSupply(s,6);
      updateSupply(s,1);
      const reward=s.defenses.stock-stock;
      s.enemies.forEach(e=>e.s.destroy());
      s.enemies=[];
      s.spawnBoss(540);
      const boss=s.enemies[0];
      boss.ringClock=1.1;
      updateBossRing(s,boss,0.1);
      const gap=boss.gapAngle;
      updateBossRing(s,boss,1.01);
      const ring=s.hostile.map(o=>Math.cos(Math.atan2(o.vy,o.vx)-gap));
      s.enemies.forEach(e=>e.s.destroy());
      s.enemies=[];
      s.build.random=()=>0.9;
      const arc={...skills.find(k=>k.id==="arc"),level:4};
      s.build.active=[arc];s.level=14;s.xp=s.need;
      s.build.options=()=>[{...arc,kind:"skill",previous:4,level:5}];
      s.upgrade();
      document.querySelector(".choice-card").click();
      document.querySelectorAll(".choice-card")[1].click();
      const branch=arc.branch;
      function enemy(offset,hp) {
        const e={s:s.add.image(s.player.x+offset,s.player.y,"bug"),hp,maxHp:hp,r:12,armor:0,xp:1};
        s.enemies.push(e);return e;
      }
      const first=enemy(45,1000);
      s.combat.hash.rebuild(s.enemies);
      s.combat.cast(arc,first,100,440,0xffcc66);
      const returnDamage=1000-first.hp;
      first.hp=1;arc.branch="spread";
      const second=enemy(85,1000), third=enemy(95,1000);
      s.combat.hash.rebuild(s.enemies);
      s.combat.cast(arc,first,100,440,0xffcc66);
      const spread=[second.hp,third.hp];
      s.build.active=[];s.enemies.forEach(e=>e.s.destroy());s.enemies=[];
      s.hostile.forEach(o=>o.s.destroy());s.hostile=[];s.spawnClock=999;
      const dummy=enemy(70,1000);
      const shield={s:s.add.image(dummy.s.x,dummy.s.y,"shield"),vx:0,vy:0,
        returning:true,returnAt:0.05,returnSpeed:1,damage:30,element:"physical",
        hit:new Set(),age:0,life:2,pierce:99,trail:1};
      s.bullets=[shield];
      let doubleHits=0;
      const feedback=s.shieldReturnFeedback.bind(s);
      s.shieldReturnFeedback=e=>{doubleHits++;feedback(e);};
      for(let i=0;i<5;i++)s.step(0,1000/30);
      return {times,packs,banked,reward,ring: ring.length,clearGap:ring.every(c=>c<Math.cos(0.4)),branch,returnDamage,spread,doubleHits};
    });
    assert.deepEqual(results.times,[45,105,165,285,345,465,540]);
    assert.deepEqual(results.packs.slice(0,5),[["bug","bug","moth"],[],["runner","spitter"],["bounty","crab"],[]]);
    assert.deepEqual(results.packs.slice(5),[["crab","runner","needle"],["ram","hopper","saw","brute"]]);
    assert.ok(Math.abs(results.banked-4)<0.05);
    assert.equal(results.reward,6);
    assert.equal(results.ring,21);
    assert.ok(results.clearGap);
    assert.equal(results.doubleHits,1);
    assert.equal(results.branch,"return");
    assert.equal(results.returnDamage,185);
    assert.deepEqual(results.spread,[940,940]);
    console.log("PASS: encounters, optional bounty, banked supply progress, boss ring and both lightning evolutions");
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
