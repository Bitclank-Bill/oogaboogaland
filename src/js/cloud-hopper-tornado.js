// Cloud Hopper's tornadoes, on Thunderhead (its sky's `tornado`). Each run has its spots down the course, seeded with
// it (`SPOTS`). Over the next spot the storm turns, a cap gathering (`FORM` seconds) and brewing there, so a rider
// sees from afar where it will come down; once the rider comes near it (`TRIGGER`), or passes it, a funnel lowers from
// it through the course (`DROP`), roams about the course there while it lives (`LIVE`), then ropes out and draws back
// up into the sky (`FADE`), and the next spot starts to brew. Lightning strikes round it from when it starts to brew
// until it ropes out, a second sign of where it is. While it is down it writes the course's `whirl`, which
// turns the clouds near it round its axis, and `strength` says how hard it holds; the controller carries the Ooga round
// it and, once drawn into its core, up it and out of its top. It is a giant voxel tornado: a stack of stepped slabs, white at its flared cap through blue
// to deep blue at its curling tail, each slab turning and swaying at its own speed (one instanced draw for each band
// of colour), with streaks of spray whipped round it. Nothing allocates a frame.
(() => {
  "use strict";
  const BL = window.BL = window.BL || {};
  const { createNode, addChild, removeChild } = BL.scene;
  const M = BL.models, { mulberry32 } = BL.math;
  const TAU = Math.PI * 2, GOLDEN = 2.399963;
  // Phase lengths (s): the sky turning, the funnel lowering, the funnel down, and roping out.
  const FORM = 4.5, DROP = 2.5, LIVE = 11, FADE = 3;
  // Its spots: over the main landing a rider at the expected pace reaches at each of these shares of the way down, this
  // far off to one side of it (m), drifting back across the course this fast (m/s). A rider within `TRIGGER` of the
  // spot across the course, or `PASS` nearer the finish than it, brings it down.
  const SPOTS = [0.22, 0.5, 0.78], SIDE = [10, 22], DRIFT = [1.4, 2.4], TRIGGER = 40, PASS = 8;
  // Once down it roams: its heading wanders at ROAM (m/s), and a pull back toward the landing it brewed over (HOME,
  // per s) keeps it on the course there.
  const ROAM = 4, HOME = 0.12;
  // Its lightning: a strike every STRIKE seconds, STRIKE_OFF from its axis (m), from just over its cap down past the
  // course, its thunder heard within HEARD (m).
  const STRIKE = [0.9, 2.2], STRIKE_OFF = [6, 26], HEARD = 200;
  // The funnel: its top this far over the course at its spot, how far it reaches down, its cap's radius, how
  // far its tail curls back from its drift (m), and how many slabs it stacks.
  const TOP = 120, LENGTH = 195, TOP_R = 19, CURL = 12, LAYERS = 104;
  // How much of it the brewing cap shows, as a share of its length, and how brightly it glows while it brews (and,
  // a little, once down), so it stands out against the storm's grey.
  const BREW = 0.14, BREW_GLOW = 1.2, DOWN_GLOW = 0.4;
  // Its hold on the clouds (the course's `whirl`): how far it reaches past its own side, the speed at its side, and
  // how fast it draws a cloud in toward it and lifts it (m/s).
  const REACH = 22, SPEED = 10, DRAW = 3, RISE = 2.5;
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
  // and the lighter one round its rim; glowing a little and piercing most of the haze, so it reads in the storm from
  // afar.
  const R0 = 8;
  const slab = M.variants((b) => {
    const v = M.makeVox(), rand = mulberry32(41 + b * 7);
    const p1 = rand() * TAU, p2 = rand() * TAU;
    for (let x = -R0 - 2; x <= R0 + 1; x++) for (let z = -R0 - 2; z <= R0 + 1; z++) {
      const a = Math.atan2(z + 0.5, x + 0.5), r = Math.hypot(x + 0.5, z + 0.5), edge = R0 + 0.8 * Math.sin(3 * a + p1) + 0.5 * Math.sin(5 * a + p2);
      if (r <= edge) v.set(x, 0, z, r > edge - 1.3 || rand() < 0.25 ? 1 : 0);
    }
    const g = M.voxelGeometry(v, { unit: 1, palette: BANDS[b].tones, origin: { x: 0, y: -0.5, z: 0 }, emissive: { 0: 0.24, 1: 0.3 } });
    g.castShadow = false; g.fogPierce = 0.75;
    return g;
  });
  // A streak of spray whipped round the funnel, one unit long along x.
  const streak = M.cached(() => M.noShadow(M.box({ w: 1, h: 0.06, d: 0.06, color: "#d7e3ef", emissive: 0.35 })));

  // `root` is the run's own node; `onDrop(x, y, z)` hears each tornado begin to come down and `onStrike(distance)`
  // each strike of its lightning, for their sound.
  const create = ({ root, renderer, onDrop = null, onStrike = null }) => {
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
    // Its lightning's bolts, the storm's own shapes, shown a moment at each strike.
    const bolts = [0, 1].map((v) => createNode({ geometry: BL.cloudHopperSky.bolt(v), visible: false, sightHidden: true }));
    const parts = [...batches, spray, ...bolts];
    addChild(root, ...parts);
    const seeds = new Float32Array(STREAKS * 2), keep = mulberry32(911);
    for (let i = 0; i < seeds.length; i++) seeds[i] = keep();
    // The run's spots and how many have brewed, and the tornado now: its state and age in it, its axis and drift (and
    // the drift's direction, which its tail curls back from), its top, the height it formed at (the course's), the
    // lightning flickering in its cap, and how far it has come down, how thin it has roped and how hard it holds.
    const spots = [];
    let rand = mulberry32(1), state = IDLE, age = 0, clock = 0, made = 0;
    let ax = 0, az = 0, vx = 0, vz = 0, dirX = 1, dirZ = 0, top = 0, band = 0, flashAt = -1, flashNext = 0, strength = 0, reveal = 0, rope = 1, grow = 0;
    // Where it roams round (`home`), its heading to start from and its wander's own clock and phases; and its
    // lightning: the next strike, the last and how bright that one's flash is where the eye stands.
    let homeX = 0, homeZ = 0, heading = 0, wander = 0, w1 = 0, w2 = 0, strikeNext = 0, strikeAt = -1, strikeLevel = 0;
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
    const begin = (x, y, z, dx, dz, speed, cx, cz) => {
      ax = x; az = z; dirX = dx; dirZ = dz; vx = dx * speed; vz = dz * speed;
      top = y + TOP; band = y; state = FORMING; age = 0; flashNext = clock + 1;
      homeX = cx; homeZ = cz; heading = Math.atan2(dx, dz); wander = 0; w1 = rand() * TAU; w2 = rand() * TAU; strikeNext = clock + 0.4;
    };
    // A strike round it: one or two bolts from just over its cap down past the course, each its own way round.
    const strike = (eye) => {
      strikeNext = clock + STRIKE[0] + Math.random() * (STRIKE[1] - STRIKE[0]); strikeAt = clock;
      const foot = band - 55, h = top + 6 - foot;
      for (let i = 0; i < bolts.length; i++) {
        const b = bolts[i], a = Math.random() * TAU, r = STRIKE_OFF[0] + Math.random() * (STRIKE_OFF[1] - STRIKE_OFF[0]);
        b.visible = i === 0 || Math.random() < 0.4;
        b.position.x = ax + Math.cos(a) * r; b.position.y = foot; b.position.z = az + Math.sin(a) * r;
        b.scale.x = b.scale.z = h * 1.3; b.scale.y = h; b.rotation.y = Math.random() * TAU;
      }
      const d = Math.hypot(bolts[0].position.x - eye.x, foot + h * 0.5 - eye.y, bolts[0].position.z - eye.z);
      strikeLevel = Math.max(0.15, Math.min(1, 1.3 - d / 140));
      if (d < HEARD) onStrike?.(d);
    };
    // The next spot starts to brew, set to drift back across the course from its side.
    const brew = (spot) => {
      const drift = range(DRIFT), dx = -spot.sx + spot.sz * (rand() - 0.5) * 0.4, dz = -spot.sz - spot.sx * (rand() - 0.5) * 0.4, d = Math.hypot(dx, dz);
      begin(spot.x, spot.y, spot.z, dx / d, dz / d, drift, spot.cx, spot.cz);
    };
    // Each frame of a run: (x, z) the rider's feet across the course, `finish` the final cloud, `whirl` the course's,
    // which this writes, and `eye` the camera's place.
    const update = (dt, x, z, finish, whirl, eye) => {
      clock += dt;
      if (state === IDLE) {
        whirl.strength = strength = 0;
        if (made === spots.length) return;
        brew(spots[made++]);
      }
      if (state === FORMING) {
        // Brewing holds once its cap has gathered, until the rider comes near or goes by.
        age = Math.min(FORM, age + dt);
        if (Math.hypot(x - ax, z - az) < TRIGGER || Math.hypot(finish.x - x, finish.z - z) < Math.hypot(finish.x - ax, finish.z - az) - PASS) {
          state = DROPPING; age = 0; onDrop?.(ax, top, az);
        }
      } else age += dt;
      if (state === DROPPING && age >= DROP) { state = DOWN; age -= DROP; }
      if (state === DOWN && age >= LIVE) { state = FADING; age -= LIVE; }
      if (state === FADING && age >= FADE) { state = IDLE; whirl.strength = strength = 0; hide(); return; }
      if (state !== FORMING) {
        // Roaming: its heading wanders, pulled back toward home, and its tail curls back from where it heads.
        wander += dt;
        const head = heading + 1.1 * Math.sin(0.6 * wander + w1) + 0.5 * Math.sin(1.5 * wander + w2), k = Math.min(1, dt * 1.5);
        vx += (Math.sin(head) * ROAM + (homeX - ax) * HOME - vx) * k; vz += (Math.cos(head) * ROAM + (homeZ - az) * HOME - vz) * k;
        ax += vx * dt; az += vz * dt;
        const speed = Math.hypot(vx, vz);
        if (speed > 0.2) { dirX = vx / speed; dirZ = vz / speed; }
      }
      if (clock >= strikeNext && (state !== FADING || age < FADE * 0.5)) strike(eye);
      if (strikeAt >= 0 && clock - strikeAt > 0.22) for (let i = 0; i < bolts.length; i++) bolts[i].visible = false;
      const band0 = TOP / LENGTH;
      if (state === FORMING) { grow = ease(age / FORM); reveal = BREW * grow; rope = 1; strength = 0; }
      else if (state === DROPPING) { grow = 1; reveal = BREW + (1 - BREW) * ease(age / DROP); rope = 1; strength = ease((reveal - band0 + 0.1) / 0.25); }
      else if (state === DOWN) { grow = 1; reveal = 1; rope = 1; strength = 1; }
      else { const k = 1 - ease(age / FADE); grow = k; reveal = k; rope = 0.35 + 0.65 * k; strength = k; }
      axisOf(band0, CENTRE);
      whirl.x = CENTRE.x; whirl.z = CENTRE.z; whirl.strength = strength; whirl.core = Math.max(1, shape(band0) * TOP_R * rope);
      whirl.reach = whirl.core + REACH; whirl.speed = SPEED; whirl.draw = DRAW; whirl.rise = RISE;
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
        d[o + 16] = 1 + (state === FORMING ? BREW_GLOW * grow : DOWN_GLOW * rope) + (u < 0.16 ? flash * 2.5 : 0);
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
    // A run begins: `seed` its course's, from which its spots are laid on `course` toward `finish`; `clear` ends any
    // tornado at once and brews no more.
    const start = (seed, course, finish) => {
      rand = mulberry32(seed ^ 0x51ed270b); spots.length = made = 0; state = IDLE; age = 0; strength = 0; hide();
      let last = 0;
      for (const c of course.clouds) if (c.main) last = Math.max(last, c.arrival);
      for (const share of SPOTS) {
        let best = null;
        for (const c of course.clouds) if (c.main && (!best || Math.abs(c.arrival - share * last) < Math.abs(best.arrival - share * last))) best = c;
        const fx = finish.x - best.x, fz = finish.z - best.z, d = Math.hypot(fx, fz) || 1, side = rand() < 0.5 ? -1 : 1, off = range(SIDE);
        const sx = -fz / d * side, sz = fx / d * side;
        spots.push({ x: best.x + sx * off, y: best.top, z: best.z + sz * off, sx, sz, cx: best.x, cz: best.z });
      }
    };
    const clear = (whirl = null) => { state = IDLE; made = spots.length; strength = 0; strikeAt = -1; if (whirl) whirl.strength = 0; hide(); };
    // Brings one down now at (x, z) over the height y, setting off along (dx, dz), for a debug page and the cards.
    const spawn = (x, y, z, dx, dz) => { const d = Math.hypot(dx, dz) || 1; begin(x, y, z, dx / d, dz / d, 1.8, x, z); state = DROPPING; };
    const dispose = () => { for (let i = 0; i < parts.length; i++) removeChild(root, parts[i]); };
    const liveGeometry = (set) => { for (let b = 0; b < BANDS.length; b++) set.add(slab(b)); set.add(streak()); for (const b of bolts) set.add(b.geometry); };
    return { start, update, clear, spawn, axisAt, radiusAt, dispose, liveGeometry,
      get active() { return state !== IDLE; }, get down() { return strength > 0; }, get strength() { return strength; },
      get forming() { return state === FORMING ? ease(age / FORM) : 0; }, get top() { return top; }, get bottom() { return top - LENGTH; },
      get vx() { return vx; }, get vz() { return vz; }, get state() { return state; },
      // Its lightning's flash where the eye stands, 0 to 1, for the sky.
      get flash() { return strikeAt < 0 ? 0 : Math.max(0, 1 - (clock - strikeAt) / 0.3) * strikeLevel; } };
  };
  BL.cloudHopperTornado = { create, FORM, DROP, LIVE, FADE, SPOTS, TRIGGER };
})();
