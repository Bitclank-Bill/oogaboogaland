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
//
// Rules (docs/genesis-voyage/BUILD-PLAN.md): words come from the era's dossier (docs/genesis-voyage/eras/, branch
// gv/research) and only from entries marked ready; dates say what they mark; context is labelled context; original,
// unbranded models only; no speculation about Satoshi Nakamoto's identity and no invented quotes.
(() => {
  "use strict";
  const BL = window.BL = window.BL || {};
  const eras = [], sources = {};
  const register = (n, def) => {
    if (!Number.isInteger(n) || n < 0) throw new Error(`genesis exhibits: bad era ${n}`);
    if (eras[n]) throw new Error(`genesis exhibits: era ${n} registered twice`);
    if (!def || typeof def.build !== "function") throw new Error(`genesis exhibits: era ${n} needs build(kit)`);
    for (const key of Object.keys(def.sources || {})) {
      const s = def.sources[key];
      if (sources[key]) throw new Error(`genesis exhibits: source ${key} defined twice`);
      if (!s || !/^https:\/\//.test(s.href || "") || !s.label) throw new Error(`genesis exhibits: source ${key} needs a label and an https link`);
      sources[key] = s;
    }
    eras[n] = def;
  };
  BL.genesisExhibits = { register, eras, sources };
})();
