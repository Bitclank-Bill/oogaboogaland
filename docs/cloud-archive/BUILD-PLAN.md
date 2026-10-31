# Cloud Archive · build plan

A hidden white archive above the island. Jetpack up to one marked cloud and shoot it, and a beanstalk grows from the
meadow to it. Climb the stalk and you come out through the cloud floor into a bright, empty white space. Shelves run
off toward the horizon, one for each day of Ooga Booga Land's history. Each book is a commit. Tap a shelf to read that
day: its commits, merged PRs and the people who made them, each linking to GitHub.

Branch: `feature/cloud-archive`, cut from the official `OogaBoogaX/oogaboogaland` `rock` (37d9f39, 2026-10-31). It stays
behind the director's existing WIP flag (`?wip=cloudarchive`) until the phases below are done. Nothing is proposed
upstream until Phase 4 passes.

## What the repository already gives us

This is what inspecting `rock` turned up. Each item is something the archive reuses, not rebuilds.

| Need | Existing system | Where |
|---|---|---|
| Hidden until ready | `wip: true` on a scene; the director drops it unless `?wip=<id>` or `wip=1` | `director.js` top, `scene-deferred.js` |
| Code that loads only when visited | deferred groups (`data-defer="<group>"`), `BL.deferred.load(group)` from a scene's `prepare` | `deferred.js`, `scripts/build.mjs`, `scene-timechain.js` |
| A walkable interior with one Ooga, the pilot's views, footsteps, the shared HUD and a clean `leave` | the Timechain Sphere room is the template, especially its shell and interior split | `scene-timechain.js`, `timechain-interior.js` |
| Climbing | crew ladder planes (`ctx.ladders`: `x, z, nx, nz, width, top, bottom, inset`), which mount and dismount automatically with W/S, A/D and Space | `crew.js` `runLadder`; the Factory uses them |
| Jetpack | **J** equips it and Space climbs; fuel lasts about 8 s at 7 m/s, so the island's ceiling sits around 70 m | `crew.js` `runJet`, `scene-hub.js` `FLY` |
| A shootable thing that starts something in the HUB | the restless ghost: an `addTarget` owner that `shared.weaponInteraction` lets bullets hit, and that `weaponImpact` hands on | `ghost-entry.js`, `scene-hub.js` `weaponImpact` |
| Clouds | 18 drifting `hubModels.cloud` nodes on two tracks | `scene-hub.js` `buildClouds` |
| Use-key actions and Space prompts | `nearbyAction`, `useNearbyAction`, `enterScene(view, id)` | `scene-hub.js` |
| Returning the same Ooga | `world.pilot` and the `handsBack` list in the hub's two arrival paths | `scene-hub.js` (two copies, one for each hub policy) |
| Readable boards | `hud.openBoard(board)`, a paged canvas with `note` text and `links` | `hud.js`, AGENTS.md "A HUD element" |
| Tests | `npm test -- <scene>` with a `scene(id, { steps })` registration in `test/run.mjs`, plus the round-trip contract | AGENTS.md "Testing" |

## Data: what counts as verified

- `scripts/cloud-archive.mjs` (`npm run archive`) reads the git history of the checkout it runs in. It refuses to run
  on a shallow clone, so it never writes a partial history. It writes `src/js/cloud-archive-data.js`, which is
  committed as a snapshot so CI's shallow checkouts still build. The snapshot is refreshed by hand, like `cards/`.
- Every book is a real commit, stored with its full 40-character SHA and linked to
  `github.com/OogaBoogaX/oogaboogaland/commit/<sha>`. A PR counts only when its merge commit says
  `Merge pull request #N from …`, so every PR shown has a merge in the history. Days are in UTC, by commit date.
- **Credits.** A commit is credited to a GitHub login when one can be read from the history: the
  `…@users.noreply.github.com` address, or the `from <login>/…` of a PR merge. A name that has ever committed under a
  login is credited to that login. Anyone else is shown by the author name exactly as it appears in the public
  history. No email address leaves the script. Bots (`[bot]`) are shelved as grey automation volumes and are not
  counted as contributors.
- Not in v1: GitHub's signature "Verified" badge. Reading it needs the API or the signers' keys. If it's wanted, the
  script can add it later through `gh api` at generation time, never from the page.

## Phases

### Phase 1 · small playable slice (this branch, now)

1. `cloud-archive-entry.js` (HUB, only when the scene is registered): one marked cloud that never drifts, high over
   the north-east meadow. It is an `archivecloud` weapon target. A round from the player's own Ooga makes it flash
   and grow the beanstalk from the meadow up to it. The stalk is a prop with a tooltip, and **Space at its foot**
   climbs: the view moves in and the scene changes.
2. `scene-cloudarchive.js` shell (`wip: true`) and a deferred `cloudarchive` group with `cloud-archive-data.js`,
   `cloud-archive-models.js` and `cloud-archive-interior.js`.
3. The interior starts at the bottom of a shaft under the cloud floor. A **ladder plane up the beanstalk** (the
   crew's own climbing) brings the Ooga up into a white void. A long aisle has one shelf unit per day, alternating
   sides, each with a dated plaque and one book per commit, coloured by contributor. Walking, views, first person
   and footsteps all come from the pilot and the crew, as in the Sphere.
4. Tapping a shelf opens the day's board. It shows the date, commit, PR and contributor counts, the people and the
   commits, and the arrow keys page through the days. Its links open the day's commits and PRs on GitHub.
5. To leave, climb back down the stalk, or use Leave or Escape. The same Ooga returns to the beanstalk's foot.
6. Done when it is built, `node --check` passes on every touched file, and a manual run reaches the archive, reads
   a board and returns without console noise.

**Status (2026-10-31): playable behind `?wip=cloudarchive`.** Checked headless on software GL:

- A shot grows the stalk (driven through the entry's `hit`, not yet a real round in the probe).
- Space at the foot climbs in with the same Ooga.
- W climbs the beanstalk on the ladder plane.
- A day's board opens with its links.
- Leaving puts the same Ooga back beside the stalk.
- `npm run test:unit` passes 347/347.

Known v1 limits:

- The day board's canvas clips long titles and lists the first commits of a busy day, sending the rest to GitHub.
  The DOM note and links carry the summary.
- A real jetpack shot is untested by script, though the cloud sits well inside the 60 m targeting ray.

Try it:

```sh
npm run serve
```

Then open `http://127.0.0.1:8080/?wip=cloudarchive&scene=hub` for the island (J for the jetpack, then shoot the gold-rimmed
cloud over the west meadow), or `?wip=cloudarchive` to land straight in the archive.

### Phase 2 · finish the walk

- A real climb up the stalk in the HUB too (a ladder plane in the hub's crew context). This replaces Space-to-enter.
- The reveal is saved per browser (`localStorage`, `ooga-cloud-archive`) so a returning visitor finds the stalk grown.
  It resets with Right Shift+R.
- A route (`/archive`), its preview card (`npm run cards`) and a `routes.js` entry, only once the WIP flag comes off.
- Contributor pages: tap a book to go to that commit, and tap a name to light up every book by that person.
- Signed-in visits: the shared zone, presence and remote players, following the Sphere's shared/solo rules.

### Phase 3 · content and polish

- Milestone plinths for the days scenes opened (the Arcade, the Factory, the Sphere, ₿IFRÖST, the ghost hunt) as
  hand-written entries checked against the history.
- An ambient hum and page-turn sounds that follow the page-wide mute.
- Set dressing, with any look from the reference stills used as mood only. It stays our own design: no film props,
  chairs, TV or costumes.

### Phase 4 · before proposing upstream

- **Cleanup:** the `leave` contract. Two round trips under `?debug=1` hold nothing new: targets, tweens, GPU
  geometry, timers and listeners. The hub's entry disposes with the hub.
- **Performance:** about 2,000 books are baked into one merged mesh per shelf, with no per-book nodes, and `update`
  allocates nothing. Check the frame rate on the Low tier and on Canvas 2D (`hub canvas2d` boots every scene).
- **Accessibility:** the boards are DOM text with real links. Every action has a keyboard path (Space, the arrows,
  Escape) and a touch path (tap and the ACT button). The white void respects `prefers-reduced-motion` (no
  flash or pulse) and keeps text contrast on the plaques.
- **Suite:** `scene("cloudarchive", { steps })` in `test/run.mjs` covers a playthrough (climb in, open a board, climb
  out), keys on screen, and `trip("cloudarchive")`. Add a `hub` step for the cloud: a shot grows the stalk, and Space
  at the foot enters. Then run `npm test -- cloudarchive hub` and `hub canvas2d`.
- **Docs:** add the new modules to AGENTS.md's module table and the Testing scene table, and put the controls in the
  README. Then remove `wip`.

## Rules this follows (from AGENTS.md)

Vanilla IIFEs on `window.BL`, no dependencies, no external requests (GitHub is only a link the visitor chooses to
open), no console noise, the smallest change in shared files (`scene-hub.js` gets hooks only, and the logic lives in
`cloud-archive-entry.js`), and a scene contract that leaves nothing behind. Unrelated projects and scenes stay
untouched.

## Open questions for the maintainer

1. Should authors without a known login be shown by their git name, or as "a contributor"?
2. Should automation commits (`github-actions[bot]`, about 220) be shelved at all, or only counted?
3. Where should the cloud sit? v1 puts it over the north-east meadow, about 26 m up, which takes roughly half a tank
   of jetpack fuel.
