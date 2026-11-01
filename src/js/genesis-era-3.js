// Era 3's cave in the Genesis Voyage, Cypherpunks and Timestamps (1990–1995), built through the shared exhibit kit
// (genesis-exhibits.js; the rules are docs/genesis-voyage/EXHIBIT-CONTRACT.md). Words come from the Era 3 dossier
// (docs/genesis-voyage/eras/era-3-cypherpunks-and-timestamps.md on gv/research): only READY entries are stated as facts;
// the HOLD entries (the Cypherpunks list's date, DigiCash, Surety) are named as on hold, never dated. The shared
// signage gives the cave its years sign, pylons and overview board, and Fingerprints and Time keeps its desk, its
// lectern and its two trail stops ([3] and [4]); nothing here duplicates them or adds a second stamp system. The
// press re-links Tock's own pages with the desk's own fingerprint and rule, so a changed page breaks exactly the links
// the desk shows breaking.
//
// The exhibits, west of the room on the left bank, each a terminal (typing stays in the prompt, so no key reaches
// the walk): the Daily Ooga press (change a page, watch the later links fail), the padlock post (toy public-key maths,
// a teaching model), the dial-up corner (museum notes, a floppy, a pretend BBS), the pocket pager (messages from the
// exhibits you walk near) and Tick-Tock Rally (an original paddle-and-ball cabinet, played a tick at a time at its
// prompt, its own screen running a demo). The pure rules come first so Node can check them; `build(kit)` places the
// models and props, `update` runs the screens and the pager without allocating, and `dispose` drops the visit.
//
// Commentary written today starts "Museum note (written today):". The BBS, pager, floppy and cabinet are period-style
// context with no model, date or specification claimed (the dossier clears none). Nothing typed leaves the page.
(() => {
  "use strict";
  const BL = window.BL;
  const G = BL.genesisVoyage, GP = BL.genesisProps, GW = BL.genesisWorld;
  const ERA = 3;
  const NOTE = "Museum note (written today):";

  // --- Sources ------------------------------------------------------------------------------------------------------
  // The dossier's keys. `verified` means the dossier's researchers read the page itself; this module's builder did
  // not re-read them. The whitepaper is the voyage's own `whitepaper` key.
  const DOSSIER = "https://github.com/Bitcoin-Bill/oogaboogaland/blob/gv/research/docs/genesis-voyage/eras/era-3-cypherpunks-and-timestamps.md";
  const sources = {
    "E3-HS": { label: "Haber and Stornetta, How to Time-Stamp a Digital Document, Journal of Cryptology 3(2), pp. 99–111, 1991 (received 19 Aug 1990, revised 26 Oct 1990)",
      href: "https://gwern.net/doc/bitcoin/1991-haber.pdf", kind: "whitepaper citation", verified: true },
    "E3-BHS": { label: "Bayer, Haber and Stornetta, Improving the Efficiency and Reliability of Digital Time-Stamping (manuscript dated March 1992)",
      href: "https://www.math.columbia.edu/~bayer/papers/Timestamp_BHS93.pdf", kind: "whitepaper citation", verified: true },
    "E3-BHS-PUB": { label: "The same chapter in Sequences II (Springer, 1993), publisher record",
      href: "https://doi.org/10.1007/978-1-4613-9323-8_24", kind: "whitepaper citation", verified: true },
    "E3-DN": { label: "Dwork and Naor, Pricing via Processing or Combatting Junk Mail (CRYPTO '92, author PDF)",
      href: "https://www.wisdom.weizmann.ac.il/~naor/PAPERS/pvp.pdf", kind: "context", verified: true },
    "E3-PGP": { label: "Philip Zimmermann, Why I Wrote PGP (essay dated June 1991, updated 1999)",
      href: "https://www.philzimmermann.com/EN/essays/WhyIWrotePGP.html", kind: "context", verified: true },
    "E3-HUGHES": { label: "Eric Hughes, A Cypherpunk's Manifesto (9 March 1993), Satoshi Nakamoto Institute reprint",
      href: "https://nakamotoinstitute.org/library/cypherpunk-manifesto/", kind: "context", verified: true },
    "E3-GEAR": { label: "Era 3 dossier, period gear: BBS, pager, 3.5-inch floppy and consoles are context with no specification cleared",
      href: DOSSIER, kind: "context", verified: true },
    "E3-HOLD": { label: "Era 3 dossier, Community and companies: on hold for date plaques",
      href: DOSSIER, kind: "context", verified: true },
    "E3-ORIGINAL": { label: "Era 3 exhibit notes: original demonstrations made for the voyage, not historical claims",
      href: "https://github.com/Bitcoin-Bill/oogaboogaland/blob/gv/era-3-exhibits/docs/genesis-voyage/exhibits/era-3.md", kind: "context", verified: true }
  };
  const sourceOf = (key) => sources[key] || GP.sourceOf(key);
  const sourceLines = (keys) => keys.map((k) => `[${k}] ${sourceOf(k).label} (${sourceOf(k).kind}) ${sourceOf(k).href}`);

  // --- The exhibits' words ------------------------------------------------------------------------------------------
  // `label` (its sign; it names its year), `dated` (what the date marks), `kid` (the short explanation), `deeper`
  // (MORE at its prompt), `sourceKeys`, and `pager` (the pager's message when the visitor comes near).
  const EXHIBITS = {
    newspaper: { title: "The Daily Ooga press", year: 1991, label: "THE DAILY OOGA PRESS · 1991",
      dated: "1991: Haber and Stornetta's journal paper is published (manuscript received 19 August 1990, revised 26 October 1990). March 1992: Bayer, Haber and Stornetta's manuscript; 1993: their book chapter.",
      kid: "Tock's five pages are linked: each fingerprint is made from its page and the fingerprint before it. This morning's paper printed the last one. Change any page and its fingerprint changes, so every link after it fails, and the printed fingerprint no longer matches. Put the page back and everything matches again.",
      deeper: [
        "What these proposals establish: if a record's fingerprint is linked into a chain whose newest value was widely published, the record existed no later than that publication, and nobody can later change it, or slip in or reorder records before it, without the links failing for anyone who kept a later value. Haber and Stornetta argue certain backdating and forward-dating attacks are infeasible under stated assumptions, \"even with the collusion of a time-stamping service\". [E3-HS]",
        "Bayer, Haber and Stornetta make this cheaper: many documents go into one tree each round, each keeps a short path to the round's value, and only that value is linked and published. Their paper credits Merkle's earlier tree work. [E3-BHS, E3-BHS-PUB]",
        "What they do not establish: that what a page says is true, or who wrote it. A timestamp is evidence about data, not proof of its story. Publication still needs a widely witnessed place, such as a newspaper, and nothing here is money or a way for strangers to agree on one history. [E3-HS; interpretation]",
        "In the Bitcoin whitepaper (2008), section 3 begins with a timestamp server: hash a block of items and widely publish the hash, \"such as in a newspaper or Usenet post [2-5]\". References [3] and [4] are these two papers; their trail stops are at Fingerprints and Time's lectern. [2] (1999) and [5] (1997) are later and belong to Era 4. [whitepaper]",
        `${NOTE} the fingerprints here are the desk's toy (FNV-1a, eight hex digits), not a secure hash; two pages could share one by accident. The pages and the rule are the same as Tock's desk, so both show the same chain.`],
      sourceKeys: ["E3-HS", "E3-BHS", "E3-BHS-PUB", "whitepaper", "E3-ORIGINAL"],
      pager: "PRESS: CHANGE A PAGE" },
    keys: { title: "Padlock post", year: 1991, label: "PADLOCK POST · 1991",
      dated: "1991: the year PGP's author says he published it electronically for free (his essay is dated June 1991 and was updated in 1999). This station is a teaching model, not PGP.",
      kid: "Bea hands out open padlocks to anyone: her public key. Snap one shut on your note and only Bea's own key, her private key, opens it. It works the other way too: Bea seals a note with her private key, and anyone can check the seal with her public one. That check is a signature.",
      deeper: [
        "PGP's author describes deciding to \"publish PGP electronically for free that year\": 1991. PGP was one of the tools of a wider privacy movement in these years. It is context here: the whitepaper does not cite it. [E3-PGP]",
        `${NOTE} this station is not PGP and not real encryption. Its numbers are tiny (n = 3233, from the primes 61 and 53, a classic textbook example) and anyone can break them by hand. Real tools use far larger numbers and extra steps. The idea of public keys comes from the 1970s (Era 1). [E3-ORIGINAL]`,
        `${NOTE} Bitcoin uses signatures, not secret messages: the whitepaper defines a coin as a chain of digital signatures. [whitepaper]`],
      sourceKeys: ["E3-PGP", "whitepaper", "E3-ORIGINAL"],
      pager: "PADLOCK POST: LOCK A NOTE" },
    bbs: { title: "Dial-up corner", year: 1990, label: "DIAL-UP CORNER · 1990–1995",
      dated: "1990–1995: period style. A generic, unbranded terminal and modem; no model, date or specification is claimed.",
      kid: "Before most homes had the web, people dialled other computers with a modem to read and leave messages. Read the museum notes, look inside the floppy disk in drive A:, and dial a pretend bulletin board (a BBS) to leave a message. Nothing you type leaves this page.",
      deeper: [
        `${NOTE} a BBS was a computer people dialled into with a modem to read and post messages. The dossier treats BBSs, modems and floppies as context and has not cleared model numbers, capacities or prices, so none are given. The board is pretend, and its posts last only for this visit. [E3-GEAR]`,
        `${NOTE} the terminal and its screens are invented for the voyage and copy no real system. The office PC by Tock's desk is the period's computer; this corner is about dialling out. [E3-ORIGINAL]`],
      sourceKeys: ["E3-GEAR", "E3-ORIGINAL"],
      pager: "DIAL-UP: TRY THE PRETEND BBS" },
    pager: { title: "Pocket pager", year: 1990, label: "POCKET PAGER · 1990–1995",
      dated: "1990–1995: period style. No model, date or specification is claimed.",
      kid: "A pager was a pocket gadget that beeped and showed a short message. This one lights up when you walk near an exhibit in this cave. Read your messages here.",
      deeper: [
        `${NOTE} this pager is an original toy. Its messages come from this cave's exhibits, not from any network, and they last only for this visit. The dossier has not cleared pager models, dates or numbers, so none are given. [E3-GEAR, E3-ORIGINAL]`],
      sourceKeys: ["E3-GEAR", "E3-ORIGINAL"],
      pager: "PAGER: READ ME HERE" },
    rally: { title: "Tick-Tock Rally", year: 1990, label: "TICK-TOCK RALLY · 1990–1995",
      dated: "1990–1995: an arcade cabinet in a period style, with an original game made for the voyage.",
      kid: "Keep the ball in play with your paddle. Here you play a tick at a time: each L, R or W you type moves the game on a quarter of a second. Every return scores one; hit the clock at the top for a stamp worth five. Three balls, then see your score.",
      deeper: [
        `${NOTE} Tick-Tock Rally is original to the voyage: no copied game, program, name, artwork or sound. Paddle-and-ball games are a genre; this one is ours. Its screen plays a demo by itself between visitors. [E3-ORIGINAL]`,
        `${NOTE} the cabinet is context for the period's gear, with no model or date claimed. [E3-GEAR]`],
      sourceKeys: ["E3-ORIGINAL", "E3-GEAR"],
      pager: "ARCADE: RALLY IS ON" },
    // The shared overview board and Fingerprints and Time's desk, for the pager only: their words are the scene's.
    overview: { pager: "ERA 3 1990-95 WELCOME" },
    desk: { pager: "DESK: EACH STAMP HOLDS THE LAST" }
  };
  // The cave's community and companies stay on hold: named, never dated (dossier: HOLD).
  const HOLD = ["The Cypherpunks mailing list (a participant recalls September 1992): no readable primary copy yet.",
    "DigiCash (proposed about 1990): founding date unresolved.",
    "Surety (proposed 1995 timestamping in use): first dated newspaper notice not yet found."];
  // The era's overview (shown on the shared board and its panel): at most 280 characters, then three pages.
  const overview = {
    summary: "A digital page can be changed without a torn edge. In 1990–1995 researchers linked fingerprints so a change shows and a page can be shown to exist by a time; others built private-message tools. Different projects, not unfinished Bitcoins.",
    pages: [
      { caption: "What to try", title: "Five things to try here", text: [
        "Tock's desk (Fingerprints and Time) stamps pages and links them. Its lectern tells the two papers' story.",
        "West of the desk: the Daily Ooga press (change a page and watch the later links fail), the padlock post (lock and sign a note, a toy), the dial-up corner (a pretend BBS), the pocket pager, and Tick-Tock Rally.",
        "Walk up and press Space. RESET at any prompt starts that exhibit again."] },
      { caption: "In the whitepaper", title: "The timestamp references", text: [
        "Section 3, Timestamp Server: hash a block of items and widely publish the hash, \"such as in a newspaper or Usenet post [2-5]\".",
        "[3] Haber and Stornetta, 1991, and [4] Bayer, Haber and Stornetta, 1993, are this cave's: their trail stops are at Fingerprints and Time's lectern.",
        "[2] (1999) and [5] (1997) come later, in Era 4."] },
      { caption: "Context, and on hold", title: "Also from these years", text: [
        "Context, not cited by the whitepaper: Dwork and Naor (presented 1992) price access to a resource such as email with a moderately hard computation. PGP's author describes publishing it in 1991. Eric Hughes's manifesto is dated 9 March 1993.",
        `${NOTE} not yet dated, so named only: ${HOLD.join(" ")}`] }
    ],
    sourceKeys: ["E3-HS", "E3-BHS", "E3-BHS-PUB", "whitepaper", "E3-DN", "E3-PGP", "E3-HUGHES", "E3-HOLD"]
  };

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
    // `result` is rewritten by every check, so the scene's frame can read it without recomputing anything.
    const n = { pages: original.slice(), stamps: link(original, []), printed, printedChain, version: 0, edits: 0, result: { first: -1, matches: true } };
    n.check = () => {
      link(n.pages, n.stamps);
      let first = -1;
      for (let i = 0; i < n.pages.length; i++) if (n.stamps[i] !== printedChain[i]) { first = i; break; }
      n.result.first = first; n.result.matches = n.stamps[n.stamps.length - 1] === printed;
      return n.result;
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


  // --- The dial-up corner: museum notes, a floppy and a pretend BBS -------------------------------------------------
  // Its own terminal, beside (not replacing) the office PC by Tock's desk. Posts to the pretend board last for the
  // visit only and are capped (`MAX_POSTS`, oldest first out). `run(line)` answers its own commands and returns null
  // for any other, so the office PC's prompt could hand its unknown commands here (see the notes' hook request).
  const MAX_POSTS = 8;
  const NOTES = [`${NOTE} the ideas in this cave, in short.`, "1991  Haber and Stornetta: link each record's fingerprint to the last. [E3-HS]", "1992  Bayer, Haber and Stornetta: one tree, one stamp per round (book 1993). [E3-BHS]",
    "1992  Dwork and Naor: make bulk messages cost some computing (context). [E3-DN]", "1991  PGP published electronically, its author says (context). [E3-PGP]", "1993  Hughes's manifesto, dated 9 March (context). [E3-HUGHES]",
    "2008  The whitepaper cites [3] and [4] in its timestamp section. [whitepaper]"];
  const floppyFiles = () => [
    { name: "README", ext: "1ST", text: [`${NOTE} a pretend 3.5-inch disk for the voyage. No capacity is claimed.`, "Try TYPE A:CHAIN.TXT or TYPE A:LETTER.TXT."] },
    { name: "LETTER", ext: "TXT", text: ["Dear Tock, I copied your pages onto this disk.", "If I change one, your chain will know. -- Bea (an invented Ooga)"] },
    { name: "CHAIN", ext: "TXT", text: ["Tock's pages and their linked fingerprints (the desk's toy hash):", ...G.chain(false).map((c, i) => `${i + 1}. ${c}  ${G.PAGES[i]}`)] },
    { name: "PADLOCK", ext: "TXT", text: [`Bea's toy public padlock: n = ${TOY.n}, e = ${TOY.e}. Use it at the padlock post.`] }
  ];
  const SEEDED = [{ from: "TOCK", text: "Stamped five pages today. Links all hold." }, { from: "BEA", text: "Padlocks free at the post. Bring a note." }, { from: "SYSOP", text: "Pretend board. Posts vanish when you leave." }];
  const createBbs = () => {
    const floppy = floppyFiles(), ex = EXHIBITS.bbs;
    const d = { floppy, posts: [], online: false, sent: 0, version: 0 };
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
    const help = ["NOTES         museum notes about this cave", "DIR A:        the floppy disk in drive A:", "TYPE A:<file> show a file on the floppy", "DIAL          call the pretend bulletin board",
      "READ · POST <message> · HANGUP   on the board", "RESET         hang up and clear your posts", "MORE · SOURCES"];
    d.run = (line) => {
      const input = GP.clean(line), space = input.indexOf(" "), cmd = (space < 0 ? input : input.slice(0, space)).toUpperCase(), arg = space < 0 ? "" : input.slice(space + 1).trim();
      if (!cmd) return { lines: [] };
      if (cmd === "HELP") return { lines: help };
      if (cmd === "MORE") return { lines: [ex.dated, "", ...ex.deeper] };
      if (cmd === "SOURCES") return { lines: sourceLines(ex.sourceKeys) };
      if (cmd === "NOTES") return { lines: NOTES };
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
      return null;
    };
    d.terminal = {
      get banner() { return [ex.label, ex.dated, "", ex.kid, "", "Type HELP for the commands. RESET clears your posts.", ""]; },
      prompt: "TERM>",
      run: (line) => d.run(line) || { lines: ["Unknown command. Type HELP."] }
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
    // A tick at the prompt: `seconds` of whole fixed steps at once (only ever from a typed command).
    g.advance = (seconds) => { const n = Math.round(seconds / R.step); for (let k = 0; k < n; k++) tick(R.step); };
    // Frame time in, fixed steps out; time past four steps is dropped, as the island's games do.
    g.update = (dt) => {
      g.acc = Math.min(g.acc + dt, R.step * R.maxSteps);
      let n = 0;
      while (g.acc >= R.step - 1e-9 && n < R.maxSteps) { tick(R.step); g.acc -= R.step; n++; }
      return n;
    };
    return g;
  };

  // The pager's own prompt: its messages, newest first, and CLEAR.
  const pagerTerminal = (pager, triggers) => {
    const ex = EXHIBITS.pager, slot = { index: 0, time: 0, text: "" };
    const list = () => {
      pager.read();
      if (!pager.count) return ["No messages yet. Walk near the exhibits in this cave and your pager will light up."];
      const out = [];
      for (let k = 0; k < pager.count; k++) { pager.at(k, slot); out.push(`${Math.floor(slot.time / 60)}:${String(Math.floor(slot.time % 60)).padStart(2, "0")}  ${slot.text}`); }
      return out;
    };
    return {
      get banner() { return [ex.label, ex.dated, "", ex.kid, "", ...list(), "", "READ shows them again. CLEAR (or RESET) empties the pager. MORE · SOURCES", ""]; },
      prompt: "PAGER>",
      run: (line) => {
        const cmd = GP.clean(line).toUpperCase();
        if (!cmd) return { lines: [] };
        if (cmd === "READ" || cmd === "HELP") return { lines: cmd === "HELP" ? ["READ · CLEAR (or RESET) · MORE · SOURCES"] : list() };
        if (cmd === "CLEAR" || cmd === "RESET") { pager.clear(); triggers.reset(); return { lines: ["The pager is empty. Every exhibit will page you again when you walk near it."], reset: true }; }
        if (cmd === "MORE") return { lines: ex.deeper };
        if (cmd === "SOURCES") return { lines: sourceLines(ex.sourceKeys) };
        return { lines: ["Unknown command. Type HELP."] };
      }
    };
  };

  // Tick-Tock Rally at its prompt: each L (or A), R (or D) or W (or .) is one tick of TICK seconds with the paddle
  // held that way; up to MAX_TICKS a line. The field is drawn in text after every line.
  const TICK = 0.25, MAX_TICKS = 8, COLS = 32, ROWS = 12;
  const rallyTerminal = (g, onPlay) => {
    const ex = EXHIBITS.rally, R = RALLY;
    const field = () => {
      const rows = [`+${"-".repeat(COLS)}+`];
      const col = (x) => Math.max(0, Math.min(COLS - 1, Math.floor(x / R.w * COLS))), row = (y) => Math.max(0, Math.min(ROWS - 1, Math.floor(y / R.h * ROWS)));
      const bc = col(g.x), br = row(g.y), cc = col(g.clock), pc0 = col(g.paddle - R.paddleW / 2), pc1 = col(g.paddle + R.paddleW / 2);
      for (let r = 0; r < ROWS; r++) {
        let s = "";
        for (let c = 0; c < COLS; c++) s += r === br && c === bc ? "o" : r === 0 && Math.abs(c - cc) <= 1 ? "@" : r === ROWS - 1 && c >= pc0 && c <= pc1 ? "=" : " ";
        rows.push(`|${s}|`);
      }
      rows.push(`+${"-".repeat(COLS)}+`, `SCORE ${g.score}   BALLS ${g.balls}   BEST ${g.best}   ${g.state === "serve" ? "Type S to serve." : g.state === "over" ? "Game over. S plays again." : ""}`);
      return rows;
    };
    const help = ["S             serve (or play again)", "L R W         one tick left, right or wait; up to 8 a line, e.g. LLW", "A D .         the same as L R W", "RESET         start over · MORE · SOURCES"];
    return {
      get banner() { return [ex.label, ex.dated, "", ex.kid, "", ...field(), "", "Type HELP for the commands. RESET starts over.", ""]; },
      prompt: "RALLY>",
      run: (line) => {
        const cmd = GP.clean(line).toUpperCase().replace(/\s+/g, "");
        if (!cmd) return { lines: [] };
        if (cmd === "HELP") return { lines: help };
        if (cmd === "MORE") return { lines: ex.deeper };
        if (cmd === "SOURCES") return { lines: sourceLines(ex.sourceKeys) };
        onPlay();
        if (cmd === "RESET") { g.reset(); return { lines: ["A fresh game.", ...field()], reset: true }; }
        if (cmd === "S" || cmd === "SERVE") { g.serve(); g.advance(TICK); return { lines: field() }; }
        if (!/^[LRWAD.]+$/.test(cmd)) return { lines: ["Unknown command. Type HELP."] };
        for (let i = 0; i < Math.min(MAX_TICKS, cmd.length); i++) {
          const k = cmd[i];
          g.input.left = k === "L" || k === "A"; g.input.right = k === "R" || k === "D";
          g.advance(TICK);
        }
        g.input.left = g.input.right = false;
        return { lines: field() };
      }
    };
  };

  // --- Where everything stands --------------------------------------------------------------------------------------
  // West of Fingerprints and Time on the left bank (its room and margin end at x -9.9), clear of the gateway, the dock,
  // the lamp at (-14, u 18) and the stream's walk. Every exhibit faces the stream (+x); each one's `at` is where a
  // visitor stands to use it, in front of it, and its tap box sits on the model. A row at x -13.5 leaves a 3 m walk
  // between it and the room's margin, and the second row at x -20.5 a 6 m walk behind the first.
  const E = GW.ERAS[ERA], TOP = GW.BANK_TOP, ROW = -13.5, BACK = -20.5;
  const LAYOUT = {
    newspaper: { x: ROW, z: E.z - 1, hx: 0.6, hz: 1.3, front: 1.4, h: 3.1 },
    keys: { x: ROW, z: E.z + 10, hx: 0.55, hz: 0.65, front: 1.3, h: 1.5 },
    pager: { x: ROW, z: E.z - 11, hx: 0.4, hz: 0.5, front: 1.1, h: 2 },
    rally: { x: BACK, z: E.z + 4, hx: 0.75, hz: 0.55, front: 1.5, h: 2.25 },
    bbs: { x: BACK, z: E.z + 13, hx: 0.45, hz: 0.75, front: 1.2, h: 1.3 }
  };
  // The pager's spots: every exhibit here, the shared overview board and the desk (as scene-genesis.js places them).
  const OVERVIEW_AT = GW.bankToWorld(GW.bankFrame(ERA, -1), 7, 6, { x: 0, z: 0 });
  const PAGE_SPOTS = [{ id: "overview", ...OVERVIEW_AT }, { id: "desk", x: -7.2 + GW.ROOM_SHIFT.x, z: -25.2 + GW.ROOM_SHIFT.z },
    ...["newspaper", "keys", "bbs", "pager", "rally"].map((id) => ({ id, x: LAYOUT[id].x, z: LAYOUT[id].z }))];
  const PAGER_TEXTS = PAGE_SPOTS.map((s) => EXHIBITS[s.id].pager), PAGER_TOASTS = PAGER_TEXTS.map((t) => `Pager · ${t}`);

  // --- The visit ----------------------------------------------------------------------------------------------------
  // `v` holds this visit's state and nodes: set by `build`, dropped by `dispose`.
  let v = null;
  // An in-world screen: a canvas the renderer re-uploads when its `version` moves (as the jumbotron's is).
  const screenGeometry = (canvas, w, h) => ({ verts: [-w / 2, -h / 2, 0.03, w / 2, -h / 2, 0.03, w / 2, h / 2, 0.03, -w / 2, h / 2, 0.03],
    faces: [{ i: [0, 1, 2, 3], color: [255, 255, 255], emissive: 0.9 }], lines: [], castShadow: false,
    imageSurface: { canvas, version: 0, rect: [-w / 2, -h / 2, w, h], background: [8, 8, 14] } });
  const DIGITS = "0123456789".split("");
  // Draws a whole number right-aligned at (x, y) a digit at a time from fixed strings, so nothing is allocated.
  const drawNumber = (g, n, x, y, step) => { n = Math.max(0, Math.floor(n)); do { g.fillText(DIGITS[n % 10], x, y); x -= step; n = Math.floor(n / 10); } while (n > 0); };
  const paintRally = () => {
    const g = v.rallyCtx, s = v.showPlayer > 0 ? v.rally : v.demo, R = RALLY, X = 8, Y = 18, FW = 144, FH = 96;
    g.fillStyle = "#0b0a12"; g.fillRect(0, 0, 160, 120);
    g.strokeStyle = "#5a4a8a"; g.lineWidth = 2; g.strokeRect(X - 2, Y - 2, FW + 4, FH + 4);
    g.fillStyle = "#ffcf7a"; g.font = "bold 10px monospace"; g.textBaseline = "top";
    g.fillText(v.showPlayer > 0 ? "TICK-TOCK RALLY" : "TICK-TOCK RALLY  DEMO", X, 4);
    g.fillStyle = "#e9e1ff"; drawNumber(g, s.score, 150, 4, 7);
    g.fillStyle = "#ffd25f"; g.fillRect(X + (s.clock - R.clockW / 2) * FW, Y + (R.clockY - R.clockH / 2) / R.h * FH, R.clockW * FW, Math.max(2, R.clockH / R.h * FH));
    g.fillStyle = "#2ad1ff"; g.fillRect(X + (s.paddle - R.paddleW / 2) * FW, Y + (R.paddleY - R.paddleH / 2) / R.h * FH, R.paddleW * FW, 3);
    g.fillStyle = "#ffffff"; g.fillRect(X + s.x * FW - 2, Y + s.y / R.h * FH - 2, 4, 4);
    v.rallySurface.version++;
  };
  const paintPager = () => {
    const g = v.pagerCtx, slot = v.slot;
    g.fillStyle = "#1d2b16"; g.fillRect(0, 0, 192, 64);
    g.fillStyle = "#9dff7a"; g.font = "bold 12px monospace"; g.textBaseline = "top";
    if (v.pager.count) { v.pager.at(0, slot); g.fillText(slot.text, 6, 8); } else g.fillText("NO MESSAGES", 6, 8);
    g.font = "11px monospace"; g.fillText("UNREAD", 6, 40); drawNumber(g, v.pager.unread, 70, 40, 7);
    v.pagerSurface.version++;
  };

  const build = (kit) => {
    const { top, M, createNode, addChild, place, solid, sign, obstacle, prop, notify } = kit;
    const yaw = Math.PI / 2, L = LAYOUT, screens = typeof document !== "undefined";
    const paper = createNewspaper(), keys = createKeyStation(), bbs = createBbs(), pager = createPager(PAGER_TEXTS), triggers = createTriggers(PAGE_SPOTS);
    const rally = createRally(), demo = createRally();
    // `notify` is the hook the notes ask for (a toast); without it the pager's display board and prompt hold its messages.
    v = { notify: notify || null, paper, keys, bbs, pager, triggers, rally, demo, slot: { index: 0, time: 0, text: "" }, showPlayer: 0, screenT: 0, rallyAt: -1, rallyMine: false, rallyScore: -1, paperShown: -1, keysShown: -1,
      tiles: [], links: [], printedOk: null, printedBad: null, shackleOpen: null, shackleShut: null, pagerLamp: null, rallyCtx: null, rallySurface: null, pagerCtx: null, pagerSurface: null };
    const visit = v;
    const node = (geometry, x, y, z, visible = true) => place(createNode({ geometry, position: { x, y, z }, rotation: { x: 0, y: yaw, z: 0 }, visible }));
    // An exhibit's footprint, its sign and its prop: the tap box over the model, the use point in front of it.
    const exhibit = (key, def) => {
      const a = L[key];
      obstacle(a.x - a.hx, a.x + a.hx, a.z - a.hz, a.z + a.hz);
      return prop({ ...def, at: { x: a.x + a.front, y: top, z: a.z }, reach: 1.9, pick: { w: a.hx * 2 + 0.2, h: a.h, d: a.hz * 2 + 0.2, x: a.x, z: a.z } });
    };
    const ex = EXHIBITS;

    // The Daily Ooga press: a stand with this morning's paper, Tock's five pages linked across its board, the links
    // gold while they hold and red from a changed page on, and the printed fingerprint green or red.
    const N = L.newspaper;
    solid(1.2, 0.9, 2.6, "#5a4a3a", N.x, top + 0.45, N.z);
    solid(0.12, 2.2, 2.6, "#2f2a25", N.x - 0.5, top + 1.9, N.z);
    solid(0.8, 0.04, 1.1, "#e9e1cc", N.x + 0.05, top + 0.92, N.z + 0.65);
    solid(0.8, 0.02, 1.1, "#cfc6aa", N.x + 0.05, top + 0.92, N.z - 0.65);
    for (let i = 0; i < G.PAGES.length; i++) {
      const z = N.z + 1 - i * 0.5;
      v.tiles.push({ ok: node(M.box({ w: 0.36, h: 0.36, d: 0.04, color: "#" + paper.printedChain[i].slice(0, 6), emissive: 0.8 }), N.x - 0.42, top + 2.3, z),
        bad: node(M.box({ w: 0.36, h: 0.36, d: 0.05, color: "#ff3b30", emissive: 1.1 }), N.x - 0.42, top + 2.3, z, false) });
      if (i < G.PAGES.length - 1) v.links.push({ ok: node(M.box({ w: 0.14, h: 0.06, d: 0.03, color: "#e8c35a", emissive: 0.7 }), N.x - 0.42, top + 2.3, z - 0.25),
        bad: node(M.box({ w: 0.08, h: 0.06, d: 0.04, color: "#ff3b30", emissive: 1.2 }), N.x - 0.42, top + 2.18, z - 0.25, false) });
    }
    v.printedOk = node(M.box({ w: 0.6, h: 0.5, d: 0.04, color: "#7dffa0", emissive: 0.9 }), N.x - 0.42, top + 1.3, N.z);
    v.printedBad = node(M.box({ w: 0.6, h: 0.5, d: 0.05, color: "#ff3b30", emissive: 1.1 }), N.x - 0.42, top + 1.3, N.z, false);
    sign(ex.newspaper.label, "change a page · EDIT, UNDO, RESET", N.x - 0.3, top + 3.45, N.z, yaw, 0.45);
    const news = newspaperTerminal(paper);
    // It demonstrates the papers whose trail stops are Fingerprints and Time's lectern ([3], [4]): a demonstration, not
    // a stop, so the trail keeps one stop each (docs/genesis-voyage/exhibits/era-3.md, hook request 4).
    exhibit("newspaper", { id: "e3-press", year: 1991, connection: "demonstration", title: ex.newspaper.title, label: ex.newspaper.label, sourceKeys: ex.newspaper.sourceKeys, demonstrates: ["era3-room-haber1991", "era3-room-bayer1993"],
      date: "1991 journal publication of Haber and Stornetta (received 19 August 1990); March 1992 manuscript and 1993 book chapter of Bayer, Haber and Stornetta", onUse: () => ({ terminal: news }) });

    // The padlock post: a post box with Bea's padlock, its shackle up while open and down while a note is locked.
    const K = L.keys;
    solid(0.8, 1.3, 1.2, "#2f5d8a", K.x, top + 0.65, K.z);
    solid(0.9, 0.12, 1.3, "#24486b", K.x, top + 1.36, K.z);
    solid(0.03, 0.06, 0.5, "#111111", K.x + 0.41, top + 1.05, K.z);
    solid(0.12, 0.3, 0.36, "#c9a64a", K.x + 0.46, top + 0.62, K.z);
    v.shackleOpen = node(M.box({ w: 0.24, h: 0.22, d: 0.05, color: "#d6dbe0" }), K.x + 0.46, top + 0.86, K.z);
    v.shackleShut = node(M.box({ w: 0.24, h: 0.14, d: 0.05, color: "#d6dbe0" }), K.x + 0.46, top + 0.8, K.z, false);
    sign(ex.keys.label, "lock · sign · check (a toy)", K.x, top + 2.1, K.z, yaw, 0.45);
    const padlock = keyTerminal(keys);
    exhibit("keys", { id: "e3-padlock", year: 1991, connection: "context", title: ex.keys.title, label: ex.keys.label, sourceKeys: ex.keys.sourceKeys,
      date: "1991: when PGP's author says he published it (essay June 1991, updated 1999); the padlock is a teaching model", onUse: () => ({ terminal: padlock }) });

    // The dial-up corner: a desk with an amber terminal, a modem and a floppy box, all invented and unbranded.
    const B = L.bbs;
    solid(0.8, 0.75, 1.4, "#6b4a2b", B.x, top + 0.375, B.z);
    solid(0.45, 0.42, 0.5, "#d8cfb4", B.x - 0.1, top + 0.96, B.z);
    solid(0.02, 0.3, 0.38, "#ffb347", B.x + 0.13, top + 0.97, B.z, 1.1);
    solid(0.2, 0.03, 0.6, "#cfc6aa", B.x + 0.28, top + 0.765, B.z);
    solid(0.2, 0.07, 0.3, "#cfc6aa", B.x - 0.05, top + 0.785, B.z + 0.5);
    solid(0.02, 0.015, 0.06, "#ff5a4a", B.x + 0.06, top + 0.8, B.z + 0.45, 1);
    solid(0.12, 0.1, 0.12, "#1d3c8a", B.x + 0.15, top + 0.8, B.z - 0.55);
    sign(ex.bbs.label, "notes · floppy A: · pretend BBS", B.x, top + 2, B.z, yaw, 0.45);
    exhibit("bbs", { id: "e3-bbs", year: 1990, connection: "context", title: ex.bbs.title, label: ex.bbs.label, sourceKeys: ex.bbs.sourceKeys,
      date: "1990–1995 period style; no model, date or specification claimed", onUse: () => ({ terminal: bbs.terminal }) });

    // The pocket pager on a plinth, with its messages on a display board behind it.
    const P = L.pager;
    solid(0.7, 1, 0.7, "#5a524a", P.x, top + 0.5, P.z);
    solid(0.18, 0.08, 0.3, "#1c1c1c", P.x + 0.05, top + 1.04, P.z);
    v.pagerLamp = node(M.box({ w: 0.2, h: 0.01, d: 0.09, color: "#9dff7a", emissive: 1 }), P.x + 0.05, top + 1.085, P.z);
    solid(0.08, 0.6, 0.08, "#3b2a1a", P.x - 0.3, top + 1.3, P.z);
    if (screens) {
      const c = document.createElement("canvas"); c.width = 192; c.height = 64;
      const geo = screenGeometry(c, 0.96, 0.32);
      v.pagerCtx = c.getContext("2d"); v.pagerSurface = geo.imageSurface;
      const n = place(createNode({ position: { x: P.x - 0.3, y: top + 1.75, z: P.z }, rotation: { x: 0, y: yaw, z: 0 } }));
      addChild(n, createNode({ geometry: geo }));
      paintPager();
    }
    sign(ex.pager.label, "your messages", P.x - 0.3, top + 2.3, P.z, yaw, 0.4);
    const pagerTerm = pagerTerminal(pager, triggers);
    exhibit("pager", { id: "e3-pager", year: 1990, connection: "context", title: ex.pager.title, label: ex.pager.label, sourceKeys: ex.pager.sourceKeys,
      date: "1990–1995 period style; no model, date or specification claimed", onUse: () => ({ terminal: pagerTerm }) });

    // Tick-Tock Rally: an invented cabinet; its screen plays a demo, or the visitor's game for a while after a move.
    const C = L.rally;
    solid(1, 1.9, 1.1, "#3a2a5c", C.x, top + 0.95, C.z);
    solid(0.5, 0.35, 1.1, "#2a1f44", C.x + 0.5, top + 1.05, C.z);
    solid(0.08, 0.3, 0.9, "#ffcf7a", C.x + 0.44, top + 2.05, C.z, 1.2);
    solid(0.12, 0.12, 0.12, "#ff5a4a", C.x + 0.6, top + 1.26, C.z + 0.25, 0.8);
    solid(0.12, 0.12, 0.12, "#5aff9a", C.x + 0.6, top + 1.26, C.z - 0.25, 0.8);
    if (screens) {
      const c = document.createElement("canvas"); c.width = 160; c.height = 120;
      const geo = screenGeometry(c, 0.8, 0.6);
      v.rallyCtx = c.getContext("2d"); v.rallySurface = geo.imageSurface;
      const n = place(createNode({ position: { x: C.x + 0.515, y: top + 1.6, z: C.z }, rotation: { x: 0, y: yaw, z: 0 } }));
      addChild(n, createNode({ geometry: geo }));
    }
    sign(ex.rally.label, "an original game", C.x + 0.3, top + 2.65, C.z, yaw, 0.4);
    const rallyTerm = rallyTerminal(rally, () => { visit.showPlayer = 30; });
    exhibit("rally", { id: "e3-rally", year: 1990, connection: "context", title: ex.rally.title, label: ex.rally.label, sourceKeys: ex.rally.sourceKeys,
      date: "1990–1995 period style; the game is original to the voyage", onUse: () => ({ terminal: rallyTerm }) });
  };

  // Per frame while the visitor is in this cave, allocation-free: the pager (held while a panel or prompt is open, when
  // the scene says so with `state.reading`), the press's and the padlock's models following their state, and the
  // cabinet's screen (a demo, or the visitor's game for 30 s after their last move). In Calm (`state.calm`) the pager's
  // lamp holds steady and the self-playing demo holds still; the screen repaints only when what it shows changes.
  const update = (dt, elapsed, state) => {
    const calm = !!state.calm;
    const fired = v.triggers.update(state.x, state.z, !!state.reading);
    if (fired >= 0) { v.pager.receive(fired, elapsed); if (v.pagerCtx) paintPager(); if (v.notify) v.notify(PAGER_TOASTS[fired]); }
    if (v.paper.version !== v.paperShown) {
      v.paperShown = v.paper.version;
      const r = v.paper.result;
      for (let i = 0; i < v.tiles.length; i++) {
        const bad = r.first >= 0 && i >= r.first;
        v.tiles[i].ok.visible = !bad; v.tiles[i].bad.visible = bad;
        if (i < v.links.length) { v.links[i].ok.visible = !bad; v.links[i].bad.visible = bad; }
      }
      v.printedOk.visible = r.matches; v.printedBad.visible = !r.matches;
    }
    if (v.keys.version !== v.keysShown) { v.keysShown = v.keys.version; v.shackleShut.visible = !!v.keys.locked; v.shackleOpen.visible = !v.keys.locked; }
    v.pagerLamp.glow = v.pager.unread ? (calm ? 1.3 : 1 + (Math.floor(elapsed * 3) & 1) * 0.6) : 0.4;
    const d = v.demo;
    if (!calm) {
      if (d.state === "serve") d.serve(); else if (d.state === "over") d.reset();
      d.input.aim = d.x;
      d.update(dt);
    }
    if (v.showPlayer > 0) v.showPlayer = Math.max(0, v.showPlayer - dt);
    v.screenT += dt;
    if (v.rallyCtx && v.screenT >= 0.05) {
      v.screenT = 0;
      const mine = v.showPlayer > 0, shown = mine ? v.rally : d;
      if (!calm || shown.time !== v.rallyAt || mine !== v.rallyMine || shown.score !== v.rallyScore) { v.rallyAt = shown.time; v.rallyMine = mine; v.rallyScore = shown.score; paintRally(); }
    }
  };
  const dispose = () => { v = null; };

  BL.genesisExhibits.register(ERA, { sources, overview, build, update, dispose });
  // The pure rules, for Node checks, and the office PC's hand-on (hook request 2 in the notes): its prompt may pass a
  // line it doesn't know here, to the visit's dial-up corner; null when this answers nothing.
  BL.genesisEra3 = { ERA, NOTE, EXHIBITS, HOLD, TOY, RALLY, MAX_POSTS, MAX_NOTE, TICK, MAX_TICKS, LAYOUT, PAGE_SPOTS, PAGER_TEXTS, sources, overview, link,
    createNewspaper, newspaperTerminal, createKeyStation, keyTerminal, createBbs, createPager, createTriggers, createRally, pagerTerminal, rallyTerminal,
    pcRun: (line) => v && !/^\s*(HELP|MORE|SOURCES|RESET)\b/i.test(line) ? v.bbs.run(line) : null, get visit() { return v; } };
})();
