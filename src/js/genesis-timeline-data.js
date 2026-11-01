// The Genesis museum's research timeline: the READY records of the consolidated research's
// genesis-timeline-events.json (version consolidated-v1 (2026-11-01), SHA-256 9a8f4d229c04bc23...), generated, not hand-edited.
// 15 HOLD records are left out entirely, so nothing can render them. READY means adequately sourced for independent
// review and not held in its dossier; it does not mean approved by the reviewer or the maintainers. Each record keeps
// its research fields and gains `exhibit`: the catalogue id of the exhibit that stands for it, or null when none does.
// A record is a date and its own evidence (`connection`); neighbours on a timeline are not influence.
(() => {
  "use strict";
  const BL = window.BL = window.BL || {};
  const records = Object.freeze([
{
"id":"tl-0-ramac",
"era":0,
"lane":"tech",
"date":"1956",
"dateLabel":"1956",
"title":"Records on spinning disks",
"sign":"SPINNING DISKS - 1956",
"kid":"In 1956 a cabinet bigger than you held five million characters on 50 spinning disks, and could jump straight to the record you wanted.",
"deep":"The IBM 350 disk unit belonged to the 305 RAMAC system. Its disks let a machine reach a chosen record without reading every earlier one. Say five million characters, not 5 MB: the encoding needs explaining before any byte figure.",
"marks":"IBM 305 RAMAC introduced (its IBM 350 disk unit); CHM records first shipment in June 1956",
"connection":{
"whitepaperRefs":[],
"documentedInfluence":[],
"contextOnly":true
},
"sources":[
{
"label":"IBM, RAMAC",
"url":"https://www.ibm.com/history/ramac",
"type":"primary",
"checked":"Era 0 dossier",
"verification":"dossier-record"
},
{
"label":"Computer History Museum, first commercial hard disk drive shipped",
"url":"https://www.computerhistory.org/storageengine/first-commercial-hard-disk-drive-shipped/",
"type":"secondary",
"checked":"Era 0 dossier",
"verification":"dossier-record"
}
],
"milestone":false,
"renderAs":"bead",
"confidence":"high",
"exhibit":"e0-disk-seek"
},
{
"id":"tl-0-feller",
"era":0,
"lane":"btc",
"date":"1957",
"dateLabel":"1957",
"title":"Feller's probability book",
"sign":"FELLER - 1957",
"kid":"Bitcoin's paper uses maths about lucky and unlucky streaks from this book to work out how hard it is for a cheater to catch up.",
"deep":"Section 11 of the whitepaper treats an attacker catching up with the honest chain as a Gambler's Ruin random walk and cites Feller. 1957 is a cited edition year, not when probability was invented.",
"marks":"Edition year of Feller's book as printed in the whitepaper's bibliography; the preface is signed August 1957",
"connection":{
"whitepaperRefs":[
8
],
"documentedInfluence":[],
"contextOnly":false
},
"sources":[
{
"label":"Bitcoin whitepaper (bitcoin.org)",
"url":"https://bitcoin.org/bitcoin.pdf",
"type":"primary",
"checked":"dossiers E0-WP; sources.md Entry 1",
"verification":"dossier-record"
},
{
"label":"Nakamoto Institute library entry for Feller",
"url":"https://nakamotoinstitute.org/library/introduction-probability-theory-vol-i/",
"type":"secondary",
"checked":"Era 0 dossier",
"verification":"dossier-record"
},
{
"label":"MacTutor, Feller prefaces",
"url":"https://mathshistory.st-andrews.ac.uk/Extras/Feller_Prefaces/",
"type":"secondary",
"checked":"sources.md Entry 9",
"verification":"research-agent-record"
}
],
"milestone":false,
"renderAs":"bead",
"confidence":"high",
"exhibit":"e0-feller"
},
{
"id":"tl-0-kilby",
"era":0,
"lane":"tech",
"date":"1958-09-12",
"dateLabel":"12 September 1958",
"title":"One chip, many parts",
"sign":"ONE CHIP - 1958",
"kid":"Before 1958 every part of a circuit was a separate piece wired by hand. Jack Kilby built the parts into one small piece of material.",
"deep":"Kilby shared the 2000 Nobel Prize in Physics for his part in inventing the integrated circuit. The Computer History Museum records that the first circuit was on germanium. The story of other inventors' silicon chips is separate and not covered here.",
"marks":"Jack Kilby demonstrates the first working integrated circuit in a TI lab",
"connection":{
"whitepaperRefs":[],
"documentedInfluence":[],
"contextOnly":true
},
"sources":[
{
"label":"Texas Instruments company blog: origin story of the chip",
"url":"https://ti.com/about-ti/newsroom/company-blog/from-idea-to-invention-the-origin-story-of-the-tiny-chip-that-changed-the-world.html",
"type":"primary",
"checked":"taskc-gaps.md",
"verification":"research-agent-record"
},
{
"label":"Nobel Prize, Jack Kilby facts",
"url":"https://www.nobelprize.org/prizes/physics/2000/kilby/facts/",
"type":"primary",
"checked":"taskc-gaps.md",
"verification":"research-agent-record"
},
{
"label":"Computer History Museum artifact (germanium)",
"url":"https://www.computerhistory.org/revolution/artifact/276/1413",
"type":"secondary",
"checked":"taskc-gaps.md",
"verification":"research-agent-record"
}
],
"milestone":false,
"renderAs":"bead",
"confidence":"high",
"exhibit":null
},
{
"id":"tl-0-engelbart",
"era":0,
"lane":"tech",
"date":"1968-12-09",
"dateLabel":"9 December 1968",
"title":"The mouse's first show",
"sign":"THE MOUSE - 9 DEC 1968",
"kid":"About a thousand people watched a team point at words on a screen with a little box on wheels: the first public show of the computer mouse.",
"deep":"Douglas Engelbart's team demonstrated their NLS system for about 90 minutes: the mouse, linked text and shared screens. The page supports its public debut, not that it was the first mouse built.",
"marks":"Public demonstration at the Fall Joint Computer Conference, San Francisco; the mouse's public debut",
"connection":{
"whitepaperRefs":[],
"documentedInfluence":[],
"contextOnly":true
},
"sources":[
{
"label":"Doug Engelbart Institute, the 1968 demo",
"url":"https://dougengelbart.org/mousesite/1968Demo.html",
"type":"primary",
"checked":"Task C brief",
"verification":"claude-read"
}
],
"milestone":false,
"renderAs":"bead",
"confidence":"high",
"exhibit":null
},
{
"id":"tl-0-arpanet",
"era":0,
"lane":"btc",
"date":"1969-10-29",
"dateLabel":"29 October 1969",
"title":"Two letters arrive",
"sign":"ARPANET - 29 OCT 1969",
"kid":"One computer tried to log in to another far away. Two letters got through before it crashed, and the next try worked.",
"deep":"This marks the host-to-host message, not the invention of the Internet or the Web. Moving messages does not show who owns something or stop a digital token being spent twice.",
"marks":"First recorded ARPANET host-to-host message, UCLA to SRI",
"connection":{
"whitepaperRefs":[],
"documentedInfluence":[],
"contextOnly":true
},
"sources":[
{
"label":"Leonard Kleinrock, UCLA: the first words of the Internet",
"url":"https://www.lk.cs.ucla.edu/internet_first_words.html",
"type":"primary",
"checked":"Era 0 dossier",
"verification":"dossier-record"
}
],
"milestone":false,
"renderAs":"bead",
"confidence":"high",
"exhibit":"e0-arpanet"
},
{
"id":"tl-1-floppy",
"era":1,
"lane":"tech",
"date":"1971",
"dateLabel":"1971",
"title":"The bendy disk",
"sign":"FLOPPY DISK - 1971",
"kid":"A thin bendy disk in a sleeve carried instructions into big computers.",
"deep":"The first 8-inch floppy held a read-only microcode loader; the Computer History Museum gives 80 KB for it. Later writable floppies are a different story.",
"marks":"IBM begins selling floppy disk drives (8-inch, read-only loader)",
"connection":{
"whitepaperRefs":[],
"documentedInfluence":[],
"contextOnly":true
},
"sources":[
{
"label":"IBM, the floppy disk",
"url":"https://www.ibm.com/history/floppy-disk",
"type":"primary",
"checked":"Era 1 dossier",
"verification":"dossier-record"
},
{
"label":"Computer History Museum, Revolution story 261",
"url":"https://www.computerhistory.org/revolution/story/261",
"type":"secondary",
"checked":"Era 1 dossier",
"verification":"dossier-record"
}
],
"milestone":false,
"renderAs":"bead",
"confidence":"high",
"exhibit":"e1-floppy"
},
{
"id":"tl-1-4004",
"era":1,
"lane":"tech",
"date":"1971-11-15",
"dateLabel":"15 November 1971",
"title":"A processor on one chip",
"sign":"A CPU ON ONE CHIP - 1971",
"kid":"The brain of a computer was squeezed onto one chip with 2,300 switches. It was first made for a desk calculator that printed its answers.",
"deep":"Intel says the 4004 held 2,300 transistors and was commissioned for Busicom's 141-PF printing calculator. Its clock speed is not on Intel's page and stays off every sign.",
"marks":"Issue of Electronic News carrying the first Intel 4004 advertisement",
"connection":{
"whitepaperRefs":[],
"documentedInfluence":[],
"contextOnly":true
},
"sources":[
{
"label":"Intel, the story of the Intel 4004",
"url":"https://www.intel.com/content/www/us/en/history/museum-story-of-intel-4004.html",
"type":"primary",
"checked":"Task C brief",
"verification":"claude-read"
}
],
"milestone":false,
"renderAs":"bead",
"confidence":"high",
"exhibit":null
},
{
"id":"tl-1-hp35",
"era":1,
"lane":"tech",
"date":"1972-01-04",
"dateLabel":"1972 (introduced 4 January 1972, per CHM)",
"title":"Science in your pocket",
"sign":"POCKET SCIENCE - 1972",
"kid":"This calculator could do sines, logs and powers, which used to need slide rules or big machines, and it fitted in your hand.",
"deep":"HP's history gives 1972, a price of $395, 35 keys and 9 oz. It used Reverse Polish Notation: numbers first, then the operation. The exact day comes from the Computer History Museum.",
"marks":"HP-35 scientific pocket calculator introduced",
"connection":{
"whitepaperRefs":[],
"documentedInfluence":[],
"contextOnly":true
},
"sources":[
{
"label":"HP Virtual Museum, HP-35",
"url":"https://hp.com/hpinfo/abouthp/histnfacts/museum/personalsystems/0023/0023history.html",
"type":"primary",
"checked":"Task C brief",
"verification":"claude-read"
},
{
"label":"Computer History Museum, This Day in History, 4 January",
"url":"https://www.computerhistory.org/tdih/january/4/",
"type":"secondary",
"checked":"Task C brief",
"verification":"claude-read"
}
],
"milestone":false,
"renderAs":"bead",
"confidence":"high",
"exhibit":null
},
{
"id":"tl-1-merkle-puzzles",
"era":1,
"lane":"btc",
"date":"1974",
"dateLabel":"Autumn 1974 (proposal); April 1978 (published)",
"title":"Merkle's puzzles",
"sign":"MERKLE PUZZLES - 1974 / 1978",
"kid":"How can two strangers agree a secret while someone listens? Merkle's idea: make the listener do far more work than you do.",
"deep":"This is not the Merkle paper Bitcoin cites (see tl-2-merkle-trees). No source links these puzzles to proof-of-work; any likeness is an analogy.",
"marks":"Merkle's student project proposal; CACM journal issue",
"connection":{
"whitepaperRefs":[],
"documentedInfluence":[],
"contextOnly":true
},
"sources":[
{
"label":"Ralph Merkle, the 1974 project history",
"url":"https://www.ralphmerkle.com/1974/",
"type":"primary",
"checked":"Era 1 dossier",
"verification":"dossier-record"
},
{
"label":"Secure communications over insecure channels (published scan)",
"url":"https://cdn.nakamotoinstitute.org/docs/secure-communications-insecure-channels.pdf",
"type":"primary",
"checked":"Era 1 dossier",
"verification":"dossier-record"
}
],
"milestone":false,
"renderAs":"bead",
"confidence":"high",
"exhibit":"e1-merkle"
},
{
"id":"tl-1-cerf-kahn",
"era":1,
"lane":"btc",
"date":"1974-05",
"dateLabel":"May 1974 (paper); December 1974 (RFC 675)",
"title":"Networks meet at a gateway",
"sign":"NETWORKS MEET - 1974",
"kid":"Different computer networks spoke differently. This paper described how messages could hop between them.",
"deep":"The May 1974 paper and the December 1974 specification are separate documents with different authors. They are not the fully deployed modern TCP/IP. Reliable transport still does not decide which digital payment is valid.",
"marks":"Journal publication of Cerf and Kahn's internetworking paper; date of the RFC 675 specification",
"connection":{
"whitepaperRefs":[],
"documentedInfluence":[],
"contextOnly":true
},
"sources":[
{
"label":"Cerf and Kahn 1974 paper (UCSB course copy)",
"url":"https://sites.cs.ucsb.edu/~ravenben/classes/276/papers/ck74.pdf",
"type":"primary",
"checked":"Era 1 dossier",
"verification":"dossier-record"
},
{
"label":"RFC 675",
"url":"https://www.rfc-editor.org/rfc/rfc675.html",
"type":"primary",
"checked":"Era 1 dossier",
"verification":"dossier-record"
}
],
"milestone":false,
"renderAs":"bead",
"confidence":"high",
"exhibit":"e1-gateway"
},
{
"id":"tl-1-altair",
"era":1,
"lane":"tech",
"date":"1975-01",
"dateLabel":"January 1975",
"title":"A computer kit with switches",
"sign":"SWITCHES AND LIGHTS - 1975",
"kid":"A computer you built yourself and talked to with switches and lights.",
"deep":"The Computer History Museum records 256 bytes of memory in the basic machine, expandable to 64 KB.",
"marks":"Altair 8800 introduced on a magazine cover",
"connection":{
"whitepaperRefs":[],
"documentedInfluence":[],
"contextOnly":true
},
"sources":[
{
"label":"Computer History Museum timeline, 1975",
"url":"https://www.computerhistory.org/timeline/1975/",
"type":"secondary",
"checked":"Era 1 dossier",
"verification":"dossier-record"
}
],
"milestone":false,
"renderAs":"bead",
"confidence":"medium",
"exhibit":"e1-panel"
},
{
"id":"tl-1-diffie-hellman",
"era":1,
"lane":"btc",
"date":"1976-11",
"dateLabel":"November 1976",
"title":"Secrets over an open wire",
"sign":"PUBLIC KEYS - 1976",
"kid":"Two people can build a shared secret in public, without ever sending the secret itself.",
"deep":"Diffie and Hellman explored public-key systems, signatures and key agreement without a prearranged secure channel. Key agreement alone does not identify an unknown partner or stop double-spending.",
"marks":"Journal issue of New Directions in Cryptography (manuscript received 3 June 1976)",
"connection":{
"whitepaperRefs":[],
"documentedInfluence":[],
"contextOnly":true
},
"sources":[
{
"label":"Diffie and Hellman, New Directions in Cryptography",
"url":"https://ee.stanford.edu/~hellman/publications/24.pdf",
"type":"primary",
"checked":"Era 1 dossier",
"verification":"dossier-record"
}
],
"milestone":false,
"renderAs":"bead",
"confidence":"high",
"exhibit":"e1-dh"
},
{
"id":"tl-1-rsa",
"era":1,
"lane":"btc",
"date":"1977-04",
"dateLabel":"1977 (manuscript); February 1978 (journal)",
"title":"Signatures anyone can check",
"sign":"RSA - 1977 / PUBLISHED 1978",
"kid":"A way to sign a message with a secret number, so anyone can check the signature but nobody can fake it.",
"deep":"Bitcoin uses digital signatures, but not RSA's. A valid signature alone cannot stop its owner signing two conflicting payments.",
"marks":"Manuscript received 4 April 1977 and revised 1 September 1977, as printed on the author-hosted paper; CACM 21(2) journal issue, February 1978",
"connection":{
"whitepaperRefs":[],
"documentedInfluence":[],
"contextOnly":true
},
"sources":[
{
"label":"Rivest, Shamir and Adleman paper (author copy)",
"url":"https://people.csail.mit.edu/rivest/Rsapaper.pdf",
"type":"primary",
"checked":"Era 1 dossier",
"verification":"dossier-record"
},
{
"label":"Nakamoto Institute catalogue, RSA paper",
"url":"https://nakamotoinstitute.org/library/rsa-paper/",
"type":"secondary",
"checked":"Era 1 dossier",
"verification":"dossier-record"
},
{
"label":"CACM, February 1978",
"url":"https://cacmb4.acm.org/magazines/1978/2/11250-a-method-for-obtaining-digital-signatures-and-public-key-cryptosystems",
"type":"primary",
"checked":"chart-verify.md",
"verification":"research-agent-record"
}
],
"milestone":false,
"renderAs":"bead",
"confidence":"high",
"exhibit":"e1-rsa"
},
{
"id":"tl-2-merkle-trees",
"era":2,
"lane":"btc",
"date":"1980-04",
"dateLabel":"April 1980",
"title":"Check a branch, trust a root",
"sign":"MERKLE TREES - 1980",
"kid":"A tree of fingerprints lets you check one page without the whole library: follow one branch up to the root.",
"deep":"Bitcoin's paper cites this as reference [7] and uses a Merkle tree to summarise a block's transactions. An inclusion proof shows something is in the tree, not that it is valid or owned.",
"marks":"IEEE Symposium on Security and Privacy proceedings, Protocols for Public Key Cryptosystems",
"connection":{
"whitepaperRefs":[
7
],
"documentedInfluence":[],
"contextOnly":false
},
"sources":[
{
"label":"Merkle, Protocols for Public Key Cryptosystems",
"url":"https://www.ralphmerkle.com/papers/Protocols.pdf",
"type":"primary",
"checked":"Era 2 dossier",
"verification":"dossier-record"
},
{
"label":"Bitcoin whitepaper (bitcoin.org)",
"url":"https://bitcoin.org/bitcoin.pdf",
"type":"primary",
"checked":"dossiers E0-WP; sources.md Entry 1",
"verification":"dossier-record"
}
],
"milestone":false,
"renderAs":"bead",
"confidence":"high",
"exhibit":"e2-merkle"
},
{
"id":"tl-2-ibm-pc",
"era":2,
"lane":"tech",
"date":"1981-08-12",
"dateLabel":"12 August 1981",
"title":"The office computer",
"sign":"PERSONAL COMPUTER - 1981",
"kid":"A computer made for desks in offices and homes.",
"deep":"IBM says the base model cost $1,565 and had 16 KB of memory and no disk drive.",
"marks":"IBM Personal Computer unveiled",
"connection":{
"whitepaperRefs":[],
"documentedInfluence":[],
"contextOnly":true
},
"sources":[
{
"label":"IBM, the personal computer",
"url":"https://www.ibm.com/history/personal-computer",
"type":"primary",
"checked":"Era 2 dossier",
"verification":"dossier-record"
}
],
"milestone":false,
"renderAs":"bead",
"confidence":"high",
"exhibit":"e2-pc"
},
{
"id":"tl-2-chaum",
"era":2,
"lane":"btc",
"date":"1982-08",
"dateLabel":"1982 (printed 1983)",
"title":"Sign without seeing",
"sign":"BLIND SIGNATURES - 1982",
"kid":"A bank can sign your digital coin without seeing it, like signing through carbon paper in a sealed envelope.",
"deep":"Blind signatures separate what a signer sees from what is later shown. The signer still has to be trusted and online. DigiCash, Chaum's later company, is a separate event.",
"marks":"Presentation at CRYPTO '82; printed proceedings 1983",
"connection":{
"whitepaperRefs":[],
"documentedInfluence":[],
"contextOnly":true
},
"sources":[
{
"label":"Chaum, Blind Signatures for Untraceable Payments (author scan)",
"url":"https://chaum.com/wp-content/uploads/2022/01/Chaum-blind-signatures.pdf",
"type":"primary",
"checked":"Era 2 dossier",
"verification":"dossier-record"
}
],
"milestone":false,
"renderAs":"bead",
"confidence":"high",
"exhibit":"e2-blind"
},
{
"id":"tl-2-cd",
"era":2,
"lane":"tech",
"date":"1982-08-17",
"dateLabel":"17 August 1982",
"title":"Music as numbers",
"sign":"MUSIC AS NUMBERS - 1982",
"kid":"A CD stores music as tiny bumps that mean 1s and 0s, and a laser reads them back. The music had become numbers.",
"deep":"Three separate events: Philips manufactured the first disc on 17 August 1982. Sony released its CDP-101 player on 1 October 1982. Philips's 2007 release says the first CDs and players, including its CD100, were introduced in Japan in November 1982, and that the US and Europe followed in March 1983. The two sources date Japan differently; they are kept as each company's own account.",
"marks":"First Compact Disc manufactured, Philips factory, Langenhagen",
"connection":{
"whitepaperRefs":[],
"documentedInfluence":[],
"contextOnly":true
},
"sources":[
{
"label":"Philips press release, CD 25th anniversary (16 Aug 2007; secondary host)",
"url":"https://dutchaudioclassics.nl/philips_press_cd_25_year_anniversary_2007/",
"type":"primary",
"checked":"taskc-gaps.md",
"verification":"research-agent-record"
},
{
"label":"Sony corporate history (CDP-101, 1 October 1982)",
"url":"https://www.sony.com/en/SonyInfo/CorporateInfo/History/SonyHistory/2-07.html",
"type":"primary",
"checked":"Astra's review; Claude's fetch tool was blocked by this site",
"verification":"astra-reported"
}
],
"milestone":false,
"renderAs":"bead",
"confidence":"high",
"exhibit":null
},
{
"id":"tl-2-dynatac",
"era":2,
"lane":"tech",
"date":"1983-09-21",
"dateLabel":"21 September 1983",
"title":"The brick phone",
"sign":"PHONE TO GO - 1983",
"kid":"In 1983 a phone you could carry was approved for sale. It was the size of a brick, and towers passed your call along.",
"deep":"Motorola publicly demonstrated a prototype portable cellular system in New York on 3 April 1973 (Era 1's years). Price, weight and talk time are not given by Motorola and stay off all signs.",
"marks":"FCC approves the DynaTAC 8000X, described by Motorola as the first commercial portable cell phone",
"connection":{
"whitepaperRefs":[],
"documentedInfluence":[],
"contextOnly":true
},
"sources":[
{
"label":"Motorola Solutions, cell phone development",
"url":"https://www.motorolasolutions.com/en_us/about/history/explore-motorola-heritage/cell-phone-development.html",
"type":"primary",
"checked":"Task C brief",
"verification":"claude-read"
}
],
"milestone":false,
"renderAs":"bead",
"confidence":"high",
"exhibit":null
},
{
"id":"tl-2-ecc",
"era":2,
"lane":"btc",
"date":"1985",
"dateLabel":"1985 (presented); 1986 (printed)",
"title":"Curves for keys",
"sign":"ELLIPTIC CURVES - 1985",
"kid":"A mathematician showed that points on special curves can be used to make cryptographic keys.",
"deep":"Miller's paper proposes elliptic-curve cryptography. Bitcoin's signatures use an elliptic curve, but its specific curve choice is an implementation detail this paper did not decide. Do not call Miller the sole inventor: another researcher's independent work is a pending check.",
"marks":"Victor Miller's Use of Elliptic Curves in Cryptography, CRYPTO '85; printed volume 1986",
"connection":{
"whitepaperRefs":[],
"documentedInfluence":[],
"contextOnly":true
},
"sources":[
{
"label":"Miller, Use of Elliptic Curves in Cryptography (Springer)",
"url":"https://link.springer.com/chapter/10.1007/3-540-39799-X_31",
"type":"primary",
"checked":"Era 2 dossier",
"verification":"dossier-record"
}
],
"milestone":false,
"renderAs":"bead",
"confidence":"high",
"exhibit":null
},
{
"id":"tl-2-may-manifesto",
"era":2,
"lane":"btc",
"date":"1988",
"dateLabel":"1988",
"title":"A privacy prediction",
"sign":"A PRIVACY PREDICTION - 1988",
"kid":"Tim May predicted that cryptography would change how people trade and talk online. These were his opinions.",
"deep":"It is advocacy and prediction, not a payment protocol. The museum presents its claims as May's views.",
"marks":"Date given to Timothy May's Crypto Anarchist Manifesto in the Nakamoto Institute reprint; exact circulation event not established in the dossier",
"connection":{
"whitepaperRefs":[],
"documentedInfluence":[],
"contextOnly":true
},
"sources":[
{
"label":"Nakamoto Institute reprint of the manifesto",
"url":"https://nakamotoinstitute.org/library/crypto-anarchist-manifesto/",
"type":"secondary",
"checked":"Era 2 dossier",
"verification":"dossier-record"
}
],
"milestone":false,
"renderAs":"bead",
"confidence":"high",
"exhibit":null
},
{
"id":"tl-2-486",
"era":2,
"lane":"tech",
"date":"1989-04-10",
"dateLabel":"10 April 1989",
"title":"A faster office chip",
"sign":"486 CHIP - 1989",
"kid":"A faster chip for office computers. You can try one in the next cave, because machines stay in use for years.",
"deep":"Intel's date index records the 486 DX family's introduction on 10 April 1989 and lists a 25 MHz configuration. The cave's 1993 office PC is a labelled example of a machine still in use.",
"marks":"Intel 486 DX family introduced",
"connection":{
"whitepaperRefs":[],
"documentedInfluence":[],
"contextOnly":true
},
"sources":[
{
"label":"Intel quick reference by year",
"url":"https://www.intel.com/pressroom/kits/quickrefyr.htm",
"type":"primary",
"checked":"Era 3 dossier",
"verification":"dossier-record"
}
],
"milestone":false,
"renderAs":"bead",
"confidence":"high",
"exhibit":null
},
{
"id":"tl-3-web",
"era":3,
"lane":"tech",
"date":"1990",
"dateLabel":"Late 1990; announced 6 August 1991",
"title":"The first website",
"sign":"THE FIRST WEBSITE - 1990",
"kid":"A scientist at CERN made web pages you could click between. In 1993 CERN made the web software free for everyone.",
"deep":"Tim Berners-Lee proposed the idea in March 1989 and revised it in May 1990. The web is not how Bitcoin nodes talk to each other.",
"marks":"First browser/editor, website and server live at CERN (late 1990); public announcement on alt.hypertext (6 Aug 1991); public domain (30 Apr 1993)",
"connection":{
"whitepaperRefs":[],
"documentedInfluence":[],
"contextOnly":true
},
"sources":[
{
"label":"CERN, Web@30 history",
"url":"https://web30.web.cern.ch/web-history.html",
"type":"primary",
"checked":"Task C brief",
"verification":"claude-read"
},
{
"label":"CERN, the birth of the Web",
"url":"https://home.cern/science/computing/the-birth-of-the-web/",
"type":"primary",
"checked":"Task C brief",
"verification":"claude-read"
}
],
"milestone":false,
"renderAs":"bead",
"confidence":"high",
"exhibit":null
},
{
"id":"tl-3-haber-stornetta",
"era":3,
"lane":"btc",
"date":"1990-08",
"dateLabel":"1990 (presented); 1991 (journal)",
"title":"Timestamp a page",
"sign":"TIMESTAMPS - 1991",
"kid":"To prove a page wasn't changed later, fingerprint it and chain each fingerprint to the one before, so faking an old one breaks every link after it.",
"deep":"This is the heart of the whitepaper's timestamp server (section 3), cited as reference [3]. It still relied on stated trust assumptions and had no open money ledger.",
"marks":"CRYPTO '90 presentation (August 1990); Journal of Cryptology 3(2), 1991 (received 19 Aug 1990, revised 26 Oct 1990)",
"connection":{
"whitepaperRefs":[
3
],
"documentedInfluence":[],
"contextOnly":false
},
"sources":[
{
"label":"Haber and Stornetta, journal PDF copy",
"url":"https://gwern.net/doc/bitcoin/1991-haber.pdf",
"type":"primary",
"checked":"Era 3 dossier",
"verification":"dossier-record"
},
{
"label":"DOI record",
"url":"https://doi.org/10.1007/BF00196791",
"type":"primary",
"checked":"chart-verify.md",
"verification":"research-agent-record"
},
{
"label":"Bitcoin whitepaper (bitcoin.org)",
"url":"https://bitcoin.org/bitcoin.pdf",
"type":"primary",
"checked":"dossiers E0-WP; sources.md Entry 1",
"verification":"dossier-record"
}
],
"milestone":false,
"renderAs":"bead",
"confidence":"high",
"exhibit":"era3-room-haber1991"
},
{
"id":"tl-3-pgp",
"era":3,
"lane":"btc",
"date":"1991",
"dateLabel":"1991",
"title":"Private mail for everyone",
"sign":"PRIVATE MAIL - 1991",
"kid":"Free software that let ordinary people lock their emails.",
"deep":"Encryption keeps messages private but does not show who owns money or stop double-spending.",
"marks":"PGP published electronically, by Zimmermann's own account (essay dated June 1991, updated 1999)",
"connection":{
"whitepaperRefs":[],
"documentedInfluence":[],
"contextOnly":true
},
"sources":[
{
"label":"Zimmermann, Why I Wrote PGP",
"url":"https://www.philzimmermann.com/EN/essays/WhyIWrotePGP.html",
"type":"primary",
"checked":"Era 3 dossier",
"verification":"dossier-record"
}
],
"milestone":false,
"renderAs":"bead",
"confidence":"high",
"exhibit":"e3-padlock"
},
{
"id":"tl-3-dwork-naor",
"era":3,
"lane":"btc",
"date":"1992",
"dateLabel":"1992 (presented); 1993 (proceedings)",
"title":"Make spam cost work",
"sign":"PRICING VIA PROCESSING - 1992",
"kid":"Make every email cost a little computer work: easy for one friendly message, expensive for a million junk ones.",
"deep":"Pricing a resource with computation is not transferable money. It is not cited by the whitepaper, and no direct link to Bitcoin is documented. Avoid calling it the first proof-of-work.",
"marks":"Preliminary presentation at CRYPTO '92",
"connection":{
"whitepaperRefs":[],
"documentedInfluence":[],
"contextOnly":true
},
"sources":[
{
"label":"Dwork and Naor, author PDF",
"url":"https://www.wisdom.weizmann.ac.il/~naor/PAPERS/pvp.pdf",
"type":"primary",
"checked":"Era 3 dossier",
"verification":"dossier-record"
}
],
"milestone":false,
"renderAs":"bead",
"confidence":"high",
"exhibit":null
},
{
"id":"tl-3-sms",
"era":3,
"lane":"tech",
"date":"1992-12-03",
"dateLabel":"3 December 1992",
"title":"The first text",
"sign":"FIRST TEXT - 3 DEC 1992",
"kid":"The first text was a holiday greeting typed on a computer in 1992 and sent to a phone.",
"deep":"Vodafone calls this the official first text and mentions an earlier internal test, so 'first' is Vodafone's claim.",
"marks":"Neil Papworth sends a text from a computer to Richard Jarvis's phone on Vodafone's UK network; Vodafone calls it the first",
"connection":{
"whitepaperRefs":[],
"documentedInfluence":[],
"contextOnly":true
},
"sources":[
{
"label":"Vodafone, 25th anniversary of the text message",
"url":"https://www.vodafone.com/news/technology/25-anniversary-text-message",
"type":"primary",
"checked":"taskc-gaps.md",
"verification":"research-agent-record"
},
{
"label":"Vodafone UK, 30th anniversary",
"url":"https://www.vodafone.co.uk/newscentre/features/merry-christmas-the-30th-anniversary-of-the-first-text-message/",
"type":"primary",
"checked":"taskc-gaps.md",
"verification":"research-agent-record"
}
],
"milestone":false,
"renderAs":"bead",
"confidence":"high",
"exhibit":null
},
{
"id":"tl-3-bayer",
"era":3,
"lane":"btc",
"date":"1993",
"dateLabel":"1993 (book); manuscript March 1992",
"title":"One tree, many pages",
"sign":"TREE TIMESTAMPS - 1993",
"kid":"Put many pages' fingerprints in one tree, and one timestamp covers them all.",
"deep":"Tree batching made timestamps cheaper and more widely witnessed. Cited as reference [4]. It builds on Merkle's earlier tree work.",
"marks":"Sequences II chapter, the version the whitepaper cites; workshop June 1991; manuscript dated March 1992",
"connection":{
"whitepaperRefs":[
4
],
"documentedInfluence":[],
"contextOnly":false
},
"sources":[
{
"label":"Bayer, Haber and Stornetta manuscript",
"url":"https://www.math.columbia.edu/~bayer/papers/Timestamp_BHS93.pdf",
"type":"primary",
"checked":"Era 3 dossier",
"verification":"dossier-record"
},
{
"label":"Publisher record",
"url":"https://doi.org/10.1007/978-1-4613-9323-8_24",
"type":"primary",
"checked":"Era 3 dossier",
"verification":"dossier-record"
},
{
"label":"Bitcoin whitepaper (bitcoin.org)",
"url":"https://bitcoin.org/bitcoin.pdf",
"type":"primary",
"checked":"dossiers E0-WP; sources.md Entry 1",
"verification":"dossier-record"
}
],
"milestone":false,
"renderAs":"bead",
"confidence":"high",
"exhibit":"era3-room-bayer1993"
},
{
"id":"tl-3-hughes",
"era":3,
"lane":"btc",
"date":"1993-03-09",
"dateLabel":"9 March 1993",
"title":"Privacy is not secrecy",
"sign":"CYPHERPUNK MANIFESTO - 1993",
"kid":"An essay arguing that people should choose what they reveal, and should write the code to make that possible.",
"deep":"A statement of goals, not a money protocol. No personal influence on Bitcoin is inferred.",
"marks":"Date written on Eric Hughes's A Cypherpunk's Manifesto",
"connection":{
"whitepaperRefs":[],
"documentedInfluence":[],
"contextOnly":true
},
"sources":[
{
"label":"Nakamoto Institute reprint",
"url":"https://nakamotoinstitute.org/library/cypherpunk-manifesto/",
"type":"secondary",
"checked":"Era 3 dossier",
"verification":"dossier-record"
}
],
"milestone":false,
"renderAs":"bead",
"confidence":"high",
"exhibit":null
},
{
"id":"tl-4-hashcash-1997",
"era":4,
"lane":"btc",
"date":"1997-03-28",
"dateLabel":"28 March 1997",
"title":"Computational postage",
"sign":"HASHCASH - 1997",
"kid":"Make a stamp by doing a puzzle that takes your computer a while, but anyone can check it in a flash.",
"deep":"This is the announcement, not the 2002 paper the whitepaper cites (tl-5-hashcash-2002). Satoshi's 31 October 2008 announcement says new coins come from Hashcash-style proof-of-work.",
"marks":"Adam Back's hash cash announcement, cypherpunks list",
"connection":{
"whitepaperRefs":[],
"documentedInfluence":[
{
"label":"Satoshi, 31 Oct 2008 announcement: new coins from Hashcash-style proof-of-work",
"date":"2008-10-31",
"url":"https://satoshi.nakamotoinstitute.org/emails/cryptography/1/",
"type":"primary",
"verification":"dossier-record",
"checked":"Era 4 and Era 6 dossiers"
}
],
"contextOnly":false
},
"sources":[
{
"label":"Archived cypherpunks message",
"url":"https://mailing-list-archive.cryptoanarchy.wiki/archive/1997/03/1fea96e9a08fb74d7f1fdeca362f943dcb2ca70017b092359eb8f931e11004cf/",
"type":"primary",
"checked":"Era 4 dossier",
"verification":"dossier-record"
},
{
"label":"Bitcoin P2P e-cash paper, cryptography list, 31 Oct 2008 (Nakamoto Institute archive)",
"url":"https://satoshi.nakamotoinstitute.org/emails/cryptography/1/",
"type":"primary",
"checked":"Era 6 dossier; sources.md Entry 1",
"verification":"dossier-record"
}
],
"milestone":false,
"renderAs":"bead",
"confidence":"high",
"exhibit":"e4-hashcash"
},
{
"id":"tl-4-secure-names",
"era":4,
"lane":"btc",
"date":"1997-04",
"dateLabel":"April 1997",
"title":"Name the exact document",
"sign":"SECURE NAMES - 1997",
"kid":"Give any file a short name that proves exactly which file it is.",
"deep":"Cited as reference [5]. It identifies data; it does not say who may spend money.",
"marks":"ACM CCS '97 proceedings, pp. 28-35",
"connection":{
"whitepaperRefs":[
5
],
"documentedInfluence":[],
"contextOnly":false
},
"sources":[
{
"label":"Secure Names for Bit-Strings (PDF)",
"url":"https://cdn.nakamotoinstitute.org/docs/secure-names-bit-strings.pdf",
"type":"primary",
"checked":"Era 4 dossier",
"verification":"dossier-record"
},
{
"label":"DOI record",
"url":"https://doi.org/10.1145/266420.266430",
"type":"primary",
"checked":"Era 4 dossier",
"verification":"dossier-record"
},
{
"label":"Bitcoin whitepaper (bitcoin.org)",
"url":"https://bitcoin.org/bitcoin.pdf",
"type":"primary",
"checked":"dossiers E0-WP; sources.md Entry 1",
"verification":"dossier-record"
}
],
"milestone":false,
"renderAs":"bead",
"confidence":"high",
"exhibit":"e4-names"
},
{
"id":"tl-4-deep-blue",
"era":4,
"lane":"tech",
"date":"1997-05",
"dateLabel":"May 1997",
"title":"Chess machine wins",
"sign":"CHESS MACHINE WINS - MAY 1997",
"kid":"A computer beat the world chess champion. It could look at 200 million positions every second.",
"deep":"The final game is dated 11 May 1997 by a Computer History Museum catalogue entry; IBM's page gives the month. Any link to proof-of-work is an analogy only.",
"marks":"Deep Blue wins the rematch 3.5-2.5 at the Equitable Center, New York",
"connection":{
"whitepaperRefs":[],
"documentedInfluence":[],
"contextOnly":true
},
"sources":[
{
"label":"IBM, Deep Blue",
"url":"https://ibm.com/history/deep-blue",
"type":"primary",
"checked":"Task C brief",
"verification":"claude-read"
},
{
"label":"Computer History Museum catalogue 102695065",
"url":"https://www.computerhistory.org/collections/catalog/102695065",
"type":"secondary",
"checked":"taskc-gaps.md",
"verification":"research-agent-record"
}
],
"milestone":false,
"renderAs":"bead",
"confidence":"high",
"exhibit":null
},
{
"id":"tl-4-wifi",
"era":4,
"lane":"tech",
"date":"1997-06-26",
"dateLabel":"26 June 1997",
"title":"Networks without wires",
"sign":"NETWORK WITHOUT WIRES - 1997",
"kid":"Engineers agreed rules so computers could network by radio instead of cables. At first it was slow, 2 megabits a second at most.",
"deep":"The first standard defined 1 and 2 Mbit/s rates. Don't use later brand names or logos.",
"marks":"IEEE Std 802.11 approved; published 18 November 1997; basic rates 1 and 2 Mbit/s",
"connection":{
"whitepaperRefs":[],
"documentedInfluence":[],
"contextOnly":true
},
"sources":[
{
"label":"IEEE Standards, 802.11-1997",
"url":"https://standards.ieee.org/ieee/802.11/1163",
"type":"primary",
"checked":"taskc-gaps.md",
"verification":"research-agent-record"
},
{
"label":"IEEE 802.11 working group, 802.11b PAR (1998)",
"url":"https://grouper.ieee.org/groups/802/11/Documents/DocumentArchives/1998_docs/Feb98/80062W%20PAR%20dot11b.PDF",
"type":"primary",
"checked":"Task C brief",
"verification":"claude-read"
}
],
"milestone":false,
"renderAs":"bead",
"confidence":"high",
"exhibit":null
},
{
"id":"tl-4-v90",
"era":4,
"lane":"tech",
"date":"1998-09-01",
"dateLabel":"1 September 1998",
"title":"The 56k modem",
"sign":"56K MODEM - 1998",
"kid":"Modems learned to download faster over phone lines, up to 56 thousand bits a second in theory.",
"deep":"V.90 sets ceilings of 56,000 bit/s down and 33,600 bit/s up; real speeds were lower.",
"marks":"ITU-T approves Recommendation V.90",
"connection":{
"whitepaperRefs":[],
"documentedInfluence":[],
"contextOnly":true
},
"sources":[
{
"label":"ITU-T V.90 (09/98)",
"url":"https://www.itu.int/rec/T-REC-V.90-199809-I/en",
"type":"primary",
"checked":"Era 4 dossier",
"verification":"dossier-record"
}
],
"milestone":false,
"renderAs":"bead",
"confidence":"high",
"exhibit":"e4-modem"
},
{
"id":"tl-4-b-money",
"era":4,
"lane":"btc",
"date":"1998-11",
"dateLabel":"November 1998",
"title":"Shared pseudonymous accounts",
"sign":"B-MONEY - 1998",
"kid":"An idea for money where everyone keeps a copy of who owns what, and new money comes from doing computer work.",
"deep":"Wei Dai described two protocols with strong assumptions. Cited as reference [1]. In August 2008 Satoshi wrote to Dai about citing it, and in January 2009 told him the software achieved nearly all of b-money's goals.",
"marks":"b-money text circulated (month as catalogued by the Nakamoto Institute; Dai says announced on the cypherpunks list in 1998)",
"connection":{
"whitepaperRefs":[
1
],
"documentedInfluence":[
{
"label":"Satoshi to Wei Dai, 22 Aug 2008: asks about citing b-money",
"date":"2008-08-22",
"url":"https://gwern.net/doc/bitcoin/2008-nakamoto",
"type":"primary",
"verification":"research-agent-record",
"checked":"sources.md Entry 21"
},
{
"label":"Satoshi to Wei Dai, 10 Jan 2009: nearly all the goals of b-money",
"date":"2009-01-10",
"url":"https://gwern.net/doc/bitcoin/2008-nakamoto",
"type":"primary",
"verification":"research-agent-record",
"checked":"sources.md Entry 21"
},
{
"label":"Satoshi, bitcointalk, 20 Jul 2010: an implementation of b-money",
"date":"2010-07-20",
"url":"https://satoshi.nakamotoinstitute.org/posts/bitcointalk/249/",
"type":"primary",
"verification":"research-agent-record",
"checked":"sources.md Entry 23; Era 5 dossier"
}
],
"contextOnly":false
},
"sources":[
{
"label":"Nakamoto Institute, b-money",
"url":"https://nakamotoinstitute.org/library/b-money/",
"type":"secondary",
"checked":"Era 4 dossier",
"verification":"dossier-record"
},
{
"label":"Satoshi-Wei Dai emails, published by Dai (gwern.net copy)",
"url":"https://gwern.net/doc/bitcoin/2008-nakamoto",
"type":"primary",
"checked":"sources.md Entry 21",
"verification":"research-agent-record"
},
{
"label":"Satoshi, bitcointalk, 20 Jul 2010 (Nakamoto Institute archive)",
"url":"https://satoshi.nakamotoinstitute.org/posts/bitcointalk/249/",
"type":"primary",
"checked":"sources.md Entry 23; Era 5 dossier",
"verification":"dossier-record"
},
{
"label":"Bitcoin whitepaper (bitcoin.org)",
"url":"https://bitcoin.org/bitcoin.pdf",
"type":"primary",
"checked":"dossiers E0-WP; sources.md Entry 1",
"verification":"dossier-record"
}
],
"milestone":false,
"renderAs":"bead",
"confidence":"high",
"exhibit":"e4-bmoney"
},
{
"id":"tl-4-timesec",
"era":4,
"lane":"btc",
"date":"1999-05",
"dateLabel":"May 1999",
"title":"A timestamp service with little trust",
"sign":"TIMESTAMP SERVICE - 1999",
"kid":"A timestamp service designed so you don't have to trust it much, though you still need the service.",
"deep":"Cited as reference [2]. The author is Xavier Serret-Avila, printed in the whitepaper as X.S. Avila.",
"marks":"Proceedings of the 20th Symposium on Information Theory in the Benelux (held 27-28 May 1999)",
"connection":{
"whitepaperRefs":[
2
],
"documentedInfluence":[],
"contextOnly":false
},
"sources":[
{
"label":"Massias, Serret-Avila and Quisquater (PDF)",
"url":"https://cdn.nakamotoinstitute.org/docs/secure-timestamping-service.pdf",
"type":"primary",
"checked":"Era 4 dossier",
"verification":"dossier-record"
},
{
"label":"Bitcoin whitepaper (bitcoin.org)",
"url":"https://bitcoin.org/bitcoin.pdf",
"type":"primary",
"checked":"dossiers E0-WP; sources.md Entry 1",
"verification":"dossier-record"
}
],
"milestone":false,
"renderAs":"bead",
"confidence":"high",
"exhibit":"e4-timesec"
},
{
"id":"tl-5-gps",
"era":5,
"lane":"tech",
"date":"2000-05-02",
"dateLabel":"2 May 2000",
"title":"GPS gets sharper",
"sign":"GPS SHARPENS - 2 MAY 2000",
"kid":"GPS used to be made a bit fuzzy on purpose for everyday users. Just after midnight on 2 May 2000 the fuzz was switched off, and everyone's position got much more accurate.",
"deep":"The White House announced the decision on 1 May 2000. GPS.gov says users should then see basic accuracy of 10-20 metres or better. It gives no before-and-after multiplier, so none is shown. GPS is not part of Bitcoin's design.",
"marks":"Selective Availability switched off, a few minutes past midnight EDT after the end of 1 May 2000; announced by the President on 1 May 2000",
"connection":{
"whitepaperRefs":[],
"documentedInfluence":[],
"contextOnly":true
},
"sources":[
{
"label":"GPS.gov, Selective Availability",
"url":"https://gps.gov/selective-availability",
"type":"primary",
"checked":"this revision",
"verification":"claude-read"
},
{
"label":"White House statement, 1 May 2000",
"url":"https://clintonwhitehouse5.archives.gov/WH/New/html/20000501_2.html",
"type":"primary",
"checked":"this revision",
"verification":"claude-read"
}
],
"milestone":false,
"renderAs":"bead",
"confidence":"high",
"exhibit":"e5-gps"
},
{
"id":"tl-5-wikipedia",
"era":5,
"lane":"tech",
"date":"2001-01",
"dateLabel":"January 2001",
"title":"Anyone can edit",
"sign":"ANYONE CAN EDIT - 2001",
"kid":"A website started where anyone could write and fix encyclopedia pages. By its first birthday there were more than 20,000 articles.",
"deep":"Wikimedia Canada and Wikipedia's own newsletter give 15 January 2001. Cooperation by strangers is an analogy, not a link to Bitcoin.",
"marks":"Wikipedia begins; 15 January was later marked as Wikipedia Day",
"connection":{
"whitepaperRefs":[],
"documentedInfluence":[],
"contextOnly":true
},
"sources":[
{
"label":"Wikimedia Meta, draft of Wikipedia's first press release (Jan 2002)",
"url":"https://meta.wikimedia.org/wiki/Wikipedia%27s_first_press_release--draft_for_comment",
"type":"primary",
"checked":"Task C brief",
"verification":"claude-read"
},
{
"label":"Wikimedia Canada, Wikipedia turns 25",
"url":"https://www.wikimedia.ca/en/wikipedia-turns-25/",
"type":"secondary",
"checked":"taskc-gaps.md",
"verification":"research-agent-record"
},
{
"label":"The Signpost, 15 Jan 2026",
"url":"https://signpost.news/2026-01-15/News_and_notes",
"type":"secondary",
"checked":"taskc-gaps.md",
"verification":"research-agent-record"
}
],
"milestone":false,
"renderAs":"bead",
"confidence":"medium",
"exhibit":"e5-wiki"
},
{
"id":"tl-5-chord",
"era":5,
"lane":"btc",
"date":"2001-08",
"dateLabel":"August 2001",
"title":"Find the right peer",
"sign":"FIND A PEER - 2001",
"kid":"A way for computers that come and go to still find who holds what.",
"deep":"Lookup does not agree ownership. Bitcoin does not use Chord.",
"marks":"SIGCOMM 2001 conference (27-31 Aug) printed on the Chord paper",
"connection":{
"whitepaperRefs":[],
"documentedInfluence":[],
"contextOnly":true
},
"sources":[
{
"label":"Chord paper (MIT PDOS)",
"url":"https://pdos.csail.mit.edu/papers/chord:sigcomm01/chord_sigcomm.pdf",
"type":"primary",
"checked":"Era 5 dossier",
"verification":"dossier-record"
}
],
"milestone":false,
"renderAs":"bead",
"confidence":"high",
"exhibit":"e5-chord"
},
{
"id":"tl-5-music-player",
"era":5,
"lane":"tech",
"date":"2001-10-23",
"dateLabel":"23 October 2001",
"title":"Songs in your pocket",
"sign":"POCKET MUSIC - 2001",
"kid":"A music player with a tiny hard disk that held lots of songs.",
"deep":"The manufacturer's announcement gives a 5 GB drive. Model a generic box with no logos.",
"marks":"Portable hard-disk music player announced (available 10 November)",
"connection":{
"whitepaperRefs":[],
"documentedInfluence":[],
"contextOnly":true
},
"sources":[
{
"label":"Manufacturer announcement, 23 Oct 2001",
"url":"https://www.apple.com/newsroom/2001/10/23Apple-Presents-iPod/",
"type":"primary",
"checked":"Era 5 dossier",
"verification":"dossier-record"
}
],
"milestone":false,
"renderAs":"bead",
"confidence":"high",
"exhibit":"e5-player"
},
{
"id":"tl-5-hashcash-2002",
"era":5,
"lane":"btc",
"date":"2002-08-01",
"dateLabel":"1 August 2002",
"title":"The work-stamp manual",
"sign":"HASHCASH PAPER - 2002",
"kid":"Adam Back's full write-up of work stamps: hard to make, easy to check.",
"deep":"Cited as reference [6] in section 4 of the whitepaper. A service still had to check spent stamps.",
"marks":"Date printed on Back's paper Hashcash - A Denial of Service Counter-Measure",
"connection":{
"whitepaperRefs":[
6
],
"documentedInfluence":[],
"contextOnly":false
},
"sources":[
{
"label":"Hashcash paper (PDF)",
"url":"https://cdn.nakamotoinstitute.org/docs/hashcash.pdf",
"type":"primary",
"checked":"Era 5 dossier",
"verification":"dossier-record"
},
{
"label":"Bitcoin whitepaper (bitcoin.org)",
"url":"https://bitcoin.org/bitcoin.pdf",
"type":"primary",
"checked":"dossiers E0-WP; sources.md Entry 1",
"verification":"dossier-record"
}
],
"milestone":false,
"renderAs":"bead",
"confidence":"high",
"exhibit":"e5-hashcash"
},
{
"id":"tl-5-bittorrent",
"era":5,
"lane":"btc",
"date":"2003-05-22",
"dateLabel":"22 May 2003",
"title":"Share the pieces",
"sign":"SHARE THE PIECES - 2003",
"kid":"Everyone downloading a file also shares the pieces they have.",
"deep":"File sharing is not monetary consensus. The 2001 release date is held back until a primary record is found.",
"marks":"Date printed on Bram Cohen's paper Incentives Build Robustness in BitTorrent (not its launch date)",
"connection":{
"whitepaperRefs":[],
"documentedInfluence":[],
"contextOnly":true
},
"sources":[
{
"label":"Cohen, Incentives Build Robustness in BitTorrent",
"url":"https://www.bittorrent.org/bittorrentecon.pdf",
"type":"primary",
"checked":"Era 5 dossier",
"verification":"dossier-record"
}
],
"milestone":false,
"renderAs":"bead",
"confidence":"high",
"exhibit":"e5-bittorrent"
},
{
"id":"tl-5-rpow",
"era":5,
"lane":"btc",
"date":"2004-08-15",
"dateLabel":"15 August 2004",
"title":"Reuse a token",
"sign":"REUSABLE PROOFS - 2004",
"kid":"Swap a used work-token for a fresh one at a special server, so the work can be reused.",
"deep":"It depended on one server and its trusted hardware. Not a whitepaper reference; no direct influence is established.",
"marks":"Hal Finney's RPOW announcement email",
"connection":{
"whitepaperRefs":[],
"documentedInfluence":[],
"contextOnly":true
},
"sources":[
{
"label":"Nakamoto Institute reprint of the announcement",
"url":"https://nakamotoinstitute.org/library/rpow/",
"type":"secondary",
"checked":"Era 5 dossier",
"verification":"dossier-record"
}
],
"milestone":false,
"renderAs":"bead",
"confidence":"high",
"exhibit":"e5-rpow"
},
{
"id":"tl-5-bit-gold",
"era":5,
"lane":"btc",
"date":"2005-12",
"dateLabel":"December 2005 (qualified)",
"title":"Costly bits, recorded owners",
"sign":"BIT GOLD - 2005",
"kid":"Make digital 'gold' by solving puzzles, chain each new puzzle to the last answer, and keep a list of who owns each piece.",
"deep":"Units were not interchangeable, and ownership needed a separate registry. Szabo later said he conceived it in 1998; no 1998 text has been found. The documented link is Satoshi's 2010 description, written later.",
"marks":"Bit gold blog post; the Nakamoto Institute dates it 29 Dec 2005; the author's page now displays 27 Dec 2008",
"connection":{
"whitepaperRefs":[],
"documentedInfluence":[
{
"label":"Satoshi, bitcointalk, 20 Jul 2010: an implementation of b-money and Bitgold (retrospective)",
"date":"2010-07-20",
"url":"https://satoshi.nakamotoinstitute.org/posts/bitcointalk/249/",
"type":"primary",
"verification":"research-agent-record",
"checked":"sources.md Entry 23; Era 5 dossier"
}
],
"contextOnly":false
},
"sources":[
{
"label":"Nakamoto Institute, Bit Gold",
"url":"https://nakamotoinstitute.org/library/bit-gold/",
"type":"secondary",
"checked":"Era 5 dossier",
"verification":"dossier-record"
},
{
"label":"Author's blog page (displays 27 Dec 2008)",
"url":"https://unenumerated.blogspot.com/2005/12/bit-gold.html",
"type":"primary",
"checked":"Era 5 dossier",
"verification":"dossier-record"
},
{
"label":"Satoshi, bitcointalk, 20 Jul 2010 (Nakamoto Institute archive)",
"url":"https://satoshi.nakamotoinstitute.org/posts/bitcointalk/249/",
"type":"primary",
"checked":"sources.md Entry 23; Era 5 dossier",
"verification":"dossier-record"
}
],
"milestone":false,
"renderAs":"bead",
"confidence":"medium",
"exhibit":"e5-bitgold"
},
{
"id":"tl-6-dai-email",
"era":6,
"lane":"btc",
"date":"2008-08-22",
"dateLabel":"22 August 2008",
"title":"Asking for the right citation",
"sign":"(evidence on b-money)",
"kid":"Before publishing, Satoshi wrote to Wei Dai to cite his b-money idea properly.",
"deep":"The email says Adam Back pointed Satoshi to Dai's site. Dai published the emails in 2014.",
"marks":"Satoshi emails Wei Dai about citing b-money",
"connection":{
"whitepaperRefs":[],
"documentedInfluence":[],
"contextOnly":true
},
"sources":[
{
"label":"Satoshi-Wei Dai emails, published by Dai (gwern.net copy)",
"url":"https://gwern.net/doc/bitcoin/2008-nakamoto",
"type":"primary",
"checked":"sources.md Entry 21",
"verification":"research-agent-record"
}
],
"milestone":false,
"renderAs":"evidence:tl-4-b-money",
"confidence":"high",
"exhibit":null
},
{
"id":"tl-6-announcement",
"era":6,
"lane":"btc",
"date":"2008-10-31",
"dateLabel":"31 October 2008",
"title":"The paper is announced",
"sign":"THE WHITEPAPER - 31 OCT 2008",
"kid":"Someone called Satoshi Nakamoto shared a nine-page plan for digital cash with no bank in the middle. It was a plan: no Bitcoin network existed yet.",
"deep":"The dated email anchors the paper's public appearance. Its eight references light up on the river. The software and the first block came in January 2009.",
"marks":"Bitcoin P2P e-cash paper announced on the cryptography mailing list; the PDF itself is undated",
"connection":{
"whitepaperRefs":[],
"documentedInfluence":[],
"contextOnly":true
},
"sources":[
{
"label":"Bitcoin P2P e-cash paper, cryptography list, 31 Oct 2008 (Nakamoto Institute archive)",
"url":"https://satoshi.nakamotoinstitute.org/emails/cryptography/1/",
"type":"primary",
"checked":"Era 6 dossier; sources.md Entry 1",
"verification":"dossier-record"
},
{
"label":"metzdowd cryptography list archive",
"url":"https://www.metzdowd.com/pipermail/cryptography/2008-October/014810.html",
"type":"primary",
"checked":"sources.md Entry 1",
"verification":"research-agent-record"
},
{
"label":"Bitcoin whitepaper (bitcoin.org)",
"url":"https://bitcoin.org/bitcoin.pdf",
"type":"primary",
"checked":"dossiers E0-WP; sources.md Entry 1",
"verification":"dossier-record"
}
],
"milestone":true,
"renderAs":"bead",
"confidence":"high",
"exhibit":"e6-announce"
},
{
"id":"tl-7-genesis",
"era":7,
"lane":"btc",
"date":"2009-01-03",
"dateLabel":"3 January 2009",
"title":"The first block",
"sign":"THE FIRST BLOCK - 3 JAN 2009",
"kid":"The very first block of the Bitcoin chain. Inside it is a newspaper headline from that day.",
"deep":"The time is the one written in the block's header, not an independently observed moment. Block 1 is timestamped 9 January. Its embedded headline should not be read as a full account of the author's motives.",
"marks":"Genesis block header timestamp; not an independently established real-world mining time",
"connection":{
"whitepaperRefs":[],
"documentedInfluence":[],
"contextOnly":true
},
"sources":[
{
"label":"Bitcoin Core chain parameters (pin a fixed revision before shipping)",
"url":"https://github.com/bitcoin/bitcoin/blob/master/src/kernel/chainparams.cpp",
"type":"primary",
"checked":"Era 7 dossier",
"verification":"dossier-record"
},
{
"label":"Block 0 data (Blockstream API)",
"url":"https://blockstream.info/api/block/000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f",
"type":"primary",
"checked":"Era 7 dossier",
"verification":"dossier-record"
}
],
"milestone":true,
"renderAs":"bead",
"confidence":"high",
"exhibit":"e7-genesis"
},
{
"id":"tl-7-release",
"era":7,
"lane":"btc",
"date":"2009-01-08",
"dateLabel":"8 January 2009",
"title":"The software is released",
"sign":"BITCOIN V0.1 - 8 JAN 2009",
"kid":"Now anyone could download the program and join in. Windows only at first, with its code shared openly.",
"deep":"Some histories say 9 January because of time zones or the download upload. The email time is the anchor. The author called it experimental.",
"marks":"Bitcoin v0.1 release announcement on the cryptography list",
"connection":{
"whitepaperRefs":[],
"documentedInfluence":[],
"contextOnly":true
},
"sources":[
{
"label":"Release email (Nakamoto Institute archive)",
"url":"https://satoshi.nakamotoinstitute.org/emails/cryptography/16/",
"type":"primary",
"checked":"Era 7 dossier",
"verification":"dossier-record"
}
],
"milestone":true,
"renderAs":"bead",
"confidence":"high",
"exhibit":"e7-desk"
},
{
"id":"tl-7-dai-reply",
"era":7,
"lane":"btc",
"date":"2009-01-10",
"dateLabel":"10 January 2009",
"title":"A note to b-money's author",
"sign":"(evidence on b-money)",
"kid":"Satoshi wrote to Wei Dai that the new software did nearly everything b-money had aimed for.",
"deep":"This is part of the documented link between b-money and Bitcoin.",
"marks":"Satoshi tells Wei Dai the release achieves nearly all the goals of b-money",
"connection":{
"whitepaperRefs":[],
"documentedInfluence":[],
"contextOnly":true
},
"sources":[
{
"label":"Satoshi-Wei Dai emails, published by Dai (gwern.net copy)",
"url":"https://gwern.net/doc/bitcoin/2008-nakamoto",
"type":"primary",
"checked":"sources.md Entry 21",
"verification":"research-agent-record"
}
],
"milestone":false,
"renderAs":"evidence:tl-4-b-money",
"confidence":"high",
"exhibit":null
},
{
"id":"tl-7-block-170",
"era":7,
"lane":"btc",
"date":"2009-01-12",
"dateLabel":"12 January 2009",
"title":"An early test payment",
"sign":"AN EARLY PAYMENT - 12 JAN 2009",
"kid":"Ten coins moved to Hal Finney as a test. He wrote about it years later.",
"deep":"The chain records amounts and keys, not names. The recipient comes from Finney's 2013 account. Call it an early test payment, not the first transaction.",
"marks":"Block 170 header timestamp; contains a 10 BTC transfer later recalled by Hal Finney as a test payment to him",
"connection":{
"whitepaperRefs":[],
"documentedInfluence":[],
"contextOnly":true
},
"sources":[
{
"label":"Block 170 transactions (Blockstream API)",
"url":"https://blockstream.info/api/block/00000000d1145790a8694403d4063f323d499e655c83426834d4ce2f8dd4a2ee/txs",
"type":"primary",
"checked":"Era 7 dossier",
"verification":"dossier-record"
},
{
"label":"Finney, Bitcoin and Me (2013)",
"url":"https://nakamotoinstitute.org/library/bitcoin-and-me/",
"type":"primary",
"checked":"Era 7 dossier",
"verification":"dossier-record"
}
],
"milestone":true,
"renderAs":"bead",
"confidence":"high",
"exhibit":"e7-payment"
}
]);
  BL.genesisTimelineData = { records, held: 15 };
})();
