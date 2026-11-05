// Era 5's cave in the Genesis Voyage, Peers and Reusable Work (2000–2007): a workshop of competing ideas, not a
// conveyor belt toward Bitcoin. Built only through the kit (genesis-exhibits.js); facts from
// docs/genesis-voyage/eras/era-5-peers-and-reusable-work.md (branch gv/research, READY entries only) and the build
// brief's period-gear records. HOLD material (BitTorrent's release record) stays out.
//
// Left bank, the idea benches: each has a paper lectern (In short, deeper story, what remained unsolved, sources) and
// a museum toy beside it. Chord, August 2001 conference paper (context: peer lookup is not monetary consensus);
// Hashcash, the 1 August 2002 paper (whitepaper citation [6]; the 1997 announcement is Era 4's); RPOW, 15 August 2004
// announcement (context) with its sealed-server cabinet; bit gold, December 2005 qualified (documented influence, by
// Satoshi's retrospective post of 20 July 2010).
// Right bank, the peer bench and period gear (all context): BitTorrent's 22 May 2003 paper with a piece-mosaic toy;
// GPS sharpening (1 May 2000 announcement, 2 May 2000 change); a volunteer encyclopedia (2001); a pocket hard-disk
// music player (announced 23 October 2001, available 10 November 2001), silent: the cave's shared music stays the
// only sound.
// Two lofts high on the back walls (fly up with the jetpack) hold a trust-boundary comparison and a routing puzzle;
// their essentials are repeated in the overview's pages, so nothing needed is only up there.
//
// Plots: nothing in the gateway (u < 10), the docks, the lamp squares, the stream or 1.5 m beside it; nothing above
// 8 m; low models nearest the water so the overview board and the far wall stay in view from the banks. Every toy is
// local, bounded and resettable, keeps its state for the visit and is rebuilt fresh on the next; commands do their
// (bounded) work at once, so there is no background work. `update` allocates nothing, holds decoration still in Calm,
// and holds the cabinet's blinking while a panel is open.
(() => {
  "use strict";
  const BL = window.BL;
  // `verified: true`: the gv/research dossier records reading the page (31 October 2026). The GPS and encyclopedia
  // entries follow the consolidated research supplied to the integrator (genesis-research-consolidated v1.1, its
  // timeline events tl-5-gps and Wikipedia's January 2001): `verified` follows that record's own note (true where it
  // records the page as read, false for its secondary research-agent record). The integrator did not fetch them.
  const sources = {
    "E5-CHORD": { label: "Stoica, Morris, Karger, Kaashoek and Balakrishnan: Chord (SIGCOMM, 27-31 August 2001)",
      href: "https://pdos.csail.mit.edu/papers/chord:sigcomm01/chord_sigcomm.pdf", kind: "context", verified: true },
    "E5-BT": { label: "Bram Cohen: Incentives Build Robustness in BitTorrent (paper dated 22 May 2003)",
      href: "https://www.bittorrent.org/bittorrentecon.pdf", kind: "context", verified: true },
    "E5-HC": { label: "Adam Back: Hashcash - A Denial of Service Counter-Measure (1 August 2002), whitepaper [6]",
      href: "https://cdn.nakamotoinstitute.org/docs/hashcash.pdf", kind: "whitepaper citation [6]", verified: true },
    "E5-RPOW": { label: "Hal Finney: RPOW - Reusable Proofs of Work (announcement, 15 August 2004), SNI reprint",
      href: "https://nakamotoinstitute.org/library/rpow/", kind: "context", verified: true },
    "E5-BG": { label: "Nick Szabo: Bit Gold (SNI reprint, dated 29 December 2005)",
      href: "https://nakamotoinstitute.org/library/bit-gold/", kind: "documented influence", verified: true },
    "E5-BG-AUTHOR": { label: "Nick Szabo's current page for Bit Gold (displays 27 December 2008 at a 2005 address)",
      href: "https://unenumerated.blogspot.com/2005/12/bit-gold.html", kind: "documented influence", verified: true },
    "E5-ATTR": { label: "Satoshi Nakamoto, forum post of 20 July 2010 (a retrospective attribution)",
      href: "https://satoshi.nakamotoinstitute.org/posts/bitcointalk/249/", kind: "documented influence", verified: true },
    "E5-GEAR": { label: "Manufacturer's announcement of a pocket hard-disk music player, 23 October 2001",
      href: "https://www.apple.com/newsroom/2001/10/23Apple-Presents-iPod/", kind: "context", verified: true },
    "E5-GPS": { label: "GPS.gov: Selective Availability (switched off just after midnight EDT on 2 May 2000)",
      href: "https://gps.gov/selective-availability", kind: "context", verified: true },
    "E5-GPS-WH": { label: "White House statement of 1 May 2000 announcing the decision (archived)",
      href: "https://clintonwhitehouse5.archives.gov/WH/New/html/20000501_2.html", kind: "context", verified: true },
    "E5-WIKI": { label: "Wikimedia Meta: a community draft of Wikipedia's first press release (January 2002; a draft, not the final release)",
      href: "https://meta.wikimedia.org/wiki/Wikipedia%27s_first_press_release--draft_for_comment", kind: "context", verified: true },
    "E5-WIKI-CA": { label: "Wikimedia Canada: Wikipedia turns 25 (a secondary source)",
      href: "https://www.wikimedia.ca/en/wikipedia-turns-25/", kind: "context", verified: false },
    // The research dossier itself: it registers no display specification, so the CRT and flat-panel comparison is
    // schematic (exhibit notes: docs/genesis-voyage/exhibits/era-5.md, its HOLD list).
    "E5-DOSSIER": { label: "Era 5 research dossier (gv/research): no display dimensions verified, so the comparison is schematic",
      href: "https://github.com/Bitcoin-Bill/oogaboogaland/blob/gv/research/docs/genesis-voyage/eras/era-5-peers-and-reusable-work.md", kind: "context", verified: true }
  };
  const reply = (...lines) => ({ lines });
  // An exhibit's finer parts as one merged mesh at (x, y, z), its parts in its own frame (y from the floor). The kit's
  // dry runs (the layout's and the checks') have no models, so they get a bare node at the same spot: every run counts
  // the same pieces, and the mesh moves with its exhibit's cluster.
  const detail = (kit, x, y, z, make) => {
    const nd = kit.createNode(kit.M.merge ? { geometry: kit.M.merge(...make(kit.M)) } : {});
    nd.position.x = x; nd.position.y = y; nd.position.z = z;
    return kit.place(nd);
  };
  const B = (M, w, h, d, color, x, y, z, emissive = 0) => M.box({ w, h, d, color, emissive, offset: { x, y, z } });
  // A flat disc facing +z (a wheel, a dial), r across and t thick, centred at (x, y, z).
  const disc = (M, r, t, color, x, y, z, emissive = 0) => M.moved(M.turnedX(M.lathe({ profile: [[0, 0], [r, 0], [r, t], [0, t]], segments: 24, color, emissive }), Math.PI / 2), x, y, z);
  const clean = (text) => String(text).replace(/[\u0000-\u001f\u007f]/g, "").slice(0, 64).trim();
  const integer = (word, lo, hi) => /^\d{1,3}$/.test(word || "") && +word >= lo && +word <= hi ? +word : -1;
  // A toy 32-bit mixer: deliberately NOT a cryptographic hash.
  const seedOf = (text) => { let h = 2166136261; for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619); return h >>> 0; };
  const mix = (seed, nonce) => {
    let h = seed ^ Math.imul(nonce + 1, 0x9e3779b1);
    h = Math.imul(h ^ (h >>> 16), 0x85ebca6b); h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
    return (h ^ (h >>> 16)) >>> 0;
  };
  const hex = (n) => (n >>> 0).toString(16).padStart(8, "0");
  // A bounded search done at once on a command: at most `cap` attempts, the first digest under 2^(32 - bits).
  const search = (seed, bits, cap) => { const limit = 2 ** (32 - bits); for (let n = 0; n < cap; n++) if (mix(seed, n) < limit) return n; return -1; };
  // A museum terminal: the device's hint and its How to use steps lead the banner, and HELP repeats them.
  const device = (title, hint, steps, prompt, commands, extra = []) => {
    const help = [`HINT: ${hint}`, "HOW TO USE:", ...steps.map((s, i) => `  ${i + 1}. ${s}`), `Commands: ${commands}`];
    return (run) => ({ banner: [title, ...extra, ...help, "Original museum toy: local, bounded, RESET starts again."], prompt,
      run(line) {
        const text = clean(line), words = text.toUpperCase().split(/\s+/), cmd = words[0];
        if (!cmd || cmd === "HELP") return { lines: help };
        return run(cmd, words, text);
      } });
  };
  // A paper lectern's panel: In short, the deeper story, what remained unsolved and the sources.
  const paper = (room, keys, short, deeper, unsolved) => () => ({ board: { room, sources: keys, pages: [
    { caption: "In short", title: short[0], text: short.slice(1) },
    { caption: "Deeper story", title: deeper[0], text: deeper.slice(1) },
    { caption: "What remained unsolved", title: unsolved[0], text: unsolved.slice(1) },
    { caption: "Sources", title: "Where this comes from", text: keys.map((k) => (sources[k] ? sources[k].label : "The Bitcoin whitepaper, 2008")).concat("Dates say what they mark. Links are listed below.") }
  ] } });

  // Per-visit state and nodes: set in build, dropped in dispose.
  let S = null;
  const fresh = () => ({
    ring: { nodes: new Uint8Array(16), key: -1, owner: -1 },
    stamp: { text: "museum note", bits: 8, nonce: -1, digest: 0, attempts: 0, boundText: "", boundBits: 0 },
    rpow: { spent: [], wallet: [], made: 0, issued: 0 },
    cab: { loaded: "A", compared: false, match: true },
    gold: { chain: [], hw: "FAST" },
    mosaic: { have: new Uint8Array(12), uploads: new Uint8Array(3), done: 0 },
    gps: { sa: true, day: 1 },
    wiki: { revs: [], at: 0 },
    player: { loaded: new Uint8Array(6), used: 0, cursor: 0 },
    route: { at: 0, hops: 0, target: 23, solved: false },
    patch: null, pocket: null, chain: null,
    n: null
  });
  const RING0 = [1, 4, 9, 12];

  // --- Motion (upgrade 2) ------------------------------------------------------------------------------------------
  // Every command still sets its exhibit's final state at once (the *Show functions); a changed part then glides into
  // that state from where it came from, so cause and effect read in the workbench's live model. The pools are
  // preallocated for the visit; `update` does nothing while none is moving (A.live 0). Calm starts no motion (the
  // final state is already showing) and snaps anything moving; leaving the gallery (`active(false)`) snaps too. The
  // host's holds (pause, the menu, the console) stop calling `update`, so motion freezes where it is.
  // Sounds go through the kit's optional `cue` (the Genesis tab's names below), only on a command, never per frame.
  const CUES = ["whir", "click", "clack", "relay", "chime", "thunk", "rustle-paper", "beep", "hum-start", "hum-stop"];
  const cue = (name) => { if (S && S.cueFn && CUES.indexOf(name) >= 0) S.cueFn(name); };
  const GLIDES = 24, HOPS = 10;
  const ease = (t) => t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t);
  const motion = () => ({
    live: 0, calm: false,
    // Glides: node, its resting place (home), where it comes from, an arc's lift, the time, delay and length, a grow
    // (0: none, 1: from nothing), the mode (0: from there to home; 1: from home to there, then back home unseen, a
    // consumed token; 2: home to there and back, a refused one) and a cue index at its end (-1: none).
    node: new Array(GLIDES).fill(null), home: new Float64Array(GLIDES * 3), from: new Float64Array(GLIDES * 3),
    lift: new Float32Array(GLIDES), t: new Float32Array(GLIDES), delay: new Float32Array(GLIDES), dur: new Float32Array(GLIDES),
    grow: new Uint8Array(GLIDES), mode: new Uint8Array(GLIDES), endCue: new Int8Array(GLIDES).fill(-1),
    // The Chord ring's lookup: a token hopping slot to slot along the route.
    hop: { n: 0, at: 0, t: 0, xs: new Float64Array(HOPS), zs: new Float64Array(HOPS), y: 0 },
    // Pattern Pocket's screen: a 4x4 grid of cells playing the playlist's patterns for `left` seconds.
    pocket: { left: 0, t: 0, ids: new Int8Array(4), n: 0, still: -1 }
  });
  const glide = (node, fx, fy, fz, lift = 0, dur = 0.5, delay = 0, grow = 0, mode = 0, endCue = "") => {
    const A = S && S.anim;
    if (!A || !node || A.calm) return;
    let k = A.node.indexOf(node);
    if (k < 0) {
      k = A.node.indexOf(null);
      if (k < 0) return; // the pool is full: this part simply shows its final state
      A.node[k] = node; A.home[k * 3] = node.position.x; A.home[k * 3 + 1] = node.position.y; A.home[k * 3 + 2] = node.position.z;
      A.live++;
    }
    A.from[k * 3] = fx; A.from[k * 3 + 1] = fy; A.from[k * 3 + 2] = fz;
    A.lift[k] = lift; A.t[k] = 0; A.delay[k] = delay; A.dur[k] = dur; A.grow[k] = grow; A.mode[k] = mode; A.endCue[k] = CUES.indexOf(endCue);
    pose(A, k, 0);
  };
  // Where glide k stands at progress u (0..1).
  const pose = (A, k, u) => {
    const nd = A.node[k], m = A.mode[k], e = ease(m === 2 ? (u < 0.5 ? u * 2 : 2 - u * 2) : u);
    // Mode 0 travels from `from` to home; modes 1 and 2 travel from home toward `from`.
    const w = m === 0 ? e : 1 - e;
    nd.position.x = A.from[k * 3] + (A.home[k * 3] - A.from[k * 3]) * w;
    nd.position.y = A.from[k * 3 + 1] + (A.home[k * 3 + 1] - A.from[k * 3 + 1]) * w + Math.sin(e * Math.PI) * A.lift[k];
    nd.position.z = A.from[k * 3 + 2] + (A.home[k * 3 + 2] - A.from[k * 3 + 2]) * w;
    if (A.grow[k]) { const s = 0.05 + 0.95 * ease(u * 1.6); nd.scale.x = nd.scale.y = nd.scale.z = s; }
  };
  const settle = (A, k) => {
    const nd = A.node[k];
    nd.position.x = A.home[k * 3]; nd.position.y = A.home[k * 3 + 1]; nd.position.z = A.home[k * 3 + 2];
    if (A.grow[k]) nd.scale.x = nd.scale.y = nd.scale.z = 1;
    A.node[k] = null; A.live--;
  };
  // The hop's token at the start of the route; each hop takes HOP_S seconds, arcing over the ring.
  const HOP_S = 0.32;
  const hopStart = (n) => { const A = S.anim, h = A.hop; if (A.calm || n < 2) { S.n.hopper.visible = false; return; } if (h.n === 0) A.live++; h.n = n; h.at = 0; h.t = 0; S.n.hopper.visible = true; };
  const hopEnd = () => { const A = S.anim, h = A.hop; if (h.n) { h.n = 0; A.live--; } S.n.hopper.visible = false; };
  // Pattern Pocket's screen cells: which are lit for pattern `id` at step `k`, on the toy's six original rules.
  const SPIRAL = [0, 1, 2, 3, 7, 11, 15, 14, 13, 12, 8, 4, 5, 6, 10, 9];
  const cellOn = (id, i, j, k) => id === 0 ? j >= 3 - ((i + k) & 3) : id === 1 ? ((Math.max(Math.abs(i - 1.5), Math.abs(j - 1.5)) | 0) === (k & 1))
    : id === 2 ? i === ((j + k) & 3) : id === 3 ? ((i + j + k) & 1) === 1 : id === 4 ? SPIRAL.indexOf(j * 4 + i) < (k % 17) : ((((i * 7 + j * 13) ^ k) & 3) !== 0);
  const pocketPaint = (id, k) => { const c = S.n.pocketCells; for (let q = 0; q < 16; q++) c[q].visible = id >= 0 && cellOn(id, q & 3, q >> 2, k); };
  // Plays the given patterns on the screen, POCKET_S seconds each (one pattern once, a whole playlist in turn); the
  // screen's last frame is the first pattern's still, or dark for an empty playlist.
  const POCKET_S = 1.4;
  const pocketPlay = (list, n) => {
    const A = S.anim, p = A.pocket;
    p.n = Math.min(n, 4); for (let i = 0; i < p.n; i++) p.ids[i] = list[i];
    p.still = p.n ? p.ids[0] : -1;
    if (A.calm || !p.n) { pocketPaint(p.still, 5); if (p.left > 0) { p.left = 0; A.live--; } return; }
    if (p.left <= 0) A.live++;
    p.left = p.n * POCKET_S; p.t = 0;
  };
  const pocketStop = () => { const A = S.anim, p = A.pocket; if (p.left > 0) { p.left = 0; A.live--; } pocketPaint(p.still, 5); };
  // Everything moving, put at its end at once (Calm switched on, the gallery left, a reset).
  const snapAll = () => {
    const A = S && S.anim;
    if (!A) return;
    for (let k = 0; k < GLIDES; k++) if (A.node[k]) settle(A, k);
    hopEnd(); pocketStop();
  };
  const tick = (dt) => {
    const A = S.anim;
    for (let k = 0; k < GLIDES; k++) {
      if (!A.node[k]) continue;
      if (A.delay[k] > 0) { A.delay[k] -= dt; continue; }
      A.t[k] += dt;
      const u = A.t[k] / A.dur[k];
      if (u >= 1) { const c = A.endCue[k]; settle(A, k); if (c >= 0) cue(CUES[c]); } else pose(A, k, u);
    }
    const h = A.hop;
    if (h.n) {
      h.t += dt;
      while (h.n && h.t >= HOP_S) { h.t -= HOP_S; h.at++; if (h.at >= h.n - 1) { hopEnd(); cue("chime"); } }
      if (h.n) {
        const u = ease(h.t / HOP_S), a = h.at, nd = S.n.hopper;
        nd.position.x = h.xs[a] + (h.xs[a + 1] - h.xs[a]) * u; nd.position.z = h.zs[a] + (h.zs[a + 1] - h.zs[a]) * u;
        nd.position.y = h.y + Math.sin(u * Math.PI) * 0.35;
      }
    }
    const p = A.pocket;
    if (p.left > 0) {
      p.left -= dt; p.t += dt;
      if (p.left <= 0) { p.left = 0; A.live--; pocketPaint(p.still, 5); cue("hum-stop"); }
      else { const slot = Math.min(p.n - 1, Math.floor(p.t / POCKET_S)); pocketPaint(p.ids[slot], Math.floor(p.t * 5)); }
    }
  };

  // --- Chord ring --------------------------------------------------------------------------------------------------
  const succ = (nodes, id) => { for (let i = 0; i < 16; i++) { const k = (id + i) & 15; if (nodes[k]) return k; } return -1; };
  const inside = (x, a, b) => a < b ? x > a && x <= b : x > a || x <= b; // x in (a, b] around the ring
  const ringShow = () => {
    const r = S.ring, N = S.n;
    for (let i = 0; i < 16; i++) { N.pillars[i].visible = !!r.nodes[i]; N.caps[i].visible = i === r.owner; }
    N.keyMark.visible = r.key >= 0;
    if (r.key >= 0) { N.keyMark.position.x = N.slot[r.key * 2]; N.keyMark.position.z = N.slot[r.key * 2 + 1]; }
  };
  const ringTerm = device("CHORD RING / 16 numbered places, a museum model of key lookup",
    "Lookup finds which peer holds a key. It does not decide who owns anything.",
    ["Type NODES to see which places hold a peer.", "Type LOOKUP and a key from 0 to 15: watch the hops.", "JOIN or LEAVE a place, then look the same key up again."],
    "RING>", "NODES | LOOKUP k | JOIN n | LEAVE n | RESET")((cmd, w) => {
    const r = S.ring;
    const list = () => { const out = []; for (let i = 0; i < 16; i++) if (r.nodes[i]) out.push(i); return out; };
    if (cmd === "RESET") { snapAll(); r.nodes.fill(0); for (const k of RING0) r.nodes[k] = 1; r.key = r.owner = -1; ringShow(); return reply("Ring reset: peers at 1, 4, 9 and 12."); }
    if (cmd === "NODES") return reply(`Peers at: ${list().join(", ")}.`, "Each key belongs to the first peer at or after it, going round.");
    if (cmd === "JOIN" || cmd === "LEAVE") {
      const n = w.length === 2 ? integer(w[1], 0, 15) : -1, count = list().length;
      if (n < 0) return reply(`${cmd} needs one place from 0 to 15.`);
      if (cmd === "JOIN" && (r.nodes[n] || count >= 8)) return reply(r.nodes[n] ? `A peer already holds ${n}.` : "At most 8 peers in this model.");
      if (cmd === "LEAVE" && (!r.nodes[n] || count <= 1)) return reply(r.nodes[n] ? "Keep at least one peer." : `No peer at ${n}.`);
      r.nodes[n] = cmd === "JOIN" ? 1 : 0; r.owner = r.key >= 0 ? succ(r.nodes, r.key) : -1; ringShow();
      return reply(`${cmd === "JOIN" ? "Joined" : "Left"}: ${n}. Peers at ${list().join(", ")}.`, r.key >= 0 ? `Key ${r.key} now belongs to peer ${r.owner}.` : "Keys move to the next peer round the ring.");
    }
    if (cmd === "LOOKUP") {
      const k = w.length === 2 ? integer(w[1], 0, 15) : -1;
      if (k < 0) return reply("LOOKUP needs one key from 0 to 15.");
      // From the lowest peer: jump by the furthest table entry (1, 2, 4 or 8 places ahead) that does not pass the key.
      let cur = succ(r.nodes, 0), path = `${cur}`, hops = 0;
      const owner = succ(r.nodes, k), H = S.anim.hop;
      H.xs[0] = S.n.slot[cur * 2]; H.zs[0] = S.n.slot[cur * 2 + 1];
      while (cur !== owner && hops < 8) {
        const next = succ(r.nodes, (cur + 1) & 15);
        if (inside(k, cur, next)) { cur = next; }
        else {
          let jump = next;
          for (let s = 8; s >= 1; s >>= 1) { const f = succ(r.nodes, (cur + s) & 15); if (f !== cur && inside(f, cur, k) && f !== k) { jump = f; break; } }
          cur = jump;
        }
        path += ` > ${cur}`; hops++;
        H.xs[hops] = S.n.slot[cur * 2]; H.zs[hops] = S.n.slot[cur * 2 + 1];
      }
      r.key = k; r.owner = owner; ringShow();
      // The lookup's token hops the route over the ring; the owner's cap pops up as it lands.
      if (hops) { hopStart(hops + 1); cue("relay"); glide(S.n.caps[owner], S.n.slot[owner * 2], S.n.top + 1.2, S.n.slot[owner * 2 + 1], 0, 0.3, hops * HOP_S, 1); }
      return reply(`Key ${k}: route ${path}; ${hops} hop${hops === 1 ? "" : "s"}. Peer ${owner} holds it.`, "Finding a peer is not agreeing on a ledger: no vote, no ownership record, no double-spending check.");
    }
    return reply("NODES | LOOKUP k | JOIN n | LEAVE n | RESET");
  });

  // --- Hashcash work-stamp bench ----------------------------------------------------------------------------------
  const STAMP_CAP = 8192;
  const stampShow = () => { const a = S.stamp.attempts, lit = a ? Math.min(10, Math.ceil(Math.log2(a + 1))) : 0; for (let i = 0; i < 10; i++) S.n.meter[i].visible = i < lit; S.n.stampTile.visible = S.stamp.nonce >= 0; };
  const stampTerm = device("WORK-STAMP BENCH / costly to make, cheap to check (museum toy)",
    "Making a stamp takes many tries; checking it takes one.",
    ["Type TEXT and a short message.", "Type BITS 1 to 12 to choose how hard the stamp is.", "Type MAKE, then CHECK. Change the TEXT and CHECK again."],
    "STAMP>", "TEXT words | BITS 1..12 | MAKE | CHECK | RESET",
    ["The paper's idea: a cost-function verifiable cheaply but costly to compute. This toy mixer is NOT Hashcash's real hash."])((cmd, w, text) => {
    const s = S.stamp;
    if (cmd === "RESET") { snapAll(); s.text = "museum note"; s.bits = 8; s.nonce = -1; s.attempts = 0; stampShow(); return reply("Bench cleared. TEXT is 'museum note', BITS 8."); }
    if (cmd === "TEXT") { const t = text.replace(/^\S+\s*/, "").slice(0, 40); if (!t) return reply("TEXT needs a short message."); s.text = t; return reply(`Message: ${t}. The old stamp stays bound to its own message.`); }
    if (cmd === "BITS") { const b = w.length === 2 ? integer(w[1], 1, 12) : -1; if (b < 0) return reply("BITS needs a whole number from 1 to 12."); s.bits = b; return reply(`Target: a digest starting with ${b} zero bits. About ${2 ** b} tries on average.`); }
    if (cmd === "MAKE") {
      const n = search(seedOf(s.text), s.bits, STAMP_CAP);
      s.attempts = n < 0 ? STAMP_CAP : n + 1; s.nonce = n; s.digest = n < 0 ? 0 : mix(seedOf(s.text), n); s.boundText = s.text; s.boundBits = s.bits; stampShow();
      // The meter climbs a segment at a time for the tries spent, then the stamp drops onto the bench.
      { const N = S.n; let lit = 0; for (let i = 0; i < 10; i++) if (N.meter[i].visible) { lit++; glide(N.meter[i], N.meter[i].position.x, N.meter[i].position.y, N.meter[i].position.z, 0, 0.22, i * 0.09, 1); }
        if (n >= 0) glide(N.stampTile, N.stampTile.position.x, N.stampTile.position.y + 0.6, N.stampTile.position.z, 0, 0.35, lit * 0.09 + 0.1, 0, 0, "thunk");
        if (lit) cue("whir"); }
      return n < 0 ? reply(`No stamp within ${STAMP_CAP} tries (the bench's limit). Lower BITS and MAKE again.`)
        : reply(`Stamp found after ${s.attempts} tries: nonce ${n}, digest ${hex(s.digest)}.`, "The meter's lit segments grow with the number of tries. Now CHECK: one try.");
    }
    if (cmd === "CHECK") {
      if (s.nonce < 0) return reply("MAKE a stamp first.");
      const ok = s.text === s.boundText && mix(seedOf(s.text), s.nonce) < 2 ** (32 - s.boundBits);
      // One check: the stamp lifts once off the bench and settles.
      glide(S.n.stampTile, S.n.stampTile.position.x, S.n.stampTile.position.y, S.n.stampTile.position.z, 0.12, 0.3); cue(ok ? "chime" : "beep");
      return reply(ok ? "VALID: one try confirms the work for this message." : "INVALID: the stamp was made for different text.", "A service would still have to remember spent stamps; a stamp is not a shared payment history.");
    }
    return reply("TEXT words | BITS 1..12 | MAKE | CHECK | RESET");
  });

  // --- RPOW desk and its sealed cabinet ---------------------------------------------------------------------------
  const FP = { A: "7c41-9e02", B: "d3b8-1a6f" }, PUBLISHED = FP.A;
  const cabShow = () => { const c = S.cab, N = S.n; N.cabGreen.visible = c.compared && c.match; N.cabRed.visible = c.compared && !c.match; };
  const rpowTerm = device("RPOW EXCHANGE DESK / spent token in, fresh token out (museum toy)",
    "The server refuses any token it has already seen.",
    ["Type WORK to make a toy work token.", "Type EXCHANGE and its name, e.g. EXCHANGE W1.", "Try EXCHANGE W1 again: reuse is refused.", "Visit the sealed cabinet to see what you are trusting."],
    "RPOW>", "WORK | EXCHANGE name | WALLET | RESET",
    ["Context: Finney's 2004 announcement; not a whitepaper reference. No real tokens, keys or server."])((cmd, w) => {
    const r = S.rpow, c = S.cab;
    if (cmd === "RESET") { snapAll(); r.spent.length = 0; r.wallet.length = 0; r.made = r.issued = 0; return reply("Desk cleared."); }
    if (cmd === "WALLET") return reply(`Your tokens: ${r.wallet.length ? r.wallet.join(", ") : "none"}. Spent at the server: ${r.spent.length ? r.spent.join(", ") : "none"}.`);
    if (cmd === "WORK") {
      if (r.made >= 12) return reply("Toy limit: 12 work tokens a visit. RESET to start again.");
      r.made++; const name = `W${r.made}`; r.wallet.push(name);
      return reply(`Made ${name} (pretend work). EXCHANGE ${name} to swap it for a fresh signed token.`);
    }
    if (cmd === "EXCHANGE") {
      const name = (w[1] || "").slice(0, 6);
      if (!/^(W|R)\d{1,2}$/.test(name)) return reply("EXCHANGE needs a token name such as W1 or R1.");
      if (c.compared && !c.match) { rpowBounce(); return reply("The cabinet's fingerprint no longer matches the published one: a careful user would not trust this server's tokens. Fix it at the cabinet (LOAD A)."); }
      if (r.spent.indexOf(name) >= 0) { rpowBounce(); return reply(`REFUSED: ${name} was already exchanged. Inputs cannot be reused.`); }
      const i = r.wallet.indexOf(name);
      if (i < 0) return reply(`You do not hold ${name}. WALLET lists yours.`);
      if (r.spent.length >= 24) return reply("Toy server full (24 records). RESET to start again.");
      r.wallet.splice(i, 1); r.spent.push(name); r.issued++; const out = `R${r.issued}`; r.wallet.push(out);
      rpowSwap();
      return reply(`Accepted ${name}; issued fresh signed token ${out}. You can exchange ${out} later, once.`, "Everything rests on this one server running honestly, and staying up.");
    }
    return reply("WORK | EXCHANGE name | WALLET | RESET");
  });
  const cabTerm = device("SEALED CABINET / compare a code fingerprint (bounded museum demonstration)",
    "Before trusting the server, compare its code's fingerprint with the published one.",
    ["Type PUBLISHED to see the fingerprint the operator published.", "Type COMPARE: green means they match.", "Type LOAD B (changed code) and COMPARE again; LOAD A restores it."],
    "CABINET>", "PUBLISHED | COMPARE | LOAD A | LOAD B | RESET",
    ["This compares two fixed strings in a museum script. It is NOT real hardware attestation and checks no real device."])((cmd, w) => {
    const c = S.cab;
    if (cmd === "RESET") { c.loaded = "A"; c.compared = false; c.match = true; cabShow(); return reply("Cabinet reset: original code loaded, nothing compared yet."); }
    if (cmd === "PUBLISHED") return reply(`Published fingerprint: ${PUBLISHED}.`, "In RPOW's 2004 deployment, the secure coprocessor could report what software it ran, so users could check it.");
    if (cmd === "LOAD") {
      const v = w[1]; if (v !== "A" && v !== "B") return reply("LOAD A (the published code) or LOAD B (changed code).");
      c.loaded = v; c.compared = false; cabShow(); return reply(`Loaded code ${v}. COMPARE to check it.`);
    }
    if (cmd === "COMPARE") {
      c.compared = true; c.match = FP[c.loaded] === PUBLISHED; cabShow();
      return reply(`Cabinet reports ${FP[c.loaded]}; published ${PUBLISHED}: ${c.match ? "MATCH (green lamp)." : "MISMATCH (red lamp). The desk will refuse to exchange."}`,
        "You still trust the hardware's maker, the published code and the operator. The boundary moves; it does not vanish.");
    }
    return reply("PUBLISHED | COMPARE | LOAD A | LOAD B | RESET");
  });

  // --- Bit gold bench ---------------------------------------------------------------------------------------------
  const GOLD_MAX = 6, GOLD_BITS = 9, GOLD_CAP = 16384;
  const goldShow = () => { for (let i = 0; i < GOLD_MAX; i++) S.n.bars[i].visible = i < S.gold.chain.length; };
  const goldTerm = device("BIT GOLD BENCH / costly strings, chained, with recorded owners (museum toy)",
    "Each new string's puzzle comes from the last string made.",
    ["Type MINT: the bench solves a puzzle seeded by the last string.", "Type HARDWARE SLOW, then MINT again: compare the cost.", "Type OWNER and a name to record who holds the newest string; LIST shows the registry."],
    "GOLD>", "MINT | HARDWARE FAST or SLOW | OWNER name | LIST | RESET",
    ["The essay: the last-created string provides the challenge bits for the next. The toy mixer is not a real hash."])((cmd, w, text) => {
    const g = S.gold;
    if (cmd === "RESET") { snapAll(); g.chain.length = 0; g.hw = "FAST"; goldShow(); return reply("Registry cleared; hardware FAST."); }
    if (cmd === "HARDWARE") { const v = w[1]; if (v !== "FAST" && v !== "SLOW") return reply("HARDWARE FAST or HARDWARE SLOW."); g.hw = v; return reply(`Hardware ${v}: ${v === "SLOW" ? "each try costs 4 time units" : "each try costs 1 time unit"}.`); }
    if (cmd === "LIST") return reply(g.chain.length ? g.chain.map((c, i) => `#${i + 1} ${hex(c.digest)} owner ${c.owner} cost ${c.cost}`).join(" / ") : "No strings yet. MINT makes the first.");
    if (cmd === "OWNER") {
      const name = text.replace(/^\S+\s*/, "").slice(0, 16).replace(/[^A-Za-z0-9 ]/g, "");
      if (!g.chain.length) return reply("MINT a string first."); if (!name) return reply("OWNER needs a name.");
      g.chain[g.chain.length - 1].owner = name; return reply(`Registry: string #${g.chain.length} is held by ${name}.`, "Who keeps this registry, and why should everyone trust it? The essay leaves that design open.");
    }
    if (cmd === "MINT") {
      if (g.chain.length >= GOLD_MAX) return reply(`The shelf holds ${GOLD_MAX} strings. RESET to start again.`);
      const last = g.chain.length ? g.chain[g.chain.length - 1].digest : 0x5ec0de, seed = mix(last, 7777 + g.chain.length);
      const n = search(seed, GOLD_BITS, GOLD_CAP);
      if (n < 0) return reply("No solution within the bench's limit. MINT again.");
      const cost = (n + 1) * (g.hw === "SLOW" ? 4 : 1);
      g.chain.push({ digest: mix(seed, n), owner: "unowned", cost }); goldShow();
      // The new string rises onto the shelf beside the one it was built on.
      { const b = S.n.bars[g.chain.length - 1]; glide(b, b.position.x, b.position.y - 0.35, b.position.z + 0.3, 0.25, 0.55, 0, 1, 0, "thunk"); cue("whir"); }
      return reply(`String #${g.chain.length}: ${n + 1} tries on ${g.hw} hardware, cost ${cost} time units; digest ${hex(g.chain[g.chain.length - 1].digest)}.`,
        "Strings made on different hardware, or at different times, cost different amounts: units are unequal.");
    }
    return reply("MINT | HARDWARE FAST or SLOW | OWNER name | LIST | RESET");
  });

  // --- BitTorrent piece mosaic ------------------------------------------------------------------------------------
  // Three toy peers each hold some of 12 pieces of an original picture.
  const PEERS = ["AMBER", "BLUE", "CORAL"], HOLD = [[0, 1, 2, 3, 4, 5], [4, 5, 6, 7, 8, 9], [8, 9, 10, 11, 0, 1]];
  const mosaicShow = () => { const m = S.mosaic; for (let i = 0; i < 12; i++) S.n.tiles[i].visible = !!m.have[i]; };
  const rarity = (p) => { let r = 0; for (const h of HOLD) if (h.indexOf(p) >= 0) r++; return r; };
  const mosaicTerm = device("PIECE MOSAIC / fetch an original picture in pieces from neighbours (museum toy)",
    "Pieces can come from different peers, so no one peer carries the whole upload.",
    ["Type PEERS to see who holds which pieces.", "Type FETCH AMBER, FETCH BLUE or FETCH CORAL to take one piece you lack.", "Fill all 12 tiles; STATUS shows who uploaded how much."],
    "MOSAIC>", "PEERS | FETCH peer | STATUS | RESET",
    ["No real files, trackers or network: three invented peers and an original picture."])((cmd, w) => {
    const m = S.mosaic;
    if (cmd === "RESET") { snapAll(); m.have.fill(0); m.uploads.fill(0); m.done = 0; mosaicShow(); return reply("Mosaic cleared."); }
    if (cmd === "PEERS") return reply(...PEERS.map((p, i) => `${p}: pieces ${HOLD[i].join(", ")}`));
    if (cmd === "STATUS") return reply(`You hold ${m.done}/12. Uploads: ${PEERS.map((p, i) => `${p} ${m.uploads[i]}`).join(", ")}.`, m.done === 12 ? "Picture complete. Copying pieces is not agreeing who owns them." : "FETCH more pieces.");
    if (cmd === "FETCH") {
      const i = PEERS.indexOf(w[1]);
      if (i < 0) return reply("FETCH AMBER, FETCH BLUE or FETCH CORAL.");
      // The rarest piece this peer has that you lack (fewest holders first), as a toy policy.
      let pick = -1;
      for (const p of HOLD[i]) if (!m.have[p] && (pick < 0 || rarity(p) < rarity(pick))) pick = p;
      if (pick < 0) return reply(`${PEERS[i]} has nothing you lack. Try another peer.`);
      m.have[pick] = 1; m.uploads[i]++; m.done++; mosaicShow();
      { const t = S.n.tiles[pick]; glide(t, S.n.peerX, S.n.top + 0.75, S.n.peerZ - 1 + i, 0.6, 0.6, 0, 0, 0, "click"); }
      return reply(`${PEERS[i]} sent piece ${pick} (it chose the rarest piece you lacked). ${m.done}/12.`, m.done === 12 ? "Complete! STATUS shows how the uploading was shared." : "Close this window to watch the tiles fill.");
    }
    return reply("PEERS | FETCH peer | STATUS | RESET");
  });

  // --- GPS sharpening ---------------------------------------------------------------------------------------------
  const gpsShow = () => { const g = S.gps; for (const n of S.n.wide) n.visible = g.sa; for (const n of S.n.tight) n.visible = !g.sa; };
  const gpsTerm = device("POSITION FINDER / civil GPS fixes before and after 2 May 2000 (museum model)",
    "Watch the circle of uncertainty shrink when the deliberate blur stops.",
    ["Type DAY 1 for 1 May 2000, the announcement: the wide circle stays.", "Type DAY 2 for 2 May 2000, just after midnight EDT: the circle tightens.", "Type INFO for what the dates mark."],
    "GPS>", "DAY 1 | DAY 2 | INFO | RESET",
    ["The circles are illustrative. No improvement factor is claimed. No real receiver or satellite signal."])((cmd, w) => {
    const g = S.gps;
    if (cmd === "RESET") { g.sa = true; g.day = 1; gpsShow(); return reply("1 May 2000: wide circle."); }
    if (cmd === "INFO") return reply("1 May 2000: the United States announced it would stop Selective Availability, a deliberate degradation of civil GPS accuracy.", "2 May 2000, just after midnight EDT: the change took effect and civil fixes became more accurate.", "Context for this era, not a Bitcoin step.");
    if (cmd === "DAY") {
      const d = w.length === 2 ? integer(w[1], 1, 2) : -1; if (d < 0) return reply("DAY 1 or DAY 2.");
      g.day = d; g.sa = d === 1; gpsShow();
      return reply(d === 1 ? "1 May 2000: announcement day. Selective Availability still on: wide illustrative circle." : "2 May 2000, just after midnight EDT: Selective Availability off. Tighter illustrative circle.");
    }
    return reply("DAY 1 | DAY 2 | INFO | RESET");
  });

  // --- Volunteer encyclopedia kiosk -------------------------------------------------------------------------------
  const ARTICLE = "The Ooga river otter is a museum creature invented for this cave.";
  const wikiShow = () => { const n = S.wiki.revs.length; for (let i = 0; i < 8; i++) S.n.lines[i].visible = i < n; };
  const wikiTerm = device("VOLUNTEER ENCYCLOPEDIA / anyone may edit; every revision is kept (museum kiosk)",
    "Every change is kept, so a bad edit can be undone.",
    ["Type READ to see the article.", "Type EDIT and new text to change it.", "Type HISTORY, then REVERT and a number to bring an old version back."],
    "WIKI>", "READ | EDIT text | HISTORY | REVERT n | RESET",
    ["2001: a volunteer-written online encyclopedia launched that January. The article here is original sample text.",
      "Sources: a community draft of its first press release (January 2002, a draft, not the final release) and a later secondary source. Neither is a dated launch record, so this kiosk keeps the month, January 2001."])((cmd, w, text) => {
    const k = S.wiki;
    if (cmd === "RESET") { k.revs.length = 0; k.revs.push(ARTICLE); k.at = 0; wikiShow(); return reply("Article restored to revision 1."); }
    if (cmd === "READ") return reply(`Revision ${k.at + 1}: ${k.revs[k.at]}`);
    if (cmd === "HISTORY") return reply(...k.revs.map((r, i) => `${i + 1}${i === k.at ? " (current)" : ""}: ${r}`));
    if (cmd === "EDIT") {
      const t = text.replace(/^\S+\s*/, "").slice(0, 56); if (!t) return reply("EDIT needs new text.");
      if (k.revs.length >= 8) return reply("This kiosk keeps 8 revisions. RESET to start again.");
      k.revs.push(t); k.at = k.revs.length - 1; wikiShow(); return reply(`Saved as revision ${k.at + 1}. HISTORY lists them all.`);
    }
    if (cmd === "REVERT") {
      const n = w.length === 2 ? integer(w[1], 1, k.revs.length) : -1; if (n < 0) return reply(`REVERT needs a revision from 1 to ${k.revs.length}.`);
      if (k.revs.length >= 8) return reply("This kiosk keeps 8 revisions. RESET to start again.");
      k.revs.push(k.revs[n - 1]); k.at = k.revs.length - 1; wikiShow(); return reply(`Revision ${n} restored as revision ${k.at + 1}. Nothing was erased.`);
    }
    return reply("READ | EDIT text | HISTORY | REVERT n | RESET");
  });

  // --- Pocket hard-disk music player (silent) ---------------------------------------------------------------------
  const TRACKS = [["Two-note call", 2], ["Work pulse", 3], ["Plucked rain", 2], ["Rising four", 4], ["Soft drum loop", 3], ["Warm keys", 2]];
  const PLAYER_CAP = 10;
  const playerShow = () => { const p = S.player; for (let i = 0; i < PLAYER_CAP; i++) S.n.cap[i].visible = i < p.used; };
  const playerTerm = device("POCKET PLAYER / a disk in your pocket (original museum model; it makes no sound)",
    "Fill the capacity bar with synthesized sound packets.",
    ["Type LIST to see the packets and their sizes.", "Type UP or DOWN to move the cursor, ADD to load it, DROP to unload it.", "Watch the capacity bar; it is a toy, not to scale."],
    "PLAYER>", "LIST | UP | DOWN | ADD | DROP | RESET",
    ["Announced 23 October 2001; available 10 November 2001. Packets are named patterns, not recordings; the cave's shared music keeps playing."])((cmd) => {
    const p = S.player;
    const row = () => `> ${TRACKS[p.cursor][0]} (${TRACKS[p.cursor][1]} units)${p.loaded[p.cursor] ? " loaded" : ""}`;
    if (cmd === "RESET") { p.loaded.fill(0); p.used = 0; p.cursor = 0; playerShow(); return reply("Player emptied.", row()); }
    if (cmd === "LIST") return reply(...TRACKS.map((t, i) => `${i === p.cursor ? ">" : " "} ${t[0]}: ${t[1]} units${p.loaded[i] ? " (loaded)" : ""}`), `Used ${p.used}/${PLAYER_CAP} units.`);
    if (cmd === "UP" || cmd === "DOWN") { p.cursor = (p.cursor + (cmd === "UP" ? TRACKS.length - 1 : 1)) % TRACKS.length; return reply(row()); }
    if (cmd === "ADD") {
      if (p.loaded[p.cursor]) return reply("Already loaded.", row());
      const size = TRACKS[p.cursor][1]; if (p.used + size > PLAYER_CAP) return reply(`Not enough room: ${p.used}/${PLAYER_CAP} used. DROP something first.`);
      p.loaded[p.cursor] = 1; p.used += size; playerShow(); return reply(`Loaded. Used ${p.used}/${PLAYER_CAP}.`, row());
    }
    if (cmd === "DROP") {
      if (!p.loaded[p.cursor]) return reply("That packet is not loaded.", row());
      p.loaded[p.cursor] = 0; p.used -= TRACKS[p.cursor][1]; playerShow(); return reply(`Unloaded. Used ${p.used}/${PLAYER_CAP}.`, row());
    }
    return reply("LIST | UP | DOWN | ADD | DROP | RESET");
  });

  // --- Loft routing puzzle (2001-inspired, original) --------------------------------------------------------------
  const routeTerm = device("ROUTING PUZZLE / reach place 23 on a 32-place ring in few jumps (original game)",
    "Jumps double in size: 1, 2, 4, 8 or 16 places. The best route needs only a few.",
    ["Type JUMP and a size (1, 2, 4, 8 or 16).", "Reach place 23 without passing it.", "RESET for another go; the best score is 4 jumps."],
    "ROUTE>", "JUMP 1|2|4|8|16 | STATUS | RESET")((cmd, w) => {
    const r = S.route;
    if (cmd === "RESET") { r.at = 0; r.hops = 0; r.solved = false; return reply("At place 0. Target 23."); }
    if (cmd === "STATUS") return reply(`At place ${r.at}; ${r.hops} jumps; target ${r.target}.`);
    if (cmd === "JUMP") {
      const s = w.length === 2 ? integer(w[1], 1, 16) : -1;
      if (s < 0 || (s & (s - 1))) return reply("JUMP 1, 2, 4, 8 or 16.");
      if (r.solved) return reply("Solved! RESET to play again.");
      if (r.at + s > r.target) return reply(`That passes ${r.target}. Try a smaller jump.`);
      if (r.hops >= 12) return reply("Out of jumps. RESET to try again.");
      r.at += s; r.hops++; r.solved = r.at === r.target;
      return reply(r.solved ? `Arrived in ${r.hops} jumps${r.hops === 4 ? ": the best possible!" : ". The best is 4."}` : `At place ${r.at}; ${r.hops} jump${r.hops === 1 ? "" : "s"}.`);
    }
    return reply("JUMP 1|2|4|8|16 | STATUS | RESET");
  });

  // --- Words ------------------------------------------------------------------------------------------------------
  const TRUST = [
    "Hashcash (2002 paper): work is costly to make and cheap to check; a service still remembers spent stamps.",
    "RPOW (2004 announcement): tokens become reusable through one server whose code fingerprint can be compared; you trust that server and its hardware.",
    "Bit gold (December 2005, qualified): chained costly strings and an ownership registry; units are unequal and the registry's design stays open."
  ];
  const PEERS_TEXT = "Chord (2001) finds the peer that holds a key; BitTorrent's 2003 paper shares file pieces. Neither is a money ledger, and Bitcoin does not use Chord.";
  // --- The period-gear cluster's two games ------------------------------------------------------------------------
  // Each is its own module's terminal over this visit's state, wrapped so the cluster's model follows every command.
  // Their story is the era's own: the BitTorrent lectern and the RPOW desk, pointed to rather than retold.
  const PATCH_STORY = [PEERS_TEXT,
    "The paper's story is on the BitTorrent lectern by the piece mosaic; reusable tokens, and who you must trust for them, are at the RPOW desk."];
  // A single send slides its tile across from the sender's board (a reset or a new deal just shows); every change of
  // the board otherwise shows at once.
  const patchShow = () => {
    const p = S.patch, t = S.n.patchTiles, sent = S.patchSent;
    let added = -1, adds = 0, from = -1;
    for (let peer = 0; peer < 3; peer++) for (let i = 0; i < 9; i++) { const nd = t[peer * 9 + i], on = p.holds(peer, i); if (on && !nd.visible) { adds++; added = peer * 9 + i; } nd.visible = on; }
    for (let peer = 0; peer < 3; peer++) { if (p.sent[peer] === sent[peer] + 1) from = peer; sent[peer] = p.sent[peer]; }
    if (adds === 1 && from >= 0) { const src = t[from * 9 + added % 9], dst = t[added]; glide(dst, src.position.x, src.position.y, src.position.z, 0.3, 0.55, 0, 0, 0, "click"); }
  };
  // The storage bar's new segments grow in; the screen plays what was just added, or the whole playlist on PLAY, and
  // otherwise shows the playlist's first pattern still.
  const pocketShow = (line) => {
    const m = S.pocket, u = m.used(), b = S.n.pocketBar, cmd = String(line).trim().toUpperCase().split(/\s+/)[0];
    for (let i = 0; i < b.length; i++) { const on = i < u; if (on && !b[i].visible) glide(b[i], b[i].position.x, b[i].position.y, b[i].position.z, 0, 0.25, (i % 4) * 0.05, 1); b[i].visible = on; }
    if (cmd === "PLAY" && m.M.length) { pocketPlay(m.list, m.M.length); cue("hum-start"); }
    else if (cmd === "ADD" && m.M.length) { const keep = m.list[0]; pocketPlay(m.list.subarray(m.M.length - 1), 1); S.anim.pocket.still = keep; }
    else { S.anim.pocket.still = m.M.length ? m.list[0] : -1; pocketStop(); }
  };
  // The RPOW desk's two tokens: a spent one slides into the box's slot and a fresh one slides out to the other tray; a
  // refused one goes to the slot and comes back.
  const rpowSwap = () => { const N = S.n; glide(N.tokIn, N.slotX, N.slotY, N.slotZ, 0.15, 0.5, 0, 0, 1); glide(N.tokOut, N.slotX, N.slotY, N.slotZ, 0.15, 0.5, 0.55, 0, 0, "clack"); };
  // The display comparison reveals as its board opens: each model's depth bar grows out in turn.
  const revealDisplays = () => { const b = S.n.depthBars; for (let i = 0; i < b.length; i++) glide(b[i], b[i].position.x, b[i].position.y, b[i].position.z, 0, 0.5, 0.15 + i * 0.35, 1); if (b.length) cue("click"); };
  const rpowBounce = () => { const N = S.n; glide(N.tokIn, N.slotX, N.slotY, N.slotZ, 0.12, 0.7, 0, 0, 2); cue("beep"); };
  const CHAIN_STORY = ["Context: the bit gold bench and its lectern across the walk (December 2005, qualified) tell the real proposal's story; this game borrows only its picture of each new string built on the last."];
  const watched = (term, show) => ({ banner: term.banner, prompt: term.prompt, run(line) { const r = term.run(line); show(line); return r; } });
  const patchTerm = () => watched(BL.genesisEra5Patchwork.terminal(S.patch, PATCH_STORY), patchShow);
  const pocketTerm = () => watched(BL.genesisEra5Mixtape.terminal(S.pocket, ["Context: the silent pocket disk player further up this side (announced 23 October 2001); this toy makes no claim about that product."]), pocketShow);
  BL.genesisExhibits.register(5, {
    sources,
    overview: {
      summary: "2000-2007: computers learned to find each other and share files, while inventors tried reusable work tokens and costly digital objects. Sharing a file is not agreeing who owns money. Each bench here solved something and left something open.",
      sourceKeys: ["E5-CHORD", "E5-BT", "E5-HC", "E5-RPOW", "E5-BG", "E5-ATTR"],
      pages: [
        { caption: "Explore", title: "A workshop of competing ideas", text: [
          "Left side: four idea benches. Each lectern has the paper's story; each toy beside it lets you try the idea. Right side: a peer-sharing bench and period gear, with a small cluster of modern museum toys by the far shelf.",
          PEERS_TEXT, "Every toy has HELP, a hint and How to use steps, and RESET starts it again."] },
        { caption: "How to read it", title: "Citation, influence, context", text: [
          "Whitepaper citation: the 2002 Hashcash paper is the whitepaper's reference [6]. Documented influence: bit gold, named in Satoshi's retrospective 20 July 2010 post.",
          "Everything else is context: part of these years, not something the whitepaper cites or is shown to have drawn on.",
          "Dates say what they mark: a paper, an announcement, a conference or a change."] },
        { caption: "Trust boundaries", title: "Who must you trust?", text: [...TRUST,
          "Two lofts high on the back walls repeat this comparison and hold a routing puzzle: fly up with the jetpack (hold Space in the air). Everything you need is down here too."] }
      ]
    },
    build(kit) {
      S = fresh();
      S.anim = motion(); S.cueFn = typeof kit.cue === "function" ? kit.cue : null; S.patchSent = new Uint8Array(3);
      for (const k of RING0) S.ring.nodes[k] = 1;
      S.wiki.revs.push(ARTICLE);
      const { era, top, solid, sign, obstacle, prop } = kit;
      const N = S.n = { pillars: [], caps: [], slot: new Float32Array(32), keyMark: null, meter: [], stampTile: null, cabGreen: null, cabRed: null, cabBusy: null,
        bars: [], tiles: [], wide: [], tight: [], lines: [], cap: [], sats: [], satR: 0, satX: 0, satZ: 0, satY: 0, beacon: null, ringX: 0, ringZ: 0,
        patchTiles: [], pocketBar: [], chainLinks: [],
        hopper: null, tokIn: null, tokOut: null, slotX: 0, slotY: 0, slotZ: 0, peerX: 0, peerZ: 0, top, pocketCells: [], depthBars: [] };
      // A part the upgrade moves, placed through the kit at its resting spot (inside its exhibit's footprint, so it
      // stays with that exhibit's cluster); the kit's dry runs get a bare node.
      const part = (w, h, d, color, x, y, z, emissive = 0) => kit.place(kit.createNode({ geometry: kit.M.box({ w, h, d, color, emissive }), position: { x, y, z } }));
      // An emissive pool of light on the floor round an exhibit, in the era's silver-glass tone (gold for the two
      // Bitcoin-line exhibits, Hashcash and bit gold). No point lights.
      const pool = (x, z, r, color, emissive) => kit.place(kit.createNode({ geometry: kit.M.lathe ? kit.M.lathe({ profile: [[0, 0], [r, 0], [r, 0.006], [0, 0.006]], segments: 28, color, emissive }) : kit.M.box({ w: r, h: 0.006, d: r, color, emissive }), position: { x, y: top + 0.002, z } }));
      const POOL = "#9cc4d8", GOLDPOOL = "#f0c860";
      const Z = (u) => era.z1 - u; // u: metres downstream from the way in
      // 2000s workshop palette: brushed silver, graphite, translucent sea-glass and powder blue, citrus accents.
      const C = { silver: "#b9c0c6", graphite: "#3a3f45", glass: "#7fc9c4", powder: "#9cb8d8", citrus: "#d9e36a", bench: "#6a6f74", mat: "#2f3a44", gold: "#e8c35a", ivory: "#e9e6dc" };
      // A bench: a graphite top on silver legs, an obstacle under it, a sign above.
      const bench = (x, z, w, d, title, sub) => {
        solid(w, 0.08, d, C.graphite, x, top + 0.92, z);
        for (const sx of [-1, 1]) for (const sz of [-1, 1]) solid(0.08, 0.88, 0.08, C.silver, x + sx * (w / 2 - 0.1), top + 0.44, z + sz * (d / 2 - 0.1));
        solid(w + 0.6, 0.02, d + 1.6, C.mat, x, top + 0.01, z + 0.5);
        obstacle(x - w / 2, x + w / 2, z - d / 2, z + d / 2);
        sign(title, sub, x, top + 2.7, z - d / 2 + 0.1, 0, 0.42);
        // Aprons under the top, foot rails and rubber feet, a sea-glass edge band, and the mat's citrus front edge.
        detail(kit, x, top, z, (M) => [...[-1, 1].map((s) => B(M, w - 0.2, 0.12, 0.03, "#2c3035", 0, 0.82, s * (d / 2 - 0.06))),
          ...[-1, 1].map((s) => B(M, 0.03, 0.12, d - 0.2, "#2c3035", s * (w / 2 - 0.06), 0.82, 0)),
          ...[-1, 1].map((s) => B(M, w - 0.2, 0.04, 0.04, C.silver, 0, 0.18, s * (d / 2 - 0.1))),
          ...[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b]) => B(M, 0.13, 0.03, 0.13, "#1c1f22", a * (w / 2 - 0.1), 0.015, b * (d / 2 - 0.1))),
          B(M, w + 0.02, 0.025, 0.025, C.glass, 0, 0.95, d / 2, 0.35), B(M, w + 0.6, 0.012, 0.05, C.citrus, 0, 0.022, 0.5 + (d + 1.6) / 2 - 0.05, 0.3)]);
      };
      // A paper lectern: a slanted reading desk, a lit edge in the bench's accent, an obstacle and a small sign.
      const lectern = (x, z, accent, title, sub) => {
        solid(0.5, 1.05, 0.5, C.silver, x, top + 0.525, z);
        solid(1.1, 0.06, 0.8, C.ivory, x, top + 1.1, z);
        solid(1.1, 0.05, 0.05, accent, x, top + 1.14, z + 0.4, 0.8);
        obstacle(x - 0.6, x + 0.6, z - 0.45, z + 0.45);
        sign(title, sub, x, top + 2.1, z + 0.1, 0, 0.36);
        // A plinth and a collar, a brass plaque, the paper lying open with its lines of type, and a small reading lamp.
        detail(kit, x, top, z, (M) => [B(M, 0.72, 0.08, 0.72, C.graphite, 0, 0.04, 0), B(M, 0.56, 0.06, 0.56, "#9aa1a7", 0, 1.0, 0),
          B(M, 0.3, 0.14, 0.012, C.gold, 0, 0.7, 0.256, 0.2),
          ...[-1, 1].map((s) => B(M, 0.42, 0.025, 0.32, "#f6f3e8", s * 0.22, 1.145, -0.02)), B(M, 0.03, 0.04, 0.32, "#7a5a3a", 0, 1.15, -0.02),
          ...[-1, 1].flatMap((s) => [0, 1, 2, 3].map((k) => B(M, 0.3, 0.006, 0.02, "#5a5f66", s * 0.22, 1.16, -0.13 + k * 0.07))),
          B(M, 0.03, 0.34, 0.03, C.silver, 0.46, 1.3, -0.32), B(M, 0.16, 0.05, 0.1, C.silver, 0.42, 1.48, -0.27), B(M, 0.12, 0.02, 0.07, "#ffe9a8", 0.42, 1.45, -0.27, 0.9)]);
      };
      const toy = (id, year, date, title, keys, x, z, w, d, term) => prop({ id, year, date, connection: "context", title, label: `${title.toUpperCase()} · ${year}`, sourceKeys: keys,
        at: { x, y: top, z: z + d / 2 + 0.8 }, reach: 1.9, pick: { w, h: 1.8, d: d + 0.4, x, z }, onUse: () => ({ terminal: term }) });
      const desk = (def, x, z) => prop({ ...def, at: { x, y: top, z: z + 1.25 }, reach: 1.8, pick: { w: 1.2, h: 2, d: 1, x, z } });

      // === Left bank: the idea benches (x = 0.25 - v) ===========================================================
      // Chord, u 20. Ring of 16 tiles on a round-ish table; a pillar on each place a peer holds.
      {
        const z = Z(20), lx = -8.5, bx = -19.5;
        lectern(lx, z, C.glass, "CHORD · AUG 2001", "conference paper - context");
        desk({ id: "e5-chord", year: 2001, connection: "context", date: "27-31 August 2001: the SIGCOMM conference dates printed on the Chord paper; not when all such lookup systems began",
          title: "Chord: find the right peer", label: "CHORD · AUGUST 2001", sourceKeys: ["E5-CHORD"],
          onUse: paper("Chord - August 2001", ["E5-CHORD"],
            ["Find the peer holding your key", "Chord, a conference paper from August 2001, gives a way to find which computer holds a piece of information, even while computers join and leave.", "In its words: \"given a key, it maps the key onto a node.\""],
            ["A lookup, not a ledger", "27-31 August 2001 are the SIGCOMM conference dates printed on the paper. They do not mark when all such lookup systems began.",
              "Chord locates information across changing peers. Its relationship to Bitcoin here is context, not a demonstrated borrowing: Bitcoin does not use Chord."],
            ["Finding is not agreeing", "Lookup alone does not agree who owns something or prevent the same coin being spent twice.", "Try the ring toy beside this lectern: LOOKUP a key, then JOIN or LEAVE a peer."]) }, lx, z);
        bench(bx, z, 4.6, 3.2, "CHORD RING TOY · 2001", "LOOKUP a key / JOIN / LEAVE");
        N.ringX = bx; N.ringZ = z;
        for (let i = 0; i < 16; i++) {
          const a = i / 16 * Math.PI * 2, x = bx + Math.sin(a) * 1.3, tz = z - Math.cos(a) * 1.25;
          N.slot[i * 2] = x; N.slot[i * 2 + 1] = tz;
          solid(0.26, 0.04, 0.26, i % 4 ? C.powder : C.ivory, x, top + 0.98, tz);
          const p = solid(0.16, 0.36, 0.16, C.glass, x, top + 1.18, tz, 0.4); p.visible = !!S.ring.nodes[i]; N.pillars.push(p);
          const c = solid(0.2, 0.06, 0.2, C.gold, x, top + 1.4, tz, 1); c.visible = false; N.caps.push(c);
        }
        N.keyMark = solid(0.12, 0.5, 0.12, C.citrus, bx, top + 1.3, z, 1); N.keyMark.visible = false;
        N.beacon = solid(0.14, 0.14, 0.14, C.citrus, bx, top + 1.05, z - 1.25, 0.9);
        // The lookup's token, hidden until a LOOKUP hops it round the ring.
        N.hopper = part(0.13, 0.13, 0.13, "#fff2b0", bx, top + 1.25, z, 1.2); N.hopper.visible = false;
        pool(bx, z, 3.2, POOL, 0.28); pool(lx, z, 1.4, POOL, 0.35);
        toy("e5-ring", 2001, "2001: the year of the Chord paper this toy illustrates; an original museum model", "Chord ring toy", ["E5-CHORD"], bx, z, 4.6, 3.2, ringTerm);
      }
      // Hashcash, u 31: the 2002 work-stamp manual and a stamp bench.
      {
        const z = Z(31), lx = -8.5, bx = -19.5;
        lectern(lx, z, C.gold, "HASHCASH · 1 AUG 2002", "the paper cited as [6]");
        desk({ id: "e5-hashcash", year: 2002, connection: "citation", ref: "[6]", date: "1 August 2002: the date printed on Adam Back's paper (the 1997 announcement is in Era 4)",
          title: "Hashcash: the work-stamp manual", label: "HASHCASH PAPER · 1 AUGUST 2002", sourceKeys: ["E5-HC", "whitepaper"],
          onUse: paper("Hashcash paper - 1 August 2002", ["E5-HC", "whitepaper"],
            ["Costly to make, cheap to check", "Adam Back's paper, dated 1 August 2002, collects and analyses computational cost-functions and the uses of Hashcash.",
              "It says: \"A cost-function should be efficiently verifiable, but parameterisably expensive to compute.\""],
            ["An older idea, a later paper", "The earlier Hashcash announcement, 28 March 1997, stands in Era 4. This 2002 paper is the one the Bitcoin whitepaper lists as reference [6], and its proof-of-work section builds on the idea.",
              "The paper itself recalls May 1997 as the start; the museum keeps the separately sourced March 1997 announcement date for Era 4."],
            ["Stamps are not a ledger", "A service still has to check and remember spent stamps.", "A stamp proves work was done for one message; it is not a shared payment history that strangers agree on."]) }, lx, z);
        bench(bx, z, 4, 2.4, "WORK-STAMP BENCH · 2002", "MAKE a stamp / CHECK it");
        // The era's clearest light: gold pools under the cited paper and its bench.
        pool(lx, z, 1.6, GOLDPOOL, 0.75); pool(bx, z, 3.0, GOLDPOOL, 0.5);
        for (let i = 0; i < 10; i++) { const m = solid(0.28, 0.12 + i * 0.05, 0.28, i < 7 ? C.glass : C.citrus, bx - 1.5 + i * 0.33, top + 1.02 + (0.12 + i * 0.05) / 2, z - 0.6, 0.5); m.visible = false; N.meter.push(m); }
        N.stampTile = solid(0.7, 0.03, 0.5, C.gold, bx + 1.2, top + 0.98, z + 0.5, 0.7); N.stampTile.visible = false;
        toy("e5-stamp", 2002, "2002: the year of the Hashcash paper this toy illustrates; an original museum model", "Work-stamp bench", ["E5-HC"], bx, z, 4, 2.4, stampTerm);
      }
      // RPOW, u 45: the announcement lectern, the exchange desk and the sealed cabinet.
      {
        const z = Z(45), lx = -8.5, bx = -16, cx = -25;
        lectern(lx, z, C.powder, "RPOW · 15 AUG 2004", "announcement - context");
        desk({ id: "e5-rpow", year: 2004, connection: "context", date: "15 August 2004, 10:43:09 PDT: Hal Finney's announcement email",
          title: "RPOW: reuse a token", label: "RPOW · 15 AUGUST 2004", sourceKeys: ["E5-RPOW"],
          onUse: paper("RPOW - 15 August 2004", ["E5-RPOW"],
            ["Swap a used token for a fresh one", "Hal Finney announced RPOW on 15 August 2004; the email is stamped 10:43:09 PDT.",
              "It exchanges spent proof-of-work tokens for fresh signed tokens and rejects reuse of inputs: \"But they are reusable, unlike hashcash.\""],
            ["The server and its sealed hardware", "RPOW makes tokens reusable through a server. Its 2004 deployment used an IBM 4758 secure coprocessor, described as FIPS 140 level 4, whose software configuration could be attested.",
              "That dates its documented use, not the hardware's introduction. The cabinet beside this desk is a fictional model: it compares a fingerprint, and performs no real attestation."],
            ["Still one server", "It depends on an operating server and its attested trusted hardware; early beta resets could invalidate tokens.",
              "Context: RPOW is not a whitepaper reference, and no direct influence is claimed. It is not decentralised consensus."]) }, lx, z);
        bench(bx, z, 3.4, 2, "RPOW EXCHANGE DESK · 2004", "WORK / EXCHANGE / reuse refused");
        // Two tokens on the desk's trays: a spent one (powder) for the slot, a fresh signed one (glass) coming out.
        N.tokIn = part(0.16, 0.035, 0.11, C.powder, bx + 0.08, top + 1.03, z - 0.2, 0.3);
        N.tokOut = part(0.16, 0.035, 0.11, C.glass, bx + 0.72, top + 1.03, z - 0.2, 0.6);
        N.slotX = bx - 0.8; N.slotY = top + 1.32; N.slotZ = z + 0.02;
        pool(bx, z, 2.9, POOL, 0.28); pool(lx, z, 1.4, POOL, 0.35); pool(cx, z, 1.5, POOL, 0.25);
        solid(0.9, 0.5, 0.6, C.silver, bx - 0.8, top + 1.21, z - 0.3); solid(0.3, 0.04, 0.4, C.graphite, bx - 0.8, top + 1.48, z);
        // The exchange box's slot, its in and out trays, and a keyboard on the desk.
        detail(kit, bx, top, z, (M) => [B(M, 0.5, 0.03, 0.02, "#13181d", -0.8, 1.32, 0.005), B(M, 0.12, 0.08, 0.02, "#5ef08a", -0.45, 1.32, 0.005, 0.8),
          ...[-1, 1].map((s) => B(M, 0.5, 0.05, 0.36, s < 0 ? C.powder : C.glass, 0.4 + s * 0.32, 0.985, -0.2)),
          B(M, 0.8, 0.03, 0.26, "#2c3035", 0.5, 0.975, 0.5), ...[0, 1, 2].map((k) => B(M, 0.72, 0.01, 0.05, "#c9cdd1", 0.5, 0.995, 0.42 + k * 0.08))]);
        toy("e5-rpow-desk", 2004, "2004: the year of the RPOW announcement this toy illustrates; an original museum model", "RPOW exchange desk", ["E5-RPOW"], bx, z, 3.4, 2, rpowTerm);
        // Sealed cabinet: a generic graphite box, fictional indicator lights, a seal band.
        solid(1.8, 2.4, 1.2, C.graphite, cx, top + 1.2, z);
        solid(1.84, 0.12, 1.24, C.silver, cx, top + 1.6, z);
        solid(0.5, 0.3, 0.04, "#13181d", cx - 0.4, top + 2.0, z + 0.62);
        N.cabGreen = solid(0.14, 0.14, 0.04, "#5ef08a", cx + 0.3, top + 2.0, z + 0.63, 1.2); N.cabGreen.visible = false;
        N.cabRed = solid(0.14, 0.14, 0.04, "#ff6a5e", cx + 0.55, top + 2.0, z + 0.63, 1.2); N.cabRed.visible = false;
        N.cabBusy = solid(0.08, 0.08, 0.04, C.citrus, cx - 0.7, top + 1.25, z + 0.63, 1);
        for (let i = 0; i < 6; i++) solid(1.4, 0.04, 0.02, "#2a2e33", cx, top + 0.4 + i * 0.12, z + 0.61);
        obstacle(cx - 1, cx + 1, z - 0.7, z + 0.7);
        // Rack rails, a plinth and a cap, a door handle, the red seal across the door's seam, a label plate and the
        // small display's bezel.
        detail(kit, cx, top, z, (M) => [B(M, 1.9, 0.1, 1.3, "#1c1f22", 0, 0.05, 0), B(M, 1.9, 0.08, 1.3, C.silver, 0, 2.44, 0),
          ...[-1, 1].map((s) => B(M, 0.06, 2.2, 0.04, C.silver, s * 0.85, 1.2, 0.62)), B(M, 0.05, 0.5, 0.07, C.silver, 0.72, 1.45, 0.65),
          B(M, 0.12, 0.6, 0.012, "#c8403a", 0, 1.62, 0.612, 0.25), B(M, 0.5, 0.1, 0.01, C.ivory, 0.42, 1.78, 0.612), B(M, 0.6, 0.4, 0.015, "#2a2e33", -0.4, 2.0, 0.607),
          ...[0, 1, 2, 3, 4].map((k) => B(M, 0.5, 0.025, 0.012, "#0e1114", -0.4, 2.3 - k * 0.05 - 0.6, 0.612))]);
        sign("SEALED SERVER CABINET · 2004", "fingerprint comparison demo - not real attestation", cx, top + 3.1, z + 0.6, 0, 0.42);
        prop({ id: "e5-cabinet", year: 2004, connection: "context", date: "2004: RPOW's documented use of a secure coprocessor, not that hardware's introduction; the comparison is a museum demonstration",
          title: "Sealed server cabinet", label: "SEALED SERVER CABINET · 2004", sourceKeys: ["E5-RPOW"],
          at: { x: cx, y: top, z: z + 1.6 }, reach: 1.9, pick: { w: 2, h: 2.6, d: 1.4, x: cx, z }, onUse: () => ({ terminal: cabTerm }) });
      }
      // Bit gold, u 60: the essay lectern (clear of the lamp by x -8, u 57) and the bench of chained strings.
      {
        const z = Z(61), lx = -11.5, bx = -21;
        lectern(lx, z, C.gold, "BIT GOLD · DEC 2005", "qualified date - documented influence");
        desk({ id: "e5-bitgold", year: 2005, connection: "influence",
          date: "December 2005, qualified: SNI dates the text 29 December 2005, while the author's current page displays 27 December 2008; influence documented by Satoshi's retrospective post of 20 July 2010",
          title: "Bit gold: costly bits, recorded owners", label: "BIT GOLD · DECEMBER 2005 (QUALIFIED)", sourceKeys: ["E5-BG", "E5-BG-AUTHOR", "E5-ATTR"],
          onUse: paper("Bit gold - December 2005 qualified", ["E5-BG", "E5-BG-AUTHOR", "E5-ATTR"],
            ["Costly bits, recorded owners", "Nick Szabo's bit gold proposal combines work, timestamps and an ownership registry for scarce digital objects.",
              "\"The last-created string of bit gold provides the challenge bits\" for the next one."],
            ["Why the date is qualified", "The Satoshi Nakamoto Institute dates its text 29 December 2005. The author's current page displays 27 December 2008, despite its 2005 address. So this plaque says December 2005, qualified.",
              "It is not shown here as a verified 1998 publication.",
              "Documented influence: Satoshi's retrospective forum post of 20 July 2010 calls Bitcoin an implementation of b-money and \"Nick Szabo's Bitgold proposal\". That later attribution does not show when any idea was met or borrowed."],
            ["Unequal units, open registry", "Different hardware and production periods make units unequal.", "Who keeps the ownership registry, and why it can be trusted, remain important design questions."]) }, lx, z);
        bench(bx, z, 4, 2.2, "BIT GOLD BENCH · 2005", "MINT / HARDWARE SLOW / OWNER");
        pool(lx, z, 1.6, GOLDPOOL, 0.75); pool(bx, z, 3.0, GOLDPOOL, 0.5);
        for (let i = 0; i < GOLD_MAX; i++) { const b = solid(0.42, 0.16, 0.24, C.gold, bx - 1.4 + i * 0.56, top + 1.04, z - 0.4, 0.6); b.visible = false; N.bars.push(b); }
        for (let i = 0; i < GOLD_MAX - 1; i++) solid(0.14, 0.03, 0.05, C.silver, bx - 1.12 + i * 0.56, top + 1.0, z - 0.4);
        toy("e5-bitgold-bench", 2005, "2005: the qualified year of the bit gold essay this toy illustrates; an original museum model", "Bit gold bench", ["E5-BG"], bx, z, 4, 2.2, goldTerm);
      }

      // === Right bank: the peer bench and period gear (x = 7.25 + v) =============================================
      // GPS sharpening, u 17: a receiver plinth with two illustrative circles and two slow satellites above.
      {
        const z = Z(17), x = 18;
        pool(x, z, 2.3, POOL, 0.25);
        solid(1.4, 0.9, 1.4, C.silver, x, top + 0.45, z); solid(3.4, 0.03, 3.4, C.mat, x, top + 0.92, z);
        solid(0.5, 0.2, 0.3, C.graphite, x, top + 1.05, z + 0.9); solid(0.36, 0.12, 0.02, C.glass, x, top + 1.08, z + 1.06, 0.6);
        solid(0.12, 0.12, 0.12, C.citrus, x, top + 0.99, z, 1.1);
        for (let i = 0; i < 20; i++) {
          const a = i / 20 * Math.PI * 2;
          const wd = solid(0.18, 0.03, 0.18, "#e98d6a", x + Math.sin(a) * 1.5, top + 0.95, z + Math.cos(a) * 1.5, 0.7); N.wide.push(wd);
          const tt = solid(0.1, 0.03, 0.1, C.glass, x + Math.sin(a) * 0.45, top + 0.95, z + Math.cos(a) * 0.45, 0.9); tt.visible = false; N.tight.push(tt);
        }
        N.satX = x; N.satZ = z; N.satR = 1.6; N.satY = top + 3.3;
        for (let i = 0; i < 2; i++) { const s = solid(0.3, 0.12, 0.12, C.silver, x, N.satY, z, 0.3); N.sats.push(s); }
        obstacle(x - 1.7, x + 1.7, z - 1.7, z + 1.7);
        // The plinth's foot and lit lip, the receiver's antenna and keys, and a small dish on a post at the back.
        detail(kit, x, top, z, (M) => [B(M, 1.5, 0.06, 1.5, C.graphite, 0, 0.03, 0), B(M, 1.46, 0.03, 1.46, C.glass, 0, 0.885, 0, 0.3),
          B(M, 0.03, 0.34, 0.03, "#1c1f22", 0.19, 1.32, 0.86), B(M, 0.05, 0.05, 0.05, C.citrus, 0.19, 1.5, 0.86, 0.8),
          ...[0, 1, 2, 3, 4].map((k) => B(M, 0.05, 0.02, 0.04, C.silver, -0.16 + k * 0.08, 1.16, 0.94)),
          B(M, 0.05, 0.9, 0.05, C.silver, 0.55, 1.35, -0.55), B(M, 0.44, 0.05, 0.44, C.ivory, 0.55, 1.82, -0.55), B(M, 0.06, 0.12, 0.06, C.graphite, 0.55, 1.9, -0.55)]);
        sign("GPS SHARPENS · MAY 2000", "announced 1 May / changed 2 May - illustrative circles", x, top + 2.4, z + 1.6, 0, 0.4);
        prop({ id: "e5-gps", year: 2000, connection: "context", date: "1 May 2000: the announcement; 2 May 2000, just after midnight EDT: the change took effect",
          title: "GPS sharpens", label: "GPS SHARPENS · MAY 2000", sourceKeys: ["E5-GPS", "E5-GPS-WH"],
          at: { x, y: top, z: z + 2.5 }, reach: 1.9, pick: { w: 3.4, h: 1.6, d: 3.4, x, z }, onUse: () => ({ terminal: gpsTerm }) });
      }
      // Volunteer encyclopedia, u 17 further back: a kiosk with a flat screen on a pole.
      {
        const z = Z(17), x = 31;
        pool(x, z, 1.3, POOL, 0.3);
        solid(1.2, 1.0, 0.8, C.powder, x, top + 0.5, z); solid(0.12, 0.8, 0.12, C.silver, x, top + 1.4, z);
        solid(1.4, 0.95, 0.08, C.graphite, x, top + 2.1, z + 0.05);
        solid(1.24, 0.8, 0.02, C.ivory, x, top + 2.1, z + 0.1, 0.5);
        for (let i = 0; i < 8; i++) { const l = solid(0.9 - (i % 3) * 0.15, 0.04, 0.01, C.graphite, x - 0.1, top + 2.42 - i * 0.085, z + 0.12); l.visible = i < 1; N.lines.push(l); }
        obstacle(x - 0.75, x + 0.75, z - 0.5, z + 0.5);
        // A keyboard shelf on a bracket, the base's foot and front panel, the screen's camera dot and a pole collar.
        detail(kit, x, top, z, (M) => [B(M, 1.3, 0.06, 0.9, C.graphite, 0, 0.03, 0), B(M, 0.9, 0.55, 0.012, C.ivory, 0, 0.5, 0.406),
          B(M, 0.08, 0.1, 0.3, C.silver, 0, 0.98, 0.45), B(M, 0.92, 0.04, 0.36, C.graphite, 0, 1.05, 0.52),
          ...[0, 1, 2].map((k) => B(M, 0.8, 0.012, 0.06, "#c9cdd1", 0, 1.077, 0.42 + k * 0.09)),
          B(M, 0.2, 0.06, 0.2, C.silver, 0, 1.03, 0), B(M, 0.05, 0.05, 0.02, "#13181d", 0, 2.53, 0.105), B(M, 1.44, 0.04, 0.1, C.silver, 0, 1.6, 0.05)]);
        sign("VOLUNTEER ENCYCLOPEDIA · 2001", "anyone may EDIT / every revision kept", x, top + 3.1, z + 0.2, 0, 0.4);
        prop({ id: "e5-wiki", year: 2001, connection: "context", date: "January 2001: the launch month of a volunteer-written online encyclopedia; no exact day is claimed",
          title: "Volunteer encyclopedia", label: "VOLUNTEER ENCYCLOPEDIA · 2001", sourceKeys: ["E5-WIKI", "E5-WIKI-CA"],
          at: { x, y: top, z: z + 1.3 }, reach: 1.9, pick: { w: 1.6, h: 2.8, d: 1, x, z }, onUse: () => ({ terminal: wikiTerm }) });
      }
      // Pocket music player, u 34 (behind the right lamp at x 22, u 36): a big generic box with arrow buttons.
      {
        const z = Z(32), x = 30;
        pool(x, z, 1.8, POOL, 0.28);
        solid(2.4, 0.9, 1.4, C.bench, x, top + 0.45, z);
        solid(0.9, 1.4, 0.24, C.ivory, x, top + 1.6, z);
        solid(0.7, 0.5, 0.02, "#22323c", x, top + 1.98, z + 0.13, 0.4);
        for (const [bx2, by2] of [[0, 0.22], [0, -0.22], [-0.22, 0], [0.22, 0]]) solid(0.12, 0.12, 0.03, C.silver, x + bx2, top + 1.32 + by2, z + 0.13);
        solid(0.14, 0.14, 0.03, C.citrus, x, top + 1.32, z + 0.13, 0.6);
        for (let i = 0; i < PLAYER_CAP; i++) { const c = solid(0.055, 0.05, 0.01, C.glass, x - 0.27 + i * 0.06, top + 1.8, z + 0.145, 0.9); c.visible = false; N.cap.push(c); }
        obstacle(x - 1.2, x + 1.2, z - 0.7, z + 0.7);
        // The device's chrome back and rounded rims, a ring of a wheel round its buttons, a hold switch, the screen's
        // menu lines, and the earphones' cord down its side to the buds lying on the plinth.
        detail(kit, x, top, z, (M) => [B(M, 2.5, 0.05, 1.5, C.graphite, 0, 0.925, 0), B(M, 0.92, 1.36, 0.02, "#c9ced3", 0, 1.6, -0.13),
          ...[-1, 1].map((s) => B(M, 0.86, 0.025, 0.26, "#f4f2ea", 0, 1.6 + s * 0.71, 0)), disc(M, 0.34, 0.012, "#d7d9db", 0, 1.32, 0.122),
          B(M, 0.08, 0.03, 0.05, "#e98d6a", -0.3, 2.33, 0), B(M, 0.04, 0.03, 0.04, "#1c1f22", 0.3, 2.33, 0),
          ...[0, 1, 2, 3].map((k) => B(M, k ? 0.5 : 0.6, 0.025, 0.006, k === 1 ? C.citrus : C.glass, 0, 2.16 - k * 0.09, 0.142, 0.7)),
          B(M, 0.015, 1.4, 0.015, "#f2f2f2", 0.47, 1.62, 0), B(M, 0.5, 0.015, 0.015, "#f2f2f2", 0.72, 0.915, 0.1),
          ...[0.95, 1.05].map((bx2, k) => B(M, 0.08, 0.08, 0.08, "#f2f2f2", bx2, 0.94, 0.1 + k * 0.14))]);
        sign("POCKET DISK PLAYER · 2001", "announced 23 Oct / available 10 Nov - silent model", x, top + 3, z + 0.3, 0, 0.4);
        prop({ id: "e5-player", year: 2001, connection: "context", date: "23 October 2001: announcement; 10 November 2001: availability",
          title: "Pocket disk player", label: "POCKET DISK PLAYER · 2001", sourceKeys: ["E5-GEAR"],
          at: { x, y: top, z: z + 1.5 }, reach: 1.9, pick: { w: 2.4, h: 2.4, d: 1.4, x, z }, onUse: () => ({ terminal: playerTerm }) });
      }
      // BitTorrent, u 48: the paper lectern by the water and the piece mosaic behind it.
      {
        const z = Z(48), lx = 16, bx = 27;
        lectern(lx, z, C.glass, "BITTORRENT PAPER · 22 MAY 2003", "paper date, not launch - context");
        desk({ id: "e5-bittorrent", year: 2003, connection: "context", date: "22 May 2003: the date printed on Bram Cohen's technical paper, not BitTorrent's launch date",
          title: "BitTorrent: share the pieces", label: "BITTORRENT PAPER · 22 MAY 2003", sourceKeys: ["E5-BT"],
          onUse: paper("BitTorrent paper - 22 May 2003", ["E5-BT"],
            ["Share the pieces", "Bram Cohen's technical paper, dated 22 May 2003, describes downloaders who \"upload pieces of the file to each other\".",
              "22 May 2003 is the date printed on the paper, not BitTorrent's launch date, which this museum does not give."],
            ["Spreading the cost of uploading", "Downloaders exchange file pieces and spread the upload costs among themselves, instead of one server sending everything.",
              "Like Chord, this is context for Bitcoin: no demonstrated borrowing is claimed here."],
            ["Copies are not consensus", "File replication does not provide monetary consensus.", "Everyone can hold the same pieces and still disagree about who owns a coin."]) }, lx, z);
        bench(bx, z, 4.2, 2.6, "PIECE MOSAIC · 2003", "FETCH pieces from three peers");
        const art = ["#e98d6a", "#e8c35a", "#7fc9c4", "#9cb8d8", "#d9e36a", "#c58fc9"];
        for (let i = 0; i < 12; i++) {
          const tx = bx - 1.25 + (i % 4) * 0.83, tz = z - 0.65 + Math.floor(i / 4) * 0.62;
          solid(0.74, 0.02, 0.54, C.mat, tx, top + 0.97, tz);
          const t = solid(0.7, 0.04, 0.5, art[(i * 5 + Math.floor(i / 4)) % 6], tx, top + 1.0, tz, 0.5); t.visible = false; N.tiles.push(t);
        }
        for (let i = 0; i < 3; i++) solid(0.5, 0.7, 0.4, [C.gold, C.powder, "#e98d6a"][i], bx + 2.8, top + 0.35, z - 1 + i, 0.2);
        N.peerX = bx + 2.8; N.peerZ = z;
        pool(bx + 0.4, z, 3.3, POOL, 0.28); pool(lx, z, 1.4, POOL, 0.35);
        obstacle(bx + 2.5, bx + 3.1, z - 1.3, z + 1.3);
        toy("e5-mosaic", 2003, "2003: the year of the BitTorrent paper this toy illustrates; an original museum model", "Piece mosaic", ["E5-BT"], bx, z, 4.2, 2.6, mosaicTerm);
      }

      // === Period-gear cluster (upgrade): three stations on one mat at u 60 on the right side, x 13 to 33, between
      // the BitTorrent bench and the far shelf, clear of the right loft (x 37 and beyond) and the gold walk. A packet
      // puzzle that leans on the BitTorrent lectern and the RPOW desk for its story, a schematic CRT and flat-panel
      // comparison, and a pattern player toy. The two games are modules of their own (genesis-era-5-patchwork.js,
      // genesis-era-5-mixtape.js); until a page loads them, their stations say so on a board.
      {
        const z = Z(60), xs = [16, 23, 30];
        solid(20, 0.02, 4.4, C.mat, 23, top + 0.01, z + 0.6);
        sign("PERIOD GEAR · 2000s", "modern museum toys and a schematic comparison", 23, top + 3.1, z - 1.2, 0, 0.42);
        const missing = (what) => ({ board: { room: "Not loaded yet", sources: ["E5-DOSSIER"], pages: [{ caption: "Coming soon", title: `${what} is not on this page yet`,
          text: ["This station's game is its own module, and this page has not loaded it yet.", "Everything else in the cave works as before."] }] } });
        // 1. Peer Patchwork: three peers' 3x3 boards on a table, each tile lit while that peer holds the piece.
        {
          const x = xs[0], PW = BL.genesisEra5Patchwork, ART = ["#5ec8ff", "#ffd23a", "#5ec8ff", "#46ffd2", "#ffb02e", "#46ffd2", "#6fae3a", "#3a6e24", "#6fae3a"];
          pool(x, z, 2.0, POOL, 0.3);
          if (PW) { S.patch = PW.puzzle(); S.patch.deal(2003); }
          solid(3.2, 0.08, 1.4, C.graphite, x, top + 0.86, z);
          solid(2.9, 0.82, 1.1, C.bench, x, top + 0.41, z);
          for (let peer = 0; peer < 3; peer++) for (let i = 0; i < 9; i++) {
            const tx = x - 1.05 + peer * 1.05 + (i % 3 - 1) * 0.26, tz = z - 0.26 + Math.floor(i / 3) * 0.26;
            const t = solid(0.22, 0.03, 0.22, ART[i], tx, top + 0.92, tz, 0.5); t.visible = !!(S.patch && S.patch.holds(peer, i)); N.patchTiles.push(t);
          }
          obstacle(x - 1.6, x + 1.6, z - 0.7, z + 0.7);
          // A frame round each peer's board, a lettered plate and an upload lamp for each on the table's front, the
          // links between the boards, and a kick plate.
          detail(kit, x, top, z, (M) => [B(M, 2.96, 0.08, 1.16, "#1c1f22", 0, 0.04, 0),
            ...[0, 1, 2].flatMap((peer) => { const px = -1.05 + peer * 1.05; return [B(M, 0.86, 0.025, 0.04, C.silver, px, 0.912, -0.43), B(M, 0.86, 0.025, 0.04, C.silver, px, 0.912, 0.43),
              B(M, 0.04, 0.025, 0.82, C.silver, px - 0.43, 0.912, 0), B(M, 0.04, 0.025, 0.82, C.silver, px + 0.43, 0.912, 0),
              B(M, 0.3, 0.14, 0.015, C.ivory, px - 0.08, 0.6, 0.556), ...[0, 1, 2].map((k) => B(M, 0.025, 0.08, 0.006, C.graphite, px - 0.16 + k * 0.08, 0.6, 0.566)),
              B(M, 0.08, 0.08, 0.02, C.glass, px + 0.2, 0.6, 0.56, 1)]; }),
            ...[0, 1].map((k) => B(M, 0.18, 0.015, 0.03, C.citrus, -0.525 + k * 1.05, 0.906, 0, 0.5))]);
          sign("PEER PATCHWORK", "share pieces so all three finish", x, top + 1.9, z + 0.2, 0, 0.3);
          prop({ id: "e5-patchwork", year: 2003, connection: "context", date: "2003: the year of the BitTorrent paper that inspired this original puzzle; a modern museum homage, not historical software",
            title: "Peer Patchwork puzzle", label: "PEER PATCHWORK · 2003-INSPIRED HOMAGE", sourceKeys: ["E5-BT"],
            at: { x, y: top, z: z + 1.5 }, reach: 1.9, pick: { w: 3.2, h: 1.4, d: 1.6, x, z },
            onUse: () => !S.patch ? missing("Peer Patchwork") : ({ terminal: patchTerm() }) });
        }
        // 2. CRT beside flat panel, schematic: a deep box with its glass, and a thin panel on a stand, on one plinth.
        {
          const x = xs[1];
          solid(3, 0.7, 1.6, C.silver, x, top + 0.35, z);
          const cx = x - 0.75, fx = x + 0.75;
          solid(0.95, 0.78, 0.9, "#c9c4b6", cx, top + 1.09, z - 0.05);
          solid(0.8, 0.62, 0.02, "#1d3a46", cx, top + 1.11, z + 0.41, 0.35);
          solid(0.6, 0.5, 0.25, "#b7b2a4", cx, top + 1.05, z - 0.6);
          solid(1.0, 0.64, 0.06, C.graphite, fx, top + 1.42, z + 0.2);
          solid(0.92, 0.56, 0.02, "#1d3a46", fx, top + 1.42, z + 0.24, 0.35);
          solid(0.08, 0.36, 0.06, C.graphite, fx, top + 0.92, z + 0.15);
          solid(0.5, 0.03, 0.3, C.graphite, fx, top + 0.715, z + 0.15);
          // Depth guides on the plinth: one bar as deep as each model, drawn to the same schematic scale.
          N.depthBars.push(solid(0.06, 0.02, 1.15, C.citrus, cx + 0.55, top + 0.71, z - 0.15, 0.6));
          N.depthBars.push(solid(0.06, 0.02, 0.3, C.citrus, fx + 0.55, top + 0.71, z + 0.15, 0.6));
          pool(x, z, 2.0, POOL, 0.3);
          obstacle(x - 1.55, x + 1.55, z - 0.85, z + 0.85);
          // The tube's bezel, vents and power lamp, faint lines on its glass; the panel's buttons and lamp; a kick plate.
          detail(kit, x, top, z, (M) => [B(M, 3.02, 0.06, 1.62, "#1c1f22", 0, 0.03, 0),
            B(M, 0.92, 0.05, 0.02, "#b7b2a4", cx - x, 1.445, 0.415), B(M, 0.92, 0.05, 0.02, "#b7b2a4", cx - x, 0.775, 0.415),
            ...[-1, 1].map((sd) => B(M, 0.05, 0.62, 0.02, "#b7b2a4", cx - x + sd * 0.435, 1.11, 0.415)), B(M, 0.05, 0.03, 0.02, "#5ef08a", cx - x + 0.35, 0.765, 0.43, 1),
            ...[0, 1, 2, 3].map((k) => B(M, 0.6, 0.01, 0.03, "#8f8a7c", cx - x, 1.485, -0.35 + k * 0.1)),
            ...[0, 1, 2, 3, 4].map((k) => B(M, 0.72, 0.006, 0.004, "#3d6f80", cx - x, 0.88 + k * 0.11, 0.424, 0.4)),
            ...[0, 1, 2].map((k) => B(M, 0.04, 0.02, 0.02, "#9aa1a7", fx - x + 0.22 + k * 0.06, 1.12, 0.235)), B(M, 0.03, 0.02, 0.01, C.glass, fx - x - 0.4, 1.12, 0.235, 1)]);
          sign("CRT AND FLAT PANEL", "schematic: no product or measurement", x, top + 2.4, z + 0.3, 0, 0.3);
          prop({ id: "e5-displays", year: "2000s", connection: "context", date: "2000-2007: the period illustrated; a schematic comparison, with no product, measurement or introduction date claimed",
            title: "CRT and flat panel compared", label: "CRT AND FLAT PANEL · 2000s (SCHEMATIC)", sourceKeys: ["E5-DOSSIER"],
            at: { x, y: top, z: z + 1.65 }, reach: 1.9, pick: { w: 3, h: 1.9, d: 1.6, x, z },
            onUse: () => (revealDisplays(), { board: { room: "CRT and flat panel - schematic", sources: ["E5-DOSSIER"], pages: [
              { caption: "In short", title: "Two ways to show a picture", text: ["On the left, a deep box with glass at its front stands for a tube display; on the right, a thin panel on a stand stands for a flat one.",
                "The yellow bars on the plinth show each model's depth at the same schematic scale."] },
              { caption: "Why schematic", title: "Numbers kept on HOLD", text: ["This museum has not verified any particular display's dimensions, weight or screen size, so none are given.",
                "The models are original shapes, not any product, and the picture does not claim when either kind was introduced."] },
              { caption: "Context", title: "Period gear, not a Bitcoin step", text: ["Displays changed how these years looked; they are context for the era, not something the whitepaper cites or drew on."] }
            ] } }) });
        }
        // 3. Pattern Pocket: an enlarged generic slab on a pedestal, a square button grid, and a storage bar that fills
        // as the playlist does.
        {
          const x = xs[2], MX = BL.genesisEra5Mixtape;
          if (MX) S.pocket = MX.player();
          solid(0.9, 0.9, 0.7, C.bench, x, top + 0.45, z);
          solid(0.62, 1.1, 0.14, C.powder, x, top + 1.45, z);
          solid(0.5, 0.42, 0.02, "#13181d", x, top + 1.72, z + 0.08, 0.3);
          for (let i = 0; i < 4; i++) solid(0.12, 0.12, 0.03, C.silver, x - 0.09 + (i % 2) * 0.18, top + 1.22 - Math.floor(i / 2) * 0.17, z + 0.08);
          solid(0.4, 0.07, 0.03, C.citrus, x, top + 0.98, z + 0.08, 0.4);
          for (let i = 0; i < 10; i++) { const c = solid(0.035, 0.05, 0.01, C.glass, x - 0.2 + i * 0.045, top + 1.55, z + 0.095, 0.9); c.visible = false; N.pocketBar.push(c); }
          // The screen's 4x4 cells, dark until the playlist plays (the toy's own six original patterns).
          for (let q = 0; q < 16; q++) { const c = part(0.07, 0.06, 0.008, ["#ffd23a", "#46ffd2", "#5ec8ff", "#ff5fa2"][q & 3], x - 0.135 + (q & 3) * 0.09, top + 1.85 - (q >> 2) * 0.075, z + 0.092, 1); c.visible = false; N.pocketCells.push(c); }
          pool(x, z, 1.1, POOL, 0.32);
          obstacle(x - 0.5, x + 0.5, z - 0.4, z + 0.4);
          // The slab's rims, the storage bar's dark frame, the pedestal's foot and lip, and earphones lying on top.
          detail(kit, x, top, z, (M) => [B(M, 0.94, 0.06, 0.74, C.graphite, 0, 0.03, 0), B(M, 0.94, 0.03, 0.74, C.silver, 0, 0.885, 0),
            ...[-1, 1].map((sd) => B(M, 0.66, 0.025, 0.16, "#c4d6ea", 0, 1.45 + sd * 0.55, 0)), B(M, 0.48, 0.08, 0.005, "#13181d", 0, 1.55, 0.086),
            ...[-1, 1].map((sd) => B(M, 0.07, 0.07, 0.07, "#f2f2f2", sd * 0.24, 0.935, 0.22)), B(M, 0.48, 0.012, 0.012, "#f2f2f2", 0, 0.906, 0.26)]);
          sign("PATTERN POCKET", "make a playlist that fits", x, top + 2.4, z + 0.2, 0, 0.3);
          prop({ id: "e5-pocket", year: "2000s", connection: "context", date: "2000-2007: the period illustrated; a modern museum homage with original patterns, not any product or historical software",
            title: "Pattern Pocket player toy", label: "PATTERN POCKET · 2000s HOMAGE", sourceKeys: ["E5-GEAR"],
            at: { x, y: top, z: z + 1.25 }, reach: 1.9, pick: { w: 1, h: 2.2, d: 0.8, x, z },
            onUse: () => !S.pocket ? missing("Pattern Pocket") : ({ terminal: pocketTerm() }) });
        }
      }

      // === The lofts: alcoves high on the back walls, reached with the jetpack ===================================
      // Each alcove: two silver columns down to the bank (with an obstacle), a shelf at 4.5 m, a back panel and a lit
      // lip. Its exhibit's use point hovers at the shelf, so it is used while flying; its words are in the overview.
      const loft = (x, z, side, accent) => {
        const sy = top + 4.5;
        for (const dz of [-1.3, 1.3]) { solid(0.3, 4.5, 0.3, C.silver, x, top + 2.25, z + dz); obstacle(x - 0.2, x + 0.2, z + dz - 0.2, z + dz + 0.2); }
        solid(2.2, 0.25, 3, C.graphite, x, sy - 0.125, z);
        solid(0.12, 2.4, 3, C.bench, x + side * 1.05, sy + 1.2, z);
        solid(0.08, 0.08, 3, accent, x - side * 1.08, sy + 0.02, z, 1);
        solid(0.08, 0.08, 2.9, accent, x + side * 1, sy + 2.4, z, 1);
        return sy;
      };
      {
        const x = -31, z = Z(40), sy = loft(x, z, -1, C.gold);
        solid(1.2, 0.8, 0.6, C.ivory, x - 0.3, sy + 0.4, z);
        for (let i = 0; i < 3; i++) solid(0.3, 0.3, 0.05, [C.gold, C.powder, C.citrus][i], x - 0.3 + (i - 1) * 0.36, sy + 0.95, z + 0.32, 0.6);
        sign("TRUST LOFT · 2002-2005", "fly up: who must you trust?", x + 0.4, sy + 1.9, z + 1.4, -Math.PI / 2, 0.36);
        sign("LOFT ABOVE · 2002-2005", "jetpack: hold Space in the air", x + 2.4, top + 2.2, z, -Math.PI / 2, 0.32);
        obstacle(x + 2.25, x + 2.55, z - 0.15, z + 0.15);
        solid(0.1, 1.9, 0.1, C.silver, x + 2.4, top + 0.95, z);
        prop({ id: "e5-loft-trust", year: 2002, connection: "context", date: "2002-2005: the Hashcash paper, the RPOW announcement and the bit gold essay, compared",
          title: "Trust loft: who must you trust?", label: "TRUST LOFT · 2002-2005", sourceKeys: ["E5-HC", "E5-RPOW", "E5-BG"],
          at: { x: x + 0.6, y: sy, z }, reach: 1.6, pick: { w: 2.2, h: 1.6, d: 3, x, z },
          onUse: () => ({ board: { room: "Trust loft - 2002 to 2005", sources: ["E5-HC", "E5-RPOW", "E5-BG"], pages: [
            { caption: "Compare", title: "Three benches, three boundaries", text: TRUST },
            { caption: "Still open", title: "The question they left", text: ["Each design moves trust somewhere: to a service's spent list, to one server and its hardware, or to a registry not yet designed.",
              "None of these shows Bitcoin was inevitable. The same comparison is on the overview board by the gateway."] }
          ] } }) });
      }
      {
        const x = 39.5, z = Z(58), sy = loft(x, z, 1, C.glass);
        for (let i = 0; i < 5; i++) solid(0.24, 0.24, 0.24, i === 4 ? C.citrus : C.powder, x - 0.2, sy + 0.12, z - 1.1 + i * 0.55, 0.5);
        sign("ROUTING LOFT · 2001", "fly up: an original routing puzzle", x - 0.4, sy + 1.9, z + 1.4, Math.PI / 2, 0.36);
        sign("LOFT ABOVE · 2001", "jetpack: hold Space in the air", x - 2.4, top + 2.2, z, Math.PI / 2, 0.32);
        obstacle(x - 2.55, x - 2.25, z - 0.15, z + 0.15);
        solid(0.1, 1.9, 0.1, C.silver, x - 2.4, top + 0.95, z);
        prop({ id: "e5-loft-route", year: 2001, connection: "context", date: "2001: the year of the Chord paper that inspired this original puzzle; not a historical game",
          title: "Routing loft puzzle", label: "ROUTING LOFT · 2001", sourceKeys: ["E5-CHORD"],
          at: { x: x - 0.6, y: sy, z }, reach: 1.6, pick: { w: 2.2, h: 1.6, d: 3, x, z }, onUse: () => ({ terminal: routeTerm }) });
      }

      // === Decor: low 2000s workshop dressing, kept back from the water and off the sightlines =====================
      // Cable trays along both back walls at 2.8 m, with sea-glass and citrus cable runs; wall-mounted flat panels.
      for (const [x, s] of [[-32.6, 1], [40.6, -1]]) {
        for (const u of [14, 26, 50, 66]) {
          const z = Z(u);
          solid(0.5, 0.06, 6, C.silver, x, top + 2.8, z);
          solid(0.08, 0.05, 5.8, C.glass, x - s * 0.1, top + 2.86, z, 0.4);
          solid(0.08, 0.05, 5.8, C.citrus, x + s * 0.1, top + 2.86, z, 0.3);
          solid(0.06, 1.1, 1.6, C.graphite, x, top + 1.6, z);
          solid(0.02, 0.9, 1.4, C.powder, x + s * 0.04, top + 1.6, z, 0.35);
          obstacle(x - 0.3, x + 0.3, z - 0.8, z + 0.8);
        }
      }
      // A low shelf of jewel-case spindles and translucent boxes on each bank's far end.
      for (const [x, z] of [[-26, Z(68)], [33, Z(68)]]) {
        solid(3, 0.6, 1, C.bench, x, top + 0.3, z);
        for (let i = 0; i < 5; i++) solid(0.4, 0.3 + (i % 3) * 0.15, 0.4, [C.glass, C.powder, C.citrus, C.ivory, C.glass][i], x - 1.1 + i * 0.55, top + 0.6 + (0.3 + (i % 3) * 0.15) / 2, z);
        obstacle(x - 1.5, x + 1.5, z - 0.5, z + 0.5);
      }
      // === Gold Chain (a later addition to the period-gear cluster): a console game station at x 27 on the cluster's
      // mat, between the display comparison and Pattern Pocket. A pedestal, a back panel with its screen, and twelve
      // gold links along its top that light as the terminal's chain grows. Its game is its own module
      // (genesis-era-5-chain.js); until a page loads it, the station says so on a board.
      {
        const z = Z(60), x = 27, CH = BL.genesisEra5Chain;
        pool(x, z, 1.2, POOL, 0.3);
        if (CH) { S.chain = CH.chain(); S.chain.deal(2005); }
        solid(1.4, 0.9, 0.9, C.bench, x, top + 0.45, z);
        solid(1.4, 1.2, 0.12, C.graphite, x, top + 1.5, z - 0.3);
        solid(1.1, 0.7, 0.02, "#141a20", x, top + 1.6, z - 0.235, 0.3);
        for (let i = 0; i < 12; i++) { const l = solid(0.07, 0.05, 0.03, C.gold, x - 0.55 + i * 0.1, top + 2.18, z - 0.22, 0.7); l.visible = false; N.chainLinks.push(l); }
        // The screen's chain of tiles, the gate's bracket, the pedestal's foot, lip and a sloped key shelf, and a
        // plain gold medallion of three linked rings on the panel's crown.
        detail(kit, x, top, z, (M) => [B(M, 1.44, 0.06, 0.94, C.graphite, 0, 0.03, 0), B(M, 1.44, 0.03, 0.94, C.silver, 0, 0.885, 0),
          B(M, 1.44, 0.05, 0.16, C.silver, 0, 2.125, -0.3), B(M, 1.2, 0.08, 0.32, "#2c3035", 0, 0.94, 0.15),
          ...[0, 1, 2, 3, 4].map((k) => B(M, 0.1, 0.06, 0.004, k === 4 ? C.gold : "#8a5a2c", -0.36 + k * 0.15, 1.78, -0.222, k === 4 ? 0.8 : 0.4)),
          ...[0, 1, 2, 3].map((k) => B(M, 0.05, 0.008, 0.004, C.gold, -0.285 + k * 0.15, 1.78, -0.221, 0.5)),
          ...[-1, 1].flatMap((sd) => [B(M, 0.015, 0.14, 0.004, C.glass, sd * 0.3, 1.5, -0.222, 1), B(M, 0.05, 0.015, 0.004, C.glass, sd * 0.28, 1.57, -0.222, 1), B(M, 0.05, 0.015, 0.004, C.glass, sd * 0.28, 1.43, -0.222, 1)]),
          B(M, 0.5, 0.012, 0.004, "#8a5a2c", 0.35, 1.5, -0.222, 0.4), B(M, 0.4, 0.05, 0.02, C.citrus, 0, 1.08, 0.31, 0.5),
          ...[-1, 0, 1].map((k) => disc(M, 0.07, 0.02, C.gold, k * 0.11, 2.3, -0.3, 0.3)), ...[-1, 0, 1].map((k) => disc(M, 0.035, 0.024, C.graphite, k * 0.11, 2.3, -0.298))]);
        obstacle(x - 0.75, x + 0.75, z - 0.5, z + 0.5);
        sign("GOLD CHAIN", "take the links that fit the tail", x, top + 2.75, z - 0.1, 0, 0.3);
        // A new link slides in along the panel's crown from its right end.
        const show = () => { for (let i = 0; i < 12; i++) { const l = N.chainLinks[i], on = i < S.chain.linked(); if (on && !l.visible) glide(l, x + 0.75, l.position.y, l.position.z, 0, 0.4, 0, 0, 0, "click"); l.visible = on; } };
        prop({ id: "e5-chain", year: 2005, connection: "context", date: "2005: the qualified year of the bit gold essay whose chained strings inspired this original game; a modern museum homage, not historical software",
          title: "Gold Chain game", label: "GOLD CHAIN · 2005-INSPIRED HOMAGE", hint: "Type TAKE when the link fits the tail", sourceKeys: ["E5-BG"],
          at: { x, y: top, z: z + 1.5 }, reach: 1.9, pick: { w: 1.4, h: 2.4, d: 1, x, z },
          onUse: () => !S.chain ? ({ board: { room: "Not loaded yet", sources: ["E5-DOSSIER"], pages: [{ caption: "Coming soon", title: "Gold Chain is not on this page yet",
            text: ["This station's game is its own module, and this page has not loaded it yet.", "Everything else in the cave works as before."] }] } })
            : ({ terminal: watched(CH.terminal(S.chain, CHAIN_STORY), show) }) });
      }
      ringShow(); stampShow(); cabShow(); goldShow(); mosaicShow(); gpsShow(); wikiShow(); playerShow();
    },
    // Decoration only: the ring's beacon circles, the satellites drift and the cabinet's busy lamp blinks.
    // Calm holds all of it still; an open panel holds the blinking lamp steady. No allocation.
    update(dt, elapsed, state) {
      if (!S || !S.n) return;
      const N = S.n, calm = !!(state && state.calm), reading = !!(state && state.reading);
      // The upgrade's motion: nothing to do unless a command set something moving; Calm puts it at its end at once.
      const A = S.anim;
      A.calm = calm;
      if (A.live) { if (calm) snapAll(); else tick(dt); }
      if (calm) {
        N.beacon.position.x = N.ringX; N.beacon.position.z = N.ringZ - 1.25;
        N.sats[0].position.x = N.satX - N.satR; N.sats[1].position.x = N.satX + N.satR;
        N.sats[0].position.z = N.sats[1].position.z = N.satZ;
        N.cabBusy.visible = true;
        return;
      }
      const a = elapsed * 0.6;
      N.beacon.position.x = N.ringX + Math.sin(a) * 1.25; N.beacon.position.z = N.ringZ - Math.cos(a) * 1.25;
      const b = elapsed * 0.15;
      N.sats[0].position.x = N.satX + Math.cos(b) * N.satR; N.sats[0].position.z = N.satZ + Math.sin(b) * N.satR;
      N.sats[1].position.x = N.satX - Math.cos(b) * N.satR; N.sats[1].position.z = N.satZ - Math.sin(b) * N.satR;
      N.cabBusy.visible = reading || (elapsed % 1.6) < 1.1;
    },
    // Nothing outlives a frame (no sound, timers or scheduled work); leaving or returning settles the decoration, and
    // leaving puts anything the upgrade set moving at its end (coming back never resumes it).
    active(on) { if (S && S.n) { S.n.cabBusy.visible = true; if (!on) snapAll(); } },
    dispose() { S = null; }
  });
})();
