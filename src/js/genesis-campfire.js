// Genesis museum: the Oogas' campfire in the atrium, behind the statue: a ring of stones round burning logs, a heap of
// bananas, the peels the dancers have dropped, and the three potato Oogas from Block Frenzy dancing round it, hopping and
// waving, a banana in hand. Two carved totem poles stand by it. `layout()` (pure, so Node can check it) says where it
// all stands and what a walker meets; `build(...)` makes it once a visit and returns { update(dt, t, calm) }, which
// allocates nothing (the flames flicker and the dancers go round even in Calm, only slower).
(() => {
  "use strict";
  const BL = window.BL = window.BL || {};
  const FIRE = { x: 7, z: -31 }, RING = 2.3, SCALE = 1.35;
  const TOTEMS = [{ x: 3.4, z: -34.6, ry: 0.4, faces: ["#c8463c", "#e8c35a", "#3f8a4a", "#2f6db8"] }, { x: 10.6, z: -35, ry: -0.4, faces: ["#2f6db8", "#c8463c", "#e8c35a", "#7a3fb8"] }];
  const layout = () => ({ fire: FIRE, ring: RING * SCALE, totems: TOTEMS,
    boxes: [{ x0: FIRE.x - 1.3, x1: FIRE.x + 1.3, z0: FIRE.z - 1.3, z1: FIRE.z + 1.3 }, ...TOTEMS.map((t) => ({ x0: t.x - 0.6, x1: t.x + 0.6, z0: t.z - 0.6, z1: t.z + 0.6 }))] });
  const BANANA = "#f2d43a", BANANA_DK = "#d9b62a";
  const build = ({ M, createNode, addChild, place, top }) => {
    const root = place(createNode({ position: { x: FIRE.x, y: top, z: FIRE.z } }));
    // The pit: stones round three logs and the embers' glow.
    const pit = [];
    for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2; pit.push(M.bevelBox({ w: 0.42, h: 0.3, d: 0.34, color: k % 2 ? "#6e6a66" : "#86817a", bevel: 0.08, offset: { x: Math.sin(a) * 1.05, y: 0.15, z: Math.cos(a) * 1.05 } })); }
    for (const a of [0.3, 1.9, 3.5]) pit.push(M.turnedY(M.box({ w: 1.5, h: 0.2, d: 0.22, color: "#5a3a22", offset: { x: 0, y: 0.14, z: 0 } }), a));
    pit.push(M.box({ w: 1.1, h: 0.05, d: 1.1, color: "#ff6a1a", emissive: 1.2, offset: { x: 0, y: 0.06, z: 0 } }));
    addChild(root, createNode({ geometry: M.merge(...pit) }));
    const flame = M.merge(
      M.lathe({ profile: [[0, 0], [0.55, 0.2], [0.4, 0.8], [0, 1.5]], segments: 8, color: "#ff7a1a", emissive: 1.4 }),
      M.moved(M.lathe({ profile: [[0, 0], [0.34, 0.15], [0.24, 0.6], [0, 1.05]], segments: 7, color: "#ffd24a", emissive: 1.6 }), 0.15, 0.06, 0.1),
      M.moved(M.lathe({ profile: [[0, 0], [0.26, 0.12], [0.16, 0.4], [0, 0.72]], segments: 6, color: "#fff3a0", emissive: 1.8 }), -0.12, 0.06, -0.08));
    flame.castShadow = false;
    const fireNode = createNode({ geometry: flame, position: { x: 0, y: 0.08, z: 0 } });
    addChild(root, fireNode);
    // Bananas: one, a heap of them by the fire, and peels on the ground.
    const bananaGeo = () => { const parts = []; for (let k = 0; k < 5; k++) { const a = (k - 2) * 0.28; parts.push(M.box({ w: 0.11, h: 0.11, d: 0.12, color: k % 2 ? BANANA : BANANA_DK, offset: { x: 0, y: Math.cos(a) * 0.38 - 0.38, z: Math.sin(a) * 0.38 } })); } parts.push(M.box({ w: 0.06, h: 0.06, d: 0.06, color: "#5a3a22", offset: { x: 0, y: Math.cos(0.56) * 0.38 - 0.38, z: Math.sin(0.62) * 0.38 + 0.05 } })); return M.merge(...parts); };
    const heap = [];
    for (let k = 0; k < 11; k++) { const a = k * 2.3, r = k < 6 ? 0.42 : 0.18; heap.push(M.moved(M.turnedY(bananaGeo(), a), Math.sin(a) * r, 0.42 + (k < 6 ? 0 : 0.14), Math.cos(a) * r)); }
    addChild(root, createNode({ geometry: M.merge(...heap), position: { x: 1.6, y: 0, z: 0.4 } }));
    const peel = (() => { const parts = [M.box({ w: 0.14, h: 0.07, d: 0.14, color: BANANA_DK, offset: { x: 0, y: 0.04, z: 0 } })]; for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + 0.4; parts.push(M.turnedY(M.box({ w: 0.12, h: 0.035, d: 0.4, color: k % 2 ? BANANA : "#f2c62e", offset: { x: 0, y: 0.02, z: 0.23 } }), a)); } return M.merge(...parts); })();
    for (const [x, z, a] of [[-2.6, 1.2, 0.3], [2.2, -2.4, 1.9], [-1.4, -2.9, 3.3], [3.1, 1.9, 4.4]]) addChild(root, createNode({ geometry: peel, position: { x, y: 0.01, z }, rotation: { x: 0, y: a, z: 0 } }));
    // The potato Oogas: an egg-shaped tan body speckled darker, a leopard-spot loincloth, stubby legs, big dark eyes
    // and brows, an open mouth, and two little arms the update waves.
    const potato = (() => {
      const parts = [M.lathe({ profile: [[0, 0.18], [0.36, 0.26], [0.5, 0.55], [0.52, 0.85], [0.44, 1.15], [0.26, 1.33], [0, 1.38]], segments: 10, color: "#c9a06a" })];
      for (let k = 0; k < 9; k++) { const a = k * 2.4, y = 0.45 + (k % 4) * 0.22; parts.push(M.box({ w: 0.05, h: 0.05, d: 0.05, color: "#9a7448", offset: { x: Math.sin(a) * 0.5, y, z: Math.cos(a) * 0.5 } })); }
      parts.push(M.lathe({ profile: [[0.37, 0.2], [0.47, 0.28], [0.5, 0.42], [0.36, 0.42]], segments: 10, color: "#c8954a" }));
      for (let k = 0; k < 10; k++) { const a = k * 0.63 + 0.2; parts.push(M.box({ w: 0.07, h: 0.06, d: 0.04, color: "#3a2614", offset: { x: Math.sin(a) * 0.49, y: 0.3 + (k % 2) * 0.07, z: Math.cos(a) * 0.49 } })); }
      for (const x of [-0.17, 0.17]) {
        parts.push(M.box({ w: 0.15, h: 0.24, d: 0.15, color: "#d8b07a", offset: { x, y: 0.1, z: 0 } }));
        parts.push(M.box({ w: 0.1, h: 0.13, d: 0.04, color: "#1a1410", offset: { x, y: 0.95, z: 0.5 } }));
        parts.push(M.box({ w: 0.14, h: 0.04, d: 0.04, color: "#1a1410", offset: { x: x * 1.1, y: 1.1, z: 0.47 } }));
      }
      parts.push(M.box({ w: 0.14, h: 0.12, d: 0.04, color: "#5a1a14", offset: { x: 0, y: 0.72, z: 0.52 } }));
      return M.merge(...parts);
    })();
    const arm = M.merge(M.box({ w: 0.12, h: 0.32, d: 0.12, color: "#d8b07a", offset: { x: 0, y: -0.14, z: 0 } }), M.box({ w: 0.16, h: 0.12, d: 0.14, color: "#d8b07a", offset: { x: 0, y: -0.3, z: 0 } }));
    const held = bananaGeo();
    const dancers = [0, 1, 2].map((k) => {
      const body = createNode({ geometry: potato, scale: { x: SCALE, y: SCALE, z: SCALE } });
      const armL = createNode({ geometry: arm, position: { x: -0.5, y: 0.78, z: 0 } }), armR = createNode({ geometry: arm, position: { x: 0.5, y: 0.78, z: 0 } });
      addChild(armR, createNode({ geometry: held, position: { x: 0, y: -0.36, z: 0.05 }, rotation: { x: 0, y: 0, z: Math.PI } }));
      addChild(body, armL, armR); addChild(root, body);
      return { body, armL, armR, k };
    });
    // The totem poles: four carved faces stacked in paint, wings at the top, a beak, on a stone foot.
    for (const t of TOTEMS) {
      const parts = [M.bevelBox({ w: 1.1, h: 0.3, d: 1.1, color: "#6e6a66", bevel: 0.08, offset: { x: 0, y: 0.15, z: 0 } })];
      t.faces.forEach((ink, i) => {
        const y = 0.3 + i * 0.95;
        parts.push(M.bevelBox({ w: 0.8, h: 0.9, d: 0.8, color: i % 2 ? "#7a5534" : "#8a6440", bevel: 0.1, offset: { x: 0, y: y + 0.45, z: 0 } }));
        parts.push(M.box({ w: 0.62, h: 0.12, d: 0.06, color: ink, offset: { x: 0, y: y + 0.72, z: 0.41 } }));
        for (const sx of [-0.18, 0.18]) parts.push(M.box({ w: 0.16, h: 0.16, d: 0.06, color: "#f4efe4", offset: { x: sx, y: y + 0.55, z: 0.42 } }), M.box({ w: 0.08, h: 0.08, d: 0.04, color: "#1a1410", offset: { x: sx, y: y + 0.55, z: 0.46 } }));
        parts.push(M.box({ w: 0.36, h: 0.1, d: 0.08, color: ink, offset: { x: 0, y: y + 0.24, z: 0.42 } }), M.box({ w: 0.12, h: 0.2, d: 0.16, color: shade(ink), offset: { x: 0, y: y + 0.4, z: 0.46 } }));
      });
      const ty = 0.3 + t.faces.length * 0.95;
      for (const s of [-1, 1]) parts.push(M.moved(M.turnedZ(M.bevelBox({ w: 1.1, h: 0.18, d: 0.3, color: t.faces[0], bevel: 0.05 }), s * 0.35), s * 0.8, ty - 0.2, 0));
      parts.push(M.bevelBox({ w: 0.5, h: 0.5, d: 0.5, color: t.faces[1], bevel: 0.08, offset: { x: 0, y: ty + 0.2, z: 0 } }), M.box({ w: 0.16, h: 0.12, d: 0.34, color: "#e8c35a", offset: { x: 0, y: ty + 0.15, z: 0.38 } }));
      place(createNode({ geometry: M.merge(...parts), position: { x: t.x, y: top, z: t.z }, rotation: { x: 0, y: t.ry, z: 0 } }));
    }
    let boost = 0;
    const flare = () => { boost = 1; };
    const update = (dt, t, calm) => {
      const s = calm ? 0.4 : 1;
      boost = Math.max(0, boost - dt * 0.8);
      fireNode.scale.y = 1 + 0.18 * Math.sin(t * 13) + 0.08 * Math.sin(t * 31) + boost * 0.7;
      fireNode.scale.x = fireNode.scale.z = 1 + 0.06 * Math.sin(t * 17);
      fireNode.rotation.y = t * 1.7;
      fireNode.glow = 1.1 + 0.25 * Math.sin(t * 9) + boost * 0.8;
      for (const d of dancers) {
        const a = t * 0.7 * s + d.k * Math.PI * 2 / 3, r = RING * SCALE, x = Math.sin(a) * r, z = Math.cos(a) * r, hop = Math.abs(Math.sin(t * 5 * s + d.k * 1.3));
        d.body.position.x = x; d.body.position.y = hop * 0.35; d.body.position.z = z;
        d.body.rotation.y = Math.atan2(-x, -z) + Math.sin(t * 3 + d.k) * 0.4;
        d.body.rotation.z = Math.sin(t * 5 * s + d.k * 1.3) * 0.12;
        d.armL.rotation.z = -2.2 + Math.sin(t * 7 * s + d.k) * 0.7;
        d.armR.rotation.z = 2.2 - Math.sin(t * 7 * s + d.k + 1) * 0.7;
      }
    };
    return { root, update, flare, light: [FIRE.x, top + 1.6, FIRE.z, 9, 1.4, 0.75, 0.3] };
  };
  const shade = (hex) => { const n = parseInt(hex.slice(1), 16), c = (v) => Math.round(v * 0.7); return `#${((c(n >> 16) << 16) | (c((n >> 8) & 255) << 8) | c(n & 255)).toString(16).padStart(6, "0")}`; };
  BL.genesisCampfire = { layout, build };
})();
