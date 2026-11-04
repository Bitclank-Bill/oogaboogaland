# Bitcoin-Bill → Bitclank-BIll: proposed account migration

Status: coordination draft for w-s-bitcoin. No account rename or runtime identity change is performed by this PR.

## Identity and scope

- Existing GitHub login: `Bitcoin-Bill`.
- Requested new login, exactly as supplied by Billy: `Bitclank-BIll`. Comparisons must remain case-insensitive.
- Existing numeric GitHub account ID: `185141343`; verify the same ID before and after the rename.
- Existing character file/stable handle: `src/characters/Bitcoin-Bill.js` / `Bitcoin-Bill`.
- Existing display name: `Bitclank Bill`; existing poke: `clank clank`.
- Proposed minimal runtime change: preserve the file, stable handle, look, dates, voice and companion; change the authenticated `github` owner to the verified new login through a maintainer-controlled migration. The exact implementation needs operator approval.
- This is an account rename, not a transfer to a second account. Availability of the requested login is not established by this document.

## Findings from rock edf2c08

1. `worker/src/db.js` keys players by numeric GitHub ID and upserts the current login after OAuth. Existing player state is designed to survive a login rename.
2. OAuth in `worker/src/auth.js` calls `contributorFor(profile.login)` BEFORE that upsert. `worker/src/contributor-policy.js` matches generated cast owners and current contribution logins by text. A renamed account can therefore fail recognition or receive a temporary/default character until the owner mapping and relevant deployment are updated.
3. `src/js/net.js` resolves the owned character using `github || handle` and requires that owner login to equal the authenticated login. Updating GitHub alone does not migrate the existing custom Ooga.
4. `scripts/character-identity.mjs` checks both previous and proposed owner against the submitting login unless the submitter has Maintain/Admin permission. A self-authored owner change can fail before OR after the rename. The documented cosmetic display-name bundle is not an account-owner migration lane.
5. `src/js/characters.js` supports a stable handle with a different GitHub owner. Keeping the stable handle avoids needless model/save/body-key churn. Check all callers rather than assuming this covers every subsystem.
6. `src/js/contributor-identities.js` explicitly supplies contribution attribution, not OAuth aliases or driving permission. Do not use an attribution-only alias to grant access.
7. `scripts/sync-characters.mjs` reserves handles/owners from existing and queued characters. Coordinate refreshed activity data and onboarding to avoid a duplicate new-login default.
8. The high-score migration `worker/migrations/0003_highscores.sql` has a login-rename trigger moving attributed entries by numeric ownership. Inspect subsequent migrations and test current behavior; deployed database state has not been verified.
9. Existing bundled provenance and historical commit authors must not be globally replaced. Old-login reuse must never grant somebody else Billy's custom character or score ownership.

## Proposed sequence

### Before the rename

- [ ] Billy confirms the exact available login in GitHub account settings.
- [ ] Record the account ID, current access/teams and open PR head SHAs. Freeze concurrent identity/character edits during the changeover.
- [ ] Back up all owned repositories/branches/tags and release assets as needed. Save uncommitted, untracked and stashed local work separately; a mirror clone cannot capture those, issue/PR discussion, secrets or service configuration.
- [ ] An authorized OBL operator agrees the migration mechanism, review route and maintenance window.
- [ ] Prepare and review the minimal owner-binding change plus relevant regression tests. Keep this planning PR distinct from activation.
- [ ] Plan page/cast AND Worker updates together: generated Worker cast drives contributor lookup. A source merge alone is not proof that the live site recognizes the new owner.
- [ ] Decide how to handle existing OAuth sessions and already connected room clients. Plan a clean sign-out/re-authentication/reconnect after deployment.
- [ ] Record current scores/custom character and relevant save/companion behavior for comparison.

### Coordinated activation

- [ ] Confirm no relevant branch or identity edits have advanced.
- [ ] Billy renames the SAME account; verify numeric ID 185141343 is unchanged.
- [ ] Operator applies the reviewed owner-binding update using ordinary PR history. Avoid broad permission bypasses and permanent dual-login access.
- [ ] Run normal generation/build, character identity/intake checks, client units and relevant Worker auth/ownership/high-score tests.
- [ ] An authorized maintainer coordinates the required deployment of matching page/cast and Worker. This document does not authorize a deployment.
- [ ] Re-authenticate Billy, verify access, then check ownership and score continuity.
- [ ] Update live Git remotes, active PR handoff references, reviewer mentions and relevant automation prompts after confirming the new login. Preserve historical provenance and closed discussions.

A short interruption may be necessary with the present login-based authorization. If seamless overlap is required, an operator should design a transition bound to the numeric account ID and test it first. Do not simply authorize both old and new names: the old login can be reused.

### Acceptance

- [ ] New login reaches the same player record; no duplicate account/default Ooga.
- [ ] Billy controls his original custom Ooga and gorilla where permitted; another account cannot acquire either through the old spelling.
- [ ] Appearance, chihuahua, `clank clank`, stable handle and intended local saves remain.
- [ ] Contributor activity/boards attach to the intended Ooga across old/new attribution without double counting.
- [ ] Existing high scores survive and show correct ownership; rename collision/reused-login tests pass.
- [ ] Character edit intake works under the new login through the approved process.
- [ ] Existing sessions/reconnects, two-client presence and signed-out rendering behave as expected.
- [ ] Open feature PRs and assigned Genesis Hall #400 remain intact; #400 stays draft.
- [ ] Production checks are recorded separately from local/test evidence.

Respect existing browser STOP history. Missing browser/device access remains unverified, not a pass.

## Recovery

If recognition fails, preserve account ID, records and source history; keep the character stable. Have an authorized operator correct binding/deployment and re-authenticate. Revert corrective source changes only through new commits. Do not delete/recreate the account, erase scores/sessions broadly, rewrite published history or force-push. Do not rely on immediately renaming back: old-name availability is not guaranteed.

## Questions for Wicked

1. Can an OBL Maintain/Admin operator own the actual owner-binding migration, since ordinary self-edit checks compare both owners?
2. Is preserving file/handle with only the `github` owner changed the preferred approach?
3. Should an ID-bound general rename path be added, or should this remain a focused operator migration?
4. Who will coordinate matching page/Worker rollout and verify authentication, activity and scores?
5. Are there Oogatron/external contributor-cache, room, moderation or account-name integrations outside this repository to update?

## Separate owner-side work

Git remotes, GitHub profile/gist links, CODEOWNERS, integration settings, credentials and future Git commit identity need audit. Tee Sniper repository URLs change, while inspected extension license endpoints use teesniper.app. That does not verify live hosting or every external service. No Tee Sniper code is changed here.

References:
- https://docs.github.com/en/account-and-profile/concepts/username-changes
- https://docs.github.com/en/account-and-profile/reference/username-reference
- docs/character-bundles.md
- worker/src/auth.js
- worker/src/contributor-policy.js
- worker/src/db.js
- src/js/net.js
- scripts/character-identity.mjs

Prepared with Codex assistance at Billy's direction. Source inspection only; no migration tests, runtime changes, account rename or deployment performed.
