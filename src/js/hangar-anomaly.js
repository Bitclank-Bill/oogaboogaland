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
// The phantom revs (`phantom`): no lights, no arcs, only the two engines revving by turns, back and forth as if they
// were talking, each throat glowing as it revs and the Jet rocking toward it on its gear and shuddering, then still.
// Their sound is `hangarAudio.revs`, each engine on its own side.
//
// Lightning through the Jet (`lightning`): blue arcs gather at its nose and crawl over it to the tail, the hall browning
// out and the runway's marker lamps running the wrong way (`rabbit`), its gold trim and canopy lighting up as they go
// (the Jet's lit mesh, `jetModels.jet(stage, true)`, swapped in for it); then one crack and a flash, and it's over,
// Kortik's Sis zapped if she stands near it (`sis.zap`). Its sound is `hangarAudio.zap`.

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
  // The phantom revs, s from their start: the script, each rev [start, engine (0 the left, 1 the right), length, how
  // hard], the two answering each other faster and harder until the right has the last word but one; the end. How hot a
  // throat glows at a full rev, how far the Jet leans toward the engine revving, radians, and how hard it shudders.
  const REVS = {
    script: [[0.5, 0, 1.2, 0.5], [2, 1, 1.3, 0.55], [3.6, 0, 0.8, 0.6], [4.4, 0, 0.8, 0.7], [5.5, 1, 0.8, 0.65], [6.3, 1, 0.8, 0.75],
      [7.1, 1, 1, 0.85], [8.4, 0, 1.5, 0.9], [10.2, 1, 1.8, 1], [12.3, 0, 0.6, 0.4]],
    end: 13.6, heat: 0.55, lean: 0.003, shudder: 0.0015
  };
  // How much of a rev it takes to spool up to its peak (the sound's `REV_UP`).
  const SPOOL = 0.45;
  // Lightning through the Jet, s from its start: its arcs gathering at the nose, then crawling to the tail over `crawl`
  // from `start`, `arcs` a second, each `life` long and `size` times a nozzle's, struck over the Jet's top and down its
  // flanks within `spread` of the front (a flank no more than `FLANK` columns out from its middle); the crack,
  // and the end. How far the hall browns out, over `fade`, and comes back, over `back`; how fast the runway's marker
  // lamps' pulse runs the wrong way, m/s, from `rabbit[0]`; how bright the gold trim burns (the lit mesh's glow, from the
  // plain mesh's glass to full); and the crack's flash, how long it lasts and its light.
  const ZAP = { start: 0.6, crawl: 4, crack: 5.6, end: 7.2, arcs: 16, life: 0.14, size: 1.7, spread: 1.6, dim: 0.5, fade: 0.8, back: 0.6, rabbit: [0.5, 45], glow: [0.22, 1], flash: 0.25, light: [2.4, 2.8, 3.6] };
  const LENGTH = { misfire: MISFIRE.end, phantom: REVS.end, lightning: ZAP.end };
  // How much of the lights' dimming the hall's own light takes.
  const AMBIENT = 0.5;
  // The arcs: how many at once and how long each lasts, s; where they strike round a nozzle, from how far inside its rim
  // to how far out of it, and from how far into it to how far out behind its exit, m; their light, and the hot throats'.
  const FLANK = 7, ARCS = 8, ARC_LIFE = 0.1, ARC_R = [0.6, 1.15], ARC_Z = [-0.4, 0.5], ARC_LIGHT = [0.5, 0.95, 1.8], HEAT_LIGHT = [1.4, 0.5, 0.18];
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
  // holds it off; `sis`: Kortik's Sis; `fx`: the scene's particles; `audio`: the hangar's sound; `jet`: the Jet's node,
  // which the revs rock and put back at rest; `stage`, the stage it shows; `auto`: whether they come by themselves (off
  // on a test page, where only `debug.play` starts one); `gap`, a fixed wait between them instead of GAP's, s.
  const create = ({ root, fire, sis, fx, audio, jet, stage, auto = true, gap = null }) => {
    const SPARK = HM.blast().spark, BLUE = BL.models.particleGeometry("#a8ecff", 0.05, 1), J = jet.position;
    const exits = JM.EXHAUST.map((e) => ({ x: J.x + e.x, y: e.y, z: J.z + e.z, r: e.r }));
    // Where Kortik's Sis turns to: between the engines. How the Jet stands at rest. Each throat's glow, in the nozzles'
    // order, for `fire.engines` and the lights.
    const engines = { x: J.x, z: exits[0].z }, REST_X = jet.rotation.x, REST_Z = jet.rotation.z, glow = new Float32Array(exits.length);
    // The Jet's plain and lit meshes; its cells seen from above, where the lightning runs over it, from nose to tail; and
    // the runway the marker lamps light along.
    const plain = jet.geometry, lit = JM.jet(stage, true), C = JM.columns(stage), nose = J.z + C.k0 * C.U, tail = J.z + (C.k0 + C.nk) * C.U, RUNWAY = HM.LAYOUT.runway;
    const arcs = Array.from({ length: ARCS }, (_, i) => ({ node: createNode({ geometry: bolts()[i % 3], visible: false, sightHidden: true }), life: 0, len: ARC_LIFE }));
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
    // throats are, and the hall's own light; when the next arc strikes; whether Kortik's Sis has jumped yet; where the marker lamps' wrong-way pulse
    // is (null while they run their own way); and the crack's flash.
    let wait = pause(), kind = null, t = 0, dim = 1, ambient = 1, heat = 0, arcAt = 0, spooked = false, rabbit = null, flash = 0;
    // The static fire test running, or not long done.
    const held = () => fire.t >= 0 && fire.t < fire.AT.result + AFTER_FIRE;

    // An arc striking at (x, y, z) for `life`, `size` times as long, turned any way, blue sparks off it: the arc that has
    // least left.
    const arc = (x, y, z, life, size = 1) => {
      let a = arcs[0];
      for (let i = 1; i < arcs.length; i++) if (arcs[i].life < a.life) a = arcs[i];
      const n = a.node;
      n.position.x = x; n.position.y = y; n.position.z = z;
      n.scale.x = n.scale.y = n.scale.z = size;
      n.rotation.x = Math.random() * Math.PI * 2; n.rotation.y = Math.random() * Math.PI * 2; n.rotation.z = Math.random() * Math.PI * 2;
      n.visible = true;
      a.life = a.len = life;
      for (let i = 0; i < 3; i++) fx.spawnParticle(BLUE, x, y, z, (Math.random() - 0.5) * 3, Math.random() * 2, (Math.random() - 0.5) * 3, 0.3 + Math.random() * 0.3, 10, 6);
    };
    // An arc round a nozzle's rim.
    const strike = () => {
      const e = exits[Math.floor(Math.random() * exits.length)], turn = Math.random() * Math.PI * 2, r = e.r * (ARC_R[0] + Math.random() * (ARC_R[1] - ARC_R[0]));
      arc(e.x + Math.cos(turn) * r, e.y + Math.sin(turn) * r, e.z + ARC_Z[0] + Math.random() * (ARC_Z[1] - ARC_Z[0]), ARC_LIFE);
    };
    // A point on top of the Jet over (x, z), from its columns, into SURF; whether there is one.
    const SURF = { x: 0, y: 0, z: 0 };
    const onJet = (x, z) => {
      const i = Math.floor((x - J.x) / C.U) - C.i0, k = Math.floor((z - J.z) / C.U) - C.k0;
      if (i < 0 || k < 0 || i >= C.ni || k >= C.nk) return false;
      const top = C.top[i * C.nk + k];
      if (top <= 0) return false;
      SURF.x = x; SURF.y = top + 0.05; SURF.z = z;
      return true;
    };
    // A point on the Jet's flank at z, out at the `side` (-1, 1) edge of its body there and somewhere up it, into SURF;
    // whether there is one.
    const onFlank = (z, side) => {
      const k = Math.floor((z - J.z) / C.U) - C.k0, mid = -C.i0;
      if (k < 0 || k >= C.nk) return false;
      let edge = -1;
      for (let d = 0; d < FLANK; d++) {
        const i = mid + side * d;
        if (i < 0 || i >= C.ni || C.top[i * C.nk + k] <= 0) break;
        edge = i;
      }
      if (edge < 0) return false;
      const lo = C.bottom[edge * C.nk + k], hi = C.top[edge * C.nk + k];
      SURF.x = J.x + (edge + C.i0 + (side > 0 ? 1 : 0)) * C.U + side * 0.1; SURF.y = lo + Math.random() * (hi - lo); SURF.z = z;
      return true;
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
      glow.fill(h);
      fire.engines(thrust, h);
      // The lights: dimming over the first seconds and wavering slowly, dipping as each try pulls, back once it is cut.
      dim = t < M.cut ? 1 - (1 - M.dim) * ease(t / M.fade) - M.dip * pull + 0.03 * Math.sin(t * 8.2) * ease(t / M.fade) : M.dim + (1 - M.dim) * ease((t - M.cut) / M.back);
      // The arcs, a few before the tries and more through them, none once it is cut; a wisp of smoke after.
      const rate = t < M.tries[0] ? M.arcs[0] : t < M.cut ? M.arcs[1] : 0;
      if (rate && (arcAt -= dt) <= 0) { arcAt = (0.5 + Math.random()) / rate; strike(); }
      if (t >= M.cut + 0.3 && t - dt < M.cut + 0.3) for (const e of exits) fx.puff(e.x, e.y, e.z + 0.3, 0, 0.5, 0.4, 1.2);
      // Kortik's Sis, at the first try, and told once the engines have died.
      if (!spooked && t >= M.tries[0]) { spooked = true; sis.spook(engines.x, engines.z); }
      if (t >= M.cut && t - dt < M.cut) sis.settle();
    };

    // A frame of the phantom revs.
    const phantom = (dt) => {
      const R = REVS;
      // How hard each engine revs now: spooling up to its rev's peak over `SPOOL` of it, running down over the rest.
      glow.fill(0);
      for (let i = 0; i < R.script.length; i++) {
        const r = R.script[i], u = (t - r[0]) / r[2];
        if (u > 0 && u < 1) glow[r[1]] = Math.max(glow[r[1]], r[3] * (u < SPOOL ? ease(u / SPOOL) : 1 - ease((u - SPOOL) / (1 - SPOOL))));
      }
      const left = glow[0], right = glow[1];
      jet.rotation.z = REST_Z + R.lean * (left - right) + R.shudder * (left + right) * Math.sin(t * 43);
      jet.rotation.x = REST_X + R.shudder * 0.6 * (left + right) * Math.cos(t * 37);
      for (let i = 0; i < glow.length; i++) glow[i] *= R.heat;
      heat = Math.max(glow[0], glow[1]);
      fire.engines(0, 1, glow);
      // Kortik's Sis, at the first rev, and told once the last has died.
      if (!spooked && t >= R.script[0][0]) { spooked = true; sis.spook(engines.x, engines.z); }
      const quiet = R.script[R.script.length - 1][0] + R.script[R.script.length - 1][2];
      if (t >= quiet && t - dt < quiet) sis.settle();
    };

    // A frame of the lightning.
    const lightning = (dt) => {
      const Z = ZAP, u = ease((t - Z.start) / Z.crawl), front = nose + (tail - nose) * u;
      // Arcs round the front, over its top as wide as the wings or down a flank, tried until one lands on the Jet.
      if (t < Z.crack && (arcAt -= dt) <= 0) {
        arcAt = (0.5 + Math.random()) / Z.arcs;
        for (let n = 0; n < 4; n++) {
          const z = front + (Math.random() - 0.5) * 2 * Z.spread;
          if (n % 2 ? onFlank(z, Math.random() < 0.5 ? -1 : 1) : onJet(J.x + (Math.random() - 0.5) * JM.SIZE.span, z)) { arc(SURF.x, SURF.y, SURF.z, Z.life, Z.size); break; }
        }
      }
      // The gold trim and the glass lighting up as the arcs go over, flickering a little; the hall browning out; the
      // marker lamps running the wrong way.
      jet.glow = t < Z.crack ? (Z.glow[0] + (Z.glow[1] - Z.glow[0]) * u) * (0.9 + 0.1 * Math.sin(t * 9)) : 1;
      dim = t < Z.crack ? 1 - (1 - Z.dim) * ease(t / Z.fade) + 0.04 * Math.sin(t * 6) * ease(t / Z.fade) : Z.dim + (1 - Z.dim) * ease((t - Z.crack) / Z.back);
      rabbit = t >= Z.rabbit[0] && t < Z.crack ? RUNWAY.z1 + ((t - Z.rabbit[0]) * Z.rabbit[1]) % (RUNWAY.z0 - RUNWAY.z1) : null;
      // The crack: the flash, the arcs gone, the Jet plain again, Kortik's Sis zapped if she is near and told it's over.
      if (t >= Z.crack && t - dt < Z.crack) {
        jet.geometry = plain;
        for (const a of arcs) { a.life = 0; a.node.visible = false; }
        sis.zap(J.x, nose, tail);
        sis.settle();
        BL.gamepad.rumble(0.4, 0.6, 200);
      }
      flash = t >= Z.crack ? Math.max(0, 1 - (t - Z.crack) / Z.flash) : 0;
      // Kortik's Sis, as it starts.
      if (!spooked && t >= Z.start / 2) { spooked = true; sis.spook(J.x, (nose + tail) / 2); }
    };

    const begin = (k) => {
      kind = k; t = 0; arcAt = 0; spooked = false;
      if (k === "misfire") audio.misfire(MISFIRE);
      else if (k === "phantom") audio.revs(REVS.script);
      else if (k === "lightning") {
        jet.geometry = lit;
        jet.glow = ZAP.glow[0];
        audio.zap(ZAP, { x: J.x, y: 5, z: nose }, { x: J.x, y: 5, z: tail });
      }
    };
    // Over, or cut short: the engines cold, the Jet at rest, the lights full, the arcs gone, and the wait for the next.
    const end = () => {
      kind = null; dim = 1; ambient = 1; heat = 0;
      glow.fill(0);
      jet.rotation.x = REST_X; jet.rotation.z = REST_Z;
      jet.geometry = plain; jet.glow = 1; rabbit = null; flash = 0;
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
      else if (kind === "phantom") phantom(dt);
      else lightning(dt);
      ambient = 1 - (1 - dim) * AMBIENT;
      if (t >= LENGTH[kind]) end();
    };

    // Its lights into the scene's array from `slot`: each throat's glow while it is hot, an arc's flash while one
    // strikes, and the crack's; how many it wrote.
    const put = (Lt, slot, x, y, z, radius, rgb, k) => {
      const w = slot * 8;
      Lt[w] = x; Lt[w + 1] = y; Lt[w + 2] = z; Lt[w + 3] = radius;
      Lt[w + 4] = rgb[0] * k; Lt[w + 5] = rgb[1] * k; Lt[w + 6] = rgb[2] * k; Lt[w + 7] = 0;
    };
    const lights = (Lt, slot) => {
      let n = 0;
      for (let i = 0; i < exits.length; i++) if (glow[i] > 0.02) put(Lt, slot + n++, exits[i].x, exits[i].y, exits[i].z + 1.2, 8, HEAT_LIGHT, glow[i]);
      let striking = null;
      for (const a of arcs) if (a.life > 0) { striking = a; break; }
      if (striking) { const p = striking.node.position; put(Lt, slot + n++, p.x, p.y, p.z, 6, ARC_LIGHT, striking.life / striking.len); }
      if (flash > 0) put(Lt, slot + n++, J.x, 7, J.z, 30, ZAP.light, flash * flash);
      return n;
    };

    // For debugging: play one now (unless one plays or the static fire holds them off), and where things stand.
    const debug = {
      play: (k = "misfire") => { if (kind || held() || !LENGTH[k]) return false; begin(k); return true; },
      get kind() { return kind; }, get t() { return t; }, get wait() { return wait; }, get dim() { return dim; }, get heat() { return heat; }
    };
    // Leaving mid-anomaly: the engines cold, the Jet plain and at rest, and the lights full; the arcs go with the scene's
    // root.
    const dispose = () => { if (kind) end(); };
    // The Jet's lit mesh, kept on the GPU off the graph, so the lightning swaps it in without a hitch.
    const liveGeometry = (set) => { set.add(lit); };
    return { update, lights, liveGeometry, dispose, debug, get playing() { return !!kind; }, get dim() { return dim; }, get ambient() { return ambient; }, get rabbit() { return rabbit; } };
  };

  BL.hangarAnomaly = { create, MISFIRE, REVS, ZAP };
})();
