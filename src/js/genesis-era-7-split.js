// Era 7's split chute: a modern museum toy (made in 2026), not historical software and no real machine. A hopper
// holds 50 counters, standing for block 170's 50-coin input (genesis-era-7.js B170); a gate under it sends each
// counter dropped to output 1 or output 2. However they are dropped, hopper and outputs always add up to 50: no
// counter is made or lost. The recorded split is 10 and 40. Nothing here is a wallet, payment, network or mining.
//
// Three faces share one core (`create`), as in genesis-era-0-lamps.js:
//   create()                  the chute: `hopper`, `out` (two counts), `gate` (0 output 1, 1 output 2), `setGate(g)`,
//                             `drop(n)` (n counters through the gate, at most what the hopper holds; returns how many
//                             fell), `matches()` (10 and 40) and `reset()`. `version` moves on every change.
//   terminal(chute, onChange) the terminal shape the workbench opens (GATE, DROP, SHOW, CHECK, INFO, RESET).
//   make(host)                SPLIT CHUTE, a console game on retro-games.js's factory interface: a split is called,
//                             the 50 counters fall one by one, and the visitor swings the gate so exactly the called
//                             number land in output 1. Six rounds, each faster.
(() => {
  "use strict";
  const BL = window.BL = window.BL || {};
  const INPUT = 50, RECORDED = [10, 40];
  const create = () => {
    const S = { hopper: INPUT, out: new Uint8Array(2), gate: 0, version: 0 };
    const setGate = (g) => { S.gate = g ? 1 : 0; S.version++; };
    const drop = (n) => {
      const k = Math.max(0, Math.min(n | 0, S.hopper));
      S.hopper -= k; S.out[S.gate] += k; S.version++;
      return k;
    };
    const reset = () => { S.hopper = INPUT; S.out[0] = S.out[1] = 0; S.gate = 0; S.version++; };
    const total = () => S.hopper + S.out[0] + S.out[1];
    const matches = () => S.out[0] === RECORDED[0] && S.out[1] === RECORDED[1];
    return Object.assign(S, { setGate, drop, reset, total, matches });
  };
  const integer = (word, lo, hi) => /^\d{1,3}$/.test(word || "") && Number(word) >= lo && Number(word) <= hi ? Number(word) : -1;
  const terminal = (chute, onChange) => {
    const C = chute;
    const help = ["GATE 1 or GATE 2 | DROP 1..50 | DROP ALL | SHOW | CHECK | INFO | RESET"];
    const show = () => `Hopper ${C.hopper} + output 1 ${C.out[0]} + output 2 ${C.out[1]} = ${C.total()} counters · gate to output ${C.gate + 1}`;
    return {
      banner: ["Split chute: a modern museum toy, made in 2026, not a real machine or wallet. Type HELP; RESET starts again.", ...help, "", show()], prompt: "CHUTE>",
      run(line) {
        const words = String(line).replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, 60).toUpperCase().split(/\s+/), cmd = words[0];
        if (!cmd || cmd === "HELP") return { lines: help };
        if (cmd === "INFO" || cmd === "MORE") return { lines: ["Fifty counters stand for block 170's 50-coin input. The gate sends each one dropped to output 1 or output 2.",
          "Drop them however you like: hopper and outputs always add up to 50. Block 170's record pays 10 and 40 coins; CHECK lights the lamp when the chute matches.",
          "The chute, its gate and its commands are invented for the museum. A real payment is checked in many more ways."] };
        if (cmd === "SHOW" || cmd === "STATUS") return { lines: [show()] };
        if (cmd === "RESET") { C.reset(); onChange(C); return { lines: ["All 50 counters are back in the hopper; the gate points to output 1.", show()], reset: true }; }
        if (cmd === "GATE") {
          const g = words.length === 2 ? integer(words[1], 1, 2) : -1;
          if (g < 0) return { lines: ["Use GATE 1 or GATE 2."] };
          C.setGate(g - 1); onChange(C); return { lines: [`The gate swings to output ${g}.`, show()] };
        }
        if (cmd === "DROP") {
          const n = words.length === 2 ? (words[1] === "ALL" ? INPUT : integer(words[1], 1, INPUT)) : -1;
          if (n < 0) return { lines: ["Use DROP and a whole number from 1 to 50, or DROP ALL."] };
          if (!C.hopper) return { lines: ["The hopper is empty: nothing fell. RESET fills it again.", show()] };
          const fell = C.drop(n); onChange(C);
          return { lines: [`${fell} counter(s) fell to output ${C.gate + 1}.`, show(), ...(fell < n && words[1] !== "ALL" ? [`Only ${fell} were left in the hopper.`] : []), ...(C.matches() ? ["That is block 170's split: 10 and 40. The lamp is lit."] : [])] };
        }
        if (cmd === "CHECK") return { lines: [show(), C.matches() ? "That is block 170's recorded split: 10 and 40. The lamp is lit."
          : "Block 170 records 10 and 40. Try GATE 1, DROP 10, GATE 2, DROP ALL."] };
        return { lines: ["Use GATE, DROP, SHOW, CHECK, INFO or RESET."] };
      }
    };
  };

  // ---- SPLIT CHUTE: the console game -------------------------------------------------------------------------------
  // Each round calls a split: k counters for output 1 (round one calls the recorded 10), the rest for output 2. The
  // 50 counters fall from the hopper one at a time; each takes the gate as it stands when it reaches the fork. Space
  // (or a tap) swings the gate; left and right point it. When the last counter lands the round is tallied: exactly k
  // scores 100 plus 20 for every exact round before it in a row; a miss scores 60 less 15 a counter off, at least 0.
  // Six rounds, the drop quickening each round; the run ends after the sixth.
  const ROUNDS = 6, END_S = 1.6, TALLY_S = 1.5, FLY = 12, FALL_S = 0.2, SLIDE_S = 0.28;
  const HOP_X = 80, HOP_Y = 38, FORK_Y = 56, BIN_Y = 78, BIN_X = [14, 98], BIN_W = 48, COL = 10, SLOT_W = 4, SLOT_H = 5;
  const binMid = (side) => BIN_X[side] + BIN_W / 2;
  const make = (host) => {
    const K = BL.retroGames.kit, out = K.hooks(host), aim = out.aim, J = K.juice(host), status = K.makeStatus("Rounds"), rng = K.rng();
    const { W, H, INK, TEXT, text, centre, number } = K;
    const sparks = K.sparks(48, [INK.banana, INK.gold, INK.white, INK.red]);
    const chute = create(), plus = K.worded("+");
    const S = { phase: "idle", round: 0, target: 0, dropped: 0, landed: 0, interval: 0.34, clock: 0, tally: 0, end: 0, ended: 0, streak: 0, steps: 0,
      exact: 0, off: 0, gain: 0, swing: 0, over: 0, seed: 1, blink: 0 };
    // Counters in the air: a fixed pool. stage 0 free, 1 falling to the fork, 2 sliding down a chute; `side` the
    // output it heads for once past the fork.
    const F = { stage: new Uint8Array(FLY), t: new Float32Array(FLY), side: new Uint8Array(FLY) };
    const inAir = () => { let n = 0; for (let i = 0; i < FLY; i++) if (F.stage[i]) n++; return n; };
    const setStatus = () => {
      status.round = S.round; status.left = ROUNDS - S.round; status.target = S.target; status.streak = S.streak;
      status.meter = chute.hopper / INPUT; status.note = "";
    };
    const newRound = () => {
      S.round++;
      S.target = S.round === 1 ? RECORDED[0] : 5 + rng.int(41);
      S.interval = 0.34 - (S.round - 1) * 0.035; S.clock = 0; S.dropped = S.landed = 0; S.over = 0;
      chute.hopper = INPUT; chute.out[0] = chute.out[1] = 0; chute.version++;
      F.stage.fill(0); S.phase = "play"; setStatus();
    };
    const finish = () => {
      S.phase = "end"; S.end = END_S; status.verb = S.exact === ROUNDS ? "PERFECT" : "ALL SPLIT";
      out.cue("win", 0.6); out.over();
      if (S.exact >= ROUNDS / 2) out.crack(true); else out.flop();
    };
    const tallyRound = () => {
      const d = Math.abs(chute.out[0] - S.target);
      S.off = d;
      if (!d) { S.gain = 100 + 20 * S.streak; S.streak++; S.exact++; out.cue("win", 0.4); out.crack(S.streak >= 3); J.flash(INK.lime, 0.25); if (!host.still) sparks.spawn(binMid(0), BIN_Y, 14, 50, 0, 2, 0.6); }
      else { S.gain = Math.max(0, 60 - 15 * d); S.streak = 0; out.cue("lose", 0.4); out.flop(); J.shake(1.5); }
      status.score += S.gain;
      if (S.gain) out.popup(plus(S.gain), !d);
      S.phase = "tally"; S.tally = TALLY_S; setStatus();
    };
    const land = (side) => {
      chute.out[side]++; chute.version++; S.landed++;
      if (side === 0 && chute.out[0] > S.target) { S.over = 0.4; out.cue("bump", 0.25); }
      else out.cue("tick", 0.15);
      if (!host.still) {
        const n = chute.out[side] - 1, x = BIN_X[side] + 4 + (n % COL) * SLOT_W, y = BIN_Y + 25 - ((n / COL) | 0) * SLOT_H;
        sparks.spawn(x + 1, y, 2, 18, side === 0 && chute.out[0] > S.target ? 3 : 2, 1, 0.3);
      }
    };
    const step = (dt) => {
      if (S.phase === "play") {
        S.clock += dt; S.over = Math.max(0, S.over - dt); S.swing = Math.max(0, S.swing - dt);
        if (S.dropped < INPUT && S.clock >= S.interval) {
          for (let i = 0; i < FLY; i++) if (!F.stage[i]) { F.stage[i] = 1; F.t[i] = 0; S.clock -= S.interval; S.dropped++; chute.hopper--; break; }
        }
        for (let i = 0; i < FLY; i++) {
          if (!F.stage[i]) continue;
          F.t[i] += dt;
          if (F.stage[i] === 1 && F.t[i] >= FALL_S) { F.stage[i] = 2; F.t[i] -= FALL_S; F.side[i] = chute.gate; }
          else if (F.stage[i] === 2 && F.t[i] >= SLIDE_S) { F.stage[i] = 0; land(F.side[i]); }
        }
        status.meter = chute.hopper / INPUT;
        if (S.dropped >= INPUT && S.landed >= INPUT) tallyRound();
      } else if (S.phase === "tally") {
        if ((S.tally -= dt) <= 0) { if (S.round >= ROUNDS) finish(); else newRound(); }
      } else if (S.phase === "end" && !S.ended && (S.end -= dt) <= 0) { S.ended = 1; out.onEnd(status.score); }
    };
    const run = K.stepper(step);
    const swing = (g) => { if (chute.gate === g) return; chute.setGate(g); S.swing = 0.15; out.cue("tap", 0.3); };
    const reset = () => {
      chute.reset(); sparks.clear(); J.reset(); F.stage.fill(0);
      S.round = 0; S.target = 0; S.dropped = S.landed = 0; S.clock = 0; S.tally = 0; S.end = 0; S.ended = 0; S.streak = 0; S.exact = 0; S.off = 0; S.gain = 0; S.over = 0; S.swing = 0;
      status.score = 0; status.left = ROUNDS; status.verb = ""; status.meter = -1; status.round = 1; status.streak = 0; status.target = 0;
    };
    reset();
    // A counter as a little coin: a gold disc with a light rim.
    const coin = (ctx, x, y, red) => {
      ctx.fillStyle = red ? INK.red : INK.gold; ctx.fillRect(x, y + 1, 4, 2); ctx.fillRect(x + 1, y, 2, 4);
      ctx.fillStyle = red ? INK.ember : INK.banana; ctx.fillRect(x + 1, y + 1, 1, 1);
    };
    const game = {
      kind: "splitchute", name: "Split Chute", status, roundLabel: "Round", aims: true,
      help: "A split is called. Fifty counters fall one by one; swing the gate with Space (or point it with left and right) so exactly that many land in output 1 and the rest in output 2. A modern museum game, not historical software.",
      coach: ["Space swings the gate, A and D point it", "Tap swings the gate, swipe points it"],
      stars: [300, 550, 800], tickets: (s) => Math.min(20, Math.floor(s / 50)),
      get playing() { return S.phase === "play" || S.phase === "tally"; },
      get phase() { return S.phase; },
      chute,
      start: (seed) => { S.seed = Number.isInteger(seed) ? seed >>> 0 : rng.fresh(); rng.seed(S.seed); reset(); S.steps = aim.steps; newRound(); },
      stop: () => { S.phase = "idle"; reset(); },
      act: () => {
        if (S.phase === "idle") { game.start(); return; }
        if (S.phase === "play") swing(chute.gate ? 0 : 1);
      },
      update: (dt) => {
        J.update(dt); sparks.update(dt);
        if (!host.still) S.blink += dt;
        const ds = aim.steps - S.steps;
        S.steps = aim.steps;
        if (S.phase === "play" && ds) swing(ds < 0 ? 0 : 1);
        if (S.phase !== "idle") run(dt);
      },
      draw: (ctx) => {
        ctx.fillStyle = INK.night; ctx.fillRect(0, 0, W, H);
        J.begin(ctx);
        ctx.fillStyle = INK.deep; ctx.fillRect(0, 0, W, 12);
        // The hopper: a funnel of steel with the counters still in it shown as a level.
        ctx.fillStyle = INK.stoneDk; ctx.fillRect(HOP_X - 22, 16, 44, 2); ctx.fillRect(HOP_X - 22, 16, 2, 14); ctx.fillRect(HOP_X + 20, 16, 2, 14);
        ctx.fillRect(HOP_X - 20, 30, 8, 2); ctx.fillRect(HOP_X + 12, 30, 8, 2); ctx.fillRect(HOP_X - 12, 32, 6, 2); ctx.fillRect(HOP_X + 6, 32, 6, 2);
        ctx.fillRect(HOP_X - 6, 34, 2, 4); ctx.fillRect(HOP_X + 4, 34, 2, 4);
        const level = Math.round(12 * chute.hopper / INPUT);
        if (level) { ctx.fillStyle = INK.gold; ctx.fillRect(HOP_X - 20, 30 - level, 40, level); ctx.fillStyle = INK.banana; ctx.fillRect(HOP_X - 20, 30 - level, 40, 1); }
        number(ctx, chute.hopper, HOP_X, 20, level > 6 ? TEXT.night : TEXT.bone, 1, 1);
        // The two chutes from the fork to the bins, and the gate: a flap at the fork leaning toward the output it
        // feeds (a white flick as it swings).
        ctx.fillStyle = INK.rule;
        for (let k = 0; k <= 20; k++) { const u = k / 20; ctx.fillRect(Math.round(HOP_X + (binMid(0) - HOP_X) * u) - 1, Math.round(FORK_Y + (BIN_Y - 4 - FORK_Y) * u), 3, 2); ctx.fillRect(Math.round(HOP_X + (binMid(1) - HOP_X) * u) - 1, Math.round(FORK_Y + (BIN_Y - 4 - FORK_Y) * u), 3, 2); }
        ctx.fillStyle = INK.stoneDk; ctx.fillRect(HOP_X - 1, 38, 2, FORK_Y - 38);
        ctx.fillStyle = S.swing > 0 && !host.still ? INK.white : INK.teal;
        for (let k = 0; k < 7; k++) ctx.fillRect(HOP_X + (chute.gate ? k : -k) - 1, FORK_Y - 6 + k, 3, 1);
        ctx.fillStyle = INK.ember; ctx.fillRect(HOP_X - 1, FORK_Y - 7, 3, 2);
        // Counters in the air.
        for (let i = 0; i < FLY; i++) {
          if (!F.stage[i]) continue;
          if (F.stage[i] === 1) coin(ctx, HOP_X - 2, Math.round(HOP_Y + (FORK_Y - HOP_Y) * F.t[i] / FALL_S) - 2, false);
          else { const u = F.t[i] / SLIDE_S, tx = binMid(F.side[i]); coin(ctx, Math.round(HOP_X + (tx - HOP_X) * u) - 2, Math.round(FORK_Y + (BIN_Y - FORK_Y) * u) - 4, false); }
        }
        // The bins: each a tray of fifty slots, filled bottom up; output 1 marks the called number's slot, and its
        // counters past it show red.
        for (let side = 0; side < 2; side++) {
          const x = BIN_X[side], n = chute.out[side], want = side === 0 ? S.target : INPUT - S.target;
          ctx.fillStyle = side === 0 ? INK.moss : INK.earth; ctx.fillRect(x, BIN_Y, BIN_W, 31);
          ctx.fillStyle = INK.stoneDk; ctx.fillRect(x - 1, BIN_Y, 1, 32); ctx.fillRect(x + BIN_W, BIN_Y, 1, 32); ctx.fillRect(x - 1, BIN_Y + 31, BIN_W + 2, 1);
          for (let k = 0; k < n && k < INPUT; k++) coin(ctx, x + 4 + (k % COL) * SLOT_W, BIN_Y + 25 - ((k / COL) | 0) * SLOT_H, side === 0 && k >= S.target);
          if (S.phase !== "idle" && want > 0) {
            const m = want - 1, mx = x + 4 + (m % COL) * SLOT_W, my = BIN_Y + 25 - ((m / COL) | 0) * SLOT_H;
            ctx.fillStyle = side === 0 && S.over > 0 && !host.still ? INK.red : INK.banana;
            ctx.fillRect(mx - 1, my - 1, 6, 1); ctx.fillRect(mx - 1, my + 4, 6, 1); ctx.fillRect(mx - 1, my - 1, 1, 6); ctx.fillRect(mx + 4, my - 1, 1, 6);
          }
          text(ctx, side === 0 ? "1" : "2", x, BIN_Y + 34, TEXT.stone);
          number(ctx, n, x + BIN_W - 19, BIN_Y + 34, side === 0 && n > S.target ? TEXT.red : n === want && S.phase !== "idle" ? TEXT.lime : TEXT.bone, 1, 2);
          text(ctx, "/", x + BIN_W - 17, BIN_Y + 34, TEXT.stone);
          number(ctx, want, x + BIN_W - 11, BIN_Y + 34, TEXT.banana);
        }
        sparks.draw(ctx);
        J.end(ctx);
        text(ctx, "SPLIT CHUTE", 3, 3, TEXT.banana);
        number(ctx, status.score, W - 3, 3, TEXT.gold, 1, 2, 3);
        if (S.phase === "idle") {
          centre(ctx, "PRESS START", 44, host.still || ((S.blink * 2) | 0) % 2 === 0 ? TEXT.teal : TEXT.stone);
        } else {
          text(ctx, "ROUND", 3, 24, TEXT.stone); number(ctx, S.round, 36, 24, TEXT.banana); text(ctx, "/6", 42, 24, TEXT.stone);
          for (let k = 0; k < S.streak && k < ROUNDS; k++) { ctx.fillStyle = INK.lime; ctx.fillRect(W - 7 - k * 6, 25, 4, 4); }
          // The tally on a dark band over the chutes: EXACT, or how far off; the run's end in large letters.
          if (S.phase === "tally" || S.phase === "end") { ctx.fillStyle = INK.band; ctx.fillRect(24, 57, W - 48, 18); ctx.fillStyle = INK.rule; ctx.fillRect(24, 57, W - 48, 1); ctx.fillRect(24, 74, W - 48, 1); }
          if (S.phase === "tally" && !S.off) centre(ctx, "EXACT!", 63, TEXT.lime);
          else if (S.phase === "tally") { text(ctx, "OFF BY", 58, 63, TEXT.red); number(ctx, S.off, 102, 63, TEXT.red, 1, 2); }
          if (S.phase === "end") centre(ctx, status.verb, 59, S.exact === ROUNDS ? TEXT.lime : TEXT.banana, 2);
        }
      }
    };
    return game;
  };
  BL.genesisEra7Split = { INPUT, RECORDED, ROUNDS, create, terminal, make };
})();
