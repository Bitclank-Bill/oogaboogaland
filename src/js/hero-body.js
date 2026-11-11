// EXPLORATION (the style pass, ?oogastyle=R): a body modelled from scratch after the reference art, in place of the
// one drawn from a character's block maps. Flat planes with crisp bevels: every limb is a loft of eight-sided rings
// (a rectangle with its corners cut), plates and features are slabs stood on them, and fur is flat pointed shards.
// Nothing here is smooth shaded, and a head keeps blocks where its character has them. Units are a sixteenth of the
// Ooga's height (`k.u`), in each rig part's own frame: a leg and an arm hang from their pivots, the torso stands on
// the hip, a hand sits about the rig's hand point (five eighths of the height down the arm), fingers to +z.
(() => {
  "use strict";
  const BL = window.BL = window.BL || {};
  const { geometry, pushVert, face } = BL.models, { hexToRgb } = BL.math;
  const rgb = (c) => typeof c === "string" ? hexToRgb(c) : c;
  const shade = (c, k) => rgb(c).map((v) => Math.max(0, Math.min(255, Math.round(v * k))));
  // A flat polygon of [x, y, z] points, wound so it faces `out`.
  const poly = (geo, pts, color, out, emissive = 0) => {
    let nx = 0, ny = 0, nz = 0;
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length];
      nx += (a[1] - b[1]) * (a[2] + b[2]); ny += (a[2] - b[2]) * (a[0] + b[0]); nz += (a[0] - b[0]) * (a[1] + b[1]);
    }
    const list = out && nx * out[0] + ny * out[1] + nz * out[2] < 0 ? pts.slice().reverse() : pts;
    face(geo, list.map((p) => pushVert(geo, p[0], p[1], p[2])), rgb(color), { emissive });
  };
  // The same polygon seen from both sides, for cloth and fur.
  const both = (geo, pts, color, back = color) => {
    face(geo, pts.map((p) => pushVert(geo, p[0], p[1], p[2])), rgb(color));
    face(geo, pts.map((p) => pushVert(geo, p[0], p[1], p[2])).reverse(), rgb(back));
  };
  // A ring: a rectangle hx by hz about (cx, cz) at height y, its corners cut by `b`; `back`, as [across, along],
  // cuts its two rear corners by that much instead, which tapers a heel; `tilt` drops its front and lifts its back
  // by that much a unit, for a ring that must sit level on a part that leans.
  const octagon = ([y, hx, hz, b, cx = 0, cz = 0, back, tilt = 0]) => {
    const bx = Math.min(b, hx * 0.9), bz = Math.min(b, hz * 0.9), rx = back ? back[0] : bx, rz = back ? back[1] : bz;
    return [[cx + hx - bx, hz], [cx + hx, hz - bz], [cx + hx, rz - hz], [cx + hx - rx, -hz], [cx - hx + rx, -hz], [cx - hx, rz - hz], [cx - hx, hz - bz], [cx - hx + bx, hz]]
      .map(([x, z]) => [x, y - z * tilt, cz + z]);
  };
  // Rings joined into a solid: `sections` are [y, hx, hz, bevel, cx, cz] in order, `colors` one colour or one a span.
  const loft = (geo, sections, colors, caps = [true, true]) => {
    const rings = sections.map(octagon), many = Array.isArray(colors) && typeof colors[0] !== "number";
    for (let i = 0; i + 1 < rings.length; i++) {
      const a = rings[i], b = rings[i + 1], color = many ? colors[Math.min(i, colors.length - 1)] : colors;
      const mx = ((sections[i][4] || 0) + (sections[i + 1][4] || 0)) / 2, mz = ((sections[i][5] || 0) + (sections[i + 1][5] || 0)) / 2;
      for (let j = 0; j < 8; j++) {
        const n = (j + 1) % 8, q = [a[j], a[n], b[n], b[j]];
        poly(geo, q, color, [(q[0][0] + q[1][0] + q[2][0] + q[3][0]) / 4 - mx, 0, (q[0][2] + q[1][2] + q[2][2] + q[3][2]) / 4 - mz]);
      }
    }
    const last = rings.length - 1;
    if (caps[0]) poly(geo, rings[0], many ? colors[0] : colors, [0, sections[0][0] - sections[1][0], 0]);
    if (caps[1]) poly(geo, rings[last], many ? colors[Math.min(last - 1, colors.length - 1)] : colors, [0, sections[last][0] - sections[last - 1][0], 0]);
    return geo;
  };
  // A plate stood on a surface: `outline` its foot (coplanar points), raised `depth` along `n` and drawn in to
  // `shrink` of its size at the top, so its sides are bevels.
  const slab = (geo, outline, n, depth, shrink, color, side = color, emissive = 0) => {
    const c = [0, 0, 0];
    for (const p of outline) { c[0] += p[0] / outline.length; c[1] += p[1] / outline.length; c[2] += p[2] / outline.length; }
    const top = outline.map((p) => [c[0] + (p[0] - c[0]) * shrink + n[0] * depth, c[1] + (p[1] - c[1]) * shrink + n[1] * depth, c[2] + (p[2] - c[2]) * shrink + n[2] * depth]);
    poly(geo, top, color, n, emissive);
    for (let i = 0; i < outline.length; i++) {
      const j = (i + 1) % outline.length;
      poly(geo, [outline[i], outline[j], top[j], top[i]], side, [(outline[i][0] + outline[j][0]) / 2 - c[0], (outline[i][1] + outline[j][1]) / 2 - c[1], (outline[i][2] + outline[j][2]) / 2 - c[2]], emissive);
    }
    return geo;
  };
  // Outlines on the front plane (z): a rectangle with cut corners, turned by `turn` about its middle.
  const rect = (x0, x1, y0, y1, z, c = 0, turn = 0) => {
    const mx = (x0 + x1) / 2, my = (y0 + y1) / 2, cos = Math.cos(turn), sin = Math.sin(turn);
    const pts = c ? [[x0 + c, y0], [x1 - c, y0], [x1, y0 + c], [x1, y1 - c], [x1 - c, y1], [x0 + c, y1], [x0, y1 - c], [x0, y0 + c]] : [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
    return pts.map(([x, y]) => [mx + (x - mx) * cos - (y - my) * sin, my + (x - mx) * sin + (y - my) * cos, z]);
  };
  const FRONT = [0, 0, 1];
  const mix = (i, salt) => ((Math.imul(i + 31, 73856093) ^ Math.imul(salt + 7, 19349663)) >>> 0) % 1000;
  // Fur hung from a ring: rows of flat pointed shards all the way round, each row under the last and longer.
  // `rows` are [length, colour, second colour or null, how far out]; `wide` a shard's width.
  const fur = (geo, ring, rows, wide, salt = 0) => {
    const [y, , , , cx = 0, cz = 0] = ring, pts = octagon(ring);
    rows.forEach(([long, color, second, out], row) => {
      for (let j = 0; j < 8; j++) {
        const a = pts[j], c = pts[(j + 1) % 8], span = Math.hypot(c[0] - a[0], c[2] - a[2]), n = Math.max(1, Math.round(span / wide));
        // The way this stretch of the ring faces.
        let ox = (a[0] + c[0]) / 2 - cx, oz = (a[2] + c[2]) / 2 - cz;
        const dx = c[0] - a[0], dz = c[2] - a[2], side = dz * ox - dx * oz >= 0 ? 1 : -1, l = Math.hypot(dx, dz) || 1;
        ox = dz / l * side; oz = -dx / l * side;
        for (let i = 0; i < n; i++) {
          const m = mix(i * 8 + j + row * 97, salt), t0 = i / n, t1 = (i + 1) / n, tm = (t0 + t1) / 2 + ((m % 7) - 3) * 0.04;
          const len = long * (0.82 + (m % 5) * 0.09), at = (t, drop, push) => [a[0] + dx * t + ox * push, y - drop, a[2] + dz * t + oz * push];
          const tone = second && m % 5 < 2 ? second : color;
          both(geo, [at(t0 - 0.04, -0.2, out), at(t0 - 0.04, len * 0.45, out + 0.12), at(tm, len, out + 0.3), at(t1 + 0.04, len * 0.45, out + 0.12), at(t1 + 0.04, -0.2, out)], tone, shade(tone, 0.8));
        }
      }
    });
    return geo;
  };
  // A cuff: two bands of wrap round a limb and a trim of little fur blocks over them (`down` -1 turns it over).
  // `band` is how tall each band of wrap is, for a deeper cuff.
  const cuff = (geo, y, hx, hz, { wrap, wrapDark, trim }, down = 1, band = 0.5) => {
    loft(geo, [[y, hx + 0.12, hz + 0.12, 0.45], [y - band * down, hx + 0.12, hz + 0.12, 0.45]], wrap);
    loft(geo, [[y - band * down, hx + 0.02, hz + 0.02, 0.4], [y - (band + 0.12) * down, hx + 0.02, hz + 0.02, 0.4]], wrapDark, [false, false]);
    loft(geo, [[y - (band + 0.12) * down, hx + 0.12, hz + 0.12, 0.45], [y - (band * 2 + 0.1) * down, hx + 0.12, hz + 0.12, 0.45]], wrap);
    const ring = octagon([y, hx + 0.3, hz + 0.3, 0.55]), light = shade(trim, 1), dark = shade(trim, 0.9);
    for (let j = 0; j < 8; j++) {
      const a = ring[j], c = ring[(j + 1) % 8], span = Math.hypot(c[0] - a[0], c[2] - a[2]), n = Math.max(1, Math.round(span / 0.7));
      for (let i = 0; i < n; i++) {
        const m = mix(i + j * 13, Math.round(y * 10)), t0 = i / n, t1 = (i + 1) / n, tall = 0.42 + (m % 4) * 0.1;
        const p0 = [a[0] + (c[0] - a[0]) * t0, a[2] + (c[2] - a[2]) * t0], p1 = [a[0] + (c[0] - a[0]) * t1, a[2] + (c[2] - a[2]) * t1];
        const q0 = [p0[0] * 0.8, p0[1] * 0.8], q1 = [p1[0] * 0.8, p1[1] * 0.8], y0 = y - 0.05 * down, y1 = y + tall * down, color = m % 2 ? light : dark;
        poly(geo, [[p0[0], y0, p0[1]], [p1[0], y0, p1[1]], [p1[0], y1, p1[1]], [p0[0], y1, p0[1]]], color, [p0[0] + p1[0], 0, p0[1] + p1[1]]);
        poly(geo, [[p0[0], y1, p0[1]], [p1[0], y1, p1[1]], [q1[0], y1, q1[1]], [q0[0], y1, q0[1]]], color, [0, down, 0]);
        poly(geo, [[p0[0], y0, p0[1]], [p1[0], y0, p1[1]], [q1[0], y0, q1[1]], [q0[0], y0, q0[1]]], color, [0, -down, 0]);
      }
    }
  };
  // The belt's buckle: a gold plate with a raised rim, on the front plane at z; with `coin`, the coin's B on it.
  const buckle = (geo, y, z, { gold, goldDark, goldLight, coin }) => {
    slab(geo, rect(-1.2, 1.2, y - 0.95, y + 0.95, z, 0.35), FRONT, 0.4, 0.92, gold, goldDark);
    slab(geo, rect(-0.85, 0.85, y - 0.62, y + 0.62, z + 0.4, 0.22), FRONT, 0.05, 1, goldDark);
    if (!coin) return;
    const B = ["01010", "11110", "10001", "11110", "10001", "10001", "11110", "01010"], px = 0.17, x0 = -px * 2.5, y1 = y + px * 4;
    for (let r = 0; r < B.length; r++) for (let c = 0; c < 5; c++) {
      if (B[r][c] === "1") slab(geo, rect(x0 + c * px, x0 + (c + 1) * px, y1 - (r + 1) * px, y1 - r * px, z + 0.45), FRONT, 0.07, 1, goldLight);
    }
  };
  // One form swept along a bending path, for a limb with joints that should not show as separate pieces: each
  // station is [x, y, z, nx, ny, t, w, b], a rectangle about (x, y, z) with its corners cut by b, t either way along
  // the unit direction (nx, ny) in the x-y plane and w either way along z. The stations join edge to edge and only
  // the two ends are closed.
  const sweep = (geo, stations, color) => {
    const rings = stations.map(([x, y, z, nx, ny, t, w, b]) => [[t - b, w], [t, w - b], [t, b - w], [t - b, -w], [b - t, -w], [-t, b - w], [-t, w - b], [b - t, w]]
      .map(([a, d]) => [x + nx * a, y + ny * a, z + d]));
    for (let i = 0; i + 1 < rings.length; i++) {
      const a = rings[i], b = rings[i + 1], p = stations[i], q = stations[i + 1], mid = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2, (p[2] + q[2]) / 2];
      for (let j = 0; j < 8; j++) {
        const n = (j + 1) % 8, f = [a[j], a[n], b[n], b[j]];
        poly(geo, f, color, [(f[0][0] + f[1][0] + f[2][0] + f[3][0]) / 4 - mid[0], (f[0][1] + f[1][1] + f[2][1] + f[3][1]) / 4 - mid[1], (f[0][2] + f[1][2] + f[2][2] + f[3][2]) / 4 - mid[2]]);
      }
    }
    const last = stations.length - 1, away = (i, j) => [stations[i][0] - stations[j][0], stations[i][1] - stations[j][1], stations[i][2] - stations[j][2]];
    poly(geo, rings[0], color, away(0, 1));
    poly(geo, rings[last], color, away(last, last - 1));
    return geo;
  };
  // A convex outline of [z, y] points drawn in by d on every edge.
  const inset = (outline, d) => {
    const n = outline.length;
    let area = 0;
    for (let i = 0; i < n; i++) { const p = outline[i], q = outline[(i + 1) % n]; area += p[0] * q[1] - q[0] * p[1]; }
    const turn = area > 0 ? 1 : -1, normals = outline.map((p, i) => {
      const q = outline[(i + 1) % n], dz = q[0] - p[0], dy = q[1] - p[1], len = Math.hypot(dz, dy);
      return [-dy / len * turn, dz / len * turn];
    });
    return { normals, points: outline.map((p, i) => {
      const a = normals[(i + n - 1) % n], c = normals[i], k = d / (1 + a[0] * c[0] + a[1] * c[1]);
      return [p[0] + (a[0] + c[0]) * k, p[1] + (a[1] + c[1]) * k];
    }) };
  };
  // A solid with a convex side outline, for something that folds: `outline` is that side as [z, y] points in order,
  // and the solid runs from x0 to x1 with the edges round its two sides cut by b0 and b1. The folds of the outline
  // are the only lines across it.
  const prism = (geo, outline, x0, x1, b0, b1, color) => {
    const n = outline.length, { normals } = inset(outline, 0), ends = [[x0, b0, -1], [x1, b1, 1]].map(([x, b, way]) => ({ x, b, way, points: inset(outline, b).points }));
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n, p = outline[i], q = outline[j], out = [0, -normals[i][1], -normals[i][0]];
      poly(geo, [[x0 + b0, p[1], p[0]], [x1 - b1, p[1], p[0]], [x1 - b1, q[1], q[0]], [x0 + b0, q[1], q[0]]], color, out);
      for (const { x, b, way, points } of ends) {
        if (b) poly(geo, [[x - way * b, p[1], p[0]], [x - way * b, q[1], q[0]], [x, points[j][1], points[j][0]], [x, points[i][1], points[i][0]]], color, [way, out[1], out[2]]);
      }
    }
    for (const { x, way, points } of ends) poly(geo, points.map((p) => [x, p[1], p[0]]), color, [way, 0, 0]);
    return geo;
  };
  // A fist, after the reference, in the hand's frame: it hangs from 1.35 at the wrist, its back at BACK and its palm
  // toward +z, which the rig turns in toward the body. It is less deep than it is wide, as a fist is. The back of the
  // hand is one block down to the first knuckles. `FINGER` is a finger's side from there, as [z, y]: it leaves the
  // back of the hand in the same plane and leans in under the fist in two easy folds rather than turning square, so
  // the second knuckle is the lowest point of the fist and points down the way the hand does; from there it folds
  // back up to the palm side, and its tip stands up that side under the heel of the palm. Each part is shorter than
  // the one before it, as a finger's are, and the first is well short of the back of the hand. The last points
  // close it inside the hand, up the back of the hand's own plane, so nothing of the join shows at the knuckle.
  const BACK = -1.3, KNUCKLE = -0.85, ROOT = KNUCKLE + 0.3, TIP = -0.05, CUT = 0.06;
  const FINGER = [[BACK, KNUCKLE], [-1.12, -1.08], [-0.3, -1.48], [0.1, -1.57], [0.42, -1.48], [0.92, -1.08], [1.1, -0.8], [1.1, TIP - 0.15], [0.95, TIP], [-0.2, TIP], [BACK, ROOT]];
  // The three fingers are parted by cuts that show the dark inside, with no line across a knuckle. The thumb is
  // rooted where a thumb is, on the palm's half of the side that leads (`side` -1 is the right hand, whose thumb is
  // at -x: turned in, that faces ahead). `s` scales the hand for a slender build.
  const hand = (side, skin, s = 1) => {
    const g = geometry(), inside = shade(skin, 0.5);
    // The hand: whole from the wrist down over the fingers' tips (the heel of the palm), and behind them below that
    // (the back of the hand) down to the knuckles, its corners easing to the fingers' where they root in it.
    loft(g, [[1.35, 1.25, 1.05, 0.4, 0, -0.1], [0.95, 1.6, 1.2, 0.45, 0, -0.1], [TIP + 0.06, 1.6, 1.2, 0.45, 0, -0.1], [TIP + 0.04, 1.6, 0.9, 0.45, 0, -0.4],
      [ROOT, 1.6, 0.9, 0.15, 0, -0.4], [KNUCKLE, 1.6, 0.9, 0.15, 0, -0.4]], skin);
    // What shows in the cuts.
    prism(g, inset(FINGER, 0.14).points, -1.35, 1.35, 0, 0, inside);
    // The fingers' edges are cut as the hand's are on its two sides, and only lightly where two fingers meet, so the
    // cuts between them stay narrow.
    for (const [x0, x1, b0, b1] of [[-1.6, -0.55, 0.15, CUT], [-0.52, 0.52, CUT, CUT], [0.55, 1.6, CUT, 0.15]]) prism(g, FINGER, x0, x1, b0, b1, skin);
    // The cuts between the fingers start at the knuckles and close to a point just above them.
    for (const x of [-0.535, 0.535]) poly(g, [[x - 0.03, KNUCKLE - 0.02, BACK - 0.012], [x + 0.03, KNUCKLE - 0.02, BACK - 0.012], [x + 0.008, KNUCKLE + 0.22, BACK - 0.012], [x - 0.008, KNUCKLE + 0.22, BACK - 0.012]], inside, [0, 0, -1]);
    // The side of the hand runs on into the side of its first and last fingers, with no notch where they meet.
    for (const x of [-1.6, 1.6]) poly(g, [[x, TIP + 0.05, 0.05], [x, TIP + 0.05, 0.65], [x, TIP - 0.2, 0.65], [x, TIP - 0.2, 0.05]], skin, [x, 0, 0]);
    // The thumb, one skin from wrist to tip with no joint showing: it rises out of the hand at the wrist, level
    // with it there, stands further out down the palm's half of the leading side, folds under and round the corner
    // in an even bend, and ends a short way across the first finger's tip.
    const S = side;
    sweep(g, [[1.15 * S, 1.3, 0.55, S, 0, 0.28, 0.42, 0.18], [1.42 * S, 0.85, 0.57, 0.95 * S, 0.3, 0.34, 0.5, 0.2],
      [1.7 * S, 0.3, 0.6, S, 0, 0.36, 0.52, 0.2], [1.72 * S, -0.02, 0.7, 0.92 * S, -0.38, 0.36, 0.5, 0.2],
      [1.62 * S, -0.27, 0.9, 0.71 * S, -0.71, 0.36, 0.46, 0.18], [1.4 * S, -0.4, 1.12, 0.26 * S, -0.97, 0.35, 0.4, 0.18],
      [1 * S, -0.4, 1.26, 0, -1, 0.33, 0.34, 0.16], [0.58 * S, -0.4, 1.26, 0, -1, 0.27, 0.27, 0.12]], skin);
    if (s !== 1) for (let i = 0; i < g.verts.length; i++) g.verts[i] *= s;
    return g;
  };
  // An arm is two parts about an elbow: the upper arm leans back to it (`elbow`: its place in the arm's frame), and
  // the forearm (in its own frame, hanging from the elbow) leans forward from it to the rig's hand point, ten units
  // under the shoulder, so the arm hangs with a natural bend and the hand follows the forearm.
  // A resting arm leans forward by a fifth of a radian; a ring tilted by this is level on it, and set back by this
  // much of its depth under the shoulder it stands straight over the ring above. `cap` is such a ring, y under the
  // shoulder and r across, its corners cut until it has eight near-even sides.
  const SLEEVE = Math.tan(0.2);
  const cap = (y, r) => [y, r, r * 1.04, r * 0.56, 0, y * SLEEVE, null, SLEEVE];
  const BUILD = {
    regular: {
      armX: 5.3, handScale: 1,
      leg: [[0, 1.75, 1.9, 0.5], [-1.6, 1.85, 2, 0.55, 0, 0.05], [-2.8, 1.65, 1.8, 0.5, 0, 0.1], [-3.4, 1.6, 1.8, 0.5, 0, 0.15], [-4, 1.5, 1.6, 0.45, 0, 0.08],
        [-4.8, 1.55, 1.7, 0.45, 0, -0.05], [-5.6, 1.4, 1.5, 0.4], [-6.1, 1.35, 1.45, 0.4]],
      // The anklet stands clear of the calf above it and the instep below, so its wraps cover the ankle whole.
      knee: [-3.95, -2.85, 1, 2], ankle: [-5.05, 1.68, 1.84],
      // The foot is a block its whole length: as tall at the toes as a toe, its top rising from them to the instep,
      // and drawn in a little toward the heel.
      foot: [[-7, 1.9, 2.75, 0.4, 0, 0.8, [0.65, 1.7]], [-6.15, 1.9, 2.75, 0.45, 0, 0.8, [0.65, 1.7]], [-5.55, 1.5, 1.75, 0.45, 0, -0.05]], toe: 0.85,
      arm: [[-0.55, 0.95, 1.05, 0.45], [-0.9, 1.5, 1.55, 0.55], [-1.8, 1.75, 1.8, 0.65], [-2.7, 1.6, 1.7, 0.55, 0, -0.22], [-3.15, 1.4, 1.5, 0.5, 0, -0.35],
        [-3.95, 1.5, 1.6, 0.5, 0, -0.58], [-4.9, 1.3, 1.4, 0.45, 0, -0.9], [-5.5, 1.05, 1.15, 0.4, 0, -1]],
      forearm: [[1.25, 0.95, 1, 0.45], [0.8, 1.3, 1.4, 0.5], [-0.6, 1.4, 1.5, 0.5], [-1.4, 1.55, 1.65, 0.5], [-2.9, 1.45, 1.5, 0.45], [-4, 1.3, 1.35, 0.45]],
      elbow: [-4.9, -0.9], sleeve: 4, wrist: [-2.75, 1.45, 1.5],
      // The chest is a raised section of the trunk itself: it steps out over the ribs in two eased facets, with its
      // front corners cut wide, and runs back to the collar.
      torso: [[-0.4, 3.1, 2, 0.6], [1, 3.3, 2.15, 0.6], [2, 3.2, 2.1, 0.6], [4, 3.4, 2.15, 0.65], [5.15, 3.7, 2.25, 0.7], [5.4, 3.9, 2.38, 0.95, 0, 0.13],
        [5.72, 4.05, 2.47, 1.1, 0, 0.22], [7.05, 4.3, 2.48, 1.15, 0, 0.2], [7.85, 4.05, 2.35, 0.9, 0, 0.05], [8.45, 2.6, 2, 0.7], [9.05, 2, 1.7, 0.6]],
      nipple: [2.65, 6.15],
      chest: [5.72, 7.05, 2.69, 2.68], belt: [0.72, 2.28, 3.62, 2.55]
    },
    slim: {
      // Her legs stand close, with a narrow gap between them (`legX`, each leg's middle from the body's), and her
      // arms hang from a little under the rig's shoulder (`armDrop`), so her shoulders sit level with her trunk's.
      // Her whole arm is drawn at `armScale` of the length the rig's arm has, which is long for her: the rig scales
      // the arm and what it holds together, so everything still lands in her fist.
      armX: 3.85, handScale: 0.74, legX: 1.5, armDrop: 0.6, armScale: 0.86,
      leg: [[0, 1.3, 1.4, 0.4], [-1.5, 1.3, 1.4, 0.4], [-3.2, 1, 1.1, 0.35, 0, 0.08], [-4.3, 1.05, 1.15, 0.35], [-5.6, 0.85, 0.95, 0.3], [-6.1, 0.82, 0.9, 0.3]],
      knee: null, ankle: [-5.2, 0.9, 1],
      foot: [[-7, 1.25, 2.15, 0.35, 0, 0.6], [-6.15, 1.25, 2.15, 0.4, 0, 0.6], [-5.6, 1.05, 1.35, 0.4, 0, -0.05]], toe: 0.85,
      // Her elbow sits at her waist, lower than his, so her forearm is the shorter half of her arm. Her shoulder is
      // a round cap in her sleeve: rings near eight even sides, each level and one over the other when the arm
      // hangs at rest (`cap`), so it is the same from the front as from behind.
      arm: [cap(0.42, 0.34), cap(0.3, 0.62), cap(0.08, 0.88), cap(-0.25, 1.04), cap(-0.7, 1.1), cap(-1.25, 1.1), [-2.05, 0.95, 1, 0.35, 0, -0.25],
        [-6.1, 0.85, 0.9, 0.3, 0, -0.75], [-6.6, 0.68, 0.72, 0.28, 0, -0.8]],
      forearm: [[0.9, 0.6, 0.65, 0.28], [0.5, 0.85, 0.9, 0.3], [-0.5, 0.9, 0.95, 0.3], [-3.4, 0.75, 0.78, 0.3], [-4.45, 0.68, 0.7, 0.28]],
      // An empty hand of hers hangs relaxed at her side: `relaxed` is that arm's bend at the elbow.
      elbow: [-6.1, -0.75], relaxed: 0.16, sleeve: 5, wrist: [-3.5, 0.8, 0.82],
      // Her chest swells and falls in many short steps, so from the side it is a curve and not a ledge.
      torso: [[-0.4, 2.9, 1.9, 0.6], [1.2, 3.1, 2.05, 0.6], [2.6, 2.25, 1.6, 0.5], [4.2, 2.55, 1.7, 0.55], [4.75, 2.72, 1.8, 0.6, 0, 0.03], [5.05, 2.85, 1.95, 0.68, 0, 0.16],
        [5.4, 2.95, 2.15, 0.76, 0, 0.35], [5.75, 3, 2.2, 0.8, 0, 0.4], [6.2, 3, 2.215, 0.8, 0, 0.415], [6.6, 3, 2.19, 0.78, 0, 0.39], [6.95, 3, 2.09, 0.74, 0, 0.29],
        [7.25, 3, 1.93, 0.7, 0, 0.13], [7.8, 2.8, 1.65, 0.7], [9.05, 1.4, 1.3, 0.5]],
      chest: [5.45, 6.65, 2.56, 2.62], belt: [1.4, 2.7, 3.08, 2.14]
    }
  };
  // Where the rig holds what a hand carries: in units under the shoulder, and ahead of it. A fist closes about
  // that point, so everything the game puts in a hand lands in it.
  const HAND_Y = 10, HAND_Z = 2.4;
  const scaled = (geo, u) => { for (let i = 0; i < geo.verts.length; i++) geo.verts[i] *= u; return geo; };
  // The body: `o` its colours and what it wears.
  //   skin; slim; torso: a colour for each span of the torso's rings (skin where left out); sleeve: the deltoid's colour
  //   belt: { color, gold, goldDark, goldLight, coin } (a buckle when gold is given); skirt: [[length, colour, second, out], ...]
  //   cuffs / anklets: { wrap, wrapDark, trim }; boot: { color, sole, detail }; pecs: the line between a bare chest's two
  //   halves and its nipples' colour; emblem(geo, z, y0, y1): what the chest's front carries
  const build = (k, o) => {
    const u = k.u, B = o.slim ? BUILD.slim : BUILD.regular, skin = rgb(o.skin);
    const torso = geometry(), spans = B.torso.length - 1, [cy0, cy1, cz0, cz1] = B.chest, chestZ = (y) => cz0 + (cz1 - cz0) * (y - cy0) / (cy1 - cy0);
    loft(torso, B.torso, Array.from({ length: spans }, (_, i) => o.torso && o.torso[i] || skin));
    if (o.belt) {
      loft(torso, [[B.belt[0], B.belt[2], B.belt[3], 0.62], [B.belt[1], B.belt[2], B.belt[3], 0.62]], o.belt.color);
      if (o.belt.gold) buckle(torso, (B.belt[0] + B.belt[1]) / 2, B.belt[3], o.belt);
    }
    if (o.pecs && B.nipple) {
      // A faint line down the breastbone, and a nipple well out on each half.
      poly(torso, [[-0.07, cy0 + 0.15, chestZ(cy0 + 0.15) + 0.012], [0.07, cy0 + 0.15, chestZ(cy0 + 0.15) + 0.012], [0.07, cy1 - 0.3, chestZ(cy1 - 0.3) + 0.012], [-0.07, cy1 - 0.3, chestZ(cy1 - 0.3) + 0.012]], shade(skin, 0.82), FRONT);
      const [nx, ny] = B.nipple;
      for (const side of [-1, 1]) slab(torso, rect(nx * side - 0.22, nx * side + 0.22, ny - 0.2, ny + 0.2, chestZ(ny) - 0.02), FRONT, 0.07, 0.85, o.pecs);
    }
    if (o.skirt) fur(torso, [B.belt[0] + 0.15, B.belt[2] + 0.05, B.belt[3] + 0.05, 0.62], o.skirt, o.slim ? 1.05 : 1.25, 3);
    if (o.emblem) o.emblem(torso, chestZ, cy0, cy1);
    // An arm drawn at a scale is drawn that much thicker, so only its length changes.
    const armK = B.armScale || 1, thick = (ring) => { const r = ring.slice(); r[1] /= armK; r[2] /= armK; r[3] /= armK; return r; };
    const arm = () => loft(geometry(), B.arm.map(thick), Array.from({ length: B.arm.length - 1 }, (_, i) => o.sleeve && i < B.sleeve ? o.sleeve : skin));
    // The elbow, the forearm's length from it to the hand point, and how far the forearm leans forward at rest. The
    // forearm's rings are drawn for one that hangs straight under the shoulder; below the elbow they stretch to this.
    const [ey, ez] = B.elbow, reach = Math.hypot(HAND_Y + ey, HAND_Z - ez), long = (y) => y < 0 ? y * reach / Math.hypot(HAND_Y + ey, ez) : y;
    // `clear` is the bend that carries the fist clear of the front of the trunk, for an arm laid across it.
    const elbow = { y: ey * u, z: ez * u, length: reach * u, rest: Math.atan2(HAND_Z - ez, HAND_Y + ey),
      clear: Math.asin(Math.min(1, (B.belt[3] + 1.45 * B.handScale - ez * armK) / (reach * armK))), relaxed: B.relaxed };
    const forearm = () => {
      const g = loft(geometry(), B.forearm.map(([y, ...ring]) => thick([long(y), ...ring])), skin);
      if (o.cuffs) cuff(g, long(B.wrist[0]), B.wrist[1] / armK, B.wrist[2] / armK, o.cuffs, 1);
      return g;
    };
    // How far behind the body's middle its back lies, half way up it: where a weapon slung across it rests.
    const upper = B.torso.findIndex((ring) => ring[0] > 4.5), below = B.torso[upper - 1], above = B.torso[upper], part = (4.5 - below[0]) / (above[0] - below[0]);
    const spine = below[2] - (below[5] || 0) + (above[2] - (above[5] || 0) - below[2] + (below[5] || 0)) * part;
    const leg = () => {
      const g = geometry();
      loft(g, B.leg, o.legs || skin);
      if (B.knee) slab(g, rect(-B.knee[2], B.knee[2], B.knee[0], B.knee[1], B.knee[3] - 0.12, 0.3), FRONT, 0.3, 0.78, o.legs || skin, shade(o.legs || skin, 0.86));
      if (o.boot) {
        // A boot: a shaft up the shin, a sole, and a foot as blunt and tall at the toe as a bare one.
        const a = B.ankle, f = B.foot;
        loft(g, [[a[0] + 1.1, a[1] + 0.3, a[2] + 0.3, 0.35], [-6, a[1] + 0.3, a[2] + 0.3, 0.35]], o.boot.color);
        loft(g, [[-7, f[0][1] + 0.06, f[0][2] + 0.06, 0.35, 0, f[0][5]], [-6.72, f[0][1] + 0.06, f[0][2] + 0.06, 0.35, 0, f[0][5]]], o.boot.sole);
        loft(g, [[-6.72, f[0][1], f[0][2], 0.35, 0, f[0][5]], [f[1][0] + 0.05, f[1][1], f[1][2], 0.4, 0, f[1][5]], [f[2][0] + 0.05, f[2][1] + 0.12, f[2][2] + 0.12, 0.4, 0, f[2][5]]], o.boot.color);
        if (o.boot.detail) o.boot.detail(g, B);
      } else {
        loft(g, B.foot, skin);
        // Toes: grooves cut down the foot's blunt front, as lines a shade darker.
        const f = B.foot[0], front = f[5] + f[2];
        for (const x of [-0.95, 0, 0.95]) poly(g, [[x - 0.06, -6.98, front + 0.012], [x + 0.06, -6.98, front + 0.012], [x + 0.06, -7 + B.toe, front + 0.012], [x - 0.06, -7 + B.toe, front + 0.012]], shade(skin, 0.7), FRONT);
        if (o.anklets) cuff(g, B.ankle[0] + 0.3, B.ankle[1], B.ankle[2], o.anklets, 1, 0.62);
      }
      return g;
    };
    return { torso: scaled(torso, u), arm: scaled(arm(), u), forearm: scaled(forearm(), u), leg: scaled(leg(), u),
      handR: scaled(hand(-1, skin, B.handScale / armK), u), handL: scaled(hand(1, skin, B.handScale / armK), u), armX: B.armX * u, armDrop: (B.armDrop || 0) * u, armScale: armK,
      // The fist's measures from its middle: to the face of its palm, and to the end of its thumb's side.
      fist: { palm: 1.1 * B.handScale * u, span: 2.17 * B.handScale * u },
      legX: B.legX ? B.legX * u : 0, elbow, back: spine * u, modelled: true };
  };
  BL.heroBody = { poly, both, loft, slab, rect, fur, cuff, buckle, hand, build, shade, scaled, FRONT, BUILD };
})();
