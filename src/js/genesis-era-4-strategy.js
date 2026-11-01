// Era 4's strategy board: a compact original turn-based game, a modern museum homage and not historical software.
// Two pieces (A and B) take turns with one guard (X) on a 7 x 7 board of walls; a piece that reaches the goal (G)
// wins, a piece the guard steps onto goes back to its home square, and a board allows MOVES player moves. The rules
// are generic and the boards, art and words original; no chess rules, positions or engines are reproduced.
//
// BL.genesisEra4Games.strategy = { BOARDS, MOVES, create(), terminal(core), make(host) }
// - `create()`: the pure rules, Node-loadable, allocation-free per move: `load(n)`, `move(piece, dir)`, `set(a, b, g,
//   used)`, and the state on `core.s` (cells as indices 0..48).
// - `terminal(core)`: a museum terminal ({ banner, prompt, run }) for the era file, playable today.
// - `make(host)`: the retro-games.js factory interface (that file's header is the contract), drawn with
//   BL.retroGames.kit, which it reads when called, so this file needs nothing at load.
(() => {
  "use strict";
  const BL = window.BL = window.BL || {};
  const G = BL.genesisEra4Games = BL.genesisEra4Games || {};
  const N = 7, CELLS = N * N, MOVES = 20;
  // '#' wall, '.' floor, 'G' goal, 'A' and 'B' the pieces' homes, 'X' the guard's start.
  const BOARDS = [
    ["G..#...",
     ".#...#.",
     ".#.#...",
     "...X.#.",
     ".##..#.",
     ".....#.",
     "A..#..B"],
    ["...#..G",
     ".#.#.#.",
     ".#...#.",
     ".#.X...",
     "...##.#",
     ".#.....",
     "A..#.B."],
    ["#..G..#",
     "..#.#..",
     ".#...#.",
     "...X...",
     ".#.#.#.",
     ".......",
     "A.#.#.B"]
  ];
  const DIRS = "NESW", DX = [0, 1, 0, -1], DY = [-1, 0, 1, 0];
  const create = () => {
    const wall = new Uint8Array(CELLS), dist = new Int16Array(CELLS), queue = new Int16Array(CELLS);
    const s = { board: 0, goal: 0, home: new Int16Array(2), guardHome: 0, at: new Int16Array(2), guard: 0, used: 0, won: false, lost: false, captures: 0, last: "" };
    const step = (cell, d) => {
      const x = cell % N + DX[d], y = (cell / N | 0) + DY[d];
      return x < 0 || y < 0 || x >= N || y >= N ? -1 : y * N + x;
    };
    const load = (n) => {
      const rows = BOARDS[n];
      s.board = n;
      for (let i = 0; i < CELLS; i++) {
        const c = rows[i / N | 0][i % N];
        wall[i] = c === "#" ? 1 : 0;
        if (c === "G") s.goal = i;
        else if (c === "A") s.home[0] = i;
        else if (c === "B") s.home[1] = i;
        else if (c === "X") s.guardHome = i;
      }
      s.at[0] = s.home[0]; s.at[1] = s.home[1]; s.guard = s.guardHome;
      s.used = 0; s.won = s.lost = false; s.captures = 0; s.last = "";
    };
    // The guard's step: breadth-first distances from the guard over open floor (never the goal or a home square),
    // then one step toward whichever piece is nearer (A on a tie), the first of N, E, S, W that gets closer.
    const guardMoves = () => {
      dist.fill(-1);
      let head = 0, tail = 0;
      dist[s.guard] = 0; queue[tail++] = s.guard;
      while (head < tail) {
        const c = queue[head++];
        for (let d = 0; d < 4; d++) {
          const n = step(c, d);
          if (n < 0 || wall[n] || dist[n] >= 0 || n === s.goal || n === s.home[0] || n === s.home[1]) continue;
          dist[n] = dist[c] + 1; queue[tail++] = n;
        }
      }
      // A piece on its home or the goal cannot be reached; distances are to the piece's own square.
      const da = dist[s.at[0]], db = dist[s.at[1]];
      let target = -1;
      if (da > 0 && (db <= 0 || da <= db)) target = s.at[0];
      else if (db > 0) target = s.at[1];
      if (target < 0) return;
      // Walk back from the target to the cell one step from the guard.
      let c = target;
      while (dist[c] > 1) {
        for (let d = 0; d < 4; d++) { const n = step(c, d); if (n >= 0 && dist[n] === dist[c] - 1) { c = n; break; } }
      }
      s.guard = c;
      for (let p = 0; p < 2; p++) if (s.at[p] === c) { s.at[p] = s.home[p]; s.captures++; s.last = p ? "B" : "A"; }
    };
    // One player move: `piece` 0 or 1, `dir` 0..3 (N, E, S, W). Returns "over", "wall", "blocked", "won", "caught",
    // "lost" or "ok".
    const move = (piece, dir) => {
      if (s.won || s.lost) return "over";
      const n = step(s.at[piece], dir);
      if (n < 0 || wall[n]) return "wall";
      if (n === s.guard || n === s.at[1 - piece]) return "blocked";
      s.at[piece] = n; s.used++; s.last = "";
      if (n === s.goal) { s.won = true; return "won"; }
      guardMoves();
      if (s.used >= MOVES) { s.lost = true; return "lost"; }
      return s.last ? "caught" : "ok";
    };
    // For a search over positions (the checks): put the pieces, the guard and the move count back exactly.
    const set = (a, b, g, used) => { s.at[0] = a; s.at[1] = b; s.guard = g; s.used = used; s.won = s.lost = false; s.last = ""; };
    const charAt = (i) => i === s.guard ? "X" : i === s.at[0] ? "A" : i === s.at[1] ? "B" : wall[i] ? "#" : i === s.goal ? "G" : ".";
    load(0);
    return { s, load, move, set, charAt, wall };
  };

  // ---- the terminal, for the era file's workbench ------------------------------------------------------------
  const clean = (text) => String(text).replace(/[\u0000-\u001f\u007f]/g, "").slice(0, 32).trim().toUpperCase();
  const reply = (...lines) => ({ lines });
  const HELP = ["MOVE <A|B> <N|E|S|W> | LOOK | BOARD <1..3> | RESET", "Short form: A N, B W. MORE tells what the board stands for."];
  const terminal = (core, about = []) => {
    const s = core.s;
    const look = (...first) => {
      const lines = [...first];
      for (let y = 0; y < N; y++) { let row = ""; for (let x = 0; x < N; x++) row += (x ? " " : "") + core.charAt(y * N + x); lines.push(row); }
      lines.push(s.won ? "GOAL REACHED! RESET or BOARD 1..3 to play again." : s.lost ? "Out of moves. RESET to try again."
        : `Board ${s.board + 1}: ${MOVES - s.used} of ${MOVES} moves left. Guard X steps after each of your moves.`);
      return { lines };
    };
    return {
      banner: ["HOW TO USE", "  1. Type LOOK to see the board: A and B are yours, X the guard, G the goal.", "  2. Type MOVE A N (or A N) to step a piece north; E, S and W too.",
        "  3. Each move, X steps toward the nearer piece; a caught piece goes home.", "  4. Reach G within 20 moves. RESET restarts; BOARD 2 or 3 changes the board.", "",
        ...about, "MODERN MUSEUM HOMAGE: original rules and boards, not historical software or a chess program.", ...HELP],
      prompt: "BOARD>",
      run(line) {
        const parts = clean(line).split(/\s+/);
        let cmd = parts[0], p = parts[1], d = parts[2];
        if (cmd === "A" || cmd === "B") { d = p; p = cmd; cmd = "MOVE"; }
        if (cmd === "HELP") return reply(...HELP);
        if (cmd === "MORE") return reply(...about, "Any likeness between searching moves and proof-of-work is an analogy only, not an influence on Bitcoin.");
        if (cmd === "LOOK" || cmd === "") return look();
        if (cmd === "RESET") { core.load(s.board); return { ...look("Board reset."), reset: true }; }
        if (cmd === "BOARD") {
          const n = Number(p);
          if (!/^[123]$/.test(p || "")) return reply("Choose BOARD 1, 2 or 3.");
          core.load(n - 1); return look(`Board ${n}.`);
        }
        if (cmd === "MOVE") {
          const piece = p === "A" ? 0 : p === "B" ? 1 : -1, dir = d && d.length === 1 ? DIRS.indexOf(d) : -1;
          if (piece < 0 || dir < 0) return reply("Use MOVE A N, MOVE B E (N, E, S or W).");
          const r = core.move(piece, dir);
          if (r === "over") return look("This board is finished.");
          if (r === "wall") return reply("A wall or the edge is in the way. Try another direction.");
          if (r === "blocked") return reply("That square is taken. Try another direction.");
          return look(r === "caught" ? `Caught! Piece ${s.last} goes back home.` : r === "won" ? "Your piece reached the goal!" : r === "lost" ? "That was the last move." : `Moved ${p} ${d}.`);
        }
        return reply("Unknown command.", ...HELP);
      }
    };
  };

  // ---- the console game (retro-games.js's factory interface) --------------------------------------------------
  const make = (host) => {
    const K = BL.retroGames.kit, { W, H, INK, TEXT } = K, h = K.hooks(host), core = create(), s = core.s;
    const status = K.makeStatus("Moves"), CELL = 13, OX = (W - CELL * N) >> 1, OY = 22;
    const run = { playing: false, piece: 0, steps: 0, stepsY: 0, endIn: -1, ended: false, flash: 0 };
    const tick = K.stepper((dt) => {
      if (run.flash > 0) run.flash -= dt;
      if (run.endIn >= 0) { run.endIn -= dt; if (run.endIn < 0 && !run.ended) { run.ended = true; run.playing = false; h.onEnd(status.score); } }
    });
    const finish = () => {
      status.score = s.won ? 100 + (MOVES - s.used) * 20 : 0;
      h.over(); run.endIn = 1.4;
    };
    const tryMove = (dir) => {
      const r = core.move(run.piece, dir);
      if (r === "wall" || r === "blocked") { h.cue("bump", 0.5); return; }
      if (r === "caught") { h.cue("miss", 0.6); h.flop(); run.flash = 0.25; }
      else h.cue("step", 0.4);
      status.left = MOVES - s.used;
      if (s.won) { h.crack(true); h.popup("GOAL!", true); finish(); }
      else if (s.lost) finish();
    };
    const game = {
      kind: "e4-strategy", name: "Strategy board", aims: true, status,
      help: "Arrows move the lit piece. Space swaps between A and B. Reach the goal before the moves run out.",
      coach: ["Arrows move the lit piece · Space swaps A and B", "Drag to move · tap to swap A and B"],
      stars: [100, 300, 400],
      tickets: (score) => score > 0 ? 2 + Math.floor(score / 120) : 0,
      get playing() { return run.playing; },
      start(seed) {
        core.load((seed >>> 0) % BOARDS.length);
        run.playing = true; run.piece = 0; run.endIn = -1; run.ended = false; run.flash = 0;
        run.steps = h.aim.steps; run.stepsY = h.aim.stepsY;
        status.score = 0; status.left = MOVES; status.round = s.board + 1; status.verb = "MOVE";
      },
      act() { if (run.playing && run.endIn < 0) run.piece = 1 - run.piece; },
      stop() { run.playing = false; run.endIn = -1; },
      update(dt) {
        tick(dt);
        if (!run.playing || run.endIn >= 0) { run.steps = h.aim.steps; run.stepsY = h.aim.stepsY; return; }
        const dx = h.aim.steps - run.steps, dy = h.aim.stepsY - run.stepsY;
        run.steps = h.aim.steps; run.stepsY = h.aim.stepsY;
        if (dx) tryMove(dx > 0 ? 1 : 3);
        else if (dy) tryMove(dy > 0 ? 2 : 0);
      },
      draw(ctx) {
        ctx.fillStyle = INK.night; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = INK.band; ctx.fillRect(0, 0, W, 9);
        K.text(ctx, "STRATEGY BOARD", 3, 1, TEXT.gold);
        K.text(ctx, "HOMAGE", W - 39, 1, TEXT.stone);
        for (let i = 0; i < CELLS; i++) {
          const x = OX + (i % N) * CELL, y = OY + (i / N | 0) * CELL, c = core.charAt(i);
          ctx.fillStyle = core.wall[i] ? INK.stoneDk : (i % N + (i / N | 0)) & 1 ? INK.deep : INK.rule;
          ctx.fillRect(x, y, CELL - 1, CELL - 1);
          if (i === s.goal) { ctx.fillStyle = INK.gold; ctx.fillRect(x + 2, y + 2, CELL - 5, CELL - 5); }
          if (c === "A" || c === "B" || c === "X") {
            const mine = c === (run.piece ? "B" : "A");
            ctx.fillStyle = c === "X" ? INK.red : mine ? INK.teal : INK.sky;
            ctx.fillRect(x + 2, y + 2, CELL - 5, CELL - 5);
            K.text(ctx, c, x + 4, y + 3, TEXT.night);
          }
        }
        K.text(ctx, "MOVES", 3, 14, TEXT.stone);
        K.number(ctx, MOVES - s.used, 3, 23, TEXT.banana, 2);
        K.text(ctx, "BOARD", W - 33, 14, TEXT.stone);
        K.number(ctx, s.board + 1, W - 33, 23, TEXT.banana, 2);
        if (run.flash > 0 && !host.still) { ctx.fillStyle = INK.red; ctx.globalAlpha = 0.25; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
        if (!run.playing && run.endIn < 0 && !run.ended) K.centre(ctx, "PRESS START", H - 9, TEXT.banana);
        else if (s.won) K.centre(ctx, "GOAL REACHED!", H - 9, TEXT.lime);
        else if (s.lost) K.centre(ctx, "OUT OF MOVES", H - 9, TEXT.red);
        else K.centre(ctx, run.piece ? "PIECE B - SPACE SWAPS" : "PIECE A - SPACE SWAPS", H - 9, TEXT.bone);
      }
    };
    return game;
  };
  G.strategy = { BOARDS, MOVES, N, DIRS, create, terminal, make };
})();
