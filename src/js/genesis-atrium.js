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
  const R0 = 15, R1 = 7, H0 = 0.5, H1 = 1.7, START = -2.25, SWEEP = 5.0, MAP_R = 21, PLINTH = 1.3, DAIS = 3.2, STATUE_BASE = 5.2;
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
    const statue = { x: 0, z: -6.4, base: STATUE_BASE };
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
    // The Satoshi statue: an original Ooga monument after the real Satoshi statues, about 9.5 m tall with its
    // pedestal. From Lugano's: a hooded figure sitting cross-legged with a laptop on its lap, on a rust-brown steel
    // block, built of thin polished slices that dissolve into slats seen head-on and stand whole from the side. From
    // Budapest's: the face in the hood is a mirror (a reflector: visitors see themselves). One merged mesh plus the
    // mirror quad, no light and nothing per frame.
    if (L.statue) statueParts(M, L.statue, top, sign, place, createNode);
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
  const STEEL = "#b4bcc2", STEEL_DK = "#7d878e";
  // The seated figure in side profile, before scaling (STATUE_K): boxes { x0, x1, y0, y1, z0, z1 } in metres, y up
  // from the pedestal's top, +z the way it faces. Every slice across x takes the part of each box it cuts through.
  const STATUE_K = 1.25, SLICE = 0.18, PLATE = 0.09;
  const FIGURE = [
    { x0: -2.0, x1: 2.0, y0: 0, y1: 0.9, z0: -1.2, z1: 1.5 }, // the crossed legs
    { x0: -2.0, x1: -1.2, y0: 0.9, y1: 1.3, z0: -0.4, z1: 1.2 }, { x0: 1.2, x1: 2.0, y0: 0.9, y1: 1.3, z0: -0.4, z1: 1.2 }, // the knees
    { x0: -0.7, x1: 0.7, y0: 0, y1: 0.35, z0: 1.5, z1: 1.9 }, // a foot tucked in front
    { x0: -1.3, x1: 1.3, y0: 0.9, y1: 1.7, z0: -1.4, z1: 0.3 }, // the hips
    { x0: -1.2, x1: 1.2, y0: 1.7, y1: 3.4, z0: -1.2, z1: 0.45 }, // the body, leaning in
    { x0: -1.4, x1: 1.4, y0: 3.4, y1: 4.1, z0: -1.0, z1: 0.6 }, // the shoulders
    { x0: -1.65, x1: -1.2, y0: 2.6, y1: 4.0, z0: -0.5, z1: 0.4 }, { x0: 1.2, x1: 1.65, y0: 2.6, y1: 4.0, z0: -0.5, z1: 0.4 }, // the upper arms
    { x0: -1.4, x1: -0.8, y0: 2.1, y1: 2.65, z0: 0.0, z1: 1.55 }, { x0: 0.8, x1: 1.4, y0: 2.1, y1: 2.65, z0: 0.0, z1: 1.55 }, // the forearms to the keys
    { x0: -0.95, x1: -0.55, y0: 4.1, y1: 5.9, z0: -0.7, z1: 1.15 }, { x0: 0.55, x1: 0.95, y0: 4.1, y1: 5.9, z0: -0.7, z1: 1.15 }, // the hood's sides, deep
    { x0: -0.55, x1: 0.55, y0: 4.1, y1: 5.9, z0: -0.9, z1: 0.35 }, // the head inside, the face recessed
    { x0: -0.95, x1: 0.95, y0: 5.9, y1: 6.3, z0: -0.8, z1: 1.0 }, // the hood's crown
    { x0: -0.55, x1: 0.55, y0: 5.55, y1: 5.9, z0: 0.35, z1: 1.15 } // the hood's brow over the face
  ];
  const LAPTOP = [
    { x0: -1.05, x1: 1.05, y0: 1.7, y1: 1.85, z0: 0.6, z1: 1.9 }, // its base on the lap
    { x0: -1.05, x1: 1.05, y0: 1.85, y1: 3.3, z0: 1.85, z1: 2.0 } // its screen, toward the figure
  ];
  const statueParts = (M, S, top, sign, place, createNode) => {
    const parts = [], k = STATUE_K, P = 2.0, at = (g, x, y, z) => M.moved(g, S.x + x, top + y, S.z + z);
    const b = (w, h, d, color, x, y, z, emissive = 0) => parts.push(at(M.box({ w, h, d, color, emissive }), x, y, z));
    // The pedestal: a rust-brown weathering-steel block with a darker lip.
    b(S.base, P - 0.1, S.base, "#7a3b1c", 0, (P - 0.1) / 2, 0);
    b(S.base + 0.1, 0.1, S.base + 0.1, "#5e2c14", 0, P - 0.05, 0);
    // The slices: thin polished plates, front to back, a slice's width apart; each takes its cut through every box.
    const slices = Math.round(4.0 / SLICE);
    for (let i = 0; i <= slices; i++) {
      const x = -2.0 + i * SLICE, c = i % 2 ? STEEL : STEEL_DK;
      for (const list of [FIGURE, LAPTOP]) for (const p of list) {
        if (x < p.x0 || x > p.x1) continue;
        const h = (p.y1 - p.y0) * k, d = (p.z1 - p.z0) * k;
        b(PLATE * k, h, d, list === LAPTOP ? "#c9d0d4" : c, x * k, P + p.y0 * k + h / 2, (p.z0 + p.z1) / 2 * k - 0.3, 0.05);
      }
    }
    // The mirror face in the hood's opening, set in the recess and facing out.
    const fw = 1.0 * k, fh = 1.2 * k;
    const face = { verts: [-fw / 2, 0, 0, fw / 2, 0, 0, fw / 2, fh, 0, -fw / 2, fh, 0], faces: [{ i: [0, 1, 2, 3], color: [158, 168, 178], emissive: 0 }], lines: [], castShadow: false, reflector: true };
    place(createNode({ geometry: face, position: { x: S.x, y: top + P + 4.25 * k, z: S.z + 0.37 * k - 0.3 } }));
    place(createNode({ geometry: M.merge(...parts) }));
    sign("SATOSHI NAKAMOTO", "an original Ooga statue after the Satoshi statues in Lugano and Budapest · look into the face: we are all Satoshi", S.x, top + 1.0, S.z + S.base / 2 + 0.25, Math.PI, "gold", 0.5);
  };
  const pickBox = (w, h, d) => ({ verts: [-w / 2, -h / 2, -d / 2, w / 2, -h / 2, -d / 2, w / 2, h / 2, -d / 2, -w / 2, h / 2, -d / 2, -w / 2, -h / 2, d / 2, w / 2, -h / 2, d / 2, w / 2, h / 2, d / 2, -w / 2, h / 2, d / 2], faces: [], lines: [], castShadow: false });
  BL.genesisAtrium = { layout, build, CLEAR };
})();
