# The Genesis museum (redesign, branch `gv/museum`)

Billy's candidate-3 playtest changed the direction: one museum cave walked on foot, not a boat down a stream.
Candidate 3 (`db28481793e7a31b71d6bea8b7b923843fbf9ff7`) is untouched; this work starts from it on `gv/museum`.

## What the visitor finds

- **Arriving:** the visitor arrives on foot by the statue in the entrance hall (the old harbour, now floored), with
  the white timeline on the left. A short corridor leads into one long hall.
- **The hall:** each era keeps its exhibits and coordinates, one after another down both walls in date order.
  - The promenade runs down the middle where the stream ran: polished stone with a gold edge line.
  - The joins between eras are floored and walled.
  - Each era's sign (in its own era's signage) hangs over the promenade where the next era begins; the last is on
    the end wall.
- **Removed:** the boat, water, Tour, boarding, ramps, splashes and the boat's buttons.
- **The legend:** a huge white screen in the entrance hall, an original timeline in the style of a "prehistory"
  fishbone chart, painted from the museum's own exhibits.
  - Every exhibit hangs off the time line at its date. **A line is a date only, never a claim of influence.**
  - Gold marks a whitepaper citation, a gold ring documented influence, and grey context.
  - The paper (31 October 2008) and the first block (January 2009) stand apart.
  - A tap on it, Space beside it, the Timeline button or G opens **the timeline menu**: every exhibit as a button, by
    era and date, with how it connects. Its filters are All, Steps toward Bitcoin and Context. Choosing one opens its
    workbench.
- **The workbench** (`genesis-bench.js` and the scene's `bench`): one broad window for every exhibit.
  - **Left:** a clear stage through which the visitor sees the exhibit's own model. The camera frames it there, so a
    command's result shows on the model, live; the old terminal hid it.
  - **Under the stage:** the command line, Run, Reset, and the exhibit's own commands as buttons, read from its HELP.
    A command that takes words fills the input instead of running.
  - **Right:** how it connects, in short, how to use, the deeper story and clickable sources, with no line repeated.
  - **Previous / Next:** every exhibit in date order (the arrow keys too, away from the input).
  - **Take me there** walks the Ooga to the exhibit; **Close** (or Escape) puts the camera back exactly where it was.
  - **While open:** the Ooga, the crew and the desk's show are held, and the exhibit's own era keeps running so its
    model answers. Typing stays in the input (the walking keys do nothing); taps and drags on the stage do nothing.
    Calm holds decorative motion while command results still show; mute and explicit pause work as before.
  - **On narrow screens** it stacks the stage, the command line and the story.
- **Panels:** the overview boards and Fingerprints and Time's lectern stay panels (`hud.openBoard`).

## Assets found (as the brief asked)

- **The video:** `Screencast_From_2026-10-31_19-36-54.webm`, uploaded twice: `e8b220aa-…` and `ba2aaf57-…`, the same
  file by SHA-256 `49c4986b…5b88`. 1920 × 1080, VP8, 32.8 s, 25.2 MB.
  - It is a screen recording of an animated, revised "Bitcoin prehistory" timeline. It credits "Style after 'Bitcoin
    prehistory' by @danheld" and "Sources: Satoshi Nakamoto Institute Library and others", and marks whitepaper
    citations in orange.
  - Its first seconds include the player's controls. The earlier brief gives its source as
    https://x.com/unchained/status/2116516745284333716/video/1.
- **The image:** `1dfa9b72-com.google.Chrome.WSYZOO`, a 1973 × 1371 WebP, SHA-256 `1029a47e…944b`. It is the
  "Bitcoin prehistory" chart ("Created by: @danheld · Inspired by: @anselLinder @btcmrkts").
  - The consolidated research's `chart-verify.md` checks its dates. Several of its items are HOLD, and its "2008
    Bitcoin launched" conflates the paper with the launch.
- **Neither is committed or shown.** Their reuse licence isn't documented, and Billy said the legend may be
  "something similar, doesn't have to be identical". The legend is our own design from the verified exhibits.
  Showing the originals in the cave would need a documented permission first.

## Checks for this checkpoint

- **Unit:** `genesisBenchProof`, against all 77 exhibits:
  - every exhibit opens something the workbench can show;
  - no terminal's right column repeats a line;
  - the buttons come from each exhibit's own HELP;
  - the framing lands a model's centre on the stage's centre in both layouts, within reach;
  - date order holds.
- **Unchanged:** the earlier proofs, including the boat and boarding proofs of the still-present pure modules.
- **Browser:** an automated, software-rendered pass; see the checkpoint's `START-HERE.md`.

## What remains

- **The hall is long:** about 640 m end to end, because each era keeps its 72 m block. "Around its perimeter" is met
  by both long walls. Folding the hall into a squarer room would mean moving every era's block, which waits for a
  decision. The menu and Take me there are the shortcuts.
- **Exhibit placement is unchanged:** each era's exhibits keep their bank layout. Some walk-up spots face the
  promenade, and the camera frames from there.
- **Era words:** some exhibits' words still mention the stream or the boat. They're era-owned text, unchanged here.
- **Unused modules:** `genesis-boat.js` and the boarding helpers in `genesis-world.js` are no longer used by the
  scene. They're kept, with their checks, until the redesign is accepted.
- **Calm by key:** R pitches the walking camera, as in other walking scenes, so Calm is the Calm button.
- **Not tested by people:** human playtesting, phones and touch, and listening.
