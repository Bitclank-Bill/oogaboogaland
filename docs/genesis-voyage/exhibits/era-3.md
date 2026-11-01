# Era 3 exhibits: Cypherpunks and Timestamps (1990–1995)

Branch `gv/era-3-exhibits`. The era builder owns `src/js/genesis-era-3.js` and this file. Everything shared belongs to
the Genesis integrator: `scene-genesis.js`, `genesis-exhibits.js`, the page, the styles and `test/run.mjs`. Era 3 now
plugs in through the shared exhibit kit (`docs/genesis-voyage/EXHIBIT-CONTRACT.md` on `gv/exhibits`):

```js
BL.genesisExhibits.register(3, { sources, overview, build(kit), update, dispose })
```

The earlier `mount(host)` module and its manual scene and page patch are gone. The kit's loader, `src/index.html`'s
script tag and the shared signage already build this cave. The requested hooks below are small, optional, and the
cave works without them.

## What changed in the adaptation

**Removed:**
- The bank-level "1990–1995" sign and the overview lectern. The shared years sign, pylons and overview board do this
  job, and this module now supplies only `overview.summary` and three pages.
- The extension of the office PC. The module no longer replaces the shared `pc` prop's `onUse`; hook request 1
  below is the smallest way to give that prompt the floppy and BBS commands.
- Its own point lights, the boulder clear zone and the integration patch for `scene-genesis.js` and `index.html`.

**Kept or adapted:**
- **Fingerprints and Time is untouched**, including its desk, lectern, book and PC. Its lectern's two trail stops, [3]
  and [4], stay the only Era 3 stops, and no exhibit here duplicates them.
- **The press** still re-links Tock's own pages with the desk's own fingerprint and rule (`G.chain`). No second stamp
  system was added.
- **The padlock post, the pager and Tick-Tock Rally** are kept.
- **The dial-up corner** is new: its own terminal, holding the BBS and floppy that used to ride on the PC.

## The exhibits

All five stand on Era 3's left bank, west of Fingerprints and Time. Each is a **terminal**, the kit's `{ terminal }`
result: typing stays in the prompt's field, and the scene holds the walk while a prompt is open. Each prompt shows its
dated label, the date's meaning and a short explanation when it opens. MORE gives the deeper story, SOURCES the links,
and RESET (CLEAR on the pager) starts that exhibit again.

| Prop id | Sign (dated label) | `date` (what it marks) | `connection` | Sources | Dossier entry |
|---|---|---|---|---|---|
| `e3-press` | THE DAILY OOGA PRESS · 1991 | 1991 journal publication of Haber and Stornetta (received 19 Aug 1990); March 1992 manuscript and 1993 chapter of Bayer, Haber and Stornetta | none: it **demonstrates** the room's two trail stops (`demonstrates: ["era3-room-haber1991", "era3-room-bayer1993"]`). See request 4 | E3-HS, E3-BHS, E3-BHS-PUB, whitepaper, E3-ORIGINAL | Timestamp a page; One tree, many pages (READY) |
| `e3-padlock` | PADLOCK POST · 1991 | 1991, when PGP's author says he published it (essay June 1991, updated 1999); the padlock is a teaching model | context | E3-PGP, whitepaper, E3-ORIGINAL | Private messages on ordinary computers (READY, context) |
| `e3-bbs` | DIAL-UP CORNER · 1990–1995 | period style; no model, date or specification claimed | context | E3-GEAR, E3-ORIGINAL | Period gear: BBS and floppy deferred, so no specifications are given |
| `e3-pager` | POCKET PAGER · 1990–1995 | period style; no model, date or specification claimed | context | E3-GEAR, E3-ORIGINAL | Period gear: pager deferred, so no specifications are given |
| `e3-rally` | TICK-TOCK RALLY · 1990–1995 | period style; the game is original to the voyage | context | E3-ORIGINAL, E3-GEAR | An original mini-game (the dossier's Easter eggs) |

What each exhibit does:

- **Press:** EDIT 2 … changes a page, and the prompt shows that page CHANGED, every later link FAILS, and the printed
  fingerprint NO LONGER MATCHES. On the stand, the tiles from the changed page on and the printed box turn red. DESK
  makes the desk's own change. UNDO n and RESET put pages back.
  - MORE says precisely what the papers establish: existence no later than a widely witnessed publication, and that
    no change, insertion or reordering goes unnoticed by whoever kept a later value. It also says what they don't
    establish: truth, authorship, a way for strangers to agree on one history, or money.
  - MORE also gives the whitepaper's section 3 timestamp references, "[2-5]": [3] and [4] are this cave's, their
    stops are at the lectern, and [2] and [5] are Era 4's.
- **Padlock post:** textbook RSA with n = 3233, labelled a teaching model and not real encryption or PGP. Commands:
  KEYS, LOCK, PEEK, OPEN, SIGN, CHECK, CHANGE, RESET. The padlock model's shackle shuts while a note is locked.
- **Dial-up corner:** NOTES (museum notes), DIR A: and TYPE A: (a pretend floppy, with no capacity claimed), and
  DIAL, READ, POST and HANGUP for the pretend board. The board keeps at most 8 visitor posts, for the visit only, and
  nothing leaves the page. The number dialled is a fictional 555-01xx.
- **Pager:** a ring of 6 messages. Each of the cave's seven spots (the overview board, the desk and the five
  exhibits) pages once as the visitor comes within 4 m, and again only after they've been 7 m away. The newest
  message and the unread count show on the stand's display board (a canvas screen), and READ and CLEAR are at its
  prompt.
- **Tick-Tock Rally:** an original single-player paddle-and-ball game, with no copied program, name, art or sound.
  - At its prompt it plays **a tick at a time**: S serves, and each L, R or W (A, D, .) advances 0.25 s with the
    paddle held that way, up to 8 a line. The field is drawn in text after every line.
  - The cabinet's screen (a canvas, repainted 20 times a second) shows a self-playing demo, or the visitor's own game
    for 30 s after their last move.
  - The rules run on fixed 1/120 s steps and play the same at any frame rate. Real-time play needs hook request 3.

The overview (`overview`):
- **Summary:** 238 of the 280 characters allowed.
- **"What to try":** the five stations and RESET.
- **"In the whitepaper":** §3's "[2-5]"; [3] and [4] here, [2] and [5] in Era 4.
- **"Context, and on hold":** Dwork–Naor, PGP and Hughes as context. The HOLD items (the Cypherpunks list, DigiCash,
  Surety) are named only, with no dates claimed.

Words: only the Era 3 dossier's READY entries are stated as facts. Commentary written today starts **"Museum note
(written today):"**. The quotations are the dossier's own (at most 15 words each). The pager, BBS, floppy and cabinet
carry no unsupported specifications.

## Layout (Era 3 cave: z −345 to −273; stream x 0.25 to 7.25; left bank x −34 to 0.25)

Everything faces the stream (+x). `at` is the walk-up point in front of each exhibit, and the tap box (`pick` with `x`
and `z`) sits on the model itself. Every model stands on a `kit.obstacle`.

| Prop | Centre (x, z) | Obstacle (x by z) | Use point (x, z) | Tallest part |
|---|---|---|---|---|
| `e3-press` | −13.5, −310 | 1.2 × 2.6 | −12.1, −310 | sign top ≈ 3.7 m |
| `e3-padlock` | −13.5, −299 | 1.1 × 1.3 | −12.2, −299 | sign ≈ 2.4 m |
| `e3-pager` | −13.5, −320 | 0.8 × 1.0 | −12.4, −320 | sign ≈ 2.6 m |
| `e3-rally` | −20.5, −305 | 1.5 × 1.1 | −19.0, −305 | sign ≈ 2.9 m |
| `e3-bbs` | −20.5, −296 | 0.9 × 1.5 | −19.3, −296 | sign ≈ 2.3 m |

**Plots:**
- Everything stays out of `reservedZones(3)`: the gateway (u < 10), both docks, the three lamp squares (one at
  (−14, −291)) and Fingerprints and Time's room and margin (which ends at x −9.9).
- The stream's 1.5 m walk is kept clear.
- Nothing is near the 8 m height limit.

**Walks:**
- 3 m between the front row and the room's margin, and about 5.6 m between the two rows.
- Obstacles keep at least 2.5 m apart.
- No point lights are added.

## Requested shared hooks (for the integrator; nothing here edits shared files)

All are optional, and the cave already works without them. The patch below shows requests 1 and 2 as the smallest
edits to `scene-genesis.js`. I wrote it, checked it with `node --check`, then reverted it; it is **not committed**.

1. **The office PC's hand-on (four lines).** Wrap the PC's terminal so a line it doesn't know can go to Era 3 first:
   `run: (line) => (BL.genesisEra3 && BL.genesisEra3.pcRun(line)) || dos.run(line)`.
   - `pcRun` answers only NOTES, DIR A:, TYPE A:, DIAL, READ, POST and HANGUP. It returns `null` for everything else,
     including HELP, MORE, SOURCES and RESET.
   - So DIR, TYPE, HASH and CLS stay the PC's own, and the PC shares the dial-up corner's board for the visit.
2. **`kit.notify(text)` and `state.reading`.**
   - `notify` toasts an exhibit's message once the HUD exists (the kit is built before it). The pager already calls
     it, with precomputed strings, when it is given.
   - `reading: view.reading || !!terminal` in the update state lets the pager hold while a panel or prompt is open.
     Without it, nothing pages while reading anyway, because the Ooga can't move then; but the scene doesn't say so.
3. **A live panel result (larger; only if wanted).** For real-time Tick-Tock Rally: `onUse` returning
   `{ panel }`, a board object with `update(elapsed)`, which the HUD already calls each frame, and the scene opening it
   through `openPanel`. Keys would be captured on `#board-modal` (`stopImmediatePropagation`) so they can't reach the
   walk. The earlier branch had this working (see fbe8da4); until it exists, the rally is played a tick at a time at
   its prompt.
4. **Metadata for a demonstration.** The press demonstrates the room's two trail stops, so I gave it no
   `connection`. "citation" would duplicate the trail stops, and "context" would be inaccurate. Instead it carries
   `demonstrates: [ids]`, which the kit currently ignores. Please decide whether the kit should know this kind, or
   whether the press should carry `"context"`. Its prompt's MORE already explains the link.

```diff
diff --git a/src/js/scene-genesis.js b/src/js/scene-genesis.js
index 3a54496..39c1e78 100644
--- a/src/js/scene-genesis.js
+++ b/src/js/scene-genesis.js
@@ -423,6 +423,8 @@
       const era = GW.ERAS[n];
       const kit = {
         era, top: ISLAND_TOP, channel: CHANNEL, M, createNode, addChild, place, solid, label,
+        // A short notice from an exhibit's update (a toast once the HUD is up; the kit is built before it).
+        notify: (text) => { if (hud) hud.toast(text); },
         sign: (title, sub, x, y, z, yaw = 0, height = 0.6) => {
           const l = label(title, sub, { height, style: "plain" }), node = place(createNode({ position: { x, y, z }, rotation: { x: 0, y: yaw, z: 0 } }));
           addChild(node, createNode({ geometry: l.back }), createNode({ geometry: l.face }));
@@ -459,13 +461,13 @@
     built.trail = EX.trailOf(built.exhibitProps);
   };
   // Each frame, the exhibits of the cave the visitor is in (aboard or ashore) may move; nothing else runs.
-  const exhibitState = { era: -1, walking: false, x: 0, z: 0 };
+  const exhibitState = { era: -1, walking: false, reading: false, x: 0, z: 0 };
   const updateExhibits = (dt, elapsed) => {
     const EX = BL.genesisExhibits;
     if (!EX) return;
     const p = walk.on && avatar ? avatar.root.position : boat, era = GW.eraAt(p.x, p.z), def = era >= 0 ? EX.eras[era] : null;
     if (!def || !def.update) return;
-    exhibitState.era = era; exhibitState.walking = walk.on; exhibitState.x = p.x; exhibitState.z = p.z;
+    exhibitState.era = era; exhibitState.walking = walk.on; exhibitState.reading = view.reading || !!terminal; exhibitState.x = p.x; exhibitState.z = p.z;
     def.update(dt, elapsed, exhibitState);
   };
   const disposeExhibits = () => {
@@ -600,7 +602,8 @@
     props = GP.createRegistry();
     const dos = GP.createDos({ year: 1993, files: GP.PC_FILES });
     props.register({ id: "pc", era: 3, year: 1993, title: "Tock's office PC", label: "OFFICE PC · 1993", sourceKeys: ["merkle1980", "haber1991", "bayer1993"], at: PROPS.pc,
-      onUse: () => ({ terminal: dos }) });
+      // An era file may answer commands the PC doesn't know (Era 3's floppy and pretend BBS); DIR, TYPE and HASH stay its own.
+      onUse: () => ({ terminal: { banner: dos.banner, prompt: dos.prompt, run: (line) => (BL.genesisEra3 && BL.genesisEra3.pcRun(line)) || dos.run(line) } }) });
     // TODO: moves to Era 0's cave (1956) when its exhibits are built; it stands here until then.
     props.register({ id: "drives", era: 0, year: 1956, title: "Hard drives, 1956 and 2019", label: "HARD DRIVES · 1956 AND 2019", sourceKeys: GP.DRIVES.old.sourceKeys.concat(GP.DRIVES.now.sourceKeys), at: PROPS.drives,
       onUse: () => ({ board: { room: "Hard drives: 1956 and 2019", pages: GP.drivePages(), sources: GP.DRIVES.old.sourceKeys.concat(GP.DRIVES.now.sourceKeys) } }) });
```

## Rule proof (for `test/run.mjs`, unit tier)

The integrator owns the runner, so this proof is documented here instead of added to it. It measures the module and
the kit through their own functions: the press against `G.chain`, and placement against `reservedZones`. I ran it
from a scratch script against the real files; all 31 fields were true.

```js
// Rule: the Genesis Voyage's Era 3 exhibits, through genesis-era-3.js and the kit itself: it registers through the kit
// with an overview within the contract and no sign or overview of its own; every exhibit has an e3- id, a dated label,
// a `date`, sources that resolve, a short text, a deeper story and a reset at its prompt, and adds no trail stop (the
// room's [3] and [4] stay the only ones); its prompts are terminals, so typing stays out of the walk; the press re-links
// the desk's own pages by the desk's own rule, so the desk's change breaks the same links and a visitor's change breaks
// only the links after it; the toy padlock opens what it locks and a changed note fails its seal; the dial-up corner
// caps its board and answers nothing it doesn't know (for the PC's hand-on); the pager is a bounded ring paged once
// per approach; the rally plays the same at any frame rate, ends after its balls and plays a tick at a time at its
// prompt; and every model, obstacle, tap box and use point stands on Era 3's left bank, clear of the reserved plots,
// the stream's walk and each other, with an obstacle under every exhibit and nothing taller than the limit.
const genesisEra3Proof = async () => {
  const context = { window: {} };
  for (const f of ["genesis-voyage", "genesis-world", "genesis-props", "genesis-exhibits", "genesis-era-3"]) runInNewContext(await readFile(join(root, `src/js/${f}.js`), "utf8"), context);
  const BLc = context.window.BL, G = BLc.genesisVoyage, P = BLc.genesisProps, W = BLc.genesisWorld, EX = BLc.genesisExhibits, E = BLc.genesisEra3, def = EX.eras[3];
  const era = W.ERAS[3], bank = era.banks[0], reserved = W.reservedZones(3);
  const solids = [], obstacles = [], signs = [], props = [], node = () => ({ position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 }, children: [] });
  const kit = { era, top: W.BANK_TOP, channel: W.CHANNEL, M: { box: () => ({}) }, createNode: (o = {}) => Object.assign(node(), o, { children: [] }), addChild: () => {}, place: (n) => n,
    label: () => ({ face: {}, back: {}, width: 1, height: 1 }),
    solid: (w, h, d, c, x, y, z) => { solids.push({ x0: x - w / 2, x1: x + w / 2, z0: z - d / 2, z1: z + d / 2, top: y + h / 2 }); return node(); },
    sign: (t, sub, x, y, z) => { signs.push({ t, x, y, z }); return node(); },
    obstacle: (x0, x1, z0, z1) => { obstacles.push({ x0, x1, z0, z1 }); },
    prop: (d) => { if (EX.checkProp(3, d)) throw new Error(EX.checkProp(3, d)); props.push(d); return { ...d, era: 3 }; } };
  def.build(kit);
  const registered = typeof def.update === "function" && typeof def.dispose === "function" && def.overview.summary.length <= 280 && def.overview.pages.length <= 3
    && def.overview.sourceKeys.every(k => /^https:\/\//.test(P.sourceOf(k).href)) && !signs.some(s => /^(ERA 3|1990–1995)$/.test(s.t)) && !props.some(p => /overview/.test(p.id));
  const exhibits = props.length === 5 && props.every(p => /^e3-/.test(p.id) && p.label.includes(String(p.year)) && typeof p.date === "string" && /\d{4}/.test(p.date) && p.sourceKeys.length && p.sourceKeys.every(k => /^https:\/\//.test(P.sourceOf(k).href)))
    && Object.values(E.EXHIBITS).filter(x => x.kid).every(x => x.kid.split(" ").length <= 70 && x.deeper.length > 0 && x.pager.length <= 32);
  // The trail: none of these is a stop; the press names the room's stops it demonstrates.
  const trail = props.every(p => !p.connection || !EX.CONNECTIONS[p.connection].trail) && props.filter(p => p.connection === "context").length === 4 && props.find(p => p.id === "e3-press").demonstrates.join() === "era3-room-haber1991,era3-room-bayer1993";
  // Every prompt: a terminal with a banner naming its label, HELP, MORE, SOURCES and RESET.
  const terms = props.map(p => p.onUse({}).terminal);
  const prompts = terms.every((t, i) => t && t.banner.some(l => l.includes(props[i].label)) && t.run("HELP").lines.length > 0 && t.run("MORE").lines.length > 0 && t.run("SOURCES").lines.every(l => /https:\/\//.test(l)) && t.run("RESET").reset);
  const modern = Object.values(E.EXHIBITS).filter(x => x.deeper).every(x => x.deeper.filter(p => /^Museum note/.test(p)).every(p => p.startsWith(E.NOTE))) && ["keys", "bbs", "pager", "rally"].every(id => E.EXHIBITS[id].deeper.some(p => p.startsWith(E.NOTE)))
    && Object.values(E.sources).filter(s => s.kind === "whitepaper citation").length === 3 && E.HOLD.every(h => !/\b\d{1,2} \w+ 199\d/.test(h));
  // The press is the desk's chain: the same pages, rule and change.
  const paper = E.createNewspaper(), honest = G.chain(false), tampered = G.chain(true);
  const same = paper.printedChain.join() === honest.join() && paper.printed === honest[honest.length - 1];
  const desk = paper.desk(), deskSame = paper.stamps.join() === tampered.join() && desk.first === G.TAMPER_AT && !desk.matches && paper.result === desk;
  paper.reset();
  const edit = paper.edit(4, "Day 4: Ooga lends TWO shells"), later = edit.first === 3 && !edit.matches && paper.stamps.slice(0, 3).join() === honest.slice(0, 3).join() && paper.stamps.slice(3).every((s, i) => s !== honest[3 + i]);
  const undo = paper.restore(4), back = undo.first === -1 && undo.matches && !!paper.edit(9, "x").error && !!paper.edit(2, "  ").error;
  const nt = E.newspaperTerminal(E.createNewspaper()), shown = nt.run("EDIT 2 Ooga trades ten shells").lines.join("\n");
  const press = /Page 2 .*CHANGED/.test(shown) && /Page 3 .*link FAILS/.test(shown) && /Page 1 .*matches/.test(shown) && /NO LONGER MATCHES/.test(shown) && /\[whitepaper\]/.test(nt.run("MORE").lines.join(" "));
  // The padlock: every printable letter comes back (none locks to itself), a changed note fails its seal, reset clears.
  const k = E.createKeyStation(), all = Array.from({ length: 94 }, (_, i) => String.fromCharCode(33 + i)).join("");
  let roundTrip = true; for (let i = 0; i < all.length; i += 40) { k.lock(all.slice(i, i + 40)); if (k.open() !== all.slice(i, i + 40) || k.locked.some((c, j) => c === all.charCodeAt(i + j))) roundTrip = false; }
  k.seal("two bananas for a shell"); const sealed = k.verify() === true && (k.change(), k.verify() === false);
  const wrongKey = (k.lock("meet at the dock"), k.open(17) !== "meet at the dock");
  k.reset(); const keysReset = k.locked === null && k.sealed === null && k.verify() === null && k.lock("x".repeat(80)).locked.length === E.MAX_NOTE;
  // The dial-up corner: its floppy and board, capped; unknown commands are left for the PC.
  const b = E.createBbs(), t = b.terminal;
  const floppy = /CHAIN\s+TXT/.test(t.run("DIR A:").lines.join("\n")) && t.run("TYPE A:CHAIN.TXT").lines.some(l => l.includes(honest[0])) && /no disk capacity/.test(t.run("DIR A:").lines.join(" "));
  const offline = /DIAL first/.test(t.run("POST hello").lines[0]); t.run("DIAL");
  for (let i = 0; i < 20; i++) t.run(`POST message ${i}`);
  const capped = b.posts.length === E.MAX_POSTS && b.posts[0].text === `message ${20 - E.MAX_POSTS}` && b.sent === 20 && t.run("RESET").reset && b.posts.length === 0 && !b.online
    && b.run("DIR") === null && b.run("HASH ooga") === null && /Unknown/.test(t.run("FORMAT C:").lines[0]) && E.pcRun("DIAL") !== null && E.pcRun("HELP") === null && E.pcRun("DIR") === null && E.pcRun("RESET") === null;
  // The pager: a ring that keeps its newest; one page per approach; nothing while frozen; CLEAR re-arms.
  const pg = E.createPager(E.PAGER_TEXTS, 6); for (let i = 0; i < 9; i++) pg.receive(i % E.PAGER_TEXTS.length, i);
  const slot = {}; const ring = pg.count === 6 && pg.at(0, slot).time === 8 && pg.at(5, slot).time === 3 && pg.unread === 9 && (pg.read(), pg.unread === 0) && (pg.clear(), pg.count === 0);
  const tr = E.createTriggers(E.PAGE_SPOTS), s = E.PAGE_SPOTS.find(p => p.id === "newspaper"), si = E.PAGE_SPOTS.indexOf(s);
  const frozen = tr.update(s.x + 1, s.z, true) === -1; const first = tr.update(s.x + 1, s.z, false) === si, stay = tr.update(s.x + 0.5, s.z, false) === -1;
  tr.update(s.x + 10, s.z, false); const again = tr.update(s.x + 1, s.z, false) === si;
  const spaced = E.PAGE_SPOTS.every((a, i) => E.PAGE_SPOTS.every((c, j) => i === j || Math.hypot(a.x - c.x, a.z - c.z) > 7));
  // The rally: the same moves give the same game at 30 and 120 fps; three misses end it; a tick at its prompt.
  const play = (fps) => { const g = E.createRally(); let inField = true; g.serve(); for (let f = 0; f < fps * 20; f++) { g.input.aim = g.x; g.update(1 / fps); if (g.state === "serve") g.serve(); if (g.x < 0 || g.x > 1 || g.y < 0) inField = false; } return { g, inField }; };
  const a = play(30), c = play(120);
  const steady = a.g.hits === c.g.hits && a.g.score === c.g.score && a.g.hits > 5 && a.inField && c.inField && a.g.misses === 0;
  const lose = E.createRally(); for (let n = 0; n < 3; n++) { lose.serve(); lose.input.aim = lose.x < 0.5 ? 0.95 : 0.05; for (let f = 0; f < 600 && lose.state === "play"; f++) lose.update(1 / 60); lose.input.aim = -1; }
  const over = lose.state === "over" && lose.balls === 0 && lose.misses === 3 && (lose.serve(), lose.state === "serve" && lose.balls === E.RALLY.balls && lose.score === 0);
  const capStep = E.createRally().update(5) === E.RALLY.maxSteps;
  const rg = E.createRally(), rt = E.rallyTerminal(rg, () => {}), p0 = rg.paddle;
  rt.run("S"); rt.run("LLLL"); const moved = rg.paddle < p0 && rg.state === "play" && Math.abs(rg.time - 5 * E.TICK) < 1e-6;
  rt.run("W".repeat(40)); const capTicks = Math.abs(rg.time - (5 + E.MAX_TICKS) * E.TICK) < 1e-6 && rt.run("RESET").reset && rg.state === "serve" && rg.score === 0;
  // Where it stands: on Era 3's left bank, clear of every reserved plot, the stream's walk and each other.
  const inBank = (b2) => b2.x0 >= bank.x0 + 1 && b2.x1 <= W.CHANNEL.x0 - W.BANK.FRONT && b2.z0 >= era.z0 + 1 && b2.z1 <= era.z1 - 1;
  const clash = (b2, pad = 0) => reserved.some(r => b2.x0 < r.x1 + pad && b2.x1 > r.x0 - pad && b2.z0 < r.z1 + pad && b2.z1 > r.z0 - pad);
  const overlaps = (p1, q, pad = 0) => p1.x0 < q.x1 + pad && p1.x1 > q.x0 - pad && p1.z0 < q.z1 + pad && p1.z1 > q.z0 - pad;
  const placed = solids.every(b2 => inBank(b2) && !clash(b2) && b2.top <= W.BANK_TOP + W.BANK.MAX_H && obstacles.some(o => overlaps(b2, o) && b2.x0 >= o.x0 - 1e-9 && b2.x1 <= o.x1 + 1e-9 && b2.z0 >= o.z0 - 1e-9 && b2.z1 <= o.z1 + 1e-9))
    && obstacles.every(o => inBank(o) && !clash(o, 1)) && obstacles.every((o, i) => obstacles.every((q, j) => i === j || !overlaps(o, q, 2.5)))
    && props.every(p => !clash({ x0: p.at.x - 0.3, x1: p.at.x + 0.3, z0: p.at.z - 0.3, z1: p.at.z + 0.3 }) && !obstacles.some(o => overlaps({ x0: p.at.x - 0.3, x1: p.at.x + 0.3, z0: p.at.z - 0.3, z1: p.at.z + 0.3 }, o))
      && obstacles.some(o => p.pick.x > o.x0 && p.pick.x < o.x1 && p.pick.z > o.z0 && p.pick.z < o.z1))
    && signs.every(s2 => s2.y < W.BANK_TOP + W.BANK.MAX_H - 0.5);
  // The frame: update runs (headless, so no screens), holds the pager while reading and notifies once an approach.
  const notes = []; def.build({ ...kit, notify: (t) => notes.push(t) });
  const st = { era: 3, walking: true, reading: true, x: s.x + 1, z: s.z };
  for (let i = 0; i < 30; i++) def.update(1 / 30, i / 30, st);
  const held = notes.length === 0; st.reading = false;
  for (let i = 0; i < 30; i++) def.update(1 / 30, 1 + i / 30, st);
  const frame = held && notes.length === 1 && /^Pager · PRESS/.test(notes[0]) && E.visit.pager.count === 1 && E.visit.demo.time > 1.5;
  def.dispose(); const disposed = E.visit === null && E.pcRun("DIAL") === null;
  return { frame, disposed, registered, exhibits, trail, prompts, modern, same, deskSame, later, back, press, roundTrip, sealed, wrongKey, keysReset, floppy, offline, capped, ring, frozen, first, stay, again, spaced, steady, over, capStep, moved, capTicks, placed };
};
```

```js
  const genesisEra3 = await genesisEra3Proof();
  record("Genesis Voyage Era 3: it registers through the kit with no signage of its own; every exhibit is dated, sourced, explained and resettable at its prompt and adds no trail stop; the press breaks the desk's own links after a changed page and only those; the toy padlock opens what it locks and a changed note fails its seal; the dial-up corner caps its board; the pager pages once per approach and never while reading; the rally plays the same at any frame rate and a tick at a time at its prompt; everything keeps the reserved plots, the stream's walk and each other clear", Object.values(genesisEra3).every(Boolean), JSON.stringify(genesisEra3));
```

## Checks and evidence

Results, exact commands and browser evidence for this adaptation are in the review bundle's `START-HERE.md`, and are
summarised in the commit message.

## Integration (Claude Code, integrator, on `gv/integration-1`)

Merged from `8dc7569` with an ordinary merge. The integrator's changes, made while the Era 3 builder is paused:

- **Request 4, the press, resolved:** the kit now has a `"demonstration"` connection, never a trail stop, with a
  required `demonstrates` list of stops. The press carries it (one line in this file).
  - The scene checks that each listed id is a trail stop, and throws if one isn't.
  - Its terminal opens by naming them by step: "It shows step 3 (… [3]) and step 4 (… [4]) on the Steps toward
    Bitcoin working; it is not a step of its own."
  - The room's [3] and [4] stay the only Era 3 stops, so there are still 8 in all.
- **Request 2, done:** `state.reading` (a panel or a terminal is open) and `kit.notify(text)`, a toast. The pager
  holds while reading.
- **Calm, added:** the pager's unread lamp holds steady and the cabinet's self-playing demo holds still. The screen
  repaints only when what it shows changes. The press's and the padlock's models still show each command's result at
  once.
- **The leave contract:** nothing in Era 3 outlives its frames (no sound, timers or listeners). `dispose` drops the
  visit, and the screens' canvases go with the scene's nodes.
- **Deferred, as asked:** request 1 (the office PC's hand-on to the dial-up corner) and request 3 (a live panel for
  real-time Tick-Tock Rally). The rally stays prompt-based, a tick at a time.
- **Checks:**
  - "Rule proof" above is in `test/run.mjs` as written, with its record line.
  - `genesisEra3CalmProof` is added (Calm, reading, the demonstration's refusals). It fails against this file before
    the Calm change, on the lamp and the demo.
  - The shared proof's trail table requires the press's demonstration.

---
*Prepared with AI assistance (Claude, by Anthropic) at Billy's request. Not reviewed or endorsed by the Ooga Booga Land
maintainers.*
