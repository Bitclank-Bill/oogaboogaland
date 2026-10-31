# Era 2 exhibits: Trees and Blind Money (1980–1989)

Workstream branch `gv/era-2-exhibits`, cut from the current cave base **`gv/water-boat` at `a95536b`** ("the boat shows
from the start; Space jumps out and back in"), which already contains `gv/walk-props`. `feature/genesis-voyage` was
still at `12f7c4f` (the plan only), so it was not used as the base. Built from the Era 2 dossier on `gv/research`
(`docs/genesis-voyage/eras/era-2-trees-and-blind-money.md`, v0.1).

This stream owns only two files: `src/js/genesis-era-2.js` and this note. Nothing shared (`scene-genesis.js`,
`index.html`, `test/run.mjs`, `genesis-props.js`) is changed. The integrator wires it in with the patch below.

**No `EXHIBIT-CONTRACT.md` was found** on any branch of the fork when this was built. The module therefore follows the
contract the code already has: genesis-props.js's registry (`{ id, era, year, title, label, sourceKeys, at, reach,
onUse }`, label must show the year), its terminal shape (`{ banner, prompt, run(line) → { lines, cls? } }`) and
makeBoard's panel shape (`{ room, pages: [{ caption, title, text }], sources }`). If the contract says otherwise, the
pure halves need no change; only `register` and the panel wiring would.

- [What is in the cave](#what-is-in-the-cave)
- [Classification and dates](#classification-and-dates)
- [Held: the elliptic-curve picture](#held-the-elliptic-curve-picture)
- [Source keys](#source-keys)
- [Integration patch](#integration-patch)
- [Unit proof for test/run.mjs](#unit-proof-for-testrunmjs)
- [What was checked, and the limits](#what-was-checked-and-the-limits)
- [Open questions for the integrator](#open-questions-for-the-integrator)

## What is in the cave

Everything stands on the cave's **left bank**, facing the stream, well in from the edge (x < −5) and off the walkway
that runs inland from the bank's boarding ramp (|z − cave middle| < 2.6). Positions are in `LAYOUT`, derived from
`GW.ERAS[2]`; `obstacles()` gives their footprints for `FOOTING.obstacles`.

| Exhibit | Year label | Connection | Hands-on | Short explanation |
|---|---|---|---|---|
| Era sign | `1980–1989` · Era 2 · Trees and Blind Money | — | — | A large gold sign on two posts at the end of the ramp's walkway, plus a timeline rail by the ramp head: what each date marks and its connection |
| Merkle-tree table | `MERKLE-TREE TABLE · 1980` | **whitepaper citation [7]** | `CHANGE 3 text` lights the record's path (4 of 15 fingerprints); `PROVE 5` shows the 3-fingerprint proof (blue); `VERIFY 5` recomputes the root from the record and proof and compares it with the trusted root (lamp green/red); `TRUST` republishes | Change one record and only its path to the root changes; three fingerprints prove one record is in the tree |
| Blind-stamp station | `BLIND-STAMP STATION · 1982` | context | `WRITE`, `SEAL` (carbon-lined envelope), `STAMP` (signer sees only an envelope number), `OPEN` (the mark came through), `CHECK`, `SPEND` (a second spend is refused), `LOG` | Get a stamp on a token the signer cannot see, then reveal it and check the stamp |
| Office PC | `OFFICE PC · 1981` | context (period gear) | OOGA-DOS: `DIR`, `DIR A:`, `TYPE`, `A:`/`C:`, `HASH`, `VER`, `CLS`. Six read-only notes on C:, all dated ≤ 1989; write commands answer "read-only" | An invented 1980s-style PC whose disk holds dated museum notes with sources |
| 5.25-inch disk crate | `5.25-INCH DISKS · 1980s` | context (period gear) | `SWAP 1 4` sorts by year (reports the fewest possible swaps), `LOAD 2` puts a disk in the PC's drive A, `EJECT` | Sort the disks by year, then load one to read what its date marks |
| LEAVES TO ROOT cabinet | `LEAVES TO ROOT · 1980s STYLE` | easter egg (original) | Type W A S D moves (up to 60 a line): collect four leaves, the gate opens, reach it; four fixed mazes with a par; `NEXT` | Collect the four leaves, then reach the root gate in as few moves as you can |

Every exhibit has: source keys, a year label, `RESET` (and `live.resetAll()` for a new visit), a one-line `short`, a
`deeper` panel (pages in makeBoard's shape, also printed by `MORE` in its terminal) and `SOURCES`.

**Models.** All procedural from `BL.models` boxes, original and unbranded: a tiled tree board with wiring and record
cards; a desk with a signer's screen, slip, envelope and a stamp on an arm; a beige box, monitor and blank keyboard; an
open crate with five labelled sleeves; an upright cabinet with an invented marquee and a screen holding the maze.
About 150 nodes in all, a fixed number (checked). Static parts are merged per exhibit; only lit tiles, the envelope,
stamp, disks, maze sprites and lamps are separate nodes, posed by `sync` without allocating. Calm mode stills the
tile pulse and the stamp press. Nothing registers input, audio or timers; `dispose` takes the root off the graph.

**What is not shown, on purpose.** No floppy capacity (the dossier clears none; 1.44 MB is a different format). No
ROMs, logos, product names on models, game tunes or sounds (this module makes no sound). No invented quotes: the one
short passage from May's text is not used on screen; the PC's notes are museum summaries. No claim that the tree was
first conceived in 1980, that blind signatures are used by Bitcoin, or that DigiCash existed in 1982.

## Classification and dates

| Event | What the date marks (as shown) | Connection |
|---|---|---|
| Merkle, *Protocols for Public Key Cryptosystems* | **1980**: published in the IEEE S&P proceedings; presentation day not established | whitepaper citation [7] |
| IBM Personal Computer | **12 August 1981**: unveiled; base USD 1,565 configuration with 16 KB RAM and no disk drive | context (period gear) |
| Chaum, *Blind Signatures for Untraceable Payments* | **1982**: presented at CRYPTO '82; printed proceedings dated **1983** | context |
| Miller, *Use of Elliptic Curves in Cryptography* | **1985**: presented at CRYPTO '85; printed volume **1986**; 2000 online records are not the invention date | context (text note only) |
| May, *The Crypto Anarchist Manifesto* | **1988**: the date in the SNI reprint; first circulation day not established; shown as the author's views | context |

Each floppy holds one note that spells these apart (PUBLISHED / PRESENTED / PRINTED / UNVEILED / WRITTEN).

## Held: the elliptic-curve picture

Not built (`HELD` in the module). The brief allowed it only if its mathematics and attribution could be verified
from the dossier and primary sources. The dossier holds only the publisher's abstract of Miller's 1985 paper and marks
a joint (Koblitz) attribution as a pending source check. An attempt to read the Springer and AMS pages from this build
environment failed (DNS blocked), so nothing beyond the dossier was verified. The PC keeps a dated text note
(`ECC1985.TXT`) that names only Miller's paper and says others' records are not yet checked.

## Source keys

All in `BL.genesisEra2.SOURCES` (`sourceOf` falls back to genesis-props.js's and genesis-voyage.js's keys):

| Key | Points to | Kind |
|---|---|---|
| `E2-MERKLE` | ralphmerkle.com/papers/Protocols.pdf, §6, pp. 125–127 | whitepaper citation [7] |
| `E2-MERKLE-BIB` | ralphmerkle.com/merkleDir/papers.html | whitepaper citation [7] |
| `E2-WHITEPAPER` | bitcoin.org/bitcoin.pdf, References [7] | the paper itself |
| `E2-CHAUM` | chaum.com author-hosted scan, envelope analogy | context |
| `E2-CHAUM-CAT` | chaum.com/publications | context |
| `E2-ECC` | link.springer.com chapter 10.1007/3-540-39799-X_31, abstract | context |
| `E2-MAY` | nakamotoinstitute.org/library/crypto-anarchist-manifesto | context |
| `E2-PC` | ibm.com/history/personal-computer | context (period gear) |
| `E2-DOSSIER` | the Era 2 dossier on gv/research (period-gear and easter-egg notes) | museum research record |

## Integration patch

Five small edits, all in files the integrator owns. This exact patch was applied in a throwaway worktree (not
committed) for the browser smoke run below.

`src/index.html`, after `genesis-boat.js`:

```html
  <script src="js/genesis-era-2.js" data-defer="genesis-scene"></script>
```

`src/js/scene-genesis.js`:

```js
  // after the loops that fill FOOTING, before `const JUMP_REACH`:
  FOOTING.obstacles.push(...BL.genesisEra2.obstacles());

  // in enter(), after registerProps():
  built.era2Live = BL.genesisEra2.createLive(); BL.genesisEra2.register(props, built.era2Live);

  // in enter(), after buildProps():
  built.era2 = BL.genesisEra2.build({ M, createNode, addChild, label: BL.factoryModels.label, parent: root });

  // first line of update(dt), after `sceneTime += dt;`:
  BL.genesisEra2.sync(built.era2, built.era2Live, dt, view.calm);
```

Optional, when the integrator wants the deeper panels as boards (they are already printed by each terminal's `MORE`):
let `GP.sourceOf` fall back to `BL.genesisEra2.sourceOf` (makeBoard looks keys up through it), and open
`props.get(id).deeper` with `openPanel(makeBoard(...))`. `dispose(parts, removeChild)` is available but not needed:
the parts hang under the scene's root, which leave drops.

Also for the integrator: the cave's arrival caption still says "Its exhibits are still being built" for every era
without a room; Era 2 may want its own line (for example from `EXHIBITS.merkle.short`).

## Unit proof for test/run.mjs

Paste the function next to `genesisPropsProof`, and the two lines in the trailing comment into `unitChecks`. It loads
`math`, `scene`, `models`, `genesis-voyage`, `genesis-props`, `genesis-world` and `genesis-era-2` with
`runInNewContext`, as the existing genesis proofs do. 39 named checks; it also builds the models in Node with a stub
label.

```js
// Rule: the Genesis Voyage's Era 2 exhibits, through genesis-era-2.js itself. The Merkle table changes only the changed
// record's path, proves a record with three fingerprints and fails against a stale root; the blind-stamp desk keeps
// its order, never shows the signer a token, carries the stamp through and refuses a second spend; the PC's disk is
// bounded, read-only, dated no later than 1989 and reads a loaded floppy; the crate sorts in the fewest swaps it
// reports; every maze is connected with four reachable leaves and a par a solver meets; every exhibit has its year
// on its label, sources that link, a short line, a deeper panel and a RESET that restores it; context stays context
// and the curve exhibit stays held; the layout keeps the stream's edge, the ramp and its walkway clear and every
// exhibit reachable; and the models pose from state without growing and leave the graph on dispose.
const genesisEra2Proof = async () => {
  const context = { window: {} };
  for (const f of ["math", "scene", "models", "genesis-voyage", "genesis-props", "genesis-world", "genesis-era-2"]) runInNewContext(await readFile(join(root, `src/js/${f}.js`), "utf8"), context);
  const BL = context.window.BL, G = BL.genesisVoyage, P = BL.genesisProps, W = BL.genesisWorld, E2 = BL.genesisEra2, era = W.ERAS[E2.ERA];
  const run = (term, ...lines) => lines.map((l) => term.run(l)).pop();
  const text = (out) => out.lines.join("\n");
  // Merkle.
  const m = E2.createMerkle(), trusted = m.trusted;
  const allVerify = m.leaves.every((t, i) => m.verify(t, m.proof(i), m.trusted).ok);
  const changed = m.change(2, "Mallory's key");
  const path = JSON.stringify(changed.moved) === JSON.stringify([1, 2, 5, 10]) && JSON.stringify(changed.path) === JSON.stringify([10, 5, 2, 1])
    && [...m.lit].every((v, k) => (v === 1) === changed.path.includes(k));
  const proof = m.proof(2), small = proof.length === 3 && proof.map((p) => p.node).join() === "11,4,3";
  const stale = !m.verify(m.leaves[2], proof, trusted).ok && !m.matches();
  const forged = !m.verify("Ada's key", m.proof(2), m.nodes[1]).ok && m.verify(m.leaves[2], m.proof(2), m.nodes[1]).ok;
  m.trust();
  const retrusted = m.verify(m.leaves[2], m.proof(2), m.trusted).ok && m.matches();
  const tt = E2.merkleTerminal(m), proved = run(tt, "PROVE 6"), verified = run(tt, "VERIFY 6");
  const termOk = proved.proof.length === 3 && verified.verified.ok && /not show who owns/i.test(text(verified)) && /reference \[7\]/.test(tt.banner[0])
    && !!run(tt, "CHANGE 9 x").lines[0].match(/1 to 8/);
  run(tt, "RESET");
  const merkleReset = m.trusted === trusted && m.leaves.join() === E2.RECORDS.join() && m.lit.every((v) => !v);
  // Blind stamps.
  const b = E2.createBlind(), bt = E2.blindTerminal(b);
  const order = !!b.stamp().error && !!b.seal().error && !!b.open().error && !!b.check().error;
  b.write("my secret token"); b.seal(); b.stamp();
  const blind = b.log.every((l) => !l.includes("my secret token")) && b.log.length === 1;
  b.open();
  const carried = b.impression === E2.SEAL && b.check().ok && b.spend().ok && b.spend().reason === "spent";
  b.write("unstamped"); b.seal(); b.open();
  const unstamped = !b.check().ok && b.spend().reason === "unstamped";
  for (let i = 0; i < 30; i++) run(bt, "WRITE", "SEAL", "STAMP", "OPEN", "SPEND");
  const bounded = b.log.length <= 8 && b.spent.length <= 12 && /full/.test(text(run(bt, "WRITE", "SEAL", "STAMP", "OPEN", "SPEND")));
  run(bt, "RESET");
  const blindReset = b.step === "blank" && !b.log.length && !b.spent.length && b.checked === null && /NOT real cryptography/.test(bt.banner[1]);
  // The PC and the floppies.
  const live = E2.createLive(), pc = live.terminals.pc, fl = live.terminals.floppy;
  const dir = text(pc.run("dir")), dated = E2.PC_FILES.every((f) => f.year <= E2.PC_YEAR && f.text.every((l) => l.length <= 80))
    && pc.disk.length === E2.PC_FILES.length && /6 file\(s\)/.test(dir);
  const typed = pc.run("TYPE merkle.txt"), cites = typed.lines.some((l) => /^Source \[E2-MERKLE\]/.test(l)) && typed.lines.some((l) => /reference \[7\]/.test(l));
  const readOnly = /read-only/.test(text(pc.run("DEL MERKLE.TXT"))) && /read-only/.test(text(pc.run("FORMAT C:"))) && /Bad command/.test(text(pc.run("PLAY"))) && pc.run("HASH ooga").hash === G.fingerprint("ooga")
    && pc.run("TYPE " + "X".repeat(500)).missing.length <= P.MAX_INPUT;
  const noDisk = /Not ready/.test(text(pc.run("A:"))) && /Not ready/.test(text(pc.run("DIR A:")));
  const f = live.floppy, startOrder = f.order.join();
  // The fewest swaps, by brute force over the crate's orders.
  const key = (o) => o.join(), goal = key([0, 1, 2, 3, 4]), seen = new Map([[startOrder, 0]]), queue = [f.order.slice()];
  while (queue.length) { const o = queue.shift(), d = seen.get(key(o)); for (let i = 0; i < 5; i++) for (let j = i + 1; j < 5; j++) { const n = o.slice(); [n[i], n[j]] = [n[j], n[i]]; if (!seen.has(key(n))) { seen.set(key(n), d + 1); queue.push(n); } } }
  const fewest = f.fewest() === seen.get(goal) && !f.sorted();
  // Selection sort through the terminal.
  for (let i = 0; i < 5; i++) { const at = f.order.indexOf(i); if (at !== i) run(fl, `SWAP ${i + 1} ${at + 1}`); }
  const sortedOk = f.sorted() && f.moves === f.fewest() && /fewest possible/.test(text(run(fl, "SWAP 1 2", "SWAP 1 2")));
  run(fl, "LOAD 3");
  const loaded = f.loaded === f.order[2] && /DATES82/.test(text(pc.run("DIR A:"))) && pc.run("A:") && pc.prompt === "A:\\>" && /1983/.test(text(pc.run("TYPE DATES82.TXT")));
  run(fl, "RESET"); pc.run("RESET");
  const floppyReset = f.order.join() === startOrder && f.loaded === -1 && f.moves === 0 && pc.prompt === "C:\\>";
  const noCapacity = E2.FLOPPY_DISKS.every((d) => !/\d\s*(KB|MB|K\b|kilobyte|megabyte)|1\.44/i.test(d.label + d.file.text.join(" ")))
    && /no capacity/i.test(E2.EXHIBITS.floppy.deeper.pages.map((p) => p.text.join(" ")).join(" "))
    && Object.values(E2.EXHIBITS).flatMap((ex) => [ex.short, ex.dateMeaning, ...ex.deeper.pages.flatMap((p) => p.text)]).join(" ").split(/(?<=\.)\s/).every((t) => !/1\.44/.test(t) || /different format/.test(t));
  const capF = E2.createFloppies(); for (let i = 0; i < 150; i++) capF.swap(0, 1);
  const swapCap = capF.moves === 99 && !!capF.swap(0, 1).error;
  // The mazes.
  const z = live.maze, size = z.size;
  const mazes = z.mazes.every((mz) => {
    const floor = mz.grid.reduce((n, c) => n + (c ? 0 : 1), 0), seen = new Set([mz.start]), q = [mz.start];
    while (q.length) { const c = q.pop(); for (const n of [c + 1, c - 1, c + size.w, c - size.w]) if (!mz.grid[n] && !seen.has(n)) { seen.add(n); q.push(n); } }
    const edges = [...Array(size.h).keys()].every((y) => mz.grid[y * size.w] && mz.grid[y * size.w + size.w - 1]);
    let walls = 0; for (const n of [mz.gate + 1, mz.gate - 1, mz.gate + size.w, mz.gate - size.w]) walls += mz.grid[n];
    return seen.size === floor && edges && new Set(mz.leaves).size === 4 && !mz.leaves.includes(mz.gate) && walls === 3 && Number.isFinite(mz.par) && mz.par > 0;
  });
  // A solver: walk the shortest route through the leaves in the best order, then to the gate; it must win at par.
  const route = (mz, from, to) => {
    const prev = new Map([[from, -1]]), q = [from];
    while (q.length) { const c = q.shift(); if (c === to) break; for (const n of [c + 1, c - 1, c + size.w, c - size.w]) if (!mz.grid[n] && !prev.has(n) && (n !== mz.gate || n === to)) { prev.set(n, c); q.push(n); } }
    const steps = []; for (let c = to; prev.get(c) !== -1; c = prev.get(c)) steps.unshift(c - prev.get(c));
    return steps.map((d) => ({ [-size.w]: "W", [size.w]: "S", [-1]: "A", [1]: "D" })[d]).join("");
  };
  const perms = (a) => a.length ? a.flatMap((v, i) => perms([...a.slice(0, i), ...a.slice(i + 1)]).map((p) => [v, ...p])) : [[]];
  const solved = z.mazes.every((mz, i) => {
    let best = null;
    for (const p of perms([0, 1, 2, 3])) { let at = mz.start, keys = ""; for (const k of p) { keys += route(mz, at, mz.leaves[k]); at = mz.leaves[k]; } keys += route(mz, at, mz.gate); if (!best || keys.length < best.length) best = keys; }
    z.reset(i);
    const early = z.move(route(mz, mz.start, mz.gate)[0]) || true; z.reset(i);
    for (const ch of best) z.move(ch);
    return z.won && z.moves === mz.par && z.best[i] === mz.par && early;
  });
  z.reset(0);
  const gateShut = (() => { const mz = z.maze(); for (let c of route(mz, mz.start, mz.gate)) z.move(c); return !z.won && z.at !== mz.gate; })();
  z.reset(0);
  const capped = z.runMoves("D".repeat(500)) <= E2.MAZE.maxRun && /ROOT|leaves/.test(text(live.terminals.maze.run("SHOW")));
  z.reset(0);
  // Every exhibit: year label, sources, short line, deeper panel, RESET and MORE through its terminal; the registry.
  const reg = P.createRegistry(); E2.register(reg, live);
  const exhibits = Object.entries(E2.EXHIBITS).every(([k, ex]) => {
    const term = live.terminals[k], prop = reg.get(ex.id);
    return prop && prop.era === 2 && String(ex.label).includes(String(ex.year)) && ex.short.length > 20 && ex.short.length < 140 && ex.deeper.pages.length >= 2
      && ex.sourceKeys.every((s) => /^https:\/\//.test(E2.sourceOf(s).href)) && ex.deeper.sources.every((s) => /^https:\/\//.test(E2.sourceOf(s).href))
      && term.run("HELP").lines.some((l) => /^RESET/.test(l)) && text(term.run("MORE")).includes(ex.dateMeaning) && !!term.run("RESET")
      && reg.near(prop.at.x + 0.3, prop.at.z, prop.at.y) === prop && reg.use(prop, {}).terminal === term;
  });
  const fresh = E2.createLive(), snap = (l) => JSON.stringify([l.merkle.leaves, l.merkle.trusted, l.blind.step, l.blind.log, l.floppy.order, l.floppy.loaded, l.maze.at, l.maze.index, l.pc.drive]);
  live.merkle.change(0, "x"); live.blind.write("y"); live.floppy.swap(0, 1); live.maze.runMoves("DDSS"); live.maze.reset(2); live.resetAll();
  const resetAll = snap(live) === snap(fresh);
  // Context stays context; the paper the whitepaper cites is the only citation; dates keep their meanings; ECC is held.
  const S = E2.SOURCES;
  const classified = S["E2-CHAUM"].kind === "context" && S["E2-ECC"].kind === "context" && S["E2-MAY"].kind === "context" && S["E2-MERKLE"].kind === "whitepaper citation [7]"
    && E2.EXHIBITS.blind.connection === "context" && Object.values(E2.EXHIBITS).filter((ex) => /whitepaper citation/.test(ex.connection)).length === 1
    && ["CHAUM", "ECC1985", "MAY1988"].every((n) => /Context/.test(E2.PC_FILES.find((f) => f.name === n).text.join(" ")));
  const dates = /1982/.test(E2.EXHIBITS.blind.dateMeaning) && /1983/.test(E2.EXHIBITS.blind.dateMeaning) && /presented/i.test(E2.EXHIBITS.blind.dateMeaning)
    && /published/i.test(E2.EXHIBITS.merkle.dateMeaning) && /not established/.test(E2.EXHIBITS.merkle.dateMeaning)
    && /1986/.test(E2.PC_FILES.find((f) => f.name === "ECC1985").text.join(" ")) && E2.FLOPPY_DISKS.every((d) => /PRESENTED|PUBLISHED|UNVEILED|WRITTEN/.test(d.file.text.join(" ")));
  const held = E2.HELD.some((h) => h.id === "ecc-curve" && h.sourceKeys.includes("E2-ECC")) && !Object.values(E2.EXHIBITS).some((ex) => /curve/i.test(ex.title));
  // Layout: inside the left bank, clear of the stream's edge, the ramp, its walkway and the lamp posts; all reachable.
  const obs = E2.obstacles(), C = W.CAVE, ch = W.CHANNEL, pad = 0.3;
  const hits = (o, x0, x1, z0, z1) => o.x0 < x1 && o.x1 > x0 && o.z0 < z1 && o.z1 > z0;
  const lamps = [[-14, 0.25], [-8, 0.8]].map(([x, fr]) => ({ x0: x - 0.15, x1: x + 0.15, z0: era.z1 - fr * C.len - 0.15, z1: era.z1 - fr * C.len + 0.15 }));
  const clear = obs.every((o) => o.x0 > C.x0 + 1 && o.x1 < ch.x0 - 4.5 && o.z0 > era.z0 + 2 && o.z1 < era.z1 - 2
    && !hits(o, E2.LAYOUT.sign.x + 0.5, ch.x0, era.z - 2.6, era.z + 2.6) && !lamps.some((l) => hits(o, l.x0 - pad, l.x1 + pad, l.z0 - pad, l.z1 + pad)));
  // Breadth-first walk on a 0.2 grid from the ramp's head over the left bank, a 0.3-radius body against every box.
  const blockers = [...obs, ...lamps], cell = 0.2, nx = Math.round((ch.x0 - C.x0) / cell), nz = Math.round(C.len / cell);
  const free = (x, z) => x > C.x0 + pad && x < ch.x0 - pad && z > era.z0 + pad && z < era.z1 - pad && !blockers.some((o) => x > o.x0 - pad && x < o.x1 + pad && z > o.z0 - pad && z < o.z1 + pad);
  const reached = new Uint8Array(nx * nz), q = [], toIndex = (x, z) => Math.round((x - C.x0) / cell) * nz + Math.round((z - era.z0) / cell);
  const start = toIndex(ch.x0 - 1.6, era.z); reached[start] = 1; q.push(start);
  for (let h = 0; h < q.length; h++) {
    const i = q[h], ix = (i / nz) | 0, iz = i % nz;
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const jx = ix + dx, jz = iz + dz, j = jx * nz + jz;
      if (jx < 0 || jz < 0 || jx >= nx || jz >= nz || reached[j] || !free(C.x0 + jx * cell, era.z0 + jz * cell)) continue;
      reached[j] = 1; q.push(j);
    }
  }
  const reachable = reg.byEra(2).every((p) => { for (let i = 0; i < reached.length; i++) if (reached[i] && Math.hypot(C.x0 + ((i / nz) | 0) * cell - p.at.x, era.z0 + (i % nz) * cell - p.at.z) <= p.reach - 0.05) return true; return false; });
  // Models: build in Node with a stub label, pose a thousand frames, and the graph neither grows nor keeps them.
  const { createNode, addChild, removeChild } = BL.scene, M = BL.models;
  const count = (n) => 1 + n.children.reduce((s, c) => s + count(c), 0);
  const parent = createNode(), label = () => ({ back: M.box({ w: 1, h: 0.3, d: 0.05, color: "#000000" }), face: M.box({ w: 1, h: 0.3, d: 0.01, color: "#ffffff" }) });
  const parts = E2.build({ M, createNode, addChild, label, parent }), nodes = count(parent);
  live.merkle.change(4, "changed"); live.blind.write(""); live.blind.seal(); live.blind.stamp(); live.floppy.load(1); live.maze.runMoves("SSDD");
  let posed = true;
  for (let i = 0; i < 1000; i++) {
    E2.sync(parts, live, 1 / 60, i > 500);
    if (i === 10) posed = parts.lit[12].visible && parts.envMark.visible && !parts.disks[live.floppy.loaded].visible && parts.mazes[0].visible && !parts.mazes[1].visible && parts.stamp.position.y < parts.stampRest;
  }
  const settled = parts.stamp.position.y === parts.stampRest && live.blind.stampT === 0 && parts.rootBad.visible && !parts.rootOk.visible;
  const steady = count(parent) === nodes && nodes < 400;
  E2.dispose(parts, removeChild);
  const disposed = parent.children.length === 0 && parts.root.parent === null;
  return { allVerify, path, small, stale, forged, retrusted, termOk, merkleReset, order, blind, carried, unstamped, bounded, blindReset,
    dated, cites, readOnly, noDisk, fewest, sortedOk, loaded, floppyReset, noCapacity, swapCap, mazes, solved, gateShut, capped, exhibits, resetAll,
    classified, dates, held, clear, reachable, posed, settled, steady, disposed };
};
// In unitChecks:
//   const genesisEra2 = await genesisEra2Proof();
//   record("Genesis Voyage Era 2: the Merkle table lights only the changed path and proves a record in three fingerprints, the blind-stamp desk keeps its order, hides the token and refuses a second spend, the PC is bounded and read-only, the crate sorts in its fewest swaps, every maze is solvable at par, every exhibit has a year label, sources, a panel and a reset, context stays context, the curve stays held, the walkways stay clear and the models stay bounded", Object.values(genesisEra2).every(Boolean), JSON.stringify(genesisEra2));
```

The proof was mutation-tested: each of these deliberate breaks made it fail (and the name of the failing check is
given): a parent hashing only its left child (`path`, `allVerify`, …), the signer's log showing the token (`blind`), a
second spend allowed (`carried`), a "1.44 MB" claim in a panel (`noCapacity`), the swap cap removed (`swapCap`), the
table moved onto the walkway (`clear`), May reclassified as documented influence (`classified`), a node added to the
graph per frame (`steady`), a 1993 file on the 1989 disk (`dated`).

## What was checked, and the limits

Run on this branch (Node 22.23.4, Linux container):

- `node --check src/js/genesis-era-2.js`: clean.
- `npm run build`: clean (the module is not in `index.html` yet, so the built page does not include it; the build was
  also run with the patch applied in the throwaway worktree, clean). The built `oogaboogaland.html` is not committed.
- `npm run test:unit` (the existing global tier): 350/350 passed. Nothing shared was changed.
- The Era 2 proof above, standalone against the module: all checks pass.
- **Browser smoke**, headless Chromium (Playwright, SwiftShader WebGL) on the built page with the patch applied in a
  throwaway worktree, `?wip=genesis&debug=1`, 1280×800: sailed to Era 2 by its plaque, Space jumped out onto the left
  bank, walked to each exhibit and Space opened its terminal (all five), ran a scripted command list on each, and the
  models answered (lit path, blue proof tiles, red root lamp, envelope mark, disk leaving the crate, maze sprites).
  Screenshots were taken of the hall, the Merkle board, the blind desk, the maze and the era sign. `go("hub")` and
  `go("genesis")` round trips under `debug=1` raised no leave-contract error and no page error; one lap's poll returned
  before the scene had finished loading, so one complete round trip is confirmed, not two. The console was clean apart
  from the page's live feeds (mempool.space, Coinbase and similar), which the container's network blocks.

Not checked, stated plainly:

- **No real GPU, phone or tablet.** SwiftShader only; frame rate and the perf floor were not measured (`npm run
  test:perf` was not run). The scene suite (`npm test -- genesis`) was not run on the integrated branch, because the
  integration patch is the integrator's to apply.
- **Touch.** The exhibits are terminals, so they inherit the scene's terminal dialog; typing commands on a phone
  keyboard works in principle but was not tried on a device. The maze is turn-based by typed moves; direct
  arrow/stick control would be the integrator's choice (`live.maze.move("W")` is the hook).
- **Screen readers.** Terminal text is plain text in the existing dialog; not tested with assistive tech.
- **Visual review.** Proportions are judged from five screenshots only; signs were not checked at every camera angle,
  and the boulders the scene scatters in each cave were not cross-checked against the layout (they are not obstacles).
- The facts are the dossier's. The primary pages could not be opened from this environment, so nothing was
  re-verified beyond what the dossier records.

## Open questions for the integrator

1. **EXHIBIT-CONTRACT.md** was not on the fork. If it exists elsewhere, check `register`'s fields against it.
2. **Merkle date.** The README's timeline says "14–16 Apr 1980, IEEE S&P conference" and genesis-voyage.js's
   `merkle1980` label says "April 1980"; the Era 2 dossier says an exact presentation day is not established and uses
   the year only. These exhibits follow the dossier (1980). One of the two should be reconciled.
3. **Floppy introduction date and capacity**, **8-bit console** and **modem** specifications remain deferred in the
   dossier; the crate shows none and the cabinet is labelled as an original made in 2026.
4. **Elliptic curves**: a primary record for Koblitz's independent work and a verified source for the curve picture's
   mathematics would lift the hold.
5. The boat for Era 2 stays the outboard runabout (genesis-world.js), which the dossier supports with a 1958 example.

---
*Prepared with AI assistance (Claude, by Anthropic) for Bitcoin-Bill. Not reviewed or endorsed by the Ooga Booga Land
maintainers.*
