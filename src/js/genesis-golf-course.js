// Genesis museum: Glow Golf's course and its ball, pure and Node-loadable. Nine holes in a jungle cavern
// under the hall (scene-genesis.js builds it far north of the galleries and takes the visitor there down the cenote),
// three rows of three, played in a snake: each hole a walled green (a simple polygon the ball stays inside) with its
// tee, its cup, its par, and what stands in the way: round bumpers, blocks, a ring round the cup with one gap, a bar
// that turns, grassy hills that roll the ball aside, hidden tunnels that swallow it and spit it out further on.
// `compile(i)` lays a hole's walls out as segments in the cavern's frame once; `step(ball, c, t, dt)`
// rolls the ball one step (friction, hills, walls, bumpers, the turning bar, tunnels, the cup), allocating nothing; `putt(ball,
// angle, power)` strikes it. Lengths in metres, the cavern's frame: x east, z south, its centre the origin.
(() => {
  "use strict";
  const BL = window.BL = window.BL || {};
  const BALL_R = 0.1, CUP_R = 0.2, MAX_SPEED = 11, DECEL = 1.5, DRAG = 0.35, WALL_E = 0.78, BUMP_E = 0.95, SINK_SPEED = 3.4;
  // A rolling ball on a slope: gravity's pull along the ground, with the five sevenths a rolling sphere keeps.
  const ROLL_G = 9.81 * 5 / 7, TUNNEL_R = 0.3, TUNNEL_T = 0.7, TUNNEL_SPEED = 2.6;
  const CELL_X = [-22, 0, 22], CELL_Z = [-14, 0, 14];
  // Where the cavern lies in the museum's frame (far north of every gallery), its size and its roof.
  const CAVERN = { x: 0, z: -178, w: 74, d: 52, h: 9 };
  const rect = (x0, x1, z0, z1) => [[x0, z0], [x1, z0], [x1, z1], [x0, z1]];
  const ring = (cx, cz, r, gap) => { const out = []; for (let k = 0; k < 12; k++) { const a0 = k / 12 * Math.PI * 2, a1 = (k + 1) / 12 * Math.PI * 2, mid = (a0 + a1) / 2; if (Math.abs(Math.atan2(Math.sin(mid - gap), Math.cos(mid - gap))) < 0.5) continue; out.push([cx + Math.cos(a0) * r, cz + Math.sin(a0) * r, cx + Math.cos(a1) * r, cz + Math.sin(a1) * r]); } return out; };
  // Each hole in its own cell's frame: `edge` the green's outline, `tee`, `cup`, `par`, and its feature: `bumpers`
  // [x, z, r], `blocks` (rects), `segs` (loose walls [x0, z0, x1, z1]), `bar` (a turning bar: centre, length, turn
  // speed), `hills` [x, z, r, H] (a smooth grassy mound H high and r across its foot, which the ball climbs and rolls
  // off), `bridges` [x0, x1, z, half-width, H] (an arched plank bridge along x over a creek: railed both sides, its deck
  // rising H in the middle, the creek's water either side of it), `tunnels` [x, z, x2, z2, angle, face] (a mouth at x, z facing `face` that takes a ball rolling into it and lets it out of the
  // far end at x2, z2 heading along angle, a little while later), `water` (ponds: a ball in one goes back where it was struck from, a stroke added), `via` (points round the
  // hole's turn), `line` (putts [angle, power] that hole it, found once by searching
  // shots and replayed by the suite, so a change that makes a hole unplayable is caught), and `prop`, the carving that stands
  // over it (the scene's to build).
  const HOLES = [
    { name: "The Warm-Up", line: [[0.925, 0.875]], par: 2, edge: rect(-6, 6, -1.6, 1.6), tee: [-5, 0], cup: [5, 0], hills: [[0, 0, 1.5, 0.3]], prop: "torches" },
    { name: "Jaguar's Turn", line: [[1.7279, 0.95], [0.0175, 0.75]], par: 2, edge: [[-7, -1.2], [3, -1.2], [3, -4.5], [5.4, -4.5], [5.4, 1.2], [-7, 1.2]], tee: [-6, 0], cup: [4.2, -3.6], bridges: [[-3.4, -1.4, 0, 0.5, 0.32]], prop: "jaguar" },
    { name: "Cocoa Beans", line: [[1.5533, 0.775]], par: 2, edge: rect(-6.5, 6.5, -1.6, 1.6), tee: [-5.5, 0], cup: [5.5, 0], bumpers: [[-2, -0.6, 0.45], [0.3, 0.7, 0.45], [2.6, -0.5, 0.4]], hills: [[-3.6, 0.8, 0.7, 0.16], [1.4, -0.85, 0.7, 0.16]], bridges: [[3.5, 4.9, 0, 0.55, 0.28]], prop: "beans" },
    { name: "The Long Way Round", line: [[0.5411, 0.85], [4.1888, 0.8], [0, 0.525]], par: 3, edge: [[-6, -4], [6, -4], [6, 4], [3.6, 4], [3.6, -1.6], [-3.6, -1.6], [-3.6, 4], [-6, 4]], tee: [-4.8, 3], cup: [4.8, 3], via: [[-4.8, -2.8], [4.8, -2.8]], hills: [[0, -2.8, 1.1, 0.2]], blocks: [rect(5.3, 6, -0.4, 0.5)], tunnels: [[-5.55, 0.6, 5.55, 0.75, 0, Math.PI / 2]], prop: "stela" },
    { name: "Mouth of the Stone Head", line: [[4.66, 0.825]], par: 2, edge: rect(-7, 7, -2, 2), tee: [-6, 0], cup: [6, 0], blocks: [rect(-1.2, 1.2, -2, -0.42), rect(-1.2, 1.2, 0.42, 2)], prop: "head" },
    { name: "The Pyramid", line: [[0.6807, 0.95]], par: 3, edge: rect(-6, 6, -3, 3), tee: [-5, 0], cup: [5, 0], blocks: [rect(-1.8, 1.8, -1.8, 1.8)], tunnels: [[-2.15, 0, 2.3, 0, Math.PI / 2, -Math.PI / 2]], hills: [[-3.6, -1.8, 1.0, 0.2], [3.6, 1.8, 1.0, 0.2]], prop: "pyramid" },
    { name: "Feathered Serpent", line: [[1.9722, 1], [5.4803, 0.975], [3.2987, 0.675]], par: 3, edge: rect(-7, 7, -3.5, 3.5), tee: [-6, -2.3], cup: [-6, 2.3], blocks: [rect(-7, 5.2, -0.5, 0.5)], via: [[6, 0]], hills: [[-1, -2.1, 1.3, 0.24], [0.6, 2.1, 1.3, 0.24]], prop: "serpent" },
    { name: "The Sun Stone", line: [[1.0996, 0.925]], par: 3, edge: rect(-6, 6, -2.5, 2.5), tee: [-5, 0], cup: [5, 0], bar: [0, 0, 3.8, 1.3], hills: [[-3.6, 0, 1.2, 0.24]], prop: "sun" },
    { name: "Temple of the Block", line: [[1.5184, 1]], par: 4, edge: rect(-7, 7, -4.5, 4.5), tee: [-6, 0], cup: [5.2, 0], bumpers: [[-3, -2, 0.5], [-3, 2, 0.5], [-0.5, 0, 0.6], [2, -2.4, 0.4], [2, 2.4, 0.4]], segs: ring(5.2, 0, 1.15, Math.PI), water: [rect(-6.9, -4.6, -4.4, -2.9)], hills: [[-1.8, -3.3, 1.0, 0.2], [-1.8, 3.3, 1.0, 0.2]], prop: "temple" }
  ];
  // Hole i's cell: rows of three played in a snake (left to right, back, then again).
  const cellOf = (i) => { const row = Math.floor(i / 3), k = i % 3, col = row % 2 ? 2 - k : k; return { x: CELL_X[col], z: CELL_Z[row], flip: row % 2 === 1 }; };
  // A hole in the cavern's frame: its walls as one Float64Array of segments, bumpers, the bar, tee and cup.
  const compiled = [];
  const compile = (i) => {
    if (compiled[i]) return compiled[i];
    const h = HOLES[i], c = cellOf(i), sx = c.flip ? -1 : 1, P = (x, z) => [c.x + x * sx, c.z + z];
    const segs = [], edge = h.edge.map(([x, z]) => P(x, z));
    for (let k = 0; k < edge.length; k++) { const a = edge[k], b = edge[(k + 1) % edge.length]; segs.push(a[0], a[1], b[0], b[1]); }
    for (const b of h.blocks || []) { const pts = b.map(([x, z]) => P(x, z)); for (let k = 0; k < 4; k++) { const a = pts[k], q = pts[(k + 1) % 4]; segs.push(a[0], a[1], q[0], q[1]); } }
    for (const s of h.segs || []) { const a = P(s[0], s[1]), b = P(s[2], s[3]); segs.push(a[0], a[1], b[0], b[1]); }
    const bumpers = new Float64Array((h.bumpers || []).flatMap(([x, z, r]) => [...P(x, z), r]));
    const bar = h.bar ? { x: P(h.bar[0], h.bar[1])[0], z: c.z + h.bar[1], len: h.bar[2], w: h.bar[3] * sx } : null;
    const water = (h.water || []).map((r) => { const pts = r.map(([x, z]) => P(x, z)); return { x0: Math.min(...pts.map((q) => q[0])), x1: Math.max(...pts.map((q) => q[0])), z0: Math.min(...pts.map((q) => q[1])), z1: Math.max(...pts.map((q) => q[1])) }; });
    const hills = new Float64Array((h.hills || []).flatMap(([x, z, r, H]) => [...P(x, z), r, H]));
    const tunnels = (h.tunnels || []).map(([x, z, x2, z2, a, face]) => { const q = P(x, z), q2 = P(x2, z2); return { x: q[0], z: q[1], x2: q2[0], z2: q2[1], angle: a, face, dx: Math.sin(a) * sx, dz: Math.cos(a) }; });
    // A bridge: its rails as walls, its creek as water either side, its arch as a height (in the cavern's frame).
    const bridges = (h.bridges || []).map(([x0, x1, z, hw, H]) => {
      const a = P(x0, z), b = P(x1, z), lo = Math.min(a[0], b[0]), hi = Math.max(a[0], b[0]), zc = a[1];
      return { x0: lo, x1: hi, z: zc, hw, H };
    });
    // The creek runs across the green under the bridge, from rail to rail (measured at the bridge's middle).
    for (const br of bridges) {
      for (const sz of [-1, 1]) segs.push(br.x0 - 0.05, br.z + sz * br.hw, br.x1 + 0.05, br.z + sz * br.hw);
      const xm = (br.x0 + br.x1) / 2;
      let top = br.z, bot = br.z;
      while (inside(edge, xm, top + 0.05)) top += 0.05;
      while (inside(edge, xm, bot - 0.05)) bot -= 0.05;
      water.push({ x0: br.x0, x1: br.x1, z0: bot, z1: br.z - br.hw - 0.02, creek: true }, { x0: br.x0, x1: br.x1, z0: br.z + br.hw + 0.02, z1: top, creek: true });
    }
    const tee = P(...h.tee), cup = P(...h.cup), via = (h.via || []).map(([x, z]) => { const q = P(x, z); return { x: q[0], z: q[1] }; });
    return (compiled[i] = { i, hole: h, cell: c, edge, via, water, hills, tunnels, bridges, segs: new Float64Array(segs), bumpers, bar, tee: { x: tee[0], z: tee[1] }, cup: { x: cup[0], z: cup[1] } });
  };
  const inside = (edge, x, z) => { let k = false; for (let a = 0, b = edge.length - 1; a < edge.length; b = a++) { const [xa, za] = edge[a], [xb, zb] = edge[b]; if ((za > z) !== (zb > z) && x < (xb - xa) * (z - za) / (zb - za) + xa) k = !k; } return k; };
  // The ground's height at x, z over a hole's hills, and its slope (written into `out`).
  const heightAt = (c, x, z, out) => {
    let y = 0, gx = 0, gz = 0;
    const H = c.hills;
    for (let i = 0; i < H.length; i += 4) {
      const dx = x - H[i], dz = z - H[i + 1], r2 = H[i + 2] * H[i + 2], u = (dx * dx + dz * dz) / r2;
      if (u >= 1) continue;
      const w = 1 - u; y += H[i + 3] * w * w;
      const k = -4 * H[i + 3] * w / r2; gx += k * dx; gz += k * dz;
    }
    const B = c.bridges;
    for (let i = 0; i < B.length; i++) {
      const b = B[i];
      if (x <= b.x0 || x >= b.x1 || Math.abs(z - b.z) > b.hw) continue;
      const L = b.x1 - b.x0, u = (x - b.x0) / L;
      y += b.H * Math.sin(Math.PI * u); gx += b.H * Math.PI / L * Math.cos(Math.PI * u);
    }
    if (out) { out.gx = gx; out.gz = gz; }
    return y;
  };
  const SLOPE = { gx: 0, gz: 0 };
  const createBall = () => ({ x: 0, z: 0, vx: 0, vz: 0, lastX: 0, lastZ: 0, moving: false, sunk: false, strokes: 0, bumps: 0, splashes: 0, hide: 0, tvx: 0, tvz: 0, tunnels: 0 });
  const placeAt = (ball, c) => { ball.x = ball.lastX = c.tee.x; ball.z = ball.lastZ = c.tee.z; ball.vx = ball.vz = 0; ball.moving = false; ball.sunk = false; ball.strokes = 0; ball.hide = 0; };
  const putt = (ball, angle, power) => {
    if (ball.moving || ball.sunk) return false;
    const s = Math.max(0.05, Math.min(1, power)) * MAX_SPEED;
    ball.vx = Math.sin(angle) * s; ball.vz = Math.cos(angle) * s; ball.moving = true; ball.strokes++; ball.lastX = ball.x; ball.lastZ = ball.z;
    return true;
  };
  // A wall segment: push the ball out of it and bounce off its normal (`vx`, `vz` the wall's own velocity there).
  const hitSeg = (ball, x0, z0, x1, z1, e, wx, wz) => {
    const dx = x1 - x0, dz = z1 - z0, L2 = dx * dx + dz * dz || 1;
    const t = Math.max(0, Math.min(1, ((ball.x - x0) * dx + (ball.z - z0) * dz) / L2)), px = x0 + dx * t, pz = z0 + dz * t;
    let nx = ball.x - px, nz = ball.z - pz;
    const d = Math.hypot(nx, nz);
    if (d >= BALL_R || d === 0) return false;
    nx /= d; nz /= d;
    ball.x = px + nx * BALL_R; ball.z = pz + nz * BALL_R;
    const rvx = ball.vx - wx, rvz = ball.vz - wz, vn = rvx * nx + rvz * nz;
    if (vn < 0) { ball.vx = rvx - (1 + e) * vn * nx + wx; ball.vz = rvz - (1 + e) * vn * nz + wz; ball.bumps++; }
    return true;
  };
  const SUB = 1 / 240;
  const step = (ball, c, t, dt) => {
    if (!ball.moving) return;
    for (let left = dt; left > 1e-9; left -= SUB) {
      const h = Math.min(SUB, left);
      // In a tunnel: out of sight until it rolls out of the far end.
      if (ball.hide > 0) { if ((ball.hide -= h) <= 0) { ball.hide = 0; ball.vx = ball.tvx; ball.vz = ball.tvz; } continue; }
      const sloped = c.hills.length || c.bridges.length;
      if (sloped) { heightAt(c, ball.x, ball.z, SLOPE); ball.vx -= ROLL_G * SLOPE.gx * h; ball.vz -= ROLL_G * SLOPE.gz * h; }
      const sp = Math.hypot(ball.vx, ball.vz);
      // At rest only where the ground is flat enough to hold it (on a slope it rolls on).
      if (sp < 0.04 && (!sloped || Math.hypot(SLOPE.gx, SLOPE.gz) * ROLL_G < DECEL)) { ball.vx = ball.vz = 0; ball.moving = false; return; }
      const k = sp > 0 ? Math.max(0, sp - (DECEL + DRAG * sp) * h) / sp : 0;
      ball.vx *= k; ball.vz *= k;
      ball.x += ball.vx * h; ball.z += ball.vz * h;
      const s = c.segs;
      for (let i = 0; i < s.length; i += 4) hitSeg(ball, s[i], s[i + 1], s[i + 2], s[i + 3], WALL_E, 0, 0);
      const b = c.bumpers;
      for (let i = 0; i < b.length; i += 3) {
        let nx = ball.x - b[i], nz = ball.z - b[i + 1];
        const d = Math.hypot(nx, nz), r = b[i + 2] + BALL_R;
        if (d < r && d > 0) { nx /= d; nz /= d; ball.x = b[i] + nx * r; ball.z = b[i + 1] + nz * r; const vn = ball.vx * nx + ball.vz * nz; if (vn < 0) { ball.vx -= (1 + BUMP_E) * vn * nx; ball.vz -= (1 + BUMP_E) * vn * nz; ball.bumps++; } }
      }
      if (c.bar) {
        // The bar turns about its middle; where the ball meets it, it moves at w x r.
        const a = t * c.bar.w, hx = Math.cos(a) * c.bar.len / 2, hz = Math.sin(a) * c.bar.len / 2, rx = ball.x - c.bar.x, rz = ball.z - c.bar.z;
        hitSeg(ball, c.bar.x - hx, c.bar.z - hz, c.bar.x + hx, c.bar.z + hz, 0.9, -c.bar.w * rz, c.bar.w * rx);
      }
      // The cup takes a ball that crosses it slowly enough; a fast one lips out, nudged off line.
      const cx = ball.x - c.cup.x, cz = ball.z - c.cup.z, cd = Math.hypot(cx, cz);
      if (cd < CUP_R) {
        if (Math.hypot(ball.vx, ball.vz) < SINK_SPEED) { ball.x = c.cup.x; ball.z = c.cup.z; ball.vx = ball.vz = 0; ball.moving = false; ball.sunk = true; return; }
        ball.vx -= cx * 6 * h; ball.vz -= cz * 6 * h;
      }
      // A tunnel's mouth swallows the ball; it comes out of the far end heading the tunnel's way.
      for (const tn of c.tunnels) if (Math.hypot(ball.x - tn.x, ball.z - tn.z) < TUNNEL_R) {
        const v = Math.max(TUNNEL_SPEED, Math.hypot(ball.vx, ball.vz) * 0.8);
        ball.x = tn.x2; ball.z = tn.z2; ball.vx = ball.vz = 0; ball.tvx = tn.dx * v; ball.tvz = tn.dz * v; ball.hide = TUNNEL_T; ball.tunnels++;
        break;
      }
      if (ball.hide > 0) continue;
      // In the water: back where it was struck from, and a stroke for the trouble.
      for (const w of c.water) if (ball.x > w.x0 && ball.x < w.x1 && ball.z > w.z0 && ball.z < w.z1) { ball.x = ball.lastX; ball.z = ball.lastZ; ball.vx = ball.vz = 0; ball.moving = false; ball.strokes++; ball.splashes++; return; }
      // Never out of the green: a ball that slipped through goes back where it was struck from.
      if (!inside(c.edge, ball.x, ball.z)) { ball.x = ball.lastX; ball.z = ball.lastZ; ball.vx = ball.vz = 0; ball.moving = false; return; }
    }
  };
  const totalPar = HOLES.reduce((a, h) => a + h.par, 0);
  BL.genesisGolfCourse = { CAVERN, HOLES, CELL_X, CELL_Z, BALL_R, CUP_R, MAX_SPEED, TUNNEL_R, compile, heightAt, cellOf, createBall, placeAt, putt, step, inside, totalPar };
})();
