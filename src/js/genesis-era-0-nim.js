// Era 0's Nim board (docs/genesis-voyage/exhibits/era-0.md, "Counting cluster"): a modern museum homage, not historical
// software. Generic public-domain rules: three heaps of 3, 5 and 7 counters; a turn removes one or more counters from
// one heap; whoever takes the last counter wins (the "normal play" convention). The visitor moves first. No date is
// claimed for the game or for any machine that played it: those candidate claims are on HOLD in the exhibit doc.
//
// Three faces share one rules core (`create`):
//   create(seed)           the game: heaps, turn, level, winner; `take(h, n)` for the visitor and `reply()` for the
//                          computer. Pure, allocation-free after creation, seeded so a seed replays a game.
//   terminal(game, onChange)  the existing terminal shape ({ banner, prompt, run(line) → { lines } }) for today's
//                          workbench; `onChange(game)` is called after every change so the era file can move its nodes.
//   make(host)             a console game on retro-games.js's factory interface (see its header), for the Genesis
//                          console the integrator is defining. It reads BL.retroGames.kit when made, not when loaded.
//
// The computer opponent is bounded: it looks at no more than the 15 legal moves of the current position (no search
// tree), and its level decides how often it plays the winning reply. Level 3 always plays it when one exists, so a
// visitor wins only by keeping the heaps' binary "nim-sum" at zero after each of their turns; HINT explains that.
(() => {
  "use strict";
  const BL = window.BL = window.BL || {};
  const games = BL.genesisEra0Games = BL.genesisEra0Games || {};
  const START = [3, 5, 7], HEAPS = 3, MAX = 7, LEVELS = 3, DEFAULT_LEVEL = 2, SEED = 1959;
  // The share of turns, by level, on which the computer looks for the winning reply (level 3: every turn).
  const SHARP = [0, 0.25, 0.6, 1];

  // ---- the rules core ------------------------------------------------------------------------------------------
  const create = (seed = SEED) => {
    const heaps = new Uint8Array(HEAPS), rng = new Uint32Array(1);
    // turn: 0 the visitor's, 1 the computer's; winner: -1 none yet, 0 visitor, 1 computer.
    const S = { turn: 0, winner: -1, level: DEFAULT_LEVEL, moves: 0, lastH: -1, lastN: 0, seed: seed >>> 0 };
    const next = () => { rng[0] = Math.imul(rng[0], 1664525) + 1013904223 >>> 0; return rng[0] / 4294967296; };
    const total = () => heaps[0] + heaps[1] + heaps[2];
    const nimSum = () => heaps[0] ^ heaps[1] ^ heaps[2];
    const reset = (newSeed) => {
      for (let i = 0; i < HEAPS; i++) heaps[i] = START[i];
      // A seed restarts the generator (so RESET replays a game); without one it runs on (a console run's next game).
      if (Number.isInteger(newSeed)) { S.seed = newSeed >>> 0; rng[0] = S.seed; }
      S.turn = 0; S.winner = -1; S.moves = 0; S.lastH = -1; S.lastN = 0;
    };
    // 0: done; 1: not your turn or the game is over; 2: no such heap; 3: bad count for that heap.
    const take = (h, n) => {
      if (S.winner >= 0 || S.turn !== 0) return 1;
      if (!Number.isInteger(h) || h < 0 || h >= HEAPS) return 2;
      if (!Number.isInteger(n) || n < 1 || n > heaps[h]) return 3;
      heaps[h] -= n; S.moves++; S.lastH = h; S.lastN = n;
      if (!total()) S.winner = 0; else S.turn = 1;
      return 0;
    };
    // The computer's turn. The winning reply (when one exists) makes the nim-sum zero: for a heap whose size XOR the
    // nim-sum is smaller than it, take the difference. Otherwise a seeded legal move: one or two from the largest heap.
    const reply = () => {
      if (S.winner >= 0 || S.turn !== 1) return false;
      let h = -1, n = 0;
      const x = nimSum();
      if (x && next() < SHARP[S.level]) for (let i = 0; i < HEAPS && h < 0; i++) if ((heaps[i] ^ x) < heaps[i]) { h = i; n = heaps[i] - (heaps[i] ^ x); }
      if (h < 0) {
        for (let i = 0; i < HEAPS; i++) if (h < 0 || heaps[i] > heaps[h]) h = i;
        n = Math.min(heaps[h], 1 + (next() < 0.5 ? 1 : 0));
      }
      heaps[h] -= n; S.moves++; S.lastH = h; S.lastN = n;
      if (!total()) S.winner = 1; else S.turn = 0;
      return true;
    };
    const setLevel = (n) => { if (!Number.isInteger(n) || n < 1 || n > LEVELS) return false; S.level = n; reset(S.seed); return true; };
    reset(S.seed);
    return { heaps, state: S, total, nimSum, reset, take, reply, setLevel };
  };

  // ---- today's terminal ----------------------------------------------------------------------------------------
  const NAMES = ["A", "B", "C"];
  const integer = (word, lo, hi) => /^\d+$/.test(word || "") && Number(word) >= lo && Number(word) <= hi ? Number(word) : -1;
  const HELP = ["TAKE heap(A,B,C) count | LEVEL 1..3 | STATUS | HINT | INFO | RESET"];
  const terminal = (game, onChange = () => {}) => {
    const S = game.state, H = game.heaps;
    const board = () => `Heaps A ${H[0]}, B ${H[1]}, C ${H[2]}. Level ${S.level}.`;
    const ending = () => S.winner === 0 ? "You took the last counter: you win. RESET for a new game." : S.winner === 1 ? "The computer took the last counter and wins. RESET to try again." : "Your turn.";
    return {
      banner: ["Nim: a modern museum homage on generic public-domain rules, not historical software.", "Take one or more counters from one heap. Whoever takes the last counter wins. You go first.", ...HELP], prompt: "NIM>",
      run(line) {
        const text = String(line).trim().slice(0, 96), w = text.toUpperCase().split(/\s+/), cmd = w[0];
        if (cmd === "HELP" || !cmd) return { lines: HELP };
        if (cmd === "INFO" || cmd === "MORE") return { lines: ["Nim's rules are generic and public domain; this board, its 3-5-7 start and its opponent were made for this museum.", "No date is given here for Nim or for any machine that played it: those claims are still being checked, so none is shown.", "The computer is bounded: it weighs at most the 15 legal moves in front of it and never searches ahead."] };
        if (cmd === "RESET") { game.reset(S.seed); onChange(game); return { lines: ["New game.", board(), "Your turn."] }; }
        if (cmd === "STATUS") return { lines: [board(), ending()] };
        if (cmd === "HINT") {
          const x = game.nimSum();
          return { lines: [`Write each heap in binary and XOR them: the nim-sum is ${x}.`, x ? "Not zero: there is a move that makes it zero. Leave the computer a zero nim-sum each turn." : "Zero: every move you make leaves a non-zero nim-sum. Take one counter and hope the computer slips."] };
        }
        if (cmd === "LEVEL") {
          const n = w.length === 2 ? integer(w[1], 1, LEVELS) : -1;
          if (n < 0) return { lines: ["LEVEL needs one whole number from 1 (often slips) to 3 (never slips)."] };
          game.setLevel(n); onChange(game);
          return { lines: [`Level ${n}. New game.`, board()] };
        }
        if (cmd !== "TAKE") return { lines: ["Use TAKE, LEVEL, STATUS, HINT, INFO or RESET."] };
        const h = w.length === 3 ? NAMES.indexOf(w[1]) : -1, n = h >= 0 ? integer(w[2], 1, MAX) : -1;
        if (h < 0 || n < 0) return { lines: ["Use TAKE with a heap (A, B or C) and a whole count, for example TAKE C 2."] };
        const r = game.take(h, n);
        if (r === 1) return { lines: [ending()] };
        if (r === 3) return { lines: [`Heap ${NAMES[h]} has ${H[h]}; take from 1 to ${H[h]}.`] };
        const lines = [`You take ${n} from ${NAMES[h]}.`];
        if (game.reply()) lines.push(`The computer takes ${S.lastN} from ${NAMES[S.lastH]}.`);
        onChange(game);
        lines.push(board(), ending());
        return { lines };
      }
    };
  };

  // ---- the console game (retro-games.js factory interface) ---------------------------------------------------------
  // Left and right choose a heap, up and down the count, the action takes. The computer answers after a short beat.
  // Five games a run: score 100 a win; `round` is the game. Allocation-free update and draw: preset strings only.
  const RUN = 5, THINK = 0.6, END_S = 1.4;
  const make = (host) => {
    const kit = BL.retroGames.kit, out = kit.hooks(host), aim = out.aim, status = kit.makeStatus("Games"), { W, H, INK, TEXT } = kit;
    const game = create(), S = game.state, C = { phase: "idle", sel: 2, count: 1, steps: 0, stepsY: 0, wait: 0, wins: 0, played: 0 };
    const clampCount = () => { const most = Math.max(1, game.heaps[C.sel]); if (C.count > most) C.count = most; if (C.count < 1) C.count = 1; };
    const setVerb = () => { status.verb = C.phase === "play" ? "Take" : ""; status.note = S.winner === 0 ? "You win" : S.winner === 1 ? "Computer wins" : ""; };
    const newGame = () => { game.reset(); C.sel = 2; C.count = 1; C.wait = 0; C.phase = "play"; status.round = C.played + 1; setVerb(); };
    const act = () => {
      if (C.phase !== "play" || S.turn !== 0) return;
      if (game.take(C.sel, C.count) !== 0) { out.flop(); return; }
      out.cue("tap", 0.4);
      C.wait = THINK; clampCount(); setVerb();
    };
    const settle = () => {
      if (S.winner < 0) return;
      C.played++; if (S.winner === 0) { C.wins++; status.score += 100; out.cue("win", 0.6); } else out.flop();
      status.left = RUN - C.played; C.phase = "end"; C.wait = END_S; setVerb();
    };
    return {
      kind: "board", name: "Nim (museum homage)", aims: true,
      help: "Left/right pick a heap, up/down the count, act to take. Take the last counter to win.",
      coach: ["A and D pick a heap, W and S the count, Space takes", "Swipe picks a heap, pull sets the count, tap takes"],
      stars: [100, 300, 500], tickets: () => 0, status,
      get playing() { return C.phase === "play" || C.phase === "end"; },
      get game() { return game; },
      start: (seed) => {
        game.reset(Number.isInteger(seed) ? seed : SEED);
        C.wins = C.played = 0; status.score = 0; status.left = RUN; C.steps = aim.steps; C.stepsY = aim.stepsY; newGame();
      },
      stop: () => { C.phase = "idle"; setVerb(); },
      act,
      update: (dt) => {
        if (C.phase === "idle" || C.phase === "done") { C.steps = aim.steps; C.stepsY = aim.stepsY; return; }
        const ds = aim.steps - C.steps, dy = aim.stepsY - C.stepsY;
        C.steps = aim.steps; C.stepsY = aim.stepsY;
        if (C.phase === "play" && S.turn === 0) {
          if (ds) { C.sel = ((C.sel + ds) % HEAPS + HEAPS) % HEAPS; clampCount(); }
          if (dy) { C.count -= dy; clampCount(); }
        }
        if (C.wait > 0 && (C.wait -= dt) <= 0) {
          // A take that emptied the board is decided at once; otherwise the computer answers.
          if (C.phase === "play") { if (S.winner < 0) { game.reply(); clampCount(); } settle(); }
          else if (C.phase === "end") { if (C.played >= RUN) { C.phase = "done"; out.over(); out.onEnd(status.score); } else newGame(); }
        }
      },
      draw: (ctx) => {
        ctx.fillStyle = INK.night; ctx.fillRect(0, 0, W, H);
        kit.centre(ctx, "NIM - MUSEUM HOMAGE", 4, TEXT.teal);
        for (let h = 0; h < HEAPS; h++) {
          const y = 24 + h * 26, picked = C.phase === "play" && S.turn === 0 && h === C.sel;
          kit.text(ctx, NAMES[h], 12, y + 3, picked ? TEXT.banana : TEXT.stone);
          for (let k = 0; k < START[h]; k++) {
            const here = k < game.heaps[h], marked = picked && here && k >= game.heaps[h] - C.count;
            ctx.fillStyle = !here ? INK.deep : marked ? INK.ember : INK.bone;
            ctx.fillRect(28 + k * 16, y, 11, 11);
          }
        }
        kit.text(ctx, "TAKE", 8, 104, TEXT.stone); kit.number(ctx, C.count, 34, 104, TEXT.banana);
        kit.text(ctx, S.winner === 0 ? "YOU WIN" : S.winner === 1 ? "COMPUTER WINS" : S.turn ? "COMPUTER..." : "YOUR TURN", 60, 104, S.winner === 1 ? TEXT.red : TEXT.leaf);
      }
    };
  };

  games.nim = { START, LEVELS, create, terminal, make };
})();
