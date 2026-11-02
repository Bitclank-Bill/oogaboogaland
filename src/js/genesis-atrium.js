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
  // mesh and its footing: the plinth's three steps (each a step up), the robe (in the way up to the shoulders), the
  // shoulders and the head (surfaces to land on), and the whitepaper held out in front. `hx`, `hz` half extents, `dz`
  // an offset forward, `rise` the top above the floor; `stand` a surface, `block` an obstacle up to `rise`, `above`
  // standing on another part rather than the floor.
  const STATUE_K = 1.0, STATUE_PLINTH = 1.5;
  const FIGURE = { hem: [2.6, 2.0, 1.2], lower: [2.4, 1.8, 2.0], mid: [2.2, 1.6, 2.0], chest: [2.4, 1.5, 1.6], shoulders: [3.0, 1.6, 0.6], neck: [0.8, 0.8, 0.4], head: [1.3, 1.3, 1.4] };
  const statueParts = () => {
    const k = STATUE_K, P = STATUE_PLINTH, parts = [], ys = {};
    let y = 0;
    for (const key of ["hem", "lower", "mid", "chest", "shoulders", "neck", "head"]) { ys[key] = y; y += FIGURE[key][2]; }
    const top = (key) => P + (ys[key] + FIGURE[key][2]) * k, half = (key, i) => FIGURE[key][i] / 2 * k;
    [[2.4, 0.5], [2.05, 1.0], [1.7, P]].forEach(([h, rise], i) => parts.push({ id: `step-${i}`, hx: h, hz: h, dz: 0, rise, stand: true, block: true, above: i > 0 }));
    parts.push({ id: "robe", hx: half("hem", 0), hz: half("hem", 1), dz: 0, rise: top("shoulders"), stand: false, block: true, above: true });
    parts.push({ id: "shoulders", hx: half("shoulders", 0), hz: half("shoulders", 1), dz: 0, rise: top("shoulders"), stand: true, block: false, above: true });
    parts.push({ id: "head", hx: half("head", 0), hz: half("head", 1), dz: 0, rise: top("head"), stand: true, block: true, above: true });
    parts.push({ id: "paper", hx: 0.95 * k, hz: 0.35 * k, dz: (FIGURE.chest[1] / 2 + 0.45) * k, rise: P + (ys.chest + 0.9) * k, stand: false, block: true, above: true });
    return { parts, ys, k, P };
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
    // The Satoshi statue: an original Ooga figure, not a likeness and after no other sculpture. A tall robed figure,
    // chunky and cast in gold on black granite, faceless, holding the whitepaper open at its chest, on a stepped plinth
    // whose plaque is a plain text tribute. About 12 m. One merged mesh; no light and nothing per frame.
    if (L.monument) monumentParts(M, L.monument, top, sign, place, createNode);
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
  // Cast in gold on a black granite plinth: three golds for the robe's tiers and folds, a faint glow so the metal
  // catches the hall's light from every side.
  const STONE_A = "#e3b545", STONE_B = "#cf9f32", STONE_D = "#a77d1e", GLEAM = 0.18, GRANITE = "#2b2724", GRANITE_LT = "#3b3530";
  const monumentParts = (M, S, top, sign, place, createNode) => {
    const { ys, k, P } = statueParts(), parts = [], at = (g, x, y, z) => M.moved(g, S.x + x, top + y, S.z + z);
    const block = (w, h, d, color, x, y, z, bevel = 0.08, emissive = color === GRANITE || color === GRANITE_LT ? 0 : GLEAM) => parts.push(at(M.bevelBox({ w, h, d, color, bevel, emissive }), x, y, z));
    // The plinth: three dressed steps and a gold band.
    [[4.8, 0.5], [4.1, 1.0], [3.4, P]].forEach(([w, rise], i) => block(w, 0.5, w, i % 2 ? GRANITE_LT : GRANITE, 0, rise - 0.25, 0, 0.06));
    parts.push(at(M.box({ w: 3.44, h: 0.08, d: 3.44, color: GOLD, emissive: 0.5 }), 0, P - 0.12, 0));
    const F = FIGURE, Y = (key) => P + ys[key] * k, H = (key) => F[key][2] * k;
    // The robe, widening to its hem in tiers, with blocky folds down its front and a gold belt.
    for (const key of ["hem", "lower", "mid", "chest", "shoulders"]) block(F[key][0] * k, H(key), F[key][1] * k, key === "lower" || key === "chest" ? STONE_B : STONE_A, 0, Y(key) + H(key) / 2, 0, 0.1);
    for (const fx of [-0.7, -0.25, 0.25, 0.7]) block(0.16 * k, (F.hem[2] + F.lower[2]) * k * 0.92, 0.12 * k, STONE_D, fx * k, Y("hem") + (F.hem[2] + F.lower[2]) * k * 0.46, F.hem[1] / 2 * k + 0.02, 0.03);
    parts.push(at(M.box({ w: F.mid[0] * k + 0.06, h: 0.22 * k, d: F.mid[1] * k + 0.06, color: "#ffe08a", emissive: 0.6 }), 0, Y("mid") + H("mid") * 0.85, 0));
    // Arms: sleeves down the sides, forearms forward to the hands holding the whitepaper open at the chest.
    for (const sx of [-1, 1]) {
      block(0.62 * k, 2.2 * k, 0.8 * k, STONE_A, sx * 1.42 * k, Y("chest") + H("chest") - 0.9 * k, 0.05 * k, 0.1);
      block(0.55 * k, 0.55 * k, 1.1 * k, STONE_B, sx * 1.05 * k, Y("chest") + 0.35 * k, (F.chest[1] / 2 + 0.2) * k, 0.08);
      block(0.42 * k, 0.5 * k, 0.4 * k, STONE_D, sx * 0.86 * k, Y("chest") + 0.55 * k, (F.chest[1] / 2 + 0.55) * k, 0.06);
    }
    // The whitepaper: two pages tipped back, ruled with lines of text, a gold title bar.
    const py = Y("chest") + 0.55 * k, pz = (F.chest[1] / 2 + 0.62) * k;
    for (const sx of [-1, 1]) {
      const page = [M.box({ w: 0.86 * k, h: 1.15 * k, d: 0.06, color: "#f4efe2", emissive: 0.12 })];
      for (let r = 0; r < 9; r++) page.push(M.moved(M.box({ w: (r % 3 === 2 ? 0.45 : 0.68) * k, h: 0.035 * k, d: 0.02, color: "#5d564c" }), -0.04 * k, (0.28 - r * 0.085) * k, 0.04));
      if (sx < 0) page.push(M.moved(M.box({ w: 0.7 * k, h: 0.09 * k, d: 0.02, color: GOLD, emissive: 0.3 }), 0, 0.45 * k, 0.04));
      parts.push(at(M.turnedY(M.turnedX(M.merge(...page), -0.35), -sx * 0.18), sx * 0.45 * k, py + 0.5 * k, pz));
    }
    // The neck and the head: faceless dressed stone under a squared crown.
    block(F.neck[0] * k, H("neck"), F.neck[1] * k, STONE_B, 0, Y("neck") + H("neck") / 2, 0, 0.05);
    block(F.head[0] * k, H("head") * 0.86, F.head[1] * k, STONE_A, 0, Y("head") + H("head") * 0.43, 0, 0.18);
    block(F.head[0] * k * 0.9, H("head") * 0.14, F.head[1] * k * 0.9, STONE_B, 0, Y("head") + H("head") * 0.93, 0, 0.06);
    place(createNode({ geometry: M.merge(...parts) }));
    sign("SATOSHI NAKAMOTO", "author of the Bitcoin whitepaper, 31 October 2008 · the first block, 3 January 2009 · an original Ooga statue, not a likeness", S.x, top + 1.25, S.z + 2.05 + 0.25, Math.PI, "gold", 0.5);
  };
  const pickBox = (w, h, d) => ({ verts: [-w / 2, -h / 2, -d / 2, w / 2, -h / 2, -d / 2, w / 2, h / 2, -d / 2, -w / 2, h / 2, -d / 2, -w / 2, -h / 2, d / 2, w / 2, -h / 2, d / 2, w / 2, h / 2, d / 2, -w / 2, h / 2, d / 2], faces: [], lines: [], castShadow: false });
  BL.genesisAtrium = { layout, build, CLEAR, statueParts };
})();
