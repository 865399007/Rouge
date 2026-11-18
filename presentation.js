import { BALANCE, variants } from "./balance.js";
// Original vector art and presentation layer.
export const artKeys = [
  "mount-boar-body", "mount-lynx-body", "mount-stag-body",
  "mount-walker-chassis", "mount-walker", "mount-stag", "mount-drake", "mount-lynx", "mount-boar",
  "hero-ranger",
  "hero-vanguard",
  "hero-pyromancer",
  "hero-engineer",
  "hero-warden",
  "hero-astronomer",
  "star-dial",
  "axe",
  "crossbow",
  "fire-staff",
  "shield",
  "deployer",
  "potato",
  "bug",
  ...Object.keys(variants),
  "brute",
  "runner",
  "spitter",
  "gem",
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

export function updateBuffIcons(scene) {
  const effects = Object.entries(scene.build.attributes)
    .filter(([, level]) => level > 0)
    .map(([id, level]) => ({ key: "buff-" + id, level, color: 0x435b48 }));
  for (const skill of scene.build.active) {
    if (skill.type === "orbit" || (skill.type === "drain" && scene.combat.zones.some(z => z.owner === skill.id))) {
      effects.push({ key: "buff-" + skill.id, level: skill.level, color: 0x635075 });
    }
  }
  if (scene.mount) {
    const { type, shield } = scene.mount;
    effects.push({ key: "mount-" + type.id, color: 0x665338 });
    if (!type.shield || shield > 0) effects.push({
      key: "buff-" + type.passiveIcon, level: type.shield ? Math.ceil(shield) : 0, color: 0x745634,
    });
  }
  if (scene.invincible > 0) effects.push({ key: "buff-invincible", color: 0x3d6374 });
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
export function icon(id) {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[id] || paths.rail}</svg>`;
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  node.className = className;
  if (text) node.textContent = text;
  return node;
}

export function renderPanel(scene, title, detail, choices, cards = false) {
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
      '<div class="hero-orbit"></div><span class="hero-stamp">仅剩一个街区</span><img class="hero-monster one" src="./assets/bug.svg" alt="绿皮怪"><img class="hero-monster two" src="./assets/brute.svg" alt="重装怪"><img class="hero-tower" src="./assets/tower-rapid.svg" alt="圆形速射塔"><img class="hero-player" src="./assets/potato.svg" alt="头戴红色头巾的守夜人"><img class="hero-gun" src="./assets/gun.svg" alt=""><span class="hero-ground"></span>';
    panel.append(art);
    const rules = el("div", "briefing");
    for (const [n, label, text] of [
      ["01", "保持移动", "自动攻击 · 走位生存"],
      ["02", "收集与进化", "拾取晶体 · 搭配技能"],
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
        ? "职业武器独立 · 技能槽 ×4"
        : "点选一项，继续战斗"
      : "W A S D  移动    /    SPACE  暂停    /    触屏拖动左侧移动",
  );
  panel.append(footer);
  document.getElementById("game").append(overlay);
  const priorFocus = document.activeElement;
  const trap = (event) => {
    if (event.key !== "Tab") return;
    const buttons = [...overlay.querySelectorAll("button")];
    const index = buttons.indexOf(document.activeElement);
    event.preventDefault();
    buttons[
      (index + (event.shiftKey ? -1 : 1) + buttons.length) % buttons.length
    ]?.focus();
  };
  overlay.addEventListener("keydown", trap);
  scene.panel = {
    element: overlay,
    destroy() {
      overlay.remove();
      if (priorFocus?.isConnected) priorFocus.focus({ preventScroll: true });
    },
  };
  list.querySelector("button")?.focus({ preventScroll: true });
}

export function drawGround(scene, x, y, random) {
  const view = scene.add.container(x * 600, y * 600).setDepth(-10);
  const g = scene.add.graphics();
  view.add(g);
  g.fillStyle(0xb9ad91).fillRect(0, 0, 600, 600);
  // Low-contrast patches are visual decoration, never invisible obstacles.
  for (let i = 0; i < 9; i++) {
    g.fillStyle(i % 2 ? 0xb0a487 : 0xc1b598, 0.55).fillEllipse(
      random() * 600,
      random() * 600,
      70 + random() * 140,
      25 + random() * 65,
    );
  }
  for (let i = 0; i < 100; i++) {
    const px = random() * 600,
      py = random() * 600;
    g.fillStyle(0x807660, 0.23).fillCircle(px, py, 1 + random() * 1.7);
  }
  for (let i = 0; i < 11; i++) {
    const px = 25 + random() * 550,
      py = 25 + random() * 550;
    g.lineStyle(2, 0x887e64, 0.55)
      .lineBetween(px, py, px + 8, py - 5)
      .lineBetween(px + 8, py - 5, px + 18, py - 3);
  }
  for (let i = 0; i < 5; i++) {
    const px = 30 + random() * 540,
      py = 30 + random() * 540;
    g.lineStyle(2, 0x7e8060, 0.65)
      .lineBetween(px, py, px - 5, py - 10)
      .lineBetween(px, py, px + 3, py - 14)
      .lineBetween(px, py, px + 9, py - 8);
  }
  for (let i = 0; i < 3; i++)
    view.add(
      scene.add
        .image(30 + random() * 540, 30 + random() * 540, "rock")
        .setScale(0.5 + random() * 0.4)
        .setAlpha(0.6),
    );
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
  const next = scene.bossTimes.find((t) => !scene.nodes.has(t));
  const warning = document.getElementById("boss-warning");
  const imminent = next !== undefined && next - scene.runTime <= BALANCE.bossWarning;
  const stage = scene.encounter;
  let notice = "";
  if (imminent) notice = `${next === 540 ? "最终首领" : "街区首领"}将在 ${Math.max(0, Math.ceil(next - scene.runTime))} 秒后抵达`;
  else if (stage && scene.runTime - stage.start < 5) notice = stage.name;
  if (warning.textContent !== notice) warning.textContent = notice;
  warning.hidden = !notice;
  document
    .getElementById("game")
    .classList.toggle("low-health", scene.hp / scene.maxHp < 0.3);
  const bounce = moving ? Math.sin(scene.runTime * 17) : 0;
  scene.player.setScale(
    (scene.mount ? 0.75 : 1) * (1 + Math.abs(bounce) * 0.035),
    (scene.mount ? 0.75 : 1) * (1 - Math.abs(bounce) * 0.045),
  );
  const target = scene.enemies.reduce(
    (best, e) =>
      !best ||
      scene.distance(scene.player, e.s) < scene.distance(scene.player, best.s)
        ? e
        : best,
    null,
  );
  if (target) {
    const a = Math.atan2(
      target.s.y - scene.player.y,
      target.s.x - scene.player.x,
    );
    scene.gun.setRotation(a).setFlipY(Math.cos(a) < 0);
    scene.gun.setPosition(
      scene.player.x + Math.cos(a) * 23,
      scene.player.y + 9 + Math.sin(a) * 12,
    );
  }
}
