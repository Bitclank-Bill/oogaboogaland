// Catalog-matched portraits are public immutable data, reached through either app's own origin.
import { catalogFor } from "./character-catalog.js";
import { parseCatalog, sameContext, sha256 } from "./character-catalog-schema.js";
import { PORTRAIT_MAX_BYTES, pngDimensions, validatePortraitManifest } from "./character-portraits-format.js";
const HASH = /^[a-f0-9]{64}$/;
const unavailable = () => { throw new Error("Character portraits unavailable"); };
const digest = async (bytes) => [...new Uint8Array(await crypto.subtle.digest("SHA-256", bytes))].map((n) => n.toString(16).padStart(2, "0")).join("");
const headers = { "cache-control": "no-store", "x-content-type-options": "nosniff", "cross-origin-resource-policy": "same-origin" };

const objects = async (env, action) => {
  const readers = new Set();
  let expired = false, timer;
  const read = async (key, limit = PORTRAIT_MAX_BYTES) => {
    const object = await env.CHARACTER_CATALOGS.get(key);
    if (expired || !object?.body || !Number.isSafeInteger(object.size) || object.size < 0 || object.size > limit) {
      if (object?.body) object.body.cancel().catch(() => {});
      unavailable();
    }
    const reader = object.body.getReader(); readers.add(reader);
    const bytes = new Uint8Array(object.size);
    let offset = 0;
    try {
      for (;;) {
        const next = await reader.read();
        if (expired) unavailable();
        if (next.done) break;
        if (!(next.value instanceof Uint8Array) || offset + next.value.byteLength > bytes.length) unavailable();
        bytes.set(next.value, offset); offset += next.value.byteLength;
      }
      if (offset !== bytes.length) unavailable();
      return bytes;
    } catch (error) { reader.cancel().catch(() => {}); throw error; }
    finally { readers.delete(reader); reader.releaseLock(); }
  };
  const deadline = new Promise((_, reject) => { timer = setTimeout(() => {
    expired = true;
    for (const reader of readers) reader.cancel().catch(() => {});
    reject(new Error("Character portraits timed out"));
  }, 4000); });
  try { return await Promise.race([action(read), deadline]); }
  finally { clearTimeout(timer); }
};
const decode = (bytes) => new TextDecoder("utf-8", { fatal: true }).decode(bytes);
const manifestFor = async (snapshot, revision, read) => {
  if (!HASH.test(revision) || !snapshot.activation.releases.includes(revision)) unavailable();
  let catalog = snapshot.catalog;
  if (revision !== snapshot.revision) {
    const json = decode(await read(`catalogs/${snapshot.baseline}/${revision}.json`));
    catalog = parseCatalog(json);
    if (!sameContext(catalog, snapshot.catalog) || await sha256(json) !== revision) unavailable();
  }
  const manifest = JSON.parse(decode(await read(`portraits/${revision}/manifest.json`, 32768)));
  return validatePortraitManifest(manifest, catalog, revision);
};
export const portraitsFor = (env, snapshot) => objects(env, (read) => manifestFor(snapshot, snapshot.revision, read));

export const handleCharacterPortrait = async (request, env, path = new URL(request.url).pathname) => {
  if (!["GET", "HEAD"].includes(request.method)) return new Response(null, { status: 405, headers: { ...headers, allow: "GET, HEAD" } });
  const match = /^\/api\/characters\/portraits\/([a-f0-9]{64})\/([a-f0-9]{64})\.png$/.exec(path);
  if (!match || !catalogFor(env).enabled) return new Response(null, { status: 404, headers });
  try {
    const snapshot = await catalogFor(env).read();
    if (!snapshot) unavailable();
    const bytes = await objects(env, async (read) => {
      const manifest = await manifestFor(snapshot, match[1], read);
      if (manifest.image !== match[2]) unavailable();
      const png = await read(`portraits/${match[1]}/${match[2]}.png`), dimensions = pngDimensions(png);
      if (dimensions.width !== manifest.columns * manifest.size || dimensions.height !== manifest.rows * manifest.size
        || await digest(png) !== manifest.image) unavailable();
      return png;
    });
    const immutable = { ...headers, "content-type": "image/png", "content-length": String(bytes.byteLength),
      "cache-control": "public, max-age=31536000, immutable", etag: `"${match[2]}"` };
    if (request.headers.get("if-none-match") === immutable.etag) return new Response(null, { status: 304, headers: immutable });
    return new Response(request.method === "HEAD" ? null : bytes, { headers: immutable });
  } catch { return new Response(null, { status: 503, headers: { ...headers, "retry-after": "15" } }); }
};
