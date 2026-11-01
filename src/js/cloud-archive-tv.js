// The Cloud Archive lounge TV: the island's live feeds and the pictures from the climb, on shuffle. Its channels are
// every page of the Oogatron (GitHub, through a reader of the archive's own hanging board, live as it is), the chain
// (chain.js: height, price, fees, backlog, hashrate, difficulty), the totems' repositories' latest merges
// (totem-feed.js), who is working, chilling and asleep on the island (contributors.js, net.js for who is online), the
// banana tips (donations.js), and the island-cam pictures the hub drew on the climb (`world.archiveViews`). It reads
// only what the page's feeds already hold (the director starts them for the page life) and never fetches. A feed that
// is off (nosim, a static host) shows that it is waiting.
// `update(dt, elapsed)` steps the shuffle (every CHANNEL_SECONDS through STATIC_SECONDS of snow, a fresh order each
// round; held under reduced motion or while its board is open) and repaints a live channel once a LIVE_SECONDS.
// `board` is the shared board dialog's view of it: every channel a page, live as the screen. `dispose` in leave.
(() => {
  "use strict";
  const BL = window.BL;
  const W = 480, H = 360, CHANNEL_SECONDS = 9, STATIC_SECONDS = 0.25, LIVE_SECONDS = 1, BAR = 44;
  const INK = "#f3efe4", DIM = "#a6a6a2", ACCENT = "#e8b04a", GREEN = "#46ff70", BG = "#0a0c0a", RED = "#e5533d";
  const ageOf = (at, now) => {
    if (!at) return null;
    const s = Math.max(0, Math.round((now - at) / 1000));
    return s < 60 ? `${s}s ago` : s < 3600 ? `${Math.floor(s / 60)}m ago` : s < 86400 ? `${Math.floor(s / 3600)}h ago` : `${Math.floor(s / 86400)}d ago`;
  };
  const num = (n, digits = 0) => Number.isFinite(n) ? n.toLocaleString("en-US", { maximumFractionDigits: digits, minimumFractionDigits: digits }) : "—";
  const create = ({ views, reader, font, reduced, boardOpen }) => {
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
    const chain = () => {
      const s = BL.chain.snapshot, now = Date.now(), live = s.at > 0;
      frame("BITCOIN · THE CHAIN", live ? `updated ${ageOf(s.at, now)}` : "waiting for the chain feed", live);
      rows([
        ["Block height", s.height ? num(s.height) : "—", ACCENT],
        ["Price", s.priceUsd ? `$${num(s.priceUsd)}` : "—", s.priceOpenUsd && s.priceUsd < s.priceOpenUsd ? RED : GREEN],
        ["Fees sat/vB · next / 30 min / 1 h", s.fastestFee ? `${num(s.fastestFee)} / ${num(s.halfHourFee)} / ${num(s.hourFee)}` : "—"],
        ["Mempool", s.count ? `${num(s.count)} tx · ${num(s.vsize / 1e6, 1)} MvB` : "—"],
        ["Hashrate", s.hashrate ? `${num(s.hashrate / 1e18)} EH/s` : "—"],
        ["Difficulty", s.remainingBlocks ? `${s.difficultyChange >= 0 ? "+" : ""}${num(s.difficultyChange, 1)}% in ${num(s.remainingBlocks)} blocks` : "—"],
        ["Last block", s.lastBlockAt ? ageOf(s.lastBlockAt, now) : "—"]
      ], 70, 35);
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
      const net = BL.net, online = net.state.backend ? net.remotes.size + (net.state.me ? 1 : 0) : null;
      frame("ON THE ISLAND", BL.oogatronLive.state.enabled ? "activity from GitHub" : "baked activity", BL.oogatronLive.state.enabled);
      rows([
        ["Working", num(counts.working), GREEN], ["Chilling", num(counts.chilling), ACCENT],
        ["Sleeping", num(counts.sleeping), DIM], ["Away", num(counts.away), DIM],
        ["Online now", online === null ? "needs the island's server" : num(online), online === null ? DIM : INK]
      ], 84, 50);
    };
    const tips = () => {
      const s = BL.donations.state, t = s.tally, live = !!s.connected;
      frame("BANANA TIPS", live ? (s.network && s.network !== "mainnet" ? `test network (${s.network})` : "Lightning") : "no tips feed here", live);
      const recent = (s.recent || []).slice(0, 3).map((d) => [d.handle || "anon", `${num(d.sats)} sats`, ACCENT]);
      rows([
        ["Tips, all time", t ? num(t.count) : "—"], ["Sats", t ? num(t.sats) : "—", ACCENT], ["Bananas", t ? num(t.bananas) : "—"],
        ...recent
      ], 84, 44);
      if (!live) { g.textAlign = "center"; g.font = `500 15px ${font}`; g.fillStyle = DIM; g.fillText("Tips go live where the island's own server is running", W / 2, H - BAR - 18); }
    };
    // A GitHub page: the reader (paused, paged by the TV) drawn full width under the title; the channel takes the
    // page's own name.
    const github = (page, channel) => () => {
      if (reader.index !== page % reader.count) reader.go(page % reader.count);
      reader.update(clock);
      const name = `GitHub · ${reader.caption || "Oogatron"}`;
      if (channel.title !== name) { channel.title = name; captions[channel.index] = name.toUpperCase(); }
      const live = BL.oogatronLive.state.enabled;
      frame("GITHUB · OOGABOOGAX", live ? "from GitHub" : "baked snapshot", live);
      g.imageSmoothingEnabled = false;
      g.drawImage(reader.canvas, 0, 56, W, Math.round(W * reader.canvas.height / reader.canvas.width));
    };
    const cam = (v) => () => {
      g.imageSmoothingEnabled = true;
      g.drawImage(v.canvas, 0, 0, W, H);
      g.fillStyle = "rgba(0,0,0,0.12)";
      for (let y = 0; y < H; y += 3) g.fillRect(0, y, W, 1);
    };
    const channels = [];
    for (let i = 0; i < reader.count; i++) {
      reader.go(i);
      const c = { title: `GitHub · ${reader.caption || `page ${i + 1}`}`, paint: null, live: true, cam: null, index: i };
      c.paint = github(i, c); channels.push(c);
    }
    channels.push({ title: "Bitcoin · the chain", paint: chain, live: true, cam: null });
    channels.push({ title: "Totems · latest merges", paint: totems, live: true, cam: null });
    channels.push({ title: "On the island", paint: island, live: true, cam: null });
    channels.push({ title: "Banana tips", paint: tips, live: true, cam: null });
    for (const v of views) channels.push({ title: `Island cam · ${v.label}`, paint: cam(v), live: false, cam: v });
    const captions = channels.map((c, i) => `${c.title.toUpperCase()}`), counters = channels.map((_, i) => `${i + 1}/${channels.length}`);
    // The shuffle: a fresh order each round, never repeating the channel just shown.
    const order = channels.map((_, i) => i);
    const shuffle = () => {
      const last = order[order.length - 1];
      for (let i = order.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0, t = order[i]; order[i] = order[j]; order[j] = t; }
      if (order.length > 1 && order[0] === last) { const t = order[0]; order[0] = order[1]; order[1] = t; }
    };
    shuffle();
    const tv = { channel: order[0], slot: 0, wait: CHANNEL_SECONDS, snow: 0, live: 0, version: 0, open: false };
    let clock = 0, seed = 1;
    const caption = () => {
      g.fillStyle = "rgba(0,0,0,0.6)"; g.fillRect(0, H - BAR, W, BAR);
      g.fillStyle = "#ffffff"; g.font = `700 18px ${font}`; g.textAlign = "left"; g.textBaseline = "middle";
      g.fillText(captions[tv.channel], 14, H - BAR / 2);
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
    const update = (dt, elapsed) => {
      clock = elapsed;
      if (tv.open && !boardOpen()) tv.open = false;
      if (tv.snow > 0 && (tv.snow -= dt) <= 0) { tv.snow = 0; paint(); return; }
      if (!still() && (tv.wait -= dt) <= 0) { next(); return; }
      if (tv.snow <= 0 && channels[tv.channel].live && (tv.live -= dt) <= 0) { tv.live = LIVE_SECONDS; paint(); }
    };
    const board = {
      title: "Island TV", wide: true,
      help: "The island's live feeds and the pictures from your climb, on shuffle. Arrow keys change channel; it holds still while this is open.",
      get canvas() { const c = channels[tv.channel]; return c.cam && tv.snow <= 0 ? c.cam.canvas : canvas; },
      get count() { return channels.length; }, get index() { return tv.channel; },
      get caption() { return channels[tv.channel].title; },
      get note() {
        const c = channels[tv.channel];
        if (c.cam) return "A picture the island drew as you climbed the beanstalk, not a live feed.";
        return `Live from the island's own feeds, refreshed every second. ${reduced() ? "With reduced motion the TV holds each channel until you change it here." : `The TV shuffles channels every ${CHANNEL_SECONDS} seconds while nobody is reading this.`}`;
      },
      get version() { return tv.version; },
      go: (i) => tune(i, true)
    };
    const open = () => { tv.open = true; tv.version++; };
    return { canvas, channels, tv, board, update, open, tune, get title() { return channels[tv.channel].title; }, dispose: () => { reader.dispose(); canvas.width = canvas.height = 0; } };
  };
  BL.cloudArchiveTv = { create, W, H, CHANNEL_SECONDS };
})();
