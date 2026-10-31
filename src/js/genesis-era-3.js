// The Genesis Voyage, Era 3: Cypherpunks and Timestamps (1990–1995). The cave's exhibits beside Fingerprints and
// Time, which stays as it is: this module adds no stamp system of its own. Its newspaper re-links Tock's own pages
// with the desk's own fingerprint and rule (`G.chain`), so a page the visitor changes breaks exactly the links the desk
// shows breaking.
//
// The pure half (no DOM, so Node can check it) comes first: the words and sources (`SOURCES`, `EXHIBITS`), the
// newspaper (`createNewspaper`), the padlock post's toy key maths (`createKeyStation`), the office PC's extension with
// museum notes, a floppy and a pretend BBS (`createDesktop`, built on genesis-props.js's `createDos`), the pager
// (`createPager`, `createTriggers`), the original paddle-and-ball game (`createRally`), and where everything stands
// (`LAYOUT`, `OBSTACLES`, `CLEAR`, `LIGHTS`). `mount(host)` is the scene half: it builds the models under the scene's
// root, registers the props in the scene's registry, and returns `{ targets, update, dispose }`. scene-genesis.js
// wires it in; docs/genesis-voyage/exhibits/era-3.md has the integration patch.
//
// Every exhibit has a dated label, source keys, a short explanation for a 12-year-old, a deeper panel and a reset.
// Commentary written today is marked "Museum note (written today)". Content follows the Era 3 dossier
// (docs/genesis-voyage/eras/era-3-cypherpunks-and-timestamps.md on gv/research): only READY entries are stated as
// facts; HOLD entries (the Cypherpunks list's date, DigiCash, Surety) are named as on hold, with no date plaque. The
// BBS, the pager, the floppy and the arcade cabinet are period-style context with no specification claimed, as the
// dossier asks. Nothing here quotes or imagines the words of real people beyond the dossier's own short passages, and
// nothing typed leaves the page.
(() => {
  "use strict";
  const BL = window.BL = window.BL || {};
  const G = BL.genesisVoyage, GP = BL.genesisProps, GW = BL.genesisWorld;
  const ERA = 3, E = GW.ERAS[ERA];
  const NOTE = "Museum note (written today):";

  // --- Sources ------------------------------------------------------------------------------------------------------
  // The dossier's keys, with what each date marks. `kind` is the connection: "whitepaper citation [n]", or "context".
  const DOSSIER = "https://github.com/Bitcoin-Bill/oogaboogaland/blob/gv/research/docs/genesis-voyage/eras/era-3-cypherpunks-and-timestamps.md";
  const SOURCES = {
    "E3-HS": { label: "Haber and Stornetta, How to Time-Stamp a Digital Document, Journal of Cryptology 3(2), pp. 99–111, 1991 (received 19 Aug 1990, revised 26 Oct 1990)",
      href: "https://gwern.net/doc/bitcoin/1991-haber.pdf", kind: "whitepaper citation [3]" },
    "E3-BHS": { label: "Bayer, Haber and Stornetta, Improving the Efficiency and Reliability of Digital Time-Stamping (manuscript dated March 1992)",
      href: "https://www.math.columbia.edu/~bayer/papers/Timestamp_BHS93.pdf", kind: "whitepaper citation [4]" },
    "E3-BHS-PUB": { label: "The same chapter in Sequences II (Springer, 1993), publisher record",
      href: "https://doi.org/10.1007/978-1-4613-9323-8_24", kind: "whitepaper citation [4]" },
    "E3-WP": { label: "Satoshi Nakamoto, Bitcoin: A Peer-to-Peer Electronic Cash System (31 October 2008), section 3 and references [2] to [5]",
      href: "https://bitcoin.org/bitcoin.pdf", kind: "the whitepaper itself" },
    "E3-DN": { label: "Dwork and Naor, Pricing via Processing or Combatting Junk Mail (CRYPTO '92, author PDF)",
      href: "https://www.wisdom.weizmann.ac.il/~naor/PAPERS/pvp.pdf", kind: "context" },
    "E3-PGP": { label: "Philip Zimmermann, Why I Wrote PGP (essay dated June 1991, updated 1999)",
      href: "https://www.philzimmermann.com/EN/essays/WhyIWrotePGP.html", kind: "context" },
    "E3-HUGHES": { label: "Eric Hughes, A Cypherpunk's Manifesto (9 March 1993), Satoshi Nakamoto Institute reprint",
      href: "https://nakamotoinstitute.org/library/cypherpunk-manifesto/", kind: "context" },
    "E3-CPU": { label: "Intel, processor quick reference by year: 486 DX family, 10 April 1989",
      href: "https://www.intel.com/pressroom/kits/quickrefyr.htm", kind: "context" },
    "E3-GEAR": { label: "Era 3 dossier, period gear: BBS, pager, 3.5-inch floppy and consoles are context with no specification cleared",
      href: DOSSIER, kind: "context" },
    "E3-ORIGINAL": { label: "Original demonstration made for the voyage; not a historical claim",
      href: "https://github.com/Bitcoin-Bill/oogaboogaland/blob/gv/era-3-exhibits/docs/genesis-voyage/exhibits/era-3.md", kind: "museum demonstration" },
    "E3-HOLD": { label: "Era 3 dossier, Community and companies: on hold for date plaques",
      href: DOSSIER, kind: "context (on hold)" }
  };
  const sourceOf = (key) => SOURCES[key] || GP.sourceOf(key);
  const sourceLines = (keys) => keys.map((k) => `[${k}] ${sourceOf(k).label} (${sourceOf(k).kind}) ${sourceOf(k).href}`);

  // --- The exhibits' words ------------------------------------------------------------------------------------------
  // `label` (on its sign; it names its year), `dated` (what the date marks), `kid` (the short explanation), `deeper`
  // (the optional panel's paragraphs), `sourceKeys`, and `pager` (the pager's message when the visitor comes near).
  const EXHIBITS = {
    overview: { title: "Cypherpunks and Timestamps", year: 1990, label: "1990–1995 · CYPHERPUNKS AND TIMESTAMPS",
      dated: "1990–1995: the years this cave covers. Each exhibit gives its own date and what that date marks.",
      kid: "A digital page can be copied or changed without leaving a torn edge. In these years researchers worked out how fingerprints and linked records could show a change, and show that a page existed by a certain time. Other people built tools for private messages. These were different projects with different goals, not unfinished versions of Bitcoin.",
      deeper: [
        "Haber and Stornetta's journal paper (1991) timestamps data without showing what it says, by linking each record to the ones before it. It also considers a timestamping service that might cheat. [E3-HS]",
        "Bayer, Haber and Stornetta (manuscript March 1992, book 1993) gather many documents into a tree, so one small value per round is linked and widely published. [E3-BHS, E3-BHS-PUB]",
        "Also from these years, as context: Dwork and Naor (presented 1992) price access to a resource such as email with a moderately hard computation. PGP's author describes publishing it electronically for free in 1991. Eric Hughes's manifesto is dated 9 March 1993. None of these is cited in the whitepaper. [E3-DN, E3-PGP, E3-HUGHES]"],
      sourceKeys: ["E3-HS", "E3-BHS", "E3-BHS-PUB", "E3-WP", "E3-DN", "E3-PGP", "E3-HUGHES"],
      pager: "ERA 3 1990-95 WELCOME" },
    newspaper: { title: "The Daily Ooga press", year: 1991, label: "THE DAILY OOGA PRESS · 1991",
      dated: "1991: Haber and Stornetta's journal paper is published (manuscript received 19 August 1990, revised 26 October 1990). March 1992: Bayer, Haber and Stornetta's manuscript; 1993: their book chapter.",
      kid: "Tock's five pages are linked: each fingerprint is made from its page and the fingerprint before it. This morning's paper printed the last one. Change any page and its fingerprint changes, so every link after it fails, and the printed fingerprint no longer matches. Put the page back and everything matches again.",
      deeper: [
        "What these proposals establish: if a record's fingerprint is linked into a chain whose newest value was widely published, the record existed no later than that publication, and nobody can later change it, or slip in or reorder records before it, without the links failing for anyone who kept a later value. Haber and Stornetta argue certain backdating and forward-dating attacks are infeasible under stated assumptions, \"even with the collusion of a time-stamping service\". [E3-HS]",
        "Bayer, Haber and Stornetta make this cheaper: many documents go into one tree each round, each keeps a short path to the round's value, and only that value is linked and published. Their paper credits Merkle's earlier tree work. [E3-BHS, E3-BHS-PUB]",
        "What they do not establish: that what a page says is true, or who wrote it. A timestamp is evidence about data, not proof of its story. Publication still needs a widely witnessed place, such as a newspaper, and nothing here is money or a way for strangers to agree on one history. [E3-HS; interpretation]",
        "In the Bitcoin whitepaper (2008), section 3 begins with a timestamp server: hash a block of items and widely publish the hash, \"such as in a newspaper or Usenet post [2-5]\". References [3] and [4] are these two papers. [2] (1999) and [5] (1997) are later and belong to Era 4. [E3-WP]",
        `${NOTE} the fingerprints here are the desk's toy (FNV-1a, eight hex digits), not a secure hash; two pages could share one by accident. The pages and the rule are the same as Tock's desk, so both show the same chain.`],
      sourceKeys: ["E3-HS", "E3-BHS", "E3-BHS-PUB", "E3-WP", "E3-ORIGINAL"],
      pager: "PRESS: CHANGE A PAGE" },
    keys: { title: "Padlock post", year: 1991, label: "PADLOCK POST · 1991",
      dated: "1991: the year PGP's author says he published it electronically for free (his essay is dated June 1991 and was updated in 1999). This station is a teaching model, not PGP.",
      kid: "Bea hands out open padlocks to anyone: her public key. Snap one shut on your note and only Bea's own key, her private key, opens it. It works the other way too: Bea seals a note with her private key, and anyone can check the seal with her public one. That check is a signature.",
      deeper: [
        "PGP's author describes deciding to \"publish PGP electronically for free that year\": 1991. PGP was one of the tools of a wider privacy movement in these years. It is context here: the whitepaper does not cite it. [E3-PGP]",
        `${NOTE} this station is not PGP and not real encryption. Its numbers are tiny (n = 3233, from the primes 61 and 53, a classic textbook example) and anyone can break them by hand. Real tools use far larger numbers and extra steps. The idea of public keys comes from the 1970s (Era 1). [E3-ORIGINAL]`,
        `${NOTE} Bitcoin uses signatures, not secret messages: the whitepaper defines a coin as a chain of digital signatures. [E3-WP]`],
      sourceKeys: ["E3-PGP", "E3-WP", "E3-ORIGINAL"],
      pager: "PADLOCK POST: LOCK A NOTE" },
    desktop: { title: "Tock's office PC", year: 1993, label: "OFFICE PC · 1993",
      dated: "1993: an office PC of the kind in use then. Intel's date index records the 486 DX processor family's introduction on 10 April 1989; this generic, unbranded model is not a particular product.",
      kid: "A beige office computer like many in the early 1990s. Read the museum notes, look inside the floppy disk in drive A:, and dial a pretend bulletin board system (a BBS) to leave a message. Nothing you type leaves this page.",
      deeper: [
        "Intel's date index records the 486 DX family's introduction on 10 April 1989 and lists a 25 MHz configuration among the family's variants. That does not mean every speed shipped that day. [E3-CPU]",
        `${NOTE} a BBS was a computer people dialled into with a modem to read and post messages. The dossier treats BBSs, pagers and floppies as context and has not cleared model numbers, capacities or prices, so none are given here. The board you dial is pretend, and its posts last only for this visit. [E3-GEAR]`,
        `${NOTE} OOGA-DOS is invented, in the style of the period; it copies no real system's screens. [E3-ORIGINAL]`],
      sourceKeys: ["E3-CPU", "E3-GEAR", "E3-ORIGINAL"],
      pager: "PC: DIAL THE PRETEND BBS" },
    pager: { title: "Pocket pager", year: 1990, label: "POCKET PAGER · 1990–1995",
      dated: "1990–1995: period-style. No model, date or specification is claimed.",
      kid: "A pager was a pocket gadget that beeped and showed a short message. Yours buzzes when you walk near an exhibit in this cave. Read your messages here.",
      deeper: [
        `${NOTE} this pager is an original toy. Its messages come from this cave's exhibits, not from any network, and they last only for this visit. The dossier has not cleared pager models, dates or numbers, so none are given. [E3-GEAR, E3-ORIGINAL]`],
      sourceKeys: ["E3-GEAR", "E3-ORIGINAL"],
      pager: "PAGER: READ ME HERE" },
    rally: { title: "Tick-Tock Rally", year: 1990, label: "TICK-TOCK RALLY · 1990–1995",
      dated: "1990–1995: an arcade cabinet in a period style, with an original game made for the voyage.",
      kid: "Keep the ball in play with your paddle. Every return is one tick of the clock; hit the clock at the top for a stamp worth five. Three balls, then see your score.",
      deeper: [
        `${NOTE} Tick-Tock Rally is original to the voyage: no copied game, program, name, artwork or sound. Paddle-and-ball games are a genre; this one is ours. [E3-ORIGINAL]`,
        `${NOTE} the cabinet is context for the period's gear, with no model or date claimed. [E3-GEAR]`],
      sourceKeys: ["E3-ORIGINAL", "E3-GEAR"],
      pager: "ARCADE: RALLY IS ON" },
    // The existing desk, for the pager only: its words stay in genesis-voyage.js.
    desk: { title: "Fingerprints and Time", year: 1991, label: "FINGERPRINTS AND TIME · 1991", sourceKeys: ["E3-HS"], pager: "DESK: EACH STAMP HOLDS THE LAST" }
  };
  // The cave's community and companies stay on hold: named, never dated (dossier: HOLD).
  const HOLD = ["The Cypherpunks mailing list (a participant recalls September 1992): no readable primary copy yet.",
    "DigiCash (proposed about 1990): founding date unresolved.",
    "Surety (proposed 1995 timestamping in use): first dated newspaper notice not yet found."];

  // --- The newspaper: change a page and watch the later links fail ---------------------------------------------------
  // Tock's own pages, linked by the desk's own rule: stamp i = fingerprint(stamp i-1 + "|" + page i), starting from
  // "". `printed` is this morning's paper: the last stamp of the honest chain. `edit(n, text)` changes page n (1-based);
  // `check()` reports the first page whose stamp no longer matches the printed chain (-1 when all match), and whether
  // the printed fingerprint still matches.
  const link = (pages, out) => {
    let previous = "";
    for (let i = 0; i < pages.length; i++) { previous = G.fingerprint(previous + "|" + pages[i]); out[i] = previous; }
    return out;
  };
  const createNewspaper = () => {
    const original = G.PAGES.slice(), printedChain = link(original, []), printed = printedChain[printedChain.length - 1];
    const n = { pages: original.slice(), stamps: link(original, []), printed, printedChain, version: 0, edits: 0 };
    n.check = () => {
      link(n.pages, n.stamps);
      let first = -1;
      for (let i = 0; i < n.pages.length; i++) if (n.stamps[i] !== printedChain[i]) { first = i; break; }
      return { first, matches: n.stamps[n.stamps.length - 1] === printed };
    };
    n.edit = (page, text) => {
      const i = page - 1, t = GP.clean(text);
      if (!(i >= 0 && i < n.pages.length)) return { error: `Pick a page from 1 to ${n.pages.length}.` };
      if (!t) return { error: "Write the new words after the page number." };
      n.pages[i] = t; n.edits++; n.version++;
      return n.check();
    };
    // The desk's own demonstration change, so the visitor can see exactly what the desk shows.
    n.desk = () => { n.pages[G.TAMPER_AT] = G.TAMPERED; n.edits++; n.version++; return n.check(); };
    n.restore = (page) => {
      const i = page - 1;
      if (!(i >= 0 && i < n.pages.length)) return { error: `Pick a page from 1 to ${n.pages.length}.` };
      n.pages[i] = original[i]; n.version++;
      return n.check();
    };
    n.reset = () => { for (let i = 0; i < original.length; i++) n.pages[i] = original[i]; n.edits = 0; n.version++; return n.check(); };
    return n;
  };
  const newspaperTerminal = (paper) => {
    const ex = EXHIBITS.newspaper;
    const status = () => {
      const r = paper.check(), lines = [];
      for (let i = 0; i < paper.pages.length; i++) {
        const ok = r.first < 0 || i < r.first;
        lines.push(`Page ${i + 1}  ${paper.stamps[i]}  ${ok ? "matches" : i === r.first ? "CHANGED: fingerprint differs" : "link FAILS"}`);
        lines.push(`        "${paper.pages[i]}"`);
      }
      lines.push(`Printed in this morning's paper: ${paper.printed}  ${r.matches ? "matches page 5" : "NO LONGER MATCHES"}`);
      return lines;
    };
    const help = ["SHOW            the pages, their fingerprints and links", "EDIT 2 <words>  change page 2 (any page 1 to 5)", "DESK            make the same change Tock's desk shows",
      "UNDO 2          put page 2 back", "RESET           put every page back", "MORE            the deeper story", "SOURCES         where this comes from"];
    return {
      get banner() { return [ex.label, ex.dated, "", ex.kid, "", ...status(), "", "Type HELP for the commands. RESET puts everything back.", ""]; },
      prompt: "PRESS>",
      run: (line) => {
        const input = GP.clean(line), space = input.indexOf(" "), cmd = (space < 0 ? input : input.slice(0, space)).toUpperCase(), arg = space < 0 ? "" : input.slice(space + 1).trim();
        if (!cmd) return { lines: [] };
        if (cmd === "HELP") return { lines: help };
        if (cmd === "SHOW" || cmd === "CHECK") return { lines: status() };
        if (cmd === "MORE") return { lines: ex.deeper };
        if (cmd === "SOURCES") return { lines: sourceLines(ex.sourceKeys) };
        if (cmd === "RESET") { paper.reset(); return { lines: ["Every page is back as Tock wrote it.", ...status()], reset: true }; }
        if (cmd === "DESK") { paper.desk(); return { lines: [`Page ${G.TAMPER_AT + 1} now reads "${G.TAMPERED}", as at Tock's desk.`, ...status()] }; }
        if (cmd === "EDIT" || cmd === "UNDO") {
          const m = /^(\d+)\s*(.*)$/.exec(arg);
          if (!m) return { lines: [cmd === "EDIT" ? "Try EDIT 2 Ooga trades two bananas" : "Try UNDO 2"] };
          const r = cmd === "EDIT" ? paper.edit(+m[1], m[2]) : paper.restore(+m[1]);
          return { lines: r.error ? [r.error] : status() };
        }
        return { lines: ["Unknown command. Type HELP."] };
      }
    };
  };

  // --- The padlock post: toy public-key maths ------------------------------------------------------------------------
  // Textbook RSA with tiny primes, as a teaching model: anyone can break it. Bea's public key is (n, e), her private
  // key d. A note locks letter by letter (c = m^e mod n) and opens with d; a seal is the toy fingerprint's first four
  // hex digits, taken mod n, raised to d; anyone checks it with e.
  const TOY = { p: 61, q: 53, n: 3233, e: 17, d: 2753 };
  const MAX_NOTE = 40;
  const modPow = (b, x, n) => { let r = 1; b %= n; while (x > 0) { if (x & 1) r = (r * b) % n; b = (b * b) % n; x >>= 1; } return r; };
  const digest = (text) => parseInt(G.fingerprint(text).slice(0, 4), 16) % TOY.n;
  const createKeyStation = () => {
    const s = { locked: null, note: "", sealed: null, version: 0 };
    s.lock = (text) => {
      const t = GP.clean(text).replace(/[^\x20-\x7e]/g, "").slice(0, MAX_NOTE);
      if (!t) return { error: "Write a note after LOCK." };
      s.note = t; s.locked = []; s.version++;
      for (let i = 0; i < t.length; i++) s.locked.push(modPow(t.charCodeAt(i), TOY.e, TOY.n));
      return { locked: s.locked };
    };
    s.open = (d = TOY.d) => s.locked ? s.locked.map((c) => String.fromCharCode(modPow(c, d, TOY.n))).join("") : null;
    s.seal = (text) => {
      const t = GP.clean(text).slice(0, MAX_NOTE);
      if (!t) return { error: "Write a note after SIGN." };
      s.sealed = { text: t, seal: modPow(digest(t), TOY.d, TOY.n) }; s.version++;
      return s.sealed;
    };
    s.verify = () => s.sealed ? modPow(s.sealed.seal, TOY.e, TOY.n) === digest(s.sealed.text) : null;
    s.change = () => { if (!s.sealed) return false; s.sealed.text = s.sealed.text + "!"; s.version++; return true; };
    s.reset = () => { s.locked = null; s.note = ""; s.sealed = null; s.version++; };
    return s;
  };
  const keyTerminal = (st) => {
    const ex = EXHIBITS.keys;
    const help = ["KEYS           Bea's public key (and her private one, shown only in this toy)", "LOCK <note>    snap Bea's padlock shut on a note", "PEEK           what a snoop sees", "OPEN           Bea opens it with her private key",
      "SIGN <note>    Bea seals a note with her private key", "CHECK          anyone checks the seal with her public key", "CHANGE         someone changes the sealed note", "RESET          start again", "MORE · SOURCES"];
    const nums = (list) => { const out = []; for (let i = 0; i < list.length; i += 8) out.push(list.slice(i, i + 8).map((c) => String(c).padStart(4, "0")).join(" ")); return out; };
    return {
      get banner() { return [ex.label, ex.dated, "", ex.kid, "", "A teaching model with tiny numbers. Not real encryption.", "Type HELP for the commands. RESET starts again.", ""]; },
      prompt: "POST>",
      run: (line) => {
        const input = GP.clean(line), space = input.indexOf(" "), cmd = (space < 0 ? input : input.slice(0, space)).toUpperCase(), arg = space < 0 ? "" : input.slice(space + 1);
        if (!cmd) return { lines: [] };
        if (cmd === "HELP") return { lines: help };
        if (cmd === "MORE") return { lines: ex.deeper };
        if (cmd === "SOURCES") return { lines: sourceLines(ex.sourceKeys) };
        if (cmd === "KEYS") return { lines: [`Bea's public padlock: n = ${TOY.n}, e = ${TOY.e}  (anyone may have it)`, `Bea's private key:    d = ${TOY.d}  (only Bea; shown here because this is a toy)`, `${NOTE} with numbers this small, anyone can work d out from n.`] };
        if (cmd === "LOCK") { const r = st.lock(arg); return { lines: r.error ? [r.error] : ["Locked with Bea's public padlock:", ...nums(r.locked), "Only Bea's private key opens it. Try PEEK, then OPEN."] }; }
        if (cmd === "PEEK") return { lines: st.locked ? ["A snoop sees only numbers:", ...nums(st.locked)] : ["Nothing is locked yet. Try LOCK meet at the dock"] };
        if (cmd === "OPEN") return { lines: st.locked ? [`Bea opens it: "${st.open()}"`] : ["Nothing is locked yet."] };
        if (cmd === "SIGN") { const r = st.seal(arg); return { lines: r.error ? [r.error] : [`Bea seals "${r.text}" with her private key: seal ${r.seal}`, "Try CHECK, then CHANGE and CHECK again."] }; }
        if (cmd === "CHECK") { const v = st.verify(); return { lines: v === null ? ["Nothing is sealed yet. Try SIGN two bananas for a shell"] : [`"${st.sealed.text}" with seal ${st.sealed.seal}: ${v ? "the seal checks out with Bea's public key" : "the seal does NOT match: the note was changed"}`] }; }
        if (cmd === "CHANGE") return { lines: st.change() ? [`Someone changed the note to "${st.sealed.text}". Try CHECK.`] : ["Nothing is sealed yet."] };
        if (cmd === "RESET") { st.reset(); return { lines: ["The padlock post is back to the start."], reset: true }; }
        return { lines: ["Unknown command. Type HELP."] };
      }
    };
  };

  // --- The office PC: museum notes, a floppy and a pretend BBS ------------------------------------------------------
  // Extends genesis-props.js's OOGA-DOS (the same DIR, TYPE, HASH, CLS and files) rather than replacing it. Posts to
  // the pretend board last for the visit only and are capped (`MAX_POSTS`, oldest first out).
  const MAX_POSTS = 8;
  const NOTES = [
    { name: "NOTES", text: [`${NOTE} the ideas in this cave, in short.`, "1991  Haber and Stornetta: link each record's fingerprint to the last. [E3-HS]", "1992  Bayer, Haber and Stornetta: one tree, one stamp per round (book 1993). [E3-BHS]",
      "1992  Dwork and Naor: make bulk messages cost some computing (context). [E3-DN]", "1991  PGP published electronically, its author says (context). [E3-PGP]", "1993  Hughes's manifesto, dated 9 March (context). [E3-HUGHES]",
      "2008  The whitepaper cites [3] and [4] in its timestamp section. [E3-WP]"] }
  ];
  const floppyFiles = () => [
    { name: "README", ext: "1ST", text: [`${NOTE} a pretend 3.5-inch disk for the voyage. No capacity is claimed.`, "Try TYPE A:CHAIN.TXT or TYPE A:LETTER.TXT."] },
    { name: "LETTER", ext: "TXT", text: ["Dear Tock, I copied your pages onto this disk.", "If I change one, your chain will know. -- Bea (an invented Ooga)"] },
    { name: "CHAIN", ext: "TXT", text: ["Tock's pages and their linked fingerprints (the desk's toy hash):", ...G.chain(false).map((c, i) => `${i + 1}. ${c}  ${G.PAGES[i]}`)] },
    { name: "PADLOCK", ext: "TXT", text: [`Bea's toy public padlock: n = ${TOY.n}, e = ${TOY.e}. Use it at the padlock post.`] }
  ];
  const SEEDED = [{ from: "TOCK", text: "Stamped five pages today. Links all hold." }, { from: "BEA", text: "Padlocks free at the post. Bring a note." }, { from: "SYSOP", text: "Pretend board. Posts vanish when you leave." }];
  const createDesktop = () => {
    const dos = GP.createDos({ year: 1993, files: GP.PC_FILES }), floppy = floppyFiles();
    const d = { dos, floppy, posts: [], online: false, sent: 0, version: 0 };
    const sizeOf = (f) => f.text.reduce((n, line) => n + line.length + 2, 0);
    const pad = (s, n) => (s + " ".repeat(n)).slice(0, n);
    const findA = (arg) => { const w = arg.toUpperCase().replace(/^A:\\?/, ""); return floppy.find((f) => `${f.name}.${f.ext}` === w || f.name === w) || null; };
    d.post = (text) => {
      const t = GP.clean(text);
      if (!t) return { error: "Write your message after POST." };
      if (d.posts.length >= MAX_POSTS) d.posts.shift();
      d.posts.push({ from: "YOU", text: t }); d.sent++; d.version++;
      return { ok: true };
    };
    d.reset = () => { d.posts.length = 0; d.online = false; d.version++; };
    const board = () => ["--- THE OOGA BOARD (pretend) ---", ...SEEDED.concat(d.posts).map((p, i) => `${String(i + 1).padStart(2)}. ${pad(p.from, 6)} ${p.text}`), "POST <message> leaves one. HANGUP ends the call."];
    const ex = EXHIBITS.desktop;
    const extra = ["NOTES        museum notes about this cave", "DIR A:       the floppy disk in drive A:", "TYPE A:<file> show a file on the floppy", "DIAL         call the pretend bulletin board",
      "READ · POST <message> · HANGUP   on the board", "RESET        hang up and clear your posts", "MORE · SOURCES"];
    d.terminal = {
      get banner() { return [...dos.banner.slice(0, 1), ex.label, ex.kid, "", "Type HELP for the commands. RESET clears your posts.", ""]; },
      prompt: dos.prompt,
      run: (line) => {
        const input = GP.clean(line), space = input.indexOf(" "), cmd = (space < 0 ? input : input.slice(0, space)).toUpperCase(), arg = space < 0 ? "" : input.slice(space + 1).trim();
        if (cmd === "HELP") return { lines: [...dos.run("HELP").lines, ...extra] };
        if (cmd === "MORE") return { lines: [ex.dated, "", ...ex.deeper] };
        if (cmd === "SOURCES") return { lines: sourceLines(ex.sourceKeys) };
        if (cmd === "NOTES") return { lines: NOTES[0].text };
        if (cmd === "RESET") { d.reset(); return { lines: ["Hung up. Your posts are cleared."], reset: true }; }
        if ((cmd === "DIR" && /^A:/i.test(arg)) || cmd === "A:") {
          const total = floppy.reduce((n, f) => n + sizeOf(f), 0);
          return { lines: [" Volume in drive A is MUSEUM", " Directory of A:\\", "", ...floppy.map((f) => `${pad(f.name, 9)}${pad(f.ext, 4)}${String(sizeOf(f)).padStart(7)}`),
            `${String(floppy.length).padStart(9)} file(s) ${String(total).padStart(9)} bytes`, `${NOTE} no disk capacity is claimed.`] };
        }
        if (cmd === "TYPE" && /^A:/i.test(arg)) { const f = findA(arg); return f ? { lines: f.text, file: f } : { lines: ["File not found"], missing: arg }; }
        if (cmd === "DIAL") { d.online = true; return { lines: ["ATDT 555-0142 (a pretend number)", "CONNECT", "", ...board()] }; }
        if (cmd === "READ") return { lines: d.online ? board() : ["Not connected. Type DIAL first."] };
        if (cmd === "POST") {
          if (!d.online) return { lines: ["Not connected. Type DIAL first."] };
          const r = d.post(arg);
          return { lines: r.error ? [r.error] : ["Message saved on the pretend board (this visit only).", ...board()] };
        }
        if (cmd === "HANGUP") { const was = d.online; d.online = false; return { lines: [was ? "NO CARRIER" : "Not connected."] }; }
        return dos.run(line);
      }
    };
    return d;
  };

  // --- The pager ----------------------------------------------------------------------------------------------------
  // A ring of `capacity` messages (indices into a fixed list of texts) with the time each came. Allocation-free.
  const createPager = (texts, capacity = 6) => {
    const which = new Int16Array(capacity), when = new Float32Array(capacity);
    const p = { capacity, count: 0, head: 0, unread: 0, received: 0, version: 0 };
    p.receive = (i, t) => { which[p.head] = i; when[p.head] = t; p.head = (p.head + 1) % capacity; if (p.count < capacity) p.count++; p.unread++; p.received++; p.version++; return texts[i]; };
    // The k-th newest message (0 = newest): its text index and time, into `out`.
    p.at = (k, out) => { const j = (p.head - 1 - k + capacity * 2) % capacity; out.index = which[j]; out.time = when[j]; out.text = texts[which[j]]; return out; };
    p.read = () => { p.unread = 0; p.version++; };
    p.clear = () => { p.count = 0; p.head = 0; p.unread = 0; p.version++; };
    return p;
  };
  // Who pages: each trigger fires once as the visitor comes within `near` metres, and re-arms only after they move
  // `far` metres away. Frozen (reading, a terminal, paused) nothing fires. Allocation-free.
  const createTriggers = (spots, near = 4, far = 7) => {
    const armed = new Uint8Array(spots.length).fill(1);
    return {
      spots, armed,
      update: (x, z, frozen) => {
        let fired = -1;
        for (let i = 0; i < spots.length; i++) {
          const d = Math.hypot(x - spots[i].x, z - spots[i].z);
          if (armed[i] && d < near && !frozen && fired < 0) { armed[i] = 0; fired = i; }
          else if (!armed[i] && d > far) armed[i] = 1;
        }
        return fired;
      },
      reset: () => armed.fill(1)
    };
  };

  // --- Tick-Tock Rally: an original paddle-and-ball game ------------------------------------------------------------
  // A field 1 wide and 0.75 high; the paddle runs along the bottom, the clock target along the top. Fixed steps of
  // 1/120 s, at most four a frame, so the game plays the same at any frame rate. States: "serve" (the ball waits on
  // the paddle), "play", "over". Allocation-free.
  const RALLY = { w: 1, h: 0.75, paddleY: 0.69, paddleW: 0.16, paddleH: 0.016, paddleSpeed: 1.1, ball: 0.012, speed0: 0.5, speedUp: 0.02, speedMax: 1.05, clockY: 0.07, clockW: 0.1, clockH: 0.03, balls: 3, step: 1 / 120, maxSteps: 4 };
  const createRally = () => {
    const R = RALLY;
    const g = { state: "serve", x: 0.5, y: R.paddleY - R.ball, vx: 0, vy: 0, speed: R.speed0, paddle: 0.5, clock: 0.5, clockDir: 1, score: 0, best: 0, balls: R.balls, hits: 0, stamps: 0, misses: 0, serves: 0, acc: 0, time: 0, version: 0,
      input: { left: false, right: false, aim: -1 } };
    g.reset = () => {
      g.state = "serve"; g.score = 0; g.balls = R.balls; g.hits = 0; g.stamps = 0; g.misses = 0; g.serves = 0; g.speed = R.speed0; g.paddle = 0.5; g.clock = 0.5; g.clockDir = 1; g.acc = 0; g.time = 0;
      g.input.left = g.input.right = false; g.input.aim = -1; g.x = g.paddle; g.y = R.paddleY - R.ball; g.vx = g.vy = 0; g.version++;
    };
    g.serve = () => {
      if (g.state === "over") { g.reset(); return true; }
      if (g.state !== "serve") return false;
      // Serves alternate left and right, so a run is the same every time for the same moves.
      const a = (g.serves & 1 ? -1 : 1) * 0.45;
      g.serves++;
      g.vx = Math.sin(a) * g.speed; g.vy = -Math.cos(a) * g.speed; g.state = "play"; g.version++;
      return true;
    };
    const tick = (dt) => {
      g.time += dt;
      const i = g.input;
      let move = (i.right ? 1 : 0) - (i.left ? 1 : 0);
      if (i.aim >= 0 && !move) { const d = i.aim - g.paddle; move = Math.abs(d) < 0.004 ? 0 : d > 0 ? 1 : -1; if (Math.abs(d) < R.paddleSpeed * dt) { g.paddle = i.aim; move = 0; } }
      g.paddle = Math.max(R.paddleW / 2, Math.min(R.w - R.paddleW / 2, g.paddle + move * R.paddleSpeed * dt));
      g.clock += g.clockDir * 0.18 * dt;
      if (g.clock > R.w - R.clockW / 2) { g.clock = R.w - R.clockW / 2; g.clockDir = -1; } else if (g.clock < R.clockW / 2) { g.clock = R.clockW / 2; g.clockDir = 1; }
      if (g.state !== "play") { g.x = g.paddle; g.y = R.paddleY - R.ball; return; }
      g.x += g.vx * dt; g.y += g.vy * dt;
      if (g.x < R.ball) { g.x = R.ball; g.vx = Math.abs(g.vx); }
      else if (g.x > R.w - R.ball) { g.x = R.w - R.ball; g.vx = -Math.abs(g.vx); }
      if (g.y < R.ball) { g.y = R.ball; g.vy = Math.abs(g.vy); }
      // The clock: a hit is a stamp, worth five.
      if (g.vy < 0 && g.y - R.ball < R.clockY + R.clockH / 2 && g.y + R.ball > R.clockY - R.clockH / 2 && Math.abs(g.x - g.clock) < R.clockW / 2 + R.ball) {
        g.vy = Math.abs(g.vy); g.score += 5; g.stamps++; g.version++;
      }
      // The paddle: where the ball lands on it sets the angle back up.
      if (g.vy > 0 && g.y + R.ball >= R.paddleY - R.paddleH / 2 && g.y < R.paddleY + R.paddleH && Math.abs(g.x - g.paddle) <= R.paddleW / 2 + R.ball) {
        const off = Math.max(-1, Math.min(1, (g.x - g.paddle) / (R.paddleW / 2))), a = off * 1.0;
        g.speed = Math.min(R.speedMax, g.speed + R.speedUp);
        g.vx = Math.sin(a) * g.speed; g.vy = -Math.cos(a) * g.speed; g.y = R.paddleY - R.paddleH / 2 - R.ball;
        g.score++; g.hits++; g.version++;
      } else if (g.y - R.ball > R.h) {
        g.balls--; g.misses++; g.speed = R.speed0; g.vx = g.vy = 0; g.version++;
        if (g.balls > 0) g.state = "serve";
        else { g.state = "over"; if (g.score > g.best) g.best = g.score; }
      }
    };
    // Frame time in, fixed steps out; time past four steps is dropped, as the island's games do.
    g.update = (dt) => {
      g.acc = Math.min(g.acc + dt, R.step * R.maxSteps);
      let n = 0;
      while (g.acc >= R.step - 1e-9 && n < R.maxSteps) { tick(R.step); g.acc -= R.step; n++; }
      return n;
    };
    return g;
  };

  // --- Where everything stands -------------------------------------------------------------------------------------
  // On Era 3's left bank, around Fingerprints and Time (which stands from x -8.4 to -1.4, z -316.5 to -301.5 in the
  // cave's middle). The big sign and the overview by the way in; the newspaper, the padlock post and the pager stand
  // in a row west of the room, leaving a walkway of 3 m between them and the room; the arcade cabinet behind them. The
  // stream's lip (the 2 m along the water) and every boarding ramp stay clear. `face` is the sign's turn about y.
  const TOP = GW.BANK_TOP, ROW = -13.5;
  const LAYOUT = {
    sign: { x: -9.5, y: TOP, z: E.z1 - 6, face: 0, w: 10.6, d: 0.8 },
    overview: { x: -3.6, y: TOP, z: E.z1 - 10, face: Math.PI / 2, w: 0.7, d: 0.5 },
    newspaper: { x: ROW, y: TOP, z: E.z - 1, face: Math.PI / 2, w: 2.6, d: 1.2 },
    keys: { x: ROW, y: TOP, z: E.z + 10, face: Math.PI / 2, w: 1.3, d: 1.1 },
    pager: { x: ROW, y: TOP, z: E.z + 18, face: Math.PI / 2, w: 0.7, d: 0.7 },
    rally: { x: ROW - 7, y: TOP, z: E.z + 4, face: Math.PI / 2, w: 1.1, d: 1.5 }
  };
  // What a walker may not walk into: each exhibit's footprint (`w` across its face, `d` its depth).
  const OBSTACLES = Object.keys(LAYOUT).map((k) => { const a = LAYOUT[k], hx = (a.face ? a.d : a.w) / 2, hz = (a.face ? a.w : a.d) / 2; return { id: `era3-${k}`, x0: a.x - hx, x1: a.x + hx, z0: a.z - hz, z1: a.z + hz }; });
  // Where the cave's scattered boulders should not land: the exhibits and the room. The scene skips a boulder there
  // (keeping its random draws, so every other cave is unchanged).
  const CLEAR = [{ x0: -26, x1: -1, z0: E.z - 9, z1: E.z1 - 2 }];
  // Two lamps: the sign, and the row of exhibits.
  const LIGHTS = [[-7, 5, E.z1 - 7, 12, 1.3, 1.05, 0.75], [ROW + 1, 4.5, E.z + 8, 16, 1.2, 1.0, 0.8]];
  // The pager's spots: every exhibit here, and the desk (from genesis-voyage's room, shifted as scene-genesis.js does).
  const DESK_AT = { x: -7.2 + GW.ROOM_SHIFT.x, z: -25.2 + GW.ROOM_SHIFT.z };
  const PAGE_SPOTS = [{ id: "overview", ...LAYOUT.overview }, { id: "desk", ...DESK_AT }, { id: "newspaper", ...LAYOUT.newspaper }, { id: "keys", ...LAYOUT.keys }, { id: "pager", ...LAYOUT.pager }, { id: "rally", ...LAYOUT.rally }];
  const PAGER_TEXTS = PAGE_SPOTS.map((s) => EXHIBITS[s.id].pager);

  // --- The scene half -----------------------------------------------------------------------------------------------
  // `host`: { root, hud, props (the scene's registry), audio (optional: { link }), signal }. Builds the models,
  // registers the props and returns { targets: [{ node, prop }], update(dt, x, z, frozen), dispose, debug }.
  // Opening a prop returns `{ terminal }` (the scene's prompt dialog) or `{ panel }` (a ready board for `openPanel`).
  const W = 960, H = 540;
  const mount = (host) => {
    const S = BL.scene, M = BL.models, label = BL.factoryModels.label, hud = host.hud;
    const own = [], dynamic = {};
    const place = (node) => { S.addChild(host.root, node); own.push(node); return node; };
    const node = (geometry, x, y, z, extra) => place(S.createNode({ geometry, position: { x, y, z }, ...extra }));
    // One merged geometry for an exhibit's still parts, built in its own frame and turned to face the stream.
    const still = (at, parts) => {
      const geo = M.merge(...parts.map(([w, h, d, color, x, y, z, emissive = 0]) => M.moved(M.box({ w, h, d, color, emissive }), x, y, z)));
      return place(S.createNode({ geometry: geo, position: { x: at.x, y: at.y, z: at.z }, rotation: { x: 0, y: at.face, z: 0 } }));
    };
    const sign = (text, sub, at, y, height = 0.45, style = "plain", dz = 0) => {
      const s = label(text, sub, { height, style });
      const n = place(S.createNode({ position: { x: at.x + Math.sin(at.face) * dz, y: at.y + y, z: at.z + Math.cos(at.face) * dz }, rotation: { x: 0, y: at.face, z: 0 } }));
      S.addChild(n, S.createNode({ geometry: s.back }), S.createNode({ geometry: s.face }));
      return n;
    };
    // A still part placed in an exhibit's own frame: x across its face, z out toward the stream.
    const local = (at, x, y, z) => ({ x: at.x + Math.cos(at.face) * x + Math.sin(at.face) * z, y: at.y + y, z: at.z - Math.sin(at.face) * x + Math.cos(at.face) * z });
    const pick = (at, w, h, d, y) => { const p = local(at, 0, y, 0); return node(M.box({ w, h, d, color: "#000000" }), p.x, p.y, p.z, { visible: false, rotation: { x: 0, y: at.face, z: 0 } }); };

    // The big sign by the way in, at bank level, and the overview lectern.
    const L = LAYOUT;
    still(L.sign, [[0.3, 4.3, 0.3, "#3b2a1a", -5.15, 2.15, 0], [0.3, 4.3, 0.3, "#3b2a1a", 5.15, 2.15, 0], [10.6, 0.25, 0.7, "#2a2622", 0, 0.12, 0]]);
    sign("1990–1995", "Cypherpunks and Timestamps", L.sign, 3.15, 2.2, "gold", 0.2);
    still(L.overview, [[0.7, 1.1, 0.5, "#7a5534", 0, 0.55, 0], [0.55, 0.05, 0.4, "#ffe9a8", 0, 1.13, 0.02, 1.2]]);
    sign(EXHIBITS.overview.label, "read the overview", L.overview, 1.7, 0.4);
    // The newspaper: a press stand with Tock's five pages linked on its board and this morning's paper beside them.
    still(L.newspaper, [[2.6, 0.9, 1.2, "#5a4a3a", 0, 0.45, 0], [2.6, 2.2, 0.12, "#2f2a25", 0, 1.9, -0.5], [1.2, 0.04, 0.8, "#e9e1cc", -0.6, 0.92, 0.05], [1.2, 0.02, 0.8, "#cfc6aa", 0.65, 0.92, 0.05]]);
    sign(EXHIBITS.newspaper.label, "change a page · EDIT, UNDO, RESET", L.newspaper, 3.4, 0.45);
    const paper = createNewspaper(), honest = paper.printedChain;
    dynamic.tiles = []; dynamic.links = [];
    for (let i = 0; i < G.PAGES.length; i++) {
      const p = local(L.newspaper, -1.05 + i * 0.5, 2.3, -0.42), q = local(L.newspaper, -0.8 + i * 0.5, 2.3, -0.42);
      const ok = node(M.box({ w: 0.36, h: 0.36, d: 0.04, color: "#" + honest[i].slice(0, 6), emissive: 0.8 }), p.x, p.y, p.z, { rotation: { x: 0, y: L.newspaper.face, z: 0 } });
      const bad = node(M.box({ w: 0.36, h: 0.36, d: 0.05, color: "#ff3b30", emissive: 1.1 }), p.x, p.y, p.z, { rotation: { x: 0, y: L.newspaper.face, z: 0 }, visible: false });
      dynamic.tiles.push({ ok, bad });
      if (i === G.PAGES.length - 1) continue;
      const lok = node(M.box({ w: 0.14, h: 0.06, d: 0.03, color: "#e8c35a", emissive: 0.7 }), q.x, q.y, q.z, { rotation: { x: 0, y: L.newspaper.face, z: 0 } });
      const lbad = node(M.box({ w: 0.08, h: 0.06, d: 0.04, color: "#ff3b30", emissive: 1.2 }), q.x, q.y - 0.12, q.z, { rotation: { x: 0, y: L.newspaper.face, z: 0 }, visible: false });
      dynamic.links.push({ ok: lok, bad: lbad });
    }
    const pp = local(L.newspaper, 0.65, 1.2, -0.42);
    dynamic.printedOk = node(M.box({ w: 0.6, h: 0.5, d: 0.04, color: "#7dffa0", emissive: 0.9 }), pp.x, pp.y, pp.z, { rotation: { x: 0, y: L.newspaper.face, z: 0 } });
    dynamic.printedBad = node(M.box({ w: 0.6, h: 0.5, d: 0.05, color: "#ff3b30", emissive: 1.1 }), pp.x, pp.y, pp.z, { rotation: { x: 0, y: L.newspaper.face, z: 0 }, visible: false });
    // The padlock post: a post box with Bea's padlock, its shackle up when open and down when a note is locked.
    still(L.keys, [[1.2, 1.3, 0.8, "#2f5d8a", 0, 0.65, 0], [1.3, 0.12, 0.9, "#24486b", 0, 1.36, 0], [0.5, 0.06, 0.03, "#111111", 0, 1.05, 0.41], [0.36, 0.3, 0.12, "#c9a64a", 0, 0.62, 0.46]]);
    sign(EXHIBITS.keys.label, "lock · sign · check (a toy)", L.keys, 2.1, 0.45);
    const su = local(L.keys, 0, 0.86, 0.46), sd = local(L.keys, 0, 0.8, 0.46);
    dynamic.shackleOpen = node(M.box({ w: 0.24, h: 0.22, d: 0.05, color: "#d6dbe0" }), su.x, su.y, su.z, { rotation: { x: 0, y: L.keys.face, z: 0 } });
    dynamic.shackleShut = node(M.box({ w: 0.24, h: 0.14, d: 0.05, color: "#d6dbe0" }), sd.x, sd.y, sd.z, { rotation: { x: 0, y: L.keys.face, z: 0 }, visible: false });
    // The pager stand: a plinth with the pager on it, its screen lit while messages wait.
    still(L.pager, [[0.7, 1, 0.7, "#5a524a", 0, 0.5, 0], [0.3, 0.08, 0.18, "#1c1c1c", 0, 1.04, 0.05]]);
    sign(EXHIBITS.pager.label, "your messages", L.pager, 1.75, 0.4);
    const pl = local(L.pager, 0, 1.085, 0.05);
    dynamic.pagerScreen = node(M.box({ w: 0.2, h: 0.01, d: 0.09, color: "#9dff7a", emissive: 1 }), pl.x, pl.y, pl.z, { rotation: { x: 0, y: L.pager.face, z: 0 } });
    // The arcade cabinet: an invented shape and colours, a lit marquee and a screen.
    still(L.rally, [[1.1, 1.9, 1.0, "#3a2a5c", 0, 0.95, 0], [1.1, 0.35, 0.5, "#2a1f44", 0, 1.05, 0.5], [0.9, 0.3, 0.08, "#ffcf7a", 0, 2.05, 0.44, 1.2], [0.12, 0.12, 0.12, "#ff5a4a", -0.25, 1.26, 0.6, 0.8], [0.12, 0.12, 0.12, "#5aff9a", 0.25, 1.26, 0.6, 0.8]]);
    sign(EXHIBITS.rally.label, "an original game", L.rally, 2.65, 0.4);
    const sc = local(L.rally, 0, 1.6, 0.515);
    dynamic.rallyScreen = node(M.box({ w: 0.8, h: 0.6, d: 0.03, color: "#2ad1ff", emissive: 1 }), sc.x, sc.y, sc.z, { rotation: { x: 0, y: L.rally.face, z: 0 } });

    // The office PC (genesis-props.js's): a modem and a floppy on its table, a second sign, and its prompt extended.
    const desktop = createDesktop();
    const pc = host.props.get("pc");
    if (pc) {
      const a = pc.at;
      node(M.box({ w: 0.3, h: 0.07, d: 0.2, color: "#cfc6aa" }), a.x - 0.25, a.y + 0.8, a.z + 0.45);
      node(M.box({ w: 0.06, h: 0.012, d: 0.02, color: "#ff5a4a", emissive: 1 }), a.x - 0.15, a.y + 0.84, a.z + 0.45);
      node(M.box({ w: 0.09, h: 0.004, d: 0.09, color: "#1d3c8a" }), a.x + 0.25, a.y + 0.765, a.z + 0.45);
      sign("NOTES · DIR A: · DIAL", "museum notes · floppy · pretend BBS", { x: a.x + 0.35, y: a.y, z: a.z, face: Math.PI / 2 }, 2.25, 0.36);
      pc.onUse = () => ({ terminal: desktop.terminal });
      pc.sourceKeys = pc.sourceKeys.concat(EXHIBITS.desktop.sourceKeys);
    }

    // The panels: pages painted on one canvas as the scene's are, plus a reset; keys and pointer for the game.
    let active = null;
    const wrap = (g, text, width) => {
      const words = text.split(" "), lines = [];
      let line = "";
      for (const w of words) { const next = line ? line + " " + w : w; if (g.measureText(next).width > width && line) { lines.push(line); line = w; } else line = next; }
      if (line) lines.push(line);
      return lines;
    };
    const paint = (canvas, title, paras) => {
      const g = canvas.getContext("2d");
      g.fillStyle = "#16130f"; g.fillRect(0, 0, W, H);
      g.strokeStyle = "rgba(236,226,206,0.35)"; g.lineWidth = 3; g.strokeRect(10, 10, W - 20, H - 20);
      g.fillStyle = "#fbe3a4"; g.font = "bold 38px system-ui, sans-serif"; g.textBaseline = "top";
      g.fillText(title, 44, 34);
      g.fillStyle = "#efe8da"; g.font = "23px system-ui, sans-serif";
      let y = 96;
      for (const para of paras) { for (const line of wrap(g, para, W - 88)) { if (y < H - 40) g.fillText(line, 44, y); y += 30; } y += 12; }
    };
    // pages: [{ caption, title, text: [..] | () => [..], reset? }]. A page with `reset` runs it when shown.
    const panel = (ex, pages, extra = {}) => {
      const canvas = document.createElement("canvas");
      canvas.width = W; canvas.height = H;
      const b = {
        title: ex.title, help: "Arrows page · R resets · Escape closes", canvas, count: pages.length, index: 0, caption: "", note: "", version: 0, wide: true,
        links: ex.sourceKeys.map((k) => ({ href: sourceOf(k).href, label: `${sourceOf(k).label} ↗` })),
        go(i) {
          active = b; b.index = i;
          const page = pages[i];
          if (page.reset) page.reset();
          const text = typeof page.text === "function" ? page.text() : page.text;
          b.caption = page.caption; b.note = text.join(" ");
          if (page.draw) page.draw(canvas); else paint(canvas, page.title, text);
          b.version++;
        },
        reset() { b.go(0); },
        ...extra
      };
      return b;
    };
    const basics = (ex) => [{ caption: "In short", title: ex.label, text: [ex.dated, ex.kid] }, { caption: "The deeper story", title: "The deeper story", text: ex.deeper },
      { caption: "Sources", title: "Where this comes from", text: () => sourceLines(ex.sourceKeys) }];
    const WP_PAGE = { caption: "In the whitepaper", title: "The timestamp references", text: [
      "The Bitcoin whitepaper (31 October 2008), section 3, Timestamp Server: hash a block of items and widely publish the hash, \"such as in a newspaper or Usenet post [2-5]\". [E3-WP]",
      "[3] Haber and Stornetta, How to time-stamp a digital document, Journal of Cryptology, 1991: in this cave. [E3-HS]",
      "[4] Bayer, Haber and Stornetta, Improving the efficiency and reliability of digital time-stamping, Sequences II, 1993: in this cave. [E3-BHS-PUB]",
      "[2] Massias, Serret-Avila and Quisquater (1999) and [5] Haber and Stornetta, Secure names for bit-strings (1997), are later: Era 4.",
      `${NOTE} the whitepaper's own answer to who keeps the clock is proof-of-work on a peer-to-peer network, which these papers did not propose.`] };
    const HOLD_PAGE = { caption: "On hold", title: "Named, not yet dated", text: [`${NOTE} the research for this cave has not cleared these for date plaques, so the museum names them without dates or claims of influence. [E3-HOLD]`, ...HOLD] };
    const overview = panel(EXHIBITS.overview, [...basics(EXHIBITS.overview).slice(0, 2), WP_PAGE, HOLD_PAGE, basics(EXHIBITS.overview)[2]]);
    // The pager's panel: its messages first (reading them clears the count), then a page that clears it.
    const pager = createPager(PAGER_TEXTS), triggers = createTriggers(PAGE_SPOTS), slot = { index: 0, time: 0, text: "" };
    const pagerList = () => {
      pager.read();
      if (!pager.count) return ["No messages yet. Walk near the exhibits in this cave and your pager will buzz."];
      const out = [];
      for (let k = 0; k < pager.count; k++) { pager.at(k, slot); out.push(`${Math.floor(slot.time / 60)}:${String(Math.floor(slot.time % 60)).padStart(2, "0")}  ${slot.text}`); }
      return out;
    };
    const resetPager = () => { pager.clear(); triggers.reset(); };
    const pagerPanel = panel(EXHIBITS.pager, [{ caption: "Messages", title: "Your pager", text: pagerList }, ...basics(EXHIBITS.pager),
      { caption: "Reset", title: "Pager cleared", reset: resetPager, text: ["Every message is cleared, and every exhibit will page you again when you walk near it."] }],
    { reset() { resetPager(); pagerPanel.go(0); } });
    // The arcade: the play page draws the game each frame while it is open; R resets, the last page too.
    const rally = createRally();
    let lastElapsed = -1, shownVersion = -1, scoreText = "", bestText = "", ballsText = "";
    const R = RALLY, FX = 120, FY = 70, FW = 720, FH = 540 - 110;
    const drawRally = (canvas) => {
      const g = canvas.getContext("2d");
      g.fillStyle = "#0b0a12"; g.fillRect(0, 0, W, H);
      g.strokeStyle = "#5a4a8a"; g.lineWidth = 4; g.strokeRect(FX - 4, FY - 4, FW + 8, FH + 8);
      g.fillStyle = "#ffcf7a"; g.font = "bold 30px system-ui, sans-serif"; g.textBaseline = "top";
      g.fillText("TICK-TOCK RALLY", FX, 20);
      g.font = "22px system-ui, sans-serif"; g.fillStyle = "#e9e1ff";
      g.fillText(scoreText, FX + FW - 360, 26); g.fillText(bestText, FX + FW - 220, 26); g.fillText(ballsText, FX + FW - 90, 26);
      const sx = FW / R.w, sy = FH / R.h;
      g.fillStyle = "#ffd25f"; g.fillRect(FX + (rally.clock - R.clockW / 2) * sx, FY + (R.clockY - R.clockH / 2) * sy, R.clockW * sx, R.clockH * sy);
      g.fillStyle = "#2ad1ff"; g.fillRect(FX + (rally.paddle - R.paddleW / 2) * sx, FY + (R.paddleY - R.paddleH / 2) * sy, R.paddleW * sx, R.paddleH * sy);
      g.fillStyle = "#ffffff"; g.fillRect(FX + (rally.x - R.ball) * sx, FY + (rally.y - R.ball) * sy, R.ball * 2 * sx, R.ball * 2 * sy);
      if (rally.state !== "play") {
        g.fillStyle = "#efe8da"; g.font = "24px system-ui, sans-serif";
        g.fillText(rally.state === "over" ? "Game over. Space or tap plays again." : "Space or tap serves · ← → or A D move · R resets", FX + 20, FY + FH / 2);
      }
    };
    const rallyTexts = () => { scoreText = `SCORE ${rally.score}`; bestText = `BEST ${rally.best}`; ballsText = `BALLS ${rally.balls}`; };
    rallyTexts();
    const rallyPanel = panel(EXHIBITS.rally, [{ caption: "Play", title: "", text: [EXHIBITS.rally.kid], draw: drawRally }, ...basics(EXHIBITS.rally),
      { caption: "Reset", title: "Game reset", reset: () => rally.reset(), text: ["The score and balls are back to the start. Page back to Play."] }], {
      help: "Space or tap serves · ← → or A D move · R resets · Tab to the page buttons · Escape closes",
      reset() { rally.reset(); rallyTexts(); rallyPanel.go(0); },
      // Called by the HUD each frame while open: steps the game on its Play page and repaints it.
      update(elapsed) {
        const dt = lastElapsed < 0 || elapsed === undefined ? 0 : Math.max(0, Math.min(0.1, elapsed - lastElapsed));
        if (elapsed !== undefined) lastElapsed = elapsed;
        if (rallyPanel.index !== 0) return;
        rally.update(dt);
        if (rally.version !== shownVersion) { shownVersion = rally.version; rallyTexts(); }
        drawRally(rallyPanel.canvas); rallyPanel.version++;
      }
    });
    const ours = () => active && hud.el.board.open;
    const GAME_KEYS = { ArrowLeft: "left", ArrowRight: "right", a: "left", d: "right", A: "left", D: "right" };
    const controller = new AbortController(), opts = { signal: controller.signal, capture: true };
    const releaseKeys = () => { rally.input.left = rally.input.right = false; rally.input.aim = -1; };
    // While one of these panels is open its keys stay in the panel: R resets, the game takes its own, and every other
    // key but Escape, Tab, the page arrows and M (sound) stops here, so nothing reaches the walk, the boat or the scene.
    const PASS = { Escape: 1, Tab: 1, ArrowLeft: 1, ArrowRight: 1, m: 1, M: 1 };
    hud.el.board.addEventListener("keydown", (e) => {
      if (!ours() || e.metaKey || e.ctrlKey || e.altKey) return;
      const playing = active === rallyPanel && rallyPanel.index === 0;
      if (e.key === "r" || e.key === "R") { if (!e.repeat) active.reset(); }
      else if (playing && GAME_KEYS[e.key]) rally.input[GAME_KEYS[e.key]] = true;
      else if (playing && (e.key === " " || e.key === "Enter")) { if (!e.repeat && rally.serve()) rallyTexts(); }
      else if (PASS[e.key] || e.key === "Enter" || e.key === " ") return;
      e.preventDefault(); e.stopImmediatePropagation();
    }, opts);
    hud.el.board.addEventListener("keyup", (e) => {
      if (!ours() || active !== rallyPanel || !GAME_KEYS[e.key]) return;
      rally.input[GAME_KEYS[e.key]] = false;
      e.preventDefault(); e.stopImmediatePropagation();
    }, opts);
    // A finger or the mouse on the screen steers the paddle; a tap serves.
    const aim = (e) => {
      if (!ours() || active !== rallyPanel || rallyPanel.index !== 0) return false;
      const r = hud.el.boardScreen.getBoundingClientRect(), fx = ((e.clientX - r.left) / r.width * W - FX) / FW;
      rally.input.aim = Math.max(0, Math.min(1, fx));
      return true;
    };
    hud.el.boardScreen.addEventListener("pointerdown", (e) => { if (aim(e)) { if (rally.serve()) rallyTexts(); e.preventDefault(); } }, opts);
    hud.el.boardScreen.addEventListener("pointermove", (e) => { if (e.buttons || e.pointerType === "mouse") aim(e); }, opts);
    hud.el.boardScreen.addEventListener("pointerleave", () => { if (active === rallyPanel) rally.input.aim = -1; }, opts);

    // The props, in the scene's registry: each opens its prompt or its panel.
    const keys = createKeyStation(), news = newspaperTerminal(paper), padlock = keyTerminal(keys);
    const reg = (id, ex, at, open, reach = 1.8) => host.props.register({ id: `era3-${id}`, era: ERA, year: ex.year, title: ex.title, label: ex.label, sourceKeys: ex.sourceKeys, at: { x: at.x, y: at.y, z: at.z }, reach, onUse: open });
    const props = {
      overview: reg("overview", EXHIBITS.overview, L.overview, () => ({ panel: overview }), 1.6),
      newspaper: reg("newspaper", EXHIBITS.newspaper, L.newspaper, () => ({ terminal: news }), 2.2),
      keys: reg("keys", EXHIBITS.keys, L.keys, () => ({ terminal: padlock }), 1.9),
      pager: reg("pager", EXHIBITS.pager, L.pager, () => ({ panel: pagerPanel }), 1.5),
      rally: reg("rally", EXHIBITS.rally, L.rally, () => { releaseKeys(); lastElapsed = -1; if (rally.state === "play") { rally.state = "serve"; rally.vx = rally.vy = 0; } return { panel: rallyPanel }; }, 1.8)
    };
    const targets = [
      { node: pick(L.overview, 0.9, 1.4, 0.8, 0.7), prop: props.overview },
      { node: pick(L.newspaper, 2.8, 3.2, 1.4, 1.6), prop: props.newspaper },
      { node: pick(L.keys, 1.4, 1.6, 1, 0.8), prop: props.keys },
      { node: pick(L.pager, 0.9, 1.3, 0.9, 0.65), prop: props.pager },
      { node: pick(L.rally, 1.2, 2.3, 1.2, 1.15), prop: props.rally }];

    // Per frame, allocation-free: the pager, and the models following their exhibits' state.
    let paperShown = -1, keysShown = -1, time = 0;
    const update = (dt, x, z, frozen) => {
      time += frozen ? 0 : dt;
      if (active && !hud.el.board.open) { if (active === rallyPanel) releaseKeys(); active = null; }
      const fired = triggers.update(x, z, frozen);
      if (fired >= 0) {
        pager.receive(fired, time);
        hud.toast(`Pager · ${PAGER_TEXTS[fired]}`);
        if (host.audio && host.audio.link) host.audio.link();
      }
      if (paper.version !== paperShown) {
        paperShown = paper.version;
        const r = paper.check();
        for (let i = 0; i < dynamic.tiles.length; i++) {
          const bad = r.first >= 0 && i >= r.first;
          dynamic.tiles[i].ok.visible = !bad; dynamic.tiles[i].bad.visible = bad;
          if (i < dynamic.links.length) { const fail = r.first >= 0 && i >= r.first; dynamic.links[i].ok.visible = !fail; dynamic.links[i].bad.visible = fail; }
        }
        dynamic.printedOk.visible = r.matches; dynamic.printedBad.visible = !r.matches;
      }
      if (keys.version !== keysShown) { keysShown = keys.version; dynamic.shackleShut.visible = !!keys.locked; dynamic.shackleOpen.visible = !keys.locked; }
      dynamic.pagerScreen.glow = pager.unread ? 1 + (Math.floor(time * 3) & 1) * 0.6 : 0.4;
      dynamic.rallyScreen.glow = 0.9 + Math.sin(time * 2.1) * 0.15;
    };
    const dispose = () => {
      controller.abort();
      active = null;
      for (const n of own) if (n.parent) S.removeChild(n.parent, n);
      own.length = 0;
      for (const k of Object.keys(dynamic)) dynamic[k] = null;
      targets.length = 0;
    };
    return { targets, update, dispose, debug: { paper, keys, desktop, pager, triggers, rally, panels: { overview, pager: pagerPanel, rally: rallyPanel }, props, get active() { return active; } } };
  };

  BL.genesisEra3 = { ERA, NOTE, SOURCES, EXHIBITS, HOLD, TOY, RALLY, MAX_POSTS, MAX_NOTE, LAYOUT, OBSTACLES, CLEAR, LIGHTS, PAGE_SPOTS, PAGER_TEXTS, sourceOf, link, createNewspaper, newspaperTerminal, createKeyStation, keyTerminal, createDesktop, createPager, createTriggers, createRally, mount };
})();
