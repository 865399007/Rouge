const {chromium}=require('./playwright-runtime.cjs');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'msedge'});
 const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:5173/?debug');await page.waitForFunction(()=>window.__game?.scene.getScene('garden')?.player);
 const results=await page.evaluate(async()=>{
  const {skills}=await import('./battle-skills.js'),s=__game.scene.getScene('garden'),results=[];
  s.selectClass('ranger');s.job=null;s.spawnClock=99999;s.invincible=99999;
  for(const skill of skills){
   s.enemies.forEach(e=>e.s.destroy());s.enemies=[];
   s.bullets.forEach(b=>b.s.destroy());s.bullets=[];
   s.effects.forEach(e=>e.sprite.destroy());s.effects=[];s.combat.zones=[];
   for(const [dx,dy] of [[20,0],[80,0],[0,85],[100,15]])
    s.enemies.push({s:s.add.image(s.player.x+dx,s.player.y+dy,'bug').setDepth(4),hp:10000,maxHp:10000,speed:0,r:20,armor:0,damage:1});
   s.build.active=[{...skill,level:3,remaining:0}];s.mode='play';
   for(let i=0;i<120;i++)s.step(i*1000/30,1000/30);
   results.push({id:skill.id,damage:Math.round(s.enemies.reduce((sum,e)=>sum+e.maxHp-e.hp,0)),effects:s.effects.length,zones:s.combat.zones.length});
  }
  s.mode='pause';return results;
 });
 assert.equal(results.length,10);for(const r of results)assert.ok(r.damage>0,`${r.id} should deal damage`);assert.deepEqual(errors,[]);
 console.log(JSON.stringify(results,null,2));console.log('PASS: All 10 skills deal damage in isolation; no browser errors');
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
