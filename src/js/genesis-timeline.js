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
  const paint = (g, W, H, catalogue) => {
    g.fillStyle = "#f7f4ec"; g.fillRect(0, 0, W, H);
    const Y0 = 1955, Y1 = 2010, ax0 = 150, ax1 = W - 476, axisY = Math.round(H * 0.56), X = (y) => ax0 + (y - Y0) / (Y1 - Y0) * (ax1 - ax0);
    const bands = ["#efe7d6", "#f3ece0"], eras = [];
    for (const e of catalogue.entries) if (!eras[e.era]) eras[e.era] = { n: e.era, name: e.eraName, start: firstYear(e.eraYears) || ERA_STARTS[e.era] };
    eras.forEach((e, i) => {
      if (!e) return;
      const y0 = e.start, y1 = eras[i + 1] ? eras[i + 1].start : 2010;
      g.fillStyle = bands[i % 2]; g.fillRect(X(y0), 150, X(y1) - X(y0), H - 230);
      g.fillStyle = "#8a8172"; g.font = "bold 30px system-ui, sans-serif"; g.textAlign = "left"; g.textBaseline = "alphabetic";
      g.fillText(`ERA ${e.n}`, X(y0) + 10, H - 98);
      g.font = "24px system-ui, sans-serif"; g.fillText(e.name, X(y0) + 10, H - 66, X(y1) - X(y0) - 16);
    });
    g.fillStyle = "#1c1a17"; g.font = "bold 74px Georgia, serif"; g.textAlign = "left";
    g.fillText("The Genesis timeline", 150, 100);
    g.font = "34px system-ui, sans-serif"; g.fillStyle = "#4a453e";
    g.fillText("Each line marks a date, not an influence.   Gold: cited in the Bitcoin whitepaper   ·   gold ring: documented influence   ·   grey: context   ·   tap for the menu", 1060, 96);
    g.strokeStyle = "#1c1a17"; g.lineWidth = 12; g.beginPath(); g.moveTo(ax0, axisY); g.lineTo(ax1, axisY); g.stroke();
    g.font = "26px system-ui, sans-serif"; g.fillStyle = "#6f6a62"; g.textAlign = "center"; g.lineWidth = 3;
    for (let y = 1960; y <= 2000; y += 10) { g.beginPath(); g.moveTo(X(y), axisY - 14); g.lineTo(X(y), axisY + 14); g.stroke(); g.fillText(String(y), X(y), axisY + 46); }
    const items = catalogue.entries.filter((e) => e.connection !== "bibliography" && !/-panel$/.test(e.id) && e.era < 6);
    const tier = [0, 0];
    items.forEach((e, i) => {
      const up = i % 2 === 0, t = tier[up ? 0 : 1]++ % 5, x = X(e.yearKey), y = axisY + (up ? -1 : 1) * (90 + t * 78);
      const cited = e.connection === "citation", infl = e.connection === "influence", gold = cited || infl;
      g.strokeStyle = gold ? "#b98512" : "#8f897e"; g.lineWidth = gold ? 6 : 3;
      g.beginPath(); g.moveTo(x, axisY); g.lineTo(x - 40, y); g.lineTo(x - 330, y); g.stroke();
      g.fillStyle = gold ? "#8a5d00" : "#4a453e"; g.font = `${gold ? "bold " : ""}25px system-ui, sans-serif`; g.textAlign = "left";
      g.fillText(`${e.year}  ${e.title}${cited && e.ref ? ` ${e.ref}` : ""}`, x - 330, y - 9, 300);
      g.beginPath(); g.arc(x, axisY, gold ? 13 : 9, 0, 7);
      if (cited) { g.fillStyle = "#d9a11a"; g.fill(); } else if (infl) { g.fillStyle = "#f7f4ec"; g.fill(); g.lineWidth = 6; g.strokeStyle = "#d9a11a"; g.stroke(); } else { g.fillStyle = "#9a948a"; g.fill(); }
    });
    const px = W - 326;
    g.fillStyle = "#d9a11a"; g.beginPath(); g.arc(px, axisY, 92, 0, 7); g.fill();
    g.fillStyle = "#1c1a17"; g.font = "bold 40px Georgia, serif"; g.textAlign = "center"; g.fillText("31 OCT", px, axisY - 6); g.fillText("2008", px, axisY + 40);
    g.font = "bold 30px system-ui, sans-serif"; g.fillText("The whitepaper (Era 6)", px, axisY - 120);
    g.fillStyle = "#3a352f"; g.beginPath(); g.arc(px, axisY + 250, 46, 0, 7); g.fill();
    g.fillStyle = "#f7f4ec"; g.font = "bold 24px system-ui, sans-serif"; g.fillText("JAN", px, axisY + 246); g.fillText("2009", px, axisY + 272);
    g.fillStyle = "#3a352f"; g.font = "26px system-ui, sans-serif"; g.fillText("The first block, a later step (Era 7)", px, axisY + 336);
    return items.length;
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
