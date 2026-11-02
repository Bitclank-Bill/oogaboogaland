// The Genesis Voyage's era exhibits: what stands in each era's cave, one file per era (genesis-era-0.js to
// genesis-era-7.js), so several builders can work at once without touching the scene. Each file calls
//
//   BL.genesisExhibits.register(n, { sources, build(kit), update(dt, elapsed, state), active(on, state), dispose() })
//
// once. `sources` adds source keys ({ key: { label, href, kind, verified } }, `kind` one of "whitepaper citation",
// "documented influence" or "context"; `verified: false` until the page itself was read). `build(kit)` runs once a
// visit, inside `enter`, and must only create nodes through the kit. `update` (optional) runs every frame while the
// visitor's boat or Ooga is in that era's cave and must allocate nothing; `state` is { era, walking, reading, x, z, calm } (`reading`: a panel or
// terminal is open, so hold anything that would call for attention, such as a pager), and
// while `state.calm` (the visit's Calm, reduced motion) is on, hold decorative movement and blinking still, showing
// command results in their final, readable state instead. `active` (optional) is called with false when the visitor
// leaves the era's cave (stop anything that outlives frames, such as sound scheduled ahead; coming back must not
// resume it) and with true on entering it. `dispose` (optional) runs on leave; nodes are removed with the scene's
// root anyway.
//
// The kit (made by scene-genesis.js for the era being built):
//   era            the era (genesis-world.js ERAS[n]): n, name, years, z0, z1, z (middle), cave, banks, theme
//   top            the banks' walking height; channel { x0, x1 } is the stream (keep the stream and 1.5 m beside it clear)
//   M, createNode, addChild   the engine's models and scene graph helpers
//   place(node)    adds a node under the scene's root and returns it
//   solid(w, h, d, color, x, y, z, emissive = 0)   a box, placed
//   label(title, sub, opts)  BL.factoryModels.label: { face, back, width, height }
//   sign(title, sub, x, y, z, yaw = 0, height = 0.6)  a two-sided label standing at (x, y, z), facing +z turned by yaw
//   obstacle(x0, x1, z0, z1)  a box a walking Ooga cannot enter (put one under every solid exhibit)
//   notify(text)   a short toast from `update` (a string made ahead, not per frame); nothing before the HUD is up
//   prop(def)      a usable exhibit: def is genesis-props.js's prop ({ id, year, title, label, sourceKeys, at, onUse,
//                  reach }) plus `pick: { w, h, d }`, the box a tap selects. `era` is filled in. The label must show
//                  the year. onUse(state) returns { board: { room, pages: [{ caption, title, text: [..] }], sources } },
//                  { terminal } (genesis-props.js's createDos / stampTerminal shape) or { caption: "text" }. A
//                  panel's `room` is its lettered title: letters, digits, space and / : ! ? + - . only.
//                  Optional, for the shared signage (docs/genesis-voyage/EXHIBIT-CONTRACT.md): `connection`, one of
//                  "citation" (with `ref`, the whitepaper's reference, e.g. "[3]"), "influence", "anchor" (the
//                  whitepaper itself, Era 6 only), "demonstration" (with `demonstrates`, the ids of the trail stops
//                  whose idea it shows working, e.g. Era 3's press for Fingerprints and Time's [3] and [4]),
//                  "bibliography" (with `ref`: an entry of the whitepaper's own reference list as Era 6's shelf
//                  shows it; it names the citation stop upstream that tells that work's story, so the list is
//                  neither uncited context nor a second stop for the same paper) or "context"; the first three put
//                  the exhibit on the Steps toward Bitcoin trail, numbered in date order across all eras, and a
//                  demonstration or a bibliography entry is never a stop of its own. A board's last page (a
//                  terminal's first lines) then says how it connects.
//                  Optional `hint`: a short line of what to do there (e.g. "Type SEARCH, then VERIFY"), shown at the
//                  foot of the screen when the visitor walks up, instead of the exhibit's title and year.
//
// `register`'s def may also carry `overview: { summary, pages, sourceKeys }`: `summary` (at most 280 characters) is shown on the
// era's overview board and panel; `pages` (optional, at most 3, as a board's pages) follow it in that panel, for an
// era's own guide (what to try, how to read the cave). A prop's `pick` may name its centre (`x`, `z`) so a tap can
// land on the model itself; without them it stands on the prop's `at`.
//
// Plots (checked by the unit tier with genesis-world.js `reservedZones`): nothing in a cave's gateway (its first
// 10 m, the pylons and overview board) or, in Era 3, Fingerprints and Time's room; nothing taller than 8 m; the old
// stream's line and 1.5 m beside it stay clear (the gallery's walk). The museum packs each era's pieces closer
// together (genesis-world.js packEra), keeping all of these.
//
// Rules (docs/genesis-voyage/BUILD-PLAN.md): words come from the era's dossier (docs/genesis-voyage/eras/, branch
// gv/research) and only from entries marked ready; dates say what they mark; context is labelled context; original,
// unbranded models only; no speculation about Satoshi Nakamoto's identity and no invented quotes.
(() => {
  "use strict";
  const BL = window.BL = window.BL || {};
  const eras = [], sources = {};
  // How an exhibit connects to Bitcoin (the dossiers' classes); `trail` ones make up the Steps toward Bitcoin.
  const CONNECTIONS = {
    citation: { label: "Whitepaper citation", trail: true },
    influence: { label: "Documented influence", trail: true },
    anchor: { label: "The whitepaper itself", trail: true },
    demonstration: { label: "Demonstration", trail: false },
    bibliography: { label: "In the whitepaper's reference list", trail: false },
    context: { label: "Context", trail: false }
  };
  // What is wrong with a prop's connection fields, or null.
  const checkProp = (n, d) => {
    if (d.hint !== undefined && (typeof d.hint !== "string" || !d.hint || d.hint.length > 90)) return `${d.id}: a hint is a short line (1 to 90 characters)`;
    if (d.connection === undefined) return d.ref ? `${d.id}: a reference without a connection` : d.demonstrates ? `${d.id}: \`demonstrates\` needs connection "demonstration"` : null;
    if (!CONNECTIONS[d.connection]) return `${d.id}: connection must be one of ${Object.keys(CONNECTIONS).join(", ")}`;
    if (d.connection === "citation" && !/^\[[1-8]\]$/.test(d.ref || "")) return `${d.id}: a whitepaper citation names its reference, e.g. "[3]"`;
    if (d.connection === "bibliography" && !/^\[[1-8]\]$/.test(d.ref || "")) return `${d.id}: a bibliography entry names its reference, e.g. "[3]"`;
    if (d.connection === "bibliography" && n !== 6) return `${d.id}: only Era 6's shelf holds the whitepaper's reference list`;
    if (d.connection !== "citation" && d.connection !== "bibliography" && d.ref) return `${d.id}: only a whitepaper citation or a bibliography entry has a reference number`;
    if (d.connection === "anchor" && n !== 6) return `${d.id}: only Era 6 holds the whitepaper itself`;
    const shows = d.demonstrates;
    if (d.connection === "demonstration" && !(Array.isArray(shows) && shows.length && shows.every((id) => typeof id === "string" && id))) return `${d.id}: a demonstration names the trail stops it shows (\`demonstrates\`)`;
    if (d.connection !== "demonstration" && shows !== undefined) return `${d.id}: only a demonstration names stops it shows`;
    return null;
  };
  // A year to sort by: a whole year as itself; a decade such as "1980s" (an era file's honest "some time in these
  // years") just after its first year, 1980.5, so it sorts deliberately rather than as NaN.
  const yearKey = (year) => typeof year === "number" ? year : +String(year).match(/\d{4}/)[0] + 0.5;
  // The trail: every prop whose connection is on it, in date order (era, then build order, breaking ties), each given
  // its `step`. `list` is [{ era, def, order }].
  const trailOf = (list) => {
    const trail = list.filter((p) => p.def.connection && CONNECTIONS[p.def.connection].trail)
      .sort((a, b) => yearKey(a.def.year) - yearKey(b.def.year) || a.era - b.era || a.order - b.order);
    trail.forEach((p, i) => { p.step = i + 1; });
    return trail;
  };
  const register = (n, def) => {
    if (!Number.isInteger(n) || n < 0) throw new Error(`genesis exhibits: bad era ${n}`);
    if (eras[n]) throw new Error(`genesis exhibits: era ${n} registered twice`);
    if (!def || typeof def.build !== "function") throw new Error(`genesis exhibits: era ${n} needs build(kit)`);
    if (def.overview !== undefined && (typeof def.overview.summary !== "string" || !def.overview.summary || def.overview.summary.length > 280)) throw new Error(`genesis exhibits: era ${n} overview.summary must be 1 to 280 characters`);
    for (const k of (def.overview && def.overview.sourceKeys) || []) if (typeof k !== "string") throw new Error(`genesis exhibits: era ${n} overview.sourceKeys must be source keys`);
    const pages = def.overview && def.overview.pages;
    if (pages !== undefined && (!Array.isArray(pages) || pages.length > 3 || pages.some((p) => !p || typeof p.caption !== "string" || typeof p.title !== "string" || !Array.isArray(p.text) || !p.text.length))) throw new Error(`genesis exhibits: era ${n} overview.pages must be at most 3 pages, each with a caption, a title and text`);
    for (const key of Object.keys(def.sources || {})) {
      const s = def.sources[key];
      if (sources[key]) throw new Error(`genesis exhibits: source ${key} defined twice`);
      if (!s || !/^https:\/\//.test(s.href || "") || !s.label) throw new Error(`genesis exhibits: source ${key} needs a label and an https link`);
      sources[key] = s;
    }
    eras[n] = def;
  };
  BL.genesisExhibits = { register, eras, sources, CONNECTIONS, checkProp, trailOf, yearKey };
})();
