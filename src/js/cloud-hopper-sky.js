// Cloud Hopper's level scenery (docs/cloud-hopper-levels-plan.md 4 and 7a), built for a run under the level's
// fixed sky (`sky` in cloud-hopper-levels.js, which the hub samples on `DAY`). It is all decoration: hidden from
// the outline registry, never collided with, and kept off every cloud's swept footprint, so nothing in it reads as a
// landing. Each level's scenery comes from a fixed seed, so it stands the same on every run; only its animation
// moves, on the scenery's own clock.
// - `islets` (Floating Isles): voxel isles with grass, flowers, palms, trees and a hut on top and sandstone strata,
//   drips and hanging vines under them; two shapes pour a waterfall off the rim into mist, smaller isles hang off
//   some on rope bridges, two Ooga balloons drift by, gulls wheel and a double rainbow stands opposite the sun.
// - `spires` (Amber Spires): towering cumulus coloured for the low sun (gold where faces turn to it, lavender where
//   they turn away, cream on the tops, glowing a little), all at one scale, young ones nearer off to the sides of the
//   course and some of the far ones growing from the Play press, long cloud banks along the horizon, sky lanterns
//   rising past the course and geese flying a V.
// - `aurora` (Aurora Heights): the aurora as a real one stands, in pixel art: long curtains far off in the sky toward
//   the island, kept where they stand however far a rider falls, a bright green lower edge with rays rising from it
//   into faint violet and red, shimmering, slowly folding and now and then breaking up; shooting stars; dark
//   isles growing glowing crystals; and great crystals turning in the air.
// - `storm` (Thunderhead): rain round the eye, lightning striking the sea with the sky's flash and the strike's
//   distance for its thunder, and storm-dark isles far out to either side whose lighthouses sweep their beams round,
//   only their light glowing faintly through the haze from far off. `grade` greys the hub's sampled sky for it and `flash` lifts it for a frame of lightning.
// - `eye` (Flipside): the storm's eyewall at sunrise, a ring of Amber Spires' towers and banks in storm-slate inks,
//   gold where they face the sun, turning slowly round the course, with lightning deep in the wall.
// The moving parts are instanced batches written in place (one draw each) and a few node transforms; nothing
// allocates a frame. The Canvas 2D renderer gets the still scenery and a thinner aurora, without the flocks,
// lanterns or shooting stars.
(() => {
  "use strict";
  const BL = window.BL = window.BL || {};
  const { createNode, addChild, removeChild } = BL.scene;
  const M = BL.models, { hexToRgb, mulberry32 } = BL.math;
  const TAU = Math.PI * 2;
  // The day every level sky is sampled on, the equinox, so a level looks the same on any day of the year.
  const DAY = 80;
  const SEED = 77, SHORE = 42;
  // Scenery keeps this far (m) off every cloud's swept footprint; a piece that cannot steps out across the route.
  const GAP = 6, STEP = 10, TRIES = 8;
  const mix = (a, b, k) => [Math.round(a[0] + (b[0] - a[0]) * k), Math.round(a[1] + (b[1] - a[1]) * k), Math.round(a[2] + (b[2] - a[2]) * k)];
  const smooth = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  // A fixed hash of a cell to [0, 1), so a shape's texture never depends on the order it was filled in.
  const hash = (a, b, c) => {
    let h = Math.imul(a, 73856093) ^ Math.imul(b, 19349663) ^ Math.imul(c, 83492791);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  };
  // A thin square rod from a to b, `w` across: four quads.
  const rod = (geo, ax, ay, az, bx, by, bz, w, color) => {
    const dx = bx - ax, dy = by - ay, dz = bz - az, len = Math.hypot(dx, dy, dz);
    let ux = -dz, uy = 0, uz = dx;
    if (Math.hypot(ux, uz) < 0.1 * len) { ux = 0; uy = dz; uz = -dy; }
    const ul = Math.hypot(ux, uy, uz), vx = dy * uz - dz * uy, vy = dz * ux - dx * uz, vz = dx * uy - dy * ux, vl = Math.hypot(vx, vy, vz);
    const h = w / 2, corners = [[1, 1], [-1, 1], [-1, -1], [1, -1]], ids = [];
    for (const [px, py, pz] of [[ax, ay, az], [bx, by, bz]]) for (const [p, q] of corners) {
      ids.push(M.pushVert(geo, px + (ux / ul * p + vx / vl * q) * h, py + (uy / ul * p + vy / vl * q) * h, pz + (uz / ul * p + vz / vl * q) * h));
    }
    for (let k = 0; k < 4; k++) M.face(geo, [ids[k], ids[(k + 1) % 4], ids[4 + (k + 1) % 4], ids[4 + k]], color);
  };

  // The sun's direction at `hour` on the level skies' day, as the hub's sky shows it.
  const SKY = { sunDirection: { x: 0, y: 1, z: 0 }, moon: { x: 0, y: 1, z: 0 }, light: { x: 0, y: 1, z: 0 }, starMatrix: new Float32Array(9),
    clear: new Float32Array(3), horizon: new Float32Array(3), zenith: new Float32Array(3), sky: new Float32Array(3), ground: new Float32Array(3), sun: new Float32Array(3), direct: new Float32Array(3) };
  const sunAt = (hour) => { BL.daylight.sample(hour, SKY, DAY); return SKY.sunDirection; };

  // ---- Floating isles, by day and (Aurora Heights) by night -------------------------------------------------------
  // On the island's grid mesher, half a metre a cell: a domed grass top with flowers and a boulder or two, a band of
  // soil, then sandstone strata tapering to a ragged keel with drips under it, and vines and roots hanging off the
  // rim. Variants 0 and 2 by day carry a stream from a pool to the rim and a waterfall off it. By night (4-7) the rock
  // is slate, the grass dark moss, the flowers glowing crystals a few cells tall; in a storm (8-11) the rock is wet
  // grey and the grass dark under heather and pebbles. A variant returns its mesh with where
  // things stand on it: `spots` for trees, its `rim` radius every 1/32 turn, how far it reaches (`radius`), its `fall`
  // and the mist under it.
  const CELL = 0.5;
  const INKS = {
    day: ["#62bb3e", "#7ad04c", "#4e9e32", "#7a5232", "#5e3d24", "#c9a06a", "#ad8156", "#958270", "#a8a296", "#3f7a2c", "#5d9436", "#6b4a2e", "#ffd84a", "#ff8cc0", "#ffffff", "#c58bff", "#3f9ee6"],
    night: ["#2f5a4a", "#3a6b55", "#26483c", "#3a3040", "#2c2533", "#4a4658", "#3c3a4a", "#565068", "#454055", "#2e8a6c", "#3cc49a", "#3a2e3a", "#5ff5ff", "#c77dff", "#7dffb0", "#ff7ad9", "#3f9ee6"],
    storm: ["#465f3c", "#526d44", "#3a5233", "#4a3b30", "#3a2e26", "#5d5c63", "#4f4e56", "#686670", "#57555e", "#2f4a2c", "#3d5a36", "#3a2e26", "#8a6f9a", "#a08bb0", "#c9c4b8", "#7d6a8e", "#3f6e96"]
  };
  // Palette slots: 1-3 grass, 4-5 soil, 6-9 strata, 10-12 vines and roots, 13-16 flowers (crystals at night), 17 water.
  const GRASS = 1, SOIL = 4, STRATA = 6, HANG = 10, BLOOM = 13, WATER = 17;
  // A fall is the Mempool rainforest's: thick strands in its lake's moving water, each its own length (FALL_LENGTHS).
  const FALL = hexToRgb(BL.poolModels.WATER[1]), FALL_HEIGHT = 20, FALL_LENGTHS = [0.71, 0.91, 0.82, 1, 0.88, 0.63, 0.77], RIM_STEPS = 32;
  const isle = M.variants((i) => {
    const v = i % 4, night = i >= 4 && i < 8, palette = INKS[i >= 8 ? "storm" : night ? "night" : "day"].map(hexToRgb), rand = mulberry32(911 + v * 37);
    const R = 9 + v * 1.6 + rand() * 1.5, depth = R * (1.35 + rand() * 0.35), p1 = rand() * TAU, p2 = rand() * TAU, p3 = rand() * TAU;
    const S = Math.ceil(R * 1.3) * 2 + 6, top = Math.ceil(depth * 1.25) + 10, H = top + 8, c = S / 2;
    const grid = BL.terrain.makeGrid(S, H, S), surface = new Int16Array(S * S).fill(-1), bottom = new Int16Array(S * S), stream = new Uint8Array(S * S);
    const rimAt = (a) => R * (1 + 0.16 * Math.sin(3 * a + p1) + 0.09 * Math.sin(5 * a + p2) + 0.05 * Math.sin(9 * a + p3));
    const qAt = (x, z) => { const dx = x + 0.5 - c, dz = z + 0.5 - c; return Math.hypot(dx, dz) / rimAt(Math.atan2(dz, dx)); };
    const falls = i < 4 && (v === 0 || v === 2), fa = rand() * TAU, fx = Math.cos(fa), fz = Math.sin(fa);
    for (let x = 0; x < S; x++) for (let z = 0; z < S; z++) {
      const q = qAt(x, z);
      if (q > 1) continue;
      const dx = x + 0.5 - c, dz = z + 0.5 - c;
      const s = top - Math.floor(q * q * 2.4) + Math.round(0.7 * Math.sin(dx * 0.45 + p1) * Math.cos(dz * 0.4 + p2));
      const keel = depth * Math.pow(1 - Math.pow(q, 1.5), 0.8) * (0.85 + 0.3 * hash(x, 3, z)) + (q < 0.75 && hash(x, 5, z) < 0.08 ? 2 + hash(x, 9, z) * 6 : 0);
      const b = Math.max(0, s - Math.max(2, Math.round(keel))), patch = Math.sin(x * 0.9 + p1) + Math.cos(z * 0.8 + p2);
      surface[x * S + z] = s; bottom[x * S + z] = b;
      for (let y = b; y <= s; y++) {
        const k = s - y;
        let ink;
        // Grass on the top and down the rim's side; soil under it; strata in wavy bands below.
        if (k === 0 || (k === 1 && q > 0.88)) ink = GRASS + (patch > 0.9 ? 1 : patch < -0.9 ? 2 : 0);
        else if (k <= 2) ink = SOIL + (k === 2 ? 1 : 0);
        else ink = STRATA + ((Math.floor((y + 1.6 * Math.sin(x * 0.35 + z * 0.25 + p3)) / 2.5) % 4) + 4) % 4;
        grid.set(x, y, z, ink);
      }
    }
    // The stream: a cell deep, from a pool a third of the way out over the rim.
    if (falls) for (let x = 0; x < S; x++) for (let z = 0; z < S; z++) {
      const col = x * S + z, s = surface[col];
      if (s < 0) continue;
      const dx = x + 0.5 - c, dz = z + 0.5 - c, along = dx * fx + dz * fz, across = Math.abs(dz * fx - dx * fz);
      if (Math.hypot(dx - fx * R * 0.3, dz - fz * R * 0.3) >= 2.3 && !(along > R * 0.3 && across < 1.1)) continue;
      grid.set(x, s, z, 0); grid.set(x, s - 1, z, WATER);
      surface[col] = s - 1; stream[col] = 1;
    }
    // Flowers dotted through the grass, or at night crystals up to a few metres tall, then a boulder or two.
    for (let x = 0; x < S; x++) for (let z = 0; z < S; z++) {
      const col = x * S + z, s = surface[col];
      if (s < 0 || stream[col] || qAt(x, z) > 0.85 || hash(x, 11, z) >= 0.09) continue;
      const ink = BLOOM + Math.floor(hash(x, 13, z) * 4);
      // By night a few grow into crystal columns; the rest glow in the moss.
      if (!night || hash(x, 19, z) >= 0.3) { grid.set(x, s, z, ink); continue; }
      for (let y = 1, tall = 1 + Math.floor(hash(x, 17, z) * 4); y <= tall; y++) grid.set(x, s + y, z, ink);
    }
    for (let n = 0; n < 2; n++) {
      const a = rand() * TAU, d = R * (0.25 + rand() * 0.35), bx = c + Math.cos(a) * d, bz = c + Math.sin(a) * d, br = 1.4 + rand() * 1.2;
      for (let x = Math.floor(bx - br); x <= bx + br; x++) for (let z = Math.floor(bz - br); z <= bz + br; z++) {
        const col = x * S + z, e = 1 - ((x + 0.5 - bx) ** 2 + (z + 0.5 - bz) ** 2) / (br * br);
        if (e <= 0 || surface[col] < 0 || stream[col]) continue;
        for (let y = 1; y <= Math.max(1, Math.round(br * 0.9 * Math.sqrt(e))); y++) grid.set(x, surface[col] + y, z, STRATA + 2 + (hash(x, y, z) < 0.5 ? 1 : 0));
      }
    }
    // Spots for trees, clear of the stream, a boulder and each other; a flower there gives way.
    const spots = [];
    for (let n = 0; n < 30 && spots.length < 6; n++) {
      const a = rand() * TAU, d = rimAt(a) * (0.12 + rand() * 0.5), x = Math.floor(c + Math.cos(a) * d), z = Math.floor(c + Math.sin(a) * d), col = x * S + z;
      const px = (x + 0.5 - c) * CELL, pz = (z + 0.5 - c) * CELL;
      if (surface[col] < 0 || stream[col] || grid.get(x, surface[col] + 2, z) || spots.some((p) => Math.hypot(p.x - px, p.z - pz) < 2.4)) continue;
      grid.set(x, surface[col] + 1, z, 0);
      spots.push({ x: px, y: (surface[col] + 1 - top) * CELL, z: pz });
    }
    // Vines and roots hanging from under the rim, clear of the fall.
    for (let n = 0, count = 10 + v * 3; n < count; n++) {
      const a = rand() * TAU, len = 3 + Math.floor(rand() * 8), ink = HANG + Math.floor(rand() * 3), r = rimAt(a) * (0.86 + rand() * 0.08);
      const x = Math.floor(c + Math.cos(a) * r), z = Math.floor(c + Math.sin(a) * r), col = x * S + z;
      if (surface[col] < 0 || (falls && Math.abs(Math.atan2(Math.sin(a - fa), Math.cos(a - fa))) < 0.4)) continue;
      for (let y = bottom[col] - 1; y >= Math.max(0, bottom[col] - len); y--) grid.set(x, y, z, ink);
    }
    // Where crystals may hang from the keel: the three deepest columns well inside the rim, a little apart.
    const hangs = [];
    for (let n = 0; n < 3; n++) {
      let deepest = -1;
      for (let x = 0; x < S; x++) for (let z = 0; z < S; z++) {
        const col = x * S + z, px = (x + 0.5 - c) * CELL, pz = (z + 0.5 - c) * CELL;
        if (surface[col] < 0 || qAt(x, z) > 0.6 || deepest >= 0 && bottom[col] >= bottom[deepest]
          || hangs.some((h) => Math.hypot(h.x - px, h.z - pz) < 1.6)) continue;
        deepest = col;
      }
      if (deepest < 0) break;
      const x = Math.floor(deepest / S), z = deepest % S;
      hangs.push({ x: (x + 0.5 - c) * CELL, y: (bottom[deepest] - top) * CELL, z: (z + 0.5 - c) * CELL });
    }
    const origin = { x: -c * CELL, y: -top * CELL, z: -c * CELL };
    const mesh = BL.terrain.gridGeometry(grid, { unit: CELL, palette: [null, ...palette], origin });
    // By night the crystals glow, the vines glow teal and the moss faintly.
    const glow = new Map(night ? [...palette.slice(BLOOM - 1, BLOOM + 3).map((ink) => [ink, 0.9]), [palette[HANG - 1], 0.55], [palette[HANG], 0.55], ...palette.slice(GRASS - 1, GRASS + 2).map((ink) => [ink, 0.12])] : []);
    const water = palette[WATER - 1];
    for (const f of mesh.faces) {
      if (glow.has(f.color)) f.emissive = glow.get(f.color);
      if (f.color === water) f.water = true;
    }
    // The fall, after the Mempool rainforest's: seven thick strands from under the lip, curving a little out as they
    // drop and widening, each ending at its own height, in the lake's moving translucent water, mist under it. It is
    // its own mesh, which each isle lays with its own flow (`standIsle`).
    const mist = [];
    let fall = null;
    const geometry = mesh;
    if (falls) {
      const g = M.geometry(), rim = rimAt(fa) * CELL, ux = fz, uz = -fx, STRANDS = FALL_LENGTHS.length, W = 1.6;
      let lip = -1;
      for (let d = rimAt(fa) - 0.7; lip < 0; d -= 0.5) lip = surface[Math.floor(c + fx * d) * S + Math.floor(c + fz * d)];
      const ly = (lip + 1 - top) * CELL - 0.03, at = (u, down, front) => {
        const t = down / FALL_HEIGHT, out = rim - 0.3 + 1.2 * Math.sqrt(t) + front, w = u * W * (1 + 0.6 * t);
        return M.pushVert(g, out * fx + w * ux, ly - down, out * fz + w * uz);
      };
      const quad = (ids) => M.face(g, ids, FALL, { emissive: 0.9 });
      let low = 0;
      for (let j = 0; j < STRANDS; j++) {
        const drop = FALL_HEIGHT * FALL_LENGTHS[(j + v * 2) % STRANDS], depth = 0.18 + ((j * 3 + v) % 5) * 0.04, rows = Math.ceil(drop / 0.5);
        let previous = null;
        for (let i = 0; i <= rows; i++) {
          const down = drop * i / rows, inset = down > drop - 0.8 ? 0.035 : down > drop * 0.65 ? 0.018 : 0;
          const left = j / STRANDS - 0.5 + inset, right = (j + 1) / STRANDS - 0.5 - inset, front = depth * Math.min(1, down / 0.5);
          const row = [at(left, down, front), at(right, down, front), at(left, down, 0), at(right, down, 0)];
          if (previous) {
            quad([previous[0], row[0], row[1], previous[1]]);
            quad([previous[3], row[3], row[2], previous[2]]);
            quad([previous[2], row[2], row[0], previous[0]]);
            quad([previous[1], row[1], row[3], previous[3]]);
          }
          previous = row;
        }
        quad([previous[0], previous[2], previous[3], previous[1]]);
        low = Math.max(low, drop);
      }
      for (const f of g.faces) f.lake = true;
      g.glass = 0.64; g.castShadow = false;
      fall = { geometry: g, ux, uz, ox: (rim - 0.3) * fx, oy: ly, oz: (rim - 0.3) * fz };
      const t = low * 0.85 / FALL_HEIGHT, out = rim - 0.3 + 1.2 * Math.sqrt(t), y = ly - low * 0.85, px = -fz, pz = fx;
      mist.push({ x: out * fx, y, z: out * fz, size: 1.9 }, { x: (out + 1.2) * fx + px * 1.3, y: y - 1.2, z: (out + 1.2) * fz + pz * 1.3, size: 1.3 });
    }
    geometry.castShadow = false;
    const rim = new Float32Array(RIM_STEPS);
    for (let k = 0; k < RIM_STEPS; k++) rim[k] = rimAt(k / RIM_STEPS * TAU) * CELL;
    return { geometry, fall, spots, rim, mist, hangs, radius: R * 1.3 * CELL, lip: -2 * CELL };
  });
  // An Ooga hut for the biggest isle: a round wattle wall with a doorway under a thatched cone.
  const hut = M.cached(() => {
    const wall = M.lathe({ profile: [[1.05, 0], [1.12, 0.3], [1.05, 1.15]], segments: 10, color: (t) => t < 0.5 ? "#8a5a32" : "#a8703e" });
    const roof = M.lathe({ profile: [[1.65, 0.95], [1.15, 1.5], [0.6, 2.0], [0.2, 2.4], [0, 2.5]], segments: 10, color: (t) => t < 0.3 ? "#c49a48" : t < 0.7 ? "#d9b562" : "#b38a3e" });
    const door = M.box({ w: 0.6, h: 0.9, d: 0.14, color: "#2a1a10", offset: { x: 0, y: 0.45, z: 1.06 } });
    const g = M.merge(wall, roof, door);
    g.castShadow = false;
    return g;
  });
  // A rope bridge one unit long down +x, sagging in the middle: planks on two foot ropes, posts and handrails.
  const bridge = M.cached(() => {
    const g = M.geometry(), N = 16, sag = (u) => -0.09 * 4 * u * (1 - u), rope = hexToRgb("#c9a46a");
    const parts = [g];
    for (let i = 0; i < N; i++) {
      const u = (i + 0.5) / N;
      parts.push(M.box({ w: 0.042, h: 0.008, d: 0.13, color: i % 3 ? "#a8703e" : "#8a5a32", offset: { x: u, y: sag(u), z: 0 } }));
    }
    for (const z of [-0.07, 0.07]) for (let k = 0; k < N; k++) {
      const u0 = k / N, u1 = (k + 1) / N;
      rod(g, u0, sag(u0) - 0.006, z, u1, sag(u1) - 0.006, z, 0.006, rope);
      rod(g, u0, sag(u0) * 0.8 + 0.07, z, u1, sag(u1) * 0.8 + 0.07, z, 0.006, rope);
      if (k % 4 === 0) rod(g, u0, sag(u0), z, u0, sag(u0) * 0.8 + 0.075, z, 0.008, hexToRgb("#6b4a2b"));
    }
    const geo = M.merge(...parts);
    geo.castShadow = false;
    return geo;
  });
  // An Ooga hot-air balloon: a hide envelope patched in bands, ropes down to a woven basket with a fire under the
  // mouth. Its basket floor is the origin.
  const BALLOON_SCALE = 1.5, BALLOON_BANDS = [["#c8955a", "#f4c542", "#a8703e", "#5aa83a"], ["#e0a24a", "#8a5a32", "#f4d27a", "#c8553a"]];
  const balloon = M.variants((v) => {
    const bands = BALLOON_BANDS[v];
    const envelope = M.lathe({ profile: [[0.55, 3.2], [1.3, 3.5], [2.3, 4.6], [2.9, 6.1], [3.0, 7.4], [2.6, 8.7], [1.8, 9.6], [0.7, 10.1], [0, 10.2]], segments: 12, color: (t) => bands[Math.floor(t * 8) % bands.length] });
    const mouth = M.lathe({ profile: [[0.62, 3.05], [0.62, 3.25]], segments: 12, color: "#3a2a1c" });
    const basket = M.box({ w: 1.4, h: 0.9, d: 1.4, color: "#9a6a3a", offset: { y: 0.45 } });
    const rimBox = M.box({ w: 1.5, h: 0.12, d: 1.5, color: "#6b4a2b", offset: { y: 0.92 } });
    const fire = M.box({ w: 0.35, h: 0.35, d: 0.35, color: "#ffb347", emissive: 1, offset: { y: 2.75 } });
    const ropes = M.geometry(), rope = hexToRgb("#5a4030");
    for (const [x, z] of [[1, 1], [-1, 1], [-1, -1], [1, -1]]) rod(ropes, x * 0.68, 0.95, z * 0.68, x * 0.48, 3.15, z * 0.48, 0.05, rope);
    const g = M.merge(envelope, mouth, basket, rimBox, fire, ropes);
    g.castShadow = false;
    return g;
  });
  // Fun blimps far off round Flipside, about ten metres nose to tail at unit scale down -x, each one merged mesh in
  // its own livery with a little gondola, and a shared propeller turned on its own node. No text, no branding.
  // 0 candy stripes, 1 polka dots, 2 a fish, 3 a striped tail.
  const BLIMP_PROFILE = [[0.01, -5], [0.9, -4.7], [1.6, -3.8], [2, -2.4], [2.1, -0.8], [2, 1], [1.7, 2.6], [1.1, 4], [0.5, 4.8], [0.01, 5]];
  const farBlimp = M.variants((v) => {
    const inks = [["#e8433a", "#fbf6ee"], ["#2bb5b8", "#ffd84a", "#ff7aa8"], ["#ff8a2a", "#fff2dc", "#1b1b1e"], ["#8f5bd8", "#ffd84a"]][v].map(hexToRgb);
    const SEG = 14, body = M.lathe({ profile: BLIMP_PROFILE, segments: SEG, color: "#ffffff" });
    body.faces.forEach((f, i) => {
      const ring = Math.floor(i / SEG), seg = i % SEG;
      f.color = v === 0 ? inks[ring % 2] : v === 1 ? ((ring * 3 + seg * 2) % 7 === 0 ? inks[1 + (seg % 2)] : inks[0])
        : v === 2 ? (seg >= 5 && seg <= 9 ? inks[1] : (ring + seg) % 4 === 0 && ring > 2 ? hexToRgb("#e86a1a") : inks[0]) : (ring >= 6 ? inks[ring % 2] : inks[0]);
      f.emissive = 0.06;
    });
    M.turnedZ(body, -Math.PI / 2);
    const parts = [body];
    // Fins: four little tail fins, or for the fish a big forked tail and side fins and two eyes.
    if (v === 2) {
      const tail = M.prism([[0, 0], [2.8, 2.4], [3.4, 2.2], [1.6, 0], [3.4, -2.2], [2.8, -2.4]], 0.3, "#e86a1a"); M.moved(tail, 4.4, 0, 0);
      const fins = [1, -1].map((s) => { const f = M.prism([[0, 0], [1.4, 0.3], [1.8, -0.6], [0.5, -0.9]], 0.2, "#e86a1a"); M.turnedX(f, s * Math.PI / 2); M.moved(f, -0.5, -0.8, s * 1.9); return f; });
      const eyes = [1, -1].map((s) => M.merge(M.box({ w: 0.7, h: 0.7, d: 0.2, color: "#fff2dc", offset: { x: -3.6, y: 0.5, z: s * 1.25 } }), M.box({ w: 0.36, h: 0.36, d: 0.24, color: "#1b1b1e", offset: { x: -3.7, y: 0.5, z: s * 1.3 } })));
      parts.push(tail, ...fins, ...eyes);
    } else for (let k = 0; k < 4; k++) {
      const stripes = v === 3, fin = M.prism([[0, 0], [2.2, 0], [2.8, 1.8], [1.2, 1.8]], 0.18, stripes ? "#ffd84a" : v === 0 ? "#e8433a" : "#ffd84a");
      if (stripes) fin.faces.forEach((f, i) => { if (i % 2) f.color = hexToRgb("#8f5bd8"); });
      M.moved(fin, 2.6, 1.0, 0); M.turnedX(fin, k / 4 * Math.PI * 2 + Math.PI / 4); parts.push(fin);
    }
    // The gondola and its struts.
    parts.push(M.box({ w: 2.2, h: 0.7, d: 0.9, color: v === 1 ? "#ff7aa8" : "#ffd84a", offset: { x: -0.4, y: -2.55 } }),
      M.box({ w: 1.8, h: 0.25, d: 0.95, color: "#7fe0ff", emissive: 0.5, offset: { x: -0.4, y: -2.4 } }),
      M.box({ w: 0.12, h: 0.5, d: 0.12, color: "#555", offset: { x: -1, y: -2.05 } }), M.box({ w: 0.12, h: 0.5, d: 0.12, color: "#555", offset: { x: 0.2, y: -2.05 } }));
    const g = M.merge(...parts);
    g.castShadow = false; g.fogPierce = 0.6;
    return g;
  });
  const farProp = M.cached(() => { const g = M.merge(M.box({ w: 0.1, h: 1.6, d: 0.25, color: "#444" }), M.box({ w: 0.1, h: 0.25, d: 1.6, color: "#444" }), M.box({ w: 0.25, h: 0.3, d: 0.3, color: "#ffd84a" })); g.castShadow = false; return g; });
  // Flipside's sky: space opening as a band along the horizon, between the sky and the water, all the way round
  // (`?ch5rift=0` leaves the old eyewall towers instead). For nearly a third of the course there is none; then it
  // grows on one eased curve, a thin line by the flip; the world turns over with the band on the horizon (it turns
  // with the sky, the water now overhead and the sky below), and it goes on widening both ways, eating into the water
  // and the sky, until at the finish a broad band of space lies behind the island with both still showing beyond it.
  // Drawn the way the Genesis Museum's ceiling is: calm deep navy, crisp small stars spread evenly, a few soft glows;
  // and where it meets the water and the sky, a glowing fusion line like a mixed aurora. All of it is built once at
  // load, in the frame of a unit dome over the eye (local z up), scaled up to the sky:
  //   - the band is one mesh between its two gently wavering edges, with see-through rings out from each edge so it
  //     melds, built at full height and squeezed toward the horizon to the height the run has come to;
  //   - the fusion line is soft added light strung along both edges, following them as they move;
  //   - the stars are diamonds of three sizes and tints, in meshes by how tall the band must be to take them in;
  //   - a spiral galaxy, a nebula band, a Milky Way and smaller glows are soft added pictures, each fading in once
  //     the band holds the whole of it.
  // The band's height eases on as the run comes down, never back; nothing is built or allocated after load.
  // ---- Flipside's lagoon (`?ch5lagoon=0` turns it off, for the plain sea) --------------------------------------
  // The sea far under the course as a Caribbean lagoon: a great disc laid just over the sea, painted once, deep blue
  // with broad turquoise shallows over white sand, darker reef lines and coral heads where the shallows drop away,
  // white-sand atolls ringing bright aqua lagoons with green tops, and sandbars; over the nearer atolls low voxel
  // islands of sand with palms, merged into one mesh. Both hang from the turning sky, so after the flip they are
  // overhead, upside down. Built once at load; nothing moves.
  const LAGOON = (() => { try { return new URLSearchParams(location.search).get("ch5lagoon") !== "0"; } catch { return true; } })();
  const LAGOON_SIZE = 2048, LAGOON_SPAN = 9000;
  // Smooth value noise over the plan, for the lagoon's shapes and colours.
  const lagoonNoise = (() => {
    const P = new Float32Array(256 * 256), r = mulberry32(2718);
    for (let i = 0; i < P.length; i++) P[i] = r();
    const at = (x, y) => P[((y & 255) << 8) | (x & 255)];
    const v = (x, y) => { const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
      const a = at(xi, yi), b = at(xi + 1, yi), c = at(xi, yi + 1), d = at(xi + 1, yi + 1); return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy; };
    return (x, y, oct = 4) => { let sum = 0, amp = 0.5, f = 1, norm = 0; for (let o = 0; o < oct; o++) { sum += amp * v(x * f, y * f); norm += amp; f *= 2.03; amp *= 0.5; } return sum / norm; };
  })();
  // Where the shoals, atolls, cays and sandbars lie, in the disc's plan (-1 to 1), with their sizes.
  const lagoonPlan = M.cached(() => {
    const r = mulberry32(1492), atolls = [], shoals = [], bars = [];
    for (let i = 0; i < 16; i++) { const near = i < 9; shoals.push({ x: (r() - 0.5) * (near ? 0.4 : 0.9), y: (r() - 0.5) * (near ? 0.4 : 0.9), rx: 0.06 + r() * 0.08, ry: 0.045 + r() * 0.06, a: r() * Math.PI }); }
    for (const sh of shoals) for (let k = 0, n = 1 + Math.floor(r() * 4); k < n; k++) {
      const a = r() * TAU, d = Math.sqrt(r()) * 0.75;
      atolls.push({ x: sh.x + Math.cos(a) * sh.rx * d, y: sh.y + Math.sin(a) * sh.ry * d, r: 0.004 + r() * r() * 0.014, ring: r() < 0.45, green: r() < 0.5, stretch: 1 + r() * 1.6, a: r() * Math.PI, seed: Math.floor(r() * 1e6) });
    }
    for (let i = 0; i < 16; i++) atolls.push({ x: (r() - 0.5) * 0.8, y: (r() - 0.5) * 0.8, r: 0.003 + r() * 0.005, ring: false, green: r() < 0.5, stretch: 1 + r() * 2, a: r() * Math.PI, seed: Math.floor(r() * 1e6) });
    for (let i = 0; i < 22; i++) { const sh = shoals[i % shoals.length]; bars.push({ x: sh.x + (r() - 0.5) * sh.rx, y: sh.y + (r() - 0.5) * sh.ry, l: 0.012 + r() * 0.03, w: 0.002 + r() * 0.0025, a: r() * Math.PI }); }
    return { atolls, shoals, bars };
  });
  // Height over the sea bed, 0 deep to 1 dry sand: shoals as broad warped swells, atolls and cays as sharper ones
  // (each on a softer halo; a ring atoll with its lagoon scooped out), sandbars as long thin ones; then coloured from
  // it, deep blue through turquoise and pale aqua to white sand with green tops, reefs as soft broken darker patches
  // in the mid shallows, soft broken surf on their edge, a gentle tint drifting over the whole, a very faint scatter of
  // sun glints on the deep; and the swell, soft pale curving lines (the contours of warped noise, so never straight)
  // only where the water is deep, in two layers. Painted a piece at a time in idle moments from when the scenery is
  // made (at least LAGOON_SLICE ms each time, and a few milliseconds a frame in a run, if it is not done by then), so opening the level never stalls on
  // it: until it is done the disc shows the open sea's blue and the swell is not shown.
  const LAGOON_RAMP = [[0, [8, 46, 104]], [0.16, [12, 74, 140]], [0.3, [22, 128, 180]], [0.42, [40, 196, 210]], [0.56, [88, 224, 216]], [0.74, [170, 244, 232]], [0.79, [200, 246, 236]], [0.82, [244, 242, 224]], [1, [252, 249, 236]]];
  const WAVE_SIZE = 512, LAGOON_SLICE = 8, LAGOON_FRAME = 8, LAGOON_ROWS = 48, LAGOON_FADE = 1.2;
  let lagoonJob = null;
  const lagoonStart = () => {
    if (lagoonJob || typeof document === "undefined") return lagoonJob;
    const n = LAGOON_SIZE, canvas = document.createElement("canvas"); canvas.width = canvas.height = n;
    const g = canvas.getContext("2d");
    // The renderer takes the picture once it says it is loaded: not until it is painted.
    Object.assign(canvas, { complete: false, naturalWidth: n, naturalHeight: n });
    const { atolls, shoals, bars } = lagoonPlan(), features = [];
    for (const sh of shoals) features.push([sh.x, sh.y, sh.rx, sh.ry, sh.a, 0.68, 1.1, 0.9, 0]);
    for (const b of bars) features.push([b.x, b.y, b.l, b.w, b.a, 0.75, 1.2, 0.5, 0]);
    for (const at of atolls) features.push([at.x, at.y, at.r * at.stretch * 2.6, at.r * 2.6, at.a, 0.7, 1.3, 0.6, 0]);
    for (const at of atolls) features.push([at.x, at.y, at.r * at.stretch, at.r, at.a, at.ring ? 0.98 : 0.97, 0.45, 0.9, at.ring ? 0.5 : 0]);
    lagoonJob = { n, canvas, g, h: new Float32Array(n * n), img: null, features, phase: 0, row: 0, sub: 0, done: false, waves: [null, null], waveImg: null, rand: mulberry32(99), ms: 0, longest: 0 };
    // Each idle moment paints while the browser has time to spare, and at least LAGOON_SLICE even when it has none (a
    // busy page's idle calls come by their timeout with nothing to spare, which would otherwise never finish it).
    const idle = (deadline) => { const until = performance.now() + LAGOON_SLICE; lagoonStep(() => deadline.timeRemaining() > 2 || performance.now() < until); if (!lagoonJob.done) requestIdleCallback(idle, { timeout: 250 }); };
    if (typeof requestIdleCallback === "function") requestIdleCallback(idle, { timeout: 250 });
    // And LAGOON_FRAME ms of each frame as well, from now until it is done: a busy page has few idle moments, and the
    // level should have its lagoon by the time a player has walked to the cabinet and picked it.
    const frame = () => { const until = performance.now() + LAGOON_FRAME; lagoonStep(() => performance.now() < until); if (!lagoonJob.done) requestAnimationFrame(frame); };
    if (typeof requestAnimationFrame === "function") requestAnimationFrame(frame);
    return lagoonJob;
  };
  // One piece of the painting at a time while `more()` says there is time.
  const lagoonStep = (more) => {
    const J = lagoonJob, n = J.n, h = J.h, N = lagoonNoise, began = performance.now();
    while (!J.done && more()) {
      if (J.phase === 0) {
        // The sea bed's own gentle swells, a row at a time.
        const y = J.row; for (let x = 0; x < n; x++) h[y * n + x] = 0.06 + 0.08 * N(x / n * 6, y / n * 6, 3);
        if (++J.row === n) { J.phase = 1; J.row = 0; }
      } else if (J.phase === 1) {
        // The shoals, sandbars, halos and islands, one at a time, LAGOON_ROWS rows of one at a time.
        const [cx, cy, rx, ry, a, amp, sharp, warp, inner] = J.features[J.row];
        const toPx = (v) => (v * 0.5 + 0.5) * n, R = Math.max(rx, ry) * n * 0.5 * 1.8, ca = Math.cos(a), sa = Math.sin(a);
        const x0 = Math.max(0, Math.floor(toPx(cx) - R)), x1 = Math.min(n - 1, Math.ceil(toPx(cx) + R)), y0 = Math.max(0, Math.floor(toPx(cy) - R)), y1 = Math.min(n - 1, Math.ceil(toPx(cy) + R));
        const from = y0 + J.sub, to = Math.min(y1, from + LAGOON_ROWS - 1);
        for (let y = from; y <= to; y++) for (let x = x0; x <= x1; x++) {
          const u = x / n * 2 - 1 - cx, v = y / n * 2 - 1 - cy, lu = (u * ca + v * sa) / rx, lv = (-u * sa + v * ca) / ry;
          const d = Math.hypot(lu, lv) * (1 + warp * (N(x / n * 40 + cx * 9, y / n * 40 + cy * 7, 3) - 0.5));
          let k = Math.pow(Math.max(0, 1 - d), sharp);
          if (inner) k -= inner * Math.pow(Math.max(0, 1 - d / 0.62), 2);
          const i = y * n + x; h[i] = Math.max(h[i], h[i] + amp * k * (1 - h[i]));
        }
        if (to < y1) { J.sub += LAGOON_ROWS; continue; }
        J.sub = 0;
        if (++J.row === J.features.length) { J.phase = 2; J.row = 0; J.img = J.g.createImageData(n, n); }
      } else if (J.phase === 2) {
        // Colour, a row at a time.
        const px = J.img.data, y = J.row, v = y / n, o = lagoonInk;
        for (let x = 0; x < n; x++) {
          const i = y * n + x, u = x / n, t = h[i];
          let j = 0; while (j < LAGOON_RAMP.length - 2 && t > LAGOON_RAMP[j + 1][0]) j++;
          const [t0, ca] = LAGOON_RAMP[j], [t1, cb] = LAGOON_RAMP[j + 1], f = Math.max(0, Math.min(1, (t - t0) / (t1 - t0)));
          o[0] = ca[0] + (cb[0] - ca[0]) * f; o[1] = ca[1] + (cb[1] - ca[1]) * f; o[2] = ca[2] + (cb[2] - ca[2]) * f;
          const drift = N(u * 3 + 5, v * 3 + 2, 3) - 0.5; o[1] += drift * 18 * (1 - t); o[2] -= drift * 10 * (1 - t);
          const reefBand = Math.max(0, 1 - Math.abs(t - 0.4) / 0.14), reef = reefBand > 0 ? Math.max(0, N(u * 90, v * 90, 3) - 0.48) * 3.2 * reefBand : 0;
          if (reef > 0) { const k = 1 - Math.min(0.45, reef * 0.5); o[0] *= k; o[1] *= k * 0.96; o[2] *= k * 0.9; }
          const near = Math.abs(t - 0.36) < 0.035, surf = near ? (1 - Math.abs(t - 0.36) / 0.035) * Math.max(0, N(u * 140 + 3, v * 140, 3) - 0.42) * 2.4 : 0;
          if (surf > 0) { const k = Math.min(0.7, surf); o[0] += (245 - o[0]) * k; o[1] += (250 - o[1]) * k; o[2] += (252 - o[2]) * k; }
          if (t > 0.9 && N(u * 160, v * 160, 2) > 0.56) { const k = Math.min(1, (t - 0.9) / 0.05); o[0] += (52 - o[0]) * k; o[1] += (128 - o[1]) * k; o[2] += (58 - o[2]) * k; }
          if (t < 0.3 && J.rand() < 0.0006) { o[0] += 60; o[1] += 60; o[2] += 50; }
          // Its outer reaches fade to nothing, so beyond them the sea every level shares (hazing into the sky as
          // on Floating Isles) carries on with no edge between them.
          const rim = Math.max(0, Math.min(1, (0.46 - Math.hypot(u - 0.5, v - 0.5)) / 0.2)), a = rim * rim * (3 - 2 * rim);
          px[i * 4] = o[0]; px[i * 4 + 1] = o[1]; px[i * 4 + 2] = o[2]; px[i * 4 + 3] = a * 255;
        }
        if (++J.row === n) { J.g.putImageData(J.img, 0, 0); J.img = null; J.phase = 3; J.row = 0; J.waveImg = J.g.createImageData(WAVE_SIZE, WAVE_SIZE); }
      } else {
        // The swell's two layers, a row at a time each.
        const w = J.phase - 3, m = WAVE_SIZE, F = n / m, px = J.waveImg.data, y = J.row, wv0 = y / m;
        for (let x = 0; x < m; x++) {
          const u = x / m, t = h[Math.floor(y * F) * n + Math.floor(x * F)], rim = Math.max(0, Math.min(1, (0.45 - Math.hypot(u - 0.5, wv0 - 0.5)) / 0.15)), open = Math.max(0, Math.min(1, (0.3 - t) / 0.08)) * rim, i = (y * m + x) * 4;
          let k = 0;
          if (open > 0) { const wv = N(u * 26 + w * 7 + N(u * 6, wv0 * 6, 2) * 3, wv0 * 26 + w * 3, 3) * 9, band = 1 - Math.abs(2 * (wv - Math.floor(wv)) - 1); k = Math.pow(band, 12) * Math.max(0, N(u * 40 + w * 9, wv0 * 40, 3) - 0.38) * 2.6 * open; }
          px[i] = px[i + 1] = px[i + 2] = 255; px[i + 3] = Math.min(255, k * 70);
        }
        if (++J.row === m) {
          const c = document.createElement("canvas"); c.width = c.height = m; c.getContext("2d").putImageData(J.waveImg, 0, 0);
          // The canvas itself is the picture (encoding it to an image would hold up a frame): it says it is loaded.
          const geo = M.panel({ tilesX: 1, tilesY: 1, color: "#000000" }), image = Object.assign(c, { complete: true, naturalWidth: m, naturalHeight: m });
          geo.castShadow = false; geo.cutawayPreserve = true;
          geo.imageSurface = { asset: { width: m, height: m, load: () => image }, rect: [-0.5, -0.5, 1, 1], cutout: true, soft: true, blend: "add", bright: 1.2 };
          J.waves[w] = geo; J.row = 0;
          if (++J.phase === 5) { J.waveImg = null; J.h = null; J.done = true; J.doneAt = performance.now(); J.canvas.complete = true; }
        }
      }
    }
    // How long the painting has taken in all, and the longest it held one turn, for the tests.
    const took = performance.now() - began; J.ms += took; J.longest = Math.max(J.longest, took);
    return J.done;
  };
  const lagoonInk = [0, 0, 0];
  // Until the lagoon is painted, a plain veil of its deep blue in its place, fading out at the same rim, so the sea
  // every level shares is never what shows under the course.
  const lagoonVeil = M.cached(() => {
    const m = 128, canvas = document.createElement("canvas"); canvas.width = canvas.height = m;
    const g = canvas.getContext("2d"), fill = g.createRadialGradient(m / 2, m / 2, 0, m / 2, m / 2, m / 2);
    fill.addColorStop(0, "rgba(16,92,160,1)"); fill.addColorStop(0.52, "rgba(14,84,150,1)"); fill.addColorStop(0.92, "rgba(14,84,150,0)"); fill.addColorStop(1, "rgba(14,84,150,0)");
    g.fillStyle = fill; g.fillRect(0, 0, m, m);
    Object.assign(canvas, { complete: true, naturalWidth: m, naturalHeight: m });
    const geo = M.panel({ tilesX: 1, tilesY: 1, color: "#000000" });
    geo.imageSurface = { asset: { width: m, height: m, load: () => canvas }, rect: [-0.5, -0.5, 1, 1], cutout: true, soft: true, blend: "alpha", bright: 0 };
    geo.castShadow = false; geo.cutawayPreserve = true;
    return geo;
  });
  // The lagoon laid on the sea: a picture blended over it, see-through where it fades out at its rim.
  const lagoonDisc = M.cached(() => {
    const g = M.panel({ tilesX: 1, tilesY: 1, color: "#000000" }), canvas = lagoonStart().canvas;
    g.imageSurface = { asset: { width: LAGOON_SIZE, height: LAGOON_SIZE, load: () => canvas }, rect: [-0.5, -0.5, 1, 1], cutout: true, soft: true, blend: "alpha", bright: 0 };
    g.castShadow = false; g.cutawayPreserve = true;
    return g;
  });
  // The nearer atolls' islands: sand blocks round a ring (or a heap for a cay), a few palms; one mesh in metres.
  const lagoonIslands = M.cached(() => {
    const parts = [], { atolls } = lagoonPlan(), half = LAGOON_SPAN / 2;
    for (const at of atolls) {
      if (Math.hypot(at.x, at.y) > 0.3 || at.r < 0.003) continue;
      const q = mulberry32(at.seed + 7), x = at.x * half, z = -at.y * half, rad = at.r * half * 0.8, n = at.ring ? 16 : 6;
      for (let k = 0; k < n; k++) {
        const a = k / n * TAU + q() * 0.3, d = at.ring ? rad * 0.82 : q() * rad * 0.45, w = rad * (at.ring ? 0.28 : 0.5);
        const ox = Math.cos(a) * d * at.stretch, oz = Math.sin(a) * d, ca = Math.cos(at.a), sa = Math.sin(at.a), bx = x + ox * ca - oz * sa, bz = z - (ox * sa + oz * ca);
        parts.push(M.box({ w, h: 0.8 + q() * 1.2, d: w * (0.6 + q() * 0.5), color: q() < 0.5 ? "#f3ead0" : "#e8dcb8", offset: { x: bx, y: 0.4, z: bz } }));
        if (at.green && q() < 0.5) {
          const hh = 6 + q() * 5;
          parts.push(M.box({ w: 0.7, h: hh, d: 0.7, color: "#8a6a44", offset: { x: bx, y: hh / 2 + 0.8, z: bz } }));
          for (let f = 0; f < 4; f++) { const fa = f / 4 * TAU + q(); parts.push(M.box({ w: 4.5, h: 0.4, d: 1.4, color: f % 2 ? "#2f8a3e" : "#3fa24c", offset: { x: bx + Math.cos(fa) * 2, y: hh + 0.8, z: bz + Math.sin(fa) * 2 } })); }
        }
      }
    }
    const g = M.merge(...parts); g.castShadow = false; g.fogPierce = 0.3;
    return g;
  });
  const RIFT = (() => { try { return new URLSearchParams(location.search).get("ch5rift") !== "0"; } catch { return true; } })();
  // The stages the band's geometry is reckoned in; it is built as the last.
  const RIFT_STAGES = 16;
  // The band's full height (radians over and under the horizon, before its edges' waver), as at the finish; its
  // geometry is built at that height and drawn squeezed toward the horizon to the height the run has come to.
  // `bandHalf(k)` is the full band's own (k the last stage) for what is built from it.
  const BAND_FULL = 0.334, bandHalf = () => BAND_FULL;
  // How tall the band stands `t` of the way down the course: nothing until BAND_FROM, then easing in to a thin line by
  // the flip (half way), and from there widening as the run goes on to its full height at the finish.
  // BAND_SOLID: how tall it stands by the time it is fully drawn, faint below that.
  const BAND_SOLID = 0.05, BAND_FROM = 0.3, BAND_FLIP = 0.024;
  const bandAt = (t) => t <= BAND_FROM ? 0 : t <= 0.5 ? BAND_FLIP * ((t - BAND_FROM) / (0.5 - BAND_FROM)) ** 2 : BAND_FLIP + Math.min(1, (t - 0.5) / 0.5) ** 1.15 * (BAND_FULL - BAND_FLIP);
  // Each edge wavers gently round the horizon, the upper and the lower each its own way.
  const waverUp = (a) => 1 + 0.16 * Math.sin(3 * a + 1.1) + 0.08 * Math.sin(5 * a + 2.3) + 0.04 * Math.sin(9 * a + 0.4);
  const waverDown = (a) => 1 + 0.15 * Math.sin(3 * a + 4.0) + 0.09 * Math.sin(4 * a + 0.7) + 0.04 * Math.sin(8 * a + 2.9);
  const bandTop = (k, a) => bandHalf(k) * waverUp(a), bandBottom = (k, a) => -bandHalf(k) * waverDown(a);
  const bandPoint = (el, az, out) => { const c = Math.cos(el); out[0] = c * Math.cos(az); out[1] = c * Math.sin(az); out[2] = Math.sin(el); return out; };
  // How tall the band must stand for a direction (`el` over the horizon, `az` round it) to lie `margin` inside it.
  const bandNeeds = (el, az, margin) => (Math.abs(el) + margin) / (el >= 0 ? waverUp(az) : waverDown(az));
  const AZ = 128, SPACE_IN = [5, 7, 16], SPACE_OUT = [12, 16, 38];
  // The meld out from each edge: see-through rings, each a little wider, from deep violet through the fusion line's
  // own tints, so their stack thins smoothly to nothing on the water's side and the sky's.
  const SEAM_INKS = [[30, 18, 60], [70, 40, 120], [60, 120, 150], [110, 90, 170], [120, 150, 200]];
  const SEAM = SEAM_INKS.map((c, j) => [...c, (j + 1) / SEAM_INKS.length]);
  const bandRing = (g, k, edge, sign, from, to, color) => {
    const p = [0, 0, 0], a = [], b = [];
    for (let i = 0; i < AZ; i++) {
      const az = i / AZ * TAU, e = edge(k, az);
      bandPoint(e - sign * from, az, p); a.push(M.pushVert(g, p[0], p[1], p[2]));
      bandPoint(e + sign * to, az, p); b.push(M.pushVert(g, p[0], p[1], p[2]));
    }
    for (let i = 0; i < AZ; i++) {
      const q = [a[i], b[i], b[(i + 1) % AZ], a[(i + 1) % AZ]];
      M.face(g, q, color, { emissive: 1 }); M.face(g, [...q].reverse(), color, { emissive: 1 });
    }
  };
  const riftCap = M.variants((k) => {
    const g = M.geometry(), ROWS = 6, rows = [], p = [0, 0, 0];
    for (let j = 0; j <= ROWS; j++) {
      const row = [];
      for (let i = 0; i < AZ; i++) { const az = i / AZ * TAU, lo = bandBottom(k, az), hi = bandTop(k, az); bandPoint(lo + (hi - lo) * j / ROWS, az, p); row.push(M.pushVert(g, p[0], p[1], p[2])); }
      rows.push(row);
    }
    for (let j = 0; j < ROWS; j++) {
      const t = Math.abs((j + 0.5) / ROWS - 0.5) * 2, color = SPACE_IN.map((v, c) => Math.round(v + (SPACE_OUT[c] - v) * t * t));
      for (let i = 0; i < AZ; i++) {
        const q = [rows[j][i], rows[j + 1][i], rows[j + 1][(i + 1) % AZ], rows[j][(i + 1) % AZ]];
        M.face(g, q, color, { emissive: 1 }); M.face(g, [...q].reverse(), color, { emissive: 1 });
      }
    }
    g.castShadow = false; g.fogPierce = 0.85;
    return g;
  });
  // The meld's rings at stage k, both edges, ring j: as wide as the band is tall allows, within limits.
  const riftSeam = M.variants((key) => {
    const [k, j] = key, g = M.geometry(), [r, gg, b, t] = SEAM[j], wide = Math.max(0.012, Math.min(0.09, bandHalf(k) * 0.4)) * t;
    bandRing(g, k, bandTop, 1, 0.006, wide, [r, gg, b]); bandRing(g, k, bandBottom, -1, 0.006, wide, [r, gg, b]);
    g.castShadow = false; g.fogPierce = 0.85; g.glass = 0.14;
    return g;
  });
  // The stars, spread evenly (a jittered grid over the dome), each given to the first stage that takes it in.
  const STAR_INKS = [[235, 238, 245], [190, 214, 255], [255, 226, 180]], STAR_SIZES = [0.0014, 0.0021, 0.0032];
  // The stars, spread evenly (a jittered grid round the horizon), in STAR_BINS meshes by how tall the band must
  // stand to take each in, each mesh shown once it is that tall.
  const STAR_BINS = 48;
  const riftStars = M.cached(() => {
    const r = mulberry32(2009), groups = Array.from({ length: STAR_BINS }, () => M.geometry()), p = [0, 0, 0];
    const BANDS = 26, low = -Math.sin(0.46), high = Math.sin(0.46);
    for (let b = 0; b < BANDS; b++) {
      const across = 320;
      for (let c = 0; c < across; c++) {
        const z = low + (b + r()) / BANDS * (high - low), h = Math.sqrt(1 - z * z), az = (c + r()) / across * TAU;
        p[0] = Math.cos(az) * h; p[1] = Math.sin(az) * h; p[2] = z;
        const need = bandNeeds(Math.asin(z), az, 0.006);
        if (need > BAND_FULL) continue;
        const pick = r(), size = STAR_SIZES[pick < 0.72 ? 0 : pick < 0.95 ? 1 : 2] * (0.85 + r() * 0.3), ink = STAR_INKS[r() < 0.7 ? 0 : r() < 0.6 ? 1 : 2], lit = 0.75 + r() * 0.25;
        const color = ink.map((v) => Math.round(v * lit)), g = groups[Math.min(STAR_BINS - 1, Math.floor(need / BAND_FULL * STAR_BINS))];
        // A diamond in the dome's surface, just inside the band's mesh.
        const ex = [-p[1] / h, p[0] / h, 0], ey = [p[1] * ex[2] - p[2] * ex[1], p[2] * ex[0] - p[0] * ex[2], p[0] * ex[1] - p[1] * ex[0]], R = 0.99;
        const v = [[1, 0], [0, 1], [-1, 0], [0, -1]].map(([a, bb]) => M.pushVert(g, p[0] * R + (ex[0] * a + ey[0] * bb) * size, p[1] * R + (ex[1] * a + ey[1] * bb) * size, p[2] * R + (ex[2] * a + ey[2] * bb) * size));
        M.face(g, v, color, { emissive: 1 }); M.face(g, [...v].reverse(), color, { emissive: 1 });
      }
    }
    for (const g of groups) { g.castShadow = false; g.fogPierce = 0.9; }
    return groups;
  });
  // The soft pictures: a canvas painted once, laid on a square the renderer adds as light.
  const softPicture = (w, h, paint) => {
    const canvas = document.createElement("canvas"); canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext("2d");
    paint(ctx, w, h);
    // Faded to nothing well inside its square, whatever was painted: no edge of the picture ever shows, at any slant.
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.shadowBlur = 0; ctx.globalCompositeOperation = "destination-in";
    ctx.translate(w / 2, h / 2); ctx.scale(w / 2, h / 2);
    const fade = ctx.createRadialGradient(0, 0, 0, 0, 0, 1); fade.addColorStop(0, "rgba(0,0,0,1)"); fade.addColorStop(0.55, "rgba(0,0,0,1)"); fade.addColorStop(0.95, "rgba(0,0,0,0)");
    ctx.fillStyle = fade; ctx.fillRect(-1, -1, 2, 2);
    const image = new Image(); image.src = canvas.toDataURL("image/png");
    const g = M.panel({ tilesX: 1, tilesY: 1, color: "#000000" });
    g.castShadow = false; g.cutawayPreserve = true; g.fogPierce = 0.9;
    g.imageSurface = { asset: { width: w, height: h, load: () => image }, rect: [-0.5, -0.5, 1, 1], cutout: true, soft: true, blend: "add", bright: 2.4 };
    return g;
  };
  const blob = (ctx, x, y, r, rgb, a) => { const gr = ctx.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(${rgb},${a})`); gr.addColorStop(0.5, `rgba(${rgb},${a * 0.4})`); gr.addColorStop(1, `rgba(${rgb},0)`); ctx.fillStyle = gr; ctx.fillRect(x - r, y - r, r * 2, r * 2); };
  const RIFT_GLOWS = M.cached(() => ({
    // A spiral galaxy, near face-on: a cream-white core, layered arms of pale blue-grey wound out from it with dark
    // lanes left between the layers, pink knots along them, and (the big one) a small gold companion off one arm's end,
    // joined to it by a faint trail. `v` 0 is the big one, 1 a tiny far one.
    spiral: M.variants((v) => softPicture(256, 256, (ctx) => {
      const r = mulberry32(51 + v);
      ctx.translate(128, 128); ctx.scale(v ? 0.6 : 0.82, v ? 0.35 : 0.68); ctx.rotate(0.5);
      for (let layer = 0; layer < 2; layer++) for (let arm = 0; arm < 2; arm++) for (let t = 0; t < 1; t += 0.015) {
        const a = arm * Math.PI + t * 3.2 * Math.PI + layer * 0.22, rr = 10 + t * (v ? 100 : 82);
        blob(ctx, Math.cos(a) * rr, Math.sin(a) * rr, (layer ? 10 : 16) - t * 6, layer ? "205,215,235" : "160,180,215", (layer ? 0.1 : 0.12) * (1 - t * 0.7));
      }
      if (!v) {
        for (let i = 0; i < 26; i++) { const arm = i % 2, t = 0.25 + r() * 0.6, a = arm * Math.PI + t * 3.2 * Math.PI + 0.1, rr = 10 + t * 82; blob(ctx, Math.cos(a) * rr, Math.sin(a) * rr, 3 + r() * 2, "255,140,190", 0.7); }
        // The companion and its trail.
        for (let t = 0; t < 1; t += 0.05) { const a = 3.2 * Math.PI + t * 0.6, rr = 92 + t * 18; blob(ctx, Math.cos(a) * rr, Math.sin(a) * rr, 7, "220,200,170", 0.06); }
        const ca = 3.2 * Math.PI + 0.6; blob(ctx, Math.cos(ca) * 112, Math.sin(ca) * 112, 16, "255,205,130", 0.5); blob(ctx, Math.cos(ca) * 112, Math.sin(ca) * 112, 5, "255,240,210", 0.9);
      }
      blob(ctx, 0, 0, 40, "255,235,200", 0.6); blob(ctx, 0, 0, 14, "255,250,238", 1);
    })),
    // A soft violet and magenta glow with a warm orange rim along its lower side, to sit behind part of the band.
    glow: M.cached(() => softPicture(256, 256, (ctx) => {
      blob(ctx, 128, 120, 118, "130,60,180", 0.3); blob(ctx, 140, 112, 70, "210,70,170", 0.28);
      for (let i = 0; i < 9; i++) { const a = 0.35 + i / 8 * 2.4; blob(ctx, 128 + Math.cos(a) * 82, 120 + Math.sin(a) * 70, 26, "255,150,70", 0.16); }
    })),
    // A compact cluster of young stars: a dozen bright points close together over a faint pale glow.
    cluster: M.cached(() => softPicture(128, 128, (ctx) => {
      const r = mulberry32(88); blob(ctx, 64, 64, 50, "190,210,255", 0.2);
      for (let i = 0; i < 16; i++) { const a = r() * TAU, d = r() ** 1.6 * 34; blob(ctx, 64 + Math.cos(a) * d, 64 + Math.sin(a) * d, 4 + r() * 4, "235,242,255", 1); }
    })),
    // A small magenta glow.
    knot: M.cached(() => softPicture(64, 64, (ctx) => { blob(ctx, 32, 32, 30, "230,80,190", 0.4); blob(ctx, 32, 32, 9, "255,170,220", 0.6); })),
    // The nebula band: a gentle S of soft magenta and violet glow, combed through with thin filaments of pink, magenta
    // and violet, a few pale gold and white highlights along its spine. Smooth strokes only.
    band: M.cached(() => softPicture(1024, 256, (ctx, W, H) => {
      const r = mulberry32(1974), spine = (x) => H / 2 + Math.sin(x / W * TAU * 0.9 + 0.6) * H * 0.16;
      // Cool on the left (cyan-blue and magenta), shading to warm glowing orange and amber on the right.
      const COOL = ["90,180,240", "210,70,190", "150,90,230"], WARM = ["255,150,60", "255,190,90", "230,90,150"];
      for (let i = 0; i < 30; i++) { const x = 140 + i / 29 * (W - 280), fade = Math.sin(i / 29 * Math.PI), set = i < 15 ? COOL : WARM; blob(ctx, x, spine(x) + (r() - 0.5) * 30, 50 + r() * 40, set[i % 3], 0.12 * fade); }
      const INKS = ["120,200,255", "220,80,200", "170,110,240", "255,140,190", "255,160,70", "255,200,110"];
      ctx.lineCap = "round";
      for (let i = 0; i < 46; i++) {
        const off = (r() - 0.5) * 70, x0 = 60 + r() * W * 0.5, x1 = Math.min(W - 60, x0 + W * (0.25 + r() * 0.4)), mid = (x0 + x1) / 2 / W, ink = INKS[Math.min(5, Math.floor(mid * 4 + r() * 2.5))], bend = (r() - 0.5) * 60;
        ctx.strokeStyle = `rgba(${ink},${0.06 + r() * 0.12})`; ctx.lineWidth = 1.5 + r() * 4; ctx.shadowColor = `rgba(${ink},0.5)`; ctx.shadowBlur = 10;
        ctx.beginPath(); ctx.moveTo(x0, spine(x0) + off);
        ctx.quadraticCurveTo((x0 + x1) / 2, spine((x0 + x1) / 2) + off + bend, Math.min(W - 20, x1), spine(Math.min(W - 20, x1)) + off * 0.6); ctx.stroke();
      }
      // A bright rim along the warm clouds' upper edge, as if lit from behind.
      ctx.strokeStyle = "rgba(255,210,140,0.35)"; ctx.lineWidth = 2.5; ctx.shadowColor = "rgba(255,170,80,0.9)"; ctx.shadowBlur = 14;
      ctx.beginPath(); for (let x = W * 0.58; x < W * 0.92; x += 8) { const y = spine(x) - 34 - Math.sin(x / 37) * 8; if (x === W * 0.58) ctx.moveTo(x, y); else ctx.lineTo(x, y); } ctx.stroke();
      for (let i = 0; i < 12; i++) {
        const x = 160 + r() * (W - 320), y = spine(x) + (r() - 0.5) * 24, l = 30 + r() * 60, ink = i % 3 ? "255,215,150" : "255,250,240";
        ctx.strokeStyle = `rgba(${ink},${0.25 + r() * 0.2})`; ctx.lineWidth = 1 + r() * 1.5; ctx.shadowColor = `rgba(${ink},0.8)`; ctx.shadowBlur = 8;
        ctx.beginPath(); ctx.moveTo(x - l / 2, spine(x - l / 2) + y - spine(x)); ctx.quadraticCurveTo(x, y + (r() - 0.5) * 10, x + l / 2, spine(x + l / 2) + y - spine(x)); ctx.stroke();
      }
    })),
    // The Milky Way: a long soft band of very fine stars round a creamy core, two dark lanes left along it.
    milky: M.cached(() => softPicture(1024, 192, (ctx, W, H) => {
      const r = mulberry32(250);
      for (let i = 0; i < 40; i++) { const x = 20 + i / 39 * (W - 40), f = Math.sin(i / 39 * Math.PI); blob(ctx, x, H / 2 + (r() - 0.5) * 16, 60 + r() * 20, "150,160,200", 0.07 * f); blob(ctx, x, H / 2, 30, "255,235,200", 0.07 * f * f); }
      ctx.fillStyle = "rgba(240,240,255,0.55)";
      for (let i = 0; i < 2600; i++) { const x = r() * W, f = Math.sin(x / W * Math.PI), y = H / 2 + (r() + r() + r() - 1.5) * H * 0.38; const lane = Math.abs(y - H / 2 - 10 - Math.sin(x / 90) * 6) < 5 || Math.abs(y - H / 2 + 18 - Math.sin(x / 130) * 5) < 3; if (!lane && r() < f) ctx.fillRect(x, y, 1.5, 1.5); }
      ctx.globalCompositeOperation = "destination-out"; ctx.lineWidth = 6; ctx.strokeStyle = "rgba(0,0,0,0.6)";
      for (const [dy, per, amp] of [[10, 90, 6], [-18, 130, 5]]) { ctx.beginPath(); for (let x = W * 0.15; x < W * 0.85; x += 6) { const y = H / 2 + dy + Math.sin(x / per) * amp; if (x === W * 0.15) ctx.moveTo(x, y); else ctx.lineTo(x, y); } ctx.stroke(); }
      ctx.globalCompositeOperation = "source-over";
    })),
    // A dwarf galaxy: a small fuzzy cloud of pale light, a little lumpy.
    dwarf: M.variants((v) => softPicture(128, 128, (ctx) => { const r = mulberry32(61 + v); for (let i = 0; i < 7; i++) blob(ctx, 64 + (r() - 0.5) * 40, 64 + (r() - 0.5) * 26, 24 + r() * 14, "215,220,240", 0.16); blob(ctx, 60, 62, 12, "240,240,255", 0.3); })),
    // A stretch of the fusion line, the glow where space meets the water or the sky, as a mixed aurora: a bright line
    // across at 60% down, its tint shifting along it between two of pink, green, purple and blue, glowing off both
    // ways, and soft curtain streaks rising from it into the space (up the picture).
    fusion: M.variants((v) => softPicture(256, 256, (ctx, W, H) => {
      const INKS = [[255, 110, 200], [90, 255, 160], [170, 110, 255], [90, 170, 255]], A = INKS[v % 4], B = INKS[(v + 1) % 4], r = mulberry32(300 + v), line = H * 0.6;
      const ink = (x) => { const t = x / W; return A.map((c, i) => Math.round(c + (B[i] - c) * t)).join(","); };
      for (let x = 0; x < W; x += 4) {
        const g = ctx.createLinearGradient(0, line - 70, 0, line + 50), c = ink(x);
        g.addColorStop(0, `rgba(${c},0)`); g.addColorStop(0.6, `rgba(${c},0.32)`); g.addColorStop(0.7, `rgba(255,255,255,0.55)`); g.addColorStop(0.78, `rgba(${c},0.3)`); g.addColorStop(1, `rgba(${c},0)`);
        ctx.fillStyle = g; ctx.fillRect(x, line - 70, 4, 120);
      }
      for (let i = 0; i < 26; i++) {
        const x = 10 + r() * (W - 20), tall = 40 + r() * 100, c = ink(x), g = ctx.createLinearGradient(0, line, 0, line - tall);
        g.addColorStop(0, `rgba(${c},${0.25 + r() * 0.2})`); g.addColorStop(1, `rgba(${c},0)`);
        ctx.fillStyle = g; ctx.fillRect(x, line - tall, 2 + r() * 4, tall);
      }
    })),
    // A brighter star with a soft halo, white or pale gold; `v` 2 and 3 with four thin diffraction spikes too.
    halo: M.variants((v) => softPicture(128, 128, (ctx) => {
      blob(ctx, 64, 64, 40, v % 2 ? "255,220,170" : "200,220,255", 0.32); blob(ctx, 64, 64, 8, "255,255,255", 1);
      if (v >= 2) for (const [dx, dy] of [[1, 0], [0, 1]]) {
        const g = ctx.createLinearGradient(64 - dx * 62, 64 - dy * 62, 64 + dx * 62, 64 + dy * 62);
        g.addColorStop(0, "rgba(255,255,255,0)"); g.addColorStop(0.5, "rgba(255,255,255,0.85)"); g.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = g; ctx.fillRect(dx ? 2 : 63, dy ? 2 : 63, dx ? 124 : 2, dy ? 124 : 2);
      }
    })),
  }));
  // Where they lie on the band: round from the way ahead (radians), over (+) or under (-) the horizon, size (dome
  // radii), and the picture. Each shows from the first stage whose band holds it whole: the nebula band along the
  // horizon ahead first, the spiral galaxy and the Milky Way as the band nears its full height.
  const RIFT_PICTURES = [
    { az: 0.85, el: -0.06, size: 0.12, tilt: 0.22, wide: 5, pic: (G) => G.milky() },
    { az: 0.3, el: -0.02, size: 0.18, tilt: 0, pic: (G) => G.glow() },
    { az: 0.18, el: 0.01, size: 0.12, tilt: 0.04, wide: 3.6, pic: (G) => G.band() },
    { az: -0.32, el: 0.1, size: 0.14, tilt: -0.3, pic: (G) => G.spiral(0) },
    { az: -0.8, el: -0.13, size: 0.05, tilt: 0.3, pic: (G) => G.dwarf(0) },
    { az: -0.7, el: -0.19, size: 0.035, tilt: -0.4, pic: (G) => G.dwarf(1) },
    { az: 1.5, el: 0.08, size: 0.025, tilt: 0.8, pic: (G) => G.spiral(1) },
    { az: -1.4, el: -0.05, size: 0.022, tilt: -0.5, pic: (G) => G.spiral(1) },
    { az: 0.6, el: 0.14, size: 0.045, tilt: 0, pic: (G) => G.cluster() },
    { az: -0.1, el: -0.1, size: 0.035, tilt: 0, pic: (G) => G.knot() },
    { az: 1.2, el: 0.04, size: 0.03, tilt: 0, pic: (G) => G.knot() },
    // Brighter stars with halos, some with spikes.
    ...[[0.05, 0.07], [0.45, -0.12], [-0.55, 0.05], [1.0, -0.15], [-1.1, 0.12], [1.8, 0.02], [-1.8, -0.08], [2.6, 0.06], [-2.5, -0.03]].map(([az, el], i) => ({ az, el, size: (i % 3 === 0 ? 0.04 : 0.024), tilt: 0.2, pic: (G) => G.halo(i % 3 === 0 ? 2 + (i % 2) : i % 2) })),
  ];
  // A double rainbow: seven bands round a unit arc. Its local x runs down from the crown to the feet, so the beam's
  // fade, full at the crown, dissolves the feet; y runs across it. The bright one stands nearer the island and the
  // greater one beyond it is fainter with its colours turned round, red inside, as a real double rainbow's are.
  // How far behind the island's middle each stands (m), and its radius.
  const RAINBOW = { behind: 220, size: 430 }, INNER_RAINBOW = { behind: 90, size: 250 };
  const BANDS = ["#ff4d4d", "#ff9b3d", "#ffe34f", "#62e06c", "#4cb2ff", "#5d6cff", "#a66cff"];
  const bow = (bands, glass) => {
    const g = M.geometry(), SEGS = 64, W = 0.016;
    for (let b = 0; b < bands.length; b++) {
      const color = hexToRgb(bands[b]), r0 = 1 - (b + 1) * W, r1 = 1 - b * W, ids = [];
      for (let s = 0; s <= SEGS; s++) {
        const a = s / SEGS * Math.PI;
        ids.push([M.pushVert(g, 1 - r0 * Math.sin(a), r0 * Math.cos(a), 0), M.pushVert(g, 1 - r1 * Math.sin(a), r1 * Math.cos(a), 0)]);
      }
      for (let s = 0; s < SEGS; s++) M.face(g, [ids[s][0], ids[s][1], ids[s + 1][1], ids[s + 1][0]], color, { emissive: 1 });
    }
    g.glass = glass; g.lightBeam = 1.4; g.castShadow = false;
    return g;
  };
  const rainbow = M.cached(() => bow(BANDS, 0.34)), outerRainbow = M.cached(() => bow([...BANDS].reverse(), 0.24));

  // ---- Sunset cumulus --------------------------------------------------------------------------------------------
  // Fills a grid from ellipsoid lobes ([x, y, z, rx, ry, rz] in cells), chips cells at the skin and cuts a flat
  // base, and meshes it with a palette slot for every `band` cells up, so `sunset` can colour each face by height.
  const billow = (lobes, unit, band) => {
    let x0 = Infinity, x1 = -Infinity, y1 = -Infinity, z0 = Infinity, z1 = -Infinity;
    for (const [x, y, z, rx, ry, rz] of lobes) {
      x0 = Math.min(x0, x - rx); x1 = Math.max(x1, x + rx); y1 = Math.max(y1, y + ry); z0 = Math.min(z0, z - rz); z1 = Math.max(z1, z + rz);
    }
    const ox = Math.floor(x0) - 1, oz = Math.floor(z0) - 1, sx = Math.ceil(x1) - ox + 2, sy = Math.ceil(y1) + 2, sz = Math.ceil(z1) - oz + 2;
    const field = new Float32Array(sx * sy * sz), grid = BL.terrain.makeGrid(sx, sy, sz);
    for (const [lx, ly, lz, rx, ry, rz] of lobes) {
      for (let x = Math.max(0, Math.floor(lx - rx - ox)); x <= Math.min(sx - 1, Math.ceil(lx + rx - ox)); x++)
        for (let y = Math.max(0, Math.floor(ly - ry)); y <= Math.min(sy - 1, Math.ceil(ly + ry)); y++)
          for (let z = Math.max(0, Math.floor(lz - rz - oz)); z <= Math.min(sz - 1, Math.ceil(lz + rz - oz)); z++) {
            const dx = (x + ox + 0.5 - lx) / rx, dy = (y + 0.5 - ly) / ry, dz = (z + oz + 0.5 - lz) / rz, k = 1 - dx * dx - dy * dy - dz * dz, i = grid.index(x, y, z);
            if (k > field[i]) field[i] = k;
          }
    }
    for (let x = 0; x < sx; x++) for (let y = 1; y < sy; y++) for (let z = 0; z < sz; z++) {
      const k = field[grid.index(x, y, z)];
      if (k <= 0 || (k < 0.1 && hash(x, y, z) < 0.3)) continue;
      grid.set(x, y, z, 1 + Math.min(14, Math.floor(y / band)));
    }
    const palette = [null];
    for (let n = 0; n < 15; n++) palette.push([255, 255, 255]);
    const geo = BL.terrain.gridGeometry(grid, { unit, palette, origin: { x: ox * unit, y: -unit, z: oz * unit } });
    geo.castShadow = false;
    geo.cutawayPreserve = true;
    return { geo, height: y1 * unit };
  };
  // A low sun's inks for a cloud: under its base, through its middle, on its tops, where a face turns to the sun and
  // where it turns away. Amber Spires' are a sunset's; Flipside's eyewall is storm cloud lit by the rising sun.
  const SUNSET = { dusk: hexToRgb("#7a6a9a"), rose: hexToRgb("#f2a487"), cream: hexToRgb("#fff0cf"), gold: hexToRgb("#ffb347"), lilac: hexToRgb("#9d8cd4") };
  // How much of the distance haze the eyewall takes off itself, standing a kilometre off.
  const EYE_PIERCE = 0.7;
  const EYEWALL = { dusk: hexToRgb("#1c2231"), rose: hexToRgb("#3f4862"), cream: hexToRgb("#98a2b8"), gold: hexToRgb("#ffa44e"), lilac: hexToRgb("#262b42") };
  // Colours a cloud's faces for a low sun from the horizontal `sunX`, `sunZ` (null on a cloud that turns) in `inks`:
  // cream on the tops, gold where a face turns to the sun, lilac where it turns away, rose through the middle and dusk
  // under the base, `warm` scaling the gold. The sunlit upper faces glow a little for the bloom.
  const sunset = (geo, height, sunX, sunZ, warm = 1, inks = SUNSET) => {
    const { dusk: DUSK, rose: ROSE, cream: CREAM, gold: GOLD, lilac: LILAC } = inks;
    const v = geo.verts, normals = [];
    let flip = 1, highest = -Infinity;
    for (const f of geo.faces) {
      let nx = 0, ny = 0, nz = 0, cy = 0;
      for (let k = 0; k < f.i.length; k++) {
        const a = f.i[k] * 3, b = f.i[(k + 1) % f.i.length] * 3;
        nx += (v[a + 1] - v[b + 1]) * (v[a + 2] + v[b + 2]); ny += (v[a + 2] - v[b + 2]) * (v[a] + v[b]); nz += (v[a] - v[b]) * (v[a + 1] + v[b + 1]);
        cy += v[a + 1] / f.i.length;
      }
      const l = Math.hypot(nx, ny, nz) || 1;
      normals.push(nx / l, ny / l, nz / l, cy);
      if (cy > highest && Math.abs(ny) > 0.5 * l) { highest = cy; flip = ny > 0 ? 1 : -1; }
    }
    geo.faces.forEach((f, n) => {
      const nx = normals[n * 4] * flip, ny = normals[n * 4 + 1] * flip, nz = normals[n * 4 + 2] * flip, t = Math.max(0, Math.min(1, normals[n * 4 + 3] / height));
      let col = t < 0.5 ? mix(DUSK, ROSE, smooth(0, 0.5, t)) : mix(ROSE, CREAM, smooth(0.5, 1, t));
      const facing = sunX === null ? 0 : nx * sunX + nz * sunZ;
      if (ny > 0.5) col = mix(col, CREAM, 0.45);
      else if (ny < -0.5) col = mix(col, DUSK, 0.6);
      else if (facing > 0) col = mix(col, GOLD, facing * (0.45 + 0.45 * t) * warm);
      else col = mix(col, LILAC, -facing * 0.5);
      f.color = col;
      f.emissive = ny < -0.5 ? 0 : 0.08 + (0.1 + Math.max(0, facing) * 0.3) * t * t * warm + (ny > 0.5 ? 0.12 * t : 0);
    });
  };
  // A towering cumulus five metres a cell: billows stacked up a leaning axis, narrowing as they climb, each with a
  // few smaller billows round it, under an anvil spread across the top (or, on variant 1, a rounded crown).
  const SPIRE_CELL = 5;
  // Every Amber Spires tower stands at one scale, so their blocks match and the near ones tower over the course.
  const SPIRE_SCALE = 1.3;
  // Its young towers: how far off the course they stand (least and spread), and in seconds from the Play press: how
  // long after one the next starts, how far apart a tower's billows start to puff up the column and how long each
  // takes, and when its top starts to spread out over it and how long that takes.
  const YOUNG = { across: [220, 50], every: 2.5, gap: 1.4, puff: 3.5, top: 12, spread: 5 };
  // A tower's lobes in cells ([x, y, z, rx, ry, rz]): its column's nine billows, each followed by its three small
  // ones, then its anvil or crown.
  const spireLobes = (v) => {
    const rand = mulberry32(431 + v * 19), height = 32 + v * 5 + rand() * 6, base = 8 + rand() * 3, lean = (rand() - 0.5) * 0.3, lobes = [];
    for (let k = 0; k < 9; k++) {
      const f = k / 8, y = 2 + f * height * 0.82, r = base * (1 - 0.42 * f) * (0.88 + rand() * 0.24), lx = lean * f * height, lz = lean * 0.4 * f * height;
      lobes.push([lx, y, lz, r, r * 0.8, r]);
      for (let s = 0; s < 3; s++) {
        const a = rand() * TAU, o = r * 0.68;
        lobes.push([lx + Math.cos(a) * o, y + (rand() - 0.3) * r * 0.5, lz + Math.sin(a) * o, r * 0.55, r * 0.5, r * 0.55]);
      }
    }
    const tx = lean * height * 0.95, tz = lean * 0.38 * height;
    if (v === 1) lobes.push([tx, height * 0.9, tz, base * 0.62, base * 0.55, base * 0.62]);
    else {
      lobes.push([tx, height * 0.88, tz, base * 1.75, 2.6, base * 1.4]);
      for (let s = 0; s < 5; s++) { const a = s / 5 * TAU + rand(); lobes.push([tx + Math.cos(a) * base, height * 0.9, tz + Math.sin(a) * base * 0.8, base * 0.55, 2.2, base * 0.5]); }
    }
    return lobes;
  };
  const spireCache = M.scopedMap(), pieceCache = M.scopedMap();
  const spire = (v, sunX, sunZ, inks = SUNSET) => {
    const key = `${v}:${sunX.toFixed(3)}:${sunZ.toFixed(3)}:${inks === SUNSET ? "" : "eye"}`;
    if (spireCache.has(key)) return spireCache.get(key);
    const { geo, height: h } = billow(spireLobes(v), SPIRE_CELL, 3);
    sunset(geo, h, sunX, sunZ, 1, inks);
    if (inks === EYEWALL) geo.fogPierce = EYE_PIERCE;
    spireCache.set(key, geo);
    return geo;
  };
  // The same tower in pieces to grow it: each column billow with its small ones, then its top, each a mesh centred on
  // its billow and coloured for its place in the whole tower, with where it stands in the tower (`x`, `y`, `z`) and
  // how far below that it starts (`rise`).
  const spirePieces = (v, sunX, sunZ) => {
    const key = `${v}:${sunX.toFixed(3)}:${sunZ.toFixed(3)}`;
    if (pieceCache.has(key)) return pieceCache.get(key);
    const lobes = spireLobes(v), pieces = [];
    let height = 0;
    for (const lobe of lobes) height = Math.max(height, (lobe[1] + lobe[4]) * SPIRE_CELL);
    for (let at = 0; at < lobes.length; at += 4) {
      const part = at < 36 ? lobes.slice(at, at + 4) : lobes.slice(at), [lx, ly, lz, , ry] = part[0], { geo } = billow(part, SPIRE_CELL, 3);
      sunset(geo, height, sunX, sunZ);
      // A cell's centre stands a cell lower in metres than in the lobes' cells (`billow`'s origin).
      const x = lx * SPIRE_CELL, y = (ly - 1) * SPIRE_CELL, z = lz * SPIRE_CELL;
      pieces.push({ geo: M.moved(geo, -x, -y, -z), x, y, z, rise: ry * SPIRE_CELL * 0.9 });
      if (at >= 36) break;
    }
    pieceCache.set(key, pieces);
    return pieces;
  };
  // A long low bank for the horizon, six metres a cell, its long side down x; `warm` is how squarely it faces the sun.
  // Variants 4 to 7 are the same banks in the eyewall's inks.
  const bank = M.variants((i) => {
    const v = i % 2, rand = mulberry32(611 + v * 23), L = 46 + v * 10, lobes = [];
    for (let k = 0; k < 14; k++) {
      const r = 4 + rand() * 3.5, ry = r * 0.6;
      lobes.push([(k / 13 - 0.5) * L, 1 + ry * 0.6, (rand() - 0.5) * 6, r * 1.3, ry, r]);
    }
    const { geo, height } = billow(lobes, 6, 2);
    sunset(geo, height, null, null, i % 4 < 2 ? 1 : 0.35, i < 4 ? SUNSET : EYEWALL);
    if (i >= 4) geo.fogPierce = EYE_PIERCE;
    return geo;
  });
  // A paper sky lantern a metre tall, lit from a flame at its open foot.
  const lantern = M.cached(() => {
    const paper = M.lathe({ profile: [[0.3, 0.05], [0.42, 0.3], [0.46, 0.7], [0.36, 1.0], [0, 1.04]], segments: 6, color: (t) => t < 0.34 ? "#ffe08a" : t < 0.67 ? "#ffc060" : "#ffa04a", emissive: 1 });
    const flame = M.box({ w: 0.16, h: 0.2, d: 0.16, color: "#fff2b0", emissive: 1, offset: { y: 0.12 } });
    const g = M.merge(paper, flame);
    g.castShadow = false;
    return g;
  });
  const goose = M.cached(() => {
    const g = BL.dressing.set().put("gull", 0, 0, 0).build().solid;
    g.castShadow = false;
    return g;
  });

  // ---- The aurora and the night --------------------------------------------------------------------------------
  // One ray of a curtain: a pixel column standing on the curtain's lower edge, a vertical sheet with its local x
  // running up it from 0 (the edge) to 1 and z across it, in hard bands of colour as pixel art draws it (`RAY_ROWS`
  // where each band starts), coloured as a real aurora is: brightest and sharpest at its lower edge, then green
  // fading through teal as it rises into the faint violet and red of its top, which the beam fades out up x. It shows
  // through any haze, as something a hundred kilometres up does.
  const RAY_INKS = ["#e8ffc8", "#9dff8c", "#55f07a", "#2fd370", "#24ae7a", "#3b8790", "#6c5c9c", "#a4467e"];
  const RAY_ROWS = [0, 0.02, 0.08, 0.2, 0.36, 0.52, 0.68, 0.84, 1];
  // Under a curtain's lower edge, its local x running down from it: a thin pink fringe, then a soft green glow on the
  // sky fading down.
  const SKIRT_INKS = ["#ff74b8", "#62e08c", "#45c27a", "#2e9c6c"];
  const SKIRT_ROWS = [0, 0.12, 0.35, 0.68, 1];
  const column = (inks, rows, glass, beam) => {
    const g = M.geometry(), rgb = inks.map(hexToRgb), ids = [];
    // Each band in two, its upper half a step toward the next band's ink, for a finer grain.
    for (let r = 0; r < rows.length; r++) {
      ids.push([M.pushVert(g, rows[r], 0, -0.5), M.pushVert(g, rows[r], 0, 0.5)]);
      if (r < rgb.length) { const m = (rows[r] + rows[r + 1]) / 2; ids.push([M.pushVert(g, m, 0, -0.5), M.pushVert(g, m, 0, 0.5)]); }
    }
    for (let r = 0; r < rgb.length * 2; r++) {
      const ink = r % 2 ? mix(rgb[r >> 1], rgb[Math.min(rgb.length - 1, (r >> 1) + 1)], 0.5) : rgb[r >> 1];
      M.face(g, [ids[r][0], ids[r][1], ids[r + 1][1], ids[r + 1][0]], ink, { emissive: 1 });
    }
    // Two-sided, as Canvas 2D would otherwise drop whichever face a column turns from the eye.
    g.glass = glass; g.lightBeam = beam; g.castShadow = false; g.fogPierce = 1; g.twoSided = true;
    return g;
  };
  const ray = M.cached(() => column(RAY_INKS, RAY_ROWS, 0.5, 1.35));
  const skirt = M.cached(() => column(SKIRT_INKS, SKIRT_ROWS, 0.3, 1));
  // A crystal shard from the origin, `len` along its axis leaned `tilt` from upright toward the bearing `lean`: a six-
  // sided prism to a point, its facets alternately light and dark and glowing brighter toward the tip, in `inks`
  // [deep, body, light, tip].
  const shard = (len, r, inks, tilt, lean, x, y, z) => {
    const deep = hexToRgb(inks[0]);
    const geo = M.lathe({ profile: [[r * 0.75, 0], [r, len * 0.12], [r * 0.95, len * 0.7], [r * 0.4, len * 0.9], [0, len]], segments: 6,
      color: (t) => inks[Math.min(3, Math.floor(t * 4))] });
    geo.faces.forEach((f, n) => { if (n % 2) f.color = mix(f.color, deep, 0.35); f.emissive = 0.55 + 0.15 * Math.floor(n / 6); });
    return M.moved(M.turnedY(M.turnedZ(geo, tilt), Math.PI - lean), x, y, z);
  };
  // Teal, violet, mint and rose.
  const CRYSTAL_INKS = [["#0c6f78", "#22c7bb", "#8ff4ea", "#e6fffc"], ["#40268a", "#7c52e6", "#bf9fff", "#f1e8ff"],
    ["#176e45", "#3fd98d", "#a8ffd0", "#effff5"], ["#7a1f5c", "#e05aa8", "#ffa8d8", "#fff0f8"]];
  // A cluster grown from a dark rock: a tall shard in the middle and a ring of shorter ones leaning out, now and then
  // one of the next colour. Variants 0-3 are the great floating ones, 4-7 small ones for the isles.
  const cluster = M.variants((i) => {
    const v = i % 4, small = i >= 4, rand = mulberry32(5150 + i * 31), inks = CRYSTAL_INKS[v];
    const parts = [M.lathe({ profile: [[0, -1.1], [0.7, -0.85], [1.15, -0.35], [1.0, 0.05], [0.55, 0.22], [0, 0.26]], segments: 7,
      color: (t) => t < 0.5 ? "#2b2735" : "#3a3546" })];
    parts.push(shard(small ? 2.2 : 3.6, small ? 0.38 : 0.58, inks, (rand() - 0.5) * 0.2, rand() * TAU, 0, 0.1, 0));
    for (let k = 0, n = small ? 4 : 7; k < n; k++) {
      const a = k / n * TAU + rand() * 0.6, d = 0.35 + rand() * 0.4;
      parts.push(shard((small ? 0.9 : 1.3) + rand() * (small ? 1 : 1.6), (small ? 0.18 : 0.24) + rand() * 0.14, CRYSTAL_INKS[(v + (rand() < 0.25 ? 1 : 0)) % 4],
        0.45 + rand() * 0.5, a, Math.cos(a) * d, 0.05, Math.sin(a) * d));
    }
    const g = M.merge(...parts);
    g.castShadow = false;
    return g;
  });
  // Six small shards on a ring round a great crystal, which turns them about it.
  const orbit = M.variants((v) => {
    const rand = mulberry32(6262 + v), parts = [];
    for (let k = 0; k < 6; k++) {
      const a = k / 6 * TAU + rand() * 0.4;
      parts.push(shard(0.6 + rand() * 0.4, 0.12, CRYSTAL_INKS[v], rand() * Math.PI, rand() * TAU, Math.cos(a) * 2.8, (rand() - 0.5) * 0.8, Math.sin(a) * 2.8));
    }
    const g = M.merge(...parts);
    g.castShadow = false;
    return g;
  });
  // A soft additive glow behind a great crystal, in its colour, turned to the eye every frame.
  const GLOWS = ["90,240,230", "170,130,255", "120,255,180", "255,120,200"];
  const glow = M.variants((v) => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 128;
    const paint = canvas.getContext("2d"), gradient = paint.createRadialGradient(64, 64, 0, 64, 64, 64);
    gradient.addColorStop(0, `rgba(${GLOWS[v]},0.55)`); gradient.addColorStop(0.4, `rgba(${GLOWS[v]},0.2)`); gradient.addColorStop(1, `rgba(${GLOWS[v]},0)`);
    paint.fillStyle = gradient; paint.fillRect(0, 0, 128, 128);
    const image = new Image();
    image.src = canvas.toDataURL("image/png");
    const g = M.panel({ tilesX: 1, tilesY: 1, color: "#000000" });
    g.castShadow = false; g.cutawayPreserve = true;
    g.imageSurface = { asset: { width: 128, height: 128, load: () => image }, rect: [-0.5, -0.5, 1, 1], cutout: true, soft: true, blend: "add", bright: 0.25 };
    return g;
  });
  // A lighthouse's warm light far off in the haze, turned to the eye every frame: it falls away smoothly to nothing
  // well inside its square, so no edge of the picture shows even when a beam flares it.
  const hazeLight = M.cached(() => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 128;
    const paint = canvas.getContext("2d"), gradient = paint.createRadialGradient(64, 64, 0, 64, 64, 54);
    for (const [at, alpha] of [[0, 0.6], [0.2, 0.42], [0.45, 0.17], [0.7, 0.05], [1, 0]]) gradient.addColorStop(at, `rgba(255,226,160,${alpha})`);
    paint.fillStyle = gradient; paint.beginPath(); paint.arc(64, 64, 54, 0, TAU); paint.fill();
    const image = new Image();
    image.src = canvas.toDataURL("image/png");
    const g = M.panel({ tilesX: 1, tilesY: 1, color: "#000000" });
    g.castShadow = false; g.cutawayPreserve = true;
    g.imageSurface = { asset: { width: 128, height: 128, load: () => image }, rect: [-0.5, -0.5, 1, 1], cutout: true, soft: true, blend: "add", bright: 0.25 };
    return g;
  });
  // Glowing mushrooms, three to a clump: pale stems under caps glowing cyan (0) or pink (1), darker underneath.
  const MUSHROOM_INKS = [["#5ff5ff", "#2aa8c0"], ["#ff7ad9", "#c04a9a"]];
  const mushrooms = M.variants((v) => {
    const rand = mulberry32(777 + v), parts = [];
    for (let k = 0; k < 3; k++) {
      const m = 0.6 + rand() * 0.6, a = k / 3 * TAU + rand(), d = k ? 0.35 : 0, x = Math.cos(a) * d, z = Math.sin(a) * d;
      parts.push(M.moved(M.lathe({ profile: [[0.07 * m, 0], [0.06 * m, 0.5 * m], [0.08 * m, 0.6 * m]], segments: 6, color: "#e8e2d4", emissive: 0.25 }), x, 0, z));
      parts.push(M.moved(M.lathe({ profile: [[0.05 * m, 0.55 * m], [0.32 * m, 0.6 * m], [0.3 * m, 0.7 * m], [0.18 * m, 0.82 * m], [0, 0.86 * m]], segments: 8,
        color: (t) => t < 0.3 ? MUSHROOM_INKS[v][1] : MUSHROOM_INKS[v][0], emissive: 0.85 }), x, 0, z));
    }
    const g = M.merge(...parts);
    g.castShadow = false;
    return g;
  });
  // A standing stone with glowing runes cut through it.
  const runestone = M.cached(() => {
    const parts = [M.bevelBox({ w: 0.7, h: 2.2, d: 0.45, color: "#3a3646", offset: { y: 1.1 } })];
    for (let k = 0; k < 4; k++) {
      parts.push(M.box({ w: 0.36, h: 0.06, d: 0.47, color: "#7dfff0", emissive: 1, offset: { y: 0.5 + k * 0.38 } }));
      parts.push(M.box({ w: 0.06, h: 0.2, d: 0.47, color: "#7dfff0", emissive: 1, offset: { x: k % 2 ? 0.12 : -0.12, y: 0.62 + k * 0.38 } }));
    }
    const g = M.merge(...parts);
    g.castShadow = false;
    return g;
  });
  // A fall of light pouring off a night isle's rim: two crossed sheets, its local x down, fading as it falls.
  const lightFall = M.cached(() => {
    const g = M.geometry(), ink = hexToRgb("#7dffe0");
    for (const plane of [0, 1]) {
      const at = (x, u) => M.pushVert(g, x, plane ? u : 0, plane ? 0 : u);
      M.face(g, [at(0, -0.5), at(0, 0.5), at(1, 0.5), at(1, -0.5)], ink, { emissive: 0.9 });
    }
    g.glass = 0.32; g.lightBeam = 1; g.castShadow = false;
    return g;
  });
  const firefly = M.cached(() => {
    const g = M.box({ w: 1, h: 1, d: 1, color: "#e8ff9a", emissive: 1 });
    g.castShadow = false;
    return g;
  });
  // A shooting star: a streak from its head (0) back along x to a fading tail (1), narrowing as it goes.
  const streak = M.cached(() => {
    const g = M.geometry(), inks = ["#ffffff", "#e6f3ff", "#b8dcff"].map(hexToRgb), ids = [];
    for (let r = 0; r <= inks.length; r++) { const x = r / inks.length, w = 0.5 * (1 - 0.75 * x); ids.push([M.pushVert(g, x, 0, -w), M.pushVert(g, x, 0, w)]); }
    for (let r = 0; r < inks.length; r++) M.face(g, [ids[r][0], ids[r][1], ids[r + 1][1], ids[r + 1][0]], inks[r], { emissive: 1 });
    g.glass = 0.95; g.lightBeam = 1; g.castShadow = false;
    return g;
  });
  // ---- The storm ------------------------------------------------------------------------------------------------
  // Greys a sampled sky for a storm, once as the hub samples it: its colours toward a cold grey by `storm`, the sun
  // and its direct light cut.
  const grade = (opts, storm) => {
    const grey = (rgb) => {
      const l = rgb[0] * 0.3 + rgb[1] * 0.55 + rgb[2] * 0.15;
      rgb[0] += (l * 0.62 - rgb[0]) * storm; rgb[1] += (l * 0.68 - rgb[1]) * storm; rgb[2] += (l * 0.8 - rgb[2]) * storm;
    };
    grey(opts.horizon); grey(opts.zenith); grey(opts.clear); grey(opts.sky); grey(opts.ground);
    opts.directStrength *= 1 - 0.75 * storm;
    for (let i = 0; i < 3; i++) opts.sun[i] *= 1 - 0.85 * storm;
  };
  // A lightning flash lifts the sky and the haze for a frame, `level` 0 to 1; the hub's next restore takes it off.
  const flashSky = (opts, level) => {
    for (let i = 0; i < 3; i++) {
      opts.horizon[i] = Math.min(1, opts.horizon[i] + level * 0.35); opts.zenith[i] = Math.min(1, opts.zenith[i] + level * 0.25);
      opts.clear[i] = Math.min(1, opts.clear[i] + level * 0.35); opts.sky[i] = Math.min(1, opts.sky[i] + level * 0.3);
      opts.ground[i] = Math.min(1, opts.ground[i] + level * 0.15);
    }
  };
  // The flash strobes twice, then decays: full, a dip, a second bright, the tail (weather.js's own envelope).
  const flashAt = (t) => t < 0.08 ? 1 : t < 0.14 ? 0.25 : t < 0.22 ? 0.85 : 0.85 * Math.exp(-(t - 0.22) / 0.12);
  // A bolt, unit height from its top (y 1) down to its foot (0): a jagged trunk with forks, two crossed ribbons so
  // it reads from any side, one shape a variant; it shows through most of the haze.
  const bolt = M.variants((v) => {
    const g = M.geometry(), rand = mulberry32(4242 + v * 131), ink = hexToRgb("#f2ecff"), lit = { emissive: 1 }, w = 0.007;
    const segment = (x0, y0, x1, y1, width) => {
      const a = M.pushVert(g, x0 - width, y0, 0), b = M.pushVert(g, x0 + width, y0, 0), c = M.pushVert(g, x1 + width, y1, 0), d = M.pushVert(g, x1 - width, y1, 0);
      const e = M.pushVert(g, x0, y0, -width), f = M.pushVert(g, x0, y0, width), h = M.pushVert(g, x1, y1, width), k = M.pushVert(g, x1, y1, -width);
      M.face(g, [a, b, c, d], ink, lit); M.face(g, [e, f, h, k], ink, lit);
    };
    let x = 0, y = 1;
    while (y > 0) {
      const nx = x + (rand() - 0.5) * 0.08, ny = y - 0.03 - rand() * 0.04;
      segment(x, y, nx, Math.max(0, ny), w);
      if (rand() < 0.22) {
        const bx = nx + (rand() - 0.5) * 0.16, by = ny - 0.06 - rand() * 0.05;
        segment(nx, ny, bx, by, w * 0.55);
        if (rand() < 0.5) segment(bx, by, bx + (rand() - 0.5) * 0.08, by - 0.05, w * 0.35);
      }
      x = nx; y = ny;
    }
    g.castShadow = false; g.fogPierce = 0.8;
    return g;
  });
  // A lighthouse in metres up from its foot: a stone plinth, a tapering tower banded white and Bitcoin orange, the
  // gallery's deck and rail, the lantern's glowing lamp, its mullions and a dark cap. `LAMP_Y` is the lamp's middle.
  const LAMP_Y = 12.6, TOWER_BANDS = 6, TOWER_INKS = ["#f2eee4", "#f7931a"], IRON = "#2b2a30";
  const lighthouse = M.cached(() => {
    const profile = [];
    for (let b = 0; b <= TOWER_BANDS; b++) profile.push([1.55 - 0.5 * b / TOWER_BANDS, 0.8 + 10.8 * b / TOWER_BANDS]);
    const parts = [
      M.lathe({ profile: [[2.3, -1.2], [2.3, 0.5], [1.95, 0.8], [0, 0.8]], segments: 12, color: "#5a5860" }),
      M.lathe({ profile, segments: 12, color: (t) => TOWER_INKS[Math.round(t * TOWER_BANDS) % 2] }),
      M.lathe({ profile: [[1.05, 11.6], [1.75, 11.6], [1.75, 11.85], [0, 11.85]], segments: 12, color: IRON }),
      M.lathe({ profile: [[1.7, 12.5], [1.7, 12.62]], segments: 12, color: IRON }),
      M.lathe({ profile: [[1.0, 13.4], [1.05, 13.55], [0.85, 14.0], [0.45, 14.4], [0.12, 14.65], [0, 14.7]], segments: 12, color: "#3b2a2a" }),
      M.lathe({ profile: [[0, 14.7], [0.16, 14.8], [0.16, 15.1], [0, 15.2]], segments: 6, color: IRON }),
      M.lathe({ profile: [[0.82, 11.85], [0.82, 13.4], [0, 13.4]], segments: 8, color: "#fff1c2", emissive: 1 })
    ];
    for (let k = 0; k < 8; k++) {
      const a = k / 8 * TAU, b = a + TAU / 16;
      parts.push(M.box({ w: 0.08, h: 0.7, d: 0.08, color: IRON, offset: { x: Math.cos(a) * 1.68, y: 12.2, z: Math.sin(a) * 1.68 } }));
      parts.push(M.box({ w: 0.1, h: 1.55, d: 0.1, color: IRON, offset: { x: Math.cos(b) * 0.9, y: 12.62, z: Math.sin(b) * 0.9 } }));
    }
    const g = M.merge(...parts);
    g.castShadow = false;
    return g;
  });
  // A lighthouse's beam along +x from the lamp (0) to its end (1), widening as it goes, in rings so Canvas 2D fades
  // it too.
  const beam = M.cached(() => {
    const g = M.geometry(), ink = hexToRgb("#fff3cf"), lit = { emissive: 1 }, RINGS = 8, SIDES = 8, rings = [];
    for (let k = 0; k <= RINGS; k++) {
      const x = k / RINGS, r = 0.03 + 0.47 * x, ring = [];
      for (let s = 0; s < SIDES; s++) ring.push(M.pushVert(g, x, Math.cos(s / SIDES * TAU) * r, Math.sin(s / SIDES * TAU) * r));
      rings.push(ring);
    }
    for (let k = 0; k < RINGS; k++) for (let s = 0; s < SIDES; s++) M.face(g, [rings[k][s], rings[k + 1][s], rings[k + 1][(s + 1) % SIDES], rings[k][(s + 1) % SIDES]], ink, lit);
    g.glass = 0.3; g.lightBeam = 1; g.castShadow = false;
    return g;
  });

  // How near (x, z) comes to any cloud's footprint over its whole lane, less that cloud's reach.
  const clearOf = (course, x, z, radius) => {
    for (const c of course.clouds) {
      const ex = c.moveX * c.moveRange, ez = c.moveZ * c.moveRange, dx = x - c.baseX, dz = z - c.baseZ;
      const along = Math.max(-1, Math.min(1, (dx * ex + dz * ez) / Math.max(1e-9, ex * ex + ez * ez)));
      if (Math.hypot(dx - ex * along, dz - ez * along) < radius + Math.max(c.rx, c.rz) + GAP) return false;
    }
    return true;
  };
  // An instanced batch of `count` copies of `geometry`, written in place by the caller (one draw). Each instance's
  // glow (its 17th float) is 1, so emissive faces light as they do on an ordinary node.
  const batch = (geometry, count) => {
    const data = new Float32Array(count * 20);
    for (let o = 16; o < data.length; o += 20) data[o] = 1;
    return createNode({ geometry, instanceData: data, instanceCount: count, instanceVersion: 0, fixedInstanceCapacity: true, sightHidden: true });
  };
  // Writes an instance's matrix from its three axes (scaled) and its position.
  const write = (d, o, ax, ay, az, bx, by, bz, cx, cy, cz, x, y, z) => {
    d[o] = ax; d[o + 1] = ay; d[o + 2] = az; d[o + 3] = 0;
    d[o + 4] = bx; d[o + 5] = by; d[o + 6] = bz; d[o + 7] = 0;
    d[o + 8] = cx; d[o + 9] = cy; d[o + 10] = cz; d[o + 11] = 0;
    d[o + 12] = x; d[o + 13] = y; d[o + 14] = z; d[o + 15] = 1;
  };
  const yawed = (d, o, yaw, sx, sy, sz, x, y, z) => {
    const c = Math.cos(yaw), s = Math.sin(yaw);
    write(d, o, c * sx, 0, -s * sx, 0, sy, 0, s * sz, 0, c * sz, x, y, z);
  };

  // `onStrike(distance)` hears each lightning strike, for its thunder.
  const create = ({ root, renderer, seaY, onStrike = null }) => {
    const lite = renderer?.kind === "canvas2d";
    const scenery = createNode({ visible: false, sightHidden: true });
    addChild(root, scenery);
    // Flipside's lagoon starts painting in idle moments now, well before its level is opened.
    if (LAGOON && !lite) lagoonStart();
    // What moves, set by `build`: each a function of the scenery's clock, the frame's dt and the camera.
    const movers = [];
    // The two balloons and their passengers, built once and stood again on each Floating Isles run.
    const balloons = [];
    // `flash` is the storm's lightning this frame, 0 to 1, which the hub lifts the sky by.
    let time = 0, reach = 0, flash = 0, runProgress = 0;
    const node = (geometry, x, y, z, s = 1, parent = scenery) => {
      const n = createNode({ geometry, position: { x, y, z }, scale: { x: s, y: s, z: s }, sightHidden: true });
      addChild(parent, n);
      return n;
    };
    const reached = (x, y, z, size) => {
      const start = route.start;
      reach = Math.max(reach, Math.hypot(x - start.x, y - start.y, z - start.z) + size);
    };
    // The route from the finish (t = 0) out to the start (t = 1): where a point `across` it stands and how high the
    // course runs there.
    const route = { start: null, finish: null, length: 0, nx: 0, nz: 0, sideX: 0, sideZ: 0, ahead: 0 };
    const POINT = { x: 0, z: 0 };
    const at = (t, across) => {
      const along = SHORE + (route.length - SHORE) * t;
      POINT.x = route.finish.x + route.nx * along + route.sideX * across;
      POINT.z = route.finish.z + route.nz * along + route.sideZ * across;
      return POINT;
    };
    const routeY = (t) => route.finish.y + 18 + (route.start.y - route.finish.y - 18) * t;
    // Steps a point at `t` out across the route until it clears every lane by GAP; null when it cannot.
    const place = (course, t, across, radius) => {
      const side = Math.sign(across) || 1;
      for (let tries = 0; tries <= TRIES; tries++, across += side * STEP) {
        const p = at(t, across);
        if (clearOf(course, p.x, p.z, radius)) return p;
      }
      return null;
    };

    // Stands an isle, its rim facing a random way, and returns its node.
    const standIsle = (shape, x, y, z, s, spin) => {
      const base = node(shape.geometry, x, y, z, s);
      base.rotation.y = spin;
      if (shape.fall) {
        // Its fall flows as the Mempool rainforest's do: the lake's water runs down it from the lip, its texture laid
        // across it and down it in metres, from where this isle stands. Canvas 2D draws a face from one side only.
        const f = shape.fall, c = Math.cos(spin), n = Math.sin(spin), ax = f.ux * c + f.uz * n, az = -f.ux * n + f.uz * c;
        const ox = x + (f.ox * c + f.oz * n) * s, oz = z + (-f.ox * n + f.oz * c) * s;
        const geometry = { ...f.geometry, lakeFlow: new Float32Array([ax, 0, az, -ax * ox - az * oz, 0, -1, 0, y + f.oy * s]) };
        if (lite) geometry.faces = [...f.geometry.faces, ...f.geometry.faces.map((face) => ({ ...face, i: [...face.i].reverse() }))];
        node(geometry, 0, 0, 0, 1, base);
      }
      for (const m of shape.mist) {
        const holder = node(null, m.x, m.y, m.z, 1, base);
        addChild(holder, BL.cloudHopperModels.cloud(m.size, m.size * 0.8, m.size * 0.7, "normal", spin));
      }
      reached(x, y, z, shape.radius * s);
      return base;
    };
    // How far an isle's rim reaches at world bearing `a`, in metres.
    const rimToward = (shape, base, a) => {
      const k = Math.round((a + base.rotation.y) / TAU * RIM_STEPS);
      return shape.rim[((k % RIM_STEPS) + RIM_STEPS) % RIM_STEPS] * base.scale.x;
    };
    const isles = (level, course, rand) => {
      for (let k = 0; k < 16; k++) {
        const t = (k + 0.5) / 16, side = k % 2 ? 1 : -1, far = k % 3 === 2, v = (k * 3 + 1) % 4, shape = isle(v);
        const s = far ? 1.7 + rand() * 0.8 : 0.9 + rand() * 0.5, y = routeY(t) - (far ? -10 + rand() * 25 : 14 + rand() * 26), spin = rand() * TAU;
        const p = place(course, t, side * (far ? 120 + rand() * 50 : 36 + rand() * 40), shape.radius * s);
        if (!p) continue;
        const x = p.x, z = p.z, base = standIsle(shape, x, y, z, s, spin);
        // Palms, a tree, bushes and, on the biggest, a hut, each standing on one of the isle's spots.
        shape.spots.forEach((spot, n) => {
          const geometry = v === 3 && n === 0 ? hut() : n % 3 === 0 ? BL.dressing.palm((k + n) % 3) : n % 3 === 1 ? BL.hubModels.tree((k + n) % 3) : BL.hubModels.bush((k + n) % 3);
          const size = v === 3 && n === 0 ? 0.8 : n % 3 === 0 ? 0.55 + rand() * 0.2 : n % 3 === 1 ? 0.32 + rand() * 0.08 : 0.5;
          node(geometry, spot.x, spot.y, spot.z, size, base).rotation.y = rand() * TAU;
        });
        // Every third near isle has a small one hung off it on a rope bridge, further out at the same height.
        if (k % 3 !== 1) continue;
        const small = isle(1), s2 = s * 0.7, a = Math.atan2(route.sideZ * side, route.sideX * side), spin2 = rand() * TAU;
        const gap = 12 + rand() * 6, out = shape.radius * s + gap + small.radius * s2;
        const qx = x + Math.cos(a) * out, qz = z + Math.sin(a) * out;
        if (!clearOf(course, qx, qz, small.radius * s2)) continue;
        const other = standIsle(small, qx, y, qz, s2, spin2);
        const ra = rimToward(shape, base, a) * 0.92, rb = rimToward(small, other, a + Math.PI) * 0.92;
        const ax = x + Math.cos(a) * ra, az = z + Math.sin(a) * ra, ay = y + shape.lip * s, bx = qx - Math.cos(a) * rb, bz = qz - Math.sin(a) * rb, by = y + small.lip * s2;
        const len = Math.hypot(bx - ax, by - ay, bz - az), span = node(bridge(), ax, ay, az, len);
        span.rotation.y = Math.atan2(-(bz - az), bx - ax); span.rotation.z = Math.asin((by - ay) / len);
      }
      // Two Ooga balloons drifting toward the island, bobbing, each with an Ooga in its basket.
      for (let n = 0; n < 2; n++) {
        if (!balloons[n]) {
          const holder = createNode({ geometry: balloon(n), sightHidden: true });
          // The passenger keeps an island Ooga's own size inside the scaled balloon.
          const passenger = BL.models.caveman(BL.contributors.traitsFor(`balloon-ooga-${n}`)), figure = passenger.root;
          figure.scale.x = figure.scale.y = figure.scale.z = 1 / BALLOON_SCALE;
          // On the basket's floor, from the hip the build stands it at.
          figure.position.y = 0.5 + figure.scale.y * passenger.root.position.y; figure.rotation.y = n ? 0.4 : -0.3;
          passenger.parts.club.visible = false;
          passenger.parts.armR.rotation.x = -2.6;
          figure.sightHidden = true;
          addChild(holder, figure);
          balloons.push(holder);
        }
        const holder = balloons[n], t = n ? 0.68 : 0.28, side = n ? 1 : -1, p = place(course, t, side * (55 + rand() * 25), 8);
        if (!p) continue;
        const x0 = p.x, z0 = p.z, y0 = routeY(t) + (n ? -6 : 8), ph = rand() * TAU;
        holder.position.x = x0; holder.position.y = y0; holder.position.z = z0; holder.scale.x = holder.scale.y = holder.scale.z = BALLOON_SCALE;
        addChild(scenery, holder);
        reached(x0, y0, z0, 12);
        movers.push((time) => {
          holder.position.x = x0 - route.nx * time * 0.6; holder.position.z = z0 - route.nz * time * 0.6;
          holder.position.y = y0 + Math.sin(time * 0.35 + ph) * 1.2;
          holder.rotation.y = ph + time * 0.04; holder.rotation.z = Math.sin(time * 0.5 + ph) * 0.03;
        });
      }
      // The double rainbow, centred over the island beyond it as the course sees it, facing the course.
      const a = Math.atan2(-route.nz, -route.nx);
      for (const [geometry, { behind: r, size }] of [[outerRainbow(), RAINBOW], [rainbow(), INNER_RAINBOW]]) {
        const arc = node(geometry, route.finish.x + Math.cos(a) * r, seaY + size, route.finish.z + Math.sin(a) * r, size);
        arc.rotation.z = -Math.PI / 2; arc.rotation.y = Math.atan2(-Math.cos(a), -Math.sin(a));
        reached(arc.position.x, seaY + size, arc.position.z, size);
      }
      if (lite) return;
      // Gulls wheeling beside the route.
      for (const [t, across, seed] of [[0.35, -60, 3], [0.75, 55, 11]]) {
        const p = at(t, across), y = routeY(t), flock = BL.dressing.flock({ count: 12, cx: p.x, cz: p.z, radius: [16, 38], height: [y - 10, y + 10], seed, scale: 1.6 });
        addChild(scenery, flock.node);
        movers.push((time) => flock.update(time));
      }
    };

    const spires = (level, course, rand) => {
      const sun = sunAt(level.sky.hour), sl = Math.hypot(sun.x, sun.z) || 1, sunX = sun.x / sl, sunZ = sun.z / sl, { finish } = route;
      // Towers that grow from the Play press, starting at `at`: billow after billow puffs up out of the one below and
      // flows up the column, then the top spreads out over it. Each is its tower's pieces on nodes of its own, eased
      // into place until all have grown.
      const towers = [], from = new Float32Array(16), s = SPIRE_SCALE;
      let grownAt = 0, grown = false;
      const grow = (v, x, y, z, at) => {
        const tower = createNode({ position: { x, y, z }, scale: { x: s, y: s, z: s }, sightHidden: true });
        for (const piece of spirePieces(v, sunX, sunZ)) {
          renderer?.prepareGeometry(piece.geo);
          const n = createNode({ geometry: piece.geo, position: { x: piece.x, y: piece.y, z: piece.z }, visible: false, matrixCloud: true, sightHidden: true });
          n.piece = piece;
          addChild(tower, n);
        }
        from[towers.length] = at; grownAt = Math.max(grownAt, at + YOUNG.top + YOUNG.spread);
        towers.push(tower); addChild(scenery, tower);
      };
      // Far round the island, four of them growing too (standing grown on Canvas 2D).
      for (let k = 0; k < 10; k++) {
        const a = route.ahead + (k % 2 ? 1 : -1) * (0.15 + rand() * 1.2), r = 420 + rand() * 330;
        const x = finish.x + Math.cos(a) * r, z = finish.z + Math.sin(a) * r, y = seaY + 25 + rand() * 20;
        if (!lite && k % 5 % 2) grow(k % 3, x, y, z, 1.2 + 3 * towers.length);
        else node(spire(k % 3, sunX, sunZ), x, y, z, s).matrixCloud = true;
        reached(x, y + 230 * s, z, 110 * s);
      }
      // Banks round the horizon, gold where they face the sun and dusky where they do not.
      for (let k = 0; k < 12; k++) {
        const a = route.ahead + (k / 12) * TAU + (rand() - 0.5) * 0.3, r = 720 + rand() * 230, s = 0.9 + rand() * 0.3;
        const x = finish.x + Math.cos(a) * r, z = finish.z + Math.sin(a) * r, warm = Math.cos(a) * sunX + Math.sin(a) * sunZ > 0.2;
        const n = node(bank((warm ? 0 : 2) + (k % 2)), x, seaY + 8 + rand() * 30, z, s);
        n.matrixCloud = true; n.rotation.y = Math.atan2(-Math.cos(a), -Math.sin(a));
        reached(x, n.position.y, z, 180 * s);
      }
      if (lite) return;
      // Sky lanterns rising past the course on both sides, each fading in at the foot of its climb and out at the top.
      const N = 64, lanterns = batch(lantern(), N), d = lanterns.instanceData;
      const bx = new Float32Array(N), bz = new Float32Array(N), lo = new Float32Array(N), span = new Float32Array(N), y0 = new Float32Array(N), speed = new Float32Array(N), ph = new Float32Array(N), sc = new Float32Array(N);
      for (let i = 0; i < N; i++) {
        const t = rand(), p = place(course, t, (rand() < 0.5 ? -1 : 1) * (22 + rand() * 110), 6) || at(t, 200);
        bx[i] = p.x; bz[i] = p.z; lo[i] = routeY(t) - 140; span[i] = 190; y0[i] = rand() * 190;
        speed[i] = 0.9 + rand() * 1.1; ph[i] = rand() * TAU; sc[i] = 2.2 + rand() * 1.1;
      }
      addChild(scenery, lanterns);
      movers.push((time) => {
        for (let i = 0; i < N; i++) {
          const climb = (y0[i] + time * speed[i]) % span[i], k = sc[i] * Math.min(1, climb / 15, (span[i] - climb) / 15);
          yawed(d, i * 20, ph[i] + time * 0.2, k, k, k, bx[i] + Math.sin(time * 0.3 + ph[i]) * 3, lo[i] + climb, bz[i] + Math.cos(time * 0.25 + ph[i]) * 3);
        }
        lanterns.instanceVersion++;
      });
      // Geese in a V on a wide circle round the island, a little above the course's middle.
      const G = 11, geese = batch(goose(), G), g = geese.instanceData, R = 300, h = routeY(0.55) + 25, w = 9 / R, a0 = rand() * TAU;
      addChild(scenery, geese);
      movers.push((time) => {
        const a = a0 + time * w, cx = finish.x + Math.cos(a) * R, cz = finish.z + Math.sin(a) * R, tx = -Math.sin(a), tz = Math.cos(a), yaw = Math.atan2(tx, tz);
        for (let i = 0; i < G; i++) {
          const rank = Math.ceil(i / 2), side = i % 2 ? 1 : -1, flap = 0.35 + Math.abs(Math.sin(time * 5.5 + i * 0.7)) * 1.4;
          yawed(g, i * 20, yaw, 1.8, 1.8 * flap, 1.8, cx - tx * rank * 4.5 - tz * side * rank * 3.2, h + rank * 0.3, cz - tz * rank * 4.5 + tx * side * rank * 3.2);
        }
        geese.instanceVersion++;
      });
      // Young towers off to the sides of the course, nearer than the rest, growing one after another down it (`YOUNG`).
      for (let k = 0; k < 6; k++) {
        const p = place(course, 0.92 - 0.13 * k, (k % 2 ? 1 : -1) * (YOUNG.across[0] + rand() * YOUNG.across[1]), 100 * s);
        if (!p) continue;
        const x = p.x, z = p.z, y = seaY + 20 + rand() * 15;
        grow(k % 3, x, y, z, k * YOUNG.every);
        reached(x, y + 250 * s, z, 100 * s);
      }
      movers.push((time) => {
        if (grown) return;
        for (let i = 0; i < towers.length; i++) {
          const nodes = towers[i].children, age = time - from[i];
          for (let n = 0; n < nodes.length; n++) {
            const node = nodes[n], top = n === nodes.length - 1;
            const p = Math.max(0, Math.min(1, (age - (top ? YOUNG.top : n * YOUNG.gap)) / (top ? YOUNG.spread : YOUNG.puff))), e = 1 - (1 - p) ** 3;
            node.visible = e > 0.02;
            node.scale.x = node.scale.y = node.scale.z = e;
            node.position.y = node.piece.y - (1 - e) * node.piece.rise;
          }
        }
        grown = time >= grownAt;
      });
    };

    const aurora = (level, course, rand) => {
      const tier = lite ? 0 : renderer.quality === "low" ? 0.5 : renderer.quality === "medium" ? 0.75 : 1;
      // Dark isles growing glowing crystals: clusters, glowing mushrooms and rune stones on their spots, crystals
      // hanging from their keels, a fall of light off every third one's rim, and fireflies drifting round them all.
      const isles = [];
      for (let k = 0; k < 10; k++) {
        const t = (k + 0.5) / 10, side = k % 2 ? 1 : -1, far = k % 3 === 2, shape = isle((k * 3 + 1) % 4 + 4);
        const s = far ? 1.6 + rand() * 0.7 : 0.9 + rand() * 0.4, y = routeY(t) - (far ? -10 + rand() * 25 : 16 + rand() * 24), spin = rand() * TAU;
        const p = place(course, t, side * (far ? 120 + rand() * 50 : 40 + rand() * 40), shape.radius * s);
        if (!p) continue;
        const x = p.x, z = p.z, base = standIsle(shape, x, y, z, s, spin);
        isles.push(x, y, z);
        shape.spots.forEach((spot, n) => {
          const what = n % 3, piece = node(what === 0 ? cluster(4 + (k + n) % 4) : what === 1 ? mushrooms((k + n) % 2) : runestone(),
            spot.x, spot.y, spot.z, what === 0 ? 0.8 + rand() * 0.35 : what === 1 ? 2 : 0.85, base);
          piece.rotation.y = rand() * TAU;
        });
        shape.hangs.forEach((hang, n) => {
          const piece = node(cluster(4 + (k + n + 1) % 4), hang.x, hang.y + 0.2, hang.z, 0.7 + rand() * 0.3, base);
          piece.rotation.x = Math.PI; piece.rotation.y = rand() * TAU;
        });
        if (k % 3 === 1) {
          const a = rand() * TAU, r = rimToward(shape, base, a) * 0.96, fall = node(lightFall(), x + Math.cos(a) * r, y + shape.lip * s, z + Math.sin(a) * r);
          fall.rotation.z = -Math.PI / 2; fall.scale.x = 26 + rand() * 18; fall.scale.y = fall.scale.z = 1.6 * s;
        }
      }
      if (!lite && isles.length) {
        const N = Math.round(90 * tier), flies = batch(firefly(), N), fd = flies.instanceData, at3 = Float32Array.from(isles), count = isles.length / 3;
        const home = new Uint8Array(N), radius = new Float32Array(N), speed = new Float32Array(N), lift = new Float32Array(N), phase = new Float32Array(N);
        for (let i = 0; i < N; i++) {
          home[i] = i % count; radius[i] = 3 + rand() * 9; speed[i] = (0.2 + rand() * 0.4) * (rand() < 0.5 ? -1 : 1); lift[i] = -2 + rand() * 8; phase[i] = rand() * TAU;
        }
        addChild(scenery, flies);
        movers.push((time) => {
          for (let i = 0; i < N; i++) {
            const o = home[i] * 3, a = phase[i] + time * speed[i], k = 0.08 + 0.07 * (0.5 + 0.5 * Math.sin(time * 3 + phase[i] * 2));
            write(fd, i * 20, k, 0, 0, 0, k, 0, 0, 0, k, at3[o] + Math.cos(a) * radius[i], at3[o + 1] + lift[i] + Math.sin(time * 1.3 + phase[i]) * 0.7, at3[o + 2] + Math.sin(a) * radius[i]);
          }
          flies.instanceVersion++;
        });
      }
      // The great crystals nearer the lanes: clusters on rock, turning and bobbing, a ring of shards turning round
      // each and a glow behind each turned to the eye.
      for (let k = 0; k < 7; k++) {
        const t = (k + 0.5) / 7, p = place(course, t, (k % 2 ? 1 : -1) * (28 + rand() * 35), 6);
        if (!p) continue;
        const v = k % 4, s = 1.1 + rand() * 0.7, gem = node(cluster(v), p.x, routeY(t) - 6 + rand() * 18, p.z, s);
        const ring = node(orbit(v), 0, 1.4, 0, 1, gem), halo = node(glow(v), 0, 0, 0, 8 * s);
        halo.smokeOpacity = 0.45;
        const y0 = gem.position.y, ph = rand() * TAU, turn = (k % 2 ? 1 : -1) * (0.12 + rand() * 0.1);
        gem.rotation.x = (rand() - 0.5) * 0.3;
        reached(p.x, y0, p.z, 10);
        movers.push((time, dt, camera) => {
          gem.rotation.y = ph + time * turn; gem.position.y = y0 + Math.sin(time * 0.45 + ph) * 1.6;
          ring.rotation.y = -time * 0.6 * Math.sign(turn) * 2;
          halo.position.x = gem.position.x; halo.position.y = gem.position.y + 1.4 * s; halo.position.z = gem.position.z;
          const dx = camera.position.x - halo.position.x, dy = camera.position.y - halo.position.y, dz = camera.position.z - halo.position.z;
          halo.rotation.y = Math.atan2(dx, dz); halo.rotation.x = -Math.atan2(dy, Math.hypot(dx, dz));
        });
      }
      // The aurora as a real one stands: long curtains far off in the sky toward the island, straight but for their
      // folds, so perspective bends each into an arc settling toward the horizon at its ends, and each kept where it
      // stands round the eye, as something a hundred kilometres up stays put however far a rider falls (`CURTAINS`: how
      // far ahead of the eye, how high over it its lower edge runs, how tall its rays stand, how far it runs either
      // side of where it is centred, `side` of the course, its columns' width and how bright it burns; a negative
      // `ahead` is behind the eye). The far ones toward the island stand their lower edge `sea` metres over the sea
      // instead, so from high on the course they hang low over the sea behind the island and rise into the sky as a
      // rider comes down to it; their edges rise and dip `wave` metres, the others' a quarter of their height over the
      // eye. Toward the island: two far ones over the sea, a long low arc and a shorter one off to one side; overhead,
      // three high off to either side, their rays drawing together toward the top of the sky; and behind, two more. A
      // lower edge never comes down under the sea's own height. Each is pixel columns standing edge to edge on its
      // lower edge, each its own height, so the rays are streaked and their tips step as staircases, and under each a
      // skirt of pink fringe and green glow. Canvas 2D gets the two farthest toward the island, coarser and without
      // their skirts.
      const CURTAINS = [
        { ahead: 2600, sea: 30, wave: 40, rise: 560, run: 3600, side: 0, px: 22, bright: 0.75 },
        { ahead: 1500, sea: 80, wave: 40, rise: 420, run: 2600, side: 250, px: 16, bright: 0.85 },
        { ahead: 800, over: 40, rise: 300, run: 1100, side: 500, px: 11, bright: 0.95 },
        { ahead: 420, over: 180, rise: 240, run: 900, side: -350, px: 9, bright: 1 },
        { ahead: 240, over: 300, rise: 260, run: 1200, side: 150, px: 10, bright: 1 },
        { ahead: -260, over: 280, rise: 240, run: 1000, side: -300, px: 10, bright: 0.95 },
        { ahead: -900, over: 60, rise: 320, run: 1600, side: 100, px: 13, bright: 0.85 },
        { ahead: -1800, over: -20, rise: 420, run: 2600, side: -300, px: 18, bright: 0.7 }];
      // How it moves, as a real aurora does: its folds drift along it and change over a minute or two (FOLD, a share
      // of its distance), its rays shimmer and their pleats run along it a few degrees a second, a wave of brightness
      // runs along it every RIPPLE seconds, and every so often it breaks up (BREAKUP): brightening fast, its folds and
      // rays quickening and its pink fringe glowing, then easing back.
      const FOLD = 0.14, RIPPLE = [16, 24], BREAKUP = { first: 40, every: 125, rise: 2, fade: 6, last: 20 };
      const shown = CURTAINS.filter((c, n) => !lite || n < 2).map((c) => ({ ...c, rays: Math.max(24, Math.round(2 * c.run / c.px * (lite ? 0.25 : tier))) }));
      const total = shown.reduce((sum, c) => sum + c.rays, 0), rays = batch(ray(), total), rd = rays.instanceData;
      const skirts = lite ? null : batch(skirt(), total), kd = skirts ? skirts.instanceData : null;
      const wide = new Float32Array(total), beat = new Float32Array(total);
      for (let i = 0; i < total; i++) { wide[i] = rand(); beat[i] = rand() * TAU; }
      let first = 0;
      for (const c of shown) {
        c.first = first; first += c.rays; c.phase = rand() * TAU;
        c.ripple = RIPPLE[0] + rand() * (RIPPLE[1] - RIPPLE[0]); c.offset = rand() * c.ripple;
        reached(route.start.x, route.start.y, route.start.z, route.length + Math.hypot(c.ahead * (1 + FOLD), c.run + Math.abs(c.side)) + Math.abs(c.over ?? 0) * 1.4 + c.rise);
      }
      addChild(scenery, rays);
      if (skirts) addChild(scenery, skirts);
      const fx = Math.cos(route.ahead), fz = Math.sin(route.ahead), sx = route.sideX, sz = route.sideZ;
      // Its clocks: the folds' and the rays', each quickening through a breakup.
      let folds = 0, pleats = 0;
      // Where a curtain's lower edge runs at s along it (0 to 1, side to side), round the eye at e, into P: folding
      // toward and away from the eye and rising and dipping a little as it goes.
      const P = { x: 0, y: 0, z: 0 };
      const edge = (c, s, e) => {
        const along = c.side + (2 * s - 1) * c.run;
        const fold = c.ahead * FOLD * (0.6 * Math.sin(TAU * 1.2 * s + 0.11 * folds + c.phase) + 0.4 * Math.sin(TAU * 2.7 * s - 0.17 * folds + 2 * c.phase));
        P.x = e.x + sx * along + fx * (c.ahead + fold); P.z = e.z + sz * along + fz * (c.ahead + fold);
        P.y = Math.max(seaY + 8, (c.sea === undefined ? e.y + c.over : seaY + c.sea)
          + (c.wave ?? Math.abs(c.over) * 0.25) * (Math.sin(TAU * 1.3 * s + 0.06 * folds + c.phase) + 0.4 * Math.sin(TAU * 3.1 * s - 0.1 * folds + 2 * c.phase)));
      };
      movers.push((time, dt, camera) => {
        // A breakup's strength now: none before the first, then up fast and easing back after each.
        const since = time - BREAKUP.first, into = since - Math.floor(since / BREAKUP.every) * BREAKUP.every;
        const flare = since < 0 || into > BREAKUP.last ? 0 : into < BREAKUP.rise ? into / BREAKUP.rise : Math.exp(-(into - BREAKUP.rise) / BREAKUP.fade);
        folds += dt * (1 + 3 * flare); pleats += dt * (1 + 2 * flare);
        const e = camera.position;
        for (let n = 0; n < shown.length; n++) {
          const c = shown[n], px = c.px, step = px * 0.5, wave = ((time + c.offset) / c.ripple) % 1 * 1.6 - 0.3;
          // Each column spans the edge from one point on it to the next, so it runs on unbroken through its folds.
          edge(c, 0, e);
          let lx = P.x, ly = P.y, lz = P.z;
          for (let i = 0; i < c.rays; i++) {
            const s = (i + 0.5) / c.rays, j = c.first + i, o = j * 20;
            edge(c, (i + 1) / c.rays, e);
            // Bright stretches and faint ones along it, changing slowly, and its ends fading out.
            const taper = Math.sqrt(Math.min(1, s * 8, (1 - s) * 8)) * (0.3 + 0.7 * (0.5 + 0.5 * Math.sin(TAU * 1.4 * s + 0.05 * folds + 3 * c.phase))
              * (0.6 + 0.4 * Math.sin(TAU * 3.3 * s - 0.07 * folds + c.phase)));
            // Pleats of bright and dim rays running along it, two ways at once, so it shimmers.
            const pleat = 0.5 + 0.5 * Math.sin(TAU * 17 * s - 2.2 * pleats + c.phase) * Math.sin(TAU * 6.5 * s + 0.9 * pleats + 2 * c.phase);
            const h = px * Math.max(1, Math.round(c.rise * Math.sqrt(taper) * (0.45 + 0.25 * Math.sin(TAU * 4.3 * s + 0.35 * pleats + c.phase) + 0.15 * pleat + 0.15 * wide[j])
              * (1 + 0.3 * flare) / px));
            const y = e.y + step * Math.round(((ly + P.y) / 2 - e.y) / step), dx = P.x - lx, dz = P.z - lz, l = Math.hypot(dx, dz) || 1;
            const cx = (lx + P.x) / 2, cz = (lz + P.z) / 2, ripple = 0.6 * Math.exp(-(((s - wave) / 0.06) ** 2));
            write(rd, o, 0, h, 0, -dz / l, 0, dx / l, dx, 0, dz, cx, y, cz);
            rd[o + 16] = c.bright * taper * ((0.25 + 0.65 * pleat * pleat + 0.1 * Math.sin(7 * time + beat[j])) * (1 + 0.8 * flare) + ripple);
            if (kd) {
              write(kd, o, 0, -px * 5, 0, -dz / l, 0, dx / l, dx, 0, dz, cx, y, cz);
              kd[o + 16] = c.bright * taper * (0.3 + 0.9 * flare + 0.4 * ripple);
            }
            lx = P.x; ly = P.y; lz = P.z;
          }
        }
        rays.instanceVersion++;
        if (skirts) skirts.instanceVersion++;
      });
      if (lite) return;
      // Shooting stars: up to three at once, each a streak across the sky beyond the course for under a second.
      const MAX = 3, stars = batch(streak(), MAX), sd = stars.instanceData;
      const hx = new Float32Array(MAX), hy = new Float32Array(MAX), hz = new Float32Array(MAX), dx = new Float32Array(MAX), dy = new Float32Array(MAX), dz = new Float32Array(MAX), age = new Float32Array(MAX), life = new Float32Array(MAX);
      let live = 0, next = 2;
      stars.instanceCount = 0; stars.visible = false;
      addChild(scenery, stars);
      movers.push((time, dt, camera) => {
        next -= dt;
        if (next <= 0 && live < MAX) {
          const az = route.ahead + (Math.random() - 0.5) * 2.6, el = 0.3 + Math.random() * 0.6, side = Math.random() < 0.5 ? -1 : 1, i = live++;
          hx[i] = camera.position.x + Math.cos(az) * Math.cos(el) * 520; hy[i] = camera.position.y + Math.sin(el) * 520; hz[i] = camera.position.z + Math.sin(az) * Math.cos(el) * 520;
          const ex = -Math.sin(az) * side, ez = Math.cos(az) * side, l = Math.hypot(ex, 0.55, ez);
          dx[i] = ex / l; dy[i] = -0.55 / l; dz[i] = ez / l; age[i] = 0; life[i] = 0.55 + Math.random() * 0.35;
          next = 2.5 + Math.random() * 4.5;
        }
        for (let i = 0; i < live; i++) {
          age[i] += dt;
          if (age[i] < life[i]) continue;
          live--;
          hx[i] = hx[live]; hy[i] = hy[live]; hz[i] = hz[live]; dx[i] = dx[live]; dy[i] = dy[live]; dz[i] = dz[live]; age[i] = age[live]; life[i] = life[live];
          i--;
        }
        for (let i = 0; i < live; i++) {
          const x = hx[i] + dx[i] * 300 * age[i], y = hy[i] + dy[i] * 300 * age[i], z = hz[i] + dz[i] * 300 * age[i];
          const len = 80 * Math.min(1, age[i] / 0.12, (life[i] - age[i]) / 0.15);
          // Across the streak, square to the line of sight.
          const vx = camera.position.x - x, vy = camera.position.y - y, vz = camera.position.z - z;
          let wx = dy[i] * vz - dz[i] * vy, wy = dz[i] * vx - dx[i] * vz, wz = dx[i] * vy - dy[i] * vx;
          const wl = Math.hypot(wx, wy, wz) || 1;
          wx /= wl; wy /= wl; wz /= wl;
          write(sd, i * 20, -dx[i] * len, -dy[i] * len, -dz[i] * len, dy[i] * wz - dz[i] * wy, dz[i] * wx - dx[i] * wz, dx[i] * wy - dy[i] * wx, wx * 1.8, wy * 1.8, wz * 1.8, x, y, z);
        }
        stars.instanceCount = live; stars.visible = live > 0;
        stars.instanceVersion++;
      });
    };

    const storm = (level, course, rand) => {
      // Lighthouse isles: storm-dark isles well out to either side of the course at about its height, each with a
      // lighthouse sweeping two beams round, landmarks far off rather than anywhere to land. A keeper's hut and bushes
      // stand on the rest of each isle's spots. The haze takes them as it takes everything; past its start a
      // lighthouse is only its light, diffused: a soft glow over the lamp that comes up as the haze takes the tower,
      // swells as a beam sweeps toward the eye and dies away by `GONE` metres off.
      const ISLES = 8, ACROSS = [90, 35], TOWER = 0.75, BEAM = [55, 8], TURN = 0.8, GONE = 420, AHEAD = 3, [near, far] = level.sky.fog;
      for (let k = 0; k < ISLES; k++) {
        const t = (k + 0.5) / ISLES, side = k % 2 ? 1 : -1, v = (k * 3 + 1) % 4, shape = isle(8 + v), s = 1.3 + rand() * 0.4;
        const p = place(course, t, side * (ACROSS[0] + rand() * ACROSS[1]), shape.radius * s);
        if (!p) continue;
        const y = routeY(t) - 4 + rand() * 10, spin = rand() * TAU, base = standIsle(shape, p.x, y, p.z, s, spin), [spot, ...rest] = shape.spots;
        const tower = node(lighthouse(), spot.x, spot.y, spot.z, TOWER, base);
        const turn = node(null, 0, LAMP_Y, 0, 1, tower), phase = rand() * TAU;
        for (const yaw of [0, Math.PI]) {
          const shine = node(beam(), 0, 0, 0, 1, turn);
          shine.rotation.y = yaw; shine.scale.x = BEAM[0]; shine.scale.y = shine.scale.z = BEAM[1];
        }
        rest.forEach((stand, n) => {
          node(n ? BL.hubModels.bush((k + n) % 3) : hut(), stand.x, stand.y, stand.z, n ? 0.5 : 0.8, base).rotation.y = rand() * TAU;
        });
        reached(p.x, y, p.z, BEAM[0] * TOWER * s);
        const c = Math.cos(spin), n = Math.sin(spin), hx = p.x + (spot.x * c + spot.z * n) * s, hz = p.z + (-spot.x * n + spot.z * c) * s;
        const hy = y + (spot.y + LAMP_Y * TOWER) * s, halo = node(hazeLight(), hx, hy, hz);
        movers.push((time, dt, camera) => {
          const yaw = phase + time * TURN, turned = spin + yaw;
          turn.rotation.y = yaw;
          const dx = camera.position.x - hx, dy = camera.position.y - hy, dz = camera.position.z - hz, flat = Math.hypot(dx, dz) || 1;
          const d = Math.hypot(flat, dy), light = smooth(near, far, d) * (1 - smooth(far, GONE, d));
          halo.visible = light > 0;
          if (!halo.visible) return;
          // A beam's axis is the node's +x turned by `turned`; how squarely one points at the eye flares the glow.
          const sweep = Math.abs(Math.cos(turned) * dx - Math.sin(turned) * dz) / flat;
          halo.smokeOpacity = light * (0.12 + 0.5 * sweep ** 12);
          halo.scale.x = halo.scale.y = halo.scale.z = 12 + d * 0.06;
          // Stood a little toward the eye, so the tower never blocks the glow behind it and shows as a silhouette.
          halo.position.x = hx + dx / d * AHEAD * s; halo.position.y = hy + dy / d * AHEAD * s; halo.position.z = hz + dz / d * AHEAD * s;
          halo.rotation.y = Math.atan2(dx, dz); halo.rotation.x = -Math.atan2(dy, flat);
        });
      }
      // Lightning: every 4 to 10 s a strike 60 to 110 m off from the eye, inside the haze's reach and mostly ahead,
      // from the storm just over the eye down past the course (no lower than the sea), one or two bolts with it, and
      // the flash's strobe for the hub.
      const bolts = [node(bolt(0), 0, 0, 0), node(bolt(1), 0, 0, 0)];
      for (const b of bolts) b.visible = false;
      let next = 3, struck = -1;
      movers.push((time, dt, camera) => {
        if (time >= next && dt > 0) {
          next = time + 4 + Math.random() * 6; struck = time;
          const p = camera.position;
          for (let i = 0; i < bolts.length; i++) {
            const b = bolts[i], a = route.ahead + (Math.random() - 0.5) * 1.8, d = 60 + Math.random() * 50;
            const foot = Math.max(seaY, p.y - 110), h = p.y + 45 - foot;
            b.visible = i === 0 || Math.random() < 0.45;
            b.position.x = p.x + Math.cos(a) * d; b.position.y = foot; b.position.z = p.z + Math.sin(a) * d;
            b.scale.x = b.scale.z = h * 0.45; b.scale.y = h; b.rotation.y = Math.random() * TAU;
            if (i === 0) onStrike?.(d);
          }
        }
        flash = struck < 0 ? 0 : flashAt(time - struck);
        if (struck >= 0 && time - struck > 0.25) for (let i = 0; i < bolts.length; i++) bolts[i].visible = false;
      });
      if (lite) return;
      // Rain: streaks fixed in the world and wrapped into a box round the eye, so turning never drags them along,
      // slanted by the wind and falling fast; as many as the quality tier carries. One within NEAR of the eye is left
      // out, or it would cross the view as a bar.
      const N = renderer.quality === "high" ? 360 : renderer.quality === "low" ? 120 : 240, BOX = 44, TALL = 30, NEAR = 3, WIDE = 1.1;
      const drops = batch(BL.weather.rainDrop(), N), d = drops.instanceData, sx = new Float32Array(N), sy = new Float32Array(N), sz = new Float32Array(N);
      for (let i = 0; i < N; i++) { sx[i] = rand() * BOX; sy[i] = rand() * TALL; sz[i] = rand() * BOX; }
      const windX = route.sideX * 0.22, windZ = route.sideZ * 0.22, l = Math.hypot(windX, 1, windZ), len = 1.15;
      addChild(scenery, drops);
      movers.push((time, dt, camera) => {
        const p = camera.position;
        for (let i = 0; i < N; i++) {
          const fall = (sy[i] + time * 26) % TALL, x = p.x - BOX / 2 + ((sx[i] + fall * windX - p.x) % BOX + BOX) % BOX;
          const z = p.z - BOX / 2 + ((sz[i] + fall * windZ - p.z) % BOX + BOX) % BOX, k = (x - p.x) ** 2 + (z - p.z) ** 2 < NEAR * NEAR ? 0 : 1;
          write(d, i * 20, WIDE * k, 0, 0, windX / l * len * k, 1 / l * len * k, windZ / l * len * k, 0, 0, WIDE * k, x, p.y + TALL / 2 - fall, z);
        }
        drops.instanceVersion++;
      });
    };

    const eye = (level, course, rand) => {
      // The eyewall: storm towers in a ring round the course's middle, `AROUND` metres past its ends, slate-dark but
      // gold where they face the rising sun, with dark banks along their feet. As an eyewall does, the ring turns
      // slowly round the eye (`SPIN`, rad/s), each tower keeping the way it faces so the sun stays on its gold faces.
      // Lightning strikes deep in the wall every 1.5 to 4 s, the thunder late and soft from so far, its flash a
      // third of Thunderhead's on the sky.
      const sun = sunAt(level.sky.hour), sl = Math.hypot(sun.x, sun.z) || 1, sunX = sun.x / sl, sunZ = sun.z / sl;
      const TOWERS = lite ? 10 : 22, BANKS = lite ? 8 : 18, AROUND = 380, SPIN = 0.006, FLASH = 0.35;
      const mid = at(0.5, 0), cx = mid.x, cz = mid.z, R = route.length / 2 + AROUND, ring = [];
      const stand = (geometry, a, r, y, s) => {
        const n = node(geometry, cx + Math.cos(a) * r, y, cz + Math.sin(a) * r, s);
        n.matrixCloud = true; ring.push({ n, a, r });
        return n;
      };
      for (let k = 0; k < (RIFT && !lite ? 0 : TOWERS); k++) {
        const a = (k + 0.2 + rand() * 0.6) / TOWERS * TAU, r = R + rand() * 120, s = 2.3 + rand() * 0.7;
        stand(spire(k % 3, sunX, sunZ, EYEWALL), a, r, seaY + 10 + rand() * 15, s);
        reached(cx + Math.cos(a) * r, seaY + 560, cz + Math.sin(a) * r, 230 * s);
      }
      // A bank across the eye from the sun shows the rider its sunlit face.
      for (let k = 0; k < (RIFT && !lite ? 0 : BANKS); k++) {
        const a = (k + rand()) / BANKS * TAU, r = R - 40 + rand() * 100, s = 2 + rand() * 0.6, warm = Math.cos(a) * sunX + Math.sin(a) * sunZ < -0.2;
        stand(bank((warm ? 4 : 6) + (k % 2)), a, r, seaY + 4 + rand() * 20, s).rotation.y = Math.atan2(-Math.cos(a), -Math.sin(a));
      }
      // Four fun blimps drifting far off to either side of the course (330 to 470 m from its
      // middle, two forward and two back), turning round the eye with it and bobbing, their propellers spinning; they turn over with
      // the world at the flip, as all its scenery does. Their places come from a stream of their own, so the eyewall's
      // are as they were.
      if (!lite) {
        const own = mulberry32(SEED ^ 0x5bd1e995), blimps = [];
        for (let k = 0; k < 4; k++) {
          const a = route.ahead + (k % 2 ? 1 : -1) * (Math.PI / 2 + (k < 2 ? -0.45 : 0.45)) + (own() - 0.5) * 0.2, r = 330 + own() * 140, y = seaY + 190 + own() * 140, s = 5.5 + own() * 1.5;
          const n = node(farBlimp(k), cx + Math.cos(a) * r, y, cz + Math.sin(a) * r, s);
          // Flying round the eye, broadside to it, one way or the other.
          n.rotation.y = Math.atan2(Math.cos(a), -Math.sin(a)) + (k % 2 ? Math.PI : 0);
          const prop = node(farProp(), 5.05, 0, 0, 1, n);
          ring.push({ n, a, r }); blimps.push({ n, prop, y, ph: own() * TAU });
          reached(n.position.x, y, n.position.z, 12 * s);
        }
        movers.push((time) => { for (const b of blimps) { b.n.position.y = b.y + Math.sin(time * 0.3 + b.ph) * 3; b.prop.rotation.x = time * 8; } });
      }
      // The rift: its seed a little ahead of the zenith toward the way down the course, its stage stepped on by how far
      // down the course the eye has come (halfway, about where the world turns over, is RIFT_STAGES - 2), never back.
      if (LAGOON && !lite) {
        // Centred under the course's middle, just over the sea, laid flat (the panel's plan turned to the world's).
        const job = lagoonStart(), veil = node(lagoonVeil(), cx, seaY + 0.3, cz, LAGOON_SPAN), disc = node(lagoonDisc(), cx, seaY + 0.4, cz, LAGOON_SPAN);
        veil.rotation.x = disc.rotation.x = -Math.PI / 2;
        node(lagoonIslands(), cx, seaY + 0.4, cz);
        const waves = [0, 1].map((v) => { const w = node(null, cx, seaY + 1.2 + v * 0.3, cz, LAGOON_SPAN); w.rotation.x = -Math.PI / 2; w.visible = false; return w; });
        // Painted already (a replay, a level after another): shown at once. Otherwise the veil until it is, then the
        // lagoon fading in over it over LAGOON_FADE seconds and the veil gone.
        let budget = 0, shown = job.done ? 1 : 0;
        veil.visible = shown < 1; disc.smokeOpacity = shown;
        const more = () => performance.now() < budget;
        movers.push((time, dt) => {
          // Not painted yet: a few milliseconds of it this frame; the swell shown once it is.
          if (!job.done) { budget = performance.now() + 3; if (!lagoonStep(more)) return; }
          if (shown < 1) { shown = Math.min(1, shown + dt / LAGOON_FADE); disc.smokeOpacity = shown; veil.visible = shown < 1; }
          if (!waves[0].geometry) for (let v = 0; v < 2; v++) { waves[v].geometry = job.waves[v]; waves[v].visible = true; }
          waves[0].smokeOpacity = (0.55 + 0.45 * Math.sin(time * 0.5)) * shown; waves[1].smokeOpacity = (0.55 - 0.45 * Math.sin(time * 0.5 + 0.8)) * shown;
        });
        reached(cx, seaY, cz, LAGOON_SPAN / 2);
      }
      if (RIFT && !lite) {
        // Laid on the sky upright (local z up, local -y the world's +z), the way ahead at local azimuth `ahead`.
        const ahead = -route.ahead, R = 6500, oy = seaY - 200, UP = -Math.PI / 2, G = RIFT_GLOWS(), p = [0, 0, 0], LAST = RIFT_STAGES - 1;
        const at = (q, k, out) => { out.x = cx + q[0] * R * k; out.y = oy + q[2] * R * k; out.z = cz - q[1] * R * k; };
        const face = (n, q) => { const dx = -q[0], dy = -q[2], dz = q[1]; n.rotation.y = Math.atan2(dx, dz); n.rotation.x = -Math.atan2(dy, Math.hypot(dx, dz)); };
        // The band and its meld, built at full height and squeezed toward the horizon (their local z) to the height
        // the run has come to; the stars in their bins, each shown once the band is tall enough to hold it.
        const squeezed = [], hold = createNode({ visible: false, sightHidden: true }); addChild(scenery, hold);
        { const cap = node(riftCap(LAST), cx, oy, cz, R, hold); cap.rotation.x = UP; squeezed.push([cap, R]); }
        for (let j = 0; j < SEAM.length; j++) { const k = R * (0.996 - j * 0.0002), n = node(riftSeam([LAST, j]), cx, oy, cz, k, hold); n.rotation.x = UP; squeezed.push([n, k]); }
        const stars = riftStars().map((g) => { const n = node(g, cx, oy, cz, R); n.rotation.x = UP; n.visible = false; return n; });
        // The fusion line: LINE pictures along each edge, overlapping, following the edges as the band grows; the
        // streaks rise into the space, so the upper edge's are turned over. Each shimmers a little, on its own phase.
        const LINE = 32, line = [];
        for (let e = 0; e < 2; e++) for (let i = 0; i < LINE; i++) {
          const n = node(G.fusion((i + e * 2) % 4), cx, oy, cz, 1); n.visible = false; line.push({ n, az: (i + (e ? 0.5 : 0)) / LINE * TAU, up: e === 0, ph: i * 1.7 + e * 0.9 });
        }
        const wide = TAU / LINE * 1.5 * R;
        // The soft pictures, each square to the eye at the dome's middle, fading in once the band holds it whole.
        const pictures = [];
        for (const d of RIFT_PICTURES) {
          const az = ahead + d.az, half = d.size * 0.5 * (Math.abs(Math.sin(d.tilt)) * (d.wide || 1) + Math.abs(Math.cos(d.tilt)));
          const need = bandNeeds(d.el, az, half + 0.015);
          if (need > BAND_FULL) continue;
          bandPoint(d.el, az, p);
          const n = node(d.pic(G), 0, 0, 0, d.size * R); at(p, 0.98, n.position); face(n, p);
          n.scale.x = d.size * R * (d.wide || 1); n.rotation.z = d.tilt; n.visible = false; pictures.push({ n, need });
        }
        reached(cx, seaY + R, cz, R);
        // Every mesh and picture handed to the renderer ahead, a few a frame, so none is built or uploaded as it comes
        // on (a hitch then would hold up the run's own clock, the flip's gust with it).
        const warm = [...squeezed.map(([n]) => n.geometry), ...stars.map((n) => n.geometry), ...line.slice(0, 4).map((f) => f.n.geometry), ...pictures.map((q) => q.n.geometry)];
        let warmed = 0, shown = 0;
        // The band's height eases toward where the run has come to (a hop on never shows as a jump), never back.
        // Where the lagoon's rim lies (its picture fades out from about here), for the line on the water's side.
        const RIM = LAGOON_SPAN * 0.33, inv = new Float64Array(16), eye = new Float64Array(3), M4 = BL.math.mat4;
        movers.push((time, dt, camera) => {
          for (let n = 0; n < 3 && warmed < warm.length && renderer?.prepareGeometry; n++) if (renderer.prepareGeometry(warm[warmed]) !== false) warmed++; else break;
          const want = bandAt(runProgress);
          if (want > shown) shown = dt > 0 ? shown + (want - shown) * Math.min(1, dt * 1.2) : want;
          const h = shown, on = h > 0.0015;
          hold.visible = on;
          if (!on) return;
          // Faint at first and coming up to full as it grows (BAND_SOLID), so it never shows at once as a whole ring.
          const squeeze = h / BAND_FULL, solid = Math.min(1, h / BAND_SOLID);
          for (let i = 0; i < squeezed.length; i++) { squeezed[i][0].scale.z = squeezed[i][1] * squeeze; squeezed[i][0].smokeOpacity = solid; }
          for (let i = 0; i < STAR_BINS; i++) stars[i].visible = h >= (i + 1) / STAR_BINS * BAND_FULL;
          for (let i = 0; i < pictures.length; i++) { const q = pictures[i], k = Math.min(1, (h - q.need) / 0.03); q.n.visible = k > 0; q.n.smokeOpacity = Math.max(0, k); }
          // The line on the edges where they stand now, as tall as the band allows, fading in from a hairline. On the
          // water's side the lagoon lies nearer than the band, so where it hides the band's edge from the eye the line is
          // laid on the lagoon's rim instead, square to the eye and as big to it, so it is always on the boundary seen.
          const tall = Math.max(0.03, Math.min(0.16, h * 0.8)) * R, fade = Math.min(1, h / BAND_SOLID);
          const lagoon = LAGOON && scenery.world && camera?.position;
          if (lagoon) { M4.invert(inv, scenery.world); M4.transformPoint(eye, inv, camera.position.x, camera.position.y, camera.position.z); }
          for (let i = 0; i < line.length; i++) {
            const f = line[i], el = f.up ? h * waverUp(f.az) : -h * waverDown(f.az), c = Math.cos(el), shimmer = 0.88 + 0.12 * Math.sin(time * 0.6 + f.ph);
            p[0] = c * Math.cos(f.az); p[1] = c * Math.sin(f.az); p[2] = Math.sin(el);
            f.n.visible = true; f.n.smokeOpacity = fade;
            if (!f.up && lagoon) {
              // How high the band's edge and the lagoon's rim each stand to the eye, that way round.
              const ex = cx + p[0] * R * 0.985 - eye[0], ey = oy + p[2] * R * 0.985 - eye[1], ez = cz - p[1] * R * 0.985 - eye[2];
              const rx = cx + Math.cos(f.az) * RIM - eye[0], ry = seaY + 0.4 - eye[1], rz = cz - Math.sin(f.az) * RIM - eye[2];
              const edgeD = Math.hypot(ex, ez), rimD = Math.hypot(rx, rz);
              if (Math.atan2(ey, edgeD) < Math.atan2(ry, rimD)) {
                const far = Math.hypot(rx, ry, rz) / Math.hypot(ex, ey, ez), q = f.n;
                q.position.x = cx + Math.cos(f.az) * RIM; q.position.y = seaY + 0.4 + 0.1 * tall * far; q.position.z = cz - Math.sin(f.az) * RIM;
                q.rotation.y = Math.atan2(-rx, -rz); q.rotation.x = -Math.atan2(-ry, rimD); q.rotation.z = 0;
                q.scale.x = wide * far; q.scale.y = tall * far * shimmer;
                continue;
              }
            }
            at(p, 0.985, f.n.position); face(f.n, p);
            f.n.position.y += (f.up ? 0.1 : -0.1) * tall * c;
            f.n.rotation.z = f.up ? Math.PI : 0; f.n.scale.x = wide; f.n.scale.y = tall * shimmer;
          }
        });
      }
      const bolts = [node(bolt(0), 0, 0, 0), node(bolt(1), 0, 0, 0)];
      for (const b of bolts) b.visible = false;
      let next = 2, struck = -1;
      movers.push((time, dt, camera) => {
        for (let i = 0; i < ring.length; i++) {
          const stood = ring[i], turned = stood.a + time * SPIN;
          stood.n.position.x = cx + Math.cos(turned) * stood.r; stood.n.position.z = cz + Math.sin(turned) * stood.r;
        }
        if (time >= next && dt > 0) {
          next = time + 1.5 + Math.random() * 2.5; struck = time;
          const a = Math.random() * TAU, p = camera.position;
          for (let i = 0; i < bolts.length; i++) {
            const b = bolts[i], r = R + (Math.random() - 0.3) * 80, h = 260 + Math.random() * 160;
            b.visible = i === 0 || Math.random() < 0.45;
            b.position.x = cx + Math.cos(a + i * 0.03) * r; b.position.y = seaY + 10; b.position.z = cz + Math.sin(a + i * 0.03) * r;
            b.scale.x = b.scale.z = h * 0.45; b.scale.y = h; b.rotation.y = Math.random() * TAU;
            if (i === 0) onStrike?.(Math.hypot(b.position.x - p.x, b.position.y + h / 2 - p.y, b.position.z - p.z));
          }
        }
        flash = struck < 0 ? 0 : flashAt(time - struck) * FLASH;
        if (struck >= 0 && time - struck > 0.25) for (let i = 0; i < bolts.length; i++) bolts[i].visible = false;
      });
    };

    // Lays `level`'s scenery round a course from `start` down to `finish` and returns how far it reaches from the
    // start, for the camera's far plane.
    const build = (level, course, start, finish) => {
      // Every run starts at the start: what grows with the run (Flipside's band) must not take up the last run's
      // progress as the new run's movers first run.
      clear(); runProgress = 0; time = 0;
      const kind = level.sky?.scenery;
      if (!kind) return 0;
      const sx = start.x - finish.x, sz = start.z - finish.z, length = Math.hypot(sx, sz), nx = sx / length, nz = sz / length;
      Object.assign(route, { start, finish, length, nx, nz, sideX: -nz, sideZ: nx, ahead: Math.atan2(-nz, -nx) });
      const rand = mulberry32(SEED);
      reach = 0; time = 0;
      if (kind === "islets") isles(level, course, rand);
      else if (kind === "spires") spires(level, course, rand);
      else if (kind === "aurora") aurora(level, course, rand);
      else if (kind === "storm") storm(level, course, rand);
      else if (kind === "eye") eye(level, course, rand);
      for (const move of movers) move(0, 0, { position: start });
      scenery.visible = true;
      return reach;
    };
    // `progress`, how far down the course the rider has come (0 at the start, 1 at the finish), for what grows with it.
    const update = (dt, camera, progress = 0) => {
      if (!scenery.visible) return;
      time += dt; runProgress = progress;
      for (let i = 0; i < movers.length; i++) movers[i](time, dt, camera);
    };
    const clear = () => {
      for (let i = scenery.children.length - 1; i >= 0; i--) removeChild(scenery, scenery.children[i]);
      movers.length = 0; scenery.visible = false; flash = 0;
    };
    const dispose = () => { clear(); removeChild(root, scenery); };
    return { build, update, clear, dispose, get flash() { return flash; } };
  };
  BL.cloudHopperSky = { DAY, create, grade, flash: flashSky, bolt, farBlimp, get lagoon() { return lagoonJob && { done: lagoonJob.done, ms: lagoonJob.ms, longest: lagoonJob.longest, doneAt: lagoonJob.doneAt || 0 }; } };
})();
