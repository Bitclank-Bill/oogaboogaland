// The Genesis Voyage's stream: from the harbour, one stream runs through a chain of large caves, one per era in date
// order, joined by short tunnels. Banks run along both sides of the stream in every cave, so a visitor can step out
// anywhere and walk the cave; the boat stays in the stream. Pure data and geometry queries, no DOM, so Node can check
// them: where each cave, its banks and docks lie, which era a point is in, and keeping a boat in the stream
// (`collide`). scene-genesis.js builds and drives from it; genesis-boat.js moves the boat.
//
// Era names, years and boats follow docs/genesis-voyage/eras/ (branch gv/research, first-pass dossiers): the boat for
// each era is a type the dossier dates as available then, drawn as an original, unbranded model.
(() => {
  "use strict";
  const BL = window.BL = window.BL || {};

  // The stream runs down -z; its middle is LANE_X, lined up with the harbour's mouth.
  const MOUTH_Z = -9, LANE_X = 3.75, HALF = 3.5;
  const CHANNEL = { x0: LANE_X - HALF, x1: LANE_X + HALF };
  // Every cave is the same size, large enough to explore and to fly a jetpack in: wide banks from the stream to its
  // walls and a high roof. Low stone tunnels join them.
  const CAVE = { x0: -34, x1: 42, len: 72, height: 24 }, TUNNEL = 12, TUNNEL_HEIGHT = 4.6, BANK_TOP = 0.545, SIGN_H = 4.2;
  // `theme` colours a cave's rock, its banks and its lamps. `boat` is one of BOATS. Era 3 holds Fingerprints and Time,
  // moved out of the old cavern by ROOM_SHIFT onto its left bank.
  const ERAS = [
    { n: 0, id: "machines", name: "Machines That Count", years: "1956\u20131969", boat: "skiff", theme: { rock: "#4a4d4f", bank: "#6d6f6a", lamp: [1.15, 1.1, 0.95] } },
    { n: 1, id: "keys", name: "Networks and Keys", years: "1970\u20131979", boat: "runabout", theme: { rock: "#5a4430", bank: "#8a6a44", lamp: [1.3, 0.9, 0.5] } },
    { n: 2, id: "blind-money", name: "Trees and Blind Money", years: "1980\u20131989", boat: "runabout", theme: { rock: "#33284a", bank: "#4b3d68", lamp: [1.2, 0.55, 1.15] } },
    { n: 3, id: "timestamps", name: "Cypherpunks and Timestamps", years: "1990\u20131995", boat: "watercraft", room: "fingerprints", theme: { rock: "#24403f", bank: "#4a4038", lamp: [1.35, 1.05, 0.7] } },
    { n: 4, id: "work", name: "Work and Scarcity", years: "1996\u20131999", boat: "rib", theme: { rock: "#25344d", bank: "#3f5272", lamp: [0.7, 0.9, 1.35] } },
    { n: 5, id: "peers", name: "Peers and Reusable Work", years: "2000\u20132007", boat: "rib", theme: { rock: "#4f5459", bank: "#7c838a", lamp: [1.05, 1.1, 1.2] } },
    { n: 6, id: "whitepaper", name: "The Whitepaper", years: "31 October 2008", boat: "rib", theme: { rock: "#5c4a2c", bank: "#9a8456", lamp: [1.35, 1.15, 0.7] } },
    { n: 7, id: "genesis", name: "Genesis", years: "3\u201312 January 2009", boat: "rib", optional: true, theme: { rock: "#2a2522", bank: "#46403a", lamp: [1.4, 0.75, 0.3] } }
  ];
  // Boats per type: top speed and turn.
  const BOATS = {
    skiff: { name: "rowing skiff", top: 3.2, accel: 2.2, turn: 1.1 },
    runabout: { name: "outboard runabout", top: 6, accel: 3.4, turn: 1.25 },
    watercraft: { name: "personal watercraft", top: 8, accel: 5, turn: 1.6 },
    rib: { name: "rigid inflatable boat", top: 8.5, accel: 4.6, turn: 1.35 }
  };
  // Fingerprints and Time was laid out in the old cavern's coordinates; it moves by this much onto Era 3's left bank,
  // its boarding ramp's foot at the stream's edge.
  const ROOM_SHIFT = { x: 3.6, z: 0 };
  ERAS.forEach((e, i) => {
    e.z1 = MOUTH_Z - TUNNEL - i * (CAVE.len + TUNNEL); e.z0 = e.z1 - CAVE.len; e.z = (e.z0 + e.z1) / 2;
    e.cave = { x0: CAVE.x0, x1: CAVE.x1, z0: e.z0, z1: e.z1, height: CAVE.height };
    // The banks: left from the wall to the stream, right from the stream to the wall.
    e.banks = [{ side: -1, x0: CAVE.x0, x1: CHANNEL.x0, z0: e.z0, z1: e.z1 }, { side: 1, x0: CHANNEL.x1, x1: CAVE.x1, z0: e.z0, z1: e.z1 }];
    // Where the Tour stops and the boat counts as docked: by the left bank, halfway down the cave.
    e.dock = { x: CHANNEL.x0 + 1.4, z: e.z, facing: -Math.PI / 2 };
    // The era's big sign: on the far back wall over the way out, facing the boat as it comes in, readable down the
    // whole cave (its height in metres; scene-genesis.js paints it in the era's own signage style).
    e.sign = { x: LANE_X, y: TUNNEL_HEIGHT + 0.8 + SIGN_H / 2, z: e.z0 + 0.7, height: SIGN_H };
  });
  const ROOM_ERA = ERAS.findIndex((e) => e.room);
  // The room was centred on z -26.5; it lands in the middle of Era 3's cave.
  ROOM_SHIFT.z = ERAS[ROOM_ERA].z + 26.5;
  ERAS[ROOM_ERA].dock = { x: CHANNEL.x0 + 1.4, z: -26.1 + ROOM_SHIFT.z, facing: -Math.PI / 2 };

  const HARBOUR = { x0: -11.2, x1: 9.2, z0: MOUTH_Z, z1: 8.8, mouth: { x0: 0.5, x1: 7 }, start: { x: 3.4, z: 2.6, heading: Math.PI } };
  // Land and walls in the harbour as boxes a boat is pushed out of: the dock, the side and back walls, and the front
  // wall either side of the mouth. Past the mouth the stream's banks hold it in.
  const LAND = [{ x0: -6.8, x1: -1.6, z0: -2.2, z1: 7.4 },
    { x0: -16, x1: HARBOUR.x0, z0: MOUTH_Z - 0.6, z1: 12 }, { x0: HARBOUR.x1, x1: 16, z0: MOUTH_Z - 0.6, z1: 12 },
    { x0: -16, x1: 16, z0: HARBOUR.z1, z1: 12 },
    { x0: -16, x1: HARBOUR.mouth.x0, z0: MOUTH_Z - 0.6, z1: MOUTH_Z + 0.6 }, { x0: HARBOUR.mouth.x1, x1: 16, z0: MOUTH_Z - 0.6, z1: MOUTH_Z + 0.6 }];
  const END_Z = ERAS[ERAS.length - 1].z0;
  // The whole voyage's floor plan, for camera bounds.
  const SEA = { x0: CAVE.x0, x1: CAVE.x1, z0: END_Z, z1: MOUTH_Z };

  // Which era a point is in: -1 in the harbour, otherwise the cave it is in or the tunnel leading into it.
  const eraAt = (x, z) => {
    if (z > MOUTH_Z - 2) return -1;
    for (let i = 0; i < ERAS.length; i++) if (z > ERAS[i].z0) return i;
    return ERAS.length - 1;
  };

  // Pushes a circle of radius `r` at state.x, state.z out of the harbour's land and walls, and keeps it in the stream
  // past the mouth and before the last cave's end wall. Returns true on a hit, after which the caller damps the boat's
  // speed. Allocation-free.
  const collide = (state, r) => {
    let hit = false;
    for (let i = 0; i < LAND.length; i++) {
      const b = LAND[i];
      if (state.x > b.x0 - r && state.x < b.x1 + r && state.z > b.z0 - r && state.z < b.z1 + r) {
        const dl = state.x - (b.x0 - r), dr = (b.x1 + r) - state.x, db = state.z - (b.z0 - r), dt = (b.z1 + r) - state.z;
        const m = Math.min(dl, dr, db, dt);
        if (m === dl) state.x = b.x0 - r; else if (m === dr) state.x = b.x1 + r; else if (m === db) state.z = b.z0 - r; else state.z = b.z1 + r;
        hit = true;
      }
    }
    if (state.z < MOUTH_Z - 0.6) {
      if (state.x < CHANNEL.x0 + r) { state.x = CHANNEL.x0 + r; hit = true; }
      if (state.x > CHANNEL.x1 - r) { state.x = CHANNEL.x1 - r; hit = true; }
      if (state.z < END_Z + r) { state.z = END_Z + r; hit = true; }
    }
    return hit;
  };

  // The era whose dock is within `reach` of (x, z), or -1.
  const dockAt = (x, z, reach = 3.2) => {
    for (let i = 0; i < ERAS.length; i++) if (Math.hypot(x - ERAS[i].dock.x, z - ERAS[i].dock.z) < reach) return i;
    return -1;
  };

  // The Tour's course: out of the harbour, then down the stream from dock to dock. Returns { points, stops } where
  // stops[i] is the index of era i's dock in points.
  const tourCourse = () => {
    const points = [[HARBOUR.start.x, HARBOUR.start.z], [3.6, -4], [LANE_X, MOUTH_Z - 3]], stops = [];
    for (let i = 0; i < ERAS.length; i++) {
      const e = ERAS[i];
      points.push([LANE_X, e.dock.z + 8]);
      stops.push(points.length);
      points.push([e.dock.x, e.dock.z]);
      points.push([LANE_X, e.dock.z - 8]);
    }
    return { points, stops };
  };

  // --- Era exhibits: the banks as building plots -----------------------------------------------------------------
  // The lamps on each cave's banks: [x, fraction of the cave's length from its way in] (scene-genesis.js hangs them).
  const LAMPS = [[-14, 0.25], [22, 0.5], [-8, 0.8]];
  // A bank's own frame (docs/genesis-voyage/EXHIBIT-CONTRACT.md): u runs from the cave's way in (0) downstream to its
  // far wall (CAVE.len); v runs from the stream's edge (0) out to the cave wall (`width`). Exhibits stand at
  // u >= GATE and FRONT <= v <= width - WALL, no taller than MAX_H; the gateway (u < GATE) holds the era's pylons and
  // overview board, and the strip v < FRONT is the waterside walk, where the Steps toward Bitcoin trail runs (TRAIL_V).
  const BANK = { GATE: 10, FRONT: 1.5, WALL: 1.5, END: 2, MAX_H: 8, TRAIL_V: 0.9 };
  const bankFrame = (n, side) => {
    const e = ERAS[n], b = e.banks[side < 0 ? 0 : 1];
    return { era: n, side: side < 0 ? -1 : 1, edge: side < 0 ? CHANNEL.x0 : CHANNEL.x1, z1: e.z1, len: CAVE.len, width: b.x1 - b.x0 };
  };
  // A bank point (u, v) as a world point, written into `out` ({ x, z }).
  const bankToWorld = (f, u, v, out) => { out.x = f.edge + f.side * v; out.z = f.z1 - u; return out; };
  // The plots no exhibit may take, in world boxes with a reason: the gateway, the dock and its ramps by the middle of
  // each cave, the lamp posts, and on Era 3's left bank Fingerprints and Time's room.
  // The lamp posts in era n's cave, where its lights hang: each { x, z } and its box { x0, x1, y0, y1, z0, z1 }.
  const lampPosts = (n) => LAMPS.map(([x, f]) => {
    const bx = x < LANE_X ? Math.min(x, CHANNEL.x0 - 1.2) : Math.max(x, CHANNEL.x1 + 1.2), z = ERAS[n].z1 - f * CAVE.len;
    return { x: bx, z, x0: bx - 0.15, x1: bx + 0.15, y0: BANK_TOP, y1: BANK_TOP + 9.35, z0: z - 0.15, z1: z + 0.15 };
  });
  // The gateway's two pylons in era n's cave (scene-genesis.js builds them), as boxes like lampPosts'. They stand 9 m
  // from the stream's edge, past the overview board's far end, so neither hides the board from the boat.
  const pylons = (n) => [-1, 1].map((side) => {
    const p = bankToWorld(bankFrame(n, side), 3, 9, { x: 0, z: 0 });
    return { x: p.x, z: p.z, x0: p.x - 0.65, x1: p.x + 0.65, y0: BANK_TOP, y1: BANK_TOP + 5.4, z0: p.z - 0.65, z1: p.z + 0.65 };
  });
  const reservedZones = (n) => {
    const e = ERAS[n], out = [];
    for (const side of [-1, 1]) {
      const f = bankFrame(n, side), xa = f.edge, xb = f.edge + f.side * f.width;
      const x0 = Math.min(xa, xb), x1 = Math.max(xa, xb);
      out.push({ x0, x1, z0: e.z1 - BANK.GATE, z1: e.z1, why: "gateway" });
      const near = f.edge + f.side * 6;
      out.push({ x0: Math.min(xa, near), x1: Math.max(xa, near), z0: e.z - 4, z1: e.z + 4, why: "dock" });
    }
    for (const l of lampPosts(n)) out.push({ x0: l.x - 0.8, x1: l.x + 0.8, z0: l.z - 0.8, z1: l.z + 0.8, why: "lamp" });
    if (e.room) out.push({ x0: -12 + ROOM_SHIFT.x - 1.5, x1: CHANNEL.x0, z0: -34 + ROOM_SHIFT.z - 1.5, z1: -19 + ROOM_SHIFT.z + 1.5, why: "Fingerprints and Time" });
    return out;
  };

  // An era's overview board on its left bank's gateway (scene-genesis.js builds it): where it stands, its turn
  // (between the stream and the way in), the boxes walkers meet along its line (its lower edge is at head height),
  // and where a visitor uses it, 1.5 m in front of its face, clear of those boxes. Its post stands behind the board,
  // never through its face (a post at the board's own line hid its middle from the stream).
  const overviewSpot = (n) => {
    const f = bankFrame(n, -1), ry = Math.PI / 2 - 0.55, p = bankToWorld(f, 7, 6, { x: 0, z: 0 });
    const fx = Math.sin(ry), fz = Math.cos(ry), ax = Math.cos(ry), az = -Math.sin(ry);
    const boxes = [-1.2, 0, 1.2].map((k) => ({ x0: p.x + ax * k - 0.45, x1: p.x + ax * k + 0.45, z0: p.z + az * k - 0.45, z1: p.z + az * k + 0.45 }));
    return { x: p.x, z: p.z, ry, normal: { x: fx, z: fz }, axis: { x: ax, z: az }, boxes, at: { x: p.x + fx * 1.5, z: p.z + fz * 1.5 },
      post: { x: p.x - fx * 0.4, z: p.z - fz * 0.4, w: 0.3 } };
  };

  // --- Boarding --------------------------------------------------------------------------------------------------
  // Space boards the boat from anywhere within `reach` of it, measured flat (from a bank, a ramp, a jetpack over the
  // water): the Ooga is put straight onto its deck. Further off, the visitor can call the boat: it sails down the
  // stream to the edge of the bank the Ooga is on, `edge` metres out, level with the Ooga, inside the cave it stands in.
  // `call` is how near the stream's edge Space calls it (elsewhere Space stays a jump).
  const BOARD = { reach: 8, call: 3, edge: 1.4, speed: 9 };
  const canBoard = (ox, oz, bx, bz) => Math.hypot(ox - bx, oz - bz) <= BOARD.reach;
  // Whether (x, z) is on a bank within `call` of the stream's edge (the waterside walk), or on the harbour's dock.
  const byWater = (x, z) => z > MOUTH_Z ? x > -6.8 && x < -1.4 : (x < CHANNEL.x0 && x > CHANNEL.x0 - BOARD.call) || (x > CHANNEL.x1 && x < CHANNEL.x1 + BOARD.call);
  // Where a called boat comes to for an Ooga at (ox, oz), written into `out` ({ x, z }): alongside the harbour's dock,
  // or at the stream's edge on the Ooga's side, level with it and kept inside its cave.
  const callSpot = (ox, oz, out) => {
    const era = eraAt(ox, oz);
    if (era < 0) { out.x = -0.4; out.z = Math.max(-1.6, Math.min(6.4, oz)); return out; }
    const e = ERAS[era];
    out.x = ox < LANE_X ? CHANNEL.x0 + BOARD.edge : CHANNEL.x1 - BOARD.edge;
    out.z = Math.max(e.z0 + 3, Math.min(e.z1 - 3, oz));
    return out;
  };
  // Sails a boat `state` ({ x, z, heading, speed }) toward `to` ({ x, z }) by `dt` seconds at BOARD.speed, bow first:
  // straight along the stream, or through the harbour's mouth first when one end is in the harbour and the other past
  // it. Returns true once there.
  const sailToward = (state, to, dt) => {
    const cross = (state.z < MOUTH_Z) !== (to.z < MOUTH_Z), tx = cross ? LANE_X : to.x, tz = cross ? MOUTH_Z + (to.z < MOUTH_Z ? -1 : 1) : to.z;
    const dx = tx - state.x, dz = tz - state.z, d = Math.hypot(dx, dz), step = BOARD.speed * dt;
    state.speed = 0;
    if (d <= step) { state.x = tx; state.z = tz; return !cross; }
    state.heading = Math.atan2(dx, dz);
    state.x += dx / d * step; state.z += dz / d * step;
    return false;
  };

  // How high an Ooga may fly at (x, z): the harbour's roof, a cave's, or a tunnel's.
  const ceilingAt = (x, z) => {
    if (z > MOUTH_Z) return 6.6;
    for (let i = 0; i < ERAS.length; i++) if (z <= ERAS[i].z1 && z >= ERAS[i].z0) return CAVE.height - 0.6;
    return TUNNEL_HEIGHT - 0.4;
  };
  // view: { c: {x,y,z} the model's centre, size (its largest extent), toward: {x,z} the direction to stand back in,
  // ndc: {x,y}, frac (the stage's height as a share of the screen), fov (vertical, radians, as scene.js cameras keep
  // it), aspect, fill, pitch }. The camera stays within MAX_DIST of the model, so it never backs through a wall.
  // The workbench's framing (moved here from genesis-bench.js at the overhaul's interface freeze): where the camera
  // stands so a model's centre lands in the middle of the workbench's clear stage.
  const MAX_DIST = 14;
  const frame = (v, out) => {
    const tanV = Math.tan(v.fov / 2), tanH = tanV * v.aspect, fill = v.fill || 0.6, pitch = v.pitch === undefined ? 0.2 : v.pitch;
    const dist = Math.max(2.2, Math.min(MAX_DIST, v.size / (fill * v.frac * 2 * tanV)));
    const tl = Math.hypot(v.toward.x, v.toward.z) || 1, tx = v.toward.x / tl, tz = v.toward.z / tl;
    const ex = v.c.x + tx * dist * Math.cos(pitch), ey = v.c.y + dist * Math.sin(pitch), ez = v.c.z + tz * dist * Math.cos(pitch);
    // The camera's right and up (looking from the eye at the centre); shifting the target the other way moves the
    // model to the stage's place on screen.
    out.eye.x = ex; out.eye.y = ey; out.eye.z = ez;
    out.target.x = v.c.x; out.target.y = v.c.y; out.target.z = v.c.z;
    // Shift the target until the model's centre projects onto the stage's centre (a few passes; each is exact for
    // small turns, so the error shrinks fast). Right = forward x world up; up = right x forward.
    for (let pass = 0; pass < 6; pass++) {
      const fx = out.target.x - ex, fy = out.target.y - ey, fz = out.target.z - ez, fl = Math.hypot(fx, fy, fz), nx = fx / fl, ny = fy / fl, nz = fz / fl;
      const rl = Math.hypot(nz, nx) || 1, rx = -nz / rl, rz = nx / rl;
      const ux = -rz * ny, uy = rz * nx - rx * nz, uz = rx * ny;
      const dx = v.c.x - ex, dy = v.c.y - ey, dz = v.c.z - ez, depth = dx * nx + dy * ny + dz * nz;
      const px = (dx * rx + dz * rz) / depth / tanH, py = (dx * ux + dy * uy + dz * uz) / depth / tanV;
      const ex2 = v.ndc.x - px, ey2 = v.ndc.y - py;
      if (Math.abs(ex2) < 1e-4 && Math.abs(ey2) < 1e-4) break;
      out.target.x -= rx * ex2 * tanH * fl + ux * ey2 * tanV * fl; out.target.y -= uy * ey2 * tanV * fl; out.target.z -= rz * ex2 * tanH * fl + uz * ey2 * tanV * fl;
    }
    out.dist = dist;
    return out;
  };
  BL.genesisWorld = { frame, MAX_DIST, BOARD, canBoard, byWater, callSpot, sailToward, lampPosts, pylons, SIGN_H, LAMPS, BANK, bankFrame, bankToWorld, reservedZones, overviewSpot, ERAS, BOATS, HARBOUR, LAND, SEA, CAVE, CHANNEL, TUNNEL, TUNNEL_HEIGHT, BANK_TOP, ceilingAt, ROOM_SHIFT, ROOM_ERA, LANE_X, MOUTH_Z, END_Z, eraAt, collide, dockAt, tourCourse };
})();
