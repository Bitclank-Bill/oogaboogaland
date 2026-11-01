// POGs: a modern original game in the spirit of the 1990s playground craze for milk caps, for the Genesis museum's
// cartridge console (genesis-cartridge.js; OVERHAUL-CONTRACT.md Addendum A). Not an exhibit: no timeline record, no
// date on the timeline, no trail connection.
//
// What it plays on (kept to what the sources agree): caps stacked face down, a heavier slammer thrown onto the stack,
// and the thrower keeps every cap that lands face up. The milk-cap game is older; it was revived in Hawaii in 1991 and
// was a craze in the mid-1990s (Wikipedia, "Milk caps (game)"; Kalamazoo Valley Museum, "The history of POGs"). The
// caps here are original designs with no brand on them.
//
// Play: twenty caps in the stack, ten from you and ten from the rival Ooga. A meter swings; Space (or A, or a tap)
// throws the slammer, and the nearer the meter is to its sweet spot the more caps flip. Caps that land face up are
// yours (or the rival's on its turn); the rest are restacked. Turns alternate until the stack is gone; whoever holds
// more caps wins. A seed replays a run; Calm holds the shake and the flying-cap spin, never the rules.
//
// The retro-games.js factory interface: make(host) → { kind, name, help, coach, status, playing, start(seed), act(),
// stop(), update(dt), draw(ctx), aims }. `update` and `draw` allocate nothing (typed arrays, preset strings, digits
// drawn as blocks); play runs on a fixed step of 1/120 s.
(() => {
  "use strict";
  const BL = window.BL = window.BL || {};
  const W = 160, H = 120, STEP = 1 / 120, CAPS = 20, SWEET = 0.8, METER_PERIOD = 1.15;
  const INK = { yard: "#3a3f47", line: "#e6e0c8", mat: "#5a4632", matEdge: "#3d2f20", capDown: "#9aa1aa", capRim: "#5c636c", gold: "#ffd23a",
    you: "#46ffd2", rival: "#ff8a2a", text: "#f6ecd2", dim: "#9a927e", slam: "#2b2f36", slamRim: "#c9ced4", meter: "#1a1d22", sweet: "#7dff9e" };
  const FACE = ["#ff5fa2", "#5ec8ff", "#c8ff5a", "#b98cff", "#ffb02e"];
  // 3 x 5 block digits, so a score never builds a string.
  const DIGITS = [0x7b6f, 0x2c97, 0x73e7, 0x73cf, 0x5bc9, 0x79cf, 0x79ef, 0x7249, 0x7bef, 0x7bcf];
  const digit = (g, d, x, y, s) => { const bits = DIGITS[d]; for (let i = 0; i < 15; i++) if (bits >> (14 - i) & 1) g.fillRect(x + (i % 3) * s, y + ((i / 3) | 0) * s, s, s); };
  const number = (g, n, x, y, s) => { if (n >= 10) { digit(g, ((n / 10) | 0) % 10, x, y, s); x += 4 * s; } digit(g, n % 10, x, y, s); };

  const make = (host) => {
    // Cap state: 0 in the stack, 1 flying, 2 yours, 3 the rival's. `up` is the face it shows.
    const st = new Uint8Array(CAPS), up = new Uint8Array(CAPS), col = new Uint8Array(CAPS);
    const cx = new Float32Array(CAPS), cy = new Float32Array(CAPS), vx = new Float32Array(CAPS), vy = new Float32Array(CAPS), spin = new Float32Array(CAPS);
    const s = { phase: "idle", t: 0, acc: 0, meter: 0, turn: 0, you: 0, rival: 0, last: 0, shake: 0, seed: 1, rounds: 0, endT: 0, power: 0 };
    const status = { score: 0, left: CAPS, leftLabel: "caps", round: 0, target: 0, meter: -1, streak: 0, fire: false, verb: "slam" };
    const rng = () => { let t = (s.seed = (s.seed + 0x6d2b79f5) | 0); t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    const game = {
      kind: "pogs", name: "POGs", aims: false, status, playing: false,
      help: "Space or A slams when the meter is near the gold mark; face-up caps are yours.",
      coach: ["Space slams · stop the meter on the gold mark", "Tap to slam · stop the meter on the gold mark"],
      start(seed) {
        s.seed = (seed | 0) || 1; s.phase = "aim"; s.t = 0; s.acc = 0; s.turn = 0; s.you = s.rival = 0; s.rounds = 0; s.shake = 0; s.endT = 0;
        for (let i = 0; i < CAPS; i++) { st[i] = 0; up[i] = 0; col[i] = i % FACE.length; cx[i] = 80; cy[i] = 92 - i * 1.4; vx[i] = vy[i] = spin[i] = 0; }
        game.playing = true; status.score = 0; status.left = CAPS; status.round = 1;
      },
      // Space, A or a tap: throw the slammer on your turn while the meter swings.
      act() { if (game.playing && s.phase === "aim" && s.turn === 0) throwSlammer(quality(s.meter)); },
      stop() { game.playing = false; s.phase = "idle"; },
      update(dt) {
        s.acc = Math.min(s.acc + dt, 0.1);
        while (s.acc >= STEP) { s.acc -= STEP; step(); }
      },
      draw(g) { paint(g); }
    };
    const quality = (m) => Math.max(0, 1 - Math.abs(m - SWEET) / 0.4);
    const topCap = () => { let t = 0, y = 999; for (let i = 0; i < CAPS; i++) if (st[i] === 0 && cy[i] < y) { y = cy[i]; t = i; } return t; };
    const left = () => { let n = 0; for (let i = 0; i < CAPS; i++) if (st[i] === 0) n++; return n; };
    // The slammer comes down; on impact every cap in the stack flies, each flipping face up with a chance that grows
    // with the throw's quality.
    const throwSlammer = (q) => { s.power = q; s.phase = "fall"; s.t = 0; host.cue("slam", 0.6); };
    const impact = () => {
      const chance = 0.06 + 0.4 * s.power;
      for (let i = 0; i < CAPS; i++) if (st[i] === 0) {
        st[i] = 1; up[i] = rng() < chance ? 1 : 0;
        const a = rng() * Math.PI * 2, v = 30 + rng() * 40 * (0.5 + s.power);
        vx[i] = Math.cos(a) * v; vy[i] = -40 - rng() * 30; spin[i] = 0;
      }
      if (!host.still) s.shake = 0.25;
      host.cue("flip", 0.5);
      s.phase = "fly"; s.t = 0;
    };
    const settle = () => {
      let won = 0;
      for (let i = 0; i < CAPS; i++) if (st[i] === 1) {
        if (up[i]) { st[i] = s.turn === 0 ? 2 : 3; won++; }
        else { st[i] = 0; up[i] = 0; }
      }
      if (s.turn === 0) s.you += won; else s.rival += won;
      s.last = won;
      // Restack what is left, face down.
      let k = 0;
      for (let i = 0; i < CAPS; i++) if (st[i] === 0) { cx[i] = 80; cy[i] = 92 - k * 1.4; k++; }
      status.left = k; status.score = s.you * 100; host.cue(won ? "win" : "tick", 0.4);
      if (!k) { finish(); return; }
      s.turn = 1 - s.turn; s.rounds++; status.round = 1 + (s.rounds >> 1);
      s.phase = s.turn === 0 ? "aim" : "rival"; s.t = 0;
    };
    const finish = () => {
      s.phase = "over"; s.t = 0;
      if (s.you > s.rival) status.score += 300;
      host.cue(s.you > s.rival ? "win" : "lose", 0.7);
      host.over();
    };
    const step = () => {
      s.t += STEP;
      if (s.shake > 0) s.shake = Math.max(0, s.shake - STEP);
      if (s.phase === "aim") { const p = (s.t % METER_PERIOD) / METER_PERIOD; s.meter = p < 0.5 ? p * 2 : 2 - p * 2; status.meter = s.meter; }
      else if (s.phase === "rival") { if (s.t > 0.9) throwSlammer(0.25 + rng() * 0.6); }
      else if (s.phase === "fall") { if (s.t > 0.3) impact(); }
      else if (s.phase === "fly") {
        for (let i = 0; i < CAPS; i++) if (st[i] === 1) {
          vy[i] += 160 * STEP; cx[i] += vx[i] * STEP; cy[i] += vy[i] * STEP;
          if (cy[i] > 92) { cy[i] = 92; vy[i] *= -0.3; vx[i] *= 0.6; }
          cx[i] = Math.max(14, Math.min(146, cx[i]));
          if (!host.still) spin[i] += STEP * 9;
        }
        if (s.t > 1.1) settle();
      } else if (s.phase === "over") {
        if (s.t > 1.6 && game.playing) { game.playing = false; host.onEnd(status.score); }
      }
    };
    const cap = (g, x, y, face, c, flat) => {
      g.fillStyle = INK.capRim; g.beginPath(); g.ellipse(x, y, 7, flat ? 2.6 : 5, 0, 0, 6.2832); g.fill();
      g.fillStyle = face ? FACE[c] : INK.capDown; g.beginPath(); g.ellipse(x, y, 5.6, flat ? 1.8 : 4, 0, 0, 6.2832); g.fill();
      if (face && !flat) { g.fillStyle = INK.gold; g.fillRect(x - 1, y - 1, 2, 2); }
    };
    const paint = (g) => {
      const sx = s.shake > 0 ? Math.sin(s.t * 90) * 2 : 0;
      g.fillStyle = INK.yard; g.fillRect(0, 0, W, H);
      g.fillStyle = INK.line; g.fillRect(0, 104, W, 1);
      g.fillStyle = INK.mat; g.fillRect(40 + sx, 60, 80, 40); g.fillStyle = INK.matEdge; g.fillRect(40 + sx, 98, 80, 2);
      // The stack, then the caps in the air or won.
      for (let i = 0; i < CAPS; i++) if (st[i] === 0) cap(g, cx[i] + sx, cy[i], 0, col[i], true);
      for (let i = 0; i < CAPS; i++) if (st[i] === 1) cap(g, cx[i] + sx, cy[i], up[i] && Math.cos(spin[i]) > -0.2 ? 1 : 0, col[i], false);
      let a = 0, b = 0;
      for (let i = 0; i < CAPS; i++) {
        // Won caps in piles of two columns (up to ten shown each side; the number above counts them all).
        if (st[i] === 2) { if (a < 10) cap(g, 10 + (a % 2) * 12, 26 + (a >> 1) * 13, 1, col[i], false); a++; }
        else if (st[i] === 3) { if (b < 10) cap(g, 138 + (b % 2) * 12, 26 + (b >> 1) * 13, 1, col[i], false); b++; }
      }
      // The slammer: falling onto the stack, or held over it.
      if (s.phase === "aim" || s.phase === "rival" || s.phase === "fall") {
        const y = s.phase === "fall" ? 20 + (s.t / 0.3) * (cy[topCap()] - 24) : 20;
        g.fillStyle = INK.slamRim; g.beginPath(); g.ellipse(80 + sx, y, 9, 3.4, 0, 0, 6.2832); g.fill();
        g.fillStyle = INK.slam; g.beginPath(); g.ellipse(80 + sx, y, 7, 2.4, 0, 0, 6.2832); g.fill();
      }
      // Scores, whose turn, and the meter.
      g.fillStyle = INK.you; number(g, s.you, 6, 6, 2);
      g.fillStyle = INK.rival; number(g, s.rival, 146, 6, 2);
      g.font = "7px monospace"; g.textAlign = "center"; g.textBaseline = "top";
      g.fillStyle = INK.text;
      if (!game.playing && s.phase !== "over") { g.fillText("POGS", 80, 18); g.fillStyle = INK.dim; g.fillText("PRESS START", 80, 110); }
      else if (s.phase === "over") g.fillText(s.you > s.rival ? "YOU WIN!" : s.you === s.rival ? "A DRAW" : "OOGA WINS", 80, 40);
      else g.fillText(s.turn === 0 ? "YOUR SLAM" : "OOGA'S SLAM", 80, 6);
      if (s.phase === "aim") {
        g.fillStyle = INK.meter; g.fillRect(52, 110, 56, 5);
        g.fillStyle = INK.sweet; g.fillRect(52 + SWEET * 56 - 3, 110, 6, 5);
        g.fillStyle = INK.gold; g.fillRect(52 + s.meter * 56 - 1, 108, 2, 9);
      }
    };
    return game;
  };
  (BL.genesisCartridges = BL.genesisCartridges || { list: [] }).list.push({
    id: "e3-pogs", era: 3, title: "POGs",
    label: "A modern original game in the spirit of 1990s playground POGs (milk caps)",
    make
  });
  BL.genesisPogs = { make, SWEET, CAPS };
})();
