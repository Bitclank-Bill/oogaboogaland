// Ooga Chat's edge Worker (`ooga-chat-<env>`, docs/ooga-chat-backend.md): the staged app (`npm run build:ooga-chat`)
// from static assets, and on the same origin its server routes. Only the paths named in `run_worker_first`
// (wrangler.ooga-chat.<env>.jsonc) reach this code; every other path is served straight from the assets, so an API path
// that is not handled here answers a JSON 404 rather than falling through to the app's HTML.
// Identity never passes through: identity headers a caller sent are dropped (`scrubbed`), and whatever this Worker
// hands the island Worker over its private bridge (`OBL`, worker/src/chat-bridge.js) it writes itself, from its own
// session. This file holds the routing and the public configuration; sign-in (#663), the public panels and donations
// (#664), the audience (#665-#668) and the Commons (#670) add their routes here.

import { bootstrap, health, version } from "./config.js";
import { allowed, clientIp, json, refusal } from "./http.js";

const PUBLIC_GET = {
  "/api/bootstrap": bootstrap,
  "/api/chat/config": bootstrap,
  "/api/chat/health": health,
  "/api/chat/version": version,
};

export const route = async (request, env) => {
  const url = new URL(request.url);
  const path = url.pathname;
  const read = PUBLIC_GET[path];
  if (read) {
    if (request.method !== "GET" && request.method !== "HEAD") return refusal("method_not_allowed", 405);
    if (!(await allowed(env.CHAT_PUBLIC_LIMITER, clientIp(request)))) return refusal("rate_limited", 429, { retryable: true, retryAfter: 60 });
    return json(await read(env));
  }
  if (path.startsWith("/api/") || path.startsWith("/auth/") || path.startsWith("/donations/")) return refusal("not_found", 404);
  return env.ASSETS.fetch(request);
};

export default {
  fetch: (request, env) => route(request, env),
};
