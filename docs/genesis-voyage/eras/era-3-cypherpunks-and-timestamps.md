# Era 3: Cypherpunks and Timestamps (1990–1995)

Research dossier v0.1 · 31 October 2026. READY entries may inform a draft scene; HOLD entries are not cleared for factual exhibit labels. Dates are only as precise as the evidence permits.

## Summary for a 12-year-old (3–5 sentences)

A digital page can be copied or changed without leaving a torn edge. Researchers explored how fingerprints and linked records could reveal changes and establish that information existed by a certain time. Other people built tools for private messages and argued that privacy should be available to ordinary users. These were different projects with different goals, not unfinished versions of Bitcoin. [E3-HS, E3-BHS, E3-PGP, E3-HUGHES]

## The deeper story (2–4 paragraphs)

Haber and Stornetta's journal paper proposes ways to timestamp data without disclosing its contents. It examines both linking and distributed-trust approaches, including a service that might collude with a user. Do not reduce its contribution to trusting an honest clerk. A timestamp helps constrain when data existed; it does not prove that a claim in the data is true. [E3-HS]

Bayer, Haber and Stornetta improve storage and verification through trees and shared publication. A batch of documents can share a compact commitment while each document retains a verification path. The existing desk is an educational illustration of these ideas, not an implementation of the papers. Label its short FNV-1a fingerprints as insecure toys; accidental collisions remain possible. [E3-BHS; implementation distinction]

Dwork and Naor explore computation as a price for access to a resource, such as email. PGP and Hughes's manifesto represent a wider privacy movement. They belong beside the technical exhibits as context; none is directly cited by the whitepaper. Avoid implying that all people in this community agreed on politics or that the authors individually influenced Satoshi without evidence. [E3-DN, E3-PGP, E3-HUGHES]

## Exhibits (Bitcoin line)

### Timestamp a page — READY
- **Date and meaning:** 19 August 1990 manuscript received; 26 October 1990 revised; journal publication **1991**, volume 3, pp. 99–111. These are manuscript and publication events, not a 2001 online-upload invention date. A CRYPTO '90 presentation is listed in the existing register; the journal alone supplies the dates used here.
- **Contribution:** Hashing, linking and distributed trust make certain backdating/forward-dating attacks infeasible under stated assumptions.
- **Problem left unsolved:** No open monetary ledger or Bitcoin proof-of-work chain selection.
- **Primary source / passage actually read:** [E3-HS](https://gwern.net/doc/bitcoin/1991-haber.pdf), journal PDF mirror, abstract and §§5–6: “even with the collusion of a time-stamping service”.
- **Connection:** **whitepaper citation**, reference [3]. Citation classification checked against the bibliography in [E3-WP](https://bitcoin.org/bitcoin.pdf).
- **Confidence / open questions:** High for journal dates and mechanisms. Presentation-day plaque deferred until the conference record is registered.

### One tree, many pages — READY
- **Date and meaning:** **March 1992**, date printed on the author-hosted manuscript; **1993**, publication year of the cited Sequences II chapter. The earlier Sequences '91 workshop is a separate event; do not call March 1992 the book publication.
- **Contribution:** Tree batching reduces certificate storage and verification work and increases shared publicity.
- **Problem left unsolved:** Efficient timestamp certificates do not select a valid transaction history among adversarial peers.
- **Primary source / passage actually read:** [E3-BHS](https://www.math.columbia.edu/~bayer/papers/Timestamp_BHS93.pdf), abstract and introduction: “By using trees”. Publisher record [E3-BHS-PUB](https://doi.org/10.1007/978-1-4613-9323-8_24).
- **Connection:** **whitepaper citation**, reference [4].
- **Confidence / open questions:** High for manuscript/book distinction. Do not attribute tree invention to this 1993 chapter; it explicitly draws on earlier Merkle work.

### Make bulk messages cost work — READY
- **Date and meaning:** **1992**, preliminary presentation at CRYPTO '92, as stated in the author PDF; **1993**, proceedings edition listed in the source register. Do not print a precise conference day from this PDF.
- **Contribution:** Require a moderately expensive computation to discourage frivolous resource use.
- **Problem left unsolved:** Resource pricing is not transferable decentralized money or transaction consensus.
- **Primary source / passage actually read:** [E3-DN](https://www.wisdom.weizmann.ac.il/~naor/PAPERS/pvp.pdf), abstract and introduction: “a moderately hard, but not intractable, function”.
- **Connection:** **context**; not a whitepaper reference. No direct Satoshi influence proof established here.
- **Confidence / open questions:** High for stated presentation year and mechanism. Avoid the absolute claim “first ever proof-of-work.”

### Private messages on ordinary computers — READY
- **Date and meaning:** **1991**, PGP electronically published according to Zimmermann; essay dated **June 1991**, explicitly **updated 1999**. This source is a revised participant account, not an untouched release artifact.
- **Contribution:** Publicly distributed encryption tools for private communication.
- **Problem left unsolved:** Message encryption does not establish monetary ownership or prevent double-spending.
- **Primary source / passage actually read:** [E3-PGP](https://www.philzimmermann.com/EN/essays/WhyIWrotePGP.html), publication explanation: “publish PGP electronically for free that year”.
- **Connection:** **context**.
- **Confidence / open questions:** High for author's account; exact first-distribution day requires a release record.

### Privacy and working code — READY
- **Date and meaning:** **9 March 1993**, date on Hughes's manifesto, reprinted by SNI.
- **Contribution:** Argues for selective disclosure, anonymous transactions and practical cryptographic tools.
- **Problem left unsolved:** A statement of goals is not a complete money protocol.
- **Primary source / passage actually read:** [E3-HUGHES](https://nakamotoinstitute.org/library/cypherpunk-manifesto/): “Privacy is not secrecy.”
- **Connection:** **context**.
- **Confidence / open questions:** High for dated text; no personal influence or endorsement inferred.

### Community and companies — HOLD for date plaques
- **Cypherpunks group/list:** **September 1992**, participant retrospective reported in the existing register. Proposed connection **context**. [E3-CYPH](https://koeln.ccc.de/archiv/drt/cyphernomicon/chapter3.html) was unreachable in this pass; **no new quotation or precise first-message date**. Obtain a readable primary copy before a dated exhibit.
- **DigiCash:** proposed circa **1990 company launch**, distinct from Chaum's 1982 paper. Proposed connection **context**. The register relies on a contemporary journalistic account and conflicts with an unsourced 1989 claim; primary incorporation/launch evidence remains missing. Do not print a definitive founding date or claim Bitcoin's direct descent.
- **Surety:** proposed **1995 operational timestamping**, connection **context**. E4-NAMES's original abstract states an implementation had been in use since **January 1995**; this supports the implementation date, **not** the first New York Times advertisement date. The register's “newspaper since 1995” remains unverified against a dated issue. No claim that Surety itself is a named whitepaper citation.

## Period gear to play with

- **1993 office PC, with an existing processor family:** Intel's date-index records **10 April 1989** introduction of the 486 DX family; the family record lists a **25 MHz** configuration, among later/family variants. Use that as a conservative labelled example, not a claim that every listed speed shipped on launch day. [E3-CPU](https://www.intel.com/pressroom/kits/quickrefyr.htm), 1989 entry. Mechanic: an original OOGA-DOS prompt with DIR, TYPE and HASH. Period hardware can remain in use later; the museum notes must be labelled written today. Draw a generic beige case, blank keyboard and monitor; no logos or copied OS screens.
- **Deferred gear:** BBS, pager, 16-bit console and 3.5-inch floppy are not specification-cleared by this dossier. Add a model-specific manufacturer record before attaching capacity, price or launch-year claims.

## Era boat

**Type:** Personal watercraft. **Documented availability:** Kawasaki records the **1973 release** of its mass-production stand-up JS400; its history also lists a **1995** sit-down-era model, establishing the type's continuing period availability. [E3-BOAT](https://answers.khi.co.jp/en/mobility/20160731e-01/). This dates manufacturer examples, not invention of every water scooter. Draw an original short hull with handlebars and an abstract seat, without brand name, distinctive livery or copied commercial silhouette. For accessibility, the visitor need not adopt a standing control posture.

## Music direction

Creative art direction, not documentary evidence: early-1990s FM-like keyboard tones, restrained drum-machine percussion and warm pads; 88–104 BPM. Newly compose a stamp-and-answer motif, a branching arpeggio and a slowly resolving privacy theme. No song titles, quotations, samples or artist imitation. The audio should remain optional and quiet enough for reading.

## Easter eggs

Original mini-games: a 1991-inspired message-envelope matching puzzle, a 1992-inspired work-budget challenge and a 1993-inspired branching certificate puzzle. Years identify exhibit inspiration, not the release of real games. No ROM, emulator or third-party play link is needed.

## Captions (draft)

1. 1991 publication: a digital timestamp can reveal attempts to rewrite the past. [E3-HS]
2. The paper considers a dishonest timestamp service too. [E3-HS]
3. A timestamp is evidence about data, not proof its story is true. [E3-HS; interpretation]
4. 1992 manuscript, 1993 book: tree batches make verification smaller. [E3-BHS, E3-BHS-PUB]
5. This desk is an illustration, with an insecure toy fingerprint. [original demonstration; not a historical claim]
6. A 1992 presentation prices resource access with computation. [E3-DN]
7. PGP's author describes making encryption publicly available in 1991. [E3-PGP]
8. 9 March 1993: Hughes argues for privacy and selective disclosure. [E3-HUGHES]

## Corrections to the chart / README table

- Fingerprints and Time belongs to **Era 3**, not Era 4. BUILD-PLAN's opening sentence conflicts with its own era table.
- Separate manuscript receipt, conference presentation, printed publication and later online upload dates.
- Keep the Bayer manuscript's March 1992 date apart from the 1993 cited book and the earlier workshop.
- Don't describe all earlier timestamping as requiring an entirely honest central server.
- PGP, Dwork–Naor, the cypherpunk community and Hughes are context; the whitepaper cites the two timestamp papers directly.
- DigiCash's founding year and Surety's first newspaper notice remain HOLD. Don't convert a draft table into evidence.
- The supplied chart image is unavailable here: corrections cover the plan/register topics, not a completed audit of every unseen entry.
