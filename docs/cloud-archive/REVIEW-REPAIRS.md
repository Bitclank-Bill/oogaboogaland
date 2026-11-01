# Cloud Archive · review repairs

Repairs to `feature/cloud-archive` after review of `ddcef532833710ef4fa9767050d009d6ef8d3a5e`. The findings are the
maintainer's consolidated list from the Astra and Claude browser reviews, grouped by priority as given. Each row says
what changed and what shows it. "Unit" means `npm run test:unit`, whose `cloud archive history` check holds every
regression case below. "Browser" means the scripted sessions run on software GL (SwiftShader) for this repair, which
are described in the report that accompanies these commits.

## 1 · Contributor attribution and PR accuracy

| Finding | Resolution | Evidence |
|---|---|---|
| Display names were mapped to logins, so two people sharing a name became one identity | Removed. An identity is a GitHub account only through a noreply address; any other author is its own identity per exact address. Labels are numbered when two identities share one, and an account's login is never renamed | Unit: `collision`, `unknown`. Before/after: fails on `ddcef53`, passes now |
| The branch owner in "from owner/branch" was credited as the PR's author | Removed. PR authorship is not shown; a merge commit keeps its own git author | Unit: `noBranchOwner`. Before/after |
| A merge-looking subject or a "(#N)" suffix counted as a merged PR | A PR counts only when a merge commit's second parent is GitHub's published `refs/pull/<n>/head` (read with `git ls-remote`). On official `rock`, 254 of the 257 "Merge pull request #N" subjects verify; 258 distinct PRs are counted in all | Unit: `fakeMerge`, `realMerge`. Before/after |
| Use verified GitHub metadata, or describe the narrower attribution honestly | The API is not reachable from the build container for the official repository, so the archive claims only what git and GitHub's published PR refs show. The provenance, the plan and every day's note say so | Snapshot `provenance`; board note |
| Organisations, automation and agents mixed with human counts; kinds read from display names | Kinds come only from a `[bot]` noreply login (automation) or the reviewed mapping `scripts/cloud-archive-identities.json` (agents, organisations), never a display name. Counts and boards list authors apart from automation and agents | Unit: `unknown` (a person named "Claude" stays an unlinked author) |
| Reviewed identity mapping; no email addresses; no speculative matches | The mapping holds two entries, Claude Code's and Codex's service identities, keyed by SHA-256, never by address. No address, and no hash of a personal one, reaches the data. Addresses inside titles are replaced (one PR merge's first body line was a `Co-Authored-By` trailer) | Unit: `noAddress`, `snapshot` |
| History came from whatever HEAD was checked out | `npm run archive -- --rev <sha>` requires a full SHA on official `rock`, read with `ls-remote`. It refuses fork commits, short SHAs and shallow clones. Provenance records repo, branch, rev and official tip, and commit links point at that repository | Unit: `selectsRev`, `refusesFork` (temporary repositories, end to end). Before/after: the reviewed script shelves a fork-only commit |
| Regenerate after reviewing the generator | Regenerated from `rock` at `37d9f3947bbff844f792595471e3eb99ab13e7f9`: 2,029 commits on 53 UTC days, 258 verified merged PRs, 13 linked accounts, 13 unlinked author identities, 2 automation identities, 2 AI agents | `src/js/cloud-archive-data.js` |

## 2 · Keyboard and touch access

| Finding | Resolution | Evidence |
|---|---|---|
| No keyboard way to read a shelf | Facing a shelf on the floor, Space (or the act button, READ) opens its day, through the crew's own `useNear` | Browser: real Space at rack 2 opens day 2 |
| Chairs and shelves could compete for Space | One resolver (`findNear`) picks the nearer of a faced shelf and a free chair; Space does exactly that one thing | Browser: Space by a chair sits and opens no board |
| Touch wording, and a usable stalk-entry action | On the island the beanstalk's prompt said "ENTER ARCADE", because the act chain had no branch for it. It now reads CLIMB, with touch hints. Inside, the act button reads READ, SIT, STAND UP! or ISLAND as appropriate | Browser (touch emulation): tapping CLIMB enters; tapping READ opens the day |
| Board keys, closing and focus must not move the Ooga or leave | Checked with real keys: the arrow keys flip days, the Ooga stays where it stood, and Escape closes the board without leaving the scene | Browser session 1 |

## 3 · Safe exit and arrival

| Finding | Resolution | Evidence |
|---|---|---|
| Falling into the shaft sent the visitor home | Home now takes a deliberate act: getting off the ladder at the foot after having climbed, Space (ISLAND) at the foot, Leave, or Escape. A fall lands at the foot with a hint, and the Ooga can climb back up | Browser: walked into the shaft, still in the archive after 3 s; Space at the foot then goes home |
| Direct entry had no coherent return | Any way out marks the beanstalk as standing (`world.archiveRevealed`), so a page that opened straight in the archive returns beside a stalk. Leave is visible from arrival, and the TV says how to tune in | Browser session 2 |
| Unused `archiveExit` state | Removed | Code |
| Fragile `children[1]` reference | `build()` returns `stalk` by name | Code |

## 4 · Motion, buffers and snapshots

| Finding | Resolution | Evidence |
|---|---|---|
| Reduced motion was ignored by the cloud hit and the TV | Under `prefers-reduced-motion` a hit neither flashes nor pulses the cloud, and the stalk stands at once. The TV has no snow and no auto-advance, and changes only by hand | Browser session 2 |
| The TV changed page under someone reading its board | While the island-cam board is open the TV holds its channel; pages turn only by hand | Browser session 1: 12 s with the board open, channel unchanged |
| Per-paint `ImageData` and per-shot canvases | The snow `ImageData`, channel captions and counters are made once per visit. Island pictures go into at most six 480x360 canvases, made once a page, reused by every climb and filled at climb time; nothing is allocated per frame | Code |
| Snapshot approach; live cutaway and player state contaminating captures | `renderArchiveView` in the hub draws as `snapFromShield` does: cutaway off, the visitor's own Ooga hidden. The options go into one reused object | Code |
| Bound capture resolution and work; measure | At most six pictures, one a frame during the 0.45 s move in, each copied once at 480x360 from a centred 4:3 crop. Draw-and-copy times are recorded per picture (`shotCosts`). SwiftShader timings appear in the report and are not hardware claims | Browser session 1 |

## 5 · History completeness and packaging

| Finding | Resolution | Evidence |
|---|---|---|
| A day over 192 commits silently lost books | The generator's `SHELF` rule: a busier day keeps 191 books plus one overflow binder, counted on the plaque and board. The models check at load that their rack matches the data's capacity. No day overflows today (the busiest has 184) | Unit: `overflow`, `rackOverflow` (the real models build a 250-commit day as 191 books plus the binder) |
| UTC day links and date-filter semantics | Days are UTC by committer date. The day link no longer uses `since`/`until` (GitHub reads those in the viewer's time zone); it opens history from the day's last commit SHA, which is exact | Code; board links |
| Portable-page size impact | The single-file `oogaboogaland.html` grows from 39,316,029 to 39,603,300 bytes (+287 KB, +115 KB gzipped, about 0.7%). The data accounts for 223 KB (93 KB gzipped) of that. On the hosted site it is all in the deferred `cloudarchive` chunk, fetched only on climbing in. No packaging change was made | Build measurements |
| Inconsistent location descriptions | The plan now says "west meadow", as the code does (foot at x = -9, z = 5). The plan's "no chairs or TV" line now describes the lounge the maintainer asked for | Docs |

## Block Frenzy view-assist branch

`feature/block-frenzy-view-assist` (`5f42979…`) was inspected. Its `view-assist.js` is byte-identical to this branch's,
and none of these findings touch view assist's logic, so it needs no matching change and was left untouched.
