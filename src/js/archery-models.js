// Bow & Bone's art: the butt, the arrow and the Legionnaire, built from the shared voxel builders so they wear
// the island's palette and every composite is one geometry — one draw call each. Nothing here touches a node or
// the renderer; the scene places what these return. Each builder works at unit size, so a butt of radius r is
// one geometry scaled by r and an arrow is one scaled by its own length: no geometry is rebuilt per shot.
(() => {
  "use strict";
  const BL = window.BL = window.BL || {};
  const { box, merge } = BL.models;

  // Read from the shooting line at a glance: cream, blue, red, straw, gold.
  const GOLD = "#E3B04B";
  const RED = "#B5462F";
  const BLUE = "#3D5A66";
  const STRAW = "#C8B48A";
  const CREAM = "#EFE7D6";
  const HIDE = "#6B4F35";
  const SHAFT = "#D9C79B";
  const IRON = "#8C8C8C";
  const RANK = "#4A4F52";
  const DARK = "#3A3F42";

  // Five plates, each narrower than the last, stacked away from the archer on a pair of legs. Unit radius: the
  // bull sits at the origin, so the scene scales this by the target's own radius.
  const butt = () => {
    const plates = [];
    const depth = 0.08;
    const ring = [CREAM, BLUE, RED, STRAW, GOLD];
    for (let i = 0; i < 5; i++) {
      const half = 1 - i * 0.18;
      plates.push(box({ w: half * 2, h: half * 2, d: depth, color: ring[i], offset: { z: -i * depth } }));
    }
    plates.push(box({ w: 0.1, h: 0.6, d: 0.1, color: HIDE, offset: { x: -0.32, y: -1.24 } }));
    plates.push(box({ w: 0.1, h: 0.6, d: 0.1, color: HIDE, offset: { x: 0.32, y: -1.24 } }));
    return merge(...plates);
  };

  // The tip sits at the origin and the shaft runs back along -x, which is how the simulation places an arrow:
  // its position is the point that meets a butt or a Legionnaire.
  const arrow = () => merge(
    box({ w: 0.72, h: 0.035, d: 0.035, color: SHAFT, offset: { x: -0.36 } }),
    box({ w: 0.14, h: 0.07, d: 0.07, color: IRON, offset: { x: -0.07 } }),
    box({ w: 0.18, h: 0.12, d: 0.02, color: RED, offset: { x: -0.86 } }),
    box({ w: 0.18, h: 0.02, d: 0.12, color: RED, offset: { x: -0.86 } })
  );

  // Unit height, origin at the feet, spear forward along -x because the Legion walks in from the treeline.
  const legionnaire = () => merge(
    box({ w: 0.3, h: 0.46, d: 0.26, color: RANK, offset: { y: 0.62 } }),
    box({ w: 0.22, h: 0.22, d: 0.22, color: HIDE, offset: { y: 0.96 } }),
    box({ w: 0.34, h: 0.06, d: 0.34, color: GOLD, offset: { y: 1.07 } }),
    box({ w: 0.1, h: 0.42, d: 0.1, color: DARK, offset: { x: -0.09, y: 0.21 } }),
    box({ w: 0.1, h: 0.42, d: 0.1, color: DARK, offset: { x: 0.09, y: 0.21 } }),
    box({ w: 0.62, h: 0.045, d: 0.045, color: SHAFT, offset: { x: -0.12, y: 0.68, z: 0.17 } })
  );

  BL.archeryModels = Object.freeze({
    butt, arrow, legionnaire,
    COLORS: Object.freeze({ GOLD, RED, BLUE, STRAW, CREAM, HIDE, SHAFT, IRON, RANK, DARK }),
  });
})();
