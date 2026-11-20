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

The first registry contains the straw hat, spiked helmet, green Bitcoin beanie,
flame crown, Taproot cap, gold space helmet, ruby crown, top hat and gold crown.
Normal and slim heads, the nine source characters and `w-s-bitcoin`'s apple head
have fittings. Other replacement skulls, masks and custom heads show an explicit
fitting limitation and retain their own appearance. Gorillas keep their own look.

## Updating an authored hat

The nine existing custom character files expose `dress.hat` and, where needed,
`dress.hatNodes`; hair and facial details remain in their existing hooks. After
reviewing a creator's source change, a maintainer runs:

```sh
node scripts/equipment-hats.mjs --author
```

This executes only the allowlisted sources' explicit hat builders in the local
authoring process, writes immutable plain geometry under `src/equipment/hats/`,
and advances that item's current version in `catalog.json`. The stable item ID
does not change. All previous archives and their index entries stay committed.
Ordinary builds validate source fingerprints, archive hashes, schema and history;
they never execute a changed hat source to publish an unreviewed update.

These initial hats come from custom JavaScript, so creator changes still require
an approved manual code release and character-catalog baseline handoff. The
equipment geometry served to wearers is data only. An already-open browser can
fetch a newer immutable version when accepting an offer without replacing its
character catalog or executing downloaded JavaScript.

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

Open the hosted studio at `/?scene=studio`, sign in, select a hat and press
**Save hat for my Ooga**. It can remain open beside an island tab on the same
account; the studio does not join the Room. Local preview links to the staging
studio for account saving. A new creator version offers **Accept update** or
**Keep my version**; a later distinct version can offer again.

`GET /api/equipment` returns the account's current record. `PUT /api/equipment`
takes its expected `revision` and either `selection` or a `decline` version.
An original appearance is `selection: null`, and a bare head is
`{ item: "none", version: null }`. Conflicts return 409 and the current record.
The browser reads immutable geometry at `/api/equipment/hats/<sha256>.json`.
Migration `0012_player_equipment.sql` adds one account row with deletion cascade.
There is no purchase history or paid inventory in this iteration.

Staging sets `EQUIPMENT_ENABLED=1`; production keeps it `0`. The staging workflow
has an explicit `catalog_preview` dispatch option so this draft can use the
catalog-aware handoff without changing repository-wide automatic release flags.
Turning equipment off hides account saving and live updates while keeping stored
choices. Re-enable only with the immutable versions those choices reference.

Before fencing a catalog release, the deployment workflow compares the live
public `/api/equipment/catalog` history with the target's hash-checked archives.
Keeping every published version also covers a player who equips during the
deployment. After migrations, a second check reads only distinct saved item and
version pairs from D1 and refuses missing archives. A pre-equipment Worker can
return 404 at the first bootstrap; other reading failures stop the release.
Pin `CHARACTER_CATALOG_TOOLING_SHA` to tooling containing
`scripts/equipment-retention.mjs` before using this workflow.

Use this guarded workflow for releases. A direct `wrangler versions rollback`
does not run the retention checks. To roll back rendering changes while keeping
equipment enabled, make a forward release that retains the entire hat history.
An explicit feature-off release can stop equipment temporarily without deleting
account choices. Historical archives must remain available when re-enabling.

The Room's private admission session digest prevents an account deleted and
recreated under the same numeric ID from inheriting a stale connection's
equipment revision. It never appears in equipment messages or public metadata.

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
