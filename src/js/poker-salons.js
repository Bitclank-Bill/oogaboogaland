// Rooms off the Ember Den floor. Door landings and walk limits use the same room coordinates as the art.
(() => {
  "use strict";
  const BL = window.BL, M = BL.models, S = BL.scene;
  const GOLD = "#b8893b", LACQUER = "#191713", IVORY = "#efe6d2", WALNUT = "#3c271e", ICE = "#9cc9e3";
  const ROOMS = [
    { name: "Cypherpunk Lounge", x: -13, z: -43, y: 0, w: 13, d: 11, h: 4.5 },
    { name: "Cold Storage", x: 1, z: -43, y: 0, w: 13, d: 11, h: 5 },
    { name: "Spectator Balcony", x: 12, z: -31, y: 5.3, w: 13, d: 7, h: 4.4 },
    { name: "21 Club", x: 10, z: -28, y: 17, w: 18, d: 15, h: 6 }
  ];
  // From, to, local x/z of the control, and local x/z where the player arrives. -1 is the main floor.
  const DOORS = [
    [-1, 0, -13, -34.3, 0, 3.5, "Whitepaper"],
    [-1, 1, 0, -35.8, 0, 3.5, "Genesis Vault"],
    [-1, 2, 17.4, -34.25, 4.2, -1.2, "Gallery lift"],
    [0, -1, 0, 5.1, -13, -32, "Back to the bar"],
    [1, -1, 0, 5.1, 0, -33, "Back to the hall"],
    [2, -1, 5.6, -2.6, 17.4, -32, "Gaming floor"],
    [2, 3, 3.3, -2.6, 5.4, -3.4, "Gate 21"],
    [3, 2, 6.4, -4.6, 3.2, -0.7, "Spectator balcony"],
    [0, 0, -1.22, -4.81, 0, 0, "Founders pass"]
  ];
  const mesh = (w, h, d, color, x, y, z, emissive = 0) => M.box({ w, h, d, color, emissive, offset: { x, y, z } });
  const add = (parent, geometry, x = 0, y = 0, z = 0) => {
    const n = S.createNode({ geometry, position: { x, y, z } }); S.addChild(parent, n); return n;
  };
  const letters = (text, cell, color, x, y, z) => {
    const g = BL.poolModels.carve(text, { cell, color, emissive: 0.5 }); return M.moved(g.geometry, x - g.width / 2, y, z);
  };
  const cache = M.scopedMap();
  const interior = (id, lite) => {
    const key = id + ":" + lite;
    if (cache.has(key)) return cache.get(key);
    const r = ROOMS[id], a = r.w / 2, b = r.d / 2, ice = id === 1, open = id >= 2;
    const trim = ice ? "#7297ae" : GOLD, wall = ice ? "#263c4d" : LACQUER, parts = [], solids = [];
    const slab = (x, y, z, w, h, d, c, glow = 0) => parts.push(mesh(w, h, d, c, x, y, z, glow));
    const solid = (x, z, w, d) => solids.push({ x, z, w: w / 2, d: d / 2 });
    const bevel = (w, h, d, color, x, y, z, radius) => M.bevelBox({ w, h, d, color, bevel: radius, offset: { x, y, z } });
    const rail = (x, y, z, xx, yy, zz, width, color) => parts.push(M.beam(x, y, z, xx, yy, zz, width, color));
    const chair = (x, z, yaw, c) => {
      const seat = M.merge(bevel(0.96, 0.22, 0.88, WALNUT, 0, 0.24, 0, 0.05),
        bevel(0.79, 0.21, 0.69, c, 0, 0.44, 0.07, 0.08), bevel(0.89, 0.8, 0.24, c, 0, 0.71, -0.33, 0.09),
        bevel(0.13, 0.28, 0.7, c, -0.43, 0.54, 0.02, 0.05), bevel(0.13, 0.28, 0.7, c, 0.43, 0.54, 0.02, 0.05),
        mesh(0.73, 0.14, 0.65, trim, 0, 0.1, 0));
      parts.push(M.moved(M.turnedY(seat, yaw), x, 0, z)); solid(x, z, 1.05, 1.05);
    };
    const cylinder = (x, z, profile, c, glow = 0) => parts.push(M.moved(M.lathe({ profile, color: c, segments: lite ? 8 : 16, emissive: glow }), x, 0, z));
    const fire = (x, z, scale) => {
      cylinder(x, z, [[0, 0], [scale, 0], [scale, 0.35], [scale * 0.83, 0.48], [0, 0.48]], wall);
      for (const side of [-1, 1]) {
        rail(x - scale * 0.55, 0.51, z + side * 0.18, x + scale * 0.55, 0.55, z - side * 0.19, 0.14, "#553327");
      }
      for (let k = 0; k < 7; k++) {
        const t = k * 2.4, d = scale * 0.44 * Math.sin(k); cylinder(x + Math.cos(t) * d, z + Math.sin(t) * d,
          [[0, 0.47], [0.22, 0.51], [0.16, 0.78], [0, 0.9 + 0.35 * Math.cos(t)]], k % 2 ? "#e16b26" : "#f7ba55", 0.6);
      }
      solid(x, z, scale * 2, scale * 2);
    };
    slab(0, -0.14, 0, r.w, 0.28, r.d, ice ? "#64869a" : "#2b2520");
    for (let k = -1; k <= 1; k += 2) {
      slab(k * (a - 0.32), 0.008, 0, 0.045, 0.012, r.d - 0.6, trim);
      slab(0, 0.008, k * (b - 0.32), r.w - 0.6, 0.012, 0.045, trim);
    }
    if (!open) {
      slab(0, r.h / 2, -b, r.w, r.h, 0.22, wall);
      slab(0, r.h / 2, b, r.w, r.h, 0.22, wall);
      for (const s of [-1, 1]) {
        slab(s * a, r.h / 2, 0, 0.22, r.h, r.d, wall);
        for (let z = -b + 1; z < b; z += 2.1) {
          slab(s * (a - 0.17), r.h / 2, z, 0.14, r.h - 0.2, 0.08, trim);
          slab(s * (a - 0.26), 2.1, z, 0.2, ice ? 1.4 : 0.38, 0.2, ice ? ICE : IVORY, 0.85);
        }
      }
      slab(0, r.h + 0.08, 0, r.w, 0.16, r.d, wall);
    } else {
      // Exposed balcony edge, slim brass posts and two continuous rails looking down to the hall.
      for (const sign of [-1, 1]) for (const y of [0.44, 1]) {
        slab(0, y, sign * b, r.w, 0.075, 0.09, trim); slab(sign * a, y, 0, 0.09, 0.075, r.d, trim);
      }
      for (const sign of [-1, 1]) {
        for (let x = -a; x <= a; x += r.w / 6) slab(x, 0.5, sign * b, 0.09, 1, 0.09, trim);
        for (let z = -b; z < b; z += r.d / 4) slab(sign * a, 0.5, z, 0.09, 1, 0.09, trim);
      }
    }
    if (id === 0) {
      // Leather reading chairs and a fireplace flanked by shelves and cipher-print panels.
      slab(0, 1.05, -b + 0.34, 3.5, 2.1, 0.6, WALNUT); slab(0, 1, -b + 0.66, 2.22, 1.5, 0.1, LACQUER);
      slab(0, 2.1, -b + 0.45, 3.85, 0.14, 0.84, GOLD); fire(0, -b + 0.95, 0.75);
      // A woven diamond runner and a fluted surround lead the eye to the hearth.
      slab(0, 0.017, 0.15, 3.45, 0.023, 6.8, "#52312d");
      for (const side of [-1, 1]) {
        slab(side * 1.59, 0.034, 0.15, 0.055, 0.012, 6.56, "#be9361");
        for (let i = 0; i < 3; i++) slab(side * (1.22 + i * 0.15), 1.02, -b + 0.69, 0.07, 1.78, 0.08, i === 1 ? GOLD : "#946744");
        for (let z = -2.7; z < 2.9; z += 1.35) {
          rail(0, 0.04, z, side * 0.68, 0.04, z + 0.66, 0.045, "#ad815a");
          rail(side * 0.68, 0.04, z + 0.66, 0, 0.04, z + 1.32, 0.045, "#ad815a");
        }
      }
      for (let i = 0; i < 7; i++) {
        const angle = Math.PI * i / 6;
        rail(0, 0.44, -b + 1.56, Math.cos(angle) * 0.83, 0.44 + Math.sin(angle) * 0.66, -b + 1.56, 0.038, GOLD);
      }
      for (const s of [-1, 1]) {
        for (const end of [-1, 1]) slab(s * 4.15 + end * 1.72, 1.45, -b + 0.23, 0.14, 2.86, 0.54, WALNUT);
        slab(s * 4.15, 2.9, -b + 0.23, 3.69, 0.16, 0.56, WALNUT);
        for (let row = 0; row < 3; row++) {
          const y = 0.78 + row * 0.65;
          slab(s * 4.15, y, -b + 0.24, 3.4, 0.08, 0.46, GOLD);
          for (let j = 0; j < (lite ? 7 : 13); j++) {
            const h = 0.23 + (j * 7 % 6) * 0.045;
            slab(s * 4.15 - 1.48 + j * (lite ? 0.44 : 0.235), y + h / 2 + 0.04, -b + 0.25, 0.15, h, 0.32, ["#694432","#244539","#8a7248"][j % 3]);
          }
        }
        chair(s * 2.1, -1.5, -s * 1.8, "#61392f"); chair(s * 4.45, 1.05, -s * 1.25, "#47312b");
      }
      parts.push(letters("CYPHERPUNK LOUNGE", 0.08, IVORY, 0, 3.2, -b + 0.17));
    } else if (ice) {
      // A hardware wallet carved from ice, on a plinth with a recessed screen and two physical buttons.
      cylinder(0, -1.2, [[0, 0], [1.65, 0], [1.45, 0.2], [1.15, 0.3], [1.15, 0.9], [0, 0.9]], ICE, 0.14);
      slab(0, 1.45, -1.2, 2.75, 1.08, 0.59, "#81adcd", 0.22);
      slab(-0.4, 1.48, -0.89, 1.32, 0.51, 0.045, "#193b51"); slab(-0.4, 1.48, -0.86, 0.77, 0.065, 0.04, ICE, 1);
      for (const x of [0.55, 0.92]) slab(x, 1.5, -0.87, 0.19, 0.19, 0.08, IVORY);
      // A brushed metal swivel cover and pin give the wallet a recognizable folding profile.
      parts.push(M.moved(M.turnedZ(bevel(1.46, 0.49, 0.14, "#b4d8e5", 0.56, 0, 0, 0.08), 0.56), -1.01, 1.61, -0.74));
      slab(-1, 1.62, -0.65, 0.14, 0.14, 0.045, "#426679");
      for (const s of [-1, 1]) {
        // Radial facets frame the display, with rows of numbered cold-storage drawers to either side.
        for (let i = 0; i < 5; i++) {
          const x = s * (0.24 + i * 0.52);
          rail(s * 0.15, 0.19, -b + 0.2, x, 2.3 + 0.25 * (4 - i), -b + 0.2, 0.075, "#79a6bd");
        }
        for (let row = 0; row < 3; row++) for (let col = 0; col < 3; col++) {
          const x = s * (3.35 + col * 0.94), y = 0.72 + row * 0.61;
          parts.push(bevel(0.89, 0.55, 0.18, "#58788b", x, y, -b + 0.2, 0.05));
          slab(x, y + 0.05, -b + 0.32, 0.25, 0.04, 0.07, ICE, 0.3);
        }
      }
      solid(0, -1.2, 3.3, 3.3);
      for (const s of [-1, 1]) {
        chair(s * 4.2, -1.2, -s * 1.55, "#ccd6d2");
        for (let k = 0; k < 7; k++) cylinder(s * (1.6 + k % 3 * 0.45), -2.8 + k * 0.56,
          [[0, r.h - 1.4 + k % 3 * 0.25], [0.24, r.h - 0.25], [0.28, r.h]], ICE, 0.5);
      }
      parts.push(letters("COLD STORAGE", 0.12, IVORY, 0, 3.55, -b + 0.18));
    } else if (id === 2) {
      for (const x of [-4.6, -2.9, -0.5, 1.2]) chair(x, 0.2, 0, "#52342b");
      slab(-3, 1.2, -2.65, 5.2, 2.4, 0.24, WALNUT);
      parts.push(letters("SPECTATOR GALLERY", 0.072, IVORY, -3, 1.7, -2.48));
      solid(-3, -2.65, 5.2, 0.4);
    } else {
      // Sky bar, fire pits and a brass telescope on a splayed tripod.
      slab(-3.6, 0.63, -4.8, 6.4, 1.26, 1, WALNUT); slab(-3.6, 1.3, -4.8, 6.6, 0.12, 1.14, GOLD); solid(-3.6, -4.8, 6.6, 1.14);
      for (let i = 0; i < 8; i++) {
        const x = -6.15 + i * 0.46;
        cylinder(x, -5.11, [[0, 1.36], [0.1, 1.36], [0.1, 1.62], [0.045, 1.68], [0.045, 1.82], [0, 1.82]], ["#795733", "#30624d", "#9c6452"][i % 3]);
        slab(x, 1.51, -5.01, 0.11, 0.11, 0.022, IVORY);
      }
      for (let k = 0; k < 3; k++) {
        const x = -6 + k * 2;
        cylinder(x, -3.62, [[0, 0], [0.3, 0], [0.3, 0.06], [0.09, 0.12], [0.09, 0.75], [0.34, 0.75], [0.34, 0.87], [0, 0.87]], GOLD);
        solid(x, -3.62, 0.68, 0.68);
      }
      parts.push(letters("21 CLUB", 0.09, IVORY, -3.6, 0.9, -4.24));
      for (const s of [-1, 1]) { fire(s * 4.3, 1, 0.86); chair(s * 6.3, 1.1, -s * 1.4, "#553e30"); chair(s * 4.3, 3.1, Math.PI, "#553e30"); }
      for (let i = 0; i < 3; i++) { const t = i * Math.PI * 2 / 3; parts.push(M.beam(Math.cos(t) * 0.58, 0, -3 + Math.sin(t) * 0.58, 0, 1.52, -3, 0.1, GOLD)); }
      parts.push(M.beam(-0.16, 1.33, -2.3, 0.23, 1.99, -4.06, 0.33, GOLD)); solid(0, -3, 1.2, 2.1);
    }
    const built = { geometry: M.merge(...parts), solids }; cache.set(key, built); return built;
  };
  const origin = i => i < 0 ? { x: 0, y: 0, z: 0 } : ROOMS[i];
  const build = lite => {
    const root = S.createNode(), solids = [], targets = [], rooms = [];
    ROOMS.forEach((r, i) => {
      const g = interior(i, lite); solids.push(g.solids); rooms.push(add(root, g.geometry, r.x, r.y, r.z));
    });
    // A glazed lift shaft at the far right links the three landings visibly from the tables.
    const lift = [], x = 17.4, z = -35.05;
    for (const dx of [-0.78, 0.78]) for (const dz of [-0.72, 0.72])
      lift.push(mesh(0.095, 19.35, 0.095, GOLD, x + dx, 9.675, z + dz));
    for (const y of [0.02, 2.35, 5.32, 7.65, 17.02, 19.35])
      lift.push(mesh(1.68, 0.085, 1.55, GOLD, x, y, z));
    const glazing = mesh(1.51, 19.25, 1.38, "#d7ceb9", x, 9.65, z);
    glazing.glassOpacity = 0.055; glazing.glassGrazing = 0.5; glazing.castShadow = false;
    add(root, M.merge(...lift)); add(root, glazing);
    DOORS.forEach(([from, to, x, z, , , label], i) => {
      const p = origin(from), book = i === 0;
      const parts = book ? [mesh(0.52, 0.68, 0.13, "#e5d7af", 0, 0, 0), letters("BTC", 0.03, LACQUER, 0, 0.17, -0.065)] :
        [mesh(1.9, 0.51, 0.12, LACQUER, 0, 0, 0), mesh(1.94, 0.045, 0.15, GOLD, 0, 0.27, 0),
         letters(label, Math.min(0.072, 0.44 / label.length), IVORY, 0, 0.09, -0.055)];
      // Return signs on the front wall face into their room.
      const n = add(root, M.merge(...parts), p.x + x, p.y + (i === 8 ? 2.47 : i === 1 ? 2.99 : 1.55), p.z + z);
      if (i === 3 || i === 4) n.rotation.y = Math.PI;
      targets.push(n);
    });
    // The two closed rooms have opaque walls behind the bar. The balcony and rooftop are visible from outside.
    const show = id => {
      for (let i = 0; i < 2; i++) rooms[i].visible = i === id;
      for (let i = 0; i < targets.length; i++) targets[i].visible = DOORS[i][0] === id;
    };
    show(-1);
    return { root, solids, targets, show };
  };
  // Test the whole walking segment against furniture expanded by the visitor's body radius.
  const clear = (set, r, ax, az, bx, bz, radius) => {
    ax -= r.x; az -= r.z; bx -= r.x; bz -= r.z;
    if (Math.abs(bx) > r.w / 2 - radius - 0.14 || Math.abs(bz) > r.d / 2 - radius - 0.14) return false;
    for (const f of set) {
      const dx = bx - ax, dz = bz - az, w = f.w + radius, d = f.d + radius;
      if (Math.max(ax, bx) <= f.x - w || Math.min(ax, bx) >= f.x + w || Math.max(az, bz) <= f.z - d || Math.min(az, bz) >= f.z + d) continue;
      if (Math.abs(dx * (az - f.z) - dz * (ax - f.x)) < Math.abs(dx) * d + Math.abs(dz) * w || !dx && !dz) return false;
    }
    return true;
  };
  BL.pokerSalons = Object.freeze({ ROOMS, DOORS, build, clear });
})();
