# Architect mirror cave

Draft PR #827 implements the maintainer-authorized mirror observatory, starting
from upstream `rock` at `45e02fd428cc0734b3c9a3f8f173bf741d68a094`.

## Walking through

The driven Ooga crosses the existing mirror at one o'clock into an enclosed,
circular white chamber: a central chair and 51 framed monitors in three rows.
The doorway behind the arrival returns the same Ooga outside the mirror.
A brief pale veil softens the crossing. The old glyph room remains retired;
shots and melee still ripple the unbreakable mirror. NPCs respect its barrier.

`architect-cave.js` owns the chamber. Its volume is below the island at y=-48,
in the existing hub graph and `mirror` zone. This is a separate physical room,
not a second simulation: donations, NPC ownership, remote interpolation and
live feeds continue through their existing owners. It creates no new backend,
subscription, scene retention override or independently simulated crew. The
main hub's existing release/retention policy still applies when leaving it.

Walking and airborne collision keep the Ooga within the walls and below the
ceiling. The chair is solid; the camera stays inside the chamber. Leaving the
controlled Ooga returns the free camera outside. Restoring a pose within the
chamber activates its room presentation.

## Preparing on approach

Within 18 world units of the mirror, and six vertically, the hub prepares the
room geometry and uploads its meshes. Repeated approaches reuse that work.
No network asset is required: this is prebuilding and GPU warming, rather than
a network fetch. Captures and audio begin only on entry. A direct debug arrival
uses the same preparation path if nothing has been warmed yet.

The room remains prepared for the hub visit, with four bounded camera targets;
leaving the hub releases them with their owning geometries. Context restoration
recreates targets and quality changes select the current target size.

## Live camera screens

Four texture slots are repeated across the wall. Every eight seconds one visible
slot switches to the next channel, with a name below its picture. The catalog in
`observatory-cameras.js` currently covers eleven views: the banana pile, Mempool
lake, Merge Rock, Bifrost chamber, the B.C.A./Arcade/Factory/EntropyLab/mirror
entrances, Timechain Sphere exterior and Bifrost islet. These are live rendered
views, without CPU pixel reads, image encoding or another WebGL context. The
previous picture is hidden until the newly named channel has a fresh capture.

- High/medium: 256 x 144 pixels, each feed no more often than every 90 ms.
- Low: 192 x 108 pixels, each feed no more often than every 200 ms.
- At most one visible feed per displayed frame, rotating between due cameras.
  Actual refresh rate falls with display frame rate; this is not 60 Hz video.
- Captures stop outside the chamber, when no screen using the feed is visible,
  and while the document is hidden.
- Each feed has its own view, frustum and short far plane. The current world is
  updated once. Captures reuse its instance buffers and omit new shadow maps,
  postprocessing, recursive screens, mirrors, portal pictures and light beams.
- Small details are omitted, preserving character parts and the pile explicitly.
  Existing foliage silhouettes remain; the pile uses its distant banana shell.
- Canvas 2D draws the room with honestly labelled offline screens.

Four high-tier color targets use 576 KiB before depth attachments. Source world
geometry and simulation dominate the memory budget; screen count does not
multiply the number of cameras or textures.

### Separate areas and eventual coverage

`observatory-bifrost.js` is the first separate-area observer. It reuses the
entrance window's reduced chamber model in a camera-only graph, with independent
geometry identities, lighting and no shadows. Source identity excludes that
graph from the hub, every other feed and the main view. It never enters Bifrost's
interactive scene or opens a second simulation, audio graph or network session.

A fixed pool of 32 simple Ooga silhouettes reads the public chamber poses already
received by `net.remotes`, at 10 Hz. Bodies with missing or mismatched `poseZone`
are hidden. There are no invented visitors. Chamber motion is a lightweight
approximation: rings and glyph move locally, and travel-window charge follows
visitor proximity. Exact machine phase, gaze, costumes and recursive world
windows are omitted. Multiplayer observation still needs acceptance testing.

Observer models are built only while selected inside the Observatory, and their
GPU resources are released on rotation or exit. The shared catalog and bounded
slots let future adapters add areas without retaining every interactive scene.
The planned progression is other public interiors (lab, B.C.A., Factory, Arcade,
Mempool chamber), DSB and its public rooms, then public Timechain rooms and game
areas. Each needs its own camera representation and a check of which current
state is available. Locked/private rooms must respect their access rules; an
unavailable state must not be presented as a live feed. Those adapters are not
implemented in this PR yet. The goal is eventual coverage of every eligible area.

### Geometry observations

Initial local browser captures, at noon with the simulator and network disabled,
showed the entrance cameras at roughly 403k (B.C.A.), 494k (Arcade) and 467k
(mirror) submitted triangles. The wider pile view varied with passing Oogas and
reached roughly 837k; it was subsequently narrowed and moved closer to the pile.
These are renderer submission counts, **not GPU timing or device benchmarks**.

One island terrain draw contributes 223,115 triangles to each of these views.
Additional cave/terrain sections also survive their shared broad bounds. In the
wider pile view, one character mesh alone contributed 110,080 triangles. This
explains why resolution alone is not enough, and why tight entrance framing is
cheaper than a broad crowd view. The implementation does not repartition the
shared terrain or simplify other contributors' character geometry.

The expanded catalog's Bifrost observer submitted **7 draw calls / 11,098
triangles** without visitors in the local browser. Merge Rock was about 294k
triangles. Hub entrance feeds still include the large terrain batches above;
the adapter approach is substantially cheaper for separate interiors. These
figures are individual captures, not a sustained performance benchmark.

With `debug=1&pos=1`, the existing position display's `data-cameras` contains
current per-camera capture, draw-call and triangle counts, plus the five largest
mesh contributors from its first capture. The normal page does not allocate
that profiling map. Full-frame/GPU timing and representative mobile acceptance
remain to be measured before merging.

## Sound

`architect-audio.js` follows Bifrost's lifecycle discipline, with an original
palette: a low electrical resonance, filtered ventilation, gently beating
monitor tones, sparse soft relay ticks and a descending crossing tone. It does
not reuse Bifrost's motif, heartbeat, world chords or recordings.

Six oscillators and one looping noise source are built once after browser audio
activation. Slow controls update at 10 Hz, with no per-frame or per-cue node
allocation. The monitor texture grows toward the walls and pans with the view;
the center is quieter. Weather audio is disabled inside. The pictures have no
soundtrack or duplicated outdoor voice.

The existing **Room hum** channel and master mute control the sound. Leaving
fades it out and suspends its context; hidden tabs do likewise. Returning reuses
the graph, and hub disposal closes it and removes listeners. Headphone/laptop
listening and long-session balance are still maintainer acceptance work.

## Validation and preview

The authorized checks are `npm run build`, syntax checks on every changed JS/MJS
file, and the requested in-game browser screenshots. Browser interaction covered
live screens, walking into and out of the mirror, returning to the same room,
wall collision and a jump, with a clean console on the updated page.

The existing mirror regression checks retain shot/melee, unbreakable-surface and
scene-round-trip assertions, update the gate expectation, and add real-key
entry/return checks with idle capture assertions. The automated suite has not
been run: AGENTS.md defaults to waiting unless fast/full tests are requested.
Additional regression assertions cover cycling through the catalog with four
stable texture slots, pending pictures, isolated observer geometry, stale-zone
pose rejection and source disposal. Manual browser review covered the rotating
wall and framing; these new automated assertions have not been run either.
Multiplayer sessions, context-loss recovery, lower-tier/mobile profiling and
listening acceptance remain before review readiness. Keep the PR draft.

Local source preview after building:
`src/index.html?debug=1&view=architect&character=w-s-bitcoin&nosim=1&net=0&welcome=0&pos=0&hour=12&firstperson=1`
