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
    const S = { hits: 0, stamps: 0, misses: 0, ax: 0, follow: 0, endT: 0, flashT: 0, clock: 0, seed: 0, best: host.best || 0 };
    let phase = "idle";
    const sync = () => { status.score = game.score; status.left = game.balls; status.round = 1 + Math.floor(game.hits / 10); status.verb = phase === "play" && game.state === "serve" ? "Serve!" : ""; };
    const zero = () => { S.hits = S.stamps = S.misses = 0; S.follow = 0; S.ax = aim.x; S.endT = S.flashT = 0; status.streak = 0; status.mult = 0; };
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
      if (game.hits > S.hits) { S.hits = game.hits; status.streak++; out.cue("hit", 0.6); if (status.streak % 10 === 0) { out.popup("RALLY!", false); out.crack(false); } }
      if (game.stamps > S.stamps) {
        S.stamps = game.stamps; S.flashT = 0.35; out.popup("STAMP +5", true); out.cue("score", 0.8); J.flash(INK.banana, 0.35); out.crack(true);
        fx.spawn(FX + game.x * FW, FY + RL.clockY / RL.h * FH, 14, 60, 0, 1, 0.5);
      }
      if (game.misses > S.misses) { S.misses = game.misses; status.streak = 0; out.cue("miss", 0.7); J.shake(2); out.flop(); }
      if (game.state === "over" && phase === "play") { phase = "end"; S.endT = END_BEAT; if (game.score > S.best) S.best = game.score; out.over(); }
    };
    const drawField = (ctx, g) => {
      ctx.fillStyle = INK.night; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = INK.deep; ctx.fillRect(FX, FY, FW, FH);
      ctx.fillStyle = INK.violet; ctx.fillRect(FX - 2, FY - 2, FW + 4, 2); ctx.fillRect(FX - 2, FY - 2, 2, FH + 2); ctx.fillRect(FX + FW, FY - 2, 2, FH + 2);
      ctx.fillStyle = S.flashT > 0 ? INK.white : INK.banana;
      ctx.fillRect(Math.round(FX + (g.clock - RL.clockW / 2) * FW), Math.round(FY + (RL.clockY - RL.clockH / 2) / RL.h * FH), Math.round(RL.clockW * FW), 4);
      ctx.fillStyle = INK.teal;
      ctx.fillRect(Math.round(FX + (g.paddle - RL.paddleW / 2) * FW), Math.round(FY + (RL.paddleY - RL.paddleH / 2) / RL.h * FH), Math.round(RL.paddleW * FW), 3);
      ctx.fillStyle = INK.white;
      ctx.fillRect(Math.round(FX + g.x * FW) - 2, Math.round(FY + g.y / RL.h * FH) - 2, 4, 4);
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
        S.flashT = Math.max(0, S.flashT - dt);
        if (phase === "idle") {
          // The attract: the demo plays itself, held still in Calm.
          if (!host.still) {
            if (demo.state === "serve") demo.serve(); else if (demo.state === "over") demo.reset();
            demo.input.aim = demo.x; demo.update(dt);
          }
          return;
        }
        if (phase === "play") { steer(); game.update(dt); events(); }
        else if (phase === "end") { S.endT -= dt; if (S.endT <= 0) { phase = "done"; out.onEnd(game.score); } }
        sync();
      },
      draw: (ctx) => {
        J.begin(ctx);
        drawField(ctx, phase === "idle" ? demo : game);
        fx.draw(ctx);
        J.end(ctx);
        text(ctx, "TICK-TOCK", 4, 4, TEXT.gold);
        number(ctx, phase === "idle" ? S.best : game.score, W - 4, 4, TEXT.bone, 1, 2, 3);
        if (phase === "idle") {
          centre(ctx, "TICK-TOCK RALLY", 44, TEXT.banana, 1);
          if (host.still || (Math.floor(S.clock * 2) & 1) === 0) centre(ctx, "PRESS START", 60, TEXT.bone);
          centre(ctx, "MUSEUM HOMAGE", 100, TEXT.stone);
          return;
        }
        ctx.fillStyle = INK.teal;
        for (let b = 0; b < game.balls; b++) ctx.fillRect(60 + b * 6, 6, 3, 3);
        if (phase === "play" && game.state === "serve") centre(ctx, "SERVE!", 70, TEXT.teal);
        if (phase !== "play") centre(ctx, "GAME OVER", 60, TEXT.red, 1);
      }
    };
    sync();
    return api;
  };
  BL.genesisEra3Rally = { make, END_BEAT };
})();
