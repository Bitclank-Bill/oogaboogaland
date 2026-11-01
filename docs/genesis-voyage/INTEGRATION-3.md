# gv/integration-3: the eight era upgrades on the museum

Prepared with AI assistance (Claude Code). Not reviewed or endorsed by the Ooga Booga Land maintainers.

**Base:** `gv/ovh-courtyard` at `92bd57e`. The other branches (`gv/overhaul`, `gv/ovh-atrium`, `gv/ovh-courtyard`,
`gv/integration-2` and every `gv/upgrade-era-N`) are left unchanged.

## Which commit does what

| Item | Commit |
|---|---|
| 1a. Console `close()` cleans up once whatever the game's state, and is safe twice (unit regression) | `7eb86d2` |
| 1b. `wake()` from every console gesture, the touch buttons included (unit regression) | `7eb86d2` |
| 2. Era 0 (`53974ad`, authored as Claude, cherry-picked and committed as Bitcoin-Bill) | `948387e` |
| 2. Eras 1 to 7 merged at `77cd44c`, `bc2a526`, `c2c15c7`, `2cd80bd`, `3556bc0`, `3a2d54c`, `2ec7b30` (no conflicts) | `e8695a2`, `310d87c`, `743e4df`, `5a372e6`, `4f8b8d9`, `c26de86`, `dd6c536` |
| 3a. Era 0's Nim, CRT and pointer answer MORE | `c1bab15` |
| 3a. The placeholder 1956 is no longer shown as a date (modern gallery labels) | `e4b25da` |
| 3b. Era 2 builds the colour screen's palette at build time | `f8c30c6` |
| 3c. Every Era 7 Peer Sync seed is winnable (1762 regression plus a 5,000-seed sweep); the bead layout's counters are preallocated | `5eb9fc8` |
| 4a. Script tags in each era's requested order | `6f5c850` |
| 4b. The eight `test/genesis-era-N-upgrade.mjs` suites folded into `test/run.mjs` | `ecd363f` |
| 4c. The shared proofs load Era 2's cluster, limits raised, `FUD_PATROL_ZONE` in `reservedZones(2)` | `23dc4ae` |
| 4d. The eras' nine playables on the console, terminals kept, Era 2's sign reworded | `96c854c` |
| 4e. Modern toys and games shown as "modern museum toy/game · <span> gallery", out of date ordering | `e4b25da` |
| 4f. `tl-4-wifi` maps to `e4-wireless` (Deep Blue stays unmapped) | `96e9952` |

## Decisions

- **e3-crt:** no Era 3 file builds it, so the id stays reserved and unused, with no prop and no record.
- **The courtyard and the era clusters:** the museum proof keeps every era's pieces, now including the clusters,
  inside their galleries. The courtyard stands only in the atrium, and FUD Patrol's floor is reserved in Era 2's
  gallery, so the two don't collide.
- **The console and the terminals (Addendum A §3):**
  - Walking up to a playable and pressing Space, or tapping it, plays it on the console. The arcade group loads
    first if it's missing.
  - The timeline menu and the workbench's Previous/Next open its terminal. The terminal still works, and its
    banner says the game also plays on the console.
- **The console wiring:** `genesis-era-cartridges.js` registers the nine cartridges from each era's own module, so
  no era file changed for it.

## Evidence

- **Personally executed:** `node --check` on every touched file, a clean `npm run build`, and the unit tier at
  376/376.
- **Automated, software-rendered browser runs** (headless Chromium on SwiftShader at 640 × 400; not a person or a
  device):

  | Check | Result |
  |---|---|
  | The 21 new exhibits each open in the workbench through the host | pass |
  | Their modern gallery labels show | pass |
  | e2-four's terminal is kept, with the console note | pass |
  | One cartridge per era plays through the console (opens, starts, steers, labelled modern original, closes on Escape) | pass |
  | The Music switch toggles | pass |
  | No page errors | pass |
  | Walking up to e1-paddle and pressing Space opens its cartridge | pass (debug placement, real key) |

  - **The first walk-up attempt failed:** the probe looked exhibits up wrongly. It passed on one corrected rerun.
- **Scene records at arrival:**

  | Commit | Records | Drawn |
  |---|---|---|
  | `cb2b0b9` | 2483 | 1204 |
  | this branch | 2970 (+487) | 1472 (+268) |
- **Not tested by people:** play feel, frame rate on real devices, touch and sound.
- **Known:**
  - e1-paddle's walk-up hint is still its terminal's ("Type S to serve…"). It's era story text, so it's left
    unchanged.
  - Era 6's gallery label reads "31 October 2008 gallery", from the era's own years.
