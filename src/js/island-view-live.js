// The island view's 3D view (island-view.js; docs/ooga-chat-hosts.md, "The island view"), as the Observatory's screens
// are camera feeds (observatory-cameras.js): the game's own renderer (gl-renderer.js) on the strip's own canvas,
// drawing Main Island as a chat's copy of it shows it, from the baked scenery (island-scene.js: the ground and the
// pile, and as the viewer's tier allows the props, the trees and the small details), with each walking speaker as their
// own Ooga (models.js `caveman` over characters.js `traitsFor`, as the island builds them, worn wardrobe aside), standing
// where the chat says they are and swinging its arms and legs as it walks, under the light the map was baked in
// (island-view-data.js). The viewer turns, tips, pans and zooms the camera round the island (`orbit`, `pan`, `zoom`,
// `reset`), held to the island and above the sea. Nothing is captured or sent: it is drawn in the viewer's own
// browser, only when `render` is called. Ooga Chat fetches this, the renderer's code and the scenery only for a device
// the island view chooses 3D for. `prepare(dir, tier)` resolves to the scenery (`{ tier, layers, mbps }`), fetched
// once a page; `create(canvas, { scenery, data, quality })` returns `{ place(i, x, y, z, yaw, on, name), render(),
// project(x, y, z, out), resize(), orbit(dx, dy), pan(dx, dy), zoom(k), reset(), setQuality(q), moved, dispose() }`.
(() => {
  "use strict";
  const BL = window.BL = window.BL || {};
  const SLOTS = 32;
  // Where the camera starts (south of the island and above it, looking at the meadow) and how far it may go.
  const HOME = Object.freeze({ yaw: 0, pitch: 0.69, distance: 94, x: 0, y: -2, z: 2 });
  const DISTANCE_MIN = 10, DISTANCE_MAX = 170, PITCH_MIN = 0.12, PITCH_MAX = 1.5, REACH = 75;
  let scenery = null;
  const prepare = (dir, tier = null) => scenery ||= BL.islandScene.load(dir, tier).catch((error) => { scenery = null; throw error; });
  // A walk's swing: the stride (radians a metre walked) and how far the legs and arms reach.
  const STRIDE = 2.6, LEG_SWING = 0.55, ARM_SWING = 0.4;
  const create = (canvas, { scenery: baked, data, quality = "low" }) => {
    const { createNode, addChild, removeChild, updateWorld, createCamera } = BL.scene;
    const renderer = BL.glRenderer.createRenderer(canvas, { quality });
    const root = createNode();
    // The island's own models, made once a page and shared by every view made after, each stood in its places: copies
    // of one model are one instanced draw, as on the island.
    baked.geometries ||= baked.layers.map((layer) => layer.meshes.map((mesh) => BL.islandScene.geometry(mesh)));
    baked.layers.forEach((layer, k) => { for (const place of layer.places) addChild(root, BL.islandScene.node(place, baked.geometries[k][place.mesh])); });
    // A slot a walker: their Ooga, built the first time a name comes to it (another name builds anew), its hip from the
    // build, and its walk's phase from the ground it has covered.
    const slots = [];
    for (let i = 0; i < SLOTS; i++) slots.push({ name: "", cave: null, hip: 0, phase: 0, x: 0, z: 0 });
    const ooga = (slot, name) => {
      if (slot.cave && slot.name === name) return slot.cave;
      if (slot.cave) removeChild(root, slot.cave.root);
      slot.name = name;
      slot.cave = BL.models.caveman(BL.characters.traitsFor(name));
      slot.hip = slot.cave.root.position.y;
      slot.phase = 0;
      addChild(root, slot.cave.root);
      return slot.cave;
    };
    const swing = (cave, k, phase) => {
      const p = cave.parts, a = Math.sin(phase) * k;
      if (p.legL) p.legL.rotation.x = a * LEG_SWING;
      if (p.legR) p.legR.rotation.x = -a * LEG_SWING;
      if (p.armL) p.armL.rotation.x = -a * ARM_SWING;
      if (p.armR) p.armR.rotation.x = a * ARM_SWING;
    };
    const camera = createCamera({ fov: 40, near: 1, far: 900 });
    const view = { ...HOME };
    const opts = { ...data.light, lights: null, lightCount: 0, shadowCenter: { x: 0, y: 0, z: 0 }, shadowExtent: 90 };
    const self = {
      moved: true,
      // Slot `i`'s walker at their feet (`y`) and heading, as `name`'s Ooga; `on` false puts it away.
      place(i, x, y, z, yaw, on, name = "") {
        const slot = slots[i];
        if (!on) { if (slot.cave && slot.cave.root.visible) { slot.cave.root.visible = false; self.moved = true; } return; }
        const cave = ooga(slot, name || "ooga"), node = cave.root;
        if (!node.visible) { node.visible = true; slot.x = x; slot.z = z; self.moved = true; }
        const step = Math.hypot(x - slot.x, z - slot.z);
        slot.x = x; slot.z = z;
        if (step > 1e-4 || node.position.y !== y + slot.hip || node.rotation.y !== yaw) self.moved = true;
        node.position.x = x; node.position.y = y + slot.hip; node.position.z = z;
        node.rotation.y = yaw;
        // Walking swings the limbs with the ground covered; standing, they settle.
        slot.phase += step * STRIDE;
        swing(cave, step > 1e-4 ? 1 : 0, slot.phase);
      },
      render() { updateWorld(root); self.moved = false; return renderer.render(root, camera, opts); },
      project: (x, y, z, out) => renderer.project(x, y, z, out),
      resize() { renderer.resize(); self.moved = true; },
      // A drag: round the island and up or down (radians).
      orbit(dx, dy) {
        view.yaw -= dx;
        view.pitch = Math.max(PITCH_MIN, Math.min(PITCH_MAX, view.pitch + dy));
        aim();
      },
      // A pan: the target across the ground by a share of the view (dx, dy in view widths).
      pan(dx, dy) {
        const k = view.distance * 0.9, c = Math.cos(view.yaw), s = Math.sin(view.yaw);
        view.x -= (dx * c + dy * s) * k;
        view.z -= (-dx * s + dy * c) * k;
        const r = Math.hypot(view.x, view.z);
        if (r > REACH) { view.x *= REACH / r; view.z *= REACH / r; }
        aim();
      },
      // Zoom: nearer below 1, farther above it.
      zoom(k) { view.distance = Math.max(DISTANCE_MIN, Math.min(DISTANCE_MAX, view.distance * k)); aim(); },
      reset() { Object.assign(view, HOME); aim(); },
      get atHome() { return view.yaw === HOME.yaw && view.pitch === HOME.pitch && view.distance === HOME.distance && view.x === HOME.x && view.z === HOME.z; },
      setQuality(q) { renderer.setQuality(q); self.moved = true; },
      get quality() { return renderer.quality; },
      get view() { return { ...view }; },
      dispose() { renderer.dispose(); root.children.length = 0; slots.length = 0; }
    };
    // The camera from the view: round its target at `distance`, `yaw` round the island from the south, `pitch` up.
    const aim = () => {
      const c = Math.cos(view.pitch), s = Math.sin(view.pitch);
      camera.position = { x: view.x + Math.sin(view.yaw) * c * view.distance, y: view.y + s * view.distance, z: view.z + Math.cos(view.yaw) * c * view.distance };
      camera.target = { x: view.x, y: view.y, z: view.z };
      camera.near = Math.max(0.3, view.distance / 60);
      self.moved = true;
    };
    renderer.resize();
    aim();
    return self;
  };
  BL.islandViewLive = { prepare, create, HOME };
})();
