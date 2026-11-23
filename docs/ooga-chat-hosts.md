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
- **Speakers** count the host and co-hosts: at most 8 a chat (`AUDIENCE_SPEAKERS`), at most 500 listeners
  (`AUDIENCE_LISTENERS`). Roles are an identity's (`gh:<id>`, `x:<id>`), never a tab's: every tab of an account shows
  the same role, and one account holds one voice lease across every chat (joining another chat's stage leaves the
  first's).
- **Mute:** a host or co-host can mute a speaker; only the speaker can unmute themselves (X Spaces' rule). Move to
  listener ends their lease. Remove from chat closes every connection of that account to the chat and keeps it out of
  that chat until it ends.

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
many speak and listen), with **Start a chat** for a contributor (a title of at most 60 characters, checked by the
island's chat policy, and the zone). A chat opens the panel the app has today (`audience-tiles.js` roster, the emoji bar,
the footer) with a Back to chats control, the Requests chip for a host or co-host, a role badge on host and co-host
tiles, and the footer's Request to speak or, for a host, End chat beside Leave.

**OBL** (`src/js/cloud-panel.js`): the same Chats list and chat view in the sheet's cloud tab, through the same shared
modules, so the two apps never drift. Joining a chat by voice there is like taking a call: the island's proximity voice
pauses until the visitor leaves the chat, and their Ooga carries an "in a chat" mark so nearby players know why they
can't hear them. Online Oogas lists island players, not chat members. In the second PR the list also offers **Go
there**, which takes the visitor's Ooga into the chat's copy of its zone.

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
- **One directory.** A new class `ChatDirectory` (migration `v6`), one object named `chats`: the live chats (id, title,
  zone, host, counts), at most 20 at once, one a host. A chat tells it when it starts and ends, and its counts at most
  every 2 s while they change. `GET /api/chat/chats` (OC's edge, through the bridge) and `GET /api/chats` (the island
  Worker) read it through a 2 s edge cache.
- **Reaching a chat.** OC's socket stays `/api/chat/audience?chat=<id>` through ChatBridge; the island page opens its
  own socket to the same object, `/api/chats/<id>/live`, from its island session. Both carry the same principal shape
  (`readPrincipal`), so roles and limits are one code path. Media stays the chat's own broker
  (`/api/chat/media/<op>`, and `/api/chats/<id>/media/<op>` from the island), never the island's voice.
- **Protocol** (audience protocol 2, gated by `chats-v1` in the bootstrap and the island's welcome):
  - page: `start { title, zone }` (directory), `join { chat }`, `request`, `cancel`, `invite { id }`,
    `answer { id, approve }`, `accept`, `refuse`, `mute { id }`, `demote { id }`, `cohost { id, on }`,
    `handover { id }`, `remove { id }`, `end`; each with a `requestId`, answered by `result`, refused with a code
    (`not_host`, `not_allowed`, `queue_full`, `cooldown`, `speaker_capacity`, `removed`, `ended`, `rate_limited`).
  - server: the snapshot and deltas carry each row's `role` (`host`, `cohost`, `speaker`, `listener`) and `request`
    (`""`, `asked`, `invited`); `you` carries the visitor's role, request and invite expiry; `requests` (host and
    co-hosts only) lists the queue; `notice { kind, by, id }` carries the events above; `ended`.
  - Every message is checked whole at the boundary; an unknown field or a bad id is a refusal, never a guess.
- **Pure model.** The rules live in `audience-model.js` (or a sibling `chat-roles.js`), pure and allocation-light,
  with `node --test` checks for every rule in this file: who may do what to whom, the caps, the queue, invites,
  cooldowns, the host hold and succession, removal, one lease an identity.
- **No idle timers.** A chat's alarm is set only for the earliest of a held host's 2 minutes, an invite's 60 s, a
  pending lease or a re-authentication; an empty chat with nothing pending sets none and hibernates. Roles, queue,
  invites and removals are stored (they are small), and the sockets' attachments carry each connection, so a woken
  chat carries on at the same revision.
- **Limits.** Control actions share the socket's existing bucket (10 a second, burst 20); a request at most once every
  10 s an identity, 60 s after a decline; one chat started an account every 5 minutes; a title through the island's
  `chat-policy.js`.

## Open for the second PR

How a chat's copy of its zone is hosted (an instance of the island's room for each chat, or a lighter one), what of the
island's world it carries (NPCs, the pile, games), how a player crosses into it and back, and its clouds.
