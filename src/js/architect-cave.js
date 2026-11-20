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
  const PORTAL_PITCH = RADIUS * (2 * PORTAL_ANGLE / PORTAL_COLS);
  const SEAT_TOP = 0.72, ARC_STEPS = 8, SCREEN_RADIUS = RADIUS - 0.1 - 0.19 * 0.71;
  // Local chair solids rotate with the upholstery; the low caster base stays underneath it.
  const CHAIR_SOLIDS = [[-0.68, 0, -0.58, 0.68, SEAT_TOP, 0.58],
    [-0.68, SEAT_TOP, -0.8, 0.68, 2.08, -0.35],
    [-0.85, SEAT_TOP, -0.5, -0.7, 1.18, 0.54], [0.7, SEAT_TOP, -0.5, 0.85, 1.18, 0.54]];
  const contains = (x, y, z) => y < -32 && y > -55 && x * x + z * z < 225;
  const clear = (x, z, radius = 0.4) => Math.hypot(x, z) < BANK_RADIUS - radius - 0.25
    || z > RADIUS - 2 && z < RETURN_Z + 0.6 && Math.abs(x) < RETURN_HALF_W - radius - 0.08;
  const segmentClear = (x, y, z, toX, toY, toZ, radius, height) =>
    clear(toX, toZ, radius) && toY >= FLOOR - 1e-7 && toY + height <= FLOOR + HEIGHT
    && (toZ <= RETURN_Z - radius || Math.abs(toX) < RETURN_HALF_W - radius - 0.08 && toY < FLOOR + RETURN_HEIGHT - 0.5);
  const FACE_WAIT = 45, FACE_SWEEP = 2.8, FACE_HOLD = 8, PATCH_SWEEP = 1.1, TILE_FLASH = 0.16;
  const PEN_ARM_REST = -0.75; // The crew's default chair pose; only the shoulder may lift from it.
  // Tile the wall with single screens and square video groups. Independent groups must not repeat
  // a neighboring feed; adjacency within one deliberate mosaic is the only exception.
  const panelLayout = (count, initial = false, previous = null, patch = null) => {
    const cols = BANKS + PORTAL_COLS, cells = new Int16Array(cols * ROWS).fill(-1), groups = [], uses = new Uint16Array(count);
    const fits = (col, row, size) => {
      if (row + size > ROWS || col + size > (col < BANKS ? BANKS : cols)) return false;
      if (patch && (size > patch.maxSize || row + size > patch.row + patch.size || col + size > patch.col + patch.size)) return false;
      for (let y = row; y < row + size; y++) for (let x = col; x < col + size; x++)
        if (y < MIRROR_ROWS && x >= BANKS || cells[y * cols + x] >= 0) return false;
      return true;
    };
    for (let row = patch ? patch.row : 0; row < (patch ? patch.row + patch.size : ROWS); row++)
      for (let col = patch ? patch.col : 0; col < (patch ? patch.col + patch.size : cols); col++) {
      if (!fits(col, row, 1)) continue;
      const roll = Math.random();
      const size = fits(col, row, 3) && (initial && col === 0 && row === 0 || roll < 0.22) ? 3
        : fits(col, row, 2) && (initial && col === 3 && row === 0 || roll < 0.65) ? 2 : 1;
      const id = groups.length;
      groups.push({ col, row, size, slot: -1 });
      for (let y = row; y < row + size; y++) for (let x = col; x < col + size; x++) cells[y * cols + x] = id;
    }
    for (let id = 0; id < groups.length; id++) {
      const g = groups[id], excluded = new Uint8Array(count);
      for (let y = Math.max(0, g.row - 1); y <= Math.min(ROWS - 1, g.row + g.size); y++)
        for (let x = g.col - 1; x <= g.col + g.size; x++) {
          const cell = y * cols + (x + cols) % cols, neighbor = cells[cell];
          if (neighbor >= 0 && neighbor !== id && groups[neighbor].slot >= 0) excluded[groups[neighbor].slot] = 1;
          // Also avoid the outgoing layout, including tiles inside this destination group that have
          // not switched yet. Independent neighbors cannot collide halfway through the wave either.
          if (previous && previous[cell] >= 0) excluded[previous[cell]] = 1;
        }
      let best = Infinity, ties = 0;
      for (let slot = 0; slot < count; slot++) {
        if (excluded[slot] || uses[slot] > best) continue;
        if (uses[slot] < best) { best = uses[slot]; ties = 0; }
        if (Math.random() * ++ties < 1) g.slot = slot;
      }
      if (g.slot < 0 && g.size === 3) {
        // A 3x3 may meet too many old and new channels at once. Singles have at most nine old
        // and eight new neighbors, so splitting this group guarantees a choice within 32 slots.
        g.size = 1;
        for (let y = g.row; y < g.row + 3; y++) for (let x = g.col; x < g.col + 3; x++) {
          if (x === g.col && y === g.row) continue;
          cells[y * cols + x] = groups.length;
          groups.push({ col: x, row: y, size: 1, slot: -1 });
        }
        id--; continue;
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
  // Rounded upholstery with explicit normals keeps broad leather faces and soft rolled edges.
  const cushion = (w, h, d, radius, color) => {
    const g = geometry(), half = [w / 2, h / 2, d / 2], rgb = BL.math.hexToRgb(color), steps = 8;
    g.normals = [];
    for (let axis = 0; axis < 3; axis++) for (const sign of [-1, 1]) {
      const b = (axis + 1) % 3, c = (axis + 2) % 3, start = g.verts.length / 3;
      for (let y = 0; y <= steps; y++) for (let x = 0; x <= steps; x++) {
        const p = [0, 0, 0]; p[axis] = sign * half[axis]; p[b] = (x / steps * 2 - 1) * half[b]; p[c] = (y / steps * 2 - 1) * half[c];
        const core = p.map((v, i) => Math.max(-half[i] + radius, Math.min(half[i] - radius, v)));
        const n = p.map((v, i) => v - core[i]), length = Math.hypot(...n);
        pushVert(g, ...core.map((v, i) => v + n[i] / length * radius));
        g.normals.push(...n.map(v => v / length));
      }
      for (let y = 0; y < steps; y++) for (let x = 0; x < steps; x++) {
        const i = start + y * (steps + 1) + x, ids = [i, i + 1, i + steps + 2, i + steps + 1];
        face(g, sign > 0 ? ids : ids.reverse(), rgb, { emissive: 0.06 });
      }
    }
    return g;
  };
  // A casing follows the same cylinder as its glass, including its top and bottom rails.
  const curvedCase = (w, h, d, z, scaleX, color) => {
    const g = geometry(), rgb = BL.math.hexToRgb(color);
    for (let i = 0; i <= ARC_STEPS; i++) {
      const x = w * (i / ARC_STEPS - 0.5);
      for (const [y, depth] of [[-h / 2, z - d / 2], [-h / 2, z + d / 2], [h / 2, z + d / 2], [h / 2, z - d / 2]]) {
        const r = RADIUS - 0.1 - depth * 0.71;
        pushVert(g, x, y, depth + (r - Math.sqrt(r * r - (x * scaleX) ** 2)) / 0.71);
      }
      if (i) for (let k = 0; k < 4; k++) {
        const a = (i - 1) * 4 + k, b = (i - 1) * 4 + (k + 1) % 4;
        face(g, [a, a + 4, b + 4, b], rgb, { emissive: 0.12 });
      }
    }
    face(g, [0, 1, 2, 3], rgb); const end = ARC_STEPS * 4;
    face(g, [end + 3, end + 2, end + 1, end], rgb);
    return g;
  };
  const create = ({ root, renderer, camera, pilot, crew, mirror, weather, mouths, places }) => {
    const group = createNode({ position: { x: 0, y: FLOOR, z: 0 }, visible: false });
    const cameras = BL.observatoryCameras.create({ renderer, mouths, places }), feeds = cameras.feeds;
    const meshes = [], panels = [], rowJitter = new Float64Array(ROWS), destination = { position: { x: 0, y: FLOOR, z: 7.8 }, yaw: 0, pitch: 0.12, dist: 4, framed: true };
    const tiles = new Array((BANKS + PORTAL_COLS) * ROWS).fill(null);
    const params = new URLSearchParams(location.search);
    const crossingMatrix = BL.math.mat4.create();
    BL.math.mat4.identity(crossingMatrix);
    let preview = params.get("debug") === "1" && params.get("view") === "architect";
    let active = false, prepared = false, previousAlong = NaN, cooldown = 0, veil = 0, audio = null, returnMirror = null, chairTop = null;
    let broadcast = "feeds", broadcastTime = 0, portraitActor = null, broadcastActor = null;
    let manual = false, manualFace = false, faceWait = FACE_WAIT, faceHold = FACE_HOLD;
    let layoutPending = false, layoutStarted = false, layoutTime = 0, layoutWait = 3 + Math.random() * 3;
    let parkedActor = null, jetOwned = false, jetWorn = false, pen = null;
    let penButton = null, penHand = null, penArm = null, penArmPitch = NaN, clickTime = 1;
    const penHandPoint = new Float64Array(3);
    const seat = { kind: "architect-chair", x: 0, y: FLOOR + SEAT_TOP, z: 0, ry: 0, floor: FLOOR,
      walkAt: { x: 0, z: 1.7 }, sitter: null, releaseEquipment: () => removePen() };
    const seated = () => active && seat.sitter === pilot.player && !!seat.sitter && seat.sitter.camp.seat === seat;
    const removePen = () => {
      if (pen?.parent) removeChild(pen.parent, pen);
      if (penArm && penArm.rotation.x === penArmPitch) penArm.rotation.x = PEN_ARM_REST;
      penHand = penArm = null; penArmPitch = NaN;
      clickTime = 1;
    };
    const updatePen = dt => {
      if (!penHand) return;
      clickTime = Math.min(1, clickTime + dt);
      const press = clickTime < 0.05 ? clickTime / 0.05 : clickTime < 0.1 ? 1 : Math.max(0, 1 - (clickTime - 0.1) / 0.07);
      penButton.position.y = 0.19 - press * 0.018;
      // Keep the complete bent arm rigid. Find the fist in the shoulder's frame,
      // then lift only at that shoulder, no higher than a horizontal shoulder-to-fist line.
      const center = BL.scene.boundsOf(penHand.geometry).center;
      penHandPoint.set(center);
      for (let part = penHand; part !== penArm; part = part.parent) {
        BL.scene.updateLocal(part);
        BL.math.mat4.transformPoint(penHandPoint, part.local, penHandPoint[0], penHandPoint[1], penHandPoint[2]);
      }
      const roll = penArm.rotation.z;
      const y = penHandPoint[0] * penArm.scale.x * Math.sin(roll) + penHandPoint[1] * penArm.scale.y * Math.cos(roll);
      const restElevation = Math.atan2(y, penHandPoint[2] * penArm.scale.z) - PEN_ARM_REST;
      const eye = camera.position, target = camera.target;
      const elevation = Math.atan2(target.y - eye.y, Math.hypot(target.x - eye.x, target.z - eye.z));
      const lift = Math.max(0, Math.min(-restElevation, elevation - 0.35 - restElevation));
      penArmPitch = PEN_ARM_REST - lift * pilot.closeMix;
      penArm.rotation.x = penArmPitch;
    };
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
      penHand = seat.sitter.parts.fingersR;
      const actor = seat.sitter;
      penArm = actor.parts.armR;
      if (actor.modelled && actor.fist) {
        const unit = actor.fist.palm / (1.1 * actor.armScale);
        pen.position.x = -0.16 * unit; pen.position.y = -0.35 * unit; pen.position.z = 1.15 * unit;
        pen.scale.x = pen.scale.y = pen.scale.z = 14 * unit;
      } else {
        const b = BL.scene.boundsOf(penHand.geometry), h = actor.traits.height;
        pen.position.x = b.center[0] - h * 0.065; pen.position.y = b.center[1]; pen.position.z = b.center[2];
        pen.scale.x = pen.scale.y = pen.scale.z = h;
      }
      penButton.position.y = 0.19;
      addChild(penHand, pen);
      clickTime = 1;
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
      add(disc(RADIUS + 0.3, 0, "#bdc8c7"));
      // The hangar's softened planar reflection, shared by the whole polished floor.
      if (renderer.kind === "webgl2") {
        const polish = disc(RADIUS + 0.2, 0, "#000000");
        for (let i = 0; i < polish.verts.length; i += 3) { polish.verts[i + 1] = -polish.verts[i + 2]; polish.verts[i + 2] = 0; }
        polish.reflector = true; polish.gloss = 0.3;
        add(polish, group, { x: 0, y: 0.014, z: 0 }).rotation.x = -Math.PI / 2;
      }
      const ceiling = disc(RADIUS + 0.3, HEIGHT, "#ffffff", true);
      for (const f of ceiling.faces) f.emissive = 1;
      add(ceiling);
      // Tile seams remain geometry, so both renderers show the floor's scale.
      const seams = [];
      for (let i = -9; i <= 9; i++) {
        const length = Math.sqrt(RADIUS * RADIUS - i * i) * 2;
        seams.push(box({ w: 0.008, h: 0.004, d: length, color: "#8e9d9c", emissive: 0.2, offset: { x: i, y: 0.003 } }));
        seams.push(box({ w: length, h: 0.004, d: 0.008, color: "#8e9d9c", emissive: 0.2, offset: { y: 0.003, z: i } }));
      }
      add(merge(...seams));
      cameras.prepare();
      const housings = new Map(), glasses = new Map();
      // A continuous cylinder with a flat return mirror below a sealed curved lintel.
      const walls = geometry(), rgb = BL.math.hexToRgb(WALL);
      const wall = (ax, az, bx, bz, low = 0, high = HEIGHT) => {
        const ids = [pushVert(walls, ax, low, az), pushVert(walls, ax, high, az),
          pushVert(walls, bx, high, bz), pushVert(walls, bx, low, bz)];
        face(walls, ids, rgb, { emissive: 0.05 });
      };
      let ax = RETURN_HALF_W, az = RETURN_Z;
      for (let i = 0; i < BANKS * ARC_STEPS; i++) {
        const a = PORTAL_ANGLE + (i + 1) * BANK_ANGLE / ARC_STEPS;
        const bx = i === BANKS * ARC_STEPS - 1 ? -RETURN_HALF_W : Math.sin(a) * RADIUS;
        const bz = i === BANKS * ARC_STEPS - 1 ? RETURN_Z : Math.cos(a) * RADIUS;
        wall(ax, az, bx, bz); ax = bx; az = bz;
      }
      const soffit = pushVert(walls, 0, RETURN_HEIGHT, RETURN_Z);
      for (let i = 0; i < PORTAL_COLS * ARC_STEPS; i++) {
        const a = -PORTAL_ANGLE + i * 2 * PORTAL_ANGLE / (PORTAL_COLS * ARC_STEPS);
        const b = -PORTAL_ANGLE + (i + 1) * 2 * PORTAL_ANGLE / (PORTAL_COLS * ARC_STEPS);
        const ax = Math.sin(a) * RADIUS, az = Math.cos(a) * RADIUS, bx = Math.sin(b) * RADIUS, bz = Math.cos(b) * RADIUS;
        wall(ax, az, bx, bz, RETURN_HEIGHT);
        face(walls, [soffit, pushVert(walls, bx, RETURN_HEIGHT, bz), pushVert(walls, ax, RETURN_HEIGHT, az)], rgb);
      }
      add(walls);
      const layout = panelLayout(feeds.length, true);
      const rackAt = (bank, col, x, row, angle) => {
        const pitchX = col < BANKS ? RADIUS * BANK_ANGLE : PORTAL_PITCH;
        const scaleX = (pitchX - GAP) / 3.36, scaleY = (PITCH - GAP) / 1.96;
        const rack = createNode({ position: { x, y: PITCH * (row + 0.5) + GAP / 2, z: 0.1 },
          scale: { x: scaleX, y: scaleY, z: 0.71 } });
        addChild(bank, rack);
        let housing = housings.get(pitchX), glass = glasses.get(pitchX);
        if (!housing) {
          housing = merge(curvedCase(3.36, 1.96, 0.32, 0, scaleX, "#151b1e"),
            curvedCase(3.18, 1.81, 0.018, 0.172, scaleX, "#485356"));
          glass = BL.observatoryCameras.curvedSurface(3.08, 1.72, scaleX, 0.71, SCREEN_RADIUS - 0.004 * 0.71);
          for (const f of glass.faces) { f.color = [105, 132, 141]; f.emissive = 0.12; }
          glass.glassOpacity = 0.035; glass.glassGrazing = 0.26;
          housings.set(pitchX, housing); glasses.set(pitchX, glass);
        }
        add(housing, rack); add(glass, rack, { x: 0, y: 0, z: 0.194 });
        const group = layout.groups[layout.cells[row * layout.cols + col]], feed = feeds[group.slot];
        const normal = cameras.panel(feed, group.size, col - group.col, row - group.row, pitchX, PITCH, scaleX, scaleY, SCREEN_RADIUS);
        const portrait = cameras.panel(cameras.portrait, 1, 0, 0, pitchX, PITCH, scaleX, scaleY, SCREEN_RADIUS);
        const node = add(normal, rack, { x: 0, y: 0, z: 0.19 });
        // Spread from the mirror around both sides, with a small randomized middle-row lead.
        panels.push({ node, normal, portrait, row, col, pitchX, scaleX, scaleY, next: null, previous: null, group: group.row * layout.cols + group.col, size: group.size,
          distance: Math.abs(Math.atan2(Math.sin(angle), Math.cos(angle))) / Math.PI, delay: 0, flashTime: 0 });
        tiles[row * layout.cols + col] = panels[panels.length - 1];
      };
      for (let i = 0; i < BANKS; i++) {
        const angle = PORTAL_ANGLE + (i + 0.5) * BANK_ANGLE;
        const bank = createNode({ position: { x: Math.sin(angle) * RADIUS, y: 0, z: Math.cos(angle) * RADIUS },
          rotation: { x: 0, y: angle + Math.PI, z: 0 } });
        addChild(group, bank);
        for (let row = 0; row < ROWS; row++) rackAt(bank, i, 0, row, angle);
      }
      const portal = createNode({ position: { x: 0, y: 0, z: RETURN_Z }, rotation: { x: 0, y: Math.PI, z: 0 } });
      addChild(group, portal);
      // The monitors above the mirror follow the same circular wall; only the usable glass stays flat.
      for (let col = 0; col < PORTAL_COLS; col++) {
        const angle = TAU - PORTAL_ANGLE + (col + 0.5) * 2 * PORTAL_ANGLE / PORTAL_COLS;
        const bank = createNode({ position: { x: Math.sin(angle) * RADIUS, y: 0, z: Math.cos(angle) * RADIUS },
          rotation: { x: 0, y: angle + Math.PI, z: 0 } });
        addChild(group, bank);
        for (let row = MIRROR_ROWS; row < ROWS; row++) rackAt(bank, BANKS + col, 0, row, angle);
        const infill = createNode({ cameraHidden: true }); addChild(bank, infill);
        const pitchX = PORTAL_PITCH, scaleX = (pitchX - GAP) / 3.36, scaleY = (PITCH - GAP) / 1.96;
        const faceTile = cameras.panel(cameras.portrait, 1, 0, 0, pitchX, PITCH, scaleX, scaleY, SCREEN_RADIUS);
        const infillScreen = { ...faceTile, architectFeedOnly: true, imageSurface: { ...faceTile.imageSurface, seedFeed: feeds[0] } };
        const infillFrame = { ...housings.get(pitchX), castShadow: false, architectFeedOnly: true };
        for (let row = 0; row < MIRROR_ROWS; row++) {
          const rack = createNode({ position: { x: 0, y: PITCH * (row + 0.5) + GAP / 2, z: 0.1 }, scale: { x: scaleX, y: scaleY, z: 0.71 } });
          addChild(infill, rack); add(infillFrame, rack); add(infillScreen, rack, { x: 0, y: 0, z: 0.19 });
        }
      }
      const frame = [];
      for (const x of [-RETURN_HALF_W, RETURN_HALF_W]) frame.push(box({ w: 0.06, h: RETURN_HEIGHT, d: 0.06,
        color: "#65717a", emissive: 0.15, offset: { x, y: RETURN_HEIGHT / 2, z: -0.02 } }));
      frame.push(box({ w: RETURN_HALF_W * 2, h: 0.06, d: 0.06, color: "#65717a", emissive: 0.15,
        offset: { y: RETURN_HEIGHT, z: -0.02 } }));
      add(merge(...frame), portal);
      returnMirror = add({ ...mirror.node.geometry, reflector: true }, portal, { x: 0, y: 1.5, z: 0 });
      // Sculpted black leather over a reclining shell, on a real five-spoke swivel pedestal.
      const metal = "#869095", dark = "#171c20";
      const base = [lathe({ profile: [[0, 0.15], [0.18, 0.15], [0.18, 0.25], [0.12, 0.31], [0.075, 0.31], [0.075, 0.56], [0, 0.56]],
        segments: 20, color: metal, emissive: 0.12 })];
      const wheel = lathe({ profile: [[0, -0.035], [0.08, -0.035], [0.11, -0.02], [0.11, 0.02], [0.08, 0.035], [0, 0.035]],
        segments: 16, color: "#111518" });
      wheel.smooth = true;
      const hub = lathe({ profile: [[0, -0.005], [0.035, -0.005], [0.035, 0.005], [0, 0.005]], segments: 12, color: metal, emissive: 0.15 });
      const fork = bevelBox({ w: 0.18, h: 0.11, d: 0.11, bevel: 0.025, color: "#414b50" });
      for (let i = 0; i < 5; i++) {
        const a = i * TAU / 5, sx = Math.sin(a), cz = Math.cos(a);
        base.push(beam(sx * 0.12, 0.27, cz * 0.12, sx * 0.43, 0.2, cz * 0.43, 0.1, metal, 0.1));
        base.push(beam(sx * 0.43, 0.2, cz * 0.43, sx * 0.73, 0.14, cz * 0.73, 0.075, metal, 0.1));
        const caster = createNode({ position: { x: sx * 0.73, y: 0.115, z: cz * 0.73 }, rotation: { x: 0, y: a + 0.3, z: 0 } });
        addChild(group, caster);
        add(fork, caster, { x: 0, y: 0.07, z: 0 });
        for (const side of [-1, 1]) {
          add(wheel, caster, { x: side * 0.09, y: 0, z: 0 }).rotation.z = Math.PI / 2;
          add(hub, caster, { x: side * 0.127, y: 0, z: 0 }).rotation.z = Math.PI / 2;
        }
      }
      add(merge(...base));
      chairTop = createNode(); addChild(group, chairTop);
      const pad = (w, h, d, r, color, x, y, z, recline = 0) => {
        const node = add(cushion(w, h, d, r, color), chairTop, { x, y, z }); node.rotation.x = recline; return node;
      };
      pad(1.32, 0.2, 1.12, 0.085, "#14171a", 0, SEAT_TOP - 0.1, 0);
      pad(1.25, 0.065, 1.05, 0.025, "#080b0e", 0, 0.52, -0.015);
      pad(1.3, 1.38, 0.23, 0.095, "#0b0e11", 0, 1.36, -0.59, -0.09);
      for (let i = 0; i < 3; i++) {
        const y = 0.91 + i * 0.4, z = -0.4 - i * 0.035;
        pad(1.15 + (i === 1 ? 0.025 : 0), 0.375, 0.17, 0.08, i === 1 ? "#1b1e21" : "#16191c", 0, y, z, -0.09);
        // A recessed seam and narrow welt separate the upholstered panels.
        add(beam(-0.51, y - 0.17, z + 0.065, 0.51, y - 0.17, z + 0.065, 0.012, "#080a0c"), chairTop);
      }
      const chairFrame = [];
      for (const side of [-1, 1]) {
        const x = side * 0.77;
        // Brackets start inside the seat shell; each upright overlaps the rail under its pad.
        chairFrame.push(beam(side * 0.52, 0.53, -0.39, x, 0.56, -0.39, 0.065, metal, 0.12));
        chairFrame.push(beam(side * 0.52, 0.53, 0.35, x, 0.56, 0.35, 0.065, metal, 0.12));
        chairFrame.push(beam(x, 0.56, -0.39, x, 0.95, -0.48, 0.055, metal, 0.12));
        chairFrame.push(beam(x, 0.95, -0.48, x, 1.10, -0.37, 0.055, metal, 0.12));
        chairFrame.push(beam(x, 0.56, 0.35, x, 1.10, 0.42, 0.055, metal, 0.12));
        chairFrame.push(beam(x, 1.085, -0.4, x, 1.085, 0.44, 0.065, metal, 0.12));
        chairFrame.push(beam(side * 0.59, 0.6, -0.57, side * 0.59, 1.9, -0.7, 0.04, metal, 0.1));
        pad(0.155, 0.11, 1.02, 0.05, "#111518", x, 1.125, 0.015);
      }
      chairFrame.push(beam(0.18, 0.51, 0.05, 0.58, 0.48, 0.13, 0.028, metal, 0.1));
      add(merge(...chairFrame), chairTop);
      pad(0.19, 0.055, 0.085, 0.025, dark, 0.57, 0.48, 0.13);
      const penGeometry = merge(lathe({ profile: [[0.012, -0.13], [0.016, -0.1], [0.016, 0.15], [0.012, 0.17]],
        segments: 8, color: "#202932", emissive: 0.2 }),
        lathe({ profile: [[0.002, -0.18], [0.012, -0.13]], segments: 8, color: "#c9d0d4", emissive: 0.35 }),
        box({ w: 0.012, h: 0.09, d: 0.012, color: "#c9d0d4", emissive: 0.35, offset: { x: 0.02, y: 0.11 } }));
      penGeometry.characterPart = true;
      pen = add(penGeometry, group); pen.rotation.z = Math.PI / 2; removePen();
      const buttonGeometry = lathe({ profile: [[0.011, -0.02], [0.011, 0.02]], segments: 8, color: "#c9d0d4", emissive: 0.35 });
      buttonGeometry.characterPart = true;
      penButton = add(buttonGeometry, pen, { x: 0, y: 0.19, z: 0 });
      const live = new Set(meshes); cameras.liveGeometry(live); renderer.prepareScene(live);
      for (const mesh of live) renderer.prepareGeometry(mesh);
    };
    const finishLayout = () => {
      layoutPending = layoutStarted = false; layoutTime = 0; layoutWait = 3 + Math.random() * 3;
      for (const p of panels) p.next = p.previous = null;
      for (const feed of feeds) feed.forceCapture = false;
    };
    const stageLayout = () => {
      const cols = BANKS + PORTAL_COLS, selected = panels[Math.floor(Math.random() * panels.length)];
      const patch = { col: selected.group % cols, row: Math.floor(selected.group / cols), size: selected.size, maxSize: 1 };
      // A patch may absorb complete existing groups, never slice a neighboring mosaic in half.
      const fits = size => {
        if (patch.row + size > ROWS || patch.col + size > (patch.col < BANKS ? BANKS : cols)) return false;
        for (let row = patch.row; row < patch.row + size; row++) for (let col = patch.col; col < patch.col + size; col++) {
          const p = tiles[row * cols + col];
          if (!p || p.group % cols < patch.col || Math.floor(p.group / cols) < patch.row
            || p.group % cols + p.size > patch.col + size || Math.floor(p.group / cols) + p.size > patch.row + size) return false;
        }
        return true;
      };
      if (selected.size === 1) patch.size = patch.maxSize = fits(3) ? 3 : fits(2) ? 2 : 1;
      else patch.maxSize = selected.size === 3 && Math.random() < 0.35 ? 2 : 1;
      const previous = new Int16Array(cols * ROWS).fill(-1);
      for (const p of panels) previous[p.row * cols + p.col] = feeds.indexOf(p.normal.imageSurface.feed);
      const layout = panelLayout(feeds.length, false, previous, patch);
      let nearest = Infinity, furthest = 0;
      for (let row = patch.row; row < patch.row + patch.size; row++) rowJitter[row] = Math.random() * 0.05;
      for (const p of panels) {
        const id = layout.cells[p.row * layout.cols + p.col], g = layout.groups[id];
        if (!g) continue;
        const normal = cameras.panel(feeds[g.slot], g.size, p.col - g.col, p.row - g.row, p.pitchX, PITCH, p.scaleX, p.scaleY, SCREEN_RADIUS);
        renderer.prepareGeometry(normal);
        p.previous = { normal: p.normal, group: p.group, size: p.size };
        p.next = { normal, group: g.row * cols + g.col, size: g.size };
        nearest = Math.min(nearest, p.distance); furthest = Math.max(furthest, p.distance);
      }
      for (const p of panels) if (p.next) p.delay = (p.distance - nearest) / Math.max(0.001, furthest - nearest) * 0.4
        + (p.row - patch.row) * 0.2 + rowJitter[p.row] + Math.random() * 0.01;
      layoutPending = true; layoutStarted = false; layoutTime = 0;
    };
    const sweepDelays = () => {
      for (let row = 0; row < ROWS; row++) {
        const edge = Math.abs(row * 2 / (ROWS - 1) - 1);
        rowJitter[row] = 2.12 + edge * 0.18 + Math.random() * 0.14;
      }
      // Similar row speeds favor the middle without a fixed ranking. Tile jitter stays below one column's travel time.
      for (const p of panels) p.delay = p.distance * rowJitter[p.row] + Math.random() * 0.038;
    };
    const showTile = (p, geometry) => {
      if (p.node.geometry === geometry) return;
      p.node.geometry = geometry;
      // Use the existing per-instance highlight: the picture stays underneath, with no extra draw or capture.
      p.flashTime = TILE_FLASH; p.node.highlight = 0.9;
    };
    const replaceTile = p => {
      if (!p.next || !cameras.ready(p.next.normal.imageSurface.feed)) return false;
      p.normal = p.next.normal; p.group = p.next.group; p.size = p.next.size; p.next = null;
      showTile(p, p.normal);
      return true;
    };
    const updateLayout = dt => {
      let ready = true;
      for (const p of panels) if (p.next && !cameras.ready(p.next.normal.imageSurface.feed)) {
        p.next.normal.imageSurface.feed.forceCapture = true; ready = false;
      }
      if (!layoutStarted) {
        if (!ready) return;
        layoutStarted = true; layoutTime = 0;
      } else layoutTime += dt;
      let remaining = false;
      for (const p of panels) if (p.next) {
        if (layoutTime < p.delay || !replaceTile(p)) remaining = true;
      }
      if (!remaining && layoutTime >= PATCH_SWEEP) finishLayout();
    };
    const resetBroadcast = () => {
      // Travel or an actor change cancels an unfinished layout back to its last complete assignment.
      for (const p of panels) {
        if (p.previous) { p.normal = p.previous.normal; p.group = p.previous.group; p.size = p.previous.size; }
        p.node.geometry = p.normal; p.flashTime = 0; p.node.highlight = 0;
      }
      finishLayout();
      broadcast = "feeds"; broadcastTime = 0; portraitActor = broadcastActor = null;
      manual = manualFace = false;
      faceWait = FACE_WAIT * (0.75 + Math.random() * 0.5); faceHold = FACE_HOLD * (0.75 + Math.random() * 0.5);
      if (cameras.portrait) cameras.portrait.forceCapture = false;
    };
    const beginSweep = phase => {
      broadcast = phase; broadcastTime = 0;
      layoutStarted = false;
      sweepDelays();
    };
    const updateBroadcast = (dt, actor) => {
      if (document.hidden) return;
      for (const p of panels) if (p.flashTime > 0) {
        p.flashTime = Math.max(0, p.flashTime - dt);
        const fade = p.flashTime / TILE_FLASH;
        p.node.highlight = 0.9 * fade * fade;
      }
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
      if (broadcast === "feeds") {
        if (layoutPending) updateLayout(dt);
        else if (!portraitActor && !(manual ? manualFace : broadcastTime >= faceWait - 0.75)) {
          layoutWait -= dt;
          if (layoutWait <= 0) stageLayout();
        }
      }
      if (broadcast === "feeds" && !layoutPending && (manual ? manualFace : broadcastTime >= faceWait - 0.75) && portraitActor !== actor) {
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
      if (broadcast === "feeds" && !layoutPending && (manual ? manualFace : broadcastTime >= faceWait) && cameras.ready(face)) beginSweep("to-face");
      if (broadcast === "face" && (manual ? !manualFace : broadcastTime >= faceHold)) beginSweep("to-feeds");
      if (broadcast === "to-face" || broadcast === "to-feeds") {
        const toFace = broadcast === "to-face";
        const ready = toFace || cameras.warm();
        if (!toFace && !layoutStarted) {
          if (!ready) return;
          layoutStarted = true; broadcastTime = 0; sweepDelays();
        }
        let remaining = false;
        for (const p of panels) {
          if (broadcastTime < p.delay) { remaining = true; continue; }
          if (toFace) {
            if (cameras.ready(face)) showTile(p, p.portrait);
            else remaining = true;
          } else if (cameras.ready(p.normal.imageSurface.feed)) showTile(p, p.normal);
          else remaining = true;
        }
        if (!remaining && broadcastTime >= FACE_SWEEP) {
          broadcast = toFace ? "face" : "feeds"; broadcastTime = 0;
          if (!toFace) { finishLayout(); portraitActor = null; faceWait = FACE_WAIT * (0.75 + Math.random() * 0.5); }
          else faceHold = FACE_HOLD * (0.75 + Math.random() * 0.5);
        }
      }
    };
    const toggleView = () => {
      if (!seated()) return false;
      if (!manual) updateBroadcast(0, pilot.player);
      manualFace = !manualFace;
      clickTime = 0; audio?.click();
      if (!manualFace && broadcast === "feeds") { portraitActor = null; cameras.portrait.forceCapture = false; }
      return true;
    };
    const travel = (inside, preserveView = true) => {
      const actor = pilot.player, crossing = preserveView && actor && inside !== active;
      if (seat.sitter) crew.standPlayer(seat.sitter);
      prepare(); resetBroadcast(); active = inside; group.visible = inside; cooldown = 1; veil = 0.45;
      const m = mirror.mouth;
      destination.position.x = inside ? 0 : m.x + Math.sin(m.ry) * 2.4;
      destination.position.y = inside ? FLOOR : m.floorY;
      destination.position.z = inside ? 7.8 : m.z + Math.cos(m.ry) * 2.4;
      destination.yaw = inside ? 0 : m.ry + Math.PI;
      destination.pitch = inside ? 0.08 : pilot.orbit.pitch; destination.dist = Math.min(5, pilot.orbit.dist);
      if (crossing) {
        // Rotate the entire view and body between the two doorway frames. Backing through
        // keeps the mirror in front of the Ooga, with the held movement still pointing away.
        const yaw = inside ? -m.ry : m.ry, c = Math.cos(yaw), s = Math.sin(yaw), p = actor.root.position;
        const lift = actor.viewLift;
        crossingMatrix[0] = crossingMatrix[10] = c;
        crossingMatrix[2] = -s; crossingMatrix[8] = s;
        crossingMatrix[12] = destination.position.x - c * p.x - s * p.z;
        crossingMatrix[13] = destination.position.y + actor.baseY - p.y;
        crossingMatrix[14] = destination.position.z + s * p.x - c * p.z;
        crew.relocatePlayer(destination.position, actor.root.rotation.y + yaw);
        crew.elevate(lift);
        pilot.transformView(crossingMatrix, yaw);
      } else pilot.navigate(destination);
      parkEquipment(inside ? pilot.player : null);
      if (inside && !audio) audio = BL.architectAudio.create();
      audio?.setActive(inside); cameras.setActive(inside); weather.setExterior(!inside);
      previousAlong = NaN;
    };
    const update = (dt) => {
      cooldown = Math.max(0, cooldown - dt); veil = Math.max(0, veil - dt);
      const actor = pilot.player;
      if (!actor) { if (active) travel(false); return; }
      if (preview) { preview = false; travel(true, false); }
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
        const rotating = broadcast === "feeds" && !layoutPending && !portraitActor;
        updateBroadcast(dt, actor);
        updatePen(dt);
        if (rotating && broadcast === "feeds" && !layoutPending && !portraitActor) cameras.update(dt);
        if (audio) audio.update(dt, camera, broadcast === "face" || broadcast === "to-face", seated());
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
      get seated() { return seated(); }, get pen() { return pen; }, get penButton() { return penButton; },
      get layoutPending() { return layoutPending; }, get layoutWait() { return layoutWait; },
      get faceWait() { return faceWait; }, get faceHold() { return faceHold; },
      get broadcast() { return broadcast; }, get broadcastTime() { return broadcastTime; },
      observes: cameras.observes, nearFeed: cameras.near,
      get active() { return active; }, get crossing() { return veil > 0; }, get prepared() { return prepared; },
      drawVeil(context) {
        if (!veil) return;
        context.save(); context.globalAlpha = veil / 0.45; context.fillStyle = "#000000";
        context.fillRect(0, 0, context.canvas.clientWidth, context.canvas.clientHeight); context.restore();
      },
      suspend() { if (active) travel(false); audio?.setActive(false); },
      liveGeometry(set) { for (const mesh of meshes) set.add(mesh); cameras.liveGeometry(set); },
      dispose() { if (seat.sitter) crew.standPlayer(seat.sitter); active = false; parkEquipment(null); removePen(); audio?.dispose(); audio = null; cameras.dispose(); removeChild(root, group); meshes.length = panels.length = 0; tiles.fill(null); }
    };
  };
  BL.architectCave = { create, contains, clear, segmentClear, FLOOR, HEIGHT, FACE_WAIT, FACE_SWEEP, FACE_HOLD };
})();
