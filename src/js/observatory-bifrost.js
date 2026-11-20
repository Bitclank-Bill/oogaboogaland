// Camera-only Bifrost: the entrance window's reduced model, plus lightweight silhouettes of current
// public chamber poses. It never enters a scene, owns a player, publishes a pose or opens audio/network.
(() => {
  "use strict";
  const BL = window.BL = window.BL || {};
  const { createNode, addChild } = BL.scene;
  const create = (renderer) => {
    const BM = BL.bifrostModels, stand = BM.gateWindow(), meshes = new Set(), wrappers = new Map();
    const root = createNode({ cameraHidden: true }), actors = [], rings = [], beam = [];
    const source = { root, meshes, update: null, dispose: null,
      light: { clear: [0.015, 0.018, 0.04], sky: [0.3, 0.3, 0.38], ground: [0.13, 0.11, 0.1],
        direct: [0, 0, 0], directStrength: 0, ambientFloor: 0.5, diffuseFloor: 0 } };
    const mesh = (geometry) => {
      let g = wrappers.get(geometry);
      if (!g) {
        g = { ...geometry, castShadow: false, cameraFeedSource: source, cameraFeedKeep: true };
        wrappers.set(geometry, g); meshes.add(g);
      }
      return g;
    };
    const add = (geometry, position = null) => {
      const node = createNode({ geometry: mesh(geometry), ...(position ? { position } : {}) });
      addChild(root, node); return node;
    };
    add(stand.hall); add(stand.front);
    const glyph = add(stand.glyph, { x: 0, y: BM.CORE.glyphY, z: 0 });
    const rim = stand.rim ? add(stand.rim) : null;
    for (const geometry of stand.rings) rings.push(add(geometry, { x: 0, y: BM.CORE.glyphY, z: 0 }));
    for (const row of stand.beam.rows) {
      const node = add(stand.beam.geometry, { x: 0, y: row.y, z: 0 });
      Object.assign(node.scale, { x: row.r, y: row.h, z: row.r }); beam.push(node);
    }
    // 84 triangles per visitor, shared by a fixed pool. No character builders or costume caches.
    const { box, merge } = BL.models;
    const body = merge(
      box({ w: 0.55, h: 0.55, d: 0.5, color: "#be9873", offset: { y: 1.2 } }),
      box({ w: 0.6, h: 0.58, d: 0.36, color: "#987b57", offset: { y: 0.68 } }),
      box({ w: 0.64, h: 0.22, d: 0.39, color: "#4d5b39", offset: { y: 0.38 } }),
      ...[-1, 1].flatMap(side => [
        box({ w: 0.18, h: 0.46, d: 0.2, color: "#be9873", offset: { x: side * 0.39, y: 0.72 } }),
        box({ w: 0.2, h: 0.3, d: 0.27, color: "#be9873", offset: { x: side * 0.18, y: 0.15 } })])
    );
    for (let i = 0; i < 32; i++) { const node = add(body); node.visible = false; actors.push({ node, id: null }); }
    let since = 0, charge = 0, spin = 0, phase = 0;
    source.update = (dt) => {
      since += dt;
      if (since < 0.1) return;
      const step = Math.min(0.25, since); since = 0;
      let count = 0, want = 0;
      // poseZone prevents a zone announcement from reusing coordinates from the place just left.
      for (const rec of BL.net.remotes.values()) {
        if (count === actors.length) break;
        if (!rec.body || rec.zone !== "bifrost.chamber" || rec.poseZone !== rec.zone) continue;
        const entry = actors[count++], p = entry.node.position, fresh = entry.id !== rec.id;
        entry.node.visible = true; entry.id = rec.id;
        const ease = fresh ? 1 : Math.min(1, step * 12);
        p.x += (rec.x - p.x) * ease; p.y += (rec.y - p.y) * ease; p.z += (rec.z - p.z) * ease;
        entry.node.rotation.y = rec.yaw;
        for (let i = 0; i < BM.WINDOWS.length; i++) if (BM.WINDOWS[i].kind === "travel") {
          const a = BM.SLOTS[i], distance = Math.hypot(rec.x - Math.sin(a) * BM.HALL.r, rec.z - Math.cos(a) * BM.HALL.r);
          want = Math.max(want, Math.max(0, Math.min(1, (7.5 - distance) / 6.1)));
        }
      }
      for (let i = count; i < actors.length; i++) { actors[i].node.visible = false; actors[i].id = null; }
      charge += (want - charge) * Math.min(1, step * 2);
      spin = (spin + step * (0.6 + 5 * charge)) % (Math.PI * 2); phase += step;
      glyph.rotation.y = spin; glyph.position.y = BM.CORE.glyphY + Math.sin(phase * 1.5) * 0.024;
      for (let i = 0; i < rings.length; i++) rings[i].rotation.y += step * (i === 0 ? 0.5 : i === 1 ? -0.35 : 0.25) * (1 + 7 * charge);
      for (let i = 0; i < beam.length; i++) beam[i].glow = 0.85 + 0.15 * Math.sin(phase * 2 - i * 0.7);
      if (rim) rim.glow = 0.9 + Math.sin(phase * 2.4) * 0.1;
    };
    source.dispose = () => {
      for (const g of meshes) renderer.releaseGeometry(g);
      root.children.length = actors.length = rings.length = beam.length = 0; meshes.clear(); wrappers.clear();
    };
    return source;
  };
  BL.observatoryBifrost = { create };
})();
