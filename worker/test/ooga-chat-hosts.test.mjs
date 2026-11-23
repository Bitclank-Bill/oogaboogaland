// Hosted chats (docs/ooga-chat-hosts.md) through their objects on a fake host: starting one in the directory, a chat's
// socket (protocol 2), a request answered, an invite taken up, a host's mute, removal, co-hosts' limits, the host's hold
// and succession, the end, one voice an account across chats, and the bridge reaching only a live chat.
import { test } from "node:test";
import assert from "node:assert/strict";
import "./cloudflare-host.mjs";

const NodeResponse = globalThis.Response;
globalThis.Response = class extends NodeResponse {
  constructor(body, init = {}) {
    if (init && init.status === 101) { super(null, { status: 200 }); Object.defineProperty(this, "status", { value: 101 }); this.webSocket = init.webSocket; }
    else super(body, init);
  }
};
const socket = () => ({
  sent: [], readyState: 1, attachment: null, closed: null,
  send(text) { this.sent.push(JSON.parse(text)); },
  close(code, reason) { this.readyState = 3; this.closed = { code, reason }; },
  serializeAttachment(value) { this.attachment = value === null ? null : structuredClone(value); },
  deserializeAttachment() { return this.attachment; },
  accept() {},
});
// Closing the server's half closes the page's, as the runtime does, so a refusal's code reaches the check.
globalThis.WebSocketPair = class { constructor() { const client = socket(), server = socket(); const close = server.close; server.close = (code, reason) => { close.call(server, code, reason); client.close(code, reason); }; this[0] = client; this[1] = server; } };
globalThis.WebSocketRequestResponsePair = class {};

const { Audience, CHAT_PROTOCOL, chatName } = await import("../src/audience.js");
const { ChatDirectory, startChat, chatTitle, CHATS_MAX, START_GAP_MS } = await import("../src/chat-directory.js");
const { HOST_HOLD_MS, INVITE_MS } = await import("../src/chat-roles.js");
const { bridgeFetch } = await import("../src/chat-bridge.js");
const { BRIDGE_VERSION } = await import("../src/chat-bridge-protocol.js");

let now = 1_000_000;
const realNow = Date.now;
Date.now = () => now;

const fakeCtx = () => {
  const storage = new Map(), sockets = [], tasks = [];
  let alarm = null;
  return {
    storage: { get: async (key) => structuredClone(storage.get(key)),
      put: async (key, value) => { if (typeof key === "object") for (const [k, v] of Object.entries(key)) storage.set(k, structuredClone(v)); else storage.set(key, structuredClone(value)); },
      delete: async (key) => Array.isArray(key) ? key.filter((k) => storage.delete(k)).length : storage.delete(key),
      list: async ({ prefix }) => new Map([...storage].filter(([key]) => key.startsWith(prefix)).map(([key, value]) => [key, structuredClone(value)])),
      getAlarm: async () => alarm, setAlarm: async (at) => { alarm = at; } },
    setWebSocketAutoResponse() {}, waitUntil: (task) => tasks.push(task),
    blockConcurrencyWhile(fn) { this.ready = fn(); return this.ready; },
    acceptWebSocket: (ws, tags) => { ws.tags = tags; sockets.push(ws); },
    getWebSockets: () => sockets.filter((ws) => ws.readyState <= 2),
    tasks, get alarm() { return alarm; },
  };
};

// One world: a directory and as many chat objects as are asked for, wired to each other by name.
const world = async () => {
  const objects = new Map();
  const env = { OOGA_CHAT_FEATURES: "bridge,chats", ENVIRONMENT: "staging" };
  const dirCtx = fakeCtx();
  const directory = new ChatDirectory(dirCtx, env);
  await dirCtx.ready;
  env.CHATS = { getByName: () => directory };
  env.AUDIENCE = { getByName: (name) => {
    if (!objects.has(name)) {
      const ctx = fakeCtx();
      const a = new Audience(ctx, env);
      a.contributorFor = Object.assign(async (login) => (["amy", "bea"].includes(login) ? { handle: login } : null), { fresh: () => true });
      // As the runtime holds every call until the constructor's blockConcurrencyWhile has finished.
      const held = new Proxy(a, { get: (t, k) => typeof t[k] === "function" ? async (...args) => { await ctx.ready; return t[k](...args); } : t[k] });
      objects.set(name, { a, ctx, held });
    }
    return objects.get(name).held;
  } };
  const settle = async () => { for (const { ctx } of objects.values()) { await ctx.ready; while (ctx.tasks.length) await ctx.tasks.shift(); } };
  return { env, directory, objects, settle };
};

const who = (n, extra = {}) => ({ principal: `pr_${String(n).padStart(22, "a")}`, provider: n >= 9 ? "x" : "github", providerUserId: String(n),
  login: ["", "amy", "bea", "cyd", "dot"][n] || `p${n}`, display: `P${n}`, avatar: null, eligible: n <= 2, sessionExpiresAt: now + 3600000, ...extra });
const idOf = (n) => `${n >= 9 ? "x" : "gh"}:${n}`;
const host = (n) => ({ id: idOf(n), login: who(n).login, display: who(n).display, character: null });

const connect = async (w, chat, n) => {
  const a = w.env.AUDIENCE.getByName(chatName(chat));
  await w.objects.get(chatName(chat)).ctx.ready;
  const before = new Set(a.sockets.keys());
  const res = await a.fetch(new Request(`https://audience.invalid/connect?chat=${chat}`, { headers: { upgrade: "websocket", "x-audience-principal": JSON.stringify(who(n)) } }));
  const connId = [...a.sockets.keys()].find((k) => !before.has(k));
  const ws = connId ? a.sockets.get(connId) : res.webSocket;
  if (connId) await a.webSocketMessage(ws, JSON.stringify({ type: "join", protocol: CHAT_PROTOCOL }));
  return { a, ws, connId };
};
let rid = 1;
const ask = async (p, msg) => { const requestId = rid++; await p.a.webSocketMessage(p.ws, JSON.stringify({ requestId, ...msg })); return p.ws.sent.find((m) => m.type === "result" && m.requestId === requestId); };
const notices = (p, kind) => p.ws.sent.filter((m) => m.type === "notice" && m.kind === kind);
const you = (p) => p.ws.sent.filter((m) => m.you).at(-1).you;
const rowOf = (p, id) => {
  let rows = new Map();
  for (const m of p.ws.sent) {
    if (m.type === "snapshot") rows = new Map(m.participants.map((r) => [r.id, r]));
    if (m.type === "delta") { for (const r of m.remove) rows.delete(r.id); for (const r of m.upsert) rows.set(r.id, r); }
  }
  return rows.get(id);
};

test("a title through the island's chat policy, at most 60 characters", () => {
  assert.equal(chatTitle("  Lightning dev call  "), "Lightning dev call");
  assert.equal(chatTitle(""), null);
  assert.equal(chatTitle("a‮b"), null, "no bidi overrides");
  assert.equal(chatTitle("x".repeat(61)), null);
  assert.equal(chatTitle(42), null);
});

test("the directory: one chat a host, a start every five minutes, at most twenty, listed busiest first", async () => {
  const w = await world();
  const first = await startChat(w.env, host(1), { title: "Amy's", zone: "main" });
  assert.equal(first.ok, true);
  assert.equal((await startChat(w.env, host(1), { title: "Again", zone: "dsb" })).code, "already_hosting");
  assert.equal((await startChat(w.env, host(2), { title: "", zone: "main" })).code, "bad_title");
  assert.equal((await startChat(w.env, host(2), { title: "Ok", zone: "moon" })).code, "zone_unavailable");
  await w.directory.end(first.chat.id);
  const soon = await startChat(w.env, host(1), { title: "Again", zone: "dsb" });
  assert.equal(soon.code, "rate_limited");
  assert.ok(soon.retryAfter > 0 && soon.retryAfter <= START_GAP_MS / 1000);
  now += START_GAP_MS;
  for (let i = 0; i < CHATS_MAX; i++) assert.equal((await startChat(w.env, host(100 + i), { title: `Chat ${i}`, zone: "main" })).ok, true);
  assert.equal((await startChat(w.env, host(1), { title: "One more", zone: "main" })).code, "chats_full");
  const list = w.directory.list();
  assert.equal(list.length, CHATS_MAX);
  assert.ok(list.every((c) => !("hostId" in c) && !("host" in c && "id" in c.host)), "no account ids in the list");
});

test("a chat: the host may speak, a listener asks, the host approves, the invite is taken up, and the queue empties", async () => {
  now += START_GAP_MS;
  const w = await world();
  const { chat } = await startChat(w.env, host(1), { title: "Dev call", zone: "main" });
  const amy = await connect(w, chat.id, 1);
  const snap = amy.ws.sent.find((m) => m.type === "snapshot");
  assert.deepEqual({ id: snap.chat.id, title: snap.chat.title, zone: snap.zone, host: snap.chat.host }, { id: chat.id, title: "Dev call", zone: "main", host: "gh:1" });
  assert.deepEqual([you(amy).rank, you(amy).speak], ["host", "eligible"]);
  assert.equal(rowOf(amy, "gh:1").rank, "host");
  const cyd = await connect(w, chat.id, 3);
  assert.deepEqual([you(cyd).rank, you(cyd).speak, you(cyd).request], ["", "none", ""], "joining is listening, not speaking");
  assert.equal((await ask(cyd, { type: "setRole", role: "speaker" })).error.code, "not_allowed");
  assert.equal((await ask(cyd, { type: "ask" })).ok, true);
  assert.deepEqual(notices(amy, "asked").map((n) => n.id), ["gh:3"]);
  assert.equal(rowOf(amy, "gh:3").request, "asked");
  assert.equal((await ask(cyd, { type: "invite", id: "gh:1" })).error.code, "not_host", "a listener manages nobody");
  assert.equal((await ask(amy, { type: "answer", id: "gh:3", approve: "yes" })).error.code, "malformed", "approve is a boolean");
  assert.equal((await ask(amy, { type: "answer", id: "gh:3", approve: true })).ok, true);
  assert.equal(notices(cyd, "invited").length, 1);
  assert.equal(notices(cyd, "invited")[0].until, now + INVITE_MS);
  assert.deepEqual([you(cyd).speak, you(cyd).request], ["eligible", "invited"]);
  const lease = await ask(cyd, { type: "setRole", role: "speaker" });
  assert.equal(lease.ok, true, "a non-contributor may speak once invited");
  assert.equal(lease.you.speak, "pending");
  await w.settle();
  assert.equal(rowOf(amy, "gh:3").request, undefined, "a speaker has no request");
  assert.equal(w.directory.voices.get("gh:3"), chat.id, "the account's voice is in this chat");
});

const speakerOn = async (w, chat, p) => {
  const c = p.a.model.conns.get(p.connId);
  p.a.model.activate(p.connId, c.lease.generation);
  p.a.model.setMic(p.connId, false);
  p.a.save(p.connId);
  await p.a.flush();
};

test("a host mutes a speaker: muted for everyone and not pulled until they unmute themselves; a co-host never touches the host", async () => {
  now += START_GAP_MS;
  const w = await world();
  const { chat } = await startChat(w.env, host(1), { title: "Mute", zone: "main" });
  const amy = await connect(w, chat.id, 1), bea = await connect(w, chat.id, 2), dot = await connect(w, chat.id, 4);
  assert.equal((await ask(amy, { type: "mute", id: "gh:2" })).error.code, "not_speaking");
  assert.equal((await ask(amy, { type: "cohost", id: "gh:2", on: true })).ok, true);
  assert.equal(you(bea).rank, "cohost");
  assert.equal(notices(bea, "cohost").length, 1);
  assert.equal((await ask(bea, { type: "remove", id: "gh:1" })).error.code, "not_allowed");
  assert.equal((await ask(bea, { type: "end" })).error.code, "not_host");
  assert.equal((await ask(bea, { type: "invite", id: "gh:4" })).ok, true, "a co-host invites");
  await ask(dot, { type: "setRole", role: "speaker" });
  await speakerOn(w, chat, dot);
  assert.equal(rowOf(amy, "gh:4").mic, "on");
  assert.equal((await ask(bea, { type: "mute", id: "gh:4" })).ok, true);
  assert.equal(rowOf(amy, "gh:4").mic, "muted");
  assert.equal(notices(dot, "muted").length, 1);
  const c = dot.a.model.conns.get(dot.connId);
  assert.equal(c.forced, true);
  assert.equal(dot.a.media.authorizedFor(dot.a.model.conns.get(amy.connId)).has("gh:4"), false, "a host-muted voice is not pulled");
  assert.equal((await ask(dot, { type: "setMic", muted: false })).ok, true, "only they unmute themselves");
  assert.equal(c.forced, false);
  assert.equal(rowOf(amy, "gh:4").mic, "on");
  assert.equal((await ask(bea, { type: "demote", id: "gh:4" })).ok, true);
  assert.equal(rowOf(amy, "gh:4").role, "listener");
  assert.equal(you(dot).speak, "none", "moved to listening, they must ask again");
});

test("removed from a chat: their sockets close, and they stay out until it ends", async () => {
  now += START_GAP_MS;
  const w = await world();
  const { chat } = await startChat(w.env, host(1), { title: "Remove", zone: "main" });
  const amy = await connect(w, chat.id, 1), zed = await connect(w, chat.id, 9);
  assert.equal(you(zed).speak, "none");
  assert.equal((await ask(amy, { type: "remove", id: "x:9" })).ok, true);
  assert.equal(notices(zed, "removed").length, 1);
  assert.equal(zed.ws.closed.code, 4403);
  assert.equal(rowOf(amy, "x:9"), undefined);
  const again = await connect(w, chat.id, 9);
  assert.equal(again.connId, undefined);
  assert.equal(again.ws.closed.code, 4403);
});

test("the host's hold: two minutes, then a co-host takes over; with none the chat ends for everyone and leaves the list", async () => {
  now += START_GAP_MS;
  const w = await world();
  const { chat } = await startChat(w.env, host(1), { title: "Hold", zone: "main" });
  const amy = await connect(w, chat.id, 1), bea = await connect(w, chat.id, 2);
  await ask(amy, { type: "cohost", id: "gh:2", on: true });
  const { a, ctx } = w.objects.get(chatName(chat.id));
  await a.webSocketClose(amy.ws);
  await w.settle();
  assert.equal(ctx.alarm, now + HOST_HOLD_MS, "the host's leaving sets the alarm itself");
  now += HOST_HOLD_MS;
  await a.alarm();
  assert.deepEqual(notices(bea, "host").map((n) => n.id), ["gh:2"]);
  assert.equal(you(bea).rank, "host");
  assert.equal(rowOf(bea, "gh:2").rank, "host");
  await a.webSocketClose(bea.ws);
  await w.settle();
  now += HOST_HOLD_MS;
  await a.alarm();
  await w.settle();
  assert.equal(w.directory.has(chat.id), false, "an ended chat leaves the list");
  const late = await connect(w, chat.id, 3);
  assert.equal(late.ws.closed.code, 4404);
});

test("End chat: everyone hears it, every socket closes, and the list forgets it", async () => {
  now += START_GAP_MS;
  const w = await world();
  const { chat } = await startChat(w.env, host(1), { title: "End", zone: "dsb" });
  const amy = await connect(w, chat.id, 1), cyd = await connect(w, chat.id, 3);
  assert.equal(cyd.ws.sent.find((m) => m.type === "snapshot").zone, "dsb", "a chat's zone is its own");
  await ask(amy, { type: "end" });
  assert.equal(notices(cyd, "ended").length, 1);
  assert.equal(cyd.ws.closed.code, 4404);
  assert.equal(amy.ws.closed.code, 4404);
  await w.settle();
  assert.equal(w.directory.has(chat.id), false);
});

test("one voice an account: taking the stage in a second chat ends the lease in the first", async () => {
  now += START_GAP_MS;
  const w = await world();
  const one = (await startChat(w.env, host(1), { title: "One", zone: "main" })).chat;
  const two = (await startChat(w.env, host(2), { title: "Two", zone: "main" })).chat;
  const amy = await connect(w, one.id, 1);
  await ask(amy, { type: "setRole", role: "speaker" });
  await w.settle();
  assert.equal(w.directory.voices.get("gh:1"), one.id);
  await connect(w, two.id, 2);
  const amyThere = await connect(w, two.id, 1);
  await ask(amyThere, { type: "ask" });
  const bea = { a: w.env.AUDIENCE.getByName(chatName(two.id)), ws: [...w.env.AUDIENCE.getByName(chatName(two.id)).sockets.values()][0] };
  await ask(bea, { type: "invite", id: "gh:1" });
  await ask(amyThere, { type: "setRole", role: "speaker" });
  await w.settle();
  assert.equal(w.directory.voices.get("gh:1"), two.id);
  assert.equal(amy.a.model.conns.get(amy.connId).lease, null, "the first chat's lease ended");
  assert.ok(amy.ws.sent.some((m) => m.type === "you" && m.reason === "moved"), "and says it moved");
});

test("the bridge reaches a chat only while the directory lists it", async () => {
  now += START_GAP_MS;
  const w = await world();
  const { chat } = await startChat(w.env, host(1), { title: "Bridge", zone: "main" });
  const p = who(1);
  const assertion = JSON.stringify({ v: BRIDGE_VERSION, env: "staging", principal: { id: p.principal, provider: "github", providerUserId: "1", login: "amy", display: "Amy" },
    eligible: true, sessionExpiresAt: now + 3600000 });
  const req = (id) => new Request("https://chat-bridge.invalid/audience", { headers: { upgrade: "websocket", "x-ooga-chat-assertion": assertion, "x-chat-id": id } });
  assert.equal((await bridgeFetch(w.env, req(chat.id))).status, 101);
  assert.equal((await bridgeFetch(w.env, req("AAAAAAAAAAAAAAAA"))).status, 404, "an unknown chat makes no object");
  assert.equal((await bridgeFetch(w.env, req("bad"))).status, 404);
  assert.equal((await bridgeFetch({ ...w.env, OOGA_CHAT_FEATURES: "bridge" }, req(chat.id))).status, 503, "chats switched off");
});



test("the island's call mark: a page says it is in a chat's voice, only as a boolean, and the room offers it only with chats on", async () => {
  const { parseClientMessage, callFeatures } = await import("../src/protocol.js");
  assert.deepEqual(parseClientMessage(JSON.stringify({ t: "call", on: true })), { t: "call", on: true });
  assert.equal(parseClientMessage(JSON.stringify({ t: "call", on: "yes" })), null);
  assert.deepEqual(callFeatures({ OOGA_CHAT_FEATURES: "chats" }), ["call-v1"]);
  assert.deepEqual(callFeatures({ OOGA_CHAT_FEATURES: "bridge" }), []);
});

test("a chat seats thirty-two speakers by default, none of whom needs one of the zone's eight cloud seats", async () => {
  now += START_GAP_MS;
  const w = await world();
  const { chat } = await startChat(w.env, host(1), { title: "Big stage", zone: "main" });
  const amy = await connect(w, chat.id, 1);
  assert.equal(amy.ws.sent.find((m) => m.type === "snapshot").limits.chatSpeakers, 32);
  const people = [amy];
  for (let n = 20; n < 31; n++) {
    const p = await connect(w, chat.id, n);
    await ask(amy, { type: "invite", id: idOf(n) });
    people.push(p);
  }
  await ask(amy, { type: "setRole", role: "speaker" });
  for (const p of people.slice(1)) await ask(p, { type: "setRole", role: "speaker" });
  for (const p of people) {
    const c = p.a.model.conns.get(p.connId);
    assert.equal(p.a.model.activate(p.connId, c.lease.generation).ok, true, "a ninth speaker and beyond still speaks");
    assert.equal(c.lease.seat, null, "no cloud seat over the real island");
  }
});

test("allow back: the removed list reaches hosts and co-hosts alone, and an allowed account joins again as a listener", async () => {
  now += START_GAP_MS;
  const w = await world();
  const { chat } = await startChat(w.env, host(1), { title: "Allow", zone: "main" });
  const amy = await connect(w, chat.id, 1), cyd = await connect(w, chat.id, 3), zed = await connect(w, chat.id, 9);
  await ask(amy, { type: "remove", id: "x:9" });
  const list = amy.ws.sent.filter((m) => m.type === "removed").at(-1).list;
  assert.deepEqual(list.map((r) => [r.id, r.login]), [["x:9", "p9"]]);
  assert.equal(cyd.ws.sent.some((m) => m.type === "removed"), false, "a listener never sees who was removed");
  assert.equal((await ask(cyd, { type: "allow", id: "x:9" })).error.code, "not_host");
  await ask(amy, { type: "cohost", id: "gh:3", on: true });
  assert.equal(cyd.ws.sent.filter((m) => m.type === "removed").at(-1).list.length, 1, "a new co-host is told who is removed");
  assert.equal((await ask(cyd, { type: "allow", id: "x:9" })).ok, true);
  assert.deepEqual(amy.ws.sent.filter((m) => m.type === "removed").at(-1).list, []);
  const back = await connect(w, chat.id, 9);
  assert.ok(back.connId, "allowed back in");
  assert.deepEqual([you(back).speak, you(back).request, rowOf(amy, "x:9").role], ["none", "", "listener"]);
  assert.equal(zed.ws.closed.code, 4403);
});

test("rows say how long each has held their place and which app they came from, so a roster can put the longest first", async () => {
  now += START_GAP_MS;
  const w = await world();
  const { chat } = await startChat(w.env, host(1), { title: "Order", zone: "main" });
  const amy = await connect(w, chat.id, 1);
  now += 1000;
  const cyd = await connect(w, chat.id, 3);
  now += 1000;
  await ask(amy, { type: "cohost", id: "gh:3", on: true });
  const a = w.env.AUDIENCE.getByName(chatName(chat.id));
  const islandIn = await a.fetch(new Request(`https://audience.invalid/connect?chat=${chat.id}`, { headers: { upgrade: "websocket",
    "x-audience-principal": JSON.stringify({ ...who(4), principal: "ob_4", avatar: null }) } }));
  assert.equal(islandIn.status, 101);
  const ws = [...a.sockets.values()].at(-1);
  await a.webSocketMessage(ws, JSON.stringify({ type: "join", protocol: CHAT_PROTOCOL }));
  const row = (id) => rowOf(amy, id);
  assert.ok(row("gh:1").since < row("gh:3").since, "joined earlier, listed earlier");
  assert.equal(row("gh:3").rankSince, now, "a co-host since they were made one");
  assert.deepEqual([row("gh:1").via, row("gh:4").via], ["app", "island"], "an island page's connection is the island's");
  await ask(amy, { type: "setRole", role: "speaker" });
  const c = amy.a.model.conns.get(amy.connId);
  now += 1000;
  amy.a.model.activate(amy.connId, c.lease.generation);
  await amy.a.flush();
  assert.equal(row("gh:1").since, now, "a speaker since they took the stage");
});



test("one voice an account with the island: a chat tells the island room when a GitHub account takes and leaves its stage", async () => {
  now += START_GAP_MS;
  const w = await world();
  const told = [];
  w.env.ROOM = { getByName: () => ({ chatVoice: async (id, chat, on) => { told.push([id, chat, on]); return { ok: true }; } }) };
  const { chat } = await startChat(w.env, host(1), { title: "Island", zone: "main" });
  const amy = await connect(w, chat.id, 1), zed = await connect(w, chat.id, 9);
  await ask(amy, { type: "setRole", role: "speaker" });
  await w.settle();
  assert.deepEqual(told, [[1, chat.id, true]], "the island hears the account took the stage");
  await ask(amy, { type: "invite", id: "x:9" });
  await ask(zed, { type: "setRole", role: "speaker" });
  await w.settle();
  assert.equal(told.length, 1, "an X account has no island voice to end");
  await ask(amy, { type: "setRole", role: "listener" });
  await w.settle();
  assert.deepEqual(told.at(-1), [1, chat.id, false], "and that it left it");
});



test("the island room: an account on a chat's stage leaves island voice, shows in a call everywhere, and taking voice back ends the chat's lease", async () => {
  const { readFileSync } = await import("node:fs");
  const { runInNewContext } = await import("node:vm");
  const protocol = await import("../src/protocol.js");
  const studio = await import("../src/studio-policy.js");
  const { getPlayer } = await import("../src/db.js");
  const source = readFileSync(new URL("../src/room.js", import.meta.url), "utf8").replace(/import\s+[\s\S]*?from\s+"[^"]+";/g, "")
    .replace("export class Room", "class Room") + "\nglobalThis.Room = Room;";
  const context = { ...protocol, ...studio, getPlayer, DurableObject: class {}, WebSocketRequestResponsePair: class {}, sfuClient: () => null, CAST_ROWS: [], Date, Map, Set, Response, Promise };
  runInNewContext(source, context);
  context.Room.prototype.inspect = protocol.inspectReporter(null, {}, "Room", () => "", () => null);
  context.Room.prototype.world = protocol.worldReporter(null, {}, () => null);
  context.Room.prototype.catalog = protocol.roomCatalog.create({}, [], protocol.castIndex);
  const room = Object.create(context.Room.prototype);
  const stored = new Map(), yielded = [];
  room.ctx = { storage: { put: async (k, v) => { stored.set(k, v); } }, waitUntil: (task) => task };
  room.env = { OOGA_CHAT_FEATURES: "chats", AUDIENCE: { getByName: (name) => ({ yieldVoice: async (id) => { yielded.push([name, id]); } }) } };
  room.sockets = new Map(); room.players = new Map(); room.chatBuckets = new Map(); room.pinTries = new Map(); room.chat = protocol.chatLog(); room.chatVoices = new Map();
  room.studio = studio.studioState(0);
  room.clearVoice = async (p) => { p.voice.track = null; p.voice.pub = null; };
  room.updateVoice = () => {};
  const join = (id) => {
    const ws = { sent: [], deserializeAttachment: () => ({ id }), serializeAttachment() {}, send: (text) => ws.sent.push(JSON.parse(text)) };
    const p = room.record(ws, { id, login: `p${id}`, display: `P${id}`, contributor: true, body: `p${id}`, x: 0, y: 0, z: 0, yaw: 0 });
    room.players.set(id, p);
    return { ws, p };
  };
  const amy = join(1), bea = join(2);
  amy.p.voice.track = "mic"; amy.p.voice.pub = "s1";
  assert.equal((await room.chatVoice(1, "AAAAAAAAAAAAAAAA", true)).ok, true);
  assert.equal(protocol.inVoice(amy.p), false, "island voice ended");
  assert.ok(amy.ws.sent.some((m) => m.t === "voice-moved"));
  assert.ok(amy.ws.sent.some((m) => m.t === "voice-elsewhere" && m.on === true), "her page can offer Switch here");
  assert.ok(bea.ws.sent.some((m) => m.t === "call" && m.id === 1 && m.on === true), "everyone sees her in a call");
  assert.equal(room.view(amy.p).call, true);
  assert.equal(JSON.stringify(stored.get("chatVoices")), '[[1,"AAAAAAAAAAAAAAAA"]]', "kept across a nap");
  amy.p.voice.track = "mic";
  let refuse = true;
  room.env.AUDIENCE = { getByName: (name) => ({ yieldVoice: async (id) => { if (refuse) throw new Error("unreachable"); yielded.push([name, id]); } }) };
  room.voiceState(amy.p);
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(room.chatVoices.get(1), "AAAAAAAAAAAAAAAA", "a chat that could not be reached keeps the entry, to be asked again");
  refuse = false;
  await room.takeVoiceBack(amy.p);
  assert.deepEqual(yielded, [["chat:AAAAAAAAAAAAAAAA", "gh:1"]], "taking island voice back ends the chat's lease");
  assert.equal(room.view(amy.p).call, undefined);
  assert.ok(amy.ws.sent.some((m) => m.t === "voice-elsewhere" && m.on === false), "and her page hears its voice is here again");
  assert.equal((await room.chatVoice(1, "AAAAAAAAAAAAAAAA", false)).ok, true, "the chat's own word after is harmless");
  await room.chatVoice(1, "BBBBBBBBBBBBBBBB", true);
  await room.chatVoice(1, "CCCCCCCCCCCCCCCC", false);
  assert.equal(room.chatVoices.get(1), "BBBBBBBBBBBBBBBB", "a stale chat never clears a newer one");
});



test("the preview: a chat's stage and counts, before joining; an open stage invites an asker at once and everyone hears it opened", async () => {
  now += START_GAP_MS;
  const w = await world();
  const { chat } = await startChat(w.env, host(1), { title: "Preview", zone: "main" });
  const amy = await connect(w, chat.id, 1), cyd = await connect(w, chat.id, 3);
  await connect(w, chat.id, 4);
  await ask(cyd, { type: "ask" });
  const { previewChat } = await import("../src/chat-directory.js");
  const look = await previewChat(w.env, chat.id);
  assert.deepEqual({ title: look.chat.title, open: look.chat.open, stage: look.stage.map((r) => [r.id, r.rank]), listeners: look.listeners, requests: look.requests },
    { title: "Preview", open: false, stage: [["gh:1", "host"]], listeners: 2, requests: 1 });
  assert.equal(look.stage.some((r) => "self" in r), false);
  assert.equal(await previewChat(w.env, "AAAAAAAAAAAAAAAA"), null, "an unknown chat makes no object");
  assert.equal((await ask(cyd, { type: "open", on: true })).error.code, "not_host");
  assert.equal((await ask(amy, { type: "open", on: true })).ok, true);
  assert.deepEqual(cyd.ws.sent.filter((m) => m.type === "chat").at(-1).chat.open, true, "everyone hears the stage opened");
  assert.equal(notices(cyd, "invited").at(-1).open, true, "the waiting asker is approved");
  assert.equal(you(cyd).speak, "eligible");
  const dot = { a: cyd.a, ws: [...cyd.a.sockets.values()].at(-1) };
  assert.equal((await ask(dot, { type: "ask" })).ok, true);
  assert.equal(notices(dot, "invited").length, 1, "an ask on an open stage is an invite");
  assert.equal(notices(amy, "asked").length, 1, "and asks no host");
  await w.settle();
  assert.equal(w.directory.list()[0].open, true, "the list shows an open stage");
});



test("leave is asked again after the waits; a ban that can't be read refuses; Leave Voice gives the stage up; leaving drops a request; an ended chat keeps nothing", async () => {
  now += START_GAP_MS;
  const w = await world();
  Object.assign(w.env, { REALTIME_APP_ID: "app", REALTIME_SECRET: "secret" });
  const { chat } = await startChat(w.env, host(1), { title: "Fixes", zone: "main" });
  const amy = await connect(w, chat.id, 1), cyd = await connect(w, chat.id, 3), dot = await connect(w, chat.id, 4);
  const a = w.objects.get(chatName(chat.id)).a;
  // An invite that lapses while the island is asked about the account is no lease.
  await ask(amy, { type: "invite", id: "gh:3" });
  const contributorFor = a.contributorFor;
  a.contributorFor = Object.assign(async (login) => { now += INVITE_MS; return contributorFor(login); }, { fresh: () => true });
  assert.equal((await ask(cyd, { type: "setRole", role: "speaker" })).error.code, "not_allowed");
  a.contributorFor = contributorFor;
  // A ban that could not be read refuses, even in a chat.
  a.env.DB = { prepare: () => ({ bind: () => ({ first: async () => { throw new Error("d1 down"); } }) }) };
  await ask(amy, { type: "invite", id: "gh:3" });
  const refused = await ask(cyd, { type: "setRole", role: "speaker" });
  assert.deepEqual([refused.error.code, refused.error.retryable], ["capability_unavailable", true]);
  delete a.env.DB;
  // Leave Voice (publish/close) gives the place on the stage up.
  assert.equal((await ask(cyd, { type: "setRole", role: "speaker" })).ok, true);
  assert.equal(a.roles.mayLease("gh:3", now), true);
  const res = await a.mediaRequest("publish/close", new Request("https://audience.invalid/media/publish/close", { method: "POST",
    headers: { "x-audience-principal": JSON.stringify(who(3)) }, body: JSON.stringify({ connection: cyd.connId }) }));
  assert.equal(res.status, 200);
  assert.equal(a.roles.mayLease("gh:3", now), false, "going back to listening on their own word gives the place up");
  // A listener who leaves takes their request with them.
  await ask(dot, { type: "ask" });
  assert.deepEqual(a.roles.queue().map((q) => q.id), ["gh:4"]);
  await a.webSocketClose(dot.ws);
  assert.deepEqual(a.roles.queue(), []);
  // An ended chat keeps nothing but media cleanup's bookkeeping.
  await ask(amy, { type: "end" });
  for (const key of ["chat", "roles", "meta"]) assert.equal(await w.objects.get(chatName(chat.id)).ctx.storage.get(key), undefined, key);
});

test("a word the island room missed is kept and sent again from the alarm", async () => {
  now += START_GAP_MS;
  const w = await world();
  let up = false;
  const told = [];
  w.env.ROOM = { getByName: () => ({ chatVoice: async (id, chat, on) => { if (!up) throw new Error("room away"); told.push([id, on]); return { ok: true }; } }) };
  const { chat } = await startChat(w.env, host(1), { title: "Retry", zone: "main" });
  const amy = await connect(w, chat.id, 1);
  await ask(amy, { type: "setRole", role: "speaker" });
  await w.settle();
  const { a, ctx } = w.objects.get(chatName(chat.id));
  assert.deepEqual([...a.islandWords], [["gh:1", true]], "kept");
  assert.ok(ctx.alarm <= now + 30000, "and the alarm will try again");
  up = true;
  await a.alarm();
  assert.deepEqual(told, [[1, true]]);
  assert.equal(a.islandWords.size, 0);
});



test("a chat's copy: speakers alone may walk it, walkers' rows say so, the clouds seat the rest, and leaving the stage, removal and the end reach the copy", async () => {
  now += START_GAP_MS;
  const w = await world();
  const calls = [];
  const copy = { copyRevoke: async (id, reason) => calls.push(["revoke", id, reason]), copyEnd: async () => calls.push(["end"]),
    copyClouds: async (list) => calls.push(["clouds", list.map((c) => [c.id, c.seat, c.character])]) };
  w.env.ROOM = { getByName: (name) => name.startsWith("chat:") ? copy : { chatVoice: async () => ({ ok: true }) } };
  const { chat } = await startChat(w.env, host(1), { title: "Copy", zone: "main" });
  const amy = await connect(w, chat.id, 1), bea = await connect(w, chat.id, 2), zed = await connect(w, chat.id, 9);
  const a = w.objects.get(chatName(chat.id)).a;
  assert.deepEqual(await a.copyMember("gh:1"), { ok: false, reason: "not-speaker" }, "the host walks only once on stage");
  await ask(amy, { type: "setRole", role: "speaker" });
  await ask(amy, { type: "invite", id: "gh:2" }); await ask(bea, { type: "setRole", role: "speaker" });
  await ask(amy, { type: "invite", id: "x:9" }); await ask(zed, { type: "setRole", role: "speaker" });
  for (const p of [amy, bea, zed]) { const c = a.model.conns.get(p.connId); a.model.activate(p.connId, c.lease.generation); }
  await a.flush();
  const member = await a.copyMember("gh:1");
  assert.equal(member.ok, true);
  assert.deepEqual(member.clouds.map((c) => [c.id, c.seat]), [["gh:1", "main-cloud-1"], ["gh:2", "main-cloud-2"], ["x:9", "main-cloud-3"]], "every speaker on a cloud, a seat each");
  assert.equal(member.clouds[2].character, "guest/x-p9", "an X account sits there as a default Ooga no login can be");
  assert.equal(member.clouds[0].seatRevision, "cloud-seats-v2");
  await a.walking(["gh:1"]);
  await w.settle();
  assert.equal(rowOf(bea, "gh:1").walking, true, "a walker's row says so");
  assert.deepEqual(calls.at(-1), ["clouds", [["gh:2", "main-cloud-2", "bea"], ["x:9", "main-cloud-3", "guest/x-p9"]]], "a walker's cloud stands empty; the copy hears the rest");
  assert.deepEqual(a.copyCheck(["gh:1", "gh:4"]), ["gh:4"], "the sweep's check names who may no longer walk");
  await a.walking(["gh:1", "gh:2"]);
  await ask(amy, { type: "demote", id: "gh:2" });
  await w.settle();
  assert.ok(calls.some((c) => c[0] === "revoke" && c[1] === 2 && c[2] === "stage"), "moved to listening, sent home");
  await ask(amy, { type: "setRole", role: "listener" });
  await w.settle();
  assert.ok(calls.some((c) => c[0] === "revoke" && c[1] === 1), "leaving the stage on one's own word sends one home too");
  await ask(amy, { type: "end" });
  await w.settle();
  assert.deepEqual(calls.at(-1), ["end"], "the end sends everyone home and the copy forgets itself");
});

test("a DSB Land chat has no copy yet", async () => {
  now += START_GAP_MS;
  const w = await world();
  const { chat } = await startChat(w.env, host(1), { title: "DSB", zone: "dsb" });
  const amy = await connect(w, chat.id, 1);
  await ask(amy, { type: "setRole", role: "speaker" });
  assert.deepEqual(await w.objects.get(chatName(chat.id)).a.copyMember("gh:1"), { ok: false, reason: "zone" });
});

test.after(() => { Date.now = realNow; });
