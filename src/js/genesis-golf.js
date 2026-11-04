// Genesis museum: Glow Golf, the Oogas' jungle mini golf cavern under the hall (its course and ball are
// genesis-golf-course.js). `build(...)` makes the cavern once a visit: an earth floor and mossy rock walls painted with
// handprints and stick Oogas, palms, ferns and vines, parrots flying round under the roof, and each hole's green in
// grass with grassy hills, log rails trimmed in one neon colour (as the hall's pillars are), stone bumpers, hidden
// tunnels, its cup and flag, its tee and its carving (a giant Ooga head, a stepped pyramid, a jungle serpent, a turning
// sun stone, a temple), all in stone, wood and leaf with only neon accents.
// The controller plays it: Space at a tee starts that hole (the scene's prop), A and D or the arrows aim, Space starts
// the swing's meter and Space again strikes at its strength; the camera follows the ball, a sunk ball moves on to the
// next tee, Escape hands the walk back. The scorecard and the meter are drawn on the overlay. Nothing allocates a frame.
(() => {
  "use strict";
  const BL = window.BL = window.BL || {};
  const G = () => BL.genesisGolfCourse;
  const NEON = ["#ff7a1a", "#ffd23a", "#9cff3a", "#ff4fd8", "#3ad8ff"], FELT = ["#3f7d2c", "#468a30", "#3a742a"], SPOT = ["#5c9c3a", "#33692a", "#68a646"];
  const STONE = ["#6e6a5e", "#7a7466", "#5e5a50"], LOG = ["#6b4528", "#7a5030", "#5e3c22"], LEAF = ["#2f7a2a", "#3e9030", "#24661f", "#4a9c38"];
  // Parrots: body, wing and belly colours (a scarlet macaw, a blue-and-gold, a green parrot).
  const PARROTS = [["#d8281e", "#2a5ad8", "#e8c020"], ["#2a7ad8", "#1a4aa8", "#f0c828"], ["#3aa83a", "#2a5ad8", "#d8e040"]];
  const build = ({ M, createNode, addChild, place, top, label }) => {
    const C = G().CAVERN, root = place(createNode({ position: { x: C.x, y: top, z: C.z }, sightHidden: true }));
    const hash = (a, b) => { const v = Math.sin(a * 12.99 + b * 78.23) * 43758.55; return v - Math.floor(v); };
    const solid = [], glow = [];
    // The cavern: floor, walls, roof, murals and tube lights.
    solid.push(M.box({ w: C.w, h: 0.4, d: C.d, color: "#3a2e1e", offset: { x: 0, y: -0.2, z: 0 } }));
    for (const [w, d, x, z] of [[C.w, 0.6, 0, -C.d / 2], [C.w, 0.6, 0, C.d / 2], [0.6, C.d, -C.w / 2, 0], [0.6, C.d, C.w / 2, 0]]) solid.push(M.box({ w, h: C.h, d, color: "#4a4636", offset: { x, y: C.h / 2, z } }));
    solid.push(M.box({ w: C.w, h: 0.4, d: C.d, color: "#3a382a", offset: { x: 0, y: C.h + 0.2, z: 0 } }));
    // Neon accents under the roof, softer and fewer than a black-light hall's: one short tube over each row's aisles.
    for (let x = -C.w / 2 + 6; x < C.w / 2; x += 12) for (const z of [-7, 7]) glow.push(M.box({ w: 2.2, h: 0.08, d: 0.1, color: NEON[Math.floor(hash(x, z) * 5)], emissive: 1.0, offset: { x, y: C.h - 0.1, z } }));
    // The walls: moss in patches, cave paintings in ochre, red earth and bone (handprints, stick Oogas, mammoths), and a
    // broken neon line along them at head height and a half.
    const PAINT = ["#c0602a", "#a83a1e", "#e8d8b0"];
    for (const side of [-1, 1]) {
      const z = side * (C.d / 2 - 0.32), f = -side;
      for (let x = -C.w / 2 + 1.5; x < C.w / 2 - 1; x += 1.1) {
        const m = hash(x, side * 3);
        if (m < 0.55) glow.push(M.box({ w: 0.8 + m, h: 0.5 + hash(side, x) * 1.6, d: 0.05, color: LEAF[Math.floor(hash(x + 1, side) * 4)], emissive: 0.04, offset: { x, y: hash(x, side + 5) * 6 + 0.4, z: z + f * 0.01 } }));
      }
      for (let x = -C.w / 2 + 3; x < C.w / 2 - 2; x += 2.6) {
        const k = Math.floor(hash(side + 7, x) * 3), ink = PAINT[Math.floor(hash(x, side + 9) * 3)], y = 1.6 + hash(x + 4, side) * 2.2, zz = z + f * 0.03;
        const pb = (w, h, ox, oy) => glow.push(M.box({ w, h, d: 0.03, color: ink, emissive: 0.22, offset: { x: x + ox, y: y + oy, z: zz } }));
        if (k === 0) { pb(0.36, 0.4, 0, 0); for (let q = 0; q < 4; q++) pb(0.07, 0.26, -0.13 + q * 0.087, 0.32); pb(0.07, 0.18, -0.24, 0.08); }
        else if (k === 1) { pb(0.14, 0.14, 0, 0.52); pb(0.06, 0.42, 0, 0.22); pb(0.4, 0.05, 0, 0.3); pb(0.05, 0.3, -0.1, -0.12); pb(0.05, 0.3, 0.1, -0.12); pb(0.05, 0.4, 0.28, 0.42); }
        else { pb(1.0, 0.5, 0, 0); pb(0.36, 0.34, 0.6, 0.12); pb(0.06, 0.3, 0.78, -0.18); for (const lx of [-0.36, -0.12, 0.14, 0.36]) pb(0.1, 0.32, lx, -0.38); }
      }
      for (let x = -C.w / 2 + 2; x < C.w / 2 - 2; x += 6) glow.push(M.box({ w: 3.4, h: 0.07, d: 0.04, color: NEON[Math.floor(hash(x, side) * 5)], emissive: 0.9, offset: { x, y: 5.6, z: z + f * 0.02 } }));
    }
    // The way back up: glowing vines down the west wall by the way in, and its sign.
    for (let k = 0; k < 7; k++) glow.push(M.box({ w: 0.08, h: C.h - 0.6, d: 0.08, color: k % 2 ? "#3e9030" : "#9cff3a", emissive: k % 2 ? 0.05 : 0.7, offset: { x: -C.w / 2 + 0.45, y: (C.h - 0.6) / 2, z: -21 + k * 0.33 } }));
    for (let y = 0.6; y < C.h - 1; y += 0.7) glow.push(M.box({ w: 0.1, h: 0.08, d: 2.2, color: "#7a5534", emissive: 0.08, offset: { x: -C.w / 2 + 0.5, y, z: -20 } }));
    { const up = label("UP TO THE HALL", "click here to climb back up", { height: 0.5, style: "gold" }), sn = createNode({ position: { x: -C.w / 2 + 0.7, y: 3.2, z: -20 }, rotation: { x: 0, y: Math.PI / 2, z: 0 }, sightHidden: true }); addChild(sn, createNode({ geometry: up.back, sightHidden: true }), createNode({ geometry: up.face, sightHidden: true })); addChild(root, sn); }
    // The holes.
    const holes = [], fountains = [], ponds = [];
    let volcano = null;
    for (let i = 0; i < 9; i++) {
      const c = G().compile(i), h = c.hole, cell = c.cell;
      // The green: every green is drawn with square corners, so the grid of its own corners' x and z cuts it into a
      // few rectangles, each wholly inside or out; the inside ones are its felt, and UV splotches lie on it.
      const xs = [...new Set(c.edge.map((q) => q[0]))].sort((a, b) => a - b), zs = [...new Set(c.edge.map((q) => q[1]))].sort((a, b) => a - b);
      for (let a = 0; a + 1 < xs.length; a++) for (let q = 0; q + 1 < zs.length; q++) {
        const mx = (xs[a] + xs[a + 1]) / 2, mz = (zs[q] + zs[q + 1]) / 2;
        if (G().inside(c.edge, mx, mz)) solid.push(M.box({ w: xs[a + 1] - xs[a], h: 0.03, d: zs[q + 1] - zs[q], color: FELT[(a + q + i) % 3], emissive: 0.1, offset: { x: mx, y: 0.015, z: mz } }));
      }
      for (let k = 0; k < 22; k++) {
        const x = cell.x + (hash(i, k) - 0.5) * 14, z = cell.z + (hash(k, i) - 0.5) * 9, r = 0.25 + hash(k + 3, i) * 0.4;
        if (G().inside(c.edge, x - r, z - r) && G().inside(c.edge, x + r, z + r)) glow.push(M.box({ w: r * 2, h: 0.034, d: r * 1.4, color: SPOT[k % 3], emissive: 0.08, offset: { x, y: 0.017, z } }));
      }
      // The rails: lashed logs, a thin line of the hole's own neon along their tops.
      const s = c.segs, trim = NEON[i % 5];
      for (let j = 0; j < s.length; j += 4) {
        const x0 = s[j], z0 = s[j + 1], x1 = s[j + 2], z1 = s[j + 3], len = Math.hypot(x1 - x0, z1 - z0), yaw = Math.atan2(x1 - x0, z1 - z0), n = Math.max(1, Math.round(len / 1.2));
        for (let k = 0; k < n; k++) {
          const t = (k + 0.5) / n, x = x0 + (x1 - x0) * t, z = z0 + (z1 - z0) * t;
          glow.push(M.moved(M.turnedY(M.bevelBox({ w: 0.2, h: 0.24, d: len / n + 0.02, color: LOG[Math.floor(hash(x0 + k, z0 + j) * 3)], emissive: 0.04, bevel: 0.06 }), yaw), x, 0.12, z));
        }
        glow.push(M.moved(M.turnedY(M.box({ w: 0.05, h: 0.03, d: len, color: trim, emissive: 0.85 }), yaw), (x0 + x1) / 2, 0.255, (z0 + z1) / 2));
      }
      const b = c.bumpers;
      for (let j = 0; j < b.length; j += 3) glow.push(M.moved(M.lathe({ profile: [[0, 0], [b[j + 2], 0], [b[j + 2] * 0.96, 0.3], [b[j + 2] * 0.6, 0.38], [0, 0.4]], segments: 14, color: STONE[j % 3], emissive: 0.05 }), b[j], 0, b[j + 1]),
        M.moved(M.lathe({ profile: [[b[j + 2] * 0.9, 0], [b[j + 2] * 1.02, 0], [b[j + 2] * 1.02, 0.05], [b[j + 2] * 0.9, 0.05]], segments: 14, color: trim, emissive: 0.85 }), b[j], 0.22, b[j + 1]));
      // Hills: grassy mounds the ball rolls over (their shape is the course's, so the ball rides them).
      const hl = c.hills;
      for (let j = 0; j < hl.length; j += 4) {
        const pr = []; for (let q = 0; q <= 8; q++) { const u = 1 - q / 8, w = 1 - u * u; pr.push([hl[j + 2] * u, hl[j + 3] * w * w]); }
        glow.push(M.moved(M.lathe({ profile: pr, segments: 16, color: FELT[(j / 4 + i + 1) % 3], emissive: 0.1 }), hl[j], 0.03, hl[j + 1]));
      }
      // Hidden tunnels: a mossy rock mouth that swallows the ball and a hollow log that lets it out (the pyramid's run
      // right through it, its mouths cut in its faces instead).
      for (const tn of c.tunnels) {
        if (h.prop !== "pyramid") {
          const fa = tn.face * (cell.flip ? -1 : 1), bx = tn.x - Math.sin(fa) * 0.45, bz = tn.z - Math.cos(fa) * 0.45;
          glow.push(M.moved(M.turnedY(M.merge(
            M.bevelBox({ w: 1.1, h: 0.62, d: 0.6, color: STONE[i % 3], emissive: 0.05, bevel: 0.2, offset: { x: 0, y: 0.31, z: 0 } }),
            M.bevelBox({ w: 0.9, h: 0.2, d: 0.5, color: LEAF[i % 4], emissive: 0.04, bevel: 0.08, offset: { x: 0, y: 0.66, z: 0 } }),
            M.box({ w: 0.42, h: 0.3, d: 0.04, color: "#0a0806", offset: { x: 0, y: 0.15, z: 0.31 } }),
            M.box({ w: 0.5, h: 0.04, d: 0.03, color: trim, emissive: 0.85, offset: { x: 0, y: 0.34, z: 0.32 } })), fa), bx, 0, bz));
          const la = Math.atan2(tn.dx, tn.dz);
          glow.push(M.moved(M.turnedY(M.merge(
            M.turnedX(M.lathe({ profile: [[0.16, -0.5], [0.24, -0.5], [0.24, 0.5], [0.16, 0.5]], segments: 10, color: LOG[1], emissive: 0.05 }), Math.PI / 2),
            M.turnedX(M.lathe({ profile: [[0.2, 0.47], [0.26, 0.47], [0.26, 0.52], [0.2, 0.52]], segments: 10, color: trim, emissive: 0.85 }), Math.PI / 2)), la), tn.x2 - tn.dx * 0.55, 0.24, tn.z2 - tn.dz * 0.55));
        }
      }
      // Boulders round the green, outside its rails.
      for (let k = 0; k < c.edge.length; k++) {
        const a = c.edge[k], q = c.edge[(k + 1) % c.edge.length], len = Math.hypot(q[0] - a[0], q[1] - a[1]), nx = -(q[1] - a[1]) / len, nz = (q[0] - a[0]) / len;
        const mx = (a[0] + q[0]) / 2, mz = (a[1] + q[1]) / 2, out = G().inside(c.edge, mx + nx * 0.5, mz + nz * 0.5) ? -1 : 1;
        for (let u = 0.6; u < len - 0.4; u += 1.5) {
          const x = a[0] + (q[0] - a[0]) * u / len + nx * out * 0.5, z = a[1] + (q[1] - a[1]) * u / len + nz * out * 0.5, r = 0.45 + hash(x, z) * 0.35;
          glow.push(M.bevelBox({ w: r, h: r * 0.75, d: r, color: STONE[Math.floor(hash(z, x) * 3)], emissive: 0.04, bevel: r * 0.3, offset: { x, y: r * 0.37, z } }));
          if (hash(x + 1, z) < 0.4) glow.push(M.bevelBox({ w: r * 0.7, h: r * 0.2, d: r * 0.7, color: LEAF[Math.floor(hash(x, z + 1) * 4)], emissive: 0.04, bevel: r * 0.08, offset: { x, y: r * 0.76, z } }));
        }
      }
      // Ponds: glowing water ringed with stones, a fountain in the middle (its jets the update's).
      for (const w of c.water) {
        glow.push(M.box({ w: w.x1 - w.x0, h: 0.035, d: w.z1 - w.z0, color: "#2a8ab0", emissive: 0.35, offset: { x: (w.x0 + w.x1) / 2, y: 0.02, z: (w.z0 + w.z1) / 2 } }));
        ponds.push(w);
        // A creek under a bridge: reeds along its banks and lily pads on it, no stone ring and no fountain.
        if (w.creek) {
          for (let k = 0; k < 4; k++) { const x = w.x0 + 0.2 + hash(k, w.z0) * (w.x1 - w.x0 - 0.4), z = w.z0 + 0.15 + hash(w.z0, k) * (w.z1 - w.z0 - 0.3); glow.push(M.moved(M.lathe({ profile: [[0, 0], [0.16, 0], [0.16, 0.012], [0, 0.012]], segments: 8, color: "#3a8a30", emissive: 0.06 }), x, 0.04, z)); if (k === 1) glow.push(M.box({ w: 0.06, h: 0.05, d: 0.06, color: "#ff6ab4", emissive: 0.7, offset: { x, y: 0.07, z } })); }
          for (const zz of [w.z0 + 0.06, w.z1 - 0.06]) for (let k = 0; k < 3; k++) glow.push(M.box({ w: 0.04, h: 0.35 + hash(k, zz) * 0.3, d: 0.04, color: LEAF[k % 4], emissive: 0.04, offset: { x: w.x0 + 0.15 + k * (w.x1 - w.x0 - 0.3) / 2, y: 0.2, z: zz } }));
          continue;
        }
        for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2, rx = (w.x1 - w.x0) / 2 + 0.15, rz = (w.z1 - w.z0) / 2 + 0.15; glow.push(M.bevelBox({ w: 0.35, h: 0.2, d: 0.35, color: STONE[k % 3], emissive: 0.04, bevel: 0.08, offset: { x: (w.x0 + w.x1) / 2 + Math.cos(a) * rx, y: 0.1, z: (w.z0 + w.z1) / 2 + Math.sin(a) * rz } })); }
        fountains.push({ x: (w.x0 + w.x1) / 2, z: (w.z0 + w.z1) / 2 });
      }
      // Bridges: an arched deck of planks over the creek, posts and a rope rail each side, a neon line along each rail.
      for (const br of c.bridges) {
        const L = br.x1 - br.x0, n = 9;
        for (let k = 0; k < n; k++) {
          const u0 = k / n, u1 = (k + 1) / n, y0 = br.H * Math.sin(Math.PI * u0), y1 = br.H * Math.sin(Math.PI * u1), x = br.x0 + L * (u0 + u1) / 2, y = (y0 + y1) / 2, tilt = Math.atan2(y1 - y0, L / n);
          glow.push(M.moved(M.turnedZ(M.box({ w: L / n + 0.02, h: 0.05, d: br.hw * 2 + 0.1, color: LOG[k % 3], emissive: 0.05 }), tilt), x, 0.03 + y - 0.03, br.z));
        }
        for (const sz of [-1, 1]) {
          for (let k = 0; k <= 4; k++) { const u = k / 4, x = br.x0 + L * u, y = br.H * Math.sin(Math.PI * u); glow.push(M.box({ w: 0.09, h: 0.42, d: 0.09, color: LOG[0], emissive: 0.04, offset: { x, y: y + 0.2, z: br.z + sz * (br.hw + 0.04) } })); }
          for (let k = 0; k < 4; k++) { const u0 = k / 4, u1 = (k + 1) / 4, ya = br.H * Math.sin(Math.PI * u0), yb = br.H * Math.sin(Math.PI * u1), tilt = Math.atan2(yb - ya, L / 4);
            glow.push(M.moved(M.turnedZ(M.box({ w: L / 4 + 0.04, h: 0.04, d: 0.04, color: "#b8945a", emissive: 0.05 }), tilt), br.x0 + L * (u0 + u1) / 2, (ya + yb) / 2 + 0.38, br.z + sz * (br.hw + 0.04)),
              M.moved(M.turnedZ(M.box({ w: L / 4 + 0.04, h: 0.025, d: 0.025, color: trim, emissive: 0.85 }), tilt), br.x0 + L * (u0 + u1) / 2, (ya + yb) / 2 + 0.42, br.z + sz * (br.hw + 0.04))); }
        }
      }
      // Cup, flag and tee.
      solid.push(M.moved(M.lathe({ profile: [[0, 0], [G().CUP_R, 0], [G().CUP_R, 0.01], [0, 0.01]], segments: 16, color: "#000000" }), c.cup.x, 0.032, c.cup.z));
      glow.push(M.box({ w: 0.04, h: 1.4, d: 0.04, color: "#d8c8a0", emissive: 0.15, offset: { x: c.cup.x + 0.24, y: 0.7, z: c.cup.z } }), M.box({ w: 0.5, h: 0.32, d: 0.03, color: trim, emissive: 0.9, offset: { x: c.cup.x + 0.5, y: 1.25, z: c.cup.z } }));
      glow.push(M.box({ w: 0.8, h: 0.04, d: 0.8, color: "#9a927e", emissive: 0.06, offset: { x: c.tee.x, y: 0.03, z: c.tee.z } }), M.box({ w: 0.16, h: 0.05, d: 0.16, color: trim, emissive: 0.9, offset: { x: c.tee.x, y: 0.05, z: c.tee.z } }));
      // The hole's sign by its tee, and its carving.
      const lab = label(`HOLE ${i + 1} · PAR ${h.par}`, h.name, { height: 0.5, style: "gold" }), side = cell.flip ? 1 : -1;
      const sg = createNode({ position: { x: c.tee.x + side * 1.4, y: 1.5, z: c.tee.z - 1.6 }, rotation: { x: 0, y: 0, z: 0 }, sightHidden: true });
      addChild(sg, createNode({ geometry: lab.back, sightHidden: true }), createNode({ geometry: lab.face, sightHidden: true }));
      addChild(root, sg);
      const P = (x, z) => ({ x: cell.x + x * (cell.flip ? -1 : 1), z: cell.z + z });
      const prop = (parts, x, z, into = glow) => { const q = P(x, z); for (const g of parts) into.push(M.moved(g, q.x, 0, q.z)); };
      let head = null;
      if (h.prop === "head") {
        // A giant Ooga's head over the tunnel, its face toward the tee: heavy brow, glowing eyes, a broad nose, a beard
        // round the open mouth (teeth over the gap the ball rolls through) and a bone through its hair.
        const f = cell.flip ? 1 : -1, SKIN = "#c98a5a", HAIR = "#3a2414", fx = (x) => x * -f;
        const hp = [];
        prop([
          M.bevelBox({ w: 2.6, h: 3.0, d: 4.4, color: SKIN, emissive: 0.1, bevel: 0.45, offset: { x: 0, y: 2.2, z: 0 } }),
          M.bevelBox({ w: 2.9, h: 1.2, d: 4.7, color: HAIR, emissive: 0.03, bevel: 0.35, offset: { x: fx(-0.1), y: 3.9, z: 0 } }),
          M.box({ w: 0.5, h: 0.45, d: 3.6, color: "#8a5a34", emissive: 0.05, offset: { x: fx(1.35), y: 3.05, z: 0 } }),
          ...[-0.85, 0.85].flatMap((z) => [M.box({ w: 0.12, h: 0.55, d: 0.7, color: "#fff7c8", emissive: 0.4, offset: { x: fx(1.33), y: 2.65, z } }), M.box({ w: 0.14, h: 0.28, d: 0.3, color: "#9cff3a", emissive: 1.1, offset: { x: fx(1.36), y: 2.6, z } })]),
          M.bevelBox({ w: 0.7, h: 0.8, d: 0.9, color: "#b87848", emissive: 0.1, bevel: 0.2, offset: { x: fx(1.55), y: 1.95, z: 0 } }),
          M.bevelBox({ w: 0.5, h: 1.0, d: 3.8, color: HAIR, emissive: 0.03, bevel: 0.2, offset: { x: fx(1.4), y: 0.95, z: 0 } }),
          M.box({ w: 0.2, h: 0.62, d: 0.9, color: "#1a0e08", offset: { x: fx(1.52), y: 0.36, z: 0 } }),
          ...[-0.3, -0.1, 0.1, 0.3].map((z) => M.box({ w: 0.12, h: 0.16, d: 0.14, color: "#fff7e0", emissive: 0.25, offset: { x: fx(1.62), y: 0.62, z } })),
          M.box({ w: 0.24, h: 0.24, d: 3.2, color: "#f4efe4", emissive: 0.2, offset: { x: 0, y: 4.55, z: 0 } }),
          ...[-1.65, 1.65].map((z) => M.bevelBox({ w: 0.42, h: 0.5, d: 0.42, color: "#f4efe4", emissive: 0.2, bevel: 0.12, offset: { x: 0, y: 4.55, z } }))
        ], 0, 0, hp);
        // Its own node, so it steps aside while its hole is played and the tunnel can be seen.
        head = createNode({ geometry: M.merge(...hp), sightHidden: true });
        addChild(root, head);
      } else if (h.prop === "pyramid") {
        // Mossy stone steps, a neon line round each one's lip, and a dark mouth in each side where the hidden tunnel runs
        // right through it.
        const steps = []; for (let k = 0; k < 4; k++) { const w = 3.4 - k * 0.8; steps.push(M.box({ w, h: 0.5, d: w, color: STONE[k % 3], emissive: 0.05, offset: { x: 0, y: 0.25 + k * 0.5, z: 0 } }), M.box({ w: w + 0.04, h: 0.05, d: w + 0.04, color: NEON[k], emissive: 0.8, offset: { x: 0, y: 0.47 + k * 0.5, z: 0 } }), M.box({ w: w * 0.7, h: 0.06, d: w * 0.5, color: LEAF[k], emissive: 0.04, offset: { x: -0.2, y: 0.53 + k * 0.5, z: 0.3 } })); }
        steps.push(M.box({ w: 0.6, h: 0.6, d: 0.6, color: "#d8a040", emissive: 0.5, offset: { x: 0, y: 2.3, z: 0 } }));
        for (const sx of [-1, 1]) steps.push(M.box({ w: 0.04, h: 0.36, d: 0.5, color: "#0a0806", offset: { x: sx * 1.72, y: 0.18, z: 0 } }), M.box({ w: 0.05, h: 0.05, d: 0.62, color: NEON[2], emissive: 0.9, offset: { x: sx * 1.73, y: 0.4, z: 0 } }));
        prop(steps, 0, 0);
      } else if (h.prop === "serpent") {
        const body = []; for (let k = 0; k < 18; k++) { const x = -6.6 + k * 0.66; body.push(M.box({ w: 0.62, h: 0.42, d: 0.62, color: k % 2 ? "#4a8a3a" : "#c8a030", emissive: 0.06, offset: { x, y: 0.22 + Math.abs(Math.sin(k * 0.7)) * 0.3, z: Math.sin(k * 0.9) * 0.12 } })); }
        body.push(M.box({ w: 0.9, h: 0.7, d: 0.8, color: "#4a8a3a", emissive: 0.06, offset: { x: 5.2, y: 0.6, z: 0 } }), M.box({ w: 1.4, h: 0.06, d: 1.2, color: "#ff4fd8", emissive: 0.8, offset: { x: 5.0, y: 1.0, z: 0 } }), ...[-0.22, 0.22].map((z) => M.box({ w: 0.12, h: 0.12, d: 0.12, color: "#ffd23a", emissive: 0.9, offset: { x: 5.62, y: 0.78, z } })));
        prop(body, 0, 0);
      } else if (h.prop === "temple") {
        const t = []; for (let k = 0; k < 3; k++) t.push(M.box({ w: 3 - k * 0.8, h: 0.7, d: 3 - k * 0.8, color: STONE[k], emissive: 0.05, offset: { x: 0, y: 0.35 + k * 0.7, z: 0 } }), M.box({ w: 3.04 - k * 0.8, h: 0.05, d: 3.04 - k * 0.8, color: NEON[(k + 3) % 5], emissive: 0.8, offset: { x: 0, y: 0.67 + k * 0.7, z: 0 } }));
        t.push(M.box({ w: 0.9, h: 0.9, d: 0.9, color: "#f7931a", emissive: 0.7, offset: { x: 0, y: 2.55, z: 0 } }));
        prop(t, 8.6, 0);
      } else if (h.prop === "jaguar") {
        prop([M.box({ w: 1.4, h: 0.8, d: 0.6, color: "#d8a040", emissive: 0.08, offset: { x: 0, y: 0.6, z: 0 } }), M.box({ w: 0.6, h: 0.6, d: 0.6, color: "#d8a040", emissive: 0.08, offset: { x: 0.8, y: 1.1, z: 0 } }), ...[-0.12, 0.12].map((z) => M.box({ w: 0.04, h: 0.1, d: 0.1, color: "#9cff3a", emissive: 1, offset: { x: 1.11, y: 1.2, z } })), ...[[-0.4, 0.15], [0.3, 0.15]].map(([x]) => M.box({ w: 0.2, h: 0.2, d: 0.62, color: "#1a1a1a", offset: { x, y: 0.7, z: 0 } }))], -5.6, -3.2);
        // A volcano beside the dogleg, lava glowing in its crater and down its sides; its smoke is the update's.
        const vq = P(0, -3.4);
        glow.push(M.moved(M.lathe({ profile: [[0, 0], [1.7, 0], [1.1, 1.6], [0.55, 2.4], [0, 2.4]], segments: 10, color: "#4a3a30", emissive: 0.04 }), vq.x, 0, vq.z),
          M.moved(M.lathe({ profile: [[0, 0], [0.5, 0], [0.5, 0.06], [0, 0.06]], segments: 10, color: "#ff5a1a", emissive: 1.6 }), vq.x, 2.38, vq.z),
          ...[0.4, 2, 3.6, 5].map((a) => M.moved(M.turnedY(M.turnedX(M.box({ w: 0.16, h: 1.9, d: 0.06, color: "#ff7a1a", emissive: 1.1 }), 0.52), a), vq.x + Math.sin(a) * 0.95, 1.3, vq.z + Math.cos(a) * 0.95)));
        volcano = { x: vq.x, z: vq.z };
      } else if (h.prop === "stela") {
        prop([M.bevelBox({ w: 1.2, h: 3, d: 0.4, color: STONE[1], emissive: 0.05, bevel: 0.12, offset: { x: 0, y: 1.5, z: 0 } }), M.bevelBox({ w: 1.0, h: 0.3, d: 0.44, color: LEAF[1], emissive: 0.04, bevel: 0.1, offset: { x: 0, y: 3.0, z: 0 } }), ...[0.6, 1.3, 2, 2.6].map((y, k) => M.box({ w: 0.7, h: 0.08, d: 0.42, color: NEON[k], emissive: 0.85, offset: { x: 0, y, z: 0 } }))], 0, 0.6);
      } else if (h.prop === "torches" || h.prop === "beans") {
        for (const x of [-6.6, 6.6]) prop([M.box({ w: 0.14, h: 1.6, d: 0.14, color: "#6b4528", offset: { x: 0, y: 0.8, z: 0 } }), M.box({ w: 0.3, h: 0.4, d: 0.3, color: "#ff7a1a", emissive: 2, offset: { x: 0, y: 1.8, z: 0 } })], x, -2.2);
      }
      let bar = null;
      if (c.bar) {
        glow.push(M.moved(M.turnedX(M.lathe({ profile: [[0, 0], [1.2, 0], [1.2, 0.04], [0, 0.04]], segments: 24, color: "#8a826c", emissive: 0.05 }), 0), c.bar.x, 0.03, c.bar.z));
        bar = createNode({ geometry: M.merge(M.bevelBox({ w: c.bar.len, h: 0.26, d: 0.2, color: LOG[0], emissive: 0.05, bevel: 0.06, offset: { x: 0, y: 0.13, z: 0 } }), M.box({ w: c.bar.len, h: 0.03, d: 0.05, color: "#ff4fd8", emissive: 0.85, offset: { x: 0, y: 0.27, z: 0 } }), M.bevelBox({ w: 0.44, h: 0.5, d: 0.44, color: STONE[0], emissive: 0.05, bevel: 0.12, offset: { x: 0, y: 0.25, z: 0 } }), M.box({ w: 0.2, h: 0.04, d: 0.2, color: "#ffd23a", emissive: 0.9, offset: { x: 0, y: 0.51, z: 0 } })), position: { x: c.bar.x, y: 0, z: c.bar.z }, sightHidden: true });
        addChild(root, bar);
      }
      holes.push({ c, bar, head });
    }
    // The jungle round the course: palms along the walls (clear of the way up), ferns at their feet and along the walls,
    // vines down from the roof over the aisles.
    const jungle = [], perches = [], greens = holes.map((h) => h.c.edge);
    const nearGreen = (x, z, m) => greens.some((e) => G().inside(e, x, z) || G().inside(e, x - m, z) || G().inside(e, x + m, z) || G().inside(e, x, z - m) || G().inside(e, x, z + m));
    const fern = (x, z, sz) => { for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2 + hash(x, z), L = sz * (0.7 + hash(k, x) * 0.5); jungle.push(M.moved(M.turnedY(M.turnedX(M.box({ w: 0.16 * sz, h: 0.03, d: L, color: LEAF[(k + Math.floor(hash(z, x) * 4)) % 4], emissive: 0.04, offset: { x: 0, y: 0, z: L / 2 } }), -0.55), a), x, 0.05, z)); } };
    const palm = (x, z, ht, lean) => {
      const n = 7, la = hash(x, z) * Math.PI * 2;
      for (let k = 0; k < n; k++) { const f = k / n, y = f * ht; jungle.push(M.bevelBox({ w: 0.36 - f * 0.1, h: ht / n + 0.04, d: 0.36 - f * 0.1, color: LOG[k % 3], emissive: 0.03, bevel: 0.06, offset: { x: x + Math.sin(la) * lean * f * f, y: y + ht / n / 2, z: z + Math.cos(la) * lean * f * f } })); }
      const tx = x + Math.sin(la) * lean, tz = z + Math.cos(la) * lean;
      for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2 + 0.3, L = 2.4 + hash(k, z) * 0.8; jungle.push(M.moved(M.turnedY(M.turnedX(M.box({ w: 0.55, h: 0.04, d: L, color: LEAF[k % 4], emissive: 0.04, offset: { x: 0, y: 0, z: L / 2 } }), 0.42), a), tx, ht, tz)); }
      for (let k = 0; k < 3; k++) jungle.push(M.bevelBox({ w: 0.2, h: 0.22, d: 0.2, color: "#5a3a1a", emissive: 0.03, bevel: 0.06, offset: { x: tx + Math.sin(k * 2.1) * 0.2, y: ht - 0.22, z: tz + Math.cos(k * 2.1) * 0.2 } }));
      perches.push({ x: tx, y: ht + 0.05, z: tz });
      fern(x + 0.6, z + 0.3, 0.9); fern(x - 0.5, z - 0.4, 0.8);
    };
    const IN = { x: -C.w / 2 + 3, z: -20 };
    for (const z of [-C.d / 2 + 2.2, C.d / 2 - 2.2]) for (let x = -C.w / 2 + 3; x < C.w / 2 - 2; x += 7.5) if (Math.hypot(x - IN.x, z - IN.z) > 6) palm(x, z, 5.6 + hash(x, z) * 1.6, 0.6 + hash(z, x) * 0.6);
    for (const x of [-C.w / 2 + 2.2, C.w / 2 - 2.2]) for (const z of [-13, 0, 13]) if (Math.hypot(x - IN.x, z - IN.z) > 6) palm(x, z, 5.2 + hash(x, z) * 1.6, 0.5 + hash(z, x) * 0.5);
    for (let k = 0; k < 60; k++) { const x = (hash(k, 3) - 0.5) * (C.w - 3), z = (hash(3, k) - 0.5) * (C.d - 3); if (!nearGreen(x, z, 1.2) && Math.hypot(x - IN.x, z - IN.z) > 3 && (Math.abs(x) > C.w / 2 - 6 || Math.abs(z) > C.d / 2 - 5 || hash(k, 9) < 0.35)) fern(x, z, 0.6 + hash(k, 5) * 0.5); }
    for (let k = 0; k < 40; k++) { const x = (hash(k, 11) - 0.5) * (C.w - 4), z = (hash(11, k) - 0.5) * (C.d - 4), L = 1.2 + hash(k, 13) * 2.4; jungle.push(M.box({ w: 0.06, h: L, d: 0.06, color: LEAF[k % 4], emissive: 0.03, offset: { x, y: C.h - L / 2, z } })); for (let q = 0; q < 3; q++) jungle.push(M.box({ w: 0.24, h: 0.03, d: 0.14, color: LEAF[(k + q) % 4], emissive: 0.03, offset: { x: x + (q % 2 ? 0.1 : -0.1), y: C.h - L * (q + 1) / 3.4, z } })); }
    // Rock columns holding up the roof in the aisles, banded in neon as the hall's pillars are; glowing mushrooms in
    // clumps at their feet and along the walls; lanterns on vines over the tees; patches of moss and dirt on the floor.
    const COLS = [[-11, -7], [11, -7], [-11, 7], [11, 7], [-33, 7], [33, -7]];
    COLS.forEach(([x, z], k) => {
      for (let y = 0; y < C.h; y += 1.5) jungle.push(M.bevelBox({ w: 1.5 - (y % 3 ? 0.15 : 0), h: 1.55, d: 1.5 - (y % 3 ? 0 : 0.15), color: STONE[(k + Math.round(y / 1.5)) % 3], emissive: 0.03, bevel: 0.3, offset: { x, y: y + 0.75, z } }));
      for (const y of [1.2, 3.6, 6.2]) glow.push(M.moved(M.lathe({ profile: [[0.82, 0], [0.86, 0], [0.86, 0.09], [0.82, 0.09]], segments: 10, color: NEON[(k + Math.round(y)) % 5], emissive: 1.0 }), x, y, z));
      jungle.push(M.bevelBox({ w: 1.2, h: 0.25, d: 1.2, color: LEAF[k % 4], emissive: 0.04, bevel: 0.1, offset: { x, y: 4.6, z: z + 0.2 } }));
    });
    const MUSH = ["#ff7a1a", "#3ad8ff", "#ff4fd8", "#9cff3a"];
    const mushroom = (x, z, sz, ink) => { jungle.push(M.box({ w: 0.07 * sz, h: 0.3 * sz, d: 0.07 * sz, color: "#e8dcc0", emissive: 0.15, offset: { x, y: 0.15 * sz, z } })); glow.push(M.moved(M.lathe({ profile: [[0, 0], [0.2 * sz, 0], [0.16 * sz, 0.08 * sz], [0, 0.11 * sz]], segments: 8, color: ink, emissive: 0.9 }), x, 0.28 * sz, z)); };
    for (const [x, z] of COLS) for (let k = 0; k < 4; k++) mushroom(x + Math.cos(k * 1.7) * 1.1, z + Math.sin(k * 1.7) * 1.1, 0.8 + hash(x + k, z) * 0.8, MUSH[(k + Math.floor(hash(z, x) * 4)) % 4]);
    for (let k = 0; k < 40; k++) { const x = (hash(k, 31) - 0.5) * (C.w - 3), z = (hash(31, k) - 0.5) * (C.d - 3); if (!nearGreen(x, z, 0.8) && Math.hypot(x - IN.x, z - IN.z) > 3) mushroom(x, z, 0.6 + hash(k, 33) * 0.9, MUSH[k % 4]); }
    for (let k = 0; k < 70; k++) { const x = (hash(k, 41) - 0.5) * (C.w - 2), z = (hash(41, k) - 0.5) * (C.d - 2), r = 0.6 + hash(k, 43) * 1.6; if (!nearGreen(x, z, r)) solid.push(M.box({ w: r * 2, h: 0.02, d: r * 1.4, color: k % 3 ? "#3e5a2a" : "#4a3a26", offset: { x, y: 0.01, z } })); }
    for (const h of holes) { const t = h.c.tee, side = h.c.cell.flip ? -1 : 1; jungle.push(M.box({ w: 0.04, h: C.h - 3.2, d: 0.04, color: LEAF[1], emissive: 0.03, offset: { x: t.x - side * 1.2, y: 3.2 + (C.h - 3.2) / 2, z: t.z + 1.2 } })); glow.push(M.box({ w: 0.3, h: 0.4, d: 0.3, color: "#ffb84a", emissive: 1.2, offset: { x: t.x - side * 1.2, y: 3.0, z: t.z + 1.2 } }), M.box({ w: 0.36, h: 0.06, d: 0.36, color: LOG[2], offset: { x: t.x - side * 1.2, y: 3.23, z: t.z + 1.2 } })); }
    addChild(root, createNode({ geometry: M.merge(...solid), sightHidden: true }), createNode({ geometry: M.merge(...glow), sightHidden: true }), createNode({ geometry: M.merge(...jungle), sightHidden: true }));
    // Fish in every pond and creek: koi swimming slow loops just under the surface.
    const KOI = ["#ff7a2a", "#f4efe4", "#ffcf3a", "#e8402a"];
    const koiGeo = KOI.map((ink) => M.merge(M.bevelBox({ w: 0.08, h: 0.04, d: 0.22, color: ink, emissive: 0.25, bevel: 0.02 }), M.box({ w: 0.1, h: 0.015, d: 0.07, color: ink, emissive: 0.25, offset: { x: 0, y: 0, z: -0.14 } }), M.box({ w: 0.05, h: 0.03, d: 0.05, color: "#1a1a1a", offset: { x: 0, y: 0.01, z: 0.06 } })));
    const fish = [];
    for (const w of ponds) {
      const n = w.creek ? 2 : 3;
      for (let k = 0; k < n; k++) { const f = createNode({ geometry: koiGeo[(fish.length) % 4], position: { x: (w.x0 + w.x1) / 2, y: 0.045, z: (w.z0 + w.z1) / 2 }, sightHidden: true }); addChild(root, f); fish.push({ n: f, w, ph: hash(fish.length, 7) * 6.3, sp: (0.25 + hash(7, fish.length) * 0.3) * (k % 2 ? 1 : -1) }); }
    }
    // Confetti for a big moment: a fixed pool of bright bits thrown up round the cup (the update's).
    const bitGeo = NEON.map((ink) => M.box({ w: 0.07, h: 0.07, d: 0.02, color: ink, emissive: 1.1 })), confetti = [];
    for (let k = 0; k < 48; k++) { const b = createNode({ geometry: bitGeo[k % NEON.length], visible: false, sightHidden: true }); addChild(root, b); confetti.push({ n: b, vx: 0, vy: 0, vz: 0, life: 0 }); }
    // Parrots: a few flying circuits under the roof, wings flapping, and a few sat on palm tops, now and then bobbing.
    const parrotGeo = PARROTS.map(([body, wing, belly]) => ({
      body: M.merge(M.bevelBox({ w: 0.24, h: 0.26, d: 0.46, color: body, emissive: 0.08, bevel: 0.08, offset: { x: 0, y: 0, z: 0 } }), M.bevelBox({ w: 0.2, h: 0.2, d: 0.2, color: body, emissive: 0.08, bevel: 0.06, offset: { x: 0, y: 0.14, z: 0.26 } }),
        M.box({ w: 0.18, h: 0.12, d: 0.24, color: belly, emissive: 0.08, offset: { x: 0, y: -0.08, z: 0.06 } }), M.box({ w: 0.08, h: 0.1, d: 0.1, color: "#2a2420", offset: { x: 0, y: 0.1, z: 0.4 } }),
        M.box({ w: 0.04, h: 0.04, d: 0.04, color: "#f4f0e0", emissive: 0.3, offset: { x: 0.1, y: 0.18, z: 0.3 } }), M.box({ w: 0.04, h: 0.04, d: 0.04, color: "#f4f0e0", emissive: 0.3, offset: { x: -0.1, y: 0.18, z: 0.3 } }),
        M.box({ w: 0.12, h: 0.04, d: 0.5, color: wing, emissive: 0.08, offset: { x: 0, y: -0.02, z: -0.44 } }), M.box({ w: 0.08, h: 0.03, d: 0.3, color: body, emissive: 0.08, offset: { x: 0, y: 0.01, z: -0.64 } })),
      left: M.merge(M.box({ w: 0.26, h: 0.03, d: 0.3, color: belly, emissive: 0.08, offset: { x: 0.13, y: 0, z: 0 } }), M.box({ w: 0.3, h: 0.03, d: 0.26, color: wing, emissive: 0.08, offset: { x: 0.4, y: 0, z: -0.02 } })),
      right: M.merge(M.box({ w: 0.26, h: 0.03, d: 0.3, color: belly, emissive: 0.08, offset: { x: -0.13, y: 0, z: 0 } }), M.box({ w: 0.3, h: 0.03, d: 0.26, color: wing, emissive: 0.08, offset: { x: -0.4, y: 0, z: -0.02 } }))
    }));
    const parrots = [];
    for (let k = 0; k < 9; k++) {
      const g = parrotGeo[k % 3], n = createNode({ geometry: g.body, scale: { x: 1.2, y: 1.2, z: 1.2 }, sightHidden: true });
      const lw = createNode({ geometry: g.left, position: { x: 0.12, y: 0.06, z: 0 }, sightHidden: true }), rw = createNode({ geometry: g.right, position: { x: -0.12, y: 0.06, z: 0 }, sightHidden: true });
      addChild(n, lw, rw); addChild(root, n);
      const perch = k >= 6 ? perches[Math.floor(hash(k, 17) * perches.length)] : null;
      parrots.push({ n, lw, rw, perch, cx: (hash(k, 19) - 0.5) * (C.w - 20), cz: (hash(19, k) - 0.5) * (C.d - 16), r: 6 + hash(k, 21) * 8, y: 6.2 + hash(k, 23) * 1.8, w: (0.35 + hash(k, 25) * 0.25) * (k % 2 ? 1 : -1), ph: hash(k, 27) * 6.3 });
    }
    // The fountains' jets, the volcano's smoke and the Oogas' bamboo airship drifting round under the roof.
    const jetGeo = M.box({ w: 0.07, h: 1, d: 0.07, color: "#cfefff", emissive: 0.8 }), jets = [];
    for (const f of fountains) for (let k = 0; k < 3; k++) { const n = createNode({ geometry: jetGeo, position: { x: f.x + (k - 1) * 0.3, y: 0, z: f.z }, sightHidden: true }); addChild(root, n); jets.push({ n, k }); }
    const smokeGeo = M.bevelBox({ w: 0.5, h: 0.5, d: 0.5, color: "#5a5050", emissive: 0.05, bevel: 0.15 }), smoke = [];
    if (volcano) for (let k = 0; k < 5; k++) { const n = createNode({ geometry: smokeGeo, position: { x: volcano.x, y: 2.5, z: volcano.z }, sightHidden: true }); addChild(root, n); smoke.push({ n, k }); }
    const airship = createNode({ sightHidden: true });
    addChild(airship, createNode({ geometry: M.merge(
      M.turnedZ(M.lathe({ profile: [[0, -3.2], [0.7, -2.7], [1.05, -1.5], [1.15, 0], [1.05, 1.5], [0.7, 2.7], [0, 3.2]], segments: 14, color: "#c8a060", emissive: 0.08 }), Math.PI / 2),
      ...[-2, -1, 0, 1, 2].map((x) => M.moved(M.turnedZ(M.lathe({ profile: [[1.0, -0.06], [1.18 - Math.abs(x) * 0.1, -0.06], [1.18 - Math.abs(x) * 0.1, 0.06], [1.0, 0.06]], segments: 14, color: "#5a3a22", emissive: 0.04 }), Math.PI / 2), x, 0, 0)),
      M.box({ w: 1.6, h: 0.5, d: 0.7, color: "#7a5534", emissive: 0.06, offset: { x: 0, y: -1.45, z: 0 } }),
      M.box({ w: 0.06, h: 0.4, d: 0.06, color: "#3a2a1a", offset: { x: -0.6, y: -1.05, z: 0 } }), M.box({ w: 0.06, h: 0.4, d: 0.06, color: "#3a2a1a", offset: { x: 0.6, y: -1.05, z: 0 } }),
      M.box({ w: 0.8, h: 0.9, d: 0.06, color: "#ff4fd8", emissive: 0.7, offset: { x: -3.0, y: 0.5, z: 0 } }), M.box({ w: 0.8, h: 0.06, d: 0.9, color: "#ff4fd8", emissive: 0.7, offset: { x: -3.0, y: 0, z: 0 } }),
      M.box({ w: 0.6, h: 0.2, d: 0.04, color: "#ffd23a", emissive: 2, offset: { x: 0, y: -1.45, z: 0.37 } })), sightHidden: true }));
    addChild(root, airship);
    // The ball and the aiming dots.
    const ballNode = createNode({ geometry: M.lathe({ profile: [[0, 0], [0.07, 0.015], [0.1, 0.1], [0.07, 0.185], [0, 0.2]], segments: 10, color: "#f4fff8", emissive: 1.0 }), visible: false, sightHidden: true });
    addChild(root, ballNode);
    const dotGeo = M.box({ w: 0.07, h: 0.03, d: 0.07, color: "#ffffff", emissive: 1.1 }), dots = [];
    for (let k = 0; k < 10; k++) { const d = createNode({ geometry: dotGeo, visible: false, sightHidden: true }); addChild(root, d); dots.push(d); }
    // The marquesita stand by the way in: a wooden cart on two wheels under a striped awning, its hot iron press,
    // jars of chocolate spread and cajeta, bananas, strawberries, a red-waxed cheese and rolled marquesitas standing
    // in a cup, its sign and menu; beside it a rack of golf gear (visors, bags and putters) under its own sign. Each is
    // its own node, so the scene can make them clickable; `shop` says where they stand in the museum's frame.
    const SHOP = { stand: { x: -29.8, z: -23.6 }, rack: { x: -33.6, z: -24.6 }, kiosk: { x: -36.0, z: -24.6 } };
    const cart = [], WOOD = "#8a5a34", WOOD_DK = "#5e3c22";
    cart.push(M.bevelBox({ w: 2.2, h: 0.9, d: 0.9, color: WOOD, emissive: 0.05, bevel: 0.06, offset: { x: 0, y: 0.75, z: 0 } }),
      M.box({ w: 2.3, h: 0.08, d: 1.0, color: WOOD_DK, emissive: 0.05, offset: { x: 0, y: 1.24, z: 0 } }),
      ...[-1, 1].map((sx) => M.moved(M.turnedZ(M.lathe({ profile: [[0, -0.06], [0.42, -0.06], [0.42, 0.06], [0, 0.06]], segments: 12, color: WOOD_DK, emissive: 0.04 }), Math.PI / 2), sx * 0.8, 0.42, 0.48)),
      ...[-1, 1].map((sx) => M.moved(M.turnedZ(M.lathe({ profile: [[0.06, -0.07], [0.12, -0.07], [0.12, 0.07], [0.06, 0.07]], segments: 10, color: "#ffd23a", emissive: 0.7 }), Math.PI / 2), sx * 0.8, 0.42, 0.49)),
      ...[-1, 1].flatMap((sx) => [-1, 1].map((sz) => M.box({ w: 0.07, h: 1.5, d: 0.07, color: WOOD_DK, offset: { x: sx * 1.05, y: 2.0, z: sz * 0.4 } }))));
    // The awning: stripes of pink and yellow, and a neon line along its front edge.
    for (let k = 0; k < 8; k++) cart.push(M.moved(M.turnedX(M.box({ w: 0.3, h: 0.04, d: 1.3, color: k % 2 ? "#ffd23a" : "#ff4fd8", emissive: 0.25 }), -0.22), -1.05 + 0.3 * k, 2.8, 0.05));
    cart.push(M.box({ w: 2.45, h: 0.05, d: 0.05, color: "#ff4fd8", emissive: 1.1, offset: { x: 0, y: 2.66, z: 0.68 } }));
    for (let k = 0; k < 8; k++) cart.push(M.box({ w: 0.26, h: 0.14, d: 0.03, color: k % 2 ? "#ff4fd8" : "#ffd23a", emissive: 0.3, offset: { x: -1.05 + 0.3 * k, y: 2.57, z: 0.69 } }));
    // The press, its two iron plates and handle; a marquesita on it, curling.
    cart.push(M.box({ w: 0.6, h: 0.08, d: 0.5, color: "#2a2a2e", emissive: 0.05, offset: { x: -0.55, y: 1.32, z: 0 } }),
      M.box({ w: 0.5, h: 0.03, d: 0.4, color: "#e8b060", emissive: 0.15, offset: { x: -0.55, y: 1.37, z: 0.02 } }), M.box({ w: 0.05, h: 0.05, d: 0.5, color: "#ff7a1a", emissive: 1.2, offset: { x: -0.55, y: 1.29, z: 0.26 } }));
    // The fillings: jars, bananas, strawberries, the cheese, and rolled marquesitas in a cup.
    for (const [ink, x] of [["#4a2a18", -0.05], ["#c87830", 0.18], ["#d8c8a0", 0.41]]) cart.push(M.moved(M.lathe({ profile: [[0, 0], [0.08, 0], [0.08, 0.16], [0.06, 0.18], [0, 0.18]], segments: 10, color: ink, emissive: 0.08 }), x, 1.28, -0.2), M.moved(M.box({ w: 0.15, h: 0.03, d: 0.15, color: "#e8e0d0", emissive: 0.1 }), x, 1.47, -0.2));
    for (let k = 0; k < 4; k++) cart.push(M.moved(M.turnedZ(M.bevelBox({ w: 0.24, h: 0.05, d: 0.06, color: "#f4d23a", emissive: 0.2, bevel: 0.02 }), 0.3 - k * 0.2), 0.75, 1.32 + k * 0.02, -0.25 + k * 0.05));
    for (let k = 0; k < 6; k++) cart.push(M.bevelBox({ w: 0.07, h: 0.07, d: 0.07, color: "#e8302a", emissive: 0.25, bevel: 0.02, offset: { x: 0.55 + (k % 3) * 0.09, y: 1.32 + Math.floor(k / 3) * 0.06, z: 0.15 + (k % 2) * 0.05 } }));
    cart.push(M.moved(M.lathe({ profile: [[0, 0], [0.11, 0], [0.13, 0.1], [0.08, 0.2], [0, 0.21]], segments: 10, color: "#d8282a", emissive: 0.15 }), 0.95, 1.28, 0.1));
    cart.push(M.moved(M.lathe({ profile: [[0, 0], [0.1, 0], [0.12, 0.2], [0, 0.2]], segments: 10, color: "#3ad8ff", emissive: 0.5 }), 0.2, 1.28, 0.25));
    for (let k = 0; k < 4; k++) cart.push(M.moved(M.turnedZ(M.lathe({ profile: [[0, 0], [0.035, 0], [0.035, 0.4], [0, 0.4]], segments: 8, color: "#e8b060", emissive: 0.15 }), (k - 1.5) * 0.12), 0.2 + (k - 1.5) * 0.03, 1.38, 0.25 + (k % 2) * 0.02));
    // The sign over the awning and the menu on the cart's front.
    cart.push(M.box({ w: 2.0, h: 0.5, d: 0.08, color: "#2a1a10", emissive: 0.05, offset: { x: 0, y: 3.2, z: 0.3 } }), M.box({ w: 2.06, h: 0.04, d: 0.04, color: "#ffd23a", emissive: 1.1, offset: { x: 0, y: 3.47, z: 0.35 } }), M.box({ w: 2.06, h: 0.04, d: 0.04, color: "#ffd23a", emissive: 1.1, offset: { x: 0, y: 2.93, z: 0.35 } }));
    const standNode = createNode({ geometry: M.merge(...cart), position: { x: SHOP.stand.x, y: 0, z: SHOP.stand.z }, sightHidden: true });
    addChild(root, standNode);
    // The press's lid on a hinge along its back edge, a handle at its front; the cook opens and closes it.
    const lid = createNode({ geometry: M.merge(M.box({ w: 0.6, h: 0.06, d: 0.5, color: "#34343a", emissive: 0.05, offset: { x: 0, y: 0.03, z: 0.25 } }), M.box({ w: 0.08, h: 0.06, d: 0.3, color: "#5e3c22", offset: { x: 0, y: 0.06, z: 0.62 } })),
      position: { x: SHOP.stand.x - 0.55, y: 1.36, z: SHOP.stand.z - 0.25 }, rotation: { x: -1.1, y: 0, z: 0 }, sightHidden: true });
    addChild(root, lid);
    // The cook: an Ooga of the house (a name no login has) behind the cart in a chef's hat, facing the customers.
    let cook = null;
    if (BL.contributors && BL.models.caveman) {
      const fig = BL.models.caveman(BL.contributors.traitsFor("marquesita-cook/glow-golf")), P = fig.parts;
      P.club.visible = false; if (P.gun) P.gun.visible = false;
      const hat = createNode({ geometry: M.merge(M.lathe({ profile: [[0, 0], [0.17, 0], [0.17, 0.05], [0.15, 0.06], [0.15, 0.2], [0.2, 0.26], [0.18, 0.33], [0, 0.35]], segments: 12, color: "#f4f2ec", emissive: 0.2 }), M.lathe({ profile: [[0.172, 0], [0.18, 0], [0.18, 0.05], [0.172, 0.05]], segments: 12, color: "#ff4fd8", emissive: 0.8 })) });
      P.hat.visible = true; addChild(P.hat, hat);
      fig.root.position.x = SHOP.stand.x - 0.35; fig.root.position.z = SHOP.stand.z - 0.85; fig.root.position.y = fig.traits.height * 5 / 16;
      addChild(root, fig.root);
      cook = { fig, P, x: fig.root.position.x, z: fig.root.position.z, h: fig.traits.height };
    }
    // The marquesita being handed over: a golden roll with chocolate along it, and steam off the press.
    const treat = createNode({ geometry: M.merge(M.turnedZ(M.lathe({ profile: [[0, -0.14], [0.045, -0.14], [0.05, 0.14], [0, 0.14]], segments: 10, color: "#e8b060", emissive: 0.2 }), Math.PI / 2), M.box({ w: 0.26, h: 0.015, d: 0.03, color: "#4a2a18", emissive: 0.1, offset: { x: 0, y: 0.045, z: 0 } })), visible: false, sightHidden: true });
    addChild(root, treat);
    const steamGeo = M.bevelBox({ w: 0.14, h: 0.14, d: 0.14, color: "#e8eef2", emissive: 0.3, bevel: 0.05 }), steam = [];
    for (let k = 0; k < 5; k++) { const n = createNode({ geometry: steamGeo, position: { x: SHOP.stand.x - 0.55, y: 1.5, z: SHOP.stand.z }, sightHidden: true }); addChild(root, n); steam.push({ n, ph: k / 5 }); }
    { const w = label("MARQUESITAS", "crispy rolled crepes · click to eat one", { height: 0.42, style: "gold" }), sn = createNode({ position: { x: SHOP.stand.x, y: 3.2, z: SHOP.stand.z + 0.36 }, sightHidden: true }); addChild(sn, createNode({ geometry: w.back, sightHidden: true }), createNode({ geometry: w.face, sightHidden: true })); addChild(root, sn); }
    { const w = label("CHOCOLATE · BANANA · STRAWBERRY", "cajeta · cheese · the works", { height: 0.3, style: "plain" }), sn = createNode({ position: { x: SHOP.stand.x, y: 0.85, z: SHOP.stand.z + 0.47 }, sightHidden: true }); addChild(sn, createNode({ geometry: w.back, sightHidden: true }), createNode({ geometry: w.face, sightHidden: true })); addChild(root, sn); }
    // The gear rack: a timber frame with visors hanging in the course's neon colours, two bags of putters on stands.
    const rack = [];
    rack.push(...[-1, 1].map((sx) => M.box({ w: 0.1, h: 2.0, d: 0.1, color: WOOD_DK, offset: { x: sx * 0.9, y: 1.0, z: 0 } })), M.box({ w: 1.9, h: 0.08, d: 0.08, color: WOOD, offset: { x: 0, y: 1.9, z: 0 } }), M.box({ w: 1.9, h: 0.06, d: 0.06, color: WOOD, offset: { x: 0, y: 1.35, z: 0 } }),
      M.bevelBox({ w: 2.0, h: 0.1, d: 0.6, color: WOOD_DK, bevel: 0.03, offset: { x: 0, y: 0.05, z: 0 } }));
    NEON.forEach((ink, k) => { const x = -0.7 + k * 0.35; rack.push(M.box({ w: 0.02, h: 0.15, d: 0.02, color: "#cfcfcf", offset: { x, y: 1.8, z: 0 } }), M.box({ w: 0.24, h: 0.06, d: 0.2, color: ink, emissive: 0.7, offset: { x, y: 1.68, z: 0.04 } }), M.box({ w: 0.24, h: 0.015, d: 0.14, color: ink, emissive: 0.7, offset: { x, y: 1.66, z: 0.17 } })); });
    for (const sx of [-0.55, 0.55]) {
      rack.push(M.moved(M.turnedX(M.lathe({ profile: [[0, 0], [0.12, 0], [0.13, 0.7], [0.11, 0.78], [0, 0.78]], segments: 12, color: sx < 0 ? "#2a6aff" : "#e8302a", emissive: 0.15 }), -0.15), sx, 0.1, 0.05));
      for (let k = 0; k < 3; k++) rack.push(M.moved(M.turnedX(M.box({ w: 0.025, h: 0.5, d: 0.025, color: "#cfd4da", emissive: 0.2 }), -0.15), sx + (k - 1) * 0.05, 0.95, -0.07), M.moved(M.box({ w: 0.12, h: 0.05, d: 0.05, color: "#9aa0a8", emissive: 0.2 }), sx + (k - 1) * 0.05, 1.2, -0.11));
      rack.push(M.moved(M.turnedX(M.box({ w: 0.27, h: 0.04, d: 0.27, color: "#ffd23a", emissive: 0.8 }), -0.15), sx, 0.5, 0.0));
    }
    const rackNode = createNode({ geometry: M.merge(...rack), position: { x: SHOP.rack.x, y: 0, z: SHOP.rack.z }, sightHidden: true });
    addChild(root, rackNode);
    { const w = label("GOLF GEAR", "click to try on a visor and bag", { height: 0.36, style: "gold" }), sn = createNode({ position: { x: SHOP.rack.x, y: 2.3, z: SHOP.rack.z + 0.06 }, sightHidden: true }); addChild(sn, createNode({ geometry: w.back, sightHidden: true }), createNode({ geometry: w.face, sightHidden: true })); addChild(root, sn); }
    // The teesniper.app kiosk in the corner: a stone post with a screen in a green neon frame, a little flag on top, and
    // its sign; a click opens its window with the link out to the app (Bitclank Bill's, for booking real tee times).
    const kiosk = [
      M.bevelBox({ w: 0.7, h: 1.1, d: 0.5, color: STONE[1], emissive: 0.04, bevel: 0.12, offset: { x: 0, y: 0.55, z: 0 } }),
      M.moved(M.turnedX(M.box({ w: 0.9, h: 0.6, d: 0.08, color: "#10261a", emissive: 0.4 }), -0.35), 0, 1.35, 0.05),
      ...[[0.9, 0.04, 0, 0.3], [0.9, 0.04, 0, -0.3], [0.04, 0.6, 0.45, 0], [0.04, 0.6, -0.45, 0]].map(([w, h, x, y]) => M.moved(M.turnedX(M.box({ w, h, d: 0.04, color: "#39ff7a", emissive: 1.1, offset: { x, y, z: 0.05 } }), -0.35), 0, 1.35, 0.05)),
      ...[[0.36, 0.035, 0, 0], [0.035, 0.36, 0, 0]].map(([w, h]) => M.moved(M.turnedX(M.box({ w, h, d: 0.02, color: "#39ff7a", emissive: 1.2, offset: { x: 0, y: 0, z: 0.1 } }), -0.35), 0, 1.35, 0.05)),
      M.moved(M.turnedX(M.lathe({ profile: [[0.12, -0.01], [0.15, -0.01], [0.15, 0.01], [0.12, 0.01]], segments: 16, color: "#39ff7a", emissive: 1.2 }), Math.PI / 2 - 0.35), 0, 1.35, 0.14),
      M.box({ w: 0.03, h: 0.9, d: 0.03, color: "#e8e0d0", emissive: 0.2, offset: { x: 0.28, y: 2.05, z: -0.1 } }), M.box({ w: 0.3, h: 0.18, d: 0.02, color: "#ff4fd8", emissive: 0.9, offset: { x: 0.43, y: 2.4, z: -0.1 } })
    ];
    const kioskNode = createNode({ geometry: M.merge(...kiosk), position: { x: SHOP.kiosk.x, y: 0, z: SHOP.kiosk.z }, sightHidden: true });
    addChild(root, kioskNode);
    { const w = label("TEESNIPER.APP", "book a real tee time · click", { height: 0.3, style: "gold" }), sn = createNode({ position: { x: SHOP.kiosk.x - 0.1, y: 2.75, z: SHOP.kiosk.z - 0.05 }, sightHidden: true }); addChild(sn, createNode({ geometry: w.back, sightHidden: true }), createNode({ geometry: w.face, sightHidden: true })); addChild(root, sn); }
    const shop = {
      lid, cook, treat, steam, press: { x: SHOP.stand.x - 0.55, y: 1.4, z: SHOP.stand.z },
      kiosk: { node: kioskNode, x: C.x + SHOP.kiosk.x, z: C.z + SHOP.kiosk.z, at: { x: C.x + SHOP.kiosk.x + 0.3, z: C.z + SHOP.kiosk.z + 1.2 } },
      stand: { node: standNode, x: C.x + SHOP.stand.x, z: C.z + SHOP.stand.z, at: { x: C.x + SHOP.stand.x, z: C.z + SHOP.stand.z + 1.5 } },
      rack: { node: rackNode, x: C.x + SHOP.rack.x, z: C.z + SHOP.rack.z, at: { x: C.x + SHOP.rack.x, z: C.z + SHOP.rack.z + 1.2 } },
      boxes: [{ x0: C.x + SHOP.stand.x - 1.25, x1: C.x + SHOP.stand.x + 1.25, z0: C.z + SHOP.stand.z - 0.55, z1: C.z + SHOP.stand.z + 0.6 }, { x0: C.x + SHOP.rack.x - 1.0, x1: C.x + SHOP.rack.x + 1.0, z0: C.z + SHOP.rack.z - 0.35, z1: C.z + SHOP.rack.z + 0.35 }, { x0: C.x + SHOP.kiosk.x - 0.4, x1: C.x + SHOP.kiosk.x + 0.4, z0: C.z + SHOP.kiosk.z - 0.3, z1: C.z + SHOP.kiosk.z + 0.3 }]
    };
    const columns = COLS.map(([x, z]) => ({ x0: C.x + x - 0.8, x1: C.x + x + 0.8, z0: C.z + z - 0.8, z1: C.z + z + 0.8 }));
    return { root, holes, ballNode, dots, jets, smoke, airship, volcano, parrots, fish, confetti, columns, shop };
  };
  // The game, driven by the scene: `start(i)` at a tee, keys, update and the overlay.
  const controller = (B, host) => {
    const GC = G(), C = GC.CAVERN, ball = GC.createBall(), scores = new Int8Array(9);
    const st = { mode: "walk", hole: -1, aim: 0, power: 0, charging: false, t: 0, meter: 0, wait: 0, played: 0, via: 0, sink: -1, splashes: 0, bumps: 0, bumpAt: 0, cheer: 0, cheerText: "", dripAt: 0, club: 0, follow: 0, order: -1, bites: 0 };
    const local = { x: 0, z: 0 };
    const world = (x, z, out) => { out.x = C.x + x; out.z = C.z + z; return out; };
    const at = { x: 0, z: 0 }, cam = { x: 0, z: 0 };
    const standBeside = () => {
      const s = Math.sin(st.aim), c = Math.cos(st.aim);
      world(ball.x - s * 0.42 + c * 0.1, ball.z - c * 0.42 - s * 0.1, at);
      host.standAt(at.x, at.z, st.aim);
    };
    // Ready for the next stroke, aimed at the cup (or the hole's next turn, while it has one ahead).
    const aimAhead = (c) => {
      while (st.via < c.via.length && Math.hypot(ball.x - c.via[st.via].x, ball.z - c.via[st.via].z) < 1.8) st.via++;
      const tgt = st.via < c.via.length ? c.via[st.via] : c.cup;
      st.aim = Math.atan2(tgt.x - ball.x, tgt.z - ball.z);
    };
    // The marquesita cook (genesis-golf.js `shop`): between orders he works the press on a slow loop; an order (`order`)
    // has him close the lid on fresh batter (a clank, the sizzle up), open it, roll the marquesita and hand it across
    // the counter into the visitor's Ooga's hand, which eats it in three crunching bites; then the host's `eat` grows
    // its belly. Times in seconds from the order.
    const ORDER = { close: 0.5, open: 2.3, roll: 2.9, hand: 3.7, bites: [4.1, 4.6, 5.1], done: 5.5 };
    const HAND = { x: 0, y: 0, z: 0 }, FROM = { x: 0, y: 0, z: 0 };
    const order = () => { if (st.order >= 0 || !B.shop.cook) return false; st.order = 0; st.bites = 0; sfx.wake(); return true; };
    const handOf = (a, out) => { const r = a.root, ry = r.rotation.y; out.x = r.position.x + Math.sin(ry) * 0.32 - C.x; out.z = r.position.z + Math.cos(ry) * 0.32 - C.z; out.y = r.position.y - host.top + 0.15; return out; };
    const updateCook = (dt) => {
      const S = B.shop, K = S.cook;
      if (!K) return;
      const P = K.P;
      let lidA, armR = -0.5, armL = -0.45, turn = 0, near = 0;
      const L = host.listener ? host.listener() : null;
      if (L) near = Math.max(0, 1 - Math.hypot(L.x - C.x - K.x, L.z - C.z - K.z) / 9);
      if (st.order < 0) {
        // The idle loop: lid down for a while (pressing, sizzling), up to check, down again.
        const k = (st.t % 5) / 5;
        lidA = k < 0.7 ? 0 : -1.1 * Math.sin((k - 0.7) / 0.3 * Math.PI);
        armR = k < 0.7 ? -0.75 + Math.sin(st.t * 3) * 0.06 : -1.0; armL = -0.4 + Math.sin(st.t * 1.3) * 0.08;
        if (Math.floor(st.t / 5) !== Math.floor((st.t - dt) / 5)) sfx.clank(near * 0.6);
        sfx.sizzle(near * (k < 0.7 ? 0.08 : 0.03));
        S.treat.visible = false;
      } else {
        const t = (st.order += dt), a = host.avatar ? host.avatar() : null;
        lidA = t < ORDER.close ? -1.1 * (1 - t / ORDER.close) : t < ORDER.open ? 0 : t < ORDER.roll ? -1.1 * Math.min(1, (t - ORDER.open) / 0.3) : -1.1;
        if (t - dt < ORDER.close && t >= ORDER.close) sfx.clank(Math.max(0.4, near));
        sfx.sizzle(t > ORDER.close && t < ORDER.open ? 0.22 * Math.max(0.4, near) : near * 0.03);
        armR = t < ORDER.open ? -0.8 + Math.sin(t * 4) * 0.08 : t < ORDER.roll ? -0.9 + Math.sin(t * 14) * 0.15 : t < ORDER.hand ? -1.45 : -0.9;
        armL = t < ORDER.roll ? -0.6 : -0.45;
        turn = t > ORDER.roll && t < ORDER.hand ? 0.25 : 0;
        // The treat: rolled on the press, then carried over the counter to the Ooga's hand, held, and eaten.
        if (t >= ORDER.roll - 0.3 && a) {
          S.treat.visible = true;
          FROM.x = S.press.x; FROM.y = S.press.y + 0.05; FROM.z = S.press.z;
          handOf(a, HAND);
          const k = Math.max(0, Math.min(1, (t - ORDER.roll) / (ORDER.hand - ORDER.roll)));
          S.treat.position.x = FROM.x + (HAND.x - FROM.x) * k; S.treat.position.z = FROM.z + (HAND.z - FROM.z) * k; S.treat.position.y = FROM.y + (HAND.y - FROM.y) * k + Math.sin(k * Math.PI) * 0.35;
          S.treat.rotation.y = a.root.rotation.y + Math.PI / 2;
          if (t - dt < ORDER.hand && t >= ORDER.hand) sfx.ding();
          if (st.bites < 3 && t >= ORDER.bites[st.bites]) { st.bites++; sfx.crunch(); }
          const sc = 1 - st.bites / 3.2; S.treat.scale.x = S.treat.scale.y = S.treat.scale.z = Math.max(0.1, sc);
          // The Ooga brings it up to its mouth while it eats.
          if (t >= ORDER.hand) { a.parts.armR.rotation.x = -1.9 + Math.sin(t * 9) * 0.1; S.treat.position.y = HAND.y + 0.35; }
        }
        if (t >= ORDER.done) { st.order = -1; S.treat.visible = false; S.treat.scale.x = S.treat.scale.y = S.treat.scale.z = 1; if (host.eat) host.eat(); }
      }
      S.lid.rotation.x = lidA;
      P.armR.rotation.x = armR; P.armL.rotation.x = armL; K.fig.root.rotation.y = turn;
      // Steam off the press, rising and fading in a loop, thicker while it cooks.
      const cooking = st.order > ORDER.close && st.order < ORDER.open;
      for (const q of S.steam) { const k = (st.t * (cooking ? 0.9 : 0.5) + q.ph) % 1; q.n.position.y = S.press.y + 0.1 + k * 0.9; q.n.position.x = S.press.x + Math.sin(st.t + q.ph * 6) * 0.08; const sc = (cooking ? 1.2 : 0.6) * (0.5 + k); q.n.scale.x = q.n.scale.y = q.n.scale.z = sc * (1 - k); q.n.visible = k < 0.95; }
    };
    // The putter: in the Ooga's right hand while it plays a hole, both hands on it; it swings back with the meter and
    // through on the strike, then settles. Its shaft reaches the floor from the hand at the address.
    let putter = null, putterFor = null;
    const ADDRESS = -0.32;
    const putterOn = (a) => {
      if (putterFor !== a) {
        if (putter && putter.parent) { const pa = putter.parent; pa.children.splice(pa.children.indexOf(putter), 1); putter.parent = null; }
        const h = a.parts.hat.scale.x, u = h / 16, Lsh = (0.7725 * h) / Math.cos(ADDRESS) - 10 * u;
        putter = host.node({ geometry: host.M.merge(host.M.box({ w: 0.025, h: Lsh, d: 0.025, color: "#cfd4da", emissive: 0.2, offset: { x: 0, y: -Lsh / 2, z: 0 } }), host.M.box({ w: 0.04, h: 0.12, d: 0.04, color: "#1a1a1a", offset: { x: 0, y: -0.04, z: 0 } }),
          host.M.box({ w: 0.12, h: 0.04, d: 0.045, color: "#9aa0a8", emissive: 0.2, offset: { x: -0.04, y: -Lsh, z: 0.01 } }), host.M.box({ w: 0.1, h: 0.008, d: 0.01, color: "#39ff7a", emissive: 1, offset: { x: -0.04, y: -Lsh + 0.022, z: 0.035 } })),
          position: { x: 0, y: -10 * u, z: 0.03 } });
        host.add(a.parts.armR, putter); putterFor = a;
      }
      putter.visible = true;
    };
    const putterOff = () => { if (putter) putter.visible = false; };
    const updateSwing = (dt) => {
      const a = host.avatar ? host.avatar() : null;
      if (!a) return;
      if (st.mode === "walk") { putterOff(); st.club = 0; return; }
      putterOn(a);
      let target = 0;
      if (st.mode === "aim" && st.charging) target = st.power * 0.8;
      if (st.follow > 0) { st.follow -= dt; target = -0.55; }
      st.club += (target - st.club) * Math.min(1, dt * (st.follow > 0 ? 30 : 10));
      a.parts.armR.rotation.x = ADDRESS + st.club; a.parts.armL.rotation.x = ADDRESS + st.club;
      a.parts.armR.rotation.z = -0.12; a.parts.armL.rotation.z = 0.3;
    };
    // Confetti from the cup: bits of the fixed pool thrown up and out, falling back under gravity.
    const celebrate = (x, z, n) => {
      for (let k = 0; k < n && k < B.confetti.length; k++) {
        const b = B.confetti[k], a = Math.random() * Math.PI * 2, sp = 1.2 + Math.random() * 2.4;
        b.n.position.x = x; b.n.position.z = z; b.n.position.y = 0.2; b.vx = Math.cos(a) * sp; b.vz = Math.sin(a) * sp; b.vy = 3.5 + Math.random() * 3; b.life = 1.6 + Math.random() * 1.2; b.n.visible = true;
      }
    };
    const toAim = () => { st.mode = "aim"; st.charging = false; st.power = 0; if (st.hole >= 0) aimAhead(B.holes[st.hole].c); standBeside(); };
    const start = (i) => {
      const c = B.holes[i].c;
      st.hole = i; GC.placeAt(ball, c);
      st.via = 0; st.sink = -1;
      B.ballNode.visible = true; B.ballNode.scale.x = B.ballNode.scale.y = B.ballNode.scale.z = 1; host.hold(true); toAim();
      host.say(`Hole ${i + 1}: ${c.hole.name}. Par ${c.hole.par}.`);
    };
    const stop = () => { st.cheer = 0; putterOff(); if (st.mode === "walk") return; st.mode = "walk"; for (const d of B.dots) d.visible = false; host.hold(false); };
    const dispose = () => { stop(); if (putter && putter.parent) { const pa = putter.parent; pa.children.splice(pa.children.indexOf(putter), 1); putter.parent = null; } putter = putterFor = null; sfx.close(); };
    const wake = () => sfx.wake();
    // The cave's sounds, all synthesized here: one context (made from a gesture, `wake`), on the page-wide mute, and a
    // cave's echo (a convolver on a decaying noise burst) under everything. The ball's tock, the cup's rattle, a wall's
    // clack, a splash, the tunnel's thump, a fanfare for a birdie or better; drips plinking into the cenote while the
    // Ooga is near it; and in the golf cavern a jungle groove (log drum, shaker and a marimba tune, written for this
    // file, in A minor pentatonic) on a small lookahead sequencer. `close` stops it all.
    const sfx = (() => {
      let ctx = null, out = null, dry = null, wet = null, music = null, timer = 0, next = 0, step = 0, noise = null, sizzleGain = null;
      const ready = () => {
        if (!ctx) {
          const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null;
          if (navigator.userActivation && !navigator.userActivation.hasBeenActive) return null;
          ctx = new AC(); out = BL.sound ? BL.sound.output(ctx) : ctx.destination;
          dry = ctx.createGain(); dry.gain.value = 0.8; dry.connect(out);
          const ir = ctx.createBuffer(2, Math.floor(ctx.sampleRate * 2.6), ctx.sampleRate);
          for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 3); }
          const verb = ctx.createConvolver(); verb.buffer = ir; wet = ctx.createGain(); wet.gain.value = 0.45; verb.connect(wet); wet.connect(out);
          dry.verb = verb;
          music = ctx.createGain(); music.gain.value = 0; music.connect(dry); music.connect(verb);
          noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate); const nd = noise.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
        }
        if (ctx.state === "suspended") ctx.resume();
        return ctx;
      };
      const send = (node, echo = 0.6) => { node.connect(dry); if (echo) { const g = ctx.createGain(); g.gain.value = echo; node.connect(g); g.connect(dry.verb); } };
      const tone = (t, f, len, vol, type = "triangle", to = 0.6, dest = null) => { if (vol < 0.001) return; const o = ctx.createOscillator(), g = ctx.createGain(); o.type = type; o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * to, t + len); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, t + len); o.connect(g); if (dest) g.connect(dest); else send(g); o.start(t); o.stop(t + len + 0.02); };
      const hiss = (t, len, vol, f, q, dest = null) => { if (vol < 0.001) return; const src = ctx.createBufferSource(), bp = ctx.createBiquadFilter(), g = ctx.createGain(); src.buffer = noise; bp.type = "bandpass"; bp.frequency.value = f; bp.Q.value = q; g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + len); src.connect(bp); bp.connect(g); if (dest) g.connect(dest); else send(g); src.start(t, Math.random() * 0.5, len + 0.05); };
      // The groove: 16 steps a bar, four bars; numbers are semitones over A3 in the pentatonic, "." a rest.
      const TUNE = "0 . 3 5 . 7 . 5 3 . 0 . 10 . 7 . | 5 . 7 . 10 12 . 10 7 . 5 . 3 . . . | 0 . 3 5 . 7 . 12 10 . 7 . 5 . 3 . | 7 . 5 3 . 0 . 3 5 . . . 0 . . .".replace(/\|/g, "").trim().split(/\s+/);
      const BASS = [0, -2, -4, -5], BPM = 100, SIX = 60 / BPM / 4;
      const plan = () => {
        if (!ctx || !music) return;
        while (next < ctx.currentTime + 0.15) {
          const t = Math.max(next, ctx.currentTime), k = step % 64, bar = Math.floor(k / 16), s16 = k % 16;
          const n = TUNE[k]; if (n !== ".") tone(t, 220 * Math.pow(2, +n / 12), 0.32, 0.16, "triangle", 0.98, music);
          if (s16 % 4 === 0) tone(t, 55 * Math.pow(2, BASS[bar] / 12), 0.28, 0.32, "sine", 0.7, music);
          if (s16 === 6 || s16 === 14) tone(t, 180, 0.12, 0.18, "sine", 0.5, music);
          if (s16 % 2 === 1) hiss(t, 0.05, s16 % 4 === 3 ? 0.07 : 0.035, 7000, 1.5, music);
          step++; next += SIX;
        }
      };
      return {
        wake: () => ready(),
        putt: (p) => { if (!ready()) return; const t = ctx.currentTime; tone(t, 900, 0.08, 0.25 + p * 0.3, "triangle", 0.6); },
        bump: (v) => { if (!ctx) return; const t = ctx.currentTime; tone(t, 520 + Math.random() * 120, 0.05, Math.min(0.3, 0.05 + v * 0.05), "square", 0.5); },
        cup: () => { if (!ready()) return; const t = ctx.currentTime; hiss(t, 0.12, 0.5, 2600, 4); tone(t + 0.05, 420, 0.12, 0.4); tone(t + 0.16, 300, 0.1, 0.3); tone(t + 0.24, 240, 0.08, 0.2); },
        splash: () => { if (!ready()) return; const t = ctx.currentTime; hiss(t, 0.5, 0.5, 900, 0.7); hiss(t + 0.05, 0.3, 0.3, 2400, 1.2); tone(t + 0.02, 260, 0.2, 0.2, "sine", 0.4); },
        tunnel: () => { if (!ready()) return; const t = ctx.currentTime; tone(t, 180, 0.3, 0.45); tone(t + 0.12, 140, 0.35, 0.35); hiss(t + 0.05, 0.4, 0.15, 400, 1); },
        fanfare: (big) => { if (!ready()) return; const t = ctx.currentTime, notes = big ? [0, 4, 7, 12, 16, 19, 24] : [0, 4, 7, 12]; notes.forEach((n, i) => { tone(t + i * 0.09, 440 * Math.pow(2, n / 12), 0.5, 0.22, "square", 0.995); tone(t + i * 0.09, 880 * Math.pow(2, n / 12), 0.3, 0.06, "sine", 1); }); if (big) for (let i = 0; i < 10; i++) tone(t + 0.6 + i * 0.05, 1800 + Math.random() * 1600, 0.12, 0.08, "sine", 1.2); },
        clank: (v) => { if (!ctx) return; const t = ctx.currentTime; tone(t, 260, 0.09, 0.3 * v, "square", 0.6); hiss(t, 0.08, 0.2 * v, 4200, 2); },
        crunch: () => { if (!ctx) return; const t = ctx.currentTime; hiss(t, 0.09, 0.45, 1700, 0.8); hiss(t + 0.04, 0.07, 0.3, 3200, 1.2); tone(t, 140, 0.08, 0.2, "sine", 0.6); },
        ding: () => { if (!ctx) return; const t = ctx.currentTime; tone(t, 1320, 0.6, 0.18, "sine", 1); tone(t + 0.12, 1760, 0.5, 0.12, "sine", 1); },
        // The press's sizzle: one looped noise through a bright band, its level set each frame by nearness and work.
        sizzle: (level) => {
          if (!ctx) return;
          if (!sizzleGain) { const src = ctx.createBufferSource(), hp = ctx.createBiquadFilter(), bp = ctx.createBiquadFilter(); src.buffer = noise; src.loop = true; hp.type = "highpass"; hp.frequency.value = 2500; bp.type = "peaking"; bp.frequency.value = 6500; bp.gain.value = 8; sizzleGain = ctx.createGain(); sizzleGain.gain.value = 0; src.connect(hp); hp.connect(bp); bp.connect(sizzleGain); send(sizzleGain, 0.3); src.start(); }
          sizzleGain.gain.setTargetAtTime(level, ctx.currentTime, 0.15);
        },
        drip: (near) => { if (!ctx) return; const t = ctx.currentTime, f = 900 + Math.random() * 900; tone(t, f, 0.12, 0.18 * near, "sine", 1.9); tone(t + 0.01, f * 0.5, 0.2, 0.06 * near, "sine", 1.4); },
        // The groove fades in while the Ooga is in the golf cavern and out when it leaves; the timer runs only then.
        groove: (on) => {
          if (!ctx || !music) return;
          music.gain.setTargetAtTime(on ? 0.5 : 0, ctx.currentTime, 0.6);
          if (on && !timer) { next = ctx.currentTime + 0.05; timer = setInterval(plan, 50); }
          else if (!on && timer && music.gain.value < 0.01) { clearInterval(timer); timer = 0; }
        },
        close: () => { if (timer) { clearInterval(timer); timer = 0; } if (ctx) { ctx.close(); ctx = null; out = dry = wet = music = noise = sizzleGain = null; } }
      };
    })();
    const key = (e) => {
      if (st.mode === "walk") return false;
      const k = e.key;
      if (k === "Escape") { stop(); return true; }
      if (st.mode !== "aim") return k === " ";
      if (k === "ArrowLeft" || k === "a" || k === "A") st.aim += 0.06;
      else if (k === "ArrowRight" || k === "d" || k === "D") st.aim -= 0.06;
      else if (k === " " || k === "Enter") {
        if (!st.charging) { st.charging = true; st.meter = 0; }
        else { st.charging = false; GC.putt(ball, st.aim, st.power); st.mode = "roll"; st.follow = 0.35; sfx.putt(st.power); }
      } else return false;
      standBeside();
      return true;
    };
    const turn = (dx) => { if (st.mode === "aim") { st.aim -= dx * 0.006; standBeside(); } };
    const update = (dt, camera) => {
      st.t += dt;
      // The cave's ambience: the groove while the Ooga is in the golf cavern, drips while it is by the cenote.
      const L = host.listener ? host.listener() : null;
      if (L) {
        sfx.groove(Math.abs(L.x - C.x) < C.w / 2 && Math.abs(L.z - C.z) < C.d / 2);
        const CE = BL.genesisCavern && BL.genesisCavern.CENOTE, dc = CE ? Math.hypot(L.x - CE.x, L.z - CE.z) : 99;
        // Each drop that lands in the pool (genesis-cavern.js counts them) plinks, louder the nearer the Ooga is.
        const dn = host.drips ? host.drips() : 0;
        if (dn !== st.dripAt) { st.dripAt = dn; if (dc < 16) sfx.drip(Math.min(1, 3 / Math.max(1, dc - 1))); }
      }
      for (const f of B.fish) { const w = f.w, a = st.t * f.sp + f.ph, rx = (w.x1 - w.x0) / 2 - 0.15, rz = (w.z1 - w.z0) / 2 - 0.1; f.n.position.x = (w.x0 + w.x1) / 2 + Math.cos(a) * rx * (0.5 + 0.4 * Math.sin(f.ph)); f.n.position.z = (w.z0 + w.z1) / 2 + Math.sin(a) * rz * 0.8; f.n.rotation.y = Math.atan2(-Math.sin(a) * rx * f.sp, Math.cos(a) * rz * f.sp) + Math.sin(st.t * 6 + f.ph) * 0.15; }
      for (const b of B.confetti) { if (b.life <= 0) continue; b.life -= dt; b.vy -= 7 * dt; b.n.position.x += b.vx * dt; b.n.position.y = Math.max(0.03, b.n.position.y + b.vy * dt); b.n.position.z += b.vz * dt; b.n.rotation.x += dt * 9; b.n.rotation.y += dt * 7; if (b.n.position.y <= 0.03) { b.vx *= 0.9; b.vz *= 0.9; } if (b.life <= 0) b.n.visible = false; }
      if (st.cheer > 0) st.cheer -= dt;
      updateCook(dt);
      updateSwing(dt);
      for (let i = 0; i < B.holes.length; i++) { const h = B.holes[i]; if (h.bar) h.bar.rotation.y = -st.t * h.c.bar.w; if (h.head) h.head.visible = !(st.mode !== "walk" && st.hole === i); }
      for (const j of B.jets) { const hgt = 0.9 + 0.35 * Math.sin(st.t * 3 + j.k * 2); j.n.scale.y = hgt + (j.k === 1 ? 0.5 : 0); j.n.position.y = j.n.scale.y / 2; }
      for (const m of B.smoke) { const k = (st.t * 0.25 + m.k / B.smoke.length) % 1; m.n.position.y = 2.5 + k * 4; m.n.position.x = B.volcano.x + Math.sin(st.t * 0.5 + m.k) * k * 0.8; m.n.position.z = B.volcano.z + k * 0.6; const sc = 0.6 + k * 1.8; m.n.scale.x = m.n.scale.y = m.n.scale.z = sc; m.n.visible = k < 0.95; }
      for (const p of B.parrots) {
        if (p.perch) {
          const bob = Math.max(0, Math.sin(st.t * 0.9 + p.ph * 3)) ** 8;
          p.n.position.x = p.perch.x; p.n.position.y = p.perch.y + 0.18 + bob * 0.06; p.n.position.z = p.perch.z; p.n.rotation.y = p.ph + Math.sin(st.t * 0.3 + p.ph) * 0.8; p.n.rotation.x = -bob * 0.3;
          p.lw.rotation.z = -1.3 + bob * 0.4; p.rw.rotation.z = 1.3 - bob * 0.4;
        } else {
          const a = st.t * p.w + p.ph, vx = -Math.sin(a) * p.w, vz = Math.cos(a) * 0.7 * p.w, flap = Math.sin(st.t * 11 + p.ph * 5) * 0.75;
          p.n.position.x = p.cx + Math.cos(a) * p.r; p.n.position.z = p.cz + Math.sin(a) * p.r * 0.7; p.n.position.y = p.y + Math.sin(st.t * 0.8 + p.ph) * 0.4;
          p.n.rotation.y = Math.atan2(vx, vz); p.n.rotation.z = (p.w > 0 ? -1 : 1) * 0.25; p.n.rotation.x = 0;
          p.lw.rotation.z = flap; p.rw.rotation.z = -flap;
        }
      }
      { const a = st.t * 0.05, r = 17; B.airship.position.x = Math.sin(a) * r; B.airship.position.z = Math.cos(a) * r * 0.6; B.airship.position.y = 6.6 + Math.sin(st.t * 0.4) * 0.25; B.airship.rotation.y = Math.atan2(Math.cos(a) * r, -Math.sin(a) * r * 0.6) - Math.PI / 2; }
      if (st.mode === "walk") return;
      const c = B.holes[st.hole].c;
      if (st.mode === "aim" && st.charging) { st.meter += dt; st.power = 0.5 - 0.5 * Math.cos(st.meter * 2.6); }
      if (st.mode === "roll") {
        const went = ball.tunnels;
        GC.step(ball, c, st.t, dt);
        if (ball.tunnels !== went) sfx.tunnel();
        if (ball.splashes !== st.splashes) { st.splashes = ball.splashes; sfx.splash(); host.say("Splash! Back where you struck it, and a stroke added."); }
        if (ball.bumps !== st.bumps) { st.bumps = ball.bumps; if (st.t - st.bumpAt > 0.08) { st.bumpAt = st.t; sfx.bump(Math.hypot(ball.vx, ball.vz)); } }
        if (!ball.moving) {
          if (ball.sunk) {
            scores[st.hole] = ball.strokes; st.mode = "done"; st.wait = 1.8; st.played++; st.sink = 0; sfx.cup();
            const d = ball.strokes - c.hole.par, word = ball.strokes === 1 ? "HOLE IN ONE!" : d <= -2 ? "EAGLE!" : d === -1 ? "BIRDIE!" : d === 0 ? "Par." : d === 1 ? "Bogey." : `${ball.strokes} strokes.`;
            host.say(word);
            // A birdie or better: a fanfare, confetti from the cup and the word across the screen.
            if (d < 0 || ball.strokes === 1) { const big = ball.strokes === 1 || d <= -2; sfx.fanfare(big); celebrate(c.cup.x, c.cup.z, big ? 48 : 24); st.cheer = big ? 3.2 : 2.2; st.cheerText = word; st.wait = big ? 3.4 : 2.4; }
          } else if (ball.strokes >= c.hole.par + 4) { scores[st.hole] = ball.strokes + 1; st.mode = "done"; st.wait = 1.2; host.say("Picked up. On to the next!"); }
          else toAim();
        }
      }
      if (st.mode === "done" && (st.wait -= dt) <= 0) {
        if (st.hole < 8) start(st.hole + 1);
        else { const total = scores.reduce((a, b) => a + b, 0); host.say(`Round over: ${total} strokes, par ${GC.totalPar}.`); B.ballNode.visible = false; stop(); }
      }
      B.ballNode.position.x = ball.x; B.ballNode.position.z = ball.z; B.ballNode.position.y = 0.02 + GC.heightAt(c, ball.x, ball.z, null);
      if (st.sink < 0) B.ballNode.visible = ball.hide <= 0;
      // Sunk: the ball drops into the cup and is gone.
      if (st.sink >= 0) { st.sink += dt; const k = Math.min(1, st.sink / 0.35); B.ballNode.position.y = 0.02 - k * 0.2; const sc = 1 - k * 0.6; B.ballNode.scale.x = B.ballNode.scale.y = B.ballNode.scale.z = sc; B.ballNode.visible = k < 1; }
      // The aiming dots, longer as the swing grows.
      const show = st.mode === "aim", len = 0.6 + (st.charging ? st.power : 0.3) * 3;
      for (let k = 0; k < B.dots.length; k++) { const d = B.dots[k], f = (k + 1) / B.dots.length * len; d.visible = show; d.position.x = ball.x + Math.sin(st.aim) * f; d.position.z = ball.z + Math.cos(st.aim) * f; d.position.y = 0.05 + GC.heightAt(c, d.position.x, d.position.z, null); }
      // The camera behind the ball, looking along the aim (or after the rolling ball).
      const s = Math.sin(st.aim), co = Math.cos(st.aim), k = Math.min(1, dt * 5);
      world(ball.x - s * 4.2, ball.z - co * 4.2, cam); world(ball.x + s * 2, ball.z + co * 2, at);
      camera.position.x += (cam.x - camera.position.x) * k; camera.position.z += (cam.z - camera.position.z) * k; camera.position.y += (host.top + 3.0 - camera.position.y) * k;
      camera.target.x += (at.x - camera.target.x) * k; camera.target.z += (at.z - camera.target.z) * k; camera.target.y += (host.top + 0.1 - camera.target.y) * k;
    };
    // The scorecard and, while aiming, the swing's meter.
    const overlay = (g) => {
      const W = g.canvas.width, H = g.canvas.height, u = H / 600;
      g.save();
      g.fillStyle = "rgba(8,6,24,0.82)"; g.fillRect(W - 300 * u, 70 * u, 286 * u, 96 * u);
      g.strokeStyle = "#ff4fd8"; g.lineWidth = 2 * u; g.strokeRect(W - 300 * u, 70 * u, 286 * u, 96 * u);
      g.font = `bold ${13 * u}px monospace`; g.fillStyle = "#ffd23a"; g.textBaseline = "top";
      g.fillText("GLOW GOLF", W - 290 * u, 76 * u);
      let tot = 0;
      for (let i = 0; i < 9; i++) {
        const x = W - 290 * u + i * 30 * u;
        g.fillStyle = i === st.hole ? "#9cff3a" : "#cfd8e3"; g.fillText(String(i + 1), x, 96 * u);
        g.fillStyle = "#8a96a3"; g.fillText(String(GC.HOLES[i].par), x, 116 * u);
        g.fillStyle = "#ffffff"; g.fillText(scores[i] ? String(scores[i]) : i === st.hole && st.mode !== "walk" ? String(ball.strokes) : "-", x, 136 * u);
        tot += scores[i];
      }
      // The big moment's word across the screen, swelling in and fading.
      if (st.cheer > 0) {
        const k = Math.min(1, st.cheer / 0.6), sc = 1 + 0.25 * Math.sin(Math.min(1, (3.2 - st.cheer) * 3) * Math.PI / 2);
        g.textAlign = "center"; g.textBaseline = "middle"; g.font = `bold ${Math.round(64 * u * sc)}px sans-serif`;
        g.lineWidth = 8 * u; g.strokeStyle = `rgba(20,10,30,${0.85 * k})`; g.strokeText(st.cheerText, W / 2, H * 0.32);
        const grd = g.createLinearGradient(W / 2 - 200 * u, 0, W / 2 + 200 * u, 0); grd.addColorStop(0, "#ffd23a"); grd.addColorStop(0.5, "#ff4fd8"); grd.addColorStop(1, "#3ad8ff");
        g.globalAlpha = k; g.fillStyle = grd; g.fillText(st.cheerText, W / 2, H * 0.32); g.globalAlpha = 1; g.textAlign = "left"; g.textBaseline = "top";
      }
      // Walking the cavern: how to play, under the scorecard.
      if (st.mode === "walk") {
        g.fillStyle = "rgba(8,6,24,0.82)"; g.fillRect(W - 300 * u, 170 * u, 286 * u, 50 * u);
        g.font = `${11 * u}px sans-serif`; g.fillStyle = "#e9eef5";
        g.fillText("Click a stone tee to play its hole.", W - 290 * u, 178 * u);
        g.fillText("A D aim · Space swings, Space again strikes.", W - 290 * u, 196 * u);
      }
      if (st.mode === "aim") {
        const bw = 320 * u, bx = (W - bw) / 2, by = H - 190 * u;
        g.fillStyle = "rgba(8,6,24,0.8)"; g.fillRect(bx - 6 * u, by - 26 * u, bw + 12 * u, 50 * u);
        g.fillStyle = "#1d2630"; g.fillRect(bx, by, bw, 14 * u);
        const grd = g.createLinearGradient(bx, 0, bx + bw, 0); grd.addColorStop(0, "#39ff7a"); grd.addColorStop(0.6, "#ffd23a"); grd.addColorStop(1, "#ff4f4f");
        g.fillStyle = grd; g.fillRect(bx, by, bw * st.power, 14 * u);
        g.fillStyle = "#e9eef5"; g.font = `${12 * u}px sans-serif`; g.textAlign = "center";
        g.fillText(st.charging ? "Space to strike" : "A D or arrows to aim · Space to swing · Esc to walk", W / 2, by - 20 * u);
      }
      g.restore();
      void tot; void local;
    };
    return { start, stop, dispose, wake, order, key, turn, update, overlay, get ordering() { return st.order >= 0; }, get active() { return st.mode !== "walk"; }, get mode() { return st.mode; }, get hole() { return st.hole; }, ball, scores };
  };
  BL.genesisGolf = { build, controller };
})();
