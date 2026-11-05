// Era 5's Pattern Pocket: a portable digital-media player toy, a modern museum homage (not historical software and no
// real product's interface). The library holds six original synthetic visual patterns, each drawn from code and each
// with a size in toy storage units; the visitor organises a tiny playlist of up to four, watches the storage budget,
// and plays the playlist back. No recordings, music or sound of its own: the cave's shared music is the only sound.
//
// Three faces, one set of rules:
//   BL.genesisEra5Mixtape.player()        the rules, pure and Node-loadable: add, remove, move, used, ...
//   BL.genesisEra5Mixtape.make(host)      a game on src/js/retro-games.js's factory interface; reads BL.retroGames.kit
//   BL.genesisEra5Mixtape.terminal(m, n)  a terminal over a player `m` for today's workbench; `n` extra banner lines
//
// The budget and sizes are toy units, not megabytes: no capacity of any real device is implied.
(() => {
  "use strict";
  const BL = window.BL = window.BL || {};
  const BUDGET = 10, SLOTS = 4;
  // [name, size in toy units, what the pattern does]
  const LIBRARY = [
    ["Bars", 2, "upright bars rising and falling in turn"],
    ["Rings", 3, "squares growing outward from the middle"],
    ["Waves", 2, "rows of light sliding side to side"],
    ["Checks", 1, "a checkerboard that swaps its squares"],
    ["Spiral", 4, "a square spiral filling in from the edge"],
    ["Dots", 3, "a grid of dots winking on and off"]
  ];

  // The names as the screen prints them, made once so a frame builds no string.
  const UPPER = LIBRARY.map((p) => p[0].toUpperCase());
  const player = () => {
    const list = new Int8Array(SLOTS).fill(-1);
    const M = { length: 0 };
    const used = () => { let n = 0; for (let i = 0; i < M.length; i++) n += LIBRARY[list[i]][1]; return n; };
    const slotOf = (id) => { for (let i = 0; i < M.length; i++) if (list[i] === id) return i; return -1; };
    // Codes: 0 done, 1 bad pattern or slot, 2 already listed, 3 no free slot, 4 over the budget, 5 not listed.
    const add = (id) => {
      if (!(id >= 0 && id < LIBRARY.length)) return 1;
      if (slotOf(id) >= 0) return 2;
      if (M.length >= SLOTS) return 3;
      if (used() + LIBRARY[id][1] > BUDGET) return 4;
      list[M.length++] = id; return 0;
    };
    const remove = (id) => {
      const at = slotOf(id); if (at < 0) return 5;
      for (let i = at; i < M.length - 1; i++) list[i] = list[i + 1];
      list[--M.length] = -1; return 0;
    };
    // Moves the pattern in slot `at` by `by` (-1 up, 1 down) when there is room that way.
    const move = (at, by) => {
      const to = at + by;
      if (!(at >= 0 && at < M.length && to >= 0 && to < M.length)) return 1;
      const t = list[at]; list[at] = list[to]; list[to] = t; return 0;
    };
    const reset = () => { list.fill(-1); M.length = 0; };
    const score = () => used() * 10 + M.length * 10 + (used() === BUDGET ? 100 : 0);
    return { list, M, used, slotOf, add, remove, move, reset, score };
  };

  // ---- the terminal (today's workbench) -------------------------------------------------------------------
  const SAYS = ["Done.", "Pick a pattern 1 to 6 (or a playlist slot that exists).", "That pattern is already on the playlist.",
    `The playlist holds ${SLOTS} patterns. REMOVE one first.`, `That would pass the ${BUDGET}-unit budget. REMOVE something first.`, "That pattern is not on the playlist."];
  const terminal = (m, extra = []) => {
    const lib = () => LIBRARY.map((p, i) => `${i + 1}. ${p[0]} (${p[1]} units)${m.slotOf(i) >= 0 ? `  on the playlist, slot ${m.slotOf(i) + 1}` : ""}`);
    const listLines = () => m.M.length ? Array.from({ length: m.M.length }, (_, i) => `Slot ${i + 1}: ${LIBRARY[m.list[i]][0]} (${LIBRARY[m.list[i]][1]} units)`) : ["The playlist is empty. ADD a pattern."];
    const budget = () => { const u = m.used(); return `Storage: ${"#".repeat(u)}${".".repeat(BUDGET - u)}  ${u}/${BUDGET} toy units${u === BUDGET ? " (exactly full!)" : ""}.`; };
    const help = ["HINT: fit the patterns you like inside the storage budget.", "HOW TO USE:",
      "  1. Type LIBRARY to see the six patterns and their sizes.",
      "  2. Type ADD and a number to load one; REMOVE and a number unloads it.",
      "  3. Type UP or DOWN and a slot number to reorder the playlist; BUDGET shows the storage bar.",
      "  4. Type PLAY to watch the playlist in order (described here; drawn on the device's screen).",
      "Commands: LIBRARY | PLAYLIST | ADD n | REMOVE n | UP slot | DOWN slot | BUDGET | PLAY | RESET"];
    return { banner: ["PATTERN POCKET / a portable media player toy (modern museum homage; original patterns, no recordings or brand)", ...extra, ...help, budget()], prompt: "POCKET>",
      run(line) {
        const words = String(line).replace(/[\u0000-\u001f\u007f]/g, "").slice(0, 48).trim().toUpperCase().split(/\s+/), cmd = words[0];
        const n = words.length === 2 && /^[1-9]$/.test(words[1]) ? +words[1] - 1 : -1;
        if (!cmd || cmd === "HELP") return { lines: help };
        if (cmd === "LIBRARY" || cmd === "LIST") return { lines: [...lib(), budget()] };
        if (cmd === "PLAYLIST") return { lines: [...listLines(), budget()] };
        if (cmd === "BUDGET") return { lines: [budget(), "Toy units only: they say nothing about any real player's capacity."] };
        if (cmd === "RESET") { m.reset(); return { lines: ["Playlist emptied.", budget()] }; }
        if (cmd === "MORE") return { lines: ["Every pattern is drawn by a few lines of code each frame; nothing is recorded, copied or downloaded.", "Organising what fits was the everyday puzzle of a small player; the numbers here are invented for the toy."] };
        if (cmd === "ADD" || cmd === "REMOVE") { const c = n < 0 ? 1 : cmd === "ADD" ? m.add(n) : m.remove(n); return { lines: [SAYS[c], ...(c ? [] : listLines()), budget()] }; }
        if (cmd === "UP" || cmd === "DOWN") { const c = n < 0 ? 1 : m.move(n, cmd === "UP" ? -1 : 1); return { lines: c ? ["Pick a slot that can move that way."] : listLines() }; }
        if (cmd === "PLAY") return { lines: m.M.length ? Array.from({ length: m.M.length }, (_, i) => `${i + 1}. ${LIBRARY[m.list[i]][0]}: ${LIBRARY[m.list[i]][2]}.`).concat(m.used() === BUDGET ? "A perfect fit: every unit used." : `${BUDGET - m.used()} units still free.`) : ["Nothing to play. ADD a pattern first."] };
        return { lines: ["LIBRARY | PLAYLIST | ADD n | REMOVE n | UP slot | DOWN slot | BUDGET | PLAY | RESET"] };
      } };
  };

  // ---- the retro game ---------------------------------------------------------------------------------------
  // Screen: the library down the left, the playlist on the right, a preview of the selected pattern between them and
  // the storage bar at the foot. Left and right choose a column (library, playlist, PLAY); up and down a row. Space in
  // the library loads or unloads a pattern; in the playlist it lifts a pattern, up and down carry it, Space sets it
  // down; on PLAY it plays the playlist through, SHOW seconds a pattern, and the run ends. Under reduced motion the
  // patterns stand still in a fixed frame.
  const SHOW = 2.5, PX = 58, PY = 22, PS = 44;
  const INKS = ["#ffd23a", "#46ffd2", "#5ec8ff", "#ff5fa2", "#c8ff5a", "#b98cff"];
  // Draws pattern `id` at time `t` into the box at (x, y), `s` pixels square, in fillRects only.
  const drawPattern = (ctx, id, t, x, y, s, INK) => {
    ctx.fillStyle = INK.band; ctx.fillRect(x, y, s, s);
    ctx.fillStyle = INKS[id];
    const c = s >> 1;
    if (id === 0) for (let i = 0; i < 6; i++) { const h = Math.round((0.35 + 0.3 * Math.sin(t * 3 + i)) * s); ctx.fillRect(x + 2 + i * 7, y + s - h, 5, h); }
    else if (id === 1) { const k = (t * 8) % 8; for (let r = 2; r < c; r += 6) { const q = Math.round(r + k) % c; ctx.fillRect(x + c - q, y + c - q, q * 2, 1); ctx.fillRect(x + c - q, y + c + q - 1, q * 2, 1); ctx.fillRect(x + c - q, y + c - q, 1, q * 2); ctx.fillRect(x + c + q - 1, y + c - q, 1, q * 2); } }
    else if (id === 2) for (let r = 0; r < s; r += 4) ctx.fillRect(x + Math.round((Math.sin(t * 2 + r * 0.3) * 0.5 + 0.5) * (s - 16)), y + r, 16, 2);
    else if (id === 3) { const f = (t * 2 | 0) & 1; for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) if (((i + j) & 1) === f) ctx.fillRect(x + i * (s >> 2), y + j * (s >> 2), s >> 2, s >> 2); }
    else if (id === 4) { const n = Math.floor(t * 6) % 40; let px = 0, py = 0, dx = 1, dy = 0, len = 10, run = 0, turn = 0; for (let i = 0; i < n; i++) { ctx.fillRect(x + 2 + px * 4, y + 2 + py * 4, 3, 3); px += dx; py += dy; if (++run === len) { run = 0; const ndx = -dy; dy = dx; dx = ndx; if (++turn % 2 === 0) len--; if (len <= 0) break; } } }
    else for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) if ((((i * 7 + j * 13) ^ (t * 3 | 0)) & 3) !== 0) ctx.fillRect(x + 4 + i * 8, y + 4 + j * 8, 3, 3);
  };
  const make = (host) => {
    const K = BL.retroGames.kit, { W, INK, TEXT, text, centre, number } = K;
    const out = K.hooks(host), aim = out.aim, status = K.makeStatus("Units"), R = K.rng(), m = player();
    const S = { col: 0, row: 0, lift: -1, steps: 0, stepsY: 0, clock: 0, show: 0, at: 0, endT: 0, note: 0, seed: 0, noteT: 0, fill: 0 };
    // The screen's own feedback (no rule reads it): sparks off the storage bar, a shake and flash, and the bar's fill
    // easing to what is loaded (`fill`).
    const J = K.juice(host), sparks = K.sparks(48, [INK.teal, INK.lime, INK.white, INK.banana, INK.red]);
    const say = (n) => { S.note = n; S.noteT = 1; };
    let phase = "idle";
    const NOTES = ["LOAD PATTERNS THAT FIT", "LOADED", "UNLOADED", "PLAYLIST FULL", "OVER THE BUDGET", "LIFTED: UP/DOWN, SPACE", "SET DOWN", "LOAD SOMETHING FIRST", "PLAYING"];
    const sync = () => { status.left = BUDGET - m.used(); status.score = m.score(); status.round = Math.min(S.at + 1, Math.max(1, m.M.length)); };
    const run = K.stepper((h) => {
      const dx = aim.steps - S.steps, dy = aim.stepsY - S.stepsY;
      S.steps = aim.steps; S.stepsY = aim.stepsY;
      if (phase === "play") {
        if (dx) { S.col = Math.max(0, Math.min(2, S.col + dx)); S.row = 0; if (S.lift >= 0) S.lift = -1; }
        if (dy) {
          const rows = S.col === 0 ? LIBRARY.length : S.col === 1 ? Math.max(1, m.M.length) : 1;
          const to = Math.max(0, Math.min(rows - 1, S.row + dy));
          if (S.col === 1 && S.lift >= 0 && to !== S.row) { m.move(S.row, to > S.row ? 1 : -1); S.lift = to; S.row = to; } else S.row = to;
        }
      } else if (phase === "show") {
        S.show -= h;
        if (S.show <= 0) {
          S.at++;
          if (S.at >= m.M.length) {
            phase = "done"; S.endT = 1.2; sync(); out.cue("win"); out.crack(m.used() === BUDGET);
            if (m.used() === BUDGET) { J.flash(INK.lime, 0.35); if (!host.still) for (let i = 0; i < 5; i++) sparks.spawn(40 + i * 20, 54, 6, 55, i & 1, 3, 0.8); }
            out.over();
          }
          else { S.show = SHOW; out.cue("tick"); sync(); J.flash(INK.white, 0.15); }
        }
      } else if (phase === "done") { S.endT -= h; if (S.endT <= 0) { phase = "over"; out.onEnd(status.score); } }
      S.noteT = Math.max(0, S.noteT - h * 3);
      const u = m.used(); S.fill += (u - S.fill) * Math.min(1, h * 12); if (Math.abs(u - S.fill) < 0.01) S.fill = u;
    });
    const act = () => {
      if (phase !== "play") return;
      if (S.col === 0) {
        const c = m.slotOf(S.row) >= 0 ? (m.remove(S.row), -1) : m.add(S.row);
        say(c === -1 ? 2 : c === 0 ? 1 : c === 3 ? 3 : 4); out.cue(c <= 0 ? "click" : "buzzer");
        if (c === 0 && !host.still) sparks.spawn(46 + m.used() * 10 - 4, 79, 8, 40, m.used() === BUDGET ? 1 : 0, 2, 0.5);
        if (c > 0) { J.shake(2); J.flash(INK.red, 0.2); }
      } else if (S.col === 1) {
        if (!m.M.length) { say(7); out.cue("buzzer"); J.shake(1); }
        else if (S.lift >= 0) { S.lift = -1; say(6); out.cue("click"); }
        else { S.lift = S.row; say(5); out.cue("tick"); }
      } else {
        if (!m.M.length) { say(7); out.cue("buzzer"); J.shake(1); return; }
        phase = "show"; S.at = 0; S.show = SHOW; say(8); out.cue("round"); J.flash(INK.teal, 0.25);
      }
      sync();
    };
    return {
      kind: "mixtape", name: "Pattern Pocket", aims: true, status, roundLabel: "Pattern",
      help: "Left and right pick the library, the playlist or PLAY; up and down a row. Space loads or unloads a pattern, lifts and sets down a playlist entry, or plays it through.",
      coach: ["Arrows move, Space loads and plays", "Swipe to move, tap to load and play"],
      stars: [80, 130, 180], tickets: (score) => Math.floor(score / 30),
      get playing() { return phase === "play" || phase === "show"; },
      get seed() { return S.seed; },
      // Nothing here is random; the seed is kept so the console's replay contract still holds.
      start: (seed) => { S.seed = Number.isInteger(seed) ? seed >>> 0 : R.fresh(); m.reset(); phase = "play"; S.col = S.row = 0; S.lift = -1; S.at = 0; S.note = 0; S.steps = aim.steps; S.stepsY = aim.stepsY; S.noteT = S.fill = 0; sparks.clear(); J.reset(); sync(); },
      stop: () => { phase = "idle"; S.lift = -1; sparks.clear(); J.reset(); },
      act,
      update: (dt) => { S.clock += dt; J.update(dt); sparks.update(dt); run(dt); },
      draw: (ctx) => {
        const t = host.still ? 0.6 : S.clock, spin = host.still ? 0 : (S.clock * 8 | 0) & 3;
        ctx.fillStyle = INK.night; ctx.fillRect(0, 0, W, 120);
        if (phase === "idle") {
          centre(ctx, "PATTERN POCKET", 8, TEXT.teal, 2);
          // The pocket device itself: a rounded slab, its screen playing a pattern, a wheel of buttons below.
          ctx.fillStyle = INK.stoneLt; ctx.fillRect(PX - 6, 26, PS + 12, 70); ctx.fillRect(PX - 5, 25, PS + 10, 72);
          ctx.fillStyle = INK.white; ctx.fillRect(PX - 4, 27, PS + 8, 1);
          drawPattern(ctx, (S.clock / 2.5 | 0) % LIBRARY.length, t, PX, 30, PS, INK);
          ctx.fillStyle = INK.stone; ctx.fillRect(PX + 12, 78, 20, 16); ctx.fillRect(PX + 10, 80, 24, 12);
          ctx.fillStyle = INK.stoneLt; ctx.fillRect(PX + 18, 83, 8, 6);
          centre(ctx, "MODERN MUSEUM HOMAGE", 100, TEXT.stone);
          if (host.still || (S.clock * 1.6 | 0) % 2) centre(ctx, "PRESS START", 110, TEXT.banana);
          return;
        }
        J.begin(ctx);
        if (phase === "show" || phase === "done") {
          const at = Math.min(S.at, m.M.length - 1), id = m.list[at];
          ctx.fillStyle = INK.deep; ctx.fillRect(36, 10, 88, 88);
          drawPattern(ctx, id, t, 40, 14, 80, INK);
          // Now playing: a turning disc, the name, which entry, and how far through this one.
          ctx.fillStyle = INKS[id]; ctx.fillRect(4, 14, 14, 14);
          ctx.fillStyle = INK.night; ctx.fillRect(9, 19, 4, 4);
          ctx.fillStyle = INK.white; ctx.fillRect(spin === 0 ? 6 : spin === 1 ? 14 : spin === 2 ? 14 : 6, spin < 2 ? 16 : 24, 2, 2);
          text(ctx, UPPER[id], 40, 101, TEXT.bone);
          number(ctx, at + 1, 104, 101, TEXT.gold); text(ctx, "/", 110, 101, TEXT.stone); number(ctx, m.M.length, 116, 101, TEXT.stone);
          if (phase === "show") { ctx.fillStyle = INK.rule; ctx.fillRect(40, 110, 80, 2); ctx.fillStyle = INK.teal; ctx.fillRect(40, 110, Math.round(80 * (1 - S.show / SHOW)), 2); }
          sparks.draw(ctx);
          J.end(ctx);
          if (phase === "done") centre(ctx, m.used() === BUDGET ? "PERFECT FIT!" : "PLAYLIST DONE", 110, TEXT.lime);
          return;
        }
        // Library: each pattern's ink, its name (lime once loaded) and its size as little blocks.
        text(ctx, "LIBRARY", 2, 2, S.col === 0 ? TEXT.banana : TEXT.stone);
        for (let i = 0; i < LIBRARY.length; i++) {
          const y = 12 + i * 10, on = m.slotOf(i) >= 0, here = S.col === 0 && S.row === i;
          if (here) { ctx.fillStyle = INK.deep; ctx.fillRect(0, y - 1, 56, 9); ctx.fillStyle = INK.banana; ctx.fillRect(0, y - 1, 1, 9); }
          ctx.fillStyle = INKS[i]; ctx.fillRect(2, y + 1, 4, 5);
          text(ctx, UPPER[i], 8, y, on ? TEXT.lime : TEXT.bone);
          for (let k = 0; k < LIBRARY[i][1]; k++) { ctx.fillStyle = on ? INK.lime : INK.stoneDk; ctx.fillRect(53 - k * 3, y + 5, 2, 2); }
        }
        // Preview, in a bezel.
        ctx.fillStyle = INK.stoneDk; ctx.fillRect(PX - 2, PY - 2, PS + 4, PS + 4);
        drawPattern(ctx, S.col === 0 ? S.row : m.M.length ? m.list[Math.min(S.row, m.M.length - 1)] : 3, t, PX, PY, PS, INK);
        // Playlist: a lifted entry rides a warm bar and bobs.
        text(ctx, "PLAYLIST", 108, 2, S.col === 1 ? TEXT.banana : TEXT.stone);
        for (let i = 0; i < SLOTS; i++) {
          const y = 12 + i * 10, lifted = S.col === 1 && S.row === i && S.lift >= 0, bob = lifted && !host.still ? (S.clock * 6 | 0) & 1 : 0;
          if (S.col === 1 && S.row === i) { ctx.fillStyle = S.lift >= 0 ? INK.huskDk : INK.deep; ctx.fillRect(106, y - 1, 54, 9); ctx.fillStyle = INK.banana; ctx.fillRect(106, y - 1, 1, 9); }
          number(ctx, i + 1, 108, y, TEXT.stone);
          if (i < m.M.length) { ctx.fillStyle = INKS[m.list[i]]; ctx.fillRect(114, y + 1 - bob, 2, 5); text(ctx, UPPER[m.list[i]], 118, y - bob, TEXT.bone); }
          else { ctx.fillStyle = INK.rule; ctx.fillRect(118, y + 3, 30, 1); }
        }
        // PLAY: a button that pulses once it has something to play.
        const ready = m.M.length > 0, pulse = ready && !host.still && (S.clock * 2 | 0) % 2;
        ctx.fillStyle = S.col === 2 ? INK.gold : pulse ? INK.huskDk : INK.deep; ctx.fillRect(112, 56, 40, 11);
        ctx.fillStyle = S.col === 2 ? INK.banana : INK.rule; ctx.fillRect(112, 56, 40, 1);
        text(ctx, "PLAY", 121, 58, S.col === 2 ? TEXT.night : ready ? TEXT.bone : TEXT.stone);
        ctx.fillStyle = S.col === 2 ? INK.night : ready ? INK.teal : INK.stoneDk; ctx.fillRect(114, 58, 1, 7); ctx.fillRect(115, 59, 1, 5); ctx.fillRect(116, 60, 1, 3); ctx.fillRect(117, 61, 1, 1);
        // Storage bar: each unit in the ink of the pattern using it, easing in as it loads.
        text(ctx, "STORAGE", 2, 76, TEXT.stone);
        let unit = 0;
        for (let i = 0; i < m.M.length; i++) for (let k = 0; k < LIBRARY[m.list[i]][1]; k++, unit++) {
          ctx.fillStyle = INK.rule; ctx.fillRect(46 + unit * 10, 76, 8, 7);
          const f = Math.max(0, Math.min(1, S.fill - unit));
          if (f > 0) { ctx.fillStyle = INKS[m.list[i]]; ctx.fillRect(46 + unit * 10, 76, Math.max(1, Math.round(8 * f)), 7); }
        }
        for (; unit < BUDGET; unit++) { ctx.fillStyle = INK.rule; ctx.fillRect(46 + unit * 10, 76, 8, 7); }
        number(ctx, m.used(), 46 + BUDGET * 10 + 3, 76, m.used() === BUDGET ? TEXT.lime : TEXT.bone);
        sparks.draw(ctx);
        J.end(ctx);
        const warn = S.note === 3 || S.note === 4 || S.note === 7;
        centre(ctx, NOTES[S.note], 92, S.noteT > 0.6 && !host.still ? TEXT.white : warn ? TEXT.ember : S.note === 1 ? TEXT.lime : TEXT.bone);
        centre(ctx, "TOY UNITS, NOT MEGABYTES", 106, TEXT.stone);
      }
    };
  };

  BL.genesisEra5Mixtape = { player, make, terminal, drawPattern, LIBRARY, BUDGET, SLOTS };
})();
