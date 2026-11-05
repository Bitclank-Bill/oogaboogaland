// Era 5's Peer Patchwork: an original cooperative packet puzzle, a modern museum homage (not historical software).
// Three simulated peers each hold some of the nine pieces of one original picture; the visitor passes pieces between
// them until every peer has the whole picture. Each round a peer may send one piece (its upload slot), so a good
// route spreads the sending across all three rather than leaning on the first peer that has everything. Nothing is
// downloaded and nothing touches a network: the pieces are nine coloured tiles in typed arrays.
//
// Three faces, one set of rules:
//   BL.genesisEra5Patchwork.puzzle()        the rules, pure and Node-loadable: deal(seed), send(from, to, piece), ...
//   BL.genesisEra5Patchwork.make(host)      a game on src/js/retro-games.js's factory interface (header contract there),
//                                           for a console that stages retro games; it reads BL.retroGames.kit at call
//   BL.genesisEra5Patchwork.terminal(p, n)  a terminal over a puzzle `p` for today's workbench ({ banner, prompt, run });
//                                           `n` is the era file's extra banner lines (its own peer-to-peer words)
//
// The rules: a send needs the sender to hold the piece, the receiver to lack it, and the sender's slot to be free this
// round. A round ends once every slot is spent or no free slot can still help anyone; MAX_ROUNDS rounds in all. The
// fewest rounds any route could take (`bound`) sets the stars. A seed replays a deal exactly.
(() => {
  "use strict";
  const BL = window.BL = window.BL || {};
  const PEERS = 3, PIECES = 9, MAX_ROUNDS = 8, NAMES = ["A", "B", "C"];
  // The deal's own small generator (the same mixing as retro-games.js's `rng`), so the rules load without the arcade.
  const prng = (seed) => { const s = new Uint32Array([seed >>> 0]); return () => { s[0] += 0x6d2b79f5; let t = s[0]; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; };

  const puzzle = () => {
    const have = new Uint8Array(PEERS * PIECES), used = new Uint8Array(PEERS), sent = new Uint8Array(PEERS);
    const P = { seed: 0, round: 1, moves: 0, bound: 0, won: false, lost: false };
    const holds = (peer, piece) => have[peer * PIECES + piece] === 1;
    const count = (peer) => { let n = 0; for (let i = 0; i < PIECES; i++) n += have[peer * PIECES + i]; return n; };
    const complete = (peer) => count(peer) === PIECES;
    const allDone = () => complete(0) && complete(1) && complete(2);
    // Whether a free slot could still help anyone this round.
    const useful = () => {
      for (let s = 0; s < PEERS; s++) if (!used[s]) for (let d = 0; d < PEERS; d++) if (d !== s) for (let p = 0; p < PIECES; p++) if (holds(s, p) && !holds(d, p)) return true;
      return false;
    };
    // Each peer can take at most two pieces a round (one from each other peer), and three pieces move a round at most.
    const bound = () => {
      let worst = 0, total = 0;
      for (let d = 0; d < PEERS; d++) { const miss = PIECES - count(d); total += miss; worst = Math.max(worst, Math.ceil(miss / 2)); }
      return Math.max(worst, Math.ceil(total / 3));
    };
    const deal = (seed) => {
      P.seed = seed >>> 0;
      const next = prng(P.seed);
      for (let tries = 0; tries < 64; tries++) {
        have.fill(0);
        for (let p = 0; p < PIECES; p++) {
          const a = Math.floor(next() * PEERS); have[a * PIECES + p] = 1;
          if (next() < 0.34) have[((a + 1 + Math.floor(next() * 2)) % PEERS) * PIECES + p] = 1;
        }
        let ok = true;
        for (let d = 0; d < PEERS; d++) { const n = count(d); if (n < 2 || n > 6) ok = false; }
        if (ok) break;
      }
      used.fill(0); sent.fill(0);
      P.round = 1; P.moves = 0; P.won = P.lost = false; P.bound = bound();
    };
    const endRound = () => {
      used.fill(0); P.round++;
      if (P.round > MAX_ROUNDS) { P.lost = true; P.round = MAX_ROUNDS; }
    };
    // Codes, so the screen and the terminal word them their own way: 0 sent, 1 finished, 2 bad peer or piece,
    // 3 sender lacks it, 4 receiver has it, 5 sender's slot spent, 6 game over.
    const send = (from, to, piece) => {
      if (P.won || P.lost) return 6;
      if (!(from >= 0 && from < PEERS && to >= 0 && to < PEERS && from !== to && piece >= 0 && piece < PIECES)) return 2;
      if (!holds(from, piece)) return 3;
      if (holds(to, piece)) return 4;
      if (used[from]) return 5;
      have[to * PIECES + piece] = 1; used[from] = 1; sent[from]++; P.moves++;
      if (allDone()) { P.won = true; return 1; }
      if (!useful()) endRound();
      return 0;
    };
    // The round's end by hand (a visitor who wants to keep a slot unused): only while the puzzle runs.
    const pass = () => { if (!P.won && !P.lost) { endRound(); if (!P.lost && !useful()) endRound(); } };
    const stars = () => !P.won ? 0 : P.round <= P.bound ? 3 : P.round <= P.bound + 1 ? 2 : 1;
    const score = () => P.won ? Math.max(60, 400 - (P.round - P.bound) * 60) + Math.min(sent[0], sent[1], sent[2]) * 20 : (complete(0) + complete(1) + complete(2)) * 30;
    return { P, have, used, sent, holds, count, complete, deal, send, pass, stars, score, useful };
  };

  // ---- the terminal (today's workbench) -------------------------------------------------------------------
  const ERR = ["Sent.", "Every peer has the whole picture!", "Use SEND, two different peers (A, B or C) and a piece 1 to 9, e.g. SEND A B 4.",
    "That peer does not hold that piece.", "The receiver already has that piece.", "That peer has already sent a piece this round.", "This puzzle is over. NEW or RESET to play again."];
  const terminal = (p, extra = []) => {
    const grid = (peer) => { let s = ""; for (let i = 0; i < PIECES; i++) s += (p.holds(peer, i) ? String(i + 1) : ".") + (i % 3 === 2 ? " " : ""); return s.trim(); };
    const board = () => [
      ...NAMES.map((n, i) => `Peer ${n}: ${grid(i)}   ${p.complete(i) ? "COMPLETE" : `${p.count(i)}/9`}   slot ${p.used[i] ? "spent" : "free"}`),
      p.P.won ? `Done in ${p.P.round} round${p.P.round === 1 ? "" : "s"} (fewest possible: ${p.P.bound}); ${p.stars()} star${p.stars() === 1 ? "" : "s"}.`
        : p.P.lost ? `Out of rounds: ${MAX_ROUNDS} used. RESET to try the same deal again.` : `Round ${p.P.round} of ${MAX_ROUNDS}. Fewest rounds possible from the start: ${p.P.bound}.`
    ];
    const help = ["HINT: each peer sends one piece a round, so share the sending.", "HOW TO USE:",
      "  1. Type BOARD: each peer's 3x3 picture, with . for a missing piece.",
      "  2. Type SEND, a sender, a receiver and a piece: SEND A B 4.",
      "  3. When no free slot can help, the next round starts; PASS ends a round early.",
      "  4. Finish with every peer complete in as few rounds as you can. NEW deals another; RESET replays this one.",
      "Commands: BOARD | SEND from to piece | PASS | NEW | RESET | LIMITS"];
    const limits = ["The analogy's limits: three honest peers, one upload a round and you routing by hand.",
      "Real file sharing chooses pieces automatically, checks each piece, and peers come and go; none of that is here.",
      "Everyone ending up with the same picture is copying, not agreeing who owns anything."];
    return { banner: ["PEER PATCHWORK / an original cooperative packet puzzle (modern museum homage, not historical software)", ...extra, ...help, ...board()], prompt: "PATCH>",
      run(line) {
        const words = String(line).replace(/[\u0000-\u001f\u007f]/g, "").slice(0, 48).trim().toUpperCase().split(/\s+/), cmd = words[0];
        if (!cmd || cmd === "HELP") return { lines: help };
        if (cmd === "BOARD") return { lines: board() };
        if (cmd === "LIMITS" || cmd === "MORE") return { lines: limits };
        if (cmd === "RESET") { p.deal(p.P.seed); return { lines: ["Same deal again.", ...board()] }; }
        if (cmd === "NEW") { p.deal((p.P.seed * 1103515245 + 12345) >>> 0); return { lines: ["A new deal.", ...board()] }; }
        if (cmd === "PASS") { if (p.P.won || p.P.lost) return { lines: [ERR[6]] }; p.pass(); return { lines: ["Round ended.", ...board()] }; }
        if (cmd === "SEND") {
          const f = NAMES.indexOf(words[1]), t = NAMES.indexOf(words[2]), n = /^[1-9]$/.test(words[3] || "") && words.length === 4 ? +words[3] - 1 : -1;
          const code = n < 0 ? 2 : p.send(f, t, n);
          return { lines: code > 1 ? [ERR[code]] : [ERR[code], ...board(), ...(code === 1 ? limits.slice(2) : [])] };
        }
        return { lines: ["BOARD | SEND from to piece | PASS | NEW | RESET | LIMITS"] };
      } };
  };

  // ---- the retro game ---------------------------------------------------------------------------------------
  // Screen: three 3x3 boards side by side. The cursor walks the nine columns (three boards) and three rows; Space or a
  // tap on a piece a peer holds picks it up from that peer (if its slot is free), then on the same piece's empty place
  // in another peer's board sends it there. Space on the held piece again puts it back. Pieces keep their place, so
  // stepping three columns lands on the same piece in the next peer's board.
  const CELL = 13, BX = [9, 59, 109], BY = 34;
  // The original picture: a banana-yellow sun over teal water and green hills, one ink a piece.
  const ART = ["#5ec8ff", "#ffd23a", "#5ec8ff", "#46ffd2", "#ffb02e", "#46ffd2", "#6fae3a", "#3a6e24", "#6fae3a"];
  const make = (host) => {
    const K = BL.retroGames.kit, { W, INK, TEXT, text, centre, number } = K;
    const out = K.hooks(host), aim = out.aim, status = K.makeStatus("Rounds"), R = K.rng(), p = puzzle();
    const S = { col: 0, row: 0, hand: -1, from: -1, steps: 0, stepsY: 0, clock: 0, endT: 0, note: 0, seed: 0, noteT: 0, roundT: 0 };
    // The screen's own feedback (no rule reads it): sparks, a shake and flash, and a piece in flight from its sender
    // to its receiver (fx..fy from, tx..ty to, k 1 -> 0), plus each board's glow once it is complete.
    const J = K.juice(host), sparks = K.sparks(72, [INK.banana, INK.teal, INK.lime, INK.white, INK.ember]);
    const F = { piece: -1, fx: 0, fy: 0, tx: 0, ty: 0, k: 0 }, glow = new Float32Array(PEERS);
    const cellX = (peer, piece) => BX[peer] + (piece % 3) * CELL, cellY = (piece) => BY + Math.floor(piece / 3) * CELL;
    const say = (n) => { S.note = n; S.noteT = 1; };
    let phase = "idle";
    // Notes the screen shows, one at a time, chosen by index (no string built in play).
    const NOTES = ["PICK A PIECE", "SENT!", "SLOT SPENT THIS ROUND", "ALREADY THERE", "SAME PIECE, OTHER PEER", "PUT BACK", "NEXT ROUND", "PICK A PEER'S PIECE FIRST"];
    const sync = () => { status.round = p.P.round; status.left = Math.max(0, MAX_ROUNDS - p.P.round + 1); status.score = p.score(); status.target = p.P.bound; };
    const finish = () => {
      phase = "done"; S.endT = 1.4; status.score = p.score(); out.cue(p.P.won ? "win" : "buzzer"); if (p.P.won) out.crack(p.stars() === 3); else out.flop();
      if (p.P.won) { J.flash(INK.lime, 0.4); if (!host.still) for (let d = 0; d < PEERS; d++) for (let i = 0; i < PIECES; i += 2) sparks.spawn(cellX(d, i) + 6, cellY(i) + 6, 3, 50, d, 3, 0.8); }
      else { J.flash(INK.red, 0.4); J.shake(2); }
      out.over();
    };
    const run = K.stepper((h) => {
      // Steps, not a slide: read the counters' change since last time.
      const dx = aim.steps - S.steps, dy = aim.stepsY - S.stepsY;
      S.steps = aim.steps; S.stepsY = aim.stepsY;
      if (dx) S.col = (S.col + (dx % 9) + 9) % 9;
      if (dy) S.row = (S.row + (dy % 3) + 3) % 3;
      if (phase === "done") { S.endT -= h; if (S.endT <= 0) { phase = "over"; out.onEnd(status.score); } }
      F.k = Math.max(0, F.k - h * 4); S.noteT = Math.max(0, S.noteT - h * 3); S.roundT = Math.max(0, S.roundT - h * 1.5);
      for (let d = 0; d < PEERS; d++) glow[d] = p.complete(d) ? Math.min(1, glow[d] + h * 3) : 0;
    });
    const act = () => {
      if (phase !== "play") return;
      const peer = Math.floor(S.col / 3), piece = S.row * 3 + S.col % 3;
      if (S.hand < 0) {
        if (!p.holds(peer, piece)) { say(7); out.cue("tick"); return; }
        if (p.used[peer]) { say(2); out.cue("buzzer"); J.shake(1); return; }
        S.hand = piece; S.from = peer; say(4); out.cue("tick"); return;
      }
      if (peer === S.from && piece === S.hand) { S.hand = S.from = -1; say(5); return; }
      if (piece !== S.hand) { say(4); out.cue("tick"); return; }
      const before = p.P.round, from = S.from, code = p.send(S.from, peer, piece);
      if (code === 4) { say(3); out.cue("tick"); return; }
      S.hand = S.from = -1;
      if (code <= 1) {
        out.cue("bonk"); out.popup("SENT", false); say(p.P.round !== before ? 6 : 1); if (p.P.round !== before) { out.cue("round"); S.roundT = 1; J.flash(INK.teal, 0.2); }
        F.piece = piece; F.fx = cellX(from, piece); F.fy = cellY(piece); F.tx = cellX(peer, piece); F.ty = cellY(piece); F.k = 1;
        if (!host.still) sparks.spawn(F.tx + 6, F.ty + 6, 8, 40, p.complete(peer) ? 2 : 0, 1, 0.5);
      }
      sync();
      if (p.P.won || p.P.lost) finish();
    };
    // A piece's tile: its ink with a glint at the top left and a shadow along its foot.
    const tile = (ctx, piece, x, y) => {
      ctx.fillStyle = ART[piece]; ctx.fillRect(x + 1, y + 1, CELL - 3, CELL - 3);
      ctx.fillStyle = INK.white; ctx.fillRect(x + 2, y + 2, 3, 1); ctx.fillRect(x + 2, y + 3, 1, 1);
      ctx.fillStyle = INK.band; ctx.fillRect(x + 1, y + CELL - 3, CELL - 3, 1);
    };
    const drawBoard = (ctx, peer) => {
      const x0 = BX[peer], done = p.complete(peer), g = glow[peer];
      // The board's frame: a deep panel, its rim lime once the peer holds the whole picture.
      ctx.fillStyle = INK.deep; ctx.fillRect(x0 - 3, BY - 13, CELL * 3 + 5, CELL * 3 + 17);
      ctx.fillStyle = done ? (g < 1 && !host.still && (S.clock * 10 | 0) % 2 ? INK.white : INK.lime) : INK.rule;
      ctx.fillRect(x0 - 3, BY - 13, CELL * 3 + 5, 1); ctx.fillRect(x0 - 3, BY + CELL * 3 + 3, CELL * 3 + 5, 1);
      ctx.fillRect(x0 - 3, BY - 13, 1, CELL * 3 + 17); ctx.fillRect(x0 + CELL * 3 + 1, BY - 13, 1, CELL * 3 + 17);
      text(ctx, NAMES[peer], x0, BY - 10, done ? TEXT.lime : TEXT.bone);
      number(ctx, p.count(peer), x0 + 18, BY - 10, done ? TEXT.lime : TEXT.stone, 1, 1);
      // The upload slot's lamp: teal while free (breathing), dark once spent this round.
      const free = !p.used[peer] && phase === "play";
      ctx.fillStyle = free ? (host.still || (S.clock * 2 | 0) % 2 ? INK.teal : INK.sky) : INK.stoneDk;
      ctx.fillRect(x0 + 32, BY - 10, 5, 5);
      if (free) { ctx.fillStyle = INK.white; ctx.fillRect(x0 + 33, BY - 9, 1, 1); }
      for (let i = 0; i < PIECES; i++) {
        const x = x0 + (i % 3) * CELL, y = BY + Math.floor(i / 3) * CELL;
        ctx.fillStyle = INK.band; ctx.fillRect(x, y, CELL - 1, CELL - 1);
        // A piece still in flight to this board shows as its empty socket until it lands.
        const landing = F.k > 0 && F.piece === i && F.tx === x && F.ty === y;
        if (p.holds(peer, i) && !landing) tile(ctx, i, x, y);
        else { ctx.fillStyle = INK.rule; ctx.fillRect(x + 4, y + 4, 4, 4); ctx.fillStyle = INK.band; ctx.fillRect(x + 5, y + 5, 2, 2); }
      }
    };
    return {
      kind: "patchwork", name: "Peer Patchwork", aims: true, status, roundLabel: "Round",
      help: "Arrows or W A S D move between pieces; Space or tap picks a piece up from a peer, then sends it to the same place on another peer. One send per peer a round.",
      coach: ["Arrows move, Space picks up and sends", "Swipe to move, tap to pick up and send"],
      stars: [160, 280, 400], tickets: (score) => Math.floor(score / 40),
      get playing() { return phase === "play"; },
      get seed() { return S.seed; },
      start: (seed) => {
        S.seed = Number.isInteger(seed) ? seed >>> 0 : R.fresh();
        p.deal(S.seed); phase = "play"; S.hand = S.from = -1; S.col = S.row = 0; S.note = 0; S.steps = aim.steps; S.stepsY = aim.stepsY; sync();
        F.k = 0; S.noteT = S.roundT = 0; glow.fill(0); sparks.clear(); J.reset();
      },
      // Interruption: drop the held piece, keep the deal.
      stop: () => { phase = "idle"; S.hand = S.from = -1; F.k = 0; sparks.clear(); J.reset(); },
      act,
      update: (dt) => { S.clock += dt; J.update(dt); sparks.update(dt); run(dt); },
      draw: (ctx) => {
        ctx.fillStyle = INK.night; ctx.fillRect(0, 0, W, 120);
        if (phase === "idle") {
          centre(ctx, "PEER PATCHWORK", 8, TEXT.teal, 2);
          // The picture all three peers are after, its pieces arriving one by one and starting again.
          const shown = host.still ? PIECES : (S.clock * 3 | 0) % (PIECES + 4);
          for (let i = 0; i < PIECES; i++) {
            const x = 61 + (i % 3) * CELL, y = 26 + Math.floor(i / 3) * CELL;
            ctx.fillStyle = INK.band; ctx.fillRect(x, y, CELL - 1, CELL - 1);
            if (i < shown) tile(ctx, i, x, y);
          }
          centre(ctx, "MODERN MUSEUM HOMAGE", 70, TEXT.stone);
          centre(ctx, "SHARE NINE PIECES SO", 80, TEXT.bone);
          centre(ctx, "ALL THREE PEERS FINISH", 89, TEXT.bone);
          if (host.still || (S.clock * 1.6 | 0) % 2) centre(ctx, "PRESS START", 104, TEXT.banana);
          return;
        }
        J.begin(ctx);
        // The rounds as pips: spent, this one (lit, pulsing as it begins) and those left; the fewest possible marked.
        text(ctx, "ROUND", 3, 2, TEXT.stone); number(ctx, p.P.round, 36, 2, S.roundT > 0 && (S.clock * 8 | 0) % 2 ? TEXT.white : TEXT.gold);
        for (let r = 0; r < MAX_ROUNDS; r++) {
          ctx.fillStyle = r + 1 < p.P.round ? INK.stoneDk : r + 1 === p.P.round ? INK.gold : INK.rule;
          ctx.fillRect(46 + r * 6, 3, 4, 4);
          if (r + 1 === p.P.bound) { ctx.fillStyle = INK.teal; ctx.fillRect(46 + r * 6, 8, 4, 1); }
        }
        text(ctx, "BEST", 104, 2, TEXT.stone); number(ctx, p.P.bound, 128, 2, TEXT.gold);
        for (let i = 0; i < PEERS; i++) drawBoard(ctx, i);
        // The held piece's source outlined, and the piece itself riding on the cursor.
        const cx = BX[Math.floor(S.col / 3)] + (S.col % 3) * CELL - 1, cy = BY + S.row * CELL - 1;
        if (S.hand >= 0) {
          const hx = BX[S.from] + (S.hand % 3) * CELL - 1, hy = BY + Math.floor(S.hand / 3) * CELL - 1;
          ctx.strokeStyle = INK.banana; ctx.lineWidth = 1; ctx.strokeRect(hx + 0.5, hy + 0.5, CELL, CELL);
          const bob = host.still ? 0 : (S.clock * 6 | 0) % 2;
          ctx.fillStyle = INK.band; ctx.fillRect(cx + 4, cy - 6 - bob, 9, 9);
          ctx.fillStyle = ART[S.hand]; ctx.fillRect(cx + 5, cy - 5 - bob, 7, 7);
        }
        // A sent piece flying from its sender to the receiver's same place (eased), then landing.
        if (F.k > 0) {
          const e = host.still ? 0 : F.k * F.k, x = F.tx + (F.fx - F.tx) * e, y = F.ty + (F.fy - F.ty) * e - Math.sin(e * Math.PI) * 10;
          tile(ctx, F.piece, Math.round(x), Math.round(y));
        }
        // The cursor: corner brackets, blinking while play waits on a choice.
        if (host.still || phase !== "play" || (S.clock * 4 | 0) % 2) {
          ctx.fillStyle = S.hand >= 0 ? INK.banana : INK.white;
          ctx.fillRect(cx, cy, 4, 1); ctx.fillRect(cx, cy, 1, 4); ctx.fillRect(cx + CELL - 3, cy, 4, 1); ctx.fillRect(cx + CELL, cy, 1, 4);
          ctx.fillRect(cx, cy + CELL, 4, 1); ctx.fillRect(cx, cy + CELL - 3, 1, 4); ctx.fillRect(cx + CELL - 3, cy + CELL, 4, 1); ctx.fillRect(cx + CELL, cy + CELL - 3, 1, 4);
        }
        sparks.draw(ctx);
        J.end(ctx);
        // The note, bright as it is said and settling to its ink.
        const warn = S.note === 2 || S.note === 7 || S.note === 3;
        if (phase === "play") centre(ctx, NOTES[S.note], 84, S.noteT > 0.6 && !host.still ? TEXT.white : warn ? TEXT.ember : S.note === 1 || S.note === 6 ? TEXT.lime : TEXT.bone);
        else centre(ctx, p.P.won ? "EVERY PEER COMPLETE!" : "OUT OF ROUNDS", 84, p.P.won ? TEXT.lime : TEXT.red);
        if (phase !== "play" && p.P.won) for (let k = 0; k < 3; k++) { ctx.fillStyle = k < p.stars() ? INK.banana : INK.rule; ctx.fillRect(68 + k * 9, 93, 6, 6); }
        centre(ctx, "COPYING IS NOT AGREEING", 104, TEXT.stone);
      }
    };
  };

  BL.genesisEra5Patchwork = { puzzle, make, terminal, PEERS, PIECES, MAX_ROUNDS };
})();
