// Work and Scarcity, 1996–1999. Dossier: gv/research, era-4-work-and-scarcity.md v0.1.
// Kit contract: genesis-exhibits.js. Original museum models and toys; no network or storage.
(() => {
  "use strict";
  const BL = window.BL;
  const sources = {
    "E4-HC": { label: "28 March 1997: Back's computational-postage implementation announcement",
      href: "https://mailing-list-archive.cryptoanarchy.wiki/archive/1997/03/1fea96e9a08fb74d7f1fdeca362f943dcb2ca70017b092359eb8f931e11004cf/", kind: "documented influence", verified: true },
    // The dossier's evidence for that influence: Satoshi's own announcement names Hashcash-style proof-of-work.
    "E4-INFL": { label: "Satoshi Nakamoto, the Bitcoin announcement on the cryptography mailing list (2008): Hashcash-style proof-of-work",
      href: "https://satoshi.nakamotoinstitute.org/emails/cryptography/1/", kind: "documented influence", verified: true },
    "E4-BM": { label: "November 1998 publication: Wei Dai, b-money (proposal)",
      href: "https://nakamotoinstitute.org/library/b-money/", kind: "whitepaper citation", verified: true },
    "E4-NAMES": { label: "Haber and Stornetta: Secure Names for Bit-Strings (1997), whitepaper [5]",
      href: "https://cdn.nakamotoinstitute.org/docs/secure-names-bit-strings.pdf", kind: "whitepaper citation", verified: true },
    "E4-NAMES-CAT": { label: "April 1997 publication month: Secure Names for Bit-Strings catalogue",
      href: "https://nakamotoinstitute.org/library/secure-names-bit-strings/", kind: "whitepaper citation", verified: true },
    "E4-TIMESEC": { label: "Massias, Serret Avila and Quisquater: TIMESEC design, whitepaper [2]",
      href: "https://cdn.nakamotoinstitute.org/docs/secure-timestamping-service.pdf", kind: "whitepaper citation", verified: true },
    "E4-TIMESEC-CAT": { label: "May 1999 proceedings publication month: TIMESEC catalogue",
      href: "https://nakamotoinstitute.org/library/secure-timestamping-service/", kind: "whitepaper citation", verified: true },
    "E4-MODEM": { label: "1 September 1998: ITU-T V.90 approval and signalling ceilings",
      href: "https://www.itu.int/rec/T-REC-V.90-199809-I/en", kind: "context", verified: true },
    // The upgrade cluster's sources, from the READY research records tl-4-deep-blue and tl-4-wifi
    // (genesis-timeline-data.js). `verified: false`: the research read them; this build could not reach those hosts.
    "E4-CHESS": { label: "IBM, Deep Blue (history page): the May 1997 rematch",
      href: "https://ibm.com/history/deep-blue", kind: "context", verified: false },
    "E4-CHESS-CHM": { label: "Computer History Museum catalogue 102695065: the final game, 11 May 1997",
      href: "https://www.computerhistory.org/collections/catalog/102695065", kind: "context", verified: false },
    "E4-WIFI": { label: "IEEE Standards, 802.11-1997: approved 26 June 1997, published 18 November 1997",
      href: "https://standards.ieee.org/ieee/802.11/1163", kind: "context", verified: false },
    "E4-WIFI-PAR": { label: "IEEE 802.11 working group, 802.11b PAR (1998): the 1997 standard's 1 and 2 Mbit/s rates",
      href: "https://grouper.ieee.org/groups/802/11/Documents/DocumentArchives/1998_docs/Feb98/80062W%20PAR%20dot11b.PDF", kind: "context", verified: false },
    // The museum's own note on the information screen and the board: original designs, no historical system claimed.
    "E4-ORIGINAL": { label: "Era 4 exhibit notes: the strategy board, information screen and packet toy are original museum designs",
      href: "https://github.com/Bitcoin-Bill/oogaboogaland/blob/gv/upgrade-era-4/docs/genesis-voyage/exhibits/era-4.md", kind: "context", verified: true }
  };
  const overview = [
    "1996–1999: computers could pay for stamps with work; proposals asked how people could share balances. [E4-HC, E4-BM]",
    "These ideas left questions about ordering, communication and trust. The naming and timestamp papers did not create money. [E4-BM, E4-NAMES, E4-TIMESEC]",
    "Dates identify announcements, publications or standards approval, never a claim that an idea was invented that day."
  ];
  const history = {
    HASHCASH: ["28 March 1997 · implementation announcement [E4-HC]",
      "Adam Back announced computational postage: finding a stamp costs searches; checking costs much less. A service also needs spent-stamp tracking.",
      "This announcement is separate from the 2002 Hashcash paper cited as [6] by Bitcoin. That paper belongs in Era 5.",
      "Documented influence: Satoshi's 2008 announcement of Bitcoin names Hashcash-style proof-of-work. [E4-INFL]"],
    BMONEY: ["November 1998 · proposal publication month [E4-BM]",
      "Wei Dai proposed work-based creation and signed transfers. Protocol 1 gives each participant balances and assumes synchronous, unjammable anonymous broadcast.",
      "Protocol 2 uses a subset of servers with deposits and published commitments. Agreeing computation cost remains a problem. Proposal, not a deployed Bitcoin network; reference [1]. Exact first posting day unresolved."],
    NAMES: ["April 1997 · proceedings publication [E4-NAMES, E4-NAMES-CAT]",
      "Haber and Stornetta's Secure Names for Bit-Strings uses positions in a growing graph of hashes to identify exact data as hash functions age.",
      "Naming data does not decide who may spend money. Bitcoin later cites it as [5]. This is a publication date, not the invention date."],
    TIMESEC: ["May 1999 · proceedings publication month [E4-TIMESEC, E4-TIMESEC-CAT]",
      "Massias, Serret Avila and Quisquater describe verification, auditing and operational procedures for a timestamp service.",
      "Their design retains a third party while reducing trust in it. Bitcoin later cites it as [2]. The PDF title uses singular Requirement; the catalogue uses Requirements."],
    MODEM: ["1 September 1998 · V.90 recommendation approved [E4-MODEM]",
      "The recommendation specifies ceilings of 56,000 bit/s downstream and 33,600 bit/s upstream. These are signalling ceilings, not promised downloads.",
      "The museum modem makes original synthesized tones. It never calls anyone or connects to a network."],
    // The upgrade cluster (genesis-era-4-strategy.js, -teletext.js, -wireless.js), in the READY records' own words.
    CHESS: ["May 1997 · a chess machine wins its rematch [E4-CHESS, E4-CHESS-CHM]",
      "A computer beat the world chess champion: Deep Blue won the rematch 3.5-2.5 at the Equitable Center, New York. The final game is dated 11 May 1997 by a museum catalogue; IBM's page gives the month.",
      "This board is not chess and copies no program. Context only: any likeness between searching moves and proof-of-work is an analogy, not an influence on Bitcoin."],
    SCREEN: ["1996-1999 · the gallery's years; an original museum screen [E4-ORIGINAL]",
      "Numbered text pages chosen with a remote, in a broadcast-text style made for this gallery. Its record pages repeat the museum's READY research records.",
      "It names no real service, system, country or years: that label is on HOLD until a source is verified."],
    WIFI: ["26 June 1997 · IEEE Std 802.11 approved; published 18 November 1997 [E4-WIFI, E4-WIFI-PAR]",
      "Engineers agreed rules so computers could network by radio instead of cables. The first standard defined basic rates of 1 and 2 Mbit/s.",
      "Context only: wireless networking is not an asserted influence on Bitcoin. No later brand names or logos are used here."]
  };
  const reply = (...lines) => ({ lines });
  // Every station opens with a short HOW TO USE: a terminal's first lines, a panel's first page.
  const howTo = (steps) => ["HOW TO USE", ...steps.map((step, i) => `  ${i + 1}. ${step}`), ""];
  const guided = (make, steps) => () => { const t = make(); return { ...t, banner: [...howTo(steps), ...t.banner] }; };
  const howToPage = (steps) => ({ caption: "How to use", title: "How to use", text: steps.map((step, i) => `${i + 1}. ${step}`) });
  const clean = text => String(text).replace(/[\u0000-\u001f\u007f]/g, "").slice(0, 48).trim();
  // FNV-style message seed and integer avalanche: deliberately NOT cryptographic Hashcash/SHA-1.
  const seedOf = text => {
    let h = 2166136261;
    for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
    return h >>> 0;
  };
  const stampHash = (seed, nonce) => {
    let h = seed ^ Math.imul(nonce + 1, 0x9e3779b1);
    h = Math.imul(h ^ (h >>> 16), 0x85ebca6b);
    h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
    return (h ^ (h >>> 16)) >>> 0;
  };
  const PER_FRAME = 64, TOTAL = 32768;
  let work = null, synth = null, desktop = null, maze = null, discs = null, balances = null, decor = null, cluster = null;
  // The upgrade cluster's games live in their own files (BL.genesisEra4Games); each stand opens its game's terminal,
  // with its rules core made once a visit, or says the module is not on the page yet.
  const games = () => BL.genesisEra4Games || {};
  const core = (name) => {
    const g = games()[name];
    if (!g || !cluster) return null;
    if (!cluster[name]) cluster[name] = name === "teletext" ? g.create((BL.genesisTimelineData && BL.genesisTimelineData.records) || []) : g.create();
    return cluster[name];
  };
  const missing = { caption: "This exhibit's game module is not loaded on this page yet." };
  const status = () => reply(`Message: ${work.message}; target: ${work.bits} leading zero bits.`,
    `Attempts this visit: ${work.total}/${TOTAL}; this search: ${work.attempts}.`,
    work.running ? "Searching. Use STATUS in a moment, or STOP." : work.nonce >= 0 ? `Stamp nonce ${work.nonce}; digest ${work.hash.toString(16).padStart(8, "0")}. Use VERIFY, then MESSAGE changed.` : "No stamp. SEARCH starts; TARGET 4..12 adjusts difficulty.");
  const hashTerminal = () => ({
    banner: [...history.HASHCASH, "EDUCATIONAL MODEL: toy 32-bit mixer, not secure hashing, mining or real postage.",
      "MESSAGE <text> | TARGET <4..12> | SEARCH | STATUS | VERIFY | STOP", "Search: at most 64 attempts/frame, 32,768 attempts/visit. Verification: one hash."],
    prompt: "STAMP>",
    run(line) {
      const text = clean(line), split = text.indexOf(" "), cmd = (split < 0 ? text : text.slice(0, split)).toUpperCase(), arg = split < 0 ? "" : text.slice(split + 1);
      if (cmd === "MESSAGE") {
        if (!arg) return reply("Supply a message.");
        work.message = arg; work.seed = seedOf(arg); work.running = false;
        return reply("Message changed. The old stamp remains available for VERIFY; it is bound to its original message.");
      }
      if (cmd === "TARGET") {
        const bits = Number(arg);
        if (!/^\d+$/.test(arg) || !Number.isInteger(bits) || bits < 4 || bits > 12) return reply("Choose an integer from 4 to 12.");
        work.bits = bits; work.running = false; work.nonce = -1;
        return status();
      }
      if (cmd === "SEARCH") {
        if (work.running) return status();
        if (work.total >= TOTAL) return reply("Visit work budget exhausted. Verification still works; no more searching this visit.");
        work.attempts = 0; work.nonce = -1; work.bound = work.message; work.boundSeed = work.seed; work.boundBits = work.bits; work.running = true;
        return reply("Search started. STATUS reads progress; STOP cancels. No rewards or real stamps.");
      }
      if (cmd === "STOP") { work.running = false; return reply("Search stopped."); }
      if (cmd === "VERIFY") {
        if (work.nonce < 0) return reply("Find a stamp first.");
        const h = stampHash(work.seed, work.nonce);
        const valid = work.message === work.bound && work.bits === work.boundBits && h === work.hash && h < 2 ** (32 - work.bits);
        return reply(valid ? "VALID for this message and target (one hash)." : "INVALID: this stamp does not match the current message and target (one hash).",
          "The toy binds exact text explicitly; it is not a secure cryptographic protocol.");
      }
      if (cmd === "STATUS") return status();
      return reply("MESSAGE <text> | TARGET <4..12> | SEARCH | STATUS | VERIFY | STOP");
    }
  });
  // Two pooled oscillators. Never wake from build/update: only a trusted terminal submit gesture.
  const dial = () => {
    if (!window.navigator || !window.navigator.userActivation || !window.navigator.userActivation.isActive) return "Press Enter or submit with a tap to play tones.";
    if (BL.sound.muted) return "Sound is muted. The local connection toy still works.";
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) return "Audio unavailable; the local connection toy still works.";
    try {
      if (!synth) {
        const context = new Audio();
        synth = { context, voices: [] };
        const output = BL.sound.output(context);
        for (let i = 0; i < 2; i++) {
          const osc = context.createOscillator(), gain = context.createGain();
          osc.type = i ? "triangle" : "sine"; gain.gain.value = 0;
          osc.connect(gain); gain.connect(output); osc.start(); synth.voices.push({ osc, gain });
        }
      }
      synth.context.resume().catch(() => {});
      const now = synth.context.currentTime;
      for (let i = 0; i < 2; i++) {
        const v = synth.voices[i];
        v.gain.gain.cancelScheduledValues(now); v.gain.gain.setValueAtTime(0, now);
        v.osc.frequency.cancelScheduledValues(now);
        for (let n = 0; n < 12; n++) {
          const at = now + n * 0.18;
          v.osc.frequency.setValueAtTime(340 + ((n * 7 + i * 5) % 13) * 91, at);
          v.gain.gain.setTargetAtTime(0.025, at, 0.008);
          v.gain.gain.setTargetAtTime(0, at + 0.11, 0.01);
        }
        v.gain.gain.setValueAtTime(0, now + 2.3);
      }
      return "Original two-voice handshake plays. LOCAL LINK READY (simulation).";
    } catch { return "Audio unavailable; the local connection toy still works."; }
  };
  const silence = () => {
    if (!synth) return;
    const now = synth.context.currentTime;
    for (const v of synth.voices) { v.gain.gain.cancelScheduledValues(now); v.gain.gain.setValueAtTime(0, now); }
  };
  const browserTerminal = () => ({
    banner: ["VOYAGE DESKTOP / 1999-inspired original museum design", "[ LOCAL WEB ]  HOME  < BACK  > FORWARD", "OPEN HOME | HASHCASH | BMONEY | NAMES | TIMESEC | MODEM", "BACK | FORWARD | DIAL | HANGUP | SIZE <1..64> (KiB)", "Only museum pages exist. No real URLs, remote content or browsing."],
    prompt: "LOCAL WEB>",
    run(line) {
      const text = clean(line).toUpperCase(), parts = text.split(/\s+/), cmd = parts[0];
      if (cmd === "DIAL") { desktop.connected = true; return reply(dial()); }
      if (cmd === "HANGUP") { desktop.connected = false; silence(); return reply("Local link disconnected."); }
      if (cmd === "SIZE") {
        const size = Number(parts[1]);
        if (!/^\d+$/.test(parts[1] || "") || size < 1 || size > 64) return reply("Choose 1..64 KiB.");
        return reply(`${size} KiB at 56,000 bit/s: ${(size * 1024 * 8 / 56000).toFixed(2)} seconds ideally downstream.`,
          "Theoretical signalling ceiling, ignoring overhead; not measured performance. [E4-MODEM]");
      }
      if (cmd === "OPEN") {
        const page = parts[1];
        if (page !== "HOME" && !Object.prototype.hasOwnProperty.call(history, page)) return reply("Local pages only: HOME, HASHCASH, BMONEY, NAMES, TIMESEC, MODEM.");
        desktop.pages.length = desktop.index + 1;
        if (desktop.pages.length === 8) desktop.pages.shift();
        desktop.pages.push(page); desktop.index = desktop.pages.length - 1;
      } else if (cmd === "BACK") desktop.index = Math.max(0, desktop.index - 1);
      else if (cmd === "FORWARD") desktop.index = Math.min(desktop.pages.length - 1, desktop.index + 1);
      else return reply("OPEN <page> | BACK | FORWARD | DIAL | HANGUP | SIZE <1..64>");
      const page = desktop.pages[desktop.index];
      return { lines: [`museum://${page.toLowerCase()} (local text)`, ...(page === "HOME" ? overview : history[page])] };
    }
  });
  const balanceTerminal = () => ({
    banner: [...history.BMONEY, "Educational comparison, invented balances; no signatures or network implemented.",
      "COMPARE | TRANSFER (A gives B 2) | CREATE (proposed work earns A 1) | MISS (one replica misses a transfer) | RESET"],
    prompt: "PROPOSAL>",
    run(line) {
      const cmd = clean(line).toUpperCase();
      if (cmd === "RESET") { balances.a.fill(5); balances.b.fill(3); balances.created = 0; }
      else if (cmd === "TRANSFER" || cmd === "MISS") {
        if (balances.a[0] < 2 || balances.a[1] < 2) return reply("Insufficient A balance. RESET to compare again.");
        for (let i = 0; i < (cmd === "MISS" ? 1 : 2); i++) { balances.a[i] -= 2; balances.b[i] += 2; }
      } else if (cmd === "CREATE") {
        if (balances.created >= 15) return reply("Toy creation cap reached; RESET.");
        balances.a[0]++; balances.a[1]++; balances.created++;
        return reply("Both replicas credit A one invented unit for an assumed work solution.", "No actual work priced here. Dai's proposal ties creation to computation cost; agreeing that cost is unresolved. [E4-BM]");
      } else if (cmd !== "COMPARE") return reply("COMPARE | TRANSFER | CREATE | MISS | RESET");
      return reply(`Replica 1: A=${balances.a[0]} B=${balances.b[0]}; Replica 2: A=${balances.a[1]} B=${balances.b[1]}.`,
        balances.a[0] === balances.a[1] && balances.b[0] === balances.b[1] ? "Balances agree in this toy." : "Balances disagree. Merely copying accounts cannot repair a missed message.",
        "Protocol 1 assumes reliable synchronous anonymous broadcast; protocol 2 uses servers, deposits and commitments. [E4-BM]");
    }
  });
  const mazeRows = ["#########", "#...#...#", "###.#.#.#", "#...#.#.#", "#.###.#.#", "#.....#.#", "#########"];
  const mazeScreen = () => {
    const lines = ["POCKET ROUTE / original turn-based maze. @ you; + exit; # wall."];
    for (let y = 0; y < 7; y++) {
      let row = "";
      for (let x = 0; x < 9; x++) row += x === maze.x && y === maze.y ? "@" : x === 7 && y === 5 ? "+" : mazeRows[y][x];
      lines.push(row);
    }
    lines.push(maze.won ? "EXIT FOUND! RESET for a new run." : `${maze.moves}/64 moves. N / S / E / W, LOOK or RESET.`);
    return { lines };
  };
  const mazeTerminal = () => ({ banner: ["1999-inspired handheld scenery; original museum game, no historical product claim.", ...mazeScreen().lines], prompt: "POCKET>", run(line) {
    const cmd = clean(line).toUpperCase();
    if (cmd === "RESET") { maze.x = 1; maze.y = 1; maze.moves = 0; maze.won = false; }
    else if (cmd !== "LOOK") {
      if (!/^[NSEW]$/.test(cmd)) return reply("N / S / E / W | LOOK | RESET");
      if (maze.won || maze.moves >= 64) return reply("Run finished. RESET to play again.");
      const x = maze.x + (cmd === "E" ? 1 : cmd === "W" ? -1 : 0), y = maze.y + (cmd === "S" ? 1 : cmd === "N" ? -1 : 0);
      if (mazeRows[y][x] !== "#") { maze.x = x; maze.y = y; }
      maze.moves++; maze.won = maze.x === 7 && maze.y === 5;
    }
    return mazeScreen();
  } });
  const order = ["HC", "NAMES", "BM", "TIMESEC"];
  const discTerminal = () => ({
    banner: ["1999-inspired CD-ROM selector / invented museum puzzle, no capacity or introduction-date claim.",
      "Load the archive discs in date order: HC, NAMES, BM, TIMESEC.", "PICK <disc> | LIST | RESET. No software, recordings or remote files are loaded."],
    prompt: "ARCHIVE>", run(line) {
      const parts = clean(line).toUpperCase().split(/\s+/);
      if (parts[0] === "RESET") { discs.next = 0; return reply("Selection cleared."); }
      if (parts[0] === "LIST") return reply(history.HASHCASH[0], history.NAMES[0], history.BMONEY[0], history.TIMESEC[0]);
      if (parts[0] !== "PICK" || !order.includes(parts[1])) return reply("PICK HC | PICK NAMES | PICK BM | PICK TIMESEC | LIST | RESET");
      if (discs.next === 4) return reply("Archive complete! RESET to replay.");
      if (parts[1] !== order[discs.next]) return reply("Wrong slot. LIST gives the dated labels. Your progress is kept.");
      discs.next++;
      return reply(discs.next === 4 ? "Archive complete! Announcement, publication, proposal, proceedings." : `Correct: ${discs.next}/4. Select the next dated disc.`);
    }
  });
  BL.genesisExhibits.register(4, {
    sources,
    overview: { summary: "1996-1999: computers could pay for stamps with work, and proposals asked how strangers could share balances. These ideas left open questions about ordering, communication and trust.",
      sourceKeys: ["E4-HC", "E4-BM", "E4-NAMES", "E4-TIMESEC"], pages: [{ caption: "Era overview", title: "Work, accounts and trust", text: overview }] },
    build(kit) {
      work = { message: "hello museum", seed: seedOf("hello museum"), bits: 8, total: 0, attempts: 0, nonce: -1, hash: 0, running: false, bound: "", boundSeed: 0, boundBits: 8 };
      desktop = { pages: ["HOME"], index: 0, connected: false };
      maze = { x: 1, y: 1, moves: 0, won: false }; discs = { next: 0 };
      balances = { a: new Uint8Array([5, 5]), b: new Uint8Array([3, 3]), created: 0 };
      const { era, top, solid, sign, obstacle, prop } = kit;
      const board = (room, keys, pages) => ({ board: { room, sources: keys, pages } });
      decor = { modem: [], hub: [], step: -1, quiet: null, line: null };
      const y = (h) => top + h;
      const boxes = (list) => { for (const b of list) solid(...b); };
      // Recognisable details on each station, all inside its own obstacle (x +-1.9, z -0.9 to +1.3): original,
      // unbranded shapes that say nothing about real products.
      const book = (x, z) => boxes([[1, 0.05, 0.42, "#7a5c3e", x, y(0.93), z + 0.58], [0.46, 0.03, 0.36, "#f3ecda", x - 0.24, y(0.97), z + 0.58], [0.46, 0.03, 0.36, "#f3ecda", x + 0.24, y(0.97), z + 0.58]]);
      const dress = {
        // An envelope with a stamp on it beside the work blocks: postage that is paid for with searching.
        "e4-hashcash": (x, z) => boxes([[0.6, 0.02, 0.36, "#efe8d6", x + 1.45, y(0.91), z + 0.56], [0.13, 0.025, 0.15, "#c8463c", x + 1.66, y(0.92), z + 0.47],
          [0.42, 0.012, 0.02, "#b7ab92", x + 1.4, y(0.925), z + 0.6], [0.42, 0.012, 0.02, "#b7ab92", x + 1.4, y(0.925), z + 0.66]]),
        // Two open account books, one for each replica that COMPARE reads.
        "e4-bmoney": (x, z) => { for (const dx of [-0.8, 0.8]) boxes([[0.74, 0.04, 0.4, "#f1ead8", x + dx, y(0.92), z + 0.58], [0.03, 0.045, 0.4, "#6d5a45", x + dx, y(0.925), z + 0.58],
          ...[0, 1, 2].map((k) => [0.6, 0.006, 0.02, "#8aa0c4", x + dx, y(0.943), z + 0.48 + k * 0.1])]); },
        // An open bound volume on a reading board: these two stations are papers.
        "e4-names": (x, z) => book(x, z),
        "e4-timesec": (x, z) => book(x, z),
        // A deep CRT back, a beige tower with drive slots and a mouse: a desktop computer at a glance.
        "e4-desktop": (x, z) => boxes([[1.3, 1, 0.4, "#b9b09a", x, y(1.5), z - 0.65], [0.5, 1.1, 0.9, "#cfc6ae", x - 1.4, y(1.45), z - 0.1],
          [0.36, 0.05, 0.02, "#3a3a3a", x - 1.4, y(1.75), z + 0.36], [0.36, 0.05, 0.02, "#3a3a3a", x - 1.4, y(1.62), z + 0.36], [0.05, 0.05, 0.02, "#7dff8a", x - 1.52, y(1.1), z + 0.36, 0.6],
          [0.5, 0.01, 0.4, "#2d3a4a", x + 1.25, y(0.91), z + 0.6], [0.12, 0.05, 0.18, "#d8d0bb", x + 1.25, y(0.94), z + 0.6]]),
        // A telephone cord from the modem's back to a wall-style jack post, and a plain desk telephone beside it.
        "e4-modem": (x, z) => boxes([[0.04, 0.04, 0.4, "#2a2a2a", x + 0.6, y(1.0), z - 0.65], [0.04, 0.5, 0.04, "#2a2a2a", x + 0.6, y(0.75), z - 0.84],
          [0.2, 0.3, 0.06, "#e8e2d2", x + 0.6, y(0.35), z - 0.86], [0.56, 0.12, 0.4, "#3b3f48", x + 1.45, y(0.96), z + 0.2], [0.6, 0.08, 0.14, "#2f333b", x + 1.45, y(1.06), z + 0.08]]),
        // A slim drive with an open tray behind the discs, where an archive disc would go.
        "e4-cd": (x, z) => boxes([[1.4, 0.24, 0.36, "#cfc6ae", x, y(1.04), z - 0.6], [0.7, 0.03, 0.04, "#3a3a3a", x - 0.2, y(1.06), z - 0.41], [0.06, 0.04, 0.02, "#7dff8a", x + 0.5, y(1.06), z - 0.41, 0.6]]),
        // A second button, a speaker grille and a wrist strap: a handheld game.
        "e4-pocket": (x, z) => boxes([[0.1, 0.06, 0.1, "#d69654", x + 0.36, y(1.12), z + 0.24], ...[0, 1, 2].map((k) => [0.16, 0.06, 0.02, "#263039", x + 0.25, y(1.11), z + 0.5 + k * 0.05]),
          [0.04, 0.03, 0.4, "#2f3a44", x - 0.47, y(0.93), z + 0.4]])
      };
      // The era's big sign, pylons, overview board and the trail are the shared signage's; this era's own
      // introduction is its overview's page (register's `overview`, below).
      // Station footprints stay at least 1.5 m from the channel and leave broad bank routes.
      // `link` is the station's place on the Steps toward Bitcoin (docs/genesis-voyage/EXHIBIT-CONTRACT.md):
      // { connection, ref, date }, from the Era 4 dossier's classes.
      const station = (id, x, z, year, title, sub, keys, use, style, link) => {
        solid(3.6, 0.9, 1.6, "#625346", x, top + 0.45, z);
        if (style === "screen") {
          solid(1.8, 1.3, 1, "#c4baa2", x, top + 1.55, z);
          solid(1.45, 0.9, 0.04, "#223e57", x, top + 1.58, z + 0.52, 0.3);
          solid(1.7, 0.12, 0.5, "#b4aa92", x, top + 0.97, z + 0.95);
          sign("LOCAL WEB", "OPEN HOME / BACK / FORWARD", x, top + 1.6, z + 0.56, 0, 0.17);
        } else if (style === "pocket") {
          solid(0.9, 0.18, 1.25, "#576f86", x, top + 1, z);
          solid(0.6, 0.05, 0.55, "#aac477", x, top + 1.12, z - 0.2);
          solid(0.3, 0.06, 0.09, "#263039", x - 0.2, top + 1.12, z + 0.33);
          solid(0.09, 0.06, 0.3, "#263039", x - 0.2, top + 1.12, z + 0.33);
          solid(0.1, 0.06, 0.1, "#d69654", x + 0.23, top + 1.12, z + 0.35);
        } else if (style === "modem") {
          solid(2.2, 0.4, 0.9, "#b7b09e", x, top + 1.13, z);
          for (let i = 0; i < 4; i++) decor.modem.push(solid(0.1, 0.09, 0.04, "#78cb96", x - 0.7 + i * 0.3, top + 1.14, z + 0.47, 0.5));
          sign("LINK / LOCAL", "DIAL / HANGUP", x, top + 1.6, z + 0.5, 0, 0.2);
        } else if (style === "discs") {
          for (let i = 0; i < 4; i++) {
            const dx = x - 1.2 + i * 0.8, color = ["#c1badf", "#9fcaca", "#c9d4a2", "#d8b194"][i];
            solid(0.72, 0.05, 0.4, color, dx, top + 0.97, z);
            solid(0.6, 0.05, 0.6, color, dx, top + 0.97, z);
            solid(0.4, 0.05, 0.72, color, dx, top + 0.97, z);
            solid(0.12, 0.01, 0.12, "#625346", dx, top + 1, z);
            sign(order[i], "ARCHIVE", dx, top + 1.5, z, 0, 0.15);
          }
        } else {
          for (let i = 0; i < 4; i++) solid(0.45, 0.25 + i * 0.13, 0.7, ["#d9ac52", "#729eac", "#9987b9", "#99aa68"][i], x - 1.15 + i * 0.75, top + 1.05 + i * 0.065, z);
        }
        if (dress[id]) dress[id](x, z);
        obstacle(x - 1.9, x + 1.9, z - 0.9, z + 1.3);
        sign(title, sub, x, top + 3, z + 0.2, 0, 0.42);
        prop({ id, year, ...link, title, label: `${title} / ${year}`, sourceKeys: keys, at: { x, y: top, z: z + 2 }, reach: 2.2, pick: { w: 3.6, h: 2.5, d: 1.6, x, z }, onUse: use });
      };
      station("e4-hashcash", -9, era.z - 3, 1997, "HASHCASH / 28 MAR 1997", "implementation announcement - educational workbench", ["E4-HC", "E4-INFL"], () => ({ terminal: guided(hashTerminal, ["Type SEARCH and press Enter to hunt for a stamp.",
          "Type STATUS until it shows a stamp nonce.", "Type VERIFY: one hash checks the stamp.", "Type MESSAGE and new words, then VERIFY: the old stamp fails."])() }), undefined,
        { hint: "Type SEARCH, then STATUS, then VERIFY", connection: "influence", date: "28 March 1997: implementation announcement (the 2002 paper, reference [6], is Era 5's)" });
      station("e4-bmoney", -21, era.z - 3, 1998, "B-MONEY / NOV 1998", "proposal publication - compare accounts", ["E4-BM"], () => ({ terminal: guided(balanceTerminal, ["Type COMPARE: both replicas agree.",
          "Type MISS: one replica misses a transfer.", "Type COMPARE again: the balances disagree.", "Type RESET to start over; TRANSFER and CREATE reach both."])() }), undefined,
        { hint: "Type COMPARE, then MISS, then COMPARE", connection: "citation", ref: "[1]", date: "November 1998: proposal publication month" });
      // The reference shelf, as two dated stops: each paper is its own whitepaper citation.
      station("e4-names", -16, era.z0 + 12, 1997, "SECURE NAMES / APR 1997", "proceedings publication - naming exact data", ["E4-NAMES", "E4-NAMES-CAT"],
        () => board("Secure Names for Bit-Strings / April 1997", ["E4-NAMES", "E4-NAMES-CAT"], [
          howToPage(["Page on with the arrows to read about the April 1997 paper.", "The last page says how it connects to Bitcoin.", "Sources lists the paper and its catalogue record."]),
          { caption: "April 1997 publication", title: "Secure Names for Bit-Strings", text: history.NAMES }
        ]), undefined, { hint: "Read about naming exact data", connection: "citation", ref: "[5]", date: "April 1997: proceedings publication" });
      station("e4-timesec", -10, era.z0 + 12, 1999, "TIMESEC / MAY 1999", "proceedings publication - a timestamp service", ["E4-TIMESEC", "E4-TIMESEC-CAT"],
        () => board("TIMESEC / May 1999", ["E4-TIMESEC", "E4-TIMESEC-CAT"], [
          howToPage(["Page on with the arrows to read about the May 1999 paper.", "The last page says how it connects to Bitcoin.", "Sources lists the paper and its catalogue record."]),
          { caption: "May 1999 publication", title: "TIMESEC / a timestamp service", text: history.TIMESEC }
        ]), undefined, { hint: "Read about a timestamp service", connection: "citation", ref: "[2]", date: "May 1999: proceedings publication month" });
      station("e4-desktop", 17, era.z1 - 19, 1999, "LOCAL WEB DESKTOP / 1999", "original museum design - OPEN HOME", ["E4-HC", "E4-BM", "E4-NAMES", "E4-TIMESEC", "E4-MODEM"], () => ({ terminal: guided(browserTerminal, ["Type OPEN HASHCASH (or HOME, BMONEY, NAMES, TIMESEC, MODEM).",
          "Type BACK and FORWARD to move through the pages you opened.", "Type SIZE 16 to time a 16 KiB page at the 1998 ceiling."])() }), "screen",
        { hint: "Type OPEN HOME, then OPEN a page", connection: "context", date: "1999: the period illustrated; an original museum design" });
      station("e4-modem", 29, era.z1 - 19, 1998, "MODEM / 1 SEP 1998", "V.90 approval - DIAL plays original tones", ["E4-MODEM"], () => ({ terminal: guided(browserTerminal, ["Type DIAL and press Enter: original tones play if sound is on.",
          "Watch the modem's second lamp: it stays lit while the toy link is up.", "Type SIZE 64 to time 64 KiB at the 56,000 bit/s ceiling.", "Type HANGUP to stop the tones."])() }), "modem",
        { hint: "Type DIAL, then SIZE 64, then HANGUP", connection: "context", date: "1 September 1998: ITU-T V.90 recommendation approved" });
      station("e4-cd", 17, era.z - 9, 1999, "CD-ROM ARCHIVE / 1999", "invented museum puzzle - select discs by date", ["E4-HC", "E4-NAMES-CAT", "E4-BM", "E4-TIMESEC-CAT"], () => ({ terminal: guided(discTerminal, ["Type LIST to read each disc's dated label.",
          "Type PICK HC for the earliest disc.", "PICK the other three in date order.", "Type RESET to play again."])() }), "discs",
        { hint: "Type LIST, then PICK HC", connection: "context", date: "1999: the period illustrated; an invented museum puzzle" });
      station("e4-pocket", 29, era.z0 + 14, 1999, "POCKET ROUTE / 1999", "original maze - N S E W - no ROM", ["E4-MODEM"], () => ({ terminal: guided(mazeTerminal, ["Type E and press Enter to step the @ east.",
          "Use N, S, E and W to reach the + exit.", "Type LOOK to redraw the map, or RESET to start again."])() }), "pocket",
        { hint: "Type E, then steer with N S E W", connection: "context", date: "1999: the period illustrated; an original maze" });

      // --- The upgrade cluster: three compact stands on the right bank, between the CD-ROM archive and the games
      // corner (old x 24.6 to 36.4, z era.z - 0.8 to + 2.7 with their walk-up spots), clear of the lamp at x 22, the
      // walkways and the other stations. Each opens its own game's terminal; their console forms are `make(host)`.
      cluster = { strategy: null, teletext: null, wireless: null, leds: [], mask: -1 };
      const stand = (id, x, year, title, sub, keys, use, link, model) => {
        const z = era.z + 1;
        solid(2.6, 0.8, 1.4, "#4f4a5c", x, y(0.4), z);
        model(x, z);
        obstacle(x - 1.4, x + 1.4, z - 0.8, z + 1);
        sign(title, sub, x, y(2.7), z + 0.1, 0, 0.32);
        prop({ id, year, ...link, title, label: title.includes(String(year)) ? title : `${title} / ${year}`, sourceKeys: keys, at: { x, y: top, z: z + 1.9 }, reach: 1.9, pick: { w: 2.6, h: 2.2, d: 1.4, x, z }, onUse: use });
      };
      stand("e4-strategy", 26, 1997, "STRATEGY BOARD / MAY 1997", "modern museum homage - reach the goal", ["E4-CHESS", "E4-CHESS-CHM", "E4-ORIGINAL"],
        () => { const c = core("strategy"); return c ? { terminal: games().strategy.terminal(c, history.CHESS) } : missing; },
        { hint: "Type LOOK, then MOVE A N", connection: "context", date: "May 1997: a chess machine wins its rematch; this board is a modern museum homage" },
        (x, z) => {
          boxes([[1.6, 0.06, 1.2, "#2a3446", x, y(0.83), z], [0.22, 0.02, 0.22, "#ffb02e", x - 0.6, y(0.87), z - 0.42, 0.4],
            [0.2, 0.2, 0.2, "#5a5a62", x - 0.15, y(0.96), z - 0.42], [0.2, 0.2, 0.2, "#5a5a62", x + 0.3, y(0.96), z - 0.05], [0.2, 0.2, 0.2, "#5a5a62", x - 0.3, y(0.96), z + 0.15],
            [0.14, 0.22, 0.14, "#46ffd2", x - 0.6, y(0.97), z + 0.42], [0.14, 0.22, 0.14, "#5ec8ff", x + 0.6, y(0.97), z + 0.42], [0.16, 0.3, 0.16, "#e0452b", x, y(1.01), z]]);
        });
      stand("e4-teletext", 30.5, 1996, "INFORMATION SCREEN / 1996-1999", "original pages - type 100", ["E4-ORIGINAL"],
        () => { const c = core("teletext"); return c ? { terminal: games().teletext.terminal(c) } : missing; },
        { hint: "Type 100, then a page number", connection: "context", date: "1996-1999: the gallery's years; an original museum screen, no historical system claimed" },
        (x, z) => {
          boxes([[1.1, 0.85, 0.8, "#2b2b30", x, y(1.23), z - 0.05], [0.8, 0.6, 0.4, "#24242a", x, y(1.2), z - 0.6], [0.9, 0.62, 0.02, "#08140f", x, y(1.25), z + 0.36, 0.3],
            [0.8, 0.05, 0.01, "#c8ff5a", x, y(1.5), z + 0.375, 0.7], ...[0, 1, 2].map((k) => [0.6 - k * 0.12, 0.035, 0.01, "#efe6d2", x - 0.1 - k * 0.06, y(1.38 - k * 0.1), z + 0.375, 0.6]),
            ...["#e0452b", "#6fae3a", "#ffd23a", "#5ec8ff"].map((c, k) => [0.16, 0.05, 0.01, c, x - 0.3 + k * 0.2, y(1.03), z + 0.375, 0.6]),
            [0.14, 0.04, 0.4, "#1d1d22", x + 0.85, y(0.82), z + 0.4], [0.06, 0.012, 0.06, "#e0452b", x + 0.85, y(0.845), z + 0.3, 0.4]]);
        });
      stand("e4-wireless", 35, 1997, "PACKETS BY RADIO / 26 JUN 1997", "IEEE 802.11 approved - a toy, not the protocol", ["E4-WIFI", "E4-WIFI-PAR", "E4-ORIGINAL"],
        () => { const c = core("wireless"); return c ? { terminal: games().wireless.terminal(c, history.WIFI) } : missing; },
        { hint: "Type MAP, then SEND A E", connection: "context", date: "26 June 1997: IEEE Std 802.11 approved (published 18 November 1997); the toy is an original model" },
        (x, z) => {
          // The five boxes in the toy's own layout (genesis-era-4-wireless.js STATIONS), each with an antenna and a lamp
          // that shows whether it is switched on.
          for (const [bx, bz] of [[10, 45], [42, 22], [44, 72], [80, 45], [118, 52]]) {
            const px = x - 1 + (bx - 10) / 108 * 2, pz = z - 0.45 + (bz - 22) / 50 * 0.9;
            boxes([[0.2, 0.1, 0.16, "#cfc6ae", px, y(0.85), pz], [0.02, 0.3, 0.02, "#2a2a2a", px + 0.07, y(1.05), pz - 0.05]]);
            cluster.leds.push(solid(0.04, 0.03, 0.02, "#7dff8a", px - 0.05, y(0.88), pz + 0.085, 0.8));
          }
        });

      // --- Era decor: late-1990s set dressing, original and unbranded, making no claims ------------------------------
      // Against the two cave walls, behind every station (left x -34 to -29.4, right 36.4 to 42), so the stream,
      // the waterside walk, the stations' paths and the views to the far wall and the overview board stay open. No
      // words, makers, model names, dates or specifications: a home office with a CRT and a phone line, a study shelf
      // of spiral-bound manuals under glow stars, a networked games corner on folding tables, a stack of shipping
      // boxes. Up the walls, two alcoves for the jetpack: a loft shelf (with the cave's dated notes) and a server niche.
      const L = era.cave.x0, R = era.cave.x1, U = (u) => era.z1 - u;
      const group = (x0, x1, u0, u1, list) => { obstacle(x0, x1, U(u1), U(u0)); boxes(list); };
      const crt = (x, z, face) => [[0.62, 0.55, 0.6, "#cfc6b0", x, y(1.05), z], [0.02, 0.42, 0.5, "#2e5470", x + face * 0.32, y(1.07), z, 0.35],
        [0.4, 0.4, 0.42, "#c2b9a2", x - face * 0.48, y(1.03), z], [0.22, 0.04, 0.55, "#d8d0bb", x + face * 0.5, y(0.79), z]];
      // Home office, left wall: desk, CRT, keyboard and mouse, a tower on the floor, a cordless phone, the phone
      // line from a wall jack, and an inflatable armchair in see-through violet.
      const zo = U(23);
      group(L, -29.4, 20, 26, [[1.1, 0.06, 2.4, "#8a6f52", L + 1.1, y(0.75), zo], [1, 0.72, 0.06, "#6e573f", L + 1.1, y(0.36), zo - 1.15], [1, 0.72, 0.06, "#6e573f", L + 1.1, y(0.36), zo + 1.15],
        ...crt(L + 0.95, zo - 0.4, 1), [0.1, 0.04, 0.07, "#d8d0bb", L + 1.45, y(0.8), zo + 0.05],
        [0.6, 0.9, 0.24, "#d3cab3", L + 1.1, y(0.45), zo + 1.5], [0.02, 0.05, 0.16, "#3a3a3a", L + 1.41, y(0.75), zo + 1.5], [0.02, 0.03, 0.03, "#7dff8a", L + 1.41, y(0.2), zo + 1.5, 0.6],
        [0.22, 0.06, 0.16, "#3b3f48", L + 1.3, y(0.81), zo + 0.6], [0.06, 0.05, 0.22, "#2f333b", L + 1.3, y(0.86), zo + 0.6],
        [0.03, 0.12, 0.08, "#e8e2d2", L + 0.04, y(0.35), zo + 0.9], [0.02, 0.45, 0.02, "#2a2a2a", L + 0.1, y(0.6), zo + 0.9], [0.5, 0.02, 0.02, "#2a2a2a", L + 0.35, y(0.82), zo + 0.9],
        [0.9, 0.35, 0.9, "#9b6fd6", L + 2.4, y(0.2), zo - 0.4, 0.15], [0.3, 0.6, 0.9, "#9b6fd6", L + 2.8, y(0.6), zo - 0.4, 0.15],
        [0.8, 0.28, 0.24, "#a77fe0", L + 2.45, y(0.5), zo - 0.9, 0.15], [0.8, 0.28, 0.24, "#a77fe0", L + 2.45, y(0.5), zo + 0.1, 0.15],
        [3.6, 0.01, 3.6, "#2f6f8f", L + 2.2, y(0.005), zo]]);
      // The loft above it: a lit niche 3.8 m up, with jewel cases, a box of disks, manuals and a coiled cable.
      const shelfX = L + 0.5;
      boxes([[0.08, 2.6, 3.4, "#1b2433", L + 0.06, y(5.1), zo], [0.9, 0.12, 3.4, "#4b5d7a", shelfX, y(3.8), zo], [0.9, 0.12, 3.4, "#4b5d7a", shelfX, y(6.4), zo],
        [0.9, 2.6, 0.12, "#4b5d7a", shelfX, y(5.1), zo - 1.7], [0.9, 2.6, 0.12, "#4b5d7a", shelfX, y(5.1), zo + 1.7], [0.8, 0.08, 3.2, "#4b5d7a", shelfX, y(5.1), zo],
        [0.04, 0.04, 3.2, "#9fd0ff", L + 0.9, y(6.28), zo, 0.9],
        ...[0, 1, 2, 3, 4, 5].map((k) => [0.36, 0.03, 0.4, ["#d7dde6", "#9fc6e8", "#e8b9c9"][k % 3], shelfX, y(3.88 + k * 0.035), zo - 1.1]),
        [0.4, 0.3, 0.4, "#5b6b8a", shelfX, y(4.01), zo - 0.4], [0.5, 0.03, 0.05, "#8f8f8f", shelfX, y(3.875), zo + 0.55], [0.5, 0.03, 0.05, "#8f8f8f", shelfX, y(3.875), zo + 1.0],
        [0.05, 0.03, 0.45, "#8f8f8f", shelfX - 0.22, y(3.875), zo + 0.775], [0.05, 0.03, 0.45, "#8f8f8f", shelfX + 0.22, y(3.875), zo + 0.775],
        ...[0, 1, 2, 3].map((k) => [0.3, 0.42, 0.08, ["#e0a03c", "#4f8fc0", "#c0504f", "#6aa86a"][k], shelfX, y(5.35), zo - 1.2 + k * 0.12])]);
      sign("LOFT NOTES / 1996-1999", "jetpack find - hold Space in the air", L + 0.6, y(7.05), zo, Math.PI / 2, 0.3);
      prop({ id: "e4-loft", year: 1996, hint: "Fly up to the lit loft and press Space", connection: "context", date: "1996-1999: the era's years; each line inside says what its own date marks",
        title: "Loft notes: what each date marks", label: "LOFT NOTES / 1996-1999", sourceKeys: ["E4-HC", "E4-NAMES", "E4-BM", "E4-MODEM", "E4-TIMESEC"],
        at: { x: -28.8, y: y(3.9), z: zo }, reach: 2.4, pick: { w: 1, h: 2.6, d: 3.4, x: shelfX, z: zo },
        onUse: () => board("Loft notes / what each date marks", ["E4-HC", "E4-NAMES", "E4-BM", "E4-MODEM", "E4-TIMESEC"], [
          howToPage(["You found the loft: hold Space in the air (Blast off on a touch screen) to climb.", "Page on with the arrows: one dated line for each station below.", "Close this panel, then let go of Space to land."]),
          { caption: "Dates in this cave", title: "What each date marks", text: [history.HASHCASH[0], history.NAMES[0], history.BMONEY[0], history.MODEM[0], history.TIMESEC[0], overview[2]] },
          { caption: "About the scenery", title: "Office, shelves and corners", text: [
            "The office, study shelf, games corner, boxes, this loft and the server niche are original late-1990s-style scenery.",
            "They model no real product and make no historical claim. The dated stations below carry the history."] }
        ]) });
      // Study shelf, left wall: spiral-bound manuals in four rows, a magazine stack, and glow-in-the-dark stars above.
      const zs = U(34.5), inks = ["#e0a03c", "#4f8fc0", "#c0504f", "#6aa86a", "#d7d0be", "#8a6fc0"], shelf = [];
      for (let row = 0; row < 4; row++) for (let i = 0; i < 6; i++) shelf.push([0.36, 0.42, 0.12, inks[(i + row * 2) % 6], L + 0.5, y(0.29 + row * 0.55), zs - 0.75 + i * 0.3]);
      group(L, -30.6, 32, 37, [[0.5, 2.2, 0.06, "#5d4a39", L + 0.5, y(1.1), zs - 1], [0.5, 2.2, 0.06, "#5d4a39", L + 0.5, y(1.1), zs + 1], [0.04, 2.2, 2, "#4a3b2d", L + 0.27, y(1.1), zs],
        ...[0.05, 0.6, 1.15, 1.7, 2.2].map((h) => [0.5, 0.05, 2, "#6e573f", L + 0.5, y(h), zs]), ...shelf,
        [0.5, 0.3, 0.4, "#c9c2b0", L + 1.4, y(0.15), zs + 1.6], [0.5, 0.01, 0.4, "#e05a7a", L + 1.4, y(0.305), zs + 1.6],
        ...[[3.1, -0.6], [3.4, 0.2], [3.0, 0.9], [3.7, -0.1], [3.9, 0.7], [3.3, -1.1], [4.1, -0.5]].map(([h, dz]) => [0.02, 0.08, 0.08, "#c8ff9e", L + 0.03, y(h), zs + dz, 0.8])]);
      // Games corner, right wall: two folding tables, three beige towers and CRTs on a shared hub whose lamps blink
      // quietly, folding chairs, a cable coil and a pizza box.
      const zg = U(26);
      const corner = [[1.2, 0.05, 3.6, "#8f8a80", R - 1.1, y(0.74), zg - 1.85], [1.2, 0.05, 3.6, "#8f8a80", R - 1.1, y(0.74), zg + 1.85],
        [0.3, 0.08, 0.7, "#4a4f57", R - 1.05, y(0.81), zg + 1.3], [0.03, 0.015, 2.6, "#9a9a9a", R - 0.8, y(0.775), zg],
        [0.6, 0.04, 0.06, "#8f8f8f", R - 4, y(0.02), zg - 3.3], [0.6, 0.04, 0.06, "#8f8f8f", R - 4, y(0.02), zg - 3.84], [0.06, 0.04, 0.6, "#8f8f8f", R - 4.27, y(0.02), zg - 3.57], [0.06, 0.04, 0.6, "#8f8f8f", R - 3.73, y(0.02), zg - 3.57],
        [0.5, 0.05, 0.5, "#e0d6c2", R - 0.8, y(0.795), zg + 3.3]];
      for (const tz of [-1.85, 1.85]) for (const lx of [-0.5, 0.5]) for (const lz of [-1.7, 1.7]) corner.push([0.05, 0.72, 0.05, "#55606e", R - 1.1 + lx, y(0.36), zg + tz + lz]);
      for (const dz of [-2.6, 0, 2.6]) corner.push(...crt(R - 0.95, zg + dz, -1), [0.6, 0.9, 0.24, "#d3cab3", R - 1.1, y(0.45), zg + dz + 0.6],
        [0.5, 0.05, 0.5, "#3d4a5c", R - 2.6, y(0.46), zg + dz], [0.05, 0.5, 0.5, "#3d4a5c", R - 2.85, y(0.72), zg + dz], [0.06, 0.44, 0.06, "#55606e", R - 2.6, y(0.22), zg + dz]);
      group(36.4, R, 21.5, 30.5, corner);
      for (let i = 0; i < 8; i++) decor.hub.push(solid(0.02, 0.03, 0.04, "#7dff8a", R - 1.21, y(0.815), zg + 1.02 + i * 0.08, 0.6));
      // Server niche, right wall, 4.4 m up: stacked rack units with steady lamps. Shipping boxes on the floor below.
      const zn = U(47), nicheX = R - 0.5;
      const niche = [[0.08, 2.4, 3, "#1b2433", R - 0.06, y(5.6), zn], [0.9, 0.12, 3, "#4b5d7a", nicheX, y(4.4), zn], [0.9, 0.12, 3, "#4b5d7a", nicheX, y(6.8), zn],
        [0.9, 2.4, 0.12, "#4b5d7a", nicheX, y(5.6), zn - 1.5], [0.9, 2.4, 0.12, "#4b5d7a", nicheX, y(5.6), zn + 1.5], [0.04, 0.04, 2.8, "#9fd0ff", R - 0.9, y(6.68), zn, 0.9],
        [0.5, 0.6, 0.8, "#6d7f99", nicheX, y(4.76), zn + 0.8]];
      for (let k = 0; k < 5; k++) niche.push([0.7, 0.32, 1.2, "#2d3138", nicheX, y(4.62 + k * 0.36), zn - 0.6], [0.02, 0.03, 0.03, k % 2 ? "#ffb347" : "#7dff8a", R - 0.86, y(4.62 + k * 0.36), zn - 0.95, 0.7]);
      boxes(niche);
      group(38.6, R, 45, 49, [[1, 0.8, 1, "#b08a5a", R - 1, y(0.4), zn - 0.9], [0.9, 0.7, 0.9, "#a57f50", R - 0.95, y(1.15), zn - 0.8], [0.8, 0.6, 0.8, "#b8925f", R - 2, y(0.3), zn + 0.9],
        [1.02, 0.02, 0.12, "#d8c9a0", R - 1, y(0.805), zn - 0.9], [0.82, 0.02, 0.1, "#d8c9a0", R - 2, y(0.605), zn + 0.9]]);
    },
    update(dt, elapsed, state) {
      // The games corner's hub lamps step twice a second; while a panel or terminal is open, or under Calm, they hold
      // steady. The modem's second lamp shows the toy link's state (a state, not an animation).
      if (decor) {
        const still = !!(state && (state.calm || state.reading)), step = still ? -1 : Math.floor((elapsed || 0) * 2);
        if (step !== decor.step) {
          decor.step = step;
          for (let i = 0; i < decor.hub.length; i++) { const n = decor.hub[i]; if (n && typeof n === "object") n.glow = step < 0 ? 1.2 : (step + i * 3) % 5 === 0 ? 2.2 : 0.8; }
        }
        const line = decor.modem[1], up = !!(desktop && desktop.connected);
        if (line && typeof line === "object" && decor.line !== up) { decor.line = up; line.glow = up ? 2.4 : 1; }
      }
      // The packet toy's lamps show which boxes are switched on (a state, not an animation).
      const radio = cluster && cluster.wireless;
      if (radio) {
        let mask = 0;
        for (let i = 0; i < radio.on.length; i++) mask |= radio.on[i] << i;
        if (mask !== cluster.mask) {
          cluster.mask = mask;
          for (let i = 0; i < cluster.leds.length; i++) { const n = cluster.leds[i]; if (n && typeof n === "object") n.glow = radio.on[i] ? 1 : 0.1; }
        }
      }
      if (!work || !work.running) return;
      for (let i = 0; i < PER_FRAME && work.total < TOTAL; i++) {
        const nonce = work.attempts++, h = stampHash(work.boundSeed, nonce);
        work.total++;
        if (h < 2 ** (32 - work.boundBits)) { work.nonce = nonce; work.hash = h; work.running = false; break; }
      }
      if (work.total >= TOTAL) work.running = false;
    },
    dispose() {
      if (synth) {
        silence();
        for (const v of synth.voices) { v.osc.stop(); v.osc.disconnect(); v.gain.disconnect(); }
        synth.context.close().catch(() => {}); synth = null;
      }
      work = desktop = maze = discs = balances = decor = cluster = null;
    }
  });
})();
