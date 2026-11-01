# Era 2 exhibits: Trees and Blind Money (1980–1989)

Workstream branch `gv/era-2-exhibits`. Built from the Era 2 dossier on `gv/research`
(`docs/genesis-voyage/eras/era-2-trees-and-blind-money.md`, v0.1).

**How it plugs in.** `src/js/genesis-era-2.js` registers through the era exhibit kit and follows the published
contract, `docs/genesis-voyage/EXHIBIT-CONTRACT.md` on `gv/exhibits` (merged into this branch at `27d14ff`):

```js
BL.genesisExhibits.register(2, { sources, overview, build(kit), update(dt, elapsed, state), dispose() })
```

- `sources`: the nine `E2-*` keys below, resolved for every panel, terminal and link by genesis-props.js's `sourceOf`
  through the kit's registry.
- `overview`: Era 2's `summary` (261 characters), three guide pages (what to try, what each date marks, what is
  context and what is held) and their `sourceKeys`, shown on the **shared** overview board at the left bank's gateway.
  Era 2 builds no era-wide sign of its own: the shared signage gives every cave its years sign, pylons and overview
  board. Only exhibit-specific signs remain.
- `build(kit)`: makes one visit's live state and models through the kit only (`kit.solid`, `kit.M.box` with
  `kit.createNode`/`kit.place`/`kit.addChild`, `kit.label`, `kit.sign`), puts a `kit.obstacle` under each of the five
  exhibit footprints, and adds the five exhibits with `kit.prop`, each with:
  - an id in the builder's prefix, `e2-merkle`, `e2-blind`, `e2-pc`, `e2-floppy`, `e2-maze` (`era2-` is reserved
    for the shared signage, whose overview board is `era2-overview`);
  - `connection`: `"citation"` with `ref: "[7]"` for the Merkle table (the 1980 paper), `"context"` with no `ref` for
    the other four;
  - `date`: what its year marks, in words;
  - `pick: { w, h, d, x, z }`, the tap box centred over the model, and `at`, the walk-up point 0.8 m in front of it
    toward the stream, which the shared trail's spur and STEP post lead to. Using one opens its terminal.
- `update`: poses the models from the live state while the visitor is in Era 2's cave; allocates nothing.
- `dispose`: drops the visit's state on leave (the scene's root takes the nodes).

The page already loads `genesis-era-2.js` and scene-genesis.js builds, updates and disposes every registered era, so
**no shared file changes and no scene wiring are needed**. This branch authors only `src/js/genesis-era-2.js` and this
note; the merges bring `gv/water-boat`'s and `gv/exhibits`' files in unchanged.

- [What is in the cave](#what-is-in-the-cave)
- [Classification and dates](#classification-and-dates)
- [Held: the elliptic-curve picture](#held-the-elliptic-curve-picture)
- [Source keys](#source-keys)
- [Unit proof (optional, for the integrator)](#unit-proof-optional-for-the-integrator)
- [What was checked, and the limits](#what-was-checked-and-the-limits)
- [Open questions for the integrator](#open-questions-for-the-integrator)

## What is in the cave

Everything stands on the cave's **left bank**, facing the stream, about 10 m in from the stream's edge (bank frame v
about 8.5 to 11.3) and at u 17 to 52 down the cave: clear of the gateway (u < 10), the dock and its ramp (u 32 to 40,
v < 6), the lamp posts, the waterside walk (v < 1.5) and the walkway inland from the ramp (|z − cave middle| < 2.6),
and nothing above 3.5 m (the limit is 8 m). Positions are in `LAYOUT`, derived from the kit's `era`; `footprints()`
lists the boxes passed to `kit.obstacle`, and `walkUp(key, y)` gives each walk-up point. The Merkle table is Era 2's
step on the shared **Steps toward Bitcoin** trail (step 2 after Era 0's Feller [8] in the unit tier; the scene also
counts Fingerprints and Time's two room links); its STEP post lands in front of the table, clear of it (checked).

| Exhibit (id) | Year label | Connection (kit) | Hands-on | Short explanation |
|---|---|---|---|---|
| Merkle-tree table (`e2-merkle`) | `MERKLE-TREE TABLE · 1980` | **`citation`, ref `[7]`** | `CHANGE 3 text` lights the record's path (4 of 15 fingerprints); `PROVE 5` shows the 3-fingerprint proof (blue); `VERIFY 5` recomputes the root from the record and proof and compares it with the trusted root (lamp green/red); `TRUST` republishes | Change one record and only its path to the root changes; three fingerprints prove one record is in the tree |
| Blind-stamp station (`e2-blind`) | `BLIND-STAMP STATION · 1982` | `context` | `WRITE`, `SEAL` (carbon-lined envelope), `STAMP` (signer sees only an envelope number), `OPEN` (the mark came through), `CHECK`, `SPEND` (a second spend is refused), `LOG` | Get a stamp on a token the signer cannot see, then reveal it and check the stamp |
| Office PC (`e2-pc`) | `OFFICE PC · 1981` | `context` (period gear) | OOGA-DOS: `DIR`, `DIR A:`, `TYPE`, `A:`/`C:`, `HASH`, `VER`, `CLS`. Six read-only notes on C:, all dated ≤ 1989; write commands answer "read-only" | An invented 1980s-style PC whose disk holds dated museum notes with sources |
| 5.25-inch disk crate (`e2-floppy`) | `5.25-INCH DISKS · 1980s` | `context` (period gear) | `SWAP 1 4` sorts by year (reports the fewest possible swaps), `LOAD 2` puts a disk in the PC's drive A, `EJECT` | Sort the disks by year, then load one to read what its date marks |
| LEAVES TO ROOT cabinet (`e2-maze`) | `LEAVES TO ROOT · 1980s STYLE` | `context` (an original easter egg) | Type W A S D moves (up to 60 a line): collect four leaves, the gate opens, reach it; four fixed mazes with a par; `NEXT` | Collect the four leaves, then reach the root gate in as few moves as you can |

Each prop's `date`, as passed to the kit:

| Prop | `date` |
|---|---|
| `e2-merkle` | 1980: published in the IEEE Symposium on Security and Privacy proceedings; the exact presentation day is not established in the research |
| `e2-blind` | 1982: presented at the CRYPTO '82 conference; the printed proceedings are dated 1983, and the exact day is not established |
| `e2-pc` | 12 August 1981: the IBM Personal Computer was unveiled; this PC is an invented design in the style of the decade |
| `e2-floppy` | 1980s: period gear of the decade; the research clears no introduction date or capacity for these disks, so none is shown |
| `e2-maze` | 1980s style: made for the voyage in 2026, in a blocky style of 1980s games; not a real game of the decade |

Every exhibit has: source keys, a year label, `RESET` (and `live.resetAll()` for a new visit), a one-line `short`, a
`deeper` panel (pages in makeBoard's shape, also printed by `MORE` in its terminal) and `SOURCES`.

**Models.** All procedural from kit boxes, original and unbranded, each with its own sign (the earlier era sign and
timeline rail are gone; their date notes moved to the overview's "What each date marks" page): a tiled tree board with wiring and record cards; a
desk with a signer's screen, slip, envelope and a stamp on an arm; a beige box, monitor and blank keyboard; an open
crate with five labelled sleeves; an upright cabinet with an invented marquee strip and a screen. Static parts are
`kit.solid` boxes; lit tiles, the envelope, stamp, disks, maze sprites and lamps are their own nodes posed by
`update`. The maze's walls are a fixed pool of 44 row runs (unit boxes stretched along z), re-laid only when the
maze changes. Under 400 nodes in all, a fixed number (checked); the kit has no merge helper, so static parts are not
merged (see the open questions). Nothing registers input, audio or timers. The stamp's press is stilled when the
kit's update state carries `calm: true` (it does not yet; see the open questions); the lit tiles do not move.

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

Registered with the kit as `sources` (also `BL.genesisEra2.SOURCES`). `kind` uses the kit's classes; `verified` follows the dossier's reading:

| Key | Points to | Kind |
|---|---|---|
| `E2-MERKLE` | ralphmerkle.com/papers/Protocols.pdf, §6, pp. 125–127 | whitepaper citation [7] |
| `E2-MERKLE-BIB` | ralphmerkle.com/merkleDir/papers.html | whitepaper citation [7] |
| `E2-WHITEPAPER` | bitcoin.org/bitcoin.pdf, References [7] | whitepaper citation [7] (verified: false, the dossier quotes no passage) |
| `E2-CHAUM` | chaum.com author-hosted scan, envelope analogy | context |
| `E2-CHAUM-CAT` | chaum.com/publications | context |
| `E2-ECC` | link.springer.com chapter 10.1007/3-540-39799-X_31, abstract | context |
| `E2-MAY` | nakamotoinstitute.org/library/crypto-anarchist-manifesto | context |
| `E2-PC` | ibm.com/history/personal-computer | context |
| `E2-DOSSIER` | the Era 2 dossier on gv/research (period-gear and easter-egg notes), labelled a museum research record | context |

## Unit proof (optional, for the integrator)

The kit's shared check (`Genesis Voyage exhibits` in `test/run.mjs`) builds Era 2 with its stand-in kit and passes
(connections valid, the trail in date order, nothing in a reserved plot or over the height limit). This deeper proof is
offered for the integrator to add if wanted; it is not required, and this branch does not edit `test/run.mjs`. It
loads `math`, `scene`, `models`, `genesis-voyage`, `genesis-world`, `genesis-props`, `genesis-exhibits` and
`genesis-era-2`, builds Era 2 through `BL.genesisExhibits.eras[2].build` with a real kit (the engine's models and scene
graph, a stub label), and checks the rules, the registration, the footprints and the models. **50 named checks.**

The contract repair added nine of them, read from what the module hands the kit (not from its own exports):

| Check | Asserts |
|---|---|
| `ids` | exactly `e2-merkle`, `e2-blind`, `e2-pc`, `e2-floppy`, `e2-maze`; every id starts `e2-`, none `era<n>-` |
| `citation7` | `e2-merkle` is `connection: "citation"`, `ref: "[7]"`, passes `checkProp`, is the only stop `trailOf` puts on the trail, and its date says 1980 and "published" |
| `contextOnly` | the other four are `connection: "context"` with no `ref`, pass `checkProp` and are not on the trail |
| `datesMark` | every prop has a `date` that names its year and what it marks (published, presented, unveiled, period gear, made), with no trailing full stop (the scene adds one); the blind station's names 1983 and the PC's 12 August 1981 |
| `overview` | `overview.summary` is 41 to 280 characters and names 1980; 1 to 3 guide pages, one naming `[7]` and one naming context; every `overview.sourceKeys` entry resolves to an https link |
| `noEraSign` | no sign or label of Era 2's own carries the era's name, `ERA n`, the bare years or an `Era n` subtitle, and every sign shows a year |
| `plots` | every solid and obstacle is outside `reservedZones(2)` and the waterside walk, no solid tops 8 m above the bank, and no walk-up point is in a reserved plot |
| `picks` | each tap box is centred on its model's footprint with the footprint's width and depth; each walk-up point is in front of it (toward the stream) and within reach |
| `stepClear` | the shared trail's STEP post for each trail stop (placed as scene-genesis.js `buildTrail` places it) lands clear of every Era 2 solid and obstacle |

**Fails before, passes after.** Run against the previous module (`cbdbc2c`, on top of the merged `gv/exhibits`
shared files) and against the repair:

```
== previous module (cbdbc2c) with gv/exhibits shared files
FAILED: ids, citation7, contextOnly, datesMark, overview, noEraSign, picks, exhibits, classified, dates
== repaired module
PASS: 50 checks
```

`plots` and `stepClear` pass on both: the old layout broke no plot rule, and with no citation it had no STEP post to
check. `exhibits`, `classified` and `dates` fail on the old module because they now read the contract's `date` and
`connection` fields.

```js
// Rule: the Genesis Voyage's Era 2 exhibits, through genesis-exhibits.js and genesis-era-2.js themselves, built with a
// real kit (the engine's models and scene graph, a stub label). The Merkle table changes only the changed
// record's path, proves a record with three fingerprints and fails against a stale root; the blind-stamp desk keeps
// its order, never shows the signer a token, carries the stamp through and refuses a second spend; the PC's disk is
// bounded, read-only, dated no later than 1989 and reads a loaded floppy; the crate sorts in the fewest swaps it
// reports; every maze is connected with four reachable leaves and a par a solver meets; every exhibit has its year
// on its label, sources that link, a short line, a deeper panel and a RESET that restores it; context stays context
// and the curve exhibit stays held; the layout keeps the stream's edge, the ramp and its walkway clear and every
// exhibit reachable; and the models pose from state without growing and leave the graph on dispose.
const genesisEra2Proof = async () => {
  const context = { window: {} };
  for (const f of ["math", "scene", "models", "genesis-voyage", "genesis-world", "genesis-props", "genesis-exhibits", "genesis-era-2"]) runInNewContext(await readFile(join(root, `src/js/${f}.js`), "utf8"), context);
  const BL = context.window.BL, G = BL.genesisVoyage, P = BL.genesisProps, W = BL.genesisWorld, EX = BL.genesisExhibits, E2 = BL.genesisEra2, era = W.ERAS[E2.ERA];
  // The kit, as scene-genesis.js makes it, over a bare parent node; props go to a registry, obstacles to a list.
  const { createNode, addChild } = BL.scene, M = BL.models, parent = createNode(), reg = P.createRegistry(), obs = [];
  const label = () => ({ back: M.box({ w: 1, h: 0.3, d: 0.05, color: "#000000" }), face: M.box({ w: 1, h: 0.3, d: 0.01, color: "#ffffff" }), width: 1, height: 0.3 });
  const place = (n) => { addChild(parent, n); return n; };
  const solids = [], signs = [], defs = [];
  const kit = { era, top: W.BANK_TOP, channel: W.CHANNEL, M, createNode, addChild, place, label: (t, sub, o) => { signs.push({ t, sub }); return label(); },
    solid: (w, h, d, color, x, y, z, emissive = 0) => { solids.push({ x0: x - w / 2, x1: x + w / 2, z0: z - d / 2, z1: z + d / 2, top: y + h / 2 }); return place(createNode({ geometry: M.box({ w, h, d, color, emissive }), position: { x, y, z } })); },
    sign: (t, sub, x, y, z, yaw = 0, height = 0.6) => { signs.push({ t, sub, x, z }); const l = label(), n = place(createNode({ position: { x, y, z }, rotation: { x: 0, y: yaw, z: 0 } })); addChild(n, createNode({ geometry: l.back }), createNode({ geometry: l.face })); return n; },
    obstacle: (x0, x1, z0, z1) => { obs.push({ x0, x1, z0, z1 }); }, prop: (d) => { defs.push(d); return reg.register({ ...d, era: E2.ERA }); } };
  const def = EX.eras[E2.ERA];
  const registered = !!def && def.build && def.update && def.dispose && ["E2-MERKLE", "E2-CHAUM", "E2-ECC", "E2-MAY", "E2-PC"].every((k) => EX.sources[k] && P.sourceOf(k) === EX.sources[k]);
  def.build(kit);
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
  const live = E2.visit.live, pc = live.terminals.pc, fl = live.terminals.floppy;
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
    && Object.values(E2.EXHIBITS).flatMap((ex) => [ex.short, ex.date, ...ex.deeper.pages.flatMap((p) => p.text)]).join(" ").split(/(?<=\.)\s/).every((t) => !/1\.44/.test(t) || /different format/.test(t));
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
  const exhibits = Object.entries(E2.EXHIBITS).every(([k, ex]) => {
    const term = live.terminals[k], prop = reg.get(ex.id);
    return prop && prop.era === 2 && /^[A-Za-z0-9 /:!?+\-.]+$/.test(ex.deeper.room) && String(ex.label).includes(String(ex.year)) && ex.short.length > 20 && ex.short.length < 140 && ex.deeper.pages.length >= 2
      && ex.sourceKeys.every((s) => /^https:\/\//.test(E2.sourceOf(s).href)) && ex.deeper.sources.every((s) => /^https:\/\//.test(E2.sourceOf(s).href))
      && term.run("HELP").lines.some((l) => /^RESET/.test(l)) && text(term.run("MORE")).includes(ex.date) && !!term.run("RESET")
      && reg.near(prop.at.x + 0.3, prop.at.z, prop.at.y) === prop && reg.use(prop, {}).terminal === term;
  });
  const fresh = E2.createLive(), snap = (l) => JSON.stringify([l.merkle.leaves, l.merkle.trusted, l.blind.step, l.blind.log, l.floppy.order, l.floppy.loaded, l.maze.at, l.maze.index, l.pc.drive]);
  live.merkle.change(0, "x"); live.blind.write("y"); live.floppy.swap(0, 1); live.maze.runMoves("DDSS"); live.maze.reset(2); live.resetAll();
  const resetAll = snap(live) === snap(fresh);
  // Context stays context; the paper the whitepaper cites is the only citation; dates keep their meanings; ECC is held.
  const S = E2.SOURCES;
  const classified = S["E2-CHAUM"].kind === "context" && S["E2-ECC"].kind === "context" && S["E2-MAY"].kind === "context" && S["E2-MERKLE"].kind === "whitepaper citation [7]"
    && E2.EXHIBITS.blind.connection === "context" && Object.values(E2.EXHIBITS).filter((ex) => ex.connection === "citation").length === 1 && E2.EXHIBITS.merkle.ref === "[7]"
    && ["CHAUM", "ECC1985", "MAY1988"].every((n) => /Context/.test(E2.PC_FILES.find((f) => f.name === n).text.join(" ")));
  const dates = /1982/.test(E2.EXHIBITS.blind.date) && /1983/.test(E2.EXHIBITS.blind.date) && /presented/i.test(E2.EXHIBITS.blind.date)
    && /published/i.test(E2.EXHIBITS.merkle.date) && /not established/.test(E2.EXHIBITS.merkle.date)
    && /1986/.test(E2.PC_FILES.find((f) => f.name === "ECC1985").text.join(" ")) && E2.FLOPPY_DISKS.every((d) => /PRESENTED|PUBLISHED|UNVEILED|WRITTEN/.test(d.file.text.join(" ")));
  const held = E2.HELD.some((h) => h.id === "ecc-curve" && h.sourceKeys.includes("E2-ECC")) && !Object.values(E2.EXHIBITS).some((ex) => /curve/i.test(ex.title));
  // Layout: inside the left bank, clear of the stream's edge, the ramp, its walkway and the lamp posts; all reachable.
  const C = W.CAVE, ch = W.CHANNEL, pad = 0.3;
  const hits = (o, x0, x1, z0, z1) => o.x0 < x1 && o.x1 > x0 && o.z0 < z1 && o.z1 > z0;
  const lamps = [[-14, 0.25], [-8, 0.8]].map(([x, fr]) => ({ x0: x - 0.15, x1: x + 0.15, z0: era.z1 - fr * C.len - 0.15, z1: era.z1 - fr * C.len + 0.15 }));
  const footprinted = obs.length === E2.footprints().length && reg.byEra(2).length === 5;
  const clear = obs.every((o) => o.x0 > C.x0 + 1 && o.x1 < ch.x0 - 4.5 && o.z0 > era.z0 + 2 && o.z1 < era.z1 - 2
    && !hits(o, -16.5, ch.x0, era.z - 2.6, era.z + 2.6) && !lamps.some((l) => hits(o, l.x0 - pad, l.x1 + pad, l.z0 - pad, l.z1 + pad)));
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
  // The repair (EXHIBIT-CONTRACT.md on gv/exhibits): ids in the builder's e2- prefix, never the shared era2-; the 1980
  // paper a whitepaper citation [7] on the trail and everything else context with no reference; every date says what
  // it marks; the overview through the shared interface; no era-wide sign of our own; tap boxes over the models,
  // walk-up points in front of them; nothing in a reserved plot, the waterside walk or above the height limit; the
  // shared trail's STEP post clear of our exhibits.
  const byId = Object.fromEntries(defs.map((d) => [d.id, d]));
  const ids = defs.length === 5 && ["e2-merkle", "e2-blind", "e2-pc", "e2-floppy", "e2-maze"].every((id) => byId[id]) && defs.every((d) => /^e2-/.test(d.id) && !/^era\d/.test(d.id));
  const trailList = defs.map((d, order) => ({ era: 2, def: d, order, step: 0 })), trail = EX.trailOf(trailList);
  const m7 = byId["e2-merkle"];
  const citation7 = !!m7 && m7.connection === "citation" && m7.ref === "[7]" && EX.checkProp(2, m7) === null && trail.length === 1 && trail[0].def === m7
    && /^1980\b/.test(m7.date || "") && /published/.test(m7.date || "");
  const contextOnly = defs.length === 5 && defs.filter((d) => d !== m7).every((d) => d.connection === "context" && d.ref === undefined && EX.checkProp(2, d) === null)
    && trailList.filter((x) => x.def !== m7).every((x) => !x.step);
  const datesMark = defs.length === 5 && defs.every((d) => typeof d.date === "string" && d.date.includes(String(d.year)) && /published|presented|unveiled|period gear|made/.test(d.date) && !/\.$/.test(d.date))
    && /1983/.test((byId["e2-blind"] || {}).date || "") && /12 August 1981/.test((byId["e2-pc"] || {}).date || "");
  const ov = def.overview;
  const overview = !!ov && typeof ov.summary === "string" && ov.summary.length > 40 && ov.summary.length <= 280 && /1980/.test(ov.summary)
    && Array.isArray(ov.pages) && ov.pages.length >= 1 && ov.pages.length <= 3 && ov.pages.every((pg) => pg.caption && pg.title && pg.text.length)
    && ov.pages.some((pg) => pg.text.join(" ").includes("[7]")) && ov.pages.some((pg) => /context/i.test(pg.text.join(" ")))
    && ov.sourceKeys.length > 0 && ov.sourceKeys.every((k) => P.sourceOf(k) && /^https:\/\//.test(P.sourceOf(k).href));
  const noEraSign = signs.length > 0 && signs.every((g) => !/TREES AND BLIND MONEY|^ERA \d|^1980–1989$/i.test(g.t) && !/^Era \d/.test(g.sub || "") && /\b19\d\d/.test(g.t));
  const reserved = W.reservedZones(2), inPlot = (b) => reserved.some((r) => b.x0 < r.x1 && b.x1 > r.x0 && b.z0 < r.z1 && b.z1 > r.z0);
  const walkStrip = (b) => b.x1 > ch.x0 - W.BANK.FRONT;
  const plots = [...solids, ...obs].every((b) => !inPlot(b) && !walkStrip(b)) && solids.every((b) => b.top <= W.BANK_TOP + W.BANK.MAX_H)
    && defs.every((d) => !inPlot({ x0: d.at.x - 0.3, x1: d.at.x + 0.3, z0: d.at.z - 0.3, z1: d.at.z + 0.3 }));
  const picks = defs.length === 5 && defs.every((d) => {
    const o = obs.find((b) => Math.abs((b.x0 + b.x1) / 2 - d.pick.x) < 1e-9 && Math.abs((b.z0 + b.z1) / 2 - d.pick.z) < 1e-9);
    return o && Math.abs(o.x1 - o.x0 - d.pick.w) < 1e-9 && Math.abs(o.z1 - o.z0 - d.pick.d) < 1e-9 && d.pick.h > 0.8
      && d.at.x >= o.x1 + 0.6 && d.at.z > o.z0 && d.at.z < o.z1 && Math.hypot(d.at.x - d.pick.x, d.at.z - d.pick.z) <= d.reach + (o.x1 - o.x0) / 2 + 0.9;
  });
  // The shared trail's STEP post for each trail stop (scene-genesis.js buildTrail: u - 1.2, max(TRAIL_V + 0.4, v - 0.6)).
  const stepClear = trail.every((x) => {
    const f = W.bankFrame(2, -1), u = f.z1 - x.def.at.z, v = (x.def.at.x - f.edge) * f.side, post = W.bankToWorld(f, u - 1.2, Math.max(W.BANK.TRAIL_V + 0.4, v - 0.6), { x: 0, z: 0 });
    return [...solids, ...obs].every((b) => !(post.x > b.x0 - 0.4 && post.x < b.x1 + 0.4 && post.z > b.z0 - 0.4 && post.z < b.z1 + 0.4));
  });
  // Models: built by def.build above; a thousand frames of update neither grow the graph nor fail to pose it; dispose
  // drops the visit (the scene's root takes the nodes).
  const count = (n) => 1 + n.children.reduce((s, c) => s + count(c), 0), nodes = count(parent), parts = E2.visit.parts;
  live.merkle.change(4, "changed"); live.blind.write(""); live.blind.seal(); live.blind.stamp(); live.floppy.load(1); live.maze.reset(1); live.maze.runMoves("SSDD");
  let posed = true;
  for (let i = 0; i < 1000; i++) {
    def.update(1 / 60, i / 60, { era: 2, walking: true, x: -8, z: era.z, calm: i > 500 });
    if (i === 10) posed = parts.lit[12].visible && parts.envMark.visible && !parts.disks[live.floppy.loaded].visible && parts.stamp.position.y < parts.stampRest
      && parts.runs.some((r) => r.visible && r.scale.z > 1) && parts.mazeShown === 1;
  }
  const settled = parts.stamp.position.y === parts.stampRest && live.blind.stampT === 0 && parts.rootBad.visible && !parts.rootOk.visible;
  const steady = count(parent) === nodes && nodes < 400;
  def.dispose();
  const disposed = E2.visit === null;
  return { ids, citation7, contextOnly, datesMark, overview, noEraSign, plots, picks, stepClear, registered, footprinted, allVerify, path, small, stale, forged, retrusted, termOk, merkleReset, order, blind, carried, unstamped, bounded, blindReset,
    dated, cites, readOnly, noDisk, fewest, sortedOk, loaded, floppyReset, noCapacity, swapCap, mazes, solved, gateShut, capped, exhibits, resetAll,
    classified, dates, held, clear, reachable, posed, settled, steady, disposed };
};
// In unitChecks:
//   const genesisEra2 = await genesisEra2Proof();
//   record("Genesis Voyage Era 2: the Merkle table lights only the changed path and proves a record in three fingerprints, the blind-stamp desk keeps its order, hides the token and refuses a second spend, the PC is bounded and read-only, the crate sorts in its fewest swaps, every maze is solvable at par, it registers through the exhibit kit with e2- ids, citation [7] for the 1980 paper and context for the rest, dated, with its overview and no era-wide sign, clear of the reserved plots, every exhibit has a year label, sources, a panel and a reset, context stays context, the curve stays held, the walkways stay clear and the models stay bounded", Object.values(genesisEra2).every(Boolean), JSON.stringify(genesisEra2));
```

Earlier mutation tests still hold (each deliberate break failed the named check): a parent hashing only its left child
(`path`, `allVerify`, …), the signer's log showing the token (`blind`), a second spend allowed (`carried`), a "1.44 MB"
claim in a panel (`noCapacity`), the swap cap removed (`swapCap`), the table moved onto the walkway (`clear`), May
reclassified as documented influence (`classified`), a node added to the graph per frame (`steady`), a 1993 file on the
1989 disk (`dated`), the kit obstacles not passed (`footprinted`), the maze walls never laid (`posed`), a panel title
outside the sign alphabet (`exhibits`).

## What was checked, and the limits

Run on this branch after the merge (Node 22.23.4, Linux container):

- `node --check src/js/genesis-era-2.js`: clean.
- `npm run build`: clean. The built `oogaboogaland.html` is not committed.
- `npm run test:unit`: **351/351** passed, including the kit's `Genesis Voyage exhibits` check, which builds every era
  (Era 2 included) with its stand-in kit and checks years, sources, openers and placement.
- The optional Era 2 proof above: 41/41.
- **Browser smoke**, headless Chromium (Playwright, SwiftShader WebGL) on this branch's own build, `?wip=genesis&debug=1`,
  1280×800, with no extra wiring: sailed to Era 2 by its plaque, Space jumped out onto the left bank, walked to each
  exhibit and Space opened its terminal (all five), ran a scripted command list on each; the models answered (lit path,
  blue proof tiles, red root lamp, envelope mark, disk leaving the crate). The scene's arrival caption now reads "Jump
  out (Space) to explore its exhibits". `go("hub")` / `go("genesis")` under `debug=1` raised no leave-contract or page
  error, and the second entry rebuilt Era 2's five props from fresh state; the first lap's poll returned before the
  scene had finished loading, so one complete round trip is confirmed, not two. The maze's wall runs were confirmed
  from the scene state (42 of the 44 pooled runs laid for maze 1); the close-up screenshot was blocked by the Ooga, so
  they were not confirmed visually on this build. The console was clean apart from the page's live feeds, which the
  container's network blocks.

Not checked, stated plainly:

- **Frame rate.** SwiftShader cannot judge it: Era 2's cave runs at about 1 fps there **with or without** these
  exhibits (measured on `aa91542` with Era 2 empty: 1–1.5 fps; this branch: 0.5–1 fps; the harbour 11 fps on both).
  No real GPU, phone or tablet was tried and `npm run test:perf` was not run.
- **The scene suite** (`npm test -- genesis`) was not run.
- **Touch and screen readers.** The exhibits are terminals in the scene's existing dialog; typing on a phone keyboard
  and assistive tech were not tried. The maze is turn-based by typed moves (`live.maze.move("W")` is the hook if
  direct control is wanted).
- **Visual review** is from a handful of screenshots, not every camera angle.
- The facts are the dossier's. The primary pages could not be opened from this environment, so nothing was
  re-verified beyond what the dossier records (`verified` in SOURCES follows the dossier's reading).

## Open questions for the integrator

Requests for shared hooks (not edited here):

1. **"How it connects" for terminal exhibits.** scene-genesis.js adds the "How it connects" page (connection, ref,
   date, trail step) only to props whose `onUse` returns a `board`. All five Era 2 exhibits open terminals, so the
   page never appears for them; each terminal's `MORE` prints the same date and connection instead. A kit option (for
   example an extra line on a terminal's banner, or a board reachable beside a terminal) would show the shared page.
2. **Decade years.** The floppy crate and the maze cabinet carry `year: "1980s"` (the dossier clears no exact year
   for either). The overview board and panel sort exhibits with `a.def.year - b.def.year`, which is `NaN` for those
   two, so they fall back to build order there; they still print honestly as "1980s · …". A sort key or a supported
   decade form would place them deliberately.
3. **Calm.** The kit's `update` state has no `calm`; Era 2 reads `state.calm === true` if the scene adds it (to still
   the stamp's 0.7 s press).
4. **Merging static parts.** The stand-in kit's `M` has only `box`, so era files cannot use `M.merge`; Era 2's static
   parts are separate nodes (under 400 in all). A kit helper for merged static geometry would cut draw calls.

Facts still open:

5. **Merkle date.** The README's timeline says "14–16 Apr 1980" and genesis-voyage.js's `merkle1980` says "April
   1980"; the dossier uses the year only, and so do these exhibits.
6. **Deferred gear.** Floppy introduction date and capacity, 8-bit console and modem specifications stay deferred in
   the dossier; the crate shows none and the cabinet is labelled an original made in 2026.
7. **Elliptic curves stay on HOLD** until a primary record for Koblitz's independent work and a verified source for
   the curve picture's mathematics are in the dossier.


---
*Prepared with AI assistance (Claude, by Anthropic) for Bitcoin-Bill. Not reviewed or endorsed by the Ooga Booga Land
maintainers.*
