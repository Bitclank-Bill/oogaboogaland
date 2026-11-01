# The cairn's secret: a proposed alternate entrance to Block Frenzy

Prepared with AI assistance (Claude Code). It's a proposal on the fork (`gv/ovh-block-frenzy`), behind the Genesis WIP
flag. It hasn't been reviewed or approved.

Block Frenzy is a modern bonus game, outside the museum's history. It has no era, date, citation or influence thread,
and makes no claim about who made it.

## The game itself

- **Source:** the canonical Block Frenzy, `feature/block-frenzy` at `5a9c71d` (draft OogaBoogaX/oogaboogaland#303),
  imported as one commit (`git diff 0704ec8 5a9c71d`, applied three-way). The commit message lists every shared-file
  resolution.
- **Not changed:** #303 and its branch.
- **Piggyback:** stays confined to Block Frenzy, as on 5a9c71d.

## The entrance

1. **The head:** the cairn's gold block, `genesisAtrium.layout().cairn.head`. Normal movement reaches it:
   - the plinth is a jump from the floor;
   - the stones are steps;
   - the head is a jump from the top stone;
   - a jetpack can land on it.

   The footing's obstacles may carry a `top`, which is what makes this work.
2. **The hint:** shown only while `genesisAtrium.onHead` holds:
   - inside the head's bounds, a little in from the edge;
   - feet on its top and supported (`hop` 0, small vertical speed);
   - no jetpack thrust.

   Flying past, hovering or looking at it never counts. The hint reads "Secret found · Play Block Frenzy · press
   Space" (or "tap PLAY" on touch). Moving off the head hides it.
3. **The action:** through the crew's ordinary act routing (`useNear`), so it never takes Space mid-jump, or while a
   workbench, the menu, a panel, the console or a pause is up.
4. **The offer:** Play or Stay (`#genesis-secret`). It holds the walk as the menu does. Nothing launches by itself.
5. **Play:**
   - Sets `world.genesisBlock` (the Ooga, the head, the view) and `world.pilot`, then `go("block")`.
   - A refused switch keeps the offer open with a note to try again.
   - A failed preparation fades back. The scene's `stay()` leaves the visitor on the head.
6. **The return:**
   - `scene-block.js` sends its exit back to the museum only when it came from Genesis with that marker. Started from
     the arcade it goes back there; otherwise to the island.
   - Genesis then puts the same Ooga back on the head, restoring first person if that was the view.
   - Music keeps its saved preference.

## Checks

- **Unit:**
  - Only a body settled on the head counts: not hovering, falling, jumping, under thrust, beside it, at the edge or on
    the stone below.
  - The arcade and island exits are unchanged, and the museum return needs the marker.
  - The cairn climbs and lands as described.
- **One short browser probe:**
  - discovery after a real fall onto the head (debug placement 1.5 m above it);
  - Space opens the offer and holds the walk;
  - Stay;
  - a forced preparation failure;
  - Play into Block Frenzy, and its exit back onto the head with the same Ooga and view.

## Limitations

- **Climbing the cairn** on foot (jump, steps, jump) is checked in Node against the footing, not in the browser.
- **The view's return:** only orbit and first person are restored; shoulder comes back as orbit.
- **Loading:** Block Frenzy loads with the page, as on 5a9c71d, so "failed to load" is covered as a failed switch or
  preparation.
- **The hint pill** overlaps the keys line at the foot of the screen, as every Genesis hint does today.
