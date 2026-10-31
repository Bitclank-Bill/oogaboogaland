# Era 2: Trees and Blind Money (1980–1989)

Research dossier v0.1 · 31 October 2026. READY entries support draft content; HOLD material is explicitly not cleared for display.

## Summary for a 12-year-old (3–5 sentences)

Imagine checking one page without carrying a whole library. A tree of fingerprints can help do that. Blind signatures explore a different trick: getting a signature while hiding the message being signed. New cryptography and arguments about privacy were developing alongside personal computers, but they did not yet solve Bitcoin's complete money problem. [E2-MERKLE, E2-CHAUM, E2-ECC, E2-MAY]

## The deeper story (2–4 paragraphs)

Merkle's 1980 paper describes tree authentication: after authenticating a root, a reader can check one entry using its authentication path. The public-key-file example in the paper is not Bitcoin's transaction tree, but it provides the technique the whitepaper cites. Merkle's earlier key-exchange puzzles are a different contribution, covered in Era 1. [E2-MERKLE]

Chaum's blind-signature paper addresses privacy through a signature on a concealed message, illustrated with carbon-lined envelopes. For payments, the central signer and spent-token checks remain different trust questions. Do not move DigiCash's later company into the 1982 conference or call blind signatures the mechanism used by Bitcoin. [E2-CHAUM]

Miller's elliptic-curve proposal and May's manifesto broaden the setting. A mathematical primitive, a technical payment proposal and a political essay deserve separate labels. May's predictions are historical advocacy, not facts about what technology inevitably causes, and the manifesto's adult examples need not appear in a child-facing room. [E2-ECC, E2-MAY]

## Exhibits (Bitcoin line)

### Check a branch, trust a root — READY
- **Date and meaning:** **1980**, IEEE Symposium on Security and Privacy proceedings publication of Protocols for Public Key Cryptosystems, pp. 122–134. Author bibliography confirms the year; an exact presentation day is not established here.
- **Contribution:** Authenticating individual entries with a compact tree path and an authenticated root.
- **Problem left unsolved:** A valid inclusion proof does not establish transaction validity, ownership or consensus.
- **Primary source / passage actually read:** [E2-MERKLE](https://www.ralphmerkle.com/papers/Protocols.pdf), §6, pp. 125–127: “The essence of tree authentication”. Author bibliography [E2-MERKLE-BIB](https://www.ralphmerkle.com/merkleDir/papers.html).
- **Connection:** **whitepaper citation**, reference [7].
- **Confidence / open questions:** High for text/year; no claim that the tree was first conceived in 1980. The earlier thesis and patent require separately labelled events if added.

### Sign without seeing — READY with date qualification
- **Date and meaning:** **1982 conference contribution**, Blind Signatures for Untraceable Payments at CRYPTO '82. The existing register distinguishes a **1983 printed proceedings** date; author catalogue cites the conference year. Exact proceedings day remains unverified and must not be invented.
- **Contribution:** Blind signatures separate what a signer sees from what the recipient later presents.
- **Problem left unsolved:** Does not remove the signer or supply Bitcoin-style distributed double-spend consensus.
- **Primary source / passage actually read:** [E2-CHAUM](https://chaum.com/wp-content/uploads/2022/01/Chaum-blind-signatures.pdf), author-hosted scan, opening envelope analogy. Short title passage: “Blind signatures for untraceable payments”. Author catalogue [E2-CHAUM-CAT](https://chaum.com/publications/).
- **Connection:** **context**; not one of the eight whitepaper references. Don't infer a direct design borrowing.
- **Confidence / open questions:** High for original concept/title and conference year. Pin a readable publisher record before presenting a precise printed-publication date.

### A different mathematical landscape — READY
- **Date and meaning:** **1985 conference contribution**, Miller's Use of Elliptic Curves in Cryptography, in CRYPTO '85; **1986 printed volume**. Publisher displays inconsistent **2000 online dates** in separate fields; neither is the invention date.
- **Contribution:** Proposes elliptic-curve cryptography, including a key-exchange analogue.
- **Problem left unsolved:** A cryptographic primitive alone does not produce electronic cash or consensus.
- **Primary source / passage actually read:** [E2-ECC](https://link.springer.com/chapter/10.1007/3-540-39799-X_31), publisher abstract: “We discuss the use of elliptic curves in cryptography.”
- **Connection:** **context**; the whitepaper does not cite this foundational paper.
- **Confidence / open questions:** High for Miller record. Do not imply sole invention: Koblitz's independent contribution needs its own primary record before a combined attribution plaque. Detailed Bitcoin curve choices belong with verified implementation sources, not this abstract.

### A privacy prediction — READY
- **Date and meaning:** **1988**, date assigned to May's manifesto in SNI's reprint; exact original circulation day not established here.
- **Contribution:** Predicts social effects of cryptography, pseudonymous exchange and networked communication.
- **Problem left unsolved:** Advocacy and prediction are not a complete payment protocol.
- **Primary source / passage actually read:** [E2-MAY](https://nakamotoinstitute.org/library/crypto-anarchist-manifesto/): “Reputations will be of central importance”.
- **Connection:** **context**. Dai later explicitly references May, but that alone does not establish a direct personal influence on Satoshi.
- **Confidence / open questions:** High for reprinted text/year; precise presentation/circulation event remains unverified. Present its claims as May's views, not museum endorsement.

## Period gear to play with

- **Personal computer:** IBM PC unveiled **12 August 1981**. Manufacturer retrospective states the base **USD 1,565** configuration had **16 kilobytes of RAM and no disk drive**. [E2-PC](https://www.ibm.com/history/personal-computer). Mechanic: fit short original notes into a memory tray; distinguish RAM from disk capacity. Optional drive-equipped configuration must not be implied to be included in that base price. Original beige case, blank keys and simple monitor; no marks or copied commercial software.
- **Deferred gear:** 5.25-inch floppy, 8-bit console and modem specifications need model-specific primary records. Don't label a floppy “1.44 MB,” which refers to a different common format, or treat every machine in a decade as identical.

## Era boat

**Type:** Small open outboard runabout. **Documented availability:** manufacturer parent Brunswick dates its 13-foot example's build and boat-show launch to **1958**, before this era. [E2-BOAT](https://www.brunswickcgp.com/content/brunswick/bcgp/na/us/en/boston-whaler-models.html). That establishes an earlier example, not a first invention in the 1980s. Draw an original low hull, two benches and anonymous outboard; no distinctive production hull, logos or marketing claim that it cannot sink. Repeat this established type if needed rather than invent a historically unsupported boat transition.

## Music direction

Creative proposal: square-wave-like lead, simple triangle-like bass and sparse synthesized percussion, 92–108 BPM. Write a branching four-note answer, a muted/revealed envelope phrase and an unresolved two-chord question. These evoke a broad electronic palette; they are not claims about an inventor's listening habits. No game tunes, recognizable startup sounds or copied melodies.

## Easter eggs

Original tree-path puzzle inspired by the 1980 paper and an envelope/signature logic toy inspired by the 1982 contribution. The year labels identify their inspirations, not real game releases. All rules and art newly made; no ROM or third-party game link required.

## Captions (draft)

1. 1980 publication: check one entry using a tree's authentication path. [E2-MERKLE]
2. First authenticate the root; a path alone cannot tell you which root to trust. [E2-MERKLE]
3. An inclusion proof is not proof of ownership. [E2-MERKLE; interpretation]
4. 1982 conference contribution: a signature can be obtained on a concealed message. [E2-CHAUM]
5. Private payment proposals still have questions about signers and spent tokens. [E2-CHAUM]
6. 1985 conference, 1986 printed volume: Miller explores elliptic curves. [E2-ECC]
7. 1988: May predicts a cryptographic society; these are the author's views. [E2-MAY]
8. August 1981 unveiling: this base PC had 16 kilobytes of RAM. [E2-PC]

## Corrections to the chart / README table

- The cited Merkle paper is **1980**, not 1978. The 1978 puzzles paper is separate; SNI's Protocols catalogue has historically shown a conflicting April 1978 date. Use the author/IEEE record for this paper.
- Distinguish Chaum's 1982 conference from printed proceedings; don't present a later company founding as the same event.
- Distinguish Miller's 1985 conference, 1986 book and 2000 online record. Independent Koblitz attribution remains an explicitly pending source check.
- May 1988 is context and advocacy, not a technical Bitcoin design or a whitepaper citation.
- Source keys on museum commentary may point to later history, but label the commentary as written today, as repaired on gv/walk-props.
- Original chart image unavailable here; these corrections cover the assigned plan/register topics, not every unseen chart entry.
