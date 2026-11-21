import { waves } from "./encounters.js";
import { CLASSES } from "./classes.js";
import { mounts } from "./mounts.js";

export const stages = [
  ["旧街哨站","街口尸群","bug","runner","front"],
  ["雾港双桥","两岸夹击","spitter","moth","crossfire"],
  ["锈轨货场","铁甲纵队","crab","brute","front"],
  ["孢子温室","疫囊交火","pod","wisp","crossfire"],
  ["断层矿道","跃袭矿道","hopper","ram","sweep"],
  ["霓虹环道","锯臂绕袭","saw","runner","surround"],
  ["沉钟码头","重炮封锁","snail","needle","crossfire"],
  ["风暴高架","突击车队","ram","saw","sweep"],
  ["静默天线阵","哨兵包围","twin","wisp","surround"],
  ["黎明要塞","铁壁合围","brute","twin","surround"],
];
const spawnWindowSeconds = 50;
export function stageWaves(index) {
  const [,theme,first,second,formation] = stages[index];
  return waves.map((wave,i) => {
    const featured = i % 3 === 0 || i === 8;
    const total = Math.round(wave.total * 0.5) + Math.floor(index * (1 + i / 10));
    const count = 4 + i;
    const interval = spawnWindowSeconds / (Math.ceil(total / count) - 1);
    return {...wave, total, count, interval,
      ...(featured ? {name:theme, kinds:[first,second,...wave.kinds],
        crossfire:formation==="crossfire", sweep:formation==="sweep", surround:formation==="surround"} : {})};
  });
}

const key = "rouge-lobby-v1";
const costs = [0,4,8,14,22];
const equipment = {
  weapon: CLASSES.map(j=>({id:j.id,name:j.weapon,image:j.texture})),
  mount: mounts.map(m=>({id:m.id,name:m.name,image:"mount-"+m.id})),
};
export function lastUnlockedStage(wins) {
  const firstUncleared = stages.findIndex((_, i) => !(wins[i] > 0));
  return firstUncleared < 0 ? stages.length - 1 : firstUncleared;
}
export function loadLobby() {
  const fresh = {level:1,xp:0,points:0,tickets:3,stats:{},skills:{},gear:{},wins:{},stage:0};
  try {
    const profile = {...fresh,...JSON.parse(localStorage.getItem(key))};
    const limit = lastUnlockedStage(profile.wins);
    if (!Number.isInteger(profile.stage) || profile.stage < 0 || profile.stage > limit) profile.stage = limit;
    return profile;
  } catch {return fresh;}
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
export function renderLobby(scene,message="") {
  const p=scene.profile, overlay=node("div",null,"modal-overlay lobby-overlay");
  const panel=node("section",null,"game-menu lobby-menu");
  overlay.setAttribute("role","dialog"); overlay.setAttribute("aria-label","守夜大厅");
  const action=(text,fn,disabled=false)=>{
    const b=node("button",text); b.disabled=disabled; b.onclick=fn; return b;
  };
  panel.append(node("h1","守夜大厅"),node("p",`大厅 Lv.${p.level}　经验 ${p.xp}/${nextXP(p.level)}`));
  if(message) panel.append(node("p",message,"lobby-result"));
  const grid=node("div",null,"lobby-grid");
  const card=(title,detail,fn,disabled=false,image=null)=>{
    const b=action("",fn,disabled);
    if(image){const img=node("img");img.src="./assets/"+image+".svg";img.alt="";b.append(img);}
    b.append(node("strong",title),node("small",detail));grid.append(b);
  };
  panel.append(node("p","每关十波 · 敌人分批出现 · 升级选卡 · 清空本波后整备"));
  const limit = lastUnlockedStage(p.wins);
  grid.classList.add("stage-grid");
  stages.forEach(([name,theme,enemy],i)=>{
    const locked = i > limit;
    const detail = locked ? `通关第 ${i} 关后解锁` : theme + (p.wins[i] ? ` · 通关 ×${p.wins[i]}` : "");
    card(`${i+1}. ${name}`,detail,()=>{
      p.stage=i;saveLobby(p);scene.stageName=name;scene.waves=stageWaves(i);scene.chooseClass();
    },locked,enemy);
  });
  panel.append(grid);overlay.append(panel);document.getElementById("game").append(overlay);
  scene.panel={element:overlay,destroy:()=>overlay.remove()};
}
