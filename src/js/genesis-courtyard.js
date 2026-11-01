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
  const RING_R = 25, RING_W = 3, RADIAL_W = 3.4, LOOP_W = 3;
  const LOOP = { x0: -41, x1: 41, z0: -71, z1: 74.5 };
  const MAP = { x: 15.6, z: 55, w: 4.6, h: 3.2, y: 2.6 };
  // The view from the arrival (scene-genesis.js ENTRY, 0, 64) to the white screen (24 m wide at z 48), with a margin.
  const VIEW = { x: 0, z: 64, half: 13, screenZ: 48 };
  const inView = (x, z, pad = 0) => z <= VIEW.z + pad && z >= VIEW.screenZ - pad && Math.abs(x) <= VIEW.half * (VIEW.z - z) / (VIEW.z - VIEW.screenZ) + pad;
  const CLEAR = VIEW;
  // The south galleries' paths go round the white screen and this board, by a waypoint out to each side.
  const SOUTH_BEND = { x: 24, z: 36 };
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
    for (const [x, z, turns] of [[0, L.z0 + 3.2, 0], [L.x1 - 3.2, -40, 3], [L.x1 - 3.2, 30, 3], [L.x0 + 3.2, -40, 1], [L.x0 + 3.2, 30, 1], [-28, L.z1 - 3.2, 2], [28, L.z1 - 3.2, 2]]) {
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
      if (inView(x, z, 3) || (Math.abs(x) < 9 && z > 60)) continue;
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

  const GRASS = "#6f8f3c", SAND = "#b8955a", SAND_DK = "#9a7a46", WOOD = "#7a5534", WOOD_DK = "#4c331d";
  const build = ({ M, createNode, addChild, place, top, layout: Lo, hub, dressing, paintMap, atrium }) => {
    // The ground: one grass sheet over the atrium, then the sand paths over it (one merged mesh, no shadows).
    const ground = [M.box({ w: atrium.x1 - atrium.x0, h: 0.01, d: atrium.z1 - atrium.z0, color: GRASS, offset: { x: 0, y: top + 0.005, z: 0 } })];
    for (const s of Lo.paths) {
      const len = Math.hypot(s.x1 - s.x0, s.z1 - s.z0) + (s.kind === "radial" ? 0 : s.w), yaw = Math.atan2(s.x1 - s.x0, s.z1 - s.z0);
      // The loop sits a few millimetres over the other paths, so where they cross no two faces share a plane.
      ground.push(M.moved(M.turnedY(M.box({ w: s.w, h: 0.012, d: len, color: s.kind === "loop" ? SAND_DK : SAND }), yaw), (s.x0 + s.x1) / 2, top + (s.kind === "loop" ? 0.021 : 0.016), (s.z0 + s.z1) / 2));
    }
    // Small earth-coloured chevrons on the loop, pointing clockwise (the date order), every 20 m.
    for (const s of Lo.paths) if (s.kind === "loop") {
      const len = Math.hypot(s.x1 - s.x0, s.z1 - s.z0), ux = (s.x1 - s.x0) / len, uz = (s.z1 - s.z0) / len, a = Math.atan2(ux, uz);
      for (let d = 10; d < len - 5; d += 20) for (const k of [-1, 1]) {
        const cx = s.x0 + ux * d, cz = s.z0 + uz * d;
        ground.push(M.moved(M.turnedY(M.box({ w: 0.18, h: 0.01, d: 1.1, color: "#6e5432" }), a + k * 0.6), cx - ux * 0.3 + uz * k * 0.32, top + 0.032, cz - uz * 0.3 - ux * k * 0.32));
      }
    }
    const groundGeo = M.merge(...ground);
    groundGeo.castShadow = false;
    place(createNode({ geometry: groundGeo, sightHidden: true }));
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
    g.fillStyle = "#ffffff"; g.fillRect(X(-12), Y(47.6), 24 * k, Math.max(4, 0.6 * k));
    g.fillStyle = "#c0392b"; g.beginPath(); g.arc(X(Lo.map.x), Y(Lo.map.z + 2), 12, 0, 7); g.fill();
    g.fillStyle = "#3a2a1a"; g.font = "bold 26px system-ui, sans-serif"; g.textAlign = "left";
    g.fillText("You are here", X(Lo.map.x) + 18, Y(Lo.map.z + 2) + 9);
    g.font = "22px system-ui, sans-serif"; g.textAlign = "left"; g.fillStyle = "#5a4630";
    g.fillText("N ↑ · gold dots: whitepaper citations · gold rings: documented influence · white: the paper", pad, H - 24);
  };
  BL.genesisCourtyard = { layout, build, paintMap, signText, shortTitle, inView, segDist, LOOP, MAP, VIEW };
})();
