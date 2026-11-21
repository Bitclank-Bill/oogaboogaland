// The Ember Den's seating rule: which chair a remote player's sent position is, and which remote each chair is
// honoured for. It reads a seat's occupancy, `bot`, `name` and `id` and a remote's `id`, `display`, `zone`, `body` and
// position, nothing else, and it allocates nothing, so the scene can run it every frame.
(() => {
  "use strict";
  const BL = window.BL;
  // A seated Ooga's root stands at `pokerModels.sitY(height)`, so the soles it sends (root less its leg, 7/16 of its
  // height) sit at 0.47 - 0.2825 height: 0.176 at the middle height 1.04, 0.24 to 0.10 over the roster's 0.8 to 1.3.
  // CHAIR_Y is about that middle, and BAND takes every height from 0.67 to 1.38 while staying clear of the floor
  // (CHAIR_Y > BAND), where everyone walks; nothing walks at a chair's spot, inside the table's walk block. Copied, not
  // read, so this loads bare.
  const CHAIR_Y = 0.18, RADIUS = 0.5, BAND = 0.1, R2 = RADIUS * RADIUS;
  // `table * seats.length + seat` for a position on a chair's spot at chair height, or -1.
  const seatAt = (tables, seats, x, y, z) => {
    if (Math.abs(y - CHAIR_Y) > BAND) return -1;
    for (let t = 0; t < tables.length; t++) {
      const tx = x - tables[t].x, tz = z - tables[t].z;
      for (let s = 0; s < seats.length; s++) {
        const dx = tx - seats[s].x, dz = tz - seats[s].z;
        if (dx * dx + dz * dz <= R2) return t * seats.length + s;
      }
    }
    return -1;
  };
  // `input.remotes` is walked with `forEach` (the room's Map, or an array), never an iterator, through the one
  // `consider` made here, which reads the call's input and owner from these two while `resolve` runs.
  let cur = null, into = null;
  const consider = (rec) => {
    if (rec.zone !== cur.zone || !rec.body) return;
    const k = seatAt(cur.tables, cur.seats, rec.x, rec.y, rec.z);
    if (k < 0) return;
    const n = cur.seats.length, seat = cur.seatOf((k / n) | 0, k % n);
    // Live, only a human seat that is not the visitor's and carries the remote's name (a name that is empty or missing
    // never matches); practising, only a chair this page has empty.
    if (cur.live ? !seat || seat.bot || seat.id === cur.heroId || !rec.display || seat.name !== rec.display : seat) return;
    if (!into[k] || rec.id < into[k].id) into[k] = rec;
  };
  const resolve = (input, owner) => {
    for (let i = 0; i < owner.length; i++) owner[i] = null;
    cur = input; into = owner;
    input.remotes.forEach(consider);
    cur = into = null;
    return owner;
  };
  // 0 standing (at no chair), 1 seated (the chair's owner), 2 hidden (at a chair someone else owns).
  const stateOf = (tables, seats, owner, remote) => {
    const k = seatAt(tables, seats, remote.x, remote.y, remote.z);
    return k < 0 ? 0 : owner[k] === remote ? 1 : 2;
  };
  BL.pokerPresence = Object.freeze({ CHAIR_Y, RADIUS, BAND, seatAt, resolve, stateOf });
})();
