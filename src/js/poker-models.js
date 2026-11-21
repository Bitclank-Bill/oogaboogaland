// Ten tables in two banks, with a central promenade and circulation outside every seat.
(() => {
  "use strict";
  const BL = window.BL, M = BL.models, S = BL.scene;
  const REAR_WALL_Z = 36.5;
  const PORTAL_Z = REAR_WALL_Z - BL.bifrostModels.MIRROR_Z - 0.05;
  const EXIT_Z = PORTAL_Z + BL.bifrostModels.MIRROR_Z;
  const TABLES = Array.from({ length: 10 }, (_, i) => ({ x: i % 2 ? 11 : -11, z: 24 - Math.floor(i / 2) * 12 }));
  // Every figure in the room is drawn at the game's scale 1: an Ooga of the roster's middle height (1.04) stands 1.625 m,
  // its hip (the leg's pivot, the root) 0.455 m up, its one rigid leg swinging forward whole to sit. The tables and
  // chairs are built for that body: the felt at FELT_Y and the padded rail's top at RAIL_TOP, the chair's seat at
  // SEAT_TOP. A seated figure's root stands at `sitY(height)`: SIT_HIP of its height over the seat, where its legs at
  // the sitting pose's -1.35 just clear the cushion back to the seat's front edge, so they overhang it like lower legs.
  const FELT_Y = 0.78, RAIL_TOP = 0.915, SEAT_TOP = 0.47, SIT_HIP = 0.155, DEALER_SCALE = 0.7;
  const sitY = height => SEAT_TOP + SIT_HIP * height;
  // The chairs on a 5.2 by 3.6 m ring, each chair's front edge about 0.16 m from the rail, so a seated Ooga is at the
  // table; the cards, chips and dealer button are laid from `PLACES`, the same angles on the 6 by 4.2 m ring the chairs
  // stood on when the room was built for a larger body, so the felt's layout keeps its spacing.
  const ringAt = (i, rx, rz) => { const a = -Math.PI / 2 + 0.55 + i * (Math.PI * 2 - 1.1) / 8; return [Math.cos(a) * rx, Math.sin(a) * rz]; };
  const SEATS = Array.from({ length: 9 }, (_, i) => {
    const [x, z] = ringAt(i, 5.2, 3.6);
    return { x, z, yaw: Math.atan2(-x, -z) };
  });
  const PLACES = Object.freeze(Array.from({ length: 9 }, (_, i) => { const [x, z] = ringAt(i, 6, 4.2); return Object.freeze({ x, z }); }));
  const box = (w, h, d, color, x = 0, y = 0, z = 0) => M.bevelBox({ w, h, d, color, offset: { x, y, z } });
  const disk = (radius, bottom, top, color, segments = 48) => M.lathe({ segments, profile: [[0, bottom], [radius, bottom], [radius, top], [0, top]], color });
  const node = (geo, x = 0, y = 0, z = 0) => S.createNode({ geometry: geo, position: { x, y, z } });
  // Banana Club is a white marble hall built from the marble kit, in the colours of its one preset (poker-themes.js).
  const K = BL.pokerMarble, GOLD = K.GOLD, T = BL.pokerThemes.club;
  // Banana Club's fittings, each drawn inside its FURNITURE box: one-offs bake into the shell, and pieces repeated
  // about the room are one geometry each, placed as nodes in `build`. Small plain boxes keep the Canvas 2D sort's
  // faces small; the bottles' glow carries the dim room. Canvas 2D sorts and paints every face on the CPU, so there
  // `lite` (set by the scene from the renderer, before it builds) draws the same fittings with fewer faces.
  let lite = false;
  // Dark walnut stays for the back bar and the sofa frames, oxblood leather for the sofas and the table rails, a nero
  // marble for the bar top; the high-roller inlay is the floor's orange.
  const WOOD = "#3b2519", OXBLOOD = "#5c1a22", ROPE = "#7a1622", BOTTLES = ["#d9892c", "#4f9a4a", "#dfe8de"], NERO = "#2e2a26";
  const flat = (w, h, d, color, x = 0, y = 0, z = 0, emissive = 0) => M.box({ w, h, d, color, emissive, offset: { x, y, z } });
  // A veined marble block at (x, y, z): a moved copy of the kit's cached slab, so a seed is built once however often it is placed.
  const marble = (w, h, d, seed, veins, x, y, z, color = K.WHITE) => M.moved(M.merge(K.slab({ w, h, d, seed, veins, color })), x, y, z);
  // A cord slung along z between two posts, with overlapping links so bends stay closed.
  const cord = (x, za, zb, y, sag, r, color) => {
    const links = [];
    for (let k = 0, n = lite ? 4 : 10; k < n; k++) {
      const z0 = za + (zb - za) * k / n, z1 = za + (zb - za) * (k + 1) / n, y0 = y - Math.sin(k / n * Math.PI) * sag, y1 = y - Math.sin((k + 1) / n * Math.PI) * sag;
      const dy = y1 - y0, dz = z1 - z0, overlap = r / (2 * Math.hypot(dy, dz));
      const ey = dy * overlap, ez = dz * overlap;
      links.push(M.beam(x, y0 - ey, z0 - ez, x, y1 + ey, z1 + ez, r * 2, color));
    }
    return links;
  };
  const clubFurniture = () => {
    // The floor and its gold lines are `poker-floor.js`'s.
    const parts = [], block = lite ? flat : box, rand = BL.math.mulberry32(907);
    for (const f of FURNITURE) {
      if (f.kind === "bar") {
        // Against the wall, six bays of bottle shelves; a bartender's walk; then the counter, with its stools in front.
        const back = f.z - f.hz, front = f.z + f.hz;
        for (let k = 0; k <= 6; k++) parts.push(flat(0.08, 3.05, 0.35, WOOD, f.x - 7.5 + k * 2.5, 2.725, back + 0.175));
        for (let k = 0; k < 6; k++) {
          const x = f.x - 6.25 + k * 2.5;
          parts.push(flat(2.5, 4.3, 0.04, WOOD, x, 2.15, back + 0.02), block(2.5, 1.2, 0.35, WOOD, x, 0.6, back + 0.175), block(2.5, 0.12, 0.4, WOOD, x, 4.31, back + 0.2));
          for (const y of [1.95, 2.7, 3.45]) parts.push(flat(2.5, 0.05, 0.33, WOOD, x, y - 0.025, back + 0.185));
          for (const y of [1.2, 1.95, 2.7, 3.45, 4.25]) parts.push(flat(2.5, 0.035, 0.02, GOLD, x, y - 0.02, back + 0.36));
          for (const y of [1.2, 1.95, 2.7, 3.45]) for (let b = 0; b < 5; b++) {
            const h = 0.26 + rand() * 0.14, bx = x - 1 + b * 0.5 + (rand() - 0.5) * 0.12, tint = BOTTLES[Math.floor(rand() * 3)];
            if (lite) { if (!(b & 1)) parts.push(flat(0.12, h + 0.1, 0.12, tint, bx, y + (h + 0.1) / 2, back + 0.18, 0.6)); continue; }
            parts.push(flat(0.12, h, 0.12, tint, bx, y + h / 2, back + 0.18, 0.6), flat(0.045, 0.1, 0.045, tint, bx, y + h + 0.05, back + 0.18, 0.6));
          }
          // The counter at an Ooga's waist (0.95), its marble body set back under the top's overhang so a guest's legs
          // from a stool reach under it, the brass foot rail along the body's foot.
          parts.push(marble(2.5, 0.87, 0.35, 60 + k, 4, x, 0.435, front - 0.9), block(2.5, 0.08, 0.7, NERO, x, 0.91, front - 0.72),
            flat(2.5, 0.05, 0.03, GOLD, x, 0.91, front - 0.355), flat(2.5, 0.045, 0.045, GOLD, x, 0.2, front - 0.69));
          // The backboard's back, seen through the glass: a raised walnut frame a bay with a middle rail.
          for (const y of [0.1, 2.15, 4.2]) parts.push(flat(2.5, 0.12, 0.03, WOOD, x, y, back - 0.015));
          for (const dx of [-1.2, 1.2]) parts.push(flat(0.1, 4.3, 0.03, WOOD, x + dx, 2.15, back - 0.015));
        }
        // Each wing's ends close with a walnut side panel, and a gold edge runs along the crown's back.
        for (const ex of [f.x - 7.53, f.x + 7.53]) parts.push(flat(0.06, 4.37, 0.43, WOOD, ex, 2.185, back + 0.2));
        parts.push(flat(15.06, 0.04, 0.03, GOLD, f.x, 4.35, back - 0.015));
      } else if (f.kind === "cage") {
        // The cashier's booth: a marble counter facing the room under a brass grille with a teller's gap, marble sides and
        // a cream canopy. The valance stays oxblood, so the lit CASHIER sign in front of it reads against dark.
        const x0 = f.x - f.hx, x1 = f.x + f.hx, z0 = f.z - f.hz, z1 = f.z + f.hz;
        for (const z of [f.z - 1.2, f.z + 1.2]) parts.push(marble(0.5, 0.91, 2.4, z < f.z ? 70 : 71, 4, x0 + 0.3, 0.455, z), flat(0.56, 0.04, 2.4, K.BRASS, x0 + 0.3, 0.93, z),
          flat(0.05, 0.05, 2.4, K.BRASS, x0 + 0.3, 2.6, z), block(0.1, 3.4, 2.4, K.WHITE, x1 - 0.05, 1.7, z));
        for (let n = 1; n < 25; n += lite ? 2 : 1) { const z = z0 + n * 0.2; if (Math.abs(z - f.z) > 0.45) parts.push(flat(0.03, 1.65, 0.03, K.BRASS, x0 + 0.3, 1.775, z)); }
        for (const z of [z0 + 0.05, z1 - 0.05]) parts.push(block(1.9, 2.6, 0.1, K.WHITE, f.x, 1.3, z));
        // The back's face to the glass: a gold coping along its top and a darker marble foot.
        parts.push(flat(0.16, 0.05, 4.84, GOLD, x1 - 0.05, 3.425, f.z), flat(0.12, 0.12, 4.82, K.SHADE, x1 - 0.03, 0.06, f.z));
        for (const z of [f.z - 1.25, f.z + 1.25]) parts.push(block(1.9, 0.15, 2.5, K.CREAM, f.x + 0.05, 2.675, z), block(0.06, 0.8, 2.5, OXBLOOD, x0 + 0.13, 3, z),
          flat(0.04, 0.04, 2.5, K.BRASS, x0 + 0.09, 3.38, z), flat(0.04, 0.04, 2.5, K.BRASS, x0 + 0.09, 2.62, z));
      } else if (f.kind === "highRoller") {
        // The high-roller table's own inlay of Bitcoin-orange marble in 2 m squares, edged in gold (no red on the floor).
        for (let x = f.x - f.hx + 1; x < f.x + f.hx; x += 2) for (let z = f.z - f.hz + 1; z < f.z + f.hz; z += 2) parts.push(flat(2, 0.012, 2, BL.pokerFloor.ORANGE, x, 0.001, z));
        for (let x = f.x - f.hx + 1; x < f.x + f.hx; x += 2) for (const z of [f.z - f.hz + 0.08, f.z + f.hz - 0.08]) parts.push(flat(2, 0.012, 0.1, GOLD, x, 0.008, z));
        for (let z = f.z - f.hz + 1; z < f.z + f.hz; z += 2) for (const x of [f.x - f.hx + 0.08, f.x + f.hx - 0.08]) parts.push(flat(0.1, 0.012, 2, GOLD, x, 0.008, z));
      }
    }
    // Deep red ropes between the outer pairs of posts leave the middle gap open.
    const posts = FURNITURE.filter(f => f.kind === "ropePost");
    for (let i = 0; i < posts.length; i += 2) parts.push(...cord(posts[i].x, posts[i].z, posts[i + 1].z, 0.77, 0.2, 0.025, ROPE));
    return M.merge(...parts);
  };
  // The repeated pieces, each built about its own origin to stand at its box's centre; the sofa's back is at +x.
  // The bar stool's felt top at 0.62, a little under an Ooga's hip, below the 0.95 counter.
  const stool = () => M.merge(M.lathe({ segments: lite ? 4 : 12, profile: [[0, 0], [0.19, 0], [0.19, 0.03], [0.05, 0.06], [0.035, 0.08], [0.035, 0.5], [0.14, 0.52], [0, 0.52]], color: GOLD }),
    M.lathe({ segments: lite ? 4 : 12, profile: [[0, 0.52], [0.2, 0.52], [0.2, 0.59], [0.17, 0.62], [0, 0.62]], color: T.felt }));
  // Oxblood leather on a walnut frame. The lounges' seats are built round where a resident's hip sits (sofa x 0.12,
  // armchair x 0): the cushion at 0.40 runs 0.27 m in front of the hip and the back cushion's face stands where the
  // Ooga's back is, so a resident sits on the cushion against the back with the legs over the front edge.
  const sofa = () => M.merge(box(0.72, 0.24, 3.9, WOOD, 0.19, 0.2), box(0.16, 0.6, 3.9, OXBLOOD, 0.48, 0.55),
    ...[-1, 1].flatMap(sz => [-1, 1].map(sx => flat(0.08, 0.08, 0.08, GOLD, 0.19 + sx * 0.32, 0.04, sz * 1.85))),
    ...[-1.17, 0, 1.17].flatMap(z => [box(0.46, 0.08, 1.14, OXBLOOD, 0.08, 0.36, z), box(0.12, 0.4, 1.14, OXBLOOD, 0.36, 0.6, z)]),
    ...[-1, 1].flatMap(s => [box(0.74, 0.26, 0.2, OXBLOOD, 0.19, 0.45, s * 1.87), flat(0.74, 0.03, 0.2, GOLD, 0.19, 0.595, s * 1.87)]));
  // A lounge armchair to sit the sofa's company, in the same oxblood leather on walnut with gold feet and arm caps,
  // built like the sofa about its own origin with its back at +x: seat 0.40, arms 0.56, back 0.85.
  const armchair = () => M.merge(box(0.62, 0.22, 0.86, WOOD, 0.04, 0.19), box(0.45, 0.1, 0.63, OXBLOOD, -0.045, 0.35, 0),
    box(0.18, 0.6, 0.86, OXBLOOD, 0.26, 0.55, 0),
    ...[-1, 1].flatMap(s => [box(0.62, 0.22, 0.11, OXBLOOD, 0.04, 0.42, s * 0.375), flat(0.62, 0.03, 0.11, GOLD, 0.04, 0.545, s * 0.375)]),
    ...[-1, 1].flatMap(sz => [-1, 1].map(sx => flat(0.07, 0.09, 0.07, GOLD, 0.04 + sx * 0.27, 0.045, sz * 0.375))));
  // The low table's marble top at 0.38, its lamps in proportion.
  const lowTable = () => M.merge(marble(0.95, 0.06, 1.75, 80, 2, 0, 0.35, 0), flat(0.97, 0.025, 1.77, GOLD, 0, 0.315),
    ...[-1, 1].flatMap(sz => [-1, 1].map(sx => flat(0.05, 0.3, 0.05, GOLD, sx * 0.4, 0.15, sz * 0.8))), flat(0.08, 0.1, 0.08, "#ffd28a", 0, 0.43, 0, 0.8),
    // A table lamp at each end: a gold foot and stem under a glowing silk shade, so the lounge reads warm against the night.
    ...[-1, 1].flatMap(sz => [flat(0.16, 0.04, 0.16, GOLD, 0, 0.4, sz * 0.6), flat(0.035, 0.36, 0.035, GOLD, 0, 0.6, sz * 0.6),
      flat(0.3, 0.22, 0.3, "#ffd9a0", 0, 0.89, sz * 0.6, 0.95), flat(0.32, 0.02, 0.32, GOLD, 0, 1.01, sz * 0.6)]));
  const ropePost = () => M.lathe({ segments: lite ? 4 : 12, profile: [[0, 0], [0.17, 0], [0.17, 0.035], [0.06, 0.075], [0.035, 0.1], [0.035, 0.79], [0.06, 0.81], [0.075, 0.855], [0.05, 0.895], [0, 0.9]], color: K.BRASS });
  // The dressing kit's palm is a 4 m tree; a potted one grows hub leaf cards from a lathe pot, its crown pulled in to the box.
  const palm = () => {
    const H = BL.hubModels, rand = BL.math.mulberry32(41);
    const pot = M.merge(M.lathe({ segments: lite ? 6 : 12, profile: [[0, 0], [0.2, 0], [0.27, 0.5], [0.3, 0.55], [0.26, 0.55], [0, 0.52]], color: "#2b211b" }),
      M.lathe({ segments: lite ? 6 : 12, profile: [[0.27, 0.47], [0.305, 0.5], [0.305, 0.56], [0.27, 0.56]], color: GOLD }));
    const geo = H.withJungle(pot, g => {
      H.liana(g, [[0, 0.5, 0], [0.02, 1, 0.01], [0, 1.45, 0]], 0.045, 0.03, "#6b4a2b");
      for (const [y, count, size] of lite ? [[0.85, 4, 0.55], [1.35, 4, 0.6]] : [[0.75, 5, 0.5], [1.1, 5, 0.55], [1.45, 6, 0.6]]) H.sprig(g, 0, y, 0, 0, 1, 0, count, size, rand);
    });
    let reach = 0;
    for (let i = 0; i < geo.verts.length; i += 3) if (geo.verts[i + 1] > 0.6) reach = Math.max(reach, Math.hypot(geo.verts[i], geo.verts[i + 2]));
    const k = Math.min(1, 0.33 / reach);
    for (let i = 0; i < geo.verts.length; i += 3) if (geo.verts[i + 1] > 0.6) { geo.verts[i] *= k; geo.verts[i + 2] *= k; }
    return geo;
  };
  // A tiered brass frame for each of the three chandeliers: three rings joined by four slanted arms each to the one
  // above, the top ring's arms meeting a central stem at y 7.6, the stem from the bottom ring's cross up to the vault.
  const CRYSTAL_RINGS = [[2.1, 6.55, 24, 0.17], [1.45, 5.85, 16, 0.15], [0.8, 5.15, 10, 0.13]];
  const chandelierFrame = () => {
    const ring = (r, y, h) => M.lathe({ segments: lite ? 16 : 48, profile: [[r + 0.08, y], [r + 0.08, y + h], [r - 0.08, y + h], [r - 0.08, y], [r + 0.08, y]], color: T.accent });
    const parts = CRYSTAL_RINGS.map(([r, y, , h]) => ring(r, y, h));
    // The stem rises to a turned knop, and from it a gold chain (a plain rod on the lite set) to a rose under the vault's ridge.
    const top = BL.pokerVault.hang(0);
    parts.push(flat(1.76, 0.04, 0.04, T.accent, 0, 5.13), flat(0.04, 0.04, 1.76, T.accent, 0, 5.13));
    if (lite) parts.push(M.beam(0, 5.11, 0, 0, top - 0.1, 0, 0.07, T.accent), disk(0.3, top - 0.1, top, T.accent, 12));
    else parts.push(M.beam(0, 5.11, 0, 0, 9.2, 0, 0.07, T.accent), M.lathe({ segments: 12, color: T.accent, profile: [[0, 9.05], [0.09, 9.08], [0.13, 9.2], [0.09, 9.32], [0, 9.35]] }),
      ...M.chain(0, 9.35, 0, 0, top - 0.12, 0, 0.09, T.accent), disk(0.32, top - 0.12, top, T.accent, 24));
    for (let k = 0; k < 4; k++) {
      const a = Math.PI / 4 + k * Math.PI / 2, c = Math.cos(a), s = Math.sin(a), [r0, y0, , h0] = CRYSTAL_RINGS[0];
      for (let t = 1; t < 3; t++) { const [r, y, , h] = CRYSTAL_RINGS[t], [ru, yu] = CRYSTAL_RINGS[t - 1]; parts.push(M.beam(c * r, y + h, s * r, c * ru, yu, s * ru, 0.05, T.accent)); }
      parts.push(M.beam(c * r0, y0 + h0, s * r0, c * 0.035, 7.6, s * 0.035, 0.05, T.accent));
    }
    return M.merge(...parts);
  };
  // Six-sided double-pointed gems, 0.26 m wide and 0.6 m long, white and pale blue in turn. Each ring's mesh is a double
  // curtain: a row under the ring, and a row half a step round, 0.45 m lower and 0.12 m in, each gem on a fine strand
  // from the ring. The drop is six 0.4 m gems tip to tip down the stem and a 0.9 m pendant ending at y 3.3. Four meshes,
  // shared by the three chandeliers, lit from within so the dim room and the lowest tier's missing bloom still see them.
  // Lite: one row of half as many four-sided gems a ring, no strands, and the pendant alone for the drop.
  const TINTS = ["#ffffff", "#d6eaff"];
  const crystals = () => {
    const gem = (x, top, z, width, length, color) => {
      const g = M.lathe({ segments: lite ? 4 : 6, profile: [[0, top], [width / 2, top - length * 0.3], [0, top - length]], color, emissive: 1 });
      for (let i = 0; i < g.verts.length; i += 3) { g.verts[i] += x; g.verts[i + 2] += z; } return g; };
    const meshes = CRYSTAL_RINGS.map(([r, y, count]) => {
      const parts = [];
      if (lite) for (let k = 0, n = Math.ceil(count / 2); k < n; k++) { const a = k * Math.PI * 2 / n; parts.push(gem(Math.cos(a) * r, y, Math.sin(a) * r, 0.26, 0.6, TINTS[k & 1])); }
      else for (let k = 0; k < count; k++) {
        const a = k * Math.PI * 2 / count, b = (k + 0.5) * Math.PI * 2 / count, ri = r - 0.12;
        parts.push(gem(Math.cos(a) * r, y, Math.sin(a) * r, 0.26, 0.6, TINTS[k & 1]), gem(Math.cos(b) * ri, y - 0.45, Math.sin(b) * ri, 0.26, 0.6, TINTS[(k + 1) & 1]),
          M.beam(Math.cos(b) * (r - 0.07), y, Math.sin(b) * (r - 0.07), Math.cos(b) * ri, y - 0.45, Math.sin(b) * ri, 0.02, TINTS[1], 0.6));
      }
      return M.merge(...parts);
    });
    meshes.push(lite ? gem(0, 4.2, 0, 0.45, 0.9, TINTS[0]) : M.merge(...Array.from({ length: 6 }, (_, k) => gem(0, 4.2 + (6 - k) * 0.4, 0, 0.26 * 0.4 / 0.6, 0.4, TINTS[k & 1])), gem(0, 4.2, 0, 0.45, 0.9, TINTS[0])));
    for (const g of meshes) g.castShadow = false;
    return meshes;
  };
  // Banana Club's ornate table. Each part is built in the unit space its table node scales (top 4.75 by 3.15, rim 4.5 by 2.92, pinstripe 4.02 by 2.44; the base unscaled).
  // A turned marble pedestal with gold bands, pulled into an oval under the top; it meets the top at y 0.52. The table
  // stands at an Ooga's height (felt FELT_Y), so the pedestal is drawn shorter in proportion: a lower plinth and a
  // tighter waist, the same bands.
  const pedestal = () => {
    const segments = lite ? 12 : 24, g = M.shaded([
      M.lathe({ segments, color: K.SHADE, profile: [[0, 0], [1.5, 0], [1.5, 0.07], [1.38, 0.1]] }),
      M.lathe({ segments, color: GOLD, profile: [[1.38, 0.1], [1.41, 0.12], [1.38, 0.14], [1.2, 0.155]] }),
      M.lathe({ segments, color: K.WHITE, profile: [[1.2, 0.155], [0.92, 0.23], [0.76, 0.32], [0.88, 0.41], [1.08, 0.465]] }),
      M.lathe({ segments, color: GOLD, profile: [[1.08, 0.465], [1.14, 0.482], [1.12, 0.498]] }),
      M.lathe({ segments, color: K.WHITE, profile: [[1.12, 0.498], [1.22, 0.505], [1.22, 0.52], [0, 0.52]] })
    ]);
    for (let i = 0; i < g.verts.length; i += 3) { g.verts[i] *= 1.7; g.verts[i + 2] *= 1.15; }
    return g;
  };
  // A padded oxblood rail round the felt: a tube along an oval of 4.66 by 3.06 m, 0.22 m across and 0.17 m high, out on
  // the top's edge (4.75 by 3.15, reaching 4.77 by 3.17) and clear of the felt (4.38 by 2.8), so the button, cards and chips lie inside it.
  // Built at room size, then divided by the rim node's scale (4.5 by 2.92).
  const rail = () => {
    const A = 4.66, B = 3.06, SX = 4.5, SZ = 2.92, segments = lite ? 28 : 56, sides = lite ? 5 : 8, across = 0.11, high = 0.085, y = RAIL_TOP - high;
    const geo = M.merge(), rgb = BL.math.hexToRgb(OXBLOOD), rows = [];
    for (let k = 0; k < segments; k++) {
      const t = k / segments * Math.PI * 2, c = Math.cos(t), s = Math.sin(t), l = Math.hypot(c / A, s / B), nx = c / A / l, nz = s / B / l, row = [];
      for (let j = 0; j < sides; j++) {
        const p = j / sides * Math.PI * 2, out = Math.cos(p) * across;
        row.push(M.pushVert(geo, (A * c + nx * out) / SX, y + Math.sin(p) * high, (B * s + nz * out) / SZ));
      }
      rows.push(row);
    }
    const v = geo.verts, at = (i, k) => v[i * 3 + k];
    for (let k = 0; k < segments; k++) for (let j = 0; j < sides; j++) {
      const a = rows[k][j], b = rows[(k + 1) % segments][j], c = rows[(k + 1) % segments][(j + 1) % sides], d = rows[k][(j + 1) % sides];
      // Wind each quad outward: its normal must point away from the tube's middle at that station.
      const ux = at(b, 0) - at(a, 0), uy = at(b, 1) - at(a, 1), uz = at(b, 2) - at(a, 2), wx = at(d, 0) - at(a, 0), wy = at(d, 1) - at(a, 1), wz = at(d, 2) - at(a, 2);
      const t = k / segments * Math.PI * 2, ox = at(a, 0) - A * Math.cos(t) / SX, oy = at(a, 1) - y, oz = at(a, 2) - B * Math.sin(t) / SZ;
      const dot = (uy * wz - uz * wy) * ox + (uz * wx - ux * wz) * oy + (ux * wy - uy * wx) * oz;
      M.face(geo, dot < 0 ? [a, d, c, b] : [a, b, c, d], rgb);
    }
    geo.smooth = true;
    return geo;
  };
  // A gold inlay ring laid on the felt, a broad band and a fine one inside it.
  const inlay = () => {
    const segments = lite ? 32 : 64;
    const y = FELT_Y + 0.004;
    return M.merge(M.lathe({ segments, profile: [[1, y], [0.985, y]], color: GOLD, emissive: 0.2 }),
      M.lathe({ segments, profile: [[0.958, y], [0.952, y]], color: GOLD, emissive: 0.2 }));
  };
  // The stone top under the felt, its underside bevelled up toward the edge (0.52 in the middle, 0.64 at the rim) so a
  // seated Ooga's feet, reaching just under the rail, pass below it.
  const stoneTop = () => M.lathe({ segments: 48, profile: [[0, 0.52], [0.92, 0.52], [1, 0.64], [1, FELT_Y - 0.06], [0, FELT_Y - 0.06]], color: T.stone[5] });
  // A walnut chair for an Ooga, built about the seated figure's root (its hip, the chair's spot), its back at -z: turned
  // legs, a seat of 0.75 by 0.56 with its oxblood cushion's top at SEAT_TOP and front edge 0.27 m before the hip (a
  // shallow seat, so a seated Ooga's rigid legs overhang it like lower legs), the back pad's face 0.18 m behind the hip
  // where the Ooga's back rests, a stepped carved crest to 1.06 (about a seated Ooga's shoulder) and gold finials.
  const ornateChair = () => {
    const block = lite ? flat : box, segments = lite ? 4 : 6, top = SEAT_TOP;
    const leg = (x, z) => M.moved(M.lathe({ segments, profile: [[0.04, 0], [0.03, 0.18], [0.045, top - 0.11]], color: T.wood }), x, 0, z);
    const finial = x => M.moved(M.lathe({ segments, profile: [[0, 0], [0.045, 0.02], [0.05, 0.055], [0.022, 0.095], [0, 0.12]], color: GOLD, emissive: 0.15 }), x, 0.97, -0.25);
    return M.merge(block(0.75, 0.07, 0.56, T.wood, 0, top - 0.075, -0.01), block(0.68, 0.04, 0.52, OXBLOOD, 0, top - 0.02, 0.01),
      leg(-0.3, 0.22), leg(0.3, 0.22), leg(-0.3, -0.24), leg(0.3, -0.24),
      block(0.07, 0.58, 0.08, T.wood, -0.34, 0.65, -0.25), block(0.07, 0.58, 0.08, T.wood, 0.34, 0.65, -0.25),
      block(0.56, 0.42, 0.06, OXBLOOD, 0, 0.72, -0.21), flat(0.6, 0.04, 0.07, T.wood, 0, 0.5, -0.25),
      block(0.76, 0.06, 0.1, T.wood, 0, 0.94, -0.25), flat(0.44, 0.05, 0.09, T.wood, 0, 0.995, -0.25), flat(0.2, 0.04, 0.08, T.wood, 0, 1.04, -0.25),
      flat(0.4, 0.02, 0.02, GOLD, 0, 0.995, -0.198), finial(-0.34), finial(0.34));
  };
  const cache = BL.models.scopedMap(), scoped = M.track(() => cache.clear());
  const geometry = () => {
    scoped.use();
    const key = lite ? "gatsby-lite" : "gatsby";
    if (cache.has(key)) return cache.get(key);
    const shell = [clubFurniture()], lamps = BL.dressing.set();
    // The marble floor tiles, wall panels and columns are a few cached geometries placed as nodes in `build`; the walls
    // are `poker-glazing.js`'s glass and the roof `poker-vault.js`'s glass vault, both stood in `build`.
    // Each table lamp's cable hangs from the vault's purlin over its row on a slim gold rod at either end.
    const V = BL.pokerVault;
    for (const p of TABLES) for (const dz of [-1.8, 1.8]) {
      const top = V.lampHang(p.x);
      shell.push(M.beam(p.x, 8.76, p.z + dz, p.x, top + 0.02, p.z + dz, 0.035, T.accent), flat(0.1, 0.05, 0.1, T.accent, p.x, top - 0.02, p.z + dz));
    }
    // A deep green marble field, framed in gold, behind the bar end's lettering, so gold letters never sit on white stone.
    // With the walls glass it floats where it was: a gold edge round its depth, a green back with a gold frame (it is
    // seen from behind through the glass), and two fine gold rods up to the cornice.
    shell.push(box(13, 3.2, 0.06, "#1d4234", 0, 6.4, -36.45), box(13.2, 0.08, 0.06, T.accent, 0, 8.04, -36.4), box(13.2, 0.08, 0.06, T.accent, 0, 4.76, -36.4),
      box(0.08, 3.36, 0.06, T.accent, -6.6, 6.4, -36.4), box(0.08, 3.36, 0.06, T.accent, 6.6, 6.4, -36.4));
    shell.push(flat(13.32, 3.36, 0.04, "#173a2c", 0, 6.4, -36.5),
      flat(13.44, 0.06, 0.2, T.accent, 0, 8.11, -36.46), flat(13.44, 0.06, 0.2, T.accent, 0, 4.69, -36.46),
      flat(0.06, 3.48, 0.2, T.accent, -6.69, 6.4, -36.46), flat(0.06, 3.48, 0.2, T.accent, 6.69, 6.4, -36.46));
    for (const [w, h] of [[12.8, 2.96], [12.5, 2.66]]) shell.push(flat(w, 0.04, 0.02, T.accent, 0, 6.4 + h / 2, -36.53), flat(w, 0.04, 0.02, T.accent, 0, 6.4 - h / 2, -36.53),
      flat(0.04, h, 0.02, T.accent, -w / 2, 6.4, -36.53), flat(0.04, h, 0.02, T.accent, w / 2, 6.4, -36.53));
    for (const x of [-5.2, 5.2]) shell.push(M.beam(x, 8.12, -36.46, x, BL.pokerVault.SPRING + 0.02, -36.46, 0.026, T.accent), flat(0.09, 0.03, 0.09, T.accent, x, BL.pokerVault.SPRING - 0.015, -36.46));
    // The lamps hang 0.6 m lower than they did over the taller tables, so each keeps its height over the felt.
    for (const p of TABLES) lamps.cable(p.x, 8.8, p.z - 1.8, p.x, 8.8, p.z + 1.8, 3.7, [0.25, 0.5, 0.75], "hanging", 0);
    const jacket = M.merge(box(0.92, 0.96, 0.66, "#292f33", 0, 0.49),
      box(0.31, 0.66, 0.08, "#e6e1ce", 0, 0.62, 0.36),
      box(0.1, 0.48, 0.09, "#e6b634", 0, 0.52, 0.42),
      box(0.18, 0.14, 0.1, "#f7d052", 0, 0.84, 0.42));
    const built = {
      shell: M.merge(...shell), lamps: lamps.build(), chair: ornateChair(), jacket,
      sleeve: box(0.4, 0.78, 0.43, "#292f33", 0, -0.29, 0.025),
      cuff: box(0.41, 0.12, 0.44, "#e6e1ce", 0, -0.73, 0.025),
      base: pedestal(), stone: stoneTop(), rim: rail(), felt: disk(1, FELT_Y - 0.02, FELT_Y, T.felt), pinstripe: inlay(),
      back: BL.pokerCards.geometry(null), chip: disk(0.17, 0, 0.055, "#e2b43c"),
      button: disk(0.16, 0, 0.055, "#ece3c7"),
      title: BL.poolModels.carve("BANANA POKER", { cell: 0.24, color: T.accent }),
      welcome: BL.poolModels.carve("GOOD HANDS GOOD COMPANY", { cell: 0.1, color: T.mineral, emissive: 0.1 }),
      stool: stool(), sofa: sofa(), armchair: armchair(), lowTable: lowTable(),
      // Floor tiles (the floor module's six veined white seeds and two dark ones for the border).
      tiles: BL.pokerFloor.tiles(lite),
      column: K.column({ h: 8.8 }), palm: palm(), post: ropePost(), chandelier: chandelierFrame(), crystals: crystals(),
      pinstripeGold: M.lathe({ segments: 64, profile: [[1, FELT_Y + 0.005], [0.993, FELT_Y + 0.005]], color: "#f2cf6e", emissive: 0.45 }),
      cashier: BL.poolModels.carve("CASHIER", { cell: 0.12, color: "#ffe1a0", emissive: 1 }),
      // A dark green marble plate framed in gold behind each floating table name, wide enough for TABLE 10, so the light
      // letters never read against white stone or the cream ceiling.
      plate: M.merge(box(3.4, 0.85, 0.04, "#1d4234", 0, -0.2, 0.08), box(3.48, 0.05, 0.05, T.accent, 0, 0.245, 0.09), box(3.48, 0.05, 0.05, T.accent, 0, -0.645, 0.09),
        box(0.05, 0.94, 0.05, T.accent, -1.74, -0.2, 0.09), box(0.05, 0.94, 0.05, T.accent, 1.74, -0.2, 0.09))
    };
    built.cashier.geometry.castShadow = false; built.plate.castShadow = false;
    // The evening hall's haze takes nothing off what glows: the crystals, the lanterns' lit glass and the cashier's
    // sign stay crisp down the hall.
    for (const g of [...built.crystals, built.cashier.geometry, built.lamps.glow, built.lamps.lampGlow, built.lamps.swingGlow, built.lamps.swingLampGlow]) if (g) g.fogPierce = 1;
    cache.set(key, built); return built;
  };
  const card = c => BL.pokerCards.geometry(c);
  // The tells' sweat (poker-tells.js): a pale drop on the brow, then a second running down beside it, two meshes shared
  // by every table, built about a seat's bead node with +z toward the table. The node stands at a seated
  // Ooga's brow for the roster's middle height (1.04): 0.895 m over its seated hip and 0.3 m in front of the chair's centre.
  const BEAD_Y = sitY(1.04) + 0.895, BEAD_OUT = 0.3, NOOP = () => {};
  const beadGeometry = M.cached(() => {
    const drop = (x, y) => M.moved(M.lathe({ segments: 6, profile: [[0, 0.075], [0.016, 0.05], [0.03, 0.02], [0.026, 0.004], [0, 0]], color: "#bfe8ff", emissive: 0.35 }), x, y, 0);
    const one = drop(0.09, 0), two = M.merge(drop(0.09, 0), drop(-0.06, -0.07));
    one.castShadow = two.castShadow = false;
    return { one, two };
  });
  // A table's three tell props, made on first use rather than with the room, so a fresh room's node tree is exactly the
  // one it had before them: a bead node a seat, the tossed card pair (the card backs' geometry) and the pushed stack (the
  // chip piles' geometry). At most seats + 2 nodes a table, each made once on a tell's event and reused for the room's
  // life; level 0 and the hides never make one. Once made, placing writes transforms only.
  const tellProps = (t, g) => {
    const geos = beadGeometry();
    const beadAt = j => {
      if (t.beads[j]) return t.beads[j];
      const s = SEATS[j], bead = node(geos.one, s.x + Math.sin(s.yaw) * BEAD_OUT, BEAD_Y, s.z + Math.cos(s.yaw) * BEAD_OUT);
      bead.rotation.y = s.yaw; bead.visible = false; S.addChild(t.root, bead);
      return t.beads[j] = bead;
    };
    const tossNode = () => {
      if (t.toss) return t.toss;
      const toss = S.createNode();
      S.addChild(toss, node(g.back, -0.26), node(g.back, 0.26, 0.015)); toss.visible = false; S.addChild(t.root, toss);
      return t.toss = toss;
    };
    const pushNode = () => {
      if (t.push) return t.push;
      const push = node(g.chip); push.scale.y = 5; push.visible = false; S.addChild(t.root, push);
      return t.push = push;
    };
    return {
      beadAt,
      setBeads: (j, level) => {
        if (level > 0) { const b = beadAt(j); b.visible = true; b.geometry = level > 1 ? geos.two : geos.one; }
        else if (t.beads[j]) t.beads[j].visible = false;
      },
      // From seat j's card backs (k 0) to the table's middle (k 1), riding up over the board and shrinking to nothing.
      placeToss: (j, k) => {
        k = k > 0 ? (k < 1 ? k : 1) : 0;
        const toss = tossNode(), from = t.backs[j].position, u = 1 - k;
        toss.position.x = from.x * u; toss.position.y = from.y + 0.04 * k; toss.position.z = from.z * u;
        toss.rotation.y = SEATS[j].yaw + k * 0.8;
        toss.scale.x = toss.scale.y = toss.scale.z = u;
        toss.visible = k < 1;
      },
      hideToss: () => { if (t.toss) t.toss.visible = false; },
      // From seat j's chip pile (k 0) to the table's middle (k 1), riding up over the board.
      placePush: (j, k) => {
        k = k > 0 ? (k < 1 ? k : 1) : 0;
        const push = pushNode(), from = t.chips[j].position, u = 1 - k;
        push.position.x = from.x * u; push.position.y = from.y + 0.04 * k; push.position.z = from.z * u;
        push.visible = true;
      },
      hidePush: () => { if (t.push) t.push.visible = false; }
    };
  };
  // Canvas 2D's lite set never builds the props; its methods do nothing and `beadAt` gives null.
  const LITE_PROPS = Object.freeze({ beadAt: () => null, setBeads: NOOP, placeToss: NOOP, hideToss: NOOP, placePush: NOOP, hidePush: NOOP });
  const build = () => {
    const geo = geometry(), root = S.createNode(), environment = S.createNode(), tables = [];
    const fixtures = S.createNode();
    S.addChild(root, environment, fixtures);
    for (let i = 0; i < 10; i++) {
      const p = TABLES[i], group = S.createNode({ position: { x: p.x, y: 0, z: p.z } });
      const top = node(geo.stone); top.scale.x = 4.75; top.scale.z = 3.15;
      const rim = node(geo.rim); rim.scale.x = 4.5; rim.scale.z = 2.92;
      const felt = node(geo.felt); felt.scale.x = 4.38; felt.scale.z = 2.8;
      const pinstripe = node(i === HIGH_ROLLER ? geo.pinstripeGold : geo.pinstripe); pinstripe.scale.x = 4.02; pinstripe.scale.z = 2.44;
      const base = node(geo.base);
      S.addChild(group, base, top, rim, felt, pinstripe);
      const chairs = [], chips = [], backs = [];
      for (let j = 0; j < SEATS.length; j++) {
        const s = SEATS[j], pl = PLACES[j], chair = node(geo.chair, s.x, 0, s.z); chair.rotation.y = s.yaw; chairs.push(chair); S.addChild(group, chair);
        const pile = node(geo.chip, pl.x * 0.65, FELT_Y + 0.01, pl.z * 0.59); pile.visible = false; chips.push(pile); S.addChild(group, pile);
        const cards = S.createNode({ position: { x: pl.x * 0.57, y: FELT_Y + 0.02, z: pl.z * 0.57 }, rotation: { x: 0, y: s.yaw, z: 0 } });
        S.addChild(cards, node(geo.back, -0.26), node(geo.back, 0.26, 0.015)); cards.visible = false; backs.push(cards); S.addChild(group, cards);
      }
      // Deal left to right and print upright as seen from the gorilla's side of the table.
      const board = Array.from({ length: 5 }, (_, j) => { const n = node(geo.back, (2 - j) * 0.72, FELT_Y + 0.03); n.rotation.y = Math.PI; n.visible = false; S.addChild(group, n); return n; });
      const button = node(geo.button); S.addChild(group, button); button.visible = false;
      const lettering = BL.poolModels.carve(`TABLE ${i + 1}`, { cell: 0.1, color: "#ffe1a0", emissive: 1 });
      lettering.geometry.castShadow = false;
      const label = S.createNode({ position: { x: 0, y: 4.05, z: 0 } });
      label.scale.x = label.scale.y = label.scale.z = 0.7;
      const text = node(lettering.geometry, -(lettering.width - 0.2) / 2);
      text.glow = 1;
      S.addChild(label, text); S.addChild(group, label);
      // The name's plate behind it.
      const plate = node(geo.plate); S.addChild(label, plate);
      // The dealer, a gorilla at DEALER_SCALE: as tall as a standing Ooga guest, so it reads as staff beside the table, not over it.
      const agent = BL.agent.create({ groundAt: () => 0, x: 0, z: -3.6, managed: true, scale: DEALER_SCALE });
      agent.poseManaged(1, 0, 0, -3.6, 0, 0, false, true);
      S.addChild(agent.parts.torso, node(geo.jacket));
      for (const arm of [agent.parts.armR, agent.parts.armL]) S.addChild(arm, node(geo.sleeve), node(geo.cuff));
      S.addChild(group, agent.root);
      const dealCard = node(geo.back, 0, FELT_Y + 0.12, -2.4); dealCard.visible = false; S.addChild(group, dealCard);
      S.addChild(root, group);
      const table = { root: group, base, top, rim, felt, pinstripe, chairs, chips, backs, board, button, label, plate, agent, dealCard,
        beads: SEATS.map(() => null), toss: null, push: null, actors: new Array(SEATS.length).fill(null), version: -1, pulse: 0 };
      tables.push(Object.assign(table, lite ? LITE_PROPS : tellProps(table, geo)));
    }
    const sparkle = [];
    // The fountain, statues, patterned marble floor, glass vault and glass walls, built once a room on the set `setLite`
    // chose; the fountain moves only when its scene calls its `update`.
    const fountain = BL.pokerFountain.build(lite), statues = BL.pokerStatues.build(lite), floor = BL.pokerFloor.build(lite), vault = BL.pokerVault.build(lite);
    const glazing = BL.pokerGlazing.build(lite);
    fountain.root.position.x = BL.pokerFountain.X; fountain.root.position.z = BL.pokerFountain.Z;
    S.addChild(environment, node(geo.shell));
    S.addChild(fixtures, ...BL.dressing.nodes(geo.lamps, { glow: 1 }));
    S.addChild(environment, floor.root, vault.root, glazing.root);
    // A colonnade of round columns before the glass.
    for (const side of [-1, 1]) for (let z = -34; z <= 34; z += 8.5) S.addChild(environment, node(geo.column, side * 23.8, 0, z));
    for (let f = 0; f < 3; f++) {
      const z = (f - 1) * 24;
      S.addChild(fixtures, node(geo.chandelier, 0, 0, z));
      for (let ring = 0; ring < 4; ring++) { const n = node(geo.crystals[ring], 0, 0, z); n.ring = ring; n.fixture = f; sparkle.push(n); S.addChild(fixtures, n); }
    }
    for (const f of FURNITURE) {
      if (f.kind === "bar") for (let k = 0; k < 5; k++) S.addChild(environment, node(geo.stool, f.x - 6 + k * 3, 0, f.z + f.hz - 0.22));
      else if (f.kind === "sofa") { const n = node(geo.sofa, f.x, 0, f.z); n.rotation.y = f.x < 0 ? Math.PI : 0; S.addChild(environment, n); }
      // Facing its `yaw`: the piece's front looks down -x, so it turns by a quarter more.
      else if (f.kind === "armchair") { const n = node(geo.armchair, f.x, 0, f.z); n.rotation.y = f.yaw + Math.PI / 2; S.addChild(environment, n); }
      else if (f.kind === "lowTable") S.addChild(environment, node(geo.lowTable, f.x, 0, f.z));
      else if (f.kind === "palm") S.addChild(environment, node(geo.palm, f.x, 0, f.z));
      else if (f.kind === "ropePost") S.addChild(environment, node(geo.post, f.x, 0, f.z));
      else if (f.kind === "cage") {
        // Turned to face the room from the canopy's front, centred on the booth.
        const sign = node(geo.cashier.geometry, f.x - f.hx + 0.22, 3.25, f.z - (geo.cashier.width - 0.24) / 2);
        sign.rotation.y = -Math.PI / 2; S.addChild(environment, sign);
      }
    }
    S.addChild(environment, fountain.root, statues.root);
    const title = geo.title;
    S.addChild(environment, node(title.geometry, -title.width / 2, 6.4, -36.15));
    const welcome = geo.welcome;
    S.addChild(environment, node(welcome.geometry, -welcome.width / 2, 5.2, -36.15));
    return { root, tables, fixtures, sparkle, fountain, statues, floor, vault, glazing };
  };
  // Banana Club's fittings as axis-aligned boxes (centre, half-extents) in room coordinates; the geometry is built from
  // the same table. `solid` ones stop walkers, while the high-roller corner is only a mark round table 9.
  const FURNITURE = Object.freeze([
    { kind: "bar", x: -10, z: -35.3, hx: 8, hz: 0.9, solid: true }, { kind: "bar", x: 10, z: -35.3, hx: 8, hz: 0.9, solid: true },
    { kind: "cage", x: 22.4, z: 31, hx: 1.0, hz: 2.5, solid: true },
    { kind: "sofa", x: -22.6, z: -31, hx: 0.6, hz: 2.0, solid: true }, { kind: "sofa", x: 22.6, z: -31, hx: 0.6, hz: 2.0, solid: true },
    { kind: "lowTable", x: -20.6, z: -31, hx: 0.5, hz: 0.9, solid: true }, { kind: "lowTable", x: 20.6, z: -31, hx: 0.5, hz: 0.9, solid: true },
    { kind: "palm", x: -22.3, z: -28.6, hx: 0.35, hz: 0.35, solid: true }, { kind: "palm", x: 22.3, z: -28.6, hx: 0.35, hz: 0.35, solid: true },
    // Each lounge's armchairs round its low table, facing in (`yaw` faces (sin, cos)): two across the table from the
    // sofa and one at each end. Walk blocks like the sofa.
    ...[-1, 1].flatMap(side => [
      { kind: "armchair", x: side * 19.05, z: -31.9, hx: 0.45, hz: 0.48, yaw: side * Math.PI / 2, solid: true },
      { kind: "armchair", x: side * 19.05, z: -30.1, hx: 0.45, hz: 0.48, yaw: side * Math.PI / 2, solid: true },
      { kind: "armchair", x: side * 20.6, z: -33.35, hx: 0.48, hz: 0.45, yaw: 0, solid: true },
      { kind: "armchair", x: side * 20.6, z: -28.65, hx: 0.48, hz: 0.45, yaw: Math.PI, solid: true }]),
    { kind: "ropePost", x: 5.0, z: -28.4, hx: 0.2, hz: 0.2, solid: true }, { kind: "ropePost", x: 5.0, z: -26.8, hx: 0.2, hz: 0.2, solid: true },
    { kind: "ropePost", x: 5.0, z: -21.8, hx: 0.2, hz: 0.2, solid: true }, { kind: "ropePost", x: 5.0, z: -20.2, hx: 0.2, hz: 0.2, solid: true },
    { kind: "rope", x: 5.0, z: -27.6, hx: 0.1, hz: 0.8, solid: true }, { kind: "rope", x: 5.0, z: -21.0, hx: 0.1, hz: 0.8, solid: true },
    { kind: "highRoller", x: 11, z: -24, hx: 7.0, hz: 5.0, solid: false },
    // Each statue from its plinth's back edge to as far as it reaches toward the room, and as wide as it reaches, so no
    // head meets a held piece above the plinth.
    ...BL.pokerStatues.SLOTS.map(s => {
      const P = BL.pokerStatues.PLINTH, hx = (P.w / 2 + P.reach) / 2, out = Math.sign(s.x);
      return { kind: "plinth", x: s.x + out * (P.w / 2 - hx), z: s.z, hx, hz: Math.max(P.w / 2, P.side), solid: true };
    })
  ].map(f => Object.freeze(f)));
  const HIGH_ROLLER = 9;
  const solids = FURNITURE.filter(f => f.solid);
  // The room is rebuilt per visit but this module lives for the page, so the scene puts lite back off in `leave`.
  const setLite = on => { lite = on; K.setLite(on); };
  const F = BL.pokerFountain;
  // Whether the segment, grown by r, crosses box f: a slab test on t in [0, 1], so a zero-length step tests its point.
  const crosses = (ax, az, bx, bz, r, f) => {
    let lo = 0, hi = 1;
    const dx = bx - ax, dz = bz - az, x0 = f.x - f.hx - r, x1 = f.x + f.hx + r, z0 = f.z - f.hz - r, z1 = f.z + f.hz + r;
    if (dx === 0) { if (ax <= x0 || ax >= x1) return false; } else {
      const p = (x0 - ax) / dx, q = (x1 - ax) / dx;
      lo = Math.max(lo, Math.min(p, q)); hi = Math.min(hi, Math.max(p, q));
      if (lo >= hi) return false;
    }
    if (dz === 0) return az > z0 && az < z1;
    const p = (z0 - az) / dz, q = (z1 - az) / dz;
    return Math.max(lo, Math.min(p, q)) < Math.min(hi, Math.max(p, q));
  };
  const walkable = (ax, az, bx, bz, y, height, actor) => {
    const r = actor?.bodyRadius || 0.4;
    // Leave room to reach the glass, but never continue through the wall behind it.
    const rear = Math.abs(bx) < BL.bifrostModels.WINDOW.halfW - r ? REAR_WALL_Z - 0.01 : 35.5 - r;
    if (Math.abs(bx) > 23 - r || bz < -35.5 + r || bz > rear) return false;
    // A swept ellipse catches a fast step through a table, not just its endpoint.
    for (const t of TABLES) {
      const rx = 4.85 + r, rz = 3.25 + r, x = (ax - t.x) / rx, z = (az - t.z) / rz;
      const dx = (bx - ax) / rx, dz = (bz - az) / rz, d = dx * dx + dz * dz;
      const u = d ? Math.max(0, Math.min(1, -(x * dx + z * dz) / d)) : 0;
      if ((x + u * dx) ** 2 + (z + u * dz) ** 2 < 1) return false;
      for (const s of SEATS) {
        const sx = t.x + s.x, sz = t.z + s.z, vx = bx - ax, vz = bz - az, dd = vx * vx + vz * vz;
        const k = dd ? Math.max(0, Math.min(1, ((sx - ax) * vx + (sz - az) * vz) / dd)) : 0;
        if ((ax + k * vx - sx) ** 2 + (az + k * vz - sz) ** 2 < (r + 0.53) ** 2) return false;
      }
    }
    for (let i = 0; i < solids.length; i++) if (crosses(ax, az, bx, bz, r, solids[i])) return false;
    // The fountain: the swept step's nearest point to the pool's centre stays outside its rim grown by r.
    const vx = bx - ax, vz = bz - az, dd = vx * vx + vz * vz, k = dd ? Math.max(0, Math.min(1, ((F.X - ax) * vx + (F.Z - az) * vz) / dd)) : 0;
    return (ax + k * vx - F.X) ** 2 + (az + k * vz - F.Z) ** 2 >= (F.RADIUS + r) ** 2;
  };
  /** Writes into `out` the nearest point, on rings 0.5 m apart out to 4 m in sixteen directions, where a body may stand. */
  const nearestClear = (x, z, actor, out) => {
    out.x = x; out.z = z;
    if (walkable(x, z, x, z, 0, 2, actor)) return out;
    for (let ring = 1; ring <= 8; ring++) {
      const d = ring * 0.5;
      for (let i = 0; i < 16; i++) {
        const a = i * Math.PI / 8, px = x + Math.sin(a) * d, pz = z + Math.cos(a) * d;
        if (walkable(px, pz, px, pz, 0, 2, actor)) { out.x = px; out.z = pz; return out; }
      }
    }
    throw new Error(`pokerModels.nearestClear: nothing clear within 4 m of (${x}, ${z})`);
  };
  // The crowd's named places, `{ kind, x, z, yaw, table }` with yaw facing (sin, cos) and `table` -1 off the rails:
  // four rail spots a table, the strolls down the promenade and the side aisles, the door, small conversation groups
  // (`group`, two to four places round a middle, each facing it) in the arrival band, by the fountain and down the
  // promenade, places at the side walls looking out (`glass`, in pairs), the bar stools, places
  // standing at the bar between them, the cage's window, a bouncer's place by each rope, and the lounges' seats
  // (`lounge`, with `seat` "sofa" or "armchair" and `side` -1 or 1), which only their residents sit in. Stools and
  // seats stand inside their furniture, being sat on (a lounge seat where the resident's hip rests on its cushion); a standing spot inside something is moved out (a rail spot along
  // its own line from the table, dropped past 1.5 m). Laid once a page.
  let spotList = null;
  const STAND = { bodyRadius: 0.5 }, STROLL_Z = [30, 18, 6, -6, -18, -30], STROLL_MID = [24, 12, 0, -12, -24];
  const OUT_OF_LOUNGE = { [-30]: -21, [-24]: -15 };
  const GROUPS = [[-14, 31.2, 4], [-6, 30.6, 3], [6, 30.6, 4], [14, 31, 3], [0, 4.9, 3], [0, -4.9, 4], [0, 18, 3], [0, -18, 3]], GROUP_R = 0.85;
  const GLASS_Z = [22, 12.5, 3, -12.5, -23], GLASS_X = 22.1;
  const spots = () => {
    if (spotList) return spotList;
    const list = [], clear = { x: 0, z: 0 };
    const add = (kind, x, z, yaw, table = -1) => list.push(Object.freeze({ kind, x, z, yaw, table }));
    const stand = (kind, x, z, yaw) => { nearestClear(x, z, STAND, clear); add(kind, clear.x, clear.z, yaw); };
    TABLES.forEach((t, i) => {
      for (const [ox, oz] of [[-3.4, -5.3], [3.4, -5.3], [-3.4, 5.3], [3.4, 5.3]]) {
        const len = Math.hypot(ox, oz), ux = ox / len, uz = oz / len;
        for (let d = 0; d <= 1.5; d += 0.25) {
          const x = t.x + ox + ux * d, z = t.z + oz + uz * d;
          if (walkable(x, z, x, z, 0, 2, STAND)) { add("rail", x, z, Math.atan2(-ux, -uz), i); break; }
        }
      }
    });
    // The side aisles' last strolls toward the bar stop short of the lounges (`OUT_OF_LOUNGE`), so nobody stands among
    // the armchairs in front of the women.
    const aisle = (x, z) => x && OUT_OF_LOUNGE[z] !== undefined ? OUT_OF_LOUNGE[z] : z;
    for (const z of STROLL_Z) for (const x of [-20, 0, 20]) stand("stroll", x, aisle(x, z), 0);
    for (const z of STROLL_MID) for (const x of [-20, 0, 20]) if (x || Math.abs(z) > 6) stand("stroll", x, aisle(x, z), 0);
    for (const x of [-3, 3]) stand("door", x, 33, Math.PI);
    for (const [gx, gz, n] of GROUPS) for (let k = 0; k < n; k++) {
      const a = (k + 0.5) * 2 * Math.PI / n + gx * 0.1;
      nearestClear(gx + Math.sin(a) * GROUP_R, gz + Math.cos(a) * GROUP_R, STAND, clear);
      add("group", clear.x, clear.z, Math.atan2(gx - clear.x, gz - clear.z));
    }
    for (const side of [-1, 1]) for (const z of GLASS_Z) for (const dz of [-0.6, 0.6]) stand("glass", side * GLASS_X, z + dz, side * Math.PI / 2);
    for (const f of FURNITURE) {
      const side = -Math.sign(f.x);
      if (f.kind === "bar") {
        for (let k = -6; k <= 6; k += 3) add("stool", f.x + k, -34.6, Math.PI);
        for (let k = -4.5; k <= 4.5; k += 3) if (Math.abs(f.x + k) > 4) stand("bar", f.x + k, -33.9, Math.PI);
      } else if (f.kind === "sofa") for (const dz of [-1.17, 0, 1.17]) list.push(Object.freeze({ kind: "lounge", x: f.x - side * 0.12, z: f.z + dz, yaw: side * Math.PI / 2, table: -1, seat: "sofa", side: -side }));
      else if (f.kind === "armchair") list.push(Object.freeze({ kind: "lounge", x: f.x, z: f.z, yaw: f.yaw, table: -1, seat: "armchair", side: Math.sign(f.x) }));
      else if (f.kind === "cage") add("cage", f.x + side * 1.6, f.z, -side * Math.PI / 2);
      else if (f.kind === "rope") add("rope", f.x + side, f.z, side * Math.PI / 2);
    }
    spotList = Object.freeze(list);
    return spotList;
  };
  // The bar wings', the cage's and the fountain's soft warm lights, eight floats each (x, y, z, range, r, g, b, 0), after
  // the room's thirteen.
  const CLUB_LIGHTS = Float32Array.from([-10, 3, -35.6, 9, 1, 0.7, 0.4, 0, 10, 3, -35.6, 9, 1, 0.7, 0.4, 0, 20.6, 2.4, 31, 7, 1, 0.85, 0.55, 0,
    BL.pokerFountain.X, 3.6, BL.pokerFountain.Z, 6, 0.8, 0.72, 0.56, 0]);
  // The colonnade: a warm light low before each statue's plinth, where its uplight cups stand, so the figures
  // read lit from below against the night through the glass, and the sill and glass round them catch it. After every
  // other light, so a tier that keeps fewer drops them first (the scene counts them only on the tier that keeps all).
  const COLONNADE = Float32Array.from(BL.pokerStatues.SLOTS.flatMap(({ x, z }) => [x - Math.sign(x) * 0.9, 0.25, z, 6, 2.2, 1.7, 1.15, 0]));
  // One warm light a lounge, from its table lamps, after the colonnade's and counted on the top WebGL tier alone with it,
  // so the women on the sofas and in the armchairs read lit, not dark against the night.
  const LOUNGE_LIGHTS = Float32Array.from(FURNITURE.filter(f => f.kind === "lowTable").flatMap(f => [f.x, 1.3, f.z, 6.5, 1.9, 1.35, 0.8, 0]));
  // The one sitting pose for a caveman at a table, the same for every figure: the legs forward over the chair and both
  // arms brought forward to the rail. `standPose` sets back exactly these four rotations to the crew's standing values.
  const SIT_LEGS = -1.35, SIT_ARMS = -0.9, STAND_ARMS = -0.2;
  const sitPose = cave => {
    const p = cave.parts;
    if (p.legL) p.legL.rotation.x = SIT_LEGS; if (p.legR) p.legR.rotation.x = SIT_LEGS;
    if (p.armL) p.armL.rotation.x = SIT_ARMS; if (p.armR) p.armR.rotation.x = SIT_ARMS;
  };
  const standPose = cave => {
    const p = cave.parts;
    if (p.legL) p.legL.rotation.x = 0; if (p.legR) p.legR.rotation.x = 0;
    if (p.armL) p.armL.rotation.x = STAND_ARMS; if (p.armR) p.armR.rotation.x = STAND_ARMS;
  };
  BL.pokerModels = { FELT_Y, RAIL_TOP, SEAT_TOP, SIT_HIP, DEALER_SCALE, sitY, PLACES, BEAD_Y, TABLES, SEATS, REAR_WALL_Z, PORTAL_Z, EXIT_Z, FURNITURE, HIGH_ROLLER, geometry, card, build, walkable, setLite, nearestClear, CLUB_LIGHTS, COLONNADE, LOUNGE_LIGHTS, spots, sitPose, standPose };
})();
