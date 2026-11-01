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
  const R0 = 15, R1 = 7, H0 = 0.5, H1 = 1.7, START = -2.25, SWEEP = 5.0, MAP_R = 21, PLINTH = 1.3, DAIS = 3.2, CAIRN_BASE = 3.2;
  // The view from the arrival to the white timeline screen (scene-genesis.js ENTRY and LEGEND) stays clear.
  const CLEAR = { x0: -13, x1: 13, z0: 47, z1: 66 };
  // The cairn's tiers, bottom to top, shared by its mesh and its footing: the plinth, eight stones (each narrower, a
  // little off centre and turned) and the gold block. `half` is the square a body can stand on inside each (inscribed
  // in the turned stone), `rise` the height of its top above the floor.
  const CAIRN_STONES = 8, CAIRN_H = 0.55, CAIRN_PLINTH = 0.75, GOLD_BLOCK = 0.7;
  const cairnTiers = (base) => {
    const tiers = [{ kind: "plinth", w: base, d: base, h: CAIRN_PLINTH, dx: 0, turn: 0, half: base / 2, rise: CAIRN_PLINTH }];
    let y = CAIRN_PLINTH;
    for (let i = 0; i < CAIRN_STONES; i++) {
      const w = 2.3 - i * 0.16, d = w * 0.82, h = CAIRN_H - i * 0.012, turn = (i % 2 ? 1 : -1) * (0.12 + 0.04 * i), dx = (i % 3 - 1) * 0.06;
      tiers.push({ kind: "stone", era: i, w, d, h, dx, turn, y, half: Math.min(w, d) / 2 * 0.9, rise: y + h });
      y += h;
    }
    tiers.push({ kind: "gold", w: GOLD_BLOCK, d: GOLD_BLOCK, h: GOLD_BLOCK, dx: 0, turn: 0.4, y, half: GOLD_BLOCK / 2 * 0.9, rise: y + GOLD_BLOCK });
    return tiers;
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
    // The cairn behind the dais, its plaque facing the paper's way (+z), inside the spiral's innermost turn.
    // Each tier is a surface to stand on and an obstacle up to its top: from the floor the plinth is a jump, the stones
    // above it are steps, and the gold block on top (the head, `cairn.head`) is a jump again. Landing from above works
    // anywhere, since an obstacle with a top no longer stops feet that are within a step of it.
    const cairn = { x: 0, z: -5.4, base: CAIRN_BASE, tiers: cairnTiers(CAIRN_BASE) }, areas = [];
    for (const t of cairn.tiers) {
      const x = cairn.x + t.dx, box = { x0: x - t.half, x1: x + t.half, z0: cairn.z - t.half, z1: cairn.z + t.half };
      areas.push({ id: `cairn-${t.kind}${t.era === undefined ? "" : t.era}`, ...box, rise: t.rise });
      // `above`: a tier standing on the one below, not on the floor.
      obstacles.push({ ...(t.kind === "plinth" ? { x0: box.x0 - 0.1, x1: box.x1 + 0.1, z0: box.z0 - 0.1, z1: box.z1 + 0.1 } : box), rise: t.rise, above: t.kind !== "plinth" });
    }
    const top = cairn.tiers[cairn.tiers.length - 1];
    cairn.head = { x0: cairn.x - top.half, x1: cairn.x + top.half, z0: cairn.z - top.half, z1: cairn.z + top.half, rise: top.rise };
    // The floor map: one marker per era, on the ring, pointing at the middle of its gallery's opening.
    const markers = eras.map((e) => {
      const r = museum.rects[e.n], A = museum.atrium;
      const ox = Math.max(A.x0, Math.min(A.x1, (r.x0 + r.x1) / 2)), oz = Math.max(A.z0, Math.min(A.z1, (r.z0 + r.z1) / 2));
      const a = Math.atan2(ox, -oz), p = bearingPoint(MAP_R, a, { x: 0, z: 0 });
      return { era: e.n, name: e.name, years: e.years, x: p.x, z: p.z, toward: { x: ox, z: oz }, a, ry: a + Math.PI };
    });
    return { steps, paper: paperStop, genesis, cairn, areas, markers, path, obstacles, clear: CLEAR, radius: { inner: R1, outer: R0, map: MAP_R } };
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
    // The cairn: the museum's tribute, an Ooga stone pile. Eight rough stones stacked and each turned a little, one for
    // each gallery from the bottom up and banded in its era's colour, with a gold block on top for the first block, on
    // a stone plinth whose plaque is a plain text tribute. One merged mesh; no light and nothing per frame.
    if (L.cairn) cairnParts(M, L.cairn, top, sign, place, createNode, eraColor);
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
  const cairnParts = (M, S, top, sign, place, createNode, eraColor) => {
    const parts = [], at = (g, x, y, z) => M.moved(g, S.x + x, top + y, S.z + z);
    for (const t of S.tiers) {
      if (t.kind === "plinth") {
        // The plinth: dressed stone with a cap.
        parts.push(at(M.bevelBox({ w: t.w, h: t.h - 0.15, d: t.d, color: "#5a554c", bevel: 0.08 }), 0, (t.h - 0.15) / 2, 0));
        parts.push(at(M.box({ w: t.w + 0.2, h: 0.15, d: t.d + 0.2, color: "#7a746a" }), 0, t.h - 0.075, 0));
      } else if (t.kind === "stone") {
        // A rough stone with its era's band round its middle.
        const stone = M.bevelBox({ w: t.w, h: t.h, d: t.d, color: t.era % 2 ? "#8a8378" : "#757066", bevel: 0.12 });
        const band = M.box({ w: t.w + 0.04, h: 0.09, d: t.d + 0.04, color: eraColor(t.era), emissive: 0.15 });
        parts.push(at(M.turnedY(stone, t.turn), t.dx, t.y + t.h / 2, 0), at(M.turnedY(band, t.turn), t.dx, t.y + t.h / 2, 0));
      } else {
        // The gold block: the first block, on top.
        parts.push(at(M.turnedY(M.bevelBox({ w: t.w, h: t.h, d: t.d, color: GOLD, emissive: 0.35, bevel: 0.06 }), t.turn), 0, t.y + t.h / 2, 0));
      }
    }
    place(createNode({ geometry: M.merge(...parts) }));
    sign("SATOSHI NAKAMOTO", "author of the Bitcoin whitepaper, 31 October 2008 · the first block, 3 January 2009 · a stone for each gallery, the gold block for the first", S.x, top + S.tiers[0].h + 0.1, S.z + S.base / 2 + 0.3, Math.PI, "gold", 0.45);
  };
  const pickBox = (w, h, d) => ({ verts: [-w / 2, -h / 2, -d / 2, w / 2, -h / 2, -d / 2, w / 2, h / 2, -d / 2, -w / 2, h / 2, -d / 2, -w / 2, -h / 2, d / 2, w / 2, -h / 2, d / 2, w / 2, h / 2, d / 2, -w / 2, h / 2, d / 2], faces: [], lines: [], castShadow: false });
  BL.genesisAtrium = { layout, build, CLEAR, cairnTiers };
})();
