// Era 7's cooperative game, PEER SYNC: a modern museum homage (made in 2026), not historical software. It extends the
// software desk's three pretend terminals (genesis-era-7.js) into a short game: records arrive, links drop, and the
// visitor plugs terminals back in so they catch up, until all three hold the same eight records. Nothing here is a
// network, wallet, payment or mining: plain typed arrays and a seeded generator.
//
// - `createRules()`: the rules, pure and Node-checkable. `start(seed)`, `beat()` (one seeded event: a new record shared
//   by the online terminals, a link dropping, or a broken record that every online terminal refuses), `plug(i)` (a
//   terminal comes back, checks the link and copies what it lacks), `inStep()`, `score()`. Bounded: TARGET records,
//   at most BEATS beats a run, and every seed can be won within them (records are forced when they would otherwise run
//   out of beats). A seed replays a run exactly.
// - `terminal(rules)`: the game through the exhibit workbench's terminal shape ({ banner, prompt, run }), playable today.
// - `make(host)`: the same rules on retro-games.js's factory interface (`make(host)` → { kind, name, help, coach,
//   stars, tickets, status, playing, start, act, stop, update, draw, aims }), drawing on BL.retroGames.kit's shared
//   160x120 screen. `update` and `draw` allocate nothing; play runs on the kit's fixed step. The integrator mounts it
//   (see docs/genesis-voyage/exhibits/era-7.md, Integration requests).
(() => {
  "use strict";
  const BL = window.BL = window.BL || {};
  const PEERS = 3, NAMES = ["A", "B", "C"], TARGET = 8, BEATS = 40;
  // Event odds per beat while records are still coming: a new record, else a dropped link, else a broken record.
  const P_RECORD = 0.5, P_DROP = 0.3;

  // --- The rules ----------------------------------------------------------------------------------------------------
  const createRules = () => {
    const online = new Uint8Array(PEERS), len = new Uint8Array(PEERS), seed32 = new Uint32Array(1);
    // `last` names the last beat's event: 0 none, 1 record (by `by`), 2 drop (of `by`), 3 refused, 4 waiting.
    const S = { head: 0, beats: 0, refused: 0, plugs: 0, offline: 0, done: false, won: false, seed: 0, last: 0, by: -1 };
    const next = () => {
      seed32[0] += 0x6d2b79f5;
      let t = seed32[0];
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
    const countOnline = () => { let n = 0; for (let i = 0; i < PEERS; i++) n += online[i]; return n; };
    // The k-th online terminal (k from 0).
    const nthOnline = (k) => { for (let i = 0; i < PEERS; i++) if (online[i] && k-- === 0) return i; return -1; };
    const inStep = () => { for (let i = 0; i < PEERS; i++) if (!online[i] || len[i] !== S.head) return false; return true; };
    const settle = () => { if (S.head >= TARGET && inStep()) { S.done = true; S.won = true; } else if (S.beats >= BEATS) S.done = true; };
    const start = (seed) => {
      S.seed = seed >>> 0; seed32[0] = S.seed;
      online.fill(1); len.fill(0);
      S.head = S.beats = S.refused = S.plugs = S.offline = 0; S.done = S.won = false; S.last = 0; S.by = -1;
    };
    const beat = () => {
      if (S.done) return S.last;
      S.beats++;
      for (let i = 0; i < PEERS; i++) if (!online[i]) S.offline++;
      if (S.head >= TARGET) { S.last = 4; S.by = -1; settle(); return S.last; }
      // Every seed is winnable within the beat limit: when the records still to come need every remaining beat but one
      // (one spare beat to plug a terminal back in), this beat brings a record whatever the draw says. The draw is
      // still made, so every other beat of a seed plays as it did.
      const r = next(), on = countOnline(), due = TARGET - S.head >= BEATS - S.beats;
      if (due || r < P_RECORD) {
        S.by = nthOnline(Math.floor(next() * on)); S.head++;
        for (let i = 0; i < PEERS; i++) if (online[i]) len[i] = S.head;
        S.last = 1;
      } else if (r < P_RECORD + P_DROP && on > 1) {
        S.by = nthOnline(Math.floor(next() * on)); online[S.by] = 0; S.last = 2;
      } else { S.refused++; S.by = -1; S.last = 3; }
      settle();
      return S.last;
    };
    // Plugs terminal i back in: it checks the link to the newest record and copies the ones it lacks. Returns how many
    // it copied, or -1 when it was already plugged in (or the run is over).
    const plug = (i) => {
      if (S.done || !(i >= 0 && i < PEERS) || online[i]) return -1;
      online[i] = 1; S.plugs++;
      const copied = S.head - len[i];
      len[i] = S.head;
      settle();
      return copied;
    };
    // Fewer beats and fewer terminal-beats spent unplugged score higher (300 to 1000 for a win); an unfinished run scores
    // 30 a record reached, at most 240, so any win beats any unfinished run.
    const score = () => S.won ? Math.max(300, 1000 - 10 * S.beats - 25 * S.offline) : 30 * S.head;
    return Object.assign(S, { online, len, start, beat, plug, inStep, score, countOnline });
  };

  // --- Through the terminal ---------------------------------------------------------------------------------------
  const peerOf = (arg) => NAMES.indexOf(String(arg).trim().toUpperCase());
  const terminal = (rules, { seed = 2009 } = {}) => {
    let runs = 0;
    const R = rules;
    const table = () => [
      ...NAMES.map((n, i) => `  ${n}  ${R.online[i] ? "plugged in" : "UNPLUGGED "}  ${R.len[i]}/${TARGET} records${R.online[i] && R.len[i] < R.head ? "  (behind)" : ""}`),
      `Beat ${R.beats}/${BEATS} · newest record ${R.head}/${TARGET} · broken records refused ${R.refused}`,
      R.won ? `IN STEP! All three hold the same ${TARGET} records. Score ${R.score()}. NEW plays again.` : R.done ? `Time is up at ${R.head}/${TARGET}. Score ${R.score()}. NEW plays again.` : R.inStep() ? "All three agree so far." : "They do not all agree yet."];
    const said = ["", "", "", "Nothing new this beat.", "Every record is in: get everyone plugged in."];
    const event = () => R.last === 1 ? `Terminal ${NAMES[R.by]} made record ${R.head}; every plugged-in terminal took it.`
      : R.last === 2 ? `Terminal ${NAMES[R.by]}'s link dropped. It keeps what it has and misses new records.`
      : R.last === 3 ? "A visiting terminal offered a record with a broken link: refused by every plugged-in terminal." : said[R.last] || "";
    R.start(seed);
    return {
      get banner() { return ["PEER SYNC · a modern museum homage, made in 2026, not historical software.", "Keep three pretend terminals in step until they share 8 records.",
        "WAIT lets one beat pass; PLUG B reconnects B. No real network, wallet, payment or mining.", "", ...table(), ""]; },
      prompt: "SYNC>",
      run: (line) => {
        const input = String(line).replace(/[\u0000-\u001f\u007f]/g, "").slice(0, 60).trim(), sp = input.indexOf(" ");
        const cmd = (sp < 0 ? input : input.slice(0, sp)).toUpperCase(), arg = sp < 0 ? "" : input.slice(sp + 1);
        if (!cmd) return { lines: [] };
        if (cmd === "HELP") return { lines: ["WAIT        let one beat pass (W does too)", "PLUG B      reconnect terminal B: it checks the link and catches up",
          "COMPARE     each terminal's records", "NEW         a fresh run (a new seed)", "RESET       this run again from its start"] };
        if (cmd === "COMPARE" || cmd === "STATUS") return { lines: table() };
        if (cmd === "RESET") { R.start(R.seed); return { lines: ["The run starts again from the same seed.", ...table()], reset: true }; }
        if (cmd === "NEW") { R.start(seed + ++runs); return { lines: [`Run ${runs + 1}.`, ...table()] }; }
        if (cmd === "WAIT" || cmd === "W") {
          if (R.done) return { lines: ["This run is over. NEW plays again, RESET replays it."] };
          R.beat();
          return { lines: [event(), ...table()] };
        }
        if (cmd === "PLUG") {
          const i = peerOf(arg);
          if (i < 0) return { lines: ["Name a terminal: PLUG A, PLUG B or PLUG C."] };
          const n = R.plug(i);
          if (n < 0) return { lines: [R.done ? "This run is over. NEW plays again." : `Terminal ${NAMES[i]} is already plugged in.`] };
          return { lines: [`Terminal ${NAMES[i]} is back: it checked the link and copied ${n} record(s).`, ...table()] };
        }
        return { lines: ["Unknown command. Type HELP."] };
      }
    };
  };

  // --- On the retro screen ----------------------------------------------------------------------------------------
  // The retro-games.js interface. Left and right (aim.steps) pick a terminal; Space or a tap (act) plugs it in, or
  // starts a run when idle. A beat passes every BEAT_S seconds of play.
  const BEAT_S = 1.1, END_S = 1.6;
  const make = (host) => {
    const K = BL.retroGames.kit, out = K.hooks(host), aim = out.aim, status = K.makeStatus("Beats");
    const R = createRules(), J = K.juice(host), I = K.INK, T = K.TEXT, seeder = K.rng();
    const G = { phase: "idle", t: 0, sel: 0, steps: 0, endT: 0, flash: new Float32Array(PEERS) };
    const BOX_X = [12, 62, 112], BOX_Y = 34, BOX_W = 36, BOX_H = 28;
    const sync = () => { status.score = R.score(); status.left = BEATS - R.beats; status.round = R.head; status.target = TARGET; status.note = R.inStep() ? "In step" : "Out of step"; };
    const finish = () => { G.phase = "end"; G.endT = END_S; out.cue(R.won ? "win" : "lose", 0.8); out.over(); if (R.won) out.crack(true); else out.flop(); };
    const step = (dt) => {
      if (G.phase !== "play") return;
      const d = aim.steps - G.steps;
      if (d) { G.steps = aim.steps; G.sel = ((G.sel + d) % PEERS + PEERS) % PEERS; }
      G.t += dt;
      if (G.t >= BEAT_S) {
        G.t -= BEAT_S;
        const e = R.beat();
        if (e === 2) { G.flash[R.by] = 0.6; out.cue("miss", 0.5); J.shake(1); }
        else if (e === 1) out.cue("tick", 0.4);
        sync();
        if (R.done) finish();
      }
      for (let i = 0; i < PEERS; i++) if (G.flash[i] > 0) G.flash[i] = Math.max(0, G.flash[i] - dt);
    };
    const tick = K.stepper(step);
    const game = {
      kind: "peersync", name: "Peer Sync", aims: true, status, roundLabel: "Records",
      help: "A and D or the arrows pick a terminal; Space or a tap plugs it back in. Keep all three in step until they share 8 records. A modern homage, not historical software.",
      coach: ["A and D pick, Space plugs in", "Swipe picks, tap plugs in"],
      stars: [300, 550, 750], tickets: (score) => Math.min(20, Math.floor(score / 50)),
      get playing() { return G.phase === "play" || G.phase === "end"; },
      get seed() { return R.seed; },
      get selected() { return G.sel; },
      rules: R,
      start: (seed) => {
        R.start(Number.isInteger(seed) ? seed : seeder.fresh());
        G.phase = "play"; G.t = 0; G.sel = 0; G.steps = aim.steps; G.endT = 0; G.flash.fill(0); J.reset(); sync();
      },
      act: () => {
        if (G.phase === "idle") { game.start(); return; }
        if (G.phase !== "play") return;
        const n = R.plug(G.sel);
        if (n >= 0) { out.cue("hit", 0.6); sync(); if (R.done) finish(); }
      },
      stop: () => { G.phase = "idle"; J.reset(); },
      update: (dt) => {
        J.update(dt);
        tick(dt);
        if (G.phase === "end") { G.endT -= dt; if (G.endT <= 0) { G.phase = "done"; out.onEnd(R.score()); } }
      },
      draw: (ctx) => {
        ctx.fillStyle = I.night; ctx.fillRect(0, 0, K.W, K.H);
        J.begin(ctx);
        K.centre(ctx, "PEER SYNC", 4, T.banana);
        K.centre(ctx, "MUSEUM HOMAGE 2026", 14, T.stone);
        // The link line the terminals plug into.
        ctx.fillStyle = I.rule; ctx.fillRect(10, 72, K.W - 20, 2);
        for (let i = 0; i < PEERS; i++) {
          const x = BOX_X[i], on = R.online[i], behind = on && R.len[i] < R.head;
          ctx.fillStyle = G.phase === "play" && i === G.sel ? I.banana : I.stoneDk;
          ctx.fillRect(x - 2, BOX_Y - 2, BOX_W + 4, BOX_H + 4);
          ctx.fillStyle = G.flash[i] > 0 && !host.still ? I.red : !on ? I.charcoal : behind ? I.ochre : I.moss;
          ctx.fillRect(x, BOX_Y, BOX_W, BOX_H);
          K.text(ctx, NAMES[i], x + 3, BOX_Y + 3, on ? T.white : T.stone);
          K.number(ctx, R.len[i], x + BOX_W - 3, BOX_Y + 3, on ? T.white : T.stone, 1, 2);
          if (on) { ctx.fillStyle = I.gold; ctx.fillRect(x + BOX_W / 2 - 1, BOX_Y + BOX_H + 2, 2, 72 - BOX_Y - BOX_H - 2); }
          for (let k = 0; k < TARGET; k++) { ctx.fillStyle = k < R.len[i] ? I.banana : I.deep; ctx.fillRect(x + 2 + k * 4, BOX_Y + BOX_H - 7, 3, 4); }
        }
        if (G.phase === "idle") { K.centre(ctx, "PRESS START", 86, T.teal); K.centre(ctx, "KEEP 3 TERMINALS IN STEP", 98, T.bone); }
        else {
          K.text(ctx, "REC", 10, 84, T.stone); K.number(ctx, R.head, 30, 84, T.banana); K.text(ctx, "/8", 36, 84, T.stone);
          K.text(ctx, "BEAT", 98, 84, T.stone); K.number(ctx, R.beats, 150, 84, T.banana, 1, 2);
          if (G.phase !== "play") K.centre(ctx, R.won ? "IN STEP!" : "TIME UP", 100, R.won ? T.lime : T.red, 2);
          else K.centre(ctx, R.inStep() ? "ALL AGREE" : "PLUG IN THE GREY ONES", 100, R.inStep() ? T.lime : T.ember);
        }
        J.end(ctx);
      }
    };
    return game;
  };

  BL.genesisEra7Sync = { PEERS, NAMES, TARGET, BEATS, createRules, terminal, make };
})();
