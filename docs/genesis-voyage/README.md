# The Genesis Voyage — Before the First Block

A boat ride through the ideas that came before Bitcoin, for Ooga Booga Land. Visitors step through the whitepaper
statue into a hidden harbour, board a boat on a **data current** (a stream of glowing messages, not water) and sail
through rooms in date order. Each room shows one problem, the idea that answered it and what it left unsolved. The
voyage ends at the 2008 whitepaper, with an optional 2009 epilogue.

Status: **work in progress** (`wip: true`). Milestone 0 (this plan and the [source register](sources.md)) and the
smallest playable slice of Milestone 1 are on branch `feature/genesis-voyage`. Nothing is merged or deployed.

- [Launch and controls](#launch-and-controls)
- [Brief and journey](#brief-and-journey)
- [Verified timeline and the reference chart](#verified-timeline-and-the-reference-chart)
- [Storyboard and exhibits](#storyboard-and-exhibits)
- [Visitor experience](#visitor-experience)
- [Architecture, performance and integration](#architecture-performance-and-integration)
- [Milestones](#milestones)
- [Risks](#risks)
- [Open decisions](#open-decisions)
- [Review checklist](#review-checklist)
- [Milestone 1 report](#milestone-1-report)

## Launch and controls

```
npm run serve          # then open http://localhost:<port>/?wip=genesis
```

`?wip=genesis` opens the scene and lands in it; without it the scene is dropped at boot like any wip game. Add
`&debug=1` to enforce the leave contract (the director throws if a visit leaves nodes or input targets behind).

| Action | Keyboard | Mouse / touch |
|---|---|---|
| Drive (throttle and rudder) | W A S D or the arrows | left stick (touch) |
| Go faster | hold Shift | **Boost** button |
| Tour (autopilot dock to dock) or take the wheel back | Enter | **Tour** / **Drive** button |
| Pause, carry on | Space or P | **Pause** button |
| Skip a Tour stop | N | **Skip** button |
| Jump out, or board | J | **Jump out** / **Board** button |
| Info panel (short, deep, unsolved, sources) | I | **Info** button, or tap the lectern |
| Sail straight to an era's island | | tap its plaque on the harbour's timeline wall |
| Captions on or off | C | **Captions** |
| Read captions aloud | T | **Voice** (shown only where the browser can speak) |
| Fixed view (still camera per area) | V | **Fixed view** |
| Calm (reduced motion) | R | **Calm**; on by default when the system asks for reduced motion |
| Look around | | drag |
| Reset the look | 0 | |
| Effects sound | M (the page's sound toggle) | speaker button |
| Back to the island | Escape | **Back to the island** |

## Brief and journey

**Audience.** A curious 12-year-old should be able to follow every room from the captions and the first panel page
alone. Adults get a deeper layer: the second and third panel pages, dates with what they mean, and links to the
primary sources. There are no compulsory quizzes and nothing blocks the boat.

**The frame.**
1. **Portal.** The whitepaper statue on the island is the doorway to *Crypto History Land* (see
   [integration](#statue-integration) for why it is a dev entrance for now).
2. **Harbour.** A dock, the boat, the data current and the **timeline wall**: one plaque per room, oldest ideas
   first. A plaque for a built room sails the boat straight there.
3. **The ride.** A chronological cave. Each room is a small theatre set with an invented Ooga guide, an animated
   demo, a lectern for the info panel and captions.
4. **Hop off** (Milestone 2). At each room's stop the visitor can step onto the ledge, walk the exhibits and play with
   the pieces: old computers, the stamp desk, a hashcash "mint". The boat waits; stepping back aboard carries on.
5. **Finale.** The whitepaper itself, its eight references lit on a wall, each tying back to the room it came from.
6. **Optional epilogue.** The genesis block (3 Jan 2009), the v0.1 release (8 Jan 2009) and block 170 (12 Jan 2009).

**Easter eggs (later, never on the critical path).** Era props by the rooms: beige DOS boxes, a hard-drive size
comparison, period game consoles. All original designs with no real brand marks. Where a visitor might want to play
a period game, a link may open a legitimate online archive (for example the Internet Archive's software collection)
in a new tab. Nothing is downloaded or bundled, and every link is reviewed before it ships.

**Rules for the words.**
- **Guides are fictional Oogas.** Tock the archivist runs the stamp desk. No real person is impersonated, and no
  dialogue is invented for real people.
- **No speculation about Satoshi Nakamoto's identity.** Exhibits quote only the whitepaper and published posts.
- **Every claim traces to the [source register](sources.md),** with a connection type:
  - *whitepaper citation*: the work is in the reference list.
  - *documented influence*: a primary source makes the link.
  - *context*: relevant history with no documented link.
- **Context is labelled as context.** The ride never implies a link it cannot show.

## Verified timeline and the reference chart

The full register with sources, passages, confidence and open questions is in [sources.md](sources.md). The headline
dates, each with what the date actually marks:

| Date | Event | What the date marks | Connection |
|---|---|---|---|
| Nov 1976 | Diffie & Hellman, *New directions in cryptography* | journal issue | context |
| Apr 1977 / Feb 1978 | RSA | MIT memo / CACM issue | context |
| 1974 / Apr 1978 | Merkle's puzzles | student proposal / CACM issue | context; not the cited Merkle work |
| 14–16 Apr 1980 | Merkle, *Protocols for public key cryptosystems* (tree authentication) | IEEE S&P conference | whitepaper citation [7] |
| Aug 1982 / 1983 | Chaum, *Blind signatures for untraceable payments* | CRYPTO '82 / proceedings | context |
| Aug 1990 / 1991 | Haber & Stornetta, *How to time-stamp a digital document* | CRYPTO '90 / J. Cryptology 3(2) | whitepaper citation [3] |
| Jun 1991 / 1993 | Bayer, Haber & Stornetta, Merkle-tree time-stamping | workshop / *Sequences II* | whitepaper citation [4] |
| Aug 1992 / 1993 | Dwork & Naor, *Pricing via processing* | CRYPTO '92 / LNCS 740 | context |
| Sep 1992 | Cypherpunks group forms | group formed | context |
| 9 Mar 1993 | Hughes, *A Cypherpunk's Manifesto* | date on the text | context |
| 28 Mar 1997 | Back announces hash cash | mailing-list post | documented influence |
| Apr 1997 | Haber & Stornetta, *Secure names for bit-strings* | ACM CCS | whitepaper citation [5] |
| Nov 1998 | Dai, *b-money* | text circulated | whitepaper citation [1] |
| May 1999 | Massias, Serret-Avila & Quisquater | symposium | whitepaper citation [2] |
| 1 Aug 2002 | Back, *Hashcash – a denial of service counter-measure* | date on the paper | whitepaper citation [6] |
| 15 Aug 2004 | Finney, RPOW | mailing-list post | context |
| Dec 2005 | Szabo, *Bit gold* (blog) | first posting; the page now shows 27 Dec 2008 | documented influence (Satoshi, 2010) |
| 31 Oct 2008 | *Bitcoin P2P e-cash paper* | mailing-list announcement, 18:10 UTC | — |
| 3 Jan 2009 | Genesis block | header timestamp 18:15:05 UTC | epilogue |
| 8 Jan 2009 | Bitcoin v0.1 | release announcement | epilogue |
| 12 Jan 2009 | Block 170, first transaction to another person | block timestamp | epilogue |

**The reference chart.** Billy shared a "Bitcoin prehistory" timeline chart, credited on its face to @danheld. It was
used only to find events to check, and is not shown in the ride. How its entries were treated:

| Chart entry | Finding | Use |
|---|---|---|
| 2008 Bitcoin launched | The paper came in Oct 2008; the network launched in Jan 2009 | Finale (2008) and epilogue (2009) kept apart |
| 1983 Chaum blind signatures | Presented Aug 1982, proceedings 1983 | Room 2, dated "1982 (published 1983)" |
| 1980 Merkle | The cited paper is tree authentication, not the puzzles | Room 4 (trees); puzzles stay as Room 1 context |
| 1989 DigiCash | 1989 vs 1990 disputed | Room 2, "about 1990", open question |
| 1997 Hashcash | 28 Mar 1997 announcement; the cited paper is 2002 | Room 5, both dates shown |
| 1998 Bit gold | 1998 is a later claim; first posted Dec 2005 | Room 5, "posted 2005 (described as conceived 1998)" |
| 2001 video game currencies | No primary source links them to Bitcoin | Excluded from the ride; at most an unlabelled easter-egg prop |
| 1996 e-gold, 2006 Liberty Reserve | Real, but no documented link | Room 2 context; Liberty Reserve postdates the ideas |
| 1974 TCP/IP, 1991 PGP, 1988/1994 May, 1985 ECC, 1994 CyberCash, 1996 "How to Make a Mint", 1997–98 Szabo essays, 2001 DHTs and BitTorrent, 1998–2001 retailer currencies | Plausible context, **not yet verified** in the register | Verify before their rooms are built (Milestone 3) |
| — (missing from the chart) | Haber–Stornetta, Bayer et al., Massias et al., Dwork–Naor, Feller | Added: four are whitepaper citations |

## Storyboard and exhibits

Each room follows the same beat: **problem → idea → demo → what was still missing → onward**. Rooms run in date
order of the ideas they show.

| # | Room | Problem | Exhibits (connection) | Demo | Hands-on (M2+) | Still missing → |
|---|---|---|---|---|---|---|
| 1 | Networks and Keys | How do strangers on a network talk privately and prove who they are? | TCP/IP 1974 (ctx); Merkle puzzles 1974/78 (ctx); Diffie–Hellman 1976 (ctx); RSA 1977 (ctx) | Two Oogas mix paint colours to share a secret (key exchange) | A padlock box anyone can shut but only the owner opens | Keys alone are not money |
| 2 | Private Digital Money | Can digital cash be private? | Chaum 1982 (ctx); DigiCash ~1990 (ctx); e-gold 1996 (ctx) | The blind-signature envelope: the bank signs without seeing the note | A mint stamping blinded tokens | Every scheme needs a central mint that can be shut |
| 3 | Cypherpunk Workshop | Who builds privacy tools, and in the open? | Cypherpunks 1992 (ctx); Hughes 1993 (ctx); PGP 1991 (to verify) | A workbench where tools are passed hand to hand | DOS computers with period-style screens | Tools, but no money without a trusted party |
| 4 | **Fingerprints and Time** (built) | How do you prove a record was not changed later? | Haber–Stornetta 1991 [3]; Bayer et al. 1993 [4]; Merkle 1980 [7]; Haber–Stornetta 1997 [5]; Massias et al. 1999 [2]; Surety's newspaper hashes (ctx) | **The stamp desk**: pages are fingerprinted, each stamp includes the last, the newest is published, and a changed page breaks every later link | Stamp your own page and watch its fingerprint | Who runs the clock? A trusted stamper is still needed |
| 5 | Work and Scarcity | How do you make something costly to fake without a mint? | Dwork–Naor 1992 (ctx); Hashcash 1997/2002 [6]; b-money 1998 [1]; bit gold 2005 (doc. influence); RPOW 2004 (ctx) | A hashcash mint: roll until the fingerprint starts with zeros | Pull the lever and count tries | Who keeps the ledger and orders it? |
| 6 | The Pieces Come Together | Can a network agree on one history with no one in charge? | The whitepaper, 31 Oct 2008; its references [1]–[8] lit on a wall; Feller 1957 [8] for the attacker's odds | Blocks of stamps chained by proof-of-work; the longest chain wins | Race a "rewrite" chain against the honest one | — |
| 7 | Genesis Epilogue (optional) | — | Genesis block 3 Jan 2009 and its headline text; v0.1 8 Jan; block 170 12 Jan | The first block settles onto the current | — | Back to the harbour |

The words for Room 4 are in `src/js/genesis-voyage.js` (`FINGERPRINTS`, `CAPTIONS`), and the panel cites
[3], [4], [5], [2] and [7].

## Visitor experience

- **Visitor control.** The boat moves only after **Sail**. Pause, Skip and Exit are always on screen. Escape returns
  to the island.
- **No camera takeover while reading.** Opening the panel pauses the boat, the desk and the camera. Keys go to the
  panel, not the ride. Closing it restores the ride exactly as it was, paused or not.
- **Camera.** The camera rides in the boat and looks where the visitor drags. At a stop it turns toward the exhibit
  (Calm makes that a cut). **Fixed view** gives one still vantage per area.
- **Inputs.** Keyboard, mouse and touch. Buttons are at least 40 px tall; the key list hides on narrow screens.
- **Captions** are the narration and are on by default. **Voice** reads them with the browser's own speech, off by
  default and only shown where available. **Effects** are short synthesized cues (stamp, link, broken chain). They
  start only after a gesture, follow the page's sound toggle (M), and their context closes when the visitor leaves.
- **Calm (reduced motion).** On when the system asks for it. It stills the boat's bob and roll, slows the current,
  cuts instead of easing, and stops the flying tiles.
- **Offline.** All words, sources and audio are in the page. Source links are the only network use, and only when
  clicked.

## Architecture, performance and integration

**Files.**
- `src/js/genesis-voyage.js`: pure data and rules with no DOM, so Node can test them.
  - Rooms, sources, panel pages and captions.
  - The toy fingerprint (FNV-1a, labelled as a toy in the panel).
  - The stamp-desk timeline (`createStampDemo`).
  - The course (`createCourse`, Catmull–Rom sampled once at build).
  - The ride state machine (`createRide`: boarding, sailing, station, docked; pause, skip, jump).
- `src/js/scene-genesis.js`: the deferred scene.
  - Builds the cavern, the data current, the timeline wall, the desk and the boat.
  - Drives the camera, captions, panel (`hud.openBoard`), effects and voice.
  - Follows the scene contract: `enter`, `update`, `overlay`, `leave` returning `{ targets }`, `stats` and
    `liveGeometry`.
- Shared edits, kept small:
  - `scene-deferred.js`: the shell, with `wip`.
  - `src/index.html`:
    - Two deferred script tags (`data-defer="genesis-scene"`).
    - A subtitle line.
    - The top preset bar.
    - The caption and controls block.
  - `src/style.css`: one block at the end.
  - `test/run.mjs`: a unit proof, the scene and its round trip.
  - `AGENTS.md`: table rows.

**Loading.** On a hosted page both files are fetched only when the scene is entered (deferred group
`genesis-scene`). Room text stays in `genesis-voyage.js`, which is small. When rooms multiply, each room's build and
words should become their own module in the same group, or in per-room groups if the size warrants it, decided once
measured.

**Resources (measured, Milestone 1).**
- Counts:
  - 223 scene nodes.
  - 11 input targets: lectern, guide, seven plaques.
  - 84 pooled packets.
  - 7 point lights.
  - One merged geometry for the current's channel.
- Captured by headless Chromium (software GL) on two leave-and-return laps under `?debug=1`:
  - Node count and DOM count were identical on both visits.
  - GPU records went 870 → 877, within the suite's growth tolerance.
- Per frame: `update` and `overlay` allocate nothing. Packets, tiles, links and pages are fixed pools, shown or
  hidden, never created per frame.
- Each change: the caption and the chain list touch the DOM only when they change.
- Per cue: effects create one-shot oscillators only when a cue plays.
- Frame-rate budgets are **not set**. Headless software rendering is no guide; budgets wait for measurements on the
  maintainer's machines and real phones and tablets. **No device or frame-rate claim is made.**

**Statue integration (done, wip only).** The whitepaper stone in `scene-hub.js` is temporary. It is raised by the
library book or the Whitepaper Day weekend (31 Oct to 1 Nov 2026), and sinks after `sinkAfter` (300 s) or when the
visit ends. The portal therefore lives on the stone itself, while it stands:
- **In:** walking the played Ooga into either face of the standing stone goes to the voyage (`wpPortal` in
  `scene-hub.js`). The stone's tooltip adds "walk in for the Genesis Voyage".
- **Back:** Escape or Back from the voyage returns the same Ooga to the crest beside the stone, facing it
  (`navigate("genesis")`, plus `genesis` in `handsBack`).
- **Only with the scene registered:** without `?wip=genesis` the scene is dropped at boot and the stone is only the
  paper, so nothing changes for ordinary visitors.

Whether the voyage needs a permanent entrance once the stone has sunk is an open decision (a standing replica in the
library nook, or a route).

## Milestones

| Milestone | Scope | Done when |
|---|---|---|
| **M0** (done) | This plan, the source register, the risk list and the review checklist | Reviewed by Billy and Astra |
| **M1** (playable slice, done) | Harbour, data current, timeline wall, boat, one room (Fingerprints and Time) with its demo, panel, captions, pause, skip, exit, calm and fixed view | Checks below pass; maintainer play-test |
| **M2** | Hop off: a walk mode at stops using the existing pilot and crew (walkable ledge, `useNear`, footsteps); step back aboard; hands-on stamp desk | Walk on and off without stranding; leave contract holds |
| **M3** | Rooms 5 (Work and Scarcity) and 2 (Private Digital Money), verifying the "to verify" chart entries first | Each exhibit row traced in sources.md |
| **M4** | Rooms 1, 3 and 6, the finale wall of references, and the statue portal (after maintainer sign-off) | Enter from the statue; Escape returns there |
| **M5** | Optional epilogue; era props and easter eggs; phone layout pass | Device evidence recorded before any device claim |
| **M6** | Polish: original music cues, per-room ambience, accessibility review (screen-reader text for panels) | Lighthouse accessibility pass on the scene |

No multiplayer boats before M5, and only if the maintainer wants them.

## Risks

| Risk | Mitigation |
|---|---|
| Historical errors, or date confusion (presentation vs publication) | Every exhibit is backed by sources.md; dates say what they mark; open questions stay visible |
| Implying influence that is not documented | Connection type on every exhibit; context is labelled |
| Identity speculation creeping in through "fun facts" | Out of scope by rule; the register already dropped items that bore on it |
| Scope: "an extensive build" | Milestones ship playable slices; easter eggs never block a milestone |
| Statue conflict with the Whitepaper Day event | Dev entrance until the maintainer chooses (see integration) |
| Performance on phones and tablets | Pools, merged geometry, deferred loading; budgets only after device measurement |
| Panel text is drawn on a canvas, so screen readers miss it | The board's `note` carries each page's text; a DOM panel is an M6 item |
| Browser speech varies by system | Voice is optional and off by default; captions are always available |
| Copyright and trademarks (brand-like props, game links) | Original designs only; links reviewed; nothing downloaded or bundled |
| The suite's browser scene is slow on software GL | It passes its logic in Node; the browser lap needs a real GPU machine (see the report) |

## Open decisions

For Billy, Astra and the maintainer:
1. **The portal.**
   - Option A: an action on the temporary monolith.
   - Option B: a standing replica in the library nook.
   - Option C: a route-only entrance.
2. **The data current's look.** Glowing packets in cyan, gold and violet on dark glass, as built. Alternatives:
   punched-tape ribbons, or a river of glyphs.
3. **Guide names and looks.** Tock is generated from the name like any non-roster Ooga.
4. **Voice.** Browser speech now. Original recorded narration later?
5. **Which era props and games links are wanted,** and who reviews the links.

## Review checklist

- [ ] Every caption and panel sentence traces to a row in sources.md.
- [ ] Every date says what it marks; the 2008 paper and the 2009 launch are never merged.
- [ ] No sentence implies a link the register marks as context.
- [ ] Nothing speculates about Satoshi's identity; no invented quotes; guides are clearly fictional.
- [ ] Entry from the dev route and return to the island work; repeated visits hold nothing.
- [ ] Pause holds the boat, the desk and the current; the panel keeps keys from the ride and restores it on close.
- [ ] Calm and Fixed view work and persist through a ride.
- [ ] Captions on by default; Voice off by default and hidden where unsupported.
- [ ] Effects start only after a gesture, follow M, and close on leave.
- [ ] No allocation in `update` or `overlay`.
- [ ] Existing scenes unaffected (unit tier passes; scene suites of touched shared files).
- [ ] The built `oogaboogaland.html` is not committed.

## The stream and its caves (`gv/water-boat`)

The fixed course became a stream you drive. From the harbour's mouth it runs through a chain of large caves, one per
era in date order (Eras 0 to 7, names and years from the era dossiers on `gv/research`), joined by low stone tunnels.
Each cave is 76 m wide, 72 m long and 24 m high, in its era's colours, with its years hanging over the stream as the
boat comes in, and wide banks on both sides. The visitor's own Ooga rides in the boat. **Tour** keeps the old
autopilot, now dock to dock down the stream, and Boost or Shift hurries it.

- `src/js/genesis-world.js` (pure): the eras and their caves, banks, docks, signs and themes; `eraAt`; `collide`
  (the harbour's walls and dock, then the stream's banks and the last cave's end); `ceilingAt` (harbour, cave or
  tunnel roof); `dockAt`; the Tour's course.
- `src/js/genesis-boat.js` (pure, fixed 1/60 s steps, allocation-free): throttle, rudder that needs way on, boost,
  drag, reverse, a top speed per boat type, collision and the dock it lies at.
- Boats by era, per the dossiers' dated examples, all original and unbranded: a rowing skiff (Era 0 and the harbour),
  an outboard runabout (Eras 1 and 2), a personal watercraft (Era 3, ridden seated), and a rigid inflatable boat (Eras
  4 to 7). The boat changes, with a splash, as it crosses into an era.
- **Hop out anywhere:** both banks of every cave are ground, so J lands the Ooga on the nearest bank; it wears a
  jetpack ashore (hold Space in the air) and the caves are tall enough to fly in. The cave walls and the rock beside
  each tunnel stop it. J by the boat, or a bank's boarding ramp with the boat at its foot, re-boards; a fall into the
  stream comes back to the bank.
- Fingerprints and Time moved, unchanged, onto Era 3's left bank (`ROOM_SHIFT`). The other caves have no exhibits
  yet; their captions say so and their signs carry only names and years. Each era's exhibits come next, from the
  dossiers' READY items only.

## Milestone 1 report

**Branch.** `feature/genesis-voyage`, from upstream `rock` 37d9f394 (2026-10-31). It contains no Block Frenzy,
piggyback, character or sound-proposal changes.

**Playable.**
1. Enter at `?wip=genesis` and board at the dock.
2. Read the timeline wall; tap Fingerprints and Time to sail straight there.
3. Sail through the tunnel on the data current to the stamp desk.
4. Watch Tock fingerprint and chain five pages, publish the newest, show a changed page breaking every later link,
   and restore it, with the chain listed on screen as it grows.
5. Open the four-page panel with source links.
6. Sail on and dock. Ride again, or Escape to the island.

Walk mode (hop off) is **not** in M1. It needs the pilot and crew wiring and is the whole of M2.

**Checks run.**
- `node test/run.mjs unit`: 348/348 pass, including the new Genesis Voyage proof:
  - Boarding, the stop and docking.
  - Pause holding.
  - A plaque jump.
  - Chain breakage only after the changed page.
  - Every source is a link.
- Headless Chromium smoke test (software GL, `?debug=1&nosim=1&wip=genesis`):
  - Entry: lands in the scene.
  - Boat progression: boarding → sailing → station → docked.
  - Pause: holds boat and desk exactly.
  - Panel: opens paused; V and N are ignored while reading; closing resumes the ride.
  - Repeat visits: two leave-and-return laps under the debug leave contract with no throw, steady node and DOM
    counts, and GPU records within tolerance.
- `npm test -- genesis` (the suite's own browser scene, `genesis ride` and `genesis round trip`) **could not finish
  in this sandbox**. The session hits the suite's 120 s cap on software rendering before its steps complete. The
  existing `npm test -- drop` hits the same cap here (`drop start` and `drop phone`), so this is the sandbox, not the
  scene. It needs a run on a machine with a GPU.

**Open historical questions.** See the open questions in sources.md. The main ones:
- DigiCash 1989 vs 1990.
- Surety's NYT start year.
- Full texts of Massias 1999 and Haber–Stornetta 1997.
- The chart entries marked "to verify".

**Browser and device limits.** Tested only in headless Chromium with software rendering. No phone, tablet,
Safari or Firefox runs; no frame-rate figures.

**For Astra/Codex to review.**
1. The scene contract in `scene-genesis.js`: `leave` order, input targets and the `hud.create` reuse.
2. Panel input: the ride ignores keys while `#board-modal` is open; is polling `hud.el.board.open` in `update` the
   right way to learn it closed?
3. The test step's coarse `dt` (0.5 s) in `genesis ride`.
4. The panel words against sources.md.
5. Whether `BL.factoryModels.label` (used for signs) is acceptable from a non-factory scene.
6. A run of `npm test -- genesis` on a real machine.

---
*Prepared with AI assistance (Claude, by Anthropic) at Billy's request: research, plan and code. Not reviewed or
endorsed by the Ooga Booga Land maintainers.*
