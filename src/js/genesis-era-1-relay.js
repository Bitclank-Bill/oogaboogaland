// Era 1's relay cabinet: a modern museum toy and its console game, not historical software and no real machine. A
// message leaves HOST A in numbered packets, one letter each, and reaches HOST B through one of three gateways; links
// beyond a gateway go down now and then, a packet sent into a dead link is lost, and HOST B puts what arrives back in
// number order. The idea it plays with, numbered packets that can be asked for again and reassembled, is the 1974
// gateway paper's the gallery shows (genesis-era-1.js); the cabinet's look, its commands and the game are the museum's.
//
// Two faces share one small core (`create`):
//   create()                  the cabinet: `route` 0..2 (the lit lane), `down` (a lane taken down, -1 none), `sent`.
//   terminal(cab, onChange)   the terminal shape the workbench opens (ROUTE, FAIL, FIX, SEND, RULES, INFO, RESET).
//   make(host)                PACKET RELAY, a console game on retro-games.js's factory interface (see its header).
(() => {
  "use strict";
  const BL = window.BL = window.BL || {};
  const LANES = 3;
  const create = () => ({ route: 0, down: -1, sent: 0, lost: 0 });
  const integer = (word, lo, hi) => /^\d+$/.test(word || "") && Number(word) >= lo && Number(word) <= hi ? Number(word) : -1;
  const terminal = (cab, onChange) => {
    const help = ["ROUTE 1..3 | FAIL 1..3 | FIX | SEND | STATUS | RULES | INFO | RESET"];
    const show = () => `Route: gateway G${cab.route + 1}. ${cab.down < 0 ? "Every link is up." : `The link beyond G${cab.down + 1} is down.`} Sent ${cab.sent}, lost ${cab.lost}.`;
    return {
      banner: ["Relay cabinet: a modern museum toy, not a real machine. Type HELP; RESET starts again.", ...help], prompt: "RELAY>",
      run(line) {
        const words = String(line).trim().slice(0, 96).toUpperCase().split(/\s+/), cmd = words[0];
        if (cmd === "HELP" || !cmd) return { lines: help };
        if (cmd === "INFO" || cmd === "MORE") return { lines: ["The 1974 gateway paper in this gallery described messages crossing different networks in numbered pieces, so the far end can ask again for a lost piece and put the rest in order.", "This cabinet and its game are invented for the museum to play with that idea; they are not a model of any real network or machine."] };
        if (cmd === "RULES") return { lines: ["PACKET RELAY on the console: W and S (or the arrows) pick the gateway new packets take.", "A link beyond a gateway blinks amber before it goes down. A packet sent into a dead link is lost: press Space to send it again before its clock runs out.", "Deliver all eight messages to win; three packets left lost end the run."] };
        if (cmd === "STATUS") return { lines: [show()] };
        if (cmd === "RESET") { Object.assign(cab, create()); onChange(cab); return { lines: ["Cabinet reset.", show()] }; }
        if (cmd === "FIX") { cab.down = -1; onChange(cab); return { lines: ["Every link is back up.", show()] }; }
        if (cmd === "ROUTE" || cmd === "FAIL") {
          const n = words.length === 2 ? integer(words[1], 1, LANES) : -1;
          if (n < 0) return { lines: [`${cmd} needs a gateway from 1 to ${LANES}.`] };
          if (cmd === "ROUTE") cab.route = n - 1; else cab.down = n - 1;
          onChange(cab); return { lines: [show()] };
        }
        if (cmd === "SEND") {
          const lost = cab.route === cab.down;
          if (lost) cab.lost++; else cab.sent++;
          onChange(cab);
          return { lines: [lost ? `The packet reaches G${cab.route + 1}, but the link beyond it is down: lost. ROUTE another gateway, or FIX.` : `Delivered through G${cab.route + 1}.`, show()] };
        }
        return { lines: ["Use ROUTE, FAIL, FIX, SEND, STATUS, RULES or INFO."] };
      }
    };
  };

  // ---- PACKET RELAY: the console game --------------------------------------------------------------------------------
  // Eight messages, one after another; each leaves HOST A a letter a packet, in a seeded shuffled order, on the lane the
  // switch points to as it leaves. Links fail in turn (a warning first); a packet reaching its gateway while the link
  // beyond is down falls away and waits as missing, with a clock: Space sends the oldest missing packet again on the
  // current route; a resent packet's clock keeps running on the wire, so only a working route saves it. A clock run out costs one of three lives (and the packet is sent again by itself). A message is
  // done when every number has arrived; HOST B shows it in order. Faster packets and more failures message by message.
  const MESSAGES = ["OOGA", "LINKS", "HOSTS", "PACKET", "GATEWAY", "NETWORK", "SIGNALS", "MESSAGE"];
  const MAXF = 8, POOL = 16, LIVES = 3, WAIT_S = 4, END_S = 1.4, DONE_S = 1.1;
  const LANE_Y = [36, 58, 80], A_X = 22, GATE_X = 74, B_X = 136;
  // One letter string per character code (load time), so a frame never builds one.
  const CH = [];
  for (let c = 0; c < 128; c++) CH[c] = c >= 32 && c < 127 ? String.fromCharCode(c) : "?";
  const GATE_NAME = ["G1", "G2", "G3"];
  const make = (host) => {
    const K = BL.retroGames.kit, out = K.hooks(host), aim = out.aim, J = K.juice(host), status = K.makeStatus("Messages"), rng = K.rng();
    const { W, H, INK, TEXT, text, centre, number } = K;
    const sparks = K.sparks(64, [INK.teal, INK.lime, INK.white, INK.red, INK.ember]);
    // Packets: x along the wire, lane, which fragment, state (0 free, 1 flying, 2 falling away), the fall's time.
    const px = new Float32Array(POOL), py = new Float32Array(POOL), pl = new Uint8Array(POOL), pf = new Uint8Array(POOL), ps = new Uint8Array(POOL);
    // Fragments of the message: 0 waiting to leave, 1 on the wire, 2 missing (its clock), 3 arrived.
    const fs = new Uint8Array(MAXF), ft = new Float32Array(MAXF), order = new Uint8Array(MAXF);
    // Links: 0 up, 1 warning, 2 down; each with its timer; `gateGlow` flashes a gateway as a packet passes.
    const link = new Uint8Array(LANES), linkT = new Float32Array(LANES), gateGlow = new Float32Array(LANES);
    const S = { phase: "idle", lane: 0, steps: 0, stepsY: 0, msg: 0, len: 0, next: 0, spawnT: 0, failT: 0, lives: LIVES, losses: 0,
      t: 0, end: 0, ended: 0, done: 0, hit: 0, word: "", seed: 1 };
    const plus = K.worded("+"), score = (n) => { status.score += n; out.popup(plus(n), n >= 20); };
    const speed = () => 30 + S.msg * 4;
    const finish = (won) => {
      S.phase = "end"; S.end = END_S; status.verb = won ? "ALL DELIVERED" : "LINE DEAD"; status.meter = -1;
      if (won) out.crack(true); else out.flop();
      out.cue(won ? "win" : "lose", 0.6); out.over();
    };
    const begin = (m) => {
      S.msg = m; S.word = MESSAGES[m]; S.len = S.word.length; S.next = 0; S.spawnT = 0.6; S.losses = 0; S.done = 0;
      for (let i = 0; i < MAXF; i++) { fs[i] = i < S.len ? 0 : 3; ft[i] = 0; order[i] = i; }
      for (let i = S.len - 1; i > 0; i--) { const j = rng.int(i + 1), t = order[i]; order[i] = order[j]; order[j] = t; }
      status.round = m + 1; status.left = MESSAGES.length - m;
    };
    const launch = (f) => {
      for (let i = 0; i < POOL; i++) {
        if (ps[i]) continue;
        ps[i] = 1; px[i] = A_X; py[i] = LANE_Y[S.lane]; pl[i] = S.lane; pf[i] = f; fs[f] = 1;
        return true;
      }
      return false;
    };
    // The oldest missing fragment (the one whose clock is lowest), or -1.
    const oldest = () => { let k = -1; for (let i = 0; i < S.len; i++) if (fs[i] === 2 && (k < 0 || ft[i] < ft[k])) k = i; return k; };
    const failing = () => { let n = 0; for (let l = 0; l < LANES; l++) if (link[l]) n++; return n; };
    const step = (dt) => {
      if (S.phase === "end") { if (!S.ended && (S.end -= dt) <= 0) { S.ended = 1; out.onEnd(status.score); } return; }
      if (S.phase !== "play") return;
      S.t += dt; S.hit = Math.max(0, S.hit - dt);
      for (let l = 0; l < LANES; l++) gateGlow[l] = Math.max(0, gateGlow[l] - dt * 3);
      if (S.done > 0) { if ((S.done -= dt) <= 0) { if (S.msg + 1 >= MESSAGES.length) { finish(true); return; } begin(S.msg + 1); } return; }
      // Links: a warning, then down, then up again; a new failure every few seconds, more at once later on.
      for (let l = 0; l < LANES; l++) {
        if (!link[l] || (linkT[l] -= dt) > 0) continue;
        if (link[l] === 1) { link[l] = 2; linkT[l] = rng.range(4.2, 5.8) + S.msg * 0.15; out.cue("bump", 0.3); }
        else link[l] = 0;
      }
      if ((S.failT -= dt) <= 0) {
        S.failT = rng.range(2.4, 4.6) - S.msg * 0.18;
        if (failing() < (S.msg >= 4 ? 2 : 1)) { let l = rng.int(LANES); while (link[l]) l = (l + 1) % LANES; link[l] = 1; linkT[l] = 1.6; }
      }
      // Launch the next waiting fragment, in the message's shuffled order.
      if ((S.spawnT -= dt) <= 0 && S.next < S.len) { if (launch(order[S.next])) { S.next++; S.spawnT = Math.max(0.55, 1.25 - S.msg * 0.08); out.cue("tap", 0.25); } }
      const v = speed();
      for (let i = 0; i < POOL; i++) {
        if (ps[i] === 2) { py[i] += dt * 46; px[i] += dt * 10; if (py[i] > 100) ps[i] = 0; continue; }
        if (ps[i] !== 1) continue;
        const was = px[i];
        px[i] += v * dt;
        if (was < GATE_X && px[i] >= GATE_X) {
          if (link[pl[i]] === 2) {
            ps[i] = 2; fs[pf[i]] = 2; if (ft[pf[i]] <= 0) ft[pf[i]] = WAIT_S; S.losses++;
            out.cue("bump", 0.5); J.shake(1.5);
            if (!host.still) sparks.spawn(GATE_X + 5, LANE_Y[pl[i]], 8, 40, 3, 4, 0.5);
          } else gateGlow[pl[i]] = 1;
        }
        if (px[i] >= B_X) {
          ps[i] = 0; fs[pf[i]] = 3; ft[pf[i]] = 0; score(5); out.cue("tap", 0.4);
          if (!host.still) sparks.spawn(B_X + 6, LANE_Y[pl[i]] + 3, 6, 30, 0, 1, 0.45);
        }
      }
      // Missing fragments' clocks; one run out costs a life and goes again by itself.
      let left = 0, least = WAIT_S;
      for (let f = 0; f < S.len; f++) {
        if (fs[f] === 2) {
          if ((ft[f] -= dt) <= 0) {
            S.lives--; S.hit = 0.6; out.cue("lose", 0.35); out.flop(); J.flash(INK.red, 0.35); J.shake(2);
            if (S.lives <= 0) { finish(false); return; }
            ft[f] = WAIT_S; launch(f);
          } else least = Math.min(least, ft[f]);
        } else if (fs[f] === 1 && ft[f] > 0) ft[f] = Math.max(0.001, ft[f] - dt);
        if (fs[f] !== 3) left++;
      }
      status.meter = least < WAIT_S ? least / WAIT_S : -1;
      if (!left) {
        score(20 + (S.losses ? 0 : 10)); S.done = DONE_S; out.cue("win", 0.4); J.shake(1);
        if (!host.still) for (let k = 0; k < 3; k++) sparks.spawn(B_X + 6, LANE_Y[k] + 3, 6, 50, 0, 2, 0.6);
        if (S.msg % 2 === 1) out.crack(S.msg + 1 >= MESSAGES.length);
      }
    };
    const run = K.stepper(step);
    const reset = () => {
      ps.fill(0); link.fill(0); linkT.fill(0); gateGlow.fill(0); sparks.clear(); J.reset();
      S.lane = 0; S.lives = LIVES; S.t = 0; S.end = 0; S.ended = 0; S.done = 0; S.hit = 0; S.failT = 2.5;
      status.score = 0; status.verb = ""; status.meter = -1; status.round = 1; status.left = MESSAGES.length;
      begin(0);
    };
    reset();
    // The wire from x0 to x1 at y in the link's state: solid, blinking amber, or broken red.
    const wire = (ctx, x0, x1, y, state, blink) => {
      if (state === 2) { ctx.fillStyle = INK.red; for (let x = x0; x < x1; x += 6) ctx.fillRect(x, y, 3, 1); return; }
      ctx.fillStyle = state === 1 ? (blink ? INK.ember : INK.earth) : INK.stoneDk;
      ctx.fillRect(x0, y, x1 - x0, 1);
    };
    return {
      kind: "relay", name: "Packet Relay", status, roundLabel: "Message", aims: true,
      help: "A message leaves HOST A in numbered packets. Pick the gateway with W and S; a link blinks amber before it goes down, and a packet sent into a dead link is lost. Space sends a lost packet again before its clock runs out. HOST B puts the numbers back in order.",
      coach: ["W and S pick the gateway, Space resends a lost packet", "Drag up and down to pick the gateway, tap to resend"],
      stars: [200, 340, 450], tickets: (s) => Math.floor(s / 40),
      get playing() { return S.phase === "play"; },
      // Read-only, for checks: each lane's link (0 up, 1 warning, 2 down) and the route the switch points to.
      links: link, get lane() { return S.lane; },
      start: (seed) => { S.seed = Number.isInteger(seed) ? seed >>> 0 : 1; rng.seed(S.seed); reset(); S.steps = aim.steps; S.stepsY = aim.stepsY; S.phase = "play"; },
      stop: () => { S.phase = "idle"; reset(); },
      act: () => {
        if (S.phase !== "play" || S.done > 0) return;
        const f = oldest();
        if (f < 0) { out.cue("tap", 0.15); return; }
        if (launch(f)) out.cue("tap", 0.45);
      },
      update: (dt) => {
        J.update(dt); sparks.update(dt);
        const d = (aim.stepsY - S.stepsY) + (aim.steps - S.steps);
        S.steps = aim.steps; S.stepsY = aim.stepsY;
        if (S.phase === "play" && d) { const was = S.lane; S.lane = Math.min(LANES - 1, Math.max(0, S.lane + d)); if (S.lane !== was) out.cue("tap", 0.2); }
        if (S.phase !== "idle") run(dt);
      },
      draw: (ctx) => {
        ctx.fillStyle = INK.night; ctx.fillRect(0, 0, W, H);
        J.begin(ctx);
        const blink = host.still || (S.t * 4 | 0) % 2 === 0;
        // The racks either end: cream cabinets with their lamps, the switch's lever at HOST A.
        for (let side = 0; side < 2; side++) {
          const x = side ? B_X + 2 : 3;
          ctx.fillStyle = INK.husk; ctx.fillRect(x, 24, 19, 70);
          ctx.fillStyle = INK.cream; ctx.fillRect(x + 1, 25, 17, 68);
          ctx.fillStyle = INK.deep; ctx.fillRect(x + 3, 27, 13, 5);
          for (let k = 0; k < 4; k++) { ctx.fillStyle = (S.t * 3 + k + side) % 4 < 1.6 ? INK.banana : INK.earth; ctx.fillRect(x + 4 + k * 3, 28, 2, 2); }
        }
        text(ctx, "A", 10, 17, TEXT.bone); text(ctx, "B", B_X + 9, 17, TEXT.bone);
        for (let l = 0; l < LANES; l++) {
          const y = LANE_Y[l], here = l === S.lane;
          wire(ctx, A_X, GATE_X, y + 3, 0, blink);
          wire(ctx, GATE_X + 10, B_X, y + 3, link[l], blink);
          // The gateway: a box with its name, lit as a packet passes, red while its link is down.
          ctx.fillStyle = link[l] === 2 ? INK.rust : gateGlow[l] > 0 ? INK.teal : INK.stone; ctx.fillRect(GATE_X - 1, y - 3, 12, 13);
          ctx.fillStyle = INK.deep; ctx.fillRect(GATE_X, y - 2, 10, 11);
          text(ctx, GATE_NAME[l], GATE_X, y, link[l] === 2 ? TEXT.red : TEXT.stone);
          if (link[l] === 2) text(ctx, "X", (GATE_X + B_X) >> 1, y, TEXT.red);
          else if (link[l] === 1 && blink) text(ctx, "!", (GATE_X + B_X) >> 1, y - 5, TEXT.ember);
          // The switch's lever, and the route it lights.
          ctx.fillStyle = here ? INK.teal : INK.stoneDk; ctx.fillRect(14, y + 1, 7, 5);
          if (here) { ctx.fillStyle = INK.teal; ctx.fillRect(A_X, y + 2, 4, 3); }
        }
        // Packets: a little tile with its letter.
        for (let i = 0; i < POOL; i++) {
          if (!ps[i]) continue;
          const x = Math.round(px[i]) - 3, y = Math.round(py[i]) - 2, c = S.word.charCodeAt(pf[i]);
          ctx.fillStyle = ps[i] === 2 ? INK.red : INK.sky; ctx.fillRect(x, y, 9, 10);
          ctx.fillStyle = INK.deep; ctx.fillRect(x + 1, y + 1, 7, 8);
          text(ctx, CH[c], x + 2, y + 2, ps[i] === 2 ? TEXT.red : TEXT.white);
        }
        sparks.draw(ctx);
        J.end(ctx);
        text(ctx, "PACKET RELAY", 4, 3, TEXT.bone);
        number(ctx, host.best || 0, W - 4, 3, TEXT.gold, 1, 2, 4);
        number(ctx, status.score, W - 4, 11, TEXT.banana, 1, 2, 4);
        // HOST B's reassembly: the message's slots in number order, each filled once it arrives; a missing one flashes
        // red with its clock under it.
        if (S.phase !== "idle") {
          const x0 = (W - S.len * 10) >> 1;
          for (let f = 0; f < S.len; f++) {
            const x = x0 + f * 10, st = fs[f];
            ctx.fillStyle = st === 3 ? (S.done > 0 ? INK.lime : INK.moss) : st === 2 ? (blink ? INK.red : INK.rust) : INK.rule; ctx.fillRect(x, 98, 9, 10);
            if (st === 3) text(ctx, CH[S.word.charCodeAt(f)], x + 2, 100, TEXT.night);
            else number(ctx, f + 1, x + 2, 100, st === 2 ? TEXT.white : TEXT.stone);
            if (st === 2) { ctx.fillStyle = INK.ember; ctx.fillRect(x, 109, Math.max(1, Math.round(9 * ft[f] / WAIT_S)), 1); }
          }
          for (let k = 0; k < LIVES; k++) { ctx.fillStyle = k < S.lives ? (S.hit > 0 && k === S.lives ? INK.white : INK.ember) : INK.earth; ctx.fillRect(4 + k * 7, 13, 5, 5); }
          number(ctx, S.msg + 1, 40, 13, TEXT.stone); text(ctx, "/8", 46, 13, TEXT.stone);
        }
        if (S.phase === "idle") centre(ctx, "PRESS START", 112, TEXT.banana);
        else if (S.phase === "end") centre(ctx, status.verb, 112, S.lives > 0 ? TEXT.teal : TEXT.red);
        else if (S.done > 0) centre(ctx, "DELIVERED IN ORDER", 112, TEXT.lime);
        else if (oldest() >= 0) centre(ctx, "LOST! SPACE RESENDS", 112, blink ? TEXT.red : TEXT.ember);
        else centre(ctx, "PICK A WORKING GATEWAY", 112, TEXT.teal);
      }
    };
  };
  BL.genesisEra1Relay = Object.freeze({ id: "e1-relay", LANES, MESSAGES, create, terminal, make });
})();
