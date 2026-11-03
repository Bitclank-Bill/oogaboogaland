// Genesis museum: a scale model of Ooga Booga Land on a table, as architects build of their buildings: the floating
// island in voxels with its rocky underside hanging below, the ring of hills round its meadow, the caves where caves.js
// puts them (by the clock, from the north) with a lit pin over each, the sand paths to them, trees, the banana pile and
// the jumbotron in the middle; the Mempool island with its lake across a vine bridge at 4 o'clock, ₿IFRÖST's islet and
// arch past the north pass, and the Timechain Sphere off the southwest rim. The model floats over a sea of blue glass on
// a clear rod and turns slowly (still in Calm). Space beside it (or a tap) opens a few lines on each place.
// `layout()` (pure) is where the table stands; `build(...)` makes it once a visit; update allocates nothing.
(() => {
  "use strict";
  const BL = window.BL = window.BL || {};
  const AT = { x: -12.6, z: 27, ry: 0.5 }, TABLE = { w: 2.8, d: 2.8, h: 0.9 }, UNIT = 0.034, LIFT = 0.55;
  const layout = () => {
    const h = TABLE.w / 2 + 0.1;
    return { at: AT, box: { x0: AT.x - h, x1: AT.x + h, z0: AT.z - h, z1: AT.z + h }, use: { x: AT.x + Math.sin(AT.ry) * (h + 1.1), z: AT.z + Math.cos(AT.ry) * (h + 1.1) } };
  };
  // The places off the island and a line on each, and the board's pages.
  const AWAY = [
    { name: "Mempool island", clock: 4, r: 25, size: 6, line: "A rainforest round a lake as deep as the waiting transactions, across the vine bridge at 4 o'clock." },
    { name: "₿IFRÖST", clock: 12, r: 22, size: 3.5, line: "A gateway islet past the arch over the north pass: windows to other worlds." },
    { name: "Timechain Sphere", clock: 7.6, r: 22, size: 3, line: "A walk-in sphere off the southwest rim: nine rooms of live block and mining charts." }
  ];
  const pages = () => {
    const caves = (BL.caves && BL.caves.slots || []).filter((c) => c.name && c.status !== "headquarters");
    return [
      { caption: "Ooga Booga Land", title: "A floating island", text: ["A floating island whose cliff caves are projects. The banana pile in the middle feeds the Oogas; donated bananas land on it.", ...caves.map((c) => `${c.name}, ${Math.round(c.clock)} o'clock: ${c.title || (c.status === "mirror" ? "the cave behind the Matrix mirror" : "a cave in the cliffs")}`)] },
      { caption: "Ooga Booga Land", title: "Beyond the rim", text: AWAY.map((p) => `${p.name}: ${p.line}`) }
    ];
  };
  const hash = (a, b) => { const v = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return v - Math.floor(v); };
  const P = { grass: 0, grass2: 1, rock: 2, rock2: 3, dirt: 4, sand: 5, leaf: 6, leaf2: 7, trunk: 8, banana: 9, screen: 10, water: 11, mouth: 12, bridge: 13, arch: 14, sphere: 15, sphere2: 16, under: 17 };
  const PALETTE = ["#5c9a3a", "#6aa844", "#7d7a72", "#8f8b82", "#7a5a3a", "#d9c08a", "#2f7a2c", "#3f8f34", "#5a3a22", "#f2d43a", "#1b1d24", "#4fb8ff", "#14100c", "#8a5a2c", "#b98cff", "#f7931a", "#2a2d33", "#5e5850"];
  const islandVox = () => {
    const V = BL.models.makeVox(), R = 15;
    const disc = (cx, cz, r, depth, top, surface = () => P.grass) => {
      for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) for (let z = Math.floor(cz - r); z <= Math.ceil(cz + r); z++) {
        const d = Math.hypot(x - cx, z - cz);
        if (d > r) continue;
        const h = top(x, z, d), low = -Math.round((r - d) * depth + 1 + hash(x, z) * 1.5);
        for (let y = low; y <= h; y++) V.set(x, y, z, y === h ? surface(x, y, z) : y < -2 ? P.under : (hash(x + y, z) < 0.5 ? P.rock : P.rock2));
      }
    };
    // The main island: a meadow, hills round the rim, the plaza, paths and caves.
    const caves = (BL.caves && BL.caves.slots || []).filter((c) => c.name && c.status !== "headquarters").map((c) => c.clock / 12 * Math.PI * 2);
    disc(0, 0, R, 1.15, (x, z, d) => d < 11 ? 0 : Math.round(1 + (d - 11) * 0.9 + hash(x, z) * 1.4), (x, y, z) => {
      const d = Math.hypot(x, z);
      let top = d < 3.6 ? P.sand : d < 11 ? (hash(x, z) < 0.5 ? P.grass : P.grass2) : (y > 2 ? P.rock2 : P.grass);
      if (d < 11 && d > 3.6) for (const ca of caves) { const dx = Math.sin(ca), dz = -Math.cos(ca), t = x * dx + z * dz, off = Math.abs(x * dz - z * dx); if (t > 3 && off < 0.8) top = P.dirt; }
      return top;
    });
    // Cave mouths cut into the rim, dark inside.
    for (const ca of caves) for (let r = 11; r <= 15; r++) for (let w = -1; w <= 1; w++) {
      const x = Math.round(Math.sin(ca) * r + Math.cos(ca) * w), z = Math.round(-Math.cos(ca) * r + Math.sin(ca) * w);
      for (let y = 1; y <= 6; y++) V.del(x, y, z);
      V.set(x, 0, z, r > 12 ? P.mouth : P.dirt);
    }
    // The banana pile and the jumbotron.
    for (let y = 1; y <= 3; y++) for (let x = -2; x <= 2; x++) for (let z = -2; z <= 2; z++) if (Math.hypot(x, z) <= 2.4 - y * 0.55) V.set(x, y, z, P.banana);
    for (let x = -2; x <= 2; x++) for (let y = 3; y <= 5; y++) V.set(x, y, -5, P.screen);
    for (const x of [-2, 2]) for (let y = 1; y <= 2; y++) V.set(x, y, -5, P.trunk);
    // Trees on the meadow, off the paths and the plaza.
    for (let k = 0; k < 26; k++) {
      const a = hash(k, 1) * Math.PI * 2, d = 5 + hash(k, 2) * 5.5, x = Math.round(Math.sin(a) * d), z = Math.round(-Math.cos(a) * d);
      if (V.get(x, 0, z) !== P.grass && V.get(x, 0, z) !== P.grass2) continue;
      for (let y = 1; y <= 2; y++) V.set(x, y, z, P.trunk);
      for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) for (let y = 3; y <= 4; y++) if (y === 3 || (!dx || !dz)) V.set(x + dx, y, z + dz, (k + dx + dz) % 2 ? P.leaf : P.leaf2);
    }
    // The islands beyond the rim.
    const away = (p) => ({ x: Math.round(Math.sin(p.clock / 12 * Math.PI * 2) * p.r), z: Math.round(-Math.cos(p.clock / 12 * Math.PI * 2) * p.r) });
    const mp = away(AWAY[0]), bf = away(AWAY[1]), tc = away(AWAY[2]);
    disc(mp.x, mp.z, AWAY[0].size, 1.4, () => 0);
    for (let x = mp.x - 6; x <= mp.x + 6; x++) for (let z = mp.z - 6; z <= mp.z + 6; z++) {
      const d = Math.hypot(x - mp.x, z - mp.z);
      if (d <= 2.6) V.set(x, 0, z, P.water);
      else if (d <= 6 && V.has(x, 0, z) && hash(x, z) < 0.35) { V.set(x, 1, z, P.leaf); V.set(x, 2, z, P.leaf2); }
    }
    disc(bf.x, bf.z, AWAY[1].size, 1.3, () => 0);
    for (const s of [-2, 2]) for (let y = 1; y <= 5; y++) V.set(bf.x + s, y, bf.z, P.arch);
    for (let x = -2; x <= 2; x++) V.set(bf.x + x, 6, bf.z, P.arch);
    disc(tc.x, tc.z, AWAY[2].size, 1.3, () => 0);
    for (let x = -3; x <= 3; x++) for (let y = 0; y <= 6; y++) for (let z = -3; z <= 3; z++) { const d = Math.hypot(x, y - 3, z); if (d <= 3 && d > 2) V.set(tc.x + x, y + 1, tc.z + z, (x + y + z) % 2 ? P.sphere : P.sphere2); }
    // The bridges: the vine bridge to the Mempool island, a crystal one to ₿IFRÖST.
    const bridge = (to, ink, from = 14.5, gap = 0) => { const a = Math.atan2(to.x, -to.z), len = Math.hypot(to.x, to.z) - gap; for (let r = from; r <= len; r += 0.5) V.set(Math.round(Math.sin(a) * r), 0, Math.round(-Math.cos(a) * r), ink); };
    bridge(mp, P.bridge, 14.5, AWAY[0].size - 0.5); bridge(bf, P.arch, 14.5, AWAY[1].size - 0.5); bridge(tc, P.rock2, 14.5, AWAY[2].size - 0.5);
    return V;
  };
  let modelGeo = null;
  const build = ({ M, createNode, addChild, place, top, label }) => {
    const root = place(createNode({ position: { x: AT.x, y: top, z: AT.z }, rotation: { x: 0, y: AT.ry, z: 0 } }));
    const T = TABLE;
    addChild(root, createNode({ geometry: M.merge(
      M.bevelBox({ w: T.w, h: 0.1, d: T.d, color: "#5a3a22", bevel: 0.03, offset: { x: 0, y: T.h, z: 0 } }),
      ...[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b]) => M.box({ w: 0.12, h: T.h, d: 0.12, color: "#3b2a1a", offset: { x: a * (T.w / 2 - 0.15), y: T.h / 2, z: b * (T.d / 2 - 0.15) } })),
      M.box({ w: T.w - 0.2, h: 0.03, d: T.d - 0.2, color: "#2f86b8", emissive: 0.45, offset: { x: 0, y: T.h + 0.065, z: 0 } }),
      M.box({ w: 0.04, h: LIFT + 0.1, d: 0.04, color: "#cfe8ff", emissive: 0.2, offset: { x: 0, y: T.h + LIFT / 2 + 0.05, z: 0 } }),
      M.box({ w: T.w - 0.1, h: 0.08, d: 0.06, color: "#ffd23a", emissive: 1, offset: { x: 0, y: T.h + 0.02, z: T.d / 2 } })) }));
    if (!modelGeo) modelGeo = BL.models.voxelGeometry(islandVox(), { unit: UNIT, palette: PALETTE, emissive: { [P.banana]: 0.6, [P.screen]: 0.4, [P.water]: 0.5, [P.arch]: 0.9, [P.sphere]: 0.7 } });
    const spin = createNode({ position: { x: 0, y: T.h + LIFT + 20 * UNIT, z: 0 } });
    addChild(spin, createNode({ geometry: modelGeo }));
    // A lit pin over each cave, in its theme's colour.
    const INK = { lab: "#7affd8", bca: "#e8c35a", lightning: "#5ec8ff", arcade: "#ff5fa2", matrix: "#9cff9c" };
    const pins = [];
    for (const c of (BL.caves && BL.caves.slots || []).filter((s) => s.name && s.status !== "headquarters")) {
      const a = c.clock / 12 * Math.PI * 2, n = createNode({ geometry: M.box({ w: 0.05, h: 0.05, d: 0.05, color: INK[c.theme] || "#efe6cc", emissive: 2 }), position: { x: Math.sin(a) * 13 * UNIT, y: 9 * UNIT, z: -Math.cos(a) * 13 * UNIT } });
      addChild(spin, n); pins.push(n);
    }
    addChild(root, spin);
    const words = label("OOGA BOOGA LAND", "a scale model of the island · Space here", { height: 0.42, style: "gold" });
    addChild(root, createNode({ geometry: words.back, position: { x: 0, y: T.h - 0.28, z: T.d / 2 + 0.05 } }), createNode({ geometry: words.face, position: { x: 0, y: T.h - 0.28, z: T.d / 2 + 0.05 } }));
    let t = 0;
    const update = (dt, calm) => {
      t += dt;
      if (!calm) spin.rotation.y += dt * 0.08;
      spin.position.y = T.h + LIFT + 20 * UNIT + Math.sin(t * 0.9) * 0.02;
      for (let k = 0; k < pins.length; k++) pins[k].glow = 1.2 + Math.sin(t * 3 + k) * 0.6;
    };
    return { root, update };
  };
  BL.genesisScaleModel = { layout, build, pages, AWAY, islandVox, PALETTE };
})();
