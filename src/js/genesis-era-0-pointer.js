// Era 0's pointer station (docs/genesis-voyage/exhibits/era-0.md, "Counting cluster"): a modern explanatory toy that
// contrasts two ways of choosing something on a screen: naming it with a typed command, or moving a pointer onto it
// and clicking. The pointing device in the model is a generic box, not a replica of any historical device; the
// history it touches (an early mouse demonstration and its hardware) is on HOLD in the exhibit doc until primary
// sources are read, so no date, person or specification is shown.
//
// Three faces share one core (`create`), as in genesis-era-0-nim.js:
//   create(seed)              a 3 x 3 board of targets A1..C3, a seeded run of ROUNDS lit targets, a cursor, and the
//                             effort each method took: `select(col, row)` (typed) or `move(dx, dy)` then `click()`.
//   terminal(board, onChange) the existing terminal shape for today's workbench.
//   make(host)                a console game on retro-games.js's factory interface: a real pointer round (the drag
//                             or held keys steer a cursor) against a typed round (step a code, then enter it).
(() => {
  "use strict";
  const BL = window.BL = window.BL || {};
  const games = BL.genesisEra0Games = BL.genesisEra0Games || {};
  const SIZE = 3, ROUNDS = 5, SEED = 1968 ^ 0x5eed, COLS = "ABC";
  const nameOf = (i) => `${COLS[i % SIZE]}${1 + Math.floor(i / SIZE)}`;
  const create = (seed = SEED) => {
    const order = new Uint8Array(ROUNDS), rng = new Uint32Array(1);
    // round: the target being lit (ROUNDS when all are found); cursor at (cx, cy) in cells, starting in the middle.
    const S = { seed: seed >>> 0, round: 0, cx: 1, cy: 1, typed: 0, chars: 0, moves: 0, clicks: 0, misses: 0, last: -1 };
    const next = () => { rng[0] = Math.imul(rng[0], 1664525) + 1013904223 >>> 0; return rng[0] / 4294967296; };
    const reset = () => {
      rng[0] = S.seed;
      // Never the same target twice running, never the middle first (where the cursor starts).
      for (let k = 0; k < ROUNDS; k++) { let t; do t = Math.floor(next() * SIZE * SIZE); while ((k && t === order[k - 1]) || (!k && t === 4)); order[k] = t; }
      S.round = 0; S.cx = S.cy = 1; S.typed = S.chars = S.moves = S.clicks = S.misses = 0; S.last = -1;
    };
    const target = () => S.round < ROUNDS ? order[S.round] : -1;
    // Choosing cell i: a hit lights the next target; a miss is counted and changes nothing else.
    const choose = (i) => { S.last = i; if (i === target()) { S.round++; return true; } S.misses++; return false; };
    reset();
    return { order, state: S, reset, target, done: () => S.round >= ROUNDS,
      select: (col, row, chars = 0) => { if (S.round >= ROUNDS) return false; S.typed++; S.chars += chars; return choose(row * SIZE + col); },
      move: (dx, dy) => { if (S.round >= ROUNDS) return false; S.moves++; S.cx = Math.max(0, Math.min(SIZE - 1, S.cx + dx)); S.cy = Math.max(0, Math.min(SIZE - 1, S.cy + dy)); return true; },
      click: () => { if (S.round >= ROUNDS) return false; S.clicks++; return choose(S.cy * SIZE + S.cx); } };
  };

  // ---- today's terminal ----------------------------------------------------------------------------------------
  const HELP = ["SELECT cell (A1..C3) | MOVE dx dy (-2..2 each) | CLICK | STATUS | INFO | RESET"];
  const step = (word) => /^[+-]?[0-2]$/.test(word || "") ? Number(word) : NaN;
  const terminal = (board, onChange = () => {}) => {
    const S = board.state;
    const now = () => board.done() ? `All ${ROUNDS} targets found.` : `Target ${S.round + 1} of ${ROUNDS} is lit at ${nameOf(board.target())}. The cursor is on ${nameOf(S.cy * SIZE + S.cx)}.`;
    const tally = () => `Typed: ${S.typed} command(s), ${S.chars} characters. Pointer: ${S.moves} move(s), ${S.clicks} click(s). Misses: ${S.misses}.`;
    const after = (hit, how) => {
      onChange(board);
      const lines = [hit ? `${how}: hit.` : `${how}: miss, the lit target is elsewhere.`, now()];
      if (board.done()) lines.push(tally(), "Typing needs the target's name; pointing needs only to see it. RESET to compare again.");
      return { lines };
    };
    return {
      banner: ["Pointer station: a modern explanatory toy. Choose a lit target by typing its name, or by moving a pointer and clicking.", "Either method works on every target; the station counts what each one cost you.", ...HELP], prompt: "POINT>",
      run(line) {
        const text = String(line).trim().slice(0, 96), w = text.toUpperCase().split(/\s+/), cmd = w[0];
        if (cmd === "HELP" || !cmd) return { lines: HELP };
        if (cmd === "INFO" || cmd === "MORE") return { lines: ["A typed command names what it wants, so you must know the name. A pointer is moved by hand to what you can see, then clicked.", "Here the pointer moves in whole cells for the terminal; on a console it follows your drag or keys.", "The device on the desk is generic. The history of early pointing devices is still being checked, so no date or person is named."] };
        if (cmd === "RESET") { board.reset(); onChange(board); return { lines: ["New run.", now()] }; }
        if (cmd === "STATUS") return { lines: [now(), tally()] };
        if (board.done() && (cmd === "SELECT" || cmd === "MOVE" || cmd === "CLICK")) return { lines: [now(), tally(), "RESET to try again."] };
        if (cmd === "SELECT") {
          const m = w.length === 2 && /^([ABC])([1-3])$/.exec(w[1]);
          if (!m) return { lines: ["SELECT needs one cell name, A1 to C3 (column letter, row number)."] };
          return after(board.select(COLS.indexOf(m[1]), Number(m[2]) - 1, text.length), `Typed ${m[0]}`);
        }
        if (cmd === "MOVE") {
          const dx = step(w[1]), dy = step(w[2]);
          if (w.length !== 3 || Number.isNaN(dx) || Number.isNaN(dy)) return { lines: ["MOVE needs two whole steps from -2 to 2: across, then down. For example MOVE 1 -1."] };
          board.move(dx, dy); onChange(board);
          return { lines: [`Cursor on ${nameOf(S.cy * SIZE + S.cx)}. CLICK to choose it.`] };
        }
        if (cmd === "CLICK") return after(board.click(), `Clicked ${nameOf(S.cy * SIZE + S.cx)}`);
        return { lines: ["Use SELECT, MOVE, CLICK, STATUS, INFO or RESET."] };
      }
    };
  };

  // ---- the console game ------------------------------------------------------------------------------------------
  // Two rounds of ROUNDS targets: first POINT (the cursor follows aim.x and aim.y, the action clicks), then TYPE (left
  // and right step the column letter, up and down the row number, the action enters the code). Each round is timed;
  // the score rewards speed and the screen compares the two times. No string is built in play.
  const SPEED = 1.6, CELL = 26, GX = 41, GY = 18;
  const make = (host) => {
    const kit = BL.retroGames.kit, out = kit.hooks(host), aim = out.aim, status = kit.makeStatus("Targets"), { W, H, INK, TEXT } = kit;
    let board = create();
    const C = { phase: "idle", mode: 0, px: 1.5, py: 1.5, col: 0, row: 0, t: 0, times: new Float32Array(2), steps: 0, stepsY: 0 };
    const begin = (mode) => { board.reset(); C.mode = mode; C.t = 0; C.px = C.py = 1.5; C.col = C.row = 0; C.phase = "play"; status.round = mode + 1; status.verb = mode ? "Enter" : "Click"; };
    const finish = () => {
      C.times[C.mode] = C.t; status.score += Math.max(0, Math.round(300 - C.t * 20));
      if (C.mode === 0) begin(1); else { C.phase = "done"; status.verb = ""; out.over(); out.onEnd(status.score); }
    };
    return {
      kind: "pointer", name: "Point or type (museum toy)", aims: true,
      help: "Round 1: steer the cursor and act to click the lit target. Round 2: step a code and act to enter it.",
      coach: ["A D W S steer or step, Space clicks or enters", "Drag steers or steps, tap clicks or enters"],
      stars: [200, 350, 500], tickets: () => 0, status,
      get playing() { return C.phase === "play"; },
      get board() { return board; }, get round() { return C; },
      start: (seed) => {
        board = create(Number.isInteger(seed) ? seed : SEED);
        status.score = 0; C.times.fill(0); C.steps = aim.steps; C.stepsY = aim.stepsY; begin(0);
      },
      stop: () => { C.phase = "idle"; status.verb = ""; },
      act: () => {
        if (C.phase !== "play") return;
        const hit = C.mode === 0 ? (board.state.cx = Math.floor(C.px), board.state.cy = Math.floor(C.py), board.click()) : board.select(C.col, C.row, 2);
        if (hit) out.cue("tap", 0.5); else out.flop();
        status.left = ROUNDS - board.state.round;
        if (board.done()) finish();
      },
      update: (dt) => {
        const ds = aim.steps - C.steps, dy = aim.stepsY - C.stepsY;
        C.steps = aim.steps; C.stepsY = aim.stepsY;
        if (C.phase !== "play") return;
        C.t += dt;
        if (C.mode === 0) {
          C.px = Math.max(0, Math.min(SIZE - 0.001, C.px + aim.x * SPEED * dt));
          C.py = Math.max(0, Math.min(SIZE - 0.001, C.py + aim.y * SPEED * dt));
        } else {
          if (ds) C.col = ((C.col + ds) % SIZE + SIZE) % SIZE;
          if (dy) C.row = ((C.row + dy) % SIZE + SIZE) % SIZE;
        }
      },
      draw: (ctx) => {
        ctx.fillStyle = INK.night; ctx.fillRect(0, 0, W, H);
        kit.centre(ctx, C.mode ? "TYPE THE CODE" : "POINT AND CLICK", 4, TEXT.teal);
        const lit = board.target();
        for (let i = 0; i < SIZE * SIZE; i++) {
          ctx.fillStyle = i === lit ? INK.banana : INK.deep;
          ctx.fillRect(GX + (i % SIZE) * CELL, GY + Math.floor(i / SIZE) * CELL, CELL - 4, CELL - 4);
        }
        if (C.mode === 0) { ctx.fillStyle = INK.white; ctx.fillRect(GX + C.px * CELL - 1, GY + C.py * CELL - 1, 3, 3); }
        else {
          kit.text(ctx, COLS[C.col], 64, 102, TEXT.banana, 2);
          kit.number(ctx, C.row + 1, 80, 102, TEXT.banana, 2);
        }
        kit.text(ctx, "P", 4, 30, TEXT.stone); kit.number(ctx, C.times[0], 4, 40, TEXT.bone);
        kit.text(ctx, "T", 4, 60, TEXT.stone); kit.number(ctx, C.times[1], 4, 70, TEXT.bone);
      }
    };
  };

  games.pointer = { SIZE, ROUNDS, nameOf, create, terminal, make };
})();
