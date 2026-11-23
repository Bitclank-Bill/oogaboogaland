# Hosted chats

Hosts and co-hosts in Ooga Chat (OC, `ooga.chat`) and in Ooga Booga Land's (OBL, the island's) Ooga Chat panel: who
starts a conversation, who may speak in it, and how a listener asks. Agreed with the maintainer on 2026-11-22 before any
code; this file is the design both PRs build to. Roles follow X Spaces and Clubhouse: host, co-host, speaker, listener.

## The model

**A chat is started, not found.** Today's always-on public conversation (one roster for each outdoor zone, island
players heard in OC by walking into a public zone, OC speakers on clouds over the real island) is replaced. A chat
exists only while a host keeps it: a contributor starts one, picks its zone (Main Island or DSB Land) and gives it a
title. Two hosts picking the same zone start two chats, each in its own parallel copy of that zone, with nothing shared
between them.

**Signing in joins nothing.** Signing in to OBL or OC puts nobody in a chat. A visitor is in one only after opening it
from the list and joining it, as a listener, then speaker or co-host. The main island goes back to plain proximity
voice: nothing said on it is heard in OC, and nothing said in a chat is heard on it.

**Two pieces, two PRs.**

1. **Chats and roles** (this design's first PR): the chat objects, the list, roles, requests and the host's tools, in
   OC and in the island's Ooga Chat panel. An island visitor joins a chat by voice while their Ooga stays where it is.
2. **The copies of zones** (the second PR): each chat's own instance of its zone, which an island player travels into
   with their Ooga (the list's Go there), with the chat's OC speakers on its clouds. Out of scope here except where the
   first PR must leave room for it.

## Roles

| Role | Who | May |
|---|---|---|
| Host | the contributor who started the chat; one a chat | everything a co-host may, plus make and remove co-hosts, hand the chat over to a co-host, end the chat |
| Co-host | up to 3, made by the host from the chat's speakers or listeners | approve and decline requests, invite a listener, mute a speaker, move a speaker to listening, remove a listener or speaker from the chat; never touch the host or another co-host, never end the chat |
| Speaker | approved by a host or co-host | speak, mute and unmute themselves, raise the hand, go back to listening |
| Listener | anyone signed in who joined (GitHub or X) | listen, react, request to speak |

- **Who may start a chat:** a GitHub account the island's contributor policy calls `eligible` (`chat-capability.js`,
  the rule that let someone speak until now), checked again by the island when the chat starts. One live chat a host.
- **Who may request:** anyone signed in, GitHub or X. Eligibility no longer decides speaking: a host does. An X
  speaker, or any speaker without an Ooga, gets no cloud in the second PR's copy (clouds carry GitHub ids).
- **Speakers** count the host and co-hosts: at most 32 a chat (`CHAT_SPEAKERS`, a setting up to 64; every listener
  receives one voice per speaker, about 32 kb/s each while they talk, much less while muted, and the media server sends
  speakers × listeners streams, about 16,000 at 32 to 500), at most 500 listeners
  (`AUDIENCE_LISTENERS`). No speaker needs a cloud seat: a chat's clouds are its copy's, a seat each, in the second PR. Roles are an identity's (`gh:<id>`, `x:<id>`), never a tab's: every tab of an account shows
  the same role, and one account holds one voice lease across every chat (joining another chat's stage leaves the
  first's).
- **Mute:** a host or co-host can mute a speaker; only the speaker can unmute themselves (X Spaces' rule). Move to
  listener ends their lease. Remove from chat closes every connection of that account to the chat and keeps it out of
  that chat until a host or co-host allows them back or it ends. **Allow back** (from the Removed list in the
  Requests pop-up) lets them join again as a listener only: no request, invite, rank or place on the stage returns.

## Requests

- A listener's footer reads **Request to speak** where it read Join Voice; pressed, it reads **Requested · Cancel**.
  A requester's tile carries a small microphone badge. The raised hand keeps its meaning for speakers only.
- The host and co-hosts see a **Requests N** chip in the chat's title; it opens the queue, oldest first, each row with
  Approve and Decline. A tile's menu (press a tile, or Enter on the focused tile) offers what the viewer's role allows:
  Invite to speak, Mute, Move to listener, Make co-host, Remove co-host, Remove from chat.
- **Approve, or invite** a listener directly: the listener gets an invite card, **A host invited you to speak**, with
  Start speaking and Not now. Start speaking asks for the microphone (inside the press, as Safari needs) and puts them
  on stage muted. Nobody is put on stage without their own press. An invite lapses after 60 s, and the person goes back
  to listening with no request.
- **Decline:** the request goes; the person may ask again after 60 s. Cancel takes a request back at any time.
- One request an identity a chat; the queue holds at most 50 a chat (a full queue refuses, retryable).

## The host leaving

The host role is held 2 minutes after the host's last connection to the chat goes, for a reconnect. After that the
longest-serving co-host becomes host; with no co-host, the chat ends. The host may hand over to a co-host or End chat
at any time. When a chat ends, everyone in it sees **The chat ended**, its voice closes, and it leaves the list.

## Where each control lives

**OC** (`src/ooga-chat/`): the Ooga Chat tab opens on the **Chats** list (title, zone tag, the host's portrait, how
many speak and listen), with **Start a chat** for a contributor: one dialog with a title (prefilled "<name>'s chat",
editable, at most 60 characters, checked by the island's chat policy) and two picture cards to choose the zone, Main
Island (chosen first) and DSB Land, then Start chat (the one amber action) or Cancel. The island's panel opens the
same dialog with the zone the visitor's Ooga stands in chosen first. A chat opens the panel the app has today (`audience-tiles.js` roster, the emoji bar,
the footer) with a Back to chats control, the Requests chip for a host or co-host (in the panel's top right corner,
beside the zone tag), a role badge on host and co-host
tiles, and the footer's Request to speak or, for a host, End chat beside Leave.

**OBL** (`src/js/cloud-panel.js`): the same Chats list and chat view in the sheet's cloud tab, through the same shared
modules, so the two apps never drift. Joining a chat by voice there is like taking a call: the island's proximity voice
pauses until the visitor leaves the chat, and their Ooga carries an "in a chat" mark so nearby players know why they
can't hear them (the room's `call-v1`: the page sends `{ t: "call", on }`, every page hears `call { id, on }`
and finds `call: true` on such a player in `welcome` and `join`). Online Oogas lists island players, not chat members.
The same holds across devices: a chat tells the island room when a GitHub account takes or leaves its stage
(`chatVoice`, kept in the room's storage as `chatVoices`). The room ends that account's island voice (`voice-moved`,
whose toast says Ooga Chat took it), marks its Ooga in a call on every page, and tells its island page its voice is
elsewhere (`voice-elsewhere`, unless that page is itself in the chat), whose Switch here takes it back: island voice
going live while a chat holds the stage ends the lease there (`yieldVoice`), so one account has one voice either way. In the second PR the list also offers **Go
there**, which takes the visitor's Ooga into the chat's copy of its zone.

**Clouds belong to the copies.** OC speakers are never seen or heard over the real island any more: a chat's speakers
sit on clouds only inside that chat's own copy of its zone (the second PR), one seat each, however many chats share a
zone.

**Switched off by the first PR, deleted later:** the outdoor voice bridge (`outdoor-voice.js`, the Room's
`outdoor-voice-v1`, `outdoor-policy.js`, the island's overhearing) and the clouds over the real island
(`cloud-seats-v1`) stay in the code with their switches off (the island's `outdoor`, `cloud` and `commons`-free
`OOGA_CHAT_FEATURES`, the edge's `cloud`), and are removed in a follow-up once hosted chats are live. Clouds come back
in the second PR inside each chat's copy.

## Notifications

| Event | Who | What |
|---|---|---|
| a request arrives | host and co-hosts | the Requests chip's count, the cloud tab's unread badge (`sheet.setBadge`) while the panel is not watched, a toast "bea asked to speak" (at most one every 5 s, joined into "bea and 2 others asked to speak"), a soft chime once a burst |
| approved or invited | the requester | the invite card and a toast; a chime |
| declined | the requester | the footer goes back to Request to speak; a quiet note "Your request wasn't accepted" |
| muted by a host | the speaker | a toast "A host muted you" |
| moved to listening | the speaker | a toast "A host moved you to listening" |
| made or no longer co-host | that person | a toast; the role badge on their tile |
| host handed over | everyone | the badge moves; a toast for the new host |
| removed from the chat | that person | "A host removed you from this chat", back to the list |
| the chat ended | everyone in it | "The chat ended", back to the list |

Screen readers hear every one of these through one polite live region a panel; nothing is announced twice across the
toast and the region.

## Accessibility and phones

- The Chats list is a list of buttons. The roster keeps its one tab stop and arrow keys; Enter or Space on a focused
  tile opens its menu, the arrows move in it, Escape closes it and focus returns to the tile.
- The queue is a list whose rows each have two named buttons ("Approve bea", "Decline bea").
- The invite card takes focus when it opens (it is the one thing waiting on the person) and closes on Not now or
  Escape.
- Under 400 px the tile menu and the queue open as sheets from the panel's foot, 44 px controls.
- Every pop-up follows AGENTS.md's look (wood frame, words on slabs, one amber action) and joins `pad-focus.js`.

## Server

- **One Durable Object a chat.** The `Audience` class, today one object named `audience` for both zones, becomes one
  object a chat, named `chat:<id>` (`<id>` a random 16-character token). It keeps its sockets, roster model, leases,
  media broker, reactions and limits, and gains the roles, the queue and invites. The `audience` singleton goes unused.
- **One directory.** A new class `ChatDirectory` (`worker/src/chat-directory.js`, migration `v6`, binding `CHATS`),
  one object named `chats`: the live chats (id, title, zone, host, counts), at most 20 at once (`CHATS_MAX`), one a
  host, a start a host every 5 minutes (`START_GAP_MS`). A chat tells it its counts and host whenever they change
  (`update`) and when it ends (`end`). It also keeps which chat each account last took the stage in (`claim`,
  `release`): taking the stage in another chat ends the lease in that one (`yieldVoice`), so one account has one
  voice. It runs no timer.
- **Switches.** The island's `OOGA_CHAT_FEATURES` names `chats` (`bridgeFeatures(env).chats`): by itself it turns on
  the island's own routes, and with `bridge` the bridge's. The edge's `FEATURES` names `chats` too
  (`effective(...).chats`, which also needs `listen`); its bootstrap then lists `features.chats`, `paths.chats`
  (`/api/chat/chats`) and audience protocol 2 in `protocols.audience`.

### Routes

| | Ooga Chat (edge, `worker/chat/src/chats.js`) | The island (`worker/src/chats.js`) |
|---|---|---|
| live chats | `GET /api/chat/chats` → `{ chats }` | `GET /api/chats` → `{ chats }` |
| start one | `POST /api/chat/chats` `{ title, zone }` → `201 { chat }` | `POST /api/chats` `{ title, zone }` → `201 { chat }` |
| a chat's socket | `GET /api/chat/audience?chat=<id>` | `GET /api/chats/<id>/live` |
| its media | `POST /api/chat/media/<op>?chat=<id>` | `POST /api/chats/<id>/media/<op>` |

Both need a session. A list entry is `{ id, title, zone, host: { login, display, character }, startedAt, speakers,
listeners }`, never an account id, busiest first then newest; the island's is read through a 2 s edge cache. Starting
one needs a GitHub account the island's contributor rule calls eligible (every island account is); refusals are
`bad_title` (the island's chat policy, at most 60 characters), `zone_unavailable`, `already_hosting` (409),
`rate_limited` and `chats_full` (with `retryAfter`), `capability_required` (403). A chat id is 16 characters of
base64url. A socket or media call for a chat the directory doesn't list never reaches an object: the edge closes the
socket with 4404 and the island answers 404. The island hands a chat its own principal, `ob_<GitHub id>`, with the
account's Ooga, and no avatar (an Ooga Chat avatar is that origin's alone; the island draws the Ooga's face).

### The chat's socket (audience protocol 2)

Everything audience protocol 1 has (docs/ooga-chat-app.md), with these differences.

- **Join** is `{ "type": "join", "protocol": 2 }`. The zone is the chat's own; a `zone` naming another is refused
  (`error`, `zone_unavailable`). Protocol 1 on a chat closes it with 4426.
- **Snapshot** carries `chat: { id, title, zone, startedAt, host, cohosts }` (the host's and co-hosts' participant
  ids).
- **Rows** carry `rank` (`host` or `cohost`, absent for everyone else) with `rankSince` (ms, when a co-host was made
  one) and, while one is open, `request` (`asked` or `invited`) with `askedAt` (ms; the queue's order, oldest first).
  `since` (ms) is when a speaker took the stage, or when a listener's earliest connection joined; `via` is `island` or
  `app`, the app they listen or speak from (an island page's `ob_` principal, else Ooga Chat).
- **Order** in a chat, in both apps: the host first, then co-hosts, the longest-serving first (`rankSince`), then
  speakers, the longest on stage first (`since`), then listeners with an open request, the longest-lived request first
  (`askedAt`; an invited listener at the head of the rest), then the other listeners, the longest here first (`since`);
  ties by name, then id. A speaker's ring and a listener's dot beside "Listener" are green for the island and purple for Ooga Chat
  (`via`), and the tile's accessible name says where they listen from. A host's or co-host's rank does not make them a
  speaker: `role` is still `speaker` only under an active lease.
- **You** adds `rank` (`host`, `cohost` or `""`), `request` (`asked`, `invited` or `""`) and, while invited,
  `inviteUntil` (ms). `speak` is `eligible` exactly when the visitor may take a lease now (a rank, a live invite, or a
  place on the stage), so the app's Join Voice flow is unchanged: Start speaking on the invite card is Join Voice.
- **Requests**, each `{ type, requestId, ... }` answered by `{ type: "result", requestId, ok, error?: { code,
  retryable, retryAfter? }, you }`:

  | type | fields | who |
  |---|---|---|
  | `ask` | | a listener: Request to speak |
  | `cancel` | | the asker: Cancel |
  | `decline` | | the invited: Not now |
  | `invite` | `id` | a host or co-host, to anyone they outrank who isn't on the stage |
  | `answer` | `id`, `approve` (boolean) | a host or co-host, to an open request: approve is an invite |
  | `mute` | `id` | a host or co-host, to a speaker they outrank |
  | `demote` | `id` | Move to listener, the same |
  | `cohost` | `id`, `on` (boolean) | the host alone |
  | `handover` | `id` (a co-host) | the host alone |
  | `remove` | `id` | a host or co-host, to anyone they outrank |
  | `allow` | `id` | a host or co-host, to someone removed: Allow back |
  | `end` | | the host alone |

  `setRole`, `setMic`, `reaction` and `hand` are protocol 1's. Refusal codes: `not_host`, `not_allowed`,
  `already_allowed`, `not_asked`, `not_speaking`, `cooldown`, `rate_limited`, `queue_full`, `cohosts_full`, `removed`,
  `ended`, `malformed`; `setRole` speaker without leave is `not_allowed`. A speaker a host muted may unmute themselves
  with `setMic`; until then their voice is not pulled by anyone.
- **Notices**, `{ type: "notice", kind, id?, by?, until?, reason? }`, to whom they concern:

  | kind | to | means |
  |---|---|---|
  | `asked` | hosts and co-hosts | `id` asked to speak |
  | `not_now` | hosts and co-hosts | `id` turned an invite down |
  | `invited` | the invited | `by` invited them; good `until` |
  | `declined` | the asker | `by` declined their request |
  | `expired` | the invited | their invite lapsed |
  | `muted` | the speaker | `by` muted them: the page mutes its microphone |
  | `demoted` | the speaker | `by` moved them to listening (their lease has ended) |
  | `cohost`, `uncohost` | that person | `by` made or unmade them a co-host |
  | `host` | everyone | `id` is the host now (`by` the old host on a handover) |
  | `removed` | that person | `by` removed them; the socket then closes with 4403 |
  | `ended` | everyone | the chat ended (`reason` `ended` or `host_left`); every socket then closes with 4404 |

- **Removed list**, `{ type: "removed", list: [{ id, at, login, display }] }`, earliest first, to hosts and co-hosts
  alone: after their snapshot, whenever it changes, and to anyone who becomes host or co-host. Refusal `not_removed`.
- **Close codes** add 4403 (removed: don't reconnect, back to the list) and 4404 (ended or unknown: back to the list).

- **Pure model.** The rules live in `worker/src/chat-roles.js`, pure and allocation-light
  (`worker/test/chat-roles.test.mjs`), and the objects are checked through a fake host
  (`worker/test/ooga-chat-hosts.test.mjs`): every rule in this file (who may do what to whom, the caps, the queue, invites,
  cooldowns, the host hold and succession, removal, one lease an identity).
- **No idle timers.** A chat's alarm is set only for the earliest of a held host's 2 minutes, an invite's 60 s, a
  pending lease or a re-authentication; an empty chat with nothing pending sets none and hibernates. Roles, queue,
  invites and removals are stored (they are small), and the sockets' attachments carry each connection, so a woken
  chat carries on at the same revision.
- **Limits.** Control actions share the socket's existing bucket (10 a second, burst 20); a request at most once every
  10 s an identity, 60 s after a decline; one chat started an account every 5 minutes; a title through the island's
  `chat-policy.js`.

## Open for the second PR

Agreed 2026-11-23:

- **What a copy carries:** the zone's open air as it is (scenery, the banana pile, the clouds), the chat's members'
  Oogas, nothing else: no NPC crew or gorillas, cave mouths and doors sealed, no games.
- **Who goes:** speakers alone (the host, co-hosts and invited speakers) who are signed into the island with an Ooga.
  Listeners stay where they are and listen.
- **Getting there and back:** Go there in the chat beams the Ooga out of the main world in the island's green glyph
  stream and into the copy beside the banana pile; Leave beams it back to exactly where it stood, as does leaving the
  stage or the chat.
- **Size:** up to 32 Oogas, the speaker cap, and the island room's own.
- **Clouds:** a chat's Ooga Chat speakers sit on clouds in its copy, a seat each, 32 seats.

**The island view** (agreed 2026-11-22, built in the second PR): at the top of a chat, for every OC speaker and listener
tuned into it, a zoomed-out view of the chat's copy of its zone, shown only while at least one of the chat's speakers
is walking the copy with their Ooga. By default a drawn map: a baked overhead picture of the zone with each such
speaker's Ooga face where they stand, pulsing while they talk, from positions the chat relays a couple of times a second.
Speakers alone are drawn, never listeners. An opt-in **Live view**, off by default and remembered per viewer, is a camera feed as
the Observatory's screens are (`observatory-cameras.js`): a fixed camera far out over the copy, its feed rendered into a
texture at a capped rate and shown as a screen, of a reduced graph of the zone (terrain and landmarks, no NPCs or
interactions, as `observatory-bifrost.js` and its siblings build theirs) with the speakers' bodies stood from the poses
the chat relays (`observatory-visitors.js`). It is drawn in the viewer's own browser: no player's page captures or
uploads video. The first PR leaves room for it at the top of the chat panel.
