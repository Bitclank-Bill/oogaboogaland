import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { compileFunction, runInNewContext } from "node:vm";
import { readFileSync } from "node:fs";
import { encode } from "../../scripts/distribution-icons.mjs";
import { createPortraitManifest, validatePortraitManifest, pngDimensions } from "../src/character-portraits-format.js";
import * as schema from "../src/character-catalog-schema.js";
import { handlePublic, contributorsSnapshot, forgetPublic } from "../chat/src/public.js";

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
  const env = { CHARACTER_CATALOGS: { get: async (key) => {
    const bytes = store.get(key);
    return bytes ? { size: bytes.length, body: new Response(bytes).body } : null;
  } } };
  const source = readFileSync(new URL("../src/character-portraits.js", import.meta.url), "utf8")
    .replace(/import\s+[\s\S]*?from\s+"[^"]+";/g, "").replace(/export const /g, "const ");
  const deps = { ...schema, PORTRAIT_MAX_BYTES: 2 * 1024 * 1024, pngDimensions, validatePortraitManifest,
    catalogFor: () => ({ enabled: true, read: async () => snapshot }) };
  const api = compileFunction(source + "\nreturn { handleCharacterPortrait, portraitsFor };", Object.keys(deps))(...Object.values(deps));
  const request = (method = "GET", headers = {}) => new Request(`https://island.invalid/api/characters/portraits/${revision}/${manifest.image}.png`, { method, headers });
  return { ...api, env, snapshot, store, request };
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

test("Chat client changes face index and sheet together, rejects malformed maps and older generations", () => {
  const window = { BL: { oogaChatFaces: { cells: { old: 0 }, size: 80, columns: 8, fallback: 1 } } };
  runInNewContext(readFileSync(new URL("../../src/ooga-chat/ooga-chat-portraits.js", import.meta.url), "utf8"), { window });
  const portraits = window.BL.oogaChatPortraits;
  const body = { cast: [{ handle: "Alice" }, { handle: "Zoe" }], portraits: manifest, catalogRevision: revision, catalogGeneration: 2 };
  assert.equal(portraits.apply(body), true); assert.equal(portraits.revision, revision);
  const second = "c".repeat(64), next = { ...body, catalogRevision: second, portraits: { ...manifest, revision: second } };
  assert.equal(portraits.apply({ ...next, catalogGeneration: 1 }), false);
  assert.equal(portraits.apply({ ...next, portraits: { ...next.portraits, cells: { alice: 0, wrong: 1 } } }), false);
  assert.equal(portraits.apply({ ...next, catalogGeneration: 3 }), true); assert.equal(portraits.revision, second);
});
