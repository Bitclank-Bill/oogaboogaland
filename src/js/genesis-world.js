// The Genesis Voyage's sea: the harbour, then one island per era in date order down a wide lane of open water. Pure
// data and geometry queries, no DOM, so Node can check them: where each island and its dock lie, which era a point is
// in, and pushing a boat out of land (`collide`). scene-genesis.js builds and drives from it; genesis-boat.js moves
// the boat.
//
// Era names, years and boats follow docs/genesis-voyage/eras/ (branch gv/research, first-pass dossiers): the boat
// for each era is a type the dossier dates as available then, drawn as an original, unbranded model.
(() => {
  "use strict";
  const BL = window.BL = window.BL || {};

  // The lane runs down -z from the harbour's mouth; islands sit either side of it, docks on the lane side.
  const LANE_X = 0, MOUTH_Z = -9;
  // `side` +1 puts an island right of the lane (+x), -1 left. `years` is the dossier's era span as shown on its sign.
  // `boat` is one of BOATS. Era 3 holds the Fingerprints and Time room, moved out of the old cavern by ROOM_SHIFT.
  const ERAS = [
    { n: 0, id: "machines", name: "Machines That Count", years: "1956–1969", z: -42, side: 1, boat: "skiff" },
    { n: 1, id: "keys", name: "Networks and Keys", years: "1970–1979", z: -78, side: -1, boat: "runabout" },
    { n: 2, id: "blind-money", name: "Trees and Blind Money", years: "1980–1989", z: -114, side: 1, boat: "runabout" },
    { n: 3, id: "timestamps", name: "Cypherpunks and Timestamps", years: "1990–1995", z: -150, side: -1, boat: "watercraft", room: "fingerprints" },
    { n: 4, id: "work", name: "Work and Scarcity", years: "1996–1999", z: -190, side: 1, boat: "rib" },
    { n: 5, id: "peers", name: "Peers and Reusable Work", years: "2000–2007", z: -226, side: -1, boat: "rib" },
    { n: 6, id: "whitepaper", name: "The Whitepaper", years: "31 October 2008", z: -262, side: 1, boat: "rib" },
    { n: 7, id: "genesis", name: "Genesis", years: "3–12 January 2009", z: -298, side: -1, boat: "rib", optional: true }
  ];
  // Boats per type: top speed and turn, and what the dossiers date for the type (shown in the panel later).
  const BOATS = {
    skiff: { name: "rowing skiff", top: 3.2, accel: 2.2, turn: 1.1 },
    runabout: { name: "outboard runabout", top: 6, accel: 3.4, turn: 1.25 },
    watercraft: { name: "personal watercraft", top: 8, accel: 5, turn: 1.6 },
    rib: { name: "rigid inflatable boat", top: 8.5, accel: 4.6, turn: 1.35 }
  };
  const ISLAND_X = 17, ISLAND_R = 8.5;
  // The Fingerprints and Time room is built in the old cavern's coordinates and moved by this much; its ledge, desk
  // and ramp then stand on Era 3's island with the ramp's foot at the lane.
  const ROOM_SHIFT = { x: 0, z: -123.5 };
  for (const e of ERAS) {
    if (e.room) {
      // The room's ledge (x -12..-3.4, z -34..-19 before the shift) sits on a long island; its dock is the ramp's foot.
      e.island = { x: -9.6, z: e.z, rx: 6.4, rz: 9.6 };
      e.dock = { x: -1.9, z: -26.1 + ROOM_SHIFT.z, facing: Math.PI / 2 };
    } else {
      const cx = e.side * ISLAND_X;
      e.island = { x: cx, z: e.z, rx: ISLAND_R, rz: ISLAND_R };
      e.dock = { x: cx - e.side * (ISLAND_R + 1.6), z: e.z, facing: e.side > 0 ? -Math.PI / 2 : Math.PI / 2 };
    }
    // The year sign stands on the island's lane-side shore, facing the lane.
    // Downstream of the dock, so it reads on the approach and never stands between a landed Ooga and its camera.
    e.sign = { x: e.island.x - e.side * (e.island.rx - 1.4), z: e.z + (e.room ? 6 : -4.5), facing: e.side > 0 ? -Math.PI / 2 : Math.PI / 2 };
  }

  // The harbour: a cavern whose front wall opens onto the lane, with the dock and the statue as land.
  const HARBOUR = { x0: -11.2, x1: 9.2, z0: MOUTH_Z, z1: 8.8, mouth: { x0: 0.5, x1: 7 }, start: { x: 3.4, z: 2.6, heading: Math.PI } };
  // Land and walls as boxes a boat is pushed out of: the dock, the harbour's side and back walls, and its front wall
  // either side of the mouth.
  const LAND = [{ x0: -6.8, x1: -1.6, z0: -2.2, z1: 7.4 },
    { x0: -16, x1: HARBOUR.x0, z0: MOUTH_Z - 0.6, z1: 12 }, { x0: HARBOUR.x1, x1: 16, z0: MOUTH_Z - 0.6, z1: 12 },
    { x0: -16, x1: 16, z0: HARBOUR.z1, z1: 12 },
    { x0: -16, x1: HARBOUR.mouth.x0, z0: MOUTH_Z - 0.6, z1: MOUTH_Z + 0.6 }, { x0: HARBOUR.mouth.x1, x1: 16, z0: MOUTH_Z - 0.6, z1: MOUTH_Z + 0.6 }];
  const SEA = { x0: -44, x1: 44, z0: -322, z1: MOUTH_Z };

  // Which era a point is in: -1 in the harbour, otherwise the island whose stretch of the lane holds z.
  const eraAt = (x, z) => {
    if (z > MOUTH_Z - 2) return -1;
    for (let i = 0; i < ERAS.length - 1; i++) if (z > (ERAS[i].z + ERAS[i + 1].z) / 2) return i;
    return ERAS.length - 1;
  };

  // Pushes a circle of radius `r` at state.x, state.z out of land, walls and the edge of the sea. Returns true on a
  // hit, after which the caller damps the boat's speed. Allocation-free.
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
    for (let i = 0; i < ERAS.length; i++) {
      const s = ERAS[i].island, dx = state.x - s.x, dz = state.z - s.z, ex = s.rx + r, ez = s.rz + r;
      const n = (dx * dx) / (ex * ex) + (dz * dz) / (ez * ez);
      if (n >= 1) continue;
      const k = 1 / Math.sqrt(Math.max(n, 1e-6));
      state.x = s.x + dx * k; state.z = s.z + dz * k;
      if (n < 1e-6) state.x = s.x - ERAS[i].side * ex;
      hit = true;
    }
    if (state.z <= MOUTH_Z) {
      if (state.x < SEA.x0 + r) { state.x = SEA.x0 + r; hit = true; }
      if (state.x > SEA.x1 - r) { state.x = SEA.x1 - r; hit = true; }
      if (state.z < SEA.z0 + r) { state.z = SEA.z0 + r; hit = true; }
    }
    return hit;
  };

  // The era whose dock is within `reach` of (x, z), or -1.
  const dockAt = (x, z, reach = 3.2) => {
    for (let i = 0; i < ERAS.length; i++) if (Math.hypot(x - ERAS[i].dock.x, z - ERAS[i].dock.z) < reach) return i;
    return -1;
  };

  // The Tour's course: out of the harbour, then dock to dock down the lane, through the lane between them.
  // Returns { points, stops } where stops[i] is the index of era i's dock in points.
  const tourCourse = () => {
    const points = [[HARBOUR.start.x, HARBOUR.start.z], [3.6, -4], [3.6, MOUTH_Z - 3]], stops = [];
    for (let i = 0; i < ERAS.length; i++) {
      const e = ERAS[i];
      points.push([LANE_X - e.side * 1.5, e.z + 9]);
      stops.push(points.length);
      points.push([e.dock.x, e.dock.z]);
      points.push([LANE_X + e.side * 1.5, e.z - 9]);
    }
    return { points, stops };
  };

  BL.genesisWorld = { ERAS, BOATS, HARBOUR, LAND, SEA, ROOM_SHIFT, LANE_X, MOUTH_Z, eraAt, collide, dockAt, tourCourse };
})();
