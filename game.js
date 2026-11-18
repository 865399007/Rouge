import {
  artKeys,
  renderPanel,
  drawGround,
  combatFeedback,
  updatePresentation,
  drawOrbit,
  drawArc,
} from "./presentation.js";
import Lt from "./vendor/phaser.js";
import { Defenses } from "./defenses.js";
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
function wt() {
  St.hidden = true;
  ((Dt = null), (Tt.x = Tt.y = 0), (Jt.style.transform = "translate(0, 0)"));
}
function Qt(st) {
  if (st.pointerId !== Dt) return;
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
    const bounds = Zt.getBoundingClientRect();
    if (
      !Tt.enabled ||
      Dt !== null ||
      event.button !== 0 ||
      event.clientX >= bounds.left + bounds.width / 2 ||
      event.target.closest("button,details,input,dialog")
    )
      return;
    event.preventDefault();
    Dt = event.pointerId;
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
    if (event.pointerId === Dt) wt();
  });
window.addEventListener("blur", wt);
document.addEventListener("visibilitychange", wt);
window.addEventListener("resize", wt);
const Bt = document.createElement("button");
Bt.id = "landscape";
Bt.textContent = "⛶ 全屏";
document.getElementById("pause").before(Bt);
const Vt = document.createElement("div");
Vt.className = "orientation-hint";
Vt.textContent = "横过手机，使用按住屏幕左侧拖动";
Zt.append(Vt);
const $t = () =>
    navigator.standalone ||
    matchMedia("(display-mode: standalone)").matches ||
    matchMedia("(display-mode: fullscreen)").matches,
  jt = () => document.fullscreenElement || document.webkitFullscreenElement,
  Ot = document.createElement("dialog");
Ot.className = "fullscreen-guide";
Ot.innerHTML =
  "<h2>全屏游玩</h2><p>iPhone / iPad：点击 Safari 的分享按钮 → 添加到主屏幕（如有“作为网页 App 打开”，请保持开启）。</p><p>然后从桌面的“末日小队”图标进入，隐藏浏览器地址栏。横过手机，并关闭系统竖屏锁定。</p><p>其他浏览器请允许全屏后重试。</p><button>知道了</button>";
document.body.append(Ot);
Ot.querySelector("button").onclick = () => Ot.close();
function Yt() {
  Bt.textContent = jt() ? "⛶ 退出" : $t() ? "⛶ 已全屏" : "⛶ 全屏";
}
for (const st of ["fullscreenchange", "webkitfullscreenchange"])
  document.addEventListener(st, Yt);
Yt();
Bt.onclick = async () => {
  var b, Y, K, Q;
  const st = document.querySelector(".game-frame");
  try {
    if (jt()) {
      await (((b = document.exitFullscreen) == null
        ? void 0
        : b.call(document)) ??
        ((Y = document.webkitExitFullscreen) == null
          ? void 0
          : Y.call(document)));
      return;
    }
    if ($t()) return;
    const Z = st.requestFullscreen || st.webkitRequestFullscreen;
    if (!Z) {
      Ot.showModal();
      return;
    }
    await Z.call(st);
    try {
      await ((Q = (K = screen.orientation) == null ? void 0 : K.lock) == null
        ? void 0
        : Q.call(K, "landscape"));
    } catch {}
  } catch {
    Ot.showModal();
  }
  Yt();
};
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
            (this.limiter = this.ctx.createDynamicsCompressor()),
            this.master.connect(this.limiter).connect(this.ctx.destination),
            (this.master.gain.value = this.muted ? 0 : this.volume),
            (this.noise = this.ctx.createBuffer(
              1,
              this.ctx.sampleRate * 4,
              this.ctx.sampleRate,
            )));
          const Y = this.noise.getChannelData(0);
          for (let K = 0; K < Y.length; K++) Y[K] = Math.random() * 2 - 1;
          this.ambience();
        }
        this.ctx.state === "suspended" && (await this.ctx.resume());
      } catch {}
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
      this.ctx.state !== "running" ||
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
      r.connect(n).connect(h).connect(this.master),
      this.voices++,
      (r.onended = () => {
        (r.disconnect(), n.disconnect(), h.disconnect(), this.voices--);
      }),
      r.start(c),
      r.stop(c + K + 0.02));
  }
  play(b) {
    if (!this.ctx || this.muted || document.hidden) return;
    const Y = this.ctx.currentTime,
      K =
        { hit: 0.055, kill: 0.12, pickup: 0.1, chain: 0.12, aura: 0.25 }[b] ||
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
      case "hit":
        (Z(0.07, 0.24, 1400), Q(180, 65, 0.09, 0.18));
        break;
      case "kill":
        (Q(150, 42, 0.18, 0.23), Z(0.11, 0.18, 900));
        break;
      case "hurt":
        Q(240, 70, 0.22, 0.19, "sawtooth");
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
  Ht = (st) => Math.ceil(12 + 5 * st + 0.65 * st * st);
function ue(st) {
  return () => (
    (st = (Math.imul(st, 1664525) + 1013904223) >>> 0),
    st / 4294967296
  );
}
class fe {
  constructor(seed = 1789) {
    this.active = [];
    this.random = ue(seed);
  }
  add(id) {
    const existing = this.active.find((skill) => skill.id === id);
    if (existing) {
      if (existing.level >= existing.maxLevel) return false;
      existing.level++;
      return true;
    }
    const skill = Et.find((skill) => skill.id === id);
    if (!skill || this.active.length >= 4) return false;
    this.active.push({ ...skill, level: 1, remaining: 0 });
    return true;
  }
  options() {
    const choices = [];
    for (const skill of Et) {
      const equipped = this.active.find((item) => item.id === skill.id);
      if (equipped ? equipped.level < skill.maxLevel : this.active.length < 4)
        choices.push({ ...skill, level: (equipped?.level || 0) + 1 });
    }
    const result = [];
    while (choices.length && result.length < 3) {
      result.push(
        ...choices.splice(Math.floor(this.random() * choices.length), 1),
      );
    }
    if (result.length < 3)
      result.push({
        id: "heal_supply",
        name: "战地补给",
        level: 1,
        description: "恢复 30 生命",
      });
    return result;
  }
  // Existing combat formulas use zero for unequipped passive modifiers.
  p() {
    return 0;
  }
}
class de {
  constructor(b = 120) {
    ((this.size = b), (this.cells = new Map()));
  }
  rebuild(b) {
    this.cells.clear();
    for (const Y of b) {
      const K = `${Math.floor(Y.s.x / this.size)},${Math.floor(Y.s.y / this.size)}`;
      (this.cells.has(K) || this.cells.set(K, []), this.cells.get(K).push(Y));
    }
  }
  query(b, Y, K) {
    const Q = [];
    for (
      let Z = Math.floor((b - K) / this.size);
      Z <= Math.floor((b + K) / this.size);
      Z++
    )
      for (
        let p = Math.floor((Y - K) / this.size);
        p <= Math.floor((Y + K) / this.size);
        p++
      )
        for (const S of this.cells.get(`${Z},${p}`) || [])
          S.s.active &&
            Math.hypot(S.s.x - b, S.s.y - Y) <= K + S.r &&
            Q.push(S);
    return Q;
  }
}
function ve() {
  const st = [...Et, ...Nt, ...zt, ...Xt],
    b = new Set(st.map((Y) => Y.id));
  if (b.size !== st.length) throw Error("Duplicate skill IDs");
  for (const Y of [...zt, ...Xt])
    if (
      !Y.ingredients.every((K) => b.has(K)) ||
      (Y.passive && !b.has(Y.passive))
    )
      throw Error("Invalid recipe");
  return !0;
}
ve();
const Kt = {
  fire: 16755301,
  ice: 11003384,
  lightning: 8698623,
  poison: 12179816,
  physical: 14800579,
  wind: 9557682,
  shadow: 11638999,
  holy: 16771235,
  mechanical: 11257552,
  time: 14006252,
};
class ce {
  constructor(b) {
    ((this.s = b),
      (this.hash = new de()),
      (this.time = 0),
      (this.zones = []),
      (this.shield = 0),
      (this.revived = !1),
      (this.killStreak = 0),
      (this.cloneUntil = 0),
      (this.lastCast = null),
      (this.emergencyAt = 0));
  }
  update(b) {
    const Y = this.s,
      K = Y.build;
    ((this.time += b),
      this.time - (this.lastKill || 0) > 3 && (this.killStreak = 0),
      this.hash.rebuild(Y.enemies));
    const Q = Y.skillGraphics;
    Q.clear();
    for (const Z of [...Y.enemies])
      (Z.status ?? (Z.status = {}),
        Z.reactions ?? (Z.reactions = {}),
        Z.dotAt < this.time &&
          ((Z.dotAt = this.time + 1),
          Z.status.fire > this.time && this.damage(Z, 4, "fire", !0),
          Z.status.poison > this.time &&
            this.damage(Z, 3 * (Z.poison || 1), "poison", !0)),
        (Z.slow =
          Z.status.ice > this.time || Z.status.time > this.time
            ? Z.boss
              ? 0.8
              : 0.6
            : 1));
    for (const Z of K.active) {
      Z.remaining = Math.max(0, Z.remaining - b);
      const p = Z.ingredients ? 5 : Z.level,
        S = [1, 1.25, 1.45, 1.75, 2.1][p - 1],
        t = (70 + p * 12) * (1 + K.p(8) * 0.12),
        l = Z.base * (S + (S - 1) * K.p(39) * 0.08),
        c = Kt[Z.element];
      if (Z.type === "orbit") {
        const e = Z.id === "evolved_6" ? 6 : 2 + p;
        for (let s = 0; s < e; s++) {
          const a = this.time * 1.8 + (s * Math.PI * 2) / e,
            i = Y.player.x + Math.cos(a) * t,
            o = Y.player.y + Math.sin(a) * t;
          if ((Q.fillStyle(c, 0.9), drawOrbit(Q, i, o, c, a), Z.remaining <= 0))
            for (const u of this.hash.query(i, o, 12))
              this.damage(u, l, Z.element);
        }
        Z.remaining <= 0 && (Z.remaining = 0.3);
        continue;
      }
      if (Z.remaining > 0) continue;
      let h = this.hash.query(Y.player.x, Y.player.y, 650);
      (h.sort((e, s) => Y.distance(Y.player, e.s) - Y.distance(Y.player, s.s)),
        ["strike"].includes(Z.type) && h.sort((e, s) => s.hp - e.hp),
        Z.type === "execute" && h.sort((e, s) => e.hp - s.hp));
      const r = h[0];
      if (!r && !["shield", "heal", "teleport", "clone"].includes(Z.type))
        continue;
      const n = () => this.cast(Z, r, l, t, c);
      (n(),
        Z.type !== "echo" &&
          Z.type !== "clone" &&
          ((this.lastCast = { k: Z, damage: l }),
          this.cloneUntil > this.time && this.cast(Z, r, l * 0.35, t, c)),
        K.random() < 0.08 * K.p(35) && n(),
        (Z.remaining = Math.max(
          0.15,
          (Z.cd /
            (1 +
              Math.min(
                1,
                K.p(2) * 0.06 + Math.min(10, this.killStreak) * K.p(36) * 0.01,
              ))) *
            (p >= 4 ? 0.9 : 1) *
            (Z.element === "mechanical" ? 1 - K.p(38) * 0.1 : 1),
        )));
    }
    this.zones = this.zones.filter((Z) => {
      if (
        ((Z.life -= b), Z.life <= 0 || !K.active.some((t) => t.id === Z.owner))
      )
        return !1;
      const p = Z.self ? Y.player.x : Z.x,
        S = Z.self ? Y.player.y : Z.y;
      if (Z.kind === "trap") {
        Q.lineStyle(3, Z.color).strokeTriangle(
          p,
          S - 12,
          p + 12,
          S + 9,
          p - 12,
          S + 9,
        );
      }
      if (
        (Q.fillStyle(Z.color, 0.12),
        Q.fillCircle(p, S, Z.r),
        Q.lineStyle(2, Z.color, 0.5),
        Q.strokeCircle(p, S, Z.r),
        (Z.tick -= b),
        Z.tick <= 0)
      ) {
        Z.tick = 0.5;
        let t = this.hash.query(p, S, Z.kind === "turret" ? 400 : Z.r);
        (Z.kind === "turret" || Z.kind === "storm") && (t = t.slice(0, 1));
        for (const l of t) {
          if (Z.kind === "drain") {
            const tether = Y.add.graphics().setDepth(7);
            tether.lineStyle(2, Z.color, 0.8).lineBetween(p, S, l.s.x, l.s.y);
            Y.effect(tether, 0.22);
          }
          if (Z.pull) {
            const c = Math.max(1, Y.distance({ x: p, y: S }, l.s));
            Y.defenses.move(
              l.s,
              ((p - l.s.x) / c) * 20,
              ((S - l.s.y) / c) * 20,
              l.r,
            );
          }
          (Z.kind === "slow"
            ? (l.status ?? (l.status = {}), (l.status.time = this.time + 1))
            : this.damage(
                l,
                Z.damage * 0.5 * (Z.kind === "turret" ? 1 + K.p(37) * 0.15 : 1),
                Z.element,
              ),
            Z.kind === "trap" &&
              ((Z.life = 0), Y.impact(p, S, Z.color, false, true)));
        }
        Z.heal &&
          t.length &&
          (Y.hp = Math.min(Y.maxHp, Y.hp + 1 * (1 + K.p(26) * 0.15)));
      }
      return !0;
    });
  }
  cast(b, Y, K, Q, Z) {
    const p = this.s,
      S = p.build,
      t = (r, n, e = Q, s = K) => {
        p.impact(r, n, Z, !1, !1);
        for (const a of this.hash.query(r, n, e)) this.damage(a, s, b.element);
      },
      l = b.type,
      c = b.level;
    castArt(p, b, Y, Q, Z);
    if (
      (pt.play(
        l === "chain"
          ? "chain"
          : l === "cone"
            ? "blade"
            : b.element === "fire"
              ? "fire"
              : "pea",
      ),
      b.id.startsWith("fusion_") && !b.composite)
    ) {
      for (const r of b.ingredients) {
        const n = Et.find((e) => e.id === r);
        this.cast(
          { ...n, id: b.id, level: 5, composite: !0 },
          Y,
          K * 0.7,
          Q,
          Z,
        );
      }
      return;
    }
    if (b.id.startsWith("evolved_") && !b.evolvedCast) {
      const r = ["evolved_1", "evolved_8", "evolved_17", "evolved_18"].includes(
        b.id,
      )
        ? 3
        : b.id === "evolved_2"
          ? 5
          : 1;
      if (r > 1) {
        for (let n = 0; n < r; n++)
          this.cast({ ...b, evolvedCast: !0 }, Y, K / r, Q, Z);
        return;
      }
    }
    if (l === "shield") {
      this.shield = Math.max(
        this.shield,
        b.base * (1 + (c - 1) * 0.25) * (1 + S.p(26) * 0.15),
      );
      return;
    }
    if (l === "teleport") {
      p.hp < p.maxHp * 0.35 &&
        ((p.player.x += 180), (p.player.y -= 120), (p.invincible = 1));
      return;
    }
    if (l === "clone") {
      this.cloneUntil = this.time + 6;
      return;
    }
    if (l === "echo") {
      this.lastCast &&
        this.cast(
          { ...this.lastCast.k, id: b.id },
          Y,
          this.lastCast.damage * 0.5,
          Q,
          Z,
        );
      return;
    }
    if (l === "chain") {
      let r = p.player;
      const n = new Set();
      for (let e = 0; e < (b.id === "evolved_7" ? 12 : 4 + c + S.p(9)); e++) {
        const s = this.hash
          .query(r.x, r.y, e ? 180 : 650)
          .filter((o) => !n.has(o))
          .sort((o, u) => p.distance(r, o.s) - p.distance(r, u.s))[0];
        if (!s) break;
        n.add(s);
        const a = { x: s.s.x, y: s.s.y },
          i = p.add.graphics().setDepth(8);
        (i.lineStyle(3, Z),
          drawArc(i, r, a, Z),
          p.effect(i, 0.18),
          this.damage(s, K * 0.85 ** e, b.element),
          b.id === "fusion_1" && t(a.x, a.y, 75, K * 0.5),
          (r = a));
      }
      return;
    }
    if (l === "plague") return;
    if (
      [
        "ground",
        "slow",
        "pull",
        "heal",
        "turret",
        "trap",
        "storm",
        "drain",
      ].includes(l)
    ) {
      (this.zones.length >= 24 && this.zones.shift(),
        this.zones.push({
          owner: b.id,
          x:
            l === "trap"
              ? p.player.x
              : ((Y == null ? void 0 : Y.s.x) ?? p.player.x),
          y:
            l === "trap"
              ? p.player.y
              : ((Y == null ? void 0 : Y.s.y) ?? p.player.y),
          r: Q,
          damage: K,
          element: b.element,
          color: Z,
          life: 4,
          tick: 0,
          pull: ["pull"].includes(l) || b.id === "wind_2",
          heal: l === "heal" || l === "drain",
          self: l === "drain",
          kind: l,
        }));
      return;
    }
    if (["nova", "aura"].includes(l)) {
      t(p.player.x, p.player.y);
      return;
    }
    if (["area", "strike", "execute", "bind"].includes(l)) {
      Y &&
        (t(Y.s.x, Y.s.y, l === "strike" ? 35 : Q),
        l === "execute" &&
          Y.hp < K * 0.3 &&
          !Y.boss &&
          this.damage(Y, Y.hp, "shadow"),
        l === "bind" &&
          (Y.status ?? (Y.status = {}), (Y.status.time = this.time + 2)));
      return;
    }
    if (l === "cone") {
      const r = Math.atan2(Y.s.y - p.player.y, Y.s.x - p.player.x);
      for (const n of this.hash.query(p.player.x, p.player.y, Q + 40)) {
        const e = Math.atan2(n.s.y - p.player.y, n.s.x - p.player.x) - r;
        Math.abs(Math.atan2(Math.sin(e), Math.cos(e))) < 1.2 &&
          (this.damage(n, K, b.element),
          n.s.active &&
            p.defenses.move(n.s, Math.cos(r) * 30, Math.sin(r) * 30, n.r));
      }
      p.melee(r, { range: 0, damage: 0, color: Z });
      return;
    }
    if (l === "beam") {
      const r = Math.atan2(Y.s.y - p.player.y, Y.s.x - p.player.x),
        n = p.add.graphics().setDepth(8);
      (n.lineStyle(8, Z, 0.7),
        n.lineBetween(
          p.player.x,
          p.player.y,
          p.player.x + Math.cos(r) * 650,
          p.player.y + Math.sin(r) * 650,
        ),
        p.effect(n, 0.18));
      for (const e of this.hash.query(p.player.x, p.player.y, 650)) {
        const s = e.s.x - p.player.x,
          a = e.s.y - p.player.y;
        s * Math.cos(r) + a * Math.sin(r) > 0 &&
          Math.abs(s * Math.sin(r) - a * Math.cos(r)) < e.r + 10 &&
          this.damage(e, K, b.element);
      }
      return;
    }
    let h = (c >= 3 ? 2 : 1) + S.p(6);
    b.id === "fire_1" && (h = c >= 5 ? 3 : c >= 3 ? 2 : 1);
    for (let r = 0; r < h && p.bullets.length < 250; r++) {
      const n =
          Math.atan2(Y.s.y - p.player.y, Y.s.x - p.player.x) +
          (r - (h - 1) / 2) * 0.15,
        e = p.add
          .ellipse(p.player.x, p.player.y, 14, 8, Z)
          .setStrokeStyle(2, 0x494b34)
          .setRotation(n)
          .setDepth(7);
      p.bullets.push({
        s: e,
        vx: Math.cos(n) * 430,
        vy: Math.sin(n) * 430,
        life: 1.5,
        damage: K * (1 - 0.12 * Math.min(5, S.p(6))),
        pierce: (["pierce", "return"].includes(l) ? 4 : 1) + S.p(7),
        color: Z,
        trail: 0,
        hit: new Set(),
        element: b.element,
        explosive: b.id === "fire_1",
        homing: l === "homing",
        returning: l === "return",
        age: 0,
      });
    }
  }
  receive(b, Y) {
    const K = this.s,
      Q = K.build;
    if (Q.random() < Math.min(0.75, Q.p(15) * 0.05)) return;
    K.hp < K.maxHp * 0.3 &&
      Q.p(14) &&
      this.time >= this.emergencyAt &&
      ((this.shield += 15 * Q.p(14)), (this.emergencyAt = this.time + 20));
    let Z =
      b * (1 - Q.p(11) * 0.05) * (1 - Q.p(18) * 0.05 * (1 - K.hp / K.maxHp));
    const p = Math.min(Z, this.shield);
    ((this.shield -= p),
      (Z -= p),
      (K.hp = Math.max(0, K.hp - Z)),
      K.impact(K.player.x, K.player.y, 0xff5858, false, false),
      K.cameras.main.shake(90, 0.003),
      K.sync(),
      Y && Q.p(20) && this.damage(Y, b * 0.15 * Q.p(20), "physical", !0),
      K.hp <= 0 &&
        Q.p(19) &&
        !this.revived &&
        ((this.revived = !0), (K.hp = K.maxHp * 0.3), (K.invincible = 2)));
  }
  damage(b, Y, K = "physical", Q = !1) {
    if (!b.s.active) return;
    if (K === "ice" && !Q) b.frozenUntil = this.time + (b.boss ? 0.4 : 1.3);
    const Z = this.s,
      p = Z.build;
    (b.status ?? (b.status = {}), b.reactions ?? (b.reactions = {}));
    if (!(b.status.poison > this.time)) b.poison = 0;
    let S =
      Y *
      (1 +
        p.p(1) * 0.1 +
        p.p(40) * 0.2 +
        new Set(p.active.map((t) => t.element)).size * p.p(28) * 0.03) *
      (b.boss ? 1 + p.p(3) * 0.12 : 1);
    if (
      (b.hp < (b.maxHp || 100) * 0.3 && (S *= 1 + p.p(10) * 0.15),
      Q && (S *= 1 + p.p(29) * 0.15),
      K === "fire" && Q && (S *= 1 + p.p(21) * 0.2),
      K === "lightning" && (S *= 1 + p.p(23) * 0.15),
      K === "shadow" && (S *= 1 + p.p(25) * 0.15),
      !Q)
    ) {
      const t = (l, c, h, r) => {
        c &&
          (b.reactions[l] || 0) <= this.time &&
          ((b.reactions[l] = this.time + h), (S += r));
      };
      if (
        (t(
          "melt",
          (K === "fire" && b.status.ice > this.time) ||
            (K === "ice" && b.status.fire > this.time),
          1,
          S * 0.6,
        ),
        t("poison", K === "fire" && b.poison >= 5, 2, 40),
        K === "fire" && b.poison >= 5 && (b.poison -= 5),
        t("super", K === "lightning" && b.status.ice > this.time, 2, 35),
        t("electro", K === "lightning" && b.status.poison > this.time, 1.5, 40),
        t("void", K === "holy" && b.status.shadow > this.time, 3, 75),
        t("time", K === "lightning" && b.status.time > this.time, 1.5, 30),
        K === "wind" &&
          b.status.fire > this.time &&
          (b.reactions.spread || 0) <= this.time)
      ) {
        b.reactions.spread = this.time + 2;
        for (const l of this.hash.query(b.s.x, b.s.y, 90))
          (l.status ?? (l.status = {}),
            (l.status.fire = this.time + 3),
            l.dotAt ?? (l.dotAt = this.time + 1));
      }
      if (
        (K === "wind" &&
          b.status.ice > this.time &&
          (b.reactions.frost || 0) <= this.time &&
          ((b.reactions.frost = this.time + 2), (b.status.ice = this.time + 5)),
        K === "holy" && (b.status.shadow = 0),
        (b.status[K] =
          this.time +
          3 *
            (K === "poison"
              ? 1 + p.p(24) * 0.2
              : K === "ice"
                ? 1 + p.p(22) * 0.2
                : 1)),
        p.random() < p.p(30) * 0.08)
      ) {
        const l = this.hash.query(b.s.x, b.s.y, 90).find((c) => c !== b);
        l &&
          (l.status ?? (l.status = {}),
          (l.status[K] = this.time + 3),
          l.dotAt ?? (l.dotAt = this.time + 1));
      }
      (b.dotAt ?? (b.dotAt = this.time + 1),
        K === "poison" && (b.poison = Math.min(10, (b.poison || 0) + 1)));
    }
    if (
      (Z.hit(
        b,
        (S * 100) /
          (100 +
            Math.max(
              0,
              (b.armor || 0) * (b.reactions.super > this.time ? 0.85 : 1),
            )),
        Kt[K],
      ),
      !Q && p.random() < p.p(17) * 0.05 && (Z.hp = Math.min(Z.maxHp, Z.hp + 1)),
      !b.s.active)
    ) {
      (this.killStreak++, (this.lastKill = this.time));
      const t = p.active.find((l) => l.type === "plague");
      if (t && !Q && (t.eventAt || 0) <= this.time) {
        t.eventAt = this.time + 0.5;
        for (const l of this.hash.query(b.s.x, b.s.y, 100))
          this.damage(l, 15 * t.level, "poison", !0);
      }
    }
  }
}
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
    for (const key of artKeys) this.load.svg(key, `./assets/${key}.svg`);
  }
  create() {
    this.events.once("shutdown", () => {
      this.panel?.destroy();
      this.defenses?.cancel();
    });
    document.querySelector(".settings").removeAttribute("open");
    document.getElementById("timer").textContent = "00:00";
    document.getElementById("boss-hud").hidden = true;
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
      (this.lastHitStop = -1000),
      (this.build = new fe(1789)),
      (this.combat = new ce(this)),
      (this.runTime = 0),
      (this.accumulator = 0),
      (this.bossTimes = [120, 240, 360, 480].map(
        (time) => time + Math.floor(Math.random() * 61) - 30,
      )),
      this.bossTimes.push(540),
      (this.nodes = new Set()),
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
      (this.recoil = 0),
      (this.skills = { aura: 0, chain: 0, orbit: 0 }),
      (this.skillTime = 0),
      (this.auraClock = 0),
      (this.chainClock = 0),
      (this.orbitHits = new WeakMap()),
      (this.weaponLocked = !1),
      (this.upgradeLevels = {}),
      (this.skillGraphics = this.add.graphics().setDepth(3)),
      this.events.once("shutdown", () =>
        this.input.keyboard.removeAllListeners("keydown-SPACE"),
      ),
      this.drawTextures(),
      this.cameras.main.setBackgroundColor("#b9ad91"),
      (this.player = this.add.image(450, 310, "potato").setDepth(5)),
      (this.gun = this.add.image(472, 315, "gun").setDepth(6)),
      (this.ring = this.add
        .circle(450, 310, 28)
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
      this.showPanel("末日小队", "街区守夜 / 坚持十分钟，等到黎明。", [
        {
          title: "出发，守住这一夜",
          detail: "选择技能，进入街区",
          action: () => this.chooseWeapon(),
        },
      ]));
  }
  drawTextures() {}
  sync() {
    if (this.build) {
      renderLoadout(yt("skills"), this.build.active);
      for (const [b, Y] of Object.entries({
        health: `${Math.ceil(this.hp)} / ${this.maxHp}`,
        level: this.level,
        damage: this.damage,
        speed: this.speed,
        kills: this.kills,
        "xp-label": `${Math.floor(this.xp)} / ${this.need}`,
        wave:
          this.runTime >= 600
            ? "最终加时"
            : `生存 ${Math.floor(this.runTime / 60)} / 10 分钟`,
      }))
        yt(b).textContent = Y;
      ((yt("hp").style.width = `${(this.hp / this.maxHp) * 100}%`),
        (yt("xp").style.width = `${(this.xp / this.need) * 100}%`));
    }
  }
  closePanel() {
    (this.defenses.cancel(),
      wt(),
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
  chooseWeapon() {
    this.showUpgradeCards(
      "带上你的拿手好戏",
      "十种技能，十种开局。你的下一次进化，由你决定。",
      Et.map((skill) => ({
        id: skill.id,
        element: skill.element,
        title: skill.name,
        detail: skill.description,
        action: () => {
          this.build.add(skill.id);
          this.mode = "play";
          this.closePanel();
          this.sync();
        },
      })),
    );
  }
  effect(b, Y, K = 0, Q = 0, Z = 0, p = 0) {
    (this.effects.length >= 220 && this.effects.shift().sprite.destroy(),
      this.effects.push({
        sprite: b,
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
    const K = this.gun.x + Math.cos(b) * 19,
      Q = this.gun.y + Math.sin(b) * 19,
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
      if (((K.life -= b), K.life <= 0)) {
        (K.sprite.destroy(), this.effects.splice(Y, 1));
        continue;
      }
      ((K.sprite.x += K.vx * b),
        (K.sprite.y += K.vy * b),
        (K.sprite.rotation += K.spin * b),
        K.sprite.setAlpha((K.alpha * K.life) / K.total),
        K.sprite.setScale(1 + K.grow * (1 - K.life / K.total)));
    }
  }
  flashEnemy(enemy) {
    const sprite = enemy.s;
    const key = (enemy.normalTexture ??= sprite.texture.key);
    const red = key + "-hit";
    if (!this.textures.exists(red)) {
      const source = this.textures.get(key).getSourceImage();
      const tex = this.textures.createCanvas(red, source.width, source.height);
      const ctx = tex.getContext();
      ctx.drawImage(source, 0, 0);
      ctx.globalCompositeOperation = "source-atop";
      ctx.fillStyle = "rgba(255, 238, 191, 0.5)";
      ctx.fillRect(0, 0, source.width, source.height);
      tex.refresh();
    }
    sprite.setTexture(red);
    enemy.flashUntil = this.combat.time + 0.1;
    const now = performance.now();
    if (now - this.lastHitStop > 180) {
      this.lastHitStop = now;
      this.hitStopUntil = now + 45;
      this.accumulator = 0;
    }
  }
  hit(b, Y, K = 9941859) {
    if (!b.s.active) return;
    pt.play("hit");
    const Q = this.build.random() < Math.min(0.75, this.build.p(4) * 0.05);
    if (
      ((b.hp -= Y * (Q ? 1.5 + this.build.p(5) * 0.2 : 1)),
      this.impact(b.s.x, b.s.y, K, Q, b.hp <= 0),
      this.flashEnemy(b),
      Q)
    ) {
      const Z = this.add
        .text(b.s.x, b.s.y - 25, "暴击!", {
          fontSize: "13px",
          color: "#a76a30",
        })
        .setDepth(9);
      this.tweens.add({
        targets: Z,
        y: Z.y - 24,
        alpha: 0,
        duration: 500,
        onComplete: () => Z.destroy(),
      });
    }
    if (b.hp <= 0) {
      (this.defenses.drop(b), b.final && this.finish(!0), pt.play("kill"));
      const Z = this.add.image(b.s.x, b.s.y, "gem").setDepth(2);
      ((Z.xp = b.boss ? 120 : 6),
        this.gems.push(Z),
        b.s.destroy(),
        this.enemies.splice(this.enemies.indexOf(b), 1),
        this.kills++,
        this.sync());
    }
  }
  distance(b, Y) {
    return Math.hypot(b.x - Y.x, b.y - Y.y);
  }
  explode(b, Y, K, Q) {
    pt.play("explosion");
    const Z = this.add
      .circle(b, Y, 90, Q, 0.18)
      .setStrokeStyle(3, Q, 0.8)
      .setDepth(7);
    (this.effect(Z, 0.3), this.burst(b, Y, Q, 16, 180));
    for (const p of [...this.enemies])
      this.distance({ x: b, y: Y }, p.s) <= 90 + p.r && this.hit(p, K, Q);
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
    (pt.play("upgrade"),
      (this.mode = "upgrade"),
      this.level++,
      (this.xp -= this.need),
      (this.need = Ht(this.level)),
      this.showUpgradeCards(
        "选择技能升级",
        "",
        this.build.options().map((b) => ({
          id: b.id,
          element: b.element,
          title: b.name,
          levelText: `Lv.${b.level}`,
          detail:
            b.description +
            (b.base
              ? `
基础伤害 ${b.base}`
              : ""),
          action: () => {
            (b.id.startsWith("heal_")
              ? (this.hp = Math.min(this.maxHp, this.hp + 30))
              : this.build.add(b.id),
              (this.maxHp = Math.max(
                1,
                (100 + this.build.p(12) * 20) * (1 - this.build.p(40) * 0.1),
              )),
              (this.hp = Math.min(this.hp, this.maxHp)),
              this.closePanel(),
              (this.mode = "play"),
              this.sync());
          },
        })),
      ),
      this.sync());
  }
  spawnBoss(b) {
    const Y = b === 540,
      angle = Math.random() * Math.PI * 2,
      pos = this.defenses.spawn(550 * Math.cos(angle), 550 * Math.sin(angle));
    if (!pos) {
      this.nodes.delete(b);
      return;
    }
    const K = this.add
        .image(pos.x, pos.y, "brute")
        .setDepth(5)
        .setScale(Y ? 2.4 : 1.7)
        .setTint(Y ? 14066111 : 13286277),
      Q = Y ? 14e3 : b * 7;
    this.enemies.push({
      s: K,
      hp: Q,
      maxHp: Q,
      speed: Y ? 65 : 55,
      r: Y ? 55 : 38,
      boss: !0,
      final: Y,
      armor: 25,
    });
  }
  finish(b) {
    (pt.play(b ? "win" : "lose"),
      (this.mode = "end"),
      this.showPanel(
        b ? "救援抵达，你活下来了！" : "你倒在了黎明之前",
        `生存 ${Math.floor(this.runTime)} 秒 · 击败 ${this.kills} 只丧尸 · 等级 ${this.level}`,
        [
          {
            title: "再次出击 →",
            detail: "重新开始行动",
            action: () => this.scene.restart(),
          },
        ],
      ));
  }
  update(b, Y) {
    if (performance.now() < this.hitStopUntil) return;
    if ((pt.setActive(this.mode === "play"), this.mode === "play"))
      for (
        this.accumulator += Math.min(Y, 100) / 1e3;
        this.accumulator >= 1 / 30 && this.mode === "play";
      )
        ((this.accumulator -= 1 / 30), this.step(this.runTime * 1e3, 1e3 / 30));
  }
  step(b, Y) {
    if ((pt.setActive(this.mode === "play"), this.mode !== "play")) return;
    let K = Math.min(Y, 50) / 1e3;
    (this.updateEffects(K),
      (this.recoil = Math.max(0, this.recoil - K * 60)),
      (this.regenClock += K),
      this.regenClock >= 1 &&
        ((this.regenClock = 0),
        (this.hp = Math.min(this.maxHp, this.hp + this.build.p(13) * 0.2)),
        this.sync()),
      (this.runTime += K),
      (this.elapsed = this.runTime),
      (this.wave = 1 + Math.floor(this.runTime / 30)),
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
    const Q =
      this.enemies.find((t) => t.final) || this.enemies.find((t) => t.boss);
    updatePresentation(
      this,
      this.keys.W.isDown ||
        this.keys.A.isDown ||
        this.keys.S.isDown ||
        this.keys.D.isDown ||
        this.keys.UP.isDown ||
        this.keys.LEFT.isDown ||
        this.keys.DOWN.isDown ||
        this.keys.RIGHT.isDown ||
        Tt.x ||
        Tt.y,
    );
    this.hint.setText(
      Q
        ? `${Q.final ? "最终Boss" : "街区Boss"} · HP ${Math.max(0, Math.ceil(Q.hp))} / ${Q.maxHp}`
        : "守卫街区 · 10分钟生存",
    );
    for (const t of this.bossTimes)
      this.runTime >= t &&
        !this.nodes.has(t) &&
        (this.nodes.add(t), this.spawnBoss(t));
    if (this.runTime >= 630) {
      this.finish(!1);
      return;
    }
    let Z =
        Number(this.keys.D.isDown || this.keys.RIGHT.isDown) -
        Number(this.keys.A.isDown || this.keys.LEFT.isDown),
      p =
        Number(this.keys.S.isDown || this.keys.DOWN.isDown) -
        Number(this.keys.W.isDown || this.keys.UP.isDown);
    (Tt.x || Tt.y) && ((Z = Tt.x), (p = Tt.y));
    let S = Math.hypot(Z, p);
    if (
      (S
        ? (this.defenses.move(
            this.player,
            (Z / S) * this.speed * K,
            (p / S) * this.speed * K,
            25,
          ),
          (this.player.rotation = Math.sin(b * 0.018) * 0.08))
        : (this.player.rotation = 0),
      this.defenses.confine(this.player, 25),
      this.player.setAlpha(this.invincible > 0 ? 0.55 : 1),
      this.ring.setPosition(this.player.x, this.player.y + 14),
      (this.cleanupClock -= K),
      this.cleanupClock <= 0 &&
        ((this.cleanupClock = 1),
        (this.enemies = this.enemies.filter((t) =>
          !t.boss && this.distance(this.player, t.s) > 1600
            ? (t.s.destroy(), !1)
            : !0,
        )),
        (this.gems = this.gems.filter((t) =>
          this.distance(this.player, t) > 1800 ? (t.destroy(), !1) : !0,
        ))),
      this.runTime < 600 && this.spawnClock <= 0 && this.enemies.length < 300)
    ) {
      this.spawnClock = Math.max(0.19, 0.85 - this.wave * 0.075);
      let t = this.build.random() * Math.PI * 2,
        l = this.defenses.spawn(Math.cos(t) * 650, Math.sin(t) * 500);
      if (l) {
        let c = l.y,
          h = this.build.random() < 0.12 + this.wave * 0.025,
          r = this.add.image(l.x, c, h ? "brute" : "bug").setDepth(4);
        const n = this.runTime > 60 ? this.build.random() : 0,
          e = n > 0.8,
          s = n > 0.5 && !e;
        (e && r.setTexture("spitter"),
          s && r.setTexture("runner"),
          this.enemies.push({
            s: r,
            hp: (h ? 65 : 26) + this.wave * 7,
            maxHp: (h ? 65 : 26) + this.wave * 7,
            speed: (s ? 100 : h ? 40 : 65) + this.wave * 2,
            r: h ? 25 : 20,
            ranged: e,
            shot: 2,
            armor: this.runTime > 240 && h ? 35 : 0,
          }));
      }
    }
    for (let t of this.enemies) {
      this.defenses.confine(t.s, t.r);
      if (t.flashUntil && t.flashUntil <= this.combat.time) {
        t.s.setTexture(t.normalTexture);
        t.flashUntil = 0;
      }
      if (t.frozenUntil > this.combat.time) {
        if (!t.flashUntil) t.s.setTint(0x99eaff);
        continue;
      }
      if (t.frozenUntil) {
        t.s.clearTint();
        t.frozenUntil = 0;
      }

      let l = this.player.x - t.s.x,
        c = this.player.y - t.s.y,
        h = Math.hypot(l, c);
      if (
        (h > 0 &&
          (!t.ranged || h > 260) &&
          this.defenses.move(
            t.s,
            (l / h) * t.speed * (t.slow || 1) * K,
            (c / h) * t.speed * (t.slow || 1) * K,
            t.r,
          ),
        (t.s.rotation = Math.sin(b * 0.008 + t.s.x) * 0.07),
        (t.ranged || t.boss) &&
          ((t.shot = (t.shot ?? 2) - K),
          t.shot <= 0 &&
            ((t.shot = t.boss ? 1.5 : 2.5), this.hostile.length < 100)))
      ) {
        const r = Math.atan2(c, l);
        this.hostile.push({
          s: this.add.image(t.s.x, t.s.y, "orb").setTint(14317688),
          vx: Math.cos(r) * 180,
          vy: Math.sin(r) * 180,
          life: 4,
        });
      }
      if (
        h < t.r + 18 &&
        this.invincible <= 0 &&
        (this.combat.receive(12, t),
        (this.invincible = 0.7),
        pt.play("hurt"),
        this.sync(),
        this.hp <= 0)
      ) {
        this.finish(!1);
        return;
      }
    }
    for (let t = this.bullets.length - 1; t >= 0 && this.mode === "play"; t--) {
      let l = this.bullets[t];
      if (((l.age = (l.age || 0) + K), l.homing && this.enemies.length)) {
        const c = this.enemies.reduce((r, n) =>
            this.distance(l.s, n.s) < this.distance(l.s, r.s) ? n : r,
          ),
          h = Math.atan2(c.s.y - l.s.y, c.s.x - l.s.x);
        ((l.vx = Math.cos(h) * 430), (l.vy = Math.sin(h) * 430));
      }
      if (l.returning && l.age > 0.75) {
        const c = Math.atan2(this.player.y - l.s.y, this.player.x - l.s.x);
        ((l.vx = Math.cos(c) * 430),
          (l.vy = Math.sin(c) * 430),
          l.returned || (l.hit.clear(), (l.returned = !0)));
      }
      if (
        ((l.s.x += l.vx * K),
        (l.s.y += l.vy * K),
        (l.life -= K),
        (l.trail -= K),
        l.trail <= 0)
      ) {
        l.trail = 0.045;
        const c = this.add
          .ellipse(l.s.x, l.s.y, l.s.scaleX > 2 ? 20 : 8, 3, l.color, 0.45)
          .setRotation(l.s.rotation)
          .setDepth(6);
        this.effect(c, 0.16);
      }
      for (const c of [...this.enemies])
        if (
          !l.hit.has(c) &&
          Lt.Math.Distance.Between(l.s.x, l.s.y, c.s.x, c.s.y) < c.r + 5 &&
          (l.hit.add(c),
          l.explosive
            ? (this.explode(l.s.x, l.s.y, l.damage, l.color),
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
        (l.explosive && this.explode(l.s.x, l.s.y, l.damage, l.color),
        l.s.destroy(),
        this.bullets.splice(t, 1));
    }
    for (let t = this.hostile.length - 1; t >= 0; t--) {
      const l = this.hostile[t];
      ((l.s.x += l.vx * K),
        (l.s.y += l.vy * K),
        (l.life -= K),
        this.distance(this.player, l.s) < 22 &&
          this.invincible <= 0 &&
          (this.combat.receive(9),
          (this.invincible = 0.5),
          (l.life = 0),
          this.hp <= 0 && this.finish(!1)),
        l.life <= 0 && (l.s.destroy(), this.hostile.splice(t, 1)));
    }
    if (
      this.mode === "play" &&
      (this.combat.update(K), this.defenses.update(K), this.mode === "play")
    )
      for (let t = this.gems.length - 1; t >= 0; t--) {
        let l = this.gems[t],
          c = Lt.Math.Distance.Between(l.x, l.y, this.player.x, this.player.y);
        if (
          (c < 110 * (1 + this.build.p(33) * 0.3) &&
            c > 0 &&
            ((l.x += ((this.player.x - l.x) / c) * 320 * K),
            (l.y += ((this.player.y - l.y) / c) * 320 * K)),
          c < 23 &&
            (pt.play("pickup"),
            l.destroy(),
            this.gems.splice(t, 1),
            (this.xp += (l.xp || 6) * (1 + this.build.p(32) * 0.15)),
            this.sync(),
            this.xp >= this.need))
        ) {
          this.upgrade();
          break;
        }
      }
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
function xe() {
  const st = document.getElementById("game").getBoundingClientRect(),
    b = Math.max(900, Math.round((620 * st.width) / Math.max(1, st.height)));
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
