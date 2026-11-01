// Era 2's board-game table in the Genesis Voyage: FOUR IN A ROW, a modern museum homage of a generic, public-domain
// connection game (drop counters into a seven-column, six-row upright grid; four of yours in a line, across, up or on
// a slant, wins). Original presentation: a timber frame with teal and banana counters, no commercial product's colours,
// shape, name or box. It makes no historical claim; its placement in the 1980s is on HOLD until a primary source is
// read (docs/genesis-voyage/exhibits/era-2.md, "Upgrade cluster").
//
// - `createGame(seed)`: the pure rules and the museum's computer opponent (it takes a win, blocks yours, avoids
//   handing you one, then prefers the middle, its ties broken by a seeded generator so a seed replays a game). Node
//   loads it with no DOM.
// - `terminal(game)`: the exhibit's prompt (`{ banner, prompt, run(line) }`, as genesis-props.js's terminals are), so it
//   plays today through the workbench's command line: DROP 4 (or just 4), SHOW, NEW, RESET, HELP, MORE.
// - `make(host)`: the same game to the retro-games.js factory interface (header contract there), for a cabinet or
//   console screen: A and D (or a drag, or the arrows) choose a column, Space or a tap drops. It reads BL.retroGames.kit
//   when made, never at load.
(() => {
  "use strict";
  const BL = window.BL = window.BL || {};
  const COLS = 7, ROWS = 6, N = COLS * ROWS, YOU = 1, OOGA = 2;
  // The four directions a line can run: across, up, and the two slants, as [dc, dr].
  const DIRS = [1, 0, 0, 1, 1, 1, 1, -1];
  // Columns by preference: the middle first, then outwards.
  const ORDER = [3, 2, 4, 1, 5, 0, 6];

  // A seeded generator (math.js's mulberry32, kept here so Node needs nothing else).
  const seeded = (seed) => { const s = { v: seed >>> 0 }; return () => { s.v = s.v + 0x6d2b79f5 | 0; let t = Math.imul(s.v ^ s.v >>> 15, 1 | s.v); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; };

  // --- The rules ----------------------------------------------------------------------------------------------------
  // `cells[r * COLS + c]`, row 0 the bottom: 0 empty, 1 you (teal), 2 the computer (banana). Allocation-free after
  // creation: moves write in place, and the opponent tries moves on the board itself and takes them back.
  const createGame = (seed = 1) => {
    const cells = new Uint8Array(N), height = new Uint8Array(COLS), line = new Uint8Array(4);
    const g = { cells, height, turn: YOU, winner: 0, moves: 0, last: -1, line, seed: seed >>> 0, rand: seeded(seed), version: 0 };
    const at = (c, r) => cells[r * COLS + c];
    // The length of the run through (c, r) for player p along one direction, writing the run's cells into `line` when
    // it reaches four.
    const runAt = (c, r, p, dc, dr) => {
      let n = 1, c0 = c, r0 = r;
      for (let k = 1; k < 4; k++) { const x = c + dc * k, y = r + dr * k; if (x < 0 || x >= COLS || y < 0 || y >= ROWS || at(x, y) !== p) break; n++; }
      for (let k = 1; k < 4; k++) { const x = c - dc * k, y = r - dr * k; if (x < 0 || x >= COLS || y < 0 || y >= ROWS || at(x, y) !== p) break; n++; c0 = x; r0 = y; }
      if (n >= 4) for (let k = 0; k < 4; k++) line[k] = (r0 + dr * k) * COLS + c0 + dc * k;
      return n;
    };
    const wins = (c, r, p) => { for (let d = 0; d < 8; d += 2) if (runAt(c, r, p, DIRS[d], DIRS[d + 1]) >= 4) return true; return false; };
    const canDrop = (c) => c >= 0 && c < COLS && height[c] < ROWS && !g.winner && g.moves < N;
    // Puts p's counter in column c; returns its row, or -1 when it cannot go there.
    const place = (c, p) => { const r = height[c]; cells[r * COLS + c] = p; height[c] = r + 1; return r; };
    const unplace = (c) => { height[c]--; cells[height[c] * COLS + c] = 0; };
    // A move for whoever's turn it is. Returns the row, or -1 (a full column, a finished game).
    const drop = (c) => {
      if (!canDrop(c)) return -1;
      const p = g.turn, r = place(c, p);
      g.moves++; g.last = r * COLS + c; g.version++;
      if (wins(c, r, p)) g.winner = p;
      else if (g.moves >= N) g.winner = 3;
      else g.turn = p === YOU ? OOGA : YOU;
      return r;
    };
    // Whether p could win at once by playing column c.
    const winsIf = (c, p) => { if (height[c] >= ROWS) return false; const r = place(c, p), w = wins(c, r, p); unplace(c); return w; };
    // The computer's column: a win, a block, a column that does not hand the other side a win from on top of it, then
    // the middle first; among equally good columns a seeded coin decides.
    const choose = () => {
      const me = g.turn, them = me === YOU ? OOGA : YOU;
      for (const c of ORDER) if (winsIf(c, me)) return c;
      for (const c of ORDER) if (winsIf(c, them)) return c;
      let best = -1, score = -1;
      for (const c of ORDER) {
        if (height[c] >= ROWS) continue;
        place(c, me);
        const gives = height[c] < ROWS && winsIf(c, them);
        unplace(c);
        const s = (gives ? 0 : 100) + (7 - Math.abs(3 - c) * 2) + g.rand() * 3;
        if (s > score) { score = s; best = c; }
      }
      return best;
    };
    const reset = (newSeed = g.seed) => {
      cells.fill(0); height.fill(0); line.fill(0);
      g.turn = YOU; g.winner = 0; g.moves = 0; g.last = -1; g.seed = newSeed >>> 0; g.rand = seeded(g.seed); g.version++;
    };
    return Object.assign(g, { at, drop, choose, reset, canDrop, winsIf, COLS, ROWS });
  };

  // --- The terminal -------------------------------------------------------------------------------------------------
  const HOW = ["HOW TO USE", "1. Type a column number from 1 to 7 and press Enter to drop your counter (O).",
    "2. The museum's computer answers with its own counter (X).", "3. Get four of yours in a line, across, up or on a slant, to win.",
    "4. Type NEW for a fresh game, or RESET to put the table back.", ""];
  const DEEPER = ["FOUR IN A ROW - a modern museum homage, made in 2026",
    "A generic connection game with original pieces: no product's name, colours or box.",
    "Play: you and the computer take turns dropping a counter into one of seven columns; it falls to the lowest empty",
    "space. The first with four in a line, across, up or slanting, wins. A full board with no line is a draw.",
    "The computer is simple on purpose: it takes a win, blocks yours, avoids giving you one, and likes the middle.",
    "Museum note: when games like this were first made or played is not stated here; that research is on HOLD."];
  const CHAR = [".", "O", "X"];
  const terminal = (game) => {
    const rows = () => {
      const out = ["  1 2 3 4 5 6 7"];
      for (let r = ROWS - 1; r >= 0; r--) { let s = " |"; for (let c = 0; c < COLS; c++) s += `${CHAR[game.at(c, r)]}${c < COLS - 1 ? " " : ""}`; out.push(`${s}|`); }
      out.push(" +-------------+");
      out.push(game.winner === YOU ? "Four in a row: YOU WIN! Type NEW to play again." : game.winner === OOGA ? "Four in a row for the computer. Type NEW to try again."
        : game.winner === 3 ? "The board is full: a draw. Type NEW to play again." : "Your move: type a column, 1 to 7.");
      return out;
    };
    return {
      banner: ["FOUR IN A ROW TABLE · 1980s style · a modern museum homage", ...HOW, ...rows(), ""],
      prompt: "BOARD>",
      run: (line) => {
        const input = String(line).replace(/[\u0000-\u001f\u007f]/g, "").slice(0, 40).trim().toUpperCase();
        if (!input) return { lines: [] };
        const parts = input.split(/\s+/), cmd = parts[0];
        if (cmd === "HELP") return { lines: ["1 to 7 or DROP 4   drop your counter in that column", "SHOW              the board", "NEW               a fresh game", "RESET             put the table back", "MORE              about this game"] };
        if (cmd === "SHOW") return { lines: rows() };
        if (cmd === "MORE") return { lines: DEEPER };
        if (cmd === "NEW" || cmd === "RESET") { game.reset(cmd === "NEW" ? game.seed + 1 : 1); return { lines: rows(), reset: cmd === "RESET" }; }
        const col = parseInt(cmd === "DROP" ? parts[1] : cmd, 10) - 1;
        if (!(col >= 0 && col < COLS)) return { lines: ["Type a column number from 1 to 7 (or HELP)."] };
        if (game.winner) return { lines: ["This game is over. Type NEW to play again."] };
        if (game.drop(col) < 0) return { lines: [`Column ${col + 1} is full. Pick another.`] };
        const said = [`You drop in column ${col + 1}.`];
        if (!game.winner) { const c = game.choose(); game.drop(c); said.push(`The computer drops in column ${c + 1}.`); }
        return { lines: [...said, ...rows()], moved: true };
      }
    };
  };

  // --- The cabinet game (retro-games.js factory interface) ----------------------------------------------------------
  // One game against the computer a run: a win scores 300 plus 10 for every empty space left, a draw 100, a loss the
  // counters you placed. The column follows `aim.steps` (and a drag's `aim.x`); `act` drops.
  const make = (host) => {
    const { W, INK, TEXT, text, centre, number, makeStatus, hooks, stepper, juice } = BL.retroGames.kit;
    const out = hooks(host), aim = out.aim, J = juice(host), status = makeStatus("Moves"), game = createGame(1);
    const S = { phase: "idle", col: 3, steps: 0, think: 0, fall: 0, fallRow: 0, fallCol: 0, end: 0, seed: 1, ended: 0 };
    const CELL = 13, BX = (W - COLS * CELL) >> 1, BY = 22, THINK = 0.55, FALL_SPEED = 30, END_BEAT = 1.6;
    const INKS = [INK.deep, INK.teal, INK.banana];
    const finish = () => {
      S.phase = "end"; S.end = END_BEAT;
      status.score = game.winner === YOU ? 300 + (N - game.moves) * 10 : game.winner === 3 ? 100 : Math.ceil(game.moves / 2);
      status.verb = game.winner === YOU ? "YOU WIN" : game.winner === 3 ? "DRAW" : "OOGA WINS";
      if (game.winner === YOU) out.crack(true); else if (game.winner === OOGA) out.flop();
      out.cue(game.winner === YOU ? "win" : "lose", 0.6);
      out.over();
    };
    // Drops in the chosen column for whoever moves, then lets the counter fall on screen before play goes on.
    const drop = (c) => {
      const r = game.drop(c);
      if (r < 0) { out.cue("bump", 0.3); return; }
      S.fallCol = c; S.fallRow = r; S.fall = ROWS + 0.5; S.phase = "fall";
      status.left = game.moves; out.cue("tap", 0.4); J.shake(1);
    };
    const step = (dt) => {
      if (S.phase === "fall") {
        S.fall -= FALL_SPEED * dt * (host.still ? 4 : 1);
        if (S.fall > S.fallRow) return;
        S.fall = S.fallRow;
        if (game.winner) { finish(); return; }
        S.phase = game.turn === YOU ? "you" : "think"; S.think = THINK;
      } else if (S.phase === "think") {
        if ((S.think -= dt) <= 0) drop(game.choose());
      } else if (S.phase === "end" && S.ended === 0) {
        if ((S.end -= dt) <= 0) { S.ended = 1; out.onEnd(status.score); }
      }
    };
    const run = stepper(step);
    const reset = () => { game.reset(S.seed); S.col = 3; S.steps = aim.steps; S.think = S.fall = S.end = 0; S.ended = 0; status.score = 0; status.left = 0; status.verb = ""; J.reset(); };
    reset();
    return {
      kind: "four", name: "Four in a Row", aims: true, status, roundLabel: "Game",
      help: "A and D, the arrows or a drag choose a column; Space or a tap drops your teal counter. Four in a line wins.",
      coach: ["A and D choose a column, Space drops", "Drag to a column, tap to drop"],
      stars: [100, 300, 500], tickets: (score) => Math.floor(score / 100),
      get playing() { return S.phase !== "idle" && S.phase !== "end"; },
      get seed() { return S.seed; },
      game,
      start: (seed) => { S.seed = Number.isInteger(seed) ? seed >>> 0 : 1; reset(); S.phase = "you"; },
      stop: () => { S.phase = "idle"; reset(); },
      act: () => { if (S.phase === "you") drop(S.col); },
      update: (dt) => {
        J.update(dt);
        // The column follows each step of the aim (presses, notches), clamped to the board.
        if (aim.steps !== S.steps) { S.col = Math.max(0, Math.min(COLS - 1, S.col + (aim.steps - S.steps))); S.steps = aim.steps; }
        if (S.phase === "idle") return;
        run(dt);
      },
      draw: (ctx) => {
        ctx.fillStyle = INK.night; ctx.fillRect(0, 0, W, 120);
        J.begin(ctx);
        ctx.fillStyle = INK.husk; ctx.fillRect(BX - 4, BY - 2, COLS * CELL + 8, ROWS * CELL + 6);
        ctx.fillStyle = INK.huskDk; ctx.fillRect(BX - 4, BY + ROWS * CELL + 2, COLS * CELL + 8, 3);
        for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
          const v = game.at(c, r), falling = S.phase === "fall" && c === S.fallCol && r === S.fallRow;
          ctx.fillStyle = INKS[falling ? 0 : v];
          ctx.fillRect(BX + c * CELL + 2, BY + (ROWS - 1 - r) * CELL + 2, CELL - 4, CELL - 4);
        }
        if (S.phase === "fall") {
          ctx.fillStyle = INKS[game.at(S.fallCol, S.fallRow)];
          const y = BY + (ROWS - 1 - S.fall) * CELL + 2;
          if (y >= BY - CELL) ctx.fillRect(BX + S.fallCol * CELL + 2, y, CELL - 4, CELL - 4);
        }
        if (game.winner === YOU || game.winner === OOGA) {
          ctx.fillStyle = INK.white;
          for (let k = 0; k < 4; k++) { const i = game.line[k], c = i % COLS, r = (i / COLS) | 0; ctx.fillRect(BX + c * CELL + 5, BY + (ROWS - 1 - r) * CELL + 5, CELL - 10, CELL - 10); }
        }
        if (S.phase === "you") { ctx.fillStyle = INK.teal; ctx.fillRect(BX + S.col * CELL + 3, BY - 9, CELL - 6, 5); }
        J.end(ctx);
        text(ctx, "FOUR IN A ROW", 4, 3, TEXT.bone);
        number(ctx, host.best || 0, W - 4, 3, TEXT.gold, 1, 2, 3);
        if (S.phase === "idle") centre(ctx, "PRESS START", 110, TEXT.banana);
        else if (S.phase === "you") centre(ctx, "YOUR MOVE", 110, TEXT.teal);
        else if (S.phase === "think" || S.phase === "fall") centre(ctx, "OOGA THINKS", 110, TEXT.banana);
        else centre(ctx, game.winner === YOU ? "YOU WIN" : game.winner === 3 ? "DRAW" : "OOGA WINS", 110, game.winner === YOU ? TEXT.lime : TEXT.red);
      }
    };
  };

  BL.genesisEra2Four = { COLS, ROWS, YOU, OOGA, createGame, terminal, make, HOW, DEEPER };
})();
