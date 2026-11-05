// Tick-Tock Rally, live: Era 3's paddle-and-ball game for the museum's coming game console, written to the retro
// games' factory interface (the header of retro-games.js): `make(host)` returns { kind, name, help, coach, stars,
// tickets(score), status, playing, seed, start(seed), act(), stop(), update(dt), draw(ctx), aims: true }, with
// `roundLabel`. It plays the very rules Era 3's cabinet and its prompt already use (`BL.genesisEra3.createRally`: a
// field 1 wide and 0.75 high, fixed 1/120 s steps, at most four a frame), so the prompt's tick-at-a-time game, the
// cabinet's demo and this live game can never drift apart. A modern museum homage, original to the voyage: not
// historical software, and no copied game, program, name, artwork or sound.
//
// Needs, at `make` time (not at load): `BL.genesisEra3` (genesis-era-3.js, before this file) and `BL.retroGames.kit`
// (retro-games.js, in the page's deferred "arcade" group, with the jumbotron's font): the console loads that group
// first (docs/genesis-voyage/exhibits/era-3.md, integration requests).
//
// Input (host.aim, as the retro games read it): held arrows or A and D slide the paddle (`hold`); a drag or the mouse
// across the screen (`x`, -1..1) sets where the paddle heads; `act()` (Space, a tap, the console's action button)
// serves. Pause is the console not calling `update`. Calm is `host.still`: no shake or flash, and the attract's demo
// holds still. Sound only through `host.cue` (the console maps the names to its own pooled, muted-aware cues).
// `update` and `draw` allocate nothing: text from the kit's atlas (literals only), numbers through `kit.number`.
// The look (a gridded field, the clock as a little face whose hand ticks, the paddle's glint and flash on a return, a
// short trail behind the ball, the balls left as balls, the streak and a results line) is drawing only: every rule
// is still the cabinet's own.
(() => {
  "use strict";
  const BL = window.BL = window.BL || {};
  // Where the field sits on the 160 by 120 screen (the rules' 1 by 0.75 field, 136 by 102 pixels).
  const FX = 12, FY = 16, FW = 136, FH = 102, END_BEAT = 1.6;
  const make = (host) => {
    const K = BL.retroGames.kit, E3 = BL.genesisEra3, RL = E3.RALLY;
    const { W, H, INK, TEXT, text, centre, number, sparks, juice, hooks, makeStatus, rng } = K;
    const out = hooks(host), aim = out.aim, status = makeStatus("Balls"), J = juice(host), R = rng();
    const fx = sparks(48, [INK.banana, INK.teal, INK.pink], 80);
    const game = E3.createRally(), demo = E3.createRally();
    // The run on one object, so a frame's writes change it in place: what the rules counted last frame (to notice a
    // return, a stamp or a miss), the paddle's follow mode for a drag, the end beat, a stamp's flash and the seed.
    const S = { hits: 0, stamps: 0, misses: 0, ax: 0, follow: 0, endT: 0, flashT: 0, clock: 0, seed: 0, best: host.best || 0, padT: 0, missT: 0, trailT: 0, trailN: 0, trailDt: 0, newBest: 0 };
    // The ball's trail: its last TRAIL places, sampled a few times a second, in a fixed ring.
    const TRAIL = 6, tx = new Float32Array(TRAIL), ty = new Float32Array(TRAIL), TRAIL_INKS = [INK.white, INK.bone, INK.stoneLt, INK.stone, INK.stoneDk, INK.rule];
    let phase = "idle";
    const sync = () => { status.score = game.score; status.left = game.balls; status.round = 1 + Math.floor(game.hits / 10); status.verb = phase === "play" && game.state === "serve" ? "Serve!" : ""; };
    const zero = () => { S.hits = S.stamps = S.misses = 0; S.follow = 0; S.ax = aim.x; S.endT = S.flashT = 0; S.padT = S.missT = S.trailT = 0; S.trailN = 0; S.newBest = 0; status.streak = 0; status.mult = 0; };
    // The paddle's wish from the host's aim: held keys slide it; otherwise a drag that moved sets where it heads.
    const steer = () => {
      const i = game.input;
      if (aim.hold) { S.follow = 0; i.left = aim.hold < 0; i.right = aim.hold > 0; i.aim = -1; }
      else {
        i.left = i.right = false;
        if (aim.x !== S.ax) S.follow = 1;
        i.aim = S.follow ? Math.max(0, Math.min(1, (aim.x + 1) / 2)) : -1;
      }
      S.ax = aim.x;
    };
    // What happened this frame, from the rules' own counters: a return, a stamp, a miss, the end.
    const events = () => {
      if (game.hits > S.hits) {
        S.hits = game.hits; status.streak++; S.padT = 0.18; out.cue("hit", 0.6);
        if (!host.still) fx.spawn(FX + game.x * FW, FY + RL.paddleY / RL.h * FH - 2, 5, 40, 1, 1, 0.3);
        if (status.streak % 10 === 0) { out.popup("RALLY!", false); out.crack(false); }
      }
      if (game.stamps > S.stamps) {
        S.stamps = game.stamps; S.flashT = 0.35; out.popup("STAMP +5", true); out.cue("score", 0.8); J.flash(INK.banana, 0.35); out.crack(true);
        fx.spawn(FX + game.x * FW, FY + RL.clockY / RL.h * FH, 14, 60, 0, 1, 0.5);
      }
      if (game.misses > S.misses) { S.misses = game.misses; status.streak = 0; S.missT = 0.5; S.trailN = 0; out.cue("miss", 0.7); J.shake(2); J.flash(INK.red, 0.25); out.flop(); }
      if (game.state === "over" && phase === "play") { phase = "end"; S.endT = END_BEAT; if (game.score > S.best) { S.best = game.score; S.newBest = game.score > 0 ? 1 : 0; } out.over(); }
    };
    const drawField = (ctx, g, live) => {
      ctx.fillStyle = INK.night; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = INK.deep; ctx.fillRect(FX, FY, FW, FH);
      // A faint grid, and the field's frame with a rivet at each top corner; the open bottom glows red after a miss.
      ctx.fillStyle = INK.rule;
      for (let k = 1; k < 8; k++) ctx.fillRect(FX + k * 17, FY, 1, FH);
      for (let k = 1; k < 6; k++) ctx.fillRect(FX, FY + k * 17, FW, 1);
      ctx.fillStyle = INK.violet; ctx.fillRect(FX - 2, FY - 2, FW + 4, 2); ctx.fillRect(FX - 2, FY - 2, 2, FH + 2); ctx.fillRect(FX + FW, FY - 2, 2, FH + 2);
      ctx.fillStyle = INK.white; ctx.fillRect(FX - 2, FY - 2, 2, 2); ctx.fillRect(FX + FW, FY - 2, 2, 2);
      if (live && S.missT > 0) { ctx.fillStyle = INK.red; ctx.fillRect(FX, FY + FH - 2, FW, 2); }
      // The clock: a gold face in a darker rim, its hand ticking round a quarter at a time.
      const cx = Math.round(FX + (g.clock - RL.clockW / 2) * FW), cy = Math.round(FY + (RL.clockY - RL.clockH / 2) / RL.h * FH), cw = Math.round(RL.clockW * FW);
      ctx.fillStyle = S.flashT > 0 && live ? INK.white : INK.gold; ctx.fillRect(cx - 1, cy - 1, cw + 2, 6);
      ctx.fillStyle = S.flashT > 0 && live ? INK.white : INK.banana; ctx.fillRect(cx, cy, cw, 4);
      const mid = cx + (cw >> 1), q = Math.floor(g.time * 2) & 3;
      ctx.fillStyle = INK.night; ctx.fillRect(mid, cy, 1, 2);
      ctx.fillRect(q === 1 ? mid + 1 : q === 3 ? mid - 2 : mid, q === 0 ? cy : q === 2 ? cy + 2 : cy + 1, q & 1 ? 2 : 1, q & 1 ? 1 : 2);
      // The ball's trail, newest brightest, then the paddle (a glint along its top, white for a moment on a return).
      const bx = Math.round(FX + g.x * FW), by = Math.round(FY + g.y / RL.h * FH);
      if (live && !host.still) for (let k = 0; k < S.trailN; k++) {
        const j = (S.trailT + TRAIL - 1 - k) % TRAIL;
        ctx.fillStyle = TRAIL_INKS[k]; ctx.fillRect(Math.round(tx[j]) - 1, Math.round(ty[j]) - 1, 2, 2);
      }
      const px = Math.round(FX + (g.paddle - RL.paddleW / 2) * FW), py = Math.round(FY + (RL.paddleY - RL.paddleH / 2) / RL.h * FH), pw = Math.round(RL.paddleW * FW);
      ctx.fillStyle = live && S.padT > 0 ? INK.white : INK.teal; ctx.fillRect(px, py, pw, 3);
      ctx.fillStyle = INK.sky; ctx.fillRect(px + 2, py, pw - 4, 1);
      ctx.fillStyle = INK.white;
      ctx.fillRect(bx - 2, by - 2, 4, 4);
      ctx.fillStyle = INK.stoneLt; ctx.fillRect(bx + 1, by + 1, 1, 1);
    };
    // The trail's ring takes the live ball's place a few times a second (a fixed ring, nothing allocated).
    const trail = (dt) => {
      if (game.state !== "play") { S.trailN = 0; return; }
      S.trailDt += dt;
      if (S.trailDt < 1 / 30) return;
      S.trailDt = 0;
      tx[S.trailT] = FX + game.x * FW; ty[S.trailT] = FY + game.y / RL.h * FH;
      S.trailT = (S.trailT + 1) % TRAIL; if (S.trailN < TRAIL) S.trailN++;
    };
    const api = {
      kind: "tick-tock", name: "Tick-Tock Rally", aims: true, status, roundLabel: "Level",
      help: "Arrows, A and D, a drag or the mouse move the paddle; Space, a tap or the action button serves. Keep the ball in play; hit the clock at the top for a stamp worth five. A modern museum homage, not historical software.",
      coach: ["Arrows or A and D move, Space serves", "Drag to move, tap to serve"],
      stars: [10, 30, 60], tickets: (score) => Math.floor(score / 5),
      get playing() { return phase === "play" || phase === "end"; },
      get seed() { return S.seed; },
      get best() { return S.best; },
      // How far the attract's demo has played (it holds in Calm), for checks.
      get demoTime() { return demo.time; },
      // The rules decide nothing at random; the seed is kept so a console can replay a run's sparks the same way.
      start: (seed) => {
        if (Number.isInteger(seed)) { R.seed(seed); S.seed = seed; } else S.seed = R.fresh();
        game.reset(); fx.clear(); J.reset(); zero(); phase = "play"; sync();
      },
      act: () => {
        if (phase !== "play") return false;
        const served = game.serve();
        if (served) out.cue("serve", 0.5);
        sync();
        return served;
      },
      stop: () => { phase = "idle"; game.reset(); fx.clear(); J.reset(); zero(); sync(); },
      update: (dt) => {
        S.clock += dt; J.update(dt); fx.update(dt);
        S.flashT = Math.max(0, S.flashT - dt); S.padT = Math.max(0, S.padT - dt); S.missT = Math.max(0, S.missT - dt);
        if (phase === "idle") {
          // The attract: the demo plays itself, held still in Calm.
          if (!host.still) {
            if (demo.state === "serve") demo.serve(); else if (demo.state === "over") demo.reset();
            demo.input.aim = demo.x; demo.update(dt);
          }
          return;
        }
        if (phase === "play") { steer(); game.update(dt); events(); trail(dt); }
        else if (phase === "end") { S.endT -= dt; if (S.endT <= 0) { phase = "done"; out.onEnd(game.score); } }
        sync();
      },
      draw: (ctx) => {
        J.begin(ctx);
        drawField(ctx, phase === "idle" ? demo : game, phase !== "idle");
        fx.draw(ctx);
        J.end(ctx);
        text(ctx, "TICK-TOCK", 4, 4, TEXT.gold);
        number(ctx, phase === "idle" ? S.best : game.score, W - 4, 4, TEXT.bone, 1, 2, 3);
        if (phase === "idle") {
          // The title on a dark band over the demo, a drop shadow under it.
          ctx.fillStyle = INK.band; ctx.fillRect(FX + 8, 38, FW - 16, 30);
          ctx.fillStyle = INK.violet; ctx.fillRect(FX + 8, 38, FW - 16, 1); ctx.fillRect(FX + 8, 67, FW - 16, 1);
          centre(ctx, "TICK-TOCK RALLY", 45, TEXT.violet, 1);
          centre(ctx, "TICK-TOCK RALLY", 44, TEXT.banana, 1);
          if (host.still || (Math.floor(S.clock * 2) & 1) === 0) centre(ctx, "PRESS START", 57, TEXT.bone);
          text(ctx, "BEST", FX + 2, 108, TEXT.stone); number(ctx, S.best, FX + 30, 108, TEXT.gold);
          text(ctx, "MUSEUM HOMAGE", FX + FW - 78, 108, TEXT.stone);
          return;
        }
        // The balls left as little balls, the streak once it is going, and the level.
        for (let b = 0; b < RL.balls; b++) { ctx.fillStyle = b < game.balls ? INK.white : INK.rule; ctx.fillRect(62 + b * 7, 5, 4, 4); }
        if (status.streak >= 3 && phase === "play") { text(ctx, "X", 92, 4, TEXT.teal); number(ctx, status.streak, 98, 4, TEXT.teal); }
        if (phase === "play" && game.state === "serve") {
          centre(ctx, "SERVE!", 70, (host.still || (Math.floor(S.clock * 3) & 1) === 0) ? TEXT.teal : TEXT.sky);
          if (S.missT > 0) centre(ctx, "MISS", 56, TEXT.red);
        }
        if (phase !== "play") {
          ctx.fillStyle = INK.band; ctx.fillRect(FX + 16, 50, FW - 32, 34);
          centre(ctx, "GAME OVER", 54, TEXT.red, 1);
          text(ctx, "SCORE", 52, 66, TEXT.stone); number(ctx, game.score, 108, 66, TEXT.bone, 1, 2);
          if (S.newBest) centre(ctx, "NEW BEST!", 75, TEXT.banana);
          else { text(ctx, "BEST", 52, 75, TEXT.stone); number(ctx, S.best, 108, 75, TEXT.gold, 1, 2); }
        }
      }
    };
    sync();
    return api;
  };
  BL.genesisEra3Rally = { make, END_BEAT };
})();
