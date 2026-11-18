// Shared Phaser drawing coordinates and hit regions for both runtimes.
export function drawBattleHud({s,w,h,ids,screen,capRect,toggleNode,padNode,settingsOpen,volume,onToggle,drawUpgrade,add,box,type,images,drawIcon,drawTowerIcon=drawIcon,hit}){
    const ink=0x322e23,paper=0xf0e6cd,cream=0xf9f1dc;
    const groundText=(x,y,value,size,width,bold=false,center=false)=>type(x,y,value,size,width,bold,center,'#eee8d7');
    const left=50,right=w-54;
    function meter(y,ratio,color){box(left,y,225,10,0x726b59,4,1);if(ratio>0)box(left+1,y+1,223*Math.min(1,ratio),8,color,3,0);}
    groundText(left,12,(ids['job-name']?.textContent||'')+'   Lv.'+s.level+'                 '+s.hp.toFixed(0)+' / '+s.maxHp,16,250,true);meter(40,s.hp/s.maxHp,0xc77c60);
    groundText(left,60,'战斗经验                       '+s.xp+' / '+s.need,13,250);meter(81,s.xp/s.need,0x87a99f);
    groundText(w/2,10,'街区守夜 / SURVIVE',12,250,true,true);groundText(w/2,28,ids.timer?.textContent,38,250,true,true);groundText(w/2,76,ids.wave?.textContent,14,400,false,true);
    Array.from(ids.skills?.children||[]).forEach((n,i)=>drawIcon(images(n)[0] || 'buff-'+s.build.active[i]?.id,left+18+i*44,116,32));
    const cap=capRect,px=Math.min(right-132,cap?.left?cap.left*w/screen.windowWidth-48:right-132),gx=px-82,gy=44;
    const glyph=add(s.add.graphics()).fillStyle(cream);
    glyph.fillRoundedRect(px-14,gy-16,10,32,2).fillRoundedRect(px+4,gy-16,10,32,2);
    for(const [dy,dx] of [[-9,-6],[9,8]])glyph.lineStyle(4,cream).lineBetween(gx-20,gy+dy,gx+20,gy+dy).fillStyle(paper).fillCircle(gx+dx,gy+dy,5).strokeCircle(gx+dx,gy+dy,5);
    const toggle=toggleNode;
    toggle.onclick=()=>{onToggle();};
    hit(toggle,gx-37,gy-37,74,74);hit(ids.pause,px-37,gy-37,74,74);
    if (!settingsOpen && s.defenses) {
      const size = 96, x = px - size + 26, y = gy + 44, inset = 6;
      const map = add(s.add.graphics());
      map.fillStyle(0x182326,.76).fillRoundedRect(x,y,size,size,8)
        .lineStyle(2,cream,.65).strokeRoundedRect(x,y,size,size,8);
      const project = (value, extent) => inset + (size - 2*inset) *
        Math.max(0, Math.min(1, value / extent));
      for (const enemy of s.enemies) {
        if (enemy.hp <= 0) continue;
        map.fillStyle(0xff846d).fillCircle(x + project(enemy.s.x,s.defenses.width),
          y + project(enemy.s.y,s.defenses.height),enemy.boss ? 4 : 2.2);
      }
      const playerX = x + project(s.player.x,s.defenses.width);
      const playerY = y + project(s.player.y,s.defenses.height);
      map.fillStyle(0x85ffe1).fillCircle(playerX,playerY,4)
        .lineStyle(1.5,0xffffff).strokeCircle(playerX,playerY,4);
    }
    let slider=null;
    if(settingsOpen){
      const mx=px-204,my=gy+40;
      box(mx,my,222,231,paper,12,3,4);
      const row=(id,caption,offset)=>{box(mx+16,my+offset,190,36,paper,7,3,3);type(mx+111,my+offset+8,caption,15,180,true,true);hit(ids[id],mx+16,my+offset,190,36);};
      row('sound',ids.sound.textContent||'声音：开',18);type(mx+17,my+68,'音量',15,120);
      slider={x:mx+20,y:my+107,w:182};box(slider.x,slider.y-3,182,6,0xdad6c8,3,1);
      const fill=182*volume/100;add(s.add.rectangle(slider.x+fill/2,slider.y,fill,6,0xa66b45));add(s.add.circle(slider.x+fill,slider.y,8,0xa66b45));
      row('restart','↻ 重新开始',132);
      row('return-lobby','返回大厅',178);
    }
    const rx=Math.min(w*.91,w-60),ry=Math.min(h*.865,h-60),roll=ids.roll;
    const ring=add(s.add.graphics());
    ring.fillStyle(cream,.25).fillCircle(rx,ry,54).lineStyle(4,ink).strokeCircle(rx,ry,54);
    const ready=parseFloat(roll.style.getPropertyValue?.('--roll-ready') || roll.style['--roll-ready'])/100;
    ring.lineStyle(5,0x95b679).beginPath().arc(rx,ry,46,-Math.PI/2,-Math.PI/2+2*Math.PI*ready).strokePath();
    drawIcon('ui-roll',rx,ry,72);hit(roll,rx-56,ry-56,112,112);
    if (!padNode.hidden) {
      const pad=padNode;
      const sx=w/screen.windowWidth,sy=h/screen.windowHeight;
      const jx=parseFloat(pad.style.left)*sx,jy=parseFloat(pad.style.top)*sy;
      const shift=pad.firstElementChild.style.transform?.match(/-?[0-9.]+/g)||[0,0];
      const radius=h*.095;
      ring.fillStyle(0x31392d,.26).fillCircle(jx,jy,radius).lineStyle(3,cream,.68).strokeCircle(jx,jy,radius);
      ring.fillStyle(cream,.8).fillCircle(jx+Number(shift[0])*sx,jy+Number(shift[1])*sy,radius*.38);
    }
    const tools=ids['tower-tools'];if(tools){const towerTop=(h-(3*74+2*8))/2;groundText(right-74,towerTop-26,tools.children[0]?.textContent,14,85);Array.from(tools.children).filter(n=>n.tagName==='BUTTON').forEach((n,i)=>{const y=towerTop+i*82;box(right-74,y,74,74,n.disabled?0x999999:cream,8,3,0,.25);drawTowerIcon(images(n)[0]+(n.disabled?"-disabled":""),right-37,y+27,46);type(right-37,y+52,['速射 ◆3','冰晶 ◆5','爆裂 ◆7'][i],13,72,true,true);hit(n,right-74,y,74,74);});}
    const up=ids['tower-upgrade'];
    if(up&&!up.hidden&&s.defenses?.selectedTower){
      drawUpgrade(up);
    }
    groundText(left,h-34,'移速  '+s.movementSpeed+'     击败  '+s.kills,18,340,true);
    const warn=ids['boss-warning'];if(warn&&!warn.hidden)type(w/2,106,warn.textContent,20,360,true,true);
    return slider;
}

export function hudBrushes(s,layer){
    const add=(obj)=>{obj.setScrollFactor(0);layer.add(obj);return obj;};
    const images=node=>{const found=[];if(node.src)found.push(node.src.split('/').pop().replace(/\.(svg|png).*$/,''));for(const child of node.children||[])found.push(...images(child));return found;};
    const drawIcon=(key,x,y,size)=>{if(!s.textures.exists(key))key='ui-rail';if(!s.textures.exists(key))return;const image=s.add.image(x,y,key);image.setScale(Math.min(size/image.width,size/image.height));add(image);};
    const ink=0x322e23,paper=0xf0e6cd,cream=0xf9f1dc;
    function box(x,y,width,height,color,r=8,line=2,shadow=0,alpha=1){
      const g=add(s.add.graphics());
      if(shadow)g.fillStyle(ink,.45).fillRoundedRect(x,y+shadow,width,height,r);
      g.fillStyle(color,alpha).fillRoundedRect(x,y,width,height,r);
      if(line)g.lineStyle(line,ink).strokeRoundedRect(x,y,width,height,r);
      return g;
    }
    function type(x,y,value,size,width,bold=false,center=false,color='#332f24'){
      const t=add(s.add.text(x,y,String(value||''),{fontFamily:'sans-serif',fontSize:size+'px',fontStyle:bold?'bold':'normal',color,wordWrap:{width,useAdvancedWrap:true},lineSpacing:2}));
      if(center)t.setOrigin(.5,0);return t;
    }
    return {add,images,drawIcon,ink,paper,cream,box,type};
}
