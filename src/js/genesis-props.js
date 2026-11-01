// The Genesis Voyage's props and footing: the pure half of hopping off the boat, with no DOM, renderer or audio, so
// Node can check it. scene-genesis.js places, draws and opens them.
//
// - `createFooting(areas)`: where an Ooga may stand once it jumps out. Flat ledges and sloped ramps as boxes on the
//   water, obstacles it may not walk into, the nearest ledge to land on, and where a fall into the water comes back
//   to (the dock of the ledge it fell from).
// - `createRegistry()`: interactive props, each `{ id, era, year, title, label, sourceKeys, at, reach, onUse(state),
//   board? }`. `onUse` returns what the scene should open: `{ terminal }` (a text prompt) or `{ board }` (pages).
// - The first props: an early-1990s office PC with a fake prompt (`createDos`: DIR, TYPE, HASH), a hard-drive
//   comparison (`DRIVES`, `driveBoard`), and Tock's stamp-your-own-page desk (`createStampBook`), which links each
//   visitor's line onto the end of Tock's chain with the same toy fingerprint the stamp desk uses.
//
// Every label names its year. Every claim carries a source key in `SOURCES` (or genesis-voyage.js's). Facts marked
// `verified: false` are TODO: check them against the era dossiers (docs/genesis-voyage/eras/) before release.
// Nothing here quotes real people; the texts on the PC are the voyage's own summaries.
(() => {
  "use strict";
  const BL = window.BL = window.BL || {};
  const G = BL.genesisVoyage;

  // --- Footing ------------------------------------------------------------------------------------------------------
  // `areas`: { id, x0, x1, z0, z1, top, dock: { x, z, facing } } flat ledges, or with `ramp: { from, to, axis }` a
  // slope whose top runs from `from` (at x0 or z0) to `to` (at x1 or z1) along `axis` ("x" or "z"); a ramp with
  // `boards: true` is a boarding ramp. `obstacles`: { x0, x1, z0, z1 } boxes a body may not walk into; one with a `top`
  // stops a body only while its feet are more than a step below that top (so it can be landed on and walked over).
  const WATER = -1.2, STEP = 0.6;
  const createFooting = ({ areas, obstacles = [], water = WATER }) => {
    const topOf = (a, x, z) => {
      if (!a.ramp) return a.top;
      const t = a.ramp.axis === "x" ? (x - a.x0) / (a.x1 - a.x0) : (z - a.z0) / (a.z1 - a.z0);
      return a.ramp.from + (a.ramp.to - a.ramp.from) * Math.max(0, Math.min(1, t));
    };
    const inside = (a, x, z, pad = 0) => x >= a.x0 - pad && x <= a.x1 + pad && z >= a.z0 - pad && z <= a.z1 + pad;
    // The area under (x, z) the feet can stand on (the highest within a step up), or null over open water.
    const areaAt = (x, z, feet = Infinity) => {
      let best = null, top = -Infinity;
      for (let i = 0; i < areas.length; i++) {
        const a = areas[i];
        if (!inside(a, x, z)) continue;
        const y = topOf(a, x, z);
        if (y <= feet + STEP && y > top) { top = y; best = a; }
      }
      return best;
    };
    const supportAt = (x, z, feet = Infinity) => { const a = areaAt(x, z, feet); return a ? topOf(a, x, z) : water; };
    // How far (x, z) with radius r sits inside an obstacle (0 when clear).
    const depth = (o, x, z, r) => Math.max(0, Math.min(x - (o.x0 - r), (o.x1 + r) - x, z - (o.z0 - r), (o.z1 + r) - z));
    // A step may go anywhere, even off a ledge into the water, but never further into an obstacle than it already is.
    // `feet` is the body's foot height, for obstacles with a top.
    const walkable = (ax, az, bx, bz, r = 0.3, feet = -Infinity) => {
      for (let i = 0; i < obstacles.length; i++) {
        const o = obstacles[i];
        if (o.top !== undefined && feet + STEP >= o.top) continue;
        if (depth(o, bx, bz, r) > depth(o, ax, az, r) + 1e-6) return false;
      }
      return true;
    };
    // The nearest point on a flat ledge (not a ramp) to (x, z), a little in from its edge, written into `out`
    // with the ledge and its distance. `out.area` is null when nothing is within `reach`.
    const nearestLedge = (x, z, reach, out) => {
      out.area = null; out.distance = Infinity;
      for (let i = 0; i < areas.length; i++) {
        const a = areas[i];
        if (a.ramp) continue;
        const inset = Math.min(0.5, (a.x1 - a.x0) / 2, (a.z1 - a.z0) / 2);
        const px = Math.max(a.x0 + inset, Math.min(a.x1 - inset, x)), pz = Math.max(a.z0 + inset, Math.min(a.z1 - inset, z));
        let blocked = false;
        for (let k = 0; k < obstacles.length; k++) if (depth(obstacles[k], px, pz, 0.3) > 0) blocked = true;
        if (blocked) continue;
        const d = Math.hypot(px - x, pz - z);
        if (d <= reach && d < out.distance) { out.area = a; out.distance = d; out.x = px; out.z = pz; out.y = a.top; }
      }
      return out;
    };
    // Whether (x, z) at feet height stands on a boarding ramp.
    const onBoardingRamp = (x, z, feet) => {
      const a = areaAt(x, z, feet);
      return !!a && !!a.boards;
    };
    // The boarding ramp under (x, z), or null.
    const boardingRampAt = (x, z, feet) => {
      const a = areaAt(x, z, feet);
      return a && a.boards ? a : null;
    };
    // Whether the boat at (bx, bz) lies within `reach` of a ramp's low end, the only place it can be boarded from.
    const rampReaches = (ramp, bx, bz, reach) => {
      const low = ramp.ramp.to <= ramp.ramp.from;
      const fx = ramp.ramp.axis === "x" ? (low ? ramp.x1 : ramp.x0) : (ramp.x0 + ramp.x1) / 2;
      const fz = ramp.ramp.axis === "z" ? (low ? ramp.z1 : ramp.z0) : (ramp.z0 + ramp.z1) / 2;
      return Math.hypot(bx - fx, bz - fz) < reach;
    };
    // Below this the Ooga is in the water and goes back to its ledge's dock.
    const fallen = (feet) => feet < water + 0.5;
    const dockOf = (area) => (area && area.dock) || areas.find((a) => a.dock).dock;
    return { areas, obstacles, water, areaAt, supportAt, walkable, nearestLedge, onBoardingRamp, boardingRampAt, rampReaches, fallen, dockOf };
  };

  // --- Registry -----------------------------------------------------------------------------------------------------
  const createRegistry = () => {
    const list = [], byId = new Map();
    const register = (prop) => {
      for (const key of ["id", "era", "year", "title", "label", "sourceKeys", "at", "onUse"]) if (prop[key] === undefined) throw new Error(`prop ${prop.id}: missing ${key}`);
      if (byId.has(prop.id)) throw new Error(`prop ${prop.id}: registered twice`);
      if (!String(prop.label).includes(String(prop.year))) throw new Error(`prop ${prop.id}: its label must show its year`);
      if (!prop.reach) prop.reach = 1.4;
      list.push(prop); byId.set(prop.id, prop);
      return prop;
    };
    // The nearest prop whose reach covers (x, z), at the walker's level, or null. Allocation-free.
    const near = (x, z, feet = 0, extra = 0) => {
      let found = null, best = Infinity;
      for (let i = 0; i < list.length; i++) {
        const p = list[i], d = Math.hypot(p.at.x - x, p.at.z - z);
        if (d <= p.reach + extra && d < best && Math.abs((p.at.y || 0) - feet) < 1.2) { best = d; found = p; }
      }
      return found;
    };
    // Use a prop: counts the use and returns what to open (`{ terminal }` or `{ board }`).
    const use = (prop, state) => { state.uses = (state.uses || 0) + 1; state.last = prop.id; return prop.onUse(state); };
    return { list, get: (id) => byId.get(id) || null, register, near, use, byEra: (era) => list.filter((p) => p.era === era) };
  };

  // --- Sources for the props ----------------------------------------------------------------------------------------
  // `verified: false`: from search results only (the pages could not be opened when this was written). TODO: confirm
  // on the pages themselves, through the Era 0 dossier, before release.
  const SOURCES = {
    chm350: { label: "Computer History Museum, Storage Engine: First commercial hard disk drive shipped (1956)",
      href: "https://www.computerhistory.org/storageengine/first-commercial-hard-disk-drive-shipped/", kind: "context", verified: false },
    sdaCapacity: { label: "SD Association, Capacity (SD/SDHC/SDXC/SDUC)",
      href: "https://www.sdcard.org/developers/sd-standard-overview/capacity-sd-sdhc-sdxc-sduc/", kind: "context", verified: false },
    microsd2019: { label: "Western Digital press release, 25 February 2019: a 1 TB microSD card",
      href: "https://www.westerndigital.com/company/newsroom/press-releases/2019/2019-02-25-western-digital-unveils-worlds-fastest-1tb-uhs-i-microsd-card", kind: "context", verified: false }
  };
  const sourceOf = (key) => SOURCES[key] || (BL.genesisExhibits && BL.genesisExhibits.sources[key]) || (G && G.SOURCES[key]) || null;

  // --- The DOS PC ---------------------------------------------------------------------------------------------------
  // An invented system ("OOGA-DOS") in the style of an early-1990s office PC, no real product's name or text. `files`:
  // { name, ext, year, sourceKeys, text: [lines] }; only files dated no later than the PC's `year` are on its disk,
  // so the machine never shows the future. `run(line)` returns the lines to print; `cls` asks the screen to clear.
  const MAX_INPUT = 60;
  const clean = (text) => String(text).replace(/[\u0000-\u001f\u007f]/g, "").slice(0, MAX_INPUT).trim();
  const createDos = ({ year, files, fingerprint = G.fingerprint }) => {
    const disk = files.filter((f) => f.year <= year);
    const sizeOf = (f) => f.text.reduce((n, line) => n + line.length + 2, 0);
    const pad = (s, n) => (s + " ".repeat(n)).slice(0, n);
    const find = (arg) => {
      const want = arg.toUpperCase();
      return disk.find((f) => `${f.name}.${f.ext}` === want || f.name === want) || null;
    };
    const banner = [`OOGA-DOS · an invented system in the style of ${year}`, "Type HELP for the commands.", ""];
    const run = (line) => {
      const input = clean(line), space = input.indexOf(" ");
      const cmd = (space < 0 ? input : input.slice(0, space)).toUpperCase(), arg = space < 0 ? "" : input.slice(space + 1).trim();
      if (!cmd) return { lines: [] };
      if (cmd === "HELP") return { lines: ["DIR          list the files on this disk", "TYPE <file>  show a file, e.g. TYPE README.TXT", "HASH <text>  the toy fingerprint of any text", "CLS          clear the screen"] };
      if (cmd === "CLS") return { lines: [], cls: true };
      if (cmd === "DIR") {
        const total = disk.reduce((n, f) => n + sizeOf(f), 0);
        return { lines: [" Volume in drive C is VOYAGE", " Directory of C:\\VOYAGE", "",
          ...disk.map((f) => `${pad(f.name, 9)}${pad(f.ext, 4)}${String(sizeOf(f)).padStart(7)}  ${f.year}`),
          `${String(disk.length).padStart(9)} file(s) ${String(total).padStart(9)} bytes`] };
      }
      if (cmd === "TYPE") {
        if (!arg) return { lines: ["Required parameter missing"] };
        const f = find(arg);
        if (!f) return { lines: ["File not found"], missing: arg };
        return { lines: [...f.text, "", ...f.sourceKeys.map((k) => `Source: ${sourceOf(k).label}`)], file: f };
      }
      if (cmd === "HASH") {
        if (!arg) return { lines: ["Required parameter missing"] };
        return { lines: [`${fingerprint(arg)}  "${arg}"`, "Museum note (added today): a toy fingerprint (FNV-1a), not a real secure hash."], hash: fingerprint(arg) };
      }
      return { lines: ["Bad command or file name"] };
    };
    return { year, disk, banner, prompt: "C:\\VOYAGE>", run, sizeOf };
  };
  // The office PC's disk, written for the voyage (TODO: check every line against the Era 3 dossier). Each file's
  // year is the year of what it describes, so B-MONEY.TXT (1998) is on a later PC's disk, not this one's.
  const PC_FILES = [
    { name: "README", ext: "TXT", year: 1993, sourceKeys: ["whitepaper"], text: [
      "This PC belongs to Tock, the archivist Ooga (an invented guide).",
      "MUSEUM NOTES, written today for the voyage, about ideas from these years.",
      "(Bitcoin came much later: its whitepaper was published in 2008.)",
      "Try TYPE MERKLE.TXT, TYPE STAMPS.TXT or HASH followed by any words."] },
    { name: "MERKLE", ext: "TXT", year: 1980, sourceKeys: ["merkle1980"], text: [
      "1980: Ralph Merkle's paper Protocols for Public Key Cryptosystems",
      "describes hashing data in a tree: pairs of fingerprints are hashed",
      "together, again and again, until one fingerprint stands for them all."] },
    { name: "STAMPS", ext: "TXT", year: 1991, sourceKeys: ["haber1991"], text: [
      "1991: Haber and Stornetta, How to Time-Stamp a Digital Document.",
      "Each stamp takes in the fingerprint of the stamp before it, so an",
      "old record cannot be changed quietly without breaking every link after it."] },
    { name: "BATCHES", ext: "TXT", year: 1993, sourceKeys: ["bayer1993"], text: [
      "1993: Bayer, Haber and Stornetta gather many documents into a Merkle",
      "tree, so one stamp covers a whole batch at once."] },
    { name: "B-MONEY", ext: "TXT", year: 1998, sourceKeys: ["whitepaper"], text: [
      "1998: Wei Dai's b-money proposal, reference [1] in the whitepaper.",
      "TODO: write from the Era 4 dossier."] }
  ];

  // --- The hard drives ----------------------------------------------------------------------------------------------
  // 1956 against 2019, with the numbers a 12-year-old can hold. TODO: verify against the Era 0 dossier.
  const DRIVES = {
    old: { name: "IBM 350 disk unit", year: 1956, what: "announced 14 September 1956 with the 305 RAMAC",
      capacity: "5 million characters (about 3.75 megabytes)", bytes: 3.75e6, size: "about 5 ft high and 6 ft wide",
      parts: "fifty 24-inch disks spinning at 1,200 rpm", weight: "over a ton, with its air compressor", sourceKeys: ["chm350"] },
    now: { name: "A microSD card", year: 2019, what: "1 TB cards announced 25 February 2019",
      capacity: "1 terabyte (1,000,000 megabytes)", bytes: 1e12, size: "15 × 11 × 1 mm, smaller than a fingernail",
      parts: "no moving parts at all", weight: "lighter than a paper clip", sourceKeys: ["sdaCapacity", "microsd2019"] }
  };
  const driveRatio = () => Math.round(DRIVES.now.bytes / DRIVES.old.bytes);
  // The plinth's panel pages, as genesis-voyage.js's exhibit pages are: { caption, title, text: [paragraphs] }.
  const drivePages = () => {
    const o = DRIVES.old, n = DRIVES.now, times = driveRatio().toLocaleString("en-US");
    return [
      { caption: String(o.year), title: `${o.year}: the ${o.name}`, text: [`Size: ${o.size}. Inside: ${o.parts}. Weight: ${o.weight}.`, `It held ${o.capacity}. It was ${o.what}.`] },
      { caption: String(n.year), title: `${n.year}: ${n.name.toLowerCase()}`, text: [`Size: ${n.size}, with ${n.parts}. Weight: ${n.weight}.`, `It holds ${n.capacity}. ${n.what[0].toUpperCase()}${n.what.slice(1)}.`] },
      { caption: "Compare", title: `${times} times as much`, text: [`One ${n.year} card holds about ${times} times what the ${o.year} drive held.`, "Every bitcoin transaction ever made fits on drives like these, copied by thousands of computers around the world."] },
      { caption: "Sources", title: "Where this comes from", text: ["The numbers come from the sources linked below. They are being checked against the voyage's Era 0 research before release."] }
    ];
  };

  // --- Tock's book: stamp your own page -----------------------------------------------------------------------------
  // The visitor's lines join the end of Tock's chain: each stamp is the fingerprint of the stamp before it, a bar,
  // and the line, exactly as G.chain links Tock's pages. Capped at `max` stamps for the visit.
  const createStampBook = ({ fingerprint = G.fingerprint, start = G.chain(false)[G.PAGES.length - 1], max = 12 } = {}) => {
    const entries = [];
    const add = (line) => {
      const text = clean(line);
      if (!text) return { error: "Write a line first." };
      if (entries.length >= max) return { error: `Tock's book is full for this visit (${max} pages).` };
      const prev = entries.length ? entries[entries.length - 1].code : start, code = fingerprint(prev + "|" + text);
      const entry = { page: G.PAGES.length + entries.length + 1, text, prev, code };
      entries.push(entry);
      return entry;
    };
    // Recheck every link from Tock's last stamp: the index of the first stamp that no longer matches, or -1.
    const verify = () => {
      let prev = start;
      for (let i = 0; i < entries.length; i++) {
        if (fingerprint(prev + "|" + entries[i].text) !== entries[i].code) return i;
        prev = entries[i].code;
      }
      return -1;
    };
    return { entries, start, max, add, verify };
  };
  // The desk as a terminal: every line typed is stamped.
  const stampTerminal = (book) => ({
    banner: ["Tock's book of pages. Write one line and press Enter:", "it is fingerprinted and linked onto the end of Tock's chain.",
      `Tock's last stamp: ${book.start}`, ""],
    prompt: "Your page:",
    run: (line) => {
      const r = book.add(line);
      if (r.error) return { lines: [r.error] };
      return { lines: [`Page ${r.page}: "${r.text}"`, `  links to ${r.prev}  →  stamp ${r.code}`], entry: r };
    }
  });

  BL.genesisProps = { WATER, STEP, MAX_INPUT, SOURCES, PC_FILES, DRIVES, sourceOf, clean, createFooting, createRegistry, createDos, driveRatio, drivePages, createStampBook, stampTerminal };
})();
