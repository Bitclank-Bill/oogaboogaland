// The Cloud Archive lounge TV: Ooga Booga Land's live feeds and pictures of the island's places, on shuffle. GitHub is
// the hanging Oogatron's; the TV carries everything else the page keeps live: the chain (chain.js: height, price,
// hashrate, difficulty, block pace), the mempool as its socket streams it (mempool.js with chain.js: backlog, arrivals,
// fee tiers, blocks seen), the Mempool island's weather (the storm step weather.js names from the arrivals, the lake
// from the backlog), the totems' repositories' latest merges (totem-feed.js), who is working, chilling and asleep and
// who is online out on the island or inside (contributors.js, net.js), the bananas (the island's pile, the tips tally,
// the latest tip and the top tipper, donations.js) and the arcade's records (highscores.js, watched for this visit as a
// scene may), and the pictures the hub drew of the island's places on the climb (`world.archiveViews`). A new block on
// the socket cuts to the mempool channel. It never fetches anything itself; a feed that is off (nosim, a static host,
// no island server) says so.
// `update(dt)` steps the shuffle (every CHANNEL_SECONDS through STATIC_SECONDS of snow, a fresh order each round; held
// under reduced motion or while its board is open) and repaints a live channel once a LIVE_SECONDS. `board` is the
// shared board dialog's view of it: every channel a page, live as the screen. `dispose` in leave.
(() => {
  "use strict";
  const BL = window.BL;
  const W = 480, H = 360, CHANNEL_SECONDS = 9, STATIC_SECONDS = 0.25, LIVE_SECONDS = 1, BAR = 44;
  const INK = "#f3efe4", DIM = "#a6a6a2", ACCENT = "#e8b04a", GREEN = "#46ff70", BG = "#0a0c0a", RED = "#e5533d", BLUE = "#6f9fca";
  // The arcade's records the TV lists, in this order, with their names.
  const RECORDS = [["skee", "Skee-ball"], ["hoops", "Hoops"], ["claw", "Claw"], ["hockey", "Air hockey"], ["shy", "Coconut shy"],
    ["drop", "The drop"], ["orbit", "Orbit"], ["mine", "The mine"], ["race", "Rally"], ["cloud-hopper", "Cloud Hopper"]];
  const ageOf = (at, now) => {
    if (!at) return null;
    const s = Math.max(0, Math.round((now - at) / 1000));
    return s < 60 ? `${s}s ago` : s < 3600 ? `${Math.floor(s / 60)}m ago` : s < 86400 ? `${Math.floor(s / 3600)}h ago` : `${Math.floor(s / 86400)}d ago`;
  };
  const num = (n, digits = 0) => Number.isFinite(n) ? n.toLocaleString("en-US", { maximumFractionDigits: digits, minimumFractionDigits: digits }) : "—";
  const time = (ms) => `${Math.floor(ms / 60000)}:${String(Math.floor(ms / 1000) % 60).padStart(2, "0")}.${String(Math.floor(ms / 10) % 100).padStart(2, "0")}`;
  const create = ({ views, world, font, reduced, boardOpen }) => {
    const canvas = document.createElement("canvas");
    canvas.width = W; canvas.height = H;
    const g = canvas.getContext("2d"), snow = g.createImageData(W / 4, H / 4);
    // Channel painters for the live feeds: a title, then rows of label and value, then whether the feed is live.
    const frame = (title, status, live) => {
      g.fillStyle = BG; g.fillRect(0, 0, W, H);
      g.fillStyle = "#1b1f1b"; g.fillRect(0, 0, W, 46);
      g.font = `700 22px ${font}`; g.textBaseline = "middle"; g.textAlign = "left"; g.fillStyle = ACCENT;
      g.fillText(title, 16, 24);
      g.textAlign = "right"; g.font = `600 14px ${font}`; g.fillStyle = live ? GREEN : DIM;
      g.fillText(live ? `● LIVE · ${status}` : status, W - 16, 24);
    };
    const rows = (list, top = 72, step = 36) => {
      g.textBaseline = "middle";
      for (let i = 0; i < list.length; i++) {
        const [label, value, color] = list[i], y = top + i * step;
        g.textAlign = "left"; g.font = `600 17px ${font}`; g.fillStyle = DIM; g.fillText(label, 18, y);
        g.textAlign = "right"; g.font = `700 22px ${font}`; g.fillStyle = color || INK; g.fillText(value, W - 18, y);
      }
    };
    const footnote = (text) => { g.textAlign = "center"; g.textBaseline = "middle"; g.font = `500 15px ${font}`; g.fillStyle = DIM; g.fillText(text, W / 2, H - BAR - 18); };
    const meter = (label, value, y, color) => {
      g.textAlign = "left"; g.textBaseline = "middle"; g.font = `600 17px ${font}`; g.fillStyle = DIM; g.fillText(label, 18, y);
      g.fillStyle = "#1b1f1b"; g.fillRect(170, y - 9, W - 188, 18);
      g.fillStyle = color; g.fillRect(170, y - 9, Math.round((W - 188) * Math.max(0, Math.min(1, value))), 18);
    };
    const chain = () => {
      const s = BL.chain.snapshot, now = Date.now(), live = s.at > 0;
      frame("BITCOIN · THE CHAIN", live ? `updated ${ageOf(s.at, now)}` : "waiting for the chain feed", live);
      rows([
        ["Block height", s.height ? num(s.height) : "—", ACCENT],
        ["Price", s.priceUsd ? `$${num(s.priceUsd)}` : "—", s.priceOpenUsd && s.priceUsd < s.priceOpenUsd ? RED : GREEN],
        ["Hashrate", s.hashrate ? `${num(s.hashrate / 1e18)} EH/s` : "—"],
        ["Difficulty", s.remainingBlocks ? `${s.difficultyChange >= 0 ? "+" : ""}${num(s.difficultyChange, 1)}% in ${num(s.remainingBlocks)} blocks` : "—"],
        ["Block pace", s.avgBlockMs ? `${num(s.avgBlockMs / 60000, 1)} min a block` : "—"],
        ["Last block", s.lastBlockAt ? ageOf(s.lastBlockAt, now) : "—"]
      ], 74, 40);
    };
    const mempool = () => {
      const m = BL.mempool.state, s = BL.chain.snapshot, live = m.connected;
      frame("MEMPOOL · LIVE", live ? "socket open" : s.backlogAt ? "from the chain's last read" : "waiting for the socket", live);
      rows([
        ["Waiting", s.count ? `${num(s.count)} tx` : "—", ACCENT],
        ["Backlog", s.vsize ? `${num(s.vsize / 1e6, 1)} MvB` : "—"],
        ["Arriving", s.inflow ? `${num(s.inflow)} vB/s` : "—"],
        ["Next block fee", s.nextFee ? `${num(s.nextFee, 1)} sat/vB` : "—", GREEN],
        ["Fees · fast / 30 min / 1 h", s.fastestFee ? `${num(s.fastestFee)} / ${num(s.halfHourFee)} / ${num(s.hourFee)}` : "—"],
        ["Blocks found this visit", num(m.blocks), BLUE]
      ], 74, 40);
    };
    const weather = () => {
      const s = BL.chain.snapshot, wx = BL.weather, fresh = s.socketAt > 0 && Date.now() - s.socketAt < wx.ARRIVALS_FRESH_MS;
      let step = wx.STEPS[0];
      for (const st of wx.STEPS) if (s.gale >= st.from) step = st;
      frame("ISLAND WEATHER", fresh ? "from arrivals" : "no arrivals reading", fresh);
      g.textAlign = "center"; g.textBaseline = "middle"; g.font = `700 42px ${font}`; g.fillStyle = fresh ? INK : DIM;
      g.fillText(fresh ? step.name.toUpperCase() : "CALM", W / 2, 112);
      meter("Storm", fresh ? s.gale : 0, 184, BLUE);
      meter("Lake (backlog)", s.soak, 226, ACCENT);
      footnote("The storm follows what arrives; the lake fills with what waits");
    };
    const totems = () => {
      const f = BL.totemFeed, now = Date.now(), live = f.state.polls > 0;
      frame("TOTEMS · LATEST MERGES", live ? `${f.state.polls} reads` : "waiting for GitHub", live);
      rows(f.REPOS.map((r, i) => {
        const m = f.state.repos[i];
        return [r.name, m.number ? `#${m.number} · ${ageOf(m.changedAt, now)}` : "no merge read yet", m.number ? INK : DIM];
      }), 92, 56);
    };
    const island = () => {
      const C = BL.contributors, counts = { working: 0, chilling: 0, sleeping: 0, away: 0 }, now = Date.now();
      for (const e of C.activeRoster) { const s = C.stateFor(e, now); if (s in counts) counts[s]++; }
      const net = BL.net, room = net.state.backend;
      let outside = 0, inside = 0;
      if (room) for (const r of net.remotes.values()) { if (!r.zone || r.zone === "outside") outside++; else inside++; }
      frame("ON THE ISLAND", BL.oogatronLive.state.enabled ? "activity from GitHub" : "baked activity", BL.oogatronLive.state.enabled);
      rows([
        ["Working", num(counts.working), GREEN], ["Chilling", num(counts.chilling), ACCENT], ["Sleeping", num(counts.sleeping), DIM],
        ["Away", num(counts.away), DIM],
        ["Online · outside / inside", room ? `${num(outside + (net.state.me ? 1 : 0))} / ${num(inside)}` : "—", room ? INK : DIM]
      ], 74, 42);
      if (!room) footnote("Who is online shows where the island's own server runs");
    };
    const bananas = () => {
      const s = BL.donations.state, t = s.tally, live = !!s.connected, top = s.board && s.board[0], last = s.recent && s.recent[0];
      frame("BANANAS", live ? (s.network && s.network !== "mainnet" ? `test network (${s.network})` : "tips over Lightning") : "no tips feed here", live);
      rows([
        ["The island's pile", `${num(Math.floor(world.level || 0))} bananas`, ACCENT],
        ["Tips, all time", t ? `${num(t.count)} · ${num(t.sats)} sats` : "—"],
        ["Latest tip", last ? `${last.handle || "anon"} · ${num(last.sats)} sats` : "—", last ? GREEN : DIM],
        ["Top tipper", top ? `${top.handle} · ${num(top.bananas)} bananas` : "—", top ? ACCENT : DIM]
      ], 82, 48);
      if (!live) footnote("Tips go live where the island's own server runs");
    };
    // The arcade's records, watched for this visit (they answer only where the island's server keeps them).
    const offRecords = RECORDS.map(([id]) => BL.highscores.watch(id, () => {}));
    const records = () => {
      const available = BL.net.state.backend && BL.net.state.highscores === true;
      frame("ARCADE · RECORDS", available ? "shared records" : "no records server here", available);
      const list = [];
      for (const [id, name] of RECORDS) {
        const data = BL.highscores.get(id), rule = BL.highscoreRules.get(id);
        if (!data || !rule) continue;
        let best = null;
        for (const m of rule.machines) { const v = data.highscores[m]; if (v && (best === null || (rule.direction === "asc" ? v < best : v > best))) best = v; }
        if (best !== null) list.push([name, rule.unit === "milliseconds" ? time(best) : num(best), ACCENT]);
        if (list.length === 6) break;
      }
      if (list.length) rows(list, 74, 40);
      else footnote(available ? "No records set yet" : "Records show where the island's own server runs");
    };
    const cam = (v) => () => {
      g.imageSmoothingEnabled = true;
      g.drawImage(v.canvas, 0, 0, W, H);
      g.fillStyle = "rgba(0,0,0,0.12)";
      for (let y = 0; y < H; y += 3) g.fillRect(0, y, W, 1);
    };
    const MEMPOOL = 1;
    const channels = [
      { title: "Bitcoin · the chain", paint: chain, live: true, cam: null },
      { title: "Mempool · live", paint: mempool, live: true, cam: null },
      { title: "Mempool island · weather", paint: weather, live: true, cam: null },
      { title: "Totems · latest merges", paint: totems, live: true, cam: null },
      { title: "On the island", paint: island, live: true, cam: null },
      { title: "Bananas", paint: bananas, live: true, cam: null },
      { title: "Arcade · records", paint: records, live: true, cam: null },
      ...views.map((v) => ({ title: `Island cam · ${v.label}`, paint: cam(v), live: false, cam: v }))
    ];
    const captions = channels.map((c) => c.title.toUpperCase()), counters = channels.map((_, i) => `${i + 1}/${channels.length}`);
    // The shuffle: a fresh order each round, never repeating the channel just shown.
    const order = channels.map((_, i) => i);
    const shuffle = () => {
      const last = order[order.length - 1];
      for (let i = order.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0, t = order[i]; order[i] = order[j]; order[j] = t; }
      if (order.length > 1 && order[0] === last) { const t = order[0]; order[0] = order[1]; order[1] = t; }
    };
    shuffle();
    const tv = { channel: order[0], slot: 0, wait: CHANNEL_SECONDS, snow: 0, live: 0, version: 0, open: false, newBlock: 0 };
    let seed = 1;
    const caption = () => {
      g.fillStyle = "rgba(0,0,0,0.6)"; g.fillRect(0, H - BAR, W, BAR);
      g.fillStyle = "#ffffff"; g.font = `700 18px ${font}`; g.textAlign = "left"; g.textBaseline = "middle";
      g.fillText(tv.newBlock > 0 && tv.channel === MEMPOOL ? "NEW BLOCK FOUND!" : captions[tv.channel], 14, H - BAR / 2);
      g.fillStyle = ACCENT; g.textAlign = "right"; g.fillText(counters[tv.channel], W - 14, H - BAR / 2);
    };
    const paint = () => {
      if (tv.snow > 0) {
        const d = snow.data;
        for (let i = 0; i < d.length; i += 4) { seed = (Math.imul(seed, 1103515245) + 12345) | 0; d[i] = d[i + 1] = d[i + 2] = (seed >>> 24); d[i + 3] = 255; }
        g.imageSmoothingEnabled = false;
        g.putImageData(snow, 0, 0);
        g.drawImage(canvas, 0, 0, W / 4, H / 4, 0, 0, W, H);
      } else {
        channels[tv.channel].paint();
        caption();
      }
      tv.version++;
    };
    const tune = (channel, byHand) => {
      tv.channel = (channel + channels.length) % channels.length;
      tv.wait = CHANNEL_SECONDS;
      tv.live = LIVE_SECONDS;
      tv.snow = reduced() || byHand ? 0 : STATIC_SECONDS;
      paint();
    };
    const next = () => {
      tv.slot++;
      if (tv.slot >= order.length) { shuffle(); tv.slot = 0; }
      tune(order[tv.slot], false);
    };
    paint();
    const still = () => reduced() || tv.open;
    // A block found while watching cuts to the mempool, unless the viewer is holding a channel.
    const offBlocks = BL.mempool.subscribe((event) => {
      if (event.type !== "block") return;
      tv.newBlock = CHANNEL_SECONDS;
      if (!still()) tune(MEMPOOL, false);
    });
    const update = (dt) => {
      if (tv.open && !boardOpen()) tv.open = false;
      if (tv.newBlock > 0) tv.newBlock -= dt;
      if (tv.snow > 0 && (tv.snow -= dt) <= 0) { tv.snow = 0; paint(); return; }
      if (!still() && (tv.wait -= dt) <= 0) { next(); return; }
      if (tv.snow <= 0 && channels[tv.channel].live && (tv.live -= dt) <= 0) { tv.live = LIVE_SECONDS; paint(); }
    };
    const board = {
      title: "Island TV", wide: true,
      help: "Ooga Booga Land's live feeds and its places, on shuffle; GitHub is on the big sign. Arrow keys change channel; it holds still while this is open.",
      get canvas() { const c = channels[tv.channel]; return c.cam && tv.snow <= 0 ? c.cam.canvas : canvas; },
      get count() { return channels.length; }, get index() { return tv.channel; },
      get caption() { return channels[tv.channel].title; },
      get note() {
        const c = channels[tv.channel];
        if (c.cam) return "A picture the island drew of this place as you climbed the beanstalk.";
        return `Live from the island's own feeds, refreshed every second. ${reduced() ? "With reduced motion the TV holds each channel until you change it here." : `The TV shuffles channels every ${CHANNEL_SECONDS} seconds while nobody is reading this, and cuts to the mempool when a block is found.`}`;
      },
      get version() { return tv.version; },
      go: (i) => tune(i, true)
    };
    const open = () => { tv.open = true; tv.version++; };
    return { canvas, channels, tv, board, update, open, tune, get title() { return channels[tv.channel].title; }, dispose: () => { offBlocks(); for (const off of offRecords) off(); canvas.width = canvas.height = 0; } };
  };
  BL.cloudArchiveTv = { create, W, H, CHANNEL_SECONDS };
})();
