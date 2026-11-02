// Genesis museum: the eras' "now showing" vignettes. At the end of each gallery's walk (past the moving walkway's
// end, before the headlines' wall) a little round stage waits under a spotlight; while a visitor is near, its players
// pop up now and then at random and act out a short scene in the spirit of the era's films, then bow out. Every scene
// is an original Ooga homage: chunky Ooga figures and props built here, no film's characters, costumes, names or
// marks. Nodes are built once; update writes rotations and scales in place (allocation-free).
(() => {
  "use strict";
  const BL = window.BL = window.BL || {};
  // Where a stage stands in its era's own coordinates: on the old stream's line, BACK metres from the gallery's back.
  const BACK = 3, R = 1.9, NEAR = 28, SHOW = [14, 20], REST = [8, 22];
  const SCENES = [
    { title: "THE ROBOT PAL", sub: "1950s science fiction: an original Ooga homage" },
    { title: "LIGHT-FLOOR HUSTLE", sub: "1970s dance films: an original Ooga homage" },
    { title: "NEON CLUB DUEL", sub: "early 1980s space adventures: an original Ooga homage" },
    { title: "GREEN SCREEN HACKER", sub: "1980s computer thrillers: an original Ooga homage" },
    { title: "SLOW-MOTION BANANA DODGE", sub: "late 1990s action films: an original Ooga homage" },
    { title: "FLIP-PHONE SNAP", sub: "early 2000s comedies: an original Ooga homage" },
    { title: "BOX OUT OF THE BANK", sub: "2008: the crisis on the evening news, an Ooga retelling" },
    { title: "SNOWED IN, FIRST BLOCK", sub: "January 2009: a cold week and a warm screen" }
  ];
  const spot = (museum, era) => ({ x: museum.LANE_X, z: era.z1 - museum.bays[era.n].depth + BACK });

  const build = ({ M, createNode, addChild, label, n, at, top, theme }) => {
    const root = createNode({ position: { x: at.x, y: top, z: at.z } });
    const node = (o) => createNode(o), add = (p, ...c) => { addChild(p, ...c); return c[0]; };
    const box = (w, h, d, color, x, y, z, emissive = 0) => node({ geometry: M.box({ w, h, d, color, emissive }), position: { x, y, z } });
    // The stage: a low round plinth with a lit rim, a backdrop flat and the title on a plaque in front.
    const rim = theme || "#f2c14e";
    add(root, node({ geometry: M.lathe({ profile: [[0, 0], [R, 0], [R, 0.22], [0, 0.22]], segments: 20, color: "#2c2a30" }), position: { x: 0, y: 0, z: 0 } }));
    add(root, node({ geometry: M.box({ w: R * 2 + 0.1, h: 0.05, d: 0.08, color: rim, emissive: 1 }), position: { x: 0, y: 0.2, z: R } }));
    add(root, box(R * 2.1, 2.6, 0.12, "#1b1d24", 0, 1.3, -R + 0.1));
    const l = label(SCENES[n].title, SCENES[n].sub, { height: 0.55, style: "gold" }), plaque = add(root, node({ position: { x: 0, y: 0.75, z: R + 0.35 } }));
    add(plaque, node({ geometry: l.back }), node({ geometry: l.face }));
    add(root, box(0.1, 0.5, 0.1, "#3b2a1a", 0, 0.25, R + 0.35));
    // A player: a chunky Ooga (torso, head with its brow and hair, arms and legs on pivots), `fur` its colour.
    const ooga = (fur, x, z, yaw = 0) => {
      const r = add(root, node({ position: { x, y: 0.22, z }, rotation: { x: 0, y: yaw, z: 0 }, scale: { x: 0.001, y: 0.001, z: 0.001 } }));
      const body = add(r, node({ position: { x: 0, y: 0.75, z: 0 } }));
      add(body, box(0.5, 0.6, 0.32, fur, 0, 0.15, 0));
      const head = add(body, node({ position: { x: 0, y: 0.62, z: 0 } }));
      add(head, box(0.4, 0.38, 0.36, "#c99a6e", 0, 0, 0), box(0.44, 0.12, 0.4, fur, 0, 0.2, 0), box(0.36, 0.06, 0.06, "#5a3a22", 0, 0.08, 0.19),
        box(0.06, 0.06, 0.02, "#1b1b1b", -0.09, 0.02, 0.19), box(0.06, 0.06, 0.02, "#1b1b1b", 0.09, 0.02, 0.19));
      const arm = (side) => { const p = add(body, node({ position: { x: side * 0.32, y: 0.38, z: 0 } })); add(p, box(0.14, 0.5, 0.14, fur, 0, -0.22, 0)); return p; };
      const leg = (side) => { const p = add(r, node({ position: { x: side * 0.13, y: 0.45, z: 0 } })); add(p, box(0.16, 0.46, 0.18, fur, 0, -0.22, 0)); return p; };
      return { r, body, head, armL: arm(-1), armR: arm(1), legL: leg(-1), legR: leg(1) };
    };
    // Each scene's players and props; `act(t)` poses them at scene time t (seconds since they appeared).
    const P = [], props = [];
    const prop = (geo, x, y, z, parent = root) => { const p = add(parent, node({ geometry: geo, position: { x, y, z }, scale: { x: 0.001, y: 0.001, z: 0.001 } })); props.push(p); return p; };
    let act = () => {};
    const sw = (t, k = 1) => Math.sin(t * k);
    if (n === 0) {
      const o = ooga("#7a5534", -0.6, 0.2, 0.4), bot = add(root, node({ position: { x: 0.7, y: 0.22, z: 0 }, rotation: { x: 0, y: -0.4, z: 0 }, scale: { x: 0.001, y: 0.001, z: 0.001 } }));
      add(bot, box(0.6, 0.7, 0.45, "#9aa7b4", 0, 0.75, 0), box(0.42, 0.34, 0.36, "#b7c2cc", 0, 1.3, 0), box(0.3, 0.08, 0.02, "#7fe8ff", 0, 1.32, 0.19, 1.4),
        box(0.18, 0.4, 0.2, "#7b8794", -0.15, 0.2, 0), box(0.18, 0.4, 0.2, "#7b8794", 0.15, 0.2, 0));
      const ant = add(bot, node({ position: { x: 0, y: 1.5, z: 0 } })); add(ant, box(0.03, 0.3, 0.03, "#cfd6dd", 0, 0.15, 0), box(0.09, 0.09, 0.09, "#ff5a4e", 0, 0.32, 0, 1.6));
      const saucer = prop(M.merge(M.box({ w: 0.7, h: 0.08, d: 0.7, color: "#b7c2cc" }), M.moved(M.box({ w: 0.3, h: 0.16, d: 0.3, color: "#7fe8ff", emissive: 1 }), 0, 0.1, 0)), 0, 2.2, -0.8);
      P.push(o, { r: bot });
      act = (t) => { o.armR.rotation.x = -1.4 + sw(t, 5) * 0.5; o.head.rotation.y = sw(t, 1.3) * 0.3; ant.rotation.y = t * 4; bot.rotation.z = sw(t, 3) * 0.06; saucer.position.y = 2.2 + sw(t, 1.7) * 0.15; saucer.rotation.y = t * 1.5; };
    } else if (n === 1) {
      const o = ooga("#c9762f", 0, 0.1), tiles = [];
      for (let i = 0; i < 9; i++) tiles.push(prop(M.box({ w: 0.9, h: 0.03, d: 0.9, color: ["#ff4fa3", "#ffd23f", "#4fd1ff"][i % 3], emissive: 1.2 }), (i % 3 - 1) * 0.95, 0.24, (Math.floor(i / 3) - 1) * 0.95));
      const ball = prop(M.box({ w: 0.36, h: 0.36, d: 0.36, color: "#e6e9ee", emissive: 0.8 }), 0, 2.4, -0.4);
      P.push(o);
      act = (t) => { o.armR.rotation.x = -2.6 + Math.max(0, sw(t, 4)) * 0.4; o.armR.rotation.z = -0.3; o.armL.rotation.x = 0.2; o.r.rotation.y = sw(t, 1) * 0.5; o.body.rotation.z = sw(t, 4) * 0.12;
        o.legL.rotation.x = sw(t, 8) * 0.3; o.legR.rotation.x = -sw(t, 8) * 0.3; ball.rotation.y = t * 2;
        for (let i = 0; i < 9; i++) tiles[i].glow = ((Math.floor(t * 4) + i) % 3 === 0) ? 1.6 : 0.4; };
    } else if (n === 2) {
      const a = ooga("#3d3f8a", -0.75, 0, 1.2), b = ooga("#8a2f2f", 0.75, 0, -1.2);
      const blade = (color, o) => { const club = add(o.armR, node({ position: { x: 0, y: -0.45, z: 0.05 } })); add(club, box(0.08, 0.2, 0.08, "#4c331d", 0, 0, 0), box(0.07, 0.9, 0.07, color, 0, 0.55, 0, 1.8)); return club; };
      blade("#7fe8ff", a); blade("#ff4f4f", b);
      P.push(a, b);
      act = (t) => { const s = sw(t, 3); a.armR.rotation.x = -1.2 + s * 0.8; b.armR.rotation.x = -1.2 - s * 0.8; a.r.position.x = -0.75 + Math.max(0, s) * 0.2; b.r.position.x = 0.75 - Math.max(0, -s) * 0.2;
        a.body.rotation.y = s * 0.2; b.body.rotation.y = -s * 0.2; };
    } else if (n === 3) {
      const o = ooga("#5b4a3a", 0, 0.5, Math.PI);
      prop(M.box({ w: 1.2, h: 0.08, d: 0.6, color: "#6d5a45" }), 0, 0.95, -0.2);
      prop(M.box({ w: 0.7, h: 0.55, d: 0.55, color: "#d8d2c0" }), 0, 1.3, -0.35);
      const lines = [];
      for (let i = 0; i < 5; i++) lines.push(prop(M.box({ w: 0.4, h: 0.04, d: 0.01, color: "#5cff7a", emissive: 1.8 }), 0, 1.15 + i * 0.08, -0.07));
      P.push(o);
      act = (t) => { o.armL.rotation.x = -1.1 + sw(t, 18) * 0.15; o.armR.rotation.x = -1.1 - sw(t, 18) * 0.15; o.head.rotation.x = 0.15;
        for (let i = 0; i < 5; i++) { const k = (i + Math.floor(t * 3)) % 5; lines[i].scale.x = 0.3 + ((k * 37) % 7) / 10; } };
    } else if (n === 4) {
      const o = ooga("#2a2a2e", 0, 0, 0), nanas = [];
      add(o.head, box(0.4, 0.08, 0.04, "#0b0b0d", 0, 0.03, 0.2));
      for (let i = 0; i < 3; i++) nanas.push(prop(M.box({ w: 0.3, h: 0.08, d: 0.1, color: "#ffd23f", emissive: 0.4 }), -1.6, 1.3 + i * 0.2, 0.3));
      P.push(o);
      act = (t) => { const lean = Math.min(1, t / 3) * 1.0; o.body.rotation.x = -lean; o.armL.rotation.z = 1.2 * Math.min(1, t / 2); o.armR.rotation.z = -1.2 * Math.min(1, t / 2);
        for (let i = 0; i < 3; i++) { const u = ((t * 0.35 + i / 3) % 1); nanas[i].position.x = -1.8 + u * 3.6; nanas[i].position.y = 1.25 + i * 0.18; nanas[i].rotation.z = u * 6; } };
    } else if (n === 5) {
      const o = ooga("#7c5b9a", 0, 0, 0), phone = add(o.armR, node({ position: { x: 0, y: -0.48, z: 0.08 } }));
      add(phone, box(0.12, 0.2, 0.04, "#3c4450", 0, 0, 0)); const lid = add(phone, node({ position: { x: 0, y: 0.1, z: 0 } })); add(lid, box(0.12, 0.18, 0.04, "#4d5868", 0, 0.09, 0));
      const flash = prop(M.box({ w: 0.12, h: 0.12, d: 0.02, color: "#ffffff", emissive: 3 }), 0, 0, 0, phone);
      P.push(o);
      act = (t) => { o.armR.rotation.x = -1.6; lid.rotation.x = Math.min(1, (t % 4) / 0.3) * 2.8 - 0; flash.scale.x = flash.scale.y = flash.scale.z = (t % 4) > 1.2 && (t % 4) < 1.4 ? 2 : 0.001; o.head.rotation.z = sw(t, 1.5) * 0.15; };
    } else if (n === 6) {
      const o = ooga("#4a5a6a", -0.3, 0.6, 0);
      prop(M.merge(M.box({ w: 3, h: 2.2, d: 0.2, color: "#cfc6b4" }), M.moved(M.box({ w: 3.2, h: 0.3, d: 0.4, color: "#b5ab98" }), 0, 1.2, 0), M.moved(M.box({ w: 0.9, h: 1.5, d: 0.22, color: "#2c2a30" }), -0.3, -0.35, 0.02),
        ...[-1.2, 0.6, 1.2].map((x) => M.moved(M.box({ w: 0.2, h: 1.9, d: 0.3, color: "#e2dccd" }), x, -0.1, 0.1))), 0, 1.32, -1.2);
      const crate = add(o.armL, node({ position: { x: 0.32, y: -0.45, z: 0.25 } })); add(crate, box(0.6, 0.4, 0.4, "#b08850", 0, 0, 0), box(0.12, 0.2, 0.04, "#2e7d4f", -0.1, 0.25, 0.05));
      P.push(o);
      act = (t) => { o.armL.rotation.x = -0.9; o.armR.rotation.x = -0.9; o.r.position.z = 0.6 + (t % 7) * 0.12; o.legL.rotation.x = sw(t, 5) * 0.35; o.legR.rotation.x = -sw(t, 5) * 0.35; o.head.rotation.x = 0.25; };
    } else {
      const o = ooga("#6b4a2e", 0.4, 0.3, -0.5), flakes = [];
      prop(M.merge(M.box({ w: 1.6, h: 1.1, d: 1.2, color: "#7a5534" }), M.moved(M.turnedZ(M.box({ w: 1.25, h: 0.08, d: 1.4, color: "#f1f4f7" }), 0.6), -0.38, 0.75, 0), M.moved(M.turnedZ(M.box({ w: 1.25, h: 0.08, d: 1.4, color: "#f1f4f7" }), -0.6), 0.38, 0.75, 0),
        M.moved(M.box({ w: 0.4, h: 0.3, d: 0.02, color: "#ffd88a", emissive: 1.4 }), 0, 0.05, 0.61)), -0.7, 0.77, -0.4);
      for (let i = 0; i < 16; i++) flakes.push(prop(M.box({ w: 0.05, h: 0.05, d: 0.05, color: "#ffffff", emissive: 0.6 }), ((i * 53) % 37) / 37 * 3.4 - 1.7, 2.4, ((i * 29) % 23) / 23 * 2.6 - 1.3));
      P.push(o);
      act = (t) => { o.armL.rotation.x = o.armR.rotation.x = -0.6; o.armL.rotation.z = 0.5; o.armR.rotation.z = -0.5; o.body.rotation.z = sw(t, 9) * 0.03;
        for (let i = 0; i < 16; i++) flakes[i].position.y = 2.4 - ((t * 0.5 + i * 0.137) % 1) * 2.2; };
    }
    // The show's clock: rests, then the players pop up (scale 0 to 1 over 0.4 s), play, and pop down again.
    const st = { phase: 0, t: 0, wait: REST[0], len: SHOW[0], shows: 0 };
    const sizeAll = (k) => { const s = Math.max(0.001, k); for (const p of P) p.r.scale.x = p.r.scale.y = p.r.scale.z = s; for (const p of props) p.scale.x = p.scale.y = p.scale.z = s; };
    const update = (dt, near, calm) => {
      if (st.phase === 0) { if (near) st.t += dt; if (st.t >= st.wait) { st.phase = 1; st.t = 0; st.len = SHOW[0] + Math.random() * (SHOW[1] - SHOW[0]); st.shows++; } sizeAll(0); return; }
      st.t += dt;
      const k = Math.min(1, st.t / 0.4, (st.len - st.t) / 0.4);
      sizeAll(k < 1 ? 1 - (1 - Math.max(0, k)) ** 2 : 1);
      act(calm ? 0 : st.t);
      if (st.t >= st.len) { st.phase = 0; st.t = 0; st.wait = REST[0] + Math.random() * (REST[1] - REST[0]); sizeAll(0); }
    };
    sizeAll(0);
    return { root, update, state: st, obstacle: { x0: at.x - R, x1: at.x + R, z0: at.z - R, z1: at.z + R + 0.5 } };
  };
  BL.genesisVignettes = { SCENES, spot, build, BACK, R, NEAR };
})();
