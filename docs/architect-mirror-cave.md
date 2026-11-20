# Architect mirror cave proposal

Status: feasibility and implementation proposal only. No game behavior changes.
Starting point: upstream `rock` at
`45e02fd428cc0734b3c9a3f8f173bf741d68a094` (November 20, 2026).
A maintainer-approved issue is required before implementation under
[CONTRIBUTING.md](../CONTRIBUTING.md#ask-first); this draft does not claim one.

## Visitor experience

Walking through the hub's mirror takes the same Ooga into a separate chamber,
with a crossing like the field into Bifrost. Walking back through its doorway
returns the Ooga to the mirror entrance. The interior takes its visual direction
from the Architect's room in The Matrix: a bright circular room, a central chair
and banks of framed screens wrapping around the walls, built in the game's own
voxel style. An Architect character is not part of this initial scope.

The screens show current views of Ooga Booga Land from fixed camera positions.
They render the browser's current world state locally; they are not video streams
or recordings. Small details such as fireflies can be omitted. The number of
physical screens can exceed the number of distinct cameras by reusing feeds.

## Feasibility and existing code

The room and crossing fit existing scene patterns. The substantial work is
keeping the island current and rendering several views within the frame budget.

- `scene-hub.js` builds the current walk-through mirror surface, but keeps its
  room empty and retains an actor barrier and locked gate. Its portal handling
  needs an intentional transition and return path for this new destination.
- The Bifrost crossing calls `go("bifrost")`; its view back onto the island is
  a single arrival photograph (`snapBifrostView`), not a continuously live view.
- `gl-renderer.js` already owns offscreen textures and reflection captures,
  reduced capture filtering and capture cadence. These are useful foundations,
  but do not expose a general camera-screen service. The new pass must own its
  camera, visibility and target state rather than impersonating a mirror.
- `director.js` updates the active scene. `scene-hub.js`'s `suspendHub` pauses
  crew, disposes remotes and NPC synchronization, and removes feed subscriptions.
  Retaining the hub's geometry alone would produce frozen or stale pictures.
- Hub retention can be disabled on lower-memory devices. Keeping a full island
  alongside the chamber cannot silently override that memory policy.

A bounded observer mode for the island is the first architecture question:
retain the visual state required by selected cameras and update it once, then
render that state from each scheduled view. Preserve shared NPC authority,
remote interpolation and donation ownership; do not create another independent
crew or advance simulation once per camera. Review the existing multiplayer
state delivery before promising live remote players from another scene. Feed
cameras must not change the visitor's actual zone, voice scope or presence.

## Camera placement is part of the optimization

Choose camera positions from measurements, not just resolution. A close view
with sky or a simple backdrop can exclude most of the island, whereas a wide
panorama can submit terrain, foliage, bridges and distant props together.
Candidate shots include a close pile view, an exterior cave entrance and a
bridge viewed along a short section. These are candidates, not proven cheap
views or a committed camera roster.

For each candidate, record its position, direction, field of view and far plane,
then compare submitted triangles, draw calls, capture CPU/GPU time and visible
motion. Attribute the cost to terrain, vegetation, actors, props and effects.
Measure an ordinary view and the proposed reduced capture of the same view.
Existing `scripts/profile-rendering.mjs` and the renderer's `glstats` provide
starting instrumentation; no profiling has been run for this proposal.

Narrow framing only saves geometry work when the renderer can reject meshes or
instances. The current reduced capture path tests instance bounding spheres.
A large terrain mesh intersecting the view can still submit all its triangles;
a wall hiding scenery does not itself prevent those submissions. Historical
[reflection measurements](performance-rendering.md#22-reflection-capture)
already identify large terrain/prop meshes surviving reduced captures. Those
numbers are not measurements of this revision. If carefully chosen views still
cost too much, evaluate coarse capture meshes or spatial partitioning as a
separate, measured step, preserving silhouettes and occlusion.

## Initial capture budget to evaluate

Start with four distinct feeds at 256 x 144 pixels, reused across the screen
wall. Render at most one due feed per displayed frame. At 60 displayed frames
per second, four equally scheduled feeds could each refresh at 15 Hz; this is
an upper scheduling rate, not a measured performance promise. Keep movement in
the room at its normal display cadence. Tune resolution, refresh rate and the
number of distinct visible feeds from profiling on desktop and mobile.

Keep captures on the GPU and sample their textures on the screens. Avoid pixel
readback, image encoding, canvas copies and a second WebGL context. Four RGBA8
color images at this size total 576 KiB before depth attachments and other GPU
resources; retained island geometry and simulation can cost much more.

- Update feeds only while their screens are visible; stop capture work outside
  the chamber and while the page is hidden. Refresh stale feeds when visible.
- Exclude fireflies, tiny particles and unnecessary decorative animation.
  Preserve terrain occlusion, major silhouettes, the pile and visible actors.
- Use simple lighting without per-camera shadow-map rebuilds or postprocessing.
  Exclude recursive camera screens, mirror and portal captures.
- Give each capture its own culling and detail decisions. The room camera's
  hidden nodes, cutaways and proximity gates must not remove island scenery.
- Reuse targets and scratch storage. Account for them in geometry ownership,
  context restoration, quality downgrades and disposal.
- Define a legible Canvas 2D and low-memory fallback before implementation.
  A static fallback must be presented as static, not described as live.

## Immersive soundscape

Use the care and responsiveness of drneski's Bifrost soundscape as the design
reference, with a distinct identity for this chamber. The current
`bifrost-audio.js` supplies a useful implementation pattern: pooled synthesized
voices, a continuous bed shaped by scene state, directional stereo cues,
smoothed parameter changes, gesture-based activation, the shared sound channel
and explicit disposal. `scene-bifrost.js` passes charge, nearby window identity,
its side relative to the camera and upward gaze into that system. It responds
to where the visitor stands and looks instead of playing one unchanged loop.

Give the mirror room a restrained electronic character: ventilation and a low
electrical resonance under soft monitor-bank textures, occasional relay clicks
or cooling ticks, and a short, original crossing sound. Let proximity and view
direction bring the nearest screen bank forward in the stereo field, with
smooth changes as the visitor turns. Keep a quieter center around the chair so
the room has contrast. Consider a small bounded reflection/delay treatment for
hard surfaces only if listening tests show that it helps the sense of space.
Do not reuse Bifrost's rising motif, crystal chords, heartbeat, timing or exact
synthesis constants; compose and tune this room's palette independently.

The doorway should carry the transition: ease the outdoor ambience away as the
mirror is crossed, introduce the enclosed room bed, and reverse it on return.
Coordinate that envelope with scene teardown so it does not click, cut off
abruptly or leave an old context sounding after departure. Restore the bed if
a crossing fails. Screen sounds belong to their physical banks and should not
pulse with the renderer's refresh schedule. Camera feeds are silent pictures;
they do not relay outdoor voice or mix several copies of island ambience.

Keep the bed below conversation and avoid sustained piercing CRT whine or
frequent cues from every screen. Use the existing master mute and sound-panel
controls. Pool voices and noise buffers, update slow controls at a bounded
cadence, and allocate nothing per frame or cue. Check mute/unmute, late audio
activation, hidden-tab behavior and repeated visits. Listening acceptance should
cover headphones, laptop speakers, long stays, turning in place and both doorway
directions; the intended result is immersion without fatigue. No listening test
or audio prototype has been performed for this proposal.

## Proposed implementation stages and acceptance

1. Agree the cave proposal in an issue, including live-state scope and fallback.
2. Prototype one live camera and establish its geometry and simulation costs.
   Choose additional angles from comparative measurements before building the
   full screen wall.
3. Build the chamber and mirror crossing, preserving character, movement,
   camera orientation, controls, zone transitions and the return landing.
4. Add bounded scheduling and shared screen textures; tune on representative
   hardware, including the low-memory retention policy.
5. Compose and tune the original soundscape against the room and its crossing,
   including directional cues, speech balance and audio lifecycle checks.
6. Verify motion and donation changes remain current in feeds, repeated
   crossings preserve one player, and entry/exit, failed loads, quality changes
   and context restoration release or reconstruct resources correctly.

Follow AGENTS.md's authorized test scope. Future renderer changes require the
appropriate shared-renderer checks when tests are requested; extend existing
mirror and scene round-trip checks rather than duplicating them. Measure capture
cost and whole-frame time, as well as retained CPU/GPU resources over repeated
visits. Historical reflection benchmarks do not establish spare GPU capacity.
No implementation, browser run, screenshot or performance result is claimed by
this proposal.
