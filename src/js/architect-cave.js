// The mirror's observation chamber shares the island's simulation. Its enclosed volume lives below the
// island, reached only through the mirror; no second crew, feed subscription or player is created.
(() => {
  "use strict";
  const BL = window.BL = window.BL || {};
  const { createNode, addChild, removeChild } = BL.scene;
  const { box, merge, geometry, pushVert, face } = BL.models;
  const FLOOR = -48, RADIUS = 10.8, HEIGHT = 8.8, TAU = Math.PI * 2;
  // Match the island cave's five-metre opening, with its glass reaching the floor.
  const RETURN_HALF_W = 2.5, RETURN_HEIGHT = 3, RETURN_Z = RADIUS - 0.65;
  const contains = (x, y, z) => y < -32 && y > -55 && x * x + z * z < 225;
  const clear = (x, z, radius = 0.4) => (Math.hypot(x, z) < RADIUS - radius - 0.55
    || z > RADIUS - 2 && z < RETURN_Z + 0.6 && Math.abs(x) < RETURN_HALF_W - radius - 0.08)
    && !(Math.abs(x) < 1.15 + radius && z > -1.5 - radius && z < 0.8 + radius);
  const segmentClear = (x, y, z, toX, toY, toZ, radius, height) =>
    clear(toX, toZ, radius) && toY >= FLOOR - 1e-7 && toY + height <= FLOOR + HEIGHT
    && (toZ <= RETURN_Z - radius || Math.abs(toX) < RETURN_HALF_W - radius - 0.08 && toY < FLOOR + RETURN_HEIGHT - 0.5)
    && BL.terrain.segmentBoxClear(x, y, z, toX - x, toY - y, toZ - z, radius, height,
      -1.15, FLOOR, -1.5, 1.15, FLOOR + 2.4, 0.8);
  const disc = (radius, y, color, down = false) => {
    const g = geometry(), rgb = BL.math.hexToRgb(color);
    pushVert(g, 0, y, 0);
    for (let i = 0; i <= 48; i++) pushVert(g, Math.sin(i * TAU / 48) * radius, y, Math.cos(i * TAU / 48) * radius);
    for (let i = 1; i <= 48; i++) face(g, down ? [0, i + 1, i] : [0, i, i + 1], rgb, { emissive: 0.32 });
    g.castShadow = false;
    return g;
  };
  const create = ({ root, renderer, camera, pilot, mirror, weather, mouths, places }) => {
    const group = createNode({ position: { x: 0, y: FLOOR, z: 0 }, visible: false });
    const cameras = BL.observatoryCameras.create({ renderer, mouths, places }), feeds = cameras.feeds;
    const meshes = [], destination = { position: { x: 0, y: FLOOR, z: 7.8 }, yaw: 0, pitch: 0.12, dist: 4, framed: true };
    const params = new URLSearchParams(location.search);
    let preview = params.get("debug") === "1" && params.get("view") === "architect";
    let active = false, prepared = false, previousAlong = NaN, cooldown = 0, veil = 0, audio = null, returnMirror = null;
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
      add(disc(RADIUS + 0.3, HEIGHT, "#e9ede5", true));
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
      // Reserve a wider span for the cave-sized return mirror; the 17 screen banks share the rest.
      const mirrorSpan = 2 * Math.asin((RETURN_HALF_W + 0.6) / RADIUS);
      for (let i = 0; i < 18; i++) {
        const angle = i ? mirrorSpan / 2 + (i - 0.5) * (TAU - mirrorSpan) / 17 : 0;
        const x = Math.sin(angle) * RADIUS, z = Math.cos(angle) * RADIUS;
        const bank = createNode({ position: { x, y: 0, z }, rotation: { x: 0, y: angle + Math.PI, z: 0 } });
        addChild(group, bank);
        if (i !== 0) {
          add(box({ w: 3.9, h: HEIGHT, d: 0.4, color: "#080a0b", emissive: 0.05, offset: { y: HEIGHT / 2, z: -0.3 } }), bank);
          for (let row = 0; row < 3; row++) {
            const rack = createNode({ position: { x: 0, y: 1.7 + row * 2.12, z: 0.05 } }); addChild(bank, rack);
            add(housing, rack);
            const feed = feeds[((i - 1) * 3 + row) % feeds.length];
            add(feed.geometry, rack, { x: 0, y: 0, z: 0.19 });
            add(feed.label, rack, { x: 0, y: -0.735, z: 0.195 });
          }
        } else {
          const z = RADIUS - RETURN_Z;
          add(box({ w: 6.3, h: HEIGHT, d: 0.4, color: "#080a0b", emissive: 0.05, offset: { y: HEIGHT / 2, z: -0.3 } }), bank);
          add(box({ w: 5.3, h: 3.16, d: 0.16, color: "#65717a", emissive: 0.15, offset: { y: 1.5, z: z - 0.1 } }), bank);
          // A geometry-owned reflector keeps this separate from the island's main mirror resource.
          returnMirror = add({ ...mirror.node.geometry, reflector: true }, bank, { x: 0, y: 1.5, z });
        }
        if (i) add(box({ w: 0.045, h: 7.9, d: 0.06, color: "#171b1c", emissive: 0.1, offset: { x: 1.87, y: 4.1, z: 0.04 } }), bank);
        add(box({ w: 3.9, h: 0.13, d: 0.12, color: "#effff5", emissive: 0.85, offset: { y: 8.15, z: 0.2 } }), bank);
        add(box({ w: 3.9, h: 0.08, d: 0.1, color: "#a5c5b9", emissive: 0.65, offset: { y: 0.18, z: 0.2 } }), bank);
      }
      const chair = [];
      chair.push(box({ w: 1.8, h: 0.35, d: 1.7, color: "#eeeae0", emissive: 0.45, offset: { y: 0.68, z: -0.35 } }));
      chair.push(box({ w: 1.8, h: 1.8, d: 0.4, color: "#f2eee4", emissive: 0.45, offset: { y: 1.4, z: -1.1 } }));
      for (const side of [-1, 1]) {
        chair.push(box({ w: 0.28, h: 0.7, d: 1.85, color: "#d5d5ce", emissive: 0.4, offset: { x: side * 0.94, y: 0.95, z: -0.35 } }));
        for (const z of [-1, 0.3]) chair.push(box({ w: 0.12, h: 0.5, d: 0.12, color: "#73847f", emissive: 0.3, offset: { x: side * 0.76, y: 0.25, z } }));
      }
      add(merge(...chair));
      const live = new Set(meshes); renderer.prepareScene(live);
      for (const mesh of live) renderer.prepareGeometry(mesh);
    };
    const travel = (inside) => {
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
    return { prepare, update, travel, clampCamera, feeds, group, cameras,
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
      dispose() { audio?.dispose(); audio = null; cameras.dispose(); removeChild(root, group); meshes.length = 0; }
    };
  };
  BL.architectCave = { create, contains, clear, segmentClear, FLOOR, HEIGHT };
})();
