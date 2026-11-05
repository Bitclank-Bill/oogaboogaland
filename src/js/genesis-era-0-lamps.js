// Era 0's lamp panel: a modern museum toy, not historical software and no real machine's panel. Eight toggle
// switches each light the lamp over them, and the lamps read together as one number in binary (the left lamp worth
// 128, the right worth 1). The idea it shows, that a row of on-off switches can hold a number, is what the gallery's
// counting machines were built on; the panel's look, its commands and the game are the museum's own.
//
// Three faces share one core (`create`), as in genesis-era-0-nim.js:
//   create()                  the panel: `value` 0..255, `set(n)`, `add(n)` (wraps past 255), `flip(bit)` (bit 0 is the
//                             left switch, worth 128), `shift(dir)` and `clear()`.
//   terminal(panel, onChange) the terminal shape the workbench opens (SET, ADD, FLIP, SHIFT, CLEAR, STATUS, INFO).
//   make(host)                LAMP LOCK, a console game on retro-games.js's factory interface: a number is called,
//                             the visitor flips switches until the lamps show it, against a shrinking clock.
(() => {
  "use strict";
  const BL = window.BL = window.BL || {};
  const games = BL.genesisEra0Games = BL.genesisEra0Games || {};
  const BITS = 8, MAX = 255;
  const create = () => {
    const S = { value: 0 };
    const set = (n) => { S.value = n & MAX; };
    return {
      state: S,
      get value() { return S.value; },
      set,
      add: (n) => { const wrapped = S.value + n > MAX; set(S.value + n); return wrapped; },
      flip: (bit) => set(S.value ^ (1 << (BITS - 1 - bit))),
      shift: (dir) => { const lost = dir < 0 ? (S.value & 128) !== 0 : (S.value & 1) !== 0; set(dir < 0 ? S.value << 1 : S.value >> 1); return lost; },
      clear: () => set(0),
      lit: (bit) => (S.value >> (BITS - 1 - bit) & 1) === 1
    };
  };
  const binary = (n) => { let s = ""; for (let b = BITS - 1; b >= 0; b--) { s += n >> b & 1 ? "1" : "0"; if (b === 4) s += " "; } return s; };
  const integer = (word, lo, hi) => /^\d+$/.test(word || "") && Number(word) >= lo && Number(word) <= hi ? Number(word) : -1;
  const terminal = (panel, onChange) => {
    const help = ["SET 0..255 | ADD 1..255 | FLIP 1..8 | SHIFT LEFT or RIGHT | CLEAR | STATUS | INFO | RESET"];
    const show = () => `Lamps ${binary(panel.value)} = ${panel.value}`;
    return {
      banner: ["Lamp panel: a modern museum toy, not a real machine's panel. Type HELP; RESET starts again.", ...help], prompt: "PANEL>",
      run(line) {
        const words = String(line).trim().slice(0, 96).toUpperCase().split(/\s+/), cmd = words[0];
        if (cmd === "HELP" || !cmd) return { lines: help };
        if (cmd === "INFO" || cmd === "MORE") return { lines: ["Each switch lights the lamp over it. Read together, the eight lamps are one number in binary: the left lamp is worth 128, then 64, 32, 16, 8, 4, 2 and the right lamp 1.", "Counting machines held numbers as rows of on-off parts like these. This panel's look and commands are invented for the museum."] };
        if (cmd === "STATUS") return { lines: [show()] };
        if (cmd === "CLEAR" || cmd === "RESET") { panel.clear(); onChange(panel); return { lines: ["All switches off.", show()] }; }
        if (cmd === "SET") {
          const n = words.length === 2 ? integer(words[1], 0, MAX) : -1;
          if (n < 0) return { lines: ["SET needs one whole number from 0 to 255."] };
          panel.set(n); onChange(panel); return { lines: [show()] };
        }
        if (cmd === "ADD") {
          const n = words.length === 2 ? integer(words[1], 1, MAX) : -1;
          if (n < 0) return { lines: ["ADD needs one whole number from 1 to 255."] };
          const wrapped = panel.add(n); onChange(panel);
          return { lines: [show(), ...(wrapped ? ["Past 255 the eight lamps run out and the count starts again from 0: there is no ninth lamp to carry into."] : [])] };
        }
        if (cmd === "FLIP") {
          const b = words.length === 2 ? integer(words[1], 1, BITS) : -1;
          if (b < 0) return { lines: ["FLIP needs a switch from 1 (the left, worth 128) to 8 (the right, worth 1)."] };
          panel.flip(b - 1); onChange(panel); return { lines: [show()] };
        }
        if (cmd === "SHIFT") {
          const dir = words[1] === "LEFT" ? -1 : words[1] === "RIGHT" ? 1 : 0;
          if (!dir || words.length !== 2) return { lines: ["Use SHIFT LEFT (doubles the number) or SHIFT RIGHT (halves it)."] };
          const lost = panel.shift(dir); onChange(panel);
          return { lines: [show(), dir < 0 ? "Shifting left doubles the number." : "Shifting right halves it, dropping any remainder.", ...(lost ? ["A lit lamp fell off the end."] : [])] };
        }
        return { lines: ["Use SET, ADD, FLIP, SHIFT, CLEAR, STATUS or INFO."] };
      }
    };
  };

  // ---- LAMP LOCK: the console game ---------------------------------------------------------------------------------
  // A number is called; left and right (or a drag) move the cursor along the switches, the action flips the switch
  // under it, and the lamps lock once they show the number. Twelve numbers win; the clock shortens with each; three
  // numbers missed end the run. The switches stay as they were for the next number, so a near number is quick.
  const GOAL = 12, LIVES = 3, END_S = 1.4, PITCH = 18, X0 = (160 - BITS * PITCH) / 2 + 1, LAMP_Y = 30, SW_Y = 60;
  const WEIGHTS = ["128", "64", "32", "16", "8", "4", "2", "1"];
  const make = (host) => {
    const K = BL.retroGames.kit, out = K.hooks(host), aim = out.aim, J = K.juice(host), status = K.makeStatus("Numbers"), rng = K.rng();
    const { W, H, INK, TEXT, text, centre, number, textWidth } = K;
    const panel = create(), sparks = K.sparks(48, [INK.banana, INK.gold, INK.white]);
    const S = { phase: "idle", cursor: 0, steps: 0, target: 0, t: 0, limit: 14, lives: LIVES, done: 0, end: 0, ended: 0, lock: 0, miss: 0, seed: 1 };
    const weightX = new Float32Array(BITS);
    for (let b = 0; b < BITS; b++) weightX[b] = X0 + b * PITCH + 5 - textWidth(WEIGHTS[b]) / 2;
    const plus = K.worded("+");
    const finish = (won) => {
      S.phase = "end"; S.end = END_S; status.verb = won ? "WELL DONE" : "GAME OVER";
      if (won) out.crack(true); else out.flop();
      out.cue(won ? "win" : "lose", 0.6); out.over();
    };
    const next = () => {
      let t; do t = 1 + rng.int(MAX); while (t === panel.value);
      S.target = t; S.limit = Math.max(5, 14 - S.done * 0.75); S.t = S.limit; status.target = t;
    };
    const step = (dt) => {
      if (S.phase === "play") {
        S.lock = Math.max(0, S.lock - dt); S.miss = Math.max(0, S.miss - dt);
        if ((S.t -= dt) <= 0) {
          S.lives--; S.miss = 0.6; out.cue("bump", 0.5); out.flop(); J.flash(INK.red, 0.35);
          if (S.lives <= 0) { finish(false); return; }
          next();
        }
        status.meter = S.t / S.limit;
      } else if (S.phase === "end" && !S.ended && (S.end -= dt) <= 0) { S.ended = 1; out.onEnd(status.score); }
    };
    const run = K.stepper(step);
    const reset = () => {
      panel.clear(); sparks.clear(); J.reset();
      S.cursor = 0; S.lives = LIVES; S.done = 0; S.end = 0; S.ended = 0; S.lock = 0; S.miss = 0; S.t = 0;
      status.score = 0; status.left = GOAL; status.verb = ""; status.meter = -1; status.round = 1;
    };
    reset();
    return {
      kind: "lamps", name: "Lamp Lock", status, roundLabel: "Number", aims: true,
      help: "A number is called. Move along the switches with left and right, flip one with Space, and lock the lamps on the number before the clock runs out. The left lamp is worth 128, the right 1.",
      coach: ["A and D move along the switches, Space flips one", "Drag along the switches, tap to flip"],
      stars: [120, 300, 480], tickets: (s) => Math.floor(s / 60),
      get playing() { return S.phase === "play"; },
      start: (seed) => { S.seed = Number.isInteger(seed) ? seed >>> 0 : 1; rng.seed(S.seed); reset(); S.steps = aim.steps; next(); S.phase = "play"; },
      stop: () => { S.phase = "idle"; reset(); },
      act: () => {
        if (S.phase !== "play") return;
        panel.flip(S.cursor); out.cue("tap", 0.4);
        if (panel.value !== S.target) return;
        const gain = 10 + Math.ceil(S.t * 2);
        status.score += gain; S.done++; status.left = GOAL - S.done; status.round = S.done + 1; S.lock = 0.5;
        out.popup(plus(gain), false); out.cue("win", 0.35); J.shake(1);
        if (!host.still) for (let b = 0; b < BITS; b++) if (panel.lit(b)) sparks.spawn(X0 + b * PITCH + 5, LAMP_Y + 5, 5, 40, 0, 1, 0.5);
        if (S.done % 4 === 0) out.crack(S.done === GOAL);
        if (S.done >= GOAL) { finish(true); return; }
        next();
      },
      update: (dt) => {
        J.update(dt); sparks.update(dt);
        const ds = aim.steps - S.steps;
        S.steps = aim.steps;
        if (S.phase === "play" && ds) S.cursor = Math.min(BITS - 1, Math.max(0, S.cursor + ds));
        if (S.phase !== "idle") run(dt);
      },
      draw: (ctx) => {
        ctx.fillStyle = INK.night; ctx.fillRect(0, 0, W, H);
        J.begin(ctx);
        // The panel: a steel face with a rule over the lamps and a darker strip for the switches.
        ctx.fillStyle = INK.deep; ctx.fillRect(4, 18, W - 8, 70);
        ctx.fillStyle = INK.rule; ctx.fillRect(4, 18, W - 8, 2); ctx.fillRect(4, 54, W - 8, 1);
        ctx.fillStyle = INK.cave; ctx.fillRect(4, 56, W - 8, 30);
        for (let b = 0; b < BITS; b++) {
          const x = X0 + b * PITCH, on = panel.lit(b), here = S.phase === "play" && b === S.cursor;
          // Lamp: a bezel, the glass lit or dark, a glint.
          ctx.fillStyle = INK.stoneDk; ctx.fillRect(x - 1, LAMP_Y - 1, 12, 12);
          ctx.fillStyle = on ? (S.lock > 0 ? INK.white : INK.banana) : INK.earthDk; ctx.fillRect(x, LAMP_Y, 10, 10);
          if (on) { ctx.fillStyle = INK.gold; ctx.fillRect(x, LAMP_Y + 7, 10, 3); ctx.fillStyle = INK.white; ctx.fillRect(x + 2, LAMP_Y + 2, 2, 2); }
          text(ctx, WEIGHTS[b], weightX[b], LAMP_Y + 14, on ? TEXT.banana : TEXT.stone);
          // Switch: a slot and its lever, up when on.
          ctx.fillStyle = INK.band; ctx.fillRect(x + 3, SW_Y, 4, 20);
          ctx.fillStyle = here ? INK.teal : INK.stoneLt; ctx.fillRect(x + 1, on ? SW_Y + 1 : SW_Y + 13, 8, 6);
          if (here) { ctx.fillStyle = INK.teal; ctx.fillRect(x - 2, SW_Y + 22, 14, 2); }
        }
        sparks.draw(ctx);
        // The clock: a bar that runs down, red in its last quarter.
        if (S.phase === "play") { ctx.fillStyle = S.t < S.limit * 0.25 ? INK.red : INK.teal; ctx.fillRect(4, 90, Math.round((W - 8) * S.t / S.limit), 3); }
        J.end(ctx);
        text(ctx, "LAMP LOCK", 4, 3, TEXT.bone);
        number(ctx, host.best || 0, W - 4, 3, TEXT.gold, 1, 2, 3);
        if (S.phase === "play" || S.phase === "end") {
          text(ctx, "MAKE", 32, 98, TEXT.stone); number(ctx, S.target, 60, 96, S.miss > 0 ? TEXT.red : TEXT.banana, 2);
          text(ctx, "NOW", 104, 98, TEXT.stone); number(ctx, panel.value, 140, 98, TEXT.bone);
          for (let k = 0; k < LIVES; k++) { ctx.fillStyle = k < S.lives ? INK.ember : INK.earth; ctx.fillRect(4 + k * 8, 98, 6, 6); }
        }
        if (S.phase === "idle") centre(ctx, "PRESS START", 110, TEXT.banana);
        else if (S.phase === "end") centre(ctx, status.verb, 110, S.done >= GOAL ? TEXT.teal : TEXT.red);
        else centre(ctx, "LIGHT THE NUMBER", 110, TEXT.teal);
      }
    };
  };
  games.lamps = { BITS, create, terminal, make, binary };
})();
