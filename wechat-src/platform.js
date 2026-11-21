import {drawBattleHud,hudBrushes} from '../battle-hud.js';
import * as browser from '../vendor/wechat-adapter/window.js';
import document from '../vendor/wechat-adapter/document.js';

const env = {...browser, document};
env.window = env;
env.parent = env;
env.top = env;
env.addEventListener = document.addEventListener.bind(document);
env.removeEventListener = document.removeEventListener.bind(document);
env.dispatchEvent = document.dispatchEvent.bind(document);
env.location = {href:'game.js',protocol:'file:',search:''};
env.AudioContext = wx.createWebAudioContext ? function(){return wx.createWebAudioContext();} : undefined;
env.ResizeObserver = class {constructor(callback){this.callback=callback;} observe(){setTimeout(this.callback,0);} disconnect(){}};
env.URLSearchParams = class {has(){return false;}};
env.screen = {orientation:{}};
for (const [key,value] of Object.entries(env)) {
  if (['Symbol','performance','setTimeout','clearTimeout','setInterval','clearInterval','requestAnimationFrame','cancelAnimationFrame'].includes(key)) continue; try { GameGlobal[key]=value; } catch {}
}
__installEnv(env);

export class UIElement {
  constructor(tag='div') {
    this.tagName=tag.toUpperCase();this.children=[];this.style={setProperty(k,v){this[k]=v;},removeProperty(k){delete this[k];}};this.dataset={};this.events={};this.className='';this.textContent='';this.hidden=false;this.disabled=false;
    this.classList={add:(...names)=>{this.className+=' '+names.join(' ');},remove:(name)=>{this.className=this.className.split(' ').filter(n=>n!==name).join(' ');},contains:name=>this.className.split(' ').includes(name),toggle:(name,on)=>{if(on===undefined)on=!this.classList.contains(name);on?this.classList.add(name):this.classList.remove(name);return on;}};
    this.relList={supports:()=>true};
  }
  append(...nodes){for(const n of nodes){if(!n)continue;try{n.parentNode=this;}catch{}this.children.push(n);}}
  appendChild(n){this.append(n);return n;}
  replaceChildren(...nodes){this.children=[];this.append(...nodes);}
  remove(){if(this.parentNode)this.parentNode.children=this.parentNode.children.filter(n=>n!==this);}
  removeChild(n){n.remove();}
  insertBefore(n){this.append(n);}
  setAttribute(k,v){this[k]=v;}
  getAttribute(k){return this[k];}
  removeAttribute(k){delete this[k];}
  addEventListener(k,f){(this.events[k]??=[]).push(f);}
  removeEventListener(k,f){this.events[k]=(this.events[k]||[]).filter(x=>x!==f);}
  dispatchEvent(e){for(const f of this.events[e.type]||[])f(e);this['on'+e.type]?.(e);}
  focus(){document.activeElement=this;}
  blur(){}
  setPointerCapture(){}
  releasePointerCapture(){}
  closest(selector){return selector.split(',').some(s=>s.trim().toUpperCase()===this.tagName)?this:this.parentNode?.closest?.(selector);}
  querySelectorAll(selector){const out=[];for(const n of this.children){if(n.tagName===selector.toUpperCase()||selector[0]==='.'&&n.classList?.contains(selector.slice(1)))out.push(n);out.push(...(n.querySelectorAll?.(selector)||[]));}return out;}
  querySelector(selector){return this.querySelectorAll(selector)[0]||null;}
  get firstElementChild(){return this.children[0];}
  set innerHTML(value){this._html=value;this.children=[];if(value.includes('joystick-knob'))this.append(new UIElement('span'));for(const match of value.matchAll(/<img[^>]*src="([^"]+)"/g)){const img=new UIElement('img');img.src=match[1];this.append(img);}}
  get innerHTML(){return this._html||'';}
  getBoundingClientRect(){const i=wx.getSystemInfoSync();if(this.className==='joystick'){const size=i.windowHeight*0.19;return {width:size,height:size,left:parseFloat(this.style.left)-size/2,top:parseFloat(this.style.top)-size/2};}return {x:0,y:0,left:0,top:0,right:i.windowWidth,bottom:i.windowHeight,width:i.windowWidth,height:i.windowHeight};}
}
const ids={};
const nativeCreate=document.createElement.bind(document);
document.createElement=tag=>['canvas','img','audio','video'].includes(tag)?nativeCreate(tag):new UIElement(tag);
document.getElementById=id=>ids[id]??=(new UIElement());
document.querySelector=selector=>selector==='.settings'?document.getElementById('settings'):null;
document.querySelectorAll=()=>[];
document.getElementById('volume').value='35';
env.getComputedStyle=n=>n instanceof UIElement?{...n.style,position:'static',paddingLeft:'0px',paddingRight:'0px',paddingTop:'0px',paddingBottom:'0px'}:browser.getComputedStyle(n);
GameGlobal.getComputedStyle=env.getComputedStyle;
const root=document.getElementById('game');
browser.canvas.closest=()=>null;
try { browser.canvas.parentNode=root; } catch {}

// Canvas UI uses the same menu actions and progression records as the web build.
export function attachUI(game) {
  let settingsOpen=false,slider=null,volume=35;
  let nodes=[],layer=null,owner=null,last=0;
  let upgradeView=null;
  function positionUpgrade(scene){
    const tower=scene.defenses?.selectedTower;
    if(!upgradeView || !tower)return;
    const view=scene.cameras.main.worldView;
    const x=(tower.x-view.x)*game.scale.width/view.width;
    const y=(tower.s.y-view.y)*game.scale.height/view.height;
    const {group,area}=upgradeView;
    group.setPosition(x,y);
    if(area){area.x=x-area.w/2;area.y=y-area.h/2;}
  }
  function text(node){return [node.textContent,...(node.children||[]).filter(n=>n.tagName!=='IMG').map(text)].filter(Boolean).join(' ');}
  function label(scene,x,y,value,size=18,width=250){return scene.add.text(x,y,value,{fontFamily:'sans-serif',fontSize:size+'px',color:'#fff3cf',wordWrap:{width},stroke:'#263331',strokeThickness:2}).setScrollFactor(0);}
  game.events.on('poststep',()=>{
    const s=game.scene.getScene('garden');if(!s?.player)return;
    const screen=wx.getSystemInfoSync(); Object.assign(browser.canvas.style,{width:screen.windowWidth+"px",height:screen.windowHeight+"px",marginLeft:"0px",marginTop:"0px",left:"0px",top:"0px",position:"absolute"}); const now=Date.now();if(now-last<100){positionUpgrade(s);return;}last=now;
    if(owner!==s||!layer?.scene){owner=s;layer=s.add.container(0,0).setDepth(1000).setScrollFactor(0);}
    layer.removeAll(true);nodes=[];upgradeView=null;
    const w=game.scale.width,h=game.scale.height;
    const {add,images,drawIcon,ink,paper,cream,box,type}=hudBrushes(s,layer);
    const hit=(node,x,y,width,height)=>{if(node&&!node.disabled)nodes.push({node,x,y,w:width,h:height});};
    const overlay=root.children.find(n=>n.className?.includes('modal-overlay'));
    if(overlay){settingsOpen=false;slider=null;
      if (overlay.className.includes('pause-overlay')) {
        const width = 200, height = 64;
        const x = (w - width) / 2, y = (h - height) / 2;
        add(s.add.rectangle(w / 2, h / 2, w, h, 0x28251d, .35));
        box(x, y, width, height, paper, 12, 3, 4);
        type(w / 2, h / 2, overlay.querySelector('button').textContent, 24, width, true, true).setOrigin(.5);
        hit(overlay.querySelector('button'), x, y, width, height);
        return;
      }
      if (overlay.className.includes("upgrade-overlay")) {
        const cards=overlay.querySelectorAll(".choice-card"), gap=10;
        const width=Math.min(194,(w-48-gap*(cards.length-1))/cards.length);
        const left=(w-cards.length*width-(cards.length-1)*gap)/2;
        const backgrounds=[];
        let height=150;
        const content=cards.map((card,i)=>{
          const x=left+i*(width+gap);
          backgrounds.push(add(s.add.graphics()));
          const tag=type(x+51,0,text(card.querySelector(".choice-tag")),13,width-58,true,false,"#eee8cf");
          const name=type(x+10,0,text(card.querySelector("strong")),19,width-20,true,false,"#fff8dc");
          const detail=type(x+10,0,text(card.querySelector(".choice-detail")),14,width-20,false,false,"#fff5dd");
          const route=text(card.querySelector(".choice-route") || {});
          height=Math.max(height,60+name.height+detail.height+(route?34:14));
          return {x,card,tag,name,detail,route};
        });
        const top=(h-height)/2;
        content.forEach(({x,card,tag,name,detail,route},i)=>{
          backgrounds[i].fillStyle(({普通:0x232a30,稀有:0x193e50,史诗:0x453151,传说:0x584020,进化:0x234b40})[card.dataset.rarity] ?? 0x171b1e,1).fillRoundedRect(x,top,width,height,8)
            .lineStyle(card.dataset.selected === "true" ? 4 : 2,card.dataset.selected === "true" ? 0xffcf57 : ink).strokeRoundedRect(x,top,width,height,8);
          drawIcon(images(card)[0],x+27,top+27,34);
          tag.y=top+19; name.y=top+50; detail.y=name.y+name.height+6;
          if (route) type(x+width-9,top+height-7,route,12,width-18,false,false,"#ead6aa").setOrigin(1,1).setAlign("right");
          hit(card,x,top,width,height);
        });
        const confirm = overlay.querySelector(".draft-confirm");
        if (confirm) {
          const y = top + height + 6;
          box(w/2-100,y,200,38,confirm.disabled ? 0xb5afa3 : paper,8,2,2);
          type(w/2,y+8,text(confirm),16,200,true,true);
          hit(confirm,w/2-100,y,200,38);
        }
        return;
      }
      const lobby=overlay.className.includes('lobby'),heading=text(overlay.querySelector('h1')||{}),jobs=heading==='选择职业';
      const all=overlay.querySelectorAll('button'),back=jobs?all.find(n=>text(n).includes('返回')):null,cards=all.filter(n=>n!==back);
      const pw=Math.min(w-92,lobby?870:1030),ph=Math.min(h-48,lobby?420:jobs?400:548),x=(w-pw)/2,y=(h-ph)/2,pad=28;
      add(s.add.rectangle(w/2,h/2,w,h,0x28251d,.65));box(x,y,pw,ph,paper,20,4,12);
      type(lobby?x+pad:w/2,y+23,heading,32,pw-64,true,!lobby);
      const paragraphs=overlay.querySelectorAll('p').map(text).filter(Boolean);
      type(lobby?x+pad:w/2,y+72,paragraphs[0],15,pw-64,false,!lobby);
      if(lobby)type(x+pad,y+100,paragraphs.slice(1).join(' · '),14,pw-60);
      if(back){box(w/2-52,y+99,104,30,cream,5,1);type(w/2,y+102,text(back),16,104,false,true);hit(back,w/2-52,y+99,104,30);}
      const cols=lobby?5:jobs?6:Math.min(3,cards.length),top=lobby?129:jobs?145:134,gap=10,cw=(pw-2*pad-gap*(cols-1))/cols,ch=(ph-top-(lobby?28:58)-gap*(Math.ceil(cards.length/cols)-1))/Math.max(1,Math.ceil(cards.length/cols));
      cards.forEach((n,i)=>{const cx=x+pad+i%cols*(cw+gap),cy=y+top+Math.floor(i/cols)*(ch+gap),keys=images(n),title=n.querySelector('strong'),tag=n.querySelector('.choice-tag'),detail=n.querySelector('small')||n.querySelector('.choice-detail');
        box(cx,cy,cw,ch,n.disabled?0xd7d6d4:cream,lobby?7:11,lobby?2:3,lobby?0:5);
        if(lobby){if(keys[0])drawIcon(keys[0],cx+29,cy+27,38);type(cx+(keys.length?55:10),cy+9,title?text(title):text(n),16,cw-(keys.length?60:18),true);type(cx+9,cy+ch-25,detail&&text(detail),13,cw-16);}
        else {const size=jobs?58:68;if(jobs)box(cx+10,cy+12,cw-20,70,0xe6dbbc,10,0);else box(cx+20,cy+22,size,size,({fire:0xca936c,physical:0xd4c27f,supply:0xacbb83})[n.dataset.element]||0xacbb83,14,3);
          if(keys.length)drawIcon(keys[0],jobs?cx+cw/2:cx+20+size/2,cy+(jobs?46:56),size-5);if(keys[1])drawIcon(keys[1],cx+cw*.62,cy+52,34);
          type(cx+12,cy+(jobs?90:109),tag&&text(tag),13,cw-24,true,false,'#89683e');type(cx+12,cy+(jobs?110:135),title?text(title):text(n),jobs?17:22,cw-24,true);type(cx+12,cy+(jobs?139:174),detail&&text(detail),jobs?13:15,cw-24,false,false,'#746951');}
        hit(n,cx,cy,cw,ch);});
      if(lobby)GameGlobal.lobbyRendered=true;
      if(!lobby)type(w/2,y+ph-35,text(overlay.querySelector('.menu-footer')||{}),13,pw-50,false,true);
      return;
    }
    slider=drawBattleHud({s,w,h,ids,screen,capRect:wx.getMenuButtonBoundingClientRect?.(),toggleNode:document.getElementById('settings-toggle'),padNode:root.children.find(n=>n.className==='joystick'),settingsOpen,volume,onToggle(){settingsOpen=!settingsOpen;last=0;},add,box,type,images,drawIcon,hit,drawUpgrade(up){
      const group=add(s.add.container(0,0));
      group.add(box(-85,-21,170,42,cream));
      group.add(type(0,-12,text(up),16,160,true,true));
      const area={node:up,x:0,y:0,w:170,h:42};
      if(!up.disabled)nodes.push(area);
      upgradeView={group,area};
      positionUpgrade(s);
    }});
  });
  const pressed=new Map(),dragging=new Set();
  function adjust(t,start){
    if(!slider)return false;
    const rect=root.getBoundingClientRect(),x=t.clientX*game.scale.width/rect.width,y=t.clientY*game.scale.height/rect.height;
    if(start&&(Math.abs(y-slider.y)>18||x<slider.x-9||x>slider.x+slider.w+9))return false;
    volume=Math.round(100*Math.min(1,Math.max(0,(x-slider.x)/slider.w)));
    ids.volume.value=String(volume);ids.volume.oninput?.({target:ids.volume});last=0;return true;
  }
  function target(t){
    const rect=root.getBoundingClientRect(),x=t.clientX*game.scale.width/rect.width,y=t.clientY*game.scale.height/rect.height;
    return nodes.find(n=>x>=n.x&&x<=n.x+n.w&&y>=n.y&&y<=n.y+n.h)?.node;
  }
  function pointer(type,t){return {type,button:0,detail:1,pointerId:t.identifier,clientX:t.clientX,clientY:t.clientY,target:browser.canvas,preventDefault(){}};}
  wx.onTouchStart(e=>{for(const t of e.changedTouches){
    if(adjust(t,true)){dragging.add(t.identifier);continue;}
    const n=target(t),event=pointer('pointerdown',t);
    if(n){pressed.set(t.identifier,n);event.target=n;n.dispatchEvent(event);}
    else if(settingsOpen){settingsOpen=false;last=0;}else root.dispatchEvent(event);
  }});
  wx.onTouchMove(e=>{for(const t of e.changedTouches)if(dragging.has(t.identifier))adjust(t,false);else if(!pressed.has(t.identifier))root.dispatchEvent(pointer('pointermove',t));});
  function finish(e,cancel){for(const t of e.changedTouches){
    if(dragging.delete(t.identifier))continue;
    const n=pressed.get(t.identifier);pressed.delete(t.identifier);
    if(n){if(!cancel&&n===target(t))n.onclick?.({detail:1,target:n,preventDefault(){}});}
    else root.dispatchEvent(pointer(cancel?'pointercancel':'pointerup',t));
  }}
  wx.onTouchEnd(e=>finish(e,false));wx.onTouchCancel(e=>finish(e,true));
  wx.onHide(()=>{if(game.scene.getScene('garden')?.mode==='play')game.scene.getScene('garden').pauseGame();});
}






