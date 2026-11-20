# The island's world on the server

The island's Oogas nobody drives run today on one elected browser page, the room's NPC host (`npc-sync.js`).
Every other signed-in page follows that host's frames. This moves them onto the server, the way the ghost hunt
moved (`docs/game-host.md`). One Durable Object runs their routine, and every signed-in page follows it. Players
stay out of it: each page still owns its own Ooga, and the room still relays it.

## Why

A browser host costs every follower its own frame time and its tab's whims. A hidden or busy host stalls the
crew, a host that leaves hands the crew over mid-walk, and a host on another build leaves its followers frozen.
The ghost hunt showed what a server host gives instead: one clock, frames that arrive evenly, and nobody's tab in
the way.

## What runs where

| Piece | Where | What it does |
|---|---|---|
| `src/js/island-layout.js` | page and Worker, baked | The hub's routine tables: the meadow's paths, fire seats, stroll spots, each work cave's fan of places that every Ooga may shoot from, and the sealed caves' fronts. `scripts/island-layout.mjs` bakes it from the real hub in the suite's Chrome, because those tables depend on props and geometry only the page builds. The hub's "island layout" check fails when the hub and the file disagree. |
| `src/js/island-sim.js` | page and Worker | The passive routine (below) over those tables, with no terrain, props or collision. It runs fixed 50 ms steps, is seeded and allocates nothing per step. Its output is one `game-wire.js` row per Ooga. |
| `worker/src/games/island.js` | Worker | Kind `island`, venue `main`, on `game-host.js`. It takes the cast from `characters.gen.json`, and states and caves from Oogatron's stats through the `OOGATRON` binding, read every minute while it runs, as a page polls them. It sends motion at 10 Hz, skips frames while nothing moves (at most 2 s apart), and sends the cast's names as its state. It runs only while a page follows it, and keeps no record: a restart starts the routine afresh. |
| the page | page | **Not built yet** (next section). |

### The routine

This reproduces the hub crew's passive routine (`npcPassive` in `crew.js`, mapped in this PR's notes):

- **Working.** The Ooga takes the caves it is active at in turn. On each trip it walks out along the meadow
  planner's paths (`npc-paths.js` `fixed`, the same planner) to the cave's trail, then straight to the first free
  place in the cave's fan. It aims, fires a magazine (10 bursts, 0.44 s apart) and walks back to the nearest free
  slot of the reload fan round the pile. There it eats the magazine back (6 s). The moment its contributor stops
  being active at a cave, it heads back. Walking speed is 2.8 m/s.
- **Chilling.** The Ooga idles a staggered 120–240 s at a fire seat, a spot by the HQ ramps or a meadow spot, then
  strolls to another at 1.3–1.8 m/s. Nobody idles inside a working cave's zone or within the pile's ring. A worker
  that stops working walks back by its cave's trail and round the pile first.
- **Sleeping and away.** Nothing is shown. The page's own crew beams a sleeper into its bed, which it chooses
  deterministically, as it does today.
- Every other change of state is a beam, as the passive crew's is.

### The row

Each row is a `game-wire.js` row: type 0, the Ooga's roster index, the low 16 bits of its name's hash, then x and
z. **y carries the cave its gorilla goes ahead to, plus one, in metres**; the page stands the Ooga on its own
ground. Then come the heading and the flags. The flags hold what the Ooga does in the low three bits (hidden,
stand, sit, walk, aim, fire, reload), its state in the next two, and the cave it works, plus one, in the top
three. A frame for 60 Oogas is about 750 bytes.

## Known approximations

- **The pile's size.** The ring, reload fan and starting spots depend on the pile's platform radius. The server
  uses a nominal one (`PLATFORM`, 2.4 m) because the Worker does not read the pile yet. A page can ease rows near
  the pile out to its own ring, or the Worker can read the pile from bananapayserver later.
- **The gorillas.** On a page, a worker waits to fire until its gorilla is in the cave. The server cannot see the
  gorillas, so its workers fire on their own schedule. Pages still run their own gorillas from the trips each row
  names.
- **Static checks only.** Spots and places are baked with the checks that never change. The loose props' and other
  bodies' checks are left out, so an Ooga can stand where a knocked-over prop now lies.
- **Night.** At night the page crew leans towards the fire (`RENDER_OPTS.stars`). The server keeps no visitor's
  hour, so it does not.

## Next: the page

The plan was that pages animate the bodies, and the server only places them. Working and chilling Oogas become
puppets (`cave.puppet`, which `crew.update` skips), placed from the rows 150 ms behind the newest, as the ghost hunt
draws. Sleeping and away Oogas take the row's state as `cave.override`, so the page's own crew puts them to bed.
Signed-out pages run `island-sim.js` themselves and feed the same follower. While the world is followed, `npc-sync`
stops carrying Oogas; it can stay the props' host until the props move too.

Posing those puppets is the open choice:

- **A. A puppet poser.** A new module poses each puppet from its row with the crew's exported helpers: `poseGait`
  for walking and standing, `poseGroundSit`, `poseReload`, and `poseEquipment` with the weapon's aim set. It also
  needs a small crew change, so that a puppet's visual shots show (`showShot` drops a passive NPC's today). This is
  the ghost hunt's model: smooth and simple to follow, but each gear pose has to be matched by hand.
- **B. A directed crew.** The crew keeps running and posing its passive routine, but takes its decisions (site,
  spot, timings) from the world, and its positions are nudged towards the rows. Today's look stays exactly as it
  is, but this goes deeper into `crew.js`, and the nudging can show.

Either way, the follower turns on behind `?islandworld=1` first, and replaces the browser host only once
play-testing says so.

## Cost

A page follows the world only while it is on the island. The object is awake while any page follows. It sends one
encoded frame to every follower each tick that something moved: about 7.5 KB/s a follower while the crew walks,
nothing while it does not. Nothing is written to storage (`game-host.js` skips the write for a game that keeps no
record). Oogatron is read once a minute while the world runs.
