const TAU = Math.PI * 2;
const sin = Math.sin;
// Phase is measured in radians. Each instrument mixes its own transient and tail.
const instruments = {
  fire: (t, p, n, low) => .9*sin(p) + low * 2.4 + n*.35*Math.exp(-18*t),
  ice: (t,p,n) => .46*sin(p*4.17)+.32*sin(p*6.81)+.28*n*Math.exp(-65*t),
  poison: (t,p) => sin(p+3*sin(p*.49))*(.55+.45*sin(90*t)),
  lightning: (t,p,n) => (.65*n+.48*sin(p+4*sin(p*2)))*(.35+.65*Math.abs(sin(116*t))),
  physical: (t,p,n) => .58*n*Math.exp(-12*t)+.55*sin(p)+.32*sin(p*4.71),
  wind: (t,p,n,low) => (low*2.8+.35*sin(p+4*sin(32*t)))*(.45+.55*Math.sin(Math.min(1,t/.09)*1.57)),
  shadow: (t,p) => .68*sin(p+2.8*sin(p*.5))+.34*sin(p*1.013),
  holy: (t,p) => .5*sin(p)+.32*sin(p*1.5)+.24*sin(p*2.51),
  mechanical: (t,p,n) => .65*Math.tanh(3*sin(p))+.35*n*Math.exp(-35*t),
  time: (t,p,n,low) => (.85*sin(p)+1.4*low+.2*n)*(.48+.52*Math.cos(72*t)),
  basic: (t,p,n) => .82*sin(p)+.55*n*Math.exp(-32*t),
  hurt: (t,p,n) => .62*Math.tanh(3*sin(p))+.45*sin(p*.73)+.38*n*Math.exp(-18*t),
};
// Starting frequency, ending frequency, sample length in seconds.
const sweeps = {
  fire:[180,42,.34], ice:[480,350,.22], poison:[480,82,.21],
  lightning:[1400,115,.16], physical:[320,100,.16], wind:[130,520,.26],
  shadow:[95,310,.30], holy:[880,740,.25], mechanical:[1700,65,.19],
  time:[145,45,.34], basic:[225,72,.14], hurt:[230,65,.29],
};
export class ImpactAudio {
  constructor(context, output) {
    this.context = context;
    this.output = output;
    this.buffers = new Map();
    this.burstStart = -1;
    this.count = 0;
  }
  sample(key) {
    if (this.buffers.has(key)) return this.buffers.get(key);
    const [start,end,length] = sweeps[key];
    const rate = 24000;
    const buffer = this.context.createBuffer(1, Math.ceil(rate*length), rate);
    const data = buffer.getChannelData(0);
    let phase = 0, bassPhase = 0, body = 0, lowNoise = 0, previousNoise = 0;
    // Filter the element-specific instrument into the midrange collision layer.
    const bodyCutoff = 1 - Math.exp(-TAU*1650/rate);
    const bassCutoff = 1 - Math.exp(-TAU*230/rate);
    let bodyBass = 0;
    for (let i=0; i<data.length; i++) {
      const t = i/rate, u = t/length, noise = 2*Math.random()-1;
      lowNoise += .12*(noise-lowNoise);
      phase += TAU*(end+(start-end)*(1-u)**3)/rate;
      bassPhase += TAU*(63 + 83*Math.exp(-t/.026))/rate;
      const thud = (.83*sin(bassPhase) + .17*sin(2*bassPhase))*Math.exp(-t/.053);

      const material = instruments[key](t,phase,noise,lowNoise);
      body += bodyCutoff*(material-body);
      bodyBass += bassCutoff*(body-bodyBass);
      const collision = (body-bodyBass + .36*sin(TAU*680*t))*Math.exp(-t/.036);

      const snap = (.42*(noise-previousNoise) + .38*sin(TAU*3400*t)
        + .20*sin(TAU*5100*t))*Math.exp(-t/.007);
      previousNoise = noise;
      const attack = Math.min(1,t/.0007);
      const tail = Math.min(1,(length-t)/.008);
      data[i] = Math.tanh(.83*thud + .83*collision + .53*snap)*attack*tail;
    }
    this.buffers.set(key, buffer);
    return buffer;
  }
  play(element, periodic = false) {
    const ctx = this.context, now = ctx.currentTime;
    if (now-this.burstStart > .025) {
      this.burstStart = now;
      this.count = 0;
    }
    const hurt = element === "hurt";
    const slot = hurt ? 0 : this.count++;
    const source = ctx.createBufferSource(), gain = ctx.createGain();
    source.buffer = this.sample(Object.hasOwn(sweeps,element) ? element : "basic");
    source.playbackRate.value = .93+Math.random()*.14;
    gain.gain.value = (hurt ? 1.45 : periodic ? .5 : 1.1)/Math.sqrt(1+slot*.36);
    source.connect(gain);
    gain.connect(this.output);
    source.onended = () => { source.disconnect(); gain.disconnect(); };
    source.start(now+(slot%8)*.012);
  }
}
