// The Genesis museum's courtyard: the atrium dressed as an Ooga crossroads, after the official island's own (grass,
// sandy paths, palms, round bushes, wooden signs). Navigation only, never evidence: the paths are sand, the signs
// timber; gold stays the atrium centrepiece's mark for the whitepaper's own citations (genesis-atrium.js).
//
// - Paths: a ring round the centrepiece; from it one path to each gallery's opening, on the line of that gallery's
//   central walk; and a clockwise loop near the walls passing every opening, Era 0 to Era 7 and back. They show the
//   way round in date order, not influence.
// - Signs: where each gallery's path crosses the loop, a wooden post with an arrow toward that gallery: its era and
//   years, its name, and two of the exhibits standing in it (from the catalogue, the trail's first).
// - "You are here": a board beside the white timeline screen, painted once from the real layout (genesis-world.js
//   MUSEUM): the atrium, the galleries with their eras, the paths, the centrepiece and where the board stands.
// - Benches from the dressing kit and plants from the island's own builders (dressing.js `palm`, hub-models.js
//   `bush` and `flowerTuft`), only inside the loop and outside the ring, clear of every path, sign, pillar and the
//   view from the arrival to the white screen; only low flowers near a sign.
//
// `layout({ museum, eras, entries, lane })` is pure (Node checks it): { paths, junctions, signs, plants, benches,
// map, obstacles }. `build({ M, createNode, addChild, place, top, layout, hub, dressing, paintMap })` places the
// meshes (one merged ground, one merged timber, shared plant geometries) and returns { mapPick }. No lights, no
// per-frame work.
(() => {
  "use strict";
  const BL = window.BL = window.BL || {};
  // Everything is placed from the atrium's walls (genesis-world.js MUSEUM, sized to its galleries), as
  // scene-genesis.js places the arrival (12 m in from the south wall) and the white screen (26 m in, 18 m wide).
  const A0 = BL.genesisWorld.MUSEUM.atrium, SOUTH = A0.z1;
  const RING_R = 19, RING_W = 3, RADIAL_W = 3.2, LOOP_W = 3;
  const LOOP = { x0: A0.x0 + 7, x1: A0.x1 - 7, z0: A0.z0 + 7, z1: SOUTH - 3.5 };
  const MAP = { x: 11.5, z: SOUTH - 21, w: 4.6, h: 3.2, y: 2.6 };
  // The view from the arrival to the white screen, with a margin.
  const VIEW = { x: 0, z: SOUTH - 12, half: 10, screenZ: SOUTH - 26 };
  const inView = (x, z, pad = 0) => z <= VIEW.z + pad && z >= VIEW.screenZ - pad && Math.abs(x) <= VIEW.half * (VIEW.z - z) / (VIEW.z - VIEW.screenZ) + pad;
  const CLEAR = VIEW;
  // The south galleries' paths go round the white screen and this board, by a waypoint out to each side.
  const SOUTH_BEND = { x: 0.5 * A0.x1, z: SOUTH - 42 };
  // The sign letters the island's carved signs have (hub-models.js SIGN_GLYPHS): anything else is dropped or mapped.
  const GLYPHS = new Set("EntrOopygqjBLabdcefhikl msuvwxzACDFHMPRSTWXGIJKNQUVYZ/0123456789!?+-.".split(""));
  const signText = (s) => String(s).replace(/[–—]/g, "-").replace(/[·:,;()'’"]/g, " ").split("").filter((c) => GLYPHS.has(c)).join("").replace(/\s+/g, " ").trim();
  const shortTitle = (t) => {
    let s = String(t).split(/[:·(]| - | — /)[0].trim();
    if (s.length > 24) s = s.slice(0, 24).replace(/\s+\S*$/, "");
    return signText(s);
  };
  const segDist = (px, pz, s) => {
    const dx = s.x1 - s.x0, dz = s.z1 - s.z0, L = dx * dx + dz * dz, t = L ? Math.max(0, Math.min(1, ((px - s.x0) * dx + (pz - s.z0) * dz) / L)) : 0;
    return Math.hypot(px - (s.x0 + dx * t), pz - (s.z0 + dz * t));
  };
  const layout = ({ museum, eras, entries, lane }) => {
    const A = museum.atrium, paths = [], junctions = [], signs = [], plants = [], benches = [], obstacles = [];
    // The ring: 24 straight pieces round the centrepiece.
    for (let i = 0; i < 24; i++) {
      const a0 = i / 24 * Math.PI * 2, a1 = (i + 1) / 24 * Math.PI * 2;
      paths.push({ kind: "ring", w: RING_W, x0: RING_R * Math.sin(a0), z0: -RING_R * Math.cos(a0), x1: RING_R * Math.sin(a1), z1: -RING_R * Math.cos(a1) });
    }
    // The loop, clockwise seen from above: up the west side, along the north, down the east, back along the south.
    const L = LOOP;
    paths.push({ kind: "loop", w: LOOP_W, x0: L.x0, z0: L.z1, x1: L.x0, z1: L.z0 }, { kind: "loop", w: LOOP_W, x0: L.x0, z0: L.z0, x1: L.x1, z1: L.z0 },
      { kind: "loop", w: LOOP_W, x0: L.x1, z0: L.z0, x1: L.x1, z1: L.z1 }, { kind: "loop", w: LOOP_W, x0: L.x1, z0: L.z1, x1: L.x0, z1: L.z1 });
    // One path per gallery, from the ring out to its opening on the line of its central walk.
    for (const e of eras) {
      const door = museum.toMuseum(e.n, lane, e.z1 - museum.OPEN, { x: 0, z: 0 });
      const south = door.z >= A.z1 - 0.01, bend = south ? { x: Math.sign(door.x) * SOUTH_BEND.x, z: SOUTH_BEND.z } : null;
      const aim = bend || door, al = Math.hypot(aim.x, aim.z);
      const start = { x: aim.x / al * (RING_R + RING_W / 2), z: aim.z / al * (RING_R + RING_W / 2) };
      if (bend) paths.push({ kind: "radial", era: e.n, w: RADIAL_W, x0: start.x, z0: start.z, x1: bend.x, z1: bend.z });
      const from = bend || start;
      paths.push({ kind: "radial", era: e.n, w: RADIAL_W, x0: from.x, z0: from.z, x1: door.x, z1: door.z });
      const dl = Math.hypot(door.x - from.x, door.z - from.z), ux = (door.x - from.x) / dl, uz = (door.z - from.z) / dl;
      // Where it crosses the loop: the gallery's wall decides which side of the loop.
      const west = door.x <= A.x0 + 0.01, east = door.x >= A.x1 - 0.01;
      const t = west ? (L.x0 - from.x) / (door.x - from.x) : east ? (L.x1 - from.x) / (door.x - from.x) : ((door.z < 0 ? L.z0 : L.z1) - from.z) / (door.z - from.z);
      const j = { era: e.n, x: from.x + (door.x - from.x) * t, z: from.z + (door.z - from.z) * t, ux, uz, door };
      junctions.push(j);
      // The sign: on the inner side of the loop (off it by a body's width), beside the gallery's path, clear of every
      // path, its arrow pointing along the gallery's path.
      j.nx = west ? 1 : east ? -1 : 0; j.nz = west || east ? 0 : door.z < 0 ? 1 : -1;
      const g = entries.filter((x) => x.era === e.n && !/-panel$/.test(x.id) && x.connection !== "bibliography");
      // Two of the gallery's exhibits: the trail's first, then dated ones, a modern toy or game only if nothing else.
      const picks = [...g.filter((x) => x.trail), ...g.filter((x) => !x.trail && !x.modern), ...g.filter((x) => !x.trail && x.modern)].slice(0, 2);
      signs.push({ era: e.n, x: j.x, z: j.z, ry: Math.atan2(ux, uz),
        lines: [signText(`ERA ${e.n} ${e.years}`), signText(e.name), ...picks.map((x) => shortTitle(x.title))], exhibits: picks.map((x) => x.id) });
    }
    signs.forEach((sg, i) => {
      const j = junctions[i], tx = -j.nz, tz = j.nx, inset = LOOP_W / 2 + 1.3;
      for (const k of [3, 4, 5, 6, 7, 8, -3, -4, -5, -6, -7, -8]) {
        const x = j.x + j.nx * inset + tx * k, z = j.z + j.nz * inset + tz * k;
        if (paths.every((q) => segDist(x, z, q) > q.w / 2 + 0.8)) { sg.x = x; sg.z = z; break; }
      }
      obstacles.push({ x0: sg.x - 0.35, x1: sg.x + 0.35, z0: sg.z - 0.35, z1: sg.z + 0.35 });
    });
    // Benches along the loop's inner edge, a quarter turn at a time (the kit's), facing the middle.
    const bz0 = -0.51 * A0.z1, bz1 = 0.38 * A0.z1, bx = 0.58 * A0.x1;
    for (const [x, z, turns] of [[0, L.z0 + 3.2, 0], [L.x1 - 3.2, bz0, 3], [L.x1 - 3.2, bz1, 3], [L.x0 + 3.2, bz0, 1], [L.x0 + 3.2, bz1, 1], [-bx, L.z1 - 3.2, 2], [bx, L.z1 - 3.2, 2]]) {
      benches.push({ x, z, turns });
      obstacles.push((turns & 1) ? { x0: x - 0.4, x1: x + 0.4, z0: z - 0.9, z1: z + 0.9 } : { x0: x - 0.9, x1: x + 0.9, z0: z - 0.4, z1: z + 0.4 });
    }
    // The map board beside the white screen.
    obstacles.push({ x0: MAP.x - MAP.w / 2, x1: MAP.x + MAP.w / 2, z0: MAP.z - 0.3, z1: MAP.z + 0.3 });
    // Plants: a jittered grid inside the loop and outside the ring, clear of everything that must stay open.
    // mulberry32, inline, so the page and the Node check lay the same plants.
    const seed = { a: 1956 };
    const rand = () => { let t = (seed.a = (seed.a + 0x6d2b79f5) | 0); t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    for (let gx = L.x0 + 6; gx <= L.x1 - 6; gx += 7) for (let gz = L.z0 + 6; gz <= L.z1 - 6; gz += 7) {
      const x = gx + (rand() - 0.5) * 4, z = gz + (rand() - 0.5) * 4, roll = rand();
      if (Math.hypot(x, z) < RING_R + 6) continue;
      if (inView(x, z, 3) || (Math.abs(x) < 9 && z > SOUTH - 18)) continue;
      if (Math.abs(x - MAP.x) < MAP.w / 2 + 3 && Math.abs(z - MAP.z) < 4) continue;
      if (museum.PILLARS.some((p) => Math.hypot(x - p.x, z - p.z) < 4)) continue;
      if (x < L.x0 + 4 || x > L.x1 - 4 || z < L.z0 + 4 || z > L.z1 - 4) continue;
      const nearPath = Math.min(...paths.map((s) => segDist(x, z, s) - s.w / 2));
      const nearSign = Math.min(...signs.map((s) => Math.hypot(x - s.x, z - s.z)));
      const nearBench = Math.min(...benches.map((b) => Math.hypot(x - b.x, z - b.z)));
      if (nearPath < 1.6 || nearBench < 3) continue;
      // Low planting only near a sign or close to a path; palms only well clear of both.
      const kind = nearSign < 6 || nearPath < 3.5 ? "flower" : roll < 0.28 && nearPath > 5 ? "palm" : roll < 0.75 ? "bush" : "flower";
      if (nearSign < 2.5) continue;
      plants.push({ kind, x, z, v: Math.floor(rand() * 3), ry: rand() * Math.PI * 2 });
      if (kind !== "flower") obstacles.push({ x0: x - 0.45, x1: x + 0.45, z0: z - 0.45, z1: z + 0.45 });
    }
    return { paths, junctions, signs, plants, benches, map: MAP, obstacles, loop: L, ring: { r: RING_R, w: RING_W }, view: VIEW };
  };

  // The lawn under it all: 2 m squares in a mottle of greens, light and dark in drifts (a seeded value noise), so the
  // grass reads as grass from the arrival and from above. One top-face mesh, no two faces in one plane.
  const LAWN = ["#5f8434", "#6a8f3a", "#76993f", "#82a347", "#6d8a35", "#7b9a3c"].map((h) => { const n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; });
  const hash = (i, j) => { let h = Math.imul(i, 374761393) ^ Math.imul(j, 668265263); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  const noise = (x, z) => {
    const i = Math.floor(x), j = Math.floor(z), fx = x - i, fz = z - j, sx = fx * fx * (3 - 2 * fx), sz = fz * fz * (3 - 2 * fz);
    const a = hash(i, j), b = hash(i + 1, j), c = hash(i, j + 1), d = hash(i + 1, j + 1);
    return a + (b - a) * sx + (c - a) * sz + (a - b - c + d) * sx * sz;
  };
  const mottled = (A, top) => {
    const verts = [], faces = [], T = 2, y = top + 0.006;
    for (let x = A.x0; x < A.x1 - 1e-6; x += T) for (let z = A.z0; z < A.z1 - 1e-6; z += T) {
      const x1 = Math.min(A.x1, x + T), z1 = Math.min(A.z1, z + T);
      const v = noise(x / 9, z / 9) * 0.7 + hash(Math.round(x * 3), Math.round(z * 7)) * 0.3, c = LAWN[Math.min(LAWN.length - 1, Math.floor(v * LAWN.length))];
      const i = verts.length / 3;
      verts.push(x, y, z, x, y, z1, x1, y, z1, x1, y, z);
      faces.push({ i: [i, i + 1, i + 2, i + 3], color: c, emissive: 0 });
    }
    return { verts, faces, lines: [], castShadow: false };
  };
  // Grass tufts (the island's own, hub-models.js grassTuft) over the lawn as one instanced batch: in drifts where the
  // mottle is lush, never on a path, a walkway, a bench, a sign, a plant or the centrepiece. WebGL only (the island's
  // lawn is too). Seeded, so every visit lays the same.
  const TUFT_CAP = 2600;
  const tufts = ({ A, Lo, clear, centre }) => {
    const data = new Float32Array(TUFT_CAP * 20), seed = { a: 2009 };
    const rand = () => { let t = (seed.a = (seed.a + 0x6d2b79f5) | 0); t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    let n = 0;
    for (let tries = 0; n < TUFT_CAP && tries < TUFT_CAP * 4; tries++) {
      const x = A.x0 + 0.5 + rand() * (A.x1 - A.x0 - 1), z = A.z0 + 0.5 + rand() * (A.z1 - A.z0 - 1);
      if (noise(x / 9, z / 9) < 0.35 + rand() * 0.25) continue;
      if (Math.hypot(x, z) < centre || Lo.paths.some((q) => segDist(x, z, q) < q.w / 2 + 0.35)) continue;
      if (Lo.obstacles.some((o) => x > o.x0 - 0.4 && x < o.x1 + 0.4 && z > o.z0 - 0.4 && z < o.z1 + 0.4) || Lo.plants.some((p) => Math.hypot(x - p.x, z - p.z) < 0.7)) continue;
      if (!clear(x, z)) continue;
      const yaw = rand() * Math.PI * 2, s = 0.8 + rand() * 0.6, c = Math.cos(yaw) * s, sn = Math.sin(yaw) * s, o = n++ * 20;
      data[o] = c; data[o + 2] = -sn; data[o + 5] = s; data[o + 8] = sn; data[o + 10] = c;
      data[o + 12] = x; data[o + 13] = top0 + 0.006; data[o + 14] = z; data[o + 15] = 1;
    }
    return { data, count: n };
  };
  let top0 = 0;
  const SAND = "#b8955a", SAND_DK = "#9a7a46", WOOD = "#7a5534", WOOD_DK = "#4c331d";
  const build = ({ M, createNode, addChild, place, top, layout: Lo, hub, dressing, paintMap, atrium, lawn = null }) => {
    // The ground: one grass sheet over the atrium, then the sand paths over it (one merged mesh, no shadows).
    const ground = [mottled(atrium, top)];
    for (const s of Lo.paths) {
      const len = Math.hypot(s.x1 - s.x0, s.z1 - s.z0) + (s.kind === "radial" ? 0 : s.w), yaw = Math.atan2(s.x1 - s.x0, s.z1 - s.z0);
      // The loop sits a few millimetres over the other paths, so where they cross no two faces share a plane.
      ground.push(M.moved(M.turnedY(M.box({ w: s.w, h: 0.012, d: len, color: s.kind === "loop" ? SAND_DK : SAND }), yaw), (s.x0 + s.x1) / 2, top + (s.kind === "loop" ? 0.021 : 0.016), (s.z0 + s.z1) / 2));
    }
    // (The loop's moving walkway, genesis-walkways.js, shows its clockwise way with its own chevrons.)
    const groundGeo = M.merge(...ground);
    groundGeo.castShadow = false;
    place(createNode({ geometry: groundGeo, sightHidden: true }));
    if (lawn && hub.lawnTuft) {
      top0 = top;
      const t = tufts({ A: atrium, Lo, clear: lawn.clear, centre: lawn.centre });
      place(createNode({ geometry: hub.lawnTuft(), screenCull: true, sightHidden: true, instanceData: t.data, instanceCount: t.count, instanceVersion: 1, fixedInstanceCapacity: true }));
      Lo.tufts = t.count;
    }
    // The signs: a post, an arrow on top pointing at the gallery, and the carved boards back to back (one merged mesh).
    const timber = [];
    const board = (text, scale, y, flip) => {
      const g = hub.caveSign(text), copy = { verts: g.verts.slice(), faces: g.faces, lines: g.lines || [] };
      for (let i = 0; i < copy.verts.length; i += 3) { copy.verts[i] *= scale; copy.verts[i + 1] = copy.verts[i + 1] * scale + y; copy.verts[i + 2] = copy.verts[i + 2] * scale + 0.06; }
      return flip ? M.turnedY(copy, Math.PI) : copy;
    };
    for (const s of Lo.signs) {
      const parts = [M.bevelBox({ w: 0.18, h: 2.9, d: 0.18, color: WOOD_DK, offset: { y: 1.45 } })];
      s.lines.forEach((text, i) => {
        const g = hub.caveSign(text), scale = Math.min(i < 2 ? 0.34 : 0.28, 2.4 / g.signWidth), y = 2.45 - i * 0.48;
        // The boards stand along the gallery's path (their faces to the loop either way), so the arrow points along them.
        parts.push(M.turnedY(board(text, scale, y, false), Math.PI / 2), M.turnedY(board(text, scale, y, true), Math.PI / 2));
      });
      // The arrow: a timber shaft and a head on top, pointing toward the gallery (+z in the sign's own frame).
      parts.push(M.bevelBox({ w: 0.16, h: 0.16, d: 1.6, color: WOOD, offset: { y: 2.95, z: 0.3 } }));
      for (const k of [-1, 1]) parts.push(M.moved(M.turnedY(M.bevelBox({ w: 0.16, h: 0.16, d: 0.7, color: WOOD }), k * 0.75), k * 0.2, 2.95, 1.0));
      timber.push(M.moved(M.turnedY(M.merge(...parts), s.ry), s.x, top, s.z));
    }
    if (timber.length) place(createNode({ geometry: M.merge(...timber) }));
    // The "You are here" board: a painted map in a timber frame on two legs, facing the arrival.
    const map = Lo.map, W = 1400, H = Math.round(W * map.h / map.w), canvas = document.createElement("canvas");
    canvas.width = W; canvas.height = H;
    paintMap(canvas.getContext("2d"), W, H);
    const image = new Image();
    image.src = canvas.toDataURL("image/png");
    const face = { verts: [-map.w / 2, -map.h / 2, 0.03, map.w / 2, -map.h / 2, 0.03, map.w / 2, map.h / 2, 0.03, -map.w / 2, map.h / 2, 0.03], faces: [{ i: [0, 1, 2, 3], color: [0, 0, 0], emissive: 0 }], lines: [], castShadow: false };
    face.imageSurface = { asset: { width: W, height: H, load: () => image }, rect: [-map.w / 2, -map.h / 2, map.w, map.h] };
    const node = place(createNode({ position: { x: map.x, y: top + map.y, z: map.z } }));
    addChild(node, createNode({ geometry: M.bevelBox({ w: map.w + 0.36, h: map.h + 0.36, d: 0.16, color: WOOD, bevel: 0.05, offset: { z: -0.08 } }) }), createNode({ geometry: face }));
    const legs = [];
    for (const dx of [-map.w / 2 + 0.6, map.w / 2 - 0.6]) legs.push(M.bevelBox({ w: 0.22, h: map.y - map.h / 2 + 0.2, d: 0.22, color: WOOD_DK, offset: { x: map.x + dx, y: top + (map.y - map.h / 2 + 0.2) / 2, z: map.z - 0.15 } }));
    place(createNode({ geometry: M.merge(...legs) }));
    // Benches from the dressing kit, baked once into the set's meshes.
    const set = dressing.set();
    for (const b of Lo.benches) set.put("bench", b.x, top, b.z, b.turns);
    for (const n of dressing.nodes(set.build())) place(n);
    // Plants from the island's builders: each kind's variants are shared geometries, so each is one draw.
    for (const p of Lo.plants) {
      const geometry = p.kind === "palm" ? dressing.palm(p.v) : p.kind === "bush" ? hub.bush(p.v) : hub.flowerTuft();
      place(createNode({ geometry, position: { x: p.x, y: top, z: p.z }, rotation: { x: 0, y: p.ry, z: 0 }, sightHidden: true }));
    }
    return { mapNode: node };
  };
  // The "You are here" map, painted from the layout: north up, as the board faces the arrival looking north.
  const paintMap = (g, W, H, { museum, eras, layout: Lo, atriumLayout }) => {
    const B = museum.bounds, pad = 40, top = 120, k = Math.min((W - 2 * pad) / (B.x1 - B.x0), (H - top - pad - 60) / (B.z1 - B.z0));
    const X = (x) => pad + (x - B.x0) * k + ((W - 2 * pad) - (B.x1 - B.x0) * k) / 2, Y = (z) => top + (z - B.z0) * k;
    g.fillStyle = "#efe4c8"; g.fillRect(0, 0, W, H);
    g.fillStyle = "#3a2a1a"; g.font = "bold 54px Georgia, serif"; g.textAlign = "left"; g.textBaseline = "alphabetic";
    g.fillText("The Genesis museum", pad, 70);
    g.font = "26px system-ui, sans-serif"; g.fillStyle = "#5a4630";
    g.fillText("Galleries run clockwise in date order. Sand paths show the way round, not influence.", pad, 104);
    const rect = (r, fill, stroke) => { g.fillStyle = fill; g.fillRect(X(r.x0), Y(r.z0), (r.x1 - r.x0) * k, (r.z1 - r.z0) * k); if (stroke) { g.strokeStyle = stroke; g.lineWidth = 3; g.strokeRect(X(r.x0), Y(r.z0), (r.x1 - r.x0) * k, (r.z1 - r.z0) * k); } };
    rect(museum.atrium, "#9db76a", "#5a4630");
    for (const e of eras) {
      const r = museum.rects[e.n];
      rect(r, e.theme.bank, "#2a2018");
      g.fillStyle = "#fff8e8"; g.textAlign = "center"; g.font = "bold 30px system-ui, sans-serif";
      const cx = X((r.x0 + r.x1) / 2), cy = Y((r.z0 + r.z1) / 2);
      g.fillText(`ERA ${e.n}`, cx, cy - 6);
      // The years fit the gallery's width on the map (a long date in a narrow gallery gets a smaller type).
      const room = (r.x1 - r.x0) * k - 8;
      let px = 20;
      g.font = `${px}px system-ui, sans-serif`;
      while (px > 11 && g.measureText(e.years).width > room) { px -= 1; g.font = `${px}px system-ui, sans-serif`; }
      g.fillText(e.years, cx, cy + 20);
    }
    g.lineCap = "round";
    for (const s of Lo.paths) { g.strokeStyle = s.kind === "loop" ? "#8a6a3a" : "#c9a46a"; g.lineWidth = s.w * k; g.beginPath(); g.moveTo(X(s.x0), Y(s.z0)); g.lineTo(X(s.x1), Y(s.z1)); g.stroke(); }
    // The centrepiece: its steps as dots (gold: citation; ring: influence), the paper in the middle.
    if (atriumLayout) for (const s of atriumLayout.steps) {
      g.beginPath(); g.arc(X(s.x), Y(s.z), 7, 0, 7);
      if (s.kind === "citation") { g.fillStyle = "#d9a11a"; g.fill(); } else { g.lineWidth = 4; g.strokeStyle = "#d9a11a"; g.stroke(); }
    }
    g.fillStyle = "#ffffff"; g.fillRect(X(-1), Y(-1), 2 * k, 2 * k);
    // The white timeline screen and this board, with "You are here".
    g.fillStyle = "#ffffff"; g.fillRect(X(-9), Y(VIEW.screenZ - 0.4), 18 * k, Math.max(4, 0.6 * k));
    g.fillStyle = "#c0392b"; g.beginPath(); g.arc(X(Lo.map.x), Y(Lo.map.z + 2), 12, 0, 7); g.fill();
    g.fillStyle = "#3a2a1a"; g.font = "bold 26px system-ui, sans-serif"; g.textAlign = "left";
    g.fillText("You are here", X(Lo.map.x) + 18, Y(Lo.map.z + 2) + 9);
    g.font = "22px system-ui, sans-serif"; g.textAlign = "left"; g.fillStyle = "#5a4630";
    g.fillText("N ↑ · gold dots: whitepaper citations · gold rings: documented influence · white: the paper", pad, H - 24);
  };
  BL.genesisCourtyard = { layout, build, tufts, noise, TUFT_CAP, paintMap, signText, shortTitle, inView, segDist, LOOP, MAP, VIEW };
})();
