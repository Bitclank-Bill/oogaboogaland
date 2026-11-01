// The Genesis museum (work in progress, `?wip=genesis`): one cave of the ideas that came before Bitcoin.
// The visitor arrives on foot in an open atrium (the whitepaper stone's portal lands here), facing the huge white
// timeline screen. Round the atrium, clockwise in date order from the south-west, the eight eras each have a gallery
// in their own rock, floor and lamp colours, its sign over its arch (genesis-world.js MUSEUM). Each era's file builds
// its exhibits in its old cave's coordinates, inside its gallery's frame node, so the researched layouts, models and
// demonstrations stand as they were built. Era 3's gallery holds Fingerprints and Time, where Tock the archivist Ooga
// runs a stamp desk: pages are fingerprinted, each stamp links to the last, the newest is published, and a changed
// page breaks every link after it. The rules, words and sources are in genesis-voyage.js.
//
// Walking is the pilot and crew, as the arcade and factory scenes do. Space by an exhibit, or a tap on it, opens its
// workbench (genesis-workbench.js) on the host (OVERHAUL-CONTRACT.md); the white screen, the Timeline button or G opens
// the timeline menu (genesis-timeline.js). Both read the catalogue (genesis-catalogue.js). P pauses, the Calm button
// holds decorative motion, M mutes.
(() => {
  "use strict";
  const BL = window.BL = window.BL || {};
  const G = BL.genesisVoyage, M = BL.models, GP = BL.genesisProps, GW = BL.genesisWorld;
  const { createNode, addChild, removeChild, createCamera } = BL.scene;
  const { clamp } = BL.math;
  const COARSE = window.matchMedia("(pointer: coarse)").matches;
  const PREFERS_CALM = window.matchMedia("(prefers-reduced-motion: reduce)");

  // Fingerprints and Time was laid out in the old cavern's coordinates; SZ moves it (and its ledges, props and
  // lights) onto Era 3's cave, along its left bank.
  const SX = GW.ROOM_SHIFT.x, SZ = GW.ROOM_SHIFT.z, ROOM_ERA = GW.ROOM_ERA;
  const DESK = { x: -7.2 + SX, y: 0.55, z: -25.2 + SZ }, CHAIN = { x: -10.55 + SX, y: 3.7, z0: -21.6 + SZ, step: 1.75 }, PAPER = { x: -10.5 + SX, y: 2.2, z: -31.6 + SZ };
  const ISLAND_TOP = GW.BANK_TOP;
  const TILE_COLORS = (codes) => codes.map((c) => "#" + c.slice(0, 6));

  // Underground: a dim cave light, lamps doing the work; the shadow box follows the visitor.
  const renderOpts = { clear: [0.04, 0.05, 0.06], sky: [0.34, 0.37, 0.42], ground: [0.16, 0.15, 0.13],
    direct: [0.72, 0.7, 0.66], directStrength: 0.3, ambientFloor: 0.52, sun: { x: 0.25, y: 1, z: 0.35 },
    shadowCenter: { x: 0, y: 0, z: 0 }, shadowExtent: 34, bloomStrength: 0.35,
    lights: new Float32Array(BL.glRenderer.POINT_LIGHT_CAPACITY * 8), lightCount: 0 };
  // The museum (genesis-world.js MUSEUM): an atrium in the middle and the eras' galleries round it. Each era is built
  // in its old cave's coordinates inside its gallery's frame node; `mu(n, x, z)` is a point of era n's old world in the
  // museum, `muBox` a box.
  const MU = GW.MUSEUM, ROOF = MU.HEIGHT;
  const DESK_AT = MU.toMuseum(ROOM_ERA, DESK.x, DESK.z, { x: 0, z: 0 });
  const mu = (n, x, z, out = { x: 0, z: 0 }) => MU.toMuseum(n, x, z, out);
  const muBox = (n, b) => ({ ...b, ...MU.boxToMuseum(n, b) });
  const muAt = (n, at) => { const p = mu(n, at.x, at.z); return { ...at, x: p.x, z: p.z }; };
  // Lamps: the atrium's, the desk's and the newspaper's in Fingerprints and Time, then three in each gallery in its
  // era's colour. Each frame the nearest come first (the tiers keep the first ones).
  const CAVE_LAMPS = [[-14, 0.3], [22, 0.5], [-8, 0.78]];
  const LIGHTS = [[0, 9, 40, 30, 1.2, 1.05, 0.85], [0, 9, -40, 30, 1.2, 1.05, 0.85], [-30, 9, 0, 30, 1.1, 1, 0.85], [30, 9, 0, 30, 1.1, 1, 0.85], [0, 7, 66, 16, 1.25, 0.95, 0.6],
    ...[[-6.5 + SX, 3.4, -25 + SZ, 12, 1.35, 1.05, 0.7], [-9 + SX, 3.2, -31.5 + SZ, 7, 1, 0.9, 0.7]].map((l) => { const q = mu(ROOM_ERA, l[0], l[2]); return [q.x, l[1], q.z, ...l.slice(3)]; }),
    ...GW.ERAS.flatMap((e) => CAVE_LAMPS.map(([x, f]) => { const q = mu(e.n, x, e.z1 - f * GW.CAVE.len); return [q.x, 9, q.z, 34, ...e.theme.lamp]; }))];

  // --- Walking: where an Ooga may stand ----------------------------------------------------------------------------
  // One floor at bank height: the atrium and every gallery, walled round. Fingerprints and Time's ledge (Era 3), its
  // desk and the newspaper stand in the way, and so do the statue and the walls.
  const { CHANNEL } = GW;
  // Where the visitor arrives: in the atrium's south, by the statue, facing north across it (a fall comes back here).
  const ENTRY = { x: 0, z: 64, facing: Math.PI };
  // The walls (one height, ROOF): each gallery's back and sides (half a partition each, so neighbours meet without
  // overlapping), and the atrium's sides between the galleries' openings.
  const WALLS = (() => {
    const out = [], T = MU.PART / 2;
    for (const r of MU.rects) {
      const b = MU.bays[r.n], out1 = MU.rotate(b.rot, 0, -1, { x: 0, z: 0 });
      // The gallery's back is the side its old -z points to; its sides the two across it.
      if (out1.x < 0) out.push({ x0: r.x0 - 1, x1: r.x0, z0: r.z0 - T, z1: r.z1 + T }, { x0: r.x0 - 1, x1: r.x1, z0: r.z0 - T, z1: r.z0 }, { x0: r.x0 - 1, x1: r.x1, z0: r.z1, z1: r.z1 + T });
      if (out1.x > 0) out.push({ x0: r.x1, x1: r.x1 + 1, z0: r.z0 - T, z1: r.z1 + T }, { x0: r.x0, x1: r.x1 + 1, z0: r.z0 - T, z1: r.z0 }, { x0: r.x0, x1: r.x1 + 1, z0: r.z1, z1: r.z1 + T });
      if (out1.z < 0) out.push({ x0: r.x0 - T, x1: r.x1 + T, z0: r.z0 - 1, z1: r.z0 }, { x0: r.x0 - T, x1: r.x0, z0: r.z0 - 1, z1: r.z1 }, { x0: r.x1, x1: r.x1 + T, z0: r.z0 - 1, z1: r.z1 });
      if (out1.z > 0) out.push({ x0: r.x0 - T, x1: r.x1 + T, z0: r.z1, z1: r.z1 + 1 }, { x0: r.x0 - T, x1: r.x0, z0: r.z0, z1: r.z1 + 1 }, { x0: r.x1, x1: r.x1 + T, z0: r.z0, z1: r.z1 + 1 });
    }
    // The atrium's four sides, less the openings.
    const A = MU.atrium;
    const side = (fixed, lo, hi, axis, outward) => {
      const opens = MU.rects.filter((r) => axis === "z" ? (outward < 0 ? r.x1 <= A.x0 + 0.01 : r.x0 >= A.x1 - 0.01) : (outward < 0 ? r.z1 <= A.z0 + 0.01 : r.z0 >= A.z1 - 0.01))
        .map((r) => axis === "z" ? [r.z0, r.z1] : [r.x0, r.x1]).sort((a, b) => a[0] - b[0]);
      let at = lo - 1;
      for (const [a, b] of [...opens, [hi + 1, hi + 1]]) {
        if (a > at) out.push(axis === "z" ? { x0: outward < 0 ? fixed - 1 : fixed, x1: outward < 0 ? fixed : fixed + 1, z0: at, z1: a } : { x0: at, x1: a, z0: outward < 0 ? fixed - 1 : fixed, z1: outward < 0 ? fixed : fixed + 1 });
        at = Math.max(at, b);
      }
    };
    side(A.x0, A.z0, A.z1, "z", -1); side(A.x1, A.z0, A.z1, "z", 1); side(A.z0, A.x0, A.x1, "x", -1); side(A.z1, A.x0, A.x1, "x", 1);
    return out;
  })();
  const FOOTING = {
    areas: [
      { id: "room", x0: -12, x1: -7.6, z0: -34, z1: -19, top: 0.545, dock: { x: -6, z: -26.6, facing: Math.PI / 2 } },
      { id: "step", x0: -7.6, x1: -5, z0: -27.7, z1: -22.7, top: 0.545, dock: { x: -6, z: -26.6, facing: Math.PI / 2 } }
    ],
    obstacles: [{ x0: -8.5, x1: -5.9, z0: -25.9, z1: -24.5 }, { x0: -10.6, x1: -10.4, z0: -33.1, z1: -30.1 },
      { x0: -10.2, x1: -9, z0: -21.2, z1: -20 }, { x0: -10.3, x1: -9.3, z0: -32.9, z1: -31.9 }, { x0: -6.2, x1: -5.4, z0: -24, z1: -23.2 }]
  };
  // The room's ledges and obstacles move with it into Era 3's gallery.
  for (const a of FOOTING.areas) { a.x0 += SX; a.x1 += SX; a.z0 += SZ; a.z1 += SZ; Object.assign(a, MU.boxToMuseum(ROOM_ERA, a)); a.dock = { ...muAt(ROOM_ERA, { x: a.dock.x + SX, z: a.dock.z + SZ }), facing: a.dock.facing + MU.bays[ROOM_ERA].rot }; }
  for (const o of FOOTING.obstacles) { o.x0 += SX; o.x1 += SX; o.z0 += SZ; o.z1 += SZ; Object.assign(o, MU.boxToMuseum(ROOM_ERA, o)); }
  {
    const dock = { x: ENTRY.x, z: ENTRY.z, facing: ENTRY.facing };
    FOOTING.areas.push({ id: "atrium", ...MU.atrium, top: ISLAND_TOP, dock }, ...MU.rects.map((r) => ({ id: `gallery-${r.n}`, x0: r.x0, x1: r.x1, z0: r.z0, z1: r.z1, top: ISLAND_TOP, dock })));
    // The statue in the atrium, and the walls.
    FOOTING.obstacles.push({ x0: -1.4, x1: 1.4, z0: 69.5, z1: 70.5 }, ...WALLS);
  }
  // The first props, on the room's ledge (in Era 3's old world): the office PC, the hard-drive plinth and Tock's book.
  const PROPS = { pc: { x: -9.6 + SX, y: 0.545, z: -20.6 + SZ }, drives: { x: -9.8 + SX, y: 0.545, z: -32.4 + SZ }, book: { x: -5.8 + SX, y: 0.545, z: -23.6 + SZ } };
  const WALK_PRESETS = { dock: { yaw: 0, pitch: 0.3, dist: 6, target: { x: ENTRY.x, y: 1, z: ENTRY.z } } };

  let root = null, camera = null, input = null, hud = null, game = null, world = null, go = null, overlayCanvas = null;
  let demo = null, built = null, board = null, audio = null;
  const targets = [];
  // `paused` is the visitor's own pause (P); `reading` a panel open; Calm holds decorative motion.
  const view = { calm: false, captions: true, voice: false, readingPaused: false, reading: false, paused: false };
  let lastEra = -2;
  let sceneTime = 0, captionKey = "", lastStamps = 0, lastPhase = "", lastTiles = -1, lastBroken = false;
  const el = {};

  // --- Building -------------------------------------------------------------------------------------------------
  // Nodes built for an era go under its gallery's frame node (`inFrame`), in that era's old coordinates.
  let frameParent = null;
  const place = (node) => { addChild(frameParent || root, node); return node; };
  const inFrame = (n, fn) => { const was = frameParent; frameParent = n >= 0 ? built.frames[n] : null; try { return fn(); } finally { frameParent = was; } };
  // A tap box: a node the picker sees (it skips hidden nodes) with a box's corners and no faces, so nothing draws.
  const pickBox = (w, h, d) => ({ verts: [-w / 2, -h / 2, -d / 2, w / 2, -h / 2, -d / 2, w / 2, h / 2, -d / 2, -w / 2, h / 2, -d / 2, -w / 2, -h / 2, d / 2, w / 2, -h / 2, d / 2, w / 2, h / 2, d / 2, -w / 2, h / 2, d / 2], faces: [], lines: [], castShadow: false });
  const solid = (w, h, d, color, x, y, z, emissive = 0) => place(createNode({ geometry: M.box({ w, h, d, color, emissive }), position: { x, y, z } }));
  const buildCavern = () => {
    // The statue the visitor came through, in the atrium's south, with lanterns either side.
    const statue = place(createNode({ position: { x: 0, y: ISLAND_TOP, z: 70 }, rotation: { x: 0, y: Math.PI, z: 0 } }));
    addChild(statue, createNode({ geometry: M.bevelBox({ w: 2.2, h: 3.1, d: 0.4, color: "#ece6d6" }), position: { x: 0, y: 1.9, z: 0 } }));
    addChild(statue, createNode({ geometry: M.box({ w: 1.5, h: 2.3, d: 0.06, color: "#9ad8ff", emissive: 0.9 }), position: { x: 0, y: 1.75, z: -0.23 } }));
    addChild(statue, createNode({ geometry: M.box({ w: 2.8, h: 0.35, d: 0.9, color: "#8a8174" }), position: { x: 0, y: 0.17, z: 0 } }));
    built.portal = statue.children[1];
    for (const [x, z] of [[-3, 70.5], [3, 70.5], [-6, 72], [6, 72]]) {
      solid(0.14, 2.4, 0.14, "#3b2a1a", x, ISLAND_TOP + 1.2, z);
      solid(0.36, 0.36, 0.36, "#ffcf7a", x, ISLAND_TOP + 2.55, z, 1.4);
    }
    const label = BL.factoryModels.label;
    const museumSign = label("THE GENESIS MUSEUM", "Before the first block · 1956 to 2009 · in date order, clockwise", { height: 1.6, style: "gold" });
    const hs = place(createNode({ position: { x: 0, y: 9, z: MU.atrium.z1 - 0.6 }, rotation: { x: 0, y: Math.PI, z: 0 } }));
    addChild(hs, createNode({ geometry: museumSign.back }), createNode({ geometry: museumSign.face }));
    inFrame(ROOM_ERA, () => {
    // The room's ledge, the desk, the chain wall and the newspaper, on Era 3's left bank.
    solid(4.6, 0.55, 15, "#4a4038", -9.9 + SX, 0.27, -26.5 + SZ);
    solid(2.6, 0.55, 5, "#4a4038", -6.3 + SX, 0.27, -25.2 + SZ);
    const roomSign = label("FINGERPRINTS AND TIME · 1991", "Era 3 · Cypherpunks and Timestamps", { height: 1.4, style: "gold" });
    const sign = place(createNode({ position: { x: CHAIN.x - 0.4, y: 6.2, z: -26.5 + SZ }, rotation: { x: 0, y: Math.PI / 2, z: 0 } }));
    addChild(sign, createNode({ geometry: roomSign.back }), createNode({ geometry: roomSign.face }));
    const paperSign = label("THE DAILY OOGA", "widely publish the fingerprint · 1991", { height: 0.9, style: "plain" });
    const ps = place(createNode({ position: { x: PAPER.x + 0.05, y: PAPER.y + 1.25, z: PAPER.z }, rotation: { x: 0, y: Math.PI / 2, z: 0 } }));
    addChild(ps, createNode({ geometry: paperSign.back }), createNode({ geometry: paperSign.face }));
    solid(0.12, 1.8, 3, "#e9e1cc", PAPER.x, PAPER.y, PAPER.z);
    built.paperTile = place(createNode({ geometry: M.box({ w: 0.1, h: 0.7, d: 1.4, color: "#ffffff", emissive: 1 }), position: { x: PAPER.x + 0.1, y: PAPER.y, z: PAPER.z }, visible: false }));
    });
  };
  const buildDesk = () => inFrame(ROOM_ERA, () => {
    const honest = G.chain(false), tampered = G.chain(true), plain = TILE_COLORS(honest), changed = TILE_COLORS(tampered);
    built.codes = { honest, tampered };
    solid(2.6, 0.12, 1.3, "#7a5534", DESK.x, DESK.y + 0.6, DESK.z);
    for (const [dx, dz] of [[-1.15, -0.55], [1.15, -0.55], [-1.15, 0.55], [1.15, 0.55]]) solid(0.12, 0.6, 0.12, "#4c331d", DESK.x + dz, DESK.y + 0.3, DESK.z + dx);
    // The fingerprint machine: a body, a glowing window and a plunger that drops on every stamp.
    solid(0.8, 0.8, 0.8, "#55606b", DESK.x - 0.2, DESK.y + 1.06, DESK.z + 0.6);
    solid(0.05, 0.3, 0.5, "#7fe0ff", DESK.x + 0.21, DESK.y + 1.15, DESK.z + 0.6, 1.2);
    built.plunger = place(createNode({ geometry: M.box({ w: 0.3, h: 0.5, d: 0.3, color: "#c9a64a" }), position: { x: DESK.x - 0.2, y: DESK.y + 1.7, z: DESK.z + 0.6 } }));
    built.page = place(createNode({ geometry: M.box({ w: 0.5, h: 0.02, d: 0.7, color: "#f5f0e2" }), position: { x: DESK.x, y: DESK.y + 0.67, z: DESK.z - 0.8 } }));
    built.pageInk = createNode({ geometry: M.box({ w: 0.36, h: 0.01, d: 0.04, color: "#3a3a3a" }), position: { x: 0, y: 0.015, z: 0 } });
    addChild(built.page, built.pageInk);
    built.redPage = createNode({ geometry: M.box({ w: 0.5, h: 0.025, d: 0.7, color: "#ff5a4a", emissive: 0.6 }), visible: false });
    addChild(built.page, built.redPage);
    // The chain on the wall: one tile per stamp in both versions, and links between them in gold or broken red.
    solid(0.15, 2.4, 9.6, "#2f2a25", CHAIN.x - 0.12, CHAIN.y, CHAIN.z0 - 3.5);
    built.tiles = []; built.links = [];
    for (let i = 0; i < G.PAGES.length; i++) {
      const z = CHAIN.z0 - i * CHAIN.step;
      const a = place(createNode({ geometry: M.box({ w: 0.12, h: 0.75, d: 0.95, color: plain[i], emissive: 0.8 }), position: { x: CHAIN.x, y: CHAIN.y, z }, visible: false }));
      const b = place(createNode({ geometry: M.box({ w: 0.12, h: 0.75, d: 0.95, color: changed[i], emissive: 0.8 }), position: { x: CHAIN.x, y: CHAIN.y, z }, visible: false }));
      built.tiles.push({ honest: a, tampered: b, z });
      if (i === 0) continue;
      const lz = z + CHAIN.step / 2;
      const ok = place(createNode({ geometry: M.box({ w: 0.08, h: 0.12, d: CHAIN.step - 0.95, color: "#e8c35a", emissive: 0.7 }), position: { x: CHAIN.x, y: CHAIN.y, z: lz }, visible: false }));
      const bad = place(createNode({ geometry: M.box({ w: 0.08, h: 0.12, d: (CHAIN.step - 0.95) * 0.35, color: "#ff3b30", emissive: 1.2 }), position: { x: CHAIN.x, y: CHAIN.y - 0.18, z: lz }, visible: false }));
      built.links.push({ ok, bad });
    }
    built.flyer = place(createNode({ geometry: M.box({ w: 0.12, h: 0.45, d: 0.6, color: "#ffffff", emissive: 1 }), visible: false }));
    // Tock, the invented archivist, stands behind the desk facing the water.
    built.guide = M.caveman(BL.contributors.traitsFor("Tock the Archivist"));
    if (built.guide.parts.club) built.guide.parts.club.visible = false;
    built.guide.root.position.x = DESK.x - 1.35; built.guide.root.position.y = DESK.y; built.guide.root.position.z = DESK.z - 0.55;
    built.guide.root.rotation.y = Math.PI / 2;
    built.guide.root.scale.x = built.guide.root.scale.y = built.guide.root.scale.z = 1.35;
    place(built.guide.root);
    // A lectern by the water: tap it (or press I) for the panel.
    built.lectern = place(createNode({ geometry: M.bevelBox({ w: 0.7, h: 1.1, d: 0.5, color: "#7a5534" }), position: { x: -5.6 + SX, y: 1.1, z: -22.6 + SZ } }));
    built.lecternLight = place(createNode({ geometry: M.box({ w: 0.5, h: 0.06, d: 0.35, color: "#ffe9a8", emissive: 1.3 }), position: { x: -5.6 + SX, y: 1.68, z: -22.6 + SZ } }));
    built.lectern.museumFrame = ROOM_ERA;
  });
  // The museum's shell (in the museum's own coordinates): the atrium's floor, a band of gold round its edge and
  // a ring of round pillars well in from the galleries' openings, the walls (WALLS) and one roof over all.
  const buildMuseum = () => {
    const A = MU.atrium, B = MU.bounds;
    solid(A.x1 - A.x0, 1.15, A.z1 - A.z0, "#57524a", 0, ISLAND_TOP - 0.575, 0);
    const lines = [];
    for (const [w, d, x, z] of [[A.x1 - A.x0 - 24, 0.12, 0, A.z0 + 12], [A.x1 - A.x0 - 24, 0.12, 0, A.z1 - 12], [0.12, A.z1 - A.z0 - 24, A.x0 + 12, 0], [0.12, A.z1 - A.z0 - 24, A.x1 - 12, 0]])
      lines.push(M.moved(M.box({ w, h: 0.02, d, color: "#e8c35a", emissive: 0.6 }), x, ISLAND_TOP + 0.01, z));
    place(createNode({ geometry: M.merge(...lines), sightHidden: true }));
    for (const w of WALLS) solid(w.x1 - w.x0, ROOF, w.z1 - w.z0, "#3a3530", (w.x0 + w.x1) / 2, ROOF / 2, (w.z0 + w.z1) / 2);
    solid(B.x1 - B.x0 + 4, 1, B.z1 - B.z0 + 4, "#2a2622", (B.x0 + B.x1) / 2, ROOF + 0.5, (B.z0 + B.z1) / 2);
    const pillars = [];
    for (const x of [-26, 26]) for (const z of [-52, -18, 18, 52]) {
      pillars.push(M.moved(M.box({ w: 2.2, h: ROOF, d: 2.2, color: "#4a453e" }), x, ROOF / 2, z));
      pillars.push(M.moved(M.box({ w: 3, h: 0.6, d: 3, color: "#5d5850" }), x, ISLAND_TOP + 0.3, z));
      built.obstacles.push({ x0: x - 1.5, x1: x + 1.5, z0: z - 1.5, z1: z + 1.5 });
    }
    place(createNode({ geometry: M.merge(...pillars) }));
  };
  // Each era's gallery, in its frame and its old coordinates: its floor in the era's colour, a gold walk down the
  // middle where the stream ran, an arch over its opening with the era's sign, hanging rocks and boulders (kept off
  // the exhibits), glowing seams on its walls and its lamp posts.
  const buildGalleries = () => {
    const H = ROOF;
    built.caves = [];
    GW.ERAS.forEach((e, i) => inFrame(i, () => {
      const t = e.theme, b = MU.bays[i], z0 = e.z1 - b.depth, z1 = e.z1 - MU.OPEN, len = z1 - z0, mid = (z0 + z1) / 2, w = b.x1 - b.x0, cx = (b.x0 + b.x1) / 2;
      const clutter = (x, z, r) => {
        const hit = (q) => x + r > q.x0 && x - r < q.x1 && z + r > q.z0 && z - r < q.z1;
        return GW.reservedZones(i).some(hit) || built.oldObstacles.some((o) => o.era === i && hit(o));
      };
      solid(w, 1.15, len, t.bank, cx, ISLAND_TOP - 0.575, mid);
      // The era's own rock on its walls, just inside the museum's (so its colour shows), and its roof.
      for (const x of [b.x0 + 0.05, b.x1 - 0.05]) solid(0.1, H, len, t.rock, x, H / 2, mid);
      solid(w, H, 0.1, t.rock, cx, H / 2, z0 + 0.05);
      solid(w, 0.4, len, t.rock, cx, H - 0.2, mid);
      place(createNode({ geometry: M.moved(M.box({ w: CHANNEL.x1 - CHANNEL.x0, h: 0.02, d: len, color: "#5d5850" }), GW.LANE_X, ISLAND_TOP + 0.005, mid), sightHidden: true }));
      // The arch over the opening: two piers and a lintel in the era's rock, its lamp colour along the lintel, and the
      // era's sign in its own signage over the way in, facing the atrium.
      const glow = glowHex(t.lamp), archY = 12;
      for (const x of [b.x0 + 1.5, b.x1 - 1.5]) solid(3, archY, 2, t.rock, x, archY / 2, z1);
      solid(w, H - archY, 2, t.rock, cx, archY + (H - archY) / 2, z1);
      solid(w - 6, 0.25, 0.2, glow, cx, archY - 0.15, z1 + 1.05, 1.2);
      built.oldObstacles.push({ era: i, x0: b.x0, x1: b.x0 + 3, z0: z1 - 1, z1: z1 + 1 }, { era: i, x0: b.x1 - 3, x1: b.x1, z0: z1 - 1, z1: z1 + 1 });
      const sign = eraSign(e);
      hangSign(sign, GW.LANE_X, archY + 1 + sign.height / 2, z1 + 1.1, 0, sign.frame);
      const rand = BL.math.mulberry32(31 + i);
      for (let k = 0; k < 10; k++) {
        const h = 2 + rand() * 6;
        solid(1.5 + rand() * 3, h, 1.5 + rand() * 3, t.rock, b.x0 + 2 + rand() * (w - 4), H - h / 2, z1 - 3 - rand() * (len - 6));
      }
      for (let k = 0; k < 10; k++) {
        const left = rand() < 0.5, x = left ? b.x0 + 2 + rand() * (CHANNEL.x0 - b.x0 - 6) : CHANNEL.x1 + 4 + rand() * (b.x1 - CHANNEL.x1 - 6);
        const sz = 0.8 + rand() * 2.2, z = z1 - 4 - rand() * (len - 8), r = sz * 0.7 + 0.5;
        if (x < b.x0 + 1 || x > b.x1 - 1 || Math.abs(x - (x < GW.LANE_X ? CHANNEL.x0 : CHANNEL.x1)) < GW.BANK.FRONT + r || clutter(x, z, r)) continue;
        solid(sz * 1.3, sz, sz, t.rock, x, ISLAND_TOP + sz / 2, z);
        built.oldObstacles.push({ era: i, x0: x - sz * 0.65, x1: x + sz * 0.65, z0: z - sz / 2, z1: z + sz / 2 });
      }
      for (let k = 0; k < 10; k++) {
        const left = k % 2 === 0, z = z1 - 4 - (k >> 1) * (len - 8) / 4, y = 3 + rand() * (H - 8);
        solid(0.12, 0.4 + rand() * 0.6, 3 + rand() * 6, glow, left ? b.x0 + 0.16 : b.x1 - 0.16, y, z, 1.3);
      }
      for (const l of GW.lampPosts(i)) {
        if (l.z < z0 + 1 || l.x < b.x0 + 1 || l.x > b.x1 - 1) continue;
        solid(0.3, 8.6, 0.3, "#3b2a1a", l.x, ISLAND_TOP + 4.3, l.z);
        solid(0.9, 0.9, 0.9, "#ffcf7a", l.x, ISLAND_TOP + 8.9, l.z, 1.5);
        built.oldObstacles.push({ era: i, x0: l.x - 0.3, x1: l.x + 0.3, z0: l.z - 0.3, z1: l.z + 0.3 });
      }
      built.caves.push(e);
    }));
  };
  // The museum's legend: a huge white screen on the entrance hall's left wall, an original timeline in the style of a
  // "prehistory" fishbone chart, painted once from this visit's exhibits. Every exhibit hangs off the time line at its
  // date (a date only, never a claim of influence); gold marks a whitepaper citation, a gold ring documented influence,
  // grey context; the paper (31 October 2008) and the first block (January 2009) stand apart at the right. A tap on it,
  // or Space beside it, opens the menu (the timeline as buttons, openMenu).
  // The white screen stands in the atrium ahead of the arrival, facing it (south): 24 m wide.
  const LEGEND = { x: 0, y: 4.4, z: 48, w: 24, h: 8, ry: 0, at: { x: 0, z: 51 } };
  const buildLegend = () => {
    const W = 4096, H = Math.round(W * LEGEND.h / LEGEND.w), canvas = document.createElement("canvas"), g = canvas.getContext("2d");
    canvas.width = W; canvas.height = H;
    const count = BL.genesisTimeline.paint(g, W, H, catalogue, host.records);
    const image = new Image();
    image.src = canvas.toDataURL("image/png");
    const face = { verts: [-LEGEND.w / 2, -LEGEND.h / 2, 0.03, LEGEND.w / 2, -LEGEND.h / 2, 0.03, LEGEND.w / 2, LEGEND.h / 2, 0.03, -LEGEND.w / 2, LEGEND.h / 2, 0.03], faces: [{ i: [0, 1, 2, 3], color: [0, 0, 0], emissive: 0 }], lines: [], castShadow: false };
    face.imageSurface = { asset: { width: W, height: H, load: () => image }, rect: [-LEGEND.w / 2, -LEGEND.h / 2, LEGEND.w, LEGEND.h] };
    const node = place(createNode({ position: { x: LEGEND.x, y: ISLAND_TOP + LEGEND.y, z: LEGEND.z }, rotation: { x: 0, y: LEGEND.ry, z: 0 } }));
    // Its two legs, and the box walkers meet under it.
    for (const dx of [-LEGEND.w / 2 + 1, LEGEND.w / 2 - 1]) solid(0.3, LEGEND.y - LEGEND.h / 2 + 0.2, 0.3, "#3b2a1a", LEGEND.x + dx, ISLAND_TOP + (LEGEND.y - LEGEND.h / 2 + 0.2) / 2, LEGEND.z - 0.15);
    built.obstacles.push({ x0: LEGEND.x - LEGEND.w / 2, x1: LEGEND.x + LEGEND.w / 2, z0: LEGEND.z - 0.4, z1: LEGEND.z + 0.2 });
    addChild(node, createNode({ geometry: M.bevelBox({ w: LEGEND.w + 0.4, h: LEGEND.h + 0.4, d: 0.16, color: "#d9d4c8", bevel: 0.05, offset: { z: -0.08 } }) }), createNode({ geometry: face }));
    built.legend = place(createNode({ geometry: pickBox(LEGEND.w, LEGEND.h, 0.4), position: { x: LEGEND.x, y: ISLAND_TOP + LEGEND.y, z: LEGEND.z + 0.2 }, rotation: { x: 0, y: LEGEND.ry, z: 0 } }));
    built.legendItems = count;
  };
  // === Walking and the workbench ===================================================================================
  // The pilot and crew are made once per visit; the visitor's Ooga walks the whole visit.
  const walk = { on: false, prop: null, falls: 0, saved: { fov: 0, near: 0 } };
  const walkPose = { position: { x: 0, y: 0, z: 0 }, yaw: 0, pitch: 0.2, dist: 4.5 };
  let pilot = null, people = null, avatar = null, fx = null, footsteps = null, remotes = null, footing = null, props = null;
  let playerName = null, arrivedPilot = null;
  const propState = { uses: 0, last: "" };
  const NO_ACTORS = [];
  const mayPossess = (cave) => BL.net.mayDrive(cave.traits.name, BL.contributors.stateFor(cave.contributor) === "working");
  const mayPick = (c) => !BL.net.mayDrive(c.name, BL.contributors.stateFor(c) === "working");
  const feetOf = () => avatar ? avatar.root.position.y - avatar.baseY : 0;
  const groundFor = (x, z, feet) => footing.supportAt(x, z, feet);
  const walkableFor = (ax, az, bx, bz, y, height, actor) => footing.walkable(ax, az, bx, bz, Math.min(actor.bodyRadius || 0.3, 0.3));
  const useNear = (x, z, reach, feet = feetOf()) => {
    const prop = props.near(x, z, feet, Math.max(0, reach - 1.4));
    if (!prop) return false;
    openProp(prop);
    return true;
  };

  // The props' models: an original beige office PC on a table, the 1956 drive cabinet beside a fingernail-sized
  // card on a plinth, and Tock's book on a stand. Each has a sign naming it and its year.
  const buildProps = () => inFrame(ROOM_ERA, () => {
    const label = BL.factoryModels.label;
    const sign = (prop, sub, y) => {
      const s = label(prop.label, sub, { height: 0.45, style: "plain" });
      const at = PROPS[prop.id], n = place(createNode({ position: { x: at.x + 0.35, y: at.y + y, z: at.z }, rotation: { x: 0, y: Math.PI / 2, z: 0 } }));
      addChild(n, createNode({ geometry: s.back }), createNode({ geometry: s.face }));
    };
    const pc = PROPS.pc, dr = PROPS.drives, bk = PROPS.book;
    solid(1.1, 0.08, 1.2, "#6b4a2b", pc.x, pc.y + 0.72, pc.z);
    for (const [dx, dz] of [[-0.45, -0.5], [0.45, -0.5], [-0.45, 0.5], [0.45, 0.5]]) solid(0.07, 0.72, 0.07, "#4c331d", pc.x + dx, pc.y + 0.36, pc.z + dz);
    solid(0.5, 0.16, 0.9, "#d8cfb4", pc.x - 0.15, pc.y + 0.84, pc.z);
    solid(0.45, 0.42, 0.5, "#e2d9be", pc.x - 0.15, pc.y + 1.13, pc.z);
    built.pcScreen = place(createNode({ geometry: M.box({ w: 0.02, h: 0.3, d: 0.38, color: "#38ff7a", emissive: 1.2 }), position: { x: pc.x + 0.085, y: pc.y + 1.14, z: pc.z } }));
    solid(0.22, 0.03, 0.62, "#cfc6aa", pc.x + 0.32, pc.y + 0.78, pc.z);
    built.pc = place(createNode({ geometry: pickBox(1.2, 1.4, 1.3), position: { x: pc.x, y: pc.y + 0.7, z: pc.z } }));
    sign(props.get("pc"), "DIR · TYPE · HASH", 1.75);
    solid(1, 0.5, 1, "#5a524a", dr.x, dr.y + 0.25, dr.z);
    // A schematic of the 1956 cabinet (not to scale), its stack of disks in a window, and the card beside it.
    solid(0.6, 0.5, 0.18, "#8d939a", dr.x - 0.1, dr.y + 0.75, dr.z - 0.2);
    for (let i = 0; i < 6; i++) solid(0.04, 0.012, 0.14, "#c9ced4", dr.x + 0.0, dr.y + 0.62 + i * 0.04, dr.z - 0.2);
    solid(0.011, 0.001, 0.015, "#202020", dr.x + 0.25, dr.y + 0.501, dr.z + 0.3);
    solid(0.12, 0.01, 0.12, "#ffd25f", dr.x + 0.25, dr.y + 0.5, dr.z + 0.3, 0.6);
    built.drives = place(createNode({ geometry: pickBox(1.1, 1.1, 1.1), position: { x: dr.x, y: dr.y + 0.55, z: dr.z } }));
    sign(props.get("drives"), "schematic, not to scale", 1.55);
    solid(0.5, 0.95, 0.5, "#7a5534", bk.x, bk.y + 0.47, bk.z);
    solid(0.42, 0.04, 0.56, "#f5f0e2", bk.x, bk.y + 0.97, bk.z);
    solid(0.02, 0.05, 0.02, "#2a2a2a", bk.x + 0.1, bk.y + 1.0, bk.z + 0.15);
    built.book = place(createNode({ geometry: pickBox(0.7, 1.2, 0.8), position: { x: bk.x, y: bk.y + 0.6, z: bk.z } }));
    sign(props.get("book"), "stamp your own page", 1.45);
    for (const id of ["pc", "drives", "book"]) built[id].museumFrame = ROOM_ERA;
  });
  // Fingerprints and Time's whitepaper citations, as trail stops at its lectern (tap it, or I, for the panel).
  const LECTERN = { x: -5.6 + SX, z: -22.6 + SZ };
  const ROOM_LINKS = [
    { id: "era3-room-haber1991", year: 1991, title: "Timestamp a page, at Fingerprints and Time", connection: "citation", ref: "[3]", date: "1991 journal publication", at: { x: LECTERN.x + 1, y: ISLAND_TOP, z: LECTERN.z } },
    { id: "era3-room-bayer1993", year: 1993, title: "One tree, many pages, at Fingerprints and Time", connection: "citation", ref: "[4]", date: "1993 book chapter; manuscript dated March 1992", at: { x: LECTERN.x + 1, y: ISLAND_TOP, z: LECTERN.z - 1.4 } }
  ];
  // --- Era exhibits (genesis-exhibits.js, one genesis-era-<n>.js per cave) ---------------------------------------------
  // Each era's file builds its cave's exhibits through a kit; usable ones become props like the room's, with a pick box
  // that taps select. Built once a visit, before the footing, so their obstacles count.
  const buildExhibits = () => {
    const EX = BL.genesisExhibits, label = BL.factoryModels.label;
    built.propNodes = {}; built.exhibitProps = []; built.trail = [];
    exhibitEra = -1;
    if (!EX) return;
    for (let n = 0; n < GW.ERAS.length; n++) inFrame(n, () => {
      const def = EX.eras[n];
      if (!def) return;
      const era = GW.ERAS[n];
      const kit = {
        era, top: ISLAND_TOP, channel: CHANNEL, M, createNode, addChild, place, solid, label,
        // A short notice from an exhibit's update (a toast once the HUD is up; the kit is built before it).
        notify: (text) => { if (hud) hud.toast(text); },
        sign: (title, sub, x, y, z, yaw = 0, height = 0.6) => {
          const l = label(title, sub, { height, style: "plain" }), node = place(createNode({ position: { x, y, z }, rotation: { x: 0, y: yaw, z: 0 } }));
          addChild(node, createNode({ geometry: l.back }), createNode({ geometry: l.face }));
          return node;
        },
        obstacle: (x0, x1, z0, z1) => { built.oldObstacles.push({ era: n, x0, x1, z0, z1 }); },
        prop: (d) => {
          const problem = EX.checkProp(n, d);
          if (problem) throw new Error(`genesis exhibits: era ${n}: ${problem}`);
          // A board's last page says how the exhibit connects, with its trail step (numbered once every era is built).
          const entry = { era: n, def: d, order: built.exhibitProps.length, step: 0 };
          const onUse = d.connection ? (state) => {
            const r = d.onUse(state);
            if (!r || !(r.board || r.terminal)) return r;
            const c = EX.CONNECTIONS[d.connection];
            const how = [`${c.label}${d.ref ? ` ${d.ref}` : ""}.${d.date ? ` ${d.date}.` : ""}`, entry.step
              ? `Step ${entry.step} of ${built.trail.length} on the Steps toward Bitcoin: follow the gold path through the galleries, in date order.`
              : entry.shows ? `It shows ${entry.shows} on the Steps toward Bitcoin working; it is not a step of its own.`
              : entry.listed ? `Listed in the paper's own references. Its story, and its place on the Steps toward Bitcoin, are earlier in the museum: ${entry.listed}. This slot is not a second step.`
              : "Part of the story of these years, not something the Bitcoin whitepaper cites or is shown to have drawn on."];
            // A terminal has no pages: the same words open its screen, as its banner's first lines.
            if (r.terminal) { const t = r.terminal; return { ...r, terminal: { banner: [`HOW IT CONNECTS: ${how[0]}`, how[1], "", ...t.banner], prompt: t.prompt, run: (line) => t.run(line) } }; }
            return { ...r, board: { ...r.board, pages: [...r.board.pages, { caption: "How it connects", title: c.label, text: how }] } };
          } : d.onUse;
          // Registered where it stands in the museum; its tap box goes in the gallery's frame, in the era's coordinates.
          const prop = props.register({ ...d, era: n, onUse, at: muAt(n, d.at) });
          entry.prop = prop;
          built.exhibitProps.push(entry);
          const pick = d.pick || { w: 1, h: 1.4, d: 1 };
          const node = place(createNode({ geometry: pickBox(pick.w, pick.h, pick.d), position: { x: pick.x !== undefined ? pick.x : d.at.x, y: (d.at.y || 0) + pick.h / 2, z: pick.z !== undefined ? pick.z : d.at.z } }));
          node.museumFrame = n;
          built.propNodes[prop.id] = node;
          return { ...d, era: n };
        }
      };
      def.build(kit);
    });
    // Fingerprints and Time's own exhibits are trail stops too, linked rather than duplicated: the lectern's panel
    // tells both papers' story (genesis-voyage.js FINGERPRINTS).
    for (const link of ROOM_LINKS) built.exhibitProps.push({ era: ROOM_ERA, def: link, prop: { id: link.id, at: muAt(ROOM_ERA, link.at) }, order: built.exhibitProps.length, step: 0, room: true });
    built.trail = EX.trailOf(built.exhibitProps);
    // A demonstration links to the stops it shows, by their numbers, and must name stops that exist.
    for (const e of built.exhibitProps) {
      if (!e.def.demonstrates) continue;
      const steps = e.def.demonstrates.map((id) => { const s = built.trail.find((t) => (t.def.id || t.prop.id) === id); if (!s) throw new Error(`genesis exhibits: ${e.def.id} demonstrates ${id}, which is not a trail stop`); return s; });
      e.shows = steps.map((s) => `step ${s.step} (${s.def.title}${s.def.ref ? ` ${s.def.ref}` : ""})`).join(" and ");
    }
    // A bibliography entry points to the citation stop with its reference, which must exist.
    for (const e of built.exhibitProps) {
      if (e.def.connection !== "bibliography") continue;
      const stop = built.trail.find((t) => t.def.connection === "citation" && t.def.ref === e.def.ref);
      if (!stop) throw new Error(`genesis exhibits: ${e.def.id} lists ${e.def.ref}, which no citation stop carries`);
      e.listed = `step ${stop.step}, ${stop.def.title}, in Era ${stop.era}`;
    }
  };
  // Each frame, the exhibits of the cave the visitor is in (aboard or ashore) may move; nothing else runs.
  // `calm` is the visit's Calm (reduced motion): era files hold decorative movement and blinking while it is on. When
  // the cave the visitor is in (aboard or ashore) changes, the era left gets `active(false, state)` and the era entered
  // `active(true, state)`, so a cave can stop what outlives its frames (sound scheduled ahead) the moment it is left.
  const exhibitState = { era: -1, walking: false, reading: false, x: 0, z: 0, calm: false }, oldPoint = { x: 0, z: 0 };
  let exhibitEra = -1;
  const updateExhibits = (dt, elapsed) => {
    const EX = BL.genesisExhibits;
    if (!EX) return;
    // While a workbench is open its exhibit's era runs (so its model answers), wherever the visitor stands.
    const p = bench.open ? bench.focus : avatar ? avatar.root.position : ENTRY, era = bench.open ? bench.era : MU.eraNear(p.x, p.z), def = era >= 0 ? EX.eras[era] : null;
    // An era file reads the visitor's place in its own old coordinates.
    if (era >= 0) MU.fromMuseum(era, p.x, p.z, oldPoint); else { oldPoint.x = p.x; oldPoint.z = p.z; }
    exhibitState.era = era; exhibitState.walking = walk.on; exhibitState.x = oldPoint.x; exhibitState.z = oldPoint.z; exhibitState.calm = view.calm;
    exhibitState.reading = view.reading || bench.open;
    if (era !== exhibitEra) {
      const left = exhibitEra >= 0 ? EX.eras[exhibitEra] : null;
      exhibitEra = era;
      if (left && left.active) left.active(false, exhibitState);
      if (def && def.active) def.active(true, exhibitState);
    }
    if (!def || !def.update) return;
    def.update(dt, elapsed, exhibitState);
  };
  const disposeExhibits = () => {
    const EX = BL.genesisExhibits;
    if (EX) for (const def of EX.eras) if (def && def.dispose) def.dispose();
  };
  // --- Shared era signage (integrator; docs/genesis-voyage/EXHIBIT-CONTRACT.md) ---------------------------------------
  // Every cave gets the same frame, whatever its era file builds: a large sign in its era's signage on the far back
  // wall (buildCaves), a pylon naming the era on each bank's gateway, an overview board on the left bank's gateway (tap or
  // Space for its panel), and the Steps toward Bitcoin: a gold path along each bank's waterside walk to every exhibit
  // whose connection is on the trail, with a STEP post by each, numbered in date order across all eras.
  const glowHex = (rgb) => "#" + rgb.map((v) => Math.round(Math.min(1, v / 1.4) * 255).toString(16).padStart(2, "0")).join("");
  const firstYear = (years) => +years.match(/\d{4}/)[0];
  // A board of text painted once into an unlit picture (as factoryModels.label is, so it reads in any cave light): a
  // kicker, a title, wrapped body lines and a list (gold items for trail steps). `width` is in metres.
  const SIGN_PX = 96;
  const textBoard = ({ kicker = "", title, body = [], list = [], width = 3, accent = "#e8c35a" }) => {
    const canvas = document.createElement("canvas"), g = canvas.getContext("2d"), w = Math.round(width * SIGN_PX * 2);
    const font = (px, bold) => `${bold ? "bold " : ""}${px}px system-ui, sans-serif`;
    canvas.width = w; g.font = font(30);
    const lines = [];
    for (const para of body) { lines.push(...wrap(g, para, w - 72)); lines.push(""); }
    const h = 150 + lines.length * 38 + list.length * 40 + 30;
    canvas.height = h;
    g.fillStyle = "#0d0b0a"; g.fillRect(0, 0, w, h);
    g.strokeStyle = accent; g.lineWidth = 6; g.strokeRect(8, 8, w - 16, h - 16);
    g.textBaseline = "top"; g.fillStyle = accent; g.font = font(28, true); g.fillText(kicker, 36, 30);
    g.fillStyle = "#f8f4ec"; g.font = font(48, true); g.fillText(title, 36, 66);
    g.font = font(30); g.fillStyle = "#e6dfd1";
    let y = 140;
    for (const line of lines) { g.fillText(line, 36, y); y += 38; }
    for (const item of list) { g.fillStyle = item.gold ? accent : "#d6cfc1"; g.font = font(30, item.gold); g.fillText(item.text, 36, y); y += 40; }
    const image = new Image();
    image.src = canvas.toDataURL("image/png");
    const W = width, H = h / (SIGN_PX * 2);
    const face = { verts: [-W / 2, -H / 2, 0.03, W / 2, -H / 2, 0.03, W / 2, H / 2, 0.03, -W / 2, H / 2, 0.03], faces: [{ i: [0, 1, 2, 3], color: [0, 0, 0], emissive: 0 }], lines: [], castShadow: false };
    face.imageSurface = { asset: { width: w, height: h, load: () => image }, rect: [-W / 2, -H / 2, W, H] };
    const back = M.bevelBox({ w: W + 0.16, h: H + 0.16, d: 0.1, color: "#2a2622", bevel: 0.03, offset: { z: -0.03 } });
    back.castShadow = false;
    return { face, back, width: W, height: H };
  };
  // Each cave's big sign on its back wall, painted once in its era's own signage, all original and unbranded: Era 0
  // enamel on steel, Era 1 a wood-panel board with seventies stripes, Era 2 neon on black, Era 3 a beige terminal's
  // banner, Era 4 a chrome-framed LCD, Era 5 a glossy two-thousands panel, Era 6 a printed page, Era 7 a glowing block.
  // The years read large, the era's name under them. `frame` is the lit trim hung round it (null for none).
  const ERA_SIGN_STYLES = [
    { frame: "#c9ced4", paint: (g, w, h, a, b) => {
      g.fillStyle = "#f1ead6"; g.fillRect(0, 0, w, h);
      g.fillStyle = "#1f3a5f"; g.fillRect(0, 0, w, 26); g.fillRect(0, h - 26, w, 26); g.fillRect(0, 0, 26, h); g.fillRect(w - 26, 0, 26, h);
      g.fillStyle = "#8d939a"; for (const [x, y] of [[48, 48], [w - 48, 48], [48, h - 48], [w - 48, h - 48]]) { g.beginPath(); g.arc(x, y, 12, 0, 7); g.fill(); }
      signText(g, a, w / 2, h * 0.43, "bold 190px Georgia, serif", "#1f3a5f"); signText(g, b, w / 2, h * 0.76, "bold 66px Georgia, serif", "#a3262a");
    } },
    { frame: null, paint: (g, w, h, a, b) => {
      g.fillStyle = "#5a3a22"; g.fillRect(0, 0, w, h);
      g.strokeStyle = "rgba(30,16,8,0.35)"; g.lineWidth = 3; for (let x = 18; x < w; x += 46) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 6, h); g.stroke(); }
      const bands = ["#f0a032", "#e0622a", "#b5361f", "#7a2a16"]; bands.forEach((c, i) => { g.fillStyle = c; g.fillRect(0, h - 120 + i * 24, w, 24); });
      signText(g, a, w / 2, h * 0.36, "bold 180px Trebuchet MS, system-ui, sans-serif", "#f6e3b4"); signText(g, b, w / 2, h * 0.64, "bold 62px Trebuchet MS, system-ui, sans-serif", "#f0c27a");
    } },
    { frame: "#ff4fd8", paint: (g, w, h, a, b) => {
      g.fillStyle = "#0c0614"; g.fillRect(0, 0, w, h);
      g.strokeStyle = "#4ff3ff"; g.lineWidth = 8; g.shadowColor = "#4ff3ff"; g.shadowBlur = 24; g.strokeRect(30, 30, w - 60, h - 60);
      signGlow(g, a, w / 2, h * 0.42, "bold 190px system-ui, sans-serif", "#ff4fd8"); signGlow(g, b, w / 2, h * 0.75, "bold 64px system-ui, sans-serif", "#4ff3ff");
    } },
    { frame: null, paint: (g, w, h, a, b) => {
      g.fillStyle = "#d8cfb4"; g.fillRect(0, 0, w, h);
      g.fillStyle = "#b9b096"; g.fillRect(0, h - 40, w, 40);
      g.fillStyle = "#081008"; g.fillRect(56, 44, w - 112, h - 124);
      g.fillStyle = "rgba(56,255,122,0.08)"; for (let y = 48; y < h - 84; y += 8) g.fillRect(60, y, w - 120, 3);
      signGlow(g, a, w / 2, h * 0.36, "bold 170px Courier New, monospace", "#38ff7a"); signGlow(g, `> ${b}_`, w / 2, h * 0.64, "bold 56px Courier New, monospace", "#38ff7a");
    } },
    { frame: "#d9dde1", paint: (g, w, h, a, b) => {
      const chrome = g.createLinearGradient(0, 0, 0, h); chrome.addColorStop(0, "#f4f6f8"); chrome.addColorStop(0.5, "#8a929a"); chrome.addColorStop(1, "#e2e6ea");
      g.fillStyle = chrome; g.fillRect(0, 0, w, h);
      g.fillStyle = "#9fb39a"; g.fillRect(48, 48, w - 96, h - 96);
      g.fillStyle = "rgba(20,40,20,0.08)"; for (let x = 52; x < w - 52; x += 10) g.fillRect(x, 52, 2, h - 104);
      signText(g, a, w / 2, h * 0.42, "bold 180px Courier New, monospace", "#1d2a1d"); signText(g, b, w / 2, h * 0.74, "bold 58px Courier New, monospace", "#26381f");
    } },
    { frame: "#8fd3ff", paint: (g, w, h, a, b) => {
      const sky = g.createLinearGradient(0, 0, 0, h); sky.addColorStop(0, "#5fb8ff"); sky.addColorStop(1, "#0b4f9c");
      g.fillStyle = sky; g.fillRect(0, 0, w, h);
      const gloss = g.createLinearGradient(0, 0, 0, h / 2); gloss.addColorStop(0, "rgba(255,255,255,0.55)"); gloss.addColorStop(1, "rgba(255,255,255,0.08)");
      g.fillStyle = gloss; g.fillRect(0, 0, w, h / 2);
      g.shadowColor = "rgba(0,0,0,0.45)"; g.shadowBlur = 14; g.shadowOffsetY = 6;
      signText(g, a, w / 2, h * 0.42, "bold 180px Verdana, system-ui, sans-serif", "#ffffff"); signText(g, b, w / 2, h * 0.74, "60px Verdana, system-ui, sans-serif", "#e8f4ff");
    } },
    { frame: null, paint: (g, w, h, a, b) => {
      g.fillStyle = "#faf8f2"; g.fillRect(0, 0, w, h);
      g.fillStyle = "#1a1a1a"; g.fillRect(90, 150, w - 180, 3); g.fillRect(90, h - 120, w - 180, 2);
      signText(g, b, w / 2, 100, "bold 62px Times New Roman, Georgia, serif", "#111111"); signText(g, a, w / 2, h * 0.56, "150px Times New Roman, Georgia, serif", "#111111");
      signText(g, "an original printed sign · the paper itself is in this cave", w / 2, h - 70, "italic 34px Times New Roman, Georgia, serif", "#444444");
    } },
    { frame: "#ff9a2e", paint: (g, w, h, a, b) => {
      g.fillStyle = "#120c08"; g.fillRect(0, 0, w, h);
      g.fillStyle = "#ff9a2e"; g.shadowColor = "#ff9a2e"; g.shadowBlur = 18;
      for (let x = 20; x < w - 20; x += 40) { g.fillRect(x, 20, 28, 28); g.fillRect(x, h - 48, 28, 28); }
      for (let y = 60; y < h - 60; y += 40) { g.fillRect(20, y, 28, 28); g.fillRect(w - 48, y, 28, 28); }
      signGlow(g, a, w / 2, h * 0.43, "bold 170px Courier New, monospace", "#ffb45a"); signGlow(g, b, w / 2, h * 0.73, "bold 58px Courier New, monospace", "#ff9a2e");
    } }
  ];
  // Centred text, its font shrunk to fit inside the sign's margins (a long date such as Era 7's would run off it).
  const SIGN_TEXT_MAX = 1320;
  const signText = (g, s, x, y, font, color) => {
    g.font = font;
    const w = g.measureText(s).width;
    if (w > SIGN_TEXT_MAX) g.font = font.replace(/(\d+)px/, (m, px) => `${Math.floor(px * SIGN_TEXT_MAX / w)}px`);
    g.fillStyle = color; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(s, x, y);
  };
  const signGlow = (g, s, x, y, font, color) => { g.save(); g.shadowColor = color; g.shadowBlur = 28; signText(g, s, x, y, font, color); g.shadowBlur = 0; signText(g, s, x, y, font, "#ffffff"); g.restore(); g.save(); g.globalAlpha = 0.55; signText(g, s, x, y, font, color); g.restore(); };
  const eraSign = (e) => {
    const canvas = document.createElement("canvas"), g = canvas.getContext("2d"), w = 1500, h = 600;
    canvas.width = w; canvas.height = h;
    ERA_SIGN_STYLES[e.n].paint(g, w, h, e.years.toUpperCase(), `Era ${e.n} · ${e.name}`);
    const image = new Image();
    image.src = canvas.toDataURL("image/png");
    const H = e.sign.height, W = H * w / h;
    const face = { verts: [-W / 2, -H / 2, 0.03, W / 2, -H / 2, 0.03, W / 2, H / 2, 0.03, -W / 2, H / 2, 0.03], faces: [{ i: [0, 1, 2, 3], color: [0, 0, 0], emissive: 0 }], lines: [], castShadow: false };
    face.imageSurface = { asset: { width: w, height: h, load: () => image }, rect: [-W / 2, -H / 2, W, H] };
    // The backing ends behind the face (at +0.01, the face at +0.03), so the two never fight for the same depth.
    const back = M.bevelBox({ w: W + 0.3, h: H + 0.3, d: 0.16, color: "#1c1916", bevel: 0.04, offset: { z: -0.07 } });
    back.castShadow = false;
    return { face, back, width: W, height: H, frame: ERA_SIGN_STYLES[e.n].frame };
  };
  // A sign (a label or a text board) at (x, y, z) turned `ry`, framed by four lit bars in `glow` if given: they read
  // from in front and stay a thin frame from behind.
  const hangSign = (sign, x, y, z, ry, glow = null) => {
    const n = place(createNode({ position: { x, y, z }, rotation: { x: 0, y: ry, z: 0 } }));
    if (glow) {
      const w = sign.width + 0.42, h = sign.height + 0.42, t = 0.12;
      for (const [bw, bh, bx, by] of [[w, t, 0, h / 2], [w, t, 0, -h / 2], [t, h, w / 2, 0], [t, h, -w / 2, 0]]) addChild(n, createNode({ geometry: M.box({ w: bw, h: bh, d: 0.1, color: glow, emissive: 1.1 }), position: { x: bx, y: by, z: -0.02 } }));
    }
    addChild(n, createNode({ geometry: sign.back }), createNode({ geometry: sign.face }));
    return n;
  };
  // A prop's place on its bank: which side and its (u, v) in genesis-world.js's bank frame.
  const bankPlace = (era, at) => {
    const side = at.x < GW.LANE_X ? -1 : 1, f = GW.bankFrame(era, side);
    return { f, side, u: f.z1 - at.z, v: (at.x - f.edge) * side };
  };
  const buildEraFrames = () => {
    const label = BL.factoryModels.label, B = GW.BANK, p = { x: 0, z: 0 }, EX = BL.genesisExhibits;
    built.overviews = [];
    GW.ERAS.forEach((e) => inFrame(e.n, () => {
      const glow = glowHex(e.theme.lamp);
      const spot = GW.overviewSpot(e.n);
      p.x = spot.x; p.z = spot.z;
      const def = EX && EX.eras[e.n], mine = built.exhibitProps.filter((x) => x.era === e.n).sort((a, b) => EX.yearKey(a.def.year) - EX.yearKey(b.def.year) || a.order - b.order);
      const board = textBoard({ kicker: `ERA ${e.n} · ${e.years.toUpperCase()}`, title: e.name, width: 3.4,
        body: [def && def.overview ? def.overview.summary : mine.length ? "Walk the gallery: every exhibit here shows its year." : "This gallery's exhibits are still being built."],
        list: mine.length ? [...mine.map((x) => ({ text: `${x.def.year} · ${x.def.title}${x.step ? `  ★ step ${x.step}` : ""}`, gold: !!x.step })),
          ...(mine.some((x) => x.step) ? [{ text: "★ Steps toward Bitcoin: follow the gold path", gold: true }] : [])] : [] });
      const ry = spot.ry, lift = ISLAND_TOP + 0.9 + board.height / 2;
      // Its post stands behind the board (genesis-world.js overviewSpot), never through its face.
      solid(spot.post.w, 0.9 + board.height / 2, spot.post.w, "#3b2a1a", spot.post.x, ISLAND_TOP + (0.9 + board.height / 2) / 2, spot.post.z);
      hangSign(board, p.x, lift, p.z, ry, glow);
      const pick = place(createNode({ geometry: pickBox(3.6, board.height + 1.2, 0.6), position: { x: p.x, y: lift, z: p.z }, rotation: { x: 0, y: ry, z: 0 } }));
      // Walkers meet the board along its line and use it from in front of its face (genesis-world.js overviewSpot).
      built.overviews.push({ era: e.n, pick, at: muAt(e.n, { x: spot.at.x, y: ISLAND_TOP, z: spot.at.z }) });
      for (const box of spot.boxes) built.oldObstacles.push({ era: e.n, ...box });
    }));
  };
  // The trail's path: a gold strip along each bank's walk (BANK.TRAIL_V) from the gateway to its last step, chevrons
  // pointing downstream (later in time), a spur to each step and a numbered post; pieces crossing a reserved plot
  // other than the gateway (the dock and its ramps, a lamp, Fingerprints and Time) are left out. One merged mesh.
  const buildTrail = () => {
    const label = BL.factoryModels.label, B = GW.BANK, p = { x: 0, z: 0 }, parts = [];
    for (const e of GW.ERAS) inFrame(e.n, () => {
      const reserved = GW.reservedZones(e.n).filter((r) => r.why !== "gateway");
      for (const side of [-1, 1]) {
        const stops = built.trail.filter((x) => x.era === e.n).map((x) => ({ x, ...bankPlace(e.n, x.def.at) })).filter((s) => s.side === side);
        if (!stops.length) continue;
        const f = stops[0].f, end = Math.max(...stops.map((s) => s.u));
        for (let u = 6; u < end; u += 2) {
          GW.bankToWorld(f, u + 1, B.TRAIL_V, p);
          if (reserved.some((r) => p.x > r.x0 - 0.3 && p.x < r.x1 + 0.3 && p.z > r.z0 - 1 && p.z < r.z1 + 1)) continue;
          parts.push(M.moved(M.box({ w: 0.4, h: 0.03, d: 1.9, color: "#e8c35a", emissive: 0.9 }), p.x, ISLAND_TOP + 0.02, p.z));
          if (u % 4 === 0) for (const s of [-1, 1]) parts.push(M.moved(M.turnedY(M.box({ w: 0.08, h: 0.035, d: 0.5, color: "#fff2c4", emissive: 1.2 }), s * 0.6), p.x + s * 0.13, ISLAND_TOP + 0.03, p.z - 0.1));
        }
        for (const s of stops) {
          if (s.v - B.TRAIL_V > 0.2) { GW.bankToWorld(f, s.u, (s.v + B.TRAIL_V) / 2, p); parts.push(M.moved(M.box({ w: s.v - B.TRAIL_V, h: 0.03, d: 0.4, color: "#e8c35a", emissive: 0.9 }), p.x, ISLAND_TOP + 0.02, p.z)); }
          GW.bankToWorld(f, s.u - 1.2, Math.max(B.TRAIL_V + 0.4, s.v - 0.6), p);
          solid(0.18, 1.5, 0.18, "#3b2a1a", p.x, ISLAND_TOP + 0.75, p.z);
          hangSign(label(`STEP ${s.x.step}`, `${s.x.def.year}`, { height: 0.55, style: "gold" }), p.x, ISLAND_TOP + 1.75, p.z, side < 0 ? Math.PI / 2 : -Math.PI / 2);
        }
      }
      // One merged mesh per gallery, in its frame.
      if (parts.length) place(createNode({ geometry: M.merge(...parts), sightHidden: true }));
      parts.length = 0;
    });
  };
  // Each overview board as a prop: Space beside it, or a tap, opens the era's panel.
  const registerOverviews = () => {
    const EX = BL.genesisExhibits;
    for (const o of built.overviews) {
      const e = GW.ERAS[o.era], year = firstYear(e.years), def = EX && EX.eras[o.era];
      const mine = built.exhibitProps.filter((x) => x.era === o.era).sort((a, b) => EX.yearKey(a.def.year) - EX.yearKey(b.def.year) || a.order - b.order);
      const steps = built.trail.map((x) => `${x.step}. ${x.def.year} · ${x.def.title}${x.era === o.era ? " (this cave)" : ` (Era ${x.era})`}`);
      props.register({ id: `era${o.era}-overview`, era: o.era, year, title: `Era ${e.n} overview`, label: `ERA ${e.n} OVERVIEW · ${year}`, sourceKeys: ["whitepaper"], at: o.at, reach: 2.4,
        onUse: () => ({ board: { room: `Era ${e.n} - ${e.name} - ${e.years}`, sources: def && def.overview && def.overview.sourceKeys ? def.overview.sourceKeys : [], pages: [
          { caption: "This era", title: `${e.name} (${e.years})`, text: [def && def.overview ? def.overview.summary : "This cave's exhibits are still being built."] },
          ...(def && def.overview && def.overview.pages ? def.overview.pages : []),
          { caption: "Exhibits", title: "In this cave, by year", text: mine.length ? mine.map((x) => `${x.def.year} · ${x.def.title}${x.step ? ` · step ${x.step}` : ""}`) : ["No exhibits yet."] },
          { caption: "Steps toward Bitcoin", title: "The trail, in date order", text: [steps.length ? steps.join(" · ") : "No steps placed yet."] }
        ] } }) });
    }
  };
  // How many exhibits stand in an era (captions).
  const exhibitCount = (era) => built.exhibitProps.filter((x) => x.era === era).length;
  const registerProps = () => {
    props = GP.createRegistry();
    // The legend screen: Space beside it opens the museum's timeline menu.
    props.register({ id: "legend", era: 0, year: 1956, title: "The Genesis timeline", label: "THE GENESIS TIMELINE · 1956-2009", sourceKeys: [],
      at: { x: LEGEND.at.x, y: ISLAND_TOP, z: LEGEND.at.z }, reach: 3.4, onUse: () => ({ menu: true }) });
    const dos = GP.createDos({ year: 1993, files: GP.PC_FILES });
    props.register({ id: "pc", era: 3, year: 1993, title: "Tock's office PC", label: "OFFICE PC · 1993", sourceKeys: ["merkle1980", "haber1991", "bayer1993"], at: muAt(ROOM_ERA, PROPS.pc),
      onUse: () => ({ terminal: dos }) });
    // TODO: moves to Era 0's cave (1956) when its exhibits are built; it stands here until then.
    props.register({ id: "drives", era: 0, year: 1956, title: "Hard drives, 1956 and 2019", label: "HARD DRIVES · 1956 AND 2019", sourceKeys: GP.DRIVES.old.sourceKeys.concat(GP.DRIVES.now.sourceKeys), at: muAt(ROOM_ERA, PROPS.drives),
      onUse: () => ({ board: { room: "Hard drives: 1956 and 2019", pages: GP.drivePages(), sources: GP.DRIVES.old.sourceKeys.concat(GP.DRIVES.now.sourceKeys) } }) });
    const book = GP.createStampBook();
    built.stampBook = book;
    props.register({ id: "book", era: 3, year: 1991, title: "Tock's book", label: "TOCK'S BOOK · 1991", sourceKeys: ["haber1991"], at: muAt(ROOM_ERA, PROPS.book),
      onUse: () => ({ terminal: GP.stampTerminal(book) }) });
  };

  // --- The host: the one interface the workbench and the timeline menu use (OVERHAUL-CONTRACT.md, v1) --------------
  // The catalogue lists every exhibit once in date order; the workbench (genesis-workbench.js) shows one through a
  // clear stage on the exhibit's own world model, which the camera frames from the stage's place on screen; the menu
  // (genesis-timeline.js) opens one. While either is open the visitor's Ooga, the crew and the desk's show are held,
  // and only the open exhibit's era keeps running, so its model answers its commands.
  const bench = { open: false, entry: null, prop: null, term: null, board: null, era: -1, id: null,
    focus: { x: 0, z: 0 }, view: { eye: { x: 0, y: 0, z: 0 }, target: { x: 0, y: 0, z: 0 }, dist: 0 }, eased: false, framing: false,
    saved: { x: 0, y: 0, z: 0, tx: 0, ty: 0, tz: 0, fov: 0, near: 0, up: null, orthoMix: 0, orthoHeight: 0 }, opens: 0, runs: 0 };
  const PICK_SIZES = { pc: { w: 1.2, h: 1.4, d: 1.3 }, drives: { w: 1.1, h: 1.1, d: 1.1 }, book: { w: 0.7, h: 1.2, d: 0.8 } };
  const frameIn = { c: { x: 0, y: 0, z: 0 }, size: 1, toward: { x: 0, z: 1 }, ndc: { x: 0, y: 0 }, frac: 0.6, fov: 62, aspect: 1.6, fill: 0.62, pitch: 0.2 };
  let catalogue = null, workbench = null, timeline = null;
  // The exhibits the catalogue lists: every era file's props, Fingerprints and Time's two citations (its lectern) and
  // the scene's own PC, drives and book. The overview boards and the legend itself are not exhibits.
  const buildCatalogue = () => {
    const items = built.exhibitProps.map((e) => ({ id: e.prop.id, era: e.era, order: e.order, def: e.room ? { ...e.def, sourceKeys: e.def.id.endsWith("haber1991") ? ["haber1991"] : ["bayer1993"] } : e.def }));
    for (const id of ["pc", "drives", "book"]) { const p = props.get(id); items.push({ id, era: p.era, order: 1000 + items.length, def: p }); }
    catalogue = BL.genesisCatalogue.create({ items, eras: GW.ERAS, connections: BL.genesisExhibits.CONNECTIONS, sourceOf: GP.sourceOf, records: (BL.genesisTimelineData && BL.genesisTimelineData.records) || [] });
  };
  const propOf = (id) => props.get(id) || (built.exhibitProps.find((e) => e.prop.id === id) || {}).prop || null;
  // Where the camera stands to show an exhibit's model in the stage: its tap box is its model's box.
  const frameBench = (rect) => {
    const id = bench.id, at = bench.prop.at, room = /^era3-room-/.test(id);
    const node = room ? built.lectern : built.propNodes[id] || built[id], pick = room ? { w: 0.7, h: 1.1, d: 0.5 } : bench.entry && (propOf(id).pick || PICK_SIZES[id]) || { w: 1, h: 1.4, d: 1 };
    const c = frameIn.c;
    if (node && node.museumFrame !== undefined) { mu(node.museumFrame, node.position.x, node.position.z, c); c.y = node.position.y; }
    else if (node) { c.x = node.position.x; c.y = node.position.y; c.z = node.position.z; }
    else { c.x = at.x; c.y = (at.y || 0) + pick.h / 2; c.z = at.z; }
    frameIn.size = Math.max(pick.w, pick.h, pick.d, 0.8);
    frameIn.toward.x = at.x - c.x; frameIn.toward.z = at.z - c.z;
    if (Math.hypot(frameIn.toward.x, frameIn.toward.z) < 0.3) { frameIn.toward.x = 0.0001; frameIn.toward.z = 1; }
    const cr = overlayCanvas.getBoundingClientRect();
    frameIn.ndc.x = ((rect.left + rect.width / 2) - cr.left) / cr.width * 2 - 1;
    frameIn.ndc.y = 1 - ((rect.top + rect.height / 2) - cr.top) / cr.height * 2;
    frameIn.frac = Math.max(0.15, rect.height / cr.height);
    frameIn.aspect = cr.width / cr.height; frameIn.fov = bench.saved.fov || camera.fov;
    GW.frame(frameIn, bench.view);
    bench.focus.x = c.x; bench.focus.z = c.z;
  };
  const host = {
    get catalogue() { return catalogue; },
    get records() { return (BL.genesisTimelineData && BL.genesisTimelineData.records) || []; },
    view: { get calm() { return view.calm; }, get paused() { return view.paused; } },
    open(id, from = "walk") {
      const entry = catalogue && catalogue.get(id), prop = entry && propOf(id);
      if (!entry || !prop) return false;
      audio.wake();
      if (timeline && timeline.isOpen) timeline.close();
      if (!bench.open) {
        const s2 = bench.saved, cp = camera.position, ct = camera.target;
        s2.x = cp.x; s2.y = cp.y; s2.z = cp.z; s2.tx = ct.x; s2.ty = ct.y; s2.tz = ct.z;
        s2.fov = camera.fov; s2.near = camera.near; s2.up = camera.up || null; s2.orthoMix = camera.orthoMix || 0; s2.orthoHeight = camera.orthoHeight || 0;
        camera.up = null; camera.orthoMix = camera.orthoHeight = 0;
        pilot.setActive(false); hud.tooltip.hide(); hud.hideHint(); stopVoice();
        // The visitor's Ooga steps out of the picture, so it never stands between the camera and the model.
        if (avatar) { bench.avatarShown = avatar.root.visible; avatar.root.visible = false; }
      }
      bench.open = true; bench.id = id; bench.entry = entry; bench.prop = prop; bench.era = entry.era; bench.framing = false; bench.eased = false;
      bench.from = from; bench.opens++;
      if (!workbench.show(id)) { host.close(); return false; }
      return true;
    },
    session(id) {
      if (!bench.open || id !== bench.id) return null;
      const r = /^era3-room-/.test(id) ? { board: G.FINGERPRINTS } : props.use(bench.prop, propState) || {};
      bench.term = r.terminal || null; bench.board = r.board || null;
      return { entry: bench.entry, terminal: bench.term, board: bench.board ? { room: bench.board.room, pages: bench.board.pages, sources: bench.board.sources || [] } : null, caption: !bench.term && !bench.board && r.caption ? r.caption : null };
    },
    run(id, line) {
      if (!bench.open || id !== bench.id || !bench.term || !String(line).trim()) return null;
      audio.wake();
      let out;
      try { out = bench.term.run(line) || { lines: [] }; } catch (err) { out = { lines: [`That command did not run: ${err.message}`] }; }
      if (out.entry) { audio.cue("stamp"); hud.toast(`Page ${out.entry.page} stamped: ${out.entry.code}`); }
      if (!/^\s*(HELP|MORE)\s*$/i.test(line)) bench.runs++;
      return out;
    },
    stage(rect) {
      if (!bench.open) return;
      if (!rect || !rect.width || !rect.height) { bench.framing = false; return; }
      frameBench(rect); bench.framing = true;
    },
    // Close: the camera goes back exactly where it was and the walk resumes. With `there`, the Ooga is put at the
    // exhibit's walk-up spot instead (Take me there), and the pilot frames it there.
    close({ there = false } = {}) {
      if (!bench.open) return;
      const at = there && bench.prop ? bench.prop.at : null, focus = bench.focus;
      bench.open = false; bench.entry = bench.prop = bench.term = bench.board = null; bench.era = -1; bench.id = null; bench.framing = false;
      workbench.hide();
      const s2 = bench.saved;
      camera.position.x = s2.x; camera.position.y = s2.y; camera.position.z = s2.z; camera.target.x = s2.tx; camera.target.y = s2.ty; camera.target.z = s2.tz;
      camera.fov = s2.fov; camera.near = s2.near; camera.up = s2.up; camera.orthoMix = s2.orthoMix; camera.orthoHeight = s2.orthoHeight;
      if (avatar) avatar.root.visible = bench.avatarShown !== false;
      pilot.setActive(true);
      if (overlayCanvas.focus) overlayCanvas.focus({ preventScroll: true });
      if (at && avatar) {
        walkPose.position.x = at.x; walkPose.position.z = at.z; walkPose.position.y = footing.supportAt(at.x, at.z);
        walkPose.yaw = Math.atan2(focus.x - at.x, focus.z - at.z) - Math.PI;
        pilot.navigate(walkPose);
      }
    },
    menuClosed() { if (!bench.open) { view.reading = false; pilot.setActive(true); } },
    sourceOf: (key) => GP.sourceOf(key),
    cue: (name) => audio.cue(name),
    toast: (text) => hud.toast(text)
  };
  const openMenu = (focusId) => {
    if (bench.open) host.close();
    audio.wake();
    view.reading = true; view.readingPaused = false;
    pilot.setActive(false);
    timeline.open(focusId);
  };
  // Each frame while open: the camera eases (or, in Calm, cuts) to frame the model in the stage.
  const updateBench = (dt) => {
    if (!bench.framing) return;
    const v = bench.view, c = camera.position, t = camera.target, k = view.calm || !bench.eased ? 1 : Math.min(1, dt * 6);
    bench.eased = true;
    c.x += (v.eye.x - c.x) * k; c.y += (v.eye.y - c.y) * k; c.z += (v.eye.z - c.z) * k;
    t.x += (v.target.x - t.x) * k; t.y += (v.target.y - t.y) * k; t.z += (v.target.z - t.z) * k;
  };
  const openProp = (prop) => {
    audio.wake();
    if (prop.id === "legend") { openMenu(); return; }
    if (catalogue && catalogue.get(prop.id) && host.open(prop.id, "walk")) return;
    const r = props.use(prop, propState);
    if (r.board) openPanel(makeBoard(r.board));
    else if (r.caption) { captionKey = ""; setCaption(`prop-${prop.id}`, r.caption); }
  };

  // --- Walking ------------------------------------------------------------------------------------------------------
  // The visitor arrives on foot by the statue, facing into the museum, and walks as their own Ooga throughout.
  const arrive = (x = ENTRY.x, z = ENTRY.z, facing = ENTRY.facing) => {
    if (!avatar) { hud.toast("No Ooga to walk with here"); return false; }
    avatar.root.visible = true;
    Object.assign(avatar.root.position, { x, y: avatar.baseY + footing.supportAt(x, z), z });
    avatar.root.rotation.y = facing;
    walk.saved.fov = camera.fov; walk.saved.near = camera.near;
    pilot.setActive(true);
    if (!pilot.possess(avatar)) { pilot.setActive(false); return false; }
    // The hall is big enough to fly in: the Ooga wears a jetpack (hold Space in the air).
    if (!avatar.jetpackOwned) people.setJetpackOwnership(avatar, true, BL.hubModels.jetpack(), BL.hubModels.jetFlame());
    if (!avatar.jet) people.wearJetpack(avatar, BL.hubModels.jetpack(), BL.hubModels.jetFlame());
    walkPose.position.x = x; walkPose.position.y = footing.supportAt(x, z); walkPose.position.z = z;
    walkPose.yaw = facing - Math.PI;
    pilot.navigate(walkPose);
    walk.on = true; walk.prop = null;
    return true;
  };
  // Per frame while walking, allocation-free: the pilot and crew, the room's presence, a fall back to the entrance,
  // and the exhibit in reach with its hint.
  const updateWalk = (dt, elapsed) => {
    pilot.readInput(dt);
    people.update(dt, elapsed);
    pilot.update(dt);
    const driven = people.player;
    BL.net.setBody(driven ? driven.traits.name : null);
    if (driven) {
      const p = driven.root.position;
      BL.net.sendPose(p.x, p.y - driven.baseY, p.z, driven.root.rotation.y);
      BL.net.setHealth(driven.health.value, driven.health.stunned);
    }
    footsteps.update(driven);
    // Let go of (the room taking the Ooga back): take it up again where it stands.
    if (!driven) { if (avatar) arrive(avatar.root.position.x, avatar.root.position.z, avatar.root.rotation.y); return; }
    const p = driven.root.position, feet = p.y - driven.baseY;
    if (footing.fallen(feet)) {
      walk.falls++;
      walkPose.position.x = ENTRY.x; walkPose.position.z = ENTRY.z; walkPose.position.y = footing.supportAt(ENTRY.x, ENTRY.z);
      walkPose.yaw = ENTRY.facing - Math.PI;
      pilot.navigate(walkPose);
      return;
    }
    // The prompt: the exhibit in reach, by its own hint (genesis-exhibits.js), else its title and year.
    const near = props.near(p.x, p.z, feet);
    if (near !== walk.prop) {
      walk.prop = near;
      if (near) { hud.hint(`${COARSE ? "USE" : "Space"}: ${near.id === "legend" ? "open the museum's timeline" : near.hint || `${near.title} (${near.year})`}`, 600000); hud.setAct(near.id === "legend" ? "TIMELINE" : "OPEN"); }
      else { hud.hideHint(); pilot.showAct(); }
    }
  };
  // === End of walking and the workbench ====================================================================================

  // --- Panel ----------------------------------------------------------------------------------------------------
  const W = 960, H = 540;
  const wrap = (g, text, width) => {
    const words = text.split(" "), lines = [];
    let line = "";
    for (const w of words) {
      const next = line ? line + " " + w : w;
      if (g.measureText(next).width > width && line) { lines.push(line); line = w; } else line = next;
    }
    if (line) lines.push(line);
    return lines;
  };
  const paintPage = (canvas, page) => {
    const g = canvas.getContext("2d");
    g.fillStyle = "#16130f"; g.fillRect(0, 0, W, H);
    g.strokeStyle = "rgba(236,226,206,0.35)"; g.lineWidth = 3; g.strokeRect(10, 10, W - 20, H - 20);
    g.fillStyle = "#fbe3a4"; g.font = "bold 40px system-ui, sans-serif"; g.textBaseline = "top";
    g.fillText(page.title, 44, 38);
    g.fillStyle = "#efe8da"; g.font = "25px system-ui, sans-serif";
    let y = 104;
    for (const para of page.text) {
      for (const line of wrap(g, para, W - 88)) { g.fillText(line, 44, y); y += 33; }
      y += 14;
    }
  };
  // A panel of pages ({ room, pages, sources }): the exhibit's, or a prop's board.
  const makeBoard = (ex = G.FINGERPRINTS) => {
    const canvas = document.createElement("canvas");
    canvas.width = W; canvas.height = H;
    const b = {
      // The title is lettered from the sign alphabet (letters, digits, space and / : ! ? + - .); anything else is
      // turned into a dash or dropped.
      title: ex.room.replace(/[·–—]/g, "-").replace(/[^A-Za-z0-9 /:!?+\-.]/g, ""), help: "Arrows page · Escape closes and the walk carries on", canvas, count: ex.pages.length, index: 0,
      caption: ex.pages[0].caption, note: ex.pages[0].text.join(" "), version: 0, wide: true,
      links: ex.sources.map((k) => ({ href: GP.sourceOf(k).href, label: `${GP.sourceOf(k).label} ↗` })),
      go(i) {
        b.index = i; b.caption = ex.pages[i].caption; b.note = ex.pages[i].text.join(" ");
        paintPage(canvas, ex.pages[i]); b.version++;
      }
    };
    paintPage(canvas, ex.pages[0]);
    return b;
  };
  // Opening a panel holds the walk until it closes.
  const setPaused = (on) => {
    view.paused = !!on;
  };
  const openPanel = (panel) => {
    if (!hud || view.reading || bench.open) return;
    view.readingPaused = !view.paused;
    setPaused(true);
    view.reading = true;
    if (pilot) pilot.setActive(false);
    stopVoice();
    panel.go(0);
    hud.openBoard(panel);
    showControls();
  };
  const openInfo = () => openPanel(board);

  // --- Sound and voice --------------------------------------------------------------------------------------------
  // The museum's music and cues (genesis-audio.js): one context, built only from a gesture and through the page's
  // environment mute (M), closed on leave. `syncAudio` passes the visit's state on once a frame, only when it changes:
  // the music holds only for the visitor's own pause (P or the Pause button), never for a panel or workbench being
  // read; the boat's engine is gone, so it stays silent; Calm softens the rest. The entrance hall plays Era 0's theme.
  // Era 1's coupler and Era 4's DIAL make their own tones, so the scene never cues "modem".
  const sounds = { paused: null, engine: null, calm: null };
  const syncAudio = () => {
    // No boat any more: the engine stays silent. Music holds only for the visitor's own pause.
    const paused = view.paused && !(view.reading && view.readingPaused), engine = false;
    if (paused !== sounds.paused) { sounds.paused = paused; audio.setPaused(paused); }
    if (engine !== sounds.engine) { sounds.engine = engine; audio.setEngine(engine); }
    if (view.calm !== sounds.calm) { sounds.calm = view.calm; audio.setCalm(view.calm); }
  };
  const speech = typeof window.speechSynthesis !== "undefined" ? window.speechSynthesis : null;
  const stopVoice = () => { if (speech) speech.cancel(); };
  const say = (text) => {
    if (!view.voice || !speech || !text) return;
    speech.cancel();
    speech.speak(new SpeechSynthesisUtterance(text));
  };

  // --- HUD ------------------------------------------------------------------------------------------------------
  const setCaption = (key, custom = null) => {
    if (key === captionKey) return;
    captionKey = key;
    const text = custom || G.CAPTIONS[key] || "";
    el.caption.textContent = text;
    el.caption.hidden = !view.captions || !text;
    say(text);
  };
  const press = (button, on) => button && button.setAttribute("aria-pressed", String(!!on));
  const showControls = () => {
    el.pause.textContent = view.paused ? "Carry on" : "Pause";
    press(el.pause, view.paused);
    press(el.cc, view.captions); press(el.voice, view.voice); press(el.calm, view.calm);
    el.voice.hidden = !speech;
    el.caption.hidden = !view.captions || !el.caption.textContent;
  };
  const paintChain = () => {
    const codes = demo.broken ? built.codes.tampered : built.codes.honest;
    const items = el.chain.children;
    for (let i = 0; i < items.length; i++) {
      const shown = i < demo.tiles, bad = demo.broken && i >= G.TAMPER_AT;
      items[i].hidden = !shown;
      items[i].textContent = shown ? codes[i] : "";
      items[i].classList.toggle("broken", shown && bad);
    }
    el.chainWrap.hidden = demo.tiles === 0 || !view.captions;
  };
  const pause = () => {
    audio.wake();
    setPaused(!view.paused);
    // Carrying on takes the paused caption down with it (the next caption puts up its own).
    if (view.paused) { stopVoice(); setCaption("paused"); } else { captionKey = ""; el.caption.hidden = true; }
    showControls();
  };
  const toggle = (key) => {
    view[key] = !view[key];
    if (key === "voice" && !view.voice) stopVoice();
    if (key === "captions") paintChain();
    showControls();
  };
  const leave = () => go("hub");

  // Keys: the pilot has the walking keys (W A S D, Q E, Space, R and F to pitch the view), so the scene keeps only
  // its own: Escape (the pilot first, then leave), 0, I, C, T, P and G. A workbench or the menu takes every key while
  // open (its input keeps typing out of the walk); Escape closes it.
  const onKey = (e) => {
    if (bench.open || view.reading || e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (k === "Escape") { if (!pilot.escape()) leave(); }
    else if (k === "0") pilot.resetCamera();
    else if (k === "i") openInfo();
    else if (k === "c") toggle("captions");
    else if (k === "t") toggle("voice");
    else if (k === "p") { e.preventDefault(); pause(); }
    else if (k === "g") { e.preventDefault(); openMenu(); }
  };

  // --- Frame ----------------------------------------------------------------------------------------------------
  // The lamps nearest the visitor first, so a tier that keeps fewer keeps the ones in sight. Allocation-free.
  const lightOrder = new Int32Array(LIGHTS.length), lightDist = new Float32Array(LIGHTS.length);
  const orderLights = (px, pz) => {
    for (let i = 0; i < LIGHTS.length; i++) { const l = LIGHTS[i]; lightDist[i] = (l[0] - px) * (l[0] - px) + (l[2] - pz) * (l[2] - pz); lightOrder[i] = i; }
    for (let i = 1; i < LIGHTS.length; i++) { const v = lightOrder[i], d = lightDist[v]; let j = i - 1; while (j >= 0 && lightDist[lightOrder[j]] > d) { lightOrder[j + 1] = lightOrder[j]; j--; } lightOrder[j + 1] = v; }
    const n = renderOpts.lightCount;
    for (let i = 0; i < n; i++) { const l = LIGHTS[lightOrder[i]], o = i * 8; for (let k = 0; k < 7; k++) renderOpts.lights[o + k] = l[k]; renderOpts.lights[o + 7] = 0; }
  };
  const stepDemo = (dt) => {
    if (!view.paused && !view.reading) demo.update(dt);
    if (demo.stamps !== lastStamps) { lastStamps = demo.stamps; audio.cue("stamp"); }
    if (demo.tiles !== lastTiles || demo.broken !== lastBroken) {
      if (demo.tiles > lastTiles && demo.tiles > 0) audio.cue("link");
      if (demo.broken && !lastBroken) audio.cue("broken");
      lastTiles = demo.tiles; lastBroken = demo.broken;
      for (let i = 0; i < built.tiles.length; i++) {
        const shown = i < demo.tiles, bad = demo.broken && i >= G.TAMPER_AT;
        built.tiles[i].honest.visible = shown && !bad;
        built.tiles[i].tampered.visible = shown && bad;
        if (i > 0) { built.links[i - 1].ok.visible = shown && !(demo.broken && i > G.TAMPER_AT); built.links[i - 1].bad.visible = shown && demo.broken && i > G.TAMPER_AT; }
      }
      paintChain();
    }
    const p = demo.phase, t = demo.t, calm = view.calm;
    // The page slides to the machine, waits under the plunger and leaves as its fingerprint flies to the wall.
    const page = built.page.position;
    page.z = DESK.z - 0.8 + (p === "feed" ? (calm ? 1 : Math.min(1, t * 1.4)) * 1.4 : p === "stamp" ? 1.4 : -9);
    built.page.visible = p === "feed" || p === "stamp" || p === "tamper";
    if (p === "tamper") page.z = DESK.z - 0.2;
    built.redPage.visible = p === "tamper";
    built.plunger.position.y = DESK.y + 1.7 - (p === "stamp" ? Math.sin(Math.min(1, t * 1.6) * Math.PI) * 0.42 : 0);
    built.paperTile.visible = p === "publish" || p === "tamper" || p === "restore";
    const fly = p === "link" && !calm;
    built.flyer.visible = fly;
    if (fly) {
      const target = built.tiles[demo.page];
      const sx = DESK.x - 0.2, sy = DESK.y + 1.15, sz = DESK.z + 0.6, e = t * t * (3 - 2 * t);
      built.flyer.position.x = sx + (CHAIN.x + 0.1 - sx) * e;
      built.flyer.position.y = sy + (CHAIN.y - sy) * e + Math.sin(e * Math.PI) * 0.9;
      built.flyer.position.z = sz + (target.z - sz) * e;
    }
    const arm = built.guide.parts.armR;
    if (arm) arm.rotation.x = p === "stamp" ? -1.2 + Math.sin(Math.min(1, t * 1.6) * Math.PI) * 0.6 : p === "tamper" ? -0.4 : -0.15;
    // The desk narrates while the visitor stands near it.
    const nearDesk = walk.on && avatar && Math.hypot(avatar.root.position.x - DESK_AT.x, avatar.root.position.z - DESK_AT.z) < 9;
    if (nearDesk && !view.paused && p !== lastPhase) setCaption(p);
    lastPhase = p;
  };
  // The era the visitor stands in: its music and, on crossing into it, its caption.
  const updateEra = () => {
    const p = avatar ? avatar.root.position : ENTRY, era = MU.eraNear(p.x, p.z);
    if (era === lastEra) return;
    audio.setEra(Math.max(0, era));
    if (era >= 0 && lastEra !== -2) {
      const e = GW.ERAS[era], n = exhibitCount(era);
      setCaption(`era-${era}`, `Era ${e.n}: ${e.name} (${e.years}).${e.room ? " Fingerprints and Time is on the left." : ""} ${n ? `${n} exhibits in this gallery; Space by one opens its workbench.` : "Its exhibits are still being built."}`);
    }
    lastEra = era;
  };
  // What runs this frame (genesis-world.js holdsFor): an explicit pause holds everything, the scene's clock included,
  // so nothing jumps on resume; the timeline menu and the workbench hold the walk, the crew, the desk's show, era
  // changes and captions, and only an open, unpaused workbench keeps its own exhibit's era running.
  const HOLD = { time: true, exhibit: true, ambient: true, walk: true, era: true }, holdState = { paused: false, bench: false, menu: false };
  const update = (dt) => {
    holdState.paused = view.paused; holdState.bench = bench.open; holdState.menu = !!(timeline && timeline.isOpen);
    const h = GW.holdsFor(holdState, HOLD);
    if (h.time) sceneTime += dt;
    // A panel's dialog closing (its button, Escape or a press outside) hands the walk back as it was.
    if (view.reading && !hud.el.board.open && !holdState.menu) {
      view.reading = false;
      if (view.readingPaused) setPaused(false);
      if (!bench.open) pilot.setActive(true);
      captionKey = "";
      showControls();
    }
    if (h.era) updateEra();
    syncAudio();
    if (h.exhibit) updateExhibits(dt, sceneTime);
    // The workbench's camera keeps framing its model in the stage (not simulation: it settles on a resize too).
    if (bench.open) updateBench(dt);
    if (h.ambient) {
      stepDemo(dt);
      built.portal.glow = 1 + Math.sin(sceneTime * 1.3) * (view.calm ? 0 : 0.25);
      built.pcScreen.glow = 1 + (view.calm ? 0 : (Math.floor(sceneTime * 2) & 1) * 0.2);
    }
    if (h.walk) updateWalk(dt, sceneTime);
    const p = avatar ? avatar.root.position : ENTRY;
    renderOpts.shadowCenter.x = bench.open ? bench.focus.x : p.x; renderOpts.shadowCenter.z = bench.open ? bench.focus.z : p.z;
    orderLights(renderOpts.shadowCenter.x, renderOpts.shadowCenter.z);
    remotes.update(dt);
    fx.update(h.ambient ? dt : 0, sceneTime);
    hud.updateBoard(sceneTime);
  };
  const drawExtra = (g, project) => remotes.drawNames(g, project);
  const overlay = (dt) => fx.drawOverlay(dt, drawExtra);

  // --- Visit ----------------------------------------------------------------------------------------------------
  const tooltipFor = (hit) => !hit || bench.open ? "" : hit.owner.kind === "legend" ? "The Genesis timeline · tap for the museum's menu" : hit.owner.kind === "exhibit" ? "Fingerprints and Time (1991) · tap to read" : hit.owner.kind === "prop" ? `${hit.owner.prop.title} (${hit.owner.prop.year}) · tap to open its workbench` : hit.owner.kind === "guide" ? "Tock, the archivist Ooga (an invented guide)" : "";
  const enter = (ctx) => {
    ({ game, world, go } = ctx);
    overlayCanvas = ctx.overlay;
    BL.hud.leaveTo("genesis", "hub");
    root = createNode();
    camera = createCamera({ fov: 62, near: 0.15, far: 240 });
    built = { obstacles: [], oldObstacles: [] };
    // Each era's gallery frame: its old cave turned and moved round the atrium (genesis-world.js MUSEUM).
    built.frames = MU.bays.map((b) => place(createNode({ position: { x: b.tx, y: 0, z: b.tz }, rotation: { x: 0, y: b.rot, z: 0 } })));
    // The era files build first, so the galleries' boulders, the legend and the shared signage know them.
    buildMuseum(); buildCavern(); buildDesk();
    registerProps();
    buildExhibits(); buildCatalogue();
    buildGalleries(); buildLegend(); buildEraFrames(); buildTrail();
    registerOverviews();
    // The visit's footing: the floors and walls, plus whatever this visit's exhibits put in the way (each era's in
    // its old world, turned into the museum's).
    footing = GP.createFooting({ areas: FOOTING.areas, obstacles: FOOTING.obstacles.concat(built.obstacles, built.oldObstacles.map((o) => MU.boxToMuseum(o.era, o))) });
    buildProps();
    demo = G.createStampDemo();
    board = makeBoard();
    audio = BL.genesisAudio.create();
    sounds.paused = sounds.engine = sounds.calm = null;
    view.reading = view.readingPaused = false; view.paused = false; lastEra = -2;
    bench.open = false; bench.entry = bench.term = bench.board = null; bench.era = -1; bench.id = null; bench.framing = false; bench.opens = bench.runs = 0;
    view.calm = PREFERS_CALM.matches;
    sceneTime = 0; captionKey = ""; lastStamps = 0; lastPhase = ""; lastTiles = -1; lastBroken = false;
    renderOpts.lightCount = Math.min(LIGHTS.length, BL.glRenderer.POINT_LIGHT_CAPACITY);
    orderLights(ENTRY.x, ENTRY.z);
    hud = BL.hud.create({ signal: ctx.signal, roster: BL.contributors.activeRoster, catalog: M.SWAG, tierColors: M.TIER_COLORS, renderIcon: BL.hud.renderIcon, lootEnabled: false });
    const hooks = {};
    input = BL.interact.create({ canvas: ctx.canvas, renderer: ctx.renderer, camera, hooks });
    const target = (node, owner) => { input.add(node, owner); targets.push(node); };
    target(built.lectern, { kind: "exhibit", priority: 1 });
    target(built.lecternLight, { kind: "exhibit", priority: 1 });
    target(built.guide.parts.torso, { kind: "guide" });
    target(built.guide.parts.head, { kind: "guide" });
    target(built.legend, { kind: "legend", priority: 1 });
    for (const id of ["pc", "drives", "book"]) target(built[id], { kind: "prop", prop: props.get(id), priority: 1 });
    for (const id of Object.keys(built.propNodes)) target(built.propNodes[id], { kind: "prop", prop: props.get(id), priority: 1 });
    for (const o of built.overviews) target(o.pick, { kind: "prop", prop: props.get(`era${o.era}-overview`), priority: 1 });
    // Walking: the pilot and crew for the visitor's Ooga (as the arcade's are).
    const viewFov = camera.fov;
    // The camera and its target keep inside the museum: the atrium or a gallery, under the roof. A point outside
    // goes to the nearest point of the room it is nearest.
    const keepInside = (p, pad) => {
      if (MU.inside(p.x, p.z, -pad)) return;
      let bx = p.x, bz = p.z, best = Infinity;
      for (const r of [MU.atrium, ...MU.rects]) {
        const x = clamp(p.x, r.x0 + pad, r.x1 - pad), z = clamp(p.z, r.z0 + pad, r.z1 - pad), d = (x - p.x) ** 2 + (z - p.z) ** 2;
        if (d < best) { best = d; bx = x; bz = z; }
      }
      p.x = bx; p.z = bz;
    };
    const clampTarget = (p) => { keepInside(p, 0.2); p.y = clamp(p.y, 0.3, ROOF - 1); };
    const clampCamera = (p) => { keepInside(p, 0.4); p.y = clamp(p.y, 0.4, ROOF - 0.6); };
    pilot = BL.pilot.create({
      renderer: ctx.renderer, canvas: ctx.canvas, camera, hud, presets: WALK_PRESETS, landing: "dock", pitch: [-0.2, 1.2], dist: [2.5, 12],
      follow: { y: 0.9, min: 2.5, max: 6, pitch: [0.2, 0.8] }, fly: { speed: 6, perDist: 0.3, climb: 4, yMax: 22 }, clampTarget, clampCamera,
      ceilingAt: () => ROOF - 0.6, coarse: COARSE, mayPossess,
      close: { eyeHeight: 1.1, eyeRatio: 0.95, eyeForward: 0.16, pitch: [-1.35, 1.35], trailingDist: 4, orbitDist: 5, maxStep: 0.6, groundAt: (x, z) => footing.supportAt(x, z, feetOf()) }
    });
    camera.fov = viewFov;
    fx = BL.fx.create({ root, renderer: ctx.renderer, camera, overlay: ctx.overlay, tickerAt: { x: -1, y: 5, z: -10 }, hud });
    // The visitor's Ooga: the one the portal brought (`world.pilot`), `character=` on a page that opens here, else the
    // roster's default pick, under the island's driving rules.
    arrivedPilot = world.pilot;
    world.pilot = null;
    const asked = ctx.from === null ? new URLSearchParams(location.search).get("character")?.trim().toLowerCase() : null;
    const named = asked ? BL.contributors.roster.find((c) => c.name.toLowerCase() === asked) : null;
    const wanted = named ? named.name : arrivedPilot;
    const wantedEntry = wanted && BL.contributors.roster.find((c) => c.name === wanted);
    playerName = wantedEntry && mayPick(wantedEntry) ? wanted : BL.contributors.activeRoster.find(mayPick)?.name || null;
    if (playerName) {
      const shared = { root, input, hud, game, world: { level: 0, weapons: new Map(), magazine: { owned: false, count: 0, ammo: 0, carrier: null } }, playerName, fx, viewYaw: 0,
        outsideActors: () => remotes ? remotes.actors() : NO_ACTORS, outsideActorHeight: BL.remotePlayers.BODY_HEIGHT, groundAt: groundFor, walkable: walkableFor, useNear };
      people = shared.crew = BL.crew.create(shared);
      pilot.bind(shared);
      avatar = people.cavemen.get(playerName);
      // Empty-handed, as in the arcade: no rifle, no aiming.
      avatar.weapon.secondaryOwned = false;
      people.selectWeapon(0, avatar);
      avatar.weapon.aiming = false;
      avatar.parts.gun.visible = false;
      avatar.root.visible = false;
    }
    pilot.setActive(false);
    remotes = BL.remotePlayers.create({ root, crew: people, fx });
    footsteps = BL.footsteps.create();
    walk.on = false; walk.prop = null; walk.falls = 0;
    propState.uses = 0; propState.last = "";
    // Taps open what they hit (a workbench straight away: no need to walk up); while a workbench is open the clear
    // stage passes no taps or drags to the hall behind it.
    Object.assign(hooks, {
      onHover: (hit, p) => { const t = tooltipFor(hit); if (t) hud.tooltip.show(t, p.x, p.y); else hud.tooltip.hide(); },
      onHoverMove: (hit, p) => { const t = tooltipFor(hit); if (t) hud.tooltip.show(t, p.x, p.y); else hud.tooltip.hide(); },
      onTap: (hit) => {
        audio.wake();
        if (bench.open || view.reading) return;
        if (hit && hit.owner.kind === "exhibit") openInfo();
        else if (hit && hit.owner.kind === "legend") openMenu();
        else if (hit && hit.owner.kind === "prop") openProp(hit.owner.prop);
      },
      hoverIgnore: () => bench.open ? null : pilot.hooks.hoverIgnore(),
      onOrbit: (dx, dy) => { if (!bench.open) pilot.hooks.onOrbit(dx, dy); },
      onZoom: (factor, gesture, px, py) => { if (!bench.open) pilot.hooks.onZoom(factor, gesture, px, py); },
      onDoubleTap: (hit) => { if (!bench.open) pilot.hooks.onDoubleTap(hit); }
    });
    hud.onAction((action) => {
      audio.wake();
      if (action === "genesis-pause") pause();
      else if (action === "genesis-menu") openMenu();
      else if (action === "genesis-info") openInfo();
      else if (action === "genesis-cc") toggle("captions");
      else if (action === "genesis-voice") toggle("voice");
      else if (action === "genesis-calm") toggle("calm");
      else if (action === "reset-view" && !bench.open) pilot.resetCamera();
      else if (action === "leave") leave();
    });
    for (const id of ["caption", "pause", "info", "cc", "voice", "calm", "chain", "chainWrap"]) el[id] = document.getElementById(`genesis-${id === "chainWrap" ? "chain-wrap" : id}`);
    el.chain.replaceChildren(...G.PAGES.map(() => { const li = document.createElement("li"); li.hidden = true; return li; }));
    el.help = document.getElementById("genesis-help");
    el.help.textContent = COARSE ? "Stick walks · OPEN by an exhibit, or tap it · Timeline for every invention" : "W A S D walk · Space by an exhibit (or a tap) opens its workbench · G or Timeline: every invention · P pause · I info · C captions · Calm · Esc leave";
    // The workbench and the timeline menu (their own modules, on the host).
    workbench = BL.genesisWorkbench.create(host, document.getElementById("genesis-bench"));
    timeline = BL.genesisTimeline.create(host, document.getElementById("genesis-menu"));
    window.addEventListener("resize", () => { if (bench.open) { bench.eased = false; workbench.resize(); } }, { signal: ctx.signal });
    window.addEventListener("pointerdown", audio.wake, { signal: ctx.signal });
    window.addEventListener("keydown", audio.wake, { signal: ctx.signal });
    setCaption("arrive-museum", "The Genesis museum: the ideas that came before Bitcoin, in galleries round this hall in date order, clockwise from your left. The white timeline ahead lists every invention (or press G). Walk up to any exhibit and press Space, or tap it, to open its workbench.");
    paintChain();
    showControls();
    hud.setStats(game.state);
    arrive();
    Object.assign(scene, { root, camera, input, debug: { get demo() { return demo; }, view, built, board, openInfo, toggle, walk, footing, props, pilot, get avatar() { return avatar; },
      openProp, pause, bench, host, get catalogue() { return catalogue; }, get workbench() { return workbench; }, get timeline() { return timeline; },
      openBench: (prop) => host.open(prop.id, "debug"), closeBench: (there) => host.close({ there }), showBench: (i) => host.open(catalogue.entries[(i + catalogue.entries.length) % catalogue.entries.length].id, "debug"),
      runBench: (line) => workbench.run(line), benchList: () => catalogue.entries.map((e) => ({ def: { ...e, year: e.year }, era: e.era, prop: propOf(e.id) })), openMenu, get exhibits() { return built.exhibitProps; }, get trail() { return built.trail; }, get audio() { return audio; }, sounds } });
  };
  const onDonation = (donation, counted = null) => {
    game.recordDonation(donation, counted && counted.exact);
    const bananas = BL.game.bananasFor(donation.sats), shown = counted ? counted.rounded : bananas;
    world.level = Math.min(BL.pile.MAX_BANANAS, world.level + (counted ? counted.exact : bananas));
    hud.toast(`+${BL.game.formatLarge(donation.sats)} sats · ${BL.game.formatLarge(shown)} banana${shown === 1 ? "" : "s"} · ${donation.handle ? "@" + donation.handle : "anon"}`);
    hud.setStats(game.state);
  };
  const leaveScene = () => {
    stopVoice();
    host.close();
    if (workbench) workbench.dispose();
    if (timeline) timeline.dispose();
    workbench = timeline = catalogue = null;
    if (view.reading) hud.closeBoard();
    disposeExhibits();
    // The Ooga that came in (or the one walked here) goes back out to the island as itself.
    world.pilot = arrivedPilot || playerName || null;
    walk.on = false; walk.prop = null;
    BL.net.setBody(null);
    audio.dispose();
    remotes.dispose();
    footsteps.dispose();
    if (people) people.dispose();
    fx.dispose();
    pilot.dispose();
    for (const node of targets) input.remove(node);
    targets.length = 0;
    const count = input.targetCount;
    input.dispose();
    hud.tooltip.hide();
    hud.dispose();
    while (root.children.length) removeChild(root, root.children[0]);
    el.caption.textContent = ""; el.chain.replaceChildren();
    for (const key of Object.keys(el)) el[key] = null;
    view.reading = false;
    demo = board = audio = built = input = hud = game = world = go = overlayCanvas = null;
    pilot = people = avatar = fx = footsteps = remotes = footing = props = playerName = arrivedPilot = null;
    scene.input = scene.debug = null;
    return { targets: count };
  };
  const stats = () => {
    let nodes = 0;
    const all = (n) => { nodes++; for (const c of n.children) all(c); };
    all(root);
    const p = avatar ? avatar.root.position : ENTRY;
    return { allNodes: nodes, targets: input.targetCount, era: MU.eraNear(p.x, p.z), bench: bench.open ? bench.id : null, opens: bench.opens, runs: bench.runs,
      demo: demo.phase, paused: view.paused, reading: view.reading,
      walking: walk.on, falls: walk.falls, uses: propState.uses, fx: fx.stats ? fx.stats() : null, crew: people ? people.stats() : null };
  };
  const scene = BL.deferred.scene("genesis", {
    id: "genesis", wip: true, renderOpts, root: null, camera: null, input: null, debug: null,
    enter, update, overlay, onDonation, onKey, onLootCleared: () => {}, leave: leaveScene, stats,
    voiceZone: "genesis.voyage",
    liveGeometry: (set) => {
      if (built && built.guide) set.add(built.guide.headOpen).add(built.guide.headClosed);
      if (avatar) set.add(avatar.headOpen).add(avatar.headClosed);
      if (remotes) remotes.liveGeometry(set);
    },
    get inMotion() { return !!demo && walk.on; }
  });
})();
