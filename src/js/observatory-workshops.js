// Public workshop camera representations. Shared by all angles of a room; no game, machine,
// deferred scene, media player, private side-room or additional network feed is opened here.
(() => {
  "use strict";
  const BL = window.BL = window.BL || {};
  const { createNode, addChild } = BL.scene;
  const { box, merge, moved, turnedY, beam, lathe } = BL.models;
  const create = (renderer, zone) => {
    if (!["factory.hall", "arcade.hall", "factory.hangar"].includes(zone)) throw new Error("Unknown public workshop observer");
    const root = createNode({ cameraHidden: true }), meshes = new Set(), wrappers = new Map();
    const source = { root, meshes, light: { clear: [0.025, 0.025, 0.035], sky: [0.45, 0.42, 0.4], ground: [0.25, 0.22, 0.2],
      direct: [0, 0, 0], directStrength: 0, ambientFloor: 0.7, diffuseFloor: 0 } };
    const add = (geometry, position = null, yaw = 0) => {
      let g = wrappers.get(geometry);
      if (!g) {
        g = { ...geometry, castShadow: false, cameraFeedSource: source, cameraFeedKeep: true };
        wrappers.set(geometry, g); meshes.add(g);
      }
      const n = createNode({ geometry: g, ...(position ? { position } : {}), rotation: { x: 0, y: yaw, z: 0 } });
      addChild(root, n); return n;
    };
    const parts = [], put = (w, h, d, x, y, z, color, emissive = 0.25) =>
      parts.push(box({ w, h, d, color, emissive, offset: { x, y, z } }));
    const shell = (x0, x1, z0, z1, height) => {
      put(x1 - x0, 0.2, z1 - z0, (x0 + x1) / 2, -0.1, (z0 + z1) / 2, "#65574b");
      for (const x of [x0, x1]) put(0.3, height, z1 - z0, x, height / 2, (z0 + z1) / 2, "#403b38");
      for (const z of [z0, z1]) put(x1 - x0, height, 0.3, (x0 + x1) / 2, height / 2, z, "#403b38");
      put(x1 - x0, 0.2, z1 - z0, (x0 + x1) / 2, height, (z0 + z1) / 2, "#282b30");
    };
    if (zone === "factory.hall") {
      // The existing entrance-window model already retains the Factory's authored decks and machines.
      const w = BL.factoryModels.hubWindow();
      add(w.hall); add(w.front); add(w.chamber);
      for (const tank of w.tanks) add(tank.blue ? w.tank.blueDim : w.tank.orangeDim, { x: tank.x, y: tank.y, z: tank.z });
      // No invented forwards, flashes or forge activity: only current public visitors move.
    } else if (zone === "arcade.hall") {
      const A = BL.arcadeModels, L = A.LAYOUT, H = A.HALL, M = A.MEZZ;
      shell(-H.halfW, H.halfW, H.back, H.front, H.h);
      put(H.halfW * 2, 0.25, M.z1 - M.z0, 0, M.y - 0.125, (M.z0 + M.z1) / 2, "#8a5a32");
      parts.push(moved(lathe({ profile: [[A.STAGE.r, 0], [A.STAGE.r, A.STAGE.high], [0, A.STAGE.high]],
        segments: 24, color: "#76624a" }), A.STAGE.x, 0, A.STAGE.z));
      for (const [x0, z0, x1, z1] of M.stairs) for (let i = 0; i < 10; i++) {
        const height = M.y * (i + 1) / 10;
        put(M.stairW, height, Math.abs(z1 - z0) / 10, x0 + (x1 - x0) * (i + 0.5) / 10,
          height / 2, z0 + (z1 - z0) * (i + 0.5) / 10, "#8a5a32");
      }
      for (const c of L.cabinets) {
        const cabinet = merge(box({ w: A.CAB.w, h: 1.65, d: A.CAB.d, color: c.body, offset: { y: 0.825 } }),
          box({ w: 0.9, h: 0.65, d: 0.03, color: "#101b22", offset: { y: 1.2, z: A.CAB.d / 2 + 0.02 } }),
          box({ w: 1.15, h: 0.14, d: 0.1, color: c.trim, emissive: 0.65, offset: { y: 1.7, z: A.CAB.d / 2 } }));
        parts.push(moved(turnedY(cabinet, c.turn), c.x, c.y, c.z));
      }
      for (const p of L.pools) {
        put(3, 0.8, 1.7, p.x, 0.4, p.z, "#69472e"); put(2.8, 0.03, 1.5, p.x, 0.815, p.z, "#285943");
      }
      for (const p of L.hockeys) {
        put(2.6, 0.8, 1.4, p.x, 0.4, p.z, "#8b6845"); put(2.4, 0.03, 1.2, p.x, 0.815, p.z, "#9aaeb3");
      }
      for (const p of L.skee) put(1.5, 0.9, 4, p.x, 0.45, p.z - 1.2, "#8a5a32");
      for (const p of [L.snack, L.prizes]) put(4, 1.2, 1.5, p.x, 0.6, p.z, "#806044");
    } else {
      // Reduced public hall dimensions from hangar-models.js LAYOUT, kept independent of its deferred bundle.
      // Locked command/control/crew rooms, projector content and engine-test state are absent.
      shell(-22, 27, -34, 30, 18);
      put(10, 0.025, 64, 0, 0.015, -2, "#272e39");
      for (const x of [-5.1, 5.1]) put(0.15, 0.03, 64, x, 0.035, -2, "#c3ad53");
      put(9, 1.5, 5, 0, 0.75, 27.5, "#59616b");
      for (const x of [-17.8, 22.8]) put(2.4, 0.25, 39, x, 7.375, 4.5, "#515b68");
      for (const z of [22, 14, 6, -2, -10, -18, -26]) {
        for (const x of [-20, 25]) {
          put(0.45, 17, 0.45, x, 8.5, z, "#495462");
          put(0.12, 0.16, 1, x / 4, 0.15, z, "#58b4df", 0.8);
        }
        parts.push(beam(-20, 17, z, 25, 17, z, 0.35, "#495462"));
      }
      // The docked Jet's silhouette (nose toward -z), without animated engines or detailed internals.
      put(3.2, 2.2, 20, 15, 3.5, -10, "#bec5cb");
      put(17, 0.3, 5, 15, 3.1, -9, "#929daa");
      put(7, 0.25, 2.5, 15, 4.2, -1, "#929daa");
      put(0.35, 3, 3, 15, 5.1, -1, "#929daa");
      put(2, 0.8, 3, 15, 4.7, -16, "#34566b");
      for (const x of [12.6, 17.4]) put(1.8, 1.8, 7, x, 3, -4, "#636f7c");
      for (const z of [-10, -3, 4, 11]) {
        put(4, 0.9, 1.5, -13, 0.45, z, "#59616b");
        put(1.3, 0.8, 0.1, -13, 1.4, z - 0.4, "#31678b");
      }
    }
    if (parts.length) add(merge(...parts));
    const visitors = BL.observatoryVisitors.create(add, zone);
    source.update = dt => visitors.update(dt);
    source.dispose = () => {
      visitors.dispose(); for (const g of meshes) renderer.releaseGeometry(g);
      root.children.length = 0; meshes.clear(); wrappers.clear();
    };
    return source;
  };
  BL.observatoryWorkshops = { create };
})();
