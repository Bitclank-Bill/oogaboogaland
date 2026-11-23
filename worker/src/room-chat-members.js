// Who is in each hosted chat (docs/ooga-chat-hosts.md, Who the island sees in chats), for the island's Online Oogas: the
// Room's side. Each chat's Audience object tells the Room its members as they change (`chatMembers`, at most every 2 s a
// chat, an empty list as it ends); the Room keeps the lists in memory and in storage, so a hibernation wake keeps them,
// and every page hears each change (`{ t: "chat-members", chat, title, members, more }`) and the whole set in its
// welcome (`chatMembers`), only where welcome lists `chat-members-v1`, which the `chats` switch turns on with `call-v1`.
// No timer of its own: an entry for a chat the directory no longer lists goes at the sweep the Room already runs.
// Re-exported by protocol.js, as the audience glue is, so the Room's checks load it with the protocol.

import { bridgeFeatures } from "./chat-bridge-protocol.js";

export const CHAT_MEMBERS_FEATURE = "chat-members-v1";
// At most this many members a chat, the rest only counted (`more`), and at most this many chats kept.
export const MEMBERS_MAX = 100;
export const CHATS_KEPT = 32;
const CHAT = /^[A-Za-z0-9_-]{16}$/, ID = /^(gh|x):[1-9][0-9]{0,19}$/, LOGIN = /^[\w.-]{1,39}$/, CONTROL = /[\u0000-\u001f\u007f]/;
const TITLE_MAX = 60, DISPLAY_MAX = 50;
const on = (room) => bridgeFeatures(room.env || {}).chats;

/** One member as the Room keeps it, or null: only these fields, each checked. */
const member = (m) => {
  if (!m || typeof m.id !== "string" || !ID.test(m.id) || typeof m.login !== "string" || !LOGIN.test(m.login)) return null;
  const display = typeof m.display === "string" && m.display.trim() && m.display.length <= DISPLAY_MAX && !CONTROL.test(m.display) ? m.display.trim() : m.login;
  return { id: m.id, login: m.login, display, role: m.role === "speaker" ? "speaker" : "listener" };
};
/** A chat's entry, cleaned, or null for an empty one: each id once, at most MEMBERS_MAX, the rest counted. */
const entry = (title, members, more) => {
  const list = [], seen = new Set();
  let extra = Number.isSafeInteger(more) && more > 0 ? more : 0;
  for (const raw of Array.isArray(members) ? members : []) {
    const m = member(raw);
    if (!m || seen.has(m.id)) continue;
    seen.add(m.id);
    if (list.length < MEMBERS_MAX) list.push(m); else extra++;
  }
  if (!list.length) return null;
  const t = typeof title === "string" && title.trim() && title.length <= TITLE_MAX && !CONTROL.test(title) ? title.trim() : "";
  return { title: t, members: list, more: extra };
};
const message = (chat, e) => ({ t: "chat-members", chat, title: e ? e.title : "", members: e ? e.members : [], more: e ? e.more : 0 });

export const chatMembersRoom = {
  FEATURE: CHAT_MEMBERS_FEATURE,
  features: (room) => (on(room) ? [CHAT_MEMBERS_FEATURE] : []),
  /** The stored lists, checked as they load. */
  restore(room, stored) {
    room.chatRosters = new Map();
    for (const raw of Array.isArray(stored) ? stored.slice(0, CHATS_KEPT) : []) {
      if (!Array.isArray(raw) || !CHAT.test(raw[0]) || !raw[1]) continue;
      const e = entry(raw[1].title, raw[1].members, raw[1].more);
      if (e) room.chatRosters.set(raw[0], e);
    }
  },
  keep(room) { room.later(room.ctx.storage.put("chatMembers", [...room.chatRosters])); },
  /** A chat's word: its members now, replacing what was kept; an empty list drops it. Every page hears a change. */
  update(room, chat, title, members, more) {
    if (typeof chat !== "string" || !CHAT.test(chat)) return { ok: false };
    if (!room.chatRosters) room.chatRosters = new Map();
    const e = on(room) ? entry(title, members, more) : null;
    const before = room.chatRosters.get(chat);
    if (!e && !before) return { ok: true };
    if (e && !before && room.chatRosters.size >= CHATS_KEPT) return { ok: true };
    if (e && before && JSON.stringify(e) === JSON.stringify(before)) return { ok: true };
    if (e) room.chatRosters.set(chat, e); else room.chatRosters.delete(chat);
    chatMembersRoom.keep(room);
    if (on(room)) room.broadcast(message(chat, e));
    return { ok: true };
  },
  /** What a page's welcome carries: every chat's list, only where the feature is on. */
  welcome(room) {
    if (!on(room) || !room.chatRosters || !room.chatRosters.size) return {};
    return { chatMembers: [...room.chatRosters].map(([chat, e]) => message(chat, e)) };
  },
  /** At the sweep: a chat the directory no longer lists (its last word lost) goes. A directory that can't be read drops nothing. */
  async sweep(room) {
    if (!room.chatRosters || !room.chatRosters.size || !room.env || !room.env.CHATS) return;
    let live;
    try { live = new Set((await room.env.CHATS.getByName("chats").list()).map((c) => c.id)); } catch { return; }
    for (const chat of [...room.chatRosters.keys()]) if (!live.has(chat)) chatMembersRoom.update(room, chat, "", [], 0);
  },
};
