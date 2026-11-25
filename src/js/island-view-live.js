// The island view's 3D view (island-view.js; docs/ooga-chat-hosts.md, "The island view"), as the Observatory's screens
// are camera feeds (observatory-cameras.js): the game's own renderer (gl-renderer.js) on the strip's own canvas,
// drawing Main Island as a chat's copy of it shows it, from the baked scenery (island-scene.js: the ground and the
// pile, and as the viewer's tier allows the props, the trees and the small details), with each walking speaker as their
// own Ooga (models.js `caveman` over characters.js `traitsFor`, as the island builds them), standing where the chat
// says they are and swinging its arms and legs as it walks, its pet beside it walking too, under the light the map was
// baked in (island-view-data.js). Each is dressed as other players see it on the island (`dress`, from the chat's
// `looks`): its saved hat and wardrobe put on by the island's own modules (character-equipment.js,
// character-wardrobe.js), the weapon it has out in its hands (its primary, or the gun held before it) and its jetpack
// on its back. What a look needs that the page has not yet got is fetched once, only when a walker first wears it
// (`fetchGroup`: in Ooga Chat its `hats`, `wardrobe` and `gear` chunks, on the island the deferred `wardrobe`). The
// viewer turns, tips, pans and zooms the camera round the island (`orbit`, `pan`, `zoom`, `reset`), held to the island
// and above the sea. Nothing is captured or sent: it is drawn in the viewer's own
// browser, only when `render` is called. Ooga Chat fetches this, the renderer's code and the scenery only for a device
// the island view chooses 3D for. `prepare(dir, tier)` resolves to the scenery (`{ tier, layers, mbps }`), fetched
// once a page; `create(canvas, { scenery, data, quality })` returns `{ place(i, x, y, z, yaw, on, name, look), render(),
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
  // What a look may need that a page fetches only once a walker wears it, and how to tell it is here: Ooga Chat's
  // chunks (ooga-chat-chunks.js), or on the island its deferred code (deferred.js, where only the wardrobe waits). One
  // fetch a group a page, forgotten on a failure so the next look that needs it asks again.
  const HERE = { hats: () => !!BL.characterEquipment?.loaded, wardrobe: () => !!BL.equipmentWardrobe?.seeded, gear: () => !!BL.hubModels };
  const fetching = new Map();
  const fetchGroup = (group) => {
    let task = fetching.get(group);
    if (!task) {
      task = Promise.resolve().then(() => BL.oogaChatChunks ? BL.oogaChatChunks.load(group) : BL.deferred.load(group));
      fetching.set(group, task);
      task.catch(() => fetching.delete(group));
    }
    return task;
  };
  // A look's wardrobe as this page knows it, as equipment.js reads one: a choice this page's catalog does not hold (a
  // newer deploy's) is the character's own look here, never a reason to refuse the rest.
  const wardrobeOf = (value) => {
    const W = BL.equipmentWardrobe;
    if (!W || !value || typeof value !== "object" || Array.isArray(value)) return null;
    let out = null;
    for (const id of W.WORN) if (Object.hasOwn(value, id)) { try { (out ||= {})[id] = W.choice(id, value[id]); } catch { /* not this page's */ } }
    return out;
  };
  const wardrobeReady = (w) => { const W = BL.equipmentWardrobe; return !w || W.WORN.every((id) => !w[id] || w[id].item === "none" || w[id].item === "custom" || !!W.content(w[id].version)); };
  const hatOf = (e) => {
    const s = e && e.selection, hats = BL.equipmentHats;
    return hats && s && typeof s === "object" && hats.has(s.item, s.version) ? s : null;
  };
  // The gun held before the chest, its muzzle ahead, both arms raised to it (in heights: across, up and ahead of the
  // hip; the arms' reach forward and in).
  const GUN_AT = { x: 0.06, y: 0.31, z: 0.3 }, GUN_ARM = -1.25, GUN_IN = 0.3;
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
    for (let i = 0; i < SLOTS; i++) slots.push({ name: "", cave: null, hip: 0, phase: 0, pet: 0, x: 0, z: 0, look: undefined, held: -1, jet: null, worn: false, armLZ: 0, armRZ: 0 });
    const ooga = (slot, name) => {
      if (slot.cave && slot.name === name) return slot.cave;
      if (slot.cave) removeChild(root, slot.cave.root);
      slot.name = name;
      slot.cave = BL.models.caveman(BL.characters.traitsFor(name));
      slot.hip = slot.cave.root.position.y;
      slot.phase = slot.pet = 0;
      slot.look = undefined; slot.held = -1; slot.jet = null; slot.worn = false;
      slot.armLZ = slot.cave.parts.armL.rotation.z; slot.armRZ = slot.cave.parts.armR.rotation.z;
      addChild(root, slot.cave.root);
      return slot.cave;
    };
    // Dresses a slot's Ooga in a look (null: as it is built). Its hat and wardrobe go on as they go on another player's
    // body on the island; what is not on this page yet is fetched, and the look is put on again once it is here. A piece
    // still unknown then is left off.
    const dress = (slot, look) => {
      slot.look = look;
      const cave = slot.cave, e = look && look.e && typeof look.e === "object" ? look.e : null;
      const wardrobe = wardrobeOf(e && e.wardrobe), hat = hatOf(e), size = e && Number.isInteger(e.size) ? e.size : 100;
      const missing = !wardrobeReady(wardrobe) && !HERE.wardrobe() ? "wardrobe"
        : hat && hat.item !== "none" && !BL.equipmentHats.loaded(hat.item, hat.version) && !HERE.hats() ? "hats"
        : look && look.j === 1 && !cave.parts.jetpack && !HERE.gear() ? "gear" : null;
      if (missing) {
        fetchGroup(missing).then(() => { if (slot.cave === cave && slot.look === look) { slot.look = undefined; self.moved = true; } }, () => {});
        if (missing !== "gear") return;
      }
      // A worn height stands the Ooga on the same feet: its hip moves with it (character-wardrobe.js `swap`).
      const before = cave.root.position.y;
      if (BL.characterWardrobe) BL.characterWardrobe.apply(cave, wardrobe);
      if (BL.characterEquipment) BL.characterEquipment.apply(cave, hat, size);
      slot.hip += cave.root.position.y - before;
      slot.held = -1;
      self.moved = true;
    };
    // What it has out (a look's `w`: 1 its primary, 2 the gun; none, as it is built, its primary in hand): the primary
    // in its right hand, or the gun held before it, the other put away.
    const hold = (cave, held) => {
      const p = cave.parts, gun = held === 2;
      p.club.visible = !gun && held !== 0;
      p.gun.visible = gun;
      if (gun) {
        const h = cave.traits.height;
        p.gun.position.x = GUN_AT.x * h; p.gun.position.y = GUN_AT.y * h; p.gun.position.z = GUN_AT.z * h;
      }
    };
    // Its jetpack on its back while a look says it wears one: the character's own, or the island's (hub-models.js), seated
    // as crew.js `jetpackNode` and `seatJetpack` seat it, its flame out (a look does not say it flies).
    const wearJet = (slot, on) => {
      const cave = slot.cave, p = cave.parts;
      if (on && !slot.jet) {
        if (p.jetpack) slot.jet = p.jetpack;
        else if (BL.hubModels) {
          const geometry = BL.hubModels.jetpack(), h = cave.traits.height;
          slot.jet = createNode({ position: { x: 0, y: 0.06 * h, z: -0.18 * h }, scale: { x: h, y: h, z: h }, geometry });
          if (cave.modelled) slot.jet.position.z = -cave.back - BL.scene.boundsOf(geometry).max[2] * h;
          addChild(cave.root, slot.jet);
        } else return;
      }
      if (slot.jet) slot.jet.visible = on;
      if (on && p.jetFlame) p.jetFlame.visible = false;
      slot.worn = on;
    };
    // The arms swing with the walk but for one holding the gun, raised to it; the pet's legs, its own stride.
    const swing = (slot, k) => {
      const p = slot.cave.parts, a = Math.sin(slot.phase) * k, gun = slot.held === 2;
      if (p.legL) p.legL.rotation.x = a * LEG_SWING;
      if (p.legR) p.legR.rotation.x = -a * LEG_SWING;
      if (p.armL) { p.armL.rotation.x = gun ? GUN_ARM : -a * ARM_SWING; p.armL.rotation.z = slot.armLZ - (gun ? GUN_IN : 0); }
      if (p.armR) { p.armR.rotation.x = gun ? GUN_ARM : a * ARM_SWING; p.armR.rotation.z = slot.armRZ + (gun ? GUN_IN : 0); }
      const dog = p.dog;
      if (dog && dog.legs && dog.parent === slot.cave.root) BL.models.poseQuadruped(dog, 0, 0, Math.sin(slot.pet) * BL.models.QUAD_GAIT.swing * k, 0, 0);
    };
    const camera = createCamera({ fov: 40, near: 1, far: 900 });
    const view = { ...HOME };
    const opts = { ...data.light, lights: null, lightCount: 0, shadowCenter: { x: 0, y: 0, z: 0 }, shadowExtent: 90 };
    const self = {
      moved: true,
      // Slot `i`'s walker at their feet (`y`) and heading, as `name`'s Ooga dressed in `look`; `on` false puts it away.
      place(i, x, y, z, yaw, on, name = "", look = null) {
        const slot = slots[i];
        if (!on) { if (slot.cave && slot.cave.root.visible) { slot.cave.root.visible = false; self.moved = true; } return; }
        const cave = ooga(slot, name || "ooga"), node = cave.root;
        if (slot.look !== look) dress(slot, look);
        const held = look ? look.w === 1 || look.w === 2 ? look.w : 0 : -1;
        if (held !== slot.held) { slot.held = held; hold(cave, held); self.moved = true; }
        const jet = !!look && look.j === 1;
        if (jet !== slot.worn) { wearJet(slot, jet); self.moved = true; }
        if (!node.visible) { node.visible = true; slot.x = x; slot.z = z; self.moved = true; }
        const step = Math.hypot(x - slot.x, z - slot.z);
        slot.x = x; slot.z = z;
        if (step > 1e-4 || node.position.y !== y + slot.hip || node.rotation.y !== yaw) self.moved = true;
        node.position.x = x; node.position.y = y + slot.hip; node.position.z = z;
        node.rotation.y = yaw;
        // Walking swings the limbs with the ground covered; standing, they settle.
        slot.phase += step * STRIDE;
        slot.pet += step * BL.models.QUAD_GAIT.stride;
        swing(slot, step > 1e-4 ? 1 : 0);
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
