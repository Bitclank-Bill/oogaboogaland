// Work and Scarcity, 1996–1999. Dossier: gv/research, era-4-work-and-scarcity.md v0.1.
// Kit contract: genesis-exhibits.js. Original museum models and toys; no network or storage.
(() => {
  "use strict";
  const BL = window.BL;
  const sources = {
    "E4-HC": { label: "28 March 1997: Back's computational-postage implementation announcement",
      href: "https://mailing-list-archive.cryptoanarchy.wiki/archive/1997/03/1fea96e9a08fb74d7f1fdeca362f943dcb2ca70017b092359eb8f931e11004cf/", kind: "context", verified: true },
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
      href: "https://www.itu.int/rec/T-REC-V.90-199809-I/en", kind: "context", verified: true }
  };
  const overview = [
    "1996–1999: computers could pay for stamps with work; proposals asked how people could share balances. [E4-HC, E4-BM]",
    "These ideas left questions about ordering, communication and trust. The naming and timestamp papers did not create money. [E4-BM, E4-NAMES, E4-TIMESEC]",
    "Dates identify announcements, publications or standards approval, never a claim that an idea was invented that day."
  ];
  const history = {
    HASHCASH: ["28 March 1997 · implementation announcement [E4-HC]",
      "Adam Back announced computational postage: finding a stamp costs searches; checking costs much less. A service also needs spent-stamp tracking.",
      "This announcement is separate from the 2002 Hashcash paper cited as [6] by Bitcoin. That paper belongs in Era 5."],
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
      "The museum modem makes original synthesized tones. It never calls anyone or connects to a network."]
  };
  const reply = (...lines) => ({ lines });
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
  let work = null, synth = null, desktop = null, maze = null, discs = null, balances = null;
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
    build(kit) {
      work = { message: "hello museum", seed: seedOf("hello museum"), bits: 8, total: 0, attempts: 0, nonce: -1, hash: 0, running: false, bound: "", boundSeed: 0, boundBits: 8 };
      desktop = { pages: ["HOME"], index: 0, connected: false };
      maze = { x: 1, y: 1, moves: 0, won: false }; discs = { next: 0 };
      balances = { a: new Uint8Array([5, 5]), b: new Uint8Array([3, 3]), created: 0 };
      const { era, top, solid, sign, obstacle, prop } = kit;
      const board = (room, keys, pages) => ({ board: { room, sources: keys, pages } });
      sign("1996-1999", "WORK AND SCARCITY", -13, top + 7, era.z1 - 14, 0, 1.25);
      sign("WORK / ACCOUNTS / TRUST", "1997 announcement - 1998 proposal - 1999 publication", -13, top + 4.5, era.z1 - 14, 0, 0.5);
      // Station footprints stay at least 1.5 m from the channel and leave broad bank routes.
      const station = (id, x, z, year, title, sub, keys, use, style) => {
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
          for (let i = 0; i < 4; i++) solid(0.1, 0.09, 0.04, "#78cb96", x - 0.7 + i * 0.3, top + 1.14, z + 0.47, 0.5);
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
        obstacle(x - 1.9, x + 1.9, z - 0.9, z + 1.3);
        sign(title, sub, x, top + 3, z + 0.2, 0, 0.42);
        prop({ id, year, title, label: `${title} / ${year}`, sourceKeys: keys, at: { x, y: top, z: z + 2 }, reach: 2.2, pick: { w: 3.6, h: 2.5, d: 1.2 }, onUse: use });
      };
      station("e4-overview", -8, era.z1 - 18, 1996, "1996-1999 / WORK AND SCARCITY", "era overview - read here", ["E4-HC", "E4-BM", "E4-NAMES", "E4-TIMESEC"],
        () => board("Work and Scarcity / 1996-1999", ["E4-HC", "E4-BM", "E4-NAMES", "E4-TIMESEC"], [{ caption: "Era overview", title: "Work, accounts and trust", text: overview }]));
      station("e4-hashcash", -9, era.z - 3, 1997, "HASHCASH / 28 MAR 1997", "implementation announcement - educational workbench", ["E4-HC"], () => ({ terminal: hashTerminal() }));
      station("e4-bmoney", -21, era.z - 3, 1998, "B-MONEY / NOV 1998", "proposal publication - compare accounts", ["E4-BM"], () => ({ terminal: balanceTerminal() }));
      station("e4-shelf", -13, era.z0 + 12, 1999, "REFERENCE SHELF / 1997 + 1999", "publication dates - naming and timestamp services", ["E4-NAMES", "E4-NAMES-CAT", "E4-TIMESEC", "E4-TIMESEC-CAT"],
        () => board("Reference shelf / 1997 + 1999", ["E4-NAMES", "E4-NAMES-CAT", "E4-TIMESEC", "E4-TIMESEC-CAT"], [
          { caption: "April 1997 publication", title: "Secure Names for Bit-Strings", text: history.NAMES },
          { caption: "May 1999 publication", title: "TIMESEC / a timestamp service", text: history.TIMESEC }
        ]));
      station("e4-desktop", 17, era.z1 - 19, 1999, "LOCAL WEB DESKTOP / 1999", "original museum design - OPEN HOME", ["E4-HC", "E4-BM", "E4-NAMES", "E4-TIMESEC", "E4-MODEM"], () => ({ terminal: browserTerminal() }), "screen");
      station("e4-modem", 29, era.z1 - 19, 1998, "MODEM / 1 SEP 1998", "V.90 approval - DIAL plays original tones", ["E4-MODEM"], () => ({ terminal: browserTerminal() }), "modem");
      station("e4-cd", 17, era.z - 9, 1999, "CD-ROM ARCHIVE / 1999", "invented museum puzzle - select discs by date", ["E4-HC", "E4-NAMES-CAT", "E4-BM", "E4-TIMESEC-CAT"], () => ({ terminal: discTerminal() }), "discs");
      station("e4-pocket", 29, era.z0 + 14, 1999, "POCKET ROUTE / 1999", "original maze - N S E W - no ROM", ["E4-MODEM"], () => ({ terminal: mazeTerminal() }), "pocket");
    },
    update() {
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
      work = desktop = maze = discs = balances = null;
    }
  });
})();
