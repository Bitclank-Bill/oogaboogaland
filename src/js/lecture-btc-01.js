// Bitcoin from First Principles, lecture 1: why money on a network was hard (copying and the double spend), what the trusted keeper of the ledger costs, the attempts from Chaum's ecash to Finney's RPOW, the whitepaper and the genesis block, and the four ideas the rest of the course opens up.
(() => {
  "use strict";
  window.BL.lectures.add({
    id: "btc-01", course: "first-principles", n: 1, title: "The Problem of Digital Cash",
    reading: [
      { title: "Bitcoin: A Peer-to-Peer Electronic Cash System", by: "Satoshi Nakamoto, 2008" }
    ],
    sources: [
      "Satoshi Nakamoto, Bitcoin: A Peer-to-Peer Electronic Cash System (2008), https://bitcoin.org/bitcoin.pdf",
      "Satoshi Nakamoto, Bitcoin P2P e-cash paper, Cryptography Mailing List, 31 October 2008, and the thread's replies to 13 November 2008, https://satoshi.nakamotoinstitute.org/emails/cryptography/threads/1/",
      "Wei Dai, b-money (1998), https://nakamotoinstitute.org/library/b-money/",
      "Nick Szabo, Bit Gold (published 2005), https://nakamotoinstitute.org/library/bit-gold/",
      "Hal Finney, RPOW: Reusable Proofs of Work (2004), https://nakamotoinstitute.org/finney/rpow/ and https://www.metzdowd.com/pipermail/cryptography/2004-August/007362.html",
      "Adam Back, Hashcash: A Denial of Service Counter-Measure (2002), http://www.hashcash.org/papers/hashcash.pdf, with https://en.wikipedia.org/wiki/Hashcash for the 1997 proposal",
      "David Chaum, Blind Signatures for Untraceable Payments (Crypto 82), with https://en.wikipedia.org/wiki/DigiCash and https://en.wikipedia.org/wiki/Blind_signature",
      "E-gold, https://en.wikipedia.org/wiki/E-gold",
      "Bitcoin Wiki, Genesis block, https://en.bitcoin.it/wiki/Genesis_block",
      "Lamport, Shostak and Pease, The Byzantine Generals Problem (1982), with https://en.wikipedia.org/wiki/Byzantine_fault",
      "World Bank, The Global Findex Database 2025, https://www.worldbank.org/en/publication/globalfindex"
    ],
    sections: [
      { id: "copy-problem", title: "A Coin You Cannot Copy", topics: ["digital cash", "copying data", "double spending", "course overview", "physical cash"],
        beats: [
          { slide: { k: "title", kicker: "Lecture 1", title: "The Problem of Digital Cash", sub: "Why money on the internet was hard, and what was tried" },
            at: "lectern", g: "open",
            say: [
              { s: "Welcome. Come in, find a seat.", m: "warm" },
              { s: "I want to start with something that sounds far too easy to be a problem.", m: "wry" },
              { s: "Send somebody money over the internet. That is all. How hard can it be?", g: "shrug", m: "wry" },
              { s: "Twenty-six years.", g: "lean", m: "grave", land: true },
              { s: "That is how long it beat some of the cleverest people alive.", m: "grave" },
              { s: "So today you get no answer. You get the problem, and I want you to feel how nasty it is.", m: "firm" },
              { s: "Then, over 14 lectures, we take one machine apart, piece by piece, and put it back together.", g: "wide", m: "warm" },
              "You need no finance, no cryptography and no code. Only curiosity."
            ] },
          { slide: { k: "points", title: "How this course works", start: 0, points: [
              "14 lectures, each built on the one before",
              "Every claim is something you can check yourself",
              "Today: the problem, the failures, the breakthrough",
              "Not on offer: prices, predictions, what to buy"
            ] },
            at: "centre", g: "open",
            say: [
              { s: "A few house rules. Each lecture stands on the one before, so please do not skip.", show: 1 },
              { s: "Rule two is my favourite.", m: "warm" },
              { s: "Do not believe me.", show: 2, g: "pinch", m: "firm", land: true },
              { s: "Everything I say, you can check for yourself. And by the end, you will know how.", m: "warm" },
              { s: "Today comes in three parts: the problem, a long line of failures, and then the breakthrough.", show: 3, g: "count" },
              { s: "And the one thing you will never get from me: a price, a prediction, or a tip on what to buy.", show: 4, g: "chop", m: "firm" }
            ] },
          { slide: { k: "figure", title: "A coin moves. A file copies.", ops: [
              { text: "In your hand", x: 40, y: 5, a: "c", size: 4, c: "grey" },
              { text: "On a network", x: 120, y: 5, a: "c", size: 4, c: "grey" },
              { line: [80, 2, 80, 60], c: "grey", dash: true },
              { box: [6, 14, 24, 12], t: "you" },
              { box: [50, 14, 24, 12], t: "stall" },
              { circle: [18, 40, 6], c: "grey", dash: true, at: 1 },
              { arrow: [27, 40, 53, 40], at: 1 },
              { circle: [62, 40, 6], c: "amber", fill: true, at: 1 },
              { text: "one coin, one owner", x: 40, y: 55, a: "c", size: 4.5, c: "green", at: 3 },
              { box: [86, 14, 24, 12], t: "you", at: 4 },
              { box: [130, 14, 24, 12], t: "friend", at: 4 },
              { box: [91, 34, 14, 12], t: "file", c: "blue", fill: true, at: 4 },
              { arrow: [107, 40, 133, 40], at: 5 },
              { box: [135, 34, 14, 12], t: "file", c: "blue", fill: true, at: 5 },
              { text: "two files, two owners", x: 120, y: 55, a: "c", size: 4.5, c: "red", at: 6 }
            ] },
            at: "screen", g: "point",
            say: [
              { s: "Take a coin out of your pocket. An imaginary one will do.", m: "warm" },
              "You are at a market stall. You buy an apple, and the coin leaves your hand and lands in hers.",
              "Nobody phoned a bank. Nobody checked a list. Nobody even asked your name.",
              { s: "Physics did the bookkeeping. A coin cannot be in two pockets at once.", g: "pinch", m: "firm" },
              { s: "Now try that with a file.", m: "grave", land: true },
              "Send your friend a photo. She has it now. And so do you.",
              { s: "On a network, sending is just a polite word for copying.", g: "shrug", m: "wry" }
            ] },
          { board: { clear: true, title: "The double spend", ops: [
              { text: "me", x: 23, y: 34, a: "c", size: 5, at: 1 },
              { box: [8, 40, 30, 14], t: "coin #7", c: "amber", at: 1 },
              { arrow: [40, 44, 100, 26], at: 2 },
              { box: [102, 18, 40, 14], t: "bakery", at: 2 },
              { arrow: [40, 50, 100, 68], at: 3 },
              { box: [102, 62, 40, 14], t: "bookshop", at: 3 },
              { text: "coin #7", x: 122, y: 38, a: "c", size: 4, c: "amber", at: 4 },
              { text: "coin #7", x: 122, y: 82, a: "c", size: 4, c: "amber", at: 4 },
              { text: "double spend", x: 14, y: 74, size: 6, c: "red", at: 5 },
              { text: "?", x: 151, y: 47, a: "c", size: 9, c: "red", at: 7 }
            ] },
            say: [
              { s: "So let me draw you the disaster.", m: "wry" },
              "Suppose money were a file. A string of numbers that says: this is coin number seven.",
              "I send it to the bakery. Lovely. I walk out with bread.",
              { s: "Then I send the very same file to the bookshop, and I walk out with a book.", m: "wry" },
              { s: "Both shops now hold coin number seven. A perfect copy each. Neither can tell.", m: "grave" },
              { s: "That is the double spend, and it is the villain of today's story.", m: "grave", p: 0.5 },
              { s: "So any money that lives on a network has to answer one question.", m: "firm" },
              { s: "Has this coin already been spent?", g: "lean", m: "firm", land: true }
            ] },
          { at: "centre", g: "open",
            say: [
              { s: "Notice what this is not. It is not about secrecy. It is not about speed.", g: "chop" },
              "It is about scarcity: a digital thing that cannot be in two places at once.",
              { s: "And computers are copying machines. We are asking a copying machine, very politely, not to copy.", g: "shrug", m: "wry" },
              { s: "For decades, there was exactly one way anyone knew to do it.", m: "grave", p: 0.4 }
            ] },
          { say: ["Before we go on, let me see whether the villain has landed.", "What is the double-spending problem?"],
            quiz: {
              q: "What is the double-spending problem?",
              options: [
                "Someone steals your password and spends your money",
                "The same digital coin is spent in two places",
                "A payment takes too long to arrive",
                "A coin loses its value over time"
              ],
              answer: 1,
              right: [{ s: "Exactly. One coin, two shops, and neither can tell.", m: "warm" }],
              wrong: [
                ["Ah, not quite. Theft is a real danger, but it is a different villain.", "Double spending is the owner copying a coin and spending it in two places."],
                null,
                ["Not speed. A copy arrives in an instant, and that is half the trouble.", "The problem is that the same coin can be spent in two places at once."],
                ["That one is inflation, and it is another story for another day.", "Double spending means one digital coin being spent in two places."]
              ] } }
        ] },

      { id: "trusted-middleman", title: "The Keeper of the Ledger", topics: ["trusted third party", "ledger", "banks", "censorship", "surveillance", "unbanked", "single point of failure"],
        beats: [
          { slide: { k: "section", title: "The Keeper of the Ledger", sub: "One list, one pen, one gatekeeper" },
            at: "lectern", g: "open",
            say: [
              { s: "Here is the one way that worked. Stop sending coins. Keep a list instead.", m: "firm" },
              "Put somebody trusted in the middle, and let them write down who owns what.",
              { s: "You have met this somebody. It is your bank, your card network, your payment app.", g: "count", m: "wry" },
              { s: "I am going to call it the keeper. That is a job title, by the way, not an insult.", m: "wry" }
            ] },
          { slide: { k: "figure", title: "One ledger, one keeper", ops: [
              { box: [4, 22, 26, 12], t: "you" },
              { box: [130, 22, 26, 12], t: "shop" },
              { box: [58, 6, 44, 40], c: "blue" },
              { text: "keeper's ledger", x: 80, y: 12, a: "c", size: 4, c: "blue" },
              { line: [62, 17, 98, 17], c: "blue" },
              { arrow: [31, 28, 57, 28], at: 1 },
              { text: "pay shop 5", x: 44, y: 23, a: "c", size: 3.5, at: 1 },
              { text: "you    10 - 5", x: 80, y: 25, a: "c", size: 4, mono: true, at: 2 },
              { text: "shop    0 + 5", x: 80, y: 34, a: "c", size: 4, mono: true, at: 2 },
              { arrow: [103, 28, 129, 28], c: "green", at: 2 },
              { text: "paid", x: 116, y: 23, a: "c", size: 3.5, c: "green", at: 2 },
              { arrow: [31, 42, 57, 42], c: "red", dash: true, at: 3 },
              { text: "same 5 again?", x: 30, y: 48, a: "c", size: 3.5, c: "red", at: 3 },
              { text: "refused", x: 80, y: 42, a: "c", size: 4, c: "red", at: 3 },
              { text: "one ledger, one keeper, one order of events", x: 80, y: 58, a: "c", size: 4.5, at: 4 }
            ] },
            at: "screen", g: "point",
            say: [
              "So how does the keeper kill the double spend? Watch.",
              "You never send money to the shop. You send a note to the keeper: pay the shop five.",
              "The keeper opens the ledger, sees you have ten, and moves five across. Done.",
              { s: "A second later, you try to spend the same five again. And the keeper says no.", m: "wry" },
              { s: "One ledger, one keeper, one order of events. Nothing gets spent twice.", g: "pinch", m: "firm" },
              "It works across a street or across an ocean. Nearly all the money you have ever touched works exactly like this."
            ] },
          { slide: { k: "points", title: "What the keeper costs", start: 0, points: [
              "Permission: someone must approve you first",
              "Censorship: payments can be blocked or reversed",
              "Fragility: one keeper, one point of failure",
              "Surveillance: every payment leaves a record",
              "Exclusion: no account, no access"
            ] },
            at: "left", g: "count",
            say: [
              { s: "Lovely. Problem solved. So why are we still here?", g: "shrug", m: "wry" },
              { s: "Because of what we quietly handed over to get it.", g: "lean", m: "grave", p: 0.4 },
              { s: "One: permission. Before you can pay anybody, the keeper has to accept you as a customer.", show: 1 },
              { s: "Two: censorship. Whoever holds the pen can refuse a payment, freeze a balance, or undo what was done.", show: 2 },
              { s: "Sometimes that power is used well. And sometimes it is used on journalists, on protesters, on whoever is inconvenient this year.", g: "weigh", m: "grave" },
              { s: "Three: fragility. The keeper goes offline, or gets hacked, or goes bust, and your money goes with it.", show: 3 }
            ] },
          { at: "right", g: "open",
            say: [
              { s: "Four: surveillance. That ledger is a diary of your life, and you are not the one keeping it.", show: 4, g: "count", m: "grave" },
              "Where you eat, what you read, who you give money to. It is all in there.",
              { s: "And five, the one I find hardest to forgive: exclusion.", show: 5, g: "count", m: "grave", p: 0.4 },
              { s: "If no keeper will have you, you are outside.", m: "grave", land: true },
              { s: "Not because you did anything wrong. Because you were not profitable, or not documented, or born in the wrong place.", m: "grave" }
            ] },
          { slide: { k: "number", value: "1 billion+", label: "adults in the world with no account of any kind", note: "World Bank, Global Findex 2025: about 1.3 billion" },
            at: "centre", g: "open",
            say: [
              { s: "How many people are outside?", p: 0.3 },
              { s: "By the World Bank's count, well over a billion adults. No account, anywhere, of any kind.", g: "wide", m: "grave" },
              "And here is the part that gets me. Most of them own a mobile phone.",
              { s: "They can send a message around the planet in a second.", m: "firm" },
              { s: "They cannot send a payment.", m: "grave", land: true },
              "That gap, between what the network can do and what money is allowed to do, is why any of this matters."
            ] },
          { slide: { k: "compare", title: "Two kinds of money",
              left: { head: "Cash in your hand", points: ["No permission needed", "No record kept", "Final the moment it moves", "Only works face to face"] },
              right: { head: "Money in an account", points: ["Works at any distance", "Needs a keeper's approval", "Every payment is recorded", "Can be frozen or reversed"] } },
            at: "left", g: "weigh",
            say: [
              "So this is the bargain we have all been living with.",
              "Cash asks nobody's permission. It keeps no record. And it is final the moment it leaves your hand.",
              { s: "But it only works when two people are standing in the same place.", g: "shrug" },
              "Account money works at any distance. And it charges you all five of those costs, every single time.",
              { s: "So the dream is easy to say.", g: "up", m: "warm", p: 0.4 },
              { s: "Cash, but for the internet.", m: "firm", land: true },
              "Money you can send like a message and hold like a coin. Nobody in the middle.",
              { s: "People started chasing that in the early 1980s. Let us go and meet them.", m: "warm" }
            ] },
          { say: ["Quick check, before we meet them.", "How does a trusted keeper stop a coin being spent twice?"],
            quiz: {
              q: "How does a trusted keeper stop a coin being spent twice?",
              options: [
                "It keeps the one ledger and refuses the second spend",
                "It makes every coin impossible to copy",
                "It hides every payment from everyone else",
                "It charges a fee on every payment"
              ],
              answer: 0,
              right: [{ s: "Right. One ledger, one order of events, and the second spend bounces.", m: "warm" }],
              wrong: [
                null,
                ["Nice idea, but no. Nobody can make data impossible to copy.", "The keeper holds the one ledger, sees the second spend, and says no."],
                ["Secrecy would not save you. A hidden coin copies just as easily.", "The keeper holds the one ledger, and refuses the second spend."],
                ["A fee only makes cheating dearer. It does not make it impossible.", "What stops it is the single ledger. The keeper sees the second spend and refuses."]
              ] } }
        ] },

      { id: "chaum-and-issuers", title: "Digital Coins, Central Mints", topics: ["david chaum", "blind signatures", "ecash", "digicash", "e-gold", "centralised issuers"],
        beats: [
          { slide: { k: "section", title: "Digital Coins, Central Mints", sub: "Chaum's ecash, DigiCash and e-gold" },
            at: "lectern", g: "open",
            say: [
              { s: "Our first hero is a cryptographer. His name is David Chaum.", m: "warm" },
              "In 1982 he presented a paper with a wonderful title: Blind Signatures for Untraceable Payments.",
              "Chaum was worried about cost number four. Surveillance.",
              { s: "He saw it coming very early. Electronic payments would let somebody build a file on everybody.", m: "grave" },
              { s: "So he asked a strange question. Could a bank approve your money without being able to follow it?", g: "lean" }
            ] },
          { slide: { k: "figure", title: "A signature made blind", ops: [
              { box: [2, 14, 32, 16], t: "sealed slip", at: 1 },
              { text: "you", x: 18, y: 36, a: "c", size: 3.5, c: "grey", at: 1 },
              { arrow: [36, 22, 44, 22], at: 2 },
              { box: [46, 14, 32, 16], t: "bank stamps", c: "blue", at: 2 },
              { text: "sees only envelope", x: 62, y: 36, a: "c", size: 3.5, c: "grey", at: 2 },
              { arrow: [80, 22, 88, 22], at: 3 },
              { box: [90, 14, 32, 16], t: "signed slip", c: "amber", fill: true, at: 3 },
              { text: "you unwrap it", x: 106, y: 36, a: "c", size: 3.5, c: "grey", at: 3 },
              { arrow: [124, 22, 134, 22], at: 5 },
              { box: [136, 14, 22, 16], t: "shop", at: 5 },
              { text: "spends it", x: 147, y: 36, a: "c", size: 3.5, c: "grey", at: 5 },
              { text: "is the signature valid? yes", x: 80, y: 48, a: "c", size: 4.5, c: "green", at: 5 },
              { text: "whose coin was it? unknowable", x: 80, y: 57, a: "c", size: 4.5, c: "red", at: 5 }
            ] },
            at: "screen", g: "point",
            say: [
              "The trick is easiest to see with an envelope. An envelope lined with carbon paper.",
              "You write a serial number on a slip, seal it inside, and hand the envelope to the bank.",
              "The bank takes one unit from your account and stamps the outside. And the stamp presses through, onto the slip.",
              "Back home you open it up. You are holding a slip with a genuine bank signature on it.",
              { s: "The bank has signed a number it has never seen.", g: "pinch", m: "firm", land: true },
              "Later, a shop deposits that slip. The bank can check its own signature. It cannot tell whose coin it was."
            ] },
          { at: "centre", g: "open",
            say: [
              { s: "Think about what that means. For the first time, money on a computer could be private the way a banknote is private.", m: "excited" },
              "Chaum called it ecash. Around 1990 he founded a company in Amsterdam, DigiCash, to sell it.",
              { s: "By 1995 a bank in St. Louis was issuing ecash backed by real dollars. It was working.", m: "excited" },
              { s: "And in 1998, DigiCash filed for bankruptcy.", g: "rest", m: "grave", land: true }
            ] },
          { slide: { k: "points", title: "DigiCash: what worked, what did not", start: 0, points: [
              "Worked: private payments, real cryptography",
              "Hard: banks and shops both had to sign up",
              "Deeper: the mint still checked every coin",
              "Fatal: when the company died, so did the money"
            ] },
            at: "right", g: "open",
            say: [
              { s: "So what went wrong?", g: "shrug", p: 0.3 },
              { s: "Not the mathematics. The cryptography was sound, and the privacy was real.", show: 1 },
              { s: "The business was the hard part. Ecash needed banks to issue it and shops to accept it, and too few ever did.", show: 2 },
              { s: "Cards were already everywhere. And most people did not yet see why privacy mattered.", m: "wry" },
              { s: "But look underneath, because there is a deeper flaw. How did ecash stop a double spend?", g: "lean", m: "grave" },
              { s: "The bank kept a list of every serial number already spent, and checked each coin against it.", show: 3 },
              { s: "The keeper never left.", m: "grave", land: true },
              { s: "And when the company died, the money died with it.", show: 4, m: "grave" }
            ] },
          { slide: { k: "figure", title: "Every issuer has a front door", ops: [
              { circle: [80, 30, 10], t: "issuer", c: "blue" },
              { circle: [36, 14, 4], at: 1 }, { line: [40, 15, 71, 27], c: "grey", at: 1 },
              { circle: [36, 46, 4], at: 1 }, { line: [40, 45, 71, 33], c: "grey", at: 1 },
              { circle: [124, 14, 4], at: 1 }, { line: [120, 15, 89, 27], c: "grey", at: 1 },
              { circle: [124, 46, 4], at: 1 }, { line: [120, 45, 89, 33], c: "grey", at: 1 },
              { circle: [14, 30, 4], at: 2 }, { line: [18, 30, 70, 30], c: "grey", at: 2 },
              { circle: [146, 30, 4], at: 2 }, { line: [142, 30, 90, 30], c: "grey", at: 2 },
              { circle: [56, 7, 4], at: 2 }, { line: [59, 10, 73, 23], c: "grey", at: 2 },
              { circle: [104, 7, 4], at: 2 }, { line: [101, 10, 87, 23], c: "grey", at: 2 },
              { line: [68, 18, 92, 42], c: "red", at: 4 },
              { line: [92, 18, 68, 42], c: "red", at: 4 },
              { text: "one office, one server, one off switch", x: 80, y: 58, a: "c", size: 4.5, c: "red", at: 5 }
            ] },
            at: "screen", g: "point",
            say: [
              "The next attempt skipped the clever mathematics and went straight for reach.",
              "E-gold, 1996. You open an account, and your balance is measured in grams of gold sitting in a vault.",
              { s: "It was simple, it had no borders, and it grew. Millions of accounts, moving billions of dollars a year.", g: "wide", m: "excited" },
              { s: "Criminals liked it too. And regulators noticed.", m: "wry" },
              "In 2007 the company and its directors were indicted in the United States. In 2008 they pleaded guilty.",
              { s: "Transfers stopped. Millions of accounts froze exactly where they stood.", m: "grave" }
            ] },
          { at: "centre", g: "open",
            say: [
              "Now, you can argue about whether e-gold deserved it. But look at the shape.",
              { s: "DigiCash died of bankruptcy. E-gold died in a courtroom.", g: "weigh" },
              { s: "They died of the same disease.", m: "grave", p: 0.5 },
              { s: "Each one had a centre. One company, one server, one list.", g: "count", m: "firm" },
              "And anything with a centre can be closed, captured or corrupted, right there at the centre.",
              { s: "So a few people started asking a much wilder question.", g: "up", m: "hushed", p: 0.4 },
              { s: "Could digital money have no issuer at all?", m: "firm", land: true }
            ] }
        ] },

      { id: "proof-of-work-roots", title: "Making Bits Expensive", topics: ["hashcash", "adam back", "proof of work", "b-money", "wei dai", "bit gold", "nick szabo", "rpow"],
        beats: [
          { slide: { k: "section", title: "Making Bits Expensive", sub: "Hashcash, b-money, bit gold and RPOW" },
            at: "lectern", g: "open",
            say: [
              "To get rid of the issuer, you need scarcity from somewhere else.",
              "Think about gold. Gold is scarce because digging it up is hard work.",
              { s: "So could you make a piece of data scarce the same way? By making it expensive to produce?", g: "lean" },
              { s: "The first working answer came from a very odd direction. The war on junk email.", m: "wry" }
            ] },
          { slide: { k: "figure", title: "Hard to make, easy to check", ops: [
              { text: "making it", x: 6, y: 14, size: 4.5 },
              { box: [40, 9, 112, 10], t: "a great many guesses", c: "red", fill: true, at: 3 },
              { text: "checking it", x: 6, y: 32, size: 4.5 },
              { box: [40, 27, 8, 10], c: "green", fill: true, at: 4 },
              { text: "one step", x: 52, y: 32, size: 4.5, c: "green", at: 4 },
              { text: "a solved puzzle = proof that effort was spent", x: 80, y: 51, a: "c", size: 4.5, at: 6 }
            ] },
            at: "screen", g: "point",
            say: [
              "In 1997 a cryptographer named Adam Back proposed something he called hashcash.",
              "The seed was older: a 1992 paper by Cynthia Dwork and Moni Naor, on putting a price on junk mail.",
              "The idea is a puzzle. A puzzle with a strange and very useful shape.",
              "To find a solution, a computer has to make a huge number of blind guesses.",
              { s: "To check a solution, it takes one step.", g: "pinch", m: "firm", land: true },
              "Think of a combination lock. Slow to crack. Instant to confirm, once somebody hands you the number.",
              "So a solved puzzle is proof. Proof that somebody, somewhere, burned real computing effort.",
              { s: "We call that a proof of work. Lecture 7 is all about it.", m: "warm" }
            ] },
          { board: { clear: true, title: "A stamp paid in work", ops: [
              { box: [8, 24, 34, 16], t: "email", at: 1 },
              { box: [44, 24, 18, 16], t: "stamp", c: "amber", at: 1 },
              { text: "1 mail = 1 second", x: 8, y: 54, size: 5, at: 2 },
              { arrow: [64, 32, 108, 32], at: 3 },
              { box: [110, 24, 40, 16], t: "inbox: ok", c: "green", at: 3 },
              { text: "10,000,000 mails =", x: 8, y: 68, size: 5, c: "red", at: 4 },
              { text: "about 4 months", x: 64, y: 68, size: 6, c: "red", at: 5 },
              { text: "no issuer needed", x: 100, y: 82, size: 5, c: "green", at: 7 }
            ] },
            say: [
              "Here is what Back did with it.",
              "Before your computer sends me an email, it has to solve a small puzzle, tied to my address and today's date.",
              "Say that costs you one second of computing. You will never notice.",
              "My computer checks the stamp in an instant, and lets the message in.",
              { s: "Now be a spammer. Ten million messages. Ten million seconds.", m: "wry" },
              { s: "That is about four months of machine time. For one morning's spam.", m: "wry" },
              "And notice: no company sells these stamps, and no office approves them.",
              { s: "The cost is enforced by arithmetic.", g: "pinch", m: "firm", land: true }
            ] },
          { slide: { k: "table", title: "Six attempts, one gap", start: 2, head: ["Attempt", "What it gave us", "What it left open"], rows: [
              ["1982  Chaum: ecash", "private digital coins", "a mint checks each coin"],
              ["1996  e-gold", "borderless accounts", "one company to close"],
              ["1997  Back: hashcash", "data that costs work", "each stamp works once"],
              ["1998  Dai: b-money", "a ledger everyone keeps", "how the copies agree"],
              ["1998  Szabo: bit gold", "proofs chained together", "who keeps the registry"],
              ["2004  Finney: RPOW", "tokens you can pass on", "one trusted server"]
            ], note: "Years of first proposal or launch; bit gold was designed in 1998 and published in 2005." },
            at: "lectern", g: "open",
            say: [
              { s: "Let me start keeping score, because a pattern is about to show itself.", m: "warm" },
              { s: "Chaum gave us private coins, but kept a mint. E-gold gave us reach, but kept a company.", g: "weigh" },
              { s: "Hashcash gives us something neither had. Digital scarcity, with nobody in charge of it.", show: 3, m: "excited" },
              { s: "But a hashcash stamp is not money.", m: "grave", p: 0.3 },
              "It is made for one message, used once, and thrown away. You cannot hand it to anybody else.",
              { s: "Still, a door had opened. And within a year, two people walked through it.", m: "warm" }
            ] },
          { board: { clear: true, title: "b-money: everyone keeps the book", ops: [
              { box: [10, 20, 36, 22], at: 2 },
              { text: "copy A", x: 28, y: 26, a: "c", size: 4, at: 2 },
              { box: [62, 20, 36, 22], at: 2 },
              { text: "copy B", x: 80, y: 26, a: "c", size: 4, at: 2 },
              { box: [114, 20, 36, 22], at: 2 },
              { text: "copy C", x: 132, y: 26, a: "c", size: 4, at: 2 },
              { text: "signed payment", x: 80, y: 60, a: "c", size: 5, at: 3 },
              { arrow: [66, 56, 34, 44], at: 3 },
              { arrow: [80, 55, 80, 44], at: 3 },
              { arrow: [94, 56, 126, 44], at: 3 },
              { text: "X first", x: 28, y: 35, a: "c", size: 4.5, c: "blue", at: 6 },
              { text: "?", x: 80, y: 35, a: "c", size: 7, at: 6 },
              { text: "Y first", x: 132, y: 35, a: "c", size: 4.5, c: "red", at: 6 },
              { text: "which order is the true one?", x: 80, y: 78, a: "c", size: 6, c: "red", at: 6 }
            ] },
            say: [
              "In 1998 a computer scientist named Wei Dai passed around a short proposal. He called it b-money.",
              { s: "His move was radical. Delete the keeper, and hand the ledger to everybody.", m: "excited" },
              "Every participant keeps a full copy of who owns what.",
              "To pay, you broadcast a signed message, and everybody updates their copy.",
              "And new money? It is made by solving costly puzzles. Hashcash, turned into a mint.",
              { s: "Read it today and it sounds eerily familiar. But there is a hole in the middle.", show: 4, m: "grave" },
              "Two conflicting payments race across the network. Some people hear one first, some hear the other. So whose ledger is right?",
              "The design leaned on a broadcast channel that reaches everybody at once and cannot be jammed. No such channel exists.",
              { s: "It was never built.", g: "rest", m: "grave", land: true }
            ] },
          { at: "centre", g: "open",
            say: [
              "That same year, Nick Szabo designed a scheme he called bit gold. He did not publish it until 2005.",
              "His insight was to chain the puzzles together.",
              "Each solved puzzle becomes the starting point for the next. So the solutions form a line, with the order built in.",
              "Each one is timestamped, and its owner goes into a public registry of titles.",
              { s: "Chained proofs of work.", show: 5, g: "point", m: "firm", land: true },
              { s: "Remember that phrase. You will meet it again before this lecture is over.", m: "warm" },
              "But the registry was still a club of servers that had to agree. And the pieces of bit gold were not all worth the same.",
              { s: "Bit gold, too, stayed on paper.", m: "grave" }
            ] },
          { at: "right", g: "open",
            say: [
              { s: "And then, in 2004, somebody actually built something. Hal Finney.", m: "excited" },
              "He called his system RPOW: reusable proofs of work.",
              "You handed its server a hashcash stamp, and it handed you back a signed token of the same value.",
              "That token could be passed on, person to person. Each time it was swapped for a fresh one, so it could not be spent twice.",
              { s: "And to earn your trust, the server ran inside tamper-resistant hardware that could prove which program it was running.", show: 6 },
              { s: "Brilliant. And still one server, in one place.", g: "shrug", m: "wry" }
            ] },
          { at: "lectern", g: "count",
            say: [
              "Now read the right-hand column, top to bottom.",
              { s: "A mint. A company. A single-use stamp.", g: "count" },
              { s: "An unanswered question. A registry. A server.", g: "count" },
              "By 2004 nearly every part had been invented: signatures, costly puzzles, chains of proofs, even a ledger held by everybody.",
              { s: "One thing was missing.", m: "grave", p: 0.5 },
              { s: "A way for strangers to agree on one history, without appointing somebody to decide.", g: "lean", m: "firm" },
              "And that missing piece has a famous story of its own."
            ] },
          { say: ["Let me see whether the shape of that puzzle stuck.", "What makes a proof of work useful?"],
            quiz: {
              q: "What makes a proof of work useful?",
              options: [
                "It is easy to produce and hard to check",
                "Only a licensed company can issue one",
                "It is hard to produce and easy to check",
                "It keeps the solver's name secret"
              ],
              answer: 2,
              right: [{ s: "Yes. Slow to make, instant to check. The combination lock.", m: "warm" }],
              wrong: [
                ["Other way round, I am afraid.", "A proof of work is costly to produce, and anybody can check it in a single step."],
                ["No, and that was the whole point. No company issues the stamps.", "A proof of work is hard to produce, and easy for anybody to check."],
                null,
                ["Secrecy was Chaum's gift, not hashcash's.", "A proof of work is about cost. Hard to produce, easy to check."]
              ] } }
        ] },

      { id: "byzantine-generals", title: "Agreement Among Strangers", topics: ["byzantine generals", "agreement", "consensus", "fake identities", "voting"],
        beats: [
          { slide: { k: "section", title: "Agreement Among Strangers", sub: "The Byzantine Generals, and the trouble with voting" },
            at: "lectern", g: "open",
            say: [
              "1982 again. The same year as Chaum's paper, three computer scientists published a puzzle about an army.",
              "Lamport, Shostak and Pease. They called it the Byzantine Generals Problem.",
              { s: "It has nothing to do with money. And it has everything to do with our missing piece.", m: "wry" }
            ] },
          { slide: { k: "figure", title: "The Byzantine Generals", ops: [
              { box: [66, 22, 28, 16], t: "city", c: "grey", fill: true },
              { circle: [30, 12, 6], t: "A", c: "green" },
              { circle: [130, 12, 6], t: "B", c: "green" },
              { circle: [30, 50, 6], t: "C", c: "green" },
              { circle: [130, 50, 6], t: "D", c: "green" },
              { line: [37, 12, 123, 12], c: "grey", dash: true, at: 1 },
              { line: [30, 19, 30, 43], c: "grey", dash: true, at: 1 },
              { line: [130, 19, 130, 43], c: "grey", dash: true, at: 1 },
              { line: [37, 50, 123, 50], c: "grey", dash: true, at: 1 },
              { circle: [130, 50, 8], c: "red", at: 3 },
              { text: "traitor", x: 142, y: 58, a: "c", size: 3.5, c: "red", at: 3 },
              { arrow: [130, 41, 130, 19], c: "red", at: 4 },
              { text: "attack!", x: 134, y: 30, size: 3.5, c: "red", at: 4 },
              { arrow: [121, 50, 37, 50], c: "red", at: 4 },
              { text: "retreat!", x: 80, y: 46, a: "c", size: 3.5, c: "red", at: 4 },
              { text: "the loyal generals must still agree", x: 76, y: 60, a: "c", size: 4, at: 5 }
            ] },
            at: "screen", g: "point",
            say: [
              "Picture a city under siege. Several generals have it surrounded, each in their own camp.",
              "They can only talk by messenger. And they must all do the same thing: attack together, or retreat together.",
              { s: "A half-hearted attack is the worst outcome of all. That is how armies are lost.", m: "grave" },
              { s: "And some of the generals are traitors.", g: "lean", m: "hushed", land: true },
              "A traitor can tell one neighbour to attack, and the other to retreat.",
              "So the loyal generals need a procedure. One that gets them all to the same decision, whatever the traitors say."
            ] },
          { at: "centre", g: "open",
            say: [
              "And there are solutions. They work. They come with two conditions.",
              { s: "You must know exactly who the generals are. And the traitors must be a small minority.", g: "count" },
              "In the original setting, with plain unsigned messages, fewer than a third of them can be traitors.",
              { s: "But go back to the first condition. You must know who the generals are.", g: "pinch", m: "grave", p: 0.4 }
            ] },
          { slide: { k: "compare", title: "Two very different rooms",
              left: { head: "A known committee", points: ["A fixed list of members", "One member, one vote", "Traitors can be counted", "Majority rule works"] },
              right: { head: "The open internet", points: ["Nobody knows who is there", "New identities cost nothing", "One liar, a thousand voices", "Counting heads fails"] } },
            at: "left", g: "weigh",
            say: [
              "A committee has a membership list. So one member, one vote makes perfect sense.",
              { s: "The internet has no membership list.", m: "grave" },
              "Anybody can join. Anybody can leave. And anybody can turn up wearing a thousand different names.",
              { s: "And here is the cruel part. A fake identity is just data. And data, as we said, is free to copy.", m: "wry" },
              "So let strangers vote on which payment came first, and what does the cheat do?",
              { s: "The cheat prints more voters.", g: "shrug", m: "wry", land: true }
            ] },
          { board: { clear: true, title: "One liar, a thousand masks", ops: [
              { circle: [20, 30, 7], c: "green", at: 1 },
              { circle: [20, 50, 7], c: "green", at: 1 },
              { circle: [20, 70, 7], c: "green", at: 1 },
              { text: "3 honest", x: 32, y: 50, size: 5, c: "green", at: 1 },
              { text: "1 cheat", x: 120, y: 20, a: "c", size: 5, c: "red", at: 2 },
              { circle: [120, 34, 8], c: "red", at: 2 },
              { arrow: [120, 43, 120, 52], c: "red", at: 2 },
              { circle: [96, 58, 4], c: "red", dash: true, at: 2 },
              { circle: [108, 58, 4], c: "red", dash: true, at: 2 },
              { circle: [120, 58, 4], c: "red", dash: true, at: 2 },
              { circle: [132, 58, 4], c: "red", dash: true, at: 2 },
              { circle: [144, 58, 4], c: "red", dash: true, at: 2 },
              { circle: [96, 70, 4], c: "red", dash: true, at: 2 },
              { circle: [108, 70, 4], c: "red", dash: true, at: 2 },
              { circle: [120, 70, 4], c: "red", dash: true, at: 2 },
              { circle: [132, 70, 4], c: "red", dash: true, at: 2 },
              { circle: [144, 70, 4], c: "red", dash: true, at: 2 },
              { text: "... x 1000", x: 120, y: 82, a: "c", size: 5, c: "red", at: 2 },
              { text: "outvoted", x: 72, y: 64, a: "c", size: 5, c: "red", at: 3 },
              { text: "count heads", x: 72, y: 30, a: "c", size: 4.5, at: 4 },
              { line: [57, 30, 87, 30], c: "red", at: 4 },
              { text: "count work", x: 72, y: 41, a: "c", size: 5.5, c: "green", at: 7 }
            ] },
            say: [
              "Let me draw exactly why b-money and bit gold were stuck.",
              "Three honest participants. One vote each.",
              { s: "And one cheat, who conjures up a thousand fake participants. For free.", m: "wry" },
              "A thousand votes beat three. Every single time.",
              { s: "Counting heads cannot work when heads are free.", m: "firm" },
              { s: "So what could you count instead? Something that cannot be faked for free?", g: "lean", p: 0.3 },
              { s: "Hashcash already told us.", m: "hushed" },
              { s: "You count the work.", g: "pinch", m: "firm", land: true }
            ] },
          { at: "centre", g: "count",
            say: [
              "So here is where we stand.",
              "We want a ledger that everybody holds, so that nobody owns it.",
              "We need all those copies to agree on one order of payments.",
              { s: "And we cannot settle arguments by voting, because votes are free.", m: "grave" },
              { s: "That is exactly where things stood in the autumn of 2008.", g: "open", m: "hushed", p: 0.4 }
            ] },
          { say: ["One question, before the story reaches 2008.", "Why can strangers on the internet not settle a dispute by voting?"],
            quiz: {
              q: "Why can strangers on the internet not settle a dispute by voting?",
              options: [
                "Counting the votes would take too long",
                "Fake identities are free, so a cheat can outvote everyone",
                "Votes cannot be sent over a network",
                "Most people online are dishonest"
              ],
              answer: 1,
              right: [{ s: "Exactly. Heads are free to make, so counting heads proves nothing.", m: "warm" }],
              wrong: [
                ["No, counting is quick. That is not the obstacle.", "The obstacle is that identities cost nothing, so one cheat can cast a thousand votes."],
                null,
                ["Votes travel over a network perfectly well.", "The trouble is that fake voters are free, so a cheat simply prints more of them."],
                ["Kinder than that. We do not need most people to be dishonest.", "One cheat is enough, because fake identities are free and can outvote everybody."]
              ] } }
        ] },

      { id: "bitcoin-arrives", title: "2008: Nine Pages", topics: ["financial crisis", "whitepaper", "satoshi nakamoto", "genesis block", "first transaction", "hal finney", "absent founder"],
        beats: [
          { slide: { k: "section", title: "2008: Nine Pages", sub: "A crisis, a paper, a block" },
            at: "lectern", g: "open",
            say: [
              { s: "And what an autumn it was.", m: "grave" },
              "On the fifteenth of September, 2008, Lehman Brothers filed the largest bankruptcy in American history.",
              { s: "Within weeks, governments all over the world were rescuing banks with public money.", g: "wide" },
              { s: "The keepers of the ledger had turned out to be fragile. And when they failed, everybody else paid.", m: "grave" }
            ] },
          { slide: { k: "quote", text: "A purely peer-to-peer version of electronic cash would allow online payments to be sent directly from one party to another without going through a financial institution.", by: "Satoshi Nakamoto, Bitcoin whitepaper, abstract, 2008" },
            at: "centre", g: "open",
            say: [
              "Then, on the thirty-first of October, a message arrived on a mailing list read by cryptographers.",
              { s: "The author signed it Satoshi Nakamoto. To this day, nobody knows who that is.", m: "hushed" },
              "It linked to a nine-page paper. Its title was Bitcoin: A Peer-to-Peer Electronic Cash System.",
              { s: "And this is how it opens.", g: "point", p: 0.3 },
              { s: "A purely peer-to-peer version of electronic cash would allow online payments to be sent directly from one party to another without going through a financial institution.", g: "point", m: "grave" },
              { s: "Hear how every phrase takes aim at something from today.", p: 0.4 },
              { s: "Electronic cash: that is Chaum's dream. Directly from one party to another: no keeper.", g: "count" },
              { s: "And no financial institution. No mint, no company, no server.", g: "count", m: "firm" },
              "In the email itself, Satoshi put it even more plainly. Fully peer-to-peer, with no trusted third party."
            ] },
          { at: "left", g: "open",
            say: [
              { s: "And the reception? Polite. And sceptical.", m: "wry" },
              "The very first reply said, more or less: this will never scale.",
              "After two decades of failed digital cash, can you blame them?",
              { s: "But one man wrote back that it seemed a very promising idea. Hal Finney. The man who built RPOW.", m: "warm" },
              "And when the software came out, he was among the very first people to run it."
            ] },
          { slide: { k: "figure", title: "Old parts, a new machine", ops: [
              { box: [4, 6, 54, 11], t: "signatures", c: "green", at: 1 },
              { box: [4, 24, 54, 11], t: "ledger held by all", c: "blue", at: 2 },
              { box: [4, 42, 54, 11], t: "proof of work", c: "amber", at: 3 },
              { arrow: [59, 12, 96, 25], at: 4 },
              { arrow: [59, 30, 96, 30], at: 4 },
              { arrow: [59, 47, 96, 35], at: 4 },
              { box: [98, 16, 56, 26], t: "one ordered chain", c: "amber", fill: true, at: 4 },
              { box: [98, 47, 14, 9], t: "1", at: 6 },
              { line: [112, 51.5, 119, 51.5], at: 6 },
              { box: [119, 47, 14, 9], t: "2", at: 6 },
              { line: [133, 51.5, 140, 51.5], at: 6 },
              { box: [140, 47, 14, 9], t: "3", at: 6 },
              { text: "most work = the history", x: 126, y: 61, a: "c", size: 3.8, at: 7 }
            ] },
            at: "screen", g: "point",
            say: [
              { s: "Here is what I love about this paper. Almost nothing in it is new.", m: "warm" },
              "Ownership? Digital signatures. Decades old.",
              "A ledger held by everybody? That is Wei Dai. B-money is the paper's very first citation.",
              "Scarcity? Proof of work. The paper cites Adam Back's hashcash by name.",
              { s: "The new part is how they are joined.", m: "hushed", p: 0.4 },
              { s: "Proof of work decides the order of payments.", g: "pinch", m: "firm", land: true },
              "Payments are gathered into blocks. Each block costs work to make, and each is chained to the one before.",
              "Whichever chain has the most work behind it is the history. To rewrite it, you would have to redo the work.",
              { s: "Nobody votes with names. They vote with computation. And computation cannot be faked for free.", m: "firm" }
            ] },
          { slide: { k: "quote", text: "The Times 03/Jan/2009 Chancellor on brink of second bailout for banks", by: "Text embedded in Bitcoin's first block, 3 January 2009" },
            at: "centre", g: "open",
            say: [
              "Two months later, the paper became a running system.",
              "On the third of January, 2009, Satoshi created the first block of the chain. We call it the genesis block.",
              { s: "And inside it, where a block has room for a little free text, is this line.", g: "point", m: "hushed" },
              { s: "The Times, third of January, 2009. Chancellor on brink of second bailout for banks.", m: "grave", p: 0.3 },
              "A headline from that morning's Times of London, about Britain's finance minister and one more bank rescue.",
              "It does two jobs at once.",
              "It proves the block was not made before that day. Nobody can quote tomorrow's newspaper.",
              { s: "And it tells you, without one word of commentary, what this was built in answer to.", m: "grave" }
            ] },
          { slide: { k: "number", value: "Block 170", label: "12 January 2009: Satoshi sends Hal Finney 10 bitcoins", note: "The first payment from one person to another on the network" },
            at: "right", g: "open",
            say: [
              "Nine days later came the first payment between two people.",
              "Satoshi sent 10 bitcoins to Hal Finney, as a test. It is recorded in block 170.",
              "No bank opened that morning to process it. No server stood in the middle.",
              "Two computers, running the same open rules, agreed that coins had moved.",
              { s: "It had taken twenty-six years.", m: "hushed", p: 0.4 },
              { s: "Digital cash had changed hands, with no keeper.", g: "up", m: "firm", land: true }
            ] },
          { slide: { k: "figure", title: "From a crisis to an absent founder", ops: [
              { line: [6, 30, 154, 30], c: "grey" },
              { circle: [14, 30, 1.5], fill: true }, { line: [14, 25, 14, 30] },
              { text: "15 Sep 2008", x: 14, y: 16, a: "c", size: 3.5, c: "grey" },
              { text: "Lehman fails", x: 14, y: 21.5, a: "c", size: 3.8 },
              { circle: [44, 30, 1.5], fill: true }, { line: [44, 30, 44, 35] },
              { text: "31 Oct 2008", x: 44, y: 39, a: "c", size: 3.5, c: "grey" },
              { text: "whitepaper", x: 44, y: 44.5, a: "c", size: 3.8 },
              { circle: [74, 30, 1.5], fill: true }, { line: [74, 25, 74, 30] },
              { text: "3 Jan 2009", x: 74, y: 16, a: "c", size: 3.5, c: "grey" },
              { text: "genesis block", x: 74, y: 21.5, a: "c", size: 3.8 },
              { circle: [98, 30, 1.5], fill: true }, { line: [98, 30, 98, 35] },
              { text: "12 Jan 2009", x: 98, y: 39, a: "c", size: 3.5, c: "grey" },
              { text: "first payment", x: 98, y: 44.5, a: "c", size: 3.8 },
              { circle: [124, 30, 1.5], c: "red", fill: true, at: 3 }, { line: [124, 25, 124, 30], c: "red", at: 3 },
              { text: "Dec 2010", x: 124, y: 16, a: "c", size: 3.5, c: "grey", at: 3 },
              { text: "last public post", x: 124, y: 21.5, a: "c", size: 3.8, c: "red", at: 3 },
              { circle: [146, 30, 1.5], c: "red", fill: true, at: 4 }, { line: [146, 30, 146, 35], c: "red", at: 4 },
              { text: "Apr 2011", x: 146, y: 39, a: "c", size: 3.5, c: "grey", at: 4 },
              { text: "moves on", x: 146, y: 44.5, a: "c", size: 3.8, c: "red", at: 4 },
              { text: "the rules stayed; the author left", x: 80, y: 57, a: "c", size: 4.5, c: "amber", at: 5 }
            ] },
            at: "screen", g: "point",
            say: [
              "Here is the whole arc on one line.",
              "For about two years Satoshi wrote code, answered questions, and argued about design in public.",
              { s: "Then the messages thinned out.", m: "hushed" },
              "The last public forum post is dated December 2010.",
              "In April 2011 came a short email to another developer. Satoshi had moved on to other things.",
              { s: "Since then, silence.", g: "rest", m: "hushed", land: true }
            ] },
          { slide: { k: "points", title: "Why an absent founder matters", start: 0, points: [
              "No one to pressure, bribe or arrest",
              "No one whose opinion outranks the rules",
              "No company to go bankrupt",
              "What remains: open code, and everyone who runs it"
            ] },
            at: "centre", g: "open",
            say: [
              { s: "I think this may be the most underrated event in the whole story.", m: "warm" },
              { s: "Think back to DigiCash and e-gold. Each one had somebody you could pressure, sue or shut down.", show: 1, g: "count" },
              { s: "And a founder who stays is a kind of keeper too. People would simply turn and ask what the rules are supposed to mean.", show: 2 },
              { s: "Here there is no head office. No chief executive. Nobody with a casting vote.", show: 3, m: "firm" },
              { s: "What is left is open code, and thousands of people who choose to run it.", show: 4, g: "wide", m: "warm" },
              { s: "It was given away so completely that something remarkable is true.", p: 0.3 },
              { s: "The invention no longer needs its inventor.", m: "grave", land: true }
            ] },
          { say: ["Last question, and it is the heart of today.", "What was the new idea in the Bitcoin paper?"],
            quiz: {
              q: "What was the new idea in the Bitcoin paper?",
              options: [
                "Digital signatures to prove who owns a coin",
                "A ledger that everyone keeps a copy of",
                "Puzzles that make data costly to produce",
                "Using proof of work to put payments in order"
              ],
              answer: 3,
              right: [{ s: "That is it. The parts were old. The way they were joined was new.", m: "warm" }],
              wrong: [
                ["Good guess, but signatures were decades old by 2008.", "The new idea was using proof of work to decide the order of payments."],
                ["Close. But the shared ledger was Wei Dai's idea, back in 1998.", "What was new was using proof of work to decide the order of payments."],
                ["Not quite. Costly puzzles came from hashcash, in 1997.", "The new step was using that work to decide the order of payments."],
                null
              ] } }
        ] },

      { id: "shape-of-solution", title: "The Shape of the Answer", topics: ["public ledger", "signatures", "proof of work", "nodes", "course map", "hash functions", "verify"],
        beats: [
          { slide: { k: "section", title: "The Shape of the Answer", sub: "Four ideas, and the 13 lectures that open them" },
            at: "lectern", g: "open",
            say: [
              { s: "So that is the history. Now I owe you a map.", m: "warm" },
              { s: "From 10,000 metres up, Bitcoin is four ideas working together.", g: "wide" },
              { s: "I am going to draw them once, fast. Then I will spend 13 lectures earning the drawing.", m: "wry" }
            ] },
          { board: { clear: true, title: "Four ideas, one system", ops: [
              { box: [8, 18, 64, 20], t: "1 public ledger", c: "blue", at: 0 },
              { text: "anyone can check", x: 40, y: 43, a: "c", size: 4, c: "grey", at: 1 },
              { box: [88, 18, 64, 20], t: "2 signatures", c: "green", at: 3 },
              { text: "keys, not accounts", x: 120, y: 43, a: "c", size: 4, c: "grey", at: 4 }
            ] },
            say: [
              { s: "Idea one. A public ledger.", m: "firm" },
              "Every payment ever made is on it. Anybody may hold a copy, and check every line.",
              "There is no single copy to lose, and no single keeper to ask.",
              { s: "Idea two. Ownership by signature.", m: "firm" },
              "A coin is yours if you hold the secret key that can sign for it. For no other reason.",
              { s: "Nobody opens an account for you. So nobody can refuse to.", m: "wry" }
            ] },
          { board: { ops: [
              { box: [8, 56, 64, 20], t: "3 proof of work", c: "amber", at: 0 },
              { text: "sets the order", x: 40, y: 81, a: "c", size: 4, c: "grey", at: 2 },
              { box: [88, 56, 64, 20], t: "4 nodes", c: "red", at: 3 },
              { text: "everyone enforces", x: 120, y: 81, a: "c", size: 4, c: "grey", at: 4 },
              { text: "no keeper", x: 80, y: 49, a: "c", size: 5, at: 7 }
            ] },
            say: [
              { s: "Idea three. Ordering by proof of work.", m: "firm" },
              "Blocks of payments cost real energy to make, and each is chained to the one before.",
              "The chain with the most work behind it is the one true order. And that is what stops the double spend.",
              { s: "Idea four. Rules enforced by everybody.", m: "firm" },
              "Every computer that runs the software checks every block against the same rules. We call each one a node.",
              "A block that breaks the rules is simply ignored. It does not matter who made it, or how much work it cost.",
              { s: "Ledger, signatures, work, nodes.", g: "count" },
              { s: "Four ideas, and no keeper.", m: "firm", land: true }
            ] },
          { slide: { k: "table", title: "The road ahead: lectures 2 to 8", start: 0, head: ["Lecture", "What it opens up"], rows: [
              ["2  Fingerprints: Hash Functions", "tamper-evident data"],
              ["3  Keys and Signatures", "who is allowed to spend"],
              ["4  Coins Are Outputs", "what the ledger really records"],
              ["5  Programmable Locks", "conditions for spending a coin"],
              ["6  Blocks and the Chain", "pages linked in a fixed order"],
              ["7  Mining: Proof of Work", "why history is costly to rewrite"],
              ["8  Agreement Without a Leader", "how strangers share one history"]
            ] },
            at: "lectern", g: "open",
            say: [
              "And here is where each idea gets opened up.",
              { s: "Tools first. Lecture 2 is Fingerprints: Hash Functions. Lecture 3 is Keys and Signatures.", show: 2 },
              { s: "Then the ledger itself. Lecture 4, Coins Are Outputs. Lecture 5, Programmable Locks.", show: 4 },
              { s: "Lecture 6, Blocks and the Chain, shows how the pages are bound together.", show: 5 },
              { s: "Lecture 7, Mining: Proof of Work. That is hashcash, all grown up.", show: 6, m: "wry" },
              { s: "And lecture 8, Agreement Without a Leader, finally answers the generals.", show: 7, m: "warm" }
            ] },
          { slide: { k: "table", title: "The road ahead: lectures 9 to 14", start: 0, head: ["Lecture", "What it opens up"], rows: [
              ["9  The Peer-to-Peer Network", "how payments and blocks travel"],
              ["10  Fees and Block Space", "who gets into a block, and when"],
              ["11  Wallets and Your Own Keys", "holding coins without a keeper"],
              ["12  Privacy and Its Limits", "what a public ledger reveals"],
              ["13  How Bitcoin Changes", "changing rules with no ruler"],
              ["14  Scaling in Layers: Lightning", "fast payments above the chain"]
            ] },
            at: "centre", g: "open",
            say: [
              { s: "After that, we go out into the world. Lecture 9 is The Peer-to-Peer Network.", show: 1 },
              { s: "Lecture 10, Fees and Block Space: what happens when room on the ledger runs short.", show: 2 },
              { s: "Lecture 11 is Wallets and Holding Your Own Keys. That is where you become your own keeper.", show: 3, m: "warm" },
              { s: "Lecture 12, Privacy and Its Limits, is an honest look at what a public ledger gives away.", show: 4 },
              { s: "Lecture 13, How Bitcoin Changes: how do rules evolve when nobody is in charge?", show: 5 },
              { s: "And lecture 14, Scaling in Layers: Lightning, brings us back to small, instant payments. Back to that coin at the market stall.", show: 6, m: "warm" }
            ] },
          { slide: { k: "live", title: "Still running: the latest blocks", panel: "blocks", note: "Live from the Bitcoin network while the hall is open" },
            at: "screen", g: "point",
            say: [
              { s: "One last thing. Because none of this is a museum piece.", m: "warm" },
              { s: "These are the most recent blocks on the chain. As they stand, right now.", m: "excited" },
              "A new one arrives about every ten minutes. And each one points back to the block before it.",
              "Follow those links back far enough, and you arrive at the third of January, 2009. And a newspaper headline.",
              { s: "By the end of this course, you will be able to check every bit of that yourself, on your own machine.", m: "firm" },
              { s: "Which brings me back to rule two.", m: "warm", p: 0.4 },
              { s: "Do not trust, verify.", g: "pinch", m: "firm", land: true }
            ] },
          { slide: { k: "figure", title: "Next time: a fingerprint for data", ops: [
              { box: [4, 10, 46, 12], t: "pay Ada 5 coins", at: 1 },
              { arrow: [52, 16, 66, 16], at: 1 },
              { box: [68, 10, 24, 12], t: "hash", c: "blue", fill: true, at: 1 },
              { arrow: [94, 16, 108, 16], at: 1 },
              { text: "9f2c...e1a7", x: 112, y: 16, size: 5, c: "green", mono: true, at: 1 },
              { box: [4, 30, 46, 12], t: "pay Ada 6 coins", at: 2 },
              { arrow: [52, 36, 66, 36], at: 2 },
              { box: [68, 30, 24, 12], t: "hash", c: "blue", fill: true, at: 2 },
              { arrow: [94, 36, 108, 36], at: 2 },
              { text: "41b8...07d3", x: 112, y: 36, size: 5, c: "red", mono: true, at: 2 },
              { arrow: [108, 50, 52, 50], c: "red", dash: true, at: 3 },
              { text: "no way back", x: 80, y: 55, a: "c", size: 4, c: "red", at: 3 }
            ], note: "The fingerprints shown are made up for the picture; real ones come next time." },
            at: "lectern", g: "open",
            say: [
              "Next time, we pick up the first tool. And it is a strange one.",
              "Imagine a machine. You feed it any data at all, a word or a whole library, and it hands back a short fingerprint. Always the same size.",
              "Change one letter going in, and the fingerprint coming out changes completely.",
              "And there is no practical way to run it backwards, from the fingerprint to the data.",
              "That machine is called a hash function.",
              "It is how blocks are chained. How work is proven. How a ledger held by strangers shows any tampering.",
              { s: "Your homework: read the whitepaper. It is nine pages, and you now know where every idea in it came from.", m: "warm" },
              { s: "Thank you. I will see you in lecture 2.", g: "up", m: "warm" }
            ] }
        ] }
    ]
  });
})();
