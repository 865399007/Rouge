import { drawBattleHud, hudBrushes } from "./battle-hud.js";

export function preloadHud(scene) {
  scene.load.image("ui-roll", "./assets/ui-roll.png");

}

export function attachBrowserHud(game) {
  const root=document.getElementById("game");
  const ids=Object.fromEntries([...root.querySelectorAll("[id]")].map(node=>[node.id,node]));
  const pad=root.querySelector(".joystick");
  const toggle=root.querySelector(".settings summary");
  const controls=document.createElement("div");
  controls.className="canvas-hud-controls";
  root.append(controls);
  const targets=new Map();
  let layer, last=0, settings=false;
  function bind(node,x,y,width,height){
    let proxy=targets.get(node);
    if(!proxy){
      const range=node.type==="range";
      proxy=document.createElement(range?"input":"button");
      if(range){
        proxy.type="range";
        proxy.oninput=()=>{node.value=proxy.value;node.dispatchEvent(new Event("input"));last=0;};
      }else{
        const combatAction=node.id==="roll" || node.parentElement?.id==="tower-tools";
        const activate=()=>{if(!node.disabled){node.click();last=0;}};
        if(combatAction){
          proxy.onpointerdown=event=>{
            if(event.button!==0)return;
            event.preventDefault();
            activate();
          };
        }
        proxy.onclick=event=>{if(!combatAction || event.detail===0)activate();};
      }
      if(node.parentElement?.id==="tower-tools"){
        const image=node.querySelector("img").cloneNode(false);
        proxy.className="tower-hud-target";
        proxy.append(image);
      }
      proxy.setAttribute("aria-label",node.getAttribute("aria-label")||node.title||node.textContent);
      controls.append(proxy);
      targets.set(node,proxy);
    }
    proxy.hidden=false;
    proxy.disabled=!!node.disabled;
    if(node.type==="range")proxy.value=node.value;
    Object.assign(proxy.style,{left:x/game.scale.width*100+"%",top:y/game.scale.height*100+"%",width:width/game.scale.width*100+"%",height:height/game.scale.height*100+"%"});
  }
  root.addEventListener("pointerdown",event=>{
    if(settings&&!controls.contains(event.target)){settings=false;last=0;}
  },true);
  game.events.on("poststep",()=>{
    const s=game.scene.getScene("garden");
    const active=!!s?.player&&s.mode==="play"&&!root.classList.contains("has-panel");
    root.classList.toggle("canvas-battle",active);
    if(!active){layer?.setVisible(false);controls.hidden=true;settings=false;last=0;return;}
    if(!layer?.scene)layer=s.add.container(0,0).setDepth(1000).setScrollFactor(0);
    controls.hidden=false;
    layer.setVisible(true);
    const now=performance.now();
    if(now-last<100)return;
    last=now;
    for(const proxy of targets.values())proxy.hidden=true;
    layer.removeAll(true);
    const rect=root.getBoundingClientRect();
    const w=game.scale.width,h=game.scale.height;
    const brushes=hudBrushes(s,layer);
    const slider=drawBattleHud({s,w,h,ids,screen:{windowWidth:rect.width,windowHeight:rect.height},toggleNode:toggle,padNode:pad,settingsOpen:settings,volume:Number(ids.volume.value),onToggle(){settings=!settings;last=0;},...brushes,drawTowerIcon(){ /* The native button owns its persistent icon. */ },hit:bind,drawUpgrade(up){
      const tower=s.defenses.selectedTower,view=s.cameras.main.worldView;
      const x=(tower.x-view.x)*w/view.width,y=(tower.s.y-view.y)*h/view.height;
      brushes.box(x-85,y-21,170,42,brushes.cream);
      brushes.type(x,y-12,up.textContent,16,160,true,true);
      bind(up,x-85,y-21,170,42);
    }});
    if(slider)bind(ids.volume,slider.x,slider.y-16,slider.w,32);
  });
}
