# Era 4: Work and Scarcity (1996–1999)

Research dossier v0.1 · 31 October 2026. READY entries support draft content; HOLD entries must not become definitive plaques.

## Summary for a 12-year-old (3–5 sentences)

Can a computer make a useful stamp by doing work? Can many people keep the same money records? During these years, proposals explored costly computation, shared accounts and names that could be checked against digital documents. Each solved some problems while leaving others open. Bitcoin would later cite several of these works, but it was not launched in this era. [E4-HC, E4-BM, E4-NAMES, E4-TIMESEC]

## The deeper story (2–4 paragraphs)

Back's 1997 message announces a computational postage implementation. Producing a stamp costs searches; checking it is comparatively cheap. Its spent-stamp database is not Bitcoin's network-wide consensus system. The 2002 Hashcash paper belongs in Era 5 and is the actual whitepaper bibliography item; don't relabel the 1997 announcement as that cited paper. [E4-HC; E5 Hashcash dossier]

Dai's b-money essay gives two protocols. The first assumes a synchronous, unjammable anonymous broadcast channel and gives every participant an account database. The second uses a subset of participants as servers with deposits and published commitments. The appendix explicitly identifies difficulty agreeing the cost of computation. Explain these assumptions instead of presenting b-money as completed Bitcoin. [E4-BM]

The timestamp and naming benches ask different questions: how to identify a bit-string reliably, and how to reduce trust in a timestamp authority. Neither is a cryptocurrency. The TIMESEC paper explicitly chooses a third-party design while reducing what must be trusted. This is more accurate than a simplistic progression from fully trusted clocks to trust-free Bitcoin. [E4-NAMES, E4-TIMESEC]

## Exhibits (Bitcoin line)

### Computational postage — READY
- **Date and meaning:** **28 March 1997**, archived mailing-list announcement of an implementation. Date is the message event, not the 2002 paper publication.
- **Contribution:** Adjustable computational cost for postage-like stamps, with cheap verification and local spent-stamp tracking.
- **Problem left unsolved:** No distributed transaction ordering or transferable Bitcoin ledger; the service must track accepted stamps.
- **Primary source / passage actually read:** [E4-HC](https://mailing-list-archive.cryptoanarchy.wiki/archive/1997/03/1fea96e9a08fb74d7f1fdeca362f943dcb2ca70017b092359eb8f931e11004cf/), original Back message archived: “A partial hash collision based postage scheme”. Treat the historical wording as the announcement's terminology, not a modern security recommendation.
- **Connection:** **documented influence**, for the Hashcash approach. Proof: Satoshi's announcement identifies Hashcash-style proof-of-work in [E4-INFL](https://satoshi.nakamotoinstitute.org/emails/cryptography/1/); Bitcoin cites the **2002** paper as [6], not this announcement.
- **Confidence / open questions:** High for date/design; author-site copy was unreachable, so use the archived message. Do not assert the quoted benchmark is representative of all 1997 PCs.

### Name the exact document — READY
- **Date and meaning:** **April 1997**, CCS proceedings publication, pp. 28–35; publisher lists 1 April as publication date. An implementation in use since **January 1995** is an earlier deployment claim made in the paper, not its publication date.
- **Contribution:** Verifiable names using positions in a growing directed graph of hash values, addressing cumbersome hash names and changing hash strength.
- **Problem left unsolved:** Identifying data does not determine who may spend money.
- **Primary source / passage actually read:** [E4-NAMES](https://cdn.nakamotoinstitute.org/docs/secure-names-bit-strings.pdf), abstract: “a cryptographically verifiable label for any bit-string”. Metadata [E4-NAMES-CAT](https://nakamotoinstitute.org/library/secure-names-bit-strings/); DOI https://doi.org/10.1145/266420.266430 .
- **Connection:** **whitepaper citation**, reference [5].
- **Confidence / open questions:** High for text/month. Do not mistake the preliminary program title Secure Digital Names for a different proven invention.

### Shared pseudonymous accounts — READY
- **Date and meaning:** **November 1998**, publication month catalogued by SNI for Dai's original essay. No exact publication day established here.
- **Contribution:** Proposed work-based issuance, signed transfers and shared account records, with two alternative participation arrangements.
- **Problem left unsolved:** Strong communication assumptions and agreement on computation cost; second design retains trusted servers to a degree.
- **Primary source / passage actually read:** [E4-BM](https://nakamotoinstitute.org/library/b-money/), introduction and both protocols: “I will actually describe two protocols.”
- **Connection:** **whitepaper citation**, reference [1]. Do not infer that Satoshi knew the essay before developing any Bitcoin ideas; citation proves reference, not the entire design chronology.
- **Confidence / open questions:** High on content/month; exact first posting day unresolved.

### Reduce trust in a timestamp service — READY
- **Date and meaning:** **May 1999**, proceedings month specified in Bitcoin's bibliography and SNI catalogue. No precise symposium day is required for this label.
- **Contribution:** TIMESEC timestamp-service design with explicit verification, auditing and operational procedures.
- **Problem left unsolved:** Deliberately retains a third-party service; it is not open monetary consensus.
- **Primary source / passage actually read:** [E4-TIMESEC](https://cdn.nakamotoinstitute.org/docs/secure-timestamping-service.pdf), title and introduction: “WITH MINIMAL TRUST REQUIREMENT”. Catalogue [E4-TIMESEC-CAT](https://nakamotoinstitute.org/library/secure-timestamping-service/).
- **Connection:** **whitepaper citation**, reference [2]. The PDF title uses singular Requirement; the whitepaper/catalogue use Requirements. Preserve the distinction rather than claiming different works.
- **Confidence / open questions:** High for design and bibliographic month. Author name is Xavier Serret Avila/Serret-Avila, not a fabricated extra author from initials.

### Payment businesses and other chart entries — HOLD
- **e-gold:** proposed **1996 service start**, **context**, not documented Bitcoin influence. The existing register cites a 2007 DOJ indictment retrospectively describing that date: https://www.justice.gov/archive/criminal/ceos/pressreleases/downloads/DC%20egold%20indictment.pdf . This pass did not read that primary PDF; no quotation or approved founding-day plaque. An indictment's allegation is not a conviction.
- **1996 electronic-cash reports / Szabo's contract and property-title essays:** **context** candidates only. Exact chart entries and original texts need registration before exhibiting them. A government paper about electronic cash would not establish that its agency created Bitcoin.

## Period gear to play with

- **V.90 modem:** **1 September 1998**, approval of the ITU-T recommendation, not the invention date of all modems. Its title specifies up to **56,000 bit/s downstream** and **33,600 bit/s upstream**. [E4-MODEM](https://www.itu.int/rec/T-REC-V.90-199809-I/en). Mechanic: choose packet sizes and compare ideal signalling time; label this a theoretical ceiling, not guaranteed download speed. An original anonymous external-modem case with invented indicator labels; generic synthesized handshake, no sampled recordings.
- **Deferred props:** CD-ROM and handheld-console introduction/capacity specifications need model-specific primary records. Generic scenery may appear without unsupported measurements.

## Era boat

**Research-backed replacement for the draft offshore racer:** a rigid inflatable boat. RNLI records Atlantic 75 introduction in **1993**, therefore the type predates and exists during 1996–1999. [E4-BOAT](https://rnli.org/about-us/our-history/timeline/1972-rigid-inflatable-lifeboats). Use an original shallow V-hull, side tubes and small steering console; no rescue insignia or copied boat design. The date is a documented model introduction, not the first invention of RIBs. A distinct offshore-racer silhouette remains deferred until a dated manufacturer or museum source is registered.

## Music direction

Creative proposal: light breakbeat-style synthesized percussion, rounded bass and short digital keyboard stabs, 96–112 BPM. Original motifs: a repeated work pulse interrupted by a completed stamp; two alternating account voices; a brief descending figure for a duplicate submission. Keep reading areas quiet. No existing compositions, recordings or branded startup sounds.

## Easter eggs

Original 1997-inspired stamp-search puzzle and 1998-inspired two-ledger reconciliation game. A low-bit toy search should be strictly bounded and labelled a demonstration, not real mining or a reward-producing background job. All art and rules original; no ROMs or unauthorized emulation links.

## Captions (draft)

1. 28 March 1997: an announcement offers computational postage code. [E4-HC]
2. A work-stamp is costly to make and easier to check. [E4-HC]
3. Remembering spent stamps locally is not network-wide money consensus. [E4-HC; interpretation]
4. April 1997: a verifiable name points to the exact digital data. [E4-NAMES]
5. November 1998: b-money proposes two ways to keep accounts. [E4-BM]
6. Ask what this protocol assumes about its messages and servers. [E4-BM]
7. May 1999: TIMESEC reduces trust in a timestamp service. [E4-TIMESEC]
8. September 1998 approval: V.90 sets asymmetric signalling ceilings. [E4-MODEM]

## Corrections to the chart / README table

- Hashcash's 1997 announcement is distinct from the **2002 paper** cited as [6]. Keep those dates in different eras.
- b-money is **1998**, not the tentative 2006 guess in a 2008 draft citation.
- Secure names is a naming/timestamping-related paper, not a money protocol; TIMESEC explicitly retains a service.
- e-gold is context pending primary reading; no established Satoshi influence follows from its existence.
- Liberty Reserve's reported 2006 incorporation predates 2008; the existing register's sentence claiming it came after design began is chronologically wrong. Move that context item to Era 5 if verified, not Era 4.
- The original prehistory chart image is unavailable here. This is a disposition of the plan/register topics, not a completed entry-by-entry chart audit.
