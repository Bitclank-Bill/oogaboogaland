// Era 5's cave in the Genesis Voyage, Peers and Reusable Work (2000–2007): a workshop of competing ideas, not a
// conveyor belt toward Bitcoin. Built only through the kit (genesis-exhibits.js); facts from
// docs/genesis-voyage/eras/era-5-peers-and-reusable-work.md (branch gv/research, READY entries only) and the build
// brief's period-gear records. HOLD material (BitTorrent's release record) stays out.
//
// Left bank, the idea benches: each has a paper lectern (In short, deeper story, what remained unsolved, sources) and
// a museum toy beside it. Chord, August 2001 conference paper (context: peer lookup is not monetary consensus);
// Hashcash, the 1 August 2002 paper (whitepaper citation [6]; the 1997 announcement is Era 4's); RPOW, 15 August 2004
// announcement (context) with its sealed-server cabinet; bit gold, December 2005 qualified (documented influence, by
// Satoshi's retrospective post of 20 July 2010).
// Right bank, the peer bench and period gear (all context): BitTorrent's 22 May 2003 paper with a piece-mosaic toy;
// GPS sharpening (1 May 2000 announcement, 2 May 2000 change); a volunteer encyclopedia (2001); a pocket hard-disk
// music player (announced 23 October 2001, available 10 November 2001), silent: the cave's shared music stays the
// only sound.
// Two lofts high on the back walls (fly up with the jetpack) hold a trust-boundary comparison and a routing puzzle;
// their essentials are repeated in the overview's pages, so nothing needed is only up there.
//
// Plots: nothing in the gateway (u < 10), the docks, the lamp squares, the stream or 1.5 m beside it; nothing above
// 8 m; low models nearest the water so the overview board and the far wall stay in view from the banks. Every toy is
// local, bounded and resettable, keeps its state for the visit and is rebuilt fresh on the next; commands do their
// (bounded) work at once, so there is no background work. `update` allocates nothing, holds decoration still in Calm,
// and holds the cabinet's blinking while a panel is open.
(() => {
  "use strict";
  const BL = window.BL;
  // `verified: true`: the gv/research dossier records reading the page (31 October 2026). This build could not reach
  // the web; the GPS and encyclopedia pages come from the build brief's records and are marked unverified.
  const sources = {
    "E5-CHORD": { label: "Stoica, Morris, Karger, Kaashoek and Balakrishnan: Chord (SIGCOMM, 27-31 August 2001)",
      href: "https://pdos.csail.mit.edu/papers/chord:sigcomm01/chord_sigcomm.pdf", kind: "context", verified: true },
    "E5-BT": { label: "Bram Cohen: Incentives Build Robustness in BitTorrent (paper dated 22 May 2003)",
      href: "https://www.bittorrent.org/bittorrentecon.pdf", kind: "context", verified: true },
    "E5-HC": { label: "Adam Back: Hashcash - A Denial of Service Counter-Measure (1 August 2002), whitepaper [6]",
      href: "https://cdn.nakamotoinstitute.org/docs/hashcash.pdf", kind: "whitepaper citation [6]", verified: true },
    "E5-RPOW": { label: "Hal Finney: RPOW - Reusable Proofs of Work (announcement, 15 August 2004), SNI reprint",
      href: "https://nakamotoinstitute.org/library/rpow/", kind: "context", verified: true },
    "E5-BG": { label: "Nick Szabo: Bit Gold (SNI reprint, dated 29 December 2005)",
      href: "https://nakamotoinstitute.org/library/bit-gold/", kind: "documented influence", verified: true },
    "E5-BG-AUTHOR": { label: "Nick Szabo's current page for Bit Gold (displays 27 December 2008 at a 2005 address)",
      href: "https://unenumerated.blogspot.com/2005/12/bit-gold.html", kind: "documented influence", verified: true },
    "E5-ATTR": { label: "Satoshi Nakamoto, forum post of 20 July 2010 (a retrospective attribution)",
      href: "https://satoshi.nakamotoinstitute.org/posts/bitcointalk/249/", kind: "documented influence", verified: true },
    "E5-GEAR": { label: "Manufacturer's announcement of a pocket hard-disk music player, 23 October 2001",
      href: "https://www.apple.com/newsroom/2001/10/23Apple-Presents-iPod/", kind: "context", verified: true },
    "E5-GPS": { label: "GPS.gov: Selective Availability (the 1 May 2000 decision; the change on 2 May 2000)",
      href: "https://www.gps.gov/systems/gps/modernization/sa/", kind: "context", verified: false },
    "E5-WIKI": { label: "History of the volunteer-written online encyclopedia launched in January 2001",
      href: "https://en.wikipedia.org/wiki/History_of_Wikipedia", kind: "context", verified: false }
  };
  const reply = (...lines) => ({ lines });
  const clean = (text) => String(text).replace(/[\u0000-\u001f\u007f]/g, "").slice(0, 64).trim();
  const integer = (word, lo, hi) => /^\d{1,3}$/.test(word || "") && +word >= lo && +word <= hi ? +word : -1;
  // A toy 32-bit mixer: deliberately NOT a cryptographic hash.
  const seedOf = (text) => { let h = 2166136261; for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619); return h >>> 0; };
  const mix = (seed, nonce) => {
    let h = seed ^ Math.imul(nonce + 1, 0x9e3779b1);
    h = Math.imul(h ^ (h >>> 16), 0x85ebca6b); h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
    return (h ^ (h >>> 16)) >>> 0;
  };
  const hex = (n) => (n >>> 0).toString(16).padStart(8, "0");
  // A bounded search done at once on a command: at most `cap` attempts, the first digest under 2^(32 - bits).
  const search = (seed, bits, cap) => { const limit = 2 ** (32 - bits); for (let n = 0; n < cap; n++) if (mix(seed, n) < limit) return n; return -1; };
  // A museum terminal: the device's hint and its How to use steps lead the banner, and HELP repeats them.
  const device = (title, hint, steps, prompt, commands, extra = []) => {
    const help = [`HINT: ${hint}`, "HOW TO USE:", ...steps.map((s, i) => `  ${i + 1}. ${s}`), `Commands: ${commands}`];
    return (run) => ({ banner: [title, ...extra, ...help, "Original museum toy: local, bounded, RESET starts again."], prompt,
      run(line) {
        const text = clean(line), words = text.toUpperCase().split(/\s+/), cmd = words[0];
        if (!cmd || cmd === "HELP") return { lines: help };
        return run(cmd, words, text);
      } });
  };
  // A paper lectern's panel: In short, the deeper story, what remained unsolved and the sources.
  const paper = (room, keys, short, deeper, unsolved) => () => ({ board: { room, sources: keys, pages: [
    { caption: "In short", title: short[0], text: short.slice(1) },
    { caption: "Deeper story", title: deeper[0], text: deeper.slice(1) },
    { caption: "What remained unsolved", title: unsolved[0], text: unsolved.slice(1) },
    { caption: "Sources", title: "Where this comes from", text: keys.map((k) => (sources[k] ? sources[k].label : "The Bitcoin whitepaper, 2008")).concat("Dates say what they mark. Links are listed below.") }
  ] } });

  // Per-visit state and nodes: set in build, dropped in dispose.
  let S = null;
  const fresh = () => ({
    ring: { nodes: new Uint8Array(16), key: -1, owner: -1 },
    stamp: { text: "museum note", bits: 8, nonce: -1, digest: 0, attempts: 0, boundText: "", boundBits: 0 },
    rpow: { spent: [], wallet: [], made: 0, issued: 0 },
    cab: { loaded: "A", compared: false, match: true },
    gold: { chain: [], hw: "FAST" },
    mosaic: { have: new Uint8Array(12), uploads: new Uint8Array(3), done: 0 },
    gps: { sa: true, day: 1 },
    wiki: { revs: [], at: 0 },
    player: { loaded: new Uint8Array(6), used: 0, cursor: 0 },
    route: { at: 0, hops: 0, target: 23, solved: false },
    n: null
  });
  const RING0 = [1, 4, 9, 12];

  // --- Chord ring --------------------------------------------------------------------------------------------------
  const succ = (nodes, id) => { for (let i = 0; i < 16; i++) { const k = (id + i) & 15; if (nodes[k]) return k; } return -1; };
  const inside = (x, a, b) => a < b ? x > a && x <= b : x > a || x <= b; // x in (a, b] around the ring
  const ringShow = () => {
    const r = S.ring, N = S.n;
    for (let i = 0; i < 16; i++) { N.pillars[i].visible = !!r.nodes[i]; N.caps[i].visible = i === r.owner; }
    N.keyMark.visible = r.key >= 0;
    if (r.key >= 0) { N.keyMark.position.x = N.slot[r.key * 2]; N.keyMark.position.z = N.slot[r.key * 2 + 1]; }
  };
  const ringTerm = device("CHORD RING / 16 numbered places, a museum model of key lookup",
    "Lookup finds which peer holds a key. It does not decide who owns anything.",
    ["Type NODES to see which places hold a peer.", "Type LOOKUP and a key from 0 to 15: watch the hops.", "JOIN or LEAVE a place, then look the same key up again."],
    "RING>", "NODES | LOOKUP k | JOIN n | LEAVE n | RESET")((cmd, w) => {
    const r = S.ring;
    const list = () => { const out = []; for (let i = 0; i < 16; i++) if (r.nodes[i]) out.push(i); return out; };
    if (cmd === "RESET") { r.nodes.fill(0); for (const k of RING0) r.nodes[k] = 1; r.key = r.owner = -1; ringShow(); return reply("Ring reset: peers at 1, 4, 9 and 12."); }
    if (cmd === "NODES") return reply(`Peers at: ${list().join(", ")}.`, "Each key belongs to the first peer at or after it, going round.");
    if (cmd === "JOIN" || cmd === "LEAVE") {
      const n = w.length === 2 ? integer(w[1], 0, 15) : -1, count = list().length;
      if (n < 0) return reply(`${cmd} needs one place from 0 to 15.`);
      if (cmd === "JOIN" && (r.nodes[n] || count >= 8)) return reply(r.nodes[n] ? `A peer already holds ${n}.` : "At most 8 peers in this model.");
      if (cmd === "LEAVE" && (!r.nodes[n] || count <= 1)) return reply(r.nodes[n] ? "Keep at least one peer." : `No peer at ${n}.`);
      r.nodes[n] = cmd === "JOIN" ? 1 : 0; r.owner = r.key >= 0 ? succ(r.nodes, r.key) : -1; ringShow();
      return reply(`${cmd === "JOIN" ? "Joined" : "Left"}: ${n}. Peers at ${list().join(", ")}.`, r.key >= 0 ? `Key ${r.key} now belongs to peer ${r.owner}.` : "Keys move to the next peer round the ring.");
    }
    if (cmd === "LOOKUP") {
      const k = w.length === 2 ? integer(w[1], 0, 15) : -1;
      if (k < 0) return reply("LOOKUP needs one key from 0 to 15.");
      // From the lowest peer: jump by the furthest table entry (1, 2, 4 or 8 places ahead) that does not pass the key.
      let cur = succ(r.nodes, 0), path = `${cur}`, hops = 0;
      const owner = succ(r.nodes, k);
      while (cur !== owner && hops < 8) {
        const next = succ(r.nodes, (cur + 1) & 15);
        if (inside(k, cur, next)) { cur = next; }
        else {
          let jump = next;
          for (let s = 8; s >= 1; s >>= 1) { const f = succ(r.nodes, (cur + s) & 15); if (f !== cur && inside(f, cur, k) && f !== k) { jump = f; break; } }
          cur = jump;
        }
        path += ` > ${cur}`; hops++;
      }
      r.key = k; r.owner = owner; ringShow();
      return reply(`Key ${k}: route ${path}; ${hops} hop${hops === 1 ? "" : "s"}. Peer ${owner} holds it.`, "Finding a peer is not agreeing on a ledger: no vote, no ownership record, no double-spending check.");
    }
    return reply("NODES | LOOKUP k | JOIN n | LEAVE n | RESET");
  });

  // --- Hashcash work-stamp bench ----------------------------------------------------------------------------------
  const STAMP_CAP = 8192;
  const stampShow = () => { const a = S.stamp.attempts, lit = a ? Math.min(10, Math.ceil(Math.log2(a + 1))) : 0; for (let i = 0; i < 10; i++) S.n.meter[i].visible = i < lit; S.n.stampTile.visible = S.stamp.nonce >= 0; };
  const stampTerm = device("WORK-STAMP BENCH / costly to make, cheap to check (museum toy)",
    "Making a stamp takes many tries; checking it takes one.",
    ["Type TEXT and a short message.", "Type BITS 1 to 12 to choose how hard the stamp is.", "Type MAKE, then CHECK. Change the TEXT and CHECK again."],
    "STAMP>", "TEXT words | BITS 1..12 | MAKE | CHECK | RESET",
    ["The paper's idea: a cost-function verifiable cheaply but costly to compute. This toy mixer is NOT Hashcash's real hash."])((cmd, w, text) => {
    const s = S.stamp;
    if (cmd === "RESET") { s.text = "museum note"; s.bits = 8; s.nonce = -1; s.attempts = 0; stampShow(); return reply("Bench cleared. TEXT is 'museum note', BITS 8."); }
    if (cmd === "TEXT") { const t = text.replace(/^\S+\s*/, "").slice(0, 40); if (!t) return reply("TEXT needs a short message."); s.text = t; return reply(`Message: ${t}. The old stamp stays bound to its own message.`); }
    if (cmd === "BITS") { const b = w.length === 2 ? integer(w[1], 1, 12) : -1; if (b < 0) return reply("BITS needs a whole number from 1 to 12."); s.bits = b; return reply(`Target: a digest starting with ${b} zero bits. About ${2 ** b} tries on average.`); }
    if (cmd === "MAKE") {
      const n = search(seedOf(s.text), s.bits, STAMP_CAP);
      s.attempts = n < 0 ? STAMP_CAP : n + 1; s.nonce = n; s.digest = n < 0 ? 0 : mix(seedOf(s.text), n); s.boundText = s.text; s.boundBits = s.bits; stampShow();
      return n < 0 ? reply(`No stamp within ${STAMP_CAP} tries (the bench's limit). Lower BITS and MAKE again.`)
        : reply(`Stamp found after ${s.attempts} tries: nonce ${n}, digest ${hex(s.digest)}.`, "The meter's lit segments grow with the number of tries. Now CHECK: one try.");
    }
    if (cmd === "CHECK") {
      if (s.nonce < 0) return reply("MAKE a stamp first.");
      const ok = s.text === s.boundText && mix(seedOf(s.text), s.nonce) < 2 ** (32 - s.boundBits);
      return reply(ok ? "VALID: one try confirms the work for this message." : "INVALID: the stamp was made for different text.", "A service would still have to remember spent stamps; a stamp is not a shared payment history.");
    }
    return reply("TEXT words | BITS 1..12 | MAKE | CHECK | RESET");
  });

  // --- RPOW desk and its sealed cabinet ---------------------------------------------------------------------------
  const FP = { A: "7c41-9e02", B: "d3b8-1a6f" }, PUBLISHED = FP.A;
  const cabShow = () => { const c = S.cab, N = S.n; N.cabGreen.visible = c.compared && c.match; N.cabRed.visible = c.compared && !c.match; };
  const rpowTerm = device("RPOW EXCHANGE DESK / spent token in, fresh token out (museum toy)",
    "The server refuses any token it has already seen.",
    ["Type WORK to make a toy work token.", "Type EXCHANGE and its name, e.g. EXCHANGE W1.", "Try EXCHANGE W1 again: reuse is refused.", "Visit the sealed cabinet to see what you are trusting."],
    "RPOW>", "WORK | EXCHANGE name | WALLET | RESET",
    ["Context: Finney's 2004 announcement; not a whitepaper reference. No real tokens, keys or server."])((cmd, w) => {
    const r = S.rpow, c = S.cab;
    if (cmd === "RESET") { r.spent.length = 0; r.wallet.length = 0; r.made = r.issued = 0; return reply("Desk cleared."); }
    if (cmd === "WALLET") return reply(`Your tokens: ${r.wallet.length ? r.wallet.join(", ") : "none"}. Spent at the server: ${r.spent.length ? r.spent.join(", ") : "none"}.`);
    if (cmd === "WORK") {
      if (r.made >= 12) return reply("Toy limit: 12 work tokens a visit. RESET to start again.");
      r.made++; const name = `W${r.made}`; r.wallet.push(name);
      return reply(`Made ${name} (pretend work). EXCHANGE ${name} to swap it for a fresh signed token.`);
    }
    if (cmd === "EXCHANGE") {
      const name = (w[1] || "").slice(0, 6);
      if (!/^(W|R)\d{1,2}$/.test(name)) return reply("EXCHANGE needs a token name such as W1 or R1.");
      if (c.compared && !c.match) return reply("The cabinet's fingerprint no longer matches the published one: a careful user would not trust this server's tokens. Fix it at the cabinet (LOAD A).");
      if (r.spent.indexOf(name) >= 0) return reply(`REFUSED: ${name} was already exchanged. Inputs cannot be reused.`);
      const i = r.wallet.indexOf(name);
      if (i < 0) return reply(`You do not hold ${name}. WALLET lists yours.`);
      if (r.spent.length >= 24) return reply("Toy server full (24 records). RESET to start again.");
      r.wallet.splice(i, 1); r.spent.push(name); r.issued++; const out = `R${r.issued}`; r.wallet.push(out);
      return reply(`Accepted ${name}; issued fresh signed token ${out}. You can exchange ${out} later, once.`, "Everything rests on this one server running honestly, and staying up.");
    }
    return reply("WORK | EXCHANGE name | WALLET | RESET");
  });
  const cabTerm = device("SEALED CABINET / compare a code fingerprint (bounded museum demonstration)",
    "Before trusting the server, compare its code's fingerprint with the published one.",
    ["Type PUBLISHED to see the fingerprint the operator published.", "Type COMPARE: green means they match.", "Type LOAD B (changed code) and COMPARE again; LOAD A restores it."],
    "CABINET>", "PUBLISHED | COMPARE | LOAD A | LOAD B | RESET",
    ["This compares two fixed strings in a museum script. It is NOT real hardware attestation and checks no real device."])((cmd, w) => {
    const c = S.cab;
    if (cmd === "RESET") { c.loaded = "A"; c.compared = false; c.match = true; cabShow(); return reply("Cabinet reset: original code loaded, nothing compared yet."); }
    if (cmd === "PUBLISHED") return reply(`Published fingerprint: ${PUBLISHED}.`, "In RPOW's 2004 deployment, the secure coprocessor could report what software it ran, so users could check it.");
    if (cmd === "LOAD") {
      const v = w[1]; if (v !== "A" && v !== "B") return reply("LOAD A (the published code) or LOAD B (changed code).");
      c.loaded = v; c.compared = false; cabShow(); return reply(`Loaded code ${v}. COMPARE to check it.`);
    }
    if (cmd === "COMPARE") {
      c.compared = true; c.match = FP[c.loaded] === PUBLISHED; cabShow();
      return reply(`Cabinet reports ${FP[c.loaded]}; published ${PUBLISHED}: ${c.match ? "MATCH (green lamp)." : "MISMATCH (red lamp). The desk will refuse to exchange."}`,
        "You still trust the hardware's maker, the published code and the operator. The boundary moves; it does not vanish.");
    }
    return reply("PUBLISHED | COMPARE | LOAD A | LOAD B | RESET");
  });

  // --- Bit gold bench ---------------------------------------------------------------------------------------------
  const GOLD_MAX = 6, GOLD_BITS = 9, GOLD_CAP = 16384;
  const goldShow = () => { for (let i = 0; i < GOLD_MAX; i++) S.n.bars[i].visible = i < S.gold.chain.length; };
  const goldTerm = device("BIT GOLD BENCH / costly strings, chained, with recorded owners (museum toy)",
    "Each new string's puzzle comes from the last string made.",
    ["Type MINT: the bench solves a puzzle seeded by the last string.", "Type HARDWARE SLOW, then MINT again: compare the cost.", "Type OWNER and a name to record who holds the newest string; LIST shows the registry."],
    "GOLD>", "MINT | HARDWARE FAST or SLOW | OWNER name | LIST | RESET",
    ["The essay: the last-created string provides the challenge bits for the next. The toy mixer is not a real hash."])((cmd, w, text) => {
    const g = S.gold;
    if (cmd === "RESET") { g.chain.length = 0; g.hw = "FAST"; goldShow(); return reply("Registry cleared; hardware FAST."); }
    if (cmd === "HARDWARE") { const v = w[1]; if (v !== "FAST" && v !== "SLOW") return reply("HARDWARE FAST or HARDWARE SLOW."); g.hw = v; return reply(`Hardware ${v}: ${v === "SLOW" ? "each try costs 4 time units" : "each try costs 1 time unit"}.`); }
    if (cmd === "LIST") return reply(g.chain.length ? g.chain.map((c, i) => `#${i + 1} ${hex(c.digest)} owner ${c.owner} cost ${c.cost}`).join(" / ") : "No strings yet. MINT makes the first.");
    if (cmd === "OWNER") {
      const name = text.replace(/^\S+\s*/, "").slice(0, 16).replace(/[^A-Za-z0-9 ]/g, "");
      if (!g.chain.length) return reply("MINT a string first."); if (!name) return reply("OWNER needs a name.");
      g.chain[g.chain.length - 1].owner = name; return reply(`Registry: string #${g.chain.length} is held by ${name}.`, "Who keeps this registry, and why should everyone trust it? The essay leaves that design open.");
    }
    if (cmd === "MINT") {
      if (g.chain.length >= GOLD_MAX) return reply(`The shelf holds ${GOLD_MAX} strings. RESET to start again.`);
      const last = g.chain.length ? g.chain[g.chain.length - 1].digest : 0x5ec0de, seed = mix(last, 7777 + g.chain.length);
      const n = search(seed, GOLD_BITS, GOLD_CAP);
      if (n < 0) return reply("No solution within the bench's limit. MINT again.");
      const cost = (n + 1) * (g.hw === "SLOW" ? 4 : 1);
      g.chain.push({ digest: mix(seed, n), owner: "unowned", cost }); goldShow();
      return reply(`String #${g.chain.length}: ${n + 1} tries on ${g.hw} hardware, cost ${cost} time units; digest ${hex(g.chain[g.chain.length - 1].digest)}.`,
        "Strings made on different hardware, or at different times, cost different amounts: units are unequal.");
    }
    return reply("MINT | HARDWARE FAST or SLOW | OWNER name | LIST | RESET");
  });

  // --- BitTorrent piece mosaic ------------------------------------------------------------------------------------
  // Three toy peers each hold some of 12 pieces of an original picture.
  const PEERS = ["AMBER", "BLUE", "CORAL"], HOLD = [[0, 1, 2, 3, 4, 5], [4, 5, 6, 7, 8, 9], [8, 9, 10, 11, 0, 1]];
  const mosaicShow = () => { const m = S.mosaic; for (let i = 0; i < 12; i++) S.n.tiles[i].visible = !!m.have[i]; };
  const rarity = (p) => { let r = 0; for (const h of HOLD) if (h.indexOf(p) >= 0) r++; return r; };
  const mosaicTerm = device("PIECE MOSAIC / fetch an original picture in pieces from neighbours (museum toy)",
    "Pieces can come from different peers, so no one peer carries the whole upload.",
    ["Type PEERS to see who holds which pieces.", "Type FETCH AMBER, FETCH BLUE or FETCH CORAL to take one piece you lack.", "Fill all 12 tiles; STATUS shows who uploaded how much."],
    "MOSAIC>", "PEERS | FETCH peer | STATUS | RESET",
    ["No real files, trackers or network: three invented peers and an original picture."])((cmd, w) => {
    const m = S.mosaic;
    if (cmd === "RESET") { m.have.fill(0); m.uploads.fill(0); m.done = 0; mosaicShow(); return reply("Mosaic cleared."); }
    if (cmd === "PEERS") return reply(...PEERS.map((p, i) => `${p}: pieces ${HOLD[i].join(", ")}`));
    if (cmd === "STATUS") return reply(`You hold ${m.done}/12. Uploads: ${PEERS.map((p, i) => `${p} ${m.uploads[i]}`).join(", ")}.`, m.done === 12 ? "Picture complete. Copying pieces is not agreeing who owns them." : "FETCH more pieces.");
    if (cmd === "FETCH") {
      const i = PEERS.indexOf(w[1]);
      if (i < 0) return reply("FETCH AMBER, FETCH BLUE or FETCH CORAL.");
      // The rarest piece this peer has that you lack (fewest holders first), as a toy policy.
      let pick = -1;
      for (const p of HOLD[i]) if (!m.have[p] && (pick < 0 || rarity(p) < rarity(pick))) pick = p;
      if (pick < 0) return reply(`${PEERS[i]} has nothing you lack. Try another peer.`);
      m.have[pick] = 1; m.uploads[i]++; m.done++; mosaicShow();
      return reply(`${PEERS[i]} sent piece ${pick} (it chose the rarest piece you lacked). ${m.done}/12.`, m.done === 12 ? "Complete! STATUS shows how the uploading was shared." : "Close this window to watch the tiles fill.");
    }
    return reply("PEERS | FETCH peer | STATUS | RESET");
  });

  // --- GPS sharpening ---------------------------------------------------------------------------------------------
  const gpsShow = () => { const g = S.gps; for (const n of S.n.wide) n.visible = g.sa; for (const n of S.n.tight) n.visible = !g.sa; };
  const gpsTerm = device("POSITION FINDER / civil GPS fixes before and after 2 May 2000 (museum model)",
    "Watch the circle of uncertainty shrink when the deliberate blur stops.",
    ["Type DAY 1 for 1 May 2000, the announcement: the wide circle stays.", "Type DAY 2 for 2 May 2000, just after midnight EDT: the circle tightens.", "Type INFO for what the dates mark."],
    "GPS>", "DAY 1 | DAY 2 | INFO | RESET",
    ["The circles are illustrative. No improvement factor is claimed. No real receiver or satellite signal."])((cmd, w) => {
    const g = S.gps;
    if (cmd === "RESET") { g.sa = true; g.day = 1; gpsShow(); return reply("1 May 2000: wide circle."); }
    if (cmd === "INFO") return reply("1 May 2000: the United States announced it would stop Selective Availability, a deliberate degradation of civil GPS accuracy.", "2 May 2000, just after midnight EDT: the change took effect and civil fixes became more accurate.", "Context for this era, not a Bitcoin step.");
    if (cmd === "DAY") {
      const d = w.length === 2 ? integer(w[1], 1, 2) : -1; if (d < 0) return reply("DAY 1 or DAY 2.");
      g.day = d; g.sa = d === 1; gpsShow();
      return reply(d === 1 ? "1 May 2000: announcement day. Selective Availability still on: wide illustrative circle." : "2 May 2000, just after midnight EDT: Selective Availability off. Tighter illustrative circle.");
    }
    return reply("DAY 1 | DAY 2 | INFO | RESET");
  });

  // --- Volunteer encyclopedia kiosk -------------------------------------------------------------------------------
  const ARTICLE = "The Ooga river otter is a museum creature invented for this cave.";
  const wikiShow = () => { const n = S.wiki.revs.length; for (let i = 0; i < 8; i++) S.n.lines[i].visible = i < n; };
  const wikiTerm = device("VOLUNTEER ENCYCLOPEDIA / anyone may edit; every revision is kept (museum kiosk)",
    "Every change is kept, so a bad edit can be undone.",
    ["Type READ to see the article.", "Type EDIT and new text to change it.", "Type HISTORY, then REVERT and a number to bring an old version back."],
    "WIKI>", "READ | EDIT text | HISTORY | REVERT n | RESET",
    ["2001: a volunteer-written online encyclopedia launched that January. The article here is original sample text."])((cmd, w, text) => {
    const k = S.wiki;
    if (cmd === "RESET") { k.revs.length = 0; k.revs.push(ARTICLE); k.at = 0; wikiShow(); return reply("Article restored to revision 1."); }
    if (cmd === "READ") return reply(`Revision ${k.at + 1}: ${k.revs[k.at]}`);
    if (cmd === "HISTORY") return reply(...k.revs.map((r, i) => `${i + 1}${i === k.at ? " (current)" : ""}: ${r}`));
    if (cmd === "EDIT") {
      const t = text.replace(/^\S+\s*/, "").slice(0, 56); if (!t) return reply("EDIT needs new text.");
      if (k.revs.length >= 8) return reply("This kiosk keeps 8 revisions. RESET to start again.");
      k.revs.push(t); k.at = k.revs.length - 1; wikiShow(); return reply(`Saved as revision ${k.at + 1}. HISTORY lists them all.`);
    }
    if (cmd === "REVERT") {
      const n = w.length === 2 ? integer(w[1], 1, k.revs.length) : -1; if (n < 0) return reply(`REVERT needs a revision from 1 to ${k.revs.length}.`);
      if (k.revs.length >= 8) return reply("This kiosk keeps 8 revisions. RESET to start again.");
      k.revs.push(k.revs[n - 1]); k.at = k.revs.length - 1; wikiShow(); return reply(`Revision ${n} restored as revision ${k.at + 1}. Nothing was erased.`);
    }
    return reply("READ | EDIT text | HISTORY | REVERT n | RESET");
  });

  // --- Pocket hard-disk music player (silent) ---------------------------------------------------------------------
  const TRACKS = [["Two-note call", 2], ["Work pulse", 3], ["Plucked rain", 2], ["Rising four", 4], ["Soft drum loop", 3], ["Warm keys", 2]];
  const PLAYER_CAP = 10;
  const playerShow = () => { const p = S.player; for (let i = 0; i < PLAYER_CAP; i++) S.n.cap[i].visible = i < p.used; };
  const playerTerm = device("POCKET PLAYER / a disk in your pocket (original museum model; it makes no sound)",
    "Fill the capacity bar with synthesized sound packets.",
    ["Type LIST to see the packets and their sizes.", "Type UP or DOWN to move the cursor, ADD to load it, DROP to unload it.", "Watch the capacity bar; it is a toy, not to scale."],
    "PLAYER>", "LIST | UP | DOWN | ADD | DROP | RESET",
    ["Announced 23 October 2001; available 10 November 2001. Packets are named patterns, not recordings; the cave's shared music keeps playing."])((cmd) => {
    const p = S.player;
    const row = () => `> ${TRACKS[p.cursor][0]} (${TRACKS[p.cursor][1]} units)${p.loaded[p.cursor] ? " loaded" : ""}`;
    if (cmd === "RESET") { p.loaded.fill(0); p.used = 0; p.cursor = 0; playerShow(); return reply("Player emptied.", row()); }
    if (cmd === "LIST") return reply(...TRACKS.map((t, i) => `${i === p.cursor ? ">" : " "} ${t[0]}: ${t[1]} units${p.loaded[i] ? " (loaded)" : ""}`), `Used ${p.used}/${PLAYER_CAP} units.`);
    if (cmd === "UP" || cmd === "DOWN") { p.cursor = (p.cursor + (cmd === "UP" ? TRACKS.length - 1 : 1)) % TRACKS.length; return reply(row()); }
    if (cmd === "ADD") {
      if (p.loaded[p.cursor]) return reply("Already loaded.", row());
      const size = TRACKS[p.cursor][1]; if (p.used + size > PLAYER_CAP) return reply(`Not enough room: ${p.used}/${PLAYER_CAP} used. DROP something first.`);
      p.loaded[p.cursor] = 1; p.used += size; playerShow(); return reply(`Loaded. Used ${p.used}/${PLAYER_CAP}.`, row());
    }
    if (cmd === "DROP") {
      if (!p.loaded[p.cursor]) return reply("That packet is not loaded.", row());
      p.loaded[p.cursor] = 0; p.used -= TRACKS[p.cursor][1]; playerShow(); return reply(`Unloaded. Used ${p.used}/${PLAYER_CAP}.`, row());
    }
    return reply("LIST | UP | DOWN | ADD | DROP | RESET");
  });

  // --- Loft routing puzzle (2001-inspired, original) --------------------------------------------------------------
  const routeTerm = device("ROUTING PUZZLE / reach place 23 on a 32-place ring in few jumps (original game)",
    "Jumps double in size: 1, 2, 4, 8 or 16 places. The best route needs only a few.",
    ["Type JUMP and a size (1, 2, 4, 8 or 16).", "Reach place 23 without passing it.", "RESET for another go; the best score is 4 jumps."],
    "ROUTE>", "JUMP 1|2|4|8|16 | STATUS | RESET")((cmd, w) => {
    const r = S.route;
    if (cmd === "RESET") { r.at = 0; r.hops = 0; r.solved = false; return reply("At place 0. Target 23."); }
    if (cmd === "STATUS") return reply(`At place ${r.at}; ${r.hops} jumps; target ${r.target}.`);
    if (cmd === "JUMP") {
      const s = w.length === 2 ? integer(w[1], 1, 16) : -1;
      if (s < 0 || (s & (s - 1))) return reply("JUMP 1, 2, 4, 8 or 16.");
      if (r.solved) return reply("Solved! RESET to play again.");
      if (r.at + s > r.target) return reply(`That passes ${r.target}. Try a smaller jump.`);
      if (r.hops >= 12) return reply("Out of jumps. RESET to try again.");
      r.at += s; r.hops++; r.solved = r.at === r.target;
      return reply(r.solved ? `Arrived in ${r.hops} jumps${r.hops === 4 ? ": the best possible!" : ". The best is 4."}` : `At place ${r.at}; ${r.hops} jump${r.hops === 1 ? "" : "s"}.`);
    }
    return reply("JUMP 1|2|4|8|16 | STATUS | RESET");
  });

  // --- Words ------------------------------------------------------------------------------------------------------
  const TRUST = [
    "Hashcash (2002 paper): work is costly to make and cheap to check; a service still remembers spent stamps.",
    "RPOW (2004 announcement): tokens become reusable through one server whose code fingerprint can be compared; you trust that server and its hardware.",
    "Bit gold (December 2005, qualified): chained costly strings and an ownership registry; units are unequal and the registry's design stays open."
  ];
  const PEERS_TEXT = "Chord (2001) finds the peer that holds a key; BitTorrent's 2003 paper shares file pieces. Neither is a money ledger, and Bitcoin does not use Chord.";
  BL.genesisExhibits.register(5, {
    sources,
    overview: {
      summary: "2000-2007: computers learned to find each other and share files, while inventors tried reusable work tokens and costly digital objects. Sharing a file is not agreeing who owns money. Each bench here solved something and left something open.",
      sourceKeys: ["E5-CHORD", "E5-BT", "E5-HC", "E5-RPOW", "E5-BG", "E5-ATTR"],
      pages: [
        { caption: "Explore", title: "A workshop of competing ideas", text: [
          "Left bank: four idea benches. Each lectern has the paper's story; each toy beside it lets you try the idea. Right bank: a peer-sharing bench and period gear.",
          PEERS_TEXT, "Every toy has HELP, a hint and How to use steps, and RESET starts it again."] },
        { caption: "How to read it", title: "Citation, influence, context", text: [
          "Whitepaper citation: the 2002 Hashcash paper is the whitepaper's reference [6]. Documented influence: bit gold, named in Satoshi's retrospective 20 July 2010 post.",
          "Everything else is context: part of these years, not something the whitepaper cites or is shown to have drawn on.",
          "Dates say what they mark: a paper, an announcement, a conference or a change."] },
        { caption: "Trust boundaries", title: "Who must you trust?", text: [...TRUST,
          "Two lofts high on the back walls repeat this comparison and hold a routing puzzle: fly up with the jetpack (hold Space in the air). Everything you need is down here too."] }
      ]
    },
    build(kit) {
      S = fresh();
      for (const k of RING0) S.ring.nodes[k] = 1;
      S.wiki.revs.push(ARTICLE);
      const { era, top, solid, sign, obstacle, prop } = kit;
      const N = S.n = { pillars: [], caps: [], slot: new Float32Array(32), keyMark: null, meter: [], stampTile: null, cabGreen: null, cabRed: null, cabBusy: null,
        bars: [], tiles: [], wide: [], tight: [], lines: [], cap: [], sats: [], satR: 0, satX: 0, satZ: 0, satY: 0, beacon: null, ringX: 0, ringZ: 0 };
      const Z = (u) => era.z1 - u; // u: metres downstream from the way in
      // 2000s workshop palette: brushed silver, graphite, translucent sea-glass and powder blue, citrus accents.
      const C = { silver: "#b9c0c6", graphite: "#3a3f45", glass: "#7fc9c4", powder: "#9cb8d8", citrus: "#d9e36a", bench: "#6a6f74", mat: "#2f3a44", gold: "#e8c35a", ivory: "#e9e6dc" };
      // A bench: a graphite top on silver legs, an obstacle under it, a sign above.
      const bench = (x, z, w, d, title, sub) => {
        solid(w, 0.08, d, C.graphite, x, top + 0.92, z);
        for (const sx of [-1, 1]) for (const sz of [-1, 1]) solid(0.08, 0.88, 0.08, C.silver, x + sx * (w / 2 - 0.1), top + 0.44, z + sz * (d / 2 - 0.1));
        solid(w + 0.6, 0.02, d + 1.6, C.mat, x, top + 0.01, z + 0.5);
        obstacle(x - w / 2, x + w / 2, z - d / 2, z + d / 2);
        sign(title, sub, x, top + 2.7, z - d / 2 + 0.1, 0, 0.42);
      };
      // A paper lectern: a slanted reading desk, a lit edge in the bench's accent, an obstacle and a small sign.
      const lectern = (x, z, accent, title, sub) => {
        solid(0.5, 1.05, 0.5, C.silver, x, top + 0.525, z);
        solid(1.1, 0.06, 0.8, C.ivory, x, top + 1.1, z);
        solid(1.1, 0.05, 0.05, accent, x, top + 1.14, z + 0.4, 0.8);
        obstacle(x - 0.6, x + 0.6, z - 0.45, z + 0.45);
        sign(title, sub, x, top + 2.1, z + 0.1, 0, 0.36);
      };
      const toy = (id, year, date, title, keys, x, z, w, d, term) => prop({ id, year, date, connection: "context", title, label: `${title.toUpperCase()} · ${year}`, sourceKeys: keys,
        at: { x, y: top, z: z + d / 2 + 0.8 }, reach: 1.9, pick: { w, h: 1.8, d: d + 0.4, x, z }, onUse: () => ({ terminal: term }) });
      const desk = (def, x, z) => prop({ ...def, at: { x, y: top, z: z + 1.25 }, reach: 1.8, pick: { w: 1.2, h: 2, d: 1, x, z } });

      // === Left bank: the idea benches (x = 0.25 - v) ===========================================================
      // Chord, u 20. Ring of 16 tiles on a round-ish table; a pillar on each place a peer holds.
      {
        const z = Z(20), lx = -8.5, bx = -19.5;
        lectern(lx, z, C.glass, "CHORD · AUG 2001", "conference paper - context");
        desk({ id: "e5-chord", year: 2001, connection: "context", date: "27-31 August 2001: the SIGCOMM conference dates printed on the Chord paper; not when all such lookup systems began",
          title: "Chord: find the right peer", label: "CHORD · AUGUST 2001", sourceKeys: ["E5-CHORD"],
          onUse: paper("Chord - August 2001", ["E5-CHORD"],
            ["Find the peer holding your key", "Chord, a conference paper from August 2001, gives a way to find which computer holds a piece of information, even while computers join and leave.", "In its words: \"given a key, it maps the key onto a node.\""],
            ["A lookup, not a ledger", "27-31 August 2001 are the SIGCOMM conference dates printed on the paper. They do not mark when all such lookup systems began.",
              "Chord locates information across changing peers. Its relationship to Bitcoin here is context, not a demonstrated borrowing: Bitcoin does not use Chord."],
            ["Finding is not agreeing", "Lookup alone does not agree who owns something or prevent the same coin being spent twice.", "Try the ring toy beside this lectern: LOOKUP a key, then JOIN or LEAVE a peer."]) }, lx, z);
        bench(bx, z, 4.6, 3.2, "CHORD RING TOY · 2001", "LOOKUP a key / JOIN / LEAVE");
        N.ringX = bx; N.ringZ = z;
        for (let i = 0; i < 16; i++) {
          const a = i / 16 * Math.PI * 2, x = bx + Math.sin(a) * 1.3, tz = z - Math.cos(a) * 1.25;
          N.slot[i * 2] = x; N.slot[i * 2 + 1] = tz;
          solid(0.26, 0.04, 0.26, i % 4 ? C.powder : C.ivory, x, top + 0.98, tz);
          const p = solid(0.16, 0.36, 0.16, C.glass, x, top + 1.18, tz, 0.4); p.visible = !!S.ring.nodes[i]; N.pillars.push(p);
          const c = solid(0.2, 0.06, 0.2, C.gold, x, top + 1.4, tz, 1); c.visible = false; N.caps.push(c);
        }
        N.keyMark = solid(0.12, 0.5, 0.12, C.citrus, bx, top + 1.3, z, 1); N.keyMark.visible = false;
        N.beacon = solid(0.14, 0.14, 0.14, C.citrus, bx, top + 1.05, z - 1.25, 0.9);
        toy("e5-ring", 2001, "2001: the year of the Chord paper this toy illustrates; an original museum model", "Chord ring toy", ["E5-CHORD"], bx, z, 4.6, 3.2, ringTerm);
      }
      // Hashcash, u 31: the 2002 work-stamp manual and a stamp bench.
      {
        const z = Z(31), lx = -8.5, bx = -19.5;
        lectern(lx, z, C.gold, "HASHCASH · 1 AUG 2002", "the paper cited as [6]");
        desk({ id: "e5-hashcash", year: 2002, connection: "citation", ref: "[6]", date: "1 August 2002: the date printed on Adam Back's paper (the 1997 announcement is in Era 4)",
          title: "Hashcash: the work-stamp manual", label: "HASHCASH PAPER · 1 AUGUST 2002", sourceKeys: ["E5-HC", "whitepaper"],
          onUse: paper("Hashcash paper - 1 August 2002", ["E5-HC", "whitepaper"],
            ["Costly to make, cheap to check", "Adam Back's paper, dated 1 August 2002, collects and analyses computational cost-functions and the uses of Hashcash.",
              "It says: \"A cost-function should be efficiently verifiable, but parameterisably expensive to compute.\""],
            ["An older idea, a later paper", "The earlier Hashcash announcement, 28 March 1997, stands in Era 4. This 2002 paper is the one the Bitcoin whitepaper lists as reference [6], and its proof-of-work section builds on the idea.",
              "The paper itself recalls May 1997 as the start; the museum keeps the separately sourced March 1997 announcement date for Era 4."],
            ["Stamps are not a ledger", "A service still has to check and remember spent stamps.", "A stamp proves work was done for one message; it is not a shared payment history that strangers agree on."]) }, lx, z);
        bench(bx, z, 4, 2.4, "WORK-STAMP BENCH · 2002", "MAKE a stamp / CHECK it");
        for (let i = 0; i < 10; i++) { const m = solid(0.28, 0.12 + i * 0.05, 0.28, i < 7 ? C.glass : C.citrus, bx - 1.5 + i * 0.33, top + 1.02 + (0.12 + i * 0.05) / 2, z - 0.6, 0.5); m.visible = false; N.meter.push(m); }
        N.stampTile = solid(0.7, 0.03, 0.5, C.gold, bx + 1.2, top + 0.98, z + 0.5, 0.7); N.stampTile.visible = false;
        toy("e5-stamp", 2002, "2002: the year of the Hashcash paper this toy illustrates; an original museum model", "Work-stamp bench", ["E5-HC"], bx, z, 4, 2.4, stampTerm);
      }
      // RPOW, u 45: the announcement lectern, the exchange desk and the sealed cabinet.
      {
        const z = Z(45), lx = -8.5, bx = -16, cx = -25;
        lectern(lx, z, C.powder, "RPOW · 15 AUG 2004", "announcement - context");
        desk({ id: "e5-rpow", year: 2004, connection: "context", date: "15 August 2004, 10:43:09 PDT: Hal Finney's announcement email",
          title: "RPOW: reuse a token", label: "RPOW · 15 AUGUST 2004", sourceKeys: ["E5-RPOW"],
          onUse: paper("RPOW - 15 August 2004", ["E5-RPOW"],
            ["Swap a used token for a fresh one", "Hal Finney announced RPOW on 15 August 2004; the email is stamped 10:43:09 PDT.",
              "It exchanges spent proof-of-work tokens for fresh signed tokens and rejects reuse of inputs: \"But they are reusable, unlike hashcash.\""],
            ["The server and its sealed hardware", "RPOW makes tokens reusable through a server. Its 2004 deployment used an IBM 4758 secure coprocessor, described as FIPS 140 level 4, whose software configuration could be attested.",
              "That dates its documented use, not the hardware's introduction. The cabinet beside this desk is a fictional model: it compares a fingerprint, and performs no real attestation."],
            ["Still one server", "It depends on an operating server and its attested trusted hardware; early beta resets could invalidate tokens.",
              "Context: RPOW is not a whitepaper reference, and no direct influence is claimed. It is not decentralised consensus."]) }, lx, z);
        bench(bx, z, 3.4, 2, "RPOW EXCHANGE DESK · 2004", "WORK / EXCHANGE / reuse refused");
        solid(0.9, 0.5, 0.6, C.silver, bx - 0.8, top + 1.21, z - 0.3); solid(0.3, 0.04, 0.4, C.graphite, bx - 0.8, top + 1.48, z);
        toy("e5-rpow-desk", 2004, "2004: the year of the RPOW announcement this toy illustrates; an original museum model", "RPOW exchange desk", ["E5-RPOW"], bx, z, 3.4, 2, rpowTerm);
        // Sealed cabinet: a generic graphite box, fictional indicator lights, a seal band.
        solid(1.8, 2.4, 1.2, C.graphite, cx, top + 1.2, z);
        solid(1.84, 0.12, 1.24, C.silver, cx, top + 1.6, z);
        solid(0.5, 0.3, 0.04, "#13181d", cx - 0.4, top + 2.0, z + 0.62);
        N.cabGreen = solid(0.14, 0.14, 0.04, "#5ef08a", cx + 0.3, top + 2.0, z + 0.63, 1.2); N.cabGreen.visible = false;
        N.cabRed = solid(0.14, 0.14, 0.04, "#ff6a5e", cx + 0.55, top + 2.0, z + 0.63, 1.2); N.cabRed.visible = false;
        N.cabBusy = solid(0.08, 0.08, 0.04, C.citrus, cx - 0.7, top + 1.25, z + 0.63, 1);
        for (let i = 0; i < 6; i++) solid(1.4, 0.04, 0.02, "#2a2e33", cx, top + 0.4 + i * 0.12, z + 0.61);
        obstacle(cx - 1, cx + 1, z - 0.7, z + 0.7);
        sign("SEALED SERVER CABINET · 2004", "fingerprint comparison demo - not real attestation", cx, top + 3.1, z + 0.6, 0, 0.42);
        prop({ id: "e5-cabinet", year: 2004, connection: "context", date: "2004: RPOW's documented use of a secure coprocessor, not that hardware's introduction; the comparison is a museum demonstration",
          title: "Sealed server cabinet", label: "SEALED SERVER CABINET · 2004", sourceKeys: ["E5-RPOW"],
          at: { x: cx, y: top, z: z + 1.6 }, reach: 1.9, pick: { w: 2, h: 2.6, d: 1.4, x: cx, z }, onUse: () => ({ terminal: cabTerm }) });
      }
      // Bit gold, u 60: the essay lectern (clear of the lamp by x -8, u 57) and the bench of chained strings.
      {
        const z = Z(61), lx = -11.5, bx = -21;
        lectern(lx, z, C.gold, "BIT GOLD · DEC 2005", "qualified date - documented influence");
        desk({ id: "e5-bitgold", year: 2005, connection: "influence",
          date: "December 2005, qualified: SNI dates the text 29 December 2005, while the author's current page displays 27 December 2008; influence documented by Satoshi's retrospective post of 20 July 2010",
          title: "Bit gold: costly bits, recorded owners", label: "BIT GOLD · DECEMBER 2005 (QUALIFIED)", sourceKeys: ["E5-BG", "E5-BG-AUTHOR", "E5-ATTR"],
          onUse: paper("Bit gold - December 2005 qualified", ["E5-BG", "E5-BG-AUTHOR", "E5-ATTR"],
            ["Costly bits, recorded owners", "Nick Szabo's bit gold proposal combines work, timestamps and an ownership registry for scarce digital objects.",
              "\"The last-created string of bit gold provides the challenge bits\" for the next one."],
            ["Why the date is qualified", "The Satoshi Nakamoto Institute dates its text 29 December 2005. The author's current page displays 27 December 2008, despite its 2005 address. So this plaque says December 2005, qualified.",
              "It is not shown here as a verified 1998 publication.",
              "Documented influence: Satoshi's retrospective forum post of 20 July 2010 calls Bitcoin an implementation of b-money and \"Nick Szabo's Bitgold proposal\". That later attribution does not show when any idea was met or borrowed."],
            ["Unequal units, open registry", "Different hardware and production periods make units unequal.", "Who keeps the ownership registry, and why it can be trusted, remain important design questions."]) }, lx, z);
        bench(bx, z, 4, 2.2, "BIT GOLD BENCH · 2005", "MINT / HARDWARE SLOW / OWNER");
        for (let i = 0; i < GOLD_MAX; i++) { const b = solid(0.42, 0.16, 0.24, C.gold, bx - 1.4 + i * 0.56, top + 1.04, z - 0.4, 0.6); b.visible = false; N.bars.push(b); }
        for (let i = 0; i < GOLD_MAX - 1; i++) solid(0.14, 0.03, 0.05, C.silver, bx - 1.12 + i * 0.56, top + 1.0, z - 0.4);
        toy("e5-bitgold-bench", 2005, "2005: the qualified year of the bit gold essay this toy illustrates; an original museum model", "Bit gold bench", ["E5-BG"], bx, z, 4, 2.2, goldTerm);
      }

      // === Right bank: the peer bench and period gear (x = 7.25 + v) =============================================
      // GPS sharpening, u 17: a receiver plinth with two illustrative circles and two slow satellites above.
      {
        const z = Z(17), x = 18;
        solid(1.4, 0.9, 1.4, C.silver, x, top + 0.45, z); solid(3.4, 0.03, 3.4, C.mat, x, top + 0.92, z);
        solid(0.5, 0.2, 0.3, C.graphite, x, top + 1.05, z + 0.9); solid(0.36, 0.12, 0.02, C.glass, x, top + 1.08, z + 1.06, 0.6);
        solid(0.12, 0.12, 0.12, C.citrus, x, top + 0.99, z, 1.1);
        for (let i = 0; i < 20; i++) {
          const a = i / 20 * Math.PI * 2;
          const wd = solid(0.18, 0.03, 0.18, "#e98d6a", x + Math.sin(a) * 1.5, top + 0.95, z + Math.cos(a) * 1.5, 0.7); N.wide.push(wd);
          const tt = solid(0.1, 0.03, 0.1, C.glass, x + Math.sin(a) * 0.45, top + 0.95, z + Math.cos(a) * 0.45, 0.9); tt.visible = false; N.tight.push(tt);
        }
        N.satX = x; N.satZ = z; N.satR = 1.6; N.satY = top + 3.3;
        for (let i = 0; i < 2; i++) { const s = solid(0.3, 0.12, 0.12, C.silver, x, N.satY, z, 0.3); N.sats.push(s); }
        obstacle(x - 1.7, x + 1.7, z - 1.7, z + 1.7);
        sign("GPS SHARPENS · MAY 2000", "announced 1 May / changed 2 May - illustrative circles", x, top + 2.4, z + 1.6, 0, 0.4);
        prop({ id: "e5-gps", year: 2000, connection: "context", date: "1 May 2000: the announcement; 2 May 2000, just after midnight EDT: the change took effect",
          title: "GPS sharpens", label: "GPS SHARPENS · MAY 2000", sourceKeys: ["E5-GPS"],
          at: { x, y: top, z: z + 2.5 }, reach: 1.9, pick: { w: 3.4, h: 1.6, d: 3.4, x, z }, onUse: () => ({ terminal: gpsTerm }) });
      }
      // Volunteer encyclopedia, u 17 further back: a kiosk with a flat screen on a pole.
      {
        const z = Z(17), x = 31;
        solid(1.2, 1.0, 0.8, C.powder, x, top + 0.5, z); solid(0.12, 0.8, 0.12, C.silver, x, top + 1.4, z);
        solid(1.4, 0.95, 0.08, C.graphite, x, top + 2.1, z + 0.05);
        solid(1.24, 0.8, 0.02, C.ivory, x, top + 2.1, z + 0.1, 0.5);
        for (let i = 0; i < 8; i++) { const l = solid(0.9 - (i % 3) * 0.15, 0.04, 0.01, C.graphite, x - 0.1, top + 2.42 - i * 0.085, z + 0.12); l.visible = i < 1; N.lines.push(l); }
        obstacle(x - 0.75, x + 0.75, z - 0.5, z + 0.5);
        sign("VOLUNTEER ENCYCLOPEDIA · 2001", "anyone may EDIT / every revision kept", x, top + 3.1, z + 0.2, 0, 0.4);
        prop({ id: "e5-wiki", year: 2001, connection: "context", date: "January 2001: the launch month of a volunteer-written online encyclopedia; no exact day is claimed",
          title: "Volunteer encyclopedia", label: "VOLUNTEER ENCYCLOPEDIA · 2001", sourceKeys: ["E5-WIKI"],
          at: { x, y: top, z: z + 1.3 }, reach: 1.9, pick: { w: 1.6, h: 2.8, d: 1, x, z }, onUse: () => ({ terminal: wikiTerm }) });
      }
      // Pocket music player, u 34 (behind the right lamp at x 22, u 36): a big generic box with arrow buttons.
      {
        const z = Z(32), x = 30;
        solid(2.4, 0.9, 1.4, C.bench, x, top + 0.45, z);
        solid(0.9, 1.4, 0.24, C.ivory, x, top + 1.6, z);
        solid(0.7, 0.5, 0.02, "#22323c", x, top + 1.98, z + 0.13, 0.4);
        for (const [bx2, by2] of [[0, 0.22], [0, -0.22], [-0.22, 0], [0.22, 0]]) solid(0.12, 0.12, 0.03, C.silver, x + bx2, top + 1.32 + by2, z + 0.13);
        solid(0.14, 0.14, 0.03, C.citrus, x, top + 1.32, z + 0.13, 0.6);
        for (let i = 0; i < PLAYER_CAP; i++) { const c = solid(0.055, 0.05, 0.01, C.glass, x - 0.27 + i * 0.06, top + 1.8, z + 0.145, 0.9); c.visible = false; N.cap.push(c); }
        obstacle(x - 1.2, x + 1.2, z - 0.7, z + 0.7);
        sign("POCKET DISK PLAYER · 2001", "announced 23 Oct / available 10 Nov - silent model", x, top + 3, z + 0.3, 0, 0.4);
        prop({ id: "e5-player", year: 2001, connection: "context", date: "23 October 2001: announcement; 10 November 2001: availability",
          title: "Pocket disk player", label: "POCKET DISK PLAYER · 2001", sourceKeys: ["E5-GEAR"],
          at: { x, y: top, z: z + 1.5 }, reach: 1.9, pick: { w: 2.4, h: 2.4, d: 1.4, x, z }, onUse: () => ({ terminal: playerTerm }) });
      }
      // BitTorrent, u 48: the paper lectern by the water and the piece mosaic behind it.
      {
        const z = Z(48), lx = 16, bx = 27;
        lectern(lx, z, C.glass, "BITTORRENT PAPER · 22 MAY 2003", "paper date, not launch - context");
        desk({ id: "e5-bittorrent", year: 2003, connection: "context", date: "22 May 2003: the date printed on Bram Cohen's technical paper, not BitTorrent's launch date",
          title: "BitTorrent: share the pieces", label: "BITTORRENT PAPER · 22 MAY 2003", sourceKeys: ["E5-BT"],
          onUse: paper("BitTorrent paper - 22 May 2003", ["E5-BT"],
            ["Share the pieces", "Bram Cohen's technical paper, dated 22 May 2003, describes downloaders who \"upload pieces of the file to each other\".",
              "22 May 2003 is the date printed on the paper, not BitTorrent's launch date, which this museum does not give."],
            ["Spreading the cost of uploading", "Downloaders exchange file pieces and spread the upload costs among themselves, instead of one server sending everything.",
              "Like Chord, this is context for Bitcoin: no demonstrated borrowing is claimed here."],
            ["Copies are not consensus", "File replication does not provide monetary consensus.", "Everyone can hold the same pieces and still disagree about who owns a coin."]) }, lx, z);
        bench(bx, z, 4.2, 2.6, "PIECE MOSAIC · 2003", "FETCH pieces from three peers");
        const art = ["#e98d6a", "#e8c35a", "#7fc9c4", "#9cb8d8", "#d9e36a", "#c58fc9"];
        for (let i = 0; i < 12; i++) {
          const tx = bx - 1.25 + (i % 4) * 0.83, tz = z - 0.65 + Math.floor(i / 4) * 0.62;
          solid(0.74, 0.02, 0.54, C.mat, tx, top + 0.97, tz);
          const t = solid(0.7, 0.04, 0.5, art[(i * 5 + Math.floor(i / 4)) % 6], tx, top + 1.0, tz, 0.5); t.visible = false; N.tiles.push(t);
        }
        for (let i = 0; i < 3; i++) solid(0.5, 0.7, 0.4, [C.gold, C.powder, "#e98d6a"][i], bx + 2.8, top + 0.35, z - 1 + i, 0.2);
        obstacle(bx + 2.5, bx + 3.1, z - 1.3, z + 1.3);
        toy("e5-mosaic", 2003, "2003: the year of the BitTorrent paper this toy illustrates; an original museum model", "Piece mosaic", ["E5-BT"], bx, z, 4.2, 2.6, mosaicTerm);
      }

      // === The lofts: alcoves high on the back walls, reached with the jetpack ===================================
      // Each alcove: two silver columns down to the bank (with an obstacle), a shelf at 4.5 m, a back panel and a lit
      // lip. Its exhibit's use point hovers at the shelf, so it is used while flying; its words are in the overview.
      const loft = (x, z, side, accent) => {
        const sy = top + 4.5;
        for (const dz of [-1.3, 1.3]) { solid(0.3, 4.5, 0.3, C.silver, x, top + 2.25, z + dz); obstacle(x - 0.2, x + 0.2, z + dz - 0.2, z + dz + 0.2); }
        solid(2.2, 0.25, 3, C.graphite, x, sy - 0.125, z);
        solid(0.12, 2.4, 3, C.bench, x + side * 1.05, sy + 1.2, z);
        solid(0.08, 0.08, 3, accent, x - side * 1.08, sy + 0.02, z, 1);
        solid(0.08, 0.08, 2.9, accent, x + side * 1, sy + 2.4, z, 1);
        return sy;
      };
      {
        const x = -31, z = Z(40), sy = loft(x, z, -1, C.gold);
        solid(1.2, 0.8, 0.6, C.ivory, x - 0.3, sy + 0.4, z);
        for (let i = 0; i < 3; i++) solid(0.3, 0.3, 0.05, [C.gold, C.powder, C.citrus][i], x - 0.3 + (i - 1) * 0.36, sy + 0.95, z + 0.32, 0.6);
        sign("TRUST LOFT · 2002-2005", "fly up: who must you trust?", x + 0.4, sy + 1.9, z + 1.4, -Math.PI / 2, 0.36);
        sign("LOFT ABOVE · 2002-2005", "jetpack: hold Space in the air", x + 2.4, top + 2.2, z, -Math.PI / 2, 0.32);
        obstacle(x + 2.25, x + 2.55, z - 0.15, z + 0.15);
        solid(0.1, 1.9, 0.1, C.silver, x + 2.4, top + 0.95, z);
        prop({ id: "e5-loft-trust", year: 2002, connection: "context", date: "2002-2005: the Hashcash paper, the RPOW announcement and the bit gold essay, compared",
          title: "Trust loft: who must you trust?", label: "TRUST LOFT · 2002-2005", sourceKeys: ["E5-HC", "E5-RPOW", "E5-BG"],
          at: { x: x + 0.6, y: sy, z }, reach: 1.6, pick: { w: 2.2, h: 1.6, d: 3, x, z },
          onUse: () => ({ board: { room: "Trust loft - 2002 to 2005", sources: ["E5-HC", "E5-RPOW", "E5-BG"], pages: [
            { caption: "Compare", title: "Three benches, three boundaries", text: TRUST },
            { caption: "Still open", title: "The question they left", text: ["Each design moves trust somewhere: to a service's spent list, to one server and its hardware, or to a registry not yet designed.",
              "None of these shows Bitcoin was inevitable. The same comparison is on the overview board by the gateway."] }
          ] } }) });
      }
      {
        const x = 39.5, z = Z(58), sy = loft(x, z, 1, C.glass);
        for (let i = 0; i < 5; i++) solid(0.24, 0.24, 0.24, i === 4 ? C.citrus : C.powder, x - 0.2, sy + 0.12, z - 1.1 + i * 0.55, 0.5);
        sign("ROUTING LOFT · 2001", "fly up: an original routing puzzle", x - 0.4, sy + 1.9, z + 1.4, Math.PI / 2, 0.36);
        sign("LOFT ABOVE · 2001", "jetpack: hold Space in the air", x - 2.4, top + 2.2, z, Math.PI / 2, 0.32);
        obstacle(x - 2.55, x - 2.25, z - 0.15, z + 0.15);
        solid(0.1, 1.9, 0.1, C.silver, x - 2.4, top + 0.95, z);
        prop({ id: "e5-loft-route", year: 2001, connection: "context", date: "2001: the year of the Chord paper that inspired this original puzzle; not a historical game",
          title: "Routing loft puzzle", label: "ROUTING LOFT · 2001", sourceKeys: ["E5-CHORD"],
          at: { x: x - 0.6, y: sy, z }, reach: 1.6, pick: { w: 2.2, h: 1.6, d: 3, x, z }, onUse: () => ({ terminal: routeTerm }) });
      }

      // === Decor: low 2000s workshop dressing, kept back from the water and off the sightlines =====================
      // Cable trays along both back walls at 2.8 m, with sea-glass and citrus cable runs; wall-mounted flat panels.
      for (const [x, s] of [[-32.6, 1], [40.6, -1]]) {
        for (const u of [14, 26, 50, 66]) {
          const z = Z(u);
          solid(0.5, 0.06, 6, C.silver, x, top + 2.8, z);
          solid(0.08, 0.05, 5.8, C.glass, x - s * 0.1, top + 2.86, z, 0.4);
          solid(0.08, 0.05, 5.8, C.citrus, x + s * 0.1, top + 2.86, z, 0.3);
          solid(0.06, 1.1, 1.6, C.graphite, x, top + 1.6, z);
          solid(0.02, 0.9, 1.4, C.powder, x + s * 0.04, top + 1.6, z, 0.35);
          obstacle(x - 0.3, x + 0.3, z - 0.8, z + 0.8);
        }
      }
      // A low shelf of jewel-case spindles and translucent boxes on each bank's far end.
      for (const [x, z] of [[-26, Z(68)], [33, Z(68)]]) {
        solid(3, 0.6, 1, C.bench, x, top + 0.3, z);
        for (let i = 0; i < 5; i++) solid(0.4, 0.3 + (i % 3) * 0.15, 0.4, [C.glass, C.powder, C.citrus, C.ivory, C.glass][i], x - 1.1 + i * 0.55, top + 0.6 + (0.3 + (i % 3) * 0.15) / 2, z);
        obstacle(x - 1.5, x + 1.5, z - 0.5, z + 0.5);
      }
      ringShow(); stampShow(); cabShow(); goldShow(); mosaicShow(); gpsShow(); wikiShow(); playerShow();
    },
    // Decoration only: the ring's beacon circles, the satellites drift and the cabinet's busy lamp blinks.
    // Calm holds all of it still; an open panel holds the blinking lamp steady. No allocation.
    update(dt, elapsed, state) {
      if (!S || !S.n) return;
      const N = S.n, calm = !!(state && state.calm), reading = !!(state && state.reading);
      if (calm) {
        N.beacon.position.x = N.ringX; N.beacon.position.z = N.ringZ - 1.25;
        N.sats[0].position.x = N.satX - N.satR; N.sats[1].position.x = N.satX + N.satR;
        N.sats[0].position.z = N.sats[1].position.z = N.satZ;
        N.cabBusy.visible = true;
        return;
      }
      const a = elapsed * 0.6;
      N.beacon.position.x = N.ringX + Math.sin(a) * 1.25; N.beacon.position.z = N.ringZ - Math.cos(a) * 1.25;
      const b = elapsed * 0.15;
      N.sats[0].position.x = N.satX + Math.cos(b) * N.satR; N.sats[0].position.z = N.satZ + Math.sin(b) * N.satR;
      N.sats[1].position.x = N.satX - Math.cos(b) * N.satR; N.sats[1].position.z = N.satZ - Math.sin(b) * N.satR;
      N.cabBusy.visible = reading || (elapsed % 1.6) < 1.1;
    },
    // Nothing outlives a frame (no sound, timers or scheduled work); leaving or returning settles the decoration.
    active() { if (S && S.n) S.n.cabBusy.visible = true; },
    dispose() { S = null; }
  });
})();
