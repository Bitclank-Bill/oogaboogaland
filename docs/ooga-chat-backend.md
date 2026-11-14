# Ooga Chat backend

Ooga Chat (#650) is a standalone app at `ooga.chat`: authenticated listeners hear the island's public outdoor
conversation, and verified GitHub contributors can speak from a cloud. The app itself, its build and its browser
contracts are `docs/ooga-chat-app.md`. This document is the server side: the Cloudflare resources, the edge Worker that
serves the app, the private bridge into the island's Worker, the feature flags, secrets, deployment order and rollback.
Its sections grow with the backend issues: infrastructure (#662), sign-in (#663), public data and donations (#664), the
audience (#665), media (#666), private-room exclusion (#667), reactions and clouds (#668), the Commons (#670) and the
release (#669).

## Shape

```
 browser ──https──▶ ooga-chat-<env>  (edge Worker: the staged app, /api/*, /auth/*, /donations/*)
                     │  D1 ooga-chat-<env>: principals, sessions, sign-ins in flight, capability answers
                     │
                     ├─ OBL ───────▶ oogaboogaland-<env>  #ChatBridge  (private entrypoint, worker/src/chat-bridge.js)
                     │                 contributor policy, public data, audience zones, the SFU secret, the room
                     │
                     └─ DONATIONS ─▶ bananapayserver-<env>  #PageApi  (the same payment service the island uses)
```

- **The edge** (`worker/chat/src/`, `wrangler.ooga-chat.<env>.jsonc`) serves the app the app's own build stages
  (`npm run build:ooga-chat` → `untracked/ooga-chat`) and, on the same origin, every server route. It owns Ooga Chat's
  accounts and sessions in its own D1, and nothing else: it never reads the island's tables, holds the SFU secret, or
  runs presence.
- **The bridge** is a named `WorkerEntrypoint` in the island's Worker. A named entrypoint is reachable only through a
  service binding that names it, never from public HTTP, so the edge is its only caller. The island's Worker is the
  authority for everything the island already decides: who is a contributor (the cast and Oogatron), what the island
  shows, who stands where, and the media (one SFU app per environment, shared by the island and Ooga Chat so an
  authorized track can be pulled directly).
- **Audience state** for hundreds of listeners lives in Durable Objects of its own beside the island's `Room` (#665),
  never in the `Room`, whose 32 players and 15 Hz poses are a game's.

## Environments

| | Staging | Production |
|---|---|---|
| Edge Worker | `ooga-chat-staging` | `ooga-chat-production` |
| Origin (`SITE_ORIGIN`) | `https://ooga-chat-staging.wickedsmartbitcoin.workers.dev` | `https://ooga.chat` (custom domain; no workers.dev copy) |
| Config | `wrangler.ooga-chat.staging.jsonc` | `wrangler.ooga-chat.production.jsonc` |
| D1 | `ooga-chat-staging` (`109e1799-…`, ENAM) | `ooga-chat-production` (`c4a02871-…`, ENAM) |
| Bridge (`OBL`) | `oogaboogaland-staging#ChatBridge` | `oogaboogaland-production#ChatBridge` |
| Donations | `bananapayserver-staging#PageApi` (signet) | `bananapayserver-production#PageApi` (mainnet) |
| Rate limiters | namespaces 2010–2014 | namespaces 1010–1014 |
| Deploys | by hand (`ooga-chat-staging.yml`) | by hand on `rock` (`ooga-chat-production.yml`) |

Staging lives on workers.dev for now: `ooga.chat` is on Squarespace's nameservers (checked 2026-11-14), not a zone in
this account. Once the zone is moved here, staging moves to `staging.ooga.chat` (a custom-domain route, `SITE_ORIGIN`
and its OAuth callbacks together), and production's custom domain can be created. Until then a production deploy fails
at its route, which is the intended state. The canonical origin is the apex: `www.ooga.chat` becomes a proxied record
that a Redirect Rule sends to `https://ooga.chat`, as `www.oogabooga.land` does, and HTTP redirects to HTTPS at the
edge (Always Use HTTPS on the zone).

Environments never cross. Each environment's edge writes its `ENVIRONMENT` into every bridge envelope, and the
bridge refuses one from another environment (`environment_mismatch`). Cookies are host-only on each origin, the OAuth
apps are separate, and the D1 databases are separate, so a staging session, cookie, callback or grant cannot be
replayed into production or the other way round.

## The private bridge

`worker/src/chat-bridge-protocol.js` is the wire, shared unchanged by both ends. An envelope is
`{ v, env, requestId, op, principal, payload }`; a reply is `{ ok: true, requestId, result }` or
`{ ok: false, error: { code, retryable, retryAfter? } }`. `ChatBridge.call` checks, in order: the envelope is an object
of at most 16 KiB, `v` is this bridge's version, `env` is this Worker's `ENVIRONMENT`, `requestId` is 8–64 of
`[A-Za-z0-9_-]`, and `op` is one of its own operations (never an inherited name). An operation refuses with a
`BridgeRefusal(code, retryable, retryAfter)`; any other throw becomes `internal`, with nothing of its message. The edge
reads a reply through `readReply`, which turns anything malformed into `unavailable`, never into a fallback.

`principal` is written only by the edge, from its own validated session. Identity headers a browser sent
(`x-ooga-chat-*`, `x-player-*`, `x-room-token`, `x-game-name`, `x-client`) are dropped at the edge (`scrubbed`) before
anything is handed on, and the bridge never reads a browser header at all.

| Operation | Needs | Answers |
|---|---|---|
| `hello` | nothing | `{ version, environment, features, voice }`: what the bridge can do now, with no binding, secret or account id |

Later issues add their operations here.

## Feature flags

Two sets of flags, one at each end. Both default to everything off.

**The edge's `FEATURES`** (comma-separated, in `vars`): `github`, `x`, `listen`, `speak`, `feed`, `commons`, `cloud`. A
flag counts only when what it needs is there too (`effective` in `worker/chat/src/config.js`):

| Feature | Needs |
|---|---|
| `github` | its flag, `GITHUB_CLIENT_ID`, the secret `GITHUB_CLIENT_SECRET`, the D1 |
| `x` | its flag, `X_CLIENT_ID`, the secret `X_CLIENT_SECRET`, the D1 |
| `listen` | its flag, a sign-in provider, and a bridge of this environment and version that has `bridge` on and an SFU |
| `speak` | its flag, `listen`, and GitHub sign-in (X is never a speaker) |
| `feed` | its flag and the `DONATIONS` binding |
| `commons` | its flag, GitHub sign-in, and the bridge's `commons` |
| `cloud` | its flag, `speak`, and the bridge's `cloud` |

**The island's `OOGA_CHAT_FEATURES`** (in `wrangler.<env>.jsonc`): `bridge` turns on every operation but `hello`;
`outdoor` (island voices heard by Ooga Chat's audience), `cloud` (Ooga Chat speakers on clouds) and `commons` (The
Commons from Ooga Chat) each need `bridge`. This end is the authority: whatever the edge's flags say, an island deployed
with `OOGA_CHAT_FEATURES` empty refuses every outward operation, so redeploying it empty is the kill switch for the
whole path. A media feature switched off this way also runs its cleanup (#666, #667): it is not a hidden button.

## Browser contract

The app's own contract (`docs/ooga-chat-app.md`) is the source of truth for shapes; these are its server ends.

| Route | Answer |
|---|---|
| `GET /api/bootstrap` (also `/api/chat/config`) | `{ version: 1, build, environment, protocols: { identity: [1], audience: [1], media: [1] }, features: { github, x, voice, feed, speak, commons, cloud }, paths: { login: { github?, x? }, session?, logout?, audience? } }`. `build` is the staged app's (its `build.json`), so an open page hears of a newer one. `voice` is `listen`. A provider's login path appears only when it is on, the audience path only while listening is. `no-store`; rate-limited per IP |
| `GET /api/chat/health` | `{ schema: 1, environment, status, checks: { assets, database, bridge, auth: { github, x }, voice, speak, feed, commons } }`. `status` is `ok` (assets, D1 and bridge), `degraded` (assets serve, something else is off) or `down` (no staged app). `bridge` is `ok`, `mismatch` (another environment or version), `unavailable` or `unbound` |
| `GET /api/chat/version` | `{ schema: 1, environment, worker, build, protocols, bridge }`: the Worker version id, the app build and the bridge version, for correlating a report with a deployment |
| any other `/api/*`, `/auth/*`, `/donations/*` | a JSON 404 (`{ error: { code: "not_found" } }`), never the app's HTML |

Every other path is served from the staged app. Only `/api/*`, `/auth/*` and `/donations/*` run the Worker
(`run_worker_first`); the app's `_headers` (its content policy, `frame-ancestors 'none'`, the microphone for its own
origin only) apply to everything else. No route adds `unsafe-inline`, `unsafe-eval`, a non-`self` script or style
origin, or credentialed CORS.

## Secrets and variables

Names only; values live in Workers secrets and the owner's password manager (`worker/chat/dev.vars.example`).

| Name | Kind | Where | What |
|---|---|---|---|
| `ENVIRONMENT` | var | edge and island | `staging` or `production`; must match across the bridge |
| `SITE_ORIGIN` | var | edge | the app's origin, for redirects, cookies, callbacks and the Origin check |
| `FEATURES` | var | edge | the edge's flags, above |
| `OOGA_CHAT_FEATURES` | var | island | the bridge's flags, above |
| `GITHUB_CLIENT_ID` | var | edge | Ooga Chat's own GitHub OAuth App in this environment (not the island's) |
| `GITHUB_CLIENT_SECRET` | secret | edge | that app's secret |
| `X_CLIENT_ID` | var | edge | the X app's OAuth 2.0 client id (confidential web app) |
| `X_CLIENT_SECRET` | secret | edge | that app's secret |
| `REALTIME_APP_ID`, `REALTIME_SECRET` | var, secret | island only | the environment's one SFU app, shared with Ooga Chat through the bridge; never on the edge |

CI deploys with the repository's account-owned `CLOUDFLARE_API_TOKEN` (Workers Scripts and D1 edit). Frontend
contributors need none of these values: they work against the app's fixture adapter.

## Operator checklist

Done:
- [x] D1 databases `ooga-chat-staging` and `ooga-chat-production` created (2026-11-14) and in the configs.
- [x] Staging and production configs with separate D1, bridge target, payment target and rate-limit namespaces.
- [x] Bridge kill switch (`OOGA_CHAT_FEATURES`) and `ENVIRONMENT` on both island configs, both empty or off.
- [x] Manual deploy workflows; production only from `rock`.

To do, by the owner:
- [ ] Record the account, Workers plan and the zone plan in the private runbook (no secrets or tokens in issues).
- [ ] Move `ooga.chat` to this account; then add `staging.ooga.chat`, the production custom domain, the `www` redirect
      and Always Use HTTPS, and record certificate status.
- [ ] Register the GitHub OAuth Apps for Ooga Chat (org OogaBoogaX), one per environment, callback
      `<SITE_ORIGIN>/auth/github/callback`; client id into `vars`, secret with `wrangler secret put`.
- [ ] Configure X user authentication as a confidential web app with exact callbacks `<SITE_ORIGIN>/auth/x/callback`;
      record app access, `/2/users/me` availability, the spending cap and any review before turning `x` on.
- [ ] Deploy the island's Worker with the `ChatBridge` entrypoint before the edge's first deploy, or the edge's
      deploy fails on the binding.
- [ ] Before changing any existing Worker's compatibility date, verify WebSocket close and hibernation on staging.

## Local development

Run the island and the edge side by side; wrangler's dev registry joins the `OBL` binding by service name.

```bash
cd worker && npm run dev
```

```bash
cd worker && npm run migrate:chat:local && npm run dev:chat -- --env-file chat/.dev.vars --var FEATURES:github,listen
```

The edge listens on `http://localhost:8788` with `SITE_ORIGIN` overridden to match, so its cookies are plain local
ones. `chat/.dev.vars` (copied from `dev.vars.example`, gitignored) holds a development OAuth app's secret, never
production's. Both local Workers read `ENVIRONMENT` `staging` from the staging configs, so the bridge accepts the edge.
Without a staged app (`npm run build:ooga-chat`, #651) the edge still answers its API and health says `down`.

## Deployment order and rollback

Order: additive D1 migrations and the island's bridge entrypoint (with `OOGA_CHAT_FEATURES` off) first; then the edge
with every `FEATURES` flag off; then the app's compatible build; then each capability, staging before production,
public browsing before sign-in before listening before speaking (#669's runbook).

Rollback: turn new admissions off (the edge's `FEATURES`, or the island's `OOGA_CHAT_FEATURES` for anything outward),
let the media cleanup (#667) retire what is open, then redeploy the previous compatible Worker version
(`npx wrangler rollback --config ../wrangler.ooga-chat.<env>.jsonc` from `worker/`, or the previous commit through the
workflow). Never drop D1 tables or Durable Object namespaces as a rollback: old clients and cleanup still need them. A
DNS change alone does not end an open audio session; the island's kill switch does.
