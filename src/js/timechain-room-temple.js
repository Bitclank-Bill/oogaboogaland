// Room 2, Satoshi's Temple: dusk over misty mountains drawn like an ink painting, a full moon rising beside the hall
// with cranes crossing and the first stars, and one quiet line under the moon with the latest block. Through a torii
// and up a stone path lined with stone lanterns and hedges to the main hall, where Satoshi sits on a Corten plinth
// under a scroll with an ensō: a replica of Valentina Picozzi's statue in Lugano, made with her permission, half as
// large again as life, its polished steel panels all but vanishing face on and closing into one seated figure from an
// angle. A tatami deck of cushions before it, incense smoking, a gong, a singing bowl; a five-tier pagoda hung with
// wind bells in a bamboo grove; a bell tower over an arched bridge across a koi pond with a waterfall; a raked rock
// garden; cherry and maple trees shedding petals. Walkers step up what is low (the hall's steps, the bridge, the
// cushions) and shoulder round the rest. The bell rings once a block; a tap or Space beside it rings the bell, strikes
// the gong, rings the bowl or the wind bells, each heard, feeds the koi, shakes a tree, puts out or lights a lantern
// or the altar's candles, and wafts the incense.
(() => {
  "use strict";
  const BL = window.BL;
  const RM = BL.timechainRoomModels, CH = BL.timechainCharts, ROOMS = BL.timechainRooms;
  const { face, blank, ballGeo, UP, DOWN } = RM.helpers;
  const { merge, noShadow } = BL.models;
  const DEG = Math.PI / 180, TAU = Math.PI * 2;
  const smooth = (a, b, v) => { const t = Math.min(1, Math.max(0, (v - a) / (b - a))); return t * t * (3 - 2 * t); };

  // ---------- the statue ----------
  // A hooded figure sitting on the floor at a laptop, at life size in metres, facing -z with its seat on y 0: the trunk
  // slouched in one C-curve from seat to neck, shoulders 0.58 m up and 0.47 m across with the trapezius sloping up to a
  // neck 0.12 m thick, upper arms hanging 0.32 m straight down to elbows at the height of the knee tops, forearms
  // reaching forward to hands on the keys, thighs rising 15 degrees to knees that carry the laptop, shins crossing back
  // under them. The head is bowed 46 degrees over the screen, its face smooth inside a hood that drapes over the nape.
  // It is one smooth surface: every part a signed distance (negative inside), limbs tapering from joint to joint, each
  // part blending into its neighbours over a few centimetres, as a body in a hoodie does.
  const bound = (fn, cx, cy, cz, R) => Object.assign(fn, { cx, cy, cz, R });
  const ell = (cx, cy, cz, rx, ry, rz, p = 0, yw = 0) => {
    const yc = Math.cos(-yw), ys = Math.sin(-yw), pc = Math.cos(p), ps = Math.sin(p);
    return bound((x, y, z) => {
      let dx = x - cx, dy = y - cy, dz = z - cz;
      if (yw) { const nx = dx * yc + dz * ys; dz = -dx * ys + dz * yc; dx = nx; }
      if (p) { const ny = dy * pc - dz * ps; dz = dy * ps + dz * pc; dy = ny; }
      const ax = dx / rx, ay = dy / ry, az = dz / rz, bx = ax / rx, by = ay / ry, bz = az / rz;
      const k0 = Math.sqrt(ax * ax + ay * ay + az * az), k1 = Math.sqrt(bx * bx + by * by + bz * bz);
      return k1 < 1e-9 ? -Math.min(rx, ry, rz) : k0 * (k0 - 1) / k1;
    }, cx, cy, cz, Math.max(rx, ry, rz));
  };
  // A limb: a cone with rounded ends, radius `ra` at a and `rb` at b.
  const limb = (ax, ay, az, ra, bx, by, bz, rb) => {
    const bax = bx - ax, bay = by - ay, baz = bz - az, l2 = bax * bax + bay * bay + baz * baz, rr = ra - rb, a2 = l2 - rr * rr, il2 = 1 / l2;
    return bound((x, y, z) => {
      const pax = x - ax, pay = y - ay, paz = z - az, yy = pax * bax + pay * bay + paz * baz, zz = yy - l2;
      const qx = pax * l2 - bax * yy, qy = pay * l2 - bay * yy, qz = paz * l2 - baz * yy, x2 = qx * qx + qy * qy + qz * qz;
      const y2 = yy * yy * l2, z2 = zz * zz * l2, k = Math.sign(rr) * rr * rr * x2;
      if (Math.sign(zz) * a2 * z2 > k) return Math.sqrt(x2 + z2) * il2 - rb;
      if (Math.sign(yy) * a2 * y2 < k) return Math.sqrt(x2 + y2) * il2 - ra;
      return (Math.sqrt(x2 * a2 * il2) + yy * rr) * il2 - ra;
    }, (ax + bx) / 2, (ay + by) / 2, (az + bz) / 2, Math.sqrt(l2) / 2 + Math.max(ra, rb));
  };
  const PARTS = [
    // The trunk, slouched as a man sits on the floor at a laptop: the pelvis tipped back and the spine one C-curve, its
    // lower back rounded and nearly upright, curving forward over the shoulder blades into the neck.
    ell(0, 0.11, 0.005, 0.18, 0.11, 0.13), ell(0, 0.22, 0, 0.165, 0.15, 0.13, 0.1), ell(0, 0.37, -0.025, 0.17, 0.14, 0.13, 0.2),
    ell(0, 0.47, -0.05, 0.175, 0.12, 0.13, 0.35), ell(0, 0.55, -0.065, 0.17, 0.08, 0.1, 0.6),
    // The shoulders: the deltoids and the trapezius sloping up to the neck.
    ell(0.185, 0.55, -0.14, 0.06, 0.065, 0.065), ell(-0.185, 0.55, -0.14, 0.06, 0.065, 0.065),
    limb(0.03, 0.64, -0.1, 0.05, 0.17, 0.585, -0.14, 0.045), limb(-0.03, 0.64, -0.1, 0.05, -0.17, 0.585, -0.14, 0.045),
    // The neck, head and hood, the hood's back draped over the nape and its collar round the neck.
    limb(0, 0.6, -0.11, 0.06, 0, 0.725, -0.211, 0.052),
    ell(0, 0.752, -0.268, 0.077, 0.1, 0.1, 0.8), ell(0, 0.682, -0.246, 0.056, 0.062, 0.064, 0.8),
    ell(0, 0.784, -0.251, 0.1, 0.125, 0.125, 0.8), limb(0, 0.74, -0.16, 0.055, 0, 0.6, -0.06, 0.06), ell(0, 0.65, -0.14, 0.11, 0.06, 0.09, 0.5),
    // The arms in their sleeves, and the hands flat on the keys.
    limb(0.19, 0.555, -0.14, 0.056, 0.21, 0.27, -0.15, 0.046), limb(-0.19, 0.555, -0.14, 0.056, -0.21, 0.27, -0.15, 0.046),
    limb(0.21, 0.27, -0.15, 0.046, 0.1, 0.29, -0.36, 0.036), limb(-0.21, 0.27, -0.15, 0.046, -0.1, 0.29, -0.36, 0.036),
    ell(0.08, 0.292, -0.41, 0.04, 0.016, 0.07, 0, -0.3), ell(-0.08, 0.292, -0.41, 0.04, 0.016, 0.07, 0, 0.3),
    // The legs: thighs tapering from hip to knee, shins from knee to ankle, crossing; the feet.
    limb(0.09, 0.1, 0, 0.085, 0.27, 0.21, -0.38, 0.06), limb(-0.09, 0.1, 0, 0.085, -0.27, 0.21, -0.38, 0.06),
    limb(0.27, 0.205, -0.38, 0.056, -0.13, 0.06, -0.3, 0.036), limb(-0.27, 0.205, -0.38, 0.056, 0.13, 0.06, -0.44, 0.036),
    ell(-0.22, 0.045, -0.36, 0.045, 0.04, 0.12, 0, 0.8), ell(0.21, 0.045, -0.5, 0.045, 0.04, 0.12, 0, -0.8)
  ];
  const BLEND = 0.045, smin = (a, b) => { const h = Math.max(BLEND - Math.abs(a - b), 0) / BLEND; return Math.min(a, b) - h * h * BLEND * 0.25; };
  // The laptop: its base on the knees and its screen tipped back, each a box (middle, half sizes, tilt about x).
  const LAPTOP = [[0, 0.272, -0.39, 0.22, 0.011, 0.15, 0], [0, 0.44, -0.572, 0.22, 0.16, 0.012, -0.2]].map((b) => [...b, Math.cos(-b[6]), Math.sin(-b[6])]);
  // Whether a point is in the body, given the parts that can reach it (`near`).
  const inside = (x, y, z, parts = PARTS) => {
    for (const [cx, cy, cz, hx, hy, hz, , c, s] of LAPTOP) { const dy = y - cy, dz = z - cz; if (Math.abs(x - cx) < hx && Math.abs(dy * c - dz * s) < hy && Math.abs(dy * s + dz * c) < hz) return true; }
    // Starting a little outside changes no answer, and lets every part farther than that be skipped.
    let d = 0.2;
    for (const f of parts) {
      const ex = x - f.cx, ey = y - f.cy, ez = z - f.cz;
      if (Math.sqrt(ex * ex + ey * ey + ez * ez) - f.R > d + BLEND) continue;
      d = smin(d, f(x, y, z));
      if (d < -BLEND) return true;
    }
    return d < 0;
  };
  // The parts that can reach the line along z through (x, y): any other is farther than `inside` ever looks, so
  // leaving it out changes no answer.
  const near = (x, y) => PARTS.filter((f) => Math.sqrt((x - f.cx) * (x - f.cx) + (y - f.cy) * (y - f.cy)) - f.R <= 0.2 + BLEND);
  // Upright steel panels across the figure's width, each one plate cut to the body's cross-section there, held apart
  // by small spacers in a brick pattern. The gaps are narrow beside the body's depth, so they line up only when looking
  // straight down them: face on the figure is mostly air between thin edges, and a few degrees off it the polished
  // faces overlap into a solid body, stepping in at the contours. The engine has no reflections, so each face carries
  // its look as its colour: how much light reaches it (deep in the gap behind the next panel almost none, beside a step
  // a little less, and under each step the shadow that panel throws from the hall's high lamps) times polished steel
  // reflecting the hall, the sky's cool light higher on the figure and the timber floor's warm dark lower down.
  const S = { N: 48, W: 0.76, thick: 0.0065, rowH: 0.009, dz: 0.005, Z0: -0.66, NZ: 193 };
  const ROWS = Math.ceil(0.9 / S.rowH);
  // The build pauses after every `occRows` rows of a panel's sampling, every panel's outlines and every panel's faces;
  // a step at the doorway runs as many of those pieces as fit in `BUDGET` milliseconds, a step a frame, so the island
  // keeps its frames. `STATUE_STEPS` is how many steps it can take at most.
  const CHUNK = { occRows: 20 }, BUDGET = 8;
  const STATUE_STEPS = S.N * Math.ceil(Math.ceil(0.9 / S.rowH) / CHUNK.occRows) + 2 * S.N + 1;
  // Polished steel and its cut edges (duller and warmer): what each reflects by its height on the figure, from the warm
  // timber floor low down through the paper walls to the cool sky at the hood, lighter on faces that look up at the
  // lamps and darker on those that look down at the floor. The faces glow a little, so the baked light reads however
  // the hall's lamps fall on them.
  const STEEL = { ramp: [[0, [124, 114, 106]], [0.3, [172, 164, 156]], [0.55, [160, 168, 182]], [0.9, [214, 222, 234]]], up: [236, 228, 212], down: [88, 72, 62], glow: 0.42 };
  const CUT = { ramp: [[0, [96, 84, 74]], [0.5, [140, 130, 120]], [0.9, [170, 160, 150]]], up: [196, 182, 164], down: [70, 58, 50], glow: 0.3 };
  const steelColor = (T, light, y, ny) => {
    const R = T.ramp, c = [0, 0, 0];
    let k = 0;
    while (k < R.length - 2 && y > R[k + 1][0]) k++;
    const t = Math.min(1, Math.max(0, (y - R[k][0]) / (R[k + 1][0] - R[k][0]))), a = R[k][1], b = R[k + 1][1];
    for (let n = 0; n < 3; n++) {
      let v = a[n] + (b[n] - a[n]) * t;
      v = ny > 0 ? v + (T.up[n] - v) * ny : v + (T.down[n] - v) * -ny;
      c[n] = Math.round(Math.min(255, v * light));
    }
    return c;
  };
  // The fine streaks of the brushing: each row of each panel a shade apart, the same every build.
  const brush = (i, r) => { let n = Math.imul(i * 977 + r * 131 + 7, 0x45d9f3b); n = Math.imul(n ^ n >>> 16, 0x45d9f3b); return 0.955 + 0.09 * ((n ^ n >>> 16) >>> 0) / 4294967296; };
  const statueBuild = function* () {
    const { N, W, thick, rowH, dz, Z0, NZ } = S, rows = ROWS;
    const zb = (k) => Z0 - dz / 2 + k * dz, slatX = (i) => -W / 2 + (i + 0.5) * W / N, occ = [];
    for (let i = 0; i < N; i++) {
      const x = slatX(i), g = new Uint8Array(rows * NZ);
      for (let r = 0; r < rows; r++) {
        const y = (r + 0.5) * rowH, parts = near(x, y);
        for (let k = 0; k < NZ; k++) g[r * NZ + k] = inside(x, y, Z0 + k * dz, parts) ? 1 : 0;
        if (r % CHUNK.occRows === CHUNK.occRows - 1) yield;
      }
      occ.push(g);
    }
    const at = (j, r, k) => j >= 0 && j < N && r >= 0 && r < rows && k >= 0 && k < NZ && occ[j][r * NZ + k] === 1;
    const cellOf = (y, z) => [Math.floor(y / rowH + 1e-6), Math.floor((z - zb(0)) / dz + 1e-6)];
    const covered = (j, y, z) => { const [r, k] = cellOf(y, z); return at(j, r, k); };
    // The signed distance from a point to panel j's outline, negative inside it, looked for out to about 3.5 cm.
    const sdist = (j, y, z) => {
      const [r0, k0] = cellOf(y, z), inn = at(j, r0, k0);
      let best = 1;
      for (let r = r0 - 3; r <= r0 + 3; r++) {
        const ey = Math.max(0, Math.abs((r + 0.5) * rowH - y) - rowH / 2);
        if (ey * ey >= best) continue;
        for (let k = k0 - 7; k <= k0 + 7; k++) {
          if (at(j, r, k) === inn) continue;
          const ez = Math.max(0, Math.abs(zb(k) + dz / 2 - z) - dz / 2), d = ey * ey + ez * ez;
          if (d < best) best = d;
        }
      }
      return inn ? -Math.sqrt(best) : Math.sqrt(best);
    };
    // The lamps are above and in front of the figure; a panel 1.6 cm off the face throws its shadow this far down and back.
    const SY = 0.022, SZ = -0.0105;
    const faceLight = (j, y, z) => {
      const sd = sdist(j, y, z);
      if (sd <= 0) return 0.5 - 0.42 * smooth(0, 0.01, -sd);
      let lit = 0.5 + 0.5 * smooth(0, 0.03, sd);
      for (let t = 0.5; t < 1.6; t += 0.5) if (covered(j, y + SY * t, z + SZ * t)) lit *= 0.82;
      return lit;
    };
    const edgeLight = (j, y, z) => 0.45 + 0.55 * smooth(-0.006, 0.004, sdist(j, y, z));
    const runsOf = (test) => { const out = []; for (let k = 0; k < NZ;) { if (!test(k)) { k++; continue; } let e = k; while (e < NZ && test(e)) e++; out.push([k, e]); k = e; } return out; };
    // Each panel's outline follows the body exactly at every row line, so its edge runs as a smooth contour rather
    // than steps: a row's run of steel is a trapezoid between where the outline crosses the row's bottom and top lines.
    const across = (x, y, zc, dir, lim) => {
      const parts = near(x, y);
      let zi = zc, zo, n = 0;
      if (inside(x, y, zi, parts)) { zo = zi + dir * dz; while (inside(x, y, zo, parts)) { if (dir * (zo - lim) >= 0) return lim; if (++n > 16) return null; zi = zo; zo += dir * dz; } }
      else { zo = zi; zi -= dir * dz; while (!inside(x, y, zi, parts)) { if (++n > 16 || -dir * (zi - lim) >= 0) return null; zo = zi; zi -= dir * dz; } }
      for (let b = 0; b < 7; b++) { const zm = (zi + zo) / 2; if (inside(x, y, zm, parts)) zi = zm; else zo = zm; }
      return (zi + zo) / 2;
    };
    const shapes = [];
    for (let i = 0; i < N; i++) {
      const x = slatX(i), list = [];
      for (let r = 0; r < rows; r++) {
        const y0 = r * rowH, y1 = y0 + rowH, yc = y0 + rowH / 2, runs = runsOf((m) => at(i, r, m)), row = [];
        runs.forEach(([k, e], n) => {
          const mid = (zb(k) + zb(e)) / 2, fl = n ? (zb(runs[n - 1][1]) + zb(k)) / 2 : zb(0), bl = n < runs.length - 1 ? (zb(e) + zb(runs[n + 1][0])) / 2 : zb(NZ);
          const fc = across(x, yc, zb(k) + dz / 2, -1, fl) ?? zb(k), bc = across(x, yc, zb(e) - dz / 2, 1, bl) ?? zb(e);
          let f0 = across(x, y0, zb(k) + dz / 2, -1, fl) ?? fc, b0 = across(x, y0, zb(e) - dz / 2, 1, bl) ?? bc;
          let f1 = across(x, y1, zb(k) + dz / 2, -1, fl) ?? fc, b1 = across(x, y1, zb(e) - dz / 2, 1, bl) ?? bc;
          if (f0 > mid) f0 = Math.min(fc, mid);
          if (b0 < mid) b0 = Math.max(bc, mid);
          if (f1 > mid) f1 = Math.min(fc, mid);
          if (b1 < mid) b1 = Math.max(bc, mid);
          if (b0 - f0 < 0.002) { f0 = fc; b0 = bc; }
          if (b1 - f1 < 0.002) { f1 = fc; b1 = bc; }
          row.push({ k, e, f0, b0, f1, b1 });
        });
        list.push(row);
      }
      shapes.push(list);
      yield;
    }
    const geo = blank();
    // A quad of steel or cut edge, its colour the mean of the light at its corners.
    const quad = (T, a, b, c, d, n, L, tint) => {
      const light = (L[0] + L[1] + L[2] + L[3]) / 4 * tint, y = (a[1] + b[1] + c[1] + d[1]) / 4;
      face(geo, [a, b, c, d], steelColor(T, light, y, n[1]), T.glow, n);
    };
    // The parts of [a, b] that no interval in the list covers.
    const uncovered = (a, b, spans) => { let out = [[a, b]]; for (const [c, d] of spans) out = out.flatMap(([p, q]) => (d <= p || c >= q) ? [[p, q]] : [[p, Math.min(q, c)], [Math.max(p, d), q]].filter(([u, v]) => v - u > 0.0015)); return out; };
    const slant = (za, zc, s) => { const dzz = zc - za, l = Math.hypot(dzz, rowH); return s < 0 ? [0, dzz / l, -rowH / l] : [0, -dzz / l, rowH / l]; };
    const PX = [1, 0, 0], NX = [-1, 0, 0], PY = [0, 1, 0], NY = [0, -1, 0], PZ = [0, 0, 1], NZv = [0, 0, -1], ONE = [1, 1, 1, 1], jit = RM.paintKit.rng(5);
    for (let i = 0; i < N; i++) {
      const xa = slatX(i) - thick / 2, xb = slatX(i) + thick / 2, tint = 0.93 + 0.07 * jit();
      for (let r = 0; r < rows; r++) {
        const y0 = r * rowH, y1 = y0 + rowH;
        for (const { k, e, f0, b0, f1, b1 } of shapes[i][r]) {
          // The polished faces either side, cut only where the light on them changes; inner cut points stretch with the
          // outline so the faces never fold.
          const pts = [];
          for (let m = k; m < e; m += 2) pts.push(m);
          pts.push(e);
          const span = zb(e) - zb(k), z0 = pts.map((m) => f0 + (zb(m) - zb(k)) / span * (b0 - f0)), z1 = pts.map((m) => f1 + (zb(m) - zb(k)) / span * (b1 - f1));
          const streak = tint * brush(i, r);
          for (const s of [1, -1]) {
            const xf = s > 0 ? xb : xa, lo = z0.map((z) => faceLight(i + s, y0, z)), hi = z1.map((z) => faceLight(i + s, y1, z));
            const same = (m, n) => Math.abs(lo[m] - lo[n]) < 0.015 && Math.abs(hi[m] - hi[n]) < 0.015;
            const emit = (m, n) => quad(STEEL, [xf, y0, z0[m]], [xf, y0, z0[n]], [xf, y1, z1[n]], [xf, y1, z1[m]], s > 0 ? PX : NX, [lo[m], lo[n], hi[n], hi[m]], streak);
            let s0 = 0;
            for (let t = 1; t < pts.length; t++) {
              if (t < pts.length - 1 && same(t, s0)) continue;
              if (same(t, s0)) { emit(s0, t); s0 = t; continue; }
              if (t - 1 > s0) emit(s0, t - 1);
              emit(t - 1, t); s0 = t;
            }
          }
          // The cut edges at either end, darker where the panels beside reach past them.
          quad(CUT, [xa, y0, f0], [xb, y0, f0], [xb, y1, f1], [xa, y1, f1], slant(f0, f1, -1), [edgeLight(i - 1, y0, f0 - 0.006), edgeLight(i + 1, y0, f0 - 0.006), edgeLight(i + 1, y1, f1 - 0.006), edgeLight(i - 1, y1, f1 - 0.006)], 1);
          quad(CUT, [xa, y0, b0], [xb, y0, b0], [xb, y1, b1], [xa, y1, b1], slant(b0, b1, 1), [edgeLight(i - 1, y0, b0 + 0.006), edgeLight(i + 1, y0, b0 + 0.006), edgeLight(i + 1, y1, b1 + 0.006), edgeLight(i - 1, y1, b1 + 0.006)], 1);
          // And along the top and bottom wherever the next row does not carry on.
          const yt = y1 + 0.006, yd = y0 - 0.006;
          for (const [za, zc] of uncovered(f1, b1, (shapes[i][r + 1] || []).map((q) => [q.f0, q.b0])))
            quad(CUT, [xa, y1, za], [xb, y1, za], [xb, y1, zc], [xa, y1, zc], PY, [edgeLight(i - 1, yt, za), edgeLight(i + 1, yt, za), edgeLight(i + 1, yt, zc), edgeLight(i - 1, yt, zc)], 1);
          for (const [za, zc] of uncovered(f0, b0, (shapes[i][r - 1] || []).map((q) => [q.f1, q.b1])))
            quad(CUT, [xa, y0, za], [xb, y0, za], [xb, y0, zc], [xa, y0, zc], NY, [edgeLight(i - 1, yd, za), edgeLight(i + 1, yd, za), edgeLight(i + 1, yd, zc), edgeLight(i - 1, yd, zc)], 1);
        }
      }
      yield;
    }
    // The spacers: a short bar across each gap where both panels reach, every sixth row, offset gap to gap like brickwork.
    const bar = (x0, x1, y0, y1, z0, z1, side, cap) => {
      quad(CUT, [x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0], NZv, ONE, side); quad(CUT, [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], PZ, ONE, side);
      quad(CUT, [x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1], PY, ONE, cap); quad(CUT, [x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], NY, ONE, cap);
    };
    let spacers = 0;
    for (let i = 0; i < N - 1; i++) {
      const x0 = slatX(i) + thick / 2, x1 = slatX(i + 1) - thick / 2;
      for (let r = (i % 2) * 3; r < rows; r += 6) {
        const y0 = r * rowH + 0.002, y1 = (r + 1) * rowH - 0.002;
        for (const [k, e] of runsOf((m) => at(i, r, m) && at(i + 1, r, m))) {
          if (e - k < 4) continue;
          bar(x0, x1, y0, y1, zb(k) + 0.003, zb(k) + 0.008, 0.7, 0.45); bar(x0, x1, y0, y1, zb(e) - 0.008, zb(e) - 0.003, 0.7, 0.45); spacers += 2;
        }
      }
    }
    // The bar the panels hang on, across the figure's lap behind the laptop.
    {
      const [x0, x1, y0, y1, z0, z1] = [-0.22, 0.22, 0.267, 0.277, -0.246, -0.234];
      quad(STEEL, [x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1], PY, ONE, 1); quad(STEEL, [x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], NY, ONE, 0.6);
      quad(STEEL, [x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0], NZv, ONE, 1); quad(STEEL, [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], PZ, ONE, 1);
    }
    geo.slats = N;
    geo.spacers = spacers;
    return geo;
  };
  // Built once per page in steps at the doorway (`steps`), or whole when the plan asks for it first.
  const statueRead = BL.models.cachedSteps(statueBuild);
  const statue = () => BL.models.withScope("timechain", statueRead);
  // Each step false once the statue is built, so the doorway spends no frame on the steps left over.
  const steps = () => {
    let it = null, done = false;
    const advance = () => BL.models.withScope("timechain", () => {
      if (done) return false;
      if (!it) it = statueRead.steps();
      const end = performance.now() + BUDGET;
      let next;
      do next = it.next(); while (!next.done && performance.now() < end);
      if (next.done) { done = true; it = null; }
      return true;
    });
    return Array.from({ length: STATUE_STEPS }, () => advance);
  };

  // ---------- shapes the kit lacks ----------
  // A square-based roof or lamp cap: a frustum `wBot` by `dBot` at its foot, its top `topFrac` of that, about its middle.
  const frustum = (wBot, dBot, topFrac, h, color) => {
    const geo = blank(), a = wBot / 2, b = dBot / 2, c = a * topFrac, d = b * topFrac, y0 = -h / 2, y1 = h / 2;
    const B = [[-a, y0, -b], [a, y0, -b], [a, y0, b], [-a, y0, b]], T = [[-c, y1, -d], [c, y1, -d], [c, y1, d], [-c, y1, d]];
    face(geo, T, color, 0, UP);
    face(geo, B, color, 0, DOWN);
    for (let k = 0; k < 4; k++) { const n = (k + 1) % 4; face(geo, [B[k], B[n], T[n], T[k]], color, 0, [B[k][0] + B[n][0], 0, B[k][2] + B[n][2]]); }
    return geo;
  };
  // An icosahedron of radius 1, once subdivided when `fine`: rocks, and the blossom clumps of the trees.
  const ICO = (() => {
    const t = (1 + Math.sqrt(5)) / 2, v = [[-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0], [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t], [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1]].map((p) => { const l = Math.hypot(...p); return p.map((c) => c / l); });
    const f = [[0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11], [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8], [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9], [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]];
    const coarse = f.map((tri) => tri.map((i) => v[i]));
    const mid = (a, b) => { const p = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2], l = Math.hypot(...p); return p.map((c) => c / l); };
    const fine = [];
    for (const [a, b, c] of coarse) { const ab = mid(a, b), bc = mid(b, c), ca = mid(c, a); fine.push([a, ab, ca], [ab, b, bc], [ca, bc, c], [ab, bc, ca]); }
    return { coarse, fine };
  })();
  const ico = (color, sx, sy, sz, fine = false, ry = 0, emissive = 0) => {
    const geo = blank(), c = Math.cos(ry), s = Math.sin(ry);
    for (const tri of fine ? ICO.fine : ICO.coarse) {
      const pts = tri.map(([x, y, z]) => [(x * c + z * s) * sx, y * sy, (-x * s + z * c) * sz]);
      face(geo, pts, color, emissive, [(pts[0][0] + pts[1][0] + pts[2][0]) / sx, (pts[0][1] + pts[1][1] + pts[2][1]) / sy, (pts[0][2] + pts[1][2] + pts[2][2]) / sz]);
    }
    return geo;
  };
  // A ball squashed to an ellipsoid: hedges, leaves, bonsai pads.
  const blob = (rx, ry, rz, color, segments = 10, emissive = 0) => {
    const geo = ballGeo(1, color, segments, emissive), v = geo.verts;
    for (let i = 0; i < v.length; i += 3) { v[i] *= rx; v[i + 1] *= ry; v[i + 2] *= rz; }
    return geo;
  };
  // A flat ellipse of `n` corners as [x, z] points round (x, z).
  const ellipse = (x, z, rx, rz, n) => Array.from({ length: n }, (_, i) => { const a = i / n * TAU; return [x + Math.sin(a) * rx, z + Math.cos(a) * rz]; });
  // A flat ellipse facing up at height `y`, as a fan of `n` triangles, so no face has more corners than Canvas 2D clips.
  const disc = (x, z, rx, rz, n, y, color, emissive = 0) => {
    const geo = blank(), pts = ellipse(x, z, rx, rz, n);
    for (let i = 0; i < n; i++) { const a = pts[i], b = pts[(i + 1) % n]; face(geo, [[x, y, z], [a[0], y, a[1]], [b[0], y, b[1]]], color, emissive, UP); }
    return geo;
  };
  const headingTo = (x, z, tx, tz) => Math.atan2(-(tx - x), -(tz - z));
  const polar = (r, b) => ({ x: r * Math.sin(b * DEG), z: r * Math.cos(b * DEG) });

  // ---------- the place ----------
  const C = {
    red: "#b8402a", dark: "#2a1a12", stone: "#8a857c", stoneDark: "#6e6a63", wood: "#5a3a22", pillar: "#7a2a1e", roof: "#2e3440", gold: "#d4a63a", paper: "#e6dfd0",
    plat: "#9a948a", bark: "#4a2e1e", hedge: "#3f6b3a", moss: "#55733a", lamp: "#ffc46b", lampRed: "#e8573a", cushion: "#2b3566", mat: "#1d2447", bronze: "#7a5a2e",
    bronzeDark: "#5a4020", rope: "#c9b48a", flame: "#ffb03a"
  };
  const HALL_Z = -9.6, DECK_Z = -3.9, STATUE_Z = HALL_Z - 0.7, ALTAR_Z = HALL_Z + 1.0;
  const POND = { x: 7.2, z: -1.8, rx: 3.6, rz: 3.2 }, BELL = { x: 7.6, z: -8.8 }, PAGODA = { x: -8.4, z: -4.6 }, ROCK = { x: -6.6, z: -9.2, r: 2.5 };
  const CHERRY = [[-5.2, 6.2], [5.2, 8.2]], MAPLE = { x: -9.2, z: 3.0 }, GONG = { x: 3.95, z: DECK_Z - 1.2 }, BURNER = { x: 0, z: -0.6 }, BOWL = { x: -3.2, z: DECK_Z + 1.9 };
  const TREES = [{ x: CHERRY[0][0], z: CHERRY[0][1], name: "Cherry" }, { x: CHERRY[1][0], z: CHERRY[1][1], name: "Cherry" }, { x: MAPLE.x, z: MAPLE.z, name: "Maple" }];
  const GARDEN_ROCKS = [[-7.2, -9.6, 0.55], [-5.9, -8.6, 0.38], [-6.2, -10.3, 0.3]];
  // The stone lanterns: three pairs up the path, one by the pond, one by the bell tower and one by the pagoda.
  const LANTERN_AT = [[-2.0, 7.2], [2.0, 7.2], [-2.0, 4.0], [2.0, 4.0], [-2.0, 0.9], [2.0, 0.9], [POND.x - 1.6, 3.6], [BELL.x - 2.0, BELL.z + 2.2], [PAGODA.x + 2.2, PAGODA.z + 1.8]];
  // The altar's candles across it, the paper lamps along the hall's front, the pagoda's tiers and the bamboo's clumps.
  const CANDLES = [-1.0, -0.6, 0.6, 1.0], PAPER = [-3.0, -1.5, 0, 1.5, 3.0], TIERS = 5, CLUMPS = 6;
  const MOON = { az: 22, el: 34 }, LINE = { az0: 10, az1: 34, el0: 25, el1: 29, w: 1200 };
  const SKY = [[90, "#0c0f2c"], [55, "#2a2456"], [28, "#6e4a7a"], [12, "#c9756a"], [3, "#f0b07a"], [-90, "#f0b07a"]];
  // The bridge's arch: its deck's height at `t` of the way across, from the pond's near end (+z) to the bell tower's.
  const BRIDGE = { z0: POND.z + POND.rz + 0.9, z1: POND.z - POND.rz - 0.9, rise: 1.1, base: 0.12, walk: 14 };
  const archY = (t) => BRIDGE.base + BRIDGE.rise * Math.sin(Math.PI * t);
  const KOI_COLORS = ["#f26a1b", "#f4f1e6", "#f2a01b", "#e8501b", "#f4f1e6"];
  const KOI = Array.from({ length: 10 }, (_, i) => ({ r: 0.7 + (i % 4) * 0.55, a: i * 0.9, w: (i % 2 ? 1 : -1) * (0.3 + i * 0.03) }));
  const PETALS = 30, SMOKE = 7, STREAKS = 8, RIPPLES = 3;
  // The statue at half as large again as life, on a plinth grown to carry it: its half sizes and height.
  const STATUE_SCALE = 1.5, PLINTH = { W: 0.95, D: 0.9, H: 0.85 };
  // The dome's own picture and its map, kept when painted, so the line under the moon paints the sky behind it.
  let domeCanvas = null, domeMap = null;
  // The latest block the line under the moon has read, and how many new ones it has seen: the bell rings for each.
  const chime = { height: null, count: 0, text: "" };

  // ---------- the temple's sounds ----------
  // The bell, the gong, the singing bowl and the pagoda's wind bells, synthesized and pooled: every voice is built once,
  // the first time a gesture lets the page make sound, as pairs of partials a hair apart (so they beat as cast bronze
  // does) whose gains a strike schedules, with a burst of filtered noise for the blow itself. Each `f` is a voice's
  // lowest partial in hertz; `parts` are [ratio, level, seconds to die away]; `bloom` slows the higher partials' swell
  // (a gong blooms after the hit); `thud` is the blow's [band in hertz, Q, level, seconds]; `reach` is how far off it
  // sounds half as loud. Everything plays through the page-wide mute (`BL.sound.output`); closed on leaving.
  const VOICES = {
    bell: { f: 73.4, parts: [[0.5, 0.55, 24], [1, 1, 18], [1.183, 0.5, 12], [1.505, 0.32, 9], [2, 0.34, 7], [2.51, 0.2, 5], [2.97, 0.16, 4], [4.07, 0.09, 2.5]], beat: 0.55, bloom: 0, thud: [180, 0.9, 0.9, 0.22], level: 0.2, reach: 16 },
    gong: { f: 98, parts: [[1, 0.75, 7], [1.52, 0.5, 6.5], [2.03, 0.46, 6], [2.48, 0.38, 5], [3.02, 0.32, 4.5], [3.61, 0.24, 3.5], [4.23, 0.18, 3], [5.1, 0.12, 2.4]], beat: 1.3, bloom: 0.5, thud: [140, 0.7, 1.2, 0.12], level: 0.18, reach: 9 },
    bowl: { f: 261.6, parts: [[1, 1, 14], [2.76, 0.42, 8], [5.4, 0.16, 4], [8.93, 0.06, 2]], beat: 1.9, bloom: 0, thud: [2200, 2.5, 0.4, 0.03], level: 0.22, reach: 7 }
  };
  // The wind bells: a pentatonic run of small bells, each struck note ringing with its overtone.
  const CHIME_NOTES = [1568, 1760, 2093, 2349, 2637, 3136], CHIME_OVERTONE = 2.76;
  const sounds = () => {
    let ctx = null, disposed = false, nextChime = 0;
    const voices = {}, chimes = [];
    // A pooled gain taken from wherever it is now to `peak` over `attack`, then let die away over `fade` seconds.
    const envelope = (param, t, peak, attack, fade) => {
      if (param.cancelAndHoldAtTime) param.cancelAndHoldAtTime(t); else { param.cancelScheduledValues(t); param.setValueAtTime(param.value, t); }
      param.linearRampToValueAtTime(peak, t + attack);
      param.setTargetAtTime(0, t + attack, fade / 4.6);
    };
    const build = () => {
      ctx = new AudioContext();
      const out = ctx.createGain();
      out.connect(BL.sound.output(ctx));
      const buffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate), data = buffer.getChannelData(0);
      let seed = 2140;
      for (let i = 0; i < data.length; i++) { seed = (Math.imul(seed, 1103515245) + 12345) | 0; data[i] = (seed >>> 0) / 2147483648 - 1; }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer; noise.loop = true; noise.start();
      const tone = (hz) => { const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.value = hz; g.gain.value = 0; o.connect(g); g.connect(out); o.start(); return { o, g }; };
      for (const name in VOICES) {
        const v = VOICES[name], parts = [];
        v.parts.forEach(([ratio, level, fade], i) => { for (const side of [-1, 1]) parts.push({ ...tone(v.f * ratio + side * v.beat / 2), level: level / 2, fade, attack: 0.004 + v.bloom * i / v.parts.length }); });
        const band = ctx.createBiquadFilter(), thud = ctx.createGain();
        band.type = "bandpass"; band.frequency.value = v.thud[0]; band.Q.value = v.thud[1]; thud.gain.value = 0;
        noise.connect(band); band.connect(thud); thud.connect(out);
        voices[name] = { v, parts, thud };
      }
      for (const note of CHIME_NOTES) chimes.push([tone(note), tone(note * CHIME_OVERTONE)]);
    };
    // A context only once the page has had a gesture (a tap or a key in the room makes it), woken if the browser has
    // suspended it.
    const wake = () => {
      if (disposed || typeof AudioContext === "undefined") return false;
      if (!ctx) {
        if (navigator.userActivation && !navigator.userActivation.hasBeenActive) return false;
        build();
      }
      if (ctx.state === "suspended") ctx.resume().catch(() => {});
      return true;
    };
    // How loud a sound `reach` metres from half as loud is at the ear.
    const near = (ear, at, reach) => { const d = Math.hypot(ear.x - at.x, ear.z - at.z) / reach; return 1 / (1 + d * d); };
    const strike = (name, strength, ear, at) => {
      if (!wake()) return;
      const { v, parts, thud } = voices[name], t = ctx.currentTime, k = v.level * strength * near(ear, at, v.reach);
      for (const p of parts) envelope(p.g.gain, t, p.level * k, p.attack, p.fade);
      envelope(thud.gain, t, v.thud[2] * k, 0.003, v.thud[3]);
    };
    // A breath of wind through the wind bells: a few notes over a second or two, each on the next small bell.
    const ring = (strength, ear, at) => {
      if (!wake()) return;
      const t = ctx.currentTime, k = 0.05 * strength * near(ear, at, 9), n = 3 + Math.floor(Math.random() * 4);
      for (let i = 0; i < n; i++) {
        const [a, b] = chimes[nextChime], when = t + Math.random() * 1.6, note = CHIME_NOTES[Math.floor(Math.random() * CHIME_NOTES.length)];
        nextChime = (nextChime + 1) % chimes.length;
        a.o.frequency.setValueAtTime(note, when); b.o.frequency.setValueAtTime(note * CHIME_OVERTONE, when);
        envelope(a.g.gain, when, k, 0.002, 1.6); envelope(b.g.gain, when, k * 0.35, 0.002, 0.7);
      }
    };
    return {
      wake, strike, ring,
      // How loud each voice is just now (the sum of its partials' gains), for the debug handle.
      get stats() {
        const level = (name) => voices[name] ? +voices[name].parts.reduce((sum, p) => sum + p.g.gain.value, 0).toFixed(4) : 0;
        return { contexts: ctx ? 1 : 0, state: ctx ? ctx.state : "none", voices: Object.keys(voices).length, chimes: chimes.length, levels: { bell: level("bell"), gong: level("gong"), bowl: level("bowl") } };
      },
      dispose() { disposed = true; if (ctx) ctx.close().catch(() => {}); ctx = null; }
    };
  };

  // A stone lantern of the kasuga kind: a six-sided foot, its post, a platform, the firebox open between four corner
  // posts with its light inside on a node of its own (it flickers, and a tap or Space puts it out or lights it), a roof
  // whose corners curl up, and the jewel on top.
  const lantern = (K, x, z, i, flame) => {
    K.cyl(0.36, 0.42, 0.16, C.stone, x, 0.08, z, { seg: 6 });
    K.cyl(0.11, 0.13, 0.7, C.stone, x, 0.51, z, { seg: 10 });
    K.cyl(0.32, 0.2, 0.14, C.stone, x, 0.93, z, { seg: 6 });
    K.box(0.5, 0.05, 0.5, C.stone, x, 1.025, z);
    for (const [dx, dz] of [[-0.21, -0.21], [0.21, -0.21], [-0.21, 0.21], [0.21, 0.21]]) K.box(0.08, 0.34, 0.08, C.stone, x + dx, 1.22, z + dz);
    K.box(0.5, 0.05, 0.5, C.stone, x, 1.415, z);
    K.add(frustum(0.92, 0.92, 0.14, 0.3, C.stoneDark), x, 1.59, z);
    for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) K.box(0.12, 0.05, 0.12, C.stoneDark, x + dx * 0.44, 1.47, z + dz * 0.44, { ry: Math.PI / 4, rx: dz * 0.45, rz: -dx * 0.45 });
    K.ball(0.08, C.stoneDark, x, 1.8, z, { seg: 8 });
    K.cyl(0, 0.05, 0.1, C.stoneDark, x, 1.9, z, { seg: 6 });
    K.node(`lamp${i}`, flame, x, 1.22, z, { glow: true, target: { kind: "lantern", tip: "Stone lantern · tap to put it out, or light it", radius: 0.55, index: i } });
    K.solid({ x, z, r: 0.42 });
  };
  // A tree: its trunk and two limbs, and its crown of blossom or leaves on a node of its own (`name`), pivoting where
  // the crown meets the trunk, so it sways and shakes.
  const tree = (K, x, z, colors, n, seed, name, index, tip) => {
    K.cyl(0.17, 0.27, 2.8, C.bark, x, 1.4, z, { rz: 0.08, seg: 10 });
    K.cyl(0.08, 0.12, 1.7, C.bark, x + 0.6, 2.8, z + 0.1, { rz: -0.9, seg: 8 });
    K.cyl(0.07, 0.11, 1.5, C.bark, x - 0.5, 2.9, z - 0.2, { rz: 0.8, seg: 8 });
    const r = RM.paintKit.rng(seed);
    K.node(name, (k) => {
      for (let i = 0; i < n; i++) {
        const s = 0.5 + r() * 0.5, px = (r() - 0.45) * 3.0, py = 0.4 + r() * 1.6, pz = (r() - 0.5) * 2.6;
        k.add(ico(colors[i % colors.length], s, s * 0.8, s, true, 0, 0.14), px, py, pz);
      }
    }, x, 2.6, z, { target: { kind: "tree", tip, radius: 2.0, index } });
    K.solid({ x, z, r: 0.32 });
  };

  // The Corten plinth about its foot's middle, `PLINTH` its half sizes and height: weathered steel in mottled patches
  // of rust.
  const plinth = () => {
    const geo = blank(), r = RM.paintKit.rng(71), { W, H, D } = PLINTH, n = 0.12;
    const rust = () => { const v = r(); return v < 0.4 ? "#6b3219" : v < 0.65 ? "#76391d" : v < 0.82 ? "#5c2a15" : v < 0.94 ? "#80431f" : "#4c2211"; };
    // A face of the box in patches about `n` across: `o` its corner, `u` and `v` its two sides.
    const side = (o, u, v, normal) => {
      const nu = Math.max(1, Math.round(Math.hypot(...u) / n)), nv = Math.max(1, Math.round(Math.hypot(...v) / n));
      for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) {
        const p = (a, b) => [o[0] + u[0] * a / nu + v[0] * b / nv, o[1] + u[1] * a / nu + v[1] * b / nv, o[2] + u[2] * a / nu + v[2] * b / nv];
        face(geo, [p(i, j), p(i + 1, j), p(i + 1, j + 1), p(i, j + 1)], rust(), 0, normal);
      }
    };
    for (const s of [-1, 1]) {
      side([-W, 0, s * D], [2 * W, 0, 0], [0, H, 0], [0, 0, s]);
      side([s * W, 0, -D], [0, 0, 2 * D], [0, H, 0], [s, 0, 0]);
    }
    side([-W, H, -D], [2 * W, 0, 0], [0, 0, 2 * D], UP);
    return geo;
  };

  // ---------- its door ----------
  // Shōji: paper leaves in a dark timber lattice over a solid wooden foot, a round pull let into each, in a timber
  // frame between round posts under a little tiled roof with curled ends, a red paper lantern hung either side.
  const door = {
    casing: "#e6dfd0", frame: "#2a1a12", header: "#2a1a12", word: "#e8c070", strip: null, chain: false,
    leaf: "#efe7d4", seam: "#2a1a12", plate: "#2a1a12", face: "#b8402a", mark: "#f3eee0",
    leafFace(side, H) {
      const dark = "#3a2616", x0 = -0.75, x1 = 0.75, top = H.D;
      H.rect(x0, 0, x1, 0.55, "#5a3a22");
      for (const [a, b] of [[x0, x0 + 0.06], [x1 - 0.06, x1]]) H.rect(a, 0, b, top, dark, 0, 1);
      for (const y of [0, 0.55, top - 0.06]) H.rect(x0, y, x1, y + 0.06, dark, 0, 1);
      for (let k = 1; k < 3; k++) H.rect(x0 + k * 0.5 - 0.0125, 0.55, x0 + k * 0.5 + 0.0125, top, dark, 0, 1);
      for (let y = 0.99; y < top - 0.1; y += 0.44) H.rect(x0, y - 0.0125, x1, y + 0.0125, dark, 0, 1);
      H.ring(H.inner + side * 0.22, 1.05, 0.06, 0.018, "#1a100a", 0, 12, 2);
    }
  };
  const doorTrim = (K, L) => {
    const d = RM.doorway(L), z = d.Z - 0.3, x = d.W + d.F + 0.1;
    K.box(4.6, 0.1, 0.62, C.roof, 0, d.head + 0.13, z);
    K.box(4.2, 0.14, 0.5, "#3a3f4a", 0, d.head + 0.24, z);
    for (const sx of [-1, 1]) K.box(0.5, 0.1, 0.62, C.roof, sx * 2.45, d.head + 0.2, z, { rz: sx * 0.3 });
    for (const sx of [-1, 1]) K.cyl(0.08, 0.09, d.head + 0.1, C.dark, sx * x, (d.head + 0.1) / 2, d.Z - 0.12, { seg: 10 });
    for (const sx of [-1, 1]) {
      K.box(0.02, 0.4, 0.02, C.dark, sx * 2.32, 3.15, d.Z - 0.35);
      K.cyl(0.17, 0.17, 0.36, C.lampRed, sx * 2.32, 2.75, d.Z - 0.35, { emissive: 0.85, seg: 14, glow: true });
      K.cyl(0.12, 0.12, 0.04, C.dark, sx * 2.32, 2.95, d.Z - 0.35, { seg: 12 });
      K.cyl(0.12, 0.12, 0.04, C.dark, sx * 2.32, 2.55, d.Z - 0.35, { seg: 12 });
    }
  };

  const plan = (K, L) => {
    doorTrim(K, L);
    const r0 = L.r0;
    K.wallColor(C.paper);
    K.render({ sky: [0.62, 0.55, 0.56], ground: [0.3, 0.24, 0.22], ambientFloor: 0.42, bloomStrength: 0.6 });

    // The dome: dusk over misty mountains like an ink painting, the moon rising beside the hall, cranes and the first stars.
    K.dome((ctx, D) => {
      domeCanvas = ctx.canvas; domeMap = D;
      // The mock-up's sky was 1024 pixels from pole to pole; its sizes in those pixels, as metres on this dome.
      const R = D.L.R, m = (px) => px * 180 / 1024 * DEG * R, r = D.rng(61);
      // Something drawn in metres about (az, el), so it is round on the dome.
      const at = (az, el, s, draw) => D.wrap(ctx, () => { ctx.translate(D.x(az), D.y(el)); ctx.scale(D.perX(el) * s, D.perY(el) * s); draw(); });
      D.sky(ctx, SKY);
      D.stars(ctx, 44, 260, 13);
      // Long faint clouds low over the mountains.
      for (let i = 0; i < 14; i++) {
        const az = r() * 360 - 180, el = 16 + r() * 16, rx = m(60 + r() * 80), ry = m(4 + r() * 4);
        at(az, el, 1, () => { ctx.fillStyle = "rgba(255,220,200,.12)"; ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, TAU); ctx.fill(); });
      }
      // The full moon in its halo.
      at(MOON.az, MOON.el, 1, () => {
        const halo = ctx.createRadialGradient(0, 0, 0, 0, 0, m(110));
        halo.addColorStop(0, "rgba(255,240,215,.55)"); halo.addColorStop(1, "rgba(255,240,215,0)");
        ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(0, 0, m(110), 0, TAU); ctx.fill();
        ctx.fillStyle = "#f6ecd2"; ctx.beginPath(); ctx.arc(0, 0, m(34), 0, TAU); ctx.fill();
        ctx.fillStyle = "rgba(170,160,140,.35)";
        for (const [x, y, rr] of [[-9, -8, 7], [10, 5, 6], [-3, 13, 5], [12, -10, 4]]) { ctx.beginPath(); ctx.arc(m(x), m(y), m(rr), 0, TAU); ctx.fill(); }
      });
      // Four ranges of mountains, paler and lower far off, darker and taller near, misted at their feet. Their shapes
      // blend over the door, where the canvas's two edges meet.
      const e0 = ROOMS.edgeEl(L, 0) / DEG;
      [["rgba(130,115,170,.55)", 17, 0.4, 2.2], ["rgba(95,80,135,.72)", 12.5, 1.9, 3.1], ["rgba(62,52,100,.88)", 8.5, 3.3, 4.3], ["rgba(34,29,58,1)", 5.2, 5.1, 6.7]].forEach(([color, amp, ph, k]) => {
        const peak = (az) => { const a = az * DEG; return e0 + 0.5 + amp * (0.3 + 0.5 * Math.pow(Math.abs(Math.sin(a * k + ph)), 1.6) + 0.2 * Math.abs(Math.sin(a * k * 2.7 + ph * 1.3))); };
        const h = (az) => { const w = smooth(165, 195, Math.abs(az)); return peak(az) * (1 - w) + peak(az - 360 * Math.sign(az)) * w; };
        ctx.beginPath(); ctx.moveTo(0, D.y(e0 - 3));
        for (let az = -180; az <= 180; az += 0.5) ctx.lineTo((az + 180) / 360 * D.W, D.y(h(az)));
        ctx.lineTo(D.W, D.y(e0 - 3)); ctx.closePath();
        const g = ctx.createLinearGradient(0, D.y(e0 + amp), 0, D.y(e0));
        g.addColorStop(0, color); g.addColorStop(1, "rgba(240,190,160,.55)");
        ctx.fillStyle = g; ctx.fill();
      });
      // Cranes crossing: four to the left of the hall, two to the right.
      for (const [az, el, s] of [[-34, 24, 1], [-30, 26, 0.8], [-27, 23.5, 0.9], [-24, 25.5, 0.7], [58, 30, 0.8], [62, 31.5, 0.7]]) at(az, el, m(1) * s * 1.2, () => {
        ctx.strokeStyle = "rgba(255,250,240,.85)"; ctx.lineWidth = 2.5; ctx.lineCap = "round";
        ctx.beginPath(); ctx.moveTo(-12, -2); ctx.quadraticCurveTo(-5, -9, 0, 0); ctx.quadraticCurveTo(5, -9, 12, -2); ctx.stroke();
      });
    });
    // The line under the moon: the latest block, repainted when a new one comes, over the dome's own sky.
    const lineH = Math.round(LINE.w * (LINE.el1 - LINE.el0) / (Math.cos((LINE.el0 + LINE.el1) / 2 * DEG) * (LINE.az1 - LINE.az0)));
    K.live({
      az0: LINE.az0, az1: LINE.az1, el0: LINE.el0, el1: LINE.el1, w: LINE.w, h: lineH, tip: "The latest block · the bell rings once a block",
      key: (f) => {
        const blocks = f.reader.value("recent"), b = blocks && blocks[0], height = b ? b.height : null;
        if (height !== null) { if (chime.height !== null && height > chime.height) chime.count++; chime.height = height; }
        return `${height}|${f.reader.status("recent")}`;
      },
      paint: (ctx, f) => {
        const w = ctx.canvas.width, h = ctx.canvas.height, blocks = f.reader.value("recent"), b = blocks && blocks[0], P = RM.paintKit;
        if (domeCanvas) {
          const x0 = domeMap.x(LINE.az0), y0 = domeMap.y(LINE.el1);
          ctx.drawImage(domeCanvas, x0, y0, domeMap.x(LINE.az1) - x0, domeMap.y(LINE.el0) - y0, 0, 0, w, h);
        } else { ctx.fillStyle = "#6e4a7a"; ctx.fillRect(0, 0, w, h); }
        chime.text = b ? `Block ${CH.format.group(b.height)}` : "";
        P.pix(ctx, b ? CH.format.group(b.height) : "...", w / 2, h * 0.4, h * 0.38, "rgba(52,30,64,.82)");
        ctx.fillStyle = "rgba(52,30,64,.72)"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.font = P.font(400, h * 0.26, P.HAND);
        ctx.fillText("the bell rings once a block", w / 2, h * 0.84);
      }
    });

    // The floor: raked gravel, moss, stone paths and the rock garden's rings, and petals under the cherries.
    K.floor((ctx, F) => {
      const { N, s, X, Y } = F, r = F.rng(3);
      ctx.fillStyle = "#bdb6a8"; ctx.fillRect(0, 0, N, N);
      ctx.strokeStyle = "rgba(90,84,74,.1)"; ctx.lineWidth = 3;
      for (let z = -r0; z < r0; z += 0.12) { ctx.beginPath(); ctx.moveTo(0, Y(z)); ctx.lineTo(N, Y(z)); ctx.stroke(); }
      const moss = (x, z, rr) => {
        const g = ctx.createRadialGradient(X(x), Y(z), 0, X(x), Y(z), rr * s);
        g.addColorStop(0, "#4f6b34"); g.addColorStop(0.75, "#56723a"); g.addColorStop(1, "rgba(86,114,58,0)");
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(X(x), Y(z), rr * s, 0, TAU); ctx.fill();
      };
      moss(PAGODA.x, PAGODA.z, 3.6); moss(MAPLE.x, MAPLE.z, 2.6);
      for (const [x, z] of CHERRY) moss(x, z, 2.6);
      for (let b = 215; b < 320; b += 12) { const p = polar(r0 - 1.6, b); moss(p.x, p.z, 2.4); }
      moss(BELL.x, BELL.z, 2.6);
      ctx.fillStyle = "#bdb6a8"; ctx.beginPath(); ctx.arc(X(ROCK.x), Y(ROCK.z), ROCK.r * s, 0, TAU); ctx.fill();
      for (const [x, z, rr] of GARDEN_ROCKS) for (let k = 1; k <= 7; k++) { ctx.beginPath(); ctx.arc(X(x), Y(z), (rr + k * 0.13) * s, 0, TAU); ctx.stroke(); }
      const slabs = (x0, z0, x1, z1, w) => {
        const dx = x1 - x0, dz = z1 - z0, len = Math.hypot(dx, dz), n = Math.round(len / 0.7), a = Math.atan2(-dx, dz);
        for (let i = 0; i < n; i++) {
          const t = (i + 0.5) / n;
          ctx.save(); ctx.translate(X(x0 + dx * t), Y(z0 + dz * t)); ctx.rotate(a);
          ctx.fillStyle = i % 2 ? "#8f8a80" : "#87827a"; ctx.fillRect(-w / 2 * s, -0.33 * s, w * s, 0.64 * s);
          ctx.restore();
        }
      };
      slabs(0, L.doorZ, 0, -1.5, 2.0); slabs(0.8, 3.0, POND.x, 3.0, 1.2); slabs(POND.x, -5.2, BELL.x, BELL.z + 1.6, 1.2); slabs(-0.8, 1.2, PAGODA.x + 1.6, PAGODA.z + 1.0, 1.2);
      ctx.fillStyle = "rgba(242,167,192,.85)";
      for (const [cx, cz] of CHERRY) for (let i = 0; i < 140; i++) { ctx.beginPath(); ctx.arc(X(cx + (r() - 0.5) * 4.5), Y(cz + (r() - 0.5) * 4.5), 0.05 * s, 0, TAU); ctx.fill(); }
    });

    // A plain gravel disc a hair under the painted floor, so the slivers its rings leave between them show gravel, not
    // the dark beneath; Canvas 2D draws it before anything else.
    K.node(null, noShadow(disc(0, 0, r0 - 0.01, r0 - 0.01, 48, 0, "#b3ac9d")), 0, -0.004, 0, { depthBias: 50 });

    // The wall below the dome: paper between dark timber posts, two rails round it and a cap of roof tiles along its
    // top. Each post is two lengths following the sphere's lean, and none stands in the doorway's bay.
    const capY = 3.62, posts = Math.round(TAU * ROOMS.radiusAt(L, 1.8) / 1.6), half = Math.PI / posts;
    K.torus(ROOMS.radiusAt(L, capY) - 0.12, 0.13, C.roof, 0, capY, 0, { seg: 144, sides: 6 });
    for (let i = 0; i < posts; i++) {
      const az = ((i + 0.5) / posts * 360 - 180) * DEG;
      if (Math.abs(az) > 166 * DEG) continue;
      const G = K.group(0, 0, 0, -az);
      for (const [y0, y1] of [[0, 1.8], [1.8, capY - 0.08]]) {
        const ra = ROOMS.radiusAt(L, y0) - 0.06, rb = ROOMS.radiusAt(L, y1) - 0.06;
        G.box(0.14, Math.hypot(y1 - y0, rb - ra), 0.08, C.dark, 0, (y0 + y1) / 2, -(ra + rb) / 2, { rx: -Math.atan2(rb - ra, y1 - y0) });
      }
      // The rails, a length from this post to the next.
      if (Math.abs(az + 2 * half) > 166 * DEG) continue;
      const R2 = K.group(0, 0, 0, -az - half);
      for (const y of [0.32, 2.05]) { const rr = ROOMS.radiusAt(L, y) - 0.07; R2.box(2 * rr * Math.sin(half) + 0.02, 0.1, 0.06, C.dark, 0, y, -rr * Math.cos(half)); }
    }

    // The torii over the path: two red pillars on black feet, the tie beam through them, the plaque between it and the
    // red lintel, and the black top beam whose ends sweep up.
    const torZ = L.doorZ - 5.2;
    for (const x of [-1.6, 1.6]) {
      K.cyl(0.15, 0.18, 3.5, C.red, x, 1.97, torZ, { seg: 14 });
      K.cyl(0.24, 0.26, 0.24, C.dark, x, 0.12, torZ, { seg: 14 });
      K.cyl(0.19, 0.19, 0.06, C.dark, x, 0.27, torZ, { seg: 14 });
      K.solid({ x, z: torZ, r: 0.27 });
    }
    K.box(4.0, 0.18, 0.14, C.red, 0, 2.8, torZ);
    K.box(0.14, 0.5, 0.12, C.red, 0, 3.12, torZ);
    K.box(4.5, 0.16, 0.28, C.red, 0, 3.45, torZ);
    K.box(3.9, 0.22, 0.36, C.dark, 0, 3.64, torZ);
    for (const side of [-1, 1]) K.box(0.72, 0.2, 0.36, C.dark, side * 2.2, 3.7, torZ, { rz: side * 0.2 });
    K.picture(0.42, 0.56, 240, 320, (c, w, h) => {
      c.fillStyle = "#151515"; c.fillRect(0, 0, w, h);
      c.strokeStyle = C.gold; c.lineWidth = 10; c.strokeRect(12, 12, w - 24, h - 24);
      c.fillStyle = C.gold; c.textAlign = "center"; c.textBaseline = "middle"; c.font = RM.paintKit.font(700, 190, RM.paintKit.SERIF);
      c.fillText("₿", w / 2, h / 2 + 8);
    }, 0, 3.12, torZ + 0.075, { emissive: 0.55, target: { kind: "torii", tip: "Torii · the gate into the temple's grounds", radius: 0.6 } });

    // The stone lanterns, and the hedges lining the path to the deck.
    const flame = noShadow(BL.models.box({ w: 0.3, h: 0.26, d: 0.3, color: C.lamp, emissive: 0.95 }));
    LANTERN_AT.forEach(([x, z], i) => lantern(K, x, z, i, flame));
    for (let z = 8.2; z > 1.6; z -= 0.75) for (const x of [-1.5, 1.5]) if ([7.2, 4.0].every((lz) => Math.abs(z - lz) > 0.5)) {
      K.add(blob(0.42, 0.34, 0.42, C.hedge, 10), x, 0.3, z, { ry: z });
      K.solid({ x, z, r: 0.4 });
    }

    // The main hall: its platform and three steps (walked up), columns, two roofs whose corners curl up, the paper
    // lamps, the back wall and its scroll, the altar, and bonsai flanking the steps.
    K.box(8.0, 0.7, 5.4, C.plat, 0, 0.35, HALL_Z);
    K.box(8.1, 0.06, 5.5, C.wood, 0, 0.72, HALL_Z);
    K.solid({ x: 0, z: HALL_Z, hx: 4.05, hz: 2.75, top: 0.75 });
    for (let k = 0; k < 3; k++) {
      const h = 0.23 * (k + 1), z = HALL_Z + 2.7 + 0.96 - k * 0.32;
      K.box(3.0, h, 0.32, C.plat, 0, h / 2, z);
      K.solid({ x: 0, z, hx: 1.5, hz: 0.16, top: h });
    }
    for (const x of [-3.6, -1.2, 1.2, 3.6]) for (const z of [HALL_Z + 2.4, HALL_Z, HALL_Z - 2.4]) if (Math.abs(x) > 2 || z === HALL_Z + 2.4) {
      K.box(0.24, 3.2, 0.24, C.pillar, x, 2.3, z);
      K.cyl(0.2, 0.22, 0.12, C.stone, x, 0.81, z, { seg: 8 });
      K.solid({ x, z, r: 0.2 });
    }
    K.box(8.2, 0.3, 0.3, C.pillar, 0, 3.95, HALL_Z + 2.4); K.box(8.2, 0.3, 0.3, C.pillar, 0, 3.95, HALL_Z - 2.4);
    K.box(0.3, 0.3, 5.1, C.pillar, -3.6, 3.95, HALL_Z); K.box(0.3, 0.3, 5.1, C.pillar, 3.6, 3.95, HALL_Z);
    K.box(10.4, 0.08, 7.6, C.wood, 0, 4.12, HALL_Z);
    K.add(frustum(10.6, 7.8, 0.55, 1.3, C.roof), 0, 4.8, HALL_Z);
    K.box(5.0, 0.8, 3.4, C.pillar, 0, 5.85, HALL_Z);
    K.box(5.1, 0.12, 3.5, C.paper, 0, 5.55, HALL_Z);
    K.add(frustum(6.8, 5.0, 0.22, 1.5, C.roof), 0, 7.0, HALL_Z);
    K.box(2.4, 0.22, 0.3, C.roof, 0, 7.8, HALL_Z);
    for (const x of [-1.25, 1.25]) K.cyl(0, 0.14, 0.5, C.gold, x, 8.1, HALL_Z, { seg: 8, emissive: 0.15 });
    // Each roof's corners curl up, a rafter tip at each.
    for (const [w, d, y] of [[10.6, 7.8, 4.18], [6.8, 5.0, 6.28]]) for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      const T = K.group(sx * (w / 2 - 0.15), y, HALL_Z + sz * (d / 2 - 0.15), Math.atan2(sx, sz));
      T.box(0.2, 0.1, 0.8, C.roof, 0, 0.08, 0.2, { rx: -0.45 });
      T.box(0.08, 0.08, 0.08, C.gold, 0, 0.27, 0.56, { emissive: 0.15 });
    }
    // Red paper lamps along its front, each swaying on its string; a tap swings one.
    const paperLamp = (k) => {
      k.cyl(0.22, 0.22, 0.46, C.lampRed, 0, -0.67, 0, { emissive: 0.85 });
      k.cyl(0.16, 0.16, 0.04, C.dark, 0, -0.42, 0, { seg: 12 }); k.cyl(0.16, 0.16, 0.04, C.dark, 0, -0.92, 0, { seg: 12 });
      k.box(0.02, 0.4, 0.02, C.dark, 0, -0.2, 0);
    };
    PAPER.forEach((x, i) => K.node(`paper${i}`, paperLamp, x, 3.97, HALL_Z + 3.2, { target: { kind: "paperlamp", tip: "Paper lantern · tap to set it swinging", radius: 0.72, index: i } }));
    // The back wall, and the scroll hung on it: its ensō, drawn in one breath, and the red seal, mounted in silk on a
    // roller, hung high enough that seen from the deck the circle stands round Satoshi's head.
    K.box(7.6, 3.2, 0.12, C.paper, 0, 2.3, HALL_Z - 2.6);
    K.box(7.8, 0.14, 0.16, C.dark, 0, 3.86, HALL_Z - 2.56);
    K.solid({ x: 0, z: HALL_Z - 2.6, hx: 3.8, hz: 0.1 });
    const SCROLL = { w: 1.2, h: 2.1, top: 3.78 };
    K.picture(SCROLL.w, SCROLL.h, 480, 840, (sc, w, h) => {
      sc.fillStyle = "#f3eee0"; sc.fillRect(0, 0, w, h);
      sc.fillStyle = "#6b4a2a"; sc.fillRect(0, 0, w, 64); sc.fillRect(0, h - 64, w, 64);
      sc.fillStyle = "#8a6a3a"; sc.fillRect(0, 64, 28, h - 128); sc.fillRect(w - 28, 64, 28, h - 128);
      sc.fillStyle = "#a8875a"; sc.fillRect(0, 60, w, 6); sc.fillRect(0, h - 66, w, 6);
      // One stroke round, heavy where the brush came down and thinning to a dry tail, its ends a little apart.
      sc.strokeStyle = "#151515"; sc.lineCap = "round";
      for (let i = 0; i < 96; i++) { const a = -1.15 + i / 96 * 5.75, wd = 42 * (1 - i / 110) + 4; sc.lineWidth = wd; sc.beginPath(); sc.arc(w / 2, 340, 168, a, a + 0.075); sc.stroke(); }
      sc.fillStyle = "#151515";
      for (let i = 0; i < 14; i++) { const a = 4.5 + i * 0.03, r = 168 + (i % 3 - 1) * 9; sc.fillRect(w / 2 + Math.cos(a) * r, 340 + Math.sin(a) * r, 3, 3); }
      sc.fillStyle = "#b8402a"; sc.fillRect(318, 590, 52, 52);
      sc.fillStyle = "#f3eee0"; sc.fillRect(328, 600, 32, 6); sc.fillRect(328, 626, 32, 6); sc.fillRect(341, 600, 6, 32);
    }, 0, SCROLL.top - SCROLL.h / 2, HALL_Z - 2.53, { emissive: 0.45, target: { kind: "scroll", tip: "Ensō", radius: 0.9, data: { say: "An ensō, drawn in one breath: whole, and never quite closed" } } });
    K.cyl(0.03, 0.03, SCROLL.w + 0.14, C.dark, 0, SCROLL.top - SCROLL.h - 0.02, HALL_Z - 2.5, { rz: Math.PI / 2, seg: 8 });
    for (const sx of [-1, 1]) K.cyl(0.045, 0.045, 0.05, C.gold, sx * (SCROLL.w / 2 + 0.09), SCROLL.top - SCROLL.h - 0.02, HALL_Z - 2.5, { rz: Math.PI / 2, seg: 8, emissive: 0.1 });
    K.box(0.6, 0.012, 0.012, C.dark, 0, SCROLL.top + 0.04, HALL_Z - 2.52);
    // The altar: its candles (lit or snuffed with a tap or Space), a bowl of mikan and a small incense bowl.
    K.node("altar", (k) => {
      k.box(2.6, 0.45, 0.7, "#3a2214", 0, 0, 0);
      k.box(2.72, 0.04, 0.8, "#2a170d", 0, 0.245, 0);
      k.box(0.12, 0.45, 0.12, "#2a170d", -1.24, 0, 0.3); k.box(0.12, 0.45, 0.12, "#2a170d", 1.24, 0, 0.3);
      k.cyl(0.14, 0.1, 0.06, C.bronze, -0.15, 0.3, 0.05, { seg: 12 });
      for (const [dx, dz] of [[-0.19, 0.05], [-0.11, 0.08], [-0.15, -0.02]]) k.ball(0.05, "#e8862a", dx, 0.37, dz, { seg: 8, emissive: 0.15 });
      k.cyl(0.08, 0.06, 0.08, "#2a2a2e", 0.18, 0.31, 0.05, { seg: 10 });
    }, 0, 0.975, ALTAR_Z, { target: { kind: "altar", tip: "Altar · tap to light or snuff the candles", radius: 1.3 } });
    K.solid({ x: 0, z: ALTAR_Z, hx: 1.36, hz: 0.4 });
    const candleFlame = noShadow(RM.helpers.cylinder(0, 0.03, 0.08, C.flame, 8, 1));
    CANDLES.forEach((x, i) => {
      K.cyl(0.04, 0.04, 0.22, "#f4efe6", x, 1.31, ALTAR_Z + 0.1, { seg: 8, emissive: 0.5 });
      K.node(`flame${i}`, candleFlame, x, 1.46, ALTAR_Z + 0.1, { glow: true });
    });
    // Bonsai flanking the steps.
    for (const x of [-2.7, 2.7]) {
      const z = HALL_Z + 3.4;
      K.box(0.8, 0.45, 0.45, C.wood, x, 0.225, z); K.box(0.55, 0.16, 0.34, "#2a2a2e", x, 0.53, z);
      K.cyl(0.04, 0.07, 0.5, C.bark, x, 0.85, z, { rz: 0.4, seg: 6 });
      for (const [dx, dy, s] of [[-0.18, 1.07, 0.3], [0.16, 0.97, 0.24], [0.02, 1.2, 0.22]]) K.add(blob(s, s * 0.35, s * 0.8, C.hedge, 10), x + dx, dy, z);
      K.solid({ x, z, r: 0.45 });
    }

    // Satoshi on his Corten plinth, facing the deck, at the heart of the hall, half as large again as life. The
    // plinth's weathered steel is laid in patches of rust and carries his name in bronze; the figure is its own node,
    // sampled panel by panel (the statue above) and scaled up.
    const P = K.group(0, 0.75, STATUE_Z, Math.PI);
    P.node("plinth", plinth(), 0, 0, 0, { target: { kind: "statue", tip: "Satoshi Nakamoto · after Valentina Picozzi's statue in Lugano, made with her permission", radius: 1.5,
      data: { say: "Walk round him: face on, the steel all but vanishes; from the side it closes into one figure" } } });
    P.node("statue", statue(), 0, PLINTH.H, 0.4, { scale: STATUE_SCALE });
    K.solid({ x: 0, z: STATUE_Z, hx: PLINTH.W, hz: PLINTH.D });
    K.picture(0.66, 0.16, 660, 160, (c, w, h) => {
      const g = c.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, "#8a6a3a"); g.addColorStop(1, "#4e3a1c");
      c.fillStyle = g; c.fillRect(0, 0, w, h);
      c.strokeStyle = "#c9a85a"; c.lineWidth = 6; c.strokeRect(6, 6, w - 12, h - 12);
      c.fillStyle = "#f0dca8"; c.textAlign = "center"; c.textBaseline = "middle"; c.font = RM.paintKit.font(600, 66, RM.paintKit.SERIF);
      c.fillText("SATOSHI NAKAMOTO", w / 2, h / 2 + 3);
    }, 0, 0.75 + PLINTH.H - 0.11, STATUE_Z + PLINTH.D + 0.012, { emissive: 0.35 });

    // The tatami deck, its cushions (each a seat facing the hall, and stepped onto), the gong, the singing bowl and
    // the incense burner.
    K.box(7.0, 0.06, 4.4, C.wood, 0, 0.03, DECK_Z);
    K.picture(6.9, 4.3, 512, 320, (tc) => {
      tc.fillStyle = "#cdbf86"; tc.fillRect(0, 0, 512, 320); tc.strokeStyle = "rgba(120,100,50,.35)"; tc.lineWidth = 1;
      for (let x = 0; x < 512; x += 4) { tc.beginPath(); tc.moveTo(x, 0); tc.lineTo(x, 320); tc.stroke(); }
      tc.fillStyle = "#2a1f14"; for (const x of [0, 170, 340]) tc.fillRect(x, 0, 6, 320);
      tc.fillRect(0, 0, 512, 6); tc.fillRect(0, 160, 512, 6); tc.fillRect(0, 314, 512, 6);
    }, 0, 0.062, DECK_Z, { rx: -Math.PI / 2, emissive: 0.12 });
    const zafu = merge(RM.helpers.cylinder(0.27, 0.27, 0.12, C.cushion, 16), BL.models.box({ w: 0.62, h: 0.03, d: 0.62, color: C.mat, offset: { y: -0.075 } }));
    for (const z of [DECK_Z - 1.3, DECK_Z, DECK_Z + 1.3]) for (const x of [-2.4, -1.2, 0, 1.2, 2.4]) {
      const seat = K.seat(x, z, Math.PI, 0.27, 0, 0.65);
      K.node(null, zafu, x, 0.15, z, { target: { kind: "chair", tip: "Meditation cushion", radius: 0.45, index: seat.index } });
      K.solid({ x, z, r: 0.27, top: 0.21 });
    }
    // The gong in its frame on feet, its mallet hung on a cord in front of it (it swings into the gong when struck), and
    // a red tassel.
    const G = K.group(GONG.x, 0, GONG.z);
    for (const sx of [-1, 1]) {
      G.box(0.1, 1.7, 0.1, C.dark, sx * 0.55, 0.85, 0);
      G.box(0.12, 0.08, 0.5, C.dark, sx * 0.55, 0.04, 0);
      G.box(0.3, 0.08, 0.12, C.dark, sx * 0.82, 1.73, 0, { rz: sx * 0.35 });
    }
    G.box(1.5, 0.1, 0.12, C.dark, 0, 1.7, 0);
    G.node("gong", (k) => {
      k.cyl(0.42, 0.42, 0.04, C.gold, 0, -0.6, 0, { rx: Math.PI / 2, seg: 32, emissive: 0.12 });
      k.cyl(0.36, 0.36, 0.05, "#b88a2a", 0, -0.6, 0, { rx: Math.PI / 2, seg: 32, emissive: 0.12 });
      k.cyl(0.08, 0.08, 0.06, C.bronzeDark, 0, -0.6, 0, { rx: Math.PI / 2, seg: 16 });
      for (const x of [-0.18, 0.18]) k.box(0.015, 0.22, 0.015, C.dark, x, -0.09, 0);
    }, 0, 1.55, 0, { target: { kind: "gong", tip: "Gong · tap to strike it", radius: 0.6 } });
    G.node("mallet", (k) => {
      k.box(0.008, 0.6, 0.008, C.rope, 0, -0.3, 0);
      k.ball(0.07, C.rope, 0, -0.66, 0, { seg: 10 });
      k.cyl(0.016, 0.016, 0.3, C.wood, 0.17, -0.66, 0, { rz: Math.PI / 2, seg: 6 });
    }, 0, 1.62, 0.25);
    G.cyl(0.03, 0.05, 0.26, C.red, -0.6, 1.42, 0.07, { seg: 8 });
    G.solid({ x: 0, z: 0, hx: 0.68, hz: 0.25 });
    // The singing bowl on its red cushion, its wooden striker beside it.
    K.torus(0.17, 0.05, C.red, BOWL.x, 0.11, BOWL.z, { seg: 16, sides: 6 });
    K.node("bowl", (k) => k.lathe([[0, 0], [0.18, 0.01], [0.24, 0.08], [0.26, 0.16], [0.24, 0.18]], C.gold, 0, 0, 0, { seg: 20, emissive: 0.1 }), BOWL.x, 0.13, BOWL.z,
      { target: { kind: "bowl", tip: "Singing bowl · tap to ring it", radius: 0.4 } });
    K.cyl(0.018, 0.018, 0.3, C.wood, BOWL.x + 0.38, 0.08, BOWL.z + 0.1, { rz: Math.PI / 2, seg: 6 });
    K.solid({ x: BOWL.x, z: BOWL.z, r: 0.3 });
    // The incense burner on its stone, three sticks smoking in it; a tap or Space wafts the smoke.
    K.box(0.9, 0.3, 0.9, C.stone, BURNER.x, 0.15, BURNER.z);
    K.node("burner", (k) => {
      k.lathe([[0, 0], [0.4, 0.02], [0.48, 0.25], [0.46, 0.55], [0.52, 0.6]], "#6e5530", 0, 0, 0, { seg: 24 });
      k.cyl(0.45, 0.45, 0.02, "#4a4540", 0, 0.53, 0, { seg: 24 });
      for (const a of [0, 2.09, 4.19]) k.box(0.07, 0.1, 0.07, C.bronzeDark, Math.sin(a) * 0.36, -0.03, Math.cos(a) * 0.36);
    }, BURNER.x, 0.3, BURNER.z, { target: { kind: "incense", tip: "Incense burner · tap to waft the smoke", radius: 0.7 } });
    K.solid({ x: BURNER.x, z: BURNER.z, r: 0.55 });
    [[-0.06, 0.02, 0.1], [0.05, -0.04, -0.08], [0.01, 0.07, 0.04]].forEach(([dx, dz, lean], i) => {
      K.box(0.012, 0.32, 0.012, "#6a3a22", BURNER.x + dx, 0.99, BURNER.z + dz, { rz: lean });
      K.node(`tip${i}`, (k) => k.box(0.02, 0.025, 0.02, "#ff6a2a", 0, 0, 0, { emissive: 1 }), BURNER.x + dx - Math.sin(lean) * 0.16, 1.15, BURNER.z + dz, { glow: true });
    });
    const puff = noShadow(blob(0.03, 0.03, 0.03, "#e4e0da", 6, 0.5));
    for (let i = 0; i < SMOKE; i++) K.node(`smoke${i}`, puff, BURNER.x, 1.2, BURNER.z, { glow: true });

    // The pagoda in its bamboo grove: five tiers with paper doors on every side, roofs whose corners curl up, a wind
    // bell hung from each corner (they sway in the breeze and ring when it gusts, or with a tap or Space), and the
    // spire.
    const PG = K.group(PAGODA.x, 0, PAGODA.z);
    PG.node("pagoda", (k) => k.box(3.0, 0.4, 3.0, C.stone, 0, 0, 0), 0, 0.2, 0, { target: { kind: "chimes", tip: "Pagoda · tap to ring its wind bells", radius: 1.9 } });
    let y = 0.4;
    for (let k = 0; k < TIERS; k++) {
      const s = 2.0 - 0.28 * k, h = 0.9 - 0.06 * k, eave = (s + 1.1) / 2;
      PG.box(s, h, s, C.pillar, 0, y + h / 2, 0);
      for (const [sx, sz, ry] of [[0, 1, 0], [0, -1, Math.PI], [1, 0, Math.PI / 2], [-1, 0, -Math.PI / 2]]) PG.box(s * 0.6, h * 0.5, 0.02, C.paper, sx * (s / 2 + 0.01), y + h / 2, sz * (s / 2 + 0.01), { ry });
      y += h;
      PG.add(frustum(s + 1.1, s + 1.1, 0.42, 0.45, C.roof), 0, y + 0.22, 0);
      [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz], c) => {
        const T = PG.group(sx * (eave - 0.08), y, sz * (eave - 0.08), Math.atan2(sx, sz));
        T.box(0.14, 0.08, 0.5, C.roof, 0, 0.06, 0.14, { rx: -0.5 });
        PG.node(`wind${k * 4 + c}`, (n) => {
          n.box(0.004, 0.1, 0.004, C.dark, 0, -0.05, 0);
          n.cyl(0.02, 0.055, 0.1, C.bronze, 0, -0.14, 0, { seg: 8, emissive: 0.1 });
          n.box(0.035, 0.07, 0.003, C.paper, 0, -0.25, 0);
        }, sx * (eave - 0.12), y - 0.01, sz * (eave - 0.12));
      });
      y += 0.45;
    }
    PG.cyl(0.06, 0.06, 1.6, C.gold, 0, y + 0.8, 0, { seg: 8, emissive: 0.15 });
    for (let k = 0; k < 6; k++) PG.torus(0.16 - k * 0.012, 0.03, C.gold, 0, y + 0.3 + k * 0.2, 0, { seg: 16, sides: 5, emissive: 0.15 });
    PG.solid({ x: 0, z: 0, hx: 1.5, hz: 1.5 });
    // The bamboo, in clumps that each sway on their own; a tap sets one rustling.
    const br = RM.paintKit.rng(29), clumps = Array.from({ length: CLUMPS }, () => []);
    for (let i = 0; i < 90; i++) {
      const b = 212 + br() * 110, rr = r0 - 0.9 - br() * 1.6, x = rr * Math.sin(b * DEG), z = rr * Math.cos(b * DEG), h = 4 + br() * 3, leaves = [];
      for (let k = 0; k < 2; k++) leaves.push([x + (br() - 0.5) * 0.6, h * (0.7 + br() * 0.3), z + (br() - 0.5) * 0.6, 0.5 + br() * 0.5, 2 * i + k]);
      clumps[Math.min(CLUMPS - 1, Math.floor((b - 212) / 110 * CLUMPS))].push({ x, z, h, leaves, rx: (br() - 0.5) * 0.08, rz: (br() - 0.5) * 0.08 });
    }
    clumps.forEach((list, c) => {
      const cx = list.reduce((s, o) => s + o.x, 0) / list.length, cz = list.reduce((s, o) => s + o.z, 0) / list.length;
      K.node(`bamboo${c}`, (k) => {
        for (const o of list) {
          k.cyl(0.045, 0.055, o.h, "#6f9a3e", o.x - cx, o.h / 2, o.z - cz, { seg: 6, rx: o.rx, rz: o.rz });
          for (const [lx, ly, lz, s, ry] of o.leaves) k.add(blob(s, s * 0.35, s * 0.7, "#4f7d32", 6), lx - cx, ly, lz - cz, { ry });
        }
      }, cx, 0, cz, { target: { kind: "bamboo", tip: "Bamboo · tap to set it rustling", radius: 2.2, index: c } });
    });

    // Cherry and maple trees, their crowns swaying, their petals falling.
    TREES.forEach((t, i) => tree(K, t.x, t.z, i < 2 ? ["#f2a7c0", "#e98fb0", "#f7c2d4"] : ["#c0392b", "#d9542c", "#a8281e"], i < 2 ? 20 : 16, i < 2 ? Math.round(t.x * 10) : 9,
      `crown${i}`, i, `${t.name} tree · tap to shake it`));
    const petal = blank(), petalPts = [[-0.035, 0, 0], [0, 0, -0.025], [0.035, 0, 0], [0, 0, 0.025]];
    face(petal, petalPts, "#f7b8cc", 0.5, UP); face(petal, petalPts, "#f7b8cc", 0.5, DOWN);
    for (let i = 0; i < PETALS; i++) K.node(`petal${i}`, noShadow(petal), CHERRY[i % 2][0], 2, CHERRY[i % 2][1], { glow: true });

    // The raked rock garden: a stone curb, three mossy rocks in their rings, and the rake leaning on the curb.
    K.torus(ROCK.r, 0.06, "#7a756c", ROCK.x, 0.05, ROCK.z, { seg: 64, sides: 4 });
    for (const [x, z, rr] of GARDEN_ROCKS) {
      K.add(ico("#55534f", rr, rr * 0.8, rr * 1.1, false, x * 3), x, rr * 0.45, z);
      K.add(blob(rr * 0.62, rr * 0.16, rr * 0.7, C.moss, 8), x - rr * 0.1, rr * 1.05, z + rr * 0.05);
      K.solid({ x, z, r: rr });
    }
    K.node("rake", (k) => {
      k.cyl(0.02, 0.02, 1.6, "#a88a52", 0, 0.8, 0, { seg: 6 });
      k.box(0.5, 0.05, 0.05, "#a88a52", 0, 0.02, 0);
      for (let t = -2; t <= 2; t++) k.box(0.015, 0.1, 0.015, "#a88a52", t * 0.1, -0.04, 0);
    }, ROCK.x + ROCK.r * 0.68, 0.08, ROCK.z + ROCK.r * 0.74, { rx: 0.35, ry: 0.6, target: { kind: "garden", tip: "Rock garden", radius: 0.9,
      data: { say: "Karesansui: the gravel is raked to be water, the rocks to be islands" } } });

    // The koi pond: water (a tap feeds the koi), a rim of stones, lotus, the koi, rings spreading where they feed, an
    // arched bridge and a waterfall.
    K.node("water", noShadow(disc(0, 0, POND.rx, POND.rz, 40, 0, "#2a6b7a", 0.55)), POND.x, 0.03, POND.z, { target: { kind: "pond", tip: "Koi pond · tap to feed the koi", radius: 3.0 } });
    for (let i = 0; i < 40; i++) {
      const a = i / 40 * TAU;
      K.add(ico("#6a6862", 0.26, 0.26, 0.26, false, a), POND.x + Math.sin(a) * (POND.rx + 0.1), 0.1, POND.z + Math.cos(a) * (POND.rz + 0.1));
    }
    for (const [dx, dz, rr] of [[-1.6, 1.2, 0.3], [-2.2, -0.6, 0.26], [1.8, 1.4, 0.32], [-0.9, -2.2, 0.24], [2.0, -1.5, 0.28]]) {
      K.cyl(rr, rr, 0.01, "#3f7a3a", POND.x + dx, 0.04, POND.z + dz, { seg: 12 });
      K.cyl(0.1, 0, 0.14, "#f2a7c0", POND.x + dx + 0.08, 0.1, POND.z + dz, { seg: 6, emissive: 0.2 });
    }
    const koiGeo = KOI_COLORS.map((color, n) => {
      const tail = blank();
      face(tail, [[-0.17, 0.02, 0], [-0.3, 0.02, 0.08], [-0.3, 0.02, -0.08]], color, 0.45, UP);
      const spot = n === 1 ? [BL.models.box({ w: 0.12, h: 0.012, d: 0.08, color: "#e8501b", emissive: 0.45, offset: { x: 0.06, y: 0.03 } })] : [];
      return noShadow(merge(BL.models.box({ w: 0.36, h: 0.05, d: 0.12, color, emissive: 0.45 }), ...spot, tail));
    });
    KOI.forEach((k, i) => K.node(`koi${i}`, koiGeo[i % KOI_COLORS.length], POND.x, 0.045, POND.z));
    const ring = noShadow(BL.models.torus(1, 0.018, "#d8f0f6", 0.7, 32, 4));
    for (let i = 0; i < RIPPLES; i++) K.node(`ripple${i}`, ring, POND.x, -5, POND.z, { glow: true });
    // The pond keeps walkers out but for the bridge: three stones' worth of solid each side of its middle.
    for (const side of [-1, 1]) for (const [u, v, r] of [[2.3, 0, 1.45], [1.75, 1.9, 1.0], [1.75, -1.9, 1.0]]) K.solid({ x: POND.x + side * u, z: POND.z + v, r });
    // The arched bridge: planks along the arch with red rails and posts, walked over as a run of low steps.
    const SEG = 26, deck = [];
    for (let i = 0; i < SEG; i++) {
      const t0 = i / SEG, t1 = (i + 1) / SEG, ya = archY(t0), yb = archY(t1), za = BRIDGE.z0 + (BRIDGE.z1 - BRIDGE.z0) * t0, zb = BRIDGE.z0 + (BRIDGE.z1 - BRIDGE.z0) * t1;
      deck.push({ y: (ya + yb) / 2, z: (za + zb) / 2, ang: Math.atan2(yb - ya, za - zb), len: Math.hypot(yb - ya, zb - za) });
    }
    for (const d of deck) {
      K.box(1.5, 0.1, d.len + 0.02, C.wood, POND.x, d.y, d.z, { rx: d.ang });
      for (const sx of [-0.72, 0.72]) K.box(0.07, 0.07, d.len + 0.02, C.red, POND.x + sx, d.y + 0.72, d.z, { rx: d.ang });
    }
    deck.forEach((d, i) => { if (i % 4 === 0 || i === deck.length - 1) for (const sx of [-0.72, 0.72]) K.box(0.1, 0.75, 0.1, C.red, POND.x + sx, d.y + 0.36, d.z); });
    for (let i = 0; i < BRIDGE.walk; i++) {
      let top = 0;
      for (let n = 0; n <= 4; n++) top += archY((i + n / 4) / BRIDGE.walk) / 5;
      const z = BRIDGE.z0 + (BRIDGE.z1 - BRIDGE.z0) * (i + 0.5) / BRIDGE.walk;
      K.solid({ x: POND.x, z, hx: 0.72, hz: Math.abs(BRIDGE.z1 - BRIDGE.z0) / BRIDGE.walk / 2, top: top + 0.05 });
    }
    // The waterfall off the rocks at the pond's far side, its streaks running down it.
    const wfX = POND.x + POND.rx + 0.4;
    for (const [dx, dy, dz, s] of [[0.2, 0.5, -0.9, 0.7], [0.3, 0.5, 0.9, 0.65], [0.4, 1.3, -0.6, 0.55], [0.4, 1.3, 0.6, 0.55], [0.5, 2.0, 0, 0.6]]) K.add(ico("#5a5853", s, s * 0.8, s, false, dx * 7), wfX + dx, dy, POND.z + dz);
    K.solid({ x: wfX + 0.35, z: POND.z, r: 0.95 });
    K.box(0.04, 2.0, 1.0, "#78bed7", wfX - 0.05, 1.0, POND.z, { emissive: 0.6, glow: true });
    K.add(blob(0.7, 0.12, 0.8, "#eef8fb", 12, 0.7), wfX - 0.4, 0.05, POND.z, { glow: true });
    const drop = noShadow(BL.models.box({ w: 0.02, h: 0.34, d: 0.035, color: "#eef8fb", emissive: 0.9 }));
    for (let i = 0; i < STREAKS; i++) K.node(`fall${i}`, drop, wfX - 0.08, 1.0, POND.z - 0.42 + i * 0.12, { glow: true });

    // The bell tower on its stone base (a step up onto it from the front), its bell and the log that strikes it. The
    // bell is cast with bands round it, rows of bosses on its shoulder, the loop it hangs by and the lotus boss where
    // the log lands.
    const bh = headingTo(BELL.x, BELL.z, 0, 0), BT = K.group(BELL.x, 0, BELL.z, bh);
    BT.box(3.2, 0.5, 3.2, C.stone, 0, 0.25, 0);
    BT.box(1.4, 0.25, 0.5, C.stone, 0, 0.125, -1.85);
    BT.solid({ x: 0, z: -1.85, hx: 0.7, hz: 0.25, top: 0.25 });
    for (const [px, pz] of [[-1.2, -1.2], [1.2, -1.2], [-1.2, 1.2], [1.2, 1.2]]) {
      BT.box(0.22, 3.1, 0.22, C.pillar, px, 2.05, pz);
      BT.cyl(0.17, 0.19, 0.1, C.stone, px, 0.55, pz, { seg: 8 });
      BT.solid({ x: px, z: pz, r: 0.16 });
    }
    BT.box(2.7, 0.2, 0.2, C.pillar, 0, 3.5, 0);
    BT.add(frustum(4.2, 4.2, 0.22, 1.3, C.roof), 0, 4.2, 0);
    BT.box(1.2, 0.2, 0.3, C.roof, 0, 4.9, 0);
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      const T = BT.group(sx * 1.95, 3.58, sz * 1.95, Math.atan2(sx, sz));
      T.box(0.16, 0.09, 0.62, C.roof, 0, 0.07, 0.16, { rx: -0.45 });
    }
    // The bell's radius at height `y` on it (y 0 its crown, -1.35 its lip), from its profile.
    const BELL_PROFILE = [[0, 0], [0.62, 0], [0.6, 0.1], [0.53, 0.48], [0.46, 0.95], [0.41, 1.2], [0.27, 1.32], [0, 1.35]];
    const bellR = (y) => {
      const h = y + 1.35;
      for (let i = 1; i < BELL_PROFILE.length; i++) if (h <= BELL_PROFILE[i][1]) { const [r0b, h0] = BELL_PROFILE[i - 1], [r1, h1] = BELL_PROFILE[i]; return r0b + (r1 - r0b) * (h - h0) / (h1 - h0); }
      return 0;
    };
    BT.node("bell", (k) => {
      k.lathe(BELL_PROFILE, C.bronze, 0, -1.35, 0, { seg: 28, emissive: 0.1 });
      for (const yb of [-0.24, -0.6, -1.18]) k.torus(bellR(yb) + 0.012, 0.022, C.bronzeDark, 0, yb, 0, { seg: 28, sides: 4 });
      for (let p = 0; p < 4; p++) for (let row = 0; row < 3; row++) for (let col = 0; col < 3; col++) {
        const a = (p + 0.5) / 4 * TAU + (col - 1) * 0.16, yb = -0.3 - row * 0.085, r = bellR(yb) + 0.012;
        k.ball(0.022, C.bronzeDark, Math.sin(a) * r, yb, Math.cos(a) * r, { seg: 6 });
      }
      k.torus(0.1, 0.03, C.bronzeDark, 0, 0.06, 0, { rx: Math.PI / 2, seg: 12, sides: 4 });
      k.ball(0.07, C.bronzeDark, bellR(-0.95) + 0.02, -0.95, 0, { seg: 8 });
      k.box(0.08, 0.06, 0.08, C.dark, 0, 0.03, 0);
    }, 0, 3.4, 0, { target: { kind: "bell", tip: "Temple bell · it rings once a block; tap to ring it", radius: 0.8 } });
    BT.node("striker", (k) => {
      k.cyl(0.11, 0.11, 1.4, "#8a6a45", 0, -0.9, 0, { rz: Math.PI / 2, seg: 12 });
      for (const x of [-0.35, 0.35]) k.box(0.02, 0.9, 0.02, C.dark, x, -0.45, 0);
    }, 1.45, 3.5, 0);
    BT.solid({ x: 0, z: 0, hx: 1.6, hz: 1.6, top: 0.5 });
    BT.solid({ x: 0, z: 0, r: 0.66, below: 2.05 });

    // Point lights, the fixed ones first: the hall and its statue, the dusk over the front, then lanterns.
    K.light(0, 2.6, -9.2, 10, 0.7, 0.53, 0.34);
    K.light(0, 3.1, STATUE_Z + 2.4, 5, 0.55, 0.55, 0.55);
    K.light(0, L.c + L.R * 0.45, -L.R * 0.35, 30, 0.8, 0.52, 0.26);
    K.light(0, 6, -8, 22, 0.6, 0.42, 0.3);
    K.light(L.R * 0.3, L.c + L.R * 0.3, L.R * 0.4, 26, 0.75, 0.7, 0.62);
    K.light(0, 3.3, HALL_Z + 3.4, 5, 0.9, 0.35, 0.2);
    K.light(0, 1.4, 5.6, 5, 0.95, 0.7, 0.35);
    K.light(POND.x, 1.6, POND.z + 1.2, 7, 0.55, 0.75, 0.8);
    K.light(BELL.x - 1.2, 2.4, BELL.z + 1.6, 6, 0.9, 0.65, 0.35);
    K.light(PAGODA.x + 1.6, 1.6, PAGODA.z + 1.8, 6, 0.9, 0.65, 0.35);
    K.light(GONG.x - 0.6, 1.8, GONG.z + 1.2, 4, 0.9, 0.7, 0.4);
  };

  // Space where the Ooga stands and looks (the interior's `near`): the nearest thing within its reach (from its middle,
  // so the widest Ooga reaches it) and, unless it is right there, in front of the view. Kept in these, so asking
  // allocates nothing.
  const pick = { act: null, d: 0, x: 0, z: 0, fx: 0, fz: 0, f: 1 };
  const consider = (act, ax, az, reach, facing = true) => {
    const dx = ax - pick.x, dz = az - pick.z, d = Math.hypot(dx, dz);
    if (d < reach && d < pick.d && (!facing || d < 0.9 || (dx * pick.fx + dz * pick.fz) / (d * pick.f) > 0.2)) { pick.act = act; pick.d = d; }
  };

  // What moves: the koi, the petals, the incense smoke, the lanterns, the candles, the paper lamps, the waterfall, the
  // trees, the bamboo and the wind bells in a slow breeze, and whatever the visitor sets going with a tap or Space: the
  // bell, the gong and the bowl, each heard as it is struck; the wind bells; the koi come to be fed; a tree shaken; a
  // lantern or the candles put out or lit. Every visit starts the bell's count afresh, so it rings for the blocks
  // found while here.
  const animate = (nodes, built) => {
    const named = (prefix, n) => Array.from({ length: n }, (_, i) => nodes[`${prefix}${i}`]);
    const koi = named("koi", KOI.length), petals = named("petal", PETALS), smoke = named("smoke", SMOKE), streaks = named("fall", STREAKS);
    const lamps = named("lamp", LANTERN_AT.length), paper = named("paper", PAPER.length), tips = named("tip", 3), flames = named("flame", CANDLES.length);
    const crowns = named("crown", TREES.length), bamboo = named("bamboo", CLUMPS), winds = named("wind", TIERS * 4), ripples = named("ripple", RIPPLES);
    const bell = nodes.bell, striker = nodes.striker, gong = nodes.gong, mallet = nodes.mallet, bowl = nodes.bowl;
    const rest = { gong: gong.rotation.x, bell: bell.rotation.z, striker: striker.rotation.z, mallet: mallet.rotation.x };
    const ear = built.ear, audio = sounds(), wake = () => { audio.wake(); };
    document.addEventListener("pointerdown", wake);
    document.addEventListener("keydown", wake);
    // The petals' own drift: where each falls round, how high it is, how fast it falls and its phase.
    const pr = RM.paintKit.rng(44), fall = new Float32Array(PETALS * 5);
    for (let i = 0; i < PETALS; i++) { const [cx, cz] = CHERRY[i % 2]; fall.set([cx + (pr() - 0.5) * 3.2, cz + (pr() - 0.5) * 3.0, pr() * 4.2, 0.25 + pr() * 0.3, pr() * TAU], i * 5); }
    chime.height = null;
    let heard = chime.count;
    // What the visitor has set going: which lanterns burn and whether the candles do, a swing on each paper lamp and a
    // shake on each tree, the bamboo's rustle, the wind bells' swing, the koi's feeding (where, and how long left), a
    // fresh waft of smoke and the smoke's own clock, the bowl's shimmer, when the breeze next gusts, and the ripples
    // ([x, z, age] each, age -1 when still).
    const lit = new Uint8Array(LANTERN_AT.length).fill(1), swing = new Float32Array(PAPER.length), shake = new Float32Array(TREES.length);
    const rippleAt = new Float32Array(RIPPLES * 3);
    for (let i = 0; i < RIPPLES; i++) rippleAt[i * 3 + 2] = -1;
    const doing = { candles: true, rustle: 0, winds: 0, feed: 0, feedX: 0, feedZ: 0, waft: 0, smokeT: 0, bowl: -1, breeze: 20, ripple: 0 };
    // A strike: how long since it began, -1 when still, and whether its blow has landed. The bell's log is drawn back,
    // let swing into the bell and rebounds; the gong's mallet does the same on its cord; then each hums.
    const state = { bell: -1, gong: -1, bellRang: false, gongRang: false };
    const STRIKE = { back: 0.8, swing: 0.2, pull: 0.5, hit: -0.25 }, MALLET = { back: 0.5, swing: 0.16, pull: -0.5, hit: 0.24 };
    const ringBell = () => { if (state.bell < 0 || state.bell > STRIKE.back + STRIKE.swing + 0.6) { state.bell = 0; state.bellRang = false; } };
    const strikeGong = () => { if (state.gong < 0 || state.gong > MALLET.back + MALLET.swing + 0.4) { state.gong = 0; state.gongRang = false; } };
    const ringBowl = () => { doing.bowl = 0; audio.strike("bowl", 1, ear, BOWL); };
    const ringWinds = (strength) => { doing.winds = Math.max(doing.winds, strength); audio.ring(strength, ear, PAGODA); };
    const ripple = (x, z) => { const i = doing.ripple; doing.ripple = (i + 1) % RIPPLES; rippleAt[i * 3] = x; rippleAt[i * 3 + 1] = z; rippleAt[i * 3 + 2] = 0; };
    // The koi come to the pond's edge nearest the visitor, a little way in.
    const feed = () => {
      let ux = (ear.x - POND.x) / POND.rx, uz = (ear.z - POND.z) / POND.rz;
      const n = Math.hypot(ux, uz) || 1;
      ux /= n; uz /= n;
      doing.feedX = POND.x + ux * POND.rx * 0.62; doing.feedZ = POND.z + uz * POND.rz * 0.62; doing.feed = 9;
      ripple(doing.feedX, doing.feedZ);
    };
    // A shaken cherry sends its petals down at once.
    const shakeTree = (i) => {
      shake[i] = 1;
      if (i < 2) for (let p = i; p < PETALS; p += 2) fall[p * 5 + 2] = 2.8 + ((p * 0.37) % 1) * 1.4;
    };
    const toggleLantern = (i) => { lit[i] ^= 1; };
    const toggleCandles = () => { doing.candles = !doing.candles; for (const f of flames) f.visible = doing.candles; };
    const waft = () => { doing.waft = 1; };
    // Space's actions, made once; the lantern nearest is kept in `lantern`, the tree nearest in `tree`.
    let lantern = 0, tree = 0;
    const ACT = {
      bell: { key: "bell", label: "RING", hint: "Space · Ring the bell", tap: "Tap RING to ring the bell", run: () => ringBell() },
      gong: { key: "gong", label: "STRIKE", hint: "Space · Strike the gong", tap: "Tap STRIKE to strike the gong", run: () => strikeGong() },
      bowl: { key: "bowl", label: "RING", hint: "Space · Ring the singing bowl", tap: "Tap RING to ring the bowl", run: () => ringBowl() },
      winds: { key: "winds", label: "RING", hint: "Space · Ring the wind bells", tap: "Tap RING to ring the wind bells", run: () => ringWinds(1) },
      feed: { key: "feed", label: "FEED", hint: "Space · Feed the koi", tap: "Tap FEED to feed the koi", run: (hud) => { feed(); hud.toast("The koi come up to be fed"); } },
      shake: { key: "shake", label: "SHAKE", hint: "Space · Shake the tree", tap: "Tap SHAKE to shake the tree", run: () => shakeTree(tree) },
      douse: { key: "douse", label: "DOUSE", hint: "Space · Put the lantern out", tap: "Tap DOUSE to put the lantern out", run: () => toggleLantern(lantern) },
      light: { key: "light", label: "LIGHT", hint: "Space · Light the lantern", tap: "Tap LIGHT to light the lantern", run: () => toggleLantern(lantern) },
      snuff: { key: "snuff", label: "SNUFF", hint: "Space · Snuff the candles", tap: "Tap SNUFF to snuff the candles", run: () => toggleCandles() },
      candles: { key: "candles", label: "LIGHT", hint: "Space · Light the candles", tap: "Tap LIGHT to light the candles", run: () => toggleCandles() },
      waft: { key: "waft", label: "WAFT", hint: "Space · Waft the incense", tap: "Tap WAFT to waft the incense", run: () => waft() }
    };
    return {
      update(dt, t) {
        if (chime.count !== heard) { heard = chime.count; ringBell(); }
        // The breeze: how hard it blows now, and now and then a gust through the wind bells.
        const breeze = 0.5 + 0.5 * Math.sin(t * 0.23) * Math.sin(t * 0.37 + 1);
        if ((doing.breeze -= dt) <= 0) { doing.breeze = 25 + Math.random() * 25; ringWinds(0.3 + 0.3 * breeze); }
        // The koi round the pond, or come to where they are fed and nosing about it.
        const fw = smooth(0, 1.5, doing.feed);
        doing.feed = Math.max(0, doing.feed - dt);
        for (let i = 0; i < koi.length; i++) {
          const k = KOI[i], a = k.a + t * k.w, n = koi[i];
          const ox = POND.x + Math.cos(a) * k.r * 0.95, oz = POND.z + Math.sin(a) * k.r * 0.8;
          const tx = doing.feedX + Math.cos(t * 1.7 + i * 2.1) * 0.4, tz = doing.feedZ + Math.sin(t * 1.9 + i * 1.3) * 0.32;
          n.position.x = ox + (tx - ox) * fw; n.position.z = oz + (tz - oz) * fw;
          n.rotation.y = fw > 0.5 ? Math.atan2(-(doing.feedZ - n.position.z), doing.feedX - n.position.x) + Math.sin(t * 9 + i) * 0.2
            : -a - (k.w > 0 ? Math.PI / 2 : -Math.PI / 2) + Math.sin(t * 6 + i) * 0.12;
        }
        for (let i = 0; i < ripples.length; i++) {
          const o = i * 3, n = ripples[i];
          if (rippleAt[o + 2] < 0) continue;
          const age = rippleAt[o + 2] += dt;
          if (age > 2.4) { rippleAt[o + 2] = -1; n.position.y = -5; continue; }
          n.position.x = rippleAt[o]; n.position.y = 0.05; n.position.z = rippleAt[o + 1];
          n.scale.x = n.scale.y = n.scale.z = 0.1 + age * 0.5;
          n.glow = 1 - age / 2.4;
          // A feeding keeps the water ringing.
          if (doing.feed > 0 && age > 0.8 && age - dt <= 0.8) ripple(doing.feedX + Math.sin(t * 3) * 0.3, doing.feedZ + Math.cos(t * 2) * 0.25);
        }
        for (let i = 0; i < petals.length; i++) {
          const o = i * 5, n = petals[i];
          fall[o + 2] -= fall[o + 3] * dt;
          if (fall[o + 2] < 0.05) fall[o + 2] = 3.6 + ((i * 0.37 + t * 0.13) % 1) * 0.8;
          n.position.x = fall[o] + Math.sin(t * 1.3 + fall[o + 4]) * 0.4; n.position.y = fall[o + 2]; n.position.z = fall[o + 1] + Math.cos(t + fall[o + 4]) * 0.3;
          n.rotation.x = t * 2 + fall[o + 4]; n.rotation.y = t + fall[o + 4];
        }
        // The smoke rises on its own clock, faster and fuller for a while after a waft.
        doing.smokeT += dt * (1 + 2 * doing.waft);
        for (let i = 0; i < smoke.length; i++) {
          const s = i / smoke.length, k = (s + doing.smokeT * 0.1) % 1, n = smoke[i], size = (0.6 + k * 1.4) * (1 - k) * (1 + doing.waft);
          n.position.x = BURNER.x + Math.sin(k * 9 + s * 5) * 0.18 * k; n.position.y = 1.18 + k * 1.5; n.position.z = BURNER.z + Math.cos(k * 7) * 0.14 * k;
          n.scale.x = n.scale.y = n.scale.z = size;
        }
        doing.waft = Math.max(0, doing.waft - dt / 4);
        for (let i = 0; i < tips.length; i++) tips[i].glow = 0.75 + 0.25 * Math.sin(t * 2.3 + i * 2.1);
        for (let i = 0; i < lamps.length; i++) lamps[i].glow = lit[i] ? 0.88 + 0.07 * Math.sin(t * 7.3 + i * 1.7) + 0.05 * Math.sin(t * 13.1 + i * 2.9) : 0.08;
        for (let i = 0; i < flames.length; i++) { flames[i].scale.y = 1 + 0.18 * Math.sin(t * 17 + i * 3.1) + 0.1 * Math.sin(t * 29 + i); flames[i].glow = 0.85 + 0.15 * Math.sin(t * 23 + i * 1.7); }
        for (let i = 0; i < paper.length; i++) {
          const kick = swing[i] *= Math.exp(-dt * 0.6);
          paper[i].rotation.z = (0.035 + 0.3 * kick) * Math.sin(t * (kick > 0.02 ? 2.6 : 0.8) + i * 1.3); paper[i].rotation.x = 0.025 * Math.sin(t * 0.6 + i * 2.1);
        }
        for (let i = 0; i < streaks.length; i++) streaks[i].position.y = 1.85 - ((t * 1.6 + i * 0.37) % 1) * 1.7;
        // The trees' crowns in the breeze, shaken hard when struck; the bamboo; the wind bells.
        for (let i = 0; i < crowns.length; i++) {
          const k = shake[i] *= Math.exp(-dt * 1.6), n = crowns[i];
          n.rotation.z = 0.025 * breeze * Math.sin(t * 0.9 + i * 2) + 0.09 * k * Math.sin(t * 15 + i);
          n.rotation.x = 0.02 * breeze * Math.sin(t * 0.7 + i * 1.3) + 0.07 * k * Math.sin(t * 13 + i * 2);
        }
        const rustle = doing.rustle *= Math.exp(-dt * 0.8);
        for (let i = 0; i < bamboo.length; i++) {
          const n = bamboo[i], amp = 0.012 + 0.012 * breeze + 0.05 * rustle;
          n.rotation.z = amp * Math.sin(t * (1.1 + i * 0.13) + i); n.rotation.x = amp * 0.7 * Math.sin(t * (0.9 + i * 0.11) + i * 2);
        }
        const winds2 = doing.winds *= Math.exp(-dt * 0.7);
        for (let i = 0; i < winds.length; i++) {
          const n = winds[i], amp = 0.06 * breeze + 0.5 * winds2;
          n.rotation.x = amp * Math.sin(t * (3 + (i % 3)) + i); n.rotation.z = amp * 0.8 * Math.sin(t * (2.6 + (i % 4) * 0.4) + i * 1.7);
        }
        // The bell: its log drawn back, let swing and landing (heard then), the bell rocking and glowing as it hums.
        if (state.bell >= 0) {
          const s = state.bell += dt, hit = STRIKE.back + STRIKE.swing;
          let a;
          if (s < STRIKE.back) { const u = s / STRIKE.back; a = STRIKE.pull * u * u * (3 - 2 * u); }
          else if (s < hit) { const u = (s - STRIKE.back) / STRIKE.swing; a = STRIKE.pull + (STRIKE.hit - STRIKE.pull) * u * u; }
          else a = STRIKE.hit * Math.exp(-(s - hit) * 2.2) * Math.cos((s - hit) * 5);
          if (!state.bellRang && s >= hit) { state.bellRang = true; audio.strike("bell", 1, ear, BELL); }
          striker.rotation.z = rest.striker + a;
          const hum = s > hit ? Math.exp(-(s - hit) / 2.5) : 0;
          bell.rotation.z = rest.bell - 0.05 * hum * Math.sin((s - hit) * 4.4);
          bell.glow = 1 + 4 * hum;
          if (s > hit + 9) { state.bell = -1; striker.rotation.z = rest.striker; bell.rotation.z = rest.bell; bell.glow = 1; }
        }
        // The gong: its mallet drawn back on its cord, let swing into it (heard then), and the gong swaying as it hums.
        if (state.gong >= 0) {
          const s = state.gong += dt, hit = MALLET.back + MALLET.swing;
          let a;
          if (s < MALLET.back) { const u = s / MALLET.back; a = MALLET.pull * u * u * (3 - 2 * u); }
          else if (s < hit) { const u = (s - MALLET.back) / MALLET.swing; a = MALLET.pull + (MALLET.hit - MALLET.pull) * u * u; }
          else a = MALLET.hit * Math.exp(-(s - hit) * 3) * Math.cos((s - hit) * 6);
          mallet.rotation.x = rest.mallet + a;
          if (!state.gongRang && s >= hit) { state.gongRang = true; audio.strike("gong", 1, ear, GONG); }
          const hum = s > hit ? Math.exp(-(s - hit) / 2) : 0;
          gong.rotation.x = rest.gong + 0.22 * hum * Math.sin((s - hit) * 3.6);
          gong.glow = 1 + 5 * hum;
          if (s > hit + 8) { state.gong = -1; mallet.rotation.x = rest.mallet; gong.rotation.x = rest.gong; gong.glow = 1; }
        }
        if (doing.bowl >= 0) {
          const s = doing.bowl += dt;
          bowl.glow = 1 + 2.5 * Math.exp(-s / 2.5) * (0.8 + 0.2 * Math.sin(s * 11));
          if (s > 12) { doing.bowl = -1; bowl.glow = 1; }
        }
      },
      // Space's action where the Ooga stands: the bell from its base or in front of it, the gong, the bowl, the pagoda's
      // wind bells, a lantern, the altar's candles, the incense, a tree, or the koi from the pond's edge or the bridge.
      near(x, z, fx, fz) {
        pick.act = null; pick.d = Infinity; pick.x = x; pick.z = z; pick.fx = fx; pick.fz = fz; pick.f = Math.hypot(fx, fz) || 1;
        consider(ACT.bell, BELL.x, BELL.z, 2.6);
        consider(ACT.gong, GONG.x, GONG.z + 0.35, 1.6);
        consider(ACT.bowl, BOWL.x, BOWL.z, 1.5);
        consider(ACT.winds, PAGODA.x, PAGODA.z, 3.0);
        consider(ACT.waft, BURNER.x, BURNER.z, 1.8);
        consider(doing.candles ? ACT.snuff : ACT.candles, 0, ALTAR_Z + 0.45, 1.5);
        for (let i = 0; i < LANTERN_AT.length; i++) {
          const before = pick.act;
          consider(lit[i] ? ACT.douse : ACT.light, LANTERN_AT[i][0], LANTERN_AT[i][1], 1.6);
          if (pick.act !== before) lantern = i;
        }
        for (let i = 0; i < TREES.length; i++) {
          const before = pick.act;
          consider(ACT.shake, TREES[i].x, TREES[i].z, 1.7);
          if (pick.act !== before) tree = i;
        }
        // The pond by how far its edge is, from outside it or on the bridge over it.
        const rim = (Math.hypot((x - POND.x) / POND.rx, (z - POND.z) / POND.rz) - 1) * Math.min(POND.rx, POND.rz);
        if (rim < 1.9 && Math.max(0, rim) + 0.3 < pick.d) { pick.act = ACT.feed; pick.d = Math.max(0, rim) + 0.3; }
        return pick.act;
      },
      tap(owner, hud) {
        switch (owner.kind) {
          case "gong": strikeGong(); hud.toast("Bong. The gong hums a long while"); return true;
          case "bell": ringBell(); hud.toast("The bell rings once a block, about every ten minutes; this one is for you"); return true;
          case "bowl": ringBowl(); hud.toast("The bowl sings"); return true;
          case "chimes": ringWinds(1); hud.toast("The wind bells on the pagoda's eaves"); return true;
          case "pond": feed(); hud.toast("The koi come up to be fed"); return true;
          case "tree": shakeTree(owner.index); hud.toast(owner.index < 2 ? "Petals everywhere" : "The maple's leaves shiver"); return true;
          case "bamboo": doing.rustle = 1; hud.toast("The bamboo rustles"); return true;
          case "lantern": toggleLantern(owner.index); hud.toast(lit[owner.index] ? "The lantern is lit" : "The lantern is out"); return true;
          case "altar": toggleCandles(); hud.toast(doing.candles ? "The candles are lit" : "The candles are snuffed"); return true;
          case "incense": waft(); hud.toast("A fresh curl of incense"); return true;
          case "paperlamp": swing[owner.index] = 1; return true;
          case "torii": hud.toast("Torii · the gate between the everyday and the sacred"); return true;
          case "live": hud.toast(chime.text ? `${chime.text} · the bell rings once a block` : "The bell rings once a block"); return true;
        }
        return false;
      },
      get stats() { return { ...audio.stats, bell: state.bell, gong: state.gong, bellRang: state.bellRang, gongRang: state.gongRang, candles: doing.candles, lit: Array.from(lit), feed: doing.feed }; },
      dispose() {
        document.removeEventListener("pointerdown", wake);
        document.removeEventListener("keydown", wake);
        audio.dispose();
      }
    };
  };
  BL.timechainRoomKinds.temple = { plan, steps, animate, door, statue, STATUE_STEPS };
})();
