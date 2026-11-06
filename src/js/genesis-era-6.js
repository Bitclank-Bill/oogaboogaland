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
// same game on the retro screen interface. Past the January door stands Citation Catch, a modern museum toy: a card
// catalogue of the reference desk's twelve cards, whose console game (genesis-era-6-catch.js) sorts them as they
// fall. Each exhibit's finer parts (frames, keys, lamps, trims) are one merged mesh at its own spot (`detail`).
//
// Warm paper and lamplight: each exhibit stands in a pool of emissive floor light (no light sources), the paper's desk
// in the brightest. Nothing moves by itself: models move only when a visitor opens or commands them, and then ease
// between states (cards snap into order, tabs lift and settle, slips slide into conflict, a page turns, a slot's arrow
// lights, the door's seal catches a glint); Calm shows each end state at once. Sounds are the scene's own cues (kit
// `cue`, when given), one per command at most. The laptop's cursor is the only blink, held while a panel or terminal
// is open or Calm is on. No toasts. Nothing typed leaves the page.
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
  // An exhibit's finer parts as one merged mesh at (x, y, z), its parts in its own frame (y from the floor), as Era 0
  // builds them. The layout's dry run and the checks' kits have no `merge`, so they get a bare node at the same spot:
  // every run makes the same calls in the same order, and the mesh moves with its exhibit's cluster.
  const detail = (kit, x, y, z, make) => {
    const nd = kit.createNode(kit.M.merge ? { geometry: kit.M.merge(...make(kit.M)) } : {});
    nd.position.x = x; nd.position.y = y; nd.position.z = z;
    return kit.place(nd);
  };
  const B = (M, w, h, d, color, x, y, z, emissive = 0) => M.box({ w, h, d, color, emissive, offset: { x, y, z } });
  // A warm pool of lamplight on the floor at an exhibit (an emissive film just over the floor, no light source), w by d
  // metres centred at (x, z): the era's paper-and-lamplight tone. Returns its node, so a model can brighten it.
  const pool = (kit, x, z, w, d, level = 0.32) => detail(kit, x, kit.top, z, (M) => [B(M, w, 0.006, d, "#8a6226", 0, 0.004, 0, level), B(M, w * 0.62, 0.006, d * 0.62, "#b07f34", 0, 0.008, 0, level)]);
  const rows = (n, f) => Array.from({ length: n }, (_, k) => f(k));

  // --- Motion: eased transitions between a model's states (allocation-free, preallocated) ----------------------------
  // A command writes each moving part's final value at once (so a reader of the model, and RESET, always sees the end
  // state), then `to` starts a tween from the value the visitor was seeing; `update` draws the in-between frames and
  // writes the final value on the last. Calm starts no tween (end states at once) and finishes any running; pause and
  // the bench, menu and console holds simply stop `update`, freezing a tween where it stands; `active(false)` finishes
  // them all. With no tween running `update` returns before doing anything. Fields: position x/y/z, rotation x/z/y,
  // scale x/y, glow (the renderer's emissive multiplier). Eases: 0 in-out cubic, 1 out-back (a snap that settles),
  // 2 out-cubic, 3 a hop (`from` holds the height: up and back down onto the final value).
  const PX = 0, PY = 1, PZ = 2, RX = 3, RZ = 4, SX = 5, SY = 6, GLOW = 7, RY = 8, CAP = 160;
  const tw = { n: 0, node: new Array(CAP).fill(null), field: new Uint8Array(CAP), ease: new Uint8Array(CAP),
    from: new Float32Array(CAP), to: new Float32Array(CAP), t: new Float32Array(CAP), dur: new Float32Array(CAP) };
  // `live` is off during a build (its syncs only lay the model out); `calm` mirrors the visit's Calm; `cue` is the kit's
  // sound hook when the scene gives one (genesis-audio cue names only), else nothing.
  const anim = { live: false, calm: false, cue: null, started: 0 };
  const CUES = new Set(["whir", "click", "clack", "relay", "chime", "thunk", "rustle-paper", "beep", "hum-start", "hum-stop"]);
  const cue = (name) => { if (anim.live && anim.cue && CUES.has(name)) anim.cue(name); };
  const getF = (n, f) => f === PX ? n.position.x : f === PY ? n.position.y : f === PZ ? n.position.z : f === RX ? n.rotation.x : f === RZ ? n.rotation.z
    : f === RY ? n.rotation.y : f === SX ? n.scale.x : f === SY ? n.scale.y : (n.glow === undefined ? 1 : n.glow);
  const putF = (n, f, v) => {
    if (f === PX) n.position.x = v; else if (f === PY) n.position.y = v; else if (f === PZ) n.position.z = v; else if (f === RX) n.rotation.x = v;
    else if (f === RZ) n.rotation.z = v; else if (f === RY) n.rotation.y = v; else if (f === SX) n.scale.x = v; else if (f === SY) n.scale.y = v; else n.glow = v;
  };
  const slotOf = (n, f) => { for (let i = 0; i < tw.n; i++) if (tw.node[i] === n && tw.field[i] === f) return i; return -1; };
  const drop = (i) => { const k = --tw.n; tw.node[i] = tw.node[k]; tw.field[i] = tw.field[k]; tw.ease[i] = tw.ease[k]; tw.from[i] = tw.from[k]; tw.to[i] = tw.to[k]; tw.t[i] = tw.t[k]; tw.dur[i] = tw.dur[k]; tw.node[k] = null; };
  // Sets `n`'s field to `v` now and eases the shown value there over `dur` seconds (after `delay`).
  const to = (n, f, v, dur = 0.45, ease = 0, delay = 0) => {
    let i = slotOf(n, f);
    // A hop running on y is replaced by this move (it starts from the hop's resting height, not mid-air).
    const from = i >= 0 && tw.ease[i] === 3 ? tw.to[i] : getF(n, f);
    putF(n, f, v);
    if (!anim.live || anim.calm || Math.abs(from - v) < 1e-5) { if (i >= 0) drop(i); return; }
    if (i < 0) { if (tw.n >= CAP) return; i = tw.n++; }
    tw.node[i] = n; tw.field[i] = f; tw.ease[i] = ease; tw.from[i] = from; tw.to[i] = v; tw.t[i] = -delay; tw.dur[i] = dur;
    anim.started++;
  };
  // A hop on y: up by `h` and back down onto the part's own height, over `dur`.
  const hop = (n, h, dur = 0.45, delay = 0) => {
    if (!anim.live || anim.calm) return;
    let i = slotOf(n, PY);
    if (i >= 0 && tw.ease[i] !== 3) return;
    if (i < 0) { if (tw.n >= CAP) return; i = tw.n++; }
    tw.node[i] = n; tw.field[i] = PY; tw.ease[i] = 3; tw.from[i] = h; tw.to[i] = n.position.y; tw.t[i] = -delay; tw.dur[i] = dur; anim.started++;
  };
  const finishAll = () => { for (let i = 0; i < tw.n; i++) { putF(tw.node[i], tw.field[i], tw.to[i]); tw.node[i] = null; } tw.n = 0; };
  const stepTweens = (dt) => {
    for (let i = tw.n - 1; i >= 0; i--) {
      const t = tw.t[i] += dt;
      if (t <= 0) { if (tw.ease[i] !== 3) putF(tw.node[i], tw.field[i], tw.from[i]); continue; }
      const k = t >= tw.dur[i] ? 1 : t / tw.dur[i], e = tw.ease[i];
      if (k >= 1) { putF(tw.node[i], tw.field[i], tw.to[i]); drop(i); continue; }
      if (e === 3) { putF(tw.node[i], tw.field[i], tw.to[i] + Math.sin(Math.PI * k) * tw.from[i]); continue; }
      const q = e === 1 ? 1 + 2.70158 * (k - 1) ** 3 + 1.70158 * (k - 1) ** 2 : e === 2 ? 1 - (1 - k) ** 3 : k < 0.5 ? 4 * k * k * k : 1 - (-2 * k + 2) ** 3 / 2;
      putF(tw.node[i], tw.field[i], tw.from[i] + (tw.to[i] - tw.from[i]) * q);
    }
  };
  // A lamp coming on: shown now, its glow easing up from nothing; going off is at once (a reader sees it off).
  const lampOn = (n, on, level = 1, dur = 0.5, delay = 0) => {
    if (!on) { n.visible = false; const i = slotOf(n, GLOW); if (i >= 0) drop(i); n.glow = level; return; }
    if (!n.visible) { n.glow = 0; n.visible = true; }
    to(n, GLOW, level, dur, 2, delay);
  };

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
      if (cmd === "RESET") { pay.signed.BO = pay.signed.CY = false; pay.order = ""; syncPay(); cue("thunk"); return reply("Coin #8 is Ana's again. Nothing signed."); }
      if (cmd === "SIGN") {
        const who = parts[1];
        if (who !== "BO" && who !== "CY") return reply("SIGN BO or SIGN CY.");
        pay.signed[who] = true; syncPay(); cue("rustle-paper");
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
        pay.order = a + b; syncPay(); cue("thunk");
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
  BL.genesisEra6 = { SECTIONS, PAGES, ARG, createArgument, headerBytes, MEMORY_2008,
    // For checks: how many transitions are running, and how many have started this page.
    motion: { get running() { return tw.n; }, get started() { return anim.started; }, CUES } };

  let desk = null, cursor = null, blink = 0;
  // The cluster's per-visit state and model nodes (`build` sets them, `dispose` drops them).
  let arg = null, lay = null, ws = null, argNodes = null, layNodes = null, wsNodes = null, cat = null, catNodes = null;
  // The upgrade's moving parts: the laptop's card piles, the payments' slips, the paper's turning leaf, the shelf's slot
  // beacons, the January door's seal and glint, and the light pools (`pools`, by exhibit).
  let deskNodes = null, payNodes = null, paperNodes = null, slotNodes = null, doorNodes = null, laptopNodes = null;
  // One-shot effects when an exhibit is opened (its board or terminal): a page turns, a slot lights and points back,
  // the seal catches the light, the laptop's screen wakes. Each starts its tweens and returns; nothing runs after.
  const turnPage = () => {
    if (!paperNodes) return;
    const N = paperNodes;
    N.side = -N.side;
    to(N.leaf, RZ, N.side < 0 ? Math.PI : 0, 1.1, 0); hop(N.leaf, 0.04, 1.1);
    // The desk lamp brightens as the page turns and settles back to its reading level.
    N.lamp.visible = true; putF(N.lamp, GLOW, anim.live && !anim.calm ? 1.7 : 1.15); to(N.lamp, GLOW, 1.15, 1.2, 2, 0.4);
    cue("rustle-paper");
  };
  const lightSlot = (n) => {
    if (!slotNodes) return;
    for (let i = 0; i < 8; i++) {
      const b = slotNodes.beacons[i], on = i === n - 1;
      // The lit slot's arrow slides out toward the gallery's way in (where earlier eras lie) and stays out; the others
      // go dark and back.
      lampOn(b, on, 1.2, 0.45);
      to(b, PZ, slotNodes.beaconZ[i] + (on ? 0.14 : 0), 0.5, on ? 1 : 0);
    }
    cue("relay");
  };
  const sealGlint = () => {
    if (!doorNodes) return;
    const N = doorNodes;
    // A glint sweeps across the wax seal and fades; the light under the door swells and settles.
    N.glint.visible = true; putF(N.glint, PX, N.glintX0); putF(N.glint, GLOW, 1.4);
    to(N.glint, PX, N.glintX1, 0.9, 0, 0.1); to(N.glint, GLOW, 0, 0.9, 0, 0.2);
    putF(N.light, GLOW, anim.live && !anim.calm ? 1.8 : 1); to(N.light, GLOW, 1, 1.1, 0, 0.3);
    cue("chime");
  };
  const wakeScreen = () => {
    if (!laptopNodes) return;
    const s = laptopNodes.screen;
    if (anim.live && !anim.calm) { putF(s, GLOW, 0.3); to(s, GLOW, 1.35, 0.8, 2); } else s.glow = 1.35;
    cue("hum-start");
  };
  const filed = () => desk.filed.reduce((n, f) => n + (f ? 1 : 0), 0);
  const laptopTerminal = () => ({
    banner: ["REFERENCE DESK / an original, unbranded 2008-style laptop. Not the author's computer.",
      ...howTo(["Type CARDS to list twelve reference cards.", "File each one: FILE R3 CITED, or FILE RPOW NOT.",
        "Type ZOOM 1, 2 or 3 to see what screen magnification does; INFO tells the laptop's story.", "RESET clears the desk. HINT helps if you are stuck."]),
      "IN SHORT: sort the cards into the paper's numbered references and names it does not list. [E6-WP]"],
    prompt: "DESK>",
    run(line) {
      const parts = clean(line).toUpperCase().split(/\s+/), cmd = parts[0];
      if (cmd === "RESET") { desk.filed.fill(0); desk.zoom = 1; syncDesk(); cue("rustle-paper"); return reply("Desk cleared. CARDS lists them again."); }
      if (cmd === "CARDS") return reply(...CARDS.map((c, i) => `${c.id.padEnd(10)} ${c.name}${desk.filed[i] ? "  [filed]" : ""}`), `${filed()}/12 filed.`);
      if (cmd === "HINT") return reply("Cards R1 to R8 are the eight entries of the paper's numbered list: CITED. The other four are not in the list: NOT.",
        "A famous name is not a citation. Check the list, not the resemblance.");
      if (cmd === "FILE") {
        const i = CARDS.findIndex((c) => c.id === parts[1]), pile = parts[2];
        if (i < 0 || (pile !== "CITED" && pile !== "NOT") || parts.length > 3) return reply("FILE <card> CITED or FILE <card> NOT. CARDS lists the cards.");
        const c = CARDS[i];
        if ((pile === "CITED") !== !!c.cited) return reply(c.cited ? `Not quite: ${c.name} is reference [${c.cited}] in the list.` : `Not quite: ${c.name} is not among the eight numbered references.`, "Your other cards stay filed.");
        desk.filed[i] = 1; syncDesk(i); cue("rustle-paper");
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
        arg.deal(parts[1] === undefined ? arg.S.seed + 1 : +parts[1]); syncArg(); cue("rustle-paper");
        return reply(`Tray shuffled with seed ${arg.S.seed}; the slots are empty. The same seed always deals the same tray.`);
      }
      if (cmd === "PLACE") {
        const c = argCard(parts[1]), s = Number(parts[2]) - 1;
        if (c < 0 || !/^[1-6]$/.test(parts[2] || "") || parts.length > 3) return reply("PLACE <card> <slot>, e.g. PLACE SIGN 1. CARDS lists the cards.");
        const was = arg.place(c, s); syncArg(); cue("clack");
        return reply(`${ARG[c].tag} lies in slot ${s + 1}.${was >= 0 ? ` ${ARG[was].tag} goes back to the tray.` : ""} ${arg.placed()}/6 down.`, arg.placed() === 6 ? "All six are down: type CHECK." : "");
      }
      if (cmd === "LIFT") {
        const c = argCard(parts[1]);
        if (c < 0) return reply("LIFT <card>, e.g. LIFT WORK.");
        arg.lift(c); syncArg(); cue("clack");
        return reply(`${ARG[c].tag} is back in the tray. ${arg.placed()}/6 down.`);
      }
      if (cmd === "CHECK") {
        if (arg.placed() < 6) return reply(`Lay all six first: ${arg.placed()}/6 down.`);
        const right = arg.check(); syncArg(); cue(right === 6 ? "chime" : "thunk");
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
        lay.a = i; lay.b = -1; lay.page = 0; syncLay(); cue("rustle-paper");
        return reply(tell(SECTIONS[i]));
      }
      if (cmd === "COMPARE") {
        const i = sectionNamed(parts[1]), j = sectionNamed(parts[2]);
        if (i < 0 || j < 0 || i === j || parts.length > 3) return reply("COMPARE two different sections, e.g. COMPARE 3 7.");
        lay.a = i; lay.b = j; lay.page = 0; syncLay(); cue("rustle-paper");
        const A = SECTIONS[i], B = SECTIONS[j], shared = A.refs.filter((r) => B.refs.includes(r));
        return reply(`GOLD: ${tell(A)}`, `TEAL: ${tell(B)}`,
          `${A.role === B.role ? `Same job (${A.role}), different parts of it.` : `Different jobs: ${A.role} and ${B.role}.`} Shared references: ${refList(shared)}.`);
      }
      if (cmd === "PAGE") {
        if (!/^[1-9]$/.test(parts[1] || "")) return reply("PAGE 1 to 9.");
        const p = +parts[1];
        lay.a = lay.b = -1; lay.page = p; syncLay(); cue("click");
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
        ws.page = +parts[1]; syncWs(); cue("click");
        return reply(`Page ${ws.page} of ${PAGES} on the display: ${onPage(ws.page).map((s) => s.title).join(", ")}.`);
      }
      if (cmd === "STORAGE") {
        if (!/^\d{1,3}$/.test(parts[1] || "") || +parts[1] < 1 || +parts[1] > 100) return reply("STORAGE 1 to 100 (years).");
        ws.years = +parts[1]; syncWs(); cue("whir");
        const b = headerBytes(ws.years);
        return reply(`${ws.years} year${ws.years === 1 ? "" : "s"} of headers: 80 bytes x 6 an hour x 24 x 365${ws.years === 1 ? "" : ` x ${ws.years}`} = ${commas(b)} bytes, about ${(b / 1e6).toFixed(1)} MB.`,
          `That is ${(100 * b / MEMORY_2008).toFixed(2)}% of 2 GB, the bar's full width. The paper's own sum, redone with its decimal rounding. [E6-WP]`);
      }
      if (cmd === "LAMP") { ws.lamp = !ws.lamp; syncWs(); cue("click"); return reply(ws.lamp ? "Lamp on." : "Lamp off: the display alone lights the desk."); }
      if (cmd === "MORE") return reply("THE DEEPER STORY: the desk shows reading conditions, not a particular machine. One dated example of the period, a laptop announced on 14 October 2008, is at the reference desk across this gallery. [E6-GEAR]",
        "STILL UNSOLVED: the paper's sum counts block headers only, at one block every ten minutes. How much room full blocks and real use would take was left open.",
        `MUSEUM NOTE: ${ORIGINAL}`);
      if (cmd === "SOURCES") return reply(...["E6-WP", "E6-GEAR", "E6-CLUSTER"].map((k) => `[${k}] ${sources[k].label} ${sources[k].href}`));
      return reply("Commands: PAGE <1..9> | STORAGE <years> | LAMP");
    }
  });
  // The catalogue cabinet beside the January door: twelve drawers, one a card (the reference desk's twelve), and two
  // lamps on top that say which pile the last drawer pulled belongs to. Its console game is Citation Catch
  // (genesis-era-6-catch.js), the same twelve cards falling to a sorting tray.
  const catTerminal = () => ({
    banner: ["CITATION CATCH: a modern museum toy and console game. The cabinet and the game are original museum designs, not period software.",
      ...howTo(["Type DRAWERS to read the twelve drawer labels.", "Type PULL R3, or PULL RPOW, to slide a drawer out: the gold lamp means in the paper's list, the blue lamp means not listed.",
        "SHUT closes every drawer. On the console, catch each falling card in the right tray."]),
      "IN SHORT: eight of these twelve names are the paper's numbered references; four famous ones are not. File each where the list puts it. [E6-WP]"],
    prompt: "CATALOGUE>",
    run(line) {
      const parts = clean(line).toUpperCase().split(/\s+/), cmd = parts[0];
      if (cmd === "RESET" || cmd === "SHUT") { cat.open.fill(0); cat.last = -1; syncCat(); return reply(cmd === "RESET" ? "Every drawer shut, both lamps off." : "Drawers shut."); }
      if (cmd === "DRAWERS") return reply(...CARDS.map((c, i) => `${c.id.padEnd(10)} ${c.name}${cat.open[i] ? "  [open]" : ""}`));
      if (cmd === "PULL") {
        const i = CARDS.findIndex((c) => c.id === parts[1]);
        if (i < 0 || parts.length > 2) return reply("PULL <drawer>, e.g. PULL R3 or PULL CHORD. DRAWERS lists them.");
        const c = CARDS[i];
        cat.open[i] = 1; cat.last = i; syncCat(); cue("clack");
        if (c.cited) return reply(`Gold lamp: ${c.name} is reference [${c.cited}] in the paper's list. Its story is in Era ${REFS[c.cited - 1].era}.`);
        return reply(`Blue lamp: ${c.name} is not among the eight numbered references.`, c.note || "Not listed means absent from the bibliography; any influence claim needs its own evidence.");
      }
      if (cmd === "HELP") return reply("Commands: DRAWERS | PULL <drawer> | SHUT");
      if (cmd === "MORE") return reply("THE DEEPER STORY: a reference list is evidence of what an author pointed readers to. The game drills the difference between cited and merely famous, as the reference desk does. [E6-WP, E6-DOSSIER]",
        "STILL UNSOLVED: a list cannot say how much each work shaped the design; other caves keep those stories with their own sources.",
        `MUSEUM NOTE: ${ORIGINAL} The cards' names are the museum's short forms.`);
      if (cmd === "SOURCES") return reply(...["E6-WP", "E6-DOSSIER"].map((k) => `[${k}] ${sources[k].label} ${sources[k].href}`));
      return reply("Commands: DRAWERS | PULL <drawer> | SHUT");
    }
  });
  // Each model's nodes follow its state: called after every command and on RESET, never per frame.
  const syncArg = () => {
    if (!argNodes) return;
    const N = argNodes;
    // Cards glide to their slot or tray place with a little hop, each a beat after the last, and snap down.
    for (let k = 0; k < 6; k++) {
      const s = arg.where[k], c = N.cards[k];
      let x, z;
      if (s >= 0) { x = N.slotX[s]; z = N.slotZ; } else { let t = 0; while (arg.tray[t] !== k) t++; x = N.slotX[t]; z = N.trayZ; }
      const moving = Math.abs(c.position.x - x) > 1e-4 || Math.abs(c.position.z - z) > 1e-4;
      to(c, PX, x, 0.5, 1); to(c, PZ, z, 0.5, 1);
      if (moving) hop(c, 0.22, 0.5);
    }
    for (let s = 0; s < 6; s++) { lampOn(N.green[s], arg.mark[s] === 1, 1, 0.35, s * 0.08); lampOn(N.red[s], arg.mark[s] === 2, 1, 0.35, s * 0.08); }
    lampOn(N.win, arg.S.solved, 1.3, 0.8, 0.5);
    if (N.pool) to(N.pool, GLOW, arg.S.solved ? 1.6 : 1, 0.8, 2, 0.5);
  };
  const syncLay = () => {
    if (!layNodes) return;
    const N = layNodes;
    // A tab lifts out and up with a small overshoot, then settles; a lowered one eases back.
    for (let i = 0; i < SECTIONS.length; i++) {
      const up = i === lay.a || i === lay.b, t = N.tabs[i];
      to(t, PY, N.tabY[i] + (up ? 0.12 : 0), 0.45, up ? 1 : 0); to(t, PZ, N.tabZ + (up ? 0.12 : 0), 0.45, up ? 1 : 0);
    }
    const put = (marker, i, page) => {
      const on = i >= 0 || page > 0;
      to(marker, PX, N.pageX[on ? (i >= 0 ? SECTIONS[i].page : page) - 1 : 0], marker.visible && on ? 0.5 : 0, 0);
      lampOn(marker, on, 1, 0.4);
    };
    put(N.gold, lay.a, lay.page); put(N.teal, lay.b, 0);
  };
  const syncCat = () => {
    if (!catNodes) return;
    const N = catNodes;
    for (let i = 0; i < CARDS.length; i++) to(N.drawers[i], PZ, N.drawerZ + (cat.open[i] ? 0.3 : 0), 0.4, cat.open[i] ? 1 : 0);
    lampOn(N.gold, cat.last >= 0 && !!CARDS[cat.last].cited, 1.2, 0.4, 0.25); lampOn(N.blue, cat.last >= 0 && !CARDS[cat.last].cited, 1.2, 0.4, 0.25);
  };
  const syncWs = () => {
    if (!wsNodes) return;
    const N = wsNodes;
    for (let p = 0; p < PAGES; p++) lampOn(N.lit[p], p === ws.page - 1, 1, 0.3);
    const f = Math.min(1, headerBytes(ws.years) / MEMORY_2008);
    // The bar grows from its left end: its width and its middle ease together.
    N.fill.visible = f > 0; to(N.fill, SX, Math.max(0.001, f), 0.9, 2); to(N.fill, PX, N.barX0 + N.barW * f / 2, 0.9, 2);
    lampOn(N.glow, ws.lamp, 1, 0.6);
    if (N.pool) to(N.pool, GLOW, ws.lamp ? 1 : 0.35, 0.6, 2);
  };
  // The laptop: each filed card flies from the card box onto its pile (gold: in the paper's list; blue: not), and the
  // piles stand as tall as their counts.
  const syncDesk = (flew = -1) => {
    if (!deskNodes) return;
    const N = deskNodes;
    let cited = 0, not = 0;
    for (let i = 0; i < CARDS.length; i++) if (desk.filed[i]) { if (CARDS[i].cited) cited++; else not++; }
    const pile = (n, count, of) => { const h = Math.max(0.001, count / of); n.visible = count > 0; to(n, SY, h, 0.4, 2, 0.35); to(n, PY, N.pileY + N.pileH * h / 2, 0.4, 2, 0.35); };
    pile(N.citedPile, cited, 8); pile(N.notPile, not, 4);
    if (flew >= 0) {
      const c = N.flyer, toCited = !!CARDS[flew].cited, top = N.pileY + N.pileH * (toCited ? cited / 8 : not / 4) + 0.02;
      c.visible = true;
      putF(c, PX, N.boxX); putF(c, PZ, N.boxZ); putF(c, PY, top);
      to(c, PX, toCited ? N.citedX : N.notX, 0.55, 2); to(c, PZ, N.pileZ, 0.55, 2); hop(c, 0.35, 0.55);
    } else if (!cited && !not) N.flyer.visible = false;
  };
  // The two payments: signing slides a slip in toward the one coin; with both signed they meet in conflict (a red
  // lamp between them); ORDER settles the first onto the ledger and pushes the second back, marked rejected.
  const syncPay = () => {
    if (!payNodes) return;
    const N = payNodes, both = pay.signed.BO && pay.signed.CY, first = pay.order ? pay.order.slice(0, 2) : "";
    const place = (side, who) => {
      const s = N[side], signed = pay.signed[who], accepted = first === who, rejected = !!first && !accepted;
      const x = accepted ? 0 : rejected ? s.home * 1.15 : signed ? s.home * 0.55 : s.home;
      for (const n of s.parts) to(n, PX, N.cx + x + n.e6dx, 0.6, accepted || !signed ? 0 : 1);
      lampOn(s.lamp, rejected, 1, 0.4, 0.4);
    };
    place("left", "BO"); place("right", "CY");
    lampOn(N.conflict, both && !first, 1.2, 0.5, 0.4);
    lampOn(N.ok, !!first, 1, 0.5, 0.5);
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
      arg = createArgument(); lay = { a: -1, b: -1, page: 0 }; ws = { page: 1, years: 0, lamp: true }; cat = { open: new Uint8Array(CARDS.length), last: -1 };
      // No tween during the build (its syncs lay models out); the kit's sound hook when there is one.
      anim.live = false; anim.calm = false; anim.cue = typeof kit.cue === "function" ? kit.cue : null; finishAll();
      blink = 0;
      const L = kit.channel.x0, R = kit.channel.x1, at = (u) => era.z1 - u;

      // The announcement: a lit notice stand with one printed email (left bank, u 14).
      { const x = L - 7, z = at(14);
        solid(3, 0.2, 0.8, "#5a4630", x, top + 0.1, z);
        solid(0.15, 2.2, 0.15, "#5a4630", x - 1.3, top + 1.1, z); solid(0.15, 2.2, 0.15, "#5a4630", x + 1.3, top + 1.1, z);
        solid(2.8, 1.5, 0.12, "#3a2e22", x, top + 1.6, z);
        solid(1.1, 1.3, 0.03, "#f3ecd8", x, top + 1.6, z + 0.08, 0.25);
        for (let i = 0; i < 6; i++) solid(0.8, 0.04, 0.01, "#6d6352", x, top + 2.05 - i * 0.16, z + 0.1);
        // The board's frame and the posts' feet, a hooded lamp over the notice, pins at the paper's corners, the email's
        // header rule and sign-off, and a dated plaque under it with an amber strip.
        detail(kit, x, top, z, (M) => [B(M, 2.96, 0.1, 0.2, "#7a6243", 0, 2.4, 0), B(M, 2.96, 0.1, 0.2, "#7a6243", 0, 0.8, 0),
          ...[-1, 1].map((sd) => B(M, 0.1, 1.7, 0.2, "#7a6243", sd * 1.44, 1.6, 0)), ...[-1, 1].map((sd) => B(M, 0.42, 0.1, 0.62, "#3a2e22", sd * 1.3, 0.25, 0)),
          B(M, 0.06, 0.06, 0.5, "#3b3f42", 0, 2.58, 0.2), B(M, 0.62, 0.12, 0.2, "#2f4a3a", 0, 2.56, 0.46), B(M, 0.54, 0.02, 0.14, "#fff2c8", 0, 2.49, 0.46, 1),
          ...rows(4, (k) => B(M, 0.05, 0.05, 0.03, "#c8322a", (k % 2 ? 0.5 : -0.5), k < 2 ? 2.2 : 1.0, 0.11, 0.3)),
          B(M, 0.95, 0.06, 0.012, "#2f4f7a", 0, 2.17, 0.1), ...rows(3, (k) => B(M, 0.5 - k * 0.1, 0.03, 0.01, "#6d6352", -0.15 - k * 0.05, 1.12 - k * 0.07, 0.1)),
          B(M, 0.5, 0.16, 0.03, "#2b221d", 0.95, 1.0, 0.075), B(M, 0.4, 0.04, 0.02, "#ffb347", 0.95, 1.0, 0.095, 0.8)]);
        pool(kit, x, z + 1.1, 3.4, 2.2);
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
        // A plinth and a carved front panel, a brass bezel round each reference light, the open paper's gutter, ruled
        // lines on both pages (a heavier title line on the first) and a red ribbon, a green-shaded reading lamp at the
        // back, and a cushion on each bench.
        detail(kit, x, top, z, (M) => [B(M, 4.1, 0.08, 1.9, "#3a2e22", 0, 0.04, 0), B(M, 3.5, 0.5, 0.02, "#4e3c28", 0, 0.45, 0.905),
          ...rows(8, (i) => B(M, 0.22, 0.12, 0.02, "#b08a3a", -1.4 + i * 0.4, 0.85, 0.905, 0.15)), B(M, 0.06, 0.03, 0.9, "#d8ccb0", 0, 1.05, 0),
          B(M, 0.7, 0.008, 0.05, "#2b221d", -0.62, 1.058, -0.36), ...rows(14, (k) => B(M, 0.95, 0.004, 0.022, "#8a8070", (k < 7 ? -0.62 : 0.62), 1.057, -0.25 + (k % 7) * 0.09)),
          B(M, 0.04, 0.006, 0.55, "#c8322a", 0.3, 1.06, 0.2), B(M, 0.26, 0.04, 0.22, "#b08a3a", 1.5, 1.04, -0.5), B(M, 0.04, 0.34, 0.04, "#b08a3a", 1.5, 1.22, -0.5),
          B(M, 0.52, 0.12, 0.22, "#2f6b4a", 1.5, 1.42, -0.42), B(M, 0.46, 0.02, 0.16, "#fff2c8", 1.5, 1.355, -0.42, 1),
          ...[-2.6, 2.6].map((dx) => B(M, 1.1, 0.07, 0.5, "#7a2f2a", dx, 0.48, 1.2))]);
        // The era's clearest light: a warm glow across the desk top round the open paper, brightening as a page turns,
        // and a pool on the floor where the reader stands. A loose leaf hinged at the gutter turns over each time the
        // paper is opened (ruled on both faces).
        const lamp = detail(kit, x, top, z, (M) => [B(M, 3.4, 0.004, 1.3, "#d6a752", 0, 1.023, 0, 0.55), B(M, 2.7, 0.004, 1.06, "#ffe1a0", 0, 1.026, 0, 0.6)]);
        const leaf = detail(kit, x, top + 1.062, z, (M) => [B(M, 1.16, 0.008, 0.86, "#fbf6e6", 0.6, 0, 0, 0.42),
          ...rows(10, (k) => B(M, 0.9, 0.003, 0.02, "#8a8070", 0.62, (k < 5 ? 0.006 : -0.006), -0.25 + (k % 5) * 0.12))]);
        paperNodes = { leaf, lamp, side: 1 };
        pool(kit, x, z + 1.6, 5, 3.4, 0.4);
        obstacle(x - 2, x + 2, z - 0.9, z + 0.9);
        sign("THE WHITEPAPER · 31 OCT 2008", "the anchor work: a proposal, read it here · announced date, the PDF is undated", x, top + 3.1, z, 0, 0.5);
        prop({ id: "e6-paper", year: 2008, connection: "anchor", date: "31 October 2008: the dated announcement; the PDF itself prints no day of publication",
          title: "Bitcoin: A Peer-to-Peer Electronic Cash System", label: "THE WHITEPAPER · 2008", sourceKeys: ["E6-WP", "E6-ANN", "E6-REL", "E6-DOSSIER"],
          at: { x, y: top, z: z + 2 }, reach: 2.2, pick: { w: 4, h: 1.6, d: 1.8, x, z }, onUse: () => { turnPage(); return PAPER; } }); }

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
            at: { x: sx + 1.9, y: top, z }, reach: 1.3, pick: { w: 1, h: 2.2, d: 1.6, x: sx + 0.3, z }, onUse: () => { lightSlot(r.n); return slotBoard(r); } });
        });
        obstacle(sx - 0.7, sx + 0.7, z0, z1);
        // A kick plinth and a crown along the case, a brass reading rail, a divider between each pair of slots, brass
        // bookends either side of each slot's five spines and a number plate on the shelf's edge under each.
        const slotDz = REFS.map((r, i) => at(u0 + i * step) - mid);
        detail(kit, sx, top, mid, (M) => [B(M, 1.35, 0.16, len, "#3a2a1a", 0.12, 0.08, 0), B(M, 1.4, 0.16, len + 0.1, "#6b5236", 0.12, 7.06, 0),
          B(M, 0.05, 0.05, len - 0.4, "#b08a3a", 0.78, 2.78, 0, 0.1), ...rows(7, (i) => B(M, 1.15, 1.5, 0.06, "#5a4430", 0.1, 1.7, slotDz[i] - step / 2)),
          ...slotDz.flatMap((dz) => [B(M, 0.46, 0.5, 0.04, "#b08a3a", 0.15, 1.22, dz - 0.78), B(M, 0.46, 0.5, 0.04, "#b08a3a", 0.15, 1.22, dz + 0.78),
            B(M, 0.02, 0.12, 0.34, "#c9a35a", 0.71, 0.82, dz, 0.2)])]);
        // Under each slot's number plate a brass arrow, dark until that slot is opened: then it lights and slides out
        // toward the gallery's way in, back round the museum to where that work's story is told.
        const beacons = [], beaconZ = [];
        slotDz.forEach((dz) => {
          const bz = mid + dz;
          beaconZ.push(bz);
          const b = detail(kit, sx + 0.74, top + 1.75, bz, (M) => [B(M, 0.02, 0.06, 0.34, "#b08a3a", 0, 0, -0.04, 0.4),
            B(M, 0.03, 0.05, 0.05, "#ffd36a", 0, 0, 0.16, 1), B(M, 0.03, 0.11, 0.05, "#ffd36a", 0, 0, 0.11, 1), B(M, 0.03, 0.17, 0.05, "#ffd36a", 0, 0, 0.06, 1)]);
          b.visible = false;
          beacons.push(b);
        });
        slotNodes = { beacons, beaconZ };
        pool(kit, sx + 1.7, mid, 2.2, len, 0.3);
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
        const screen = solid(1.15, 0.7, 0.02, "#1e3346", x, top + 1.36, z - 0.27, 0.35);
        for (let i = 0; i < 4; i++) solid(0.7, 0.04, 0.01, "#9fc4dd", x - 0.1, top + 1.6 - i * 0.12, z - 0.255, 0.4);
        cursor = solid(0.06, 0.07, 0.01, "#e8f2fa", x + 0.32, top + 1.24, z - 0.255, 0.8);
        for (let i = 0; i < 3; i++) solid(0.5, 0.02, 0.35, "#f3ecd8", x + 1.1, top + 0.92 + i * 0.02, z + 0.2 - i * 0.05);
        // Keys on the keyboard, a trackpad and the hinge, a box of index cards (the cards the desk sorts) with a few
        // coloured tabs, a mug, two drawers with pulls and a plinth: an original design, no maker's mark.
        detail(kit, x, top, z, (M) => [...rows(44, (k) => B(M, 0.08, 0.012, 0.08, "#3c3f44", -0.5 + (k % 11) * 0.1, 0.976, -0.12 + Math.floor(k / 11) * 0.1)),
          B(M, 0.4, 0.004, 0.22, "#a6a9ac", 0, 0.957, 0.45), B(M, 1.2, 0.05, 0.06, "#8d9093", 0, 0.975, -0.27), B(M, 0.03, 0.03, 0.01, "#101214", 0, 1.76, -0.27),
          B(M, 0.5, 0.25, 0.35, "#7a6243", -1.15, 1.025, 0.1), ...rows(5, (k) => B(M, 0.44, 0.16, 0.012, "#f3ecd8", -1.15, 1.17, -0.02 + k * 0.06)),
          ...rows(3, (k) => B(M, 0.1, 0.04, 0.014, ["#c8583a", "#4a7ab0", "#6fae3a"][k], -1.3 + k * 0.15, 1.26, 0.04 + k * 0.06)),
          B(M, 0.14, 0.16, 0.14, "#e9e2cc", 1.4, 0.98, -0.4), B(M, 0.11, 0.006, 0.11, "#3a2414", 1.4, 1.06, -0.4),
          ...[-1, 1].flatMap((sd) => [B(M, 1.0, 0.3, 0.02, "#5a4430", sd * 0.95, 0.62, 0.71), B(M, 0.2, 0.04, 0.03, "#c9a35a", sd * 0.95, 0.66, 0.73, 0.2)]),
          B(M, 3.5, 0.08, 1.5, "#3a2e22", 0, 0.04, 0)]);
        // Two filing trays at the desk's front left, gold for the paper's numbered references and blue for names it does
        // not list; FILE sends a card flying from the card box onto its pile, and each pile stands as tall as its count.
        detail(kit, x, top, z, (M) => [...[[-1.25, "#c9a35a"], [-0.85, "#4a7ab0"]].flatMap(([tx, rim]) => [B(M, 0.34, 0.02, 0.26, "#3a2e22", tx, 0.91, 0.45),
          B(M, 0.34, 0.05, 0.02, rim, tx, 0.94, 0.33, 0.35), B(M, 0.34, 0.05, 0.02, rim, tx, 0.94, 0.57, 0.35)])]);
        const PILE_H = 0.12, pileY = top + 0.92;
        const citedPile = detail(kit, x - 1.25, pileY, z + 0.45, (M) => [B(M, 0.28, PILE_H, 0.2, "#f3ecd8", 0, 0, 0, 0.1), B(M, 0.06, PILE_H, 0.21, "#c9a35a", -0.1, 0, 0, 0.3)]);
        const notPile = detail(kit, x - 0.85, pileY, z + 0.45, (M) => [B(M, 0.28, PILE_H, 0.2, "#f3ecd8", 0, 0, 0, 0.1), B(M, 0.06, PILE_H, 0.21, "#4a7ab0", -0.1, 0, 0, 0.3)]);
        const flyer = detail(kit, x - 1.15, top + 1.2, z + 0.1, (M) => [B(M, 0.26, 0.008, 0.18, "#fbf6e6", 0, 0, 0, 0.2)]);
        flyer.visible = false;
        deskNodes = { citedPile, notPile, flyer, pileY, pileH: PILE_H, pileZ: z + 0.45, citedX: x - 1.25, notX: x - 0.85, boxX: x - 1.15, boxZ: z + 0.1 };
        laptopNodes = { screen };
        syncDesk();
        pool(kit, x, z + 1.2, 4, 2.4, 0.3);
        obstacle(x - 1.7, x + 1.7, z - 0.7, z + 0.7);
        sign("REFERENCE DESK · 2008 LAPTOP", "Space: sort the reference cards · original design, not the author's computer", x, top + 2.6, z + 0.1, 0, 0.42);
        prop({ id: "e6-laptop", year: 2008, connection: "context", date: "14 October 2008: an example laptop announced; this desk is an original design",
          title: "2008 reference desk", label: "REFERENCE DESK · 2008", sourceKeys: ["E6-GEAR", "E6-WP"],
          at: { x, y: top, z: z + 1.8 }, reach: 2, pick: { w: 3.4, h: 1.8, d: 1.4, x, z }, onUse: () => { wakeScreen(); return { terminal: laptopTerminal() }; } }); }

      // Two conflicting payments (right bank, u 22): two slips on a table, one ledger between them.
      { const x = R + 9, z = at(22);
        solid(3.6, 0.9, 1.6, "#5e4a33", x, top + 0.45, z);
        const slipL = solid(0.9, 0.03, 0.6, "#f3ecd8", x - 1.1, top + 0.92, z, 0.25), slipR = solid(0.9, 0.03, 0.6, "#f3ecd8", x + 1.1, top + 0.92, z, 0.25);
        const sealL = solid(0.18, 0.04, 0.18, "#b8322a", x - 0.8, top + 0.95, z + 0.15), sealR = solid(0.18, 0.04, 0.18, "#b8322a", x + 1.4, top + 0.95, z + 0.15);
        solid(0.8, 0.12, 1, "#2f4f3a", x, top + 0.96, z);
        // The open ledger's pages and rules, written lines on both slips, a dish with the one toy coin behind the ledger,
        // an inkwell and pen, and the table's plinth.
        detail(kit, x, top, z, (M) => [B(M, 0.72, 0.02, 0.92, "#efe6d2", 0, 1.03, 0), B(M, 0.03, 0.025, 0.92, "#c8bc9c", 0, 1.035, 0),
          ...rows(8, (k) => B(M, 0.3, 0.004, 0.015, "#6d6352", (k < 4 ? -0.18 : 0.18), 1.042, -0.3 + (k % 4) * 0.18)),
          B(M, 0.34, 0.04, 0.34, "#3a2e22", 0, 0.92, -0.62), B(M, 0.24, 0.24, 0.05, "#e0b84a", 0, 1.08, -0.62, 0.25), B(M, 0.1, 0.1, 0.06, "#8a6a2a", 0, 1.08, -0.62, 0.1),
          B(M, 0.14, 0.12, 0.14, "#1c2430", 1.55, 0.96, -0.55), B(M, 0.03, 0.03, 0.4, "#2b221d", 1.35, 0.93, -0.4),
          B(M, 3.7, 0.08, 1.7, "#3a2e22", 0, 0.04, 0)]);
        // Each slip's written lines ride with it. Signing slides a slip in toward the one coin; with both signed a red lamp
        // on the coin's dish says they conflict; ORDER settles the first onto the ledger (a green lamp) and pushes the
        // second back to the table's edge, where its own red lamp marks it rejected.
        const lines = (sx) => detail(kit, sx, top, z, (M) => rows(4, (k) => B(M, 0.6 - (k === 3 ? 0.25 : 0), 0.004, 0.03, "#6d6352", 0, 0.938, -0.2 + k * 0.09)));
        const linesL = lines(x - 1.1), linesR = lines(x + 1.1);
        slipL.e6dx = 0; slipR.e6dx = 0; linesL.e6dx = 0; linesR.e6dx = 0; sealL.e6dx = 0.3; sealR.e6dx = 0.3;
        const lampAt = (lx, ly, lz, color, w = 0.14) => { const n = detail(kit, lx, ly, lz, (M) => [B(M, w, 0.06, 0.06, color, 0, 0, 0, 1)]); n.visible = false; return n; };
        payNodes = { cx: x,
          left: { home: -1.1, parts: [slipL, sealL, linesL], lamp: lampAt(x - 1.62, top + 0.97, z - 0.36, "#ff5a48") },
          right: { home: 1.1, parts: [slipR, sealR, linesR], lamp: lampAt(x + 1.62, top + 0.97, z - 0.36, "#ff5a48") },
          conflict: lampAt(x, top + 1.24, z - 0.62, "#ff6a3a", 0.2), ok: lampAt(x, top + 1.08, z + 0.52, "#7dff8a", 0.3) };
        syncPay();
        pool(kit, x, z + 1.3, 4.4, 2.6, 0.32);
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
        // Four raised panels, iron hinges, a keyhole plate, a torn-off calendar leaf for the future date, a threshold
        // and a thin warm light under the door: the next gallery is through it, not yet.
        detail(kit, x, top, z, (M) => [...rows(4, (k) => B(M, 0.82, k < 2 ? 1 : 0.9, 0.03, "#5a3d24", (k % 2 ? 0.5 : -0.5), k < 2 ? 2.45 : 0.8, 0.075)),
          ...rows(3, (k) => B(M, 0.2, 0.08, 0.04, "#2e3236", -1.05, 0.5 + k * 1.1, 0.08)), B(M, 0.1, 0.24, 0.02, "#d8b05a", 0.85, 1.3, 0.07, 0.3),
          B(M, 0.5, 0.56, 0.02, "#f3ecd8", 0, 1.62, 0.075), B(M, 0.5, 0.12, 0.024, "#b8322a", 0, 1.84, 0.077), B(M, 0.16, 0.24, 0.026, "#2b221d", 0, 1.56, 0.078),
          B(M, 2.7, 0.08, 0.7, "#3a2e22", 0, 0.04, 0.05)]);
        // A wax seal across the door's middle seam, still unbroken; opening the door's panel sweeps a glint across it and
        // swells the warm light that leaks under the door.
        detail(kit, x, top, z, (M) => [B(M, 0.26, 0.26, 0.03, "#9a2a22", 0, 1.2, 0.09, 0.12), B(M, 0.16, 0.16, 0.012, "#c8463a", 0, 1.2, 0.106, 0.2),
          B(M, 0.5, 0.03, 0.012, "#c9a35a", 0, 1.2, 0.082, 0.2), B(M, 0.04, 0.12, 0.012, "#9a2a22", -0.05, 1.03, 0.09), B(M, 0.04, 0.09, 0.012, "#9a2a22", 0.06, 1.05, 0.09)]);
        const glint = detail(kit, x - 0.14, top + 1.2, z + 0.115, (M) => [B(M, 0.035, 0.27, 0.006, "#fff6d8", 0, 0, 0, 1.4)]);
        glint.visible = false;
        const light = detail(kit, x, top + 0.095, z + 0.07, (M) => [B(M, 2.2, 0.03, 0.05, "#ffe7a8", 0, 0, 0, 1.2)]);
        doorNodes = { glint, light, glintX0: x - 0.14, glintX1: x + 0.14 };
        pool(kit, x, z + 1.4, 3.4, 2.4, 0.34);
        obstacle(x - 1.5, x + 1.5, z - 0.3, z + 0.3);
        sign("8 JANUARY 2009 · NOT YET", "the software-release announcement · 69 days after this cave's date", x, top + 4.3, z + 0.25, 0, 0.42);
        prop({ id: "e6-january", year: 2009, connection: "context", date: "8 January 2009, 19:27:40 UTC: the release announcement, a future date seen from this cave",
          title: "The January door", label: "JANUARY DOOR · 8 JANUARY 2009", sourceKeys: ["E6-REL", "E6-WP"],
          at: { x, y: top, z: z + 1.6 }, reach: 2, pick: { w: 2.6, h: 3.4, d: 0.6, x, z }, onUse: () => { sealGlint(); return JANUARY; } }); }

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
        argNodes = { cards, green, red, win, slotX, slotZ: z + 0.35, trayZ: z - 0.35, pool: pool(kit, cx, z + 1.3, 3.8, 2.4, 0.32) };
        // The tray's rails, a brass rule between the tray and the slots, a holder under each lamp, a numbered plaque (one
        // pip a slot number) on the table's front under each slot, the gold lamp's stand, and a plinth.
        detail(kit, cx, top, z, (M) => [...[-0.62, -0.08].map((dz) => B(M, 3.25, 0.04, 0.04, "#2b221d", 0, 0.94, dz)), B(M, 3.2, 0.02, 0.03, "#b08a3a", 0, 0.925, 0.06, 0.15),
          ...slotX.flatMap((sx, k) => [B(M, 0.2, 0.025, 0.1, "#3a2e22", sx - cx, 0.915, 0.7), B(M, 0.42, 0.14, 0.02, "#e8e4d4", sx - cx, 0.7, 0.81),
            ...rows(k + 1, (d) => B(M, 0.035, 0.035, 0.01, "#2b221d", sx - cx - k * 0.025 + d * 0.05, 0.7, 0.822))]),
          B(M, 0.05, 0.42, 0.05, "#3a2e22", 0, 1.13, -0.7), B(M, 0.62, 0.04, 0.16, "#b08a3a", 0, 1.33, -0.7, 0.1), B(M, 3.5, 0.08, 1.7, "#3a2e22", 0, 0.04, 0)]);
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
        pool(kit, cx, z + 1.2, 3.8, 2.2, 0.32);
        // A header beam over the posts with caps, five ruled lines on each page under its tabs, feet under the posts and
        // a brass plaque on the base.
        detail(kit, cx, top, z, (M) => [B(M, 3.6, 0.12, 0.14, "#4b3a26", 0, 2.36, -0.2), ...[-1.65, 1.65].map((px) => B(M, 0.18, 0.06, 0.18, "#6b5236", px, 2.45, -0.2)),
          ...pageX.flatMap((px) => rows(5, (k) => B(M, 0.24 - (k === 4 ? 0.08 : 0), 0.012, 0.004, "#9a9080", px - cx, 1.55 + k * 0.04, -0.153))),
          ...[-1.65, 1.65].map((px) => B(M, 0.5, 0.08, 0.9, "#3a2e22", px, 0.04, -0.05)), B(M, 0.8, 0.12, 0.02, "#c9a35a", 0, 0.15, 0.36, 0.2)]);
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
        wsNodes = { lit, fill, glow, barX0, barW, pool: pool(kit, cx, z + 1.1, 3.6, 2.2, 0.3) };
        // Keys on the keyboard, a mouse on its pad, the display's foot, a mug, the lamp's base, a drawer with its pull and
        // a plinth: unbranded, as the sign says.
        detail(kit, cx, top, z, (M) => [...rows(42, (k) => B(M, 0.065, 0.012, 0.07, "#55575c", -0.82 + (k % 14) * 0.08, 0.826, 0.06 + Math.floor(k / 14) * 0.09)),
          B(M, 0.3, 0.005, 0.25, "#2b3a4a", 0.45, 0.783, 0.2), B(M, 0.08, 0.03, 0.13, "#3a3b3f", 0.45, 0.8, 0.2), B(M, 0.5, 0.03, 0.3, "#2a2b2e", -0.3, 0.795, -0.3),
          B(M, 0.13, 0.15, 0.13, "#4a7ab0", -1.3, 0.855, 0.2), B(M, 0.22, 0.04, 0.22, "#2b221d", 1.3, 0.8, -0.35),
          B(M, 0.9, 0.25, 0.02, "#5a4430", 1.0, 0.55, 0.61), B(M, 0.2, 0.04, 0.03, "#c9a35a", 1.0, 0.58, 0.63, 0.2), B(M, 3.3, 0.08, 1.3, "#3a2e22", 0, 0.04, 0)]);
        syncWs();
        obstacle(cx - 1.6, cx + 1.6, z - 0.6, z + 0.6);
        // Its sign stands behind the display and over head height, clear of the sight line to the January door beside it.
        sign("READING WORKSTATION · 2008 STYLE", "an original, unbranded desk for reading the paper · context, nothing introduced on 31 October 2008", cx, top + 3.0, z - 0.45, 0, 0.42);
        prop({ id: "e6-workstation", year: 2008, connection: "context", date: "2008: the period illustrated; an original, unbranded design, not equipment introduced on 31 October 2008",
          title: "Reading workstation", label: "READING WORKSTATION · 2008 STYLE", hint: "Type PAGE 3 or STORAGE 10; LAMP switches the desk lamp",
          sourceKeys: ["E6-WP", "E6-GEAR", "E6-CLUSTER"], at: { x: cx, y: top, z: z + 1.8 }, reach: 2.2, pick: { w: 3.2, h: 2, d: 1.2, x: cx, z }, onUse: () => ({ terminal: wsTerminal() }) }); }

      // Citation Catch (right bank, u 65, past the January door): a card-catalogue cabinet of twelve drawers, one a card,
      // with a small console on top that plays the game. A modern museum toy, context only; built last so every earlier
      // exhibit keeps its order.
      { const x = R + 9, z = at(65), drawers = [], front = z + 0.43;
        solid(2.6, 1.2, 0.8, "#6b5236", x, top + 0.6, z);
        solid(2.8, 0.08, 0.95, "#4b3a26", x, top + 1.24, z);
        for (let i = 0; i < CARDS.length; i++) drawers.push(solid(0.56, 0.28, 0.08, "#8a6a44", x - 0.93 + (i % 4) * 0.62, top + 0.95 - Math.floor(i / 4) * 0.34, front));
        solid(0.9, 0.62, 0.6, "#2a2b2e", x + 0.6, top + 1.59, z - 0.05);
        solid(0.68, 0.44, 0.02, "#0f3a2c", x + 0.6, top + 1.61, z + 0.26, 0.6);
        const gold = solid(0.26, 0.16, 0.16, "#ffc94a", x - 0.95, top + 1.38, z + 0.2, 1.2), blue = solid(0.26, 0.16, 0.16, "#6ab8ff", x - 0.55, top + 1.38, z + 0.2, 1.2);
        catNodes = { drawers, drawerZ: front, gold, blue };
        pool(kit, x, z + 1.4, 3.2, 2.2, 0.3);
        // Each drawer's brass pull and paper label frame move with it; the cabinet's plinth, side trims, the console's
        // bezel, knobs and a tray of index cards stand still.
        if (kit.M.merge) {
          const M = kit.M, face = M.merge(B(M, 0.16, 0.05, 0.04, "#c9a35a", 0, -0.06, 0.05, 0.15), B(M, 0.3, 0.09, 0.012, "#f3ecd8", 0, 0.06, 0.045), B(M, 0.34, 0.012, 0.014, "#3a2e22", 0, 0.11, 0.046));
          for (const d of drawers) kit.addChild(d, kit.createNode({ geometry: face }));
        }
        detail(kit, x, top, z, (M) => [B(M, 2.7, 0.08, 0.9, "#3a2e22", 0, 0.04, 0), ...[-1, 1].map((sd) => B(M, 0.06, 1.2, 0.84, "#4b3a26", sd * 1.31, 0.6, 0)),
          B(M, 0.82, 0.56, 0.03, "#3b3f42", 0.6, 1.61, 0.25), ...rows(3, (k) => B(M, 0.06, 0.06, 0.03, k ? "#c9c2ae" : "#ff8a5a", 0.4 + k * 0.12, 1.33, 0.26, k ? 0 : 0.8)),
          B(M, 0.32, 0.04, 0.22, "#c9a35a", -0.95, 1.3, 0.2), B(M, 0.32, 0.04, 0.22, "#c9a35a", -0.55, 1.3, 0.2),
          B(M, 0.5, 0.12, 0.3, "#7a6243", -0.75, 1.34, -0.25), ...rows(6, (k) => B(M, 0.44, 0.12, 0.012, "#f3ecd8", -0.75, 1.43, -0.36 + k * 0.045))]);
        syncCat();
        obstacle(x - 1.5, x + 1.5, z - 0.5, z + 0.8);
        sign("CITATION CATCH · MODERN TOY", "the paper's eight references and four that are not · play it on the console", x, top + 2.6, z + 0.2, 0, 0.42);
        prop({ id: "e6-catch", year: 2008, connection: "context", date: "2008: the paper whose reference list the cards follow; the cabinet and its game are modern museum designs",
          title: "Citation Catch", label: "CITATION CATCH · 2008 PAPER", hint: "Space plays Citation Catch on the console; type PULL R3 to open a drawer",
          sourceKeys: ["E6-WP", "E6-DOSSIER"], at: { x, y: top, z: z + 2 }, reach: 2.2, pick: { w: 2.8, h: 2, d: 1, x, z }, onUse: () => ({ terminal: catTerminal() }) }); }
      // From here on, commands ease their models between states.
      anim.live = true;
    },
    // Runs only while the visitor's gallery is this one, or its exhibit's workbench is open, and never under pause or the
    // menu or console (scene-genesis.js holds it then). The models' tweens play here, even while a workbench is being
    // read (that is where the visitor watches them); Calm ends them at once. The laptop's cursor blinks only while
    // nobody is reading and Calm is off. Allocation-free.
    update(dt, elapsed, state) {
      anim.calm = !!state.calm;
      if (tw.n) { if (anim.calm) finishAll(); else stepTweens(dt); }
      if (!cursor) return;
      if (state.reading || state.calm) { cursor.visible = true; return; }
      blink += dt;
      cursor.visible = (blink % 1.1) < 0.6;
    },
    // Leaving the gallery finishes every transition (nothing resumes on return; the models stand in their end states).
    active(on) { if (!on) finishAll(); },
    dispose() {
      finishAll(); anim.live = false; anim.cue = null;
      pay = desk = cursor = null; arg = lay = ws = argNodes = layNodes = wsNodes = cat = catNodes = null;
      deskNodes = payNodes = paperNodes = slotNodes = doorNodes = laptopNodes = null;
    }
  });
})();
