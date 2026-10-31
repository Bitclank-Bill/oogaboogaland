# Era 4 — Work and Scarcity, 1996–1999

Prepared with AI assistance (OpenAI Codex), at Bitcoin-Bill's request.

Base: `aa9154224b7ac284cc53d5684e81c46f9ef41a27`, `gv/water-boat`.
Branch: `gv/era-4-exhibits`. Owned files: this document and `src/js/genesis-era-4.js`.
Interface: header of `src/js/genesis-exhibits.js`; no separate exhibit contract found.
Research: `gv/research:docs/genesis-voyage/eras/era-4-work-and-scarcity.md`, v0.1.

## What visitors can use

Eight dated stations, with obstacles under all furniture, on the banks away from the stream. The era's big sign,
pylons, overview board and the Steps toward Bitcoin trail come from the shared signage (see "Integration review"):

| Prop ID | Location relative to era | Interaction |
|---|---|---|
| `e4-hashcash` | left, middle | `TARGET 4..12`, `MESSAGE text`, `SEARCH`, `STATUS`, `VERIFY`, `STOP` · documented influence, trail |
| `e4-bmoney` | farther left, middle | `COMPARE`, `TRANSFER`, `CREATE`, `MISS`, `RESET` · citation [1], trail |
| `e4-names` | left, near exit | Secure Names for Bit-Strings, April 1997 · citation [5], trail |
| `e4-timesec` | left, near exit | TIMESEC, May 1999 · citation [2], trail |
| `e4-desktop` | right, near entrance | Original beige desktop, local text browser; `OPEN page`, `BACK`, `FORWARD` |
| `e4-modem` | farther right, near entrance | `DIAL`, `HANGUP`, `SIZE 1..64` KiB |
| `e4-cd` | right, middle | `PICK HC`, `PICK NAMES`, `PICK BM`, `PICK TIMESEC` in date order; `LIST`, `RESET` |
| `e4-pocket` | farther right, near exit | Original turn-based maze; `N`, `S`, `E`, `W`, `LOOK`, `RESET` |

Open each station with the existing tap/near-use interaction. All games use the existing modal terminal;
close it with its existing control or Escape to return to walking. No new scene inputs, DOM, listeners,
fetches, sockets, storage, scripts, artwork files, recordings, ROMs or dependencies.

## Historical rules and source keys

| Displayed date and meaning | Dossier keys | Boundary |
|---|---|---|
| 28 March 1997, Hashcash implementation announcement | `E4-HC` | Computational postage; not Bitcoin consensus. The **2002** paper cited as [6] is explicitly assigned to Era 5. No direct-influence assertion is made here. |
| April 1997, Secure Names proceedings publication | `E4-NAMES`, `E4-NAMES-CAT` | Haber/Stornetta, whitepaper [5]; names exact data, not ownership of money. |
| November 1998, b-money publication month | `E4-BM` | Proposal, not a deployed Bitcoin network; whitepaper [1]. Exact first posting day unresolved and labelled so. Protocol assumptions and server alternative shown. |
| May 1999, TIMESEC proceedings publication month | `E4-TIMESEC`, `E4-TIMESEC-CAT` | Massias/Serret Avila/Quisquater, whitepaper [2]; retains a third party. Singular PDF title vs plural catalogue title explained. |
| 1 September 1998, V.90 approval | `E4-MODEM` | 56,000/33,600 bit/s ceilings; ideal transfer estimate, not measured throughput or modem invention date. |

Source URLs are registered under the dossier's exact keys; displayed historical summaries carry those keys.
The announcement, essay, both paper PDFs, catalogues and ITU approval page were opened during implementation.
No historical quotations are used. The 1999 labels on the desktop, CD selector and handheld mean original
museum scenery inspired by the period, **not** researched product introduction dates. Their source associations
point to the content/context, not evidence for invented hardware. Generic gear has no capacity, launch or
manufacturer claims. No logos or copied interfaces/games. No e-gold plaque: its dossier entry is HOLD.
No suggestion that all electronic money was decentralized or that every exhibit directly influenced Bitcoin.

## State, work and disposal

Hashcash is explicitly an educational model: an FNV-style message seed plus a 32-bit integer mixer,
not SHA-1, a historical implementation, secure hashing, real mining or spendable postage.
At most 64 candidate hashes per update, 32,768 across the **whole visit** (commands cannot reset the budget).
Targets are integers 4–12. Message length is at most 48 characters. Verification performs one hash and also
compares exact bound text and target, so changing text invalidates the old stamp even if a toy collision occurs.
`STOP`, changing the message/target, leaving the era, or disposal prevents further work in the relevant path;
leaving the era suspends updates and returning resumes any unfinished search. No work runs on a timer.

Browser history retains eight local page names. Arbitrary URLs are rejected; pages are museum text.
Balance replicas use two fixed two-element typed arrays; creation caps issuance at 15 units per reset; negative transfers are rejected.
No real signatures, consensus, cost pricing or money is implemented. MISS deliberately produces disagreement;
RESET is an explicit toy reset, not a claimed repair protocol. Puzzle progress is four selections. Maze is a
fixed 9×7 original map, capped at 64 moves, with no clock, scores, rewards or persistence.

Modem audio uses two pooled oscillators, created only on DIAL while `navigator.userActivation.isActive`,
connected through `BL.sound.output(context)`. Muted/unsupported audio still permits text play. Repeated DIAL
reuses the voices and replaces automation; tones end in 2.3 seconds. HANGUP cancels them. Disposal stops and
disconnects both voices, closes the context (releasing the sound bus subscription), and nulls all visit state.
All geometry is created only through the kit and removed by the parent scene; update allocates nothing.

## Interface limits and exact unverified areas

- The kit has no terminal redraw, close or selected-prop callbacks. STATUS explicitly refreshes search output.
  A started search may continue after closing its terminal while still in Era 4, subject to the same visit cap.
  The brief modem cue may finish after terminal close. No continuous/background audio loop exists.
- The browser and games are text-terminal interactions, including on phones; there are no bespoke mouse icons,
  live monitor text, gamepad maze controls or on-screen directional buttons in this owned-file scope.
- Hardware introduction/capacity facts for CD-ROM and handhelds remain deferred in the dossier. No such facts
  are displayed. Original props are not recreations of historical products.
- Real-device audio quality, phone keyboard usability, sign readability from normal cameras, physical routes,
  real GPU behavior and sustained performance still require maintainer play-test. No FPS claim.
- Shared scene, HTML, CSS, registry, world and test runner are unchanged. Integrator owns any interface expansion.

## Integration rule checks

The following standalone Node proof exercises the registered module and terminal commands, not a second
implementation of their algorithms. From the repo root, extract this JavaScript block into a temporary `.mjs`
file and run it with Node 22+. Integrate its assertions into the existing `genesisExhibitsProof`/Genesis checks;
do not add a permanent third file under `test/`.

```js
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
const context = { window: { navigator: { userActivation: { isActive: false } } } };
for (const f of ['genesis-world', 'genesis-exhibits', 'genesis-era-4'])
  runInNewContext(readFileSync(`src/js/${f}.js`, 'utf8'), context);
const BL = context.window.BL, def = BL.genesisExhibits.eras[4], era = BL.genesisWorld.ERAS[4];
let props, boxes, obstacles;
const build = () => {
  props = new Map(); boxes = []; obstacles = [];
  def.build({ era, top: BL.genesisWorld.BANK_TOP, channel: BL.genesisWorld.CHANNEL,
    solid: (...args) => boxes.push(args), sign: () => {}, obstacle: (...args) => obstacles.push(args),
    prop: p => { assert(!props.has(p.id)); props.set(p.id, p); }
  });
};
const terminal = id => props.get(`e4-${id}`).onUse({}).terminal;
const out = (term, command) => term.run(command).lines.join('\n');
const frame = () => def.update(1 / 60, 0, { era: 4 });
const count = term => Number(out(term, 'STATUS').match(/visit: (\d+)/)[1]);
build();
assert.equal(props.size, 8);
for (const p of props.values()) {
  assert(p.label.includes(String(p.year)));
  assert(p.sourceKeys.length && p.sourceKeys.every(k => BL.genesisExhibits.sources[k]));
  assert(p.at.z > era.z0 && p.at.z < era.z1);
  const r = p.onUse({}); assert(r.board || r.terminal);
}
for (const [w, , d, , x, , z] of boxes) {
  assert(z - d / 2 > era.z0 && z + d / 2 < era.z1);
  assert(x - w / 2 >= era.cave.x0 && x + w / 2 <= era.cave.x1);
  assert(x + w / 2 <= BL.genesisWorld.CHANNEL.x0 - 1.5 || x - w / 2 >= BL.genesisWorld.CHANNEL.x1 + 1.5);
  assert(obstacles.some(([x0, x1, z0, z1]) => x - w / 2 >= x0 && x + w / 2 <= x1 && z - d / 2 >= z0 && z + d / 2 <= z1));
}
// Rule: bounded work; one-hash verification and changed text invalidation.
const stamp = terminal('hashcash');
assert.match(out(stamp, 'TARGET 13'), /4 to 12/);
out(stamp, 'TARGET 8'); out(stamp, 'SEARCH'); frame(); assert(count(stamp) <= 64);
for (let i = 0; i < 512; i++) frame();
assert.match(out(stamp, 'VERIFY'), /^VALID/);
out(stamp, 'MESSAGE a changed message'); assert.match(out(stamp, 'VERIFY'), /^INVALID/);
out(stamp, 'SEARCH'); out(stamp, 'STOP'); const stopped = count(stamp); frame(); assert.equal(count(stamp), stopped);
for (let i = 0; i < 40000 && count(stamp) < 32768; i++) { out(stamp, 'SEARCH'); frame(); }
assert.equal(count(stamp), 32768); assert.match(out(stamp, 'SEARCH'), /budget exhausted/);
// Rule: replicas visibly disagree after missed delivery, creation is bounded.
const ledger = terminal('bmoney');
assert.match(out(ledger, 'COMPARE'), /agree in this toy/);
out(ledger, 'MISS'); assert.match(out(ledger, 'COMPARE'), /disagree/);
out(ledger, 'RESET'); out(ledger, 'TRANSFER'); assert.match(out(ledger, 'COMPARE'), /A=3 B=5/);
for (let i = 0; i < 30; i++) out(ledger, 'CREATE');
assert.match(out(ledger, 'CREATE'), /cap reached/);
// Regression: spending must not let creation evade its cap or wrap a typed balance.
for (let i = 0; i < 300; i++) { out(ledger, 'TRANSFER'); out(ledger, 'CREATE'); }
assert.match(out(ledger, 'CREATE'), /cap reached/);
assert.match(out(ledger, 'COMPARE'), /A=0 B=23/);
// Rule: no remote navigation; local back/forward preserve page identity.
const web = terminal('desktop');
assert.match(out(web, 'OPEN https://example.com'), /Local pages only/);
out(web, 'OPEN HASHCASH'); out(web, 'OPEN BMONEY');
assert.match(out(web, 'BACK'), /museum:\/\/hashcash/);
assert.match(out(web, 'FORWARD'), /museum:\/\/bmoney/);
assert.match(out(web, 'SIZE 0'), /1\.\.64/);
assert.match(out(web, 'SIZE 64'), /9\.36 seconds/);
// Playthrough: wrong disc keeps progress; chronological selection finishes.
const cd = terminal('cd'); assert.match(out(cd, 'PICK BM'), /Wrong slot/);
for (const key of ['HC', 'NAMES', 'BM']) out(cd, `PICK ${key}`);
assert.match(out(cd, 'PICK TIMESEC'), /Archive complete/);
// Playthrough: original maze has a reachable exit; walls and finished run hold.
const pocket = terminal('pocket'); const before = out(pocket, 'LOOK');
out(pocket, 'N'); assert.match(out(pocket, 'LOOK'), /1\/64/);
for (const move of 'EESSWWSS EEEENN NNEESS S S'.replace(/ /g, '')) out(pocket, move);
assert.match(out(pocket, 'LOOK'), /EXIT FOUND/);
assert.match(out(pocket, 'W'), /Run finished/);
out(pocket, 'RESET'); assert.equal(out(pocket, 'LOOK'), before);
// Contract: no gesture means no context. Trusted DIAL pools two voices and closes them on dispose.
let contexts = 0, voices = 0, stops = 0, closed = 0, gated = 0;
const param = () => ({ value: 0, cancelScheduledValues() {}, setValueAtTime() {}, setTargetAtTime() {} });
class Audio {
  constructor() { contexts++; this.currentTime = 0; }
  createGain() { return { gain: param(), connect() {}, disconnect() {} }; }
  createOscillator() { voices++; return { frequency: param(), connect() {}, disconnect() {}, start() {}, stop() { stops++; } }; }
  resume() { return Promise.resolve(); }
  close() { closed++; return Promise.resolve(); }
}
context.window.AudioContext = Audio;
BL.sound = { muted: false, output() { gated++; return {}; } };
out(web, 'DIAL'); assert.equal(contexts, 0);
context.window.navigator.userActivation.isActive = true;
BL.sound.muted = true; out(web, 'DIAL'); assert.equal(contexts, 0);
BL.sound.muted = false; out(web, 'DIAL'); out(web, 'DIAL');
assert.equal(contexts, 1); assert.equal(voices, 2); assert.equal(gated, 1);
out(web, 'HANGUP'); def.dispose(); def.dispose(); frame();
assert.equal(stops, 2); assert.equal(closed, 1);
build(); assert.equal(count(terminal('hashcash')), 0); def.dispose();
console.log('Era 4 rules/playthrough/disposal passed');
```

## Validation results

- `node --check src/js/genesis-era-4.js`: passed.
- `npm run build`: passed; the final `npm test -- genesis` also rebuilt successfully (302 scripts).
- Standalone proof above: passed, including the spend/create issuance-cap regression.
- Existing `genesisExhibitsProof`, executed unchanged in isolation: passed; registered all eight eras,
  ten props across the current base plus Era 4, `bad: []`. The full global tier also includes this proof.
- `CHROME=/usr/bin/google-chrome npm test -- genesis`: **351/352 checks passed**, exit 1, about 3 minutes.
  Sole failure: `genesis ride` — “the session passed 120 s and its Chrome was killed”.
  Ledger: streak 1, first/last `2026-10-31T22:57:00.413Z`, in `untracked/test-ledger.json`.
  No threshold changes, skipped assertions or shared-runner edits. Browser playthrough and round-trip
  validation remain unverified; the timeout does not establish its cause.
- An earlier broader `npm test -- genesis hub` was stopped after repeated hub startup/readiness
  deadlines and software-GL ReadPixels stall warnings; it is incomplete, not a pass.
  The first sandbox attempt could not bind localhost (`EPERM`); subsequent runs used approved access.
- `git diff --check`: passed. Generated HTML was rebuilt only inside this worktree, remains uncommitted,
  and is excluded from the commit. The original checkout's modified generated HTML was not touched.

No merge, deployment or upstream PR. Integrator should run the Genesis browser scene/phone checks on a
working browser setup and play-test the listed interface limitations before merging.

## Integration review (Claude Code, integrator)

This is a trail-metadata repair on `gv/era-4-exhibits`, after `9f812691`, merged with the shared
infrastructure (`gv/exhibits`). The games, their rules and the work limits are kept as written: 64 attempts a
frame, 32,768 a visit, the creation cap, 64 maze moves, and 48-character input.

- **Trail entries, from the Era 4 dossier's classes:**
  - Hashcash's 28 March 1997 announcement is **documented influence**. The evidence is Satoshi's
    announcement naming Hashcash-style proof-of-work (`E4-INFL`, now a source of that station and a line in
    its banner). The 2002 paper, reference [6], belongs to Era 5.
  - b-money is **citation [1]**.
  - The reference shelf is now two dated stops: Secure Names for Bit-Strings, April 1997, **citation [5]**
    (`e4-names`), and TIMESEC, May 1999, **citation [2]** (`e4-timesec`).
  - The desktop, modem, CD-ROM archive and pocket maze are **context**, each with a `date`.
- **Overview consolidated:** the era's own `e4-overview` station and its two big signs duplicated the
  shared signage. They are removed, and its introduction is now the page of the shared overview
  (`overview.pages`), with its summary and sources.
- **Tap boxes** cover each station's model.
- **Shared proof:** "Genesis Voyage exhibits" now requires each built era's dossier trail entries (Era 0:
  Feller [8]; Era 4: the four above), everything else in those eras as context, and no era-owned overview.
  Run against `9f812691`'s file, it fails on exactly the gaps repaired here.

Checks:
- **Unit tier:** `npm run test:unit` passes.
- **Real browser:** Chromium, WebGL2 on a software GPU.
  - The trail runs in date order: Feller, the two Fingerprints and Time links, Hashcash 1997, Secure Names
    1997, b-money 1998, TIMESEC 1999.
  - A Hashcash search finds a stamp and VERIFY is valid.
  - The b-money MISS shows disagreeing replicas.
  - Both shelf panels end with "How it connects" ([5], [2]) and their step.
  - The shared overview shows the era's page.
  - Two leave/return laps hold steady node and target counts, with a clean console.
- **Still unverified:** sound (DIAL), touch, hardware performance and human play.
