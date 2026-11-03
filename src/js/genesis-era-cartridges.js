// The eras' playable games on the Genesis museum's cartridge console (genesis-cartridge.js; OVERHAUL-CONTRACT.md
// Addendum A), registered by the integrator from each era's own module, so no era file changes. One cartridge per
// era's playable, its id the exhibit's own: Space at that exhibit (or a tap on it) plays it on the console, while the
// timeline menu and the workbench's Previous and Next still open its terminal, which keeps working.
//
// Every label says what the game is: a modern original museum game in the spirit of its gallery's years, not a game
// from them. `make` reads each era's module only when a game is made, after the console has loaded the arcade's kit
// (BL.retroGames) the games draw with.
(() => {
  "use strict";
  const BL = window.BL = window.BL || {};
  const CARTS = [
    { id: "e0-nim", era: 0, title: "Nim", span: "1956–1969", make: (host) => BL.genesisEra0Games.nim.make(host) },
    { id: "e1-paddle", era: 1, title: "Ooga Paddle", span: "1970s", make: (host) => BL.genesisEra1Paddle.make(host) },
    { id: "e2-four", era: 2, title: "Four in a Row", span: "1980s", make: (host) => BL.genesisEra2Four.make(host) },
    { id: "e3-rally", era: 3, title: "Tick-Tock Rally", span: "1990–1995", make: (host) => BL.genesisEra3Rally.make(host) },
    { id: "e4-strategy", era: 4, title: "Strategy Board", span: "1996–1999", make: (host) => BL.genesisEra4Games.strategy.make(host) },
    { id: "e4-pocket", era: 4, title: "Pocket Route", span: "1996–1999", make: (host) => BL.genesisGamesPlus.pocket(host) },
    { id: "e5-patchwork", era: 5, title: "Peer Patchwork", span: "2000–2007", make: (host) => BL.genesisEra5Patchwork.make(host) },
    { id: "e5-pocket", era: 5, title: "Pattern Pocket", span: "2000–2007", make: (host) => BL.genesisEra5Mixtape.make(host) },
    { id: "e6-argument", era: 6, title: "Assemble the Argument", span: "2008", make: (host) => BL.genesisEra6Games.argument(host) },
    { id: "e7-sync", era: 7, title: "Peer Sync", span: "January 2009", make: (host) => BL.genesisEra7Sync.make(host) }
  ];
  const registry = BL.genesisCartridges = BL.genesisCartridges || { list: [] };
  const forExhibit = {};
  for (const c of CARTS) {
    registry.list.push({ id: c.id, era: c.era, title: c.title, make: c.make,
      label: `A modern original museum game in the spirit of the ${c.span} gallery, not a game from those years` });
    forExhibit[c.id] = c.id;
  }
  // An exhibit's onUse, given its cartridge as well: Space at it (or a tap) plays the game on the console, while the
  // menu and Previous/Next still open its terminal, whose banner says so. Exhibits without a cartridge keep theirs.
  const NOTE = "CONSOLE: walk up to it and press Space (or tap it) to play this game on the console.";
  const withCartridge = (id, onUse) => {
    const cart = forExhibit[id];
    if (!cart) return onUse;
    return (state) => {
      const r = onUse(state);
      if (!r) return r;
      if (!r.terminal) return { ...r, cartridge: cart };
      const t = r.terminal;
      return { ...r, cartridge: cart, terminal: { banner: [NOTE, ...t.banner], prompt: t.prompt, run: (line) => t.run(line) } };
    };
  };
  BL.genesisEraCartridges = { forExhibit, ids: CARTS.map((c) => c.id), withCartridge, NOTE };
})();
