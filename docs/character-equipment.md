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
deployment. This history check also runs for a feature-off release, so disabling
equipment cannot discard versions needed when it is enabled again. After
migrations, a second check reads only distinct saved item and
version pairs from D1 and refuses missing archives. A pre-equipment Worker can
return 404 at the first bootstrap; other reading failures stop the release.
Pin `CHARACTER_CATALOG_TOOLING_SHA` to tooling containing
`scripts/equipment-retention.mjs` before using this workflow.

Use this guarded workflow for releases. A direct `wrangler versions rollback`
does not run the retention checks. To roll back rendering changes while keeping
equipment enabled, make a forward release that retains the entire hat history.
An explicit feature-off release can stop equipment temporarily without deleting
account choices. Historical archives remain in every release, including while
the feature is disabled.

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

### Local validation (2026-11-20)

The maintainer chose local multiplayer coverage plus a single-account live
staging check. The local browser run, `node test/run.mjs equipment-app`, passed
16/16 checks using the real hosted studio and renderer with explicit account,
HTTP and socket fixtures. It covered all nine hat previews without reallocating
the wearer, saving and reloading a pinned version, fixture creator revisions
with **Accept update** and **Keep my version**, a later offer after declining,
concurrent-save conflicts, authored/no-hat restoration, the apple-head fitting,
and desktop and phone controls. Normal flows had clean consoles; the intentional
409 response was checked separately for its expected browser resource error.

The browser also applied fixture messages to local and remote avatar models:
changes preserved pose and gameplay nodes, reused immutable geometry, rejected
older revisions, cleared equipment on leaving visibility and restored it from
an arrival snapshot. These were modeled peers in the browser, not two actual
signed-in Chrome accounts connected to staging.

Worker integration tests exercised the Room implementation with simulated
sockets and SQLite-backed account choices. They verified delivery to visible
peers while excluding distant scenes, catch-up on zone entry, reconnect and
hibernation recovery, interrupted-publication recovery, concurrent-save revision
checks, and retained Accept/Keep choices across reloads and newer metadata.
Model tests separately checked all nine attachments, shared geometry, preserved
authored heads and the reviewed apple fitting. Immutable archive validation and
deployment retention checks cover keeping previously published versions.

At revision `39dc21ed82465bdbe22b25aee2e857aa3aadf649`,
[Linux CI run 44800255713](https://github.com/OogaBoogaX/oogaboogaland/actions/runs/44800255713)
passed 831 root unit checks and 827 Worker checks. This CI record and the local
browser results are separate from live staging acceptance.

### Live staging validation (2026-11-20)

[Staging release 44801155812](https://github.com/OogaBoogaX/oogaboogaland/actions/runs/44801155812)
deployed application baseline `39dc21ed82465bdbe22b25aee2e857aa3aadf649` using
tooling `61faffb7df2168855cb4db833a2d690f93929982`. Worker version:
`387084f9-48b2-44cc-afae-2bda165eed3e`. Migration
`0012_player_equipment.sql`, all 827 Worker checks, both retention gates and live
catalog verification passed. The release finished at generation 8 with no
pending transition. The 58-character catalog is revision
`7767c79cc99775c3dc819cb8306f0db972b81018bc5e8c04f88352216e4d5e2d`,
activation generation 1.

Using the maintainer's existing signed-in account, the hosted studio displayed
all nine hats and saved the straw hat. The already-open island tab visibly
changed from the original apple head to the straw hat without navigating or
refreshing. The studio retained the selection after a full reload. Leaving the
island for the studio and returning created a fresh Room connection, still
wearing the saved hat with one account online. Restoring the original character
look updated the existing island tab live and survived another studio reload.
The account was left with its original appearance.

The public registry returned nine items and nine versions. The straw archive
returned HTTP 200, the expected SHA-256 bytes and ETag, and a one-year immutable
cache policy. A post-deployment retention preflight confirmed all nine published
versions remain in the next target. Screenshots are local acceptance artifacts
under `untracked/equipment/staging/`: `studio-straw.png`,
`live-island-straw.png`, `reconnected-island-straw.png` and
`restored-island.png`.

The first render attempts exposed an unused background WebGL context's Linux
GPU readback warnings and one Chrome startup failure. The offline portrait
tool now opens that background through the existing Canvas mode; the actual
portrait renderer is unchanged. Local before/after PNG and manifest bytes were
identical, strict console checks remained enabled, and the Linux render passed.
The unpublished failed target was replaced under the guarded release lock;
the final successful run resumed its exact prepared application baseline.

No second real staging account participated, and no synthetic creator revision
was published to staging. Nearby/far-player propagation, Room hibernation and
Accept/Keep across creator revisions are covered by the local checks above.
Production and automatic publishing flags were not changed.
