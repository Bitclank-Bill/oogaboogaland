import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { compileFunction, runInNewContext } from "node:vm";
import { readFileSync } from "node:fs";
import { encode } from "../../scripts/distribution-icons.mjs";
import { createPortraitManifest, validatePortraitManifest, pngDimensions } from "../src/character-portraits-format.js";
import * as schema from "../src/character-catalog-schema.js";
import { handlePublic, contributorsSnapshot, forgetPublic } from "../chat/src/public.js";
import { allowed, clientIp } from "../src/http.js";

const revision = "a".repeat(64), baseline = "b".repeat(40), hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const catalog = { baseline, engine: "island-character-data-v1", environment: "staging", entries: [{ identity: { handle: "Zoe" } }, { identity: { handle: "Alice" } }] };
const png = encode(640, 80, Buffer.alloc(640 * 80 * 4));
const manifest = createPortraitManifest(catalog, revision, hash(png));

test("portrait manifest binds sorted slots, fallback, dimensions and exact catalog", () => {
  assert.deepEqual(manifest.cells, { alice: 0, zoe: 1 });
  assert.equal(manifest.fallback, 2); assert.equal(manifest.rows, 1);
  assert.equal(validatePortraitManifest(manifest, catalog, revision), manifest);
  for (const change of [{ cells: { alice: 1, zoe: 0 } }, { fallback: 1 }, { environment: "production" }, { revision: "c".repeat(64) }, { url: "https://evil.invalid/x" }])
    assert.throws(() => validatePortraitManifest({ ...manifest, ...change }, catalog, revision));
  assert.deepEqual(pngDimensions(png), { width: 640, height: 80 });
  assert.throws(() => pngDimensions(png.subarray(0, 33)));
  const corrupted = Buffer.from(png); corrupted[40] ^= 1;
  assert.throws(() => pngDimensions(corrupted));
});

const portraitFixture = () => {
  const snapshot = { revision, baseline, catalog, activation: { releases: [revision] } };
  const store = new Map([[`portraits/${revision}/manifest.json`, Buffer.from(JSON.stringify(manifest))], [`portraits/${revision}/${manifest.image}.png`, png]]);
  const reads = [];
  const env = { CHARACTER_CATALOGS: { get: async (key) => {
    reads.push(key);
    const bytes = store.get(key);
    return bytes ? { size: bytes.length, body: new Response(bytes).body } : null;
  } } };
  const source = readFileSync(new URL("../src/character-portraits.js", import.meta.url), "utf8")
    .replace(/import\s+[\s\S]*?from\s+"[^"]+";/g, "").replace(/export const /g, "const ");
  const deps = { ...schema, PORTRAIT_MAX_BYTES: 2 * 1024 * 1024, pngDimensions, validatePortraitManifest, allowed, clientIp,
    catalogFor: () => ({ enabled: true, read: async () => snapshot }) };
  const api = compileFunction(source + "\nreturn { handleCharacterPortrait, portraitsFor };", Object.keys(deps))(...Object.values(deps));
  const request = (method = "GET", headers = {}) => new Request(`https://island.invalid/api/characters/portraits/${revision}/${manifest.image}.png`, { method, headers });
  return { ...api, env, snapshot, store, request, reads };
};

test("portrait reads serve only validated published bytes and never cache failures", async () => {
  const f = portraitFixture();
  assert.deepEqual(await f.portraitsFor(f.env, f.snapshot), manifest);
  const result = await f.handleCharacterPortrait(f.request(), f.env);
  assert.equal(result.status, 200); assert.equal(result.headers.get("content-type"), "image/png");
  assert.match(result.headers.get("cache-control"), /immutable/);
  assert.equal(hash(Buffer.from(await result.arrayBuffer())), manifest.image);
  assert.equal((await f.handleCharacterPortrait(f.request("GET", { "if-none-match": `"${manifest.image}"` }), f.env)).status, 304);
  assert.equal(await (await f.handleCharacterPortrait(f.request("HEAD"), f.env)).text(), "");
  f.store.set(`portraits/${revision}/${manifest.image}.png`, Buffer.from("broken"));
  const failed = await f.handleCharacterPortrait(f.request(), f.env);
  assert.equal(failed.status, 503); assert.equal(failed.headers.get("cache-control"), "no-store");
});

test("Chat portrait proxy strips credentials and binds environment and immutable path", async () => {
  let observed;
  const env = { ENVIRONMENT: "staging", OBL: { fetch: async (request) => { observed = request; return new Response("png"); } } };
  const request = new Request(`https://chat.invalid/api/chat/public/portraits/${revision}/${manifest.image}.png`, {
    headers: { cookie: "private=secret", authorization: "Bearer secret", "x-ooga-chat-environment": "production" }
  });
  const response = await handlePublic(request, env, new URL(request.url), {});
  assert.equal(await response.text(), "png");
  assert.equal(observed.headers.get("x-ooga-chat-environment"), "staging");
  assert.equal(observed.headers.get("cookie"), null); assert.equal(observed.headers.get("authorization"), null);
  assert.equal(new URL(observed.url).pathname, `/portraits/${revision}/${manifest.image}.png`);
});

test("validated portrait cache preserves HEAD and conditional reads and limits only public misses", async () => {
  const f = portraitFixture(), cached = new Map(), limited = [];
  const deps = { cache: { match: async (key) => cached.get(key)?.clone(), put: async (key, value) => { cached.set(key, value); } } };
  f.env.AVATAR_LIMITER = { limit: async ({ key }) => { limited.push(key); return { success: limited.length === 1 }; } };
  const request = (method = "GET", headers = {}) => f.request(method, { "cf-connecting-ip": "192.0.2.10", ...headers });
  const serve = (request) => f.handleCharacterPortrait(request, f.env, undefined, deps);
  assert.equal((await serve(request())).status, 200); assert.equal(f.reads.length, 2);
  assert.equal((await serve(new Request(request().url + "?cache-bust=ignored", request()))).status, 200);
  assert.equal((await serve(request("HEAD"))).body, null);
  assert.equal((await serve(request("GET", { "if-none-match": `"${manifest.image}"` }))).status, 304);
  assert.equal(f.reads.length, 2); assert.deepEqual(limited, ["portraits:192.0.2.10"]);
  f.snapshot.activation.releases = [];
  assert.equal((await serve(request())).status, 404, "cache never bypasses the active release allowlist");
  f.snapshot.activation.releases = [revision]; cached.clear();
  assert.equal((await serve(request())).status, 429); assert.equal(f.reads.length, 2);
  assert.equal((await serve(f.request())).status, 200, "private bridge calls are limited by the Chat edge");
  assert.equal(limited.length, 2);
});

test("concurrent Chat public reads cannot mix casts or portrait revisions across environments", async () => {
  forgetPublic(); let release;
  const first = new Promise((resolve) => { release = resolve; });
  const row = (name) => ({ ok: true, result: { rows: [{ handle: name }], revision: name, catalogRevision: name, catalogGeneration: 1, portraits: { revision: name } } });
  const production = { ENVIRONMENT: "production", OBL: { call: () => first } };
  const staging = { ENVIRONMENT: "staging", OBL: { call: async () => row("staging") } };
  const now = Date.now(), fetcher = async () => Response.json({ meta: { org: "OogaBoogaX", schema_version: 3, generated_at: new Date(now).toISOString() }, contributors: [] });
  const waiting = contributorsSnapshot(production, { fetcher, now });
  assert.equal((await contributorsSnapshot(staging, { fetcher, now })).catalogRevision, "staging");
  release(row("production"));
  assert.equal((await waiting).catalogRevision, "production");
  assert.equal((await contributorsSnapshot(staging, { fetcher, now })).catalogRevision, "staging");
});

test("Chat client changes face index and sheet together, rejects malformed maps and older generations", () => {
  const window = { BL: { oogaChatFaces: { cells: { old: 0 }, size: 80, columns: 8, fallback: 1 } } };
  runInNewContext(readFileSync(new URL("../../src/ooga-chat/ooga-chat-portraits.js", import.meta.url), "utf8"), { window });
  const portraits = window.BL.oogaChatPortraits;
  const body = { cast: [{ handle: "Alice" }, { handle: "Zoe" }], portraits: manifest, catalogRevision: revision, catalogGeneration: 2 };
  assert.equal(portraits.apply(body), true); assert.equal(portraits.revision, revision);
  const second = "c".repeat(64), next = { ...body, catalogRevision: second, portraits: { ...manifest, revision: second } };
  assert.equal(portraits.apply({ ...next, catalogGeneration: 1 }), false);
  assert.equal(portraits.apply({ ...next, catalogGeneration: 2 }), false, "one generation cannot name two revisions");
  assert.equal(portraits.apply({ ...next, portraits: { ...next.portraits, cells: { alice: 0, wrong: 1 } } }), false);
  assert.equal(portraits.apply({ ...next, catalogGeneration: 3 }), true); assert.equal(portraits.revision, second);
});
