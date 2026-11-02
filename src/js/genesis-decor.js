// Genesis Hall's dressing (Billy's refinement: character, charm, flooring, inviting light, a stronger theme for each
// era). Each era's gallery gets a floor patterned in its period, its walls finished in its period (a wainscot, an
// accent band, glowing motifs) and warm pendant lamps; the atrium gets a stone plaza under the spiral. All original,
// procedural geometry: no images. Built once a visit, merged a mesh per era, nothing per frame.
//
// `BL.genesisDecor`: { STYLES, floorGeometry(n, rect, top), wallParts(M, n, rect, height, top), pendants(n, rect),
// plazaGeometry(radius, top) }. Rectangles are in the era's old coordinates (scene-genesis.js builds them inside the
// gallery's frame, which scales them with the rest of the gallery).
(() => {
  "use strict";
  const BL = window.BL = window.BL || {};
  const rgb = (hex) => { const n = parseInt(hex.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
  const mix = (a, b, t) => [0, 1, 2].map((k) => Math.round(a[k] + (b[k] - a[k]) * t));
  // Each era's look: its floor's tile size and colours by pattern, its wainscot and band, its glowing motif and its
  // lamps' glass. Periods: 1956-69 linoleum and wood panelling; the 1970s parquet, orange stripes and lava glow; the
  // 1980s dark tile and neon; 1990-95 speckled office carpet; 1996-99 a server room's raised floor; the 2000s glossy
  // white with blue light; 2008 a reading room's parquet and brass; January 2009 slate with the first block's orange.
  const STYLES = [
    { floor: "checker", tile: 1.6, a: "#efe9dc", b: "#232323", wain: "#7a5a3a", band: "#c9a24a", glow: "#ffd98a", motif: "punch", lamp: "#ffe2a8" },
    { floor: "parquet", tile: 1.2, a: "#a8743f", b: "#8a5a2e", rug: "#c8662a", wain: "#5a3a22", band: "#e8862a", band2: "#f2c14e", glow: "#ff9a3c", motif: "lava", lamp: "#ffb46a" },
    { floor: "grid", tile: 2.0, a: "#1a1430", b: "#221a3d", line: "#ff3ad0", wain: "#140f26", band: "#3af2ff", glow: "#ff3ad0", motif: "neon", lamp: "#ff8ae8" },
    { floor: "carpet", tile: 1.8, a: "#2f5a5a", b: "#3a6464", speck: ["#d94a8a", "#e8c35a", "#5ac8ff"], wain: "#3a3f44", band: "#2fb5a5", glow: "#7affd8", motif: "pixels", lamp: "#fff0c8" },
    { floor: "raised", tile: 1.2, a: "#5d7aa0", b: "#4c6890", vent: "#2a3a52", wain: "#1e2a3c", band: "#4aa0ff", glow: "#8ad0ff", motif: "rack", lamp: "#cfe8ff" },
    { floor: "gloss", tile: 2.4, a: "#e9edf2", b: "#dfe5ec", line: "#c9d3de", wain: "#f4f6f8", band: "#29abe2", glow: "#7ad6ff", motif: "bubble", lamp: "#e8f6ff" },
    { floor: "library", tile: 1.0, a: "#7a5530", b: "#6a4828", rug: "#6e2a2a", wain: "#3e2a18", band: "#c9a24a", glow: "#ffd98a", motif: "page", lamp: "#ffdca0" },
    { floor: "slate", tile: 2.0, a: "#2c2a28", b: "#33302d", line: "#f7931a", wain: "#1d1b19", band: "#f7931a", glow: "#ffb04a", motif: "blocks", lamp: "#ffc27a" }
  ];
  // A floor: one top face per tile (no sides, no shadow), coloured by the era's pattern, over the rectangle
  // { x0, x1, z0, z1 } at height `top`. Seams and inlays are faces of their own, a millimetre above.
  const floorGeometry = (n, r, top) => {
    const S = STYLES[n], verts = [], faces = [], t = S.tile, A = rgb(S.a), B = rgb(S.b);
    let seed = 1013 + n * 7919;
    const rand = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
    const quad = (x0, z0, x1, z1, color, y = top, emissive = 0) => {
      const i = verts.length / 3;
      verts.push(x0, y, z1, x1, y, z1, x1, y, z0, x0, y, z0);
      faces.push({ i: [i, i + 1, i + 2, i + 3], color, emissive });
    };
    const nx = Math.ceil((r.x1 - r.x0) / t), nz = Math.ceil((r.z1 - r.z0) / t);
    for (let ix = 0; ix < nx; ix++) for (let iz = 0; iz < nz; iz++) {
      const x0 = r.x0 + ix * t, z0 = r.z0 + iz * t, x1 = Math.min(r.x1, x0 + t), z1 = Math.min(r.z1, z0 + t), odd = (ix + iz) & 1;
      let c = odd ? B : A;
      if (S.floor === "parquet" || S.floor === "library") c = mix(odd ? A : B, [40, 24, 12], rand() * 0.18);
      else if (S.floor === "carpet") c = mix(A, B, rand());
      else if (S.floor === "gloss" || S.floor === "slate" || S.floor === "raised") c = mix(odd ? A : B, [255, 255, 255], (S.floor === "gloss" ? 0.06 : 0.03) * rand());
      quad(x0, z0, x1, z1, c);
      // Parquet: a herringbone hint, two planks a tile.
      if (S.floor === "parquet" || S.floor === "library") {
        const dark = mix(c, [0, 0, 0], 0.25);
        if (odd) quad(x0, (z0 + z1) / 2 - 0.02, x1, (z0 + z1) / 2 + 0.02, dark, top + 0.001);
        else quad((x0 + x1) / 2 - 0.02, z0, (x0 + x1) / 2 + 0.02, z1, dark, top + 0.001);
      }
      // Raised floor: a vent grille in every third tile.
      if (S.floor === "raised" && (ix * 7 + iz * 3) % 3 === 0) for (let k = 0; k < 4; k++) quad(x0 + 0.2, z0 + 0.22 + k * 0.2, x1 - 0.2, z0 + 0.3 + k * 0.2, rgb(S.vent), top + 0.001);
      // Carpet: confetti specks.
      if (S.floor === "carpet") for (let k = 0; k < 3; k++) { const sx = x0 + rand() * (t - 0.12), sz = z0 + rand() * (t - 0.12); quad(sx, sz, sx + 0.12, sz + 0.06, rgb(S.speck[k]), top + 0.001); }
    }
    // Grid lines (neon, gloss grout, the block's glowing seams).
    if (S.line) {
      const L = rgb(S.line), w = S.floor === "gloss" ? 0.025 : 0.05, glow = S.floor === "gloss" ? 0 : 0.9;
      for (let ix = 0; ix <= nx; ix++) { const x = Math.min(r.x1, r.x0 + ix * t); quad(x - w, r.z0, x + w, r.z1, L, top + 0.002, glow); }
      for (let iz = 0; iz <= nz; iz++) { const z = Math.min(r.z1, r.z0 + iz * t); quad(r.x0, z - w, r.x1, z + w, L, top + 0.002, glow); }
    }
    // A rug down the middle walk (1970s shag, 2008 reading-room red), with a border.
    if (S.rug) {
      const cx = (r.x0 + r.x1) / 2, cz = (r.z0 + r.z1) / 2, hw = Math.min(5, (r.x1 - r.x0) * 0.12), hl = (r.z1 - r.z0) * 0.32;
      quad(cx - hw - 0.25, cz - hl - 0.25, cx + hw + 0.25, cz + hl + 0.25, mix(rgb(S.rug), [255, 220, 160], 0.35), top + 0.003);
      quad(cx - hw, cz - hl, cx + hw, cz + hl, rgb(S.rug), top + 0.004);
    }
    return { verts, faces, lines: [], castShadow: false };
  };
  // A wall's finish along one side: a wainscot to 2.4 m with a cap, an accent band above it (a second for the 1970s'
  // stripes), and the era's motif in glowing pieces between the band and the lamps. `side` is { x0, z0, x1, z1, nx, nz }:
  // a wall's inner face from (x0, z0) to (x1, z1) and its normal into the room.
  const wallParts = (M, n, walls, top) => {
    const S = STYLES[n], parts = [], glow = [];
    let seed = 77 + n * 131;
    const rand = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
    for (const w of walls) {
      const len = Math.hypot(w.x1 - w.x0, w.z1 - w.z0), yaw = Math.atan2(w.x1 - w.x0, w.z1 - w.z0) + Math.PI / 2, cx = (w.x0 + w.x1) / 2 + w.nx * 0.08, cz = (w.z0 + w.z1) / 2 + w.nz * 0.08;
      const at = (g, along, y, out = 0) => { const ux = (w.x1 - w.x0) / len, uz = (w.z1 - w.z0) / len; return M.moved(M.turnedY(g, yaw), cx + ux * along + w.nx * out, top + y, cz + uz * along + w.nz * out); };
      parts.push(at(M.box({ w: len, h: 2.4, d: 0.12, color: S.wain }), 0, 1.2));
      parts.push(at(M.box({ w: len, h: 0.1, d: 0.22, color: S.band }), 0, 2.45, 0.05));
      if (S.band2) parts.push(at(M.box({ w: len, h: 0.22, d: 0.14, color: S.band2 }), 0, 2.75), at(M.box({ w: len, h: 0.22, d: 0.14, color: S.band }), 0, 3.05));
      // Panelling: vertical battens on the wainscot every 1.2 m.
      for (let a = -len / 2 + 0.6; a < len / 2; a += 1.2) parts.push(at(M.box({ w: 0.06, h: 2.3, d: 0.16, color: S.band }), a, 1.15, 0.02));
      // The glowing motif, every 7 m along the wall, between the band and the lamps.
      for (let a = -len / 2 + 3.5; a < len / 2 - 2; a += 7) motif(M, S, (g, dx, y) => glow.push(at(g, a + dx, y, 0.12)), rand);
    }
    return { parts, glow };
  };
  // An era's wall motif from glowing boxes, round (0, 4.6) on the wall.
  const motif = (M, S, put, rand) => {
    const G = S.glow, box = (w, h, color = G, e = 1.1) => M.box({ w, h, d: 0.06, color, emissive: e });
    switch (S.motif) {
      case "punch": for (let r = 0; r < 4; r++) for (let c = 0; c < 9; c++) if (rand() < 0.45) put(box(0.12, 0.2), -0.6 + c * 0.15, 4.2 + r * 0.28); put(box(1.6, 0.05, S.band, 0.8), 0, 4.0); break;
      case "lava": for (const [dx, h] of [[-0.6, 1.2], [0, 1.6], [0.6, 1.0]]) { put(box(0.28, h, S.glow), dx, 3.9 + h / 2); put(box(0.4, 0.14, "#3a2a1a", 0), dx, 3.85); } break;
      case "neon": put(box(2.2, 0.06), 0, 4.0); put(box(0.06, 1.4), -1.1, 4.7); put(box(0.06, 1.4), 1.1, 4.7); put(box(2.2, 0.06), 0, 5.4); put(box(1.4, 0.06, S.band), 0, 4.7); break;
      case "pixels": for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++) if ((r * 5 + c) % 3 !== 1) put(box(0.22, 0.22, ["#7affd8", "#d94a8a", "#e8c35a"][(r + c) % 3]), -0.5 + c * 0.25, 4.0 + r * 0.25); break;
      case "rack": for (let r = 0; r < 6; r++) { put(box(1.2, 0.18, "#26344a", 0), 0, 3.9 + r * 0.26); put(box(0.08, 0.06, rand() < 0.6 ? S.glow : "#7aff8a"), 0.45, 3.9 + r * 0.26); } break;
      case "bubble": for (const [dx, dy, s] of [[-0.5, 4.3, 0.5], [0.3, 4.8, 0.7], [0.7, 4.1, 0.35]]) put(box(s, s, S.glow, 0.9), dx, dy); break;
      case "page": put(box(1.0, 1.3, "#f4efe2", 0.5), 0, 4.6); for (let k = 0; k < 6; k++) put(box(0.7, 0.04, "#5d564c", 0), 0, 4.95 - k * 0.14); break;
      default: for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) put(box(0.3, 0.3, c === 3 && r === 2 ? "#ffffff" : S.glow, c === 3 && r === 2 ? 1.4 : 0.9), -0.5 + c * 0.36, 4.0 + r * 0.36);
    }
  };
  // Pendant lamps over the gallery: a cord, a shade and a glowing bulb, in two rows along its length. Returns
  // { cords, shades, bulbs, lights: [[x, z]] } in the era's old coordinates; `lights` are where point lights go.
  // Where a gallery's pendants hang (pure, shared with the scene's point lights): two rows along its length.
  const pendantSpots = (r) => {
    const xs = [r.x0 + (r.x1 - r.x0) * 0.28, r.x0 + (r.x1 - r.x0) * 0.72], rows = Math.max(2, Math.round((r.z1 - r.z0) / 14)), out = [];
    for (let k = 0; k < rows; k++) for (const x of xs) out.push([x, r.z0 + (r.z1 - r.z0) * (k + 0.5) / rows]);
    return out;
  };
  const PENDANT_Y = 0.62;
  const pendants = (M, n, r, top, height) => {
    const S = STYLES[n], cords = [], bulbs = [], lights = [];
    for (const [x, z] of pendantSpots(r)) {
      {
        const y = top + height * PENDANT_Y;
        cords.push(M.moved(M.box({ w: 0.05, h: height - (y - top), d: 0.05, color: "#2a2622" }), x, (y + top + height) / 2, z));
        cords.push(M.moved(M.lathe({ profile: [[0.05, 0.55], [0.75, 0], [0.82, -0.04]], segments: 10, color: S.wain }), x, y + 0.3, z));
        bulbs.push(M.moved(M.box({ w: 0.42, h: 0.3, d: 0.42, color: S.lamp, emissive: 1.6 }), x, y + 0.12, z));
        lights.push([x, z]);
      }
    }
    return { cords, bulbs, lights };
  };
  // The atrium's plaza under the spiral: concentric rings of flagstones in warm stone, a gold inlay ring, radial joints.
  const plazaGeometry = (radius, top) => {
    const verts = [], faces = [], rings = Math.round(radius / 1.6);
    const ring = (r0, r1, a0, a1, color, y) => {
      const i = verts.length / 3;
      verts.push(r0 * Math.sin(a0), y, -r0 * Math.cos(a0), r1 * Math.sin(a0), y, -r1 * Math.cos(a0), r1 * Math.sin(a1), y, -r1 * Math.cos(a1), r0 * Math.sin(a1), y, -r0 * Math.cos(a1));
      faces.push({ i: [i + 3, i + 2, i + 1, i], color, emissive: 0 });
    };
    const stones = [[184, 168, 138], [168, 152, 124], [196, 180, 150], [176, 160, 132]];
    for (let k = 0; k < rings; k++) {
      const r0 = k * radius / rings, r1 = (k + 1) * radius / rings, segs = Math.max(6, Math.round(2 * Math.PI * r1 / 1.8)), off = (k & 1) * Math.PI / segs;
      for (let s = 0; s < segs; s++) ring(r0, r1 - 0.06, off + s * 2 * Math.PI / segs + 0.02, off + (s + 1) * 2 * Math.PI / segs - 0.02, stones[(k * 3 + s) % 4], top + 0.006);
    }
    for (let s = 0; s < 64; s++) ring(radius * 0.62, radius * 0.62 + 0.16, s * Math.PI / 32, (s + 1) * Math.PI / 32, [232, 195, 90], top + 0.008);
    ring(0, radius + 0.4, 0, Math.PI * 2, [70, 64, 56], top + 0.003);
    return { verts, faces, lines: [], castShadow: false };
  };
  BL.genesisDecor = { STYLES, floorGeometry, wallParts, pendants, pendantSpots, PENDANT_Y, plazaGeometry, rgb };
})();
