// The hammock on the path before Ooga Arcade: a woven vine bed for three Oogas, slung from a ridgeline tied round the
// two meadow palms that flank the arcade's path. The meadow palms are planted afresh each visit from the pile's size,
// so `plan` is a rule, not a place: given the two trunks it ties the ridgeline TIE up each (above every walker's head
// where it crosses the path) and hangs the bed from it at the first spot along it, nearest the middle, where the bed,
// its swing and the three places to stand up are clear of the path and anything claimed, on level ground; null when
// there is none, and the island has no hammock that visit.
// `create` builds it into the hub's graph: the ridgeline a static node whose collision shell (`collisionGeometry`) is
// the bed's whole swing, so walkers go round and nothing below the ridgeline collides, and the bed a node swinging
// about the ridgeline, a bounded pendulum costing one sine a frame. Its three `seats` are the crew's (`sitPlayer`,
// `standPlayer`), placed and posed here every frame as the forklift places its driver. Nothing is networked beyond
// the driven Ooga's ordinary pose: a resting Ooga reports its seat's still point (`restPoint`), never its swing, so
// the room hears nothing while it rests; another page knows a resting Ooga by where it is (`restingAt`: over a seat,
// above the ground) and poses it in its own bed (`poseRemote`). Two pages can take one seat in the same instant; the
// lower room id keeps it and the other moves along or stands (`settle`).
(() => {
  "use strict";
  const BL = window.BL = window.BL || {};
  const { hexToRgb } = BL.math;
  // Metres. The ridgeline ties TIE up each trunk and sags RIDGE_SAG at its middle; over the path it must leave
  // HEADROOM. The bed is BED_LEN along the ridgeline and BED_W across, its ends END_Y over the ground and its middle
  // BED_SAG lower, cradled CRADLE across; the trunks stand at least TRUNK_CLEAR from its ends.
  const TIE = 3.05, RIDGE_SAG = 0.12, HEADROOM = 2.6, SPAN_MIN = 4.5, SPAN_MAX = 10;
  const BED_LEN = 2.5, BED_W = 0.95, END_Y = 0.86, BED_SAG = 0.2, CRADLE = 0.07, TRUNK_CLEAR = 0.6;
  // Seats along the bed from its middle, each SEAT_LIFT over the cloth so the seat is the surface the crew sits on.
  const SEAT_AT = [-0.8, 0, 0.8], SEAT_LIFT = 0.04, SLOTS = SEAT_AT.length;
  // Where an Ooga stands up: STAND past the bed's swing (`envelope`'s `across`), room for the widest Ooga.
  const STAND = 0.6;
  // The swing: the bed's angle about the ridgeline is `amp` sin(OMEGA t), `amp` easing toward REST (or REST_HELD with
  // anyone in it) at DECAY a second and never past SWAY_MAX; a sitter's landing and a shaken palm add KICK.
  const OMEGA = 2.1, REST = 0.012, REST_HELD = 0.035, DECAY = 0.35, KICK = 0.06, SWAY_MAX = 0.11;
  // The cloth's grid, and the radii of the parts drawn round it: the spreaders (whose knuckles stand SPREADER_KNUCKLE
  // proud), the edge cords, the cords to each ring, the drop line and the knot where it ties on.
  const BED_NX = 14, BED_NZ = 4, SPREADER_R = 0.035, SPREADER_KNUCKLE = 1.14, EDGE_R = 0.016, CORD_R = 0.011, DROP_R = 0.022, KNOT_R = 0.05;
  const CORD_Z = [-BED_W / 2 - 0.06, -BED_W / 4, BED_W / 4, BED_W / 2 + 0.06];
  // The suspension past each end of the bed: the ring RING_OUT out, the drop line DROP_OUT.
  const RING_OUT = 0.28, DROP_OUT = 0.32;
  // A resting Ooga as another page sends it: within REST_NEAR of a seat across, its feet REST_LOW to REST_HIGH over
  // the ground. No walker reaches a seat's place across (the bed's shell is in the way), and REST_HIGH stays under the
  // shell's top (the ridgeline), so one standing on the bed or flying over is not resting.
  const REST_NEAR = 0.4, REST_LOW = 0.05, REST_HIGH = 0.9;
  // A sitter leans back LEAN into the cloth.
  const LEAN = -0.16;
  const ROPE = "#c9a36a", CORD = "#7a5a32";
  const WEAVE = ["#b48a52", "#9c7443", "#b48a52", "#c25d3a", "#d7a95a", "#c25d3a"].map(hexToRgb), WEAVE_UNDER = hexToRgb("#6e5233");

  // The ridgeline's height t of the way from a to b.
  const ridgeY = (p, t) => p.ay + (p.by - p.ay) * t - Math.sin(Math.PI * t) * RIDGE_SAG;
  // The cloth's height under the pivot at x along the bed and z across it, before any swing.
  const clothY = (p, x, z) => p.endY - Math.sin(Math.PI * (x / BED_LEN + 0.5)) * BED_SAG - Math.cos(Math.PI * z / BED_W) * CRADLE;

  // How far the bed reaches as it swings, in the pivot's frame (x along the ridgeline, y up from it, z across): every
  // point `bedGeometry` draws through, with the thickness of the part there, turned through +-SWAY_MAX about the
  // ridgeline. Seen from above it is an octagon: the `body` (the cloth, its edge cords and the spreaders) `half` along
  // and `across` either side, and past it the `tip` (each ring, drop line and knot, hanging near the middle), the cords
  // between the two inside the outline; `lo` and `hi` under and over the pivot. The collision shell is this octagon
  // from `lo` to `hi`, and `plan` keeps the ground under it clear.
  const envelope = (p) => {
    const body = { half: 0, across: 0 }, tip = { half: 0, across: 0 }, e = { body, tip, lo: Infinity, hi: -Infinity };
    const c = Math.cos(SWAY_MAX), s = Math.sin(SWAY_MAX);
    // A cos a + B sin a over the swing: its ends, and where its slope is zero when that falls inside.
    const swung = (A, B) => {
      const out = [A * c - B * s, A * c + B * s], a = A ? Math.atan(B / A) : Infinity;
      if (Math.abs(a) < SWAY_MAX) out.push(A * Math.cos(a) + B * Math.sin(a));
      return out;
    };
    // Turned by a, a point lies y sin a + z cos a across and y cos a - z sin a high.
    const at = (part, x, y, z, r) => {
      part.half = Math.max(part.half, Math.abs(x) + r);
      for (const v of swung(z, y)) part.across = Math.max(part.across, Math.abs(v) + r);
      for (const v of swung(y, -z)) { e.lo = Math.min(e.lo, v - r); e.hi = Math.max(e.hi, v + r); }
    };
    for (let i = 0; i <= BED_NX; i++) for (let j = 0; j <= BED_NZ; j++) {
      const x = (i / BED_NX - 0.5) * BED_LEN, z = (j / BED_NZ - 0.5) * BED_W;
      at(body, x, clothY(p, x, z), z, 0);
    }
    for (const z of [-BED_W / 2, BED_W / 2]) for (let i = 0; i <= BED_NX; i += 2) { const x = (i / BED_NX - 0.5) * BED_LEN; at(body, x, clothY(p, x, z) + 0.012, z, EDGE_R); }
    for (const end of [-1, 1]) {
      const x = end * BED_LEN / 2, top = ridgeY(p, p.t + end * (BED_LEN / 2 + DROP_OUT) / p.span) - p.y;
      for (const z of [-1, 1]) at(body, x, p.endY + 0.02, z * (BED_W / 2 + 0.1), SPREADER_R * SPREADER_KNUCKLE);
      for (const z of CORD_Z) at(body, x, p.endY + 0.03, z, CORD_R);
      at(tip, x + end * RING_OUT, p.endY + 0.42, 0, DROP_R);
      at(tip, x + end * DROP_OUT, top - 0.06, 0, KNOT_R);
      at(tip, x + end * DROP_OUT, top + 0.05, 0, KNOT_R);
    }
    // Its bounds, and its corners round from the tip's on +x in the order the shell's faces wind.
    e.half = tip.half; e.across = body.across;
    e.outline = [[tip.half, -tip.across], [tip.half, tip.across], [body.half, body.across], [-body.half, body.across],
      [-tip.half, tip.across], [-tip.half, -tip.across], [-body.half, -body.across], [body.half, -body.across]];
    // The point of the octagon nearest (along, across), written into `out`: itself inside, else the nearest on the
    // edges of its quarter, the tip's end, the slant and the body's side.
    const sx = body.across - tip.across, sz = tip.half - body.half, sl = Math.hypot(sx, sz);
    const edges = [[tip.half, 0, tip.half, tip.across], [tip.half, tip.across, body.half, body.across], [body.half, body.across, 0, body.across]];
    e.nearest = (along, side, out) => {
      const u = Math.abs(along), v = Math.abs(side);
      out[0] = u; out[1] = v;
      if (Math.max(u - tip.half, v - body.across, ((u - body.half) * sx + (v - body.across) * sz) / sl) > 0) {
        let best = Infinity;
        for (const [ax, az, bx, bz] of edges) {
          const dx = bx - ax, dz = bz - az, k = Math.max(0, Math.min(1, ((u - ax) * dx + (v - az) * dz) / (dx * dx + dz * dz)));
          const x = ax + dx * k, z = az + dz * k, d = Math.hypot(u - x, v - z);
          if (d < best) { best = d; out[0] = x; out[1] = z; }
        }
      }
      out[0] *= Math.sign(along) || 1; out[1] *= Math.sign(side) || 1;
      return out;
    };
    return e;
  };

  // `a` and `b` are the trunks at the tie, { x, z, ground } with the ground at each foot; `clear(x, z, r)` says a
  // spot r across is off the path and unclaimed, `surfaceAt(x, z)` the island's ground. A plan, or null.
  const plan = ({ a, b, clear, surfaceAt }) => {
    const dx = b.x - a.x, dz = b.z - a.z, span = Math.hypot(dx, dz);
    if (span < SPAN_MIN || span > SPAN_MAX) return null;
    const ux = dx / span, uz = dz / span, nx = -uz, nz = ux;
    const p = { ax: a.x, az: a.z, ay: a.ground + TIE, bx: b.x, bz: b.z, by: b.ground + TIE, span, ux, uz, nx, nz };
    // Headroom wherever the ridgeline passes over the path.
    for (let k = 0; k <= 40; k++) {
      const t = k / 40, x = a.x + dx * t, z = a.z + dz * t;
      if (!clear(x, z, 0.6) && ridgeY(p, t) - surfaceAt(x, z) < HEADROOM) return null;
    }
    const t0 = (BED_LEN / 2 + TRUNK_CLEAR) / span;
    // The bed hung t of the way along: its pivot, ground, ends and swing.
    const hang = (t) => {
      p.t = t;
      p.x = a.x + dx * t; p.z = a.z + dz * t; p.ground = surfaceAt(p.x, p.z);
      p.y = ridgeY(p, t);
      p.endY = p.ground + END_Y - p.y;
      p.envelope = envelope(p);
    };
    // Its whole swing on level ground, clear: a grid no coarser than CLEAR_STEP over the envelope's bounds, each spot
    // moved to the outline's nearest point and asked CLEAR_R across. Every point of the outline lies within half a
    // cell's diagonal (under CLEAR_R) of a grid spot, and no nearer to it moved, so the spots cover it all.
    const CLEAR_STEP = 0.4, CLEAR_R = 0.3, at = [0, 0];
    const fits = (t) => {
      hang(t);
      const { half, across, nearest } = p.envelope, ni = Math.ceil(2 * half / CLEAR_STEP), nj = Math.ceil(2 * across / CLEAR_STEP);
      for (let i = 0; i <= ni; i++) for (let j = 0; j <= nj; j++) {
        const [along, side] = nearest(half * (2 * i / ni - 1), across * (2 * j / nj - 1), at), x = p.x + ux * along + nx * side, z = p.z + uz * along + nz * side;
        if (!clear(x, z, CLEAR_R) || Math.abs(surfaceAt(x, z) - p.ground) > 0.2) return false;
      }
      return true;
    };
    // Nearest the middle first, a fifth of a metre at a time each way.
    let tc = NaN;
    for (let k = 0; k <= 50 && Number.isNaN(tc); k++) for (const s of k ? [-1, 1] : [1]) {
      const t = 0.5 + s * k * 0.2 / span;
      if (t >= t0 && t <= 1 - t0 && fits(t)) { tc = t; break; }
    }
    if (Number.isNaN(tc)) return null;
    hang(tc);
    const out = p.envelope.across + STAND;
    // Seats face out to the side whose places to stand are all clear, the side away from the path when both are.
    let side = 0;
    for (const s of [1, -1]) {
      let ok = true;
      for (const at of SEAT_AT) {
        const x = p.x + ux * at + nx * s * out, z = p.z + uz * at + nz * s * out;
        if (!clear(x, z, 0.35) || Math.abs(surfaceAt(x, z) - p.ground) > 0.25) { ok = false; break; }
      }
      if (ok) { side = s; break; }
    }
    if (!side) return null;
    p.side = side;
    p.yaw = Math.atan2(-uz, ux);
    p.seatRy = Math.atan2(nx * side, nz * side);
    p.seats = SEAT_AT.map((at) => {
      const wx = p.x + ux * at + nx * side * out, wz = p.z + uz * at + nz * side * out;
      return { at, y: clothY(p, at, 0) + SEAT_LIFT, walkAt: { x: wx, z: wz }, floor: surfaceAt(wx, wz) };
    });
    return p;
  };

  // The bed in the pivot's frame (+x along the ridgeline, +z across to the seats' side when `side` is 1, y up from the
  // ridgeline): woven cloth cradled between two bamboo spreaders, cords from each spreader's ends to a ring and a drop
  // line from the ring up to where the ridgeline passes, and a cord along each edge.
  const bedGeometry = (p) => {
    const M = BL.models, J = BL.hubModels, NX = BED_NX, NZ = BED_NZ, cloth = M.geometry(), v = cloth.verts, ids = [];
    for (let i = 0; i <= NX; i++) for (let j = 0; j <= NZ; j++) {
      const x = (i / NX - 0.5) * BED_LEN, z = (j / NZ - 0.5) * BED_W;
      v.push(x, clothY(p, x, z), z);
      ids.push(v.length / 3 - 1);
    }
    // Both faces of every cell: the weave's stripes run across the bed on top, a dark underside below.
    for (let i = 0; i < NX; i++) for (let j = 0; j < NZ; j++) {
      const a = ids[i * (NZ + 1) + j], b = ids[(i + 1) * (NZ + 1) + j], c = ids[(i + 1) * (NZ + 1) + j + 1], d = ids[i * (NZ + 1) + j + 1];
      cloth.faces.push({ i: [a, d, c, b], color: WEAVE[(i + (j & 1)) % WEAVE.length], emissive: 0 });
      cloth.faces.push({ i: [a, b, c, d], color: WEAVE_UNDER, emissive: 0 });
    }
    const ends = [-1, 1], round = [];
    for (const e of ends) {
      const x = e * BED_LEN / 2, y = p.endY + 0.02;
      round.push(J.bamboo(x, y, -BED_W / 2 - 0.1, x, y, BED_W / 2 + 0.1, SPREADER_R, "#cdb06a"));
    }
    return J.withJungle(M.shaded(round, [cloth]), (g) => {
      for (const e of ends) {
        const x = e * BED_LEN / 2, top = ridgeY(p, p.t + e * (BED_LEN / 2 + DROP_OUT) / p.span) - p.y, ring = [x + e * RING_OUT, p.endY + 0.42, 0];
        for (const z of CORD_Z) J.liana(g, [[x, p.endY + 0.03, z], ring], CORD_R, CORD_R, ROPE);
        J.liana(g, [ring, [x + e * DROP_OUT, top - 0.02, 0]], DROP_R, 0.018, ROPE);
        J.liana(g, [[x + e * DROP_OUT, top - 0.06, 0], [x + e * DROP_OUT, top + 0.05, 0]], KNOT_R, KNOT_R, CORD);
      }
      for (const z of [-BED_W / 2, BED_W / 2]) {
        const edge = [];
        for (let i = 0; i <= NX; i += 2) { const x = (i / NX - 0.5) * BED_LEN; edge.push([x, clothY(p, x, z) + 0.012, z]); }
        J.liana(g, edge, EDGE_R, EDGE_R, CORD);
      }
    });
  };

  // The ridgeline about its own middle, lashed round both trunks, with a few leaves where it ties on.
  const ridgeGeometry = (p, ra, rb, rand) => {
    const M = BL.models, J = BL.hubModels, mx = (p.ax + p.bx) / 2, my = (p.ay + p.by) / 2, mz = (p.az + p.bz) / 2;
    const ax = p.ax - mx, ay = p.ay - my, az = p.az - mz, bx = p.bx - mx, by = p.by - my, bz = p.bz - mz;
    const geo = J.withJungle(M.shaded([J.lashing(ax, ay, az, 0, 1, 0, ra), J.lashing(bx, by, bz, 0, 1, 0, rb)]), (g) => {
      // From each trunk's face, not its middle.
      J.liana(g, J.sagPoints(ax + p.ux * ra, ay, az + p.uz * ra, bx - p.ux * rb, by, bz - p.uz * rb, RIDGE_SAG, 16), 0.03, 0.03, ROPE);
      J.sprig(g, ax, ay + 0.06, az, -p.ux, 0.5, -p.uz, 3, 0.3, rand);
      J.sprig(g, bx, by + 0.06, bz, p.ux, 0.5, p.uz, 3, 0.3, rand);
    });
    // Its collision is the bed's whole swing (`envelope`), a closed octagonal prism turned with the ridgeline: walkers
    // go round the bed and stand clear of it, and the ridgeline itself, overhead between the trunks and the bed,
    // blocks nothing.
    const { outline } = p.envelope, n = outline.length, lo = p.y + p.envelope.lo - my, hi = p.y + p.envelope.hi - my;
    const cx = p.x - mx, cz = p.z - mz, shell = M.geometry();
    for (const y of [lo, hi]) for (const [along, side] of outline)
      shell.verts.push(cx + p.ux * along + p.nx * side, y, cz + p.uz * along + p.nz * side);
    shell.faces.push({ i: outline.map((_, k) => k), color: WEAVE_UNDER, emissive: 0 }, { i: outline.map((_, k) => 2 * n - 1 - k), color: WEAVE_UNDER, emissive: 0 });
    for (let k = 0; k < n; k++) shell.faces.push({ i: [k, k + n, (k + 1) % n + n, (k + 1) % n], color: WEAVE_UNDER, emissive: 0 });
    geo.collisionGeometry = shell;
    return { geo, x: mx, y: my, z: mz };
  };

  // The hammock in `root` from a plan: `ra`, `rb` the trunks' radii at the tie, `seed` its leaves'.
  const create = ({ plan: p, root, solids, ra, rb, seed }) => {
    const { createNode, addChild, removeChild } = BL.scene;
    const ridge = ridgeGeometry(p, ra, rb, BL.math.mulberry32(seed));
    const ridgeNode = createNode({ geometry: ridge.geo, position: { x: ridge.x, y: ridge.y, z: ridge.z }, sightHidden: true });
    // Its +z is the plan's `n`; the seats face +z when `side` is 1 and -z when it is -1, and the swing turns by `side`.
    const bedNode = createNode({ geometry: bedGeometry(p), position: { x: p.x, y: p.y, z: p.z }, rotation: { x: 0, y: p.yaw, z: 0 }, sightHidden: true });
    addChild(root, ridgeNode); addChild(root, bedNode);
    solids.add(ridgeNode);
    const seats = p.seats.map((s, index) => ({ kind: "hammock", index, x: 0, y: 0, z: 0, ry: p.seatRy, floor: s.floor, walkAt: { x: s.walkAt.x, z: s.walkAt.z }, sitter: null, remote: 0, restX: 0, restY: 0, restZ: 0 }));
    let amp = REST, angle = 0;
    // A seat's place for an angle of swing: the bed turns about the ridgeline (+x in its frame), so a point `drop`
    // under it moves `drop` sin(angle) across and rises by drop (1 - cos(angle)).
    const place = (seat, a) => {
      const s = p.seats[seat.index], drop = -s.y, across = -Math.sin(a) * drop * p.side, down = Math.cos(a) * drop;
      seat.x = p.x + p.ux * s.at + p.nx * across;
      seat.z = p.z + p.uz * s.at + p.nz * across;
      seat.y = p.y - down;
    };
    for (const seat of seats) { place(seat, 0); seat.restX = seat.x; seat.restY = seat.y; seat.restZ = seat.z; }
    // The crew's seated pose finished for the hammock: on the seat as it swings, leaning back, tipped with the bed.
    const posed = (cave, seat) => {
      const r = cave.root;
      r.position.x = seat.x; r.position.y = seat.y + cave.traits.height * 0.08; r.position.z = seat.z;
      r.rotation.y = seat.ry;
      r.rotation.x = LEAN + angle;
    };
    const update = (dt, time, still) => {
      let held = false;
      for (const seat of seats) if (seat.sitter || seat.remote) held = true;
      const rest = held ? REST_HELD : REST;
      amp += (rest - amp) * Math.min(1, DECAY * dt);
      if (!still) angle = amp * Math.sin(OMEGA * time);
      bedNode.rotation.x = angle * p.side;
      for (const seat of seats) {
        place(seat, angle);
        if (seat.sitter && seat.sitter.camp.seat === seat) posed(seat.sitter, seat);
      }
    };
    const kick = () => { amp = Math.min(SWAY_MAX, amp + KICK); };
    // The seat a body with its feet at (x, feet, z) rests on, judged against the still bed; -1 for none.
    const restingAt = (x, feet, z) => {
      if (feet - p.ground < REST_LOW || feet - p.ground > REST_HIGH) return -1;
      for (const seat of seats) if (Math.hypot(x - seat.restX, z - seat.restZ) < REST_NEAR) return seat.index;
      return -1;
    };
    // Who rests where on other pages: the room's remotes with an Ooga body that `shown` accepts, the lower id holding
    // a seat two claim. The visitor's own Ooga, resting on a seat a lower id holds, moves to a free seat (`move`) or,
    // with none free, stands (`stand`); true when it moved or stood.
    const settle = (remotes, selfId, shown, move, stand) => {
      for (const seat of seats) seat.remote = 0;
      for (const rec of remotes) {
        if (!rec.body || rec.bodyKind === "gorilla" || !shown(rec)) continue;
        const k = restingAt(rec.x, rec.y, rec.z);
        if (k >= 0 && (!seats[k].remote || rec.id < seats[k].remote)) seats[k].remote = rec.id;
      }
      for (const seat of seats) {
        if (!seat.sitter || !seat.remote || !selfId || seat.remote > selfId) continue;
        const to = free(seat);
        if (to) return move(seat.sitter, seat, to);
        return stand(seat.sitter);
      }
      return false;
    };
    // The free seat nearest `from` (a seat, or any { x, z }), skipping `from`; null when the bed is full.
    const free = (from) => {
      let best = null, distance = Infinity;
      for (const seat of seats) {
        if (seat === from || seat.sitter || seat.remote) continue;
        const d = Math.hypot(seat.restX - from.x, seat.restZ - from.z);
        if (d < distance) { best = seat; distance = d; }
      }
      return best;
    };
    // A body standing at (x, z) reaches the hammock within `reach` of a seat's place to stand or of the seat.
    const near = (x, z, reach) => {
      for (const seat of seats) if (Math.hypot(x - seat.walkAt.x, z - seat.walkAt.z) < reach || Math.hypot(x - seat.restX, z - seat.restZ) < reach) return true;
      return false;
    };
    // Other pages' Oogas this bed has tipped back (`cave.hammockRest`), to set upright when they leave it or the bed
    // comes down; one whose body the remote pool has since dropped (off the graph) gives up its place.
    const tipped = [];
    const upright = (cave) => {
      cave.root.rotation.x = 0;
      cave.hammockRest = false;
      tipped.splice(tipped.indexOf(cave), 1);
    };
    // Another page's resting Ooga, posed in this bed.
    const poseRemote = (cave, feet) => {
      const r = cave.root, k = restingAt(r.position.x, feet, r.position.z);
      if (k < 0) {
        if (cave.hammockRest) upright(cave);
        return false;
      }
      if (!cave.hammockRest) {
        for (let i = tipped.length - 1; i >= 0; i--) if (!tipped[i].root.parent) upright(tipped[i]);
        tipped.push(cave);
      }
      const parts = cave.parts;
      parts.legL.rotation.x = parts.legR.rotation.x = -Math.PI / 2;
      parts.armL.rotation.x = parts.armR.rotation.x = -0.75;
      posed(cave, seats[k]);
      cave.hammockRest = true;
      return true;
    };
    const dispose = () => {
      for (const seat of seats) seat.sitter = null;
      while (tipped.length) upright(tipped[0]);
      solids.remove(ridgeNode);
      removeChild(root, ridgeNode); removeChild(root, bedNode);
    };
    return { plan: p, seats, ridgeNode, bedNode, update, kick, restingAt, settle, free, near, poseRemote, dispose, get angle() { return angle; }, get amp() { return amp; } };
  };

  BL.hubHammock = { SLOTS, TIE, HEADROOM, SPAN_MIN, SPAN_MAX, SWAY_MAX, STAND, plan, create, ridgeY };
})();
