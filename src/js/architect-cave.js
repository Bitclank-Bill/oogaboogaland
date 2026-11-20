// The mirror's observation chamber shares the island's simulation. Its enclosed volume lives below the
// island, reached only through the mirror; no second crew, feed subscription or player is created.
(() => {
  "use strict";
  const BL = window.BL = window.BL || {};
  const { createNode, addChild, removeChild } = BL.scene;
  const { box, bevelBox, beam, lathe, merge, geometry, pushVert, face } = BL.models;
  const FLOOR = -48, RADIUS = 10.8, HEIGHT = 9.05, TAU = Math.PI * 2;
  // Match the island cave's five-metre opening, with its glass reaching the floor.
  const RETURN_HALF_W = 2.5, RETURN_HEIGHT = 3, RETURN_Z = Math.sqrt(RADIUS * RADIUS - RETURN_HALF_W * RETURN_HALF_W);
  const BANKS = 48, ROWS = 12, MIRROR_ROWS = 4, PITCH = RETURN_HEIGHT / MIRROR_ROWS, GAP = 0.05, PORTAL_COLS = 4, WALL = "#080a0b";
  const PORTAL_ANGLE = Math.asin(RETURN_HALF_W / RADIUS), BANK_ANGLE = (TAU - 2 * PORTAL_ANGLE) / BANKS;
  const BANK_RADIUS = RADIUS * Math.cos(BANK_ANGLE / 2);
  const SEAT_TOP = 0.72;
  // Local chair solids rotate with the upholstery; the low caster base stays underneath it.
  const CHAIR_SOLIDS = [[-0.68, 0, -0.58, 0.68, SEAT_TOP, 0.58],
    [-0.68, SEAT_TOP, -0.7, 0.68, 2.05, -0.44],
    [-0.85, SEAT_TOP, -0.5, -0.7, 1.18, 0.54], [0.7, SEAT_TOP, -0.5, 0.85, 1.18, 0.54]];
  const contains = (x, y, z) => y < -32 && y > -55 && x * x + z * z < 225;
  const clear = (x, z, radius = 0.4) => Math.hypot(x, z) < BANK_RADIUS - radius - 0.25
    || z > RADIUS - 2 && z < RETURN_Z + 0.6 && Math.abs(x) < RETURN_HALF_W - radius - 0.08;
  const segmentClear = (x, y, z, toX, toY, toZ, radius, height) =>
    clear(toX, toZ, radius) && toY >= FLOOR - 1e-7 && toY + height <= FLOOR + HEIGHT
    && (toZ <= RETURN_Z - radius || Math.abs(toX) < RETURN_HALF_W - radius - 0.08 && toY < FLOOR + RETURN_HEIGHT - 0.5);
  const FACE_WAIT = 45, FACE_SWEEP = 4.2, FACE_HOLD = 8;
  // Tile the wall with single screens and square video groups. Independent groups must not repeat
  // a neighboring feed; adjacency within one deliberate mosaic is the only exception.
  const panelLayout = count => {
    const cols = BANKS + PORTAL_COLS, cells = new Int16Array(cols * ROWS).fill(-1), groups = [], uses = new Uint16Array(count);
    const fits = (col, row, size) => {
      if (row + size > ROWS || col + size > (col < BANKS ? BANKS : cols)) return false;
      for (let y = row; y < row + size; y++) for (let x = col; x < col + size; x++)
        if (y < MIRROR_ROWS && x >= BANKS || cells[y * cols + x] >= 0) return false;
      return true;
    };
    for (let row = 0; row < ROWS; row++) for (let col = 0; col < cols; col++) {
      if (!fits(col, row, 1)) continue;
      const roll = Math.random();
      const size = fits(col, row, 3) && (col === 0 && row === 0 || roll < 0.22) ? 3
        : fits(col, row, 2) && (col === 3 && row === 0 || roll < 0.65) ? 2 : 1;
      const id = groups.length;
      groups.push({ col, row, size, slot: -1 });
      for (let y = row; y < row + size; y++) for (let x = col; x < col + size; x++) cells[y * cols + x] = id;
    }
    for (let id = 0; id < groups.length; id++) {
      const g = groups[id], excluded = new Uint8Array(count);
      for (let y = Math.max(0, g.row - 1); y <= Math.min(ROWS - 1, g.row + g.size); y++)
        for (let x = g.col - 1; x <= g.col + g.size; x++) {
          const neighbor = cells[y * cols + (x + cols) % cols];
          if (neighbor >= 0 && neighbor !== id && groups[neighbor].slot >= 0) excluded[groups[neighbor].slot] = 1;
        }
      let best = Infinity, ties = 0;
      for (let slot = 0; slot < count; slot++) {
        if (excluded[slot] || uses[slot] > best) continue;
        if (uses[slot] < best) { best = uses[slot]; ties = 0; }
        if (Math.random() * ++ties < 1) g.slot = slot;
      }
      uses[g.slot]++;
    }
    return { cells, groups, cols };
  };
  const disc = (radius, y, color, down = false) => {
    const g = geometry(), rgb = BL.math.hexToRgb(color);
    pushVert(g, 0, y, 0);
    for (let i = 0; i <= 48; i++) pushVert(g, Math.sin(i * TAU / 48) * radius, y, Math.cos(i * TAU / 48) * radius);
    for (let i = 1; i <= 48; i++) face(g, down ? [0, i + 1, i] : [0, i, i + 1], rgb, { emissive: 0.32 });
    g.castShadow = false;
    return g;
  };
  const create = ({ root, renderer, camera, pilot, crew, mirror, weather, mouths, places }) => {
    const group = createNode({ position: { x: 0, y: FLOOR, z: 0 }, visible: false });
    const cameras = BL.observatoryCameras.create({ renderer, mouths, places }), feeds = cameras.feeds;
    const meshes = [], panels = [], rowJitter = new Float64Array(ROWS), destination = { position: { x: 0, y: FLOOR, z: 7.8 }, yaw: 0, pitch: 0.12, dist: 4, framed: true };
    const params = new URLSearchParams(location.search);
    let preview = params.get("debug") === "1" && params.get("view") === "architect";
    let active = false, prepared = false, previousAlong = NaN, cooldown = 0, veil = 0, audio = null, returnMirror = null, chairTop = null;
    let broadcast = "feeds", broadcastTime = 0, portraitActor = null, broadcastActor = null;
    let manual = false, manualFace = false, faceWait = FACE_WAIT, faceHold = FACE_HOLD;
    let parkedActor = null, jetOwned = false, jetWorn = false, pen = null;
    const seat = { kind: "architect-chair", x: 0, y: FLOOR + SEAT_TOP, z: 0, ry: 0, floor: FLOOR,
      walkAt: { x: 0, z: 1.7 }, sitter: null, releaseEquipment: () => removePen() };
    const seated = () => active && seat.sitter === pilot.player && !!seat.sitter && seat.sitter.camp.seat === seat;
    const removePen = () => { if (pen?.parent) removeChild(pen.parent, pen); };
    const parkEquipment = actor => {
      if (actor === parkedActor) return;
      removePen();
      if (parkedActor) {
        crew.unparkWeapons(parkedActor);
        crew.setJetpackOwnership(parkedActor, jetOwned);
        if (jetOwned && jetWorn) crew.wearJetpack(parkedActor, parkedActor.jetpackGeometry, parkedActor.jetpackFlameGeometry);
      }
      parkedActor = actor;
      if (actor) {
        jetOwned = !!actor.jetpackOwned; jetWorn = !!actor.jet;
        crew.parkWeapons(actor); crew.setJetpackOwnership(actor, false);
      }
      pilot.refreshCombat();
    };
    const chairClear = (x, y, z, toX, toY, toZ, radius, height) => {
      if (!segmentClear(x, y, z, toX, toY, toZ, radius, height)) return false;
      const sr = Math.sin(seat.ry), cr = Math.cos(seat.ry);
      const lx = x * cr - z * sr, lz = x * sr + z * cr;
      const dx = (toX - x) * cr - (toZ - z) * sr, dz = (toX - x) * sr + (toZ - z) * cr;
      for (const b of CHAIR_SOLIDS) if (!BL.terrain.segmentBoxClear(lx, y - FLOOR, lz, dx, toY - y, dz, radius, height, ...b)) return false;
      return true;
    };
    const supportAt = (x, z, from, rise = 0, radius = 0.3) => {
      const sr = Math.sin(seat.ry), cr = Math.cos(seat.ry), lx = x * cr - z * sr, lz = x * sr + z * cr;
      let floor = FLOOR;
      for (const b of CHAIR_SOLIDS) if (FLOOR + b[4] <= from + rise + 1e-7
        && lx > b[0] - radius && lx < b[3] + radius && lz > b[2] - radius && lz < b[5] + radius) floor = Math.max(floor, FLOOR + b[4]);
      return floor;
    };
    const turnChair = () => {
      chairTop.rotation.y = seat.ry;
      seat.walkAt.x = Math.sin(seat.ry) * 1.7; seat.walkAt.z = Math.cos(seat.ry) * 1.7;
    };
    const sit = () => {
      if (!active || !crew.sitPlayer(seat)) return false;
      seat.ry = pilot.orbit.yaw + Math.PI; turnChair();
      seat.sitter.root.rotation.y = seat.ry;
      const hand = seat.sitter.parts.fingersR, center = BL.scene.boundsOf(hand.geometry).center;
      pen.position.x = center[0]; pen.position.y = center[1]; pen.position.z = center[2];
      pen.scale.x = pen.scale.y = pen.scale.z = seat.sitter.traits.height;
      addChild(hand, pen);
      updateBroadcast(0, seat.sitter);
      return true;
    };
    const add = (g, parent = group, position = null, yaw = 0) => {
      g.architectRoom = true;
      meshes.push(g);
      const n = createNode({ geometry: g, rotation: { x: 0, y: yaw, z: 0 }, ...(position ? { position } : {}) });
      addChild(parent, n);
      return n;
    };
    const prepare = () => {
      if (prepared) return;
      prepared = true;
      addChild(root, group);
      add(disc(RADIUS + 0.3, 0, "#dce1df"));
      add(disc(RADIUS + 0.3, HEIGHT, WALL, true));
      // Tile seams remain geometry, so both renderers show the floor's scale.
      const seams = [];
      for (let i = -9; i <= 9; i++) {
        const length = Math.sqrt(RADIUS * RADIUS - i * i) * 2;
        seams.push(box({ w: 0.018, h: 0.008, d: length, color: "#a6b6b2", emissive: 0.45, offset: { x: i, y: 0.008 } }));
        seams.push(box({ w: length, h: 0.008, d: 0.018, color: "#a6b6b2", emissive: 0.45, offset: { y: 0.008, z: i } }));
      }
      add(merge(...seams));
      cameras.prepare();
      const housing = merge(box({ w: 3.36, h: 1.96, d: 0.32, color: "#283335", emissive: 0.15 }),
        box({ w: 3.13, h: 1.77, d: 0.02, color: "#899a96", emissive: 0.4, offset: { z: 0.17 } }),
        box({ w: 0.06, h: 0.035, d: 0.025, color: "#8addbe", emissive: 1, offset: { x: 1.45, y: -0.92, z: 0.18 } }));
      // One closed wall mesh: shared arc endpoints meet a flat portal wall exactly.
      // The glass occupies the opening, with its frame recessed into the same plane.
      const walls = geometry(), rgb = BL.math.hexToRgb(WALL);
      const wall = (ax, az, bx, bz, low = 0, high = HEIGHT) => {
        const ids = [pushVert(walls, ax, low, az), pushVert(walls, ax, high, az),
          pushVert(walls, bx, high, bz), pushVert(walls, bx, low, bz)];
        face(walls, ids, rgb, { emissive: 0.05 });
      };
      let ax = RETURN_HALF_W, az = RETURN_Z;
      for (let i = 0; i < BANKS; i++) {
        const a = PORTAL_ANGLE + (i + 1) * BANK_ANGLE;
        const bx = i === BANKS - 1 ? -RETURN_HALF_W : Math.sin(a) * RADIUS;
        const bz = i === BANKS - 1 ? RETURN_Z : Math.cos(a) * RADIUS;
        wall(ax, az, bx, bz); ax = bx; az = bz;
      }
      wall(-RETURN_HALF_W, RETURN_Z, RETURN_HALF_W, RETURN_Z, RETURN_HEIGHT);
      add(walls);
      const layout = panelLayout(feeds.length);
      const rackAt = (bank, col, x, row, angle) => {
        const pitchX = col < BANKS ? 2 * RADIUS * Math.sin(BANK_ANGLE / 2) : RETURN_HALF_W * 2 / PORTAL_COLS;
        const scaleX = (pitchX - GAP) / 3.36, scaleY = (PITCH - GAP) / 1.96;
        const rack = createNode({ position: { x, y: PITCH * (row + 0.5) + GAP / 2, z: 0.1 },
          scale: { x: scaleX, y: scaleY, z: 0.71 } });
        addChild(bank, rack); add(housing, rack);
        const group = layout.groups[layout.cells[row * layout.cols + col]], feed = feeds[group.slot];
        const normal = cameras.panel(feed, group.size, col - group.col, row - group.row, pitchX, PITCH, scaleX, scaleY);
        const portrait = cameras.panel(cameras.portrait, 1, 0, 0, pitchX, PITCH, scaleX, scaleY);
        const node = add(normal, rack, { x: 0, y: 0, z: 0.19 });
        // Both sides spread away from the wall opposite the mirror. Higher rows lead, with row and tile jitter.
        panels.push({ node, normal, portrait, row, col, group: layout.cells[row * layout.cols + col], size: group.size,
          distance: Math.abs(Math.atan2(Math.sin(angle - Math.PI), Math.cos(angle - Math.PI))) / Math.PI, delay: 0 });
      };
      for (let i = 0; i < BANKS; i++) {
        const angle = PORTAL_ANGLE + (i + 0.5) * BANK_ANGLE;
        const bank = createNode({ position: { x: Math.sin(angle) * BANK_RADIUS, y: 0, z: Math.cos(angle) * BANK_RADIUS },
          rotation: { x: 0, y: angle + Math.PI, z: 0 } });
        addChild(group, bank);
        for (let row = 0; row < ROWS; row++) rackAt(bank, i, 0, row, angle);
      }
      const portal = createNode({ position: { x: 0, y: 0, z: RETURN_Z }, rotation: { x: 0, y: Math.PI, z: 0 } });
      addChild(group, portal);
      for (let row = MIRROR_ROWS; row < ROWS; row++) {
        for (let col = 0; col < PORTAL_COLS; col++) {
          const x = RETURN_HALF_W - (col + 0.5) * RETURN_HALF_W * 2 / PORTAL_COLS;
          rackAt(portal, BANKS + col, x, row, Math.atan2(-x, RETURN_Z));
        }
      }
      const frame = [];
      for (const x of [-RETURN_HALF_W, RETURN_HALF_W]) frame.push(box({ w: 0.06, h: RETURN_HEIGHT, d: 0.06,
        color: "#65717a", emissive: 0.15, offset: { x, y: RETURN_HEIGHT / 2, z: -0.02 } }));
      frame.push(box({ w: RETURN_HALF_W * 2, h: 0.06, d: 0.06, color: "#65717a", emissive: 0.15,
        offset: { y: RETURN_HEIGHT, z: -0.02 } }));
      add(merge(...frame), portal);
      returnMirror = add({ ...mirror.node.geometry, reflector: true }, portal, { x: 0, y: 1.5, z: 0 });
      // A five-spoke caster base beneath a separately rotating padded office chair.
      const metal = "#657178", dark = "#30383c", base = [lathe({ profile: [[0.16, 0.16], [0.16, 0.3], [0.085, 0.3], [0.085, 0.59]],
        segments: 12, color: metal, emissive: 0.25 })];
      for (let i = 0; i < 5; i++) {
        const a = i * TAU / 5, x = Math.sin(a) * 0.73, z = Math.cos(a) * 0.73;
        base.push(beam(0, 0.27, 0, x, 0.16, z, 0.09, metal, 0.25));
        base.push(bevelBox({ w: 0.16, h: 0.16, d: 0.22, color: dark, emissive: 0.2, offset: { x, y: 0.09, z } }));
      }
      add(merge(...base));
      const padded = [bevelBox({ w: 1.36, h: 0.2, d: 1.16, bevel: 0.08, color: "#e3dfd3", emissive: 0.4, offset: { y: SEAT_TOP - 0.1 } }),
        bevelBox({ w: 1.36, h: 1.4, d: 0.26, bevel: 0.1, color: "#cecfc5", emissive: 0.4, offset: { y: 1.35, z: -0.57 } })];
      for (let i = 0; i < 3; i++) padded.push(bevelBox({ w: 1.19, h: 0.38, d: 0.13, bevel: 0.045, color: "#e9e5da",
        emissive: 0.4, offset: { y: 0.91 + i * 0.4, z: -0.4 } }));
      for (const side of [-1, 1]) {
        const x = side * 0.77;
        padded.push(beam(x, 0.66, -0.41, x, 1.08, -0.45, 0.065, metal, 0.25));
        padded.push(beam(x, 0.66, 0.38, x, 1.08, 0.45, 0.065, metal, 0.25));
        padded.push(bevelBox({ w: 0.15, h: 0.1, d: 1.04, bevel: 0.04, color: dark, emissive: 0.25, offset: { x, y: 1.13 } }));
      }
      chairTop = add(merge(...padded));
      const penGeometry = merge(lathe({ profile: [[0.012, -0.13], [0.016, -0.1], [0.016, 0.15], [0.012, 0.17]],
        segments: 8, color: "#202932", emissive: 0.2 }),
        lathe({ profile: [[0.002, -0.18], [0.012, -0.13]], segments: 8, color: "#c9d0d4", emissive: 0.35 }),
        box({ w: 0.012, h: 0.09, d: 0.012, color: "#c9d0d4", emissive: 0.35, offset: { x: 0.02, y: 0.11 } }));
      penGeometry.characterPart = true;
      pen = add(penGeometry, group); pen.rotation.z = -0.35; removePen();
      const live = new Set(meshes); cameras.liveGeometry(live); renderer.prepareScene(live);
      for (const mesh of live) renderer.prepareGeometry(mesh);
    };
    const resetBroadcast = () => {
      broadcast = "feeds"; broadcastTime = 0; portraitActor = broadcastActor = null;
      manual = manualFace = false;
      faceWait = FACE_WAIT * (0.75 + Math.random() * 0.5); faceHold = FACE_HOLD * (0.75 + Math.random() * 0.5);
      for (const p of panels) p.node.geometry = p.normal;
      if (cameras.portrait) cameras.portrait.forceCapture = false;
    };
    const beginSweep = phase => {
      broadcast = phase; broadcastTime = 0;
      for (let row = 0; row < ROWS; row++) rowJitter[row] = Math.random() * 0.12;
      for (const p of panels) p.delay = p.distance * 2.9 + (ROWS - 1 - p.row) / (ROWS - 1) * 0.7 + rowJitter[p.row] + Math.random() * 0.35;
    };
    const updateBroadcast = (dt, actor) => {
      if (document.hidden) return;
      const face = cameras.portrait;
      if (broadcastActor !== actor) { resetBroadcast(); broadcastActor = actor; }
      const holding = seated();
      if (holding !== manual) {
        manual = holding; manualFace = broadcast === "face" || broadcast === "to-face";
        broadcastTime = 0;
        faceWait = FACE_WAIT * (0.75 + Math.random() * 0.5); faceHold = FACE_HOLD * (0.75 + Math.random() * 0.5);
        if (broadcast === "feeds") { portraitActor = null; face.forceCapture = false; }
      }
      broadcastTime += dt;
      if (broadcast === "feeds" && (manual ? manualFace : broadcastTime >= faceWait - 0.75) && portraitActor !== actor) {
        portraitActor = actor; face.pending = true; face.last = -Infinity; face.forceCapture = true;
        face.geometry.imageSurface.version++;
      }
      // Face framing follows the authored head transform, including swivel, looking and custom proportions.
      if (broadcast !== "feeds" || portraitActor) {
        BL.scene.updateWorld(actor.root, actor.root.parent?.world);
        const head = actor.parts.head, m = head.world, b = BL.scene.boundsOf(head.geometry), c = b.center, cam = face.camera;
        cam.target.x = m[0] * c[0] + m[4] * c[1] + m[8] * c[2] + m[12];
        cam.target.y = m[1] * c[0] + m[5] * c[1] + m[9] * c[2] + m[13];
        cam.target.z = m[2] * c[0] + m[6] * c[1] + m[10] * c[2] + m[14];
        const scale = Math.hypot(m[4], m[5], m[6]), widthScale = Math.hypot(m[0], m[1], m[2]);
        const distance = Math.max(0.65, (b.max[1] - b.min[1]) * scale * 2, (b.max[0] - b.min[0]) * widthScale * 1.3);
        const forward = Math.hypot(m[8], m[9], m[10]) || 1, up = scale || 1;
        cam.position.x = cam.target.x + m[8] / forward * distance;
        cam.position.y = cam.target.y + m[9] / forward * distance;
        cam.position.z = cam.target.z + m[10] / forward * distance;
        clampCamera(cam.position);
        cam.up.x = m[4] / up; cam.up.y = m[5] / up; cam.up.z = m[6] / up;
        cam.far = distance + RADIUS * 2 + 1;
      }
      if (broadcast === "feeds" && (manual ? manualFace : broadcastTime >= faceWait) && (!face.pending || renderer.kind !== "webgl2")) beginSweep("to-face");
      if (broadcast === "face" && (manual ? !manualFace : broadcastTime >= faceHold)) beginSweep("to-feeds");
      if (broadcast === "to-face" || broadcast === "to-feeds") {
        const toFace = broadcast === "to-face";
        for (const p of panels) p.node.geometry = (broadcastTime >= p.delay) === toFace ? p.portrait : p.normal;
        if (broadcastTime >= FACE_SWEEP) {
          broadcast = toFace ? "face" : "feeds"; broadcastTime = 0;
          if (!toFace) { portraitActor = null; faceWait = FACE_WAIT * (0.75 + Math.random() * 0.5); }
          else faceHold = FACE_HOLD * (0.75 + Math.random() * 0.5);
        }
      }
    };
    const toggleView = () => {
      if (!seated()) return false;
      if (!manual) updateBroadcast(0, pilot.player);
      manualFace = !manualFace;
      if (!manualFace && broadcast === "feeds") { portraitActor = null; cameras.portrait.forceCapture = false; }
      return true;
    };
    const travel = (inside) => {
      if (seat.sitter) crew.standPlayer(seat.sitter);
      prepare(); resetBroadcast(); active = inside; group.visible = inside; cooldown = 1; veil = 0.45;
      const m = mirror.mouth;
      destination.position.x = inside ? 0 : m.x + Math.sin(m.ry) * 2.4;
      destination.position.y = inside ? FLOOR : m.floorY;
      destination.position.z = inside ? 7.8 : m.z + Math.cos(m.ry) * 2.4;
      destination.yaw = inside ? 0 : m.ry + Math.PI;
      destination.pitch = inside ? 0.08 : pilot.orbit.pitch; destination.dist = Math.min(5, pilot.orbit.dist);
      pilot.controls.reset(); pilot.navigate(destination);
      parkEquipment(inside ? pilot.player : null);
      if (inside && !audio) audio = BL.architectAudio.create();
      audio?.setActive(inside); cameras.setActive(inside); weather.setExterior(!inside);
      previousAlong = NaN;
    };
    const update = (dt) => {
      cooldown = Math.max(0, cooldown - dt); veil = Math.max(0, veil - dt);
      const actor = pilot.player;
      if (!actor) { if (active) travel(false); return; }
      if (preview) { preview = false; travel(true); }
      const p = actor.root.position, feet = p.y - actor.baseY;
      if (!active && contains(p.x, feet, p.z)) {
        prepare(); active = true; group.visible = true;
        if (!audio) audio = BL.architectAudio.create();
        audio.setActive(true); cameras.setActive(true); weather.setExterior(false);
      }
      if (active && !contains(p.x, feet, p.z)) { resetBroadcast(); active = false; group.visible = false; audio?.setActive(false); cameras.setActive(false); weather.setExterior(true); }
      parkEquipment(active ? actor : null);
      if (!seated()) removePen();
      if (active) {
        if (seat.sitter && seat.sitter === actor && actor.camp.seat === seat) {
          seat.ry = pilot.orbit.yaw + Math.PI; turnChair();
          actor.root.rotation.y = seat.ry; actor.parts.head.rotation.y = 0;
        }
        updateBroadcast(dt, actor);
        if (broadcast !== "face") cameras.update(dt);
        if (audio) audio.update(dt, camera);
        if (!cooldown && p.z >= RETURN_Z && Math.abs(p.x) < RETURN_HALF_W - 0.4
          && feet >= FLOOR - 0.2 && feet < FLOOR + RETURN_HEIGHT - 0.5) travel(false);
        return;
      }
      const m = mirror.mouth, dx = p.x - m.x, dz = p.z - m.z, sr = Math.sin(m.ry), cr = Math.cos(m.ry);
      const along = dx * sr + dz * cr, across = dx * cr - dz * sr;
      if (dx * dx + dz * dz < 18 * 18 && Math.abs(feet - m.floorY) < 6) prepare();
      if (!cooldown && Number.isFinite(previousAlong) && previousAlong > 0.5 && along <= 0.5
        && Math.abs(across) < 2.1 && feet >= m.floorY - 0.2 && feet < m.floorY + 2.5) travel(true);
      previousAlong = along;
    };
    const clampCamera = (p) => {
      const r = Math.hypot(p.x, p.z), limit = RADIUS - 0.65;
      if (r > limit) { p.x *= limit / r; p.z *= limit / r; }
      p.y = Math.max(FLOOR + 0.25, Math.min(FLOOR + HEIGHT - 0.3, p.y));
    };
    return { prepare, update, travel, clampCamera, feeds, renderFeeds: cameras.renderFeeds, panels, group, cameras, seat, sit, toggleView, supportAt, segmentClear: chairClear,
      nearbySeat(x, y, z, reach) {
        return active && !seat.sitter && Math.hypot(x, z) < Math.min(reach, 1.7)
          && y >= FLOOR - 0.05 && y <= FLOOR + SEAT_TOP + 0.1 ? seat : null;
      },
      get returnMirror() { return returnMirror; },
      get seated() { return seated(); }, get pen() { return pen; },
      get faceWait() { return faceWait; }, get faceHold() { return faceHold; },
      get broadcast() { return broadcast; }, get broadcastTime() { return broadcastTime; },
      observes: cameras.observes, nearFeed: cameras.near,
      get active() { return active; }, get crossing() { return veil > 0; }, get prepared() { return prepared; },
      drawVeil(context) {
        if (!veil) return;
        context.save(); context.globalAlpha = veil / 0.45 * 0.55; context.fillStyle = "#bed8d0";
        context.fillRect(0, 0, context.canvas.clientWidth, context.canvas.clientHeight); context.restore();
      },
      suspend() { if (active) travel(false); audio?.setActive(false); },
      liveGeometry(set) { for (const mesh of meshes) set.add(mesh); cameras.liveGeometry(set); },
      dispose() { if (seat.sitter) crew.standPlayer(seat.sitter); active = false; parkEquipment(null); removePen(); audio?.dispose(); audio = null; cameras.dispose(); removeChild(root, group); meshes.length = panels.length = 0; }
    };
  };
  BL.architectCave = { create, contains, clear, segmentClear, FLOOR, HEIGHT, FACE_WAIT, FACE_SWEEP, FACE_HOLD };
})();
