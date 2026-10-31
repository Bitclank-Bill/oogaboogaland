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
  const CAVE = { x0: -34, x1: 42, len: 72, height: 24 }, TUNNEL = 12, TUNNEL_HEIGHT = 4.6, BANK_TOP = 0.545;
  // `theme` colours a cave's rock, its banks and its lamps. `boat` is one of BOATS. Era 3 holds Fingerprints and Time,
  // moved out of the old cavern by ROOM_SHIFT onto its left bank.
  const ERAS = [
    { n: 0, id: "machines", name: "Machines That Count", years: "1956–1969", boat: "skiff", theme: { rock: "#4a4d4f", bank: "#6d6f6a", lamp: [1.15, 1.1, 0.95] } },
    { n: 1, id: "keys", name: "Networks and Keys", years: "1970–1979", boat: "runabout", theme: { rock: "#5a4430", bank: "#8a6a44", lamp: [1.3, 0.9, 0.5] } },
    { n: 2, id: "blind-money", name: "Trees and Blind Money", years: "1980–1989", boat: "runabout", theme: { rock: "#33284a", bank: "#4b3d68", lamp: [1.2, 0.55, 1.15] } },
    { n: 3, id: "timestamps", name: "Cypherpunks and Timestamps", years: "1990–1995", boat: "watercraft", room: "fingerprints", theme: { rock: "#24403f", bank: "#4a4038", lamp: [1.35, 1.05, 0.7] } },
    { n: 4, id: "work", name: "Work and Scarcity", years: "1996–1999", boat: "rib", theme: { rock: "#25344d", bank: "#3f5272", lamp: [0.7, 0.9, 1.35] } },
    { n: 5, id: "peers", name: "Peers and Reusable Work", years: "2000–2007", boat: "rib", theme: { rock: "#4f5459", bank: "#7c838a", lamp: [1.05, 1.1, 1.2] } },
    { n: 6, id: "whitepaper", name: "The Whitepaper", years: "31 October 2008", boat: "rib", theme: { rock: "#5c4a2c", bank: "#9a8456", lamp: [1.35, 1.15, 0.7] } },
    { n: 7, id: "genesis", name: "Genesis", years: "3–12 January 2009", boat: "rib", optional: true, theme: { rock: "#2a2522", bank: "#46403a", lamp: [1.4, 0.75, 0.3] } }
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
    // The years hang over the stream just inside the cave, facing the boat as it comes in.
    e.sign = { x: LANE_X, y: 8, z: e.z1 - 10 };
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

  // How high an Ooga may fly at (x, z): the harbour's roof, a cave's, or a tunnel's.
  const ceilingAt = (x, z) => {
    if (z > MOUTH_Z) return 6.6;
    for (let i = 0; i < ERAS.length; i++) if (z <= ERAS[i].z1 && z >= ERAS[i].z0) return CAVE.height - 0.6;
    return TUNNEL_HEIGHT - 0.4;
  };
  BL.genesisWorld = { ERAS, BOATS, HARBOUR, LAND, SEA, CAVE, CHANNEL, TUNNEL, TUNNEL_HEIGHT, BANK_TOP, ceilingAt, ROOM_SHIFT, ROOM_ERA, LANE_X, MOUTH_Z, END_Z, eraAt, collide, dockAt, tourCourse };
})();
