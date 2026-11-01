// Era 6's "Assemble the argument" as a 160x120 screen game, on the retro games' factory interface (`retro-games.js`'s
// header is the contract): `BL.genesisEra6Games.argument(host)` returns { kind, name, help, coach, stars, tickets,
// status, playing, start(seed), act(), stop(), update(dt), draw(ctx), aims: true }. A modern museum homage and a
// teaching game, not historical software and not Bitcoin's protocol: nothing here signs, hashes or mines.
//
// The rules are Era 6's own (`BL.genesisEra6.createArgument`, in genesis-era-6.js, which the gallery's terminal plays
// today): six cards, one per step of the paper's argument, laid into six slots in the paper's section order. Here the
// cursor walks the tray (top row), `act` picks the card under it up, then walks the slots (bottom row) and `act` lays
// it down; when all six are down the table is checked, the wrong ones go back to the tray and count as a mistake, and
// a full row in order wins. Score 600 less 100 a mistake, never under 100. No sound (the cues are the host's to map),
// no tickets (a museum game pays none), the shake and flash off under the host's `still`.
//
// Loads after genesis-era-6.js and reads `BL.retroGames.kit` only inside `make`, so it needs retro-games.js loaded by
// the time a game is made, not when this file runs. `update` and `draw` allocate nothing: preset strings, the kit's
// atlas text and digit buffer, state on objects and typed arrays.
(() => {
  "use strict";
  const BL = window.BL = window.BL || {};
  const BOX_W = 23, BOX_H = 13, X0 = 6, PITCH = 25, TRAY_Y = 30, SLOT_Y = 66, END_BEAT = 1.2;
  // Each card's ink and its short line on the screen (the jumbotron font's capitals, at most 26 letters).
  const INKS = ["#c8583a", "#4a7ab0", "#d9953a", "#6fae3a", "#9a6ad0", "#2fb8a0"];
  const LINES = ["OWNERS SIGN IT ON", "STAMP IT IN ORDER", "MAKE REWRITES COSTLY", "NODES BUILD THE CHAIN", "REWARD THE WORK", "ATTACKERS FALL BEHIND"];
  const SLOT_NUM = ["1", "2", "3", "4", "5", "6"];
  const argument = (host) => {
    const K = BL.retroGames.kit, E6 = BL.genesisEra6, out = K.hooks(host), aim = out.aim, J = K.juice(host);
    const G = E6.createArgument(), TAGS = E6.ARG.map((c) => c.tag);
    const status = K.makeStatus("Cards"), WRONG = new Uint8Array(6);
    // phase: 0 idle, 1 picking (cursor on the tray), 2 dropping (cursor on the slots), 3 won (end beat), 4 done.
    const S = { phase: 0, cursor: 0, steps: 0, mistakes: 0, beat: 0, wrongFlash: 0, seed: 1 };
    const trayCard = (t) => { const k = G.tray[t]; return G.where[k] < 0 ? k : -1; };
    const score = () => Math.max(100, 600 - 100 * S.mistakes);
    const setStatus = () => {
      status.score = score(); status.left = 6 - G.placed(); status.round = 1;
      status.verb = S.phase === 1 ? "PICK" : S.phase === 2 ? "LAY" : "";
      status.note = S.mistakes ? "Mistakes count" : "";
    };
    const step = K.stepper((dt) => {
      if (S.wrongFlash > 0) S.wrongFlash -= dt;
      if (S.phase === 3 && (S.beat -= dt) <= 0) { S.phase = 4; out.onEnd(score()); }
    });
    const act = () => {
      if (S.phase === 1) {
        const k = trayCard(S.cursor);
        if (k < 0) return;
        G.S.held = k; S.phase = 2;
      } else if (S.phase === 2) {
        const was = G.place(G.S.held, S.cursor);
        G.S.held = -1; S.phase = 1;
        if (was >= 0) S.cursor = 0;
        if (G.placed() === 6) {
          if (G.check() === 6) { S.phase = 3; S.beat = END_BEAT; J.flash(K.INK.banana, 0.6); out.popup("IN ORDER!", true); out.crack(true); out.over(); }
          else {
            S.mistakes++; S.wrongFlash = 0.8; J.shake(2); out.flop();
            // Lifting clears the marks, so the wrong slots are noted first; the right ones stay down, marked right.
            for (let s = 0; s < 6; s++) WRONG[s] = G.mark[s] === 2 ? 1 : 0;
            for (let s = 0; s < 6; s++) if (WRONG[s]) G.lift(G.slot[s]);
            for (let s = 0; s < 6; s++) if (G.slot[s] >= 0) G.mark[s] = 1;
          }
        }
      }
      setStatus();
    };
    const box = (ctx, x, y, k, lit) => {
      ctx.fillStyle = k >= 0 ? INKS[k] : K.INK.deep;
      ctx.fillRect(x, y, BOX_W, BOX_H);
      if (lit) { ctx.fillStyle = K.INK.banana; ctx.fillRect(x - 1, y - 2, BOX_W + 2, 1); ctx.fillRect(x - 1, y + BOX_H + 1, BOX_W + 2, 1); }
      if (k >= 0) K.text(ctx, TAGS[k], x + 1, y + 3, K.TEXT.night);
    };
    return {
      kind: "e6-argument", name: "Assemble the Argument", aims: true, status, roundLabel: "Table",
      help: "A and D or the arrows move along the row; Space or a tap picks a card up, then lays it in a slot. Lay the paper's six steps in its own order.",
      coach: ["A and D move, Space picks up and lays down", "Swipe to move, tap to pick up and lay down"],
      stars: [300, 500, 600], tickets: () => 0,
      get playing() { return S.phase === 1 || S.phase === 2 || S.phase === 3; },
      get seed() { return S.seed; },
      start: (seed) => {
        S.seed = Number.isInteger(seed) ? seed >>> 0 : (Math.random() * 1e6) >>> 0;
        G.deal(S.seed);
        S.phase = 1; S.cursor = 0; S.mistakes = 0; S.beat = 0; S.wrongFlash = 0; S.steps = aim.steps;
        J.reset(); setStatus();
      },
      stop: () => { S.phase = 0; G.deal(1); J.reset(); setStatus(); },
      act,
      update: (dt) => {
        J.update(dt);
        const moved = aim.steps - S.steps;
        S.steps = aim.steps;
        if (moved && (S.phase === 1 || S.phase === 2)) S.cursor = Math.min(5, Math.max(0, S.cursor + moved));
        step(dt);
      },
      draw: (ctx) => {
        ctx.fillStyle = K.INK.cave; ctx.fillRect(0, 0, K.W, K.H);
        J.begin(ctx);
        K.centre(ctx, "ASSEMBLE THE ARGUMENT", 4, K.TEXT.banana);
        K.text(ctx, "TRAY", X0, TRAY_Y - 10, K.TEXT.stone);
        K.text(ctx, "THE PAPER'S ORDER", X0, SLOT_Y - 10, K.TEXT.stone);
        for (let t = 0; t < 6; t++) box(ctx, X0 + t * PITCH, TRAY_Y, trayCard(t), S.phase === 1 && S.cursor === t);
        for (let s = 0; s < 6; s++) {
          const x = X0 + s * PITCH, k = G.slot[s];
          box(ctx, x, SLOT_Y, k, S.phase === 2 && S.cursor === s);
          if (k < 0) K.text(ctx, SLOT_NUM[s], x + 9, SLOT_Y + 3, K.TEXT.stone);
          if (G.mark[s] === 1) { ctx.fillStyle = K.INK.lime; ctx.fillRect(x, SLOT_Y + BOX_H + 3, BOX_W, 2); }
        }
        const k = S.phase === 2 ? G.S.held : S.phase === 1 ? trayCard(S.cursor) : -1;
        if (k >= 0) K.centre(ctx, LINES[k], 88, K.TEXT.bone);
        if (S.wrongFlash > 0) K.centre(ctx, "NOT YET: TRY AGAIN", 88, K.TEXT.red);
        if (S.phase >= 3) K.centre(ctx, "IN THE PAPER'S ORDER!", 88, K.TEXT.lime);
        if (S.phase === 0) K.centre(ctx, "PRESS START", 88, K.TEXT.teal);
        K.centre(ctx, "A TEACHING GAME", 100, K.TEXT.stone);
        K.centre(ctx, "NOT THE PROTOCOL", 109, K.TEXT.stone);
        J.end(ctx);
      }
    };
  };
  BL.genesisEra6Games = { argument };
})();
