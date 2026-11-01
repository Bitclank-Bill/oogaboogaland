// View assist for scenes without the hub's visibility stack: when scenery hides the visitor's own character from the
// camera, its outline is drawn over the view in the hub's own rim (camera-cover.js), fading in and out. A scene says
// only what is solid (`solidAt(x, y, z)`); the line from the eye to the body's middle and to its head is sampled every
// STEP, and the body counts as hidden while both are blocked. First person (closeMix 1) never outlines.
// `update` allocates nothing; call it after the scene's fx.drawOverlay, which clears the overlay. `dispose` in leave.
(() => {
  "use strict";
  const BL = window.BL = window.BL || {};
  const STEP = 0.2, MAX_STEPS = 160, SKIP_EYE = 0.1, SKIP_BODY = 0.45, FADE = 6, OPACITY = 0.22;
  const create = ({ overlay, solidAt }) => {
    const cover = BL.cameraCover.create(overlay);
    const state = { hidden: false, opacity: 0, outlined: false };
    const blocked = (eye, x, y, z) => {
      const dx = x - eye.x, dy = y - eye.y, dz = z - eye.z, length = Math.hypot(dx, dy, dz);
      const end = length - SKIP_BODY;
      if (end <= SKIP_EYE) return false;
      const steps = Math.min(MAX_STEPS, Math.ceil((end - SKIP_EYE) / STEP));
      for (let i = 0; i <= steps; i++) {
        const t = (SKIP_EYE + (end - SKIP_EYE) * i / steps) / length;
        if (solidAt(eye.x + dx * t, eye.y + dy * t, eye.z + dz * t)) return true;
      }
      return false;
    };
    const update = (camera, cave, dt, closeMix = 0) => {
      let hidden = false;
      if (cave && cave.root.visible && closeMix < 1) {
        const p = cave.root.position, feet = p.y - cave.baseY, h = cave.bodyHeight || cave.traits.height;
        hidden = blocked(camera.position, p.x, feet + h * 0.5, p.z) && blocked(camera.position, p.x, feet + h * 0.92, p.z);
      }
      state.hidden = hidden;
      const target = hidden ? OPACITY * (1 - closeMix) : 0;
      state.opacity += (target - state.opacity) * Math.min(1, dt * FADE);
      if (state.opacity < 0.005 || !cave) { state.opacity = 0; state.outlined = false; return; }
      cover.state.opacity = state.opacity;
      cover.draw(camera, cave.root, false, true, null, null, null, dt, 0, null, null, true);
      state.outlined = cover.state.outlined;
    };
    return { update, state, dispose: () => cover.dispose() };
  };
  BL.viewAssist = { create };
})();
