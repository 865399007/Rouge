const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const angle=(a,b)=>Math.atan2(b.y-a.y,b.x-a.x);
const state=s=>s.roleState??={clocks:{},units:[],zones:[],count:0,rage:0,soul:0};
const nearby=(s,p,r)=>s.combat.hash.query(p.x,p.y,r).filter(e=>e.s.active);
const nearest=(s,p,r)=>nearby(s,p,r).sort((a,b)=>distance(p,a.s)-distance(p,b.s))[0];
function ready(s,key,interval){
  const clocks=state(s).clocks,now=s.combat.time;
  if(now<(clocks[key]??0))return false;
  clocks[key]=now+interval;return true;
}
function pulse(s,p,r,color){
  s.effect(s.add.graphics({x:p.x,y:p.y}).setDepth(7).lineStyle(3,color,.8).strokeCircle(0,0,r),.22,0,0,.15);
}
function area(s,p,r,dmg,color,element="physical"){
  pulse(s,p,r,color);
  for(const e of nearby(s,p,r))s.combat.damage(e,dmg,element);
}
function shot(s,p,a,dmg,color,extra={}){
  if(s.bullets.length>=250)return;
  const sprite=s.add.ellipse(p.x,p.y,extra.returning?22:11,8,color).setDepth(7).setRotation(a);
  s.bullets.push({s:sprite,vx:Math.cos(a)*430,vy:Math.sin(a)*430,life:1.4,damage:dmg,color,trail:0,hit:new Set(),pierce:1,element:"physical",age:0,...extra});
}
function heal(s,amount){
  const st=state(s),second=Math.floor(s.combat.time);
  if(st.healSecond!==second){st.healSecond=second;st.healed=0;}
  const gain=Math.max(0,Math.min(amount,s.maxHp*.05-st.healed));st.healed+=gain;s.hp=Math.min(s.maxHp,s.hp+gain);
}
export function roleDefense(s,amount){
  if(!s.job||s.job.id==="ranger")return amount;
  const r=s.build.attributes,st=state(s),now=s.combat.time;
  if(r.格挡 && readyForBlock()){
    st.blockAt=now+.3;amount*=.4;
    if(r.反击剑术 && ready(s,"counter",1.5))area(s,s.player,r.不灭剑圣?155:90,s.build.weaponDamage(s.job.damage)*(.6+.4*r.反击剑术),s.job.color);
    if(r.不灭剑圣)st.guarded=now+1;
  }
  function readyForBlock(){return now>=(st.blockAt||0)&&s.build.random()<.03+.05*r.格挡;}
  if(st.guarded>now)amount*=.8;
  if(r.不屈战意 && s.hp<s.maxHp*.3)amount*=.95-.05*r.不屈战意;
  const absorbed=Math.min(amount,st.shield||0);st.shield=(st.shield||0)-absorbed;return amount-absorbed;
}
function melee(s,r,dmg,axe){
  const st=state(s),now=s.combat.time,p=s.player,j=s.job;
  const range=j.range*(1+.15*(r.剑刃延伸||r.巨斧延伸||0));
  const target=nearest(s,p,range);
  if(!target)return;
  if(r.旋风斩 && ready(s,"spin",(axe?10:9)-r.旋风斩))area(s,p,range,dmg*(axe?1+.3*r.旋风斩:.75+.25*r.旋风斩),j.color);
  if((r.永恒旋风||r.剑刃风暴)&&ready(s,"aura",axe?.7:.6))area(s,p,range,dmg*.6,j.color);
  if(r.幻影剑 && ready(s,"phantom",6))st.phantomUntil=now+4;
  if(st.phantomUntil>now && ready(s,"blades",1)){
    const foes=nearby(s,p,320);
    for(let i=0;i<r.幻影剑+(r.万剑归宗?4:0);i++)shot(s,p,angle(p,foes[i%foes.length].s),dmg*.4,j.color,{homing:true,pierce:r.万剑归宗?2:1});
  }
  if(s.weaponClock>0)return;
  if(st.rageUntil<now)st.rage=0;
  s.weaponClock=j.cooldown*(1-s.build.haste)/(1+.12*(r.疾风剑术||0)+.1*(r.狂暴攻速||0)+st.rage*(.02+.01*(r.狂怒积累||0)));
  st.count++;
  const a=angle(p,target.s),arc=axe?1.25:.85+(r.横扫剑术||0)*Math.PI/18;
  s.effect(s.add.graphics({x:p.x,y:p.y}).setDepth(7).lineStyle(6,j.color,.9).beginPath().arc(0,0,range,a-arc,a+arc).strokePath(),.18);
  const heavy=r.重击 && st.count%(6-r.重击)===0;
  if(heavy && r.大地震击){
    const radius=60+20*r.大地震击;
    for(const scale of r.大地毁灭者?[1,.7,.4]:[.6])area(s,target.s,radius/Math.sqrt(scale),dmg*scale,0xffa15e);
  }
  if(r.剑气斩 && st.count%(r.剑气斩===3?2:3)===0)shot(s,p,a,dmg*(.5+.2*r.剑气斩),j.color,{pierce:1+(r.穿透剑气||0),returning:!!r.回旋剑气&&s.build.random()<.1+.3*r.回旋剑气,returnAt:.45,returnDamage:.5});
  for(const e of nearby(s,p,range)){
    if(Math.cos(angle(p,e.s)-a)<Math.cos(arc))continue;
    let hit=dmg*(heavy?2:1);
    if(e.bleedUntil>now)hit*=1+.1*(r.深度撕裂||0);
    if(r.斩杀 && e.hp<e.maxHp*.25)hit*=1.05+.15*r.斩杀;
    if(r.处刑者&&e.bleedUntil>now&&e.hp<.2*e.maxHp){if(!e.boss)hit=e.hp*3;else if(ready(s,"execute",6))hit*=2.5;}
    if(r.剑意积累){st.focus=st.focusUntil>now?Math.min(5,(st.focus||0)+1):1;st.focusUntil=now+2;hit*=1+st.focus*(.01+.01*r.剑意积累);}
    const hits=r.无限连斩&&st.count%3===0?[1,.9,.9]:r.双重斩击&&st.count%(r.双重斩击===3?2:3)===0?[1,.45+.15*r.双重斩击]:r.双重挥砍&&st.count%(5-r.双重挥砍)===0?[1,.7]:[1];
    for(const scale of hits){if(!e.s.active)break;const actual=s.combat.damage(e,hit*scale);heal(s,actual*(.01*(r.吸血剑刃||0)+(r.血怒战神&&st.rage?.02:0)));}
    if(!e.s.active){if(r.狂怒积累){st.rage=Math.min(r.血怒战神?8:5,st.rage+1);st.rageUntil=now+4;}if(r.嗜血)heal(s,s.maxHp*(.004+.004*r.嗜血));continue;}
    if(r.流血创伤||(r.流血剑刃&&s.build.random()<.1+.1*r.流血剑刃)){e.bleedUntil=now+(axe?4:3)+.01;e.bleedDmg=dmg*(axe?.04+.04*r.流血创伤:.08);if(!(e.bleedTick>now))e.bleedTick=now+1;}
    if(r.破甲重斧){e.armorBase??=e.armor;e.armor=e.armorBase*(1-.05*r.破甲重斧);e.armorUntil=now+4;}
    if(heavy&&r.震荡打击&&s.build.random()<.05+.05*r.震荡打击){if(e.boss)e.chilledUntil=now+.8;else e.frozenUntil=now+.8;}
    if(axe&&!e.boss)s.defenses.move(e.s,Math.cos(a)*12*(1+.15*(r.击退强化||0)),Math.sin(a)*12*(1+.15*(r.击退强化||0)),e.r);
  }
}
function magic(s,r,dmg){
  const now=s.combat.time,p=s.player,st=state(s),rad=1+.12*(r.魔法扩散||0),master=1+.1*(r.元素精通||0);
  const freeze=e=>{e.frostCharge=(e.frostCharge||0)+(1+.15*(r.冰冻强化||0))*master;e.chilledUntil=s.combat.time+2;if(e.frostCharge>=2){e.frozenUntil=s.combat.time+(e.boss?.2:e.elite?.5:1);e.frostCharge=0;}};
  if(r.魔法护盾&&ready(s,"ward",12))st.shield=s.maxHp*(.05+.05*r.魔法护盾);
  const target=nearest(s,p,480);
  for(const z of st.zones){
    if(z.until<=now)continue;
    if(z.hole)for(const e of nearby(s,z,85*rad)){if(!e.boss){const a=angle(e.s,z);s.defenses.move(e.s,Math.cos(a)*(e.elite?.5:2),Math.sin(a)*(e.elite?.5:2),e.r);}}
    if(now>=z.tick){z.tick=now+1;pulse(s,z,65*rad,z.hole?0x9064ce:0xf07c52);
      if(!z.hole)for(const e of nearby(s,z,65*rad))s.combat.damage(e,dmg*.3,"fire");
      else if(r.虚空法师&&target)for(let i=0;i<3;i++)shot(s,z,angle(z,target.s)+i*.15,dmg*.3,0xad88ef,{homing:true});}
  }
  st.zones=st.zones.filter(z=>z.until>now);
  if(!target)return;
  const q=target.s,a=angle(p,q);
  function cast(key,seconds){if(!r[key]||!ready(s,key,seconds*Math.max(.6,(1-.05*(r.冷却缩减||0))/(1+.12*(r.快速施法||0)))))return false;
    st.casts=(st.casts||0)+1;if(r.魔力爆发&&st.casts%(9-r.魔力爆发)===0)area(s,p,130*rad,dmg*.8,0xd499ff);return true;}
  if(cast("火球术",3))shot(s,p,a,dmg*(.6+.3*r.火球术),0xff903c,{onImpact:e=>{
    area(s,e.s,65*rad,dmg*(.6+.3*r.火球术),0xff903c,"fire");
    for(let i=0;i<(r.连珠火球||0);i++)shot(s,e.s,a+(i-1)*.45,dmg*.3,0xffc782,{element:"fire"});
    if(r.火焰地带)st.zones.push({x:e.s.x,y:e.s.y,until:s.combat.time+1+r.火焰地带,tick:0});
    if(r.烈焰大法师)for(const t of nearby(s,e.s,100*rad).slice(0,5))s.combat.damage(t,dmg*.6,"fire");
  }});
  if(cast("冰锥术",4))for(let i=0;i<2+r.冰锥术;i++)shot(s,p,a+(i-(1+r.冰锥术)/2)*.14,dmg*.5,0x9decff,{onImpact:e=>{s.combat.damage(e,dmg*.5,"frost");freeze(e);}});
  if(cast("冰霜新星",11-r.冰霜新星)){pulse(s,p,145*rad,0x99efff);for(const e of nearby(s,p,145*rad)){s.combat.damage(e,dmg*.8);freeze(e);}}
  if(r.极寒领域&&ready(s,"cold",1))for(const e of nearby(s,p,140))freeze(e);
  if(cast("闪电链",4)){const seen=new Set();let origin=p;for(let i=0;i<2+r.闪电链+(r.雷电共鸣||0);i++){const e=nearby(s,origin,i?160:480).filter(t=>!seen.has(t)).sort((a,b)=>distance(origin,a.s)-distance(origin,b.s))[0];if(!e)break;seen.add(e);beam(s,origin,e.s,0xc3a7ff);s.combat.damage(e,dmg*master*.85**i,"lightning");origin=e.s;}}
  if(cast("落雷术",8-r.落雷术))area(s,q,44*rad,dmg*1.5,0xf3d370,"lightning");
  if(r.雷霆之主&&ready(s,"cloud",6))st.cloudShots=3;
  if(st.cloudShots && ready(s,"cloudStrike",.4)){st.cloudShots--;beam(s,{x:q.x,y:q.y-75},q,0xe2c5ff);area(s,q,50,dmg*.65,0xe2c5ff,"lightning");}
  if(cast("陨石术",13-r.陨石术))for(let i=0;i<(r.陨星术士?3:1);i++)area(s,{x:q.x+(i?Math.cos(i*3)*46:0),y:q.y+(i?Math.sin(i*3)*46:0)},76*rad,dmg*(1.9+.3*r.陨石术)*(r.陨星术士?.7:1),0xff8559,"fire");
  if(cast("奥术飞弹",5))for(let i=0;i<1+r.奥术飞弹;i++)shot(s,p,a+i*.2,dmg*.45,0xe198f5,{homing:true});
  if(cast("黑洞术",16-r.黑洞术))st.zones.push({x:q.x,y:q.y,hole:true,tick:0,until:now+3});
}
function beam(s,p,q,color){s.effect(s.add.graphics().setDepth(7).lineStyle(3,color,.9).lineBetween(p.x,p.y,q.x,q.y),.15);}
const species=[
  ["狼群召唤","hound",.7,38],["骷髅战士","hero-swordsman",.85,45],["骷髅弓手","hero-ranger",.65,240],
  ["石头魔像","rock",1,58],["火焰精灵","orb",.75,180],["雷电精灵","orb",.75,180]
];
function army(s,r,dmg,dt){
  const st=state(s),now=s.combat.time,p=s.player,cap=Math.min(12,4+(r.召唤扩容||0)+(r.召唤之王?2:0)+(r.亡灵大军?4:0));
  let slots=st.units.reduce((n,u)=>n+u.cost,0);
  function spawn(spec,cost,clone=false){
    const [key,texture]=spec,level=r[key],hp=(key==="石头魔像"?50*(2+level):45)*(1+.2*(r.生命链接||0))*(clone?.5:1);
    const art=s.add.image(p.x+Math.cos(slots)*28,p.y+Math.sin(slots)*28,texture).setDepth(5).setScale(cost>1?.9:.5);
    if(key==="火焰精灵"||key==="雷电精灵")art.setTint(key==="火焰精灵"?0xff925c:0xc5b0ff);
    st.units.push({spec,cost,clone,art,hp,max:hp,next:now+.2,hurt:0,shield:r.不死军团?hp*.15:0,hits:0});slots+=cost;
  }
  for(const spec of species){
    const key=spec[0],cost=key==="石头魔像"&&r.泰坦魔像?4:key==="狼群召唤"&&r.狼王军团?2:1;
    const desired=key==="石头魔像"?Math.min(1,r[key]||0):(r[key]||0)+(r.亡灵大军&&key.startsWith("骷髅")?2:0);
    if(now<(st.clocks["revive"+key]||0))continue;
    for(let i=st.units.filter(u=>u.spec===spec&&!u.clone).length;i<desired&&slots+cost<=cap;i++)spawn(spec,cost);
  }
  const shield=r.召唤护盾&&ready(s,"minionWard",10);
  for(const u of [...st.units]){
    const [key,,factor,reach]=u.spec;
    if(shield)u.shield=u.max*(.05+.05*r.召唤护盾);
    const e=nearest(s,u.art,370),goal=e?.s||p,dist=distance(u.art,goal),a=angle(u.art,goal);
    if(dist>(e?reach:45)){const step=Math.min(dist,dt*170);u.art.x+=step*Math.cos(a);u.art.y+=step*Math.sin(a);}
    if(!e)continue;
    if(dist<e.r+28 && now>=u.hurt){u.hurt=now+1;const hit=e.damage||8;u.hp-=Math.max(0,hit-u.shield);u.shield=Math.max(0,u.shield-hit);}
    if(u.hp<=0){
      if(r.死亡爆炸){pulse(s,u.art,75,0xc4dc96);for(const t of nearby(s,u.art,75))s.combat.damage(t,Math.min(t.elite||t.boss?dmg*2:Infinity,u.max*(.05+.05*r.死亡爆炸)*(r.不死军团?1.5:1)));}
      u.art.destroy();st.units.splice(st.units.indexOf(u),1);slots-=u.cost;
      st.clocks["revive"+key]=now+5*(1-.15*(r.快速再召唤||0));
      if(!u.clone&&u.cost===1&&r.召唤分裂&&s.build.random()<.05+.1*r.召唤分裂)spawn(u.spec,1,true);
      continue;
    }
    if(dist>reach+e.r||u.next>now)continue;
    u.hits++;
    if(u.hits%3===0&&r.召唤狂暴)u.frenzy=now+3;
    u.next=now+1.1/((1+.12*(r.召唤迅捷||0))*(u.frenzy>now?1+.1*r.召唤狂暴:1));
    let hit=dmg*(key==="石头魔像"?1+.3*(r[key]-1):factor)*(1+.15*(r.召唤强化||0)+.1*(r.召唤继承||0))*(1+(st.units.length>=3&&r.群体强化?.04+.04*r.群体强化:0))*(r.召唤之王?1.15:1);
    if(s.build.random()<.06*(r.召唤暴击||0))hit*=1.5;
    if(st.soulUntil>now)hit*=1+.03*st.soul;
    const element=key==="火焰精灵"?"fire":key==="雷电精灵"?"lightning":"physical";
    beam(s,u.art,e.s,element==="fire"?0xffa96e:element==="lightning"?0xbbaaff:0xb7dfac);
    heal(s,s.combat.damage(e,hit,element)*.01*(r.生命汲取||0));
    if(u.cost>1)for(const t of nearby(s,e.s,65))if(t!==e)s.combat.damage(t,hit*.65);
    if(element==="lightning"&&s.build.random()<.2){const t=nearby(s,e.s,120).find(t=>t!==e);if(t)s.combat.damage(t,hit*.7,"lightning");}
    if(r.元素军团&&element!=="physical"){if(e.spiritElement&&e.spiritElement!==element&&!(e.spiritLock>now)){area(s,e.s,55,hit*.6,0xffacde);e.spiritLock=now+1;}e.spiritElement=element;}
  }
  if(r.灵魂收集&&s.kills>=(st.soulKills||0)+12-2*r.灵魂收集){st.soulKills=s.kills;st.soul=Math.min(5,(st.soulUntil>now?st.soul:0)+1);st.soulUntil=now+6;}
}
export function updateRole(s,dt){
  const r=s.build.attributes,j=s.job,axe=j.id==="berserker",mage=j.id==="elementalist";
  const dmg=s.build.weaponDamage(j.damage)*(1+.2*(r.巨斧强化||0)+.15*(r.锋利剑刃||r.法术强化||0));
  if(axe||j.id==="swordsman")return melee(s,r,dmg,axe);
  if(mage)magic(s,r,dmg);else army(s,r,dmg,dt);
  if(s.weaponClock>0)return;
  const target=nearest(s,s.player,j.range);
  if(!target)return;
  s.weaponClock=j.cooldown*(1-s.build.haste)/(1+.12*(r.快速施法||0));
  shot(s,s.player,angle(s.player,target.s),dmg,j.color);
}
