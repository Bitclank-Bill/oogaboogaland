import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import * as protocol from "../src/protocol.js";
import { sha256Hex } from "../src/crypto.js";
import { getPlayer } from "../src/db.js";
import * as studioPolicy from "../src/studio-policy.js";
const harness = () => {
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
    CAST_ROWS: [{ handle: "a", github_login: "a" }, { handle: "b", github_login: "b" }, { handle: "c", github_login: "c" }],
    DurableObject: class { constructor(ctx, env) { this.ctx = ctx; this.env = env; } },
    WebSocketPair, Response, WebSocketRequestResponsePair: class {}, URL, crypto, Date, Map, Set, setTimeout, clearTimeout, console, ArrayBuffer, DataView,
  };
  runInNewContext(source, context);
  const stored = new Map();
  const ctx = {
    setWebSocketAutoResponse() {}, blockConcurrencyWhile: (fn) => fn(), acceptWebSocket: (ws) => accepted.push(ws),
    getWebSockets: () => accepted.filter((ws) => !ws.closed), getWebSocketAutoResponseTimestamp: () => null,
    storage: { get: async (key) => Array.isArray(key) ? new Map(key.filter((k) => stored.has(k)).map((k) => [k, stored.get(k)])) : stored.get(key), put: async (key, value) => stored.set(key, value), getAlarm: async () => null, setAlarm: async () => {} },
  };
  const room = new context.Room(ctx, {});
  const join = async (id, login) => {
    const before = accepted.length;
    await room.fetch({ url: "https://island.invalid/room", headers: new Headers({ upgrade: "websocket", "x-player-id": String(id), "x-player-login": login, "x-player-contributor": "0" }) });
    return accepted[before];
  };
  const send = (ws, msg) => room.webSocketMessage(ws, JSON.stringify(msg));
  return { room, ctx, stored, join, send };
};
const W = protocol.HOCKEY;
const frame = () => [0,660,0,600,0,200,0,2000,0,0,179000,0,-1000,-1000,0,0,1,0];
const messages = ws => ws.sent.filter(m => m.t === "hockey");
const seat = async (h,id,login) => {
  const ws = await h.join(id,login), p = h.room.players.get(id);
  h.send(ws,{t:"body",name:login}); h.send(ws,{t:"zone",name:W.ZONE});
  h.send(ws,{t:"pose",x:16.3,y:0,z:-3.1,yaw:Math.PI});
  return {ws,p};
};
const cmd = (h,p,k,extra={}) => {
  // Refill controls to isolate state/ownership tests; rate bounds have their own adversarial test below.
  if (p.p.hockeyBuckets) p.p.hockeyBuckets.control = {tokens:2,at:Date.now()};
  h.send(p.ws,{t:"hockey",k,i:0,s:h.room.hockeyTables[0]?.s,...extra});
};
test("hockey parser bounds every coordinate, action, sequence and payload", () => {
  const base={t:"hockey",k:"frame",i:0,s:"0123456789abcdef",q:1,a:frame()};
  assert.ok(protocol.parseClientMessage(JSON.stringify(base)));
  for (const patch of [{i:3},{s:"wrong"},{q:-1},{q:1.1},{a:[]},{a:[...frame(),1]},{a:frame().map(()=>null)},{k:"take-over"}]) assert.equal(protocol.parseClientMessage(JSON.stringify({...base,...patch})),null);
  for (let i=0;i<18;i++) { const a=frame(); a[i]=1e9; assert.equal(protocol.parseClientMessage(JSON.stringify({...base,a})),null,`field ${i}`); }
  assert.equal(protocol.parseClientMessage(JSON.stringify({...base,padding:"x".repeat(256)})),false);
  assert.ok(Buffer.byteLength(JSON.stringify(base))<=protocol.MESSAGE_MAX);
});
test("two authenticated lobby seats require both ready; spectators cannot steal a started solo or human game", async () => {
  const h=harness(), a=await seat(h,1,"a"), b=await seat(h,2,"b"), c=await seat(h,3,"c");
  cmd(h,a,"join"); cmd(h,b,"join");
  const s=h.room.hockeyTables[0]; assert.deepEqual([...s.ids],[1,2]);
  cmd(h,b,"ready"); assert.equal(s.phase,"lobby"); cmd(h,a,"ready"); assert.equal(s.phase,"play");
  cmd(h,c,"join"); assert.equal(messages(c.ws).at(-1).k,"busy"); assert.deepEqual([...s.ids],[1,2]);
  cmd(h,c,"frame",{q:5,a:frame()}); assert.equal(s.q,-1);
  cmd(h,b,"frame",{q:6,a:frame()}); assert.equal(s.q,-1);
  cmd(h,a,"leave"); assert.equal(h.room.hockeyTables[0],null);
  cmd(h,a,"join"); cmd(h,a,"ready"); cmd(h,b,"join"); assert.equal(messages(b.ws).at(-1).k,"busy");
  assert.deepEqual([...h.room.hockeyTables[0].ids],[1,0]);
  a.p.hockeyBuckets.control={tokens:0,at:Date.now()};
  h.send(a.ws,{t:"hockey",k:"leave",i:0,s:h.room.hockeyTables[0].s});
  assert.equal(h.room.hockeyTables[0],null,"exit releases the seat even when join + ready exhausted controls");
  h.room.webSocketClose(a.ws); h.room.webSocketClose(b.ws); h.room.webSocketClose(c.ws);
});
test("host frames and guest inputs are sequenced, compact, zone-scoped, rate-bounded and replayed to late spectators", async () => {
  const h=harness(), a=await seat(h,1,"a"), b=await seat(h,2,"b"), c=await seat(h,3,"c");
  cmd(h,a,"join");cmd(h,b,"join");cmd(h,a,"ready");cmd(h,b,"ready");
  h.send(c.ws,{t:"zone",name:"outside"}); const before=messages(c.ws).length;
  cmd(h,a,"frame",{q:0,a:frame()}); const s=h.room.hockeyTables[0];assert.equal(s.q,0);
  cmd(h,a,"frame",{q:0,a:frame()});assert.equal(s.q,0);
  const bad=frame();bad[8]=4;cmd(h,a,"frame",{q:1,a:bad});assert.equal(s.q,0);
  cmd(h,b,"input",{q:1,x:1000,hit:1});assert.equal(messages(a.ws).at(-1).k,"input");
  const count=messages(a.ws).length;cmd(h,b,"input",{q:1,x:-1000,hit:2});assert.equal(messages(a.ws).length,count);
  for(let q=2;q<200;q++)cmd(h,a,"frame",{q,a:frame()});
  assert.ok(s.q<12,`burst stopped at ${s.q}`);assert.equal(messages(c.ws).length,before);
  h.send(c.ws,{t:"zone",name:W.ZONE});assert.equal(messages(c.ws).at(-1).q,s.q);
  assert.deepEqual(messages(c.ws).at(-1).a,frame());
  const storedKeys=[...h.stored.keys()]; assert.ok(!storedKeys.some(k=>/hockey/i.test(k)),"no database writes for game frames");
  h.room.webSocketClose(a.ws);h.room.webSocketClose(b.ws);h.room.webSocketClose(c.ws);
});
test("seat release, expiry, body/zone changes, socket replacement and wake restore cannot resurrect an abandoned game",async()=>{
  const h=harness(),a=await seat(h,1,"a"),b=await seat(h,2,"b");
  cmd(h,a,"join");cmd(h,b,"join");
  const wake = new h.room.constructor(h.ctx, {});
  assert.deepEqual([...wake.hockeyTables[0].ids],[1,2]);
  assert.notEqual(wake.hockeyTables[0],h.room.hockeyTables[0],"wake reconstructs from serialized socket attachments");
  h.send(b.ws,{t:"zone",name:"outside"});assert.equal(h.room.hockeyTables[0],null);
  cmd(h,a,"join");h.send(a.ws,{t:"body",name:null});assert.equal(h.room.hockeyTables[0],null);
  h.send(a.ws,{t:"body",name:"a"});cmd(h,a,"join");h.room.hockeyTables[0].seen[0]=Date.now()-16000;protocol.hockey.sweep(h.room);assert.equal(h.room.hockeyTables[0],null);
  cmd(h,a,"join");const replacement=await h.join(1,"a");assert.equal(h.room.hockeyTables[0],null);
  protocol.hockey.restore(h.room);assert.equal(h.room.hockeyTables[0],null);
  h.room.webSocketClose(replacement);h.room.webSocketClose(b.ws);
});
test("joining requires an owned Ooga near a table, and leaving hockey retains Arcade voice eligibility",async()=>{
  const h=harness(),a=await seat(h,1,"a"),b=await seat(h,2,"b");
  h.send(a.ws,{t:"body",name:"b"});cmd(h,a,"join");assert.equal(h.room.hockeyTables[0],null);
  h.send(a.ws,{t:"body",name:"a"});a.p.x=0;cmd(h,a,"join");assert.equal(h.room.hockeyTables[0],null);
  a.p.x=16.3;cmd(h,a,"join");cmd(h,a,"ready");
  const eligible=()=>protocol.voicePeers([...h.room.players.values()]).get(1);
  a.p.voice.track="audio";b.p.voice.track="audio";a.p.voice.pub="a";b.p.voice.pub="b";a.p.voice.sub="a-sub";b.p.voice.sub="b-sub";
  assert.deepEqual([...eligible()],[2]); const before=JSON.stringify(eligible());cmd(h,a,"leave");assert.equal(JSON.stringify(eligible()),before);assert.equal(a.p.zone,W.ZONE);assert.equal(a.p.body,"a");
  h.room.webSocketClose(a.ws);h.room.webSocketClose(b.ws);
});

test("serialized session-to-Room transport retries a dropped join, cancels before acknowledgement, relays input and closes both seats",async()=>{
  const h=harness(), a=await seat(h,1,"a"), b=await seat(h,2,"b"), pending=[];
  const clients=[];
  const connect=p=>{
    const listeners=new Set(), row={starts:0,ends:0,closed:0,inputs:[],frames:[],a:frame(),index:p.ws.sent.length};
    const net={state:{selfId:p.p.id,room:"live"},subscribeHockey:fn=>{listeners.add(fn);return()=>listeners.delete(fn);},sendHockey:m=>{pending.push([p.ws,JSON.stringify({t:"hockey",...m})]);return true;},sendPose:(x,y,z,yaw)=>pending.push([p.ws,JSON.stringify({t:"pose",x,y,z,yaw})])};
    const BL={hockeyWire:W,net};runInNewContext(readFileSync(new URL("../../src/js/hockey-session.js",import.meta.url),"utf8"),{window:{BL},performance});
    const play={multiplayer(){},capture:()=>row.a,receive:a=>row.frames.push([...a]),peerInput:(x,hit)=>row.inputs.push([x,hit]),act(){},remoteAct(){}};
    row.session=BL.hockeySession.create({slot:0,play,aim:{x:1},lobby(){},sideChanged(){},start(){row.starts++;},end(){row.ends++;},closed(){row.closed++;}});
    row.deliver=()=>{while(row.index<p.ws.sent.length){const m=JSON.parse(JSON.stringify(p.ws.sent[row.index++]));if(m.t==="hockey")for(const fn of listeners)fn(m);}};
    clients.push(row);return row;
  };
  const pump=()=>{while(pending.length){const [ws,json]=pending.shift();h.room.webSocketMessage(ws,json);}for(const c of clients)c.deliver();};
  let host=connect(a);host.session.tick(.1,false);host.session.dispose();pump();
  assert.equal(h.room.hockeyTables[0],null,"queued join followed by cancellation does not strand a lobby");
  a.p.hockeyBuckets.control={tokens:0,at:Date.now()};host=connect(a);host.session.tick(.1,false);pump();assert.equal(host.session.table,null);
  a.p.hockeyBuckets.control.at-=1100;host.session.tick(1.1,false);pump();assert.ok(host.session.table,"unacknowledged join retries after the real room bucket refills");
  const guest=connect(b);guest.session.tick(.1,false);pump();host.session.ready();guest.session.ready();pump();
  assert.equal(host.starts,1);assert.equal(guest.starts,1);
  guest.session.act();guest.session.tick(.1,true);pump();assert.deepEqual(host.inputs.at(-1),[1,true]);
  host.session.tick(.1,true);pump();assert.equal(guest.frames.length,1);assert.deepEqual(guest.frames[0],host.a);
  host.a=frame();host.a[16]=0;host.session.finish();pump();assert.equal(guest.ends,1);assert.equal(h.room.hockeyTables[0].phase,"done");
  // A delayed cancellation cannot cancel an active/finished session; it only covers an unacknowledged lobby join.
  h.send(b.ws,{t:"hockey",k:"cancel",i:0});assert.ok(h.room.hockeyTables[0]);
  host.session.dispose();pump();assert.equal(h.room.hockeyTables[0],null);assert.equal(guest.closed,1);guest.session.dispose();
  h.room.webSocketClose(a.ws);h.room.webSocketClose(b.ws);
});
