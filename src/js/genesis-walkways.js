// Genesis museum: moving walkways. A belt round the courtyard's loop, clockwise (the eras in date order, gallery to
// gallery), and two belts down each gallery's walk (the old stream's line, which every era keeps clear): one in, one
// out. A walker standing on a belt is carried along it; chevrons running along each belt show which way. The layout
// is pure, so Node can check every belt stays on open floor. Original museum furniture: no brand or likeness.
(() => {
  "use strict";
  const BL = window.BL = window.BL || {};
  // Speed in m/s (a stroll; the walker's own steps add to it), widths in metres, chevrons every SPACING metres.
  const SPEED = 2.4, LOOP_W = 2.4, AISLE_W = 1.5, AISLE_OFF = 1.7, SPACING = 2.2, FROM = 1, TO = 6;

  // Each belt: a start, an end, its width and speed; `dx`, `dz` its unit direction and `len` its length.
  const belt = (kind, era, x0, z0, x1, z1, w) => {
    const len = Math.hypot(x1 - x0, z1 - z0);
    return { kind, era, x0, z0, x1, z1, w, len, dx: (x1 - x0) / len, dz: (z1 - z0) / len, speed: SPEED };
  };
  const layout = ({ museum, loop, eras, lane }) => {
    const L = loop, belts = [];
    // Round the loop clockwise seen from above: up the west side, along the north, down the east, back along the south.
    belts.push(belt("loop", -1, L.x0, L.z1, L.x0, L.z0, LOOP_W), belt("loop", -1, L.x0, L.z0, L.x1, L.z0, LOOP_W),
      belt("loop", -1, L.x1, L.z0, L.x1, L.z1, LOOP_W), belt("loop", -1, L.x1, L.z1, L.x0, L.z1, LOOP_W));
    // Down each gallery's walk, from just inside its opening to a few metres short of its back: in on one side of the
    // old stream's line, out on the other (in the era's own coordinates, turned into the museum).
    const a = { x: 0, z: 0 }, b = { x: 0, z: 0 };
    for (const e of eras) {
      const bay = museum.bays[e.n], near = e.z1 - museum.OPEN - FROM, far = e.z1 - bay.depth + TO, w = AISLE_W * museum.SCALE;
      museum.toMuseum(e.n, lane - AISLE_OFF, near, a); museum.toMuseum(e.n, lane - AISLE_OFF, far, b);
      belts.push(belt("in", e.n, a.x, a.z, b.x, b.z, w));
      museum.toMuseum(e.n, lane + AISLE_OFF, far, a); museum.toMuseum(e.n, lane + AISLE_OFF, near, b);
      belts.push(belt("out", e.n, a.x, a.z, b.x, b.z, w));
    }
    return { belts, speed: SPEED };
  };
  // Where (x, z) stands along and across a belt.
  const along = (s, x, z) => (x - s.x0) * s.dx + (z - s.z0) * s.dz;
  const across = (s, x, z) => (x - s.x0) * -s.dz + (z - s.z0) * s.dx;
  // The belt carrying a walker at (x, z), or null: inside its width, from its start to its end (a loop belt reaches
  // half its width past each end, so its corners join). Where two meet, the one just begun wins, so the walker turns.
  const beltAt = (belts, x, z) => {
    let best = null, bestT = Infinity;
    for (const s of belts) {
      const pad = s.kind === "loop" ? s.w / 2 : 0, t = along(s, x, z);
      if (t < -pad || t > s.len + pad || Math.abs(across(s, x, z)) > s.w / 2) continue;
      if (t < bestT) { best = s; bestT = t; }
    }
    return best;
  };

  const BELT = "#2a2e34", RIB = "#3a3f47", EDGE = "#f2c14e", PLATE = "#9aa4ae", CHEVRON = "#7fe8ff";
  const build = ({ M, createNode, place, top, layout: Lo }) => {
    const parts = [], glow = [], y = top + 0.03;
    for (const s of Lo.belts) {
      const yaw = Math.atan2(s.dx, s.dz), cx = (s.x0 + s.x1) / 2, cz = (s.z0 + s.z1) / 2, len = s.len + (s.kind === "loop" ? s.w : 0);
      // The belt, its ribs, lit edges and a comb plate at each end.
      parts.push(M.moved(M.turnedY(M.box({ w: s.w, h: 0.02, d: len, color: BELT }), yaw), cx, y, cz));
      for (let t = 1; t < len; t += 1) parts.push(M.moved(M.turnedY(M.box({ w: s.w * 0.92, h: 0.004, d: 0.05, color: RIB }), yaw), s.x0 + s.dx * (t - (len - s.len) / 2), y + 0.012, s.z0 + s.dz * (t - (len - s.len) / 2)));
      for (const side of [-1, 1]) glow.push(M.moved(M.turnedY(M.box({ w: 0.08, h: 0.03, d: len, color: EDGE, emissive: 0.9 }), yaw), cx - s.dz * side * (s.w / 2 + 0.04), y + 0.005, cz + s.dx * side * (s.w / 2 + 0.04)));
      if (s.kind !== "loop") for (const t of [0, s.len]) parts.push(M.moved(M.turnedY(M.box({ w: s.w + 0.2, h: 0.03, d: 0.45, color: PLATE }), yaw), s.x0 + s.dx * t, y + 0.004, s.z0 + s.dz * t));
    }
    const base = place(createNode({ geometry: M.merge(...parts), castShadow: false, sightHidden: true }));
    base.geometry.castShadow = false;
    const lit = place(createNode({ geometry: M.merge(...glow), sightHidden: true }));
    lit.geometry.castShadow = false;
    // The chevrons: one shared V, a node each, slid along their belt every frame (allocation-free).
    const v = M.merge(M.moved(M.turnedY(M.box({ w: 0.08, h: 0.012, d: 0.55, color: CHEVRON, emissive: 1.3 }), 0.8), -0.2, 0, -0.2),
      M.moved(M.turnedY(M.box({ w: 0.08, h: 0.012, d: 0.55, color: CHEVRON, emissive: 1.3 }), -0.8), 0.2, 0, -0.2));
    v.castShadow = false;
    const chevrons = [];
    for (const s of Lo.belts) {
      const scale = Math.min(1, s.w / 1.6), n = Math.max(1, Math.floor(s.len / SPACING));
      for (let i = 0; i < n; i++) {
        const node = place(createNode({ geometry: v, position: { x: s.x0, y: y + 0.018, z: s.z0 }, rotation: { x: 0, y: Math.atan2(s.dx, s.dz), z: 0 }, scale: { x: scale, y: 1, z: scale }, sightHidden: true }));
        chevrons.push({ node, s, t0: i * SPACING });
      }
    }
    let shift = 0;
    const update = (dt, calm) => {
      if (!calm) shift = (shift + dt * SPEED) % SPACING;
      for (const c of chevrons) {
        const t = (c.t0 + shift) % (Math.floor(c.s.len / SPACING) * SPACING || SPACING) + 0.3;
        c.node.position.x = c.s.x0 + c.s.dx * t; c.node.position.z = c.s.z0 + c.s.dz * t;
      }
    };
    // carry(x, z, out): the belt's velocity at (x, z) written into out, true while on a belt.
    const carry = (x, z, out) => {
      const s = beltAt(Lo.belts, x, z);
      if (!s) return false;
      out.x = s.dx * s.speed; out.z = s.dz * s.speed; out.kind = s.kind; out.era = s.era;
      return true;
    };
    update(0, true);
    return { update, carry, chevrons: chevrons.length };
  };
  BL.genesisWalkways = { layout, build, beltAt, along, across, SPEED };
})();
