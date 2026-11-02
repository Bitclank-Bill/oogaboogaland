// The Lightning Jet Hangar's engine anomalies: now and then, with nobody at the booth, the Jet acts up on its own. One
// at a time, at random, a minute to five apart (`GAP`, from the end of one to the start of the next), each kind taking
// its turn from a shuffled bag so none comes round again before the rest have played; never during the static fire
// test or for `AFTER_FIRE` seconds after it hands the controls back, and while one plays the test's button only buzzes
// no. Kortik's Sis jumps out of her skin at each (`sis.spook`).
//
// The failed start (`misfire`): the hangar's lights dim and an electrical hum rises, blue arcs crackling round the
// engines' nozzles; three tries at turning them over, the throats glowing hotter each time and dying in a sputter, the
// last coughing a short flame; then a dead stop, the lights back, the metal ticking as it cools. It drives the engines
// through the static fire's own (`fire.engines`), its sound is `hangarAudio.misfire`, and the scene dims its lights by
// `dim`.
//
// `create` builds the arcs once a visit; `update` runs the wait and the anomaly, allocating nothing a frame.
(() => {
  "use strict";
  const BL = window.BL = window.BL || {};
  const { createNode, addChild } = BL.scene;
  const HM = BL.hangarModels, JM = BL.jetModels;

  // From the end of one anomaly to the start of the next, s, at random between; and how long after the static fire test
  // hands its controls back before one may start.
  const GAP = [60, 300], AFTER_FIRE = 10;
  // The failed start, s from its start: the three tries, each turning over for `spin` and sputtering out for `sputter`,
  // the throats as hot as `heat` at each try's peak and glowing on a little for `embers` after; the last try's burst
  // `burp` into it, `burpLen` long at `thrust`; the cut, and the end. How far the lights dim (`dim`, after `fade`), and
  // further as each try pulls (`dip`), coming back over `back` once it is cut; and how many arcs a second crackle before
  // the tries and through them.
  const MISFIRE = { tries: [2.6, 5.4, 8.4], spin: 1.3, sputter: 0.7, embers: 0.6, heat: [0.4, 0.6, 0.85], burp: 1.2, burpLen: 0.25, thrust: 0.3, cut: 10.6, end: 14, dim: 0.6, fade: 1.5, dip: 0.15, back: 0.6, arcs: [1.2, 3] };
  const LENGTH = { misfire: MISFIRE.end };
  // The arcs: how many at once and how long each lasts, s; where they strike round a nozzle, from how far inside its rim
  // to how far out of it, and from how far into it to how far out behind its exit, m; their light, and the hot throats'.
  const ARCS = 4, ARC_LIFE = 0.1, ARC_R = [0.6, 1.15], ARC_Z = [-0.4, 0.5], ARC_LIGHT = [0.5, 0.95, 1.8], HEAT_LIGHT = [1.4, 0.5, 0.18];
  const ease = (u) => u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u);

  // A crackle of lightning a metre long along x, zigzagging, with a fork off it: three shapes, drawn once.
  const bolts = BL.models.cached(() => [0, 1, 2].map((n) => {
    const { beam, merge } = BL.models, rand = BL.math.mulberry32(0xa4c + n), parts = [];
    let x = -0.5, y = 0, z = 0;
    for (let i = 0; i < 6; i++) {
      const nx = x + 1 / 6, ny = i === 5 ? 0 : (rand() - 0.5) * 0.24, nz = i === 5 ? 0 : (rand() - 0.5) * 0.24;
      parts.push(beam(x, y, z, nx, ny, nz, 0.035, "#cdf3ff", 1));
      if (i === 2) parts.push(beam(nx, ny, nz, nx + 0.22, ny + (rand() - 0.5) * 0.3, nz + 0.18, 0.022, "#9fe4ff", 1));
      x = nx; y = ny; z = nz;
    }
    const geo = merge(...parts);
    geo.castShadow = false;
    return geo;
  }));

  // `root`: the scene's root; `fire`: the static fire test (`hangar-fire.js`), whose engines it drives and whose run
  // holds it off; `sis`: Kortik's Sis; `fx`: the scene's particles; `audio`: the hangar's sound; `jet`: where the Jet
  // stands, { x, z }; `auto`: whether they come by themselves (off on a test page, where only `debug.play` starts one);
  // `gap`, a fixed wait between them instead of GAP's, s.
  const create = ({ root, fire, sis, fx, audio, jet, auto = true, gap = null }) => {
    const SPARK = HM.blast().spark, BLUE = BL.models.particleGeometry("#a8ecff", 0.05, 1);
    const exits = JM.EXHAUST.map((e) => ({ x: jet.x + e.x, y: e.y, z: jet.z + e.z, r: e.r }));
    // Where Kortik's Sis turns to: between the engines.
    const engines = { x: jet.x, z: exits[0].z };
    const arcs = Array.from({ length: ARCS }, (_, i) => ({ node: createNode({ geometry: bolts()[i % 3], visible: false, sightHidden: true }), life: 0 }));
    addChild(root, ...arcs.map((a) => a.node));
    // The kinds in their turn: a bag shuffled in place each time it runs out.
    const bag = Object.keys(LENGTH);
    let left = 0;
    const next = () => {
      if (left === 0) {
        for (let i = bag.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)), s = bag[i]; bag[i] = bag[j]; bag[j] = s; }
        left = bag.length;
      }
      return bag[--left];
    };
    const pause = () => gap !== null ? gap : GAP[0] + Math.random() * (GAP[1] - GAP[0]);
    // The wait for the next; the one playing and how far in; how far the lights are dimmed (1 full) and how hot the
    // throats are; when the next arc strikes; and whether Kortik's Sis has jumped yet.
    let wait = pause(), kind = null, t = 0, dim = 1, heat = 0, arcAt = 0, spooked = false;
    // The static fire test running, or not long done.
    const held = () => fire.t >= 0 && fire.t < fire.AT.result + AFTER_FIRE;

    // An arc striking round a nozzle's rim, turned any way, blue sparks off it: the arc that has least left.
    const strike = () => {
      let a = arcs[0];
      for (let i = 1; i < arcs.length; i++) if (arcs[i].life < a.life) a = arcs[i];
      const e = exits[Math.floor(Math.random() * exits.length)], turn = Math.random() * Math.PI * 2;
      const r = e.r * (ARC_R[0] + Math.random() * (ARC_R[1] - ARC_R[0])), n = a.node;
      n.position.x = e.x + Math.cos(turn) * r; n.position.y = e.y + Math.sin(turn) * r; n.position.z = e.z + ARC_Z[0] + Math.random() * (ARC_Z[1] - ARC_Z[0]);
      n.rotation.x = Math.random() * Math.PI * 2; n.rotation.y = Math.random() * Math.PI * 2; n.rotation.z = Math.random() * Math.PI * 2;
      n.visible = true;
      a.life = ARC_LIFE;
      for (let i = 0; i < 3; i++) fx.spawnParticle(BLUE, n.position.x, n.position.y, n.position.z, (Math.random() - 0.5) * 3, Math.random() * 2, (Math.random() - 0.5) * 3, 0.3 + Math.random() * 0.3, 10, 6);
    };

    // A frame of the failed start.
    const misfire = (dt) => {
      const M = MISFIRE, last = M.tries.length - 1;
      // The throats: hotter through each try's turning over, falling away through its sputter, glowing on a moment;
      // and how hard the try pulls on the lights.
      let h = 0, pull = 0;
      for (let i = 0; i < M.tries.length; i++) {
        const u = t - M.tries[i];
        if (u < 0 || u > M.spin + M.sputter + M.embers) continue;
        if (u < M.spin) { pull = ease(u / M.spin); h = M.heat[i] * pull; }
        else if (u < M.spin + M.sputter) { const v = (u - M.spin) / M.sputter; pull = 1 - v; h = M.heat[i] * (1 - v * 0.7) * (0.75 + 0.25 * Math.sin(t * 31)); }
        else h = M.heat[i] * 0.3 * (1 - (u - M.spin - M.sputter) / M.embers);
      }
      if (t >= M.cut) h = 0;
      // The last try's burst: a short flame and its sparks and smoke, the pad thumping.
      const b = t - M.tries[last] - M.burp;
      const thrust = b >= 0 && b < M.burpLen ? M.thrust * Math.sin(b / M.burpLen * Math.PI) : 0;
      if (b >= 0 && b - dt < 0) {
        for (const e of exits) {
          for (let i = 0; i < 8; i++) fx.spawnParticle(SPARK, e.x, e.y, e.z, (Math.random() - 0.5) * 3, (Math.random() - 0.2) * 3, 3 + Math.random() * 5, 0.5 + Math.random() * 0.4, 10, 6);
          fx.puff(e.x, e.y, e.z + 0.6, 0, 0.4, 1.2, 1.6);
        }
        BL.gamepad.rumble(0.2, 0.4, 160);
      }
      heat = h;
      fire.engines(thrust, h);
      // The lights: dimming over the first seconds and wavering slowly, dipping as each try pulls, back once it is cut.
      dim = t < M.cut ? 1 - (1 - M.dim) * ease(t / M.fade) - M.dip * pull + 0.03 * Math.sin(t * 8.2) * ease(t / M.fade) : M.dim + (1 - M.dim) * ease((t - M.cut) / M.back);
      // The arcs, a few before the tries and more through them, none once it is cut; a wisp of smoke after.
      const rate = t < M.tries[0] ? M.arcs[0] : t < M.cut ? M.arcs[1] : 0;
      if (rate && (arcAt -= dt) <= 0) { arcAt = (0.5 + Math.random()) / rate; strike(); }
      if (t >= M.cut + 0.3 && t - dt < M.cut + 0.3) for (const e of exits) fx.puff(e.x, e.y, e.z + 0.3, 0, 0.5, 0.4, 1.2);
      // Kortik's Sis, at the first try.
      if (!spooked && t >= M.tries[0]) { spooked = true; sis.spook(engines.x, engines.z); }
    };

    const begin = (k) => {
      kind = k; t = 0; arcAt = 0; spooked = false;
      if (k === "misfire") audio.misfire(MISFIRE);
    };
    // Over, or cut short: the engines cold, the lights full, the arcs gone, and the wait for the next.
    const end = () => {
      kind = null; dim = 1; heat = 0;
      fire.engines(0, 0);
      for (const a of arcs) { a.life = 0; a.node.visible = false; }
      wait = pause();
    };
    // Once a frame, before the static fire test's own.
    const update = (dt) => {
      for (const a of arcs) if (a.life > 0 && (a.life -= dt) <= 0) a.node.visible = false;
      if (!kind) {
        if (auto && (wait -= dt) <= 0 && !held()) begin(next());
        return;
      }
      t += dt;
      if (kind === "misfire") misfire(dt);
      if (t >= LENGTH[kind]) end();
    };

    // Its lights into the scene's array from `slot`: the throats' glow while they are hot and an arc's flash while one
    // strikes; how many it wrote.
    const put = (Lt, slot, x, y, z, radius, rgb, k) => {
      const w = slot * 8;
      Lt[w] = x; Lt[w + 1] = y; Lt[w + 2] = z; Lt[w + 3] = radius;
      Lt[w + 4] = rgb[0] * k; Lt[w + 5] = rgb[1] * k; Lt[w + 6] = rgb[2] * k; Lt[w + 7] = 0;
    };
    const lights = (Lt, slot) => {
      let n = 0;
      if (heat > 0.02) for (const e of exits) put(Lt, slot + n++, e.x, e.y, e.z + 1.2, 8, HEAT_LIGHT, heat);
      let lit = null;
      for (const a of arcs) if (a.life > 0) { lit = a; break; }
      if (lit) { const p = lit.node.position; put(Lt, slot + n++, p.x, p.y, p.z, 6, ARC_LIGHT, lit.life / ARC_LIFE); }
      return n;
    };

    // For debugging: play one now (unless one plays or the static fire holds them off), and where things stand.
    const debug = {
      play: (k = "misfire") => { if (kind || held() || !LENGTH[k]) return false; begin(k); return true; },
      get kind() { return kind; }, get t() { return t; }, get wait() { return wait; }, get dim() { return dim; }, get heat() { return heat; }
    };
    // Leaving mid-anomaly: the engines cold and the lights full; the arcs go with the scene's root.
    const dispose = () => { if (kind) end(); };
    return { update, lights, dispose, debug, get playing() { return !!kind; }, get dim() { return dim; } };
  };

  BL.hangarAnomaly = { create, MISFIRE };
})();
