const types = [
  {name:"速射塔", icon:"➶", cost:3, color:0xf4c875, range:270, cooldown:.55, damage:12},
  {name:"冰晶塔", icon:"❄", cost:5, color:0x94e4ff, range:220, cooldown:2.1, damage:15},
  {name:"爆裂塔", icon:"✹", cost:7, color:0xff9468, range:240, cooldown:2.8, damage:36}
];
const halfTower = 32;
const reach = 200;
const clamp = (n,min,max) => Math.max(min,Math.min(max,n));

export class Defenses {
  constructor(scene) {
    this.scene=scene;
    const bounds=document.getElementById("game").getBoundingClientRect();
    const ratio=bounds.width/Math.max(1,bounds.height);
    const screenWidth = Math.max(900, Math.round(620 * ratio));
    const screenHeight = Math.max(620, Math.round(900 / ratio));
    const side = Math.round(Math.sqrt(6 * screenWidth * screenHeight));
    this.width = side;
    this.height = side;
    scene.cameras.main.setBounds(0,0,this.width,this.height);
    scene.add.rectangle(this.width/2,this.height/2,this.width-8,this.height-8)
      .setStrokeStyle(8,0xe4ce8f).setDepth(0);
    this.stock=3;
    this.towers=[];
    this.drops=[];
    this.preview=scene.add.graphics().setDepth(12);
    this.tools=document.getElementById("tower-tools");
    this.tools.replaceChildren();
    this.counter=document.createElement("output");
    this.tools.append(this.counter);
    this.wheel=document.createElement("div");
    this.wheel.className="placement-wheel";
    this.wheel.hidden=true;
    this.knob=document.createElement("i");
    this.wheel.append(this.knob);
    this.tools.append(this.wheel);
    this.buttons=types.map(type=>{
      const button=document.createElement("button");
      button.textContent=type.icon+" "+type.name+" · "+type.cost;
      button.title="按住后在轮盘上拖动选址，松手建造";
      this.tools.append(button);
      button.onpointerdown=event=>{
        if(scene.mode!=="play" || this.drag || event.button!==0)return;
        event.preventDefault();
        button.setPointerCapture(event.pointerId);
        this.drag={id:event.pointerId,type,startX:event.clientX,startY:event.clientY,x:event.clientX,y:event.clientY};
        this.wheel.style.top=(button.offsetTop+button.offsetHeight/2)+"px";
        this.wheel.hidden=false;
        this.drawPreview();
      };
      button.onpointermove=event=>{
        if(this.drag?.id!==event.pointerId)return;
        Object.assign(this.drag,{x:event.clientX,y:event.clientY});
        this.drawPreview();
      };
      button.onpointerup=event=>{
        if(this.drag?.id!==event.pointerId)return;
        Object.assign(this.drag,{x:event.clientX,y:event.clientY});
        const point=this.location();
        const moved=Math.hypot(event.clientX-this.drag.startX,event.clientY-this.drag.startY)>=4;
        if(moved && scene.mode==="play" && point && this.valid(point))this.build(type,point);
        this.cancel();
      };
      button.onlostpointercapture=button.onpointercancel=event=>{
        if(this.drag?.id===event.pointerId)this.cancel();
      };
      return button;
    });
    this.refresh();
  }
  refresh(){
    this.counter.textContent="材料 "+this.stock;
    this.buttons.forEach((button,i)=>button.disabled=this.stock<types[i].cost);
  }
  cancel(){
    this.drag=null;
    this.wheel.hidden=true;
    this.preview.clear();
  }
  location(){
    const rect=this.wheel.getBoundingClientRect();
    const radius=rect.width/2;
    const dx=this.drag.x-rect.left-radius;
    const dy=this.drag.y-rect.top-radius;
    if(!radius || Math.hypot(dx,dy)>radius){
      this.knob.style.transform="translate(-50%, -50%)";
      return null;
    }
    this.knob.style.transform=`translate(-50%, -50%) translate(${dx}px, ${dy}px)`;
    const player=this.scene.player;
    return {x:player.x+dx/radius*reach,y:player.y+dy/radius*reach};
  }
  valid(point){
    return this.stock>=this.drag.type.cost &&
      point.x>=halfTower && point.y>=halfTower &&
      point.x<=this.width-halfTower && point.y<=this.height-halfTower &&
      !this.overlaps(point,this.scene.player,25) &&
      this.scene.enemies.every(enemy=>!this.overlaps(point,enemy.s,enemy.r)) &&
      this.towers.every(tower=>!this.overlaps(tower,point,halfTower+4));
  }
  overlaps(tower, actor, radius){
    return Math.abs(tower.x-actor.x)<halfTower+radius &&
           Math.abs(tower.y-actor.y)<halfTower+radius;
  }
  move(actor,dx,dy,radius){
    // Resolve each axis independently so diagonal motion slides along walls.
    for(const [axis,delta,limit] of [["x",dx,this.width],["y",dy,this.height]]){
      if(!delta)continue;
      const other=axis==="x"?"y":"x";
      let next=clamp(actor[axis]+delta,radius,limit-radius);
      for(const tower of this.towers){
        const gap=halfTower+radius;
        if(Math.abs(actor[other]-tower[other])>=gap)continue;
        if(delta>0 && actor[axis]<=tower[axis]-gap)next=Math.min(next,tower[axis]-gap);
        if(delta<0 && actor[axis]>=tower[axis]+gap)next=Math.max(next,tower[axis]+gap);
      }
      actor[axis]=next;
    }
  }
  drawPreview(){
    if(!this.drag)return;
    const point=this.location(), player=this.scene.player;
    this.preview.clear().lineStyle(2,0xd7efdc,.8).strokeCircle(player.x,player.y,reach);
    if(!point)return;
    const color=this.valid(point)?0x90f4aa:0xff7777;
    this.preview.fillStyle(color,.6).fillRect(point.x-halfTower,point.y-halfTower,2*halfTower,2*halfTower);
  }
  confine(sprite,padding){
    sprite.x=clamp(sprite.x,padding,this.width-padding);
    sprite.y=clamp(sprite.y,padding,this.height-padding);
  }
  spawn(dx,dy){
    const player=this.scene.player;
    const reflect=(pos,delta,size)=>pos+delta<60 || pos+delta>size-60 ? pos-delta : pos+delta;
    const point={x:clamp(reflect(player.x,dx,this.width),60,this.width-60),
                 y:clamp(reflect(player.y,dy,this.height),60,this.height-60)};
    const clear=p=>this.towers.every(tower=>!this.overlaps(tower,p,55));
    if(clear(point))return point;
    let closest=null, distance=Infinity;
    for(let x=60;x<=this.width-60;x+=64)for(let y=60;y<=this.height-60;y+=64){
      const candidate={x,y}, d=this.scene.distance(point,candidate);
      if(d<distance && clear(candidate)){closest=candidate;distance=d}
    }
    return closest;
  }
  build(type,point){
    const {x,y}=point, scene=this.scene;
    scene.add.rectangle(x,y,halfTower*2,halfTower*2,0x243c40)
      .setStrokeStyle(3,type.color).setDepth(3);
    scene.add.circle(x,y,23,0x40565a).setStrokeStyle(2,type.color).setDepth(3);
    const barrel=scene.add.rectangle(x,y,38,10,type.color).setOrigin(0,.5).setDepth(4);
    scene.add.text(x,y,type.icon,{fontSize:"32px",color:"#"+type.color.toString(16)})
      .setOrigin(.5).setDepth(5);
    this.towers.push({x,y,type,barrel,remaining:0});
    this.stock-=type.cost;
    this.refresh();
  }
  drop(enemy){
    if(!enemy.boss)return;
    const sprite=this.scene.add.rectangle(enemy.s.x,enemy.s.y,12,12,0xfac969)
      .setAngle(45).setStrokeStyle(2,0x725527).setDepth(3);
    this.confine(sprite,12);
    this.drops.push({sprite,value:4});
  }
  update(dt){
    const scene=this.scene, player=scene.player;
    this.drawPreview();
    for(let i=this.drops.length-1;i>=0;i--){
      const {sprite,value}=this.drops[i], d=scene.distance(sprite,player);
      if(d<24){
        sprite.destroy();this.drops.splice(i,1);this.stock+=value;this.refresh();
      }else if(d<110){
        sprite.x+=(player.x-sprite.x)/d*300*dt;
        sprite.y+=(player.y-sprite.y)/d*300*dt;
      }
    }
    for(const tower of this.towers){
      if(scene.mode!=="play")break;
      tower.remaining-=dt;
      if(tower.remaining>0)continue;
      const {type,x,y}=tower;
      let target=null, nearest=type.range;
      for(const enemy of scene.enemies){
        const d=scene.distance(tower,enemy.s);
        if(d<=nearest){target=enemy;nearest=d}
      }
      if(!target)continue;
      tower.remaining=type.cooldown;
      const impact={x:target.s.x,y:target.s.y};
      const angle=Math.atan2(impact.y-y,impact.x-x);
      tower.barrel.setRotation(angle);
      const muzzleX=x+38*Math.cos(angle), muzzleY=y+38*Math.sin(angle);
      scene.effect(scene.add.circle(muzzleX,muzzleY,8,type.color).setDepth(7),.16,0,0,1);
      const shot=scene.add.graphics().setDepth(7).lineStyle(3,type.color).lineBetween(muzzleX,muzzleY,impact.x,impact.y);
      scene.effect(shot,.14);
      if(type===types[2]){
        scene.impact(impact.x,impact.y,type.color,false,true);
        for(const enemy of [...scene.enemies])
          if(scene.distance(impact,enemy.s)<=70)scene.hit(enemy,type.damage,type.color);
      }else{
        if(type===types[1])target.frozenUntil=scene.combat.time+(target.boss?.3:1);
        scene.hit(target,type.damage,type.color);
      }
    }
  }
}
