const {chromium}=require('./playwright-runtime.cjs');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'msedge'}),page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:5173/?debug');await page.waitForFunction(()=>__game?.scene.getScene('garden')?.player);
 const results=[];
 for(const id of ['ranger','vanguard','pyromancer','engineer','warden']){
  await page.evaluate(()=>__game.scene.getScene('garden').scene.restart());await page.waitForFunction(()=>__game.scene.getScene('garden').mode==='ready');
  const result=await page.evaluate(id=>{
   const s=__game.scene.getScene('garden');s.selectClass(id);s.spawnClock=999;s.invincible=999;
   const x=s.player.x,y=s.player.y;
   for(const [dx,dy] of [[80,0],[110,15],[150,25]])s.enemies.push({s:s.add.image(x+dx,y+dy,'bug').setDepth(4),hp:1000,maxHp:1000,speed:0,r:20,armor:0,damage:1,xp:3});
   for(let i=0;i<90;i++)s.step(i*1000/30,1000/30);
   s.mode='pause';return {id,hp:s.hp,maxHp:s.maxHp,damage:s.enemies.reduce((sum,e)=>sum+1000-e.hp,0),turrets:s.classTurrets.length,floatCount:s.damageNumbers.items.length,weapon:s.gun.texture.key};
  },id);
  assert.ok(result.damage>0,`${id} must actually deal damage`);results.push(result);

 }
 await page.evaluate(()=>{
   const s=__game.scene.getScene('garden');s.damageNumbers.destroy();s.build.random=()=>.99;
   s.enemies.forEach((e,i)=>{e.s.setPosition(s.player.x+80+i*90,s.player.y-70+(i%2)*90);e.s.setTexture(['bug','brute','spitter'][i]);e.hp=1000});
   s.hit(s.enemies[0],18);s.build.random=()=>0;s.hit(s.enemies[1],32);s.hit(s.enemies[2],7,0xadc86b,{dot:true,element:'poison'});
 });
 await page.screenshot({path:'artifacts/damage-numbers.png'});
 // Instant XP burst must resolve all pending levels without waiting for another gem.
 const overflow=await page.evaluate(()=>{
  const s=__game.scene.getScene('garden');s.mode='play';s.xp=250;s.upgrade();let picks=0;
  while(s.mode==='upgrade'&&picks<10){document.querySelector('.choice-card').click();picks++}
  return {picks,level:s.level,xp:s.xp,need:s.need,mode:s.mode};
 });
 assert.ok(overflow.picks>=3);assert.ok(overflow.xp<overflow.need);assert.equal(overflow.mode,'play');
 // First boss timing including the advance warning.
 const boss=await page.evaluate(()=>{
  const s=__game.scene.getScene('garden');s.runTime=37.1;s.mode='play';s.step(37100,1000/30);
  const warned=!document.getElementById('boss-warning').hidden;
  s.runTime=44.99;s.step(45000,1000/30);return {warned,count:s.enemies.filter(e=>e.boss).length,scheduled:s.nodes.has(45)};
 });
 assert.equal(boss.warned,true);assert.equal(boss.count,1);assert.equal(boss.scheduled,true);
 assert.deepEqual(errors,[]);console.log(JSON.stringify({classes:results,overflow,boss},null,2));
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
