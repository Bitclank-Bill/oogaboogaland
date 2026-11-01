// Cloud Hopper's tornadoes, on Thunderhead (its sky's `tornado`). Now and then a spot in the storm ahead of the rider
// starts to turn (`FORM` seconds), a funnel lowers from it down through the course (`DROP`), drifts across the course
// while it lives (`LIVE`), then ropes out and draws back up into the sky (`FADE`). While it is down it writes the
// course's `whirl`, which turns the clouds near it round its axis, and `strength` says how hard it holds; the
// controller carries the Ooga round its outside. When each one forms keeps to the run's own seeded clock; where it
// forms follows the rider. It is a giant voxel tornado: a stack of stepped slabs, white at its flared cap through blue
// to deep blue at its curling tail, each slab turning and swaying at its own speed (one instanced draw for each band
// of colour), with streaks of spray whipped round it. Nothing allocates a frame.
(() => {
  "use strict";
  const BL = window.BL = window.BL || {};
  const { createNode, addChild, removeChild } = BL.scene;
  const M = BL.models, { mulberry32 } = BL.math;
  const TAU = Math.PI * 2, GOLDEN = 2.399963;
  // Phase lengths (s): the sky turning, the funnel lowering, the funnel down, and roping out.
  const FORM = 4.5, DROP = 2.5, LIVE = 9, FADE = 3;
  // The first tornado's wait from the start, and the wait from one dying to the next forming (s). However fast the
  // run, the first forms by the time the rider is `DUE[0]` of the way down the course and the second by `DUE[1]`
  // (once the first has gone), so every run sees at least two.
  const FIRST = [10, 16], BETWEEN = [12, 22], DUE = [0.1, 0.45];
  // Where one forms: this far ahead of the rider toward the finish and this far to one side (m), drifting back across
  // the course this fast (m/s). None forms within `CLEAR` of the finish.
  const AHEAD = [36, 46], SIDE = [4, 12], DRIFT = [1.4, 2.4], CLEAR = 70;
  // The funnel: its top this far over the rider's feet when it forms, how far it reaches down, its cap's radius, how
  // far its tail curls back from its drift (m), and how many slabs it stacks.
  const TOP = 30, LENGTH = 95, TOP_R = 14, CURL = 9, LAYERS = 60;
  // Its hold on the clouds (the course's `whirl`): how far it reaches past its own side, and the speed at its side.
  const REACH = 12, SPEED = 7;
  const IDLE = 0, FORMING = 1, DROPPING = 2, DOWN = 3, FADING = 4;
  const ease = (t) => { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); };
  // The funnel's radius a fraction `u` of the way down, as a share of its cap's: a flared cap, then a long taper to
  // its tail.
  const shape = (u) => u < 0.07 ? 0.82 + 0.18 * u / 0.07 : 0.1 + 0.9 * ((1 - u) / 0.93) ** 1.6;
  // Its colour from the top down, each band two close tones.
  const BANDS = [{ to: 0.14, tones: ["#f4f7fb", "#e2ebf5"] }, { to: 0.3, tones: ["#d3e3f3", "#c2d6ee"] },
    { to: 0.46, tones: ["#a6c4e7", "#95b6df"] }, { to: 0.62, tones: ["#719bd3", "#628bc7"] },
    { to: 0.8, tones: ["#4372b8", "#3866aa"] }, { to: 1.01, tones: ["#284e92", "#20437f"] }];
  const bandOf = (u) => { let b = 0; while (u >= BANDS[b].to) b++; return b; };
  // A slab: a voxel disc `R0` cells across its radius and one thick, its rim stepped and ragged, its tones speckled
  // and the lighter one round its rim; glowing a little so it reads in the storm.
  const R0 = 8;
  const slab = M.variants((b) => {
    const v = M.makeVox(), rand = mulberry32(41 + b * 7);
    const p1 = rand() * TAU, p2 = rand() * TAU;
    for (let x = -R0 - 2; x <= R0 + 1; x++) for (let z = -R0 - 2; z <= R0 + 1; z++) {
      const a = Math.atan2(z + 0.5, x + 0.5), r = Math.hypot(x + 0.5, z + 0.5), edge = R0 + 0.8 * Math.sin(3 * a + p1) + 0.5 * Math.sin(5 * a + p2);
      if (r <= edge) v.set(x, 0, z, r > edge - 1.3 || rand() < 0.25 ? 1 : 0);
    }
    const g = M.voxelGeometry(v, { unit: 1, palette: BANDS[b].tones, origin: { x: 0, y: -0.5, z: 0 }, emissive: { 0: 0.24, 1: 0.3 } });
    g.castShadow = false;
    return g;
  });
  // A streak of spray whipped round the funnel, one unit long along x.
  const streak = M.cached(() => M.noShadow(M.box({ w: 1, h: 0.06, d: 0.06, color: "#d7e3ef", emissive: 0.35 })));

  // `root` is the run's own node; `onForm(x, y, z)` hears each tornado begin to form, for its sound.
  const create = ({ root, renderer, onForm = null }) => {
    const lite = renderer?.kind === "canvas2d", tier = lite ? 0.25 : renderer?.quality === "low" ? 0.5 : renderer?.quality === "medium" ? 0.75 : 1;
    // One batch a band of colour, holding that band's slabs, and which batch and slot each slab writes.
    const counts = BANDS.map(() => 0), bandAt = new Uint8Array(LAYERS), slotAt = new Uint16Array(LAYERS);
    for (let i = 0; i < LAYERS; i++) { const b = bandOf((i + 0.5) / LAYERS); bandAt[i] = b; slotAt[i] = counts[b]++; }
    const batches = BANDS.map((band, b) => {
      const data = new Float32Array(counts[b] * 20);
      for (let o = 16; o < data.length; o += 20) data[o] = 1;
      return createNode({ geometry: slab(b), instanceData: data, instanceCount: counts[b], instanceVersion: 0, fixedInstanceCapacity: true, sightHidden: true, visible: false });
    });
    const STREAKS = Math.round(90 * tier), spray = createNode({ geometry: streak(), instanceData: new Float32Array(STREAKS * 20), instanceCount: STREAKS,
      instanceVersion: 0, fixedInstanceCapacity: true, sightHidden: true, visible: false });
    for (let o = 16; o < spray.instanceData.length; o += 20) spray.instanceData[o] = 1;
    const parts = [...batches, spray];
    addChild(root, ...parts);
    const seeds = new Float32Array(STREAKS * 2), keep = mulberry32(911);
    for (let i = 0; i < seeds.length; i++) seeds[i] = keep();
    // The run's clock for when each forms, and the tornado now: its state and age in it, its axis and drift (and the
    // drift's direction, which its tail curls back from), its top, the height it formed at (the rider's), the lightning
    // flickering in its cap, and how far it has come down, how thin it has roped and how hard it holds.
    let rand = mulberry32(1), next = Infinity, state = IDLE, age = 0, clock = 0, span = 0, made = 0;
    let ax = 0, az = 0, vx = 0, vz = 0, dirX = 1, dirZ = 0, top = 0, band = 0, flashAt = -1, flashNext = 0, strength = 0, reveal = 0, rope = 1, grow = 0;
    const range = (pair) => pair[0] + (pair[1] - pair[0]) * rand();
    const CENTRE = { x: 0, z: 0 };
    // The axis at height fraction `u`: its tail curls back and round from the drift.
    const fractionAt = (y) => Math.max(0, Math.min(1, (top - y) / LENGTH));
    const axisOf = (u, out) => {
      const back = CURL * u ** 2.4, round = CURL * 0.5 * u ** 3;
      out.x = ax - dirX * back + dirZ * round; out.z = az - dirZ * back - dirX * round;
      return out;
    };
    // Where its axis stands at height y, and its radius there (0 where it has not come down).
    const axisAt = (y, out) => axisOf(fractionAt(y), out);
    const radiusAt = (y) => { const u = fractionAt(y); return u <= reveal && y <= top ? shape(u) * TOP_R * rope : 0; };
    const hide = () => { for (let i = 0; i < parts.length; i++) parts[i].visible = false; };
    const begin = (x, y, z, dx, dz, speed) => {
      ax = x; az = z; dirX = dx; dirZ = dz; vx = dx * speed; vz = dz * speed;
      top = y + TOP; band = y; state = FORMING; age = 0; flashNext = clock + 1;
    };
    const form = (x, y, z, fx, fz) => {
      const side = rand() < 0.5 ? -1 : 1, sx = -fz * side, sz = fx * side, ahead = range(AHEAD), off = range(SIDE), drift = range(DRIFT);
      const dx = -sx + fx * (rand() - 0.5) * 0.4, dz = -sz + fz * (rand() - 0.5) * 0.4, d = Math.hypot(dx, dz);
      begin(x + fx * ahead + sx * off, y, z + fz * ahead + sz * off, dx / d, dz / d, drift);
      onForm?.(ax, top, az);
    };
    // Each frame of a run: `time` the race clock, (x, y, z) the rider's feet, `finish` the final cloud, `whirl` the
    // course's, which this writes, and `eye` the camera's place.
    const update = (dt, time, x, y, z, finish, whirl, eye) => {
      clock += dt;
      if (state === IDLE) {
        whirl.strength = strength = 0;
        const fx = finish.x - x, fz = finish.z - z, d = Math.hypot(fx, fz);
        if (time < next && !(made < DUE.length && d < span * (1 - DUE[made]))) return;
        if (d < CLEAR) { next = time + 5; return; }
        form(x, y, z, fx / d, fz / d); made++;
      }
      age += dt;
      if (state === FORMING && age >= FORM) { state = DROPPING; age -= FORM; }
      if (state === DROPPING && age >= DROP) { state = DOWN; age -= DROP; }
      if (state === DOWN && age >= LIVE) { state = FADING; age -= LIVE; }
      if (state === FADING && age >= FADE) { state = IDLE; next = time + range(BETWEEN); whirl.strength = strength = 0; hide(); return; }
      if (state !== FORMING) { ax += vx * dt; az += vz * dt; }
      const band0 = TOP / LENGTH;
      if (state === FORMING) { grow = ease(age / FORM); reveal = 0.08 * grow; rope = 1; strength = 0; }
      else if (state === DROPPING) { grow = 1; reveal = 0.08 + 0.92 * ease(age / DROP); rope = 1; strength = ease((reveal - band0 + 0.1) / 0.25); }
      else if (state === DOWN) { grow = 1; reveal = 1; rope = 1; strength = 1; }
      else { const k = 1 - ease(age / FADE); grow = k; reveal = k; rope = 0.35 + 0.65 * k; strength = k; }
      axisOf(band0, CENTRE);
      whirl.x = CENTRE.x; whirl.z = CENTRE.z; whirl.strength = strength; whirl.core = Math.max(1, shape(band0) * TOP_R * rope);
      whirl.reach = whirl.core + REACH; whirl.speed = SPEED;
      draw(eye);
    };
    const draw = (eye) => {
      // Lightning flickers in the cap now and then while it gathers and while it is down.
      if (clock >= flashNext && state !== FADING) { flashAt = clock; flashNext = clock + 0.8 + rand() * 1.6; }
      const flash = flashAt < 0 ? 0 : Math.max(0, 1 - (clock - flashAt) / 0.18), thick = LENGTH / LAYERS;
      // Each slab turns at its own speed, faster toward the tail, and sways round its axis on its own circle; it shows
      // once the funnel reaches it, and the cap gathers in first. A view that comes in at its side (following an Ooga
      // carried round it) cuts away the slabs round its own height, so it never looks out through solid tornado.
      const eyeU = fractionAt(eye.y);
      axisOf(eyeU, CENTRE);
      const eyeR = Math.hypot(eye.x - CENTRE.x, eye.z - CENTRE.z), cut = eye.y <= top && eyeU <= reveal ? shape(eyeU) * TOP_R * rope + 3 - eyeR : -1;
      for (let i = 0; i < LAYERS; i++) {
        const u = (i + 0.5) / LAYERS, d = batches[bandAt[i]].instanceData, o = slotAt[i] * 20;
        const show = Math.max(0, Math.min(1, (reveal - u) / 0.04)) * (state === FORMING ? grow : 1) * (cut > 0 && Math.abs(u - eyeU) < 0.11 ? 0 : 1);
        if (!show) { for (let k = 0; k < 11; k++) d[o + k] = 0; continue; }
        axisOf(u, CENTRE);
        const sway = (0.3 + 1.4 * u) * rope, a = i * 1.7 + clock * (0.8 + 1.6 * u);
        const s = shape(u) * TOP_R * rope / R0 * show, turn = i * 0.9 + clock * (0.5 + 2 * u), c = Math.cos(turn) * s, n = Math.sin(turn) * s;
        d[o] = c; d[o + 1] = 0; d[o + 2] = -n;
        d[o + 4] = 0; d[o + 5] = thick * show; d[o + 6] = 0;
        d[o + 8] = n; d[o + 9] = 0; d[o + 10] = c;
        d[o + 12] = CENTRE.x + Math.cos(a) * sway; d[o + 13] = top - u * LENGTH; d[o + 14] = CENTRE.z + Math.sin(a) * sway; d[o + 15] = 1;
        d[o + 16] = 1 + (u < 0.16 ? flash * 2.5 : 0);
      }
      for (let b = 0; b < batches.length; b++) { batches[b].instanceVersion++; batches[b].visible = true; }
      // Spray whipped round just off its side, only where it has come down.
      const sd = spray.instanceData;
      for (let i = 0, o = 0; i < STREAKS; i++, o += 20) {
        const h1 = seeds[i * 2], h2 = seeds[i * 2 + 1], u = 0.1 + 0.9 * (i + 0.5) / STREAKS;
        const show = Math.max(0, Math.min(1, (reveal - u) / 0.08));
        if (!show) { for (let k = 0; k < 11; k++) sd[o + k] = 0; continue; }
        axisOf(u, CENTRE);
        const a = i * GOLDEN + clock * (1.2 + 2.6 * u), r = shape(u) * TOP_R * rope * (1.12 + 0.3 * h1) + 1, ca = Math.cos(a), sa = Math.sin(a);
        const len = (1.5 + 2.5 * h2) * show, tilt = 0.25, k = len / Math.hypot(1, tilt);
        sd[o] = -sa * k; sd[o + 1] = tilt * k; sd[o + 2] = ca * k;
        sd[o + 4] = 0; sd[o + 5] = show; sd[o + 6] = 0;
        sd[o + 8] = ca * show; sd[o + 9] = 0; sd[o + 10] = sa * show;
        sd[o + 12] = CENTRE.x + ca * r; sd[o + 13] = top - u * LENGTH + Math.sin(clock * 1.7 + i) * 0.6; sd[o + 14] = CENTRE.z + sa * r; sd[o + 15] = 1;
      }
      spray.instanceVersion++; spray.visible = STREAKS > 0;
    };
    // A run starts its clock from its own seed; `clear` ends any tornado at once.
    // A run begins: `seed` its course's, `length` how far its start stands from the finish.
    const start = (seed, length) => { rand = mulberry32(seed ^ 0x51ed270b); next = range(FIRST); span = length; made = 0; state = IDLE; age = 0; strength = 0; hide(); };
    const clear = (whirl = null) => { state = IDLE; next = Infinity; strength = 0; if (whirl) whirl.strength = 0; hide(); };
    // Forms one now at (x, z) over the height y, drifting along (dx, dz), for a debug page and the cards.
    const spawn = (x, y, z, dx, dz) => { const d = Math.hypot(dx, dz) || 1; begin(x, y, z, dx / d, dz / d, 1.8); };
    const dispose = () => { for (let i = 0; i < parts.length; i++) removeChild(root, parts[i]); };
    const liveGeometry = (set) => { for (let b = 0; b < BANDS.length; b++) set.add(slab(b)); set.add(streak()); };
    return { start, update, clear, spawn, axisAt, radiusAt, dispose, liveGeometry,
      get active() { return state !== IDLE; }, get down() { return strength > 0; }, get strength() { return strength; },
      get forming() { return state === FORMING ? ease(age / FORM) : 0; }, get top() { return top; }, get bottom() { return top - LENGTH; },
      get vx() { return vx; }, get vz() { return vz; }, get state() { return state; } };
  };
  BL.cloudHopperTornado = { create, FORM, DROP, LIVE, FADE };
})();
