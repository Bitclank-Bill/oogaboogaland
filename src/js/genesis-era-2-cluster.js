// Era 2's upgrade cluster in the Genesis Voyage: three hands-on modern museum homages in one compact corner of the
// gallery, behind the blind-stamp station (docs/genesis-voyage/exhibits/era-2.md, "Upgrade cluster"):
//
// - FOUR IN A ROW TABLE (`e2-four`): an upright timber grid on a table, the game of genesis-era-2-four.js.
// - COLOUR SCREEN TOY (`e2-crt`): a wooden TV set whose picture is made of red, green and blue light; three knobs set
//   how brightly each colour glows, 0 to 4, and an original picture appears as the colours mix. An honestly simplified
//   explanation, no dates.
// - CASSETTE PLAYER (`e2-cassette`): a procedural portable player with a tape behind its window; PLAY, STOP and REW
//   turn the reels and move the tape between them. No recordings, no music, no sound and no capacity claims: the tape
//   runs at a toy pace.
//
// None makes a historical claim (each is "1980s style", context, made in 2026); their historical placement is on
// HOLD until primary sources are read. genesis-era-2.js calls `build(kit)` from its own build when this file is
// loaded, and `update(dt, state)` from its update. Pure rules first (Node-checkable), then the models. Allocation-free
// per frame; geometry changes only when a knob turns (from a bounded cache of 125 colours).
(() => {
  "use strict";
  const BL = window.BL = window.BL || {};
  const GW = BL.genesisWorld;
  const clean = (text, n = 40) => String(text).replace(/[\u0000-\u001f\u007f]/g, "").slice(0, n).trim();
  const howTo = (steps) => ["HOW TO USE", ...steps.map((s, i) => `${i + 1}. ${s}`), ""];

  // --- The colour screen toy ----------------------------------------------------------------------------------------
  // An original 8 x 5 picture (a sun over hills by a pond): each square names the lights it is made of: K none, R, G,
  // B, Y (red + green), M (red + blue), C (green + blue), W (all three).
  const PIC_W = 8, PIC_H = 5, LEVELS = 4;
  const PICTURE = ["BBBYYBBB", "BBYYYYBB", "MMBBWBMM", "GMMGGMMG", "GGGCCGGG"];
  const MASK = { K: 0, R: 1, G: 2, B: 4, Y: 3, M: 5, C: 6, W: 7 };
  const MASKS = new Uint8Array(PIC_W * PIC_H);
  for (let r = 0; r < PIC_H; r++) for (let c = 0; c < PIC_W; c++) MASKS[r * PIC_W + c] = MASK[PICTURE[r][c]];
  const NAMES = ["black", "red", "green", "yellow", "blue", "magenta", "cyan", "white"];
  const createScreen = () => {
    const s = { r: LEVELS, g: 0, b: 0, version: 0 };
    // The colour of square i at the current levels, as a palette index r * 25 + g * 5 + b (0..124).
    const colourOf = (i) => { const m = MASKS[i]; return (m & 1 ? s.r : 0) * 25 + (m & 2 ? s.g : 0) * 5 + (m & 4 ? s.b : 0); };
    const set = (ch, n) => {
      if (!(Number.isInteger(n) && n >= 0 && n <= LEVELS)) return false;
      s[ch] = n; s.version++; return true;
    };
    const reset = () => { s.r = LEVELS; s.g = 0; s.b = 0; s.version++; };
    // What the eye sees for a mix of lights: its colour name, "dim" below full brightness.
    const nameOf = (r, g, b) => { const m = (r ? 1 : 0) | (g ? 2 : 0) | (b ? 4 : 0), full = Math.max(r, g, b) === LEVELS; return m && !full ? `dim ${NAMES[m]}` : NAMES[m]; };
    return Object.assign(s, { colourOf, set, reset, nameOf });
  };
  const LETTER = ["K", "R", "G", "Y", "B", "M", "C", "W"];
  const screenTerminal = (sc) => {
    const show = () => {
      const rows = [];
      for (let r = 0; r < PIC_H; r++) {
        let line = "  ";
        for (let c = 0; c < PIC_W; c++) { const m = MASKS[r * PIC_W + c], k = (m & 1 && sc.r ? 1 : 0) | (m & 2 && sc.g ? 2 : 0) | (m & 4 && sc.b ? 4 : 0); line += `${LETTER[k]} `; }
        rows.push(line);
      }
      return [`Red ${sc.r}  Green ${sc.g}  Blue ${sc.b}   (each 0 to 4)`, ...rows, "K black, R red, G green, B blue, Y yellow, M magenta, C cyan, W white."];
    };
    return {
      banner: ["COLOUR SCREEN TOY · 1980s style · a modern museum homage", ...howTo([
        "Type G 4 and press Enter to turn the green light up full.",
        "Type B 4 to add blue. Watch new colours appear as the lights mix.",
        "Try R 0 to switch red off. Which parts of the picture go dark?",
        "Type RESET to start again, or MORE to read how it works."]), ...show(), ""],
      prompt: "SCREEN>",
      run: (line) => {
        const input = clean(line).toUpperCase(), parts = input.split(/\s+/), cmd = parts[0];
        if (!cmd) return { lines: [] };
        if (cmd === "HELP") return { lines: ["R n   red light, 0 to 4", "G n   green light, 0 to 4", "B n   blue light, 0 to 4", "ALL n every light at once", "MIX r g b  the colour three lights make", "SHOW  the picture", "RESET start again", "MORE  how it works"] };
        if (cmd === "SHOW") return { lines: show() };
        if (cmd === "MORE") return { lines: SCREEN_DEEPER };
        if (cmd === "RESET") { sc.reset(); return { lines: ["Red full, green and blue off.", ...show()], reset: true }; }
        const n = parseInt(parts[1], 10);
        if (cmd === "R" || cmd === "G" || cmd === "B") {
          if (!sc.set(cmd.toLowerCase(), n)) return { lines: ["Give a level from 0 to 4, like G 3."] };
          return { lines: show() };
        }
        if (cmd === "ALL") {
          if (!(n >= 0 && n <= LEVELS)) return { lines: ["Give a level from 0 to 4, like ALL 4."] };
          sc.set("r", n); sc.set("g", n); sc.set("b", n);
          return { lines: show() };
        }
        if (cmd === "MIX") {
          const [r, g, b] = parts.slice(1, 4).map((v) => parseInt(v, 10));
          if (![r, g, b].every((v) => v >= 0 && v <= LEVELS)) return { lines: ["Give three levels from 0 to 4, like MIX 4 4 0."] };
          return { lines: [`Red ${r}, green ${g} and blue ${b} light together look ${sc.nameOf(r, g, b)}.`] };
        }
        return { lines: ["Unknown command. Type HELP."] };
      }
    };
  };
  const SCREEN_DEEPER = ["COLOUR SCREEN TOY - a modern museum homage, made in 2026",
    "How it works, simplified: a colour picture tube's face is covered in tiny dots or stripes that glow red, green",
    "or blue when its beam strikes them. Up close you can see them; from a little way off your eye blends them into",
    "one colour. Red and green light make yellow, red and blue magenta, green and blue cyan, and all three white.",
    "This toy simplifies a lot: each square here stands for one blended dot, and each knob has only five steps.",
    "A real screen has far more dots and levels, and its mixing is not this exact.",
    "Museum note: no date is claimed for any particular screen; that research is on HOLD."];

  // --- The cassette player ------------------------------------------------------------------------------------------
  // The tape's place as the share wound onto the right-hand (take-up) reel, 0 to 1; PLAY moves it right at a toy pace,
  // REW back left faster, and either stops at the tape's end. No sound, no recording, no running time.
  const PLAY_RATE = 1 / 45, REW_RATE = 1 / 6;
  const createCassette = () => {
    const t = { mode: "stop", pos: 0, version: 0, spinL: 0, spinR: 0 };
    const setMode = (m) => { t.mode = m; t.version++; };
    const play = () => { if (t.pos >= 1) return "end"; setMode("play"); return "play"; };
    const rew = () => { if (t.pos <= 0) return "start"; setMode("rew"); return "rew"; };
    const stop = () => { setMode("stop"); return "stop"; };
    const reset = () => { t.mode = "stop"; t.pos = 0; t.spinL = t.spinR = 0; t.version++; };
    // A reel's wound radius for a share of the tape on it (hub 0.3 to full 1, in the reel's own units).
    const radius = (share) => Math.sqrt(0.09 + share * 0.91);
    // Advances the tape and the reels' turn (the turn only for drawing; `calm` holds it still).
    const step = (dt, calm) => {
      if (t.mode === "stop") return;
      const v = t.mode === "play" ? PLAY_RATE : -REW_RATE, before = t.pos;
      t.pos = Math.max(0, Math.min(1, t.pos + v * dt));
      if (!calm) { const d = (t.pos - before) * 6; t.spinL += d / radius(1 - t.pos); t.spinR += d / radius(t.pos); }
      if ((t.mode === "play" && t.pos >= 1) || (t.mode === "rew" && t.pos <= 0)) { t.mode = "stop"; t.version++; }
    };
    return Object.assign(t, { play, rew, stop, reset, step, radius });
  };
  const cassetteTerminal = (t) => {
    const where = () => `Tape: ${Math.round(t.pos * 100)}% wound onto the right reel. ${t.mode === "play" ? "Playing (the reels turn; there is no sound)." : t.mode === "rew" ? "Rewinding." : "Stopped."}`;
    return {
      banner: ["CASSETTE PLAYER · 1980s style · a modern museum homage", ...howTo([
        "Type PLAY and press Enter: the reels turn and the tape moves past the head.",
        "Type STOP to stop it, and STATUS to see how far the tape has run.",
        "Type REW to rewind the tape back onto the left reel.",
        "Type RESET to start again, or MORE to read about it."]), where(), ""],
      prompt: "TAPE>",
      run: (line) => {
        const cmd = clean(line).toUpperCase().split(/\s+/)[0];
        if (!cmd) return { lines: [] };
        if (cmd === "HELP") return { lines: ["PLAY    run the tape forward", "STOP    stop the tape", "REW     rewind it", "STATUS  how far it has run", "RESET   start again", "MORE    about this player"] };
        if (cmd === "MORE") return { lines: CASSETTE_DEEPER };
        if (cmd === "STATUS") return { lines: [where()] };
        if (cmd === "RESET") { t.reset(); return { lines: ["The tape is wound back to the start.", where()], reset: true }; }
        if (cmd === "PLAY") return { lines: [t.play() === "end" ? "The tape is at its end. Type REW first." : "PLAY: the right reel pulls the tape past the head. (No sound: this is a model.)", where()] };
        if (cmd === "REW" || cmd === "REWIND") return { lines: [t.rew() === "start" ? "The tape is already at the start." : "REW: the left reel winds the tape back quickly.", where()] };
        if (cmd === "STOP") { t.stop(); return { lines: ["STOP: the reels stand still.", where()] }; }
        return { lines: ["Unknown command. Type HELP."] };
      }
    };
  };
  const CASSETTE_DEEPER = ["CASSETTE PLAYER - a modern museum homage, made in 2026",
    "Inside a cassette a thin tape runs from one reel to the other. On PLAY, a turning shaft and a rubber roller pull",
    "the tape past the head at a steady speed, and the right-hand reel winds it up. REWIND spins the left-hand reel",
    "fast to wind the tape back. As one reel fills, the other empties, so their speeds change.",
    "This model plays no sound and holds no recording, and its tape runs at a toy pace: no running time is claimed.",
    "Museum note: no date is claimed for any particular player; that research is on HOLD."];

  // --- Placement ----------------------------------------------------------------------------------------------------
  // In Era 2's own (old-world) coordinates on its left bank: three stations in a row along the bank behind the
  // blind-stamp station, each facing the old stream (+x), walk-up points in front. Clear of the reserved plots, the
  // old ramp's walkway (|z - middle| < 2.6), the lamp posts and every existing exhibit.
  const E = GW.ERAS[2];
  const LAYOUT = {
    four: { x: -15, z: E.z - 5, half: { x: 0.6, z: 0.7 }, h: 1.6, reach: 1.5 },
    crt: { x: -15, z: E.z - 8.5, half: { x: 0.5, z: 0.55 }, h: 1.5, reach: 1.4 },
    cassette: { x: -15, z: E.z - 12, half: { x: 0.4, z: 0.45 }, h: 1.2, reach: 1.4 }
  };
  const KEYS = ["four", "crt", "cassette"];
  const footprints = () => KEYS.map((k) => { const l = LAYOUT[k]; return { x0: l.x - l.half.x, x1: l.x + l.half.x, z0: l.z - l.half.z, z1: l.z + l.half.z }; });
  const walkUp = (k, y) => { const l = LAYOUT[k]; return { x: l.x + l.half.x + 0.8, y, z: l.z }; };
  const SOURCE = ["E2-UPGRADE"];
  const EXHIBITS = {
    four: { id: "e2-four", year: "1980s", connection: "context", title: "Four in a row table: drop counters, get four in a line",
      label: "FOUR IN A ROW · 1980s GALLERY", sub: "a modern original museum game, not from the 1980s",
      date: "1980s style: a modern museum homage made in 2026; when such games were first played is on HOLD and not claimed" },
    crt: { id: "e2-crt", year: "1980s", connection: "context", title: "Colour screen toy: mix red, green and blue light",
      label: "COLOUR SCREEN · 1980s STYLE", sub: "a simplified model · made 2026",
      date: "1980s style: a modern museum homage made in 2026; no date is claimed for any screen" },
    cassette: { id: "e2-cassette", year: "1980s", connection: "context", title: "Cassette player: play, stop and rewind the tape",
      label: "CASSETTE PLAYER · 1980s STYLE", sub: "a working model, no sound · made 2026",
      date: "1980s style: a modern museum homage made in 2026; no date or running time is claimed for any player" }
  };

  // --- Live state, models and registration --------------------------------------------------------------------------
  const createLive = () => {
    const game = BL.genesisEra2Four.createGame(1), screen = createScreen(), tape = createCassette();
    return { game, screen, tape, terminals: { four: BL.genesisEra2Four.terminal(game), crt: screenTerminal(screen), cassette: cassetteTerminal(tape) },
      resetAll: () => { game.reset(1); screen.reset(); tape.reset(); } };
  };
  const FACE_X = Math.PI / 2;
  const build = (kit) => {
    const { top: Y, M, createNode, addChild, place, solid, sign } = kit;
    const live = createLive(), parts = { holes: [], pixels: [], knobs: [], colours: new Array(125).fill(null), shown: -1, tapeShown: -1, gameShown: -1 };
    const node = (geometry, x, y, z, visible = true) => place(createNode({ geometry, position: { x, y, z }, visible }));
    const box = (w, h, d, color, emissive = 0) => M.box({ w, h, d, color, emissive });
    // The board table: a low table, an upright timber grid of 7 x 6 holes facing the walk-up side, and a marker for
    // the last counter dropped. Each hole's geometry is swapped between empty, teal and banana.
    {
      const l = LAYOUT.four, x = l.x, z = l.z;
      solid(1.0, 0.07, 1.3, "#8a6a44", x, Y + 0.7, z);
      for (const dz of [-0.55, 0.55]) solid(0.8, 0.66, 0.08, "#5c4630", x, Y + 0.33, z + dz);
      // Seen from the walk-up side (facing -x) the visitor's left is +z, so column 1 stands at the largest z.
      const cell = 0.15, gx = x - 0.05, gy = Y + 0.8, gz = z + cell * 3;
      solid(0.06, cell * 6 + 0.1, cell * 7 + 0.1, "#7a5a36", gx - 0.02, gy + cell * 3, z);
      solid(0.3, 0.05, cell * 7 + 0.2, "#5c4630", gx, Y + 0.765, z);
      parts.holeGeo = [box(0.02, 0.11, 0.11, "#2a2018"), box(0.03, 0.12, 0.12, "#2fd1c4", 0.4), box(0.03, 0.12, 0.12, "#ffd23a", 0.4)];
      for (let r = 0; r < 6; r++) for (let c = 0; c < 7; c++) parts.holes.push(node(parts.holeGeo[0], gx + 0.02, gy + 0.05 + r * cell + cell / 2, gz - c * cell, true));
      parts.lastMark = node(box(0.02, 0.04, 0.04, "#ffffff", 1.2), gx + 0.04, gy, z, false);
      parts.fourGrid = { gx, gy, gz, cell };
      sign(EXHIBITS.four.label, EXHIBITS.four.sub, x + 0.45, Y + 2.0, z, FACE_X, 0.38);
    }
    // The colour screen: a wood-grain TV set on a stand, its picture 8 x 5 squares, three knobs (red, green, blue).
    {
      const l = LAYOUT.crt, x = l.x, z = l.z;
      solid(0.6, 0.55, 0.9, "#3a3040", x, Y + 0.275, z);
      solid(0.75, 0.6, 1.0, "#7a4e2c", x, Y + 0.85, z);
      solid(0.04, 0.5, 0.75, "#2a2420", x + 0.36, Y + 0.85, z - 0.08);
      solid(0.02, 0.42, 0.66, "#06060a", x + 0.385, Y + 0.85, z - 0.08);
      const px = 0.08, sx = x + 0.4, sy = Y + 0.85 + 2 * px, sz = z - 0.08 + 3.5 * px;
      for (let r = 0; r < PIC_H; r++) for (let c = 0; c < PIC_W; c++) parts.pixels.push(node(box(0.01, px * 0.9, px * 0.9, "#000000"), sx, sy - r * px, sz - c * px));
      ["#e2312f", "#2fbf4f", "#3a6cff"].forEach((col, i) => {
        const k = node(box(0.06, 0.08, 0.08, "#1a1a1e"), x + 0.39, Y + 1.0 - i * 0.14, z + 0.38);
        addChild(k, createNode({ geometry: box(0.065, 0.025, 0.025, col, 0.8), position: { x: 0, y: 0.03, z: 0 } }));
        parts.knobs.push(k);
      });
      solid(0.05, 0.02, 0.4, "#c8c0b0", x - 0.2, Y + 1.17, z - 0.15);
      solid(0.02, 0.25, 0.02, "#c8c0b0", x - 0.2, Y + 1.28, z - 0.3);
      solid(0.02, 0.25, 0.02, "#c8c0b0", x - 0.2, Y + 1.28, z);
      parts.screen = { M, box, px };
      // Every palette colour's square is built here, at build time, so a knob turned later swaps geometry and never
      // makes it (update allocates nothing).
      for (let k = 0; k < parts.colours.length; k++) colourGeo(parts, k);
      sign(EXHIBITS.crt.label, EXHIBITS.crt.sub, x + 0.45, Y + 1.7, z, FACE_X, 0.38);
    }
    // The cassette player: a dark portable player standing up on a plinth, facing out, its window showing the cassette:
    // two reels (hubs with spokes that turn), the tape wound on each (scaled to its share), the tape across the head,
    // and three buttons on top that press down with the mode.
    {
      const l = LAYOUT.cassette, x = l.x, z = l.z, top = Y + 0.7;
      solid(0.6, 0.7, 0.7, "#2c2a33", x, Y + 0.35, z);
      solid(0.14, 0.36, 0.6, "#3a3a44", x, top + 0.18, z);
      solid(0.012, 0.22, 0.46, "#141218", x + 0.072, top + 0.2, z);
      solid(0.01, 0.18, 0.42, "#e8e0cc", x + 0.075, top + 0.2, z);
      const rz = 0.11, cy = top + 0.22, rx = x + 0.083;
      // Index 0 is the left (supply) reel, on the visitor's left (+z); index 1 the right (take-up) reel.
      parts.packs = [1, -1].map((s) => node(box(0.006, 0.16, 0.16, "#3a2414"), rx, cy, z + s * rz));
      parts.reels = [1, -1].map((s) => {
        const hub = node(box(0.008, 0.05, 0.05, "#f4f0e6"), rx + 0.004, cy, z + s * rz);
        for (let k = 0; k < 3; k++) { const spoke = createNode({ geometry: box(0.004, 0.014, 0.06, "#8a8478"), position: { x: 0.003, y: 0, z: 0 } }); spoke.rotation.x = k * Math.PI / 3; addChild(hub, spoke); }
        return hub;
      });
      solid(0.006, 0.008, 0.36, "#3a2414", rx, top + 0.115, z);
      solid(0.02, 0.03, 0.05, "#c8ccd4", rx + 0.004, top + 0.115, z);
      parts.buttons = ["#2fbf4f", "#e8e8ee", "#ff8a2a"].map((col, i) => node(box(0.07, 0.04, 0.09, col), x, top + 0.38, z + 0.15 - i * 0.15));
      parts.buttonY = top + 0.38;
      parts.tapeGeo = { rx, cy, rz };
      sign(EXHIBITS.cassette.label, EXHIBITS.cassette.sub, x + 0.4, Y + 1.55, z, FACE_X, 0.36);
    }
    for (const o of footprints()) kit.obstacle(o.x0, o.x1, o.z0, o.z1);
    for (const k of KEYS) {
      const ex = EXHIBITS[k], l = LAYOUT[k];
      kit.prop({ id: ex.id, year: ex.year, connection: ex.connection, date: ex.date, title: ex.title, label: ex.label, sourceKeys: SOURCE,
        at: walkUp(k, Y), reach: l.reach, pick: { w: l.half.x * 2, h: l.h, d: l.half.z * 2, x: l.x, z: l.z }, onUse: () => ({ terminal: live.terminals[k] }) });
    }
    const visit = { live, parts };
    sync(visit, 0, true);
    return visit;
  };
  // A square's geometry for a palette index (125 of them, all built at build time and kept for the visit).
  const colourGeo = (parts, k) => {
    if (parts.colours[k]) return parts.colours[k];
    const r = (k / 25) | 0, g = ((k / 5) | 0) % 5, b = k % 5, hex = (v) => Math.round(v * 255 / LEVELS).toString(16).padStart(2, "0");
    const S = parts.screen;
    return (parts.colours[k] = S.M.box({ w: 0.01, h: S.px * 0.9, d: S.px * 0.9, color: `#${hex(r)}${hex(g)}${hex(b)}`, emissive: k ? 1.1 : 0 }));
  };
  // Poses the cluster from its state each frame, allocation-free (every colour's geometry exists from build).
  const sync = (visit, dt, calm) => {
    const { live, parts } = visit, g = live.game, sc = live.screen, t = live.tape;
    if (parts.gameShown !== g.version) {
      parts.gameShown = g.version;
      for (let i = 0; i < parts.holes.length; i++) parts.holes[i].geometry = parts.holeGeo[g.cells[i]];
      parts.lastMark.visible = g.last >= 0;
      if (g.last >= 0) { const G = parts.fourGrid, c = g.last % 7, r = (g.last / 7) | 0; parts.lastMark.position.y = G.gy + 0.05 + r * G.cell + G.cell / 2; parts.lastMark.position.z = G.gz - c * G.cell; }
    }
    if (parts.shown !== sc.version) {
      parts.shown = sc.version;
      for (let i = 0; i < parts.pixels.length; i++) parts.pixels[i].geometry = colourGeo(parts, sc.colourOf(i));
      parts.knobs[0].rotation.x = -sc.r * 0.6; parts.knobs[1].rotation.x = -sc.g * 0.6; parts.knobs[2].rotation.x = -sc.b * 0.6;
    }
    t.step(dt, calm);
    parts.packs[0].scale.y = parts.packs[0].scale.z = t.radius(1 - t.pos);
    parts.packs[1].scale.y = parts.packs[1].scale.z = t.radius(t.pos);
    parts.reels[0].rotation.x = t.spinL; parts.reels[1].rotation.x = t.spinR;
    if (parts.tapeShown !== t.version) {
      parts.tapeShown = t.version;
      parts.buttons[0].position.y = parts.buttonY - (t.mode === "play" ? 0.02 : 0);
      parts.buttons[1].position.y = parts.buttonY - (t.mode === "stop" ? 0.02 : 0);
      parts.buttons[2].position.y = parts.buttonY - (t.mode === "rew" ? 0.02 : 0);
    }
  };
  // Per frame from genesis-era-2.js's update (only while the visitor is in Era 2's gallery, or its exhibit is open).
  const update = (visit, dt, state) => sync(visit, dt, state.calm === true);

  BL.genesisEra2Cluster = { LAYOUT, KEYS, EXHIBITS, PICTURE, PIC_W, PIC_H, LEVELS, PLAY_RATE, REW_RATE, footprints, walkUp,
    createScreen, screenTerminal, createCassette, cassetteTerminal, createLive, build, update, SCREEN_DEEPER, CASSETTE_DEEPER };
})();
