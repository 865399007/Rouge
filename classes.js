import {updateRole} from "./role-combat.js";
import { fireRanger } from "./ranger.js";
export const CLASSES = [
  {
    id: "ranger",
    name: "游侠",
    weapon: "双弩",
    icon: "rail",
    texture: "crossbow",
    hp: 100,
    speed: 230,
    armor: 0,
    power: 1,
    crit: 0.05,
    cooldown: 0.8,
    damage: 20,
    range: 470,
    color: 0xe6cc7d,
    description: "起始单箭点射，可通过扇面齐射增加箭道。高机动、低生命，保持距离。",
    strengths: "单体连射 · 快速游走",
    weakness: "生命较低，缺少范围清场",
  },
  ...[
    ["berserker","狂战斧手","巨斧","axe","slash",180,40,1.20,124,0xffa368,"大扇面挥砍 · 重击与流血","攻击间隔较长"],
    ["swordsman","剑士","长剑","blade","slash",140,25,.65,100,0xaadff4,"快速连斩 · 剑气与反击","需要接近敌群"],
    ["elementalist","元素法师","元素法杖","fire-staff","meteor",90,28,1.10,430,0xcc9af6,"远程法球 · 多元素独立施法","生命较低"],
    ["summoner","召唤师","唤灵杖","staff","siphon",90,12,1,400,0x94e4a5,"灵魂法球 · 召唤军团","本体攻击较弱"],
  ].map(([id,name,weapon,texture,icon,hp,damage,cooldown,range,color,strengths,weakness])=>({
    id,name,weapon,texture,icon,hp,damage,cooldown,range,color,strengths,weakness,
    description:strengths,speed:230,power:1,armor:0,crit:id==="swordsman"?.08:.05,
  })),
];
export function classById(id){return CLASSES.find(job=>job.id===id);}
export function updateClassWeapon(scene,dt){
  const job=scene.job;
  if(!job)return;
  scene.weaponClock=Math.max(0,(scene.weaponClock||0)-dt);
  if(job.id!=="ranger")return updateRole(scene,dt);
  if(scene.weaponClock>0)return;
  const target=scene.enemies.filter(e=>e.s.active && scene.distance(scene.player,e.s)<job.range+e.r)
    .sort((a,b)=>scene.distance(scene.player,a.s)-scene.distance(scene.player,b.s))[0];
  if(target)fireRanger(scene,Math.atan2(target.s.y-scene.player.y,target.s.x-scene.player.x),scene.build.weaponDamage(job.damage));
}
