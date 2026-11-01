// The Genesis museum's catalogue: every exhibit once, in date order, with its stable id and how it connects to Bitcoin.
// Pure (no DOM, renderer or audio), so Node can check it. scene-genesis.js builds it once a visit after every era is
// built; the workbench and the timeline menu read it (docs/genesis-voyage/OVERHAUL-CONTRACT.md, v1).
//
// `create({ items, eras, connections, sourceOf, records })`:
//   items        [{ id, era, order, def }]: def is the exhibit as built (genesis-exhibits.js prop, or the scene's own)
//   eras         genesis-world.js ERAS; connections genesis-exhibits.js CONNECTIONS; sourceOf genesis-props.js sourceOf
//   records      genesisTimelineData.records (READY only), whose `exhibit` links a record to an entry
// returns { entries, get, indexOf, next, prev, filter }. Entries are frozen and in chronological order: the year
// (a decade such as "1980s" as 1980.5), then era, then build order.
(() => {
  "use strict";
  const BL = window.BL = window.BL || {};
  const yearKey = (year) => typeof year === "number" ? year : +String(year).match(/\d{4}/)[0] + 0.5;
  // Modern museum toys and games: exhibits whose own date text says the object itself was made for the museum (a toy,
  // an original museum model or design, a homage, an invented puzzle or game, or a period style with nothing dated),
  // so their year is a gallery label, not history. They are shown as "modern museum toy" or "modern museum game · <the
  // era's span> gallery", never with a bare year, and stand after their era's dated exhibits, out of date ordering.
  // Exhibits that tell a dated event with a model (e2-pc and the IBM PC's unveiling, e4-wireless and 802.11's approval,
  // e3-padlock and PGP's publication, e6-laptop's announcement) and the two demonstrations stay dated. Each entry below
  // is the era file's own wording, quoted in short.
  const MODERN = {
    "e0-punch": "toy", // "the code is invented today"
    "e0-race": "toy", // "the race itself is a toy"
    "e0-nim": "toy", "e0-crt": "toy", "e0-pointer": "toy", // "a modern explanatory toy"
    "e1-gateway-puzzle": "toy", // "an illustration of the May 1974 paper"
    "e1-puzzle-post": "toy", "e1-dh-table": "toy", "e1-rsa-desk": "toy", // "a toy model of"
    "e1-floppy-toy": "toy", "e1-panel-toy": "toy", "e1-coupler-toy": "toy", // the hands-on toy beside each exhibit
    "e1-tv": "toy", "e1-calc": "toy", // "a toy tuner", "a toy with an 8-place display"
    "e1-paddle": "game", // "a modern museum homage on an original console"
    "e2-maze": "game", // "made for the voyage in 2026"
    "e2-four": "game", "e2-crt": "toy", "e2-cassette": "toy", // "a modern museum homage made in 2026"
    "e3-bbs": "toy", "e3-pager": "toy", // "period style; no model, date or specification claimed"
    "e3-rally": "game", // "the game is original to the voyage"
    "e4-desktop": "toy", // "an original museum design"
    "e4-cd": "game", "e4-pocket": "game", // "an invented museum puzzle", "an original maze"
    "e4-strategy": "game", // "this board is a modern museum homage"
    "e4-teletext": "toy", // "an original museum screen, no historical system claimed"
    "e5-ring": "toy", "e5-stamp": "toy", "e5-rpow-desk": "toy", "e5-bitgold-bench": "toy", "e5-mosaic": "toy", // "this toy illustrates; an original museum model"
    "e5-patchwork": "game", "e5-pocket": "game", // "a modern museum homage"
    "e5-loft-route": "game", // "this original puzzle; not a historical game"
    "e6-argument": "game", // "the game is a modern museum homage"
    "e6-layout": "toy", "e6-workstation": "toy", // "an original museum model", "an original, unbranded design"
    "e7-sync": "game", // "a modern homage ... not historical software"
    "e7-pc": "toy", "e7-frame": "toy" // "an invented, unbranded design", "an original demonstration"
  };
  const lastYear = (years) => { const m = String(years).match(/\d{4}/g); return +m[m.length - 1]; };
  const modernLabel = (kind, era) => `modern museum ${kind} · ${String(era.years).replace(/-/g, "–")} gallery`;
  const order = (list) => list.slice().sort((a, b) => yearKey(a.def.year) - yearKey(b.def.year) || a.era - b.era || a.order - b.order);
  const create = ({ items, eras, connections, sourceOf, records = [] }) => {
    const seen = new Set();
    for (const it of items) {
      if (!it.id || seen.has(it.id)) throw new Error(`genesis catalogue: ${it.id ? `id ${it.id} twice` : "an exhibit without an id"}`);
      seen.add(it.id);
    }
    // A modern toy or game sorts after every dated exhibit of its era (out of date ordering, at its gallery's end).
    const keyed = items.map((it) => MODERN[it.id] ? { ...it, def: { ...it.def, year: lastYear(eras[it.era].years) + 0.9 } } : it);
    const sorted = order(keyed).map((k) => items.find((it) => it.id === k.id)), trailIds = [];
    for (const it of sorted) if (it.def.connection && connections[it.def.connection] && connections[it.def.connection].trail) trailIds.push(it.id);
    const citationByRef = {};
    for (const it of sorted) if (it.def.connection === "citation") citationByRef[it.def.ref] = it.id;
    const linked = {};
    for (const r of records) if (r.exhibit) {
      if (!seen.has(r.exhibit)) throw new Error(`genesis catalogue: timeline record ${r.id} names a missing exhibit ${r.exhibit}`);
      (linked[r.exhibit] = linked[r.exhibit] || []).push(r.id);
    }
    const entries = sorted.map((it, index) => {
      const d = it.def, era = eras[it.era], c = d.connection || "context", conn = connections[c];
      if (!conn) throw new Error(`genesis catalogue: ${it.id} has an unknown connection ${c}`);
      const step = trailIds.indexOf(it.id) + 1, modern = MODERN[it.id] || null;
      if (modern && conn.trail) throw new Error(`genesis catalogue: ${it.id} is a modern ${modern} and cannot be a trail step`);
      return Object.freeze({
        id: it.id, index, era: it.era, eraName: era.name, eraYears: era.years, modern,
        // `year` is what the menu, the workbench and the boards show: a modern entry's gallery label, never a bare year.
        year: modern ? modernLabel(modern, era) : d.year, yearKey: modern ? lastYear(era.years) + 0.9 : yearKey(d.year), date: d.date || "",
        title: d.title, label: d.label || "", hint: d.hint || "",
        connection: c, connectionLabel: conn.label, trail: !!conn.trail, step,
        ref: d.ref || "", demonstrates: Object.freeze((d.demonstrates || []).slice()),
        listedAs: c === "bibliography" ? citationByRef[d.ref] || "" : "",
        timeline: Object.freeze((linked[it.id] || []).slice()),
        sources: Object.freeze((d.sourceKeys || []).map((key) => { const s = sourceOf(key) || {}; return Object.freeze({ key, label: s.label || key, href: s.href || "", kind: s.kind || "", verified: s.verified !== false }); })),
        status: "READY"
      });
    });
    Object.freeze(entries);
    const byId = new Map(entries.map((e) => [e.id, e]));
    const indexOf = (id) => byId.has(id) ? byId.get(id).index : -1;
    const step = (id, by) => { const i = indexOf(id); return i < 0 ? null : entries[(i + by + entries.length) % entries.length]; };
    return {
      entries, indexOf,
      get: (id) => byId.get(id) || null,
      next: (id) => step(id, 1), prev: (id) => step(id, -1),
      filter: (name) => name === "trail" ? entries.filter((e) => e.trail) : name === "context" ? entries.filter((e) => !e.trail) : entries,
      // The dated exhibits only (for anything that places entries on a time line, such as the white screen).
      dated: () => entries.filter((e) => !e.modern),
      // What to show for an exhibit's date by id: its gallery label for a modern one, else its year.
      shown: (id, fallback) => { const e = byId.get(id); return e ? e.year : fallback; }
    };
  };
  BL.genesisCatalogue = { create, order, yearKey, MODERN, modernLabel };
})();
