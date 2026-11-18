import {attachBrowserHud, preloadHud} from './browser-hud.js';
import { stages, stageWaves, loadLobby, saveLobby, renderLobby, rewardVictory } from "./lobby.js?v=stage-lock-1";
import { ImpactAudio } from "./impact-audio.js";
import { encounterAngle, updateSupply, updateBossRing } from "./encounters.js";
import {
  BALANCE,
  xpToNext,
  enemyStats,
  eliteStats,
  bossStats,
} from "./balance.js";
import { Build, upgradeDescription } from "./progression.js";
import { Combat } from "./combat.js";
import { CLASSES, classById, updateClassWeapon } from "./classes.js";
import { DamageNumbers } from "./damage-numbers.js";
import {
  artKeys,
  renderPanel,
  drawGround,
  combatFeedback,
  energyBurst,
  updatePresentation,
  updateWeaponPose,
  preloadBuffIcons,
  updateBuffIcons,
  drawStatusEffects,
  drawOrbit,
  drawArc,
} from "./presentation.js?v=stage-lock-1";
import Lt from "./vendor/phaser.js";
import { Defenses, advancePickupFlight } from "./defenses.js?v=stage-lock-1";
import { segmentCircleEntry } from "./geometry.js";
import { updateMount } from "./mounts.js";
import { Roll } from "./roll.js";
import { skills as Et, renderLoadout, castArt } from "./battle-skills.js";
(function () {
  const b = document.createElement("link").relList;
  if (b && b.supports && b.supports("modulepreload")) return;
  for (const Q of document.querySelectorAll('link[rel="modulepreload"]')) K(Q);
  new MutationObserver((Q) => {
    for (const Z of Q)
      if (Z.type === "childList")
        for (const p of Z.addedNodes)
          p.tagName === "LINK" && p.rel === "modulepreload" && K(p);
  }).observe(document, { childList: !0, subtree: !0 });
  function Y(Q) {
    const Z = {};
    return (
      Q.integrity && (Z.integrity = Q.integrity),
      Q.referrerPolicy && (Z.referrerPolicy = Q.referrerPolicy),
      Q.crossOrigin === "use-credentials"
        ? (Z.credentials = "include")
        : Q.crossOrigin === "anonymous"
          ? (Z.credentials = "omit")
          : (Z.credentials = "same-origin"),
      Z
    );
  }
  function K(Q) {
    if (Q.ep) return;
    Q.ep = !0;
    const Z = Y(Q);
    fetch(Q.href, Z);
  }
})();
const Tt = { x: 0, y: 0, enabled: !1 },
  Zt = document.getElementById("game"),
  St = document.createElement("div");
St.className = "joystick";
St.setAttribute("aria-label", "拖动摇杆移动");
St.innerHTML = '<span class="joystick-knob"></span>';
Zt.append(St);
const Jt = St.firstElementChild;
let Dt = null;
let towerTap = null;
function wt() {
  towerTap = null;
  St.hidden = true;
  ((Dt = null), (Tt.x = Tt.y = 0), (Jt.style.transform = "translate(0, 0)"));
}
function Qt(st) {
  if (st.pointerId !== Dt) return;
  if (towerTap && Math.hypot(st.clientX - towerTap.x, st.clientY - towerTap.y) >= 6) towerTap = null;
  const b = St.getBoundingClientRect(),
    Y = st.clientX - b.left - b.width / 2,
    K = st.clientY - b.top - b.height / 2,
    Q = b.width * 0.32,
    Z = Math.hypot(Y, K),
    p = Z > Q ? Q / Z : 1;
  ((Tt.x = Z < 6 ? 0 : (Y * p) / Q),
    (Tt.y = Z < 6 ? 0 : (K * p) / Q),
    (Jt.style.transform = `translate(${Y * p}px, ${K * p}px)`));
}
St.hidden = true;
Zt.addEventListener(
  "pointerdown",
  (event) => {
    const defenses = Ct.scene.getScenes(true)[0]?.defenses;
    const tower = event.button === 0 && event.target.tagName === "CANVAS"
      ? defenses?.towerAtPointer(event) : null;
    if (tower && Dt !== null) {
      defenses.selectTower(tower);
      return;
    }
    const bounds = Zt.getBoundingClientRect();
    if (
      !Tt.enabled ||
      Dt !== null ||
      event.button !== 0 ||
      event.target.closest("button,details,input,dialog")
    )
      return;
    event.preventDefault();
    Dt = event.pointerId;
    if (!tower && defenses?.selectedTower) defenses.selectTower(null);
    if (tower) towerTap = { tower, defenses, x: event.clientX, y: event.clientY };
    St.style.left = event.clientX - bounds.left + "px";
    St.style.top = event.clientY - bounds.top + "px";
    St.hidden = false;
    Zt.setPointerCapture(Dt);
    Qt(event);
  },
  true,
);
Zt.addEventListener("pointermove", Qt);
for (const type of ["pointerup", "pointercancel", "lostpointercapture"])
  Zt.addEventListener(type, (event) => {
    if (event.pointerId !== Dt) return;
    if (type === "pointerup" && towerTap &&
        Math.hypot(event.clientX - towerTap.x, event.clientY - towerTap.y) < 6 &&
        towerTap.defenses.towers.includes(towerTap.tower)) {
      towerTap.defenses.selectTower(towerTap.tower);
    }
    wt();
  });
window.addEventListener("blur", wt);
document.addEventListener("visibilitychange", wt);
window.addEventListener("resize", wt);
const Vt = document.createElement("div");
Vt.className = "orientation-hint";
Vt.textContent = "按住战场任意位置拖动即可移动";
Zt.append(Vt);
class ee {
  constructor() {
    ((this.volume = 0.35),
      (this.muted = !1),
      (this.active = !1),
      (this.last = new Map()),
      (this.voices = 0));
  }
  async unlock() {
    const b = window.AudioContext || window.webkitAudioContext;
    if (b)
      try {
        if (!this.ctx) {
          ((this.ctx = new b()),
            (this.master = this.ctx.createGain()),
            (this.limiter = this.ctx.createDynamicsCompressor?.() || this.ctx.createGain()),
            this.master.connect(this.limiter),
            this.limiter.connect(this.ctx.destination),
            (this.master.gain.value = this.muted ? 0 : this.volume),
            (this.noise = this.ctx.createBuffer(
              1,
              this.ctx.sampleRate * 4,
              this.ctx.sampleRate,
            )));
          const Y = this.noise.getChannelData(0);
          for (let K = 0; K < Y.length; K++) Y[K] = Math.random() * 2 - 1;
          this.impacts = new ImpactAudio(this.ctx, this.master);
          this.ambience();
        }
        if (this.ctx.state === "suspended" || this.ctx.state === "interrupted") await this.ctx.resume?.();
      } catch (error) {
        this.ctx?.close?.();
        this.ctx = this.master = this.impacts = this.ambientGain = null;
        console.warn("音频初始化失败", error);
      }
  }
  setVolume(b) {
    ((this.volume = Math.max(0, Math.min(1, b))), this.refresh());
  }
  refresh() {
    this.ctx &&
      this.master.gain.setTargetAtTime(
        this.muted || document.hidden ? 0 : this.volume,
        this.ctx.currentTime,
        0.04,
      );
  }
  setActive(b) {
    b !== this.active &&
      ((this.active = b),
      this.ambientGain &&
        this.ambientGain.gain.setTargetAtTime(
          b ? 1 : 0,
          this.ctx.currentTime,
          0.15,
        ));
  }
  ambience() {
    const b = this.ctx;
    ((this.ambientGain = b.createGain()),
      (this.ambientGain.gain.value = this.active ? 1 : 0),
      this.ambientGain.connect(this.master));
    const Y = 60 / 96,
      K = Y * 32,
      Q = b.sampleRate,
      Z = b.createBuffer(1, Math.ceil(K * Q), Q),
      p = Z.getChannelData(0),
      S = (c, h, r, n, e = !1) => {
        const s = 440 * 2 ** ((c - 69) / 12),
          a = Math.floor(r * Q),
          i = Math.floor(h * Q);
        for (let o = 0; o < a; o++) {
          const u = o / Q,
            d =
              Math.min(1, u / 0.025) *
              Math.min(1, (r - u) / 0.12) *
              Math.exp(-u * (e ? 3 : 1)),
            f =
              Math.sin(2 * Math.PI * s * u) +
              (e ? 0.22 : 0.1) * Math.sin(4 * Math.PI * s * u);
          p[(i + o) % p.length] += f * d * n;
        }
      },
      t = [
        [57, 60, 64],
        [53, 57, 60],
        [60, 64, 67],
        [55, 59, 62],
      ],
      l = [
        [76, 72, 71, 69, 72, 76, 79, 76],
        [72, 69, 65, 69, 72, 74, 72, 69],
        [76, 79, 76, 72, 74, 76, 72, 67],
        [74, 71, 67, 71, 74, 72, 71, 69],
      ];
    for (let c = 0; c < 8; c++) {
      const h = c * 4 * Y,
        r = t[c % 4];
      r.forEach((n) => S(n, h, 3.8 * Y, 0.025));
      for (let n = 0; n < 4; n++) S(r[0] - 24, h + n * Y, Y * 0.75, 0.07);
      l[c % 4].forEach((n, e) =>
        S(
          n + (c >= 4 && e === 7 ? 12 : 0),
          h + (e * Y) / 2,
          Y * 0.7,
          0.065,
          !0,
        ),
      );
    }
    ((this.music = b.createBufferSource()),
      (this.music.buffer = Z),
      (this.music.loop = !0),
      this.music.connect(this.ambientGain),
      this.music.start());
  }
  voice({
    frequency: b = 200,
    end: Y = 70,
    duration: K = 0.12,
    volume: Q = 0.15,
    type: Z = "triangle",
    noise: p = !1,
    cutoff: S = 1200,
    delay: t = 0,
  }) {
    if (
      !this.ctx ||
      (this.ctx.state && this.ctx.state !== "running") ||
      this.muted ||
      document.hidden ||
      this.voices >= 28
    )
      return;
    const l = this.ctx,
      c = l.currentTime + t,
      h = l.createGain(),
      r = p ? l.createBufferSource() : l.createOscillator(),
      n = l.createBiquadFilter();
    (p
      ? (r.buffer = this.noise)
      : ((r.type = Z),
        r.frequency.setValueAtTime(b, c),
        r.frequency.exponentialRampToValueAtTime(Y, c + K)),
      (n.type = "lowpass"),
      (n.frequency.value = S),
      h.gain.setValueAtTime(0, c),
      h.gain.linearRampToValueAtTime(Q, c + 0.008),
      h.gain.exponentialRampToValueAtTime(0.001, c + K),
      r.connect(n), n.connect(h), h.connect(this.master),
      this.voices++,
      (r.onended = () => {
        (r.disconnect(), n.disconnect(), h.disconnect(), this.voices--);
      }),
      r.start(c),
      r.stop(c + K + 0.02));
  }
  impact(element, periodic = false) {
    if (!this.muted && !document.hidden) this.impacts?.play(element, periodic);
  }
  play(b) {
    if (!this.ctx || this.muted || document.hidden) return;
    const Y = this.ctx.currentTime,
      K =
        { kill: 0.12, pickup: 0.1, chain: 0.12, aura: 0.25 }[b] ||
        0.04;
    if (Y - (this.last.get(b) ?? -1 / 0) < K) return;
    this.last.set(b, Y);
    const Q = (p, S, t, l = 0.14, c = "triangle", h = 0) =>
        this.voice({
          frequency: p,
          end: S,
          duration: t,
          volume: l,
          type: c,
          delay: h,
        }),
      Z = (p, S, t) =>
        this.voice({ noise: !0, duration: p, volume: S, cutoff: t });
    switch (b) {
      case "pea":
        (Z(0.065, 0.27, 2200), Q(160, 55, 0.09, 0.19));
        break;
      case "corn":
        (Z(0.19, 0.32, 1600), Q(110, 38, 0.2, 0.22));
        break;
      case "carrot":
        (Q(850, 140, 0.1, 0.12, "sawtooth"), Z(0.06, 0.12, 3e3));
        break;
      case "fire":
        Q(300, 900, 0.2, 0.11, "sine");
        break;
      case "shieldReturn":
        Q(710,1050,0.09,0.10,"sine");
        Q(1040,1420,0.12,0.08,"triangle",0.055);
        break;
      case "blade":
        Z(0.18, 0.22, 2800);
        break;
      case "lightning":
      case "chain":
        (Z(0.13, 0.15, 4200), Q(720, 95, 0.15, 0.09, "sawtooth"));
        break;
      case "explosion":
        (Z(0.28, 0.27, 650), Q(110, 30, 0.25, 0.2));
        break;
      case "kill":
        (Q(150, 42, 0.18, 0.23), Z(0.11, 0.18, 900));
        break;
      case "pickup":
        Q(1e3, 1500, 0.055, 0.035, "sine");
        break;
      case "aura":
        Q(240, 360, 0.25, 0.045, "sine");
        break;
      case "upgrade":
      case "select":
        [440, 554, 660].forEach((p, S) =>
          Q(p, p, 0.17, 0.09, "sine", S * 0.085),
        );
        break;
      case "win":
        [392, 494, 587, 784].forEach((p, S) =>
          Q(p, p, 0.3, 0.12, "sine", S * 0.14),
        );
        break;
      case "lose":
        Q(220, 45, 0.65, 0.15);
        break;
    }
  }
}
const pt = new ee();
document.addEventListener("pointerdown", () => pt.unlock());
document.addEventListener("keydown", () => pt.unlock());
document.addEventListener("visibilitychange", () => pt.refresh());
const Gt = 600;
function ie(st, b) {
  return { x: Math.floor(st / Gt), y: Math.floor(b / Gt) };
}
function se(st, b) {
  let Y = (Math.imul(st, 73856093) ^ Math.imul(b, 19349663) ^ 83492791) >>> 0;
  return () => (
    (Y = (Math.imul(Y, 1664525) + 1013904223) >>> 0),
    Y / 4294967296
  );
}
class ne {
  constructor(scene) {
    this.scene = scene;
    this.chunks = new Map();
    for (let y = 0; y * Gt < scene.defenses.height; y++)
      for (let x = 0; x * Gt < scene.defenses.width; x++)
        this.chunks.set(x + "," + y, { view: this.draw(x, y) });
  }
  draw(b, Y) {
    return drawGround(this.scene, b, Y, se(b, Y));
  }
  destroy() {
    for (const b of this.chunks.values()) b.view.destroy(!0);
    this.chunks.clear();
  }
}
const Nt = [],
  zt = [],
  Xt = [],
  Ht = xpToNext;
function ue(st) {
  return () => (
    (st = (Math.imul(st, 1664525) + 1013904223) >>> 0),
    st / 4294967296
  );
}
const fe = Build;
const ce = Combat;
const pe = {
    fire: {
      name: "秘能爆破杖",
      desc: "魔法 · 火球命中爆炸，90 范围内造成 160% 伤害",
      kind: "magic",
      count: 1,
      cooldown: 2.3,
      speed: 340,
      life: 2,
      damage: 1.6,
      pierce: 1,
      color: 13736698,
      scale: 1.8,
    },
    blade: {
      name: "清道夫砍刀",
      desc: "近战 · 前方 140° 挥砍，范围 115，220% 伤害并击退",
      kind: "melee",
      cooldown: 1.8,
      range: 115,
      damage: 2.2,
      color: 10869191,
    },
    lightning: {
      name: "特斯拉电链",
      desc: "电链 · 300 范围起跳，最多连锁 5 敌，每跳衰减 18%",
      kind: "chain",
      cooldown: 2.5,
      range: 300,
      damage: 1.4,
      color: 8505589,
    },
    pea: {
      name: "制式冲锋枪",
      desc: "稳定单发 · 快速射击，适合灵活走位",
      count: 1,
      cooldown: 1,
      speed: 520,
      life: 1.7,
      damage: 1,
      pierce: 1,
      color: 16777215,
      scale: 1,
    },
    corn: {
      name: "街头霰弹枪",
      desc: "五发扇形散射 · 每颗 55% 伤害，擅长近身清群",
      count: 5,
      cooldown: 2.1,
      speed: 430,
      life: 0.65,
      damage: 0.55,
      pierce: 1,
      color: 16766065,
      scale: 1.2,
    },
    carrot: {
      name: "重型穿甲弩",
      desc: "高伤直线穿透 · 180% 伤害，最多命中 4 个目标",
      count: 1,
      cooldown: 1.9,
      speed: 680,
      life: 1.5,
      damage: 1.8,
      pierce: 4,
      color: 16752718,
      scale: 2.3,
    },
  },
  me = { aura: "秘能法圈", chain: "连锁闪电", orbit: "守护旋转球" },
  yt = (st) => document.getElementById(st);
class ge extends Lt.Scene {
  constructor() {
    super("garden");
  }
  preload() {
    if (typeof wx === "undefined") preloadHud(this);
    preloadBuffIcons(this);
    for (const key of artKeys) this.load.svg(key, `./assets/${key}.svg`);
  }
  create() {
    this.profile = loadLobby();
    this.stageName = stages[this.profile.stage][0];
    this.waves = stageWaves(this.profile.stage);
    this.job = null;
    this.weaponClock = 0;
    this.classTurrets = [];
    this.constellation = null;
    this.damageNumbers = new DamageNumbers(this);
    this.events.once("shutdown", () => {
      this.panel?.destroy();
      this.damageNumbers?.destroy();
    });
    document.querySelector(".settings").removeAttribute("open");
    document.getElementById("timer").textContent = "00:00";
    document.getElementById("boss-warning").hidden = true;
    document.getElementById("game").classList.remove("low-health");
    (pt.setActive(!1),
      wt(),
      (yt("sound").onclick = () => {
        ((pt.muted = !pt.muted),
          pt.refresh(),
          (yt("sound").textContent = pt.muted ? "声音：关" : "声音：开"),
          yt("sound").setAttribute("aria-pressed", String(pt.muted)));
      }),
      (yt("volume").oninput = (b) =>
        pt.setVolume(Number(b.target.value) / 100)),
      (this.hitStopUntil = 0),
      (this.healthyTexture = null),
      (this.lastHitStop = -1000),
      (this.lastAttackShake = -Infinity),
      (this.build = new fe()),
      (this.combat = new ce(this, (name) => pt.play(name))),
      (this.runTime = 0),
      (this.mount = null),
      (this.buffIcons = this.add.container().setDepth(11)),
      (this.accumulator = 0),
      (this.waveSpawned = 0),
      (this.waveBreakUntil = 0),
      (this.encounterBatch = 0),
      (this.encounterHeading = this.build.random()*Math.PI*2),
      (this.supply = null),
      (this.supplyClaimed = false),
      (this.bountySpawned = false),
      (this.hostile = []),
      (this.hp = 100),
      (this.maxHp = 100),
      (this.damage = 18),
      (this.speed = 210),
      (this.level = 1),
      (this.xp = 0),
      (this.need = Ht(1)),
      (this.kills = 0),
      (this.wave = 1),
      (this.elapsed = 0),
      (this.spawnClock = 0),
      (this.nextEliteAt = BALANCE.elites.first),
      (this.fireClock = 0),
      (this.invincible = 0),
      (this.mode = "ready"),
      (this.enemies = []),
      (this.bullets = []),
      (this.gems = []),
      (this.rate = 390),
      (this.weapon = "pea"),
      (this.traits = { crit: 0, armor: 0, magnet: 0, regen: 0 }),
      (this.regenClock = 0),
      (this.effects = []),
      (this.nextFinisherArt = 0),
      (this.recoil = 0),
      (this.skills = { aura: 0, chain: 0, orbit: 0 }),
      (this.skillTime = 0),
      (this.auraClock = 0),
      (this.chainClock = 0),
      (this.orbitHits = new WeakMap()),
      (this.weaponLocked = !1),
      (this.upgradeLevels = {}),
      (this.skillGraphics = this.add.graphics().setDepth(3)),
      (this.statusGraphics = this.add.graphics().setDepth(5.5)),
      (this.enemyTelegraphs = this.add.graphics().setDepth(6)),
      this.events.once("shutdown", () =>
        this.input.keyboard.removeAllListeners("keydown-SPACE"),
      ),
      this.drawTextures(),
      this.cameras.main.setBackgroundColor("#b9ad91"),
      (this.player = this.add.image(450, 310, "potato").setScale(BALANCE.player.visualScale).setDepth(5)),
      (this.gun = this.add.image(472, 315, "gun").setScale(BALANCE.player.visualScale).setDepth(6)),
      (this.ring = this.add
        .circle(450, 310, 28 * BALANCE.player.visualScale)
        .setStrokeStyle(2, 0xffe7a0, 0.65)),
      (this.defenses = new Defenses(this)),
      this.player.setPosition(
        this.defenses.width / 2,
        this.defenses.height / 2,
      ),
      (this.world = new ne(this)),
      (this.cleanupClock = 0),
      this.cameras.main.startFollow(this.player, !0, 1, 1),
      this.events.once("shutdown", () => this.world.destroy()),
      (this.keys = this.input.keyboard.addKeys(
        "W,A,S,D,UP,DOWN,LEFT,RIGHT,SPACE",
      )),
      this.input.keyboard.on("keydown-SPACE", (event) => {
        if (!event.target.closest("button,input,summary")) this.pauseGame();
      }),
      this.input.keyboard.addCapture(["UP", "DOWN", "LEFT", "RIGHT"]),
      (this.roll = new Roll(this)),
      (this.timerText = this.add
        .text(450, 26, "00:30", {
          fontFamily: "sans-serif",
          fontSize: "22px",
          fontStyle: "bold",
          color: "#727d55",
        })
        .setOrigin(0.5)
        .setDepth(8)
        .setScrollFactor(0)),
      (this.hint = this.add
        .text(450, 586, "守卫街区 · 自由探索 · 等待救援", {
          fontFamily: "sans-serif",
          fontSize: "12px",
          color: "#40564c",
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(8)),
      (yt("pause").onclick = () => this.pauseGame()),
      (yt("restart").onclick = () => this.scene.restart()),
      this.timerText.setVisible(false),
      this.hint.setVisible(false),
      this.sync(),
      this.openLobby("关卡", this.victoryMessage));
    this.victoryMessage = "";
  }
  openLobby(tab, message) {
    this.closePanel();
    Tt.enabled = false;
    document.getElementById("game").classList.add("has-panel");
    renderLobby(this,tab,message);
  }
  drawTextures() {}
  get movementSpeed() {
    return Math.round(this.speed * (1 + (this.mount?.type.speed || 0)));
  }
  sync() {
    if (this.build) {
      renderLoadout(yt("skills"), this.build.active);
      for (const [b, Y] of Object.entries({
        health: `${Math.ceil(this.hp)} / ${this.maxHp}`,
        level: this.level,
        damage: `${Math.round((this.build.power - 1) * 100)}%`,
        speed: this.movementSpeed,
        kills: this.kills,
        "xp-label": `${Math.floor(this.xp)} / ${this.need}`,
      }))
        yt(b).textContent = Y;
      ((yt("hp").style.width = `${(this.hp / this.maxHp) * 100}%`),
        (yt("xp").style.width =
          `${Math.min(100, (this.xp / this.need) * 100)}%`));
    }
  }
  closePanel() {
    this.defenses?.selectTower(null);
    (wt(),
      (Tt.enabled = !0),
      document.getElementById("game").classList.remove("has-panel"),
      this.panel && this.panel.destroy(!0),
      (this.panel = null));
    document.getElementById("game").focus({ preventScroll: true });
  }
  showPanel(title, detail, choices) {
    this.closePanel();
    Tt.enabled = false;
    document.getElementById("game").classList.add("has-panel");
    renderPanel(this, title, detail, choices);
  }
  showUpgradeCards(title, detail, choices) {
    this.closePanel();
    Tt.enabled = false;
    document.getElementById("game").classList.add("has-panel");
    renderPanel(this, title, detail, choices, true);
  }
  pauseGame() {
    (this.mode === "play"
      ? ((this.mode = "pause"),
        this.showPanel("歇一小会儿", "暂时安全，整装再出发。", [
          {
            title: "继续行动 →",
            detail: "空格键也可以继续",
            action: () => this.pauseGame(),
          },
        ]))
      : this.mode === "pause" && ((this.mode = "play"), this.closePanel()),
      this.sync());
  }
  chooseClass() {
    this.showUpgradeCards(
      "选择职业",
      stages[this.profile.stage][0] + " · 点选职业出发",
      CLASSES.map((job) => ({
        id: job.icon,
        title: job.name,
        job,
        levelText: job.weapon,
        detail: `${job.strengths}\n生命 ${job.hp + 8*(this.profile.stats.hp || 0)} · 护甲 ${job.armor + 2*(this.profile.stats.armor || 0)}`,
        action: () => this.selectClass(job.id),
      })),
    );
    const back = document.createElement("button");
    back.textContent = "返回关卡";
    back.onclick = () => this.openLobby("关卡");
    this.panel.element.querySelector(".menu-heading").append(back);
  }
  selectClass(id) {
    const job = classById(id);
    if (!job || this.mode !== "ready") return;
    this.job = job;
    this.build.profile = this.profile;
    this.maxHp = this.hp = job.hp + 8*(this.profile.stats.hp || 0);
    this.speed = job.speed;
    this.build.job = job;
    this.player.setTexture(`hero-${id}`);
    this.gun.setTexture(job.texture);
    updateWeaponPose(this);
    document.getElementById("job-name").textContent = job.name;
    this.defenses.stock = job.materials ?? BALANCE.initialMaterials;
    this.defenses.refresh();
    this.mode = "play";
    this.closePanel();
    this.sync();
  }
  effect(b, Y, K = 0, Q = 0, Z = 0, p = 0, delay = 0) {
    if (delay > 0) b.setVisible(false);
    (this.effects.length >= 220 && this.effects.shift().sprite.destroy(),
      this.effects.push({
        sprite: b,
        delay,
        life: Y,
        total: Y,
        vx: K,
        vy: Q,
        grow: Z,
        spin: p,
        alpha: b.alpha,
      }));
  }
  burst(b, Y, K, Q = 6, Z = 65) {
    for (let p = 0; p < Q; p++) {
      const S = (Math.PI * 2 * p) / Q + this.build.random() * 0.5,
        t = Z * (0.5 + this.build.random() * 0.5),
        l = this.add
          .ellipse(b, Y, 3 + this.build.random() * 5, 3, K)
          .setDepth(8)
          .setRotation(S);
      this.effect(
        l,
        0.18 + this.build.random() * 0.2,
        Math.cos(S) * t,
        Math.sin(S) * t,
        0,
        5,
      );
    }
  }
  muzzle(b, Y) {
    const K = this.gun.x + Math.cos(b) * 19 * this.gun.scaleX,
      Q = this.gun.y + Math.sin(b) * 19 * this.gun.scaleY,
      Z = this.add
        .star(K, Q, 5, 4, this.weapon === "corn" ? 18 : 12, 16773808)
        .setRotation(b)
        .setDepth(8);
    this.effect(Z, 0.1, 0, 0, 1.8);
    const p = this.add.circle(K, Q, 7, Y.color, 0.3).setDepth(6);
    (this.effect(p, 0.22, Math.cos(b) * 30, Math.sin(b) * 30, 3),
      (this.recoil = this.weapon === "corn" ? 9 : 5));
  }
  impact(b, Y, K, Q, Z) {
    combatFeedback(this, b, Y, K, Q, Z);
    const p = this.add
      .circle(b, Y, Z ? 13 : 6)
      .setStrokeStyle(Q ? 3 : 2, Q ? 15117125 : K, 0.85)
      .setDepth(8);
    (this.effect(p, Z ? 0.32 : 0.18, 0, 0, Z ? 3 : 2),
      this.burst(b, Y, Q ? 15117125 : K, Q ? 9 : 5, Q ? 110 : 65),
      Z && this.burst(b, Y, 7834499, 9, 105));
  }
  updateEffects(b) {
    for (let Y = this.effects.length - 1; Y >= 0; Y--) {
      const K = this.effects[Y];
      if (K.delay > 0) {
        K.delay -= b;
        if (K.delay > 0) continue;
        K.sprite.setVisible(true);
      }
      if (((K.life -= b), K.life <= 0)) {
        (K.sprite.destroy(), this.effects.splice(Y, 1));
        continue;
      }
      ((K.sprite.x += K.vx * b),
        (K.sprite.y += K.vy * b),
        (K.sprite.rotation += K.spin * b),
        K.sprite.setAlpha((K.alpha * K.life) / K.total),
        K.grow && K.sprite.setScale(1 + K.grow * (1 - K.life / K.total)));
    }
  }
  flashTexture(sprite, key, suffix, color) {
    const red = key + suffix;
    if (!this.textures.exists(red)) {
      const source = this.textures.get(key).getSourceImage();
      const tex = this.textures.createCanvas(red, source.width, source.height);
      const ctx = tex.getContext();
      ctx.drawImage(source, 0, 0);
      ctx.globalCompositeOperation = "source-atop";
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, source.width, source.height);
      tex.refresh();
    }
    sprite.setTexture(red);
  }
  flashEnemy(enemy) {
    const key = (enemy.normalTexture ??= enemy.s.texture.key);
    this.flashTexture(enemy.s, key, "-hit", "rgba(255,238,191,.5)");
    enemy.flashUntil = this.combat.time + 0.1;
  }
  playerHurt() {
    this.healthyTexture = this.healthyTexture || this.player.texture.key;
    this.flashTexture(this.player, this.healthyTexture, "-hurt", "rgba(255,35,40,.78)");
    this.player.setAlpha(1);
    this.hurtUntil = this.combat.time + .18;
    pt.impact("hurt");
    this.hitStop(145, true);
  }
  hitStop(duration, priority = false) {
    const now = performance.now();
    if (now < this.hitStopUntil) {
      this.hitStopUntil = Math.max(this.hitStopUntil, this.lastHitStop + duration);
    } else if (priority || now - this.lastHitStop > 360) {
      this.lastHitStop = now;
      this.hitStopUntil = now + duration;
      this.accumulator = 0;
    }
  }
  hit(enemy, amount, color = 0xdad0af, meta = {}) {
    if (!enemy.s.active || amount <= 0) return 0;
    const crit = !meta.dot && this.build.random() < this.build.critChance + (this.mount?.type.crit || 0);
    const actual = Math.min(enemy.hp, amount * (crit ? 1.5 : 1));
    enemy.hp = Math.max(0, enemy.hp - actual);
    this.damageNumbers.add(enemy, actual, { ...meta, crit });
    if (actual > 0) pt.impact(meta.element, meta.dot);
    if (!meta.dot) {
      if (!enemy.boss && !enemy.ranged) enemy.contactBlockedUntil = this.combat.time + 0.2;
      // One restrained kick per burst; damage-over-time never shakes the view.
      const now = performance.now();
      if (
        this.mode === "play" &&
        now - (this.lastAttackShake ?? -Infinity) >= 160
      ) {
        this.lastAttackShake = now;
        this.cameras.main.shake(
          crit || enemy.hp <= 0 ? 75 : 55,
          crit || enemy.hp <= 0 ? 0.0015 : 0.0009,
          false,
        );
      }
      this.hitStop(crit || enemy.hp <= 0 ? 110 : 80);
      this.impact(enemy.s.x, enemy.s.y, color, crit, enemy.hp <= 0);
      if (this.level >= 6 && (crit || enemy.hp <= 0) &&
          this.runTime >= (this.nextFinisherArt ?? 0)) {
        this.nextFinisherArt = this.runTime + .14;
        energyBurst(this, enemy.s.x, enemy.s.y, color, this.level >= 13 ? 46 : 31, this.level >= 13 ? 12 : 8);
        const shards = this.add.graphics({ x: enemy.s.x, y: enemy.s.y }).setDepth(7);
        const count = this.level >= 13 ? 8 : 4;
        for (let i = 0; i < count; i++) {
          const angle = this.runTime + i * Math.PI * 2 / count;
          const dx = Math.cos(angle), dy = Math.sin(angle);
          const tip = i % 2 ? 23 : 36;
          shards.fillStyle(i % 2 ? 0xfff2be : color, .92)
            .fillTriangle(12*dx-3*dy, 12*dy+3*dx, tip*dx, tip*dy, 12*dx+3*dy, 12*dy-3*dx);
          if (count === 8) shards.lineStyle(2,color,.8).beginPath().arc(0,0,28,angle,angle+.48).strokePath();
        }
        this.effect(shards, .32, 0, 0, .95, 1.4);
      }
      this.flashEnemy(enemy);
    }
    if (enemy.hp <= 0) {
      if (enemy.bounty) enemy.materials += 3;
      this.defenses.drop(enemy);
      pt.play("kill");
      const gem = this.add.image(enemy.s.x, enemy.s.y, "gem").setDepth(2);
      gem.xp = enemy.xp ?? 3;
      this.gems.push(gem);
      enemy.s.destroy();
      const index = this.enemies.indexOf(enemy);
      if (index >= 0) this.enemies.splice(index, 1);
      this.kills++;
      if (enemy.boss) this.hp = Math.min(this.maxHp, this.hp + 10);

      this.sync();
    }
    return actual;
  }
  shieldReturnFeedback(enemy) {
    const {x,y} = enemy.s;
    const cut = this.add.graphics({x,y}).setDepth(9)
      .lineStyle(7,0xeaac3b).lineBetween(-17,12,17,-12)
      .lineStyle(2,0xfff5ba).lineBetween(-19,14,19,-14);
    this.effect(cut,0.3,0,-12,0.5);
    pt.play("shieldReturn");
  }
  distance(b, Y) {
    return Math.hypot(b.x - Y.x, b.y - Y.y);
  }
  explode(b, Y, K, Q, radius = 68) {
    this.combat.cancelArea(b,Y,radius);
    pt.play("explosion");
    const Z = this.add
      .circle(b, Y, radius, Q, 0.18)
      .setStrokeStyle(3, Q, 0.8)
      .setDepth(7);
    (this.effect(Z, 0.3), this.burst(b, Y, Q, 16, 180));
    for (const p of [...this.enemies])
      this.distance({ x: b, y: Y }, p.s) <= radius + p.r &&
        this.combat.damage(p, K, "fire");
  }
  melee(b, Y) {
    const K = this.add
      .graphics({ x: this.player.x, y: this.player.y })
      .setDepth(8);
    (K.lineStyle(18, Y.color, 0.55),
      K.beginPath(),
      K.arc(0, 0, 94, b - 1.22, b + 1.22),
      K.strokePath(),
      K.lineStyle(3, 16383977, 0.95),
      K.beginPath(),
      K.arc(0, 0, 105, b - 1.22, b + 1.22),
      K.strokePath(),
      this.effect(K, 0.23));
    for (const Q of [...this.enemies]) {
      const Z = Q.s.x - this.player.x,
        p = Q.s.y - this.player.y,
        S = Math.hypot(Z, p),
        t = Math.atan2(p, Z) - b;
      S <= Y.range + Q.r &&
        Math.abs(Math.atan2(Math.sin(t), Math.cos(t))) <= 1.22 &&
        (this.hit(Q, this.damage * Y.damage, Y.color),
        Q.s.active &&
          S &&
          this.defenses.move(Q.s, (Z / S) * 28, (p / S) * 28, Q.r));
    }
  }
  chain(b) {
    pt.play("chain");
    let Y = { x: this.player.x, y: this.player.y };
    const K = new Set();
    for (let Q = 0; Q < (b.links || 5); Q++) {
      let Z = null,
        p = Q ? 160 : b.range;
      for (const c of this.enemies) {
        const h = this.distance(Y, c.s);
        !K.has(c) && h <= p && ((p = h), (Z = c));
      }
      if (!Z) break;
      const S = { x: Z.s.x, y: Z.s.y };
      K.add(Z);
      const t = this.add.graphics().setDepth(9),
        l = [Y];
      for (let c = 1; c < 6; c++)
        l.push({
          x: Y.x + ((S.x - Y.x) * c) / 6 + (this.build.random() - 0.5) * 20,
          y: Y.y + ((S.y - Y.y) * c) / 6 + (this.build.random() - 0.5) * 20,
        });
      l.push(S);
      for (const [c, h] of [
        [7, b.color],
        [2, 16121087],
      ]) {
        (t.lineStyle(c, h, 0.9), t.beginPath(), t.moveTo(l[0].x, l[0].y));
        for (const r of l.slice(1)) t.lineTo(r.x, r.y);
        t.strokePath();
      }
      (this.effect(t, 0.22),
        this.hit(
          Z,
          (b.flatDamage ?? this.damage * b.damage) * 0.82 ** Q,
          b.color,
        ),
        (Y = S));
    }
  }
  shoot(b) {
    pt.play(this.weapon);
    const Y = pe[this.weapon];
    if (
      ((this.fireClock = (this.rate / 1e3) * Y.cooldown), Y.kind === "melee")
    ) {
      this.melee(b, Y);
      return;
    }
    if (Y.kind === "chain") {
      this.chain(Y);
      return;
    }
    this.muzzle(b, Y);
    for (let K = 0; K < Y.count; K++) {
      const Q = b + (K - (Y.count - 1) / 2) * 0.18;
      let Z = this.add
        .image(this.player.x, this.player.y, Y.kind === "magic" ? "orb" : "pea")
        .setDepth(7)
        .setTint(Y.color)
        .setScale(Y.scale, 1);
      ((Z.rotation = Q),
        this.bullets.push({
          s: Z,
          vx: Math.cos(Q) * Y.speed,
          vy: Math.sin(Q) * Y.speed,
          life: Y.life,
          damage: this.damage * Y.damage,
          pierce: Y.pierce,
          color: Y.color === 16777215 ? 9941859 : Y.color,
          trail: 0,
          explosive: Y.kind === "magic",
          hit: new Set(),
        }));
    }
  }
  skillStats(b, Y) {
    return b === "aura"
      ? { radius: 65 + Y * 15, damage: 8 + Y * 7 }
      : b === "chain"
        ? { links: 2 + Y, damage: 12 + Y * 9 }
        : { count: Y, damage: 12 + Y * 8 };
  }
  skillDescription(b, Y) {
    const K = this.skillStats(b, Y);
    return b === "aura"
      ? `半径 ${K.radius} / 伤害 ${K.damage}`
      : b === "chain"
        ? `连锁 ${K.links} 敌 / 伤害 ${K.damage}`
        : `${K.count} 颗球 / 伤害 ${K.damage}`;
  }
  chooseSkill() {
    this.showUpgradeCards(
      "选择生存技能",
      "独立自动攻击 · 三种技能可同时叠加",
      Object.entries(me).map(([b, Y]) => {
        const K = this.skills[b],
          Q = this.skillStats(b, K),
          Z = this.skillStats(b, K + 1),
          p = (t) => (K ? `${Q[t]} → ${Z[t]}` : `${Z[t]}`),
          S =
            b === "aura"
              ? `法圈半径：${p("radius")}
伤害：${p("damage")}`
              : b === "chain"
                ? `连锁目标：${p("links")}
初始伤害：${p("damage")}`
                : `旋转球数量：${p("count")}
伤害：${p("damage")}`;
        return {
          title: Y,
          icon: b,
          category: "自动战术技能",
          levelText: K ? `Lv.${K} → Lv.${K + 1}` : "Lv.1",
          tag: K ? "技能进阶" : "解锁技能",
          description: {
            aura: "环绕自身的法圈，持续灼烧附近丧尸。",
            chain: "闪电在敌人之间跳跃，逐个击穿尸群。",
            orbit: "能量球环绕自身旋转，击伤接触的丧尸。",
          }[b],
          stats: S,
          action: () => {
            (pt.play("select"),
              this.skills[b]++,
              this.closePanel(),
              (this.mode = "play"),
              this.sync());
          },
        };
      }),
    );
  }
  updateSkills(b) {
    ((this.skillTime += b), (this.auraClock -= b), (this.chainClock -= b));
    const Y = this.skillGraphics;
    Y.clear();
    const { x: K, y: Q } = this.player;
    if (this.skills.aura) {
      const Z = this.skillStats("aura", this.skills.aura);
      (Y.fillStyle(12164582, 0.1),
        Y.fillCircle(K, Q, Z.radius),
        Y.lineStyle(2, 12886503, 0.7),
        Y.strokeCircle(K, Q, Z.radius),
        Y.lineStyle(1, 16114943, 0.5),
        Y.strokeCircle(K, Q, Z.radius - 7));
      for (let p = 0; p < 8; p++) {
        const S = this.skillTime * 0.4 + (p * Math.PI) / 4;
        (Y.fillStyle(15783679, 0.8),
          Y.fillCircle(
            K + Math.cos(S) * Z.radius,
            Q + Math.sin(S) * Z.radius,
            3,
          ));
      }
      if (this.auraClock <= 0) {
        (pt.play("aura"), (this.auraClock = 0.65));
        for (const p of [...this.enemies])
          this.distance(this.player, p.s) <= Z.radius + p.r &&
            this.hit(p, Z.damage, 12886503);
      }
    }
    if (this.skills.chain && this.chainClock <= 0 && this.enemies.length) {
      const Z = this.skillStats("chain", this.skills.chain);
      ((this.chainClock = 1.8),
        this.chain({
          range: 300,
          links: Z.links,
          flatDamage: Z.damage,
          color: 8505589,
        }));
    }
    if (this.skills.orbit) {
      const Z = this.skillStats("orbit", this.skills.orbit),
        p = 88;
      (Y.lineStyle(1, 15977848, 0.25), Y.strokeCircle(K, Q, p));
      for (let S = 0; S < Z.count; S++) {
        const t = this.skillTime * 1.8 + (S * Math.PI * 2) / Z.count,
          l = K + Math.cos(t) * p,
          c = Q + Math.sin(t) * p;
        (Y.lineStyle(5, 15977848, 0.35),
          Y.beginPath(),
          Y.arc(K, Q, p, t - 0.28, t),
          Y.strokePath(),
          Y.fillStyle(15977848, 0.25),
          Y.fillCircle(l, c, 14),
          Y.fillStyle(15977848, 1),
          Y.fillCircle(l, c, 9),
          Y.fillStyle(16774876, 1),
          Y.fillCircle(l - 2, c - 2, 4));
        for (const h of [...this.enemies])
          this.distance({ x: l, y: c }, h.s) <= h.r + 10 &&
            (this.orbitHits.get(h) ?? -1 / 0) <= this.skillTime &&
            (this.orbitHits.set(h, this.skillTime + 0.3),
            this.hit(h, Z.damage, 15977848));
      }
    }
  }
  upgrade() {
    if (this.mode !== "play" || this.xp < this.need) return;
    pt.play("upgrade");
    let choices;
    do {
      this.level++;
      this.build.heroLevel = this.level;
      this.xp -= this.need;
      this.need = Ht(this.level);
      choices = this.build.options(this.level);
    } while (!choices.length && this.xp >= this.need);
    if (!choices.length) {
      this.sync();
      return;
    }
    this.mode = "upgrade";
    this.showUpgradeCards(
      `Lv.${this.level} · 选择升级`,
      `技能 ${this.build.active.length}/4 · 伤害 +${Math.round((this.build.power - 1) * 100)}% · 护甲 ${this.build.armor}`,
      choices.map((choice) => ({
        id: choice.kind === "attribute" && choice.id !== "weaponMastery" ? "heal_supply" : choice.id,
        element: choice.element,
        title: choice.name,
        levelText:
          choice.kind === "skill"
            ? choice.previous
              ? `Lv.${choice.previous} → ${choice.level}`
              : "获得新技能"
            : choice.kind === "attribute"
              ? `属性 ${choice.level}/${choice.max}`
              : "战地补给",
        detail: upgradeDescription(choice, this.build),
        action: () => {
          if (!this.build.apply(choice, this)) return;
          if (choice.id === "arc" && choice.level === 5) {
            this.chooseArcEvolution();
            return;
          }
          this.closePanel();
          this.mode = "play";
          this.sync();
          // Boss XP can cross multiple thresholds; resolve every earned choice.
          if (this.xp >= this.need) this.upgrade();
        },
      })),
    );
    this.sync();
  }
  chooseArcEvolution() {
    const arc = this.build.active.find(skill => skill.id === "arc");
    this.showUpgradeCards("闪电链 · 选择进化", "本局永久生效", [
      ["spread","扩散","击杀时从落点向附近另两名敌人放出电弧，各造成基础伤害的 60%。"],
      ["return","回流","无新目标可跳跃时，对最后一个存活目标追加一次基础伤害的 85%。"],
    ].map(([branch,name,detail]) => ({
      id:"arc", title:name, levelText:"满级进化", detail,
      action: () => {
        arc.branch = branch;
        this.closePanel();
        this.mode = "play";
        this.sync();
        if (this.xp >= this.need) this.upgrade();
      },
    })));
  }
  spawnBoss(time) {
    const index = BALANCE.bosses.indexOf(time);
    if (index < 0) return;
    const stat = bossStats(index),
      angle = this.build.random() * Math.PI * 2;
    const pos = this.defenses.spawn(
      410 * Math.cos(angle),
      410 * Math.sin(angle),
      stat.r,
    );
    if (!pos) {
      return;
    }
    const sprite = this.add
      .image(pos.x, pos.y, "brute")
      .setDepth(5)
      .setScale(stat.final ? 3 : 2.15)
      .setTint(stat.final ? 0xe7bbad : 0xd6c293);
    const hp = Math.round(stat.hp * (1 + this.profile.stage*.08));
    this.enemies.push({ ...stat, hp, maxHp:hp, s: sprite });
    return true;
  }
  beginDefeat() {
    if (this.mode !== "play") return;
    this.mode = "dying";
    drawStatusEffects(this);
    this.deathElapsed = 0;
    this.deathStartAngle = this.player.rotation;
    energyBurst(this, this.player.x, this.player.y, 0xf05241, 43, 10);
    this.gun.setVisible(false);
    pt.setActive(false);
  }
  updateDefeat(delta) {
    this.deathElapsed += Math.min(delta, 50) / 1000;
    this.updateEffects(Math.min(delta, 50) / 1000);
    if (this.deathElapsed < .18) return;
    if (this.healthyTexture) {
      this.player.setTexture(this.healthyTexture);
      this.healthyTexture = null;
    }
    const progress = Math.min(1, (this.deathElapsed - .18) / .32);
    this.player.setRotation(this.deathStartAngle + progress * progress * 1.35);
    if (this.deathElapsed >= .62) this.finish(false);
  }
  finish(b) {
    if (this.mode === "end") return;
    if (b) {
      this.mode = "end";
      pt.play("win");
      this.victoryMessage = rewardVictory(this.profile,this.profile.stage);
      saveLobby(this.profile);
      this.scene.restart();
      return;
    }
    (pt.play(b ? "win" : "lose"),
      (this.mode = "end"),
      this.showPanel(
        b ? "十波防守成功，街区夺回！" : "你倒在了黎明之前",
        `第 ${this.wave}/10 波 · 用时 ${Math.floor(this.runTime)} 秒 · 击败 ${this.kills} 只丧尸 · 等级 ${this.level}`,
        [
          {
            title: "返回关卡大厅",
            detail: "重新开始行动",
            action: () => this.scene.restart(),
          },
        ],
      ));
  }
  update(b, Y) {
    if (performance.now() < this.hitStopUntil) return;
    if (this.mode === "dying") return this.updateDefeat(Y);
    if ((pt.setActive(this.mode === "play"), this.mode === "play"))
      for (
        this.accumulator += Math.min(Y, 100) / 1e3;
        this.accumulator >= 1 / 30 && this.mode === "play";
      )
        ((this.accumulator -= 1 / 30), this.step(this.runTime * 1e3, 1e3 / 30));
  }
  movementInput() {
    if (Tt.x || Tt.y) return { x: Tt.x, y: Tt.y };
    return {
      x:
        Number(this.keys.D.isDown || this.keys.RIGHT.isDown) -
        Number(this.keys.A.isDown || this.keys.LEFT.isDown),
      y:
        Number(this.keys.S.isDown || this.keys.DOWN.isDown) -
        Number(this.keys.W.isDown || this.keys.UP.isDown),
    };
  }
  step(b, Y) {
    if ((pt.setActive(this.mode === "play"), this.mode !== "play")) return;
    let K = Math.min(Y, 50) / 1e3;
    if (this.healthyTexture && this.combat.time >= this.hurtUntil) {
      this.player.setTexture(this.healthyTexture);
      this.healthyTexture = null;
    }
    (this.updateEffects(K),
      this.damageNumbers.update(K),
      (this.recoil = Math.max(0, this.recoil - K * 60)),
      (this.regenClock += K),
      this.regenClock >= 1 &&
        ((this.regenClock = 0),
        (this.hp = Math.min(this.maxHp, this.hp + this.build.regen + (this.mount?.type.regen || 0))),
        this.sync()),
      (this.runTime += K),
      (this.elapsed = this.runTime),
      (this.spawnClock -= K),
      (this.fireClock -= K),
      (this.invincible -= K),
      this.timerText.setText(
        `${Math.floor(this.runTime / 60)
          .toString()
          .padStart(2, "0")}:${Math.floor(this.runTime % 60)
          .toString()
          .padStart(2, "0")}`,
      ));
    let encounter = this.waves[this.wave - 1];
    if (this.waveSpawned === encounter.total && this.enemies.length === 0) {
      if (this.wave === this.waves.length) {
        this.finish(true);
        return;
      }
      if (!this.waveBreakUntil) {
        this.waveBreakUntil = this.runTime + 4;
        for (const shot of this.hostile) shot.s.destroy();
        this.hostile.length = 0;
      }
      if (this.runTime >= this.waveBreakUntil) {
        this.wave++;
        encounter = this.waves[this.wave - 1];
        this.waveSpawned = this.encounterBatch = this.spawnClock = this.waveBreakUntil = 0;
        this.encounterHeading = this.build.random()*Math.PI*2;
      }
    }
    const input = this.movementInput();
    const S = Math.hypot(input.x, input.y);
    const rolling = this.roll.step(K, input);
    if (!rolling) {
      if (S)
        this.defenses.move(
          this.player,
          (input.x / S) * this.movementSpeed * K,
          (input.y / S) * this.movementSpeed * K,
          25,
        );
      this.player.rotation = S ? Math.sin(b * 0.018) * 0.08 : 0;
    }
    updateSupply(this,K);
    if (
      (this.defenses.confine(this.player, 25),
      this.player.setAlpha(this.invincible > 0 && !this.healthyTexture ? 0.55 : 1),
      this.ring.setPosition(this.player.x, this.player.y + 14 * this.player.scaleY),
      (this.cleanupClock -= K),
      this.cleanupClock <= 0 &&
        ((this.cleanupClock = 1),
        (this.gems = this.gems.filter((t) =>
          !t.pickupFlight && this.distance(this.player, t) > 1800 ? (t.destroy(), !1) : !0,
        ))),
      this.waveSpawned < encounter.total &&
        this.spawnClock <= 0 &&
        this.enemies.length < BALANCE.enemyCap)
    ) {
      this.spawnClock = encounter.interval;
      const count = Math.min(encounter.count, encounter.total - this.waveSpawned, BALANCE.enemyCap - this.enemies.length);
      for (let i = 0; i < count; i++) {
        if (encounter.bossIndex !== undefined && this.waveSpawned === Math.floor(encounter.total/2)) {
          if (this.spawnBoss(BALANCE.bosses[encounter.bossIndex])) this.waveSpawned++;
          continue;
        }
        const angle = encounterAngle(encounter,this.encounterHeading,this.encounterBatch,i);
        const point = this.defenses.spawn(
          Math.cos(angle) * 520,
          Math.sin(angle) * 430,
        );
        if (point) {
          const bounty = encounter.bounty && !this.bountySpawned;
          const elite = bounty || this.runTime >= this.nextEliteAt;
          const kind = elite
            ? "brute"
            : encounter.kinds[(i + (encounter.crossfire ? 0 : this.encounterBatch)) % encounter.kinds.length];
          this.enemies.push({
            ...(elite
              ? eliteStats((this.wave - 1)*48 + this.profile.stage*18)
              : enemyStats(kind, (this.wave - 1)*48 + this.profile.stage*18)),
            kind, bounty,
            s: this.add
              .image(point.x, point.y, kind)
              .setDepth(4)
              .setScale(elite ? 1.25 : 1),
          });
          this.waveSpawned++;
          if (bounty) this.bountySpawned = true;
          if (elite) this.nextEliteAt = this.runTime + BALANCE.elites.interval;
        }
      }
      this.encounterBatch++;
    }
    this.enemyTelegraphs.clear();
    for (let t of this.enemies) {
      this.defenses.confine(t.s, t.r);
      if (this.waveSpawned === encounter.total && this.enemies.length <= 3 &&
          !this.cameras.main.worldView.contains(t.s.x,t.s.y)) {
        const angle = Math.atan2(t.s.y-this.player.y,t.s.x-this.player.x);
        const dx = Math.cos(angle), dy = Math.sin(angle);
        const x = this.player.x+dx*60, y = this.player.y+dy*60;
        this.enemyTelegraphs.fillStyle(0xffce73,.95).fillTriangle(
          x+dx*9,y+dy*9,x-dy*5-dx*3,y+dx*5-dy*3,x+dy*5-dx*3,y-dx*5-dy*3);
      }
      if (t.elite || t.boss) {
        if (t.bounty) this.enemyTelegraphs.lineStyle(3,0xffdc63).strokeCircle(t.s.x,t.s.y,t.r+10);
        const color = t.boss ? 0xe17055 : 0xf4c875;
        const x = t.s.x,
          y = t.s.y - (t.boss ? t.s.displayHeight / 2 : t.r) - 10;
        this.enemyTelegraphs
          .lineStyle(3, color, 0.95)
          .strokeCircle(t.s.x, t.s.y, t.r + 4)
          .fillStyle(0x302b25)
          .fillRect(x - 26, y, 52, 7)
          .fillStyle(color)
          .fillRect(x - 24, y + 2, (48 * t.hp) / t.maxHp, 3)
          .fillTriangle(x - 7, y - 5, x + 7, y - 5, x, y - 16);
      }
      if (t.flashUntil && t.flashUntil <= this.combat.time) {
        t.s.setTexture(t.normalTexture);
        t.flashUntil = 0;
      }
      const chilled = t.chilledUntil > this.combat.time;
      if (t.frozenUntil > this.combat.time) {
        if (!t.flashUntil) t.s.setTint(0x99eaff);
        continue;
      }
      if (t.frozenUntil) {
        t.s.clearTint();
        t.frozenUntil = 0;
      }

      const ringAttack = t.final && updateBossRing(this,t,K);
      const attackTarget = this.player;
      if (!ringAttack && (t.ranged || t.boss) && t.shot < 0.55) {
        const a = Math.atan2(attackTarget.y - t.s.y, attackTarget.x - t.s.x);
        this.enemyTelegraphs
          .lineStyle(2, 0xe16b4a, 0.8)
          .strokeCircle(t.s.x, t.s.y, t.r + 7)
          .lineBetween(
            t.s.x,
            t.s.y,
            t.s.x + Math.cos(a) * (t.r + 36),
            t.s.y + Math.sin(a) * (t.r + 36),
          );
      }
      let l = attackTarget.x - t.s.x,
        c = attackTarget.y - t.s.y,
        h = Math.hypot(l, c);
      if (h > 0 && (!t.ranged || h > (t.reach || 260))) {
        t.gait ??= t.s.x * 0.07;
        t.gait += K * 3;
        const side = (t.sway || 0) * Math.sin(t.gait);
        const pulse = t.surge ? (Math.cos(t.gait) > 0.75 ? 1 + t.surge : 0.55) : 1;
        const chillSpeed = chilled ? (t.boss ? .8 : .55) : 1;
        const step = t.speed * (t.slow || 1) * chillSpeed * K * pulse / (h * Math.hypot(1, side));
        this.defenses.move(t.s, (l - c * side) * step, (c + l * side) * step, t.r);
      }
      if (
        ((t.s.rotation = Math.sin(b * 0.008 + t.s.x) * 0.07),
        !ringAttack && (t.ranged || t.boss) &&
          ((t.shot = (t.shot ?? 2) - K),
          t.shot <= 0 &&
            ((t.shot = t.shotCooldown ?? 2.4), this.hostile.length < 100)))
      ) {
        const count = t.shots || 1;
        for (let i = 0; i < count && this.hostile.length < 100; i++) {
          const r = Math.atan2(c, l) + (i - (count - 1) / 2) * (t.spread || 0);
          this.hostile.push({
            s: this.add.image(t.s.x, t.s.y, "orb").setTint(14317688),
            vx: Math.cos(r) * (t.bulletSpeed ?? 180),
            vy: Math.sin(r) * (t.bulletSpeed ?? 180),
            life: 4,
            damage: t.damage ?? 10,
          });
        }
      }
      if (
        this.distance(this.player, t.s) < t.r + 18 &&
        (t.contactBlockedUntil || 0) <= this.combat.time &&
        this.invincible <= 0 &&
        (this.combat.receive(t.damage ?? 9, t),
        (this.invincible = BALANCE.player.invulnerability),
        this.sync(),
        this.hp <= 0)
      ) {
        this.beginDefeat();
        return;
      }
    }
    for (let t = this.bullets.length - 1; t >= 0 && this.mode === "play"; t--) {
      let l = this.bullets[t];
      if (l.returning) l.s.rotation += K * 10;
      if (((l.age = (l.age || 0) + K), l.homing && this.enemies.length)) {
        const c = this.enemies.reduce((r, n) =>
            this.distance(l.s, n.s) < this.distance(l.s, r.s) ? n : r,
          ),
          h = Math.atan2(c.s.y - l.s.y, c.s.x - l.s.x);
        ((l.vx = Math.cos(h) * 430), (l.vy = Math.sin(h) * 430));
      }
      if (l.returning && l.age > (l.returnAt ?? 0.75)) {
        const c = Math.atan2(this.player.y - l.s.y, this.player.x - l.s.x);
        ((l.vx = Math.cos(c) * (l.returnSpeed ?? 430)),
          (l.vy = Math.sin(c) * (l.returnSpeed ?? 430)),
          l.returned || (l.outboundHits = l.hit, l.hit = new Set(), l.returned = true));
      }
      if (this.combat.intercept(l, K)) {
        l.s.destroy();
        this.bullets.splice(t, 1);
        continue;
      }
      if (
        ((l.s.x += l.vx * K),
        (l.s.y += l.vy * K),
        (l.life -= K),
        (l.trail -= K),
        l.trail <= 0)
      ) {
        l.trail = 0.045;
        const trail = this.add.graphics({x: l.s.x, y: l.s.y}).setDepth(6)
          .setRotation(Math.atan2(l.vy, l.vx));
        if (l.returning) {
          trail.lineStyle(3, l.color, 0.9).beginPath().arc(0,0,15,0.5,4.8).strokePath();
        } else if (l.explosive || l.element === "poison") {
          for (let i = 1; i < (l.skillLevel || 1); i++) {
            const side = i % 2 ? 1 : -1;
            trail.lineStyle(1.5, 0xbadf71, 0.85)
              .strokeCircle(-7*i,side*(4+2*Math.sin(l.age*16+i)),2+i/2);
          }
          trail.fillStyle(l.color, 0.5).fillCircle(-6,0,8).fillCircle(-15,-3,5)
            .fillStyle(0xfff1bb, 0.8).fillCircle(-2,0,3);
        } else {
          trail.fillStyle(l.color, 0.8).fillTriangle(0,-3,-30,0,0,3)
            .lineStyle(1,0xffedbb).lineBetween(-18,0,0,0);
        }
        this.effect(trail, 0.22);
      }
      for (const c of [...this.enemies])
        if (
          !l.hit.has(c) &&
          Lt.Math.Distance.Between(l.s.x, l.s.y, c.s.x, c.s.y) < c.r + 5 &&
          (l.returned && l.outboundHits?.has(c) && this.shieldReturnFeedback(c),
          l.hit.add(c),
          l.explosive
            ? (this.explode(l.s.x, l.s.y, l.damage, l.color, l.blastRadius),
              (l.explosive = !1))
            : l.element
              ? this.combat.damage(c, l.damage, l.element)
              : this.hit(c, l.damage, l.color),
          l.pierce--,
          l.pierce <= 0)
        ) {
          l.life = 0;
          break;
        }
      l.life <= 0 &&
        (l.explosive &&
          this.explode(l.s.x, l.s.y, l.damage, l.color, l.blastRadius),
        l.s.destroy(),
        this.bullets.splice(t, 1));
    }
    for (let t = this.hostile.length - 1; t >= 0; t--) {
      const l = this.hostile[t];
      const from = { x: l.s.x, y: l.s.y };
      l.s.x += l.vx * K;
      l.s.y += l.vy * K;
      l.life -= K;
      const playerHit =
        this.invincible <= 0
          ? segmentCircleEntry(from, l.s, this.player, 22)
          : null;
      if (playerHit !== null) {
        this.combat.receive(l.damage ?? 10);
        this.invincible = BALANCE.player.invulnerability;
        l.life = 0;
        if (this.hp <= 0) this.beginDefeat();
      }
      if (l.life <= 0) {
        l.s.destroy();
        this.hostile.splice(t, 1);
      }
      if (this.mode !== "play") break;
    }
    if (
      this.mode === "play" &&
      (this.combat.update(K),
      this.mode === "play" && updateClassWeapon(this, K),
      updateMount(this, K),
      this.defenses.update(K),
      this.mode === "play")
    )
      for (let t = this.gems.length - 1; t >= 0; t--) {
        const gem = this.gems[t];
        if (gem.pickupFlight) {
          if (!advancePickupFlight(gem, this.player, K)) continue;
        } else {
          const distance = this.distance(gem, this.player);
          if (distance >= 23) {
            if (distance < BALANCE.player.pickup * this.build.pickupMultiplier) {
              gem.x += (this.player.x - gem.x) / distance * 320 * K;
              gem.y += (this.player.y - gem.y) / distance * 320 * K;
            }
            continue;
          }
        }
        pt.play("pickup");
        this.xp += gem.xp ?? 3;
        gem.destroy();
        this.gems.splice(t, 1);
        this.sync();
        if (this.xp >= this.need) {
          this.upgrade();
          break;
        }
      }
    updatePresentation(this, S > 0 || rolling);
    drawStatusEffects(this);
    updateBuffIcons(this);
  }
}
const Ct = new Lt.Game({
  type: Lt.AUTO,
  parent: "game",
  width: 900,
  height: 620,
  backgroundColor: "#b9ad91",
  antialias: !0,
  scene: ge,
  scale: { mode: Lt.Scale.NONE, autoCenter: Lt.Scale.CENTER_BOTH },
});
if (typeof wx === "undefined") attachBrowserHud(Ct);
function xe() {
  const st = document.getElementById("game").getBoundingClientRect(),
    b = Math.max(900, Math.round((620 * st.width) / Math.max(1, st.height)));
  Zt.style.setProperty("--ui-scale", String(st.width / b));
  Ct.scale.resize(
    b,
    Math.max(620, Math.round((b * st.height) / Math.max(1, st.width))),
  );
  const Y = Ct.scene.getScene("garden");
  Y != null &&
    Y.timerText &&
    ((Y.timerText.x = b / 2),
    (Y.hint.x = b / 2),
    Y.panel && (Y.panel.x = (b - 900) / 2));
}
new ResizeObserver(xe).observe(document.getElementById("game"));
Ct.events.on("poststep", () => {
  const st = Ct.scene.getScene("garden");
  st != null &&
    st.timerText &&
    ((st.timerText.x = Ct.scale.width / 2),
    (st.hint.x = Ct.scale.width / 2),
    st.panel &&
      ((st.panel.x = (Ct.scale.width - 900) / 2),
      (st.panel.y = (Ct.scale.height - 620) / 2)));
});

if (new URLSearchParams(location.search).has("debug")) window.__game = Ct;
