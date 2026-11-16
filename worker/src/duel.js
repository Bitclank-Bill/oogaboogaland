// Duels (duel-rules.js): the room's side. Challenges, the flag, both duelists' health and the outcome live here, in
// memory alone: a room that sleeps forgets its duels, and a duelist's next frame is answered `end` with reason `lost`.
// No timer or alarm: every deadline (a challenge's, the countdown, the flag's radius, the longest duel) is stamped and
// checked on the duelists' own frames and at the room's sweep.
import "../../src/js/voice-blend.js";
import "../../src/js/duel-rules.js";
const R = globalThis.BL.duelRules;

const take = (b, rate, burst, now) => {
  b.tokens = Math.min(burst, b.tokens + (now - b.at) * rate / 1000);
  b.at = now;
  if (b.tokens < 1) return false;
  b.tokens -= 1;
  return true;
};
const ooga = (p) => !!p && !!p.body && !p.body.startsWith("gorilla:");
const apart = (p, q) => Math.hypot(p.x - q.x, p.z - q.z);
const view = (d) => ({ t: "duel", op: "start", id: d.id, a: d.a, b: d.b, x: d.x, z: d.z, at: d.at, hp: d.hp.slice(), now: Date.now() });

export const duel = {
  FEATURE: R.FEATURE,
  parse: R.parse,
  init(room) {
    if (!room.duels) { room.duels = new Map(); room.duelInvites = new Map(); room.duelSerial = 0; }
  },
  of(room, p) { duel.init(room); return p.duelId ? room.duels.get(p.duelId) || null : null; },
  tell(room, p, msg) { room.send(p.ws, { t: "duel", ...msg }); },

  // The duels under way, to a page that just joined.
  welcome(room, p) {
    duel.init(room);
    if (room.duels.size) room.send(p.ws, { t: "duel", op: "list", duels: [...room.duels.values()].map(view) });
  },

  message(room, p, msg) {
    duel.init(room);
    const now = Date.now();
    if (msg.op === "hit") return duel.hit(room, p, msg.kind, now);
    if (msg.op === "forfeit") {
      const d = duel.of(room, p);
      if (!d) return duel.tell(room, p, { op: "end", id: 0, reason: "lost" });
      return duel.finish(room, d, d.a === p.id ? d.b : d.a, "forfeit");
    }
    if (!p.duelControl) p.duelControl = { tokens: R.CONTROL_BURST, at: now };
    const allowed = take(p.duelControl, R.CONTROL_HZ, R.CONTROL_BURST, now);
    if (msg.op === "cancel") return duel.withdraw(room, p, "cancelled");
    const q = room.players.get(msg.to);
    if (msg.op === "decline") {
      const inv = room.duelInvites.get(msg.to);
      if (inv && inv.to === p.id) {
        room.duelInvites.delete(msg.to);
        if (q) duel.tell(room, q, { op: "declined", from: p.id });
      }
      return;
    }
    const refuse = (reason) => duel.tell(room, p, { op: "refused", to: msg.to, reason });
    if (!allowed) return refuse("rate");
    if (!q || q === p) return refuse("offline");
    const why = duel.refusal(p, q);
    if (why) return refuse(why);
    if (msg.op === "accept") {
      const inv = room.duelInvites.get(q.id);
      if (!inv || inv.to !== p.id || inv.exp < now) return refuse("withdrawn");
      return duel.start(room, q, p, now);
    }
    // challenge: two who challenged each other are duelling.
    const back = room.duelInvites.get(q.id);
    if (back && back.to === p.id && back.exp >= now) return duel.start(room, q, p, now);
    duel.withdraw(room, p, "replaced");
    room.duelInvites.set(p.id, { to: q.id, exp: now + R.INVITE_MS });
    duel.tell(room, q, { op: "challenged", from: p.id, exp: R.INVITE_MS });
    duel.tell(room, p, { op: "challenging", to: q.id, exp: R.INVITE_MS });
  },

  // Why `p` and `q` cannot duel now, or "".
  refusal(p, q) {
    if (p.duelId || q.duelId) return "busy";
    if (p.cabinet || q.cabinet) return "busy";
    if (!ooga(p) || !ooga(q)) return "body";
    if (!R.zoneOk(p.zone) || !R.zoneOk(q.zone)) return "zone";
    if (apart(p, q) > R.CHALLENGE_RANGE) return "far";
    return "";
  },

  // Takes back `p`'s challenge, if any, telling the one it was to.
  withdraw(room, p, reason) {
    const inv = room.duelInvites.get(p.id);
    if (!inv) return;
    room.duelInvites.delete(p.id);
    const q = room.players.get(inv.to);
    if (q) duel.tell(room, q, { op: "withdrawn", from: p.id, reason });
  },

  start(room, a, b, now) {
    for (const [from, inv] of room.duelInvites) if (from === a.id || from === b.id || inv.to === a.id || inv.to === b.id) room.duelInvites.delete(from);
    const d = { id: ++room.duelSerial, a: a.id, b: b.id, x: Math.round((a.x + b.x) * 50) / 100, z: Math.round((a.z + b.z) * 50) / 100,
      at: now + R.COUNTDOWN_MS, hp: [R.HP, R.HP], out: [0, 0], hits: [{ tokens: R.HIT_BURST, at: now }, { tokens: R.HIT_BURST, at: now }] };
    room.duels.set(d.id, d);
    a.duelId = b.duelId = d.id;
    room.broadcast(view(d));
  },

  hit(room, p, kind, now) {
    const d = duel.of(room, p);
    if (!d) return duel.tell(room, p, { op: "end", id: 0, reason: "lost" });
    if (duel.expired(room, d, now) || now < d.at) return;
    const side = d.a === p.id ? 0 : 1, q = room.players.get(side ? d.a : d.b);
    if (!q) return duel.finish(room, d, p.id, "left");
    if (!take(d.hits[side], R.HIT_HZ, R.HIT_BURST, now)) return;
    if (apart(p, q) > R.RANGE[kind] || Math.abs(p.y - q.y) > R.RANGE[kind]) return;
    const other = 1 - side;
    d.hp[other] = Math.max(0, d.hp[other] - R.DAMAGE[kind]);
    room.broadcast({ t: "duel", op: "hp", id: d.id, hp: d.hp.slice(), by: p.id, kind });
    if (!d.hp[other]) duel.finish(room, d, p.id, "defeat");
  },

  // A duel past its longest is a draw; true when it ended.
  expired(room, d, now) {
    if (now < d.at + R.MAX_MS) return false;
    duel.finish(room, d, 0, "draw");
    return true;
  },

  // A duelist's pose: past the flag's radius OUT_MS on end, they flee and lose.
  pose(room, p) {
    const d = duel.of(room, p);
    if (!d) return;
    const now = Date.now();
    if (duel.expired(room, d, now)) return;
    duel.bounds(room, d, p, now);
  },
  bounds(room, d, p, now) {
    const side = d.a === p.id ? 0 : 1;
    if (Math.hypot(p.x - d.x, p.z - d.z) <= R.RADIUS) { d.out[side] = 0; return; }
    if (!d.out[side]) d.out[side] = now;
    else if (now - d.out[side] >= R.OUT_MS) duel.finish(room, d, side ? d.a : d.b, "fled");
  },

  // `winner` 0 for a draw.
  finish(room, d, winner, reason) {
    if (!room.duels.delete(d.id)) return;
    for (const id of [d.a, d.b]) { const p = room.players.get(id); if (p && p.duelId === d.id) p.duelId = 0; }
    room.broadcast({ t: "duel", op: "end", id: d.id, winner, loser: winner ? (winner === d.a ? d.b : d.a) : 0, reason });
  },

  // A player gone, or whose body or zone no longer allows a duel: their challenges go and their duel is lost.
  leave(room, p) {
    duel.init(room);
    duel.withdraw(room, p, "left");
    for (const [from, inv] of room.duelInvites) if (inv.to === p.id) {
      room.duelInvites.delete(from);
      const q = room.players.get(from);
      if (q) duel.tell(room, q, { op: "declined", from: p.id, reason: "left" });
    }
    const d = duel.of(room, p);
    if (d) duel.finish(room, d, d.a === p.id ? d.b : d.a, "left");
  },
  // After a zone or body change.
  check(room, p) {
    if ((p.duelId || room.duelInvites?.has(p.id)) && (!ooga(p) || !R.zoneOk(p.zone))) duel.leave(room, p);
  },

  sweep(room) {
    if (!room.duels) return;
    const now = Date.now();
    for (const [from, inv] of room.duelInvites) if (inv.exp < now) room.duelInvites.delete(from);
    for (const d of [...room.duels.values()]) {
      if (duel.expired(room, d, now)) continue;
      const a = room.players.get(d.a), b = room.players.get(d.b);
      if (!a || !b) { duel.finish(room, d, a ? d.a : b ? d.b : 0, "left"); continue; }
      duel.bounds(room, d, a, now);
      if (room.duels.has(d.id)) duel.bounds(room, d, b, now);
    }
  },
};
