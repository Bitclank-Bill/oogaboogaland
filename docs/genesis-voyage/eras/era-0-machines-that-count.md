# Era 0: Machines That Count (1956–1969)

Research dossier · checked 31 October 2026 · content/design only, no implementation.

## Summary for a 12-year-old (3–5 sentences)

Before computers fitted in pockets, storing information could require a cabinet bigger than you. People learned to keep records on spinning disks and to connect distant computers. Probability also gave them ways to reason about races with uncertain outcomes. Bitcoin later cited an older probability book, but these machines and networks were background, not Bitcoin prototypes.

## The deeper story (2–4 paragraphs)

The IBM 350 disk unit belonged to the IBM 305 RAMAC system, introduced in 1956. Its disks let a machine reach a selected record without reading every earlier record first. This exhibit is about changing access to information, not claiming RAMAC invented all computer memory. A transparent, slowly turning model is more useful than a busy wall of flashing lights. [E0-IBM, E0-CHM]

A separate probability desk introduces an uneven race: the player can change each side's chance of taking the next step. The Bitcoin whitepaper's section 11 explicitly uses a random-walk comparison and cites William Feller's book as reference [8]. Its bibliography specifies 1957; that is a cited edition year, not the invention date of probability. Do not present the short simulation as a prediction of actual Bitcoin security. [E0-WP, E0-FELLER]

The room ends at two linked terminals. UCLA's preserved log and participant account date the first ARPANET host-to-host message to 29 October 1969. An attempted login reached only its first two letters before failure; a later retry succeeded. Networking and storage explain the setting in which later systems became possible. Neither is evidence that its designers planned Bitcoin. [E0-ARPANET]

## Exhibits (Bitcoin line)

### Feller's probability shelf

- **Date and meaning:** 1957, edition year given in Bitcoin's bibliography and the SNI catalogue. Exact publication day not established here.
- **Contribution:** Tools for reasoning about random processes; Bitcoin cites Feller in its attacker catch-up calculation.
- **Problem left unsolved:** This is mathematics, not a distributed payment or double-spending protocol.
- **Primary passage actually read:** Bitcoin §11: “Gambler's Ruin problem” (3 words). Primary URL: https://bitcoin.org/bitcoin.pdf . SNI catalogue cross-check: https://nakamotoinstitute.org/library/introduction-probability-theory-vol-i/ .
- **Connection:** **whitepaper citation**, reference [8]; do not substitute an unsupported personal-influence story.
- **Confidence:** High for citation/year and §11 connection; original 1957 volume not consulted.
- **Open questions:** Check a lawful scan of that edition before quoting Feller himself or giving an edition-specific page.

### ARPANET's interrupted login

- **Date and meaning:** 29 October 1969, first recorded ARPANET host-to-host message, UCLA to SRI; not the invention date of the Internet or Web.
- **Contribution:** Demonstrated communication between remote networked hosts.
- **Problem left unsolved:** Moving a message does not establish trustworthy ownership or prevent spending a digital token twice.
- **Primary passage actually read:** “the system crashed!” (3 words), participant Leonard Kleinrock's account accompanying the log. URL: https://www.lk.cs.ucla.edu/internet_first_words.html .
- **Connection:** **context**; absent from the whitepaper bibliography.
- **Confidence:** High for date, hosts and interrupted login; participant retrospective supported by reproduced contemporary log.
- **Open questions:** A staged animation must label its simplified terminals as an illustration, not reproduce an invented transcript.

## Period gear to play with

| Item / date meaning | Numerical fact and checked source | Mechanic / originality |
|---|---|---|
| IBM 350 disk unit, 1956 introduction; CHM records first shipment in June | 50 disks, each 24 inches across; five million 6-bit data characters. [E0-CHM] https://www.computerhistory.org/storageengine/first-commercial-hard-disk-drive-shipped/ ; manufacturer retrospective [E0-IBM] https://www.ibm.com/history/ramac | Pick a numbered record and watch an original stylised arm find it. Slow decorative rotation; no copied photographs, logo or engineering drawing. |
| Modern comparison window: Micron c200 1 TB microSD, announced 25 February 2019, broad availability forecast Q2 2019 | Manufacturer announced 1 TB on a tiny removable card. [E0-MICROSD] https://investors.micron.com/news/press-release/2019/Micron-Unveils-Worlds-First-1TB-microSD-Card-to-Meet-Consumer-Demand-for-Mobile-Storage-02-25-2019/default.aspx | Label **2019 comparison—outside this era**. Original blank card silhouette beside a human-scale cabinet. Do not claim it existed in 1956. |

**Capacity note:** Do not label the RAMAC simply “5 MB” or promise an exact storage ratio. IBM's retrospective discusses encoded characters; CHM calculates 3.75 MB from six data bits per character. Payload, encoding overhead and decimal units must be stated consistently before a ratio ships. “Five million characters versus a 2019 one-terabyte card” is the safe first label.

**Deferred gear:** Punch-card and teletype props can be generic scenery. Model-specific capacity, introduction date and acoustic claims remain unverified; do not attach invented specifications.

## Era boat

**Type:** Wooden clinker-built rowing skiff with two rowing positions. **Documented availability:** Royal Museums Greenwich's actual Thames skiff BAE0072 was made in **1905**; its catalogue says this type was common from the mid-nineteenth century. This establishes availability before 1956, not the type's first invention date. Source [E0-BOAT]: https://www.rmg.co.uk/collections/objects/rmgc-object-11437 . Confidence high for suitability, first-ever type date unresolved. Use an original shallow voxel hull, plain benches and oars; do not use the catalogue's questionable displayed dimensions as construction measurements.

## Music direction

Creative proposal: quiet brushed percussion, plucked bass-like tones and sparse electric-piano-like notes at 76–88 BPM. Original motifs: two alternating short notes for a seek operation; an uneven five-note question for probability; a two-note terminal interruption resolved only at departure. These are design directions, not claims about a particular recording. No songs, samples, artist imitation or period commercial recordings.

## Easter eggs

Original “Record Finder”: choose a record from a tray, then compare walking through every tray with selecting its location directly. Original “Retry the Message”: reconnect three abstract packet paths after one fails. These are bespoke minigames, not emulations or unlicensed game links.

## Captions (draft)

1. “1956: this disk system brought selected records within reach.” [E0-IBM, E0-CHM]
2. “Fifty large disks held five million data characters.” [E0-CHM]
3. “The small card is a 2019 comparison, not a visitor from 1956.” [E0-MICROSD]
4. “1957 is the Feller edition year cited in Bitcoin's paper.” [E0-WP, E0-FELLER]
5. “Change the odds. Watch the race change.” [E0-WP; original interaction]
6. “29 October 1969: a login attempt links UCLA and SRI.” [E0-ARPANET]
7. “Two letters arrive. The first attempt stops.” [E0-ARPANET]
8. “A working network still needs rules for digital money.” [E0-WP; contextual explanation]

## Corrections to the chart / README table

- Keep Feller 1957, but identify a **cited edition**, not a new invention of probability.
- ARPANET 1969 marks the host-message event; distinguish the Web and later internetwork protocols.
- RAMAC's 1956 year is supported; introduction and first shipment are different milestones. Do not invent an exact shared day.
- Correct bare “5 MB” to five million characters, with an encoding note; modern microSD belongs in a labelled comparison window.
- A rowboat need not be invented during this room's years. Date the documented historical example.
- **Chart limitation:** the original chart image was not supplied in this research context. These checks cover assigned topics; an entry-by-entry chart audit remains pending.

## Source register / verification limits

All URLs above were opened and read on 31 October 2026. E0-WP is the primary whitepaper; E0-IBM and E0-MICROSD are manufacturer accounts; E0-ARPANET is a participant account with a log; E0-BOAT is a museum object record. E0-CHM and E0-FELLER are clearly identified museum/catalogue cross-checks. No quotation is attributed to an unread Feller book. No claims about Satoshi's identity. No scene, geometry or audio has been built or tested by this dossier.
