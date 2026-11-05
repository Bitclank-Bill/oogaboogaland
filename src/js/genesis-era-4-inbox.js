// Era 4's inbox: STAMP SORT, a modern original museum game in the spirit of the 1996–1999 gallery, not a game or a
// mail program from those years. It plays the idea the gallery's Hashcash station shows: a letter is worth keeping
// when its sender paid for it with work, and checking that costs one look. Each letter carries a digest of eight
// bits; the inbox asks for a number of zero bits at the front (the target), and each extra zero roughly doubles the
// sender's searching. A letter whose front bits are all zero is paid: keep it. One with a lit bit there is unpaid:
// let it go by. The digests are drawn by a seeded toy generator, not hashed, and nothing is sent or received.
//
// BL.genesisEra4Games.inbox = { LETTERS, LEVELS, LIVES, BITS, create(), terminal(core), make(host), paid(bits, k) }
// - `create()`: the rules core, Node-loadable: `seed(n)`, `letter(k)` fills `core.l` ({ bits, paid }) for target k,
//   and the terminal's tally on `core.s`.
// - `terminal(core)`: the workbench's terminal (NEXT, KEEP, PASS, TARGET, STATUS).
// - `make(host)`: the console game on retro-games.js's factory interface (that file's header is the contract).
(() => {
  "use strict";
  const BL = window.BL = window.BL || {};
  const G = BL.genesisEra4Games = BL.genesisEra4Games || {};
  // Thirty letters in three rounds of ten, the target rising from two zero bits to four; three spam letters kept
  // end the run early.
  const BITS = 8, LETTERS = 30, PER = 10, LEVELS = [2, 3, 4], LIVES = 3, PAID = 0.55;
  const paid = (bits, k) => (bits >> (BITS - k)) === 0;
  const create = () => {
    const R = new Uint32Array(1), l = { bits: 0, paid: false };
    const s = { target: 2, kept: 0, spam: 0, passed: 0, missed: 0, seen: 0, open: false };
    const next = () => {
      R[0] += 0x6d2b79f5;
      let t = R[0];
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
    const int = (n) => Math.floor(next() * n);
    // A paid letter's front k bits are zero and the rest fall as they will. An unpaid one lights at least one front
    // bit, most often the last one inside the target, so it reads at a glance like a paid one.
    const letter = (k) => {
      const tail = int(256) & (0xff >> k);
      if (next() < PAID) { l.bits = tail; l.paid = true; return l; }
      let front = 1 << (BITS - k + (next() < 0.6 ? 0 : int(k)));
      if (next() < 0.3) front |= 1 << (BITS - 1 - int(k));
      l.bits = (front | tail) & 0xff; l.paid = paid(l.bits, k);
      return l;
    };
    const seed = (n) => { R[0] = n >>> 0; };
    const reset = () => { s.kept = s.spam = s.passed = s.missed = s.seen = 0; s.open = false; seed(1997); };
    reset();
    return { s, l, seed, letter, reset };
  };
  const bitString = (bits, k) => {
    let out = "";
    for (let b = BITS - 1; b >= 0; b--) { out += bits >> b & 1 ? "1" : "0"; if (BITS - b === k) out += " | "; }
    return out;
  };

  // ---- the terminal ------------------------------------------------------------------------------------------
  const clean = (text) => String(text).replace(/[\u0000-\u001f\u007f]/g, "").slice(0, 32).trim().toUpperCase();
  const reply = (...lines) => ({ lines });
  const HELP = ["NEXT | KEEP | PASS | TARGET 1..4 | STATUS", "NEXT opens a letter; MORE tells what the inbox stands for."];
  const MORE = ["A sender pays for a letter by searching for a digest that starts with enough zero bits; the inbox checks it with one look.",
    "Each extra zero bit at the front roughly doubles the searching on average. This toy draws its digests from a seeded generator; it hashes nothing.",
    "Context only: an original museum game about the idea at the Hashcash station, not a mail program or a historical product."];
  const terminal = (core) => {
    const s = core.s, l = core.l;
    const tally = () => `Kept: ${s.kept} paid, ${s.spam} spam. Passed: ${s.missed} paid, ${s.passed} spam.`;
    const show = () => [`Letter ${s.seen}: digest ${bitString(l.bits, s.target)}`, `Target: the first ${s.target} bits must be 0. KEEP it or PASS it.`];
    return {
      banner: ["HOW TO USE", "  1. Type NEXT to open a letter and read its eight-bit digest.", "  2. The first bits, before the bar, must all be 0: then the sender paid with work.",
        "  3. Type KEEP for a paid letter, PASS for one with a 1 before the bar.", "  4. TARGET 3 asks for more work; STATUS shows the tally. RESET starts again.", "",
        "STAMP SORT / INBOX: a modern original museum game, not a mail program; nothing is sent or received.", ...HELP],
      prompt: "INBOX>",
      run(line) {
        const parts = clean(line).split(/\s+/), cmd = parts[0];
        if (cmd === "HELP") return reply(...HELP);
        if (cmd === "MORE") return reply(...MORE);
        if (cmd === "RESET") { core.reset(); return { lines: ["Inbox emptied. NEXT opens the first letter."], reset: true }; }
        if (cmd === "STATUS" || cmd === "") return reply(`Target: ${s.target} zero bits at the front.`, tally(), s.open ? show()[0] : "No letter open. NEXT opens one.");
        if (cmd === "TARGET") {
          if (!/^[1-4]$/.test(parts[1] || "")) return reply("Choose TARGET 1, 2, 3 or 4.");
          s.target = Number(parts[1]); s.open = false;
          return reply(`Target: the first ${s.target} bits must be 0. About ${2 ** s.target} tries for a sender on average.`, "NEXT opens a letter.");
        }
        if (cmd === "NEXT") {
          if (s.open) return reply("A letter is already open: KEEP it or PASS it.", ...show());
          core.letter(s.target); s.seen++; s.open = true;
          return reply(...show());
        }
        if (cmd === "KEEP" || cmd === "PASS") {
          if (!s.open) return reply("No letter open. NEXT opens one.");
          s.open = false;
          const keep = cmd === "KEEP";
          if (keep && l.paid) s.kept++; else if (keep) s.spam++; else if (l.paid) s.missed++; else s.passed++;
          return reply(keep ? (l.paid ? "Kept: the front bits are all 0, so the sender did the work." : "Spam kept: a 1 before the bar means the work was not done.")
            : (l.paid ? "Passed a paid letter: its front bits were all 0." : "Passed: a 1 before the bar, so no work was paid."), tally());
        }
        return reply("Unknown command.", ...HELP);
      }
    };
  };

  // ---- STAMP SORT: the console game --------------------------------------------------------------------------
  // Letters ride a belt from right to left through the checker. While a letter is in the checker its digest shows
  // large; Space keeps it. A paid letter kept scores (more with a streak); an unpaid one kept costs a life; a paid
  // letter let by breaks the streak. The belt quickens and the target rises each round of ten.
  const POOL = 4, LW = 28, LH = 17, BELT_Y = 62, WIN_X = 80, WIN_HALF = 15, END_S = 1.4;
  const SPEED = [26, 32, 38], GAP_S = [1.65, 1.38, 1.16];
  const make = (host) => {
    const K = BL.retroGames.kit, { W, H, INK, TEXT, text, centre, number } = K, out = K.hooks(host), J = K.juice(host);
    const status = K.makeStatus("Letters"), rng = K.rng(), sparks = K.sparks(64, [INK.banana, INK.teal, INK.red, INK.bone]);
    // `st` per letter: 0 riding toward the checker, 1 kept (lifting to its tray), 2 let by (riding on, settled).
    const x = new Float32Array(POOL), bits = new Uint8Array(POOL), live = new Uint8Array(POOL), st = new Uint8Array(POOL), kk = new Uint8Array(POOL);
    const fly = new Float32Array(POOL), flyX = new Float32Array(POOL), flyY = new Float32Array(POOL);
    const S = { phase: "idle", spawned: 0, resolved: 0, gap: 0, lives: LIVES, streak: 0, level: 0, end: 0, ended: 0, bad: 0, good: 0, inbox: 0, t: 0 };
    const plus = K.worded("+"), WORK = ["X2", "X4", "X8", "X16"];
    const finish = (won) => {
      S.phase = "end"; S.end = END_S; status.verb = won ? "INBOX SORTED" : S.lives > 0 ? "NO MAIL KEPT" : "SPAM FLOOD";
      if (won) out.crack(true); else out.flop();
      out.cue(won ? "win" : "lose", 0.6); out.over();
    };
    // A letter that has left the checker without being kept, or was kept: the round's tally moves on.
    const resolve = () => {
      S.resolved++; status.left = LETTERS - S.resolved;
      const lv = Math.min(LEVELS.length - 1, S.resolved / PER | 0);
      if (lv !== S.level && S.resolved < LETTERS) { S.level = lv; status.round = lv + 1; status.target = LEVELS[lv]; out.popup("MORE WORK", true); out.cue("win", 0.3); }
      if (S.resolved >= LETTERS && S.phase === "play") finish(status.score > 0);
    };
    const spawn = () => {
      for (let i = 0; i < POOL; i++) {
        if (live[i]) continue;
        const k = LEVELS[S.level], tail = rng.int(256) & (0xff >> k);
        let b = tail;
        if (!rng.chance(PAID)) { b |= 1 << (BITS - k + (rng.chance(0.6) ? 0 : rng.int(k))); if (rng.chance(0.3)) b |= 1 << (BITS - 1 - rng.int(k)); }
        x[i] = W + LW / 2; bits[i] = b & 0xff; live[i] = 1; st[i] = 0; kk[i] = k; fly[i] = 0;
        S.spawned++;
        return;
      }
    };
    const inWindow = (i) => live[i] && st[i] === 0 && Math.abs(x[i] - WIN_X) <= WIN_HALF;
    const step = (dt) => {
      S.t += dt;
      if (S.phase === "end") { if (!S.ended && (S.end -= dt) <= 0) { S.ended = 1; out.onEnd(status.score); } }
      S.bad = Math.max(0, S.bad - dt); S.good = Math.max(0, S.good - dt); S.inbox = Math.max(0, S.inbox - dt);
      for (let i = 0; i < POOL; i++) {
        if (!live[i]) continue;
        if (st[i] === 1) { fly[i] += dt; if (fly[i] >= 0.5) live[i] = 0; continue; }
        if (S.phase !== "play") continue;
        x[i] -= SPEED[S.level] * dt;
        if (st[i] === 0 && x[i] < WIN_X - WIN_HALF) {
          // It slid out of the checker unkept.
          st[i] = 2;
          if (paid(bits[i], kk[i])) { S.streak = 0; status.streak = 0; out.popup("MISSED", false); out.cue("miss", 0.35); }
          resolve();
        }
        if (x[i] < -LW) live[i] = 0;
      }
      if (S.phase === "play" && S.spawned < LETTERS && (S.gap -= dt) <= 0) { S.gap = GAP_S[S.level]; spawn(); }
    };
    const run = K.stepper(step);
    const reset = () => {
      live.fill(0); st.fill(0); sparks.clear(); J.reset();
      S.spawned = S.resolved = 0; S.gap = 0.4; S.lives = LIVES; S.streak = 0; S.level = 0; S.end = 0; S.ended = 0; S.bad = S.good = S.inbox = 0;
      status.score = 0; status.left = LETTERS; status.round = 1; status.target = LEVELS[0]; status.streak = 0; status.verb = ""; status.meter = -1;
    };
    reset();
    // An envelope: paper, a flap in two steps, a stamp in its corner and the digest strip along its foot.
    const envelope = (ctx2, cx, cy, b, k, lift) => {
      const ex = Math.round(cx - LW / 2), ey = Math.round(cy - LH / 2);
      ctx2.fillStyle = INK.husk; ctx2.fillRect(ex + 1, ey + 1, LW, LH);
      ctx2.fillStyle = lift ? INK.white : INK.cream; ctx2.fillRect(ex, ey, LW, LH);
      ctx2.fillStyle = INK.stoneLt;
      for (let d = 0; d < 6; d++) { ctx2.fillRect(ex + 2 + d * 2, ey + 1 + d, 2, 1); ctx2.fillRect(ex + LW - 4 - d * 2, ey + 1 + d, 2, 1); }
      ctx2.fillStyle = INK.rust; ctx2.fillRect(ex + LW - 7, ey + 2, 5, 5);
      ctx2.fillStyle = INK.cream; ctx2.fillRect(ex + LW - 6, ey + 3, 3, 3);
      ctx2.fillStyle = INK.rust; ctx2.fillRect(ex + LW - 5, ey + 4, 1, 1);
      for (let n = 0; n < BITS; n++) {
        ctx2.fillStyle = b >> (BITS - 1 - n) & 1 ? INK.gold : INK.deep;
        ctx2.fillRect(ex + 2 + n * 3, ey + LH - 4, 2, 2);
      }
      ctx2.fillStyle = INK.sky; ctx2.fillRect(ex + 1 + k * 3, ey + LH - 5, 1, 4);
    };
    const game = {
      kind: "e4-inbox", name: "Stamp Sort", status, roundLabel: "Round", aims: false, taps: true,
      help: "Letters ride through the checker. Keep a letter with Space when every bit before the bar is 0: its sender paid with work. Let one with a lit bit there go by.",
      coach: ["Space keeps the letter in the checker", "Tap to keep the letter in the checker"],
      stars: [150, 300, 420],
      tickets: (score) => Math.floor(score / 50),
      get playing() { return S.phase === "play"; },
      // For checks: the letter in the checker now, 1 paid, 0 unpaid, -1 none (reads state, changes nothing).
      checker() { for (let i = 0; i < POOL; i++) if (inWindow(i)) return paid(bits[i], kk[i]) ? 1 : 0; return -1; },
      start(seed) { rng.seed(Number.isInteger(seed) ? seed >>> 0 : 1); reset(); S.phase = "play"; },
      stop() { S.phase = "idle"; reset(); },
      act() {
        if (S.phase !== "play") return;
        let i = 0;
        while (i < POOL && !inWindow(i)) i++;
        if (i === POOL) { out.cue("bump", 0.25); return; }
        st[i] = 1; fly[i] = 0; flyX[i] = x[i]; flyY[i] = BELT_Y;
        if (paid(bits[i], kk[i])) {
          S.streak++; status.streak = S.streak;
          const gain = 10 + 5 * Math.min(S.streak - 1, 4);
          status.score += gain; S.good = 0.35; S.inbox = 0.5;
          out.popup(plus(gain), false); out.cue("step", 0.45); J.shake(0.6);
          if (!host.still) sparks.spawn(x[i], BELT_Y - 6, 8, 40, 0, 1, 0.5);
          if (S.streak % 5 === 0) out.crack(false);
        } else {
          S.lives--; S.streak = 0; status.streak = 0; S.bad = 0.6;
          out.popup("SPAM!", true); out.cue("miss", 0.6); out.flop(); J.flash(INK.red, 0.35); J.shake(2);
          if (!host.still) sparks.spawn(x[i], BELT_Y, 10, 50, 2, 3, 0.6);
          if (S.lives <= 0) { finish(false); return; }
        }
        resolve();
      },
      update(dt) { J.update(dt); sparks.update(dt); if (S.phase !== "idle") run(dt); },
      draw(ctx) {
        const k = LEVELS[S.level];
        ctx.fillStyle = INK.night; ctx.fillRect(0, 0, W, H);
        J.begin(ctx);
        // The desk: a wall rule, the inbox tray top right, the belt with its rollers and the checker's frame.
        ctx.fillStyle = INK.deep; ctx.fillRect(0, 12, W, 34);
        ctx.fillStyle = S.inbox > 0 && !host.still ? INK.leaf : INK.moss; ctx.fillRect(W - 34, 16, 30, 10);
        ctx.fillStyle = INK.earth; ctx.fillRect(W - 34, 24, 30, 2);
        text(ctx, "INBOX", W - 35, 18, TEXT.bone);
        ctx.fillStyle = INK.earthDk; ctx.fillRect(4, 16, 30, 10);
        text(ctx, "BIN", 11, 18, TEXT.stone);
        ctx.fillStyle = INK.charcoal; ctx.fillRect(0, BELT_Y + LH / 2 + 1, W, 6);
        const roll = host.still || S.phase !== "play" ? 0 : (S.t * SPEED[S.level]) % 8 | 0;
        ctx.fillStyle = INK.stoneDk;
        for (let rx = -roll; rx < W; rx += 8) ctx.fillRect(rx, BELT_Y + LH / 2 + 2, 4, 1);
        ctx.fillStyle = S.bad > 0 ? INK.red : S.good > 0 ? INK.teal : INK.sky;
        ctx.fillRect(WIN_X - WIN_HALF - LW / 2 + 2, BELT_Y - LH / 2 - 4, 2, LH + 8); ctx.fillRect(WIN_X + WIN_HALF + LW / 2 - 4, BELT_Y - LH / 2 - 4, 2, LH + 8);
        ctx.fillRect(WIN_X - WIN_HALF - LW / 2 + 2, BELT_Y - LH / 2 - 4, LW + WIN_HALF * 2 - 4, 1);
        for (let i = 0; i < POOL; i++) {
          if (!live[i]) continue;
          if (st[i] === 1) {
            // A kept letter lifts to its tray: paid ones to the inbox, spam to the bin.
            const f = Math.min(1, fly[i] / 0.5), good = paid(bits[i], kk[i]), tx = good ? W - 19 : 19;
            envelope(ctx, flyX[i] + (tx - flyX[i]) * f, flyY[i] + (21 - flyY[i]) * f, bits[i], kk[i], good);
          } else envelope(ctx, x[i], BELT_Y, bits[i], kk[i], false);
        }
        sparks.draw(ctx);
        // The checker's readout: the letter in it, its bits large, a bar after the target's bits.
        let w = -1;
        for (let i = 0; i < POOL; i++) if (inWindow(i)) { w = i; break; }
        const kw = w >= 0 ? kk[w] : k;
        ctx.fillStyle = INK.cave; ctx.fillRect(16, 84, W - 32, 20);
        for (let n = 0; n < BITS; n++) {
          const on = w >= 0 && bits[w] >> (BITS - 1 - n) & 1, bx = 24 + n * 14 + (n >= kw ? 4 : 0);
          ctx.fillStyle = INK.stoneDk; ctx.fillRect(bx - 1, 87, 12, 12);
          ctx.fillStyle = w < 0 ? INK.earthDk : on ? (n < kw ? INK.red : INK.gold) : INK.deep; ctx.fillRect(bx, 88, 10, 10);
          if (on) { ctx.fillStyle = INK.white; ctx.fillRect(bx + 2, 90, 2, 2); }
        }
        ctx.fillStyle = INK.sky; ctx.fillRect(24 + kw * 14 + 1, 85, 2, 16);
        J.end(ctx);
        text(ctx, "STAMP SORT", 3, 3, TEXT.gold);
        number(ctx, status.score, W - 4, 3, TEXT.banana, 1, 2, 3);
        text(ctx, "ZEROS", 4, 107, TEXT.stone); number(ctx, k, 36, 107, TEXT.sky);
        text(ctx, "WORK", 46, 107, TEXT.stone); text(ctx, WORK[k - 1], 72, 107, TEXT.sky);
        for (let n = 0; n < LIVES; n++) { ctx.fillStyle = n < S.lives ? INK.ember : INK.earth; ctx.fillRect(W - 28 + n * 8, 108, 6, 6); }
        number(ctx, status.left, W - 36, 107, TEXT.bone, 1, 2);
        if (S.phase === "idle") centre(ctx, "PRESS START", 36, TEXT.banana);
        else if (S.phase === "end") centre(ctx, status.verb, 36, status.verb === "INBOX SORTED" ? TEXT.teal : TEXT.red);
        else if (S.bad > 0) centre(ctx, "A 1 BEFORE THE BAR", 36, TEXT.red);
        else if (S.streak >= 3) { centre(ctx, "STREAK", 32, TEXT.lime); number(ctx, S.streak, (W >> 1) + 22, 32, TEXT.lime); }
        else centre(ctx, "KEEP IF ALL 0 BEFORE BAR", 36, TEXT.bone);
      }
    };
    return game;
  };
  G.inbox = { BITS, LETTERS, LEVELS, LIVES, PER, paid, create, terminal, make, bitString };
})();
