import { test } from "node:test";
import assert from "node:assert/strict";
import { webcrypto } from "node:crypto";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import { authorEquipmentHats, extractHat, hatHash, HAT_SOURCES, writeEquipmentHats } from "../../scripts/equipment-hats.mjs";

const root = fileURLToPath(new URL("../../", import.meta.url));
const read = (path) => readFileSync(join(root, path), "utf8");
const catalog = JSON.parse(read("src/equipment/hats/catalog.json"));
const archive = (row = catalog.items[0]) => JSON.parse(read(`src/equipment/hats/${row.current}.json`));
const fixture = (options = {}) => {
  const context = vm.createContext({ URLSearchParams, location: { search: "" }, crypto: webcrypto, TextDecoder, TextEncoder,
    AbortController, setTimeout, clearTimeout, fetch: options.fetch || (() => { throw new Error("unexpected fetch"); }) });
  vm.runInContext("window = globalThis", context);
  const script = (name) => vm.runInContext(read(`src/js/${name}.js`), context);
  for (const name of ["math", "scene", "models", "hero-body", "caves", "contributor-identities", "activity-repos", "characters"]) script(name);
  for (const [, , handle] of HAT_SOURCES) vm.runInContext(read(`src/characters/${handle}.js`), context);
  for (const handle of ["natalievarty", "MrHodlX", "w-s-bitcoin"]) vm.runInContext(read(`src/characters/${handle}.js`), context);
  vm.runInContext("BL.characters.add({handle:'Normal',joined:1,lastCommit:1}); BL.characters.add({handle:'Slim',joined:1,lastCommit:1,look:{build:'slim'}})", context);
  for (const name of ["roster-panel", "contributors", "equipment-hats", "equipment-hats.gen", "character-equipment"]) script(name);
  if (options.seed !== false) script("equipment-hat-data.gen");
  return { context, BL: context.BL, run: (code) => vm.runInContext(code, context),
    cave: (name) => context.BL.models.caveman(context.BL.contributors.traitsFor(name)),
    validate: (value, id) => { context.archiveText = JSON.stringify(value); context.item = id; return vm.runInContext("BL.equipmentHats.validate(JSON.parse(archiveText),item)", context); } };
};
const headTree = (node) => ({ position: node.position, rotation: node.rotation, scale: node.scale,
  geometry: node.geometry ? { verts: Array.from(node.geometry.verts), faces: node.geometry.faces, lines: node.geometry.lines } : null, children: node.children.map(headTree) });
const headGolden = (node) => {
  // Curved hats use sin/cos: their last floating-point bits vary by CPU/libm.
  // Nine decimal places retain geometry far below a voxel; topology and colors stay exact.
  const coordinate = (value) => { assert.ok(Number.isFinite(value)); return Number(value.toFixed(9)); };
  const vector = (value) => ({ x: coordinate(value.x), y: coordinate(value.y), z: coordinate(value.z) });
  const stable = (row) => ({ position: vector(row.position), rotation: vector(row.rotation), scale: vector(row.scale),
    geometry: row.geometry ? { verts: Array.from(row.geometry.verts, coordinate), faces: row.geometry.faces, lines: row.geometry.lines } : null,
    children: row.children.map(stable) });
  return hatHash(JSON.stringify(stable(node)));
};
// Captured with headGolden from untouched fa2a62e sources, before separating the nine headwear hooks.
const ORIGINAL_HEADS = {
  "Bitcoin-Bill": "51a59b324335063da9b6a71bc3897cc0029b4a1fe547904270b8d87757b4fa62",
  "Global-DSB": "eebf7d9e2cf1c44cd191f3660a76af854196ee9525b71739228db786df66343b",
  bc1gui: "769e9d43dc5e41b45136eb73305ad2a2cacf3a3a3c71db603e71880a0b9194fb",
  hotpixelgroup: "859fb2a20e0eb0225817849bdf8f71a8c3c59026765517e2804177bfdc16ab9d",
  itsLiran: "53c831a5c9e8c2b32e5e66d27c9bc1c440ae747b9fe916225b817482019a3a8b",
  johnstackton21m: "7704dddb2bca9aba561ba3632bee5b3f917ca5d1701bd6a7f8a373431d0128ef",
  "midy-machete": "5a113dc6b5ed8d8bc66712e273ba5c234a23c07044e7ed3b3ce71ee24c2a4610",
  "rules-without-rulers": "a5464a70476af841be342d59153f3d167303cb2aa7bbb286eabe3ae5579e0974",
  timechainb: "2faf14d8d872751cbecd89ac829b13eac64605d93886f5412d27700bea5baa17"
};

test("the nine authored heads retain their original geometry and clones own their hat nodes", () => {
  const f = fixture();
  for (const [, , handle] of HAT_SOURCES) {
    const a = f.cave(handle), b = f.cave(handle);
    assert.equal(headGolden(a.parts.head), ORIGINAL_HEADS[handle], handle);
    assert.notEqual(a.parts.nativeHat, b.parts.nativeHat);
    for (let i = 0; i < a.parts.nativeHat.length; i++) {
      assert.notEqual(a.parts.nativeHat[i], b.parts.nativeHat[i]);
      assert.equal(a.parts.nativeHat[i].geometry, b.parts.nativeHat[i].geometry);
      assert.equal(a.parts.nativeHat[i].parent, a.parts.head);
    }
  }
});

test("authored geometry goldens ignore only floating-point noise and retain shape, color and topology checks", () => {
  const tree = headTree(fixture().cave("johnstackton21m").parts.head), expected = headGolden(tree);
  const copy = () => JSON.parse(JSON.stringify(tree)), helmet = (row) => row.children.find((child) => child.geometry?.verts.length > 300);
  const noise = copy(); helmet(noise).geometry.verts[0] += 1e-15;
  assert.notEqual(JSON.stringify(noise), JSON.stringify(tree)); assert.equal(headGolden(noise), expected);
  const shape = copy(); helmet(shape).geometry.verts[0] += 1e-8; assert.notEqual(headGolden(shape), expected);
  const pose = copy(); pose.rotation.x += 1e-8; assert.notEqual(headGolden(pose), expected);
  const color = copy(); helmet(color).geometry.faces[0].color[0]++; assert.notEqual(headGolden(color), expected);
  const topology = copy(), indices = helmet(topology).geometry.faces[0].i;
  [indices[0], indices[1]] = [indices[1], indices[0]]; assert.notEqual(headGolden(topology), expected);
  const missing = copy(); missing.children.pop(); assert.notEqual(headGolden(missing), expected);
});

test("normal and slim recipients share immutable hats, while live roots, poses and anatomy remain their own", () => {
  const f = fixture(), a = f.cave("Normal"), b = f.cave("Slim"), render = f.BL.characterEquipment;
  const rootNode = a.root, head = a.parts.head, face = a.parts.face, open = a.headOpen;
  a.root.position.x = 9; a.root.rotation.y = 1.2; a.parts.head.rotation.x = 0.2; a.health = { value: 31 }; a.weapon = { ammo: 7 };
  for (const row of catalog.items) {
    const selected = { item: row.id, version: row.current };
    assert.equal(render.apply(a, selected), true); assert.equal(render.apply(b, selected), true);
    assert.equal(a.root, rootNode); assert.equal(a.parts.head, head); assert.equal(a.parts.face, face); assert.equal(a.headOpen, open);
    assert.equal(a.root.position.x, 9); assert.equal(a.root.rotation.y, 1.2); assert.equal(a.parts.head.rotation.x, 0.2);
    assert.equal(a.health.value, 31); assert.equal(a.weapon.ammo, 7);
    assert.equal(a.equipmentHatNode.children[0].geometry, b.equipmentHatNode.children[0].geometry);
    const unchanged = a.equipmentHatNode;
    for (let i = 0; i < 20; i++) assert.equal(render.apply(a, selected), true);
    assert.equal(a.equipmentHatNode, unchanged, "same revision never allocates another node");
    assert.equal(head.children.length, 2, "one face and one equipment group, without leaked old hats");
  }
  assert.equal(render.apply(a, null), true); assert.equal(a.equipmentHatNode, null); assert.equal(head.children.length, 1);
  assert.equal(a.headOpen, open); assert.equal(render.selection(a), null);
});

test("no hat and borrowed hats remove native headwear and restore exact authored geometry, including closed eyes", () => {
  const f = fixture(), render = f.BL.characterEquipment, row = catalog.items[0];
  for (const [, , handle] of HAT_SOURCES) {
    const a = f.cave(handle), original = a.headOpen, closed = a.headClosed, head = a.parts.head;
    const count = head.children.length, native = a.parts.nativeHat;
    head.geometry = closed;
    const before = hatHash(JSON.stringify(headTree(head)));
    assert.equal(render.apply(a, { item: "none", version: null }), true, handle);
    assert.ok(native.every((node) => node.visible === false));
    if (a.traits.dress.hat) assert.notEqual(a.headOpen, original, handle + " has a separate bare head");
    assert.equal(head.geometry, a.headClosed, "blink phase survives selection");
    assert.equal(render.apply(a, { item: row.id, version: row.current }), true);
    assert.equal(head.children.length, count + 1);
    assert.equal(render.apply(a, null), true); assert.equal(head.children.length, count);
    assert.equal(a.headOpen, original); assert.equal(a.headClosed, closed); assert.equal(head.geometry, closed);
    assert.ok(native.every((node) => node.visible === true));
    assert.equal(hatHash(JSON.stringify(headTree(head))), before, handle);
  }
});

test("unreviewed custom heads and unknown versions leave the existing appearance untouched", () => {
  const f = fixture(), render = f.BL.characterEquipment, selected = { item: catalog.items[0].id, version: catalog.items[0].current };
  for (const name of ["natalievarty", "MrHodlX"]) {
    const a = f.cave(name), before = JSON.stringify(headTree(a.parts.head));
    assert.equal(render.supports(a), false); assert.equal(render.apply(a, selected), false);
    assert.equal(render.apply(a, { item: "none", version: null }), false); assert.equal(JSON.stringify(headTree(a.parts.head)), before);
  }
  const normal = f.cave("Normal"); assert.equal(render.apply(normal, { item: "unknown", version: "a".repeat(64) }), false);
  assert.equal(f.BL.equipmentHats.has("none", undefined), false); assert.equal(normal.equipmentHatNode, undefined);
});

test("the maintainer's apple shell uses its measured fit and keeps face, stalk, leaf and blink geometry", () => {
  const f = fixture(), a = f.cave("w-s-bitcoin"), render = f.BL.characterEquipment;
  const head = a.parts.head, open = a.headOpen, closed = a.headClosed, before = JSON.stringify(open), h = a.traits.height;
  assert.equal(render.supports(a), true);
  for (const row of catalog.items) {
    assert.equal(render.apply(a, { item: row.id, version: row.current }), true);
    assert.equal(a.parts.head, head); assert.equal(a.headOpen, open); assert.equal(a.headClosed, closed);
    assert.ok(Math.abs(a.equipmentHatNode.scale.x / h - (row.id === "bitcoin-bill-straw" ? 1 : 9 / 7)) < 1e-12);
    assert.ok(Math.abs(a.equipmentHatNode.scale.z / h - (row.id === "bitcoin-bill-straw" ? 1 : 8 / 6)) < 1e-12);
    const at = { "bitcoin-bill-straw": -1, "midy-machete-crown": 0, "rules-without-rulers-top-hat": 0.5 };
    assert.ok(Math.abs(a.equipmentHatNode.position.y / h * 16 - (at[row.id] ?? 1)) < 1e-12);
    assert.equal(a.equipmentHatNode.position.z, -0.5 * h / 16);
    assert.equal(JSON.stringify(open), before);
  }
  assert.equal(render.apply(a, { item: "none", version: null }), true); assert.equal(a.headOpen, open);
  assert.equal(render.apply(a, null), true); assert.equal(head.children.length, 1);
});

test("the straw hat seats on the recipient crown while its original taller-haired owner keeps its authored height", () => {
  const f = fixture(), render = f.BL.characterEquipment, row = catalog.items[0], selected = { item: row.id, version: row.current };
  const donor = f.cave("Bitcoin-Bill"), native = donor.parts.nativeHat[0];
  for (const [name, height] of [["Normal", 7], ["Slim", 7], ["w-s-bitcoin", 8], ["Bitcoin-Bill", 9]]) {
    const cave = f.cave(name); assert.equal(render.apply(cave, selected), true);
    // The archived hat's shell begins nine cells above the donor's head pivot. Its seat must touch this crown.
    const node = cave.equipmentHatNode, shell = node.position.y + 9 / 16 * node.scale.y;
    assert.ok(Math.abs(shell / cave.traits.height * 16 - height) < 1e-12, name);
    // The already-roomy crown fits the apple without stretching the authored brim or feather spacing.
    // Compare the actual attachment vertices with the donor's native hat, normalized only for body height.
    const borrowed = node.children[0];
    assert.equal(borrowed.geometry.verts.length, native.geometry.verts.length);
    for (let i = 0; i < borrowed.geometry.verts.length; i++) if (i % 3 !== 1) {
      const axis = i % 3 === 0 ? "x" : "z";
      const original = native.geometry.verts[i] * native.scale[axis] / donor.traits.height;
      const fitted = borrowed.geometry.verts[i] * borrowed.scale[axis] * node.scale[axis] / cave.traits.height;
      assert.ok(Math.abs(fitted - original) < 1e-9, name + " retains the authored hat proportions");
    }
  }
});

test("new versions load in old tabs with digest, schema and item verification; older worn geometry stays available", async () => {
  const row = catalog.items[0], value = archive(row); value.nodes[0].geometry.faces[0].color = [240, 20, 30];
  const f = fixture({ fetch: async () => { calls++; return new Response(text, { headers: { "content-type": "application/json" } }); } });
  const text = f.BL.equipmentHats.encode(value), version = hatHash(text); let calls = 0;
  assert.equal(f.BL.equipmentHats.loaded(row.id, version), false);
  await Promise.all([f.BL.equipmentHats.load(row.id, version), f.BL.equipmentHats.load(row.id, version)]);
  assert.equal(calls, 1); assert.equal(f.BL.equipmentHats.loaded(row.id, version), true);
  const a = f.cave("Normal");
  assert.equal(f.BL.characterEquipment.apply(a, { item: row.id, version: row.current }), true);
  const oldGeometry = a.equipmentHatNode.children[0].geometry;
  assert.equal(f.BL.characterEquipment.apply(a, { item: row.id, version }), true);
  assert.notEqual(a.equipmentHatNode.children[0].geometry, oldGeometry);
  assert.equal(f.BL.characterEquipment.apply(a, { item: row.id, version: row.current }), true);
  assert.equal(a.equipmentHatNode.children[0].geometry, oldGeometry);
  await f.BL.equipmentHats.load(row.id, row.current); assert.equal(calls, 1);
});

test("malformed, oversized, substituted and noncanonical network archives cannot become equipment", async () => {
  const row = catalog.items[0], other = catalog.items[1];
  for (const mutate of [
    (v) => { v.item = other.id; }, (v) => { v.nodes[0].geometry.faces[0].i[0] = 1e9; },
    (v) => { v.nodes[0].geometry.faces[0].color[0] = -1; }, (v) => { v.nodes[0].scale[1] = -1; },
    (v) => { v.nodes[0].geometry.script = "alert(1)"; }, (v) => { v.nodes[0].geometry.verts[0] = null; },
    (v) => { v.nodes = Array(13).fill(v.nodes[0]); }
  ]) {
    const value = archive(row); mutate(value);
    const f = fixture({ seed: false, fetch: async () => new Response(text, { headers: { "content-type": "application/json" } }) });
    const text = f.BL.equipmentHats.encode(value), version = hatHash(text);
    await assert.rejects(f.BL.equipmentHats.load(row.id, version)); assert.equal(f.BL.equipmentHats.loaded(row.id, version), false);
  }
  for (const kind of ["digest", "noncanonical", "size", "redirect"]) {
    const value = archive(row), good = JSON.stringify(value) + "\n";
    const text = kind === "noncanonical" ? " " + good : good, version = kind === "digest" ? "a".repeat(64) : hatHash(text);
    const f = fixture({ seed: false, fetch: async () => new Response(text, { status: kind === "redirect" ? 302 : 200,
      headers: { "content-type": "application/json", ...(kind === "size" ? { "content-length": "1048576" } : {}) } }) });
    await assert.rejects(f.BL.equipmentHats.load(row.id, version)); assert.equal(f.BL.equipmentHats.loaded(row.id, version), false);
  }
});

test("authoring adds immutable versions and normal builds refuse edited sources, tampering or lost history", () => {
  const folder = mkdtempSync(join(tmpdir(), "ooga-hat-archives-"));
  try {
    mkdirSync(join(folder, "src/js"), { recursive: true }); mkdirSync(join(folder, "worker/src"), { recursive: true });
    for (const name of ["math", "scene", "models", "characters", "equipment-hats"]) cpSync(join(root, "src/js", name + ".js"), join(folder, "src/js", name + ".js"));
    cpSync(join(root, "src/characters"), join(folder, "src/characters"), { recursive: true });
    cpSync(join(root, "src/equipment"), join(folder, "src/equipment"), { recursive: true });
    const first = catalog.items[0], oldFile = join(folder, "src/equipment/hats", first.current + ".json"), bytes = readFileSync(oldFile, "utf8");
    const sourceFile = join(folder, "src/characters/Bitcoin-Bill.js");
    writeFileSync(sourceFile, readFileSync(sourceFile, "utf8").replace('"#d8c08a"', '"#d9c08a"'));
    assert.throws(() => writeEquipmentHats(folder), /explicitly archive/);
    const made = authorEquipmentHats(folder); assert.equal(made.versions, catalog.items.reduce((n, r) => n + r.versions.length, 0) + 1);
    assert.equal(readFileSync(oldFile, "utf8"), bytes);
    const indexFile = join(folder, "src/equipment/hats/catalog.json"), next = JSON.parse(readFileSync(indexFile, "utf8"));
    assert.notEqual(next.items[0].current, first.current); assert.ok(next.items[0].versions.includes(first.current));
    const changed = extractHat(folder, first.id); assert.equal(changed.version, next.items[0].current);
    writeFileSync(oldFile, bytes + " "); assert.throws(() => writeEquipmentHats(folder), /hash\/size/); writeFileSync(oldFile, bytes);
    next.items[0].versions = [next.items[0].current]; writeFileSync(indexFile, JSON.stringify(next));
    assert.throws(() => writeEquipmentHats(folder), /removed from its catalog/);
  } finally { rmSync(folder, { recursive: true, force: true }); }
});
