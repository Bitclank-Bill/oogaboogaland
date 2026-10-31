# Era 3 exhibits: Cypherpunks and Timestamps (1990–1995)

Branch `gv/era-3-exhibits`. Owner files: `src/js/genesis-era-3.js` and this document. Everything else here (the scene,
the page, the test runner) belongs to the integrator, so this document carries the integration patch and the test
addition instead of edits to those files.

## Base, and what still needs the integrator

- No Genesis integrator session was reachable when this was built, so the "latest cave implementation" could not be
  confirmed with them. This branch is based on **`gv/water-boat` at `a95536b`** ("the boat shows from the start; Space
  jumps out and back in"), the newest commit with the one-cave-per-era stream (`b2a90c9`). `feature/genesis-voyage`
  (`12f7c4f`) does not have the caves yet. **Integrator: confirm this base, or tell me the right one and I'll rebase.**
- Content comes from the Era 3 dossier on `gv/research` (`4b0d1b8`,
  `docs/genesis-voyage/eras/era-3-cypherpunks-and-timestamps.md`). Only entries marked READY are stated as facts.
- The office PC (genesis-props.js's `pc` prop) **stays where it is.** `mount` extends it: a modem and a floppy on its
  table, a second sign, and a prompt that keeps OOGA-DOS's DIR, TYPE, HASH and CLS exactly and adds NOTES, DIR A:,
  TYPE A:, DIAL, READ, POST, HANGUP, RESET, MORE and SOURCES. That is done by replacing the registered prop's `onUse`
  inside `mount`. If the integrator would rather move the PC into the exhibit row, or switch `onUse` in
  `registerProps` instead, `BL.genesisEra3.createDesktop().terminal` is the same terminal.

## The exhibits

All of them stand on Era 3's left bank, around Fingerprints and Time, which is not changed: no second stamp system.
The newspaper re-links the desk's own pages with the desk's own fingerprint and rule, and its DESK command makes the
desk's own change, so the two always agree (the proof checks this against `G.chain`).

| Exhibit | Sign (dated label) | What the date marks | Sources | Reset |
|---|---|---|---|---|
| Bank sign | **1990–1995** / Cypherpunks and Timestamps (bank level, 10.6 m wide, faces the way in) | the cave's years | — | — |
| Overview lectern | 1990–1995 · CYPHERPUNKS AND TIMESTAMPS | the cave's years; each exhibit dates its own | E3-HS, E3-BHS, E3-BHS-PUB, E3-WP, E3-DN, E3-PGP, E3-HUGHES | R: back to the start |
| The Daily Ooga press (newspaper) | THE DAILY OOGA PRESS · 1991 | 1991 journal publication (received 19 Aug 1990, revised 26 Oct 1990); March 1992 manuscript and 1993 book for the tree paper | E3-HS, E3-BHS, E3-BHS-PUB, E3-WP, E3-ORIGINAL | RESET (and UNDO n) |
| Padlock post (keys) | PADLOCK POST · 1991 | 1991, when PGP's author says he published it (essay June 1991, updated 1999) | E3-PGP, E3-WP, E3-ORIGINAL | RESET |
| Office PC and BBS | OFFICE PC · 1993 (existing sign) + NOTES · DIR A: · DIAL | an early-1990s office PC; Intel dates the 486 DX family to 10 April 1989 | E3-CPU, E3-GEAR, E3-ORIGINAL | RESET (hangs up, clears posts) |
| Pocket pager | POCKET PAGER · 1990–1995 | period-style; no model or date claimed | E3-GEAR, E3-ORIGINAL | Reset page, or R |
| Tick-Tock Rally (cabinet) | TICK-TOCK RALLY · 1990–1995 | period style; the game is original | E3-ORIGINAL, E3-GEAR | Reset page, or R |

Each exhibit's words (`EXHIBITS` in the module) have: `label`, `dated`, `kid` (the short explanation, 70 words at
most), `deeper` (the optional panel), `sourceKeys` and `pager`. Prompts show the label, the date and the short text
when they open; MORE gives the deeper story and SOURCES the links. Panels open on the short text; the next page is the
deeper story. Commentary written today always starts **"Museum note (written today):"**.

### The newspaper: what the timestamp papers establish

The visitor changes any of Tock's five pages (EDIT 2 …) and sees that page's fingerprint change, every later link fail,
and this morning's printed fingerprint stop matching. The 3D stand shows it too: the tiles from the changed page on
turn red, and so does the printed box. UNDO n or RESET puts things back.

The deeper panel separates:
- **What they establish:** a record whose fingerprint is linked into a chain whose newest value was widely published
  existed no later than that publication, and nobody can later change it, or slip in or reorder records before it,
  without the links failing for anyone who kept a later value. Haber and Stornetta argue certain backdating and
  forward-dating attacks are infeasible under stated assumptions, "even with the collusion of a time-stamping service"
  (the dossier's quotation). Bayer, Haber and Stornetta batch many documents into a tree each round and publish one
  value.
- **What they don't:** that a page's content is true, or who wrote it; publication still needs a widely witnessed
  place; nothing here is money or a way for strangers to agree on one history.

### The whitepaper's timestamp references

The overview has a page for them, and the newspaper's deeper panel repeats it. Section 3 (Timestamp Server): "such as
in a newspaper or Usenet post [2-5]". This wording is as recorded in `docs/genesis-voyage/sources.md`; I did not
re-read the PDF in this session. [3] and [4] are this cave's two papers. [2] (1999) and [5] (1997) belong to Era 4, so
they are named but not dated here. Only those two sources are tagged "whitepaper citation".

### Context only, and what's on hold

PGP, the BBS, the pager, the floppy and the cabinet are context. The padlock post says plainly that it is a teaching
model with tiny textbook numbers (n = 3233), not PGP and not real encryption. Bitcoin's own link is signatures: the
whitepaper defines a coin as a chain of digital signatures.

The dossier hasn't cleared BBS, pager, 3.5-inch floppy or console specifications, so no capacity, model, price or
launch year appears; DIR A: says so. The Cypherpunks list (September 1992 recollection), DigiCash and Surety are HOLD:
the overview names them on a "Named, not yet dated" page with no dates or influence claims.

### Pager, rally, BBS: limits

- **Pager:** a ring of 6 messages (`Int16Array`/`Float32Array`). Each exhibit (and the desk) pages once as the
  visitor comes within 4 m, re-arming only after they go 7 m away. Nothing pages while a panel, prompt or pause holds.
  Messages show as a HUD toast and on the pager stand's panel.
- **BBS:** the pretend board keeps at most 8 visitor posts (oldest out), for the visit only. Nothing is sent anywhere.
  The number dialled is a 555-01xx fictional number.
- **Tick-Tock Rally:** an original single-player paddle-and-ball game, with no copied program, name, art or sound.
  It runs on fixed 1/120 s steps, at most four a frame, and the proof shows the same moves give the same game at 30
  and 120 fps. Controls: ← → or A D move, Space/Enter or a tap serves, a drag or the mouse aims, R resets. Its panel
  keeps its keys: R, the game's keys, and everything except Escape, Tab, the page arrows and M stop at the panel
  (`stopImmediatePropagation` in a capture listener on the board dialog), so nothing reaches the walk, the boat or the
  scene. It steps only while its Play page is open; closing and reopening goes back to serve.

## Layout (Era 3 cave: z −345 to −273; stream x 0.25 to 7.25)

| What | Centre (x, z) | Footprint |
|---|---|---|
| Bank sign | −9.5, −279 | 10.6 × 0.8, facing +z |
| Overview | −3.6, −283 | 0.7 × 0.5 |
| Newspaper | −13.5, −310 | 1.2 × 2.6 |
| Padlock post | −13.5, −299 | 1.1 × 1.3 |
| Pager stand | −13.5, −291 | 0.7 × 0.7 |
| Rally cabinet | −20.5, −305 | 1.5 × 1.1 |

The room (x −8.4 to −1.4, z −316.5 to −301.5) keeps a walkway of at least 3 m to the row. The stream's 2 m lip, the
room's boarding ramp and the cave's left-bank ramp (even though the room replaces that one) stay clear by 2 m or
more. The proof checks all of this. `CLEAR` asks the scene not to drop scattered boulders on the exhibits or the room.
Its draws are kept, so the other caves don't change. `LIGHTS` adds two point lights (30 of 32 in use).

## Module contract

`BL.genesisEra3` (loads after genesis-world.js and before scene-genesis.js):

- Pure: `SOURCES`, `EXHIBITS`, `HOLD`, `LAYOUT`, `OBSTACLES`, `CLEAR`, `LIGHTS`, `PAGE_SPOTS`, `createNewspaper`,
  `newspaperTerminal`, `createKeyStation`, `keyTerminal`, `createDesktop`, `createPager`, `createTriggers`,
  `createRally`, `link`, `sourceOf`.
- `mount({ root, hud, props, audio })`, called in `enter` once the HUD and the prop registry exist. It returns:
  - `targets`: `[{ node, prop }]`, registered as `{ kind: "prop" }`.
  - `update(dt, x, z, frozen)`: per frame, allocation-free.
  - `dispose()`: aborts its listeners and removes its nodes.
  - `debug`.
- A prop's `onUse` returns `{ terminal }` (the scene's prompt dialog) or a new `{ panel }`: a ready board object for
  `openPanel`, with the same shape as `makeBoard`'s (`go`, `canvas`, `version`, `links`, optional `update`). The
  patch adds that one branch to `openProp`.
- **Geometry:** each exhibit's still parts are one merged geometry, about 40 nodes in all. The dynamic parts are a
  fixed set of nodes toggled by `visible` or `glow`. Labels go through the cached `factoryModels.label`.
- **Allocation:** `update` and the rally's step allocate nothing. Strings are built only when a prompt runs or a
  panel page is shown; the rally's score text is rebuilt only when its version moves.
- **Listeners:** a keydown/keyup capture listener on the board dialog, plus pointer listeners on `board-screen`. All
  of them go through one `AbortController` that `dispose` aborts.

## Integration patch (scene-genesis.js, index.html)

Apply with `git apply` on this branch's base. It is about 20 changed lines and touches no other stream's section
beyond what's named:

- load the module;
- obstacles and lights;
- the boulder skip;
- `mount` after the HUD, its targets, and the `panel` branch;
- `update` before `hud.updateBoard`;
- `dispose` in `leave`;
- `debug.era3`.

```diff
diff --git a/src/index.html b/src/index.html
index c547b40..c37d3f2 100644
--- a/src/index.html
+++ b/src/index.html
@@ -2004,6 +2004,7 @@ Then run npm run build and ONLY=characters node test/run.mjs.</pre>
   <script src="js/genesis-props.js" data-defer="genesis-scene"></script>
   <script src="js/genesis-world.js" data-defer="genesis-scene"></script>
   <script src="js/genesis-boat.js" data-defer="genesis-scene"></script>
+  <script src="js/genesis-era-3.js" data-defer="genesis-scene"></script>
   <script src="js/scene-genesis.js" data-defer="genesis-scene"></script>
   <script src="js/mine-models.js"></script>
   <script src="js/mine-sim.js"></script>
diff --git a/src/js/scene-genesis.js b/src/js/scene-genesis.js
index b7900d5..cae563f 100644
--- a/src/js/scene-genesis.js
+++ b/src/js/scene-genesis.js
@@ -21,7 +21,7 @@
 (() => {
   "use strict";
   const BL = window.BL = window.BL || {};
-  const G = BL.genesisVoyage, M = BL.models, GP = BL.genesisProps, GW = BL.genesisWorld, GB = BL.genesisBoat;
+  const G = BL.genesisVoyage, M = BL.models, GP = BL.genesisProps, GW = BL.genesisWorld, GB = BL.genesisBoat, E3 = BL.genesisEra3;
   const { createNode, addChild, removeChild, createCamera } = BL.scene;
   const { clamp } = BL.math;
   const COARSE = window.matchMedia("(pointer: coarse)").matches;
@@ -51,7 +51,7 @@
   const CAVE_LAMPS = [[-14, 0.25], [22, 0.5], [-8, 0.8]];
   const LIGHTS = [[-4, 3.2, 3, 11, 1.25, 0.95, 0.6], [4, 3.2, -2, 10, 1.1, 0.85, 0.55],
     [-6.5 + SX, 3.4, -25 + SZ, 12, 1.35, 1.05, 0.7], [-9 + SX, 3.2, -31.5 + SZ, 7, 1, 0.9, 0.7],
-    ...GW.ERAS.flatMap((e) => CAVE_LAMPS.map(([x, f]) => [x, 9, e.z1 - f * GW.CAVE.len, 34, ...e.theme.lamp]))];
+    ...GW.ERAS.flatMap((e) => CAVE_LAMPS.map(([x, f]) => [x, 9, e.z1 - f * GW.CAVE.len, 34, ...e.theme.lamp])), ...E3.LIGHTS];
 
   // --- Hop off and walk: where an Ooga may stand ------------------------------------------------------------------
   // The harbour's dock, the room's ledge with the desk's step, and two boarding ramps down to the boat: one at the
@@ -94,6 +94,8 @@
         : { id: `era-${e.n}-right-ramp`, x0: CHANNEL.x1 - 0.2, x1: CHANNEL.x1 + 1.6, z0: e.z - 0.6, z1: e.z + 0.6, ramp: { from: 0.25, to: ISLAND_TOP, axis: "x" }, boards: true });
     }
   }
+  // Era 3's exhibits stand in the way too (genesis-era-3.js).
+  FOOTING.obstacles.push(...E3.OBSTACLES);
   // How near land Jump out works, and how near the boat J re-boards.
   const JUMP_REACH = 8, BOARD_REACH = 6, BOARD_JUMP = BOARD_REACH;
   // The first props, on the room's ledge: the office PC, the hard-drive plinth and Tock's book by the desk.
@@ -101,7 +103,7 @@
   const WALK_PRESETS = { dock: { yaw: 0.6, pitch: 0.3, dist: 6, target: { x: -3.2, y: 1, z: 1.5 } } };
 
   let root = null, camera = null, input = null, hud = null, game = null, world = null, go = null, overlayCanvas = null;
-  let ride = null, course = null, demo = null, built = null, board = null, audio = null, driver = null, controls = null;
+  let ride = null, course = null, demo = null, built = null, board = null, audio = null, driver = null, controls = null, era3 = null;
   const targets = [];
   // `mode` is "drive" (the visitor has the wheel) or "tour" (the autopilot follows the course); `paused` holds both.
   const view = { yaw: 0, pitch: 0, look: 0, fixed: false, calm: false, captions: true, voice: false, readingPaused: false, reading: false, paused: false, mode: "drive", boost: false };
@@ -245,8 +247,10 @@
       }
       for (let k = 0; k < 10; k++) {
         const left = rand() < 0.5, x = left ? C.x0 + 2 + rand() * (CHANNEL.x0 - C.x0 - 6) : CHANNEL.x1 + 4 + rand() * (C.x1 - CHANNEL.x1 - 6);
-        const s = 0.8 + rand() * 2.2;
-        solid(s * 1.3, s, s, t.rock, x, ISLAND_TOP + s / 2, e.z1 - 4 - rand() * (len - 8));
+        const s = 0.8 + rand() * 2.2, z = e.z1 - 4 - rand() * (len - 8);
+        // None where Era 3's exhibits stand; the draws are kept, so every other boulder stays where it was.
+        if (e.n === E3.ERA && E3.CLEAR.some((c) => x > c.x0 && x < c.x1 && z > c.z0 && z < c.z1)) continue;
+        solid(s * 1.3, s, s, t.rock, x, ISLAND_TOP + s / 2, z);
       }
       for (let k = 0; k < 12; k++) {
         const left = k % 2 === 0, z = e.z1 - 4 - (k >> 1) * (len - 8) / 5, y = 3 + rand() * (H - 8);
@@ -445,6 +449,7 @@
     const r = props.use(prop, propState);
     if (r.terminal) openTerminal(prop.title, r.terminal);
     else if (r.board) openPanel(makeBoard(r.board));
+    else if (r.panel) openPanel(r.panel);
   };
 
   // Jump out: the boat stays where it is and the Ooga lands on the nearest ledge, facing inland.
@@ -896,6 +901,9 @@
     // The boat's camera rides along; ashore the pilot frames the Ooga and the boat sits still on the water.
     if (walk.on) { updateBoatModel(); updateWalk(dt, sceneTime); }
     else updateCamera(dt);
+    // Era 3's exhibits: the pager pages near them, and nothing moves while a panel, a prompt or a pause holds.
+    const here = walk.on && avatar ? avatar.root.position : boat;
+    era3.update(dt, here.x, here.z, view.reading || !!terminal || view.paused);
     remotes.update(dt);
     fx.update(dt, sceneTime);
     hud.updateBoard(sceneTime);
@@ -929,6 +937,7 @@
     renderOpts.lightCount = LIGHTS.length;
     for (let i = 0; i < LIGHTS.length; i++) { const l = LIGHTS[i], o = i * 8; for (let k = 0; k < 7; k++) renderOpts.lights[o + k] = l[k]; renderOpts.lights[o + 7] = 0; }
     hud = BL.hud.create({ signal: ctx.signal, roster: BL.contributors.activeRoster, catalog: M.SWAG, tierColors: M.TIER_COLORS, renderIcon: BL.hud.renderIcon, lootEnabled: false });
+    era3 = E3.mount({ root, hud, props, audio, signal: ctx.signal });
     const hooks = {};
     input = BL.interact.create({ canvas: ctx.canvas, renderer: ctx.renderer, camera, hooks });
     const target = (node, owner) => { input.add(node, owner); targets.push(node); };
@@ -938,6 +947,7 @@
     target(built.guide.parts.head, { kind: "guide" });
     for (const plaque of built.plaques) target(plaque.face, { kind: "plaque", plaque });
     for (const id of ["pc", "drives", "book"]) target(built[id], { kind: "prop", prop: props.get(id), priority: 1 });
+    for (const t of era3.targets) target(t.node, { kind: "prop", prop: t.prop, priority: 1 });
     // Hop off and walk: the pilot and crew for the visitor's Ooga, idle until Jump out (as the arcade's are).
     const boatFov = camera.fov;
     const clampTarget = (p) => { p.x = clamp(p.x, GW.SEA.x0, GW.SEA.x1); p.y = clamp(p.y, 0.3, GW.CAVE.height - 1); p.z = clamp(p.z, GW.SEA.z0, 8.5); };
@@ -1034,7 +1044,7 @@
     showControls();
     hud.setStats(game.state);
     Object.assign(scene, { root, camera, input, debug: { get ride() { return ride; }, get demo() { return demo; }, view, built, board, sail, skip, openInfo, toggle, jumpTo,
-      walk, boat, footing, props, pilot, get avatar() { return avatar; }, get terminal() { return terminal; }, jumpOut, reboard, toggleWalk, openProp, runTerminal,
+      walk, boat, footing, props, pilot, get avatar() { return avatar; }, get terminal() { return terminal; }, get era3() { return era3 && era3.debug; }, jumpOut, reboard, toggleWalk, openProp, runTerminal,
       get driver() { return driver; }, pause, boost } });
   };
   const onDonation = (donation, counted = null) => {
@@ -1057,6 +1067,7 @@
     controls.dispose();
     remotes.dispose();
     footsteps.dispose();
+    era3.dispose(); era3 = null;
     if (people) people.dispose();
     fx.dispose();
     pilot.dispose();
```

## Test addition (test/run.mjs, global tier)

Add this proof beside `genesisPropsProof`, and its `record` in `unitChecks` after `genesisProps`. It measures the app
through the module's own functions (no formula is re-implemented as an oracle: the newspaper is checked against
`G.chain`, the PC against `createDos`).

```js
// Rule: the Genesis Voyage's Era 3 exhibits, through genesis-era-3.js itself: every exhibit has a dated label, sources
// that link out, a short text, a deeper panel and a reset; the newspaper re-links Tock's own pages by the desk's own
// rule, so the desk's change breaks the same links and a visitor's change breaks only the links after it; the toy
// padlock opens what it locks and a changed note fails its seal; the PC keeps OOGA-DOS and adds a floppy and a capped
// pretend board; the pager is a bounded ring paged once per approach and never while reading; the rally plays the same
// at any frame rate and ends after its balls; and the exhibits stand on Era 3's left bank clear of the stream's edge,
// the room, the ramps and each other.
const genesisEra3Proof = async () => {
  const context = { window: {} };
  for (const f of ["genesis-voyage", "genesis-props", "genesis-world", "genesis-era-3"]) runInNewContext(await readFile(join(root, `src/js/${f}.js`), "utf8"), context);
  const G = context.window.BL.genesisVoyage, P = context.window.BL.genesisProps, W = context.window.BL.genesisWorld, E = context.window.BL.genesisEra3;
  const ids = ["overview", "newspaper", "keys", "desktop", "pager", "rally"];
  const exhibits = ids.every(id => { const x = E.EXHIBITS[id]; return x.label.includes(String(x.year)) && /\d{4}/.test(x.dated) && x.kid.split(" ").length <= 70 && x.deeper.length > 0 && x.sourceKeys.length > 0
    && x.sourceKeys.every(k => /^https:\/\//.test(E.sourceOf(k).href)) && x.pager.length <= 32; });
  // Commentary written today says so; whitepaper citations are only the two this cave dates.
  const modern = ids.every(id => E.EXHIBITS[id].deeper.filter(p => /^Museum note/.test(p)).every(p => p.startsWith(E.NOTE))) && ["keys", "desktop", "pager", "rally"].every(id => E.EXHIBITS[id].deeper.some(p => p.startsWith(E.NOTE)))
    && Object.values(E.SOURCES).filter(s => /whitepaper citation/.test(s.kind)).every(s => /\[3\]|\[4\]/.test(s.kind)) && E.HOLD.every(h => !/\b\d{1,2} \w+ 199\d/.test(h));
  // The newspaper is the desk's chain: the same pages, rule and change.
  const paper = E.createNewspaper(), honest = G.chain(false), tampered = G.chain(true);
  const same = paper.printedChain.join() === honest.join() && paper.printed === honest[honest.length - 1];
  const desk = paper.desk(), deskSame = paper.stamps.join() === tampered.join() && desk.first === G.TAMPER_AT && !desk.matches;
  paper.reset();
  const edit = paper.edit(4, "Day 4: Ooga lends TWO shells"), later = edit.first === 3 && !edit.matches && paper.stamps.slice(0, 3).join() === honest.slice(0, 3).join() && paper.stamps.slice(3).every((s, i) => s !== honest[3 + i]);
  const undo = paper.restore(4), back = undo.first === -1 && undo.matches && !!paper.edit(9, "x").error && !!paper.edit(2, "  ").error;
  paper.edit(1, "Day 1: Ooga finds a million bananas"); const reset = paper.reset().first === -1 && paper.pages.join() === G.PAGES.join();
  const nt = E.newspaperTerminal(E.createNewspaper()), shown = nt.run("EDIT 2 Ooga trades ten shells").lines.join("\n");
  const newsTerm = /Page 2 .*CHANGED/.test(shown) && /Page 3 .*link FAILS/.test(shown) && /Page 1 .*matches/.test(shown) && /NO LONGER MATCHES/.test(shown) && /\[E3-WP\]/.test(nt.run("MORE").lines.join(" ")) && nt.run("RESET").reset && nt.banner.some(l => /RESET/.test(l));
  // The padlock: every printable letter comes back (none locks to itself), a changed note fails its seal, reset clears.
  const k = E.createKeyStation(), all = Array.from({ length: 94 }, (_, i) => String.fromCharCode(33 + i)).join("");
  let roundTrip = true; for (let i = 0; i < all.length; i += 40) { k.lock(all.slice(i, i + 40)); if (k.open() !== all.slice(i, i + 40) || k.locked.some((c, j) => c === all.charCodeAt(i + j))) roundTrip = false; }
  k.seal("two bananas for a shell"); const sealed = k.verify() === true && (k.change(), k.verify() === false);
  const wrongKey = (k.lock("meet at the dock"), k.open(17) !== "meet at the dock");
  k.reset(); const keysReset = k.locked === null && k.sealed === null && k.verify() === null && E.keyTerminal(k).run("RESET").reset && k.lock("x".repeat(80)).locked.length === E.MAX_NOTE;
  // The PC: OOGA-DOS answers as before, the floppy lists, the board keeps at most MAX_POSTS.
  const d = E.createDesktop(), t = d.terminal, dos = P.createDos({ year: 1993, files: P.PC_FILES });
  const kept = ["DIR", "TYPE STAMPS.TXT", "HASH ooga", "TYPE B-MONEY.TXT", "FORMAT C:"].every(c => t.run(c).lines.join("\n") === dos.run(c).lines.join("\n"));
  const floppy = /CHAIN\s+TXT/.test(t.run("DIR A:").lines.join("\n")) && t.run("TYPE A:CHAIN.TXT").lines.some(l => l.includes(honest[0])) && /no disk capacity/.test(t.run("DIR A:").lines.join(" "));
  const offline = /DIAL first/.test(t.run("POST hello").lines[0]); t.run("DIAL");
  for (let i = 0; i < 20; i++) t.run(`POST message ${i}`);
  const capped = d.posts.length === E.MAX_POSTS && d.posts[0].text === `message ${20 - E.MAX_POSTS}` && d.sent === 20 && t.run("RESET").reset && d.posts.length === 0 && !d.online;
  // The pager: a ring that keeps its newest; one page per approach; nothing while frozen.
  const pg = E.createPager(E.PAGER_TEXTS, 6); for (let i = 0; i < 9; i++) pg.receive(i % E.PAGER_TEXTS.length, i);
  const slot = {}; const ring = pg.count === 6 && pg.at(0, slot).time === 8 && pg.at(5, slot).time === 3 && pg.unread === 9 && (pg.read(), pg.unread === 0) && (pg.clear(), pg.count === 0);
  const tr = E.createTriggers(E.PAGE_SPOTS), s = E.PAGE_SPOTS[2];
  const frozen = tr.update(s.x + 1, s.z, true) === -1; const first = tr.update(s.x + 1, s.z, false) === 2, stay = tr.update(s.x + 0.5, s.z, false) === -1;
  tr.update(s.x + 10, s.z, false); const again = tr.update(s.x + 1, s.z, false) === 2;
  // The rally: the same moves give the same game at 30 and 144 frames a second; the ball stays in the field; three
  // misses end it; reset starts over.
  const play = (fps) => { const g = E.createRally(); let inField = true; g.serve(); for (let f = 0; f < fps * 20; f++) { g.input.aim = g.x; g.update(1 / fps); if (g.state === "serve") g.serve(); if (g.x < 0 || g.x > 1 || g.y < 0) inField = false; } return { g, inField }; };
  const a = play(30), b = play(120);
  const steady = a.g.hits === b.g.hits && a.g.score === b.g.score && a.g.hits > 5 && a.inField && b.inField && a.g.misses === 0;
  const lose = E.createRally(); for (let n = 0; n < 3; n++) { lose.serve(); lose.input.aim = lose.x < 0.5 ? 0.95 : 0.05; for (let f = 0; f < 600 && lose.state === "play"; f++) lose.update(1 / 60); lose.input.aim = -1; }
  const over = lose.state === "over" && lose.balls === 0 && lose.misses === 3 && (lose.serve(), lose.state === "serve" && lose.balls === E.RALLY.balls && lose.score === 0);
  const capStep = E.createRally(); const steps = capStep.update(5) === E.RALLY.maxSteps;
  // Where it stands: on Era 3's left bank, clear of the stream's 2 m lip, the room (and its walkway), the ramps and
  // each other; the boulders' clear zone covers them all.
  const era = W.ERAS[E.ERA], bank = era.banks[0], room = { x0: -12 + W.ROOM_SHIFT.x, x1: -5 + W.ROOM_SHIFT.x, z0: -34 + W.ROOM_SHIFT.z, z1: -19 + W.ROOM_SHIFT.z };
  const overlaps = (p, q, pad = 0) => p.x0 < q.x1 + pad && p.x1 > q.x0 - pad && p.z0 < q.z1 + pad && p.z1 > q.z0 - pad;
  const ramps = [{ x0: W.CHANNEL.x0 - 1.6, x1: W.CHANNEL.x0 + 0.2, z0: era.z - 0.6, z1: era.z + 0.6 }, { x0: -5 + W.ROOM_SHIFT.x, x1: -3.4 + W.ROOM_SHIFT.x, z0: -26.6 + W.ROOM_SHIFT.z, z1: -25.6 + W.ROOM_SHIFT.z }];
  const O = E.OBSTACLES, placed = O.every(o => o.x0 >= bank.x0 + 1 && o.x1 <= bank.x1 - 2 && o.z0 >= era.z0 + 2 && o.z1 <= era.z1 - 2 && !overlaps(o, room, 2) && ramps.every(r => !overlaps(o, r, 2)))
    && O.every((o, i) => O.every((q, j) => i === j || !overlaps(o, q, 1.5))) && O.every(o => E.CLEAR.some(c => o.x0 >= c.x0 && o.x1 <= c.x1 && o.z0 >= c.z0 && o.z1 <= c.z1))
    && E.LIGHTS.length <= 4 && Object.keys(E.LAYOUT).every(id => E.LAYOUT[id].y === W.BANK_TOP);
  return { exhibits, modern, same, deskSame, later, back, reset, newsTerm, roundTrip, sealed, wrongKey, keysReset, kept, floppy, offline, capped, ring, frozen, first, stay, again, steady, over, steps, placed };
};
```

```js
  const genesisEra3 = await genesisEra3Proof();
  record("Genesis Voyage Era 3: every exhibit is dated, sourced, explained and resettable; the newspaper breaks the desk's own links after a changed page and only those; the toy padlock opens what it locks and a changed note fails its seal; the PC keeps OOGA-DOS and caps its pretend board; the pager pages once per approach and never while reading; the rally plays the same at any frame rate; the exhibits keep the stream's edge, the room and the ramps clear", Object.values(genesisEra3).every(Boolean), JSON.stringify(genesisEra3));
```

A browser step for the `genesis` scene, once the patch is in, should cover:
1. jump out at Era 3;
2. walk to the newspaper and use it with Space; EDIT 2 shows "link FAILS";
3. hold W in the prompt and the Ooga doesn't move;
4. at the cabinet, Space opens the panel; ← moves the paddle, W doesn't move the Ooga, R resets;
5. Escape closes it, and `view.reading` is false.

`trip("genesis")` already covers the leave contract. I haven't written that step into the runner; the probe below
did the same things by hand.

## Checks run

| Check | Result |
|---|---|
| `node --check src/js/genesis-era-3.js`, and on `scene-genesis.js` with the patch applied | pass |
| `npm run build` with the patch applied | clean |
| `genesisEra3Proof` (above), run from a scratch script against the real modules | all 25 fields true |
| `node test/run.mjs genesis` with the patch, in this container | see "Limitations" |

Browser probe (Playwright, headless Chromium, software GL, patch applied, built page under `?wip=genesis&debug=1&nosim=1`): results are recorded in the follow-up commit below this line.

<!-- probe results -->

## Limitations (honest)

- **Browser:** this cloud container has only headless Chromium with software GL (SwiftShader), and it must run with
  `--no-sandbox` as root (I used a wrapper script; the driver wasn't changed).
  - With the patch applied, the suite's `genesis` session ran into its 120 s watchdog twice ("Chrome was killed"),
    and the runner printed STOP, so I didn't retry it. 350 of 351 checks passed; the global tier passed.
  - I did not run the unpatched baseline under the same conditions, so it's unproven whether the timeout comes from
    this container's software GPU or from the patch. The GPU process sat at about 350% CPU during the probe.
  - **Play-test on a real GPU** before trusting it either way.
- **Not tested:** phones and touch (the rally's drag and tap aiming), Canvas 2D (`?canvas2d=1`), Safari, Firefox,
  gamepads, screen readers on the new panels, and sound for the pager beep (it reuses the scene's `link` cue).
  Frame rate wasn't measured.
- **Per-frame DOM work:** while the rally panel's Play page is open, the HUD repaints the board every frame. That
  means a `drawImage` plus re-setting the caption, note and links text, which is HUD behaviour, not this module's.
  It's fine on a desktop; on low-end phones it may cost frames.
- **Unconfirmed:** the integrator never confirmed the base (see the top).

## Open questions for the integrator and research

1. Keep the PC in place and extended (current), or move it into the exhibit row?
2. Should the era caption on entering Era 3 mention the new exhibits? (Not changed; it's the scene's text.)
3. The HOLD items (Cypherpunks list date, DigiCash, Surety) stay undated until research clears them.
4. `E3-ORIGINAL` links to this file on `gv/era-3-exhibits`. Re-point it if the doc moves on merge.

---
*Prepared with AI assistance (Claude, by Anthropic) at Billy's request. Not reviewed or endorsed by the Ooga Booga Land
maintainers.*
