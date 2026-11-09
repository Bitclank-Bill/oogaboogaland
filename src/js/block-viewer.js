// The viewing chairs for Block Frenzy's live rounds: a row of plain chairs in a blank white space above the game, as
// light as a page can be. Loaded only when someone goes to watch (`data-defer="block-viewer"`). A viewer has no body,
// sends no input or position and is local to its own page; it receives the host's frames at half rate.
(() => {
  "use strict";
  const BL = window.BL, M = BL.models;
  const COUNT = 5, GAP = 1.6, HEIGHT = 46, OUT = 0.82;
  const buildChairs = (createNode, addChild, parent, arena) => {
    const seat = M.box({ w: 0.9, h: 0.1, d: 0.9, color: "#d9d9d9" }), back = M.box({ w: 0.9, h: 0.9, d: 0.1, color: "#d9d9d9" });
    const group = createNode({ position: { x: 0, y: HEIGHT - 2.1, z: arena.L * OUT } });
    for (let i = 0; i < COUNT; i++) {
      const x = (i - (COUNT - 1) / 2) * GAP;
      addChild(group, createNode({ geometry: seat, position: { x, y: 0, z: 0 } }), createNode({ geometry: back, position: { x, y: 0.5, z: 0.4 } }));
    }
    addChild(parent, group);
    return group;
  };
  // The middle chair, looking down at the field; a drag looks about, and nothing else moves the view.
  const look = (camera, arena, yaw, pitch, setVec) => {
    camera.fov = 50 * Math.PI / 180;
    const z = arena.L * OUT, down = 0.72 + pitch, turn = Math.PI + yaw;
    setVec(camera.position, 0, HEIGHT, z);
    setVec(camera.target, Math.sin(turn) * Math.cos(down) * 60, HEIGHT - Math.sin(down) * 60, z + Math.cos(turn) * Math.cos(down) * 60);
  };
  // A flat white backdrop in place of the sky: no clouds, sun disc, stars, fog or bloom to compute. Allocates nothing.
  const white = (opts) => {
    for (const key of ["clear", "horizon", "zenith", "sky"]) opts[key].fill(1);
    opts.clouds = 0; opts.stars = 0; opts.bloomStrength = 0; opts.fogNear = 1e4; opts.fogFar = 2e4; opts.sunStrength = 0;
  };
  BL.blockViewer = { buildChairs, look, white };
})();
