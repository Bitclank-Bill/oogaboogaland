// Tess in the Genesis museum, on the island guide's machinery (`hub-guide.js`, handed the museum's own tables as
// `guide`): she works the atrium with her beam, greets a visitor once a page and offers the museum's tour until this
// browser has answered it (a tap on her brings it at any time). The tour walks the road to Bitcoin gallery by
// gallery: the statue, then each era in order, what its years added (machines that count, packet networks and public
// keys, Merkle trees and blind signatures, timestamps, proof of work, peer-to-peer and reusable work, the paper and
// the first block), and the mining corner, the story's epilogue. Under her offer she answers a few questions about
// the museum herself. Stops are laid from the museum's own layout (`make`), so they follow its galleries.
(() => {
  "use strict";
  const BL = window.BL = window.BL || {};
  const BASE = {
    greeting: "Hi! I'm Tess. Welcome to the Genesis Hall! Want me to walk you down the road to Bitcoin?",
    again: "Want the tour of the road to Bitcoin? Or ask me about the museum.",
    declined: "No problem! Tap me any time for the tour.",
    done: "That's the road to Bitcoin! Every gallery has more: walk in and the exhibits run themselves.",
    cancelled: "All good. Enjoy the museum!",
    more: "Anything else? Ask away.",
    later: "I'll be up here in the atrium. Tap me any time!",
    unknown: "I don't know that one yet. Ask me about an era, the games or the tour.",
    thinking: "Good question! Let me think...",
    refused: "That one's not for me. Ask me about the museum!",
    resting: "I'm resting my voice until tomorrow. Ask me about the museum!",
    slowDown: "One at a time! Ask me again in a minute.",
    hello: "Hi! Ask me about the museum, or for the tour.",
    thanks: "Any time!",
    whoAmI: "I'm Tess, Ooga Booga Land's guide. Today I'm showing people the Genesis Hall.",
    takeThere: "Ask me to take you there!",
    statue: "This gold bust is the museum's tribute to Satoshi Nakamoto, the author of the Bitcoin whitepaper.",
    statueMore: "Nobody knows who Satoshi is, so it is an Ooga, not a likeness. The galleries round it are the ideas the paper stood on.",
    before: "Bitcoin didn't come from nowhere. It joined fifty years of ideas: stored data, networks, public keys, timestamps and proof of work.",
    games: "Every gallery has a game cabinet at the end of its walkway, and the board tables seat you against an Ooga.",
    gamesRecords: "Your best scores go up on the Game Records board by the way in.",
    walkways: "Stand on a moving walkway and it carries you. Round the courtyard it runs through the eras in date order.",
    gold: "Follow the gold path in each gallery: those are the steps toward Bitcoin, numbered in date order.",
    mining: "After Genesis: how mining grew, from ordinary computers in 2009 to chips built only for it.",
    miningMore: "Watch the toy miner: finding the number takes many tries, checking it takes one. That's proof of work."
  };
  // What each era's gallery added to the road, two lines a gallery (`era` is genesis-world.js ERAS[n]).
  const ERA_LINES = [
    ["Machines that count: computers learned to store, find and send data. Random-access disks, and in 1969 the first message between networked computers.", "Without stored records and networks, there's nothing to keep a ledger on."],
    ["The 1970s linked networks together and invented public-key cryptography: Diffie and Hellman in 1976, RSA in 1977.", "A public key lets anyone check a signature that only the key's owner could make. Bitcoin signs every payment that way."],
    ["The 1980s brought Merkle trees, one fingerprint that vouches for many records, and David Chaum's blind signatures for private digital cash.", "Bitcoin packs a block's payments into a Merkle tree, and digital cash was the dream from here on."],
    ["In 1991 Haber and Stornetta timestamped documents by linking each record's fingerprint to the one before: a chain.", "Change one page and every later link breaks. The paper cites them three times."],
    ["The late 1990s made work count: Adam Back's Hashcash in 1997 priced email in computing work, and Wei Dai's b-money in 1998 imagined money run by strangers.", "Proof of work is how Bitcoin picks who writes the next block."],
    ["Peer-to-peer networks spread files with no centre, Hal Finney's reusable proofs of work came in 2004 and Nick Szabo's bit gold was written up in 2005.", "Each piece was close. Nobody had yet stopped the same coin being spent twice without a trusted referee."],
    ["On 31 October 2008 Satoshi Nakamoto shared the Bitcoin paper: nine pages that joined these ideas so strangers could agree on one history.", "Signatures, timestamps chained by proof of work, and peers who keep the longest chain."],
    ["On 3 January 2009 the first block was mined, carrying a newspaper headline about bank bailouts.", "Days later the first payment moved between people. The road becomes a network."]
  ];
  const fold = (s) => (BL.hubGuide ? BL.hubGuide.fold(s) : ` ${String(s).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()} `);
  const has = (q, list) => BL.hubGuide ? BL.hubGuide.has(q, list) : list.some((w) => q.includes(` ${w} `));
  const WORDS = {
    greet: ["hi", "hello", "hey", "hiya", "howdy", "yo", "gm"],
    thanks: ["thanks", "thank you", "thx", "ty", "cheers"],
    who: ["who are you", "what are you", "your name", "who is tess"],
    tour: ["tour", "show me around", "show me round", "walk me", "guide me", "new here", "road to bitcoin"],
    before: ["before bitcoin", "came before", "led to", "history", "where did bitcoin come from", "origins", "what came before"],
    games: ["game", "games", "play", "cabinet", "cabinets", "arcade", "board game", "board games"],
    walkways: ["walkway", "walkways", "travelator", "moving sidewalk", "belt"],
    gold: ["gold path", "steps", "trail", "gold"],
    mining: ["mining", "miner", "miners", "asic", "asics", "hash", "proof of work"],
    statue: ["statue", "bust", "satoshi", "nakamoto"]
  };
  const SUGGESTIONS = ["What came before Bitcoin?", "Where are the games?", "Tell me about mining"];

  // The museum's guide tables, laid from its layout: `museum` (genesis-world.js MUSEUM), `eras` (ERAS), `lane` (LANE_X),
  // `statue` { x, z } and `mining` { x, z } where those stand in the atrium.
  const make = ({ museum, eras, lane, statue, mining }) => {
    const LINES = { ...BASE }, STOPS = [], d = { x: 0, z: 0 }, c = { x: 0, z: 0 };
    STOPS.push({ id: "statue", title: "The Satoshi bust", eye: [statue.x + 3, 8, statue.z + 15], look: [statue.x, 7, statue.z], lines: ["statue", "statueMore", "before"] });
    eras.forEach((e, n) => {
      LINES[`era${n}a`] = `${e.name}, ${e.years}. ${ERA_LINES[n][0]}`;
      LINES[`era${n}b`] = ERA_LINES[n][1];
      const b = museum.bays[n];
      museum.toMuseum(n, lane, e.z1 - museum.OPEN, d);
      museum.toMuseum(n, lane, e.z1 - museum.OPEN - (b.depth - museum.OPEN) * 0.45, c);
      const ox = d.x - c.x, oz = d.z - c.z, l = Math.hypot(ox, oz) || 1;
      STOPS.push({ id: `era${n}`, title: `Era ${n}: ${e.name}`, eye: [d.x + ox / l * 9, 6, d.z + oz / l * 9], look: [c.x, 2.2, c.z], lines: [`era${n}a`, `era${n}b`] });
    });
    STOPS.push({ id: "mining", title: "After Genesis: mining", eye: [mining.x - 3, 4, mining.z + 8], look: [mining.x, 1.3, mining.z], lines: ["mining", "miningMore"] });
    const WORK = [
      { at: [statue.x - 4, 9, statue.z + 2], aim: [statue.x, 8, statue.z] },
      { at: [mining.x - 1.5, 3.4, mining.z + 2.2], aim: [mining.x, 1.3, mining.z] },
      { at: [statue.x + 6, 5, statue.z + 9], aim: [statue.x + 2, 1, statue.z + 6] }
    ];
    const ERA_NAMES = eras.map((e) => fold(e.name).trim());
    const answer = (question, last = null) => {
      const q = fold(question), words = q.trim() ? q.trim().split(" ").length : 0;
      if (!words) return null;
      const reply = (lines, go = null, place = null) => ({ lines, say: null, go, place, tour: false });
      if (words <= 3 && has(q, WORDS.greet)) return reply(["hello"]);
      if (words <= 4 && has(q, WORDS.thanks)) return reply(["thanks"]);
      if (has(q, WORDS.who)) return reply(["whoAmI"]);
      if (has(q, WORDS.tour)) return { lines: [], say: null, go: null, place: null, tour: true };
      for (let n = 0; n < ERA_NAMES.length; n++) if (ERA_NAMES[n] && q.includes(` ${ERA_NAMES[n]} `) || q.includes(` era ${n} `)) return reply([`era${n}a`, `era${n}b`, "takeThere"], null, n + 1);
      if (has(q, WORDS.mining)) return reply(["mining", "miningMore"], null, STOPS.length - 1);
      if (has(q, WORDS.statue)) return reply(["statue", "statueMore"], null, 0);
      if (has(q, WORDS.before)) return reply(["before", "gold"]);
      if (has(q, WORDS.games)) return reply(["games", "gamesRecords"]);
      if (has(q, WORDS.walkways)) return reply(["walkways"]);
      if (has(q, WORDS.gold)) return reply(["gold"]);
      return null;
    };
    return {
      stops: STOPS, lines: LINES, work: WORK, answer, suggestions: SUGGESTIONS, pointAt: {}, news: false,
      title: "museum guide", tour: "The road to Bitcoin", ask: "Ask me about the museum", greeted: "tessGenesisGreeted", toured: "ooga-tess-genesis-tour",
      about: () => "genesis"
    };
  };
  const create = (options, layout) => BL.hubGuide.create({ ...options, guide: make(layout) });
  BL.genesisGuide = { create, make, ERA_LINES, BASE };
})();
