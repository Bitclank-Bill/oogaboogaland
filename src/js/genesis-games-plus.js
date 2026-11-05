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
  // Screen helpers the games share (presentation only): a blink that holds still under Calm, a bar filled to a share,
  // a row of pips (lit up to n of a total), and a disc (a square with its corners cut) for stones and coins.
  const blinkOn = (host, t, hz) => host.still || ((t * hz) | 0) % 2 === 0;
  const bar = (ctx, x, y, w, h, k, back, fore) => {
    ctx.fillStyle = back; ctx.fillRect(x, y, w, h);
    const f = Math.round(w * Math.max(0, Math.min(1, k)));
    if (f > 0) { ctx.fillStyle = fore; ctx.fillRect(x, y, f, h); }
  };
  const pips = (ctx, x, y, n, of, on, off, step) => { for (let k = 0; k < of; k++) { ctx.fillStyle = k < n ? on : off; ctx.fillRect(x + k * step, y, step - 2, 5); } };
  const disc = (ctx, x, y, d) => { ctx.fillRect(x + 1, y, d - 2, d); ctx.fillRect(x, y + 1, d, d - 2); };

  // --- CARD PUNCH ---------------------------------------------------------------------------------------------------
  const punch = (host) => {
    const B = base(host, "Holes"), { K, out, J, status, rng } = B, { W, INK, TEXT, text, centre, number } = K;
    const COLS = 12, GOAL = 24, CW = 11, CX = (W - COLS * CW) >> 1, CY = 46;
    const lit = new Uint8Array(COLS), holes = new Uint8Array(COLS);
    const S = { phase: "idle", x: 0, dir: 1, speed: 4, lives: 3, done: 0, end: 0, ended: 0, flashCol: -1, flash: 0, seed: 1, t: 0, press: 0 };
    // Presentation only: chads thrown from a punched hole (red bits on a miss), a score popup, the plunger's stroke.
    const chads = K.sparks(40, [INK.cream, INK.bone, INK.red], 140), plus = K.worded("+");
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
      S.t += dt; S.press = Math.max(0, S.press - dt);
      tickEnd(B, S, dt);
    };
    const run = K.stepper(step);
    const reset = () => { lit.fill(0); holes.fill(0); S.x = 0; S.dir = 1; S.speed = 4; S.lives = 3; S.done = 0; S.end = 0; S.ended = 0; S.flash = 0; S.press = 0; status.score = 0; status.left = GOAL; status.verb = ""; J.reset(); chads.clear(); };
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
        S.flashCol = c; S.flash = 0.25; S.press = 0.12;
        const hx = CX + c * CW + (CW >> 1);
        if (lit[c]) {
          const gain = 10 + Math.floor(S.speed);
          lit[c] = 0; holes[c] = 1; S.done++; status.score += gain; status.left = GOAL - S.done; S.speed += 0.35; out.cue("tap", 0.5); J.shake(1);
          out.popup(plus(gain), false); if (!host.still) chads.spawn(hx, CY + 12, 6, 50, 0, 1, 0.7);
          if (S.done >= GOAL) { finish(true); return; } light();
        }
        else { S.lives--; out.cue("bump", 0.5); J.flash(INK.red, 0.4); if (!host.still) chads.spawn(hx, CY + 6, 5, 40, 2, 2, 0.5); if (S.lives <= 0) finish(false); }
      },
      update: (dt) => { J.update(dt); chads.update(dt); if (S.phase !== "idle") run(dt); },
      draw: (ctx) => {
        ctx.fillStyle = INK.night; ctx.fillRect(0, 0, W, 120);
        ctx.fillStyle = INK.cave; ctx.fillRect(0, 72, W, 20);
        J.begin(ctx);
        // The machine's bed and the card on it: cream, its top-left corner cut, a red guide rule, the column numbers.
        ctx.fillStyle = INK.earthDk; ctx.fillRect(CX - 10, CY - 13, COLS * CW + 20, 42);
        ctx.fillStyle = INK.cream; ctx.fillRect(CX - 6, CY - 10, COLS * CW + 12, 34);
        ctx.fillStyle = INK.earthDk; ctx.fillRect(CX - 6, CY - 10, 6, 2); ctx.fillRect(CX - 6, CY - 8, 4, 2); ctx.fillRect(CX - 6, CY - 6, 2, 2);
        ctx.fillStyle = INK.red; ctx.fillRect(CX - 4, CY - 3, COLS * CW + 8, 1);
        for (let c = 0; c < COLS; c += 2) number(ctx, c + 1, CX + c * CW + (CW >> 1), CY + 15, TEXT.stone, 1, 1);
        const blink = host.still || ((S.t * 4) | 0) % 2 === 0;
        for (let c = 0; c < COLS; c++) {
          const x = CX + c * CW + 3;
          if (lit[c] && blink) { ctx.fillStyle = INK.gold; ctx.fillRect(x - 1, CY - 1, CW - 4, 14); }
          ctx.fillStyle = holes[c] ? INK.night : lit[c] ? INK.banana : INK.stoneLt;
          ctx.fillRect(x, CY, CW - 6, 12);
          if (holes[c]) { ctx.fillStyle = INK.husk; ctx.fillRect(x, CY, CW - 6, 1); }
        }
        // The punch head on its rail: a carriage, its plunger driven down through the card on a stroke.
        ctx.fillStyle = INK.stoneDk; ctx.fillRect(CX - 8, CY - 25, COLS * CW + 16, 2);
        const hx = CX + Math.floor(S.x) * CW;
        ctx.fillStyle = S.flash > 0 ? INK.white : INK.rust; ctx.fillRect(hx + 1, CY - 23, CW - 2, 10);
        ctx.fillStyle = INK.ember; ctx.fillRect(hx + 2, CY - 22, CW - 4, 2);
        ctx.fillStyle = INK.stoneDk; ctx.fillRect(hx + 4, CY - 13, CW - 8, S.press > 0 ? 25 : 10);
        chads.draw(ctx);
        J.end(ctx);
        text(ctx, "CARD PUNCH", 4, 3, TEXT.bone);
        number(ctx, host.best || 0, W - 4, 3, TEXT.gold, 1, 2, 3);
        // Spare cards for lives, the head's speed as a bar, and the holes punched.
        text(ctx, "CARDS", 4, 96, TEXT.stone);
        for (let k = 0; k < 3; k++) { ctx.fillStyle = k < S.lives ? INK.cream : INK.earth; ctx.fillRect(38 + k * 9, 95, 7, 9); }
        text(ctx, "SPEED", 70, 82, TEXT.stone); ctx.fillStyle = INK.ember; ctx.fillRect(102, 83, Math.min(54, Math.round((S.speed - 4) * 6)), 4);
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
    const PAD_LABEL = ["1", "2", "3", "4"];
    const seq = new Uint8Array(MAXLEN);
    const S = { phase: "idle", len: 0, show: 0, showT: 0, input: 0, cur: 0, steps: 0, glow: -1, glowT: 0, end: 0, ended: 0, seed: 1, t: 0 };
    // Presentation only: sparks off a pad pressed (red ones off a wrong one), the round's score as a popup.
    const fx = K.sparks(40, [INK.white, INK.teal, INK.red, INK.banana], 120), plus = K.worded("+");
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
    const reset = () => { S.len = 0; S.cur = 0; S.steps = aim.steps; S.glow = -1; S.end = 0; S.ended = 0; status.score = 0; status.round = 1; status.verb = ""; J.reset(); fx.clear(); };
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
        const cx = PX + S.cur * (PW + 6) + (PW >> 1);
        if (seq[S.input] !== S.cur) { out.cue("bump", 0.5); J.flash(INK.red, 0.5); if (!host.still) fx.spawn(cx, PY + (PW >> 1), 10, 50, 2, 2, 0.6); finish(false); return; }
        out.cue("tap", 0.3 + S.cur * 0.1);
        if (!host.still) fx.spawn(cx, PY + (PW >> 1), 5, 40, 0, 1, 0.45);
        if (++S.input >= S.len) {
          const gain = S.len * 50;
          status.score += gain; status.round = S.len - 1; J.shake(1);
          out.popup(plus(gain), S.len >= MAXLEN); if (!host.still) fx.spawn(W >> 1, 84, 12, 60, 3, 1, 0.7);
          if (S.len >= MAXLEN) { finish(true); return; }
          seq[S.len++] = rng.int(PADS); play();
        }
      },
      update: (dt) => {
        J.update(dt); fx.update(dt); S.t += dt;
        if (aim.steps !== S.steps) { S.cur = Math.max(0, Math.min(PADS - 1, S.cur + (aim.steps - S.steps))); S.steps = aim.steps; }
        if (S.phase !== "idle") run(dt);
      },
      draw: (ctx) => {
        ctx.fillStyle = INK.night; ctx.fillRect(0, 0, W, 120);
        J.begin(ctx);
        const blink = blinkOn(host, S.t, 3);
        // The modem: a case with its send and receive lamps and a window where the tone plays as a wave.
        ctx.fillStyle = INK.stoneDk; ctx.fillRect(28, 13, 104, 22);
        ctx.fillStyle = INK.stone; ctx.fillRect(28, 13, 104, 1);
        ctx.fillStyle = INK.cave; ctx.fillRect(52, 16, 56, 16);
        text(ctx, "TX", 33, 16, TEXT.bone); text(ctx, "RX", 115, 16, TEXT.bone);
        ctx.fillStyle = S.phase === "show" && S.glow >= 0 ? INK.lime : INK.charcoal; ctx.fillRect(34, 26, 9, 3);
        ctx.fillStyle = S.phase !== "show" && S.glow >= 0 ? INK.ember : INK.charcoal; ctx.fillRect(116, 26, 9, 3);
        if (S.glow >= 0) {
          const f = 0.28 + S.glow * 0.14, ph = host.still ? 0 : S.t * 18;
          ctx.fillStyle = PAD_INK[S.glow];
          for (let i = 0; i < 54; i++) ctx.fillRect(53 + i, 23 + Math.round(Math.sin(i * f + ph) * 5), 1, 2);
        } else { ctx.fillStyle = INK.rule; ctx.fillRect(53, 24, 54, 1); }
        // The four pads: a bevelled key each, lit white while it sounds and pressed a pixel down.
        for (let p = 0; p < PADS; p++) {
          const x = PX + p * (PW + 6), on = S.glow === p, y = PY + (on ? 1 : 0);
          ctx.fillStyle = INK.deep; ctx.fillRect(x - 2, PY - 2, PW + 4, PW + 5);
          ctx.fillStyle = on ? INK.white : PAD_INK[p]; ctx.globalAlpha = on ? 1 : 0.55; ctx.fillRect(x, y, PW, PW); ctx.globalAlpha = 1;
          if (!on) { ctx.fillStyle = INK.white; ctx.globalAlpha = 0.25; ctx.fillRect(x, y, PW, 2); ctx.globalAlpha = 1; ctx.fillStyle = INK.band; ctx.fillRect(x, y + PW - 2, PW, 2); }
          text(ctx, PAD_LABEL[p], x + 13, y + 12, on ? TEXT.night : TEXT.bone);
          if (S.phase === "you" && S.cur === p) {
            ctx.fillStyle = INK.teal; ctx.fillRect(x, PY + PW + 5, PW, 2);
            if (blink) { ctx.fillRect(x + 14, PY + PW + 2, 2, 3); ctx.fillRect(x + 12, PY + PW + 3, 6, 1); }
          }
        }
        // The pattern's length, a lamp a tone: played so far while it listens, matched so far while you play.
        for (let i = 0; i < MAXLEN; i++) {
          const x = 16 + i * 8, done = S.phase === "you" ? i < S.input : S.phase === "show" ? i < S.show : false;
          ctx.fillStyle = i >= S.len ? INK.rule : done ? (S.phase === "you" ? INK.teal : INK.sky) : INK.stoneDk;
          ctx.fillRect(x, 82, 6, 4);
        }
        fx.draw(ctx);
        J.end(ctx);
        text(ctx, "DIAL TONES", 4, 3, TEXT.bone);
        number(ctx, host.best || 0, W - 4, 3, TEXT.gold, 1, 2, 3);
        text(ctx, "TONES", 4, 92, TEXT.stone); number(ctx, S.len, 40, 92, TEXT.banana);
        text(ctx, "SCORE", 92, 92, TEXT.stone); number(ctx, status.score, 156, 92, TEXT.gold, 1, 2);
        if (S.phase === "idle") { if (blink) centre(ctx, "PRESS START", 110, TEXT.banana); }
        else if (S.phase === "show") centre(ctx, "LISTEN", 110, TEXT.sky);
        else if (S.phase === "you") centre(ctx, "PLAY IT BACK", 110, TEXT.teal);
        else centre(ctx, status.verb, 110, S.len >= MAXLEN && S.input >= S.len ? TEXT.teal : TEXT.red);
      }
    };
  };

  // --- HASH HUNT ----------------------------------------------------------------------------------------------------
  const hash = (host) => {
    const B = base(host, "Stamps"), { K, out, J, status, rng } = B, { W, INK, TEXT, text, centre, number } = K;
    const GOAL = 8, TIME = 45, TAPE = 10;
    // Presentation only: the last fingerprints' first digits on a tape, sparks off a stamp or a miss, popups.
    const tape = new Uint8Array(TAPE);
    const S = { phase: "idle", nonce: 0, acc: 0, rate: 9, h: 0, lives: 3, found: 0, time: TIME, end: 0, ended: 0, seed: 1, ok: 0, t: 0, seen: -1, head: 0, miss: 0 };
    const fx = K.sparks(48, [INK.lime, INK.gold, INK.red, INK.white], 110), plus = K.worded("+");
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
    const reset = () => { S.nonce = 0; S.acc = 0; S.rate = 9; S.lives = 3; S.found = 0; S.time = TIME; S.end = 0; S.ended = 0; S.ok = 0; status.score = 0; status.left = GOAL; status.verb = ""; S.h = fnv(0, S.seed); J.reset(); fx.clear(); tape.fill(255); S.seen = -1; S.head = 0; S.miss = 0; };
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
          const gain = 100 + Math.ceil(S.time);
          S.found++; status.score += gain; status.left = GOAL - S.found; S.ok = 0.5; S.rate += 1.5; out.cue("tap", 0.6); J.shake(1.5);
          out.popup(plus(gain), S.found >= GOAL); if (!host.still) fx.spawn(52, 68, 12, 60, 0, 1, 0.7);
          S.nonce += 1; S.h = fnv(S.nonce, S.seed);
          if (S.found >= GOAL) finish(true);
        } else { S.lives--; S.miss = 0.4; out.cue("bump", 0.5); J.flash(INK.red, 0.4); if (!host.still) fx.spawn(52, 68, 6, 40, 2, 2, 0.5); if (S.lives <= 0) finish(false); }
      },
      update: (dt) => {
        J.update(dt); fx.update(dt); S.t += dt; S.miss = Math.max(0, S.miss - dt);
        if (S.phase === "play" && S.nonce !== S.seen) { S.seen = S.nonce; tape[S.head] = S.h >>> 28; S.head = (S.head + 1) % TAPE; }
        if (S.phase !== "idle") run(dt);
      },
      draw: (ctx) => {
        ctx.fillStyle = INK.night; ctx.fillRect(0, 0, W, 120);
        J.begin(ctx);
        const zero = (S.h >>> 28) === 0, blink = blinkOn(host, S.t, 4);
        // The rig's panel: its frame lights lime while a stamp lands.
        ctx.fillStyle = S.ok > 0 ? INK.lime : S.miss > 0 ? INK.red : INK.stoneDk; ctx.fillRect(14, 28, 132, 66);
        ctx.fillStyle = INK.deep; ctx.fillRect(15, 29, 130, 64);
        text(ctx, "NUMBER", 20, 34, TEXT.stone); number(ctx, S.nonce, 140, 34, TEXT.bone, 1, 2, 5);
        text(ctx, "FINGERPRINT", 20, 48, TEXT.stone);
        // Four hex digits in their windows, the first lit when it is a 0.
        for (let k = 0; k < 4; k++) {
          const x = 44 + k * 18;
          ctx.fillStyle = k === 0 && zero ? (blink ? INK.lime : INK.leaf) : INK.rule; ctx.fillRect(x - 1, 57, 16, 20);
          ctx.fillStyle = INK.cave; ctx.fillRect(x, 58, 14, 18);
          text(ctx, HEX[(S.h >>> (28 - k * 4)) & 15], x + 2, 60, k === 0 && zero ? TEXT.lime : TEXT.banana, 2);
        }
        // The tape: the first digit of the last ten fingerprints, the newest on the right.
        for (let i = 0; i < TAPE; i++) {
          const v = tape[(S.head + i) % TAPE];
          if (v === 255) continue;
          text(ctx, HEX[v], 22 + i * 12, 82, v === 0 ? TEXT.lime : TEXT.stone);
        }
        if (S.ok > 0) { ctx.fillStyle = INK.lime; ctx.fillRect(20, 91, 120, 1); }
        fx.draw(ctx);
        J.end(ctx);
        text(ctx, "HASH HUNT", 4, 3, TEXT.bone);
        number(ctx, host.best || 0, W - 4, 3, TEXT.gold, 1, 2, 3);
        // The clock as a number and a bar (red in its last ten seconds), and the eight stamps to find.
        text(ctx, "TIME", 4, 14, TEXT.stone); number(ctx, Math.ceil(S.time), 30, 14, S.time < 10 ? TEXT.red : TEXT.sky);
        bar(ctx, 44, 16, 44, 3, S.time / TIME, INK.rule, S.time < 10 && blink ? INK.red : INK.sky);
        for (let k = 0; k < GOAL; k++) { ctx.fillStyle = k < S.found ? INK.gold : INK.rule; ctx.fillRect(98 + k * 7, 14, 6, 7); if (k < S.found) { ctx.fillStyle = INK.ember; ctx.fillRect(100 + k * 7, 16, 2, 3); } }
        text(ctx, "TRIES", 4, 98, TEXT.stone); pips(ctx, 36, 99, S.lives, 3, INK.red, INK.rule, 8);
        text(ctx, "RATE", 92, 98, TEXT.stone); number(ctx, S.rate, 156, 98, TEXT.banana, 1, 2);
        if (S.phase === "idle") { if (blink) centre(ctx, "PRESS START", 110, TEXT.banana); }
        else if (S.phase === "end") centre(ctx, status.verb, 110, S.found >= GOAL / 2 ? TEXT.teal : TEXT.red);
        else if (S.ok > 0) centre(ctx, "STAMPED", 110, TEXT.lime);
        else centre(ctx, "STOP IT ON A 0", 110, TEXT.teal);
      }
    };
  };

  // --- BLOCK BUILDER ------------------------------------------------------------------------------------------------
  const builder = (host) => {
    const B = base(host, "Blocks"), { K, out, J, status, rng, aim } = B, { W, INK, TEXT, text, centre, number } = K;
    const LANES = 6, LW = 22, LX = (W - LANES * LW) >> 1, CAP = 8, FILL = 6, TIME = 60, FLOOR = 92;
    const lane = new Uint8Array(CAP), bad = new Uint8Array(CAP), live = new Uint8Array(CAP), y = new Float32Array(CAP);
    const S = { phase: "idle", cur: 2, steps: 0, spawn: 0, fill: 0, chain: 0, lives: 3, time: TIME, end: 0, ended: 0, seed: 1, speed: 26, t: 0, made: 0, hurt: 0 };
    // Presentation only: sparks as a record lands in the tray (red for a broken one), a burst as a block seals.
    const fx = K.sparks(48, [INK.lime, INK.gold, INK.red, INK.white], 120);
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
          const tx = LX + S.cur * LW + (LW >> 1);
          if (bad[i]) { S.lives--; S.hurt = 0.4; out.cue("bump", 0.5); J.flash(INK.red, 0.4); if (!host.still) fx.spawn(tx, FLOOR, 8, 45, 2, 2, 0.5); if (S.lives <= 0) { finish(false); return; } }
          else {
            S.fill++; status.score += 10; out.cue("tap", 0.4); if (!host.still) fx.spawn(tx, FLOOR, 4, 30, 0, 0, 0.35);
            if (S.fill >= FILL) { S.fill = 0; S.chain++; status.score += 100; S.speed += 3; J.shake(1.5); out.popup && out.popup("BLOCK", true); S.made = 0.6; if (!host.still) { fx.spawn(tx, FLOOR, 14, 70, 1, 3, 0.8); fx.spawn(Math.min(S.chain, 12) * 12 - 1, 15, 6, 30, 1, 1, 0.5); } }
          }
        }
        if (S.time <= 0) { S.time = 0; finish(S.chain >= 3); }
      }
      tickEnd(B, S, dt);
    };
    const run = K.stepper(step);
    const reset = () => { live.fill(0); S.cur = 2; S.steps = aim.steps; S.spawn = 0.4; S.fill = 0; S.chain = 0; S.lives = 3; S.time = TIME; S.end = 0; S.ended = 0; S.speed = 26; status.score = 0; status.verb = ""; J.reset(); fx.clear(); S.made = 0; S.hurt = 0; };
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
        J.update(dt); fx.update(dt); S.t += dt; S.made = Math.max(0, S.made - dt); S.hurt = Math.max(0, S.hurt - dt);
        if (aim.steps !== S.steps) { S.cur = Math.max(0, Math.min(LANES - 1, S.cur + (aim.steps - S.steps))); S.steps = aim.steps; }
        if (S.phase !== "idle") run(dt);
      },
      draw: (ctx) => {
        ctx.fillStyle = INK.night; ctx.fillRect(0, 0, W, 120);
        J.begin(ctx);
        const blink = blinkOn(host, S.t, 3);
        // The lanes, dotted at their edges, the tray's own lane faintly lit.
        for (let l = 0; l < LANES; l++) { ctx.fillStyle = l % 2 ? INK.deep : INK.cave; ctx.fillRect(LX + l * LW, 20, LW, FLOOR - 16); }
        ctx.fillStyle = INK.teal; ctx.globalAlpha = 0.08; ctx.fillRect(LX + S.cur * LW, 20, LW, FLOOR - 16); ctx.globalAlpha = 1;
        ctx.fillStyle = INK.rule;
        for (let l = 1; l < LANES; l++) for (let yy = 22; yy < FLOOR; yy += 6) ctx.fillRect(LX + l * LW, yy, 1, 2);
        // The records: a good one a lime slip with its lines, a broken one red and crossed out.
        for (let i = 0; i < CAP; i++) {
          if (!live[i]) continue;
          const rx = LX + lane[i] * LW + 6, ry = Math.floor(y[i]);
          ctx.fillStyle = bad[i] ? INK.red : INK.lime; ctx.fillRect(rx, ry, LW - 12, 6);
          ctx.fillStyle = INK.charcoal;
          if (bad[i]) { ctx.fillRect(rx + 2, ry + 1, 2, 1); ctx.fillRect(rx + 4, ry + 2, 2, 2); ctx.fillRect(rx + 6, ry + 4, 2, 1); ctx.fillRect(rx + 6, ry + 1, 2, 1); ctx.fillRect(rx + 2, ry + 4, 2, 1); }
          else { ctx.fillRect(rx + 2, ry + 2, 6, 1); ctx.fillRect(rx + 2, ry + 4, 4, 1); }
        }
        // The tray: a gold block with walls, its six slots filling lime; white as it seals, red when it takes a bad one.
        const tx = LX + S.cur * LW + 2;
        ctx.fillStyle = S.made > 0 ? INK.white : S.hurt > 0 ? INK.red : INK.gold; ctx.fillRect(tx, FLOOR + 2, LW - 4, 7);
        ctx.fillStyle = INK.huskDk; ctx.fillRect(tx + 1, FLOOR + 3, LW - 6, 4);
        for (let k = 0; k < FILL; k++) { ctx.fillStyle = k < S.fill ? INK.lime : INK.earth; ctx.fillRect(tx + 1 + k * 3, FLOOR + 3, 2, 4); }
        // The chain: a block for each sealed, linked, the newest glowing as it joins.
        for (let c = 0; c < Math.min(S.chain, 12); c++) {
          const last = c === Math.min(S.chain, 12) - 1;
          ctx.fillStyle = last && S.made > 0 ? INK.white : INK.ember; ctx.fillRect(6 + c * 12, 12, 9, 6);
          ctx.fillStyle = INK.gold; ctx.fillRect(6 + c * 12, 12, 9, 1);
          if (c) { ctx.fillStyle = INK.stone; ctx.fillRect(3 + c * 12, 15, 3, 1); }
        }
        fx.draw(ctx);
        J.end(ctx);
        text(ctx, "BLOCK BUILDER", 4, 3, TEXT.bone);
        number(ctx, host.best || 0, W - 4, 3, TEXT.gold, 1, 2, 3);
        text(ctx, "TIME", 4, 104, TEXT.stone); number(ctx, Math.ceil(S.time), 30, 104, S.time < 10 ? TEXT.red : TEXT.sky);
        bar(ctx, 46, 106, 40, 3, S.time / TIME, INK.rule, S.time < 10 && blink ? INK.red : INK.sky);
        text(ctx, "LIVES", 104, 104, TEXT.stone); pips(ctx, 136, 105, S.lives, 3, INK.red, INK.rule, 7);
        if (S.phase === "idle") { if (blink) centre(ctx, "PRESS START", 112, TEXT.banana); }
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
    const MAXW = 21, MAXH = 15, LEVELS = 5, TIME = 90, LCD = "#a8c45a", LCD_DK = "#2f4a1c", LCD_MID = "#6f8f3a", LCD_INK = "#14200c", CASE = "#1c2412", CASE_LT = "#2c381e";
    const grid = new Uint8Array(MAXW * MAXH), stack = new Int16Array(MAXW * MAXH * 2);
    // Presentation only: the squares walked in this maze (a trail of dots), sparks at an exit reached, the maze's banner.
    const trail = new Uint8Array(MAXW * MAXH);
    const S = { phase: "idle", w: 9, h: 7, x: 1, y: 1, ex: 7, ey: 5, level: 0, moves: 0, time: TIME, steps: 0, stepsY: 0, end: 0, ended: 0, seed: 1, cell: 12, ox: 0, oy: 0, win: 0, t: 0, banner: 0 };
    const fx = K.sparks(32, [LCD_DK, LCD_INK], 80), plus = K.worded("+");
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
      trail.fill(0); trail[1 * MAXW + 1] = 1; S.banner = 1.2;
    };
    const move = (dx, dy) => {
      const nx = S.x + dx, ny = S.y + dy;
      if (grid[ny * MAXW + nx]) { out.cue("bump", 0.25); J.shake(0.6); return; }
      S.x = nx; S.y = ny; S.moves++; out.cue("tap", 0.2); trail[ny * MAXW + nx] = 1;
      if (S.x === S.ex && S.y === S.ey) {
        const gain = 200 + Math.ceil(S.time);
        status.score += gain;
        J.shake(1.2); out.cue("win", 0.4);
        out.popup(plus(gain), S.level + 1 >= LEVELS); if (!host.still) fx.spawn(S.ox + S.ex * S.cell + (S.cell >> 1), S.oy + S.ey * S.cell + (S.cell >> 1), 12, 45, 0, 1, 0.6);
        if (S.level + 1 >= LEVELS) { S.win = 1; finish(true); } else load(S.level + 1);
      }
    };
    const step = (dt) => {
      if (S.phase === "play") { S.time -= dt; if (S.time <= 0) { S.time = 0; finish(S.level >= 2); } }
      tickEnd(B, S, dt);
    };
    const run = K.stepper(step);
    const reset = () => { S.moves = 0; S.time = TIME; S.end = 0; S.ended = 0; S.win = 0; S.steps = aim.steps; S.stepsY = aim.stepsY; status.score = 0; status.verb = ""; load(0); J.reset(); fx.clear(); S.banner = 0; };
    reset();
    return {
      kind: "pocket", name: "Pocket Route", aims: true, status, roundLabel: "Maze",
      help: "You are the @. The arrows or W A S D move a square at a time; reach the + exit. Five mazes, each bigger, before the clock runs out.",
      coach: ["Arrows or W A S D move, reach the +", "Swipe to move, reach the +"], stars: [600, 1000, 1400], tickets: (s) => Math.floor(s / 200),
      get playing() { return S.phase === "play"; },
      start: (seed) => { S.seed = Number.isInteger(seed) ? seed >>> 0 : 1; rng.seed(S.seed); reset(); S.phase = "play"; S.banner = 1.2; },
      stop: () => { S.phase = "idle"; reset(); },
      act: () => {},
      update: (dt) => {
        J.update(dt); fx.update(dt); S.t += dt; S.banner = Math.max(0, S.banner - dt);
        if (S.phase === "play") {
          while (aim.steps !== S.steps) { const d = aim.steps > S.steps ? 1 : -1; S.steps += d; move(d, 0); if (S.phase !== "play") { S.steps = aim.steps; break; } }
          while (aim.stepsY !== S.stepsY) { const d = aim.stepsY > S.stepsY ? 1 : -1; S.stepsY += d; move(0, d); if (S.phase !== "play") { S.stepsY = aim.stepsY; break; } }
        } else { S.steps = aim.steps; S.stepsY = aim.stepsY; }
        if (S.phase !== "idle") run(dt);
      },
      draw: (ctx) => {
        // The handheld's case round its green screen, the screen's own faint pixel grid.
        ctx.fillStyle = CASE; ctx.fillRect(0, 0, W, 120);
        ctx.fillStyle = CASE_LT; ctx.fillRect(2, 12, W - 4, 96);
        ctx.fillStyle = LCD; ctx.fillRect(4, 14, W - 8, 92);
        ctx.fillStyle = LCD_MID; ctx.globalAlpha = 0.18;
        for (let gx = 4; gx < W - 4; gx += 4) ctx.fillRect(gx, 14, 1, 92);
        ctx.globalAlpha = 1;
        J.begin(ctx);
        const c = S.cell, blink = blinkOn(host, S.t, 3);
        for (let y = 0; y < S.h; y++) for (let x = 0; x < S.w; x++) {
          const k = y * MAXW + x;
          if (grid[k]) { ctx.fillStyle = LCD_DK; ctx.fillRect(S.ox + x * c, S.oy + y * c, c, c); }
          else if (trail[k]) { ctx.fillStyle = LCD_MID; ctx.fillRect(S.ox + x * c + (c >> 1) - 1, S.oy + y * c + (c >> 1) - 1, 2, 2); }
        }
        ctx.fillStyle = blink ? LCD_MID : LCD; ctx.fillRect(S.ox + S.ex * c + 1, S.oy + S.ey * c + 1, c - 2, c - 2);
        ctx.fillStyle = LCD_DK; ctx.fillRect(S.ox + S.ex * c + (c >> 1) - 1, S.oy + S.ey * c + 2, 2, c - 4); ctx.fillRect(S.ox + S.ex * c + 2, S.oy + S.ey * c + (c >> 1) - 1, c - 4, 2);
        ctx.fillStyle = LCD_INK; ctx.fillRect(S.ox + S.x * c + 1, S.oy + S.y * c + 1, c - 2, c - 2);
        ctx.fillStyle = LCD; ctx.fillRect(S.ox + S.x * c + (c >> 1) - 1, S.oy + S.y * c + (c >> 1) - 1, 2, 2);
        fx.draw(ctx);
        J.end(ctx);
        // The clock as an LCD bar along the screen's top edge.
        bar(ctx, 6, 16, W - 12, 2, S.time / TIME, LCD, S.time < 15 && blink ? LCD_MID : LCD_DK);
        text(ctx, "POCKET ROUTE", 4, 3, TEXT.lime);
        number(ctx, host.best || 0, W - 4, 3, TEXT.gold, 1, 2, 3);
        text(ctx, "MAZE", 4, 109, TEXT.stone); number(ctx, S.level + 1, 30, 109, TEXT.lime); text(ctx, "/5", 36, 109, TEXT.stone);
        text(ctx, "MOVES", 56, 109, TEXT.stone); number(ctx, S.moves, 88, 109, TEXT.bone);
        text(ctx, "TIME", 104, 109, TEXT.stone); number(ctx, Math.ceil(S.time), 156, 109, S.time < 15 ? TEXT.red : TEXT.sky, 1, 2);
        if (S.phase === "idle") { if (blink) centre(ctx, "PRESS START", 60, TEXT.night); }
        else if (S.phase === "end") { ctx.fillStyle = LCD; ctx.fillRect(40, 56, 80, 15); centre(ctx, status.verb, 60, TEXT.night); }
        else if (S.banner > 0) { ctx.fillStyle = LCD; ctx.fillRect(56, 56, 48, 15); ctx.fillStyle = LCD_DK; ctx.fillRect(56, 56, 48, 1); ctx.fillRect(56, 70, 48, 1); text(ctx, "MAZE", 64, 60, TEXT.night); number(ctx, S.level + 1, 92, 60, TEXT.night); }
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
    // Presentation only: how long ago each jack was patched or rang off, sparks, the score popup.
    const patched = new Float32Array(N), dropped = new Float32Array(N);
    const S = { phase: "idle", cx: 0, cy: 0, steps: 0, stepsY: 0, spawn: 0, lost: 0, time: TIME, end: 0, ended: 0, seed: 1, done: 0, t: 0 };
    const fx = K.sparks(48, [INK.banana, INK.white, INK.red, INK.ember], 110), plus = K.worded("+");
    const finish = ender(B, S);
    const step = (dt) => {
      if (S.phase === "play") {
        S.time -= dt;
        if ((S.spawn -= dt) <= 0) { const k = rng.int(N); if (wait[k] <= 0) wait[k] = WAIT - Math.min(2, S.done * 0.06); S.spawn = 1.4 - Math.min(0.8, S.done * 0.03); }
        for (let k = 0; k < N; k++) if (wait[k] > 0 && (wait[k] -= dt * (host.still ? 0.6 : 1)) <= 0) {
          wait[k] = 0; S.lost++; out.cue("bump", 0.4); J.flash(INK.red, 0.3);
          dropped[k] = 0.6; if (!host.still) fx.spawn(JX + (k % COLS) * JW + 15, JY + ((k / COLS) | 0) * JH + 5, 6, 35, 2, 3, 0.5);
          if (S.lost >= 5) { finish(S.done >= 20); return; }
        }
        if (S.time <= 0) { S.time = 0; finish(S.done >= 20); }
      }
      tickEnd(B, S, dt);
    };
    const run = K.stepper(step);
    const reset = () => { wait.fill(0); S.cx = S.cy = 0; S.steps = aim.steps; S.stepsY = aim.stepsY; S.spawn = 0.5; S.lost = 0; S.time = TIME; S.end = 0; S.ended = 0; S.done = 0; status.score = 0; status.verb = ""; J.reset(); fx.clear(); patched.fill(0); dropped.fill(0); };
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
        if (wait[k] > 0) {
          const gain = 10 + Math.ceil(wait[k] * 4);
          status.score += gain; wait[k] = 0; S.done++; out.cue("tap", 0.5); J.shake(1);
          patched[k] = 0.6; out.popup(plus(gain), false); if (!host.still) fx.spawn(JX + S.cx * JW + 15, JY + S.cy * JH + 14, 8, 45, 0, 1, 0.5);
        }
        else out.cue("bump", 0.2);
      },
      update: (dt) => {
        J.update(dt); fx.update(dt); S.t += dt;
        for (let k = 0; k < N; k++) { if (patched[k] > 0) patched[k] = Math.max(0, patched[k] - dt); if (dropped[k] > 0) dropped[k] = Math.max(0, dropped[k] - dt); }
        if (aim.steps !== S.steps) { S.cx = Math.max(0, Math.min(COLS - 1, S.cx + (aim.steps - S.steps))); S.steps = aim.steps; }
        if (aim.stepsY !== S.stepsY) { S.cy = Math.max(0, Math.min(ROWS - 1, S.cy + (aim.stepsY - S.stepsY))); S.stepsY = aim.stepsY; }
        if (S.phase !== "idle") run(dt);
      },
      draw: (ctx) => {
        ctx.fillStyle = INK.earthDk; ctx.fillRect(0, 0, W, 120);
        J.begin(ctx);
        const blink = blinkOn(host, S.t, 3);
        // The board: a timber panel in its frame, a grain line under each row of jacks.
        ctx.fillStyle = INK.huskDk; ctx.fillRect(JX - 8, JY - 8, COLS * JW + 16, ROWS * JH + 14);
        ctx.fillStyle = INK.husk; ctx.fillRect(JX - 6, JY - 6, COLS * JW + 12, ROWS * JH + 10);
        ctx.fillStyle = INK.ochre; ctx.globalAlpha = 0.25;
        for (let r = 0; r < ROWS; r++) ctx.fillRect(JX - 6, JY + r * JH + 20, COLS * JW + 12, 1);
        ctx.globalAlpha = 1;
        for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
          const k = r * COLS + c, x = JX + c * JW, y = JY + r * JH, lit = wait[k] > 0;
          // The call lamp in its rim, white-hot at its corner while lit, red and blinking as it is about to ring off.
          ctx.fillStyle = INK.charcoal; ctx.fillRect(x + 9, y + 1, 12, 8);
          ctx.fillStyle = lit ? (wait[k] < 1.5 && (Math.floor(wait[k] * 6) & 1) ? INK.red : INK.banana) : dropped[k] > 0 ? INK.rust : INK.huskDk; ctx.fillRect(x + 10, y + 2, 10, 6);
          if (lit) { ctx.fillStyle = INK.white; ctx.fillRect(x + 11, y + 3, 2, 1); }
          // How long the call will wait, a bar beside its socket.
          if (lit) { const k5 = Math.min(1, wait[k] / WAIT), h = Math.max(1, Math.round(k5 * 6)); ctx.fillStyle = k5 > 0.5 ? INK.lime : k5 > 0.3 ? INK.gold : INK.red; ctx.fillRect(x + 5, y + 17 - h, 2, h); }
          // The socket: a dark ring round its hole, a teal plug in it for a moment once patched.
          ctx.fillStyle = INK.charcoal; ctx.fillRect(x + 12, y + 11, 6, 6);
          ctx.fillStyle = patched[k] > 0 ? INK.teal : INK.night; ctx.fillRect(x + 14, y + 13, 2, 2);
        }
        // The cord from the plug shelf under the board up to the jack the plug is over, slung in a sag.
        const px = JX + S.cx * JW + 15, py = JY + S.cy * JH + 17, ax = JX + COLS * JW / 2, ay = JY + ROWS * JH + 4;
        const mx = (px + ax) / 2, my = Math.min(ay + 6, Math.max(py, ay) + 8);
        ctx.fillStyle = INK.rust;
        for (let i = 0; i <= 20; i++) { const u = i / 20, v = 1 - u; ctx.fillRect(Math.round(v * v * px + 2 * u * v * mx + u * u * ax), Math.round(v * v * py + 2 * u * v * my + u * u * ay), 2, 2); }
        ctx.fillStyle = INK.charcoal; ctx.fillRect(ax - 6, ay, 12, 3);
        if (S.phase === "play") { ctx.fillStyle = blink ? INK.teal : INK.sky; ctx.fillRect(px - 2, py - 1, 4, 4); ctx.fillRect(px - 1, py - 4, 2, 3); }
        fx.draw(ctx);
        J.end(ctx);
        text(ctx, "SWITCHBOARD", 4, 3, TEXT.bone);
        number(ctx, host.best || 0, W - 4, 3, TEXT.gold, 1, 2, 3);
        text(ctx, "CALLS", 4, 98, TEXT.stone); number(ctx, S.done, 36, 98, TEXT.banana);
        text(ctx, "LOST", 56, 98, TEXT.stone); pips(ctx, 82, 99, S.lost, 5, INK.red, INK.rule, 5);
        text(ctx, "TIME", 108, 98, TEXT.stone); number(ctx, Math.ceil(S.time), 156, 98, S.time < 10 ? TEXT.red : TEXT.sky, 1, 2);
        bar(ctx, 108, 106, 48, 2, S.time / TIME, INK.earth, INK.sky);
        if (S.phase === "idle") { if (blink) centre(ctx, "PRESS START", 110, TEXT.banana); }
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
    // Presentation only: each code's outcome for its lock (1 cracked, 2 failed), the code a failed one was, sparks.
    const result = new Uint8Array(CODES), was = new Uint8Array(SLOTS);
    const S = { phase: "idle", slot: 0, steps: 0, stepsY: 0, tries: 0, codes: 0, end: 0, ended: 0, seed: 1, solved: 0, t: 0, reveal: 0, cracked: 0 };
    const fx = K.sparks(40, [INK.gold, INK.white, INK.teal, INK.red], 110), plus = K.worded("+");
    const finish = ender(B, S);
    const newCode = () => { for (let i = 0; i < SLOTS; i++) code[i] = rng.int(SYMS); guess.fill(0); S.tries = 0; S.slot = 0; };
    const step = (dt) => tickEnd(B, S, dt);
    const run = K.stepper(step);
    const reset = () => { S.steps = aim.steps; S.stepsY = aim.stepsY; S.codes = 0; S.solved = 0; S.end = 0; S.ended = 0; status.score = 0; status.verb = ""; status.round = 1; newCode(); J.reset(); fx.clear(); result.fill(0); S.reveal = 0; S.cracked = 0; };
    // A symbol: its colour with a dark mark of its own shape, so no two read alike by colour alone.
    const sym = (ctx, s, x, y, d) => {
      ctx.fillStyle = SYM_INK[s]; ctx.fillRect(x, y, d, d);
      ctx.fillStyle = INK.night;
      const m = d >> 1;
      if (s === 0) ctx.fillRect(x + m - 1, y + m - 1, 2, 2);
      else if (s === 1) ctx.fillRect(x + 2, y + m, d - 4, 1);
      else if (s === 2) ctx.fillRect(x + m, y + 2, 1, d - 4);
      else if (s === 3) { ctx.fillRect(x + 2, y + m, d - 4, 1); ctx.fillRect(x + m, y + 2, 1, d - 4); }
      else if (s === 4) { ctx.fillRect(x + 2, y + 2, 2, 2); ctx.fillRect(x + d - 4, y + d - 4, 2, 2); }
      else { ctx.fillRect(x + 2, y + 2, d - 4, d - 4); ctx.fillStyle = SYM_INK[s]; ctx.fillRect(x + 3, y + 3, d - 6, d - 6); }
    };
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
          const gain = (TRIES - S.tries + 1) * 100;
          status.score += gain; S.solved++; result[S.codes] = 1; S.codes++; status.round = S.codes + 1; J.shake(1.5);
          S.cracked = 0.8; out.popup(plus(gain), true); if (!host.still) fx.spawn(52, 92, 14, 60, 0, 1, 0.7);
          if (S.codes >= CODES) { finish(true); return; }
          newCode();
        } else if (S.tries >= TRIES) {
          was.set(code); S.reveal = 2;
          result[S.codes] = 2; S.codes++; status.round = S.codes + 1; J.flash(INK.red, 0.3); if (S.codes >= CODES) { finish(S.solved >= 2); return; } newCode();
        } else if (g && !host.still) fx.spawn(98, 14 + (Math.min(S.tries, 6) - 1) * 11 + 3, g * 2, 25, 0, 0, 0.35);
      },
      update: (dt) => {
        J.update(dt); fx.update(dt); S.t += dt; S.reveal = Math.max(0, S.reveal - dt); S.cracked = Math.max(0, S.cracked - dt);
        if (S.phase === "play") {
          if (aim.steps !== S.steps) { S.slot = Math.max(0, Math.min(SLOTS - 1, S.slot + (aim.steps - S.steps))); S.steps = aim.steps; }
          if (aim.stepsY !== S.stepsY) { guess[S.slot] = (guess[S.slot] + SYMS * 4 + (S.stepsY - aim.stepsY)) % SYMS; S.stepsY = aim.stepsY; }
        } else { S.steps = aim.steps; S.stepsY = aim.stepsY; }
        if (S.phase !== "idle") run(dt);
      },
      draw: (ctx) => {
        ctx.fillStyle = INK.night; ctx.fillRect(0, 0, W, 120);
        J.begin(ctx);
        const blink = blinkOn(host, S.t, 3), first = Math.max(0, S.tries - 6);
        // The tries so far on their strips, numbered, each with its marks in a square of four.
        for (let t = first; t < S.tries; t++) {
          const y = 14 + (t - first) * 11;
          ctx.fillStyle = INK.deep; ctx.fillRect(14, y - 1, 94, 10);
          number(ctx, t + 1, 22, y + 1, TEXT.stone, 1, 2);
          for (let i = 0; i < SLOTS; i++) sym(ctx, rows[t * SLOTS + i], 30 + i * 14, y, 8);
          for (let m = 0; m < SLOTS; m++) { ctx.fillStyle = m < gold[t] ? INK.gold : m < gold[t] + white[t] ? INK.bone : INK.rule; ctx.fillRect(94 + (m & 1) * 5, y + (m >> 1) * 4, 3, 3); }
        }
        // The guess being set, the chosen slot with arrows for W and S.
        ctx.fillStyle = S.cracked > 0 ? INK.gold : INK.rule; ctx.fillRect(26, 85, 58, 15);
        ctx.fillStyle = INK.cave; ctx.fillRect(27, 86, 56, 13);
        for (let i = 0; i < SLOTS; i++) {
          sym(ctx, guess[i], 30 + i * 14, 88, 9);
          if (i === S.slot && S.phase === "play") {
            ctx.fillStyle = INK.teal; ctx.fillRect(30 + i * 14, 101, 9, 2);
            if (blink) { ctx.fillRect(34 + i * 14, 81, 1, 1); ctx.fillRect(33 + i * 14, 82, 3, 1); }
          }
        }
        // The three codes as locks: open gold when cracked, red when lost, the one in play blinking.
        for (let c = 0; c < CODES; c++) {
          const x = 122 + c * 12, open = result[c] === 1;
          ctx.fillStyle = result[c] === 1 ? INK.gold : result[c] === 2 ? INK.red : c === S.codes && S.phase === "play" ? (blink ? INK.teal : INK.leaf) : INK.stoneDk;
          ctx.fillRect(x, 20, 8, 6);
          ctx.fillRect(x + 1, open ? 14 : 16, 1, 4); ctx.fillRect(x + 6, 16, 1, 4); ctx.fillRect(x + 1, open ? 14 : 15, 6, 1);
          ctx.fillStyle = INK.night; ctx.fillRect(x + 3, 22, 2, 2);
        }
        // A code lost: what it was, for a moment.
        if (S.reveal > 0) { text(ctx, "WAS", 122, 34, TEXT.red); for (let i = 0; i < SLOTS; i++) sym(ctx, was[i], 114 + i * 11, 44, 8); }
        fx.draw(ctx);
        J.end(ctx);
        text(ctx, "CODE BREAKER", 4, 3, TEXT.bone);
        number(ctx, host.best || 0, W - 4, 3, TEXT.gold, 1, 2, 3);
        text(ctx, "TRY", 96, 90, TEXT.stone); number(ctx, S.tries + 1, 120, 90, TEXT.banana); text(ctx, "/8", 128, 90, TEXT.stone);
        if (S.phase === "idle") { if (blink) centre(ctx, "PRESS START", 110, TEXT.banana); }
        else if (S.phase === "end") centre(ctx, status.verb, 110, S.solved >= 2 ? TEXT.teal : TEXT.red);
        else if (S.cracked > 0) centre(ctx, "CRACKED", 110, TEXT.gold);
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
    // Presentation only: where the falling piece is drawn (easing to where it was sent), where the last one landed.
    const S = { phase: "idle", x: 80, y: 18, junk: 0, steps: 0, speed: 22, right: 0, wrong: 0, time: TIME, end: 0, ended: 0, seed: 1, flash: 0, ok: 0, t: 0, dx: 80, dy: 18, lx: 0 };
    const fx = K.sparks(40, [INK.lime, INK.white, INK.red, INK.pink], 120), plus = K.worded("+");
    const finish = ender(B, S);
    const drop = () => { S.x = 80; S.y = 18; S.junk = rng.chance(0.5) ? 1 : 0; };
    const step = (dt) => {
      if (S.phase === "play") {
        S.time -= dt; S.flash = Math.max(0, S.flash - dt);
        S.y += S.speed * dt * (host.still ? 0.6 : 1);
        if (S.y >= FLOOR) {
          const toBin = S.x > 80, ok = toBin === !!S.junk;
          if (ok) { S.right++; status.score += 25; S.speed += 1.2; out.cue("tap", 0.4); } else { S.wrong++; out.cue("bump", 0.5); J.flash(INK.red, 0.3); }
          S.ok = ok ? 1 : -1; S.flash = 0.4; S.lx = S.x;
          if (ok) out.popup(plus(25), false);
          if (!host.still) fx.spawn(S.x, FLOOR + 4, ok ? 6 : 8, ok ? 35 : 45, ok ? 0 : 2, ok ? 1 : 3, 0.5);
          if (S.wrong >= 5) { finish(S.right >= 25); return; }
          drop();
        }
        if (S.time <= 0) { S.time = 0; finish(S.right >= 25); }
      }
      tickEnd(B, S, dt);
    };
    const run = K.stepper(step);
    const reset = () => { S.steps = aim.steps; S.speed = 22; S.right = 0; S.wrong = 0; S.time = TIME; S.end = 0; S.ended = 0; S.flash = 0; status.score = 0; status.verb = ""; drop(); J.reset(); fx.clear(); S.dx = S.x; S.dy = S.y; };
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
        J.update(dt); fx.update(dt); S.t += dt;
        if (aim.steps !== S.steps) { if (S.phase === "play") S.x = aim.steps > S.steps ? 124 : 36; S.steps = aim.steps; }
        if (S.phase !== "idle") run(dt);
        // The drawn piece slides across to where it was sent, and starts afresh at the top with each new one.
        if (S.y < S.dy || host.still) S.dx = S.x; else S.dx += (S.x - S.dx) * Math.min(1, dt * 14);
        S.dy = S.y;
      },
      draw: (ctx) => {
        ctx.fillStyle = INK.deep; ctx.fillRect(0, 0, W, 120);
        J.begin(ctx);
        const blink = blinkOn(host, S.t, 3);
        // The chute down the middle and its two ways out.
        ctx.fillStyle = INK.rule; ctx.fillRect(66, 14, 1, 68); ctx.fillRect(93, 14, 1, 68);
        text(ctx, "<", 54, 66, TEXT.sky); text(ctx, ">", 101, 66, TEXT.ember);
        // The inbox, a tray with its lip; the bin, ribbed under its lid. Each lights as a piece lands in it.
        const inHit = S.flash > 0 && S.lx <= 80, binHit = S.flash > 0 && S.lx > 80;
        ctx.fillStyle = inHit ? (S.ok > 0 ? INK.lime : INK.red) : INK.sky; ctx.fillRect(10, FLOOR + 4, 52, 10);
        ctx.fillStyle = INK.deep; ctx.fillRect(13, FLOOR + 5, 46, 3);
        ctx.fillStyle = INK.cream; for (let k = 0; k < Math.min(S.right, 6); k++) ctx.fillRect(16 + k * 7, FLOOR + 5, 5, 2);
        ctx.fillStyle = binHit ? (S.ok > 0 ? INK.lime : INK.red) : INK.rust; ctx.fillRect(98, FLOOR + 4, 52, 10);
        ctx.fillStyle = INK.charcoal; ctx.fillRect(96, FLOOR + 3, 56, 2);
        for (let k = 0; k < 6; k++) ctx.fillRect(104 + k * 8, FLOOR + 7, 1, 6);
        // The piece: a letter with its flap and stamp, or junk shouting with its stars.
        const x = Math.round(S.dx) - 12, y = Math.round(S.y) - 8;
        ctx.fillStyle = S.junk ? INK.pink : INK.cream; ctx.fillRect(x, y, 24, 16);
        ctx.fillStyle = INK.charcoal; ctx.fillRect(x, y, 24, 1);
        if (S.junk) {
          ctx.fillStyle = INK.banana;
          ctx.fillRect(x + 3, y + 7, 3, 1); ctx.fillRect(x + 4, y + 6, 1, 3); ctx.fillRect(x + 18, y + 7, 3, 1); ctx.fillRect(x + 19, y + 6, 1, 3);
          text(ctx, "!!", x + 7, y + 5, TEXT.red);
        } else {
          for (let i = 0; i < 12; i++) { ctx.fillRect(x + i, y + 1 + (i >> 1), 1, 1); ctx.fillRect(x + 23 - i, y + 1 + (i >> 1), 1, 1); }
          ctx.fillStyle = INK.red; ctx.fillRect(x + 18, y + 9, 4, 4);
          ctx.fillStyle = INK.stoneDk; ctx.fillRect(x + 4, y + 10, 10, 1); ctx.fillRect(x + 4, y + 12, 7, 1);
        }
        if (S.flash > 0) { ctx.fillStyle = S.ok > 0 ? INK.lime : INK.red; ctx.fillRect(0, 116, W, 4); }
        fx.draw(ctx);
        J.end(ctx);
        text(ctx, "SPAM SORTER", 4, 3, TEXT.bone);
        number(ctx, host.best || 0, W - 4, 3, TEXT.gold, 1, 2, 3);
        // The clock and the five wrong sorts allowed along the top, the tally between the two destinations.
        text(ctx, "TIME", 4, 14, TEXT.stone); number(ctx, Math.ceil(S.time), 30, 14, S.time < 10 ? TEXT.red : TEXT.sky);
        bar(ctx, 4, 23, 56, 2, S.time / TIME, INK.rule, S.time < 10 && blink ? INK.red : INK.sky);
        text(ctx, "WRONG", 98, 14, TEXT.stone); pips(ctx, 130, 15, S.wrong, 5, INK.red, INK.rule, 6);
        text(ctx, "INBOX", 18, 106, TEXT.sky); text(ctx, "BIN", 114, 106, TEXT.ember);
        number(ctx, S.right, 80, 106, TEXT.lime, 1, 1);
        if (S.phase === "idle") { if (blink) centre(ctx, "PRESS START", 50, TEXT.banana); }
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
    // Presentation only: the stamp left where the last payment was judged (what it was, where, how long ago).
    const S = { phase: "idle", coin: 0, double: 0, x: 0, speed: 34, right: 0, wrong: 0, time: TIME, end: 0, ended: 0, seed: 1, mark: 0, markOk: 0, t: 0, sx: 0, said: 0 };
    const fx = K.sparks(40, [INK.gold, INK.lime, INK.red, INK.white], 110), plus = K.worded("+");
    const STAMPS = ["PAID", "REFUSED", "WRONG"], STAMP_TEXT = [TEXT.lime, TEXT.teal, TEXT.red];
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
      S.sx = Math.max(0, Math.min(W - 40, S.x)); S.said = ok ? (accepted ? 0 : 1) : 2;
      if (ok) out.popup(plus(30), false);
      if (!host.still) fx.spawn(S.sx + 20, ROW + 9, ok ? 8 : 10, ok ? 40 : 50, ok ? (accepted ? 0 : 1) : 2, ok ? 3 : 2, 0.5);
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
    const reset = () => { spent.fill(0); S.speed = 34; S.right = 0; S.wrong = 0; S.time = TIME; S.end = 0; S.ended = 0; S.mark = 0; status.score = 0; status.verb = ""; next(); J.reset(); fx.clear(); };
    reset();
    return {
      kind: "spend", name: "Double Spend", status, roundLabel: "Block",
      help: "Each payment spends a numbered coin. Press Space to accept a payment whose coin is still unspent; let it slide by when its coin was spent already.",
      coach: ["Space accepts an unspent coin", "Tap to accept an unspent coin"], stars: [400, 800, 1200], tickets: (s) => Math.floor(s / 150),
      get playing() { return S.phase === "play"; },
      start: (seed) => { S.seed = Number.isInteger(seed) ? seed >>> 0 : 1; rng.seed(S.seed); reset(); S.phase = "play"; },
      stop: () => { S.phase = "idle"; reset(); },
      act: () => { if (S.phase === "play") judge(true); },
      update: (dt) => { J.update(dt); fx.update(dt); S.t += dt; if (S.phase !== "idle") run(dt); },
      draw: (ctx) => {
        ctx.fillStyle = INK.night; ctx.fillRect(0, 0, W, 120);
        J.begin(ctx);
        const blink = blinkOn(host, S.t, 3);
        // The coins, each numbered (the numbers on two rows, so 10, 11 and 12 stay apart): gold and rimmed while unspent, grey and struck through once spent.
        for (let k = 0; k < COINS; k++) {
          const x = 8 + k * 12;
          ctx.fillStyle = spent[k] ? INK.stoneDk : INK.ochre; disc(ctx, x, 21, 9);
          ctx.fillStyle = spent[k] ? INK.charcoal : INK.gold; disc(ctx, x + 1, 22, 7);
          if (spent[k]) { ctx.fillStyle = INK.red; ctx.fillRect(x, 25, 9, 1); } else { ctx.fillStyle = INK.banana; ctx.fillRect(x + 2, 23, 2, 1); }
          number(ctx, k + 1, x + 5, 33 + (k & 1) * 7, spent[k] ? TEXT.stone : TEXT.bone, 1, 1);
        }
        // The ledger's line, ruled, and the payment on it: a cheque naming the coin it spends.
        ctx.fillStyle = INK.rule; ctx.fillRect(0, ROW - 4, W, 26);
        ctx.fillStyle = INK.deep; for (let lx = 0; lx < W; lx += 8) ctx.fillRect(lx, ROW + 19, 4, 1);
        const x = Math.round(S.x);
        ctx.fillStyle = INK.cream; ctx.fillRect(x, ROW, 40, 18);
        ctx.fillStyle = INK.husk; ctx.fillRect(x, ROW, 40, 2);
        ctx.fillStyle = INK.ochre; disc(ctx, x + 3, ROW + 4, 11);
        ctx.fillStyle = INK.gold; disc(ctx, x + 4, ROW + 5, 9);
        ctx.fillStyle = INK.stoneDk; ctx.fillRect(x + 17, ROW + 14, 20, 1);
        number(ctx, S.coin + 1, x + 36, ROW + 5, TEXT.night, 1, 2);
        // The stamp where the last payment was judged, fading.
        if (S.mark > 0) {
          ctx.fillStyle = S.markOk ? INK.lime : INK.red; ctx.fillRect(0, 84, W, 3);
          ctx.globalAlpha = Math.min(1, S.mark * 2.5); text(ctx, STAMPS[S.said], Math.min(S.sx + 2, 117), ROW + 14, STAMP_TEXT[S.said]); ctx.globalAlpha = 1;
        }
        fx.draw(ctx);
        J.end(ctx);
        text(ctx, "DOUBLE SPEND", 4, 3, TEXT.bone);
        number(ctx, host.best || 0, W - 4, 3, TEXT.gold, 1, 2, 3);
        text(ctx, "COINS", 4, 12, TEXT.stone);
        text(ctx, "OK", 4, 94, TEXT.stone); number(ctx, S.right, 18, 94, TEXT.lime);
        text(ctx, "MISS", 40, 94, TEXT.stone); pips(ctx, 66, 95, S.wrong, 4, INK.red, INK.rule, 7);
        text(ctx, "TIME", 104, 94, TEXT.stone); number(ctx, Math.ceil(S.time), 156, 94, S.time < 10 ? TEXT.red : TEXT.sky, 1, 2);
        bar(ctx, 104, 102, 52, 2, S.time / TIME, INK.rule, S.time < 10 && blink ? INK.red : INK.sky);
        if (S.phase === "idle") { if (blink) centre(ctx, "PRESS START", 110, TEXT.banana); }
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
    // Presentation only: the winning line's stones, sparks off a stone placed, the "thinking" dots.
    const line5 = new Uint8Array(N * N), THINK = ["OOGA THINKS", "OOGA THINKS.", "OOGA THINKS..", "OOGA THINKS..."];
    const S = { phase: "idle", cx: 4, cy: 4, steps: 0, stepsY: 0, turn: YOU, think: 0, moves: 0, winner: 0, end: 0, ended: 0, seed: 1, lastX: -1, lastY: -1, t: 0 };
    const fx = K.sparks(48, [INK.teal, INK.banana, INK.white, INK.gold], 110), plus = K.worded("+");
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
    // The stones of the line that won through (x, y), marked for the end screen.
    const markLine = (x, y, who) => {
      for (let d = 0; d < 8; d += 2) {
        let a = 1, b = 1;
        while (at(x + DIRS[d] * a, y + DIRS[d + 1] * a) === who) a++;
        while (at(x - DIRS[d] * b, y - DIRS[d + 1] * b) === who) b++;
        if (a + b - 1 < 5) continue;
        for (let k = -b + 1; k < a; k++) line5[(y + DIRS[d + 1] * k) * N + x + DIRS[d] * k] = 1;
      }
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
      if (!host.still) fx.spawn(BX + x * CELL + 5, BY + y * CELL + 5, 4, 25, who === YOU ? 0 : 1, 2, 0.35);
      if (run5(x, y, who)) {
        S.winner = who; markLine(x, y, who);
        if (who === YOU) { const gain = 300 + (N * N - S.moves) * 5; status.score += gain; out.popup(plus(gain), true); if (!host.still) fx.spawn(BX + x * CELL + 5, BY + y * CELL + 5, 20, 70, 3, 2, 0.9); }
        finish(who === YOU); return;
      }
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
    const reset = () => { board.fill(0); S.cx = S.cy = 4; S.steps = aim.steps; S.stepsY = aim.stepsY; S.turn = YOU; S.moves = 0; S.winner = 0; S.end = 0; S.ended = 0; S.lastX = S.lastY = -1; status.score = 0; status.verb = ""; J.reset(); fx.clear(); line5.fill(0); };
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
        J.update(dt); fx.update(dt); S.t += dt;
        if (aim.steps !== S.steps) { S.cx = Math.max(0, Math.min(N - 1, S.cx + (aim.steps - S.steps))); S.steps = aim.steps; }
        if (aim.stepsY !== S.stepsY) { S.cy = Math.max(0, Math.min(N - 1, S.cy + (aim.stepsY - S.stepsY))); S.stepsY = aim.stepsY; }
        if (S.phase !== "idle") run(dt);
      },
      draw: (ctx) => {
        ctx.fillStyle = INK.night; ctx.fillRect(0, 0, W, 120);
        J.begin(ctx);
        const blink = blinkOn(host, S.t, 3);
        // The board: timber in a dark frame, a little grain, its lines and five star points.
        ctx.fillStyle = INK.huskDk; ctx.fillRect(BX - 4, BY - 4, N * CELL + 8, N * CELL + 8);
        ctx.fillStyle = INK.ochre; ctx.fillRect(BX - 3, BY - 3, N * CELL + 6, N * CELL + 6);
        ctx.fillStyle = INK.gold; ctx.globalAlpha = 0.2; for (let g = 0; g < 6; g++) ctx.fillRect(BX - 3, BY + 4 + g * 16, N * CELL + 6, 1); ctx.globalAlpha = 1;
        ctx.fillStyle = INK.huskDk;
        for (let k = 0; k < N; k++) { ctx.fillRect(BX + CELL / 2, BY + k * CELL + CELL / 2, (N - 1) * CELL, 1); ctx.fillRect(BX + k * CELL + CELL / 2, BY + CELL / 2, 1, (N - 1) * CELL); }
        for (let s = 0; s < 5; s++) { const sx = s === 2 ? 4 : s & 1 ? 6 : 2, sy = s === 2 ? 4 : s < 2 ? 2 : 6; ctx.fillRect(BX + sx * CELL + 4, BY + sy * CELL + 4, 3, 3); }
        // The stones, round with a highlight and a shadow; the last one marked, the winning five lit at the end.
        for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
          const v = board[y * N + x];
          if (!v) continue;
          const sx = BX + x * CELL + 2, sy = BY + y * CELL + 2;
          if (line5[y * N + x] && blink) { ctx.fillStyle = INK.white; disc(ctx, sx - 1, sy - 1, CELL - 2); }
          ctx.fillStyle = INK.huskDk; ctx.fillRect(sx + 1, sy + CELL - 4, CELL - 6, 1);
          ctx.fillStyle = v === YOU ? INK.teal : INK.banana; disc(ctx, sx, sy, CELL - 4);
          ctx.fillStyle = INK.white; ctx.fillRect(sx + 1, sy + 1, 2, 1);
          if (x === S.lastX && y === S.lastY && (blink || S.phase !== "play")) { ctx.fillStyle = INK.night; ctx.fillRect(sx + 2, sy + 2, 2, 2); }
        }
        // The cursor: four corners, red over a taken point.
        if (S.phase === "play" && S.turn === YOU) {
          const cx = BX + S.cx * CELL, cy = BY + S.cy * CELL;
          ctx.fillStyle = board[S.cy * N + S.cx] ? INK.red : INK.white;
          ctx.fillRect(cx, cy, 3, 1); ctx.fillRect(cx, cy, 1, 3); ctx.fillRect(cx + CELL - 3, cy, 3, 1); ctx.fillRect(cx + CELL - 1, cy, 1, 3);
          ctx.fillRect(cx, cy + CELL - 1, 3, 1); ctx.fillRect(cx, cy + CELL - 3, 1, 3); ctx.fillRect(cx + CELL - 3, cy + CELL - 1, 3, 1); ctx.fillRect(cx + CELL - 1, cy + CELL - 3, 1, 3);
        }
        fx.draw(ctx);
        J.end(ctx);
        text(ctx, "FIVE IN A ROW", 4, 3, TEXT.bone);
        number(ctx, host.best || 0, W - 4, 3, TEXT.gold, 1, 2, 3);
        // The players either side of the board, the one to move lit, and the moves made.
        text(ctx, "YOU", 6, 24, TEXT.teal); ctx.fillStyle = INK.teal; disc(ctx, 10, 34, 8);
        text(ctx, "OOGA", 130, 24, TEXT.banana); ctx.fillStyle = INK.banana; disc(ctx, 138, 34, 8);
        if (S.phase === "play") { ctx.fillStyle = S.turn === YOU ? INK.teal : INK.banana; ctx.fillRect(S.turn === YOU ? 6 : 130, 45, S.turn === YOU ? 17 : 23, 1); }
        text(ctx, "MOVE", 6, 60, TEXT.stone); number(ctx, S.moves, 6, 70, TEXT.bone);
        if (S.phase === "idle") { if (blink) centre(ctx, "PRESS START", 110, TEXT.banana); }
        else if (S.phase === "end") centre(ctx, S.winner === YOU ? "YOU WIN" : S.winner === OOGA ? "OOGA WINS" : "DRAW", 110, S.winner === YOU ? TEXT.teal : TEXT.red);
        else if (S.turn === YOU) centre(ctx, "YOUR MOVE", 110, TEXT.teal);
        else centre(ctx, THINK[host.still ? 3 : ((S.t * 4) | 0) % 4], 110, TEXT.banana);
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
    // Presentation only: a box's flash as it is won, the line drawn last (so the Ooga's move shows), sparks.
    const won = new Float32Array(BOXES * BOXES), THINK = ["OOGA THINKS", "OOGA THINKS.", "OOGA THINKS..", "OOGA THINKS..."];
    const S = { phase: "idle", cx: 1, cy: 0, steps: 0, stepsY: 0, turn: YOU, think: 0, you: 0, ooga: 0, end: 0, ended: 0, seed: 1, t: 0, last: -1, lastT: 0 };
    const fx = K.sparks(48, [INK.teal, INK.banana, INK.white, INK.gold], 110), plus = K.worded("+");
    const finish = ender(B, S);
    const isLine = (x, y) => x >= 0 && y >= 0 && x < G && y < G && ((x & 1) !== (y & 1));
    const presentSides = (bx, by) => { const x = bx * 2 + 1, y = by * 2 + 1; return (line[(y - 1) * G + x] ? 1 : 0) + (line[(y + 1) * G + x] ? 1 : 0) + (line[y * G + x - 1] ? 1 : 0) + (line[y * G + x + 1] ? 1 : 0); };
    const claim = (x, y, who) => {
      line[y * G + x] = who; let closed = 0;
      for (let by = 0; by < BOXES; by++) for (let bx = 0; bx < BOXES; bx++) if (!owner[by * BOXES + bx] && presentSides(bx, by) === 4) {
        owner[by * BOXES + bx] = who; closed++;
        won[by * BOXES + bx] = 0.5; if (!host.still) fx.spawn(GX + bx * SP + 11, GY + by * SP + 11, 8, 40, who === YOU ? 0 : 1, 2, 0.5);
      }
      S.last = y * G + x; S.lastT = 1;
      if (who === YOU) S.you += closed; else S.ooga += closed;
      out.cue(closed ? "win" : "tap", closed ? 0.3 : 0.25);
      if (closed && who === YOU) { status.score += closed * 60; J.shake(1); out.popup(plus(closed * 60), false); }
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
    const px = (x) => GX + (x >> 1) * SP, py = (y) => GY + (y >> 1) * SP;
    const reset = () => { line.fill(0); owner.fill(0); S.cx = 1; S.cy = 0; S.steps = aim.steps; S.stepsY = aim.stepsY; S.turn = YOU; S.you = S.ooga = 0; S.end = 0; S.ended = 0; status.score = 0; status.verb = ""; J.reset(); fx.clear(); won.fill(0); S.last = -1; S.lastT = 0; };
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
        J.update(dt); fx.update(dt); S.t += dt; S.lastT = Math.max(0, S.lastT - dt);
        for (let k = 0; k < BOXES * BOXES; k++) if (won[k] > 0) won[k] = Math.max(0, won[k] - dt);
        while (aim.steps !== S.steps) { const d = aim.steps > S.steps ? 1 : -1; S.steps += d; snap(d, 0); }
        while (aim.stepsY !== S.stepsY) { const d = aim.stepsY > S.stepsY ? 1 : -1; S.stepsY += d; snap(0, d); }
        if (S.phase !== "idle") run(dt);
      },
      draw: (ctx) => {
        ctx.fillStyle = INK.night; ctx.fillRect(0, 0, W, 120);
        J.begin(ctx);
        const blink = blinkOn(host, S.t, 3);
        ctx.fillStyle = INK.cave; ctx.fillRect(GX - 6, GY - 6, BOXES * SP + 14, BOXES * SP + 14);
        // The boxes won: shaded in their owner's colour with an initial, flashing white as they are taken.
        for (let by = 0; by < BOXES; by++) for (let bx = 0; bx < BOXES; bx++) {
          const k = by * BOXES + bx, o = owner[k];
          if (!o) continue;
          ctx.fillStyle = won[k] > 0 ? INK.white : o === YOU ? INK.teal : INK.banana; ctx.globalAlpha = won[k] > 0 ? 0.8 : 0.4; ctx.fillRect(GX + bx * SP + 3, GY + by * SP + 3, SP - 5, SP - 5); ctx.globalAlpha = 1;
          text(ctx, o === YOU ? "Y" : "O", GX + bx * SP + 8, GY + by * SP + 7, o === YOU ? TEXT.teal : TEXT.banana);
        }
        for (let y = 0; y < G; y++) for (let x = 0; x < G; x++) {
          if (!isLine(x, y)) continue;
          const k = y * G + x, v = line[k], cur = S.phase === "play" && S.turn === YOU && x === S.cx && y === S.cy;
          if (!v && !cur) {
            // An undrawn line, faintly dotted, so the board's every move is in view.
            ctx.fillStyle = INK.rule;
            if (y & 1) ctx.fillRect(px(x), py(y - 1) + 9, 2, 2); else ctx.fillRect(px(x - 1) + 9, py(y), 2, 2);
            continue;
          }
          ctx.fillStyle = cur && !v ? (blink ? INK.white : INK.stone) : cur ? INK.red : k === S.last && S.lastT > 0 && blink ? INK.white : v === YOU ? INK.teal : INK.banana;
          if (y & 1) ctx.fillRect(px(x), py(y - 1) + 2, 2, SP - 3); else ctx.fillRect(px(x - 1) + 2, py(y), SP - 3, 2);
        }
        ctx.fillStyle = INK.bone;
        for (let y = 0; y <= BOXES; y++) for (let x = 0; x <= BOXES; x++) ctx.fillRect(GX + x * SP, GY + y * SP, 2, 2);
        fx.draw(ctx);
        J.end(ctx);
        text(ctx, "DOTS AND BOXES", 4, 3, TEXT.bone);
        number(ctx, host.best || 0, W - 4, 3, TEXT.gold, 1, 2, 3);
        text(ctx, "YOU", 4, 102, TEXT.teal); number(ctx, S.you, 30, 102, TEXT.teal);
        text(ctx, "OOGA", 118, 102, TEXT.banana); number(ctx, S.ooga, 156, 102, TEXT.banana, 1, 2);
        // The sixteen boxes as a tug of war: yours from the left, the Ooga's from the right.
        for (let k = 0; k < BOXES * BOXES; k++) { ctx.fillStyle = k < S.you ? INK.teal : k >= BOXES * BOXES - S.ooga ? INK.banana : INK.rule; ctx.fillRect(48 + k * 4, 104, 3, 3); }
        if (S.phase === "play") { ctx.fillStyle = S.turn === YOU ? INK.teal : INK.banana; ctx.fillRect(S.turn === YOU ? 4 : 118, 110, S.turn === YOU ? 17 : 23, 1); }
        if (S.phase === "idle") { if (blink) centre(ctx, "PRESS START", 112, TEXT.banana); }
        else if (S.phase === "end") centre(ctx, S.you > S.ooga ? "YOU WIN" : S.you === S.ooga ? "DRAW" : "OOGA WINS", 112, S.you > S.ooga ? TEXT.teal : TEXT.red);
        else if (S.turn === YOU) centre(ctx, "YOUR LINE", 112, TEXT.teal);
        else centre(ctx, THINK[host.still ? 3 : ((S.t * 4) | 0) % 4], 112, TEXT.banana);
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
