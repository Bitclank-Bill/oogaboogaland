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
  // Indoors and inviting: a warm, low ambient so the lamps model the rooms, warm light from above, a little more glow.
  const renderOpts = { clear: [0.05, 0.04, 0.035], sky: [0.42, 0.36, 0.3], ground: [0.2, 0.16, 0.12],
    direct: [0.86, 0.76, 0.62], directStrength: 0.34, ambientFloor: 0.4, sun: { x: 0.25, y: 1, z: 0.35 },
    shadowCenter: { x: 0, y: 0, z: 0 }, shadowExtent: 34, bloomStrength: 0.5,
    lights: new Float32Array(BL.glRenderer.POINT_LIGHT_CAPACITY * 8), lightCount: 0 };
  // The museum (genesis-world.js MUSEUM): an atrium in the middle and the eras' galleries round it. Each era is built
  // in its old cave's coordinates inside its gallery's frame node; `mu(n, x, z)` is a point of era n's old world in the
  // museum, `muBox` a box.
  const MU = GW.MUSEUM, ROOF = MU.HEIGHT, AT = MU.atrium;
  // The atrium's south: the arrival, the portal statue and the white timeline screen, placed from its south wall.
  const SOUTH = AT.z1, PORTAL_Z = SOUTH - 7;
  const DESK_AT = MU.toMuseum(ROOM_ERA, DESK.x, DESK.z, { x: 0, z: 0 });
  const mu = (n, x, z, out = { x: 0, z: 0 }) => MU.toMuseum(n, x, z, out);
  const muBox = (n, b) => ({ ...b, ...MU.boxToMuseum(n, b) });
  const muAt = (n, at) => { const p = mu(n, at.x, at.z); return { ...at, x: p.x, z: p.z }; };
  // Lamps: the atrium's, the desk's and the newspaper's in Fingerprints and Time, then three in each gallery in its
  // era's colour. Each frame the nearest come first (the tiers keep the first ones).
  // Each gallery's pendant lamps (genesis-decor.js), in its old coordinates, light it in its era's lamp colour.
  const galleryRect = (n) => { const b = MU.bays[n], e = GW.ERAS[n]; return { x0: b.x0, x1: b.x1, z0: e.z1 - b.depth, z1: e.z1 - MU.OPEN }; };
  const LIGHTS = [[0, 6.5, 0, 16, 1.3, 1.1, 0.75], [0, 8, 0.5 * AT.z1, 24, 1.2, 1.05, 0.85], [0, 8, 0.5 * AT.z0, 24, 1.2, 1.05, 0.85], [0.6 * AT.x0, 8, 0, 24, 1.1, 1, 0.85], [0.6 * AT.x1, 8, 0, 24, 1.1, 1, 0.85], [0, 6, SOUTH - 10, 14, 1.25, 0.95, 0.6],
    ...[[-6.5 + SX, 3.4, -25 + SZ, 12, 1.35, 1.05, 0.7], [-9 + SX, 3.2, -31.5 + SZ, 7, 1, 0.9, 0.7]].map((l) => { const q = mu(ROOM_ERA, l[0], l[2]); return [q.x, l[1], q.z, ...l.slice(3)]; }),
    // The statue in its warm light, and the Oogas' campfire behind it (genesis-campfire.js).
    [0, 7.5, -2.2, 13, 1.4, 1.15, 0.8],
    [BL.genesisCampfire.layout().fire.x, ISLAND_TOP + 1.8, BL.genesisCampfire.layout().fire.z, 10, 1.5, 0.8, 0.35],
    // Glow Golf's lamps, one over each hole: warm jungle light, every third one with a neon tint.
    ...BL.genesisGolfCourse.HOLES.map((h, i) => { const c = BL.genesisGolfCourse.cellOf(i); const V = BL.genesisGolfCourse.CAVERN; return [V.x + c.x, ISLAND_TOP + 5.5, V.z + c.z, 15, ...(i % 3 === 1 ? [1.1, 0.75, 1.15] : [1.25, 1.1, 0.72])]; }),
    // Daylight down the cenote's shaft (genesis-cavern.js).
    [BL.genesisCavern.CENOTE.x, ISLAND_TOP + 3, BL.genesisCavern.CENOTE.z, 11, 0.95, 1.1, 1.3],
    ...GW.ERAS.flatMap((e) => BL.genesisDecor.pendantSpots(galleryRect(e.n)).map(([x, z]) => {
      const q = mu(e.n, x, z), c = BL.genesisDecor.rgb(BL.genesisDecor.STYLES[e.n].lamp);
      return [q.x, ISLAND_TOP + ROOF * BL.genesisDecor.PENDANT_Y * MU.SCALE, q.z, 13, c[0] / 200, c[1] / 200, c[2] / 200];
    }))];

  // --- Walking: where an Ooga may stand ----------------------------------------------------------------------------
  // One floor at bank height: the atrium and every gallery, walled round. Fingerprints and Time's ledge (Era 3), its
  // desk and the newspaper stand in the way, and so do the statue and the walls.
  const { CHANNEL } = GW;
  // Where the visitor arrives: in the atrium's south, by the statue, facing north across it (a fall comes back here).
  const ENTRY = { x: 0, z: SOUTH - 12, facing: Math.PI };
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
  const GC = BL.genesisGolfCourse.CAVERN, GOLF_BOX = { x0: GC.x - GC.w / 2 + 0.6, x1: GC.x + GC.w / 2 - 0.6, z0: GC.z - GC.d / 2 + 0.6, z1: GC.z + GC.d / 2 - 0.6 };
  const GOLF_IN = { x: GC.x - GC.w / 2 + 3, z: GC.z - 20 };
  const inGolf = (x, z) => x > GOLF_BOX.x0 - 1 && x < GOLF_BOX.x1 + 1 && z > GOLF_BOX.z0 - 1 && z < GOLF_BOX.z1 + 1;
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
    // Glow Golf's cavern under the hall (genesis-golf-course.js CAVERN), reached down the cenote.
    FOOTING.areas.push({ id: "golf", ...GOLF_BOX, top: ISLAND_TOP, dock: { x: GOLF_IN.x, z: GOLF_IN.z, facing: Math.PI / 2 } });
    // The statue in the atrium, and the walls.
    FOOTING.obstacles.push(...WALLS);
  }
  // The first props, on the room's ledge (in Era 3's old world): the office PC, the hard-drive plinth and Tock's book.
  const PROPS = { pc: { x: -9.6 + SX, y: 0.545, z: -20.6 + SZ }, drives: { x: -9.8 + SX, y: 0.545, z: -32.4 + SZ }, book: { x: -5.8 + SX, y: 0.545, z: -23.6 + SZ } };
  const WALK_PRESETS = { dock: { yaw: 0, pitch: 0.3, dist: 6, target: { x: ENTRY.x, y: 1, z: ENTRY.z } } };

  let root = null, camera = null, input = null, hud = null, game = null, world = null, go = null, overlayCanvas = null, renderer = null;
  let demo = null, built = null, board = null, audio = null;
  const targets = [];
  // `paused` is the visitor's own pause (P); `reading` a panel open; Calm holds decorative motion.
  const view = { calm: false, captions: true, voice: false, readingPaused: false, reading: false, paused: false, music: true };
  // Genesis Hall is quiet (Billy's refinement): no era music and no automatic cues. Only what a visitor sets going
  // makes a sound (an exhibit's own tones, the console's games, the Ooga's footsteps); `view.music` stays off.
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
    // (The portal the visitor came through now stands on the dais by the statue, the whitepaper scrolling in it:
    // buildPaperPortal.)
    for (const [x, z] of [[-3, PORTAL_Z + 0.5], [3, PORTAL_Z + 0.5], [-6, PORTAL_Z + 2], [6, PORTAL_Z + 2]]) {
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
    for (const w of WALLS) solid(w.x1 - w.x0, ROOF, w.z1 - w.z0, "#3a3530", (w.x0 + w.x1) / 2, ROOF / 2, (w.z0 + w.z1) / 2);
    solid(B.x1 - B.x0 + 4, 1, B.z1 - B.z0 + 4, "#2a2622", (B.x0 + B.x1) / 2, ROOF + 0.5, (B.z0 + B.z1) / 2);
    const pillars = [];
    for (const { x, z } of MU.PILLARS) {
      pillars.push(M.moved(M.box({ w: 2.2, h: ROOF, d: 2.2, color: "#4a453e" }), x, ROOF / 2, z));
      pillars.push(M.moved(M.box({ w: 3, h: 0.6, d: 3, color: "#5d5850" }), x, ISLAND_TOP + 0.3, z));
      built.obstacles.push({ x0: x - 1.5, x1: x + 1.5, z0: z - 1.5, z1: z + 1.5 });
    }
    place(createNode({ geometry: M.merge(...pillars) }));
  };
  // Each era's gallery, in its frame and its old coordinates: its floor in the era's colour, a gold walk down the
  // middle where the stream ran, an arch over its opening with the era's sign, hanging rocks and boulders (kept off
  // the exhibits), glowing seams on its walls and its lamp posts.
  // A small wall piece for era n, its k-th along the walls, facing +z from the wall: a clock, a pennant or a shelf.
  const WALL_INKS = ["#c9c3b4", "#d18b2c", "#ff4fa3", "#2f7a7a", "#3d5f9a", "#4fa3ff", "#6e5a40", "#f7931a"];
  const wallPiece = (n, k) => {
    const ink = WALL_INKS[n], kind = (k + n) % 3, out = [];
    if (kind === 0) {
      out.push(M.turnedX(M.lathe({ profile: [[0, 0], [0.32, 0], [0.32, 0.08], [0, 0.08]], segments: 16, color: "#2b2421" }), Math.PI / 2));
      out.push(M.moved(M.turnedX(M.lathe({ profile: [[0, 0], [0.27, 0], [0.27, 0.02], [0, 0.02]], segments: 16, color: "#f4efe2" }), Math.PI / 2), 0, 0, 0.08));
      out.push(M.box({ w: 0.03, h: 0.2, d: 0.02, color: "#1b1b1b", offset: { x: 0, y: 0.08, z: 0.11 } }), M.box({ w: 0.15, h: 0.03, d: 0.02, color: "#1b1b1b", offset: { x: 0.06, y: 0, z: 0.11 } }));
    } else if (kind === 1) {
      out.push(M.box({ w: 0.9, h: 0.05, d: 0.05, color: "#3b2a1a", offset: { x: 0, y: 0.25, z: 0.04 } }));
      out.push(M.box({ w: 0.8, h: 0.45, d: 0.02, color: ink, emissive: 0.15, offset: { x: 0, y: 0, z: 0.05 } }));
      out.push(M.box({ w: 0.6, h: 0.06, d: 0.01, color: "#f4efe2", offset: { x: 0, y: 0.05, z: 0.065 } }));
    } else {
      out.push(M.box({ w: 1.0, h: 0.05, d: 0.25, color: "#5a3a22", offset: { x: 0, y: -0.2, z: 0.12 } }));
      for (let j = 0; j < 5; j++) out.push(M.box({ w: 0.12, h: 0.28 + (j % 2) * 0.06, d: 0.18, color: j % 2 ? ink : "#efe6cc", offset: { x: -0.36 + j * 0.16, y: -0.03 + (j % 2) * 0.03, z: 0.12 } }));
    }
    return out;
  };
  // A ceiling fan: a down rod, a motor and four blades.
  let fanGeo = null;
  const fanGeometry = () => fanGeo || (fanGeo = (() => {
    const g = M.merge(M.box({ w: 0.08, h: 4.0, d: 0.08, color: "#3a3d42", offset: { x: 0, y: 2.0, z: 0 } }), M.box({ w: 0.42, h: 0.28, d: 0.42, color: "#5a3a22", offset: { x: 0, y: -0.05, z: 0 } }),
      ...[0, 1, 2, 3].map((k) => M.turnedY(M.box({ w: 1.3, h: 0.04, d: 0.3, color: "#8a5a2e", offset: { x: 0.85, y: -0.12, z: 0 } }), k * Math.PI / 2)));
    g.castShadow = false;
    return g;
  })());
  // A photograph's meshes, shared by every frame that hangs it: the frame, the picture and its caption.
  const photoGeos = new Map();
  const photoGeometry = (n, k) => {
    let g = photoGeos.get(n * 8 + k);
    if (g) return g;
    const PH = BL.genesisPhotos, pic = PH.picture(n, k), w = PH.PW, h = PH.PH;
    const face = { verts: [-w / 2, -h / 2, 0.05, w / 2, -h / 2, 0.05, w / 2, h / 2, 0.05, -w / 2, h / 2, 0.05], faces: [{ i: [0, 1, 2, 3], color: [0, 0, 0], emissive: 0 }], lines: [], castShadow: false };
    face.imageSurface = { asset: pic.asset, rect: [-w / 2, -h / 2, w, h] };
    const l = BL.factoryModels.label(pic.caption, "museum illustration, not a photograph", { height: 0.36, style: "plain" });
    g = { face, frame: M.box({ w: w + 0.18, h: h + 0.18, d: 0.06, color: "#2a2018" }), back: l.back, label: l.face };
    photoGeos.set(n * 8 + k, g);
    return g;
  };
  // The cave mouth over a gallery's way in, in its era's frame (+z toward the atrium): rough rock blocks across the
  // gallery's front from wall to wall and floor to roof, leaving an arch CAVE_MOUTH wide and high over the walk, in
  // three shades of the era's rock and placed by a hash so every cave is rough in its own way; the arch's edge glows
  // in the era's lamp colour, and a torch stands either side.
  const CAVE_MOUTH = { w: 10, h: 7.5 };
  const shade = (hex, k) => { const n = parseInt(hex.slice(1), 16), c = (v) => Math.max(0, Math.min(255, Math.round(v * k))); return `#${((c(n >> 16) << 16) | (c((n >> 8) & 255) << 8) | c(n & 255)).toString(16).padStart(6, "0")}`; };
  const caveMouth = (i, b, z1, H) => {
    const t = GW.ERAS[i].theme, cx = GW.LANE_X, rock = [], glow = [], tones = [shade(t.rock, 0.8), t.rock, shade(t.rock, 1.25)];
    const hash = (a, c) => { const v = Math.sin(a * 12.9898 + c * 78.233 + i * 37.719) * 43758.5453; return v - Math.floor(v); };
    const inside = (x, y) => ((x - cx) / (CAVE_MOUTH.w / 2)) ** 2 + (y / CAVE_MOUTH.h) ** 2 < 1;
    for (let x = b.x0 + 0.9; x < b.x1; x += 1.8) for (let y = 0.9; y < H; y += 1.8) {
      const jx = (hash(x, y) - 0.5) * 0.6, jy = (hash(y, x) - 0.5) * 0.6, size = 2 + hash(x + 1, y) * 0.8;
      if (inside(x + jx, y + jy) || inside(x + jx + size * 0.35, y + jy) || inside(x + jx - size * 0.35, y + jy) || inside(x + jx, y + jy + size * 0.4)) continue;
      rock.push(M.moved(M.bevelBox({ w: size, h: size, d: 1.2 + hash(x, y + 2) * 0.6, color: tones[Math.floor(hash(x + 3, y) * 3)], bevel: 0.25 }), x + jx, ISLAND_TOP + y + jy, z1 + 0.7));
    }
    // The arch's glowing rim: short bars round the opening's edge.
    const ink = glowHex(t.lamp);
    for (let a = 0.08; a < Math.PI; a += Math.PI / 22) {
      const x = cx + Math.cos(a) * (CAVE_MOUTH.w / 2 + 0.15), y = Math.sin(a) * (CAVE_MOUTH.h + 0.15);
      glow.push(M.moved(M.turnedZ(M.box({ w: 0.75, h: 0.12, d: 0.12, color: ink, emissive: 1.4 }), a + Math.PI / 2), x, ISLAND_TOP + y, z1 + 1.4));
    }
    const flames = [];
    for (const s of [-1, 1]) {
      const x = cx + s * (CAVE_MOUTH.w / 2 + 1.6);
      rock.push(M.moved(M.box({ w: 0.22, h: 2.6, d: 0.22, color: "#4c331d" }), x, ISLAND_TOP + 1.3, z1 + 1.9), M.moved(M.box({ w: 0.5, h: 0.3, d: 0.5, color: "#3a2a1a" }), x, ISLAND_TOP + 2.65, z1 + 1.9));
      flames.push({ x, y: 2.95, z: z1 + 1.9 });
    }
    return { rock: M.merge(...rock), glow: M.merge(...glow), flames };
  };
  let torchGeo = null;
  const torchFlame = () => torchGeo || (torchGeo = M.merge(M.box({ w: 0.36, h: 0.5, d: 0.36, color: "#ff8a1f", emissive: 2 }), M.box({ w: 0.2, h: 0.4, d: 0.2, color: "#ffe08a", emissive: 2.4, offset: { x: 0, y: 0.18, z: 0 } })));
  // The doorways between the eras, in a gallery's back wall: on the left the era before (or the hall from Era 0), on
  // the right the next (or the hall after Genesis), each a small rock arch round a glowing veil in its destination's
  // colour with its name over it. Walking into one goes there (updateDoors): a quick fade, and the Ooga stands
  // inside the other era's cave mouth, facing in.
  const eraDoors = (i, b, z0, t) => {
    for (const [side, to] of [[-1, i - 1], [1, i + 1]]) {
      const x = side < 0 ? b.x0 + 4 : b.x1 - 4, dest = to >= 0 && to < GW.ERAS.length ? GW.ERAS[to] : null;
      const ink = dest ? glowHex(dest.theme.lamp) : "#ffd27a", rockInk = t.rock, parts = [];
      for (const s of [-1, 1]) parts.push(M.moved(M.bevelBox({ w: 0.9, h: 4.6, d: 0.9, color: shade(rockInk, 0.85), bevel: 0.2 }), x + s * 1.9, ISLAND_TOP + 2.3, z0 + 0.5));
      parts.push(M.moved(M.bevelBox({ w: 4.7, h: 0.9, d: 0.9, color: shade(rockInk, 1.15), bevel: 0.2 }), x, ISLAND_TOP + 4.95, z0 + 0.5));
      place(createNode({ geometry: M.merge(...parts) }));
      const veil = place(createNode({ geometry: M.box({ w: 2.9, h: 4.1, d: 0.06, color: ink, emissive: 1.1 }), position: { x, y: ISLAND_TOP + 2.1, z: z0 + 0.3 }, sightHidden: true }));
      const name = dest ? `${side < 0 ? "\u2190 " : ""}ERA ${to}${side > 0 ? " \u2192" : ""}` : side < 0 ? "\u2190 THE HALL" : "THE HALL \u2192";
      const sub = dest ? `${dest.name} · ${dest.years}` : "back to the atrium";
      const l = BL.factoryModels.label(name, sub, { height: 0.55, style: "gold" }), sn = place(createNode({ position: { x, y: ISLAND_TOP + 5.9, z: z0 + 1.0 } }));
      addChild(sn, createNode({ geometry: l.back }), createNode({ geometry: l.face }));
      built.doors.push({ era: i, to: dest ? to : -1, x, z: z0 + 1.2, veil, phase: built.doors.length });
    }
  };
  // Walking into a doorway: the fade starts, and at its darkest the Ooga is moved (travel).
  const door = { fade: 0, dir: 0, to: -2, pending: null };
  const doorLocal = { x: 0, z: 0 }, doorAt = { x: 0, z: 0 }, doorAhead = { x: 0, z: 0 };
  const updateDoors = (dt, t) => {
    for (const d of built.doors) d.veil.glow = 0.8 + 0.4 * Math.sin(t * 2.2 + d.phase);
    if (door.dir) {
      const flip = typeof door.to === "string";
      door.fade = Math.max(0, Math.min(1, door.fade + door.dir * dt / (flip ? 0.7 : 0.3)));
      // Down the cenote and back up, the view turns upside down as it fades, and right way up as it comes back.
      if (flip) rollCamera(door.dir > 0 ? door.fade * Math.PI : Math.PI + (1 - door.fade) * Math.PI);
      if (door.dir > 0 && door.fade >= 1) { travel(door.to); door.dir = -1; }
      else if (door.dir < 0 && door.fade <= 0) { door.dir = 0; if (flip) camera.up = null; }
      return;
    }
    if (!avatar || bench.open || paper.open) return;
    const p = avatar.root.position, n = MU.bayAt(p.x, p.z);
    if (n < 0) return;
    MU.fromMuseum(n, p.x, p.z, doorLocal);
    for (const d of built.doors) if (d.era === n && Math.abs(doorLocal.x - d.x) < 1.5 && Math.abs(doorLocal.z - d.z) < 0.9) { door.to = d.to; door.dir = 1; audio.wake(); return; }
  };
  const rollUp = { x: 0, y: 1, z: 0 };
  const rollCamera = (r) => {
    const fx = camera.target.x - camera.position.x, fz = camera.target.z - camera.position.z, l = Math.hypot(fx, fz) || 1;
    rollUp.x = -fz / l * Math.sin(r); rollUp.y = Math.cos(r); rollUp.z = fx / l * Math.sin(r);
    camera.up = rollUp;
  };
  const flipTo = (where) => { if (door.dir) return; door.to = where; door.dir = 1; audio.wake(); };
  // Into era `to`'s cave, just inside its mouth, facing in (or back to the arrival in the atrium when `to` is -1).
  const travel = (to) => {
    if (!avatar) return;
    if (to === "golf") { if (golf) golf.stop(); arrive(GOLF_IN.x, GOLF_IN.z, Math.PI / 2); hud.toast("Glow Golf: nine holes under the hall. E at a tee to play."); return; }
    if (to === "hall") { if (golf) golf.stop(); const C = BL.genesisCavern.CENOTE; arrive(C.x + 3.6, C.z + 3.6, Math.atan2(-1, -1)); return; }
    if (to < 0) { arrive(); return; }
    const e = GW.ERAS[to];
    mu(to, GW.LANE_X, e.z1 - MU.OPEN - 4, doorAt); mu(to, GW.LANE_X, e.z1 - MU.OPEN - 8, doorAhead);
    arrive(doorAt.x, doorAt.z, Math.atan2(doorAhead.x - doorAt.x, doorAhead.z - doorAt.z));
    hud.toast(`Era ${to}: ${e.name} · ${e.years}`);
  };
  const drawDoorFade = (g) => { if (door.fade > 0) { g.fillStyle = `rgba(0,0,0,${door.fade.toFixed(3)})`; g.fillRect(0, 0, g.canvas.width, g.canvas.height); } };
  const buildGalleries = () => {
    const H = ROOF;
    built.caves = []; built.doors = []; built.torches = [];
    GW.ERAS.forEach((e, i) => inFrame(i, () => {
      const t = e.theme, b = MU.bays[i], z0 = e.z1 - b.depth, z1 = e.z1 - MU.OPEN, len = z1 - z0, mid = (z0 + z1) / 2, w = b.x1 - b.x0, cx = (b.x0 + b.x1) / 2;
      solid(w, 1.15, len, t.bank, cx, ISLAND_TOP - 0.576, mid);
      // The era's floor, walls and lamps (genesis-decor.js).
      const D = BL.genesisDecor, rect = { x0: b.x0, x1: b.x1, z0, z1 };
      place(createNode({ geometry: D.floorGeometry(i, rect, ISLAND_TOP + 0.001), sightHidden: true }));
      const fin = D.wallParts(M, i, [{ x0: b.x0 + 0.1, z0: z1, x1: b.x0 + 0.1, z1: z0, nx: 1, nz: 0 }, { x0: b.x1 - 0.1, z0: z0, x1: b.x1 - 0.1, z1: z1, nx: -1, nz: 0 }, { x0: b.x0, z0: z0 + 0.1, x1: b.x1, z1: z0 + 0.1, nx: 0, nz: 1 }], ISLAND_TOP);
      place(createNode({ geometry: M.merge(...fin.parts) }));
      if (fin.glow.length) place(createNode({ geometry: M.merge(...fin.glow), sightHidden: true }));
      // Period photographs between the motifs (genesis-photos.js): museum illustrations, each captioned as one.
      const PH = BL.genesisPhotos;
      // A wall piece under each motif (a clock, a pennant, a shelf of the era's things), one merged mesh a gallery.
      const decor = [];
      for (const sp of PH.decorSpots(b, z0, z1)) for (const g of wallPiece(i, sp.k)) decor.push(M.moved(M.turnedY(g, sp.ry), sp.x, ISLAND_TOP + PH.DECOR_Y, sp.z));
      if (decor.length) place(createNode({ geometry: M.merge(...decor), sightHidden: true }));
      // Ceiling fans over the walk, turning slowly (still in Calm).
      for (const u of [MU.OPEN + 6, MU.OPEN + (b.depth - MU.OPEN) * 0.6]) {
        const f = place(createNode({ position: { x: GW.LANE_X, y: H - 4.2, z: e.z1 - u }, sightHidden: true }));
        addChild(f, createNode({ geometry: fanGeometry() }));
        (built.fans = built.fans || []).push(f);
      }
      for (const sp of PH.spots(b, z0, z1)) {
        const pic = photoGeometry(i, sp.k), node = place(createNode({ position: { x: sp.x, y: ISLAND_TOP + PH.AT_Y, z: sp.z }, rotation: { x: 0, y: sp.ry, z: 0 }, sightHidden: true }));
        addChild(node, createNode({ geometry: pic.frame }), createNode({ geometry: pic.face }), createNode({ geometry: pic.back, position: { x: 0, y: -PH.PH / 2 - 0.32, z: 0.02 } }), createNode({ geometry: pic.label, position: { x: 0, y: -PH.PH / 2 - 0.32, z: 0.02 } }));
      }
      const pend = D.pendants(M, i, rect, ISLAND_TOP, H);
      place(createNode({ geometry: M.merge(...pend.cords), sightHidden: true }));
      place(createNode({ geometry: M.merge(...pend.bulbs), sightHidden: true }));
      // The era's own rock on its walls, just inside the museum's (so its colour shows), and its roof.
      for (const x of [b.x0 + 0.05, b.x1 - 0.05]) solid(0.1, H, len, t.rock, x, H / 2, mid);
      solid(w, H, 0.1, t.rock, cx, H / 2, z0 + 0.05);
      solid(w, 0.4, len, t.rock, cx, H - 0.2, mid);
      // The cave mouth: the gallery's front closed by a wall of rough rock in the era's colours, as the island's cave
      // mouths are, with an arched opening over the walk, a torch either side and the era's sign over the way in, so
      // from the atrium each era is a cave of its own (caveMouth). Inside, two doorways in the back wall lead on to
      // the next era and back to the one before (eraDoors).
      const mouth = caveMouth(i, b, z1, H);
      place(createNode({ geometry: mouth.rock }));
      place(createNode({ geometry: mouth.glow, sightHidden: true }));
      built.torches.push(...mouth.flames.map((f) => place(createNode({ geometry: torchFlame(), position: { x: f.x, y: ISLAND_TOP + f.y, z: f.z }, sightHidden: true }))));
      built.oldObstacles.push({ era: i, x0: b.x0, x1: GW.LANE_X - CAVE_MOUTH.w / 2, z0: z1, z1: z1 + 1.4 }, { era: i, x0: GW.LANE_X + CAVE_MOUTH.w / 2, x1: b.x1, z0: z1, z1: z1 + 1.4 });
      const sign = eraSign(e);
      hangSign(sign, GW.LANE_X, CAVE_MOUTH.h + 0.9 + sign.height / 2, z1 + 1.8, 0, sign.frame);
      eraDoors(i, b, z0, t);
      // (The old cave's hanging rocks, boulders, glowing seams and lamp posts are gone: the era's own dressing replaces them.)
      built.caves.push(e);
    }));
  };
  // The museum's legend: a huge white screen on the entrance hall's left wall, an original timeline in the style of a
  // "prehistory" fishbone chart, painted once from this visit's exhibits. Every exhibit hangs off the time line at its
  // date (a date only, never a claim of influence); gold marks a whitepaper citation, a gold ring documented influence,
  // grey context; the paper (31 October 2008) and the first block (January 2009) stand apart at the right. A tap on it,
  // or Space beside it, opens the menu (the timeline as buttons, openMenu).
  // The white screen stands in the atrium ahead of the arrival, facing it (south): 24 m wide.
  const LEGEND = { x: 0, y: 3.6, z: SOUTH - 26, w: 18, h: 6, ry: 0, at: { x: 0, z: SOUTH - 23.5 } };
  // The portal on the dais before the Satoshi bust: its stone frame and pale glow, and in it the Bitcoin whitepaper's
  // nine pages as one strip (whitepaper-pages-data.js, the island monolith's), a window on the strip that holds still
  // until someone reads it (openPaper, below). The strip loads with the "whitepaper" group (inline on the portable page).
  let glCanvas = null;
  // `doc` is the strip on the face: the whitepaper's (whitepaper-pages-data.js) or an essay's, laid out like it
  // (paintEssay); `face` the node's geometry showing it.
  const WPP = { scroll: 0, face: null, w: 1.6, h: 0, doc: null, paperFace: null, paperNode: null, essayFace: null, essayNode: null, essay: -1, portal: null, saved: 0 };
  const buildPaperPortal = () => {
    const portal = place(createNode({ position: { x: 0, y: ISLAND_TOP + 0.4, z: 0 } }));
    addChild(portal, createNode({ geometry: M.bevelBox({ w: 2.3, h: 3.2, d: 0.4, color: "#ece6d6" }), position: { x: 0, y: 1.6, z: -0.05 } }));
    const glow = createNode({ geometry: M.box({ w: 2.0, h: 2.85, d: 0.04, color: "#9ad8ff", emissive: 0.9 }), position: { x: 0, y: 1.6, z: 0.16 } });
    addChild(portal, glow);
    built.portal = glow; WPP.portal = portal;
    const show = () => {
      const data = BL.whitepaperPages;
      if (!data || !data.strip || !built) return;
      const w = WPP.w, h = w * data.page / data.width, image = new Image(), asset = { width: data.width, height: data.height, load: () => image };
      // A GPU that cannot hold the whole strip gets a scaled copy, as the island's does.
      const gl = renderer && renderer.kind === "webgl2" && glCanvas ? glCanvas.getContext("webgl2") : null;
      const limit = gl ? gl.getParameter(gl.MAX_TEXTURE_SIZE) : data.height;
      if (data.height > limit || data.width > limit) {
        const src = new Image();
        src.onload = () => { const k = Math.min(limit / data.width, limit / data.height), c = document.createElement("canvas"); c.width = Math.max(1, Math.floor(data.width * k)); c.height = Math.max(1, Math.floor(data.height * k)); c.getContext("2d").drawImage(src, 0, 0, c.width, c.height); asset.width = c.width; asset.height = c.height; image.src = c.toDataURL("image/png"); };
        src.src = data.strip;
      } else image.src = data.strip;
      const face = { verts: [-w / 2, -h / 2, 0.03, w / 2, -h / 2, 0.03, w / 2, h / 2, 0.03, -w / 2, h / 2, 0.03], faces: [{ i: [0, 1, 2, 3], color: [0, 0, 0], emissive: 0 }], lines: [], castShadow: false };
      face.imageSurface = { asset, rect: [-w / 2, 0, w, 0] };
      WPP.face = WPP.paperFace = face; WPP.h = h; WPP.doc = data;
      WPP.paperNode = createNode({ geometry: face, position: { x: 0, y: 1.6, z: 0.17 } });
      addChild(portal, WPP.paperNode);
      paperRect();
    };
    if (BL.whitepaperPages) show();
    else if (BL.deferred) BL.deferred.load("whitepaper").then(show).catch(() => {});
  };
  // The strip laid across the face, scrolled so `WPP.scroll` (strip pixels from its top) is at the face's top.
  const paperRect = () => {
    const data = WPP.doc, f = WPP.face;
    if (!f || !data) return;
    const k = WPP.h / data.page, rect = f.imageSurface.rect;
    rect[1] = WPP.h / 2 + WPP.scroll * k - data.height * k;
    rect[3] = data.height * k;
  };
  // The paper stays where the reader left it; it moves only while someone reads it (paper.target, strip pixels).
  const updatePaper = (dt) => {
    const data = WPP.doc;
    if (!WPP.face || !data) return;
    if (Math.abs(paper.target - WPP.scroll) < 0.5) return;
    WPP.scroll += (paper.target - WPP.scroll) * Math.min(1, dt * 10);
    paperRect();
  };
  // Reading the paper, as on the island's monolith: Space by the portal (or a tap on it) brings the view square onto
  // the page; the wheel, the arrows or a drag slide the real paper up and down, Space and PageDown glide a page, +
  // and - (or Shift and the wheel, or a pinch) zoom, a double tap zooms in and out, and Escape hands the view back.
  const paper = { open: false, target: 0, zoom: 1, pan: 0, eased: false, fill: true, saved: { x: 0, y: 0, z: 0, tx: 0, ty: 0, tz: 0, fov: 0 } };
  // As the island's monolith reads: a narrow field of view, and the page as wide as the window (`fill`, the camera on
  // the face's top band so the text slides up through it) or, with F or a double tap, the whole page in the frame.
  const READ_FOV = 0.55, READ_AIR = 1.06;
  const PF = { dist: 0, y: 0, tall: 0 };
  const paperFrame = () => {
    const size = renderer && renderer.size, aspect = size ? size.width / Math.max(1, size.height) : 1.6, tan = Math.tan(READ_FOV / 2);
    const fit = Math.max(WPP.h * READ_AIR / (2 * tan), WPP.w * READ_AIR / (2 * tan * aspect)), wide = WPP.w * 1.02 / (2 * tan * aspect), fill = paper.fill && 2 * wide * tan < WPP.h;
    PF.dist = (fill ? wide : fit) / paper.zoom; PF.tall = 2 * PF.dist * tan;
    PF.y = fill || paper.zoom > 1 ? PAPER_AT.y + WPP.h / 2 - Math.min(WPP.h, PF.tall) / 2 : PAPER_AT.y;
    return PF;
  };
  const PAPER_AT = { x: 0, y: ISLAND_TOP + 0.4 + 1.6, z: 0.2 };
  const scrollPaper = (px) => { const data = WPP.doc; if (!data) return; const band = Math.min(1, paperFrame().tall / WPP.h) * data.page; paper.target = Math.max(0, Math.min(data.height - band, paper.target + px)); };
  const turnPaper = (dir) => {
    const data = WPP.doc; if (!data) return;
    const step = data.page + data.gap, n = Math.round(paper.target / step) + dir;
    paper.target = Math.max(0, Math.min(data.count - 1, n)) * step;
  };
  const zoomPaper = (k) => { paper.zoom = Math.max(1, Math.min(3.2, paper.zoom * k)); };
  // Z steps through closer views of the same page (the scrolling is the same at each), and back out.
  const ZOOMS = [1, 1.5, 2.2, 3];
  const stepZoom = () => { const i = ZOOMS.findIndex((z) => z > paper.zoom + 0.01); paper.zoom = i < 0 ? 1 : ZOOMS[i]; };
  const openPaper = () => {
    if (paper.open || bench.open) return;
    if (!WPP.face || !WPP.doc) { hud.toast("The whitepaper is still loading"); return; }
    const s2 = paper.saved, cp = camera.position, ct = camera.target;
    s2.x = cp.x; s2.y = cp.y; s2.z = cp.z; s2.tx = ct.x; s2.ty = ct.y; s2.tz = ct.z; s2.fov = camera.fov;
    camera.fov = READ_FOV;
    paper.open = true; paper.eased = false; paper.zoom = 1; paper.pan = 0; paper.fill = true;
    if (autoplay) autoplay.stop();
    pilot.setActive(false); hud.tooltip.hide(); hud.hideHint(); stopVoice();
    if (avatar) { paper.avatarShown = avatar.root.visible; avatar.root.visible = false; }
    // The museum's own panel steps aside while the page is read; the reading line stays at the foot.
    const panel = document.getElementById("genesis"); if (panel) panel.style.visibility = "hidden";
    hud.whitepaperNav(true, COARSE ? "" : "Wheel or arrows scroll · Space next page · Z closer · F whole page · Esc to stop reading");
    showControls();
  };
  const closePaper = () => {
    if (!paper.open) return;
    paper.open = false;
    const s2 = paper.saved;
    camera.position.x = s2.x; camera.position.y = s2.y; camera.position.z = s2.z; camera.target.x = s2.tx; camera.target.y = s2.ty; camera.target.z = s2.tz;
    if (s2.fov) camera.fov = s2.fov;
    if (avatar) avatar.root.visible = paper.avatarShown !== false;
    hud.whitepaperNav(false, "");
    { const panel = document.getElementById("genesis"); if (panel) panel.style.visibility = ""; }
    pilot.setActive(true);
    showControls();
    if (WPP.essay >= 0) showPaperDoc();
  };
  // An essay from the Bitcoin Guide on the portal: painted once as a strip of pages like the whitepaper's
  // (genesis-essay-strip in paintEssay), shown in place of the paper while it is read, the paper back after.
  const showPaperDoc = () => {
    WPP.essay = -1;
    if (WPP.essayNode) WPP.essayNode.visible = false;
    if (WPP.paperNode) WPP.paperNode.visible = true;
    WPP.face = WPP.paperFace; WPP.doc = BL.whitepaperPages || null;
    WPP.scroll = paper.target = WPP.saved; paperRect();
  };
  const openEssay = (i) => {
    const e = BL.bitcoinGuideData && BL.bitcoinGuideData.essays[i];
    if (!e || !WPP.portal || paper.open || bench.open) return;
    const w = WPP.w, h = WPP.h || w * 1.294;
    // A fresh face for each essay: the strip painted on a canvas, handed to the renderer as an image (its texture is
    // made once per face, as the paper's is). The previous face is let go at the next housekeeping.
    const canvas = WPP.essayCanvas || (WPP.essayCanvas = document.createElement("canvas"));
    const gl = renderer && renderer.kind === "webgl2" && glCanvas ? glCanvas.getContext("webgl2") : null;
    const limit = Math.min(16384, gl ? gl.getParameter(gl.MAX_TEXTURE_SIZE) : 8192);
    const doc = BL.genesisEssayStrip.paint(canvas, e, h / w, limit), image = new Image();
    image.src = canvas.toDataURL("image/jpeg", 0.9);
    const face = { verts: [-w / 2, -h / 2, 0.03, w / 2, -h / 2, 0.03, w / 2, h / 2, 0.03, -w / 2, h / 2, 0.03], faces: [{ i: [0, 1, 2, 3], color: [0, 0, 0], emissive: 0 }], lines: [], castShadow: false };
    face.imageSurface = { asset: { width: doc.width, height: doc.height, load: () => image }, rect: [-w / 2, 0, w, 0] };
    face.imageSurface.doc = doc;
    if (!WPP.essayNode) { WPP.essayNode = createNode({ geometry: face, position: { x: 0, y: 1.6, z: 0.172 } }); addChild(WPP.portal, WPP.essayNode); }
    else WPP.essayNode.geometry = face;
    WPP.essayFace = face;
    if (WPP.essay < 0) WPP.saved = paper.target;
    WPP.essay = i; WPP.h = h;
    if (WPP.paperNode) WPP.paperNode.visible = false;
    WPP.essayNode.visible = true;
    WPP.face = WPP.essayFace; WPP.doc = WPP.essayFace.imageSurface.doc;
    WPP.scroll = paper.target = 0; paperRect();
    openPaper();
  };
  // The reading view: the camera square on the face, far enough back that the page's height fills the view, nearer
  // as it zooms. Eased in, then held.
  const updatePaperView = (dt) => {
    const k = view.calm || !paper.eased ? Math.min(1, dt * 8) : Math.min(1, dt * 10), F = paperFrame(), dist = F.dist;
    const lim = WPP.w / 2 * (1 - 1 / paper.zoom); paper.pan = Math.max(-lim, Math.min(lim, paper.pan));
    const c = camera.position, t = camera.target, ex = PAPER_AT.x + paper.pan, ey = F.y, ez = PAPER_AT.z + dist;
    c.x += (ex - c.x) * k; c.y += (ey - c.y) * k; c.z += (ez - c.z) * k;
    t.x += (ex - t.x) * k; t.y += (ey - t.y) * k; t.z += (PAPER_AT.z - t.z) * k;
    paper.eased = true;
  };
  const paperKey = (e) => {
    const k = e.key;
    if (k === "Escape") closePaper();
    else if (k === "ArrowDown" || k === "s" || k === "S") scrollPaper(140);
    else if (k === "ArrowUp" || k === "w" || k === "W") scrollPaper(-140);
    else if (k === " " || k === "PageDown" || k === "ArrowRight") turnPaper(1);
    else if (k === "PageUp" || k === "ArrowLeft") turnPaper(-1);
    else if (k === "Home") paper.target = 0;
    else if (k === "End") scrollPaper(1e9);
    else if (k === "f" || k === "F") paper.fill = !paper.fill;
    else if (k === "z" || k === "Z") stepZoom();
    else if ((k === "a" || k === "A") && paper.zoom > 1) paper.pan -= 0.12;
    else if ((k === "d" || k === "D") && paper.zoom > 1) paper.pan += 0.12;
    else if (k === "+" || k === "=") zoomPaper(1.25);
    else if (k === "-" || k === "_") zoomPaper(0.8);
    else return;
    e.preventDefault();
  };
  const buildLegend = () => {
    const W = 4096, H = Math.round(W * LEGEND.h / LEGEND.w), canvas = document.createElement("canvas"), g = canvas.getContext("2d");
    canvas.width = W; canvas.height = H;
    // The white screen places exhibits on a time line, so it is handed the dated exhibits only: a modern toy or game
    // has no date to stand at (genesis-catalogue.js MODERN).
    const count = BL.genesisTimeline.paint(g, W, H, { entries: catalogue.dated() }, host.records);
    const image = new Image();
    image.src = canvas.toDataURL("image/png");
    const face = { verts: [-LEGEND.w / 2, -LEGEND.h / 2, 0.03, LEGEND.w / 2, -LEGEND.h / 2, 0.03, LEGEND.w / 2, LEGEND.h / 2, 0.03, -LEGEND.w / 2, LEGEND.h / 2, 0.03], faces: [{ i: [0, 1, 2, 3], color: [0, 0, 0], emissive: 0 }], lines: [], castShadow: false };
    face.imageSurface = { asset: { width: W, height: H, load: () => image }, rect: [-LEGEND.w / 2, -LEGEND.h / 2, LEGEND.w, LEGEND.h] };
    const node = place(createNode({ position: { x: LEGEND.x, y: ISLAND_TOP + LEGEND.y, z: LEGEND.z }, rotation: { x: 0, y: LEGEND.ry, z: 0 } }));
    // Its two legs, and the box walkers meet under it.
    for (const dx of [-LEGEND.w / 2 + 1, LEGEND.w / 2 - 1]) solid(0.3, LEGEND.y - LEGEND.h / 2 + 0.2, 0.3, "#3b2a1a", LEGEND.x + dx, ISLAND_TOP + (LEGEND.y - LEGEND.h / 2 + 0.2) / 2, LEGEND.z - 0.15);
    built.obstacles.push({ x0: LEGEND.x - LEGEND.w / 2, x1: LEGEND.x + LEGEND.w / 2, z0: LEGEND.z - 0.4, z1: LEGEND.z + 0.2 });
    addChild(node, createNode({ geometry: M.bevelBox({ w: LEGEND.w + 0.4, h: LEGEND.h + 0.4, d: 0.16, color: "#d9d4c8", bevel: 0.05, offset: { z: -0.08 } }) }), createNode({ geometry: face }));
    // The same picture on its back, so it reads from both sides.
    addChild(node, createNode({ geometry: face, position: { x: 0, y: 0, z: -0.19 }, rotation: { x: 0, y: Math.PI, z: 0 } }));
    built.legend = place(createNode({ geometry: pickBox(LEGEND.w, LEGEND.h, 0.4), position: { x: LEGEND.x, y: ISLAND_TOP + LEGEND.y, z: LEGEND.z + 0.2 }, rotation: { x: 0, y: LEGEND.ry, z: 0 } }));
    built.legendItems = count;
  };
  // === Walking and the workbench ===================================================================================
  // The pilot and crew are made once per visit; the visitor's Ooga walks the whole visit.
  const walk = { on: false, prop: null, falls: 0, rides: 0, saved: { fov: 0, near: 0 } };
  const walkPose = { position: { x: 0, y: 0, z: 0 }, yaw: 0, pitch: 0.2, dist: 4.5 };
  let pilot = null, people = null, avatar = null, fx = null, footsteps = null, remotes = null, footing = null, props = null;
  let playerName = null, arrivedPilot = null;
  const propState = { uses: 0, last: "" };
  const NO_ACTORS = [];
  const mayPossess = (cave) => BL.net.mayDrive(cave.traits.name, BL.contributors.stateFor(cave.contributor) === "working");
  const mayPick = (c) => !BL.net.mayDrive(c.name, BL.contributors.stateFor(c) === "working");
  const feetOf = () => avatar ? avatar.root.position.y - avatar.baseY : 0;
  const groundFor = (x, z, feet) => footing.supportAt(x, z, feet);
  // The roof over (x, z): a gallery's own (its frame drawn at MUSEUM.SCALE, its roof slab's underside) or the
  // museum's over the atrium, so a jetpack stops under it rather than flying through.
  const GALLERY_ROOF = ISLAND_TOP * (1 - MU.SCALE) + (ROOF - 0.4) * MU.SCALE;
  const ceilingFor = (x, z) => inGolf(x, z) ? ISLAND_TOP + GC.h - 0.5 : MU.bayAt(x, z) >= 0 ? GALLERY_ROOF : ROOF;
  // Who else the visitor's Ooga meets: the other players, and the docents (genesis-docents.js), in one list kept in
  // place (the crew reads it every frame).
  const ACTORS = [];
  const outsideActors = () => {
    ACTORS.length = 0;
    const r = remotes ? remotes.actors() : NO_ACTORS;
    for (let i = 0; i < r.length; i++) ACTORS.push(r[i]);
    if (docents) for (let i = 0; i < docents.bodies.length; i++) ACTORS.push(docents.bodies[i]);
    return ACTORS;
  };
  const walkableFor = (ax, az, bx, bz, y, height, actor) => footing.walkable(ax, az, bx, bz, Math.min(actor.bodyRadius || 0.3, 0.3), y);
  // Space is the Ooga's (a jump, held to fly): on a keyboard E opens what it stands by (useHere), and only a touch
  // screen's act button opens it through the crew.
  const useNear = (x, z, reach, feet = feetOf()) => {
    if (!COARSE) return false;
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
  // Moves a frame's children from `first` on under one node per cluster of packEra's, each at its cluster's offset.
  // A child no kit call noted (a merged mesh at the origin, a holder node) goes with the cluster nearest its middle.
  const packFrame = (frame, first, pk, owner) => {
    const kids = frame.children.splice(first), holders = [];
    for (let g = 0; g < pk.groups; g++) holders.push(place(createNode({ position: { x: pk.dx[g], y: 0, z: pk.dz[g] } })));
    const mid = { x: 0, z: 0 }, near = (node) => {
      if (node.position.x || node.position.z) { mid.x = node.position.x; mid.z = node.position.z; return true; }
      if (node.geometry && node.geometry.verts && node.geometry.verts.length) { const b = BL.scene.boundsOf(node.geometry); mid.x = b.center[0]; mid.z = b.center[2]; return true; }
      for (const c of node.children) if (near(c)) { mid.x += node.position.x; mid.z += node.position.z; return true; }
      return false;
    };
    for (const kid of kids) {
      kid.parent = null;
      let g = owner.has(kid) ? owner.get(kid) : -1;
      if (g < 0 && near(kid)) {
        let best = Infinity;
        for (let i = 0; i < pk.group.length; i++) {
          const it = pk.items ? pk.items[i] : null;
          if (!it) break;
          const ex = Math.max(it.x0 - mid.x, 0, mid.x - it.x1), ez = Math.max(it.z0 - mid.z, 0, mid.z - it.z1), d = ex * ex + ez * ez;
          if (d < best) { best = d; g = pk.group[i]; }
        }
      }
      addChild(g < 0 ? frame : holders[g], kid);
    }
  };
  const SIGN_GROW = GW.SIGN_GROW;
  const buildExhibits = () => {
    // Every sign geometry an era makes is noted, so its nodes can step out of the workbench's picture (host.open).
    const EX = BL.genesisExhibits, signGeos = new Set(), label = (...a) => { const l = BL.factoryModels.label(...a); signGeos.add(l.face); signGeos.add(l.back); return l; };
    built.propNodes = {}; built.exhibitProps = []; built.trail = [];
    exhibitEra = -1;
    if (!EX) return;
    for (let n = 0; n < GW.ERAS.length; n++) inFrame(n, () => {
      const def = EX.eras[n];
      if (!def) return;
      const era = GW.ERAS[n];
      // The era's pieces packed closer together (genesis-world.js packEra): a dry run notes each piece, its clusters
      // are moved in toward the walk and the opening, and the real build counts the same calls, so each piece knows
      // its cluster. Afterwards each of the frame's new children moves under its cluster's node, keeping its own
      // coordinates (the exhibits' animations write them), and obstacles and props' spots shift with it.
      const { items, fixed, walls } = GW.eraItems(def.build, n, ISLAND_TOP, CHANNEL), pk = GW.packEra(items, { laneX: GW.LANE_X, anchorZ: era.z1 - MU.OPEN, fixed, walls });
      (built.packedBoxes = built.packedBoxes || [])[n] = items.slice(fixed).map((it, k) => { const g = pk.group[k + fixed]; return { x0: it.x0 + pk.dx[g], x1: it.x1 + pk.dx[g], z0: it.z0 + pk.dz[g], z1: it.z1 + pk.dz[g] }; });
      const frame = built.frames[n], first = frame.children.length, owner = new Map();
      let item = fixed;
      const shift = (g, x, z) => ({ x: x + pk.dx[g], z: z + pk.dz[g] });
      const note = (node) => { const g = pk.group[item++]; owner.set(node, g); return node; };
      const kitPlace = (node) => { place(node); if (node.position && (node.position.x || node.position.z)) note(node); return node; };
      const kitSolid = (...a) => note(solid(...a));
      const kit = {
        era, top: ISLAND_TOP, channel: CHANNEL, M, createNode, addChild, place: kitPlace, solid: kitSolid, label,
        // A short notice from an exhibit's update (a toast once the HUD is up; the kit is built before it).
        notify: (text) => { if (hud) hud.toast(text); },
        sign: (title, sub, x, y, z, yaw = 0, height = 0.6) => {
          // Drawn 1.4 times the era's asked size, so a label reads from the walk (it grows upward from where it stood).
          const l = label(title, sub, { height: height * SIGN_GROW, style: "plain" }), node = place(createNode({ position: { x, y: y + height * (SIGN_GROW - 1) / 2, z }, rotation: { x: 0, y: yaw, z: 0 } }));
          addChild(node, createNode({ geometry: l.back }), createNode({ geometry: l.face }));
          (built.signNodes = built.signNodes || []).push(node);
          return note(node);
        },
        obstacle: (x0, x1, z0, z1) => { const g = pk.group[item++]; built.oldObstacles.push({ era: n, x0: x0 + pk.dx[g], x1: x1 + pk.dx[g], z0: z0 + pk.dz[g], z1: z1 + pk.dz[g] }); },
        prop: (d0) => {
          // Its spot moves with its cluster; its pick box goes under the cluster's node in its own coordinates.
          const g = d0.at ? pk.group[item++] : -1, d = g < 0 ? d0 : { ...d0, at: { ...d0.at, ...shift(g, d0.at.x, d0.at.z) } };
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
          // An era's playable also names its cartridge (genesis-era-cartridges.js), its terminal kept.
          const useWith = BL.genesisEraCartridges ? BL.genesisEraCartridges.withCartridge(d.id, onUse) : onUse;
          // Registered where it stands in the museum; its tap box goes in the gallery's frame, in the era's coordinates.
          const prop = props.register({ ...d, era: n, onUse: useWith, at: muAt(n, d.at) });
          entry.prop = prop;
          built.exhibitProps.push(entry);
          const pick = d.pick || { w: 1, h: 1.4, d: 1 };
          const node = place(createNode({ geometry: pickBox(pick.w, pick.h, pick.d), position: { x: pick.x !== undefined ? pick.x : d0.at.x, y: (d.at.y || 0) + pick.h / 2, z: pick.z !== undefined ? pick.z : d0.at.z } }));
          if (g >= 0) owner.set(node, g);
          node.museumFrame = n;
          built.propNodes[prop.id] = node;
          return { ...d, era: n };
        }
      };
      def.build(kit);
      if (item !== pk.group.length) throw new Error(`genesis exhibits: era ${n}: its build made ${item} pieces, its dry run ${pk.group.length}`);
      packFrame(frame, first, pk, owner);
    });
    const signs = built.signNodes = built.signNodes || [], walk = (node) => { if (node.geometry && signGeos.has(node.geometry)) signs.push(node); for (const c of node.children) walk(c); };
    walk(root);
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
  // Exhibits in the catalogue's order (dated first, by date; then each era's modern toys and games).
  const byCatalogue = (list) => list.slice().sort((a, b) => catalogue.indexOf(a.prop.id) - catalogue.indexOf(b.prop.id));
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
    (built.signNodes = built.signNodes || []).push(n);
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
      const def = EX && EX.eras[e.n], mine = byCatalogue(built.exhibitProps.filter((x) => x.era === e.n));
      const board = textBoard({ kicker: `ERA ${e.n} · ${e.years.toUpperCase()}`, title: e.name, width: 3.4,
        body: [def && def.overview ? def.overview.summary : mine.length ? "Walk the gallery: every exhibit here shows its year." : "This gallery's exhibits are still being built."],
        list: mine.length ? [...mine.map((x) => ({ text: `${catalogue.shown(x.prop.id, x.def.year)} · ${x.def.title}${x.step ? `  ★ step ${x.step}` : ""}`, gold: !!x.step })),
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
  // A hanging banner: a gold rod and its cords, a cloth in the era's colour with a darker hem and two light stripes.
  const bannerCache = new Map();
  const bannerGeometry = (glow) => {
    let g = bannerCache.get(glow);
    if (!g) {
      g = M.merge(
        M.box({ w: 1.7, h: 0.08, d: 0.08, color: "#e8c35a", emissive: 0.4, offset: { x: 0, y: 9.4, z: 0 } }),
        M.box({ w: 0.03, h: 2.6, d: 0.03, color: "#3b2a1a", offset: { x: -0.7, y: 10.7, z: 0 } }), M.box({ w: 0.03, h: 2.6, d: 0.03, color: "#3b2a1a", offset: { x: 0.7, y: 10.7, z: 0 } }),
        M.box({ w: 1.5, h: 4.4, d: 0.04, color: "#2a2228", offset: { x: 0, y: 7.15, z: 0 } }),
        M.box({ w: 1.5, h: 0.3, d: 0.05, color: glow, emissive: 0.6, offset: { x: 0, y: 5.1, z: 0.01 } }),
        M.box({ w: 1.5, h: 0.08, d: 0.05, color: glow, emissive: 0.6, offset: { x: 0, y: 7.7, z: 0.01 } }),
        M.box({ w: 0.2, h: 3.6, d: 0.05, color: glow, emissive: 0.35, offset: { x: 0, y: 7.0, z: 0.012 } }));
      g.castShadow = false;
      bannerCache.set(glow, g);
    }
    return g;
  };
  // A game cabinet: a timber body, a lit screen in the era's colour, a control panel and a marquee, facing +z.
  const cabinetGeometry = (glow) => M.merge(
    M.box({ w: 1.1, h: 1.9, d: 0.9, color: "#3b2a1a", offset: { x: 0, y: 0.95, z: 0 } }),
    M.box({ w: 0.86, h: 0.66, d: 0.04, color: glow, emissive: 1.1, offset: { x: 0, y: 1.38, z: 0.46 } }),
    M.box({ w: 1.1, h: 0.12, d: 0.42, color: "#2a2018", offset: { x: 0, y: 1.0, z: 0.56 } }),
    M.box({ w: 0.14, h: 0.05, d: 0.14, color: "#e0452b", emissive: 0.8, offset: { x: -0.25, y: 1.08, z: 0.6 } }),
    M.box({ w: 0.14, h: 0.05, d: 0.14, color: "#ffd23a", emissive: 0.8, offset: { x: 0.2, y: 1.08, z: 0.6 } }),
    M.box({ w: 1.16, h: 0.3, d: 0.5, color: glow, emissive: 0.7, offset: { x: 0, y: 1.98, z: 0.2 } }));
  // Each era's "now showing" vignette at the end of its walk (genesis-vignettes.js), in its gallery's frame.
  const buildVignettes = () => {
    const V = BL.genesisVignettes, p = { x: 0, z: 0 };
    built.vignettes = GW.ERAS.map((e) => inFrame(e.n, () => {
      const at = V.spot({ ...MU, LANE_X: GW.LANE_X }, e), v = V.build({ M, createNode, addChild, label: BL.factoryModels.label, n: e.n, at, top: ISLAND_TOP, theme: glowHex(e.theme.lamp) });
      place(v.root);
      built.oldObstacles.push({ era: e.n, ...v.obstacle });
      // A game cabinet beside the stage where the era has one (genesis-games-plus.js): Space at it plays on the console.
      const game = BL.genesisGamesPlus && BL.genesisGamesPlus.GAMES.find((g) => g.era === e.n);
      if (game) {
        const cx = at.x - 4.3, cz = at.z;
        place(createNode({ geometry: cabinetGeometry(glowHex(e.theme.lamp)), position: { x: cx, y: ISLAND_TOP, z: cz } }));
        built.oldObstacles.push({ era: e.n, x0: cx - 0.6, x1: cx + 0.6, z0: cz - 0.5, z1: cz + 0.5 });
        props.register({ id: game.id, era: e.n, year: game.year, title: `${game.title}: play the cabinet`, label: `${game.title.toUpperCase()} · A MODERN GAME IN THE SPIRIT OF ${game.year}`, sourceKeys: [],
          hint: `play ${game.title} on the console`, at: muAt(e.n, { x: cx, y: ISLAND_TOP, z: cz + 1.3 }), reach: 2.2, onUse: () => ({ cartridge: game.id }) });
      }
      // Hanging banners over the walk, a pair by the way in and a pair halfway down: cloth in the era's colour on a
      // gold rod, its years and name across the top, high over the moving walkways.
      const glow = glowHex(e.theme.lamp), b = MU.bays[e.n], words = BL.factoryModels.label(e.years, e.name, { height: 0.5, style: "gold" });
      for (const u of [MU.OPEN + 4, MU.OPEN + (b.depth - MU.OPEN) / 2]) for (const side of [-1, 1]) {
        const bx = GW.LANE_X + side * 4, bz = e.z1 - u, node = place(createNode({ position: { x: bx, y: ISLAND_TOP, z: bz }, sightHidden: true }));
        addChild(node, createNode({ geometry: bannerGeometry(glow) }), createNode({ geometry: words.back, position: { x: 0, y: 8.55, z: 0.05 } }), createNode({ geometry: words.face, position: { x: 0, y: 8.55, z: 0.05 } }));
      }
      mu(e.n, at.x, at.z, p);
      return { v, x: p.x, z: p.z };
    }));
  };
  // Each gallery's period pieces along its side walls (genesis-era-items.js): clear of its packed exhibits, its
  // reserved plots and its vignette; one merged mesh a gallery, each piece in the walkers' way.
  const lavaGeos = new Map();
  // In Glow Golf's cavern the hall's warm light gives way to a jungle cave's: green and dim, the neon accents glowing.
  let golf = null;
  const BASE_LIGHT = { clear: renderOpts.clear.slice(), sky: renderOpts.sky.slice(), ground: renderOpts.ground.slice(), direct: renderOpts.direct.slice(), directStrength: renderOpts.directStrength, ambientFloor: renderOpts.ambientFloor, bloomStrength: renderOpts.bloomStrength };
  const UV_LIGHT = { clear: [0.02, 0.04, 0.02], sky: [0.42, 0.5, 0.36], ground: [0.15, 0.16, 0.09], direct: [0.95, 0.9, 0.7], directStrength: 0.3, ambientFloor: 0.3, bloomStrength: 0.6 };
  let lightIn = false;
  const updateGolfLight = () => {
    const q = avatar ? avatar.root.position : camera.target, now = inGolf(q.x, q.z);
    if (now === lightIn) return;
    lightIn = now;
    const L = now ? UV_LIGHT : BASE_LIGHT;
    for (const k of ["clear", "sky", "ground", "direct"]) for (let i = 0; i < 3; i++) renderOpts[k][i] = L[k][i];
    renderOpts.directStrength = L.directStrength; renderOpts.ambientFloor = L.ambientFloor; renderOpts.bloomStrength = L.bloomStrength;
    if (el.caption) showControls();
  };
  const updateLava = (t) => {
    for (const b of built.lava) {
      const k = 0.5 + 0.5 * Math.sin(t * b.speed * 2 + b.phase);
      b.n.position.y = b.y0 + (b.y1 - b.y0) * k;
      b.n.scale.y = 0.8 + 0.5 * Math.abs(Math.sin(t * b.speed * 3 + b.phase));
      b.n.scale.x = b.n.scale.z = 1.1 - 0.3 * (b.n.scale.y - 0.8);
    }
  };
  const buildEraItems = () => {
    built.lava = [];
    const EI = BL.genesisEraItems;
    for (const e of GW.ERAS) inFrame(e.n, () => {
      const boxes = (built.packedBoxes && built.packedBoxes[e.n] || []).concat(GW.reservedZones(e.n), [built.vignettes[e.n].v.obstacle]);
      const free = (x0, x1, z0, z1) => !boxes.some((o) => x0 < o.x1 + 0.3 && x1 > o.x0 - 0.3 && z0 < o.z1 + 0.3 && z1 > o.z0 - 0.3);
      const list = EI.layout(MU, e, GW.LANE_X, free);
      // Board games and furniture on the floor left open, clear of the wall pieces too.
      for (const q of list) { const h = Math.max(q.item.w, q.item.d) / 2; boxes.push({ x0: q.x - h, x1: q.x + h, z0: q.z - h, z1: q.z + h }); }
      list.push(...EI.floorLayout(MU, e, GW.LANE_X, free));
      const geo = EI.build(M, list, ISLAND_TOP);
      if (geo) place(createNode({ geometry: geo, sightHidden: true }));
      // The lava lamps' wax: three glowing blobs in each glass, drifting up and down (updateLava).
      for (const sp of EI.lavaSpots(list)) for (let k = 0; k < 3; k++) {
        let g = lavaGeos.get(sp.wax);
        if (!g) { g = M.bevelBox({ w: 0.11, h: 0.11, d: 0.11, color: sp.wax, emissive: 1.6, bevel: 0.04 }); lavaGeos.set(sp.wax, g); }
        const n = place(createNode({ geometry: g, position: { x: sp.x, y: ISLAND_TOP + sp.y0, z: sp.z }, sightHidden: true }));
        built.lava.push({ n, y0: ISLAND_TOP + sp.y0, y1: ISLAND_TOP + sp.y1, speed: 0.18 + k * 0.07 + (built.lava.length % 5) * 0.02, phase: k * 2.1 + built.lava.length });
      }
      for (const q of list) { const hw = (Math.abs(Math.sin(q.ry)) > 0.5 ? q.item.d : q.item.w) / 2, hd = (Math.abs(Math.sin(q.ry)) > 0.5 ? q.item.w : q.item.d) / 2; built.oldObstacles.push({ era: e.n, x0: q.x - hw, x1: q.x + hw, z0: q.z - hd, z1: q.z + hd }); }
      // The game tables seat a visitor against an Ooga: a grid board plays Five in a Row, any other Dots and Boxes
      // (genesis-games-plus.js BOARDS), on the console. Used from the side nearer the walk.
      const GPl = BL.genesisGamesPlus, year = +String(e.years).match(/\d{4}/)[0];
      let tables = 0;
      if (GPl && GPl.BOARDS) for (const q of list) {
        if (!/table$/.test(q.item.name)) continue;
        const grid = /chess|go table|tile/.test(q.item.name), game = GPl.BOARDS.find((g) => g.id === (grid ? "b-gomoku" : "b-dots"));
        const side = q.x < GW.LANE_X ? 1 : -1, walk = { x: q.x + side * (q.item.w / 2 + 0.5), y: ISLAND_TOP, z: q.z };
        props.register({ id: `table-${e.n}-${tables++}`, era: e.n, year, title: `${q.item.name[0].toUpperCase()}${q.item.name.slice(1)}: play ${game.title}`, label: `${game.title.toUpperCase()} TABLE · ${year}s GALLERY`,
          sourceKeys: [], hint: `sit down and play ${game.title} against an Ooga`, at: muAt(e.n, walk), reach: 1.8, onUse: () => ({ cartridge: game.id }) });
      }
      built.eraItems = (built.eraItems || 0) + list.length;
    });
  };
  // The game records board by the arrival: a tall framed board under GAME RECORDS; Space beside it (or a tap) opens
  // the visitor's best on every museum game (genesis-cartridge.js bests), a page of them at a time.
  const RECORDS = { x: ENTRY.x - 6, z: ENTRY.z - 2 };
  const buildRecords = () => {
    const words = BL.factoryModels.label("GAME RECORDS", "your best on every museum game · E here", { height: 0.7, style: "gold" });
    const node = place(createNode({ position: { x: RECORDS.x, y: ISLAND_TOP, z: RECORDS.z }, sightHidden: true }));
    addChild(node, createNode({ geometry: M.merge(
      M.box({ w: 2.6, h: 2.2, d: 0.14, color: "#1b1d24", offset: { x: 0, y: 2.3, z: 0 } }),
      M.box({ w: 2.8, h: 0.12, d: 0.2, color: "#e8c35a", emissive: 0.5, offset: { x: 0, y: 3.46, z: 0 } }),
      M.box({ w: 2.8, h: 0.12, d: 0.2, color: "#e8c35a", emissive: 0.5, offset: { x: 0, y: 1.14, z: 0 } }),
      ...[0, 1, 2, 3, 4].map((k) => M.box({ w: 2.0 - (k % 2) * 0.5, h: 0.1, d: 0.02, color: k ? "#7dff9e" : "#ffd23a", emissive: 1.1, offset: { x: -0.1, y: 3.0 - k * 0.38, z: 0.08 } })),
      M.box({ w: 0.14, h: 1.2, d: 0.14, color: "#3b2a1a", offset: { x: -1.0, y: 0.6, z: 0 } }), M.box({ w: 0.14, h: 1.2, d: 0.14, color: "#3b2a1a", offset: { x: 1.0, y: 0.6, z: 0 } })) }),
      createNode({ geometry: words.back, position: { x: 0, y: 3.95, z: 0.05 } }), createNode({ geometry: words.face, position: { x: 0, y: 3.95, z: 0.05 } }));
    built.obstacles.push({ x0: RECORDS.x - 1.4, x1: RECORDS.x + 1.4, z0: RECORDS.z - 0.2, z1: RECORDS.z + 0.2 });
    props.register({ id: "records", era: 7, year: 2009, title: "Game records", label: "GAME RECORDS · 1956-2009", sourceKeys: [], hint: "see your best on every museum game",
      at: { x: RECORDS.x, y: ISLAND_TOP, z: RECORDS.z + 1.4 }, reach: 2.4, onUse: () => {
        const C = BL.genesisCartridge, best = C.bests(), list = C.registry.list.slice().sort((a, b) => a.era - b.era || a.title.localeCompare(b.title));
        const lines = list.map((g) => `${g.title} (Era ${g.era}): ${best[g.id] ? best[g.id].toLocaleString() : "not played yet"}`), pages = [];
        for (let i = 0; i < lines.length; i += 8) pages.push({ caption: "Game records", title: i ? "More games" : "Your best on every museum game", text: lines.slice(i, i + 8) });
        return { board: { room: "Game records", pages, sources: [] } };
      } });
  };
  // The shrine round the statue: the Bitcoin network life size (genesis-network.js: node towers in a ring with
  // miners, glowing cables, big floor displays and the four-sided live screen hung overhead), and the light round the
  // bust (genesis-satoshi-fx.js). Space at a floor display, or a tap, opens how it all works.
  const buildCentre = () => {
    const NW = BL.genesisNetwork, S = built.atriumLayout.monument;
    built.network = NW.build({ M, createNode, addChild, place, top: ISLAND_TOP, statue: S, roof: ISLAND_TOP + ROOF });
    for (const b of built.network.layout.boxes) built.obstacles.push(b);
    const board = { room: "How the Bitcoin network works", pages: [...NW.PAGES, ...NW.MINING_PAGES], sources: [], links: [NW.RESOURCES] };
    for (const d of built.network.layout.displays) props.register({ id: `network-${d.id}`, era: 7, year: 2009, title: "How the Bitcoin network works", label: "THE BITCOIN NETWORK · SINCE 2009", sourceKeys: [], hint: "how the Bitcoin network works",
      at: { x: d.at.x, y: ISLAND_TOP, z: d.at.z }, reach: 2.2, onUse: () => ({ board }) });
    // The Bitcoin Guide hall round it (genesis-bitcoin-guide.js): Space at a station, or a tap on its parts, opens it.
    const BG = BL.genesisBitcoinGuide;
    built.guideHall = BG.build({ M, createNode, addChild, place, top: ISLAND_TOP, label: BL.factoryModels.label });
    for (const b of built.guideHall.layout.boxes) built.obstacles.push(b);
    built.guideStations = {};
    for (const st of built.guideHall.stations) {
      const id = `bg-${st.id}`;
      built.guideStations[id] = st;
      props.register({ id, era: 7, year: 2026, title: st.title, label: `${st.title.toUpperCase()} · BITCOINGUIDE.APP, 2026`, sourceKeys: [], hint: st.hint,
        at: { x: st.at.x, y: ISLAND_TOP, z: st.at.z }, reach: st.reach, onUse: () => ({ caption: st.title }) });
    }
    // Glow Golf (genesis-golf.js): the cavern down the cenote, a prop at each tee and the ways down and up.
    built.golf = BL.genesisGolf.build({ M, createNode, addChild, place, top: ISLAND_TOP, label: BL.factoryModels.label });
    for (const h of built.golf.holes) {
      const c = h.c, i = c.i;
      props.register({ id: `golf-tee-${i}`, era: 7, year: 2026, title: `Glow Golf, hole ${i + 1}: ${c.hole.name}`, label: `GLOW GOLF HOLE ${i + 1} · PAR ${c.hole.par} · 2026`, sourceKeys: [], hint: `play hole ${i + 1}, ${c.hole.name} (par ${c.hole.par})`,
        at: { x: GC.x + c.tee.x, y: ISLAND_TOP, z: GC.z + c.tee.z }, reach: 1.8, onUse: () => ({ caption: c.hole.name }) });
    }
    { const C = BL.genesisCavern.CENOTE;
      props.register({ id: "golf-down", era: 7, year: 2026, title: "Down the cenote: Glow Golf", label: "GLOW GOLF · DOWN THE CENOTE, 2026", sourceKeys: [], hint: "dive down the cenote to Glow Golf",
        at: { x: C.x + 3.4, y: ISLAND_TOP, z: C.z + 3.4 }, reach: 2.2, onUse: () => ({ caption: "Glow Golf" }) });
      props.register({ id: "golf-up", era: 7, year: 2026, title: "Up to the Genesis Hall", label: "GLOW GOLF · BACK UP TO THE HALL, 2026", sourceKeys: [], hint: "climb back up to the hall",
        at: { x: GOLF_IN.x - 1.2, y: ISLAND_TOP, z: GOLF_IN.z }, reach: 2, onUse: () => ({ caption: "The hall" }) }); }
    // The scale model of Ooga Booga Land (genesis-scale-model.js), by the arrival.
    const SM = BL.genesisScaleModel, SL = SM.layout();
    built.scaleModel = SM.build({ M, createNode, addChild, place, top: ISLAND_TOP, label: BL.factoryModels.label });
    built.obstacles.push(SL.box);
    props.register({ id: "scale-model", era: 7, year: 2026, title: "A scale model of Ooga Booga Land", label: "OOGA BOOGA LAND · A SCALE MODEL, 2026", sourceKeys: [], hint: "look round the scale model of Ooga Booga Land",
      at: { x: SL.use.x, y: ISLAND_TOP, z: SL.use.z }, reach: 2.6, onUse: () => ({ board: { room: "Ooga Booga Land", pages: SM.pages(), sources: [] } }) });
    // The cavern round it all (genesis-cavern.js): rough roof, stalactites, rock pillars, crystals, the cenote,
    // the carved frieze and sun discs, and eagles under the roof.
    built.cavern = BL.genesisCavern.build({ M, createNode, addChild, place, top: ISLAND_TOP, atrium: MU.atrium, roof: ROOF, pillars: MU.PILLARS, walls: WALLS });
    for (const b of BL.genesisCavern.layout().boxes) built.obstacles.push(b);
    built.campfire = BL.genesisCampfire.build({ M, createNode, addChild, place, top: ISLAND_TOP });
    for (const b of BL.genesisCampfire.layout().boxes) built.obstacles.push(b);
    for (const b of BL.genesisLumber.layout().boxes) built.obstacles.push(b);
    // The rock beanbags before the rock TV: E sits the Ooga down to watch, and E again stands it up.
    built.seats = built.guideHall.layout.seats.map((q) => {
      props.register({ id: `bg-seat-${q.i}`, era: 7, year: 2026, title: "A rock beanbag", label: "ROCK BEANBAG · 2026", sourceKeys: [], hint: "sit on the rock beanbag and watch the rock TV",
        at: { x: q.at.x, y: ISLAND_TOP, z: q.at.z }, reach: 1.7, onUse: () => ({ caption: "A rock beanbag" }) });
      return { x: q.x, y: ISLAND_TOP + 0.42, z: q.z, ry: q.ry, walkAt: { x: q.at.x, z: q.at.z }, floor: ISLAND_TOP, sitter: null };
    });
    built.satoshiFx = BL.genesisSatoshiFx.build({ M, createNode, addChild, place, label: BL.factoryModels.label, top: ISLAND_TOP, at: S });
  };
  const updateVignettes = (dt) => {
    const q = avatar ? avatar.root.position : camera.target, near2 = BL.genesisVignettes.NEAR ** 2;
    for (const s of built.vignettes) s.v.update(dt, (q.x - s.x) ** 2 + (q.z - s.z) ** 2 < near2, view.calm);
  };
  // Each overview board as a prop: Space beside it, or a tap, opens the era's panel.
  const registerOverviews = () => {
    const EX = BL.genesisExhibits;
    for (const o of built.overviews) {
      const e = GW.ERAS[o.era], year = firstYear(e.years), def = EX && EX.eras[o.era];
      const mine = byCatalogue(built.exhibitProps.filter((x) => x.era === o.era));
      const steps = built.trail.map((x) => `${x.step}. ${x.def.year} · ${x.def.title}${x.era === o.era ? " (this cave)" : ` (Era ${x.era})`}`);
      props.register({ id: `era${o.era}-overview`, era: o.era, year, title: `Era ${e.n} overview`, label: `ERA ${e.n} OVERVIEW · ${year}`, sourceKeys: ["whitepaper"], at: o.at, reach: 2.4,
        onUse: () => ({ board: { room: `Era ${e.n} - ${e.name} - ${e.years}`, sources: def && def.overview && def.overview.sourceKeys ? def.overview.sourceKeys : [], pages: [
          { caption: "This era", title: `${e.name} (${e.years})`, text: [def && def.overview ? def.overview.summary : "This cave's exhibits are still being built."] },
          ...(def && def.overview && def.overview.pages ? def.overview.pages : []),
          { caption: "Exhibits", title: "In this gallery, dated first", text: mine.length ? mine.map((x) => `${catalogue.shown(x.prop.id, x.def.year)} · ${x.def.title}${x.step ? ` · step ${x.step}` : ""}`) : ["No exhibits yet."] },
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
  let catalogue = null, workbench = null, timeline = null, cart = null, atrium = null, walkways = null, docents = null, autoplay = null, ambience = null, guide = null;
  const AUTO_STATE = { uses: 0, last: "" };
  const RIDE = { x: 0, z: 0, kind: "", era: -1 };
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
    // A pick box in a gallery stands under its cluster's node (packFrame), which adds its offset.
    if (node && node.museumFrame !== undefined) { const h = node.parent !== built.frames[node.museumFrame] ? node.parent.position : null; mu(node.museumFrame, node.position.x + (h ? h.x : 0), node.position.z + (h ? h.z : 0), c); c.y = node.position.y; }
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
      // The workbench takes over from the exhibit running itself; walking off it starts that again.
      if (autoplay) autoplay.stop();
      walk.prop = null;
      audio.wake();
      if (timeline && timeline.isOpen) timeline.close();
      // A cabinet or board whose use returns { cartridge } opens the console instead (genesis-cartridge.js); browsing
      // onto one from the workbench shows its note rather than leaving the workbench.
      const used = /^era3-room-/.test(id) ? { board: G.FINGERPRINTS } : props.use(prop, propState) || {};
      // Walking up to it (Space or a tap) plays it on the console; the menu and Previous/Next show its terminal.
      if (used.cartridge && (from === "walk" || !used.terminal && !used.board) && from !== "browse") { if (bench.open) host.close(); return openConsole(used.cartridge); }
      bench.pending = used;
      if (!bench.open) {
        const s2 = bench.saved, cp = camera.position, ct = camera.target;
        s2.x = cp.x; s2.y = cp.y; s2.z = cp.z; s2.tx = ct.x; s2.ty = ct.y; s2.tz = ct.z;
        s2.fov = camera.fov; s2.near = camera.near; s2.up = camera.up || null; s2.orthoMix = camera.orthoMix || 0; s2.orthoHeight = camera.orthoHeight || 0;
        camera.up = null; camera.orthoMix = camera.orthoHeight = 0;
        pilot.setActive(false); hud.tooltip.hide(); hud.hideHint(); stopVoice();
        // The visitor's Ooga steps out of the picture, so it never stands between the camera and the model, and so do
        // the exhibits' floating name signs (Billy's play: they hung in front of the model; the workbench's own
        // title names it). Both come back on close.
        if (avatar) { bench.avatarShown = avatar.root.visible; avatar.root.visible = false; }
        const signs = built.signNodes || [], seen = bench.signsShown = bench.signsShown || [];
        seen.length = signs.length;
        for (let i = 0; i < signs.length; i++) { seen[i] = signs[i].visible; signs[i].visible = false; }
      }
      bench.open = true; bench.id = id; bench.entry = entry; bench.prop = prop; bench.era = entry.era; bench.framing = false; bench.eased = false;
      bench.from = from; bench.opens++;
      if (!workbench.show(id)) { host.close(); return false; }
      return true;
    },
    session(id) {
      if (!bench.open || id !== bench.id) return null;
      const r = bench.pending || (/^era3-room-/.test(id) ? { board: G.FINGERPRINTS } : props.use(bench.prop, propState) || {});
      bench.pending = null;
      if (r.cartridge) { const c = BL.genesisCartridge && BL.genesisCartridge.find(r.cartridge); r.caption = `${c ? `${c.title}: ${c.label}` : "A console game"}. Close the workbench and press Space by the cabinet to play.`; }
      bench.term = r.terminal || null; bench.board = r.board || null;
      return { entry: bench.entry, terminal: bench.term, board: bench.board ? { room: bench.board.room, pages: bench.board.pages, sources: bench.board.sources || [] } : null, caption: !bench.term && !bench.board && r.caption ? r.caption : null };
    },
    run(id, line) {
      if (!bench.open || id !== bench.id || !bench.term || !String(line).trim()) return null;
      audio.wake();
      let out;
      try { out = bench.term.run(line) || { lines: [] }; } catch (err) { out = { lines: [`That command did not run: ${err.message}`] }; }
      if (out.entry) hud.toast(`Page ${out.entry.page} stamped: ${out.entry.code}`);
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
      const signs = built.signNodes || [], seen = bench.signsShown || [];
      for (let i = 0; i < signs.length && i < seen.length; i++) signs[i].visible = seen[i];
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
    // The hall makes no interface sounds (the host contract keeps the call).
    cue: () => {},
    toast: (text) => hud.toast(text)
  };
  // The cartridge console (genesis-cartridge.js): it holds the scene as the workbench and menu do; closing it hands
  // the walk back where it was (the camera never moved).
  const openConsole = (id) => {
    if (!cart || !BL.genesisCartridge.find(id)) { hud.toast("That console game is not installed yet"); return false; }
    // The eras' games draw with the arcade's kit (retro-games.js, the deferred "arcade" group on a hosted page).
    if (!BL.retroGames && BL.deferred && BL.deferred.load) {
      BL.deferred.load("arcade").then(() => { if (cart && !cart.isOpen) openConsole(id); }).catch(() => hud.toast("The console could not load its games"));
      return true;
    }
    audio.wake();
    pilot.setActive(false); hud.tooltip.hide(); hud.hideHint(); stopVoice();
    if (!cart.open(id, { still: view.calm })) { pilot.setActive(true); return false; }
    return true;
  };
  const consoleClosed = () => {
    if (!bench.open && !(timeline && timeline.isOpen)) pilot.setActive(true);
    if (overlayCanvas.focus) overlayCanvas.focus({ preventScroll: true });
  };
  // The atrium's centrepiece (genesis-atrium.js): the Steps toward Bitcoin as a spiral of plinths and a floor map of
  // the galleries, drawn from this visit's catalogue. Each step and the paper are props: Space by one, or a tap,
  // opens its exhibit's workbench.
  const buildAtrium = () => {
    const A = BL.genesisAtrium, L = A.layout({ entries: catalogue.entries, museum: MU, eras: GW.ERAS });
    atrium = A.build({ M, createNode, addChild, place, label: BL.factoryModels.label, top: ISLAND_TOP, layout: L, eraColor: (n) => GW.ERAS[n].theme.bank });
    // An obstacle with a rise stops a body only below its top; the statue's steps, shoulders and head are also
    // surfaces to stand on.
    for (const o of L.obstacles) built.obstacles.push(o.rise === undefined ? o : { ...o, top: ISLAND_TOP + o.rise });
    built.areas = L.areas.map((a) => ({ ...a, top: ISLAND_TOP + a.rise, dock: { x: L.monument.x, z: L.monument.z + L.monument.base / 2 + 1.2, facing: Math.PI } }));
    built.atriumProps = atrium.picks.map((p) => {
      const e = catalogue.get(p.id);
      // The paper on the portal is read where it stands (openPaper), not opened on a workbench.
      if (L.paper && p.id === L.paper.id) return { prop: props.register({ id: "whitepaper", era: e.era, year: e.year, title: e.title, label: `${e.title} (${e.year})`, sourceKeys: e.sources.map((x) => x.key),
        at: { x: p.at.x, y: ISLAND_TOP, z: p.at.z }, reach: 2.6, hint: `read ${e.title} (${e.year})`, onUse: () => ({ caption: e.title }) }), node: p.node };
      const prop = props.register({ id: `atrium-${p.id}`, era: e.era, year: e.year, title: e.title, label: `${e.title} (${e.year})`, sourceKeys: e.sources.map((x) => x.key),
        at: { x: p.at.x, y: ISLAND_TOP, z: p.at.z }, reach: 2.4, hint: e.trail ? `step ${e.step}, ${e.title} (${e.year})` : `${e.title} (${e.year}), after the paper`, opens: p.id, onUse: () => ({ caption: e.title }) });
      return { prop, node: p.node };
    });
    built.atriumLayout = L;
    // The plaza under the spiral: warm flagstones in rings with a gold inlay (genesis-decor.js).
    place(createNode({ geometry: BL.genesisDecor.plazaGeometry(15, ISLAND_TOP + 0.002), sightHidden: true }));
  };
  // The gallery walls (genesis-walls.js): one exhibition board high on each era's back wall, above its exhibits, with
  // that era's verified headlines and the museum's original posters and art. One picture a board, painted once a
  // visit; no light and nothing per frame.
  const buildWalls = () => {
    const GWL = BL.genesisWalls;
    if (!GWL) return;
    const B = GWL.BOARD, PX = B.px, PY = Math.round(PX * B.h / B.w);
    built.wallBoards = [];
    for (const r of MU.rects) {
      const out = MU.rotate(MU.bays[r.n].rot, 0, -1, { x: 0, z: 0 }), at = GWL.layout(r, out), era = GW.ERAS[r.n];
      const w = Math.min(B.w, at.wall - 4), h = w * B.h / B.w;
      const canvas = document.createElement("canvas"); canvas.width = PX; canvas.height = PY;
      const pieces = GWL.paintBoard(canvas.getContext("2d"), PX, PY, r.n, { name: era.name, years: era.years });
      const image = new Image(); image.src = canvas.toDataURL("image/png");
      const face = { verts: [-w / 2, -h / 2, 0.06, w / 2, -h / 2, 0.06, w / 2, h / 2, 0.06, -w / 2, h / 2, 0.06], faces: [{ i: [0, 1, 2, 3], color: [0, 0, 0], emissive: 0 }], lines: [], castShadow: false };
      face.imageSurface = { asset: { width: PX, height: PY, load: () => image }, rect: [-w / 2, -h / 2, w, h] };
      const node = place(createNode({ position: { x: at.x, y: ISLAND_TOP + B.y, z: at.z }, rotation: { x: 0, y: at.ry, z: 0 }, sightHidden: true }));
      addChild(node, createNode({ geometry: M.box({ w: w + 0.3, h: h + 0.3, d: 0.08, color: "#2a2018" }) }), createNode({ geometry: face }));
      // The board's pick box, so a tap opens its pieces up close (wallView).
      const pick = place(createNode({ geometry: pickBox(w, h, 0.3), position: { x: at.x, y: ISLAND_TOP + B.y, z: at.z }, rotation: { x: 0, y: at.ry, z: 0 } }));
      built.wallBoards.push({ era: r.n, x: at.x, y: ISLAND_TOP + B.y, z: at.z, ry: at.ry, w, h, px: PX, py: PY, pieces, pick });
    }
  };
  // The courtyard (genesis-courtyard.js): the atrium dressed as an Ooga crossroads, grass and sand paths to every
  // gallery and a clockwise loop, wooden signs, benches, plants and the "You are here" board. Built once a visit, no
  // lights and nothing per frame; its obstacles join the footing.
  const buildCourtyard = () => {
    const C = BL.genesisCourtyard, L = C.layout({ museum: MU, eras: GW.ERAS, entries: catalogue.entries, lane: GW.LANE_X });
    // The lawn's tufts (WebGL only), clear of the atrium's own things and the pillars.
    const lawn = renderer && renderer.kind === "canvas2d" ? null : { centre: 15.5,
      clear: (x, z) => !built.obstacles.some((o) => x > o.x0 - 0.4 && x < o.x1 + 0.4 && z > o.z0 - 0.4 && z < o.z1 + 0.4) && !MU.PILLARS.some((q) => Math.hypot(x - q.x, z - q.z) < q.r + 0.5) };
    C.build({ M, createNode, addChild, place, top: ISLAND_TOP, layout: L, hub: BL.hubModels, dressing: BL.dressing, atrium: MU.atrium, lawn,
      paintMap: (g, w, h) => C.paintMap(g, w, h, { museum: MU, eras: GW.ERAS, layout: L, atriumLayout: built.atriumLayout }) });
    for (const o of L.obstacles) built.obstacles.push(o);
    built.courtyard = L;
    // The moving walkways: round the loop and down each gallery's walk (genesis-walkways.js).
    const WW = BL.genesisWalkways;
    built.walkways = WW.layout({ museum: MU, loop: C.LOOP, eras: GW.ERAS, lane: GW.LANE_X });
    walkways = WW.build({ M, createNode, place, top: ISLAND_TOP, layout: built.walkways });
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
  // A Bitcoin Guide station or part: an essay reads on the portal, anything else opens its board in the panel.
  const openGuideItem = (it) => {
    audio.wake();
    if (it.essay !== undefined) { openEssay(it.essay); return; }
    const b = it.board();
    openPanel(Object.assign(makeBoard({ room: b.room, pages: b.pages, sources: b.sources || [], links: b.links }), { start: b.start || 0 }));
  };
  const openProp = (prop) => {
    audio.wake();
    if (prop.id === "legend") { openMenu(); return; }
    if (prop.id === "whitepaper") { openPaper(); return; }
    if (prop.id === "golf-down") { flipTo("golf"); return; }
    if (prop.id.startsWith("bg-seat-") && people) { const seat = built.seats[+prop.id.slice(8)]; if (seat.sitter) people.standPlayer(); else if (!people.sitPlayer(seat)) hud.toast("Someone is sitting there"); return; }
    if (prop.id === "golf-up") { flipTo("hall"); return; }
    if (prop.id.startsWith("golf-tee-") && golf) { golf.start(+prop.id.slice(9)); return; }
    const st = built.guideStations && built.guideStations[prop.id];
    if (st) { if (st.act) st.act(); else openGuideItem(st); return; }
    if (prop.opens) { host.open(prop.opens, "walk"); return; }
    if (catalogue && catalogue.get(prop.id) && host.open(prop.id, "walk")) return;
    const r = props.use(prop, propState);
    if (r.cartridge) { openConsole(r.cartridge); return; }
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
    // A walker standing on a moving walkway is carried along it (never into anything: the footing decides).
    const rider = people.player;
    if (rider && walkways) {
      const q = rider.root.position, feet = q.y - rider.baseY;
      if (feet - footing.supportAt(q.x, q.z, feet + 0.3) < 0.08 && walkways.carry(q.x, q.z, RIDE)) {
        const nx = q.x + RIDE.x * dt, nz = q.z + RIDE.z * dt;
        if (footing.walkable(q.x, q.z, nx, nz, Math.min(rider.bodyRadius || 0.3, 0.3), feet)) { q.x = nx; q.z = nz; walk.rides += dt; }
      }
    }
    // While the paper is read its view holds the camera (updatePaperView); the pilot leaves it alone.
    if (!paper.open && !(golf && golf.active)) pilot.update(dt);
    const driven = people.player;
    BL.net.setBody(driven ? driven.traits.name : null);
    if (driven) {
      const p = driven.root.position;
      BL.net.sendPose(p.x, p.y - driven.baseY, p.z, driven.root.rotation.y);
      BL.net.setHealth(driven.health.value, driven.health.stunned);
    }
    footsteps.update(driven);
    if (autoplay && !bench.open) autoplay.update(dt);
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
      // An exhibit with a terminal starts running itself; any other, or none, stops the one running.
      if (autoplay) {
        let r = null;
        if (near && near.id !== "legend" && !bench.open) { try { r = near.onUse(AUTO_STATE); } catch (err) { r = null; } }
        // What the visitor is looking at, in one line: the exhibit's own note on what its date marks, else its label.
        if (r && r.terminal) { el["auto-sub"].textContent = near.date || near.label || ""; autoplay.start(near, r.terminal, `${near.title} (${catalogue ? catalogue.shown(near.id, near.year) : near.year})`); }
        else autoplay.stop();
      }
      if (near) { hud.hint(`${COARSE ? "USE" : "E"}: ${near.id === "legend" ? "open the museum's timeline" : near.hint || `${near.title} (${catalogue ? catalogue.shown(near.id, near.year) : near.year})`}`, 600000); hud.setAct(near.id === "legend" ? "TIMELINE" : "OPEN"); }
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
    // A page with a picture (`paint`) draws it on the right and keeps its text to the left.
    const tw = page.paint ? W * 0.5 - 70 : W - 88;
    if (page.paint) page.paint(g, W * 0.5, 30, W * 0.5 - 30, H - 60);
    g.fillStyle = "#efe8da"; g.font = page.paint ? "21px system-ui, sans-serif" : "25px system-ui, sans-serif";
    let y = 104;
    for (const para of page.text) {
      for (const line of wrap(g, para, tw)) { g.fillText(line, 44, y); y += page.paint ? 27 : 33; }
      y += page.paint ? 8 : 14;
    }
  };
  // A panel of pages ({ room, pages, sources }): the exhibit's, or a prop's board.
  const makeBoard = (ex = G.FINGERPRINTS) => {
    const canvas = document.createElement("canvas"), base = [...ex.sources.map((k) => ({ href: GP.sourceOf(k).href, label: `${GP.sourceOf(k).label} ↗` })), ...(ex.links || [])];
    canvas.width = W; canvas.height = H;
    const b = {
      // The title is lettered from the sign alphabet (letters, digits, space and / : ! ? + - .); anything else is
      // turned into a dash or dropped.
      title: ex.room.replace(/[·–—]/g, "-").replace(/[^A-Za-z0-9 /:!?+\-.]/g, ""), help: "Arrows page · Escape closes and the walk carries on", canvas, count: ex.pages.length, index: 0,
      caption: ex.pages[0].caption, note: ex.pages[0].note !== undefined ? ex.pages[0].note : ex.pages[0].text.join(" "), version: 0, wide: true,
      links: base,
      go(i) {
        b.index = i; b.caption = ex.pages[i].caption; b.note = ex.pages[i].note !== undefined ? ex.pages[i].note : ex.pages[i].text.join(" ");
        b.links = ex.pages[i].links ? [...base, ...ex.pages[i].links] : base;
        paintPage(canvas, ex.pages[i]); b.version++;
      }
    };
    paintPage(canvas, ex.pages[0]);
    return b;
  };
  // A gallery wall's pieces up close, in the board dialog: one page a piece, from the one a tap pointed at, each
  // redrawn large (genesisWalls.paintPiece), with its caption and, for a clipping, where its wording was checked.
  const wallView = (wb, start = 0) => {
    const GWL = BL.genesisWalls, canvas = document.createElement("canvas"), n = wb.era;
    const b = {
      title: `ERA ${n} - ON THE PAGES AND THE WALLS`, help: "Arrows page · Escape closes and the walk carries on", canvas, count: wb.pieces, index: 0, start,
      caption: "", note: "", version: 0, wide: false, links: [],
      go(i) {
        const info = GWL.pieceInfo(n, i);
        b.index = i; b.caption = info.line1; b.note = info.type === "clip" ? `“${info.head}” · ${info.line2}` : info.line2;
        b.links = info.src ? [{ href: info.src, label: "Where this headline was checked ↗" }] : [];
        GWL.paintPiece(canvas, n, i); b.version++;
      }
    };
    return b;
  };
  // Which of a board's pieces a tap at screen point (px, py) points at: the one whose centre projects nearest it.
  const wallPieceAt = (wb, px, py) => {
    const L = BL.genesisWalls.slots(wb.era, wb.px, wb.py), c = Math.cos(wb.ry), s2 = Math.sin(wb.ry), out = { x: 0, y: 0 };
    let best = 0, dist = Infinity;
    L.pieces.forEach((p, i) => {
      const lx = ((p.x + p.w / 2) / wb.px - 0.5) * wb.w, ly = (0.5 - (L.top + L.ph / 2) / wb.py) * wb.h;
      if (!renderer.project(wb.x + lx * c, wb.y + ly, wb.z - lx * s2, out)) return;
      const d = (out.x - px) ** 2 + (out.y - py) ** 2;
      if (d < dist) { dist = d; best = i; }
    });
    return best;
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
    panel.go(panel.start || 0);
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
  const sounds = { paused: null, engine: null, calm: null, music: null };
  const syncAudio = () => {
    // No boat any more: the engine stays silent. Music holds only for the visitor's own pause.
    const paused = view.paused && !(view.reading && view.readingPaused), engine = false;
    if (paused !== sounds.paused) { sounds.paused = paused; audio.setPaused(paused); }
    if (engine !== sounds.engine) { sounds.engine = engine; audio.setEngine(engine); }
    if (view.calm !== sounds.calm) { sounds.calm = view.calm; audio.setCalm(view.calm); }
    if (view.music !== sounds.music) { sounds.music = view.music; audio.setMusic(view.music); }
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
    el.caption.hidden = !view.captions || !text || paper.open || lightIn;
    say(text);
  };
  const press = (button, on) => button && button.setAttribute("aria-pressed", String(!!on));
  const showControls = () => {
    el.pause.textContent = view.paused ? "Carry on" : "Pause";
    press(el.pause, view.paused);
    press(el.cc, view.captions); press(el.voice, view.voice); press(el.calm, view.calm);
    el.voice.hidden = !speech;
    el.caption.hidden = !view.captions || !el.caption.textContent || paper.open || lightIn;
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
    if (paper.open && !e.metaKey && !e.ctrlKey && !e.altKey) { paperKey(e); return; }
    if (golf && golf.active && !e.metaKey && !e.ctrlKey && !e.altKey) { if (golf.key(e)) e.preventDefault(); return; }
    if (bench.open || view.reading || (cart && cart.isOpen) || e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (k === "Escape") { if (guide && guide.escape()) { e.preventDefault(); return; } if (!pilot.escape()) leave(); }
    else if (k === "0") pilot.resetCamera();
    else if (k === "e" && avatar) { const q = avatar.root.position, prop = props.near(q.x, q.z, feetOf(), 1.0); if (prop) { e.preventDefault(); openProp(prop); } }
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
    if (demo.stamps !== lastStamps) lastStamps = demo.stamps;
    if (demo.tiles !== lastTiles || demo.broken !== lastBroken) {
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
      setCaption(`era-${era}`, `Era ${e.n}: ${e.name} (${e.years}).${e.room ? " Fingerprints and Time is on the left." : ""} ${n ? `${n} exhibits in this gallery; E by one (or a click) opens its workbench.` : "Its exhibits are still being built."}`);
    }
    lastEra = era;
  };
  // What runs this frame (genesis-world.js holdsFor): an explicit pause holds everything, the scene's clock included,
  // so nothing jumps on resume; the timeline menu and the workbench hold the walk, the crew, the desk's show, era
  // changes and captions, and only an open, unpaused workbench keeps its own exhibit's era running.
  const HOLD = { time: true, exhibit: true, ambient: true, walk: true, era: true }, holdState = { paused: false, bench: false, menu: false, console: false };
  const update = (dt) => {
    holdState.paused = view.paused; holdState.bench = bench.open; holdState.menu = !!(timeline && timeline.isOpen); holdState.console = !!(cart && cart.isOpen);
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
    if (paper.open) updatePaperView(dt);
    if (golf) { golf.update(dt, camera); updateGolfLight(); }
    if (h.ambient) {
      stepDemo(dt);
      built.portal.glow = 1 + Math.sin(sceneTime * 1.3) * (view.calm ? 0 : 0.25);
      built.pcScreen.glow = 1 + (view.calm ? 0 : (Math.floor(sceneTime * 2) & 1) * 0.2);
      if (atrium) atrium.update(dt, sceneTime, view.calm);
      if (walkways) walkways.update(dt, view.calm);
      if (built.vignettes) updateVignettes(dt);
      if (docents) docents.update(dt, avatar ? avatar.root.position.x : null, avatar ? avatar.root.position.z : 0);
      if (built.fans && !view.calm) for (const f of built.fans) f.rotation.y += dt * 1.2;
      if (built.network) built.network.update(dt, view.calm);
      if (built.lava && !view.calm) updateLava(sceneTime);
      if (built.torches && !view.calm) for (let k = 0; k < built.torches.length; k++) { const f = built.torches[k]; f.glow = 1 + Math.sin(sceneTime * 9 + k * 1.7) * 0.25 + Math.sin(sceneTime * 23 + k) * 0.12; f.scale.y = 1 + Math.sin(sceneTime * 11 + k * 2.3) * 0.12; }
      if (built.campfire) built.campfire.update(dt, sceneTime, view.calm);
      if (built.scaleModel) built.scaleModel.update(dt, view.calm);
      if (built.lumber) built.lumber.update(dt, view.calm);
      if (built.cavern) built.cavern.update(dt, view.calm);
      if (built.guideHall) built.guideHall.update(dt, view.calm, avatar ? avatar.root.position : null);
      if (built.satoshiFx) built.satoshiFx.update(dt, view.calm);
      if (guide) guide.update(dt, sceneTime);
      updatePaper(dt);
      if (ambience) { const q = avatar ? avatar.root.position : camera.target; ambience.update(dt, MU.bayAt(q.x, q.z), view.calm); }
    }
    // The cartridge console's game runs while it is open and the visitor has not paused.
    if (cart && cart.isOpen && !view.paused) cart.update(dt);
    if (h.walk) updateWalk(dt, sceneTime);
    if (built.doors) updateDoors(dt, sceneTime);
    const p = avatar ? avatar.root.position : ENTRY;
    renderOpts.shadowCenter.x = bench.open ? bench.focus.x : p.x; renderOpts.shadowCenter.z = bench.open ? bench.focus.z : p.z;
    orderLights(renderOpts.shadowCenter.x, renderOpts.shadowCenter.z);
    remotes.update(dt);
    fx.update(h.ambient ? dt : 0, sceneTime);
    hud.updateBoard(sceneTime);
  };
  const drawExtra = (g, project) => { remotes.drawNames(g, project); if (golf && avatar && inGolf(avatar.root.position.x, avatar.root.position.z)) golf.overlay(g); drawDoorFade(g); };
  const overlay = (dt) => fx.drawOverlay(dt, drawExtra);

  // --- Visit ----------------------------------------------------------------------------------------------------
  const tooltipFor = (hit) => !hit || bench.open ? "" : hit.owner.kind === "legend" ? "The Genesis timeline · tap for the museum's menu" : hit.owner.kind === "exhibit" ? "Fingerprints and Time (1991) · tap to read" : hit.owner.kind === "prop" ? `${hit.owner.prop.title} (${hit.owner.prop.year}) · tap to open its workbench` : hit.owner.kind === "guide" ? "Tock, the archivist Ooga (an invented guide)" : hit.owner.kind === "wall" ? "The era's press, posters and art · tap to see them up close" : hit.owner.kind === "bguide" ? (hit.owner.item.essay !== undefined ? "An essay from bitcoinguide.app · tap to read it" : "From bitcoinguide.app · tap to open") : "";
  const enter = (ctx) => {
    ({ game, world, go } = ctx);
    overlayCanvas = ctx.overlay;
    BL.hud.leaveTo("genesis", "hub");
    root = createNode();
    camera = createCamera({ fov: 62, near: 0.15, far: 240 });
    built = { obstacles: [], oldObstacles: [] };
    renderer = ctx.renderer; glCanvas = ctx.canvas;
    // Each era's gallery frame: its old cave turned and moved round the atrium (genesis-world.js MUSEUM).
    // Each gallery's frame scales its era's old cave to MUSEUM.SCALE, the old floor (bank height) kept at the museum's.
    built.frames = MU.bays.map((b) => place(createNode({ position: { x: b.tx, y: ISLAND_TOP * (1 - MU.SCALE), z: b.tz }, rotation: { x: 0, y: b.rot, z: 0 }, scale: { x: MU.SCALE, y: MU.SCALE, z: MU.SCALE } })));
    // The era files build first, so the galleries' boulders, the legend and the shared signage know them.
    buildMuseum(); buildCavern(); buildDesk();
    registerProps();
    buildExhibits(); buildCatalogue(); buildAtrium(); buildCourtyard(); buildWalls();
    buildGalleries(); buildLegend(); buildEraFrames(); buildTrail(); buildVignettes(); buildEraItems(); buildRecords(); buildCentre(); buildPaperPortal();
    registerOverviews();
    // The visit's footing: the floors and walls, plus whatever this visit's exhibits put in the way (each era's in
    // its old world, turned into the museum's).
    footing = GP.createFooting({ areas: FOOTING.areas.concat(built.areas || []), obstacles: FOOTING.obstacles.concat(built.obstacles, built.oldObstacles.map((o) => MU.boxToMuseum(o.era, o))) });
    buildProps();
    demo = G.createStampDemo();
    board = makeBoard();
    audio = BL.genesisAudio.create();
    sounds.paused = sounds.engine = sounds.calm = sounds.music = null;
    view.reading = view.readingPaused = false; view.paused = false; lastEra = -2;
    bench.open = false; bench.entry = bench.term = bench.board = null; bench.era = -1; bench.id = null; bench.framing = false; bench.opens = bench.runs = 0;
    view.calm = PREFERS_CALM.matches;
    view.music = false;
    sceneTime = 0; captionKey = ""; lastStamps = 0; lastPhase = ""; lastTiles = -1; lastBroken = false;
    renderOpts.lightCount = Math.min(LIGHTS.length, BL.glRenderer.POINT_LIGHT_CAPACITY);
    orderLights(ENTRY.x, ENTRY.z);
    hud = BL.hud.create({ signal: ctx.signal, roster: BL.contributors.activeRoster, catalog: M.SWAG, tierColors: M.TIER_COLORS, renderIcon: BL.hud.renderIcon, lootEnabled: false });
    const hooks = {};
    renderer = ctx.renderer;
    input = BL.interact.create({ canvas: ctx.canvas, renderer: ctx.renderer, camera, hooks });
    const target = (node, owner) => { input.add(node, owner); targets.push(node); };
    target(built.lectern, { kind: "exhibit", priority: 1 });
    target(built.lecternLight, { kind: "exhibit", priority: 1 });
    target(built.guide.parts.torso, { kind: "guide" });
    target(built.guide.parts.head, { kind: "guide" });
    target(built.legend, { kind: "legend", priority: 1 });
    for (const t of built.guideHall.targets) target(t.node, { kind: "bguide", item: t, priority: 1 });
    for (const a of built.atriumProps) target(a.node, { kind: "prop", prop: a.prop, priority: 1 });
    for (const id of ["pc", "drives", "book"]) target(built[id], { kind: "prop", prop: props.get(id), priority: 1 });
    for (const id of Object.keys(built.propNodes)) target(built.propNodes[id], { kind: "prop", prop: props.get(id), priority: 1 });
    for (const o of built.overviews) target(o.pick, { kind: "prop", prop: props.get(`era${o.era}-overview`), priority: 1 });
    for (const wb of built.wallBoards || []) target(wb.pick, { kind: "wall", board: wb, priority: 1 });
    // Walking: the pilot and crew for the visitor's Ooga (as the arcade's are).
    const viewFov = camera.fov;
    // The camera and its target keep inside the museum: the atrium or a gallery, under the roof. A point outside
    // goes to the nearest point of the room it is nearest.
    const keepInside = (p, pad) => {
      if (MU.inside(p.x, p.z, -pad) || (p.x > GOLF_BOX.x0 + pad && p.x < GOLF_BOX.x1 - pad && p.z > GOLF_BOX.z0 + pad && p.z < GOLF_BOX.z1 - pad)) return;
      let bx = p.x, bz = p.z, best = Infinity;
      for (const r of [MU.atrium, ...MU.rects, GOLF_BOX]) {
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
        outsideActors, outsideActorHeight: BL.remotePlayers.BODY_HEIGHT, groundAt: groundFor, walkable: walkableFor, ceilingAt: ceilingFor, useNear };
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
    // The docents (genesis-docents.js): the island's apes in the museum's uniform.
    // Each gallery's docent knows its steps toward Bitcoin (the trail, in order) and its cabinet game.
    const docentGuide = GW.ERAS.map((e) => ({ steps: built.trail.filter((x) => x.era === e.n).sort((a, b) => a.step - b.step).map((x) => x.def.title),
      game: (BL.genesisGamesPlus && (BL.genesisGamesPlus.GAMES.find((g) => g.era === e.n) || {}).title) || null }));
    // The gorillas' woodcutting camp beside the fire (genesis-lumber.js): chopping, splitting, feeding the fire.
    golf = BL.genesisGolf.controller(built.golf, {
      top: ISLAND_TOP,
      standAt: (x, z, aim) => { if (!avatar) return; avatar.root.position.x = x; avatar.root.position.z = z; avatar.root.position.y = avatar.baseY + footing.supportAt(x, z); avatar.root.rotation.y = aim; },
      hold: (on) => { pilot.setActive(!on); if (on) { hud.tooltip.hide(); hud.hideHint(); } },
      say: (text) => hud.toast(text)
    });
    lightIn = true; updateGolfLight();
    built.lumber = BL.genesisLumber.build({ M, createNode, addChild, place, top: ISLAND_TOP, footing, fx, flare: built.campfire.flare });
    docents = BL.genesisDocents.create({ eras: GW.ERAS, museum: MU, lane: GW.LANE_X, entry: ENTRY, root, footing, fx, addChild, createNode, guide: docentGuide });
    // Tess, Ooga Booga Land's guide (genesis-guide.js on hub-guide.js): she greets a visitor once a page and walks the
    // road to Bitcoin gallery by gallery; a tap on her brings the tour at any time.
    const S0 = built.atriumLayout.monument;
    guide = BL.genesisGuide.create({ parent: root, input, fx, camera, pilot, visitor: () => people && people.player, world, hud, coarse: COARSE, landing: true,
      quality: () => renderer.quality, busy: () => bench.open || view.reading || !!(cart && cart.isOpen), targets: {} },
      { museum: MU, eras: GW.ERAS, lane: GW.LANE_X, statue: { x: S0.x, z: S0.z }, mining: { x: built.network.layout.centre.x, z: built.network.layout.centre.z + built.network.layout.radius } });
    remotes = BL.remotePlayers.create({ root, crew: people, fx });
    footsteps = BL.footsteps.create();
    walk.on = false; walk.prop = null; walk.falls = 0; walk.rides = 0;
    propState.uses = 0; propState.last = "";
    // Taps open what they hit (a workbench straight away: no need to walk up); while a workbench is open the clear
    // stage passes no taps or drags to the hall behind it.
    Object.assign(hooks, {
      onHover: (hit, p) => { const t = tooltipFor(hit); if (t) hud.tooltip.show(t, p.x, p.y); else hud.tooltip.hide(); },
      onHoverMove: (hit, p) => { const t = tooltipFor(hit); if (t) hud.tooltip.show(t, p.x, p.y); else hud.tooltip.hide(); },
      onTap: (hit, p) => {
        audio.wake();
        if (bench.open || view.reading) return;
        if (hit && hit.owner.kind === "tess" && guide) { guide.tap(); return; }
        if (guide && guide.holding) return;
        if (hit && hit.owner.kind === "exhibit") openInfo();
        else if (hit && hit.owner.kind === "legend") openMenu();
        else if (hit && hit.owner.kind === "prop") openProp(hit.owner.prop);
        else if (hit && hit.owner.kind === "bguide") openGuideItem(hit.owner.item);
        else if (hit && hit.owner.kind === "wall") openPanel(wallView(hit.owner.board, wallPieceAt(hit.owner.board, p.x, p.y)));
      },
      hoverIgnore: () => bench.open ? null : pilot.hooks.hoverIgnore(),
      onOrbit: (dx, dy) => {
        if (golf && golf.active) { golf.turn(dx); return; }
        if (paper.open) { const data = WPP.doc, tall = paperFrame().tall, H = Math.max(1, overlayCanvas.clientHeight), k = data ? tall / WPP.h * data.page / H : 1; scrollPaper(-dy * k); paper.pan -= dx * tall / H; return; }
        if (!bench.open) pilot.hooks.onOrbit(dx, dy);
      },
      onZoom: (factor, gesture, px, py, shift, delta) => {
        if (paper.open) { if (delta && !shift) scrollPaper(delta * 1.2); else zoomPaper(1 / factor); return; }
        if (!bench.open) pilot.hooks.onZoom(factor, gesture, px, py);
      },
      onDoubleTap: (hit) => { if (paper.open) { paper.fill = !paper.fill; paper.zoom = 1; return; } if (!bench.open) pilot.hooks.onDoubleTap(hit); }
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
      else if (action === "wp-next" && paper.open) turnPaper(1);
      else if (action === "wp-prev" && paper.open) turnPaper(-1);
      else if (action === "wp-close") closePaper();
    });
    for (const id of ["caption", "pause", "info", "cc", "voice", "calm", "chain", "chainWrap"]) el[id] = document.getElementById(`genesis-${id === "chainWrap" ? "chain-wrap" : id}`);
    el.chain.replaceChildren(...G.PAGES.map(() => { const li = document.createElement("li"); li.hidden = true; return li; }));
    el.help = document.getElementById("genesis-help");
    // The exhibit the visitor stands at runs itself (genesis-autoplay.js), its steps in the panel.
    for (const id of ["auto", "auto-title", "auto-sub", "auto-fill", "auto-screen", "auto-step", "auto-try"]) el[id] = document.getElementById(`genesis-${id}`);
    el["auto-try"].textContent = COARSE ? "OPEN: try it yourself" : "E: try it yourself";
    // The hall's quiet ambience (genesis-ambience.js), started by the visitor's first key or tap.
    ambience = BL.genesisAmbience.create();
    for (const type of ["keydown", "pointerdown"]) window.addEventListener(type, () => { if (ambience) ambience.wake(); }, { signal: ctx.signal });
    autoplay = BL.genesisAutoplay.create({
      show: (title, lines, i, n) => { el.auto.hidden = false; el["auto-title"].textContent = title; el["auto-screen"].textContent = lines.join("\n"); el["auto-step"].textContent = n ? `step ${i} of ${n}` : ""; el["auto-fill"].style.width = `${n ? Math.round(i / n * 100) : 0}%`; },
      hide: () => { el.auto.hidden = true; }
    });
    el.help.textContent = COARSE ? "Stick walks · OPEN by an exhibit, or tap it · Timeline for every invention" : "W A S D walk · Space jumps (hold to fly) · E by an exhibit (or a click) opens its workbench · G or Timeline: every invention · P pause · I info · C captions · Calm · Esc leave";
    // The workbench and the timeline menu (their own modules, on the host).
    workbench = BL.genesisWorkbench.create(host, document.getElementById("genesis-bench"));
    timeline = BL.genesisTimeline.create(host, document.getElementById("genesis-menu"));
    BL.genesisCartridge.checkAll();
    cart = BL.genesisCartridge.create({ root: document.getElementById("genesis-cart"), onClose: consoleClosed });
    window.addEventListener("resize", () => { if (bench.open) { bench.eased = false; workbench.resize(); } }, { signal: ctx.signal });
    window.addEventListener("pointerdown", audio.wake, { signal: ctx.signal });
    window.addEventListener("keydown", audio.wake, { signal: ctx.signal });
    setCaption("arrive-museum", "The Genesis museum: the ideas that came before Bitcoin, in galleries round this hall in date order, clockwise from your left. The white timeline ahead lists every invention (or press G). Walk up to any exhibit and press E, or click it, to open its workbench.");
    paintChain();
    showControls();
    hud.setStats(game.state);
    arrive();
    Object.assign(scene, { root, camera, input, debug: { get demo() { return demo; }, get docents() { return docents; }, get guide() { return guide; }, view, built, wallPieceAt, board, openInfo, toggle, walk, footing, props, pilot, get avatar() { return avatar; }, paper, WPP, openEssay, openPaper, closePaper, openGuideItem,
      openProp, pause, bench, host, get catalogue() { return catalogue; }, get workbench() { return workbench; }, get timeline() { return timeline; }, get cart() { return cart; }, get atrium() { return atrium; }, openConsole,
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
    closePaper();
    if (golf) { golf.dispose(); golf = null; }
    camera.up = null;
    if (built && built.lumber) built.lumber.dispose();
    if (guide) guide.dispose();
    if (autoplay) autoplay.stop();
    if (ambience) ambience.dispose();
    stopVoice();
    host.close();
    if (cart) cart.dispose();
    if (workbench) workbench.dispose();
    if (timeline) timeline.dispose();
    workbench = timeline = catalogue = cart = atrium = walkways = docents = autoplay = ambience = guide = null;
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
    if (docents) docents.dispose();
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
    demo = board = audio = built = input = hud = game = world = go = overlayCanvas = renderer = null;
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
      walking: walk.on, falls: walk.falls, rides: +walk.rides.toFixed(2), chevrons: walkways ? walkways.chevrons : 0, uses: propState.uses, fx: fx.stats ? fx.stats() : null, crew: people ? people.stats() : null };
  };
  const scene = BL.deferred.scene("genesis", {
    id: "genesis", wip: true, renderOpts, root: null, camera: null, input: null, debug: null,
    enter, update, overlay, onDonation, onKey, onLootCleared: () => {}, leave: leaveScene, stats,
    voiceZone: "genesis.voyage",
    liveGeometry: (set) => {
      if (built && built.guide) set.add(built.guide.headOpen).add(built.guide.headClosed);
      if (avatar) set.add(avatar.headOpen).add(avatar.headClosed);
      if (remotes) remotes.liveGeometry(set);
      if (docents) docents.liveGeometry(set);
      if (guide) guide.liveGeometry(set);
      if (built && built.lumber) built.lumber.liveGeometry(set);
    },
    get inMotion() { return !!demo && walk.on; }
  });
})();
