// Era 4's information screen: an original remote-control screen of numbered text pages in a broadcast-text style.
// The interface, layout, page numbers and words are the museum's own, not a copy of any real service. Which real
// system, country and years it resembles is on HOLD (docs/genesis-voyage/exhibits/era-4.md): no source could be read
// while it was built, so the screen names none and dates nothing of its own. Its record pages carry only READY
// research records that are context only (BL.genesisTimelineData, era 4), word for word: the citations and the
// influence have their own stations.
//
// BL.genesisEra4Games.teletext = { create(records), terminal(core), make(host), ROWS, COLS }
// - `create(records)`: the pure pages and remote, Node-loadable: `go(number)`, `key(digit)`, `next()`, `prev()`,
//   `reveal()`, `reset()`, the state on `core.s`, the built `pages` (each { number, title, rows, quiz, sources }).
// - `terminal(core)`: a museum terminal for the era file, usable today.
// - `make(host)`: the retro-games.js factory interface, drawn with BL.retroGames.kit (read when called).
(() => {
  "use strict";
  const BL = window.BL = window.BL || {};
  const G = BL.genesisEra4Games = BL.genesisEra4Games || {};
  const COLS = 26, ROWS = 10;
  // Word-wrapped once, when the pages are built.
  const wrap = (text, out) => {
    let line = "";
    for (const word of String(text).toUpperCase().split(/\s+/)) {
      if (!word) continue;
      if (line && line.length + 1 + word.length > COLS) { out.push(line); line = ""; }
      line = line ? `${line} ${word.length > COLS ? word.slice(0, COLS) : word}` : word.slice(0, COLS);
    }
    if (line) out.push(line);
    return out;
  };
  const ABOUT = ["An original museum screen of numbered pages, made for this gallery in a broadcast-text style.",
    "It copies no real service. Which real system, country and years it resembles is on hold until a source is verified, so it names none.",
    "Its record pages repeat the museum's checked research records word for word."];
  const create = (records = []) => {
    const mine = records.filter((r) => r.era === 4 && r.connection && r.connection.contextOnly).slice().sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
    const pages = [];
    const page = (number, title, lines, extra = {}) => {
      const rows = [];
      for (const l of lines) l === "" ? rows.push("") : wrap(l, rows);
      pages.push({ number, title, head: title.slice(0, COLS), rows, quiz: null, sources: [], ...extra });
    };
    page(100, "INDEX", ["101 HOW TO USE", ...mine.map((r, i) => `${110 + i} ${r.dateLabel}`), mine.length > 1 ? "190 DATE QUIZ" : "", "199 ABOUT THIS SCREEN"].filter((l) => l !== ""));
    page(101, "HOW TO USE", ["Type a page number such as 110.", "NEXT and PREV step through the pages; INDEX goes home.", "On the quiz page, REVEAL shows the answer."]);
    mine.forEach((r, i) => page(110 + i, r.sign, [r.dateLabel, "", r.kid, "", `What the date marks: ${r.marks}.`, "Context only: not shown to have influenced Bitcoin."],
      { sources: (r.sources || []).map((s) => `${s.label}: ${s.url}`) }));
    if (mine.length > 1) {
      // The quiz: the first and last records' signs, shown in reverse date order; the answer is hidden until REVEAL.
      const a = mine[mine.length - 1], b = mine[0];
      page(190, "DATE QUIZ", ["Which came first?", `1: ${a.title}`, `2: ${b.title}`], { quiz: { answer: wrap(`2 came first: ${b.dateLabel}, then ${a.dateLabel}.`, []) } });
    }
    page(199, "ABOUT THIS SCREEN", ABOUT);
    const numbers = pages.map((p) => p.number);
    const s = { index: 0, entry: "", revealed: false, seen: new Uint8Array(pages.length), seenCount: 1, missing: 0 };
    s.seen[0] = 1;
    const show = (i) => {
      s.index = i; s.revealed = false; s.missing = 0;
      if (!s.seen[i]) { s.seen[i] = 1; s.seenCount++; }
    };
    const go = (n) => { const i = numbers.indexOf(n); if (i < 0) { s.missing = n; return false; } show(i); return true; };
    // A remote's digit: three make a page number.
    const key = (d) => {
      s.entry += String(d);
      if (s.entry.length < 3) return null;
      const n = Number(s.entry); s.entry = "";
      return go(n);
    };
    const next = () => show((s.index + 1) % pages.length);
    const prev = () => show((s.index + pages.length - 1) % pages.length);
    const reveal = () => { if (!pages[s.index].quiz) return false; s.revealed = !s.revealed; return true; };
    const reset = () => { s.seen.fill(0); s.seen[0] = 1; s.seenCount = 1; s.entry = ""; s.index = 0; s.revealed = false; s.missing = 0; };
    return { s, pages, go, key, next, prev, reveal, reset, get page() { return pages[s.index]; } };
  };

  // ---- the terminal ---------------------------------------------------------------------------------------
  const reply = (...lines) => ({ lines });
  const HELP = ["<page number> | NEXT | PREV | INDEX | REVEAL | SOURCES | RESET", "Example: type 110 to read the first record page."];
  const terminal = (core) => {
    const view = (first) => {
      const p = core.page, lines = first ? [first] : [];
      lines.push(`P${p.number}  ${p.title}`, ...p.rows);
      if (p.quiz) lines.push(...(core.s.revealed ? p.quiz.answer : ["(REVEAL shows the answer.)"]));
      lines.push(`Pages read: ${core.s.seenCount} of ${core.pages.length}.`);
      return { lines };
    };
    return {
      banner: ["HOW TO USE", "  1. Type 100 for the index, or any page number it lists.", "  2. Type NEXT or PREV to step page by page.", "  3. On page 190, type REVEAL for the answer.", "",
        ...ABOUT, ...HELP],
      prompt: "PAGE>",
      run(line) {
        const t = String(line).replace(/[\u0000-\u001f\u007f]/g, "").trim().toUpperCase().slice(0, 16);
        if (/^\d{3}$/.test(t)) return core.go(Number(t)) ? view() : reply(`Page ${t} is not on this screen. Type 100 for the index.`);
        if (t === "NEXT") { core.next(); return view(); }
        if (t === "PREV") { core.prev(); return view(); }
        if (t === "INDEX" || t === "LOOK" || t === "") { if (t === "INDEX") core.go(100); return view(); }
        if (t === "REVEAL") return core.reveal() ? view() : reply("Only the quiz page has an answer to reveal. Type 190.");
        if (t === "HELP") return reply(...HELP);
        if (t === "MORE") return reply(...ABOUT);
        if (t === "SOURCES") { const src = core.page.sources; return src.length ? reply(...src) : reply("This page's words are the museum's own; record pages list their sources."); }
        if (t === "RESET") { core.reset(); return { ...view("Screen reset to the index."), reset: true }; }
        return reply("Unknown command.", ...HELP);
      }
    };
  };

  // ---- the console (retro-games.js's factory interface) ---------------------------------------------------------
  // Left and right step pages, up and down scroll a long page, Space reveals the quiz or steps on. The run ends once
  // every page has been read; the score is the pages read.
  const make = (host) => {
    const K = BL.retroGames.kit, { W, H, INK, TEXT } = K, h = K.hooks(host);
    const core = create((BL.genesisTimelineData && BL.genesisTimelineData.records) || []), s = core.s, status = K.makeStatus("Pages");
    const run = { playing: false, steps: 0, stepsY: 0, scroll: 0, endIn: -1, ended: false };
    const label = core.pages.map((p) => `P${p.number}`);
    const tick = K.stepper((dt) => {
      if (run.endIn >= 0) { run.endIn -= dt; if (run.endIn < 0 && !run.ended) { run.ended = true; run.playing = false; h.onEnd(status.score); } }
    });
    const turned = () => {
      run.scroll = 0; status.score = s.seenCount; status.left = core.pages.length - s.seenCount;
      h.cue("step", 0.3);
      if (s.seenCount === core.pages.length && run.endIn < 0) { h.popup("ALL PAGES READ!", true); h.over(); run.endIn = 1.6; }
    };
    return {
      kind: "e4-teletext", name: "Information screen", aims: true, status,
      help: "Left and right change page. Up and down scroll. Space reveals the quiz answer. Read every page.",
      coach: ["Left and right change page · Space reveals", "Drag across to change page · tap to reveal"],
      stars: [3, core.pages.length - 1, core.pages.length],
      tickets: (score) => score,
      get playing() { return run.playing; },
      start() {
        core.reset(); run.playing = true; run.scroll = 0; run.endIn = -1; run.ended = false;
        run.steps = h.aim.steps; run.stepsY = h.aim.stepsY;
        status.score = 1; status.left = core.pages.length - 1; status.verb = "READ";
      },
      act() { if (!run.playing) return; if (!core.reveal()) { core.next(); turned(); } },
      stop() { run.playing = false; run.endIn = -1; },
      update(dt) {
        tick(dt);
        const dx = h.aim.steps - run.steps, dy = h.aim.stepsY - run.stepsY;
        run.steps = h.aim.steps; run.stepsY = h.aim.stepsY;
        if (!run.playing) return;
        if (dx) { dx > 0 ? core.next() : core.prev(); turned(); }
        else if (dy) { const max = Math.max(0, core.page.rows.length - ROWS); run.scroll = Math.max(0, Math.min(max, run.scroll + (dy > 0 ? 1 : -1))); }
      },
      draw(ctx) {
        const p = core.page;
        ctx.fillStyle = INK.night; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = INK.deep; ctx.fillRect(0, 0, W, 9);
        K.text(ctx, label[s.index], 2, 1, TEXT.lime);
        K.text(ctx, "GALLERY TEXT", 34, 1, TEXT.sky);
        K.number(ctx, s.seenCount, W - 2, 1, TEXT.banana, 1, 2);
        K.text(ctx, p.head, 2, 12, TEXT.banana);
        for (let r = 0; r < ROWS && r + run.scroll < p.rows.length; r++) K.text(ctx, p.rows[r + run.scroll], 2, 22 + r * 8, TEXT.bone);
        if (p.quiz && s.revealed) for (let r = 0; r < p.quiz.answer.length && r < 3; r++) K.text(ctx, p.quiz.answer[r], 2, 22 + (p.rows.length + 1 + r) * 8, TEXT.teal);
        ctx.fillStyle = INK.band; ctx.fillRect(0, H - 10, W, 10);
        if (!run.playing && !run.ended) K.centre(ctx, "PRESS START", H - 9, TEXT.banana);
        else K.text(ctx, p.quiz ? "SPACE REVEALS" : "< PAGES >", 2, H - 9, TEXT.stone);
      }
    };
  };
  G.teletext = { COLS, ROWS, create, terminal, make };
})();
