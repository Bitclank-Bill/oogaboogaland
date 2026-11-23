// Ooga Chat's hosted chats (docs/ooga-chat-hosts.md), in a chunk of its own (`hosts`, ooga-chat-chunks.js), asked for
// once a signed-in account's service offers them: the island's shared views (chat-hosts.js, which the island's cloud tab
// draws with too) over the Ooga Chat tab (ooga-chat-views.js `chat`), with what only the app knows: its chats and
// voice (`ctx.chats`, `ctx.actions.joinVoice`), its hosts' faces from the face sheet (ooga-chat-portraits.js) and the
// chunk's own stylesheet, linked once (scripts/ooga-chat.mjs; from source it is on the page already). Start a chat
// chooses Main Island first. `create(ctx, { node, head, space })` returns `{ update(state), dispose() }`.
(() => {
  "use strict";
  const BL = window.BL = window.BL || {};
  const style = BL.oogaChatScripts && BL.oogaChatScripts["hosts.css"];
  if (style && typeof document !== "undefined" && !document.querySelector(`link[href="${style}"]`)) {
    const link = document.createElement("link");
    Object.assign(link, { rel: "stylesheet", href: style });
    document.head.append(link);
  }
  const faces = new Map();
  const faceOf = (character) => {
    if (faces.has(character)) return faces.get(character);
    const canvas = BL.oogaChatPortraits.canvas(character.toLowerCase());
    if (!canvas) return "";
    const url = canvas.toDataURL("image/png");
    faces.set(character, url);
    return url;
  };
  const create = (ctx, { node, head, space }) => {
    const view = BL.chatHosts.create({ node, head, space, chats: ctx.chats, joinVoice: () => ctx.actions.joinVoice(), faceOf });
    const off = BL.oogaChatPortraits.onChange(() => { faces.clear(); view.redraw(); });
    return { update: view.update, dispose() { off(); view.dispose(); } };
  };
  BL.oogaChatHosts = { create };
})();
