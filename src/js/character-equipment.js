// Cosmetic headwear changes only this body's head and its removable hat nodes. Geometry is shared; poses,
// controls, health, weapons, hair and companions keep their identities. Unknown custom rigs keep their own look.
(() => {
  "use strict";
  const BL = window.BL, hats = BL.equipmentHats, { createNode, addChild, removeChild } = BL.scene;
  const recipes = new Map(), pending = new Map(), geometry = BL.models.scopedMap(), worn = new WeakMap();
  const CACHE_MAX = 64, DOWNLOAD_MAX = 8, TIMEOUT = 5000, HASH = /^[a-f0-9]{64}$/;
  // These three authored pieces sit on taller donor hair or a pumpkin. Seat their archived geometry on the
  // regular seven-cell crown; recipient fittings below then account for the actual head underneath them.
  const SEAT = Object.freeze({ "bitcoin-bill-straw": -2, "midy-machete-crown": -1, "rules-without-rulers-top-hat": -0.5 });
  const freeze = (value) => {
    if (value && typeof value === "object" && !Object.isFrozen(value)) {
      for (const child of Object.values(value)) freeze(child);
      Object.freeze(value);
    }
    return value;
  };
  const install = (version, archive) => {
    hats.validate(archive, archive.item);
    if (!HASH.test(version) || recipes.size >= CACHE_MAX && !recipes.has(version)) throw new Error("Hat cache capacity reached");
    const old = recipes.get(version);
    if (old && hats.encode(old) !== hats.encode(archive)) throw new Error("Immutable hat version changed");
    hats.accept(archive.item, version);
    if (!old) recipes.set(version, freeze(archive));
    return hats.get(archive.item, version);
  };
  const seed = (archives) => { for (const [version, archive] of Object.entries(archives)) install(version, archive); };
  const read = async (response) => {
    if (!response.ok || !(response.headers.get("content-type") || "").startsWith("application/json")
      || Number(response.headers.get("content-length")) > hats.MAX_BYTES || !response.body) throw new Error("Hat archive unavailable");
    const reader = response.body.getReader(), chunks = [];
    let size = 0;
    try {
      while (true) {
        const part = await reader.read(); if (part.done) break;
        size += part.value.byteLength;
        if (size > hats.MAX_BYTES) throw new Error("Hat archive too large");
        chunks.push(part.value);
      }
    } catch (error) { await reader.cancel().catch(() => {}); throw error; }
    finally { reader.releaseLock(); }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const part of chunks) { bytes.set(part, offset); offset += part.byteLength; }
    return bytes;
  };
  const load = (item, version) => {
    if (item === "none" && version === null) return Promise.resolve(hats.get(item, version));
    if (!hats.current(item) || !HASH.test(version || "")) return Promise.reject(new Error("Unsupported hat version"));
    if (recipes.has(version)) return recipes.get(version).item === item ? Promise.resolve(hats.get(item, version)) : Promise.reject(new Error("Hat identity mismatch"));
    if (pending.has(version)) return pending.get(version).then((record) => { if (record.id !== item) throw new Error("Hat identity mismatch"); return record; });
    if (pending.size >= DOWNLOAD_MAX || recipes.size >= CACHE_MAX) return Promise.reject(new Error("Hat cache capacity reached"));
    const controller = new AbortController(), timer = setTimeout(() => controller.abort(), TIMEOUT);
    const task = (async () => {
      const response = await fetch(`/api/equipment/hats/${version}.json`, { credentials: "omit", redirect: "error", signal: controller.signal,
        headers: { accept: "application/json" } });
      const bytes = await read(response), digest = await crypto.subtle.digest("SHA-256", bytes);
      const hash = [...new Uint8Array(digest)].map((n) => n.toString(16).padStart(2, "0")).join("");
      if (hash !== version) throw new Error("Hat archive integrity mismatch");
      const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes), archive = JSON.parse(text);
      hats.validate(archive, item);
      if (hats.encode(archive) !== text) throw new Error("Hat archive is not canonical");
      return install(version, archive);
    })().finally(() => { clearTimeout(timer); pending.delete(version); });
    pending.set(version, task);
    return task;
  };
  hats.load = load;
  hats.loaded = (item, version) => item === "none" && version === null || recipes.get(version)?.item === item;
  const supported = (cave) => {
    if (!cave?.parts?.head || !cave.traits || !cave.headOpen || !cave.headClosed || typeof cave.bareHead !== "function") return false;
    const dress = cave.traits.dress || {}, look = cave.traits;
    // Nine authored hat owners have reviewed head fittings. Unreviewed replacement skulls, masks and models stay put.
    if (look.name.toLowerCase() === "w-s-bitcoin" || hats.items.some((row) => row.creator.toLowerCase() === look.name.toLowerCase())) return true;
    return !(dress.model || dress.skull || dress.crown || dress.headgear || dress.refine || look.gasMask || look.snout || look.pumpkin);
  };
  const meshes = (version) => {
    let found = geometry.get(version);
    if (!found) {
      found = recipes.get(version).nodes.map((node) => ({
        verts: [...node.geometry.verts], faces: node.geometry.faces.map((face) => ({ i: [...face.i], color: [...face.color], emissive: face.emissive })),
        lines: [], characterPart: true
      }));
      geometry.set(version, found);
    }
    return found;
  };
  const selection = (cave) => worn.get(cave)?.selection || null;
  const apply = (cave, selected) => {
    if (!supported(cave)) return selected === null;
    if (selected !== null && (!selected || !hats.has(selected.item, selected.version)
      || selected.item !== "none" && recipes.get(selected.version)?.item !== selected.item)) return false;
    const old = worn.get(cave);
    if (old && old.selection?.item === selected?.item && old.selection?.version === selected?.version || !old && selected === null) return true;
    const head = cave.parts.head, native = cave.parts.nativeHat || [];
    const own = old || { open: cave.headOpen, closed: cave.headClosed, portrait: cave.portraitHead, visible: native.map((node) => node.visible), selection: null, node: null };
    const closed = head.geometry === cave.headClosed;
    // Prepare the complete replacement before changing any live node.
    const bare = selected && cave.traits.dress?.hat ? cave.bareHead() : own;
    let node = null;
    if (selected && selected.item !== "none") {
      const archive = recipes.get(selected.version), shared = meshes(selected.version), h = cave.traits.height;
      node = createNode({ scale: { x: h, y: h, z: h } });
      // The crown author's own model has a reviewed 0.85-width head and a raised neck.
      if (cave.traits.name.toLowerCase() === "midy-machete" && BL.models.STYLE === "R") {
        node.scale.x *= 0.85; node.scale.y *= 0.85; node.scale.z *= 0.85; node.position.y = -(0.85 - 0.7) * h / 16;
      }
      if (cave.traits.name.toLowerCase() === "w-s-bitcoin" && BL.models.STYLE === "R") {
        // Its authored apple shell is 9 x 8 x 8 cells, centered half a cell behind the regular 7 x 7 x 6 head.
        // Fit to the shell, not the tusks or the stalk/leaf at y=11.1; those remain unchanged in its head geometry.
        node.scale.x *= 9 / 7; node.scale.z *= 8 / 6;
        node.position.y = h / 16; node.position.z = -0.5 * h / 16;
      }
      if (cave.traits.name.toLowerCase() === "bitcoin-bill" && BL.models.STYLE === "R") node.position.y = 2 * h / 16;
      node.position.y += (SEAT[selected.item] || 0) * node.scale.y / 16;
      for (let i = 0; i < archive.nodes.length; i++) {
        const source = archive.nodes[i], vector = (v) => ({ x: v[0], y: v[1], z: v[2] });
        addChild(node, createNode({ position: vector(source.position), rotation: vector(source.rotation), scale: vector(source.scale), geometry: shared[i] }));
      }
    }
    if (own.node) removeChild(head, own.node);
    for (let i = 0; i < native.length; i++) native[i].visible = selected ? false : own.visible[i];
    cave.headOpen = bare.headOpen || bare.open; cave.headClosed = bare.headClosed || bare.closed;
    cave.portraitHead = bare.portraitHead || bare.portrait;
    head.geometry = closed ? cave.headClosed : cave.headOpen;
    if (node) addChild(head, node);
    own.node = cave.equipmentHatNode = node;
    own.selection = selected ? Object.freeze({ item: selected.item, version: selected.version }) : null;
    worn.set(cave, own);
    return true;
  };
  BL.characterEquipment = { apply, clear: (cave) => apply(cave, null), supports: supported, selection, seed,
    get loaded() { return recipes.size; } };
})();
