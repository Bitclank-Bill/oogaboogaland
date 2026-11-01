# Genesis Voyage audio: hand-off to the integrator

Module: `src/js/genesis-audio.js` on branch `gv/audio`. The module is ready to wire in, but it is **not wired in
yet**: the scene still plays its own small cue set. Wiring is the integrator's change to `scene-genesis.js`; this
stream doesn't edit the scene, the page, the styles, the shared tests or any era module. The recipe below follows the
current scene on `gv/integration-1` (`01bbf21`).

**Nobody has listened to this audio.** Scheduling and signal levels were measured; the music, the balance and the
comfort are for Billy to judge.

## API

`BL.genesisAudio.create()` returns one instance per visit:

| Method | What it does |
|---|---|
| `wake()` | Builds the AudioContext and every node, once, only after a real user gesture (`navigator.userActivation.hasBeenActive`) and only when the page-wide mute (`BL.sound.output`) exists. It returns true when it built. Later calls resume a suspended context, and otherwise do nothing. Call it from gesture handlers. |
| `setEra(n)` | 0–7. Crossfades over about 2.4 s on two pooled music decks. Calls before `wake` are remembered. Changing era again mid-fade reuses the fading deck: never more than two decks, never a new node. |
| `setThrottle(t, boost)` | 0–1 and boost; safe every frame. The engine's pitch, level, brightness and water wash follow it. It ignores changes under 0.004 and allocates nothing. |
| `cue(name)` | Plays a one-shot on pooled voices: `splash`, `modem`, `board`, `step`, `stamp`, `link`, `broken`. It returns false before `wake`, after `dispose` or for an unknown name. |
| `dispose()` | Stops and disconnects every source, lets go of the buses, closes the context (which also releases the mute's subscription, sound.js) and forgets every node. Safe to call twice or before `wake`; a later `wake` builds fresh audio on the same instance. |

**Additions**, all optional:

| Method or field | What it does |
|---|---|
| `setPaused(on)` | Fades the music and the engine out and stops the sequencer scheduling; cues still sound. Carrying on fades them back in from the next step, never playing missed notes late. |
| `setCalm(on)` | Calm mode: music to 60%, drums to 30%, engine to 60%. |
| `setEngine(on)` | Silences the engine, e.g. while the Ooga is ashore. |
| `setVolume(v)` | 0–1 under the mute. Not needed by the scene. |
| `tick()` | The scheduler's own step, run by its timer; exposed for tests. |
| Read-only: `ready`, `era`, `paused`, `context`, `buses`, `stats` | `stats` holds `active` decks, `scheduled` steps, `contexts` built and `sources`. |
| Pure exports for tests | `plan`, `busTargets`, `engineTarget`, `THEMES`, `COMPILED`, `ENGINES` and the constants. |

## What this review changed (`472b822` to this commit)

- **Mute:** every sound goes through the page-wide mute. The silent fallback to `ctx.destination` when `BL.sound`
  was missing is gone; without the mute, `wake` builds nothing.
- **Disposal:** `dispose` stops and disconnects every started source explicitly (a fixed list, 29 sources) and
  disconnects the master before closing, instead of relying on `close()` alone. It stays idempotent.
- **Pause:** `setPaused` holds the music and engine, and Calm respects it.
- **Suspended context:** the scheduler doesn't schedule while the context is suspended or paused.
- **Re-entry:** `wake` resets the deck and cue cursors when it rebuilds after `dispose`.
- **Unchanged:** the gesture rule stays `hasBeenActive`, the sticky activation, as `footsteps.js` uses. The
  existing unit proof on this branch models it, and that shared test is outside this stream's scope. The scene must
  still call `wake` only from gesture handlers, as it does today.
- **Kept as they were:** the themes, motifs, bounds and timings.

## How pause, Calm and exit should sound (proposals; the integrator decides)

- **Pause** (the P key and the Pause button: `setPaused` in the scene): `audio.setPaused(view.paused)`. Music and
  engine fade out; cues such as the stamp desk's still sound if the desk runs.
- **Reading a panel or using a terminal:** the ride holds, but I suggest the music keeps playing. Reading is part of
  the visit, and a paused-music silence on every panel would feel jumpy. Only the engine needs to drop, which it
  already does with no throttle. **To decide with the integrator.**
- **Ashore:** `setEngine(false)` when walking starts and `setEngine(true)` on boarding. The music carries on in the
  era the Ooga stands in.
- **Calm** (the R key, the Calm button, reduced motion): `setCalm(view.calm)` at enter and on every toggle.
- **The harbour** (era -1): I suggest playing Era 0's theme (`setEra(Math.max(0, era))`), so the visit opens with
  music rather than silence. **To decide.**
- **Exit:** `audio.dispose()` in `leaveScene`, as the scene already does for its current audio. The director's
  leave contract holds because nothing is left running.

## Wiring recipe for `scene-genesis.js` (current scene, `gv/integration-1` 01bbf21)

1. **Load:** add `<script src="js/genesis-audio.js" data-defer="genesis-scene"></script>` to `src/index.html`,
   before `scene-genesis.js`.
2. **Create (enter, line 1132):** `audio = createAudio();` becomes `audio = BL.genesisAudio.create();`, followed by
   `audio.setCalm(view.calm);` after line 1135 (`view.calm = PREFERS_CALM.matches;`).
3. **Retire the old scene audio** (the cause of duplicate playback):
   - Delete `createAudio` (lines 803 onward: its `tone()` helper and its `stamp`, `link`, `broken`, `splash`).
   - Replace each call:
     - `audio.stamp()` (lines 635, 940) → `audio.cue("stamp")`
     - `audio.link()` (942) → `audio.cue("link")`
     - `audio.broken()` (943) → `audio.cue("broken")`
     - `audio.splash()` (721, the fall back to the dock; 1034, the boat swap) → `audio.cue("splash")`
   - Nothing else in the scene makes sound.
4. **Wake:** keep every existing `audio.wake()` call (lines 335, 643, 656, 873, 890, 908, 912, 1201, 1216) and the
   two gesture listeners (1239–1240). They all run inside gestures.
5. **Era:** in `updateEra` (1030), inside `if (era !== lastEra)` and before `lastEra = era`, add
   `audio.setEra(Math.max(0, era));`. The splash at the boat swap (1034) stays as `audio.cue("splash")`.
6. **Throttle,** once a frame in `update`:
   - **Drive branch,** after `driver.update(dt)` (around 1087):
     `audio.setThrottle(moving ? Math.min(1, Math.abs(driver.state.speed) / GW.BOATS[driver.state.kind].top) : 0, driver.input.boost);`
   - **Tour branch:** `audio.setThrottle(moving && ride.state === "sailing" ? 0.5 : 0, false);`
   - Both are allocation-free.
7. **Ashore:** `audio.setEngine(false)` at the end of `jumpOut` (651) and `audio.setEngine(true)` in `reboard` (676).
   Optionally `audio.cue("board")` on boarding.
8. **Pause:** in `setPaused` (783), after `view.paused = !!on;`, add `audio.setPaused(view.paused);`. Panels reuse
   `setPaused`, so reading would also pause the music. If the integrator prefers music while reading (see above),
   gate it with `audio.setPaused(view.paused && !view.reading)`.
9. **Calm:** in `toggle` (897), after `view[key] = !view[key];`, add `if (key === "calm") audio.setCalm(view.calm);`.
10. **Exit:** `audio.dispose()` in `leaveScene` (1267) stays as it is.
11. **Era modules:** Era 1's coupler and Era 4's desktop DIAL make their own short tones, also through the mute.
    Don't also call `cue("modem")` for Era 4's DIAL, or the handshake would play twice. `cue("modem")` is for a
    future shared modem prop.
12. **Tests:** after wiring, add `genesis-audio.js` to the genesis row of AGENTS.md's file table. The existing
    `genesisAudioProof` in `test/run.mjs` comes with this branch and must stay when merging.

## Checks run on this commit

- **Syntax:** `node --check src/js/genesis-audio.js` passes.
- **Unit tier:** `npm run test:unit` on `gv/audio` passes, **349/349** (the branch's older base `12f7c4f`; it
  includes the existing `genesisAudioProof`).
- **Standalone lifecycle proof** (`audio-lifecycle-proof.mjs`, in the review ZIP; not committed, because the shared
  runner is the integrator's): 26/26, with a mocked AudioContext and the repo's own `sound.js`. It covers:
  - no context before a gesture;
  - repeated wake building nothing;
  - era and throttle remembered before wake;
  - every sound through the mute gate, and muting ramping it;
  - 500 rapid era changes creating no nodes, with at most two decks and one once settled;
  - 200 throttle changes and every cue creating nothing;
  - a suspended context and pause scheduling nothing, and carrying on without late notes;
  - dispose stopping and disconnecting every source, clearing the timer and closing the context, and a second
    dispose being safe;
  - fresh audio from `wake` after dispose;
  - 20 create, wake and dispose cycles leaving every context closed, no source running and every mute subscription
    released.
- **Audition probe** (`audition-probe.cjs`, headless Chromium, real AudioContext, real clicks; a level meter after the
  mute gate). These measure signal; they are not listening:
  - nothing before Wake;
  - all eight eras produce signal, mean RMS about 0.03–0.06 with peaks at most 0.25, so headroom and no clipping;
  - throttle raises the level;
  - mute and pause both read 0;
  - 40 rapid era clicks settle to one deck;
  - dispose releases the context, and a new instance wakes into a running context;
  - no console errors.

## Audition (for Billy)

Open `audition.html` (in the review ZIP) in a desktop browser with `?repo=` pointing at a checkout of this branch.
For example, serve the folder above the repo with any static server and open
`/audition/audition.html?repo=/oogaboogaland`, or from disk `audition.html?repo=file:///path/to/oogaboogaland`.
Press **Wake**, then try the eight eras, the throttle and boost, Calm, Pause, Mute, the cues, Dispose and
New instance. Please judge each theme's character for its years, the balance against the engine and the cues, and
whether anything is tiring over a long visit.

## Wired (Claude Code, integrator, on `gv/integration-1`)

Merged from `fa79636` with an ordinary merge (both conflicts kept both sides), then wired into `scene-genesis.js`
by the recipe above, with the integrator's decisions:

- **The old scene audio is gone:** `createAudio` and its tones are removed. Every cue (stamp, link, broken, splash)
  now plays through `audio.cue`, so nothing sounds twice.
- **The harbour** plays Era 0's theme (`setEra(Math.max(0, era))`).
- **Reading:** the music keeps playing while a panel or a terminal is open, and the engine is silent then. It's
  silent ashore too.
- **Pause:** only the visitor's own pause (P or the Pause button) pauses the music. A panel opened while paused
  leaves it paused, and closing that panel keeps the visitor's pause.
- **Calm:** passed on whenever it changes.
- **How the state reaches the module:** `syncAudio` passes on pause, engine and Calm once a frame, only when they
  change. The throttle is set once a frame in the drive and Tour branches.
- **Unchanged:** the gesture wake, the page-wide mute and disposal on leave.
- **No `cue("modem")`:** Era 1's coupler and Era 4's DIAL make their own tones.
- **Debug only:** the scene's debug handle exposes `audio` and `sounds` for the browser probe.

## Limitations

- **Not listened to:** the music, the balance, the volume and the comfort are unjudged.
- **Not wired into the scene:** the recipe above is untested in the scene itself.
- **Old base:** the branch sits on `12f7c4f`. Merge it into the current integration branch with an ordinary merge
  (it adds `genesis-audio.js`, one script tag and the unit proof). Don't take the old scene from it.
- **Gesture rule:** sticky activation (`hasBeenActive`). Strict per-gesture checking would need the shared test's
  mock updated, which is integrator-owned.
- **Device audio:** no touch, Bluetooth, low-power or physical-speaker testing.
