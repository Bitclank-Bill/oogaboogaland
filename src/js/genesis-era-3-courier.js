// Padlock Courier: Era 3's second console game, a modern original museum game in the spirit of the 1990–1995 gallery
// (not a game from those years, and no real program, name, artwork or sound copied). It plays the idea of the padlock
// courier rack beside the padlock post (genesis-era-3.js): Bea, Tock and Ooga each leave an open padlock, their
// public key, and a note sent to one of them is snapped shut in that friend's padlock, because only their own key opens
// it. The padlocks are pictures, not encryption.
//
// Written to the retro games' factory interface (the header of retro-games.js): `make(host)` returns { kind, name,
// help, coach, stars, tickets(score), status, playing, start(seed), act(), stop(), update(dt), draw(ctx), aims: true }.
// A note comes down the chute addressed to one friend; left and right (held, stepped or dragged) move the courier
// along the three padlocks, and the action locks the note in the padlock under the courier at once (a faster lock
// scores more); a note left to fall drops into the padlock the courier stands at. The right padlock scores, the wrong
// one is a miss. From the sixth note the padlocks swap places for each note, so the visitor reads before locking.
// Fifteen notes win; three in the wrong padlock end the run. Everything that matters comes from the seeded `rng`,
// so a seed replays a run; `update` and `draw` allocate nothing; Calm is `host.still` (no shake, flash, sparks or
// blinking). Needs `BL.retroGames.kit` at `make` time only, so it may load before genesis-era-3.js.
(() => {
  "use strict";
  const BL = window.BL = window.BL || {};
  // The friends, in the rack's order (the same as genesis-era-3.js FRIENDS): their initial and their padlock's ink.
  const FRIENDS = [{ id: "BEA", initial: "B", ink: "#5ec8ff", text: "sky" }, { id: "TOCK", initial: "T", ink: "#ffd23a", text: "banana" }, { id: "OOGA", initial: "O", ink: "#c8ff5a", text: "lime" }];
  const GOAL = 15, LIVES = 3, SHUFFLE_FROM = 5, END_S = 1.5, LANES = 3;
  // The screen: the chute's top, where a note's fall ends (the padlocks' shackles), and each lane's middle.
  const CHUTE_Y = 22, LOCK_Y = 70, LANE_X = [36, 80, 124];
  // A note's fall in seconds: long at first, shorter with each note delivered, never under FALL_MIN.
  const FALL0 = 4.2, FALL_STEP = 0.17, FALL_MIN = 1.7;
  const make = (host) => {
    const K = BL.retroGames.kit, out = K.hooks(host), aim = out.aim, J = K.juice(host), status = K.makeStatus("Notes"), rng = K.rng();
    const { W, H, INK, TEXT, text, centre, number, sprite, blit } = K;
    const sparks = K.sparks(40, [INK.sky, INK.banana, INK.lime, INK.red], 70);
    const plus = K.worded("+");
    // Baked once: the envelope and the open and shut padlocks (shackle and body; the body tinted per friend below).
    const ENVELOPE = sprite(["wwwwwwwwwwwwwwww", "wbwwwwwwwwwwwwbw", "wwbbwwwwwwwwbbww", "wwwwbbwwwwbbwwww", "wwwwwwbbbbwwwwww", "wwwwwwwwwwwwwwww", "wwwwwwwwwwwwwwww", "wwwwwwwwwwwwwwww", "wwwwwwwwwwwwwwww", "wwwwwwwwwwwwwwww"],
      { w: INK.cream, b: INK.stoneLt });
    const SHACKLE_OPEN = sprite(["..ssss....", ".s....s...", ".s....s...", ".s........", ".s........"], { s: INK.stoneLt });
    const SHACKLE_SHUT = sprite(["..ssss....", ".s....s...", ".s....s...", ".s....s...", ".s....s..."], { s: INK.stoneLt });
    const BODY = FRIENDS.map((f) => sprite(["bbbbbbbbbb", "bhhhhhhhhb", "bbbbkkbbbb", "bbbbkkbbbb", "bbbbbkbbbb", "bbbbbbbbbb", "dddddddddd"], { b: f.ink, h: INK.white, k: INK.night, d: INK.stoneDk }));
    const COURIER = sprite(["..hhhh..", ".hssssh.", ".s.ss.s.", ".ssssss.", "..cccc..", ".cccccc.", "cc.cc.cc", "..c..c..", ".bb..bb."], { h: INK.hair, s: INK.skin, c: INK.ember, b: INK.charcoal });
    // The run, written in place. `order[k]` is the friend whose padlock stands in lane k; `to` the note's friend.
    const order = new Uint8Array(LANES), snap = new Float32Array(LANES);
    const S = { phase: "idle", lane: 1, steps: 0, ax: 0, to: 0, t: 0, fall: FALL0, lives: LIVES, done: 0, end: 0, ended: 0, wrong: 0, right: 0, wrongLane: -1, swapT: 0, blink: 0, seed: 1 };
    const finish = (won) => {
      S.phase = "end"; S.end = END_S; status.verb = won ? "ALL DELIVERED" : "GAME OVER"; status.meter = -1;
      if (won) out.crack(true); else out.flop();
      out.cue(won ? "win" : "lose", 0.6); out.over();
    };
    // The next note: a friend at random (never the same three times running), and from SHUFFLE_FROM on a fresh order.
    const next = () => {
      let to = rng.int(LANES);
      if (S.done >= 2 && to === S.to && rng.chance(0.5)) to = (to + 1 + rng.int(LANES - 1)) % LANES;
      S.to = to; S.fall = Math.max(FALL_MIN, FALL0 - S.done * FALL_STEP); S.t = 0;
      if (S.done >= SHUFFLE_FROM) {
        const before = order[0] * 9 + order[1] * 3 + order[2];
        for (let k = LANES - 1; k > 0; k--) { const j = rng.int(k + 1), x = order[k]; order[k] = order[j]; order[j] = x; }
        if (order[0] * 9 + order[1] * 3 + order[2] !== before) { S.swapT = 0.45; out.cue("tap", 0.3); }
      }
      status.target = to;
    };
    // The note goes into lane `lane`'s padlock: right or wrong, with a speed bonus for a lock before it fell.
    const deliver = (lane) => {
      const friend = order[lane];
      snap[lane] = 0.35;
      if (friend === S.to) {
        const left = 1 - S.t / S.fall, gain = 10 + Math.ceil(left * 10) * (status.streak >= 4 ? 2 : 1);
        status.score += gain; status.streak++; S.done++; S.right = 0.4;
        status.left = GOAL - S.done; status.round = S.done + 1; status.mult = status.streak >= 4 ? 2 : 0;
        out.popup(plus(gain), false); out.cue("score", 0.5); J.shake(1);
        if (!host.still) sparks.spawn(LANE_X[lane], LOCK_Y, 10, 50, friend, 0, 0.5);
        if (S.done % 5 === 0) out.crack(S.done === GOAL);
        if (S.done >= GOAL) { finish(true); return; }
      } else {
        S.lives--; status.streak = 0; status.mult = 0; S.wrong = 0.6; S.wrongLane = lane;
        out.popup("WRONG PADLOCK", false); out.cue("bump", 0.5); out.flop(); J.flash(INK.red, 0.3); J.shake(2);
        if (!host.still) sparks.spawn(LANE_X[lane], LOCK_Y, 8, 40, 3, 3, 0.4);
        if (S.lives <= 0) { finish(false); return; }
      }
      next();
    };
    const step = (dt) => {
      for (let k = 0; k < LANES; k++) snap[k] = Math.max(0, snap[k] - dt);
      S.wrong = Math.max(0, S.wrong - dt); S.right = Math.max(0, S.right - dt); S.swapT = Math.max(0, S.swapT - dt); S.blink += dt;
      if (S.phase === "play") {
        S.t += dt; status.meter = 1 - S.t / S.fall;
        if (S.t >= S.fall) deliver(S.lane);
      } else if (S.phase === "end" && !S.ended && (S.end -= dt) <= 0) { S.ended = 1; out.onEnd(status.score); }
    };
    const run = K.stepper(step);
    const reset = () => {
      sparks.clear(); J.reset();
      order[0] = 0; order[1] = 1; order[2] = 2; snap.fill(0);
      S.lane = 1; S.lives = LIVES; S.done = 0; S.end = 0; S.ended = 0; S.wrong = 0; S.right = 0; S.wrongLane = -1; S.swapT = 0; S.t = 0; S.to = 0;
      status.score = 0; status.left = GOAL; status.verb = ""; status.meter = -1; status.round = 1; status.streak = 0; status.mult = 0; status.target = 0;
    };
    reset();
    // The courier's lane from the host's aim: each step of left or right one lane, a drag across the screen a lane by
    // where it points, and a held key a lane each press (the kit counts those in `steps`).
    const steer = () => {
      const ds = aim.steps - S.steps;
      S.steps = aim.steps;
      if (ds) S.lane = Math.min(LANES - 1, Math.max(0, S.lane + ds));
      else if (aim.x !== S.ax) S.lane = Math.min(LANES - 1, Math.max(0, Math.round((aim.x + 1) * (LANES - 1) / 2)));
      S.ax = aim.x;
    };
    const noteY = () => CHUTE_Y + (LOCK_Y - 18 - CHUTE_Y) * Math.min(1, S.t / S.fall);
    return {
      kind: "courier", name: "Padlock Courier", status, roundLabel: "Note", aims: true,
      help: "Each note is for Bea, Tock or Ooga. Move to the padlock of the friend it is for and press Space to lock it there: only that friend's own key opens it. From the sixth note the padlocks swap places. A modern original museum game, not a game from these years.",
      coach: ["A and D move along the padlocks, Space locks the note", "Drag to a padlock, tap to lock"],
      stars: [120, 260, 380], tickets: (s) => Math.floor(s / 40),
      get playing() { return S.phase === "play" || (S.phase === "end" && !S.ended); },
      get seed() { return S.seed; },
      // For checks: the friend each lane's padlock belongs to, the note's friend and the courier's lane.
      get order() { return order; }, get to() { return S.to; }, get lane() { return S.lane; }, get delivered() { return S.done; },
      start: (seed) => { S.seed = Number.isInteger(seed) ? seed >>> 0 : rng.fresh(); rng.seed(S.seed); reset(); S.steps = aim.steps; S.ax = aim.x; S.phase = "play"; next(); },
      stop: () => { S.phase = "idle"; reset(); },
      act: () => {
        if (S.phase !== "play") return false;
        out.cue("tap", 0.4);
        deliver(S.lane);
        return true;
      },
      update: (dt) => {
        J.update(dt); sparks.update(dt);
        if (S.phase === "play") steer();
        if (S.phase !== "idle") run(dt);
      },
      draw: (ctx) => {
        ctx.fillStyle = INK.night; ctx.fillRect(0, 0, W, H);
        J.begin(ctx);
        // The post room: a back wall, the chute's mouth at the top, the counter the padlocks stand on.
        ctx.fillStyle = INK.deep; ctx.fillRect(4, 14, W - 8, 90);
        ctx.fillStyle = INK.rule; for (let k = 0; k < 5; k++) ctx.fillRect(4, 30 + k * 12, W - 8, 1);
        ctx.fillStyle = INK.earth; ctx.fillRect(56, CHUTE_Y - 8, 48, 6);
        ctx.fillStyle = INK.husk; ctx.fillRect(56, CHUTE_Y - 8, 48, 1);
        ctx.fillStyle = INK.earthDk; ctx.fillRect(4, LOCK_Y + 18, W - 8, 12);
        ctx.fillStyle = INK.husk; ctx.fillRect(4, LOCK_Y + 18, W - 8, 1);
        const live = S.phase === "play";
        for (let k = 0; k < LANES; k++) {
          const x = LANE_X[k], f = order[k], shut = snap[k] > 0;
          // The padlock: its shackle snapping shut for a moment after a lock, its body in its friend's ink, a slot
          // behind it, the friend's initial under it, and a red flash on the wrong one.
          if (S.phase !== "idle" && k === S.lane) { ctx.fillStyle = INK.teal; ctx.fillRect(x - 10, LOCK_Y - 11, 20, 24); }
          ctx.fillStyle = INK.band; ctx.fillRect(x - 9, LOCK_Y - 10, 18, 22);
          blit(ctx, shut ? SHACKLE_SHUT : SHACKLE_OPEN, x - 5, LOCK_Y - (shut ? 4 : 6) + (S.swapT > 0 && !host.still ? 1 : 0));
          blit(ctx, BODY[f], x - 5, LOCK_Y + 1);
          if (S.wrong > 0 && S.wrongLane === k) { ctx.fillStyle = INK.red; ctx.fillRect(x - 9, LOCK_Y + 9, 18, 2); }
          text(ctx, FRIENDS[f].initial, x - 2, LOCK_Y + 10, TEXT[FRIENDS[f].text]);
        }
        // The courier on the counter under the padlock they stand at (its slot outlined in teal above).
        if (S.phase !== "idle") blit(ctx, COURIER, LANE_X[S.lane] - 4, LOCK_Y + 19);
        // The note: an envelope coming down over the courier's lane, its friend's initial on it in their ink.
        if (live) {
          const nx = LANE_X[S.lane] - 8, ny = Math.round(noteY());
          ctx.fillStyle = INK.rule; ctx.fillRect(LANE_X[S.lane], CHUTE_Y - 2, 1, ny - CHUTE_Y + 2);
          blit(ctx, ENVELOPE, nx, ny);
          ctx.fillStyle = FRIENDS[S.to].ink; ctx.fillRect(nx + 6, ny + 5, 5, 4);
          text(ctx, FRIENDS[S.to].initial, nx + 6, ny + 11, TEXT[FRIENDS[S.to].text]);
        }
        sparks.draw(ctx);
        // The clock: how long until the note drops in, red in its last quarter.
        if (live) { ctx.fillStyle = status.meter < 0.25 ? INK.red : INK.teal; ctx.fillRect(4, 102, Math.round((W - 8) * Math.max(0, status.meter)), 2); }
        J.end(ctx);
        text(ctx, "PADLOCK COURIER", 4, 3, TEXT.bone);
        number(ctx, S.phase === "idle" ? host.best || 0 : status.score, W - 4, 3, TEXT.gold, 1, 2, 3);
        if (S.phase !== "idle") {
          for (let k = 0; k < LIVES; k++) { ctx.fillStyle = k < S.lives ? INK.ember : INK.earth; ctx.fillRect(4 + k * 7, 109, 5, 5); }
          text(ctx, "LEFT", 112, 108, TEXT.stone); number(ctx, status.left, W - 4, 108, TEXT.bone, 1, 2);
          if (status.mult) text(ctx, "X2", 30, 108, TEXT.teal);
        }
        if (S.phase === "idle") {
          centre(ctx, "LOCK EACH NOTE", 40, TEXT.banana);
          centre(ctx, "IN THE RIGHT PADLOCK", 50, TEXT.bone);
          if (host.still || (Math.floor(S.blink * 2) & 1) === 0) centre(ctx, "PRESS START", 112, TEXT.banana);
        } else if (S.phase === "end") {
          ctx.fillStyle = INK.band; ctx.fillRect(28, 34, W - 56, 22);
          centre(ctx, status.verb, 38, S.done >= GOAL ? TEXT.teal : TEXT.red);
          text(ctx, "DELIVERED", 40, 47, TEXT.stone); number(ctx, S.done, 120, 47, TEXT.bone, 1, 2);
        } else if (S.swapT > 0) centre(ctx, "THE PADLOCKS MOVED!", 14, TEXT.pink);
        else if (S.wrong > 0) centre(ctx, "WRONG KEY: NOT OPENED", 14, TEXT.red);
      }
    };
  };
  BL.genesisEra3Courier = { FRIENDS, GOAL, LIVES, SHUFFLE_FROM, make };
})();
