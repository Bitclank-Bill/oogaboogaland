// What an Ooga wears besides its hat (equipment-wardrobe.js), put on one body: the visitor's driven Ooga or another
// player's. Its character is built again with the worn pieces as data (models.js `templateFor`, keyed by what is worn;
// the character's own hooks run as ever, and nobody else's), and each of the body's nodes takes the geometry of the
// same node in that build, so its nodes, poses, gear, controls and companions keep their identities. A mask is a node
// of its own on the head, as a hat is (character-equipment.js), whose hat is lifted off while the body changes and put
// back on it. Unsupported pieces (a head of the character's own, a body it models itself) leave that part alone.
(() => {
  "use strict";
  const BL = window.BL, W = BL.equipmentWardrobe, { createNode, addChild, removeChild } = BL.scene;
  const worn = new WeakMap(), maps = new WeakMap(), weapons = new Map(), masks = new Map(), CACHE_MAX = 64;
  const own = (cave) => cave?.traits?.dress || {};
  const stockHead = (dress) => !(dress.model || dress.skull || dress.hat || dress.crown || dress.eyes || dress.mark || dress.refine);
  // Whether this body can wear a slot's pieces: head pieces only on the stock head, a beard and a mouth only on the
  // regular build's face, a mask on any head the character did not shape itself, body pieces on a body it does not model.
  const supports = (cave, id) => {
    const slot = W.SLOT.get(id), dress = own(cave);
    if (!slot || id === "hat" || !cave?.template || !cave.parts?.head) return false;
    if (id === "mask") return !(dress.model || dress.skull);
    if (slot.place === "head") return stockHead(dress) && (id !== "beard" && id !== "mouth" || !cave.traits.slim);
    if (slot.place === "body") return !dress.model;
    return !cave.traits.nunchaku;
  };
  const bounded = (map, key, make) => {
    let value = map.get(key);
    if (!value) {
      if (map.size >= CACHE_MAX) map.delete(map.keys().next().value);
      map.set(key, value = make());
    }
    return value;
  };
  const meshOf = (g, s) => {
    const geo = BL.models.geometry();
    for (let i = 0; i < g.verts.length; i++) geo.verts.push(g.verts[i] * s);
    for (const f of g.faces) geo.faces.push({ i: f.i.slice(), color: f.color.slice(), emissive: f.emissive });
    if (g.slingTurn !== undefined) geo.slingTurn = g.slingTurn;
    if (g.slingHiltUp) geo.slingHiltUp = true;
    return BL.models.characterGeometry(geo);
  };
  const EYES = Object.freeze({ eyeColor: undefined, eyeGlow: undefined, wideEyes: false, noPupils: false, eyeSize: undefined, eyeIn: undefined });
  const MOUTH = Object.freeze({ flatMouth: false, snout: false });
  // What a saved wardrobe means for this body: the build's `wardrobe` trait and its key, and the mask apart. Null while
  // a piece it wears is not on this page yet.
  const resolve = (cave, value) => {
    const head = {}, paint = [], keys = [], h = cave.traits.height;
    let weapon = null, axe, mask = null;
    for (const id of W.WORN) {
      const choice = value && value[id];
      if (!choice || !supports(cave, id)) continue;
      const piece = choice.item === "none" ? "none" : W.content(choice.version);
      if (!piece) return null;
      if (id === "mask") { mask = { piece, version: choice.version, size: choice.size || 100 }; continue; }
      keys.push(id + ":" + (choice.version || "none"));
      const slot = W.SLOT.get(id);
      if (slot.place === "body") paint.push([id, piece]);
      else if (id === "weapon") {
        weapon = { default: bounded(weapons, choice.version + ":" + h, () => meshOf(piece.geometry, h)), rest: piece.rest, carry: piece.carry };
        axe = piece.axe;
      } else if (piece === "none") head[id] = "none";
      else if (id === "eyes") head.eyes = { ...EYES, ...piece.traits };
      else if (id === "mouth") head.mouth = { ...MOUTH, ...piece.traits };
      else if (id === "beard") head.beard = { color: W.hexRgb(piece.color) };
      else if (id === "hair") head.hair = { ...piece, color: W.hexRgb(piece.color) };
      else head[id] = piece;
    }
    const traits = {};
    if (Object.keys(head).length) traits.head = head;
    if (paint.length) traits.paint = paint;
    if (weapon) traits.weapon = weapon;
    return { key: keys.join(","), traits, axe, mask, maskKey: mask ? (mask.version || "none") + "@" + mask.size : "" };
  };
  // Each node of a build, by the node of the character's first build it was made beside: two builds of one character
  // have the same nodes in the same places. Null where they do not.
  const IDENTITY = null;
  const mapping = (base, other) => {
    if (base === other) return IDENTITY;
    const known = maps.get(other);
    if (known && known.base === base) return known.map;
    const map = new Map();
    const walk = (a, b) => {
      if (a.children.length !== b.children.length) return false;
      map.set(a, b);
      for (let i = 0; i < a.children.length; i++) if (!walk(a.children[i], b.children[i])) return false;
      return true;
    };
    if (!walk(base.root, other.root)) return undefined;
    maps.set(other, { base, map });
    return map;
  };
  const at = (map, node) => map === IDENTITY ? node : map.get(node);
  const swap = (cave, state, target) => {
    const from = state.current, base = state.base, mapFrom = mapping(base, from), mapTo = mapping(base, target);
    if (mapFrom === undefined || mapTo === undefined) return false;
    const closed = cave.parts.head.geometry === cave.headClosed;
    const visit = (node) => {
      const source = BL.models.templateNode(node);
      if (source) {
        const a = at(mapFrom, source), b = at(mapTo, source);
        if (a && b && a !== b) {
          if (node.geometry === a.geometry) node.geometry = b.geometry;
          else if (from.tint && node.geometry && from.tint.get(a.geometry) === node.geometry) node.geometry = target.tint?.get(b.geometry) || b.geometry;
        }
      }
      for (const child of node.children) visit(child);
    };
    visit(cave.root);
    const weaponChanged = from.skins.club.default !== target.skins.club.default;
    cave.headOpen = target.headOpen; cave.headClosed = target.headClosed;
    cave.parts.head.geometry = closed ? target.headClosed : target.headOpen;
    cave.template = target; cave.portraitHead = undefined;
    cave.tint = target.tint; cave.gunHeadBounds = target.gunHeadBounds;
    if (cave.skins.club.default === from.skins.club.default) cave.skins.club.default = target.skins.club.default;
    cave.clubRest = target.clubRest; cave.clubCarry = target.clubCarry;
    if (weaponChanged) for (const key of ["club", "forearmR"]) {
      const node = cave.parts[key], source = node && BL.models.templateNode(node), shown = source && at(mapTo, source);
      if (!shown) continue;
      node.position.x = shown.position.x; node.position.y = shown.position.y; node.position.z = shown.position.z;
      node.rotation.x = shown.rotation.x; node.rotation.y = shown.rotation.y; node.rotation.z = shown.rotation.z;
    }
    return true;
  };
  const MASK_AT = [0, 2.5, 3];
  const setMask = (cave, state, mask) => {
    const head = cave.parts.head, native = cave.parts.nativeHeadgear || [], h = cave.traits.height;
    if (state.mask) { removeChild(head, state.mask); state.mask = null; }
    if (mask && !state.nativeVisible) state.nativeVisible = native.map((node) => node.visible);
    if (state.nativeVisible) for (let i = 0; i < native.length; i++) native[i].visible = mask ? false : state.nativeVisible[i];
    if (!mask) state.nativeVisible = null;
    else if (mask.piece !== "none") {
      const q = mask.size / 100, u = h / 16, node = createNode({ position: { x: MASK_AT[0] * u * (1 - q), y: MASK_AT[1] * u * (1 - q), z: MASK_AT[2] * u * (1 - q) },
        scale: { x: h * q, y: h * q, z: h * q } }), meshes = bounded(masks, mask.version, () => mask.piece.nodes.map((n) => meshOf(n.geometry, 1)));
      mask.piece.nodes.forEach((n, i) => addChild(node, createNode({ position: { x: n.position[0], y: n.position[1], z: n.position[2] },
        rotation: { x: n.rotation[0], y: n.rotation[1], z: n.rotation[2] }, scale: { x: n.scale[0], y: n.scale[1], z: n.scale[2] }, geometry: meshes[i] })));
      addChild(head, state.mask = node);
    }
  };
  // Dresses the body in a saved wardrobe (null: its own look). False while a piece is not on this page yet, or when the
  // body cannot be built again the same way (a likeness made otherwise), which leaves it as it was.
  const apply = (cave, value) => {
    if (!cave?.template) return value === null;
    let state = worn.get(cave);
    const r = resolve(cave, value);
    if (!r) return false;
    if (!state && !r.key && !r.maskKey) return true;
    if (state && state.key === r.key && state.maskKey === r.maskKey) return true;
    if (!state) worn.set(cave, state = { base: cave.template, current: cave.template, key: "", maskKey: "", mask: null, nativeVisible: null, axe: cave.traits.stoneAxe });
    if (state.key !== r.key) {
      let target = state.base;
      if (r.key) {
        const fresh = BL.contributors.traitsFor(cave.traits.name);
        if (fresh.height !== state.base.traits.height || !!fresh.slim !== !!state.base.traits.slim) return false;
        target = BL.models.templateFor({ ...fresh, wardrobe: r.traits, wardrobeKey: r.key, ...(r.axe === undefined ? null : { stoneAxe: r.axe }) });
      }
      const hat = BL.characterEquipment.detach(cave);
      const done = swap(cave, state, target);
      if (done) {
        state.current = target; state.key = r.key;
        cave.traits.stoneAxe = r.axe === undefined ? state.axe : r.axe;
      }
      if (hat) BL.characterEquipment.apply(cave, hat.selection, hat.size);
      if (!done) return false;
    }
    if (state.maskKey !== r.maskKey) { setMask(cave, state, r.mask); state.maskKey = r.maskKey; }
    BL.crew?.refreshBody(cave);
    return true;
  };
  const wearing = (cave) => { const state = worn.get(cave); return state && (state.key || state.maskKey) ? state.key + "|" + state.maskKey : ""; };
  BL.characterWardrobe = { apply, clear: (cave) => apply(cave, null), supports, wearing };
})();
