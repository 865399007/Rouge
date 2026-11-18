const {chromium}=require('./playwright-runtime.cjs');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'msedge'}),page=await browser.newPage({viewport:{width:1280,height:800}});page.on('pageerror',e=>console.log('ERROR',e.message));
 await page.goto('http://127.0.0.1:5173/?debug');await page.waitForFunction(()=>__game?.scene.getScene('garden')?.player);
 const report=[];
 for(const id of ['ranger','vanguard','pyromancer','engineer','warden','astronomer']){
  await page.evaluate(()=>__game.scene.getScene('garden').scene.restart());await page.waitForFunction(()=>__game.scene.getScene('garden').mode==='ready');
  const result=await page.evaluate(async ({id,invulnerable})=>{
   const {TOWER_TUNING}=await import('./balance.js');const s=__game.scene.getScene('garden');s.selectClass(id);if(invulnerable)s.invincible=10000;
   let seed=8675309;s.build.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
   s.impact=()=>{};s.flashEnemy=()=>{};s.effect=obj=>obj.destroy();s.damageNumbers.add=()=>{};s.sync=()=>{};
   const origin={x:s.player.x,y:s.player.y},stats={firstUpgrade:null,checkpoints:[],bossSpawns:[]};let lastMinute=-1,towerCheck=0;
   for(let frame=0;frame<19200;frame++){
    if(s.mode==='end')break;
    if(s.mode==='upgrade'){
     stats.firstUpgrade??=s.runTime;
     const cards=[...document.querySelectorAll('.choice-card')];
     const ranked=cards.map(card=>({card,score:(/火力训练|快速装填/.test(card.textContent)?5:0)+(/技能 Lv/.test(card.textContent)?6:0)+(/获得新技能/.test(card.textContent)?8:0)+(/强化体魄|战地恢复/.test(card.textContent)&&s.hp/s.maxHp<.5?9:0)})).sort((a,b)=>b.score-a.score);
     ranked[0].card.click();continue;
    }
    const nearby=s.enemies.map(e=>({e,d:s.distance(s.player,e.s)})).sort((a,b)=>a.d-b.d);
    let vx=0,vy=0;
    const desired=id==='vanguard'?90:id==='engineer'?125:170;
    const nearest=nearby[0];
    if(nearest){
     const dx=nearest.e.s.x-s.player.x,dy=nearest.e.s.y-s.player.y;
     const direction=nearest.d>desired+30?1:nearest.d<desired?-1:0;
     vx+=dx/Math.max(1,nearest.d)*direction;vy+=dy/Math.max(1,nearest.d)*direction;
     vx+=-dy/Math.max(1,nearest.d)*.3;vy+=dx/Math.max(1,nearest.d)*.3;
    }
    for(const {e,d} of nearby.slice(0,15))if(d<95){vx+=(s.player.x-e.s.x)/Math.max(1,d)*(95-d)/32;vy+=(s.player.y-e.s.y)/Math.max(1,d)*(95-d)/32}
    const gems=[...s.gems,...s.defenses.drops.map(d=>d.sprite)].sort((a,b)=>s.distance(s.player,a)-s.distance(s.player,b));
    const gem=gems.find(g=>s.distance(s.player,g)<230 && nearby.every(({e})=>s.distance(g,e.s)>75));
    if(gem && (!nearest||nearest.d>75)){
     const d=Math.max(1,s.distance(s.player,gem));vx+=(gem.x-s.player.x)/d*1.8;vy+=(gem.y-s.player.y)/d*1.8;
    }
    if(id==='engineer' && s.classTurrets.length && (!nearest||nearest.d>90)){
     const t=s.classTurrets.at(-1),d=Math.max(1,s.distance(s.player,t));if(d>200){vx+=(t.x-s.player.x)/d;vy+=(t.y-s.player.y)/d}
    }
    const margin=200;
    if(s.player.x<margin)vx+=2;if(s.player.y<margin)vy+=2;if(s.player.x>s.defenses.width-margin)vx-=2;if(s.player.y>s.defenses.height-margin)vy-=2;
    const len=Math.hypot(vx,vy);if(len)s.defenses.move(s.player,vx/len*s.speed/30,vy/len*s.speed/30,25);
    if(frame>towerCheck && s.defenses.stock>=3){
     towerCheck=frame+150;const type=TOWER_TUNING[0];s.defenses.drag={type};
     for(let i=0;i<8;i++){const a=i*Math.PI/4,point={x:s.player.x+Math.cos(a)*100,y:s.player.y+Math.sin(a)*100};if(s.defenses.valid(point)){s.defenses.build(type,point);break}}
     s.defenses.cancel();
    }
    s.step(frame*1000/30,1000/30);
    const minute=Math.floor(s.runTime/60);if(minute!==lastMinute){lastMinute=minute;stats.checkpoints.push({t:Math.round(s.runTime),level:s.level,hp:Math.round(s.hp),kills:s.kills,bosses:s.enemies.filter(e=>e.boss).length})}
   }
   return {class:id,time:Math.round(s.runTime),mode:s.mode,hp:Math.round(s.hp),level:s.level,kills:s.kills,skills:s.build.active.map(k=>k.id+':'+k.level),finalAlive:s.enemies.some(e=>e.final),towerCount:s.defenses.towers.length,firstUpgrade:Math.round(stats.firstUpgrade||0),checkpoints:stats.checkpoints,scheduledBosses:[...s.nodes]};
  },{id,invulnerable:process.env.SIM_INVULNERABLE==='1'});
  report.push(result);console.log(JSON.stringify(result));
 }
 require('node:fs').writeFileSync(process.env.SIM_INVULNERABLE==='1'?'artifacts/balance-throughput.json':'artifacts/balance-simulation.json',JSON.stringify(report,null,2));await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
