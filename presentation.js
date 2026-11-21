import { catalogs } from "./role-cards.js";
import { rangerCards } from "./ranger.js";
import { BALANCE, variants } from "./balance.js";
// Original vector art and presentation layer.
// Lobby order: ground, shade and highlight.
const terrain = [
  [0x455462,0x2c3a46,0x5c707d],
  [0x3e5760,0x2a3d48,0x587a83],
  [0x544f53,0x353942,0x6e6364],
  [0x445b52,0x2c453d,0x607463],
  [0x4d4a5b,0x343340,0x695c74],
  [0x49485f,0x2f3148,0x625c7a],
  [0x3e585e,0x2b4148,0x577071],
  [0x465363,0x2e394a,0x607082],
  [0x455651,0x2e3a3e,0x62716b],
  [0x585360,0x3c3a49,0x746975],
];
export const sceneryDepth = feet => 4 + feet / 16000;
export const artKeys = [
  "spider","hound","rat",
  "mount-boar-body", "mount-lynx-body", "mount-stag-body",
  "mount-walker-chassis", "mount-walker", "mount-stag", "mount-drake", "mount-lynx", "mount-boar",
  "hero-ranger",
  "hero-berserker", "hero-swordsman", "hero-elementalist", "hero-summoner",
  "star-dial",
  "axe",
  "crossbow",
  "fire-staff",
  "shield",
  "deployer",
  "potato",
  "bug",
  ...Object.keys(variants),
  "brute", "zombie-elite", "zombie-breacher", "zombie-warden", "zombie-sovereign",
  "runner",
  "spitter",
  "gem",
  "drop-magnet", "drop-health",
  "gun",
  "pea",
  "orb",
  "rock",
  "staff",
  "blade",
  "tower-rapid",
  "tower-frost",
  "tower-blast",
];

const paths = {

  constellation: '<path d="m3 15 8-11 9 13-17-2"/><circle cx="3" cy="15" r="2"/><circle cx="11" cy="4" r="2"/><circle cx="20" cy="17" r="2"/>',
  weaponMastery: '<path d="m4 20 4-4m-3-3 6 6m-4-6L17 3l4-1-1 5L10 17"/>',
  meteor:
    '<path d="m5 3 8 8M3 8l7 7M10 2l7 7"/><circle cx="16" cy="16" r="6"/>',
  frost: '<path d="M12 2v20M3 7l18 10M3 17 21 7M8 4l4 4 4-4M8 20l4-4 4 4"/>',
  venom:
    '<path d="M12 2C10 7 4 11 4 16a8 8 0 0 0 16 0C20 11 14 7 12 2Z"/><path d="M8 16h1m6 0h1"/>',
  arc: '<path d="m14 2-10 12h7l-1 8 10-13h-7Z"/>',
  slash: '<path d="m4 21 5-6m-3-2 5 5M9 14 18 3h4l-2 8-8 6Z"/>',
  vortex: '<path d="M3 8h13c7 0 5-8 1-5M2 12h18M4 16h10c7 0 6 7 2 5"/>',
  siphon: '<path d="M12 21 3 12C-2 4 8 0 12 7c4-7 14-3 9 5Z"/>',
  orbit:
    '<ellipse cx="12" cy="12" rx="11" ry="5" transform="rotate(-35 12 12)"/><circle cx="12" cy="12" r="3"/><circle cx="20" cy="6" r="2"/>',
  rail: '<path d="m3 20 8-8m-4 9 8-8M8 7l8-4 5 5-4 8Z"/><path d="m11 7 6 6"/>',
  mine: '<path d="m12 3 9 17H3Z"/><path d="M12 9v4m0 3v1"/>',
  heal_supply: '<path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6Z"/>',
};
const buffPaths = {
  雷电共鸣: '<path d="m10 2-6 11h5l-2 8 9-13h-6zm7 1 3 3m-2 6 4 2"/>',
  陨石术: '<circle cx="8" cy="16" r="5"/><path d="m5 11 9-9m-2 12 9-10m-6 12 5-5"/>',
  黑洞术: '<ellipse cx="12" cy="12" rx="10" ry="5" transform="rotate(-30 12 12)"/><circle cx="12" cy="12" r="4" fill="#fff3ca"/>',
  冷却缩减: '<path d="M6 3h12M6 21h12M7 3c0 5 2 6 5 9-3 3-5 4-5 9m10-18c0 5-2 6-5 9 3 3 5 4 5 9"/>',
  魔力爆发: '<path d="m12 2 2 6 6-4-3 7 5 2-7 2 2 6-6-4-4 5 1-7-6-2 7-3z"/>',
  回旋剑气: '<path d="M5 15a8 8 0 1 1 9 5m-2-3 2 3 4 1M5 19l8-10 3-1-1 4z"/>',
  吸血剑刃: '<path d="m3 20 4-5m-3-2 6 5M7 14 18 3l3-1-1 4-10 11m7-3c-1 2-3 4-3 5a3 3 0 0 0 6 0c0-1-2-4-3-5z"/>',
  幻影剑: '<path d="m3 20 9-16 2-2v4L5 21zm7 0L20 6l2-1-1 4-9 12"/>',
  石头魔像: '<path d="m4 9 5-6h7l5 6-2 11H6zM7 11l3 1m4 0 3-1m-8 6h6"/>',
  召唤分裂: '<path d="m12 3 4 4-4 4-4-4zm0 8v2l-6 3m6-3 6 3"/><circle cx="5" cy="18" r="3"/><circle cx="19" cy="18" r="3"/>',
  召唤继承: '<path d="M4 7 6 3l3 4 3-4 2 4-2 3H6zm5 5v4h6m-2-3 3 3-3 3"/><circle cx="19" cy="16" r="3"/>',
  灵魂收集: '<path d="M5 19V11a7 7 0 0 1 14 0v9l-4-2-3 3-3-3z"/><path d="M9 10v2m6-2v2"/>',
  大地震击: '<path d="m3 16 6-2 3-9 3 9 6 2M2 20l6-2 3 3 3-4 7 3"/>',
  斩杀: '<path d="m4 21 10-12m-5 1 5-6 6-2 1 6-6 5zM3 4l3 3m-4 2 3 1"/>',
  bounce: '<path d="m2 18 7-11 5 10 7-12m-6 2 6-3v7"/>',
  split: '<path d="M12 21V12L4 5m0 5V5h5m3 7 8-7m-5 0h5v5"/>',
  ring: '<circle cx="12" cy="12" r="4"/><path d="M12 6V2m0 16v4M6 12H2m16 0h4M5 5l3 3m8 8 3 3m0-14-3 3M8 16l-3 3"/>',
  splinterArrow: '<path d="m3 21 9-10m-4 0 4 1 1 4m0-11 1-3m4 5 3-2m-3 7 4 1"/>',
  heavy: '<path d="m3 21 9-13 8-5-2 10-13 9zm7-7 4 3"/>',

  weaponMastery: paths.weaponMastery,
  evasion: '<circle cx="15" cy="6" r="2"/><path d="m13 10-5 4 5 2-4 5m4-11 3 4 5-1M3 8h5m-7 4h4"/>',
  shield: '<path d="m12 2 9 4v6q0 6-9 10-9-4-9-10V6Zm-4 10h8m-4-4v8"/>',
  power: '<path d="M5 19 18 6l1 5M5 19l5-1M4 13l7-7"/>',
  haste: '<path d="m3 6 6 6-6 6m9-12 6 6-6 6"/>',
  vitality: '<path d="M12 20 4 12C-1 4 8 1 12 7c4-6 13-3 8 5Z"/>',
  armor: '<path d="m12 2 8 3v7q0 5-8 10-8-5-8-10V5Z"/>',
  speed: '<path d="m13 4-2 9 5 2h4v4H7v-5l2-10M2 8h4m-5 4h4"/>',
  magnet: '<path d="M4 4v9a8 8 0 0 0 16 0V4h-5v9a3 3 0 0 1-6 0V4ZM4 8h5m6 0h5"/>',
  regen: '<path d="M9 4h6v5h5v6h-5v5H9v-5H4V9h5Z"/>',
  crit: '<circle cx="12" cy="12" r="7"/><path d="M12 1v5m0 12v5M1 12h5m12 0h5"/><circle cx="12" cy="12" r="2"/>',
  invincible: '<path d="m12 2 8 3v7q0 5-8 10-8-5-8-10V5Zm-4 9 3 3 5-6"/>',
  orbit: paths.orbit,
  siphon: paths.siphon,
};

export function preloadBuffIcons(scene) {
  for (const [id, path] of Object.entries(buffPaths)) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fff3ca" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`;
    scene.load.svg("buff-" + id, "data:image/svg+xml;base64," + btoa(svg));
  }
}

export function drawStatusEffects(scene) {
  const g = scene.statusGraphics.clear();
  const time = scene.combat.time;
  if (scene.mount?.shield > 0) {
    const {x, y, displayHeight} = scene.player;
    const height = Math.max(64, displayHeight + 22);
    const width = height * .79;
    const pulse = .5 + .5 * Math.sin(time * 4);
    g.fillStyle(0x6debe8, .09 + pulse*.04).fillEllipse(x,y,width,height)
      .lineStyle(7,0x5fe8dc,.16).strokeEllipse(x,y,width,height)
      .lineStyle(2,0xbdfff3,.8).strokeEllipse(x,y,width,height);
    for (let i = 0; i < 3; i++) {
      const angle = time * 1.3 + i * Math.PI * 2 / 3;
      g.fillStyle(0xeaffff,.95).fillCircle(x+Math.cos(angle)*width/2,
        y+Math.sin(angle)*height/2,2.4);
    }
  }
  for (const enemy of scene.enemies) {
    const {x,y,active} = enemy.s;
    if (!active) continue;
    const r = enemy.r;
    const frozen = (enemy.frozenUntil || 0) - time;
    const chilled = Math.max(enemy.chilledUntil || 0, enemy.status?.ice || 0) - time;
    if (frozen > 0) {
      const alpha = Math.min(1, frozen/.12);
      g.fillStyle(0x96ecff,.16*alpha).fillEllipse(x,y,r*1.9,r*2);
      for (let i = -1; i <= 1; i++) {
        const cx = x+i*r*.52, base = y+r*.72, tip = base-r*(i ? 1 : 1.65);
        g.fillStyle(0x69c8ed,.68*alpha).fillTriangle(cx-r*.23,base,cx,tip,cx+r*.23,base)
          .lineStyle(1.8,0xe6ffff,.95*alpha).lineBetween(cx-r*.23,base,cx,tip)
          .lineBetween(cx,tip,cx+r*.07,base);
      }
    } else if (chilled > 0) {
      const alpha = Math.min(1, chilled/.18);
      g.lineStyle(2,0x85daff,.72*alpha).strokeEllipse(x,y+r*.46,r*2,r*.52);
      for (let i = 0; i < 4; i++) {
        const a = time*3 + x*.004 + i*Math.PI/2;
        const px = x+Math.cos(a)*r*.92, py = y+Math.sin(a)*r*.48;
        g.lineStyle(2,0xb7f5ff,.9*alpha).lineBetween(px-3,py,px+3,py)
          .lineBetween(px,py-3,px,py+3);
      }
    }
  }
}

export function updateBuffIcons(scene) {
  const cards = scene.job?.id === "ranger" ? rangerCards : catalogs[scene.job?.name] || [];
  const effects = cards.filter(card =>
    (card.rarity === "史诗" || card.rarity === "传说") && scene.build.attributes[card.id] > 0
  ).map(card => ({
    key: "buff-" + card.id, level: scene.build.attributes[card.id],
    color: card.rarity === "传说" ? 0x795820 : 0x59406e,
  }));
  const row = scene.buffIcons;
  const signature = effects.map(e => e.key + (e.level || "")).join("|");
  if (row.signature !== signature) {
    row.signature = signature;
    row.removeAll(true);
    effects.forEach(({ key, level, color }, i) => {
      const column = i % 6;
      const count = Math.min(6, effects.length - (i - column));
      const x = (column - (count - 1) / 2) * 24;
      const y = -Math.floor(i / 6) * 24;
      row.add(scene.add.rectangle(x, y, 21, 21, color).setStrokeStyle(1.5, 0x302c24));
      const icon = scene.add.image(x, y, key);
      icon.setScale(Math.min(18 / icon.width, 18 / icon.height));
      row.add(icon);
      if (level > 1) row.add(scene.add.text(x + 10, y + 11, String(level), {
        fontFamily: "Arial", fontStyle: "bold", fontSize: "10px", stroke: "#292721", strokeThickness: 3,
      }).setOrigin(1));
    });
  }
  row.setPosition(scene.player.x, scene.player.y - scene.player.displayHeight / 2 - 14);
}
const rangerIcon = {
  strong:"power", rapid:"haste", aim:"crit", critical:"crit", volley:"rail", piercingArrow:"weaponMastery",
  bounce:"orbit", split:"constellation", repeat:"haste", ring:"orbit", splinterArrow:"meteor", heavy:"weaponMastery",
  fire:"meteor", ice:"frost", shock:"arc", push:"vortex", health:"vitality", stride:"speed", hunt:"crit",
  storm:"rail", thunder:"arc", zero:"frost", sniper:"crit",
};
export function icon(id) {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[id] || buffPaths[id] || paths[rangerIcon[id]] || buffPaths[rangerIcon[id]] || paths.rail}</svg>`;
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  node.className = className;
  if (text) node.textContent = text;
  return node;
}

export function renderPanel(scene, title, detail, choices, cards = false, onConfirm) {
  const overlay = el("div", "modal-overlay");
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-label", title);
  const panel = el(
    "section",
    `game-menu ${cards ? "selection-menu" : ""} ${scene.mode === "ready" && !cards ? "welcome-menu" : ""}`,
  );
  overlay.append(panel);
  const head = el("div", "menu-heading");
  if (!cards) head.append(
    el(
      "div",
      "eyebrow",
      "LAST BLOCK / 生存行动",
    ),
  );
  head.append(el("h1", "", title), el("p", "menu-description", detail));
  panel.append(head);
  if (scene.mode === "ready" && !cards) {
    const art = el("div", "hero-art");
    art.innerHTML =
      '<div class="hero-orbit"></div><span class="hero-stamp">仅剩一个街区</span><img class="hero-monster one" src="./assets/bug.svg" alt="街巷游尸"><img class="hero-monster two" src="./assets/brute.svg" alt="畸变壮尸"><img class="hero-tower" src="./assets/tower-rapid.svg" alt="圆形速射塔"><img class="hero-player" src="./assets/potato.svg" alt="头戴红色头巾的守夜人"><img class="hero-gun" src="./assets/gun.svg" alt=""><span class="hero-ground"></span>';
    panel.append(art);
    const rules = el("div", "briefing");
    for (const [n, label, text] of [
      ["01", "保持移动", "自动攻击 · 走位生存"],
      ["02", "收集与进化", "拾取经验 · 升级选择强化"],
        ["03", "建立防线", "猎杀精英与首领 · 建塔并守护"],
    ]) {
      const row = el("div", "briefing-item");
      row.append(
        el("b", "briefing-number", n),
        el("strong", "", label),
        el("span", "", text),
      );
      rules.append(row);
    }
    panel.append(rules);
  }
  const list = el(
    "div",
    cards
      ? `choice-grid ${choices.length > 3 ? "starter-grid" : ""}`
      : "menu-actions",
  );
  choices.forEach((choice) => {
    const button = el("button", cards ? "choice-card" : "menu-action");
    button.type = "button";
    if (cards) {
      if (choice.rarity) button.dataset.rarity = choice.rarity;
      button.dataset.element = choice.element || "supply";
      const symbol = el("span", "choice-icon");
      symbol.innerHTML = icon(choice.id);
      if (choice.job) {
        button.classList.add("class-card");
        symbol.classList.add("class-portrait");
        symbol.innerHTML = `<img src="./assets/hero-${choice.job.id}.svg" alt=""><img class="class-weapon" src="./assets/${choice.job.texture}.svg" alt="${choice.job.weapon}">`;
      }
      button.append(symbol);
      button.append(el("span", "choice-tag", choice.levelText || "初始技能"));
    }
    button.append(
      el("strong", "choice-title", choice.cardTitle || choice.title),
    );
    button.append(el("span", "choice-detail", choice.stats || choice.detail));
    if (cards && choice.route) button.append(el("span", "choice-route", choice.route + "流派"));
    if (!cards) button.append(el("span", "action-arrow", "→"));
    button.onclick = () => {
      if (scene.panel?.element === overlay) choice.action();
    };
    list.append(button);
  });
  panel.append(list);
  const footer = el(
    "div",
    "menu-footer",
    cards
      ? choices.length > 3
        ? "选择职业与起始武器"
        : "点选一项，继续战斗"
      : "W A S D  移动    /    SPACE  暂停    /    触屏拖动左侧移动",
  );
  panel.append(footer);
  if (cards && scene.mode === "upgrade") {
    overlay.classList.add("upgrade-overlay");
    panel.replaceChildren(head, list);
    if (onConfirm) {
      const selected = new Set();
      const required = Math.min(2, choices.length);
      const confirm = el("button", "draft-confirm");
      const cards = Array.from(list.children);
      const update = () => {
        const route = [...selected].map(index=>choices[index].route).find(Boolean);
        confirm.disabled = selected.size !== required;
        confirm.textContent = `确认强化（${selected.size}/${required}）`;
        cards.forEach((card, index) => {
          card.dataset.selected = String(selected.has(index));
          card.setAttribute("aria-pressed", card.dataset.selected);
          card.disabled = (selected.size === required && !selected.has(index)) || Boolean(route && choices[index].route && choices[index].route !== route);
        });
      };
      cards.forEach((card, index) => {
        card.onclick = () => {
          if (card.disabled) return;
          if (selected.has(index)) selected.delete(index);
          else selected.add(index);
          update();
        };
      });
      confirm.onclick = () => {
        if (scene.panel?.element === overlay && selected.size === required) onConfirm([...selected]);
      };
      update();
      panel.append(confirm);
    }
  }
  if (scene.mode === "pause" || scene.mode === "end") {
    overlay.classList.add("pause-overlay");
    const resume = list.querySelector("button");
    resume.textContent = scene.mode === "pause" ? "继续游戏" : choices[0].title;
    panel.replaceChildren(resume);
  }
  document.getElementById("game").append(overlay);
  const priorFocus = document.activeElement;
  const trap = (event) => {
    if (event.key !== "Tab") return;
    const buttons = [...overlay.querySelectorAll("button")].filter(button => !button.disabled);
    const index = buttons.indexOf(document.activeElement);
    event.preventDefault();
    if (index < 0) {
      buttons[event.shiftKey ? buttons.length - 1 : 0]?.focus();
      return;
    }
    buttons[(index + (event.shiftKey ? -1 : 1) + buttons.length) % buttons.length]?.focus();
  };
  overlay.addEventListener("keydown", trap);
  scene.panel = {
    element: overlay,
    destroy() {
      overlay.remove();
      if (priorFocus?.isConnected) priorFocus.focus({ preventScroll: true });
    },
  };
  if (cards && scene.mode === "upgrade") {
    overlay.tabIndex = -1;
    overlay.focus({ preventScroll: true });
  } else {
    list.querySelector("button")?.focus({ preventScroll: true });
  }
}

export function drawGround(scene, x, y, random) {
  const view = scene.add.container(x * 600, y * 600).setDepth(-10);
  const g = scene.add.graphics();
  view.add(g);
  const [ground,shade,light] = terrain[scene.profile.stage] || terrain[0];
  g.fillStyle(ground).fillRect(0, 0, 600, 600);
  const stage = scene.profile.stage;
  // Broken paving, silt and rubble are ground paint with no collision footprint.
  const surface = ["street","wet","rail","moss","shale","street","wet","street","cable","shale"][stage];
  for (let i=0;i<7;i++) {
    const cx=80+random()*440, cy=45+random()*510;
    const radius=28+random()*47, points=[];
    for(let j=0;j<11;j++){
      const angle=j*Math.PI*2/11, r=radius*(.65+random()*.35);
      points.push({x:cx+Math.cos(angle)*r,y:cy+Math.sin(angle)*r*.42});
    }
    g.fillStyle(shade,.74).fillPoints(points,true);
    if(surface==="wet"){
      g.lineStyle(2,0x79989f,.42).lineBetween(cx-radius*.45,cy+2,cx+radius*.2,cy)
        .lineBetween(cx+5,cy+6,cx+24,cy+5);
    }
    if(surface==="moss"){
      for(let j=0;j<9;j++)g.fillStyle(0x738160,.4).fillEllipse(cx+(random()-.5)*radius,cy+(random()-.5)*18,8,4);
    }
  }
  for(let i=0;i<4;i++){
    let px=130+random()*340,py=110+random()*380;
    const direction=(random()-.5)*Math.PI*2;
    for(let j=0;j<5;j++){
      const angle=direction+(random()-.5)*1.4, length=12+random()*15;
      const nx=px+Math.cos(angle)*length,ny=py+Math.sin(angle)*length;
      g.lineStyle(4-j*.55,0x151c24,.9).lineBetween(px,py,nx,ny);
      g.lineStyle(1,light,.8).lineBetween(px+1,py+2,nx+1,ny+2);
      if(j===2)g.lineStyle(2,0x18212a,.9).lineBetween(nx,ny,nx-Math.sin(angle)*18,ny+Math.cos(angle)*18);
      px=nx;py=ny;
    }
    for(let j=0;j<8;j++){
      const dx=px+(random()-.5)*65,dy=py+(random()-.5)*32,r=2+random()*6;
      g.fillStyle(j%3?light:0x786761,.78).fillTriangle(dx-r,dy,dx+1,dy-r*.65,dx+r,dy+2);
    }
  }
  const ax=85+random()*400,ay=90+random()*415;
  if(surface==="street"){
    for(let i=0;i<3;i++){
      const x=ax+i*16,y=ay-i*3;
      g.fillStyle(stage===5?0x997d94:0x999078,.47).fillTriangle(x,y,x+12,y-3,x+2,y+4);
    }
  } else if(surface==="rail" || surface==="cable"){
    for(let i=0;i<2;i++)g.lineStyle(2,i?light:0x1a2227,.9)
      .lineBetween(ax,ay+i*5,ax+30,ay+9+i*5).lineBetween(ax+30,ay+9+i*5,ax+64,ay-5+i*5);
  } else if(surface==="shale"){
    for(let i=0;i<6;i++){
      const x=ax+random()*45,y=ay+random()*17;
      g.fillStyle(light,.9).fillTriangle(x,y,x+18,y-6,x+13,y+1);
    }
  }
  for(let i=0;i<65;i++)g.fillStyle(light,.45).fillCircle(random()*600,random()*600,1+random()*1.4);
  return view;
}

// Each pass has a separate lifetime and motion, so the silhouette changes after impact.
export function energyBurst(scene, x, y, color, radius, count, inward = false) {
  const layer = depth => scene.add.graphics({x, y}).setDepth(depth);
  const core = layer(7), rays = layer(7), echo = layer(6);
  const phase = scene.runTime * 2;
  for (let i = 0; i < count; i++) {
    const angle = phase + i * Math.PI * 2 / count;
    const dx = Math.cos(angle), dy = Math.sin(angle);
    const tip = radius * (i % 2 ? .7 : 1);
    core.fillStyle(color,.32).fillTriangle(-dy*5,dx*5,dx*tip,dy*tip,dy*5,-dx*5);
    core.fillStyle(0xfff6da,.96).fillTriangle(-dy*2,dx*2,dx*tip*.75,dy*tip*.75,dy*2,-dx*2);
    const start = tip*.68;
    rays.lineStyle(3,color,.88).lineBetween(dx*start,dy*start,dx*tip,dy*tip)
      .fillStyle(0xfff6df).fillCircle(dx*tip,dy*tip,1.8);
    if (i%2 === 0) echo.lineStyle(3,color,.9).beginPath()
      .arc(0,0,radius*.77,angle,angle+Math.PI*2/count).strokePath();
  }
  echo.lineStyle(1,0xfff4dc,.9).strokeCircle(0,0,radius*.66);
  scene.effect(core,.16,0,0,.34);
  scene.effect(rays,.34,0,0,inward ? -.78 : .92,inward ? -1.4 : .48,.045);
  scene.effect(echo,.46,0,0,inward ? -.65 : .88,inward ? 1.8 : -.85,.12);
}

export function combatFeedback(scene, x, y, color, critical, lethal) {
  const g = scene.add.graphics({ x, y }).setDepth(8);
  const r = lethal ? 30 : critical ? 24 : 14;
  g.fillStyle(color, 0.18).fillCircle(0, 0, r * 0.85);
  for (let i = 0; i < (critical || lethal ? 8 : 4); i++) {
    const a = scene.runTime * 2 + i * Math.PI / (critical || lethal ? 4 : 2);
    const dx = Math.cos(a), dy = Math.sin(a);
    const length = r * (i % 2 ? 0.8 : 1.35);
    g.fillStyle(i % 2 ? color : 0xffe6a6, 0.92)
      .fillTriangle(dx*4-dy*3, dy*4+dx*3, dx*length, dy*length, dx*4+dy*3, dy*4-dx*3);
  }
  g.lineStyle(lethal ? 4 : 3, color, 1);
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3 + 0.2;
    g.lineBetween(
      Math.cos(a) * r * 0.65,
      Math.sin(a) * r * 0.65,
      Math.cos(a) * r,
      Math.sin(a) * r,
    );
  }
  g.fillStyle(0xfff3c5).fillCircle(0, 0, critical ? 7 : 4);
  scene.effect(g, lethal ? 0.24 : 0.13, 0, 0, 1.3);
  if (lethal) {
    const puff = scene.add.circle(x, y, 18, 0x655940, 0.16).setDepth(1);
    scene.effect(puff, 0.4, 0, 0, 1.2);
  }
}

export function drawOrbit(g, x, y, color, angle, level = 1) {
  const points = [
    { x, y: y - 12 },
    { x: x + 7, y },
    { x, y: y + 12 },
    { x: x - 7, y },
  ];
  g.lineStyle(4, color, 0.25).lineBetween(
    x - Math.cos(angle - 1.57) * 20,
    y - Math.sin(angle - 1.57) * 20,
    x,
    y,
  );
  for (let i = 1; i <= level + 1; i++) {
    const tx = x + Math.sin(angle) * i * 7, ty = y - Math.cos(angle) * i * 7;
    g.fillStyle(color, 0.32 / i).fillTriangle(tx, ty-9, tx+5, ty, tx, ty+9);
  }
  if (level >= 4) {
    for (let i=1; i<=3; i++) {
      const length = i * (level === 5 ? 15 : 10);
      const tx = x + Math.sin(angle)*length, ty = y - Math.cos(angle)*length;
      g.lineStyle(4-i,color,.8-i*.13).beginPath()
        .arc(tx,ty,4+i,angle+.5,angle+3.8).strokePath()
        .fillStyle(0xfff6da,.9).fillCircle(tx,ty,2);
    }
  }
  if (level >= 3) {
    const span = level * 2;
    g.fillStyle(0xffeab5).fillTriangle(x-span,y+5,x,y-4,x+span,y+5);
  }
  g.fillStyle(color)
    .fillPoints(points, true)
    .lineStyle(2, 0x504d39)
    .strokePoints(points, true);
  g.lineStyle(2, 0xfff6d2).lineBetween(x, y - 7, x, y + 3);
}

export function drawArc(g, from, to, color, level = 1) {
  const dx = to.x - from.x,
    dy = to.y - from.y,
    d = Math.max(1, Math.hypot(dx, dy));
  const points = [{ x: from.x, y: from.y }];
  for (let i = 1; i < 6; i++) {
    const offset = (i % 2 ? 1 : -1) * Math.min(12, d * 0.09);
    points.push({
      x: from.x + (dx * i) / 6 - (dy / d) * offset,
      y: from.y + (dy * i) / 6 + (dx / d) * offset,
    });
  }
  points.push({ x: to.x, y: to.y });
  for (let i = 1; i <= level; i++) {
    const node = points[i], sign = i % 2 ? 1 : -1;
    g.lineStyle(2, color, 0.9).lineBetween(node.x, node.y,
      node.x + dx * 0.12 - sign * dy / d * 17, node.y + dy * 0.12 + sign * dx / d * 17);
  }
  if (level === 5) g.lineStyle(2, 0xffdd90).strokeCircle(to.x, to.y, 10);
  g.lineStyle(5 + level, color, 0.4).strokePoints(points, false);
  g.lineStyle(3, color).strokePoints(points, false);
  g.lineStyle(1, 0xfff5d4).strokePoints(points, false);
}

export function updatePresentation(scene, moving) {
  const time = document.getElementById("timer");
  time.textContent = `${Math.floor(scene.runTime / 60)
    .toString()
    .padStart(2, "0")}:${Math.floor(scene.runTime % 60)
    .toString()
    .padStart(2, "0")}`;
  const waves = scene.waves;
  const stage = waves[scene.wave - 1];
  const remaining = stage.total - scene.waveSpawned + scene.enemies.length;
  const waveLabel = document.getElementById("wave");
  const waveText = `${scene.stageName} · ${scene.wave}/${waves.length} 波 · 剩 ${remaining}`;
  waveLabel.title = stage.name;
  if (waveLabel.textContent !== waveText) waveLabel.textContent = waveText;
  const warning = document.getElementById("boss-warning");
  const bossAt = Math.floor(stage.total/2);
  const notice = stage.bossIndex !== undefined && scene.waveSpawned <= bossAt && scene.waveSpawned >= bossAt-stage.count
    ? "首领即将入场" : "";
  if (warning.textContent !== notice) warning.textContent = notice;
  warning.hidden = !notice;
  document
    .getElementById("game")
    .classList.toggle("low-health", scene.hp / scene.maxHp < 0.3);
  const bounce = moving ? Math.sin(scene.runTime * 17) : 0;
  scene.player.setScale(
    BALANCE.player.visualScale * (scene.mount ? 0.75 : 1) * (1 + Math.abs(bounce) * 0.035),
    BALANCE.player.visualScale * (scene.mount ? 0.75 : 1) * (1 - Math.abs(bounce) * 0.045),
  );
  updateWeaponPose(scene);
}

export function updateWeaponPose(scene) {
  const target = scene.enemies.reduce(
    (best, e) =>
      !best ||
      scene.distance(scene.player, e.s) < scene.distance(scene.player, best.s)
        ? e
        : best,
    null,
  );
  const angle = target
    ? Math.atan2(target.s.y - scene.player.y, target.s.x - scene.player.x)
    : scene.gun.rotation;
  scene.gun.setRotation(angle).setFlipY(Math.cos(angle) < 0);
  scene.gun.setPosition(
    scene.player.x + Math.cos(angle) * 23 * scene.player.scaleX,
    scene.player.y + (9 + Math.sin(angle) * 12) * scene.player.scaleY,
  );
}

