// Era 4's wireless packet toy: five radio boxes on a table pass a packet hop by hop, each hop retried up to three
// times when it is lost, and the screen shows every try and whether the packet was delivered. An original toy with
// invented ranges, losses and retries: it is not the IEEE 802.11 protocol, its timing, its rates or any product.
// Wireless networking here is context for the years 1996-1999, never an asserted influence on Bitcoin.
//
// BL.genesisEra4Games.wireless = { STATIONS, LOSS, RETRIES, SESSION, create(), terminal(core, about), make(host) }
// - `create()`: the pure rules, Node-loadable, seeded (mulberry32 in a typed array): `send(from, to)`,
//   `setNoise(n)`, `power(i, on)`, `seed(n)`, `reset()`; the last packet's hops on `core.log` (fixed arrays).
// - `terminal(core, about)`: a museum terminal for the era file, usable today.
// - `make(host)`: the retro-games.js factory interface, drawn with BL.retroGames.kit (read when called).
(() => {
  "use strict";
  const BL = window.BL = window.BL || {};
  const G = BL.genesisEra4Games = BL.genesisEra4Games || {};
  // The boxes on the toy's table, in its own units, and the reach of each radio (invented).
  const STATIONS = [{ id: "A", x: 10, y: 45 }, { id: "B", x: 42, y: 22 }, { id: "C", x: 44, y: 72 }, { id: "D", x: 80, y: 45 }, { id: "E", x: 118, y: 52 }];
  const RANGE = 45, N = STATIONS.length, NAMES = "ABCDE";
  // The chance a try is lost at each noise level, the retries a hop may make and the packets a session may send.
  const LOSS = [0.05, 0.25, 0.45, 0.65], RETRIES = 3, SESSION = 20, MAX_HOPS = N - 1;
  const link = new Uint8Array(N * N);
  for (let i = 0; i < N; i++) for (let k = 0; k < N; k++) link[i * N + k] = i !== k && Math.hypot(STATIONS[i].x - STATIONS[k].x, STATIONS[i].y - STATIONS[k].y) <= RANGE ? 1 : 0;
  const create = () => {
    const rs = new Uint32Array(1), on = new Uint8Array(N), prev = new Int8Array(N), queue = new Int8Array(N), path = new Int8Array(N);
    const log = { hops: 0, from: new Int8Array(MAX_HOPS), to: new Int8Array(MAX_HOPS), tries: new Uint8Array(MAX_HOPS), ok: new Uint8Array(MAX_HOPS) };
    const s = { noise: 1, sent: 0, delivered: 0, failed: 0, retries: 0, last: "none", seed: 1 };
    const rand = () => {
      rs[0] += 0x6d2b79f5;
      let t = rs[0];
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
    const seed = (n) => { s.seed = n >>> 0; rs[0] = s.seed; };
    const reset = () => { on.fill(1); s.noise = 1; s.sent = s.delivered = s.failed = s.retries = 0; s.last = "none"; log.hops = 0; seed(s.seed); };
    // The shortest route over boxes that are switched on, into `path`; returns its length in boxes, 0 if none.
    const route = (from, to) => {
      prev.fill(-1);
      let head = 0, tail = 0;
      queue[tail++] = from; prev[from] = from;
      while (head < tail) {
        const c = queue[head++];
        if (c === to) break;
        for (let k = 0; k < N; k++) if (on[k] && link[c * N + k] && prev[k] < 0) { prev[k] = c; queue[tail++] = k; }
      }
      if (prev[to] < 0) return 0;
      let n = 0;
      for (let c = to; ; c = prev[c]) { path[n++] = c; if (c === from) break; }
      for (let i = 0; i < n >> 1; i++) { const t = path[i]; path[i] = path[n - 1 - i]; path[n - 1 - i] = t; }
      return n;
    };
    // One packet: "full" (the session's packets are spent), "off" (an end is switched off), "same", "noroute",
    // "delivered" or "lost" (a hop ran out of retries; `log` says where).
    const send = (from, to) => {
      if (s.sent >= SESSION) return "full";
      if (from === to) return "same";
      if (!on[from] || !on[to]) return "off";
      log.hops = 0;
      const n = route(from, to);
      if (!n) { s.last = "noroute"; return "noroute"; }
      s.sent++;
      for (let i = 0; i + 1 < n; i++) {
        const h = log.hops++;
        log.from[h] = path[i]; log.to[h] = path[i + 1]; log.tries[h] = 0; log.ok[h] = 0;
        while (log.tries[h] <= RETRIES) {
          log.tries[h]++;
          if (rand() >= LOSS[s.noise]) { log.ok[h] = 1; break; }
        }
        s.retries += log.tries[h] - 1;
        if (!log.ok[h]) { s.failed++; s.last = "lost"; return "lost"; }
      }
      s.delivered++; s.last = "delivered";
      return "delivered";
    };
    const setNoise = (n) => { s.noise = n; };
    const power = (i, v) => { on[i] = v ? 1 : 0; };
    seed(1); reset();
    return { s, on, log, send, setNoise, power, seed, reset, route: (a, b) => route(a, b), path };
  };

  // ---- the terminal ---------------------------------------------------------------------------------------
  const reply = (...lines) => ({ lines });
  const HELP = ["SEND <from> <to> | NOISE <0..3> | OFF <box> | ON <box> | MAP | STATS | RESET", "Boxes are A to E. Example: SEND A E."];
  const terminal = (core, about = []) => {
    const s = core.s, idx = (c) => c && c.length === 1 ? NAMES.indexOf(c) : -1;
    const map = () => {
      const lines = ["Boxes and who can hear whom (invented ranges):"];
      for (let i = 0; i < N; i++) {
        let hears = "";
        for (let k = 0; k < N; k++) if (link[i * N + k]) hears += (hears ? " " : "") + NAMES[k];
        lines.push(`${NAMES[i]} ${core.on[i] ? "ON " : "OFF"}  hears ${hears}`);
      }
      lines.push(`Noise ${s.noise}: each try is lost ${Math.round(LOSS[s.noise] * 100)}% of the time; a hop retries up to ${RETRIES} times.`);
      return lines;
    };
    const stats = () => `Packets ${s.sent}/${SESSION}: ${s.delivered} delivered, ${s.failed} lost, ${s.retries} retries.`;
    return {
      banner: ["HOW TO USE", "  1. Type MAP to see the five boxes and who can hear whom.", "  2. Type SEND A E: watch each hop, its retries and the result.",
        "  3. Type NOISE 3 and send again: more tries are lost.", "  4. Type OFF C and send again: the packet finds another route, or none.", "",
        ...about, "TOY MODEL: invented ranges, losses and retries; not the 802.11 protocol, its timing or its rates.", ...HELP],
      prompt: "RADIO>",
      run(line) {
        const parts = String(line).replace(/[\u0000-\u001f\u007f]/g, "").trim().toUpperCase().slice(0, 24).split(/\s+/), cmd = parts[0];
        if (cmd === "HELP") return reply(...HELP);
        if (cmd === "MORE") return reply(...about, "Retrying a lost hop is a general networking idea shown with invented numbers; it says nothing about Bitcoin.");
        if (cmd === "MAP" || cmd === "") return { lines: map() };
        if (cmd === "STATS") return reply(stats());
        if (cmd === "RESET") { core.reset(); return { lines: ["All boxes on, noise 1, a fresh session.", ...map()], reset: true }; }
        if (cmd === "NOISE") {
          if (!/^[0-3]$/.test(parts[1] || "")) return reply("Choose NOISE 0, 1, 2 or 3.");
          core.setNoise(Number(parts[1])); return reply(`Noise ${parts[1]}: each try is lost ${Math.round(LOSS[s.noise] * 100)}% of the time.`);
        }
        if (cmd === "OFF" || cmd === "ON") {
          const i = idx(parts[1]);
          if (i < 0) return reply("Name a box, A to E: OFF C.");
          core.power(i, cmd === "ON"); return reply(`Box ${parts[1]} switched ${cmd.toLowerCase()}.`);
        }
        if (cmd === "SEND") {
          const a = idx(parts[1]), b = idx(parts[2]);
          if (a < 0 || b < 0) return reply("Use SEND A E (boxes A to E).");
          const r = core.send(a, b);
          if (r === "full") return reply(`This session's ${SESSION} packets are sent. RESET for another session.`, stats());
          if (r === "same") return reply("Choose two different boxes.");
          if (r === "off") return reply("One end is switched off. Type ON and its letter first.");
          if (r === "noroute") return reply(`No route from ${parts[1]} to ${parts[2]}: no chain of switched-on boxes reaches.`);
          const lines = [];
          for (let h = 0; h < core.log.hops; h++) {
            const t = core.log.tries[h];
            lines.push(`${NAMES[core.log.from[h]]} -> ${NAMES[core.log.to[h]]}: ${core.log.ok[h] ? `delivered on try ${t}` : `lost ${t} times, gave up`}${t > 1 ? ` (${t - 1} retr${t === 2 ? "y" : "ies"})` : ""}`);
          }
          lines.push(r === "delivered" ? `DELIVERED in ${core.log.hops} hop${core.log.hops === 1 ? "" : "s"}.` : "LOST: a hop ran out of retries.", stats());
          return { lines };
        }
        return reply("Unknown command.", ...HELP);
      }
    };
  };

  // ---- the console (retro-games.js's factory interface) ---------------------------------------------------------
  // Space sends a packet from A to E; left and right switch one middle box off in turn (none, B, C, D); up and down
  // set the noise. A session is ten packets; each delivered packet scores 100 less 10 a retry.
  const make = (host) => {
    const K = BL.retroGames.kit, { W, H, INK, TEXT } = K, h = K.hooks(host), core = create(), s = core.s, status = K.makeStatus("Packets");
    const PACKETS = 10, OFFS = [-1, 1, 2, 3], SX = new Float32Array(N), SY = new Float32Array(N);
    for (let i = 0; i < N; i++) { SX[i] = 12 + STATIONS[i].x; SY[i] = 14 + STATIONS[i].y * 0.9; }
    const run = { playing: false, steps: 0, stepsY: 0, off: 0, sent: 0, anim: -1, endIn: -1, ended: false, result: 0 };
    const tick = K.stepper((dt) => {
      if (run.anim >= 0) { run.anim += dt * (host.still ? 99 : 2.5); if (run.anim > core.log.hops) run.anim = -1; }
      if (run.endIn >= 0) { run.endIn -= dt; if (run.endIn < 0 && !run.ended) { run.ended = true; run.playing = false; h.onEnd(status.score); } }
    });
    const applyOff = () => { for (let i = 1; i < N - 1; i++) core.power(i, i !== OFFS[run.off]); };
    return {
      kind: "e4-wireless", name: "Wireless packet toy", aims: true, status,
      help: "Space sends a packet from A to E. Left and right switch a middle box off. Up and down change the noise.",
      coach: ["Space sends · left and right switch a box off · up and down noise", "Tap to send · drag across to switch a box off"],
      stars: [300, 600, 850],
      tickets: (score) => Math.floor(score / 150),
      get playing() { return run.playing; },
      start(seed) {
        core.seed(seed); core.reset();
        run.playing = true; run.off = 0; run.sent = 0; run.anim = -1; run.endIn = -1; run.ended = false; run.result = 0;
        run.steps = h.aim.steps; run.stepsY = h.aim.stepsY; applyOff();
        status.score = 0; status.left = PACKETS; status.round = 1; status.verb = "SEND";
      },
      act() {
        if (!run.playing || run.endIn >= 0 || run.anim >= 0) return;
        const r = core.send(0, N - 1);
        run.sent++; status.left = PACKETS - run.sent;
        if (r === "delivered") { run.result = 1; let tries = 0; for (let k = 0; k < core.log.hops; k++) tries += core.log.tries[k] - 1; status.score += Math.max(10, 100 - 10 * tries); h.cue("score", 0.5); }
        else { run.result = 2; h.flop(); h.cue("miss", 0.5); }
        run.anim = 0;
        if (run.sent >= PACKETS) { h.over(); run.endIn = 1.8; }
      },
      stop() { run.playing = false; run.endIn = -1; run.anim = -1; },
      update(dt) {
        tick(dt);
        const dx = h.aim.steps - run.steps, dy = h.aim.stepsY - run.stepsY;
        run.steps = h.aim.steps; run.stepsY = h.aim.stepsY;
        if (!run.playing || run.endIn >= 0) return;
        if (dx) { run.off = (run.off + (dx > 0 ? 1 : OFFS.length - 1)) % OFFS.length; applyOff(); }
        if (dy) core.setNoise(Math.max(0, Math.min(3, s.noise + (dy > 0 ? -1 : 1))));
      },
      draw(ctx) {
        ctx.fillStyle = INK.night; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = INK.band; ctx.fillRect(0, 0, W, 9);
        K.text(ctx, "PACKET TOY", 2, 1, TEXT.sky);
        K.text(ctx, "NOISE", 84, 1, TEXT.stone);
        K.number(ctx, s.noise, 118, 1, TEXT.banana);
        K.number(ctx, status.score, W - 2, 1, TEXT.banana, 1, 2);
        // Links between boxes that are both on, the last packet's hops over them, then the boxes.
        ctx.fillStyle = INK.rule;
        for (let i = 0; i < N; i++) for (let k = i + 1; k < N; k++) if (link[i * N + k] && core.on[i] && core.on[k]) {
          for (let t = 0; t <= 16; t++) ctx.fillRect(Math.round(SX[i] + (SX[k] - SX[i]) * t / 16), Math.round(SY[i] + (SY[k] - SY[i]) * t / 16), 1, 1);
        }
        const shown = run.anim >= 0 ? Math.floor(run.anim) : core.log.hops;
        for (let hgt = 0; hgt < core.log.hops && hgt < shown + 1; hgt++) {
          const a = core.log.from[hgt], b = core.log.to[hgt], part = hgt < shown ? 1 : run.anim - hgt;
          ctx.fillStyle = core.log.ok[hgt] ? INK.lime : INK.red;
          for (let t = 0; t <= 16 * part; t++) ctx.fillRect(Math.round(SX[a] + (SX[b] - SX[a]) * t / 16) - 1, Math.round(SY[a] + (SY[b] - SY[a]) * t / 16) - 1, 2, 2);
          if (hgt < shown) K.number(ctx, core.log.tries[hgt], Math.round((SX[a] + SX[b]) / 2) + 3, Math.round((SY[a] + SY[b]) / 2) - 9, core.log.ok[hgt] ? TEXT.lime : TEXT.red);
        }
        for (let i = 0; i < N; i++) {
          ctx.fillStyle = core.on[i] ? INK.teal : INK.stoneDk;
          ctx.fillRect(SX[i] - 4, SY[i] - 4, 9, 9);
          K.text(ctx, NAMES[i], SX[i] - 2, SY[i] - 3, TEXT.night);
        }
        ctx.fillStyle = INK.band; ctx.fillRect(0, H - 10, W, 10);
        if (!run.playing && !run.ended) K.centre(ctx, "PRESS START", H - 9, TEXT.banana);
        else if (run.anim < 0 && run.result === 1) K.centre(ctx, "DELIVERED - TRIES SHOWN", H - 9, TEXT.lime);
        else if (run.anim < 0 && run.result === 2) K.centre(ctx, "LOST - OUT OF RETRIES", H - 9, TEXT.red);
        else K.centre(ctx, "SPACE SENDS A TO E", H - 9, TEXT.bone);
      }
    };
  };
  G.wireless = { STATIONS, RANGE, LOSS, RETRIES, SESSION, create, terminal, make };
})();
