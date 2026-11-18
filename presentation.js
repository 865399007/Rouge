import { BALANCE } from "./balance.js";
// Original vector art and presentation layer.
export const artKeys = [
  "hero-ranger",
  "hero-vanguard",
  "hero-pyromancer",
  "hero-engineer",
  "hero-warden",
  "axe",
  "crossbow",
  "fire-staff",
  "shield",
  "deployer",
  "potato",
  "bug",
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
  head.append(
    el(
      "div",
      "eyebrow",
      cards ? "BUILD YOUR SURVIVOR / 配装" : "LAST BLOCK / 生存行动",
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
  choices.forEach((choice, i) => {
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
      button.append(
        el("span", "card-index", String(i + 1).padStart(2, "0")),
        symbol,
      );
      button.append(el("span", "choice-tag", choice.levelText || "初始技能"));
    }
    button.append(
      el("strong", "choice-title", choice.cardTitle || choice.title),
    );
    button.append(el("span", "choice-detail", choice.stats || choice.detail));
    if (cards)
      button.append(
        el(
          "span",
          "choice-cta",
          choice.job
            ? "以此职业出发 ↗"
            : choice.levelText
              ? "选择成长 ↗"
              : "装备出发 ↗",
        ),
      );
    else button.append(el("span", "action-arrow", "→"));
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
        ? "职业武器不占技能槽 · 最多装备 4 种技能 · 技能高阶需要角色等级解锁"
        : "升级期间战斗暂停 · 选择后继续行动"
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

export function combatFeedback(scene, x, y, color, critical, lethal) {
  const g = scene.add.graphics({ x, y }).setDepth(8);
  const r = lethal ? 22 : 12;
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

export function drawOrbit(g, x, y, color, angle) {
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
  g.fillStyle(color)
    .fillPoints(points, true)
    .lineStyle(2, 0x504d39)
    .strokePoints(points, true);
  g.lineStyle(2, 0xfff6d2).lineBetween(x, y - 7, x, y + 3);
}

export function drawArc(g, from, to, color) {
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
  g.lineStyle(7, color, 0.4).strokePoints(points, false);
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
  const boss = scene.enemies.find((e) => e.boss);
  const next = scene.bossTimes.find((t) => !scene.nodes.has(t));
  const warning = document.getElementById("boss-warning");
  warning.hidden =
    next === undefined || next - scene.runTime > BALANCE.bossWarning;
  if (!warning.hidden)
    warning.textContent = `${next === 540 ? "最终首领" : "街区首领"}将在 ${Math.max(0, Math.ceil(next - scene.runTime))} 秒后抵达`;
  const bossHud = document.getElementById("boss-hud");
  bossHud.hidden = !boss;
  if (boss) {
    bossHud.querySelector("strong").textContent = boss.final
      ? "终夜领主"
      : "街区暴君";
    bossHud.querySelector("i").style.width =
      `${Math.max(0, boss.hp / boss.maxHp) * 100}%`;
    bossHud.querySelector("span").textContent =
      `${Math.ceil(Math.max(0, boss.hp))} / ${boss.maxHp}`;
  }
  document
    .getElementById("game")
    .classList.toggle("low-health", scene.hp / scene.maxHp < 0.3);
  const bounce = moving ? Math.sin(scene.runTime * 17) : 0;
  scene.player.setScale(
    1 + Math.abs(bounce) * 0.035,
    1 - Math.abs(bounce) * 0.045,
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
