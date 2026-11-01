# Era 5, Peers and Reusable Work (2000–2007): exhibit notes

Facts come from `docs/genesis-voyage/eras/era-5-peers-and-reusable-work.md` on `gv/research` (READY entries only) and
the consolidated research's period-gear records. The era file is `src/js/genesis-era-5.js`.

## Exhibits as built

Unchanged by the upgrade (ids, connections, dates and words):

| Id | What | Connection |
|---|---|---|
| `e5-chord`, `e5-ring` | Chord, 27–31 August 2001 conference paper, and its ring toy | context |
| `e5-hashcash`, `e5-stamp` | Hashcash paper, 1 August 2002, and its work-stamp bench | citation [6] / context |
| `e5-rpow`, `e5-rpow-desk`, `e5-cabinet` | RPOW, 15 August 2004 (10:43:09 PDT), its exchange desk and the sealed-cabinet fingerprint demo | context |
| `e5-bitgold`, `e5-bitgold-bench` | bit gold, December 2005 (qualified), and its bench | influence / context |
| `e5-bittorrent`, `e5-mosaic` | BitTorrent paper, 22 May 2003, and its piece mosaic | context |
| `e5-gps`, `e5-wiki`, `e5-player` | GPS sharpening (1 and 2 May 2000), the volunteer encyclopedia (January 2001), the silent pocket disk player (announced 23 October 2001) | context |
| `e5-loft-trust`, `e5-loft-route` | the two jetpack lofts | context |

## The period-gear cluster (upgrade)

One mat on the right side at u 60 (era coordinates x 13 to 33), between the BitTorrent bench and the far shelf, clear of
the right loft, the gold walk's 1.5 m strip, the reserved plots and the 8 m limit. **68 scene records** (solids, signs,
obstacles and props), counted by `test/genesis-era-5-upgrade.mjs` against the base commit. No point lights, no
per-frame work: the cluster has no animation, and its models change only on a command.

| Id | What | Label year | Connection | Sources |
|---|---|---|---|---|
| `e5-patchwork` | **Peer Patchwork**, an original cooperative packet puzzle (modern museum homage, not historical software). Three simulated peers hold some of nine pieces of an original picture; pass pieces between them until every peer has the whole picture, one send per peer a round. The table shows each peer's board live. | 2003 (the dossier's "2003-inspired cooperative packet mosaic" easter egg) | context | E5-BT |
| `e5-displays` | **CRT and flat panel**, a schematic comparison: a deep box with its glass beside a thin panel on a stand, with depth bars at one schematic scale. No dimensions, weights, screen sizes, products or introduction dates. | 2000s | context | E5-DOSSIER |
| `e5-pocket` | **Pattern Pocket**, a portable media player toy (modern museum homage): six original synthetic visual patterns, a four-slot playlist, a 10-unit storage budget in toy units. No recordings, sound, product shape or brand UI. The device's storage bar follows the playlist. | 2000s | context | E5-GEAR (context for the period gear only) |

**Reuse, not repetition:** the puzzle's banner carries the era's own peer-to-peer line (`PEERS_TEXT`) and points to the
BitTorrent lectern and the RPOW desk for their stories. It explains only its own analogy's limits (LIMITS or MORE): three
honest peers, one upload a round and the visitor routing by hand, while real clients pick and check pieces themselves and
peers come and go; and that the same picture everywhere is copying, not agreeing who owns anything.

**Two faces for each game, one set of rules:**
- `src/js/genesis-era-5-patchwork.js` → `BL.genesisEra5Patchwork = { puzzle(), make(host), terminal(p, extra) }`
- `src/js/genesis-era-5-mixtape.js` → `BL.genesisEra5Mixtape = { player(), make(host), terminal(m, extra), drawPattern }`
- `make(host)` follows the header contract in `src/js/retro-games.js` (reads `BL.retroGames.kit` when called; fixed
  step, seeded deal, no per-frame allocation, `still` honoured, `stop()` drops a held piece or lifted entry).
- `terminal(...)` is how the stations play **today**, through the existing terminal workbench (`host.session` and
  `host.run`), with HELP, MORE and RESET. Until a page loads the modules, those two stations open a board saying the
  game isn't loaded; no other exhibit changes.

## HOLD (kept off display)

- **CRT and flat-panel specifications:** no manufacturer datasheet, manual or museum record was read for this build (the
  build environment had no web access), so no depth, weight, size, resolution or date is shown. Candidates to verify
  before any number goes up: a manufacturer's archived datasheet for one named CRT monitor and one named LCD monitor of
  the same visible size, from the same years. Until then the comparison stays schematic.
- **Any portable player's capacity or interface beyond the dossier's announcement record:** the toy's units are invented.

## Integration requests (for the Genesis tab)

1. **Script tags**, in this order, **before** `genesis-era-5.js` in `src/index.html`:
   `<script src="js/genesis-era-5-patchwork.js"></script>` and `<script src="js/genesis-era-5-mixtape.js"></script>`.
   They read nothing at load; `make()` needs `retro-games.js` (and so `jumbotron.js`) loaded before it is *called*.
2. **Unit runner:** please run `node test/genesis-era-5-upgrade.mjs` (exit code 0 on pass) from the suite or CI.
   With the script tags in place, `genesisExhibitsProof` should also load the two modules before the era files so it
   checks the live terminals rather than the not-loaded boards.
3. **Console hooks for live play** (when the console exists): stage `BL.genesisEra5Patchwork.make(host)` for
   `e5-patchwork` and `BL.genesisEra5Mixtape.make(host)` for `e5-pocket`, with the retro-games host
   (`best, aim, still, onEnd, over, popup, cue, shake, crack, flop`), one 160×120 screen, the pause holding
   `update`, and `stop()` on interruption (both clear input state there). Cue names used: Patchwork `tick`, `bonk`,
   `buzzer`, `win`, `round`; Pocket `tick`, `click`, `buzzer`, `win`, `round`. No music, no audio of their own.
   `status` labels: Patchwork "Rounds" (rounds left; `round` the current round, `target` the fewest possible),
   Pocket "Units" (units free). Neither game relies on `x`; both step with `steps`/`stepsY` and act on Space or tap.
4. **Nothing else:** no shared file, catalogue, timeline, workbench or atrium change is needed. The new ids are stable.
