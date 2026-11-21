const rows = [
  ["strong","强力箭矢","普通",5,"每级箭矢伤害 +15%。","射术"],
  ["rapid","极速射击","普通",5,"每级攻击速度 +12%。","连射"],
  ["aim","致命瞄准","普通",5,"每级暴击率 +8 个百分点。","狙击"],
  ["critical","致命一击","稀有",5,"每级暴击倍率 +25 个百分点。","狙击"],
  ["volley","多重射击","稀有",3,"每级同时多射一箭，主箭保持瞄准。","连射"],
  ["piercingArrow","穿透箭","稀有",3,"每级可额外穿透一个敌人。","冰霜"],
  ["bounce","弹射箭","史诗",3,"每级可转向一个未命中的附近目标。","雷电"],
  ["split","分裂箭","史诗",3,"首次命中分裂为 2／3／4 支半伤子箭，子箭不会再分裂。","箭阵"],
  ["repeat","连射","稀有",3,"每第五次攻击补射一箭，造成 50／75／100% 伤害。","连射"],
  ["ring","环形箭雨","史诗",3,"每六秒向四周发射 8／10／12 支半伤箭。","箭阵"],
  ["splinterArrow","爆炸箭","史诗",3,"命中时溅射周围敌人，伤害 25／40／55%，半径逐级增加。","火焰"],
  ["heavy","蓄力重箭","传说",3,"每五秒发射巨箭，造成 2／3／4 倍伤害。","狙击"],
  ["fire","火焰箭","稀有",3,"灼烧每秒造成箭伤的 10%，持续 3／4／5 秒。","火焰"],
  ["ice","寒冰箭","稀有",3,"减速 20／25／30%，叠至五层冻结一秒。","冰霜"],
  ["shock","雷电箭","稀有",3,"命中有 20／25／30% 概率连锁 2／2／3 个附近目标。","雷电"],
  ["venom","剧毒箭","稀有",3,"中毒持续 5／6／7 秒，最多五层，每层每秒造成 5% 箭伤。","毒素"],
  ["push","击退箭","普通",3,"每级增加击退距离，首领抵抗大部分位移。","控制"],
  ["health","生命强化","普通",3,"每级增加 20% 基础生命上限并补足新增生命。","生存"],
  ["stride","疾风步","普通",3,"每级增加 10% 基础移动速度。","生存"],
  ["hunt","精英猎手","稀有",3,"每级对精英和首领额外造成 15% 箭伤。","狙击"],
];
export const rangerCards = rows.map(([id,name,rarity,max,description,tag])=>({id,name,rarity,max,description,tag}));
export const evolutions = [
  ["storm","无限箭幕","volley","rapid","连续齐射逐次增加箭数，最多额外五支，停火重置。"],
  ["thunder","雷神之箭","shock","bounce","每次命中释放连锁闪电，最多追加六个不同目标。"],
  ["zero","绝对零度","ice","piercingArrow","冰霜达到五层时，冻结周围目标。"],
  ["sniper","灭世一箭","heavy","aim","重箭必暴击，对首个目标额外造成 50% 伤害。"],
].map(([id,name,a,b,description])=>({id,name,requires:[a,b],description,max:1,rarity:"进化"}));
const weights = {普通:55,稀有:30,史诗:12,传说:3};
export function rangerDraft(build, fallback) {
  const ranks=build.attributes;
  const unlocked=evolutions.filter(c=>!ranks[c.id] && c.requires.every(id=>ranks[id]>=3));
  const choices=[];
  const pick=pool=>pool[Math.floor(build.random()*pool.length)];
  if (unlocked.length && evolutions.filter(c=>ranks[c.id]).length<2) choices.push(pick(unlocked));
  const pool=rangerCards.filter(c=>(ranks[c.id]||0)<c.max);
  const tags=new Set(rangerCards.filter(c=>ranks[c.id]).map(c=>c.tag));
  while(choices.length<4 && pool.length){
    const synergy=pool.filter(c=>tags.has(c.tag));
    const candidates=synergy.length && !choices.some(c=>tags.has(c.tag)) ? synergy : pool;
    const groups=Object.keys(weights).filter(r=>candidates.some(c=>c.rarity===r));
    let roll=build.random()*groups.reduce((n,r)=>n+weights[r],0);
    const rarity=groups.find(r=>(roll-=weights[r])<0) || groups.at(-1);
    const card=pick(candidates.filter(c=>c.rarity===rarity));
    choices.push(card);pool.splice(pool.indexOf(card),1);
  }
  const rest=fallback.filter(c=>!choices.some(p=>p.id===c.id));
  while(choices.length<4 && rest.length) choices.push(rest.splice(Math.floor(build.random()*rest.length),1)[0]);
  return choices.map(c=>({...c,kind:"attribute",level:(ranks[c.id]||0)+1}));
}

const elementColors = {fire:0xff853e, ice:0x99eaff, shock:0xffe764, venom:0xa4e65b};

function drawElementMark(art, element, x, y, size) {
  art.fillStyle(elementColors[element], .95).lineStyle(1.5, elementColors[element], .95);
  if (element === "fire") {
    art.fillTriangle(x-size*2,y+size,x,y-size,x+size,y+size).fillCircle(x,y,size*.8);
  } else if (element === "ice") {
    art.fillTriangle(x-size*1.7,y,x,y-size,x+size,y).fillTriangle(x-size*1.7,y,x,y+size,x+size,y);
  } else if (element === "shock") {
    art.beginPath().moveTo(x-size*2,y+size).lineTo(x,y-size).lineTo(x,y+size).lineTo(x+size*2,y-size).strokePath();
  } else {
    art.strokeCircle(x,y,size).fillCircle(x+size*1.6,y-size,size*.45);
  }
}

const routeStyles = [
  {id:"storm", base:"volley", color:0xffb55d, kind:"fan"},
  {id:"thunder", base:"bounce", color:0xb39aff, kind:"bolt"},
  {id:"zero", base:"piercingArrow", color:0x65ddf1, kind:"crystal"},
  {id:"sniper", base:"heavy", color:0xff648d, kind:"sight"},
  {base:"split", color:0x9ce88d, kind:"fork"},
  {base:"splinterArrow", color:0xff754f, kind:"burst"},
];

function drawRoute(art, route, x, y, rank, evolved) {
  const radius = 2.5 + Math.min(3,rank);
  art.lineStyle(evolved ? 2 : 1.3,route.color,.95);
  for (let i=0;i<Math.min(3,rank);i++) {
    const offset=(i-(Math.min(3,rank)-1)/2)*3;
    if (route.kind==="fan" || route.kind==="fork")
      art.lineBetween(x+radius,y,x-radius,y+offset*1.8);
    else if (route.kind==="bolt")
      art.beginPath().moveTo(x-radius,y+offset).lineTo(x,y+offset-3).lineTo(x,y+offset+2).lineTo(x+radius,y+offset-2).strokePath();
    else if (route.kind==="crystal")
      art.strokeTriangle(x+radius,y+offset,x-radius,y+offset-2,x-radius,y+offset+2);
    else if (route.kind==="sight")
      art.strokeCircle(x,y,2+i*2);
    else {
      const a=i*Math.PI/3;
      art.lineBetween(x-radius*Math.cos(a),y-radius*Math.sin(a),x+radius*Math.cos(a),y+radius*Math.sin(a));
    }
  }
  if(evolved) art.strokeCircle(x,y,radius+3);
}

function elementalImpact(s, arrow, target) {
  // Share a short visual cooldown per target; every hit still applies its status.
  const now=s.combat.time;
  if ((!arrow.elements.length && !arrow.routes.length) || target.elementFxUntil>now) return;
  target.elementFxUntil=now+.12;
  const phase=Math.random()*Math.PI*2;
  if(arrow.routes.length){
    const art=s.add.graphics({x:target.s.x,y:target.s.y}).setDepth(8);
    arrow.routes.forEach((route,i)=>{
      const a=phase+i*2*Math.PI/arrow.routes.length;
      drawRoute(art,route,10*Math.cos(a),10*Math.sin(a),s.build.attributes[route.base],s.build.attributes[route.id]);
    });
    s.effect(art,.28,0,0,1.6);
  }
  for(const [index,element] of arrow.elements.entries()){
    const rank=s.build.attributes[element];
    const particles=s.add.graphics({x:target.s.x,y:target.s.y}).setDepth(8);
    for(let i=0;i<3+rank;i++){
      const angle=phase+index*.9+i*2.4, radius=5+i*2;
      drawElementMark(particles,element,Math.cos(angle)*radius,Math.sin(angle)*radius,1.8+rank*.45);
    }
    if(rank>=2) drawElementMark(particles,element,0,0,4);
    if(rank>=3){
      for(let j=0;j<4;j++){
        const a=phase+j*Math.PI/2;
        drawElementMark(particles,element,18*Math.cos(a),18*Math.sin(a),2.3);
      }
    }
    s.effect(particles,element==="venom"?.42:.24,0,element==="fire"||element==="venom"?-28:0,1.4);
  }
}

function shoot(s,x,y,angle,damage,opts={}) {
  if(s.bullets.length>=250)return;
  const ranks=s.build.attributes;
  const elements=Object.keys(elementColors).filter(element=>ranks[element]);
  const routes=routeStyles.filter(route=>ranks[route.base] && (route.base!=="heavy" || opts.heavy));
  const color=elements.length ? elementColors[elements[0]] : routes[0]?.color ?? s.job.color;
  const sprite=s.add.graphics({x,y}).setDepth(7).setRotation(angle).setScale(opts.heavy?1.8:1)
    .fillStyle(color,.85).fillTriangle(-36,0,0,-2,0,2).fillStyle(0xffedbb).fillTriangle(-3,-3,5,0,-3,3);
  elements.forEach((element,index)=>{
    drawElementMark(sprite,element,-6-index*7,0,2+ranks[element]*.55);
  });
  routes.forEach((route,i)=>drawRoute(sprite,route,-9-i*6,5,ranks[route.base],ranks[route.id]));
  if (opts.delay) sprite.setVisible(false);
  s.bullets.push({s:sprite,vx:560*Math.cos(angle),vy:560*Math.sin(angle),damage,
    pierce:1+(ranks.piercingArrow||0),bounces:ranks.bounce||0,age:0,life:s.job.range/560,
    trail:0,attachedTrail:true,rangerArrow:true,elements,routes,hit:new Set(opts.ignore?[opts.ignore]:[]),...opts,color});
}
export function fireRanger(s,angle,damage){
  const r=s.build.attributes, now=s.combat.time;
  const state=s.rangerFire??={shots:0,ringAt:now+6,heavyAt:now+5,last:-Infinity,streak:0};
  const cooldown=s.job.cooldown*(1-s.build.haste)/(1+.12*(r.rapid||0));
  s.weaponClock=cooldown;
  state.streak=now-state.last<cooldown+.25?Math.min(5,state.streak+1):0;
  state.last=now;state.shots++;
  const count=1+(r.volley||0)+(r.storm?state.streak:0);
  const fire=(a,m=1,opts)=>shoot(s,s.player.x,s.player.y,a,damage*m,opts);
  for(let i=0;i<count;i++)fire(angle+Math.ceil(i/2)*(i%2?1:-1)*Math.PI/15);
  if(r.repeat && state.shots%5===0)fire(angle,.25+.25*r.repeat,{delay:.12});
  if(r.ring && now>=state.ringAt){
    const n=6+2*r.ring;
    for(let i=0;i<n;i++)fire(angle+i*Math.PI*2/n,.5);
    state.ringAt=now+6;
  }
  if(r.heavy && now>=state.heavyAt){fire(angle,1+r.heavy,{heavy:true});state.heavyAt=now+5;}
}

export function rangerHit(s,arrow,e){
  const r=s.build.attributes, now=s.combat.time, pos=e.s;
  const nearby=(origin,radius)=>s.combat.hash.query(origin.x,origin.y,radius).filter(t=>t!==e && t.s.active && s.distance(origin,t.s)<=radius+t.r);
  const damage=arrow.damage*(1+((e.elite||e.boss) ? .15*(r.hunt||0):0));
  elementalImpact(s,arrow,e);
  const first=!arrow.struck;arrow.struck=true;
  const deadly=arrow.heavy && r.sniper;
  s.hit(e,damage*(deadly && first?1.5:1)*100/(100+(e.armor||0)),arrow.color,{arrow:true,forceCrit:deadly});
  if(r.splinterArrow){
    const radius=48+12*r.splinterArrow;
    s.effect(s.add.graphics({x:pos.x,y:pos.y}).setDepth(7).lineStyle(2,0xffb572,.8).strokeCircle(0,0,radius),.16);
    for(const t of nearby(pos,radius))s.combat.damage(t,damage*(.1+.15*r.splinterArrow));
  }
  e.status??={};
  if(r.fire){e.status.fire=now+2+r.fire+.01;e.burnDamage=damage*.1;}
  if(r.venom){e.poison=Math.min(5,(e.status.poison>now?e.poison||0:0)+1);e.status.poison=now+4+r.venom+.01;e.poisonDamage=damage*.05;}
  if((r.fire||r.venom) && !(e.dotAt>now))e.dotAt=now+1;
  if(r.ice){
    e.iceStacks=(e.arrowIceUntil>now?e.iceStacks||0:0)+1;e.arrowIceUntil=now+3;e.arrowSlow=1-(.15+.05*r.ice)*(e.boss?.5:1);
    if(e.iceStacks>=5){
      e.iceStacks=0;
      for(const t of [e,...(r.zero?nearby(pos,80):[])]){
        if((t.freezeImmuneUntil||0)>now)continue;
        t.frozenUntil=now+(t.boss?.22:1);t.freezeImmuneUntil=t.frozenUntil+(t.boss?2.5:.4);
      }
    }
  }
  if(r.thunder || (r.shock && s.build.random()<.15+.05*r.shock)){
    const hit=new Set([e]);let origin=pos;
    for(let i=0;i<(r.thunder?6:r.shock===3?3:2);i++){
      const t=nearby(origin,140).filter(t=>!hit.has(t)).sort((a,b)=>s.distance(origin,a.s)-s.distance(origin,b.s))[0];
      if(!t)break;
      hit.add(t);s.effect(s.add.graphics().setDepth(7).lineStyle(2,0x9ae5ff).lineBetween(origin.x,origin.y,t.s.x,t.s.y),.12);
      s.combat.damage(t,damage*(r.thunder?.8:.45));origin=t.s;
    }
  }
  const angle=Math.atan2(arrow.vy,arrow.vx);
  if(r.push && pos.active){const step=r.push*(e.boss?2:10);s.defenses.move(pos,Math.cos(angle)*step,Math.sin(angle)*step,e.r);}
  if(first && r.split && !arrow.child){
    const n=1+r.split;
    for(let i=0;i<n;i++)shoot(s,pos.x,pos.y,angle+(i-(n-1)/2)*.45,arrow.damage*.5,{child:true,ignore:e});
  }
  if(arrow.bounces>0){
    const t=nearby(pos,200).filter(t=>!arrow.hit.has(t)).sort((a,b)=>s.distance(pos,a.s)-s.distance(pos,b.s))[0];
    if(t){const a=Math.atan2(t.s.y-pos.y,t.s.x-pos.x);arrow.vx=560*Math.cos(a);arrow.vy=560*Math.sin(a);arrow.s.setRotation(a);arrow.pierce++;arrow.bounces--;}
  }
}
