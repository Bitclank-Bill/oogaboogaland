// The Genesis Voyage's driven boat, pure and fixed-step so Node can check it: throttle, steering, boost, drag, a top
// speed per era boat (genesis-world.js BOATS), soft collision with the sea's land and walls, and which dock it lies
// at. scene-genesis.js feeds it the controls and draws it. Allocation-free after `create`.
(() => {
  "use strict";
  const BL = window.BL = window.BL || {};
  const STEP = 1 / 60, MAX_STEPS = 8;
  // Boost multiplies the top speed and the push; drag eases a coasting boat to a stop; a bump keeps a share of speed.
  const BOOST = 1.75, DRAG = 0.9, REVERSE = 0.4, BUMP_KEEP = 0.25, RADIUS = 1.1, DOCK_SPEED = 2.2;
  const create = (world, { x = 0, z = 0, heading = 0 } = {}) => {
    const s = { x, z, heading, speed: 0, kind: "skiff", boosting: false, bumps: 0, dock: -1, era: -1 };
    const input = { throttle: 0, steer: 0, boost: false };
    let acc = 0;
    const step = (dt) => {
      const b = world.BOATS[s.kind], boost = input.boost && input.throttle > 0;
      const top = b.top * (boost ? BOOST : 1), push = b.accel * (boost ? BOOST : 1);
      s.boosting = boost;
      if (input.throttle > 0) s.speed = Math.min(top * input.throttle, s.speed + push * input.throttle * dt);
      else if (input.throttle < 0) s.speed = Math.max(-b.top * REVERSE, s.speed + push * input.throttle * dt);
      // Drag always applies; above the top speed (after boost ends) it bites harder.
      const over = Math.abs(s.speed) > top ? 3 : 1;
      s.speed -= Math.sign(s.speed) * Math.min(Math.abs(s.speed), DRAG * over * dt * (input.throttle === 0 ? 1.6 : 0.6));
      // Steering needs way on: a stopped boat barely turns, and reversing turns the other way.
      const way = Math.min(1, Math.abs(s.speed) / 2 + 0.15);
      s.heading += input.steer * b.turn * way * (s.speed < 0 ? -1 : 1) * dt;
      s.x += Math.sin(s.heading) * s.speed * dt;
      s.z += Math.cos(s.heading) * s.speed * dt;
      if (world.collide(s, RADIUS)) { s.speed *= BUMP_KEEP; s.bumps++; }
    };
    // Advances by `dt` in fixed steps; returns the steps taken.
    const update = (dt) => {
      acc = Math.min(acc + dt, STEP * MAX_STEPS);
      let n = 0;
      while (acc >= STEP) { step(STEP); acc -= STEP; n++; }
      s.era = world.eraAt(s.x, s.z);
      s.dock = Math.abs(s.speed) < DOCK_SPEED ? world.dockAt(s.x, s.z) : -1;
      return n;
    };
    // Puts the boat somewhere at rest (a jump, the Tour, a fresh visit).
    const place = (px, pz, heading) => { s.x = px; s.z = pz; s.heading = heading; s.speed = 0; acc = 0; s.era = world.eraAt(px, pz); s.dock = world.dockAt(px, pz); };
    const stop = () => { s.speed = 0; input.throttle = input.steer = 0; input.boost = false; };
    return { state: s, input, update, place, stop };
  };
  BL.genesisBoat = { create, STEP, BOOST, RADIUS, DOCK_SPEED };
})();
