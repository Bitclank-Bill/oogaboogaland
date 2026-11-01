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
  const order = (list) => list.slice().sort((a, b) => yearKey(a.def.year) - yearKey(b.def.year) || a.era - b.era || a.order - b.order);
  const create = ({ items, eras, connections, sourceOf, records = [] }) => {
    const seen = new Set();
    for (const it of items) {
      if (!it.id || seen.has(it.id)) throw new Error(`genesis catalogue: ${it.id ? `id ${it.id} twice` : "an exhibit without an id"}`);
      seen.add(it.id);
    }
    const sorted = order(items), trailIds = [];
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
      const step = trailIds.indexOf(it.id) + 1;
      return Object.freeze({
        id: it.id, index, era: it.era, eraName: era.name, eraYears: era.years,
        year: d.year, yearKey: yearKey(d.year), date: d.date || "",
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
      filter: (name) => name === "trail" ? entries.filter((e) => e.trail) : name === "context" ? entries.filter((e) => !e.trail) : entries
    };
  };
  BL.genesisCatalogue = { create, order, yearKey };
})();
