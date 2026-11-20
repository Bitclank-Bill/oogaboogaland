# Live character hats

Implementation issue: [#839](https://github.com/OogaBoogaX/oogaboogaland/issues/839).

This first equipment flow lets a player try the existing contributor hats in
the character studio and save one for their own account. Hats are freely
available. The HQ store and purchases will use the same equipment path later.
This work builds on the independent character catalog stack and starts on
staging; it does not enable production.

## Content and ownership

Each hat has a stable item ID, creator attribution and an immutable version.
Changing a creator's hat advances that item's current version. Historical
geometry stays available: a wearer gets an update notice and can accept it or
keep their version. Accepting updates their saved selection and live avatar;
declining suppresses that revision's notice without changing their appearance.
A later revision can offer another update. New selections use the current
version. The authored appearance and no hat are separate choices.

An explicit registry extracts only hats from the existing designs. Hair,
glasses, facial features, weapons and character ownership do not transfer.
Attachment adapters preserve the recipient's head and animation. Contributor
NPCs keep their authored appearance; saved equipment belongs to the player's
driven body.

## Studio and live state

The local `character:studio` command stays an offline preview. A hosted studio
uses same-origin account APIs to save equipment without taking over an island
tab's room connection. Previewing another character never edits that character
or its owner's equipment.

The server stores the selected item/version and a monotonic appearance revision
against the numeric account ID. Changes validate the session, origin, item and
expected revision, and persist before acknowledgement. The live Room sends
small appearance updates to the wearer and players who can see the avatar,
including mutually visible main-world zones. Arrivals and reconnects receive
current state, and stale updates cannot replace newer equipment. Pose handling
performs no equipment storage reads.

## Acceptance before rollout

- Try every supported hat, restore authored headwear, remove it, and verify
  hair, face, motion and gameplay state remain intact.
- Save from the studio while another tab remains in the world; a nearby player
  sees the change without refreshing. A distant player catches up on arrival.
- Refresh, reconnect and restore the Room with the same saved equipment.
- Reject invalid IDs, cross-origin and unauthenticated writes, and conflicting
  revisions. Account deletion removes saved equipment.
- Publish another version of one existing hat; accept on one wearer and decline
  on another. Both choices survive reconnects, with the older geometry retained.
- Record Worker and browser checks and real staging evidence separately. Keep
  the PR draft while implementation or staging acceptance remains.
