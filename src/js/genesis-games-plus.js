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

  // The cabinets: which game, in which gallery, and its sign.
  const GAMES = [
    { id: "g0-punch", era: 0, year: 1960, title: "Card Punch", span: "1956–1969", make: punch },
    { id: "g3-dial", era: 3, year: 1992, title: "Dial Tones", span: "1990–1995", make: dial },
    { id: "g4-hash", era: 4, year: 1997, title: "Hash Hunt", span: "1996–1999", make: hash },
    { id: "g7-builder", era: 7, year: 2009, title: "Block Builder", span: "January 2009", make: builder }
  ];
  const registry = BL.genesisCartridges = BL.genesisCartridges || { list: [] };
  for (const g of GAMES) registry.list.push({ id: g.id, era: g.era, title: g.title, make: g.make,
    label: `A modern original museum game in the spirit of the ${g.span} gallery, not a game from those years` });
  BL.genesisGamesPlus = { GAMES, punch, dial, hash, builder, fnv };
})();
