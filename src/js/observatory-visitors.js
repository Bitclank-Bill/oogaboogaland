// Public pose silhouettes shared by observer adapters. No scene ownership, NPCs or subscriptions.
(() => {
  "use strict";
  const BL = window.BL = window.BL || {};
  let body = null;
  const create = (add, zone) => {
    if (!body) {
      const { box, merge } = BL.models;
      body = merge(
        box({ w: 0.55, h: 0.55, d: 0.5, color: "#be9873", offset: { y: 1.2 } }),
        box({ w: 0.6, h: 0.58, d: 0.36, color: "#987b57", offset: { y: 0.68 } }),
        box({ w: 0.64, h: 0.22, d: 0.39, color: "#4d5b39", offset: { y: 0.38 } }),
        ...[-1, 1].flatMap(side => [
          box({ w: 0.18, h: 0.46, d: 0.2, color: "#be9873", offset: { x: side * 0.39, y: 0.72 } }),
          box({ w: 0.2, h: 0.3, d: 0.27, color: "#be9873", offset: { x: side * 0.18, y: 0.15 } })])
      );
    }
    const actors = [];
    for (let i = 0; i < 32; i++) { const node = add(body); node.visible = false; actors.push({ node, id: null }); }
    return {
      update(step, visit = null) {
        let count = 0;
        for (const rec of BL.net.remotes.values()) {
          if (count === actors.length) break;
          if (!rec.body || rec.zone !== zone || rec.poseZone !== zone) continue;
          const entry = actors[count++], p = entry.node.position, ease = entry.id !== rec.id ? 1 : Math.min(1, step * 12);
          entry.node.visible = true; entry.id = rec.id;
          p.x += (rec.x - p.x) * ease; p.y += (rec.y - p.y) * ease; p.z += (rec.z - p.z) * ease;
          entry.node.rotation.y = rec.yaw;
          if (visit) visit(rec);
        }
        for (let i = count; i < actors.length; i++) { actors[i].node.visible = false; actors[i].id = null; }
      },
      dispose() { actors.length = 0; }
    };
  };
  BL.observatoryVisitors = { create };
})();
