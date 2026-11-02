// The Genesis museum's atrium centrepiece: the Steps toward Bitcoin as a walkable spiral, and a floor map of the
// galleries. An original design, drawn only from the catalogue (genesis-catalogue.js, READY data): the trail's steps
// (whitepaper citations, documented influence and the paper itself) stand on plinths in date order, spiralling
// clockwise and inward (the way the galleries run round the atrium) and rising a little each step, to the whitepaper
// on a dais in the middle; the genesis block's record stands beside it, marked as after the paper (context, not a
// step). Gold cube: a whitepaper citation, with its reference; gold ring: documented influence; the white slab: the
// paper. A gold line on the floor joins them in order (a date order only, never a claim that one led to the next).
// Round it, a ring of eight floor markers names each era and its years and points at that era's gallery arch.
//
// `layout({ entries, museum, eras })` (pure, so Node can check it): { steps: [{ id, step, year, kind, title, ref,
// x, z, h, at, ry }], paper, genesis, markers: [{ era, name, years, x, z, ry, toward }], path: [{ x, z }], obstacles,
// clear }. `entries` is the catalogue's entries; `museum` genesis-world.js MUSEUM; `eras` its ERAS.
// `build({ M, createNode, addChild, place, label, top, layout })` → { picks: [{ id, node, at }], update(dt, t, calm),
// light }: the nodes go under the scene's root via `place`; `update` runs only while the scene runs its ambient show
// (genesis-world.js holdsFor), holds every decorative motion in Calm and allocates nothing; `light` is the one point
// light it adds, over the dais.
(() => {
  "use strict";
  const BL = window.BL = window.BL || {};
  // The spiral: from the south-west (where Era 0's gallery begins), clockwise seen from above (north is -z), inward
  // from R0 to R1 and rising from H0 to H1; the paper's dais in the middle; the map's markers on a ring at MAP_R.
  const R0 = 13, R1 = 7, H0 = 0.5, H1 = 1.7, START = -2.25, SWEEP = 5.0, MAP_R = 16, PLINTH = 1.3, DAIS = 3.2;
  // The view from the arrival to the white timeline screen (scene-genesis.js ENTRY and LEGEND) stays clear.
  // (from the atrium's south wall, as scene-genesis.js places them: the screen 26 m in, the arrival 12 m in).
  const clearOf = (A) => ({ x0: -10, x1: 10, z0: A.z1 - 27, z1: A.z1 - 9 });
  const CLEAR = clearOf({ z1: 57 });
  // The Satoshi statue's parts as a body meets them, in metres from its centre (+z the way it faces), shared by its
  // mesh and its footing: the plinth's three steps (each a step up), the pedestal and the bust's body (in the way up to
  // the shoulders), the shoulders and the head (surfaces to land on). `hx`, `hz` half extents, `dz` an offset forward,
  // `rise` the top above the floor; `stand` a surface, `block` an obstacle up to `rise`, `above` standing on another
  // part rather than the floor.
  const BUST = { steps: [[2.4, 0.5], [2.05, 1.0], [1.7, 1.5]], pedestal: { half: 1.5, top: 4.0 }, chest: { hx: 2.1, hz: 1.25, top: 7.2 }, neck: 1.0, head: { hx: 0.8, hz: 0.85, h: 2.2 } };
  const statueParts = () => {
    const B = BUST, parts = [], headBase = B.chest.top - 0.1 + B.neck;
    B.steps.forEach(([h, rise], i) => parts.push({ id: `step-${i}`, hx: h, hz: h, dz: 0, rise, stand: true, block: true, above: i > 0 }));
    parts.push({ id: "robe", hx: B.chest.hx, hz: B.pedestal.half, dz: 0, rise: B.chest.top, stand: false, block: true, above: true });
    parts.push({ id: "shoulders", hx: B.chest.hx, hz: B.chest.hz, dz: 0, rise: B.chest.top, stand: true, block: false, above: true });
    parts.push({ id: "head", hx: B.head.hx, hz: B.head.hz, dz: 0, rise: headBase + B.head.h, stand: true, block: true, above: true });
    return { parts, headBase };
  };
  const bearingPoint = (r, a, out) => { out.x = r * Math.sin(a); out.z = -r * Math.cos(a); return out; };
  const layout = ({ entries, museum, eras }) => {
    const trail = entries.filter((e) => e.trail && e.connection !== "anchor");
    const paper = entries.find((e) => e.connection === "anchor") || null;
    const genesisEntry = entries.find((e) => e.id === "e7-genesis") || null;
    const n = trail.length, steps = [], path = [], obstacles = [];
    trail.forEach((e, i) => {
      const k = n > 1 ? i / (n - 1) : 0, a = START + k * SWEEP, r = R0 + (R1 - R0) * k, p = bearingPoint(r, a, { x: 0, z: 0 });
      const out = bearingPoint(r + 1.7, a, { x: 0, z: 0 });
      steps.push({ id: e.id, step: e.step, year: e.year, kind: e.connection, title: e.title, ref: e.ref, era: e.era,
        x: p.x, z: p.z, h: H0 + (H1 - H0) * k, ry: a + Math.PI, at: { x: out.x, z: out.z } });
      path.push({ x: p.x, z: p.z });
      obstacles.push({ x0: p.x - PLINTH / 2 - 0.1, x1: p.x + PLINTH / 2 + 0.1, z0: p.z - PLINTH / 2 - 0.1, z1: p.z + PLINTH / 2 + 0.1 });
    });
    // The dais in the middle: the paper, and beside it the genesis block's record (context: after the paper).
    const daisAt = { x: 0, z: 0 };
    path.push(daisAt);
    obstacles.push({ x0: -DAIS / 2, x1: DAIS / 2, z0: -DAIS / 2, z1: DAIS / 2 });
    const paperStop = paper ? { id: paper.id, step: paper.step, year: paper.year, kind: "anchor", title: paper.title, era: paper.era, x: 0, z: 0, h: 0.4, ry: Math.PI, at: { x: 0, z: DAIS / 2 + 1.4 } } : null;
    const genesis = genesisEntry ? { id: genesisEntry.id, year: genesisEntry.year, title: genesisEntry.title, era: genesisEntry.era, kind: "context", x: 4.2, z: 0.6, h: 0.9, ry: Math.PI, at: { x: 4.2, z: 2.3 } } : null;
    if (genesis) obstacles.push({ x0: genesis.x - 0.55, x1: genesis.x + 0.55, z0: genesis.z - 0.55, z1: genesis.z + 0.55 });
    // The Satoshi statue behind the dais, facing the paper's way (+z), inside the spiral's innermost turn: its plinth's
    // steps walk up from the floor, its robe is in the way, and its shoulders and head (`monument.head`) are surfaces
    // a jetpack lands on, since an obstacle with a top no longer stops feet that are within a step of it.
    const S = statueParts(), monument = { x: 0, z: -5.6, base: 4.8, parts: S.parts }, areas = [];
    for (const t of S.parts) {
      const box = { x0: monument.x - t.hx, x1: monument.x + t.hx, z0: monument.z + t.dz - t.hz, z1: monument.z + t.dz + t.hz };
      if (t.stand) areas.push({ id: `statue-${t.id}`, ...box, rise: t.rise });
      if (t.block) obstacles.push({ ...box, rise: t.rise, above: t.above });
    }
    const head = S.parts.find((t) => t.id === "head");
    monument.head = { x0: monument.x - head.hx, x1: monument.x + head.hx, z0: monument.z - head.hz, z1: monument.z + head.hz, rise: head.rise };
    // The floor map: one marker per era, on the ring, pointing at the middle of its gallery's opening.
    const markers = eras.map((e) => {
      const r = museum.rects[e.n], A = museum.atrium;
      const ox = Math.max(A.x0, Math.min(A.x1, (r.x0 + r.x1) / 2)), oz = Math.max(A.z0, Math.min(A.z1, (r.z0 + r.z1) / 2));
      const a = Math.atan2(ox, -oz), p = bearingPoint(MAP_R, a, { x: 0, z: 0 });
      return { era: e.n, name: e.name, years: e.years, x: p.x, z: p.z, toward: { x: ox, z: oz }, a, ry: a + Math.PI };
    });
    return { steps, paper: paperStop, genesis, monument, areas, markers, path, obstacles, clear: clearOf(museum.atrium), radius: { inner: R1, outer: R0, map: MAP_R } };
  };

  const GOLD = "#e8c35a", GOLD_DK = "#9a7418", STONE = "#6a645a", STONE_LT = "#8a8378";
  const build = ({ M, createNode, addChild, place, label, top, layout: L, eraColor }) => {
    const picks = [], solids = [], lines = [];
    const sign = (title, sub, x, y, z, ry, style, height = 0.5) => {
      const l = label(title, sub, { height, style }), node = place(createNode({ position: { x, y, z }, rotation: { x: 0, y: ry, z: 0 } }));
      addChild(node, createNode({ geometry: l.back }), createNode({ geometry: l.face }));
      return node;
    };
    // The plinths: a stone column in the step's era colour, its mark on top, its sign facing out.
    for (const s of L.steps) {
      solids.push(M.moved(M.box({ w: PLINTH, h: s.h, d: PLINTH, color: eraColor(s.era) }), s.x, top + s.h / 2, s.z));
      solids.push(M.moved(M.box({ w: PLINTH + 0.2, h: 0.12, d: PLINTH + 0.2, color: STONE_LT }), s.x, top + s.h + 0.06, s.z));
      const y = top + s.h + 0.12;
      if (s.kind === "citation") solids.push(M.moved(M.box({ w: 0.55, h: 0.55, d: 0.55, color: GOLD, emissive: 0.5 }), s.x, y + 0.3, s.z));
      else solids.push(M.moved(M.turnedX(M.torus(0.32, 0.07, GOLD, 0.5), Math.PI / 2), s.x, y + 0.42, s.z));
      sign(`STEP ${s.step} · ${s.year}`, `${s.title}${s.ref ? ` ${s.ref}` : ""} · ${s.kind === "citation" ? "whitepaper citation" : "documented influence"}`, s.x, y + 1.15, s.z, s.ry, "gold", 0.42);
      picks.push({ id: s.id, at: s.at, node: place(createNode({ geometry: pickBox(PLINTH, s.h + 1.4, PLINTH), position: { x: s.x, y: top + (s.h + 1.4) / 2, z: s.z } })) });
    }
    // The gold line on the floor through the steps in date order, ending at the dais.
    for (let i = 0; i + 1 < L.path.length; i++) {
      const a = L.path[i], b = L.path[i + 1], len = Math.hypot(b.x - a.x, b.z - a.z), yaw = Math.atan2(b.x - a.x, b.z - a.z);
      lines.push(M.moved(M.turnedY(M.box({ w: 0.18, h: 0.02, d: len, color: GOLD, emissive: 0.7 }), yaw), (a.x + b.x) / 2, top + 0.012, (a.z + b.z) / 2));
    }
    // The dais and the paper: a low round stone, a white slab with a gold edge, its sign.
    solids.push(M.moved(M.box({ w: DAIS, h: 0.4, d: DAIS, color: STONE }), 0, top + 0.2, 0));
    if (L.paper) {
      solids.push(M.moved(M.box({ w: 1.5, h: 2.1, d: 0.18, color: "#f5f0e2", emissive: 0.15 }), 0, top + 0.4 + 1.05, 0));
      solids.push(M.moved(M.box({ w: 1.62, h: 2.22, d: 0.12, color: GOLD_DK }), 0, top + 0.4 + 1.05, -0.06));
      sign(`STEP ${L.paper.step} · ${L.paper.year}`, `${L.paper.title} · the whitepaper itself · announced 31 October 2008`, 0, top + 3.1, 0.2, Math.PI, "gold", 0.5);
      picks.push({ id: L.paper.id, at: L.paper.at, node: place(createNode({ geometry: pickBox(1.6, 2.6, 0.6), position: { x: 0, y: top + 1.7, z: 0 } })) });
    }
    // The genesis block's record beside it: a dark cube, after the paper (context, not a step).
    let cube = null;
    if (L.genesis) {
      solids.push(M.moved(M.box({ w: 0.9, h: L.genesis.h, d: 0.9, color: "#2a2522" }), L.genesis.x, top + L.genesis.h / 2, L.genesis.z));
      cube = place(createNode({ geometry: M.box({ w: 0.5, h: 0.5, d: 0.5, color: "#ff9a3a", emissive: 0.9 }), position: { x: L.genesis.x, y: top + L.genesis.h + 0.45, z: L.genesis.z } }));
      sign(`${L.genesis.year} · AFTER THE PAPER`, `${L.genesis.title} · context, not a step`, L.genesis.x, top + L.genesis.h + 1.3, L.genesis.z, Math.PI, "plain", 0.38);
      picks.push({ id: L.genesis.id, at: L.genesis.at, node: place(createNode({ geometry: pickBox(1, L.genesis.h + 1, 1), position: { x: L.genesis.x, y: top + (L.genesis.h + 1) / 2, z: L.genesis.z } })) });
    }
    // The Satoshi statue (bustParts), behind the dais.
    if (L.monument) bustParts(M, L.monument, top, sign, place, createNode);
    // The floor map: for each era a chevron on the floor pointing at its gallery and a low sign facing the middle.
    for (const m of L.markers) {
      const c = eraColor(m.era);
      for (const s of [-1, 1]) lines.push(M.moved(M.turnedY(M.box({ w: 0.22, h: 0.025, d: 1.6, color: c, emissive: 0.8 }), m.a + s * 0.55), m.x + Math.sin(m.a) * 0.6 - s * Math.cos(m.a) * 0.45, top + 0.014, m.z - Math.cos(m.a) * 0.6 - s * Math.sin(m.a) * 0.45));
      sign(`ERA ${m.era} · ${m.name.toUpperCase()}`, `${m.years} · its gallery is this way`, m.x - Math.sin(m.a) * 0.9, top + 0.95, m.z + Math.cos(m.a) * 0.9, m.ry, "plain", 0.42);
    }
    place(createNode({ geometry: M.merge(...solids) }));
    place(createNode({ geometry: M.merge(...lines), sightHidden: true }));
    // A bead of light runs along the gold line from the first step to the paper (held still in Calm).
    const bead = place(createNode({ geometry: M.box({ w: 0.22, h: 0.22, d: 0.22, color: "#fff2c4", emissive: 1.6 }), position: { x: L.path[0].x, y: top + 0.2, z: L.path[0].z } }));
    const segs = L.path.length - 1, anim = { t: 0 };
    const update = (dt, t, calm) => {
      if (calm) { bead.visible = false; return; }
      bead.visible = true;
      anim.t = (anim.t + dt / 2.2) % (segs + 1);
      const i = Math.min(segs - 1, Math.floor(anim.t)), f = Math.min(1, anim.t - i), a = L.path[i], b = L.path[i + 1];
      bead.position.x = a.x + (b.x - a.x) * f; bead.position.z = a.z + (b.z - a.z) * f;
      if (cube) cube.rotation.y += dt * 0.6;
    };
    return { picks, update, light: [0, top + 6, 0, 16, 1.3, 1.1, 0.75] };
  };
  // The Satoshi statue: a large polished-gold bust on a pale stone pedestal, the Bitcoin sign on a coin on its chest,
  // a smooth faceless head under an Ooga's heavy brow, and a high open collar. An original Ooga statue, not a likeness
  // and after no other sculpture. Its sizes are BUST's, which its footing shares (statueParts). One merged mesh.
  const bustParts = (M, S, top, sign, place, createNode) => {
    const parts = [], at = (g, x, y, z) => M.moved(g, S.x + x, top + y, S.z + z), B = BUST, C = B.chest;
    const block = (w, h, d, color, x, y, z, bevel = 0.1, emissive = 0.04) => parts.push(at(M.bevelBox({ w, h, d, color, bevel, emissive }), x, y, z));
    const MARBLE = "#ece7dd", MARBLE_D = "#d3ccbe", G0 = "#fff0b0", G1 = "#f3cd62", G2 = "#d29f33", G3 = "#9a6f17", G4 = "#5a420e";
    // The plinth: three marble steps, a gold inlay round the top one, then the pedestal with a moulded foot and cap.
    B.steps.forEach(([h, rise], i) => block(h * 2, 0.5, h * 2, i % 2 ? MARBLE_D : MARBLE, 0, rise - 0.25, 0, 0.05, 0));
    parts.push(at(M.box({ w: B.steps[2][0] * 2 + 0.04, h: 0.06, d: B.steps[2][0] * 2 + 0.04, color: G2, emissive: 0.3 }), 0, B.steps[2][1] - 0.1, 0));
    const P = B.pedestal, pw = P.half * 2, base = B.steps[2][1];
    block(pw + 0.2, 0.25, pw + 0.2, MARBLE_D, 0, base + 0.125, 0, 0.05, 0);
    block(pw, P.top - base - 0.5, pw, MARBLE, 0, base + 0.25 + (P.top - base - 0.5) / 2, 0, 0.06, 0);
    block(pw + 0.3, 0.25, pw + 0.3, MARBLE_D, 0, P.top - 0.125, 0, 0.05, 0);
    // The bust: a chest broadening to rounded shoulders, cut off at the upper arm as busts are.
    const y0 = P.top, cz = 0;
    block(C.hx * 2 - 0.4, 1.45, C.hz * 2 - 0.1, G2, 0, y0 + 0.725, cz, 0.3);
    block(C.hx * 2, 1.35, C.hz * 2, G1, 0, y0 + 2.05, cz, 0.4);
    for (const sx of [-1, 1]) {
      block(1.5, 0.75, C.hz * 2 - 0.2, G1, sx * 1.25, C.top - 0.375, cz, 0.35);
      block(0.6, 2.0, C.hz * 2 - 0.3, G2, sx * (C.hx - 0.25), y0 + 1.6, cz, 0.3);
      block(0.06, 1.7, C.hz * 2 - 0.5, G4, sx * (C.hx + 0.03), y0 + 1.55, cz, 0.02, 0);
      // The polish: a light catching each shoulder's crest.
      parts.push(at(M.box({ w: 1.1, h: 0.05, d: 0.5, color: G0, emissive: 0.45 }), sx * 1.2, C.top + 0.005, cz + 0.2));
    }
    block(1.6, 0.4, C.hz * 2 - 0.4, G1, 0, C.top - 0.2, cz, 0.15);
    // Folds of cloth falling down the chest and the back.
    for (const fx of [-1.35, -0.6, 0.6]) block(0.16, 2.1, 0.14, G3, fx, y0 + 1.25, C.hz + 0.02, 0.04);
    for (const fx of [-1.1, 0, 1.1]) block(0.16, 2.2, 0.14, G3, fx, y0 + 1.3, -C.hz - 0.02, 0.04);
    // The collar standing open round the neck, and the neck.
    for (const sx of [-1, 1]) parts.push(at(M.turnedY(M.bevelBox({ w: 0.18, h: 1.1, d: 1.4, color: G1, bevel: 0.05, emissive: 0.05 }), sx * 0.35), sx * 0.8, C.top + 0.45, 0.2));
    const hb = C.top - 0.1 + B.neck, H = B.head;
    block(0.95, B.neck + 0.2, 0.95, G2, 0, C.top - 0.1 + (B.neck + 0.2) / 2, 0, 0.12);
    // The head: smooth and faceless under the brow, a short nose, a cap of hair, a squared crown; its top is BUST's.
    block(H.hx * 2, H.h - 0.3, H.hz * 2, G1, 0, hb + (H.h - 0.3) / 2, 0, 0.3);
    block(H.hx * 2 + 0.06, 0.6, H.hz * 2 + 0.04, G3, 0, hb + H.h - 0.55, -0.05, 0.2);
    block(H.hx * 2 - 0.1, 0.2, 0.3, G4, 0, hb + H.h * 0.62, H.hz + 0.03, 0.06);
    block(0.26, 0.38, 0.22, G2, 0, hb + H.h * 0.45, H.hz + 0.05, 0.06);
    block(H.hx * 2 - 0.2, 0.2, H.hz * 2 - 0.2, G2, 0, hb + H.h - 0.1, 0, 0.08);
    parts.push(at(M.box({ w: 0.9, h: 0.04, d: 0.4, color: G0, emissive: 0.45 }), 0, hb + H.h - 0.6, H.hz - 0.1));
    // The coin on the chest: a raised disc with a rim, and the Bitcoin sign in relief (a B with its two strokes).
    const ox = 0.95, oy = y0 + 1.75, oz = C.hz;
    parts.push(at(M.turnedX(M.lathe({ profile: [[0, 0], [0.62, 0], [0.62, 0.1], [0.5, 0.12], [0, 0.12]], segments: 24, color: G2, emissive: 0.08 }), Math.PI / 2), ox, oy, oz));
    const glyph = (w, h, x, y) => parts.push(at(M.box({ w, h, d: 0.06, color: G0, emissive: 0.3 }), ox + x, oy + y, oz + 0.14));
    glyph(0.09, 0.62, -0.14, 0); glyph(0.26, 0.08, -0.02, 0.27); glyph(0.26, 0.08, -0.02, 0); glyph(0.3, 0.08, 0, -0.27);
    glyph(0.08, 0.22, 0.13, 0.14); glyph(0.08, 0.22, 0.16, -0.14); glyph(0.05, 0.16, -0.06, 0.38); glyph(0.05, 0.16, 0.05, 0.38); glyph(0.05, 0.16, -0.06, -0.38); glyph(0.05, 0.16, 0.05, -0.38);
    place(createNode({ geometry: M.merge(...parts) }));
    sign("SATOSHI NAKAMOTO", "author of the Bitcoin whitepaper, 31 October 2008 · the first block, 3 January 2009 · an original Ooga statue, not a likeness", S.x, top + 2.75, S.z + P.half + 0.08, Math.PI, "gold", 0.5);
  };
  const pickBox = (w, h, d) => ({ verts: [-w / 2, -h / 2, -d / 2, w / 2, -h / 2, -d / 2, w / 2, h / 2, -d / 2, -w / 2, h / 2, -d / 2, -w / 2, -h / 2, d / 2, w / 2, -h / 2, d / 2, w / 2, h / 2, d / 2, -w / 2, h / 2, d / 2], faces: [], lines: [], castShadow: false });
  BL.genesisAtrium = { layout, build, CLEAR, statueParts };
})();
