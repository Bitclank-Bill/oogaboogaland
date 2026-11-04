// Genesis museum: Bitclank Bill's essays from bitcoinguide.app (genesis-guide-data.js, baked by
// scripts/bitcoin-guide-data.mjs), in the atrium round the shrine:
//   - the twelve essays as glowing cubes in their own colours, floating round the inside of the courtyard's ring path,
//     each over a lit medallion: a click there, or on the cube, opens the whole essay in the reader, with its PDF and
//     its video reel;
//   - the video essays, a big screen running each essay's slide deck, its reels a click away;
//   - the rock TV by the arrival, the real network's live readings and a look at Glow Golf in turn, with rock
//     beanbags to sit on and watch it.
//
// `layout()` (pure, so Node can check it): the stations, the cubes, the seats and the boxes a walker meets. `build(...)`
// builds it all once a visit and returns { update(dt, calm, at), stations, targets }: `stations` are the scene's props
// (where to stand, the board to open: `board()`), `targets` the click targets (`node`, `board` or `essay`). update
// allocates nothing and repaints a screen only when what it shows has changed.
(() => {
  "use strict";
  const BL = window.BL = window.BL || {};
  const SITE = "https://bitcoinguide.app";
  const CUBE_R = 16, CUBE_Y = 3.6;
  // The stations round the courtyard, in the atrium's frame (+z toward the arrival): where each stands, its facing
  // (`ry`, its front's direction), the box it fills and where a visitor stands to use it.
  const STATIONS = [
    { id: "videos", x: -29.6, z: 0, ry: Math.PI / 2, w: 5.8, d: 0.8, reach: 3.2, hint: "the video essays" },
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

  // ---- Boards: the essays as pages ({ caption, title, text, links }) for the scene's panel.
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
  // Pictures for the board's pages (scene-genesis.js paintPage draws a page's `paint` on its right half).
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
  const BOARDS = {
    essay: (D, i) => ({ room: `${D.essays[i].title} - Bitcoin Guide`, pages: essayPages(D.essays[i]), sources: [] }),
    live: () => ({ room: "The network, live", sources: [], pages: [
      { caption: "Live", title: "The Bitcoin network, live", note: "The screen reads mempool.space · the links open the tools", text: ["The screen shows the real network as it is now: block height, hashrate, fees and the mempool, the difficulty epoch, the bitcoin mined so far and the price.", "Watch it live, block by block, with the tools below."],
        links: [link("https://mempool.space", "mempool.space: blocks, fees and the mempool"), link("https://timechaincalendar.com/en", "Timechain Calendar"), link("https://bitcoin.clarkmoody.com/dashboard/", "Clark Moody's Bitcoin dashboard"), link("https://btcframe.com/dashboard/", "BTCFrame dashboard")], paint: cardPaint("Live", "https://mempool.space", "#f7931a") }
    ] }),
    videos: (D) => ({ room: "Video essays - Bitcoin Guide", sources: [], pages: D.essays.map((e) => ({ caption: "Video essays", title: e.title, accent: e.accent, paint: picPaint(`video:${e.title}`, picPaint(`essay:${e.title}`)),
      text: [e.description, ...e.slides.map((s) => `${s.title}${s.subtitle ? ` · ${s.subtitle}` : ""}`)].slice(0, 9),
      links: [...(e.reel ? [link(e.reel, "Watch the reel")] : []), link("/video-essays", "All the video essays"), link(e.pdf, "Read the essay")] })) }),
  };

  // ---- Painting: small canvases shown on the stations' screens.
  const isoCube = (g, cx, cy, s, ink) => {
    const top = [[0, -s], [s * 0.87, -s / 2], [0, 0], [-s * 0.87, -s / 2]], left = [[-s * 0.87, -s / 2], [0, 0], [0, s], [-s * 0.87, s / 2]], right = [[s * 0.87, -s / 2], [0, 0], [0, s], [s * 0.87, s / 2]];
    const poly = (pts, c) => { g.fillStyle = c; g.beginPath(); g.moveTo(cx + pts[0][0], cy + pts[0][1]); for (const p of pts) g.lineTo(cx + p[0], cy + p[1]); g.closePath(); g.fill(); };
    poly(top, ink); g.globalAlpha = 0.75; poly(left, ink); g.globalAlpha = 0.55; poly(right, ink); g.globalAlpha = 1;
    g.strokeStyle = "rgba(255,255,255,0.6)"; g.lineWidth = 3; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx, cy + s); g.moveTo(cx, cy); g.lineTo(cx - s * 0.87, cy - s / 2); g.moveTo(cx, cy); g.lineTo(cx + s * 0.87, cy - s / 2); g.stroke();
  };

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
    // beam under it, and a medallion on the floor where a click reads it.
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
    const update = (dt, calm, at) => {
      const t = (vid.clock = (vid.clock || 0) + dt);
      for (const c of cubes) {
        const d2 = at ? (at.x - c.x) * (at.x - c.x) + (at.z - c.z) * (at.z - c.z) : 1e9;
        c.near += ((d2 < 9 ? 1 : 0) - c.near) * Math.min(1, dt * 4);
        if (!calm) { c.cube.rotation.y += dt * (0.35 + c.near * 1.2); c.cube.rotation.x = Math.sin(t * 0.4 + c.seed) * 0.25; c.ring.rotation.y -= dt * 0.6; }
        c.holder.position.y = CUBE_Y + (calm ? 0 : Math.sin(t * 0.9 + c.seed) * 0.18) - c.near * 0.35;
        c.core.glow = 0.9 + Math.sin(t * 2 + c.seed) * 0.3 + c.near * 1.2;
        c.ring.glow = 0.8 + c.near * 1.5;
      }
      vid.t += dt;
      if (vid.t > 3.2) { vid.t = 0; vid.slide++; if (vid.slide >= Math.max(1, D.essays[vid.essay].slides.length)) { vid.slide = 0; vid.essay = (vid.essay + 1) % D.essays.length; } }
      repaint(videoScreen, `${vid.essay}|${vid.slide}`, paintVideo);
      const NW = BL.genesisNetwork;
      // The rock TV turns through the live readings and, every other turn, a look at Glow Golf down the cenote.
      if ((live.t += dt) > 6) { live.t = 0; live.page = (live.page + 1) % (NW.SCREEN_PAGES.length * 2); }
      if (live.page % 2) repaint(liveFront, "golf", paintGolf);
      else { live.front = NW.SCREEN_PAGES[live.page / 2]; repaint(liveFront, NW.keyScreen(live.front), paintFront); }
    };
    return { root, update, stations, targets, layout: L };
  };
  BL.genesisBitcoinGuide = { layout, build, BOARDS, STATIONS, SITE };
})();
