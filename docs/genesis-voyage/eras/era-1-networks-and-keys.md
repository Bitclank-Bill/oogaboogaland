# Era 1: Networks and Keys (1970–1979)

Research dossier · checked 31 October 2026 · content/design only, no implementation.

## Summary for a 12-year-old (3–5 sentences)

Computers were learning to talk across different networks, but a public wire could have listeners. Researchers explored how strangers might agree on a secret and how a message could carry a checkable digital signature. Small computers also let more people experiment for themselves. These ideas help explain Bitcoin's setting, but none of this room's exhibits is a Bitcoin whitepaper citation.

## The deeper story (2–4 paragraphs)

In May 1974, Vinton Cerf and Robert Kahn published a design for communicating across different packet networks. A December 1974 specification by Cerf, Yogen Dalal and Carl Sunshine described the Internet Transmission Control Program. Treat these as distinct documents and author lists. The room's packet gate is a simplified illustration: mismatched packet sizes, lost packets and ordering matter even before money enters the story. [E1-CK, E1-RFC]

Key distribution posed another problem: how could two people begin a private conversation without already sharing a secret? Ralph Merkle's surviving project history dates his puzzle proposal to autumn 1974; its eventual journal article appeared in April 1978. Diffie and Hellman's November 1976 paper explored public-key systems and key agreement. The visitor can compare toy mechanisms, but the museum must explain that a small puzzle or coloured-token demonstration is not secure cryptography. [E1-MERKLE-HISTORY, E1-MERKLE, E1-DH]

Rivest, Shamir and Adleman's signature/encryption paper records receipt in April 1977 and revision in September; the SNI catalogue dates journal publication to February 1978. Its text explicitly credits the Diffie–Hellman paper as motivating their research, but that documented connection is between these researchers, not proof of a specific influence on Bitcoin. Label RSA **context**: Bitcoin's use of digital signatures does not mean it uses RSA or Diffie–Hellman key exchange. None of these documents alone provides Bitcoin's distributed double-spending solution. [E1-RSA, E1-RSA-SNI, E0-WP]

## Exhibits (Bitcoin line)

### Networks meet at a gateway

- **Date and meaning:** May 1974, journal publication of Cerf and Kahn's paper; December 1974, date of RFC 675's specification.
- **Contribution:** A design and developing specification for communication across separate packet networks.
- **Problem left unsolved:** Reliable transport does not decide which competing digital payment is valid.
- **Primary passage actually read:** “different packet switching networks” (4 words). Paper: https://sites.cs.ucsb.edu/~ravenben/classes/276/papers/ck74.pdf . Specification: https://www.rfc-editor.org/rfc/rfc675.html .
- **Connection:** **context**, not a whitepaper citation or separately proved personal influence.
- **Confidence:** High; original paper and RFC opened.
- **Open questions:** Do not call this the fully deployed modern split TCP/IP stack; a later room may explain subsequent protocol development.

### Merkle's puzzle post

- **Date and meaning:** Autumn 1974, project proposal described by Merkle; August 1975, his reported journal submission; April 1978, published article's issue date.
- **Contribution:** Illustrated key establishment over an observable channel with greater work for a passive eavesdropper.
- **Problem left unsolved:** The described work gap is not a complete payment system or Bitcoin mining.
- **Primary passage actually read:** “select a key over open communications channels” (8 words). Published scan: https://cdn.nakamotoinstitute.org/docs/secure-communications-insecure-channels.pdf . Author's history: https://www.ralphmerkle.com/1974/ . SNI index: https://nakamotoinstitute.org/library/secure-communications-insecure-channels/ .
- **Connection:** **context**. This is not Merkle's different 1980 paper cited as Bitcoin reference [7].
- **Confidence:** High for publication; proposal chronology is an author's retrospective with linked scans, not independently established here from every original draft.
- **Open questions:** If the proposal itself is displayed, inspect its scan and establish permission; currently quote only the published article.

### Diffie–Hellman's public-key workbench

- **Date and meaning:** November 1976, issue publication of *New Directions in Cryptography*. The paper separately records receipt on 3 June 1976 and presentations of portions in 1975 and June 1976.
- **Contribution:** Explored public-key cryptosystems, signatures and key distribution without a prearranged secure channel.
- **Problem left unsolved:** Key agreement does not itself authenticate an unknown partner or solve digital double-spending.
- **Primary passage actually read:** “minimize the need for secure key distribution channels” (9 words). https://ee.stanford.edu/~hellman/publications/24.pdf .
- **Connection:** **context**. Do not label it a Bitcoin citation.
- **Confidence:** High for dates and scope, original paper opened.
- **Open questions:** Keep the toy demonstration's mathematics and authentication limitation explicit in the implementation review.

### RSA's checkable signature desk

- **Date and meaning:** 4 April 1977 manuscript receipt; 1 September 1977 revision, printed in the author-hosted paper. February 1978 journal publication, cross-checked in SNI. A separate MIT April 1977 technical-memo catalogue was found but could not be opened; do not rely on it for exhibit text yet.
- **Contribution:** Presented a concrete public-key encryption and digital-signature method based on number arithmetic.
- **Problem left unsolved:** A valid signature alone cannot stop its owner signing two conflicting spends.
- **Primary passage actually read:** “Anyone can verify this signature” (5 words). https://people.csail.mit.edu/rivest/Rsapaper.pdf . Publication cross-check: https://nakamotoinstitute.org/library/rsa-paper/ .
- **Connection:** **context**. Its stated motivation from Diffie–Hellman documents that research relationship, not Bitcoin's algorithm choice.
- **Confidence:** High for paper content and printed receipt/revision; journal date supported by SNI catalogue.
- **Open questions:** Obtain the 1977 MIT memo before equating “1977 RSA” with a particular public release date.

## Period gear to play with

| Item / date meaning | Numerical fact and sources | Mechanic / originality |
|---|---|---|
| IBM 8-inch floppy, drives sold in 1971 | 8-inch disk; CHM reports 80 KB for the original read-only microcode loader. Manufacturer date: [E1-FLOPPY-IBM] https://www.ibm.com/history/floppy-disk ; capacity/model cross-check: [E1-FLOPPY-CHM] https://www.computerhistory.org/revolution/story/261 | Load an original instruction-card animation into a blank-labelled drive. Explicitly distinguish the original read-only loader from later writable personal-computer floppies. |
| Altair 8800, January 1975 magazine cover introduction | CHM records a basic 256 bytes of memory, expandable to 64 KB. [E1-ALTAIR] https://www.computerhistory.org/timeline/1975/ | An original bank of eight switches assembles one byte; 256 address lights fill a tray. Not a cycle-accurate emulator; no copied firmware, magazine artwork or BASIC distribution. |

Gear specifications above are checked museum/manufacturer accounts; a contemporary Altair manual remains a desirable primary upgrade. Acoustic-coupler styling and speed figures are **not cleared**: choose a documented model and manual before supplying a baud-rate label. Do not put a DOS screen in 1975; a later era can house that separate exhibit.

## Era boat

**Type:** Small open outboard utility/runabout boat, with a historically plausible moulded hull. **Documented availability:** manufacturer parent Brunswick records the first 13-foot Boston Whaler built and launched at the New York Boat Show in **1958**, before this era. [E1-BOAT] https://www.brunswickcgp.com/content/brunswick/bcgp/na/us/en/boston-whaler-models.html . This is a dated example, not the first-ever runabout. Generic original low-sided hull, two benches and simple outboard; no brand or distinctive copied design. The proposed specifically **fibreglass** material needs a contemporary construction source before being labelled as fact; current page verifies moulded hull construction and dated availability. Confidence high for period type, material label pending.

## Music direction

Creative proposal: soft monophonic synthesizer-like pulses, muted electric bass and dry hand percussion at 88–102 BPM. Original motifs: a call-and-response two-note packet exchange; interleaved ascending/descending key phrases; a held tone resolving after signature verification. These are original directions, not historical release-date claims. No copied songs, melodies, samples or named-artist imitation. An acoustic-only quiet mode must communicate equally well.

## Easter eggs

Original “Gateway Sort”: send differently sized coloured packets through compatible gates, then reorder them. Original “Public Check”: create a toy stamp privately and let a friend verify a changed message fails. Original “Puzzle Post”: open a small chosen box while an observer must search many; label the work asymmetry as a toy model. No commercial game ROMs or external games are required.

## Captions (draft)

1. “May 1974: a paper describes communication between different packet networks.” [E1-CK]
2. “December 1974: RFC 675 specifies an Internet Transmission Control Program.” [E1-RFC]
3. “A public wire raises a new question: who else is listening?” [E1-DH; explanatory framing]
4. “Merkle proposed his puzzle idea in autumn 1974; publication followed in April 1978.” [E1-MERKLE-HISTORY, E1-MERKLE]
5. “November 1976: Diffie and Hellman publish New Directions in Cryptography.” [E1-DH]
6. “A shared secret and a checkable signature do different jobs.” [E1-DH, E1-RSA]
7. “RSA's manuscript was received in 1977; its journal publication followed in 1978.” [E1-RSA, E1-RSA-SNI]
8. “1971: IBM begins selling floppy drives.” [E1-FLOPPY-IBM]
9. “The basic Altair carried 256 bytes of memory.” [E1-ALTAIR]
10. “These are context exhibits, not Bitcoin whitepaper citations.” [E0-WP, bibliography]

## Corrections to the chart / README table

- “TCP/IP 1974” needs a milestone label: May paper vs December RFC, not final modern protocol deployment. Preserve correct author lists.
- “Merkle 1974” means a proposal; distinguish April 1978 publication and the unrelated 1980 Merkle paper cited by Bitcoin.
- “Diffie–Hellman 1976” is the November paper's publication, not the only date of presentation or discovery.
- “RSA 1977” is supported for manuscript history; do not silently label the journal article 1977. Use February 1978 for journal publication.
- Public-key cryptography, signatures and key agreement are related concepts with different functions; a Bitcoin signature does not establish RSA use.
- DOS, later 3.5-inch disks and modern acoustic-coupler speed assumptions must not drift into a 1970s prop specification.
- Original chart image unavailable here: these are corrections to the assigned timeline topics, not a claimed complete chart audit.

## Source register / verification limits

Source keys map to the URLs beside each exhibit or gear item. E1-CK, E1-RFC, E1-MERKLE, E1-DH and E1-RSA are original papers/specifications actually opened; E1-MERKLE-HISTORY is author testimony; E1-RSA-SNI is SNI's publication catalogue. E1-FLOPPY-IBM and E1-BOAT are manufacturer histories. CHM gear references are explicitly secondary curatorial accounts. E0-WP is https://bitcoin.org/bitcoin.pdf , opened §§2 and 11 and bibliography. Research checked 31 October 2026. No code, scene performance, factual labels in a running build or audio was tested. All toy activities are proposals and must not claim cryptographic security.
