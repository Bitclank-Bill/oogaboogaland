// Repo Island's geometry, off the main island's south rim: a round floating island of voxel stone and grass, a
// stone bridge to it from the top of the south stairs (where the Oogatron arches over the path), and a carved totem
// for every repository `repo-island-data.js` lists, each from the meadow totems' own kit (`totem-models.js`) and
// standing that repository's importance times Bitcoin Core's height.
//
// The island's frame: its middle at the origin, y 0 its top (the bridge's deck and the south terrace's height), north
// (-z) back toward the main island, which the hub keeps unturned, so the frame is the world's moved by `spot`. Bitcoin
// Core stands in the middle of a paved plaza facing the bridge, the rest of its section in a ring round it, and a ring
// path round that. Every other section has a wedge of the outer island between two spoke paths, clockwise from the
// spoke the bridge comes in on, in `SECTIONS` order and as wide as its totems need; within a wedge the totems stand
// in up to five rows, the least important nearest the plaza and the most important in each row's middle, every one
// facing the plaza. A carved sign with the section's badge stands where its wedge meets the ring path.
//
// `plan()` is the layout, pure and computed once a page from the data: every totem's place, turn, design and layout,
// the sections' wedges, signs and spokes, and the totems gathered into chunks of up to `CHUNK` neighbours, each a
// merged mesh. `designFor` gives each repository a carving of its own: its section's crests and paints, faces, wood,
// wings and studs drawn from a hash of its name, five faces for the most important down to two, and no two alike
// (the meadow's four keep their own designs). `spot(island)` finds the south rim, where the bridge leaves it, and
// the island's middle a deck's length past it, throwing if another islet comes within CLEAR of it.
//
// Geometry, each cached for the page and released with the hub's caches: `rockSteps` (the top a half-metre lattice
// painted with the plaza, paths and grass, its `collisionGeometry` a closed turned shell whose top is the island's top,
// and the keel under it in metre blocks), `bridge()` (stone in island coordinates: a flagged deck, a stepped arch under
// it, parapets and pillars, and four lanterns whose glass is `glass`, with their glow points in `lamps`), `signs()`
// (every section's sign on its posts, solid only where its posts stand), and `chunkSteps(k, tier)`: a chunk's carvings
// merged at one of three details (`near`, `far` for across the island, `distant` for across the water) as `mesh`, all
// three sharing one collision shell; the distant build also gives each totem's runes with an ember in each crest eye
// (`glyphs`, for the lit bands) and those two eyes (`eyes`). Nothing here runs per frame.
(() => {
  "use strict";
  const BL = window.BL = window.BL || {};
  const { models, math } = BL;
  const { box, bevelBox, merge, moved, turnedY, turn, noShadow, cachedSteps, cached } = models;
  const { hexToRgb, fnv1a, mulberry32 } = math;
  const { pause, due } = BL.buildTasks;
  const TAU = Math.PI * 2;

  // The island: its top's radius, its depth at the middle, the top's half-metre lattice `soil` deep over the keel's
  // metre blocks. The bridge: its span from the rim to the island's edge, its width, the deck slab's depth, the
  // parapets' height and thickness, pillars `pillar` square and `pillarH` high every `pillarStep` metres.
  const ISLE = { R: 32, depth: 22, unit: 0.5, keel: 1, soil: 1.5 };
  const BRIDGE = { span: 16, width: 4.6, slab: 0.6, parapet: 0.82, wall: 0.4, pillar: 0.66, pillarH: 1.3, pillarStep: 4 };
  // The plan's radii: the plaza, the Core ring the rest of Core's section stands on, the ring path, the rows of the
  // outer wedges, the spokes' and the entry's half widths, the least gap between two totems' reaches, where the
  // section signs stand, the gap left in each wedge's first row in front of its sign, and the rim kerb.
  const PLAN = { plaza: 4.2, coreRing: 6.6, ringIn: 8.7, ringOut: 10.3, rows: [12.2, 15.6, 19.0, 22.4, 25.8, 29.2], spoke: 0.8, entry: 1.3, gap: 0.75, sign: 10.95, signGap: 2.1, rim: 31.3 };
  // Up to four neighbours a chunk: few enough that merging, packing or uploading one never holds a frame for long.
  const CHUNK = 4;
  // The three details a chunk is carved at (`totemModels.carve`'s `detail`).
  const TIERS = { near: 0.45, far: 0.3, distant: 0.15 };
  // How far the island keeps from the other islets.
  const CLEAR = 8;
  const P = BL.terrain.PALETTE.length;
  // The terrain's palette, then the island's own: the plaza's flags, its Bitcoin-orange ring and the kerb.
  const PALETTE = [...BL.terrain.PALETTE, ...["#9a9188", "#8a8178", "#f7931a", "#6a625b", "#a89f95"].map(hexToRgb)];
  const C = { grass: 1, grassLight: 2, grassDark: 3, path: 4, stone: 5, stoneDark: 6, dirt: 8, flag: P, flagDark: P + 1, orange: P + 2, kerb: P + 3, flagLight: P + 4 };

  // ---- designs -------------------------------------------------------------------------------------------------
  // Each section's crests and paints; a carving's paint and second paint are drawn from these, never the same.
  const BTC = "#f7931a", BONE = "#e8dcc0", RED = "#a8442a", GOLD = "#f2c230", OCHRE = "#c8782e";
  const STYLES = {
    core: { crests: ["key", "orb", "star", "scroll", "shield", "chain"], paints: [BTC, "#d38a22", OCHRE], paints2: [BONE, RED, GOLD] },
    nodes: { crests: ["tower", "gear", "orb"], paints: ["#2f8f86", "#3d7a6e", "#5aa89a"], paints2: [GOLD, BONE, "#e06a3a"] },
    indexers: { crests: ["eye", "scroll", "orb"], paints: ["#3a8fc0", "#2f6f9a", "#5aa6d0"], paints2: [GOLD, BONE, "#e06a3a"] },
    libraries: { crests: ["chain", "scroll", "gear", "key"], paints: ["#b8742a", "#8a5a2a", "#c89040"], paints2: ["#3d6e5a", BONE, "#2f6f9a"] },
    lightning: { crests: ["bolt", "star", "orb"], paints: ["#7a52b0", "#5b3e96", "#9a72d0"], paints2: [GOLD, "#ffe066", BONE] },
    "lightning-tools": { crests: ["bolt", "gear", "chain"], paints: ["#5b4bb0", "#6a5ac8", "#4a3a90"], paints2: ["#f2a630", GOLD, BONE] },
    "software-wallets": { crests: ["key", "moon", "star", "headdress"], paints: ["#3f9a5a", "#2f7f4a", "#5ab070"], paints2: ["#6fb8d8", GOLD, BONE] },
    "hardware-wallets": { crests: ["shield", "key", "tower"], paints: ["#4a6fa0", "#2e4e7a", "#6a8ab8"], paints2: ["#c8ccd0", "#e06a3a", GOLD] },
    payments: { crests: ["headdress", "star", "flame"], paints: ["#4f9a3a", "#3f8a2a", "#6aaa48"], paints2: [OCHRE, GOLD, BONE] },
    privacy: { crests: ["moon", "shield", "eye"], paints: ["#3a3a48", "#4a4058", "#2a2a36"], paints2: ["#8a6ab8", "#b0a0d0", BONE] },
    mining: { crests: ["pick", "flame", "gear"], paints: ["#b8402a", "#a03020", "#c85a30"], paints2: ["#f2a630", GOLD, BONE] },
    layers: { crests: ["chain", "orb", "tower"], paints: ["#2f5fa8", "#3a78b8", "#24508a"], paints2: ["#4ac0b0", BONE, GOLD] },
    "dev-tools": { crests: ["scroll", "gear", "star"], paints: [BONE, "#d8cfb8", "#c0b8a0"], paints2: ["#2f6f9a", RED, "#3d6e5a"] },
    nostr: { crests: ["headdress", "star", "moon"], paints: ["#8e44ad", "#a05ac0", "#7a3a98"], paints2: ["#e070b0", GOLD, BONE] }
  };
  // Woods as the meadow's totems carve them: the wood, its light and its dark.
  const WOODS = [["#7a4a2a", "#8e5a34", "#4e2f18"], ["#6e5a4a", "#86725e", "#463a30"], ["#a07a50", "#b48c5e", "#6a4e30"], ["#9a4e30", "#ae6040", "#5e2e1a"],
    ["#5e4630", "#74583c", "#3a2a1c"], ["#8a6a48", "#a0805a", "#5a4430"], ["#6a3a28", "#804a34", "#40221a"], ["#7e6a52", "#968066", "#4e4232"]];
  // The meadow's four keep their carvings, and a few repositories carry the crest their work is: the BIPs a scroll,
  // the curve's library a key, the hardware wallet interface a shield.
  const MEADOW = { "bitcoin/bitcoin": "CORE", "lightningnetwork/lnd": "LND", "ElementsProject/lightning": "CLN", "btcpayserver/btcpayserver": "BTCPAY" };
  const CRESTED = { "bitcoin/bips": "scroll", "bitcoin-core/secp256k1": "key", "bitcoin-core/HWI": "shield", "lightning/bolts": "scroll", "bitcoinbook/bitcoinbook": "scroll", "mempool/mempool": "eye", "stratum-mining/stratum": "pick" };
  const FACES = ["ooga", "gorilla", "bird", "owl", "sun", "frog"];
  const faceCount = (importance) => importance >= 0.8 ? 5 : importance >= 0.55 ? 4 : importance >= 0.32 ? 3 : 2;
  // A carving's own design, `taken` the signatures already given out.
  const designFor = (repo, taken) => {
    const meadow = MEADOW[repo.repo];
    if (meadow) {
      const d = BL.totemModels.DESIGNS[meadow];
      taken.add(signature(d));
      return d;
    }
    const style = STYLES[repo.section] || STYLES["dev-tools"], h = fnv1a(repo.repo), rand = mulberry32(h);
    const pick = (list) => list[Math.floor(rand() * list.length)];
    for (let attempt = 0; ; attempt++) {
      const n = faceCount(repo.importance), faces = [];
      for (let k = 0; k < n; k++) {
        let kind = pick(FACES);
        while (kind === faces[k - 1] || n <= 4 && faces.includes(kind)) kind = pick(FACES);
        faces.push(kind);
      }
      const wood = pick(WOODS), paint = pick(style.paints);
      let paint2 = pick(style.paints2);
      if (paint2 === paint) paint2 = BONE;
      const top = faces[faces.length - 1];
      const d = {
        faces, crest: attempt === 0 && CRESTED[repo.repo] || pick(style.crests),
        wings: top === "bird" && rand() < 0.75 ? 0.9 + rand() * 0.35 : 0, studs: repo.importance >= 0.45 && rand() < 0.5,
        wood: wood[0], lt: wood[1], dk: wood[2], paint, paint2
      };
      const key = signature(d);
      if (taken.has(key) && attempt < 64) continue;
      if (taken.has(key)) throw new Error(`Repo Island: no design of its own for ${repo.repo}`);
      taken.add(key);
      return d;
    }
  };
  const signature = (d) => [d.faces.join("-"), d.crest, d.wood, d.paint, d.paint2, d.wings ? "w" : "", d.studs ? "s" : ""].join("|");

  // ---- the plan ------------------------------------------------------------------------------------------------
  const polar = (theta, r) => ({ x: Math.sin(theta) * r, z: -Math.cos(theta) * r });
  const facing = (x, z) => Math.atan2(-x, -z);
  // Spreads `row` (totems, least important first) over the arc from `a0` to `a1` at radius r, the most important in
  // the middle, each given the room its reach needs, with `hole` metres left empty at the arc's middle.
  const spread = (row, r, a0, a1, hole, out) => {
    const order = [];
    row.slice().sort((a, b) => b.importance - a.importance).forEach((t, k) => { if (k % 2) order.push(t); else order.unshift(t); });
    const widths = order.map((t) => 2 * t.L.reach + PLAN.gap), used = widths.reduce((a, b) => a + b, 0) + hole;
    const spare = Math.max(0, (a1 - a0) * r - used) / (order.length + 1);
    let at = a0 * r + spare, middle = (a0 + a1) / 2 * r, holeDone = !hole;
    order.forEach((t, k) => {
      if (!holeDone && at + widths[k] / 2 > middle - hole / 2) { at += hole; holeDone = true; }
      const theta = (at + widths[k] / 2) / r, p = polar(theta, r);
      out.push({ ...t, x: p.x, z: p.z, r, theta, ry: facing(p.x, p.z) });
      at += widths[k] + spare;
    });
  };
  // How many of `pending` (least important first) fit along an arc of `length` metres, leaving `hole` empty.
  const fits = (pending, length, hole) => {
    let used = hole, n = 0;
    while (n < pending.length && used + 2 * pending[n].L.reach + PLAN.gap <= length) used += 2 * pending[n++].L.reach + PLAN.gap;
    return n;
  };
  const plan = cached(() => {
    const D = BL.repoIslandData, TM = BL.totemModels, taken = new Set(), sections = new Map();
    for (const s of D.SECTIONS) sections.set(s.id, { ...s, totems: [] });
    D.REPOS.forEach((repo, index) => {
      const design = designFor(repo, taken);
      const word = repo.word, L = TM.layoutOf(design, repo.importance);
      sections.get(repo.section).totems.push({ index, repo: repo.repo, name: repo.name, word, section: repo.section, importance: repo.importance, design, L, seed: 9000 + index });
    });
    const placed = [], signs = [], spokes = [], wedges = [];
    // Core: Bitcoin Core in the middle facing the bridge, the rest round it on the Core ring.
    const core = sections.get("core");
    const centre = core.totems.find((t) => t.repo === "bitcoin/bitcoin");
    placed.push({ ...centre, x: 0, z: 0, r: 0, theta: 0, ry: Math.PI });
    const ring = core.totems.filter((t) => t !== centre);
    const entryCore = (PLAN.entry + PLAN.gap) / PLAN.coreRing;
    const ringRow = [];
    spread(ring, PLAN.coreRing, entryCore, TAU - entryCore, 0, ringRow);
    for (const t of ringRow) placed.push({ ...t, ry: facing(t.x, t.z) });
    const ringNeed = ring.reduce((sum, t) => sum + 2 * t.L.reach + PLAN.gap, 0);
    if (ringNeed > (TAU - 2 * entryCore) * PLAN.coreRing) throw new Error("Repo Island: the Core ring is overfull");
    // The wedges, meeting at the spokes' middles: each section's share of the circle by the room its totems need, the
    // path's half width and a gap kept off either edge of every row and its sign's gap in the first row counted in.
    const outer = [...sections.values()].filter((s) => s.id !== "core"), radii = PLAN.rows.reduce((a, b) => a + b, 0);
    const edge = (k) => (k === 0 ? PLAN.entry : PLAN.spoke) + PLAN.gap * 0.5;
    const need = outer.map((s, k) => s.totems.reduce((sum, t) => sum + 2 * t.L.reach + PLAN.gap, 0) + (edge(k) + edge(k + 1 === outer.length ? 0 : 1)) * PLAN.rows.length + PLAN.signGap);
    const total = need.reduce((a, b) => a + b, 0);
    if (total > TAU * radii * 0.88) throw new Error("Repo Island: too many totems for the island");
    let theta = 0;
    outer.forEach((s, k) => {
      const width = TAU * need[k] / total, from = theta, to = theta + width;
      theta = to;
      wedges.push({ id: s.id, name: s.name, badge: s.badge, from, to, count: s.totems.length });
      if (k < outer.length - 1) spokes.push(to);
      const mid = (from + to) / 2, sp = polar(mid, PLAN.sign);
      signs.push({ id: s.id, name: s.name, badge: s.badge, x: sp.x, z: sp.z, ry: facing(sp.x, sp.z) });
      // Rows inner to outer, least important first, each arc kept a spoke's half width plus a gap off its edges and
      // given its share of the wedge's totems by its length, any a row cannot hold carried on to the next.
      const pending = s.totems.slice().sort((a, b) => a.importance - b.importance || a.index - b.index);
      const lead = edge(k), tail = edge(k + 1 === outer.length ? 0 : 1);
      const arcs = PLAN.rows.map((r, row) => {
        const hole = row === 0 ? PLAN.signGap : 0;
        return { r, a0: from + lead / r, a1: to - tail / r, hole, length: (to - from) * r - lead - tail - hole };
      });
      // Each row's count by its share of the wedge's length, then moved a totem at a time from any row that cannot
      // hold its slice to the row with the most room to spare, until every slice fits.
      const length = arcs.reduce((sum, a) => sum + a.length, 0), counts = arcs.map(() => 0);
      let given = 0;
      arcs.forEach((a, row) => {
        counts[row] = Math.round(pending.length * (given + a.length) / length) - Math.round(pending.length * given / length);
        given += a.length;
      });
      const slices = () => {
        let at = 0;
        return counts.map((n) => { const slice = pending.slice(at, at + n); at += n; return slice; });
      };
      const used = (slice) => slice.reduce((sum, t) => sum + 2 * t.L.reach + PLAN.gap, 0);
      for (let tries = 0; tries < 64; tries++) {
        const rows = slices(), over = rows.findIndex((slice, row) => slice.length && used(slice) > arcs[row].length);
        if (over < 0) break;
        let best = -1, room = -Infinity;
        rows.forEach((slice, row) => {
          const spare = arcs[row].length - used(slice);
          if (row !== over && spare > room) { room = spare; best = row; }
        });
        counts[over]--;
        counts[best]++;
      }
      slices().forEach((slice, row) => {
        if (slice.length && used(slice) > arcs[row].length) throw new Error(`Repo Island: the ${s.name} wedge cannot hold its totems`);
        spread(slice, arcs[row].r, arcs[row].a0, arcs[row].a1, arcs[row].hole, placed);
      });
      pending.length = 0;
      if (pending.length) throw new Error(`Repo Island: the ${s.name} wedge cannot hold ${pending.length} more`);
    });
    // Chunks: Core's middle and ring, then each wedge row by row along its arc.
    const chunks = [];
    const gather = (list) => {
      for (let k = 0; k < list.length; k += CHUNK) chunks.push(list.slice(k, k + CHUNK).map((t) => t.at));
    };
    placed.forEach((t, at) => { t.at = at; });
    gather(placed.filter((t) => t.section === "core"));
    for (const w of wedges) gather(placed.filter((t) => t.section === w.id).sort((a, b) => a.r - b.r || a.theta - b.theta));
    const bounds = chunks.map((list) => {
      let x = 0, z = 0;
      for (const at of list) { x += placed[at].x; z += placed[at].z; }
      x /= list.length; z /= list.length;
      let radius = 0;
      for (const at of list) radius = Math.max(radius, Math.hypot(placed[at].x - x, placed[at].z - z) + placed[at].L.reach);
      return { x, z, radius };
    });
    // No two reaches may touch, nor any reach a path.
    for (let a = 0; a < placed.length; a++) {
      const t = placed[a];
      for (let b = a + 1; b < placed.length; b++) {
        const u = placed[b];
        if (Math.hypot(t.x - u.x, t.z - u.z) < t.L.reach + u.L.reach + PLAN.gap * 0.5) throw new Error(`Repo Island: ${t.repo} and ${u.repo} stand too close`);
      }
      if (t.r && pathAt(t.x, t.z, spokes, t.L.reach * 0.5)) throw new Error(`Repo Island: ${t.repo} stands on a path`);
    }
    return { totems: placed, chunks, bounds, signs, spokes, wedges, byIndex: D.REPOS.map((_, i) => placed.find((t) => t.index === i)) };
  });

  // Whether (x, z) lies on a path, widened by `pad`: the ring path, the entry spoke and the spokes between wedges.
  const pathAt = (x, z, spokes, pad = 0) => {
    const r = Math.hypot(x, z);
    if (r >= PLAN.ringIn - pad && r <= PLAN.ringOut + pad) return true;
    if (z < 0 && Math.abs(x) <= PLAN.entry + pad && r >= PLAN.plaza - 0.5) return true;
    if (r < PLAN.ringOut || r > PLAN.rim) return false;
    for (const a of spokes) {
      const along = x * Math.sin(a) - z * Math.cos(a), across = x * Math.cos(a) + z * Math.sin(a);
      if (along > 0 && Math.abs(across) <= PLAN.spoke + pad) return true;
    }
    return false;
  };

  // ---- where it stands -----------------------------------------------------------------------------------------
  // The south rim straight out from the stairs, the terrace's height there, and the island's middle in the world.
  const spot = (island) => {
    let rim = 24;
    while (rim < 36 && island.surfaceAt(0, rim + 0.1) > 0.5) rim += 0.1;
    const y = island.surfaceAt(0, rim - 0.3), z = rim + BRIDGE.span + ISLE.R;
    // The other islets stay well clear: the Mempool island where its spot puts it, and the Timechain Sphere anywhere
    // out along its bearing, as ₿IFRÖST's islet checks them.
    const pool = BL.poolModels.spot(island, {}), T = BL.timechainModels, out = Math.max(0, z * T.DIR.z);
    for (const [name, ox, oz, r] of [["Mempool island", pool.x, pool.z, BL.poolModels.SITE.reach], ["Timechain Sphere", T.DIR.x * out, T.DIR.z * out, T.SITE.radius]]) {
      const apart = Math.hypot(ox, z - oz) - r - ISLE.R;
      if (apart < CLEAR) throw new Error(`Repo Island comes within ${apart.toFixed(1)} m of the ${name}`);
    }
    return { x: 0, y, z, rim };
  };

  // ---- the rock ------------------------------------------------------------------------------------------------
  const hash = (x, y, z) => { let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(z | 0, 2147483647); h = Math.imul(h ^ h >>> 13, 1274126177); return ((h ^ h >>> 16) >>> 0) / 4294967296; };
  const noise = (x, z) => Math.sin(x * 0.41 + 1.3) * Math.cos(z * 0.37 - 0.7) + 0.5 * Math.sin((x + z) * 0.23 + 2.1);
  // The colour of the top at (x, z).
  const topAt = (x, z, spokes) => {
    const r = Math.hypot(x, z);
    if (r > PLAN.rim) return C.kerb;
    if (r < PLAN.plaza) {
      if (r > PLAN.plaza - 0.5) return C.orange;
      const ring = Math.floor(r / 0.9), a = Math.floor((Math.atan2(x, z) + Math.PI) / TAU * (8 + ring * 6));
      return (ring + a) % 2 ? C.flag : C.flagLight;
    }
    if (pathAt(x, z, spokes)) return r >= PLAN.ringIn && r <= PLAN.ringOut && (r < PLAN.ringIn + 0.3 || r > PLAN.ringOut - 0.3) ? C.stone : C.path;
    const n = noise(x, z);
    return n > 0.75 ? C.grassLight : n < -0.75 ? C.grassDark : C.grass;
  };
  // The keel's depth under the soil at radius r: deep in the middle, rounding up to the rim, with hanging drips.
  const keelDepth = (r, ix, iz) => {
    const k = Math.max(0, 1 - (r / (ISLE.R - 0.5)) ** 2), drip = r > ISLE.R * 0.45 && hash(ix, 7, iz) < 0.08 ? 1 + Math.floor(hash(ix, 9, iz) * 4) : 0;
    return Math.round((ISLE.depth - ISLE.soil) * Math.pow(k, 0.62) + noise(ix * 1.7, iz * 1.7) * 0.8) + drip;
  };
  const rockSteps = cachedSteps(function* (slice) {
    const T = BL.terrain, { spokes } = plan(), u = ISLE.unit, n = Math.ceil(2 * (ISLE.R + 0.5) / u), soil = Math.round(ISLE.soil / u);
    const top = T.makeGrid(n, soil, n), half = n * u / 2;
    for (let ix = 0; ix < n; ix++) {
      if (due(slice, 7)) yield* pause(slice);
      for (let iz = 0; iz < n; iz++) {
        const x = -half + (ix + 0.5) * u, z = -half + (iz + 0.5) * u, r = Math.hypot(x, z);
        if (r > ISLE.R) continue;
        const colour = topAt(x, z, spokes);
        for (let iy = 0; iy < soil; iy++) top.set(ix, iy, iz, iy === soil - 1 ? colour : r > ISLE.R - 1 ? (hash(ix, iy, iz) < 0.5 ? C.stone : C.dirt) : C.dirt);
      }
    }
    const soilGeo = yield* T.gridGeometrySteps(top, { unit: u, palette: PALETTE, origin: { x: -half, y: -ISLE.soil, z: -half } }, slice);
    const k = ISLE.keel, m = Math.ceil(2 * ISLE.R / k), depth = Math.ceil(ISLE.depth - ISLE.soil + 5), keel = T.makeGrid(m, depth, m), kh = m * k / 2;
    const BANDS = [C.dirt, C.stoneDark, C.dirt, C.stone, C.stoneDark];
    for (let ix = 0; ix < m; ix++) {
      if (due(slice, 7)) yield* pause(slice);
      for (let iz = 0; iz < m; iz++) {
        const x = -kh + (ix + 0.5) * k, z = -kh + (iz + 0.5) * k, r = Math.hypot(x, z);
        if (r > ISLE.R - 0.75) continue;
        const d = Math.min(depth, Math.max(1, keelDepth(r, ix, iz)));
        for (let iy = depth - d; iy < depth; iy++) {
          const band = BANDS[Math.floor((depth - iy + hash(ix, 3, iz) * 2) / 3) % BANDS.length];
          keel.set(ix, iy, iz, hash(ix, iy, iz) < 0.12 ? C.stone : band);
        }
      }
    }
    const keelGeo = yield* T.gridGeometrySteps(keel, { unit: k, palette: PALETTE, origin: { x: -kh, y: -ISLE.soil - depth * k, z: -kh } }, slice);
    yield* pause(slice);
    // The walking shell: the top as a flat disc at y 0, closed under it by a turned keel.
    const shell = turn([[0, 0], [ISLE.R, 0], [ISLE.R, -ISLE.soil], [ISLE.R * 0.85, -6], [ISLE.R * 0.5, -14], [0, -ISLE.depth]].reverse(), 40, "#000000");
    soilGeo.collisionGeometry = shell;
    return { soil: soilGeo, keel: keelGeo };
  });

  // ---- the bridge ----------------------------------------------------------------------------------------------
  const STONES = ["#8b837b", "#7a716a", "#958d84", "#857c74"];
  const bridge = cached(() => {
    const parts = [], solid = [], glass = [], frame = [], lamps = [];
    const from = -(ISLE.R + BRIDGE.span) - 0.6, to = -ISLE.R + 0.9, W = BRIDGE.width, rand = mulberry32(0x6b1d);
    // The deck's flags, a row every 0.8 m, three across and staggered, flush at y 0 over the slab.
    for (let z = from, row = 0; z < to; z += 0.8, row++) {
      const depth = Math.min(0.8, to - z), cuts = row % 2 ? [-W / 2, -W / 6, W / 6, W / 2] : [-W / 2, -0.4, 0.9, W / 2];
      for (let k = 0; k < 3; k++) parts.push(box({ w: cuts[k + 1] - cuts[k] - 0.03, h: 0.06, d: depth - 0.03, color: STONES[Math.floor(rand() * STONES.length)], offset: { x: (cuts[k] + cuts[k + 1]) / 2, y: -0.03, z: z + depth / 2 } }));
    }
    // The slab and its stepped arch: deep where it meets each island, thin across the middle.
    const length = to - from;
    for (let z = from, k = 0; z < to; z += 0.8, k++) {
      const depth = Math.min(0.8, to - z), t = (z + depth / 2 - from) / length, drop = BRIDGE.slab + 2.2 * Math.pow(2 * t - 1, 4);
      parts.push(box({ w: W, h: drop, d: depth, color: k % 2 ? "#6b625a" : "#746b62", offset: { y: -0.06 - drop / 2, z: z + depth / 2 } }));
      parts.push(box({ w: W - 0.6, h: 0.18, d: depth, color: "#5d5650", offset: { y: -0.06 - drop - 0.09, z: z + depth / 2 } }));
    }
    // Parapets with copings, from past the rim to short of the island's edge, and pillars along them.
    const p0 = from + 1.6, p1 = to - 1.4, x = W / 2 - BRIDGE.wall / 2;
    for (const side of [-1, 1]) {
      parts.push(box({ w: BRIDGE.wall, h: BRIDGE.parapet, d: p1 - p0, color: "#7a716a", offset: { x: side * x, y: BRIDGE.parapet / 2, z: (p0 + p1) / 2 } }));
      parts.push(box({ w: BRIDGE.wall + 0.1, h: 0.1, d: p1 - p0 + 0.1, color: "#958d84", offset: { x: side * x, y: BRIDGE.parapet + 0.05, z: (p0 + p1) / 2 } }));
      solid.push(box({ w: BRIDGE.wall + 0.1, h: BRIDGE.parapet + 0.1, d: p1 - p0 + 0.1, color: "#000000", offset: { x: side * x, y: (BRIDGE.parapet + 0.1) / 2, z: (p0 + p1) / 2 } }));
      const pillars = Math.round((p1 - p0) / BRIDGE.pillarStep);
      for (let k = 0; k <= pillars; k++) {
        const z = p0 + (p1 - p0) * k / pillars, end = k === 0 || k === pillars, h = end ? BRIDGE.pillarH + 0.2 : BRIDGE.pillarH;
        parts.push(bevelBox({ w: BRIDGE.pillar, h, d: BRIDGE.pillar, color: "#857c74", offset: { x: side * x, y: h / 2, z } }));
        parts.push(box({ w: BRIDGE.pillar + 0.12, h: 0.12, d: BRIDGE.pillar + 0.12, color: "#958d84", offset: { x: side * x, y: h + 0.06, z } }));
        solid.push(box({ w: BRIDGE.pillar + 0.12, h: h + 0.12, d: BRIDGE.pillar + 0.12, color: "#000000", offset: { x: side * x, y: (h + 0.12) / 2, z } }));
        if (end) {
          models.lanternParts(1.1, side * x, h + 0.12, z, frame, glass);
          lamps.push({ x: side * x, y: h + 0.5, z });
        }
      }
    }
    solid.push(box({ w: W, h: BRIDGE.slab, d: length, color: "#000000", offset: { y: -BRIDGE.slab / 2, z: (from + to) / 2 } }));
    const stone = merge(...parts, ...frame);
    stone.collisionGeometry = merge(...solid);
    return { stone, glass: noShadow(merge(...glass)), lamps, from, to, width: W, walk: W / 2 - BRIDGE.wall - 0.05 };
  });

  // ---- the section signs ---------------------------------------------------------------------------------------
  const SIGN_SCALE = 0.5, POST = "#5c4425";
  const signs = cached(() => {
    const parts = [], solid = [], picks = [];
    for (const s of plan().signs) {
      const board = BL.hubModels.caveSign(s.name, s.badge), w = board.signWidth * SIGN_SCALE, lift = 0.95;
      const sign = { verts: board.verts.map((v, k) => k % 3 === 1 ? v * SIGN_SCALE + lift + board.signHeight * SIGN_SCALE / 2 : v * SIGN_SCALE), faces: board.faces, lines: board.lines };
      const posts = [-1, 1].map((side) => bevelBox({ w: 0.14, h: lift + 0.3, d: 0.14, color: POST, offset: { x: side * (w / 2 - 0.18), y: (lift + 0.3) / 2 - 0.05 } }));
      const place = (g) => moved(turnedY(g, s.ry), s.x, 0, s.z);
      parts.push(place(merge(sign, ...posts)));
      for (const side of [-1, 1]) solid.push(place(box({ w: 0.2, h: lift + 0.3, d: 0.2, color: "#000000", offset: { x: side * (w / 2 - 0.18), y: (lift + 0.3) / 2 } })));
      picks.push({ id: s.id, name: s.name, x: s.x, y: lift + 0.3, z: s.z, radius: Math.max(0.8, w / 2) });
    }
    const geo = merge(...parts);
    geo.collisionGeometry = merge(...solid);
    return { geometry: geo, picks };
  });

  // ---- the totems ----------------------------------------------------------------------------------------------
  // A totem's name board, lighter than the meadow's (`hubModels.postSign`) at the same size: a plank with a dark
  // panel, the word's letters in the carved signs' alphabet as flat cream strips a hair proud of it, on two pegs.
  const CELL = 0.024, PEG = 0.18, PLANK = "#b27a43", PANEL = "#3a2a1c", INK = hexToRgb("#f6ecd2");
  const boards = models.scopedMap();
  const nameBoard = (word) => {
    let geo = boards.get(word);
    if (geo) return geo;
    const glyphs = [...word].map((ch) => ch === "M" ? BL.hubModels.CARVED_M : BL.hubModels.SIGN_GLYPHS[ch]);
    const cells = glyphs.reduce((sum, g) => sum + g[0].length + 1, -1), w = cells * CELL + 0.08, h = 5 * CELL + 0.07, y = PEG + h / 2 + 0.02;
    geo = merge(bevelBox({ w: w + 0.04, h: h + 0.03, d: 0.05, color: PLANK, offset: { y } }), box({ w, h, d: 0.056, color: PANEL, offset: { y } }),
      ...[-1, 1].map((side) => bevelBox({ w: 0.05, h: PEG + 0.12, d: 0.05, color: "#5c4425", offset: { x: side * (w / 2 - 0.03), y: (PEG + 0.12) / 2 - 0.06, z: -0.01 } })));
    let x = -cells * CELL / 2;
    for (const g of glyphs) {
      g.forEach((row, r) => {
        for (let c = 0; c < row.length;) {
          if (row[c] !== "1") { c++; continue; }
          let n = 1;
          while (row[c + n] === "1") n++;
          const x0 = x + c * CELL, top = y + 2.5 * CELL - r * CELL, z = 0.03, at = geo.verts.length / 3;
          geo.verts.push(x0, top - CELL, z, x0 + n * CELL, top - CELL, z, x0 + n * CELL, top, z, x0, top, z);
          geo.faces.push({ i: [at, at + 1, at + 2, at + 3], color: INK, emissive: 0.15 });
          c += n;
        }
      });
      x += (g[0].length + 1) * CELL;
    }
    boards.set(word, geo);
    return geo;
  };
  // A chunk's carvings at one detail, a totem a step, placed in the island's frame and merged into one packed mesh. The
  // distant build comes first and carries the collision every detail shares, each totem's runes and its crest eyes.
  const chunks = new Map();
  const chunkSteps = (k, tier) => {
    const key = `${k}|${tier}`;
    if (!chunks.has(key)) chunks.set(key, cachedSteps(function* (slice) {
      const TM = BL.totemModels, P = plan(), list = P.chunks[k], parts = [], collision = [], glyphs = [], eyes = [];
      for (const at of list) {
        const t = P.totems[at], L = t.L, c = Math.cos(t.ry), s = Math.sin(t.ry);
        const place = (g) => moved(turnedY(g, t.ry), t.x, 0, t.z);
        const opts = tier === "near" ? { detail: TIERS.near, highlights: false, board: nameBoard(t.word), leanStones: true } : { detail: TIERS[tier], highlights: false, board: false };
        const geo = TM.carve(L, t.word, t.seed, opts);
        parts.push(place(geo));
        if (tier === "distant") {
          collision.push(place(geo.collisionGeometry));
          // The eyes nearest the crest, where the fires burn while it is lit; every detail puts them in the same place.
          // Its runes carry an ember in each, which is what a lit totem shows from across the water, where no fire is lit.
          const top = L.eyes.slice().sort((a, b) => b[1] - a[1]).slice(0, 2);
          eyes.push(top.map(([x, y, z, size]) => [t.x + x * c + z * s, y, t.z - x * s + z * c, size]));
          glyphs.push(place(merge(TM.glyphsOf(L, t.word), ...top.map(([x, y, z, size]) => box({ w: size * 0.3, h: size * 0.22, d: 0.02, color: "#ff7a1e", emissive: 1, offset: { x, y, z } })))));
        }
        yield* pause(slice);
      }
      const mesh = merge(...parts);
      mesh.smooth = true;
      // Packing is the longest single step: it gets an idle slice of its own.
      yield;
      // The distant mesh carries the collision; the hub's solids keep the mesh a chunk's node joined with.
      if (tier === "distant") mesh.collisionGeometry = merge(...collision);
      if (BL.compactGeometry?.enabled) BL.compactGeometry.pack(mesh, { immutable: true, renderOnly: true });
      return tier === "distant" ? { mesh, glyphs, eyes } : { mesh };
    }));
    return chunks.get(key);
  };

  BL.repoIslandModels = { ISLE, BRIDGE, PLAN, TIERS, CHUNK, STYLES, plan, designFor, pathAt, spot, rockSteps, bridge, signs, chunkSteps };
})();
