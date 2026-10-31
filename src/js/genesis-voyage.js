// The Genesis Voyage: a boat ride through the ideas that came before Bitcoin. This module is the ride's pure half,
// with no DOM, renderer or audio, so Node can check it: the journey's rooms, the exhibits' words and sources, the boat's
// path and stations (`createRide`), the toy fingerprint and the stamp desk's timeline (`createStampDemo`).
// scene-genesis.js draws and drives them.
//
// Every claim an exhibit makes is backed by `sources` (see docs/genesis-voyage/sources.md for the register). The
// guides are invented Ooga characters; nothing here quotes or imagines the words of real people.
(() => {
  "use strict";
  const BL = window.BL = window.BL || {};

  // The seven rooms in the order the boat will visit them. `built` marks those that exist so far.
  const ROOMS = [
    { id: "keys", title: "Networks and Keys", built: false },
    { id: "private-money", title: "Private Digital Money", built: false },
    { id: "workshop", title: "Cypherpunk Workshop", built: false },
    { id: "fingerprints", title: "Fingerprints and Time", built: true },
    { id: "work", title: "Work and Scarcity", built: false },
    { id: "together", title: "The Pieces Come Together", built: false },
    { id: "genesis", title: "Genesis Epilogue", built: false, optional: true }
  ];

  // Source keys used by exhibits. `kind` is how the source connects to Bitcoin: "whitepaper citation" (in the
  // whitepaper's reference list), "documented influence" or "context".
  const SOURCES = {
    whitepaper: { label: "Satoshi Nakamoto, Bitcoin: A Peer-to-Peer Electronic Cash System (2008), section 3 and references 2 to 5",
      href: "https://bitcoin.org/bitcoin.pdf", kind: "the paper itself" },
    haber1991: { label: "Haber and Stornetta, How to Time-Stamp a Digital Document, Journal of Cryptology 3(2), 1991",
      href: "https://doi.org/10.1007/BF00196791", kind: "whitepaper citation [3]" },
    bayer1993: { label: "Bayer, Haber and Stornetta, Improving the Efficiency and Reliability of Digital Time-Stamping, Sequences II, 1993",
      href: "https://doi.org/10.1007/978-1-4613-9323-8_24", kind: "whitepaper citation [4]" },
    haber1997: { label: "Haber and Stornetta, Secure Names for Bit-Strings, ACM CCS 1997",
      href: "https://doi.org/10.1145/266420.266430", kind: "whitepaper citation [5]" },
    massias1999: { label: "Massias, Serret-Avila and Quisquater, Design of a Secure Timestamping Service with Minimal Trust Requirements, 1999",
      href: "https://bitcoin.org/bitcoin.pdf", kind: "whitepaper citation [2]" },
    merkle1980: { label: "Ralph Merkle, Protocols for Public Key Cryptosystems, IEEE Symposium on Security and Privacy, April 1980",
      href: "https://doi.org/10.1109/SP.1980.10006", kind: "whitepaper citation [7]" }
  };

  // The stamp desk's pages. A page's fingerprint takes in the one before it, as a linked time-stamp does.
  const PAGES = ["Day 1: Ooga finds three bananas", "Day 2: Ooga trades one banana for a shell", "Day 3: Ooga plants a banana tree",
    "Day 4: Ooga lends a shell to a friend", "Day 5: The friend pays the shell back"];
  const TAMPERED = "Day 2: Ooga trades one banana for TEN shells";
  const TAMPER_AT = 1;

  // A toy fingerprint (32-bit FNV-1a, as eight hex digits), so the desk can show real changes on real text. A real
  // time-stamp uses a cryptographic hash such as SHA-256; this one is for the show only and the panel says so.
  const fingerprint = (text) => {
    let h = 0x811c9dc5;
    for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
    return h.toString(16).padStart(8, "0");
  };
  // Each stamp's fingerprint of its page and the stamp before it; with `tamper`, page TAMPER_AT reads TAMPERED.
  const chain = (tamper = false) => {
    const out = [];
    let previous = "";
    for (let i = 0; i < PAGES.length; i++) {
      previous = fingerprint(previous + "|" + (tamper && i === TAMPER_AT ? TAMPERED : PAGES[i]));
      out.push(previous);
    }
    return out;
  };

  // The stamp desk's show, as phases on a clock: each page is fed, stamped and linked; then the newest fingerprint
  // is published, a page is changed and every link after it breaks, and the page is put back. `update` allocates
  // nothing; the scene reads `phase`, `t` (0..1 through the phase), `tiles` and `broken`.
  const STAMP_STEPS = [["feed", 1.3], ["stamp", 0.7], ["link", 1.1]];
  const FINALE = [["publish", 2.6], ["tamper", 3.4], ["restore", 2.2], ["rest", 1.4]];
  const createStampDemo = () => {
    const d = { phase: "feed", t: 0, page: 0, tiles: 0, broken: false, stamps: 0, cycles: 0, elapsed: 0, step: 0, finale: -1 };
    const duration = () => d.finale < 0 ? STAMP_STEPS[d.step][1] : FINALE[d.finale][1];
    let clock = 0;
    d.reset = () => {
      d.phase = "feed"; d.t = 0; d.page = 0; d.tiles = 0; d.broken = false; d.step = 0; d.finale = -1; d.elapsed = 0; clock = 0;
    };
    d.update = (dt) => {
      d.elapsed += dt;
      clock += dt;
      let len = duration();
      while (clock >= len) {
        clock -= len;
        if (d.finale < 0) {
          if (STAMP_STEPS[d.step][0] === "stamp") d.stamps++;
          if (STAMP_STEPS[d.step][0] === "link") d.tiles = d.page + 1;
          d.step++;
          if (d.step === STAMP_STEPS.length) { d.step = 0; d.page++; if (d.page === PAGES.length) d.finale = 0; }
        } else {
          d.finale++;
          if (d.finale === FINALE.length) { d.cycles++; d.page = 0; d.tiles = 0; d.step = 0; d.finale = -1; }
        }
        d.phase = d.finale < 0 ? STAMP_STEPS[d.step][0] : FINALE[d.finale][0];
        d.broken = d.phase === "tamper";
        len = duration();
      }
      d.t = clock / len;
    };
    return d;
  };
  const STAMP_CYCLE = PAGES.length * STAMP_STEPS.reduce((s, p) => s + p[1], 0) + FINALE.reduce((s, p) => s + p[1], 0);

  // The boat's course as a smooth curve through `points` ([x, z] pairs on the water), sampled once at build into
  // even steps. Stations are where the boat stops: `at` is the index of the point it stops on.
  const SAMPLES_PER_SEGMENT = 12;
  const createCourse = (points) => {
    const n = points.length, xs = [], zs = [];
    const at = (i) => points[Math.max(0, Math.min(n - 1, i))];
    for (let i = 0; i < n - 1; i++) {
      const p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2);
      for (let k = 0; k < SAMPLES_PER_SEGMENT; k++) {
        const t = k / SAMPLES_PER_SEGMENT, t2 = t * t, t3 = t2 * t;
        // Uniform Catmull-Rom: passes through every point, so stations sit exactly on theirs.
        const f = (a, b, c, e) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - e) * t2 + (-a + 3 * b - 3 * c + e) * t3);
        xs.push(f(p0[0], p1[0], p2[0], p3[0]));
        zs.push(f(p0[1], p1[1], p2[1], p3[1]));
      }
    }
    xs.push(points[n - 1][0]); zs.push(points[n - 1][1]);
    const count = xs.length, x = Float64Array.from(xs), z = Float64Array.from(zs), s = new Float64Array(count);
    for (let i = 1; i < count; i++) s[i] = s[i - 1] + Math.hypot(x[i] - x[i - 1], z[i] - z[i - 1]);
    let hint = 0;
    // Position and heading at distance `d` along the course, written into `out` ({ x, z, heading }).
    const sample = (d, out) => {
      d = Math.max(0, Math.min(s[count - 1], d));
      if (s[hint] > d) hint = 0;
      while (hint < count - 2 && s[hint + 1] < d) hint++;
      const i = hint, span = s[i + 1] - s[i] || 1, f = (d - s[i]) / span;
      out.x = x[i] + (x[i + 1] - x[i]) * f;
      out.z = z[i] + (z[i + 1] - z[i]) * f;
      out.heading = Math.atan2(x[i + 1] - x[i], z[i + 1] - z[i]);
      return out;
    };
    return { length: s[count - 1], distanceOf: (pointIndex) => s[Math.min(count - 1, pointIndex * SAMPLES_PER_SEGMENT)], sample, count };
  };

  // The ride: boarding at the dock, sailing, waiting at each station, and docking at the end. Pausing holds
  // everything; skipping leaves a station at once or sails straight on to the next one.
  // States: "boarding", "sailing", "station", "docked".
  const createRide = ({ course, stations, speed = 1.6, ease = 2.5 }) => {
    const stops = stations.map((st) => ({ ...st, d: course.distanceOf(st.at) }));
    const r = { state: "boarding", d: 0, v: 0, paused: false, station: -1, next: 0, waited: 0, stops, length: course.length, legs: 0 };
    r.start = () => {
      if (r.state === "boarding") { r.state = "sailing"; r.paused = false; return true; }
      if (r.state === "docked") { r.state = "sailing"; r.d = 0; r.v = 0; r.next = 0; r.station = -1; r.paused = false; r.legs++; return true; }
      return false;
    };
    r.pause = (on = !r.paused) => { r.paused = !!on && r.state !== "boarding" && r.state !== "docked"; return r.paused; };
    r.skip = () => {
      if (r.state === "station") { r.state = "sailing"; r.waited = 0; return true; }
      if (r.state !== "sailing") return false;
      const target = r.next < stops.length ? stops[r.next].d : course.length;
      r.d = Math.max(r.d, target - 0.01);
      return true;
    };
    // Sail straight to stop `i` (the timeline wall's plaques): from the dock, mid-course or another stop.
    r.jump = (i) => {
      if (i < 0 || i >= stops.length) return false;
      if (r.state === "boarding" || r.state === "docked") r.start();
      r.state = "sailing"; r.paused = false; r.waited = 0; r.v = 0;
      r.next = i; r.d = stops[i].d - 0.01;
      return true;
    };
    r.update = (dt) => {
      if (r.paused || r.state === "boarding" || r.state === "docked") return;
      if (r.state === "station") {
        r.waited += dt;
        if (r.waited >= stops[r.station].dwell) { r.state = "sailing"; r.waited = 0; }
        return;
      }
      const target = r.next < stops.length ? stops[r.next].d : course.length, left = target - r.d;
      // Slow into a stop: the speed eases down over the last `ease` metres and never below a crawl.
      const cap = left < ease ? Math.max(0.25, speed * left / ease) : speed;
      r.v = Math.min(cap, r.v + dt * 1.2);
      r.d = Math.min(target, r.d + r.v * dt);
      if (r.d < target - 1e-6) return;
      r.v = 0;
      if (r.next < stops.length) { r.station = r.next; r.next++; r.state = "station"; r.waited = 0; }
      else r.state = "docked";
    };
    return r;
  };

  // The exhibit in room 4, as the info panel pages: a short page for every visitor, a deeper one, what was left
  // unsolved and the sources. Each page's text is wrapped and painted by the scene.
  const FINGERPRINTS = {
    id: "fingerprints",
    room: "Fingerprints and Time",
    guide: "Tock, the archivist Ooga",
    pages: [
      { caption: "In short", title: "A fingerprint for every page",
        text: ["A hash function turns any document into a short code: its fingerprint. Change a single letter and the fingerprint changes completely.",
          "Stuart Haber and W. Scott Stornetta showed how to stamp documents with the time by linking these fingerprints: each new stamp includes the fingerprint of the stamp before it. They presented the idea in 1990 and published it in 1991.",
          "To change an old page quietly, you would have to redo every stamp after it, and everyone who kept a later stamp would notice."] },
      { caption: "The deeper story", title: "Linked time-stamps",
        text: ["Haber and Stornetta's paper, How to Time-Stamp a Digital Document (Journal of Cryptology, 1991), proposed a stamping service that links each certificate to the ones before it, so the service itself cannot backdate a document without being caught.",
          "Bayer, Haber and Stornetta (1993) improved this by gathering many documents into a Merkle tree, so one stamp covers a whole batch. Merkle's tree-hashing idea appears in his 1980 paper Protocols for Public Key Cryptosystems.",
          "The Bitcoin whitepaper (2008) cites these papers in its section on a timestamp server: hash a block of items and widely publish the hash, each hash including the previous one, forming a chain."] },
      { caption: "Still unsolved", title: "Who keeps the clock?",
        text: ["A linked time-stamp shows that the record was not changed after it was published. It still needs a stamping service, or a newspaper, that everyone trusts to publish one chain and not two.",
          "The whitepaper's answer is to replace the trusted stamper with proof-of-work on a peer-to-peer network: the chain with the most work behind it is the one everybody follows. That is the next room on the ride."] },
      { caption: "Sources", title: "Where this comes from",
        text: ["Haber and Stornetta 1991 [3], Bayer, Haber and Stornetta 1993 [4], Haber and Stornetta 1997 [5] and Massias, Serret-Avila and Quisquater 1999 [2] are all in the Bitcoin whitepaper's reference list, as is Merkle 1980 [7].",
          "The fingerprints at the desk use a small toy hash (FNV-1a) so the show can change them live. Real time-stamps use cryptographic hashes such as SHA-256, which Bitcoin uses.",
          "Tock the archivist is an invented Ooga guide. The links below open the papers."] }
    ],
    sources: ["haber1991", "bayer1993", "haber1997", "massias1999", "merkle1980", "whitepaper"]
  };

  // What the captions say, keyed by what is happening. Captions are the ride's narration; Voice reads them aloud.
  const CAPTIONS = {
    boarding: "Welcome aboard the Genesis Voyage. Drive with W A S D or the arrows (Shift for speed) down the lane of eras, or press Tour (Enter) to ride along.",
    drive: "You have the wheel. W A S D or the arrows steer, Shift goes faster, Enter starts the Tour again.",
    sailing: "Tour: the boat visits every era's island in order and waits at each dock. Press Drive (Enter) to take the wheel.",
    arrive: "Tock the archivist Ooga stamps every page with a fingerprint. Press Info (I) to read more, or Jump out (J) to walk the island.",
    feed: "A page goes into the fingerprint machine.",
    stamp: "Out comes a short code: the page's fingerprint. Change one letter and the code changes completely.",
    link: "Each new stamp also takes in the fingerprint before it, so the stamps form a chain.",
    publish: "The newest fingerprint goes into the newspaper, where everyone can see it.",
    tamper: "Someone changes page 2. Its fingerprint no longer matches, and every link after it breaks.",
    restore: "Put the page back and the whole chain checks out again. The past is hard to change quietly.",
    rest: "Tock starts a fresh chain.",
    unbuilt: "That era's island has no exhibits yet. Fingerprints and Time is open now.",
    leaving: "On to the next era.",
    docked: "That is the end of the lane so far. Press Drive (Enter) to take the wheel, or Escape for the island.",
    paused: "Paused. Press Pause or Space to carry on."
  };


  BL.genesisVoyage = { ROOMS, SOURCES, PAGES, TAMPERED, TAMPER_AT, FINGERPRINTS, CAPTIONS, STAMP_CYCLE, fingerprint, chain, createStampDemo, createCourse, createRide };
})();
