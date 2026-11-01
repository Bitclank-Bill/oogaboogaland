// Era 1's paddle-and-ball console as a live game: an adapter that hands the Genesis tab's console host the arcade's
// own Ooga Pong (`BL.retroGames.pong`, read-only) under the console's museum label. Nothing here is loaded until the
// Genesis tab adds its script tag after `retro-games.js` and defines the console host (see
// docs/genesis-voyage/exhibits/era-1.md, "Integration requests"). Until then the same console plays today as a
// turn-based terminal game in genesis-era-1.js (`e1-paddle`).
//
// The console's game is a modern museum homage, not historical software: an original Ooga game in an original console
// and controller design (genesis-era-1.js), with no copied program, name, logo, artwork, music or shell.
//
// `make(host)` follows retro-games.js's factory interface exactly (its header is the contract): the host it takes is
// the retro host { best, aim, still, onEnd(score), over(), popup(text, big), cue(name, gain), shake(k), crack(big),
// flop() }, and what it returns is Ooga Pong's own game object { kind, name, help, coach, stars, tickets(score),
// status, playing, start(seed), act(), stop(), update(dt), draw(ctx), aims: true }, with only its display name and a
// museum note changed. It allocates nothing beyond what Ooga Pong itself does, draws into retro-games.js's one shared
// screen canvas, and plays on its fixed step from the seed it is started with.
(() => {
  "use strict";
  const BL = window.BL = window.BL || {};
  const ID = "e1-paddle";
  const NAME = "Ooga Pong · museum homage";
  const NOTE = "A modern museum homage on the Ooga console: an original game, not historical software.";
  // What the console host must give the game, and what it must do around it (for the Genesis tab).
  const NEEDS = Object.freeze({
    load: "after retro-games.js; BL.retroGames.pong must exist",
    screen: "draw(ctx) paints retro-games.js's shared 160x120 canvas (kit.screen); the host lays it over the in-world TV's glass",
    input: "host.aim as retro-games.js defines it (x from a drag or held A/D or arrows; hold); act() on Space, Enter or a tap",
    pause: "stop calling update while the visit is paused or the workbench holds the world; draw may continue",
    calm: "host.still mirrors the visit's Calm (reduced motion)",
    mute: "host.cue(name, gain) through the page-wide mute; no music of its own",
    clear: "on blur, pause, Escape or leaving, clear held aim and call stop()"
  });
  const make = (host) => {
    const game = BL.retroGames.pong(host);
    game.name = NAME;
    game.museum = { id: ID, note: NOTE, homage: true };
    return game;
  };
  BL.genesisEra1Paddle = Object.freeze({ id: ID, name: NAME, note: NOTE, needs: NEEDS, make });
})();
