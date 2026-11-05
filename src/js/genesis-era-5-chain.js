// Era 5's Gold Chain: an original timing game, a modern museum homage (not historical software and not bit gold's
// design). It borrows one picture from the bit gold bench across the walk, that each new string is built on the last
// one: a chain of links, each with a mark at its head and a mark at its tail, grows only by a link whose head matches
// the chain's last tail. Links slide in one at a time; take the ones that fit as they pass the gate and let the rest
// go by. Nothing is computed, mined or owned here: the marks are four inks in typed arrays.
//
// Three faces, one set of rules:
//   BL.genesisEra5Chain.chain()           the rules, pure and Node-loadable: deal(seed), take(), skip(), score(), ...
//   BL.genesisEra5Chain.make(host)        a game on src/js/retro-games.js's factory interface (header contract there),
//                                         for the cartridge console; it reads BL.retroGames.kit at call
//   BL.genesisEra5Chain.terminal(c, n)    a terminal over a chain `c` for today's workbench ({ banner, prompt, run });
//                                         `n` is the era file's extra banner lines
//
// The rules: a link is taken onto the chain when its head matches the chain's tail (the last link's tail mark); a
// link that does not fit is refused and costs one of LIVES; a link let go by costs nothing. GOAL links win. Each new
// link fits with a seeded chance, so a seed replays a deal exactly. The console game adds a clock (RUN_S seconds) and
// a gate the links slide through, faster as the chain grows.
(() => {
  "use strict";
  const BL = window.BL = window.BL || {};
  const MARKS = 4, GOAL = 12, LIVES = 3, FIT = 0.45, NAMES = ["GOLD", "TEAL", "SKY", "EMBER"];
  // The deal's own small generator (the same mixing as retro-games.js's `rng`), so the rules load without the arcade.
  const prng = () => {
    const s = new Uint32Array(1);
    return { seed: (n) => { s[0] = n >>> 0; }, next: () => { s[0] += 0x6d2b79f5; let t = s[0]; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; } };
  };

  const chain = () => {
    // heads[i], tails[i]: the links on the chain, the first one laid by the deal. cur: the link at the gate.
    const heads = new Uint8Array(GOAL + 1), tails = new Uint8Array(GOAL + 1), R = prng();
    const C = { seed: 0, n: 0, head: 0, tail: 0, lives: LIVES, streak: 0, best: 0, missed: 0, won: false, lost: false };
    const linked = () => C.n - 1;
    const end = () => tails[C.n - 1];
    const fits = () => C.head === end();
    // The next link: a seeded chance it fits the chain's current tail, otherwise a head that does not.
    const draw = () => {
      const want = end();
      C.head = R.next() < FIT ? want : (want + 1 + Math.floor(R.next() * (MARKS - 1))) % MARKS;
      C.tail = Math.floor(R.next() * MARKS);
    };
    const deal = (seed) => {
      C.seed = seed >>> 0; R.seed(C.seed);
      heads[0] = Math.floor(R.next() * MARKS); tails[0] = Math.floor(R.next() * MARKS);
      C.n = 1; C.lives = LIVES; C.streak = C.best = C.missed = 0; C.won = C.lost = false;
      draw();
    };
    // Codes, so the screen and the terminal word them their own way: 0 linked, 1 the chain is complete, 2 refused,
    // 3 refused and out of lives, 6 game over.
    const take = () => {
      if (C.won || C.lost) return 6;
      if (fits()) {
        heads[C.n] = C.head; tails[C.n] = C.tail; C.n++;
        C.streak++; if (C.streak > C.best) C.best = C.streak;
        if (linked() >= GOAL) { C.won = true; return 1; }
        draw(); return 0;
      }
      C.streak = 0;
      if (--C.lives <= 0) { C.lost = true; return 3; }
      draw(); return 2;
    };
    // Let the link at the gate go by: true when it would have fitted (a missed link breaks the streak, nothing more).
    const skip = () => {
      if (C.won || C.lost) return false;
      const was = fits();
      if (was) { C.missed++; C.streak = 0; }
      draw(); return was;
    };
    const score = () => linked() * 20 + C.best * 10 + (C.won ? 100 + C.lives * 30 : 0);
    const stars = () => !C.won ? 0 : C.lives === LIVES && C.missed === 0 ? 3 : C.lives >= 2 ? 2 : 1;
    return { C, heads, tails, linked, end, fits, deal, take, skip, score, stars };
  };

  // ---- the terminal (today's workbench) -------------------------------------------------------------------
  const SAYS = ["Linked: it fits the chain's tail.", "The chain is complete!", "Refused: its head does not match the chain's tail. One life lost.",
    "Refused, and that was the last life. RESET to replay this deal.", "", "", "This chain is over. NEW or RESET to play again."];
  const terminal = (c, extra = []) => {
    const link = (h, t) => `[${NAMES[h]}>${NAMES[t]}]`;
    const show = () => {
      const C = c.C, from = Math.max(0, C.n - 4);
      let row = from > 0 ? "... " : "";
      for (let i = from; i < C.n; i++) row += link(c.heads[i], c.tails[i]);
      return [`Chain: ${row}`, `Tail: ${NAMES[c.end()]}. ${c.linked()}/${GOAL} links, ${C.lives} li${C.lives === 1 ? "fe" : "ves"} left.`,
        C.won ? `Complete: ${c.stars()} star${c.stars() === 1 ? "" : "s"}, score ${c.score()}.` : C.lost ? "Out of lives. RESET to replay this deal." : `At the gate: ${link(C.head, C.tail)}`];
    };
    const help = ["HINT: a link fits when its head matches the chain's tail.", "HOW TO USE:",
      "  1. Type SHOW: the chain's last links, its tail and the link at the gate.",
      "  2. Type TAKE to add the link at the gate, or SKIP to let it go by.",
      "  3. A link that does not fit is refused and costs a life; a skip costs nothing.",
      `  4. Link ${GOAL} to finish. NEW deals another chain; RESET replays this one.`,
      "Commands: SHOW | TAKE | SKIP | NEW | RESET | LIMITS"];
    const limits = ["The analogy's limits: here a link fits by a matching mark, chosen by a dice roll.",
      "In the bit gold proposal each new string was meant to cost real work and to build on the last; this toy does no work at all.",
      "A chain of links is not a record of who owns anything; that question is on the bit gold bench's lectern."];
    return { banner: ["GOLD CHAIN / an original timing game (modern museum homage, not historical software and not bit gold's design)", ...extra, ...help, ...show()], prompt: "CHAIN>",
      run(line) {
        const words = String(line).replace(/[\u0000-\u001f\u007f]/g, "").slice(0, 48).trim().toUpperCase().split(/\s+/), cmd = words[0];
        if (!cmd || cmd === "HELP") return { lines: help };
        if (cmd === "SHOW" || cmd === "BOARD") return { lines: show() };
        if (cmd === "LIMITS" || cmd === "MORE") return { lines: limits };
        if (cmd === "RESET") { c.deal(c.C.seed); return { lines: ["Same deal again.", ...show()] }; }
        if (cmd === "NEW") { c.deal((c.C.seed * 1103515245 + 12345) >>> 0); return { lines: ["A new chain.", ...show()] }; }
        if (cmd === "TAKE") { const code = c.take(); return { lines: [SAYS[code], ...(code === 6 ? [] : show()), ...(code === 1 ? limits.slice(2) : [])] }; }
        if (cmd === "SKIP") { if (c.C.won || c.C.lost) return { lines: [SAYS[6]] }; const was = c.skip(); return { lines: [was ? "Let go by, though it would have fitted." : "Let go by: it did not fit.", ...show()] }; }
        return { lines: ["SHOW | TAKE | SKIP | NEW | RESET | LIMITS"] };
      } };
  };

  // ---- the retro game ---------------------------------------------------------------------------------------
  // Screen: the chain's last links across the top, ending in its tail; below, a conveyor where each new link slides in
  // from the right towards the gate on the left. Space (or a tap) while the link is inside the gate takes it; a link
  // that leaves the gate goes by. Faster with every link; RUN_S seconds in all.
  const RUN_S = 90, END_S = 1.4, LW = 26, LH = 14, GX = 34, GATE = 12, BELT_Y = 62, SHOWN = 5;
  const INKS = ["#ffd23a", "#46ffd2", "#5ec8ff", "#ff8a2a"];
  // A mark in a 6x6 cell: a shape as well as an ink, so the four read apart without colour.
  const mark = (ctx, m, x, y) => {
    ctx.fillStyle = INKS[m];
    if (m === 0) { ctx.fillRect(x + 1, y + 1, 4, 4); }
    else if (m === 1) { ctx.fillRect(x, y + 1, 6, 1); ctx.fillRect(x, y + 4, 6, 1); }
    else if (m === 2) { ctx.fillRect(x, y, 6, 1); ctx.fillRect(x, y + 5, 6, 1); ctx.fillRect(x, y, 1, 6); ctx.fillRect(x + 5, y, 1, 6); }
    else { ctx.fillRect(x + 2, y, 2, 6); ctx.fillRect(x, y + 2, 6, 2); }
  };
  const make = (host) => {
    const K = BL.retroGames.kit, { W, H, INK, TEXT, text, centre, number } = K;
    const out = K.hooks(host), J = K.juice(host), status = K.makeStatus("Links"), R = K.rng(), c = chain();
    const sparks = K.sparks(64, [INK.banana, INK.gold, INK.white, INK.red]);
    const plus = K.worded("+");
    // x: the sliding link's left edge; t: the run's clock; flash: the gate's reaction (+ took, - refused).
    const S = { x: W, t: 0, clock: 0, endT: 0, note: 0, seed: 0, flash: 0, ok: 0, slide: 0 };
    let phase = "idle";
    const NOTES = ["TAKE THE LINKS THAT FIT", "LINKED!", "DOES NOT FIT", "IT FITTED: MISSED", "TOO EARLY", "LET IT GO BY", "CHAIN COMPLETE!", "OUT OF LIVES", "TIME!"];
    const sync = () => { status.score = c.score(); status.left = GOAL - c.linked(); status.round = c.linked() + 1; status.streak = c.C.streak; status.meter = phase === "play" ? Math.max(0, 1 - S.t / RUN_S) : -1; };
    const speed = () => 50 + c.linked() * 6;
    const inGate = () => S.x <= GX + GATE && S.x + LW >= GX - GATE + LW;
    const finish = (note) => {
      phase = "done"; S.endT = END_S; S.note = note; status.verb = c.C.won ? "WELL DONE" : "GAME OVER"; sync();
      out.cue(c.C.won ? "win" : "buzzer"); if (c.C.won) out.crack(c.stars() === 3); else out.flop();
      if (c.C.won && !host.still) for (let i = 0; i < 6; i++) sparks.spawn(20 + i * 24, 26, 8, 60, 0, 1, 0.9);
      out.over();
    };
    const run = K.stepper((h) => {
      S.flash = Math.max(0, S.flash - h * 2.5); S.slide = Math.max(0, S.slide - h * 6);
      if (phase === "play") {
        S.t += h;
        S.x -= speed() * h;
        // Past the gate's far side: the link goes by.
        if (S.x < GX - GATE - 6) { const was = c.skip(); S.note = was ? 3 : 5; if (was) { out.cue("bump", 0.4); J.flash(INK.red, 0.15); } S.x = W; sync(); }
        if (S.t >= RUN_S) { S.t = RUN_S; finish(8); return; }
        status.meter = 1 - S.t / RUN_S;
      } else if (phase === "done") { S.endT -= h; if (S.endT <= 0) { phase = "over"; out.onEnd(status.score); } }
    });
    const act = () => {
      if (phase !== "play") return;
      if (!inGate()) { S.note = 4; out.cue("tick", 0.3); return; }
      const code = c.take();
      if (code <= 1) {
        S.note = 1; S.ok = 1; S.flash = 1; S.slide = 1; out.cue("link", 0.5); J.shake(1);
        out.popup(plus(20), false);
        if (!host.still) sparks.spawn(GX + LW / 2, BELT_Y + LH / 2, 10, 50, 0, 1, 0.5);
        if (c.C.streak > 1 && c.C.streak % 4 === 0) { out.crack(false); out.cue("round", 0.5); }
      } else {
        S.note = 2; S.ok = 0; S.flash = 1; out.cue("buzzer", 0.5); out.flop(); J.flash(INK.red, 0.35); J.shake(2);
        if (!host.still) sparks.spawn(GX + 4, BELT_Y + LH / 2, 8, 40, 3, 3, 0.4);
      }
      S.x = W; sync();
      if (code === 1) finish(6); else if (code === 3) finish(7);
    };
    // A link at (x, y): a bevelled tile with its head mark on the left and its tail mark on the right.
    const drawLink = (ctx, h, t, x, y, lit) => {
      ctx.fillStyle = lit ? INK.gold : INK.husk; ctx.fillRect(x, y, LW, LH);
      ctx.fillStyle = lit ? INK.banana : INK.ochre; ctx.fillRect(x, y, LW, 1); ctx.fillRect(x, y, 1, LH);
      ctx.fillStyle = INK.huskDk; ctx.fillRect(x, y + LH - 1, LW, 1); ctx.fillRect(x + LW - 1, y, 1, LH);
      ctx.fillStyle = INK.band; ctx.fillRect(x + 2, y + 3, 8, 8); ctx.fillRect(x + LW - 10, y + 3, 8, 8);
      mark(ctx, h, x + 3, y + 4); mark(ctx, t, x + LW - 9, y + 4);
      ctx.fillStyle = INK.charcoal; ctx.fillRect(x + 12, y + 6, 2, 2);
    };
    return {
      kind: "goldchain", name: "Gold Chain", aims: true, taps: true, status, roundLabel: "Link",
      help: "Links slide in towards the gate. Press Space (or tap) while a link is in the gate to take it, only when its left mark matches the chain's tail. A link that does not fit costs a life; letting one go by costs nothing.",
      coach: ["Space takes the link in the gate", "Tap to take the link in the gate"],
      stars: [200, 360, 520], tickets: (score) => Math.floor(score / 40),
      get playing() { return phase === "play"; },
      get seed() { return S.seed; },
      start: (seed) => {
        S.seed = Number.isInteger(seed) ? seed >>> 0 : R.fresh();
        c.deal(S.seed); phase = "play"; S.x = W; S.t = 0; S.note = 0; S.flash = S.slide = 0; S.endT = 0;
        sparks.clear(); J.reset(); status.verb = ""; sync();
      },
      stop: () => { phase = "idle"; sparks.clear(); J.reset(); },
      act,
      update: (dt) => { S.clock += dt; J.update(dt); sparks.update(dt); run(dt); },
      draw: (ctx) => {
        ctx.fillStyle = INK.night; ctx.fillRect(0, 0, W, H);
        if (phase === "idle") {
          centre(ctx, "GOLD CHAIN", 14, TEXT.gold, 2);
          for (let i = 0; i < 4; i++) drawLink(ctx, i, (i + 1) % MARKS, 22 + i * 30, 38, true);
          for (let i = 0; i < 3; i++) { ctx.fillStyle = INK.banana; ctx.fillRect(48 + i * 30, 44, 4, 2); }
          centre(ctx, "MODERN MUSEUM HOMAGE", 62, TEXT.stone);
          centre(ctx, "TAKE ONLY THE LINKS", 76, TEXT.bone);
          centre(ctx, "THAT FIT THE TAIL", 86, TEXT.bone);
          if (host.still || (S.clock * 1.6 | 0) % 2) centre(ctx, "PRESS START", 104, TEXT.banana);
          return;
        }
        J.begin(ctx);
        // The chain: its last SHOWN links, ending at the tail, joined by little bars; a new link rises into place from the belt.
        const C = c.C, from = Math.max(0, C.n - SHOWN), drop = host.still ? 0 : Math.round(S.slide * 20);
        ctx.fillStyle = INK.deep; ctx.fillRect(0, 14, W, 26);
        ctx.fillStyle = INK.rule; ctx.fillRect(0, 14, W, 1); ctx.fillRect(0, 39, W, 1);
        for (let i = from; i < C.n; i++) {
          const x = 4 + (i - from) * 30, last = i === C.n - 1, y = last && C.n > 1 ? 19 + drop : 19;
          if (i > from) { ctx.fillStyle = INK.gold; ctx.fillRect(x - 4, 19 + LH / 2 - 1, 4, 2); }
          drawLink(ctx, c.heads[i], c.tails[i], x, y, last);
          if (last && !drop) { ctx.strokeStyle = INK.white; ctx.lineWidth = 1; ctx.strokeRect(x + LW - 11.5, 21.5, 11, 11); }
        }
        // The tail it must fit, called out.
        text(ctx, "TAIL", 4, 43, TEXT.stone); mark(ctx, c.end(), 30, 44);
        // The belt: a dark track with moving rungs, the gate a bracket that glows on a take or a refusal.
        ctx.fillStyle = INK.band; ctx.fillRect(0, BELT_Y - 4, W, LH + 8);
        const shift = host.still ? 0 : Math.floor(S.t * speed()) % 10;
        ctx.fillStyle = INK.rule; for (let x = -shift; x < W; x += 10) ctx.fillRect(x + 9, BELT_Y + LH + 2, 2, 2);
        const glow = S.flash > 0 ? (S.ok ? INK.lime : INK.red) : INK.teal, gx = GX - GATE;
        ctx.fillStyle = glow;
        ctx.fillRect(gx - 2, BELT_Y - 6, 2, LH + 12); ctx.fillRect(GX + GATE + LW, BELT_Y - 6, 2, LH + 12);
        ctx.fillRect(gx - 2, BELT_Y - 6, 6, 2); ctx.fillRect(GX + GATE + LW - 4, BELT_Y - 6, 6, 2);
        ctx.fillRect(gx - 2, BELT_Y + LH + 4, 6, 2); ctx.fillRect(GX + GATE + LW - 4, BELT_Y + LH + 4, 6, 2);
        if (phase === "play") drawLink(ctx, C.head, C.tail, Math.round(S.x), BELT_Y, inGate());
        sparks.draw(ctx);
        // The clock, red in its last quarter.
        if (phase === "play") { const k = Math.max(0, 1 - S.t / RUN_S); ctx.fillStyle = k < 0.25 ? INK.red : INK.teal; ctx.fillRect(4, 84, Math.round((W - 8) * k), 3); }
        J.end(ctx);
        text(ctx, "GOLD CHAIN", 3, 3, TEXT.gold);
        number(ctx, status.score, W - 3, 3, TEXT.bone, 1, 2, 4);
        text(ctx, "LINKS", 56, 43, TEXT.stone); number(ctx, c.linked(), 88, 43, TEXT.banana); text(ctx, "/12", 100, 43, TEXT.stone);
        for (let k = 0; k < LIVES; k++) { ctx.fillStyle = k < C.lives ? INK.ember : INK.earth; ctx.fillRect(W - 24 + k * 7, 44, 5, 5); }
        const bad = S.note === 2 || S.note === 3 || S.note === 7 || S.note === 8;
        centre(ctx, NOTES[S.note], 94, bad ? TEXT.ember : S.note === 1 || S.note === 6 ? TEXT.lime : TEXT.bone);
        centre(ctx, "A CHAIN IS NOT A LEDGER", 108, TEXT.stone);
      }
    };
  };

  BL.genesisEra5Chain = { chain, make, terminal, MARKS, GOAL, LIVES, RUN_S, NAMES };
})();
