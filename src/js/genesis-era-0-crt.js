// Era 0's monochrome CRT demonstration (docs/genesis-voyage/exhibits/era-0.md, "Counting cluster"): a modern
// explanatory toy, not a model of any particular display. A picture is drawn as twelve horizontal scan lines, each a
// dim background strip with brighter runs on it; BRIGHT lifts every line's level (the black level too) and CONTRAST
// spreads the picture's tones apart. The picture (a sailing boat under a sun) is original. No date or machine is
// claimed: candidate period displays are on HOLD in the exhibit doc, and many period computer displays plotted points
// rather than sweeping television-style lines, so this toy explains raster lines in general only.
//
// Three faces share one core (`create`), as in genesis-era-0-nim.js:
//   create()                 the settings: bright 0..4, contrast 0..4, lines 0..12; `glow[c]` for tone c (0 background,
//                            1 mid, 2 bright) and `shown(row)`. `segments()` lists the picture's runs (build time only).
//   terminal(crt, onChange)  the existing terminal shape for today's workbench.
//   make(host)               a console game on retro-games.js's factory interface.
(() => {
  "use strict";
  const BL = window.BL = window.BL || {};
  const games = BL.genesisEra0Games = BL.genesisEra0Games || {};
  // The original picture, 16 columns by 12 scan lines: "." background, "m" mid tone, "b" bright.
  const ROWS = [
    "................",
    "..........bbb...",
    "....b....bbbbb..",
    "....bb....bbb...",
    "....bbb.........",
    "....bbbb........",
    "....b...........",
    ".mmmmmmmmm......",
    "..mmmmmmm.......",
    "................",
    "mm..mm..mm..mm..",
    "................"
  ];
  const COLS = 16, LINES = ROWS.length, TONE = { ".": 0, m: 1, b: 2 }, VALUE = [0, 0.5, 1], LEVEL_MAX = 4, DEFAULTS = [2, 2];
  // A tone's intensity, 0..1: brightness adds to every tone alike; contrast multiplies the gap above black.
  const intensity = (bright, contrast, tone) => Math.min(1, 0.1 * bright + VALUE[tone] * 0.22 * contrast);
  // The picture's runs of one tone on one line, background strips excluded: [{ row, x0, len, tone }].
  const segments = () => {
    const out = [];
    ROWS.forEach((r, row) => {
      for (let x = 0; x < COLS;) {
        const t = TONE[r[x]];
        let e = x + 1;
        while (e < COLS && TONE[r[e]] === t) e++;
        if (t) out.push({ row, x0: x, len: e - x, tone: t });
        x = e;
      }
    });
    return out;
  };
  const create = () => {
    const S = { bright: DEFAULTS[0], contrast: DEFAULTS[1], lines: LINES }, glow = new Float32Array(3);
    const refresh = () => { for (let t = 0; t < 3; t++) glow[t] = intensity(S.bright, S.contrast, t); };
    const set = (key, n, hi) => { if (!Number.isInteger(n) || n < 0 || n > hi) return false; S[key] = n; refresh(); return true; };
    const reset = () => { S.bright = DEFAULTS[0]; S.contrast = DEFAULTS[1]; S.lines = LINES; refresh(); };
    refresh();
    return { state: S, glow, reset, shown: (row) => row < S.lines,
      setBright: (n) => set("bright", n, LEVEL_MAX), setContrast: (n) => set("contrast", n, LEVEL_MAX), setLines: (n) => set("lines", n, LINES) };
  };

  // ---- today's terminal ----------------------------------------------------------------------------------------
  const integer = (word, lo, hi) => /^\d+$/.test(word || "") && Number(word) >= lo && Number(word) <= hi ? Number(word) : -1;
  const HELP = ["BRIGHT 0..4 | CONTRAST 0..4 | LINES 0..12 | STATUS | INFO | RESET"];
  const pct = (v) => `${Math.round(v * 100)}%`;
  const terminal = (crt, onChange = () => {}) => {
    const S = crt.state, G = crt.glow;
    const status = () => [`Brightness ${S.bright}, contrast ${S.contrast}, ${S.lines} of ${LINES} lines drawn.`,
      `Background ${pct(G[0])}, mid tone ${pct(G[1])}, bright tone ${pct(G[2])}.`,
      G[0] >= 0.35 ? "The black background is glowing grey: brightness is lifting it." : G[2] - G[0] < 0.25 ? "The tones are crowding together: raise CONTRAST to separate them." : "Close this window and look at the screen."];
    return {
      banner: ["Monochrome CRT toy: a modern explanation of scan lines, not a model of a particular period display.", "An original picture is drawn as twelve horizontal lines. Change brightness and contrast and watch the tones.", ...HELP], prompt: "CRT>",
      run(line) {
        const text = String(line).trim().slice(0, 96), w = text.toUpperCase().split(/\s+/), cmd = w[0];
        if (cmd === "HELP" || !cmd) return { lines: HELP };
        if (cmd === "INFO" || cmd === "MORE") return { lines: ["A cathode-ray tube lights a phosphor where its beam lands. This toy sweeps it in horizontal lines, as a television raster does.", "Brightness adds to every line, even the black background. Contrast widens the gap between dark and light tones.", "Many early computer displays plotted separate points instead of sweeping lines; no particular period display or date is claimed here."] };
        if (cmd === "RESET") { crt.reset(); onChange(crt); return { lines: ["Settings restored.", ...status()] }; }
        if (cmd === "STATUS") return { lines: status() };
        const spec = cmd === "BRIGHT" ? [crt.setBright, LEVEL_MAX] : cmd === "CONTRAST" ? [crt.setContrast, LEVEL_MAX] : cmd === "LINES" ? [crt.setLines, LINES] : null;
        if (!spec) return { lines: ["Use BRIGHT, CONTRAST, LINES, STATUS, INFO or RESET."] };
        const n = w.length === 2 ? integer(w[1], 0, spec[1]) : -1;
        if (n < 0) return { lines: [`${cmd} needs one whole number from 0 to ${spec[1]}.`] };
        spec[0](n); onChange(crt);
        return { lines: status() };
      }
    };
  };

  // ---- the console game ------------------------------------------------------------------------------------------
  // Match the reference: each round shows a small reference picture at a seeded setting; left and right change
  // brightness, up and down contrast, and the action redraws the big picture line by line and locks the answer.
  // Three rounds, 100 for an exact match, 50 for one step off on one control. Eleven preset greens, no strings built.
  const SHADES = [];
  for (let k = 0; k <= 10; k++) { const v = k / 10; SHADES.push(`rgb(${Math.round(8 + 150 * v)},${Math.round(14 + 241 * v)},${Math.round(10 + 170 * v)})`); }
  const shade = (v) => SHADES[Math.round(Math.max(0, Math.min(1, v)) * 10)];
  const ROUNDS = 3, SCAN_RATE = 24, SHOW_S = 1.5;
  const TONES = new Uint8Array(COLS * LINES);
  ROWS.forEach((r, row) => { for (let x = 0; x < COLS; x++) TONES[row * COLS + x] = TONE[r[x]]; });
  const make = (host) => {
    const kit = BL.retroGames.kit, out = kit.hooks(host), aim = out.aim, status = kit.makeStatus("Rounds"), { W, H, INK, TEXT } = kit;
    const crt = create(), S = crt.state, rng = kit.rng();
    const C = { phase: "idle", round: 0, tb: 0, tc: 0, scan: LINES, steps: 0, stepsY: 0, wait: 0 };
    const deal = () => {
      C.round++; status.round = C.round; status.left = ROUNDS - C.round + 1;
      do { C.tb = rng.int(LEVEL_MAX + 1); C.tc = rng.int(LEVEL_MAX + 1); } while (C.tb === S.bright && C.tc === S.contrast);
      C.phase = "play"; C.scan = LINES; status.verb = "Lock";
    };
    const picture = (ctx, x, y, cell, bright, contrast, lines) => {
      for (let row = 0; row < lines; row++) for (let col = 0; col < COLS; col++) {
        ctx.fillStyle = shade(intensity(bright, contrast, TONES[row * COLS + col]));
        ctx.fillRect(x + col * cell, y + row * cell, cell, cell - 1);
      }
    };
    return {
      kind: "display", name: "Scan lines (museum toy)", aims: true,
      help: "Left/right brightness, up/down contrast, act to redraw and lock. Match the small reference picture.",
      coach: ["A and D brightness, W and S contrast, Space locks", "Swipe brightness, pull contrast, tap locks"],
      stars: [100, 200, 300], tickets: () => 0, status, crt,
      get playing() { return C.phase === "play" || C.phase === "scan"; },
      get target() { return C; },
      start: (seed) => {
        rng.seed(Number.isInteger(seed) ? seed : 1962); crt.reset();
        status.score = 0; C.round = 0; C.steps = aim.steps; C.stepsY = aim.stepsY; deal();
      },
      stop: () => { C.phase = "idle"; status.verb = ""; },
      act: () => {
        if (C.phase !== "play") return;
        const off = Math.abs(S.bright - C.tb) + Math.abs(S.contrast - C.tc), got = off === 0 ? 100 : off === 1 ? 50 : 0;
        status.score += got; if (got) out.cue("tap", 0.5); else out.flop();
        C.phase = "scan"; C.scan = host.still ? LINES : 0; C.wait = SHOW_S; status.verb = "";
      },
      update: (dt) => {
        const ds = aim.steps - C.steps, dy = aim.stepsY - C.stepsY;
        C.steps = aim.steps; C.stepsY = aim.stepsY;
        if (C.phase === "play") {
          if (ds) crt.setBright(Math.max(0, Math.min(LEVEL_MAX, S.bright + ds)));
          if (dy) crt.setContrast(Math.max(0, Math.min(LEVEL_MAX, S.contrast - dy)));
        } else if (C.phase === "scan") {
          C.scan = Math.min(LINES, C.scan + dt * SCAN_RATE);
          if ((C.wait -= dt) <= 0) { if (C.round >= ROUNDS) { C.phase = "done"; out.over(); out.onEnd(status.score); } else deal(); }
        }
      },
      draw: (ctx) => {
        ctx.fillStyle = INK.night; ctx.fillRect(0, 0, W, H);
        picture(ctx, 8, 14, 6, S.bright, S.contrast, C.phase === "scan" ? Math.floor(C.scan) : LINES);
        picture(ctx, 114, 14, 2, C.tb, C.tc, LINES);
        kit.text(ctx, "MATCH", 114, 42, TEXT.stone);
        kit.text(ctx, "B", 114, 60, TEXT.stone); kit.number(ctx, S.bright, 124, 60, TEXT.banana);
        kit.text(ctx, "C", 114, 72, TEXT.stone); kit.number(ctx, S.contrast, 124, 72, TEXT.banana);
        kit.centre(ctx, "SCAN LINES - MUSEUM TOY", 2, TEXT.teal);
        kit.text(ctx, "ROUND", 114, 90, TEXT.stone); kit.number(ctx, C.round, 148, 90, TEXT.banana);
      }
    };
  };

  games.crt = { ROWS, COLS, LINES, LEVEL_MAX, intensity, segments, create, terminal, make };
})();
