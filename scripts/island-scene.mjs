// Bakes the island view's 3D scenery (src/js/island-scene.js; docs/ooga-chat-hosts.md, "The island view"):
// `node scripts/island-scene.mjs`, after `npm run build`. The built hub in the suite's Chrome at midday on a fixed day,
// switched into a chat's copy mode (the hub's debug `copyMode`: Main Island alone, HQ's ramps open, every other mouth
// sealed, no other island, bridge, Oogatron, mirror or sign over a sealed mouth), with its Oogas, gorillas, Tess and
// clouds left out. Every node still drawn is sorted into the layers island-scene.js names: `base` the ground and the
// banana pile, `trees` and `trees-medium` the trees and bushes with foliage detail at their whole and medium meshes,
// `props` everything else a metre and more across, `details` the rest. Pictures, glass, clipped and projected surfaces,
// lines, anything that moves, anything out at sea (FAR) and anything buried (HQ, its basement, the caves' insides: more
// than 3 m under the ground on every side) are left out. Each layer keeps the hub's own models, each once with its
// normals, smooth shading, block detail and shadow casting, and every place one stands, written gzipped to
// src/ooga-chat/art/island-scene-<layer>.bin.gz (Ooga Chat's lazy art). Run it again when the island's look changes.
import { writeFileSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";
import { dispose, launch } from "../test/browser.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
// How far from the island's middle a mesh may stand (its rim is about 56 m out).
const FAR = 90;
const page = `file://${join(root, "oogaboogaland.html")}?debug=1&nosim=1&net=0&pos=0&welcome=0&hour=12&time=1200&day=80&rain=0&solo=1&islandworld=0`;
process.env.TZ = "UTC";
const b = await launch({ w: 800, h: 600 });
let baked;
try {
  await b.open(page);
  const t0 = Date.now();
  while (!(await b.evaluate(`!!window.__ooga && __ooga.renderedFrames >= 4 && __ooga.scene === "hub" && !document.getElementById("curtain")`).catch(() => false))) {
    if (Date.now() - t0 > 90000) throw new Error("island-scene: the hub did not draw");
    await b.sleep(100);
  }
  await b.sleep(1500);
  await b.evaluate(readFileSync(join(root, "src", "js", "island-scene.js"), "utf8"));
  baked = JSON.parse(await b.evaluate(`(() => {
    const hub = BL.scenes.hub, d = hub.debug, root = hub.root, C = BL.compactGeometry, S = BL.islandScene;
    if (typeof d.copyMode !== "function") throw new Error("island-scene: the hub has no copyMode debug handle");
    d.copyMode(true);
    const hidden = [];
    const hide = (node) => { if (node && node.visible) { node.visible = false; hidden.push(node); } };
    hide(d.tess && d.tess.root);
    for (const cave of __ooga.crew.list) hide(cave.root);
    for (const entry of __ooga.clankers.list) hide(entry.root);
    BL.scene.updateWorld(root);
    // What a distant view never needs, or cannot draw from colours alone.
    const skipped = (node, g) => node.matrixCloud || node.smokeOpacity !== undefined && node.smokeOpacity < 1 || g.characterPart || g.imageSurface || g.glass || g.glassShell
      || g.glassOpacity || g.projective || g.clipSlab || g.clipSlab2 || g.clipMinY !== undefined || g.clipMaxY !== undefined || g.clipPlane || g.lightBeam
      || g.reflector || g.mirrorRippleOnly || g.portalSurface || g.matrixGlyph || g.lakeBody || g.lakeWaves || g.surfaceOverlay
      || g.meshRig || g.dynamic;
    // The ground: the island's terrain (its meshes all share the largest one's vertices) and the banana pile.
    let terrain = null, most = 0;
    const largest = (node) => { if (!node || node.visible === false) return; const g = node.geometry, c = g && (g.compactGeometry ? g.compactGeometry.count : g.faces ? g.faces.length : 0);
      if (c > most) { most = c; terrain = g.verts; } for (const child of node.children || []) largest(child); };
    largest(root);
    const ground = (g) => g.verts === terrain || !!g.cutawaySource || !!g.pileRings;
    // Each layer: its models (the hub's own geometries, each once) and every place one stands.
    const layers = {}; for (const name of S.LAYERS) layers[name] = { index: new Map(), meshes: [], places: [] };
    let taken = 0, left = 0, deep = 0;
    // Underground, out of any view from above (HQ, its basement and the caves' insides): more than DEEP metres under the
    // island's ground on every side. A cliff's wall, open to the air on one side, stays. A model used once (the ground)
    // loses its buried faces; any other is dropped where it stands buried.
    const DEEP = 3, isl = d.island;
    const buried = (x, y, z) => isl.onLand(x, z) && [[0, 0], [1.5, 0], [-1.5, 0], [0, 1.5], [0, -1.5]].every(([dx, dz]) => isl.heightAt(x + dx, z + dz) > y + DEEP);
    const count = (g) => g.compactGeometry ? g.compactGeometry.count : g.faces ? g.faces.length : 0;
    // How many places each geometry stands in, for the buried faces' rule.
    const uses = new Map();
    const tally = (node) => { if (!node || node.visible === false) return; if (node.geometry) uses.set(node.geometry, (uses.get(node.geometry) || 0) + 1); for (const child of node.children || []) tally(child); };
    tally(root);
    // A geometry as a model: only the vertices its faces use, its faces (all drawn ones; supportOnly faces are collision),
    // its colours and emissive values, and the sidecars the renderer reads.
    const model = (g, m) => {
      const v = g.verts, remap = new Int32Array(v.length / 3).fill(-1), cur = C.createCursor(g), n = count(g), once = (uses.get(g) || 0) <= 1;
      const out = { smooth: !!g.smooth, castShadow: g.castShadow !== false, voxel: g.voxel ? Array.from(g.voxel) : null, positions: [], normals: g.normals ? [] : null,
        corners: [], indices: [], colors: [], emissive: [] };
      for (let f = 0; f < n; f++) {
        const face = C.readFace(g, f, cur);
        if (face.supportOnly) continue;
        const k = face.i.length;
        if (k < 3 || k > 255) continue;
        if (once && m) {
          let cx = 0, cy = 0, cz = 0;
          for (let j = 0; j < k; j++) { const i = face.i[j], x = v[i * 3], y = v[i * 3 + 1], z = v[i * 3 + 2]; cx += m[0] * x + m[4] * y + m[8] * z + m[12]; cy += m[1] * x + m[5] * y + m[9] * z + m[13]; cz += m[2] * x + m[6] * y + m[10] * z + m[14]; }
          if (buried(cx / k, cy / k, cz / k)) { deep++; continue; }
        }
        out.corners.push(k);
        for (let j = 0; j < k; j++) {
          const i = face.i[j];
          if (remap[i] < 0) {
            remap[i] = out.positions.length / 3;
            out.positions.push(v[i * 3], v[i * 3 + 1], v[i * 3 + 2]);
            if (out.normals) out.normals.push(g.normals[i * 3] || 0, g.normals[i * 3 + 1] || 0, g.normals[i * 3 + 2] || 0);
          }
          out.indices.push(remap[i]);
        }
        const c = face.color;
        out.colors.push(c[0] | 0, c[1] | 0, c[2] | 0);
        out.emissive.push(typeof face.emissive === "number" && face.emissive > 0 ? face.emissive : 0);
      }
      return out.corners.length ? out : null;
    };
    // A geometry standing under a node's world matrix, into a layer: its model made the first time it is seen there.
    const add = (name, g, m) => {
      const L = layers[name];
      let index = L.index.get(g);
      if (index === undefined) {
        const made = model(g, m);
        index = made ? L.meshes.push(made) - 1 : -1;
        L.index.set(g, index);
      }
      if (index >= 0) { L.places.push({ mesh: index, matrix: Array.from(m) }); taken++; }
    };
    const walk = (node) => {
      if (!node || node.visible === false) return;
      const g = node.geometry, m = node.world;
      if (g && count(g)) {
        // Instanced batches (gulls, grass tufts) have no single place, and the sea round the island (its boats) is not the island.
        if (skipped(node, g) || node.instanceData || Math.hypot(m[12], m[14]) > ${FAR}) left++;
        else if (ground(g)) add("base", g, m);
        else {
          const b = BL.scene.boundsOf(g), c = b.center, scale = Math.max(Math.abs(node.scale?.x ?? 1), Math.abs(node.scale?.y ?? 1), Math.abs(node.scale?.z ?? 1)), r = b.radius * scale;
          const x = m[0] * c[0] + m[4] * c[1] + m[8] * c[2] + m[12], y = m[1] * c[0] + m[5] * c[1] + m[9] * c[2] + m[13], z = m[2] * c[0] + m[6] * c[1] + m[10] * c[2] + m[14];
          if (r < 6 && buried(x, y + r, z)) { deep++; left++; }
          else if (g.foliageLods) { add("trees", g, m); add("trees-medium", g.foliageLods.medium || g, m); }
          else add(r >= 0.5 ? "props" : "details", g, m);
        }
      }
      for (const child of node.children || []) walk(child);
    };
    walk(root);
    for (const node of hidden) node.visible = true;
    d.copyMode(false);
    // Each layer encoded, as base64.
    const out = {}, stats = {};
    for (const name of S.LAYERS) {
      const L = layers[name], bytes = new Uint8Array(S.encode(L.meshes, L.places));
      let text = "";
      for (let i = 0; i < bytes.length; i += 0x8000) text += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
      out[name] = btoa(text);
      stats[name] = { meshes: L.meshes.length, places: L.places.length, faces: L.meshes.reduce((n, m) => n + m.corners.length, 0), bytes: bytes.length };
    }
    return JSON.stringify({ out, stats, taken, left, deep });
  })()`));
} finally {
  b.close();
  await dispose();
}
for (const [name, text] of Object.entries(baked.out)) {
  const plain = Buffer.from(text, "base64"), packed = gzipSync(plain, { level: 9 });
  writeFileSync(join(root, "src", "ooga-chat", "art", `island-scene-${name}.bin.gz`), packed);
  const s = baked.stats[name];
  console.log(`island-scene: ${name}: ${s.meshes} models in ${s.places} places, ${s.faces} faces, ${(plain.length / 1048576).toFixed(2)} MB, ${(packed.length / 1048576).toFixed(2)} MB gzipped`);
}
console.log(`island-scene: ${baked.taken} meshes taken, ${baked.left} left out, ${baked.deep} faces underground left out`);
