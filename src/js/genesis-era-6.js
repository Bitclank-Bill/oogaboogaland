// Era 6's cave in the Genesis Voyage, The Whitepaper (31 October 2008): a reading room, not a launch party. Built
// through the shared exhibit kit (genesis-exhibits.js; rules in docs/genesis-voyage/EXHIBIT-CONTRACT.md). Words come
// from the Era 6 dossier (docs/genesis-voyage/eras/era-6-the-whitepaper.md on gv/research), whose entries are all
// ready for draft exhibits; the domain-registration record is on hold and is left out. Quoted passages are the
// dossier's own; everything else is the museum's plain summary, never a quotation.
//
// Left bank, from the way in: the announcement (context), the paper's reading desk (the anchor, the only trail stop
// here), the eight-slot reference shelf (one slot per numbered reference, each a pointer to the cave that tells that
// work's story; the slots are not trail stops, so the trail keeps one stop per paper) with optional upper shelves for
// flyers, and an original unbranded 2008 laptop at a reference desk (a sorting game). Right bank: two conflicting
// payments (a simplified teaching model of what a signature alone cannot decide), the reading corner (three context
// stations whose commands change their own models: the "assemble the argument" teaching game, the paper's document
// layout and a 2008-style reading workstation; docs/genesis-voyage/exhibits/era-6.md) and the unopened January door.
// `BL.genesisEra6` exposes the corner's pure rules and the paper's section data; genesis-era-6-argument.js plays the
// same game on the retro screen interface.
//
// No sound, no toasts and nothing that moves by itself: the laptop's cursor is the only blink, and it holds still
// while a panel or terminal is open or Calm is on. Nothing typed leaves the page.
(() => {
  "use strict";
  const BL = window.BL;
  const DOSSIER = "https://github.com/Bitcoin-Bill/oogaboogaland/blob/gv/research/docs/genesis-voyage/eras/era-6-the-whitepaper.md";
  const sources = {
    "E6-ANN": { label: "31 October 2008, 18:10 UTC: posting timestamp of the Cryptography mailing-list announcement, preserved by the Satoshi Nakamoto Institute",
      href: "https://satoshi.nakamotoinstitute.org/emails/cryptography/1/", kind: "context", verified: true },
    "E6-WP": { label: "Satoshi Nakamoto, Bitcoin: A Peer-to-Peer Electronic Cash System (PDF; the PDF prints no day of publication)",
      href: "https://bitcoin.org/bitcoin.pdf", kind: "the paper itself", verified: true },
    "E6-REL": { label: "8 January 2009, 19:27:40 UTC: the release announcement on the Cryptography mailing list, preserved by the Satoshi Nakamoto Institute",
      href: "https://satoshi.nakamotoinstitute.org/emails/cryptography/16/", kind: "context", verified: true },
    "E6-GEAR": { label: "14 October 2008: a manufacturer's announcement of a 13-inch aluminium laptop (2 GB memory, 160 GB drive, 1280 x 800 screen)",
      href: "https://www.apple.com/newsroom/2008/10/14New-MacBook-Family-Redefines-Notebook-Design/", kind: "context", verified: true },
    "E6-DOSSIER": { label: "Genesis Voyage Era 6 research dossier: corrections (eight numbered references; demonstrations are not security proofs)",
      href: DOSSIER, kind: "context", verified: true },
    // The reading corner's notes: what was checked against the paper's pages, and that its games are modern homages.
    "E6-CLUSTER": { label: "Era 6 exhibit notes: the reading corner (argument game, document layout, workstation), original museum designs and how their section data was checked",
      href: "https://github.com/Bitcoin-Bill/oogaboogaland/blob/gv/upgrade-era-6/docs/genesis-voyage/exhibits/era-6.md", kind: "context", verified: true }
  };
  const MODEL = "SIMPLIFIED TEACHING MODEL: not a wallet, not a consensus implementation and not a security proof. No real funds.";
  const clean = (text) => String(text).replace(/[\u0000-\u001f\u007f]/g, "").slice(0, 48).trim();
  const reply = (...lines) => ({ lines });
  const howTo = (steps) => ["HOW TO USE", ...steps.map((s, i) => `${i + 1}. ${s}`), ""];

  // --- The eight numbered references, as the paper's list gives them, and the cave that tells each story ---------
  // `keys`: the paper, then the other era's own source for that work where one is in the voyage. `where`: the cave.
  const CAVES = {
    0: "Era 0, Machines That Count (1956–1969)", 2: "Era 2, Trees and Blind Money (1980–1989)",
    3: "Era 3, Cypherpunks and Timestamps (1990–1995)", 4: "Era 4, Work and Scarcity (1996–1999)", 5: "Era 5, Peers and Reusable Work (2000–2007)"
  };
  const REFS = [
    { n: 1, year: 1998, who: "Wei Dai", work: "b-money", era: 4, keys: ["E6-WP", "E4-BM"],
      there: "Its station stands in Era 4's gallery, on its left side, with a STEP post beside it." },
    { n: 2, year: 1999, who: "Massias, Avila and Quisquater", work: "a secure timestamping service with minimal trust", era: 4, keys: ["E6-WP", "E4-TIMESEC"],
      there: "Its station stands in Era 4's gallery, on its left side, near the way in, with a STEP post beside it." },
    { n: 3, year: 1991, who: "Haber and Stornetta", work: "How to Time-Stamp a Digital Document", era: 3, keys: ["E6-WP", "haber1991"],
      there: "Its story is told at Fingerprints and Time's lectern, in Era 3's gallery, on its left side." },
    { n: 4, year: 1993, who: "Bayer, Haber and Stornetta", work: "more efficient and reliable digital time-stamping", era: 3, keys: ["E6-WP", "bayer1993"],
      there: "Its story is told at Fingerprints and Time's lectern, in Era 3's gallery, on its left side." },
    { n: 5, year: 1997, who: "Haber and Stornetta", work: "Secure Names for Bit-Strings", era: 4, keys: ["E6-WP", "E4-NAMES"],
      there: "Its station stands in Era 4's gallery, on its left side, near the way in, with a STEP post beside it." },
    { n: 6, year: 2002, who: "Adam Back", work: "Hashcash", era: 5, keys: ["E6-WP"],
      there: "Its year places it in Era 5's cave. Era 4 holds the separate 28 March 1997 Hashcash announcement." },
    { n: 7, year: 1980, who: "Ralph Merkle", work: "Protocols for Public Key Cryptosystems", era: 2, keys: ["E6-WP", "E2-MERKLE"],
      there: "Its Merkle-tree table stands in Era 2's cave, with a STEP post beside it." },
    { n: 8, year: 1957, who: "William Feller", work: "An Introduction to Probability Theory and Its Applications", era: 0, keys: ["E6-WP", "e0Feller"],
      there: "Its probability shelf stands in Era 0's gallery, on its left side, with a STEP post beside it." }
  ];
  // Navigation is explanatory only: no shelf slot moves the visitor.
  const GO_BACK = "This slot is a pointer, not a link. To visit, walk back round the museum to that era's gallery: each gallery's sign over its arch names its era and years, or open it from the timeline (G).";
  const NOT_LISTED = "The list has eight numbered entries. Chord, BitTorrent, RPOW and bit gold are not among them. \"Not listed\" means absent from the whitepaper's bibliography, not that no influence is documented: Era 5 explains bit gold's documented link through Satoshi's retrospective post of 20 July 2010. Any other influence claim needs its own evidence.";
  const slotBoard = (r) => ({ board: { room: `Reference ${r.n} - ${r.who.replace(/,/g, "")} - ${r.year}`, sources: r.keys, pages: [
    { caption: "In short", title: `Reference ${r.n}: ${r.year}`, text: [
      `Reference [${r.n}] in the whitepaper's list: ${r.who}, ${r.work}.`,
      `${r.year} is the year the paper's reference list gives for it, not the year the idea was invented. Other caves keep the finer dates.`] },
    { caption: "Where its story is", title: `Earlier in the museum: Era ${r.era}`, text: [`${CAVES[r.era]}. ${r.there}`, GO_BACK] },
    { caption: "Reading it", title: "A citation is not a copy", text: [
      "A citation shows the paper's author pointed readers to this work. It does not say the work was an unfinished Bitcoin, or that its authors were trying to build one.",
      "The slot stands here as part of the paper's own bibliography; it is not a separate step on the trail."] }
  ] } });

  // --- The anchor: the paper itself ---------------------------------------------------------------------------------
  const PAPER = { board: { room: "Bitcoin: A Peer-to-Peer Electronic Cash System - 2008", sources: ["E6-WP", "E6-ANN", "E6-REL", "E6-DOSSIER"], pages: [
    { caption: "In short", title: "A paper about a machine not yet running", text: [
      "Bitcoin: A Peer-to-Peer Electronic Cash System is a short paper by Satoshi Nakamoto. Its announcement is dated 31 October 2008; the PDF itself prints no date.",
      "It proposes a way for two people to pay each other online directly, without a bank or other trusted company in the middle.",
      "It was a proposal. No public Bitcoin network existed yet: software followed in January 2009, across the next doorway."] },
    { caption: "The deeper story", title: "The problem it takes on", text: [
      "Museum summary: a digital coin is only data, so copying it is easy. A signature can show its owner approved a payment, but not that the owner did not also pay someone else with the same coin.",
      "The paper's answer, in short: make payments public, and have the computers running the system keep one shared, time-ordered history. Each block of payments is linked to the one before it, as in the timestamp papers on the shelf, and adding a block costs computing work, as in Hashcash.",
      "Changing an old payment would mean redoing that work faster than everyone else adding new blocks. The paper's later sections estimate how unlikely that becomes as more blocks pile on, using probability from Feller's book."] },
    { caption: "Its assumptions", title: "What it relies on", text: [
      "Museum summary: the design relies on most of the computing power being run by honest participants, and on payments and blocks spreading widely between computers.",
      "It also relies on people choosing to run the software at all, with new coins and fees as their reward. The paper argues for these; it cannot show them."] },
    { caption: "Still unsolved", title: "Questions a paper cannot answer", text: [
      "A proposal is not deployment evidence. In October 2008 no one could yet see whether the software would work, whether anyone would run it, or how it would hold up against real attackers.",
      "An announcement does not demonstrate a functioning released network or prove real-world security. Those questions moved to January 2009 and after."] },
    { caption: "The reference shelf", title: "Eight numbered references", text: [
      "[1] Dai. [2] Massias, Avila and Quisquater. [3] Haber and Stornetta. [4] Bayer, Haber and Stornetta. [5] Haber and Stornetta. [6] Back. [7] Merkle. [8] Feller.",
      NOT_LISTED,
      "The paper is the anchor of this voyage, not one of its own references. Its eight slots stand on the shelf behind this desk."] }
  ] } };
  const ANNOUNCE = { board: { room: "The announcement - 31 October 2008", sources: ["E6-ANN", "E6-WP"], pages: [
    { caption: "In short", title: "31 October 2008 18:10 UTC", text: [
      "On 31 October 2008 Satoshi Nakamoto announced a paper about electronic cash on the Cryptography mailing list.",
      "18:10 UTC is the posting timestamp of that announcement as the Satoshi Nakamoto Institute's archive preserves it. The email points readers on: \"The paper is available at:\"."] },
    { caption: "The deeper story", title: "What the date marks", text: [
      "The timestamp dates this announcement. It is not the moment the paper was written, or first uploaded.",
      "The PDF itself carries no day of publication. The dated email is what anchors 31 October 2008 for the paper."] },
    { caption: "Still unsolved", title: "An announcement is not a launch", text: [
      "An announcement does not demonstrate a functioning released network or prove real-world security.",
      "Readers in 2008 could study a design. They could not yet run it."] }
  ] } };
  const JANUARY = { board: { room: "The January door - 8 January 2009 - not yet", sources: ["E6-REL", "E6-WP"], pages: [
    { caption: "In short", title: "A door to the future", text: [
      "This door previews a later date: 8 January 2009, 19:27:40 UTC, when an email announced the \"first release of Bitcoin\" software.",
      "From this cave's date, 31 October 2008, that is 69 days in the future. The door stays shut here."] },
    { caption: "The deeper story", title: "Three dates to keep apart", text: [
      "31 October 2008: the whitepaper's announcement (this cave). 3 January 2009: the genesis block's recorded timestamp. 8 January 2009: the software-release announcement.",
      "The next gallery, Genesis, covers 3 to 12 January 2009. It is the next one round the museum."] },
    { caption: "Still unsolved", title: "Early software", text: [
      "Early experimental software still required testing and fixes. A first release is not the end of the story."] }
  ] } };
  const UPPER = { board: { room: "Upper shelf - not in the 2008 bibliography", sources: ["E6-WP", "E6-DOSSIER"], pages: [
    { caption: "In short", title: "Not every famous name is a reference", text: [NOT_LISTED,
      "This upper shelf is optional. The same note is on the paper's desk below."] },
    { caption: "Reading it", title: "Citation is stronger than resemblance", text: [
      "Two ideas can look alike without one coming from the other. A numbered reference is evidence the paper's author pointed to a work; a resemblance alone is not.",
      "2008 is the year of the paper whose list this shelf checks."] }
  ] } };

  // --- Two conflicting payments: what a signature alone cannot decide (a simplified teaching model) -------------
  // A toy "signature" is a fixed checksum of the line, so both payments check out; ORDER puts them on one assumed
  // history and the first spend of the coin counts. Bounded: two payees, one coin, short input.
  let pay = null;
  const toySig = (text) => { let h = 7; for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) % 9973; return h; };
  const payLine = (who) => `Ana pays coin #8 to ${who}`;
  const payTerminal = () => ({
    banner: [MODEL, ...howTo(["Type SIGN BO, then SIGN CY: Ana signs the same toy coin to two people.", "Type CHECK: both signatures pass.",
      "Type ORDER BO CY or ORDER CY BO to put both on one shared history and see which counts.", "Type MORE, UNSOLVED or SOURCES to read; RESET starts again."]),
      "IN SHORT: a signature shows who approved a payment. It cannot say which of two payments of one coin came first. [E6-WP]"],
    prompt: "PAYMENTS>",
    run(line) {
      const parts = clean(line).toUpperCase().split(/\s+/), cmd = parts[0];
      if (cmd === "RESET") { pay.signed.BO = pay.signed.CY = false; pay.order = ""; return reply("Coin #8 is Ana's again. Nothing signed."); }
      if (cmd === "SIGN") {
        const who = parts[1];
        if (who !== "BO" && who !== "CY") return reply("SIGN BO or SIGN CY.");
        pay.signed[who] = true;
        return reply(`"${payLine(who === "BO" ? "Bo" : "Cy")}" signed: toy signature ${toySig(payLine(who))}.`);
      }
      if (cmd === "CHECK") {
        const done = ["BO", "CY"].filter((w) => pay.signed[w]);
        if (!done.length) return reply("Nothing signed yet. SIGN BO first.");
        return reply(...done.map((w) => `${payLine(w === "BO" ? "Bo" : "Cy")}: signature ${toySig(payLine(w))} VALID (toy check).`),
          done.length === 2 ? "Both pass. The signatures cannot tell Bo or Cy which payment counts. Try ORDER." : "Now SIGN the other payment with the same coin.");
      }
      if (cmd === "ORDER") {
        const a = parts[1], b = parts[2];
        if (!pay.signed.BO || !pay.signed.CY) return reply("SIGN BO and SIGN CY first.");
        if (!((a === "BO" && b === "CY") || (a === "CY" && b === "BO")) || parts.length > 3) return reply("ORDER BO CY or ORDER CY BO.");
        pay.order = a + b;
        const first = a === "BO" ? "Bo" : "Cy", second = a === "BO" ? "Cy" : "Bo";
        return reply(`Shared history: 1. Ana to ${first}: ACCEPTED. 2. Ana to ${second}: REJECTED, coin #8 already spent.`,
          "Everyone reading the same ordered history reaches the same answer. This toy simply assumes the order.",
          "How strangers agree on one order is what the paper's chain of work-backed blocks is for; this model does not show that part. [E6-WP]");
      }
      if (cmd === "MORE") return reply("THE DEEPER STORY: the paper keeps signatures for ownership and adds a public, time-ordered history to decide which spend came first.",
        "Each block of payments links to the one before, and adding one costs computing work, so rewriting history gets harder as blocks pile on. Museum summary, not a quotation. [E6-WP]");
      if (cmd === "UNSOLVED") return reply("STILL UNSOLVED in 2008: whether real computers on a real network would keep one history in practice. A proposal is not deployment evidence. [E6-WP, E6-REL]",
        "This model is a teaching aid and proves nothing about security.");
      if (cmd === "SOURCES") return reply(...["E6-WP", "E6-DOSSIER"].map((k) => `[${k}] ${sources[k].label} ${sources[k].href}`));
      return reply("SIGN BO | SIGN CY | CHECK | ORDER BO CY | MORE | UNSOLVED | SOURCES | RESET");
    }
  });

  // --- The 2008 laptop at the reference desk: sort cards by evidence, a zoom readout -----------------------------
  // Cards: the eight references and four names that are not in the list. FILE <card> CITED|NOT files one.
  const CARDS = [
    ...REFS.map((r) => ({ id: `R${r.n}`, name: `${r.who}, ${r.work} (${r.year})`, cited: r.n })),
    { id: "CHORD", name: "Chord", cited: 0 }, { id: "BITTORRENT", name: "BitTorrent", cited: 0 },
    { id: "RPOW", name: "RPOW", cited: 0 },
    { id: "BITGOLD", name: "bit gold", cited: 0, note: "\"Not listed\" means absent from the whitepaper's bibliography. Era 5 explains bit gold's documented link through Satoshi's retrospective 20 July 2010 post." }
  ];
  // --- The reading-corner cluster: the paper's own sections ----------------------------------------------------------
  // Section titles, the page each starts on and the reference numbers each cites are the paper's own, read off the
  // nine pages the site already ships (`whitepaper-pages-data.js`, rasterised from bitcoin.org/bitcoin.pdf); `role`
  // and `says` are the museum's plain labels and summaries, never quotations. Section 11 runs from page 6 to page 8.
  const SECTIONS = [
    { n: 1, title: "Introduction", page: 1, refs: [], role: "PROBLEM", says: "Online payments rely on trusted middlemen; the paper proposes a peer-to-peer timestamp server instead." },
    { n: 2, title: "Transactions", page: 2, refs: [1], role: "OWNERSHIP", says: "A coin passes from owner to owner by digital signatures, but a signature alone cannot show it was not spent twice." },
    { n: 3, title: "Timestamp Server", page: 2, refs: [2, 3, 4, 5], role: "ORDER", says: "Hash a block of items and publish the hash; each stamp includes the one before, so they form a chain." },
    { n: 4, title: "Proof-of-Work", page: 3, refs: [6], role: "COST", says: "Making a block takes computing work, so changing an old one means redoing its work and the work of every block after it." },
    { n: 5, title: "Network", page: 3, refs: [], role: "PROCESS", says: "The steps the computers follow: share payments, gather them into blocks, and keep extending the longest chain." },
    { n: 6, title: "Incentive", page: 4, refs: [], role: "ECONOMICS", says: "New coins and fees reward the computers doing the work, so playing by the rules pays better than cheating." },
    { n: 7, title: "Reclaiming Disk Space", page: 4, refs: [7, 2, 5], role: "EFFICIENCY", says: "Payments in a block are hashed into a Merkle tree, so old spent ones can be dropped without breaking the block." },
    { n: 8, title: "Simplified Payment Verification", page: 5, refs: [], role: "EFFICIENCY", says: "A user can check a payment with only the block headers and one branch of the tree, if honest computers run the network." },
    { n: 9, title: "Combining and Splitting Value", page: 5, refs: [], role: "FORMAT", says: "A payment can take several inputs and give at most two outputs: one to pay, one as change." },
    { n: 10, title: "Privacy", page: 6, refs: [], role: "PRIVACY", says: "Payments are public, but the keys need not name anyone; a new key for each payment helps." },
    { n: 11, title: "Calculations", page: 6, refs: [8], role: "ANALYSIS", says: "The chance that an attacker catches up falls away quickly as more blocks are added, worked out as a gambler's ruin." },
    { n: 12, title: "Conclusion", page: 8, refs: [], role: "SUMMARY", says: "Signatures give ownership; a proof-of-work chain stops double-spending; the network needs little structure." },
    { n: 13, title: "References", page: 9, refs: [1, 2, 3, 4, 5, 6, 7, 8], role: "SOURCES", says: "The eight numbered works the paper cites, shelved in this gallery." }
  ];
  const PAGES = 9;
  const sectionNamed = (word) => { const w = String(word || "").toUpperCase(); return w === "REFS" || w === "R" ? 12 : /^(1[0-2]|[1-9])$/.test(w) ? +w - 1 : -1; };
  const refList = (refs) => refs.length ? refs.map((r) => `[${r}]`).join(" ") : "none";
  const onPage = (p) => SECTIONS.filter((s) => s.page === p || (s.n === 11 && p >= 6 && p <= 8));
  // The argument game's six cards, in the paper's own section order (the answer: card k belongs in slot k). `tag` is
  // the card's four-letter name (the screen's box fits four letters), `line` its museum summary.
  const ARG = [
    { tag: "SIGN", sec: 2, line: "A coin passes on when its owner signs it over." },
    { tag: "TIME", sec: 3, line: "Stamp each batch in order, each stamp holding the last." },
    { tag: "WORK", sec: 4, line: "Make each stamp cost work, so rewriting is expensive." },
    { tag: "NODE", sec: 5, line: "Many computers keep extending the longest chain." },
    { tag: "COIN", sec: 6, line: "Reward that work with new coins and fees." },
    { tag: "ODDS", sec: 11, line: "Show how fast an attacker's chance of catching up falls." }
  ];
  // The game's rules, pure and allocation-free after creation, shared by the terminal and the screen game
  // (genesis-era-6-argument.js): `deal(seed)` shuffles the tray (mulberry32), `place`, `lift`, `check`.
  const createArgument = () => {
    const S = { seed: 1, solved: false, checks: 0, hints: 0, held: -1 };
    const slot = new Int8Array(6), where = new Int8Array(6), tray = new Uint8Array(6), mark = new Uint8Array(6), rng = new Uint32Array(1);
    const next = () => { rng[0] += 0x6d2b79f5; let t = rng[0]; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
    const deal = (seed) => {
      S.seed = seed >>> 0; rng[0] = S.seed;
      for (let i = 0; i < 6; i++) tray[i] = i;
      for (let i = 5; i > 0; i--) { const j = Math.floor(next() * (i + 1)), t = tray[i]; tray[i] = tray[j]; tray[j] = t; }
      slot.fill(-1); where.fill(-1); mark.fill(0); S.solved = false; S.checks = 0; S.hints = 0; S.held = -1;
    };
    const lift = (card) => { if (where[card] >= 0) { slot[where[card]] = -1; where[card] = -1; } mark.fill(0); S.solved = false; };
    // Puts `card` in slot `s`, sending whatever was there back to the tray; returns the displaced card or -1.
    const place = (card, s) => {
      lift(card);
      const was = slot[s];
      if (was >= 0) where[was] = -1;
      slot[s] = card; where[card] = s;
      return was;
    };
    const placed = () => { let n = 0; for (let i = 0; i < 6; i++) if (slot[i] >= 0) n++; return n; };
    // Marks each filled slot right (1) or wrong (2); returns how many are right.
    const check = () => {
      let right = 0;
      for (let s = 0; s < 6; s++) { mark[s] = slot[s] < 0 ? 0 : slot[s] === s ? 1 : 2; if (mark[s] === 1) right++; }
      S.checks++; S.solved = right === 6;
      return right;
    };
    deal(1);
    return { S, slot, where, tray, mark, deal, lift, place, placed, check };
  };
  // The paper's own arithmetic in section 7: an 80-byte header every 10 minutes, a year at a time.
  const HEADER_BYTES = 80, HEADERS_A_YEAR = 6 * 24 * 365, MEMORY_2008 = 2e9;
  const headerBytes = (years) => HEADER_BYTES * HEADERS_A_YEAR * years;
  const commas = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  BL.genesisEra6 = { SECTIONS, PAGES, ARG, createArgument, headerBytes, MEMORY_2008 };

  let desk = null, cursor = null, blink = 0;
  // The cluster's per-visit state and model nodes (`build` sets them, `dispose` drops them).
  let arg = null, lay = null, ws = null, argNodes = null, layNodes = null, wsNodes = null;
  const filed = () => desk.filed.reduce((n, f) => n + (f ? 1 : 0), 0);
  const laptopTerminal = () => ({
    banner: ["REFERENCE DESK / an original, unbranded 2008-style laptop. Not the author's computer.",
      ...howTo(["Type CARDS to list twelve reference cards.", "File each one: FILE R3 CITED, or FILE RPOW NOT.",
        "Type ZOOM 1, 2 or 3 to see what screen magnification does; INFO tells the laptop's story.", "RESET clears the desk. HINT helps if you are stuck."]),
      "IN SHORT: sort the cards into the paper's numbered references and names it does not list. [E6-WP]"],
    prompt: "DESK>",
    run(line) {
      const parts = clean(line).toUpperCase().split(/\s+/), cmd = parts[0];
      if (cmd === "RESET") { desk.filed.fill(0); desk.zoom = 1; return reply("Desk cleared. CARDS lists them again."); }
      if (cmd === "CARDS") return reply(...CARDS.map((c, i) => `${c.id.padEnd(10)} ${c.name}${desk.filed[i] ? "  [filed]" : ""}`), `${filed()}/12 filed.`);
      if (cmd === "HINT") return reply("Cards R1 to R8 are the eight entries of the paper's numbered list: CITED. The other four are not in the list: NOT.",
        "A famous name is not a citation. Check the list, not the resemblance.");
      if (cmd === "FILE") {
        const i = CARDS.findIndex((c) => c.id === parts[1]), pile = parts[2];
        if (i < 0 || (pile !== "CITED" && pile !== "NOT") || parts.length > 3) return reply("FILE <card> CITED or FILE <card> NOT. CARDS lists the cards.");
        const c = CARDS[i];
        if ((pile === "CITED") !== !!c.cited) return reply(c.cited ? `Not quite: ${c.name} is reference [${c.cited}] in the list.` : `Not quite: ${c.name} is not among the eight numbered references.`, "Your other cards stay filed.");
        desk.filed[i] = 1;
        return reply(c.cited ? `Filed: reference [${c.cited}]. Its slot on the shelf points to Era ${REFS[c.cited - 1].era}.` : c.note ? `Filed: not listed. ${c.note}` : `Filed: not listed. ${c.name} is not among the eight numbered references; any influence claim needs its own evidence.`,
          filed() === 12 ? "All twelve filed! Eight citations, four not listed." : `${filed()}/12 filed.`);
      }
      if (cmd === "ZOOM") {
        const z = Number(parts[1]);
        if (!/^[123]$/.test(parts[1] || "")) return reply("ZOOM 1, ZOOM 2 or ZOOM 3.");
        desk.zoom = z;
        return reply(`Zoom ${z}x: a 1280 x 800 screen shows ${1280 / z} x ${800 / z} pixels of the page, each drawn ${z} times wider.`,
          z === 1 ? "Everything fits; small text." : "Bigger text, less of the page at once: scroll to read on. Arithmetic only, not a measurement. [E6-GEAR]");
      }
      if (cmd === "INFO") return reply("IN SHORT: laptops like this were on sale as the paper appeared. One example, announced 14 October 2008, had 2 GB of memory, a 160 GB drive and a 1280 x 800 screen. [E6-GEAR]",
        "THE DEEPER STORY: this desk is an original, unbranded design. The example shows what was available then; it is not a claim about the author's computer.",
        "STILL UNSOLVED: nothing here; it is period gear, context for the cave. SOURCES lists its links.");
      if (cmd === "SOURCES") return reply(...["E6-GEAR", "E6-WP"].map((k) => `[${k}] ${sources[k].label} ${sources[k].href}`));
      return reply("CARDS | FILE <card> CITED|NOT | HINT | ZOOM 1..3 | INFO | SOURCES | RESET");
    }
  });

  // --- The cluster's terminals: each command changes its own model on the stage ------------------------------------
  const ORIGINAL = "Original museum design made in 2026, not period software or a historical object.";
  const argCard = (word) => ARG.findIndex((c) => c.tag === String(word || "").toUpperCase());
  const argTerminal = () => ({
    banner: ["ASSEMBLE THE ARGUMENT: a modern museum teaching game. It is not Bitcoin's protocol: nothing here signs, hashes, mines or checks a payment.",
      ...howTo(["Type CARDS to read the six cards.", "Lay a card in a slot: PLACE SIGN 1 (slots 1 to 6, left to right).",
        "With all six down, type CHECK: green slots are right, red ones need moving.", "DEAL 7 shuffles the tray with seed 7; RESET clears the table."]),
      "IN SHORT: the paper builds its case step by step, from who owns a coin to how unlikely a rewrite becomes. Lay the six steps in the paper's own order. [E6-WP]"],
    prompt: "ARGUMENT>",
    run(line) {
      const parts = clean(line).toUpperCase().split(/\s+/), cmd = parts[0];
      if (cmd === "RESET") { arg.deal(1); syncArg(); return reply("Table cleared; the tray is dealt as at the start."); }
      if (cmd === "CARDS") return reply(...ARG.map((c, k) => `${c.tag}: ${c.line}${arg.mark[arg.where[k]] === 1 ? ` (section ${c.sec}, ${SECTIONS[c.sec - 1].title})` : ""}${arg.where[k] >= 0 ? ` [slot ${arg.where[k] + 1}]` : ""}`));
      if (cmd === "DEAL") {
        if (parts[1] !== undefined && !/^\d{1,6}$/.test(parts[1])) return reply("DEAL, or DEAL with a seed from 0 to 999999.");
        arg.deal(parts[1] === undefined ? arg.S.seed + 1 : +parts[1]); syncArg();
        return reply(`Tray shuffled with seed ${arg.S.seed}; the slots are empty. The same seed always deals the same tray.`);
      }
      if (cmd === "PLACE") {
        const c = argCard(parts[1]), s = Number(parts[2]) - 1;
        if (c < 0 || !/^[1-6]$/.test(parts[2] || "") || parts.length > 3) return reply("PLACE <card> <slot>, e.g. PLACE SIGN 1. CARDS lists the cards.");
        const was = arg.place(c, s); syncArg();
        return reply(`${ARG[c].tag} lies in slot ${s + 1}.${was >= 0 ? ` ${ARG[was].tag} goes back to the tray.` : ""} ${arg.placed()}/6 down.`, arg.placed() === 6 ? "All six are down: type CHECK." : "");
      }
      if (cmd === "LIFT") {
        const c = argCard(parts[1]);
        if (c < 0) return reply("LIFT <card>, e.g. LIFT WORK.");
        arg.lift(c); syncArg();
        return reply(`${ARG[c].tag} is back in the tray. ${arg.placed()}/6 down.`);
      }
      if (cmd === "CHECK") {
        if (arg.placed() < 6) return reply(`Lay all six first: ${arg.placed()}/6 down.`);
        const right = arg.check(); syncArg();
        return reply(right === 6 ? "All six in the paper's order: sections 2, 3, 4, 5, 6 and 11. Solved!" : `${right}/6 in place. Red slots need another card; CARDS shows what is fixed.`,
          right === 6 ? "Sections 7 to 10 handle storage, light checking, payment shapes and privacy; the layout toy beside this table shows them." : "");
      }
      if (cmd === "HINT") {
        const k = Math.min(arg.S.hints++, 5);
        return reply(`Slot ${k + 1} is the card that says: "${ARG[k].line}"`, "That line is the museum's summary, not a quotation.");
      }
      if (cmd === "MORE") return reply("THE DEEPER STORY: an argument laid out in order is easier to check. The paper starts from ownership by signatures, adds a time order, makes that order costly to rewrite, says who keeps it and why, then estimates an attacker's chances. [E6-WP]",
        "STILL UNSOLVED: putting the steps in order shows how the paper argues, not that the system would work in practice. That waited for the software of January 2009 and years of use.",
        `MUSEUM NOTE: ${ORIGINAL} The cards' words are the museum's summaries.`);
      if (cmd === "SOURCES") return reply(...["E6-WP", "E6-CLUSTER"].map((k) => `[${k}] ${sources[k].label} ${sources[k].href}`));
      return reply("Commands: CARDS | PLACE <card> <slot> | LIFT <card> | CHECK | HINT | DEAL <seed>");
    }
  });
  const layTerminal = () => ({
    banner: ["DOCUMENT LAYOUT: the paper's nine pages laid flat, with a tab for each of its twelve sections and one for its references. An original museum model; the paper itself is in SOURCES.",
      ...howTo(["Type SHOW 4 to lift section 4's tab and read what it is for.", "Type COMPARE 3 7 to set two sections side by side: their jobs, pages and the references each cites.",
        "Type PAGE 2 to see which sections share a page, or PAPER for the paper's own link.", "RESET lowers every tab."]),
      "IN SHORT: the paper is nine pages long and each section does one job. Lift a tab to see its job. [E6-WP]"],
    prompt: "LAYOUT>",
    run(line) {
      const parts = clean(line).toUpperCase().split(/\s+/), cmd = parts[0];
      const tell = (s) => `Section ${s.n === 13 ? "list" : s.n}, ${s.title} (page ${s.n === 11 ? "6 to 8" : s.page}). Job: ${s.role}. ${s.says} Cites: ${refList(s.refs)}.`;
      if (cmd === "RESET") { lay.a = lay.b = -1; lay.page = 0; syncLay(); return reply("Every tab lowered."); }
      if (cmd === "SHOW") {
        const i = sectionNamed(parts[1]);
        if (i < 0 || parts.length > 2) return reply("SHOW 1 to 12, or SHOW REFS.");
        lay.a = i; lay.b = -1; lay.page = 0; syncLay();
        return reply(tell(SECTIONS[i]));
      }
      if (cmd === "COMPARE") {
        const i = sectionNamed(parts[1]), j = sectionNamed(parts[2]);
        if (i < 0 || j < 0 || i === j || parts.length > 3) return reply("COMPARE two different sections, e.g. COMPARE 3 7.");
        lay.a = i; lay.b = j; lay.page = 0; syncLay();
        const A = SECTIONS[i], B = SECTIONS[j], shared = A.refs.filter((r) => B.refs.includes(r));
        return reply(`GOLD: ${tell(A)}`, `TEAL: ${tell(B)}`,
          `${A.role === B.role ? `Same job (${A.role}), different parts of it.` : `Different jobs: ${A.role} and ${B.role}.`} Shared references: ${refList(shared)}.`);
      }
      if (cmd === "PAGE") {
        if (!/^[1-9]$/.test(parts[1] || "")) return reply("PAGE 1 to 9.");
        const p = +parts[1];
        lay.a = lay.b = -1; lay.page = p; syncLay();
        return reply(`Page ${p}: ${onPage(p).map((s) => s.n === 13 ? s.title : `${s.n} ${s.title}${s.n === 11 && p > 6 ? " (continued)" : ""}`).join("; ")}.`);
      }
      if (cmd === "ROLES") return reply(...["PROBLEM", "OWNERSHIP", "ORDER", "COST", "PROCESS", "ECONOMICS", "EFFICIENCY", "FORMAT", "PRIVACY", "ANALYSIS", "SUMMARY", "SOURCES"]
        .map((r) => `${r}: ${SECTIONS.filter((s) => s.role === r).map((s) => s.n === 13 ? "references" : s.n).join(", ")}`), "The jobs are the museum's labels; the titles and page numbers are the paper's own.");
      if (cmd === "PAPER") return reply(`The paper itself: ${sources["E6-WP"].href} (PDF). Page numbers here are its own: 1 to 8 for the text, 9 for the references.`,
        "The PDF prints no day of publication; the announcement of 31 October 2008 dates it. [E6-ANN]");
      if (cmd === "MORE") return reply("THE DEEPER STORY: the citations bunch up. Section 2 cites [1]; section 3 cites [2] to [5]; section 4 cites [6]; section 7 cites [7], [2] and [5]; section 11 cites [8]. The other sections cite nothing. [E6-WP]",
        "STILL UNSOLVED: a layout shows how the paper argues, not whether its assumptions held. Whether enough honest computers would run it was a question for after January 2009.",
        `MUSEUM NOTE: ${ORIGINAL}`);
      if (cmd === "SOURCES") return reply(...["E6-WP", "E6-ANN", "E6-CLUSTER"].map((k) => `[${k}] ${sources[k].label} ${sources[k].href}`));
      return reply("Commands: SHOW <section> | COMPARE <a> <b> | PAGE <1..9> | ROLES | PAPER");
    }
  });
  const wsTerminal = () => ({
    banner: ["READING WORKSTATION: an original, unbranded 2008-style desk display, keyboard and lamp for reading the paper. Context only: nothing here was introduced on 31 October 2008.",
      ...howTo(["Type PAGE 1 to 9 to scroll the display; the lit square shows the page.", "Type STORAGE 10 to redo the paper's own section 7 sum for ten years of block headers, shown on the bar.",
        "LAMP switches the desk lamp; RESET puts the desk back."]),
      "IN SHORT: in 2008 the paper could be read on an ordinary home computer. Its section 7 reasons from the 2 GB of memory computers were commonly sold with in 2008. [E6-WP]"],
    prompt: "DESK>",
    run(line) {
      const parts = clean(line).toUpperCase().split(/\s+/), cmd = parts[0];
      if (cmd === "RESET") { ws.page = 1; ws.years = 0; ws.lamp = true; syncWs(); return reply("Page 1, the bar empty, the lamp on."); }
      if (cmd === "PAGE") {
        if (!/^[1-9]$/.test(parts[1] || "")) return reply("PAGE 1 to 9.");
        ws.page = +parts[1]; syncWs();
        return reply(`Page ${ws.page} of ${PAGES} on the display: ${onPage(ws.page).map((s) => s.title).join(", ")}.`);
      }
      if (cmd === "STORAGE") {
        if (!/^\d{1,3}$/.test(parts[1] || "") || +parts[1] < 1 || +parts[1] > 100) return reply("STORAGE 1 to 100 (years).");
        ws.years = +parts[1]; syncWs();
        const b = headerBytes(ws.years);
        return reply(`${ws.years} year${ws.years === 1 ? "" : "s"} of headers: 80 bytes x 6 an hour x 24 x 365${ws.years === 1 ? "" : ` x ${ws.years}`} = ${commas(b)} bytes, about ${(b / 1e6).toFixed(1)} MB.`,
          `That is ${(100 * b / MEMORY_2008).toFixed(2)}% of 2 GB, the bar's full width. The paper's own sum, redone with its decimal rounding. [E6-WP]`);
      }
      if (cmd === "LAMP") { ws.lamp = !ws.lamp; syncWs(); return reply(ws.lamp ? "Lamp on." : "Lamp off: the display alone lights the desk."); }
      if (cmd === "MORE") return reply("THE DEEPER STORY: the desk shows reading conditions, not a particular machine. One dated example of the period, a laptop announced on 14 October 2008, is at the reference desk across this gallery. [E6-GEAR]",
        "STILL UNSOLVED: the paper's sum counts block headers only, at one block every ten minutes. How much room full blocks and real use would take was left open.",
        `MUSEUM NOTE: ${ORIGINAL}`);
      if (cmd === "SOURCES") return reply(...["E6-WP", "E6-GEAR", "E6-CLUSTER"].map((k) => `[${k}] ${sources[k].label} ${sources[k].href}`));
      return reply("Commands: PAGE <1..9> | STORAGE <years> | LAMP");
    }
  });
  // Each model's nodes follow its state: called after every command and on RESET, never per frame.
  const syncArg = () => {
    if (!argNodes) return;
    const N = argNodes;
    for (let k = 0; k < 6; k++) {
      const s = arg.where[k], p = N.cards[k].position;
      if (s >= 0) { p.x = N.slotX[s]; p.z = N.slotZ; } else { let t = 0; while (arg.tray[t] !== k) t++; p.x = N.slotX[t]; p.z = N.trayZ; }
    }
    for (let s = 0; s < 6; s++) { N.green[s].visible = arg.mark[s] === 1; N.red[s].visible = arg.mark[s] === 2; }
    N.win.visible = arg.S.solved;
  };
  const syncLay = () => {
    if (!layNodes) return;
    const N = layNodes;
    for (let i = 0; i < SECTIONS.length; i++) {
      const up = i === lay.a || i === lay.b, p = N.tabs[i].position;
      p.y = N.tabY[i] + (up ? 0.12 : 0); p.z = N.tabZ + (up ? 0.12 : 0);
    }
    const put = (marker, i, page) => {
      marker.visible = i >= 0 || page > 0;
      marker.position.x = N.pageX[marker.visible ? (i >= 0 ? SECTIONS[i].page : page) - 1 : 0];
    };
    put(N.gold, lay.a, lay.page); put(N.teal, lay.b, 0);
  };
  const syncWs = () => {
    if (!wsNodes) return;
    const N = wsNodes;
    for (let p = 0; p < PAGES; p++) N.lit[p].visible = p === ws.page - 1;
    const f = Math.min(1, headerBytes(ws.years) / MEMORY_2008);
    N.fill.visible = f > 0; N.fill.scale.x = Math.max(0.001, f); N.fill.position.x = N.barX0 + N.barW * f / 2;
    N.glow.visible = ws.lamp;
  };

  const overview = {
    summary: "A paper can describe a machine before it runs. On 31 October 2008 Satoshi Nakamoto announced a paper about electronic cash. Read the proposal, check its eight references, and keep its date apart from the software that came in January 2009.",
    sourceKeys: ["E6-ANN", "E6-WP", "E6-REL", "E6-GEAR"],
    pages: [
      { caption: "What to try", title: "A reading room", text: [
        "Left side: the announcement, the paper's reading desk, its eight-slot reference shelf, and a 2008-style laptop where you sort reference cards.",
        "Right side: two conflicting payments (a simplified teaching model) and the January door, which stays shut. Walk up and press Space."] },
      { caption: "How to read this cave", title: "Dates and connections", text: [
        "Every label says what its date marks: the announcement's posting time, a reference year as the paper's list gives it, or a later date shown as the future.",
        "Only the paper itself is a step on the trail here. Each shelf slot points back to the gallery that tells its story. The upper shelves are optional, for jetpack readers."] }
    ]
  };

  BL.genesisExhibits.register(6, {
    sources, overview,
    build(kit) {
      const { era, top, solid, sign, obstacle, prop } = kit;
      pay = { signed: { BO: false, CY: false }, order: "" };
      desk = { filed: new Uint8Array(CARDS.length), zoom: 1 };
      arg = createArgument(); lay = { a: -1, b: -1, page: 0 }; ws = { page: 1, years: 0, lamp: true };
      blink = 0;
      const L = kit.channel.x0, R = kit.channel.x1, at = (u) => era.z1 - u;

      // The announcement: a lit notice stand with one printed email (left bank, u 14).
      { const x = L - 7, z = at(14);
        solid(3, 0.2, 0.8, "#5a4630", x, top + 0.1, z);
        solid(0.15, 2.2, 0.15, "#5a4630", x - 1.3, top + 1.1, z); solid(0.15, 2.2, 0.15, "#5a4630", x + 1.3, top + 1.1, z);
        solid(2.8, 1.5, 0.12, "#3a2e22", x, top + 1.6, z);
        solid(1.1, 1.3, 0.03, "#f3ecd8", x, top + 1.6, z + 0.08, 0.25);
        for (let i = 0; i < 6; i++) solid(0.8, 0.04, 0.01, "#6d6352", x, top + 2.05 - i * 0.16, z + 0.1);
        obstacle(x - 1.6, x + 1.6, z - 0.5, z + 0.5);
        sign("THE ANNOUNCEMENT · 31 OCT 2008", "18:10 UTC posting timestamp · the PDF itself is undated", x, top + 2.9, z + 0.2, 0, 0.42);
        prop({ id: "e6-announce", year: 2008, connection: "context", date: "31 October 2008, 18:10 UTC: the archived posting timestamp of the announcement email",
          title: "The announcement", label: "ANNOUNCEMENT · 31 OCTOBER 2008", sourceKeys: ["E6-ANN", "E6-WP"],
          at: { x, y: top, z: z + 1.8 }, reach: 2, pick: { w: 3, h: 2.6, d: 1, x, z }, onUse: () => ANNOUNCE }); }

      // The paper's reading desk: a broad lectern with the open paper, eight small lights along its front edge
      // for the eight references (left bank, u 24). The anchor.
      { const x = L - 8, z = at(24);
        solid(4, 0.9, 1.8, "#5e4a33", x, top + 0.45, z);
        solid(3.6, 0.12, 1.4, "#7a6243", x, top + 0.96, z);
        solid(1.2, 0.03, 0.9, "#f6f0de", x - 0.62, top + 1.04, z, 0.3); solid(1.2, 0.03, 0.9, "#f6f0de", x + 0.62, top + 1.04, z, 0.3);
        for (let i = 0; i < 8; i++) solid(0.14, 0.06, 0.06, "#f2c14e", x - 1.4 + i * 0.4, top + 0.85, z + 0.92, 0.6);
        for (const dx of [-2.6, 2.6]) { solid(1.2, 0.45, 0.6, "#4a3a28", x + dx, top + 0.22, z + 1.2); obstacle(x + dx - 0.6, x + dx + 0.6, z + 0.9, z + 1.5); }
        obstacle(x - 2, x + 2, z - 0.9, z + 0.9);
        sign("THE WHITEPAPER · 31 OCT 2008", "the anchor work: a proposal, read it here · announced date, the PDF is undated", x, top + 3.1, z, 0, 0.5);
        prop({ id: "e6-paper", year: 2008, connection: "anchor", date: "31 October 2008: the dated announcement; the PDF itself prints no day of publication",
          title: "Bitcoin: A Peer-to-Peer Electronic Cash System", label: "THE WHITEPAPER · 2008", sourceKeys: ["E6-WP", "E6-ANN", "E6-REL", "E6-DOSSIER"],
          at: { x, y: top, z: z + 2 }, reach: 2.2, pick: { w: 4, h: 1.6, d: 1.8, x, z }, onUse: () => PAPER }); }

      // The reference shelf along the left bank (x about L - 20), facing the stream, eight slots in reference order
      // from u 14 to u 35, each 3 m apart. Core reading at standing height; the upper shelves rise to 7 m, optional.
      { const sx = L - 20, u0 = 14, step = 3, z0 = at(u0 + step * 7 + 1.5), z1 = at(u0 - 1.5), len = z1 - z0, mid = (z0 + z1) / 2;
        solid(0.8, 7, len, "#4b3a26", sx - 0.3, top + 3.5, mid);
        for (let k = 0; k < 4; k++) solid(1.2, 0.1, len, "#6b5236", sx + 0.1, top + 0.9 + k * 1.6 + (k > 1 ? 0.8 : 0), mid);
        const inks = ["#7a2f2a", "#2f4f7a", "#3d6b3a", "#7a6a2f", "#5a2f6b", "#2f6b6b"];
        REFS.forEach((r, i) => {
          const z = at(u0 + i * step);
          for (let b = 0; b < 5; b++) solid(0.5, 0.55, 0.22, b === 2 ? "#f2c14e" : inks[(i + b) % inks.length], sx + 0.15, top + 1.25, z - 0.6 + b * 0.3, b === 2 ? 0.5 : 0);
          // Upper, decorative spines.
          for (let row = 0; row < 2; row++) for (let b = 0; b < 4; b++) solid(0.45, 0.5, 0.2, inks[(i + b + row) % inks.length], sx + 0.1, top + 4.25 + row * 1.6, z - 0.45 + b * 0.3);
          sign(`[${r.n}] ${r.who.toUpperCase()} · ${r.year}`, `${r.year}: the year the paper's list gives · story earlier, in Era ${r.era}`, sx + 0.75, top + 2.2, z, Math.PI / 2, 0.24);
          // A bibliography entry ([n]), not context and not a second stop: it names the citation stop upstream.
          prop({ id: `e6-ref-${r.n}`, year: r.year, connection: "bibliography", ref: `[${r.n}]`, date: `${r.year}: the year the paper's reference list gives`, title: `Reference ${r.n}: ${r.who}`, label: `REFERENCE [${r.n}] · ${r.who.toUpperCase()} · ${r.year}`, sourceKeys: r.keys,
            at: { x: sx + 1.9, y: top, z }, reach: 1.3, pick: { w: 1, h: 2.2, d: 1.6, x: sx + 0.3, z }, onUse: () => slotBoard(r) });
        });
        obstacle(sx - 0.7, sx + 0.7, z0, z1);
        sign("THE REFERENCE SHELF · 2008", "eight numbered references in the whitepaper · each slot points back to its era", sx + 0.75, top + 3.4, at(u0 + step * 3.5), Math.PI / 2, 0.42);
        // Optional for flyers: the upper shelf of names that are not references, with the same note on the paper's desk.
        const uz = at(u0 + step * 3.5);
        solid(0.6, 0.6, 2.4, "#3a6b8a", sx + 0.2, top + 5.6, uz, 0.25);
        sign("UPPER SHELF · NOT IN THE 2008 LIST", "optional · jetpack readers", sx + 0.75, top + 6.4, uz, Math.PI / 2, 0.26);
        prop({ id: "e6-not-listed", year: 2008, connection: "context", date: "2008: the paper whose eight-item reference list this shelf checks",
          title: "Not in the bibliography", label: "UPPER SHELF · NOT IN THE 2008 LIST", sourceKeys: ["E6-WP", "E6-DOSSIER"],
          at: { x: sx + 1.6, y: top + 5, z: uz }, reach: 1.8, pick: { w: 1, h: 1.6, d: 2.4, x: sx + 0.3, z: uz }, onUse: () => UPPER }); }

      // The 2008 laptop at the reference desk (left bank, u 46): an original slim clamshell, no logo.
      { const x = L - 9, z = at(46);
        solid(3.4, 0.9, 1.4, "#6b5538", x, top + 0.45, z);
        solid(1.3, 0.05, 0.9, "#b9bcbf", x, top + 0.93, z + 0.15);
        solid(1.1, 0.02, 0.45, "#2b2d30", x, top + 0.96, z + 0.05);
        solid(1.3, 0.85, 0.05, "#b9bcbf", x, top + 1.36, z - 0.3);
        solid(1.15, 0.7, 0.02, "#1e3346", x, top + 1.36, z - 0.27, 0.35);
        for (let i = 0; i < 4; i++) solid(0.7, 0.04, 0.01, "#9fc4dd", x - 0.1, top + 1.6 - i * 0.12, z - 0.255, 0.4);
        cursor = solid(0.06, 0.07, 0.01, "#e8f2fa", x + 0.32, top + 1.24, z - 0.255, 0.8);
        for (let i = 0; i < 3; i++) solid(0.5, 0.02, 0.35, "#f3ecd8", x + 1.1, top + 0.92 + i * 0.02, z + 0.2 - i * 0.05);
        obstacle(x - 1.7, x + 1.7, z - 0.7, z + 0.7);
        sign("REFERENCE DESK · 2008 LAPTOP", "Space: sort the reference cards · original design, not the author's computer", x, top + 2.6, z + 0.1, 0, 0.42);
        prop({ id: "e6-laptop", year: 2008, connection: "context", date: "14 October 2008: an example laptop announced; this desk is an original design",
          title: "2008 reference desk", label: "REFERENCE DESK · 2008", sourceKeys: ["E6-GEAR", "E6-WP"],
          at: { x, y: top, z: z + 1.8 }, reach: 2, pick: { w: 3.4, h: 1.8, d: 1.4, x, z }, onUse: () => ({ terminal: laptopTerminal() }) }); }

      // Two conflicting payments (right bank, u 22): two slips on a table, one ledger between them.
      { const x = R + 9, z = at(22);
        solid(3.6, 0.9, 1.6, "#5e4a33", x, top + 0.45, z);
        solid(0.9, 0.03, 0.6, "#f3ecd8", x - 1.1, top + 0.92, z, 0.25); solid(0.9, 0.03, 0.6, "#f3ecd8", x + 1.1, top + 0.92, z, 0.25);
        solid(0.18, 0.04, 0.18, "#b8322a", x - 0.8, top + 0.95, z + 0.15); solid(0.18, 0.04, 0.18, "#b8322a", x + 1.4, top + 0.95, z + 0.15);
        solid(0.8, 0.12, 1, "#2f4f3a", x, top + 0.96, z);
        obstacle(x - 1.9, x + 1.9, z - 0.9, z + 0.9);
        sign("TWO PAYMENTS, ONE COIN · 2008", "a simplified teaching model · not a wallet or a security proof", x, top + 2.7, z + 0.2, 0, 0.42);
        prop({ id: "e6-payments", year: 2008, connection: "demonstration", demonstrates: ["e6-paper"],
          title: "Two payments, one coin", label: "TWO PAYMENTS · 2008 MODEL", sourceKeys: ["E6-WP", "E6-DOSSIER"],
          at: { x, y: top, z: z + 2 }, reach: 2.2, pick: { w: 3.6, h: 1.6, d: 1.6, x, z }, onUse: () => ({ terminal: payTerminal() }) }); }

      // The unopened January door (right bank, u 60): a shut door in a frame, its future date on it.
      { const x = R + 9, z = at(60);
        solid(0.3, 3.4, 0.4, "#3a2e22", x - 1.3, top + 1.7, z); solid(0.3, 3.4, 0.4, "#3a2e22", x + 1.3, top + 1.7, z);
        solid(2.9, 0.3, 0.4, "#3a2e22", x, top + 3.55, z);
        solid(2.3, 3.2, 0.12, "#6b4a2c", x, top + 1.6, z);
        solid(0.1, 0.1, 0.06, "#d8b05a", x + 0.85, top + 1.5, z + 0.09, 0.4);
        obstacle(x - 1.5, x + 1.5, z - 0.3, z + 0.3);
        sign("8 JANUARY 2009 · NOT YET", "the software-release announcement · 69 days after this cave's date", x, top + 4.3, z + 0.25, 0, 0.42);
        prop({ id: "e6-january", year: 2009, connection: "context", date: "8 January 2009, 19:27:40 UTC: the release announcement, a future date seen from this cave",
          title: "The January door", label: "JANUARY DOOR · 8 JANUARY 2009", sourceKeys: ["E6-REL", "E6-WP"],
          at: { x, y: top, z: z + 1.6 }, reach: 2, pick: { w: 2.6, h: 3.4, d: 0.6, x, z }, onUse: () => JANUARY }); }

      // --- The reading corner: three compact stations on the right side between the payments table and the January
      // door (u 33 to 49), each 3.5 m wide at most, clear of the walk, the dock plot and the lamps. No lights: lit
      // parts are emissive. Each faces the way in, its walk-up point 2 m in front.
      const cx = R + 8.4;
      // Assemble the argument: a table with six slots along its front edge and the dealt tray behind them; a green or
      // red lamp over each slot after CHECK and a gold lamp when solved.
      { const z = at(33), inks = ["#c8583a", "#4a7ab0", "#d9953a", "#6fae3a", "#9a6ad0", "#2fb8a0"];
        solid(3.4, 0.9, 1.6, "#5e4a33", cx, top + 0.45, z);
        solid(3.2, 0.03, 0.5, "#3a2e22", cx, top + 0.915, z - 0.35);
        const slotX = [], green = [], red = [], cards = [];
        for (let s = 0; s < 6; s++) {
          const x = cx - 1.35 + s * 0.54;
          slotX.push(x);
          solid(0.46, 0.02, 0.36, "#d8ccb0", x, top + 0.91, z + 0.35);
          green.push(solid(0.12, 0.06, 0.06, "#7dff8a", x, top + 0.95, z + 0.7, 0.9));
          red.push(solid(0.12, 0.06, 0.06, "#ff6a5a", x, top + 0.95, z + 0.7, 0.9));
        }
        for (let k = 0; k < 6; k++) cards.push(solid(0.4, 0.04, 0.3, inks[k], slotX[k], top + 0.95, z - 0.35, 0.15));
        const win = solid(0.5, 0.12, 0.12, "#ffd23a", cx, top + 1.4, z - 0.7, 1);
        argNodes = { cards, green, red, win, slotX, slotZ: z + 0.35, trayZ: z - 0.35 };
        syncArg();
        obstacle(cx - 1.8, cx + 1.8, z - 0.9, z + 0.9);
        sign("ASSEMBLE THE ARGUMENT · 2008 PAPER", "a teaching game, not the protocol · SIGN red, TIME blue, WORK gold, NODE green, COIN violet, ODDS teal", cx, top + 2.6, z + 0.2, 0, 0.42);
        prop({ id: "e6-argument", year: 2008, connection: "context", date: "2008: the paper whose section order the cards follow; the game is a modern museum homage",
          title: "Assemble the argument", label: "ASSEMBLE THE ARGUMENT · 2008 PAPER", hint: "Type PLACE SIGN 1 to start; CHECK when all six cards are down",
          sourceKeys: ["E6-WP", "E6-CLUSTER"], at: { x: cx, y: top, z: z + 2 }, reach: 2.2, pick: { w: 3.4, h: 1.6, d: 1.6, x: cx, z }, onUse: () => ({ terminal: argTerminal() }) }); }
      // The document layout: the nine pages standing in a row on a low frame, a tab on each section's first page;
      // SHOW lifts a tab and a gold bar marks its page, COMPARE adds a teal one.
      { const z = at(41), pageW = 0.34, gap = 0.035, y0 = top + 1.75, pageX = [];
        solid(3.5, 0.3, 0.7, "#4b3a26", cx, top + 0.15, z);
        for (const dx of [-1.65, 1.65]) solid(0.12, 2.3, 0.12, "#4b3a26", cx + dx, top + 1.15, z - 0.2);
        solid(3.42, 1, 0.05, "#2b221d", cx, y0, z - 0.2);
        for (let p = 0; p < PAGES; p++) { const x = cx - 4 * (pageW + gap) + p * (pageW + gap); pageX.push(x); solid(pageW, 0.46, 0.02, "#f6f0de", x, y0, z - 0.165, 0.2); }
        const tabs = [], tabY = [], inks = ["#d9953a", "#c8583a", "#4a7ab0", "#d9953a", "#6fae3a", "#9a6ad0", "#2fb8a0", "#2fb8a0", "#8e8e96", "#5a2f6b", "#c8583a", "#efe6d2", "#f2c14e"];
        SECTIONS.forEach((s, i) => {
          const k = SECTIONS.filter((t) => t.page === s.page && t.n < s.n).length, y = y0 + 0.17 - k * 0.12;
          tabY.push(y); tabs.push(solid(0.28, 0.08, 0.04, inks[i], pageX[s.page - 1], y, z - 0.14, 0.2));
        });
        const gold = solid(pageW + 0.04, 0.05, 0.05, "#ffd23a", pageX[0], y0 - 0.32, z - 0.13, 0.9);
        const teal = solid(pageW + 0.04, 0.05, 0.05, "#46ffd2", pageX[0], y0 - 0.39, z - 0.13, 0.9);
        layNodes = { tabs, tabY, tabZ: z - 0.14, gold, teal, pageX };
        syncLay();
        obstacle(cx - 1.8, cx + 1.8, z - 0.4, z + 0.4);
        sign("DOCUMENT LAYOUT · 2008 PAPER", "nine pages, twelve sections and the references · an original model, the paper in SOURCES", cx, top + 2.85, z - 0.1, 0, 0.42);
        prop({ id: "e6-layout", year: 2008, connection: "context", date: "2008: the paper's own nine-page layout; an original museum model",
          title: "Document layout", label: "DOCUMENT LAYOUT · 2008 PAPER", hint: "Type SHOW 4, or COMPARE 3 7, to lift tabs and compare sections",
          sourceKeys: ["E6-WP", "E6-ANN", "E6-CLUSTER"], at: { x: cx, y: top, z: z + 1.8 }, reach: 2.2, pick: { w: 3.5, h: 2.4, d: 0.8, x: cx, z }, onUse: () => ({ terminal: layTerminal() }) }); }
      // The reading workstation: a desk with an original flat display (a page strip of nine squares, one lit, and a
      // storage bar), a keyboard, papers and a lamp whose glow LAMP switches.
      { const z = at(49), dx = cx - 0.3, barW = 1.1, barX0 = dx - barW / 2, lit = [];
        solid(3.2, 0.78, 1.2, "#6b5538", cx, top + 0.39, z);
        solid(0.24, 0.32, 0.18, "#2a2b2e", dx, top + 0.94, z - 0.3);
        solid(1.5, 0.95, 0.07, "#2a2b2e", dx, top + 1.55, z - 0.32);
        solid(1.36, 0.8, 0.02, "#13202c", dx, top + 1.55, z - 0.28, 0.25);
        for (let p = 0; p < PAGES; p++) {
          const x = dx - 0.56 + p * 0.14;
          solid(0.1, 0.13, 0.01, "#3c5568", x, top + 1.78, z - 0.265, 0.2);
          lit.push(solid(0.1, 0.13, 0.012, "#e8f2fa", x, top + 1.78, z - 0.262, 0.9));
        }
        solid(barW + 0.04, 0.09, 0.01, "#3c5568", dx, top + 1.36, z - 0.266, 0.2);
        const fill = solid(barW, 0.06, 0.012, "#ffb02e", dx, top + 1.36, z - 0.262, 0.9);
        solid(1.1, 0.04, 0.36, "#3a3b3f", dx, top + 0.8, z + 0.15);
        solid(0.42, 0.03, 0.3, "#f3ecd8", cx + 0.95, top + 0.8, z + 0.1); solid(0.42, 0.03, 0.3, "#f6f0de", cx + 0.97, top + 0.83, z + 0.08);
        solid(0.08, 0.7, 0.08, "#2b221d", cx + 1.3, top + 1.13, z - 0.35);
        solid(0.3, 0.12, 0.2, "#2b221d", cx + 1.15, top + 1.5, z - 0.3);
        const glow = solid(0.24, 0.03, 0.14, "#fff2c8", cx + 1.15, top + 1.43, z - 0.3, 1);
        wsNodes = { lit, fill, glow, barX0, barW };
        syncWs();
        obstacle(cx - 1.6, cx + 1.6, z - 0.6, z + 0.6);
        sign("READING WORKSTATION · 2008 STYLE", "an original, unbranded desk for reading the paper · context, nothing introduced on 31 October 2008", cx, top + 2.5, z + 0.1, 0, 0.42);
        prop({ id: "e6-workstation", year: 2008, connection: "context", date: "2008: the period illustrated; an original, unbranded design, not equipment introduced on 31 October 2008",
          title: "Reading workstation", label: "READING WORKSTATION · 2008 STYLE", hint: "Type PAGE 3 or STORAGE 10; LAMP switches the desk lamp",
          sourceKeys: ["E6-WP", "E6-GEAR", "E6-CLUSTER"], at: { x: cx, y: top, z: z + 1.8 }, reach: 2.2, pick: { w: 3.2, h: 2, d: 1.2, x: cx, z }, onUse: () => ({ terminal: wsTerminal() }) }); }
    },
    // The laptop's cursor blinks; it stays lit while reading or under Calm. Allocation-free.
    update(dt, elapsed, state) {
      if (!cursor) return;
      if (state.reading || state.calm) { cursor.visible = true; return; }
      blink += dt;
      cursor.visible = (blink % 1.1) < 0.6;
    },
    dispose() { pay = desk = cursor = null; arg = lay = ws = argNodes = layNodes = wsNodes = null; }
  });
})();
