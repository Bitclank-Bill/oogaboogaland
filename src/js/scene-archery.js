// Bow & Bone: the archery cabinet's scene. The range is stood up on the island's own ground, and the flight,
// the wind and the scoring all belong to `archery-sim.js` — this file only places the range, hands the
// simulation the keys and writes the result back onto the nodes. Nothing in `update` allocates: the butts,
// the arrows and the Legion are pools built once in `enter`, shown and hidden as the simulation needs them.
//
// Three rounds share one arrow. The sim owns which round is running and when it ends; the scene owns nothing
// but what it looks like. Sound and the scoreboard are deliberately absent from this pass: both hang off host
// modules whose contracts want reading first, and a silent, scoreless range still proves the flight.
(() => {
  "use strict";
  const BL = window.BL = window.BL || {};
  const { createNode, addChild } = BL.scene;
  const { createCamera } = BL.scene;
  const { box } = BL.models;
  const { butt, arrow, legionnaire } = BL.archeryModels;
  const SIM = BL.archerySim;

  // The simulation works on a 480x270 sheet with the archer at (66, 204) and the ground at 230. The range is
  // that sheet stood upright: x runs right from the archer, y runs up from the ground, z is the butt line.
  const SCALE = 0.02;
  const FLOOR = "#7A6A4F";
  const TREELINE = "#2F4A38";
  const toX = (x) => (x - SIM.ARCHER_X) * SCALE;
  const toY = (y) => (SIM.GROUND_Y - y) * SCALE;

  let root = null;
  let camera = null;
  let sim = null;
  let paused = false;
  let input = null;
  let host = null;
  let aimUp = false;
  let aimDown = false;
  const targetNodes = [];
  const arrowNodes = [];
  const enemyNodes = [];

  const sync = () => {
    const targetsOn = sim.mode !== "defense";
    for (let i = 0; i < SIM.TARGET_CAP; i++) {
      const t = sim.targets[i], node = targetNodes[i];
      node.visible = targetsOn;
      if (!targetsOn) continue;
      node.position.x = toX(t.x);
      node.position.y = toY(t.y);
      const s = t.r * SCALE;
      node.scale.x = s;
      node.scale.y = s;
      node.scale.z = s;
    }
    for (let i = 0; i < SIM.ARROW_CAP; i++) {
      const a = sim.arrows[i], node = arrowNodes[i];
      node.visible = a.active || a.stuck;
      if (!node.visible) continue;
      node.position.x = toX(a.x);
      node.position.y = toY(a.y);
      // The model's tip sits at its origin along -x, so the shot's own heading turns it.
      node.rotation.z = Math.atan2(-a.vy, a.vx);
    }
    for (let i = 0; i < SIM.ENEMY_CAP; i++) {
      const e = sim.enemies[i], node = enemyNodes[i];
      node.visible = !!e.active;
      if (!node.visible) continue;
      node.position.x = toX(e.x);
      node.position.y = 0;
    }
  };

  const startRound = (mode) => {
    SIM.setMode(sim, mode);
    SIM.start(sim);
    paused = false;
    sync();
  };

  const enter = (ctx) => {
    host = ctx;
    root = createNode();
    camera = createCamera({ fov: 50, near: 0.1, far: 80 });
    camera.position.x = 3.4;
    camera.position.y = 2.1;
    camera.position.z = 7.4;
    camera.target.x = 4.1;
    camera.target.y = 1.5;
    camera.target.z = 0;

    addChild(root, createNode({ geometry: box({ w: 14, h: 0.3, d: 7, color: FLOOR }), position: { x: 3.6, y: -0.15, z: 0.6 } }));
    // A treeline behind the butts, so a shot that sails past has somewhere to go.
    for (let i = 0; i < 7; i++) {
      addChild(root, createNode({ geometry: box({ w: 1.5, h: 2 + (i % 3) * 0.6, d: 1, color: TREELINE }), position: { x: 1 + i * 1.6, y: 1.1 + (i % 3) * 0.3, z: -2.6 } }));
    }

    const buttGeo = butt();
    for (let i = 0; i < SIM.TARGET_CAP; i++) {
      const node = createNode({ geometry: buttGeo, visible: false });
      addChild(root, node);
      targetNodes.push(node);
    }
    const arrowGeo = arrow();
    for (let i = 0; i < SIM.ARROW_CAP; i++) {
      const node = createNode({ geometry: arrowGeo, visible: false });
      addChild(root, node);
      arrowNodes.push(node);
    }
    const legionGeo = legionnaire();
    for (let i = 0; i < SIM.ENEMY_CAP; i++) {
      const node = createNode({ geometry: legionGeo, visible: false, scale: { x: 0.6, y: 0.6, z: 0.6 } });
      addChild(root, node);
      enemyNodes.push(node);
    }

    sim = SIM.create({ seed: 7, mode: "range" });
    SIM.reset(sim);
    sync();

    input = BL.interact.create({ canvas: ctx.canvas, renderer: ctx.renderer, camera, hooks: {} });
    // The director dispatches keydown only; the visit owns keyup and releases every held action on exit.
    window.addEventListener("keyup", handleKey, { signal: ctx.signal });
    window.addEventListener("blur", resetHeld, { signal: ctx.signal });
    document.addEventListener("visibilitychange", resetHeld, { signal: ctx.signal });
    scene.root = root;
    scene.camera = camera;
    scene.input = input;
  };

  const resetHeld = () => {
    aimUp = aimDown = false;
    if (sim) { sim.drawing = false; sim.power = sim.drawTime = 0; }
  };

  const handleKey = (e) => {
    if (!sim || e.metaKey || e.ctrlKey || e.altKey) return false;
    if (e.target && (e.target.isContentEditable || e.target.closest("input, textarea, select, dialog, .sheet"))) return false;
    const down = e.type === "keydown";
    if (down && (e.code === "Enter" || e.code === "Space") && e.target?.closest("button, a[href], summary")) return false;
    if (e.code === "Escape") {
      if (down && !e.repeat) { resetHeld(); host.go("arcade"); }
    } else if (e.code === "KeyP") {
      if (down && !e.repeat) { paused = !paused; resetHeld(); }
    } else if (e.code === "Enter") {
      if (down && !e.repeat) {
        if (paused) paused = false;
        else if (sim.status !== "playing") startRound(sim.mode);
      }
    } else if (e.code === "ArrowUp" || e.code === "KeyW") aimUp = down;
    else if (e.code === "ArrowDown" || e.code === "KeyS") aimDown = down;
    else if (e.code === "Space" || e.code === "KeyJ") {
      if (!paused) { if (down) SIM.beginDraw(sim); else SIM.release(sim); }
    } else return false;
    e.preventDefault();
    return true;
  };

  const update = (dt) => {
    if (!sim || paused) return;
    const dir = (aimDown ? 1 : 0) - (aimUp ? 1 : 0);
    if (dir) SIM.aim(sim, dir);
    SIM.step(sim, dt);
    sim.events.length = 0;
    sync();
  };

  const overlay = () => {};

  const leave = () => {
    aimUp = false;
    aimDown = false;
    paused = false;
    for (const node of targetNodes) node.visible = false;
    for (const node of arrowNodes) node.visible = false;
    for (const node of enemyNodes) node.visible = false;
    targetNodes.length = arrowNodes.length = enemyNodes.length = 0;
    input.dispose();
    input = host = sim = null;
    root = null;
    camera = null;
    scene.root = null;
    scene.camera = null;
    scene.input = null;
  };

  const scene = {
    id: "archery",
    padContext: "arcade",
    root: null,
    camera: null,
    input: null,
    debug: null,
    enter,
    update,
    overlay,
    leave,
    onKey: handleKey,
    controlsHelpHold: resetHeld,
    onDonation: (donation, counted = null) => {
      host.game.recordDonation(donation, counted && counted.exact);
      host.world.level = Math.min(BL.pile.MAX_BANANAS, host.world.level + (counted ? counted.exact : BL.game.bananasFor(donation.sats)));
    },
    // The range's own keys; the cabinet's page reads these for the controls dialog.
    controlsHelp: () => ({ title: "Bow & Bone", rows: [
      BL.controlsHelp.row(["arrowup", "arrowdown", "w", "s"], "Aim"),
      BL.controlsHelp.row([" ", "j"], "Hold to draw; release to loose"),
      BL.controlsHelp.row(["enter"], "Start / restart / resume"),
      BL.controlsHelp.row(["p"], "Pause"),
      BL.controlsHelp.row(["escape"], "Return to arcade"),
    ] }),
    start: startRound,
    stats: () => (sim ? { mode: sim.mode, status: sim.status, score: sim.score, hits: sim.hits, shots: sim.shots } : null),
  };

  BL.scenes = BL.scenes || {};
  BL.scenes.archery = scene;
})();
