# Era 0: Machines That Count (1956–1969)

Implementation: `src/js/genesis-era-0.js`. Integration base:
`gv/water-boat` at `aa9154224b7ac284cc53d5684e81c46f9ef41a27`.
Uses the existing `genesisExhibits.register(0, { sources, build })` kit.

## What is playable

The original Feller shelf and ARPANET information display remain. A large bank-level
1956–1969 sign, overview panel and highlighted whitepaper-reference sign introduce
five original activities. Walk up and use the existing Space/USE interaction.
The existing terminal dialog takes typed commands; these are not real operating systems.

| Station | Commands | Visitor-visible result |
|---|---|---|
| Disk record finder, 1956 | `SEEK 0` through `SEEK 49`, `INFO`, `RESET` | A schematic arm selects a height among 50 platter silhouettes. Close the dialog to inspect it. Selection is immediate, not a timed mechanical animation. |
| Punch a museum message, period illustrated 1956–1969 | `PUNCH BILL`, `FLIP 1 7`, `READ`, `INFO`, `RESET` | Up to eight characters become holes; toggling one bit changes the decoded message. The code and card layout are explicitly invented today. |
| Probability race, cited edition 1957 | `ODDS 25`, `STEP 16`, `STATUS`, `INFO`, `RESET` | Two markers advance according to a seeded sequence, at most 64 total steps. Changing odds restarts the race. |
| Retry the login, event 29 October 1969 | `LOGIN`, `RETRY`, `STATUS`, `INFO`, `RESET` | First attempt stops after LO, then retry delivers LOGIN. A fixed lamp changes state. Prompts and timing are museum reconstructions. |
| Modern comparison, announcement 25 February 2019 | Open the two-page panel | A schematic card is explicitly outside the cave's historical period. No exact scale or capacity ratio is asserted. |

The original information panels contain the deeper history and source links. Activity
terminals offer `INFO` for provenance and limitations. All state resets on scene rebuild.
Closing/reopening a terminal within the visit preserves its activity state.

## Historical scope and sources

Pages read directly on 31 October 2026, alongside the Era 0 dossier on `gv/research`:

- **Storage, context:** [Computer History Museum](https://www.computerhistory.org/storageengine/first-commercial-hard-disk-drive-shipped/).
  June 1956 marks the first commercial shipment recorded by this source. The cabinet's
  five-million-character label avoids an unexplained bytes conversion. Its 50 square
  platter silhouettes and toy record mapping are schematic, not engineering drawings.
- **Punched records, context:** [IBM's RAMAC history](https://www.ibm.com/history/ramac).
  Supports punched cards as background. The eight-column, seven-bit coding toy is an
  original museum analogy, not Hollerith, BCD, ASCII-era hardware, or an authentic card.
  No year of invention is assigned to the toy.
- **Feller, whitepaper citation:** [Bitcoin whitepaper](https://bitcoin.org/bitcoin.pdf),
  section 11 and reference 8, with the [SNI catalogue](https://nakamotoinstitute.org/library/introduction-probability-theory-vol-i/)
  inherited from the dossier. 1957 is the cited edition year. The race illustrates changing
  odds, not the paper's attacker catch-up calculation, a Bitcoin security forecast or
  statistically independent trials. Original volume not consulted; no Feller quotation.
- **ARPANET, context:** [Kleinrock/UCLA and reproduced IMP log](https://www.lk.cs.ucla.edu/internet_first_words.html).
  Date refers to the host-message attempt. This exhibit does not claim the Web began then,
  reproduce an authentic terminal transcript, or establish a Bitcoin influence.
- **Outside-era comparison:** [Micron announcement](https://investors.micron.com/news/press-release/2019/Micron-Unveils-Worlds-First-1TB-microSD-Card-to-Meet-Consumer-Demand-for-Mobile-Storage-02-25-2019/default.aspx).
  Announcement date and capacity are distinguished from availability; enlarged blank
  card geometry is not to scale.

IBM and CHM use different encoded-bit descriptions in their retrospectives. No exact
storage ratio is displayed. No external assets, quotes, recordings, new dependencies,
network calls, personal data or historical-person likenesses were added.

## Integration, performance and cleanup

- Only this era module and this document change; script loading is already wired at the base.
- All stations sit on the banks, away from the channel, ramps, cave walls and each other.
  Physical station footprints are passed to the kit's existing obstacle system.
- All geometry is allocated in `build`. There is no `update`, timer, sound context or listener.
  Commands reposition or reveal existing nodes; they do not create additional geometry.
- Input strings are capped at 96 characters, punched data at eight characters, and the race
  at 64 steps. Responses are printed through the existing text-only terminal and its bounded log.
- State and model references live in per-visit prop closures, not module-level caches.
  The scene clears its registry and graph on leave; re-entry creates fresh closures.
- These are local visitor activities, not synchronized multiplayer games.
- **Integrator:** the older drive plinth and unverified comparison text in Era 3 remain
  outside this change. Remove/replace them through the shared scene/props owner; do not
  mistake this Era 0 implementation for verification of that older exhibit.

## Verification and acceptance

Follow AGENTS.md's default **wait** mode: build and syntax verification; no browser or
probe run is implied. Results are reported in the handoff. Shared test/run.mjs is owned
by the integrator and was not edited. Its existing exhibit proof checks registration,
source resolution, year labels and bank/cave placement, but not the new command rules.

Before acceptance, extend that existing proof (do not add a new test file) to cover:

1. SEEK 0/49 select the endpoint heights; invalid, fractional and excessive values change nothing.
2. PUNCH A then FLIP 1 7 decodes @. Eight characters work; nine are rejected without mutation.
   RESET hides every hole and clears the message. Bad columns/bits do not alter the card.
3. ODDS 100 then STEP 64 gives gold 64, blue 0; ODDS 0 gives the reverse. Additional steps
   cannot exceed 64. Reset repeats the seeded sequence and restores default odds.
4. RETRY before LOGIN does not skip failure; LOGIN produces LO, RETRY produces LOGIN;
   repeated LOGIN cannot skip ahead. RESET restores the ready state and lamp.
5. Build, interact, leave and rebuild: no state or node references survive the visit.
6. Real-browser walk-up and tap targets, signs from boat and bank, keyboard and touch text
   entry, reading/input isolation, standing clearance, two leave/return laps and performance.

Real-browser rendering, touch, hardware performance and human playtesting remain unverified.
The models are intentionally a first version, not historically exact reconstructions.

Prepared with AI assistance (OpenAI Codex).
