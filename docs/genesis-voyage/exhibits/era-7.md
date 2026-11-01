# Era 7: Genesis (3–12 January 2009): exhibits as built

The epilogue keeps three events apart: the genesis block's header timestamp (3 January 2009), the software release
email (8 January 2009) and block 170's early test payment (12 January 2009 UTC). Facts come only from the Era 7
dossier (`docs/genesis-voyage/eras/era-7-genesis.md` on `gv/research`) and the sources listed in
`src/js/genesis-era-7.js` `SOURCES`. Every exhibit is **context**: none is on the Steps toward Bitcoin trail.

## The three islands (unchanged)

| Id | What | Dossier entry |
|---|---|---|
| `e7-genesis`, `e7-genesis-panel` | the first block's record case (header fields, the stored headline as recorded data, why its output is special) and its panel | The first record [E7-GEN] |
| `e7-desk`, `e7-desk-panel` | the software desk: the 8 January 2009 email and three simulated terminals | The software desk [E7-REL] |
| `e7-payment`, `e7-payment-panel` | the counting table: 50 counters into 10 and 40, block 170 beside Finney's 2013 recollection | An early test payment [E7-170, E7-FIN] |

The Bitcoin Core source is pinned to the v28.0 release commit `110183746150428e6385880c79f8c5733b1361ba`.

## The launch cluster (gv/upgrade-era-7)

One compact group on the right side past the software desk (bank frame u 42.5 to 55, v 4.5 to 10.5), clear of the
dock, the lamps and the walk, and inside gallery 7. It adds 130 scene records. No point lights, no sound, no new music.

| Id | What | Connection | Sources |
|---|---|---|---|
| `e7-sync` | **Peer Sync**, a cabinet whose three windows and record pips show the run live. A modern museum homage made in 2026, labelled so, not historical software. | context | E7-REL, E7-DOSSIER |
| `e7-pc` | **A January 2009 computer corner**: an invented, unbranded desk with a tower, flat screen, keyboard and mouse, and a panel. | context (January 2009 context) | E7-REL |
| `e7-frame` | **The counting frame**: 50 beads in three zones (input, output 1, output 2) that you move by hand; every reply counts all three, and a lamp lights on block 170's 10 + 40. | context (original demonstration) | E7-170, E7-170-TXS |

### Peer Sync (`src/js/genesis-era-7-sync.js`, `BL.genesisEra7Sync`)

- **Rules** (`createRules`), pure and seeded: three terminals keep the same records. Each beat brings one event: a new
  record shared by every plugged-in terminal, a link dropping (never the last one plugged in), or a broken record
  that every plugged-in terminal refuses. Plugging a terminal back in checks the link and copies exactly what it
  lacks. A run is won when all three hold the same 8 records; it ends after 40 beats otherwise. A seed replays a run.
  - Scoring: a win scores 300 to 1000, fewer beats and fewer terminal-beats unplugged scoring higher. An unfinished
    run scores 30 per record reached (at most 240).
- **Playable today** through the workbench's terminal: `WAIT`, `PLUG B`, `COMPARE`, `NEW`, `RESET`, `MORE`, `SOURCES`.
- **Screen version** (`make(host)`): retro-games.js's factory interface on `BL.retroGames.kit`'s 160x120 screen.
  - Left and right (`aim.steps`) pick a terminal; Space or a tap (`act`) plugs it in, or starts a run when idle.
  - It uses the kit's fixed step and allocates nothing in `update` or `draw`.
  - It calls `over()` once when the run is decided, then `onEnd(score)` after the end beat.
  - With `host.still` (Calm) it stops the drop flash and the shake.

### What is held back (HOLD, not on display)

- The dossier's laptop comparison (an October 2008 configuration with 2 GB of memory and a 160 GB drive, E7-GEAR). Its
  manufacturer page could not be reached from this build's network, so it is not verified. The corner shows no
  specifications and names no product.

## Integration requests (for the Genesis tab)

1. **Script tag:** add `<script src="js/genesis-era-7-sync.js" data-defer="genesis-scene"></script>` immediately
   **before** `genesis-era-7.js` in `src/index.html`.
   - Until then the era builds without `e7-sync`: the corner and the frame still stand, and the unit tier passes either
     way.
2. **Checks:** run `node test/genesis-era-7-upgrade.mjs` from the unit tier or a package script (16 checks, no Chrome,
   no build). It reports PASS/FAIL lines and exits non-zero on a failure.
3. **Console for the screen version.** These are hooks the console must provide; this branch defines no `onUse` result
   for them.
   - **Loading:** `make(host)` reads `BL.retroGames.kit` when it is called. `retro-games.js` is in the deferred `arcade`
     group, so a hosted page must `await BL.deferred.load("arcade")` first.
   - **Screen:** after `update(dt)`, call `draw(ctx)` on `BL.retroGames.kit.screen().ctx`, then lay that 160x120
     canvas wherever the console shows it.
   - **The host object:** `{ aim: { x, hold, steps, y, stepsY }, still, onEnd(score), over(), cue(name, gain) }`.
     - `still` is `host.view.calm`.
     - `cue` may map to `host.cue`, or be omitted. Its names are `tick`, `miss`, `hit`, `win` and `lose`.
   - **Input:** left/right and A/D step `aim.steps`; Space, Enter or a tap call `act()`. On interruption (blur, the
     workbench closing, the menu opening) clear the held keys and call `stop()`.
   - **Pause:** while `host.view.paused`, stop calling `update`; `draw` may still be called.
   - **Dispose:** the game holds no listeners, timers or audio. `stop()` is enough, and the shared screen canvas
     belongs to the kit.
4. **Optional console hook:** expose `BL.genesisEra7.visit.cl` (the cluster's live rules and frame) under
   `__ooga.genesis` for browser probes.

## Rules kept

- Chain records hold amounts, keys and stored times, never names.
- Finney's account is his 19 March 2013 recollection, not part of the record.
- "Early test payment", never an unqualified "first transaction".
- No brands, logos, copied interfaces, ROMs or copied music, no identity speculation and no invented quotations. The
  only quotation added is the release email's own sentence, already in the dossier.
