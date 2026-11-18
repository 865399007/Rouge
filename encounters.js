// Quotas count every combatant, including the boss. No clock advances the wave.
export const waves = [
  {name:"游尸逼近", total:18, count:3, interval:1.35, kinds:["bug","rat","moth","spider"]},
  {name:"双巷夹击", total:26, count:4, interval:1.35, kinds:["runner","bug","hound","moth"], crossfire:true},
  {name:"铁卫悬赏", total:30, count:3, interval:1.3, kinds:["crab","runner","bug"], bounty:true},
  {name:"疫囊火线", total:35, count:4, interval:1.35, kinds:["pod","hopper","runner","spitter"], crossfire:true},
  {name:"破门尸魁", total:40, count:4, interval:1.2, kinds:["ram","bug","brute","runner"], bossIndex:0},
  {name:"旋街追猎", total:48, count:5, interval:1.15, kinds:["saw","hopper","moth"], sweep:true},
  {name:"骨刺伏击", total:55, count:5, interval:1.2, kinds:["needle","crab","wisp","runner","crab"], crossfire:true},
  {name:"罐甲尸阵", total:60, count:5, interval:1.1, kinds:["snail","ram","brute","saw"], sweep:true, bossIndex:4},
  {name:"四面合围", total:72, count:6, interval:1, kinds:["twin","runner","moth","needle","hopper","bug"], surround:true},
  {name:"黎明决战", total:80, count:6, interval:.95, kinds:["ram","wisp","saw","crab","runner","twin"], surround:true, bossIndex:8},
];
export function encounterAngle(wave, heading, batch, slot) {
  if (wave.surround) return heading + batch*.37 + slot*Math.PI*2/wave.count;
  if (wave.crossfire) return heading + (slot % 2) * Math.PI + Math.sin(batch * 0.55) * 0.23;
  if (wave.sweep) return heading + Math.floor(batch / 4) * Math.PI / 2 + slot * 0.14;
  return heading + Math.sin(batch * 0.6) * 0.22 + slot * 0.12;
}

export function updateSupply(scene, dt) {
  if (scene.wave < 4 || scene.supplyClaimed) return;
  if (!scene.supply) {
    const spot = scene.defenses.spawn(110, 65);
    if (!spot) return;
    const art = scene.add.graphics({x:spot.x,y:spot.y}).setDepth(2);
    const label = scene.add.text(spot.x,spot.y-32,"",{
      fontSize:"14px",color:"#fff3c8",stroke:"#343427",strokeThickness:3,
    }).setOrigin(0.5).setDepth(9);
    scene.supply = {...spot, art, label, progress:0};
  }
  const post = scene.supply;
  if (scene.distance(scene.player,post) <= 78) post.progress += dt;
  post.art.clear().fillStyle(0xabc77b,0.15).fillCircle(0,0,78)
    .lineStyle(2,0x677853).strokeCircle(0,0,78)
    .fillStyle(0xb99153).fillRoundedRect(-13,-10,26,20,3)
    .lineStyle(2,0x453d30).strokeRoundedRect(-13,-10,26,20,3)
    .lineStyle(4,0xffdb72).beginPath().arc(0,0,76,-Math.PI/2,-Math.PI/2+Math.PI*2*Math.min(1,post.progress/10)).strokePath();
  post.label.setText(`补给 ◆6 · 驻守 ${Math.min(10, Math.floor(post.progress))}/10 秒`);
  if (post.progress + 1e-8 < 10) return;
  scene.supplyClaimed = true;
  scene.defenses.stock += 6;
  scene.defenses.refresh();
  scene.burst(post.x,post.y,0xffd771,12,110);
  post.label.setText("获得 ◆6 材料");
  scene.effect(post.label,1.2,0,-18);
  post.art.destroy();
  scene.supply = null;
}

export function updateBossRing(scene, enemy, dt) {
  enemy.ringClock = (enemy.ringClock ?? 5) - dt;
  if (enemy.ringClock > 1.2) return false;
  const p = enemy.s;
  enemy.gapAngle ??= Math.atan2(scene.player.y-p.y, scene.player.x-p.x) + 0.55;
  const gap = enemy.gapAngle;
  scene.enemyTelegraphs.lineStyle(4,0xe1694f).beginPath()
    .arc(p.x,p.y,76,gap+0.4,gap+Math.PI*2-0.4).strokePath();
  for (const angle of [gap-0.4,gap+0.4]) {
    scene.enemyTelegraphs.lineStyle(2,0xace8aa).lineBetween(p.x+60*Math.cos(angle),p.y+60*Math.sin(angle),
      p.x+110*Math.cos(angle),p.y+110*Math.sin(angle));
  }
  if (enemy.ringClock > 0) return true;
  for (let i=2; i<=22 && scene.hostile.length<100; i++) {
    const a = gap+i*Math.PI/12;
    scene.hostile.push({s:scene.add.image(p.x,p.y,"orb").setTint(0xf18467),
      vx:180*Math.cos(a),vy:180*Math.sin(a),life:4,damage:enemy.damage});
  }
  enemy.ringClock=7;
  enemy.gapAngle=null;
  return true;
}
