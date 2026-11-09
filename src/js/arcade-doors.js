// The double doors between the island and Ooga Arcade's hall (#554), one rig in each scene's copy of the same doorway,
// in the door's frame with +z out of the hall: the leaves swing out (+z), toward the mainland, by themselves, on their
// own nodes. A door's `walk` takes a visitor through: it keeps the doors shut while what lies beyond readies, with the
// visitor still driving outside them, opens them, walks the Ooga through at an even pace with the view following
// behind, and hands over to the other scene, whose own rig walks the Ooga on until it has arrived and the view has come
// through the doorway after it, gives the controls back and closes the doors behind. Allocates nothing a frame.
(() => {
  "use strict";
  const BL = window.BL = window.BL || {};
  const { createNode, addChild } = BL.scene;
  const { clamp } = BL.math;
  const AM = BL.arcadeModels;
  // Past the doors: how far an Ooga must get before the other scene can take over, how far past they keep open for the
  // view (`VIEW_CLEAR`, the doors' swing), and how long a walk may run before it lets go.
  const OPEN = 1.55, OPEN_S = 0.85, FAR = 3.4, TOUCH = 1.25, GRACE = 0.5, PAST = 0.6, ARRIVE = 2.8, ON_PAST = 1.2, SPEED = 0.55, AHEAD = 1.6, LIMIT = 9, VIEW_CLEAR = 1.2, VIEW_DIST = 3;
  const smooth = (t) => t * t * (3 - 2 * t);

  // A door rig under `parent`, at (x, y, z) turned `turn` there: the frame, the wall (`wall` for a cave with no rock
  // of its own round it) and the two leaves.
  const create = ({ parent, x = 0, y = 0, z = 0, turn = 0, wall = false, solids = null }) => {
    const parts = AM.doorParts(), D = AM.DOOR;
    const node = createNode({ position: { x, y, z }, rotation: { x: 0, y: turn, z: 0 } });
    const frame = createNode({ geometry: parts.frame }), left = createNode({ position: { x: -D.half, y: 0, z: 0 }, geometry: parts.leaf });
    const right = createNode({ position: { x: D.half, y: 0, z: 0 }, rotation: { x: 0, y: Math.PI, z: 0 }, geometry: parts.leaf });
    addChild(node, frame, left, right);
    addChild(parent, node);
    if (wall) { const stone = createNode({ geometry: parts.wall }); addChild(node, stone); solids?.add(stone); }
    if (solids) solids.add(frame);
    let k = 0, opening = false;
    const pose = () => {
      const e = smooth(k);
      left.rotation.y = -OPEN * e;
      right.rotation.y = Math.PI + OPEN * e;
    };
    const update = (dt, open) => {
      opening = open;
      const was = k;
      k = clamp(k + (open ? dt : -dt) / OPEN_S, 0, 1);
      if (k !== was) pose();
    };
    const set = (open) => { opening = open; k = open ? 1 : 0; pose(); };
    return { node, frame, left, right, update, set, get k() { return k; }, get open() { return k > 0.65; }, get opening() { return opening; } };
  };

  // Taking a visitor through: `frame` is the door's in the world (x, z, sr, cr of its turn, and `plane`, how far along
  // it the door's plane stands from there); `sign` is the way through (-1 going in along -z, +1 going out). The scene
  // reads `hold()` for what the Ooga is doing, and hands `prepare()` (what lies beyond, a promise or null) and
  // `onThrough(crossing)`, the switch to the other scene.
  // `camera` is the scene's; with `through` set (`maxPast` metres of room past the doors) the Ooga walks on until the view
  // has come through the doorway after it, and the other scene takes over from there.
  const walk = ({ door, frame: F, sign, pilot, crew, camera, prepare, onThrough, onState = () => {}, through = false, maxPast = 3.4 }) => {
    const state = { phase: "idle", wanted: false, x: 0, z: 0, seen: false, t: 0, target: 0, cave: null, ready: false, failed: false, busy: false };
    const set = (phase) => { if (state.phase !== phase) { state.phase = phase; onState(phase); } };
    const load = () => {
      if (state.ready || state.busy) return;
      state.busy = true; state.failed = false;
      set("loading");
      let loading;
      try { loading = prepare(); }
      catch (error) { state.busy = false; state.failed = true; set("failed"); return; }
      const finish = () => { state.busy = false; state.ready = true; if (state.phase === "loading") set("idle"); };
      if (loading && loading.then) loading.then(finish, () => { state.busy = false; state.failed = true; set("failed"); });
      else finish();
    };
    // Space at the doors, or a retry after a failed load.
    const ask = () => { state.wanted = true; if (!state.ready && !state.busy) load(); };
    const update = (dt, player) => {
      if (!player) { state.seen = false; if (state.phase !== "idle" && state.phase !== "loading" && state.phase !== "failed") set("idle"); return; }
      const p = player.root.position, along = (p.x - F.x) * F.sr + (p.z - F.z) * F.cr - F.plane, across = (p.x - F.x) * F.cr - (p.z - F.z) * F.sr, d = -sign * along;
      const eye = camera.position, eyeAlong = (eye.x - F.x) * F.sr + (eye.z - F.z) * F.cr - F.plane;
      if (state.phase === "arriving") {
        state.t += dt;
        const o = pilot.orbit, to = -sign * (state.stopAt + AHEAD) + F.plane;
        const dx = F.x + F.sr * to + F.cr * across * 0.5 - p.x, dz = F.z + F.cr * to - F.sr * across * 0.5 - p.z, m = Math.hypot(dx, dz) || 1;
        crew.steer(dx / m, dz / m, 0, 1, 0, SPEED);
        const behind = state.yaw;
        o.tYaw = o.yaw + Math.atan2(Math.sin(behind - o.yaw), Math.cos(behind - o.yaw));
        // The doors stay open until the view has come through them, and the walk until it has too.
        const viewPast = -sign * eyeAlong;
        if (d >= state.stopAt && viewPast >= VIEW_CLEAR || state.t > LIMIT) { crew.steer(0, 0, 0, 0, 0); state.settle = true; set("idle"); }
        door.update(dt, viewPast < VIEW_CLEAR);
        return;
      }
      if (state.settle) {
        const a = pilot.controls.read();
        if (a.x || a.y) crew.steer(0, 0, 0, 0, 0);
        else state.settle = false;
        door.update(dt, false);
        return;
      }
      if (state.phase === "opening" || state.phase === "walking") {
        state.t += dt;
        const moved = Math.hypot(p.x - state.x, p.z - state.z);
        const lost = player !== state.cave || moved > 1.2 || state.t > LIMIT;
        if (lost) { crew.steer(0, 0, 0, 0, 0); set("idle"); state.wanted = false; door.update(dt, false); return; }
        state.x = p.x; state.z = p.z;
        door.update(dt, true);
        const o = pilot.orbit, heading = sign < 0 ? F.ry : F.ry + Math.PI;
        o.tYaw = o.yaw + Math.atan2(Math.sin(heading - o.yaw), Math.cos(heading - o.yaw));
        // It walks up from wherever it stands while the doors open, stopping only if it reaches them still shut.
        if (state.phase === "opening") {
          if (door.k < GRACE && d < TOUCH) { crew.steer(0, 0, 0, 0, 0); return; }
          if (door.k >= GRACE) set("walking");
        }
        const to = F.plane + sign * AHEAD + along, target = to, side = across * 0.4;
        const dx = F.x + F.sr * target + F.cr * side - p.x, dz = F.z + F.cr * target - F.sr * side - p.z, m = Math.hypot(dx, dz) || 1;
        crew.steer(dx / m, dz / m, 0, 1, 0, SPEED);
        // Where there is room past the doors the view comes in close and through the doorway before the switch.
        if (through) o.tDist = Math.min(o.tDist, VIEW_DIST);
        if (through ? d < -PAST && (sign * eyeAlong >= 0.3 || -d >= maxPast || state.t > LIMIT - 1) : d < -PAST) {
          crew.steer(0, 0, 0, 0, 0);
          set("through");
          if (onThrough({ across, past: -d, pitch: o.pitch, dist: o.dist }) === false) { set("idle"); state.wanted = false; }
        }
        return;
      }
      if (state.phase === "through") { door.update(dt, true); return; }
      const near = d > -0.4 && d < FAR && Math.abs(across) < AM.DOOR.half + 0.7;
      const moved = state.seen ? Math.hypot(p.x - state.x, p.z - state.z) : 0, inward = state.seen && moved < Math.max(0.5, dt * 12) ? ((-sign * ((state.x - F.x) * F.sr + (state.z - F.z) * F.cr - F.plane)) - d) / Math.max(dt, 1e-3) : 0;
      state.x = p.x; state.z = p.z; state.seen = true;
      if (near && !state.ready && !state.busy && !state.failed) load();
      const atDoor = near && d < TOUCH;
      if (state.ready && near && (state.wanted || atDoor && inward > 0.2) && Math.abs(p.y - player.baseY - (F.floor || 0)) < 0.3) {
        state.wanted = false;
        state.t = 0; state.cave = player;
        set("opening");
      } else if (!near) state.wanted = false;
      door.update(dt, false);
    };
    // `from` is how far past the door the Ooga now stands: the walk carries it `ON_PAST` farther at least before it hands
    // back, and far enough that the view comes through the doorway behind it (`viewPast`).
    const arrive = (crossing, player, yaw, from = crossing.past) => {
      state.t = 0; state.cave = player; state.yaw = yaw; state.ready = true; door.set(true);
      state.stopAt = Math.max(ARRIVE, from + ON_PAST, crossing.dist * Math.cos(crossing.pitch) + VIEW_CLEAR);
      state.seen = false;
      set("arriving");
    };
    const reset = () => { state.wanted = state.seen = state.settle = false; state.busy = false; set("idle"); };
    return { state, update, ask, arrive, reset, load, get phase() { return state.phase; }, get holding() { return state.phase === "opening" || state.phase === "walking" || state.phase === "through" || state.phase === "arriving"; } };
  };

  BL.arcadeDoors = { create, walk, ARRIVE, PAST };
})();
