// Era 7's cave in the Genesis Voyage, Genesis (3–12 January 2009), built through the era exhibit kit
// (genesis-exhibits.js: BL.genesisExhibits.register(7, { sources, overview, build(kit), update, active, dispose })).
// Facts from the Era 7 dossier (docs/genesis-voyage/eras/era-7-genesis.md, branch gv/research), its three exhibit
// entries only; every claim carries one of the source keys in SOURCES.
//
// Three islands, each a device (a terminal) and a panel lectern (In short, Deeper story, Unsolved, Sources):
// - THE FIRST BLOCK (left bank, upstream): a record case showing the genesis block's stored fields, its embedded
//   headline as recorded data, and why its output is special. All times are labelled block-header timestamps.
// - THE SOFTWARE DESK (right side): the 8 January 2009 release announcement, and an invented network of three
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
        "The first block (left side, nearest the way in): read the stored fields and the words inside the genesis block.",
        "The software desk (right side): unplug a pretend terminal, add a record, plug it back in and compare.",
        "An early test payment (left side, further in): split 50 counters into 10 and 40."] },
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

  // --- The launch cluster (gv/upgrade-era-7): Peer Sync, a 2009 computer corner and the counting frame ---------------
  // One compact group on the right side past the software desk (u 42.5 to 55, v 4.5 to 10.5), clear of the dock, the
  // lamps and the walk. Its game's rules live in genesis-era-7-sync.js (BL.genesisEra7Sync); until the integrator loads
  // that file before this one, the cabinet is left out and the other two still stand. The corner and the frame are
  // context; Peer Sync is a modern museum homage, labelled as such, never historical software.
  const SYNC = () => BL.genesisEra7Sync || null;
  const CLUSTER = {
    sync: { id: "e7-sync", year: 2009, title: "Peer Sync cabinet", label: "PEER SYNC · 2009 STYLE", sub: "a modern museum homage · made 2026",
      date: "Made for the museum in 2026: a modern homage on the 8 January 2009 software desk's idea, not historical software",
      sourceKeys: ["E7-REL", "E7-DOSSIER"],
      hint: "Type WAIT to let a beat pass, and PLUG any terminal whose link drops.",
      howTo: ["Type WAIT: one beat passes and something happens.", "When a terminal's link drops, type PLUG and its letter, like PLUG B.",
        "Win when all three hold the same 8 records. COMPARE shows them.", "NEW plays a fresh run; RESET replays this one."],
      more: ["Peer Sync is a modern museum homage, made in 2026. It is not historical software and copies no real program.",
        "It extends the software desk: three pretend terminals keep the same records; one that drops off keeps what it had, and when plugged back in it checks the link and catches up. A broken record is refused.",
        "Nothing here is a network, wallet, payment or mining. Real software checks far more than one link.",
        "The software it nods to was announced on 8 January 2009, 19:27:40 UTC (archived email timestamp), as experimental software for Windows with its source code included."] },
    pc: { id: "e7-pc", year: 2009, title: "A January 2009 computer corner", label: "A 2009 COMPUTER CORNER", sub: "January 2009 context · invented design",
      date: "January 2009 context: the 8 January 2009 release email named Windows as its only platform; this desk and machine are an invented, unbranded design",
      sourceKeys: ["E7-REL"],
      hint: "Open the panel: what the release email says the software ran on.",
      panel: { room: "A 2009 computer corner", pages: [
        { caption: "In short", title: "Windows only for now", text: [
          "The release email of 8 January 2009 (archived timestamp 19:27:40 UTC) named one platform for the first software: Windows, with its source code included.",
          "This corner shows an ordinary desktop of the kind such software ran on: a tower, a flat screen, a keyboard and a mouse."] },
        { caption: "Deeper story", title: "Context only", text: [
          `The email says: "${RELEASE.quote}"`,
          "The machine here is invented and unbranded: no real product's shape, name or logo. It is period context for the software desk, not a historical object.",
          "Separate events: the October 2008 paper, the 3 January 2009 block header timestamp, the 8 January 2009 release email and the 12 January 2009 test payment."] },
        { caption: "Unsolved", title: "What this does not claim", text: [
          "It says nothing about what computer anyone involved used, and it shows no specifications: the museum's research has not verified one for this corner.",
          "A laptop configuration from October 2008 is held back until its manufacturer's page can be read for this build."] },
        { caption: "Sources", title: "Where this comes from", text: sourceLines(["E7-REL"]) }] } },
    frame: { id: "e7-frame", year: 2009, title: "The counting frame", label: "COUNTING FRAME · 2009", sub: "50 counters · move them, keep them all",
      date: "12 January 2009, 03:30:25 UTC: block 170's header timestamp; the frame is an original demonstration of its 50 = 10 + 40 split",
      sourceKeys: ["E7-170", "E7-170-TXS"],
      hint: "Type MOVE 10 TO 1, then MOVE 40 TO 2, and watch the total stay 50.",
      howTo: ["Type MOVE 10 TO 1: ten beads slide from the input to output 1.", "Type MOVE 40 TO 2, or MOVE 5 FROM 1 TO 2 to move between outputs.",
        "Every reply counts all three zones: the beads always add up to 50.", "CHECK compares with block 170's record; RESET slides them all back."],
      more: ["Fifty beads stand for block 170's 50-coin input. Move them between the input and the two outputs however you like: none is ever made or lost.",
        "Block 170's record pays outputs of 1,000,000,000 and 4,000,000,000 satoshis: 10 and 40 coins. CHECK lights the lamp when your frame matches.",
        "The record holds amounts and keys, not names. Finney's account of receiving ten coins is his 19 March 2013 recollection, not part of the record.",
        "An original demonstration: a real payment is checked in many more ways."] }
  };
  // The counting frame's rules: each bead in zone 0 (input), 1 (output 1) or 2 (output 2). Moves are whole numbers of
  // beads that exist in the zone they come from; a refused move changes nothing.
  const ZONE_NAMES = ["input", "output 1", "output 2"];
  const createFrame = () => {
    const s = { zone: new Uint8Array(COUNTERS), version: 0, moves: 0 };
    const count = (z) => { let c = 0; for (let i = 0; i < COUNTERS; i++) if (s.zone[i] === z) c++; return c; };
    const reset = () => { s.zone.fill(0); s.moves = 0; s.version++; };
    const move = (n, from, to) => {
      if (!(n >= 1 && n <= COUNTERS) || from === to || !(from >= 0 && from < 3) || !(to >= 0 && to < 3)) return { error: true };
      if (count(from) < n) return { error: true, short: count(from) };
      for (let i = COUNTERS - 1, k = n; i >= 0 && k > 0; i--) if (s.zone[i] === from) { s.zone[i] = to; k--; }
      s.moves++; s.version++;
      return { n, from, to };
    };
    const matches = () => count(1) === B170.outputs[0] && count(2) === B170.outputs[1];
    return Object.assign(s, { count, reset, move, matches });
  };
  const zoneOf = (word) => { const w = String(word).toUpperCase(); return w === "IN" || w === "INPUT" ? 0 : w === "1" ? 1 : w === "2" ? 2 : -1; };
  const frameTerminal = (f) => {
    const ex = CLUSTER.frame;
    const total = () => `Input ${f.count(0)} + output 1 ${f.count(1)} + output 2 ${f.count(2)} = ${f.count(0) + f.count(1) + f.count(2)} beads.`;
    return {
      get banner() { return [...howTo(ex), ex.label, `${ex.date}.`, "", "Fifty beads on a frame. An original demonstration, not a wallet.", "", total(), ""]; },
      prompt: "FRAME>",
      run: (line) => {
        const parts = clean(line).toUpperCase().split(/\s+/).filter(Boolean), cmd = parts[0] || "";
        if (!cmd) return { lines: [] };
        if (cmd === "HELP") return { lines: ["MOVE 10 TO 1          ten beads from the input to output 1", "MOVE 5 FROM 1 TO 2    between zones (IN, 1, 2)",
          "SHOW                  count every zone", "CHECK                 compare with block 170's record", "MORE                  the story", "SOURCES               where this comes from", "RESET                 every bead back to the input"] };
        if (cmd === "RESET") { f.reset(); return { lines: ["Every bead slid back to the input.", total()], reset: true }; }
        if (cmd === "SHOW") return { lines: [total()] };
        if (cmd === "MORE") return { lines: [ex.label, `${ex.date}.`, "Connection: context, an original demonstration.", "", ...ex.more] };
        if (cmd === "SOURCES") return { lines: sourceLines(ex.sourceKeys) };
        if (cmd === "CHECK") return { lines: [total(), f.matches() ? `That is block 170's split: ${B170.outputs[0]} and ${B170.outputs[1]}. The lamp is lit.`
          : `Block 170 records ${B170.outputs[0]} and ${B170.outputs[1]}. Keep moving beads; none is ever made or lost.`] };
        if (cmd === "MOVE") {
          // MOVE n TO z, or MOVE n FROM z TO z.
          const n = /^\d{1,2}$/.test(parts[1] || "") ? +parts[1] : -1;
          let from = 0, to = -1;
          if (parts[2] === "TO" && parts.length === 4) to = zoneOf(parts[3]);
          else if (parts[2] === "FROM" && parts[4] === "TO" && parts.length === 6) { from = zoneOf(parts[3]); to = zoneOf(parts[5]); }
          const r = n > 0 && from >= 0 && to >= 0 ? f.move(n, from, to) : { error: true };
          if (r.error) return { lines: [r.short !== undefined ? `Only ${r.short} bead(s) in the ${ZONE_NAMES[from]}: nothing moved.` : "Use MOVE 10 TO 1, or MOVE 5 FROM 1 TO 2 (zones IN, 1 and 2). Nothing moved.", total()] };
          return { lines: [`${r.n} bead(s) slid from the ${ZONE_NAMES[r.from]} to ${ZONE_NAMES[r.to]}.`, total(), ...(f.matches() ? ["That matches block 170's record: 10 and 40."] : [])] };
        }
        return { lines: ["Unknown command. Type HELP."] };
      }
    };
  };
  // Peer Sync through the workbench's terminal: the game module's own terminal with this exhibit's How to use, MORE and
  // SOURCES around it.
  const syncTerminal = (t) => {
    const ex = CLUSTER.sync;
    return {
      get banner() { return [...howTo(ex), ex.label, `${ex.date}.`, "", ...t.banner]; },
      prompt: t.prompt,
      run: (line) => {
        const cmd = clean(line).toUpperCase();
        if (cmd === "MORE") return { lines: [ex.label, `${ex.date}.`, "Connection: context, a modern museum homage.", "", ...ex.more] };
        if (cmd === "SOURCES") return { lines: sourceLines(ex.sourceKeys) };
        return t.run(line);
      }
    };
  };
  // Where the cluster stands (bank frame, right side), its floor and lanterns.
  const CL = {
    sync: place(1, 44, 8, { x: 0.45, z: 0.45 }, 2.0, 1.5),
    pc: place(1, 48.5, 8, { x: 0.65, z: 0.95 }, 1.5, 1.6),
    frame: place(1, 53, 8, { x: 0.6, z: 1.0 }, 1.2, 1.6)
  };
  const CL_FLOOR = { side: 1, u0: 42.5, u1: 55, v0: 4.5, v1: 10.5 };
  const CL_LANTERNS = [at(1, 42.9, 10.1), at(1, 54.6, 10.1)];
  const clusterKeys = () => SYNC() ? ["sync", "pc", "frame"] : ["pc", "frame"];
  const clusterFootprints = () => [
    ...clusterKeys().map((key) => { const l = CL[key]; return { x0: l.x - l.half.x, x1: l.x + l.half.x, z0: l.z - l.half.z, z1: l.z + l.half.z }; }),
    ...CL_LANTERNS.map((p) => ({ x0: p.x - 0.15, x1: p.x + 0.15, z0: p.z - 0.15, z1: p.z + 0.15 }))];
  const clusterWalkUp = (key, y) => { const l = CL[key]; return { x: l.x - l.side * (l.half.x + FRONT), y, z: l.z }; };
  const createClusterLive = () => {
    const S7 = SYNC(), frame = createFrame(), rules = S7 ? S7.createRules() : null;
    const terminals = { frame: frameTerminal(frame), sync: S7 ? syncTerminal(S7.terminal(rules)) : null };
    return { frame, rules, terminals };
  };
  // The cluster's models: a cabinet whose three windows and record pips show the Peer Sync run live, the computer
  // corner, and the frame with its 50 beads in three coloured zones and a lamp that lights on block 170's split.
  const BEAD = 0.06;
  const buildCluster = (kit, cl) => {
    const { top: Y, M, createNode, place: put, solid, sign } = kit;
    const node = (geometry, x, y, z, visible = true) => put(createNode({ geometry, position: { x, y, z }, visible }));
    const box = (w, h, d, color, emissive = 0) => M.box({ w, h, d, color, emissive });
    const parts = { winOk: [], winBehind: [], winOff: [], pips: [], beads: [], bx: new Float32Array(COUNTERS), bz: new Float32Array(COUNTERS), zoneFill: new Uint8Array(3), laid: -1, frameAt: null, lamp: null };
    {
      const a = at(1, CL_FLOOR.u0, CL_FLOOR.v0), b = at(1, CL_FLOOR.u1, CL_FLOOR.v1), x0 = Math.min(a.x, b.x), x1 = Math.max(a.x, b.x), z0 = Math.min(a.z, b.z), z1 = Math.max(a.z, b.z);
      solid(x1 - x0, 0.02, z1 - z0, "#2e2724", (x0 + x1) / 2, Y + 0.012, (z0 + z1) / 2);
      solid(x1 - x0, 0.025, 0.08, "#c86a28", (x0 + x1) / 2, Y + 0.014, z0 + 0.04, 0.6);
      solid(x1 - x0, 0.025, 0.08, "#c86a28", (x0 + x1) / 2, Y + 0.014, z1 - 0.04, 0.6);
      for (const p of CL_LANTERNS) { solid(0.18, 1.3, 0.18, "#2a2320", p.x, Y + 0.65, p.z); solid(0.26, 0.2, 0.26, "#d07a30", p.x, Y + 1.4, p.z, 0.8); }
    }
    if (cl.rules) {
      const l = CL.sync, x = l.x, z = l.z, s = -l.side;
      solid(0.8, 1.7, 0.8, "#2b2a30", x, Y + 0.85, z);
      solid(0.3, 0.06, 0.7, "#151519", x + s * 0.42, Y + 0.95, z);
      solid(0.02, 0.62, 0.66, "#07080d", x + s * 0.405, Y + 1.32, z);
      for (let k = 0; k < 3; k++) {
        const zz = z + 0.2 - k * 0.2, xx = x + s * 0.418;
        parts.winOk.push(node(box(0.01, 0.14, 0.15, "#4ad08a", 1.1), xx, Y + 1.48, zz));
        parts.winBehind.push(node(box(0.01, 0.14, 0.15, "#f0a030", 1.1), xx, Y + 1.48, zz, false));
        parts.winOff.push(node(box(0.01, 0.14, 0.15, "#55555a"), xx, Y + 1.48, zz, false));
        const row = [];
        for (let i = 0; i < 8; i++) row.push(node(box(0.01, 0.022, 0.12, "#ffd23a", 0.9), xx, Y + 1.08 + i * 0.03, zz, false));
        parts.pips.push(row);
      }
      sign(CLUSTER.sync.label, CLUSTER.sync.sub, x, Y + 2.0, z, yawOf(s), 0.36);
    }
    {
      const l = CL.pc, x = l.x, z = l.z, s = -l.side;
      solid(1.2, 0.06, 1.8, "#4f4436", x, Y + 0.74, z);
      for (const [dx, dz] of [[-0.52, -0.82], [0.52, -0.82], [-0.52, 0.82], [0.52, 0.82]]) solid(0.06, 0.74, 0.06, "#332b22", x + dx, Y + 0.37, z + dz);
      solid(0.2, 0.46, 0.46, "#2a2a30", x - s * 0.3, Y + 1.0, z + 0.62);
      solid(0.01, 0.02, 0.02, "#6aff9a", x - s * 0.19, Y + 1.12, z + 0.5, 1.2);
      solid(0.05, 0.4, 0.62, "#1c1c22", x - s * 0.36, Y + 1.15, z - 0.05);
      solid(0.02, 0.34, 0.56, "#2c5a8a", x - s * 0.33, Y + 1.15, z - 0.05, 0.9);
      solid(0.012, 0.03, 0.36, "#d8e6f0", x - s * 0.318, Y + 1.25, z - 0.05, 1.1);
      solid(0.012, 0.03, 0.24, "#d8e6f0", x - s * 0.318, Y + 1.18, z - 0.11, 1.1);
      solid(0.012, 0.02, 0.56, "#3a3a44", x - s * 0.318, Y + 0.99, z - 0.05, 0.4);
      solid(0.12, 0.16, 0.06, "#1c1c22", x - s * 0.38, Y + 0.85, z - 0.05);
      solid(0.18, 0.025, 0.52, "#2a2a30", x + s * 0.12, Y + 0.785, z - 0.05);
      solid(0.1, 0.03, 0.06, "#2a2a30", x + s * 0.14, Y + 0.785, z - 0.45);
      sign(CLUSTER.pc.label, CLUSTER.pc.sub, x - s * 0.5, Y + 1.75, z + 0.5, yawOf(s), 0.36);
    }
    {
      const l = CL.frame, x = l.x, z = l.z, s = -l.side;
      solid(1.1, 0.06, 2.0, "#5a4632", x, Y + 0.8, z);
      for (const [dx, dz] of [[-0.48, -0.92], [0.48, -0.92], [-0.48, 0.92], [0.48, 0.92]]) solid(0.06, 0.8, 0.06, "#3d2f20", x + dx, Y + 0.4, z + dz);
      const ZONE_Z = [z + 0.66, z, z - 0.66], ZONE_C = ["#6a5a4a", "#2f6a6a", "#5a3f7a"];
      for (let k = 0; k < 3; k++) solid(0.36, 0.02, 0.62, ZONE_C[k], x, Y + 0.84, ZONE_Z[k]);
      solid(0.4, 0.04, 0.03, "#c8a060", x, Y + 0.85, z + 0.33);
      solid(0.4, 0.04, 0.03, "#c8a060", x, Y + 0.85, z - 0.33);
      solid(0.12, 0.3, 0.12, "#2a2320", x - s * 0.42, Y + 0.98, z - 0.9);
      parts.lampOff = node(box(0.14, 0.12, 0.14, "#3a3a3a"), x - s * 0.42, Y + 1.19, z - 0.9);
      parts.lamp = node(box(0.15, 0.13, 0.15, "#6aff9a", 1.4), x - s * 0.42, Y + 1.19, z - 0.9, false);
      parts.frameAt = { x, z, zoneZ: ZONE_Z, y: Y + 0.875 };
      for (let i = 0; i < COUNTERS; i++) parts.beads.push(node(box(0.045, 0.03, 0.045, "#e8b04a", 0.5), x, Y + 0.875, z));
      sign(CLUSTER.frame.label, CLUSTER.frame.sub, x - s * 0.5, Y + 1.5, z + 0.3, yawOf(s), 0.36);
    }
    return parts;
  };
  // Bead targets: each zone a 5 by 10 grid, filled in bead order. Allocation-free.
  const layBeads = (parts, f) => {
    // The three zones' counts reuse one preallocated array (parts.zoneFill), so laying the beads allocates nothing.
    const A = parts.frameAt, k = parts.zoneFill;
    k[0] = k[1] = k[2] = 0;
    for (let i = 0; i < COUNTERS; i++) {
      const zn = f.zone[i], n = k[zn]++;
      parts.bx[i] = A.x + ((n % 5) - 2) * BEAD;
      parts.bz[i] = A.zoneZ[zn] + 0.27 - ((n / 5) | 0) * BEAD;
    }
    parts.laid = f.version;
  };
  const syncCluster = (parts, cl, dt, snap) => {
    const R = cl.rules;
    if (R) for (let k = 0; k < 3; k++) {
      const on = R.online[k] === 1, behind = on && R.len[k] < R.head;
      parts.winOk[k].visible = on && !behind; parts.winBehind[k].visible = behind; parts.winOff[k].visible = !on;
      for (let i = 0; i < 8; i++) parts.pips[k][i].visible = i < R.len[k];
    }
    const f = cl.frame;
    if (parts.laid !== f.version) layBeads(parts, f);
    const t = snap ? 1 : Math.min(1, dt * STEP_RATE);
    for (let i = 0; i < COUNTERS; i++) {
      const q = parts.beads[i];
      q.position.x += (parts.bx[i] - q.position.x) * t;
      q.position.z += (parts.bz[i] - q.position.z) * t;
    }
    const lit = f.matches();
    parts.lamp.visible = lit; parts.lampOff.visible = !lit;
  };

  // --- Finer parts (the museum polish) ------------------------------------------------------------------------------
  // Each exhibit's finer parts (trims, keys, bezels, rims, small props) as one merged mesh at the exhibit's own spot,
  // as Era 0 does (genesis-era-0.js `detail`). The layout's dry run and the checks have no `merge`, so they get a bare
  // node at the same spot: every run counts the same pieces in the same order. Built after everything else, so no
  // existing piece, prop or record changes its place in the build. Offsets are in the exhibit's frame: `a` toward the
  // stream (the way the exhibit faces), `y` from the floor, `z` along the bank.
  const detail = (kit, x, y, z, make) => {
    const nd = kit.createNode(kit.M.merge ? { geometry: kit.M.merge(...make(kit.M)) } : {});
    nd.position.x = x; nd.position.y = y; nd.position.z = z;
    return kit.place(nd);
  };
  const B = (M, w, h, d, color, x, y, z, emissive = 0) => M.box({ w, h, d, color, emissive, offset: { x, y, z } });
  // A box in a facing frame: depth `w` along the facing (s, +1 or -1 in x), offset `a` along it.
  const facer = (M, s) => (w, h, d, color, a, y, z, emissive = 0) => B(M, w, h, d, color, s * a, y, z, emissive);
  const range = (n, f) => Array.from({ length: n }, (_, k) => f(k));
  const buildDetails = (kit) => {
    const { top: Y } = kit;
    // The record case: a stepped plinth with a skirt and a cap, a brass frame round the slab, a tick by each field
    // row, a headline plate on the plinth's face, and a small dark block on the plinth top, ringed in gold.
    {
      const l = LAYOUT.genesis, s = -l.side;
      detail(kit, l.x, Y, l.z, (M) => { const F = facer(M, s); return [
        F(1.3, 0.1, 2.4, "#2a2522", 0, 0.05, 0), F(1.28, 0.06, 2.38, "#4a423c", 0, 0.93, 0), F(0.04, 0.03, 2.3, "#c86a28", 0.63, 0.95, 0, 0.4),
        F(0.2, 0.06, 2.3, "#b08a54", -0.3, 2.33, 0, 0.15), F(0.2, 0.05, 2.3, "#8a6a44", -0.3, 0.98, 0),
        ...range(ROWS.length, (i) => F(0.03, 0.05, 0.05, "#e0b060", -0.22, 2.15 - i * 0.18, ROWS[i] === "text" ? 1.0 : 0.7, 0.6)),
        F(0.02, 0.22, 1.5, "#e9dcc0", 0.61, 0.58, 0, 0.25), F(0.02, 0.03, 1.2, "#3a3330", 0.625, 0.62, 0), F(0.02, 0.03, 0.9, "#3a3330", 0.625, 0.54, -0.15),
        F(0.3, 0.3, 0.3, "#24222c", 0.3, 1.14, -0.6), F(0.32, 0.03, 0.32, "#e0b060", 0.3, 1.3, -0.6, 0.5), F(0.32, 0.03, 0.32, "#e0b060", 0.3, 0.99, -0.6, 0.3),
        ...[-1, 1].map((k) => F(0.06, 0.06, 0.06, "#b08a54", 0.58, 0.88, k * 1.12))]; });
    }
    // The software desk: an apron and a drawer, keyboard keys, a mouse on its pad, the monitor's foot and lip, the
    // tower's drive bays and vents, and the printed announcement lying by the keyboard.
    {
      const l = LAYOUT.desk, s = -l.side;
      detail(kit, l.x, Y, l.z, (M) => { const F = facer(M, s); return [
        F(1.2, 0.09, 2.1, "#4a3c2e", 0, 0.665, 0), F(0.02, 0.07, 0.5, "#6a5a48", 0.6, 0.665, -0.3), F(0.02, 0.02, 0.12, "#c8a060", 0.615, 0.665, -0.3, 0.3),
        ...range(3, (r) => F(0.035, 0.012, 0.44, "#4a4a52", 0.08 + r * 0.05, 0.802, 0.1)), F(0.035, 0.012, 0.2, "#5a5a62", 0.23, 0.802, 0.1),
        F(0.16, 0.006, 0.2, "#202024", 0.18, 0.774, 0.62), F(0.08, 0.03, 0.05, "#3a3a40", 0.18, 0.79, 0.62),
        F(0.28, 0.02, 0.36, "#1c1c22", -0.38, 0.78, 0.1), F(0.06, 0.02, 0.72, "#2a2a30", -0.33, 1.34, 0.1), F(0.06, 0.02, 0.72, "#2a2a30", -0.33, 0.9, 0.1),
        ...range(3, (k) => F(0.01, 0.035, 0.16, "#3a3a44", 0.03, 1.12 - k * 0.07, -0.8)), ...range(4, (k) => F(0.01, 0.01, 0.12, "#121216", 0.03, 0.86 + k * 0.025, -0.8)),
        F(0.22, 0.006, 0.16, "#f2ead6", 0.38, 0.775, -0.3, 0.3), ...range(4, (k) => F(0.006, 0.004, 0.12 - (k % 2) * 0.04, "#6a6a72", 0.32 + k * 0.035, 0.779, -0.3)),
        F(0.06, 0.08, 0.06, "#c86a28", 0.45, 0.81, 0.85)]; });
    }
    // The three peer stands: a cap with a little keyboard on each, a bezel round each screen and a foot; and clips
    // along the cable rail behind them.
    {
      const mid = PEER_AT[1], s = -1;
      detail(kit, mid.x, Y, mid.z, (M) => { const F = facer(M, s); return [
        ...PEER_AT.flatMap((p) => { const dz = p.z - mid.z, dx = (p.x - mid.x) * s; return [
          F(0.7, 0.04, 0.7, "#4a4540", dx, 0.97, dz), F(0.72, 0.08, 0.72, "#24201c", dx, 0.04, dz),
          F(0.16, 0.02, 0.36, "#2a2a30", dx + 0.12, 1.0, dz), ...range(2, (r) => F(0.03, 0.01, 0.3, "#55555e", dx + 0.08 + r * 0.06, 1.012, dz)),
          F(0.06, 0.03, 0.54, "#2a2a30", dx - 0.2, 1.345, dz), F(0.06, 0.03, 0.54, "#2a2a30", dx - 0.2, 0.955, dz)]; }),
        ...range(9, (k) => F(0.36, 0.07, 0.05, "#3a3a42", (RAIL.x - mid.x) * s, 0.33, RAIL.z - mid.z - 3.6 + k * 0.9))]; });
    }
    // The counting table: an apron and a stretcher, raised rims round the tray and the two dishes, and block 170's
    // ledger lying closed at the corner.
    {
      const l = LAYOUT.payment, s = -l.side;
      detail(kit, l.x, Y, l.z, (M) => { const F = facer(M, s); return [
        F(1.1, 0.08, 2.4, "#4a3826", 0, 0.73, 0), F(0.05, 0.05, 2.3, "#3d2f20", 0.5, 0.2, 0), F(0.05, 0.05, 2.3, "#3d2f20", -0.5, 0.2, 0),
        ...[[0.62, 1.0, 0.6], [-0.2, 0.5, 0.3], [-0.85, 0.72, 0.6]].flatMap(([z, d, w]) => [F(w + 0.04, 0.03, 0.02, "#c8a060", 0, 0.86, z + d / 2), F(w + 0.04, 0.03, 0.02, "#c8a060", 0, 0.86, z - d / 2),
          F(0.02, 0.03, d, "#c8a060", w / 2 + 0.01, 0.86, z), F(0.02, 0.03, d, "#c8a060", -w / 2 - 0.01, 0.86, z)]),
        F(0.2, 0.04, 0.28, "#3a2418", -0.43, 0.85, -0.2), F(0.18, 0.03, 0.26, "#efe6d2", -0.43, 0.855, -0.2, 0.15), F(0.02, 0.045, 0.28, "#e0b060", -0.33, 0.85, -0.2, 0.3)]; });
    }
    // The three lecterns: a foot plate, a ledge to hold the page and gilt corner caps.
    for (const { key, panel } of PROPS) if (panel) {
      const l = LAYOUT[key], s = -l.side;
      detail(kit, l.x, Y, l.z, (M) => { const F = facer(M, s); return [
        F(0.42, 0.05, 0.42, "#2a2320", 0, 0.025, 0), F(0.04, 0.05, 0.9, "#5a4a3a", 0.26, 1.17, 0), F(0.2, 0.04, 0.2, "#3a3330", 0, 1.06, 0),
        ...[-1, 1].map((k) => F(0.06, 0.03, 0.06, "#c8a060", 0.22, 1.18, k * 0.42, 0.3))]; });
    }
    // The launch cluster: the Peer Sync cabinet's marquee, bezel, buttons, stick and coin door; the computer corner's
    // keys, mouse pad, monitor foot, a speaker and a stack of discs; the counting frame's rails and the lamp's bracket.
    if (SYNC()) {
      const l = CL.sync, s = -l.side;
      detail(kit, l.x, Y, l.z, (M) => { const F = facer(M, s); return [
        F(0.86, 0.22, 0.86, "#1f1e24", 0, 1.81, 0), F(0.01, 0.12, 0.62, "#ffd23a", 0.435, 1.81, 0, 0.8), F(0.86, 0.06, 0.86, "#3a3840", 0, 0.03, 0),
        F(0.02, 0.04, 0.7, "#3a3840", 0.41, 1.65, 0), F(0.02, 0.04, 0.7, "#3a3840", 0.41, 0.99, 0), F(0.02, 0.66, 0.03, "#3a3840", 0.41, 1.32, 0.345), F(0.02, 0.66, 0.03, "#3a3840", 0.41, 1.32, -0.345),
        ...range(3, (k) => F(0.05, 0.025, 0.05, ["#4ad08a", "#ffd23a", "#46ffd2"][k], 0.48, 0.995, 0.2 - k * 0.2, 0.8)),
        F(0.03, 0.09, 0.03, "#121216", 0.36, 1.02, 0.28), F(0.05, 0.05, 0.05, "#e0452b", 0.36, 1.08, 0.28, 0.5),
        F(0.01, 0.32, 0.3, "#151519", 0.405, 0.5, 0), ...[-0.06, 0.06].map((z) => F(0.01, 0.06, 0.02, "#ff8a2a", 0.412, 0.55, z, 0.9)),
        ...[-1, 1].map((k) => F(0.8, 1.6, 0.01, "#3c3a44", 0, 0.85, k * 0.405))]; });
    }
    {
      const l = CL.pc, s = -l.side;
      detail(kit, l.x, Y, l.z, (M) => { const F = facer(M, s); return [
        F(1.1, 0.09, 1.7, "#3f3528", 0, 0.665, 0), ...range(3, (r) => F(0.03, 0.012, 0.46, "#45454e", 0.06 + r * 0.045, 0.802, -0.05)),
        F(0.16, 0.006, 0.18, "#203040", 0.14, 0.774, -0.45), F(0.24, 0.02, 0.34, "#1c1c22", -0.38, 0.78, -0.05),
        F(0.12, 0.2, 0.1, "#26262c", -0.4, 0.87, -0.62), F(0.01, 0.12, 0.06, "#121216", -0.34, 0.88, -0.62), 
        ...range(4, (k) => F(0.12, 0.012, 0.12, k % 2 ? "#c8ccd4" : "#9aa0aa", 0.3, 0.778 + k * 0.012, 0.55, 0.1)),
        F(0.01, 0.06, 0.06, "#ffd23a", -0.315, 1.34, 0.18, 0.3), ...range(3, (k) => F(0.01, 0.01, 0.12, "#121216", -0.19, 0.9 + k * 0.03, 0.62))]; });
    }
    {
      const l = CL.frame, s = -l.side;
      detail(kit, l.x, Y, l.z, (M) => { const F = facer(M, s); return [
        F(1.0, 0.08, 1.9, "#4a3826", 0, 0.73, 0), ...[-1, 1].map((k) => F(0.03, 0.05, 2.0, "#c8a060", k * 0.2, 0.86, 0, 0.1)),
        ...[-1, 1].map((k) => F(0.44, 0.06, 0.04, "#8a6a44", 0, 0.86, k * 0.99)), F(0.05, 0.05, 1.8, "#3d2f20", 0.46, 0.2, 0), F(0.05, 0.05, 1.8, "#3d2f20", -0.46, 0.2, 0),
        F(0.18, 0.03, 0.18, "#8a6a44", -0.42, 0.835, -0.9), F(0.17, 0.03, 0.17, "#c8a060", -0.42, 1.27, -0.9, 0.3)]; });
    }
  };

  // --- The split chute (a modern museum toy and its console game) -------------------------------------------------
  // Its rules live in genesis-era-7-split.js (BL.genesisEra7Split); until that file loads before this one the station
  // is left out. It stands on the software desk's island, between the desk and the island's downstream edge, in free
  // floor, so the gallery keeps its size. A hopper over a gate and two bins: ten lamps on each show what it holds in
  // fives, the gate's flap leans toward the output it feeds, and a lamp lights on block 170's 10 and 40. Its console
  // game is Split Chute (`e7-split`, genesis-era-cartridges.js).
  const SPLIT = () => BL.genesisEra7Split || null;
  const SPLIT_EX = { id: "e7-split", year: 2009, title: "Split chute - modern toy", label: "SPLIT CHUTE · MODERN TOY · JANUARY 2009 GALLERY",
    date: "No historical date: a modern museum toy, made in 2026, shown in the January 2009 gallery beside block 170's 50 = 10 + 40 split",
    sourceKeys: ["E7-170-TXS", "E7-DOSSIER"], hint: "Type GATE 1, DROP 10, GATE 2, then DROP ALL.",
    howTo: ["Type GATE 1 or GATE 2 to swing the gate.", "Type DROP 10 (or DROP ALL) to let counters fall through it.",
      "Hopper and outputs always add up to 50.", "CHECK compares with block 170's 10 and 40; RESET refills the hopper."] };
  const SPLIT_AT = place(1, 27.6, 8.6, { x: 0.55, z: 0.7 }, 2.1, 1.6);
  const buildSplit = (kit) => {
    const S = SPLIT();
    if (!S) return null;
    const { top: Y, M, createNode, place: put, solid, sign, obstacle, prop } = kit, l = SPLIT_AT, x = l.x, z = l.z, s = -l.side;
    const node = (geometry, px, py, pz, visible = true) => put(createNode({ geometry, position: { x: px, y: py, z: pz }, visible }));
    const box = (w, h, d, color, emissive = 0) => M.box({ w, h, d, color, emissive });
    solid(1.0, 0.8, 1.3, "#34302c", x, Y + 0.4, z);
    solid(0.5, 0.06, 1.2, "#4a4540", x + s * 0.12, Y + 0.83, z);
    solid(0.12, 0.62, 0.12, "#6a6e74", x - s * 0.18, Y + 1.17, z);
    solid(0.5, 0.32, 0.56, "#6a6e74", x - s * 0.18, Y + 1.64, z);
    const BIN_Z = [z + 0.38, z - 0.38], BIN_C = ["#2f6a6a", "#5a3f7a"];
    for (let k = 0; k < 2; k++) solid(0.42, 0.22, 0.4, BIN_C[k], x + s * 0.12, Y + 0.97, BIN_Z[k]);
    const flaps = [node(box(0.05, 0.04, 0.3, "#46ffd2", 0.8), x - s * 0.08, Y + 1.12, z + 0.14), node(box(0.05, 0.04, 0.3, "#46ffd2", 0.8), x - s * 0.08, Y + 1.12, z - 0.14)];
    const binPips = [[], []], hopperPips = [];
    for (let k = 0; k < 2; k++) for (let i = 0; i < 10; i++) binPips[k].push(node(box(0.02, 0.035, 0.24, "#ffd23a", 0.9), x + s * 0.345, Y + 0.885 + i * 0.019, BIN_Z[k], false));
    for (let i = 0; i < 10; i++) hopperPips.push(node(box(0.02, 0.022, 0.4, "#ffb02e", 0.9), x + s * 0.085, Y + 1.5 + i * 0.028, z, false));
    solid(0.08, 0.36, 0.08, "#2a2320", x - s * 0.38, Y + 1.0, z - 0.55);
    const lampOff = node(box(0.12, 0.1, 0.12, "#3a3a3a"), x - s * 0.38, Y + 1.23, z - 0.55);
    const lampOn = node(box(0.13, 0.11, 0.13, "#6aff9a", 1.4), x - s * 0.38, Y + 1.23, z - 0.55, false);
    sign("SPLIT CHUTE · MODERN TOY", "50 counters in · two outputs · none made or lost", x, Y + 2.25, z, yawOf(s), 0.36);
    detail(kit, x, Y, z, (Mm) => { const F = facer(Mm, s); return [
      F(1.04, 0.08, 1.34, "#24201c", 0, 0.04, 0), F(1.02, 0.04, 1.32, "#c86a28", 0, 0.8, 0, 0.4),
      F(0.54, 0.04, 0.6, "#8a8e96", -0.18, 1.82, 0), F(0.3, 0.04, 0.36, "#4a4e56", -0.18, 1.46, 0), F(0.004, 0.3, 0.44, "#22262c", 0.071, 1.64, 0),
      ...[-1, 1].flatMap((k) => [F(0.1, 0.06, 0.2, "#6a6e74", -0.08, 1.07, k * 0.2), F(0.1, 0.06, 0.12, "#6a6e74", 0.02, 1.04, k * 0.32)]),
      ...[0, 1].flatMap((k) => [F(0.44, 0.03, 0.02, "#c8a060", 0.12, 1.09, (k ? -0.38 : 0.38) + 0.2), F(0.44, 0.03, 0.02, "#c8a060", 0.12, 1.09, (k ? -0.38 : 0.38) - 0.2),
        F(0.002, 0.2, 0.28, "#121216", 0.332, 0.97, k ? -0.38 : 0.38)]),
      F(0.04, 0.04, 0.3, "#6a6e74", -0.18, 1.7, 0.36), F(0.04, 0.16, 0.04, "#6a6e74", -0.18, 1.62, 0.5), F(0.06, 0.06, 0.06, "#e0452b", -0.18, 1.54, 0.5, 0.4),
      ...range(4, (k) => F(0.02, 0.02, 0.02, "#b08a54", 0.505, 0.2 + k * 0.15, 0.6))]; });
    obstacle(x - l.half.x, x + l.half.x, z - l.half.z, z + l.half.z);
    const chute = S.create();
    const show = (c) => {
      for (let k = 0; k < 2; k++) for (let i = 0; i < 10; i++) binPips[k][i].visible = c.out[k] >= (i + 1) * 5 || (i === 0 && c.out[k] > 0);
      for (let i = 0; i < 10; i++) hopperPips[i].visible = c.hopper >= (i + 1) * 5 || (i === 0 && c.hopper > 0);
      flaps[0].visible = c.gate === 0; flaps[1].visible = c.gate === 1;
      const lit = c.matches(); lampOn.visible = lit; lampOff.visible = !lit;
    };
    show(chute);
    const term = S.terminal(chute, show), ex = SPLIT_EX;
    const wrapped = {
      get banner() { return [...howTo(ex), ex.label, `${ex.date}.`, "", ...term.banner]; },
      prompt: term.prompt,
      run: (line) => {
        const cmd = clean(line).toUpperCase();
        if (cmd === "SOURCES") return { lines: sourceLines(ex.sourceKeys) };
        return term.run(line);
      }
    };
    prop({ id: ex.id, year: ex.year, connection: "context", date: ex.date, title: ex.title, label: ex.label, sourceKeys: ex.sourceKeys, hint: ex.hint, howTo: ex.howTo,
      at: { x: x - l.side * (l.half.x + FRONT), y: Y, z }, reach: l.reach, pick: { w: l.half.x * 2, h: l.h, d: l.half.z * 2, x, z }, onUse: () => ({ terminal: wrapped }) });
    return { chute, show };
  };

  // --- Registration -------------------------------------------------------------------------------------------------
  let visit = null;
  BL.genesisExhibits.register(ERA, {
    sources: SOURCES,
    overview: OVERVIEW,
    build(kit) {
      const live = createLive(), parts = buildModels(kit, live), cl = createClusterLive(), cparts = buildCluster(kit, cl);
      for (const o of footprints()) kit.obstacle(o.x0, o.x1, o.z0, o.z1);
      for (const o of clusterFootprints()) kit.obstacle(o.x0, o.x1, o.z0, o.z1);
      for (const key of clusterKeys()) {
        const ex = CLUSTER[key], l = CL[key];
        kit.prop({ id: ex.id, year: ex.year, connection: "context", date: ex.date, title: ex.title, label: ex.label, sourceKeys: ex.sourceKeys,
          at: clusterWalkUp(key, kit.top), reach: l.reach, pick: { w: l.half.x * 2, h: l.h, d: l.half.z * 2, x: l.x, z: l.z }, hint: ex.hint,
          ...(ex.howTo ? { howTo: ex.howTo } : {}), onUse: ex.panel ? () => ({ board: boardOf(ex) }) : () => ({ terminal: cl.terminals[key] }) });
      }
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
      // The museum polish and the split chute, after everything else (see buildDetails and buildSplit).
      buildDetails(kit);
      const split = buildSplit(kit);
      sync(parts, live, 0, true, true);
      syncCluster(cparts, cl, 0, true);
      visit = { live, parts, cl, cparts, split };
    },
    update(dt, elapsed, state) {
      if (!visit) return;
      sync(visit.parts, visit.live, dt, state.calm === true || state.reading === true, state.calm === true);
      syncCluster(visit.cparts, visit.cl, dt, state.calm === true);
    },
    // Nothing outlives a frame here; leaving settles the counters and the activity lights so a return resumes nothing.
    active(on) { if (visit && !on) { visit.live.net.blink = 0; sync(visit.parts, visit.live, 0, true, true); syncCluster(visit.cparts, visit.cl, 0, true); } },
    dispose() { visit = null; }
  });

  BL.genesisEra7 = { ERA, YEARS, NAME, SOURCES, OVERVIEW, EXHIBITS, ISLANDS, LAYOUT, PROPS, GENESIS, B170, RELEASE, ROWS, PEERS, MAX_RECORDS, COUNTERS,
    CLUSTER, CL, SPLIT_EX, SPLIT_AT, buildDetails, buildSplit, createFrame, frameTerminal, createClusterLive, clusterFootprints, clusterKeys, buildCluster, syncCluster,
    sourceOf, stamp, createRecord, createNet, createCounting, recordTerminal, netTerminal, countingTerminal, createLive, footprints, walkUp,
    buildModels, sync, get visit() { return visit; } };
})();
