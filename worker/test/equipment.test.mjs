import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { deletePlayer } from "../src/db.js";
import { equipmentHats, equipmentHatArchive } from "../src/equipment-hats.js";
import { equipmentCommand, equipmentRecord, nextEquipment } from "../src/equipment-model.js";
import { readEquipment, writeEquipment } from "../src/equipment-store.js";
import { equipmentRoom } from "../src/equipment-room.js";
import { equipmentAccount, equipmentDatabase } from "./equipment-fixture.mjs";
import { routeFixture } from "./routes.mjs";

const SITE = "https://equipment.test", NONE = { item: "none", version: null };
const hat = () => ({ item: equipmentHats.items[0].id, version: equipmentHats.items[0].current });
const setup = async t => { const db = equipmentDatabase(); t.after(() => db.sql.close()); return { db, account: await equipmentAccount(db) }; };

test("equipment: SQL CAS admits one concurrent save and deletion cascades", async t => {
  const { db, account } = await setup(t), token = account.session.token_hash;
  assert.deepEqual(await readEquipment(db, 1, token), { selection: null, revision: 0, declined: null, update: null });
  const answers = await Promise.all([writeEquipment(db, 1, token, { revision: 0, selection: hat() }),
    writeEquipment(db, 1, token, { revision: 0, selection: NONE })]);
  assert.deepEqual(answers.map(a => a.status).sort(), [200, 409]);
  const current = await readEquipment(db, 1, token);
  assert.equal(current.revision, 1);
  assert.deepEqual(answers.find(a => a.status === 409).equipment, current);
  const next = await writeEquipment(db, 1, token, { revision: 1, selection: null });
  assert.equal(next.equipment.revision, 2); assert.equal(next.equipment.selection, null);
  await deletePlayer(db, 1);
  assert.equal(db.sql.prepare("SELECT count(*) AS n FROM player_equipment").get().n, 0);
  assert.equal((await writeEquipment(db, 1, token, { revision: 0, selection: NONE })).status, 401);
  await equipmentAccount(db, 1);
  assert.equal((await writeEquipment(db, 1, token, { revision: 0, selection: NONE })).status, 401, "a recreated account does not revive a removed session");
});

test("equipment: session removal between read and write cannot save", async t => {
  const { db, account } = await setup(t), token = account.session.token_hash, base = db.prepare;
  db.prepare = query => {
    if (query.startsWith("INSERT INTO player_equipment")) db.sql.prepare("DELETE FROM sessions WHERE token_hash = ?").run(token);
    return base(query);
  };
  assert.equal((await writeEquipment(db, 1, token, { revision: 0, selection: NONE })).status, 401);
  assert.equal(db.sql.prepare("SELECT count(*) AS n FROM player_equipment").get().n, 0);
});

test("equipment: pinned version and declined update survive newer metadata", () => {
  const v1 = "1".repeat(64), v2 = "2".repeat(64), v3 = "3".repeat(64);
  let current = v2;
  const hats = { current: () => current, has: (id, v) => id === "test-hat" && [v1, v2, v3].includes(v) };
  const stored = { item: "test-hat", version: v1, revision: 1, declined: null };
  let record = equipmentRecord(stored, hats);
  assert.deepEqual(record.selection, { item: "test-hat", version: v1 });
  assert.deepEqual(record.update, { item: "test-hat", version: v2 });
  const declined = nextEquipment(record, equipmentCommand({ revision: 1, decline: v2 }, hats));
  record = equipmentRecord({ ...stored, revision: 2, declined: declined.declined }, hats);
  assert.equal(record.update, null); assert.equal(record.selection.version, v1);
  current = v3;
  record = equipmentRecord({ ...stored, revision: 2, declined: declined.declined }, hats);
  assert.equal(record.update.version, v3); assert.equal(record.selection.version, v1);
  const accepted = nextEquipment(record, equipmentCommand({ revision: 2, selection: { item: "test-hat", version: v3 } }, hats));
  assert.equal(accepted.selection.version, v3); assert.equal(accepted.declined, null);
  assert.throws(() => nextEquipment(record, { revision: 2, decline: v2 }), /no longer offered/);
  assert.equal(nextEquipment(record, { revision: 1, selection: null }), null);
});

test("equipment: immutable selections reject unknown versions and unbounded/extra input", () => {
  for (const input of [{ revision: -1, selection: null }, { revision: 0, selection: { item: "none", version: "a".repeat(64) } },
    { revision: 0, selection: { ...hat(), version: "f".repeat(64) } }, { revision: 0, selection: null, id: 2 },
    { revision: Number.MAX_SAFE_INTEGER, selection: null }, { revision: 0, decline: "x" }]) assert.throws(() => equipmentCommand(input));
  assert.deepEqual(equipmentCommand({ revision: 0, selection: NONE }), { revision: 0, selection: NONE });
});

test("equipment: HTTP authentication, bounds, flag and server-owned identity", async t => {
  const { db, account } = await setup(t), routes = routeFixture({ cast: [{ handle: "owner1" }] });
  const room = { env: { DB: db, EQUIPMENT_ENABLED: "1" }, players: new Map() };
  const env = { SITE_ORIGIN: SITE, DB: db, EQUIPMENT_ENABLED: "1", ROOM: { getByName: name => {
    assert.equal(name, "island"); return { equipmentFor: (...args) => equipmentRoom.request(room, ...args) };
  } } };
  const send = (body, options = {}) => routes.worker.fetch(new Request(SITE + "/api/equipment", { method: options.method || "PUT",
    headers: { origin: SITE, cookie: `__Host-obl_session=${account.token}`, "content-type": "application/json", ...options.headers },
    ...((options.method || "PUT") === "GET" ? {} : { body: typeof body === "string" ? body : JSON.stringify(body) }) }), options.env || env);
  assert.equal((await send({ revision: 0, selection: NONE }, { env: { ...env, EQUIPMENT_ENABLED: "0" } })).status, 404);
  assert.equal((await send({ revision: 0, selection: NONE }, { headers: { origin: "https://evil.test" } })).status, 403);
  assert.equal((await send({ revision: 0, selection: NONE }, { headers: { cookie: "" } })).status, 401);
  assert.equal((await send(" ".repeat(513))).status, 413);
  assert.equal((await send({ revision: 0, selection: NONE, id: 2 })).status, 400);
  const response = await send({ revision: 0, selection: NONE });
  assert.equal(response.status, 200); assert.equal(response.headers.get("cache-control"), "no-store");
  assert.deepEqual(await response.json(), { equipment: { selection: NONE, revision: 1, declined: null, update: null } });
  const conflict = await send({ revision: 0, selection: null });
  assert.equal(conflict.status, 409); assert.equal((await conflict.json()).equipment.revision, 1);
  assert.equal((await send(null, { method: "GET" })).status, 200);
  assert.equal((await send({ revision: 1, selection: null }, { env: { ...env, EQUIPMENT_LIMITER: { limit: async () => ({ success: false }) } } })).status, 429);
});

test("equipment: only known immutable hat archives are public, digest checked and cacheable", async () => {
  const routes = routeFixture(), version = hat().version, env = { EQUIPMENT_ENABLED: "1" };
  const url = SITE + "/api/equipment/hats/" + version + ".json";
  const response = await routes.worker.fetch(new Request(url), env), body = await response.text();
  assert.equal(response.status, 200);
  assert.equal(createHash("sha256").update(body).digest("hex"), version);
  assert.equal(body, equipmentHatArchive(version));
  assert.match(response.headers.get("cache-control"), /immutable/);
  assert.equal((await routes.worker.fetch(new Request(url, { headers: { "if-none-match": `"${version}"` } }), env)).status, 304);
  assert.equal(await (await routes.worker.fetch(new Request(url, { method: "HEAD" }), env)).text(), "");
  assert.equal((await routes.worker.fetch(new Request(url), { EQUIPMENT_ENABLED: "0" })).status, 404);
  assert.equal((await routes.worker.fetch(new Request(url.replace(version, "f".repeat(64))), env)).status, 404);
});

test("equipment: Room admission receives only the authenticated session digest", async t => {
  const { db, account } = await setup(t), routes = routeFixture({ cast: [{ handle: "owner1" }] });
  let forwarded;
  const env = { SITE_ORIGIN: SITE, DB: db, EQUIPMENT_ENABLED: "1", ROOM: { getByName: () => ({ fetch: async request => {
    forwarded = request; return new Response("accepted");
  } }) } };
  const request = () => new Request(SITE + "/room", { headers: { origin: SITE, upgrade: "websocket",
    cookie: `__Host-obl_session=${account.token}`, "x-player-equipment-session": "f".repeat(64) } });
  assert.equal((await routes.worker.fetch(request(), env)).status, 200);
  assert.equal(forwarded.headers.get("x-player-equipment-session"), account.session.token_hash);
  assert.notEqual(forwarded.headers.get("x-player-equipment-session"), account.token);
  assert.equal((await routes.worker.fetch(request(), { ...env, EQUIPMENT_ENABLED: "0" })).status, 200);
  assert.equal(forwarded.headers.get("x-player-equipment-session"), null, "disabled deployment neither trusts nor sends the header");
});

test("equipment: public retention catalog remains available while disabled and exposes only immutable history", async () => {
  const routes = routeFixture(), url = SITE + "/api/equipment/catalog";
  const expected = { format: 1, items: equipmentHats.items.map(({ id, versions }) => ({ id, versions })) };
  for (const enabled of ["0", "1", undefined]) {
    const env = { EQUIPMENT_ENABLED: enabled };
    const response = await routes.worker.fetch(new Request(url), env);
    assert.equal(response.status, 200); assert.equal(response.headers.get("cache-control"), "no-store");
    assert.deepEqual(await response.json(), expected);
    const head = await routes.worker.fetch(new Request(url, { method: "HEAD" }), env);
    assert.equal(head.status, 200); assert.equal(head.headers.get("cache-control"), "no-store"); assert.equal(await head.text(), "");
    const refused = await routes.worker.fetch(new Request(url, { method: "PUT", body: "{}" }), env);
    assert.equal(refused.status, 405); assert.equal(refused.headers.get("allow"), "GET, HEAD");
  }
  assert.ok(expected.items.length <= 32);
  assert.ok(expected.items.reduce((sum, item) => sum + item.versions.length, 0) <= 256);
});
