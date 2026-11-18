from pathlib import Path
p=Path('game.js');s=p.read_text(encoding='utf-8')
s='import {artKeys, renderPanel, drawGround, combatFeedback, updatePresentation} from "./presentation.js";\n'+s
def method(start,end,new):
 global s
 a=s.index(start);b=s.index(end,a);s=s[:a]+new+'\n'+s[b:]
method('  draw(b, Y) {','  destroy() {','  draw(b,Y) { return drawGround(this.scene,b,Y,se(b,Y)); }')
method('  drawTextures() {','  sync() {','  drawTextures() {}')
s=s.replace('  create() {\n    (pt.setActive', '  preload() { for(const key of artKeys) this.load.svg(key, `./assets/${key}.svg`); }\n  create() {\n    this.events.once("shutdown", () => { this.panel?.destroy(); this.defenses?.cancel(); });\n    document.getElementById("timer").textContent="00:00";\n    document.getElementById("boss-hud").hidden=true;\n    document.getElementById("game").classList.remove("low-health");\n    (pt.setActive')
method('  showPanel(b, Y, K) {','  pauseGame() {','''  showPanel(title,detail,choices) {
    this.closePanel(); Tt.enabled=false;
    document.getElementById("game").classList.add("has-panel");
    renderPanel(this,title,detail,choices);
  }
  showUpgradeCards(title,detail,choices) {
    this.closePanel(); Tt.enabled=false;
    document.getElementById("game").classList.add("has-panel");
    renderPanel(this,title,detail,choices,true);
  }''')
method('  chooseWeapon(b = 0) {','  effect(','''  chooseWeapon() {
    this.showUpgradeCards("带上你的拿手好戏", "十种技能，十种开局。你的下一次进化，由你决定。", Et.map(skill=>({
      id:skill.id, element:skill.element,title:skill.name,detail:skill.description,
      action:()=>{ this.build.add(skill.id);this.mode="play";this.closePanel();this.sync(); }
    })));
  }''')
s=s.replace('        "阿零，出发！",','        "末日小队",').replace('`移动躲避丧尸，装备会自动攻击。\n击败街区Boss拾取建筑材料，按住右侧塔型选址建造。\n生存10分钟，击败最终Boss！`','"街区守夜 / 坚持十分钟，等到黎明。"').replace('title: "开始行动  →"','title: "出发，守住这一夜"').replace('detail: "WASD / 方向键移动 · 按住屏幕左侧拖动"','detail: "选择技能，进入街区"')
s=s.replace('this.input.keyboard.on("keydown-SPACE", () => this.pauseGame())','this.input.keyboard.on("keydown-SPACE", (event) => { if(!event.target.closest("button,input,summary"))this.pauseGame(); })')
s=s.replace('this.input.keyboard.addCapture(["UP", "DOWN", "LEFT", "RIGHT", "SPACE"])','this.input.keyboard.addCapture(["UP", "DOWN", "LEFT", "RIGHT"])')
s=s.replace('    this.panel = null;','    this.panel = null;\n    if(document.activeElement instanceof HTMLElement)document.activeElement.blur();')
s=s.replace('.setStrokeStyle(1, 16777215, 0.5)', '.setStrokeStyle(2, 0xffe7a0, 0.65)')
s=s.replace('    this.hint.setText(', '    updatePresentation(this, this.keys.W.isDown || this.keys.A.isDown || this.keys.S.isDown || this.keys.D.isDown || this.keys.UP.isDown || this.keys.LEFT.isDown || this.keys.DOWN.isDown || this.keys.RIGHT.isDown || Tt.x || Tt.y);\n    this.hint.setText(')
s=s.replace('      this.gun.setPosition(this.player.x + 18, this.player.y + 8),','')
s=s.replace('  impact(b, Y, K, Q, Z) {','  impact(b, Y, K, Q, Z) {\n    combatFeedback(this,b,Y,K,Q,Z);')
s=s.replace('          title: (b.icon || "✚") + "  " + b.name,','          id:b.id, element:b.element,\n          title: b.name,')
s=s.replace('e && r.setTint(13080773),\n          s && r.setTint(13153159)', 'e && r.setTexture("spitter"),\n          s && r.setTexture("runner")')
s=s.replace('backgroundColor: "#a6b1ad"','backgroundColor: "#b9ad91"').replace('setBackgroundColor("#a6b1ad")','setBackgroundColor("#b9ad91")')
s=s.replace('      this.sync(),\n      this.showPanel(', '      this.timerText.setVisible(false),this.hint.setVisible(false),\n      this.sync(),\n      this.showPanel(',1)
# Scoped opt-in access for deterministic browser integration tests.
s+='\nif(new URLSearchParams(location.search).has("debug"))window.__game=Ct;\n'
p.write_text(s,encoding='utf-8')
p=Path('defenses.js');s=p.read_text(encoding='utf-8');s='import {TOWER_RADIUS, circlesOverlap, moveCircle} from "./geometry.js";\n'+s
s=s.replace('const halfTower = 32;', 'const halfTower = TOWER_RADIUS;')
a=s.index('  overlaps(');b=s.index('  drawPreview()',a)
s=s[:a]+'''  overlaps(tower,actor,radius) { return circlesOverlap(tower,halfTower,actor,radius); }
  move(actor,dx,dy,radius) { moveCircle(actor,dx,dy,radius,this.towers,this.width,this.height); }
'''+s[b:]
a=s.index('    this.preview\n      .fillStyle');b=s.index('\n  confine(',a)
s=s[:a]+'''    this.preview.fillStyle(color,.12).fillCircle(point.x,point.y,this.drag.type.range)
      .lineStyle(2,color,.3).strokeCircle(point.x,point.y,this.drag.type.range)
      .fillStyle(color,.5).fillCircle(point.x,point.y,halfTower)
      .lineStyle(3,0x292822,1).strokeCircle(point.x,point.y,halfTower);
  }
'''+s[b:]
a=s.index('  build(type, point)');b=s.index('  drop(enemy)',a)
s=s[:a]+'''  build(type,point) {
    const {x,y}=point,scene=this.scene;
    const key=["tower-rapid","tower-frost","tower-blast"][types.indexOf(type)];
    scene.add.image(x,y+2,key).setDepth(3);
    const barrel=scene.add.graphics({x,y}).setDepth(4);
    barrel.fillStyle(0x292822).fillRoundedRect(4,-8,37,16,4);
    barrel.fillStyle(type.color).fillRoundedRect(6,-5,32,10,2);
    barrel.fillStyle(0x657163).fillRect(31,-5,6,10);
    scene.add.circle(x,y,10,0xe5d6ab).setStrokeStyle(3,0x292822).setDepth(5);
    this.towers.push({x,y,type,barrel,remaining:0});
    this.stock-=type.cost; this.refresh();
    scene.effect(scene.add.circle(x,y,32).setStrokeStyle(4,type.color).setDepth(7),.4,0,0,1.5);
  }
'''+s[b:]
s=s.replace('button.textContent = type.icon + " " + type.name + " · " + type.cost;','''button.innerHTML = `<img src="./assets/${["tower-rapid","tower-frost","tower-blast"][types.indexOf(type)]}.svg" alt=""><span>${type.name}<small>${type.cost} 材料</small></span>`;
      button.setAttribute("aria-label",`${type.name}，${type.cost} 材料，按住拖动建造`);''')
s=s.replace('this.counter.textContent = "材料 " + this.stock;', 'this.counter.innerHTML = `<span>防御工坊</span><b>◆ ${this.stock}</b>`;')
s=s.replace('    this.refresh();\n  }\n  refresh()', '''    const tip=document.createElement("small");tip.className="build-tip";tip.textContent="按住塔型 · 拖动选址";this.tools.append(tip);
    this.refresh();
  }
  refresh()''',1)
s=s.replace('scene.effect(shot, 0.14);','scene.effect(shot, 0.14);\n      scene.tweens.add({targets:tower.barrel,scaleX:.82,duration:65,yoyo:true});')
p.write_text(s,encoding='utf-8')
