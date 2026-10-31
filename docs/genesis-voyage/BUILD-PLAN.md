# Genesis Voyage: multi-agent build plan

This is the working plan for building the Genesis Voyage with several AI assistants at once. Billy coordinates.
Claude Code integrates on `feature/genesis-voyage`. Each workstream has its own branch and owns its own files, so
the streams never edit the same lines. Read [README.md](README.md) (the design) and [sources.md](sources.md) (the
register) first.

## The vision (Billy, 31 Oct 2026)

- **Portal.** Walking into the whitepaper stone leads to Crypto History Land. Done for the wip build.
- **Open water.** Lots of water. **You drive the boat**: throttle, steering and a speed boost, with no track. A
  "Tour" autopilot stays available for anyone who wants to sit back, and for accessibility.
- **Eras, in date order.** The sea runs as a chronological series of era islands or caves, each with a big **year
  sign** (for example "1976") and a date on every exhibit.
- **The boat morphs by era.** Each era's boat is one that existed then. All designs are original and unbranded.
- **Era music.** Each era has its own original, synthesized music, crossfading as you cross into it.
- **Hop off anywhere.** Jumping out of the boat stops it (no "pause/continue" prompt), and you walk the island.
  Walk back aboard to drive on.
- **Things to play with.**
  - The technology that mattered for Bitcoin: hashing, keys, timestamps, proof-of-work, peer-to-peer.
  - Other gear from the same years: DOS PCs, a hard-drive size comparison, floppies, modems, pagers, consoles.
  - Easter eggs: period-style mini-games built in, and reviewed links out to legitimate online archives.
- **Deep, accurate research** for every era, from primary sources. Discovery aids: Billy's timeline chart, and
  [nakamotoinstitute.org](https://nakamotoinstitute.org/), whose Library, Complete Satoshi and Finney/RPOW pages
  are primary or near-primary sources.

## Eras (draft, to be confirmed by the research stream)

The rooms become eras. The current room, Fingerprints and Time, becomes part of Era 4.

| # | Era island | Years | Bitcoin-line exhibits (connection) | Period gear to play with (to research) | Boat (to research) |
|---|---|---|---|---|---|
| 0 | Machines That Count (prologue) | 1956–1969 | Feller 1957 [8]; ARPANET 1969 (ctx) | 1956 hard drive vs a microSD; punch cards; teletype | Wooden rowboat |
| 1 | Networks and Keys | 1970–1979 | TCP/IP 1974; Diffie–Hellman 1976; RSA 1977; Merkle puzzles 1974/78 (all ctx) | Early microcomputers; 8-inch floppy; acoustic coupler | Fibreglass runabout |
| 2 | Trees and Blind Money | 1980–1989 | Merkle 1980 [7]; Chaum 1982 (ctx); ECC 1985 (ctx); May 1988 (ctx) | DOS PC; 5.25-inch floppy; 8-bit console; dial-up | Outboard speedboat |
| 3 | Cypherpunks and Timestamps | 1990–1995 | Haber–Stornetta 1990/91 [3]; Bayer et al. 1991/93 [4]; Dwork–Naor 1992 (ctx); PGP 1991 (ctx); cypherpunks 1992 (ctx); Hughes 1993 (ctx); DigiCash ~1990 (ctx); Surety 1995 (ctx) | 386/486 PC; BBS; 16-bit console; pager; 3.5-inch floppy | Personal watercraft |
| 4 | Work and Scarcity | 1996–1999 | e-gold 1996 (ctx); Hashcash 1997 [6]; Haber–Stornetta 1997 [5]; b-money 1998 [1]; Massias et al. 1999 [2] | Early web PC; CD-ROM; 56k modem; handheld console | Offshore racer |
| 5 | Peers and Reusable Work | 2000–2007 | BitTorrent and DHTs 2001 (ctx); Hashcash paper 2002 [6]; RPOW 2004 (ctx); bit gold 2005 (doc. influence) | Broadband; USB stick; MP3 player; flip phone | RIB or hydrofoil |
| 6 | The Whitepaper | 31 Oct 2008 | The paper and its eight references | A 2008 laptop; the mailing list | Original concept boat |
| 7 | Genesis (epilogue) | 3–12 Jan 2009 | Genesis block; v0.1; block 170 | — | — |

The research stream confirms or corrects every year, exhibit and item in this table. Nothing ships unless it traces
to a dossier.

## Architecture changes this asks for

- **Open water and a driven boat** replace the fixed course. The current ride state machine (`createRide`) stays as
  the **Tour** autopilot.
- New pure module `genesis-boat.js`, Node-testable:
  - Throttle, steering and boost.
  - Water drag and soft collision against island shorelines (circles or capsules per island).
  - Docking zones.
- New pure module `genesis-world.js`:
  - Era islands placed in date order along a wide sea, with shorelines, docks and year signs.
  - A query: which era is at a given position.
- **Hop off and walk.** At or near a dock, Jump out (or the button) stops the boat and hands control to the visitor's
  Ooga on the island. AGENTS.md asks scenes that drive an Ooga to use `pilot.create` and the crew (`walkable`,
  `useNear`, footsteps, presence). Follow the arcade and factory scenes. Walking up the boarding ramp re-boards.
- **Era boats.** One model per era built at enter; the visible one swaps as the era changes, with a short splash.
  No allocation per frame.
- **Era music.** New `genesis-audio.js`:
  - A small synthesized sequencer per era: original motifs, never copies of real songs.
  - Crossfades on era change.
  - Starts after a gesture, follows `BL.sound`, and closes on leave.
- **Props and play.**
  - New `genesis-props.js`: a registry of interactive props, each with an `onUse` and an optional board.
  - DOS PC: a fake prompt. `DIR`, `TYPE B-MONEY.TXT` and `HASH` show era-true text.
  - Hard-drive comparison: true capacities and sizes with sources.
  - Floppy stack, modem with a synthesized handshake, period consoles running original mini-games.
- **Words and sources.** Each era's content lives in a data module (`genesis-era-<n>.js`), generated from the era
  dossier. Every string carries a source key.
- **Size.** As eras grow, each era's data and models can become its own deferred group. Measure first.

## Workstreams and file ownership

| Stream | Who | Branch (from `feature/genesis-voyage`) | Owns | Delivers |
|---|---|---|---|---|
| R: Research | **Astra (browser)**, with Claude Code or Codex compiling | `gv/research` | `docs/genesis-voyage/eras/*.md` | One dossier per era in the schema below |
| A: Water and boat | **Astra Codex** | `gv/water-boat` | `genesis-boat.js`, `genesis-world.js`, their unit proofs | Driven boat, sea, islands, docks, year signs, era boats, Tour mode |
| B: Hop off and props | **Claude Code** | `gv/walk-props` | `genesis-props.js`, walk wiring in `scene-genesis.js`, their checks | Jump out, walk, re-board, prop framework, DOS PC, drive comparison |
| C: Era music and sound | **Claude Code** (second session) or Codex | `gv/audio` | `genesis-audio.js` | Era music, crossfades, boat engine and splash sounds |
| I: Integration and review | **Claude Code** (main) + **Astra** review | `feature/genesis-voyage` | `scene-genesis.js` glue, README | Merges streams (no force-push), runs checks, reports |

`scene-genesis.js` is shared. Streams A and B each add one clearly marked section and avoid touching the other's.
The integrator resolves conflicts.

**Rules for every stream:**
- Vanilla JS, no dependencies, strict CSP.
- No allocation in `update` or `overlay`; respect the leave contract (`?debug=1`).
- Original designs, music and words. No brand logos, ROMs, copied songs or characters.
- No speculation about Satoshi's identity. No invented quotes from real people.
- Don't commit the built `oogaboogaland.html`.
- Commit as Bitcoin-Bill (`185141343+Bitcoin-Bill@users.noreply.github.com`) with an honest AI-assistance note and
  no session links. Push to the fork only. Never force-push and never touch the official repo.

## Era dossier schema (`docs/genesis-voyage/eras/era-<n>-<slug>.md`)

```
# Era <n>: <name> (<years>)
## Summary for a 12-year-old (3–5 sentences)
## The deeper story (2–4 paragraphs)
## Exhibits (Bitcoin line)
For each: name · exact date + what the date marks · one-line contribution · problem left unsolved ·
primary source URL + passage ≤15 words actually read · connection (whitepaper citation / documented influence /
context) · confidence · open questions
## Period gear to play with
For each: item · year introduced (what the date marks) · one true, kid-friendly fact with a number
(capacity, speed, price, size) · source URL · how a visitor could play with it (a mechanic) · originality notes
(how to draw it without brand marks)
## Era boat
Boat type that existed in these years · first-available date + source · silhouette notes for an original model
## Music direction
Instruments and styles typical of the era (not specific songs) · tempo · two or three original motif ideas
## Easter eggs
Period games: genre + year · a legitimate place to play online (official publisher page or a library/archive's
reviewed emulation page) with URL · or an original mini-game idea in that style
## Captions (draft)
6–10 caption lines for the boat and the exhibits, each tagged with its source key
## Corrections to the chart / README table
```

## Prompts

### 1. Astra (ChatGPT browser): research lead

> You are the research lead for the **Genesis Voyage**, a chronological boat-ride museum about the ideas and
> technology that led to the Bitcoin whitepaper, built inside Ooga Booga Land (a voxel web game). The audience is a
> curious 12-year-old, with a deeper layer for adults.
>
> **Read first:**
> - `docs/genesis-voyage/README.md`, `BUILD-PLAN.md` and `sources.md` on
>   https://github.com/Bitcoin-Bill/oogaboogaland/tree/feature/genesis-voyage/docs/genesis-voyage
>
> **Task:** produce one dossier per era (Eras 0 to 7 in BUILD-PLAN.md) in the exact "Era dossier schema" there.
>
> **Sources to use:**
> - **Primary first:** author pages, publisher DOI pages, mailing-list archives, patents and official records.
> - **Nakamoto Institute:** https://nakamotoinstitute.org/
>   - The Library, for the whitepaper, *A Cypherpunk's Manifesto* and *Shelling Out*.
>   - The Complete Satoshi at https://satoshi.nakamotoinstitute.org/, for Satoshi's own emails and posts.
>   - The Finney/RPOW pages.
> - **Billy's "Bitcoin prehistory" chart** (credited to @danheld) is a discovery aid only. Verify every entry
>   before using it, and list corrections.
>
> **Rules:**
> - **Dates:** every date says what it marks (written, presented, published, filed, granted, released, posted).
>   Keep the whitepaper (31 Oct 2008) and the launch (3 and 8 Jan 2009) apart.
> - **Connection type:** label every exhibit as "whitepaper citation", "documented influence" (cite the primary
>   source) or "context". Never imply influence you cannot show.
> - **Quotes:** at most 15 words, only from pages you actually read. If a page is unreachable, say so; no quote.
> - **No speculation** about Satoshi Nakamoto's identity. No invented dialogue.
> - **Period gear:** give real numbers with sources (for example, the 1956 IBM 350's capacity and size versus a
>   modern microSD card).
> - **Boats:** pick boat types that genuinely existed in that era, with a source for when.
> - **Music:** describe styles and instruments only. No song titles to copy.
> - **Game links:** only legitimate sources (publisher pages, or a library/archive's emulation pages). Note any
>   licence concerns.
>
> **Output:** one Markdown file per era, named `era-<n>-<slug>.md`. Commit them as Bitcoin-Bill on branch
> `gv/research` (from `feature/genesis-voyage`) if you have write access; otherwise paste them back to Billy. End
> with a short list of open questions and anything in BUILD-PLAN.md's era table you would change.

### 2. Astra Codex: water, the driven boat and the islands

> Repo: https://github.com/Bitcoin-Bill/oogaboogaland, branch `feature/genesis-voyage`. Create `gv/water-boat` from
> it.
>
> **Read first:**
> - `AGENTS.md` (ground rules, the scene contract, Engine patterns, Testing).
> - `docs/genesis-voyage/README.md` and `BUILD-PLAN.md`.
> - `src/js/genesis-voyage.js` and `src/js/scene-genesis.js`.
>
> **Goal:** replace the fixed course with open water and a boat the visitor drives.
>
> **Build:**
> 1. **`src/js/genesis-boat.js`** (pure, no DOM):
>    - Throttle (W/S, up/down, left stick).
>    - Steering (A/D, left/right).
>    - Boost while Shift is held (or the Boost button).
>    - Water drag and a top speed per era boat.
>    - Soft collision against island shorelines (circles or capsules).
>    - Docking zones that report "at dock <era>".
>    - Fixed-step updates (AGENTS.md), with no per-frame allocation.
> 2. **`src/js/genesis-world.js`** (pure):
>    - The era islands from BUILD-PLAN.md's table placed in date order across a wide sea.
>    - Each island has a shoreline, a dock, a boarding ramp and a year-sign position.
>    - `eraAt(x, z)` returns which era a position is in.
> 3. **In `scene-genesis.js`**, in a clearly marked "water and boat" section only:
>    - A large animated water surface: cheap, with no per-frame allocation (vertex-free scrolling or pooled
>      ripples).
>    - Island blocks with era year signs (`BL.factoryModels.label`).
>    - A driven-boat camera that follows the boat and keeps drag-to-look.
>    - One original boat model per era, swapped as the era changes, with a small splash.
>    - Keep the existing harbour, stamp desk and panel working, moved onto Era 3's island.
>    - Keep the current ride state machine as **Tour** mode (a button and key; autopilot between docks).
>    - Touch: an on-screen throttle/steer pad. Reuse the existing `#joy-move` if the scene contract allows.
> 4. **Checks:**
>    - A Node unit proof in `test/run.mjs`: drive into a shoreline and stop; boost raises top speed; dock zones
>      report; `eraAt` matches the table.
>    - Update the `genesis ride` browser step for driving.
>    - `node --check` on touched files, and `npm run build`. Don't commit `oogaboogaland.html`.
>
> **Rules:**
> - Vanilla JS, strict CSP, original designs only, smallest shared edits.
> - Don't touch `genesis-props.js`, `genesis-audio.js` or the hop-off/walk code (other streams own them).
> - Commit as Bitcoin-Bill (`185141343+Bitcoin-Bill@users.noreply.github.com`) with an honest AI-assistance note
>   and no session links. Push `gv/water-boat` to the fork. No force-push; never touch OogaBoogaX.
>
> **Report:** what's playable, files changed, checks run, and open questions.

### 3. Claude Code: hop off, walk and the props

> Repo: https://github.com/Bitcoin-Bill/oogaboogaland, branch `feature/genesis-voyage`. Create `gv/walk-props` from
> it.
>
> **Read first:** `AGENTS.md`, `docs/genesis-voyage/README.md`, `BUILD-PLAN.md`, `scene-genesis.js`, and how
> `scene-arcade.js` and `scene-factory.js` drive an Ooga (`pilot.create`, crew `walkable`/`useNear`, footsteps,
> `net.setBody`).
>
> **Goal:** jump out of the boat anywhere near an island, and the boat simply stops. No pause prompt.
>
> **Build:**
> 1. **Hop off and walk** (marked section in `scene-genesis.js`):
>    - Jump out (J, or a Jump out button) stops the boat and spawns the visitor's own Ooga (or the one the portal
>      brought, `world.pilot`) on the nearest walkable ledge.
>    - Walk with the standard pilot and crew.
>    - Walking onto the boarding ramp, or pressing J by the boat, re-boards.
>    - Falling into the water returns the Ooga to the dock.
> 2. **`src/js/genesis-props.js`** (pure registry):
>    - Props have `{ id, era, year, title, sourceKeys, onUse(state), board? }`.
>    - Space or tap to use when near.
> 3. **First props, using Era 3 dossier facts once available, with placeholders marked TODO until verified:**
>    - **A DOS PC:** an original beige-box design with a fake prompt. `DIR` lists era files; `TYPE` shows short
>      era-true text with sources; `HASH <text>` shows the toy fingerprint.
>    - **A hard-drive comparison plinth:** 1956 vs today, with true numbers and sources.
>    - **A stamp-your-own-page desk:** the visitor types a line, it is fingerprinted and added to Tock's chain.
> 4. **Year signs and dates:** every exhibit and prop label shows its year.
> 5. **Checks:**
>    - Unit proofs for the prop registry and fingerprint use.
>    - A browser step: jump out, walk to the PC, use it, re-board.
>    - The leave contract under `?debug=1`.
>
> **Rules:**
> - Don't edit `genesis-boat.js` or `genesis-world.js` (Codex's stream).
> - Same commit and push rules as above, on `gv/walk-props`.

### 4. Claude Code (second session): era music and sound

> Same repo and branch. Create `gv/audio`.
>
> **Read first:** `AGENTS.md` (audio: synthesized, pooled, context created from a gesture and closed in leave,
> through `BL.sound.output`) and existing audio modules such as `carnival-audio.js` and `drop-audio.js`.
>
> **Build `src/js/genesis-audio.js`:**
> - A small synthesized sequencer with one original theme per era.
> - Use era-typical instruments and styles from the dossiers' "Music direction". For example: 1950s small-combo
>   organ and bass; 1970s analog synth pads; 1980s 8-bit square-wave chiptune; early 1990s 16-bit FM; late 1990s
>   breakbeat-lite; 2000s clean electronic.
> - Every motif is newly written; never quote real songs.
> - Crossfade on era change. Boat engine pitch follows throttle; splash on era-boat swap; dial-up handshake for the
>   modem prop.
> - Volume and Mute follow `BL.sound`. Calm mode lowers intensity.
> - Expose `create()` returning `{ wake, setEra, setThrottle, cue(name), dispose }` with no per-frame allocation.
>
> **Checks:** a Node unit proof for the sequencer's scheduling; `node --check`.
>
> Don't edit other streams' files. Same commit and push rules, on `gv/audio`.

### 5. Astra: review and integration check (after each stream pushes)

> Review `gv/water-boat`, `gv/walk-props` and `gv/audio` against `feature/genesis-voyage`, with
> `docs/genesis-voyage/BUILD-PLAN.md` as the spec.
>
> **Check:**
> - The leave contract, no per-frame allocation, and input not leaking while panels are open.
> - Jump out stops the boat without a prompt.
> - Every era label's year matches its dossier, and every claim traces to a source key.
> - No brand marks, ROMs or copied music. No identity speculation.
> - The streams didn't edit each other's files.
>
> **Report:** findings by severity with file, line and a failure scenario. Give the merge order you recommend.

## Order of work

1. **Now, in parallel:**
   - Research (R) on Eras 3, 4 and 2 first.
   - Water and boat (A).
   - Hop off and props (B).
   - Audio (C).
2. Integration merges A, then B, then C into `feature/genesis-voyage`, runs the checks and reports.
3. Fill the eras one at a time from the dossiers, each era a reviewable commit: island, year sign, exhibits, props,
   boat and music.
4. Era 6 (whitepaper finale) and Era 7 (genesis epilogue) last.

---
*Prepared with AI assistance (Claude, by Anthropic) at Billy's request. Not reviewed or endorsed by the Ooga Booga
Land maintainers.*

## Phase 2: filling the caves (from 31 Oct 2026)

The stream and the eight caves are built on `gv/water-boat`: a stream through one 76 × 72 m, 24 m high cave per era,
walkable banks, the visitor's Ooga in the boat, Space to jump out and back in, and a jetpack ashore. Each cave is now
filled from its own file, so several builders can work at once:

- `src/js/genesis-exhibits.js` holds the registry and documents **the kit** each era file builds with: `solid`, `sign`,
  `obstacle`, `prop` (a usable exhibit with a panel, a terminal or a caption), the era's cave and banks.
- `src/js/genesis-era-0.js` … `genesis-era-7.js` are one file per cave, already loaded by the page. **Era 0 is the worked
  example**: Feller's probability shelf and ARPANET's two terminals, each with a panel and sources.
- A unit check (`Genesis Voyage exhibits`) builds every era with a stand-in kit and fails on: a label without its year,
  a source that does not resolve to an https link, an exhibit that opens nothing, or anything outside its cave, off
  the banks or within 1.5 m of the stream. Builders need not edit `test/run.mjs` or `scene-genesis.js`.

| Era file | Cave | Builder | Branch (from `gv/water-boat`) |
|---|---|---|---|
| `genesis-era-1.js` | Networks and Keys, 1970–1979 | Claude Code | `gv/era-1` |
| `genesis-era-2.js` | Trees and Blind Money, 1980–1989 | Claude Code | `gv/era-2` |
| `genesis-era-3.js` | Cypherpunks and Timestamps, 1990–1995 (around the existing room) | Claude Code | `gv/era-3` |
| `genesis-era-4.js` | Work and Scarcity, 1996–1999 | Astra Codex | `gv/era-4` |
| `genesis-era-5.js` | Peers and Reusable Work, 2000–2007 | Astra Codex | `gv/era-5` |
| `genesis-era-6.js` | The Whitepaper, 31 October 2008 | Astra Codex | `gv/era-6` |
| `genesis-era-7.js` | Genesis, 3–12 January 2009 | Astra Codex | `gv/era-7` |
| `genesis-era-0.js` | Machines That Count, 1956–1969 (finish: the IBM 350 moves here, the probability race) | Claude Code (integrator) | `gv/water-boat` |

**Each builder owns only its era file.** Changes needed elsewhere (a new kit feature, a shared model) go to the
integrator as a request, not an edit.

### Prompt: an era builder (Claude Code or Astra Codex)

> Repo: https://github.com/Bitcoin-Bill/oogaboogaland. Create branch `gv/era-<n>` from `gv/water-boat` and build
> **only** `src/js/genesis-era-<n>.js`: the exhibits for the Genesis Voyage's Era `<n>` cave.
>
> **Read first:**
> - `AGENTS.md`.
> - `docs/genesis-voyage/BUILD-PLAN.md`, especially "Phase 2".
> - `src/js/genesis-exhibits.js`, which documents the kit and the rules.
> - `src/js/genesis-era-0.js`, the worked example.
> - The era's dossier on branch `gv/research`: `docs/genesis-voyage/eras/era-<n>-*.md`.
>
> **Build:** fill the cave with fun, explorable technology from its years.
> - The Bitcoin-line exhibits from the dossier, each with a panel: in short, the deeper story, what was still
>   unsolved, with sources.
> - The period gear to play with, from the dossier's table, each with a mechanic the visitor can try: a terminal, a
>   caption sequence, or a panel. Use `update(dt, elapsed, state)` for animation, with no per-frame allocation.
> - The era's easter-egg mini-game ideas, as original toys, where they fit.
> - The caves are 76 m wide and 24 m high, and the Ooga has a jetpack, so use height (galleries, hanging displays).
>   Keep the stream and 1.5 m beside it clear.
>
> **Rules:**
> - Words come only from the dossier's entries that are ready. Anything marked HOLD, deferred or unverified stays
>   out, or is labelled as such.
> - Every label shows its year. Dates say what they mark. Context is labelled context.
> - Original, unbranded models only: no logos, no copied product designs, no ROMs or copied music.
> - No speculation about Satoshi Nakamoto's identity, and no invented quotes.
> - Panel titles use only letters, digits, space and / : ! ? + - .
> - Vanilla JS and strict CSP; build only through the kit.
>
> **Checks:**
> - `node test/run.mjs unit`; the "Genesis Voyage exhibits" check must pass.
> - `npm run build` and `node --check src/js/genesis-era-<n>.js`. Don't commit `oogaboogaland.html`.
> - Try it: `npm run serve`, then open `/src/?wip=genesis`, click your era's plaque, press Space to jump out and walk
>   it.
>
> **Deliver:**
> - Commit as Bitcoin-Bill (`185141343+Bitcoin-Bill@users.noreply.github.com`) with an honest AI-assistance note and
>   no session links.
> - Push `gv/era-<n>` to the fork. No force-push; never touch OogaBoogaX.
> - Report: the exhibits built, each with its dossier entry, checks run, and open questions.

### Prompt: Astra (browser), research and review

> For each era `<n>` in BUILD-PLAN.md "Phase 2": when `gv/era-<n>` is pushed, review `src/js/genesis-era-<n>.js`
> against `docs/genesis-voyage/eras/era-<n>-*.md` on `gv/research`. Check that:
> - every caption, label and panel sentence traces to a ready entry;
> - dates say what they mark, and context is labelled;
> - sources resolve;
> - nothing is branded or copied;
> - there's no identity speculation;
> - the file touches nothing outside its era.
>
> Report findings by severity with line numbers.
>
> In parallel, keep resolving the dossiers' open questions and HOLD items (the chart's unverified entries: PGP 1991,
> CyberCash 1994, the Crypto Anarchist Manifesto 1988, ECC 1985, the Cyphernomicon 1994, Szabo's 1997–98 essays,
> BitTorrent and DHTs 2001), so builders can move them to ready.
