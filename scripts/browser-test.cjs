const {chromium}=require('./playwright-runtime.cjs');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'msedge'});
 const page=await browser.newPage({viewport:{width:1440,height:900},hasTouch:true});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`)});
 await page.goto('http://127.0.0.1:5173/?debug');await page.waitForFunction(()=>window.__game?.scene.getScene('garden')?.player);
 await page.screenshot({path:'artifacts/welcome-desktop.png'});
 await page.getByRole('button',{name:/出发，守住/}).click();
 assert.equal(await page.locator('.choice-card').count(),5);
 await page.screenshot({path:'artifacts/skills-desktop.png'});
 await page.locator('.choice-card').filter({hasText:'游侠'}).click();
 await page.waitForTimeout(700);
 const start=await page.evaluate(()=>{const s=__game.scene.getScene('garden');return {x:s.player.x,y:s.player.y}});
 await page.keyboard.down('d');await page.waitForTimeout(500);await page.keyboard.up('d');
 const moved=await page.evaluate(()=>__game.scene.getScene('garden').player.x);
 assert.ok(moved>start.x+30,'WASD movement');
 await page.locator('#tower-tools button').first().click();
 assert.ok(await page.evaluate(()=>{const s=__game.scene.getScene('garden');return s.distance(s.player,s.defenses.towers[0])===0 && s.mode==='play'}),'Build at hero position');
 await page.keyboard.down('a'); await page.waitForTimeout(450); await page.keyboard.up('a');
 assert.ok(await page.evaluate(()=>{const s=__game.scene.getScene('garden');return s.player.x<s.defenses.towers[0].x-57}),'Walk out of the new tower');
 assert.equal(await page.evaluate(()=>__game.scene.getScene('garden').defenses.towers.length),1);
 assert.equal(await page.evaluate(()=>__game.scene.getScene('garden').defenses.stock),0);
 await page.keyboard.press('Space');assert.equal(await page.evaluate(()=>__game.scene.getScene('garden').mode),'pause');
 await page.getByRole('button',{name:/继续行动/}).click();
 assert.equal(await page.evaluate(()=>__game.scene.getScene('garden').mode),'play');
 // Deterministic combat fixture: real scene, live combat and original damage rules.
 await page.evaluate(()=>{
 const s=__game.scene.getScene('garden');s.hp=100;s.invincible=15;
 ['meteor','frost','orbit'].forEach(id=>s.build.add(id));s.sync();
 const kinds=['bug','brute','runner','spitter'];
 for(let i=0;i<26;i++){const a=i*2.4,r=170+(i%5)*40,k=kinds[i%4];const sprite=s.add.image(s.player.x+Math.cos(a)*r,s.player.y+Math.sin(a)*r,k).setDepth(4);s.enemies.push({s:sprite,hp:120,maxHp:120,speed:25,r:k==='brute'?25:20,ranged:k==='spitter',shot:2,armor:0})}
 });
 await page.waitForTimeout(800);await page.screenshot({path:'artifacts/battle-desktop.png'});
 await page.evaluate(()=>{const s=__game.scene.getScene('garden');s.xp=s.need;s.upgrade()});
 assert.equal(await page.locator('.choice-card').count(),3);
 await page.screenshot({path:'artifacts/upgrade-desktop.png'});
 await page.locator('.choice-card').first().click();
 assert.equal(await page.evaluate(()=>__game.scene.getScene('garden').mode),'play');
 await page.evaluate(()=>{const s=__game.scene.getScene('garden');s.spawnBoss(45)});await page.waitForTimeout(100);
 assert.equal(await page.locator('#boss-hud').count(),0);
 await page.locator('.settings summary').click();await page.locator('#restart').click();
 await page.waitForTimeout(500);assert.equal(await page.locator('.modal-overlay').count(),1);
 assert.equal(await page.evaluate(()=>__game.scene.getScene('garden').defenses.towers.length),0);
 await page.setViewportSize({width:390,height:844});await page.waitForTimeout(200);
 await page.screenshot({path:'artifacts/welcome-mobile.png'});
 await page.getByRole('button',{name:/出发，守住/}).click();await page.screenshot({path:'artifacts/skills-mobile.png'});
 const grid=await page.locator('.starter-grid').boundingBox();const cdp=await page.context().newCDPSession(page);
 const tx=grid.x+grid.width/2,ty=grid.y+grid.height-30;
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:tx,y:ty}]});
 for(let i=1;i<=8;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:tx,y:ty-i*30}]});await page.waitForTimeout(20)}
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 assert.ok(await page.locator('.starter-grid').evaluate(e=>e.scrollTop)>50,'Mobile skill list scrolls by touch');
 await page.locator('.choice-card').filter({hasText:'铁卫'}).click();await page.waitForTimeout(300);
 const layout=await page.evaluate(()=>{
   const s=__game.scene.getScene('garden');s.build.add('orbit');s.sync();
   const rect=q=>document.querySelector(q).getBoundingClientRect();
   const pad=rect('.action-pad'), tower=rect('#tower-tools button'), roll=rect('#roll');
   return !document.querySelector('#landscape') && tower.width===tower.height &&
     roll.width===roll.height && innerWidth-roll.right<20 && innerHeight-roll.bottom<20 &&
     getComputedStyle(document.querySelector('#roll')).borderRadius==='50%' &&
     roll.top-rect('#tower-tools button:last-child').bottom>=24 &&
     Math.abs(roll.x+roll.width/2-tower.x-tower.width/2)<1 &&
     [...document.querySelectorAll('#tower-tools button')].every((el,i)=>{
       const r=el.getBoundingClientRect();return r.x===tower.x && r.y>=tower.y+i*tower.height;
     }) &&
     innerWidth-pad.right<20 && innerHeight-rect('.stats').bottom<=5 && rect('.stats').left<=5 &&
     rect('.game-top').top>=rect('.mission-clock').bottom && rect('.game-top').left>innerWidth/2 &&
     rect('#skills').top>=rect('.bar.xp').bottom;
 });
 assert.ok(layout,'Portrait controls, skills and action pad');
 const touchStart=await page.evaluate(()=>__game.scene.getScene('garden').player.x);
 await page.mouse.move(260,400);await page.mouse.down();await page.mouse.move(305,400,{steps:5});await page.waitForTimeout(350);await page.mouse.up();
 assert.ok(await page.evaluate(()=>__game.scene.getScene('garden').player.x)>touchStart+20,'Touch-style floating joystick');
 await page.screenshot({path:'artifacts/battle-mobile.png'});
 await page.setViewportSize({width:844,height:390});await page.waitForTimeout(200);
 await page.keyboard.press('Space');await page.screenshot({path:'artifacts/pause-landscape.png'});
 await page.getByRole('button',{name:/继续行动/}).click();
 assert.deepEqual(errors,[],'No page or HTTP errors');
 console.log('PASS: 5 class choices, movement, one-tap tower construction and exit, pause/resume, combat, upgrade, boss HUD, restart cleanup, mobile/landscape; no browser errors');
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
