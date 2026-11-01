# Era 6 — The Whitepaper, 31 October 2008

Prepared with AI assistance (Claude Code), at Bitcoin-Bill's request.

Base: `cb2b0b9405a2d6363c9f284146b4c0aab6d3b34f` (`gv/overhaul`, frozen). Branch: `gv/upgrade-era-6`.
Owned files: this document, `src/js/genesis-era-6.js`, `src/js/genesis-era-6-argument.js` (new) and
`test/genesis-era-6-upgrade.mjs` (new).
Rules: `AGENTS.md`, `docs/genesis-voyage/OVERHAUL-CONTRACT.md`, the header of `src/js/retro-games.js`.
Research: `gv/research:docs/genesis-voyage/eras/era-6-the-whitepaper.md`, v0.1.

This gallery marks the whitepaper's announcement, not a decade of technology. It is a reading room.

## What visitors can use

The exhibits from before are unchanged, with the same ids, words, connections and places:

- the announcement (`e6-announce`, context);
- the paper's reading desk (`e6-paper`, the anchor and the gallery's only trail stop);
- the eight-slot reference shelf (`e6-ref-1` … `e6-ref-8`, bibliography entries pointing to their citation stops in
  Eras 0, 2, 3, 4 and 5);
- the upper shelf (`e6-not-listed`);
- the 2008 laptop at the reference desk (`e6-laptop`, with its 14 October 2008 example specifications);
- two payments, one coin (`e6-payments`, a demonstration of the paper);
- the January door (`e6-january`).

**New: the reading corner.** Three compact stations stand on the right side, between the payments table and the
January door (old coordinates x 13.85–17.45, 33 to 49 m in from the way in). They're clear of the gold walk, the dock
plot, the lamps and every earlier exhibit. Each is a terminal whose commands change its own model, so the workbench's
stage shows the result live. RESET restores each model exactly. All three are `context`: none is a trail step.

| Prop id | What it is | Commands |
|---|---|---|
| `e6-argument` | **Assemble the argument.** A table with six coloured cards on a tray and six slots. Each card is one step of the paper's argument; lay them in the paper's own section order. CHECK lights a green or red lamp over each slot, and a gold lamp when it's solved. | `CARDS`, `PLACE <card> <slot>`, `LIFT <card>`, `CHECK`, `HINT`, `DEAL <seed>`, `RESET`, `MORE`, `SOURCES` |
| `e6-layout` | **Document layout.** The paper's nine pages stand in a row, with a tab on the first page of each of its twelve sections and one for its references. SHOW lifts a tab and a gold bar marks its page; COMPARE adds a teal bar and names both jobs and the references they share. | `SHOW <1..12 or REFS>`, `COMPARE <a> <b>`, `PAGE <1..9>`, `ROLES`, `PAPER`, `RESET`, `MORE`, `SOURCES` |
| `e6-workstation` | **Reading workstation.** An original, unbranded desk with a flat display, keyboard, papers and lamp. The display shows a strip of nine page squares (one lit) and a storage bar; STORAGE redoes the paper's own section 7 sum. | `PAGE <1..9>`, `STORAGE <1..100>`, `LAMP`, `RESET`, `MORE`, `SOURCES` |

Each station has a `hint` (under 90 characters) and a numbered "How to use" in its banner. Its MORE gives the deeper
story and what remained unsolved, so the workbench's columns don't repeat a line.

**The screen game.** `genesis-era-6-argument.js` gives the same puzzle on the retro games' factory interface:
`BL.genesisEra6Games.argument(host)`, a 160×120 screen. It uses the same rules object as the terminal
(`BL.genesisEra6.createArgument`), so the two can't drift apart. It is labelled on screen as "A teaching game / not the
protocol". It has no sound, pays no tickets, and turns its shake and flash off under `still`. It needs integration
before visitors can play it (see "Integration requests" in the hand-over's START-HERE).

## Evidence: what was checked and against what

- **The section titles, their order, the page each starts on and the references each cites** are the paper's own.
  - The bitcoin.org PDF could not be fetched from the build container (its network refuses the host).
  - They were read instead off the nine pages the site already ships: `src/js/whitepaper-pages-data.js`, rasterised
    from bitcoin.org/bitcoin.pdf by `scripts/whitepaper-pages.mjs`.
  - What was read:
    - 1 Introduction (p. 1);
    - 2 Transactions (p. 2, cites [1]);
    - 3 Timestamp Server (p. 2, cites [2]–[5]);
    - 4 Proof-of-Work (p. 3, cites [6]);
    - 5 Network (p. 3);
    - 6 Incentive (p. 4);
    - 7 Reclaiming Disk Space (p. 4, cites [7][2][5]);
    - 8 Simplified Payment Verification (p. 5);
    - 9 Combining and Splitting Value (p. 5);
    - 10 Privacy (p. 6);
    - 11 Calculations (pp. 6–8, cites [8]);
    - 12 Conclusion (p. 8);
    - References (p. 9).
- **The workstation's storage sum** is the paper's own, from section 7: an 80-byte header every 10 minutes, 6 × 24 ×
  365 a year, about 4.2 MB. Its comparison is with the 2 GB of memory that section says computers were commonly sold
  with in 2008. Nothing is quoted; the station says it redoes the paper's sum.
- **Equipment:**
  - The workstation is an original, unbranded design. It names no product and makes no specification claim.
  - Its only dated example is the existing READY gear record (`E6-GEAR`: a laptop announced 14 October 2008), at the
    reference desk across the gallery.
  - The station says nothing here was introduced on 31 October 2008.
- **Words:**
  - The roles ("PROBLEM", "ORDER", "COST" …), the one-line summaries of each section and the six cards' lines are the
    museum's own labels and plain summaries, not quotations.
  - No new Satoshi quotation, no identity speculation.
  - The domain-registration record stays on HOLD and out.

| Displayed date | What it marks | Class |
|---|---|---|
| 2008 (argument game) | the paper whose section order the cards follow; the game is a modern museum homage | context |
| 2008 (document layout) | the paper's own nine-page layout; an original museum model | context |
| 2008 (workstation) | the period illustrated; an original design, not equipment introduced on 31 October 2008 | context |

## Scene records

Era 6 built 196 records before this change and 290 after: **94 added** (85 solids, 3 signs, 3 obstacles and
3 exhibits). They add no point lights; lit parts are emissive. Nothing moves by itself: the models change only on a
command, so the stations need nothing in `update`, and reading and Calm stay quiet.

## Checks

`node test/genesis-era-6-upgrade.mjs` runs 16 rule checks in Node with a recording stand-in kit:

- the record budget;
- earlier ids and connections kept;
- the new exhibits are context, with year labels, hints and resolving sources;
- one trail stop;
- placement in the gallery, off the walk, the reserved plots and every earlier exhibit;
- height;
- HELP gives workbench buttons, MORE gives the story, and no line repeats;
- odd input;
- each station's commands change its model, and RESET restores it exactly;
- seeded deals;
- section data;
- the paper's 4.2 MB a year;
- a fresh visit;
- the screen game's interface and its win, mistake and stop rules.
