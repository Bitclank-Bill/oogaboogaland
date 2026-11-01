# Era 0: Machines That Count (1956–1969)

Implementation: `src/js/genesis-era-0.js`. Integration base:
`gv/water-boat` at `aa9154224b7ac284cc53d5684e81c46f9ef41a27`.
Uses the existing `genesisExhibits.register(0, { sources, build })` kit.

## What is playable

The original Feller shelf and ARPANET information display remain. The era's large years
sign, pylons, overview board and the Steps toward Bitcoin trail come from the shared signage
(see "Integration review" below); this era's guide pages sit in that overview. Five
original activities follow. Walk up and use the existing Space/USE interaction.
The existing terminal dialog takes typed commands; these are not real operating systems.

| Station | Commands | Visitor-visible result |
|---|---|---|
| Disk record finder, 1956 | `SEEK 0` through `SEEK 49`, `INFO`, `RESET` | A schematic arm selects a height among 50 platter silhouettes. Close the dialog to inspect it. Selection is immediate, not a timed mechanical animation. |
| Punch a museum message, period illustrated 1956–1969 | `PUNCH BILL`, `FLIP 1 7`, `READ`, `INFO`, `RESET` | Up to eight characters become holes; toggling one bit changes the decoded message. The code and card layout are explicitly invented today. |
| Probability race, cited edition 1957 | `ODDS 25`, `STEP 16`, `STATUS`, `INFO`, `RESET` | Two markers advance according to a seeded sequence, at most 64 total steps. Changing odds restarts the race. |
| Retry the login, event 29 October 1969 | `LOGIN`, `RETRY`, `STATUS`, `INFO`, `RESET` | First attempt stops after LO, then retry delivers LOGIN. A fixed lamp changes state. Prompts and timing are museum reconstructions. |
| Modern comparison, announcement 25 February 2019 | Open the two-page panel | A schematic card is explicitly outside the cave's historical period. No exact scale or capacity ratio is asserted. |

The original information panels contain the deeper history and source links. Activity
terminals offer `INFO` for provenance and limitations. All state resets on scene rebuild.
Closing/reopening a terminal within the visit preserves its activity state.

## Historical scope and sources

Pages read directly on 31 October 2026, alongside the Era 0 dossier on `gv/research`:

- **Storage, context:** [Computer History Museum](https://www.computerhistory.org/storageengine/first-commercial-hard-disk-drive-shipped/).
  June 1956 marks the first commercial shipment recorded by this source. The cabinet's
  five-million-character label avoids an unexplained bytes conversion. Its 50 square
  platter silhouettes and toy record mapping are schematic, not engineering drawings.
- **Punched records, context:** [IBM's RAMAC history](https://www.ibm.com/history/ramac).
  Supports punched cards as background. The eight-column, seven-bit coding toy is an
  original museum analogy, not Hollerith, BCD, ASCII-era hardware, or an authentic card.
  No year of invention is assigned to the toy.
- **Feller, whitepaper citation:** [Bitcoin whitepaper](https://bitcoin.org/bitcoin.pdf),
  section 11 and reference 8, with the [SNI catalogue](https://nakamotoinstitute.org/library/introduction-probability-theory-vol-i/)
  inherited from the dossier. 1957 is the cited edition year. The race illustrates changing
  odds, not the paper's attacker catch-up calculation, a Bitcoin security forecast or
  statistically independent trials. Original volume not consulted; no Feller quotation.
- **ARPANET, context:** [Kleinrock/UCLA and reproduced IMP log](https://www.lk.cs.ucla.edu/internet_first_words.html).
  Date refers to the host-message attempt. This exhibit does not claim the Web began then,
  reproduce an authentic terminal transcript, or establish a Bitcoin influence.
- **Outside-era comparison:** [Micron announcement](https://investors.micron.com/news/press-release/2019/Micron-Unveils-Worlds-First-1TB-microSD-Card-to-Meet-Consumer-Demand-for-Mobile-Storage-02-25-2019/default.aspx).
  Announcement date and capacity are distinguished from availability; enlarged blank
  card geometry is not to scale.

IBM and CHM use different encoded-bit descriptions in their retrospectives. No exact
storage ratio is displayed. No external assets, quotes, recordings, new dependencies,
network calls, personal data or historical-person likenesses were added.

## Integration, performance and cleanup

- Only this era module and this document change; script loading is already wired at the base.
- All stations sit on the banks, away from the channel, ramps, cave walls and each other.
  Physical station footprints are passed to the kit's existing obstacle system.
- All geometry is allocated in `build`. There is no `update`, timer, sound context or listener.
  Commands reposition or reveal existing nodes; they do not create additional geometry.
- Input strings are capped at 96 characters, punched data at eight characters, and the race
  at 64 steps. Responses are printed through the existing text-only terminal and its bounded log.
- State and model references live in per-visit prop closures, not module-level caches.
  The scene clears its registry and graph on leave; re-entry creates fresh closures.
- These are local visitor activities, not synchronized multiplayer games.
- **Integrator:** the older drive plinth and unverified comparison text in Era 3 remain
  outside this change. Remove/replace them through the shared scene/props owner; do not
  mistake this Era 0 implementation for verification of that older exhibit.

## Verification and acceptance

Follow AGENTS.md's default **wait** mode: build and syntax verification; no browser or
probe run is implied. Results are reported in the handoff. Shared test/run.mjs is owned
by the integrator and was not edited. Its existing exhibit proof checks registration,
source resolution, year labels and bank/cave placement, but not the new command rules.

Before acceptance, extend that existing proof (do not add a new test file) to cover:

1. SEEK 0/49 select the endpoint heights; invalid, fractional and excessive values change nothing.
2. PUNCH A then FLIP 1 7 decodes @. Eight characters work; nine are rejected without mutation.
   RESET hides every hole and clears the message. Bad columns/bits do not alter the card.
3. ODDS 100 then STEP 64 gives gold 64, blue 0; ODDS 0 gives the reverse. Additional steps
   cannot exceed 64. Reset repeats the seeded sequence and restores default odds.
4. RETRY before LOGIN does not skip failure; LOGIN produces LO, RETRY produces LOGIN;
   repeated LOGIN cannot skip ahead. RESET restores the ready state and lamp.
5. Build, interact, leave and rebuild: no state or node references survive the visit.
6. Real-browser walk-up and tap targets, signs from boat and bank, keyboard and touch text
   entry, reading/input isolation, standing clearance, two leave/return laps and performance.

Real-browser rendering, touch, hardware performance and human playtesting remain unverified.
The models are intentionally a first version, not historically exact reconstructions.

Prepared with AI assistance (OpenAI Codex).

## Integration review (Claude Code, integrator)

Reviewed on `gv/era-0-exhibits` after Astra's commit `ed52b771`, merged with the shared infrastructure
(`gv/exhibits`). The activities, their rules, the work limits (8 characters, 64 steps, 96-character
input) and the wording are kept as written. The changes:

- **Consolidated:** the shared signage provides the era's big sign, pylons, overview board and the trail's
  STEP post. Astra's second era sign, "Steps toward Bitcoin" sign and `e0-overview` prop are removed. The
  "Explore" and "Play" pages now sit in the shared overview panel (`overview.pages`) with their sources.
  The `e0-overview` prop also stood in the cave's gateway, a reserved plot.
- **Lamp post:** "Retry the login" moved from x 20 to x 18.5, clear of the right bank's lamp post (its
  cabinet and obstacle overlapped it).
- **Trail metadata:** Feller is `citation [8]`, trail step 1. The five activities, ARPANET and the 2019
  comparison are `context`, each with a `date` saying what its year marks.
- **Tap boxes:** each station's `pick` now covers its model, not just its walk-up point. A shared fix also
  makes tap boxes pickable at all: before it, no tap box anywhere in the voyage could be tapped.
- **Shared proof:** "Genesis Voyage exhibits" in `test/run.mjs` now checks this era's command rules 1–5
  above (SEEK endpoints and refusals, PUNCH/FLIP/READ/RESET, ODDS/STEP limits and seeded repeat,
  LOGIN/RETRY order and lamp, long or empty input, and a fresh visit sharing no state or nodes).

Checks on that branch:
- **Unit tier:** `npm run test:unit` passes, including the command rules.
- **Real browser:** Chromium on WebGL2 (software GPU). Signage from the boat and bank, walk-up and Space at
  all seven stations, typing W A S D in a terminal leaves the Ooga still, RESET, the overview's five pages,
  tapping Feller and the overview (WebGL2 and Canvas 2D), and two leave/return laps with steady node and
  target counts and a clean console.
- **Still unverified:** touch text entry on a phone, hardware performance and human play.

## Counting cluster (`gv/upgrade-era-0`)

Branch `gv/upgrade-era-0` from `gv/overhaul` at `cb2b0b9405a2d6363c9f284146b4c0aab6d3b34f` (left frozen).
Three modern explanatory toys stand in one row on the left bank, 48 m in from the gallery's way in (old
coordinates x −22, −15.5 and −9), between the disk cabinet and the punched-card desk, under one "COUNTING CLUSTER"
sign. Feller, ARPANET, the disk, the punch card, the race, the login and the 2019 comparison are unchanged, keep
their ids and build order, and none of their mechanisms is repeated (no seeking, punching, odds or retry here).

| Station (id) | Terminal commands today | What changes in the world | Console game (`make(host)`) |
|---|---|---|---|
| Nim board (`e0-nim`) | `TAKE C 2`, `LEVEL 1..3`, `HINT`, `STATUS`, `INFO`, `RESET` | 15 bone counters in heaps of 3, 5, 7 disappear as they are taken | Left/right heap, up/down count, act takes; five games, 100 a win |
| Scan-line CRT (`e0-crt`) | `BRIGHT 0..4`, `CONTRAST 0..4`, `LINES 0..12`, `STATUS`, `INFO`, `RESET` | Twelve scan-line strips and 14 picture runs change glow; tones at zero switch off; `LINES` draws only the first lines | Match a seeded reference picture's brightness and contrast; act redraws line by line and locks; three rounds |
| Point or type (`e0-pointer`) | `SELECT B2`, `MOVE dx dy`, `CLICK`, `STATUS`, `INFO`, `RESET` | Nine targets on an upright board, one lit; a cursor marker moves | A pointer round (cursor follows drag or held keys, act clicks) then a typed round (step a code, act enters); both timed |

**Rules and opponent.** Nim uses generic public-domain rules: three heaps (3, 5, 7), take one or more from one
heap, whoever takes the last counter wins, visitor first. The computer is bounded: it weighs only the legal moves in
front of it (at most 15), never searches ahead, and at level 1, 2 or 3 looks for the winning (zero nim-sum) reply on
25%, 60% or 100% of turns, otherwise taking one or two from the largest heap. Seeded, so `RESET` replays a game.
A perfect visitor wins at every level; level 3 punishes careless play.

**Labels.** Every station is `connection: "context"`, titled and labelled "modern toy", and its `date` reads "No
historical date: a modern explanatory toy shown in the 1956-1969 gallery". The catalogue needs a year, so `year` is
1956 and the label says "1956-1969 GALLERY": the gallery's span, not a date for the toy. The CRT picture (a sailing
boat under a sun) is original; the pointing device is a generic box. Source key `e0Toys` points at this document,
the museum's own provenance, not at a historical source.

**Scene records: 65** (Nim 18, CRT 30, pointer 16, cluster sign 1). No point lights, no frame callback, no timer,
no audio; commands change existing nodes' `visible`, `glow` and position only. Nothing widens the gallery: all
footprints are inside x −27..27, clear of the old stream's walk, the gateway, the dock, the lamp posts and every
other exhibit's footprint, below the height limit, with clear walk-up points.

**Files.** `src/js/genesis-era-0-nim.js`, `genesis-era-0-crt.js`, `genesis-era-0-pointer.js` each register
`BL.genesisEra0Games.<toy> = { create, terminal, make, … }`: one rules core shared by the terminal and the console
game. `genesis-era-0.js` reads them when the era builds. Until their script tags land (below), each station still
stands and keeps its id, and opens a caption saying its program has not loaded.

## Research: what is on HOLD (not displayed)

This session's network policy refused every research host tried on 1 November 2026 (patents.google.com,
www.computerhistory.org, web.stanford.edu, dougengelbart.org, www.jstor.org, www.computinghistory.org.uk), and the
Era 0 dossier on `gv/research` has no entry for Nim, CRT displays or pointing devices. Nothing below was read, so
none of it is shown; every toy ships as a modern explanatory toy with no introduction date, as the brief allows.

| Candidate claim (HOLD) | What would release it | Primary source to read |
|---|---|---|
| An early mouse was publicly demonstrated in December 1968 (date, event, venue, lab, system, buttons) | Read the demonstration's archival record; quote only what it states | SRI / Doug Engelbart Institute archive; Stanford MouseSite's 1968 demo page |
| A patent for an "X-Y position indicator for a display system" (number, filing and grant dates, how motion was sensed) | Read the patent text itself | US 3,541,541 at USPTO or Google Patents |
| A published comparison of display-selection devices in the late 1960s | Read the paper's own abstract and methods | IEEE Transactions on Human Factors in Electronics (1967) |
| Nim's complete mathematical theory was published in 1901–1902 (publication date) | Check the journal's volume, issue and year | Annals of Mathematics (JSTOR stable record) |
| A Nim-playing computer was exhibited in 1951 (outside this era either way) | A museum record naming the machine and event | Centre for Computing History; The National Museum of Computing |
| Any Nim-playing program or machine shown 1956–1969 | A contemporary document or museum record | None identified |
| A period computer display (e.g. a 1960s point-plotting CRT) for the CRT station's INFO | Museum or manufacturer record of the display and its drawing method | Computer History Museum PDP-1 pages; DEC manuals (bitsavers) |

If an entry is released, it becomes a dated `INFO` line or a board page with its own source key and a date saying
what it marks; the station's connection stays `context`. The CRT `INFO` says only, generally, that many early
computer displays plotted points rather than sweeping lines; it names no machine or date.

## START-HERE (gv/upgrade-era-0)

**Checks run here (Linux container, 1 November 2026):**
- `node test/genesis-era-0-upgrade.mjs`: 26/26. Placement and record count; labels and sources; Nim, CRT and pointer
  rules through their terminals (bad input changes nothing, RESET, long input); the nodes follow the state; a
  perfect Nim visitor wins at every level; a fresh visit shares nothing; stations stand and open a caption without
  their scripts; each console factory keeps the retro-games.js shape and plays to one `over()` and one `onEnd`.
- `node test/run.mjs unit`: 361/361, including the shared Genesis exhibit, museum-layout and sightline proofs
  (which load the era files without the toy scripts, so they see the caption fallback).
- `node test/run.mjs genesis` (Chromium, `--no-sandbox` wrapper): 361/364. "genesis ride" and "genesis walk"
  fail with `Cannot read properties of undefined (reading 'state')` and "genesis round trip" times out. The base
  commit `cb2b0b9` fails the same three the same way with this change stashed, so they predate it.
- **Not verified:** the cluster in a real browser (the toy scripts aren't in `src/index.html` yet), the console
  games on a real console host, touch input, hardware performance and human play.

### Integration requests (for the Genesis tab)

1. **Script tags**, in `src/index.html` before `js/genesis-era-0.js`, same deferral group:
   ```html
   <script src="js/genesis-era-0-nim.js" data-defer="genesis-scene"></script>
   <script src="js/genesis-era-0-crt.js" data-defer="genesis-scene"></script>
   <script src="js/genesis-era-0-pointer.js" data-defer="genesis-scene"></script>
   ```
   The order among the three doesn't matter; each only adds to `BL.genesisEra0Games`.
2. **Runner hook:** add `test/genesis-era-0-upgrade.mjs` to the unit tier (or call it from the Genesis proofs);
   it exits non-zero on failure. Optionally load the three toy scripts in `genesisExhibitsProof` and
   `genesisMuseumProof` so those proofs see the live terminals instead of the fallback caption.
3. **Console hooks** (for whatever the console's `onUse` result becomes; nothing is assumed here):
   - *Loading:* `BL.genesisEra0Games.nim.make`, `.crt.make` and `.pointer.make` are retro-games.js factories. They read
     `BL.retroGames.kit` when called (so `retro-games.js` must have loaded), draw into the shared 160×120 screen and
     return `{ kind, name, help, coach, stars, tickets, status, playing, start(seed), act(), stop(), update(dt), draw(ctx), aims: true }`.
     `tickets` is always 0: these are museum toys, not arcade prizes.
   - *Input:* they read `host.aim.steps`, `aim.stepsY` (Nim, CRT, the pointer's typed round) and `aim.x`, `aim.y`
     (the pointer round, which steers a cursor). A true pointer round would be better with an absolute screen
     position: an optional `host.pointer = { x, y, down }` in screen pixels would let the cursor follow a tap or
     mouse directly. Without it the round uses `aim`.
   - *Pause:* while the console is paused, don't call `update`; nothing is timer-driven outside it.
   - *Calm / reduced motion:* `host.still` makes the CRT's line-by-line redraw appear complete at once.
   - *Screen:* `draw(ctx)` paints the whole screen each frame; the scene lays it over a screen, as the arcade does.
   - *Which station:* map `e0-nim` → `nim`, `e0-crt` → `crt`, `e0-pointer` → `pointer`. The terminal versions stay
     the stations' `onUse` today; a console game should be a second way in, not a replacement.
4. **No other shared file changes are needed.** `scene-genesis.js`, `genesis-world.js`, the catalogue, the timeline
   data, the workbench and `test/run.mjs` are untouched.

Prepared with AI assistance (Claude Code).
