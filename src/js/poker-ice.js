// Glacier stone shared by the Genesis Vault, its lettering and the Cold Storage cavern.
(() => {
  "use strict";
  const BL = window.BL,
    M = BL.models,
    rgb = BL.math.hexToRgb,
    TAU = Math.PI * 2;
  const palette = ["#254966", "#355e7c", "#487996", "#6596b0", "#86b4c7", "#b2d9e7", "#e1f4f8"];
  const chip = (w, h, d, x, y, z, color, bevel, emissive = 0.28) => M.bevelBox({ w, h, d, color, bevel, emissive, offset: { x, y, z } });
  // The engine's three atlas faces sample XY, ZY and XZ. Turn the formation between projections.
  const atlas = M.cached(() => {
    const canvas = document.createElement("canvas"),
      ctx = canvas.getContext("2d");
    canvas.width = 3;
    canvas.height = 1;
    ctx.fillStyle = "#eceff1";
    ctx.fillRect(0, 0, 3, 1);
    const paper = { canvas, version: 0 },
      image = new Image();
    image.onload = () => {
      const size = 640;
      canvas.width = size * 3;
      canvas.height = size;
      for (let i = 0; i < 3; i++) {
        ctx.save();
        ctx.translate(size * (i + 0.5), size * 0.5);
        ctx.rotate((i * Math.PI) / 2);
        ctx.drawImage(image, -size / 2, -size / 2, size, size);
        ctx.restore();
      }
      paper.version++;
    };
    image.src = BL.pokerIceMap;
    return paper;
  });
  const bounds = g => {
    const lo = [Infinity, Infinity, Infinity],
      hi = [-Infinity, -Infinity, -Infinity];
    for (let i = 0; i < g.verts.length; i++) {
      const axis = i % 3,
        value = g.verts[i];
      lo[axis] = Math.min(lo[axis], value);
      hi[axis] = Math.max(hi[axis], value);
    }
    return { lo, hi };
  };
  const ice = (g, lite) => {
    g.chrome = 0.15;
    if (!lite && typeof CanvasRenderingContext2D !== "undefined") {
      const { lo, hi } = bounds(g),
        paper = atlas();
      g.imageSurface = {
        canvas: paper.canvas,
        atlas: true,
        atlasMin: lo,
        atlasMax: hi,
        rect: [0, 0, 1, 1],
        get version() {
          return paper.version;
        }
      };
    }
    return g;
  };
  // Fractured prism with an asymmetric broken tip. Winding also works for hanging icicles.
  const shard = (x, y, z, radius, height, lean, random) => {
    const g = M.geometry(),
      sides = 5,
      rings = [],
      angle = random() * TAU;
    for (const [level, width] of [[0, 0.78], [0.23, 1], [0.71, 0.49]]) {
      const row = [];
      for (let i = 0; i < sides; i++) {
        const a = angle + (TAU * i) / sides;
        row.push(
          M.pushVert(
            g,
            x + lean * level + radius * width * Math.cos(a),
            y + height * (level + 0.055 * Math.sin(a)),
            z + radius * width * Math.sin(a)
          )
        );
      }
      rings.push(row);
    }
    const tip = M.pushVert(g, x + lean + radius * 0.26, y + height, z + radius * 0.19);
    for (let i = 0; i < sides; i++) {
      const k = (i + 1) % sides,
        tone = 2 + Math.floor(random() * 5);
      for (let j = 0; j < 3; j++) {
        const f = j === 2 ? [rings[j][i], tip, rings[j][k]] : [rings[j][i], rings[j + 1][i], rings[j + 1][k], rings[j][k]];
        M.face(g, height > 0 ? f : f.reverse(), rgb(palette[Math.min(6, tone + (j === 2 ? 1 : 0))]), { emissive: 0.33 });
      }
    }
    return g;
  };
  const door = lite => {
    const parts = [],
      n = lite ? 32 : 72,
      random = BL.math.mulberry32(1983),
      cy = 2.26;
    const wheel = (profile, color, glow = 0.34) =>
      M.moved(M.turnedX(M.lathe({ profile, color, segments: n, emissive: glow }), Math.PI / 2), 0, cy, 0);
    parts.push(chip(5.65, 4.6, 0.5, 0, 2.3, -0.32, palette[0], 0.2));
    const layers = [[2.32, 0.02, 4], [2.19, 0.13, 1], [2.07, 0.23, 5], [1.98, 0.29, 1], [1.84, 0.36, 3], [1.74, 0.39, 1], [1.64, 0.42, 3]];
    for (const [r, z, c] of layers) parts.push(wheel([[0, z - 0.14], [r - 0.05, z - 0.14], [r, z - 0.05], [r - 0.045, z], [0, z]], palette[c]));
    parts.push(wheel([[0.72, 0.49], [0.8, 0.49], [0.88, 0.56], [0.84, 0.66], [0.76, 0.69], [0.72, 0.63], [0.72, 0.49]], palette[5]));
    for (let i = 0; i < n; i++) {
      const a = (TAU * i) / n,
        c = Math.cos(a),
        s = Math.sin(a);
      if (i % (n / 8) === 0) parts.push(chip(0.095, 0.095, 0.055, 2.13 * c, cy + 2.13 * s, 0.16, palette[6], 0.02));
      if (i % 2 === 0) parts.push(M.beam(1.72 * c, cy + 1.72 * s, 0.385, 1.83 * c, cy + 1.83 * s, 0.385, 0.023, palette[5]));
    }
    for (let i = 0; i < 6; i++) {
      const a = (TAU * i) / 6;
      const spoke = M.beam(0, cy, 0.58, 0.8 * Math.cos(a), cy + 0.8 * Math.sin(a), 0.6, 0.088, palette[5]);
      for (const face of spoke.faces) face.emissive = 0.52;
      parts.push(spoke);
    }
    parts.push(wheel([[0, 0.59], [0.22, 0.59], [0.23, 0.66], [0.19, 0.72], [0, 0.72]], palette[4]));
    for (const side of [-1, 1]) {
      parts.push(
        chip(0.56, 4.51, 0.54, side * 2.27, 2.25, -0.01, palette[3], 0.21),
        chip(0.4, 4.2, 0.41, side * 2.51, 2.1, -0.07, palette[2], 0.18)
      );
      for (let k = 0; k < 9; k++) {
        const a = ((k + 0.45) * Math.PI) / 9,
          x = side * (2.1 * Math.sin(a) + 0.47),
          y = cy + 2.12 * Math.cos(a);
        parts.push(shard(x, y - 0.3, 0.07, 0.24 + random() * 0.11, 0.61 + random() * 0.52, side * (0.22 + 0.21 * Math.cos(a)), random));
      }
      for (let i = 0; i < (lite ? 12 : 25); i++) {
        const shoulder = i % 2,
          t = random(),
          x = side * (1.85 + t * 0.94);
        const y = shoulder ? 3.46 + random() * 0.72 : -0.12;
        parts.push(
          shard(
            x,
            y,
            0.02 + random() * 0.21,
            0.12 + random() * 0.25,
            0.42 + random() * (shoulder ? 1.08 : 1.68),
            side * (0.12 + 0.55 * t),
            random
          )
        );
      }
    }
    // The Genesis coinbase headline is cut into the foot of the door.
    for (const [words, y] of [["THE TIMES 03/JAN/2009 CHANCELLOR ON", 1.03], ["BRINK OF SECOND BAILOUT FOR BANKS", 0.83]]) {
      const cut = line(words, 0.027, palette[5], true);
      parts.push(M.moved(cut.geometry, 0, y, 0.46));
    }
    for (const y of [1.2, 3.3]) parts.push(chip(0.53, 0.19, 0.28, -1.94, y, 0.37, "#ae8967", 0.055));
    return ice(M.merge(...parts), lite);
  };
  // Centre the visible carving, including the date's separator, using ink bounds rather than the font's trailing advance.
  const line = (text, cell, color, lite) => {
    let { geometry } = BL.poolModels.carve(text, { cell, color, emissive: 0.69 });
    if (text.includes("·") && !BL.hubModels.SIGN_GLYPHS["·"]) {
      let advance = 0;
      for (const ch of text.slice(0, text.indexOf("·"))) advance += ch === " " ? 2.4 : 4;
      geometry = M.merge(geometry, chip(cell, cell, 0.08, (advance + 1) * cell, -2 * cell, 0.16, color, 0.015, 0.69));
    }
    const { lo, hi } = bounds(geometry);
    M.moved(geometry, -(lo[0] + hi[0]) / 2, -(lo[1] + hi[1]) / 2, -lo[2]);
    return { geometry: ice(geometry, lite), width: hi[0] - lo[0], height: hi[1] - lo[1] };
  };
  const sign = lite => {
    const parts = [],
      random = BL.math.mulberry32(10309);
    for (const [w, h, z, c] of [[12.95, 3.27, -0.09, 3], [12.72, 3.1, 0.04, 5], [12.48, 2.9, 0.14, 1], [12.2, 2.69, 0.19, 0]])
      parts.push(chip(w, h, 0.22, 0, 0, z, palette[c], 0.1));
    for (const side of [-1, 1])
      for (const up of [-1, 1]) {
        // Fern frost grows toward the lettering from four symmetrical corners.
        for (let i = 0; i < (lite ? 6 : 13); i++) {
          const t = i / 13,
            x = side * (6.02 - 0.7 * t),
            y = up * (1.2 - 0.65 * t);
          parts.push(
            M.beam(x, y, 0.317, x - side * 0.23, y + up * 0.075, 0.318, 0.023, palette[5]),
            M.beam(x, y, 0.319, x + side * 0.045, y - up * 0.23, 0.319, 0.018, palette[4])
          );
        }
        parts.push(M.beam(side * 6.05, up * 1.23, 0.32, side * 5.31, up * 0.55, 0.32, 0.027, palette[5]));
        for (let i = 0; i < 3; i++)
          parts.push(shard(side * (6.18 + i * 0.08), up * (1.34 - 0.13 * i), 0.075, 0.09, up * (0.24 + 0.05 * i), side * 0.11, random));
      }
    return ice(M.merge(...parts), lite);
  };
  const cavern = (r, lite) => {
    const g = M.geometry(),
      parts = [g],
      random = BL.math.mulberry32(5617);
    const ribs = lite ? 12 : 24,
      cuts = lite ? 13 : 23,
      rows = [];
    // Successive unequal cross sections form a continuous inward-facing shell; folded strata run along it.
    for (let j = 0; j <= cuts; j++) {
      const z = (j / cuts - 0.5) * (r.d + 2.6),
        row = [];
      for (let i = 0; i <= ribs; i++) {
        const a = (Math.PI * i) / ribs,
          wave = Math.sin(z * 1.17 + 2.3 * a),
          bend = Math.sin(4 * a - z * 0.57);
        const x = -Math.cos(a) * (r.w / 2 - 0.28 + 0.2 * wave + 0.23 * bend);
        const y = -0.16 + Math.sin(a) * (r.h - 0.1 + 0.33 * wave + 0.29 * bend);
        row.push(M.pushVert(g, x, y, z));
      }
      rows.push(row);
    }
    const facet = (ids, t) => M.face(g, ids, rgb(palette[t]), { emissive: 0.32 + t * 0.035 });
    for (let j = 0; j < cuts; j++)
      for (let i = 0; i < ribs; i++) {
        const a = rows[j],
          b = rows[j + 1],
          fold = Math.sin(i * 1.12 + 0.75 * Math.sin(j * 0.46) + Math.cos(i * 0.36 - j * 0.21));
        const c = fold > 0.78 ? 4 : fold > 0.1 ? 3 : fold > -0.65 ? 2 : 1;
        facet([a[i], a[i + 1], b[i]], c);
        facet([a[i + 1], b[i + 1], b[i]], random() > 0.82 ? Math.min(5, c + 1) : c);
      }
    // Broken shelves fold across the ends of the chamber. A deep cleft sits just left of the plinth.
    for (const side of [-1, 1]) {
      const nx = lite ? 13 : 25,
        ny = lite ? 8 : 16,
        grid = [];
      for (let j = 0; j <= ny; j++) {
        const row = [];
        for (let i = 0; i <= nx; i++) {
          const x = (i / nx - 0.5) * (r.w + 1.8),
            v = j / ny;
          const y = -0.24 + (r.h + 1.1) * v + 0.25 * Math.sin(x * 0.66 + v * 2.8) + 0.22 * Math.cos(v * 5 + x * 0.25);
          const fold = Math.sin(j * 1.18 + x * 0.47 + 0.65 * Math.sin(x * 0.65 + j * 0.26));
          const cleft = Math.exp(-((x + 2.15 - 0.38 * y) ** 2) / 0.6 - (y - 2.0) ** 2 / 2.7);
          const z = side * (r.d / 2 + 0.12 + fold * 0.32 + 1.06 * cleft);
          row.push(M.pushVert(g, x, y, z));
        }
        grid.push(row);
      }
      for (let j = 0; j < ny; j++)
        for (let i = 0; i < nx; i++) {
          const a = grid[j],
            b = grid[j + 1],
            f = [a[i], a[i + 1], b[i]],
            h = [a[i + 1], b[i + 1], b[i]];
          const x = g.verts[a[i] * 3],
            y = g.verts[a[i] * 3 + 1];
          const fold = Math.cos(j * 1.18 + x * 0.47 + 0.65 * Math.sin(x * 0.65 + j * 0.26));
          const c = Math.abs(x + 2.15 - 0.38 * y) < 0.55 && Math.abs(y - 2) < 1.5 ? 0 : fold > 0.77 ? 4 : fold > 0.08 ? 3 : fold > -0.57 ? 2 : 1;
          facet(side < 0 ? f : f.reverse(), c);
          facet(side < 0 ? h : h.reverse(), c);
        }
    }
    // The foot of the ice collects broken plates, particularly around the recessed deposit boxes.
    for (const side of [-1, 1]) {
      for (let j = 0; j < (lite ? 9 : 18); j++) {
        const z = -r.d / 2 + random() * r.d;
        parts.push(shard(side * (r.w / 2 - 0.62), -0.16, z, 0.16 + random() * 0.36, 0.34 + random() * 0.87, -side * random() * 0.32, random));
      }
      const dx = side * 3.64;
      parts.push(
        chip(3.28, 0.56, 0.95, dx, 0.24, -r.d / 2 + 0.11, palette[3], 0.22),
        chip(3.16, 0.22, 0.72, dx, 2.23, -r.d / 2 + 0.13, palette[4], 0.096)
      );
      for (const end of [-1, 1]) parts.push(chip(0.36, 2.12, 0.86, dx + end * 1.48, 1.11, -r.d / 2 + 0.11, palette[2], 0.15));
    }
    for (let k = 0; k < (lite ? 40 : 100); k++) {
      const a = 0.39 + random() * 2.36,
        z = (random() - 0.5) * (r.d - 0.36);
      const roof = Math.sin(a) * (r.h - 0.1 + 0.33 * Math.sin(z * 1.17 + 2.3 * a) + 0.29 * Math.sin(4 * a - z * 0.57)) - 0.16;
      const x = -Math.cos(a) * (r.w / 2 - 0.28 + 0.2 * Math.sin(z * 1.17 + 2.3 * a) + 0.23 * Math.sin(4 * a - z * 0.57));
      if (Math.abs(x) > 4.1 || roof > 4.12)
        parts.push(shard(x, roof + 0.12, z, 0.045 + random() * 0.13, -0.2 - random() * 0.55, 0.075 * (random() - 0.5), random));
    }
    // Uneven laminae make a natural split stump. Each circumference changes independently.
    const pedestal = [],
      count = lite ? 14 : 28;
    for (const [y, radius] of [[0, 1.61], [0.12, 1.55], [0.27, 1.4], [0.34, 1.49], [0.52, 1.28], [0.68, 1.19], [0.79, 1.08]]) {
      const row = [];
      for (let i = 0; i < count; i++) {
        const a = (TAU * i) / count,
          d = radius + 0.1 * Math.sin(a * 3 + 0.9 * y) + 0.065 * Math.cos(a * 7 - y * 3.8);
        row.push(M.pushVert(g, d * Math.cos(a), y + 0.045 * Math.sin(3 * a + 0.4) + 0.023 * Math.cos(5 * a), d * Math.sin(a)));
      }
      pedestal.push(row);
    }
    for (let j = 1; j < pedestal.length; j++)
      for (let i = 0; i < count; i++) {
        const k = (i + 1) % count,
          a = pedestal[j - 1],
          b = pedestal[j];
        facet([a[i], b[i], b[k], a[k]], [2, 3, 1, 4, 2, 5][j - 1]);
      }
    facet(pedestal[pedestal.length - 1].slice().reverse(), 4);
    // The top of the glacial floor uses the same fracture field. The flat collision floor is immediately beneath.
    const floor = [
      [-r.w / 2, 0.003, r.d / 2 + 0.9],
      [r.w / 2, 0.003, r.d / 2 + 0.9],
      [r.w / 2, 0.003, -r.d / 2 - 0.9],
      [-r.w / 2, 0.003, -r.d / 2 - 0.9]
    ];
    M.face(g, floor.map(p => M.pushVert(g, ...p)), rgb("#43586b"), { emissive: 0.28 });
    return ice(M.merge(...parts), lite);
  };
  const glyph = lite => ice(BL.factoryModels.smoothBitcoin(2.48, (2.48 * 0.32) / 1.9, "#9cd7eb", 0.49), lite);
  BL.pokerIce = Object.freeze({ door, sign, line, cavern, glyph });
})();
