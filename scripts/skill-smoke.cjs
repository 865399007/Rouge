const {chromium}=require('./playwright-runtime.cjs');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'msedge'});
 const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:5173/?debug');await page.waitForFunction(()=>window.__game?.scene.getScene('garden')?.player);
 await page.getByRole('button',{name:/出发，守住/}).click();await page.locator('.choice-card').first().click();
 const results=await page.evaluate(async()=>{
  const {skills}=await import('./battle-skills.js'),s=__game.scene.getScene('garden'),results=[];
  s.mode='pause';s.enemies.forEach(e=>e.s.destroy());s.enemies=[];
  for(let i=0;i<12;i++){
   const a=i*Math.PI/6,d=60+(i%3)*25;
   s.enemies.push({s:s.add.image(s.player.x+Math.cos(a)*d,s.player.y+Math.sin(a)*d,['bug','brute','runner','spitter'][i%4]).setDepth(4),hp:100000,maxHp:100000,speed:0,r:20,armor:0});
  }
  for(const skill of skills){
   s.effects.forEach(e=>e.sprite.destroy());s.effects=[];
   s.build.active=[{...skill,level:3,remaining:0}];s.combat.hash.rebuild(s.enemies);
   s.combat.update(.04);
   const damage=s.enemies.some(e=>e.hp<e.maxHp);
   results.push({id:skill.id,effects:s.effects.length,bullets:s.bullets.length,zones:s.combat.zones.length,damage});
  }
  s.effects.forEach(e=>e.sprite.destroy());s.effects=[];
  s.build.active=skills.filter(k=>['meteor','frost','arc','orbit'].includes(k.id)).map(k=>({...k,level:1,remaining:0}));
  s.enemies.forEach(e=>{e.s.setAlpha(1);e.s.clearTint()});s.player.setAlpha(1);s.invincible=0;
  s.combat.update(.04);s.combat.hash.rebuild(s.enemies);
  const t=s.enemies[0];
  const meteor=skills.find(k=>k.id==='meteor');s.combat.cast({...meteor,level:1},t,1,85,0xe9a35d);
  s.sync();return results;
 });
 assert.equal(results.length,10);assert.deepEqual(errors,[]);
 await page.screenshot({path:'artifacts/combat-effects.png'});
 console.log(JSON.stringify(results,null,2));console.log('PASS: All 10 skill render paths execute with live targets and no browser errors');
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
