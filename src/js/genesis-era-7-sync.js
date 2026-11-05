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
  // starts a run when idle. A beat passes every BEAT_S seconds of play. Everything below the rules is look and feel:
  // each terminal is a little monitor on a stand whose cable runs down to the shared link line; a new record runs
  // along the line as a pulse from its maker, a dropped link swings its cable loose, a broken record knocks at the
  // line's far end and is turned away, and a terminal plugged back in throws sparks and counts what it copied. The
  // effects use only the kit's text, numbers, juice and fixed step (plus a small spark pool of their own), and hold
  // still under the visitor's reduced motion (`host.still`).
  const BEAT_S = 1.1, END_S = 1.6, SPARKS = 32, SAY_S = 0.9;
  const LINE_Y = 72, LINE_X0 = 10, LINE_X1 = 150;
  // What the foot line says after an event: 1 a record, 2 a drop, 3 a refusal, 5 a terminal caught up.
  const SAID = ["", "NEW RECORD SHARED", "A LINK DROPPED", "BROKEN RECORD REFUSED", "", "CAUGHT UP"];
  const COPIED = ["+0", "+1", "+2", "+3", "+4", "+5", "+6", "+7", "+8"];
  const make = (host) => {
    const K = BL.retroGames.kit, out = K.hooks(host), aim = out.aim, status = K.makeStatus("Beats");
    const R = createRules(), J = K.juice(host), I = K.INK, T = K.TEXT, seeder = K.rng();
    const G = { phase: "idle", t: 0, sel: 0, steps: 0, endT: 0, flash: new Float32Array(PEERS), glow: new Float32Array(PEERS), plugged: new Float32Array(PEERS),
      clock: 0, pulse: 0, pulseX: 0, knock: 0, say: 0, said: 0, win: 0 };
    // Sparks: a fixed pool, two inks (a terminal's colour and white), thrown from a point and falling.
    const P = { x: new Float32Array(SPARKS), y: new Float32Array(SPARKS), vx: new Float32Array(SPARKS), vy: new Float32Array(SPARKS), life: new Float32Array(SPARKS), ink: new Uint8Array(SPARKS), next: 0, live: 0 };
    const SPARK_INK = [I.banana, I.white, I.lime, I.red];
    const burst = (x, y, n, ink) => {
      if (host.still) return;
      for (let k = 0; k < n; k++) {
        const i = P.next; P.next = (P.next + 1) % SPARKS;
        if (P.life[i] <= 0) P.live++;
        const a = Math.random() * Math.PI * 2, v = 18 + Math.random() * 30;
        P.x[i] = x; P.y[i] = y; P.vx[i] = Math.cos(a) * v; P.vy[i] = Math.sin(a) * v - 20; P.life[i] = 0.35 + Math.random() * 0.3; P.ink[i] = k & 1 ? 1 : ink;
      }
    };
    const BOX_X = [12, 62, 112], BOX_Y = 34, BOX_W = 36, BOX_H = 28;
    const mid = (i) => BOX_X[i] + BOX_W / 2;
    const sync = () => { status.score = R.score(); status.left = BEATS - R.beats; status.round = R.head; status.target = TARGET; status.note = R.inStep() ? "In step" : "Out of step"; };
    const tell = (k) => { G.said = k; G.say = SAY_S; };
    const finish = () => {
      G.phase = "end"; G.endT = END_S; out.cue(R.won ? "win" : "lose", 0.8); out.over();
      if (R.won) { out.crack(true); G.win = 1; J.flash(I.lime, 0.4); for (let i = 0; i < PEERS; i++) burst(mid(i), BOX_Y, 8, 2); }
      else { out.flop(); J.flash(I.red, 0.3); }
    };
    const step = (dt) => {
      if (G.phase !== "play") return;
      const d = aim.steps - G.steps;
      if (d) { G.steps = aim.steps; G.sel = ((G.sel + d) % PEERS + PEERS) % PEERS; }
      G.t += dt;
      if (G.t >= BEAT_S) {
        G.t -= BEAT_S;
        const e = R.beat();
        if (e === 2) { G.flash[R.by] = 0.6; out.cue("miss", 0.5); J.shake(1); tell(2); burst(mid(R.by), LINE_Y, 6, 3); }
        else if (e === 1) { out.cue("tick", 0.4); G.pulse = 1; G.pulseX = mid(R.by); G.glow[R.by] = 0.5; tell(1); }
        else if (e === 3) { G.knock = 0.8; tell(3); }
        sync();
        if (R.done) finish();
      }
      for (let i = 0; i < PEERS; i++) {
        if (G.flash[i] > 0) G.flash[i] = Math.max(0, G.flash[i] - dt);
        if (G.glow[i] > 0) G.glow[i] = Math.max(0, G.glow[i] - dt);
        if (G.plugged[i] > 0) G.plugged[i] = Math.max(0, G.plugged[i] - dt);
      }
      if (G.pulse > 0) G.pulse = Math.max(0, G.pulse - dt * 1.6);
      if (G.knock > 0) G.knock = Math.max(0, G.knock - dt);
      if (G.say > 0) G.say = Math.max(0, G.say - dt);
    };
    const tick = K.stepper(step);
    const resetFx = () => { G.flash.fill(0); G.glow.fill(0); G.plugged.fill(0); G.pulse = G.knock = G.say = G.said = G.win = 0; P.life.fill(0); P.live = 0; };
    // The pixels of one terminal: stand, bezel, screen with scanlines, name, record count and its chain of records.
    const drawPeer = (ctx, i) => {
      const x = BOX_X[i], on = R.online[i] === 1, behind = on && R.len[i] < R.head, chosen = G.phase === "play" && i === G.sel;
      const live = !host.still, blink = live && ((G.clock * 4) | 0) % 2 === 0;
      // The stand and its cable down to the line: plugged, a straight gold run with a plug seated in a socket; loose,
      // a short cable swinging beside the socket.
      ctx.fillStyle = I.stoneDk; ctx.fillRect(x + BOX_W / 2 - 4, BOX_Y + BOX_H + 2, 8, 2);
      ctx.fillStyle = I.band; ctx.fillRect(mid(i) - 3, LINE_Y - 1, 6, 4);
      if (on) {
        ctx.fillStyle = G.plugged[i] > 0 && blink ? I.white : I.gold; ctx.fillRect(mid(i) - 1, BOX_Y + BOX_H + 4, 2, LINE_Y - BOX_Y - BOX_H - 5);
        ctx.fillStyle = I.ochre; ctx.fillRect(mid(i) - 2, LINE_Y - 3, 4, 3);
      } else {
        const sway = live ? Math.round(Math.sin(G.clock * 3 + i) * 2) : 0;
        ctx.fillStyle = I.husk; ctx.fillRect(mid(i) - 1, BOX_Y + BOX_H + 4, 2, 3); ctx.fillRect(mid(i) + sway - 1, BOX_Y + BOX_H + 7, 2, 2);
        ctx.fillStyle = I.ochre; ctx.fillRect(mid(i) + sway * 2 - 2, BOX_Y + BOX_H + 9, 4, 3);
      }
      // Bezel (banana while chosen), then the screen.
      ctx.fillStyle = chosen ? I.banana : I.stoneDk; ctx.fillRect(x - 2, BOX_Y - 2, BOX_W + 4, BOX_H + 4);
      ctx.fillStyle = I.band; ctx.fillRect(x - 1, BOX_Y - 1, BOX_W + 2, BOX_H + 2);
      ctx.fillStyle = G.flash[i] > 0 && live ? I.red : G.win && blink ? I.lime : !on ? I.charcoal : G.glow[i] > 0 && blink ? I.leaf : behind ? I.ochre : I.moss;
      ctx.fillRect(x, BOX_Y, BOX_W, BOX_H);
      ctx.fillStyle = I.band; ctx.globalAlpha = 0.25;
      for (let y = BOX_Y + 2; y < BOX_Y + BOX_H; y += 3) ctx.fillRect(x, y, BOX_W, 1);
      ctx.globalAlpha = 1;
      K.text(ctx, NAMES[i], x + 3, BOX_Y + 3, on ? T.white : T.stone);
      K.number(ctx, R.len[i], x + BOX_W - 3, BOX_Y + 3, on ? T.white : T.stone, 1, 2);
      if (!on) K.text(ctx, "OFF", x + 9, BOX_Y + 12, blink ? T.red : T.stone);
      else if (behind) K.text(ctx, "BEHIND", x + 1, BOX_Y + 12, T.night);
      // The records as a chain: blocks with a link between each.
      for (let k = 0; k < TARGET; k++) {
        const bx = x + 2 + k * 4, have = k < R.len[i];
        ctx.fillStyle = have ? I.banana : I.deep; ctx.fillRect(bx, BOX_Y + BOX_H - 7, 3, 4);
        if (have && k > 0) { ctx.fillStyle = I.gold; ctx.fillRect(bx - 1, BOX_Y + BOX_H - 6, 1, 2); }
      }
      // A down arrow over the chosen terminal.
      if (chosen && (blink || host.still)) { ctx.fillStyle = I.banana; ctx.fillRect(mid(i) - 3, BOX_Y - 8, 7, 1); ctx.fillRect(mid(i) - 2, BOX_Y - 7, 5, 1); ctx.fillRect(mid(i) - 1, BOX_Y - 6, 3, 1); ctx.fillRect(mid(i), BOX_Y - 5, 1, 1); }
    };
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
        G.phase = "play"; G.t = 0; G.sel = 0; G.steps = aim.steps; G.endT = 0; resetFx(); J.reset(); sync();
      },
      act: () => {
        if (G.phase === "idle") { game.start(); return; }
        if (G.phase !== "play") return;
        const i = G.sel, n = R.plug(i);
        if (n >= 0) {
          out.cue("hit", 0.6); G.plugged[i] = 0.5; burst(mid(i), LINE_Y - 2, 8, 0);
          if (n > 0) { out.popup(COPIED[n] || COPIED[TARGET], false); tell(5); }
          sync(); if (R.done) finish();
        }
      },
      stop: () => { G.phase = "idle"; resetFx(); J.reset(); },
      update: (dt) => {
        J.update(dt);
        if (!host.still) G.clock += dt;
        tick(dt);
        if (P.live) for (let i = 0; i < SPARKS; i++) {
          if (P.life[i] <= 0) continue;
          if ((P.life[i] -= dt) <= 0) { P.live--; continue; }
          P.vy[i] += 90 * dt; P.x[i] += P.vx[i] * dt; P.y[i] += P.vy[i] * dt;
        }
        if (G.phase === "end") { G.endT -= dt; if (G.endT <= 0) { G.phase = "done"; out.onEnd(R.score()); } }
      },
      draw: (ctx) => {
        ctx.fillStyle = I.night; ctx.fillRect(0, 0, K.W, K.H);
        J.begin(ctx);
        // A title band and a faint floor under the line.
        ctx.fillStyle = I.deep; ctx.fillRect(0, 0, K.W, 22);
        ctx.fillStyle = I.rule; ctx.fillRect(0, 22, K.W, 1);
        K.centre(ctx, "PEER SYNC", 4, T.banana);
        K.centre(ctx, "MUSEUM HOMAGE 2026", 14, T.stone);
        // The link line, with a socket at each end, and a record's pulse running both ways from its maker.
        ctx.fillStyle = I.rule; ctx.fillRect(LINE_X0, LINE_Y, LINE_X1 - LINE_X0, 2);
        ctx.fillStyle = I.stoneDk; ctx.fillRect(LINE_X0 - 2, LINE_Y - 1, 2, 4); ctx.fillRect(LINE_X1, LINE_Y - 1, 2, 4);
        if (G.pulse > 0 && !host.still) {
          const reach = (1 - G.pulse) * 140;
          ctx.fillStyle = I.banana;
          const a = G.pulseX - reach, b = G.pulseX + reach;
          if (a >= LINE_X0) ctx.fillRect(a - 2, LINE_Y, 4, 2);
          if (b <= LINE_X1) ctx.fillRect(b - 2, LINE_Y, 4, 2);
        }
        // A broken record knocking at the far end of the line: a grey box crossed out in red.
        if (G.knock > 0) {
          ctx.fillStyle = I.stone; ctx.fillRect(LINE_X1 + 2, LINE_Y - 4, 6, 6);
          ctx.fillStyle = I.red;
          for (let k = 0; k < 6; k++) { ctx.fillRect(LINE_X1 + 2 + k, LINE_Y - 4 + k, 1, 1); ctx.fillRect(LINE_X1 + 7 - k, LINE_Y - 4 + k, 1, 1); }
        }
        for (let i = 0; i < PEERS; i++) drawPeer(ctx, i);
        if (P.live) for (let k = 0; k < SPARK_INK.length; k++) {
          ctx.fillStyle = SPARK_INK[k];
          for (let i = 0; i < SPARKS; i++) if (P.life[i] > 0 && P.ink[i] === k) ctx.fillRect(Math.round(P.x[i]), Math.round(P.y[i]), P.life[i] > 0.3 ? 2 : 1, P.life[i] > 0.3 ? 2 : 1);
        }
        if (G.phase === "idle") {
          K.centre(ctx, "PRESS START", 86, host.still || ((G.clock * 2) | 0) % 2 === 0 ? T.teal : T.stone);
          K.centre(ctx, "KEEP 3 TERMINALS IN STEP", 98, T.bone);
        } else {
          K.text(ctx, "REC", 10, 84, T.stone); K.number(ctx, R.head, 30, 84, T.banana); K.text(ctx, "/8", 36, 84, T.stone);
          K.text(ctx, "BEAT", 98, 84, T.stone); K.number(ctx, R.beats, 150, 84, T.banana, 1, 2);
          // Time to the next beat, and the beats left as a thin strip.
          if (G.phase === "play") {
            ctx.fillStyle = I.deep; ctx.fillRect(10, 93, 140, 2);
            ctx.fillStyle = BEATS - R.beats <= 8 ? I.ember : I.teal; ctx.fillRect(10, 93, Math.round(140 * G.t / BEAT_S), 2);
          }
          if (G.phase !== "play") K.centre(ctx, R.won ? "IN STEP!" : "TIME UP", 100, R.won ? T.lime : T.red, 2);
          else if (G.say > 0) K.centre(ctx, SAID[G.said], 100, G.said === 2 || G.said === 3 ? T.red : G.said === 5 ? T.lime : T.banana);
          else K.centre(ctx, R.inStep() ? "ALL AGREE" : "PLUG IN THE GREY ONES", 100, R.inStep() ? T.lime : T.ember);
        }
        J.end(ctx);
      }
    };
    return game;
  };
  BL.genesisEra7Sync = { PEERS, NAMES, TARGET, BEATS, createRules, terminal, make };
})();
