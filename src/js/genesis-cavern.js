// Genesis museum: the atrium as a cavern, the Oogas' world round the hall's technology. Rough rock under the roof and
// stalactites hanging from it (kept clear of the shrine's screen and its cables), the pillars wrapped as rock columns
// with glowing crystals at their feet, stalagmites and crystals in the corners, a cenote in the north-west where
// daylight falls down a shaft onto a pool ringed with stones and vines hang from the rim, a carved step-fret frieze
// round the top of the walls and a carved sun disc high on the end walls (original designs in a Mesoamerican spirit,
// after no particular monument), and eagles soaring in circles under the high roof. `layout()` (pure) gives what a
// walker meets (the pool's rim); `build(...)` makes it once a visit; update allocates nothing.
(() => {
  "use strict";
  const BL = window.BL = window.BL || {};
  const CENOTE = { x: -22, z: -28, r: 2.6 }, KEEP = { x: 0, z: -5.6, r: 7.5 };
  const layout = () => ({ cenote: CENOTE, boxes: [{ x0: CENOTE.x - CENOTE.r - 0.4, x1: CENOTE.x + CENOTE.r + 0.4, z0: CENOTE.z - CENOTE.r - 0.4, z1: CENOTE.z + CENOTE.r + 0.4 }] });
  const hash = (a, b) => { const v = Math.sin(a * 91.7 + b * 47.3) * 43758.5453; return v - Math.floor(v); };
  const ROCK = ["#4a453e", "#5a544b", "#3e3a34", "#6a6358"];
  const CRYSTAL = ["#5ef2ff", "#b98cff", "#ffd27a", "#7dffb0"];
  const build = ({ M, createNode, addChild, place, top, atrium, roof, pillars, walls }) => {
    const rock = [], glow = [], A = atrium;
    // The roof's rough underside: shallow blocks over the whole atrium.
    for (let x = A.x0 + 1.5; x < A.x1; x += 3) for (let z = A.z0 + 1.5; z < A.z1; z += 3) {
      const h = 0.3 + hash(x, z) * 0.9, w = 2.6 + hash(z, x) * 1.2;
      rock.push(M.moved(M.bevelBox({ w, h, d: w, color: ROCK[Math.floor(hash(x + 1, z) * 4)], bevel: 0.2 }), x + (hash(x, z + 3) - 0.5), roof - h / 2, z + (hash(x + 5, z) - 0.5)));
    }
    // Stalactites, off the shrine and the cenote.
    for (let k = 0; k < 90; k++) {
      const x = A.x0 + 3 + hash(k, 1) * (A.x1 - A.x0 - 6), z = A.z0 + 3 + hash(k, 2) * (A.z1 - A.z0 - 6);
      if (Math.hypot(x - KEEP.x, z - KEEP.z) < KEEP.r || Math.hypot(x, z + 15) < 5.5 || Math.hypot(x - CENOTE.x, z - CENOTE.z) < 6) continue;
      const len = 1 + hash(k, 3) * 2.2, r = 0.25 + hash(k, 4) * 0.35;
      rock.push(M.moved(M.lathe({ profile: [[0, -len], [r * 0.3, -len * 0.6], [r * 0.8, -len * 0.2], [r, 0], [0, 0]], segments: 7, color: ROCK[k % 4] }), x, roof - 0.4, z));
      if (k % 9 === 0) glow.push(M.moved(M.bevelBox({ w: 0.18, h: 0.5, d: 0.18, color: CRYSTAL[k % 4], emissive: 1.6, bevel: 0.05 }), x + r, roof - 0.7, z));
    }
    // The pillars as rock columns, crystals at their feet.
    for (const p of pillars) {
      for (let y = 0.5; y < roof; y += 1.6) for (let a = 0; a < 4; a++) {
        const ang = a * Math.PI / 2 + hash(p.x + y, a) * 0.8, rr = 1.15;
        rock.push(M.moved(M.bevelBox({ w: 1.1, h: 1.6, d: 0.6, color: ROCK[(a + Math.floor(y)) % 4], bevel: 0.2 }), p.x + Math.sin(ang) * rr, y + 0.8, p.z + Math.cos(ang) * rr));
      }
      for (let c = 0; c < 5; c++) {
        const ang = c * 1.3 + p.x, h = 0.6 + hash(p.z, c) * 0.9;
        glow.push(M.moved(M.turnedZ(M.bevelBox({ w: 0.24, h, d: 0.24, color: CRYSTAL[(c + Math.abs(Math.round(p.x))) % 4], emissive: 1.4, bevel: 0.06 }), (hash(c, p.z) - 0.5) * 0.6), p.x + Math.sin(ang) * 1.7, top + h / 2, p.z + Math.cos(ang) * 1.7));
      }
    }
    // Stalagmites and crystals in the four corners.
    for (const [cx, cz] of [[A.x0 + 3, A.z0 + 3], [A.x1 - 3, A.z0 + 3], [A.x0 + 3, A.z1 - 3], [A.x1 - 3, A.z1 - 3]]) for (let k = 0; k < 6; k++) {
      const x = cx + (hash(cx, k) - 0.5) * 3, z = cz + (hash(cz, k) - 0.5) * 3, len = 1.2 + hash(k, cx) * 2.5, r = 0.35 + hash(cz, k + 3) * 0.3;
      rock.push(M.moved(M.lathe({ profile: [[0, 0], [r, 0], [r * 0.7, len * 0.4], [r * 0.25, len * 0.85], [0, len]], segments: 7, color: ROCK[k % 4] }), x, top, z));
      if (k % 2) glow.push(M.moved(M.bevelBox({ w: 0.3, h: 0.9, d: 0.3, color: CRYSTAL[k % 4], emissive: 1.5, bevel: 0.08 }), x + 0.6, top + 0.45, z + 0.4));
    }
    // The cenote: a ring of daylight in the roof, a shaft of light down, the pool ringed with stones, vines.
    const C = CENOTE;
    for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2; rock.push(M.moved(M.bevelBox({ w: 1.6, h: 1.4, d: 1.2, color: ROCK[k % 4], bevel: 0.3 }), C.x + Math.sin(a) * 3.6, roof - 0.7, C.z + Math.cos(a) * 3.6)); }
    glow.push(M.moved(M.lathe({ profile: [[0, 0], [3.1, 0], [3.1, 0.05], [0, 0.05]], segments: 24, color: "#eaf8ff", emissive: 2.2 }), C.x, roof - 0.06, C.z));
    for (let k = 0; k < 14; k++) { const a = k * 0.45 + 0.2, len = 3 + hash(k, 9) * 5; glow.push(M.moved(M.box({ w: 0.06, h: len, d: 0.06, color: k % 2 ? "#3f8a34" : "#2f6b2c", emissive: 0.2 }), C.x + Math.sin(a) * 3.1, roof - len / 2, C.z + Math.cos(a) * 3.1)); }
    for (let k = 0; k < 18; k++) { const a = k / 18 * Math.PI * 2; rock.push(M.moved(M.bevelBox({ w: 0.8, h: 0.5, d: 0.6, color: ROCK[k % 4], bevel: 0.15 }), C.x + Math.sin(a) * C.r, top + 0.25, C.z + Math.cos(a) * C.r)); }
    glow.push(M.moved(M.lathe({ profile: [[0, 0], [C.r - 0.2, 0], [C.r - 0.2, 0.06], [0, 0.06]], segments: 24, color: "#3fb8d8", emissive: 0.8 }), C.x, top + 0.1, C.z));
    const shaft = M.lathe({ profile: [[0.01, 0], [2.4, 0], [3.1, roof - top - 0.2], [0.01, roof - top - 0.2]], segments: 20, color: "#eaf8ff", emissive: 1 });
    shaft.glass = 0.07; shaft.lightBeam = roof - top; shaft.castShadow = false;
    // The step-fret frieze round the top of the atrium's walls, and a sun disc on the north and south walls.
    const FRIEZE = "#8a7a62", FRIEZE_LT = "#b8a07a";
    for (const w of walls) {
      const along = w.x1 - w.x0 > w.z1 - w.z0, len = along ? w.x1 - w.x0 : w.z1 - w.z0, inward = along ? (w.z0 + w.z1 < 0 ? 1 : -1) : (w.x0 + w.x1 < 0 ? 1 : -1);
      const fx = along ? 0 : (inward > 0 ? w.x1 : w.x0) + inward * 0.1, fz = along ? (inward > 0 ? w.z1 : w.z0) + inward * 0.1 : 0;
      for (let u = 0.6; u < len - 0.6; u += 1.2) {
        const s = Math.floor(u / 1.2) % 4, x = along ? w.x0 + u : fx, z = along ? fz : w.z0 + u;
        rock.push(M.moved(M.box({ w: along ? 1.2 : 0.2, h: 0.3, d: along ? 0.2 : 1.2, color: FRIEZE }), x, roof - 2.2, z), M.moved(M.box({ w: along ? 1.2 : 0.2, h: 0.3, d: along ? 0.2 : 1.2, color: FRIEZE }), x, roof - 3.6, z));
        const steps = [[0, 0.4], [0, 0.7], [0.4, 0.7], [0.4, 1.0]][s];
        rock.push(M.moved(M.box({ w: along ? 0.4 : 0.22, h: 0.3, d: along ? 0.22 : 0.4, color: FRIEZE_LT }), along ? x + steps[0] - 0.4 : x, roof - 3.3 + steps[1], along ? z : z + steps[0] - 0.4));
      }
    }
    const disc = (x, z, ry) => {
      const parts = [];
      for (const [r0, r1, ink] of [[0, 1.2, "#c8a050"], [1.2, 1.35, "#6a5a42"], [1.35, 2.2, "#a08460"], [2.2, 2.35, "#6a5a42"], [2.35, 3.1, "#8a7254"]]) parts.push(M.turnedX(M.lathe({ profile: [[r0, 0], [r1, 0], [r1, 0.25], [r0, 0.25]], segments: 32, color: ink }), Math.PI / 2));
      for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2; parts.push(M.moved(M.box({ w: 0.36, h: 0.36, d: 0.12, color: k % 2 ? "#e8c35a" : "#5a4a36" }), Math.sin(a) * 1.78, Math.cos(a) * 1.78, 0.26)); }
      for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2 + 0.2; parts.push(M.moved(M.turnedZ(M.box({ w: 0.3, h: 0.9, d: 0.1, color: "#e8c35a" }), -a), Math.sin(a) * 2.75, Math.cos(a) * 2.75, 0.26)); }
      parts.push(M.moved(M.box({ w: 0.9, h: 0.25, d: 0.1, color: "#3a2e22" }), 0, -0.3, 0.27), ...[-0.35, 0.35].map((sx) => M.moved(M.box({ w: 0.25, h: 0.25, d: 0.1, color: "#3a2e22" }), sx, 0.3, 0.27)));
      return place(createNode({ geometry: M.merge(...parts), position: { x, y: roof - 7, z }, rotation: { x: 0, y: ry, z: 0 }, sightHidden: true }));
    };
    disc(0, A.z0 + 0.4, 0); disc(0, A.z1 - 0.4, Math.PI);
    place(createNode({ geometry: M.merge(...rock), sightHidden: true }));
    const glowNode = place(createNode({ geometry: M.merge(...glow), sightHidden: true }));
    const shaftNode = place(createNode({ geometry: shaft, position: { x: C.x, y: top + 0.1, z: C.z }, sightHidden: true }));
    // The eagles: a body, white head, hooked yellow beak and tail, wings on nodes of their own to flap.
    const bodyGeo = M.merge(M.bevelBox({ w: 0.42, h: 0.36, d: 1.0, color: "#5a3a22", bevel: 0.1 }), M.bevelBox({ w: 0.34, h: 0.32, d: 0.34, color: "#f4efe4", bevel: 0.08, offset: { x: 0, y: 0.1, z: 0.62 } }), M.box({ w: 0.12, h: 0.12, d: 0.2, color: "#ffc23a", offset: { x: 0, y: 0.05, z: 0.86 } }), M.box({ w: 0.5, h: 0.08, d: 0.5, color: "#f4efe4", offset: { x: 0, y: 0, z: -0.68 } }));
    const wingGeo = (s) => M.merge(M.box({ w: 1.6, h: 0.06, d: 0.6, color: "#4a2e1a", offset: { x: s * 0.8, y: 0, z: 0 } }), M.box({ w: 0.7, h: 0.05, d: 0.4, color: "#2e1e12", offset: { x: s * 1.9, y: 0, z: -0.1 } }));
    const wl = wingGeo(-1), wr = wingGeo(1), eagles = [];
    for (let k = 0; k < 4; k++) {
      const n = place(createNode({ geometry: bodyGeo, sightHidden: true })), L = createNode({ geometry: wl, position: { x: -0.18, y: 0.08, z: 0 } }), R = createNode({ geometry: wr, position: { x: 0.18, y: 0.08, z: 0 } });
      addChild(n, L, R);
      eagles.push({ n, L, R, r: 15 + k * 3.2, y: 10.4 + (k % 3) * 0.8, speed: (0.09 + k * 0.015) * (k % 2 ? -1 : 1), a: k * 1.7, flap: k });
    }
    let t = 0;
    const update = (dt, calm) => {
      t += dt;
      glowNode.glow = 1 + Math.sin(t * 1.1) * 0.2;
      shaftNode.glow = 1 + Math.sin(t * 0.4) * 0.1;
      for (const e of eagles) {
        if (!calm) e.a += dt * e.speed;
        const x = Math.sin(e.a) * e.r, z = Math.cos(e.a) * e.r, dir = e.speed > 0 ? 1 : -1;
        e.n.position.x = x; e.n.position.z = z; e.n.position.y = top + e.y + Math.sin(t * 0.7 + e.flap) * 0.5;
        e.n.rotation.y = e.a + dir * Math.PI / 2; e.n.rotation.z = -dir * 0.25;
        const f = calm ? 0 : Math.sin(t * 2.4 + e.flap) * (Math.sin(t * 0.3 + e.flap) > 0.2 ? 0.55 : 0.08);
        e.L.rotation.z = f; e.R.rotation.z = -f;
      }
    };
    return { update, light: [C.x, top + 2.5, C.z, 10, 0.9, 1.1, 1.3] };
  };
  BL.genesisCavern = { layout, build, CENOTE };
})();
