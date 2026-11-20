// The mirror's observation chamber shares the island's simulation. Its enclosed volume lives below the
// island, reached only through the mirror; no second crew, feed subscription or player is created.
(() => {
  "use strict";
  const BL = window.BL = window.BL || {};
  const { createNode, addChild, removeChild } = BL.scene;
  const { box, bevelBox, beam, lathe, merge, geometry, pushVert, face } = BL.models;
  const FLOOR = -48, RADIUS = 10.8, HEIGHT = 9.1, TAU = Math.PI * 2;
  // Match the island cave's five-metre opening, with its glass reaching the floor.
  const RETURN_HALF_W = 2.5, RETURN_HEIGHT = 3, RETURN_Z = Math.sqrt(RADIUS * RADIUS - RETURN_HALF_W * RETURN_HALF_W);
  const BANKS = 24, ROWS = 6, PITCH = RETURN_HEIGHT / 2, GAP = 0.1, WALL = "#080a0b";
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
  // A balanced shuffle of shared slots, with no touching repeats (including diagonals and the wrap).
  // Slots always hold distinct channels, so periodic channel replacement preserves that guarantee.
  const panelSlots = (count) => {
    const cols = BANKS + 2, slots = new Int16Array(cols * ROWS).fill(-1), uses = new Uint16Array(count);
    for (let row = 0; row < ROWS; row++) for (let col = 0; col < cols; col++) {
      if (row < 2 && col >= BANKS) continue;
      let best = Infinity, choice = -1, ties = 0;
      for (let slot = 0; slot < count; slot++) {
        if (col && slots[row * cols + col - 1] === slot || col === cols - 1 && slots[row * cols] === slot) continue;
        let touches = false;
        if (row) for (let dx = -1; dx <= 1; dx++) if (slots[(row - 1) * cols + (col + dx + cols) % cols] === slot) touches = true;
        if (touches || uses[slot] > best) continue;
        if (uses[slot] < best) { best = uses[slot]; ties = 0; }
        if (Math.random() * ++ties < 1) choice = slot;
      }
      slots[row * cols + col] = choice; uses[choice]++;
    }
    return slots;
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
    const meshes = [], destination = { position: { x: 0, y: FLOOR, z: 7.8 }, yaw: 0, pitch: 0.12, dist: 4, framed: true };
    const params = new URLSearchParams(location.search);
    let preview = params.get("debug") === "1" && params.get("view") === "architect";
    let active = false, prepared = false, previousAlong = NaN, cooldown = 0, veil = 0, audio = null, returnMirror = null, chairTop = null;
    const seat = { kind: "architect-chair", x: 0, y: FLOOR + SEAT_TOP, z: 0, ry: 0, floor: FLOOR,
      walkAt: { x: 0, z: 1.7 }, sitter: null };
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
      const slots = panelSlots(feeds.length), cols = BANKS + 2;
      const rackAt = (bank, col, x, row) => {
        const rack = createNode({ position: { x, y: PITCH * (row + 0.5) + GAP / 2, z: 0.1 }, scale: { x: ((col < BANKS ? 2 * RADIUS * Math.sin(BANK_ANGLE / 2) : RETURN_HALF_W) - GAP) / 3.36,
          y: (PITCH - GAP) / 1.96, z: 0.71 } });
        addChild(bank, rack); add(housing, rack);
        const feed = feeds[slots[row * cols + col]];
        add(feed.geometry, rack, { x: 0, y: 0, z: 0.19 });
        add(feed.label, rack, { x: 0, y: -0.735, z: 0.195 });
      };
      for (let i = 0; i < BANKS; i++) {
        const angle = PORTAL_ANGLE + (i + 0.5) * BANK_ANGLE;
        const bank = createNode({ position: { x: Math.sin(angle) * BANK_RADIUS, y: 0, z: Math.cos(angle) * BANK_RADIUS },
          rotation: { x: 0, y: angle + Math.PI, z: 0 } });
        addChild(group, bank);
        for (let row = 0; row < ROWS; row++) rackAt(bank, i, 0, row);
      }
      const portal = createNode({ position: { x: 0, y: 0, z: RETURN_Z }, rotation: { x: 0, y: Math.PI, z: 0 } });
      addChild(group, portal);
      for (let row = 2; row < ROWS; row++) {
        rackAt(portal, BANKS, 1.25, row); rackAt(portal, BANKS + 1, -1.25, row);
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
      const live = new Set(meshes); renderer.prepareScene(live);
      for (const mesh of live) renderer.prepareGeometry(mesh);
    };
    const travel = (inside) => {
      if (seat.sitter) crew.standPlayer(seat.sitter);
      prepare(); active = inside; group.visible = inside; cooldown = 1; veil = 0.45;
      const m = mirror.mouth;
      destination.position.x = inside ? 0 : m.x + Math.sin(m.ry) * 2.4;
      destination.position.y = inside ? FLOOR : m.floorY;
      destination.position.z = inside ? 7.8 : m.z + Math.cos(m.ry) * 2.4;
      destination.yaw = inside ? 0 : m.ry + Math.PI;
      destination.pitch = inside ? 0.08 : pilot.orbit.pitch; destination.dist = Math.min(5, pilot.orbit.dist);
      pilot.controls.reset(); pilot.navigate(destination);
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
      if (active && !contains(p.x, feet, p.z)) { active = false; group.visible = false; audio?.setActive(false); cameras.setActive(false); weather.setExterior(true); }
      if (active) {
        if (seat.sitter && seat.sitter === actor && actor.camp.seat === seat) {
          seat.ry = pilot.orbit.yaw + Math.PI; turnChair();
          actor.root.rotation.y = seat.ry; actor.parts.head.rotation.y = 0;
        }
        cameras.update(dt);
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
    return { prepare, update, travel, clampCamera, feeds, group, cameras, seat, sit, supportAt, segmentClear: chairClear,
      nearbySeat(x, y, z, reach) {
        return active && !seat.sitter && Math.hypot(x, z) < Math.min(reach, 1.7)
          && y >= FLOOR - 0.05 && y <= FLOOR + SEAT_TOP + 0.1 ? seat : null;
      },
      get returnMirror() { return returnMirror; },
      observes: cameras.observes, nearFeed: cameras.near,
      get active() { return active; }, get crossing() { return veil > 0; }, get prepared() { return prepared; },
      drawVeil(context) {
        if (!veil) return;
        context.save(); context.globalAlpha = veil / 0.45 * 0.55; context.fillStyle = "#bed8d0";
        context.fillRect(0, 0, context.canvas.clientWidth, context.canvas.clientHeight); context.restore();
      },
      suspend() { if (active) travel(false); audio?.setActive(false); },
      liveGeometry(set) { for (const mesh of meshes) set.add(mesh); cameras.liveGeometry(set); },
      dispose() { if (seat.sitter) crew.standPlayer(seat.sitter); audio?.dispose(); audio = null; cameras.dispose(); removeChild(root, group); meshes.length = 0; }
    };
  };
  BL.architectCave = { create, contains, clear, segmentClear, FLOOR, HEIGHT };
})();
