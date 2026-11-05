// Genesis museum: a scale model of Ooga Booga Land on a low table, the island floating over a sea of blue glass as
// it floats in the hub: voxel cliffs in layered brown bands under its grass, a rim of dark stone hills with a mouth,
// a sign and banners at each cave, sand paths from the plaza to them, the banana pile and the jumbotron with its
// totems, palms, green trees and pink blossom, the library's nook and the whitepaper's monolith, ₿IFRÖST's arch and
// blue portal on the north hill up its stairs, and past the rim the Mempool island's rainforest round its lake across
// the vine bridge, ₿IFRÖST's islet down its crystal bridge, the striped Timechain Sphere over its wooden bridge, and
// a few voxel clouds. Every zone carries a small label, and each is clickable: its window tells what the zone is, on
// a plan of the island with that zone lit. `layout()` (pure) is where the table stands and what each zone is;
// `build(...)` makes it once a visit, returning `zones` (a pick node and the zone each) for the scene to make
// clickable; update allocates nothing.
(() => {
  "use strict";
  const BL = window.BL = window.BL || {};
  const AT = { x: -12.6, z: 27, ry: 0.5 }, TABLE = { w: 3.6, d: 3.0, h: 0.32 }, S = 0.047;
  // Where each zone lies on the island, by the clock from the north and its distance from the middle (in the model's
  // units, the island's rim at 15), its name on the model, its colour, and what its window says.
  const at = (clock, r) => { const a = clock / 12 * Math.PI * 2; return { x: Math.sin(a) * r, z: -Math.cos(a) * r }; };
  const ZONES = [
    { id: "pile", label: "BANANA PILE", name: "The plaza and the banana pile", ink: "#f2d43a", ...at(0, 0), r: 3.4, kind: "plaza",
      text: ["The middle of the island. Every donated banana lands on the pile, and the Oogas reload from it on their way to work.", "Donations ride the Lightning Factory's roof tube in a high arc and drop onto the pile."] },
    { id: "jumbotron", label: "JUMBOTRON", name: "The jumbotron and the totems", ink: "#5ec8ff", ...at(0, 6.2), r: 2.2, kind: "board",
      text: ["The oogatron board shows each contributor's stats and who is working, chilling or sleeping.", "Four totems stand by it in two pairs, carved for Bitcoin Core, BTCPay Server, LND and CLN. Each glows for a day after a pull request is merged into its main branch."] },
    { id: "lab", label: "ENTROPYLAB", name: "EntropyLab", ink: "#7affd8", ...at(11, 12.6), r: 2.2, kind: "cave",
      text: ["The lab in the 11 o'clock cave, where donated bananas feed voxel cavemen who stand for its contributors.", "The crew walk out from the pile to work at it and back to reload."] },
    { id: "bca", label: "B.C.A.", name: "B.C.A., Banana Certified Accounting", ink: "#e8c35a", ...at(10, 12.6), r: 2.2, kind: "cave",
      text: ["An office inside the hub at 10 o'clock. The gorillas put on suits as they pass its veil and count bananas at two walnut desks, with abacuses and ledger screens."] },
    { id: "mirror", label: "MIRROR", name: "The mirror cave", ink: "#9cff9c", ...at(1, 12.6), r: 2.2, kind: "cave",
      text: ["The 1 o'clock cave holds an unbreakable mirror. Shots and swings ripple it, and the cave behind it is Ooga Booga Land's own."] },
    { id: "factory", label: "LIGHTNING FACTORY", name: "The Lightning Factory and the Jet Hangar", ink: "#5ec8ff", ...at(2, 12.6), r: 2.2, kind: "cave",
      text: ["A Lightning node at work in the 2 o'clock cave: sats ride its lines through the core, the forge mints coins, and the cooker turns tips into bananas.", "Through the door at the end of its left walkway is the Lightning Jet Hangar, with the Jet, Kortik's Sis and the static fire booth."] },
    { id: "arcade", label: "OOGA ARCADE", name: "Ooga Arcade", ink: "#ff5fa2", ...at(3, 12.6), r: 2.2, kind: "cave",
      text: ["The 3 o'clock cave: a cave arcade the Oogas built and run. Its stage cabinets open the games, Ooga Rally, Ooga Drop, Ooga Orbit and Ooga Mine, and the hall holds carnival games, retro cabinets, the jackpot wheel and the prize counter."] },
    { id: "hq", label: "HEADQUARTERS", name: "Headquarters", ink: "#c8a878", ...at(7.25, 12.6), r: 2.2, kind: "cave",
      text: ["Where the Oogas sleep: beds in the headquarters rooms and down in the basement, one for each Ooga, its LifeHash on the blanket."] },
    { id: "library", label: "LIBRARY", name: "The library and the whitepaper monolith", ink: "#e8c35a", ...at(8.3, 10.6), r: 1.7, kind: "nook",
      text: ["A shallow nook in the hillside beside the Timechain stairs, three shelves of books: Learn Me A Bitcoin, Bitcoin.org and the whitepaper.", "Above it the whitepaper's shelf raises a black monolith out of the crest, and its face reads the paper."] },
    { id: "mempool", label: "MEMPOOL ISLAND", name: "The Mempool island", ink: "#4fb8ff", ...at(4, 22.5), r: 5.6, kind: "rainforest",
      text: ["A rainforest round a lake across the vine bridge at 4 o'clock. The lake stands as deep as the transaction backlog, and the weather follows the transactions arriving.", "A tunnel leads down to a chamber under the lake, whose wall paintings read the chain out."] },
    { id: "bifrost", label: "₿IFRÖST", name: "₿IFRÖST", ink: "#b98cff", ...at(12, 21.5), r: 3.4, kind: "islet",
      text: ["A gateway islet past the arch over the north pass, across a crystal bridge.", "Its chamber has a window through to DSB Land and mirrors for the worlds still to come."] },
    { id: "timechain", label: "TIMECHAIN SPHERE", name: "The Timechain Sphere", ink: "#f7931a", ...at(7.6, 21.5), r: 3.0, kind: "sphere",
      text: ["A walk-in sphere off the southwest rim. Its keypad opens nine rooms of live block and mining charts, shared with other players when signed in."] }
  ];
  const layout = () => {
    const h = Math.max(TABLE.w, TABLE.d) / 2 + 0.1;
    return { at: AT, zones: ZONES, box: { x0: AT.x - h, x1: AT.x + h, z0: AT.z - h, z1: AT.z + h }, use: { x: AT.x + Math.sin(AT.ry) * (TABLE.d / 2 + 1.1), z: AT.z + Math.cos(AT.ry) * (TABLE.d / 2 + 1.1) } };
  };
  const hash = (a, b) => { const v = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return v - Math.floor(v); };
  // The plan for the windows: the island from above, north up, every zone a dot and its name, `lit` drawn bright.
  // A zone's picture (genesis-scale-cards.js, the site's own preview cards) over the plan, where it has one.
  const CARD_IMG = new Map();
  const cardOf = (id) => {
    const C = BL.genesisScaleCards;
    if (!C || !C[id]) return null;
    let im = CARD_IMG.get(id);
    if (!im) { im = new Image(); im.src = C[id]; CARD_IMG.set(id, im); }
    return im.complete && im.naturalWidth ? im : null;
  };
  const paintPlan = (lit) => (g, x0, y0, w, h) => {
    const im = lit ? cardOf(lit) : null;
    if (im) {
      const iw = w - 20, ih = Math.min(h * 0.48, iw * im.naturalHeight / im.naturalWidth);
      g.drawImage(im, x0 + 10, y0 + 30, iw, ih); g.strokeStyle = "rgba(255,255,255,0.4)"; g.lineWidth = 3; g.strokeRect(x0 + 10, y0 + 30, iw, ih);
      y0 += ih + 10; h -= ih + 10;
    }
    const cx = x0 + w / 2, cy = y0 + h * 0.46, k = Math.min(w, h * 0.85) / 62;
    g.fillStyle = "#0e2a44"; g.fillRect(x0 + 10, y0 + 30, w - 20, h - 40);
    const disc = (x, z, r, ink) => { g.beginPath(); g.arc(cx + x * k, cy + z * k, r * k, 0, 7); g.fillStyle = ink; g.fill(); };
    disc(0, 0, 15, "#5c9a3a"); disc(0, 0, 11, "#6aa844"); disc(0, 0, 3.6, "#d9c08a");
    for (const z of ZONES) if (z.kind === "rainforest" || z.kind === "islet" || z.kind === "sphere") disc(z.x, z.z, z.r, z.kind === "rainforest" ? "#2f7a2c" : "#7d7a72");
    for (const z of ZONES) {
      const on = z.id === lit;
      g.beginPath(); g.arc(cx + z.x * k, cy + z.z * k, (on ? 1.6 : 0.9) * k, 0, 7); g.fillStyle = on ? "#ffd23a" : z.ink; g.fill();
      if (on) { g.strokeStyle = "#ffd23a"; g.lineWidth = 3; g.beginPath(); g.arc(cx + z.x * k, cy + z.z * k, 2.6 * k, 0, 7); g.stroke(); }
      // Names: every zone's on the overview, only the lit one's on a zone's own page.
      if (lit && !on) continue;
      g.fillStyle = on ? "#ffffff" : "rgba(246,236,210,0.8)"; g.font = `${on ? "bold " : ""}${on ? 17 : 11}px sans-serif`; g.textAlign = "center"; g.textBaseline = "top";
      g.fillText(z.label, cx + z.x * k, cy + z.z * k + (on ? 2.8 : 1.2) * k);
    }
    g.fillStyle = "#f6ecd2"; g.font = "bold 18px sans-serif"; g.fillText("N", x0 + w - 30, y0 + 40); g.textAlign = "left";
  };
  const pages = () => [
    { caption: "Ooga Booga Land", title: "A floating island", paint: paintPlan(null), text: ["A floating island whose cliff caves are projects, laid out here as a site model.", "Click any zone on the model, or page on with the arrows, to read what it is."] },
    ...ZONES.map((z) => ({ caption: "Ooga Booga Land", title: z.name, paint: paintPlan(z.id), text: z.text }))
  ];
  // The island in voxels half a unit across, greedy-meshed as the island's own terrain is: layered brown cliffs under a
  // grass top, a rim of dark stone hills with a cave mouth (sign and banners) at each cave, sand paths from the plaza,
  // the ₿IFRÖST hill with its stairs to the north, and the islets beyond, each floating over the sea of blue glass.
  const U = 0.5, X0 = -31, Z0 = -28, NX = 124, NZ = 100, NY = 26, TOPL = 9;
  const P = { grass: 1, grass2: 2, sand: 3, dirt: 4, dirt2: 5, clay: 6, stone: 7, stone2: 8, dark: 9, forest: 10, lake: 11, plaza: 12, moss: 13 };
  const COLORS = [null, "#6cb547", "#5ea83f", "#e2c98f", "#8a5a2c", "#6b4424", "#a8774a", "#8a867c", "#6e6a62", "#1a1612", "#2f7a2c", "#3fa8f0", "#ecd59c", "#4a8f3a"];
  const turn = (d) => ((d % (Math.PI * 2)) + Math.PI * 3) % (Math.PI * 2) - Math.PI;
  const angleOf = (z) => Math.atan2(z.x, -z.z);
  const CAVES = ZONES.filter((z) => z.kind === "cave");
  const ZONE = Object.fromEntries(ZONES.map((z) => [z.id, z]));
  const ISLETS = [
    { c: ZONE.mempool, r: 5.4, top: TOPL, depth: 7 },
    { c: ZONE.bifrost, r: 2.7, top: TOPL + 3, depth: 5 },
    { c: ZONE.timechain, r: 2.3, top: TOPL - 1, depth: 4 }
  ];
  // Sand paths, each a ray from the plaza: to a cave's mouth, the library, the ₿IFRÖST stairs and the two bridges.
  const PATHS = [...CAVES.map((z) => ({ a: angleOf(z), r1: 12.1 })), { a: angleOf(ZONE.library), r1: 9 }, { a: 0, r1: 11.2 }, { a: angleOf(ZONE.mempool), r1: 15.6 }, { a: angleOf(ZONE.timechain), r1: 15.6 }];
  const islandGrid = () => {
    const grid = BL.terrain.makeGrid(NX, NY, NZ), top = new Int8Array(NX * NZ).fill(-1);
    const L = ZONE.library, ln = Math.hypot(L.x, L.z), lnx = -L.x / ln, lnz = -L.z / ln;
    const column = (ix, iz, bot, hi, mat) => {
      for (let y = Math.max(0, bot); y <= hi; y++) {
        let c;
        if (y === hi) c = mat;
        else if (y > TOPL) c = y % 2 ? P.stone : P.stone2;
        else if (y === TOPL) c = hi > TOPL ? P.stone : P.dirt;
        else if (y === TOPL - 1) c = P.clay;
        else c = y <= bot + 1 ? P.stone2 : (TOPL - y) % 3 === 0 ? P.dirt2 : (TOPL - y) % 3 === 1 ? P.dirt : P.clay;
        grid.set(ix, y, iz, c);
      }
      top[ix * NZ + iz] = hi;
    };
    for (let ix = 0; ix < NX; ix++) for (let iz = 0; iz < NZ; iz++) {
      const x = X0 + (ix + 0.5) * U, z = Z0 + (iz + 0.5) * U, r = Math.hypot(x, z), a = Math.atan2(x, -z);
      const rim = 15 + 0.35 * Math.sin(7 * a + 1) + 0.25 * Math.sin(13 * a + 2);
      if (r <= rim) {
        const t = r / rim, bot = TOPL - Math.round(3 + 5.5 * Math.sqrt(Math.max(0, 1 - t * t)) + hash(ix, iz) * 1.4);
        let h = 0, mat = Math.sin(x * 0.9 + z * 0.4) * Math.cos(z * 0.8 - x * 0.3) > 0.45 ? P.grass2 : P.grass;
        if (r < 3.6) mat = P.plaza;
        for (const p of PATHS) { const along = x * Math.sin(p.a) - z * Math.cos(p.a), perp = Math.abs(x * Math.cos(p.a) + z * Math.sin(p.a)); if (along > 3 && along < p.r1 && perp < 0.55) mat = P.sand; }
        // The rim's hills: steep where a cave opens, gapped for the two bridges, highest at the ₿IFRÖST hill.
        const cave = CAVES.find((q) => Math.abs(turn(a - angleOf(q))) * r < 2.2), gap = [ZONE.mempool, ZONE.timechain].some((q) => Math.abs(turn(a - angleOf(q))) * r < 1.0);
        const north = Math.abs(a) * r;
        if (north < 3.2 && r > 11.2) { h = Math.min(6, Math.floor((r - 11.2) / 0.4) + 1); mat = north < 0.8 ? P.sand : h >= 6 ? P.moss : P.stone2; }
        else if (!gap && r > 12) { const amp = cave ? 4 : 2 + Math.round(2 * hash(Math.round(a * 6), 9)); h = cave ? amp : Math.round(amp * Math.min(1, (r - 12) / 1.2)); if (h) mat = (Math.round(a * 5) + 20) % 3 ? P.stone2 : P.moss; }
        // The library's mound beside the stairs, its nook open toward the plaza.
        const ld = Math.hypot(x - L.x, z - L.z);
        if (ld < 1.9) { const lh = Math.round(3.2 * (1 - (ld / 1.9) ** 2)); if (lh > h) { h = lh; mat = P.moss; } }
        column(ix, iz, bot, TOPL + h, mat);
        if (cave) {
          const tl = turn(a - angleOf(cave)) * r;
          if (Math.abs(tl) < 0.8 && r > 11.9 && r < 13.6) for (let y = TOPL + 1; y <= TOPL + 2; y++) grid.set(ix, y, iz, r < 12.9 ? 0 : P.dark);
        }
        if (ld < 1.9) { const f = (x - L.x) * lnx + (z - L.z) * lnz, s = Math.abs((x - L.x) * lnz - (z - L.z) * lnx); if (s < 0.6 && f > -0.3) for (let y = TOPL + 1; y <= TOPL + 2; y++) if (grid.get(ix, y, iz)) grid.set(ix, y, iz, f > 0.2 ? 0 : P.dark); }
        continue;
      }
      for (const s of ISLETS) {
        const d = Math.hypot(x - s.c.x, z - s.c.z), q = Math.atan2(x - s.c.x, -(z - s.c.z)), edge = s.r + 0.3 * Math.sin(5 * q + s.r);
        if (d > edge) continue;
        const t = d / edge, bot = s.top - Math.round(2 + s.depth * Math.sqrt(Math.max(0, 1 - t * t)) + hash(ix, iz));
        let hi = s.top, mat = s.c.kind === "rainforest" ? P.forest : P.moss;
        if (s.c.kind === "rainforest" && d < 2.4) { hi = s.top - 1; mat = P.lake; } else if (s.c.kind === "rainforest" && d < 2.9) { hi = s.top - 1; mat = P.sand; }
        column(ix, iz, bot, hi, mat);
      }
    }
    return { grid, top };
  };
  // The Timechain Sphere in finer voxels: orange, its sixteen screen lunes parted by white stripes.
  const sphereGrid = () => {
    const n = 19, R = 9.3, g = BL.terrain.makeGrid(n, n, n);
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) for (let k = 0; k < n; k++) {
      const x = i + 0.5 - n / 2, y = j + 0.5 - n / 2, z = k + 0.5 - n / 2;
      if (x * x + y * y + z * z > R * R) continue;
      const w = (Math.atan2(z, x) / (Math.PI * 2) * 16 + 16) % 1;
      g.set(i, j, k, w < 0.2 || Math.abs(y) < 0.6 ? 2 : 1);
    }
    return g;
  };
  const build = ({ M, createNode, addChild, place, top, label }) => {
    const root = place(createNode({ position: { x: AT.x, y: top, z: AT.z }, rotation: { x: 0, y: AT.ry, z: 0 } }));
    const T = TABLE, base = [], model = [], glow = [], SEA = T.h + 0.06, V = U * S;
    // The table: a dark timber top on four legs, a black glass bed with a lit edge all round, the sea of blue glass.
    base.push(M.bevelBox({ w: T.w, h: 0.08, d: T.d, color: "#3b2a1a", bevel: 0.03, offset: { x: 0, y: T.h - 0.04, z: 0 } }),
      ...[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b]) => M.box({ w: 0.1, h: T.h - 0.08, d: 0.1, color: "#2a1d12", offset: { x: a * (T.w / 2 - 0.12), y: (T.h - 0.08) / 2, z: b * (T.d / 2 - 0.12) } })),
      M.box({ w: T.w - 0.12, h: 0.04, d: T.d - 0.12, color: "#14161a", offset: { x: 0, y: T.h + 0.02, z: 0 } }),
      M.box({ w: T.w - 0.3, h: 0.02, d: T.d - 0.3, color: "#2a78b0", offset: { x: 0, y: T.h + 0.05, z: 0 } }));
    for (const [w, d, x, z] of [[T.w - 0.12, 0.025, 0, (T.d - 0.12) / 2], [T.w - 0.12, 0.025, 0, -(T.d - 0.12) / 2], [0.025, T.d - 0.12, (T.w - 0.12) / 2, 0], [0.025, T.d - 0.12, -(T.w - 0.12) / 2, 0]]) glow.push(M.box({ w, h: 0.02, d, color: "#e8f4ff", emissive: 1.4, offset: { x, y: T.h + 0.045, z } }));
    const { grid, top: tops } = islandGrid();
    const land = BL.terrain.gridGeometry(grid, { unit: V, palette: COLORS.map((c) => c && BL.math.hexToRgb(c)), origin: { x: X0 * S, y: SEA, z: Z0 * S } });
    // The height of the ground at a point of the island, in metres over the table's frame.
    const ground = (x, z) => { const ix = Math.floor((x - X0) / U), iz = Math.floor((z - Z0) / U); return SEA + ((ix >= 0 && iz >= 0 && ix < NX && iz < NZ ? tops[ix * NZ + iz] : TOPL) + 1) * V; };
    const G = SEA + (TOPL + 1) * V;
    const put = (geo, x, z, y = ground(x, z)) => model.push(M.moved(geo, x * S, y, z * S));
    // Trees: round green crowns, pink blossom and palms on the meadow and the hills, off the paths and the zones.
    const roundTree = (k, pink) => M.merge(M.box({ w: 0.01, h: 0.045, d: 0.01, color: "#5a3a22", offset: { x: 0, y: 0.022, z: 0 } }),
      M.bevelBox({ w: 0.06, h: 0.05, d: 0.06, color: pink ? (k % 2 ? "#f29ac2" : "#f7b8d6") : (k % 2 ? "#3f8f34" : "#2f7a2c"), bevel: 0.016, offset: { x: 0, y: 0.065, z: 0 } }),
      M.bevelBox({ w: 0.04, h: 0.035, d: 0.04, color: pink ? "#f7c6dd" : "#4f9f3c", bevel: 0.012, offset: { x: 0.008, y: 0.095, z: -0.006 } }));
    const palm = (k) => M.merge(M.turnedZ(M.box({ w: 0.009, h: 0.08, d: 0.009, color: "#8a6a3e", offset: { x: 0, y: 0.04, z: 0 } }), 0.12),
      ...[0, 1, 2, 3, 4].map((i) => M.moved(M.turnedY(M.turnedX(M.box({ w: 0.014, h: 0.004, d: 0.045, color: i % 2 ? "#3f9a34" : "#2f8a2c", offset: { x: 0, y: 0, z: 0.022 } }), 0.4), i / 5 * Math.PI * 2 + k), -0.01, 0.08, 0)));
    const clear = (x, z, pad) => !ZONES.some((q) => q.kind !== "cave" && Math.hypot(q.x - x, q.z - z) < q.r + pad) && !PATHS.some((p) => { const along = x * Math.sin(p.a) - z * Math.cos(p.a); return along > 2.5 && along < p.r1 + 1 && Math.abs(x * Math.cos(p.a) + z * Math.sin(p.a)) < pad; }) && Math.abs(Math.atan2(x, -z)) * Math.hypot(x, z) > 3.6;
    for (let k = 0; k < 120; k++) {
      const a = hash(k, 1) * Math.PI * 2, d = 4.6 + hash(k, 2) * 9.6, x = Math.sin(a) * d, z = -Math.cos(a) * d, kind = hash(k, 4);
      if (!clear(x, z, 0.9) || CAVES.some((q) => Math.abs(turn(a - angleOf(q))) * d < 1.6 && d > 11)) continue;
      put(kind < 0.35 ? palm(k) : roundTree(k, kind > 0.78), x, z);
    }
    // The pile, the jumbotron on its legs facing the plaza, and the four totems in two pairs by it.
    put(M.lathe({ profile: [[0, 0], [1.6 * S, 0], [1.1 * S, 0.03], [0.5 * S, 0.055], [0, 0.065]], segments: 12, color: "#f2d43a" }), 0, 0, G);
    for (let k = 0; k < 9; k++) put(M.bevelBox({ w: 0.012, h: 0.008, d: 0.03, color: "#ffe25a", bevel: 0.003 }), Math.sin(k * 2.4) * (0.6 + k * 0.08), Math.cos(k * 2.4) * (0.6 + k * 0.08), G + 0.02 + (k % 3) * 0.012);
    for (const sx of [-1, 1]) put(M.box({ w: 0.01, h: 0.07, d: 0.01, color: "#2a2620" }), sx * 1.3, 6.3, G);
    put(M.box({ w: 3.2 * S, h: 0.07, d: 0.012, color: "#1b1d24", offset: { x: 0, y: 0.06, z: 0 } }), 0, 6.3, G);
    glow.push(M.moved(M.box({ w: 3.0 * S, h: 0.06, d: 0.004, color: "#5ec8ff", emissive: 0.9 }), 0, G + 0.095, 6.3 * S - 0.008));
    for (const [x, z, ink] of [[-3.2, 5.4, "#c84a3a"], [-2.4, 6.6, "#3aa0c8"], [2.4, 6.6, "#e8a03a"], [3.2, 5.4, "#9a5ac8"]]) put(M.merge(M.box({ w: 0.024, h: 0.07, d: 0.024, color: "#8a5a2c", offset: { x: 0, y: 0.035, z: 0 } }), ...[0.02, 0.045].map((y) => M.box({ w: 0.027, h: 0.008, d: 0.027, color: ink, offset: { x: 0, y, z: 0 } })), M.box({ w: 0.05, h: 0.006, d: 0.01, color: "#6b4424", offset: { x: 0, y: 0.06, z: 0 } })), x, z, G);
    // Each cave's mouth: a sign over it in the cave's colour and a banner either side, facing the plaza.
    for (const z of CAVES) {
      const a = angleOf(z), sa = Math.sin(a), ca = -Math.cos(a), r = 11.95, y0 = SEA + (TOPL + 3) * V;
      const sign = M.merge(M.box({ w: 1.9 * S, h: 0.02, d: 0.006, color: "#8a5a2c", offset: { x: 0, y: 0.01, z: 0 } }), ...[-1, 1].map((s) => M.box({ w: 0.012, h: 0.06, d: 0.004, color: z.ink, offset: { x: s * 1.25 * S, y: -0.02, z: 0 } })));
      model.push(M.moved(M.turnedY(sign, -a), sa * r * S, y0, ca * r * S));
      glow.push(M.moved(M.turnedY(M.box({ w: 1.5 * S, h: 0.008, d: 0.004, color: z.ink, emissive: 1.1 }), -a), sa * (r - 0.1) * S, y0 + 0.01, ca * (r - 0.1) * S));
    }
    // The library's nook: three shelves of books in its mouth, the whitepaper's black monolith on the mound above.
    { const L = ZONE.library, n = Math.hypot(L.x, L.z), fx = L.x - L.x / n * 0.25, fz = L.z - L.z / n * 0.25;
      for (let k = 0; k < 3; k++) model.push(M.moved(M.turnedY(M.box({ w: 1.0 * S, h: 0.006, d: 0.008, color: ["#c84a3a", "#3aa0c8", "#e8c35a"][k] }), -Math.atan2(L.x, -L.z)), fx * S, G + 0.005 + k * 0.009, fz * S));
      put(M.turnedY(M.box({ w: 0.5 * S, h: 0.07, d: 0.18 * S, color: "#101012", offset: { x: 0, y: 0.035, z: 0 } }), -Math.atan2(L.x, -L.z)), L.x + L.x / n * 0.6, L.z + L.z / n * 0.6); }
    // ₿IFRÖST's arch on its hill: stone legs and lintel, the blue portal between them, the orange ₿ medallion over it;
    // the crystal bridge stepping down to the islet, its small gate there.
    { const ay = SEA + (TOPL + 7) * V, az = -14.0 * S;
      model.push(...[-1, 1].map((s) => M.box({ w: 0.5 * S, h: 0.1, d: 0.5 * S, color: "#d8d2c4", offset: { x: s * 1.1 * S, y: ay + 0.05, z: az } })), M.box({ w: 2.8 * S, h: 0.02, d: 0.55 * S, color: "#d8d2c4", offset: { x: 0, y: ay + 0.11, z: az } }));
      glow.push(M.box({ w: 1.7 * S, h: 0.095, d: 0.004, color: "#4fb8ff", emissive: 1.0, offset: { x: 0, y: ay + 0.0475, z: az } }),
        M.moved(M.turnedX(M.lathe({ profile: [[0, 0], [0.018, 0], [0.018, 0.004], [0, 0.004]], segments: 14, color: "#f7931a", emissive: 1.2 }), Math.PI / 2), 0, ay + 0.11, az + 0.28 * S),
        ...[-1, 1].map((s) => M.box({ w: 0.06 * S, h: 0.08, d: 0.06 * S, color: "#b98cff", emissive: 0.8, offset: { x: s * 0.86 * S, y: ay + 0.04, z: az - 0.27 * S } })));
      const by = SEA + (TOPL + 4) * V, b0 = 15.2, b1 = ZONE.bifrost.z + 2.6, steps = 5;
      for (let k = 0; k < steps; k++) { const z0 = -(b0 + (-b1 - b0) * k / steps), z1 = -(b0 + (-b1 - b0) * (k + 1) / steps); glow.push(M.box({ w: 0.9 * S, h: 0.006, d: Math.abs(z1 - z0) * S + 0.002, color: "#b98cff", emissive: 0.7, offset: { x: 0, y: ay - (ay - by) * (k + 0.5) / steps, z: (z0 + z1) / 2 * S } })); }
      const I = ZONE.bifrost;
      for (const s of [-1, 1]) glow.push(M.box({ w: 0.25 * S, h: 0.07, d: 0.25 * S, color: "#b98cff", emissive: 0.9, offset: { x: (I.x + s * 1.0) * S, y: by + 0.035, z: I.z * S } }));
      glow.push(M.box({ w: 2.3 * S, h: 0.012, d: 0.3 * S, color: "#b98cff", emissive: 0.9, offset: { x: I.x * S, y: by + 0.076, z: I.z * S } })); }
    // The two bridges over the gaps in the rim: the vine bridge to the Mempool island, the wooden one to the Sphere.
    const bridge = (q, r0, r1, deck, rope) => {
      const a = angleOf(q), len = r1 - r0, mid = (r0 + r1) / 2, part = [];
      for (let k = 0; k < Math.round(len / 0.45); k++) part.push(M.box({ w: 1.0 * S, h: 0.004, d: 0.32 * S, color: k % 2 ? deck : "#7a5530", offset: { x: 0, y: 0, z: (-len / 2 + 0.22 + k * 0.45) * S } }));
      for (const s of [-1, 1]) part.push(M.box({ w: 0.004, h: 0.004, d: len * S, color: rope, offset: { x: s * 0.5 * S, y: 0.018, z: 0 } }), ...[0, 1].map((e) => M.box({ w: 0.005, h: 0.022, d: 0.005, color: "#5a3a22", offset: { x: s * 0.5 * S, y: 0.009, z: (e - 0.5) * len * S } })));
      model.push(M.moved(M.turnedY(M.merge(...part), Math.PI - a), Math.sin(a) * mid * S, G - 0.002, -Math.cos(a) * mid * S));
    };
    bridge(ZONE.mempool, 14.8, 17.6, "#9a6a3a", "#3f7a2a");
    bridge(ZONE.timechain, 14.8, 19.9, "#a8774a", "#6b4424");
    // The Mempool island's rainforest round its lake, and the Timechain Sphere on its islet.
    { const Mp = ZONE.mempool;
      for (let k = 0; k < 34; k++) { const a = hash(k, 7) * Math.PI * 2, d = 3.1 + hash(k, 8) * 2.0, x = Mp.x + Math.sin(a) * d, z = Mp.z - Math.cos(a) * d; if (Math.abs(turn(Math.atan2(x - Mp.x, -(z - Mp.z)) - angleOf(Mp) - Math.PI)) * d < 0.8) continue; put(hash(k, 5) < 0.25 ? palm(k) : M.merge(M.box({ w: 0.01, h: 0.05, d: 0.01, color: "#4a3020", offset: { x: 0, y: 0.025, z: 0 } }), M.bevelBox({ w: 0.075, h: 0.06, d: 0.075, color: k % 3 ? "#1f6a24" : "#2f8a34", bevel: 0.02, offset: { x: 0, y: 0.075, z: 0 } })), x, z); } }
    const ball = BL.terrain.gridGeometry(sphereGrid(), { unit: 0.25 * S, palette: [null, BL.math.hexToRgb("#f7931a"), BL.math.hexToRgb("#f4f0e6")], origin: { x: (ZONE.timechain.x - 19 * 0.125) * S, y: SEA + TOPL * V - 0.006, z: (ZONE.timechain.z - 19 * 0.125) * S } });
    // Clouds: a few white voxel puffs drifting round the island, over the sea.
    for (const [x, z, h, k] of [[-25, -9, 7, 1], [-23, 5, 5, 2], [25, -7, 8, 3], [11, -21, 6, 4], [-11, -23, 9, 5], [28, 3, 5, 6], [-27, 21, 6, 7], [5, 19, 8, 8]]) {
      const puffs = [];
      for (let i = 0; i < 4; i++) puffs.push(M.bevelBox({ w: (1.2 + hash(k, i) * 1.2) * S, h: (0.5 + hash(i, k) * 0.5) * S, d: (0.8 + hash(k + 3, i) * 0.6) * S, color: i % 2 ? "#f4f7fb" : "#e6ecf4", bevel: 0.008, offset: { x: (i - 1.5) * 0.8 * S, y: hash(i, k + 5) * 0.4 * S, z: (hash(k, i + 9) - 0.5) * 0.8 * S } }));
      put(M.merge(...puffs), x, z, SEA + (TOPL + h) * V);
    }
    addChild(root, createNode({ geometry: M.merge(...base) }), createNode({ geometry: land }), createNode({ geometry: ball }), createNode({ geometry: M.merge(...model) }), createNode({ geometry: M.merge(...glow), sightHidden: true }));
    // The labels: each zone's name on a little card tilted up toward the front of the table, without the label's
    // wooden back, whose fixed margin and depth would bury the model.
    for (const z of ZONES) {
      const w = label(z.label, "", { height: 0.028, style: "gold" }), n = createNode({ position: { x: z.x * S, y: G + 0.16, z: (z.z + (z.kind === "cave" || z.kind === "nook" ? 0 : z.r * 0.3)) * S }, rotation: { x: -0.7, y: 0, z: 0 }, sightHidden: true });
      addChild(n, createNode({ geometry: w.face, sightHidden: true }));
      addChild(root, n);
    }
    const words = label("OOGA BOOGA LAND", "a site model of the island · click any zone", { height: 0.2, style: "gold" });
    addChild(root, createNode({ geometry: words.back, position: { x: 0, y: T.h - 0.16, z: T.d / 2 + 0.03 } }), createNode({ geometry: words.face, position: { x: 0, y: T.h - 0.16, z: T.d / 2 + 0.03 } }));
    // A pick box over each zone, for the scene to make clickable.
    const pick = (w, h, d) => ({ verts: [-w / 2, -h / 2, -d / 2, w / 2, -h / 2, -d / 2, w / 2, h / 2, -d / 2, -w / 2, h / 2, -d / 2, -w / 2, -h / 2, d / 2, w / 2, -h / 2, d / 2, w / 2, h / 2, d / 2, -w / 2, h / 2, d / 2], faces: [], lines: [], castShadow: false });
    const zones = ZONES.map((z, i) => { const n = createNode({ geometry: pick(z.r * 2 * S + 0.08, 0.3, z.r * 2 * S + 0.08), position: { x: z.x * S, y: G + 0.1, z: z.z * S } }); addChild(root, n); return { node: n, zone: z, page: i + 1 }; });
    if (BL.genesisScaleCards) for (const id of Object.keys(BL.genesisScaleCards)) cardOf(id);
    return { root, zones, update: () => {} };
  };
  BL.genesisScaleModel = { layout, build, pages, ZONES };
})();
