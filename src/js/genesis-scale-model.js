// Genesis museum: a scale model of Ooga Booga Land as architects build a site model, flat on a low table under glass
// light and seen from above: the island laid out on a sea of dark blue glass, its meadow, sand paths and trees, the
// banana pile and the jumbotron with its totems in the middle, each cave a little cutaway room in its own colour round
// the rim (walls, floor, a lit pin), the library's nook and the whitepaper's monolith, and past the rim the Mempool
// island's rainforest round its lake across the vine bridge, ₿IFRÖST's islet under its arch, and the Timechain Sphere.
// Every zone carries a small label, and each is clickable: its window tells what the zone is, on a plan of the island
// with that zone lit. `layout()` (pure) is where the table stands and what each zone is; `build(...)` makes it once a
// visit, returning `zones` (a pick node and the zone each) for the scene to make clickable; update allocates nothing.
(() => {
  "use strict";
  const BL = window.BL = window.BL || {};
  const AT = { x: -12.6, z: 27, ry: 0.5 }, TABLE = { w: 3.6, d: 3.0, h: 0.32 }, S = 0.047, TOP = TABLE.h + 0.1;
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
  const build = ({ M, createNode, addChild, place, top, label }) => {
    const root = place(createNode({ position: { x: AT.x, y: top, z: AT.z }, rotation: { x: 0, y: AT.ry, z: 0 } }));
    const T = TABLE, base = [], model = [], glow = [];
    // The table: a dark timber top on four legs, a black glass bed with a lit edge all round, the sea of blue glass.
    base.push(M.bevelBox({ w: T.w, h: 0.08, d: T.d, color: "#3b2a1a", bevel: 0.03, offset: { x: 0, y: T.h - 0.04, z: 0 } }),
      ...[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b]) => M.box({ w: 0.1, h: T.h - 0.08, d: 0.1, color: "#2a1d12", offset: { x: a * (T.w / 2 - 0.12), y: (T.h - 0.08) / 2, z: b * (T.d / 2 - 0.12) } })),
      M.box({ w: T.w - 0.12, h: 0.04, d: T.d - 0.12, color: "#14161a", offset: { x: 0, y: T.h + 0.02, z: 0 } }),
      M.box({ w: T.w - 0.3, h: 0.02, d: T.d - 0.3, color: "#16405e", offset: { x: 0, y: T.h + 0.05, z: 0 } }));
    for (const [w, d, x, z] of [[T.w - 0.12, 0.025, 0, (T.d - 0.12) / 2], [T.w - 0.12, 0.025, 0, -(T.d - 0.12) / 2], [0.025, T.d - 0.12, (T.w - 0.12) / 2, 0], [0.025, T.d - 0.12, -(T.w - 0.12) / 2, 0]]) glow.push(M.box({ w, h: 0.02, d, color: "#e8f4ff", emissive: 1.4, offset: { x, y: T.h + 0.045, z } }));
    // The model's own frame: the island's units scaled down onto the table, its ground at TOP.
    const disc = (x, z, r, h, ink, seg = 28) => model.push(M.moved(M.lathe({ profile: [[0, 0], [r * S, 0], [r * S, h], [0, h]], segments: seg, color: ink }), x * S, TOP - 0.04, z * S));
    const box = (x, z, w, d, h, ink, y = 0, em = 0) => (em ? glow : model).push(M.box({ w: w * S, h, d: d * S, color: ink, emissive: em, offset: { x: x * S, y: TOP - 0.04 + y + h / 2, z: z * S } }));
    // The island: cliffs, the meadow, the hills round the rim, the plaza.
    disc(0, 0, 15.4, 0.05, "#6e6a5e", 40); disc(0, 0, 15, 0.06, "#5c9a3a", 40); disc(0, 0, 11, 0.062, "#6aa844", 40); disc(0, 0, 3.6, 0.064, "#d9c08a", 32);
    for (let k = 0; k < 36; k++) { const a = k / 36 * Math.PI * 2, r = 13.2 + hash(k, 3) * 1.2; if (ZONES.some((z) => z.kind === "cave" && Math.hypot(Math.sin(a) * 13 - z.x, -Math.cos(a) * 13 - z.z) < 3)) continue; model.push(M.moved(M.bevelBox({ w: 1.8 * S, h: 0.05 + hash(k, 5) * 0.05, d: 1.4 * S, color: k % 2 ? "#7d7a72" : "#8f8b82", bevel: 0.01 }), Math.sin(a) * r * S, TOP + 0.03, -Math.cos(a) * r * S)); }
    // Sand paths from the plaza to every cave, and to the bridges.
    for (const z of ZONES) if (z.kind === "cave" || z.kind === "nook" || z.kind === "rainforest" || z.kind === "islet" || z.kind === "sphere") {
      const a = Math.atan2(z.x, -z.z), len = (z.kind === "cave" || z.kind === "nook" ? Math.hypot(z.x, z.z) - 2 : Math.hypot(z.x, z.z) - z.r) - 3.6, mid = 3.6 + len / 2;
      model.push(M.moved(M.turnedY(M.box({ w: (z.kind === "rainforest" ? 0.9 : 0.7) * S, h: 0.004, d: len * S, color: z.kind === "rainforest" ? "#8a5a2c" : z.kind === "islet" ? "#b98cff" : "#d9c08a", emissive: z.kind === "islet" ? 0.4 : 0 }), a + Math.PI), Math.sin(a) * mid * S, TOP + 0.026, -Math.cos(a) * mid * S));
    }
    // Trees on the meadow, off the paths and the zones.
    for (let k = 0; k < 46; k++) {
      const a = hash(k, 1) * Math.PI * 2, d = 4.5 + hash(k, 2) * 6.5, x = Math.sin(a) * d, z = -Math.cos(a) * d;
      if (ZONES.some((q) => Math.hypot(q.x - x, q.z - z) < q.r + 0.8)) continue;
      model.push(M.moved(M.box({ w: 0.012, h: 0.05, d: 0.012, color: "#5a3a22" }), x * S, TOP + 0.05, z * S), M.moved(M.bevelBox({ w: 0.07, h: 0.06, d: 0.07, color: k % 2 ? "#2f7a2c" : "#3f8f34", bevel: 0.02 }), x * S, TOP + 0.1, z * S));
    }
    // The pile, the jumbotron and the totems.
    model.push(M.moved(M.lathe({ profile: [[0, 0], [1.6 * S, 0], [0.9 * S, 0.06], [0, 0.09]], segments: 12, color: "#f2d43a" }), 0, TOP + 0.025, 0));
    box(0, 6.2, 3.2, 0.3, 0.12, "#1b1d24", 0.07); box(0, 6.05, 3.0, 0.05, 0.1, "#5ec8ff", 0.08, 0.9);
    for (const [x, z] of [[-3.2, 5.4], [-2.4, 6.6], [2.4, 6.6], [3.2, 5.4]]) box(x, z, 0.5, 0.5, 0.11, "#8a5a2c", 0.065);
    // Each cave: a cutaway room in its own colour, its walls open toward the plaza, a lit pin over it.
    for (const z of ZONES) {
      if (z.kind !== "cave" && z.kind !== "nook") continue;
      const a = Math.atan2(z.x, -z.z), W = z.kind === "nook" ? 2.4 : 3.4, D = z.kind === "nook" ? 1.6 : 2.6, room = [];
      room.push(M.box({ w: W * S, h: 0.006, d: D * S, color: z.ink, emissive: 0.25, offset: { x: 0, y: 0.003, z: 0 } }));
      for (const [w, d, x, zz] of [[W, 0.15, 0, -D / 2], [0.15, D, -W / 2, 0], [0.15, D, W / 2, 0]]) room.push(M.box({ w: w * S, h: 0.06, d: d * S, color: "#3a3830", offset: { x: x * S, y: 0.03, z: zz * S } }));
      room.push(M.box({ w: W * 0.6 * S, h: 0.02, d: 0.4 * S, color: "#2a2620", offset: { x: 0, y: 0.016, z: -D * 0.15 * S } }), M.box({ w: 0.5 * S, h: 0.03, d: 0.5 * S, color: "#ffffff", emissive: 0.4, offset: { x: W * 0.25 * S, y: 0.02, z: D * 0.15 * S } }));
      model.push(M.moved(M.turnedY(M.merge(...room), a + Math.PI), z.x * S, TOP + 0.025, z.z * S));
      glow.push(M.moved(M.box({ w: 0.03, h: 0.03, d: 0.03, color: z.ink, emissive: 2 }), z.x * S, TOP + 0.17, z.z * S), M.moved(M.box({ w: 0.006, h: 0.1, d: 0.006, color: "#cfcfcf" }), z.x * S, TOP + 0.1, z.z * S));
    }
    // Beyond the rim: the Mempool island's rainforest round its lake and its vine bridge, ₿IFRÖST's islet under its
    // arch, and the Timechain Sphere on its own.
    for (const z of ZONES) {
      if (z.kind === "rainforest") {
        disc(z.x, z.z, z.r + 0.3, 0.05, "#6e6a5e"); disc(z.x, z.z, z.r, 0.06, "#2f7a2c");
        model.push(M.moved(M.lathe({ profile: [[0, 0], [2.4 * S, 0], [2.4 * S, 0.004], [0, 0.004]], segments: 20, color: "#4fb8ff", emissive: 0.5 }), z.x * S, TOP + 0.022, z.z * S));
        for (let k = 0; k < 18; k++) { const a = k / 18 * Math.PI * 2, d = 3.2 + hash(k, 7) * 1.8, x = z.x + Math.sin(a) * d, zz = z.z - Math.cos(a) * d; model.push(M.moved(M.bevelBox({ w: 0.08, h: 0.08, d: 0.08, color: k % 3 ? "#1f6a24" : "#2f8a34", bevel: 0.025 }), x * S, TOP + 0.08, zz * S)); }
      } else if (z.kind === "islet") {
        disc(z.x, z.z, z.r, 0.06, "#7d7a72");
        for (const sx of [-1, 1]) box(z.x + sx * 1.3, z.z, 0.35, 0.35, 0.14, "#b98cff", 0.02, 0.9);
        box(z.x, z.z, 2.95, 0.35, 0.03, "#b98cff", 0.16, 0.9);
      } else if (z.kind === "sphere") {
        disc(z.x, z.z, z.r, 0.06, "#7d7a72");
        model.push(M.moved(M.lathe({ profile: [[0, 0], [1.2 * S, 0.02], [2 * S, 2 * S], [1.2 * S, 3.6 * S], [0, 3.8 * S]], segments: 16, color: "#f7931a" }), z.x * S, TOP + 0.02, z.z * S));
        glow.push(M.moved(M.lathe({ profile: [[1.95 * S, 1.9 * S], [2.05 * S, 1.9 * S], [2.05 * S, 2.1 * S], [1.95 * S, 2.1 * S]], segments: 16, color: "#ffd23a", emissive: 1.2 }), z.x * S, TOP + 0.02, z.z * S));
      }
    }
    addChild(root, createNode({ geometry: M.merge(...base) }), createNode({ geometry: M.merge(...model) }), createNode({ geometry: M.merge(...glow), sightHidden: true }));
    // The labels: each zone's name on a little card tilted up toward the front of the table.
    for (const z of ZONES) {
      const w = label(z.label, "", { height: 0.028, style: "gold" }), n = createNode({ position: { x: z.x * S, y: TOP + 0.13, z: (z.z + (z.kind === "cave" || z.kind === "nook" ? 0 : z.r * 0.3)) * S }, rotation: { x: -0.7, y: 0, z: 0 }, sightHidden: true });
      addChild(n, createNode({ geometry: w.back, sightHidden: true }), createNode({ geometry: w.face, sightHidden: true }));
      addChild(root, n);
    }
    const words = label("OOGA BOOGA LAND", "a site model of the island · click any zone", { height: 0.2, style: "gold" });
    addChild(root, createNode({ geometry: words.back, position: { x: 0, y: T.h - 0.16, z: T.d / 2 + 0.03 } }), createNode({ geometry: words.face, position: { x: 0, y: T.h - 0.16, z: T.d / 2 + 0.03 } }));
    // A pick box over each zone, for the scene to make clickable.
    const pick = (w, h, d) => ({ verts: [-w / 2, -h / 2, -d / 2, w / 2, -h / 2, -d / 2, w / 2, h / 2, -d / 2, -w / 2, h / 2, -d / 2, -w / 2, -h / 2, d / 2, w / 2, -h / 2, d / 2, w / 2, h / 2, d / 2, -w / 2, h / 2, d / 2], faces: [], lines: [], castShadow: false });
    const zones = ZONES.map((z, i) => { const n = createNode({ geometry: pick(z.r * 2 * S + 0.08, 0.3, z.r * 2 * S + 0.08), position: { x: z.x * S, y: TOP + 0.12, z: z.z * S } }); addChild(root, n); return { node: n, zone: z, page: i + 1 }; });
    if (BL.genesisScaleCards) for (const id of Object.keys(BL.genesisScaleCards)) cardOf(id);
    return { root, zones, update: () => {} };
  };
  BL.genesisScaleModel = { layout, build, pages, ZONES };
})();
