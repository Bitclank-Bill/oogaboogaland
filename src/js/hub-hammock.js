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
  // Where an Ooga stands up: OUT from the ridgeline's line, past the bed's edge, its swing and the widest Ooga.
  const OUT = 1.25;
  // The swing: the bed's angle about the ridgeline is `amp` sin(OMEGA t), `amp` easing toward REST (or REST_HELD with
  // anyone in it) at DECAY a second and never past SWAY_MAX; a sitter's landing and a shaken palm add KICK.
  const OMEGA = 2.1, REST = 0.012, REST_HELD = 0.035, DECAY = 0.35, KICK = 0.06, SWAY_MAX = 0.11;
  // The swing's widest reach across the ridgeline at the bed, kept clear of the path with the bed; the shell is
  // ENVELOPE_LOW to ENVELOPE_HIGH over the ground.
  const SWAY_REACH = 0.18, ENVELOPE_LOW = 0.3, ENVELOPE_HIGH = 1.05;
  // The suspension past each end of the bed, out to its drop line, kept clear with it.
  const END_CLEAR = 0.1, RING_OUT = 0.28, DROP_OUT = 0.32;
  // A resting Ooga as another page sends it: within REST_NEAR of a seat across, its feet REST_LOW to REST_HIGH over
  // the ground. No walker reaches a seat's place across (the bed's shell is in the way), and REST_HIGH stays under the
  // shell's top, so one standing on the bed or flying over is not resting.
  const REST_NEAR = 0.4, REST_LOW = 0.05, REST_HIGH = 0.9;
  // A sitter leans back LEAN into the cloth.
  const LEAN = -0.16;
  const ROPE = "#c9a36a", CORD = "#7a5a32";
  const WEAVE = ["#b48a52", "#9c7443", "#b48a52", "#c25d3a", "#d7a95a", "#c25d3a"].map(hexToRgb), WEAVE_UNDER = hexToRgb("#6e5233");

  // The ridgeline's height t of the way from a to b.
  const ridgeY = (p, t) => p.ay + (p.by - p.ay) * t - Math.sin(Math.PI * t) * RIDGE_SAG;
  // The cloth's height under the pivot at x along the bed and z across it, before any swing.
  const clothY = (p, x, z) => p.endY - Math.sin(Math.PI * (x / BED_LEN + 0.5)) * BED_SAG - Math.cos(Math.PI * z / BED_W) * CRADLE;

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
    const half = BED_LEN / 2 + END_CLEAR, across = BED_W / 2 + SWAY_REACH, t0 = (BED_LEN / 2 + TRUNK_CLEAR) / span;
    const fits = (t) => {
      const cx = a.x + dx * t, cz = a.z + dz * t, ground = surfaceAt(cx, cz);
      for (let i = -2; i <= 2; i++) for (let j = -1; j <= 1; j++) {
        const x = cx + ux * half * i / 2 + nx * across * j, z = cz + uz * half * i / 2 + nz * across * j;
        if (!clear(x, z, 0.3) || Math.abs(surfaceAt(x, z) - ground) > 0.2) return false;
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
    p.t = tc;
    p.x = a.x + dx * tc; p.z = a.z + dz * tc; p.ground = surfaceAt(p.x, p.z);
    p.y = ridgeY(p, tc);
    p.endY = p.ground + END_Y - p.y;
    // Seats face out to the side whose places to stand are all clear, the side away from the path when both are.
    let side = 0;
    for (const s of [1, -1]) {
      let ok = true;
      for (const at of SEAT_AT) {
        const x = p.x + ux * at + nx * s * OUT, z = p.z + uz * at + nz * s * OUT;
        if (!clear(x, z, 0.35) || Math.abs(surfaceAt(x, z) - p.ground) > 0.25) { ok = false; break; }
      }
      if (ok) { side = s; break; }
    }
    if (!side) return null;
    p.side = side;
    p.yaw = Math.atan2(-uz, ux);
    p.seatRy = Math.atan2(nx * side, nz * side);
    p.seats = SEAT_AT.map((at) => {
      const wx = p.x + ux * at + nx * side * OUT, wz = p.z + uz * at + nz * side * OUT;
      return { at, y: clothY(p, at, 0) + SEAT_LIFT, walkAt: { x: wx, z: wz }, floor: surfaceAt(wx, wz) };
    });
    return p;
  };

  // The bed in the pivot's frame (+x along the ridgeline, +z across to the seats' side when `side` is 1, y up from the
  // ridgeline): woven cloth cradled between two bamboo spreaders, cords from each spreader's ends to a ring and a drop
  // line from the ring up to where the ridgeline passes, and a cord along each edge.
  const bedGeometry = (p) => {
    const M = BL.models, J = BL.hubModels, NX = 14, NZ = 4, cloth = M.geometry(), v = cloth.verts, ids = [];
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
      round.push(J.bamboo(x, y, -BED_W / 2 - 0.1, x, y, BED_W / 2 + 0.1, 0.035, "#cdb06a"));
    }
    return J.withJungle(M.shaded(round, [cloth]), (g) => {
      for (const e of ends) {
        const x = e * BED_LEN / 2, top = ridgeY(p, p.t + e * (BED_LEN / 2 + DROP_OUT) / p.span) - p.y, ring = [x + e * RING_OUT, p.endY + 0.42, 0];
        for (const z of [-BED_W / 2 - 0.06, -BED_W / 4, BED_W / 4, BED_W / 2 + 0.06]) J.liana(g, [[x, p.endY + 0.03, z], ring], 0.011, 0.011, ROPE);
        J.liana(g, [ring, [x + e * DROP_OUT, top - 0.02, 0]], 0.022, 0.018, ROPE);
        J.liana(g, [[x + e * DROP_OUT, top - 0.06, 0], [x + e * DROP_OUT, top + 0.05, 0]], 0.05, 0.05, CORD);
      }
      for (const z of [-BED_W / 2, BED_W / 2]) {
        const edge = [];
        for (let i = 0; i <= NX; i += 2) { const x = (i / NX - 0.5) * BED_LEN; edge.push([x, clothY(p, x, z) + 0.012, z]); }
        J.liana(g, edge, 0.016, 0.016, CORD);
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
    // Its collision is the bed's whole swing, a closed box turned with the ridgeline: walkers go round the bed and
    // stand clear of it, and the ridgeline itself, overhead, blocks nothing.
    const half = BED_LEN / 2 + END_CLEAR, across = BED_W / 2 + SWAY_REACH, lo = p.ground + ENVELOPE_LOW - my, hi = p.ground + ENVELOPE_HIGH - my;
    const cx = p.x - mx, cz = p.z - mz, shell = M.geometry();
    for (const y of [lo, hi]) for (const [i, j] of [[-1, -1], [1, -1], [1, 1], [-1, 1]])
      shell.verts.push(cx + p.ux * half * i + p.nx * across * j, y, cz + p.uz * half * i + p.nz * across * j);
    for (const f of [[0, 1, 2, 3], [7, 6, 5, 4], [0, 4, 5, 1], [1, 5, 6, 2], [2, 6, 7, 3], [3, 7, 4, 0]]) shell.faces.push({ i: f, color: WEAVE_UNDER, emissive: 0 });
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
    // Another page's resting Ooga, posed in this bed; `cave.hammockRest` marks one this has tipped, to set upright.
    const poseRemote = (cave, feet) => {
      const r = cave.root, k = restingAt(r.position.x, feet, r.position.z);
      if (k < 0) {
        if (cave.hammockRest) { r.rotation.x = 0; cave.hammockRest = false; }
        return false;
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
      solids.remove(ridgeNode);
      removeChild(root, ridgeNode); removeChild(root, bedNode);
    };
    return { plan: p, seats, ridgeNode, bedNode, update, kick, restingAt, settle, free, near, poseRemote, dispose, get angle() { return angle; }, get amp() { return amp; } };
  };

  BL.hubHammock = { SLOTS, TIE, HEADROOM, SPAN_MIN, SPAN_MAX, SWAY_MAX, OUT, plan, create, ridgeY };
})();
