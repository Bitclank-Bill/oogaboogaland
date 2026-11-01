// The Genesis Voyage (work in progress, `?wip=genesis`): one museum cave of the ideas that came before Bitcoin.
// From the entrance hall (the whitepaper stone's portal lands here) the visitor walks, as their own Ooga, through a
// short corridor into one long hall: the eras one after another down both walls in date order, each with its sign
// hung over the promenade where it begins, the promenade open down the middle (genesis-world.js keeps every era's
// coordinates). Era 3's part holds Fingerprints and Time, where Tock the archivist Ooga runs a stamp desk: pages are
// fingerprinted, each stamp links to the last, the newest is published, and a changed page breaks every link after
// it. The rules, words and sources are in genesis-voyage.js.
//
// Walking is the pilot and crew, as the arcade and factory scenes do. Space by an exhibit, or a tap on it, opens its
// workbench (genesis-bench.js): the exhibit's own model live in a clear stage on the left, framed by the camera, with
// its command input, Run, Reset and its actions under it, and its story, how to use it and its sources on the right;
// Previous and Next walk the exhibits in date order; Close (or Escape) returns to where the visitor stood. The white
// timeline screen in the entrance hall (and the Timeline button, or G) opens the museum's menu: every exhibit by date
// and by how it connects, each opening its workbench. P pauses, R (or Calm) holds decorative motion, M mutes.
(() => {
  "use strict";
  const BL = window.BL = window.BL || {};
  const G = BL.genesisVoyage, M = BL.models, GP = BL.genesisProps, GW = BL.genesisWorld, GN = BL.genesisBench;
  const { createNode, addChild, removeChild, createCamera } = BL.scene;
  const { clamp } = BL.math;
  const COARSE = window.matchMedia("(pointer: coarse)").matches;
  const PREFERS_CALM = window.matchMedia("(prefers-reduced-motion: reduce)");

  // Fingerprints and Time was laid out in the old cavern's coordinates; SZ moves it (and its ledges, props and
  // lights) onto Era 3's cave, along its left bank.
  const SX = GW.ROOM_SHIFT.x, SZ = GW.ROOM_SHIFT.z, ROOM_ERA = GW.ROOM_ERA;
  const DESK = { x: -7.2 + SX, y: 0.55, z: -25.2 + SZ }, CHAIN = { x: -10.55 + SX, y: 3.7, z0: -21.6 + SZ, step: 1.75 }, PAPER = { x: -10.5 + SX, y: 2.2, z: -31.6 + SZ };
  const ROOM_Z = GW.MOUTH_Z;
  const ISLAND_TOP = GW.BANK_TOP;
  const TILE_COLORS = (codes) => codes.map((c) => "#" + c.slice(0, 6));

  // Underground: a dim cave light, lamps doing the work; the shadow box follows the visitor.
  const renderOpts = { clear: [0.04, 0.05, 0.06], sky: [0.34, 0.37, 0.42], ground: [0.16, 0.15, 0.13],
    direct: [0.72, 0.7, 0.66], directStrength: 0.3, ambientFloor: 0.52, sun: { x: 0.25, y: 1, z: 0.35 },
    shadowCenter: { x: 0, y: 0, z: 0 }, shadowExtent: 34, bloomStrength: 0.35,
    lights: new Float32Array(BL.glRenderer.POINT_LIGHT_CAPACITY * 8), lightCount: 0 };
  // The harbour's lamps, the desk and the newspaper, then three lamps in each cave in its era's colour.
  const CAVE_LAMPS = [[-14, 0.25], [22, 0.5], [-8, 0.8]];
  const LIGHTS = [[-4, 3.2, 3, 11, 1.25, 0.95, 0.6], [4, 3.2, -2, 10, 1.1, 0.85, 0.55],
    [-6.5 + SX, 3.4, -25 + SZ, 12, 1.35, 1.05, 0.7], [-9 + SX, 3.2, -31.5 + SZ, 7, 1, 0.9, 0.7],
    ...GW.ERAS.flatMap((e) => CAVE_LAMPS.map(([x, f]) => [x, 9, e.z1 - f * GW.CAVE.len, 34, ...e.theme.lamp]))];

  // --- Walking: where an Ooga may stand ----------------------------------------------------------------------------
  // The museum is one floor at bank height: the entrance hall (the old harbour), the short corridor in, and the hall,
  // the eras one after another down both long walls with the promenade (where the stream ran) open down the middle.
  // The statue, the room's desk and the newspaper stand in the way, as do the walls.
  const { CHANNEL } = GW;
  // Where the visitor arrives, by the statue, facing into the museum (a fall out of bounds comes back here too).
  const ENTRY = { x: GW.LANE_X, z: 3.5, facing: Math.PI };
  const FOOTING = {
    areas: [
      { id: "room", x0: -12, x1: -7.6, z0: -34, z1: -19, top: 0.545, dock: { x: -6, z: -26.6, facing: Math.PI / 2 } },
      { id: "step", x0: -7.6, x1: -5, z0: -27.7, z1: -22.7, top: 0.545, dock: { x: -6, z: -26.6, facing: Math.PI / 2 } }
    ],
    obstacles: [{ x0: -5.6, x1: -2.8, z0: 6.15, z1: 7.05 }, { x0: -8.5, x1: -5.9, z0: -25.9, z1: -24.5 }, { x0: -10.6, x1: -10.4, z0: -33.1, z1: -30.1 },
      { x0: -10.2, x1: -9, z0: -21.2, z1: -20 }, { x0: -10.3, x1: -9.3, z0: -32.9, z1: -31.9 }, { x0: -6.2, x1: -5.4, z0: -24, z1: -23.2 }]
  };
  // The room's ledges and obstacles move with it to Era 3's part of the hall.
  for (const a of FOOTING.areas) { a.x0 += SX; a.x1 += SX; a.z0 += SZ; a.z1 += SZ; if (a.dock) a.dock = { ...a.dock, x: a.dock.x + SX, z: a.dock.z + SZ }; }
  for (let i = 1; i < FOOTING.obstacles.length; i++) { const o = FOOTING.obstacles[i]; o.x0 += SX; o.x1 += SX; o.z0 += SZ; o.z1 += SZ; }
  {
    const C = GW.CAVE, H = GW.HARBOUR, first = GW.ERAS[0].z1, last = GW.END_Z, dock = { x: ENTRY.x, z: ENTRY.z, facing: ENTRY.facing };
    FOOTING.areas.push({ id: "entrance", x0: H.x0, x1: H.x1, z0: GW.MOUTH_Z - 0.6, z1: H.z1, top: ISLAND_TOP, dock },
      { id: "corridor", x0: CHANNEL.x0, x1: CHANNEL.x1, z0: first - 0.5, z1: GW.MOUTH_Z, top: ISLAND_TOP, dock },
      { id: "hall", x0: C.x0, x1: C.x1, z0: last, z1: first, top: ISLAND_TOP, dock });
    // The hall's walls and end, the corridor's rock, and the entrance hall's walls either side of its way in.
    FOOTING.obstacles.push({ x0: C.x0 - 6, x1: C.x0, z0: last - 6, z1: first + 2 }, { x0: C.x1, x1: C.x1 + 6, z0: last - 6, z1: first + 2 },
      { x0: C.x0 - 6, x1: C.x1 + 6, z0: last - 6, z1: last },
      { x0: C.x0, x1: CHANNEL.x0 - 0.05, z0: first, z1: GW.MOUTH_Z - 0.6 }, { x0: CHANNEL.x1 + 0.05, x1: C.x1, z0: first, z1: GW.MOUTH_Z - 0.6 },
      { x0: -16, x1: -12, z0: GW.MOUTH_Z - 1, z1: 12 }, { x0: 10, x1: 16, z0: GW.MOUTH_Z - 1, z1: 12 }, { x0: -16, x1: 16, z0: 9, z1: 12 },
      { x0: -16, x1: H.mouth.x0, z0: GW.MOUTH_Z - 0.6, z1: GW.MOUTH_Z + 0.6 }, { x0: H.mouth.x1, x1: 16, z0: GW.MOUTH_Z - 0.6, z1: GW.MOUTH_Z + 0.6 });
  }
  // The first props, on the room's ledge: the office PC, the hard-drive plinth and Tock's book by the desk.
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
  const place = (node) => { addChild(root, node); return node; };
  // A tap box: a node the picker sees (it skips hidden nodes) with a box's corners and no faces, so nothing draws.
  const pickBox = (w, h, d) => ({ verts: [-w / 2, -h / 2, -d / 2, w / 2, -h / 2, -d / 2, w / 2, h / 2, -d / 2, -w / 2, h / 2, -d / 2, -w / 2, -h / 2, d / 2, w / 2, -h / 2, d / 2, w / 2, h / 2, d / 2, -w / 2, h / 2, d / 2], faces: [], lines: [], castShadow: false });
  const solid = (w, h, d, color, x, y, z, emissive = 0) => place(createNode({ geometry: M.box({ w, h, d, color, emissive }), position: { x, y, z } }));
  const buildCavern = () => {
    // The entrance hall: a stone floor at the museum's level, walls and roof, its front wall open onto the corridor in.
    solid(24, 0.6, 19.4, "#4a453e", -1, ISLAND_TOP - 0.3, 0.3);
    for (const [w, d, x, z] of [[1.2, 19.8, -12.6, 0.3], [1.2, 19.8, 10.6, 0.3], [26, 1.2, -1, 9.6]]) solid(w, 7, d, "#3a3530", x, 3.4, z);
    solid(26, 0.6, 19.8, "#2a2622", -1, 7.1, 0.3);
    solid(14, 7, 1.2, "#3a3530", -6.5, 3.4, ROOM_Z);
    solid(5, 7, 1.2, "#3a3530", 9.5, 3.4, ROOM_Z);
    solid(6.5, 2.2, 1.2, "#3a3530", 3.75, 5.8, ROOM_Z);
    // The dock, the harbour's lanterns and the statue the visitor came through.
    const statue = place(createNode({ position: { x: -4.2, y: ISLAND_TOP, z: 6.6 } }));
    addChild(statue, createNode({ geometry: M.bevelBox({ w: 2.2, h: 3.1, d: 0.4, color: "#ece6d6" }), position: { x: 0, y: 1.9, z: 0 } }));
    addChild(statue, createNode({ geometry: M.box({ w: 1.5, h: 2.3, d: 0.06, color: "#9ad8ff", emissive: 0.9 }), position: { x: 0, y: 1.75, z: -0.23 } }));
    addChild(statue, createNode({ geometry: M.box({ w: 2.8, h: 0.35, d: 0.9, color: "#8a8174" }), position: { x: 0, y: 0.17, z: 0 } }));
    built.portal = statue.children[1];
    for (const [x, z] of [[-1.6, -1.8], [-6.6, -1.8], [-6.6, 6], [7.5, 2], [7.5, -6]]) {
      solid(0.14, 2.4, 0.14, "#3b2a1a", x, ISLAND_TOP + 1.2, z);
      solid(0.36, 0.36, 0.36, "#ffcf7a", x, ISLAND_TOP + 2.55, z, 1.4);
    }
    // The room's ledge, the desk, the chain wall and the newspaper, on Era 3's left bank.
    solid(4.6, 0.55, 15, "#4a4038", -9.9 + SX, 0.27, -26.5 + SZ);
    solid(2.6, 0.55, 5, "#4a4038", -6.3 + SX, 0.27, -25.2 + SZ);
    const label = BL.factoryModels.label;
    const roomSign = label("FINGERPRINTS AND TIME · 1991", "Era 3 · Cypherpunks and Timestamps", { height: 1.4, style: "gold" });
    const sign = place(createNode({ position: { x: CHAIN.x - 0.4, y: 6.2, z: -26.5 + SZ }, rotation: { x: 0, y: Math.PI / 2, z: 0 } }));
    addChild(sign, createNode({ geometry: roomSign.back }), createNode({ geometry: roomSign.face }));
    const harbourSign = label("THE GENESIS VOYAGE", "Before the first block · 1956 to 2009", { height: 1.4, style: "gold" });
    const hs = place(createNode({ position: { x: -5.5, y: 5.2, z: ROOM_Z + 0.65 }, rotation: { x: 0, y: Math.PI, z: 0 } }));
    addChild(hs, createNode({ geometry: harbourSign.back }), createNode({ geometry: harbourSign.face }));
    const paperSign = label("THE DAILY OOGA", "widely publish the fingerprint · 1991", { height: 0.9, style: "plain" });
    const ps = place(createNode({ position: { x: PAPER.x + 0.05, y: PAPER.y + 1.25, z: PAPER.z }, rotation: { x: 0, y: Math.PI / 2, z: 0 } }));
    addChild(ps, createNode({ geometry: paperSign.back }), createNode({ geometry: paperSign.face }));
    solid(0.12, 1.8, 3, "#e9e1cc", PAPER.x, PAPER.y, PAPER.z);
    built.paperTile = place(createNode({ geometry: M.box({ w: 0.1, h: 0.7, d: 1.4, color: "#ffffff", emissive: 1 }), position: { x: PAPER.x + 0.1, y: PAPER.y, z: PAPER.z }, visible: false }));
  };
  const buildDesk = () => {
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
  };
  // The promenade, where the stream ran: polished stone at the floor's level down the corridor and the middle of the
  // hall, with a thin gold line along each edge (a slab per era and one across each join, so no two lie on top of one
  // another), and the joins between eras floored across the hall's whole width.
  const buildFloor = () => {
    const C = GW.CAVE, w = CHANNEL.x1 - CHANNEL.x0, first = GW.ERAS[0].z1;
    const slab = (x0, x1, z0, z1, color) => solid(x1 - x0, 1.15, z1 - z0, color, (x0 + x1) / 2, ISLAND_TOP - 0.575, (z0 + z1) / 2);
    slab(CHANNEL.x0, CHANNEL.x1, first, GW.MOUTH_Z - 0.6, "#5d5850");
    for (let i = 0; i < GW.ERAS.length; i++) {
      const e = GW.ERAS[i];
      slab(CHANNEL.x0, CHANNEL.x1, e.z0, e.z1, "#5d5850");
      if (i < GW.ERAS.length - 1) slab(C.x0, C.x1, GW.ERAS[i + 1].z1, e.z0, "#4c4740");
    }
    const lines = [];
    for (const x of [CHANNEL.x0 + 0.15, CHANNEL.x1 - 0.15]) lines.push(M.moved(M.box({ w: 0.08, h: 0.02, d: first - GW.END_Z, color: "#e8c35a", emissive: 0.6 }), x, ISLAND_TOP + 0.01, (first + GW.END_Z) / 2));
    place(createNode({ geometry: M.merge(...lines), sightHidden: true }));
    void w;
  };
  // One hall: each era's stretch of floor either side of the promenade, walls and roof in its colours, the joins
  // between eras walled and roofed in plain stone, the corridor's rock wall at the near end and the last era's wall
  // closing the far end. Each era's sign hangs over the promenade where the next begins (genesis-world.js e.sign),
  // facing the visitor walking down the hall, in its era's signage; the last era's is on the end wall.
  const buildCaves = () => {
    const C = GW.CAVE, H = C.height, gap = GW.TUNNEL_HEIGHT;
    // Whether a boulder of radius r at (x, z) in era n would sit in a reserved plot or on an exhibit's obstacle.
    const clutter = (n, x, z, r) => {
      const hit = (b) => x + r > b.x0 && x - r < b.x1 && z + r > b.z0 && z - r < b.z1;
      return GW.reservedZones(n).some(hit) || built.obstacles.some(hit);
    };
    const across = (z, color, closed) => {
      if (closed) { solid(C.x1 - C.x0, H, 1, color, (C.x0 + C.x1) / 2, H / 2, z); return; }
      solid(CHANNEL.x0 - C.x0, H, 1, color, (C.x0 + CHANNEL.x0) / 2, H / 2, z);
      solid(C.x1 - CHANNEL.x1, H, 1, color, (CHANNEL.x1 + C.x1) / 2, H / 2, z);
      solid(CHANNEL.x1 - CHANNEL.x0, H - gap, 1, color, GW.LANE_X, gap + (H - gap) / 2, z);
    };
    const tunnel = (z1, z0) => {
      const len = z1 - z0, mid = (z0 + z1) / 2;
      for (const x of [CHANNEL.x0 - 0.5, CHANNEL.x1 + 0.5]) solid(1, gap + 0.4, len, "#3a3530", x, gap / 2, mid);
      solid(CHANNEL.x1 - CHANNEL.x0 + 2, 0.6, len, "#2a2622", GW.LANE_X, gap + 0.3, mid);
    };
    tunnel(GW.MOUTH_Z - 0.6, GW.ERAS[0].z1);
    built.caves = [];
    GW.ERAS.forEach((e, i) => {
      const t = e.theme, len = C.len, mid = e.z;
      for (const bank of e.banks) {
        solid(bank.x1 - bank.x0, 1.15, len, t.bank, (bank.x0 + bank.x1) / 2, ISLAND_TOP - 0.575, mid);
      }
      for (const x of [C.x0 - 0.5, C.x1 + 0.5]) solid(1, H, len, t.rock, x, H / 2, mid);
      solid(C.x1 - C.x0 + 2, 0.8, len, t.rock, (C.x0 + C.x1) / 2, H + 0.4, mid);
      if (i === 0) across(e.z1, t.rock, false);
      if (i === GW.ERAS.length - 1) across(e.z0, t.rock, true);
      else {
        // The join to the next era: plain stone walls and roof, and the sign hung from the roof on two chains.
        const z1 = e.z0, z0 = GW.ERAS[i + 1].z1, jm = (z0 + z1) / 2, jl = z1 - z0;
        for (const x of [C.x0 - 0.5, C.x1 + 0.5]) solid(1, H, jl, "#3a3530", x, H / 2, jm);
        solid(C.x1 - C.x0 + 2, 0.8, jl, "#2a2622", (C.x0 + C.x1) / 2, H + 0.4, jm);
        for (const dx of [-4.5, 4.5]) solid(0.08, H - e.sign.y - e.sign.height / 2, 0.08, "#2a2622", e.sign.x + dx, (H + e.sign.y + e.sign.height / 2) / 2, e.sign.z);
      }
      // Hanging rocks and boulders, so the roof is not a lid and the banks are worth walking; glowing seams in the
      // era's colour light the walls.
      const rand = BL.math.mulberry32(31 + i), w = C.x1 - C.x0, glow = glowHex(t.lamp);
      for (let k = 0; k < 14; k++) {
        const h = 2 + rand() * 6;
        solid(1.5 + rand() * 3, h, 1.5 + rand() * 3, t.rock, C.x0 + 2 + rand() * (w - 4), H - h / 2, e.z1 - 3 - rand() * (len - 6));
      }
      for (let k = 0; k < 10; k++) {
        const left = rand() < 0.5, x = left ? C.x0 + 2 + rand() * (CHANNEL.x0 - C.x0 - 6) : CHANNEL.x1 + 4 + rand() * (C.x1 - CHANNEL.x1 - 6);
        const s = 0.8 + rand() * 2.2, z = e.z1 - 4 - rand() * (len - 8), r = s * 0.7 + 0.5;
        // Boulders keep off the exhibits, the gateway, the docks, the lamps and the trail's walk.
        if (Math.abs(x - (x < GW.LANE_X ? CHANNEL.x0 : CHANNEL.x1)) < GW.BANK.FRONT + r || clutter(i, x, z, r)) continue;
        solid(s * 1.3, s, s, t.rock, x, ISLAND_TOP + s / 2, z);
      }
      for (let k = 0; k < 12; k++) {
        const left = k % 2 === 0, z = e.z1 - 4 - (k >> 1) * (len - 8) / 5, y = 3 + rand() * (H - 8);
        solid(0.12, 0.4 + rand() * 0.6, 3 + rand() * 6, glow, left ? C.x0 + 0.06 : C.x1 - 0.06, y, z, 1.3);
      }
      // The era's big sign, in its era's own signage.
      const sign = eraSign(e);
      hangSign(sign, e.sign.x, e.sign.y, e.sign.z, 0, sign.frame);
      // Lamp posts on the banks, where the cave's lights hang.
      for (const l of GW.lampPosts(i)) {
        solid(0.3, 8.6, 0.3, "#3b2a1a", l.x, ISLAND_TOP + 4.3, l.z);
        solid(0.9, 0.9, 0.9, "#ffcf7a", l.x, ISLAND_TOP + 8.9, l.z, 1.5);
      }
      built.caves.push(e);
    });
  };
  // The museum's legend: a huge white screen on the entrance hall's left wall, an original timeline in the style of a
  // "prehistory" fishbone chart, painted once from this visit's exhibits. Every exhibit hangs off the time line at its
  // date (a date only, never a claim of influence); gold marks a whitepaper citation, a gold ring documented influence,
  // grey context; the paper (31 October 2008) and the first block (January 2009) stand apart at the right. A tap on it,
  // or Space beside it, opens the menu (the timeline as buttons, openMenu).
  const LEGEND = { x: -11.8, y: 3.1, z: 0.2, w: 15, h: 5, at: { x: -9.4, z: 0.2 } };
  const buildLegend = () => {
    const W = 4096, H = Math.round(W * LEGEND.h / LEGEND.w), canvas = document.createElement("canvas"), g = canvas.getContext("2d");
    canvas.width = W; canvas.height = H;
    g.fillStyle = "#f7f4ec"; g.fillRect(0, 0, W, H);
    const Y0 = 1955, Y1 = 2010, ax0 = 150, ax1 = 3620, axisY = Math.round(H * 0.56), X = (y) => ax0 + (y - Y0) / (Y1 - Y0) * (ax1 - ax0);
    // Era bands and their names along the foot.
    const bands = ["#efe7d6", "#f3ece0"];
    GW.ERAS.forEach((e, i) => {
      const y0 = firstYear(e.years), y1 = i < GW.ERAS.length - 1 ? firstYear(GW.ERAS[i + 1].years) : 2010;
      g.fillStyle = bands[i % 2]; g.fillRect(X(y0), 150, X(y1) - X(y0), H - 230);
      g.fillStyle = "#8a8172"; g.font = "bold 30px system-ui, sans-serif"; g.textAlign = "left"; g.textBaseline = "alphabetic";
      g.fillText(`ERA ${e.n}`, X(y0) + 10, H - 98);
      g.font = "24px system-ui, sans-serif"; g.fillText(e.name, X(y0) + 10, H - 66, X(y1) - X(y0) - 16);
    });
    g.fillStyle = "#1c1a17"; g.font = "bold 74px Georgia, serif"; g.textAlign = "left";
    g.fillText("The Genesis timeline", 150, 100);
    g.font = "34px system-ui, sans-serif"; g.fillStyle = "#4a453e";
    g.fillText("Each line marks a date, not an influence.   Gold: cited in the Bitcoin whitepaper   ·   gold ring: documented influence   ·   grey: context   ·   tap for the menu", 1060, 96);
    g.strokeStyle = "#1c1a17"; g.lineWidth = 12; g.beginPath(); g.moveTo(ax0, axisY); g.lineTo(ax1, axisY); g.stroke();
    // Decade ticks.
    g.font = "26px system-ui, sans-serif"; g.fillStyle = "#6f6a62"; g.textAlign = "center"; g.lineWidth = 3;
    for (let y = 1960; y <= 2000; y += 10) { g.beginPath(); g.moveTo(X(y), axisY - 14); g.lineTo(X(y), axisY + 14); g.stroke(); g.fillText(String(y), X(y), axisY + 46); }
    // The exhibits: one line each off the axis, alternately above and below, in four tiers, labels left of the line.
    const items = benchList().filter((e) => e.def.connection !== "bibliography" && !/-panel$/.test(e.prop.id) && e.era < 6);
    const tier = [0, 0];
    items.forEach((e, i) => {
      const up = i % 2 === 0, t = tier[up ? 0 : 1]++ % 5, x = X(GN.yearKey(e.def.year)), y = axisY + (up ? -1 : 1) * (90 + t * 78);
      const c = e.def.connection, cited = c === "citation", infl = c === "influence", gold = cited || infl;
      g.strokeStyle = gold ? "#b98512" : "#8f897e"; g.lineWidth = gold ? 6 : 3;
      g.beginPath(); g.moveTo(x, axisY); g.lineTo(x - 40, y); g.lineTo(x - 330, y); g.stroke();
      g.fillStyle = gold ? "#8a5d00" : "#4a453e"; g.font = `${gold ? "bold " : ""}25px system-ui, sans-serif`; g.textAlign = "left";
      g.fillText(`${e.def.year}  ${e.def.title}${cited && e.def.ref ? ` ${e.def.ref}` : ""}`, x - 330, y - 9, 300);
      g.beginPath(); g.arc(x, axisY, gold ? 13 : 9, 0, 7);
      if (cited) { g.fillStyle = "#d9a11a"; g.fill(); } else if (infl) { g.fillStyle = "#f7f4ec"; g.fill(); g.lineWidth = 6; g.strokeStyle = "#d9a11a"; g.stroke(); } else { g.fillStyle = "#9a948a"; g.fill(); }
    });
    // The paper and the first block, kept apart.
    g.fillStyle = "#d9a11a"; g.beginPath(); g.arc(3770, axisY, 92, 0, 7); g.fill();
    g.fillStyle = "#1c1a17"; g.font = "bold 40px Georgia, serif"; g.textAlign = "center"; g.fillText("31 OCT", 3770, axisY - 6); g.fillText("2008", 3770, axisY + 40);
    g.font = "bold 30px system-ui, sans-serif"; g.fillText("The whitepaper (Era 6)", 3770, axisY - 120);
    g.fillStyle = "#3a352f"; g.beginPath(); g.arc(3770, axisY + 250, 46, 0, 7); g.fill();
    g.fillStyle = "#f7f4ec"; g.font = "bold 24px system-ui, sans-serif"; g.fillText("JAN", 3770, axisY + 246); g.fillText("2009", 3770, axisY + 272);
    g.fillStyle = "#3a352f"; g.font = "26px system-ui, sans-serif"; g.fillText("The first block, a later step (Era 7)", 3770, axisY + 336);
    const image = new Image();
    image.src = canvas.toDataURL("image/png");
    const face = { verts: [-LEGEND.w / 2, -LEGEND.h / 2, 0.03, LEGEND.w / 2, -LEGEND.h / 2, 0.03, LEGEND.w / 2, LEGEND.h / 2, 0.03, -LEGEND.w / 2, LEGEND.h / 2, 0.03], faces: [{ i: [0, 1, 2, 3], color: [0, 0, 0], emissive: 0 }], lines: [], castShadow: false };
    face.imageSurface = { asset: { width: W, height: H, load: () => image }, rect: [-LEGEND.w / 2, -LEGEND.h / 2, LEGEND.w, LEGEND.h] };
    const node = place(createNode({ position: { x: LEGEND.x, y: ISLAND_TOP + LEGEND.y, z: LEGEND.z }, rotation: { x: 0, y: Math.PI / 2, z: 0 } }));
    addChild(node, createNode({ geometry: M.bevelBox({ w: LEGEND.w + 0.4, h: LEGEND.h + 0.4, d: 0.16, color: "#d9d4c8", bevel: 0.05, offset: { z: -0.08 } }) }), createNode({ geometry: face }));
    built.legend = place(createNode({ geometry: pickBox(LEGEND.w, LEGEND.h, 0.4), position: { x: LEGEND.x + 0.2, y: ISLAND_TOP + LEGEND.y, z: LEGEND.z }, rotation: { x: 0, y: Math.PI / 2, z: 0 } }));
    built.legendItems = items.length;
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
  const buildProps = () => {
    const label = BL.factoryModels.label;
    const sign = (prop, sub, y) => {
      const s = label(prop.label, sub, { height: 0.45, style: "plain" });
      const n = place(createNode({ position: { x: prop.at.x + 0.35, y: prop.at.y + y, z: prop.at.z }, rotation: { x: 0, y: Math.PI / 2, z: 0 } }));
      addChild(n, createNode({ geometry: s.back }), createNode({ geometry: s.face }));
    };
    const pc = props.get("pc").at, dr = props.get("drives").at, bk = props.get("book").at;
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
  };
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
    built.propNodes = {}; built.obstacles = []; built.exhibitProps = []; built.trail = [];
    exhibitEra = -1;
    if (!EX) return;
    for (let n = 0; n < GW.ERAS.length; n++) {
      const def = EX.eras[n];
      if (!def) continue;
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
        obstacle: (x0, x1, z0, z1) => { built.obstacles.push({ x0, x1, z0, z1 }); },
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
              ? `Step ${entry.step} of ${built.trail.length} on the Steps toward Bitcoin: follow the gold path along the banks, in date order.`
              : entry.shows ? `It shows ${entry.shows} on the Steps toward Bitcoin working; it is not a step of its own.`
              : entry.listed ? `Listed in the paper's own references. Its story, and its place on the Steps toward Bitcoin, are upstream: ${entry.listed}. This slot is not a second step.`
              : "Part of the story of these years, not something the Bitcoin whitepaper cites or is shown to have drawn on."];
            // A terminal has no pages: the same words open its screen, as its banner's first lines.
            if (r.terminal) { const t = r.terminal; return { ...r, terminal: { banner: [`HOW IT CONNECTS: ${how[0]}`, how[1], "", ...t.banner], prompt: t.prompt, run: (line) => t.run(line) } }; }
            return { ...r, board: { ...r.board, pages: [...r.board.pages, { caption: "How it connects", title: c.label, text: how }] } };
          } : d.onUse;
          const prop = props.register({ ...d, era: n, onUse });
          entry.prop = prop;
          built.exhibitProps.push(entry);
          const pick = d.pick || { w: 1, h: 1.4, d: 1 };
          built.propNodes[prop.id] = place(createNode({ geometry: pickBox(pick.w, pick.h, pick.d), position: { x: pick.x !== undefined ? pick.x : prop.at.x, y: (prop.at.y || 0) + pick.h / 2, z: pick.z !== undefined ? pick.z : prop.at.z } }));
          return prop;
        }
      };
      def.build(kit);
    }
    // Fingerprints and Time's own exhibits are trail stops too, linked rather than duplicated: the lectern's panel
    // tells both papers' story (genesis-voyage.js FINGERPRINTS).
    for (const link of ROOM_LINKS) built.exhibitProps.push({ era: ROOM_ERA, def: link, prop: { id: link.id, at: link.at }, order: built.exhibitProps.length, step: 0, room: true });
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
  const exhibitState = { era: -1, walking: false, reading: false, x: 0, z: 0, calm: false };
  let exhibitEra = -1;
  const updateExhibits = (dt, elapsed) => {
    const EX = BL.genesisExhibits;
    if (!EX) return;
    // While a workbench is open its exhibit's era runs (so its model answers), wherever the visitor stands.
    const p = bench.open ? bench.focus : avatar ? avatar.root.position : ENTRY, era = bench.open ? bench.era : GW.eraAt(p.x, p.z), def = era >= 0 ? EX.eras[era] : null;
    exhibitState.era = era; exhibitState.walking = walk.on; exhibitState.x = p.x; exhibitState.z = p.z; exhibitState.calm = view.calm;
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
    GW.ERAS.forEach((e) => {
      const glow = glowHex(e.theme.lamp);
      for (const p of GW.pylons(e.n)) {
        solid(1.2, 5.2, 1.2, e.theme.rock, p.x, ISLAND_TOP + 2.6, p.z);
        solid(1.3, 0.2, 1.3, glow, p.x, ISLAND_TOP + 5.3, p.z, 1.2);
        hangSign(label(`ERA ${e.n}`, e.years, { height: 1.1, style: "plain" }), p.x, ISLAND_TOP + 4.1, p.z + 0.62, 0);
        built.obstacles.push({ x0: p.x - 0.7, x1: p.x + 0.7, z0: p.z - 0.7, z1: p.z + 0.7 });
      }
      const spot = GW.overviewSpot(e.n);
      p.x = spot.x; p.z = spot.z;
      const def = EX && EX.eras[e.n], mine = built.exhibitProps.filter((x) => x.era === e.n).sort((a, b) => EX.yearKey(a.def.year) - EX.yearKey(b.def.year) || a.order - b.order);
      const board = textBoard({ kicker: `ERA ${e.n} · ${e.years.toUpperCase()}`, title: e.name, width: 3.4,
        body: [def && def.overview ? def.overview.summary : mine.length ? "Walk the banks: every exhibit here shows its year." : "This cave's exhibits are still being built."],
        list: mine.length ? [...mine.map((x) => ({ text: `${x.def.year} · ${x.def.title}${x.step ? `  ★ step ${x.step}` : ""}`, gold: !!x.step })),
          ...(mine.some((x) => x.step) ? [{ text: "★ Steps toward Bitcoin: follow the gold path", gold: true }] : [])] : [] });
      const ry = spot.ry, lift = ISLAND_TOP + 0.9 + board.height / 2;
      // Its post stands behind the board (genesis-world.js overviewSpot), never through its face.
      solid(spot.post.w, 0.9 + board.height / 2, spot.post.w, "#3b2a1a", spot.post.x, ISLAND_TOP + (0.9 + board.height / 2) / 2, spot.post.z);
      hangSign(board, p.x, lift, p.z, ry, glow);
      const pick = place(createNode({ geometry: pickBox(3.6, board.height + 1.2, 0.6), position: { x: p.x, y: lift, z: p.z }, rotation: { x: 0, y: ry, z: 0 } }));
      // Walkers meet the board along its line and use it from in front of its face (genesis-world.js overviewSpot).
      built.overviews.push({ era: e.n, pick, at: { x: spot.at.x, y: ISLAND_TOP, z: spot.at.z } });
      for (const box of spot.boxes) built.obstacles.push(box);
    });
  };
  // The trail's path: a gold strip along each bank's walk (BANK.TRAIL_V) from the gateway to its last step, chevrons
  // pointing downstream (later in time), a spur to each step and a numbered post; pieces crossing a reserved plot
  // other than the gateway (the dock and its ramps, a lamp, Fingerprints and Time) are left out. One merged mesh.
  const buildTrail = () => {
    const label = BL.factoryModels.label, B = GW.BANK, p = { x: 0, z: 0 }, parts = [];
    for (const e of GW.ERAS) {
      const reserved = GW.reservedZones(e.n).filter((r) => r.why !== "gateway");
      for (const side of [-1, 1]) {
        const stops = built.trail.filter((x) => x.era === e.n).map((x) => ({ x, ...bankPlace(e.n, x.prop.at) })).filter((s) => s.side === side);
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
    }
    if (parts.length) place(createNode({ geometry: M.merge(...parts), sightHidden: true }));
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
    props.register({ id: "pc", era: 3, year: 1993, title: "Tock's office PC", label: "OFFICE PC · 1993", sourceKeys: ["merkle1980", "haber1991", "bayer1993"], at: PROPS.pc,
      onUse: () => ({ terminal: dos }) });
    // TODO: moves to Era 0's cave (1956) when its exhibits are built; it stands here until then.
    props.register({ id: "drives", era: 0, year: 1956, title: "Hard drives, 1956 and 2019", label: "HARD DRIVES · 1956 AND 2019", sourceKeys: GP.DRIVES.old.sourceKeys.concat(GP.DRIVES.now.sourceKeys), at: PROPS.drives,
      onUse: () => ({ board: { room: "Hard drives: 1956 and 2019", pages: GP.drivePages(), sources: GP.DRIVES.old.sourceKeys.concat(GP.DRIVES.now.sourceKeys) } }) });
    const book = GP.createStampBook();
    built.stampBook = book;
    props.register({ id: "book", era: 3, year: 1991, title: "Tock's book", label: "TOCK'S BOOK · 1991", sourceKeys: ["haber1991"], at: PROPS.book,
      onUse: () => ({ terminal: GP.stampTerminal(book) }) });
  };

  // --- The exhibit workbench (genesis-bench.js) ---------------------------------------------------------------------
  // One broad window for every exhibit: the stage on its left is clear, and the camera frames the exhibit's own model
  // in it, so a command's result shows on the model itself, live; the command line, Run, Reset and the exhibit's own
  // commands sit under the stage, and its story, how to use it and its sources on the right. Opening it holds the
  // visitor's Ooga, the crew and the desk's show; the exhibit's era keeps running so its model answers. Previous and
  // Next go through every exhibit in date order; Close (or Escape) puts the camera back where it was.
  const bench = { open: false, entry: null, term: null, board: null, list: [], index: -1, lines: [], era: -1,
    focus: { x: 0, z: 0 }, view: { eye: { x: 0, y: 0, z: 0 }, target: { x: 0, y: 0, z: 0 }, dist: 0 }, eased: false,
    saved: { x: 0, y: 0, z: 0, tx: 0, ty: 0, tz: 0, fov: 0, near: 0, up: null, orthoMix: 0, orthoHeight: 0 }, opens: 0, runs: 0 };
  const MAX_OUT = 120, PICK_SIZES = { pc: { w: 1.2, h: 1.4, d: 1.3 }, drives: { w: 1.1, h: 1.1, d: 1.1 }, book: { w: 0.7, h: 1.2, d: 0.8 } };
  const frameIn = { c: { x: 0, y: 0, z: 0 }, size: 1, toward: { x: 0, z: 1 }, ndc: { x: 0, y: 0 }, frac: 0.6, fov: 62, aspect: 1.6, fill: 0.62, pitch: 0.2 };
  // Every exhibit a workbench shows, in date order: the era files' props and the room's own (the PC, the drives, the
  // book). The overview boards stay panels.
  const benchList = () => {
    const list = built.exhibitProps.filter((e) => !e.room && e.prop).map((e) => ({ def: e.def, era: e.era, order: e.order, prop: props.get(e.prop.id) || e.prop }));
    for (const id of ["pc", "drives", "book"]) { const p = props.get(id); list.push({ def: p, era: p.era, order: 1000 + list.length, prop: p }); }
    return GN.order(list);
  };
  const isBenchProp = (prop) => !/-overview$/.test(prop.id) && prop.id !== "legend";
  // Where the camera stands to show an exhibit's model in the stage: its tap box is its model's box.
  const frameBench = () => {
    const e = bench.entry, id = e.prop.id, node = built.propNodes[id] || built[id], pick = e.def.pick || PICK_SIZES[id] || { w: 1, h: 1.4, d: 1 };
    const c = frameIn.c, at = e.prop.at;
    c.x = node ? node.position.x : at.x; c.y = node ? node.position.y : (at.y || 0) + pick.h / 2; c.z = node ? node.position.z : at.z;
    frameIn.size = Math.max(pick.w, pick.h, pick.d, 0.8);
    frameIn.toward.x = at.x - c.x; frameIn.toward.z = at.z - c.z;
    if (Math.hypot(frameIn.toward.x, frameIn.toward.z) < 0.3) { frameIn.toward.x = GW.LANE_X - c.x; frameIn.toward.z = 0.0001; }
    const cr = overlayCanvas.getBoundingClientRect(), sr = el.benchStage.getBoundingClientRect();
    frameIn.ndc.x = ((sr.left + sr.width / 2) - cr.left) / cr.width * 2 - 1;
    frameIn.ndc.y = 1 - ((sr.top + sr.height / 2) - cr.top) / cr.height * 2;
    frameIn.frac = Math.max(0.15, sr.height / cr.height);
    frameIn.aspect = cr.width / cr.height; frameIn.fov = bench.saved.fov || camera.fov;
    GN.frame(frameIn, bench.view);
    bench.focus.x = c.x; bench.focus.z = c.z;
  };
  const write = (node, tag, text, cls) => { const n = document.createElement(tag); n.textContent = text; if (cls) n.className = cls; node.append(n); return n; };
  const fillInfo = (e) => {
    const info = el.benchInfo, t = bench.term;
    info.replaceChildren();
    let more = [];
    if (t) { try { more = t.run("MORE").lines || []; } catch (_) { more = []; } }
    const sections = GN.sections({ banner: t ? t.banner : [], more, howTo: e.def.howTo || [], hint: e.def.hint || "", pages: bench.board ? bench.board.pages : null });
    for (const sec of sections) {
      write(info, "h3", sec.title);
      const box = sec.title === "How it connects" ? write(info, "div", "", "bench-connects") : info;
      for (const line of sec.lines) write(box, "p", line);
    }
    const keys = [...new Set([...(e.def.sourceKeys || []), ...((bench.board && bench.board.sources) || [])])];
    if (keys.length) {
      write(info, "h3", "Sources");
      const ul = write(info, "ul", "");
      for (const k of keys) {
        const src = GP.sourceOf(k), li = document.createElement("li");
        if (src && src.href) { const a = document.createElement("a"); a.href = src.href; a.target = "_blank"; a.rel = "noopener noreferrer"; a.textContent = src.label || src.href; li.append(a); }
        else li.textContent = k;
        ul.append(li);
      }
    }
    info.scrollTop = 0;
  };
  const fillActions = () => {
    el.benchActions.replaceChildren();
    if (!bench.term) return;
    let help = [];
    try { help = bench.term.run("HELP").lines || []; } catch (_) { help = []; }
    for (const a of GN.actionsFrom(help)) {
      const b = document.createElement("button");
      b.type = "button"; b.textContent = a.arg ? `${a.cmd} …` : a.cmd; b.dataset.cmd = a.cmd; b.dataset.arg = a.arg ? "1" : "";
      b.title = a.arg ? `Type ${a.cmd} and what goes after it` : `Run ${a.cmd}`;
      el.benchActions.append(b);
    }
  };
  const showBench = (i) => {
    const n = bench.list.length;
    bench.index = (i + n) % n;
    const e = bench.list[bench.index], era = GW.ERAS[e.era], c = e.def.connection && BL.genesisExhibits.CONNECTIONS[e.def.connection];
    bench.entry = e; bench.lines.length = 0; bench.era = e.era;
    const r = props.use(e.prop, propState) || {};
    bench.term = r.terminal || null; bench.board = r.board || null;
    el.benchKicker.textContent = `Era ${era.n} · ${era.name} · ${e.def.year}${c ? ` · ${c.label}${e.def.ref ? ` ${e.def.ref}` : ""}` : ""}`;
    el.benchTitle.textContent = e.def.title;
    el.benchPos.textContent = `${bench.index + 1} of ${n}`;
    el.benchForm.hidden = !bench.term; el.benchOutput.hidden = !bench.term; el.benchPanelNote.hidden = !!bench.term;
    el.benchPrompt.textContent = bench.term ? bench.term.prompt : ">";
    el.benchOutput.textContent = bench.term ? "Type a command, or use a button. Watch the model above." : "";
    el.benchInput.value = "";
    if (r.caption) { el.benchPanelNote.hidden = false; el.benchPanelNote.textContent = r.caption; }
    else el.benchPanelNote.textContent = "This exhibit is a panel: read it on the right. Its model is live above.";
    fillActions(); fillInfo(e);
    el.bench.hidden = false;
    document.body.classList.add("genesis-bench-open");
    bench.eased = false;
    frameBench();
    if (bench.term && !COARSE) el.benchInput.focus(); else el.bench.querySelector(".bench-close").focus();
    bench.opens++;
  };
  const openBench = (prop) => {
    audio.wake();
    const list = benchList(), i = list.findIndex((e) => e.prop.id === prop.id);
    if (i < 0) return false;
    if (!bench.open) {
      const s2 = bench.saved, cp = camera.position, ct = camera.target;
      s2.x = cp.x; s2.y = cp.y; s2.z = cp.z; s2.tx = ct.x; s2.ty = ct.y; s2.tz = ct.z;
      s2.fov = camera.fov; s2.near = camera.near; s2.up = camera.up || null; s2.orthoMix = camera.orthoMix || 0; s2.orthoHeight = camera.orthoHeight || 0;
      camera.up = null; camera.orthoMix = camera.orthoHeight = 0;
      pilot.setActive(false); hud.tooltip.hide(); hud.hideHint(); stopVoice();
    }
    bench.open = true; bench.list = list;
    showBench(i);
    return true;
  };
  const runBench = (line) => {
    if (!bench.term || !String(line).trim()) return null;
    audio.wake();
    let out;
    try { out = bench.term.run(line) || { lines: [] }; } catch (err) { out = { lines: [`That command did not run: ${err.message}`] }; }
    if (out.cls) bench.lines.length = 0;
    else bench.lines.push(`${bench.term.prompt} ${GP.clean(line)}`, ...(out.lines || []));
    if (bench.lines.length > MAX_OUT) bench.lines.splice(0, bench.lines.length - MAX_OUT);
    el.benchOutput.textContent = bench.lines.join("\n");
    el.benchOutput.scrollTop = el.benchOutput.scrollHeight;
    if (out.entry) { audio.cue("stamp"); hud.toast(`Page ${out.entry.page} stamped: ${out.entry.code}`); }
    bench.runs++;
    return out;
  };
  // Close: the camera goes back exactly where it was and the walk resumes. With `there`, the Ooga is put at the
  // exhibit's walk-up spot instead (Take me there), and the pilot frames it there.
  const closeBench = (there = false) => {
    if (!bench.open) return;
    const at = there && bench.entry ? bench.entry.prop.at : null;
    bench.open = false; bench.entry = bench.term = bench.board = null; bench.era = -1;
    el.bench.hidden = true;
    document.body.classList.remove("genesis-bench-open");
    if (document.activeElement && el.bench.contains(document.activeElement)) document.activeElement.blur();
    const s2 = bench.saved;
    camera.position.x = s2.x; camera.position.y = s2.y; camera.position.z = s2.z; camera.target.x = s2.tx; camera.target.y = s2.ty; camera.target.z = s2.tz;
    camera.fov = s2.fov; camera.near = s2.near; camera.up = s2.up; camera.orthoMix = s2.orthoMix; camera.orthoHeight = s2.orthoHeight;
    pilot.setActive(true);
    if (at && avatar) {
      walkPose.position.x = at.x; walkPose.position.z = at.z; walkPose.position.y = footing.supportAt(at.x, at.z);
      walkPose.yaw = Math.atan2(GW.LANE_X - at.x, 0.0001) - Math.PI;
      pilot.navigate(walkPose);
    }
  };
  // Each frame while open: the camera eases (or, in Calm, cuts) to frame the model in the stage.
  const updateBench = (dt) => {
    const v = bench.view, c = camera.position, t = camera.target, k = view.calm || !bench.eased ? 1 : Math.min(1, dt * 6);
    bench.eased = true;
    c.x += (v.eye.x - c.x) * k; c.y += (v.eye.y - c.y) * k; c.z += (v.eye.z - c.z) * k;
    t.x += (v.target.x - t.x) * k; t.y += (v.target.y - t.y) * k; t.z += (v.target.z - t.z) * k;
  };
  const openProp = (prop) => {
    audio.wake();
    if (prop.id === "legend") { openMenu(); return; }
    if (isBenchProp(prop) && openBench(prop)) return;
    const r = props.use(prop, propState);
    if (r.board) openPanel(makeBoard(r.board));
    else if (r.caption) { captionKey = ""; setCaption(`prop-${prop.id}`, r.caption); }
  };

  // --- The timeline menu ------------------------------------------------------------------------------------------
  // Every exhibit by era and date, each a button opening its workbench, and how it connects (gold only for a
  // whitepaper citation, documented influence or the paper itself). Filters: all, the Steps toward Bitcoin, context.
  let menuFilter = "all";
  const fillMenu = () => {
    const listEl = el.menuList, list = benchList();
    listEl.replaceChildren();
    let era = -1;
    for (const e of list) {
      const c = e.def.connection || "context", trail = !!(BL.genesisExhibits.CONNECTIONS[c] && BL.genesisExhibits.CONNECTIONS[c].trail);
      if (menuFilter === "trail" && !trail) continue;
      if (menuFilter === "context" && trail) continue;
      if (e.era !== era) { era = e.era; write(listEl, "h3", `Era ${era} · ${GW.ERAS[era].name} · ${GW.ERAS[era].years}`); }
      const b = document.createElement("button");
      b.type = "button"; b.dataset.exhibit = e.prop.id;
      write(b, "span", String(e.def.year), "menu-year");
      write(b, "span", e.def.title, "menu-title");
      const label = BL.genesisExhibits.CONNECTIONS[c] ? BL.genesisExhibits.CONNECTIONS[c].label : "Context";
      write(b, "span", `${trail ? "● " : ""}${label}${e.def.ref ? ` ${e.def.ref}` : ""}`, `menu-tag tag-${c}`);
      listEl.append(b);
    }
  };
  const openMenu = () => {
    if (bench.open) closeBench();
    audio.wake();
    fillMenu();
    if (!el.menu.open) el.menu.showModal();
    view.reading = true; view.readingPaused = false;
    pilot.setActive(false);
  };
  const menuClosed = () => { if (!bench.open) { view.reading = false; pilot.setActive(true); } };

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
    const nearDesk = walk.on && avatar && Math.hypot(avatar.root.position.x - DESK.x, avatar.root.position.z - DESK.z) < 9;
    if (nearDesk && !view.paused && p !== lastPhase) setCaption(p);
    lastPhase = p;
  };
  // The era the visitor stands in: its music and, on crossing into it, its caption.
  const updateEra = () => {
    const p = avatar ? avatar.root.position : ENTRY, era = GW.eraAt(p.x, p.z);
    if (era === lastEra) return;
    audio.setEra(Math.max(0, era));
    if (era >= 0 && lastEra !== -2) {
      const e = GW.ERAS[era], n = exhibitCount(era);
      setCaption(`era-${era}`, `Era ${e.n}: ${e.name} (${e.years}).${e.room ? " Fingerprints and Time is on the left." : ""} ${n ? `${n} exhibits along both walls; Space by one opens its workbench.` : "Its exhibits are still being built."}`);
    }
    lastEra = era;
  };
  const update = (dt) => {
    sceneTime += dt;
    // A panel's dialog closing (its button, Escape or a press outside) hands the walk back as it was.
    if (view.reading && !hud.el.board.open && !el.menu.open) {
      view.reading = false;
      if (view.readingPaused) setPaused(false);
      if (!bench.open) pilot.setActive(true);
      captionKey = "";
      showControls();
    }
    if (!bench.open) updateEra();
    syncAudio();
    // A workbench holds the walk, the crew and the desk's show; its exhibit's era runs and the camera frames it.
    if (bench.open) { updateExhibits(dt, sceneTime); updateBench(dt); }
    else {
      stepDemo(dt);
      updateExhibits(dt, sceneTime);
      built.portal.glow = 1 + Math.sin(sceneTime * 1.3) * (view.calm ? 0 : 0.25);
      built.pcScreen.glow = 1 + (view.calm ? 0 : (Math.floor(sceneTime * 2) & 1) * 0.2);
      updateWalk(dt, sceneTime);
    }
    const p = avatar ? avatar.root.position : ENTRY;
    renderOpts.shadowCenter.x = bench.open ? bench.focus.x : p.x; renderOpts.shadowCenter.z = bench.open ? bench.focus.z : p.z;
    remotes.update(dt);
    fx.update(dt, sceneTime);
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
    built = {};
    // The era files build first, so the hall's boulders, the legend and the shared signage know them.
    buildCavern(); buildFloor(); buildDesk();
    registerProps();
    buildExhibits();
    buildCaves(); buildLegend(); buildEraFrames(); buildTrail();
    registerOverviews();
    // The visit's footing: the fixed ledges and banks, plus whatever this visit's exhibits put in the way.
    footing = GP.createFooting({ areas: FOOTING.areas, obstacles: FOOTING.obstacles.concat(built.obstacles) });
    buildProps();
    demo = G.createStampDemo();
    board = makeBoard();
    audio = BL.genesisAudio.create();
    sounds.paused = sounds.engine = sounds.calm = null;
    view.reading = view.readingPaused = false; view.paused = false; lastEra = -2;
    bench.open = false; bench.entry = bench.term = bench.board = null; bench.era = -1; bench.opens = bench.runs = 0; menuFilter = "all";
    view.calm = PREFERS_CALM.matches;
    sceneTime = 0; captionKey = ""; lastStamps = 0; lastPhase = ""; lastTiles = -1; lastBroken = false;
    renderOpts.lightCount = LIGHTS.length;
    for (let i = 0; i < LIGHTS.length; i++) { const l = LIGHTS[i], o = i * 8; for (let k = 0; k < 7; k++) renderOpts.lights[o + k] = l[k]; renderOpts.lights[o + 7] = 0; }
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
    const clampTarget = (p) => { p.x = clamp(p.x, GW.SEA.x0, GW.SEA.x1); p.y = clamp(p.y, 0.3, GW.CAVE.height - 1); p.z = clamp(p.z, GW.SEA.z0, 8.5); };
    // The camera keeps inside the walls: the hall's, the corridor's and the entrance hall's (which is narrower).
    const clampCamera = (p) => {
      p.x = clamp(p.x, GW.SEA.x0 + 0.3, GW.SEA.x1 - 0.3); p.z = clamp(p.z, GW.SEA.z0, 8.6);
      if (p.z > GW.MOUTH_Z - 0.6) p.x = clamp(p.x, GW.HARBOUR.x0 - 0.5, GW.HARBOUR.x1 + 0.5);
      else if (p.z > GW.ERAS[0].z1) p.x = clamp(p.x, CHANNEL.x0 + 0.2, CHANNEL.x1 - 0.2);
      p.y = clamp(p.y, 0.4, GW.ceilingAt(p.x, p.z));
    };
    pilot = BL.pilot.create({
      renderer: ctx.renderer, canvas: ctx.canvas, camera, hud, presets: WALK_PRESETS, landing: "dock", pitch: [-0.2, 1.2], dist: [2.5, 12],
      follow: { y: 0.9, min: 2.5, max: 6, pitch: [0.2, 0.8] }, fly: { speed: 6, perDist: 0.3, climb: 4, yMax: 22 }, clampTarget, clampCamera,
      ceilingAt: (x, z) => GW.ceilingAt(x, z), coarse: COARSE, mayPossess,
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
    // The workbench: its buttons, its command line (typing stays in it) and Escape to close.
    for (const id of ["", "Kicker", "Title", "Pos", "Stage", "Form", "Input", "Prompt", "Actions", "Output", "Info", "PanelNote"]) el[`bench${id}`] = document.getElementById(`genesis-bench${id ? "-" + id.replace(/[A-Z]/g, (c) => "-" + c.toLowerCase()).replace(/^-/, "") : ""}`);
    el.benchForm.addEventListener("submit", (e) => { e.preventDefault(); runBench(el.benchInput.value); el.benchInput.value = ""; }, { signal: ctx.signal });
    el.bench.addEventListener("click", (e) => {
      const b = e.target.closest("button");
      if (!b || !bench.open) return;
      if (b.dataset.bench === "close") closeBench();
      else if (b.dataset.bench === "go") closeBench(true);
      else if (b.dataset.bench === "prev") showBench(bench.index - 1);
      else if (b.dataset.bench === "next") showBench(bench.index + 1);
      else if (b.dataset.bench === "reset") runBench("RESET");
      else if (b.dataset.cmd) {
        if (b.dataset.arg) { el.benchInput.value = `${b.dataset.cmd} `; el.benchInput.focus(); }
        else runBench(b.dataset.cmd);
      }
    }, { signal: ctx.signal });
    el.bench.addEventListener("keydown", (e) => {
      if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); closeBench(); }
      else if (e.target !== el.benchInput && (e.key === "ArrowRight" || e.key === "ArrowLeft")) { e.preventDefault(); showBench(bench.index + (e.key === "ArrowRight" ? 1 : -1)); }
    }, { signal: ctx.signal });
    window.addEventListener("resize", () => { if (bench.open) { bench.eased = false; frameBench(); } }, { signal: ctx.signal });
    // The timeline menu.
    el.menu = document.getElementById("genesis-menu"); el.menuList = document.getElementById("genesis-menu-list");
    el.menu.addEventListener("close", menuClosed, { signal: ctx.signal });
    el.menu.querySelector("[data-menu-close]").addEventListener("click", () => el.menu.close(), { signal: ctx.signal });
    el.menu.addEventListener("click", (e) => {
      const b = e.target.closest("button");
      if (!b) return;
      if (b.dataset.filter) { menuFilter = b.dataset.filter; for (const f of el.menu.querySelectorAll("[data-filter]")) f.setAttribute("aria-pressed", String(f === b)); fillMenu(); }
      else if (b.dataset.exhibit) { const prop = props.get(b.dataset.exhibit); el.menu.close(); view.reading = false; if (prop) openBench(prop); }
    }, { signal: ctx.signal });
    window.addEventListener("pointerdown", audio.wake, { signal: ctx.signal });
    window.addEventListener("keydown", audio.wake, { signal: ctx.signal });
    setCaption("arrive-museum", "The Genesis museum: the ideas that came before Bitcoin, in date order down the hall. The white timeline on your left lists every invention (or press G). Walk up to any exhibit and press Space, or tap it, to open its workbench.");
    paintChain();
    showControls();
    hud.setStats(game.state);
    arrive();
    Object.assign(scene, { root, camera, input, debug: { get demo() { return demo; }, view, built, board, openInfo, toggle, walk, footing, props, pilot, get avatar() { return avatar; },
      openProp, pause, bench, openBench, closeBench, showBench, runBench, benchList, openMenu, get exhibits() { return built.exhibitProps; }, get trail() { return built.trail; }, get audio() { return audio; }, sounds } });
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
    closeBench();
    if (el.menu.open) el.menu.close();
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
    return { allNodes: nodes, targets: input.targetCount, era: GW.eraAt(p.x, p.z), bench: bench.open ? bench.entry.prop.id : null, opens: bench.opens, runs: bench.runs,
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
