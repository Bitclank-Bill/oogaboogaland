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
  const SHORT = (title) => String(title).split(/:| \/ | - /)[0].trim();
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
    const items = catalogue.entries.filter((e) => (e.connection === "citation" || e.connection === "influence") && e.era < 6);
    // Each label is two lines (the year and reference, then a short name), left-aligned on a straight leader up or
    // down from its date. Placed rightmost first, each takes the nearest free row: free when no label in that row
    // overlaps its span, its leader misses every label in the rows nearer the axis, and no leader to a farther row runs
    // through its span. So no line crosses a label, wherever the dates cluster.
    const ROW = 170, GAP = 20, rows = { up: [0, 1, 2].map((k) => axisY - 132 - k * ROW), down: [0, 1].map((k) => axisY + 205 + k * ROW) }, taken = { up: [], down: [] };
    const clear = (at, r) => at < r.x0 - GAP || at > r.x1 + GAP;
    const free = (side, k, x0, x1, at) => taken[side].every((r) => r.k === k ? x1 + GAP < r.x0 || x0 > r.x1 + GAP : r.k < k ? clear(at, r) : r.at < x0 - GAP || r.at > x1 + GAP);
    const order = items.slice().sort((a, b) => b.yearKey - a.yearKey);
    let drawn = 0;
    for (const e of order) {
      const x = X(e.yearKey), cited = e.connection === "citation";
      const top = `${e.year}${cited && e.ref ? `  ${e.ref}` : ""}`, name = SHORT(e.title);
      g.font = "bold 70px system-ui, sans-serif"; const w1 = g.measureText(top).width;
      g.font = "54px system-ui, sans-serif"; const w2 = g.measureText(name).width;
      const w = Math.min(760, Math.max(w1, w2)) + 24, x0 = x - 12, x1 = x0 + w;
      let spot = null;
      for (let k = 0; k < 3 && !spot; k++) for (const side of ["up", "down"]) if (!spot && rows[side][k] !== undefined && free(side, k, x0, x1, x)) spot = { side, k };
      if (!spot) continue;
      taken[spot.side].push({ k: spot.k, x0, x1, at: x });
      const ly = rows[spot.side][spot.k], up = spot.side === "up";
      g.strokeStyle = "#b98512"; g.lineWidth = 6;
      g.beginPath(); g.moveTo(x, axisY); g.lineTo(x, up ? ly + 76 : ly - 82); g.stroke();
      g.textAlign = "left"; g.fillStyle = "#7a5200"; g.font = "bold 70px system-ui, sans-serif"; g.fillText(top, x + 10, ly, 760);
      g.fillStyle = "#2a2621"; g.font = "54px system-ui, sans-serif"; g.fillText(name, x + 10, ly + 62, 760);
      g.beginPath(); g.arc(x, axisY, 20, 0, 7);
      if (cited) { g.fillStyle = "#d9a11a"; g.fill(); } else { g.fillStyle = "#f7f4ec"; g.fill(); g.lineWidth = 8; g.strokeStyle = "#d9a11a"; g.stroke(); }
      drawn++;
    }
    const px = W - 300;
    g.fillStyle = "#d9a11a"; g.beginPath(); g.arc(px, axisY, 130, 0, 7); g.fill();
    g.fillStyle = "#1c1a17"; g.font = "bold 58px Georgia, serif"; g.textAlign = "center"; g.fillText("31 OCT", px, axisY - 6); g.fillText("2008", px, axisY + 56);
    g.font = "bold 48px system-ui, sans-serif"; g.fillText("The whitepaper", px, axisY - 160);
    g.fillStyle = "#3a352f"; g.beginPath(); g.arc(px, axisY + 300, 64, 0, 7); g.fill();
    g.fillStyle = "#f7f4ec"; g.font = "bold 34px system-ui, sans-serif"; g.fillText("JAN", px, axisY + 294); g.fillText("2009", px, axisY + 330);
    g.fillStyle = "#3a352f"; g.font = "40px system-ui, sans-serif"; g.fillText("The first block, after the paper", px, axisY + 420, 520);
    return drawn;
  };
  const create = (host, root) => {
    const ac = new AbortController(), signal = ac.signal, list = root.querySelector("#genesis-menu-list");
    let filter = "all";
    const write = (node, tag, text, cls) => { const n = document.createElement(tag); n.textContent = text; if (cls) n.className = cls; node.append(n); return n; };
    const fill = () => {
      list.replaceChildren();
      let era = -1;
      for (const e of host.catalogue.filter(filter)) {
        if (e.era !== era) { era = e.era; write(list, "h3", `Era ${era} · ${e.eraName} · ${e.eraYears}`); }
        const b = document.createElement("button");
        b.type = "button"; b.dataset.exhibit = e.id;
        write(b, "span", String(e.year), "menu-year");
        write(b, "span", e.title, "menu-title");
        write(b, "span", `${e.trail ? "● " : ""}${e.connectionLabel}${e.ref ? ` ${e.ref}` : ""}`, `menu-tag tag-${e.connection}`);
        list.append(b);
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
  BL.genesisTimeline = { paint, create };
})();
