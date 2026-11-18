const types = [
  {name:"速射塔", icon:"➶", cost:3, color:0xf4c875, range:270, cooldown:.55, damage:12},
  {name:"冰晶塔", icon:"❄", cost:5, color:0x94e4ff, range:220, cooldown:2.1, damage:15},
  {name:"爆裂塔", icon:"✹", cost:7, color:0xff9468, range:240, cooldown:2.8, damage:36}
];
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
    this.buttons=types.map(type=>{
      const button=document.createElement("button");
      button.textContent=type.icon+" "+type.name+" · "+type.cost;
      button.title="拖到角色附近建造，消耗 "+type.cost+" 材料";
      this.tools.append(button);
      button.onpointerdown=event=>{
        if(scene.mode!=="play" || this.drag || event.button!==0)return;
        event.preventDefault();
        button.setPointerCapture(event.pointerId);
        this.drag={id:event.pointerId,type,x:event.clientX,y:event.clientY};
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
        if(scene.mode==="play" && this.valid(point))this.build(type,point);
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
  cancel(){this.drag=null;this.preview.clear()}
  location(){
    const canvas=this.scene.game.canvas;
    const rect=canvas.getBoundingClientRect();
    return this.scene.cameras.main.getWorldPoint(
      (this.drag.x-rect.left)*this.scene.scale.width/rect.width,
      (this.drag.y-rect.top)*this.scene.scale.height/rect.height);
  }
  valid(point){
    const {x,y,type}=this.drag;
    return document.elementFromPoint(x,y)===this.scene.game.canvas &&
      this.stock>=type.cost && this.scene.distance(point,this.scene.player)<=reach &&
      point.x>=20 && point.y>=20 && point.x<=this.width-20 && point.y<=this.height-20 &&
      this.towers.every(tower=>this.scene.distance(tower,point)>=40);
  }
  drawPreview(){
    if(!this.drag)return;
    const point=this.location(), player=this.scene.player;
    const color=this.valid(point)?0x90f4aa:0xff7777;
    this.preview.clear().lineStyle(2,0xd7efdc,.8).strokeCircle(player.x,player.y,reach)
      .fillStyle(color,.6).fillCircle(point.x,point.y,16);
  }
  confine(sprite,padding){
    sprite.x=clamp(sprite.x,padding,this.width-padding);
    sprite.y=clamp(sprite.y,padding,this.height-padding);
  }
  spawn(dx,dy){
    const player=this.scene.player;
    const reflect=(pos,delta,size)=>pos+delta<60 || pos+delta>size-60 ? pos-delta : pos+delta;
    return {x:clamp(reflect(player.x,dx,this.width),60,this.width-60),
            y:clamp(reflect(player.y,dy,this.height),60,this.height-60)};
  }
  build(type,point){
    const {x,y}=point, scene=this.scene;
    scene.add.rectangle(x,y+5,34,25,0x334646).setStrokeStyle(2,type.color).setDepth(3);
    const head=scene.add.text(x,y-3,type.icon,{fontSize:"24px",color:"#"+type.color.toString(16)})
      .setOrigin(.5).setDepth(4);
    this.towers.push({x,y,type,head,remaining:0});
    this.stock-=type.cost;
    this.refresh();
  }
  drop(enemy){
    if(!enemy.boss && this.scene.build.random()>=.32)return;
    const sprite=this.scene.add.rectangle(enemy.s.x,enemy.s.y,12,12,0xfac969)
      .setAngle(45).setStrokeStyle(2,0x725527).setDepth(3);
    this.confine(sprite,12);
    this.drops.push({sprite,value:enemy.boss?4:1});
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
      const shot=scene.add.graphics().setDepth(7).lineStyle(3,type.color).lineBetween(x,y,impact.x,impact.y);
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
