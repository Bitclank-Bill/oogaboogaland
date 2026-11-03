// Genesis museum: the Bitcoin Guide hall, bitcoinguide.app (Bitclank Bill's site) walked through in the atrium round the
// shrine, from its own content (genesis-guide-data.js, baked by scripts/bitcoin-guide-data.mjs):
//   - the twelve essays as glowing cubes in their own colours, floating round the inside of the courtyard's ring path,
//     each over a lit medallion: Space there, or a tap on the cube, opens the whole essay to read, with its PDF, its
//     video reel and the site;
//   - the resource library, a wall of coloured binders, one for each of the site's resource sections, and two for its
//     guides (self-custody, the air-gapped laptop): a tap on a binder opens its section with every link;
//   - the reading list, a bookshelf of Bitclank Bill's books and the further reading;
//   - the video essays, a big screen running each essay's slide deck, its reels a tap away;
//   - This Week in Bitcoin, a kiosk with the live chain and the site's weekly news;
//   - the dice-roll and passphrase stations, where Space rolls real-looking dice and the screen keeps the tally and
//     explains the entropy, the site's own steps a tap away (for learning: never a real seed made in a game);
//   - the learning paths signpost, the site's four tracks and its sections: the place to start.
//
// `layout()` (pure, so Node can check it): the stations, the cubes and the boxes a walker meets. `build(...)` builds it
// all once a visit and returns { update(dt, calm, at), stations, targets }: `stations` are the scene's props (where
// to stand, what Space does: `act`, or the board to open: `board()`), `targets` the tap targets (`node`, `open`).
// update allocates nothing and repaints a screen only when what it shows has changed.
(() => {
  "use strict";
  const BL = window.BL = window.BL || {};
  const SITE = "https://bitcoinguide.app";
  const CUBE_R = 16, CUBE_Y = 3.6, ROLL_S = 1.1;
  // The stations round the courtyard, in the atrium's frame (+z toward the arrival): where each stands, its facing
  // (`ry`, its front's direction), the box it fills and where a visitor stands to use it.
  const STATIONS = [
    { id: "library", x: 24, z: -35.6, ry: 0, w: 10.6, d: 0.9, reach: 4.2, hint: "the resource library: every link from bitcoinguide.app" },
    { id: "books", x: -11, z: -35.6, ry: 0, w: 8, d: 0.9, reach: 3.6, hint: "Bitclank Bill's reading list" },
    { id: "videos", x: -29.6, z: 0, ry: Math.PI / 2, w: 5.8, d: 0.8, reach: 3.2, hint: "the video essays" },
    { id: "news", x: 29.6, z: 0, ry: -Math.PI / 2, w: 5.8, d: 0.8, reach: 3.2, hint: "This Week in Bitcoin" },
    { id: "dice", x: -22.6, z: 30, ry: Math.PI / 2, w: 3.2, d: 1.8, reach: 2.6, hint: "roll the dice: entropy for a seed (tap the screen for the guide)" },
    { id: "passphrase", x: 22.6, z: 30, ry: -Math.PI / 2, w: 3.2, d: 1.8, reach: 2.6, hint: "roll five dice: a passphrase word (tap the screen for the guide)" },
    { id: "paths", x: 16, z: 33, ry: 0, w: 0.6, d: 0.6, reach: 2.4, hint: "start here: the Bitcoin Guide's learning paths" },
    { id: "live", x: 22, z: 22, ry: -1.04, w: 4.6, d: 1.4, reach: 3.4, hint: "the Bitcoin network, live, and its tools" }
  ];
  const layout = () => {
    const stations = STATIONS.map((s) => {
      const turned = Math.abs(Math.sin(s.ry)) > 0.5, hx = (turned ? s.d : s.w) / 2, hz = (turned ? s.w : s.d) / 2, f = s.d / 2 + 1.6;
      return { ...s, box: { x0: s.x - hx, x1: s.x + hx, z0: s.z - hz, z1: s.z + hz }, at: { x: s.x + Math.sin(s.ry) * f, z: s.z + Math.cos(s.ry) * f } };
    });
    const cubes = [];
    for (let k = 0; k < 12; k++) { const a = (k * 30 + 15) * Math.PI / 180; cubes.push({ k, a, x: Math.sin(a) * CUBE_R, z: Math.cos(a) * CUBE_R }); }
    // Rock beanbags in front of the rock TV, to sit on and watch it (`seat`: where an Ooga sits and the way it faces).
    // (In the TV's own frame, turned with it: across its front, 3.6 m out, each turned a little toward its middle.)
    const tv = stations.find((s) => s.id === "live"), c = Math.cos(tv.ry), sn = Math.sin(tv.ry), seats = [-1.9, 0, 1.9].map((dx, i) => {
      const dz = 3.6 + (i === 1 ? 0.4 : 0), x = tv.x + dx * c + dz * sn, z = tv.z - dx * sn + dz * c;
      return { i, x, z, ry: tv.ry + Math.PI + Math.atan2(-dx * 0.3, 3.6), box: { x0: x - 0.55, x1: x + 0.55, z0: z - 0.55, z1: z + 0.55 }, at: { x: x + sn * 1.1, z: z + c * 1.1 } };
    });
    return { stations, cubes, seats, boxes: [...stations.map((s) => s.box), ...seats.map((q) => q.box)] };
  };

  // ---- Boards: the site's content as pages ({ caption, title, text, links }) for the scene's panel.
  const link = (href, label) => ({ href: /^https?:/.test(href) ? href : `${SITE}${href}`, label: `${label} ↗` });
  const CHUNK = 720;
  // An essay's blocks as pages of about CHUNK characters, each page under the heading it falls in.
  const essayPages = (e) => {
    const pages = [], head = (t) => t, base = [link(e.pdf, "The essay as a PDF"), link("/literature", "All the essays at bitcoinguide.app")];
    if (e.reel) base.push(link(e.reel, "Watch its video reel"));
    pages.push({ caption: e.title, title: e.title, text: [e.description, `${e.text.length} parts · read on, or open the PDF below.`], links: base, accent: e.accent, paint: picPaint(`essay:${e.title}`) });
    let title = e.title, text = [], n = 0;
    const flush = () => { if (text.length) pages.push({ caption: e.title, title, text, links: base, accent: e.accent }); text = []; n = 0; };
    for (const [k, t] of e.text) {
      if (k === "h") { flush(); title = head(t); continue; }
      const line = k === "b" ? `• ${t}` : t;
      if (n + line.length > CHUNK && text.length) { flush(); }
      text.push(line); n += line.length;
    }
    flush();
    return pages;
  };
  // Pictures for the board's pages (scene-genesis.js paintPage draws a page's `paint` on its right half): a card for
  // a resource (its section's colour, a play mark for a video, its initials and where it lives), dice, word tiles.
  const host = (url) => { const m = /^https?:\/\/(?:www\.)?([^/]+)/.exec(url || ""); return m ? m[1] : "bitcoinguide.app"; };
  const isVideo = (url) => /youtu|\.mp4|vimeo|rumble/.test(url || "");
  const roundRect = (g, x, y, w, h, r) => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); };
  // The site's own pictures (genesis-guide-thumbs.js, baked from bitcoinguide.app): one Image a key, made the first
  // time it is asked for (the hall's build asks for them all, so they are decoded before a board opens).
  const THUMBS = new Map();
  const thumb = (key) => {
    const T = BL.bitcoinGuideThumbs;
    if (!T || !T[key]) return null;
    let im = THUMBS.get(key);
    if (!im) { im = new Image(); im.src = T[key]; THUMBS.set(key, im); }
    return im.complete && im.naturalWidth ? im : null;
  };
  // A picture fitted whole into a rounded frame (letterboxed on dark), or false while it has none.
  const drawThumb = (g, im, cx, cy, cw, ch) => {
    g.save(); roundRect(g, cx, cy, cw, ch, 18); g.fillStyle = "#0d0c0a"; g.fill(); g.clip();
    const k = Math.min(cw / im.naturalWidth, ch / im.naturalHeight), iw = im.naturalWidth * k, ih = im.naturalHeight * k;
    g.drawImage(im, cx + (cw - iw) / 2, cy + (ch - ih) / 2, iw, ih);
    g.restore(); roundRect(g, cx, cy, cw, ch, 18); g.strokeStyle = "rgba(255,255,255,0.35)"; g.lineWidth = 3; g.stroke();
  };
  const picPaint = (key, otherwise) => (g, x0, y0, w, h) => {
    const im = thumb(key);
    if (!im) { if (otherwise) otherwise(g, x0, y0, w, h); return; }
    const pad = 24, cw = w - pad * 2, ch = Math.min(h - pad * 2 - 40, cw * 0.75);
    drawThumb(g, im, x0 + pad, y0 + 60, cw, ch);
  };
  const cardPaint = (title, url, ink, key) => (g, x0, y0, w, h) => {
    const pad = 24, cw = w - pad * 2, ch = Math.min(h - pad * 2, cw * 0.62), cx = x0 + pad, cy = y0 + 60;
    const im = key ? thumb(key) : null;
    if (im) {
      drawThumb(g, im, cx, cy, cw, ch);
      if (isVideo(url)) { g.beginPath(); g.arc(cx + cw - 46, cy + 46, 28, 0, 7); g.fillStyle = "rgba(0,0,0,0.55)"; g.fill(); g.beginPath(); g.moveTo(cx + cw - 54, cy + 32); g.lineTo(cx + cw - 54, cy + 60); g.lineTo(cx + cw - 30, cy + 46); g.closePath(); g.fillStyle = "#fff"; g.fill(); }
      g.font = "20px sans-serif"; g.fillStyle = "#f6ecd2"; g.textAlign = "center"; g.textBaseline = "top";
      if (url) g.fillText(`${isVideo(url) ? "video · " : ""}${host(url)}`, cx + cw / 2, cy + ch + 12);
      g.textAlign = "left"; g.textBaseline = "top";
      return;
    }
    const grd = g.createLinearGradient(cx, cy, cx + cw, cy + ch); grd.addColorStop(0, ink); grd.addColorStop(1, "#14110d");
    roundRect(g, cx, cy, cw, ch, 18); g.fillStyle = grd; g.fill();
    g.strokeStyle = "rgba(255,255,255,0.35)"; g.lineWidth = 3; g.stroke();
    const words = String(title).replace(/[^A-Za-z0-9 ]/g, " ").split(/\s+/).filter(Boolean), init = (words[0] ? words[0][0] : "B") + (words[1] ? words[1][0] : "");
    g.fillStyle = "rgba(255,255,255,0.92)"; g.font = `bold ${Math.round(ch * 0.36)}px sans-serif`; g.textAlign = "center"; g.textBaseline = "middle";
    g.fillText(init.toUpperCase(), cx + cw / 2, cy + ch * 0.45);
    if (isVideo(url)) { g.beginPath(); g.arc(cx + cw - 46, cy + 46, 28, 0, 7); g.fillStyle = "rgba(0,0,0,0.55)"; g.fill(); g.beginPath(); g.moveTo(cx + cw - 54, cy + 32); g.lineTo(cx + cw - 54, cy + 60); g.lineTo(cx + cw - 30, cy + 46); g.closePath(); g.fillStyle = "#ffffff"; g.fill(); }
    g.font = "20px sans-serif"; g.fillStyle = "#f6ecd2"; g.fillText(`${isVideo(url) ? "video · " : ""}${host(url)}`, cx + cw / 2, cy + ch - 24);
    g.textAlign = "left"; g.textBaseline = "top";
  };
  const diceFace = (g, x, y, s, v) => {
    roundRect(g, x, y, s, s, s * 0.18); g.fillStyle = "#f4efe4"; g.fill();
    const P = { 1: [[0, 0]], 2: [[-1, -1], [1, 1]], 3: [[-1, -1], [0, 0], [1, 1]], 4: [[-1, -1], [1, -1], [-1, 1], [1, 1]], 5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]], 6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]] };
    g.fillStyle = v === 1 ? "#c0392b" : "#1b1d22";
    for (const [a, b] of P[v]) { g.beginPath(); g.arc(x + s / 2 + a * s * 0.26, y + s / 2 + b * s * 0.26, s * 0.09, 0, 7); g.fill(); }
  };
  const dicePaint = (vals) => (g, x0, y0, w) => { const s = Math.min(90, (w - 60) / vals.length - 12); vals.forEach((v, i) => diceFace(g, x0 + 30 + i * (s + 12), y0 + 80, s, v)); };
  const wordsPaint = (pairs) => (g, x0, y0, w) => {
    pairs.forEach(([n, word], i) => { const y = y0 + 70 + i * 74; roundRect(g, x0 + 30, y, w - 60, 60, 12); g.fillStyle = "#1f3a2a"; g.fill(); g.strokeStyle = "#16a34a"; g.lineWidth = 2; g.stroke();
      g.fillStyle = "#7dffb0"; g.font = "bold 26px monospace"; g.fillText(n, x0 + 50, y + 16); g.fillStyle = "#f6ecd2"; g.font = "bold 28px sans-serif"; g.fillText(word, x0 + 190, y + 15); });
  };
  // A section of the resources page: an opening page with what it holds, then a page for each resource, its card on
  // the right and one clear link to it under the window (the arrows go on to the next).
  const NEXT = "Arrows: the next resource · the link opens in a new tab";
  const sectionPages = (s) => [
    { caption: "Resources", title: s.title, accent: s.color, note: `${s.links.length} resources · arrows to go through them`,
      text: [s.subtitle || `${s.links.length} resources`, ...s.links.map((l, i) => `${i + 1}. ${l.title}`)].slice(0, 12), links: [link("/resources", "The resources page at bitcoinguide.app")], paint: cardPaint(s.title, "", s.color) },
    ...s.links.map((l, i) => ({ caption: `${s.title} · ${i + 1} of ${s.links.length}`, title: l.title, accent: s.color, note: NEXT, text: [l.description || `One of the ${s.title} resources at bitcoinguide.app.`, s.noLinks ? "Read the notes on bitcoinguide.app before trusting a device with your keys." : ""].filter(Boolean),
      links: s.noLinks || !l.url ? [link("/resources", "Read about it at bitcoinguide.app")] : [link(l.url, `Open: ${l.title.length > 56 ? `${l.title.slice(0, 54)}…` : l.title}`)], paint: cardPaint(l.title, l.url, s.color, `res:${l.title}`) }))
  ];
  const sectionPage = (s) => ({ caption: "Resources", title: s.title, accent: s.color,
    text: [s.subtitle || `${s.links.length} resources`, ...s.links.map((l) => `${l.title}${l.description ? `: ${l.description}` : ""}`)].slice(0, 9),
    links: s.noLinks ? [link("/resources", "The resources page")] : [...s.links.map((l) => link(l.url, l.title.length > 60 ? `${l.title.slice(0, 58)}…` : l.title)), link("/resources", "The resources page")] });
  const guidePage = (title, blocks, href) => {
    const pages = [];
    let head = title, text = [], n = 0;
    const flush = () => { if (text.length) pages.push({ caption: title, title: head, text, links: [link(href, "The guide at bitcoinguide.app")] }); text = []; n = 0; };
    for (const [k, t] of blocks) {
      if (k === "h") { flush(); head = t; continue; }
      const line = k === "b" ? `• ${t}` : t;
      if (n + line.length > CHUNK && text.length) flush();
      text.push(line); n += line.length;
    }
    flush();
    return pages;
  };
  const stepText = (s) => [s.text, s.bold, s.code, s.link && s.link.label, s.after].filter(Boolean).join(" ").replace(/\s+([.,])/g, "$1");
  const BOARDS = {
    essay: (D, i) => ({ room: `${D.essays[i].title} - Bitcoin Guide`, pages: essayPages(D.essays[i]), sources: [] }),
    library: (D) => ({ room: "Resource library - Bitcoin Guide", sources: [], pages: [
      { caption: "Resources", title: "The resource library", note: "Tap a binder to open its section", text: ["Everything to buy, store and understand Bitcoin, from bitcoinguide.app/resources: every binder on the shelf is one of its sections.", ...D.sections.map((x) => `${x.title} (${x.links.length})`)].slice(0, 14), links: [link("/resources", "The resources page at bitcoinguide.app")] },
      ...D.sections.map(sectionPage)
    ] }),
    section: (D, i) => ({ room: `${D.sections[i].title} - Bitcoin Guide`, pages: sectionPages(D.sections[i]), sources: [] }),
    live: (D) => {
      const charts = D.sections.find((x) => /Charts/.test(x.title));
      return { room: "The network, live - Bitcoin Guide", sources: [], pages: [
        { caption: "Live", title: "The Bitcoin network, live", note: "The screen reads mempool.space · the links open the tools", text: ["The screen shows the real network as it is now: block height, hashrate, fees and the mempool, the difficulty epoch, the bitcoin mined so far and the price.", "Watch it live, block by block, with the tools below."],
          links: [link("https://mempool.space", "mempool.space: blocks, fees and the mempool"), link("https://timechaincalendar.com/en", "Timechain Calendar"), link("https://bitcoin.clarkmoody.com/dashboard/", "Clark Moody's Bitcoin dashboard"), link("https://btcframe.com/dashboard/", "BTCFrame dashboard")], paint: cardPaint("Live", "https://mempool.space", "#f7931a") },
        ...(charts ? sectionPages(charts) : [])
      ] };
    },
    guide: (D, id) => id === "airGapped"
      ? { room: "Air-gapped laptop guide - Bitcoin Guide", pages: guidePage("Build an air-gapped laptop", D.guides.airGapped || [], "/resources"), sources: [] }
      : { room: "Self-custody guide - Bitcoin Guide", pages: guidePage("Cold storage and self-custody", D.guides.coldStorage || [], "/resources"), sources: [] },
    books: (D) => ({ room: "Reading list - Bitcoin Guide", sources: [], pages: [
      { caption: "Reading list", title: "Bitclank Bill's reading list", paint: picPaint("reading"), text: D.readingList.map((b) => `${b.title}, ${b.author}`), links: [link("/literature#reading-list", "The reading list at bitcoinguide.app")] },
      ...D.further.map((f) => ({ caption: "Further reading", title: f.title, text: [f.author ? `by ${f.author}` : "Further reading", f.description].filter(Boolean),
        links: (f.links.length ? f.links : [{ label: f.title, url: f.url }]).filter((l) => l.url).map((l) => link(l.url, l.label || f.title)) }))
    ] }),
    videos: (D) => ({ room: "Video essays - Bitcoin Guide", sources: [], pages: D.essays.map((e) => ({ caption: "Video essays", title: e.title, accent: e.accent, paint: picPaint(`video:${e.title}`, picPaint(`essay:${e.title}`)),
      text: [e.description, ...e.slides.map((s) => `${s.title}${s.subtitle ? ` · ${s.subtitle}` : ""}`)].slice(0, 9),
      links: [...(e.reel ? [link(e.reel, "Watch the reel")] : []), link("/video-essays", "All the video essays"), link(e.pdf, "Read the essay")] })) }),
    news: (D) => {
      const x = D.sections.find((s) => /X Accounts/.test(s.title));
      return { room: "This Week in Bitcoin - Bitcoin Guide", sources: [], pages: [
        { caption: "This Week in Bitcoin", title: "This Week in Bitcoin", text: ["Current events from X, hot topics and news, fresh every Sunday at bitcoinguide.app.", "The kiosk's screen shows the network live: block height, fees, hashrate and price, read from mempool.space."], links: [link("/this-week", "This week's news"), link("/faq", "Ask the AI FAQ")] },
        ...(x ? sectionPages(x) : [])
      ] };
    },
    dice: (D) => ({ room: "Dice rolls and entropy - Bitcoin Guide", sources: [], pages: [
      { caption: "Dice rolls", title: "Why dice?", paint: picPaint("dice", dicePaint([5, 2, 3, 1, 4, 6])), note: "Arrows page through the guide", text: ["A seed phrase is only as safe as the randomness behind it. Dice you roll yourself are randomness you can see and trust.", "Each roll of a six-sided die adds about 2.585 bits. A 24-word seed holds 256 bits: about 99 to 100 rolls.", "The station here rolls for fun and learning only. Never make a real seed from a website or a game."], links: [link("/dice-entropy", "The full guide at bitcoinguide.app")] },
      { caption: "Dice rolls", title: "The steps", paint: dicePaint([1, 2, 3, 4, 5, 6]), note: "Arrows page through the guide", text: (D.dice.steps || []).map((s) => `${s.n}. ${stepText(s)}${s.sub ? ` ${s.sub.join(" ")}` : ""}`), links: [link("/dice-entropy", "Dice rolls & entropy"), link("https://iancoleman.io/bip39/", "iancoleman.io/bip39 (run it offline)")] },
      { caption: "Dice rolls", title: "Notes", paint: dicePaint([6, 6, 6]), note: "Arrows page through the guide", text: D.dice.notes || [], links: [link("/dice-entropy", "Dice rolls & entropy at bitcoinguide.app"), link("https://github.com/iancoleman/bip39/releases", "Download the BIP39 tool to run offline")] },
      ...guidePage("The dice guide", D.guides.dice || [], "/dice-entropy")
    ] }),
    passphrase: (D) => ({ room: "BIP39 passphrase - Bitcoin Guide", sources: [], pages: [
      { caption: "Passphrase", title: "A passphrase from dice", paint: wordsPaint([["42156", "stumper"], ["?????", "your next word"]]), note: "Arrows page through the guide", text: (D.passphrase.steps || []).map((s) => `${s.n}. ${stepText(s)}`), links: [link("/passphrase", "The passphrase guide"), link("https://www.eff.org/dice", "The EFF dice wordlists")] },
      { caption: "Passphrase", title: "Notes", paint: wordsPaint([["5 words", "about 51 bits"], ["6 words", "about 62 bits"], ["7 words", "about 72 bits"]]), note: "Arrows page through the guide", text: D.passphrase.notes || [], links: [link("/passphrase", "The passphrase guide at bitcoinguide.app"), link("https://www.eff.org/files/2016/07/18/eff_large_wordlist.txt", "The EFF large wordlist")] }
    ] }),
    paths: (D) => ({ room: "Learning paths - Bitcoin Guide", sources: [], pages: [
      { caption: "Bitcoin Guide", title: "A starting point for learning Bitcoin", text: ["Literature: twelve essays on the economics, philosophy and technology of sound money.", "Resources: everything to buy, store and understand Bitcoin.", "This Week: the news, every Sunday.", "Dice Rolls and Passphrase: make your own entropy, offline.", "Video Essays, and the AI FAQ."], links: [link("/", "bitcoinguide.app"), link("/literature", "Literature"), link("/resources", "Resources"), link("/this-week", "This Week"), link("/dice-entropy", "Dice rolls"), link("/passphrase", "Passphrase"), link("/video-essays", "Video essays"), link("/faq", "AI FAQ")] },
      ...D.paths.map((p) => ({ caption: "Learning paths", title: `${p.number}. ${p.title}: ${p.subtitle}`, text: [p.description, ...p.steps.map((s, i) => `${i + 1}. ${s}`)], links: [link("/literature", "The essays")] }))
    ] })
  };

  // ---- Painting: small canvases shown on the stations' screens.
  const isoCube = (g, cx, cy, s, ink) => {
    const top = [[0, -s], [s * 0.87, -s / 2], [0, 0], [-s * 0.87, -s / 2]], left = [[-s * 0.87, -s / 2], [0, 0], [0, s], [-s * 0.87, s / 2]], right = [[s * 0.87, -s / 2], [0, 0], [0, s], [s * 0.87, s / 2]];
    const poly = (pts, c) => { g.fillStyle = c; g.beginPath(); g.moveTo(cx + pts[0][0], cy + pts[0][1]); for (const p of pts) g.lineTo(cx + p[0], cy + p[1]); g.closePath(); g.fill(); };
    poly(top, ink); g.globalAlpha = 0.75; poly(left, ink); g.globalAlpha = 0.55; poly(right, ink); g.globalAlpha = 1;
    g.strokeStyle = "rgba(255,255,255,0.6)"; g.lineWidth = 3; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx, cy + s); g.moveTo(cx, cy); g.lineTo(cx - s * 0.87, cy - s / 2); g.moveTo(cx, cy); g.lineTo(cx + s * 0.87, cy - s / 2); g.stroke();
  };
  const frame = (g, W, H, ink, title) => {
    g.fillStyle = "#07090c"; g.fillRect(0, 0, W, H);
    g.strokeStyle = ink; g.lineWidth = 8; g.strokeRect(10, 10, W - 20, H - 20);
    g.textAlign = "left"; g.textBaseline = "top"; g.fillStyle = ink; g.font = "bold 40px sans-serif"; g.fillText(title, 34, 28);
  };
  const lines = (g, list, x, y, step) => { for (let i = 0; i < list.length; i++) g.fillText(list[i], x, y + i * step); };

  const build = ({ M, createNode, addChild, place, top, label }) => {
    if (BL.bitcoinGuideThumbs) for (const k of Object.keys(BL.bitcoinGuideThumbs)) thumb(k);
    const D = BL.bitcoinGuideData, L = layout(), root = place(createNode({ position: { x: 0, y: top, z: 0 } }));
    const stations = [], targets = [], screens = [];
    const pick = (w, h, d) => ({ verts: [-w / 2, -h / 2, -d / 2, w / 2, -h / 2, -d / 2, w / 2, h / 2, -d / 2, -w / 2, h / 2, -d / 2, -w / 2, -h / 2, d / 2, w / 2, -h / 2, d / 2, w / 2, h / 2, d / 2, -w / 2, h / 2, d / 2], faces: [], lines: [], castShadow: false });
    const screen = (W, H, w) => {
      const canvas = document.createElement("canvas"); canvas.width = W; canvas.height = H;
      const h = w * H / W, face = { verts: [-w / 2, -h / 2, 0, w / 2, -h / 2, 0, w / 2, h / 2, 0, -w / 2, h / 2, 0], faces: [{ i: [0, 1, 2, 3], color: [255, 255, 255], emissive: 0.9 }], lines: [], castShadow: false };
      face.imageSurface = { canvas, version: 1, rect: [-w / 2, -h / 2, w, h] };
      const s = { canvas, face, w, h, key: "" };
      screens.push(s);
      return s;
    };
    const repaint = (s, key, fn) => { if (s.key === key) return; s.key = key; fn(s.canvas.getContext("2d"), s.canvas.width, s.canvas.height); s.face.imageSurface.version++; };
    const sign = (parent, title, sub, y, z, height = 0.55) => { const l = label(title, sub, { height, style: "gold" }); addChild(parent, createNode({ geometry: l.back, position: { x: 0, y, z } }), createNode({ geometry: l.face, position: { x: 0, y, z } })); };
    const station = (id) => L.stations.find((s) => s.id === id);
    const stand = (s) => { const n = createNode({ position: { x: s.x, y: 0, z: s.z }, rotation: { x: 0, y: s.ry, z: 0 } }); addChild(root, n); return n; };

    // ---- The essay cubes: a cube of 3x3x3 blocks in the essay's colour round a glowing core, a ring and a light
    // beam under it, and a medallion on the floor where Space reads it.
    const coreGeo = M.box({ w: 0.62, h: 0.62, d: 0.62, color: "#fff6dc", emissive: 2.2 });
    const cubes = L.cubes.map((c, i) => {
      const e = D.essays[i], ink = e.accent === "#000000" ? "#2b2f38" : e.accent, blocks = [];
      for (let x = -1; x <= 1; x++) for (let y = -1; y <= 1; y++) for (let z = -1; z <= 1; z++) if (x || y || z) blocks.push(M.bevelBox({ w: 0.36, h: 0.36, d: 0.36, color: ink, emissive: 0.55, bevel: 0.05, offset: { x: x * 0.38, y: y * 0.38, z: z * 0.38 } }));
      const holder = createNode({ position: { x: c.x, y: CUBE_Y, z: c.z } });
      const cube = createNode({ geometry: M.merge(...blocks) }), core = createNode({ geometry: coreGeo });
      const ring = createNode({ geometry: M.turnedX(M.torus(1.05, 0.04, e.accent === "#000000" ? "#e9eef5" : ink, 1.6), Math.PI / 2), position: { x: 0, y: -0.95, z: 0 } });
      addChild(holder, cube, core, ring);
      const lab = label(e.title, "an essay · click to read", { height: 0.5, style: "gold" });
      const tag = createNode({ position: { x: 0, y: -1.45, z: 0 }, rotation: { x: 0, y: c.a, z: 0 } });
      addChild(tag, createNode({ geometry: lab.back }), createNode({ geometry: lab.face }));
      addChild(holder, tag);
      addChild(root, holder);
      addChild(root, createNode({ geometry: M.merge(
        M.lathe({ profile: [[0, 0], [0.75, 0], [0.75, 0.02], [0, 0.02]], segments: 24, color: ink, emissive: 1.2 }),
        M.box({ w: 0.05, h: CUBE_Y - 1.2, d: 0.05, color: ink, emissive: 1.4, offset: { x: 0, y: (CUBE_Y - 1.2) / 2, z: 0 } })), position: { x: c.x, y: 0.01, z: c.z }, sightHidden: true }));
      const hit = createNode({ geometry: pick(1.6, 1.6, 1.6), position: { x: c.x, y: CUBE_Y, z: c.z } });
      addChild(root, hit);
      const open = () => BOARDS.essay(D, i);
      targets.push({ node: hit, board: open, essay: i });
      stations.push({ id: `essay-${i}`, essay: i, title: e.title, at: { x: c.x, z: c.z }, reach: 1.8, hint: `read ${e.title}, an essay from bitcoinguide.app`, board: open });
      return { holder, cube, core, ring, x: c.x, z: c.z, seed: i * 0.7, near: 0 };
    });

    // ---- The resource library: a timber wall of binders, two rows, one for each section and two for the guides.
    {
      const s = station("library"), n = stand(s), cols = 12, bw = 0.78, bh = 1.15;
      const parts = [M.box({ w: s.w, h: 3.3, d: 0.25, color: "#3b2a1a", offset: { x: 0, y: 1.65, z: -0.32 } }), M.box({ w: s.w, h: 0.12, d: 0.9, color: "#5a3a22", offset: { x: 0, y: 0.06, z: 0 } })];
      for (const y of [0.18, 1.5, 2.82]) parts.push(M.box({ w: s.w, h: 0.08, d: 0.9, color: "#6b4528", offset: { x: 0, y, z: 0 } }));
      for (const x of [-s.w / 2, s.w / 2]) parts.push(M.box({ w: 0.14, h: 3.3, d: 0.9, color: "#4c331d", offset: { x, y: 1.65, z: 0 } }));
      addChild(n, createNode({ geometry: M.merge(...parts) }));
      const items = [...D.sections.map((sec, i) => ({ title: sec.title, color: sec.color, board: () => BOARDS.section(D, i) })),
        { title: "Self-custody guide", color: "#ffd23a", board: () => BOARDS.guide(D, "coldStorage") }, { title: "Air-gapped laptop", color: "#ffd23a", board: () => BOARDS.guide(D, "airGapped") }];
      items.forEach((it, i) => {
        const col = i % cols, row = Math.floor(i / cols), x = -s.w / 2 + 0.55 + col * ((s.w - 1.1) / (cols - 1)), y = row ? 0.22 + bh / 2 : 1.54 + bh / 2;
        const b = createNode({ geometry: M.merge(M.bevelBox({ w: bw * 0.86, h: bh, d: 0.62, color: it.color, emissive: 0.35, bevel: 0.04 }), M.box({ w: bw * 0.6, h: 0.18, d: 0.02, color: "#f6ecd2", offset: { x: 0, y: bh * 0.22, z: 0.32 } })), position: { x, y, z: 0.05 } });
        addChild(n, b);
        targets.push({ node: b, board: it.board });
      });
      sign(n, "RESOURCE LIBRARY", "every link from bitcoinguide.app/resources · tap a binder", 3.75, 0, 0.7);
      stations.push({ ...s, title: "The resource library", board: () => BOARDS.library(D) });
    }
    // ---- The reading list: a bookshelf of fifteen books, and the further reading in folders.
    {
      const s = station("books"), n = stand(s);
      const parts = [M.box({ w: s.w, h: 2.6, d: 0.25, color: "#3b2a1a", offset: { x: 0, y: 1.3, z: -0.32 } })];
      for (const y of [0.1, 1.25, 2.4]) parts.push(M.box({ w: s.w, h: 0.08, d: 0.9, color: "#6b4528", offset: { x: 0, y, z: 0 } }));
      for (const x of [-s.w / 2, s.w / 2]) parts.push(M.box({ w: 0.14, h: 2.6, d: 0.9, color: "#4c331d", offset: { x, y: 1.3, z: 0 } }));
      const INKS = ["#b8442f", "#2f6db8", "#d9a23a", "#3f8a4a", "#7a3fb8", "#c9c2b0", "#1f2a44", "#a83a6a", "#3aa8a0", "#5a3a22", "#e07a2f", "#46607a", "#8a2f2f", "#2f8a6a", "#d9c46a"];
      let x = -s.w / 2 + 0.3;
      D.readingList.forEach((b, i) => { const w = 0.16 + (i * 7 % 5) * 0.03, h = 0.8 + (i * 11 % 4) * 0.07; parts.push(M.bevelBox({ w, h, d: 0.6, color: INKS[i % INKS.length], bevel: 0.02, offset: { x: x + w / 2, y: 1.29 + h / 2, z: 0 } })); x += w + 0.04; });
      x = -s.w / 2 + 0.3;
      D.further.forEach((f, i) => { parts.push(M.bevelBox({ w: 0.7, h: 0.9, d: 0.08, color: i % 2 ? "#e8c35a" : "#f0e2bf", bevel: 0.02, offset: { x: x + 0.35, y: 0.6, z: 0.1 } })); x += 0.9; });
      addChild(n, createNode({ geometry: M.merge(...parts) }));
      const hit = createNode({ geometry: pick(s.w, 2.6, 1), position: { x: 0, y: 1.3, z: 0 } }); addChild(n, hit);
      targets.push({ node: hit, board: () => BOARDS.books(D) });
      sign(n, "READING LIST", "Bitclank Bill's books and further reading · click here", 3.0, 0, 0.6);
      stations.push({ ...s, title: "The reading list", board: () => BOARDS.books(D) });
    }
    // ---- The video essays: a big screen running each essay's slide deck, a few seconds a slide.
    const videoScreen = screen(960, 540, 5.4);
    {
      const s = station("videos"), n = stand(s);
      addChild(n, createNode({ geometry: M.merge(M.box({ w: s.w, h: 3.5, d: 0.25, color: "#14171c", offset: { x: 0, y: 2.4, z: -0.1 } }),
        ...[-s.w / 2 + 0.3, s.w / 2 - 0.3].map((x) => M.box({ w: 0.18, h: 1.4, d: 0.18, color: "#2a2d33", offset: { x, y: 0.7, z: -0.1 } })),
        M.box({ w: s.w + 0.2, h: 0.1, d: 0.3, color: "#facc15", emissive: 1.2, offset: { x: 0, y: 4.2, z: -0.05 } })) }));
      addChild(n, createNode({ geometry: videoScreen.face, position: { x: 0, y: 2.4, z: 0.04 } }));
      const hit = createNode({ geometry: pick(s.w, 3.5, 0.6), position: { x: 0, y: 2.4, z: 0 } }); addChild(n, hit);
      targets.push({ node: hit, board: () => BOARDS.videos(D) });
      sign(n, "VIDEO ESSAYS", "the twelve essays as reels and slides · click here", 4.75, 0, 0.6);
      stations.push({ ...s, title: "The video essays", board: () => BOARDS.videos(D) });
    }
    // ---- This Week in Bitcoin: a kiosk with the live chain and the weekly news.
    const newsScreen = screen(960, 540, 5.4);
    {
      const s = station("news"), n = stand(s);
      addChild(n, createNode({ geometry: M.merge(M.box({ w: s.w, h: 3.5, d: 0.25, color: "#14171c", offset: { x: 0, y: 2.4, z: -0.1 } }),
        ...[-s.w / 2 + 0.3, s.w / 2 - 0.3].map((x) => M.box({ w: 0.18, h: 1.4, d: 0.18, color: "#2a2d33", offset: { x, y: 0.7, z: -0.1 } })),
        M.box({ w: s.w + 0.2, h: 0.1, d: 0.3, color: "#009dff", emissive: 1.2, offset: { x: 0, y: 4.2, z: -0.05 } })) }));
      addChild(n, createNode({ geometry: newsScreen.face, position: { x: 0, y: 2.4, z: 0.04 } }));
      const hit = createNode({ geometry: pick(s.w, 3.5, 0.6), position: { x: 0, y: 2.4, z: 0 } }); addChild(n, hit);
      targets.push({ node: hit, board: () => BOARDS.news(D) });
      sign(n, "THIS WEEK IN BITCOIN", "the news every Sunday at bitcoinguide.app · click here", 4.75, 0, 0.6);
      stations.push({ ...s, title: "This Week in Bitcoin", board: () => BOARDS.news(D) });
    }
    // ---- The dice tables: five dice each on green felt, a screen behind them. A die's faces: 1 up, 6 down, 2 east,
    // 5 west, 3 toward the visitor, 4 away; FACE_UP turns each value up.
    const pip = M.box({ w: 0.06, h: 0.012, d: 0.06, color: "#14161a" });
    const dieGeo = (() => {
      const S = 0.32, h = S / 2 + 0.004, parts = [M.bevelBox({ w: S, h: S, d: S, color: "#f4efe4", bevel: 0.05 })];
      const P = { 1: [[0, 0]], 2: [[-1, -1], [1, 1]], 3: [[-1, -1], [0, 0], [1, 1]], 4: [[-1, -1], [1, -1], [-1, 1], [1, 1]], 5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]], 6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]] };
      const put = (v, place) => { for (const [a, b] of P[v]) parts.push(place(M.box({ w: 0.06, h: 0.012, d: 0.06, color: v === 1 ? "#c0392b" : "#14161a" }), a * 0.085, b * 0.085)); };
      put(1, (g, a, b) => M.moved(g, a, h, b)); put(6, (g, a, b) => M.moved(g, a, -h, b));
      put(2, (g, a, b) => M.moved(M.turnedZ(g, Math.PI / 2), h, a, b)); put(5, (g, a, b) => M.moved(M.turnedZ(g, Math.PI / 2), -h, a, b));
      put(3, (g, a, b) => M.moved(M.turnedX(g, Math.PI / 2), a, b, h)); put(4, (g, a, b) => M.moved(M.turnedX(g, Math.PI / 2), a, b, -h));
      return M.merge(...parts);
    })();
    void pip;
    const FACE_UP = { 1: [0, 0, 0], 6: [Math.PI, 0, 0], 2: [0, 0, Math.PI / 2], 5: [0, 0, -Math.PI / 2], 3: [-Math.PI / 2, 0, 0], 4: [Math.PI / 2, 0, 0] };
    const randomInt = BL.math && BL.math.randomInt ? BL.math.randomInt : (n) => Math.floor(Math.random() * n);
    const table = (id, ink, title, sub) => {
      const s = station(id), n = stand(s), sc = screen(768, 432, 2.6);
      addChild(n, createNode({ geometry: M.merge(
        M.box({ w: s.w, h: 0.1, d: s.d, color: "#4c331d", offset: { x: 0, y: 0.9, z: 0 } }),
        M.box({ w: s.w - 0.2, h: 0.02, d: s.d - 0.2, color: "#1f5a3a", offset: { x: 0, y: 0.96, z: 0 } }),
        ...[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b]) => M.box({ w: 0.12, h: 0.85, d: 0.12, color: "#3b2a1a", offset: { x: a * (s.w / 2 - 0.15), y: 0.425, z: b * (s.d / 2 - 0.15) } })),
        M.box({ w: s.w, h: 0.12, d: 0.08, color: ink, emissive: 1.2, offset: { x: 0, y: 0.98, z: s.d / 2 } }),
        ...[-1.1, 1.1].map((x) => M.box({ w: 0.1, h: 1.6, d: 0.1, color: "#2a2d33", offset: { x, y: 1.75, z: -s.d / 2 + 0.1 } })),
        M.box({ w: 2.8, h: 1.65, d: 0.12, color: "#101317", offset: { x: 0, y: 2.55, z: -s.d / 2 + 0.05 } })) }));
      addChild(n, createNode({ geometry: sc.face, position: { x: 0, y: 2.55, z: -s.d / 2 + 0.12 } }));
      const hit = createNode({ geometry: pick(2.8, 1.65, 0.4), position: { x: 0, y: 2.55, z: -s.d / 2 + 0.1 } }); addChild(n, hit);
      targets.push({ node: hit, board: () => BOARDS[id](D) });
      sign(n, title, sub, 3.75, -s.d / 2, 0.55);
      const dice = [];
      for (let i = 0; i < 5; i++) { const d = createNode({ geometry: dieGeo, position: { x: -0.9 + i * 0.45, y: 1.13, z: 0.1 } }); addChild(n, d); dice.push({ n: d, v: 1 + i, t: 9, spin: [0, 0, 0], from: [0, 0, 0] }); }
      return { s, n, sc, dice, rolls: "", count: 0, t: 9, key: "" };
    };
    const diceTable = table("dice", "#8b5cf6", "DICE ROLLS AND ENTROPY", "E rolls five dice · click the screen for the guide");
    const passTable = table("passphrase", "#16a34a", "BIP39 PASSPHRASE", "E rolls five dice for a word · click the screen for the guide");
    const roll = (T) => {
      if (T.t < ROLL_S) return;
      T.t = 0;
      let digits = "";
      for (const d of T.dice) {
        d.v = 1 + randomInt(6); digits += d.v; d.t = 0;
        d.from[0] = d.n.rotation.x; d.from[1] = d.n.rotation.y; d.from[2] = d.n.rotation.z;
        d.spin[0] = (2 + Math.random() * 3) * (Math.random() < 0.5 ? -1 : 1); d.spin[1] = Math.random() * 6 - 3; d.spin[2] = (2 + Math.random() * 3) * (Math.random() < 0.5 ? -1 : 1);
      }
      T.last = digits; T.count++;
      T.rolls = T === diceTable ? (T.count > 20 ? "" : T.rolls) + digits + " " : (T.count > 6 ? digits : `${T.rolls ? `${T.rolls} ` : ""}${digits}`);
      if (T === diceTable && T.count > 20) { T.count = 1; }
      if (T === passTable && T.count > 6) T.count = 1;
    };
    stations.push({ ...diceTable.s, title: "Dice rolls and entropy", act: () => roll(diceTable), board: () => BOARDS.dice(D) });
    stations.push({ ...passTable.s, title: "BIP39 passphrase", act: () => roll(passTable), board: () => BOARDS.passphrase(D) });
    // ---- The learning paths signpost: four arms in the tracks' colours under the Bitcoin Guide's orange cube.
    {
      const s = station("paths"), n = stand(s), INK = ["#ff8c00", "#009dff", "#16a34a", "#8b5cf6"];
      const parts = [M.box({ w: 0.22, h: 4.2, d: 0.22, color: "#4c331d", offset: { x: 0, y: 2.1, z: 0 } }), M.box({ w: 0.8, h: 0.12, d: 0.8, color: "#3b2a1a", offset: { x: 0, y: 0.06, z: 0 } })];
      D.paths.forEach((p, i) => { const y = 3.4 - i * 0.55, dir = i % 2 ? -1 : 1; parts.push(M.bevelBox({ w: 2.2, h: 0.4, d: 0.08, color: INK[i], emissive: 0.5, bevel: 0.03, offset: { x: dir * 1.15, y, z: 0.15 } }), M.box({ w: 0.24, h: 0.24, d: 0.08, color: INK[i], emissive: 0.5, offset: { x: dir * 2.3, y, z: 0.15 } })); });
      addChild(n, createNode({ geometry: M.merge(...parts) }));
      D.paths.forEach((p, i) => { const l = label(`${p.number}. ${p.title.replace(/^The /, "")}`, "", { height: 0.32, style: "plain" }), y = 3.4 - i * 0.55, dir = i % 2 ? -1 : 1; addChild(n, createNode({ geometry: l.face, position: { x: dir * 1.15, y, z: 0.21 } }), createNode({ geometry: l.back, position: { x: dir * 1.15, y, z: 0.09 } })); });
      const logo = createNode({ geometry: M.merge(...[-1, 1].flatMap((x) => [-1, 1].flatMap((y) => [-1, 1].map((z) => M.bevelBox({ w: 0.28, h: 0.28, d: 0.28, color: "#f7931a", emissive: 0.9, bevel: 0.04, offset: { x: x * 0.15, y: y * 0.15, z: z * 0.15 } }))))), position: { x: 0, y: 4.65, z: 0 } });
      addChild(n, logo);
      sign(n, "BITCOIN GUIDE", "start here · bitcoinguide.app · click for the paths", 5.35, 0, 0.6);
      const hit = createNode({ geometry: pick(4.8, 2.6, 0.6), position: { x: 0, y: 2.9, z: 0 } }); addChild(n, hit);
      targets.push({ node: hit, board: () => BOARDS.paths(D) });
      stations.push({ ...s, title: "The Bitcoin Guide's learning paths", board: () => BOARDS.paths(D) });
      diceTable.logo = logo;
    }

    // ---- The live screen near the arrival: two faces back to back on posts, each a page of the real network's live
    // readings (genesis-network.js paintScreen), a new page every few seconds; a click or a tap opens the tools.
    const liveFront = screen(960, 540, 4.8), liveBack = screen(960, 540, 4.8);
    {
      const s = station("live"), n = stand(s);
      // A rock TV: a chunky stone cabinet with a rounded glass, a big knob and a little one on its side, bone
      // antennas, and stubby stone feet; the picture only on the front.
      const STONE = "#7d7568", STONE_DK = "#5d564c", STONE_LT = "#9a9184";
      addChild(n, createNode({ geometry: M.merge(
        M.bevelBox({ w: s.w, h: 3.5, d: s.d, color: STONE, bevel: 0.45, offset: { x: 0, y: 2.65, z: 0 } }),
        M.bevelBox({ w: 3.7, h: 2.5, d: 0.2, color: STONE_DK, bevel: 0.15, offset: { x: -0.35, y: 2.75, z: s.d / 2 } }),
        ...[[-1.4, 0.45], [1.4, 0.45], [-1.4, -0.45], [1.4, -0.45]].map(([x, z]) => M.bevelBox({ w: 0.6, h: 0.9, d: 0.5, color: STONE_DK, bevel: 0.15, offset: { x, y: 0.45, z } })),
        M.moved(M.turnedX(M.lathe({ profile: [[0, 0], [0.42, 0], [0.42, 0.18], [0.3, 0.26], [0, 0.26]], segments: 16, color: STONE_LT }), Math.PI / 2), 1.85, 3.15, s.d / 2),
        M.box({ w: 0.08, h: 0.32, d: 0.06, color: "#3a332b", offset: { x: 1.85, y: 3.25, z: s.d / 2 + 0.27 } }),
        M.moved(M.turnedX(M.lathe({ profile: [[0, 0], [0.22, 0], [0.22, 0.14], [0, 0.14]], segments: 12, color: STONE_LT }), Math.PI / 2), 1.85, 2.1, s.d / 2),
        ...[-1, 1].map((k) => M.moved(M.turnedZ(M.box({ w: 0.09, h: 1.7, d: 0.09, color: "#efe6d0" }), k * 0.45), k * 0.55, 5.1, 0)),
        ...[-1, 1].map((k) => M.bevelBox({ w: 0.24, h: 0.24, d: 0.24, color: "#efe6d0", bevel: 0.08, offset: { x: k * 0.95, y: 5.85, z: 0 } })),
        M.bevelBox({ w: 1.0, h: 0.35, d: 0.6, color: STONE_DK, bevel: 0.12, offset: { x: 0, y: 4.5, z: 0 } })) }));
      addChild(n, createNode({ geometry: liveFront.face, position: { x: -0.35, y: 2.75, z: s.d / 2 + 0.11 } }));
      void liveBack;
      // The rock beanbags: mossy boulders slumped soft, an Ooga-sized dip in each.
      for (const q of L.seats) {
        const b = createNode({ geometry: M.merge(M.lathe({ profile: [[0, 0], [0.62, 0], [0.7, 0.2], [0.6, 0.42], [0.3, 0.55], [0, 0.5]], segments: 12, color: ["#7a7568", "#6e6a5e", "#857d6e"][q.i] }), M.lathe({ profile: [[0, 0.5], [0.34, 0.53], [0.36, 0.56], [0, 0.56]], segments: 12, color: "#4f7a3a" })), position: { x: q.x, y: 0, z: q.z } });
        addChild(root, b);
      }
      const hit = createNode({ geometry: pick(s.w, 3.5, s.d), position: { x: 0, y: 2.65, z: 0 } }); addChild(n, hit);
      targets.push({ node: hit, board: () => BOARDS.live(D) });
      sign(n, "THE ROCK TV", "the network live, and Glow Golf · click for the tools", 5.7, 0, 0.55);
      stations.push({ ...s, title: "The Bitcoin network, live", board: () => BOARDS.live(D) });
    }
    const live = { page: 0, t: 0, front: null, back: null };
    const paintFront = (g, W, H) => BL.genesisNetwork.paintScreen(g, W, H, live.front);
    // Glow Golf from above: the nine greens in the cavern, numbered, and the way down.
    const paintGolf = (g, W, H) => {
      const GC = BL.genesisGolfCourse;
      g.fillStyle = "#0d1a10"; g.fillRect(0, 0, W, H);
      g.strokeStyle = "#9cff3a"; g.lineWidth = 8; g.strokeRect(12, 12, W - 24, H - 24);
      g.textAlign = "center"; g.textBaseline = "middle"; g.fillStyle = "#9cff3a"; g.font = "bold 44px sans-serif"; g.fillText("GLOW GOLF · DOWN THE CENOTE", W / 2, 62);
      if (!GC) return;
      const sx = (W - 120) / GC.CAVERN.w, sz = (H - 190) / GC.CAVERN.d, k = Math.min(sx, sz), ox = W / 2, oz = H / 2 + 40;
      for (let i = 0; i < GC.HOLES.length; i++) {
        const c = GC.compile(i);
        g.beginPath(); c.edge.forEach(([x, z], j) => (j ? g.lineTo : g.moveTo).call(g, ox + x * k, oz + z * k)); g.closePath();
        g.fillStyle = "#3f8f34"; g.fill(); g.strokeStyle = ["#ff7a1a", "#ffd23a", "#ff4fd8"][i % 3]; g.lineWidth = 4; g.stroke();
        g.fillStyle = "#111"; g.beginPath(); g.arc(ox + c.cup.x * k, oz + c.cup.z * k, 5, 0, 7); g.fill();
        g.fillStyle = "#ffffff"; g.font = "bold 26px sans-serif"; g.fillText(String(i + 1), ox + c.tee.x * k, oz + c.tee.z * k - 14);
      }
      g.font = "24px sans-serif"; g.fillStyle = "#dfe7ee"; g.fillText(`nine holes · par ${GC.totalPar} · step into the cenote to play`, W / 2, H - 46);
    };
    // ---- The screens' pictures, painted when what they show changes.
    const vid = { essay: 0, slide: 0, t: 0 };
    const paintVideo = (g, W, H) => {
      const e = D.essays[vid.essay], ink = e.accent === "#000000" ? "#e9eef5" : e.accent, sl = e.slides[vid.slide] || { title: e.title, subtitle: "" };
      g.fillStyle = "#06080b"; g.fillRect(0, 0, W, H);
      const grd = g.createLinearGradient(0, 0, W, H); grd.addColorStop(0, ink); grd.addColorStop(1, "#06080b"); g.globalAlpha = 0.35; g.fillStyle = grd; g.fillRect(0, 0, W, H); g.globalAlpha = 1;
      isoCube(g, 150, 250, 90, ink);
      g.textAlign = "left"; g.textBaseline = "top";
      g.fillStyle = "#cfd8e3"; g.font = "24px sans-serif"; g.fillText(`VIDEO ESSAY ${vid.essay + 1} OF ${D.essays.length} · ${e.title.toUpperCase()}`, 300, 60);
      g.fillStyle = "#ffffff"; g.font = "bold 58px sans-serif"; g.fillText(sl.title, 300, 180);
      g.fillStyle = ink; g.font = "36px sans-serif"; g.fillText(sl.subtitle, 300, 260);
      g.fillStyle = "#8a96a3"; g.font = "22px sans-serif"; g.fillText(`slide ${vid.slide + 1} of ${e.slides.length} · tap for the reels`, 300, 440);
    };
    const paintNews = (g, W, H) => {
      const c = BL.chain && BL.chain.snapshot;
      frame(g, W, H, "#009dff", "THIS WEEK IN BITCOIN");
      g.fillStyle = "#dfe7ee"; g.font = "26px sans-serif"; g.fillText("Current events from X, hot topics and news:", 34, 92); g.fillText("fresh every Sunday at bitcoinguide.app/this-week", 34, 126);
      g.font = "bold 40px monospace"; g.fillStyle = "#ffd23a";
      const fmt = (n) => Math.round(n).toLocaleString("en-US");
      lines(g, c && c.height ? [`block   ${fmt(c.height)}`, `fees    ${c.fastestFee || c.nextFee || 0} sat/vB`, `hash    ${(c.hashrate / 1e18).toFixed(0)} EH/s`, `price   $${fmt(c.priceUsd)}`] : ["waiting for the network..."], 34, 200, 58);
      g.font = "20px sans-serif"; g.fillStyle = c && c.live ? "#5cff7a" : "#8a96a3"; g.fillText(c && c.live ? `LIVE · ${c.source}` : "no live reading yet", 34, H - 52);
    };
    const paintDice = (g, W, H) => {
      const T = diceTable, rolls = T.count * 5, bits = rolls * Math.log2(6);
      frame(g, W, H, "#8b5cf6", "DICE ROLLS AND ENTROPY");
      g.fillStyle = "#dfe7ee"; g.font = "24px sans-serif"; g.fillText("Each roll adds about 2.585 bits. A 24-word seed holds 256 bits:", 34, 86); g.fillText("about 99 to 100 rolls. Press E to roll five dice.", 34, 116);
      g.font = "bold 64px monospace"; g.fillStyle = "#ffffff"; g.fillText(T.last || "-----", 34, 160);
      g.font = "22px monospace"; g.fillStyle = "#b9a8ff";
      const r = T.rolls.trim(); for (let i = 0; i < 3; i++) g.fillText(r.slice(i * 48, i * 48 + 48), 34, 244 + i * 28);
      g.fillStyle = "#1d2630"; g.fillRect(34, 340, W - 68, 26); g.fillStyle = "#8b5cf6"; g.fillRect(34, 340, (W - 68) * Math.min(1, bits / 256), 26);
      g.font = "22px sans-serif"; g.fillStyle = "#dfe7ee"; g.fillText(`${rolls} rolls · ${bits.toFixed(0)} of 256 bits`, 34, 372);
      g.fillStyle = "#ff8a8a"; g.fillText("For learning only: never make a real seed in a game. Real dice, offline.", 34, 398);
    };
    const paintPass = (g, W, H) => {
      const T = passTable, words = T.rolls ? T.rolls.split(" ").length : 0;
      frame(g, W, H, "#16a34a", "BIP39 PASSPHRASE");
      g.fillStyle = "#dfe7ee"; g.font = "24px sans-serif"; g.fillText("Roll five dice: the five digits name one word in the EFF large", 34, 86); g.fillText("wordlist (7,776 words). Press E to roll.", 34, 116);
      g.font = "bold 64px monospace"; g.fillStyle = "#ffffff"; g.fillText(T.last || "-----", 34, 160);
      g.font = "26px monospace"; g.fillStyle = "#7dffb0"; g.fillText(T.rolls || "", 34, 250);
      g.font = "22px sans-serif"; g.fillStyle = "#dfe7ee"; g.fillText(`${words} word${words === 1 ? "" : "s"} · about ${(words * 12.9).toFixed(0)} bits · 5 to 7 words makes a strong passphrase`, 34, 320);
      g.fillText("Look each number up in the EFF list (link on the screen's guide).", 34, 352);
      g.fillStyle = "#ff8a8a"; g.fillText("For learning only: roll real dice, offline, for a real passphrase.", 34, 392);
    };
    const update = (dt, calm, at) => {
      const t = (diceTable.clock = (diceTable.clock || 0) + dt);
      for (const c of cubes) {
        const d2 = at ? (at.x - c.x) * (at.x - c.x) + (at.z - c.z) * (at.z - c.z) : 1e9;
        c.near += ((d2 < 9 ? 1 : 0) - c.near) * Math.min(1, dt * 4);
        if (!calm) { c.cube.rotation.y += dt * (0.35 + c.near * 1.2); c.cube.rotation.x = Math.sin(t * 0.4 + c.seed) * 0.25; c.ring.rotation.y -= dt * 0.6; }
        c.holder.position.y = CUBE_Y + (calm ? 0 : Math.sin(t * 0.9 + c.seed) * 0.18) - c.near * 0.35;
        c.core.glow = 0.9 + Math.sin(t * 2 + c.seed) * 0.3 + c.near * 1.2;
        c.ring.glow = 0.8 + c.near * 1.5;
      }
      if (diceTable.logo && !calm) diceTable.logo.rotation.y += dt * 0.5;
      // The dice tumble up and down for ROLL_S, then settle with their value up.
      for (const T of [diceTable, passTable]) {
        T.t += dt;
        for (let i = 0; i < T.dice.length; i++) {
          const d = T.dice[i];
          if (d.t >= ROLL_S) continue;
          d.t += dt;
          const k = Math.min(1, d.t / ROLL_S), up = FACE_UP[d.v], e = k * k * (3 - 2 * k);
          d.n.position.y = 1.13 + Math.sin(k * Math.PI) * 0.5;
          if (k < 0.75) { d.n.rotation.x += d.spin[0] * dt * 4; d.n.rotation.y += d.spin[1] * dt * 2; d.n.rotation.z += d.spin[2] * dt * 4; }
          else { const f = Math.min(1, (e - 0.84) / 0.16 + 0.2); d.n.rotation.x += (up[0] - d.n.rotation.x) * f; d.n.rotation.z += (up[2] - d.n.rotation.z) * f; }
          if (k >= 1) { d.n.rotation.x = up[0]; d.n.rotation.z = up[2]; d.n.position.y = 1.13; }
        }
      }
      vid.t += dt;
      if (vid.t > 3.2) { vid.t = 0; vid.slide++; if (vid.slide >= Math.max(1, D.essays[vid.essay].slides.length)) { vid.slide = 0; vid.essay = (vid.essay + 1) % D.essays.length; } }
      repaint(videoScreen, `${vid.essay}|${vid.slide}`, paintVideo);
      const NW = BL.genesisNetwork;
      // The rock TV turns through the live readings and, every other turn, a look at Glow Golf down the cenote.
      if ((live.t += dt) > 6) { live.t = 0; live.page = (live.page + 1) % (NW.SCREEN_PAGES.length * 2); }
      if (live.page % 2) repaint(liveFront, "golf", paintGolf);
      else { live.front = NW.SCREEN_PAGES[live.page / 2]; repaint(liveFront, NW.keyScreen(live.front), paintFront); }
      const c = BL.chain && BL.chain.snapshot;
      repaint(newsScreen, c ? `${c.height}|${c.fastestFee}|${Math.round(c.hashrate / 1e18)}|${Math.round(c.priceUsd)}|${c.live}` : "-", paintNews);
      repaint(diceTable.sc, `${diceTable.count}|${diceTable.last}|${diceTable.t >= ROLL_S}`, paintDice);
      repaint(passTable.sc, `${passTable.count}|${passTable.last}|${passTable.t >= ROLL_S}`, paintPass);
    };
    return { root, update, stations, targets, layout: L, rolls: () => ({ dice: diceTable.count, pass: passTable.count, last: diceTable.last }) };
  };
  BL.genesisBitcoinGuide = { layout, build, BOARDS, STATIONS, SITE };
})();
