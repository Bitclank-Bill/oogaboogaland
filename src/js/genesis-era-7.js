// Era 7's cave in the Genesis Voyage, Genesis (3–12 January 2009), built through the era exhibit kit
// (genesis-exhibits.js: BL.genesisExhibits.register(7, { sources, overview, build(kit), update, active, dispose })).
// Facts from the Era 7 dossier (docs/genesis-voyage/eras/era-7-genesis.md, branch gv/research), its three exhibit
// entries only; every claim carries one of the source keys in SOURCES.
//
// Three islands, each a device (a terminal) and a panel lectern (In short, Deeper story, Unsolved, Sources):
// - THE FIRST BLOCK (left bank, upstream): a record case showing the genesis block's stored fields, its embedded
//   headline as recorded data, and why its output is special. All times are labelled block-header timestamps.
// - THE SOFTWARE DESK (right bank): the 8 January 2009 release announcement, and an invented network of three
//   simulated terminals that unplug, catch up and compare records. Nothing real: no ports, downloads, mining,
//   wallets or payments.
// - AN EARLY TEST PAYMENT (left bank, downstream): a counting table that splits 50 counters into 10 and 40, with
//   block 170's recorded amounts beside Hal Finney's 2013 recollection. Names are not in the chain's records.
//
// Every exhibit is context (an implementation milestone after the whitepaper), so none joins the Steps toward
// Bitcoin trail. The shared signage gives the cave its years sign, pylons and overview board; this era builds none.
// Models are original, unbranded kit boxes; emissive only, no point lights, no sound, no timers, no listeners.
(() => {
  "use strict";
  const BL = window.BL = window.BL || {};
  const G = BL.genesisVoyage, GP = BL.genesisProps, GW = BL.genesisWorld;
  const ERA = 7, YEARS = "3–12 January 2009", NAME = "Genesis";

  // --- Sources ------------------------------------------------------------------------------------------------------
  // The Core file is pinned to the v28.0 release commit (read for this build: the headline string, the genesis
  // parameters and the comment on its output). The chain-data endpoints and the two documents were read directly by
  // the dossier; this build could not reopen the chain endpoints.
  const DOSSIER = "https://github.com/Bitcoin-Bill/oogaboogaland/blob/gv/research/docs/genesis-voyage/eras/era-7-genesis.md";
  const CORE_REV = "110183746150428e6385880c79f8c5733b1361ba";
  const GENESIS_HASH = "000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f";
  const B170_HASH = "00000000d1145790a8694403d4063f323d499e655c83426834d4ce2f8dd4a2ee";
  const SOURCES = {
    "E7-GEN": { label: "Bitcoin Core source code, src/kernel/chainparams.cpp at the v28.0 release commit 1101837 (genesis parameters, headline string and output comment)",
      href: `https://github.com/bitcoin/bitcoin/blob/${CORE_REV}/src/kernel/chainparams.cpp`, kind: "context", verified: true, marks: "a modern implementation file that rebuilds the 2009 block", locator: "lines 60–75 and 135" },
    "E7-GEN-DATA": { label: "Blockstream block explorer API, the genesis block as JSON (chain data)",
      href: `https://blockstream.info/api/block/${GENESIS_HASH}`, kind: "context", verified: true, marks: "header timestamp 1231006505", locator: "timestamp field" },
    "E7-REL": { label: "Satoshi Nakamoto, release announcement email, 8 January 2009 (Satoshi Nakamoto Institute archive)",
      href: "https://satoshi.nakamotoinstitute.org/emails/cryptography/16/", kind: "context", verified: true, marks: "archived timestamp 8 January 2009, 19:27:40 UTC", locator: "email text" },
    "E7-170": { label: "Blockstream block explorer API, block 170 as JSON (chain data)",
      href: `https://blockstream.info/api/block/${B170_HASH}`, kind: "context", verified: true, marks: "header timestamp 1231731025", locator: "timestamp field" },
    "E7-170-TXS": { label: "Blockstream block explorer API, block 170's transactions as JSON (chain data)",
      href: `https://blockstream.info/api/block/${B170_HASH}/txs`, kind: "context", verified: true, marks: "outputs of 1000000000 and 4000000000 satoshis", locator: "transaction f4184fc5…" },
    "E7-FIN": { label: "Hal Finney, Bitcoin and Me, posted 19 March 2013 (Satoshi Nakamoto Institute library)",
      href: "https://nakamotoinstitute.org/library/bitcoin-and-me/", kind: "context", verified: true, marks: "a first-person recollection written in 2013", locator: "essay text" },
    "E7-DOSSIER": { label: "Museum research record: Genesis Voyage Era 7 dossier (original demonstrations and their limits)",
      href: DOSSIER, kind: "context", verified: true, marks: "written 31 October 2026", locator: "Period gear; Easter eggs" }
  };
  const sourceOf = (key) => GP.sourceOf(key) || SOURCES[key] || null;
  const sourceLines = (keys) => keys.map((k) => `[${k}] ${sourceOf(k).label}`);

  const clean = GP.clean;
  const words = (input) => { const s = input.indexOf(" "); return [(s < 0 ? input : input.slice(0, s)).toUpperCase(), s < 0 ? "" : input.slice(s + 1).trim()]; };
  // A Unix timestamp as "YYYY-MM-DD HH:MM:SS", shifted by `hours` (0 for UTC).
  const stamp = (seconds, hours = 0) => new Date((seconds + hours * 3600) * 1000).toISOString().replace("T", " ").slice(0, 19);

  // --- Recorded data ------------------------------------------------------------------------------------------------
  const GENESIS = { version: 1, time: 1231006505, bits: "1d00ffff", nonce: 2083236893, reward: 50, hash: GENESIS_HASH,
    headline: "The Times 03/Jan/2009 Chancellor on brink of second bailout for banks" };
  const B170 = { height: 170, time: 1231731025, hash: B170_HASH, txid: "f4184fc596403b9d638783cf57adfe4c75c605f6356fbc91338530e9831e9e16",
    input: 50, outputs: [10, 40], sats: [1000000000, 4000000000] };
  const RELEASE = { when: "8 January 2009, 19:27:40 UTC", quote: "Windows only for now. Open source C++ code is included." };
  const HEADER_NOTE = "This is a block-header timestamp: a value written into the record, not an independently observed time of mining.";

  // --- The exhibits' words ------------------------------------------------------------------------------------------
  // Each island: its device (`title`, `label`, `sub`, `hint`, `howTo`) and its panel (`panel`: { room, pages }), with
  // `date` (what the year marks) and `sourceKeys`.
  const EXHIBITS = {
    genesis: { id: "e7-genesis", panelId: "e7-genesis-panel", year: 2009, title: "The first block record case", panelTitle: "The first block panel",
      label: "THE FIRST BLOCK · 2009", sub: "3 January 2009 · block-header timestamp",
      date: "3 January 2009, 18:15:05 UTC: the genesis block's header timestamp (Unix 1231006505), a value in the record, not an observed mining time",
      sourceKeys: ["E7-GEN", "E7-GEN-DATA"],
      hint: "Type TEXT to read the words stored inside the first block.",
      howTo: ["Type HEADER to light the block's stored fields.", "Type TIME to turn its timestamp number into a date.",
        "Type TEXT for the embedded headline, then OUTPUT.", "RESET dims the case again."],
      panel: { room: "The first block - 2009", pages: [
        { caption: "In short", title: "3 January 2009 18:15:05 UTC", text: [
          "Bitcoin's chain begins with one special block, the genesis block. Its block-header timestamp reads 3 January 2009, 18:15:05 UTC.",
          "That time is a field written into the record (Unix 1231006505), not a stopwatch reading made by an independent witness."] },
        { caption: "Deeper story", title: "A record with words inside", text: [
          `Its first transaction carries a line of text as data: "${GENESIS.headline}".`,
          "The record stores those words. It does not explain why they were chosen, and this exhibit does not guess.",
          "Today's Bitcoin Core source code rebuilds this block from fixed values: the timestamp, a nonce of 2083236893 and a 50-coin output.",
          "Its comment says that output \"cannot be spent since it did not originally exist in the database\". The genesis output is special. It is not where the ten-coin test payment of 12 January 2009 came from."] },
        { caption: "Unsolved", title: "What one record cannot show", text: [
          "A header timestamp does not prove when the block was actually mined.",
          "One stored block is not evidence that a large network was already running. The software itself was announced five days later, on 8 January 2009.",
          "The Core file is a modern implementation source, pinned here to one release commit, read alongside chain data."] },
        { caption: "Sources", title: "Where this comes from", text: sourceLines(["E7-GEN", "E7-GEN-DATA"]) }] } },
    desk: { id: "e7-desk", panelId: "e7-desk-panel", year: 2009, title: "The software desk", panelTitle: "The software desk panel",
      label: "THE SOFTWARE DESK · 2009", sub: "8 January 2009 · release announcement",
      date: "8 January 2009, 19:27:40 UTC: the archived timestamp of the email announcing the first Bitcoin software release",
      sourceKeys: ["E7-REL", "E7-DOSSIER"],
      hint: "Type UNPLUG B, then ADD A, then PLUG B and COMPARE.",
      howTo: ["Type COMPARE to see the three pretend terminals agree.", "Type UNPLUG B, then ADD A to make a new record while B is away.",
        "Type PLUG B: it checks the links and catches up. COMPARE again.", "Try BAD to see a broken record refused. RESET starts over."],
      panel: { room: "The software desk - 2009", pages: [
        { caption: "In short", title: "8 January 2009 19:27:40 UTC", text: [
          "That is the archived timestamp of the email announcing the first Bitcoin software release.",
          "It was experimental software for Windows, with its source code included."] },
        { caption: "Deeper story", title: "Three separate events", text: [
          `The email says: "${RELEASE.quote}"`,
          "This is a separate event from the whitepaper of October 2008 (Era 6) and from the first block's header timestamp of 3 January 2009.",
          "The three terminals on this desk are invented. They show computers comparing records, one going offline and catching up when it returns. They copy no real program's screens."] },
        { caption: "Unsolved", title: "Experimental means untested", text: [
          "The announcement calls the software experimental: a release is not a promise that it works without bugs.",
          "This desk does not rebuild or run the original program. Its simulation leaves out almost all of the real checks.",
          "Some later histories write 9 January. This exhibit keeps the email's own archived timestamp, in UTC."] },
        { caption: "Sources", title: "Where this comes from", text: sourceLines(["E7-REL", "E7-DOSSIER"]) }] } },
    payment: { id: "e7-payment", panelId: "e7-payment-panel", year: 2009, title: "The counting table", panelTitle: "The early test payment panel",
      label: "AN EARLY TEST PAYMENT · 2009", sub: "block 170 · 12 January 2009 UTC",
      date: "12 January 2009, 03:30:25 UTC: block 170's header timestamp, still 11 January in American time zones; Finney's recollection was posted 19 March 2013",
      sourceKeys: ["E7-170", "E7-170-TXS", "E7-FIN"],
      hint: "Type SPLIT to move 50 counters into 10 and 40.",
      howTo: ["Type RECORD to read what block 170 stores.", "Type SPLIT: the 50 counters move into piles of 10 and 40.",
        "Type CHECK to add the outputs back up, or TRY 25 to split another way.", "Type WHO to see where the human story comes from. RESET gathers them."],
      panel: { room: "An early test payment - 2009", pages: [
        { caption: "In short", title: "12 January 2009 03:30:25 UTC", text: [
          "Block 170's block-header timestamp reads 12 January 2009, 03:30:25 UTC. In American time zones it was still 11 January.",
          "The block records an early test payment: a 50-coin input split into outputs of 10 and 40 coins."] },
        { caption: "Deeper story", title: "Records and a recollection", text: [
          "The chain supplies the amounts and keys: transaction f4184fc5... pays 1,000,000,000 and 4,000,000,000 satoshis, which are 10 and 40 coins.",
          "Hal Finney's essay Bitcoin and Me, posted on 19 March 2013, supplies the human account: \"Satoshi sent ten coins to me as a test.\"",
          "Names are not written in the chain's records. Matching this output to that memory joins records with testimony.",
          "The genesis output of 3 January 2009 is not the source of this payment."] },
        { caption: "Unsolved", title: "Why not the first transaction", text: [
          "Transaction data alone cannot identify a person, and it cannot prove there were no earlier private tests.",
          "Every block before it already held a reward transaction, so this is an early test payment, not simply the first transaction.",
          "Finney wrote four years later. A recollection is testimony, and a header timestamp is not a measured broadcast time."] },
        { caption: "Sources", title: "Where this comes from", text: sourceLines(["E7-170", "E7-170-TXS", "E7-FIN"]) }] } }
  };
  const ISLANDS = ["genesis", "desk", "payment"];
  const howTo = (ex) => ["HOW TO USE", ...ex.howTo.map((step, i) => `${i + 1}. ${step}`), `HINT: ${ex.hint}`, ""];
  const panelLines = (ex) => [ex.panel.room, `${ex.date}.`, "Connection: context, an implementation milestone after the whitepaper.",
    ...ex.panel.pages.flatMap((p) => ["", `${p.caption}: ${p.title}`, ...p.text])];
  const boardOf = (ex) => ({ room: ex.panel.room, pages: ex.panel.pages, sources: ex.sourceKeys });

  // --- 1. The first block's record case -----------------------------------------------------------------------------
  // Rows of the case, each lit by a command: the header's fields, the embedded text and the output.
  const ROWS = ["version", "previous", "time", "bits", "nonce", "text", "output"];
  const createRecord = () => {
    const s = { lit: new Uint8Array(ROWS.length), version: 0 };
    const only = (...names) => { s.lit.fill(0); for (const n of names) s.lit[ROWS.indexOf(n)] = 1; s.version++; };
    const reset = () => only();
    return Object.assign(s, { only, reset });
  };
  const recordTerminal = (r) => {
    const ex = EXHIBITS.genesis;
    return {
      get banner() { return [...howTo(ex), ex.label, `${ex.date}.`, "", "A case showing the first block's stored record. Recorded data, simulated display.", ""]; },
      prompt: "BLOCK 0>",
      run: (line) => {
        const [cmd] = words(clean(line));
        if (!cmd) return { lines: [] };
        if (cmd === "HELP") return { lines: ["HEADER    the stored header fields", "TIME      the timestamp as a date", "TEXT      the words stored in the block",
          "OUTPUT    why the 50-coin output is special", "LINK      what comes before it", "MORE      the panel", "SOURCES   where this comes from", "RESET     dim the case"] };
        if (cmd === "RESET") { r.reset(); return { lines: ["The case is dim again."], reset: true }; }
        if (cmd === "MORE") return { lines: panelLines(ex) };
        if (cmd === "SOURCES") return { lines: sourceLines(ex.sourceKeys) };
        if (cmd === "HEADER") { r.only("version", "previous", "time", "bits", "nonce");
          return { lines: [`version    ${GENESIS.version}`, "previous   0000...0000 (none: nothing comes before it)", `time       ${GENESIS.time}`,
            `bits       ${GENESIS.bits}`, `nonce      ${GENESIS.nonce}`, `block      ${GENESIS.hash}`, "", HEADER_NOTE] }; }
        if (cmd === "TIME") { r.only("time");
          return { lines: [`${GENESIS.time} seconds after 1 January 1970 UTC`, `= ${stamp(GENESIS.time)} UTC, 3 January 2009 (block-header timestamp).`, "",
            HEADER_NOTE, "One stored time does not show that a large network was running then."] }; }
        if (cmd === "TEXT") { r.only("text");
          return { lines: ["Stored in the first transaction, as recorded data:", `  "${GENESIS.headline}"`, "",
            "The record keeps these words. It does not say why they were chosen; guesses about motives need other evidence."] }; }
        if (cmd === "OUTPUT") { r.only("output");
          return { lines: [`Output: ${GENESIS.reward} coins.`, "The Core source says it \"cannot be spent since it did not originally exist in the database\".",
            "So the genesis output is special. It is NOT the source of the ten-coin test payment on 12 January 2009 (see the counting table)."] }; }
        if (cmd === "LINK") { r.only("previous");
          return { lines: ["Every later block names the block before it. This one names none: its previous field is all zeros.",
            "That is what makes it the starting record of the chain."] }; }
        return { lines: ["Unknown command. Type HELP."] };
      }
    };
  };

  // --- 2. The software desk: three simulated terminals ------------------------------------------------------------
  // Invented peers A, B and C each keep a history of toy records; each record's link is the toy fingerprint of the
  // record before it. Online peers share every new record; an unplugged one keeps what it had, and on PLUG every online
  // peer checks the links of the longest history among them and copies what it lacks. Bounded at MAX_RECORDS. Nothing
  // here touches a network: it is plain arrays, and the panel says how much it leaves out.
  const PEERS = ["A", "B", "C"], MAX_RECORDS = 8, START = "start";
  const createNet = ({ hash = G.fingerprint } = {}) => {
    const s = { peers: PEERS.map((name) => ({ name, online: true, history: [] })), made: 0, rejected: 0, version: 0, blink: 0 };
    const linkOf = (history, i) => i === 0 ? START : history[i - 1].code;
    const reset = () => { for (const p of s.peers) { p.online = true; p.history.length = 0; } s.made = s.rejected = 0; s.version++; };
    const peer = (name) => s.peers.find((p) => p.name === String(name).toUpperCase()) || null;
    // Whether every record in `history` links to the one before it.
    const valid = (history) => history.every((rec, i) => rec.link === linkOf(history, i) && rec.code === hash(rec.link + "|" + rec.text));
    const longest = () => s.peers.filter((p) => p.online).reduce((best, p) => (!best || p.history.length > best.history.length ? p : best), null);
    const add = (name) => {
      const p = peer(name);
      if (!p) return { error: "Name a terminal: A, B or C." };
      if (!p.online) return { error: `Terminal ${p.name} is unplugged. PLUG ${p.name} first.` };
      if (p.history.length >= MAX_RECORDS) return { error: `This desk holds ${MAX_RECORDS} records. RESET to start over.` };
      const text = `record ${++s.made} from ${p.name}`, link = linkOf(p.history, p.history.length), rec = { text, link, code: hash(link + "|" + text) };
      const got = [];
      for (const q of s.peers) if (q.online) { q.history.push(rec); got.push(q.name); }
      s.version++; s.blink = 1;
      return { rec, got };
    };
    const unplug = (name) => {
      const p = peer(name);
      if (!p) return { error: "Name a terminal: A, B or C." };
      if (!p.online) return { error: `Terminal ${p.name} is already unplugged.` };
      p.online = false; s.version++;
      return { peer: p };
    };
    const plug = (name) => {
      const p = peer(name);
      if (!p) return { error: "Name a terminal: A, B or C." };
      if (p.online) return { error: `Terminal ${p.name} is already plugged in.` };
      p.online = true;
      const best = longest(), before = p.history.length;
      if (!valid(best.history)) return { error: "The longest history failed its link check." };
      for (const q of s.peers) if (q.online && q.history.length < best.history.length) for (let i = q.history.length; i < best.history.length; i++) q.history.push(best.history[i]);
      s.version++; s.blink = 1;
      return { peer: p, copied: p.history.length - before };
    };
    // A visiting terminal offers a record whose link does not match: every online peer checks it and refuses it.
    const bad = () => {
      const anyone = s.peers.find((p) => p.online);
      if (!anyone) return { error: "Nobody is plugged in to check it." };
      const text = "record that skips a link", link = hash("not the last record"), checked = [];
      for (const q of s.peers) if (q.online && link !== linkOf(q.history, q.history.length)) checked.push(q.name);
      s.rejected++; s.version++;
      return { text, link, checked };
    };
    const lastCode = (p) => p.history.length ? p.history[p.history.length - 1].code : START;
    const compare = () => {
      const best = s.peers.reduce((b, p) => Math.max(b, p.history.length), 0);
      return s.peers.map((p) => ({ name: p.name, online: p.online, count: p.history.length, last: lastCode(p), behind: p.history.length < best }));
    };
    const agree = () => { const c = compare(); return c.every((x) => x.last === c[0].last); };
    return Object.assign(s, { reset, peer, add, unplug, plug, bad, compare, agree, valid });
  };
  const netTerminal = (n) => {
    const ex = EXHIBITS.desk;
    const table = () => [...n.compare().map((x) => `  ${x.name}  ${x.online ? "plugged in" : "UNPLUGGED "}  ${x.count} record(s)  last ${x.last}${x.behind ? "  (behind)" : ""}`),
      n.agree() ? "All three hold the same history." : "They do not all hold the same history yet."];
    return {
      get banner() { return [...howTo(ex), ex.label, `${ex.date}.`, "", "Three invented terminals. A simulation only: no real network, ports, downloads, mining, wallets or payments.", "", ...table(), ""]; },
      prompt: "DESK>",
      run: (line) => {
        const [cmd, arg] = words(clean(line));
        if (!cmd) return { lines: [] };
        if (cmd === "HELP") return { lines: ["COMPARE     each terminal's records and last fingerprint", "ADD A       terminal A makes a new toy record", "UNPLUG B    take terminal B offline",
          "PLUG B      reconnect B: it checks links and catches up", "BAD         a visitor offers a record with a broken link", "RELEASE     the 8 January 2009 announcement",
          "MORE        the panel", "SOURCES     where this comes from", "RESET       start over"] };
        if (cmd === "RESET") { n.reset(); return { lines: ["All three terminals are plugged in with empty histories.", ...table()], reset: true }; }
        if (cmd === "MORE") return { lines: panelLines(ex) };
        if (cmd === "SOURCES") return { lines: sourceLines(ex.sourceKeys) };
        if (cmd === "COMPARE" || cmd === "STATUS") return { lines: table() };
        if (cmd === "RELEASE") return { lines: [`${RELEASE.when}: the archived timestamp of the release email.`, `It says: "${RELEASE.quote}"`,
          "Experimental software, separate from the October 2008 paper and the 3 January 2009 block.", "Nothing is downloaded or run here."] };
        if (cmd === "ADD") {
          const r = n.add(arg || "A");
          if (r.error) return { lines: [r.error] };
          return { lines: [`New "${r.rec.text}", linked to ${r.rec.link}, fingerprint ${r.rec.code}.`, `Received by: ${r.got.join(", ")}.`, ...table()], added: r };
        }
        if (cmd === "UNPLUG") {
          const r = n.unplug(arg);
          if (r.error) return { lines: [r.error] };
          return { lines: [`Terminal ${r.peer.name} is offline. It keeps the records it has, and misses new ones.`, ...table()] };
        }
        if (cmd === "PLUG") {
          const r = n.plug(arg);
          if (r.error) return { lines: [r.error] };
          return { lines: [`Terminal ${r.peer.name} is back. It checked the links and copied ${r.copied} record(s).`, ...table()], copied: r.copied };
        }
        if (cmd === "BAD") {
          const r = n.bad();
          if (r.error) return { lines: [r.error] };
          return { lines: [`A visiting terminal offers "${r.text}", linked to ${r.link}.`, `Refused by ${r.checked.join(", ")}: that link is not their last record's fingerprint.`,
            "Real software checks far more than one link; this desk leaves almost all of it out."], rejected: r };
        }
        return { lines: ["Unknown command. Type HELP."] };
      }
    };
  };

  // --- 3. The counting table: 50 counters into 10 and 40 ------------------------------------------------------------
  // Each counter sits in the input tray (0), output 1 (1) or output 2 (2). SPLIT is the recorded 10 + 40; TRY n puts n
  // in output 1 and the rest in output 2, a bounded exercise that always adds back to 50.
  const COUNTERS = B170.input;
  const createCounting = () => {
    const s = { dest: new Uint8Array(COUNTERS), first: 0, split: false, recorded: false, version: 0 };
    const set = (n) => { for (let i = 0; i < COUNTERS; i++) s.dest[i] = i < n ? 1 : 2; s.first = n; s.split = true; s.recorded = n === B170.outputs[0]; s.version++; };
    const reset = () => { s.dest.fill(0); s.first = 0; s.split = s.recorded = false; s.version++; };
    const count = (d) => { let c = 0; for (let i = 0; i < COUNTERS; i++) if (s.dest[i] === d) c++; return c; };
    return Object.assign(s, { set, reset, count });
  };
  const countingTerminal = (c) => {
    const ex = EXHIBITS.payment;
    const piles = () => c.split ? `Input tray 0 · output 1: ${c.count(1)} · output 2: ${c.count(2)}` : `Input tray ${c.count(0)} · outputs empty`;
    return {
      get banner() { return [...howTo(ex), ex.label, `${ex.date}.`, "", "Fifty counters stand for the 50-coin input. An original demonstration, not a wallet.", "", piles(), ""]; },
      prompt: "TABLE>",
      run: (line) => {
        const [cmd, arg] = words(clean(line));
        if (!cmd) return { lines: [] };
        if (cmd === "HELP") return { lines: ["RECORD     what block 170 stores", "SPLIT      the recorded split: 10 and 40", "TRY 25     split 50 another way (1 to 49)",
          "CHECK      add the outputs back up", "WHO        where the human story comes from", "MORE       the panel", "SOURCES    where this comes from", "RESET      gather the counters"] };
        if (cmd === "RESET") { c.reset(); return { lines: ["All 50 counters are back in the input tray.", piles()], reset: true }; }
        if (cmd === "MORE") return { lines: panelLines(ex) };
        if (cmd === "SOURCES") return { lines: sourceLines(ex.sourceKeys) };
        if (cmd === "RECORD") return { lines: [`Block ${B170.height}, header timestamp ${B170.time}`, `= ${stamp(B170.time)} UTC, 12 January 2009 (block-header timestamp).`,
          `  New York (UTC-5): ${stamp(B170.time, -5)}, still 11 January.`, `  Los Angeles (UTC-8): ${stamp(B170.time, -8)}, still 11 January.`,
          `Transaction ${B170.txid.slice(0, 16)}...`, `  input ${B170.input} coins -> outputs ${B170.sats[0]} and ${B170.sats[1]} satoshis (${B170.outputs[0]} and ${B170.outputs[1]} coins).`,
          "The record holds amounts and keys. It holds no names."] };
        if (cmd === "SPLIT") { c.set(B170.outputs[0]); return { lines: [`The recorded split: ${B170.outputs[0]} counters to output 1, ${B170.outputs[1]} to output 2.`, piles()] }; }
        if (cmd === "TRY") {
          if (!/^\d{1,2}$/.test(arg) || +arg < 1 || +arg > COUNTERS - 1) return { lines: [`Use TRY with a whole number from 1 to ${COUNTERS - 1}, e.g. TRY 25.`] };
          c.set(+arg);
          return { lines: [`${+arg} to output 1, ${COUNTERS - +arg} to output 2.`, piles(), c.recorded ? "That is the split block 170 records." : `Block 170 records ${B170.outputs[0]} and ${B170.outputs[1]}. SPLIT shows it.`] };
        }
        if (cmd === "CHECK") {
          if (!c.split) return { lines: ["Nothing is split yet. Type SPLIT first."] };
          return { lines: [`${c.count(1)} + ${c.count(2)} = ${c.count(1) + c.count(2)}: the outputs add back up to the ${COUNTERS}-counter input.`,
            "A real payment is checked in many more ways; this table shows only the arithmetic."] };
        }
        if (cmd === "WHO") return { lines: ["The chain supplies amounts and keys, not names.", "Hal Finney's recollection, posted 19 March 2013:",
          "  \"Satoshi sent ten coins to me as a test.\"", "Matching that memory to this ten-coin output joins records with testimony.",
          "The genesis output of 3 January 2009 is not the source of this payment."] };
        return { lines: ["Unknown command. Type HELP."] };
      }
    };
  };

  // --- The era's overview -------------------------------------------------------------------------------------------
  const OVERVIEW = {
    summary: "From a paper to running records. The first block's header timestamp says 3 January 2009; software was announced on 8 January; block 170, timestamped 12 January UTC, records an early test payment of 10 coins. Timestamps here are fields in records, not stopwatches.",
    sourceKeys: ["E7-GEN", "E7-GEN-DATA", "E7-REL", "E7-170", "E7-170-TXS", "E7-FIN", "E7-DOSSIER"],
    pages: [
      { caption: "Try", title: "Three islands", text: [
        "The first block (left bank, nearest the way in): read the stored fields and the words inside the genesis block.",
        "The software desk (right bank): unplug a pretend terminal, add a record, plug it back in and compare.",
        "An early test payment (left bank, past the dock): split 50 counters into 10 and 40."] },
      { caption: "Dates", title: "What each date marks", text: [
        "3 January 2009, 18:15:05 UTC: the genesis block's header timestamp.",
        "8 January 2009, 19:27:40 UTC: the archived timestamp of the release email.",
        "12 January 2009, 03:30:25 UTC: block 170's header timestamp, still 11 January in American time zones. 19 March 2013: Finney's recollection is posted."] },
      { caption: "Read", title: "Records and testimony", text: [
        "Chain records hold amounts, keys and stored times. They do not hold names or motives.",
        "All three are context: steps from the 2008 paper into running software, not whitepaper citations."] }
    ]
  };

  // --- Layout -------------------------------------------------------------------------------------------------------
  // Bank frame (genesis-world.js): u metres down the cave from its way in, v metres out from the stream's edge. The
  // islands stand at u 14 to 54 and v 5 to 17: clear of the gateway (u < 10), the dock and ramps (u 32 to 40, v < 6),
  // the lamp posts, the waterside walk (v < 1.5) and the far wall's sightline (nothing past u 56, nothing over 3 m).
  // `side` is -1 for the left bank and +1 for the right; models face the stream, toward -side in x. `half` is the footprint's half size
  // in x and z; `h` the height for the tap box; the walk-up point stands FRONT in front, toward the stream.
  const E = GW.ERAS[ERA], FRONT = 0.8, P = { x: 0, z: 0 };
  const at = (side, u, v) => { GW.bankToWorld(GW.bankFrame(ERA, side), u, v, P); return { x: P.x, z: P.z }; };
  const place = (side, u, v, half, h, reach) => ({ side, ...at(side, u, v), half, h, reach });
  const LAYOUT = {
    genesis: place(-1, 22, 9, { x: 0.7, z: 1.25 }, 2.4, 1.6),
    genesisPanel: place(-1, 16.5, 6.5, { x: 0.35, z: 0.55 }, 1.6, 1.4),
    desk: place(1, 23, 9, { x: 0.7, z: 1.15 }, 1.4, 1.6),
    deskPanel: place(1, 17.5, 6, { x: 0.35, z: 0.55 }, 1.6, 1.4),
    payment: place(-1, 49, 9, { x: 0.7, z: 1.3 }, 1.2, 1.6),
    paymentPanel: place(-1, 44.5, 6.5, { x: 0.35, z: 0.55 }, 1.6, 1.4)
  };
  // The software desk's peers stand inland of it, and a cable rail behind them; the islands' floors and lantern posts.
  const PEER_AT = [19.5, 23, 26.5].map((u) => at(1, u, 13)), RAIL = at(1, 23, 15.2), PEER_HALF = 0.32;
  const FLOORS = [{ side: -1, u0: 14, u1: 28, v0: 4.5, v1: 12 }, { side: 1, u0: 15.5, u1: 30, v0: 4.5, v1: 16.5 }, { side: -1, u0: 42.5, u1: 54, v0: 4.5, v1: 12 }];
  const LANTERNS = [[-1, 14.6, 11.4], [-1, 27.4, 11.4], [1, 16.1, 16], [1, 29.4, 16], [-1, 43.1, 11.4], [-1, 53.4, 11.4]].map(([s, u, v]) => at(s, u, v));
  const PROPS = [
    { key: "genesis", ex: "genesis", panel: false }, { key: "genesisPanel", ex: "genesis", panel: true },
    { key: "desk", ex: "desk", panel: false }, { key: "deskPanel", ex: "desk", panel: true },
    { key: "payment", ex: "payment", panel: false }, { key: "paymentPanel", ex: "payment", panel: true }];
  const footprints = () => [
    ...PROPS.map(({ key }) => { const l = LAYOUT[key]; return { x0: l.x - l.half.x, x1: l.x + l.half.x, z0: l.z - l.half.z, z1: l.z + l.half.z }; }),
    ...PEER_AT.map((p) => ({ x0: p.x - PEER_HALF, x1: p.x + PEER_HALF, z0: p.z - PEER_HALF, z1: p.z + PEER_HALF })),
    { x0: RAIL.x - 0.15, x1: RAIL.x + 0.15, z0: RAIL.z - 4, z1: RAIL.z + 4 },
    ...LANTERNS.map((p) => ({ x0: p.x - 0.15, x1: p.x + 0.15, z0: p.z - 0.15, z1: p.z + 0.15 }))];
  const walkUp = (key, y) => { const l = LAYOUT[key]; return { x: l.x - l.side * (l.half.x + FRONT), y, z: l.z }; };

  // --- One visit's live state ---------------------------------------------------------------------------------------
  const createLive = () => {
    const record = createRecord(), net = createNet(), counting = createCounting();
    const terminals = { genesis: recordTerminal(record), desk: netTerminal(net), payment: countingTerminal(counting) };
    const resetAll = () => { record.reset(); net.reset(); counting.reset(); };
    return { record, net, counting, terminals, resetAll };
  };

  // --- Models -------------------------------------------------------------------------------------------------------
  // Original procedural geometry: static parts with kit.solid, changing parts as nodes posed by `sync`. Left-bank
  // models face +x, right-bank ones -x. Colours: a dark slate floor with an ember border marks each island, the
  // cave's concluding warm-dusk look; the lanterns' caps are emissive only.
  const yawOf = (side) => side * Math.PI / 2;
  const buildModels = (kit, live) => {
    const { top: Y, M, createNode, place: put, solid, sign } = kit;
    const parts = { rows: [], rowLit: [], peerOk: [], peerBehind: [], peerOff: [], peerLed: [], cables: [], pips: [], counters: [], embers: [],
      tx: new Float32Array(COUNTERS), tz: new Float32Array(COUNTERS), ty: 0, laid: -1, phase: 0 };
    const node = (geometry, x, y, z, visible = true) => put(createNode({ geometry, position: { x, y, z }, visible }));
    const box = (w, h, d, color, emissive = 0) => M.box({ w, h, d, color, emissive });
    // Island floors with an ember border, flush with the bank.
    for (const f of FLOORS) {
      const a = at(f.side, f.u0, f.v0), b = at(f.side, f.u1, f.v1), x0 = Math.min(a.x, b.x), x1 = Math.max(a.x, b.x), z0 = Math.min(a.z, b.z), z1 = Math.max(a.z, b.z);
      solid(x1 - x0, 0.02, z1 - z0, "#2e2724", (x0 + x1) / 2, Y + 0.012, (z0 + z1) / 2);
      solid(x1 - x0, 0.025, 0.08, "#c86a28", (x0 + x1) / 2, Y + 0.014, z0 + 0.04, 0.6);
      solid(x1 - x0, 0.025, 0.08, "#c86a28", (x0 + x1) / 2, Y + 0.014, z1 - 0.04, 0.6);
      solid(0.08, 0.025, z1 - z0, "#c86a28", x0 + 0.04, Y + 0.014, (z0 + z1) / 2, 0.6);
      solid(0.08, 0.025, z1 - z0, "#c86a28", x1 - 0.04, Y + 0.014, (z0 + z1) / 2, 0.6);
    }
    // Lantern posts: a dark post and an ember cap; a brighter cap glows over it in slow turns (held still under Calm).
    for (const p of LANTERNS) {
      solid(0.18, 1.3, 0.18, "#2a2320", p.x, Y + 0.65, p.z);
      solid(0.26, 0.2, 0.26, "#d07a30", p.x, Y + 1.4, p.z, 0.8);
      parts.embers.push(node(box(0.28, 0.21, 0.28, "#ffb060", 1.5), p.x, Y + 1.4, p.z, false));
    }
    // 1. The record case: a stone plinth and an upright dark slab with seven field rows; a lit strip shows on each row a
    // command names. An empty bracket on the upstream end (+z, earlier) stands where a previous block would link.
    {
      const l = LAYOUT.genesis, x = l.x, z = l.z, s = -l.side;
      solid(1.2, 0.9, 2.3, "#3a3330", x, Y + 0.45, z);
      solid(0.12, 1.4, 2.2, "#16161c", x - s * 0.3, Y + 1.6, z);
      solid(0.14, 1.5, 0.06, "#8a6a44", x - s * 0.3, Y + 1.6, z + 1.12);
      solid(0.14, 1.5, 0.06, "#8a6a44", x - s * 0.3, Y + 1.6, z - 1.12);
      for (let i = 0; i < ROWS.length; i++) {
        const y = Y + 2.15 - i * 0.18, w = ROWS[i] === "text" ? 1.9 : 1.3;
        parts.rows.push(node(box(0.02, 0.1, w, "#3c3a48"), x - s * 0.23, y, z));
        parts.rowLit.push(node(box(0.02, 0.11, w, "#ffc070", 1.4), x - s * 0.22, y, z, false));
      }
      solid(0.4, 0.08, 0.08, "#8a6a44", x - s * 0.1, Y + 1.0, z + 1.25);
      solid(0.08, 0.3, 0.08, "#8a6a44", x - s * 0.28, Y + 1.1, z + 1.25);
      solid(0.08, 0.3, 0.08, "#8a6a44", x + s * 0.08, Y + 1.1, z + 1.25);
      sign(EXHIBITS.genesis.label, EXHIBITS.genesis.sub, x - s * 0.22, Y + 2.65, z, yawOf(s), 0.42);
    }
    // 2. The software desk: a table with an invented flat monitor, tower and keyboard; three peer stands inland, each
    // with a screen (green in step, amber behind, grey unplugged), a record pip per record and an activity light; and
    // a cable from each to the rail, shown while it is plugged in.
    {
      const l = LAYOUT.desk, x = l.x, z = l.z, s = -l.side;
      solid(1.3, 0.06, 2.2, "#5a4a3a", x, Y + 0.74, z);
      for (const [dx, dz] of [[-0.55, -1], [0.55, -1], [-0.55, 1], [0.55, 1]]) solid(0.06, 0.74, 0.06, "#3a3028", x + dx, Y + 0.37, z + dz);
      solid(0.05, 0.42, 0.7, "#1c1c22", x - s * 0.35, Y + 1.12, z + 0.1);
      solid(0.02, 0.36, 0.62, "#2a4a7a", x - s * 0.315, Y + 1.12, z + 0.1, 0.9);
      solid(0.12, 0.2, 0.06, "#1c1c22", x - s * 0.4, Y + 0.86, z + 0.1);
      solid(0.2, 0.025, 0.5, "#2a2a30", x + s * 0.15, Y + 0.785, z + 0.1);
      solid(0.45, 0.48, 0.2, "#26262c", x - s * 0.2, Y + 1.01, z - 0.8);
      solid(0.01, 0.02, 0.02, "#6aff9a", x + s * 0.03, Y + 1.15, z - 0.8, 1.2);
      solid(0.3, 0.04, 8, "#2a2a30", RAIL.x, Y + 0.3, RAIL.z);
      solid(0.3, 0.3, 0.3, "#2a2a30", RAIL.x, Y + 0.15, RAIL.z - 3.8);
      solid(0.3, 0.3, 0.3, "#2a2a30", RAIL.x, Y + 0.15, RAIL.z + 3.8);
      for (let k = 0; k < PEERS.length; k++) {
        const p = PEER_AT[k];
        solid(PEER_HALF * 2, 0.95, PEER_HALF * 2, "#33302c", p.x, Y + 0.475, p.z);
        solid(0.05, 0.36, 0.5, "#1c1c22", p.x - s * 0.2, Y + 1.15, p.z);
        parts.peerOk.push(node(box(0.02, 0.3, 0.44, "#4ad08a", 1.1), p.x - s * 0.17, Y + 1.15, p.z));
        parts.peerBehind.push(node(box(0.02, 0.3, 0.44, "#f0a030", 1.1), p.x - s * 0.17, Y + 1.15, p.z, false));
        parts.peerOff.push(node(box(0.02, 0.3, 0.44, "#55555a"), p.x - s * 0.17, Y + 1.15, p.z, false));
        parts.peerLed.push(node(box(0.04, 0.04, 0.04, "#7affb0", 1.5), p.x + s * 0.33, Y + 0.85, p.z + 0.2, false));
        const len = Math.abs(RAIL.x - p.x) - PEER_HALF;
        parts.cables.push(node(box(len, 0.04, 0.04, "#d0a050", 0.4), (p.x - s * PEER_HALF + RAIL.x) / 2, Y + 0.3, p.z));
        const row = [];
        for (let i = 0; i < MAX_RECORDS; i++) row.push(node(box(0.1, 0.06, 0.1, "#ffc070", 0.9), p.x + s * 0.1, Y + 0.99 + i * 0.075, p.z + 0.27, false));
        parts.pips.push(row);
      }
      sign(EXHIBITS.desk.label, EXHIBITS.desk.sub, x - s * 0.5, Y + 1.75, z - 0.9, yawOf(s), 0.42);
    }
    // 3. The counting table: an input tray and two output dishes, and 50 counters that move between them.
    {
      const l = LAYOUT.payment, x = l.x, z = l.z, s = -l.side;
      solid(1.2, 0.06, 2.5, "#5a4632", x, Y + 0.8, z);
      for (const [dx, dz] of [[-0.5, -1.15], [0.5, -1.15], [-0.5, 1.15], [0.5, 1.15]]) solid(0.06, 0.8, 0.06, "#3d2f20", x + dx, Y + 0.4, z + dz);
      solid(0.6, 0.02, 1.0, "#6a5a4a", x, Y + 0.84, z + 0.62);
      solid(0.3, 0.02, 0.5, "#2f6a6a", x, Y + 0.84, z - 0.2);
      solid(0.6, 0.02, 0.72, "#5a3f7a", x, Y + 0.84, z - 0.85);
      parts.ty = Y + 0.865; parts.table = { x, z, s };
      for (let i = 0; i < COUNTERS; i++) parts.counters.push(node(box(0.06, 0.025, 0.06, "#e8b04a", 0.5), x, parts.ty, z));
      sign(EXHIBITS.payment.label, EXHIBITS.payment.sub, x - s * 0.5, Y + 1.5, z, yawOf(s), 0.42);
    }
    return parts;
  };
  // Lays out the counters' targets: the input tray is 5 by 10, output 1 is 2 by 5 (ten counters), output 2 is 5 by 8.
  // TRY may overfill a dish's grid; the extra counters stack a layer higher. Allocation-free.
  const layCounters = (parts, c) => {
    const T = parts.table, k = [0, 0, 0];
    for (let i = 0; i < COUNTERS; i++) {
      const d = c.dest[i], n = k[d]++;
      if (d === 0) { parts.tx[i] = T.x - 0.2 + (n % 5) * 0.1; parts.tz[i] = T.z + 1.07 - ((n / 5) | 0) * 0.1; }
      else if (d === 1) { const m = n % 10; parts.tx[i] = T.x - 0.05 + (m % 2) * 0.1; parts.tz[i] = T.z + 0.0 - ((m / 2) | 0) * 0.09; parts.counters[i].lift = (n / 10) | 0; }
      else { const m = n % 40; parts.tx[i] = T.x - 0.2 + (m % 5) * 0.1; parts.tz[i] = T.z - 0.54 - ((m / 5) | 0) * 0.087; parts.counters[i].lift = (n / 40) | 0; }
      if (d === 0) parts.counters[i].lift = 0;
    }
    parts.laid = c.version;
  };
  // Poses the models from the live state, allocating nothing. `still` (Calm or reading) holds the lanterns' glow and
  // the activity lights; `snap` puts the counters straight at their places (Calm, or leaving the cave).
  const STEP_RATE = 6, BLINK_TIME = 1.2;
  const sync = (parts, live, dt, still, snap) => {
    const r = live.record;
    for (let i = 0; i < ROWS.length; i++) parts.rowLit[i].visible = r.lit[i] === 1;
    const n = live.net, cmp = n.peers;
    let best = 0; for (const p of cmp) best = Math.max(best, p.history.length);
    if (n.blink > 0) n.blink = Math.max(0, n.blink - dt / BLINK_TIME);
    parts.phase = (parts.phase + dt) % 1000;
    for (let k = 0; k < cmp.length; k++) {
      const p = cmp[k], behind = p.history.length < best;
      parts.peerOk[k].visible = p.online && !behind; parts.peerBehind[k].visible = p.online && behind; parts.peerOff[k].visible = !p.online;
      parts.cables[k].visible = p.online;
      parts.peerLed[k].visible = p.online && (still ? true : n.blink > 0 ? ((parts.phase * 8) | 0) % 2 === 0 : true);
      for (let i = 0; i < MAX_RECORDS; i++) parts.pips[k][i].visible = i < p.history.length;
    }
    for (let i = 0; i < parts.embers.length; i++) parts.embers[i].visible = !still && Math.sin(parts.phase * 0.6 + i * 1.7) > 0.55;
    const c = live.counting;
    if (parts.laid !== c.version) layCounters(parts, c);
    const t = snap ? 1 : Math.min(1, dt * STEP_RATE);
    for (let i = 0; i < COUNTERS; i++) {
      const q = parts.counters[i];
      q.position.x += (parts.tx[i] - q.position.x) * t;
      q.position.z += (parts.tz[i] - q.position.z) * t;
      q.position.y = parts.ty + (q.lift || 0) * 0.03;
    }
  };

  // --- Registration -------------------------------------------------------------------------------------------------
  let visit = null;
  BL.genesisExhibits.register(ERA, {
    sources: SOURCES,
    overview: OVERVIEW,
    build(kit) {
      const live = createLive(), parts = buildModels(kit, live);
      for (const o of footprints()) kit.obstacle(o.x0, o.x1, o.z0, o.z1);
      for (const { key, ex: name, panel } of PROPS) {
        const ex = EXHIBITS[name], l = LAYOUT[key];
        kit.prop({ id: panel ? ex.panelId : ex.id, year: ex.year, connection: "context", date: ex.date, title: panel ? ex.panelTitle : ex.title,
          label: panel ? `${ex.label} · PANEL` : ex.label, sourceKeys: ex.sourceKeys, at: walkUp(key, kit.top), reach: l.reach,
          pick: { w: l.half.x * 2, h: l.h, d: l.half.z * 2, x: l.x, z: l.z }, ...(panel ? {} : { hint: ex.hint, howTo: ex.howTo }),
          onUse: panel ? () => ({ board: boardOf(ex) }) : () => ({ terminal: live.terminals[name] }) });
      }
      // The lecterns: a slanted reading board on a post, each with its island's colours.
      for (const { key, panel } of PROPS) if (panel) {
        const l = LAYOUT[key];
        kit.solid(0.14, 1.1, 0.14, "#2a2320", l.x, kit.top + 0.55, l.z);
        kit.solid(0.5, 0.06, 0.9, "#3a3330", l.x, kit.top + 1.12, l.z);
        kit.solid(0.46, 0.02, 0.84, "#e9dcc0", l.x, kit.top + 1.16, l.z, 0.25);
      }
      sync(parts, live, 0, true, true);
      visit = { live, parts };
    },
    update(dt, elapsed, state) { if (visit) sync(visit.parts, visit.live, dt, state.calm === true || state.reading === true, state.calm === true); },
    // Nothing outlives a frame here; leaving settles the counters and the activity lights so a return resumes nothing.
    active(on) { if (visit && !on) { visit.live.net.blink = 0; sync(visit.parts, visit.live, 0, true, true); } },
    dispose() { visit = null; }
  });

  BL.genesisEra7 = { ERA, YEARS, NAME, SOURCES, OVERVIEW, EXHIBITS, ISLANDS, LAYOUT, PROPS, GENESIS, B170, RELEASE, ROWS, PEERS, MAX_RECORDS, COUNTERS,
    sourceOf, stamp, createRecord, createNet, createCounting, recordTerminal, netTerminal, countingTerminal, createLive, footprints, walkUp,
    buildModels, sync, get visit() { return visit; } };
})();
