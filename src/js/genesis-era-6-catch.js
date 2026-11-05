// Era 6's Citation Catch: a console game on the retro games' factory interface (`retro-games.js`'s header is the
// contract). `BL.genesisEra6Catch.make(host)` returns { kind, name, help, coach, stars, tickets, status, playing,
// start(seed), act(), stop(), update(dt), draw(ctx), aims: true }. A modern museum game and an original design, not
// period software: it plays the reference desk's sorting (genesis-era-6.js) against the clock.
//
// Twelve index cards fall down five lanes, one or two at a time: the whitepaper's eight numbered references and four
// famous names its list does not hold. Left and right move the sorting tray along the lanes; the action flips the tray
// between IN THE LIST (gold) and NOT LISTED (blue). A card that lands in the tray on the right side is filed; one that
// lands on the wrong side, or misses the tray, is a mistake and goes back into the deck. Filing all twelve wins; three
// mistakes end the run. A card is worth 50, and 10 more for each card filed in a row before it; a win adds 100 for each
// mistake not made. The cards fall faster as the shelf fills. No tickets (a museum game pays none); shake, flash and
// sparks are off under the host's `still`.
//
// Loads before genesis-era-6.js and reads `BL.retroGames.kit` only inside `make`. `update` and `draw` allocate
// nothing: preset strings and inks, typed arrays for the falling cards, the kit's atlas text and digit buffer.
(() => {
  "use strict";
  const BL = window.BL = window.BL || {};
  // The cards, in the reference desk's order: `tag` fits the card's face (four letters), `name` the line under the play,
  // `cited` the reference's number in the paper's list (0: not listed), `filed` what the screen says once it is filed.
  const DECK = [
    { tag: "DAI", name: "WEI DAI: B-MONEY, 1998", cited: 1 },
    { tag: "MAQ", name: "MASSIAS ET AL: TIMESTAMPS", cited: 2 },
    { tag: "HS91", name: "HABER, STORNETTA 1991", cited: 3 },
    { tag: "BHS", name: "BAYER, HABER, STORNETTA", cited: 4 },
    { tag: "HS97", name: "SECURE NAMES, 1997", cited: 5 },
    { tag: "BACK", name: "ADAM BACK: HASHCASH", cited: 6 },
    { tag: "MERK", name: "MERKLE: PUBLIC KEYS, 1980", cited: 7 },
    { tag: "FELL", name: "FELLER: PROBABILITY, 1957", cited: 8 },
    { tag: "CHRD", name: "CHORD", cited: 0 },
    { tag: "BTOR", name: "BITTORRENT", cited: 0 },
    { tag: "RPOW", name: "RPOW", cited: 0 },
    { tag: "BGLD", name: "BIT GOLD", cited: 0 }
  ];
  for (const c of DECK) c.filed = c.cited ? `IN THE LIST: (${c.cited})` : c.tag === "BGLD" ? "NOT LISTED: SEE ERA 5" : "NOT IN THE LIST";
  const N = DECK.length, LANES = 5, PITCH = 30, X0 = 5, CARD_W = 26, CARD_H = 14, TOP_Y = 18, CATCH_Y = 94, TRAY_H = 8;
  const LIVES = 3, FALLING = 2, END_S = 1.4, SAY_S = 1.1, LIST = 1, NOT = 0;
  const make = (host) => {
    const K = BL.retroGames.kit, out = K.hooks(host), aim = out.aim, J = K.juice(host), rng = K.rng(), status = K.makeStatus("Cards");
    const { W, H, INK, TEXT, text, centre, number, textWidth } = K;
    const sparks = K.sparks(64, [INK.banana, INK.gold, INK.sky, INK.white]);
    // Each card: 0 in the deck, 1 falling, 2 filed. Falling slots: the card, its lane and its height.
    const where = new Uint8Array(N), slotCard = new Int8Array(FALLING), slotLane = new Uint8Array(FALLING), slotY = new Float32Array(FALLING);
    const tagX = new Uint8Array(N);
    for (let i = 0; i < N; i++) tagX[i] = (CARD_W - textWidth(DECK[i].tag)) >> 1;
    // phase: 0 idle, 1 play, 2 end beat, 3 done. `say` is the line under the play: a card's verdict, or a mistake.
    const S = { phase: 0, lane: 2, mode: LIST, steps: 0, filed: 0, lives: LIVES, streak: 0, best: 0, end: 0, won: 0, say: "", sayInk: 0, sayT: 0, hit: 0, seed: 1 };
    const lineOf = (slot) => slotCard[slot] < 0 ? -1 : slotCard[slot];
    const speed = () => 14 + S.filed * 2.4;
    const finish = (won) => {
      S.phase = 2; S.end = END_S; S.won = won ? 1 : 0;
      if (won) { status.score += 100 * S.lives; status.verb = "SHELVED"; J.flash(INK.banana, 0.6); out.crack(true); out.cue("win", 0.6); }
      else { status.verb = "GAME OVER"; out.flop(); out.cue("lose", 0.6); }
      for (let s = 0; s < FALLING; s++) slotCard[s] = -1;
      out.over();
    };
    const say = (line, ink) => { S.say = line; S.sayInk = ink; S.sayT = SAY_S; };
    const mistake = (card, line) => {
      where[card] = 0; S.lives--; S.streak = 0; S.hit = 0.5;
      say(line, TEXT.red); J.shake(2); J.flash(INK.red, 0.3); out.cue("bump", 0.5); out.flop();
      status.note = "Mistakes cost a life";
      if (S.lives <= 0) finish(false);
    };
    const land = (s) => {
      const card = slotCard[s], c = DECK[card];
      slotCard[s] = -1;
      if (slotLane[s] !== S.lane) { mistake(card, "MISSED THE TRAY"); return; }
      if ((S.mode === LIST) !== (c.cited > 0)) { mistake(card, "WRONG SIDE OF THE TRAY"); return; }
      where[card] = 2; S.filed++;
      status.score += 50 + 10 * S.streak; S.streak++; S.best = Math.max(S.best, S.streak);
      status.left = N - S.filed; status.round = Math.min(N, S.filed + 1); status.streak = S.streak;
      say(c.filed, c.cited ? TEXT.banana : TEXT.sky); out.cue("win", 0.35); J.shake(1);
      if (!host.still) sparks.spawn(X0 + S.lane * PITCH + (PITCH >> 1), CATCH_Y, 10, 50, c.cited ? 0 : 2, c.cited ? 1 : 3, 0.6);
      if (S.filed % 4 === 0) out.crack(S.filed === N);
      if (S.filed >= N) finish(true);
    };
    // A card from the deck into a free slot, in a lane no other falling card holds.
    const spawn = (s) => {
      let left = 0;
      for (let i = 0; i < N; i++) if (where[i] === 0) left++;
      if (!left) return;
      let pick = rng.int(left), card = 0;
      for (let i = 0; i < N; i++) if (where[i] === 0 && pick-- === 0) { card = i; break; }
      let lane = rng.int(LANES);
      for (let o = 0; o < FALLING; o++) if (o !== s && slotCard[o] >= 0 && slotLane[o] === lane) lane = (lane + 1 + rng.int(LANES - 1)) % LANES;
      where[card] = 1; slotCard[s] = card; slotLane[s] = lane; slotY[s] = TOP_Y - CARD_H;
    };
    const step = (dt) => {
      if (S.sayT > 0) S.sayT -= dt;
      if (S.hit > 0) S.hit -= dt;
      if (S.phase === 2) { if ((S.end -= dt) <= 0) { S.phase = 3; out.onEnd(status.score); } return; }
      if (S.phase !== 1) return;
      const v = speed() * dt;
      let falling = 0, highest = CATCH_Y;
      for (let s = 0; s < FALLING; s++) {
        if (slotCard[s] < 0) continue;
        slotY[s] += v;
        if (slotY[s] + CARD_H >= CATCH_Y) { land(s); if (S.phase !== 1) return; continue; }
        falling++; if (slotY[s] < highest) highest = slotY[s];
      }
      // The next card drops once the last one is well on its way.
      if (falling < FALLING && (falling === 0 || highest > TOP_Y + 34)) for (let s = 0; s < FALLING; s++) if (slotCard[s] < 0) { spawn(s); break; }
      status.meter = S.filed / N;
    };
    const run = K.stepper(step);
    const reset = () => {
      where.fill(0); slotCard.fill(-1); sparks.clear(); J.reset();
      S.lane = 2; S.mode = LIST; S.filed = 0; S.lives = LIVES; S.streak = 0; S.best = 0; S.end = 0; S.won = 0; S.say = ""; S.sayT = 0; S.hit = 0;
      status.score = 0; status.left = N; status.round = 1; status.streak = 0; status.verb = ""; status.note = ""; status.meter = 0;
    };
    reset();
    // The tray: a wooden box in its lane, its open side's colour and word on its face.
    const tray = (ctx, x) => {
      const list = S.mode === LIST;
      ctx.fillStyle = INK.husk; ctx.fillRect(x - 1, CATCH_Y + 1, CARD_W + 2, TRAY_H);
      ctx.fillStyle = list ? INK.gold : INK.sky; ctx.fillRect(x + 1, CATCH_Y, CARD_W - 2, TRAY_H - 2);
      ctx.fillStyle = INK.huskDk; ctx.fillRect(x - 1, CATCH_Y + TRAY_H, CARD_W + 2, 1);
      text(ctx, list ? "LIST" : "NOT", x + (list ? 2 : 5), CATCH_Y, TEXT.night);
    };
    const card = (ctx, i, x, y) => {
      ctx.fillStyle = INK.band; ctx.fillRect(x + 1, y + 1, CARD_W, CARD_H);
      ctx.fillStyle = INK.cream; ctx.fillRect(x, y, CARD_W, CARD_H);
      ctx.fillStyle = INK.red; ctx.fillRect(x, y + 2, CARD_W, 1);
      ctx.fillStyle = INK.stoneLt; ctx.fillRect(x + 2, y + 12, CARD_W - 4, 1);
      text(ctx, DECK[i].tag, x + tagX[i], y + 4, TEXT.night);
    };
    return {
      kind: "e6-catch", name: "Citation Catch", status, roundLabel: "Card", aims: true,
      help: "Cards fall down five lanes. A and D or the arrows move the tray; Space flips it between IN THE LIST and NOT LISTED. Catch each card on the side the paper's reference list puts it.",
      coach: ["A and D move the tray, Space flips it", "Swipe to move the tray, tap to flip it"],
      stars: [500, 1000, 1500], tickets: () => 0,
      get playing() { return S.phase === 1 || S.phase === 2; },
      get seed() { return S.seed; },
      // Read-only view for checks: each falling slot's card (-1 none), lane and height, and the tray.
      board: { slotCard, slotLane, slotY, get lane() { return S.lane; }, get mode() { return S.mode; }, get lives() { return S.lives; }, get filed() { return S.filed; }, cited: (i) => DECK[i].cited > 0 },
      start: (seed) => {
        S.seed = Number.isInteger(seed) ? seed >>> 0 : 1; rng.seed(S.seed);
        reset(); S.steps = aim.steps; S.phase = 1; spawn(0);
      },
      stop: () => { S.phase = 0; reset(); },
      act: () => {
        if (S.phase !== 1) return;
        S.mode = S.mode === LIST ? NOT : LIST; out.cue("tap", 0.4);
      },
      update: (dt) => {
        J.update(dt); sparks.update(dt);
        const ds = aim.steps - S.steps;
        S.steps = aim.steps;
        if (S.phase === 1 && ds) S.lane = Math.min(LANES - 1, Math.max(0, S.lane + ds));
        if (S.phase !== 0 && S.phase !== 3) run(dt);
        else if (S.sayT > 0) S.sayT -= dt;
      },
      draw: (ctx) => {
        ctx.fillStyle = INK.night; ctx.fillRect(0, 0, W, H);
        J.begin(ctx);
        // The reading room's wall: lanes as shelf bays, a rail along the top the cards drop from.
        for (let l = 0; l < LANES; l++) {
          const x = X0 + l * PITCH;
          ctx.fillStyle = l === S.lane && S.phase === 1 ? INK.deep : INK.cave; ctx.fillRect(x - 1, TOP_Y, CARD_W + 2, CATCH_Y - TOP_Y);
        }
        ctx.fillStyle = INK.husk; ctx.fillRect(2, TOP_Y - 2, W - 4, 2);
        for (let s = 0; s < FALLING; s++) { const i = lineOf(s); if (i >= 0) card(ctx, i, X0 + slotLane[s] * PITCH, Math.round(slotY[s])); }
        if (S.phase !== 0) tray(ctx, X0 + S.lane * PITCH);
        sparks.draw(ctx);
        J.end(ctx);
        text(ctx, "CITATION CATCH", 3, 3, TEXT.bone);
        number(ctx, status.score, W - 3, 3, TEXT.banana, 1, 2, 4);
        for (let k = 0; k < LIVES; k++) { ctx.fillStyle = k < S.lives ? (S.hit > 0 && k === S.lives ? INK.white : INK.ember) : INK.earth; ctx.fillRect(3 + k * 7, 11, 5, 4); }
        // The shelf: one slot a card, gold for the eight references filed, blue for the four names filed as not listed.
        for (let i = 0; i < N; i++) {
          const x = 22 + i * 10;
          ctx.fillStyle = where[i] === 2 ? (DECK[i].cited ? INK.gold : INK.sky) : INK.earthDk; ctx.fillRect(x, 113, 8, 5);
        }
        if (S.phase === 0) { centre(ctx, "PRESS START", 52, TEXT.banana); centre(ctx, "SORT THE PAPER'S LIST", 64, TEXT.stone); return; }
        if (S.sayT > 0) { centre(ctx, S.say, 104, S.sayInk); return; }
        if (S.phase === 2) { centre(ctx, S.won ? "ALL TWELVE SHELVED!" : "GAME OVER", 104, S.won ? TEXT.lime : TEXT.red); return; }
        // The lowest card's full name, so the visitor reads it before it lands.
        let low = -1, ly = -1;
        for (let s = 0; s < FALLING; s++) if (slotCard[s] >= 0 && slotY[s] > ly) { ly = slotY[s]; low = slotCard[s]; }
        if (low >= 0) centre(ctx, DECK[low].name, 104, TEXT.bone);
      }
    };
  };
  BL.genesisEra6Catch = { DECK, make };
})();
