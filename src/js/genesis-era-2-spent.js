// Era 2's SPENT LIST counter in the Genesis Voyage: a modern original museum game in the spirit of the 1980s gallery,
// not a game from those years, and no historical shop or bank practice is claimed. It plays the problem the
// blind-stamp station's panel ends on: a stamped token can still be spent twice, so someone keeps a list of spent ones.
// Tokens come to the counter one at a time, each with a serial and, if the signer stamped it, the signer's mark.
// Accept a fresh stamped token (it goes on the spent list), refuse one already on the list or one with no mark. The
// list's paper roll shows only its last four serials; older ones roll away under the counter, so the player keeps
// them in mind.
//
// Three faces share one core (`createCounter`), as genesis-era-0-lamps.js does:
//   createCounter(seed)  the rules, pure and seeded (Node-checkable, no DOM): `token`, `stamped`, `repeat`, `answer`,
//                        `timeout`, `reset`; twenty tokens a run, three mistakes end it.
//   terminal(counter)    the exhibit's prompt (ACCEPT, REFUSE, ROLL, NEW, RESET, HELP, MORE), as genesis-props.js's
//                        terminals are.
//   make(host)           the console game on retro-games.js's factory interface, with a clock a token.
// `build(kit)` stands the counter in Era 2's gallery (genesis-era-2.js calls it from its own build when this file is
// loaded): a shop counter with a till and the roll, its finer parts one merged mesh (`detail`), and the prop
// `e2-spent`, whose cartridge plays the game on the console.
(() => {
  "use strict";
  const BL = window.BL = window.BL || {};
  const GOAL = 20, LIVES = 3, ROLL = 4, N = 48;
  // The serials, made once: a letter, a digit and a letter from sets with no look-alikes; (i mod 16, i mod 7) is unique
  // below 112, so all 48 differ.
  const LETTERS = "ACDEFHKMNPRTVWXY", DIGITS = "2345679";
  const SERIALS = [];
  for (let i = 0; i < N; i++) SERIALS.push(LETTERS[(i * 5) % 16] + DIGITS[i % 7] + LETTERS[(i * 11 + 3) % 16]);
  // What an answer was, by code: 0 to 2 right, 3 to 6 a mistake.
  const RIGHT = 0, CAUGHT = 1, NO_MARK = 2, SPENT = 3, UNMARKED = 4, TURNED = 5, SLOW = 6;
  const SAID = ["Accepted: a fresh stamped token. It goes on the spent list.", "Refused: that serial is already on the spent list. Double spend caught!",
    "Refused: no signer's mark on it.", "Mistake: that serial was already spent.", "Mistake: it carries no signer's mark.",
    "Mistake: a good fresh token was turned away.", "Too slow: the customer gave up."];
  const seeded = (seed) => { const s = { v: seed >>> 0 }; return () => { s.v = s.v + 0x6d2b79f5 | 0; let t = Math.imul(s.v ^ s.v >>> 15, 1 | s.v); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; };

  // --- The rules ----------------------------------------------------------------------------------------------------
  // A shuffled deck of fresh serials, the spent list in order (`order`, `used`) and a flag a serial. Each token is a
  // fresh one (now and then unstamped) or, more often as the run goes on, a repeat of a spent one, older than the roll
  // shows more often than not. Allocation-free after creation.
  const createCounter = (seed = 1) => {
    const deck = new Uint8Array(N), spent = new Uint8Array(N), order = new Uint8Array(N);
    const c = { token: 0, stamped: 1, repeat: 0, served: 0, lives: LIVES, score: 0, streak: 0, done: 0, used: 0, next: 0, last: -1, seed: seed >>> 0, rand: seeded(seed), version: 0, spent, order };
    const deal = () => {
      const r = c.rand(), repeatP = Math.min(0.42, 0.16 + c.served * 0.014);
      if (c.used >= 2 && r < repeatP) {
        const old = c.used - ROLL, k = old > 0 && c.rand() < 0.6 ? Math.floor(c.rand() * old) : Math.floor(c.rand() * c.used);
        c.token = order[k]; c.stamped = 1; c.repeat = 1;
      } else {
        c.token = deck[c.next++]; c.stamped = c.rand() < 0.14 ? 0 : 1; c.repeat = 0;
      }
      c.version++;
    };
    const reset = (s = c.seed) => {
      c.seed = s >>> 0; c.rand = seeded(c.seed);
      for (let i = 0; i < N; i++) deck[i] = i;
      for (let i = N - 1; i > 0; i--) { const j = Math.floor(c.rand() * (i + 1)), t = deck[i]; deck[i] = deck[j]; deck[j] = t; }
      spent.fill(0); c.used = 0; c.next = 0; c.served = 0; c.lives = LIVES; c.score = 0; c.streak = 0; c.done = 0; c.last = -1;
      deal();
    };
    const shouldAccept = () => c.stamped === 1 && !spent[c.token];
    // After an answer: count it, end the run (1 won, 2 lost) or deal the next token.
    const settle = (code) => {
      c.last = code; c.served++;
      if (code >= SPENT) { c.lives--; c.streak = 0; } else c.streak++;
      if (c.lives <= 0) c.done = 2; else if (c.served >= GOAL) c.done = 1; else deal();
      c.version++;
      return code;
    };
    // Accept (true) or refuse (false) the token at the counter; `bonus` adds to a right answer's points.
    const answer = (accept, bonus = 0) => {
      if (c.done) return -1;
      const ok = shouldAccept();
      let code;
      if (accept && ok) { code = RIGHT; spent[c.token] = 1; order[c.used++] = c.token; c.score += 10 + bonus; }
      else if (!accept && !ok) { code = c.stamped ? CAUGHT : NO_MARK; c.score += 15 + bonus; }
      else code = accept ? (c.stamped ? SPENT : UNMARKED) : TURNED;
      return settle(code);
    };
    const timeout = () => c.done ? -1 : settle(SLOW);
    // The roll's k-th line (0 the newest), or -1 past what it shows.
    const rollAt = (k) => k < ROLL && k < c.used ? order[c.used - 1 - k] : -1;
    reset(c.seed);
    return Object.assign(c, { reset, answer, timeout, shouldAccept, rollAt, serial: () => SERIALS[c.token] });
  };

  // --- The terminal -------------------------------------------------------------------------------------------------
  const HOW = ["HOW TO USE", "1. A token comes to the counter. Type ACCEPT if it is fresh and carries the signer's mark.",
    "2. Type REFUSE if its serial is already on the spent list, or if it has no mark.", "3. The roll shows only the last four spent serials: remember the older ones.",
    "4. Twenty tokens a run; three mistakes end it. Type NEW for another run.", ""];
  const DEEPER = ["SPENT LIST - a modern original museum game, made in 2026, not a game from the 1980s",
    "In the blind-stamp station's paper analogy, a signer stamps tokens it cannot see. The stamp shows a token is",
    "good, but not that it has not been spent already, so somebody must keep a list of spent tokens and check each",
    "one against it. That list, and whoever keeps it, is still one central party, as the station's panel says.",
    "Here you keep the list. The serials, the shop and the rules are invented for the museum.",
    "Museum note: no historical shop, bank or game is claimed; the 1982 paper itself is the blind-stamp station's story."];
  const terminal = (c) => {
    const roll = () => { const out = ["The roll (newest first):"]; for (let k = 0; k < ROLL; k++) { const i = c.rollAt(k); if (i >= 0) out.push(`  ${SERIALS[i]}`); } if (out.length === 1) out.push("  (nothing spent yet)"); if (c.used > ROLL) out.push(`  ...and ${c.used - ROLL} older, rolled under the counter`); return out; };
    const tokenLine = () => c.done === 1 ? [`All ${GOAL} tokens served: ${c.score} points. Type NEW to play again.`]
      : c.done === 2 ? [`Three mistakes: the run ends with ${c.score} points. Type NEW to try again.`]
        : [`Token ${c.served + 1} of ${GOAL}: serial ${SERIALS[c.token]}, ${c.stamped ? "with the signer's mark" : "with NO mark"}.`, `Score ${c.score} · mistakes left ${c.lives}. ACCEPT or REFUSE?`];
    return {
      get banner() { return ["SPENT LIST COUNTER · 1980s gallery · a modern original museum game", ...HOW, ...tokenLine(), ""]; },
      prompt: "COUNTER>",
      run: (line) => {
        const cmd = String(line).replace(/[\u0000-\u001f\u007f]/g, "").slice(0, 40).trim().toUpperCase().split(/\s+/)[0];
        if (!cmd) return { lines: [] };
        if (cmd === "HELP") return { lines: ["ACCEPT (or A)   take the token: fresh and stamped", "REFUSE (or R)   turn it away: already spent, or no mark", "ROLL            the last four spent serials",
          "SHOW            the token at the counter", "NEW             another run", "RESET           put the counter back", "MORE            about this game"] };
        if (cmd === "MORE") return { lines: DEEPER };
        if (cmd === "SHOW") return { lines: tokenLine() };
        if (cmd === "ROLL" || cmd === "LIST") return { lines: roll() };
        if (cmd === "NEW" || cmd === "RESET") { c.reset(cmd === "NEW" ? c.seed + 1 : 1); return { lines: ["A fresh counter and an empty roll.", ...tokenLine()], reset: cmd === "RESET" }; }
        if (cmd === "ACCEPT" || cmd === "A" || cmd === "REFUSE" || cmd === "R") {
          if (c.done) return { lines: tokenLine() };
          const code = c.answer(cmd[0] === "A");
          return { lines: [SAID[code], ...tokenLine()], code };
        }
        return { lines: ["Type ACCEPT or REFUSE (or HELP)."] };
      }
    };
  };

  // --- The console game (retro-games.js factory interface) ----------------------------------------------------------
  // Space, a tap or a step right accepts; a step left (A, the left arrow, a drag left) refuses. Each token has a clock,
  // shorter as the run goes on; a right answer adds twice the seconds left. Twenty tokens win; three mistakes end it.
  const SLIDE = 0.45, END_S = 1.5;
  const TOKEN = { x: 34, y: 44, w: 48, h: 30 };
  const make = (host) => {
    const K = BL.retroGames.kit, out = K.hooks(host), aim = out.aim, J = K.juice(host), status = K.makeStatus("Tokens");
    const { W, H, INK, TEXT, text, centre, number, textWidth } = K;
    const core = createCounter(1), sparks = K.sparks(48, [INK.teal, INK.banana, INK.white, INK.red]), plus = K.worded("+");
    // The token sliding away keeps its own look while the next one is dealt.
    const S = { phase: "idle", t: 0, limit: 6, steps: 0, slide: 0, dir: 0, code: -1, was: 0, wasStamped: 1, enter: 0, end: 0, ended: 0, seed: 1 };
    const serialX = new Float32Array(N);
    for (let i = 0; i < N; i++) serialX[i] = TOKEN.x + (TOKEN.w - textWidth(SERIALS[i], 2)) / 2;
    const limitFor = () => Math.max(2.6, 6.5 - core.served * 0.18);
    const finish = () => {
      const won = core.done === 1;
      S.phase = "end"; S.end = END_S; status.verb = won ? "COUNTER CLOSED" : "GAME OVER";
      if (won) out.crack(true); else out.flop();
      out.cue(won ? "win" : "lose", 0.6); out.over();
    };
    const decide = (code) => {
      S.code = code; S.slide = SLIDE; S.enter = 0;
      const right = code < SPENT;
      status.score = core.score; status.left = GOAL - core.served; status.round = Math.min(GOAL, core.served + 1); status.streak = core.streak;
      if (right) {
        out.popup(plus(code === RIGHT ? 10 + Math.ceil(S.t * 2) : 15 + Math.ceil(S.t * 2)), false); out.cue(code === RIGHT ? "tap" : "win", 0.45); J.shake(1);
        if (!host.still) sparks.spawn(TOKEN.x + TOKEN.w / 2 + S.dir * 20, TOKEN.y + 10, 10, 50, code === RIGHT ? 0 : 1, 2, 0.5);
        if (core.streak > 0 && core.streak % 5 === 0) out.crack(false);
      } else {
        out.cue("bump", 0.55); out.flop(); J.flash(INK.red, 0.4); J.shake(2);
        if (!host.still) sparks.spawn(TOKEN.x + TOKEN.w / 2, TOKEN.y + TOKEN.h / 2, 8, 40, 3, 3, 0.4);
      }
      if (core.done) finish(); else S.phase = "slide";
    };
    const answer = (accept) => {
      if (S.phase !== "play") return;
      S.was = core.token; S.wasStamped = core.stamped; S.dir = accept ? 1 : -1;
      decide(core.answer(accept, Math.ceil(S.t * 2)));
    };
    const step = (dt) => {
      if (S.slide > 0) S.slide = Math.max(0, S.slide - dt);
      if (S.enter > 0) S.enter = Math.max(0, S.enter - dt);
      if (S.phase === "play") {
        S.t -= dt; status.meter = Math.max(0, S.t / S.limit);
        if (S.t <= 0) { S.was = core.token; S.wasStamped = core.stamped; S.dir = 0; S.t = 0; decide(core.timeout()); }
      } else if (S.phase === "slide") {
        if (S.slide <= 0) { S.phase = "play"; S.limit = limitFor(); S.t = S.limit; S.enter = 0.2; }
      } else if (S.phase === "end" && !S.ended && (S.end -= dt) <= 0) { S.ended = 1; out.onEnd(status.score); }
    };
    const run = K.stepper(step);
    const reset = () => {
      core.reset(S.seed); sparks.clear(); J.reset();
      S.t = 0; S.slide = 0; S.enter = 0; S.dir = 0; S.code = -1; S.end = 0; S.ended = 0; S.steps = aim.steps;
      status.score = 0; status.left = GOAL; status.round = 1; status.verb = ""; status.meter = -1; status.streak = 0;
    };
    // The token: a cream slip with a gold edge, its serial large, and the signer's red mark in its corner if stamped.
    const drawToken = (ctx, serial, stamped, dx, dy) => {
      const x = TOKEN.x + dx, y = TOKEN.y + dy;
      ctx.fillStyle = INK.huskDk; ctx.fillRect(x + 2, y + 2, TOKEN.w, TOKEN.h);
      ctx.fillStyle = INK.gold; ctx.fillRect(x, y, TOKEN.w, TOKEN.h);
      ctx.fillStyle = INK.cream; ctx.fillRect(x + 2, y + 2, TOKEN.w - 4, TOKEN.h - 4);
      ctx.fillStyle = INK.ochre; ctx.fillRect(x + 4, y + 22, TOKEN.w - 8, 1);
      text(ctx, SERIALS[serial], serialX[serial] + dx, y + 6, TEXT.night, 2);
      if (stamped) {
        ctx.fillStyle = INK.red; ctx.fillRect(x + TOKEN.w - 12, y + 3, 9, 1); ctx.fillRect(x + TOKEN.w - 12, y + 11, 9, 1); ctx.fillRect(x + TOKEN.w - 12, y + 3, 1, 9); ctx.fillRect(x + TOKEN.w - 4, y + 3, 1, 9);
        ctx.fillRect(x + TOKEN.w - 9, y + 6, 3, 3);
      }
    };
    reset();
    return {
      kind: "spent", name: "Spent List", status, roundLabel: "Token", aims: true,
      help: "Accept a fresh token with the signer's mark (Space, D or a tap); refuse one already spent or with no mark (A or a drag left). The roll shows only the last four spent serials.",
      coach: ["Space or D accepts, A refuses", "Tap to accept, drag left to refuse"],
      stars: [120, 240, 360], tickets: (s) => Math.floor(s / 50),
      get playing() { return S.phase === "play" || S.phase === "slide"; },
      get seed() { return S.seed; },
      core,
      start: (seed) => { S.seed = Number.isInteger(seed) ? seed >>> 0 : 1; reset(); S.phase = "play"; S.limit = limitFor(); S.t = S.limit; S.enter = 0.2; },
      stop: () => { S.phase = "idle"; reset(); },
      act: () => answer(true),
      update: (dt) => {
        J.update(dt); sparks.update(dt);
        const ds = aim.steps - S.steps;
        S.steps = aim.steps;
        if (ds) answer(ds > 0);
        if (S.phase !== "idle") run(dt);
      },
      draw: (ctx) => {
        ctx.fillStyle = INK.night; ctx.fillRect(0, 0, W, H);
        J.begin(ctx);
        // The shop: a back wall band, the counter's timber top and its front.
        ctx.fillStyle = INK.deep; ctx.fillRect(0, 18, W, 62);
        ctx.fillStyle = INK.rule; ctx.fillRect(0, 18, W, 1);
        ctx.fillStyle = INK.husk; ctx.fillRect(0, 78, W, 4);
        ctx.fillStyle = INK.ochre; ctx.fillRect(0, 78, W, 1);
        ctx.fillStyle = INK.huskDk; ctx.fillRect(0, 82, W, 20);
        // The refuse tray on the left and the till on the right, lit when the token goes their way.
        const toL = S.slide > 0 && S.dir < 0, toR = S.slide > 0 && S.dir > 0;
        ctx.fillStyle = toL ? INK.red : INK.rust; ctx.fillRect(4, 84, 30, 14);
        text(ctx, "<", 7, 88, TEXT.bone); text(ctx, "NO", 15, 88, TEXT.bone);
        ctx.fillStyle = toR ? INK.teal : INK.moss; ctx.fillRect(86, 84, 30, 14);
        text(ctx, "OK", 92, 88, TEXT.bone); text(ctx, ">", 106, 88, TEXT.bone);
        // The roll: the spent list's last four serials, newest at the top, older ones curled under.
        ctx.fillStyle = INK.stoneDk; ctx.fillRect(120, 20, 38, 3);
        ctx.fillStyle = INK.cream; ctx.fillRect(122, 23, 34, 48);
        ctx.fillStyle = INK.stoneLt; ctx.fillRect(120, 71, 38, 7);
        ctx.fillStyle = INK.stone; ctx.fillRect(120, 77, 38, 1);
        text(ctx, "SPENT", 125, 25, TEXT.red);
        for (let k = 0; k < ROLL; k++) { const i = core.rollAt(k); if (i >= 0) text(ctx, SERIALS[i], 130, 35 + k * 9, k ? TEXT.stone : TEXT.night); }
        if (core.used > ROLL) number(ctx, core.used - ROLL, 139, 71, TEXT.night, 1, 1);
        // The token: sliding away after an answer, else the one at the counter (dropping in as it is dealt).
        if (S.slide > 0 || S.phase === "end") {
          const k = host.still ? 0 : 1 - S.slide / SLIDE, dx = Math.round(S.dir * k * 70), dy = Math.round(S.dir ? k * 14 : k * 30);
          drawToken(ctx, S.was, S.wasStamped, dx, dy);
          if (S.code >= SPENT) {
            ctx.fillStyle = INK.red;
            for (let s = 0; s < 24; s++) { ctx.fillRect(TOKEN.x + dx + 12 + s, TOKEN.y + dy + 3 + s, 2, 2); ctx.fillRect(TOKEN.x + dx + 36 - s, TOKEN.y + dy + 3 + s, 2, 2); }
          }
        }
        if (S.phase === "play" || S.phase === "idle") drawToken(ctx, core.token, core.stamped, 0, host.still ? 0 : -Math.round(S.enter * 40));
        sparks.draw(ctx);
        // The clock: a bar under the counter, red in its last quarter.
        if (S.phase === "play") { ctx.fillStyle = S.t < S.limit * 0.25 ? INK.red : INK.banana; ctx.fillRect(4, 102, Math.round((W - 8) * S.t / S.limit), 2); }
        J.end(ctx);
        text(ctx, "SPENT LIST", 4, 3, TEXT.bone);
        number(ctx, host.best || 0, W - 4, 3, TEXT.gold, 1, 2, 3);
        // Mistakes left as red stamps, the score and how many tokens are still to come.
        for (let k = 0; k < LIVES; k++) { ctx.fillStyle = k < core.lives ? INK.red : INK.earth; ctx.fillRect(4 + k * 8, 22, 6, 6); }
        number(ctx, core.score, 4, 32, TEXT.banana);
        text(ctx, "LEFT", 4, 44, TEXT.stone); number(ctx, GOAL - core.served, 4, 53, TEXT.bone);
        if (S.phase === "idle") centre(ctx, "PRESS START", 110, TEXT.banana);
        else if (S.phase === "end") centre(ctx, status.verb, 110, core.done === 1 ? TEXT.teal : TEXT.red);
        else if (S.phase === "slide") {
          const c = S.code;
          centre(ctx, c === RIGHT ? "ACCEPTED" : c === CAUGHT ? "DOUBLE SPEND CAUGHT" : c === NO_MARK ? "NO MARK - REFUSED" : c === SPENT ? "ALREADY SPENT!" : c === UNMARKED ? "NO MARK!" : c === TURNED ? "GOOD TOKEN TURNED AWAY" : "TOO SLOW", 110, c < SPENT ? TEXT.teal : TEXT.red);
        } else centre(ctx, "ACCEPT OR REFUSE?", 110, TEXT.teal);
      }
    };
  };

  // --- The counter in Era 2's gallery -------------------------------------------------------------------------------
  // In Era 2's own (old-world) coordinates on its left bank, north of the old ramp's walkway, facing the old stream (+x),
  // with its walk-up point in front: clear of the reserved plots, the walkway (|z - middle| < 2.6) and every exhibit.
  const detail = (kit, x, y, z, make) => {
    const nd = kit.createNode(kit.M.merge ? { geometry: kit.M.merge(...make(kit.M)) } : {});
    nd.position.x = x; nd.position.y = y; nd.position.z = z;
    return kit.place(nd);
  };
  const B = (M, w, h, d, color, x, y, z, emissive = 0) => M.box({ w, h, d, color, emissive, offset: { x, y, z } });
  const E = BL.genesisWorld.ERAS[2];
  const AT = { x: -15, z: E.z - 15.6, half: { x: 0.6, z: 0.7 }, h: 1.7, reach: 1.5 };
  const EXHIBIT = { id: "e2-spent", year: "1980s", connection: "context", title: "Spent list counter: accept fresh tokens, refuse spent ones",
    label: "SPENT LIST · 1980s GALLERY", sub: "a modern original museum game, not from the 1980s",
    date: "1980s gallery: a modern original museum game made in 2026; no historical game, shop or bank practice is claimed",
    short: "Serve twenty tokens: accept the fresh stamped ones and refuse any already on the spent list." };
  const FACE_X = Math.PI / 2;
  const build = (kit) => {
    const { top: Y, solid, sign } = kit, x = AT.x, z = AT.z;
    const counter = createCounter(1), term = terminal(counter);
    // The counter's body and top (the parts walkers meet), then everything finer as one mesh.
    solid(1.0, 0.95, 1.3, "#6e4a2e", x - 0.1, Y + 0.475, z);
    solid(1.2, 0.06, 1.4, "#d6ccb0", x, Y + 0.98, z);
    detail(kit, x, Y, z, (M) => [
      // A soft violet light pool on the floor round the counter (a glowing decal; no lamp).
      B(M, 1.8, 0.01, 2.0, "#4f2590", 0.1, 0.006, 0, 0.5),
      // Front panels and kick plate, with a gold rule along the edge.
      ...[-0.35, 0.35].map((dz) => B(M, 0.02, 0.6, 0.55, "#7f5836", 0.41, 0.5, dz)), B(M, 0.04, 0.08, 1.32, "#2a1d12", 0.4, 0.04, 0),
      B(M, 0.03, 0.03, 1.42, "#c9a35a", 0.6, 0.99, 0, 0.2),
      // The till: a putty body, its sloped key deck and keys, a green readout, the cash drawer.
      B(M, 0.42, 0.24, 0.44, "#cbbd97", -0.25, 1.13, 0.3), B(M, 0.2, 0.06, 0.42, "#bfb08a", -0.02, 1.08, 0.3),
      ...Array.from({ length: 12 }, (_, k) => B(M, 0.04, 0.025, 0.06, k % 4 === 3 ? "#e2312f" : "#efe6cf", 0.02 - ((k / 4) | 0) * 0.05, 1.12, 0.17 + (k % 4) * 0.085)),
      B(M, 0.1, 0.1, 0.36, "#2e2a22", -0.32, 1.3, 0.3), B(M, 0.012, 0.06, 0.3, "#39ff6a", -0.265, 1.3, 0.3, 1.3),
      B(M, 0.04, 0.06, 0.4, "#9c8e6c", 0.0, 1.03, 0.3),
      // The spent-list roll on its spindle, its paper rising behind it on a clip board with ruled lines.
      B(M, 0.18, 0.18, 0.34, "#f4f2ea", -0.3, 1.1, -0.3), B(M, 0.04, 0.04, 0.44, "#5a5a62", -0.3, 1.1, -0.3),
      B(M, 0.02, 0.62, 0.32, "#f6f0dc", -0.45, 1.46, -0.3), B(M, 0.03, 0.05, 0.34, "#5a5a62", -0.45, 1.79, -0.3),
      ...Array.from({ length: 6 }, (_, k) => B(M, 0.012, 0.014, 0.22, k < 2 ? "#c0303a" : "#5a5068", -0.435, 1.66 - k * 0.08, -0.3)),
      // A tray of tokens waiting and a red stamp pad.
      B(M, 0.22, 0.03, 0.3, "#3a2a1c", 0.32, 1.025, -0.35), ...[0, 1, 2].map((k) => B(M, 0.16, 0.012, 0.09, "#f6ecd2", 0.32, 1.05 + k * 0.013, -0.43 + k * 0.08)),
      B(M, 0.14, 0.03, 0.18, "#2a2230", 0.33, 1.025, 0.0), B(M, 0.11, 0.01, 0.14, "#9a2030", 0.33, 1.045, 0.0),
      // A lit OPEN lamp on a post at the counter's end.
      B(M, 0.04, 0.6, 0.04, "#2a2630", -0.5, 1.3, 0.62), B(M, 0.06, 0.14, 0.24, "#ff5fa8", -0.5, 1.66, 0.62, 1.3)]);
    sign(EXHIBIT.label, EXHIBIT.sub, x + 0.62, Y + 2.05, z, FACE_X, 0.38);
    kit.obstacle(x - AT.half.x, x + AT.half.x, z - AT.half.z, z + AT.half.z);
    kit.prop({ id: EXHIBIT.id, year: EXHIBIT.year, connection: EXHIBIT.connection, date: EXHIBIT.date, title: EXHIBIT.title, label: EXHIBIT.label, short: EXHIBIT.short,
      sourceKeys: ["E2-UPGRADE", "E2-CHAUM"], hint: "Space plays it on the console; the terminal plays it too",
      at: { x: x + AT.half.x + 0.8, y: Y, z }, reach: AT.reach, pick: { w: AT.half.x * 2, h: AT.h, d: AT.half.z * 2, x, z },
      onUse: () => ({ terminal: term }) });
    return { counter, terminal: term };
  };

  BL.genesisEra2Spent = { GOAL, LIVES, ROLL, SERIALS, SAID, AT, EXHIBIT, createCounter, terminal, make, build, HOW, DEEPER };
})();
