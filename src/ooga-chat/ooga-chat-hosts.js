// Ooga Chat's hosted chats (docs/ooga-chat-hosts.md), in a chunk of its own (`hosts`, ooga-chat-chunks.js), asked for
// once a signed-in account's service offers them. `create(ctx, { node, head, space })` adds to the Ooga Chat panel
// (ooga-chat-views.js `chat`) everything a chat needs past the space it shares with the island:
// - the Chats list (`data-space="list"`, before any chat is chosen): the live chats as the server orders them, busiest
//   first, a list of buttons, each its title, zone, host and counts; read when shown and every LIST_MS at most while it
//   stays shown and the page is visible (no timer otherwise); Start a chat for a GitHub account, one dialog
//   (`startDialog`): a title prefilled "<name>'s chat", two picture cards for the zone (the default `options.zone`,
//   Main Island here; the island's panel will pass where the visitor's Ooga stands), Start chat and Cancel, with the
//   server's refusal in words;
// - in a chat: Back to chats, its title and, for a host or co-host, the Requests chip and its queue; the footer's
//   Request to speak (Requested · Cancel) where a listener read Join Voice, End chat for its host, Leave for everyone;
//   the invite card, focused as it opens, Start speaking being Join Voice inside its press; and a tile's menu, opened by
//   a press on its portrait or Enter or Space on the focused tile (a speaker's name keeps its volume and the visitor's
//   own voice mark its mute), offering what the viewer's rank allows over that participant (`actionsFor`);
// - one polite live region (`.oc-chat-notice`) for every notice and refused request, in words (`noticeText`), a burst
//   of requests joined into one line at most every ASKED_MS, nothing said twice.
// `.oc-room-strip`, empty and hidden, holds the roster's place for a later strip over it (a view of the chat's island).
// Pop-ups (a tile's menu, the queue, a confirmation) are one wood-framed box, a sheet at the panel's foot under 400px
// (ooga-chat.css). The pure parts (`parseList`, `actionsFor`, `noticeText`, `joinNames`) read nothing but window.BL.
(() => {
  "use strict";
  const BL = window.BL = window.BL || {};
  const ZONE_NAMES = { main: "Main Island", dsb: "DSB Land" };
  // Main Island's mark for the zone cards, drawn as DSB Land's is (native-icons.js `dsb`): a floating isle on the sea,
  // its grass, a cave mouth, a palm and the banana pile. Kept here, in the deferred chunk, off the first load.
  const MAIN_ISLAND = [
    ["#195c78", "m3 30 9-8 30-6 18 12-5 11-23 7-24-6z"],
    ["#8a6a45", "m7 28 12-9 14-5 14 3 11 10-6 8-21 7-20-7z"],
    ["#639922", "m10 27 11-7 12-4 12 3 9 8-5 6-18 6-17-6z"],
    ["#97c459", "m15 25 9-5 9-2 9 2 6 5-4 3-12 3-13-3z"],
    ["#4a3a2a", "M12 21h6v6h-6zM13 19h4v2h-4z"],
    ["#7a5a32", "M46 12h2v13h-2z"],
    ["#3b6d11", "M40 10h6v2h-6zM48 10h7v2h-7zM42 8h4v2h-4zM48 8h5v2h-5zM45 6h4v2h-4z"],
    ["#ef9f27", "M27 21h10v3H27zM29 19h6v2h-6zM31 17h2v2h-2z"],
    ["#fac775", "M29 21h2v1h-2zM33 20h2v1h-2z"],
    ["#69b6c5", "m8 39 22 6 22-7v2l-22 7-22-6z"],
  ];
  const mainIsland = () => {
    const ns = "http://www.w3.org/2000/svg", el = document.createElementNS(ns, "svg");
    el.setAttribute("viewBox", "0 0 64 48");
    el.setAttribute("aria-hidden", "true");
    for (const [fill, d] of MAIN_ISLAND) { const path = document.createElementNS(ns, "path"); path.setAttribute("d", d); path.setAttribute("fill", fill); el.append(path); }
    return el;
  };
  const LIST_MS = 10000, ASKED_MS = 5000, SHOWN_MS = 6000, TITLE_MAX = 60;
  const LEVEL = { host: 2, cohost: 1 };
  const count = (n) => Number.isSafeInteger(n) && n >= 0 ? n : 0;
  // One list entry as the server sends it (worker/src/chat-directory.js `list`), or null.
  const parseEntry = (raw) => {
    const { clean, ZONES } = BL.oogaChatConfig, host = raw?.host;
    if (!raw || typeof raw.id !== "string" || !/^[\w-]{16}$/.test(raw.id) || !ZONES.includes(raw.zone)) return null;
    if (!host || typeof host.login !== "string" || !/^[\w.-]{1,39}$/.test(host.login)) return null;
    return { id: raw.id, title: clean(raw.title, TITLE_MAX) || "Untitled chat", zone: raw.zone, startedAt: count(raw.startedAt),
      host: { login: host.login, display: clean(host.display, 50) || host.login, character: typeof host.character === "string" && /^[\w.-]{1,64}$/.test(host.character) ? host.character : null },
      speakers: count(raw.speakers), listeners: count(raw.listeners) };
  };
  const parseList = (raw) => Array.isArray(raw) ? raw.slice(0, 50).map(parseEntry).filter(Boolean) : null;
  // What the viewer (`{ id, rank }`) may do to a participant row: only over someone they outrank, never themselves.
  const actionsFor = (viewer, row) => {
    const mine = LEVEL[viewer.rank] || 0, theirs = LEVEL[row.rank] || 0, out = [];
    if (!row || row.id === viewer.id || !mine || mine <= theirs) return out;
    const speaker = row.role === "speaker";
    if (!speaker && row.request !== "invited") out.push({ type: "invite", label: "Invite to speak" });
    if (speaker && !row.muted) out.push({ type: "mute", label: "Mute" });
    if (speaker) out.push({ type: "demote", label: "Move to listener" });
    if (viewer.rank === "host") {
      out.push(row.rank === "cohost" ? { type: "cohost", on: false, label: "Remove co-host" } : { type: "cohost", on: true, label: "Make co-host" });
      if (row.rank === "cohost") out.push({ type: "handover", label: "Make host" });
    }
    out.push({ type: "remove", label: "Remove from chat", confirm: `Remove ${row.display} from this chat? They can't come back until it ends.` });
    return out;
  };
  const joinNames = (names) => names.length === 1 ? `${names[0]} asked to speak` : `${names[0]} and ${names.length - 1} other${names.length > 2 ? "s" : ""} asked to speak`;
  // A notice in words, for whoever it concerns (`me` the visitor's id, `nameOf(id)` a participant's name); "" says nothing.
  const noticeText = (n, me, nameOf) => ({
    not_now: () => `${nameOf(n.id)} said not now`,
    declined: () => "Your request wasn't accepted",
    expired: () => "The invite to speak lapsed",
    muted: () => "A host muted you",
    demoted: () => "A host moved you to listening",
    cohost: () => "You're a co-host now",
    uncohost: () => "You're no longer a co-host",
    host: () => n.id === me ? "You're the host now" : `${nameOf(n.id)} is the host now`,
    removed: () => "A host removed you from this chat",
    ended: () => "The chat ended"
  })[n.kind]?.() || "";
  const REFUSED = { cooldown: (s) => `You can ask again in ${s || 60} s`, rate_limited: (s) => s ? `Wait ${s} s, then try again` : "Wait a moment, then try again",
    queue_full: () => "Too many people are asking. Try again soon.", cohosts_full: () => "This chat has 3 co-hosts already", not_asked: () => "That request is gone",
    not_speaking: () => "They aren't speaking now", already_allowed: () => "You may speak already: Join Voice", ended: () => "The chat ended",
    not_host: () => "Only a host can do that", not_allowed: () => "You can't do that here" };
  const STARTS = { bad_title: () => "Give it a title of 1–60 characters.", zone_unavailable: () => "That place isn't open for chats.",
    already_hosting: () => "You're hosting a chat already.", rate_limited: (s) => `You started one a moment ago. Try again in ${s || 300} s.`,
    chats_full: () => "Every chat spot is taken. Try again soon.", capability_required: () => "Starting a chat is for Team Ooga Booga contributors.",
    auth_required: () => "Sign in again to start a chat." };

  // The Start a chat dialog: `open(name)` prefills the title, `close()`; `submit({ title, zone })` resolves to "" when the
  // chat started, else the words for why not. The zone cards are one radio group: a press or the arrow keys choose.
  // A button of several parts.
  const tap = (className, ...parts) => {
    const el = BL.oogaChatViews.kit.make("button", className, ...parts);
    el.type = "button";
    return el;
  };
  const startDialog = ({ zone: first = "main", submit }) => {
    const { make, button } = BL.oogaChatViews.kit;
    const dialog = make("dialog", "oc-start"), heading = make("h2", "", "Start a chat");
    heading.id = "oc-start-head";
    dialog.setAttribute("aria-labelledby", heading.id);
    const title = make("input", "oc-start-title"), label = make("label", "oc-start-label", "Title", title);
    Object.assign(title, { type: "text", maxLength: TITLE_MAX, autocomplete: "off", spellcheck: false });
    const cards = make("div", "oc-start-zones");
    cards.setAttribute("role", "radiogroup");
    cards.setAttribute("aria-label", "Where");
    const zones = Object.entries(ZONE_NAMES).map(([value, words]) => {
      const card = tap("oc-zone-card", make("span", "oc-zone-art", value === "main" ? mainIsland() : BL.nativeIcons.svg("dsb")), make("span", "oc-zone-name", words));
      card.setAttribute("role", "radio");
      card.dataset.zone = value;
      cards.append(card);
      return card;
    });
    let zone = first;
    const choose = (value, focus = false) => {
      zone = value;
      for (const card of zones) {
        const on = card.dataset.zone === value;
        card.setAttribute("aria-checked", String(on));
        card.tabIndex = on ? 0 : -1;
        if (on && focus) card.focus();
      }
    };
    cards.addEventListener("click", (event) => { const card = event.target.closest(".oc-zone-card"); if (card) choose(card.dataset.zone); });
    cards.addEventListener("keydown", (event) => {
      const step = { ArrowLeft: -1, ArrowUp: -1, ArrowRight: 1, ArrowDown: 1 }[event.key];
      if (!step) return;
      event.preventDefault();
      const at = zones.findIndex((card) => card.dataset.zone === zone);
      choose(zones[(at + step + zones.length) % zones.length].dataset.zone, true);
    });
    const go = button("foot-button foot-primary", "Start chat"), cancel = button("foot-button", "Cancel"), why = make("p", "oc-start-why");
    why.setAttribute("role", "alert");
    go.type = "submit";
    const form = make("form", "slab oc-start-slab", label, cards, why, make("div", "oc-start-go", cancel, go));
    dialog.append(heading, form);
    cancel.addEventListener("click", () => dialog.close());
    dialog.addEventListener("click", (event) => { if (event.target === dialog) dialog.close(); });
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const text = title.value.trim();
      if (!text || text.length > TITLE_MAX) { why.textContent = STARTS.bad_title(); title.focus(); return; }
      if (go.disabled) return;
      go.disabled = true;
      why.textContent = "";
      const words = await submit({ title: text, zone });
      go.disabled = false;
      if (words) why.textContent = words;
      else dialog.close();
    });
    const open = (name) => {
      title.value = `${name}'s chat`.slice(0, TITLE_MAX);
      why.textContent = "";
      choose(first);
      dialog.showModal();
      title.focus();
      title.select();
    };
    return { node: dialog, open, close: () => dialog.close(), get zone() { return zone; } };
  };

  // The chunk's own stylesheet (scripts/ooga-chat.mjs), linked once; from source it is on the page already.
  const style = BL.oogaChatScripts && BL.oogaChatScripts["hosts.css"];
  if (style && typeof document !== "undefined" && !document.querySelector(`link[href="${style}"]`)) {
    const link = document.createElement("link");
    Object.assign(link, { rel: "stylesheet", href: style });
    document.head.append(link);
  }

  const create = (ctx, { node, head, space, zone: firstZone = "main" }) => {
    const { make, button, set, attr } = BL.oogaChatViews.kit, chats = ctx.chats;
    const listeners = new AbortController(), { signal } = listeners;
    let state = null, room = null, me = null, rank = "", people = [], timer = 0, shownTimer = 0, askedTimer = 0, askedAt = -Infinity;
    const asked = [], said = new Map(), mine = new Map();
    const nameOf = (id) => people.find((p) => p.id === id)?.display || "Someone";

    // --- the one live region ---
    const notice = make("p", "help oc-chat-notice");
    // Never hidden, so what is written into it is announced; empty, it takes no room (ooga-chat.css).
    notice.setAttribute("role", "status");
    const say = (text) => {
      if (!text) return;
      said.set(text, Date.now());
      notice.textContent = text;
      clearTimeout(shownTimer);
      shownTimer = setTimeout(() => { notice.textContent = ""; }, SHOWN_MS);
    };
    const flushAsked = () => {
      askedTimer = 0;
      if (!asked.length) return;
      askedAt = Date.now();
      say(joinNames(asked.splice(0).map(nameOf)));
    };

    // --- the Chats list ---
    const startOpen = button("foot-button foot-primary", "Start a chat");
    const listHead = make("div", "oc-chats-head", make("span", "section-head", "Live chats"), startOpen);
    const rows = make("ul", "oc-chats-list"), listNote = make("p", "oc-chats-note"), again = button("link", "Try again");
    again.hidden = true;
    const listStatus = make("p", "oc-chats-status", listNote, " ", again);
    listStatus.setAttribute("role", "status");
    const list = make("div", "slab oc-slab oc-chats", listHead, rows, listStatus);
    let entries = null, reading = false, readAt = -Infinity;
    const faces = new Map();
    const faceOf = (character) => {
      if (!character) return "";
      if (faces.has(character)) return faces.get(character);
      const canvas = BL.oogaChatPortraits.canvas(character.toLowerCase());
      if (!canvas) return "";
      const url = canvas.toDataURL("image/png");
      faces.set(character, url);
      return url;
    };
    listeners.signal.addEventListener("abort", BL.oogaChatPortraits.onChange(() => { faces.clear(); drawList(); }), { once: true });
    const drawList = () => {
      const github = state?.session?.identity.provider === "github";
      startOpen.hidden = !github;
      if (!entries) { rows.replaceChildren(); return; }
      rows.replaceChildren(...entries.map((c) => {
        const face = make("span", "cloud-portrait"), url = faceOf(c.host.character);
        if (url) { const img = make("img", ""); img.alt = ""; img.src = url; face.append(img); } else face.append(BL.nativeIcons.svg("roster"));
        const pick = tap("oc-chat-row", face, make("span", "oc-chat-row-text", make("span", "oc-chat-row-title", c.title),
          make("span", "oc-chat-row-host", `Hosted by ${c.host.display}`), make("span", "oc-chat-row-count", `${c.speakers} speaking · ${c.listeners} listening`)),
        make("span", "panel-chip", ZONE_NAMES[c.zone]));
        pick.addEventListener("click", () => chats.open(c));
        return make("li", "", pick);
      }));
      set(listNote, "textContent", entries.length ? "" : github ? "Nobody is chatting right now. Start one and others can join." : "Nobody is chatting right now. A contributor can start one; you can join and ask to speak.");
    };
    const read = async (force = false) => {
      if (reading || !force && Date.now() - readAt < LIST_MS) return;
      reading = true;
      readAt = Date.now();
      const answer = await chats.list().catch(() => ({ chats: null }));
      reading = false;
      if (listeners.signal.aborted) return;
      const parsed = parseList(answer.chats);
      if (parsed) entries = parsed;
      again.hidden = !!parsed;
      if (!parsed) set(listNote, "textContent", entries ? "The list may be out of date: it couldn't be read." : "The chats couldn't be read.");
      drawList();
    };
    again.addEventListener("click", () => read(true), { signal });
    // Read while the list shows, the panel is the visible tab and the page is visible; nothing runs otherwise.
    const watching = () => !document.hidden && !!state && !room && !!state.session && !node.closest("[hidden]");
    const watch = () => {
      if (!watching()) { clearInterval(timer); timer = 0; return; }
      if (!timer) { read(); timer = setInterval(() => read(), LIST_MS); }
    };
    document.addEventListener("visibilitychange", watch, { signal });
    const observer = new MutationObserver(watch);
    const starter = startDialog({ zone: firstZone, submit: async (body) => {
      const answer = await chats.start(body);
      if (listeners.signal.aborted) return "";
      if (!answer.chat) return (STARTS[answer.code] || (() => "The chat couldn't start. Try again."))(answer.retryAfter);
      const entry = parseEntry({ ...answer.chat, host: { login: state.session.identity.login } });
      if (entry) chats.open(entry);
      return "";
    } });
    startOpen.addEventListener("click", () => starter.open(state.session.identity.display), { signal });
    starter.node.addEventListener("close", () => { if (!room && startOpen.isConnected && !startOpen.hidden) startOpen.focus(); }, { signal });

    // --- in a chat: its bar, the invite card and the footer's own buttons ---
    const back = button("link oc-room-back", "Back to chats"), roomTitle = make("span", "oc-room-title"), requests = button("panel-chip oc-requests", "");
    back.addEventListener("click", () => chats.leave(), { signal });
    const bar = make("div", "oc-room-bar", back, roomTitle, requests);
    const inviteHead = make("strong", "", "A host invited you to speak"), startSpeaking = button("foot-button foot-primary", "Start speaking"), notNow = button("foot-button", "Not now");
    inviteHead.id = "oc-invite-head";
    const invite = make("div", "slab oc-invite", inviteHead, make("span", "oc-invite-note", "You'll join muted. Unmute when you're ready."), make("span", "oc-invite-go", startSpeaking, notNow));
    Object.assign(invite, { hidden: true, tabIndex: -1 });
    invite.setAttribute("role", "dialog");
    invite.setAttribute("aria-labelledby", inviteHead.id);
    let inviteShown = false, inviteTimer = 0;
    const send = (type, fields = {}, after = null) => {
      const id = chats.request(type, fields);
      if (!id) { say("Not connected. Try again in a moment."); return 0; }
      mine.set(id, after);
      return id;
    };
    startSpeaking.addEventListener("click", () => ctx.actions.joinVoice(), { signal });
    notNow.addEventListener("click", () => send("decline"), { signal });
    invite.addEventListener("keydown", (event) => { if (event.key === "Escape") { event.preventDefault(); send("decline"); } }, { signal });
    const foot = space.parts.foot;
    const ask = button("foot-button cloud-voice oc-ask", "Request to speak"), end = button("foot-button oc-end", "End chat"), leave = button("link oc-leave", "Leave");
    let asking = 0;
    ask.addEventListener("click", () => {
      if (asking) return;
      asking = send(room?.you?.request === "asked" ? "cancel" : "ask", {}, () => { asking = 0; paint(); });
      paint();
    }, { signal });
    leave.addEventListener("click", () => chats.leave(), { signal });
    foot.join.after(ask, end, leave);

    // --- pop-ups: a tile's menu, the queue, a confirmation ---
    const pop = make("div", "oc-pop");
    pop.hidden = true;
    let anchor = null, popKind = "";
    const closePop = (refocus = true) => {
      if (pop.hidden) return;
      pop.hidden = true;
      pop.replaceChildren();
      popKind = "";
      const to = anchor;
      anchor = null;
      if (refocus && to && to.isConnected) to.focus();
    };
    const place = () => {
      if (pop.hidden || !anchor) return;
      if (matchMedia("(max-width: 399px)").matches) { pop.style.removeProperty("top"); pop.style.removeProperty("left"); return; }
      const a = anchor.getBoundingClientRect(), w = pop.offsetWidth, h = pop.offsetHeight;
      pop.style.left = `${Math.max(8, Math.min(innerWidth - w - 8, a.left + a.width / 2 - w / 2))}px`;
      pop.style.top = `${a.bottom + h + 8 > innerHeight ? Math.max(8, a.top - h - 6) : a.bottom + 6}px`;
    };
    // `items`: `{ label, run, primary }`; `heading` names it, `role` menu or dialog.
    const openPop = (kind, at, heading, items, role = "menu", focus = true) => {
      closePop(false);
      anchor = at;
      popKind = kind;
      pop.setAttribute("role", role);
      pop.setAttribute("aria-label", heading);
      const slab = make("div", "slab oc-pop-slab");
      slab.append(make("p", "oc-pop-head", heading));
      for (const item of items) {
        if (item.node) { slab.append(item.node); continue; }
        const el = button(`foot-button${item.primary ? " foot-primary" : ""}`, item.label);
        if (role === "menu") el.setAttribute("role", "menuitem");
        if (item.name) el.setAttribute("aria-label", item.name);
        el.addEventListener("click", item.run);
        slab.append(el);
      }
      pop.replaceChildren(slab);
      pop.hidden = false;
      place();
      if (focus) pop.querySelector("button")?.focus();
    };
    pop.addEventListener("keydown", (event) => {
      if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); return closePop(); }
      if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
      const all = [...pop.querySelectorAll("button")], at = all.indexOf(document.activeElement);
      if (!all.length) return;
      event.preventDefault();
      all[(at + (event.key === "ArrowDown" ? 1 : -1) + all.length) % all.length].focus();
    }, { signal });
    document.addEventListener("pointerdown", (event) => { if (!pop.hidden && !pop.contains(event.target) && !anchor?.contains(event.target)) closePop(false); }, { signal, capture: true });
    addEventListener("resize", place, { signal });
    const confirm = (at, words, label, run) => openPop("confirm", at, words, [{ label, primary: true, run: () => { closePop(); run(); } }, { label: "Cancel", run: () => closePop() }], "dialog");
    const menu = (id, tile) => {
      const row = people.find((p) => p.id === id);
      if (!room || !row) return;
      const items = actionsFor({ id: me, rank }, row);
      if (!items.length) return;
      openPop(`menu:${id}`, tile, row.display, items.map((a) => ({ label: a.label, run: () => {
        const fields = { id, ...(a.on === undefined ? {} : { on: a.on }) };
        if (a.confirm) return confirm(tile, a.confirm, a.label, () => send(a.type, fields));
        closePop();
        send(a.type, fields);
      } })));
    };
    space.setMenu(menu);
    const queue = () => people.filter((p) => p.request === "asked").sort((a, b) => a.askedAt - b.askedAt);
    let queued = "";
    // Drawn again only when who waits changes; the focus moves only on opening, or when the row that held it went.
    const openQueue = (opening = true) => {
      const waiting = queue(), now = waiting.map((p) => `${p.id} ${p.display}`).join();
      if (!opening && now === queued) return;
      queued = now;
      const held = !opening && pop.contains(document.activeElement);
      openPop("queue", requests, "Requests to speak", waiting.length ? waiting.map((p) => {
        // Stone, every row alike: a queue of many has no one amber action.
        const approve = button("foot-button", "Approve"), decline = button("foot-button", "Decline");
        approve.setAttribute("aria-label", `Approve ${p.display}`);
        decline.setAttribute("aria-label", `Decline ${p.display}`);
        approve.addEventListener("click", () => send("answer", { id: p.id, approve: true }));
        decline.addEventListener("click", () => send("answer", { id: p.id, approve: false }));
        const name = make("span", "oc-queue-name", p.display);
        name.title = p.display;
        return { node: make("div", "oc-queue-row", name, approve, decline) };
      }) : [{ node: make("p", "oc-pop-note", "No requests right now.") }], "dialog", opening);
      if (held && !pop.contains(document.activeElement)) (pop.querySelector("button") || requests).focus();
    };
    requests.addEventListener("click", () => popKind === "queue" ? closePop() : openQueue(true), { signal });
    end.addEventListener("click", () => confirm(end, "End this chat for everyone?", "End chat", () => send("end")), { signal });

    // What the chat says: notices, and answers to this page's own requests.
    const off = chats.hear((msg) => {
      if (msg.type === "result") {
        if (!mine.has(msg.requestId)) return;
        const after = mine.get(msg.requestId);
        mine.delete(msg.requestId);
        if (!msg.ok) say((REFUSED[msg.error?.code] || (() => "That didn't work. Try again."))(msg.error?.retryAfter));
        after?.();
        return;
      }
      if (msg.kind === "asked") {
        if (!asked.includes(msg.id)) asked.push(msg.id);
        if (!askedTimer) askedTimer = setTimeout(flushAsked, Math.max(0, askedAt + ASKED_MS - Date.now()));
        return;
      }
      const text = noticeText(msg, me, nameOf);
      // A chat that ended or removed the visitor says so once: its notice, then its socket's close.
      if (msg.left && Date.now() - (said.get(text) || -Infinity) < SHOWN_MS) return;
      say(text);
    });

    // Where everything stands, from the app's state.
    const paint = () => {
      const r = room, you = r?.you || {}, speaker = state.voice.role === "speaker" || state.voice.busy;
      const may = you.speak === "eligible" || you.speak === "pending" || you.speak === "active" || !!state.voice.elsewhere;
      foot.join.hidden = !r || !speaker && !may;
      foot.mute.hidden = !r;
      ask.hidden = !r || speaker || may;
      set(ask, "textContent", you.request === "asked" ? "Requested · Cancel" : "Request to speak");
      set(ask, "disabled", !!asking || !state.device.online);
      attr(ask, "aria-pressed", String(you.request === "asked"));
      end.hidden = !r || you.rank !== "host";
      leave.hidden = !r;
      const manager = !!LEVEL[you.rank];
      requests.hidden = !r || !manager;
      if (manager) set(requests, "textContent", `Requests ${queue().length}`);
      if (!manager && popKind === "queue") closePop(false);
      if (popKind === "queue") openQueue(false);
      if (popKind.startsWith("menu:") && !people.some((p) => p.id === popKind.slice(5))) closePop(false);
      // The invite card, while invited, until its time runs out (the server says so too).
      set(startSpeaking, "disabled", state.voice.busy || you.speak !== "eligible");
      const invited = !!r && you.request === "invited" && !speaker && (you.inviteUntil || Infinity) > Date.now();
      invite.hidden = !invited;
      clearTimeout(inviteTimer);
      if (invited && you.inviteUntil) inviteTimer = setTimeout(paint, you.inviteUntil - Date.now() + 50);
      if (invited && !inviteShown) (startSpeaking.disabled ? invite : startSpeaking).focus();
      inviteShown = invited;
    };
    const update = (next) => {
      state = next;
      const was = room;
      room = next.room && next.session ? next.room : null;
      if (room !== was) { closePop(false); asked.length = 0; clearTimeout(askedTimer); askedTimer = 0; mine.clear(); asking = 0; }
      if (!was && room) { readAt = -Infinity; }
      me = next.session?.identity.participant || null;
      rank = room?.you?.rank || "";
      people = next.audience.list;
      set(roomTitle, "textContent", room ? room.title : "");
      set(roomTitle, "title", room ? room.title : "");
      bar.hidden = !room;
      list.hidden = !!room;
      paint();
      if (!room) drawList();
      watch();
    };
    let observing = false;
    const attach = () => {
      if (observing || !node.parentElement) return;
      observing = true;
      observer.observe(node.parentElement, { attributes: true, attributeFilter: ["hidden"] });
    };
    head.after(bar, notice, list);
    // Room for a strip over the roster (a later view of the chat's own island); empty and hidden for now.
    const strip = make("div", "oc-room-strip");
    strip.hidden = true;
    space.parts.list.before(strip);
    node.append(starter.node);
    space.parts.footRow.before(invite);
    node.append(pop);
    const dispose = () => {
      listeners.abort();
      observer.disconnect();
      clearInterval(timer);
      clearTimeout(shownTimer);
      clearTimeout(askedTimer);
      clearTimeout(inviteTimer);
      off();
      space.setMenu(null);
      for (const el of [bar, notice, list, strip, invite, pop, ask, end, leave, starter.node]) el.remove();
    };
    return { update: (next) => { attach(); update(next); }, dispose };
  };
  BL.oogaChatHosts = { create, startDialog, parseEntry, parseList, actionsFor, noticeText, joinNames, REFUSED, STARTS, LIST_MS, ASKED_MS };
})();
