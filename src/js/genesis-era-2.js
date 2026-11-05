// Era 2's cave in the Genesis Voyage, Trees and Blind Money (1980–1989), built through the era exhibit kit
// (genesis-exhibits.js: BL.genesisExhibits.register(2, { sources, build(kit), update, dispose })). Facts from the Era 2
// dossier (docs/genesis-voyage/eras/era-2-trees-and-blind-money.md, branch gv/research); every claim carries one of
// the source keys in SOURCES, which the kit's registry resolves (genesis-props.js sourceOf).
//
// - The rules, pure and Node-checkable: a Merkle-tree table (`createMerkle`), a blind-stamp teaching station
//   (`createBlind`, a paper analogy, not cryptography), an invented 1980s-style office PC with a bounded read-only
//   disk (`createPc`), a 5.25-inch floppy sorting and loading toy (`createFloppies`) and an original 8-bit-style maze
//   (`createMaze`). `createLive()` makes one of each for a visit, with a terminal per exhibit (`{ banner, prompt,
//   run(line) }`, as genesis-props.js's terminals are) and `resetAll()`.
// - `overview`: the summary and guide pages the shared overview board shows (docs/genesis-voyage/EXHIBIT-CONTRACT.md);
//   the cave's years sign, pylons and overview board are the shared signage's, so this era builds no era-wide sign.
// - `build(kit)`: the five exhibits on the cave's left bank (`LAYOUT`), clear of the reserved plots (gateway, dock and
//   ramp, lamps), the waterside walk and the ramp's walkway; a kit obstacle under each footprint; each exhibit a kit
//   prop (ids `e2-`) with its connection (the 1980 paper a whitepaper citation [7], the rest context), what its date
//   marks, a tap box over its model and a walk-up point in front of it; using one opens its terminal. Original
//   procedural models from kit boxes only, each with its own sign.
// - `update`: poses the models from the live state while the visitor is in this cave, allocating nothing: lit tree
//   paths, the envelope and stamp, the disks in their box and the maze on its screen. `dispose` drops the visit.
//
// Elliptic curves: no visualization. The dossier holds only the 1985 paper's abstract and leaves a joint attribution
// pending, and the primary pages could not be read for this build, so the exhibit is on HOLD (see HELD); the PC
// keeps a dated text note only. The 1988 manifesto, blind signatures and elliptic curves are context, not whitepaper
// citations. Guides and records are invented; nothing quotes a real person.
(() => {
  "use strict";
  const BL = window.BL = window.BL || {};
  const G = BL.genesisVoyage, GP = BL.genesisProps, GW = BL.genesisWorld;
  const ERA = 2, YEARS = "1980–1989", NAME = "Trees and Blind Money";
  // The mazes' carving needs a seeded generator; the kit's Node check loads no math.js, so this is math.js's
  // mulberry32, kept here.
  const mulberry32 = (seed) => () => {
    seed |= 0; seed = seed + 0x6d2b79f5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };

  // --- Sources ------------------------------------------------------------------------------------------------------
  // From the Era 2 dossier: `kind` is the connection, `marks` what the date marks, `locator` the passage it rests on.
  // `verified` is true where the dossier records reading that page (this build could not reopen them).
  const DOSSIER = "https://github.com/Bitcoin-Bill/oogaboogaland/blob/gv/research/docs/genesis-voyage/eras/era-2-trees-and-blind-money.md";
  const SOURCES = {
    "E2-MERKLE": { label: "Ralph C. Merkle, Protocols for Public Key Cryptosystems, IEEE Symposium on Security and Privacy proceedings, 1980, §6 (author's copy)",
      href: "https://www.ralphmerkle.com/papers/Protocols.pdf", kind: "whitepaper citation [7]", verified: true, marks: "1980 proceedings publication", locator: "§6, pp. 125–127" },
    "E2-MERKLE-BIB": { label: "Ralph C. Merkle, bibliography of papers (author's site)",
      href: "https://www.ralphmerkle.com/merkleDir/papers.html", kind: "whitepaper citation [7]", verified: true, marks: "confirms the 1980 year", locator: "list entry" },
    "E2-WHITEPAPER": { label: "Satoshi Nakamoto, Bitcoin: A Peer-to-Peer Electronic Cash System (2008), References, item [7]",
      href: "https://bitcoin.org/bitcoin.pdf", kind: "whitepaper citation [7]", verified: false, marks: "31 October 2008 announcement", locator: "References [7]" },
    "E2-CHAUM": { label: "David Chaum, Blind Signatures for Untraceable Payments, CRYPTO '82 (author-hosted scan)",
      href: "https://chaum.com/wp-content/uploads/2022/01/Chaum-blind-signatures.pdf", kind: "context", verified: true, marks: "1982 conference; 1983 printed proceedings", locator: "opening envelope analogy" },
    "E2-CHAUM-CAT": { label: "David Chaum, publications catalogue (author's site)",
      href: "https://chaum.com/publications/", kind: "context", verified: true, marks: "cites the 1982 conference year", locator: "catalogue entry" },
    "E2-ECC": { label: "Victor S. Miller, Use of Elliptic Curves in Cryptography, CRYPTO '85 (publisher's abstract)",
      href: "https://link.springer.com/chapter/10.1007/3-540-39799-X_31", kind: "context", verified: true, marks: "1985 conference; 1986 printed volume", locator: "abstract" },
    "E2-MAY": { label: "Timothy C. May, The Crypto Anarchist Manifesto, 1988 (Satoshi Nakamoto Institute reprint)",
      href: "https://nakamotoinstitute.org/library/crypto-anarchist-manifesto/", kind: "context", verified: true, marks: "1988, the reprint's date", locator: "reprinted text" },
    "E2-PC": { label: "IBM, The IBM PC (company history page)",
      href: "https://www.ibm.com/history/personal-computer", kind: "context", verified: true, marks: "unveiled 12 August 1981", locator: "base configuration" },
    "E2-DOSSIER": { label: "Museum research record: Genesis Voyage Era 2 dossier v0.1 (period gear and easter-egg notes)",
      href: DOSSIER, kind: "context", verified: true, marks: "written 31 October 2026", locator: "Period gear; Easter eggs" },
    // The upgrade cluster's own record (genesis-era-2-cluster.js): what each homage is, and that its historical
    // placement is on HOLD. It supports no historical claim.
    "E2-UPGRADE": { label: "Museum record: Era 2 upgrade cluster notes (modern homages; historical placement on HOLD)",
      href: "https://github.com/Bitcoin-Bill/oogaboogaland/blob/gv/upgrade-era-2/docs/genesis-voyage/exhibits/era-2.md", kind: "context", verified: true, marks: "written 1 November 2026", locator: "Upgrade cluster" }
  };
  // Keys resolve through the kit's registry (genesis-props.js sourceOf); before registration, this table answers.
  const sourceOf = (key) => GP.sourceOf(key) || SOURCES[key] || null;
  const sourceLines = (keys) => keys.map((k) => `Source [${k}]: ${sourceOf(k).label}`);
  // Exhibits the dossier does not clear for display, with why. Nothing here is built.
  const HELD = [
    { id: "ecc-curve", year: 1985, title: "Elliptic-curve picture", sourceKeys: ["E2-ECC"],
      why: "The dossier holds only the 1985 paper's abstract and marks a joint attribution as a pending source check; the primary pages could not be read for this build. A curve drawing waits for a verified source on its mathematics and attribution." }
  ];

  const clean = GP.clean;
  const words = (input) => { const s = input.indexOf(" "); return [(s < 0 ? input : input.slice(0, s)).toUpperCase(), s < 0 ? "" : input.slice(s + 1).trim()]; };

  // --- How to use -------------------------------------------------------------------------------------------------
  // Each terminal opens with its name, then two to four steps for a 12-year-old; HELP and MORE keep the full commands
  // and the deeper text.
  const HOW = {
    merkle: ["Type SHOW and press Enter to see the tree of fingerprints.", "Type CHANGE 3 Bob to change record 3, and watch its path to the root light up.",
      "Type VERIFY 5 to check record 5 with just three fingerprints.", "Type RESET to start again, or MORE to read more."],
    blind: ["Type WRITE and press Enter to write a token.", "Type SEAL, then STAMP: the signer stamps the envelope without looking inside.",
      "Type OPEN, then CHECK: the stamp came through onto your token.", "Type SPEND, then SPEND again: the second try is refused."],
    pc: ["Type DIR and press Enter to list the files.", "Type TYPE MERKLE.TXT to read one.", "Load a disk at the disk box, then type DIR A: here.", "Type HELP for every command."],
    floppy: ["Type LIST and press Enter to see the disks.", "Type SWAP 1 2 to swap two disks. Sort them oldest to newest.", "Type LOAD 1 to put a disk in the PC, then read it at the PC."],
    maze: ["Type moves with W A S D (W up, A left, S down, D right) and press Enter.", "Type several at once, like DDSS.", "Collect all four * leaves; then the gate opens as R. Reach it!", "Type NEXT for another maze, or RESET to try again."]
  };
  const howTo = (key) => ["HOW TO USE", ...HOW[key].map((step, i) => `${i + 1}. ${step}`), ""];

  // --- 1. The Merkle-tree table ---------------------------------------------------------------------------------------
  // Eight records (an invented file of keys, as the 1980 paper's own example is a file of public keys) hashed in pairs
  // up to one root. Nodes are numbered as a heap: 1 is the root, node k's children are 2k and 2k + 1, leaves 8 to 15.
  // The fingerprint is the voyage's toy (FNV-1a), not a secure hash, and every screen says so.
  const LEAVES = 8, LEVELS = 3;
  const RECORDS = ["Ada's key", "Bonga's key", "Coco's key", "Dobo's key", "Eko's key", "Fufu's key", "Gogo's key", "Hapa's key"];
  const createMerkle = ({ records = RECORDS, hash = G.fingerprint } = {}) => {
    const leaves = records.slice(), nodes = new Array(2 * LEAVES).fill("");
    // 0 dark, 1 on the changed leaf's path, 2 a proof sibling, 3 the leaf being proved.
    const lit = new Uint8Array(2 * LEAVES);
    const s = { leaves, nodes, lit, trusted: "", changed: -1, proved: -1, version: 0 };
    const leafHash = (text) => hash("leaf|" + text);
    const rebuild = () => {
      for (let i = 0; i < LEAVES; i++) nodes[LEAVES + i] = leafHash(leaves[i]);
      for (let k = LEAVES - 1; k >= 1; k--) nodes[k] = hash(nodes[2 * k] + nodes[2 * k + 1]);
    };
    const reset = () => {
      for (let i = 0; i < LEAVES; i++) leaves[i] = records[i];
      rebuild(); s.trusted = nodes[1]; s.changed = s.proved = -1; lit.fill(0); s.version++;
    };
    // The nodes whose fingerprints change when leaf i changes: the leaf and every node up to the root.
    const pathOf = (i) => { const out = []; for (let k = LEAVES + i; k >= 1; k >>= 1) out.push(k); return out; };
    const change = (i, text) => {
      const t = clean(text);
      if (!(i >= 0 && i < LEAVES)) return { error: `Pick a record from 1 to ${LEAVES}.` };
      if (!t) return { error: "Write the new record text." };
      const before = nodes.slice();
      leaves[i] = t; rebuild(); lit.fill(0);
      for (let k = LEAVES + i; k >= 1; k >>= 1) lit[k] = 1;
      s.changed = i; s.proved = -1; s.version++;
      const moved = []; for (let k = 1; k < 2 * LEAVES; k++) if (nodes[k] !== before[k]) moved.push(k);
      return { path: pathOf(i), moved };
    };
    // The proof for leaf i: one sibling fingerprint per level, bottom up, with the side it sits on.
    const proof = (i) => {
      const out = [];
      for (let k = LEAVES + i; k > 1; k >>= 1) out.push({ node: k ^ 1, side: k & 1 ? "left" : "right", hash: nodes[k ^ 1] });
      return out;
    };
    const show = (i) => {
      lit.fill(0); lit[LEAVES + i] = 3;
      for (const p of proof(i)) lit[p.node] = 2;
      s.proved = i; s.version++;
    };
    // Recomputes the root from one record and its proof alone, and compares it with `root`.
    const verify = (text, steps, root) => {
      let h = leafHash(text);
      for (const p of steps) h = p.side === "left" ? hash(p.hash + h) : hash(h + p.hash);
      return { root: h, ok: h === root };
    };
    const trust = () => { s.trusted = nodes[1]; s.version++; return s.trusted; };
    reset();
    return Object.assign(s, { reset, change, proof, show, verify, trust, pathOf, leafHash, matches: () => nodes[1] === s.trusted });
  };
  const merkleTerminal = (m) => {
    const tree = () => [
      `                 root ${m.nodes[1]}${m.matches() ? "" : "  (differs from the trusted root)"}`,
      `         ${m.nodes[2]}               ${m.nodes[3]}`,
      `   ${m.nodes[4]}  ${m.nodes[5]}       ${m.nodes[6]}  ${m.nodes[7]}`,
      ...m.leaves.map((t, i) => `  ${i + 1}. ${m.nodes[LEAVES + i]}  ${t}`),
      `Trusted root on the board: ${m.trusted}`];
    return {
      banner: ["MERKLE-TREE TABLE · 1980 publication · Bitcoin whitepaper reference [7]", ...howTo("merkle"),
        "Eight records hashed in pairs up to one root. Type HELP.", "Toy fingerprints (FNV-1a), not a secure hash.", ""],
      prompt: "TREE>",
      run: (line) => {
        const [cmd, arg] = words(clean(line));
        if (!cmd) return { lines: [] };
        if (cmd === "HELP") return { lines: ["SHOW            the tree and the trusted root", "CHANGE 3 text   change record 3 and light its path",
          "PROVE 5         the small proof for record 5", "VERIFY 5        check record 5 with its proof against the trusted root",
          "TRUST           publish today's root as the trusted one", "RESET           put the table back", "MORE            the deeper panel", "SOURCES         where this comes from"] };
        if (cmd === "SHOW") return { lines: tree() };
        if (cmd === "RESET") { m.reset(); return { lines: ["The table is back as it started.", ...tree()], reset: true }; }
        if (cmd === "MORE") return { lines: boardLines(EXHIBITS.merkle) };
        if (cmd === "SOURCES") return { lines: sourceLines(EXHIBITS.merkle.sourceKeys) };
        if (cmd === "TRUST") return { lines: [`The board now shows root ${m.trust()}.`, "In real use you must get the root from somewhere you already trust."] };
        const sp = arg.indexOf(" "), n = parseInt(sp < 0 ? arg : arg.slice(0, sp), 10) - 1;
        if (cmd === "CHANGE") {
          const r = m.change(n, sp < 0 ? "" : arg.slice(sp + 1));
          if (r.error) return { lines: [r.error] };
          return { lines: [`Record ${n + 1} now reads "${m.leaves[n]}".`,
            `${r.moved.length} of ${2 * LEAVES - 1} fingerprints changed: the record's own and every one on its path to the root.`, ...tree()], changed: r };
        }
        if (cmd === "PROVE" || cmd === "VERIFY") {
          if (!(n >= 0 && n < LEAVES)) return { lines: [`Pick a record from 1 to ${LEAVES}.`] };
          const steps = m.proof(n); m.show(n);
          if (cmd === "PROVE") return { lines: [`Proof for record ${n + 1}: ${steps.length} fingerprints instead of all ${LEAVES} records.`,
            ...steps.map((p, k) => `  level ${k + 1}: ${p.hash} on the ${p.side}`)], proof: steps };
          const r = m.verify(m.leaves[n], steps, m.trusted);
          return { lines: [`Record ${n + 1}: "${m.leaves[n]}" with ${steps.length} proof fingerprints gives root ${r.root}.`,
            r.ok ? "It matches the trusted root: this record is in the tree that root stands for." : "It does NOT match the trusted root: the table has changed since that root was trusted.",
            "A match shows the record is included. It does not show who owns it or whether it is true."], verified: r };
        }
        return { lines: ["Unknown command. Type HELP."] };
      }
    };
  };

  // --- 2. The blind-stamp station -------------------------------------------------------------------------------------
  // A paper analogy of a blind signature (the 1982 paper itself opens with carbon-lined envelopes): write a token, seal
  // it in a carbon-lined envelope, have the signer stamp the outside without opening it, take the token out with the
  // stamp carried through, check the stamp, then spend it once. Not cryptography: the toy stamp is a picture anyone
  // could copy, and the signer and the spent list stay central, as the panel says.
  const SEAL = "OOGA SIGNER · ONE BANANA";
  const LOG_MAX = 8, SPENT_MAX = 12, STAMP_TIME = 0.7;
  const STEPS = ["blank", "written", "sealed", "stamped", "opened"];
  const createBlind = ({ hash = G.fingerprint } = {}) => {
    const s = { step: "blank", serial: "", impression: "", envelopes: 0, log: [], spent: [], checked: null, stampT: 0, version: 0, made: 0 };
    const at = (name) => STEPS.indexOf(s.step) >= STEPS.indexOf(name);
    const note = (line) => { s.log.push(line); if (s.log.length > LOG_MAX) s.log.shift(); };
    const reset = () => { s.step = "blank"; s.serial = s.impression = ""; s.envelopes = 0; s.log.length = 0; s.spent.length = 0; s.checked = null; s.stampT = 0; s.made = 0; s.version++; };
    const write = (text) => {
      if (s.step !== "blank" && s.step !== "opened") return { error: "Finish or RESET this token first." };
      const t = clean(text) || `token ${hash("serial|" + ++s.made)}`;
      s.step = "written"; s.serial = t; s.impression = ""; s.checked = null; s.version++;
      return { serial: t };
    };
    const seal = () => {
      if (s.step !== "written") return { error: s.step === "blank" ? "Write a token first." : "The token is not on the desk." };
      s.step = "sealed"; s.envelopes++; s.version++;
      return { envelope: s.envelopes };
    };
    // The signer sees only an envelope number. It stamps the outside; the carbon lining carries the mark inside.
    const stamp = () => {
      if (s.step !== "sealed") return { error: s.step === "stamped" ? "This envelope is already stamped." : "Seal the token in an envelope first." };
      s.step = "stamped"; s.impression = SEAL; s.stampT = STAMP_TIME; s.version++;
      note(`envelope #${s.envelopes} stamped (contents not seen)`);
      return { envelope: s.envelopes };
    };
    const open = () => {
      if (s.step !== "stamped" && s.step !== "sealed") return { error: "There is no envelope to open." };
      s.step = "opened"; s.version++;
      return { serial: s.serial, impression: s.impression };
    };
    // Is the mark on the token the signer's published seal? (A real scheme checks numbers, not a picture.)
    const check = () => {
      if (s.step !== "opened") return { error: "Take the token out of its envelope first." };
      s.checked = s.impression === SEAL; s.version++;
      return { ok: s.checked };
    };
    // Spending: the shop asks the signer, who keeps a list of spent tokens; the same token twice is refused.
    const spend = () => {
      if (s.step !== "opened") return { error: "Take the token out of its envelope first." };
      if (s.impression !== SEAL) return { ok: false, reason: "unstamped" };
      if (s.spent.includes(s.serial)) return { ok: false, reason: "spent" };
      if (s.spent.length >= SPENT_MAX) return { ok: false, reason: "full" };
      s.spent.push(s.serial); s.version++;
      note(`spent "${s.serial}" (cannot be matched to an envelope number)`);
      return { ok: true };
    };
    return Object.assign(s, { reset, write, seal, stamp, open, check, spend, reached: at });
  };
  const blindTerminal = (b) => ({
    banner: ["BLIND-STAMP STATION · 1982 conference contribution · context", "A paper analogy, NOT real cryptography. Type HELP.", ...howTo("blind")],
    prompt: "DESK>",
    run: (line) => {
      const [cmd, arg] = words(clean(line));
      if (!cmd) return { lines: [] };
      if (cmd === "HELP") return { lines: ["WRITE [text]  write a token (blank: a made-up serial)", "SEAL          put it in a carbon-lined envelope",
        "STAMP         the signer stamps the envelope without opening it", "OPEN          take the token out: the stamp came through",
        "CHECK         is the mark the signer's published seal?", "SPEND         spend it once at the shop", "LOG           what the signer saw",
        "RESET         start again", "MORE          the deeper panel and the analogy's limits", "SOURCES       where this comes from"] };
      if (cmd === "RESET") { b.reset(); return { lines: ["A fresh desk, a fresh signer's log."], reset: true }; }
      if (cmd === "MORE") return { lines: boardLines(EXHIBITS.blind) };
      if (cmd === "SOURCES") return { lines: sourceLines(EXHIBITS.blind.sourceKeys) };
      if (cmd === "LOG") return { lines: b.log.length ? ["The signer's log:", ...b.log.map((l) => `  ${l}`)] : ["The signer has seen nothing yet."] };
      if (cmd === "WRITE") { const r = b.write(arg); return { lines: r.error ? [r.error] : [`Your token reads "${r.serial}".`] }; }
      if (cmd === "SEAL") { const r = b.seal(); return { lines: r.error ? [r.error] : [`Sealed in envelope #${r.envelope}. The token is hidden.`] }; }
      if (cmd === "STAMP") {
        const r = b.stamp();
        return { lines: r.error ? [r.error] : [`The signer stamps envelope #${r.envelope} without opening it.`, "Through the carbon lining, the stamp marks the token inside."], stamped: !r.error };
      }
      if (cmd === "OPEN") {
        const r = b.open();
        if (r.error) return { lines: [r.error] };
        return { lines: [`Token "${r.serial}"`, r.impression ? `carries the mark: [${r.impression}]` : "carries no mark: it was never stamped."] };
      }
      if (cmd === "CHECK") {
        const r = b.check();
        return { lines: r.error ? [r.error] : r.ok ? ["The mark matches the signer's published seal.", "(In this toy, anyone could draw that seal. Real blind signatures use mathematics.)"]
          : ["No valid mark: the signer never stamped this token."] };
      }
      if (cmd === "SPEND") {
        const r = b.spend();
        if (r.error) return { lines: [r.error] };
        if (r.ok) return { lines: ["The shop accepts it. The signer adds it to the list of spent tokens,", "but cannot tell which envelope it stamped it in."] };
        return { lines: [r.reason === "spent" ? "Refused: this token is already on the spent list." : r.reason === "full" ? "The spent list is full for this visit. RESET." : "Refused: it carries no signer's mark."] };
      }
      return { lines: ["Unknown command. Type HELP."] };
    }
  });

  // --- 3. The office PC ---------------------------------------------------------------------------------------------
  // "OOGA-DOS", an invented system in the style of 1980s office PCs. Drive C holds the museum's notes, all dated 1989
  // or earlier, so the machine never shows the future; drive A holds whatever floppy is loaded. Read-only, a fixed
  // directory and capped input: nothing is written, fetched or run.
  const PC_YEAR = 1989;
  const PC_FILES = [
    { name: "README", ext: "TXT", year: 1989, sourceKeys: ["E2-DOSSIER"], text: [
      "MUSEUM NOTES, written in 2026 for the Genesis Voyage, about 1980-1989.",
      "This PC and OOGA-DOS are invented: no real product's design or text.",
      "Try DIR, TYPE MERKLE.TXT, or load a floppy from the disk box and DIR A:"] },
    { name: "MERKLE", ext: "TXT", year: 1980, sourceKeys: ["E2-MERKLE", "E2-WHITEPAPER"], text: [
      "1980 publication: Ralph Merkle, Protocols for Public Key Cryptosystems.",
      "Tree authentication: trust one root, then check one entry by its path.",
      "The Bitcoin whitepaper (2008) lists this paper as reference [7].",
      "Its example is a file of public keys, not Bitcoin transactions."] },
    { name: "PC1981", ext: "TXT", year: 1981, sourceKeys: ["E2-PC"], text: [
      "12 August 1981: IBM unveiled its Personal Computer.",
      "The base USD 1,565 machine had 16 kilobytes of memory and no disk drive.",
      "Memory (RAM) is a working space; a disk keeps files when power is off."] },
    { name: "CHAUM", ext: "TXT", year: 1982, sourceKeys: ["E2-CHAUM", "E2-CHAUM-CAT"], text: [
      "1982 conference contribution (printed proceedings dated 1983):",
      "David Chaum, Blind Signatures for Untraceable Payments.",
      "A signer can sign a message it cannot see. Context: not a whitepaper",
      "reference, and not a mechanism Bitcoin uses."] },
    { name: "ECC1985", ext: "TXT", year: 1985, sourceKeys: ["E2-ECC"], text: [
      "1985 conference contribution (printed volume 1986): Victor S. Miller,",
      "Use of Elliptic Curves in Cryptography. Context: the whitepaper does",
      "not cite it. Others worked on the idea too; their records are not yet",
      "checked here, so this note names only this paper. No curve drawing yet."] },
    { name: "MAY1988", ext: "TXT", year: 1988, sourceKeys: ["E2-MAY"], text: [
      "1988 (the date in a later reprint; the first day it was shared is not",
      "known here): Timothy C. May, The Crypto Anarchist Manifesto.",
      "It predicts how cryptography could change society. These are the",
      "author's views, not facts. Context: not a whitepaper reference."] }
  ];
  const createPc = ({ floppies, hash = G.fingerprint } = {}) => {
    const s = { drive: "C", version: 0 };
    const disk = PC_FILES.filter((f) => f.year <= PC_YEAR);
    const sizeOf = (f) => f.text.reduce((n, line) => n + line.length + 2, 0);
    const pad = (t, n) => (t + " ".repeat(n)).slice(0, n);
    const filesOf = (drive) => drive === "C" ? disk : floppies && floppies.loaded >= 0 ? [floppies.disks[floppies.loaded].file] : [];
    const find = (arg) => {
      let drive = s.drive, want = arg.toUpperCase();
      if (/^[AC]:/.test(want)) { drive = want[0]; want = want.slice(2); }
      return filesOf(drive).find((f) => `${f.name}.${f.ext}` === want || f.name === want) || null;
    };
    const reset = () => { s.drive = "C"; s.version++; };
    const run = (line) => {
      const [cmd, arg] = words(clean(line));
      if (!cmd) return { lines: [] };
      if (cmd === "HELP") return { lines: ["DIR [A:]      list the files", "TYPE <file>   show a file, e.g. TYPE MERKLE.TXT", "A: or C:      change drive",
        "HASH <text>   the voyage's toy fingerprint", "VER           about this machine", "CLS           clear the screen", "RESET         back to C:, screen cleared", "MORE          the deeper panel"] };
      if (cmd === "CLS") return { lines: [], cls: true };
      if (cmd === "RESET") { reset(); return { lines: [], cls: true, reset: true }; }
      if (cmd === "VER") return { lines: [`OOGA-DOS, an invented system in the style of ${PC_YEAR}. Museum replica, read-only.`] };
      if (cmd === "MORE") return { lines: boardLines(EXHIBITS.pc) };
      if (cmd === "A:" || cmd === "C:") {
        if (cmd === "A:" && !(floppies && floppies.loaded >= 0)) return { lines: ["Not ready reading drive A: put a disk in from the disk box."] };
        s.drive = cmd[0]; s.version++; return { lines: [] };
      }
      if (cmd === "DIR") {
        const drive = /^[AC]:?$/i.test(arg) ? arg[0].toUpperCase() : s.drive, files = filesOf(drive);
        if (drive === "A" && !files.length) return { lines: ["Not ready reading drive A: put a disk in from the disk box."] };
        const total = files.reduce((n, f) => n + sizeOf(f), 0);
        return { lines: [` Volume in drive ${drive} is ${drive === "C" ? "MUSEUM" : "FLOPPY"}`, ` Directory of ${drive}:\\`, "",
          ...files.map((f) => `${pad(f.name, 9)}${pad(f.ext, 4)}${String(sizeOf(f)).padStart(7)}  ${f.year}`),
          `${String(files.length).padStart(9)} file(s) ${String(total).padStart(9)} bytes of notes`] };
      }
      if (cmd === "TYPE") {
        if (!arg) return { lines: ["Required parameter missing"] };
        const f = find(arg);
        if (!f) return { lines: ["File not found"], missing: arg };
        return { lines: [...f.text, "", ...sourceLines(f.sourceKeys)], file: f };
      }
      if (cmd === "HASH") {
        if (!arg) return { lines: ["Required parameter missing"] };
        return { lines: [`${hash(arg)}  "${arg}"`, "Museum note: a toy fingerprint (FNV-1a), not a secure hash."], hash: hash(arg) };
      }
      if (["DEL", "ERASE", "COPY", "FORMAT", "MD", "MKDIR", "REN", "EDIT"].includes(cmd)) return { lines: ["This museum disk is read-only."] };
      return { lines: ["Bad command or file name"] };
    };
    Object.assign(s, { disk, run, reset, sizeOf, filesOf, banner: [`OOGA-DOS · an invented system in the style of ${PC_YEAR}`, "Museum replica. Type HELP.", ...howTo("pc")] });
    // The prompt follows the drive (the scene reads it for every line it echoes).
    return Object.defineProperty(s, "prompt", { get: () => `${s.drive}:\\>`, enumerable: true });
  };

  // --- 4. The floppy crate ------------------------------------------------------------------------------------------
  // Five hand-labelled 5.25-inch disks, shuffled. Sort them by year with SWAP, then LOAD one into the PC's drive A,
  // where its note shows. Each note tells apart what its date marks. No capacity is shown: the dossier clears none
  // for these disks (and 1.44 MB belongs to a different format).
  const FLOPPY_DISKS = [
    { label: "TREES 1980", year: 1980, color: "#5fb36a", sourceKeys: ["E2-MERKLE", "E2-MERKLE-BIB"],
      file: { name: "DATES80", ext: "TXT", year: 1980, sourceKeys: ["E2-MERKLE", "E2-MERKLE-BIB"], text: [
        "Merkle, tree authentication. PUBLISHED: 1980, in the IEEE Symposium",
        "on Security and Privacy proceedings. PRESENTED: the exact day is not",
        "established here. Not the same as his earlier 1978 puzzles paper."] } },
    { label: "PC 1981", year: 1981, color: "#d8cfb4", sourceKeys: ["E2-PC"],
      file: { name: "DATES81", ext: "TXT", year: 1981, sourceKeys: ["E2-PC"], text: [
        "IBM Personal Computer. UNVEILED: 12 August 1981.",
        "The base price did not include a disk drive."] } },
    { label: "ENVELOPES 1982", year: 1982, color: "#a77fd8", sourceKeys: ["E2-CHAUM", "E2-CHAUM-CAT"],
      file: { name: "DATES82", ext: "TXT", year: 1982, sourceKeys: ["E2-CHAUM", "E2-CHAUM-CAT"], text: [
        "Chaum, blind signatures. PRESENTED: 1982, at the CRYPTO '82 conference.",
        "PRINTED: the proceedings are dated 1983. A company he founded later",
        "is a separate event, not part of 1982."] } },
    { label: "CURVES 1985", year: 1985, color: "#5aa6d8", sourceKeys: ["E2-ECC"],
      file: { name: "DATES85", ext: "TXT", year: 1985, sourceKeys: ["E2-ECC"], text: [
        "Miller, elliptic curves. PRESENTED: 1985, at CRYPTO '85.",
        "PRINTED: a 1986 volume. ONLINE: publisher records from 2000,",
        "which are not the date of the idea."] } },
    { label: "MANIFESTO 1988", year: 1988, color: "#e0a84a", sourceKeys: ["E2-MAY"],
      file: { name: "DATES88", ext: "TXT", year: 1988, sourceKeys: ["E2-MAY"], text: [
        "May, The Crypto Anarchist Manifesto. WRITTEN or first shared: the",
        "reprint dates it 1988; the exact day is not established here.",
        "An essay of predictions and views, not a payment design."] } }
  ];
  const SHUFFLE = [3, 0, 4, 1, 2], MAX_MOVES = 99;
  const createFloppies = ({ disks = FLOPPY_DISKS } = {}) => {
    const order = new Array(disks.length).fill(0);
    const s = { disks, order, loaded: -1, moves: 0, version: 0 };
    const reset = () => { for (let i = 0; i < order.length; i++) order[i] = SHUFFLE[i]; s.loaded = -1; s.moves = 0; s.version++; };
    const sorted = () => { for (let i = 1; i < order.length; i++) if (disks[order[i - 1]].year > disks[order[i]].year) return false; return true; };
    // The fewest swaps that sort the starting crate: the slots minus the cycles of the shuffle.
    // (FLOPPY_DISKS is in year order, so slot i should end up holding disk i.)
    const fewest = () => {
      const seen = new Array(SHUFFLE.length).fill(false);
      let cycles = 0;
      for (let i = 0; i < SHUFFLE.length; i++) { if (seen[i]) continue; cycles++; for (let j = i; !seen[j]; j = SHUFFLE[j]) seen[j] = true; }
      return SHUFFLE.length - cycles;
    };
    const swap = (a, b) => {
      if (!(a >= 0 && a < order.length && b >= 0 && b < order.length) || a === b) return { error: `Pick two different slots from 1 to ${order.length}.` };
      if (s.moves >= MAX_MOVES) return { error: "That's a lot of swaps. RESET to start again." };
      const t = order[a]; order[a] = order[b]; order[b] = t; s.moves++; s.version++;
      return { sorted: sorted() };
    };
    const load = (slot) => {
      if (!(slot >= 0 && slot < order.length)) return { error: `Pick a slot from 1 to ${order.length}.` };
      s.loaded = order[slot]; s.version++;
      return { disk: disks[s.loaded] };
    };
    const eject = () => { const was = s.loaded; s.loaded = -1; s.version++; return { disk: was >= 0 ? disks[was] : null }; };
    reset();
    return Object.assign(s, { reset, sorted, swap, load, eject, fewest });
  };
  const floppyTerminal = (f) => {
    const list = () => f.order.map((d, i) => `  slot ${i + 1}: [${f.disks[d].label}]${f.loaded === d ? "  <- in the PC's drive" : ""}`);
    return {
      banner: ["5.25-INCH DISK BOX · period gear of the 1980s", ...howTo("floppy")],
      prompt: "DISKS>",
      run: (line) => {
        const [cmd, arg] = words(clean(line));
        if (!cmd) return { lines: [] };
        if (cmd === "HELP") return { lines: ["LIST        the disks in the box", "SWAP 1 4    swap the disks in slots 1 and 4", "LOAD 2      put slot 2's disk in the PC's drive A",
          "EJECT       take the disk out of the drive", "RESET       shuffle the box back", "MORE        the deeper panel", "SOURCES     where this comes from"] };
        if (cmd === "LIST") return { lines: [...list(), f.sorted() ? "Sorted by year." : "Not in year order yet."] };
        if (cmd === "RESET") { f.reset(); return { lines: ["The box is shuffled back.", ...list()], reset: true }; }
        if (cmd === "MORE") return { lines: boardLines(EXHIBITS.floppy) };
        if (cmd === "SOURCES") return { lines: sourceLines(EXHIBITS.floppy.sourceKeys) };
        if (cmd === "EJECT") { const r = f.eject(); return { lines: [r.disk ? `[${r.disk.label}] is back in the box.` : "The drive is empty."] }; }
        if (cmd === "LOAD") {
          const r = f.load(parseInt(arg, 10) - 1);
          return { lines: r.error ? [r.error] : [`[${r.disk.label}] is in the PC's drive A. On the PC: DIR A: then TYPE ${r.disk.file.name}.TXT`] };
        }
        if (cmd === "SWAP") {
          const [a, b] = arg.split(/\s+/).map((v) => parseInt(v, 10) - 1), r = f.swap(a, b);
          if (r.error) return { lines: [r.error] };
          return { lines: [...list(), r.sorted ? `Sorted by year in ${f.moves} swap${f.moves === 1 ? "" : "s"} (the fewest possible is ${f.fewest()}).` : "Not in year order yet."] };
        }
        return { lines: ["Unknown command. Type HELP."] };
      }
    };
  };

  // --- 5. The maze cabinet: LEAVES TO ROOT --------------------------------------------------------------------------
  // An original 8-bit-style maze: collect the four glowing leaves, then reach the root gate, which opens only when all
  // four are held. Turn-based (one step per move, no clock), on one of four fixed mazes carved from a seed, so every
  // visitor gets the same puzzles and a par to beat. No enemies, sounds or borrowed characters.
  // The seeds give four mazes with enough dead ends for a gate and four leaves, in rising par (68, 70, 76, 82).
  const MAZE = { w: 7, h: 5, seeds: [8, 2, 12, 4], leaves: 4, maxRun: 60 };
  const GW_ = MAZE.w * 2 + 1, GH_ = MAZE.h * 2 + 1;
  const carve = (seed) => {
    const grid = new Uint8Array(GW_ * GH_).fill(1), rand = mulberry32(seed);
    const seen = new Uint8Array(MAZE.w * MAZE.h), stack = [0];
    seen[0] = 1; grid[GW_ + 1] = 0;
    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]], open = [];
    while (stack.length) {
      const c = stack[stack.length - 1], cx = c % MAZE.w, cy = (c / MAZE.w) | 0;
      open.length = 0;
      for (const [dx, dy] of dirs) { const nx = cx + dx, ny = cy + dy; if (nx >= 0 && ny >= 0 && nx < MAZE.w && ny < MAZE.h && !seen[ny * MAZE.w + nx]) open.push(dx, dy); }
      if (!open.length) { stack.pop(); continue; }
      const k = Math.floor(rand() * (open.length / 2)) * 2, nx = cx + open[k], ny = cy + open[k + 1];
      seen[ny * MAZE.w + nx] = 1;
      grid[(cy * 2 + 1 + open[k + 1]) * GW_ + cx * 2 + 1 + open[k]] = 0;
      grid[(ny * 2 + 1) * GW_ + nx * 2 + 1] = 0;
      stack.push(ny * MAZE.w + nx);
    }
    return grid;
  };
  // Steps between grid cells by breadth-first search: distances from one cell to every other.
  const distances = (grid, from) => {
    const d = new Int16Array(GW_ * GH_).fill(-1), q = new Int16Array(GW_ * GH_);
    let head = 0, tail = 0; d[from] = 0; q[tail++] = from;
    while (head < tail) {
      const c = q[head++];
      for (const n of [c + 1, c - 1, c + GW_, c - GW_]) if (!grid[n] && d[n] < 0) { d[n] = d[c] + 1; q[tail++] = n; }
    }
    return d;
  };
  const permutations = (n) => { const out = []; const go = (p, rest) => { if (!rest.length) out.push(p); rest.forEach((v, i) => go([...p, v], rest.filter((_, j) => j !== i))); }; go([], [...Array(n).keys()]); return out; };
  const PERMS = permutations(MAZE.leaves);
  const createMaze = () => {
    const mazes = MAZE.seeds.map((seed) => {
      const grid = carve(seed), start = GW_ + 1;
      // The gate on the dead end farthest from the start and the leaves on the next four (ties by cell index), so the
      // closed gate never cuts a leaf off and each leaf is a little trip.
      const fromStart = distances(grid, start), ends = [];
      for (let c = 0; c < grid.length; c++) {
        if (grid[c] || c === start) continue;
        let walls = 0; for (const n of [c + 1, c - 1, c + GW_, c - GW_]) walls += grid[n];
        if (walls === 3) ends.push(c);
      }
      ends.sort((a, b) => fromStart[b] - fromStart[a] || a - b);
      if (ends.length < 1 + MAZE.leaves) throw new Error(`maze seed ${seed}: only ${ends.length} dead ends`);
      const gate = ends[0], leaves = ends.slice(1, 1 + MAZE.leaves);
      // Par: the shortest walk from the start through all four leaves to the gate.
      const pts = [start, ...leaves, gate], dist = pts.map((p) => distances(grid, p));
      let par = Infinity;
      for (const p of PERMS) {
        let n = dist[0][leaves[p[0]]];
        for (let i = 1; i < p.length; i++) n += dist[1 + p[i - 1]][leaves[p[i]]];
        n += dist[1 + p[p.length - 1]][gate];
        if (n < par) par = n;
      }
      return { seed, grid, start, gate, leaves, par };
    });
    const s = { index: 0, at: 0, got: new Uint8Array(MAZE.leaves), moves: 0, won: false, best: new Int16Array(mazes.length).fill(-1), version: 0, mazes };
    const maze = () => mazes[s.index];
    const reset = (index = s.index) => { s.index = index; s.at = mazes[index].start; s.got.fill(0); s.moves = 0; s.won = false; s.version++; };
    const held = () => { let n = 0; for (let i = 0; i < MAZE.leaves; i++) n += s.got[i]; return n; };
    const STEP = { W: -GW_, S: GW_, A: -1, D: 1, U: -GW_, N: -GW_, E: 1, R: 1, L: -1 };
    // One move: "W", "A", "S" or "D" (also N/E/S and U/L/R). Walls stop it and it does not count.
    const move = (key) => {
      const m = maze(), step = STEP[key];
      if (s.won || !step) return false;
      const to = s.at + step;
      if (m.grid[to] || (to === m.gate && held() < MAZE.leaves)) return false;
      s.at = to; s.moves++; s.version++;
      const k = m.leaves.indexOf(to);
      if (k >= 0) s.got[k] = 1;
      if (to === m.gate) { s.won = true; if (s.best[s.index] < 0 || s.moves < s.best[s.index]) s.best[s.index] = s.moves; }
      return true;
    };
    const runMoves = (keys) => { let n = 0; for (const ch of keys.toUpperCase().slice(0, MAZE.maxRun)) if (move(ch)) n++; return n; };
    const ascii = () => {
      const m = maze(), rows = [];
      for (let y = 0; y < GH_; y++) {
        let row = "";
        for (let x = 0; x < GW_; x++) {
          const c = y * GW_ + x, k = m.leaves.indexOf(c);
          row += c === s.at ? "@" : k >= 0 && !s.got[k] ? "*" : c === m.gate ? (held() < MAZE.leaves ? "X" : "R") : m.grid[c] ? "#" : " ";
        }
        rows.push(row);
      }
      return rows;
    };
    reset(0);
    return Object.assign(s, { reset, move, runMoves, ascii, held, maze, size: { w: GW_, h: GH_ } });
  };
  const mazeTerminal = (z) => {
    const status = () => z.won ? [`ROOT REACHED in ${z.moves} moves (par ${z.maze().par}). NEXT for another maze.`]
      : [`Maze ${z.index + 1}/${MAZE.seeds.length} · leaves ${z.held()}/${MAZE.leaves} · moves ${z.moves} · par ${z.maze().par}${z.best[z.index] >= 0 ? ` · best ${z.best[z.index]}` : ""}`];
    return {
      // Drawn fresh each time the cabinet is opened, so it shows the game where it was left.
      get banner() {
        return ["LEAVES TO ROOT · an original maze in the style of the 1980s", ...howTo("maze"), "@ you  * leaf  X gate (opens as R with all four leaves)",
          "Type moves with W A S D, up to 60 at once, e.g. DDSS. HELP for more.", ...z.ascii(), ...status(), ""];
      },
      prompt: "MAZE>",
      run: (line) => {
        const input = clean(line), [cmd] = words(input);
        if (!cmd) return { lines: [] };
        if (cmd === "HELP") return { lines: ["W A S D     move up, left, down, right (type several: DDSSA)", "SHOW        draw the maze", "NEXT        the next of four mazes",
          "RESET       restart this maze", "MORE        the deeper panel"] };
        if (cmd === "SHOW") return { lines: [...z.ascii(), ...status()] };
        if (cmd === "RESET") { z.reset(); return { lines: [...z.ascii(), ...status()], reset: true }; }
        if (cmd === "NEXT") { z.reset((z.index + 1) % MAZE.seeds.length); return { lines: [...z.ascii(), ...status()] }; }
        if (cmd === "MORE") return { lines: boardLines(EXHIBITS.maze) };
        if (/^[WASDNEULR]+$/i.test(input.replace(/\s+/g, ""))) {
          const n = z.runMoves(input.replace(/\s+/g, ""));
          return { lines: [...z.ascii(), ...status(), ...(n ? [] : ["Bump. A wall (or the closed gate) is in the way."])], moved: n };
        }
        return { lines: ["Unknown command. Type HELP."] };
      }
    };
  };

  // --- The exhibits: words, dates and panels ------------------------------------------------------------------------
  // `short` is the one-line explanation; `deeper` the optional panel ({ room, pages, sources }, as makeBoard takes).
  const EXHIBITS = {
    merkle: { id: "e2-merkle", year: 1980, connection: "citation", ref: "[7]", title: "Merkle-tree table: change a record, watch its path light up", label: "MERKLE-TREE TABLE · 1980", sub: "Bitcoin whitepaper reference [7]",
      date: "1980: published in the IEEE Symposium on Security and Privacy proceedings; the exact presentation day is not established in the research",
      kind: "whitepaper citation [7]", sourceKeys: ["E2-MERKLE", "E2-MERKLE-BIB", "E2-WHITEPAPER"],
      short: "Change one record and only its path to the root changes; three fingerprints prove one record is in the tree.",
      deeper: { room: "Merkle tree table - 1980", sources: ["E2-MERKLE", "E2-MERKLE-BIB", "E2-WHITEPAPER"], pages: [
        { caption: "1980", title: "Check a branch, trust a root", text: [
          "Ralph Merkle's paper Protocols for Public Key Cryptosystems was published in 1980. It describes tree authentication: once you trust the root, you can check any single entry using its authentication path.",
          "The Bitcoin whitepaper of 2008 lists this paper as reference [7]."] },
        { caption: "Try it", title: "One change, one lit path", text: [
          "Change one record and its fingerprint changes, then every fingerprint on its way up to the root: four of the fifteen, never the others.",
          "To prove one record is in the tree you need only three fingerprints, one per level, not all eight records."] },
        { caption: "Limits", title: "What a proof does not show", text: [
          "First you must trust the root from somewhere else; a path alone cannot tell you which root to trust.",
          "A proof shows a record is included. It does not prove who owns it, that it is true, or that everyone agrees.",
          "The paper's example is a file of public keys, not Bitcoin's transactions. It does not claim the tree was first thought of in 1980, and Merkle's 1978 puzzles paper is a different work.",
          "The fingerprints here are a toy (FNV-1a), not a secure hash."] }] } },
    blind: { id: "e2-blind", year: 1982, connection: "context", title: "Blind-stamp station: get a hidden token stamped", label: "BLIND-STAMP STATION · 1982", sub: "context · a paper analogy, not cryptography",
      date: "1982: presented at the CRYPTO '82 conference; the printed proceedings are dated 1983, and the exact day is not established",
      kind: "context, not a whitepaper reference", sourceKeys: ["E2-CHAUM", "E2-CHAUM-CAT"],
      short: "Get a stamp on a token the signer cannot see, then reveal it and check the stamp.",
      deeper: { room: "Blind stamp station - 1982", sources: ["E2-CHAUM", "E2-CHAUM-CAT"], pages: [
        { caption: "1982", title: "Sign without seeing", text: [
          "David Chaum's Blind Signatures for Untraceable Payments was a 1982 conference contribution (CRYPTO '82); its printed proceedings are dated 1983.",
          "A blind signature separates what the signer sees from what is later presented. The paper explains it with carbon-lined envelopes."] },
        { caption: "Analogy", title: "Envelope, carbon and stamp", text: [
          "You seal a token in a carbon-lined envelope. The signer stamps the outside without opening it, and the carbon carries the stamp onto the token.",
          "Take it out and the token carries the signer's mark, but the signer never saw it and cannot match it to the envelope it stamped."] },
        { caption: "Limits", title: "Not real cryptography", text: [
          "This desk is a physical analogy. Its stamp is a picture anyone could copy; in the paper, the hiding, signing and checking are done with mathematics.",
          "The signer is still one central party, and someone still keeps a list of spent tokens to stop one being spent twice.",
          "Context only: it is not one of the whitepaper's references and not a mechanism Bitcoin uses. Companies founded later are separate events."] }] } },
    pc: { id: "e2-pc", year: 1981, connection: "context", title: "1980s office PC: list its files and read one", label: "OFFICE PC · 1981", sub: "DIR · TYPE · invented design",
      date: "12 August 1981: the IBM Personal Computer was unveiled; this PC is an invented design in the style of the decade",
      kind: "context (period gear)", sourceKeys: ["E2-PC", "E2-DOSSIER"],
      short: "An invented 1980s-style PC: its disk holds museum notes about the era's ideas, each with its date and source.",
      deeper: { room: "Office PC - 1981", sources: ["E2-PC", "E2-DOSSIER"], pages: [
        { caption: "1981", title: "A personal computer", text: [
          "IBM unveiled its Personal Computer on 12 August 1981. Its base configuration cost USD 1,565 and had 16 kilobytes of memory and no disk drive.",
          "Memory is working space that empties when the power goes off; a disk keeps files."] },
        { caption: "Replica", title: "An invented machine", text: [
          "This beige box, its keyboard and OOGA-DOS are invented for the voyage, not copies of any product. Its notes are written today and dated by what they describe.",
          "Its disk is read-only and holds only notes dated 1989 or earlier."] }] } },
    floppy: { id: "e2-floppy", year: "1980s", connection: "context", title: "5.25-inch disk box: sort the disks by year", label: "5.25-INCH DISKS · 1980s", sub: "sort by year · load into the PC",
      date: "1980s: period gear of the decade; the research clears no introduction date or capacity for these disks, so none is shown",
      kind: "context (period gear)", sourceKeys: ["E2-DOSSIER", "E2-PC"],
      short: "Sort the disks by year, then load one into the PC to read what its date marks.",
      deeper: { room: "5.25-inch disks - 1980s", sources: ["E2-DOSSIER", "E2-PC"], pages: [
        { caption: "Disks", title: "Floppy disks", text: [
          "Files were carried between PCs on floppy disks. Each disk in this box holds one note about what an Era 2 date marks: written, presented, published or printed.",
          "The 1981 base PC had no disk drive; a drive cost extra."] },
        { caption: "Limits", title: "Why no capacity", text: [
          "Different 5.25-inch disks held different amounts, and the museum's research has not yet verified one, so no capacity is shown. The 1.44 MB figure belongs to a different format.",
          "The disks and labels are original designs, not to scale."] }] } },
    maze: { id: "e2-maze", year: "1980s", connection: "context", title: "LEAVES TO ROOT table: collect four leaves, reach the gate", label: "LEAVES TO ROOT · 1980s STYLE", sub: "an original maze · made 2026",
      date: "1980s style: made for the voyage in 2026, in a blocky style of 1980s games; not a real game of the decade",
      kind: "context (an original easter egg)", sourceKeys: ["E2-DOSSIER", "E2-MERKLE"],
      short: "Collect the four leaves, then reach the root gate in as few moves as you can.",
      deeper: { room: "LEAVES TO ROOT", sources: ["E2-DOSSIER", "E2-MERKLE"], pages: [
        { caption: "Play", title: "Leaves to root", text: [
          "Gather all four leaves and the root gate opens, a nod to the 1980 tree paper, where many leaves lead to one root.",
          "Four fixed mazes, each with a par: the shortest walk through every leaf to the gate."] },
        { caption: "Original", title: "Made for the voyage", text: [
          "Its rules, maze and cabinet are new, drawn in an 8-bit-like style. It copies no game, sound, character or logo, and it is not a game released in the 1980s."] }] } }
  };
  const boardLines = (ex) => [ex.deeper.room, `${ex.date}.`, `Connection: ${ex.kind}.`, ...ex.deeper.pages.flatMap((p) => ["", `${p.caption}: ${p.title}`, ...p.text]), "", ...sourceLines(ex.deeper.sources)];

  // --- The era's overview ------------------------------------------------------------------------------------------
  // For the shared overview board on the left bank's gateway (docs/genesis-voyage/EXHIBIT-CONTRACT.md): the summary and
  // the era's own guide pages. The shared signage gives the cave its years sign, pylons and board; this era builds none.
  const OVERVIEW = {
    summary: "Check one record without carrying a whole library: a tree of fingerprints does it, and Bitcoin's whitepaper cites the 1980 paper. Blind signatures try another trick, a stamp on a hidden message. Personal computers arrived too. None of it yet made digital money.",
    sourceKeys: ["E2-MERKLE", "E2-WHITEPAPER", "E2-CHAUM", "E2-ECC", "E2-MAY", "E2-PC", "E2-DOSSIER"],
    pages: [
      { caption: "Try", title: "Five things to try", text: [
        "Merkle-tree table (1980): change a record and watch its path to the root light up; prove one record with three fingerprints.",
        "Blind-stamp station (1982): seal a token, get it stamped unseen, open it, check the stamp, spend it once. A paper analogy, not cryptography.",
        "Office PC (1981), disk box and LEAVES TO ROOT: read the dated notes, sort the disks by year and load one, then play the maze."] },
      { caption: "Dates", title: "What each date marks", text: [
        "1980: Merkle's paper published in the IEEE Symposium on Security and Privacy proceedings. Whitepaper citation [7].",
        "1982: Chaum's blind signatures presented at CRYPTO '82; proceedings printed 1983. 1985: Miller's elliptic curves presented at CRYPTO '85; printed 1986. 1988: May's manifesto, the date in a later reprint. All context.",
        "12 August 1981: the IBM Personal Computer unveiled. Period gear, context."] },
      { caption: "Held", title: "Context, and what is held back", text: [
        "Only the 1980 paper is in the whitepaper's references. Blind signatures, elliptic curves and May's manifesto are context: no borrowed design is claimed.",
        "An elliptic-curve picture is on hold until its mathematics and attribution are checked against primary sources. The PC keeps a dated note instead."] }
    ]
  };

  // --- One visit's live state -----------------------------------------------------------------------------------------
  const createLive = () => {
    const merkle = createMerkle(), blind = createBlind(), floppy = createFloppies(), pc = createPc({ floppies: floppy }), maze = createMaze();
    const terminals = { merkle: merkleTerminal(merkle), blind: blindTerminal(blind), pc, floppy: floppyTerminal(floppy), maze: mazeTerminal(maze) };
    const resetAll = () => { merkle.reset(); blind.reset(); floppy.reset(); pc.reset(); maze.reset(0); };
    return { merkle, blind, floppy, pc, maze, terminals, resetAll };
  };

  // --- Layout on the left bank ----------------------------------------------------------------------------------------
  // Every exhibit stands on the left bank about 10 m in from the stream's edge, at u 17 to 52 down the cave (the bank
  // frame of genesis-world.js), clear of the gateway (u < 10), the dock and its ramp (u 32 to 40, v < 6), the lamp
  // posts and the waterside walk, and off the walkway inland from the ramp (|z - cave middle| < 2.6). Each faces the
  // stream (+x). `half` is its footprint's half size in x and z (a kit obstacle); `h` its height, for the tap box,
  // which stands over the model; `at` is the walk-up point in front of it, toward the stream, which the shared trail's
  // spur and STEP post lead to; `reach` how near the visitor must be to `at`.
  const E = GW.ERAS[ERA], FRONT = 0.8;
  const LAYOUT = {
    merkle: { x: -10, z: E.z + 7, half: { x: 1, z: 2.35 }, h: 3.4, reach: 1.6 },
    blind: { x: -10, z: E.z - 7.5, half: { x: 0.8, z: 1.4 }, h: 2.3, reach: 1.5 },
    pc: { x: -10, z: E.z + 16, half: { x: 0.6, z: 0.95 }, h: 1.6, reach: 1.4 },
    floppy: { x: -10, z: E.z + 19, half: { x: 0.4, z: 0.5 }, h: 1.1, reach: 1.4 },
    maze: { x: -10, z: E.z - 16, half: { x: 0.8, z: 0.5 }, h: 1.0, reach: 1.4 }
  };
  const PROPS = ["merkle", "blind", "pc", "floppy", "maze"];
  // The era's set dressing on the floor, as boxes walkers bump into (the wall pieces hang flat on the cave wall): a
  // lounge corner far back on the bank and a shelf unit against the wall, well behind the exhibits so nothing stands
  // between the corridor and their signs, and off the ramp's walkway.
  const LOUNGE = { x: -24, z: E.z + 12 }, SHELF = { x: -32.6, z: E.z - 9 };
  const DECOR_BOXES = [
    { x0: LOUNGE.x - 3.0, x1: LOUNGE.x - 2.1, z0: LOUNGE.z - 1.4, z1: LOUNGE.z + 1.4 },
    { x0: LOUNGE.x - 1.15, x1: LOUNGE.x - 0.45, z0: LOUNGE.z - 0.65, z1: LOUNGE.z + 0.65 },
    { x0: LOUNGE.x + 0.5, x1: LOUNGE.x + 1.3, z0: LOUNGE.z + 1.1, z1: LOUNGE.z + 1.9 },
    { x0: LOUNGE.x - 3.0, x1: LOUNGE.x - 2.5, z0: LOUNGE.z - 2.3, z1: LOUNGE.z - 1.8 },
    { x0: LOUNGE.x - 3.1, x1: LOUNGE.x - 2.3, z0: LOUNGE.z + 1.8, z1: LOUNGE.z + 2.6 },
    { x0: SHELF.x - 0.35, x1: SHELF.x + 0.35, z0: SHELF.z - 1.3, z1: SHELF.z + 1.3 }
  ];
  // The footprints build passes to kit.obstacle: one box per exhibit, then the dressing's.
  const footprints = () => [...PROPS.map((key) => { const l = LAYOUT[key]; return { x0: l.x - l.half.x, x1: l.x + l.half.x, z0: l.z - l.half.z, z1: l.z + l.half.z }; }), ...DECOR_BOXES];
  // Where the visitor stands to use an exhibit: in front of it, toward the stream.
  const walkUp = (key, y) => { const l = LAYOUT[key]; return { x: l.x + l.half.x + FRONT, y, z: l.z }; };

  // --- Models -------------------------------------------------------------------------------------------------------
  // Original procedural geometry, built once per visit through the kit: static parts with kit.solid, moving or
  // lighting parts as their own nodes (kit.M.box) posed by `sync`. Everything faces +x, toward the stream. The maze's
  // walls are a fixed pool of row runs, re-laid only when the maze changes.
  const FACE_X = Math.PI / 2;
  const buildModels = (kit, live) => {
    const { top: Y, M, createNode, addChild, place, solid, sign } = kit;
    // Only exhibit signs here: the cave's years sign, pylons and overview board are the shared signage's.
    const parts = { tiles: [], lit: [], proofs: [], marks: [], disks: [], runs: [], leaves: [], phase: 0, mazeShown: -1 };
    const node = (geometry, x, y, z, visible = true) => place(createNode({ geometry, position: { x, y, z }, visible }));
    const box = (w, h, d, color, emissive = 0) => M.box({ w, h, d, color, emissive });
    // 1. The Merkle table: a table, an upright board of fifteen tiles in four rows wired as a tree, the eight record
    // cards on the table and the trusted-root lamp. Each tile has a dark face, a lit face (path) and a blue one (proof).
    {
      const l = LAYOUT.merkle, x = l.x, z = l.z;
      solid(1.6, 0.08, 3.8, "#5a4630", x, Y + 0.8, z);
      for (const [dx, dz] of [[-0.7, -1.8], [0.7, -1.8], [-0.7, 1.8], [0.7, 1.8]]) solid(0.08, 0.8, 0.08, "#3d2f20", x + dx, Y + 0.4, z + dz);
      solid(0.08, 1.9, 3.8, "#241c2e", x - 0.75, Y + 1.8, z);
      const tileAt = (k) => { const level = 31 - Math.clz32(k), first = 1 << level, span = 3.4 / first, i = k - first; return { y: Y + 2.5 - level * 0.45, z: z + 1.7 - span * (i + 0.5) }; };
      // The wiring: from each parent down to a bar that spans its two children, and from the bar down to each child.
      for (let k = 1; k < LEAVES; k++) {
        const p = tileAt(k), a = tileAt(2 * k), b = tileAt(2 * k + 1), bar = (p.y + a.y) / 2, wire = "#8a7aa8";
        solid(0.03, p.y - bar, 0.03, wire, x - 0.7, (p.y + bar) / 2, p.z);
        solid(0.03, 0.03, Math.abs(a.z - b.z), wire, x - 0.7, bar, (a.z + b.z) / 2);
        solid(0.03, bar - a.y, 0.03, wire, x - 0.7, (bar + a.y) / 2, a.z);
        solid(0.03, bar - b.y, 0.03, wire, x - 0.7, (bar + b.y) / 2, b.z);
      }
      for (let i = 0; i < LEAVES; i++) solid(0.5, 0.02, 0.32, "#efe6cf", x + 0.25, Y + 0.85, z + 1.7 - 0.425 * (i + 0.5));
      solid(0.3, 1.6, 0.3, "#3d2f20", x - 0.75, Y + 1.6, z - 2.15);
      parts.tiles.push(null); parts.lit.push(null); parts.proofs.push(null);
      for (let k = 1; k < 2 * LEAVES; k++) {
        const a = tileAt(k);
        parts.tiles.push(node(box(0.04, 0.24, 0.28, "#4b3d68"), x - 0.7, a.y, a.z));
        parts.lit.push(node(box(0.04, 0.26, 0.3, "#ffd36a", 1.4), x - 0.67, a.y, a.z, false));
        parts.proofs.push(node(box(0.04, 0.26, 0.3, "#7fd0ff", 1.2), x - 0.67, a.y, a.z, false));
      }
      for (let i = 0; i < LEAVES; i++) parts.marks.push(node(box(0.12, 0.03, 0.12, "#ff6a5a", 0.9), x + 0.42, Y + 0.87, z + 1.7 - 0.425 * (i + 0.5), false));
      // The trusted-root lamp on its post beside the root: green while today's root matches the trusted one.
      parts.rootOk = node(box(0.26, 0.26, 0.26, "#6aff9a", 1.3), x - 0.75, Y + 2.55, z - 2.15);
      parts.rootBad = node(box(0.26, 0.26, 0.26, "#ff5a4a", 1.3), x - 0.75, Y + 2.55, z - 2.15, false);
      sign(EXHIBITS.merkle.label, EXHIBITS.merkle.sub, x - 0.68, Y + 3.15, z, FACE_X, 0.45);
    }
    // 2. The blind-stamp desk: a desk, the signer's screen, a slip, an envelope and a stamp on an arm.
    {
      const l = LAYOUT.blind, x = l.x, z = l.z;
      solid(1.4, 0.08, 2.6, "#6b4a2b", x, Y + 0.78, z);
      for (const [dx, dz] of [[-0.6, -1.2], [0.6, -1.2], [-0.6, 1.2], [0.6, 1.2]]) solid(0.07, 0.78, 0.07, "#4c331d", x + dx, Y + 0.39, z + dz);
      solid(0.06, 1.2, 2.6, "#3b2f48", x - 0.66, Y + 1.42, z);
      solid(0.5, 0.06, 0.06, "#2a2230", x - 0.4, Y + 1.95, z - 0.2);
      solid(0.06, 1.2, 0.06, "#2a2230", x - 0.62, Y + 1.4, z - 0.2);
      parts.slip = node(box(0.34, 0.012, 0.22, "#f5f0e2"), x + 0.2, Y + 0.83, z + 0.6);
      parts.envelope = node(box(0.42, 0.03, 0.3, "#8e7ab8"), x - 0.15, Y + 0.84, z - 0.2, false);
      parts.envMark = node(box(0.14, 0.005, 0.14, "#d0304a", 0.4), x - 0.15, Y + 0.858, z - 0.2, false);
      parts.slipMark = node(box(0.12, 0.005, 0.12, "#d0304a", 0.4), x + 0.22, Y + 0.838, z + 0.6, false);
      parts.stamp = node(box(0.16, 0.12, 0.16, "#d0304a"), x - 0.15, Y + 1.6, z - 0.2);
      addChild(parts.stamp, createNode({ geometry: box(0.05, 0.25, 0.05, "#2a2230"), position: { x: 0, y: 0.18, z: 0 } }));
      parts.stampRest = Y + 1.6; parts.stampLow = Y + 0.92;
      parts.okLamp = node(box(0.2, 0.2, 0.2, "#6aff9a", 1.3), x - 0.6, Y + 2.2, z + 0.9, false);
      parts.badLamp = node(box(0.2, 0.2, 0.2, "#ff5a4a", 1.3), x - 0.6, Y + 2.2, z + 0.9, false);
      sign(EXHIBITS.blind.label, EXHIBITS.blind.sub, x + 0.75, Y + 1.25, z, FACE_X, 0.45);
    }
    // 3. The office PC, an invented early-1980s desk machine and nothing like the later caves' towers and terminals: a
    // wide, flat putty system unit with twin full-height disk doors and their latches, a green-screen monitor on a
    // tilt-and-swivel foot on top, a separate chunky keyboard with its function keys in a block down the left and a
    // coiled cord, and a dot-matrix printer feeding striped fanfold paper. All original and unbranded.
    {
      const l = LAYOUT.pc, x = l.x, z = l.z, putty = "#cbbd97", dark = "#4a4136";
      solid(1.1, 0.08, 1.8, "#6b4a2b", x, Y + 0.72, z);
      for (const [dx, dz] of [[-0.45, -0.8], [0.45, -0.8], [-0.45, 0.8], [0.45, 0.8]]) solid(0.07, 0.72, 0.07, "#4c331d", x + dx, Y + 0.36, z + dz);
      const ux = x - 0.12, uz = z - 0.3;
      solid(0.5, 0.17, 0.78, putty, ux, Y + 0.845, uz);
      for (const dz of [-0.19, 0.19]) {
        solid(0.012, 0.11, 0.3, dark, ux + 0.255, Y + 0.85, uz + dz);
        solid(0.02, 0.02, 0.24, "#1c1a17", ux + 0.262, Y + 0.85, uz + dz);
        solid(0.03, 0.05, 0.03, "#1c1a17", ux + 0.27, Y + 0.85, uz + dz + 0.1);
      }
      solid(0.012, 0.02, 0.06, "#8a8070", ux + 0.256, Y + 0.79, uz - 0.34);
      solid(0.16, 0.05, 0.22, putty, ux - 0.02, Y + 0.955, uz);
      solid(0.4, 0.36, 0.44, "#bfb08a", ux - 0.04, Y + 1.16, uz);
      solid(0.02, 0.3, 0.38, "#2e2a22", ux + 0.165, Y + 1.17, uz);
      solid(0.012, 0.24, 0.31, "#0b2a12", ux + 0.177, Y + 1.17, uz, 0.6);
      for (let r = 0; r < 5; r++) solid(0.008, 0.018, 0.12 + ((r * 7) % 4) * 0.04, "#39ff6a", ux + 0.185, Y + 1.26 - r * 0.045, uz + 0.1 - ((r * 7) % 4) * 0.02, 1.3);
      solid(0.012, 0.03, 0.03, "#39ff6a", ux + 0.185, Y + 1.035, uz + 0.11, 1.3);
      const kx = x + 0.32, kz = z - 0.28;
      solid(0.22, 0.05, 0.6, putty, kx, Y + 0.785, kz);
      solid(0.16, 0.012, 0.12, "#6e6250", kx, Y + 0.816, kz + 0.22);
      for (let r = 0; r < 4; r++) solid(0.035, 0.014, 0.4, r === 3 ? "#5b5142" : "#8f8470", kx + 0.075 - r * 0.045, Y + 0.818, kz - 0.06);
      solid(0.03, 0.014, 0.2, "#8f8470", kx + 0.095, Y + 0.818, kz - 0.05);
      for (const [dx, dz] of [[0, 0], [0.05, 0.02], [0.1, -0.01]]) solid(0.04, 0.03, 0.03, "#2a2622", kx - 0.14 - dx, Y + 0.78, kz + 0.3 + dz);
      const px = x - 0.08, pz = z + 0.48;
      solid(0.36, 0.14, 0.5, "#d9cfb5", px, Y + 0.83, pz);
      solid(0.06, 0.06, 0.46, "#24211d", px - 0.05, Y + 0.92, pz);
      solid(0.01, 0.42, 0.4, "#f4f2ea", px - 0.1, Y + 1.15, pz);
      for (let r = 0; r < 4; r++) solid(0.012, 0.05, 0.4, "#cfe8c8", px - 0.095, Y + 1.0 + r * 0.1, pz);
      for (const dz of [-0.21, 0.21]) solid(0.013, 0.42, 0.012, "#c9c4b4", px - 0.096, Y + 1.15, pz + dz);
      solid(0.3, 0.12, 0.4, "#f1eee4", px - 0.02, Y + 0.06, pz);
      solid(0.012, 0.02, 0.04, "#ff9a3a", px + 0.181, Y + 0.85, pz - 0.18, 1.2);
      parts.driveLight = node(box(0.01, 0.022, 0.03, "#ff5a3a", 1.4), ux + 0.27, Y + 0.89, uz - 0.19, false);
      sign(EXHIBITS.pc.label, EXHIBITS.pc.sub, x + 0.35, Y + 1.75, z, FACE_X, 0.45);
    }
    // 4. The disks: a smoked-lid storage box on a low black cabinet, the five sleeves standing in its slots.
    {
      const l = LAYOUT.floppy, x = l.x, z = l.z;
      solid(0.7, 0.6, 0.9, "#1f1d24", x, Y + 0.3, z);
      solid(0.72, 0.02, 0.92, "#3a3742", x, Y + 0.61, z);
      solid(0.32, 0.16, 0.86, "#121115", x, Y + 0.7, z);
      const lid = node(box(0.3, 0.012, 0.86, "#5a5368", 0.15), x - 0.24, Y + 0.86, z);
      lid.rotation.z = 1.05;
      parts.diskY = Y + 0.84;
      for (const d of FLOPPY_DISKS) {
        const n = node(box(0.26, 0.26, 0.012, "#1d1d22"), x + 0.02, parts.diskY, z);
        addChild(n, createNode({ geometry: box(0.2, 0.06, 0.014, d.color), position: { x: 0, y: 0.08, z: 0 } }));
        addChild(n, createNode({ geometry: box(0.06, 0.06, 0.015, "#6f6a60"), position: { x: 0, y: -0.02, z: 0 } }));
        parts.disks.push(n);
      }
      sign(EXHIBITS.floppy.label, EXHIBITS.floppy.sub, x + 0.5, Y + 1.3, z, FACE_X, 0.4);
    }
    // 5. The maze: a sit-down cocktail-table cabinet (screen face up under glass, a stick and button at each end, a
    // stool on the far side), unlike the upright cabinets elsewhere. The walls are a pool of row runs (unit boxes
    // stretched along z), the player, four leaves and the gate small blocks on the screen.
    {
      const l = LAYOUT.maze, x = l.x, z = l.z, w = live.maze.size.w, h = live.maze.size.h;
      solid(0.6, 0.66, 0.7, "#2a2140", x, Y + 0.33, z);
      solid(0.74, 0.06, 0.94, "#16111f", x, Y + 0.69, z);
      solid(0.7, 0.012, 0.9, "#7fb3c8", x, Y + 0.726, z, 0.15);
      for (const s2 of [-1, 1]) {
        solid(0.12, 0.05, 0.36, "#e8c43a", x + s2 * 0.41, Y + 0.67, z);
        solid(0.03, 0.08, 0.03, "#111", x + s2 * 0.42, Y + 0.73, z + 0.08);
        solid(0.05, 0.05, 0.05, "#e2312f", x + s2 * 0.42, Y + 0.78, z + 0.08);
        solid(0.05, 0.02, 0.05, "#2f7fe2", x + s2 * 0.42, Y + 0.705, z - 0.08);
      }
      solid(0.32, 0.46, 0.32, "#c0306f", x - 0.6, Y + 0.23, z);
      solid(0.38, 0.06, 0.38, "#1a1520", x - 0.6, Y + 0.49, z);
      const p = 0.6 / w, sx = x - (h * p) / 2, sy = Y + 0.722;
      solid(h * p + 0.02, 0.006, w * p + 0.02, "#05040a", x, sy - 0.003, z);
      parts.mazeCell = (c, out) => { out.x = sx + (((c / w) | 0) + 0.5) * p; out.y = sy + 0.006; out.z = z + 0.3 - (c % w + 0.5) * p; return out; };
      parts.mazeRun = { sx, sy, z, p, w };
      let most = 0;
      for (const m of live.maze.mazes) most = Math.max(most, mazeRuns(m.grid, w, h, null));
      for (let i = 0; i < most; i++) parts.runs.push(node(box(p, 0.006, p, "#3a5cff", 0.9), sx, sy, z, false));
      parts.player = node(box(p * 0.8, 0.012, p * 0.8, "#ffe14a", 1.4), sx, sy, z);
      for (let i = 0; i < MAZE.leaves; i++) parts.leaves.push(node(box(p * 0.6, 0.012, p * 0.6, "#6aff7a", 1.4), sx, sy, z));
      parts.gate = node(box(p * 0.9, 0.012, p * 0.9, "#ff5a4a", 1.2), sx, sy, z);
      parts.cell = { x: 0, y: 0, z: 0 };
      sign(EXHIBITS.maze.label, EXHIBITS.maze.sub, x + 0.5, Y + 1.5, z, FACE_X, 0.42);
    }
    buildDecor(kit);
    return parts;
  };
  // --- Era decor ----------------------------------------------------------------------------------------------------
  // Original set dressing in a 1980s style, making no claims and naming nothing: on the cave's back wall a neon sunset
  // over a wireframe grid, neon strips along the wall's foot and top and four framed posters of original art; a lounge
  // corner (a checked rug, a teal sofa, a glass coffee table, a beanbag, a neon floor lamp, a potted palm) under a
  // neon triangle and ring hung on chains; and a bright shelf unit holding a portable stereo, cassettes and a corded
  // phone. Emissive colour only, no lights. Built once a visit; nothing moves.
  const WALL_X = -33.9;
  const buildDecor = (kit) => {
    const { top: Y, M, createNode, place, solid } = kit;
    const tilt = (w, h, d, color, x, y, z, rx, emissive = 0) => place(createNode({ geometry: M.box({ w, h, d, color, emissive }), position: { x, y, z }, rotation: { x: rx, y: 0, z: 0 } }));
    // A line in the wall's plane from (y0, z0) to (y1, z1), standing just off the wall.
    const line = (y0, z0, y1, z1, color, t = 0.06) => { const dy = y1 - y0, dz = z1 - z0; tilt(0.04, Math.hypot(dy, dz), t, color, WALL_X + 0.06, (y0 + y1) / 2, (z0 + z1) / 2, Math.atan2(dz, dy), 1.3); };
    // The neon sunset over a grid, on the wall at the end of the ramp's walkway.
    {
      const z = E.z, hy = Y + 3.4;
      solid(0.08, 5.2, 8.4, "#120a1e", WALL_X - 0.02, Y + 3.9, z);
      const sun = ["#ff4fa3", "#ff5f8e", "#ff7577", "#ff8c63", "#ffa252", "#ffb94a"];
      for (let i = 0; i < 6; i++) { const r = 0.25 + i * 0.25, w = 2 * Math.sqrt(1.6 * 1.6 - r * r); solid(0.04, 0.14, w, sun[i], WALL_X + 0.04, hy + r, z, 1.2); }
      solid(0.04, 0.05, 8, "#3ff0ff", WALL_X + 0.05, hy, z, 1.4);
      for (let k = 1; k <= 3; k++) solid(0.04, 0.04, 8, "#3ff0ff", WALL_X + 0.05, hy - k * k * 0.22, z, 1.2);
      for (let k = -3; k <= 3; k++) line(hy, z, Y + 1.4, z + k * 1.25, "#3ff0ff", 0.04);
      for (const c of [-3, 3]) { line(hy, z + c - 1.1, hy + 1.1, z + c, "#c45bff"); line(hy + 1.1, z + c, hy, z + c + 1.1, "#c45bff"); }
    }
    // Neon strips along the wall's foot and top, the length of the bank past the gateway.
    solid(0.05, 0.08, 56, "#3ff0ff", WALL_X + 0.05, Y + 0.25, E.z - 6, 1.1);
    solid(0.05, 0.1, 56, "#ff4fd8", WALL_X + 0.05, Y + 7.2, E.z - 6, 1.1);
    // Four framed posters of original art, at eye height on the wall.
    const poster = (z, bg) => { solid(0.05, 1.9, 1.4, "#d8d8e4", WALL_X + 0.02, Y + 2.4, z); solid(0.06, 1.74, 1.24, bg, WALL_X + 0.04, Y + 2.4, z); return WALL_X + 0.08; };
    {
      // Shapes: a zigzag, dots and a stepped triangle.
      const z = E.z + 19, px = poster(z, "#14121c");
      line(Y + 2.9, z - 0.45, Y + 2.6, z - 0.15, "#ffe14a"); line(Y + 2.6, z - 0.15, Y + 2.9, z + 0.15, "#ffe14a"); line(Y + 2.9, z + 0.15, Y + 2.6, z + 0.45, "#ffe14a");
      for (const [dy, dz] of [[0.2, -0.4], [0.05, 0.3], [-0.2, -0.1], [-0.05, 0.45]]) solid(0.02, 0.08, 0.08, "#ff5fa8", px, Y + 2.4 + dy, z + dz, 0.6);
      for (let i = 0; i < 4; i++) solid(0.02, 0.1, 0.7 - i * 0.17, "#2fd1c4", px, Y + 1.85 + i * 0.1, z, 0.4);
    }
    {
      // A pixel Ooga's face.
      const z = E.z + 6, px = poster(z, "#1e8f86");
      solid(0.02, 0.5, 0.6, "#d9a56b", px, Y + 2.35, z);
      solid(0.025, 0.18, 0.68, "#4a2c18", px + 0.005, Y + 2.68, z);
      for (const dz of [-0.14, 0.14]) solid(0.025, 0.1, 0.1, "#1a1210", px + 0.005, Y + 2.42, z + dz);
      solid(0.025, 0.05, 0.28, "#7a2b22", px + 0.005, Y + 2.2, z);
    }
    {
      // A palm against a striped sun.
      const z = E.z - 14, px = poster(z, "#1d1846");
      for (let i = 0; i < 3; i++) solid(0.02, 0.08, 0.7 - i * 0.18, ["#ffb14a", "#ff8a5c", "#ff5f8e"][i], px, Y + 2.75 - i * 0.14, z + 0.15, 0.7);
      line(Y + 1.7, z - 0.2, Y + 2.7, z - 0.05, "#3b2412", 0.05);
      for (const [dy, dz] of [[2.75, -0.45], [2.85, 0.25], [2.55, 0.3]]) line(Y + 2.7, z - 0.05, Y + dy, z + dz, "#38c46a", 0.05);
    }
    {
      // Checks and a ring of bars.
      const z = E.z - 22, px = poster(z, "#f2ece0");
      for (let r = 0; r < 2; r++) for (let c = 0; c < 4; c++) if ((r + c) % 2) solid(0.02, 0.18, 0.2, "#16141c", px, Y + 1.9 + r * 0.18, z - 0.3 + c * 0.2);
      for (let i = 0; i < 4; i++) solid(0.02, 0.06, [0.3, 0.5, 0.5, 0.3][i], "#e2312f", px, Y + 2.55 + i * 0.12, z);
    }
    // The lounge corner, its back to the wall side.
    {
      const x = LOUNGE.x, z = LOUNGE.z;
      for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) solid(1.0, 0.02, 1.0, (r + c) % 2 ? "#1b1b2b" : "#e8e3d8", x - 1 + r, Y + 0.01, z - 1 + c);
      solid(0.9, 0.42, 2.8, "#2fb5a8", x - 2.55, Y + 0.21, z);
      solid(0.25, 0.55, 2.8, "#27998e", x - 2.88, Y + 0.6, z);
      for (const dz of [-1.3, 1.3]) solid(0.9, 0.3, 0.2, "#27998e", x - 2.55, Y + 0.57, z + dz);
      for (const dz of [-0.6, 0.6]) solid(0.12, 0.35, 0.5, "#ff5fa8", x - 2.68, Y + 0.6, z + dz);
      solid(0.7, 0.04, 1.3, "#9fd8e6", x - 0.8, Y + 0.42, z, 0.2);
      for (const dz of [-0.5, 0.5]) solid(0.4, 0.4, 0.12, "#1a1a22", x - 0.8, Y + 0.2, z + dz);
      solid(0.8, 0.32, 0.8, "#c43bd1", x + 0.9, Y + 0.16, z + 1.5);
      solid(0.6, 0.18, 0.6, "#d24fe0", x + 0.9, Y + 0.41, z + 1.5);
      solid(0.3, 0.06, 0.3, "#202028", x - 2.75, Y + 0.03, z - 2.05);
      solid(0.05, 1.5, 0.05, "#202028", x - 2.75, Y + 0.8, z - 2.05);
      solid(0.09, 0.7, 0.09, "#ff4fd8", x - 2.75, Y + 1.9, z - 2.05, 1.4);
      solid(0.45, 0.45, 0.45, "#e07a3c", x - 2.7, Y + 0.23, z + 2.2);
      solid(0.08, 1.2, 0.08, "#6b4a2b", x - 2.7, Y + 1.05, z + 2.2);
      for (const [dx, dz] of [[0.35, 0], [-0.35, 0], [0, 0.35], [0, -0.35]]) solid(dx ? 0.6 : 0.14, 0.06, dz ? 0.6 : 0.14, "#2f9a4f", x - 2.7 + dx / 2, Y + 1.62, z + 2.2 + dz / 2);
      // Hung on chains high over it: a neon triangle and a neon ring of eight bars.
      const hy = Y + 6.2;
      for (const dz of [-1, 1]) solid(0.04, 1.5, 0.04, "#2a2630", x - 1, Y + 7.25, z + dz);
      const tri = (y0, z0, y1, z1) => { const dy = y1 - y0, dz = z1 - z0; tilt(0.06, Math.hypot(dy, dz), 0.08, "#3ff0ff", x - 1, (y0 + y1) / 2, (z0 + z1) / 2, Math.atan2(dz, dy), 1.4); };
      tri(hy - 0.7, z - 1, hy - 0.7, z + 1); tri(hy - 0.7, z - 1, hy + 0.9, z); tri(hy - 0.7, z + 1, hy + 0.9, z);
      for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; tilt(0.06, 0.5, 0.06, "#ff4fd8", x - 1.05, hy - 0.05 + Math.cos(a) * 0.6, z + Math.sin(a) * 0.6, -a + Math.PI / 2, 1.4); }
    }
    // The shelf unit against the wall, in mismatched bright blocks, with its small props.
    {
      const x = SHELF.x, z = SHELF.z;
      for (const dz of [-1.2, 0.1, 1.2]) solid(0.6, 2.4, 0.08, dz > 1 ? "#ffe14a" : "#2fd1c4", x, Y + 1.2, z + dz);
      for (const [dy, c] of [[0.05, "#16141c"], [0.85, "#ff5fa8"], [1.6, "#3a5cff"], [2.4, "#16141c"]]) solid(0.6, 0.06, 2.5, c, x, Y + dy, z);
      // A portable stereo: its body, two speakers, a tape door and a handle.
      solid(0.22, 0.3, 0.8, "#2a2a30", x + 0.05, Y + 1.04, z - 0.55);
      for (const dz of [-0.25, 0.25]) solid(0.02, 0.2, 0.2, "#8a8a96", x + 0.17, Y + 1.04, z - 0.55 + dz);
      solid(0.02, 0.1, 0.18, "#4a4a56", x + 0.17, Y + 1.07, z - 0.55);
      solid(0.04, 0.04, 0.6, "#c0c0cc", x + 0.05, Y + 1.24, z - 0.55);
      // Cassettes in a stack.
      for (let i = 0; i < 4; i++) solid(0.18, 0.03, 0.28, ["#ff5fa8", "#ffe14a", "#2fd1c4", "#f2ece0"][i], x + 0.05, Y + 1.65 + i * 0.032, z + 0.6);
      // A corded phone: its base, handset and coil.
      solid(0.2, 0.1, 0.26, "#e2312f", x + 0.05, Y + 0.13, z + 0.65);
      solid(0.06, 0.06, 0.3, "#e2312f", x + 0.08, Y + 0.21, z + 0.65);
      for (let i = 0; i < 3; i++) solid(0.03, 0.03, 0.03, "#b02420", x + 0.16, Y + 0.12 - i * 0.03, z + 0.82 + i * 0.03);
    }
  };

  // --- Finer parts -----------------------------------------------------------------------------------------------
  // Each exhibit's trims, frames, keys and small props as one merged mesh at its own spot, in its own frame (y from the
  // floor, +x toward the stream), clear of every part that moves or lights. The layout's dry run and the checks' kits
  // have no models, so they get a bare node at the same spot: every run counts the same pieces.
  const detail = (kit, x, y, z, make) => {
    const nd = kit.createNode(kit.M.merge ? { geometry: kit.M.merge(...make(kit.M)) } : {});
    nd.position.x = x; nd.position.y = y; nd.position.z = z;
    return kit.place(nd);
  };
  const B = (M, w, h, d, color, x, y, z, emissive = 0) => M.box({ w, h, d, color, emissive, offset: { x, y, z } });
  const buildDetail = (kit) => {
    const Y = kit.top, at = (key) => LAYOUT[key];
    // The Merkle table: the board's frame and its brass header, a tag for each level, the table's aprons and feet, a
    // brass rail and number tabs for the record cards, and the root lamp's bezel, hood and plate.
    detail(kit, at("merkle").x, Y, at("merkle").z, (M) => [B(M, 0.16, 0.1, 3.96, "#3d2f20", -0.74, 2.8, 0), ...[-1, 1].map((s) => B(M, 0.16, 1.96, 0.08, "#3d2f20", -0.74, 1.82, s * 1.94)),
      B(M, 0.02, 0.1, 1.0, "#c9a35a", -0.705, 2.7, 0, 0.25), ...[2.5, 2.05, 1.6, 1.15].map((y) => B(M, 0.02, 0.06, 0.06, "#c9a35a", -0.705, y, 1.85, 0.2)),
      B(M, 0.04, 0.12, 3.6, "#4a3826", 0.79, 0.7, 0), ...[-1, 1].map((s) => B(M, 1.5, 0.12, 0.04, "#4a3826", 0, 0.7, s * 1.88)),
      ...[[-0.7, -1.8], [0.7, -1.8], [-0.7, 1.8], [0.7, 1.8]].map(([dx, dz]) => B(M, 0.13, 0.04, 0.13, "#2a2018", dx, 0.02, dz)),
      B(M, 0.03, 0.03, 3.5, "#c9a35a", 0.54, 0.855, 0, 0.15), ...Array.from({ length: LEAVES }, (_, i) => B(M, 0.06, 0.012, 0.06, "#4b3d68", 0.06, 0.866, 1.7 - 0.425 * (i + 0.5))),
      B(M, 0.36, 0.05, 0.36, "#2a2230", -0.75, 2.4, -2.15), B(M, 0.36, 0.05, 0.36, "#2a2230", -0.75, 2.71, -2.15), B(M, 0.02, 0.08, 0.24, "#c9a35a", -0.59, 2.2, -2.15, 0.2)]);
    // The blind-stamp desk: drawers with brass pulls, an edge trim, an ink pad and a stack of envelopes, the signer's
    // screen with its cap, its envelope slot and the spent list pinned to it, the lamps' hood and the stamp's base.
    detail(kit, at("blind").x, Y, at("blind").z, (M) => [...[-1, 1].flatMap((s) => [B(M, 0.03, 0.14, 0.8, "#7b5634", 0.715, 0.65, s * 0.7), B(M, 0.03, 0.03, 0.14, "#c9a35a", 0.735, 0.65, s * 0.7, 0.2)]),
      B(M, 0.03, 0.03, 2.62, "#c9a35a", 0.715, 0.8, 0, 0.1), B(M, 0.16, 0.03, 0.22, "#2a2230", 0.3, 0.835, -0.85), B(M, 0.12, 0.01, 0.18, "#7a1f2e", 0.3, 0.855, -0.85),
      B(M, 0.3, 0.05, 0.22, "#8e7ab8", 0.4, 0.845, 1.0), B(M, 0.3, 0.005, 0.02, "#6a5a8e", 0.4, 0.873, 1.0),
      B(M, 0.1, 0.05, 2.66, "#2a2230", -0.66, 2.045, 0), B(M, 0.08, 0.06, 0.5, "#141018", -0.66, 0.93, -0.2),
      B(M, 0.01, 0.5, 0.34, "#f5f0e2", -0.625, 1.5, 0.55), ...[0, 1, 2, 3, 4].map((k) => B(M, 0.012, 0.012, 0.24, k ? "#5a5068" : "#d0304a", -0.618, 1.68 - k * 0.08, 0.55)),
      B(M, 0.26, 0.04, 0.26, "#2a2230", -0.6, 2.33, 0.9), B(M, 0.16, 0.03, 0.16, "#2a2230", -0.6, 0.835, -0.2)]);
    // The office PC's desk: a drawer and its pull, a front trim, a mug, a floppy lying out, a notepad and pencil.
    detail(kit, at("pc").x, Y, at("pc").z, (M) => [B(M, 0.03, 0.12, 0.5, "#5a3c22", 0.565, 0.6, 0.5), B(M, 0.03, 0.025, 0.12, "#c9a35a", 0.585, 0.6, 0.5, 0.15),
      B(M, 0.03, 0.03, 1.82, "#4c331d", 0.565, 0.73, 0), B(M, 0.08, 0.1, 0.08, "#e2312f", 0.42, 0.81, 0.62), B(M, 0.02, 0.05, 0.03, "#e2312f", 0.42, 0.81, 0.675),
      B(M, 0.06, 0.005, 0.06, "#3a2414", 0.42, 0.862, 0.62), B(M, 0.14, 0.006, 0.14, "#1d1d22", 0.36, 0.763, 0.2), B(M, 0.1, 0.004, 0.03, "#5fb36a", 0.36, 0.768, 0.25),
      B(M, 0.12, 0.008, 0.16, "#f5ecb8", 0.38, 0.764, -0.75), B(M, 0.012, 0.012, 0.14, "#ffd23a", 0.43, 0.772, -0.75)]);
    // The disk box's cabinet: doors and handles, a plinth, the box's label strip and the lid's hinge.
    detail(kit, at("floppy").x, Y, at("floppy").z, (M) => [...[-1, 1].flatMap((s) => [B(M, 0.02, 0.46, 0.42, "#2a2830", 0.36, 0.3, s * 0.215), B(M, 0.03, 0.1, 0.03, "#c0c0cc", 0.375, 0.34, s * 0.04)]),
      B(M, 0.74, 0.05, 0.94, "#0c0b10", 0, 0.025, 0), B(M, 0.01, 0.05, 0.3, "#efe6cf", 0.165, 0.7, 0), B(M, 0.03, 0.03, 0.86, "#3a3742", -0.16, 0.79, 0)]);
    // The maze's cocktail cabinet: a coin door and slots on one end, a speaker grille on the other, glowing side trim,
    // a kick plate, chrome edges round the glass (never over it), and the stool's chrome ring and foot.
    detail(kit, at("maze").x, Y, at("maze").z, (M) => [B(M, 0.22, 0.26, 0.02, "#141018", 0, 0.34, 0.36), ...[-1, 1].map((s) => B(M, 0.03, 0.06, 0.012, "#ff8a2a", s * 0.05, 0.4, 0.372, 0.9)),
      B(M, 0.08, 0.04, 0.012, "#3a3742", 0, 0.27, 0.372), B(M, 0.24, 0.12, 0.02, "#141018", 0, 0.5, -0.36), ...[0, 1, 2].map((k) => B(M, 0.2, 0.012, 0.012, "#3a3742", 0, 0.47 + k * 0.03, -0.372)),
      ...[-1, 1].map((s) => B(M, 0.62, 0.02, 0.02, "#ff4fd8", 0, 0.6, s * 0.355, 1.0)), B(M, 0.64, 0.06, 0.74, "#0c0b10", 0, 0.03, 0),
      ...[-1, 1].flatMap((s) => [B(M, 0.76, 0.02, 0.02, "#c0c0cc", 0, 0.72, s * 0.48), B(M, 0.02, 0.02, 0.96, "#c0c0cc", s * 0.38, 0.72, 0)]),
      B(M, 0.36, 0.03, 0.36, "#c0c0cc", -0.6, 0.44, 0), B(M, 0.4, 0.03, 0.4, "#1a1520", -0.6, 0.015, 0)]);
  };

  // The horizontal runs of wall in a maze grid; with `lay`, calls lay(i, row, col, length) for each. Returns the count.
  const mazeRuns = (grid, w, h, lay) => {
    let n = 0;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (!grid[y * w + x] || (x > 0 && grid[y * w + x - 1])) continue;
      let len = 1; while (x + len < w && grid[y * w + x + len]) len++;
      if (lay) lay(n, y, x, len);
      n++;
    }
    return n;
  };

  // Poses the models from the live state: allocation-free (the runs are re-laid only when the maze changes), with a
  // fixed node count. `calm` stills the stamp's press; the lit tiles do not move.
  const sync = (parts, live, dt, calm) => {
    parts.phase = (parts.phase + dt) % 1000;
    const m = live.merkle;
    for (let k = 1; k < 2 * LEAVES; k++) {
      parts.lit[k].visible = m.lit[k] === 1 || m.lit[k] === 3;
      parts.proofs[k].visible = m.lit[k] === 2;
    }
    for (let i = 0; i < LEAVES; i++) parts.marks[i].visible = m.leaves[i] !== RECORDS[i];
    const ok = m.matches();
    parts.rootOk.visible = ok; parts.rootBad.visible = !ok;
    const b = live.blind;
    parts.slip.visible = b.step === "written" || b.step === "opened";
    parts.slipMark.visible = b.step === "opened" && b.impression === SEAL;
    parts.envelope.visible = b.step === "sealed" || b.step === "stamped";
    parts.envMark.visible = b.step === "stamped";
    if (b.stampT > 0) b.stampT = Math.max(0, b.stampT - dt);
    const press = calm || b.stampT <= 0 ? 0 : Math.sin(Math.PI * (1 - b.stampT / STAMP_TIME));
    parts.stamp.position.y = parts.stampRest + (parts.stampLow - parts.stampRest) * press;
    parts.okLamp.visible = b.checked === true; parts.badLamp.visible = b.checked === false;
    const f = live.floppy, l = LAYOUT.floppy;
    for (let slot = 0; slot < f.order.length; slot++) {
      const d = f.order[slot], n = parts.disks[d];
      n.visible = f.loaded !== d;
      n.position.z = l.z - 0.32 + slot * 0.16;
    }
    parts.driveLight.visible = f.loaded >= 0;
    const z = live.maze, mz = z.maze();
    if (parts.mazeShown !== z.index) { parts.mazeShown = z.index; layRuns(parts, mz.grid, z.size.w, z.size.h); }
    const c = parts.cell;
    parts.mazeCell(z.at, c); parts.player.position.x = c.x; parts.player.position.y = c.y; parts.player.position.z = c.z;
    for (let i = 0; i < MAZE.leaves; i++) {
      const n = parts.leaves[i];
      n.visible = !z.got[i];
      parts.mazeCell(mz.leaves[i], c); n.position.x = c.x; n.position.y = c.y; n.position.z = c.z;
    }
    parts.mazeCell(mz.gate, c); parts.gate.position.x = c.x; parts.gate.position.y = c.y; parts.gate.position.z = c.z;
    parts.gate.visible = z.held() < MAZE.leaves && !z.won;
  };
  // Lays the pool of wall runs out for one maze and hides the rest. The callback is built once per visit.
  const layRuns = (parts, grid, w, h) => {
    const R = parts.mazeRun;
    if (!parts.lay) parts.lay = (i, row, col, len) => {
      const n = parts.runs[i];
      n.visible = true; n.scale.z = len;
      n.position.x = R.sx + (row + 0.5) * R.p; n.position.y = R.sy; n.position.z = R.z + 0.3 - (col + len / 2) * R.p;
    };
    const used = mazeRuns(grid, w, h, parts.lay);
    for (let i = used; i < parts.runs.length; i++) parts.runs[i].visible = false;
  };

  // --- Registration -------------------------------------------------------------------------------------------------
  // One visit's state and models; `update` runs only while the visitor is in this cave, `dispose` on leave.
  // The floor kept clear for the integrator's FUD Patrol console (about 3 x 3 m), in Era 2's own coordinates: on the
  // left bank just inside the arch (old u 10.5 to 13.5 down the gallery, v 9.25 to 12.25 out from the old stream's
  // edge), clear of the gateway, the lamp posts and every Era 2 exhibit. Nothing of Era 2's stands in it.
  const FUD_PATROL_ZONE = { x0: -12, x1: -9, z0: E.z1 - 13.5, z1: E.z1 - 10.5 };
  // The upgrade cluster (genesis-era-2-cluster.js) and the spent-list counter (genesis-era-2-spent.js) are built here
  // when the page has loaded their files; without them, Era 2 builds as before.
  let visit = null;
  BL.genesisExhibits.register(ERA, {
    sources: SOURCES,
    overview: OVERVIEW,
    build(kit) {
      const live = createLive(), parts = buildModels(kit, live);
      for (const o of footprints()) kit.obstacle(o.x0, o.x1, o.z0, o.z1);
      for (const key of PROPS) {
        const ex = EXHIBITS[key], l = LAYOUT[key];
        kit.prop({ id: ex.id, year: ex.year, connection: ex.connection, ...(ex.ref ? { ref: ex.ref } : {}), date: ex.date, title: ex.title, label: ex.label,
          sourceKeys: ex.sourceKeys, at: walkUp(key, kit.top), reach: l.reach, pick: { w: l.half.x * 2, h: l.h, d: l.half.z * 2, x: l.x, z: l.z },
          short: ex.short, deeper: ex.deeper, onUse: () => ({ terminal: live.terminals[key] }) });
      }
      sync(parts, live, 0, true);
      const cluster = BL.genesisEra2Cluster;
      visit = { live, parts, cluster: cluster ? cluster.build(kit) : null, spent: null };
      buildDetail(kit);
      // The spent-list counter (genesis-era-2-spent.js), built when the page has loaded its file.
      if (BL.genesisEra2Spent) visit.spent = BL.genesisEra2Spent.build(kit);
    },
    update(dt, elapsed, state) {
      if (!visit) return;
      sync(visit.parts, visit.live, dt, state.calm === true);
      if (visit.cluster) BL.genesisEra2Cluster.update(visit.cluster, dt, state);
    },
    dispose() { visit = null; }
  });

  BL.genesisEra2 = { ERA, YEARS, NAME, SOURCES, OVERVIEW, HELD, FUD_PATROL_ZONE, RECORDS, SEAL, PC_FILES, PC_YEAR, FLOPPY_DISKS, MAZE, EXHIBITS, LAYOUT, PROPS,
    sourceOf, createMerkle, createBlind, createPc, createFloppies, createMaze, merkleTerminal, blindTerminal, floppyTerminal, mazeTerminal,
    createLive, footprints, walkUp, buildModels, sync, get visit() { return visit; } };
})();
