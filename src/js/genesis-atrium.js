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
  const R0 = 15, R1 = 7, H0 = 0.5, H1 = 1.7, START = -2.25, SWEEP = 5.0, MAP_R = 21, PLINTH = 1.3, DAIS = 3.2, STATUE_BASE = 5.6;
  // The view from the arrival to the white timeline screen (scene-genesis.js ENTRY and LEGEND) stays clear.
  const CLEAR = { x0: -13, x1: 13, z0: 47, z1: 66 };
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
    // The Satoshi statue behind the dais, facing the paper's way (+z) over it, inside the spiral's innermost turn.
    const statue = { x: 0, z: -6.2, base: STATUE_BASE };
    obstacles.push({ x0: statue.x - STATUE_BASE / 2 - 0.1, x1: statue.x + STATUE_BASE / 2 + 0.1, z0: statue.z - STATUE_BASE / 2 - 0.1, z1: statue.z + STATUE_BASE / 2 + 0.1 });
    // The floor map: one marker per era, on the ring, pointing at the middle of its gallery's opening.
    const markers = eras.map((e) => {
      const r = museum.rects[e.n], A = museum.atrium;
      const ox = Math.max(A.x0, Math.min(A.x1, (r.x0 + r.x1) / 2)), oz = Math.max(A.z0, Math.min(A.z1, (r.z0 + r.z1) / 2));
      const a = Math.atan2(ox, -oz), p = bearingPoint(MAP_R, a, { x: 0, z: 0 });
      return { era: e.n, name: e.name, years: e.years, x: p.x, z: p.z, toward: { x: ox, z: oz }, a, ry: a + Math.PI };
    });
    return { steps, paper: paperStop, genesis, statue, markers, path, obstacles, clear: CLEAR, radius: { inner: R1, outer: R0, map: MAP_R } };
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
    // The Satoshi statue: an original monument after the real Satoshi statues, about 8.5 m tall with its pedestal.
    // From Lugano's: a hooded figure sitting cross-legged over a laptop, on a rust-brown steel block, built of thin
    // slats front to back, each following the body's outline where it cuts, so from the side it is one smooth
    // contoured figure and head-on it dissolves into lines; here the slats are polished gold. From Budapest's: the
    // gold mirror face in the hood (a reflector: visitors see themselves). One merged mesh plus the mirror quad, built
    // once a visit; no light and nothing per frame.
    const statuePlates = L.statue ? statueParts(M, L.statue, top, sign, place, createNode) : 0;
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
    return { picks, update, statuePlates, light: [0, top + 6, 0, 16, 1.3, 1.1, 0.75] };
  };
  // The seated figure as smooth solids in its own frame (metres before STATUE_K; y up from the pedestal's top, +z the
  // way it faces): ellipsoids [cx, cy, cz, rx, ry, rz] and capsules [ax, ay, az, bx, by, bz, r], less the face's
  // hollow in the hood. The laptop is apart, in steel. `statueInside(x, y, z)` is 1 inside the figure, 2 inside the
  // laptop, 0 outside; the slats are its sections, scanned once a visit.
  const STATUE_K = 1.2, SLAT_STEP = 0.12, SLAT = 0.06, ROW = 0.07, DEPTH = 0.04;
  const ELLIPSOIDS = [
    [0, 0.95, -0.4, 1.2, 0.6, 0.95], // the seat and hips
    [0, 2.1, -0.5, 1.08, 1.05, 0.7], // the small of the back
    [0, 3.15, -0.2, 1.38, 0.5, 0.78], // the shoulders, rounded forward
    [0, 2.95, -0.62, 0.95, 0.75, 0.55], // the hunched upper back
    [0, 4.0, 0.42, 0.68, 0.78, 0.8], // the hood, bowed over the laptop
    [0, 3.7, -0.15, 0.8, 0.6, 0.62], // the hood's drape down the back
    [0, 4.62, 0.2, 0.44, 0.3, 0.55], // the hood's peak
    [-0.46, 1.72, 1.22, 0.24, 0.1, 0.3], [0.46, 1.72, 1.22, 0.24, 0.1, 0.3], // the hands on the keys
    [-0.55, 0.26, 1.5, 0.22, 0.2, 0.42] // a foot tucked out in front
  ];
  const CAPSULES = [
    [0, 1.2, -0.45, 0, 2.9, -0.15, 0.95], // the body, leaning in
    [0, 3.15, 0.0, 0, 3.75, 0.3, 0.42], // the neck inside the hood
    [-1.22, 3.1, -0.1, -1.15, 2.1, 0.45, 0.32], [1.22, 3.1, -0.1, 1.15, 2.1, 0.45, 0.32], // the upper arms
    [-1.15, 2.1, 0.45, -0.5, 1.75, 1.15, 0.26], [1.15, 2.1, 0.45, 0.5, 1.75, 1.15, 0.26], // the forearms down to the keys
    [-0.55, 0.62, -0.2, -1.78, 0.62, 0.72, 0.43], [0.55, 0.62, -0.2, 1.78, 0.62, 0.72, 0.43], // the thighs out to the knees
    [-1.78, 0.48, 0.72, 0.4, 0.33, 1.28, 0.34], [1.78, 0.52, 0.72, -0.4, 0.4, 1.12, 0.33] // the shins crossing in front
  ];
  const FACE_HOLLOW = [0, 3.92, 1.15, 0.42, 0.55, 0.42];
  const inEllipsoid = (e, x, y, z) => { const a = (x - e[0]) / e[3], b = (y - e[1]) / e[4], c = (z - e[2]) / e[5]; return a * a + b * b + c * c <= 1; };
  const inCapsule = (c, x, y, z) => {
    const dx = c[3] - c[0], dy = c[4] - c[1], dz = c[5] - c[2], px = x - c[0], py = y - c[1], pz = z - c[2];
    const t = Math.max(0, Math.min(1, (px * dx + py * dy + pz * dz) / (dx * dx + dy * dy + dz * dz)));
    const qx = px - dx * t, qy = py - dy * t, qz = pz - dz * t;
    return qx * qx + qy * qy + qz * qz <= c[6] * c[6];
  };
  // Each solid's box, for culling: [x0, x1, y0, y1].
  const boundsOf = (list, cap) => list.map((p) => cap
    ? [Math.min(p[0], p[3]) - p[6], Math.max(p[0], p[3]) + p[6], Math.min(p[1], p[4]) - p[6], Math.max(p[1], p[4]) + p[6]]
    : [p[0] - p[3], p[0] + p[3], p[1] - p[4], p[1] + p[4]]);
  const E_BOX = boundsOf(ELLIPSOIDS, false), C_BOX = boundsOf(CAPSULES, true);
  const inside = (es, cs, x, y, z) => {
    if (Math.abs(x) <= 0.95) {
      if (y >= 1.5 && y <= 1.62 && z >= 0.55 && z <= 1.9) return 2;
      if (y > 1.6 && y <= 3.0) { const zs = 1.9 + (y - 1.6) * 0.18; if (z >= zs - 0.1 && z <= zs) return 2; }
    }
    if (inEllipsoid(FACE_HOLLOW, x, y, z)) return 0;
    for (const e of es) if (inEllipsoid(e, x, y, z)) return 1;
    for (const c of cs) if (inCapsule(c, x, y, z)) return 1;
    return 0;
  };
  // The slat plates, in the figure's own units: { x, y0, y1, z0, z1, kind, i }. For each plane across x the section is
  // scanned in rows, each row's runs along z a plate, a run repeating the row below extending that plate. Pure and
  // computed once a page (the shape never changes), against only the solids each plane and row can meet.
  let PLATES = null;
  const statuePlates = () => {
    if (PLATES) return PLATES;
    PLATES = [];
    const open = [], es = [], cs = [];
    const emit = (o) => PLATES.push(o);
    for (let i = 0, n = Math.round(4.6 / SLAT_STEP); i <= n; i++) {
      const x = -2.3 + i * SLAT_STEP;
      const ex = ELLIPSOIDS.filter((_, j) => x >= E_BOX[j][0] && x <= E_BOX[j][1]), exb = E_BOX.filter((bx) => x >= bx[0] && x <= bx[1]);
      const cx = CAPSULES.filter((_, j) => x >= C_BOX[j][0] && x <= C_BOX[j][1]), cxb = C_BOX.filter((bx) => x >= bx[0] && x <= bx[1]);
      open.length = 0;
      for (let y = ROW / 2; y < 5.6; y += ROW) {
        es.length = cs.length = 0;
        for (let j = 0; j < ex.length; j++) if (y >= exb[j][2] && y <= exb[j][3]) es.push(ex[j]);
        for (let j = 0; j < cx.length; j++) if (y >= cxb[j][2] && y <= cxb[j][3]) cs.push(cx[j]);
        const runs = [];
        if (es.length || cs.length || Math.abs(x) <= 0.95) {
          let start = 0, kind = 0;
          for (let z = -1.6; z <= 2.3; z += DEPTH) {
            const v = inside(es, cs, x, y, z);
            if (v !== kind) { if (kind) runs.push([start, z, kind]); start = z; kind = v; }
          }
          if (kind) runs.push([start, 2.3, kind]);
        }
        for (let j = open.length - 1; j >= 0; j--) {
          const o = open[j], same = runs.findIndex((r) => r[2] === o.kind && Math.abs(r[0] - o.z0) < 1e-6 && Math.abs(r[1] - o.z1) < 1e-6);
          if (same >= 0) { o.y1 = y + ROW / 2; runs.splice(same, 1); } else { emit(o); open.splice(j, 1); }
        }
        for (const r of runs) open.push({ x, i, z0: r[0], z1: r[1], kind: r[2], y0: y - ROW / 2, y1: y + ROW / 2 });
      }
      for (const o of open) emit(o);
    }
    return PLATES;
  };
  const statueParts = (M, S, top, sign, place, createNode) => {
    const parts = [], k = STATUE_K, P = 2.0, at = (g, x, y, z) => M.moved(g, S.x + x, top + y, S.z + z);
    const b = (w, h, d, color, x, y, z, emissive = 0) => parts.push(at(M.box({ w, h, d, color, emissive }), x, y, z));
    // The pedestal: a rust-brown weathering-steel block, its lip darker.
    b(S.base, P - 0.1, S.base, "#7a3b1c", 0, (P - 0.1) / 2, 0);
    b(S.base + 0.1, 0.1, S.base + 0.1, "#5e2c14", 0, P - 0.05, 0);
    // The slats: thin polished plates, two golds in turn, the laptop's in steel.
    const GOLDS = ["#e3b341", "#c8952a"];
    for (const o of statuePlates()) {
      const steel = o.kind === 2, h = (o.y1 - o.y0) * k, d = (o.z1 - o.z0) * k;
      b(SLAT * k, h, d, steel ? "#c4cbd0" : GOLDS[o.i % 2], o.x * k, P + o.y0 * k + h / 2, (o.z0 + o.z1) / 2 * k - 0.35, steel ? 0.05 : 0.18);
    }
    // The mirror face in the hood's hollow, gold-tinted, facing out.
    const fw = 0.78 * k, fh = 1.0 * k;
    const face = { verts: [-fw / 2, 0, 0, fw / 2, 0, 0, fw / 2, fh, 0, -fw / 2, fh, 0], faces: [{ i: [0, 1, 2, 3], color: [222, 186, 96], emissive: 0 }], lines: [], castShadow: false, reflector: true };
    place(createNode({ geometry: face, position: { x: S.x, y: top + P + 3.88 * k, z: S.z + 0.62 * k - 0.35 } }));
    place(createNode({ geometry: M.merge(...parts) }));
    sign("SATOSHI NAKAMOTO", "an original Ooga statue after the Satoshi statues in Lugano and Budapest · look into the face: we are all Satoshi", S.x, top + 1.0, S.z + S.base / 2 + 0.25, Math.PI, "gold", 0.5);
    return parts.length;
  };
  const pickBox = (w, h, d) => ({ verts: [-w / 2, -h / 2, -d / 2, w / 2, -h / 2, -d / 2, w / 2, h / 2, -d / 2, -w / 2, h / 2, -d / 2, -w / 2, -h / 2, d / 2, w / 2, -h / 2, d / 2, w / 2, h / 2, d / 2, -w / 2, h / 2, d / 2], faces: [], lines: [], castShadow: false });
  BL.genesisAtrium = { layout, build, CLEAR, statuePlates };
})();
