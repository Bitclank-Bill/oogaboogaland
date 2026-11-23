// A hosted chat's roles (docs/ooga-chat-hosts.md): who hosts it, its co-hosts, the queue of requests to speak, the
// invites a host has sent, and who is held off. Pure and allocation-light; the Audience object (audience.js) owns one a
// chat, stores it whole (`save`, `restore`) and asks it before every lease and every host action. Identities, never
// connections: `gh:<id>` or `x:<id>`, so every tab of an account holds the same role.
// Ranks: the host (2), a co-host (1), everyone else (0). A host or co-host manages; an action on someone needs a higher
// rank than theirs, so a co-host never touches the host or another co-host. Speaking needs a rank, a live invite, or a
// place on the stage, which an accepted invite gives for the life of the speaker's lease and STAGE_HOLD_MS after one that
// ended without their word (a dropped socket, a failed microphone), so a speaker who comes straight back needs no
// second invite. Going back to listening on their own word, or a host's, gives the place up.
// Times are the caller's clock (`now`), so the checks run without one; nothing here sets a timer. `nextAt` is the
// earliest moment something changes by itself (an invite lapsing, the held host's two minutes), for the object's alarm.

export const COHOSTS_MAX = 3;
export const QUEUE_MAX = 50;
export const INVITE_MS = 60 * 1000;
export const DECLINE_MS = 60 * 1000;
export const ASK_GAP_MS = 10 * 1000;
export const HOST_HOLD_MS = 2 * 60 * 1000;
export const STAGE_HOLD_MS = 2 * 60 * 1000;
export const ID = /^(gh|x):[1-9][0-9]{0,19}$/;

const refuse = (code, extra = {}) => ({ ok: false, code, ...extra });
const OK = Object.freeze({ ok: true, changed: true });
const SAME = Object.freeze({ ok: true, changed: false });

export const createRoles = ({ host, now = 0, saved = null } = {}) => {
  let state;
  if (saved) {
    state = {
      host: saved.host, ended: saved.ended === true, hostAway: Number(saved.hostAway) || 0,
      cohosts: new Map(saved.cohosts || []), queue: new Map(saved.queue || []), invites: new Map(saved.invites || []),
      cooldown: new Map(saved.cooldown || []), lastAsk: new Map(saved.lastAsk || []), stage: new Map(saved.stage || []),
      removed: new Set(saved.removed || []),
    };
  } else {
    if (!ID.test(host)) throw new Error("a chat needs a host");
    // The host must connect within the hold, as if they had just dropped.
    state = { host, ended: false, hostAway: now + HOST_HOLD_MS, cohosts: new Map(), queue: new Map(), invites: new Map(),
      cooldown: new Map(), lastAsk: new Map(), stage: new Map(), removed: new Set() };
  }

  const rankOf = (id) => id === state.host ? "host" : state.cohosts.has(id) ? "cohost" : "";
  const level = (id) => id === state.host ? 2 : state.cohosts.has(id) ? 1 : 0;
  const manages = (id) => level(id) > 0;
  const outranks = (actor, target) => level(actor) > 0 && level(actor) > level(target);
  const invited = (id, now) => (state.invites.get(id) || 0) > now;
  const staged = (id, now) => state.stage.has(id) && (state.stage.get(id) === null || state.stage.get(id) > now);

  /** Whether an identity may hold a speaker lease now: a rank, a live invite, or its place on the stage. */
  const mayLease = (id, now) => !state.ended && !state.removed.has(id) && (level(id) > 0 || invited(id, now) || staged(id, now));

  /** `asked`, `invited` or "": what the roster shows of someone's request. */
  const requestOf = (id, now) => invited(id, now) ? "invited" : state.queue.has(id) ? "asked" : "";

  const guard = (actor, target) => {
    if (state.ended) return refuse("ended");
    if (!manages(actor)) return refuse("not_host");
    if (!ID.test(target)) return refuse("malformed");
    if (target === actor || !outranks(actor, target)) return refuse("not_allowed");
    return null;
  };
  // Everything an identity holds but a rank goes with it.
  const clear = (id) => { state.queue.delete(id); state.invites.delete(id); state.stage.delete(id); };

  /** A listener asks to speak. `speaking`: they already hold a lease. */
  const ask = (id, now, speaking = false) => {
    if (state.ended) return refuse("ended");
    if (state.removed.has(id)) return refuse("removed");
    if (speaking || level(id) > 0 || invited(id, now) || staged(id, now)) return refuse("already_allowed");
    if (state.queue.has(id)) return SAME;
    const until = state.cooldown.get(id) || 0;
    if (until > now) return refuse("cooldown", { retryable: true, retryAfter: Math.ceil((until - now) / 1000) });
    const last = state.lastAsk.get(id) || 0;
    if (last && now - last < ASK_GAP_MS) return refuse("rate_limited", { retryable: true, retryAfter: Math.ceil((last + ASK_GAP_MS - now) / 1000) });
    if (state.queue.size >= QUEUE_MAX) return refuse("queue_full", { retryable: true });
    state.queue.set(id, now);
    state.lastAsk.set(id, now);
    return OK;
  };

  const cancel = (id) => state.queue.delete(id) ? OK : SAME;

  /** A host or co-host invites someone, from the queue or not. Someone who may already speak needs no invite. */
  const invite = (actor, target, now) => {
    const bad = guard(actor, target);
    if (bad) return bad;
    if (state.removed.has(target)) return refuse("removed");
    if (staged(target, now)) return refuse("already_allowed");
    state.queue.delete(target);
    state.cooldown.delete(target);
    state.invites.set(target, now + INVITE_MS);
    return OK;
  };

  /** A host or co-host answers a request: approving it is an invite; declining holds the next request off a while. */
  const answer = (actor, target, approve, now) => {
    const bad = guard(actor, target);
    if (bad) return bad;
    if (!state.queue.has(target)) return refuse("not_asked");
    if (approve) return invite(actor, target, now);
    state.queue.delete(target);
    state.cooldown.set(target, now + DECLINE_MS);
    return OK;
  };

  /** The invited person says Not now. */
  const decline = (id) => state.invites.delete(id) ? OK : SAME;

  /** A lease was granted: an invite becomes a place on the stage, held while the lease lives. */
  const granted = (id, now) => {
    if (!mayLease(id, now)) return refuse("not_allowed");
    if (level(id) > 0) return SAME;
    state.invites.delete(id);
    state.queue.delete(id);
    state.stage.set(id, null);
    return OK;
  };

  /** A lease ended. On the speaker's own word their place goes; otherwise it is held a while for their return. */
  const leaseEnded = (id, voluntary, now) => {
    if (!state.stage.has(id)) return SAME;
    if (voluntary) state.stage.delete(id);
    else state.stage.set(id, now + STAGE_HOLD_MS);
    return OK;
  };

  /** Move to listener: the target's place on the stage and any invite go. The caller ends the lease. */
  const demote = (actor, target) => {
    const bad = guard(actor, target);
    if (bad) return bad;
    clear(target);
    return OK;
  };

  /** A host or co-host mutes a speaker. The rule is the rank's; the microphone is the caller's. */
  const mute = (actor, target) => guard(actor, target) || OK;

  /** Only the host makes and unmakes co-hosts, at most COHOSTS_MAX. */
  const setCohost = (actor, target, on, now) => {
    if (state.ended) return refuse("ended");
    if (actor !== state.host) return refuse("not_host");
    if (!ID.test(target) || target === state.host) return refuse("not_allowed");
    if (!on) return state.cohosts.delete(target) ? OK : SAME;
    if (state.removed.has(target)) return refuse("removed");
    if (state.cohosts.has(target)) return SAME;
    if (state.cohosts.size >= COHOSTS_MAX) return refuse("cohosts_full");
    state.cohosts.set(target, now);
    clear(target);
    return OK;
  };

  /** The host hands the chat to a co-host and takes that co-host's place. */
  const handover = (actor, target, now) => {
    if (state.ended) return refuse("ended");
    if (actor !== state.host) return refuse("not_host");
    if (!state.cohosts.has(target)) return refuse("not_allowed");
    state.cohosts.delete(target);
    state.host = target;
    state.cohosts.set(actor, now);
    state.hostAway = 0;
    return OK;
  };

  /** Removed from the chat: every role and request goes, and they stay out until it ends. The caller closes them. */
  const remove = (actor, target) => {
    const bad = guard(actor, target);
    if (bad) return bad;
    clear(target);
    state.cohosts.delete(target);
    state.cooldown.delete(target);
    state.lastAsk.delete(target);
    state.removed.add(target);
    return OK;
  };

  const end = (actor) => {
    if (state.ended) return SAME;
    if (actor !== state.host) return refuse("not_host");
    state.ended = true;
    return OK;
  };

  /** Whether the host is connected: their absence starts the hold, their return ends it. */
  const presence = (id, present, now) => {
    if (id !== state.host || state.ended) return SAME;
    if (present) { if (!state.hostAway) return SAME; state.hostAway = 0; return OK; }
    if (state.hostAway) return SAME;
    state.hostAway = now + HOST_HOLD_MS;
    return OK;
  };

  /**
   * What the clock changed: invites that lapsed (`expired`), and the host's hold run out, which passes the chat to the
   * longest-serving co-host, connected ones first (`host`, the new host), or ends it (`ended`). `present(id)` says
   * whether an identity is connected. Old cooldowns, gaps and held places are forgotten.
   */
  const tick = (now, present = () => false) => {
    const out = { expired: [], host: null, ended: false };
    if (state.ended) return out;
    for (const [id, until] of state.invites) if (until <= now) { state.invites.delete(id); out.expired.push(id); }
    for (const [id, until] of state.cooldown) if (until <= now) state.cooldown.delete(id);
    for (const [id, at] of state.lastAsk) if (now - at >= ASK_GAP_MS) state.lastAsk.delete(id);
    for (const [id, until] of state.stage) if (until !== null && until <= now) state.stage.delete(id);
    if (state.hostAway && state.hostAway <= now) {
      let next = null;
      for (const [id, since] of state.cohosts) {
        if (!next || present(id) && !present(next.id) || present(id) === present(next.id) && since < next.since) next = { id, since };
      }
      if (!next) { state.ended = true; out.ended = true; return out; }
      state.cohosts.delete(next.id);
      state.host = next.id;
      state.hostAway = present(next.id) ? 0 : now + HOST_HOLD_MS;
      out.host = next.id;
    }
    return out;
  };

  /** The earliest moment the clock changes something visible: an invite lapsing or the held host's hold. */
  const nextAt = () => {
    if (state.ended) return Infinity;
    let next = state.hostAway || Infinity;
    for (const until of state.invites.values()) next = Math.min(next, until);
    return next;
  };

  /** The queue, oldest first, for hosts and co-hosts. */
  const queue = () => [...state.queue].sort((a, b) => a[1] - b[1]).map(([id, at]) => ({ id, at }));

  const save = () => ({
    host: state.host, ended: state.ended, hostAway: state.hostAway, cohosts: [...state.cohosts], queue: [...state.queue],
    invites: [...state.invites], cooldown: [...state.cooldown], lastAsk: [...state.lastAsk], stage: [...state.stage], removed: [...state.removed],
  });

  return {
    get host() { return state.host; }, get ended() { return state.ended; }, get hostAway() { return state.hostAway; },
    get cohosts() { return [...state.cohosts.keys()]; },
    rankOf, manages, outranks, mayLease, requestOf, inviteUntil: (id, now) => invited(id, now) ? state.invites.get(id) : 0,
    isRemoved: (id) => state.removed.has(id), askedAt: (id) => state.queue.get(id) || 0,
    ask, cancel, invite, answer, decline, granted, leaseEnded, demote, mute, setCohost, handover, remove, end, presence, tick, nextAt, queue, save,
  };
};
