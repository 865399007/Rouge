import { waves } from "./encounters.js";
import { CLASSES } from "./classes.js";
import { mounts } from "./mounts.js";
import { skills } from "./battle-skills.js";

export const stages = [
  ["旧街哨站","街口虫群","bug","runner","front"],
  ["雾港双桥","两岸夹击","spitter","moth","crossfire"],
  ["锈轨货场","铁甲纵队","crab","brute","front"],
  ["孢子温室","孢子交火","pod","wisp","crossfire"],
  ["断层矿道","跃袭矿道","hopper","ram","sweep"],
  ["霓虹环道","锯轮绕袭","saw","runner","surround"],
  ["沉钟码头","重炮封锁","snail","needle","crossfire"],
  ["风暴高架","突击车队","ram","saw","sweep"],
  ["静默天线阵","哨兵包围","twin","wisp","surround"],
  ["黎明要塞","铁壁合围","brute","twin","surround"],
];
export function stageWaves(index) {
  const [,theme,first,second,formation] = stages[index];
  return waves.map((wave,i) => {
    const featured = i % 3 === 0 || i === 8;
    const total = wave.total + Math.floor(index * (1+i/10));
    const batches = Math.ceil(total / wave.count);
    return {...wave, total, interval: 20 / Math.max(1,batches-1),
      ...(featured ? {name:theme, kinds:[first,second,...wave.kinds],
        crossfire:formation==="crossfire", sweep:formation==="sweep", surround:formation==="surround"} : {})};
  });
}

const key = "rouge-lobby-v1";
const costs = [0,4,8,14,22];
const attributes = {hp:["体魄","生命 +8"], power:["力量","全伤害 +4%"], armor:["坚韧","护甲 +2"]};
const equipment = {
  weapon: CLASSES.map(j=>({id:j.id,name:j.weapon,image:j.texture})),
  mount: mounts.map(m=>({id:m.id,name:m.name,image:"mount-"+m.id})),
};
export function loadLobby() {
  const fresh = {level:1,xp:0,points:0,tickets:3,stats:{},skills:{},gear:{},wins:{},stage:0};
  try {return {...fresh,...JSON.parse(localStorage.getItem(key))};} catch {return fresh;}
}
export function saveLobby(profile) { localStorage.setItem(key,JSON.stringify(profile)); }
const nextXP = level => 80 + level*20;
export function rewardVictory(profile,stage) {
  const xp = 100 + stage*15, tickets = 3 + Math.floor(stage/3);
  profile.xp += xp;
  profile.tickets += tickets;
  profile.wins[stage] = (profile.wins[stage] || 0)+1;
  let gained = 0;
  while (profile.xp >= nextXP(profile.level)) {
    profile.xp -= nextXP(profile.level++);
    profile.points += 2;
    gained += 2;
  }
  return `${stages[stage][0]}通关 · 经验 +${xp} · 抽奖券 +${tickets}` + (gained ? ` · 属性点 +${gained}` : "");
}
function gear(profile,category,id) {
  return profile.gear[category+"-"+id] ??= {rank:1,shards:0};
}
export function drawShards(profile,category,random=Math.random) {
  const pool = equipment[category].filter(item=>{
    const {rank,shards}=gear(profile,category,item.id);
    return shards < costs.slice(rank).reduce((sum,n)=>sum+n,0);
  });
  if (!pool.length || profile.tickets < 1) return "";
  const item = pool[Math.floor(random()*pool.length)];
  const record = gear(profile,category,item.id);
  const amount = Math.min(4+Math.floor(random()*3),costs.slice(record.rank).reduce((sum,n)=>sum+n,0)-record.shards);
  profile.tickets--;
  record.shards += amount;
  return `${item.name}碎片 +${amount}`;
}
export function upgradeGear(profile,category,id) {
  const record = gear(profile,category,id);
  if (record.rank >= 5 || record.shards < costs[record.rank]) return false;
  record.shards -= costs[record.rank++];
  return true;
}
function node(tag,text,cls) {
  const n=document.createElement(tag);
  if(text) n.textContent=text;
  if(cls) n.className=cls;
  return n;
}
export function renderLobby(scene,tab="关卡",message="") {
  const p=scene.profile, overlay=node("div",null,"modal-overlay lobby-overlay");
  const panel=node("section",null,"game-menu lobby-menu");
  overlay.setAttribute("role","dialog"); overlay.setAttribute("aria-label","守夜大厅");
  const action=(text,fn,disabled=false)=>{
    const b=node("button",text); b.disabled=disabled; b.onclick=fn; return b;
  };
  const refresh=(msg="")=>{saveLobby(p);scene.openLobby(tab,msg);};
  panel.append(node("h1","守夜大厅"),node("p",`大厅 Lv.${p.level}　经验 ${p.xp}/${nextXP(p.level)}　属性点 ${p.points}　抽奖券 ${p.tickets}`));
  const tabs=node("nav",null,"lobby-tabs");
  for(const name of ["关卡","角色属性","坐骑","武器","技能"]) {
    const b=action(name,()=>scene.openLobby(name));b.setAttribute("aria-pressed",String(name===tab));tabs.append(b);
  }
  panel.append(tabs);
  if(message) panel.append(node("p",message,"lobby-result"));
  const grid=node("div",null,"lobby-grid");
  const card=(title,detail,fn,disabled=false,image=null)=>{
    const b=action("",fn,disabled);
    if(image){const img=node("img");img.src="./assets/"+image+".svg";img.alt="";b.append(img);}
    b.append(node("strong",title),node("small",detail));grid.append(b);
  };
  if(tab==="关卡") {
    panel.append(node("p","每关十波 · 约五分钟 · 清场后整备"));
    stages.forEach(([name,theme,enemy],i)=>card(`${i+1}. ${name}`,theme+(p.wins[i]?` · 通关 ×${p.wins[i]}`:""),()=>{
      p.stage=i;saveLobby(p);scene.stageName=name;scene.waves=stageWaves(i);scene.chooseClass();
    },false,enemy));
  } else if(tab==="角色属性") {
    panel.append(node("p","每升一级大厅等级获得 2 点，可用于全职业属性或技能专精。"));
    for(const [id,[name,detail]] of Object.entries(attributes))
      card(`${name} +${p.stats[id]||0}`,detail+" · 1 属性点",()=>{
        if(p.points<1)return;p.points--;p.stats[id]=(p.stats[id]||0)+1;refresh();
      },!p.points);
  } else if(tab==="技能") {
    panel.append(node("p","每级专精提升该技能 8% 伤害，所有职业生效。"));
    for(const skill of skills) {
      const rank=p.skills[skill.id]||0;
      card(skill.name,`专精 ${rank}/5 · `+(rank===5?"已满级":"1 属性点"),()=>{
        if(!p.points||rank>=5)return;p.points--;p.skills[skill.id]=rank+1;refresh();
      },!p.points||rank>=5);
    }
  } else {
    const category=tab==="坐骑"?"mount":"weapon";
    panel.append(node("p",`每级提升${tab}攻击伤害 15% · 升级消耗 4 / 8 / 14 / 22 枚对应碎片`));
    panel.append(action(`抽取${tab}碎片 · 1 券`,()=>refresh(drawShards(p,category)||"全部碎片已集齐"),p.tickets<1));
    for(const item of equipment[category]) {
      const {rank,shards}=gear(p,category,item.id),cost=costs[rank];
      card(item.name,`Lv.${rank} · `+(rank===5?"已满级":`碎片 ${shards}/${cost}`+(shards>=cost?" · 升级":"")),
        ()=>{if(upgradeGear(p,category,item.id))refresh(item.name+"升级成功");},rank===5||shards<cost,item.image);
    }
  }
  panel.append(grid);overlay.append(panel);document.getElementById("game").append(overlay);
  scene.panel={element:overlay,destroy:()=>overlay.remove()};
}
