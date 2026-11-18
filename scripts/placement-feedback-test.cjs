const {chromium}=require('./playwright-runtime.cjs');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'msedge'}),page=await browser.newPage({viewport:{width:1280,height:800}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:5173/?debug');await page.waitForFunction(()=>__game?.scene.getScene('garden')?.player);
 await page.getByRole('button',{name:/出发，守住/}).click();await page.locator('.choice-card').filter({hasText:'游侠'}).click();
 await page.evaluate(()=>{
  const s=__game.scene.getScene('garden');s.spawnClock=999;s.weaponClock=100;s.invincible=100;
  s.enemies.forEach(e=>e.s.destroy());s.enemies=[];
  s.enemies.push({s:s.add.image(s.player.x+210,s.player.y,'bug'),hp:1000,maxHp:1000,r:20,speed:30});
  s.__placementTweenTarget={x:0};s.tweens.add({targets:s.__placementTweenTarget,x:100,duration:3000});
 });
 const button=page.locator('#tower-tools button').first();const rect=await button.boundingBox();
 const down=async()=>{await page.mouse.move(rect.x+rect.width/2,rect.y+rect.height/2);await page.mouse.down()};
 const snapshot=()=>page.evaluate(()=>{const s=__game.scene.getScene('garden');return {time:s.runTime,mode:s.mode,combat:s.combat.time,hp:s.hp,player:[s.player.x,s.player.y],enemies:s.enemies.map(e=>[e.s.x,e.s.y,e.hp]),weapon:s.weaponClock,tween:s.__placementTweenTarget.x}});
 await down();await page.mouse.move(rect.x+rect.width/2-43,rect.y+rect.height/2,{steps:5});
 const before=await snapshot();assert.equal(before.mode,'placement');assert.equal(await page.locator('.placement-notice').isVisible(),true);
 await page.keyboard.down('d');await page.waitForTimeout(550);await page.keyboard.up('d');
 assert.deepEqual(await snapshot(),before,'Placement freezes simulation, actor movement, HP, cooldowns and tweens');
 await page.screenshot({path:'artifacts/placement-paused.png'});
 await page.mouse.up();await page.waitForTimeout(160);
 const after=await snapshot();assert.equal(after.mode,'play');assert.ok(after.time>before.time);assert.ok(after.tween>before.tween);
 assert.equal(await page.evaluate(()=>__game.scene.getScene('garden').defenses.towers.length),1);
 assert.equal(await page.evaluate(()=>__game.scene.getScene('garden').defenses.stock),0);
 // Invalid placement must cancel and resume without charging.
 await page.evaluate(()=>{const s=__game.scene.getScene('garden');s.defenses.stock=3;s.defenses.refresh()});
 await down();await page.mouse.move(rect.x-200,rect.y);await page.mouse.up();
 assert.equal((await snapshot()).mode,'play');assert.equal(await page.evaluate(()=>__game.scene.getScene('garden').defenses.stock),3);
 // Manual pause must remain paused even when the original pointer is released.
 await down();await page.keyboard.press('Space');await page.mouse.up();
 assert.equal((await snapshot()).mode,'pause');await page.getByRole('button',{name:/继续行动/}).click();
 await down();await page.evaluate(()=>window.dispatchEvent(new Event('blur')));await page.mouse.up();
 assert.equal((await snapshot()).mode,'play');assert.equal(await page.evaluate(()=>__game.scene.getScene('garden').defenses.drag),null);
 await down();await page.evaluate(()=>window.dispatchEvent(new Event('resize')));await page.mouse.up();
 assert.equal((await snapshot()).mode,'play');
 await down();await button.dispatchEvent('pointercancel',{pointerId:await page.evaluate(()=>__game.scene.getScene('garden').defenses.drag.id)});await page.mouse.up();
 assert.equal((await snapshot()).mode,'play');
 // Inspect actual Phaser shake calls: direct hits throttle, DOT has none.
 const shakes=await page.evaluate(()=>{
  const s=__game.scene.getScene('garden');s.mode='play';s.lastAttackShake=-Infinity;s.build.random=()=>.99;
  const target=s.enemies[0],calls=[],camera=s.cameras.main,original=camera.shake;
  camera.shake=function(...args){calls.push(args);return original.apply(this,args)};
  s.hit(target,1);s.hit(target,1);s.hit(target,1);const burst=calls.length;
  s.lastAttackShake=-Infinity;s.hit(target,1,0xadc86b,{dot:true,element:'poison'});const dot=calls.length;
  s.hit(target,1);const next=calls.length;camera.shake=original;
  return {burst,dot,next,calls};
 });
 assert.equal(shakes.burst,1);assert.equal(shakes.dot,1);assert.equal(shakes.next,2);
 assert.ok(shakes.calls.every(([duration,intensity,force])=>duration<=75&&intensity<=.0015&&force===false));
 await down();await page.evaluate(()=>__game.scene.getScene('garden').scene.restart());await page.mouse.up();await page.waitForTimeout(250);
 assert.equal(await page.evaluate(()=>__game.scene.getScene('garden').mode),'ready');
 assert.equal(await page.locator('.placement-notice').isVisible(),false);
 await page.getByRole('button',{name:/出发，守住/}).click();await page.locator('.choice-card').filter({hasText:'游侠'}).click();
 assert.equal(await page.evaluate(()=>__game.scene.getScene('garden').tweens.paused),false);
 assert.deepEqual(errors,[]);console.log('PASS: placement pause/resume, valid/invalid drop, manual pause, blur/resize/pointer cancellation, restart cleanup, throttled camera shake and no DOT shake');
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
