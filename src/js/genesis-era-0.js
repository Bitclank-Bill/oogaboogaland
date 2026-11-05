// Era 0's cave in the Genesis Voyage, Machines That Count (1956–1969): the reference example for the era files (see
// genesis-exhibits.js for the kit and the rules). Facts from docs/genesis-voyage/eras/era-0-machines-that-count.md
// (branch gv/research): Feller's probability shelf (whitepaper citation [8], the cited 1957 edition) and ARPANET's
// interrupted first login (context, 29 October 1969). Extra stations are original museum toys, not historical
// software emulations. Commands change fixed scene nodes; there is no frame callback, timer, network or audio. The
// counting cluster (buildCluster) takes its toys' rules from genesis-era-0-nim.js, -crt.js and -pointer.js, and the
// lamp panel (buildPanel) from genesis-era-0-lamps.js. Each exhibit's finer parts (frames, keys, lamps, trims) are one
// merged mesh placed at its own spot (`detail`), built only by the scene's kit: the layout's dry run has no models.
// The older drive plinth still stands in Era 3; its removal is an integrator task, outside this file's ownership.
(() => {
  "use strict";
  const sources = {
    e0Feller: { label: "Satoshi Nakamoto Institute library: Feller, An Introduction to Probability Theory and Its Applications, Vol. I",
      href: "https://nakamotoinstitute.org/library/introduction-probability-theory-vol-i/", kind: "whitepaper citation [8]", verified: true },
    e0Arpanet: { label: "Leonard Kleinrock (UCLA): the first words sent over the ARPANET, 29 October 1969",
      href: "https://www.lk.cs.ucla.edu/internet_first_words.html", kind: "context", verified: true },
    e0Storage: { label: "Computer History Museum: first commercial hard disk drive shipped, 1956",
      href: "https://www.computerhistory.org/storageengine/first-commercial-hard-disk-drive-shipped/", kind: "context", verified: true },
    e0Cards: { label: "IBM: RAMAC and the punched-card storage it replaced",
      href: "https://www.ibm.com/history/ramac", kind: "context", verified: true },
    e0Card2019: { label: "Micron: c200 1 TB microSD announcement, 25 February 2019",
      href: "https://investors.micron.com/news/press-release/2019/Micron-Unveils-Worlds-First-1TB-microSD-Card-to-Meet-Consumer-Demand-for-Mobile-Storage-02-25-2019/default.aspx", kind: "context", verified: true },
    // The counting cluster's three toys are the museum's own work; their provenance and HOLD list is the exhibit doc.
    e0Toys: { label: "Ooga Booga Land: Era 0 exhibit notes (modern toys, rules and the claims on hold)",
      href: "https://github.com/Bitcoin-Bill/oogaboogaland/blob/gv/upgrade-era-0/docs/genesis-voyage/exhibits/era-0.md", kind: "context", verified: true }
  };
  // Parsing and response arrays allocate only on deliberate use, never in the scene's frame loop. A bad command
  // returns help without changing state; commands accept bounded decimal integers, not arbitrary expressions.
  const reply = (...lines) => ({ lines });
  const integer = (word, lo, hi) => /^\d+$/.test(word || "") && Number(word) >= lo && Number(word) <= hi ? Number(word) : -1;
  // An exhibit's finer parts as one merged mesh at (x, y, z), its parts in its own frame (y from the floor). The kit's
  // dry runs (the layout's and the checks') have no models, so they get a bare node at the same spot: every run counts
  // the same pieces, and the mesh moves with its exhibit's cluster.
  const detail = (kit, x, y, z, make) => {
    const nd = kit.createNode(kit.M.merge ? { geometry: kit.M.merge(...make(kit.M)) } : {});
    nd.position.x = x; nd.position.y = y; nd.position.z = z;
    return kit.place(nd);
  };
  const B = (M, w, h, d, color, x, y, z, emissive = 0) => M.box({ w, h, d, color, emissive, offset: { x, y, z } });
  const terminal = (banner, help, command) => ({
    banner: [banner, "Original museum toy. Type HELP; RESET starts again.", ...help], prompt: "EXHIBIT>",
    run(line) {
      const text = String(line).trim().slice(0, 96), words = text.toUpperCase().split(/\s+/), cmd = words[0];
      if (cmd === "HELP" || !cmd) return { lines: help };
      return command(cmd, words, text);
    }
  });
  const buildToys = (kit) => {
    const { era, top, solid, sign, obstacle, prop } = kit;
    // Stations have separate clear approach pads; all footprints stay well away from the stream and its ramps.
    // Each station is context (the dossier's classes): a period machine or a toy, not a whitepaper citation. Its tap
    // box covers the model; its walk-up point is just in front of it.
    const station = (id, year, date, title, keys, x, z, width, depth, term) => {
      obstacle(x - width / 2, x + width / 2, z - depth / 2, z + depth / 2);
      prop({ id, year, date, connection: "context", title, label: `${title.toUpperCase()} · ${year}`, sourceKeys: keys,
        at: { x, y: top, z: z + depth / 2 + 0.8 }, reach: 1.8,
        pick: { w: width, h: 1.8, d: depth + 0.4, x, z }, onUse: () => ({ terminal: term }) });
    };
    // The era's big sign, pylons, overview board and the Steps toward Bitcoin are the shared signage's
    // (docs/genesis-voyage/EXHIBIT-CONTRACT.md); this era's guide is in its overview's pages, below.
    // Human-scale schematic storage cabinet: 50 square platter silhouettes, not an engineering reconstruction.
    const dx = -23, dz = era.z - 3;
    solid(3.5, 0.25, 2.8, "#494d4e", dx, top + 0.125, dz);
    for (const side of [-1, 1]) solid(0.15, 3.4, 2.8, "#c3c4b8", dx + side * 1.7, top + 1.8, dz);
    for (let i = 0; i < 50; i++) solid(2.25, 0.025, 2.1, i % 2 ? "#707a7f" : "#9aa2a5", dx - 0.25, top + 0.45 + i * 0.05, dz);
    const arm = solid(1.2, 0.07, 0.12, "#ffd276", dx + 0.75, top + 0.45, dz + 0.5, 0.3);
    // The cabinet's cap and back, the spindle through the stack, the arm's guide rail, a control strip of lamps on the
    // right panel, the motor housing behind the stack and a maker's plate (an invented one, no real maker's).
    detail(kit, dx, top, dz, (M) => [B(M, 3.7, 0.18, 3, "#d9d6c8", 0, 3.55, 0), B(M, 3.3, 3.3, 0.08, "#8f938e", 0, 1.85, -1.36),
      B(M, 0.16, 2.7, 0.16, "#c8ccd0", -0.25, 1.6, 0), B(M, 0.1, 2.6, 0.1, "#55595c", 1.38, 1.65, 0.5), B(M, 2.6, 0.3, 0.5, "#3b3f42", -0.25, 0.4, -1.05),
      B(M, 0.04, 1.1, 1.3, "#2a2f33", 1.79, 2.3, -0.4), ...[0, 1, 2, 3, 4, 5].map((k) => B(M, 0.03, 0.09, 0.09, k % 3 ? "#7dff9e" : "#ffb347", 1.82, 2.65 - Math.floor(k / 2) * 0.28, -0.7 + (k % 2) * 0.5, 1.2)),
      B(M, 1.3, 0.12, 0.02, "#b08a3a", 0, 3.5, 1.51, 0.3)]);
    sign("DISK STORAGE · 1956", "Five million characters / schematic", dx, top + 4.1, dz + 1.5, 0, 0.6);
    let record = 0;
    const seek = terminal("1956 disk-storage illustration: select a numbered museum record.", ["SEEK 0..49 | INFO | RESET"], (cmd, w) => {
      if (cmd === "INFO") return reply("June 1956: CHM dates the first commercial shipment of the Model 350 with the RAMAC system.", "Fifty 24-inch disks stored five million data characters. CHM counts six data bits per character; IBM's account includes a different encoded-bit description.", "This schematic maps 50 toy records to 50 disks. Real records and tracks were not organised this way. No exact modern-capacity ratio is claimed.");
      const n = cmd === "RESET" ? 0 : cmd === "SEEK" && w.length === 2 ? integer(w[1], 0, 49) : -1;
      if (n < 0) return reply("Use SEEK with one whole number from 0 to 49, INFO or RESET.");
      record = n; arm.position.y = top + 0.45 + record * 0.05;
      return reply(`Arm selected toy record ${record}; see its height change in the cabinet after closing this window.`, "Selected access avoids reading every earlier toy record. Motion is schematic, not real access timing.");
    });
    station("e0-disk-seek", 1956, "June 1956: the first commercial shipment, as the Computer History Museum dates it", "Disk record finder", ["e0Storage"], dx, dz, 3.7, 3, seek);
    // Invented eight-column, seven-bit code: explicitly NOT Hollerith, BCD, or a historical card format.
    const cx = -23, cz = era.z0 + 13, holes = [];
    solid(3.8, 0.9, 2.1, "#705239", cx, top + 0.45, cz);
    solid(3.3, 0.05, 1.6, "#e4d4a1", cx, top + 0.94, cz);
    for (let i = 0; i < 8; i++) for (let b = 0; b < 7; b++) {
      const h = solid(0.2, 0.02, 0.12, "#20292c", cx - 1.35 + i * 0.38, top + 0.98, cz - 0.6 + b * 0.2);
      h.visible = false; holes.push(h);
    }
    const codes = new Uint8Array(8); let count = 0;
    const showCard = () => { for (let i = 0; i < 56; i++) holes[i].visible = (codes[Math.floor(i / 7)] & (1 << (6 - i % 7))) !== 0; };
    sign("PUNCHED RECORDS · 1956-1969", "Invented code / not a historical card format", cx, top + 2.7, cz + 1.3, 0, 0.55);
    // The punch's back unit with a row of keys, a hopper of blank cards on the left and a stacker on the right, the
    // bed's red column rule, and two drawers in the desk's front.
    detail(kit, cx, top, cz, (M) => [B(M, 3.6, 0.5, 0.25, "#5a4430", 0, 1.15, -0.92), ...[-1, 1].map((sd) => B(M, 0.6, 0.35, 0.25, "#2e3236", sd * 1.4, 1.57, -0.92)),
      ...[-1, 1].map((sd) => B(M, 0.5, 0.18, 0.2, "#efe3bd", sd * 1.4, 1.83, -0.92)), ...Array.from({ length: 10 }, (_, k) => B(M, 0.15, 0.05, 0.12, "#e9e2cc", -0.9 + k * 0.2, 1.42, -0.86)),
      B(M, 3.1, 0.012, 0.03, "#b03a2e", 0, 0.975, 0.75), ...[-1, 1].map((sd) => B(M, 1.3, 0.32, 0.02, "#6a4c33", sd * 1.0, 0.5, 1.06)), ...[-1, 1].map((sd) => B(M, 0.3, 0.05, 0.04, "#c9a35a", sd * 1.0, 0.55, 1.08, 0.2))]);
    const punch = terminal("Punched-card idea: holes can carry a message. This code was invented today.", ["PUNCH up to 8 letters or digits | FLIP column(1..8) bit(1..7) | READ | INFO | RESET"], (cmd, w, text) => {
      if (cmd === "INFO") return reply("IBM describes punched cards as an earlier way of feeding and retrieving data before RAMAC.", "Our eight-column, seven-bit exercise is a modern teaching code, not an authentic period card, character set or machine.");
      if (cmd === "RESET") { codes.fill(0); count = 0; showCard(); return reply("Card cleared."); }
      if (cmd === "PUNCH") {
        const msg = text.replace(/^\S+\s*/, "").toUpperCase();
        if (!/^[A-Z0-9 ]{1,8}$/.test(msg)) return reply("Use PUNCH followed by 1 to 8 letters, digits or spaces.");
        codes.fill(0); count = msg.length;
        for (let i = 0; i < count; i++) codes[i] = msg.charCodeAt(i);
      } else if (cmd === "FLIP") {
        const col = integer(w[1], 1, count), bit = integer(w[2], 1, 7);
        if (w.length !== 3 || col < 0 || bit < 0) return reply("Punch a message first, then FLIP an existing column and bit (1..7).");
        codes[col - 1] ^= 1 << (7 - bit);
      } else if (cmd !== "READ") return reply("Use PUNCH, FLIP, READ, INFO or RESET.");
      showCard();
      let decoded = "";
      for (let i = 0; i < count; i++) decoded += codes[i] >= 32 && codes[i] <= 126 ? String.fromCharCode(codes[i]) : "[control]";
      return reply(`Read: ${decoded || "(empty)"}`, "Changing one hole can change the decoded message; this toy has no error correction.");
    });
    station("e0-punch", 1956, "1956-1969: the period illustrated; the code is invented today", "Punch a museum message", ["e0Cards"], cx, cz, 4, 2.3, punch);
    // Seeded, finite race. It illustrates changing odds, not the whitepaper's attack-success calculation.
    const rx = 18, rz = era.z1 - 20;
    solid(8, 0.8, 2.7, "#66502e", rx, top + 0.4, rz);
    const racers = [solid(0.35, 0.3, 0.35, "#f2c14e", rx - 3.3, top + 0.95, rz - 0.6), solid(0.35, 0.3, 0.35, "#68c6ed", rx - 3.3, top + 0.95, rz + 0.6)];
    // Two felt lanes with white lines, a start line and a chequered finish with a flag for each racer, and a board of
    // lamps behind; each racer carries a little rider in its colour.
    detail(kit, rx, top, rz, (M) => [...[-0.6, 0.6].map((z) => B(M, 7.2, 0.02, 0.6, "#2f5a3c", 0, 0.81, z)), ...[-0.92, 0, 0.92].map((z) => B(M, 7.2, 0.012, 0.04, "#e8e4d4", 0, 0.826, z)),
      B(M, 0.06, 0.014, 1.9, "#e8e4d4", -3.55, 0.83, 0), ...Array.from({ length: 16 }, (_, k) => B(M, 0.12, 0.014, 0.24, (k + Math.floor(k / 8)) % 2 ? "#151515" : "#f0ece0", 3.5 + Math.floor(k / 8) * 0.12, 0.83, -0.84 + (k % 8) * 0.24)),
      ...[-1, 1].map((sd) => B(M, 0.05, 0.8, 0.05, "#3a3a3a", 3.56, 1.2, sd * 1.2)), B(M, 0.3, 0.2, 0.02, "#e6b84a", 3.73, 1.5, -1.2), B(M, 0.3, 0.2, 0.02, "#5aaee0", 3.73, 1.5, 1.2),
      B(M, 2.4, 0.9, 0.08, "#20242a", 0, 1.55, -1.28), ...Array.from({ length: 12 }, (_, k) => B(M, 0.1, 0.1, 0.02, k % 2 ? "#ffcf5a" : "#7ad0ff", -0.9 + (k % 6) * 0.36, 1.75 - Math.floor(k / 6) * 0.35, -1.23, 1.1))]);
    if (kit.M.merge) racers.forEach((r, k) => {
      const ink = k ? "#4aa8d8" : "#e8b23a", M = kit.M;
      kit.addChild(r, kit.createNode({ geometry: M.merge(B(M, 0.2, 0.18, 0.14, ink, 0, 0.24, 0), B(M, 0.15, 0.15, 0.15, "#e0b48a", 0, 0.41, 0), B(M, 0.18, 0.05, 0.2, ink, 0, 0.5, 0.02)) }));
    });
    let odds = 50, gold = 0, blue = 0, steps = 0, seed = 1957;
    const resetRace = () => { gold = blue = steps = 0; seed = 1957; racers[0].position.x = racers[1].position.x = rx - 3.3; };
    sign("PROBABILITY RACE · 1957", "Cited edition [8] / toy, not Bitcoin security", rx, top + 2.8, rz + 1.6, 0, 0.6);
    const race = terminal("1957 is the Feller edition cited by Bitcoin, not probability's invention date.", ["ODDS 0..100 | STEP 1..64 | STATUS | INFO | RESET"], (cmd, w) => {
      if (cmd === "INFO") return reply("Bitcoin's section 11 cites Feller's 1957 edition for its random-walk discussion.", "This invented two-racer game gives gold a chosen percentage chance of taking each step; otherwise blue advances. It is not the paper's security calculation or a forecast.", "RESET repeats the same seeded sequence. That repeatability is for teaching, not secure randomness.");
      if (cmd === "RESET") { odds = 50; resetRace(); }
      else if (cmd === "ODDS") {
        const n = w.length === 2 ? integer(w[1], 0, 100) : -1;
        if (n < 0) return reply("ODDS needs one whole percentage from 0 to 100.");
        odds = n; resetRace();
      } else if (cmd === "STEP") {
        const n = w.length === 2 ? integer(w[1], 1, 64) : -1;
        if (n < 0) return reply("STEP needs one whole number from 1 to 64.");
        for (let i = 0; i < n && steps < 64; i++) {
          seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
          if (seed / 4294967296 < odds / 100) gold++; else blue++;
          steps++;
        }
        racers[0].position.x = rx - 3.3 + gold / 64 * 6.6; racers[1].position.x = rx - 3.3 + blue / 64 * 6.6;
      } else if (cmd !== "STATUS") return reply("Use ODDS, STEP, STATUS, INFO or RESET.");
      return reply(`Gold chance ${odds}%; gold ${gold}, blue ${blue}; ${steps}/64 steps.`, steps === 64 ? "Race complete. Change ODDS or RESET to try again." : "STEP advances the race. Close this window to inspect the counters.");
    });
    station("e0-race", 1957, "1957: the Feller edition the whitepaper cites; the race itself is a toy", "Probability race", ["e0Feller", "whitepaper"], rx, rz, 8.2, 2.9, race);
    // Adjacent to the existing ARPANET display: an explicit reconstruction, not an invented historical transcript.
    // Clear of the right bank's lamp post at x 22 by the middle of the cave.
    const nx = 18.5, nz = era.z - 1;
    solid(2.5, 1, 1.1, "#b7b3a0", nx, top + 0.5, nz);
    const lamp = solid(0.3, 0.3, 0.1, "#8effab", nx, top + 1.25, nz + 0.4, 0.5);
    // A teleprinter on the console: its hood, a keyboard in front, the paper roll and a sheet rising from it.
    detail(kit, nx, top, nz, (M) => [M.bevelBox({ w: 1.4, h: 0.35, d: 0.7, color: "#c9c4ae", bevel: 0.06, offset: { x: -0.45, y: 1.18, z: -0.12 } }),
      B(M, 1.2, 0.08, 0.32, "#3c3a34", -0.45, 1.04, 0.36), ...Array.from({ length: 8 }, (_, k) => B(M, 0.11, 0.04, 0.1, "#e9e2cc", -0.88 + k * 0.125, 1.1, 0.36)),
      B(M, 0.9, 0.16, 0.16, "#f2eee0", -0.45, 1.42, -0.36), B(M, 0.8, 0.5, 0.01, "#f6f2e6", -0.45, 1.75, -0.4), ...[0, 1, 2].map((k) => B(M, 0.5 - k * 0.12, 0.02, 0.012, "#3a3a3a", -0.55, 1.88 - k * 0.1, -0.39))]);
    let attempt = 0;
    sign("RETRY THE LOGIN · 1969", "Museum reconstruction / context", nx, top + 2.5, nz + 0.7, 0, 0.5);
    const network = terminal("29 October 1969: UCLA to SRI. Our prompts are a reconstruction, not a transcript.", ["LOGIN | RETRY | STATUS | INFO | RESET"], (cmd) => {
      if (cmd === "INFO") return reply("The UCLA log and Kleinrock's account date the host-message attempt to 29 October 1969. L and O arrived before failure; a later full login succeeded.", "Sending data is context, not a whitepaper reference. It does not establish ownership or stop digital double-spending.");
      if (cmd === "RESET") { attempt = 0; lamp.visible = true; return reply("Ready. Type LOGIN."); }
      if (cmd === "LOGIN" && !attempt) { attempt = 1; lamp.visible = false; return reply("Toy received: LO. Connection stopped.", "Try RETRY. Historical elapsed time is not simulated."); }
      if (cmd === "RETRY" && attempt === 1) { attempt = 2; lamp.visible = true; return reply("Toy received: LOGIN. Link restored.", "The historical retry succeeded later; this instant replay compresses the wait."); }
      if (cmd === "STATUS") return reply(attempt === 0 ? "Ready for LOGIN." : attempt === 1 ? "Interrupted after LO. RETRY is available." : "Full LOGIN delivered. RESET to replay.");
      return reply(attempt === 0 ? "Start with LOGIN." : attempt === 1 ? "Use RETRY after the interruption." : "Complete. RESET to replay.");
    });
    station("e0-login", 1969, "29 October 1969: the host-message attempt reconstructed here", "Retry the login", ["e0Arpanet"], nx, nz, 2.7, 1.3, network);
    const mx = 20, mz = era.z0 + 13;
    solid(2.4, 1, 1.4, "#697b87", mx, top + 0.5, mz);
    solid(0.3, 0.04, 0.4, "#252c32", mx, top + 1.04, mz);
    // A brass-framed case over the plinth, a disk platter beside the little card for scale, and their two plates.
    detail(kit, mx, top, mz, (M) => [...[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b]) => B(M, 0.04, 0.55, 0.04, "#c9a35a", a * 1.1, 1.27, b * 0.62, 0.15)),
      B(M, 2.24, 0.04, 0.04, "#c9a35a", 0, 1.54, -0.62, 0.15), B(M, 2.24, 0.04, 0.04, "#c9a35a", 0, 1.54, 0.62, 0.15), B(M, 0.04, 0.04, 1.28, "#c9a35a", -1.1, 1.54, 0), B(M, 0.04, 0.04, 1.28, "#c9a35a", 1.1, 1.54, 0),
      M.moved(M.lathe({ profile: [[0, 0], [0.42, 0], [0.42, 0.02], [0, 0.02]], segments: 24, color: "#b9c0c4" }), -0.65, 1.0, 0), M.moved(M.lathe({ profile: [[0, 0], [0.08, 0], [0.08, 0.05], [0, 0.05]], segments: 12, color: "#4a4f54" }), -0.65, 1.0, 0),
      B(M, 0.5, 0.08, 0.02, "#efe3bd", -0.65, 0.92, 0.71), B(M, 0.5, 0.08, 0.02, "#efe3bd", 0.3, 0.92, 0.71)]);
    sign("2019 COMPARISON", "Outside this era / schematic card", mx, top + 2.8, mz + 0.9, 0, 0.65);
    obstacle(mx - 1.3, mx + 1.3, mz - 0.8, mz + 0.8);
    prop({ id: "e0-compare", year: 2019, connection: "context", date: "25 February 2019: an announcement, outside this era", title: "2019 comparison - outside this era", label: "OUTSIDE THIS ERA · 2019", sourceKeys: ["e0Storage", "e0Card2019"],
      at: { x: mx, y: top, z: mz + 1.6 }, reach: 1.8, pick: { w: 2.4, h: 1.6, d: 1.6, x: mx, z: mz },
      onUse: () => ({ board: { room: "1956 storage / 2019 comparison", sources: ["e0Storage", "e0Card2019"], pages: [
        { caption: "1956", title: "Five million characters", text: ["The disk cabinet stored five million data characters. Characters and bytes are not interchangeable without specifying an encoding.", "The model is schematic. Its dimensions, square platters, toy records and movement are not engineering measurements."] },
        { caption: "Outside this era", title: "25 February 2019: announcement", text: ["Micron announced its c200 one-terabyte microSD card in 2019. That is a modern comparison, not an object from 1956-1969.", "The original blank card model is enlarged for visibility. No exact capacity ratio or physical scale comparison is claimed."] }
      ] } }) });
  };
  // The counting cluster (docs/genesis-voyage/exhibits/era-0.md): Nim, a scan-line CRT and a pointer station in one
  // row on the left bank, between the disk cabinet and the punched-card desk. All three are modern explanatory toys:
  // their histories are on HOLD, so no date is shown; `year` 1956 and the label name the gallery's span only. Their
  // rules live in genesis-era-0-nim.js, -crt.js and -pointer.js (BL.genesisEra0Games), one core per toy shared by
  // today's terminal and a console game; until those scripts load, each station says so instead of opening.
  // Records: 65 (Nim 18, CRT 30, pointer 16, cluster sign 1). No colour here is one the shared proof looks up.
  const buildCluster = (kit) => {
    const { era, top, solid, sign, obstacle, prop } = kit, games = window.BL.genesisEra0Games || {}, cz = era.z1 - 48;
    const DATE = "No historical date: a modern explanatory toy shown in the 1956-1969 gallery";
    const waiting = { caption: "This station's program has not loaded yet. Its script tag is an integration request in the Era 0 notes." };
    const toy = (id, title, label, hint, x, w, d, h, open) => {
      obstacle(x - w / 2, x + w / 2, cz - d / 2, cz + d / 2);
      prop({ id, year: 1956, date: DATE, connection: "context", title, label, hint, sourceKeys: ["e0Toys"],
        at: { x, y: top, z: cz + d / 2 + 0.8 }, reach: 1.8, pick: { w, h, d: d + 0.4, x, z: cz }, onUse: () => open ? { terminal: open } : waiting });
    };
    sign("COUNTING CLUSTER", "Modern museum toys / no historical dates claimed", -15.5, top + 4.4, cz + 1.4, 0, 0.6);
    // Nim: a low table, three heaps of bone counters (3, 5, 7) running across it, one heap a row.
    const nx = -22, counters = [];
    solid(3, 0.8, 1.7, "#5b4632", nx, top + 0.4, cz);
    solid(2.8, 0.04, 1.5, "#2f5a3c", nx, top + 0.82, cz);
    const heaps = games.nim ? games.nim.START : [3, 5, 7];
    heaps.forEach((n, h) => { const row = []; for (let k = 0; k < n; k++) row.push(solid(0.22, 0.09, 0.22, "#e8dcc0", nx - 1.05 + k * 0.33, top + 0.885, cz - 0.5 + h * 0.5)); counters.push(row); });
    sign("NIM · MODERN TOY", "Generic rules / museum homage, not historical software", nx, top + 2.4, cz + 1.1, 0, 0.5);
    let nimTerm = null;
    if (games.nim) {
      const game = games.nim.create();
      const show = (g) => { for (let h = 0; h < counters.length; h++) for (let k = 0; k < counters[h].length; k++) counters[h][k].visible = k < g.heaps[h]; };
      nimTerm = games.nim.terminal(game, show);
    }
    toy("e0-nim", "Nim board - modern toy", "NIM · MODERN TOY · 1956-1969 GALLERY", "Type TAKE C 2, then HINT", nx, 3.1, 1.8, 1.2, nimTerm);
    // CRT: a cabinet whose face holds twelve scan lines; each line is a dim strip with the picture's runs on it.
    const tx = -15.5, face = cz + 0.53, px = 0.1, rowH = 0.1, y0 = top + 2.15, x0 = tx - 0.8;
    solid(2.2, 0.9, 1.1, "#3f413e", tx, top + 0.45, cz);
    solid(2, 1.7, 1, "#5a5c58", tx, top + 1.75, cz);
    solid(1.8, 1.4, 0.02, "#050806", tx, top + 1.6, face - 0.005);
    const crtLines = [], crtRuns = [];
    const crtRows = games.crt ? games.crt.LINES : 12;
    detail(kit, tx, top, cz, (M) => [...[-1, 0, 1].map((k) => B(M, 0.16, 0.16, 0.08, "#c9c2ae", k * 0.45, 0.6, 0.57)), B(M, 1.9, 0.05, 0.03, "#8a8c86", 0, 2.32, 0.535), B(M, 1.9, 0.05, 0.03, "#8a8c86", 0, 0.88, 0.535),
      B(M, 0.05, 1.45, 0.03, "#8a8c86", -0.93, 1.6, 0.535), B(M, 0.05, 1.45, 0.03, "#8a8c86", 0.93, 1.6, 0.535)]);
    for (let r = 0; r < crtRows; r++) crtLines.push(solid(1.6, rowH * 0.7, 0.02, "#0f1a12", tx, y0 - r * rowH, face + 0.01, 1));
    if (games.crt) for (const s of games.crt.segments()) crtRuns.push({ s, node: solid(s.len * px, rowH * 0.7, 0.02, s.tone === 2 ? "#b8ffcc" : "#5fc47a", x0 + (s.x0 + s.len / 2) * px, y0 - s.row * rowH, face + 0.025, 1) });
    sign("SCAN LINES · MODERN TOY", "Brightness and contrast / no period display claimed", tx, top + 3.4, cz + 1.1, 0, 0.5);
    let crtTerm = null;
    if (games.crt) {
      const crt = games.crt.create();
      // A line's strip shows the background tone; each run its own. A tone at zero is switched off, not just dark.
      const show = (c) => {
        for (let r = 0; r < crtLines.length; r++) { crtLines[r].glow = c.glow[0] * 2.5; crtLines[r].visible = c.shown(r) && c.glow[0] > 0; }
        for (const run of crtRuns) { run.node.glow = c.glow[run.s.tone] * 2.5; run.node.visible = c.shown(run.s.row) && c.glow[run.s.tone] > 0; }
      };
      show(crt);
      crtTerm = games.crt.terminal(crt, show);
    }
    toy("e0-crt", "Scan-line CRT - modern toy", "SCAN LINES · MODERN TOY · 1956-1969 GALLERY", "Type BRIGHT 4, then CONTRAST 0", tx, 2.2, 1.1, 2.6, crtTerm);
    // Pointer: a desk with a generic pointing box and a keyboard slab, and an upright board of nine targets with a
    // cursor marker in front of them.
    const qx = -9, board = cz - 0.35, cell = 0.36, gy = top + 2.15, targets = [];
    solid(2.6, 0.9, 1.3, "#6b5a44", qx, top + 0.45, cz);
    solid(1.3, 0.05, 0.4, "#2b2b2b", qx - 0.4, top + 0.93, cz + 0.25);
    solid(0.22, 0.09, 0.3, "#c9c2ae", qx + 0.75, top + 0.95, cz + 0.25);
    solid(0.04, 0.02, 0.5, "#1e1e1e", qx + 0.75, top + 0.91, cz - 0.15);
    solid(1.3, 1.3, 0.08, "#1d2228", qx, top + 1.85, board);
    for (let i = 0; i < 9; i++) targets.push(solid(0.28, 0.28, 0.03, "#e0b84a", qx + (i % 3 - 1) * cell, gy - Math.floor(i / 3) * cell, board + 0.05, 1));
    const cursor = solid(0.1, 0.1, 0.03, "#f4f4f4", qx, gy - cell, board + 0.08, 1.2);
    sign("POINT OR TYPE · MODERN TOY", "Pointer versus typed command / generic device", qx, top + 3.2, cz + 1.1, 0, 0.5);
    let pointTerm = null;
    if (games.pointer) {
      const pb = games.pointer.create();
      const show = (b) => {
        const lit = b.target();
        for (let i = 0; i < targets.length; i++) targets[i].glow = i === lit ? 1.6 : 0.12;
        cursor.position.x = qx + (b.state.cx - 1) * cell; cursor.position.y = gy - b.state.cy * cell;
      };
      show(pb);
      pointTerm = games.pointer.terminal(pb, show);
    }
    toy("e0-pointer", "Point or type - modern toy", "POINT OR TYPE · MODERN TOY · 1956-1969 GALLERY", "Type MOVE 1 0, then CLICK", qx, 2.7, 1.4, 2.6, pointTerm);
  };
  // The lamp panel (genesis-era-0-lamps.js): a cabinet whose face holds eight lamps over eight toggle switches, the
  // lamps one number in binary (a lamp shows only while lit, over a dark socket in the panel's mesh). A modern museum toy with no historical date, like the counting cluster across the
  // walk; its console game is Lamp Lock (genesis-era-cartridges.js). Records: 21 (cabinet 3, lamps 8, switches 8,
  // the switches' strip 1, sign 1), none in a colour the shared proof looks up.
  const buildPanel = (kit) => {
    const { era, top, solid, sign, obstacle, prop } = kit, games = window.BL.genesisEra0Games || {}, px = 13, pz = era.z1 - 48, face = pz + 0.41;
    solid(3, 1.9, 0.8, "#4a5a68", px, top + 0.95, pz);
    solid(2.7, 0.9, 0.02, "#22292f", px, top + 1.4, face);
    solid(3.2, 0.12, 1.2, "#5b4632", px, top + 0.9, pz + 0.4);
    const lamps = [], levers = [];
    for (let b = 0; b < 8; b++) lamps.push(solid(0.18, 0.18, 0.06, "#ffcf5a", px - 1.12 + b * 0.32, top + 1.62, face + 0.03, 1.4));
    solid(2.7, 0.3, 0.03, "#111518", px, top + 1.2, face + 0.02);
    for (let b = 0; b < 8; b++) levers.push(solid(0.08, 0.14, 0.12, "#d8d8d0", px - 1.12 + b * 0.32, top + 1.14, face + 0.08));
    sign("LAMP PANEL · MODERN TOY", "Eight switches hold one number / no real machine claimed", px, top + 2.9, pz + 0.5, 0, 0.5);
    detail(kit, px, top, pz, (M) => [B(M, 3.1, 0.1, 0.9, "#3a4752", 0, 1.95, 0), ...[-1, 1].map((sd) => B(M, 0.08, 1.9, 0.86, "#3a4752", sd * 1.52, 0.95, 0)),
      ...Array.from({ length: 8 }, (_, k) => B(M, 0.22, 0.03, 0.02, "#c9c2ae", -1.12 + k * 0.32, 1.84, 0.43)), ...Array.from({ length: 8 }, (_, k) => B(M, 0.2, 0.2, 0.03, "#2a2318", -1.12 + k * 0.32, 1.62, 0.43)), B(M, 0.5, 0.08, 0.02, "#c9a35a", 1.0, 0.6, 0.41, 0.2)]);
    obstacle(px - 1.6, px + 1.6, pz - 0.45, pz + 1.0);
    let panelTerm = null;
    if (games.lamps) {
      const panel = games.lamps.create();
      const show = (p) => { for (let b = 0; b < 8; b++) { const on = p.lit(b); lamps[b].visible = on; levers[b].position.y = top + (on ? 1.22 : 1.06); } };
      show(panel);
      panelTerm = games.lamps.terminal(panel, show);
    }
    prop({ id: "e0-lamps", year: 1956, date: "No historical date: a modern explanatory toy shown in the 1956-1969 gallery", connection: "context", title: "Lamp panel - modern toy",
      label: "LAMP PANEL · MODERN TOY · 1956-1969 GALLERY", hint: "Type SET 42, then SHIFT LEFT", sourceKeys: ["e0Toys"],
      at: { x: px, y: top, z: pz + 1.8 }, reach: 1.8, pick: { w: 3.2, h: 2.2, d: 1.4, x: px, z: pz },
      onUse: () => panelTerm ? { terminal: panelTerm } : { caption: "This station's program has not loaded yet." } });
  };
  window.BL.genesisExhibits.register(0, {
    sources,
    overview: { summary: "Storing information once filled cabinets bigger than you. People learned to keep records on spinning disks, connect distant computers and reason about uncertain races with probability. Background, not Bitcoin prototypes.",
      sourceKeys: ["e0Storage", "e0Feller", "e0Arpanet", "whitepaper"], pages: [
        { caption: "Explore", title: "Store, count and connect", text: ["1956: a disk-storage system reaches selected records. 1957: the edition of Feller cited later by Bitcoin. 1969: an ARPANET host-message attempt.", "The gold path and its STEP post mark the whitepaper connection. The other machines explain the period; they were not Bitcoin prototypes."] },
        { caption: "Play", title: "Nine things to try", text: ["Seek a record, punch a short message, change the odds of a race, retry a network login, and inspect a clearly labelled 2019 comparison.", "In the counting cluster, play Nim against a bounded computer, turn a scan-line screen's brightness and contrast, and choose targets by pointing or by typing. Across the walk, the lamp panel holds a number in eight switches.", "The controls and codes are invented for this museum. Dates identify historical events or the period illustrated, not the invention of these games; the cluster's three toys carry no historical date."] }
      ] },
    build(kit) {
      const { era, top, solid, sign, obstacle, prop } = kit;
      // Feller's shelf on the left bank: a tall bookcase of probability, the cited volume lit.
      const fx = -9, fz = era.z1 - 22;
      solid(3.2, 2.6, 0.7, "#5c3d24", fx, top + 1.3, fz);
      const inks = ["#7a2f2a", "#2f4f7a", "#3d6b3a", "#7a6a2f", "#5a2f6b"];
      for (let row = 0; row < 3; row++) for (let i = 0; i < 9; i++) {
        const cited = row === 1 && i === 4;
        solid(0.26, 0.6, 0.5, cited ? "#f2c14e" : inks[(i + row) % inks.length], fx - 1.3 + i * 0.32, top + 0.55 + row * 0.8, fz + 0.1, cited ? 0.6 : 0);
      }
      obstacle(fx - 1.7, fx + 1.7, fz - 0.5, fz + 0.5);
      // A crown and a plinth on the bookcase, the shelf boards' front edges, and a reading lamp on top.
      detail(kit, fx, top, fz, (M) => [B(M, 3.4, 0.12, 0.85, "#4a301c", 0, 2.66, 0), B(M, 3.4, 0.14, 0.85, "#4a301c", 0, 0.07, 0), ...[0.22, 1.02, 1.82].map((y) => B(M, 3.1, 0.06, 0.05, "#7a5434", 0, y, 0.36)),
        B(M, 0.05, 0.4, 0.05, "#c9a35a", 1.2, 2.92, 0), B(M, 0.3, 0.16, 0.3, "#ffe6a8", 1.2, 3.18, 0, 0.9)]);
      sign("FELLER'S PROBABILITY · 1957", "the edition Bitcoin's paper cites [8]", fx, top + 3.3, fz + 0.4, 0, 0.5);
      prop({ id: "e0-feller", year: 1957, connection: "citation", ref: "[8]", date: "1957 is the edition year Bitcoin's bibliography gives", title: "Feller's probability shelf", label: "FELLER · 1957", sourceKeys: ["e0Feller", "whitepaper"],
        at: { x: fx, y: top, z: fz + 1.2 }, reach: 1.8, pick: { w: 3.2, h: 2.6, d: 1, x: fx, z: fz },
        onUse: () => ({ board: { room: "Feller probability shelf - 1957", sources: ["e0Feller", "whitepaper"], pages: [
          { caption: "In short", title: "Odds you can reason about", text: [
            "Probability gave people ways to reason about races with uncertain outcomes.",
            "1957 is the edition year of William Feller's book that the Bitcoin whitepaper lists as reference [8]. It is not the year probability was invented."] },
          { caption: "The connection", title: "The gambler's ruin", text: [
            "Section 11 of the whitepaper compares an attacker trying to catch up with the honest chain to a random walk, the Gambler's Ruin problem, and cites Feller.",
            "This is mathematics, not a payment system: it says nothing yet about how to stop a digital coin being spent twice."] }
        ] } }) });
      // ARPANET's two terminals on the right bank, a cable between them.
      const ax = 16, az = era.z - 6;
      for (const [x, name] of [[ax, "UCLA"], [ax + 8, "SRI"]]) {
        solid(1.2, 0.8, 0.8, "#cfc6aa", x, top + 0.4, az);
        solid(1, 0.8, 0.7, "#d8cfb4", x, top + 1.2, az);
        solid(0.8, 0.5, 0.04, "#38ff7a", x, top + 1.25, az + 0.37, 1.1);
        sign(name, "illustration, not the original machines", x, top + 2.4, az + 0.4, 0, 0.4);
        obstacle(x - 0.7, x + 0.7, az - 0.5, az + 0.5);
      }
      solid(7, 0.08, 0.08, "#2a2a2a", ax + 4, top + 0.05, az - 0.2);
      // A keyboard at each terminal, and between them a generic switching box on the line, its lamps lit: an
      // illustration of a network node, not a model of any machine.
      detail(kit, ax + 4, top, az, (M) => [...[-4, 4].flatMap((x) => [B(M, 0.9, 0.06, 0.3, "#3c3a34", x, 0.83, 0.5), ...Array.from({ length: 6 }, (_, k) => B(M, 0.11, 0.04, 0.1, "#e9e2cc", x - 0.33 + k * 0.13, 0.88, 0.5))]),
        M.bevelBox({ w: 0.9, h: 1.6, d: 0.7, color: "#7c8288", bevel: 0.05, offset: { x: 0, y: 0.8, z: -0.5 } }), B(M, 0.7, 1.2, 0.02, "#2a2f33", 0, 0.95, -0.14),
        ...Array.from({ length: 10 }, (_, k) => B(M, 0.09, 0.09, 0.02, k % 3 ? "#7dff9e" : "#ffb347", -0.2 + (k % 2) * 0.4, 1.4 - Math.floor(k / 2) * 0.2, -0.12, 1.2))]);
      obstacle(ax + 3.5, ax + 4.5, az - 0.85, az - 0.15);
      sign("ARPANET · 29 OCTOBER 1969", "the first host-to-host message, UCLA to SRI", ax + 4, top + 3.2, az + 0.4, 0, 0.5);
      prop({ id: "e0-arpanet", year: 1969, connection: "context", date: "29 October 1969: the first recorded host-to-host message", title: "ARPANET's interrupted login", label: "ARPANET · 1969", sourceKeys: ["e0Arpanet"],
        at: { x: ax + 4, y: top, z: az + 1.3 }, reach: 2.2, pick: { w: 9, h: 2, d: 1, x: ax + 4, z: az },
        onUse: () => ({ board: { room: "ARPANET - 29 October 1969", sources: ["e0Arpanet"], pages: [
          { caption: "In short", title: "Two letters arrive", text: [
            "On 29 October 1969 a computer at UCLA sent the first host-to-host message over the ARPANET to one at SRI.",
            "The attempted login got as far as its first two letters before the system crashed; a later try worked."] },
          { caption: "Still unsolved", title: "A network is not money", text: [
            "Moving a message between computers does not show who owns something, or stop a digital token being spent twice.",
            "This is context for the voyage: the ARPANET is not in the Bitcoin whitepaper's references."] }
        ] } }) });
      buildToys(kit);
      buildCluster(kit);
      buildPanel(kit);
    }
  });
})();
