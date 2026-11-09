import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import * as protocol from "../src/protocol.js";
import { sha256Hex } from "../src/crypto.js";
import { getPlayer } from "../src/db.js";
import * as studioPolicy from "../src/studio-policy.js";
const harness = t => {
  t.mock.timers.enable({ apis: ["Date"], now: Date.now() });
  let initialized;
  const writes = [];
  const accepted = [];
  const socket = () => ({
    sent: [], bins: [], closed: null, store: null,
    send(text) { if (typeof text === "string") this.sent.push(JSON.parse(text)); else this.bins.push(text); },
    close(code, reason) { this.closed = { code, reason }; },
    serializeAttachment(value) { this.store = JSON.parse(JSON.stringify(value)); },
    deserializeAttachment() { return this.store; },
  });
  class WebSocketPair { constructor() { this[0] = socket(); this[1] = socket(); } }
  class Response { constructor(body, init = {}) { this.body = body; this.status = init.status; this.webSocket = init.webSocket; } }
  const source = readFileSync(new URL("../src/room.js", import.meta.url), "utf8")
    .replace(/import\s+[\s\S]*?from\s+"[^"]+";/g, "")
    .replace("export class Room", "class Room") + "\nglobalThis.Room = Room;";
  const context = {
    ...protocol, ...studioPolicy, sha256Hex, getPlayer, sfuClient: () => null,
    CAST_ROWS: ["a","b","c","d",...Array.from({length:70},(_,i)=>"ooga"+i)].map(login=>({handle:login,github_login:login})),
    DurableObject: class { constructor(ctx, env) { this.ctx = ctx; this.env = env; } },
    WebSocketPair, Response, WebSocketRequestResponsePair: class {}, URL, crypto, Date, Map, Set, setTimeout, clearTimeout, console, ArrayBuffer, DataView,
  };
  runInNewContext(source, context);
  const stored = new Map();
  const ctx = {
    setWebSocketAutoResponse() {}, blockConcurrencyWhile: (fn) => (initialized = fn()), acceptWebSocket: (ws) => accepted.push(ws),
    getWebSockets: () => accepted.filter((ws) => !ws.closed), getWebSocketAutoResponseTimestamp: () => null,
    storage: { get: async (key) => structuredClone(Array.isArray(key) ? new Map(key.filter((k) => stored.has(k)).map((k) => [k, stored.get(k)])) : stored.get(key)), put: async (key, value) => { const copy=structuredClone(value); writes.push({key,value:copy}); stored.set(key,copy); }, getAlarm: async () => null, setAlarm: async () => {} },
  };
  const h = { ctx, stored, writes, advance:ms=>t.mock.timers.tick(ms) };
  h.room = new context.Room(ctx, {});
  const join = async (id, login) => {
    await initialized;
    const before = accepted.length;
    await h.room.fetch({ url: "https://island.invalid/room", headers: new Headers({ upgrade: "websocket", "x-player-id": String(id), "x-player-login": login, "x-player-contributor": "0" }) });
    return accepted[before];
  };
  const send = (ws, msg) => h.room.webSocketMessage(ws, JSON.stringify(msg.t === "bf" ? { v: 1, ...msg } : msg));
  h.join=join;h.send=send;h.wake=async()=>{if(h.room.flushTimer)clearTimeout(h.room.flushTimer);h.room=new context.Room(ctx,{});await initialized;return h.room;};
  return h;
};
const W = protocol.BLOCK;
const bf = ws => ws.sent.filter(m => m.t === "bf");
const last = ws => bf(ws).at(-1);
const enter = async (h, id, login = "ooga" + id) => {
  const ws = await h.join(id, login);
  h.send(ws, { t: "body", name: login }); h.send(ws, { t: "zone", name: W.ZONE });
  h.room.players.get(id).visible = true;
  return { id, ws, p: h.room.players.get(id) };
};
const send = (h, a, k, extra = {}) => { if (a.p.blockBuckets) a.p.blockBuckets.control = { tokens: 12, at: Date.now() }; h.send(a.ws, { t: "bf", k, ...extra }); };
const crowd = async (h, n) => { const list = []; for (let i = 1; i <= n; i++) list.push(await enter(h, i)); return list; };
const startRound = (h, list) => { for (const a of list) send(h, a, "reg"); for (const a of list) send(h, a, "ready", { r: 1 }); const m = h.room.blockMatch; if (m.phase === "countdown") { h.advance(W.COUNTDOWN_MS); send(h, list[0], "go", { s: m.s }); } return h.room.blockMatch; };
const frame = (m, q = 1, size = 64) => { const b = new ArrayBuffer(size), v = new DataView(b); v.setUint32(0, W.MAGIC, true); v.setUint32(4, m.tag, true); v.setUint32(8, m.epoch, true); v.setUint32(12, q, true); return b; };

test("the page and the Worker share one cap of four a side", () => {
  assert.equal(W.MAX_SIDE, 4); assert.equal(W.MAX_PLAYERS, 8);
  const base = { t: "bf", v: 1, k: "opt", n: 4, m: 0 };
  assert.ok(protocol.parseClientMessage(JSON.stringify(base)));
  for (const n of [0, 5, 1.5, "2", null]) assert.equal(protocol.parseClientMessage(JSON.stringify({ ...base, n })), null, String(n));
  for (const m of [-1, W.MAPS.length, null]) assert.equal(protocol.parseClientMessage(JSON.stringify({ ...base, m })), null);
  assert.equal(W.sizeFor(1, 8), 4); assert.equal(W.sizeFor(1, 3), 2); assert.equal(W.sizeFor(4, 1), 4); assert.equal(W.sizeFor(1, 1), 1);
});
test("the input message is bounded and its widest form fits the room's frame limit", () => {
  const input = { t: "bf", v: 1, k: "input", s: "0123456789abcdef", q: 2147483647, x: -1000, z: -1000, f: -7000, b: 15, a: Array(4).fill([14, -7000, -2000, 7]).flat() };
  assert.ok(protocol.parseClientMessage(JSON.stringify(input)));
  assert.ok(JSON.stringify(input).length <= protocol.MESSAGE_MAX);
  for (const patch of [{ x: 1001 }, { b: 16 }, { q: -1 }, { s: "x" }, { f: 7001 }, { a: [] }, { a: [1, 0, 0] }, { a: [99, 0, 0, 0] }, { a: Array(20).fill(0) }, { v: 2 }]) assert.equal(protocol.parseClientMessage(JSON.stringify({ ...input, ...patch })), null, JSON.stringify(patch));
});
test("random teams are as even as can be, and every empty seat is an NPC", () => {
  const rand = (seed => () => (seed = seed * 16807 % 2147483647) / 2147483647)(7);
  for (const [n, size] of [[1, 1], [2, 1], [3, 2], [4, 2], [5, 3], [8, 4], [2, 4]]) {
    const ids = Array.from({ length: n }, (_, i) => i + 1);
    for (let round = 0; round < 40; round++) {
      const seats = W.split(ids, size, rand), a = seats.slice(0, size).filter(Boolean).length, b = seats.slice(size).filter(Boolean).length;
      assert.equal(seats.length, size * 2); assert.equal(a + b, n); assert.ok(Math.abs(a - b) <= 1, `${n}: ${a}-${b}`);
      assert.deepEqual(seats.filter(Boolean).sort((x, y) => x - y), ids);
    }
  }
});
test("a round starts only when everyone registered is ready, and alone at once", async t => {
  const h = harness(t), [a, b, c] = await crowd(h, 3);
  send(h, a, "reg"); send(h, a, "ready", { r: 1 });
  assert.equal(h.room.blockMatch.phase, "play", "alone it starts at once");
  assert.deepEqual([...h.room.blockMatch.seats].filter(Boolean), [1]); assert.equal(h.room.blockMatch.host, 1);
  send(h, a, "over", { s: h.room.blockMatch.s, w: 0 });
  assert.equal(h.room.blockMatch.phase, "lobby"); assert.deepEqual([...h.room.blockMatch.reg], [1]); assert.deepEqual([...h.room.blockMatch.ready], [0]);
  send(h, b, "reg"); send(h, c, "reg");
  send(h, a, "ready", { r: 1 }); send(h, b, "ready", { r: 1 });
  assert.equal(h.room.blockMatch.phase, "lobby", "c is not ready");
  send(h, c, "ready", { r: 1 });
  const m = h.room.blockMatch;
  assert.equal(m.phase, "countdown"); assert.equal(m.size, 2); assert.equal(m.seats.filter(Boolean).length, 3);
  send(h, a, "go", { s: m.s }); assert.equal(m.phase, "countdown", "not before the countdown ends");
  send(h, b, "ready", { r: 0 }); assert.equal(m.phase, "lobby", "taking ready back stops it"); assert.deepEqual([...m.seats], []);
  send(h, b, "ready", { r: 1 }); assert.equal(m.phase, "countdown");
  h.advance(W.COUNTDOWN_MS); send(h, c, "go", { s: m.s });
  assert.equal(m.phase, "play");
  assert.ok(m.host > 0); assert.ok(m.seats.includes(m.host));
});
test("only the first registered picks the map and size, and the size grows to seat everyone", async t => {
  const h = harness(t), [a, b, c] = await crowd(h, 3);
  send(h, a, "reg"); send(h, b, "reg"); send(h, c, "reg");
  send(h, b, "opt", { n: 4, m: 3 }); assert.equal(h.room.blockMatch.size, 2); assert.equal(h.room.blockMatch.map, 0);
  send(h, a, "opt", { n: 1, m: 2 }); assert.equal(h.room.blockMatch.size, 1); assert.equal(h.room.blockMatch.map, 2);
  for (const x of [a, b, c]) send(h, x, "ready", { r: 1 });
  assert.equal(h.room.blockMatch.size, 2, "three players need two a side");
});
test("the first leaves and the next registered picks", async t => {
  const h = harness(t), [a, b] = await crowd(h, 2);
  send(h, a, "reg"); send(h, b, "reg"); send(h, a, "unreg");
  assert.deepEqual([...h.room.blockMatch.reg], [2]);
  send(h, b, "opt", { n: 3, m: 1 }); assert.equal(h.room.blockMatch.size, 3);
});
test("registration stops at eight", async t => {
  const h = harness(t), list = await crowd(h, 9);
  for (const a of list) send(h, a, "reg");
  assert.equal(h.room.blockMatch.reg.length, W.MAX_PLAYERS);
  assert.ok(!h.room.blockMatch.reg.includes(9));
});
test("visitors outside the area or without an Ooga are refused", async t => {
  const h = harness(t), ws = await h.join(1, "a");
  h.send(ws, { t: "bf", k: "reg" });
  assert.equal(h.room.blockMatch, null, "out of the area");
  h.send(ws, { t: "zone", name: W.ZONE }); h.send(ws, { t: "bf", k: "reg" });
  assert.equal(h.room.blockMatch, null, "no Ooga, no registration");
});
test("late arrivals watch: they get no seat, their inputs go nowhere, and they can sign up for the next round", async t => {
  const h = harness(t), [a, b, late] = await crowd(h, 3);
  const m = startRound(h, [a, b]);
  assert.equal(m.phase, "play");
  const host = m.host === a.id ? a : b, guest = m.host === a.id ? b : a;
  assert.ok(W.watching(m, late.id)); assert.ok(!W.canEnter(m, late.id)); assert.ok(W.canEnter(m, guest.id));
  host.ws.sent.length = 0;
  h.send(late.ws, { t: "bf", k: "input", s: m.s, q: 1, x: 0, z: 0, f: 0, b: 0 });
  assert.equal(bf(host.ws).length, 0, "a watcher cannot drive");
  send(h, late, "reg");
  assert.deepEqual([...m.reg], [late.id]); assert.equal(W.seatOf(m, late.id), -1, "no seat in the round under way");
  assert.equal(m.phase, "play");
  send(h, host, "over", { s: m.s, w: 1 });
  assert.equal(h.room.blockMatch.reg[0], late.id, "deck waiters come first");
  assert.equal(h.room.blockMatch.reg.length, 3); assert.equal(h.room.blockMatch.phase, "lobby");
});
test("the seat a player leaves goes to an NPC, the host hands over, and the last one out ends the round", async t => {
  const h = harness(t), list = await crowd(h, 3), m = startRound(h, list);
  const host = list.find(x => x.id === m.host), rest = list.filter(x => x !== host), epoch = m.epoch;
  const seat = W.seatOf(m, rest[0].id);
  h.send(rest[0].ws, { t: "zone", name: "outside" });
  assert.equal(m.seats[seat], 0); assert.equal(m.phase, "play"); assert.equal(m.host, host.id);
  h.send(host.ws, { t: "zone", name: "outside" });
  assert.equal(m.host, rest[1].id); assert.equal(m.epoch, epoch + 1); assert.equal(m.q, -1);
  assert.equal(last(rest[1].ws).host, rest[1].id);
  h.send(rest[1].ws, { t: "zone", name: "outside" });
  assert.equal(h.room.blockMatch, null);
});
test("frames come only from the host, in order, for this round, and reach guests and the deck alone", async t => {
  const h = harness(t), [a, b, late] = await crowd(h, 3), m = startRound(h, [a, b]);
  const away = await h.join(9, "ooga9"); h.send(away, { t: "body", name: "ooga9" }); h.send(away, { t: "zone", name: "outside" });
  const host = m.host === a.id ? a : b, guest = m.host === a.id ? b : a, n = () => guest.ws.bins.length;
  h.room.webSocketMessage(host.ws, frame(m, 1));
  assert.equal(n(), 1); assert.equal(late.ws.bins.length, 1); assert.equal(away.bins.length, 0); assert.equal(host.ws.bins.length, 0);
  h.room.webSocketMessage(host.ws, frame(m, 1)); assert.equal(n(), 1, "a replay");
  h.room.webSocketMessage(guest.ws, frame(m, 2)); assert.equal(n(), 1, "not from a guest");
  h.room.webSocketMessage(host.ws, frame({ tag: m.tag + 1, epoch: m.epoch }, 3)); assert.equal(n(), 1, "another round");
  h.room.webSocketMessage(host.ws, frame({ tag: m.tag, epoch: m.epoch + 1 }, 3)); assert.equal(n(), 1, "another host");
  h.room.webSocketMessage(host.ws, frame(m, 4, W.FRAME_MAX + 1)); assert.equal(n(), 1, "too big");
  h.room.webSocketMessage(host.ws, frame(m, 5, W.FRAME_MAX)); assert.equal(n(), 2);
});
test("rate limits hold input, frames and control to their budgets", async t => {
  const h = harness(t), [a, b] = await crowd(h, 2), m = startRound(h, [a, b]);
  const host = m.host === a.id ? a : b, guest = m.host === a.id ? b : a;
  host.ws.sent.length = 0;
  for (let q = 1; q <= 100; q++) h.send(guest.ws, { t: "bf", k: "input", s: m.s, q, x: 0, z: 0, f: 0, b: 0 });
  assert.equal(bf(host.ws).filter(x => x.k === "input").length, W.INPUT_HZ + 4);
  for (let q = 1; q <= 100; q++) h.room.webSocketMessage(host.ws, frame(m, q));
  assert.equal(guest.ws.bins.length, W.FRAME_HZ + 2);
  h.advance(1000);
  h.room.webSocketMessage(host.ws, frame(m, 200));
  assert.equal(guest.ws.bins.length, W.FRAME_HZ + 3, "the bucket refills");
});
test("an input reaches the host alone, marked with the sender's seat from the room's own record", async t => {
  const h = harness(t), [a, b] = await crowd(h, 2), m = startRound(h, [a, b]);
  const host = m.host === a.id ? a : b, guest = m.host === a.id ? b : a;
  host.ws.sent.length = 0; guest.ws.sent.length = 0;
  h.send(guest.ws, { t: "bf", k: "input", s: m.s, q: 7, x: 500, z: -500, f: 100, b: 1, a: [0, 100, 200, 1], from: 0 });
  const got = bf(host.ws)[0];
  assert.equal(got.from, W.seatOf(m, guest.id)); assert.deepEqual([...got.a], [0, 100, 200, 1]);
  assert.equal(bf(guest.ws).length, 0);
});
test("a silent player is swept and a page that goes quiet loses its seat", async t => {
  const h = harness(t), [a, b] = await crowd(h, 2);
  send(h, a, "reg"); send(h, b, "reg");
  h.advance(W.IDLE_MS - 1000); send(h, a, "beat");
  h.advance(2000); send(h, a, "beat");
  assert.deepEqual([...h.room.blockMatch.reg], [1], "b went quiet");
});
test("the registry survives hibernation in one attachment under the socket limit, with no storage writes", async t => {
  const h = harness(t), list = await crowd(h, 8), m = startRound(h, list);
  assert.equal(m.phase, "play");
  const host = list.find(x => x.id === m.host);
  assert.ok(JSON.stringify(host.ws.store).length <= 2048, String(JSON.stringify(host.ws.store).length));
  assert.equal(h.writes.filter(w => /block/i.test(String(w.key))).length, 0);
  const seats = [...m.seats], s = m.s;
  await h.wake();
  const again = h.room.blockMatch;
  assert.equal(again.s, s); assert.equal(again.phase, "play"); assert.deepEqual([...again.seats], seats); assert.equal(again.host, host.id);
});
test("a new page hears the current match on arrival; an older page is never told of the feature it lacks", async t => {
  const h = harness(t), [a] = await crowd(h, 1);
  send(h, a, "reg");
  const b = await enter(h, 2);
  assert.equal(last(b.ws).phase, "lobby"); assert.deepEqual([...last(b.ws).reg], [1]);
  assert.ok(b.ws.sent.find(m => m.t === "welcome").features.includes(W.FEATURE));
});
test("traffic through the Worker with eight live players, simulated over ten seconds", async t => {
  const h = harness(t), list = await crowd(h, 8), m = startRound(h, list);
  assert.equal(m.phase, "play");
  const host = list.find(x => x.id === m.host), guests = list.filter(x => x !== host);
  const out0 = () => list.reduce((n, x) => n + x.ws.sent.length + x.ws.bins.length, 0), base = out0();
  let framesIn = 0, inputsIn = 0, beats = 0;
  for (let ms = 0; ms < 10000; ms += 50) {
    h.advance(50);
    for (const g of guests) { h.send(g.ws, { t: "bf", k: "input", s: m.s, q: ms / 50 + 1, x: 0, z: 0, f: 0, b: 0 }); inputsIn++; }
    if (ms % 100 === 0) { h.room.webSocketMessage(host.ws, frame(m, ms / 100 + 1, 900)); framesIn++; }
    if (ms % 2000 === 0) for (const x of list) { h.send(x.ws, { t: "bf", k: "beat" }); beats++; }
  }
  const seconds = 10, framesOut = guests.reduce((n, g) => n + g.ws.bins.length, 0), inputsOut = bf(host.ws).filter(x => x.k === "input").length, total = out0() - base;
  t.diagnostic(`simulated 8 players, 10 s: IN frames ${framesIn / seconds}/s, inputs ${inputsIn / seconds}/s, beats ${beats / seconds}/s; OUT frames ${framesOut / seconds}/s, inputs relayed ${inputsOut / seconds}/s, total out ${total / seconds}/s`);
  assert.equal(framesOut, 7 * framesIn, "each frame reaches the seven guests");
  assert.equal(inputsOut, inputsIn, "every input reaches the host alone");
});
