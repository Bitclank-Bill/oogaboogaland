// The Goldbug in the bushes, a hub easter egg. Walk the visitor's Ooga through the four meadow bushes in front of the
// mirror cave in a loop, either way round and in order, within `LOOP.window` seconds, and the Goldbug (goldbug-models.js)
// pops out of one of them with a rustle, runs to the mirror dropping coins from his pockets, does a double take at his
// reflection and melts into a gold puddle that steams away. Only the visitor who walked the loop sees it: nothing is
// sent to the room. The coins are decoration from a fixed pool, never loot. Calm (reduced motion) gets a short walk and
// a fade, without the melt, coins, steam or ripple. Idle, `update` reads the player's position against one circle and
// allocates nothing; the show's nodes join the scene only while it runs and leave with `dispose`.
(() => {
  "use strict";
  const BL = window.BL = window.BL || {};
  const { createNode, addChild, removeChild } = BL.scene;
  const { mat4 } = BL.math;
  const LOOP = { count: 4, window: 20, cooldown: 240 };
  const COINS = { capacity: 18, life: 2.6, gravity: 9.8, every: 0.2 };
  const SHOW = { pop: 0.45, run: 3.2, look: 1.3, melt: 1.6, puddle: 2, calmWalk: 1.4, calmSpeed: 1.3, calmFade: 0.7 };
  // The run's two turns, in the mirror mouth's frame (+z out of the cave): a point on the path out front, then the
  // spot just before the glass, which stands half a metre in from the mouth.
  const APPROACH_Z = 4.2, STAND_Z = 1.5;

  // A full circuit of `count` places: entering place i starts a loop there; each next entry must be the neighbour in
  // the direction the first step took, until the loop is back at its start. A wrong place restarts the loop from it, a
  // loop older than `window` restarts at the next entry, re-entering the place just left changes nothing, and after a
  // firing nothing counts until `cooldown` has passed. `step` takes the place the player is in now (-1 for none) and
  // acts only on a change, so it may be called every frame. Times are island time (`clock`, the scene's summed dt), so
  // a slow frame, a hidden tab or a visit elsewhere never runs a loop out or a cooldown down.
  const loop = ({ count = LOOP.count, window = LOOP.window, cooldown = LOOP.cooldown } = {}) => {
    const s = { count, window, cooldown, clock: 0, inside: -1, start: -1, last: -1, dir: 0, steps: 0, startedAt: 0, firedAt: -Infinity, fired: 0 };
    const begin = (index, now) => { s.start = s.last = index; s.dir = 0; s.steps = 0; s.startedAt = now; };
    s.reset = () => { s.inside = s.start = s.last = -1; s.dir = 0; s.steps = 0; };
    s.cooling = (now) => now - s.firedAt < s.cooldown;
    s.step = (index, now) => {
      if (index === s.inside) return false;
      s.inside = index;
      if (index < 0) return false;
      if (s.cooling(now)) { s.start = s.last = -1; return false; }
      if (s.start < 0 || now - s.startedAt > s.window) { begin(index, now); return false; }
      if (index === s.last) return false;
      const forward = (s.last + 1) % s.count === index, back = (s.last + s.count - 1) % s.count === index;
      if (s.dir === 0 && (forward || back)) s.dir = forward ? 1 : -1;
      else if (!(s.dir > 0 ? forward : back)) { begin(index, now); return false; }
      s.last = index;
      if (++s.steps < s.count) return false;
      s.firedAt = now; s.fired++;
      s.start = s.last = -1; s.dir = 0; s.steps = 0;
      return true;
    };
    return s;
  };

  // Fixed-capacity coins: `spawn` refuses once every coin is in the air or on the ground, so the pool never grows;
  // a coin falls, bounces once, lies flat and shrinks away over its last half second, then goes back to the pool.
  const coinPool = ({ parent, geometry, capacity = COINS.capacity, life = COINS.life, gravity = COINS.gravity }) => {
    const coins = [];
    for (let i = 0; i < capacity; i++) {
      const node = createNode({ geometry, visible: false, sightHidden: true });
      addChild(parent, node);
      coins.push({ node, vx: 0, vy: 0, vz: 0, life: 0, floor: 0, bounced: false });
    }
    const pool = { capacity, live: 0, spawned: 0, refused: 0, coins };
    pool.spawn = (x, y, z, vx, vy, vz, floor) => {
      for (let i = 0; i < capacity; i++) {
        const c = coins[i];
        if (c.life > 0) continue;
        c.life = life; c.vx = vx; c.vy = vy; c.vz = vz; c.floor = floor; c.bounced = false;
        const n = c.node;
        n.position.x = x; n.position.y = y; n.position.z = z;
        n.rotation.x = 1.2; n.rotation.y = 0;
        n.scale.x = n.scale.y = n.scale.z = 1;
        n.visible = true;
        pool.live++; pool.spawned++;
        return c;
      }
      pool.refused++;
      return null;
    };
    pool.update = (dt) => {
      if (!pool.live) return;
      for (let i = 0; i < capacity; i++) {
        const c = coins[i];
        if (c.life <= 0) continue;
        const n = c.node;
        c.life -= dt;
        if (c.life <= 0) { c.life = 0; n.visible = false; pool.live--; continue; }
        if (c.vx || c.vy || c.vz || n.position.y > c.floor) {
          c.vy -= gravity * dt;
          n.position.x += c.vx * dt; n.position.y += c.vy * dt; n.position.z += c.vz * dt;
          n.rotation.x += 14 * dt; n.rotation.y += 5 * dt;
          if (n.position.y <= c.floor) {
            n.position.y = c.floor;
            if (!c.bounced && c.vy < -1) { c.bounced = true; c.vy *= -0.35; c.vx *= 0.5; c.vz *= 0.5; }
            else { c.vx = c.vy = c.vz = 0; n.rotation.x = 0; }
          }
        }
        if (c.life < 0.5) n.scale.x = n.scale.y = n.scale.z = c.life / 0.5;
      }
    };
    pool.clear = () => {
      for (let i = 0; i < capacity; i++) { coins[i].life = 0; coins[i].node.visible = false; }
      pool.live = 0;
    };
    return pool;
  };

  const IDLE = 0, POP = 1, RUN = 2, LOOK = 3, MELT = 4, PUDDLE = 5, WALK = 6, FADE = 7, SETTLE = 8;
  const PHASES = ["idle", "pop", "run", "look", "melt", "puddle", "walk", "fade", "settle"];
  // bushes: the four props in loop order ({ x, z, footprint, node }); mirror: the hub's mirrorCave (mouth, node,
  // ripples); groundAt(x, z): the floor; rustle(bush, calm): the hub's own bush rustle; calm() and busy() are read
  // when it matters (busy: GAME MODE or any other island event, which also cuts a running show short); memory: an
  // object that outlives the scene (the director's `world`), holding the loop, its island clock and so its cooldown.
  const create = ({ root, fx, bushes, mirror, groundAt, rustle, calm, busy, memory, random = Math.random }) => {
    const GM = BL.goldbugModels;
    const count = bushes.length;
    const state = memory.goldbugLoop || (memory.goldbugLoop = loop());
    state.reset();
    // The bushes' centre and reach: beyond it the idle check is one comparison.
    let cx = 0, cz = 0, reach = 0;
    for (const b of bushes) { cx += b.x / count; cz += b.z / count; }
    for (const b of bushes) reach = Math.max(reach, Math.hypot(b.x - cx, b.z - cz) + b.footprint + 1);
    const reach2 = reach * reach;
    const m = mirror.mouth, fx0 = Math.sin(m.ry), fz0 = Math.cos(m.ry);
    const path = new Float64Array(6), lengths = new Float64Array(2);
    path[2] = m.x + fx0 * APPROACH_Z; path[3] = m.z + fz0 * APPROACH_Z;
    path[4] = m.x + fx0 * STAND_Z; path[5] = m.z + fz0 * STAND_Z;
    const inverse = mat4.create(), local = new Float64Array(3);
    BL.scene.updateWorld(mirror.node);
    mat4.invert(inverse, mirror.node.world);
    let group = null, rig = null, puddle = null, coins = null, attached = false;
    let phase = IDLE, t = 0, travelled = 0, total = 0, stride = 0, coinAt = 0, steamAt = 0, coinSide = 1, calmShow = false, from = 0, shows = 0, aborted = 0;
    let audio = null, voice = null, voiceGain = null;
    const audioOn = () => {
      if (audio) return audio;
      if (typeof AudioContext === "undefined" || navigator.userActivation && !navigator.userActivation.hasBeenActive) return null;
      const ctx = new AudioContext();
      // One retained voice; the squeak only schedules its pitch and envelope.
      voice = ctx.createOscillator(); voice.type = "triangle"; voice.frequency.value = 600;
      voiceGain = ctx.createGain(); voiceGain.gain.value = 0;
      voice.connect(voiceGain); voiceGain.connect(BL.sound.output(ctx)); voice.start();
      if (ctx.state === "suspended") ctx.resume().catch(() => {});
      return audio = ctx;
    };
    const squeak = () => {
      if (!audio || BL.sound.muted) return;
      const t0 = audio.currentTime, f = voice.frequency, g = voiceGain.gain;
      f.cancelScheduledValues(t0); f.setValueAtTime(460, t0);
      f.exponentialRampToValueAtTime(1250, t0 + 0.09); f.exponentialRampToValueAtTime(780, t0 + 0.26);
      g.cancelScheduledValues(t0); g.setValueAtTime(0, t0); g.linearRampToValueAtTime(0.2, t0 + 0.02);
      g.setValueAtTime(0.2, t0 + 0.17); g.exponentialRampToValueAtTime(0.001, t0 + 0.32); g.setValueAtTime(0, t0 + 0.34);
    };
    // Built the first time it fires, in the hub's model scope, and kept for the visit.
    const build = () => {
      group = createNode({ sightHidden: true });
      rig = GM.create();
      puddle = createNode({ geometry: GM.puddleGeometry(), visible: false, sightHidden: true });
      addChild(group, rig.root, puddle);
      coins = coinPool({ parent: group, geometry: GM.coinGeometry() });
    };
    const place = (x, z, ground, lift) => {
      rig.root.position.x = x; rig.root.position.z = z;
      rig.root.position.y = ground + rig.baseY * rig.root.scale.y + lift;
    };
    // Where along the path `travelled` metres lands, written into the rig, facing the way it goes.
    const follow = () => {
      let d = travelled, i = 0;
      if (d > lengths[0]) { d -= lengths[0]; i = 1; }
      const ax = path[i * 2], az = path[i * 2 + 1], bx = path[i * 2 + 2], bz = path[i * 2 + 3];
      const k = lengths[i] > 0 ? Math.min(1, d / lengths[i]) : 1, x = ax + (bx - ax) * k, z = az + (bz - az) * k;
      rig.root.rotation.y = Math.atan2(bx - ax, bz - az);
      return place(x, z, groundAt(x, z), 0);
    };
    const finish = () => {
      phase = IDLE;
      if (!attached) return;
      coins.clear();
      GM.setGolden(rig, false);
      GM.stand(rig);
      puddle.visible = false;
      removeChild(root, group);
      attached = false;
    };
    const start = (calmNow) => {
      if (!group) build();
      calmShow = calmNow;
      from = Math.floor(random() * count) % count;
      const b = bushes[from];
      path[0] = b.x; path[1] = b.z;
      lengths[0] = Math.hypot(path[2] - path[0], path[3] - path[1]);
      lengths[1] = Math.hypot(path[4] - path[2], path[5] - path[3]);
      total = calmShow ? Math.min(SHOW.calmWalk, lengths[0]) : lengths[0] + lengths[1];
      travelled = 0; stride = 0; coinAt = 0; steamAt = 0;
      GM.setGolden(rig, false);
      GM.stand(rig);
      rig.root.visible = true;
      puddle.visible = false;
      if (!attached) { addChild(root, group); attached = true; }
      rig.root.rotation.y = Math.atan2(path[2] - path[0], path[3] - path[1]);
      place(b.x, b.z, groundAt(b.x, b.z), -0.8);
      rustle(b, calmShow);
      audioOn();
      if (calmShow) squeak();
      phase = POP; t = 0; shows++;
    };
    const dropCoin = () => {
      const p = rig.root.position, yaw = rig.root.rotation.y, sx = Math.cos(yaw) * coinSide, sz = -Math.sin(yaw) * coinSide;
      const x = p.x + sx * 0.3, z = p.z + sz * 0.3;
      coins.spawn(x, p.y - rig.baseY + 0.45, z, sx * 0.8 - Math.sin(yaw) * 0.6 + (random() - 0.5) * 0.4, 1.4 + random() * 0.8,
        sz * 0.8 - Math.cos(yaw) * 0.6 + (random() - 0.5) * 0.4, groundAt(x, z) + 0.012);
      coinSide = -coinSide;
    };
    const steam = (x, y, z, spread) => fx.puff(x + (random() - 0.5) * spread, y, z + (random() - 0.5) * spread,
      (random() - 0.5) * 0.3, 0.7 + random() * 0.5, (random() - 0.5) * 0.3, 0.9 + random() * 0.5);
    const advance = (dt) => {
      t += dt;
      const p = rig.root.position;
      switch (phase) {
        case POP: {
          const k = Math.min(1, t / SHOW.pop), e = 1 - (1 - k) * (1 - k);
          rig.root.scale.x = rig.root.scale.y = rig.root.scale.z = 0.5 + 0.5 * e;
          place(path[0], path[1], groundAt(path[0], path[1]), -0.8 * (1 - e) + Math.sin(k * Math.PI) * 0.25);
          if (k >= 1) { phase = calmShow ? WALK : RUN; t = 0; }
          break;
        }
        case RUN: case WALK: {
          const speed = phase === RUN ? SHOW.run : SHOW.calmSpeed;
          travelled = Math.min(total, travelled + speed * dt);
          stride += dt * speed * 4.2;
          follow();
          p.y += GM.walk(rig, stride, phase === RUN ? 1.3 : 0.8);
          if (phase === RUN && (coinAt += dt) >= COINS.every) { coinAt -= COINS.every; dropCoin(); }
          if (travelled < total) break;
          GM.stand(rig);
          if (phase === WALK) { phase = FADE; t = 0; break; }
          rig.root.rotation.y = Math.atan2(-fx0, -fz0);
          phase = LOOK; t = 0;
          break;
        }
        case LOOK: {
          GM.doubleTake(rig, Math.min(1, t / SHOW.look));
          if (t - dt < SHOW.look * 0.36 && t >= SHOW.look * 0.36) {
            squeak();
            mat4.transformPoint(local, inverse, p.x - fx0 * 0.9, p.y - rig.baseY + 1.1 * rig.height, p.z - fz0 * 0.9);
            mirror.ripples.pulse(local[0], local[1]);
          }
          if (t >= SHOW.look) { GM.stand(rig); GM.setGolden(rig, true); phase = MELT; t = 0; }
          break;
        }
        case MELT: {
          const ground = groundAt(p.x, p.z), k = GM.melt(rig, Math.min(1, t / SHOW.melt));
          place(p.x, p.z, ground, 0);
          puddle.visible = true;
          puddle.position.x = p.x; puddle.position.y = ground + 0.005; puddle.position.z = p.z;
          puddle.scale.x = puddle.scale.z = 0.15 + 0.85 * k; puddle.scale.y = 1;
          if ((steamAt += dt) >= 0.07) { steamAt = 0; steam(p.x, ground + 0.3 + 0.6 * (1 - k), p.z, 0.5); }
          if (t >= SHOW.melt) { rig.root.visible = false; phase = PUDDLE; t = 0; }
          break;
        }
        case PUDDLE: {
          const k = Math.min(1, t / SHOW.puddle), s = 1 - k * k;
          puddle.scale.x = puddle.scale.z = s; puddle.scale.y = s;
          if (k < 0.6 && (steamAt += dt) >= 0.16) { steamAt = 0; steam(puddle.position.x, puddle.position.y + 0.08, puddle.position.z, 0.7); }
          if (k >= 1) { puddle.visible = false; phase = SETTLE; t = 0; }
          break;
        }
        case FADE: {
          const k = Math.min(1, t / SHOW.calmFade), s = Math.max(0.001, 1 - k);
          rig.root.scale.x = rig.root.scale.y = rig.root.scale.z = s;
          place(p.x, p.z, groundAt(p.x, p.z), 0);
          if (k >= 1) { rig.root.visible = false; phase = SETTLE; t = 0; }
          break;
        }
        case SETTLE:
          if (!coins.live) finish();
          break;
      }
      coins.update(dt);
    };
    // Which bush the point stands in, or -1: the bushes' own footprints.
    const inside = (x, z) => {
      for (let i = 0; i < count; i++) {
        const b = bushes[i], dx = x - b.x, dz = z - b.z;
        if (dx * dx + dz * dz <= b.footprint * b.footprint) return i;
      }
      return -1;
    };
    const update = (dt, player) => {
      state.clock += dt;
      if (phase !== IDLE) {
        if (busy()) { aborted++; finish(); return; }
        advance(dt);
        return;
      }
      if (!player || count !== LOOP.count) { state.step(-1, 0); return; }
      const dx = player.x - cx, dz = player.z - cz;
      const index = dx * dx + dz * dz > reach2 ? -1 : inside(player.x, player.z);
      if (index === state.inside) return;
      if (busy()) { state.step(-1, 0); return; }
      if (state.step(index, state.clock)) start(!!calm());
    };
    const dispose = () => {
      finish();
      if (audio) { audio.close().catch(() => {}); audio = voice = voiceGain = null; }
      group = rig = puddle = coins = null;
    };
    return {
      update, dispose,
      get active() { return phase !== IDLE; },
      debug: {
        bushes, path, loop: state,
        get phase() { return PHASES[phase]; },
        get from() { return from; },
        get calm() { return calmShow; },
        get shows() { return shows; },
        get aborted() { return aborted; },
        get coins() { return coins ? { live: coins.live, capacity: coins.capacity, spawned: coins.spawned, refused: coins.refused } : null; },
        get attached() { return attached; },
        get rig() { return rig ? { x: rig.root.position.x, y: rig.root.position.y, z: rig.root.position.z, visible: rig.root.visible, golden: rig.golden } : null; },
        fire: (calmNow = false) => { if (phase === IDLE && count === LOOP.count) start(calmNow); return phase !== IDLE; }
      }
    };
  };
  BL.hubGoldbug = { create, loop, coinPool, LOOP, COINS, SHOW };
})();
