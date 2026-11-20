# Architect mirror cave

Draft PR #827 implements the maintainer-authorized mirror observatory, starting
from upstream `rock` at `45e02fd428cc0734b3c9a3f8f173bf741d68a094`.

## Walking through

The driven Ooga crosses the existing mirror at one o'clock into an enclosed,
circular chamber with black walls and ceiling, 608 small framed monitors, a pale
floor and a padded swivel chair. A reflecting mirror behind the arrival matches
the island cave's
five-metre-wide, three-metre-high visible opening. Walking through its glass
returns the same Ooga outside the island mirror. The mirror fills a flush opening
in the continuous wall mesh; its sides meet
the adjoining wall facets exactly, and the return threshold follows its glass.
The same 0.05-metre margin separates the TV rows, floor and ceiling. Four rows
fit the mirror's three-metre height; eight more continue above it. Both monitor
width and height are halved, preserving the earlier widescreen proportions. Light strips
at the ceiling and floor are removed.
A brief pale veil softens the crossing. The old glyph room remains retired;
shots and melee still ripple the unbreakable mirror. NPCs respect its barrier.

`architect-cave.js` owns the chamber. Its volume is below the island at y=-48,
in the existing hub graph and `mirror` zone. This is a separate physical room,
not a second simulation: donations, NPC ownership, remote interpolation and
live feeds continue through their existing owners. It creates no new backend,
subscription, scene retention override or independently simulated crew. The
main hub's existing release/retention policy still applies when leaving it.

Walking and airborne collision keep the Ooga within the walls and below the
ceiling. The chair has a solid cushion, back and armrests that rotate together
over a fixed five-spoke caster base. Move and jump onto the cushion, then press
Space to sit (or sit from nearby on the floor). Looking around or Q/E swivels
the occupied chair; movement or Space stands up into clear floor ahead of it.
Sitting places a pen in the Ooga’s existing right hand. Both first and third
person keep the default seated arm and wrist pose, anchored to the body. Looking
down moves the camera, so the pen naturally moves through the frame with the arm.
The grip uses the character’s existing fist builder, preserving its palm, finger
layout, size and hand color; only its original thumb folds over the clicker.
Clicking depresses the thumb and button, then springs them back over 170 ms.
The same hand appears in the room, reflections and face feed. Standing restores
the original fist geometry. Left-click (or tap the view), without moving the cursor,
toggles area feeds and the face broadcast using the same outward sweep. The
chosen view stays until the next click; standing removes the pen and resumes
automatic transitions. A click during a sweep queues the chosen view until the
current sweep completes. The existing crew sitting/standing lifecycle owns cleanup.

Primary and secondary weapons, ammunition and jetpack ownership are parked for
the visit. Their HUD buttons disappear and equipment keys cannot bring them out.
Leaving restores the saved loadout using the same weapon parking path as Bifrost
and the Factory; changing the controlled actor and scene cleanup also release it.
The camera stays inside the chamber. Leaving the controlled Ooga returns the free camera outside. Restoring a pose within the
chamber activates its room presentation.

## Preparing on approach

Within 18 world units of the mirror, and six vertically, the hub prepares the
room geometry and uploads its meshes. Repeated approaches reuse that work.
No network asset is required: this is prebuilding and GPU warming, rather than
a network fetch. Captures and audio begin only on entry. A direct debug arrival
uses the same preparation path if nothing has been warmed yet.

The room remains prepared for the hub visit, with at most 34 small camera targets (32 area feeds and a clean face seed and a live face buffer);
leaving the hub releases them with their owning geometries. Context restoration
recreates targets and quality changes select the current target size.

## Live camera screens

The 608 screens share **32 simultaneous camera slots**. Every 15 seconds inside
the room, one slot takes the next view that is not already on the wall. All slots
take their turn, including those behind the viewer; rendering still skips feeds
with no visible screens. Rotation pauses outside the room and in hidden tabs,
with no catch-up burst. Rotation also pauses during face broadcasts, prewarming and tile waves. A changed
slot retains its last captured picture until the replacement has rendered; switches
do not insert a CONNECTING or blank frame. Initial startup still needs a first capture.

The catalog in `observatory-cameras.js` currently contains **34 views**: the
original eleven (pile, lake, Merge Rock, Bifrost chamber, five cave entrances,
Sphere exterior and Bifrost islet), seven public Timechain rooms, B.C.A. office,
EntropyLab floor, HQ, HQ basement, Mempool chamber, Library nook, HQ window gallery
and north pass, plus three Factory views, three Arcade views and two Hangar views.
These are 34 camera views, not 34 distinct protocol zones.
The wall mixes single screens with 2×2 and 3×3 mosaics. Each mosaic divides one
image across its panels, allowing for the bezel gaps and cropping without
stretching. Labels beneath the screens are removed. Independent groups share
slot textures, with balanced random placement forbidding matching neighbors,
including diagonals and the wrap around the room. Adjacent tiles of one deliberate
mosaic are the exception. New groups exclude neighboring channels from both the
old and new layouts, preserving this separation during the wave too. A proposed
3×3 that exhausts the available choices splits into singles rather than repeating
a neighboring channel.

The arrangement is rebuilt every 20–30 seconds while area feeds are selected, and
each return from the face view gets a fresh arrangement. Any region can become
singles, 2×2s or 3×3s. Destination pictures warm before a roughly 4.2-second wave
starts at the mirror, spreading outwards with the bottom rows leading. Tiles
change individually in row order with small tile jitter and larger row jitter.
Splitting a 3×3 preserves its remaining old image tiles until their individual
turns; assembling one replaces the nine old tiles individually. Each tile checks
its destination again before switching. A delayed capture holds the outgoing
picture and the transition waits to finish. Channel rotation pauses throughout,
so an outgoing mosaic cannot lose or change its backing channel mid-wave.
A pen click during regrouping queues the requested face/area view after that wave.
Travel or changing actor cancels an unfinished regrouping to the last whole layout.

Warmups include off-screen destinations, alternating with the face camera when
needed so neither starves on a slow frame budget. They use the existing 32 targets
and the same global capture limit. UV meshes are cached in a bounded set of at most
28 variants per slot (14 tile positions across two wall pitches); regrouping does
not add cameras, textures, readbacks or per-frame geometry allocations.
Adding catalog entries does not allocate additional screen targets. There are no pixel reads, image encoding or additional
WebGL contexts.

- High/medium: 256 x 144 pixels. Low: 192 x 108 pixels.
- At most one visible or explicitly prewarming feed per displayed frame, rotating fairly between due cameras.
  Total capture work is also limited to about 30 captures/second, dropping to 15
  when average frame time exceeds 24 ms, then 8 or less above 40 ms. This is based
  on smoothed render-frame intervals, not a GPU timer or a promised frame rate.
  With all 32 slots visible, the 30-capture limit permits roughly 0.94 updates per
  feed per second; 15 permits roughly 0.47. These are ceilings, not measurements.
- Nearby screens request a refresh no sooner than 160 ms, medium screens 350 ms,
  and distant screens 700 ms, multiplied by 1.5 on low quality. The largest visible
  duplicate determines a slot's cadence. Off-screen feeds are idle except for a requested layout warmup; no catch-up burst.
- Only the source selected for this frame's capture updates visitors and transforms,
  joins the renderer's records, or uploads instances. Source captures traverse only
  that source's record list, instead of scanning all hub geometry in every pass.
  Angles of one room share its geometry and visitor pool. Camera proximity no longer
  activates the hub's optional portal/particle effects or the lake's cosmetic effects.
- Captures stop outside the chamber and while the document is hidden. A feed
  with no visible screen stays idle unless it is warming for the next layout.
- Each feed has its own view, frustum and short far plane. The current world is
  updated once. Captures reuse its instance buffers and omit new shadow maps,
  postprocessing, recursive screens, mirrors, portal pictures and light beams.
- Small details are omitted, preserving character parts and the pile explicitly.
  Existing foliage silhouettes remain; the pile uses its distant banana shell.
- Canvas 2D draws the room with honestly labelled offline screens.

Thirty-two high-tier area targets use 4.5 MiB before depth attachments; the shared
face camera adds two buffers totaling 0.28 MiB as it starts capturing. Source world
geometry and simulation dominate the memory budget; screen count does not
multiply the number of cameras or textures.

### Face broadcast

While nobody is controlling the chair, a randomized 34–56 seconds of regular
feeds is followed by an approximately 4.2-second wave that replaces
individual screens with the same live close-up of the controlled Ooga. It begins
at the return mirror and spreads away around both sides. Bottom rows
lead upper rows; fresh row and panel jitter makes the edge irregular. Every
screen holds the complete face for a randomized 6–10 seconds, then the same outward pattern
assembles a new mosaic arrangement. The timer pauses in hidden tabs and resets on
travel or changing the controlled character. Automatic transitions are disabled
while the player sits in the chair; clicking owns the choice until they stand.

One camera follows the actual authored head transform and proportions, including
looking and swiveling. It includes the actual room behind the Ooga: walls, floor,
chair and the TV wall, with its camera kept inside the chamber. Background TVs show the Ooga’s face with recursion capped at one nested layer.
The prewarm captures a clean image before any screen switches to faces; that
image is held inside the background TVs for the whole transition. The foreground
close-up stays live in a separate buffer. The deepest image therefore contains
ordinary area feeds, never another face broadcast. This prevents feedback from
deepening over time and avoids sampling the framebuffer being written; it adds
no nested captures. In this camera image only, sixteen extra face screens fill
the return-mirror opening. The clean seed uses an area feed in those tiles,
so they cannot introduce another recursive layer. The real room’s mirror stays
visible and usable. Mirror reflections and portal effects remain excluded. Its image is shared by every panel. It prewarms before the
wave and waits for its first valid capture. During the broadcast it requests up
to ten captures per second (less on low quality or slow frames), within the same
global capture budget; it never adds an extra capture pass to a frame. Area feeds
with no visible panels stop capturing. No separate avatar or simulation is made.
The debug position display's `data-observatory` reports the phase and changed
panel count alongside the existing camera counters.

### Separate areas and eventual coverage

`observatory-bifrost.js` is the first separate-area observer. It reuses the
entrance window's reduced chamber model in a camera-only graph, with independent
geometry identities, lighting and no shadows. Source identity excludes that
graph from the hub, every other feed and the main view. It never enters Bifrost's
interactive scene or opens a second simulation, audio graph or network session.

A fixed pool of 32 simple Ooga silhouettes (`observatory-visitors.js`) reads the public chamber poses already
received by `net.remotes`, at 10 Hz. Bodies with missing or mismatched `poseZone`
are hidden. There are no invented visitors. Chamber motion is a lightweight
approximation: rings and glyph move locally, and travel-window charge follows
visitor proximity. Exact machine phase, gaze, costumes and recursive world
windows are omitted. Multiplayer observation still needs acceptance testing.

`observatory-timechain.js` supplies the seven non-lockable Sphere rooms. It takes
their sphere dimensions, floors and raked seating from `timechain-rooms.js`, with
very simple furniture silhouettes for the museum, temple, workout room, party
stage and planetarium projector. These are reduced structural representations,
not full-fidelity room captures. Museum exhibits and other furnishings are
approximate. The dome stays blank: films, lecture slides, sky playback, decorative
effects and interactive machine state are omitted rather than invented. Only
existing public remote poses animate the room views. No interactive room scene,
deferred Timechain bundle, media session or extra subscription is started. The
Conference Room is excluded by the catalog and rejected by the observer factory.

`observatory-workshops.js` adds the public Factory hall, Arcade hall and Hangar.
Factory cameras share its existing entrance-window model; Arcade cameras share
its authored hall, mezzanine and cabinet layout with simplified furniture. The
Hangar is a low-poly representation of its public hall, runway, workshop and Jet
silhouette; dimensions mirror `hangar-models.js` without loading that bundle.
Cabinet games, factory forwards/flashes, engine tests and projector media are
omitted. Locked Hangar side rooms are absent. Public visitors use the existing
zone-checked silhouette pool; no NPC activity or machine state is invented.

Observer models are built only while selected inside the Observatory, updated
only when captured, and released when their last angle rotates out or on exit. The shared
catalog and fixed slots let future adapters add areas without retaining every
interactive scene or increasing texture count. Additional observer models still
need geometry budgets. DSB Land, its buildings, Ember Den and game interiors remain
future work; each needs a camera representation and an available-state check.
The goal is eventual coverage of every eligible area, respecting room access.

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

Initial reduced Timechain captures submitted about 840–10,344 triangles per
view without visitors. The underlying hub interiors remain heavier (roughly
96k–532k in this preview); the slot scheduler does not make each hub capture
cheaper. Real device performance and multiplayer fidelity still need acceptance.

With `debug=1&pos=1`, the existing position display's `data-cameras` contains
current per-camera capture, draw-call and triangle counts, plus the five largest
mesh contributors from its first capture. The normal page does not allocate
that profiling map. Before the denser mosaic layout, a local 32-feed snapshot showed a smoothed render-frame interval of about 13.3 ms
at the arrival view, with all slots capturing and no console warnings/errors.
Factory views submitted 16,195–18,267 triangles; Arcade 1,056; Hangar 744,
without visitors. This is one desktop preview, not a before/after benchmark,
GPU timing or a claim about mobile performance. Representative device acceptance
remains before merging.

## Sound

`architect-audio.js` follows Bifrost's lifecycle discipline, with an original
palette: a low electrical resonance, filtered ventilation, gently beating
monitor tones, sparse soft relay ticks and a descending crossing tone. It does
not reuse Bifrost's motif, heartbeat, world chords or recordings.

Seven oscillators and one looping noise source are built once after browser audio
activation. Slow controls update at 10 Hz, with no per-frame or per-cue node
allocation. The pen’s dry two-part click uses a pooled filtered-noise branch
and a brief resonant tone: its latch sounds at the 50 ms thumb press, followed
by the quieter spring release. It follows the Room hum channel and master mute.
The monitor texture grows toward the walls and pans with the view;
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
wall collision and a jump, with a clean console on the earlier 152-panel page.

The existing mirror regression checks retain shot/melee, unbreakable-surface and
scene-round-trip assertions, update the gate expectation, and add real-key
entry/return checks with idle capture assertions. The automated suite has not
been run: AGENTS.md defaults to waiting unless fast/full tests are requested.
Additional regression assertions cover shared Factory/Arcade/Hangar source ownership, 32 stable texture slots, one-at-a-time
replacement across the catalog, paused rotation outside, pending replacements,
isolated observer geometry, stale-zone pose rejection, observer disposal and
exclusion of the Conference Room. Manual browser review covered the expanded
wall, rotation and framing; these new automated assertions have not been run either.
The chair was manually jumped onto, sat in, swiveled and stood from, followed
by a successful return through the mirror. Build and syntax checks cover the
new wall/ceiling, equal margins and seating; the updated chair lifecycle and
32-slot automated regressions have not been run.
The initial 304-panel mosaic layout was viewed and captured. Review caught its
incorrectly retained height; the final 608-panel layout halves both dimensions
and fills twelve rows. The first face prewarm exposed a missing camera up vector,
now initialized explicitly. The browser connection became unavailable before the
corrected face cycle or final proportions could be checked; these still need
visual acceptance and a fresh screenshot. Added, unrun regressions cover mosaic
coverage and adjacency, shared textures, face prewarming, room geometry in the face background and both
sweep directions. The background update, seated pen/click controls and equipment parking also need
browser acceptance. Added, unrun checks cover ownership hiding, pen cleanup,
persistent seated views and automatic transitions resuming after standing.
Additional unrun assertions cover the original fist layout, body-anchored arm in
both views, stationary third-person clicking, thumb/button travel, hand restoration,
bottom-leading wave and feed-only mirror infill. The
pen framing, thumb contact and click sound still need visual/listening acceptance.
Added, unrun regression assertions cover 3×3-to-single and single-to-3×3 waves,
ordered tile arrivals, retaining old tiles while a destination is pending, shared
feed retention and adjacency during and after waves. Fresh visual review of regrouping
and last-frame retention remains pending because the Chrome connection is unavailable.
Multiplayer sessions, context-loss recovery, lower-tier/mobile profiling and
listening acceptance remain before review readiness. Keep the PR draft.

Local source preview after building:
`src/index.html?debug=1&view=architect&character=w-s-bitcoin&nosim=1&net=0&welcome=0&pos=0&hour=12&firstperson=1`
