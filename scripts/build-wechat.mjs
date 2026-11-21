import {build} from 'esbuild';
import {Resvg} from '@resvg/resvg-js';
import {readFile,writeFile,readdir,mkdir,copyFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {preloadBuffIcons,icon} from '../presentation.js';
import {skills} from '../battle-skills.js';
const root=fileURLToPath(new URL('../',import.meta.url));
const out=path.join(root,'wechat');
await mkdir(path.join(out,'assets'),{recursive:true});
for(const name of await readdir(path.join(root,'assets'))){
 if(!name.endsWith('.svg'))continue;
 const svg=await readFile(path.join(root,'assets',name),'utf8');
 if (['build-rapid.svg','build-frost.svg','build-blast.svg'].includes(name)) {
   const grey=svg.replace(/#([0-9a-f]{6})/gi,(_,hex)=>{
     const [r,g,b]=hex.match(/../g).map(channel=>parseInt(channel,16));
     const shade=Math.round(.2126*r+.7152*g+.0722*b).toString(16).padStart(2,'0');
     return '#'+shade.repeat(3);
   });
   await writeFile(path.join(out,'assets',name.replace('.svg','-disabled.png')),new Resvg(grey).render().asPng());
 }
 await writeFile(path.join(out,'assets',name.replace('.svg','.png')),new Resvg(svg).render().asPng());
}
const buffs=[];
preloadBuffIcons({load:{svg:(key,uri)=>buffs.push([key,Buffer.from(uri.split(',')[1],'base64').toString()])}});
for(const [key,svg]of buffs)await writeFile(path.join(out,'assets',key+'.png'),new Resvg(svg).render().asPng());
const uiKeys=[...new Set([...skills.map(s=>s.id),'constellation','weaponMastery','heal_supply','rail'])];
for(const key of uiKeys){
 const svg=icon(key).replace('<svg ','<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" ').replaceAll('currentColor','#fff3ca');
 await writeFile(path.join(out,'assets','ui-'+key+'.png'),new Resvg(svg).render().asPng());
}
const html=await readFile(path.join(root,'index.html'),'utf8');
const dodge=html.match(/<svg class="dodge-icon"[\s\S]*?<\/svg>/)[0]
 .replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" ')
 .replaceAll('currentColor','#322e23');
await writeFile(path.join(out,'assets/ui-roll.png'),new Resvg(dodge).render().asPng());
const engine=await readFile(path.join(root,'vendor/phaser.js'),'utf8');
for(const key of ['default','missing','white']){
 const expression=engine.split('"images.'+key+'",')[1].split(')')[0];
 const encoded=expression.startsWith('M+') ? engine.match(/var M="data:image\/png;base64,([^"]+)"/)[1]+JSON.parse(expression.slice(2)) : JSON.parse(expression).split(',')[1];
 await writeFile(path.join(out,'boot-'+key+'.png'),Buffer.from(encoded,'base64'));
}
const imageKeys=(await readdir(path.join(out,'assets'))).filter(n=>n.endsWith('.png')).map(n=>n.slice(0,-4));
await build({stdin:{contents:`import './wechat-src/platform.js';import './game.js';`,resolveDir:root},outfile:path.join(out,'game.js'),bundle:true,banner:{js:'GameGlobal.bootPhase="启动引擎";var bootAlert=false;function reportBoot(message){if(!bootAlert&&!GameGlobal.lobbyRendered){bootAlert=true;wx.showModal({title:"启动未完成",content:GameGlobal.bootPhase+" · "+String(message && (message.errMsg || message.message || message.stack) || (typeof message==="object" ? JSON.stringify(message) : message)).slice(0,300),showCancel:false});}} wx.onError(reportBoot);setTimeout(function(){reportBoot("启动超过30秒");},30000);var window=GameGlobal,document=GameGlobal.document,navigator=GameGlobal.navigator,performance,Image,XMLHttpRequest,HTMLElement,HTMLCanvasElement,HTMLImageElement,localStorage,ResizeObserver,URLSearchParams;function __installEnv(e){window=e;performance=e.performance;document=e.document;navigator=e.navigator;Image=e.Image;XMLHttpRequest=e.XMLHttpRequest;HTMLElement=e.HTMLElement;HTMLCanvasElement=e.HTMLCanvasElement;HTMLImageElement=e.HTMLImageElement;localStorage=e.localStorage;ResizeObserver=e.ResizeObserver;URLSearchParams=e.URLSearchParams;}'},format:'cjs',platform:'neutral',target:'es2018',minify:true,legalComments:'eof',plugins:[{name:'wechat-platform',setup(b){
 b.onResolve({filter:/\.js\?v=/},args=>({path:path.resolve(args.resolveDir,args.path.split('?')[0])}));
 b.onLoad({filter:/\.js$/},async args=>{
  if(args.path.includes('node_modules'))return;
  let source=await readFile(args.path,'utf8');
  if(args.path===path.join(root,'game.js')){
   source=`import {attachUI} from './wechat-src/platform.js';\n`+source;
   source=source.replace('this.load.svg(key, `./assets/${key}.svg`)','this.load.image(key, `assets/${key}.png`)');
   source=source.replace('for (const key of artKeys)',`for (const key of ${JSON.stringify(imageKeys)})`);
   source=source.replace('type: Lt.AUTO,','type: Lt.CANVAS,\n  images:{default:"boot-default.png",missing:"boot-missing.png",white:"boot-white.png"},\n  canvas: window.canvas,\n  audio: {noAudio:true},\n  loader: {imageLoadType:"HTMLImageElement"},');
   source=source.replace('preloadBuffIcons(this);', 'GameGlobal.bootPhase="加载图片";this.load.on("filecomplete",(key)=>{GameGlobal.bootPhase="加载图片 · "+key});');
   source=source.replace('this.profile = loadLobby();','GameGlobal.bootPhase="初始化大厅";this.profile = loadLobby();');
   source=source.replace('parent: "game",','parent: null,');
   source=source.replace('autoCenter: Lt.Scale.CENTER_BOTH','autoCenter: Lt.Scale.NO_CENTER');
   source=source.replace('document.addEventListener("pointerdown", () => pt.unlock());', 'wx.onTouchStart(() => pt.unlock());');
   source+='\nattachUI(Ct);\n';
  }
  if(args.path===path.join(root,'lobby.js')){
   source=`import {UIElement} from './wechat-src/platform.js';\n`+source.replace('document.createElement(tag)','new UIElement(tag)');
  }
  if(args.path===path.join(root,'presentation.js')){
   source=source.replace('scene.load.svg("buff-" + id, "data:image/svg+xml;base64," + btoa(svg));','scene.load.image("buff-" + id, "assets/buff-" + id + ".png");');
   source=source.replace(/export function icon\(id\) \{[\s\S]*?\n\}/, 'export function icon(id) { return `<img src="./assets/ui-${id}.png">`; }');
  }
  return {contents:source,loader:'js'};
 });
}}]});
await copyFile(path.join(root,'vendor/wechat-adapter/LICENSE'),path.join(out,'ADAPTER-LICENSE.txt'));
console.log('WeChat game built:',out);

