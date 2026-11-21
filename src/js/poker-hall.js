// The Ember Den's Bitcoin showpieces. All motion shares the scene clock and a fixed set of nodes.
(() => {
  "use strict";
  const BL = window.BL, M = BL.models, S = BL.scene;
  const BRASS = "#b8893b", LIGHT = "#e2c88d", BLACK = "#17140f", ORANGE = "#f7931a";
  const cache = M.scopedMap();
  const box = (x, y, z, w, h, d, color, emissive = 0) => M.box({ w, h, d, color, emissive, offset: { x, y, z } });
  const turn = (profile, color, segments, emissive = 0) => M.lathe({ profile, color, segments, emissive });
  const ring = (r, tube, color, segments) => M.turnedX(M.torus(r, tube, color, 0.18, segments, 6), Math.PI / 2);
  const child = (root, geometry, x = 0, y = 0, z = 0) => {
    const n = S.createNode({ geometry, position: { x, y, z } });
    S.addChild(root, n);
    return n;
  };

  // A stepped copper globe with a raised double-stroked B and concentric minting on its face.
  // Built at sky scale, with its decorated face toward local +z.
  const moonGeometry = sparse => {
    const key = sparse ? "moon-lite" : "moon";
    if (cache.has(key)) return cache.get(key);
    const faces = sparse ? 16 : 32, parts = [];
    const profile = [[0, -19], [6, -18], [12, -15], [16, -10], [18, -5], [19, 0], [18, 6], [15, 12], [10, 16], [4, 18], [0, 18.5]];
    parts.push(turn(profile, "#ae611c", faces, 0.46));
    const coin = turn([[0, 0], [14, 0], [14.8, 0.6], [14.8, 1.4], [14, 2], [0, 2]], "#ca812b", faces, 0.65);
    parts.push(M.moved(M.turnedX(coin, Math.PI / 2), 0, 0, 16));
    for (const r of [13.8, 12.7]) parts.push(M.moved(ring(r, 0.27, LIGHT, faces), 0, 0, 18.1));
    parts.push(M.moved(BL.factoryModels.smoothBitcoin(19, 1.6, "#ffdc87", 0.92), 0, 0, 18.7));
    const g = M.merge(...parts); g.castShadow = false; g.fogPierce = 1;
    cache.set(key, g); return g;
  };
  const hangMoon = (rig, sparse) => {
    const planet = rig.parts.planets.find(p => p.key === "giant");
    for (const n of planet.node.children) n.visible = false;
    const moon = child(planet.node, moonGeometry(sparse));
    moon.scale.x = moon.scale.y = moon.scale.z = 1.25;
    const dir = planet.dir;
    moon.rotation.y = Math.atan2(-dir[0], -dir[2]);
    moon.rotation.x = Math.asin(dir[1]);
    // Rotate the globe slowly through a small arc so the face remains legible from the hall.
    const update = rig.update, yaw = moon.rotation.y;
    rig.update = (dt, t, opts) => { update(dt, t, opts); moon.rotation.y = yaw + 0.24 * Math.sin(t * 0.075); };
  };

  // A safe set flush against the back glazing, in the gap between the two back bars.
  const safe = lite => {
    const n = lite ? 16 : 32, parts = [box(0, 2.25, -0.15, 4.5, 4.5, 0.3, BLACK)];
    const disk = turn([[0, 0], [2, 0], [2.1, 0.08], [2.1, 0.19], [1.97, 0.24], [0, 0.24]], BRASS, n);
    parts.push(M.moved(M.turnedX(disk, Math.PI / 2), 0, 2.25, 0.015));
    for (const [r, tube, z, color] of [[2.08, 0.08, 0.19, LIGHT], [1.72, 0.055, 0.27, BLACK], [0.83, 0.08, 0.4, LIGHT]]) parts.push(M.moved(ring(r, tube, color, n), 0, 2.25, z));
    for (let i = 0; i < 12; i++) {
      const a = i * Math.PI / 6, x = Math.cos(a), y = Math.sin(a);
      parts.push(box(x * 1.88, 2.25 + y * 1.88, 0.29, 0.12, 0.12, 0.09, BLACK));
      if (!(i & 1)) parts.push(M.beam(0, 2.25, 0.38, x * 0.83, 2.25 + y * 0.83, 0.38, 0.085, LIGHT));
    }
    for (const y of [1.25, 3.25]) parts.push(box(-1.87, y, 0.28, 0.52, 0.24, 0.26, LIGHT));
    for (const side of [-1, 1]) {
      // Fluted pylons step down toward the door. Fine engraved rays lead into the wheel.
      for (let k = 0; k < 3; k++) {
        const x = side * (2.35 + k * 0.23), h = 4.8 - 0.35 * k;
        parts.push(box(x, h / 2, 0.04, 0.23, h, 0.34, k === 1 ? LIGHT : BRASS, 0.18));
      }
      for (let k = 0; k < 5; k++) {
        const a = (0.18 + k * 0.075) * Math.PI;
        parts.push(M.beam(side * Math.cos(a) * 1.56, 2.25 + Math.sin(a) * 1.56, 0.28,
          side * Math.cos(a) * 1.1, 2.25 + Math.sin(a) * 1.1, 0.28, 0.045, LIGHT, 0.4));
      }
    }
    const plaque = (text, y) => {
      const g = BL.poolModels.carve(text, { cell: 0.031, color: "#f2d797", emissive: 0.45 });
      parts.push(M.moved(g.geometry, -g.width / 2, y, 0.25));
    };
    parts.push(box(0, 0.56, 0.31, 4.36, 0.58, 0.08, BLACK));
    plaque("THE TIMES 03/JAN/2009 CHANCELLOR ON", 0.76);
    plaque("BRINK OF SECOND BAILOUT FOR BANKS", 0.53);
    return M.merge(...parts);
  };

  // Back-to-back bronze animals, sculpted along local x. The bull dips its horned head;
  // the heavier bear has a raised shoulder, blunt muzzle and rounded ears.
  const beast = bull => {
    const coat = bull ? "#b77b36" : "#745242", edge = bull ? "#e1ad66" : "#ac8161";
    const parts = [];
    const mass = (x, y, z, w, h, d, color = coat) => parts.push(M.bevelBox({ w, h, d, color, bevel: Math.min(w, h, d) * 0.22, offset: { x, y, z } }));
    mass(0, 0.84, 0, 1.56, 0.72, 0.59);
    mass(0.46, 1.03, 0, 0.72, bull ? 0.69 : 0.83, 0.66);
    mass(0.88, bull ? 0.78 : 1.22, 0, 0.52, 0.5, 0.51);
    mass(1.16, bull ? 0.67 : 1.12, 0, 0.32, 0.25, 0.36, edge);
    for (const side of [-1, 1]) {
      mass(0.82, bull ? 1.01 : 1.49, side * 0.19, 0.17, 0.21, 0.14, edge);
      mass(1.02, bull ? 0.87 : 1.3, side * 0.254, 0.08, 0.07, 0.035, BLACK);
      for (const x of [-0.51, 0.51]) {
        const foot = x + side * 0.12;
        parts.push(M.beam(x, 0.73, side * 0.21, foot, 0.13, side * 0.24, bull ? 0.19 : 0.24, coat));
        mass(foot + 0.05, 0.085, side * 0.24, 0.28, 0.17, 0.23, edge);
      }
      if (bull) parts.push(M.beam(0.88, 0.94, side * 0.2, 0.99, 1.11, side * 0.44, 0.11, LIGHT),
        M.beam(0.99, 1.11, side * 0.44, 1.14, 1.29, side * 0.45, 0.055, LIGHT));
    }
    if (bull) parts.push(M.beam(-0.67, 1.06, 0, -0.99, 0.47, 0.12, 0.075, coat));
    return M.merge(...parts);
  };
  const gallery = lite => {
    const key = lite ? "gallery-lite" : "gallery";
    if (cache.has(key)) return cache.get(key);
    const n = lite ? 16 : 32;
    const plinth = turn([[0, 0], [2.3, 0], [2.3, 0.14], [1.98, 0.24], [1.86, 0.49], [1.78, 0.56], [0, 0.56]], BLACK, n);
    const bronze = M.merge(M.moved(beast(true), -0.05, 0, 0.47), M.moved(M.turnedY(beast(false), Math.PI), 0.08, 0, -0.49));
    const base = M.merge(plinth, turn([[1.88, 0.41], [1.91, 0.44], [1.9, 0.48], [1.86, 0.49]], BRASS, n));
    const block = box(0, 0, 0, 1, 1, 1, ORANGE, 0.8);
    block.castShadow = false;
    // The glass channel follows both banks of the island plinth, beneath the floor's single gloss pass.
    const channel = M.merge(), edge = BL.math.hexToRgb(BRASS), bed = BL.math.hexToRgb("#0e0d0b");
    for (const sign of [-1, 1]) for (let z = -35; z < 27; z++) {
      const at = q => sign * 2.7 * Math.max(0, 1 - q * q / 28);
      const quad = (inner, outer, color, emissive = 0) => {
        const pts = [[at(z) + sign * inner, z], [at(z + 1) + sign * inner, z + 1], [at(z + 1) + sign * outer, z + 1], [at(z) + sign * outer, z]];
        const ids = pts.map(([x, q]) => M.pushVert(channel, x, 0.013, q));
        M.face(channel, sign > 0 ? ids : ids.reverse(), color, { emissive });
      };
      quad(0, 0.72, bed); quad(0.72, 0.79, edge, 0.65);
    }
    channel.castShadow = false;
    const frame = [], bulb = [[0.006, 0], [0.09, 0.14], [0.24, 0.41], [0.28, 0.55], [0.27, 0.66]];
    for (const sign of [-1, 1]) {
      frame.push(turn([[0, sign * 0.68], [0.33, sign * 0.68], [0.33, sign * 0.74], [0, sign * 0.74]], BRASS, n));
    }
    for (const dx of [-0.23, 0.23]) for (const dz of [-0.23, 0.23]) frame.push(box(dx, 0, dz, 0.035, 1.4, 0.035, LIGHT));
    const glass = M.merge(turn(bulb, "#efe6d2", n), M.turnedX(turn(bulb, "#efe6d2", n), Math.PI));
    glass.glassOpacity = 0.09; glass.glassGrazing = 0.65; glass.castShadow = false;
    const sand = turn([[0, 0], [0.21, 0.1], [0.235, 0.32], [0, 0.35]], ORANGE, n, 0.64);
    // The east bar back becomes one illuminated aquarium. The two whales are room animation;
    // the aggregate feed carries no amounts for individual transactions.
    const aquarium = [box(0, 0, 0, 11.6, 3, 0.12, "#25475b", 0.45)];
    for (const sign of [-1, 1]) {
      aquarium.push(box(0, sign * 1.55, 0.06, 11.94, 0.12, 0.22, BRASS));
      aquarium.push(box(sign * 5.89, 0, 0.06, 0.12, 3.22, 0.22, BRASS));
    }
    for (let i = 0; i < (lite ? 9 : 23); i++) {
      const x = 5.35 * Math.sin(5.4 * i), y = 1.18 * Math.sin(2.62 * i), w = 0.035 + 0.011 * (i % 4);
      aquarium.push(box(x, y, 0.13, w, w, 0.026, "#94c9d2", 0.62));
    }
    for (let k = 0; k < 15; k++) {
      const x = k * 0.76 - 5.4, h = 0.16 + k % 4 * 0.13;
      aquarium.push(M.beam(x, -1.47, 0.16, x + 0.12, -1.47 + h, 0.16, 0.065, "#4b8479"));
    }
    const whale = M.merge(
      M.bevelBox({ w: 1.42, h: 0.51, d: 0.34, color: "#77a9c1", bevel: 0.14 }),
      box(0.48, -0.18, 0.03, 0.55, 0.17, 0.32, "#afcacf"), box(0.42, 0.02, 0.185, 0.07, 0.07, 0.045, BLACK),
      M.beam(-0.61, -0.01, 0, -0.98, 0.12, 0, 0.18, "#76a3b5"),
      M.beam(-0.96, 0.12, 0, -1.22, 0.18, 0.28, 0.12, "#a1bfc5"), M.beam(-0.96, 0.12, 0, -1.22, 0.18, -0.28, 0.12, "#a1bfc5"),
      M.beam(0.1, -0.12, 0, -0.23, -0.31, 0.33, 0.14, "#59869e"));
    const g = { tank: M.merge(...aquarium), whale, base, bronze, block, safe: safe(lite), channel, clock: M.merge(...frame), glass, sand };
    cache.set(key, g); return g;
  };
  const build = lite => {
    const g = gallery(lite), root = S.createNode(), packets = [], count = lite ? 24 : 72;
    child(root, g.base); child(root, g.channel);
    const clock = child(root, g.clock, -5.5, 1.72, 24);
    child(clock, g.glass);
    const upper = child(clock, g.sand, 0, 0.12), lower = child(clock, g.sand, 0, -0.64);
    let lastHeight = 0, flip = 0;
    const bronze = child(root, g.bronze, 0, 0.56, 0);
    child(root, g.safe, 0, 0, -36.06);
    const tank = child(root, g.tank, 10, 2.79, -35.55), whales = [child(tank, g.whale), child(tank, g.whale)];
    whales[1].scale.x = whales[1].scale.y = whales[1].scale.z = 0.62;

    const random = BL.math.mulberry32(210000);
    for (let i = 0; i < count; i++) {
      const lane = (i % 4 - 1.5) * 0.33, size = 0.1 + random() * 0.19;
      const n = child(root, g.block);
      n.scale.x = n.scale.z = size; n.scale.y = size * 0.48;
      n.rotation.y = Math.PI / 4;
      packets.push({ n, lane, phase: (i + random()) / count });
    }
    let drift = 0;
    const update = (dt, time) => {
      const chain = BL.chain.snapshot;
      for (let i = 0; i < whales.length; i++) {
        const n = whales[i], angle = time * (0.17 + 0.03 * i) + i * 2.6;
        n.position.x = 4.05 * Math.sin(angle); n.position.y = 0.5 - i * 0.82 + 0.12 * Math.sin(angle * 2);
        n.position.z = 0.45 + 0.12 * Math.sin(angle);
        n.rotation.y = Math.atan2(0.18 * Math.sin(angle), Math.cos(angle));
      }
      const now = Date.now();
      if (chain.heightAt > 0) {
        if (lastHeight && chain.height === lastHeight + 1) flip = Math.PI * 2;
        lastHeight = chain.height;
      } else lastHeight = 0;
      flip = Math.max(0, flip - dt * 1.8);
      clock.rotation.z = flip > 0 ? Math.PI * 2 - flip : 0;
      const fraction = chain.heightAt && chain.lastBlockAt ? Math.min(1, Math.max(0, (now - chain.lastBlockAt) / 600000)) : 0.5;
      upper.scale.y = Math.max(0.02, 1 - fraction); lower.scale.y = Math.max(0.02, fraction);
      const fresh = chain.socketAt > 0 && now - chain.socketAt < 90000;
      drift = (drift + dt * (fresh ? 1 + chain.gale * 2 : 0.65)) % 61;
      bronze.rotation.y = 0.42 + time * 0.13;
      for (let i = 0; i < count; i++) {
        const p = packets[i], z = 27 - (drift + 61 * p.phase) % 61;
        const split = Math.max(0, 1 - z * z / 28);
        p.n.position.x = p.lane + Math.sign(p.lane) * 2.7 * split;
        p.n.position.z = z; p.n.position.y = 0.055;
      }
    };
    update(0, 0);
    const dispose = () => { while (root.children.length) S.removeChild(root, root.children[root.children.length - 1]); };
    return { root, update, dispose };
  };
  BL.pokerHall = Object.freeze({ build, hangMoon });
})();
