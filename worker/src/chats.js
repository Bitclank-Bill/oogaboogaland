// Hosted chats from the island's own page (docs/ooga-chat-hosts.md): the list, starting one, a chat's socket and its
// media, each from the island session. Ooga Chat reaches the same chats through the bridge (chat-bridge.js), so the
// list, the rules and each chat's object are one. Every island account has an Ooga, so every one may start a chat; the
// principal handed to a chat is the island's own (`ob_<GitHub id>`), so a chat tells it apart from an Ooga Chat one.
//   GET  /api/chats                 the live chats, through a short edge cache
//   POST /api/chats                 start one: `{ title, zone }`
//   GET  /api/chats/<id>/live       the chat's socket (audience protocol 2)
//   POST /api/chats/<id>/media/<op> its media, as Ooga Chat's `/api/chat/media/<op>`
// Off unless the island's `OOGA_CHAT_FEATURES` names `chats`.

import { chatName, CHAT_ID, DIRECTORY_NAME } from "./audience.js";
import { startChat } from "./chat-directory.js";
import { bridgeFeatures } from "./chat-bridge-protocol.js";
import { allowed, fromSite, getSessionFromRequest, json, readBody, text } from "./http.js";

export const LIST_CACHE_S = 2;
const BODY_MAX = 512;
const MEDIA_BODY_MAX = 256 * 1024;
const MEDIA_OP = /^(ice|renegotiate|leave|receive\/(open|sync|close)|publish\/(open|offer|ready|close))$/;
const SOCKET_HEADERS = ["upgrade", "connection", "sec-websocket-key", "sec-websocket-version", "sec-websocket-extensions"];

/** The island account as a chat's principal (audience.js `readPrincipal`). */
export const islandPrincipal = (found) => ({
  principal: `ob_${found.player.id}`, provider: "github", providerUserId: String(found.player.id), login: found.player.login,
  display: found.player.display || found.player.login, avatar: null, character: found.character ? found.character.handle : null,
  eligible: true, sessionExpiresAt: Number(found.session.expires_at) * 1000,
});

/** The live chats, read once a couple of seconds at the edge: the same list for everyone, nobody's account id. */
export const listChats = async (env, cache = typeof caches !== "undefined" ? caches.default : null) => {
  const key = new Request("https://chats.invalid/list");
  if (cache) { const hit = await cache.match(key); if (hit) return hit.json(); }
  const chats = await env.CHATS.getByName(DIRECTORY_NAME).list();
  if (cache) await cache.put(key, new Response(JSON.stringify(chats), { headers: { "content-type": "application/json", "cache-control": `max-age=${LIST_CACHE_S}` } })).catch(() => {});
  return chats;
};

export const handleChats = async (request, env, url) => {
  if (!bridgeFeatures(env).chats || !env.CHATS || !env.AUDIENCE) return json({ error: { code: "unavailable", retryable: true } }, 503);
  const parts = url.pathname.split("/").slice(3);
  const id = parts[0] || "";
  if (request.method !== "GET" || id) { if (!fromSite(request, env.SITE_ORIGIN)) return text("Forbidden", 403); }
  let found;
  try { found = await getSessionFromRequest(request, env, true); } catch { return json({ error: { code: "unavailable", retryable: true } }, 503); }
  if (!found) return json({ error: { code: "auth_required" } }, 401);
  if (!id) {
    if (request.method === "GET") return json({ chats: await listChats(env) });
    if (request.method !== "POST") return text("Method not allowed", 405);
    const raw = await readBody(request, BODY_MAX);
    if (raw === null) return text("Too large", 413);
    let body;
    try { body = JSON.parse(raw); } catch { return json({ error: { code: "malformed" } }, 400); }
    const res = await startChat(env, { id: `gh:${found.player.id}`, login: found.player.login, display: found.player.display, character: found.character ? found.character.handle : null }, body);
    if (res.ok) return json({ chat: res.chat }, 201);
    return json({ error: { code: res.code, retryable: !!res.retryable, ...(res.retryAfter ? { retryAfter: res.retryAfter } : {}) } }, res.code === "already_hosting" ? 409 : res.retryable ? 429 : 400);
  }
  if (!CHAT_ID.test(id) || !(await env.CHATS.getByName(DIRECTORY_NAME).has(id))) return json({ error: { code: "ended" } }, 404);
  const headers = new Headers({ "x-audience-principal": JSON.stringify(islandPrincipal(found)) });
  const stub = env.AUDIENCE.getByName(chatName(id));
  if (parts[1] === "live" && parts.length === 2) {
    if (request.headers.get("upgrade") !== "websocket") return text("Expected WebSocket", 426);
    if (!(await allowed(env.ROOM_LIMITER, `chat:${found.player.id}`))) return text("Too many reconnects", 429);
    for (const name of SOCKET_HEADERS) { const value = request.headers.get(name); if (value !== null) headers.set(name, value); }
    return stub.fetch(new Request(`https://audience.invalid/connect?chat=${id}`, { headers }));
  }
  const op = parts[1] === "media" ? parts.slice(2).join("/") : "";
  if (!MEDIA_OP.test(op)) return text("Not found", 404);
  if (request.method !== "POST") return text("Method not allowed", 405);
  if (!(await allowed(env.VOICE_LIMITER, String(found.player.id)))) return text("Too many voice requests", 429);
  const body = await readBody(request, MEDIA_BODY_MAX);
  if (body === null) return text("Too large", 413);
  headers.set("content-type", "application/json");
  return stub.fetch(new Request(`https://audience.invalid/media/${op}`, { method: "POST", headers, body }));
};
