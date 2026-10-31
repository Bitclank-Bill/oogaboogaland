// The Cloud Archive's room: a white floor without edges, the shaft the beanstalk comes up through, and one dark rack a
// day down a long aisle, each holding a book per commit (cloud-archive-data.js), coloured by who made it: grey for
// automation, gold for a merged PR. Every rack is one merged mesh, books and all; nothing here is per book.
// `LAYOUT` is the walking plan the interior reads; `build` makes the nodes. Geometry is cached under the
// `cloudarchive` scope and released with it.
(() => {
  "use strict";
  const BL = window.BL;
  const { box, merge, moved, cached } = BL.models;
  const { createNode, addChild } = BL.scene;
  const { fnv1a, hexToRgb } = BL.math;
  const DATA = BL.cloudArchiveData;
  // The shaft is a rectangle in the floor (x0..x1, z0..z1) down to `depth`; the beanstalk stands against its north
  // lip and the ladder plane is its south face (normal +z: the floor, the upper landing, lies to the north).
  const SHAFT = { x0: -1.3, x1: 1.3, z0: 5.2, z1: 7.8, depth: 4.5 };
  const STALK = { x: 0, z: 5.0, r: 0.32 };
  const LADDER = { x: 0, z: STALK.z + STALK.r, nx: 0, nz: 1, width: 1.2, bottom: -SHAFT.depth, top: 0, inset: 0.5 };
  // Racks: one a day, oldest nearest, alternating left and right of the aisle.
  const RACK = { w: 2.6, d: 0.5, h: 2.7, levels: 4, perLevel: 48, aisle: 3.2, pitch: 3.2, first: -1.5 };
  const rackAt = (i) => ({ x: (i % 2 ? 1 : -1) * RACK.aisle, z: RACK.first - Math.floor(i / 2) * RACK.pitch, ry: i % 2 ? -Math.PI / 2 : Math.PI / 2 });
  const rows = Math.ceil(DATA.days.length / 2);
  const LAYOUT = {
    SHAFT, STALK, LADDER, RACK, rackAt,
    arrival: { x: 0, z: 7.0 },
    // Walkers stay on the floor within these bounds.
    bounds: { x0: -9, x1: 9, z0: RACK.first - rows * RACK.pitch - 4, z1: 11 },
    inShaft: (x, z, margin = 0) => x > SHAFT.x0 + margin && x < SHAFT.x1 - margin && z > SHAFT.z0 + margin && z < SHAFT.z1 - margin
  };
  const own = (build) => { const read = cached(build); return () => BL.models.withScope("cloudarchive", read); };
  const WHITE = "#f4f5f7", LIP = "#e6e9ee", FRAME = "#2a2c31", BOARD = "#3a3d44", GOLD = "#e8b04a", BOT = "#9aa0a8";
  const flat = (x0, z0, x1, z1, y, color) => {
    const c = hexToRgb(color);
    return { verts: [x0, y, z0, x0, y, z1, x1, y, z1, x1, y, z0], faces: [{ i: [0, 1, 2, 3], color: c, emissive: 0 }], lines: [] };
  };
  // The floor round the shaft as four big panels, and the shaft's walls and bottom, all flat white.
  const floor = own(() => {
    const R = 400, S = SHAFT, d = S.depth;
    const geo = merge(
      flat(-R, -R, R, S.z0, 0, WHITE), flat(-R, S.z1, R, R, 0, WHITE),
      flat(-R, S.z0, S.x0, S.z1, 0, WHITE), flat(S.x1, S.z0, R, S.z1, 0, WHITE),
      flat(S.x0, S.z0, S.x1, S.z1, -d, LIP),
      box({ w: S.x1 - S.x0, h: d, d: 0.1, color: LIP, offset: { x: 0, y: -d / 2, z: S.z0 - 0.05 } }),
      box({ w: S.x1 - S.x0, h: d, d: 0.1, color: LIP, offset: { x: 0, y: -d / 2, z: S.z1 + 0.05 } }),
      box({ w: 0.1, h: d, d: S.z1 - S.z0, color: LIP, offset: { x: S.x0 - 0.05, y: -d / 2, z: (S.z0 + S.z1) / 2 } }),
      box({ w: 0.1, h: d, d: S.z1 - S.z0, color: LIP, offset: { x: S.x1 + 0.05, y: -d / 2, z: (S.z0 + S.z1) / 2 } })
    );
    geo.castShadow = false;
    return geo;
  });
  // A colour a person keeps on every shelf: a hue from their name, never too pale for the white room.
  const personColor = (index) => {
    const h = fnv1a(DATA.people[index]) % 360, s = 0.55, l = 0.48;
    const k = (n) => (n + h / 30) % 12, a = s * Math.min(l, 1 - l);
    const f = (n) => Math.round(255 * (l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1))));
    return `#${[f(0), f(8), f(4)].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
  };
  // One day's rack in its own frame: length along x, front facing +z, standing on y = 0.
  const rackGeometry = (day) => {
    const W = RACK.w, D = RACK.d, H = RACK.h, parts = [];
    const gap = H / (RACK.levels + 0.4);
    for (const sx of [-1, 1]) parts.push(box({ w: 0.06, h: H, d: D, color: FRAME, offset: { x: sx * (W / 2 - 0.03), y: H / 2 } }));
    parts.push(box({ w: W, h: H, d: 0.04, color: FRAME, offset: { y: H / 2, z: -D / 2 + 0.02 } }));
    for (let level = 0; level <= RACK.levels; level++) parts.push(box({ w: W - 0.08, h: 0.04, d: D, color: BOARD, offset: { y: 0.12 + level * gap } }));
    const step = (W - 0.16) / RACK.perLevel;
    day.commits.forEach((c, n) => {
      const level = Math.floor(n / RACK.perLevel), slot = n % RACK.perLevel;
      if (level >= RACK.levels) return;
      const hash = fnv1a(c[0]), tall = 0.28 + (hash % 1000) / 1000 * 0.16, deep = 0.26 + (hash >>> 10) % 100 / 100 * 0.1;
      const color = c[4] & 1 ? BOT : c[3] ? GOLD : personColor(c[1]);
      parts.push(box({ w: step * 0.86, h: tall, d: deep, color, emissive: c[3] ? 0.25 : 0,
        offset: { x: -W / 2 + 0.08 + step * (slot + 0.5), y: 0.14 + level * gap + tall / 2, z: D / 2 - deep / 2 - 0.03 } }));
    });
    return merge(...parts);
  };
  const racks = own(() => DATA.days.map(rackGeometry));
  // The beanstalk's top: up the shaft's north lip from its floor, curling over above the room's floor.
  const stalk = own(() => {
    const geo = BL.cloudArchiveEntry.stalkGeometry(SHAFT.depth + 2.4, STALK.r, 7);
    return moved(geo, 0, -SHAFT.depth, 0);
  });
  // A dated plaque over a rack: a painted canvas the interior hangs.
  const plaque = (canvas, w, h) => {
    const geo = { verts: [-w / 2, -h / 2, 0, w / 2, -h / 2, 0, w / 2, h / 2, 0, -w / 2, h / 2, 0], faces: [{ i: [0, 1, 2, 3], color: [255, 255, 255], emissive: 0.9 }], lines: [], castShadow: false };
    geo.imageSurface = { canvas, version: 1, rect: [-w / 2, -h / 2, w, h] };
    return geo;
  };
  const build = () => {
    const root = createNode();
    addChild(root, createNode({ geometry: floor() }));
    addChild(root, createNode({ geometry: stalk(), position: { x: STALK.x, y: 0, z: STALK.z } }));
    const rackNodes = racks().map((geometry, i) => {
      const at = rackAt(i), node = createNode({ geometry, position: { x: at.x, y: 0, z: at.z }, rotation: { x: 0, y: at.ry, z: 0 } });
      addChild(root, node);
      return node;
    });
    return { root, racks: rackNodes };
  };
  const geometries = () => [floor(), stalk(), ...racks()];
  BL.cloudArchiveModels = { LAYOUT, build, plaque, geometries, personColor };
})();
