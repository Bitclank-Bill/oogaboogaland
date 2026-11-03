// Three bounded tables; the authenticated first seat simulates. No scores or currency are trusted here.
// Hibernation attachments preserve sessions; no storage.put, interval, SFU or new service.
import "../../src/js/hockey-wire.js";
const W = globalThis.BL.hockeyWire;
export const hockey = {
  restore(room) {
    room.hockeyTables = [null, null, null];
    for (const p of room.players.values()) {
      const s = p.hockey;
      if (s && s.ids[0] === p.id && s.i >= 0 && s.i < 3) room.hockeyTables[s.i] = s;
    }
    hockey.sweep(room);
  },
  tell(room, s, to = null) {
    const msg = { t: "hockey", k: "table", i: s.i, s: s.s, ids: s.ids, ready: s.ready, phase: s.phase, q: s.q, a: s.a, now: Date.now() };
    if (to) room.send(to.ws, msg); else room.broadcastZone(W.ZONE, msg);
  },
  save(room, s) {
    const host = room.players.get(s.ids[0]);
    if (host) { host.hockey = s; host.ws.serializeAttachment(room.attachment(host)); }
  },
  clear(room, s) {
    const host = room.players.get(s.ids[0]);
    if (host) { host.hockey = null; host.ws.serializeAttachment(room.attachment(host)); }
    room.hockeyTables[s.i] = null;
    room.broadcastZone(W.ZONE, { t: "hockey", k: "table", i: s.i, s: s.s, ids: [], phase: "closed", now: Date.now() });
  },
  leave(room, id) {
    for (const s of room.hockeyTables || []) if (s && s.ids.includes(id)) hockey.clear(room, s);
  },
  sweep(room) {
    const now = Date.now();
    for (const s of room.hockeyTables || []) if (s && (now - (s.start || s.created) > 240000 || s.ids.some((id, side) => id && (!W.near(room.players.get(id), s.i) || now - s.seen[side] > W.IDLE_MS)))) hockey.clear(room, s);
  },
  arrive(room, p) {
    hockey.sweep(room);
    if (p.zone === W.ZONE) for (const s of room.hockeyTables) if (s) hockey.tell(room, s, p);
  },
  message(room, p, m) {
    const now = Date.now();
    // Releasing an owned seat must work even just after join + ready consumed the control burst.
    const leaving = room.hockeyTables[m.i];
    if (leaving && leaving.ids.includes(p.id) && (m.k === "leave" && leaving.s === m.s || m.k === "cancel" && leaving.phase === "lobby")) { hockey.clear(room, leaving); return; }
    // Separate control and traffic budgets; persisted with seat state across hibernation.
    const rate = m.k === "frame" ? 10 : m.k === "input" ? 20 : 2;
    const key = m.k === "frame" ? "frame" : m.k === "input" ? "input" : "control";
    const buckets = p.hockeyBuckets ||= {};
    const b = buckets[key] ||= { at: now, tokens: rate };
    b.tokens = Math.min(rate, b.tokens + Math.max(0, now - b.at) * rate / 1000); b.at = now;
    if (b.tokens < 1) return;
    b.tokens--;
    hockey.sweep(room);
    if (!W.eligible(p)) return;
    let s = room.hockeyTables[m.i];
    if (m.k === "watch") {
      if (s) hockey.tell(room, s, p);
      else room.send(p.ws, { t: "hockey", k: "table", i: m.i, ids: [], phase: "closed", now });
      return;
    }
    if (m.k === "join") {
      if (!W.near(p, m.i)) return;
      for (const other of room.hockeyTables) if (other && other.ids.includes(p.id)) { hockey.tell(room, other, p); return; }
      if (!s) {
        const bytes = new Uint8Array(8); crypto.getRandomValues(bytes);
        s = { created: now, i: m.i, s: Array.from(bytes, n => n.toString(16).padStart(2, "0")).join(""), ids: [p.id, 0], ready: [false, false], seen: [now, now], phase: "lobby", q: -1, inputQ: -1, a: null };
        room.hockeyTables[m.i] = s;
      } else if (s.phase === "lobby" && !s.ids[1]) { s.ids[1] = p.id; s.seen[1] = now; s.ready = [false, false]; }
      else { room.send(p.ws, { t: "hockey", k: "busy", i: m.i }); return; }
      hockey.save(room, s); hockey.tell(room, s); return;
    }
    const side = s ? s.ids.indexOf(p.id) : -1;
    if (!s || m.s !== s.s || side < 0 || !W.near(p, m.i)) return;
    s.seen[side] = now;
    if (m.k === "ready" && s.phase === "lobby") {
      s.ready[side] = true;
      if (s.ready[0] && (!s.ids[1] || s.ready[1])) { s.phase = "play"; s.start = now; }
      hockey.save(room, s); hockey.tell(room, s); return;
    }
    if (m.k === "frame" && side === 0 && s.phase === "play" && m.q > s.q) {
      // Scores only advance one goal at a time; elapsed sand never increases. The host remains a trust boundary.
      if (s.a && (m.a[8] < s.a[8] || m.a[9] < s.a[9] || m.a[8] + m.a[9] > s.a[8] + s.a[9] + 1 || m.a[10] > s.a[10])) return;
      s.q = m.q; s.a = m.a;
      if (!m.a[16]) s.phase = "done";
      hockey.save(room, s);
      room.broadcastZone(W.ZONE, { t: "hockey", k: "frame", i: s.i, s: s.s, q: s.q, a: s.a, now });
      if (s.phase === "done") hockey.tell(room, s);
      return;
    }
    if (m.k === "input" && side === 1 && s.phase === "play" && m.q > s.inputQ) {
      s.inputQ = m.q;
      room.send(room.players.get(s.ids[0]).ws, { t: "hockey", k: "input", i: s.i, s: s.s, q: m.q, x: m.x, hit: m.hit });
    }
    hockey.save(room, s);
  }
};
