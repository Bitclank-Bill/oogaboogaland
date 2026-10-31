// The Genesis Voyage (work in progress, `?wip=genesis`): a boat trip through the ideas that came before Bitcoin.
// From the harbour (the whitepaper stone's portal lands here) the visitor drives a boat down a wide lane of open water
// past one island per era, in date order, each with its years on a sign (genesis-world.js). The boat changes to a
// type the era's dossier dates as available then. Era 3's island holds Fingerprints and Time, where Tock the archivist
// Ooga runs a stamp desk: pages are fingerprinted, each stamp links to the last, the newest is published, and a
// changed page breaks every link after it. The ride's rules, words and sources are in genesis-voyage.js.
//
// Driving is the default: W A S D or the arrows (or the left stick), Shift (or Boost) for speed; genesis-boat.js moves
// the boat. Tour (Enter) hands the wheel to an autopilot that visits every dock in order and waits at each; Enter
// again takes it back. Space pauses everything. The camera follows the boat, looks where the visitor drags and turns
// to an exhibit at its dock; Fixed view swaps to a still vantage per area. Opening the panel holds the boat and the
// desk; closing it carries on as before. Calm (reduced motion, on when the system asks) stills the bob, the swell
// and the desk's flying tiles.
//
// Hop off and walk (marked section below): Jump out (J, or the button) by any ledge stops the boat where it is, with
// no prompt, and the visitor walks as their own Ooga (the one the portal brought, `world.pilot`) through the shared
// pilot and crew, as the arcade and factory scenes do. Walking up a boarding ramp, or J by the boat, re-boards; a fall
// into the water comes back to the ledge's dock. Space by a prop uses it (genesis-props.js holds the props' rules).
(() => {
  "use strict";
  const BL = window.BL = window.BL || {};
  const G = BL.genesisVoyage, M = BL.models, GP = BL.genesisProps, GW = BL.genesisWorld, GB = BL.genesisBoat;
  const { createNode, addChild, removeChild, createCamera } = BL.scene;
  const { clamp } = BL.math;
  const COARSE = window.matchMedia("(pointer: coarse)").matches;
  const PREFERS_CALM = window.matchMedia("(prefers-reduced-motion: reduce)");

  // Fingerprints and Time was laid out in the old cavern's coordinates; SZ moves it (and its ledges, props and
  // lights) onto Era 3's island.
  const SZ = GW.ROOM_SHIFT.z, ROOM_ERA = GW.ERAS.findIndex((e) => e.room === "fingerprints");
  const DESK = { x: -7.2, y: 0.55, z: -25.2 + SZ }, CHAIN = { x: -10.55, y: 3.7, z0: -21.6 + SZ, step: 1.75 }, PAPER = { x: -10.5, y: 2.2, z: -31.6 + SZ };
  const ROOM_Z = GW.MOUTH_Z;
  const ISLAND_TOP = 0.545;
  // The Tour: every era's dock in order; Fingerprints and Time waits a whole stamp cycle, the other islands a moment.
  const TOUR = GW.tourCourse();
  const STATIONS = GW.ERAS.map((e, i) => ({ at: TOUR.stops[i], dwell: e.room ? G.STAMP_CYCLE + 1.5 : 6, exhibit: e.id,
    look: e.room ? { x: DESK.x, y: 1.7, z: DESK.z } : { x: e.island.x, y: 2.2, z: e.island.z } }));
  // Fixed view: one still vantage for the harbour and one per island, from across the lane.
  const FIXED_VIEWS = { harbour: { eye: { x: 7.5, y: 5.2, z: 8 }, look: { x: -0.5, y: 0.8, z: -2.5 } },
    eras: GW.ERAS.map((e) => ({ eye: { x: e.island.x - e.side * 22, y: 9, z: e.z + 14 }, look: { x: e.island.x, y: 1.2, z: e.z } })) };
  const TILE_COLORS = (codes) => codes.map((c) => "#" + c.slice(0, 6));

  // Out on the water it is a bright afternoon; the shadow box follows the boat.
  const renderOpts = { clear: [0.55, 0.7, 0.86], sky: [0.62, 0.76, 0.92], ground: [0.22, 0.3, 0.32],
    direct: [1, 0.95, 0.86], directStrength: 0.75, ambientFloor: 0.48, sun: { x: 0.35, y: 1, z: 0.25 },
    shadowCenter: { x: 0, y: 0, z: 0 }, shadowExtent: 40, bloomStrength: 0.3,
    lights: new Float32Array(BL.glRenderer.POINT_LIGHT_CAPACITY * 8), lightCount: 0 };
  // The harbour's lamps, the desk and the newspaper, then one warm lamp by each island's year sign.
  const LIGHTS = [[-4, 3.2, 3, 11, 1.25, 0.95, 0.6], [4, 3.2, -2, 10, 1.1, 0.85, 0.55],
    [-6.5, 3.4, -25 + SZ, 12, 1.35, 1.05, 0.7], [-9, 3.2, -31.5 + SZ, 7, 1, 0.9, 0.7],
    ...GW.ERAS.map((e) => [e.sign.x, 3.2, e.sign.z, 9, 1.2, 0.95, 0.65])];

  // --- Hop off and walk: where an Ooga may stand ------------------------------------------------------------------
  // The harbour's dock, the room's ledge with the desk's step, and two boarding ramps down to the boat: one at the
  // dock and one from the desk's step toward the stop. The statue, the desk and the newspaper stand in the way.
  const FOOTING = {
    areas: [
      { id: "dock", x0: -6.6, x1: -1.8, z0: -2, z1: 7, top: 0.355, dock: { x: -3.2, z: 1.5, facing: -Math.PI / 2 } },
      { id: "room", x0: -12, x1: -7.6, z0: -34, z1: -19, top: 0.545, dock: { x: -6, z: -26.6, facing: Math.PI / 2 } },
      { id: "step", x0: -7.6, x1: -5, z0: -27.7, z1: -22.7, top: 0.545, dock: { x: -6, z: -26.6, facing: Math.PI / 2 } },
      { id: "dock-ramp", x0: -1.8, x1: -0.7, z0: 2.4, z1: 3.6, ramp: { from: 0.355, to: 0.2, axis: "x" }, boards: true },
      { id: "room-ramp", x0: -5, x1: -3.4, z0: -26.6, z1: -25.6, ramp: { from: 0.545, to: 0.25, axis: "x" }, boards: true }
    ],
    obstacles: [{ x0: -5.6, x1: -2.8, z0: 6.15, z1: 7.05 }, { x0: -8.5, x1: -5.9, z0: -25.9, z1: -24.5 }, { x0: -10.6, x1: -10.4, z0: -33.1, z1: -30.1 },
      { x0: -10.2, x1: -9, z0: -21.2, z1: -20 }, { x0: -10.3, x1: -9.3, z0: -32.9, z1: -31.9 }, { x0: -6.2, x1: -5.4, z0: -24, z1: -23.2 }]
  };
  // The room's ledges and obstacles move with it to Era 3's island; every other island gets a square of ground
  // and a boarding ramp from its shore down to its dock, so Jump out works at any island.
  for (const a of FOOTING.areas) if (a.id !== "dock" && a.id !== "dock-ramp") { a.z0 += SZ; a.z1 += SZ; if (a.dock) a.dock = { ...a.dock, z: a.dock.z + SZ }; }
  for (let i = 1; i < FOOTING.obstacles.length; i++) { FOOTING.obstacles[i].z0 += SZ; FOOTING.obstacles[i].z1 += SZ; }
  for (const e of GW.ERAS) {
    if (e.room) continue;
    const half = e.island.rx * 0.62, shore = e.island.x - e.side * half, foot = e.dock.x + e.side * 1.0;
    FOOTING.areas.push({ id: `era-${e.n}`, x0: e.island.x - half, x1: e.island.x + half, z0: e.z - half, z1: e.z + half, top: ISLAND_TOP,
      dock: { x: shore + e.side * 0.8, z: e.z, facing: e.side > 0 ? Math.PI / 2 : -Math.PI / 2 } });
    // `from` is the height at x0 and `to` at x1: the low end is always the foot, at the dock.
    FOOTING.areas.push(e.side > 0
      ? { id: `era-${e.n}-ramp`, x0: foot, x1: shore, z0: e.z - 0.6, z1: e.z + 0.6, ramp: { from: 0.25, to: ISLAND_TOP, axis: "x" }, boards: true }
      : { id: `era-${e.n}-ramp`, x0: shore, x1: foot, z0: e.z - 0.6, z1: e.z + 0.6, ramp: { from: ISLAND_TOP, to: 0.25, axis: "x" }, boards: true });
    // The year sign's posts stand in the way.
    FOOTING.obstacles.push({ x0: e.sign.x - 0.4, x1: e.sign.x + 0.4, z0: e.sign.z - 2.2, z1: e.sign.z + 2.2 });
  }
  // How near land Jump out works, and how near the boat J re-boards.
  const JUMP_REACH = 8, BOARD_REACH = 6;
  // The first props, on the room's ledge: the office PC, the hard-drive plinth and Tock's book by the desk.
  const PROPS = { pc: { x: -9.6, y: 0.545, z: -20.6 + SZ }, drives: { x: -9.8, y: 0.545, z: -32.4 + SZ }, book: { x: -5.8, y: 0.545, z: -23.6 + SZ } };
  const WALK_PRESETS = { dock: { yaw: 0.6, pitch: 0.3, dist: 6, target: { x: -3.2, y: 1, z: 1.5 } } };

  let root = null, camera = null, input = null, hud = null, game = null, world = null, go = null, overlayCanvas = null;
  let ride = null, course = null, demo = null, built = null, board = null, audio = null, driver = null, controls = null;
  const targets = [];
  // `mode` is "drive" (the visitor has the wheel) or "tour" (the autopilot follows the course); `paused` holds both.
  const view = { yaw: 0, pitch: 0, look: 0, fixed: false, calm: false, captions: true, voice: false, readingPaused: false, reading: false, paused: false, mode: "drive", boost: false };
  const chase = { x: 0, y: 0, z: 0, tx: 0, ty: 0, tz: 0, ready: false };
  let lastEra = -2, lastDock = -2, splashT = 0;
  const boat = { x: 0, z: 0, heading: 0 }, eye = { x: 0, y: 0, z: 0 };
  let sceneTime = 0, captionKey = "", lastStamps = 0, lastPhase = "", lastTiles = -1, lastBroken = false;
  const el = {};

  // --- Building -------------------------------------------------------------------------------------------------
  const place = (node) => { addChild(root, node); return node; };
  const solid = (w, h, d, color, x, y, z, emissive = 0) => place(createNode({ geometry: M.box({ w, h, d, color, emissive }), position: { x, y, z } }));
  const buildCavern = () => {
    // The harbour cavern: stone walls and roof round the dock, its front wall open onto the lane at the mouth.
    solid(26, 0.4, 19, "#18242c", -1, -0.6, 0.3);
    for (const [w, d, x, z] of [[1.2, 19.8, -12.6, 0.3], [1.2, 19.8, 10.6, 0.3], [26, 1.2, -1, 9.6]]) solid(w, 7, d, "#3a3530", x, 3.4, z);
    solid(26, 0.6, 19.8, "#2a2622", -1, 7.1, 0.3);
    solid(14, 7, 1.2, "#3a3530", -6.5, 3.4, ROOM_Z);
    solid(5, 7, 1.2, "#3a3530", 9.5, 3.4, ROOM_Z);
    solid(6.5, 2.2, 1.2, "#3a3530", 3.75, 5.8, ROOM_Z);
    // The dock, the harbour's lanterns and the statue the visitor came through.
    solid(4.8, 0.35, 9, "#6b4a2b", -4.2, 0.18, 2.5);
    for (let i = 0; i < 6; i++) solid(4.8, 0.04, 0.08, "#4c331d", -4.2, 0.37, -1.6 + i * 1.6);
    const statue = place(createNode({ position: { x: -4.2, y: 0.36, z: 6.6 } }));
    addChild(statue, createNode({ geometry: M.bevelBox({ w: 2.2, h: 3.1, d: 0.4, color: "#ece6d6" }), position: { x: 0, y: 1.9, z: 0 } }));
    addChild(statue, createNode({ geometry: M.box({ w: 1.5, h: 2.3, d: 0.06, color: "#9ad8ff", emissive: 0.9 }), position: { x: 0, y: 1.75, z: -0.23 } }));
    addChild(statue, createNode({ geometry: M.box({ w: 2.8, h: 0.35, d: 0.9, color: "#8a8174" }), position: { x: 0, y: 0.17, z: 0 } }));
    built.portal = statue.children[1];
    for (const [x, z] of [[-1.6, -1.8], [-6.6, -1.8], [-6.6, 6], [7.5, 2], [7.5, -6]]) {
      solid(0.14, 2.4, 0.14, "#3b2a1a", x, 1.2, z);
      solid(0.36, 0.36, 0.36, "#ffcf7a", x, 2.55, z, 1.4);
    }
    // The room's ledge, the desk, the chain wall and the newspaper, on Era 3's island.
    solid(4.6, 0.55, 15, "#4a4038", -9.9, 0.27, -26.5 + SZ);
    solid(2.6, 0.55, 5, "#4a4038", -6.3, 0.27, -25.2 + SZ);
    const label = BL.factoryModels.label;
    const roomSign = label("FINGERPRINTS AND TIME · 1991", "Era 3 · Cypherpunks and Timestamps", { height: 1.4, style: "gold" });
    const sign = place(createNode({ position: { x: -11.6, y: 5.6, z: -26.5 + SZ }, rotation: { x: 0, y: Math.PI / 2, z: 0 } }));
    addChild(sign, createNode({ geometry: roomSign.back }), createNode({ geometry: roomSign.face }));
    solid(0.3, 5, 0.3, "#3b2a1a", -11.9, 2.6, -29.5 + SZ); solid(0.3, 5, 0.3, "#3b2a1a", -11.9, 2.6, -23.5 + SZ);
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
    built.lectern = place(createNode({ geometry: M.bevelBox({ w: 0.7, h: 1.1, d: 0.5, color: "#7a5534" }), position: { x: -5.6, y: 1.1, z: -22.6 + SZ } }));
    built.lecternLight = place(createNode({ geometry: M.box({ w: 0.5, h: 0.06, d: 0.35, color: "#ffe9a8", emissive: 1.3 }), position: { x: -5.6, y: 1.68, z: -22.6 + SZ } }));
  };
  // The sea: one wide sheet of water under the lane, a darker one out to the horizon, and a merged scatter of crests.
  const buildSea = () => {
    solid(110, 0.1, 360, "#1f6f93", 0, -0.08, -150, 0.12);
    solid(900, 0.1, 1100, "#174f6b", 0, -0.14, -150, 0.04);
    const crests = [], rand = BL.math.mulberry32(9);
    for (let i = 0; i < 520; i++) {
      const x = (rand() - 0.5) * 100, z = 2 - rand() * 330;
      if (z > ROOM_Z - 1 && (x < -11 || x > 9)) continue;
      crests.push(M.moved(M.box({ w: 0.9 + rand() * 1.4, h: 0.02, d: 0.12, color: "#d7f1ff", emissive: 0.4 }), x, 0, z));
    }
    place(createNode({ geometry: M.merge(...crests), sightHidden: true }));
    // A splash ring, shown briefly when the boat changes to the next era's type.
    built.splash = place(createNode({ geometry: M.box({ w: 3.4, h: 0.04, d: 3.4, color: "#ffffff", emissive: 0.8 }), visible: false }));
  };
  // One island per era: a rocky, grassy mound (Era 3's long one carries the room), a year sign facing the lane, a
  // lamp, a pier down to the dock and a few rocks. Unbuilt islands say so on their sign.
  const islandGeometry = M.cached(() => M.lathe({ profile: [[0.82, -2.4], [1, -0.3], [0.98, 0.35], [0.9, 0.545], [0, 0.545]], segments: 12,
    color: (t) => t < 0.5 ? "#6b6258" : t < 0.75 ? "#8a7a5c" : "#5f9a46" }));
  const buildIslands = () => {
    const label = BL.factoryModels.label;
    built.islands = [];
    for (const e of GW.ERAS) {
      const node = place(createNode({ geometry: islandGeometry(), position: { x: e.island.x, y: 0, z: e.z }, scale: { x: e.island.rx, y: 1, z: e.island.rz } }));
      const sign = label(e.years.toUpperCase(), `Era ${e.n} · ${e.name}`, { height: 1.2, style: e.room ? "gold" : "plain" });
      const sn = place(createNode({ position: { x: e.sign.x, y: 3.1, z: e.sign.z }, rotation: { x: 0, y: e.sign.facing, z: 0 } }));
      addChild(sn, createNode({ geometry: sign.back }), createNode({ geometry: sign.face }));
      for (const dz of [-1.9, 1.9]) solid(0.22, 2.6, 0.22, "#3b2a1a", e.sign.x, 1.6, e.sign.z + dz);
      solid(0.3, 0.3, 0.3, "#ffcf7a", e.sign.x - e.side * 0.6, 2.2, e.sign.z + 2.4, 1.4);
      if (!e.room) {
        for (let k = 0; k < 4; k++) {
          const a = k * 1.7 + e.n, r = e.island.rx * 0.45;
          solid(0.8 + (k % 2) * 0.5, 0.6 + (k % 3) * 0.3, 0.9, "#7d746a", e.island.x + Math.cos(a) * r, ISLAND_TOP + 0.3, e.z + Math.sin(a) * r);
        }
      }
      built.islands.push(node);
    }
  };
  // The driven boat's models, one per type the dossiers date for the eras (genesis-world.js BOATS); all original and
  // unbranded. Only the current era's is shown.
  const buildBoats = () => {
    const kind = (name) => { const n = createNode({ visible: false }); addChild(built.boat, n); built.boats[name] = n; return n; };
    const add = (n, geo, x, y, z) => addChild(n, createNode({ geometry: geo, position: { x, y, z } }));
    built.boats = {};
    // A wooden rowing skiff with two benches and a pair of oars.
    const skiff = kind("skiff");
    add(skiff, M.bevelBox({ w: 1.5, h: 0.5, d: 3.4, color: "#7b4f2c" }), 0, 0.2, 0);
    add(skiff, M.box({ w: 1.2, h: 0.12, d: 3, color: "#3b2717" }), 0, 0.4, 0);
    for (const z of [-0.8, 0.6]) add(skiff, M.box({ w: 1.3, h: 0.1, d: 0.35, color: "#a77a4a" }), 0, 0.58, z);
    for (const x of [-1.1, 1.1]) add(skiff, M.box({ w: 1.2, h: 0.06, d: 0.12, color: "#c49a6c" }), x, 0.55, 0.1);
    // A small open runabout: moulded hull, low windscreen and an anonymous outboard.
    const runabout = kind("runabout");
    add(runabout, M.bevelBox({ w: 1.8, h: 0.6, d: 3.8, color: "#e9e4da" }), 0, 0.25, 0);
    add(runabout, M.box({ w: 1.5, h: 0.12, d: 3.3, color: "#5b6d78" }), 0, 0.5, 0);
    add(runabout, M.box({ w: 1.4, h: 0.35, d: 0.06, color: "#9fd6ea", emissive: 0.3 }), 0, 0.75, 0.5);
    add(runabout, M.box({ w: 0.45, h: 0.8, d: 0.4, color: "#2b2b2b" }), 0, 0.5, -2.05);
    // A personal watercraft: short hull, seat and handlebars (ridden seated here).
    const craft = kind("watercraft");
    add(craft, M.bevelBox({ w: 1.1, h: 0.5, d: 2.8, color: "#f2c230" }), 0, 0.22, 0);
    add(craft, M.box({ w: 0.5, h: 0.22, d: 1.1, color: "#23282d" }), 0, 0.58, -0.3);
    add(craft, M.box({ w: 0.9, h: 0.06, d: 0.08, color: "#23282d" }), 0, 0.9, 0.55);
    add(craft, M.box({ w: 0.08, h: 0.35, d: 0.08, color: "#23282d" }), 0, 0.72, 0.55);
    // A rigid inflatable boat: a shallow hull, two round side tubes and a small console, in an invented teal.
    const rib = kind("rib");
    add(rib, M.bevelBox({ w: 1.5, h: 0.45, d: 4, color: "#55606b" }), 0, 0.18, 0);
    for (const x of [-0.95, 0.95]) add(rib, M.bevelBox({ w: 0.55, h: 0.55, d: 4.1, color: "#1f8c8c" }), x, 0.42, 0);
    add(rib, M.box({ w: 0.7, h: 0.75, d: 0.6, color: "#d9dde1" }), 0, 0.75, 0.2);
    add(rib, M.box({ w: 0.6, h: 0.3, d: 0.04, color: "#9fd6ea", emissive: 0.3 }), 0, 1.25, 0.48);
  };
  // The timeline wall in the harbour: one plaque per room of the voyage, oldest ideas first. A plaque for a built
  // room sails the boat straight there; the others say they are still being built.
  const buildTimeline = () => {
    const label = BL.factoryModels.label;
    solid(0.2, 2.6, 14.4, "#2f2a25", -11.9, 2.6, 0.2);
    const head = label("THE VOYAGE", "tap an era to sail there", { height: 0.8, style: "plain" });
    const hn = place(createNode({ position: { x: -11.72, y: 4.35, z: 0.2 }, rotation: { x: 0, y: Math.PI / 2, z: 0 } }));
    addChild(hn, createNode({ geometry: head.back }), createNode({ geometry: head.face }));
    built.plaques = [];
    GW.ERAS.forEach((era, i) => {
      const room = { id: era.id, title: `Era ${era.n}: ${era.name} (${era.years})` };
      const sign = label(`${era.n}. ${era.name.toUpperCase()}`, `${era.years} · ${era.room ? "open now" : era.optional ? "optional · island only" : "island only so far"}`, { height: 0.5, style: era.room ? "gold" : "plain" });
      const node = place(createNode({ position: { x: -11.72, y: 3.5 - (i % 4) * 0.62, z: i < 4 ? 3.6 : -3.2 }, rotation: { x: 0, y: Math.PI / 2, z: 0 } }));
      const face = createNode({ geometry: sign.face });
      addChild(node, createNode({ geometry: sign.back }), face);
      built.plaques.push({ node, face, room, station: i });
    });
  };
  // A plaque takes the boat straight to its era's dock on the Tour; Enter (or Drive) takes the wheel back there.
  const jumpTo = (plaque) => {
    if (plaque.station < 0) { captionKey = ""; setCaption("unbuilt"); return; }
    audio.wake();
    view.mode = "tour"; setPaused(false);
    ride.jump(plaque.station);
    setCaption("sailing");
    showControls();
  };
  const buildBoat = () => {
    built.boat = place(createNode());
    buildBoats();
  };

  // === Hop off and walk (stream B) ================================================================================
  // The pilot and crew are made once per visit; while the visitor rides they are inactive and the Ooga is hidden.
  // Jump out stops the boat (the ride simply does not advance; no pause, no prompt) and hands the camera and keys to
  // the pilot; boarding hands them back to the boat's camera.
  const walk = { on: false, area: null, prop: null, rampHint: null, nearBoat: false, falls: 0, boards: 0, jumps: 0, saved: { fov: 0, near: 0 } };
  const landing = { area: null, distance: 0, x: 0, y: 0, z: 0 };
  const walkPose = { position: { x: 0, y: 0, z: 0 }, yaw: 0, pitch: 0.2, dist: 4.5 };
  let pilot = null, people = null, avatar = null, fx = null, footsteps = null, remotes = null, footing = null, props = null;
  let playerName = null, arrivedPilot = null, terminal = null;
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
    built.pc = place(createNode({ geometry: M.box({ w: 1.2, h: 1.4, d: 1.3, color: "#000000" }), position: { x: pc.x, y: pc.y + 0.7, z: pc.z }, visible: false }));
    sign(props.get("pc"), "DIR · TYPE · HASH", 1.75);
    solid(1, 0.5, 1, "#5a524a", dr.x, dr.y + 0.25, dr.z);
    // A schematic of the 1956 cabinet (not to scale), its stack of disks in a window, and the card beside it.
    solid(0.6, 0.5, 0.18, "#8d939a", dr.x - 0.1, dr.y + 0.75, dr.z - 0.2);
    for (let i = 0; i < 6; i++) solid(0.04, 0.012, 0.14, "#c9ced4", dr.x + 0.0, dr.y + 0.62 + i * 0.04, dr.z - 0.2);
    solid(0.011, 0.001, 0.015, "#202020", dr.x + 0.25, dr.y + 0.501, dr.z + 0.3);
    solid(0.12, 0.01, 0.12, "#ffd25f", dr.x + 0.25, dr.y + 0.5, dr.z + 0.3, 0.6);
    built.drives = place(createNode({ geometry: M.box({ w: 1.1, h: 1.1, d: 1.1, color: "#000000" }), position: { x: dr.x, y: dr.y + 0.55, z: dr.z }, visible: false }));
    sign(props.get("drives"), "schematic, not to scale", 1.55);
    solid(0.5, 0.95, 0.5, "#7a5534", bk.x, bk.y + 0.47, bk.z);
    solid(0.42, 0.04, 0.56, "#f5f0e2", bk.x, bk.y + 0.97, bk.z);
    solid(0.02, 0.05, 0.02, "#2a2a2a", bk.x + 0.1, bk.y + 1.0, bk.z + 0.15);
    built.book = place(createNode({ geometry: M.box({ w: 0.7, h: 1.2, d: 0.8, color: "#000000" }), position: { x: bk.x, y: bk.y + 0.6, z: bk.z }, visible: false }));
    sign(props.get("book"), "stamp your own page", 1.45);
    // The boarding ramps: planks sloping down to where the boat lies.
    for (const a of FOOTING.areas) {
      if (!a.ramp) continue;
      const len = a.x1 - a.x0, cx = (a.x0 + a.x1) / 2, cz = (a.z0 + a.z1) / 2, drop = a.ramp.from - a.ramp.to;
      place(createNode({ geometry: M.box({ w: Math.hypot(len, drop), h: 0.06, d: a.z1 - a.z0, color: "#8a6440" }), position: { x: cx, y: (a.ramp.from + a.ramp.to) / 2 - 0.03, z: cz }, rotation: { x: 0, y: 0, z: -Math.atan2(drop, len) } }));
    }
  };
  const registerProps = () => {
    props = GP.createRegistry();
    const dos = GP.createDos({ year: 1993, files: GP.PC_FILES });
    props.register({ id: "pc", era: 3, year: 1993, title: "Tock's office PC", label: "OFFICE PC · 1993", sourceKeys: ["merkle1980", "haber1991", "bayer1993"], at: PROPS.pc,
      onUse: () => ({ terminal: dos }) });
    // TODO: moves to Era 0's island (1956) when the islands are built; it stands here until then.
    props.register({ id: "drives", era: 0, year: 1956, title: "Hard drives, 1956 and 2019", label: "HARD DRIVES · 1956 AND 2019", sourceKeys: GP.DRIVES.old.sourceKeys.concat(GP.DRIVES.now.sourceKeys), at: PROPS.drives,
      onUse: () => ({ board: { room: "Hard drives: 1956 and 2019", pages: GP.drivePages(), sources: GP.DRIVES.old.sourceKeys.concat(GP.DRIVES.now.sourceKeys) } }) });
    const book = GP.createStampBook();
    built.stampBook = book;
    props.register({ id: "book", era: 3, year: 1991, title: "Tock's book", label: "TOCK'S BOOK · 1991", sourceKeys: ["haber1991"], at: PROPS.book,
      onUse: () => ({ terminal: GP.stampTerminal(book) }) });
  };

  // The terminal: one dialog for every prop with a text prompt (the PC, Tock's book). Typing stays in the field, so
  // no key reaches the walk while it is open; closing it hands the keys back.
  const MAX_SCREEN = 200;
  const openTerminal = (title, term) => {
    terminal = { term, lines: term.banner.slice() };
    el.termTitle.textContent = title;
    el.termPrompt.textContent = term.prompt;
    el.termScreen.textContent = terminal.lines.join("\n");
    el.termInput.value = "";
    if (pilot) pilot.setActive(false);
    hud.tooltip.hide();
    el.term.showModal();
    el.termInput.focus();
  };
  const runTerminal = (line) => {
    if (!terminal) return;
    const out = terminal.term.run(line);
    if (out.cls) terminal.lines.length = 0;
    else terminal.lines.push(`${terminal.term.prompt} ${GP.clean(line)}`, ...out.lines, "");
    if (terminal.lines.length > MAX_SCREEN) terminal.lines.splice(0, terminal.lines.length - MAX_SCREEN);
    el.termScreen.textContent = terminal.lines.join("\n");
    el.termScreen.scrollTop = el.termScreen.scrollHeight;
    if (out.entry) { audio.stamp(); hud.toast(`Page ${out.entry.page} stamped: ${out.entry.code}`); }
    return out;
  };
  const terminalClosed = () => {
    terminal = null;
    if (pilot) pilot.setActive(walk.on && !view.reading);
  };
  const openProp = (prop) => {
    audio.wake();
    const r = props.use(prop, propState);
    if (r.terminal) openTerminal(prop.title, r.terminal);
    else if (r.board) openPanel(makeBoard(r.board));
  };

  // Jump out: the boat stays where it is and the Ooga lands on the nearest ledge, facing inland.
  const jumpOut = () => {
    if (walk.on || view.reading || terminal) return false;
    if (!avatar) { hud.toast("No Ooga to walk with here"); return false; }
    footing.nearestLedge(boat.x, boat.z, JUMP_REACH, landing);
    if (!landing.area) { hud.hint("Too far from land to jump out. Sail closer to a ledge.", 3000); return false; }
    audio.wake();
    const facing = Math.atan2(landing.x - boat.x, landing.z - boat.z);
    avatar.root.visible = true;
    Object.assign(avatar.root.position, { x: landing.x, y: avatar.baseY + landing.y, z: landing.z });
    avatar.root.rotation.y = facing;
    walk.saved.fov = camera.fov; walk.saved.near = camera.near;
    pilot.setActive(true);
    if (!pilot.possess(avatar)) { pilot.setActive(false); avatar.root.visible = false; return false; }
    walkPose.position.x = landing.x; walkPose.position.y = landing.y; walkPose.position.z = landing.z;
    walkPose.yaw = facing - Math.PI;
    pilot.navigate(walkPose);
    walk.on = true; walk.area = landing.area; walk.prop = null; walk.jumps++;
    hud.hint(COARSE ? "Stick walks · USE by a prop · Board on the ramp" : "W A S D walk · Space uses what is next to you · J or the ramp boards", 6000);
    showControls();
    return true;
  };
  // Back aboard: the pilot lets go, the Ooga is hidden and the boat's camera takes over where it left off.
  const reboard = () => {
    if (!walk.on) return false;
    walk.on = false; walk.prop = null; walk.boards++;
    if (pilot.player) pilot.release(true);
    pilot.setActive(false);
    avatar.root.visible = false;
    camera.fov = walk.saved.fov; camera.near = walk.saved.near; camera.up = null; camera.orthoMix = camera.orthoHeight = 0;
    BL.net.setBody(null);
    hud.el.act.hidden = true;
    captionKey = "";
    showControls();
    return true;
  };
  const toggleWalk = () => {
    if (!walk.on) return jumpOut();
    if (walk.nearBoat) return reboard();
    hud.hint("Walk back to the boat or up a boarding ramp to board.", 2500);
    return false;
  };
  // Per frame while walking, allocation-free: the pilot and crew, the room's presence, then the ramps, the water,
  // the boat's reach and the prop in reach.
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
    // Let go of (Escape, or the room taking the Ooga back): the visitor is back in the boat.
    if (!driven) { reboard(); return; }
    const p = driven.root.position, feet = p.y - driven.baseY;
    const here = footing.areaAt(p.x, p.z, feet);
    if (here && !here.ramp) walk.area = here;
    // A ramp boards only where the boat lies at its foot; elsewhere it is just a ramp.
    const ramp = footing.boardingRampAt(p.x, p.z, feet);
    if (ramp && footing.rampReaches(ramp, boat.x, boat.z, BOARD_REACH)) { reboard(); return; }
    if (ramp && walk.rampHint !== ramp) { walk.rampHint = ramp; hud.hint("The boat isn't at this ramp. Walk to it and press J.", 2500); }
    else if (!ramp) walk.rampHint = null;
    if (footing.fallen(feet)) {
      const dock = footing.dockOf(walk.area);
      walk.falls++;
      audio.splash();
      walkPose.position.x = dock.x; walkPose.position.z = dock.z;
      walkPose.position.y = footing.supportAt(dock.x, dock.z);
      walkPose.yaw = dock.facing - Math.PI;
      pilot.navigate(walkPose);
      hud.hint("Splash! Back to the dock.", 2000);
      return;
    }
    walk.nearBoat = Math.hypot(p.x - boat.x, p.z - boat.z) < BOARD_REACH;
    const near = props.near(p.x, p.z, feet);
    if (near !== walk.prop) {
      walk.prop = near;
      if (near) { hud.hint(`${COARSE ? "USE" : "Space"}: ${near.title} (${near.year})`); hud.setAct("USE"); }
      else pilot.showAct();
    }
  };
  // === End of hop off and walk ====================================================================================

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
      title: ex.room, help: "Arrows page · Escape closes and the ride carries on", canvas, count: ex.pages.length, index: 0,
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
  // Opening a panel holds the ride (and, ashore, the walk) until it closes.
  const setPaused = (on) => {
    view.paused = !!on;
    ride.pause(view.paused);
    if (view.paused && driver) driver.stop();
  };
  const openPanel = (panel) => {
    if (!hud || view.reading || terminal) return;
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
  // Short synthesized cues through the page's environment mute (M), made only after a gesture and closed on leave.
  const createAudio = () => {
    let context = null, out = null;
    const wake = () => {
      if (context || typeof AudioContext === "undefined") return;
      context = new AudioContext(); out = BL.sound.output(context);
    };
    const tone = (freq, length, type, gain, slide = 0) => {
      if (!context || context.state !== "running" || BL.sound.muted) return;
      const t = context.currentTime, o = context.createOscillator(), g = context.createGain();
      o.type = type; o.frequency.setValueAtTime(freq, t);
      if (slide) o.frequency.exponentialRampToValueAtTime(freq * slide, t + length);
      g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(0.0001, t + length);
      o.connect(g); g.connect(out); o.start(t); o.stop(t + length + 0.02);
    };
    return {
      wake,
      stamp: () => { tone(140, 0.18, "square", 0.08, 0.5); tone(70, 0.25, "sine", 0.14, 0.7); },
      link: () => tone(880, 0.35, "triangle", 0.05, 1.5),
      broken: () => { tone(220, 0.6, "sawtooth", 0.04, 0.6); tone(233, 0.6, "sawtooth", 0.04, 0.6); },
      splash: () => { tone(320, 0.45, "triangle", 0.07, 0.3); tone(90, 0.5, "sine", 0.12, 0.6); },
      dispose: () => { if (context) context.close().catch(() => {}); context = out = null; }
    };
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
    el.sail.textContent = view.mode === "tour" ? "Drive" : "Tour";
    press(el.sail, view.mode === "tour");
    el.pause.textContent = view.paused ? "Carry on" : "Pause";
    press(el.pause, view.paused);
    press(el.boost, view.boost);
    el.skip.disabled = view.mode !== "tour";
    press(el.cc, view.captions); press(el.voice, view.voice); press(el.view, view.fixed); press(el.calm, view.calm);
    el.voice.hidden = !speech;
    el.caption.hidden = !view.captions || !el.caption.textContent;
    // Ashore the boat waits: its own buttons step aside and Jump out becomes Board.
    el.sail.hidden = el.skip.hidden = el.boost.hidden = walk.on;
    el.jump.textContent = walk.on ? "Board" : "Jump out";
    press(el.jump, walk.on);
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
  // Tour on: the autopilot carries on from the start in the harbour, or from the next dock along the lane. Tour off:
  // the visitor takes the wheel where the boat is.
  const sail = () => {
    audio.wake();
    if (view.mode === "tour") {
      view.mode = "drive";
      driver.place(boat.x, boat.z, boat.heading);
      setPaused(false);
      setCaption("drive");
    } else {
      view.mode = "tour";
      setPaused(false);
      const era = GW.eraAt(boat.x, boat.z);
      if (era < 0 && Math.hypot(boat.x - GW.HARBOUR.start.x, boat.z - GW.HARBOUR.start.z) < 4) { if (!ride.start()) { ride.jump(0); } }
      else ride.jump(Math.max(0, Math.min(GW.ERAS.length - 1, era < 0 ? 0 : era)));
      setCaption("sailing");
    }
    showControls();
  };
  const pause = () => {
    audio.wake();
    setPaused(!view.paused);
    if (view.paused) { stopVoice(); setCaption("paused"); } else captionKey = "";
    showControls();
  };
  const skip = () => { if (view.mode === "tour" && ride.skip()) showControls(); };
  const boost = () => { view.boost = !view.boost; showControls(); };
  const toggle = (key) => {
    view[key] = !view[key];
    if (key === "voice" && !view.voice) stopVoice();
    if (key === "captions") paintChain();
    showControls();
  };
  const leave = () => go("hub");

  const onKey = (e) => {
    if (view.reading || terminal || e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (k === "j") { audio.wake(); toggleWalk(); return; }
    // Ashore the pilot has the walking keys (W A S D, Q E, Space), Escape and 0; letting go of the Ooga re-boards.
    if (walk.on) {
      if (k === "Escape") { if (!pilot.escape()) reboard(); }
      else if (k === "0") pilot.resetCamera();
      else if (k === "i") openInfo();
      else if (k === "c") toggle("captions");
      else if (k === "t") toggle("voice");
      return;
    }
    if (k === "Escape") leave();
    else if (k === "Enter") { e.preventDefault(); sail(); }
    else if (k === " " || k === "p") { e.preventDefault(); pause(); }
    else if (k === "n") skip();
    else if (k === "i") openInfo();
    else if (k === "c") toggle("captions");
    else if (k === "t") toggle("voice");
    else if (k === "v") toggle("fixed");
    else if (k === "r") toggle("calm");
    else if (k === "0") view.yaw = view.pitch = 0;
  };

  // --- Frame ----------------------------------------------------------------------------------------------------
  const stepDemo = (dt) => {
    if (!view.paused && !view.reading) demo.update(dt);
    if (demo.stamps !== lastStamps) { lastStamps = demo.stamps; audio.stamp(); }
    if (demo.tiles !== lastTiles || demo.broken !== lastBroken) {
      if (demo.tiles > lastTiles && demo.tiles > 0) audio.link();
      if (demo.broken && !lastBroken) audio.broken();
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
    // The desk narrates while the boat lies at its dock (the Tour's stop there, or driven up to it), or ashore beside it.
    const atDesk = view.mode === "tour" ? ride.state === "station" && ride.station === ROOM_ERA : driver.state.dock === ROOM_ERA;
    const nearDesk = walk.on && avatar && Math.hypot(avatar.root.position.x - DESK.x, avatar.root.position.z - DESK.z) < 9;
    if ((atDesk || nearDesk) && !view.paused && p !== lastPhase) setCaption(p);
    lastPhase = p;
  };
  const updateBoatModel = () => {
    const bob = view.calm || view.paused ? 0 : Math.sin(sceneTime * 1.7) * 0.05;
    built.boat.position.x = boat.x; built.boat.position.z = boat.z; built.boat.position.y = bob;
    built.boat.rotation.y = boat.heading;
    built.boat.rotation.z = view.calm ? 0 : Math.sin(sceneTime * 1.1) * 0.025;
    return bob;
  };
  const updateCamera = (dt) => {
    const bob = updateBoatModel();
    const c = camera.position, target = camera.target;
    if (view.fixed) {
      const era = GW.eraAt(boat.x, boat.z), v = era < 0 ? FIXED_VIEWS.harbour : FIXED_VIEWS.eras[era];
      c.x = v.eye.x; c.y = v.eye.y; c.z = v.eye.z;
      target.x = v.look.x; target.y = v.look.y; target.z = v.look.z;
      chase.ready = false;
      return;
    }
    // A chase view from behind and above the boat. At a dock the view turns toward the island's exhibit; dragging
    // looks round. It eases after the boat; Calm cuts instead.
    const stopIndex = view.mode === "tour" ? (ride.state === "station" ? ride.station : -1) : driver.state.dock;
    const want = stopIndex >= 0 ? 1 : 0;
    view.look = view.calm ? want : view.look + (want - view.look) * Math.min(1, dt * 1.6);
    let yaw = boat.heading;
    if (stopIndex >= 0) {
      const look = STATIONS[stopIndex].look;
      let toward = Math.atan2(look.x - boat.x, look.z - boat.z) - yaw;
      toward = Math.atan2(Math.sin(toward), Math.cos(toward));
      yaw += toward * view.look;
    }
    yaw += view.yaw;
    const pitch = 0.28 + view.pitch, dist = 7.5 - view.look * 2;
    eye.x = boat.x - Math.sin(yaw) * Math.cos(pitch) * dist;
    eye.z = boat.z - Math.cos(yaw) * Math.cos(pitch) * dist;
    eye.y = 1.2 + bob + Math.sin(pitch) * dist;
    const k = view.calm || !chase.ready ? 1 : Math.min(1, dt * 5);
    chase.x += (eye.x - chase.x) * k; chase.y += (eye.y - chase.y) * k; chase.z += (eye.z - chase.z) * k;
    chase.tx += (boat.x + Math.sin(yaw) * 3 - chase.tx) * k; chase.ty += (1.4 + bob - chase.ty) * k; chase.tz += (boat.z + Math.cos(yaw) * 3 - chase.tz) * k;
    chase.ready = true;
    c.x = chase.x; c.y = Math.max(0.6, chase.y); c.z = chase.z;
    target.x = chase.tx; target.y = chase.ty; target.z = chase.tz;
  };
  // Which era's boat is showing, a splash when it changes, and the era's caption as the boat crosses into it.
  const updateEra = (dt) => {
    const era = GW.eraAt(boat.x, boat.z), kind = era < 0 ? "skiff" : GW.ERAS[era].boat;
    if (driver.state.kind !== kind) {
      for (const name in built.boats) built.boats[name].visible = name === kind;
      if (lastEra !== -2) { splashT = 0.7; audio.splash(); }
      driver.state.kind = kind;
    }
    if (era !== lastEra) {
      if (era >= 0 && !walk.on) {
        const e = GW.ERAS[era], boatName = GW.BOATS[e.boat].name;
        setCaption(`era-${era}`, `Era ${e.n}: ${e.name} (${e.years}). Your boat is now a ${boatName}.${e.room ? " Dock at the ramp to see Fingerprints and Time." : " This island's exhibits are still being built."}`);
      }
      lastEra = era;
    }
    if (splashT > 0) {
      splashT = Math.max(0, splashT - dt);
      const n = built.splash, grow = 1 + (0.7 - splashT) * 2.4;
      n.visible = splashT > 0 && !view.calm;
      n.position.x = boat.x; n.position.z = boat.z; n.position.y = 0.02;
      n.scale.x = n.scale.z = grow;
    }
  };
  const update = (dt) => {
    sceneTime += dt;
    // The panel's dialog closing (its button, Escape or a press outside) hands the ride back as it was.
    if (view.reading && !hud.el.board.open) {
      view.reading = false;
      if (view.readingPaused) setPaused(false);
      if (walk.on && !terminal) pilot.setActive(true);
      captionKey = "";
      showControls();
    }
    const before = ride.state;
    // Ashore, paused or reading, the boat simply waits where it is.
    const moving = !view.reading && !walk.on && !view.paused;
    if (view.mode === "tour") {
      // Shift (or Boost) hurries the Tour along.
      const axes = controls.read(), hurry = axes.sprint > 0 || view.boost ? GB.BOOST : 1;
      if (moving) ride.update(dt * hurry);
      course.sample(ride.d, boat);
      if (ride.state !== before) {
        if (ride.state === "station") {
          if (ride.station === ROOM_ERA) { demo.reset(); lastPhase = ""; lastTiles = -1; setCaption("arrive"); }
          else setCaption(`dock-${ride.station}`, `${GW.ERAS[ride.station].name} (${GW.ERAS[ride.station].years}): this island's exhibits are still being built. The Tour moves on in a moment.`);
        } else if (before === "station") setCaption("leaving");
        else if (ride.state === "docked") setCaption("docked");
        showControls();
      }
      driver.state.x = boat.x; driver.state.z = boat.z; driver.state.heading = boat.heading; driver.state.speed = 0;
      driver.state.dock = ride.state === "station" ? ride.station : -1;
    } else {
      // The visitor's wheel: forward and back on the throttle, left and right on the rudder (right turns right).
      const axes = controls.read();
      driver.input.throttle = moving ? axes.y : 0;
      driver.input.steer = moving ? -axes.x : 0;
      driver.input.boost = moving && (axes.sprint > 0 || view.boost);
      if (moving) driver.update(dt);
      boat.x = driver.state.x; boat.z = driver.state.z; boat.heading = driver.state.heading;
      if (driver.state.dock !== lastDock) {
        if (driver.state.dock === ROOM_ERA) { demo.reset(); lastPhase = ""; lastTiles = -1; setCaption("arrive"); }
        lastDock = driver.state.dock;
      }
    }
    updateEra(dt);
    renderOpts.shadowCenter.x = boat.x; renderOpts.shadowCenter.z = boat.z;
    stepDemo(dt);
    built.portal.glow = 1 + Math.sin(sceneTime * 1.3) * (view.calm ? 0 : 0.25);
    built.pcScreen.glow = 1 + (Math.floor(sceneTime * 2) & 1) * 0.2;
    // The boat's camera rides along; ashore the pilot frames the Ooga and the boat sits still on the water.
    if (walk.on) { updateBoatModel(); updateWalk(dt, sceneTime); }
    else updateCamera(dt);
    remotes.update(dt);
    fx.update(dt, sceneTime);
    hud.updateBoard(sceneTime);
  };
  const drawExtra = (g, project) => remotes.drawNames(g, project);
  const overlay = (dt) => fx.drawOverlay(dt, drawExtra);

  // --- Visit ----------------------------------------------------------------------------------------------------
  const tooltipFor = (hit) => hit && hit.owner.kind === "plaque" ? (hit.owner.plaque.station >= 0 ? `${hit.owner.plaque.room.title} · tap to sail there` : `${hit.owner.plaque.room.title} · being built`) : hit && hit.owner.kind === "exhibit" ? "Fingerprints and Time (1991) · tap to read" : hit && hit.owner.kind === "prop" ? `${hit.owner.prop.title} (${hit.owner.prop.year}) · ${walk.on ? `walk up and press ${COARSE ? "USE" : "Space"}` : "jump out (J) to use it"}` : hit && hit.owner.kind === "guide" ? "Tock, the archivist Ooga (an invented guide)" : "";
  const enter = (ctx) => {
    ({ game, world, go } = ctx);
    overlayCanvas = ctx.overlay;
    BL.hud.leaveTo("genesis", "hub");
    root = createNode();
    camera = createCamera({ fov: 62, near: 0.15, far: 420 });
    built = {};
    course = G.createCourse(TOUR.points);
    buildCavern(); buildSea(); buildIslands(); buildTimeline(); buildDesk(); buildBoat();
    registerProps();
    footing = GP.createFooting(FOOTING);
    buildProps();
    ride = G.createRide({ course, stations: STATIONS, speed: 4 });
    driver = GB.create(GW, GW.HARBOUR.start);
    demo = G.createStampDemo();
    board = makeBoard();
    audio = createAudio();
    view.yaw = view.pitch = view.look = 0; view.reading = view.readingPaused = false; view.fixed = false;
    view.paused = false; view.mode = "drive"; view.boost = false; chase.ready = false; lastEra = lastDock = -2; splashT = 0;
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
    for (const plaque of built.plaques) target(plaque.face, { kind: "plaque", plaque });
    for (const id of ["pc", "drives", "book"]) target(built[id], { kind: "prop", prop: props.get(id), priority: 1 });
    // Hop off and walk: the pilot and crew for the visitor's Ooga, idle until Jump out (as the arcade's are).
    const boatFov = camera.fov;
    const clampTarget = (p) => { p.x = clamp(p.x, GW.SEA.x0, GW.SEA.x1); p.y = clamp(p.y, 0.3, 9); p.z = clamp(p.z, GW.SEA.z0, 8.5); };
    const clampCamera = (p) => { p.x = clamp(p.x, GW.SEA.x0, GW.SEA.x1); p.y = clamp(p.y, 0.4, 12); p.z = clamp(p.z, GW.SEA.z0, 8.8); };
    pilot = BL.pilot.create({
      renderer: ctx.renderer, canvas: ctx.canvas, camera, hud, presets: WALK_PRESETS, landing: "dock", pitch: [-0.2, 1.2], dist: [2.5, 12],
      follow: { y: 0.9, min: 2.5, max: 6, pitch: [0.2, 0.8] }, fly: { speed: 4, perDist: 0.4, climb: 2, yMax: 6 }, clampTarget, clampCamera,
      ceilingAt: (x, z) => z > ROOM_Z ? 6.6 : 14, coarse: COARSE, mayPossess,
      close: { eyeHeight: 1.1, eyeRatio: 0.95, eyeForward: 0.16, pitch: [-1.35, 1.35], trailingDist: 4, orbitDist: 5, maxStep: 0.6, groundAt: (x, z) => footing.supportAt(x, z, feetOf()) }
    });
    camera.fov = boatFov;
    fx = BL.fx.create({ root, renderer: ctx.renderer, camera, overlay: ctx.overlay, tickerAt: { x: -1, y: 5, z: -10 }, hud });
    // The boat's wheel: the shared keyboard, stick and pad reader, idle while the pilot walks.
    controls = BL.controls.create({ move: document.getElementById("joy-move") });
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
    walk.on = false; walk.area = walk.prop = null; walk.nearBoat = false; walk.falls = walk.boards = walk.jumps = 0;
    propState.uses = 0; propState.last = ""; terminal = null;
    const boatOrbit = (dx, dy) => {
      if (view.fixed || view.reading) return;
      view.yaw = clamp(view.yaw - dx * 4e-3, -2.6, 2.6);
      view.pitch = clamp(view.pitch + dy * 3e-3, -0.7, 0.6);
    };
    Object.assign(hooks, {
      onHover: (hit, p) => { const t = tooltipFor(hit); if (t) hud.tooltip.show(t, p.x, p.y); else hud.tooltip.hide(); },
      onHoverMove: (hit, p) => { const t = tooltipFor(hit); if (t) hud.tooltip.show(t, p.x, p.y); else hud.tooltip.hide(); },
      onTap: (hit) => {
        audio.wake();
        if (hit && hit.owner.kind === "exhibit") openInfo();
        else if (hit && hit.owner.kind === "plaque" && !walk.on) jumpTo(hit.owner.plaque);
        else if (hit && hit.owner.kind === "prop") {
          if (walk.on && walk.prop === hit.owner.prop) openProp(hit.owner.prop);
          else hud.hint(walk.on ? `Walk up to ${hit.owner.prop.title} to use it` : "Jump out (J) and walk up to use it", 2500);
        }
      },
      // Ashore the pilot takes the look, zoom and double-tap; aboard the boat's own camera does.
      hoverIgnore: () => walk.on ? pilot.hooks.hoverIgnore() : null,
      onOrbit: (dx, dy) => { if (walk.on) pilot.hooks.onOrbit(dx, dy); else boatOrbit(dx, dy); },
      onZoom: (factor, gesture, px, py) => { if (walk.on) pilot.hooks.onZoom(factor, gesture, px, py); },
      onDoubleTap: (hit) => { if (walk.on) pilot.hooks.onDoubleTap(hit); }
    });
    hud.onAction((action) => {
      audio.wake();
      if (action === "genesis-sail") sail();
      else if (action === "genesis-pause") pause();
      else if (action === "genesis-boost") boost();
      else if (action === "genesis-skip") skip();
      else if (action === "genesis-info") openInfo();
      else if (action === "genesis-cc") toggle("captions");
      else if (action === "genesis-voice") toggle("voice");
      else if (action === "genesis-view") toggle("fixed");
      else if (action === "genesis-calm") toggle("calm");
      else if (action === "genesis-jump") toggleWalk();
      else if (action === "reset-view" && walk.on) pilot.resetCamera();
      else if (action === "leave") leave();
    });
    for (const id of ["caption", "sail", "pause", "boost", "skip", "info", "jump", "cc", "voice", "view", "calm", "chain", "chainWrap"]) el[id] = document.getElementById(`genesis-${id === "chainWrap" ? "chain-wrap" : id}`);
    el.chain.replaceChildren(...G.PAGES.map(() => { const li = document.createElement("li"); li.hidden = true; return li; }));
    el.help = document.getElementById("genesis-help");
    el.help.textContent = COARSE ? "Stick drives · Boost for speed · Tour rides along · Jump out by an island" : "W A S D or arrows drive · Shift speed · Enter tour · Space pause · N skip · I info · J jump out · C captions · T voice · V view · R calm · drag to look · Esc leave";
    el.term = document.getElementById("genesis-terminal");
    for (const id of ["Title", "Screen", "Prompt", "Input", "Form"]) el["term" + id] = document.getElementById(`genesis-terminal-${id.toLowerCase()}`);
    el.termForm.addEventListener("submit", (e) => { e.preventDefault(); runTerminal(el.termInput.value); el.termInput.value = ""; }, { signal: ctx.signal });
    el.term.addEventListener("close", terminalClosed, { signal: ctx.signal });
    el.term.querySelector("[data-terminal-close]").addEventListener("click", () => el.term.close(), { signal: ctx.signal });
    window.addEventListener("pointerdown", audio.wake, { signal: ctx.signal });
    window.addEventListener("keydown", audio.wake, { signal: ctx.signal });
    boat.x = driver.state.x; boat.z = driver.state.z; boat.heading = driver.state.heading;
    setCaption("boarding");
    paintChain();
    showControls();
    hud.setStats(game.state);
    Object.assign(scene, { root, camera, input, debug: { get ride() { return ride; }, get demo() { return demo; }, view, built, board, sail, skip, openInfo, toggle, jumpTo,
      walk, boat, footing, props, pilot, get avatar() { return avatar; }, get terminal() { return terminal; }, jumpOut, reboard, toggleWalk, openProp, runTerminal,
      get driver() { return driver; }, pause, boost } });
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
    if (view.reading) hud.closeBoard();
    if (el.term.open) el.term.close();
    terminal = null;
    // The Ooga that came in (or the one walked here) goes back out to the island as itself.
    world.pilot = arrivedPilot || (walk.jumps && playerName) || null;
    walk.on = false; walk.area = walk.prop = null;
    BL.net.setBody(null);
    audio.dispose();
    controls.dispose();
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
    ride = course = demo = board = audio = built = input = hud = game = world = go = overlayCanvas = driver = controls = null;
    pilot = people = avatar = fx = footsteps = remotes = footing = props = playerName = arrivedPilot = null;
    scene.input = scene.debug = null;
    return { targets: count };
  };
  const stats = () => {
    let nodes = 0;
    const all = (n) => { nodes++; for (const c of n.children) all(c); };
    all(root);
    return { allNodes: nodes, targets: input.targetCount, mode: view.mode, ride: ride.state, station: ride.station, era: GW.eraAt(boat.x, boat.z), boat: driver.state.kind, speed: driver.state.speed, dock: driver.state.dock,
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
    get inMotion() { return !!ride && (walk.on || !view.paused && !view.reading); }
  });
})();
