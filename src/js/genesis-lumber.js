// Genesis museum: the gorillas' woodcutting camp by the campfire (genesis-campfire.js), behind the statue: one gorilla
// swings an axe at a tree, one splits logs on a chopping stump, and the log pile between them feeds the fire, where a
// third carries a log at a time, tosses it in (the fire flares) and walks back for the next. The Agent rig
// (agent.js, form "ape") does the walking; this file sets the arms for the work after its update, so it allocates
// nothing a frame. `layout()` (pure) is what a walker meets; `build(...)` makes it once a visit.
(() => {
  "use strict";
  const BL = window.BL = window.BL || {};
  const TREE = { x: 3.6, z: -37.4 }, STUMP = { x: 10.2, z: -37.2 }, PILE = { x: 7, z: -36.9 }, FIRE_EDGE = { x: 7, z: -33 }, PILE_EDGE = { x: 7, z: -35.7 };
  const layout = () => ({ boxes: [{ x0: TREE.x - 0.45, x1: TREE.x + 0.45, z0: TREE.z - 0.45, z1: TREE.z + 0.45 }, { x0: STUMP.x - 0.4, x1: STUMP.x + 0.4, z0: STUMP.z - 0.4, z1: STUMP.z + 0.4 }, { x0: PILE.x - 1.1, x1: PILE.x + 1.1, z0: PILE.z - 0.55, z1: PILE.z + 0.55 }] });
  const build = ({ M, createNode, addChild, place, top, footing, fx, flare }) => {
    const root = place(createNode({ position: { x: 0, y: top, z: 0 } }));
    const log = (len, r) => M.merge(M.turnedZ(M.lathe({ profile: [[0, -len / 2], [r, -len / 2], [r, len / 2], [0, len / 2]], segments: 8, color: "#6b4528" }), Math.PI / 2), ...[-1, 1].map((s) => M.moved(M.turnedZ(M.lathe({ profile: [[0, 0], [r * 0.92, 0], [r * 0.92, 0.01], [0, 0.01]], segments: 8, color: "#d9b07a" }), s * Math.PI / 2), s * len / 2, 0, 0)));
    // The tree being cut: a trunk with a notch and a crown of leaves.
    addChild(root, createNode({ geometry: M.merge(
      M.lathe({ profile: [[0, 0], [0.38, 0], [0.3, 2.6], [0.22, 4.2], [0, 4.4]], segments: 9, color: "#5a3a22" }),
      M.box({ w: 0.2, h: 0.25, d: 0.42, color: "#d9b07a", offset: { x: 0.28, y: 0.7, z: 0 } }),
      ...[[0, 4.6, 0, 1.6], [0.8, 4.1, 0.3, 1.1], [-0.7, 4.2, -0.4, 1.1], [0.2, 5.3, -0.2, 1.0]].map(([x, y, z, s]) => M.bevelBox({ w: s * 1.4, h: s, d: s * 1.4, color: "#3f7a2c", bevel: 0.2, offset: { x, y, z } }))), position: { x: TREE.x, y: 0, z: TREE.z } }));
    // The stump, the pile, and the split pieces round the stump.
    const pile = [];
    for (let row = 0; row < 3; row++) for (let k = 0; k < 4 - row; k++) pile.push(M.moved(log(1.9, 0.17), 0, 0.17 + row * 0.3, -0.36 * (3 - row) / 2 + k * 0.36 + row * 0.0));
    addChild(root, createNode({ geometry: M.merge(...pile), position: { x: PILE.x, y: 0, z: PILE.z } }));
    addChild(root, createNode({ geometry: M.merge(M.lathe({ profile: [[0, 0], [0.42, 0], [0.4, 0.55], [0, 0.55]], segments: 10, color: "#6b4528" }), M.lathe({ profile: [[0, 0.55], [0.38, 0.55], [0.38, 0.56], [0, 0.56]], segments: 10, color: "#d9b07a" }),
      ...[[0.7, 0.2, 0.9], [-0.6, -0.4, 2.2], [0.3, -0.75, 4]].map(([x, z, a]) => M.moved(M.turnedY(M.box({ w: 0.5, h: 0.12, d: 0.14, color: "#c8a06a" }), a), x, 0.06, z))), position: { x: STUMP.x, y: 0, z: STUMP.z } }));
    const axe = M.merge(M.box({ w: 0.06, h: 0.9, d: 0.06, color: "#8a5a2c", offset: { x: 0, y: -0.45, z: 0 } }), M.box({ w: 0.08, h: 0.22, d: 0.3, color: "#9aa4ae", offset: { x: 0, y: -0.86, z: 0.14 } }));
    const carried = log(0.9, 0.12);
    const ape = (x, z, heading) => {
      let a = null;
      a = BL.agent.create({ groundAt: (gx, gz) => footing.supportAt(gx, gz, a ? a.root.position.y + 0.5 : 2), walkable: (ax, az, bx, bz, feet) => footing.walkable(ax, az, bx, bz, 0.35, feet), form: "ape", x, z, heading, scale: 1.25 });
      addChild(root, a.root);
      a.root.position.y = 0;
      return a;
    };
    const CHIPS = ["#d9b07a", "#8a5a2c"].map((c) => M.particleGeometry ? M.particleGeometry(c, 0.06, 0) : M.box({ w: 0.06, h: 0.06, d: 0.06, color: c }));
    const face = (a, tx, tz) => { const q = a.root.position; a.place(q.x, q.z, Math.atan2(tx - q.x, tz - q.z)); };
    // The chopper at the tree, the splitter at the stump (each an axe in hand), and the fire tender.
    const chopper = ape(TREE.x + 1.15, TREE.z + 0.15, 0), splitter = ape(STUMP.x - 0.95, STUMP.z + 0.35, 0), tender = ape(PILE_EDGE.x, PILE_EDGE.z, Math.PI);
    face(chopper, TREE.x, TREE.z); face(splitter, STUMP.x, STUMP.z);
    for (const a of [chopper, splitter]) addChild(a.parts.armR, createNode({ geometry: axe, position: { x: 0, y: -0.15, z: 0 } }));
    const held = createNode({ geometry: carried, position: { x: 0.3, y: -0.55, z: 0.25 }, visible: false });
    addChild(tender.parts.armR, held);
    const T = { phase: "load", t: 0, to: [{ x: FIRE_EDGE.x, z: FIRE_EDGE.z }], back: [{ x: PILE_EDGE.x, z: PILE_EDGE.z }] };
    const swing = (a, t, rate, k) => {
      const s = Math.sin(t * rate + k), up = s > 0 ? s : s * 0.35;
      a.parts.armR.rotation.x = -1.2 - up * 1.4; a.parts.armL.rotation.x = -1.0 - up * 1.2;
      a.parts.armR.rotation.z = 0.15; a.parts.armL.rotation.z = -0.15;
      a.parts.torso.rotation.x = 0.15 + up * 0.12;
      return s;
    };
    let last = 0, lastSplit = 0, time = 0;
    const update = (dt, calm) => {
      time += dt;
      const s = calm ? 0.5 : 1;
      for (const a of [chopper, splitter]) { a.setGait("idle"); a.update(dt); }
      const c = swing(chopper, time * s, 4, 0), sp = swing(splitter, time * s, 3.2, 1.3);
      if (fx && c < -0.3 && last >= -0.3) fx.burst(TREE.x + 0.35, top + 0.75, TREE.z, 3, CHIPS, 0.8);
      if (fx && sp < -0.3 && lastSplit >= -0.3) fx.burst(STUMP.x, top + 0.6, STUMP.z, 3, CHIPS, 0.8);
      last = c; lastSplit = sp;
      // The tender: pick up at the pile, walk to the fire, toss, walk back.
      const q = tender.root.position;
      T.t += dt;
      if (T.phase === "load" && T.t > 1.4 / s) { held.visible = true; tender.walk(T.to); T.phase = "carry"; T.t = 0; }
      else if (T.phase === "carry" && Math.hypot(q.x - FIRE_EDGE.x, q.z - FIRE_EDGE.z) < 0.35) { face(tender, 7, -31); T.phase = "toss"; T.t = 0; }
      else if (T.phase === "toss" && T.t > 0.8) { held.visible = false; if (flare) flare(); tender.walk(T.back); T.phase = "return"; T.t = 0; }
      else if (T.phase === "return" && Math.hypot(q.x - PILE_EDGE.x, q.z - PILE_EDGE.z) < 0.35) { face(tender, PILE.x, PILE.z); T.phase = "load"; T.t = 0; }
      if (T.phase === "load" || T.phase === "toss") tender.setGait("idle");
      tender.update(dt);
      if (held.visible) { tender.parts.armR.rotation.x = -0.9; tender.parts.armL.rotation.x = -0.9; }
      if (T.phase === "toss") { const k = Math.min(1, T.t / 0.8); tender.parts.armR.rotation.x = tender.parts.armL.rotation.x = -0.9 - Math.sin(k * Math.PI) * 1.5; }
      if (T.phase === "load") { const k = Math.min(1, T.t * s / 1.4); tender.parts.torso.rotation.x = Math.sin(k * Math.PI) * 0.5; }
    };
    const liveGeometry = (set) => { for (const a of [chopper, splitter, tender]) a.liveGeometry(set); };
    const dispose = () => { for (const a of [chopper, splitter, tender]) a.dispose(); };
    return { root, update, liveGeometry, dispose };
  };
  BL.genesisLumber = { layout, build };
})();
