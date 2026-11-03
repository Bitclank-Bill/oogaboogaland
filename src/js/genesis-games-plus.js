// Genesis museum: more era games for the cartridge console, each a modern original museum game in the spirit of its
// gallery's years (not a game from them), played at its own cabinet beside the gallery's stage. Each follows
// retro-games.js's factory contract (make(host) → { start, act, stop, update, draw, playing, status, help, coach,
// stars, tickets }) on BL.retroGames.kit's 160x120 screen; update and draw allocate nothing and play runs on the
// kit's fixed step.
// - CARD PUNCH (Era 0): a punch head sweeps a card; Space punches; hit the lit holes, miss three times and it is over.
// - DIAL TONES (Era 3): a modem plays a tone pattern on four pads; play it back (A/D or a drag to choose, Space to
//   press); each round adds a tone.
// - HASH HUNT (Era 4): a counter runs and each number shows a toy fingerprint; stop it (Space) when the fingerprint
//   starts with 0, the idea behind proof-of-work stamps. A toy hash, not a secure one.
// - BLOCK BUILDER (Era 7): records fall in lanes; catch the good ones to fill a block (six make a block, which joins
//   the chain), let the broken red ones pass; three caught broken ones end the run.
(() => {
  "use strict";
  const BL = window.BL = window.BL || {};
  const HEX = "0123456789ABCDEF".split("");
  const fnv = (n, seed) => { let h = (0x811c9dc5 ^ seed) >>> 0; for (let k = 0; k < 4; k++) { h ^= (n >>> (k * 8)) & 255; h = Math.imul(h, 0x01000193) >>> 0; } return h; };
  const base = (host, label) => {
    const K = BL.retroGames.kit, out = K.hooks(host), J = K.juice(host), status = K.makeStatus(label), rng = K.rng();
    return { K, out, J, status, rng, aim: out.aim };
  };
  // The end of a run: the score kept, the console told once after a short beat.
  const ender = (B, S) => (won) => {
    S.phase = "end"; S.end = 1.4; B.status.verb = won ? "WELL DONE" : "GAME OVER";
    if (won) B.out.crack(true); else B.out.flop();
    B.out.cue(won ? "win" : "lose", 0.6); B.out.over();
  };
  const tickEnd = (B, S, dt) => { if (S.phase === "end" && !S.ended && (S.end -= dt) <= 0) { S.ended = 1; B.out.onEnd(B.status.score); } };

  // --- CARD PUNCH ---------------------------------------------------------------------------------------------------
  const punch = (host) => {
    const B = base(host, "Holes"), { K, out, J, status, rng } = B, { W, INK, TEXT, text, centre, number } = K;
    const COLS = 12, GOAL = 24, CW = 11, CX = (W - COLS * CW) >> 1, CY = 46;
    const lit = new Uint8Array(COLS), holes = new Uint8Array(COLS);
    const S = { phase: "idle", x: 0, dir: 1, speed: 4, lives: 3, done: 0, end: 0, ended: 0, flashCol: -1, flash: 0, seed: 1 };
    const finish = ender(B, S);
    // Two holes lit at a time, among those not punched yet (a fresh row once the card runs short).
    const light = () => {
      let n = 0, free = 0;
      for (let c = 0; c < COLS; c++) { n += lit[c]; free += !lit[c] && !holes[c] ? 1 : 0; }
      if (free < 2 - n) holes.fill(0);
      while (n < 2) { const c = rng.int(COLS); if (!lit[c] && !holes[c]) { lit[c] = 1; n++; } }
    };
    const step = (dt) => {
      if (S.phase === "play") {
        S.x += S.dir * S.speed * dt * (host.still ? 0.6 : 1);
        if (S.x >= COLS - 0.01) { S.x = COLS - 0.01; S.dir = -1; } else if (S.x <= 0) { S.x = 0; S.dir = 1; }
        S.flash = Math.max(0, S.flash - dt);
      }
      tickEnd(B, S, dt);
    };
    const run = K.stepper(step);
    const reset = () => { lit.fill(0); holes.fill(0); S.x = 0; S.dir = 1; S.speed = 4; S.lives = 3; S.done = 0; S.end = 0; S.ended = 0; S.flash = 0; status.score = 0; status.left = GOAL; status.verb = ""; J.reset(); };
    reset();
    return {
      kind: "punch", name: "Card Punch", status, roundLabel: "Card",
      help: "The punch head sweeps the card. Press Space (or tap) when it is over a lit hole. Three misses and the card is spoiled.",
      coach: ["Space punches the lit hole", "Tap to punch"], stars: [100, 250, 400], tickets: (s) => Math.floor(s / 80),
      get playing() { return S.phase === "play"; },
      start: (seed) => { S.seed = Number.isInteger(seed) ? seed >>> 0 : 1; rng.seed(S.seed); reset(); light(); S.phase = "play"; },
      stop: () => { S.phase = "idle"; reset(); },
      act: () => {
        if (S.phase !== "play") return;
        const c = Math.floor(S.x);
        S.flashCol = c; S.flash = 0.25;
        if (lit[c]) { lit[c] = 0; holes[c] = 1; S.done++; status.score += 10 + Math.floor(S.speed); status.left = GOAL - S.done; S.speed += 0.35; out.cue("tap", 0.5); J.shake(1); if (S.done >= GOAL) { finish(true); return; } light(); }
        else { S.lives--; out.cue("bump", 0.5); J.flash(INK.red, 0.4); if (S.lives <= 0) finish(false); }
      },
      update: (dt) => { J.update(dt); if (S.phase !== "idle") run(dt); },
      draw: (ctx) => {
        ctx.fillStyle = INK.night; ctx.fillRect(0, 0, W, 120);
        J.begin(ctx);
        ctx.fillStyle = INK.cream; ctx.fillRect(CX - 6, CY - 10, COLS * CW + 12, 34);
        ctx.fillStyle = INK.ochre; ctx.fillRect(CX - 6, CY - 10, 8, 8);
        for (let c = 0; c < COLS; c++) {
          ctx.fillStyle = holes[c] ? INK.night : lit[c] ? INK.banana : INK.stoneLt;
          ctx.fillRect(CX + c * CW + 3, CY, CW - 6, 12);
        }
        const hx = CX + Math.floor(S.x) * CW;
        ctx.fillStyle = S.flash > 0 ? INK.white : INK.rust; ctx.fillRect(hx + 1, CY - 22, CW - 2, 10);
        ctx.fillStyle = INK.stoneDk; ctx.fillRect(hx + 4, CY - 12, CW - 8, 10);
        J.end(ctx);
        text(ctx, "CARD PUNCH", 4, 3, TEXT.bone);
        number(ctx, host.best || 0, W - 4, 3, TEXT.gold, 1, 2, 3);
        text(ctx, "LIVES", 4, 96, TEXT.stone); number(ctx, S.lives, 40, 96, TEXT.red);
        text(ctx, "HOLES", 92, 96, TEXT.stone); number(ctx, S.done, 150, 96, TEXT.banana, 1, 2);
        if (S.phase === "idle") centre(ctx, "PRESS START", 110, TEXT.banana);
        else if (S.phase === "end") centre(ctx, status.verb, 110, S.done >= GOAL ? TEXT.teal : TEXT.red);
        else centre(ctx, "PUNCH THE LIT HOLES", 110, TEXT.teal);
      }
    };
  };

  // --- DIAL TONES ---------------------------------------------------------------------------------------------------
  const dial = (host) => {
    const B = base(host, "Round"), { K, out, J, status, rng, aim } = B, { W, INK, TEXT, text, centre, number } = K;
    const PADS = 4, MAXLEN = 16, PAD_INK = [INK.red, INK.sky, INK.banana, INK.lime], PW = 30, PX = (W - PADS * (PW + 6) + 6) >> 1, PY = 40;
    const seq = new Uint8Array(MAXLEN);
    const S = { phase: "idle", len: 0, show: 0, showT: 0, input: 0, cur: 0, steps: 0, glow: -1, glowT: 0, end: 0, ended: 0, seed: 1 };
    const finish = ender(B, S);
    const play = () => { S.phase = "show"; S.show = 0; S.showT = 0.7; S.input = 0; };
    const step = (dt) => {
      S.glowT = Math.max(0, S.glowT - dt);
      if (S.glowT === 0) S.glow = -1;
      if (S.phase === "show") {
        if ((S.showT -= dt * (host.still ? 0.7 : 1)) <= 0) {
          if (S.show < S.len) { S.glow = seq[S.show++]; S.glowT = 0.4; S.showT = 0.6; out.cue("tap", 0.3 + S.glow * 0.1); }
          else S.phase = "you";
        }
      }
      tickEnd(B, S, dt);
    };
    const run = K.stepper(step);
    const reset = () => { S.len = 0; S.cur = 0; S.steps = aim.steps; S.glow = -1; S.end = 0; S.ended = 0; status.score = 0; status.round = 1; status.verb = ""; J.reset(); };
    reset();
    return {
      kind: "dial", name: "Dial Tones", aims: true, status, roundLabel: "Round",
      help: "Watch the modem play its tones, then play them back: A and D (or a drag) choose a pad, Space presses it. Each round adds a tone.",
      coach: ["A and D choose, Space presses", "Drag to a pad, tap to press"], stars: [300, 600, 1000], tickets: (s) => Math.floor(s / 150),
      get playing() { return S.phase === "show" || S.phase === "you"; },
      start: (seed) => { S.seed = Number.isInteger(seed) ? seed >>> 0 : 1; rng.seed(S.seed); reset(); seq[0] = rng.int(PADS); seq[1] = rng.int(PADS); S.len = 2; play(); },
      stop: () => { S.phase = "idle"; reset(); },
      act: () => {
        if (S.phase !== "you") return;
        S.glow = S.cur; S.glowT = 0.25;
        if (seq[S.input] !== S.cur) { out.cue("bump", 0.5); J.flash(INK.red, 0.5); finish(false); return; }
        out.cue("tap", 0.3 + S.cur * 0.1);
        if (++S.input >= S.len) {
          status.score += S.len * 50; status.round = S.len - 1; J.shake(1);
          if (S.len >= MAXLEN) { finish(true); return; }
          seq[S.len++] = rng.int(PADS); play();
        }
      },
      update: (dt) => {
        J.update(dt);
        if (aim.steps !== S.steps) { S.cur = Math.max(0, Math.min(PADS - 1, S.cur + (aim.steps - S.steps))); S.steps = aim.steps; }
        if (S.phase !== "idle") run(dt);
      },
      draw: (ctx) => {
        ctx.fillStyle = INK.night; ctx.fillRect(0, 0, W, 120);
        J.begin(ctx);
        for (let p = 0; p < PADS; p++) {
          const x = PX + p * (PW + 6);
          ctx.fillStyle = INK.deep; ctx.fillRect(x - 2, PY - 2, PW + 4, PW + 4);
          ctx.fillStyle = S.glow === p ? INK.white : PAD_INK[p]; ctx.globalAlpha = S.glow === p ? 1 : 0.55; ctx.fillRect(x, PY, PW, PW); ctx.globalAlpha = 1;
          if (S.phase === "you" && S.cur === p) { ctx.fillStyle = INK.teal; ctx.fillRect(x, PY + PW + 5, PW, 3); }
        }
        J.end(ctx);
        text(ctx, "DIAL TONES", 4, 3, TEXT.bone);
        number(ctx, host.best || 0, W - 4, 3, TEXT.gold, 1, 2, 3);
        text(ctx, "TONES", 4, 92, TEXT.stone); number(ctx, S.len, 40, 92, TEXT.banana);
        if (S.phase === "idle") centre(ctx, "PRESS START", 110, TEXT.banana);
        else if (S.phase === "show") centre(ctx, "LISTEN", 110, TEXT.sky);
        else if (S.phase === "you") centre(ctx, "PLAY IT BACK", 110, TEXT.teal);
        else centre(ctx, status.verb, 110, TEXT.red);
      }
    };
  };

  // --- HASH HUNT ----------------------------------------------------------------------------------------------------
  const hash = (host) => {
    const B = base(host, "Stamps"), { K, out, J, status, rng } = B, { W, INK, TEXT, text, centre, number } = K;
    const GOAL = 8, TIME = 45;
    const S = { phase: "idle", nonce: 0, acc: 0, rate: 9, h: 0, lives: 3, found: 0, time: TIME, end: 0, ended: 0, seed: 1, ok: 0 };
    const finish = ender(B, S);
    const step = (dt) => {
      if (S.phase === "play") {
        S.time -= dt;
        S.acc += dt * S.rate * (host.still ? 0.6 : 1);
        while (S.acc >= 1) { S.acc -= 1; S.nonce++; S.h = fnv(S.nonce, S.seed); }
        S.ok = Math.max(0, S.ok - dt);
        if (S.time <= 0) { S.time = 0; finish(S.found >= GOAL / 2); }
      }
      tickEnd(B, S, dt);
    };
    const run = K.stepper(step);
    const reset = () => { S.nonce = 0; S.acc = 0; S.rate = 9; S.lives = 3; S.found = 0; S.time = TIME; S.end = 0; S.ended = 0; S.ok = 0; status.score = 0; status.left = GOAL; status.verb = ""; S.h = fnv(0, S.seed); J.reset(); };
    reset();
    return {
      kind: "hash", name: "Hash Hunt", status, roundLabel: "Stamp",
      help: "The counter runs and every number gets a toy fingerprint. Press Space (or tap) when the fingerprint starts with 0. Eight stamps before time runs out.",
      coach: ["Space when it starts with 0", "Tap when it starts with 0"], stars: [300, 600, 900], tickets: (s) => Math.floor(s / 120),
      get playing() { return S.phase === "play"; },
      start: (seed) => { S.seed = Number.isInteger(seed) ? seed >>> 0 : 1; rng.seed(S.seed); reset(); S.phase = "play"; },
      stop: () => { S.phase = "idle"; reset(); },
      act: () => {
        if (S.phase !== "play") return;
        if ((S.h >>> 28) === 0) {
          S.found++; status.score += 100 + Math.ceil(S.time); status.left = GOAL - S.found; S.ok = 0.5; S.rate += 1.5; out.cue("tap", 0.6); J.shake(1.5);
          S.nonce += 1; S.h = fnv(S.nonce, S.seed);
          if (S.found >= GOAL) finish(true);
        } else { S.lives--; out.cue("bump", 0.5); J.flash(INK.red, 0.4); if (S.lives <= 0) finish(false); }
      },
      update: (dt) => { J.update(dt); if (S.phase !== "idle") run(dt); },
      draw: (ctx) => {
        ctx.fillStyle = INK.night; ctx.fillRect(0, 0, W, 120);
        J.begin(ctx);
        text(ctx, "NUMBER", 20, 34, TEXT.stone); number(ctx, S.nonce, 140, 34, TEXT.bone, 1, 2, 5);
        text(ctx, "FINGERPRINT", 20, 54, TEXT.stone);
        for (let k = 0; k < 4; k++) text(ctx, HEX[(S.h >>> (28 - k * 4)) & 15], 50 + k * 16, 68, k === 0 && (S.h >>> 28) === 0 ? TEXT.lime : TEXT.banana, 2);
        if (S.ok > 0) { ctx.fillStyle = INK.lime; ctx.fillRect(20, 86, 120, 2); }
        J.end(ctx);
        text(ctx, "HASH HUNT", 4, 3, TEXT.bone);
        number(ctx, host.best || 0, W - 4, 3, TEXT.gold, 1, 2, 3);
        text(ctx, "TIME", 4, 14, TEXT.stone); number(ctx, Math.ceil(S.time), 40, 14, TEXT.sky);
        text(ctx, "STAMPS", 92, 14, TEXT.stone); number(ctx, S.found, 156, 14, TEXT.lime, 1, 2);
        if (S.phase === "idle") centre(ctx, "PRESS START", 110, TEXT.banana);
        else if (S.phase === "end") centre(ctx, status.verb, 110, S.found >= GOAL / 2 ? TEXT.teal : TEXT.red);
        else centre(ctx, "STOP IT ON A 0", 110, TEXT.teal);
      }
    };
  };

  // --- BLOCK BUILDER ------------------------------------------------------------------------------------------------
  const builder = (host) => {
    const B = base(host, "Blocks"), { K, out, J, status, rng, aim } = B, { W, INK, TEXT, text, centre, number } = K;
    const LANES = 6, LW = 22, LX = (W - LANES * LW) >> 1, CAP = 8, FILL = 6, TIME = 60, FLOOR = 92;
    const lane = new Uint8Array(CAP), bad = new Uint8Array(CAP), live = new Uint8Array(CAP), y = new Float32Array(CAP);
    const S = { phase: "idle", cur: 2, steps: 0, spawn: 0, fill: 0, chain: 0, lives: 3, time: TIME, end: 0, ended: 0, seed: 1, speed: 26 };
    const finish = ender(B, S);
    const spawn = () => { for (let i = 0; i < CAP; i++) if (!live[i]) { live[i] = 1; lane[i] = rng.int(LANES); bad[i] = rng.chance(0.28) ? 1 : 0; y[i] = 22; return; } };
    const step = (dt) => {
      if (S.phase === "play") {
        S.time -= dt;
        if ((S.spawn -= dt) <= 0) { spawn(); S.spawn = 0.9 - Math.min(0.5, S.chain * 0.05); }
        for (let i = 0; i < CAP; i++) {
          if (!live[i]) continue;
          y[i] += S.speed * dt * (host.still ? 0.6 : 1);
          if (y[i] < FLOOR) continue;
          live[i] = 0;
          if (lane[i] !== S.cur) continue;
          if (bad[i]) { S.lives--; out.cue("bump", 0.5); J.flash(INK.red, 0.4); if (S.lives <= 0) { finish(false); return; } }
          else { S.fill++; status.score += 10; out.cue("tap", 0.4); if (S.fill >= FILL) { S.fill = 0; S.chain++; status.score += 100; S.speed += 3; J.shake(1.5); out.popup && out.popup("BLOCK", true); } }
        }
        if (S.time <= 0) { S.time = 0; finish(S.chain >= 3); }
      }
      tickEnd(B, S, dt);
    };
    const run = K.stepper(step);
    const reset = () => { live.fill(0); S.cur = 2; S.steps = aim.steps; S.spawn = 0.4; S.fill = 0; S.chain = 0; S.lives = 3; S.time = TIME; S.end = 0; S.ended = 0; S.speed = 26; status.score = 0; status.verb = ""; J.reset(); };
    reset();
    return {
      kind: "builder", name: "Block Builder", aims: true, status, roundLabel: "Block",
      help: "Records fall in six lanes. A and D (or a drag) move your block under the good ones; let the red broken ones pass. Six records make a block on the chain.",
      coach: ["A and D move under good records", "Drag under the good records"], stars: [300, 700, 1200], tickets: (s) => Math.floor(s / 150),
      get playing() { return S.phase === "play"; },
      start: (seed) => { S.seed = Number.isInteger(seed) ? seed >>> 0 : 1; rng.seed(S.seed); reset(); S.phase = "play"; },
      stop: () => { S.phase = "idle"; reset(); },
      act: () => {},
      update: (dt) => {
        J.update(dt);
        if (aim.steps !== S.steps) { S.cur = Math.max(0, Math.min(LANES - 1, S.cur + (aim.steps - S.steps))); S.steps = aim.steps; }
        if (S.phase !== "idle") run(dt);
      },
      draw: (ctx) => {
        ctx.fillStyle = INK.night; ctx.fillRect(0, 0, W, 120);
        J.begin(ctx);
        for (let l = 0; l < LANES; l++) { ctx.fillStyle = l % 2 ? INK.deep : INK.cave; ctx.fillRect(LX + l * LW, 20, LW, FLOOR - 16); }
        for (let i = 0; i < CAP; i++) if (live[i]) { ctx.fillStyle = bad[i] ? INK.red : INK.lime; ctx.fillRect(LX + lane[i] * LW + 6, Math.floor(y[i]), LW - 12, 6); }
        ctx.fillStyle = INK.gold; ctx.fillRect(LX + S.cur * LW + 2, FLOOR + 2, LW - 4, 6);
        ctx.fillStyle = INK.lime; ctx.fillRect(LX + S.cur * LW + 2, FLOOR + 2, Math.round((LW - 4) * S.fill / FILL), 6);
        for (let c = 0; c < Math.min(S.chain, 12); c++) { ctx.fillStyle = INK.ember; ctx.fillRect(6 + c * 12, 13, 9, 5); if (c) { ctx.fillStyle = INK.stone; ctx.fillRect(3 + c * 12, 15, 3, 1); } }
        J.end(ctx);
        text(ctx, "BLOCK BUILDER", 4, 3, TEXT.bone);
        number(ctx, host.best || 0, W - 4, 3, TEXT.gold, 1, 2, 3);
        text(ctx, "TIME", 4, 104, TEXT.stone); number(ctx, Math.ceil(S.time), 34, 104, TEXT.sky);
        text(ctx, "LIVES", 112, 104, TEXT.stone); number(ctx, S.lives, 156, 104, TEXT.red, 1, 2);
        if (S.phase === "idle") centre(ctx, "PRESS START", 112, TEXT.banana);
        else if (S.phase === "end") centre(ctx, status.verb, 112, S.chain >= 3 ? TEXT.teal : TEXT.red);
      }
    };
  };

  // --- POCKET ROUTE (Era 4's handheld maze, on the big screen) -------------------------------------------------------
  // The exhibit's own maze first, then bigger ones carved from the run's seed; arrows or W A S D move a square at a
  // time, on a green handheld screen. Five mazes against a 90 s clock.
  const FIRST = ["#########", "#...#...#", "###.#.#.#", "#...#.#.#", "#.###.#.#", "#.....#.#", "#########"];
  const pocket = (host) => {
    const B = base(host, "Mazes"), { K, out, J, status, rng, aim } = B, { W, INK, TEXT, text, centre, number } = K;
    const MAXW = 21, MAXH = 15, LEVELS = 5, TIME = 90, LCD = "#a8c45a", LCD_DK = "#2f4a1c", LCD_MID = "#6f8f3a";
    const grid = new Uint8Array(MAXW * MAXH), stack = new Int16Array(MAXW * MAXH * 2);
    const S = { phase: "idle", w: 9, h: 7, x: 1, y: 1, ex: 7, ey: 5, level: 0, moves: 0, time: TIME, steps: 0, stepsY: 0, end: 0, ended: 0, seed: 1, cell: 12, ox: 0, oy: 0, win: 0 };
    const finish = ender(B, S);
    // Carves a maze w x h (odd) by a seeded depth-first walk from (1, 1); the exit is the far corner.
    const carve = (w, h) => {
      grid.fill(1);
      let sp = 0;
      grid[1 * MAXW + 1] = 0; stack[sp++] = 1; stack[sp++] = 1;
      while (sp > 0) {
        const cx = stack[sp - 2], cy = stack[sp - 1];
        let opts = 0, pick = -1;
        for (let d = 0; d < 4; d++) {
          const nx = cx + (d === 0 ? 2 : d === 1 ? -2 : 0), ny = cy + (d === 2 ? 2 : d === 3 ? -2 : 0);
          if (nx > 0 && ny > 0 && nx < w - 1 && ny < h - 1 && grid[ny * MAXW + nx]) { opts++; if (rng.int(opts) === 0) pick = d; }
        }
        if (pick < 0) { sp -= 2; continue; }
        const nx = cx + (pick === 0 ? 2 : pick === 1 ? -2 : 0), ny = cy + (pick === 2 ? 2 : pick === 3 ? -2 : 0);
        grid[((cy + ny) >> 1) * MAXW + ((cx + nx) >> 1)] = 0; grid[ny * MAXW + nx] = 0;
        stack[sp++] = nx; stack[sp++] = ny;
      }
    };
    const load = (level) => {
      S.level = level;
      if (level === 0) { S.w = 9; S.h = 7; grid.fill(1); for (let y = 0; y < 7; y++) for (let x = 0; x < 9; x++) grid[y * MAXW + x] = FIRST[y][x] === "#" ? 1 : 0; S.ex = 7; S.ey = 5; }
      else { S.w = Math.min(MAXW, 9 + level * 3) | 1; S.h = Math.min(MAXH, 7 + level * 2) | 1; carve(S.w, S.h); S.ex = S.w - 2; S.ey = S.h - 2; }
      S.x = 1; S.y = 1;
      S.cell = Math.max(5, Math.min(Math.floor(150 / S.w), Math.floor(84 / S.h)));
      S.ox = (W - S.w * S.cell) >> 1; S.oy = 18 + ((86 - S.h * S.cell) >> 1);
      status.round = level + 1;
    };
    const move = (dx, dy) => {
      const nx = S.x + dx, ny = S.y + dy;
      if (grid[ny * MAXW + nx]) { out.cue("bump", 0.25); return; }
      S.x = nx; S.y = ny; S.moves++; out.cue("tap", 0.2);
      if (S.x === S.ex && S.y === S.ey) {
        status.score += 200 + Math.ceil(S.time);
        J.shake(1.2); out.cue("win", 0.4);
        if (S.level + 1 >= LEVELS) { S.win = 1; finish(true); } else load(S.level + 1);
      }
    };
    const step = (dt) => {
      if (S.phase === "play") { S.time -= dt; if (S.time <= 0) { S.time = 0; finish(S.level >= 2); } }
      tickEnd(B, S, dt);
    };
    const run = K.stepper(step);
    const reset = () => { S.moves = 0; S.time = TIME; S.end = 0; S.ended = 0; S.win = 0; S.steps = aim.steps; S.stepsY = aim.stepsY; status.score = 0; status.verb = ""; load(0); J.reset(); };
    reset();
    return {
      kind: "pocket", name: "Pocket Route", aims: true, status, roundLabel: "Maze",
      help: "You are the @. The arrows or W A S D move a square at a time; reach the + exit. Five mazes, each bigger, before the clock runs out.",
      coach: ["Arrows or W A S D move, reach the +", "Swipe to move, reach the +"], stars: [600, 1000, 1400], tickets: (s) => Math.floor(s / 200),
      get playing() { return S.phase === "play"; },
      start: (seed) => { S.seed = Number.isInteger(seed) ? seed >>> 0 : 1; rng.seed(S.seed); reset(); S.phase = "play"; },
      stop: () => { S.phase = "idle"; reset(); },
      act: () => {},
      update: (dt) => {
        J.update(dt);
        if (S.phase === "play") {
          while (aim.steps !== S.steps) { const d = aim.steps > S.steps ? 1 : -1; S.steps += d; move(d, 0); if (S.phase !== "play") { S.steps = aim.steps; break; } }
          while (aim.stepsY !== S.stepsY) { const d = aim.stepsY > S.stepsY ? 1 : -1; S.stepsY += d; move(0, d); if (S.phase !== "play") { S.stepsY = aim.stepsY; break; } }
        } else { S.steps = aim.steps; S.stepsY = aim.stepsY; }
        if (S.phase !== "idle") run(dt);
      },
      draw: (ctx) => {
        ctx.fillStyle = "#1c2412"; ctx.fillRect(0, 0, W, 120);
        ctx.fillStyle = LCD; ctx.fillRect(4, 14, W - 8, 92);
        J.begin(ctx);
        const c = S.cell;
        for (let y = 0; y < S.h; y++) for (let x = 0; x < S.w; x++) if (grid[y * MAXW + x]) { ctx.fillStyle = LCD_DK; ctx.fillRect(S.ox + x * c, S.oy + y * c, c, c); }
        ctx.fillStyle = LCD_MID; ctx.fillRect(S.ox + S.ex * c + 1, S.oy + S.ey * c + 1, c - 2, c - 2);
        ctx.fillStyle = LCD_DK; ctx.fillRect(S.ox + S.ex * c + (c >> 1) - 1, S.oy + S.ey * c + 2, 2, c - 4); ctx.fillRect(S.ox + S.ex * c + 2, S.oy + S.ey * c + (c >> 1) - 1, c - 4, 2);
        ctx.fillStyle = "#14200c"; ctx.fillRect(S.ox + S.x * c + 1, S.oy + S.y * c + 1, c - 2, c - 2);
        ctx.fillStyle = LCD; ctx.fillRect(S.ox + S.x * c + (c >> 1) - 1, S.oy + S.y * c + (c >> 1) - 1, 2, 2);
        J.end(ctx);
        text(ctx, "POCKET ROUTE", 4, 3, TEXT.lime);
        number(ctx, host.best || 0, W - 4, 3, TEXT.gold, 1, 2, 3);
        text(ctx, "MAZE", 4, 109, TEXT.stone); number(ctx, S.level + 1, 30, 109, TEXT.lime);
        text(ctx, "TIME", 104, 109, TEXT.stone); number(ctx, Math.ceil(S.time), 156, 109, TEXT.sky, 1, 2);
        if (S.phase === "idle") centre(ctx, "PRESS START", 60, TEXT.night);
        else if (S.phase === "end") centre(ctx, status.verb, 60, TEXT.night);
      }
    };
  };
  // --- SWITCHBOARD (Era 1) ------------------------------------------------------------------------------------------
  // A board of 4 x 3 jacks; calls light up and wait a few seconds. Move the cord (arrows or W A S D) to a lit jack and
  // press Space to connect it. A call left too long is lost; lose five and the shift is over. 75 s.
  const switchboard = (host) => {
    const B = base(host, "Calls"), { K, out, J, status, rng, aim } = B, { W, INK, TEXT, text, centre, number } = K;
    const COLS = 4, ROWS = 3, N = COLS * ROWS, WAIT = 5, TIME = 75, JW = 30, JH = 22, JX = (W - COLS * JW) >> 1, JY = 24;
    const wait = new Float32Array(N);
    const S = { phase: "idle", cx: 0, cy: 0, steps: 0, stepsY: 0, spawn: 0, lost: 0, time: TIME, end: 0, ended: 0, seed: 1, done: 0 };
    const finish = ender(B, S);
    const step = (dt) => {
      if (S.phase === "play") {
        S.time -= dt;
        if ((S.spawn -= dt) <= 0) { const k = rng.int(N); if (wait[k] <= 0) wait[k] = WAIT - Math.min(2, S.done * 0.06); S.spawn = 1.4 - Math.min(0.8, S.done * 0.03); }
        for (let k = 0; k < N; k++) if (wait[k] > 0 && (wait[k] -= dt * (host.still ? 0.6 : 1)) <= 0) { wait[k] = 0; S.lost++; out.cue("bump", 0.4); J.flash(INK.red, 0.3); if (S.lost >= 5) { finish(S.done >= 20); return; } }
        if (S.time <= 0) { S.time = 0; finish(S.done >= 20); }
      }
      tickEnd(B, S, dt);
    };
    const run = K.stepper(step);
    const reset = () => { wait.fill(0); S.cx = S.cy = 0; S.steps = aim.steps; S.stepsY = aim.stepsY; S.spawn = 0.5; S.lost = 0; S.time = TIME; S.end = 0; S.ended = 0; S.done = 0; status.score = 0; status.verb = ""; J.reset(); };
    reset();
    return {
      kind: "switchboard", name: "Switchboard", aims: true, status, roundLabel: "Shift",
      help: "Calls light up on the board. Move the cord with the arrows or W A S D and press Space on a lit jack to connect it before it rings off.",
      coach: ["Arrows move the cord, Space connects", "Tap a lit jack"], stars: [200, 400, 650], tickets: (s) => Math.floor(s / 100),
      get playing() { return S.phase === "play"; },
      start: (seed) => { S.seed = Number.isInteger(seed) ? seed >>> 0 : 1; rng.seed(S.seed); reset(); S.phase = "play"; },
      stop: () => { S.phase = "idle"; reset(); },
      act: () => {
        if (S.phase !== "play") return;
        const k = S.cy * COLS + S.cx;
        if (wait[k] > 0) { status.score += 10 + Math.ceil(wait[k] * 4); wait[k] = 0; S.done++; out.cue("tap", 0.5); J.shake(1); }
        else out.cue("bump", 0.2);
      },
      update: (dt) => {
        J.update(dt);
        if (aim.steps !== S.steps) { S.cx = Math.max(0, Math.min(COLS - 1, S.cx + (aim.steps - S.steps))); S.steps = aim.steps; }
        if (aim.stepsY !== S.stepsY) { S.cy = Math.max(0, Math.min(ROWS - 1, S.cy + (aim.stepsY - S.stepsY))); S.stepsY = aim.stepsY; }
        if (S.phase !== "idle") run(dt);
      },
      draw: (ctx) => {
        ctx.fillStyle = INK.earthDk; ctx.fillRect(0, 0, W, 120);
        J.begin(ctx);
        ctx.fillStyle = INK.husk; ctx.fillRect(JX - 6, JY - 6, COLS * JW + 12, ROWS * JH + 12);
        for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
          const k = r * COLS + c, x = JX + c * JW, y = JY + r * JH, lit = wait[k] > 0;
          ctx.fillStyle = lit ? (wait[k] < 1.5 && (Math.floor(wait[k] * 6) & 1) ? INK.red : INK.banana) : INK.huskDk; ctx.fillRect(x + 10, y + 2, 10, 6);
          ctx.fillStyle = INK.charcoal; ctx.fillRect(x + 12, y + 11, 6, 6);
          if (c === S.cx && r === S.cy) { ctx.fillStyle = INK.teal; ctx.fillRect(x + 6, y + 18, 18, 2); ctx.fillRect(x + 14, y + 14, 2, 4); }
        }
        J.end(ctx);
        text(ctx, "SWITCHBOARD", 4, 3, TEXT.bone);
        number(ctx, host.best || 0, W - 4, 3, TEXT.gold, 1, 2, 3);
        text(ctx, "CALLS", 4, 98, TEXT.stone); number(ctx, S.done, 40, 98, TEXT.banana);
        text(ctx, "LOST", 60, 98, TEXT.stone); number(ctx, S.lost, 88, 98, TEXT.red);
        text(ctx, "TIME", 108, 98, TEXT.stone); number(ctx, Math.ceil(S.time), 156, 98, TEXT.sky, 1, 2);
        if (S.phase === "idle") centre(ctx, "PRESS START", 110, TEXT.banana);
        else if (S.phase === "end") centre(ctx, status.verb, 110, S.done >= 20 ? TEXT.teal : TEXT.red);
        else centre(ctx, "CONNECT THE LIT CALLS", 110, TEXT.teal);
      }
    };
  };

  // --- CODE BREAKER (Era 2) ------------------------------------------------------------------------------------------
  // A hidden code of four symbols from six. Set each slot (A/D chooses the slot, W/S the symbol) and press Space to
  // try it: a gold mark for each symbol in its place, a white mark for each right symbol in the wrong place. Eight
  // tries a code; three codes a run.
  const breaker = (host) => {
    const B = base(host, "Codes"), { K, out, J, status, rng, aim } = B, { W, INK, TEXT, text, centre, number } = K;
    const SLOTS = 4, SYMS = 6, TRIES = 8, CODES = 3, SYM_INK = [INK.red, INK.banana, INK.lime, INK.sky, INK.violet, INK.ember];
    const code = new Uint8Array(SLOTS), guess = new Uint8Array(SLOTS), rows = new Uint8Array(TRIES * SLOTS), gold = new Uint8Array(TRIES), white = new Uint8Array(TRIES);
    const used = new Uint8Array(SYMS), want = new Uint8Array(SYMS);
    const S = { phase: "idle", slot: 0, steps: 0, stepsY: 0, tries: 0, codes: 0, end: 0, ended: 0, seed: 1, solved: 0 };
    const finish = ender(B, S);
    const newCode = () => { for (let i = 0; i < SLOTS; i++) code[i] = rng.int(SYMS); guess.fill(0); S.tries = 0; S.slot = 0; };
    const step = (dt) => tickEnd(B, S, dt);
    const run = K.stepper(step);
    const reset = () => { S.steps = aim.steps; S.stepsY = aim.stepsY; S.codes = 0; S.solved = 0; S.end = 0; S.ended = 0; status.score = 0; status.verb = ""; status.round = 1; newCode(); J.reset(); };
    reset();
    return {
      kind: "breaker", name: "Code Breaker", aims: true, status, roundLabel: "Code",
      help: "Crack the four-symbol code. A and D choose a slot, W and S change its symbol, Space tries it. Gold: right symbol, right place. White: right symbol, wrong place.",
      coach: ["A D slot, W S symbol, Space tries", "Tap a slot to change it, tap TRY"], stars: [300, 700, 1100], tickets: (s) => Math.floor(s / 150),
      get playing() { return S.phase === "play"; },
      start: (seed) => { S.seed = Number.isInteger(seed) ? seed >>> 0 : 1; rng.seed(S.seed); reset(); S.phase = "play"; },
      stop: () => { S.phase = "idle"; reset(); },
      act: () => {
        if (S.phase !== "play") return;
        let g = 0, w = 0;
        used.fill(0); want.fill(0);
        for (let i = 0; i < SLOTS; i++) { rows[S.tries * SLOTS + i] = guess[i]; if (guess[i] === code[i]) g++; else { used[guess[i]]++; want[code[i]]++; } }
        for (let k = 0; k < SYMS; k++) w += Math.min(used[k], want[k]);
        gold[S.tries] = g; white[S.tries] = w; S.tries++;
        out.cue(g === SLOTS ? "win" : "tap", 0.4);
        if (g === SLOTS) {
          status.score += (TRIES - S.tries + 1) * 100; S.solved++; S.codes++; status.round = S.codes + 1; J.shake(1.5);
          if (S.codes >= CODES) { finish(true); return; }
          newCode();
        } else if (S.tries >= TRIES) { S.codes++; status.round = S.codes + 1; J.flash(INK.red, 0.3); if (S.codes >= CODES) { finish(S.solved >= 2); return; } newCode(); }
      },
      update: (dt) => {
        J.update(dt);
        if (S.phase === "play") {
          if (aim.steps !== S.steps) { S.slot = Math.max(0, Math.min(SLOTS - 1, S.slot + (aim.steps - S.steps))); S.steps = aim.steps; }
          if (aim.stepsY !== S.stepsY) { guess[S.slot] = (guess[S.slot] + SYMS * 4 + (S.stepsY - aim.stepsY)) % SYMS; S.stepsY = aim.stepsY; }
        } else { S.steps = aim.steps; S.stepsY = aim.stepsY; }
        if (S.phase !== "idle") run(dt);
      },
      draw: (ctx) => {
        ctx.fillStyle = INK.night; ctx.fillRect(0, 0, W, 120);
        J.begin(ctx);
        const first = Math.max(0, S.tries - 6);
        for (let t = first; t < S.tries; t++) {
          const y = 14 + (t - first) * 11;
          for (let i = 0; i < SLOTS; i++) { ctx.fillStyle = SYM_INK[rows[t * SLOTS + i]]; ctx.fillRect(30 + i * 14, y, 9, 8); }
          for (let m = 0; m < gold[t] + white[t]; m++) { ctx.fillStyle = m < gold[t] ? INK.gold : INK.bone; ctx.fillRect(96 + m * 6, y + 2, 4, 4); }
        }
        for (let i = 0; i < SLOTS; i++) { ctx.fillStyle = SYM_INK[guess[i]]; ctx.fillRect(30 + i * 14, 88, 9, 9); if (i === S.slot && S.phase === "play") { ctx.fillStyle = INK.teal; ctx.fillRect(30 + i * 14, 99, 9, 2); } }
        J.end(ctx);
        text(ctx, "CODE BREAKER", 4, 3, TEXT.bone);
        number(ctx, host.best || 0, W - 4, 3, TEXT.gold, 1, 2, 3);
        text(ctx, "TRY", 96, 90, TEXT.stone); number(ctx, S.tries + 1, 120, 90, TEXT.banana); text(ctx, "/8", 128, 90, TEXT.stone);
        if (S.phase === "idle") centre(ctx, "PRESS START", 110, TEXT.banana);
        else if (S.phase === "end") centre(ctx, status.verb, 110, S.solved >= 2 ? TEXT.teal : TEXT.red);
        else centre(ctx, "SPACE TRIES THE CODE", 110, TEXT.teal);
      }
    };
  };

  // --- SPAM SORTER (Era 5) -------------------------------------------------------------------------------------------
  // Mail drops down the middle: a letter (keep: steer it left, to the inbox) or junk with its stars and shouting
  // (steer it right, to the bin). A and D steer the falling one; it lands where it is when it reaches the bottom.
  const sorter = (host) => {
    const B = base(host, "Mail"), { K, out, J, status, rng, aim } = B, { W, INK, TEXT, text, centre, number } = K;
    const TIME = 60, FLOOR = 88;
    const S = { phase: "idle", x: 80, y: 18, junk: 0, steps: 0, speed: 22, right: 0, wrong: 0, time: TIME, end: 0, ended: 0, seed: 1, flash: 0, ok: 0 };
    const finish = ender(B, S);
    const drop = () => { S.x = 80; S.y = 18; S.junk = rng.chance(0.5) ? 1 : 0; };
    const step = (dt) => {
      if (S.phase === "play") {
        S.time -= dt; S.flash = Math.max(0, S.flash - dt);
        S.y += S.speed * dt * (host.still ? 0.6 : 1);
        if (S.y >= FLOOR) {
          const toBin = S.x > 80, ok = toBin === !!S.junk;
          if (ok) { S.right++; status.score += 25; S.speed += 1.2; out.cue("tap", 0.4); } else { S.wrong++; out.cue("bump", 0.5); J.flash(INK.red, 0.3); }
          S.ok = ok ? 1 : -1; S.flash = 0.4;
          if (S.wrong >= 5) { finish(S.right >= 25); return; }
          drop();
        }
        if (S.time <= 0) { S.time = 0; finish(S.right >= 25); }
      }
      tickEnd(B, S, dt);
    };
    const run = K.stepper(step);
    const reset = () => { S.steps = aim.steps; S.speed = 22; S.right = 0; S.wrong = 0; S.time = TIME; S.end = 0; S.ended = 0; S.flash = 0; status.score = 0; status.verb = ""; drop(); J.reset(); };
    reset();
    return {
      kind: "sorter", name: "Spam Sorter", aims: true, status, roundLabel: "Day",
      help: "Mail falls down the middle. Steer letters left into the inbox and junk (stars and shouting) right into the bin, with A and D or a drag.",
      coach: ["A sends left, D sends right", "Drag left or right"], stars: [400, 750, 1100], tickets: (s) => Math.floor(s / 150),
      get playing() { return S.phase === "play"; },
      start: (seed) => { S.seed = Number.isInteger(seed) ? seed >>> 0 : 1; rng.seed(S.seed); reset(); S.phase = "play"; },
      stop: () => { S.phase = "idle"; reset(); },
      act: () => {},
      update: (dt) => {
        J.update(dt);
        if (aim.steps !== S.steps) { if (S.phase === "play") S.x = aim.steps > S.steps ? 124 : 36; S.steps = aim.steps; }
        if (S.phase !== "idle") run(dt);
      },
      draw: (ctx) => {
        ctx.fillStyle = INK.deep; ctx.fillRect(0, 0, W, 120);
        J.begin(ctx);
        ctx.fillStyle = INK.sky; ctx.fillRect(10, FLOOR + 4, 52, 10); ctx.fillStyle = INK.rust; ctx.fillRect(98, FLOOR + 4, 52, 10);
        const x = Math.round(S.x) - 12, y = Math.round(S.y) - 8;
        ctx.fillStyle = S.junk ? INK.pink : INK.cream; ctx.fillRect(x, y, 24, 16);
        ctx.fillStyle = INK.charcoal; ctx.fillRect(x, y, 24, 1); ctx.fillRect(x + 4, y + 2, 8, 1); ctx.fillRect(x + 12, y + 2, 8, 1);
        if (S.junk) { ctx.fillStyle = INK.banana; ctx.fillRect(x + 3, y + 6, 4, 4); ctx.fillRect(x + 10, y + 7, 4, 4); ctx.fillRect(x + 17, y + 6, 4, 4); }
        else { ctx.fillStyle = INK.stoneDk; ctx.fillRect(x + 4, y + 7, 16, 1); ctx.fillRect(x + 4, y + 10, 12, 1); }
        if (S.flash > 0) { ctx.fillStyle = S.ok > 0 ? INK.lime : INK.red; ctx.fillRect(0, 116, W, 4); }
        J.end(ctx);
        text(ctx, "SPAM SORTER", 4, 3, TEXT.bone);
        number(ctx, host.best || 0, W - 4, 3, TEXT.gold, 1, 2, 3);
        text(ctx, "INBOX", 18, 106, TEXT.sky); text(ctx, "BIN", 114, 106, TEXT.ember);
        number(ctx, S.right, 70, 106, TEXT.lime, 1, 0, 2); number(ctx, Math.ceil(S.time), 92, 106, TEXT.stone, 1, 0, 2);
        if (S.phase === "idle") centre(ctx, "PRESS START", 50, TEXT.banana);
        else if (S.phase === "end") centre(ctx, status.verb, 50, S.right >= 25 ? TEXT.teal : TEXT.red);
      }
    };
  };

  // --- DOUBLE SPEND (Era 6) ------------------------------------------------------------------------------------------
  // Payments arrive on the ledger, each spending a numbered coin. Accept (Space) a payment whose coin is unspent;
  // let one go by (it slides off) when its coin was already spent: the double spend the 2008 paper sets out to stop.
  const spend = (host) => {
    const B = base(host, "Ledger"), { K, out, J, status, rng } = B, { W, INK, TEXT, text, centre, number } = K;
    const COINS = 12, TIME = 60, ROW = 54;
    const spent = new Uint8Array(COINS);
    const S = { phase: "idle", coin: 0, double: 0, x: 0, speed: 34, right: 0, wrong: 0, time: TIME, end: 0, ended: 0, seed: 1, mark: 0, markOk: 0 };
    const finish = ender(B, S);
    const next = () => {
      // About a third of payments try a coin already spent (once some are).
      let n = 0; for (let k = 0; k < COINS; k++) n += spent[k];
      if (n > 0 && rng.chance(0.35)) { let k = rng.int(COINS); while (!spent[k]) k = (k + 1) % COINS; S.coin = k; S.double = 1; }
      else { if (n >= COINS) spent.fill(0); let k = rng.int(COINS); while (spent[k]) k = (k + 1) % COINS; S.coin = k; S.double = 0; }
      S.x = -40;
    };
    const judge = (accepted) => {
      const ok = accepted !== !!S.double;
      if (ok) { S.right++; status.score += 30; S.speed += 1.5; out.cue("tap", 0.4); } else { S.wrong++; out.cue("bump", 0.5); J.flash(INK.red, 0.3); }
      if (accepted && !S.double) spent[S.coin] = 1;
      S.mark = 0.5; S.markOk = ok ? 1 : 0;
      if (S.wrong >= 4) { finish(S.right >= 20); return; }
      next();
    };
    const step = (dt) => {
      if (S.phase === "play") {
        S.time -= dt; S.mark = Math.max(0, S.mark - dt);
        S.x += S.speed * dt * (host.still ? 0.6 : 1);
        if (S.x > W) judge(false);
        if (S.time <= 0 && S.phase === "play") { S.time = 0; finish(S.right >= 20); }
      }
      tickEnd(B, S, dt);
    };
    const run = K.stepper(step);
    const reset = () => { spent.fill(0); S.speed = 34; S.right = 0; S.wrong = 0; S.time = TIME; S.end = 0; S.ended = 0; S.mark = 0; status.score = 0; status.verb = ""; next(); J.reset(); };
    reset();
    return {
      kind: "spend", name: "Double Spend", status, roundLabel: "Block",
      help: "Each payment spends a numbered coin. Press Space to accept a payment whose coin is still unspent; let it slide by when its coin was spent already.",
      coach: ["Space accepts an unspent coin", "Tap to accept an unspent coin"], stars: [400, 800, 1200], tickets: (s) => Math.floor(s / 150),
      get playing() { return S.phase === "play"; },
      start: (seed) => { S.seed = Number.isInteger(seed) ? seed >>> 0 : 1; rng.seed(S.seed); reset(); S.phase = "play"; },
      stop: () => { S.phase = "idle"; reset(); },
      act: () => { if (S.phase === "play") judge(true); },
      update: (dt) => { J.update(dt); if (S.phase !== "idle") run(dt); },
      draw: (ctx) => {
        ctx.fillStyle = INK.night; ctx.fillRect(0, 0, W, 120);
        J.begin(ctx);
        for (let k = 0; k < COINS; k++) { ctx.fillStyle = spent[k] ? INK.stoneDk : INK.gold; ctx.fillRect(8 + k * 12, 18, 9, 9); }
        ctx.fillStyle = INK.rule; ctx.fillRect(0, ROW - 4, W, 26);
        const x = Math.round(S.x);
        ctx.fillStyle = INK.cream; ctx.fillRect(x, ROW, 40, 18);
        ctx.fillStyle = INK.gold; ctx.fillRect(x + 4, ROW + 4, 10, 10);
        number(ctx, S.coin + 1, x + 36, ROW + 6, TEXT.night, 1, 2);
        if (S.mark > 0) { ctx.fillStyle = S.markOk ? INK.lime : INK.red; ctx.fillRect(0, 84, W, 3); }
        J.end(ctx);
        text(ctx, "DOUBLE SPEND", 4, 3, TEXT.bone);
        number(ctx, host.best || 0, W - 4, 3, TEXT.gold, 1, 2, 3);
        text(ctx, "COINS", 4, 30, TEXT.stone);
        text(ctx, "OK", 4, 94, TEXT.stone); number(ctx, S.right, 22, 94, TEXT.lime);
        text(ctx, "MISS", 50, 94, TEXT.stone); number(ctx, S.wrong, 80, 94, TEXT.red);
        text(ctx, "TIME", 104, 94, TEXT.stone); number(ctx, Math.ceil(S.time), 156, 94, TEXT.sky, 1, 2);
        if (S.phase === "idle") centre(ctx, "PRESS START", 110, TEXT.banana);
        else if (S.phase === "end") centre(ctx, status.verb, 110, S.right >= 20 ? TEXT.teal : TEXT.red);
        else centre(ctx, "ACCEPT ONLY UNSPENT COINS", 110, TEXT.teal);
      }
    };
  };
  // --- FIVE IN A ROW (board tables) ---------------------------------------------------------------------------------
  // A 9 x 9 board against an Ooga: arrows or W A S D move the cursor, Space places a teal stone; five in a line (across,
  // down or diagonal) wins. The Ooga weighs every empty point by the lines it would make or block.
  const gomoku = (host) => {
    const B = base(host, "Wins"), { K, out, J, status, rng, aim } = B, { W, INK, TEXT, text, centre, number } = K;
    const N = 9, CELL = 10, BX = (W - N * CELL) >> 1, BY = 16, YOU = 1, OOGA = 2, DIRS = [1, 0, 0, 1, 1, 1, 1, -1];
    const board = new Uint8Array(N * N);
    const S = { phase: "idle", cx: 4, cy: 4, steps: 0, stepsY: 0, turn: YOU, think: 0, moves: 0, winner: 0, end: 0, ended: 0, seed: 1, lastX: -1, lastY: -1 };
    const finish = ender(B, S);
    const at = (x, y) => (x < 0 || y < 0 || x >= N || y >= N ? 3 : board[y * N + x]);
    const run5 = (x, y, who) => {
      for (let d = 0; d < 8; d += 2) {
        let n = 1;
        for (let k = 1; at(x + DIRS[d] * k, y + DIRS[d + 1] * k) === who; k++) n++;
        for (let k = 1; at(x - DIRS[d] * k, y - DIRS[d + 1] * k) === who; k++) n++;
        if (n >= 5) return true;
      }
      return false;
    };
    // How good point (x, y) is for `who`: each direction's run through it, open ends counting.
    const weigh = (x, y, who) => {
      let v = 0;
      for (let d = 0; d < 8; d += 2) {
        let n = 1, open = 0, k = 1;
        while (at(x + DIRS[d] * k, y + DIRS[d + 1] * k) === who) { n++; k++; }
        if (at(x + DIRS[d] * k, y + DIRS[d + 1] * k) === 0) open++;
        k = 1;
        while (at(x - DIRS[d] * k, y - DIRS[d + 1] * k) === who) { n++; k++; }
        if (at(x - DIRS[d] * k, y - DIRS[d + 1] * k) === 0) open++;
        v += n >= 5 ? 100000 : open === 0 ? 0 : Math.pow(10, n - 1) * open;
      }
      return v;
    };
    const place = (x, y, who) => {
      board[y * N + x] = who; S.moves++; S.lastX = x; S.lastY = y; out.cue("tap", who === YOU ? 0.4 : 0.3);
      if (run5(x, y, who)) { S.winner = who; if (who === YOU) status.score += 300 + (N * N - S.moves) * 5; finish(who === YOU); return; }
      if (S.moves >= N * N) { S.winner = 3; status.score += 100; finish(false); return; }
      S.turn = who === YOU ? OOGA : YOU; if (S.turn === OOGA) S.think = 0.5;
    };
    const ooga = () => {
      let best = -1, bx = 4, by = 4;
      for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
        if (board[y * N + x]) continue;
        const v = weigh(x, y, OOGA) * 1.1 + weigh(x, y, YOU) + rng.next() * 3 - (Math.abs(x - 4) + Math.abs(y - 4)) * 0.5;
        if (v > best) { best = v; bx = x; by = y; }
      }
      place(bx, by, OOGA);
    };
    const step = (dt) => {
      if (S.phase === "play" && S.turn === OOGA && (S.think -= dt) <= 0) ooga();
      tickEnd(B, S, dt);
    };
    const run = K.stepper(step);
    const reset = () => { board.fill(0); S.cx = S.cy = 4; S.steps = aim.steps; S.stepsY = aim.stepsY; S.turn = YOU; S.moves = 0; S.winner = 0; S.end = 0; S.ended = 0; S.lastX = S.lastY = -1; status.score = 0; status.verb = ""; J.reset(); };
    reset();
    return {
      kind: "gomoku", name: "Five in a Row", aims: true, status, roundLabel: "Game",
      help: "Sit with an Ooga at the board. The arrows or W A S D move the cursor, Space places your teal stone. Five in a line, any way, wins.",
      coach: ["Arrows move, Space places", "Tap a point to place"], stars: [300, 500, 700], tickets: (s) => Math.floor(s / 100),
      get playing() { return S.phase === "play"; },
      start: (seed) => { S.seed = Number.isInteger(seed) ? seed >>> 0 : 1; rng.seed(S.seed); reset(); S.phase = "play"; },
      stop: () => { S.phase = "idle"; reset(); },
      act: () => { if (S.phase === "play" && S.turn === YOU && !board[S.cy * N + S.cx]) place(S.cx, S.cy, YOU); else if (S.phase === "play") out.cue("bump", 0.2); },
      update: (dt) => {
        J.update(dt);
        if (aim.steps !== S.steps) { S.cx = Math.max(0, Math.min(N - 1, S.cx + (aim.steps - S.steps))); S.steps = aim.steps; }
        if (aim.stepsY !== S.stepsY) { S.cy = Math.max(0, Math.min(N - 1, S.cy + (aim.stepsY - S.stepsY))); S.stepsY = aim.stepsY; }
        if (S.phase !== "idle") run(dt);
      },
      draw: (ctx) => {
        ctx.fillStyle = INK.night; ctx.fillRect(0, 0, W, 120);
        J.begin(ctx);
        ctx.fillStyle = INK.ochre; ctx.fillRect(BX - 3, BY - 3, N * CELL + 6, N * CELL + 6);
        ctx.fillStyle = INK.huskDk;
        for (let k = 0; k < N; k++) { ctx.fillRect(BX + CELL / 2, BY + k * CELL + CELL / 2, (N - 1) * CELL, 1); ctx.fillRect(BX + k * CELL + CELL / 2, BY + CELL / 2, 1, (N - 1) * CELL); }
        for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
          const v = board[y * N + x];
          if (!v) continue;
          ctx.fillStyle = v === YOU ? INK.teal : INK.banana; ctx.fillRect(BX + x * CELL + 2, BY + y * CELL + 2, CELL - 4, CELL - 4);
          if (x === S.lastX && y === S.lastY) { ctx.fillStyle = INK.night; ctx.fillRect(BX + x * CELL + 4, BY + y * CELL + 4, 2, 2); }
        }
        if (S.phase === "play" && S.turn === YOU) { ctx.fillStyle = INK.white; ctx.fillRect(BX + S.cx * CELL + 1, BY + S.cy * CELL + CELL - 2, CELL - 2, 1); ctx.fillRect(BX + S.cx * CELL + 1, BY + S.cy * CELL + 1, CELL - 2, 1); }
        J.end(ctx);
        text(ctx, "FIVE IN A ROW", 4, 3, TEXT.bone);
        number(ctx, host.best || 0, W - 4, 3, TEXT.gold, 1, 2, 3);
        if (S.phase === "idle") centre(ctx, "PRESS START", 110, TEXT.banana);
        else if (S.phase === "end") centre(ctx, S.winner === YOU ? "YOU WIN" : S.winner === OOGA ? "OOGA WINS" : "DRAW", 110, S.winner === YOU ? TEXT.teal : TEXT.red);
        else centre(ctx, S.turn === YOU ? "YOUR MOVE" : "OOGA THINKS", 110, S.turn === YOU ? TEXT.teal : TEXT.banana);
      }
    };
  };

  // --- DOTS AND BOXES (board tables) --------------------------------------------------------------------------------
  // A 4 x 4 grid of boxes against an Ooga: the arrows move along the lines, Space draws one. Close a box's fourth side
  // and it is yours, and you go again. Most boxes wins.
  const dots = (host) => {
    const B = base(host, "Boxes"), { K, out, J, status, rng, aim } = B, { W, INK, TEXT, text, centre, number } = K;
    const BOXES = 4, G = BOXES * 2 + 1, SP = 20, GX = (W - BOXES * SP) >> 1, GY = 18, YOU = 1, OOGA = 2;
    const line = new Uint8Array(G * G), owner = new Uint8Array(BOXES * BOXES);
    const S = { phase: "idle", cx: 1, cy: 0, steps: 0, stepsY: 0, turn: YOU, think: 0, you: 0, ooga: 0, end: 0, ended: 0, seed: 1 };
    const finish = ender(B, S);
    const isLine = (x, y) => x >= 0 && y >= 0 && x < G && y < G && ((x & 1) !== (y & 1));
    const presentSides = (bx, by) => { const x = bx * 2 + 1, y = by * 2 + 1; return (line[(y - 1) * G + x] ? 1 : 0) + (line[(y + 1) * G + x] ? 1 : 0) + (line[y * G + x - 1] ? 1 : 0) + (line[y * G + x + 1] ? 1 : 0); };
    const claim = (x, y, who) => {
      line[y * G + x] = who; let closed = 0;
      for (let by = 0; by < BOXES; by++) for (let bx = 0; bx < BOXES; bx++) if (!owner[by * BOXES + bx] && presentSides(bx, by) === 4) { owner[by * BOXES + bx] = who; closed++; }
      if (who === YOU) S.you += closed; else S.ooga += closed;
      out.cue(closed ? "win" : "tap", closed ? 0.3 : 0.25);
      if (closed && who === YOU) { status.score += closed * 60; J.shake(1); }
      if (S.you + S.ooga >= BOXES * BOXES) { if (S.you > S.ooga) status.score += 200; finish(S.you > S.ooga); return; }
      if (!closed) S.turn = who === YOU ? OOGA : YOU;
      if (S.turn === OOGA) S.think = 0.45;
    };
    // Would drawing (x, y) leave a box with three sides for the other player?
    const gives = (x, y) => {
      line[y * G + x] = 1; let bad = false;
      for (let by = 0; by < BOXES && !bad; by++) for (let bx = 0; bx < BOXES; bx++) if (!owner[by * BOXES + bx] && presentSides(bx, by) === 3) { bad = true; break; }
      line[y * G + x] = 0; return bad;
    };
    const closes = (x, y) => {
      line[y * G + x] = 1; let c = false;
      for (let by = 0; by < BOXES && !c; by++) for (let bx = 0; bx < BOXES; bx++) if (!owner[by * BOXES + bx] && presentSides(bx, by) === 4) { c = true; break; }
      line[y * G + x] = 0; return c;
    };
    const ooga = () => {
      let pick = -1, safe = -1, any = -1, n = 0, m = 0, a = 0;
      for (let y = 0; y < G; y++) for (let x = 0; x < G; x++) {
        if (!isLine(x, y) || line[y * G + x]) continue;
        const k = y * G + x;
        if (closes(x, y)) { pick = k; break; }
        if (!gives(x, y)) { if (rng.int(++n) === 0) safe = k; }
        else if (rng.int(++a) === 0) any = k;
      }
      const k = pick >= 0 ? pick : safe >= 0 ? safe : any;
      if (k >= 0) claim(k % G, (k / G) | 0, OOGA);
    };
    const step = (dt) => {
      if (S.phase === "play" && S.turn === OOGA && (S.think -= dt) <= 0) ooga();
      tickEnd(B, S, dt);
    };
    const run = K.stepper(step);
    // The cursor on the lines: left and right step along the row it is on (across lines in an even row, up-and-down
    // lines in an odd one), up and down to the next row, landing on the nearest line there, so every line is reached.
    const snap = (dx, dy) => {
      if (dx) { const nx = S.cx + dx * 2; if (isLine(nx, S.cy)) S.cx = nx; return; }
      const ny = S.cy + dy;
      if (ny < 0 || ny >= G) return;
      S.cx = isLine(S.cx, ny) ? S.cx : isLine(S.cx - 1, ny) ? S.cx - 1 : S.cx + 1; S.cy = ny;
    };
    const reset = () => { line.fill(0); owner.fill(0); S.cx = 1; S.cy = 0; S.steps = aim.steps; S.stepsY = aim.stepsY; S.turn = YOU; S.you = S.ooga = 0; S.end = 0; S.ended = 0; status.score = 0; status.verb = ""; J.reset(); };
    reset();
    return {
      kind: "dots", name: "Dots and Boxes", aims: true, status, roundLabel: "Game",
      help: "Sit with an Ooga at the board. The arrows move along the lines, Space draws one. Close the fourth side of a box to win it and go again.",
      coach: ["Arrows choose a line, Space draws", "Tap a line to draw it"], stars: [300, 500, 700], tickets: (s) => Math.floor(s / 100),
      get playing() { return S.phase === "play"; },
      start: (seed) => { S.seed = Number.isInteger(seed) ? seed >>> 0 : 1; rng.seed(S.seed); reset(); S.phase = "play"; },
      stop: () => { S.phase = "idle"; reset(); },
      act: () => { if (S.phase === "play" && S.turn === YOU && !line[S.cy * G + S.cx]) claim(S.cx, S.cy, YOU); else if (S.phase === "play") out.cue("bump", 0.2); },
      update: (dt) => {
        J.update(dt);
        while (aim.steps !== S.steps) { const d = aim.steps > S.steps ? 1 : -1; S.steps += d; snap(d, 0); }
        while (aim.stepsY !== S.stepsY) { const d = aim.stepsY > S.stepsY ? 1 : -1; S.stepsY += d; snap(0, d); }
        if (S.phase !== "idle") run(dt);
      },
      draw: (ctx) => {
        ctx.fillStyle = INK.night; ctx.fillRect(0, 0, W, 120);
        J.begin(ctx);
        const px = (x) => GX + (x >> 1) * SP, py = (y) => GY + (y >> 1) * SP;
        for (let by = 0; by < BOXES; by++) for (let bx = 0; bx < BOXES; bx++) { const o = owner[by * BOXES + bx]; if (o) { ctx.fillStyle = o === YOU ? INK.teal : INK.banana; ctx.globalAlpha = 0.5; ctx.fillRect(GX + bx * SP + 3, GY + by * SP + 3, SP - 5, SP - 5); ctx.globalAlpha = 1; } }
        for (let y = 0; y < G; y++) for (let x = 0; x < G; x++) {
          if (!isLine(x, y)) continue;
          const v = line[y * G + x], cur = S.phase === "play" && S.turn === YOU && x === S.cx && y === S.cy;
          if (!v && !cur) continue;
          ctx.fillStyle = cur && !v ? INK.white : v === YOU ? INK.teal : INK.banana;
          if (y & 1) ctx.fillRect(px(x), py(y - 1) + 2, 2, SP - 3); else ctx.fillRect(px(x - 1) + 2, py(y), SP - 3, 2);
        }
        ctx.fillStyle = INK.bone;
        for (let y = 0; y <= BOXES; y++) for (let x = 0; x <= BOXES; x++) ctx.fillRect(GX + x * SP, GY + y * SP, 2, 2);
        J.end(ctx);
        text(ctx, "DOTS AND BOXES", 4, 3, TEXT.bone);
        number(ctx, host.best || 0, W - 4, 3, TEXT.gold, 1, 2, 3);
        text(ctx, "YOU", 4, 102, TEXT.teal); number(ctx, S.you, 30, 102, TEXT.teal);
        text(ctx, "OOGA", 118, 102, TEXT.banana); number(ctx, S.ooga, 156, 102, TEXT.banana, 1, 2);
        if (S.phase === "idle") centre(ctx, "PRESS START", 112, TEXT.banana);
        else if (S.phase === "end") centre(ctx, S.you > S.ooga ? "YOU WIN" : S.you === S.ooga ? "DRAW" : "OOGA WINS", 112, S.you > S.ooga ? TEXT.teal : TEXT.red);
        else centre(ctx, S.turn === YOU ? "YOUR LINE" : "OOGA THINKS", 112, S.turn === YOU ? TEXT.teal : TEXT.banana);
      }
    };
  };
  // The board tables' games (the era decor's game tables, genesis-era-items.js): which game each table plays.
  const BOARDS = [
    { id: "b-gomoku", era: 6, title: "Five in a Row", make: gomoku },
    { id: "b-dots", era: 2, title: "Dots and Boxes", make: dots }
  ];
  // The cabinets: which game, in which gallery, and its sign.
  const GAMES = [
    { id: "g0-punch", era: 0, year: 1960, title: "Card Punch", span: "1956–1969", make: punch },
    { id: "g3-dial", era: 3, year: 1992, title: "Dial Tones", span: "1990–1995", make: dial },
    { id: "g4-hash", era: 4, year: 1997, title: "Hash Hunt", span: "1996–1999", make: hash },
    { id: "g7-builder", era: 7, year: 2009, title: "Block Builder", span: "January 2009", make: builder },
    { id: "g1-switch", era: 1, year: 1975, title: "Switchboard", span: "1970s", make: switchboard },
    { id: "g2-code", era: 2, year: 1985, title: "Code Breaker", span: "1980s", make: breaker },
    { id: "g5-spam", era: 5, year: 2003, title: "Spam Sorter", span: "2000–2007", make: sorter },
    { id: "g6-spend", era: 6, year: 2008, title: "Double Spend", span: "2008", make: spend }
  ];
  const registry = BL.genesisCartridges = BL.genesisCartridges || { list: [] };
  for (const g of GAMES) registry.list.push({ id: g.id, era: g.era, title: g.title, make: g.make,
    label: `A modern original museum game in the spirit of the ${g.span} gallery, not a game from those years` });
  for (const g of BOARDS) registry.list.push({ id: g.id, era: g.era, title: g.title, make: g.make,
    label: `${g.title} against an Ooga: a modern original museum game on a generic public-domain board game` });
  BL.genesisGamesPlus = { GAMES, BOARDS, punch, dial, hash, builder, pocket, switchboard, breaker, sorter, spend, gomoku, dots, fnv };
})();
