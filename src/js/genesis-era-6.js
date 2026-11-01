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
// payments (a simplified teaching model of what a signature alone cannot decide) and the unopened January door.
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
      href: DOSSIER, kind: "context", verified: true }
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
      there: "Its station stands on Era 4's left bank, with a STEP post beside it." },
    { n: 2, year: 1999, who: "Massias, Avila and Quisquater", work: "a secure timestamping service with minimal trust", era: 4, keys: ["E6-WP", "E4-TIMESEC"],
      there: "Its station stands on Era 4's left bank, near the way in, with a STEP post beside it." },
    { n: 3, year: 1991, who: "Haber and Stornetta", work: "How to Time-Stamp a Digital Document", era: 3, keys: ["E6-WP", "haber1991"],
      there: "Its story is told at Fingerprints and Time's lectern, in Era 3's room on the left bank." },
    { n: 4, year: 1993, who: "Bayer, Haber and Stornetta", work: "more efficient and reliable digital time-stamping", era: 3, keys: ["E6-WP", "bayer1993"],
      there: "Its story is told at Fingerprints and Time's lectern, in Era 3's room on the left bank." },
    { n: 5, year: 1997, who: "Haber and Stornetta", work: "Secure Names for Bit-Strings", era: 4, keys: ["E6-WP", "E4-NAMES"],
      there: "Its station stands on Era 4's left bank, near the way in, with a STEP post beside it." },
    { n: 6, year: 2002, who: "Adam Back", work: "Hashcash", era: 5, keys: ["E6-WP"],
      there: "Its year places it in Era 5's cave. Era 4 holds the separate 28 March 1997 Hashcash announcement." },
    { n: 7, year: 1980, who: "Ralph Merkle", work: "Protocols for Public Key Cryptosystems", era: 2, keys: ["E6-WP", "E2-MERKLE"],
      there: "Its Merkle-tree table stands in Era 2's cave, with a STEP post beside it." },
    { n: 8, year: 1957, who: "William Feller", work: "An Introduction to Probability Theory and Its Applications", era: 0, keys: ["E6-WP", "e0Feller"],
      there: "Its probability shelf stands on Era 0's left bank, with a STEP post beside it." }
  ];
  // Navigation is explanatory only: no shelf slot moves the visitor.
  const GO_BACK = "This slot is a pointer, not a link. To visit, board a boat, turn it and sail back upstream: each cave's years sign over its way in tells you where you are.";
  const NOT_LISTED = "The list has eight numbered entries. Chord, BitTorrent, RPOW and bit gold are not among them; any claim that they influenced Bitcoin needs its own evidence.";
  const slotBoard = (r) => ({ board: { room: `Reference ${r.n} - ${r.who.replace(/,/g, "")} - ${r.year}`, sources: r.keys, pages: [
    { caption: "In short", title: `Reference ${r.n}: ${r.year}`, text: [
      `Reference [${r.n}] in the whitepaper's list: ${r.who}, ${r.work}.`,
      `${r.year} is the year the paper's reference list gives for it, not the year the idea was invented. Other caves keep the finer dates.`] },
    { caption: "Where its story is", title: `Upstream in Era ${r.era}`, text: [`${CAVES[r.era]}. ${r.there}`, GO_BACK] },
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
      "The next cave, Genesis, covers 3 to 12 January 2009. Sail on downstream to reach it."] },
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
    { id: "RPOW", name: "RPOW", cited: 0 }, { id: "BITGOLD", name: "bit gold", cited: 0 }
  ];
  let desk = null, cursor = null, blink = 0;
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
        return reply(c.cited ? `Filed: reference [${c.cited}]. Its slot on the shelf points to Era ${REFS[c.cited - 1].era}.` : `Filed: not listed. ${c.name} is not among the eight numbered references; any influence claim needs its own evidence.`,
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

  const overview = {
    summary: "A paper can describe a machine before it runs. On 31 October 2008 Satoshi Nakamoto announced a paper about electronic cash. Read the proposal, check its eight references, and keep its date apart from the software that came in January 2009.",
    sourceKeys: ["E6-ANN", "E6-WP", "E6-REL", "E6-GEAR"],
    pages: [
      { caption: "What to try", title: "A reading room", text: [
        "Left bank: the announcement, the paper's reading desk, its eight-slot reference shelf, and a 2008-style laptop where you sort reference cards.",
        "Right bank: two conflicting payments (a simplified teaching model) and the January door, which stays shut. Walk up and press Space."] },
      { caption: "How to read this cave", title: "Dates and connections", text: [
        "Every label says what its date marks: the announcement's posting time, a reference year as the paper's list gives it, or a later date shown as the future.",
        "Only the paper itself is a step on the trail here. Each shelf slot points upstream to the cave that tells its story. The upper shelves are optional, for jetpack readers."] }
    ]
  };

  BL.genesisExhibits.register(6, {
    sources, overview,
    build(kit) {
      const { era, top, solid, sign, obstacle, prop } = kit;
      pay = { signed: { BO: false, CY: false }, order: "" };
      desk = { filed: new Uint8Array(CARDS.length), zoom: 1 };
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
          sign(`[${r.n}] ${r.who.toUpperCase()} · ${r.year}`, `${r.year}: the year the paper's list gives · story upstream in Era ${r.era}`, sx + 0.75, top + 2.2, z, Math.PI / 2, 0.24);
          prop({ id: `e6-ref-${r.n}`, year: r.year, title: `Reference ${r.n}: ${r.who}`, label: `REFERENCE [${r.n}] · ${r.who.toUpperCase()} · ${r.year}`, sourceKeys: r.keys,
            at: { x: sx + 1.9, y: top, z }, reach: 1.3, pick: { w: 1, h: 2.2, d: 1.6, x: sx + 0.3, z }, onUse: () => slotBoard(r) });
        });
        obstacle(sx - 0.7, sx + 0.7, z0, z1);
        sign("THE REFERENCE SHELF · 2008", "eight numbered references in the whitepaper · each slot points upstream", sx + 0.75, top + 3.4, at(u0 + step * 3.5), Math.PI / 2, 0.42);
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
    },
    // The laptop's cursor blinks; it stays lit while reading or under Calm. Allocation-free.
    update(dt, elapsed, state) {
      if (!cursor) return;
      if (state.reading || state.calm) { cursor.visible = true; return; }
      blink += dt;
      cursor.visible = (blink % 1.1) < 0.6;
    },
    dispose() { pay = desk = cursor = null; }
  });
})();
