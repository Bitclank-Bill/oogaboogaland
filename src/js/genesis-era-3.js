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
// exhibits you walk near), Tick-Tock Rally (an original paddle-and-ball cabinet, played a tick at a time at its
// prompt, its own screen running a demo) and, added later as a modern toy, the padlock courier (three friends' open
// padlocks on a rack; its console game, Padlock Courier, is genesis-era-3-courier.js). The pure rules come first so Node can check them; `build(kit)` places the
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
  // Every prompt opens with a short "How to use" (its exhibit's `howTo` steps), then its label.
  const howTo = (ex) => ["HOW TO USE", ...ex.howTo.map((step, i) => `${i + 1}. ${step}`), ""];
  const sourceLines = (keys) => keys.map((k) => `[${k}] ${sourceOf(k).label} (${sourceOf(k).kind}) ${sourceOf(k).href}`);

  // --- The exhibits' words ------------------------------------------------------------------------------------------
  // `label` (its sign; it names its year), `dated` (what the date marks), `kid` (the short explanation), `deeper`
  // (MORE at its prompt), `sourceKeys`, and `pager` (the pager's message when the visitor comes near).
  const EXHIBITS = {
    newspaper: { title: "Daily Ooga press: change a page", year: 1991,
      howTo: ["Type SHOW to see Tock's five pages and their fingerprints.", "Type EDIT 2 and some new words to change page 2.",
        "Watch every later link, and this morning's printed fingerprint, turn red.", "Type UNDO 2, or RESET, to put it back."], label: "THE DAILY OOGA PRESS · 1991",
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
    keys: { title: "Padlock post: lock and sign a note", year: 1991,
      howTo: ["Type LOCK and a short note, like LOCK meet at the dock.", "Type PEEK to see what a snoop sees, then OPEN.",
        "Type SIGN two bananas, then CHANGE, then CHECK.", "RESET starts again."], label: "PADLOCK POST · 1991",
      dated: "1991: the year PGP's author says he published it electronically for free (his essay is dated June 1991 and was updated in 1999). This station is a teaching model, not PGP.",
      kid: "Bea hands out open padlocks to anyone: her public key. Snap one shut on your note and only Bea's own key, her private key, opens it. It works the other way too: Bea seals a note with her private key, and anyone can check the seal with her public one. That check is a signature.",
      deeper: [
        "PGP's author describes deciding to \"publish PGP electronically for free that year\": 1991. PGP was one of the tools of a wider privacy movement in these years. It is context here: the whitepaper does not cite it. [E3-PGP]",
        `${NOTE} this station is not PGP and not real encryption. Its numbers are tiny (n = 3233, from the primes 61 and 53, a classic textbook example) and anyone can break them by hand. Real tools use far larger numbers and extra steps. The idea of public keys comes from the 1970s (Era 1). [E3-ORIGINAL]`,
        `${NOTE} Bitcoin uses signatures, not secret messages: the whitepaper defines a coin as a chain of digital signatures. [whitepaper]`],
      sourceKeys: ["E3-PGP", "whitepaper", "E3-ORIGINAL"],
      pager: "PADLOCK POST: LOCK A NOTE" },
    bbs: { title: "Dial-up corner: call the pretend BBS", year: 1990,
      howTo: ["Press DIAL to call the pretend bulletin board, then READ, or POST and a short message.",
        "Press CRT to show the test picture on the cart's screen at the next sample grid: fewer squares, bigger blocks.",
        "Type DIR A: to look inside the floppy, then TYPE A:LETTER.TXT.", "RESET hangs up, clears your posts and puts the test screen back."], label: "DIAL-UP CORNER · 1990–1995",
      dated: "1990–1995: period style. A generic, unbranded terminal and modem; no model, date or specification is claimed.",
      kid: "Before most homes had the web, people dialled other computers with a modem to read and leave messages. Read the museum notes, look inside the floppy disk in drive A:, and dial a pretend bulletin board (a BBS) to leave a message. Nothing you type leaves this page.",
      deeper: [
        `${NOTE} a BBS was a computer people dialled into with a modem to read and post messages. The dossier treats BBSs, modems and floppies as context and has not cleared model numbers, capacities or prices, so none are given. The board is pretend, and its posts last only for this visit. [E3-GEAR]`,
        `${NOTE} the terminal and its screens are invented for the voyage and copy no real system. The office PC by Tock's desk is the period's computer; this corner is about dialling out. [E3-ORIGINAL]`,
        `${NOTE} the test screen on the cart draws one original picture on four sample grids, 20 by 15 up to 160 by 120 squares. They are illustrative settings chosen for the lesson, not the specification of any real monitor or graphics card: this museum's research has verified no display specification for these years, so none is shown. [E3-ORIGINAL, E3-GEAR]`],
      sourceKeys: ["E3-GEAR", "E3-ORIGINAL"],
      pager: "DIAL-UP: TRY THE PRETEND BBS" },
    pager: { title: "Pocket pager: page a friend", year: 1990,
      howTo: ["Press HELLO, MEET, LATE or THANKS to page Bea: her reply shows on the pager's screen at once.",
        "Walk near the exhibits in this cave and the pager lights up with a message from each.", "Press READ to see every message, newest first, and CLEAR to empty the pager."], label: "POCKET PAGER · 1990–1995",
      dated: "1990–1995: period style. No model, date or specification is claimed.",
      kid: "A pager was a pocket gadget that beeped and showed a short message. Send Bea a quick page with one button and watch her answer appear, or walk near an exhibit in this cave and see what it pages you.",
      deeper: [
        `${NOTE} this pager is an original toy. Its messages come from this cave's exhibits and from Bea, an invented Ooga, not from any network, and they last only for this visit. The dossier has not cleared pager models, dates or numbers, so none are given. [E3-GEAR, E3-ORIGINAL]`],
      sourceKeys: ["E3-GEAR", "E3-ORIGINAL"],
      pager: "PAGER: READ ME HERE" },
    rally: { title: "Tick-Tock Rally: play a paddle game", year: 1990,
      howTo: ["Press SERVE to serve the ball.", "Press LEFT or RIGHT to move the paddle for one tick, or WAIT to let the ball fly.",
        "Or type several at once, like LLRW (L, R and W are one tick each), to play faster.", "RESET starts a new game."], label: "TICK-TOCK RALLY · 1990–1995",
      dated: "1990–1995: an arcade cabinet in a period style, with an original game made for the voyage.",
      kid: "Keep the ball in play with your paddle. Here you play a tick at a time: each LEFT, RIGHT or WAIT moves the game on a quarter of a second. Every return scores one; hit the clock at the top for a stamp worth five. Three balls, then see your score.",
      deeper: [
        `${NOTE} Tick-Tock Rally is a modern museum homage, original to the voyage, not historical software: no copied game, program, name, artwork or sound. Paddle-and-ball games are a genre; this one is ours. Its screen plays a demo by itself between visitors, and a live version for the museum's game console uses the same rules. [E3-ORIGINAL]`,
        `${NOTE} the cabinet is context for the period's gear, with no model or date claimed. [E3-GEAR]`],
      sourceKeys: ["E3-ORIGINAL", "E3-GEAR"],
      pager: "ARCADE: RALLY IS ON" },
    // A modern toy beside the padlock post (added with its console game, Padlock Courier, genesis-era-3-courier.js):
    // a rack of three friends' open padlocks. Not historical software or any real tool.
    courier: { title: "Padlock courier: address a note", year: 1990,
      howTo: ["Type SEND BEA and a short note to snap Bea's open padlock shut on it.", "Type TRY TOCK to see whether Tock's key opens it, then TRY BEA.",
        "Walk up and press Space to play Padlock Courier on the console.", "RESET empties the rack."], label: "PADLOCK COURIER · MODERN TOY · 1990–1995 GALLERY",
      dated: "No historical date: a modern explanatory toy shown in the 1990–1995 gallery, beside the padlock post.",
      kid: "Bea, Tock and Ooga each leave an open padlock on the rack: their public keys. To send one of them a note, snap that friend's padlock shut on it. Only that friend's own key, their private key, opens it again; the others' keys don't fit.",
      deeper: [
        `${NOTE} the rack and its console game are original museum toys, not PGP or any real program, and the padlocks are pictures, not encryption. The padlock post next to it shows the toy maths. [E3-ORIGINAL]`,
        `${NOTE} the idea it plays with, that anyone may hold your open padlock while only you hold the key, is the public-key idea behind the privacy tools of these years, such as PGP (context: the whitepaper does not cite it). [E3-PGP]`],
      sourceKeys: ["E3-ORIGINAL", "E3-PGP"],
      pager: "COURIER: ADDRESS A NOTE" },
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
      { caption: "What to try", title: "Six things to try here", text: [
        "Tock's desk (Fingerprints and Time) stamps pages and links them. Its lectern tells the two papers' story.",
        "West of the desk: the Daily Ooga press (change a page and watch the later links fail), the padlock post (lock and sign a note, a toy), the dial-up corner (a pretend BBS), the pocket pager, Tick-Tock Rally, and the padlock courier (a modern toy with a console game).",
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
      get banner() { return [...howTo(ex), ex.label, ex.dated, "", ex.kid, "", ...status(), "", "Type HELP for the commands. RESET puts everything back.", ""]; },
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
      get banner() { return [...howTo(ex), ex.label, ex.dated, "", ex.kid, "", "A teaching model with tiny numbers. Not real encryption.", "Type HELP for the commands. RESET starts again.", ""]; },
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
  // --- The test screen: one original picture on sample grids ---------------------------------------------------------
  // The picture is a function of (u, v) in [0, 1) giving one of CRT_INKS: a night sky in bands, a low sun, two hills, a
  // palm and a little stamp on a post. Each sample grid (GRIDS) takes one sample at each square's middle, so a coarse
  // grid shows big blocks. The grids are illustrative settings for the lesson, not any real display's specification.
  const CRT_INKS = ["#0b1030", "#1c2a6b", "#4a3f8f", "#ff8c3a", "#ffd25f", "#2f8a4f", "#1d5e35", "#5b3a2a", "#e9e1cc", "#ff4fd8"];
  const GRIDS = [[20, 15], [40, 30], [80, 60], [160, 120]];
  const crtPixel = (u, v) => {
    const sun = Math.hypot(u - 0.68, (v - 0.5) * 0.75) < 0.12, hill1 = v > 0.62 + 0.08 * Math.sin(u * 5.5), hill2 = v > 0.74 + 0.05 * Math.cos(u * 8 + 1);
    const trunk = u > 0.22 && u < 0.25 && v > 0.36 && v < 0.7, crown = Math.hypot(u - 0.235, (v - 0.34) * 1.6) < 0.08 && v < 0.4;
    const post = u > 0.84 && u < 0.86 && v > 0.62 && v < 0.82, stamp = u > 0.8 && u < 0.9 && v > 0.55 && v < 0.62;
    if (stamp) return 9;
    if (post) return 8;
    if (crown) return 5;
    if (trunk) return 7;
    if (hill2) return 6;
    if (hill1) return 5;
    if (sun) return Math.hypot(u - 0.68, (v - 0.5) * 0.75) < 0.07 ? 4 : 3;
    return v < 0.25 ? 0 : v < 0.45 ? 1 : 2;
  };
  const ASCII = " .:-+*o=#@";
  // The test screen's state: which grid (0 to 3), changed by CRT (the next) or CRT n (n from 1 to 4).
  const createCrt = () => {
    const c = { level: 1, version: 0 };
    c.set = (n) => { c.level = Math.max(0, Math.min(GRIDS.length - 1, n)); c.version++; return c.level; };
    c.next = () => c.set((c.level + 1) % GRIDS.length);
    c.reset = () => c.set(1);
    // The picture in text at this grid, at most 40 columns and 15 rows (a coarse grid prints whole).
    c.text = () => {
      const [gw, gh] = GRIDS[c.level], cols = Math.min(40, gw), rows = Math.min(15, gh), out = [];
      for (let r = 0; r < rows; r++) {
        let line = "";
        for (let k = 0; k < cols; k++) {
          const u = (Math.floor(k * gw / cols) + 0.5) / gw, v2 = (Math.floor(r * gh / rows) + 0.5) / gh;
          line += ASCII[crtPixel(u, v2)];
        }
        out.push(line);
      }
      return out;
    };
    c.describe = () => {
      const [gw, gh] = GRIDS[c.level];
      return [`Test screen: the picture on a ${gw} by ${gh} sample grid, ${(gw * gh).toLocaleString("en-US")} squares (setting ${c.level + 1} of ${GRIDS.length}).`,
        c.level === 0 ? "So few squares that every one is a big block: you can count them." : c.level === GRIDS.length - 1 ? "So many squares that the edges look almost smooth from a few steps back." : "More squares, smaller blocks: the sun and the palm get rounder.",
        "Illustrative setting for the lesson, not any real monitor's specification."];
    };
    return c;
  };

  const SEEDED = [{ from: "TOCK", text: "Stamped five pages today. Links all hold." }, { from: "BEA", text: "Padlocks free at the post. Bring a note." }, { from: "SYSOP", text: "Pretend board. Posts vanish when you leave." }];
  const createBbs = () => {
    const floppy = floppyFiles(), ex = EXHIBITS.bbs;
    const d = { floppy, posts: [], online: false, sent: 0, version: 0, crt: createCrt() };
    const sizeOf = (f) => f.text.reduce((n, line) => n + line.length + 2, 0);
    const pad = (s, n) => (s + " ".repeat(n)).slice(0, n);
    const findA = (arg) => { const w = arg.toUpperCase().replace(/^A:\\?\s*/, ""); return floppy.find((f) => `${f.name}.${f.ext}` === w || f.name === w) || null; };
    d.post = (text) => {
      const t = GP.clean(text);
      if (!t) return { error: "Write your message after POST." };
      if (d.posts.length >= MAX_POSTS) d.posts.shift();
      d.posts.push({ from: "YOU", text: t }); d.sent++; d.version++;
      return { ok: true };
    };
    d.reset = () => { d.posts.length = 0; d.online = false; d.version++; d.crt.reset(); };
    const board = () => ["--- THE OOGA BOARD (pretend) ---", ...SEEDED.concat(d.posts).map((p, i) => `${String(i + 1).padStart(2)}. ${pad(p.from, 6)} ${p.text}`), "POST <message> leaves one. HANGUP ends the call."];
    const help = ["DIAL          call the pretend bulletin board", "CRT           the test screen's next sample grid (CRT 1 to CRT 4 picks one)", "NOTES         museum notes about this cave", "DIR A:        the floppy disk in drive A:", "TYPE A: <file> show a file on the floppy",
      "READ | POST <message> | HANGUP   on the board", "RESET         hang up and clear your posts", "MORE · SOURCES"];
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
      if (cmd === "CRT") {
        const n = /^\d$/.test(arg) ? +arg - 1 : -1;
        if (arg && !(n >= 0 && n < GRIDS.length)) return { lines: [`Pick a sample grid from 1 to ${GRIDS.length}, or press CRT for the next.`] };
        if (n >= 0) d.crt.set(n); else d.crt.next();
        return { lines: [...d.crt.describe(), "", ...d.crt.text()], crt: d.crt.level };
      }
      if (cmd === "HANGUP") { const was = d.online; d.online = false; return { lines: [was ? "NO CARRIER" : "Not connected."] }; }
      return null;
    };
    d.terminal = {
      get banner() { return [...howTo(ex), ex.label, ex.dated, "", ex.kid, "", "Type HELP for the commands. RESET clears your posts.", ""]; },
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

  // The pager's own prompt: one-button pages to Bea (her reply arrives at once, unread, so the pager's lamp lights), its
  // messages newest first, and CLEAR. `now()` is the visit's clock, for the messages' times.
  const pagerTerminal = (pager, triggers, now = () => 0) => {
    const ex = EXHIBITS.pager, slot = { index: 0, time: 0, text: "" };
    const list = () => {
      pager.read();
      if (!pager.count) return ["No messages yet. Walk near the exhibits in this cave and your pager will light up."];
      const out = [];
      for (let k = 0; k < pager.count; k++) { pager.at(k, slot); out.push(`${Math.floor(slot.time / 60)}:${String(Math.floor(slot.time % 60)).padStart(2, "0")}  ${slot.text}`); }
      return out;
    };
    return {
      get banner() { return [...howTo(ex), ex.label, ex.dated, "", ex.kid, "", ...list(), "", "READ shows them again. CLEAR (or RESET) empties the pager. MORE · SOURCES", ""]; },
      prompt: "PAGER>",
      run: (line) => {
        const cmd = GP.clean(line).toUpperCase();
        if (!cmd) return { lines: [] };
        if (cmd === "HELP") return { lines: ["HELLO         page Bea: hello from the cave", "MEET          page Bea: meet at the press", "LATE          page Bea: running late",
          "THANKS        page Bea: thanks", "READ          your messages, newest first", "CLEAR         empty the pager", "MORE · SOURCES"] };
        const send = SENDS.findIndex(([word]) => word === cmd);
        if (send >= 0) {
          const base = PAGE_SPOTS.length + send * 2, t = now();
          pager.receive(base, t); pager.read(); pager.receive(base + 1, t);
          return { lines: [`Sent: ${PAGER_TEXTS[base]}`, `Bea answers: ${PAGER_TEXTS[base + 1]}`, "It is on the pager's screen now. READ shows them all."], sent: SENDS[send][0] };
        }
        if (cmd === "READ") return { lines: list() };
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
    const help = ["SERVE         serve the ball (or play again)", "LEFT          move the paddle left for one tick", "RIGHT         move the paddle right for one tick",
      "WAIT          let the ball fly for one tick", "S L R W       the same, one letter each; up to 8 a line, e.g. LLRW (A D . work too)", "RESET         start over · MORE · SOURCES"];
    return {
      get banner() { return [...howTo(ex), ex.label, ex.dated, "", ex.kid, "", ...field(), "", "Type HELP for the commands. RESET starts over.", ""]; },
      prompt: "RALLY>",
      run
    };
    function run(line) {
        const cmd = GP.clean(line).toUpperCase().replace(/\s+/g, "");
        if (!cmd) return { lines: [] };
        if (cmd === "HELP") return { lines: help };
        if (cmd === "MORE") return { lines: ex.deeper };
        if (cmd === "SOURCES") return { lines: sourceLines(ex.sourceKeys) };
        onPlay();
        if (cmd === "RESET") { g.reset(); return { lines: ["A fresh game.", ...field()], reset: true }; }
        if (cmd === "S" || cmd === "SERVE") { g.serve(); g.advance(TICK); return { lines: field() }; }
        const word = cmd === "LEFT" ? "L" : cmd === "RIGHT" ? "R" : cmd === "WAIT" ? "W" : cmd;
        if (word !== cmd) return run(word);
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

  // --- The padlock courier: three friends' open padlocks on a rack -------------------------------------------------
  // A note snapped shut in one friend's padlock opens only with that friend's key. `slot` is the padlock holding the
  // note (-1: the rack is empty). The console game (genesis-era-3-courier.js) plays the same idea against a clock.
  const FRIENDS = [{ id: "BEA", name: "Bea", ink: "#5ec8ff" }, { id: "TOCK", name: "Tock", ink: "#ffd23a" }, { id: "OOGA", name: "Ooga", ink: "#c8ff5a" }];
  const friendOf = (word) => FRIENDS.findIndex((f) => f.id === String(word || "").toUpperCase());
  const createCourier = () => {
    const c = { slot: -1, note: "", sent: 0, version: 0 };
    c.send = (who, text) => {
      const i = friendOf(who), t = GP.clean(text).replace(/[^\x20-\x7e]/g, "").slice(0, MAX_NOTE);
      if (i < 0) return { error: "Name a friend: BEA, TOCK or OOGA." };
      if (!t) return { error: `Write the note after SEND ${FRIENDS[i].id}.` };
      c.slot = i; c.note = t; c.sent++; c.version++;
      return { slot: i };
    };
    c.opens = (who) => { const i = friendOf(who); return i < 0 ? null : c.slot >= 0 && i === c.slot; };
    c.reset = () => { c.slot = -1; c.note = ""; c.version++; };
    return c;
  };
  const courierTerminal = (c) => {
    const ex = EXHIBITS.courier;
    const show = () => ["The rack: " + FRIENDS.map((f, i) => `${f.name}'s padlock ${c.slot === i ? "SHUT on a note" : "open"}`).join(" · "),
      c.slot >= 0 ? `In ${FRIENDS[c.slot].name}'s padlock: "${c.note}"` : "No note on the rack yet. Try SEND BEA meet at the press"];
    const help = ["SEND BEA <note>  snap Bea's open padlock shut on a note (or TOCK, OOGA)", "TRY TOCK         does Tock's key open it? (or BEA, OOGA)", "SHOW             the rack's three padlocks",
      "PLAY             how to play Padlock Courier on the console", "RESET            empty the rack · MORE · SOURCES"];
    return {
      get banner() { return [...howTo(ex), ex.label, ex.dated, "", ex.kid, "", ...show(), "", "Type HELP for the commands. RESET empties the rack.", ""]; },
      prompt: "COURIER>",
      run: (line) => {
        const words = GP.clean(line).split(/\s+/), cmd = (words[0] || "").toUpperCase();
        if (!cmd) return { lines: [] };
        if (cmd === "HELP") return { lines: help };
        if (cmd === "MORE") return { lines: ex.deeper };
        if (cmd === "SOURCES") return { lines: sourceLines(ex.sourceKeys) };
        if (cmd === "SHOW") return { lines: show() };
        if (cmd === "RESET") { c.reset(); return { lines: ["The rack is empty and every padlock open again."], reset: true }; }
        if (cmd === "PLAY") return { lines: ["PADLOCK COURIER, on the museum's console: notes come down addressed to Bea, Tock or Ooga.", "Move to the padlock of the friend each note is for and press Space to lock it there; a note left falling drops into the padlock you stand at.",
          "From the sixth note the padlocks swap places, so read before you lock. Fifteen notes win; three in the wrong padlock end the run.", `${NOTE} a modern original museum game, not a game from these years.`] };
        if (cmd === "SEND") {
          const r = c.send(words[1], words.slice(2).join(" "));
          return { lines: r.error ? [r.error] : [`Snapped ${FRIENDS[r.slot].name}'s padlock shut on "${c.note}". Only ${FRIENDS[r.slot].name}'s own key opens it.`, `Try TRY ${FRIENDS[(r.slot + 1) % 3].id}, then TRY ${FRIENDS[r.slot].id}.`] };
        }
        if (cmd === "TRY") {
          const i = friendOf(words[1]), ok = c.opens(words[1]);
          if (i < 0) return { lines: ["Name a friend: TRY BEA, TRY TOCK or TRY OOGA."] };
          if (c.slot < 0) return { lines: ["No note is locked yet. Try SEND BEA meet at the press"] };
          return { lines: [ok ? `${FRIENDS[i].name}'s key turns: "${c.note}"` : `${FRIENDS[i].name}'s key does not fit ${FRIENDS[c.slot].name}'s padlock. The note stays shut.`] };
        }
        return { lines: ["Unknown command. Type HELP."] };
      }
    };
  };

  // --- Where everything stands --------------------------------------------------------------------------------------
  // West of Fingerprints and Time on the left bank (its room and margin end at x -9.9), clear of the gateway, the dock,
  // the lamp at (-14, u 18) and the stream's walk. Every exhibit faces the stream (+x); each one's `at` is where a
  // visitor stands to use it, in front of it, and its tap box sits on the model. A row at x -13.5 leaves a 3 m walk
  // between it and the room's margin, and the second row at x -20.5 a 6 m walk behind the first. The padlock courier
  // (a later modern toy) ends the first row toward the way in, past the padlock post.
  const E = GW.ERAS[ERA], TOP = GW.BANK_TOP, ROW = -13.5, BACK = -20.5;
  const LAYOUT = {
    newspaper: { x: ROW, z: E.z - 1, hx: 0.6, hz: 1.3, front: 1.4, h: 3.1 },
    keys: { x: ROW, z: E.z + 10, hx: 0.55, hz: 0.65, front: 1.3, h: 1.5 },
    pager: { x: ROW, z: E.z - 11, hx: 0.4, hz: 0.5, front: 1.1, h: 2.1 },
    rally: { x: BACK, z: E.z + 4, hx: 0.75, hz: 0.55, front: 1.5, h: 2.25 },
    bbs: { x: BACK, z: E.z + 13, hx: 0.5, hz: 1.75, front: 1.25, h: 1.4 },
    courier: { x: ROW, z: E.z + 18, hx: 0.55, hz: 0.9, front: 1.35, h: 2.0 }
  };
  // The pager's spots: every exhibit here, the shared overview board and the desk (as scene-genesis.js places them).
  const OVERVIEW_AT = GW.bankToWorld(GW.bankFrame(ERA, -1), 7, 6, { x: 0, z: 0 });
  const PAGE_SPOTS = [{ id: "overview", ...OVERVIEW_AT }, { id: "desk", x: -7.2 + GW.ROOM_SHIFT.x, z: -25.2 + GW.ROOM_SHIFT.z },
    ...["newspaper", "keys", "bbs", "pager", "rally"].map((id) => ({ id, x: LAYOUT[id].x, z: LAYOUT[id].z }))];
  // Pages the visitor can send Bea with one button, and her answers (an invented Ooga; nothing leaves the page). Their
  // texts follow the exhibits' in the pager's fixed list, so the ring still stores only indices.
  const SENDS = [["HELLO", "YOU: HELLO FROM THE CAVE", "BEA: HELLO! SEE THE PRESS?"], ["MEET", "YOU: MEET AT THE PRESS", "BEA: OK, AT THE PRESS"],
    ["LATE", "YOU: RUNNING LATE", "BEA: NO RUSH, TAKE CARE"], ["THANKS", "YOU: THANKS, BEA", "BEA: ANY TIME!"]];
  const PAGER_TEXTS = [...PAGE_SPOTS.map((s) => EXHIBITS[s.id].pager), ...SENDS.flatMap(([, sent, reply]) => [sent, reply])], PAGER_TOASTS = PAGER_TEXTS.map((t) => `Pager · ${t}`);

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
  const paintRally = (calm = false) => {
    const g = v.rallyCtx, s = v.showPlayer > 0 ? v.rally : v.demo, R = RALLY, X = 8, Y = 18, FW = 144, FH = 96;
    g.fillStyle = "#0b0a12"; g.fillRect(0, 0, 160, 120);
    g.strokeStyle = "#5a4a8a"; g.lineWidth = 2; g.strokeRect(X - 2, Y - 2, FW + 4, FH + 4);
    g.fillStyle = "#ffcf7a"; g.font = "bold 10px monospace"; g.textBaseline = "top";
    g.fillText(v.showPlayer > 0 ? "TICK-TOCK RALLY" : "TICK-TOCK RALLY  DEMO", X, 4);
    g.fillStyle = "#e9e1ff"; drawNumber(g, s.score, 150, 4, 7);
    // A faint grid on the field, the balls left as dots under it, then the clock (a face with a hand that turns with
    // the game's time), the paddle with its highlight and the ball with its shadow.
    g.fillStyle = "#15132a";
    for (let k = 1; k < 6; k++) g.fillRect(X + k * 24, Y, 1, FH);
    for (let k = 1; k < 4; k++) g.fillRect(X, Y + k * 24, FW, 1);
    g.fillStyle = "#2ad1ff";
    for (let b = 0; b < s.balls; b++) g.fillRect(X + b * 6, Y + FH + 1, 4, 1);
    const cx = X + (s.clock - R.clockW / 2) * FW, cy = Y + (R.clockY - R.clockH / 2) / R.h * FH, cw = R.clockW * FW, ch = Math.max(3, R.clockH / R.h * FH);
    g.fillStyle = "#b8862a"; g.fillRect(cx - 1, cy - 1, cw + 2, ch + 2);
    g.fillStyle = "#ffd25f"; g.fillRect(cx, cy, cw, ch);
    g.fillStyle = "#2a1f44"; g.fillRect(cx + cw / 2 - 0.5, cy, 1, ch);
    const tick = Math.floor(s.time * 2) & 3;
    g.fillRect(cx + cw / 2 + (tick === 1 ? 1 : tick === 3 ? -3 : -0.5), cy + ch / 2 - 0.5, tick & 1 ? 3 : 1, 1);
    const px = X + (s.paddle - R.paddleW / 2) * FW, py = Y + (R.paddleY - R.paddleH / 2) / R.h * FH;
    g.fillStyle = "#1a6f8a"; g.fillRect(px, py + 2, R.paddleW * FW, 2);
    g.fillStyle = "#2ad1ff"; g.fillRect(px, py, R.paddleW * FW, 2);
    g.fillStyle = "#c8f6ff"; g.fillRect(px + 2, py, R.paddleW * FW - 4, 1);
    g.fillStyle = "#2a2440"; g.fillRect(X + s.x * FW - 1, Y + s.y / R.h * FH, 4, 4);
    g.fillStyle = "#ffffff"; g.fillRect(X + s.x * FW - 2, Y + s.y / R.h * FH - 2, 4, 4);
    // The attract's invitation, blinking (steady in Calm) while the demo plays.
    if (v.showPlayer <= 0 && (calm || (Math.floor(v.now * 2) & 1) === 0)) { g.fillStyle = "#2ee6d6"; g.font = "bold 9px monospace"; g.fillText("SPACE TO PLAY", X + 42, Y + 40); }
    v.rallySurface.version++;
  };
  // The test screen at its grid: each square one sample of the picture, then the grid's label. Only when it changes.
  const GRID_LABELS = GRIDS.map(([w, h]) => `${w} x ${h} · ILLUSTRATIVE`);
  // The test screen, a band of rows at a time: rows r0 to r1 of grid `level`, each square one sample of the picture, a
  // bright scan line under the band while the wipe runs, and the grid's label once the last row is in.
  const paintCrtRows = (level, r0, r1) => {
    const g = v.crtCtx, gw = GRIDS[level][0], gh = GRIDS[level][1], sw = 160 / gw, sh = 108 / gh;
    for (let r = r0; r < r1; r++) for (let k = 0; k < gw; k++) { g.fillStyle = CRT_INKS[crtPixel((k + 0.5) / gw, (r + 0.5) / gh)]; g.fillRect(k * sw, r * sh, sw + 0.5, sh + 0.5); }
    if (r1 < gh) { g.fillStyle = "#c8fff6"; g.fillRect(0, r1 * sh, 160, 1.5); }
    else { g.fillStyle = "#000000"; g.fillRect(0, 108, 160, 12); g.fillStyle = "#e9e1cc"; g.font = "9px monospace"; g.textBaseline = "top"; g.fillText(GRID_LABELS[level], 4, 110); }
    v.crtSurface.version++;
  };
  const paintCrt = () => paintCrtRows(v.bbs.crt.level, 0, GRIDS[v.bbs.crt.level][1]);
  const paintPager = () => {
    const g = v.pagerCtx, slot = v.slot;
    g.fillStyle = "#1d2b16"; g.fillRect(0, 0, 192, 64);
    g.fillStyle = "#9dff7a"; g.font = "bold 12px monospace"; g.textBaseline = "top";
    if (v.pager.count) { v.pager.at(0, slot); g.fillText(slot.text, 6, 8); } else g.fillText("NO MESSAGES", 6, 8);
    g.font = "11px monospace"; g.fillText("UNREAD", 6, 40); drawNumber(g, v.pager.unread, 70, 40, 7);
    v.pagerSurface.version++;
  };

  const build = (kit) => {
    const { top, M, createNode, addChild, place, solid, sign, obstacle, prop, notify, cue } = kit;
    const yaw = Math.PI / 2, L = LAYOUT, screens = typeof document !== "undefined";
    const paper = createNewspaper(), keys = createKeyStation(), bbs = createBbs(), pager = createPager(PAGER_TEXTS), triggers = createTriggers(PAGE_SPOTS);
    const rally = createRally(), demo = createRally();
    // `notify` is the hook the notes ask for (a toast); without it the pager's display board and prompt hold its messages.
    v = { notify: notify || null, paper, keys, bbs, pager, triggers, rally, demo, slot: { index: 0, time: 0, text: "" }, showPlayer: 0, screenT: 0, rallyAt: -1, rallyMine: false, rallyScore: -1, paperShown: -1, keysShown: -1,
      modemLamp: null, bbsCtx: null, bbsSurface: null, bbsOnline: -1, crtCtx: null, crtSurface: null, crtShown: -1, pagerShown: -1, now: 0,
      courier: null, courierShown: -1, courierLamps: [], courierOpen: [], courierShut: [],
      // Motion (all preallocated; `update` only writes numbers): the press's cascade of links (`tileWant`, what each page's
      // tile should show, 1 broken; `tileShown`; `tilePop`, a tile's little jump as it turns; `pressClock`, -1 when still),
      // the padlock's shackle easing down or up (`shackleT` 0 open to 1 shut, `shackleTo`), the modem's lamp row and its
      // dial handshake (`modemLeds`, `dialT`), the pager's buzz (`buzzT`, `buzzBase`), the test screen's wipe from one
      // grid to the next (`crtRow`, the rows of the new grid painted; `crtClock`), the cabinet's marquee bulbs and the
      // courier's lamps easing on (`courierGlow`). `cue` is the scene's sound hook (docs: integration requests); null
      // until the kit carries one.
      cue: cue || null, tileWant: new Uint8Array(5), tileShown: new Uint8Array(5), tilePop: new Float32Array(5), pressClock: -1, pressFrom: 0, pressRestored: false,
      shackleT: 0, shackleTo: 0, shackleBaseY: 0, modemLeds: [], dialT: 0, buzzT: 0, buzzNodes: [], buzzBase: new Float32Array(4), pagerReceived: 0,
      crtRow: 0, crtClock: -1, crtLevel: 1, bulbs: [], courierGlow: new Float32Array(3),
      tiles: [], links: [], printedOk: null, printedBad: null, shackleOpen: null, shackleShut: null, pagerLamp: null, rallyCtx: null, rallySurface: null, pagerCtx: null, pagerSurface: null, pagerBody: null, lastX: 0, lastZ: 0, ledsIdle: false };
    const visit = v;
    const node = (geometry, x, y, z, visible = true) => place(createNode({ geometry, position: { x, y, z }, rotation: { x: 0, y: yaw, z: 0 }, visible }));
    // Small parts merged into one mesh in world coordinates: [w, h, d, color, x, y, z, emissive, turn about x, turn
    // about z]. Only
    // trim, keys, art and lamps go here; anything a walker could bump into is a `solid` inside an obstacle.
    const detail = (parts) => {
      if (!M.merge) return null;
      return place(createNode({ geometry: M.merge(...parts.map(([w, h, d, color, x, y, z, emissive = 0, rx = 0, rz = 0]) => {
        const b = M.box({ w, h, d, color, emissive });
        if (rx) M.turnedX(b, rx);
        if (rz) M.turnedZ(b, rz);
        return M.moved(b, x, y, z);
      })), position: { x: 0, y: 0, z: 0 } }));
    };
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
    // The press's finer parts: a timber frame round the link board with a header rail and rivets, a pale card
    // behind each page's tile, a press roller across the stand with its crank, the stand's feet, a printed masthead
    // and columns on the morning paper, and a hooded lamp over the board.
    detail([
      [0.08, 0.1, 2.72, "#4a3a2a", N.x - 0.42, top + 3.02, N.z], [0.08, 0.1, 2.72, "#4a3a2a", N.x - 0.42, top + 0.86, N.z],
      [0.08, 2.26, 0.08, "#4a3a2a", N.x - 0.42, top + 1.94, N.z + 1.32], [0.08, 2.26, 0.08, "#4a3a2a", N.x - 0.42, top + 1.94, N.z - 1.32],
      [0.03, 0.2, 2.4, "#14111f", N.x - 0.42, top + 2.82, N.z], [0.012, 0.05, 1.6, "#e8c35a", N.x - 0.4, top + 2.82, N.z, 0.6],
      ...[0, 1, 2, 3, 4].map((i) => [0.02, 0.48, 0.44, "#e9e1cc", N.x - 0.445, top + 2.3, N.z + 1 - i * 0.5]),
      ...[0, 1, 2, 3, 4].map((i) => [0.022, 0.04, 0.3, "#5a4a3a", N.x - 0.44, top + 2.06, N.z + 1 - i * 0.5]),
      [0.03, 0.62, 0.72, "#14111f", N.x - 0.445, top + 1.3, N.z], [0.02, 0.05, 0.5, "#f2efe6", N.x - 0.43, top + 1.6, N.z, 0.4],
      ...[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b]) => [0.03, 0.03, 0.03, "#c9a35a", N.x - 0.4, top + (b > 0 ? 3.02 : 0.86), N.z + a * 1.28, 0.3]),
      [0.16, 0.16, 2.2, "#2a2a2e", N.x + 0.42, top + 1.0, N.z], [0.18, 0.04, 2.24, "#8a8f96", N.x + 0.42, top + 1.09, N.z],
      [0.04, 0.22, 0.04, "#8a8f96", N.x + 0.42, top + 0.98, N.z + 1.18], [0.12, 0.04, 0.04, "#d82a2a", N.x + 0.48, top + 0.88, N.z + 1.18, 0.3],
      ...[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b]) => [0.16, 0.06, 0.16, "#3a2f25", N.x + a * 0.5, top + 0.03, N.z + b * 1.2]),
      [0.7, 0.012, 0.18, "#1c1c1c", N.x + 0.05, top + 0.947, N.z + 1.0], ...[0, 1, 2].map((k) => [0.18, 0.008, 0.66, "#8a857a", N.x - 0.2 + k * 0.25, top + 0.946, N.z + 0.55]),
      [0.62, 0.008, 0.9, "#b8b1a1", N.x + 0.05, top + 0.932, N.z - 0.65],
      [0.04, 0.5, 0.04, "#2a2a2e", N.x - 0.42, top + 3.3, N.z], [0.3, 0.1, 0.4, "#2a2a2e", N.x - 0.3, top + 3.52, N.z], [0.24, 0.03, 0.32, "#fff2c4", N.x - 0.3, top + 3.46, N.z, 1.2]
    ]);
    // The press's light pool: a teal glow on the floor where the visitor stands, and a soft band along the board's foot.
    detail([[2.2, 0.006, 3.0, "#1d6f73", N.x + 1.5, top + 0.004, N.z, 0.35], [1.8, 0.008, 2.4, "#2ee6d6", N.x + 1.5, top + 0.006, N.z, 0.18],
      [0.02, 0.03, 2.5, "#2ee6d6", N.x - 0.42, top + 0.95, N.z, 0.9]]);
    // Its sign stands clear above the hooded lamp, so nothing covers the board's links.
    sign(ex.newspaper.label, "change a page · EDIT, UNDO, RESET", N.x - 0.3, top + 4.05, N.z, yaw, 0.45);
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
    // The post's finer parts: a domed cap with a ridge, a hinged flap over the letter slot, a framed key plate with a
    // keyhole under the padlock, a hasp, painted bands, a plinth, and a little stack of sealed envelopes on top.
    detail([
      [0.86, 0.06, 1.26, "#2f5d8a", K.x, top + 1.45, K.z], [0.7, 0.05, 1.1, "#3a6ea0", K.x, top + 1.5, K.z], [0.06, 0.04, 1.0, "#c9a64a", K.x, top + 1.545, K.z, 0.3],
      [0.03, 0.1, 0.56, "#24486b", K.x + 0.415, top + 1.12, K.z, 0, 0.25], [0.02, 0.02, 0.6, "#c9a64a", K.x + 0.42, top + 1.18, K.z, 0.3],
      [0.02, 0.4, 0.46, "#1d3a57", K.x + 0.405, top + 0.6, K.z], [0.022, 0.36, 0.42, "#24486b", K.x + 0.41, top + 0.6, K.z],
      [0.024, 0.06, 0.03, "#0b0a12", K.x + 0.42, top + 0.5, K.z], [0.024, 0.05, 0.014, "#0b0a12", K.x + 0.42, top + 0.46, K.z],
      [0.04, 0.08, 0.06, "#8a8f96", K.x + 0.43, top + 0.78, K.z],
      [0.82, 0.04, 1.22, "#f2efe6", K.x, top + 0.24, K.z], [0.82, 0.04, 1.22, "#f2efe6", K.x, top + 1.24, K.z],
      [0.9, 0.08, 1.3, "#1d3a57", K.x, top + 0.04, K.z],
      [0.22, 0.02, 0.32, "#e9e1cc", K.x - 0.1, top + 1.53, K.z - 0.3], [0.2, 0.02, 0.3, "#f6ecd2", K.x - 0.08, top + 1.55, K.z - 0.28], [0.05, 0.022, 0.05, "#d82a2a", K.x - 0.08, top + 1.565, K.z - 0.28, 0.4]
    ]);
    detail([[1.8, 0.006, 2.0, "#1d6f73", K.x + 1.3, top + 0.004, K.z, 0.35], [1.4, 0.008, 1.6, "#2ee6d6", K.x + 1.3, top + 0.006, K.z, 0.16],
      [0.02, 0.36, 0.02, "#2ee6d6", K.x + 0.42, top + 0.62, K.z + 0.24, 0.8], [0.02, 0.36, 0.02, "#2ee6d6", K.x + 0.42, top + 0.62, K.z - 0.24, 0.8]]);
    v.shackleBaseY = v.shackleOpen.position.y;
    sign(ex.keys.label, "lock · sign · check (a toy)", K.x, top + 2.1, K.z, yaw, 0.45);
    const padlock = keyTerminal(keys);
    exhibit("keys", { id: "e3-padlock", year: 1991, connection: "context", title: ex.keys.title, label: ex.keys.label, sourceKeys: ex.keys.sourceKeys,
      date: "1991: when PGP's author says he published it (essay June 1991, updated 1999); the padlock is a teaching model", onUse: () => ({ terminal: padlock }) });

    // The dial-up corner, in the style of the early 1990s (invented, unbranded): a grey laminate desk, a mini-tower
    // standing beside a big rounded CRT whose screen shows the pretend board's menu, a keyboard and a mouse on a pad, an
    // external modem with its row of lamps, and a fan of 3.5-inch disks. Its lit lamp flickers while the call is up.
    const B = L.bbs, T = top + 0.76;
    solid(0.9, 0.04, 1.8, "#b9b4a6", B.x, top + 0.74, B.z);
    solid(0.8, 0.7, 0.45, "#8f8a7e", B.x - 0.02, top + 0.35, B.z - 0.6);
    solid(0.06, 0.7, 0.06, "#55524b", B.x + 0.38, top + 0.35, B.z + 0.84);
    solid(0.06, 0.7, 0.06, "#55524b", B.x - 0.38, top + 0.35, B.z + 0.84);
    solid(0.44, 0.52, 0.22, "#d9d3c4", B.x - 0.1, T + 0.26, B.z + 0.62);
    solid(0.46, 0.4, 0.5, "#cdc6b5", B.x - 0.14, T + 0.22, B.z - 0.05);
    solid(0.3, 0.3, 0.42, "#c4bdac", B.x - 0.3, T + 0.26, B.z - 0.05);
    solid(0.16, 0.05, 0.26, "#2a2a2e", B.x - 0.2, T + 0.025, B.z - 0.62);
    detail([
      [0.03, 0.04, 0.16, "#3a3a3e", B.x + 0.13, T + 0.46, B.z + 0.62], [0.03, 0.03, 0.12, "#2a2a2e", B.x + 0.13, T + 0.38, B.z + 0.62],
      [0.02, 0.02, 0.03, "#5aff9a", B.x + 0.125, T + 0.12, B.z + 0.68, 1.2], [0.02, 0.02, 0.03, "#ffb347", B.x + 0.125, T + 0.12, B.z + 0.61, 1],
      [0.03, 0.05, 0.05, "#b8b1a1", B.x + 0.125, T + 0.2, B.z + 0.53],
      [0.06, 0.34, 0.06, "#d4cdbc", B.x + 0.09, T + 0.22, B.z - 0.28], [0.06, 0.34, 0.06, "#d4cdbc", B.x + 0.09, T + 0.22, B.z + 0.18],
      [0.06, 0.06, 0.52, "#d4cdbc", B.x + 0.09, T + 0.41, B.z - 0.05], [0.06, 0.06, 0.52, "#d4cdbc", B.x + 0.09, T + 0.03, B.z - 0.05],
      [0.2, 0.03, 0.62, "#e2dccd", B.x + 0.3, T + 0.015, B.z - 0.05],
      ...[0, 1, 2, 3].map((r) => [0.035, 0.012, 0.56, r === 3 ? "#bdb6a6" : "#cfc8b8", B.x + 0.23 + r * 0.04, T + 0.036, B.z - 0.05]),
      [0.2, 0.004, 0.22, "#2b7f8a", B.x + 0.3, T + 0.002, B.z + 0.42], [0.09, 0.03, 0.06, "#e2dccd", B.x + 0.3, T + 0.02, B.z + 0.42],
      ...[["#1d3c8a", 0], ["#b3202a", 0.12], ["#1c1c1c", 0.24]].map(([c, dz]) => [0.09, 0.006, 0.09, c, B.x + 0.28, T + 0.004 + dz * 0.05, B.z + 0.7 - dz]),
      [0.03, 0.004, 0.05, "#c9ced4", B.x + 0.28, T + 0.008, B.z + 0.7]
    ]);
    v.modemLamp = node(M.box({ w: 0.02, h: 0.014, d: 0.014, color: "#5aff9a", emissive: 1.4 }), B.x - 0.11, T + 0.032, B.z - 0.52);
    // The modem's row of five lamps, each its own node so they can blink in sequence: dark while the line is down, a
    // running chase while it dials, then sending and receiving in turn while the call is up.
    for (let i = 0; i < 5; i++) v.modemLeds.push(node(M.box({ w: 0.022, h: 0.014, d: 0.016, color: i % 2 ? "#ff5a4a" : "#5aff9a", emissive: 1.4 }), B.x - 0.11, T + 0.032, B.z - 0.72 + i * 0.04));
    detail([[2.0, 0.006, 3.6, "#1d6f73", B.x + 1.3, top + 0.004, B.z, 0.35], [1.6, 0.008, 3.0, "#2ee6d6", B.x + 1.3, top + 0.006, B.z, 0.16],
      [0.22, 0.004, 0.42, "#2ee6d6", B.x - 0.11, T + 0.002, B.z - 0.62, 0.25]]);
    // The test screen: a smaller CRT on a rolling cart beside the desk, its screen the picture on the chosen sample grid,
    // with a card saying the settings are illustrative.
    const CZ = B.z + 1.35, CT = top + 0.72;
    solid(0.6, 0.04, 0.66, "#3a3a42", B.x, CT, CZ);
    solid(0.5, 0.04, 0.56, "#3a3a42", B.x, top + 0.18, CZ);
    solid(0.42, 0.4, 0.46, "#d6d0bf", B.x - 0.03, CT + 0.22, CZ);
    solid(0.24, 0.3, 0.34, "#c9c2b0", B.x - 0.2, CT + 0.2, CZ);
    detail([...[[-0.26, -0.29], [0.26, -0.29], [-0.26, 0.29], [0.26, 0.29]].flatMap(([dx, dz]) => [[0.04, 0.54, 0.04, "#55555e", B.x + dx, top + 0.45, CZ + dz], [0.06, 0.06, 0.06, "#1c1c1c", B.x + dx, top + 0.04, CZ + dz]]),
      [0.03, 0.05, 0.36, "#c9c2b0", B.x + 0.185, CT + 0.03, CZ], [0.012, 0.03, 0.03, "#5aff9a", B.x + 0.195, CT + 0.04, CZ + 0.15, 1],
      [0.03, 0.08, 0.44, "#f2efe6", B.x + 0.31, CT + 0.04, CZ], [0.035, 0.02, 0.36, "#1c1c1c", B.x + 0.31, CT + 0.05, CZ]]);
    if (screens) {
      const c = document.createElement("canvas"); c.width = 160; c.height = 120;
      const geo = screenGeometry(c, 0.34, 0.26);
      v.crtCtx = c.getContext("2d"); v.crtSurface = geo.imageSurface;
      const n = place(createNode({ position: { x: B.x + 0.185, y: CT + 0.24, z: CZ }, rotation: { x: 0, y: yaw, z: 0 } }));
      addChild(n, createNode({ geometry: geo }));
    }
    if (screens) {
      const c = document.createElement("canvas"); c.width = 160; c.height = 120;
      const g = c.getContext("2d");
      g.fillStyle = "#0a1a8a"; g.fillRect(0, 0, 160, 120);
      g.fillStyle = "#5ff"; g.font = "bold 11px monospace"; g.textBaseline = "top"; g.fillText("THE OOGA BOARD", 22, 8);
      g.fillStyle = "#ff5"; g.font = "10px monospace";
      ["[R] READ MESSAGES", "[P] POST A MESSAGE", "[F] FLOPPY FILES", "[G] GOODBYE"].forEach((line, i) => g.fillText(line, 14, 32 + i * 16));
      g.fillStyle = "#fff"; g.fillText("CHOICE? _", 14, 100);
      const geo = screenGeometry(c, 0.38, 0.29);
      v.bbsCtx = g; v.bbsSurface = geo.imageSurface;
      const n = place(createNode({ position: { x: B.x + 0.105, y: T + 0.22, z: B.z - 0.05 }, rotation: { x: 0, y: yaw, z: 0 } }));
      addChild(n, createNode({ geometry: geo }));
    }
    sign(ex.bbs.label, "notes · floppy A: · pretend BBS", B.x, top + 2.25, B.z, yaw, 0.45);
    exhibit("bbs", { id: "e3-bbs", year: 1990, connection: "context", title: ex.bbs.title, label: ex.bbs.label, sourceKeys: ex.bbs.sourceKeys,
      date: "1990–1995 period style; no model, date or specification claimed", onUse: () => ({ terminal: bbs.terminal }) });

    // The pocket pager: a plinth with a big museum replica of a clip-on pager standing on it (a black, rounded slab with
    // a one-line green screen, three buttons and a belt clip), a life-size one on a felt pad, and its messages on a
    // display board behind. Invented and unbranded.
    const P = L.pager, PT = top + 0.9;
    solid(0.7, 0.9, 0.7, "#4d4a56", P.x, top + 0.45, P.z);
    v.pagerBody = solid(0.12, 0.34, 0.5, "#1b1b20", P.x + 0.1, PT + 0.2, P.z);
    detail([
      [0.12, 0.04, 0.46, "#2a2a31", P.x + 0.1, PT + 0.39, P.z], [0.12, 0.3, 0.04, "#2a2a31", P.x + 0.1, PT + 0.2, P.z + 0.25], [0.12, 0.3, 0.04, "#2a2a31", P.x + 0.1, PT + 0.2, P.z - 0.25],
      [0.02, 0.1, 0.32, "#0f1a0c", P.x + 0.165, PT + 0.27, P.z + 0.03],
      ...[-0.12, 0, 0.12].map((dz) => [0.03, 0.05, 0.07, "#6b6b78", P.x + 0.17, PT + 0.1, P.z + dz]),
      [0.04, 0.24, 0.16, "#3a3a44", P.x + 0.02, PT + 0.22, P.z],
      [0.3, 0.01, 0.3, "#5a1f2e", P.x + 0.12, PT + 0.005, P.z - 0.3 + 0.55],
      [0.05, 0.016, 0.08, "#1b1b20", P.x + 0.12, PT + 0.018, P.z + 0.25], [0.004, 0.006, 0.05, "#9dff7a", P.x + 0.145, PT + 0.028, P.z + 0.25, 0.8]
    ]);
    v.pagerLamp = node(M.box({ w: 0.012, h: 0.07, d: 0.28, color: "#9dff7a", emissive: 1 }), P.x + 0.17, PT + 0.27, P.z + 0.03);
    // What buzzes when a message arrives: the replica's body and its screen lamp shake a little along the plinth.
    v.buzzNodes.push(v.pagerBody, v.pagerLamp);
    for (let i = 0; i < v.buzzNodes.length; i++) v.buzzBase[i] = v.buzzNodes[i].position.z;
    detail([[1.6, 0.006, 1.8, "#1d6f73", P.x + 1.1, top + 0.004, P.z, 0.35], [1.2, 0.008, 1.4, "#2ee6d6", P.x + 1.1, top + 0.006, P.z, 0.16],
      [0.74, 0.02, 0.74, "#2ee6d6", P.x, top + 0.905, P.z, 0.5]]);
    solid(0.08, 0.6, 0.08, "#3b2a1a", P.x - 0.3, top + 1.2, P.z);
    if (screens) {
      const c = document.createElement("canvas"); c.width = 192; c.height = 64;
      const geo = screenGeometry(c, 0.96, 0.32);
      v.pagerCtx = c.getContext("2d"); v.pagerSurface = geo.imageSurface;
      const n = place(createNode({ position: { x: P.x - 0.3, y: top + 1.7, z: P.z }, rotation: { x: 0, y: yaw, z: 0 } }));
      addChild(n, createNode({ geometry: geo }));
      paintPager();
    }
    sign(ex.pager.label, "your messages", P.x - 0.3, top + 2.3, P.z, yaw, 0.4);
    const pagerTerm = pagerTerminal(pager, triggers, () => visit.now);
    exhibit("pager", { id: "e3-pager", year: 1990, connection: "context", title: ex.pager.title, label: ex.pager.label, sourceKeys: ex.pager.sourceKeys,
      date: "1990–1995 period style; no model, date or specification claimed", onUse: () => ({ terminal: pagerTerm }) });

    // Tick-Tock Rally: an invented upright cabinet of the period, its sides painted with original zigzag art and edged
    // in glowing trim, a lit marquee with speaker grilles under it, a coin door with two lit slots, and a stick and three
    // buttons on its panel. Its screen plays a demo, or the visitor's game for a while after a move.
    const C = L.rally;
    solid(1, 1.9, 1.1, "#3a2a5c", C.x, top + 0.95, C.z);
    solid(0.5, 0.35, 1.1, "#2a1f44", C.x + 0.5, top + 1.05, C.z);
    solid(0.08, 0.3, 0.9, "#ffcf7a", C.x + 0.44, top + 2.05, C.z, 1.2);
    detail([
      ...[1, -1].flatMap((sd) => [
        [0.9, 0.04, 0.012, "#2ee6d6", C.x, top + 1.9, C.z + sd * 0.556, 1], [0.04, 1.86, 0.012, "#2ee6d6", C.x + 0.48, top + 0.95, C.z + sd * 0.556, 1],
        ...[0, 1, 2, 3].map((i) => [0.5, 0.06, 0.012, i % 2 ? "#ff4fd8" : "#ffd25f", C.x - 0.1, top + 0.45 + i * 0.32, C.z + sd * 0.556, 0.4, 0, 0.5]),
        [0.18, 0.18, 0.012, "#2ee6d6", C.x - 0.25, top + 1.62, C.z + sd * 0.556, 0.5]]),
      [0.012, 0.12, 0.3, "#16121f", C.x + 0.505, top + 1.82, C.z + 0.28], [0.012, 0.12, 0.3, "#16121f", C.x + 0.505, top + 1.82, C.z - 0.28],
      [0.012, 0.42, 0.5, "#1c1628", C.x + 0.505, top + 0.42, C.z], [0.014, 0.08, 0.03, "#ff8c3a", C.x + 0.512, top + 0.52, C.z + 0.1, 1.2], [0.014, 0.08, 0.03, "#ff8c3a", C.x + 0.512, top + 0.52, C.z - 0.1, 1.2],
      [0.04, 0.16, 0.04, "#1a1a1a", C.x + 0.58, top + 1.3, C.z + 0.22], [0.08, 0.08, 0.08, "#d82a2a", C.x + 0.58, top + 1.4, C.z + 0.22, 0.4],
      ...[0, 1, 2].map((i) => [0.07, 0.03, 0.07, ["#ffd25f", "#2ee6d6", "#ff4fd8"][i], C.x + 0.62, top + 1.24, C.z - 0.05 - i * 0.12, 0.8]),
      [0.012, 0.06, 1.1, "#16121f", C.x + 0.505, top + 0.04, C.z],
      // A bezel round the screen, a row of marquee bulbs, and a coin-return cup and kick plate.
      [0.02, 0.06, 0.92, "#1c1628", C.x + 0.51, top + 1.93, C.z], [0.02, 0.06, 0.92, "#1c1628", C.x + 0.51, top + 1.27, C.z],
      [0.02, 0.66, 0.06, "#1c1628", C.x + 0.51, top + 1.6, C.z + 0.45], [0.02, 0.66, 0.06, "#1c1628", C.x + 0.51, top + 1.6, C.z - 0.45],
      [0.03, 0.05, 0.08, "#0b0a12", C.x + 0.515, top + 0.3, C.z], [0.02, 0.1, 0.9, "#2ee6d6", C.x + 0.51, top + 0.12, C.z, 0.5]
    ]);
    if (screens) {
      const c = document.createElement("canvas"); c.width = 160; c.height = 120;
      const geo = screenGeometry(c, 0.8, 0.6);
      v.rallyCtx = c.getContext("2d"); v.rallySurface = geo.imageSurface;
      const n = place(createNode({ position: { x: C.x + 0.515, y: top + 1.6, z: C.z }, rotation: { x: 0, y: yaw, z: 0 } }));
      addChild(n, createNode({ geometry: geo }));
    }
    // The marquee's seven bulbs, each its own node so the attract can chase light along them (steady in Calm).
    for (let i = 0; i < 7; i++) v.bulbs.push(node(M.box({ w: 0.03, h: 0.03, d: 0.03, color: i % 2 ? "#ff4fd8" : "#ffd25f", emissive: 1.1 }), C.x + 0.49, top + 2.22, C.z - 0.39 + i * 0.13));
    detail([[2.2, 0.006, 2.2, "#1d6f73", C.x + 1.5, top + 0.004, C.z, 0.35], [1.8, 0.008, 1.8, "#2ee6d6", C.x + 1.5, top + 0.006, C.z, 0.16],
      [0.6, 0.006, 1.0, "#ff4fd8", C.x + 0.9, top + 0.008, C.z, 0.2]]);
    sign(ex.rally.label, "an original game", C.x + 0.3, top + 2.65, C.z, yaw, 0.4);
    const rallyTerm = rallyTerminal(rally, () => { visit.showPlayer = 30; });
    exhibit("rally", { id: "e3-rally", year: 1990, connection: "context", title: ex.rally.title, label: ex.rally.label, sourceKeys: ex.rally.sourceKeys,
      date: "1990–1995 period style; the game is original to the voyage", onUse: () => ({ terminal: rallyTerm }) });
    decorate(kit, detail);

    // The padlock courier (a modern toy, added after the cave's own pieces so their order stays): a timber rack of three
    // cubbies, each with one friend's padlock in their colour, open until a note is snapped shut in it, a lamp over the
    // cubby holding the note, an out-tray, and its console game's card. Space here plays Padlock Courier.
    const Q = L.courier, courier = createCourier();
    v.courier = courier;
    solid(0.9, 1.7, 1.7, "#5c4430", Q.x, top + 0.85, Q.z);
    solid(0.5, 0.1, 1.76, "#4a3624", Q.x + 0.2, top + 1.75, Q.z);
    for (let i = 0; i < FRIENDS.length; i++) {
      const z = Q.z + 0.52 - i * 0.52, ink = FRIENDS[i].ink;
      solid(0.12, 0.2, 0.2, ink, Q.x + 0.48, top + 1.0, z);
      v.courierOpen.push(node(M.box({ w: 0.04, h: 0.16, d: 0.14, color: "#d6dbe0" }), Q.x + 0.48, top + 1.2, z));
      v.courierShut.push(node(M.box({ w: 0.04, h: 0.1, d: 0.14, color: "#d6dbe0" }), Q.x + 0.48, top + 1.15, z, false));
      v.courierLamps.push(node(M.box({ w: 0.04, h: 0.06, d: 0.3, color: ink, emissive: 1.3 }), Q.x + 0.46, top + 1.62, z, false));
    }
    detail([
      ...[0, 1, 2].flatMap((i) => { const z = Q.z + 0.52 - i * 0.52; return [[0.02, 0.36, 0.42, "#1c140d", Q.x + 0.455, top + 1.32, z], [0.03, 0.12, 0.3, "#e9e1cc", Q.x + 0.44, top + 1.26, z],
        [0.02, 0.12, 0.42, "#3a2a1c", Q.x + 0.46, top + 0.66, z], [0.022, 0.04, 0.04, "#0b0a12", Q.x + 0.545, top + 0.96, z], [0.024, 0.04, 0.24, FRIENDS[i].ink, Q.x + 0.46, top + 1.54, z, 0.5]]; }),
      ...[-0.78, -0.26, 0.26, 0.78].map((dz) => [0.04, 1.6, 0.04, "#3a2a1c", Q.x + 0.46, top + 0.85, Q.z + dz]),
      [0.04, 0.04, 1.64, "#3a2a1c", Q.x + 0.46, top + 1.52, Q.z], [0.04, 0.04, 1.64, "#3a2a1c", Q.x + 0.46, top + 0.8, Q.z],
      [0.9, 0.08, 1.74, "#3a2a1c", Q.x, top + 0.04, Q.z], [0.3, 0.06, 0.5, "#8a6440", Q.x + 0.2, top + 1.83, Q.z - 0.5], [0.24, 0.03, 0.34, "#f6ecd2", Q.x + 0.2, top + 1.87, Q.z - 0.5],
      [0.02, 0.3, 0.4, "#0b0a12", Q.x + 0.455, top + 0.35, Q.z + 0.4], [0.022, 0.26, 0.36, "#1a1446", Q.x + 0.46, top + 0.35, Q.z + 0.4, 0.4],
      ...[["#5ec8ff", -0.08], ["#ffd23a", 0], ["#c8ff5a", 0.08]].map(([c, dy]) => [0.024, 0.04, 0.22, c, Q.x + 0.47, top + 0.35 + dy, Q.z + 0.4, 0.9])
    ]);
    detail([[2.0, 0.006, 2.4, "#1d6f73", Q.x + 1.4, top + 0.004, Q.z, 0.35], [1.6, 0.008, 2.0, "#2ee6d6", Q.x + 1.4, top + 0.006, Q.z, 0.16]]);
    sign(ex.courier.label, "three open padlocks · a modern toy", Q.x + 0.2, top + 2.35, Q.z, yaw, 0.4);
    const courierTerm = courierTerminal(courier);
    exhibit("courier", { id: "e3-courier", year: 1990, connection: "context", title: ex.courier.title, label: ex.courier.label, sourceKeys: ex.courier.sourceKeys,
      hint: "Type SEND BEA hello, then TRY TOCK; Space plays the game",
      date: "No historical date: a modern explanatory toy shown in the 1990–1995 gallery", onUse: () => ({ terminal: courierTerm }) });
  };

  // --- Set dressing ---------------------------------------------------------------------------------------------------
  // The cave's back wall, dressed as a room of the early 1990s: a games nook, a tall shelf, an office corner, a lounge,
  // a water cooler and a pinboard, crates with a portable stereo, a floor lamp and plants; above them, original
  // posters, a band of geometric wall art up to about 7.5 m and two glowing tubes in teal and magenta. All invented and
  // unbranded, saying nothing and claiming nothing: no words, dates or devices that stand for real products. Each
  // group stands on one obstacle, at least 2.5 m from the next and from the exhibits, behind the exhibits (x -33 to
  // -28.4), so the stream, its walk and the views from it to the exhibits' signs and the overview board stay open.
  // Nothing in it moves, so Calm has nothing to hold.
  const WALL = -33.94;
  const decorate = (kit, detail) => {
    const { top, solid, obstacle } = kit, y = (h) => top + h;
    const group = (z0, z1, x1, solids) => { obstacle(-33, x1, z0, z1); for (const b of solids) solid(...b); };
    // Games nook: a low cabinet with a big CRT television and a grey games console (no maker, no name), two pads and a
    // magenta beanbag on a teal rug.
    group(-343, -336.5, -28.4, [[0.8, 0.55, 1.6, "#5b3a2a", -32.4, y(0.275), -340], [0.7, 0.62, 0.8, "#2b2b30", -32.4, y(0.86), -340.25],
      [0.3, 0.07, 0.4, "#9a9aa2", -32.2, y(0.585), -339.5], [1.1, 0.5, 1.1, "#c2185b", -29.2, y(0.25), -339.6]]);
    detail([[0.02, 0.44, 0.58, "#22357a", -32.04, y(0.88), -340.25, 0.7], [0.02, 0.06, 0.58, "#3a3a40", -32.04, y(0.61), -340.25],
      [0.04, 0.012, 0.18, "#4a4a52", -32.2, y(0.625), -339.5], ...[["#d82a2a", -0.08], ["#2a6bd8", 0], ["#2ad86b", 0.08]].map(([c, dz]) => [0.03, 0.012, 0.03, c, -32.1, y(0.625), -339.4 + dz, 0.5]),
      [0.12, 0.03, 0.2, "#7d7d86", -29.6, y(0.515), -339.9], [0.12, 0.03, 0.2, "#7d7d86", -29.4, y(0.515), -339.2],
      [3.6, 0.01, 4.2, "#1f8c8c", -30.6, y(0.005), -339.8], [3.2, 0.012, 0.2, "#ffd25f", -30.6, y(0.008), -338.1], [3.2, 0.012, 0.2, "#ffd25f", -30.6, y(0.008), -341.5]]);
    // A tall shelf, 4.6 m: boxes of 3.5-inch disks, ring binders, a stack of plain jewel cases, a portable stereo and a
    // plant, with a rolling ladder leaning on it.
    group(-334, -329, -31.4, [[0.1, 4.6, 4.4, "#6b4a2b", -32.9, y(2.3), -331.5], [0.8, 4.6, 0.08, "#6b4a2b", -32.5, y(2.3), -333.66], [0.8, 4.6, 0.08, "#6b4a2b", -32.5, y(2.3), -329.34],
      ...[0.05, 1.05, 2.05, 3.05, 4.05].map((h) => [0.8, 0.06, 4.3, "#7d573a", -32.5, y(h), -331.5])]);
    const shelf = [];
    const inks = ["#d82a2a", "#2a6bd8", "#ffd25f", "#2ad86b", "#ff4fd8", "#1c1c1c"];
    for (let row = 0; row < 4; row++) for (let i = 0; i < 9; i++) {
      const h = row + 0.08, kind = (i + row * 2) % 4, z = -333.3 + i * 0.47;
      if (kind === 0) shelf.push([0.4, 0.22, 0.32, inks[(i + row) % 6], -32.55, y(h + 0.11), z]);
      else if (kind === 1) for (let k = 0; k < 4; k++) shelf.push([0.36, 0.42, 0.06, inks[(k + i) % 6], -32.55, y(h + 0.21), z - 0.12 + k * 0.08]);
      else if (kind === 2) shelf.push([0.3, 0.3, 0.3, "#d9d3c4", -32.55, y(h + 0.15), z]);
      else shelf.push([0.22, 0.04, 0.3, "#c9ced4", -32.55, y(h + 0.02), z], [0.22, 0.04, 0.3, "#9fd6ea", -32.55, y(h + 0.06), z]);
    }
    shelf.push([0.3, 0.32, 0.9, "#b8bcc2", -32.5, y(4.24), -332.2], [0.02, 0.24, 0.24, "#2a2a2e", -32.34, y(4.24), -332.5], [0.02, 0.24, 0.24, "#2a2a2e", -32.34, y(4.24), -331.9],
      [0.02, 0.08, 0.2, "#1c1c1c", -32.34, y(4.3), -332.2], [0.04, 0.04, 0.6, "#8a8f96", -32.5, y(4.43), -332.2],
      [0.3, 0.3, 0.3, "#b5651d", -32.5, y(4.23), -330.6], [0.5, 0.5, 0.5, "#2f8a4f", -32.5, y(4.6), -330.6],
      [0.06, 4.2, 0.06, "#8a6440", -31.7, y(2.1), -332.6, 0, 0, 0.12], [0.06, 4.2, 0.06, "#8a6440", -31.7, y(2.1), -332.0, 0, 0, 0.12],
      ...[0.6, 1.4, 2.2, 3, 3.8].map((h) => [0.05, 0.05, 0.6, "#8a6440", -31.62 - h * 0.06, y(h), -332.3]));
    detail(shelf);
    // The office corner: a grey desk with a drawer pedestal, an office chair, a filing cabinet, a hinged desk lamp, a
    // corded telephone and an answering machine, and a wall clock above.
    group(-326.5, -319, -30.9, [[1, 0.06, 2.2, "#c9c2b0", -32.3, y(0.75), -322.8], [0.9, 0.72, 0.5, "#9c968a", -32.3, y(0.36), -321.9],
      [0.06, 0.72, 0.06, "#55524b", -31.85, y(0.36), -323.8], [0.06, 0.72, 0.06, "#55524b", -32.75, y(0.36), -323.8],
      [0.6, 1.3, 0.5, "#8d8f94", -32.6, y(0.65), -325.6], [0.5, 0.08, 0.5, "#2f4b7c", -31.3, y(0.5), -322.8], [0.08, 0.6, 0.5, "#2f4b7c", -31.05, y(0.9), -322.8],
      [0.06, 0.46, 0.06, "#2a2a2e", -31.3, y(0.23), -322.8]]);
    detail([...[0.3, 0.65, 1].map((h) => [0.02, 0.04, 0.2, "#c9ced4", -32.29, y(h), -325.6]),
      [0.18, 0.03, 0.18, "#2a2a2e", -32.6, y(0.795), -323.6], [0.03, 0.4, 0.03, "#2a2a2e", -32.55, y(0.99), -323.55, 0, 0.3], [0.03, 0.3, 0.03, "#2a2a2e", -32.45, y(1.25), -323.4, 0, -0.8],
      [0.2, 0.12, 0.22, "#c2185b", -32.35, y(1.22), -323.25], [0.12, 0.02, 0.14, "#fff2c4", -32.35, y(1.155), -323.25, 1.3],
      [0.2, 0.06, 0.24, "#e2dccd", -32.4, y(0.81), -322.2], [0.06, 0.05, 0.22, "#e2dccd", -32.4, y(0.865), -322.2], [0.02, 0.02, 0.2, "#8a857a", -32.32, y(0.79), -322.0],
      [0.18, 0.05, 0.26, "#1c1c1c", -32.45, y(0.805), -321.7], [0.01, 0.02, 0.06, "#ff3b30", -32.36, y(0.82), -321.62, 1.2],
      [0.04, 0.5, 0.5, "#f2efe6", WALL, y(2.3), -322.8], [0.03, 0.04, 0.18, "#1c1c1c", WALL + 0.03, y(2.36), -322.8], [0.03, 0.14, 0.04, "#1c1c1c", WALL + 0.03, y(2.26), -322.76]]);
    // The lounge: a teal sofa, a black coffee table with a pile of blank magazines, and a lamp of slow, warm blobs on a
    // side table (still: it never moves).
    group(-316.5, -310.5, -30.1, [[0.9, 0.42, 2.4, "#3f7f7a", -32.4, y(0.21), -313.5], [0.25, 0.5, 2.4, "#356b67", -32.85, y(0.67), -313.5],
      [0.9, 0.3, 0.2, "#356b67", -32.4, y(0.57), -314.6], [0.9, 0.3, 0.2, "#356b67", -32.4, y(0.57), -312.4],
      [0.6, 0.4, 1.2, "#202024", -30.6, y(0.2), -313.5], [0.4, 0.5, 0.4, "#5b3a2a", -32.6, y(0.25), -315.8]]);
    detail([[0.24, 0.02, 0.32, "#ffd25f", -30.6, y(0.41), -313.7], [0.22, 0.02, 0.3, "#2ee6d6", -30.62, y(0.43), -313.6], [0.2, 0.02, 0.28, "#ff4fd8", -30.58, y(0.45), -313.4],
      [0.1, 0.06, 0.1, "#c9ced4", -32.6, y(0.53), -315.8], [0.08, 0.32, 0.08, "#ff4fd8", -32.6, y(0.72), -315.8, 0.7], [0.05, 0.08, 0.05, "#ffd25f", -32.6, y(0.68), -315.8, 1],
      [0.05, 0.06, 0.05, "#ffd25f", -32.6, y(0.8), -315.8, 1], [0.1, 0.06, 0.1, "#c9ced4", -32.6, y(0.91), -315.8]]);
    // A water cooler and a potted plant, with a pinboard of blank notes on the wall between them.
    group(-307.5, -301.5, -31.9, [[0.4, 1.2, 0.4, "#e8e6df", -32.6, y(0.6), -306.6], [0.5, 0.5, 0.5, "#b5651d", -32.5, y(0.25), -302.4]]);
    detail([[0.3, 0.4, 0.3, "#7fc8ff", -32.6, y(1.4), -306.6, 0.3], [0.02, 0.06, 0.04, "#3a6bd8", -32.39, y(0.9), -306.6],
      [0.5, 0.6, 0.5, "#2f8a4f", -32.5, y(0.8), -302.4], [0.3, 0.5, 0.3, "#3fa862", -32.45, y(1.25), -302.3],
      [0.04, 1.1, 1.8, "#a0703f", WALL, y(1.8), -304.5], [0.05, 1.0, 1.7, "#c89a63", WALL + 0.01, y(1.8), -304.5],
      ...[[-0.5, 0.25, "#fff59d"], [0, 0.3, "#ffffff"], [0.5, 0.2, "#ffcce8"], [-0.3, -0.25, "#b3f0ff"], [0.35, -0.2, "#fff59d"]].map(([dz, dy, c]) => [0.02, 0.24, 0.3, c, WALL + 0.04, y(1.8 + dy), -304.5 + dz])]);
    // Crates with a portable stereo on top and a skateboard leaning on the wall.
    group(-298.5, -292.5, -31.6, [[0.6, 0.6, 0.6, "#8a6440", -32.5, y(0.3), -296.2], [0.6, 0.6, 0.6, "#7a5534", -32.5, y(0.9), -296.2], [0.6, 0.6, 0.6, "#8a6440", -32.5, y(0.3), -295.4]]);
    detail([[0.24, 0.3, 0.62, "#2a2a2e", -32.5, y(1.35), -296.2], [0.02, 0.2, 0.2, "#5a5a62", -32.37, y(1.33), -296.42], [0.02, 0.2, 0.2, "#5a5a62", -32.37, y(1.33), -295.98],
      [0.02, 0.06, 0.12, "#9fd6ea", -32.37, y(1.42), -296.2, 0.4], [0.04, 0.04, 0.5, "#8a8f96", -32.5, y(1.53), -296.2],
      [0.06, 0.04, 0.9, "#ff4fd8", -33.6, y(0.5), -294.2, 0, 1.2], [0.08, 0.06, 0.06, "#ffd25f", -33.55, y(0.12), -293.9], [0.08, 0.06, 0.06, "#ffd25f", -33.7, y(0.86), -294.5]]);
    // A floor lamp with a warm shade and a tall plant by the way in.
    group(-289.5, -285, -31.8, [[0.08, 1.8, 0.08, "#2a2a2e", -32.4, y(0.9), -287], [0.4, 0.06, 0.4, "#2a2a2e", -32.4, y(0.03), -287], [0.45, 0.45, 0.45, "#2f6b4f", -32.4, y(0.22), -288.8]]);
    detail([[0.36, 0.3, 0.36, "#ffcf7a", -32.4, y(1.95), -287, 1.2], [0.5, 0.9, 0.5, "#2f8a4f", -32.4, y(0.9), -288.8], [0.3, 0.7, 0.3, "#3fa862", -32.35, y(1.5), -288.7]]);
    // On the wall: six original posters (shapes and colour only), a band of geometric art from 4.3 m to 7.5 m, and two
    // glowing tubes along it.
    const art = [];
    const poster = (z, base, shapes) => { art.push([0.03, 1.6, 1.15, "#f2efe6", WALL, y(2.6), z], [0.035, 1.5, 1.05, base, WALL + 0.005, y(2.6), z]); for (const [w, h, dy, dz, c, e = 0, rx = 0] of shapes) art.push([0.04, h, w, c, WALL + 0.01, y(2.6 + dy), z + dz, e, rx]); };
    poster(-337.2, "#1a1446", [[0.9, 0.3, -0.3, 0, "#ff4fd8"], [0.9, 0.2, -0.05, 0, "#ff8c3a"], [0.9, 0.15, 0.13, 0, "#ffd25f"], [0.4, 0.4, 0.4, 0, "#ffd25f", 0.5]]);
    poster(-327.5, "#2ee6d6", [[0.8, 0.08, 0.3, 0, "#1c1c1c", 0, 0.6], [0.8, 0.08, -0.1, 0, "#ff4fd8", 0, -0.6], [0.12, 0.12, 0.45, 0.3, "#ffd25f"], [0.12, 0.12, -0.45, -0.3, "#1c1c1c"]]);
    poster(-317.8, "#0b0a12", [[0.5, 0.5, 0.1, 0, "#ff8c3a"], [0.8, 0.04, 0.1, 0, "#ffd25f", 0.5], [0.05, 0.05, 0.6, -0.4, "#ffffff", 1], [0.05, 0.05, -0.5, 0.35, "#ffffff", 1], [0.05, 0.05, 0.45, 0.4, "#ffffff", 1]]);
    poster(-309.5, "#ffd25f", [[0.3, 0.3, 0.35, -0.25, "#2a6bd8"], [0.3, 0.3, -0.1, 0.2, "#d82a2a"], [0.3, 0.3, -0.5, -0.2, "#2ad86b"], [0.9, 0.06, 0.05, 0, "#1c1c1c", 0, 0.35]]);
    poster(-299.5, "#ff4fd8", [[0.7, 0.7, 0, 0, "#1a1446"], [0.4, 0.4, 0, 0, "#2ee6d6"], [0.15, 0.15, 0, 0, "#ffd25f"]]);
    poster(-290.5, "#1f8c8c", [[0.9, 0.1, 0.45, 0, "#ffd25f"], [0.9, 0.1, 0.15, 0, "#ff4fd8"], [0.9, 0.1, -0.15, 0, "#ffd25f"], [0.9, 0.1, -0.45, 0, "#ff4fd8"]]);
    const bandZ0 = -343, bandZ1 = -285, cols = ["#1a1446", "#2ee6d6", "#ff4fd8", "#ffd25f", "#2a6bd8"];
    art.push([0.03, 3.2, bandZ1 - bandZ0, "#14111f", WALL, y(5.9), (bandZ0 + bandZ1) / 2]);
    for (let i = 0, z = bandZ0 + 1.5; z < bandZ1 - 1; i++, z += 2.9) {
      art.push([0.04, 0.12, 1.6, cols[(i + 1) % 5], WALL + 0.01, y(5.9 + ((i % 3) - 1) * 0.6), z, 0.3, i % 2 ? 0.7 : -0.7]);
      art.push([0.04, 0.5, 0.5, cols[(i + 3) % 5], WALL + 0.01, y(i % 2 ? 6.9 : 4.9), z + 1.1, 0.2, 0.785]);
      for (let k = 0; k < 3; k++) art.push([0.04, 0.12, 0.12, cols[(i + k) % 5], WALL + 0.01, y(5 + k * 0.9), z - 0.9 + k * 0.4, 0.4]);
    }
    art.push([0.05, 0.07, bandZ1 - bandZ0, "#2ee6d6", WALL + 0.02, y(4.25), (bandZ0 + bandZ1) / 2, 1.4], [0.05, 0.07, bandZ1 - bandZ0, "#ff4fd8", WALL + 0.02, y(7.55), (bandZ0 + bandZ1) / 2, 1.4]);
    detail(art);
  };

  // Per frame while the visitor is in this cave, allocation-free: the pager (held while a panel or prompt is open, when
  // the scene says so with `state.reading`), the press's and the padlock's models following their state, and the
  // cabinet's screen (a demo, or the visitor's game for 30 s after their last move). In Calm (`state.calm`) the pager's
  // lamp holds steady and the self-playing demo holds still; the screen repaints only when what it shows changes.
  // The motion's timings (seconds): a link turning in the press's cascade, a turned tile's jump, the shackle's travel,
  // the modem's dial handshake, the pager's buzz and the test screen's wipe from one grid to the next.
  const CASCADE = 0.12, POP = 0.22, SHACKLE = 0.22, DIAL = 1.6, BUZZ = 0.6, WIPE = 0.45;
  const ease = (t) => t * t * (3 - 2 * t);
  const cueOf = (name) => { if (v.cue) v.cue(name); };
  // Page i's tile (and the link after it) shows broken or whole.
  const showTile = (i, bad) => {
    v.tileShown[i] = bad; v.tiles[i].ok.visible = !bad; v.tiles[i].bad.visible = !!bad;
    if (i < v.links.length) { v.links[i].ok.visible = !bad; v.links[i].bad.visible = !!bad; }
  };
  // Per frame while the visitor is in this cave, allocation-free (every buffer above is the visit's own): the pager
  // (held while a panel or prompt is open, `state.reading`), then each exhibit's motion, which runs only while it has
  // somewhere to go. The press's links turn one after another from the changed page (a clack as it starts, a chime
  // when every link holds again), the padlock's shackle eases shut (a click), the modem dials with a running chase and
  // then blinks sending and receiving in turn, the pager buzzes and lights when a message arrives (a beep), the test
  // screen wipes down to its next grid (a click), the courier's lamps ease on, and the cabinet's marquee chases its
  // attract. Calm (`state.calm`) shows every end state at once and holds the blinking steady; a pause, the workbench,
  // menu or console elsewhere simply don't call this, so everything waits where it is; `active(false)` settles it.
  const update = (dt, elapsed, state) => {
    const calm = !!state.calm;
    v.lastX = state.x; v.lastZ = state.z;
    const fired = v.triggers.update(state.x, state.z, !!state.reading);
    v.now = elapsed;
    if (fired >= 0) { v.pager.receive(fired, elapsed); if (v.notify) v.notify(PAGER_TOASTS[fired]); }
    if (v.pager.version !== v.pagerShown) { v.pagerShown = v.pager.version; if (v.pagerCtx) paintPager(); }
    // The test screen: a new grid starts a wipe from the top.
    if (v.bbs.crt.version !== v.crtShown) {
      v.crtShown = v.bbs.crt.version;
      if (v.crtCtx) { v.crtLevel = v.bbs.crt.level; v.crtRow = 0; v.crtClock = 0; if (v.crtSurface.version > 0) cueOf("click"); }
    }
    if (v.crtClock >= 0) {
      v.crtClock = calm ? WIPE : v.crtClock + dt;
      const gh = GRIDS[v.crtLevel][1], to = Math.min(gh, Math.ceil(gh * Math.min(1, v.crtClock / WIPE)));
      if (to > v.crtRow || to === gh) { paintCrtRows(v.crtLevel, v.crtRow, to); v.crtRow = to; }
      if (to >= gh) v.crtClock = -1;
    }
    // The press: what each tile should show, and from which page the cascade starts.
    if (v.paper.version !== v.paperShown) {
      v.paperShown = v.paper.version;
      const r = v.paper.result;
      let from = -1;
      for (let i = 0; i < v.tiles.length; i++) { const want = r.first >= 0 && i >= r.first ? 1 : 0; v.tileWant[i] = want; if (from < 0 && want !== v.tileShown[i]) from = i; }
      if (from >= 0 || v.printedBad.visible === r.matches) { v.pressClock = 0; v.pressFrom = from < 0 ? 0 : from; v.pressRestored = r.matches; cueOf("clack"); }
    }
    if (v.pressClock >= 0) {
      v.pressClock = calm ? 1e9 : v.pressClock + dt;
      let done = true;
      for (let i = 0; i < v.tiles.length; i++) {
        if (v.tileShown[i] === v.tileWant[i]) continue;
        if (v.pressClock >= (i - v.pressFrom) * CASCADE) { showTile(i, v.tileWant[i]); v.tilePop[i] = calm ? 0 : POP; } else done = false;
      }
      if (done) {
        const r = v.paper.result;
        v.printedOk.visible = r.matches; v.printedBad.visible = !r.matches; v.pressClock = -1;
        if (r.matches && v.pressRestored) cueOf("chime");
      }
    }
    for (let i = 0; i < v.tiles.length; i++) {
      if (v.tilePop[i] <= 0) continue;
      v.tilePop[i] = calm ? 0 : Math.max(0, v.tilePop[i] - dt);
      const k = 1 + Math.sin(v.tilePop[i] / POP * Math.PI) * 0.22;
      v.tiles[i].ok.scale.y = v.tiles[i].ok.scale.z = v.tiles[i].bad.scale.y = v.tiles[i].bad.scale.z = k;
    }
    // The courier's rack: the shut padlock's lamp eases on, the others' off.
    if (v.courier.version !== v.courierShown) {
      v.courierShown = v.courier.version;
      for (let i = 0; i < v.courierLamps.length; i++) { const shut = v.courier.slot === i; v.courierShut[i].visible = shut; v.courierOpen[i].visible = !shut; }
      if (v.courier.slot >= 0) cueOf("click");
    }
    for (let i = 0; i < v.courierLamps.length; i++) {
      const want = v.courier.slot === i ? 1 : 0, g0 = v.courierGlow[i];
      if (g0 === want) continue;
      const g1 = calm ? want : want > g0 ? Math.min(1, g0 + dt * 4) : Math.max(0, g0 - dt * 4);
      v.courierGlow[i] = g1; v.courierLamps[i].visible = g1 > 0.02; v.courierLamps[i].glow = 0.2 + ease(g1) * 1.1;
    }
    // The padlock: the shackle eases down onto the post, then shows shut.
    if (v.keys.version !== v.keysShown) { v.keysShown = v.keys.version; v.shackleTo = v.keys.locked ? 1 : 0; }
    if (v.shackleT !== v.shackleTo) {
      v.shackleT = calm ? v.shackleTo : v.shackleTo > v.shackleT ? Math.min(1, v.shackleT + dt / SHACKLE) : Math.max(0, v.shackleT - dt / SHACKLE);
      const shut = v.shackleT >= 1;
      v.shackleShut.visible = shut; v.shackleOpen.visible = !shut; v.shackleOpen.position.y = v.shackleBaseY - ease(v.shackleT) * 0.06;
      if (shut) cueOf("click");
    }
    // The modem: dark with the line down, a chase while it dials, then its lamps blink in sequence (steady in Calm).
    const on = v.bbs.online ? 1 : 0;
    if (on !== v.bbsOnline) {
      if (v.bbsOnline >= 0) { if (on) { v.dialT = calm ? 0 : DIAL; cueOf("beep"); if (calm) cueOf("hum-start"); } else { v.dialT = 0; cueOf("hum-stop"); } }
      v.bbsOnline = on; v.ledsIdle = false;
    }
    if (v.dialT > 0) { v.dialT = calm ? 0 : Math.max(0, v.dialT - dt); if (v.dialT === 0) cueOf("hum-start"); }
    if (on || !v.ledsIdle) {
      const step = Math.floor(elapsed * (v.dialT > 0 ? 14 : 6));
      for (let i = 0; i < v.modemLeds.length; i++) v.modemLeds[i].glow = !on ? (i === 0 ? 0.6 : 0.08) : calm ? 1.2 : v.dialT > 0 ? (step % 5 === i ? 1.7 : 0.15) : ((step + i) % 5 < 2 ? 1.5 : 0.3);
      v.ledsIdle = !on;
      if (v.modemLamp) v.modemLamp.glow = !on ? 0.15 : calm ? 1.4 : 0.6 + (Math.floor(elapsed * 7) % 3 === 0 ? 0.9 : 0);
    }
    // The pager: a new message buzzes it (a short shake of its body and screen) and lights its lamp.
    if (v.pager.received !== v.pagerReceived) {
      const more = v.pager.received > v.pagerReceived;
      v.pagerReceived = v.pager.received;
      if (more) { v.buzzT = calm ? 0 : BUZZ; cueOf("beep"); }
    }
    if (v.buzzT > 0 || calm) {
      v.buzzT = calm ? 0 : Math.max(0, v.buzzT - dt);
      const shake = v.buzzT > 0 ? Math.sin(elapsed * 90) * 0.012 * (v.buzzT / BUZZ) : 0;
      for (let i = 0; i < v.buzzNodes.length; i++) v.buzzNodes[i].position.z = v.buzzBase[i] + shake;
    }
    v.pagerLamp.glow = v.buzzT > 0 ? 2 : v.pager.unread ? (calm ? 1.3 : 1 + (Math.floor(elapsed * 3) & 1) * 0.6) : 0.4;
    // The cabinet: the demo plays itself and the marquee chases while nobody plays (both steady in Calm).
    const d = v.demo;
    if (!calm) {
      if (d.state === "serve") d.serve(); else if (d.state === "over") d.reset();
      d.input.aim = d.x;
      d.update(dt);
    }
    const chase = Math.floor(elapsed * 8);
    for (let i = 0; i < v.bulbs.length; i++) v.bulbs[i].glow = calm ? 1.1 : v.showPlayer > 0 ? 1.4 : (chase + i) % 7 < 2 ? 1.9 : 0.45;
    if (v.showPlayer > 0) v.showPlayer = Math.max(0, v.showPlayer - dt);
    v.screenT += dt;
    if (v.rallyCtx && v.screenT >= 0.05) {
      v.screenT = 0;
      const mine = v.showPlayer > 0, shown = mine ? v.rally : d;
      if (!calm || shown.time !== v.rallyAt || mine !== v.rallyMine || shown.score !== v.rallyScore) { v.rallyAt = shown.time; v.rallyMine = mine; v.rallyScore = shown.score; paintRally(calm); }
    }
  };
  // Leaving the cave settles everything at its end state (Calm's path), with the visitor's last place, so nothing is left
  // mid-motion and nothing runs while away; the modem's hum is told to stop.
  const SETTLE = { era: 3, walking: false, reading: true, calm: true, x: 0, z: 0 };
  const active = (on) => {
    if (on || !v) return;
    SETTLE.x = v.lastX; SETTLE.z = v.lastZ;
    update(0, v.now, SETTLE);
    if (v.bbs.online) cueOf("hum-stop");
  };
  const dispose = () => { v = null; };

  BL.genesisExhibits.register(ERA, { sources, overview, build, update, active, dispose });
  // The pure rules, for Node checks, and the office PC's hand-on (hook request 2 in the notes): its prompt may pass a
  // line it doesn't know here, to the visit's dial-up corner; null when this answers nothing.
  BL.genesisEra3 = { GRIDS, CRT_INKS, crtPixel, createCrt, SENDS, ERA, NOTE, EXHIBITS, HOLD, TOY, RALLY, MAX_POSTS, MAX_NOTE, TICK, MAX_TICKS, LAYOUT, PAGE_SPOTS, PAGER_TEXTS, sources, overview, link,
    createNewspaper, newspaperTerminal, createKeyStation, keyTerminal, createBbs, createPager, createTriggers, createRally, pagerTerminal, rallyTerminal, FRIENDS, createCourier, courierTerminal,
    pcRun: (line) => v && !/^\s*(HELP|MORE|SOURCES|RESET|CRT)\b/i.test(line) ? v.bbs.run(line) : null, get visit() { return v; } };
})();
