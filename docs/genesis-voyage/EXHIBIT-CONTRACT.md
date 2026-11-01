# Genesis Voyage: the era-exhibit contract

How one era's exhibits plug into the voyage. The kit itself is documented at the top of `src/js/genesis-exhibits.js`,
and `src/js/genesis-era-0.js` is the worked example. This file adds who owns what, the shared signage every cave gets,
the plot rules and the hand-over. BUILD-PLAN.md "Phase 2" lists who builds which era.

**Integration base: `gv/exhibits`, from `gv/water-boat` at `aa9154224b7ac284cc53d5684e81c46f9ef41a27`** (the stream, the
eight caves and the exhibit kit). Build era branches from `gv/water-boat` or `gv/exhibits`. **Never** start from
`feature/genesis-voyage` at `12f7c4f`: that is the old single-cavern ride, with no caves, banks, stream or kit.

## Who owns what

| Owner | Files |
|---|---|
| Integrator (Claude Code) | `src/js/scene-genesis.js`, `genesis-exhibits.js`, `genesis-props.js`, `genesis-world.js`, `genesis-boat.js`, `genesis-voyage.js`, and `genesis-era-0.js` (per Phase 2); `src/index.html` and `src/style.css`; `test/run.mjs`; the shared signage below; this file, `BUILD-PLAN.md`, `README.md`, `sources.md` and `AGENTS.md` |
| Era builder *n* (1 to 7, see Phase 2) | `src/js/genesis-era-<n>.js`, and that era's exhibit notes in `docs/genesis-voyage/eras/` (for example, an "Exhibits as built" section in its dossier) |
| Research | the dossiers `docs/genesis-voyage/eras/era-<n>-*.md` (on `gv/research`) |
| Audio (`gv/audio`, not yet integrated) | `src/js/genesis-audio.js` |

A builder never edits a shared file. The era files are already loaded by `src/index.html`. If you need something the
kit doesn't offer, ask the integrator.

## What every cave gets without you (shared signage)

- **Era sign:** a large sign on the cave's far back wall, over the way out, facing the arriving boat. It shows the
  years and the era's name, painted in that era's own signage (scene-genesis.js `ERA_SIGN_STYLES`, original designs).
- **Entrance:** a stone pylon on each bank's gateway naming the era and its years.
- **Sightlines:** keep the line from the stream to the overview board and to the era sign clear. The unit tier checks
  your solids, the lamp posts and the pylons against it.
- **Overview board:** on the left bank's gateway. It shows the era, its years, your `overview.summary`, and your
  exhibits by year, with trail steps starred. Space beside it, or a tap, opens its panel: the summary, the exhibits,
  and the whole Steps toward Bitcoin trail with this era's steps marked.
- **Steps toward Bitcoin:** every prop whose `connection` is `citation`, `influence` or `anchor` joins one trail,
  numbered in date order across all eras. A gold path runs along each bank's waterside walk to it, with chevrons
  pointing downstream (later in time), and a **STEP n** post stands beside it. Its panel gains a last page, "How it
  connects": the connection, the reference, your `date`, and the step. A `context` prop's last page says it is
  context.
- **Captions and plaques:** the boat's captions and the harbour's timeline plaques count your exhibits. Footsteps,
  falls, boarding ramps, Tour stops and the leave contract keep working without you.

Every label must still show its year: your `kit.sign` labels, and each prop's `label`.

## The kit, plus the optional fields this contract adds

As in `genesis-exhibits.js`: call `BL.genesisExhibits.register(n, { sources, overview, build(kit), update, dispose })`
once.

- **`overview: { summary, pages, sourceKeys }`** (all optional):
  - `summary`: at most 280 characters, for a curious 12-year-old. Shown on the era's overview board and panel.
  - `pages`: at most 3 board pages that follow the summary in that panel, for the era's own guide (what to try, how
    to read the cave).
  - `sourceKeys`: links for those pages.

  Don't build a second overview board, era sign or "steps" sign: the shared signage provides them.
- **`kit.prop(def)`** takes three optional fields:
  - `connection`: `"citation"` (whitepaper reference list; give `ref`, e.g. `"[3]"`), `"influence"` (documented with a
    primary source such as Satoshi's own words), `"anchor"` (the whitepaper itself, Era 6 only), `"demonstration"` or
    `"context"`. Leave it out and the exhibit is neither on the trail nor labelled; please set it on every Bitcoin-line
    exhibit.
  - `"bibliography"` with `ref` (Era 6's shelf only): an entry of the whitepaper's own reference list. It is neither
    uncited context nor a second stop: its "How it connects" names the citation stop upstream with the same reference,
    and the scene throws if there isn't exactly such a stop. The unit tier checks that [1] to [8] each appear once.
  - `hint`: an optional short line (at most 90 characters) of what to do there, shown when the visitor walks up, in
    place of the exhibit's title and year.
  - `demonstrates`: a demonstration's list of the trail stops whose idea it shows working (ids, e.g. Era 3's press:
    `["era3-room-haber1991", "era3-room-bayer1993"]`). A demonstration is never a stop of its own, so the trail
    keeps one stop per paper; its "How it connects" names those stops by their step numbers. An id that isn't a
    trail stop throws when the cave is built.
  - `ref`: citations only.
  - `date`: what the year marks, in words, e.g. `"1991 journal publication; manuscript received 19 August 1990"`.
- **`pick`** may name its centre: `{ w, h, d, x, z }`. Put the tap box over the model itself; without `x` and `z` it
  stands on the prop's `at`, the walk-up point.

**Prop ids:** yours start `e<n>-` (e.g. `e3-timestamp`). Ids starting `era<n>-` belong to the shared signage (the overview board is `era<n>-overview`). A duplicate id throws.

A prop with a bad connection (a reference on context, a citation without one, the anchor outside Era 6) throws when
it's built, and the unit tier reports it.

## Calm, and leaving or entering your cave

- **`update(dt, elapsed, state)`:** `state` is `{ era, walking, reading, x, z, calm }`.
  - While `state.reading` is on (a panel or a terminal is open), hold anything that would call for the visitor's
    attention, such as a pager. `kit.notify(text)` toasts a short notice, made ahead rather than per frame.
  - While `state.calm` is on (the visit's Calm: reduced motion, the R key or the system setting), hold decorative
    movement and blinking still.
  - Show each command's result at once, in its final, readable state.
  - Readouts that carry information may still change.
- **`active(on, state)`** (optional, on your `register` definition): called with `false` when the visitor (aboard or
  ashore) leaves your cave and `true` on entering it.
  - Stop anything that outlives your frames, such as sound scheduled ahead on the audio clock.
  - Coming back must not resume it.
  - Your context stays for the visit; `dispose` closes it on exit.
- **Unchanged:** sound still starts only from a gesture and goes through the page-wide mute (`BL.sound.output`).
- **Reference:** Era 1 is the worked example (`hush`, `active`, and the `calm` branches in `update`).

## Fingerprints and Time on the trail

The Era 3 room's two whitepaper citations, Haber–Stornetta 1991 [3] and Bayer–Haber–Stornetta 1993 [4], are trail
stops linked to its existing lectern, which opens their panel. Era 3's builder should **not** rebuild those papers as
new exhibits to put them on the trail.

## Plots

genesis-world.js gives each bank a frame:

- **u:** metres downstream from the cave's way in (0) to its far end (72).
- **v:** metres from the stream's edge (0) out to the wall (about 34).

`bankFrame(n, side)` and `bankToWorld(frame, u, v, out)` convert; `reservedZones(n)` lists the plots no exhibit may
use. The unit tier checks every `solid`, `obstacle` and prop use point against them:

- **Stream:** keep the stream and **1.5 m** beside it clear. That strip is the waterside walk, where the trail runs
  at v ≈ 0.9.
- **Gateway:** stay out of the cave's first **10 m** (u < 10) on both banks, which holds the pylons and the overview
  board.
- **Dock:** stay out of the dock and its boarding ramps, u 32 to 40 out to v 6 on both banks.
- **Lamps:** stay out of the three lamp posts' squares.
- **Era 3:** on the left bank, stay out of Fingerprints and Time's room and its margin; build around it.
- **Height:** nothing taller than **8 m** above the bank (jetpacks keep the air above).
- **Obstacles:** put a `kit.obstacle` under every solid exhibit, so walkers and jetpacks bump into it. Keep anything a
  visitor could walk under above 2.4 m.

## Rules for words and models

These come from BUILD-PLAN.md Phase 2.

- **Dossier as authority:** words come only from your era dossier's READY entries; HOLD and unverified stay out or
  are labelled as such. Dates say what they mark. Context is labelled context.
- **Quotes:** at most 15 words, only from pages actually read, and never invented for real people. Guides are invented
  Oogas. Nothing about Satoshi Nakamoto's identity.
- **Models:** original and unbranded: no logos, copied product designs, ROMs or copied music. Emissive colour is
  welcome; add no point lights, because the scene's light budget is spent.
- **Panel titles:** carved in the sign alphabet (letters, digits, space and `/ : ! ? + - .`). The scene maps `·` and
  dashes to hyphens and drops the rest in the title only.
- **`update(dt, elapsed, state)`:** runs every frame while the visitor is in your cave and must allocate nothing.
  Keep per-visit nodes in module variables that `build` sets and `dispose` drops.

## Hand-over

1. **Build:** on `gv/era-<n>` (from `gv/water-boat` or `gv/exhibits`), in your era file only. Run
   `node test/run.mjs unit` (the "Genesis Voyage exhibits" check must pass), `node --check src/js/genesis-era-<n>.js`
   and `npm run build`. Don't commit `oogaboogaland.html`.
2. **Push and report:** push `gv/era-<n>`, and report each exhibit with the dossier entry it comes from.
3. **Integrator:** reviews it against the dossier, runs the unit tier and a browser pass (jump out, walk to each
   exhibit, open its panel, board, Tour, two round trips under `?debug=1`), and merges into `gv/exhibits`. Nobody
   force-pushes, opens an upstream PR or deploys.
