// The Genesis Voyage's era exhibits: what stands in each era's cave, one file per era (genesis-era-0.js to
// genesis-era-7.js), so several builders can work at once without touching the scene. Each file calls
//
//   BL.genesisExhibits.register(n, { sources, build(kit), update(dt, elapsed, state), dispose() })
//
// once. `sources` adds source keys ({ key: { label, href, kind, verified } }, `kind` one of "whitepaper citation",
// "documented influence" or "context"; `verified: false` until the page itself was read). `build(kit)` runs once a
// visit, inside `enter`, and must only create nodes through the kit. `update` (optional) runs every frame while the
// visitor's boat or Ooga is in that era's cave and must allocate nothing. `dispose` (optional) runs on leave; nodes
// are removed with the scene's root anyway.
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
//   prop(def)      a usable exhibit: def is genesis-props.js's prop ({ id, year, title, label, sourceKeys, at, onUse,
//                  reach }) plus `pick: { w, h, d }`, the box a tap selects. `era` is filled in. The label must show
//                  the year. onUse(state) returns { board: { room, pages: [{ caption, title, text: [..] }], sources } },
//                  { terminal } (genesis-props.js's createDos / stampTerminal shape) or { caption: "text" }. A
//                  panel's `room` is its lettered title: letters, digits, space and / : ! ? + - . only.
//                  Optional, for the shared signage (docs/genesis-voyage/EXHIBIT-CONTRACT.md): `connection`, one of
//                  "citation" (with `ref`, the whitepaper's reference, e.g. "[3]"), "influence", "anchor" (the
//                  whitepaper itself, Era 6 only) or "context"; the first three put the exhibit on the Steps toward
//                  Bitcoin trail, numbered in date order across all eras. A board's last page then says how it connects.
//
// `register`'s def may also carry `overview: { summary }` (at most 280 characters), shown on the era's overview board.
//
// Plots (checked by the unit tier with genesis-world.js `reservedZones`): nothing in a cave's gateway (its first
// 10 m, the pylons and overview board), the dock and its boarding ramps by the middle of the cave, the lamp posts or,
// in Era 3, Fingerprints and Time's room; nothing taller than 8 m; the stream and 1.5 m beside it stay clear.
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
    context: { label: "Context", trail: false }
  };
  // What is wrong with a prop's connection fields, or null.
  const checkProp = (n, d) => {
    if (d.connection === undefined) return d.ref ? `${d.id}: a reference without a connection` : null;
    if (!CONNECTIONS[d.connection]) return `${d.id}: connection must be one of ${Object.keys(CONNECTIONS).join(", ")}`;
    if (d.connection === "citation" && !/^\[[1-8]\]$/.test(d.ref || "")) return `${d.id}: a whitepaper citation names its reference, e.g. "[3]"`;
    if (d.connection !== "citation" && d.ref) return `${d.id}: only a whitepaper citation has a reference number`;
    if (d.connection === "anchor" && n !== 6) return `${d.id}: only Era 6 holds the whitepaper itself`;
    return null;
  };
  // The trail: every prop whose connection is on it, in date order (era, then build order, breaking ties), each given
  // its `step`. `list` is [{ era, def, order }].
  const trailOf = (list) => {
    const trail = list.filter((p) => p.def.connection && CONNECTIONS[p.def.connection].trail)
      .sort((a, b) => a.def.year - b.def.year || a.era - b.era || a.order - b.order);
    trail.forEach((p, i) => { p.step = i + 1; });
    return trail;
  };
  const register = (n, def) => {
    if (!Number.isInteger(n) || n < 0) throw new Error(`genesis exhibits: bad era ${n}`);
    if (eras[n]) throw new Error(`genesis exhibits: era ${n} registered twice`);
    if (!def || typeof def.build !== "function") throw new Error(`genesis exhibits: era ${n} needs build(kit)`);
    if (def.overview !== undefined && (typeof def.overview.summary !== "string" || !def.overview.summary || def.overview.summary.length > 280)) throw new Error(`genesis exhibits: era ${n} overview.summary must be 1 to 280 characters`);
    for (const key of Object.keys(def.sources || {})) {
      const s = def.sources[key];
      if (sources[key]) throw new Error(`genesis exhibits: source ${key} defined twice`);
      if (!s || !/^https:\/\//.test(s.href || "") || !s.label) throw new Error(`genesis exhibits: source ${key} needs a label and an https link`);
      sources[key] = s;
    }
    eras[n] = def;
  };
  BL.genesisExhibits = { register, eras, sources, CONNECTIONS, checkProp, trailOf };
})();
