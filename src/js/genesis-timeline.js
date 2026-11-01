// The Genesis museum's timeline: the huge white screen's picture and the menu it opens (docs/genesis-voyage/
// OVERHAUL-CONTRACT.md, v1). Owned by the timeline-menu builder; this is the seed moved out of the gv/museum prototype
// at the interface freeze.
//
// `BL.genesisTimeline.paint(ctx, w, h, catalogue, records)`: draws the white screen (pure canvas drawing, once a visit;
//   the host owns its geometry and pick box). A line from the axis is a date only, never a claim of influence: gold
//   for a whitepaper citation, a gold ring for documented influence, grey for context.
// `BL.genesisTimeline.create(host, root)` → { open(focusId), close(), get isOpen(), dispose() }
//   root   the menu's dialog in index.html (#genesis-menu, between the genesis-timeline markers)
//   Every catalogue entry as a button by era and date, with how it connects; filters All, Steps toward Bitcoin and
//   Context. Choosing one calls `host.open(id, "menu")`. Its own close calls `host.menuClosed()`.
(() => {
  "use strict";
  const BL = window.BL = window.BL || {};
  const firstYear = (years) => +String(years).match(/\d{4}/)[0];
  const ERA_STARTS = [1956, 1970, 1980, 1990, 1996, 2000, 2008, 2009];
  // The white screen is read from the walk, metres away: it carries only the whitepaper's citations and documented
  // influences (the gold entries), each in large type on its own straight leader, placed so no line or label crosses
  // another; every other exhibit is in the menu the screen opens (Billy's play, integration-3).
  const SHORT = (title) => String(title).split(/:| \/ | - |, at /)[0].trim();
  // The entries the screen labels: the whitepaper's citations and documented influences before the paper's own era.
  const labelled = (entries) => entries.filter((e) => (e.connection === "citation" || e.connection === "influence") && e.era < 6);
  const MARK_GAP = 38, MARK_R = 15, RING = 8; // markers' spacing within a shared year, radius and the ring's stroke
  // Where every label goes (pure, so Node can check it). Each label is two lines on a straight leader up or down from
  // its marker. Entries sharing a year get markers side by side within that year (MARK_GAP apart, catalogue order).
  // Placed rightmost marker first, each takes the nearest free row above or below the axis, running right of its
  // leader or else left: free when no label in that row overlaps its span, its leader misses every label in the rows
  // nearer the axis, and no leader to a farther row runs through its span. So no line crosses a label. A label that
  // finds no place throws: the screen never drops an entry silently.
  const layoutLabels = ({ items, X, axisY, measure, x0: left, x1: right, FONT1, FONT2 }) => {
    const ROW = 150, GAP = 20, rows = { up: [0, 1, 2].map((k) => axisY - 130 - k * ROW), down: [0, 1, 2].map((k) => axisY + 200 + k * ROW) };
    const taken = { up: [], down: [] }, groups = [], byYear = new Map();
    for (const e of items) { const k = e.yearKey; if (!byYear.has(k)) { byYear.set(k, []); groups.push(byYear.get(k)); } byYear.get(k).push({ e }); }
    for (const grp of groups) grp.forEach((m, j) => { m.year = X(m.e.yearKey); m.mx = m.year + (j - (grp.length - 1) / 2) * MARK_GAP; });
    const clear = (at, r) => at < r.x0 - GAP || at > r.x1 + GAP;
    const free = (side, k, x0, x1, at) => taken[side].every((r) => r.k === k ? x1 + GAP < r.x0 || x0 > r.x1 + GAP : r.k < k ? clear(at, r) : r.at < x0 - GAP || r.at > x1 + GAP);
    // A search, not a greedy pass: each label tries its places nearest-first, and a label left without one sends the
    // search back to move an earlier label (a few hundred steps at most for the screen's entries).
    const marks = groups.flat().sort((a, b) => b.mx - a.mx).map((m) => {
      const e = m.e, cited = e.connection === "citation", top = `${e.year}${cited && e.ref ? `  ${e.ref}` : ""}`, name = SHORT(e.title);
      return { m, e, cited, top, name, w: Math.min(760, Math.max(measure(top, FONT1), measure(name, FONT2))) + 24 };
    });
    const chosen = new Array(marks.length);
    let steps = 0;
    const place = (i) => {
      if (i === marks.length) return true;
      const t = marks[i], at = t.m.mx;
      for (let k = 0; k < 3; k++) for (const side of ["up", "down"]) for (const dir of ["right", "left"]) {
        if (++steps > 200000) return false;
        const x0 = dir === "right" ? at - 12 : at + 12 - t.w, x1 = x0 + t.w;
        if (x0 < left || x1 > right || !free(side, k, x0, x1, at)) continue;
        const r = { k, x0, x1, at };
        taken[side].push(r); chosen[i] = { side, k, dir, x0, x1 };
        if (place(i + 1)) return true;
        taken[side].pop();
      }
      return false;
    };
    if (!place(0)) throw new Error(`genesis timeline: no room on the white screen for all ${marks.length} labels (${marks.map((t) => t.e.id).join(", ")})`);
    const labels = marks.map((t, i) => ({ id: t.e.id, cited: t.cited, top: t.top, name: t.name, mx: t.m.mx, year: t.m.year, ...chosen[i], ly: rows[chosen[i].side][chosen[i].k] }));
    return { labels, groups: groups.map((grp) => grp.map((m) => labels.find((l) => l.id === m.e.id))), rows };
  };
  const paint = (g, W, H, catalogue) => {
    g.fillStyle = "#f7f4ec"; g.fillRect(0, 0, W, H);
    const Y0 = 1955, Y1 = 2010, ax0 = 150, ax1 = W - 560, axisY = Math.round(H * 0.5), X = (y) => ax0 + (y - Y0) / (Y1 - Y0) * (ax1 - ax0);
    const bands = ["#efe7d6", "#f5efe4"], eras = [], bandTop = 200, bandBottom = H - 120;
    for (const e of catalogue.entries) if (!eras[e.era]) eras[e.era] = { n: e.era, name: e.eraName, start: firstYear(e.eraYears) || ERA_STARTS[e.era] };
    eras.forEach((e, i) => {
      if (!e || e.n > 5) return;
      const y0 = e.start, y1 = eras[i + 1] ? eras[i + 1].start : 2008, w = X(y1) - X(y0);
      g.fillStyle = bands[i % 2]; g.fillRect(X(y0), bandTop, w, bandBottom - bandTop);
      g.fillStyle = "#6f665a"; g.font = "bold 44px system-ui, sans-serif"; g.textAlign = "left"; g.textBaseline = "alphabetic";
      g.fillText(`ERA ${e.n}`, X(y0) + 14, H - 70, w - 24);
      g.font = "32px system-ui, sans-serif"; g.fillText(e.name, X(y0) + 14, H - 28, w - 24);
    });
    g.fillStyle = "#1c1a17"; g.font = "bold 110px Georgia, serif"; g.textAlign = "left";
    g.fillText("The Genesis timeline", 150, 132);
    g.font = "40px system-ui, sans-serif"; g.fillStyle = "#3d3832";
    g.fillText("Gold dot: cited in the whitepaper  ·  ring: documented influence  ·  tap for every exhibit", 1300, 124, 1340);
    g.strokeStyle = "#1c1a17"; g.lineWidth = 14; g.beginPath(); g.moveTo(ax0, axisY); g.lineTo(ax1, axisY); g.stroke();
    g.font = "bold 40px system-ui, sans-serif"; g.fillStyle = "#5c564d"; g.textAlign = "center"; g.lineWidth = 4;
    for (let y = 1960; y <= 2000; y += 10) { g.beginPath(); g.moveTo(X(y), axisY - 18); g.lineTo(X(y), axisY + 18); g.stroke(); g.fillText(String(y), X(y), axisY + 64); }
    const items = labelled(catalogue.entries), FONT1 = "bold 62px system-ui, sans-serif", FONT2 = "48px system-ui, sans-serif";
    const measure = (text, font) => { g.font = font; return g.measureText(text).width; };
    const placed = layoutLabels({ items, X, axisY, measure, x0: 20, x1: W - 470, FONT1, FONT2 });
    // A year shared by several entries: one bracket on the axis spans their markers, which stand side by side within
    // that year (catalogue order), so a ring is never hidden under a dot.
    for (const grp of placed.groups) if (grp.length > 1) {
      g.strokeStyle = "#b98512"; g.lineWidth = 5; g.beginPath(); g.moveTo(grp[0].mx, axisY + 30); g.lineTo(grp[grp.length - 1].mx, axisY + 30); g.stroke();
      g.beginPath(); g.moveTo(grp[0].year, axisY + 30); g.lineTo(grp[0].year, axisY + 44); g.stroke();
    }
    for (const p of placed.labels) {
      const up = p.side === "up", right = p.dir === "right";
      g.strokeStyle = "#b98512"; g.lineWidth = 6;
      g.beginPath(); g.moveTo(p.mx, axisY); g.lineTo(p.mx, up ? p.ly + 66 : p.ly - 74); g.stroke();
      g.textAlign = right ? "left" : "right"; const tx = right ? p.mx + 10 : p.mx - 10;
      g.fillStyle = "#7a5200"; g.font = FONT1; g.fillText(p.top, tx, p.ly, 760);
      g.fillStyle = "#2a2621"; g.font = FONT2; g.fillText(p.name, tx, p.ly + 56, 760);
    }
    for (const p of placed.labels) {
      g.beginPath(); g.arc(p.mx, axisY, MARK_R, 0, 7);
      if (p.cited) { g.fillStyle = "#d9a11a"; g.fill(); } else { g.fillStyle = "#f7f4ec"; g.fill(); g.lineWidth = RING; g.strokeStyle = "#d9a11a"; g.stroke(); }
    }
    const drawn = placed.labels.length;
    const px = W - 300;
    g.fillStyle = "#d9a11a"; g.beginPath(); g.arc(px, axisY, 130, 0, 7); g.fill();
    g.fillStyle = "#1c1a17"; g.font = "bold 58px Georgia, serif"; g.textAlign = "center"; g.fillText("31 OCT", px, axisY - 6); g.fillText("2008", px, axisY + 56);
    g.font = "bold 48px system-ui, sans-serif"; g.fillText("The whitepaper", px, axisY - 160);
    g.fillStyle = "#3a352f"; g.beginPath(); g.arc(px, axisY + 300, 64, 0, 7); g.fill();
    g.fillStyle = "#f7f4ec"; g.font = "bold 34px system-ui, sans-serif"; g.fillText("JAN", px, axisY + 294); g.fillText("2009", px, axisY + 330);
    g.fillStyle = "#3a352f"; g.font = "40px system-ui, sans-serif"; g.fillText("The first block, after the paper", px, axisY + 420, 520);
    return drawn;
  };
  // The menu's sections: one per era, in era order, each holding its entries in the catalogue's date order. (Listed by
  // date alone, an entry dated before its own era, such as a paper Era 6 cites, would break into another era's run and
  // repeat that era's heading.) Pure, so Node can check it; no entry's data changes.
  const grouped = (entries) => {
    const out = [];
    for (const e of entries) { let g = out.find((x) => x.era === e.era); if (!g) { g = { era: e.era, name: e.eraName, years: e.eraYears, entries: [] }; out.push(g); } g.entries.push(e); }
    return out.sort((a, b) => a.era - b.era);
  };
  const create = (host, root) => {
    const ac = new AbortController(), signal = ac.signal, list = root.querySelector("#genesis-menu-list");
    let filter = "all";
    const write = (node, tag, text, cls) => { const n = document.createElement(tag); n.textContent = text; if (cls) n.className = cls; node.append(n); return n; };
    const fill = () => {
      list.replaceChildren();
      for (const g of grouped(host.catalogue.filter(filter))) {
        write(list, "h3", `Era ${g.era} · ${g.name} · ${g.years}`);
        for (const e of g.entries) {
          const b = document.createElement("button");
          b.type = "button"; b.dataset.exhibit = e.id;
          write(b, "span", String(e.year), "menu-year");
          write(b, "span", e.title, "menu-title");
          write(b, "span", `${e.trail ? "● " : ""}${e.connectionLabel}${e.ref ? ` ${e.ref}` : ""}`, `menu-tag tag-${e.connection}`);
          list.append(b);
        }
      }
    };
    root.addEventListener("close", () => host.menuClosed(), { signal });
    root.querySelector("[data-menu-close]").addEventListener("click", () => root.close(), { signal });
    root.addEventListener("click", (e) => {
      const b = e.target.closest("button");
      if (!b) return;
      if (b.dataset.filter) { filter = b.dataset.filter; for (const f of root.querySelectorAll("[data-filter]")) f.setAttribute("aria-pressed", String(f === b)); fill(); }
      else if (b.dataset.exhibit) { const id = b.dataset.exhibit; root.close(); host.open(id, "menu"); }
    }, { signal });
    return {
      open: (focusId) => {
        fill();
        if (!root.open) root.showModal();
        const b = focusId && list.querySelector(`[data-exhibit="${CSS.escape(focusId)}"]`);
        if (b) b.focus();
      },
      close: () => { if (root.open) root.close(); },
      get isOpen() { return root.open; },
      dispose: () => { if (root.open) root.close(); ac.abort(); }
    };
  };
  BL.genesisTimeline = { paint, create, grouped, layoutLabels, labelled, SHORT, MARK_GAP, MARK_R, RING };
})();
