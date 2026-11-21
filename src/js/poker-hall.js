// The Ember Den's Bitcoin showpieces. All motion shares the scene clock and a fixed set of nodes.
(() => {
  "use strict";
  const BL = window.BL, M = BL.models, S = BL.scene;
  const BRASS = "#b8893b", LIGHT = "#e2c88d", BLACK = "#17140f", ORANGE = "#f7931a";
  const cache = M.scopedMap();
  const box = (x, y, z, w, h, d, color, emissive = 0) => M.box({ w, h, d, color, emissive, offset: { x, y, z } });
  const turn = (profile, color, segments, emissive = 0) => M.lathe({ profile, color, segments, emissive });
  const child = (root, geometry, x = 0, y = 0, z = 0) => {
    const n = S.createNode({ geometry, position: { x, y, z } });
    S.addChild(root, n);
    return n;
  };

  // The low-resolution map keeps the crater chain visible on Canvas and while the full atlas decodes.
  // Both maps use east-positive longitude, north at the top, with the near side centred on local +z.
  const lunarSurface = (sparse, canvas) => {
    const key = "luna-" + sparse + "-" + canvas;
    if (cache.has(key)) return cache.get(key);
    const map = BL.pokerMoonMap, land = M.geometry();
    const cols = sparse ? 64 : 96, rows = cols / 2, radius = 26;
    const samples = map.fallback;
    const sample = (u, v, channel) => {
      const x = Math.floor(u * map.width) % map.width, y = Math.min(map.height - 1, Math.floor(v * map.height));
      return parseInt(samples.slice((y * map.width + x) * 4 + channel * 2, (y * map.width + x) * 4 + channel * 2 + 2), 16);
    };
    land.normals = [];
    const points = [];
    // The overlapping basins interrupt the silhouette as they turn toward the limb.
    for (let j = 0; j <= rows; j++) {
      const v = j / rows, lat = Math.PI * (0.5 - v), row = [];
      for (let i = 0; i < cols; i++) {
        const u = i / cols, lon = (u - 0.5) * Math.PI * 2;
        const r = radius - 1.6 * sample(u, v, 1) / 255;
        const x = Math.sin(lon) * Math.cos(lat), y = Math.sin(lat), z = Math.cos(lon) * Math.cos(lat);
        row.push(M.pushVert(land, x*r, y*r, z*r));
        land.normals.push(x, y, z);
      }
      points.push(row);
    }
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      const k = (i + 1) % cols, a = points[j], b = points[j+1];
      const face = j === 0 ? [a[i], b[i], b[k]] : j === rows-1 ? [a[i], b[i], a[k]] : [a[i], b[i], b[k], a[k]];
      const u = (i + 0.5) / cols, v = (j + 0.5) / rows;
      const tone = sample(u, v, 0);
      M.face(land, face, [tone, tone, Math.min(255, tone + 3)], { emissive: 0.76 });
    }
    land.castShadow = false; land.fogPierce = 1;
    if (!canvas && typeof Image === "function") {
      const image = new Image();
      image.onload = () => { land.imageSurface = { canvas: image, version: 1, rect: [0,0,1,1], lunar: true, smooth: true }; };
      image.src = map.jpeg;
    }
    cache.set(key, land); return land;
  };
  const hangMoon = (rig, sparse, canvas) => {
    const p = rig.parts.planets.find(planet => planet.key === "giant");
    // Replace Jupiter's complete local assembly, including moons and ring bands, in this room's rig.
    for (let i=rig.parts.spins.length-1;i>=0;i--) {
      if (rig.parts.spins[i].node.parent === p.ringNode) rig.parts.spins.splice(i,1);
    }
    for (const m of p.moons) rig.parts.moons.splice(rig.parts.moons.indexOf(m),1);
    for (const n of p.node.children.slice()) S.removeChild(p.node, n);
    const frame = S.createNode(); S.addChild(p.node, frame);
    frame.rotation.y = Math.atan2(-p.dir[0], -p.dir[2]);
    frame.rotation.x = Math.asin(p.dir[1]);
    const globe = child(frame, lunarSurface(sparse, canvas));
    const update = rig.update;
    // The original giant turned 0.05 radians per second. Its polar axis stays fixed as the marking rotates out of sight.
    rig.update = (dt, t, opts) => {
      update(dt, t, opts);
      globe.rotation.y = (globe.rotation.y + dt * 0.05) % (2 * Math.PI);
    };
  };

  // Water, reef and kelp are one static mesh. Tint each water tile by depth and distance
  // from the overhead lamps; diagonal shafts spread into the darker water below.
  const aquariumWall = lite => {
    const water = M.geometry(), parts = [water], random = BL.math.mulberry32(8801);
    const face = (points, color, glow) => M.face(water, points.map(p => M.pushVert(water, ...p)), color, { emissive: glow });
    const cols = lite ? 20 : 44, rows = lite ? 6 : 12;
    for (let row = 0; row < rows; row++) for (let col = 0; col < cols; col++) {
      const x = -5.86 + col * 11.72 / cols, y = -1.5 + row * 3 / rows;
      const depth = (row + 0.5) / rows, phase = x * 3.2 - y * 1.1;
      const shaft = Math.pow(Math.max(0, Math.cos(phase + 0.7 * Math.sin(x * 1.7))), 6);
      const light = depth * (0.42 + 0.48 * shaft);
      const rgb = [13 + 37 * light, 39 + 109 * light, 62 + 112 * light].map(Math.round);
      const xx = -5.86 + (col + 1) * 11.72 / cols, yy = -1.5 + (row + 1) * 3 / rows;
      face([[x, y, 0.07], [xx, y, 0.07], [xx, yy, 0.07], [x, yy, 0.07]], rgb, 0.74);
    }
    // Low polygon ridges overlap at three distances; the dark foreground reveals the whales' bellies.
    for (let layer = 0; layer < 3; layer++) {
      const z = 0.13 + layer * 0.36, count = lite ? 13 : 27;
      let x = -5.86, y = -1.18 + 0.23 * layer;
      for (let k = 1; k <= count; k++) {
        const xx = -5.86 + 11.72 * k / count;
        const yy = -1.32 + (2 - layer) * 0.17 + random() * 0.33 + 0.16 * Math.sin(xx * 1.5 + layer);
        const shade = 12 + (2 - layer) * 6 + Math.round(random() * 6);
        face([[x, -1.5, z], [xx, -1.5, z], [xx, yy, z], [x, y, z]], [shade, shade + 20, shade + 25], 0.39);
        x = xx; y = yy;
      }
    }
    for (const centre of [-5.2, -3.8, -0.65, 2.5, 4.9]) {
      for (let blade = 0; blade < (lite ? 3 : 6); blade++) {
        const x = centre + (random() - 0.5) * 0.55, h = 0.4 + random() * 0.81;
        const bend = (random() - 0.5) * 0.6, z = 0.88 + random() * 0.05;
        const mid = x + bend * 0.38, base = -1.44, y = base + h * 0.56;
        const c = [30, Math.round(87 + random() * 38), 110];
        face([[x - 0.045, base, z], [x + 0.045, base, z], [mid + 0.06, y, z], [mid - 0.06, y, z]], c, 0.27);
        face([[mid - 0.06, y, z], [mid + 0.06, y, z], [x + bend, base + h, z]], c, 0.34);
      }
    }
    for (const x of [-4.9, -1.8, 2.3, 5.2]) for (let k = 0; k < (lite ? 4 : 9); k++) {
      const r = 0.016 + random() * 0.027, y = -1.05 + k * 0.22 + random() * 0.09, cx = x + 0.14 * Math.sin(k);
      face([[cx, y-r, 0.3], [cx+r, y, 0.3], [cx, y+r, 0.3], [cx-r, y, 0.3]], [136, 206, 212], 0.61);
    }
    for (const sign of [-1, 1]) {
      parts.push(box(0, sign * 1.56, 0.43, 12, 0.18, 0.88, BLACK),
        box(0, sign * 1.54, 0.91, 12, 0.06, 0.13, BRASS),
        box(sign * 5.91, 0, 0.45, 0.18, 3.16, 0.9, BLACK),
        box(sign * 5.9, 0, 0.92, 0.08, 3.16, 0.1, BRASS));
    }
    parts.push(box(0, 1.45, 0.86, 11.68, 0.035, 0.08, "#a9e3dd", 0.95));
    return M.merge(...parts);
  };

  // Sections of a humpback along x: a broad head and pleated pale throat taper to a narrow tail stock.
  const humpback = () => {
    const hull = M.geometry(), parts = [hull], rings = [];
    for (const [x, y, ry, rz] of [[-1.43,0.14,0.09,0.1],[-1.15,0.08,0.17,0.16],[-0.69,0.02,0.32,0.3],
      [-0.14,0,0.43,0.4],[0.48,0,0.45,0.44],[0.94,0.02,0.35,0.4],[1.23,0.06,0.21,0.3],[1.37,0.09,0.07,0.11]]) {
      const ring = [];
      for (let i = 0; i < 8; i++) {
        const a = i * Math.PI / 4;
        ring.push(M.pushVert(hull, x, y + ry * Math.cos(a), rz * Math.sin(a)));
      }
      rings.push(ring);
    }
    const tones = ["#51a8be","#5a9aaf","#86c7cf","#c5e2d7","#c5e2d7","#86c7cf","#5a9aaf","#51a8be"].map(BL.math.hexToRgb);
    for (let j = 1; j < rings.length; j++) for (let k = 0; k < 8; k++) {
      const next = (k + 1) % 8, a = rings[j-1], b = rings[j];
      M.face(hull, [a[k], a[next], b[next], b[k]], tones[k], { emissive: 0.54 });
    }
    M.face(hull, rings[0].slice().reverse(), tones[0]); M.face(hull, rings[rings.length-1], tones[1]);
    parts.push(M.prism([[-0.9,0.24],[-0.34,0.25],[-0.68,0.51]], 0.07, "#70aebf", 0.46));
    for (const side of [-1,1]) {
      parts.push(box(0.62, 0.055, side * 0.436, 0.075, 0.065, 0.03, BLACK),
        M.moved(M.turnedX(M.prism([[-0.63,-0.73],[-0.22,-0.57],[0.39,-0.15],[0.16,-0.06]],0.07,"#a6d9df",0.53), -side * 0.42), 0, 0, side * 0.37));
      for (let k = 0; k < 4; k++) parts.push(M.beam(0.26+k*0.12,-0.36,side*0.22,0.86+k*0.085,-0.15,side*0.3,0.021,"#548fa6",0.42));
    }
    const flukes = [];
    for (const side of [-1, 1]) {
      const outline = [[0.13,0],[-0.17,0.45],[-0.53,0.76],[-0.44,0.32],[-0.23,0.06]].map(([x,y]) => [x,side*y]);
      if (side < 0) outline.reverse();
      flukes.push(M.turnedX(M.prism(outline, 0.095, "#78b6c8", 0.57), 1.06));
    }
    return { body: M.merge(...parts), tail: M.merge(...flukes) };
  };

  const gallery = lite => {
    const key = lite ? "gallery-lite" : "gallery";
    if (cache.has(key)) return cache.get(key);
    const n = lite ? 16 : 32;
    const plinth = turn([[0, 0], [2.3, 0], [2.3, 0.14], [1.98, 0.24], [1.86, 0.49], [1.78, 0.56], [0, 0.56]], BLACK, n);
    const bronze = BL.pokerBull.build(lite);
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
    const g = { tank: aquariumWall(lite), whale: humpback(), base, bronze, block, safe: BL.pokerIce.door(lite), channel };
    cache.set(key, g); return g;
  };
  const build = lite => {
    const g = gallery(lite), root = S.createNode(), packets = [], count = lite ? 24 : 72;
    child(root, g.base);
    child(root, g.channel);
    const clock = BL.pokerHourglass.build(lite);
    S.addChild(root, clock.root);
    const bronze = child(root, g.bronze, 0, 0.56, 0);
    bronze.scale.x = bronze.scale.z = 1.04;
    bronze.scale.y = 1.10;
    bronze.rotation.y = -0.72;
    const vaultDoor = child(root, g.safe, 0, 0, -35.8);
    const tank = child(root, g.tank, 10, 3.01, -36.19);
    // Compress the swimming circuit in depth to keep both animals inside the recessed window at the turns.
    const school = S.createNode({ position: { x: 0, y: 0, z: 0.52 } });
    S.addChild(tank, school); school.scale.z = 0.21;
    const whales = [child(school, g.whale.body), child(school, g.whale.body)];
    const flukes = whales.map(n => child(n, g.whale.tail, -1.42, 0.14, 0));
    whales[1].scale.x = whales[1].scale.y = whales[1].scale.z = 0.66;

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
        n.position.x = 3.65 * Math.sin(angle); n.position.y = 0.5 - i * 0.82 + 0.12 * Math.sin(angle * 2);
        n.position.z = 0.24 * Math.cos(angle);
        n.rotation.y = Math.atan2(0.37 * Math.sin(angle), Math.cos(angle));
        n.rotation.z = 0.055 * Math.sin(angle * 2);
        flukes[i].rotation.z = 0.31 * Math.sin(time * 1.3 + i * 2);
      }
      const now = Date.now();
      const fresh = chain.socketAt > 0 && now - chain.socketAt < 90000;
      drift = (drift + dt * (fresh ? 1 + chain.gale * 2 : 0.65)) % 61;
      for (let i = 0; i < count; i++) {
        const p = packets[i], z = 27 - (drift + 61 * p.phase) % 61;
        const split = Math.max(0, 1 - z * z / 28);
        p.n.position.x = p.lane + Math.sign(p.lane) * 2.7 * split;
        p.n.position.z = z; p.n.position.y = 0.055;
      }
    };
    update(0, 0);
    const dispose = () => { while (root.children.length) S.removeChild(root, root.children[root.children.length - 1]); };
    return { root, clock, vaultDoor, update, dispose };
  };
  BL.pokerHall = Object.freeze({ build, hangMoon });
})();
