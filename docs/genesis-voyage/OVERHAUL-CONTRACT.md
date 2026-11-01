# Genesis overhaul: the interface contract (v1)

**Branch:** `gv/overhaul` on Bitcoin-Bill/oogaboogaland, from `gv/museum` 0238f67. That in turn descends from candidate 3,
`db28481793e7a31b71d6bea8b7b923843fbf9ff7`, which stays untouched on `gv/integration-2`.
**Owner:** the integrator (one tab).
**Builders:** the workbench tab and the timeline-menu tab. Each branches from the freeze commit named at the foot, works only
in its own files, and reports a branch and SHA. The integrator merges. Fork only: no upstream PR, deployment, force-push or
committed `oogaboogaland.html`.

This fits the engine as it stands: classic IIFE modules on `window.BL`, the scene contract in `AGENTS.md`, the exhibit kit
in `genesis-exhibits.js` and the props registry in `genesis-props.js`. Nothing here asks a builder to invent an engine
piece.

## 1. Exhibit identity and the catalogue (`BL.genesisCatalogue`, integrator)

- **The id is the prop id** an era file already registers (`e2-merkle`, `e4-hashcash`, `e6-ref-3`). There are also the
  scene's own `pc`, `drives` and `book`, and Fingerprints and Time's `era3-room-haber1991` and `era3-room-bayer1993`.
  - Ids are stable: never renamed or reused. A menu, test or URL may store them.
- **Built once a visit**, after every era is built: `catalogue = BL.genesisCatalogue.create(...)` (the scene does this).
  - `catalogue.entries` is frozen and in chronological order.
  - **Order:** `yearKey(year)` (a decade such as `"1980s"` sorts as 1980.5), then era, then build order. This is the
    order of Previous/Next everywhere.
- **Each entry** (read-only):

  | Field | Meaning |
  |---|---|
  | `id`, `index` | stable id; position in `entries` |
  | `era`, `eraName`, `eraYears` | 0–7 and its name and years (`genesis-world.js` `ERAS`) |
  | `year`, `yearKey`, `date` | the label's year (number or `"1980s"`); its sort key; an optional precise date string as the era file gives it |
  | `title`, `label`, `hint` | as the era file gives them (the label always shows the year) |
  | `connection`, `connectionLabel` | one of `citation`, `influence`, `anchor`, `demonstration`, `bibliography`, `context` (`genesis-exhibits.js` `CONNECTIONS`) |
  | `trail`, `step` | on the Steps toward Bitcoin (citation, influence, anchor) and its number, else `false`/`0` |
  | `ref` | the whitepaper reference (`"[3]"`) for a citation or a bibliography entry, else `""` |
  | `demonstrates` | for a demonstration: the trail ids it shows working (it is never a step of its own) |
  | `listedAs` | for a bibliography slot: the citation stop's id upstream with the same `ref` |
  | `timeline` | ids of the research timeline records (`tl-…`) this exhibit stands for; may be empty |
  | `sources` | `[{ key, label, href, kind, verified }]`, resolved from `sourceKeys` |
  | `status` | always `"READY"`: era files only build from READY dossier entries |

- **Lookups:** `catalogue.get(id)`, `indexOf(id)`, `next(id)`, `prev(id)` (wrapping), `filter("all" | "trail" | "context")`.
- **The research timeline:** `BL.genesisTimelineData.records` (integrator, generated from the consolidated research's
  `genesis-timeline-events.json`).
  - It holds **only the READY records**. HOLD records are not shipped, so nothing can render them.
  - Each record keeps the research fields: `id`, `era`, `lane`, `date`, `dateLabel`, `title`, `sign`, `kid`, `deep`,
    `connection` (`whitepaperRefs`, `documentedInfluence`, `contextOnly`), `sources`, `milestone`, `renderAs`.
  - `exhibit`: the catalogue id it maps to, or `null` when no exhibit stands for it yet.
- **Evidence rules everyone keeps:**
  - Gold or "on the trail" only for `trail` entries.
  - A demonstration or a bibliography slot is never shown as a step.
  - `context` is labelled context.
  - A line or neighbour on a timeline is a date relation only, never drawn or worded as influence.
  - No HOLD item, invented date or new claim. Text comes from the entry, the record or the exhibit's own terminal or board.

## 2. How the menu selects an exhibit

- `host.open(id, "menu")` opens the workbench for that catalogue id.
  - It returns `false`, and opens nothing, for an unknown id.
  - The menu closes itself first (`host.menuClosed()`).
- A timeline record with `exhibit: null` may be shown, but it can't be selected. The menu shows it as "no exhibit".
- Walking up to a physical exhibit and pressing Space, or tapping it, calls the same `host.open(id, "walk")`.
  - Previous/Next in the workbench call `host.open(catalogue.next(id).id, "browse")`.
  - So all three use one path.
- The in-world white screen (the legend in the entrance) is a canvas the menu module paints:
  `BL.genesisTimeline.paint(ctx, width, height, catalogue, records)`. It's pure drawing, called once a visit. The
  integrator owns its geometry, place and pick box, and opens the menu on a tap, on Space beside it, on the Timeline
  button and on G.

## 3. How the workbench mounts a demonstration

The demonstration **is the exhibit's world model**, built by its era file and updated by that era's `update`. The workbench
does not copy or re-create it. It shows it through a **clear stage**, a transparent region of its panel. The integrator's
camera frames the model inside that region, so a command that changes the model shows live.

- **`host.session(id)`** opens the exhibit once (it calls the prop's `onUse`) and returns:
  - `{ entry, terminal, board, caption }`, exactly one of the last three non-null.
  - `terminal` is the era file's own object: `{ banner: [lines], prompt, run(line) → { lines, cls?, entry? } }`.
  - `board` is `{ room, pages: [{ caption, title, text }], sources }`.
  - Every exhibit already answers `HELP` and `MORE`. Most answer `RESET`, which restores the model exactly.
- **Run:** `host.run(id, line)` runs it, records any side effect (a stamped page's toast) and returns `run`'s result
  (an error becomes `{ lines: ["That command did not run: …"] }`). Use this, not `terminal.run` directly, so the host
  sees it.
- **Reset:** `host.run(id, "RESET")`. An exhibit without RESET says so in its reply; don't fake one.
- **Stage:** `host.stage(rect)`, with the stage's `DOMRect` (viewport pixels), on show, on resize and whenever the layout
  moves. The host frames the model's centre in that rect at about 60% of its height (`genesis-world.js` `frame`), easing
  normally and cutting in Calm. `host.stage(null)` means the stage isn't visible.
- **Update:** nothing for the workbench to call each frame. While it's open the host runs only the open exhibit's era
  `update` (with `state.reading = true`), so the model answers commands, and holds everything else.
- **Dispose:** `host.close({ there })`. The host restores the camera exactly, gives the controls back, and with
  `there: true` walks the Ooga to the exhibit instead (Take me there). The workbench removes its own listeners and DOM
  state in its `dispose()`.

## 4. Input, pause, Calm, mute and closing

- **While the workbench or menu is open:**
  - the host has called `pilot.setActive(false)`, so the Ooga, the camera controls, taps on the world and drags are held;
  - the scene's `onKey` ignores every key;
  - the director already ignores keys typed into fields.
  - The open module handles its own keys on its own root: Escape closes, Enter runs, and ArrowLeft/ArrowRight browse
    when the input isn't focused. It must not leave key handlers on `document` or `window` after `dispose`.
- **Ambient activity:** the crew, the desk show, the other eras' updates, era music changes and captions are held by the
  host. The open exhibit's era keeps running.
- **Explicit pause (P or the Pause button):** holds everything, including the open exhibit. A command still returns its
  text. The model catches up when play resumes. `host.view.paused` says which.
- **Calm:** `host.view.calm`. The host already passes it to era files, which hold decorative motion and show results in
  their final state. The workbench and menu use no animation in Calm or under `prefers-reduced-motion`.
- **Mute:** page-wide (`sound.js`) and the host's audio. Modules play no sound of their own; ask `host.cue(name)` for an
  existing cue if you need one.
- **Closing:** Close, Escape or `host.close()` restore the visitor's position, view and controls exactly. Focus returns
  to the canvas. Narrow screens (≤ 760 px) stack the stage, then the command line and actions, then the story.

## 5. Who owns which files

**The workbench tab (new):**
- `src/js/genesis-workbench.js` provides `BL.genesisWorkbench.create(host, root) → { show(id), hide(), get isOpen(), resize(), dispose() }`.
- `genesis-bench.js`'s `sections` and `actionsFrom` (the right column and the buttons). `frame` moves to
  `genesis-world.js` and `order` to the catalogue, both the integrator's.
- Inside the shared files, only between its markers:
  - `<!-- genesis-workbench:begin/end -->` in `src/index.html`;
  - `/* genesis-workbench:begin/end */` in `src/style.css`;
  - `// genesis-workbench:begin/end` in `test/run.mjs`, for `genesisWorkbenchProof`.

**The timeline-menu tab (new):**
- `src/js/genesis-timeline.js` provides
  `BL.genesisTimeline = { paint(ctx, w, h, catalogue, records), create(host, root) → { open(focusId), close(), get isOpen(), dispose() } }`.
- Inside the shared files, only between its markers:
  - `<!-- genesis-timeline:begin/end -->` in `src/index.html`;
  - `/* genesis-timeline:begin/end */` in `src/style.css`;
  - `// genesis-timeline:begin/end` in `test/run.mjs`, for `genesisTimelineProof`.

**The integrator:** everything else, namely:
- `scene-genesis.js`, `genesis-world.js`, `genesis-exhibits.js`, `genesis-props.js`, `genesis-audio.js`, `genesis-voyage.js`;
- the new `genesis-catalogue.js` and `genesis-timeline-data.js`;
- every `genesis-era-<n>.js` (adapted to the new room, never rewritten);
- the script tags, the markup and styles outside the markers, `test/run.mjs` outside the markers, and the docs.

A builder who needs a host change asks for it. They don't edit a shared file.

**The host object** is the only coupling, frozen at v1:

```
host = { catalogue, records, view: { calm, paused },
         open(id, from), session(id), run(id, line), stage(rect), close({ there }),
         menuClosed(), sourceOf(key), cue(name), toast(text) }
```

## Billy's tree video and chart: what is actually available

- **The video:** `Screencast_From_2026-10-31_19-36-54.webm`, uploaded twice (same SHA-256 `49c4986b…`), 1920×1080, VP8,
  32.8 s.
  - It's a screen recording of an animated, revised "Bitcoin prehistory" timeline, credited "Style after 'Bitcoin
    prehistory' by @danheld".
- **The chart:** a 1973×1371 WebP (SHA-256 `1029a47e…`) of the "Bitcoin prehistory" chart, "Created by: @danheld".
- **Neither has a documented reuse licence, so neither is committed or shipped.**
  - The menu builder works from the structured research timeline (49 READY records) and the catalogue, in a similar
    but original style.
  - The research's `chart-verify.md` records which chart items are HOLD (several), and that "2008 Bitcoin launched"
    conflates the paper with the launch.
  - No replacement asset is fabricated.

## Freeze

The host, catalogue and timeline data land in the commit whose message starts **"Genesis overhaul: interface freeze"**
on `gv/overhaul`. Its SHA will be posted. That commit also moves the gv/museum prototype's workbench and menu into the
two builder files as their starting point. From then on each builder owns its file and the host is v1.
