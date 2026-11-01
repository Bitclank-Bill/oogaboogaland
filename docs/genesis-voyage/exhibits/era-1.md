# Era 1 exhibits as built: Networks and Keys (1970–1979)

Builder notes for `src/js/genesis-era-1.js`, for the integrator's review. Branch `gv/era-1-exhibits`, based on
`gv/exhibits` at `0ec45a0521f5fcaa891fb09634608a3f1db2857b` (the exhibit contract, shared signage and trail), itself
from the cave base `gv/water-boat` at `aa9154224b7ac284cc53d5684e81c46f9ef41a27`. This branch changes only the era
file and this note.

Authority: `docs/genesis-voyage/eras/era-1-networks-and-keys.md` on `gv/research` (`4b0d1b8`), and
`docs/genesis-voyage/EXHIBIT-CONTRACT.md` on `gv/exhibits`.

## Classification

Every Era 1 exhibit is **context** (`connection: "context"`). The dossier finds no Bitcoin whitepaper citation and no
documented influence in this decade, so nothing here joins the Steps toward Bitcoin trail. The cave keeps the
distinction visible anyway:

- **Left bank, gold signs: ideas.** These cryptography and networking ideas help explain Bitcoin's setting. Every
  panel ends by saying it is not a whitepaper citation.
- **Right bank, plain signs: period technology.** The decade's gear, labelled as context and "not a step toward
  Bitcoin".

## What stands where

`u` is metres downstream from the cave's way in. `v` is metres from the stream's edge. Every exhibit is at v ≥ 8, so
the waterside walk, the trail strip, the dock and both ramps stay clear.

| Prop id | What | Bank, u | Opens | Dossier entry | Sources |
|---|---|---|---|---|---|
| `e1-gateway` | Networks meet at a gateway | left, 24 | panel (3 pages) | Exhibits: Networks meet at a gateway | E1-CK, E1-RFC |
| `e1-gateway-puzzle` | Gateway puzzle: PING, ROUTE, SEND, RESEND, ASSEMBLE, 3 rounds; numbered fragments arrive out of order and one short, a link is down each round | left, 24 | terminal | same, plus Easter egg "Gateway Sort" | E1-CK, E1-RFC |
| `e1-merkle` | Merkle's puzzles | left, 35 | panel | Exhibits: Merkle's puzzle post | E1-MERKLE-HISTORY, E1-MERKLE, E0-WP |
| `e1-puzzle-post` | Puzzle Post: open one of 48 boxes (toy model of the work gap) | left, 35 | caption | Easter egg "Puzzle Post" | E1-MERKLE-HISTORY, E1-MERKLE |
| `e1-dh` | Public-key workbench panel | left, 48 | panel | Exhibits: Diffie–Hellman's public-key workbench | E1-DH |
| `e1-dh-table` | Key-exchange teaching table: p = 23, g = 5; PICK, SEND, SHARE, EVE, TRY (Eve's brute force), MIDDLE (no authentication) | left, 48 | terminal | same | E1-DH |
| `e1-rsa` | Checkable signatures panel | left, 61 | panel | Exhibits: RSA's checkable signature desk | E1-RSA, E1-RSA-SNI, E0-WP |
| `e1-rsa-desk` | Toy signature desk: n = 33, e = 3, d = 7; SIGN, VERIFY, DOUBLE (two conflicting payments both verify) | left, 61 | terminal | same, plus Easter egg "Public Check" | E1-RSA, E1-RSA-SNI |
| `e1-floppy` | 8-inch floppy panel | right, 17 | panel | Gear: IBM 8-inch floppy | E1-FLOPPY-IBM, E1-FLOPPY-CHM |
| `e1-floppy-toy` | Handling toy, 4 steps: sleeve, slot, load (spinning hub, lamp, original "instruction card" animation), eject | right, 17 | caption | same | E1-FLOPPY-IBM, E1-FLOPPY-CHM |
| `e1-panel` | Microcomputer panel | right, 31 | panel | Gear: Altair 8800 | E1-ALTAIR |
| `e1-panel-toy` | Original front panel: 8 switch levers, data and address lights, a hanging 256-light tray (one per byte); FLIP, SET, DEPOSIT, EXAMINE, CODES, RUN; challenge: spell OOGA | right, 31 | terminal | same | E1-ALTAIR |
| `e1-coupler` | Acoustic coupler panel, labelled not yet verified | right, 45 | panel | Gear note: coupler "not cleared" | dossier link |
| `e1-coupler-toy` | Coupler demo: SEND/BITS text as bits; original two-pitch synthesized tones, slowed down; bit lamps and byte bars | right, 45 | terminal | same | dossier link |
| `e1-timeline` | Timeline wall: 9 dated plaques (gold for ideas, plain for gear) | right, 59 | panel | Captions 1–9 | all of the above |

Also present:

- Two section signs just past the gateway (u 11.5): "IDEAS · 1970–1979" (gold) and "PERIOD TECHNOLOGY · 1970–1979".
- `overview`: a 247-character summary and 3 guide pages (Left bank, Right bank, How to play) for the shared overview
  board.

The era sign, pylons and overview board are the shared signage's, as the contract requires.

## Date wording (what each date marks)

| Date | Marks | Source key |
|---|---|---|
| 1971 | IBM begins selling floppy drives | e1FloppyIbm |
| May 1974 | Cerf and Kahn's journal paper published | e1CerfKahn |
| Autumn 1974 | Merkle's puzzle proposal, by his own account | e1MerkleHistory |
| December 1974 | RFC 675 (Cerf, Dalal, Sunshine) specification | e1Rfc675 |
| January 1975 | Altair 8800 magazine-cover introduction | e1Altair |
| 3 June 1976 / November 1976 | DH manuscript received / journal issue | e1DH |
| 4 April 1977 / 1 September 1977 / February 1978 | RSA manuscript received / revised / journal | e1RSA, e1RSASni |
| April 1978 | Merkle's puzzles article published | e1Merkle |

The 1974 gateway paper is never described as the later switch-over of networks to TCP/IP. Its panel says it is a
separate, later milestone, and gives no date, because none is sourced here. RSA is labelled with both its 1977
manuscript and its February 1978 journal dates. Merkle's puzzles are kept apart from his 1980 paper cited as [7].

## Deliberately not claimed

- **Acoustic coupler:** the dossier says model, styling and speed are "not cleared". The exhibit claims no model, no
  date beyond "1970s", and no baud rate. Its pitches (620 and 940 Hz) and slowed bit time are invented and say so.
  Its only source is the dossier itself, as a HOLD note. Its general description (a handset in two cups, data as
  sound) is explanatory framing, not a sourced fact. Replace it when research clears a documented model.
- **No RSA or DH in Bitcoin:** both panels say a Bitcoin signature does not mean RSA or this key exchange.
- **Toys are not security:** every key, signature and puzzle toy is labelled a simplified toy model. TRY shows Eve
  searching the tiny space. The front panel is "not an emulator" and runs no copied firmware; RUN is a labelled museum
  shortcut. The letter codes are labelled "a teaching aid".
- **Floppy:** no claim beyond IBM 1971, 8 inches, and the CHM's read-only 80 KB microcode loader. The model is
  enlarged, about ×3, and unbranded, and the loading cards are an original animation.
- **Quotes:** four short passages the dossier records as read: "different packet switching networks", "select a key
  over open communications channels", "minimize the need for secure key distribution channels" and "Anyone can
  verify this signature". Each is under 15 words.
- No logos, product artwork, ROMs, copied music, invented quotes or identity claims. Eve and Bo are invented figures.

## Engineering

- **Kit only.** Models are built from `solid`, `sign`, `obstacle`, `prop`, `label`, `createNode`, `place` and
  `addChild`. Repeated parts share one geometry each: 256 tray lights, 48 puzzle boxes, 8 levers, 16 lights,
  6 packets, 8 bars. There are no point lights.
- **Bounded state, rebuilt each visit.**
  - Memory is a `Uint8Array(256)` and the address wraps.
  - The coupler holds at most 128 bits in a `Uint8Array`.
  - There are at most 6 packet fragments.
  - Counters are capped.
  - Terminal input goes through `genesisProps.clean` (60 characters).
- **`update` allocates nothing.** It only mutates preallocated nodes: positions, rotations, scale and `visible`.
  Measured in Node with `--expose-gc`, the heap delta over 200,000 and over 2,000,000 frames was flat, about 37–50 KB
  both times. That is one-time JIT noise, not growth.
- **Sound.**
  - One `AudioContext`, one oscillator and one gain, created on the first SEND or HELLO. That happens only from a
    terminal submit while `navigator.userActivation.isActive`.
  - It goes through `BL.sound.output`, so the page mute applies, and if muted the toy says so and shows only lamps.
  - New sends cancel scheduled automation and reschedule on the same voice.
  - `dispose` stops the oscillator and closes the context.
  - Note: this is a module-level voice owned by the era file, since the kit exposes no audio. If the integrator adds a
    kit audio hook, the coupler should move onto it.
- **Disposal.** `dispose` closes audio and drops all per-visit state and nodes; the nodes leave with the scene root.

## Checks run

- `node --check src/js/genesis-era-1.js`: passes.
- `node test/run.mjs unit` on this branch: **351/351**, including the contract's "Genesis Voyage exhibits" check
  (reserved plots, height limit, connections, trail order).
- `npm run build`: passes. `oogaboogaland.html` was restored, not committed.
- A scratch harness (not committed, since test-runner edits are the integrator's) checks more than the unit tier:
  - every placed node, not only `solid` and `sign`, stays inside the cave, outside the reserved plots and the walking
    strips (x in -7 … 14), and below 8 m;
  - use points are not inside obstacles, and props are at least 2 m apart;
  - panel titles use the sign alphabet, and every page has a caption, title and text;
  - every prop is `context` with a `date` and a pick centre;
  - overview size and sources;
  - the gateway puzzle solves all 3 rounds, a down route fails, and ASSEMBLE before RESEND fails;
  - DH keys match on both sides, and Eve's TRY finds the same key;
  - RSA: every message from 2 to 32 signs and verifies, a changed message fails, and DOUBLE gives two valids;
  - the panel spells OOGA, wraps after 300 deposits, and RESET clears it;
  - the coupler caps at 16 characters;
  - garbage and 500-character input never throws;
  - dispose, then update, then rebuild works.

## Suggested rule checks for the integrator (test/run.mjs)

1. Apply the cave, reserved-plot and height checks to nodes added with `place()`, not just `solid` and `sign`.
2. Require `connection` and `date` on every era prop. Today `connection` is optional.
3. Allow a prop `year` like `"1970s"` explicitly, or require integers. The shared overview sorts with
   `a.def.year - b.def.year`, which falls back to build order for a string year.
4. Drive each terminal prop's `HELP` and `RESET` and assert that both return lines.
5. Count allocations across `update` frames with `--expose-gc`, per era.

## Browser and device limitations (honest)

- Not seen in a browser. Headless Chromium in this container never finished entering the Genesis scene; it still
  hadn't after 400 s.
- The repo's own `genesis` browser session times out at 120 s here on the unchanged base `gv/water-boat` too, so this
  is the container's software rendering, not this era.
- So the following are **unverified**: placement, sign sizes and overlaps, readability of the gold sign text, the
  animations, panels and terminals in the real dialog, touch (USE), the coupler's audio, and frame rate.
- **Web sources not reopened.** The sandbox's network blocks the source sites (403). Sources marked
  `verified: true` rely on the dossier's record that its researcher opened them on 31 October 2026.

Needed in the integrator's browser pass:
- jump out in Era 1 and walk to all 15 props;
- open each panel and terminal;
- play the gateway puzzle and the panel challenge;
- check the coupler under mute and unmute;
- check sign widths (the longest gold signs are about 6–7 m);
- two round trips under `?debug=1`.

---
*Prepared with AI assistance (Claude Code) at Billy's request. Not reviewed or endorsed by the Ooga Booga Land
maintainers.*

## Integration changes (Claude Code, integrator, while the Era 1 builder is paused)

These close two gaps from Era 1's acceptance checklist, through the shared hooks in EXHIBIT-CONTRACT.md "Calm, and
leaving or entering your cave".

- **Calm:** `update` now holds the decoration in Calm: no blinking host or disk lamp, no spinning hub, no flying
  packets or key tokens, no stamp bounce, no card cycling, no handset jiggle. Each command's result shows at once:
  the lamps, the disk where its step puts it, the verdict. The coupler's bit lamps and bars still read out the data.
- **Coupler on leaving the cave:** `active(false)` now cancels the coupler's tones scheduled ahead (they could run
  about nine seconds after leaving) and clears its readout. Coming back schedules nothing until a new SEND or HELLO.
  STOP and RESET use the same `hush`.
- **Unchanged:** gesture-only start, the page-wide mute and disposal on exit.

The shared unit check "Genesis Voyage Era 1 lifecycle" proves these. Against this branch's original file it fails on
both gaps.

## Upgrade cluster: at home in the 1970s (branch `gv/upgrade-era-1`, base `cb2b0b9`)

Three museum toys in the right bank's living room, at about u 49–56 and x 22–33 in Era 1's old coordinates. That spot
is inside the gallery and well back from the walk (x ≥ 21). The cryptography stations, the acoustic coupler and every
existing id are unchanged.

| Id | What | Opens | Walk-up point |
|---|---|---|---|
| `e1-tv` | **Home TV**: a toy tuner. Commands: POWER, UP and DOWN or DIAL n (the toy's channels 1–12), FINE + and −, SWITCH A or B (the console's selector box), WHAT and PATH. Dials 2, 8 and 11 carry invented programmes (colour bars, a night sky, a fish tank), the console comes in on dial 5 (A) or 6 (B), and the rest are snow. Each station is clear at one fine setting. | terminal | x 24.4, u 52 |
| `e1-paddle` | **Ooga Paddle**: a turn-based paddle-and-ball game on an original Ooga console (cream case, walnut front, orange knobs on two controllers). Commands: S to serve, then U, D or W, up to 8 a line. It's a 20 × 9 court and first to 5 wins. It is seeded, so RESET replays it. The rally shows on the TV when the TV is tuned to the console. | terminal | x 27, u 49.9 |
| `e1-calc` | **Pocket calculator**: a toy with 8 places, working left to right. A ninth digit is refused, long answers are cut to fit (not rounded) with a note, and an answer that's too big, or a division by zero, shows E until C. The model is enlarged about six times and shows eight red seven-segment places. | terminal | x 30, u 54.9 |

- **Every new terminal** opens with HOW TO USE (3–4 steps). Each answers HELP, MORE (the workbench's story column),
  SOURCES and RESET, and each prop carries a `hint`.
- **Classification:** all three are **context**. Their labels read "1970s", which places them in this gallery's
  decade; see HOLD below.
- **Scene records:** the base has 1408 and the head 1551, so the cluster adds **143**. They're measured with the same
  counting kit in `test/genesis-era-1-upgrade.mjs`. The TV replaced the lounge's orange armchair, and the coffee table
  lost its magazines and pot.
- **No point lights.** The screens, lamps and segments are emissive only.

### HOLD: no historical claim is made

The brief asks for sourced references: the historical paddle console, the TV connection and period, and the
calculator's specifications. This build's sandbox network refused every source host (HTTP 403 from the proxy), and the
Era 1 dossier on `gv/research` has no entry for any of the three. So:

- No date, maker, model, price, speed, display size or connection type is claimed for any real product. Each MORE
  ends: "the historical reference for this toy is on HOLD until a source is verified".
- The TV teaches tuning in general (a tuner picks one channel; the console's picture comes in as one more channel).
  It names no period connection (no channel numbers of a real system, no RF or modulator labels). PATH says the real
  connection is on HOLD.
- The calculator's 8 places are the toy's own, stated as such, not a specification.
- The only source key, `e1HoldNotes`, is marked `verified: false` and points to these notes.
- **Before display as history:** verify each item from a manufacturer archive, manual, patent or museum record, then
  replace the HOLD lines and keep the "1970s" label only if the evidence supports it. Candidates to research: the
  first home paddle-and-ball console and the arcade game, their introduction dates, how such consoles connected to a
  TV, and early pocket calculators' dates and display widths.

### Live console (for the Genesis tab)

`src/js/genesis-era-1-paddle.js` (new, not yet loaded) exposes `BL.genesisEra1Paddle.make(host)`. That returns
`BL.retroGames.pong(host)`, the arcade's Ooga Pong, untouched except for its display name ("Ooga Pong · museum
homage") and a `museum` note. It keeps retro-games.js's factory interface exactly. `BL.genesisEra1Paddle.needs`
lists the hooks a console host must provide; see the integration requests in START-HERE.

### Checks

`node --expose-gc test/genesis-era-1-upgrade.mjs` runs 40 rule checks:
- ids and labels, HOLD wording, no brands, no period connection;
- placement in the gallery, walk-up points clear and 2 m apart, the records budget;
- the paddle game's determinism, end and RESET;
- the TV's tuning, fine tuning, wrap, PATH and RESET;
- the calculator's arithmetic, cut, ninth digit, E, divide by zero and bad keys;
- idle still, snow flickering, Calm still, results at once;
- the adapter's interface and needs; disposal.

The heap check is evidence only: a stable heap does not prove there is no per-frame allocation.
