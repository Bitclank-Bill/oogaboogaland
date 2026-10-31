# Era 7: Genesis (3–12 January 2009)

## Summary for a 12-year-old (3–5 sentences)
Now the journey moves from a paper to running software and recorded blocks. Bitcoin's first block carries a 3 January timestamp. A software-release announcement followed on 8 January, and an early payment appears in a block timestamped 12 January. Hal Finney later described receiving a ten-coin test payment. A block's timestamp is a field in a record, not an independently observed stopwatch. [E7-GEN, E7-REL, E7-170, E7-FIN]

## The deeper story (2–4 paragraphs)
Build three islands inside one room: the first record, the software desk and an early payment. The genesis record is special; it is not simply an ordinary spendable reward waiting to be collected. The current Bitcoin Core source explicitly reconstructs it, including the embedded newspaper headline and its timestamp. Do not infer a complete account of the author's motives from that headline. [E7-GEN]

The release email describes experimental Windows software and includes its source code. Finney's later account supplies human testimony about testing and receiving coins. Chain data records amounts and keys, but does not name their human owners; present the ten-coin association as testimony alongside the matching early transaction, not as identity information magically decoded from a key. [E7-REL, E7-FIN, E7-170]

## Exhibits (Bitcoin line)

### The first record
- **Date:** 3 January 2009, **18:15:05 UTC**, conversion of the genesis header's Unix timestamp **1231006505**; labels must say “block-header timestamp”.
- **Contribution:** Establishes the special starting block used by the implemented chain.
- **Problem left unsolved:** One stored record is not evidence that a large decentralized network was already operating at that moment.
- **Primary source / passage:** [E7-GEN: Bitcoin Core chain parameters](https://github.com/bitcoin/bitcoin/blob/master/src/kernel/chainparams.cpp), source passage: “genesis = CreateGenesisBlock(1231006505, 2083236893”. Read alongside the [block data endpoint](https://blockstream.info/api/block/000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f). This endpoint was read directly as JSON, not inferred from a search snippet.
- **Connection:** context, implementation milestone after the whitepaper.
- **Confidence / open questions:** High for stored data and UTC conversion, not an independent eyewitness mining time. The Core file is a modern implementation source; pin an immutable revision when importing evidence into production. Its comment explains the genesis output was not originally entered into the spendable database.

### The software desk
- **Date:** 8 January 2009, **19:27:40 UTC**, SNI's preserved release-email timestamp.
- **Contribution:** Announces the first Bitcoin software release, with C++ source included.
- **Problem left unsolved:** The author explicitly calls it experimental; a release announcement is not a guarantee of bug-free operation.
- **Primary source / passage:** [E7-REL: release email in Complete Satoshi](https://satoshi.nakamotoinstitute.org/emails/cryptography/16/), “Windows only for now. Open source C++ code is included.”
- **Connection:** context, implementation milestone.
- **Confidence / open questions:** High for announced contents, not a reproduced build of the original binary. Jan 9 labels in other histories need an explicit timezone or artifact explanation rather than overwriting this dated email.

### An early test payment
- **Date:** 12 January 2009, **03:30:25 UTC**, block 170 header timestamp; not an independently measured broadcast time. Supporting recollection posted **19 March 2013**.
- **Contribution:** A non-coinbase transaction spends a 50 BTC input into 10 BTC and 40 BTC outputs; Finney later recalls receiving ten coins as a test.
- **Problem left unsolved:** Transaction data alone does not identify a human recipient or prove absence of every earlier private test.
- **Primary source / passage:** [E7-170: block 170 JSON](https://blockstream.info/api/block/00000000d1145790a8694403d4063f323d499e655c83426834d4ce2f8dd4a2ee) has literal field passage `"timestamp":1231731025`; [transaction list](https://blockstream.info/api/block/00000000d1145790a8694403d4063f323d499e655c83426834d4ce2f8dd4a2ee/txs) includes transaction `f4184fc596403b9d638783cf57adfe4c75c605f6356fbc91338530e9831e9e16` and output values 1000000000 and 4000000000 satoshis. Both JSON responses were read directly. [E7-FIN: Finney, Bitcoin and Me](https://nakamotoinstitute.org/library/bitcoin-and-me/): “Satoshi sent ten coins to me as a test.”
- **Connection:** context; early deployment evidence, not a whitepaper citation.
- **Confidence / open questions:** High for transaction structure and recorded times; Finney is a first-person retrospective witness. Identifying this ten-coin output with that remembered payment combines records and testimony rather than obtaining a name from the blockchain. Prefer “early test payment” over an unqualified “first transaction”, which confuses transfers with coinbase transactions.

## Period gear to play with
- **Networked software desk:** Bitcoin v0.1 was publicly announced **8 January 2009**, with Windows software and **port 8333** named for incoming connections. [E7-REL]. Mechanic: connect three fictional terminals and compare their valid records, then unplug and reconnect one. Use original generic interface art and simulated data; never open real ports or handle money as part of the exhibit. This dates software availability, not the invention of the PC.
- **Contemporary laptop comparison:** An October 2008 shipping MacBook configuration had **2 GB RAM** and a **160 GB** drive. [E7-GEAR: Apple's announcement](https://www.apple.com/newsroom/2008/10/14New-MacBook-Family-Redefines-Notebook-Design/). Reuse the Era 6 original unbranded model to compare storage tokens. This is period context, not a claim the Windows-only release ran natively on that laptop or that its author used it.

## Era boat
Reuse the original rigid inflatable boat: RNLI records the Atlantic 85 class's introduction in **2005**, before January 2009. [E7-BOAT](https://rnli.org/about-us/our-history/timeline/1972-rigid-inflatable-lifeboats). Class availability is evidence the type existed, not its invention date. Original tube-sided silhouette, small console and invented livery; no branding or copied rescue details. Dock before opening panels and use calm mode without bobbing.

## Music direction
Creative direction: subdued electronic pads, light hand percussion and bell-like synthesized notes; 76–84 BPM. Original motifs: one low opening note, three differently timed terminal replies, then a short rising phrase as the boat docks. These are newly composed suggestions, not historical songs or sounds of the original client. Reading and narration can silence the music.

## Easter eggs
Original 2009-inspired terminal mini-game: reconnect an offline peer, reject an invalid payment, then compare the verified histories. Original change-making puzzle: split 50 counters into 10 and 40. No wallet, mining, external game, copied interface or real payment; teach that the model omits much of production validation.

## Captions (draft)
1. 3 January: this is the first block's recorded timestamp. [E7-GEN]
2. A headline is stored here; motives need evidence beyond our guesses. [E7-GEN]
3. The genesis output is special, not a treasure you can spend. [E7-GEN]
4. 8 January: software is announced with source code. [E7-REL]
5. Early software still needed testing. [E7-REL]
6. Block 170 records an early payment on 12 January UTC. [E7-170]
7. Finney later recalled receiving ten coins as a test. [E7-FIN]
8. Keys and amounts are recorded; human names need other evidence. [E7-170, E7-FIN]

## Corrections to the chart / README table
- “Bitcoin launch” is not a single interchangeable label for the October paper, genesis timestamp, software announcement and first payments.
- Preserve UTC on the 12 January block timestamp; it was still 11 January in some western timezones.
- Do not identify the genesis 50 BTC output as the source of Finney's payment.
- Do not label a block's timestamp as an independently observed mining or first-broadcast instant.
- Distinguish Finney's **2013 recollection** from a document posted in January 2009.
- Do not use blockchain keys to speculate about Satoshi's personal identity or physical computer.

**Research status:** Sources read 31 October 2026, including direct JSON chain data. No original software binary was run. Historical content research is not browser, performance or physical-device validation. Billy's exact chart was not supplied as a readable artifact; corrections target claims in the task/plan.
