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
    const holes = [], fountains = [];
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
        for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2, rx = (w.x1 - w.x0) / 2 + 0.15, rz = (w.z1 - w.z0) / 2 + 0.15; glow.push(M.bevelBox({ w: 0.35, h: 0.2, d: 0.35, color: STONE[k % 3], emissive: 0.04, bevel: 0.08, offset: { x: (w.x0 + w.x1) / 2 + Math.cos(a) * rx, y: 0.1, z: (w.z0 + w.z1) / 2 + Math.sin(a) * rz } })); }
        fountains.push({ x: (w.x0 + w.x1) / 2, z: (w.z0 + w.z1) / 2 });
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
    addChild(root, createNode({ geometry: M.merge(...solid), sightHidden: true }), createNode({ geometry: M.merge(...glow), sightHidden: true }), createNode({ geometry: M.merge(...jungle), sightHidden: true }));
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
    return { root, holes, ballNode, dots, jets, smoke, airship, volcano, parrots };
  };
  // The game, driven by the scene: `start(i)` at a tee, keys, update and the overlay.
  const controller = (B, host) => {
    const GC = G(), C = GC.CAVERN, ball = GC.createBall(), scores = new Int8Array(9);
    const st = { mode: "walk", hole: -1, aim: 0, power: 0, charging: false, t: 0, meter: 0, wait: 0, played: 0, via: 0, sink: -1 };
    const local = { x: 0, z: 0 };
    const world = (x, z, out) => { out.x = C.x + x; out.z = C.z + z; return out; };
    const at = { x: 0, z: 0 }, cam = { x: 0, z: 0 };
    const standBeside = () => {
      const s = Math.sin(st.aim), c = Math.cos(st.aim);
      world(ball.x - c * 0.95 + s * 0.15, ball.z + s * 0.95 + c * 0.15, at);
      host.standAt(at.x, at.z, st.aim);
    };
    // Ready for the next stroke, aimed at the cup (or the hole's next turn, while it has one ahead).
    const aimAhead = (c) => {
      while (st.via < c.via.length && Math.hypot(ball.x - c.via[st.via].x, ball.z - c.via[st.via].z) < 1.8) st.via++;
      const tgt = st.via < c.via.length ? c.via[st.via] : c.cup;
      st.aim = Math.atan2(tgt.x - ball.x, tgt.z - ball.z);
    };
    const toAim = () => { st.mode = "aim"; st.charging = false; st.power = 0; if (st.hole >= 0) aimAhead(B.holes[st.hole].c); standBeside(); };
    const start = (i) => {
      const c = B.holes[i].c;
      st.hole = i; GC.placeAt(ball, c);
      st.via = 0; st.sink = -1;
      B.ballNode.visible = true; B.ballNode.scale.x = B.ballNode.scale.y = B.ballNode.scale.z = 1; host.hold(true); toAim();
      host.say(`Hole ${i + 1}: ${c.hole.name}. Par ${c.hole.par}.`);
    };
    const stop = () => { if (st.mode === "walk") return; st.mode = "walk"; for (const d of B.dots) d.visible = false; host.hold(false); };
    const dispose = () => { stop(); sfx.close(); };
    // The ball's sounds, made as they play: the putter's tock, and the cup's rattle and knock as the ball drops in. One
    // context, made on the first stroke (a key press, so the browser allows it), on the page-wide mute, closed by stop.
    const sfx = (() => {
      let ctx = null, out = null;
      const ready = () => {
        if (!ctx) { const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null; ctx = new AC(); out = BL.sound ? BL.sound.output(ctx) : ctx.destination; }
        if (ctx.state === "suspended") ctx.resume();
        return ctx;
      };
      const knock = (t, f, len, vol) => { const o = ctx.createOscillator(), g = ctx.createGain(); o.type = "triangle"; o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * 0.6, t + len); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + len); o.connect(g); g.connect(out); o.start(t); o.stop(t + len + 0.02); };
      const rattle = (t, len, vol) => {
        const n = Math.floor(ctx.sampleRate * len), buf = ctx.createBuffer(1, n, ctx.sampleRate), d = buf.getChannelData(0);
        for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2);
        const src = ctx.createBufferSource(), bp = ctx.createBiquadFilter(), g = ctx.createGain();
        src.buffer = buf; bp.type = "bandpass"; bp.frequency.value = 2600; bp.Q.value = 4; g.gain.value = vol;
        src.connect(bp); bp.connect(g); g.connect(out); src.start(t);
      };
      return {
        putt: (p) => { if (!ready()) return; const t = ctx.currentTime; knock(t, 900, 0.08, 0.25 + p * 0.3); },
        tunnel: () => { if (!ready()) return; const t = ctx.currentTime; knock(t, 180, 0.3, 0.45); knock(t + 0.12, 140, 0.35, 0.35); rattle(t + 0.05, 0.4, 0.15); },
        cup: () => { if (!ready()) return; const t = ctx.currentTime; rattle(t, 0.12, 0.5); knock(t + 0.05, 420, 0.12, 0.4); knock(t + 0.16, 300, 0.1, 0.3); knock(t + 0.24, 240, 0.08, 0.2); },
        close: () => { if (ctx) { ctx.close(); ctx = null; out = null; } }
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
        else { st.charging = false; GC.putt(ball, st.aim, st.power); st.mode = "roll"; sfx.putt(st.power); }
      } else return false;
      standBeside();
      return true;
    };
    const turn = (dx) => { if (st.mode === "aim") { st.aim -= dx * 0.006; standBeside(); } };
    const update = (dt, camera) => {
      st.t += dt;
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
        if (!ball.moving) {
          if (ball.sunk) {
            scores[st.hole] = ball.strokes; st.mode = "done"; st.wait = 1.8; st.played++; st.sink = 0; sfx.cup();
            const d = ball.strokes - c.hole.par;
            host.say(ball.strokes === 1 ? "HOLE IN ONE!" : d <= -2 ? "Eagle!" : d === -1 ? "Birdie!" : d === 0 ? "Par." : d === 1 ? "Bogey." : `${ball.strokes} strokes.`);
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
    return { start, stop, dispose, key, turn, update, overlay, get active() { return st.mode !== "walk"; }, get mode() { return st.mode; }, get hole() { return st.hole; }, ball, scores };
  };
  BL.genesisGolf = { build, controller };
})();
