// Era 7's second upgrade (gv/upgrade2-era-7): motion and light. Rule checks in Node, no Chrome, no build.
// Run: node test/genesis-era-7-upgrade2.mjs   (VERBOSE=1 prints every PASS)
// Through the era file's own functions and terminals, on a recording kit: end states, Calm, holds, leaving the cave,
// the cues each event asks for, the frame's conservation bar, the records this upgrade adds, and that every story
// text, date, source and exhibit id is unchanged from the base (3901b004, read from git when available).
import { readFile } from "node:fs/promises";
import { runInNewContext } from "node:vm";
import { execFileSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const BASE = "3901b004e1a7fe895e9b0bdb6d7c97dcab84c41f";
const results = [];
const record = (name, ok, detail = "") => { results.push(ok); if (!ok || process.env.VERBOSE) console.log(`${ok ? "PASS" : "FAIL"} ${name}${ok ? "" : ` · ${detail}`}`); };

const MODULES = ["genesis-voyage", "genesis-world", "genesis-props", "genesis-exhibits", ...Array.from({ length: 7 }, (_, n) => `genesis-era-${n}`), "genesis-era-7-sync", "genesis-era-7-split", "genesis-era-7"];
const load = async (source = (f) => readFile(join(root, `src/js/${f}.js`), "utf8")) => {
  const context = { window: {}, crypto: globalThis.crypto };
  for (const f of MODULES) runInNewContext(await source(f), context);
  return context.window.BL;
};

// A recording kit: nodes with position, rotation, scale and visibility; every placed record counted; every cue kept.
const makeKit = (BL, cues) => {
  const W = BL.genesisWorld, props = {};
  let records = 0;
  const node = (o = {}) => Object.assign({ position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 }, visible: true, children: [] }, o,
    { position: { x: 0, y: 0, z: 0, ...(o.position || {}) }, rotation: { x: 0, y: 0, z: 0, ...(o.rotation || {}) }, scale: { x: 1, y: 1, z: 1 } });
  const kit = { era: W.ERAS[7], top: W.BANK_TOP, channel: W.CHANNEL, M: { box: (o) => o }, createNode: node, addChild: () => {},
    place: (n) => { records++; return n; }, label: () => ({ face: {}, back: {}, width: 1, height: 1 }), notify() {},
    solid: () => { records++; return node(); }, sign: () => { records += 3; return node(); }, obstacle() {},
    prop: (d) => { props[d.id] = d; return d; }, cue: cues ? (name) => cues.push(name) : undefined };
  return { kit, props, records: () => records };
};

const BL = await load(), E7 = BL.genesisEra7, EX = BL.genesisExhibits;
const cues = [], K = makeKit(BL, cues);
EX.eras[7].build(K.kit);
const def = EX.eras[7], v = E7.visit, mo = v.mo;
const state = { era: 7, walking: true, reading: false, x: 0, z: 0, calm: false };
const step = (seconds, dt = 1 / 60, s = state) => { for (let t = 0; t < seconds - 1e-9; t += dt) def.update(dt, 0, s); };
const term = (id) => { const t = K.props[id].onUse({}).terminal; return (line) => t.run(line).lines.join(" | "); };
const rowsLit = () => v.parts.rowLit.map((n) => n.visible ? 1 : 0).join("");
const wordsLit = () => mo.words.filter((n) => n.visible).length;

// --- The record case ---
{
  const g = term("e7-genesis");
  cues.length = 0;
  g("HEADER");
  const seen = [];
  for (let f = 0; f < 120; f++) { def.update(1 / 60, 0, state); const now = rowsLit(); if (seen[seen.length - 1] !== now) seen.push(now); }
  const one = seen.every((r, i) => i === 0 || [...r].filter((c) => c === "1").length === [...seen[i - 1]].filter((c) => c === "1").length + 1);
  record("record case: HEADER lights its five rows one at a time, in field order, and ends with all five lit",
    rowsLit() === "1111100" && one && seen.length === 5 && seen[0] === "1000000" && cues.includes("relay"), seen.join(" "));
  cues.length = 0;
  g("TEXT");
  def.update(1 / 60, 0, state);
  const early = wordsLit();
  let order = true, last = 0;
  for (let f = 0; f < 240; f++) { def.update(1 / 60, 0, state); const n = wordsLit(); if (n < last || n > last + 1) order = false; last = n; for (let w = 0; w < n; w++) if (!mo.words[w].visible) order = false; }
  record("record case: TEXT lights its row, then the headline's words one by one in reading order, then chimes once",
    rowsLit() === "0000010" && early === 0 && wordsLit() === E7.HEAD_WORDS.length && order && cues.filter((c) => c === "chime").length === 1, `${early} ${wordsLit()} ${cues}`);
  record("record case: the word tiles are the stored headline's own words, unchanged", E7.HEAD_WORDS.join(" ") === "The Times 03/Jan/2009 Chancellor on brink of second bailout for banks" && mo.words.length === 11);
  g("RESET"); step(0.1);
  record("record case: RESET dims every row and word", rowsLit() === "0000000" && wordsLit() === 0);
}
// --- Calm, holds and leaving ---
{
  const g = term("e7-genesis");
  g("TEXT"); def.update(1 / 60, 0, { ...state, calm: true });
  record("Calm: one frame shows the final state at once (row and every word lit)", rowsLit() === "0000010" && wordsLit() === E7.HEAD_WORDS.length);
  g("HEADER"); def.update(1 / 60, 0, state);
  const held = rowsLit(), heldCopy = JSON.stringify({ r: held, w: wordsLit(), plug: mo.plugs.map((p) => p.position.x) });
  // A hold (pause, workbench, menu or console) is the host not calling update: nothing moves meanwhile.
  record("holds: without update calls (pause, bench, menu, console) nothing advances", JSON.stringify({ r: rowsLit(), w: wordsLit(), plug: mo.plugs.map((p) => p.position.x) }) === heldCopy && held === "1000000");
  def.update(0, 0, state);
  record("holds: a zero-length frame changes nothing either", rowsLit() === held);
  def.active(false, state);
  record("active(false): leaving mid-reveal settles to the end state at once", rowsLit() === "1111100");
  const before = JSON.stringify({ r: rowsLit(), w: wordsLit(), bar: Array.from(mo.bar) });
  def.active(true, state); step(1);
  record("active(true): coming back resumes nothing (the settled state stays)", JSON.stringify({ r: rowsLit(), w: wordsLit(), bar: Array.from(mo.bar) }) === before);
  g("RESET"); step(0.2);
}
// --- The software desk ---
{
  const d = term("e7-desk"), plugIn = mo.plugs[1].position.x, y0 = mo.plugs[1].position.y;
  cues.length = 0;
  d("UNPLUG B"); def.update(1 / 60, 0, state);
  const mid = mo.plugs[1].position.x;
  step(0.6);
  const out = mo.plugs[1].position.x, low = mo.plugs[1].position.y;
  record("desk: UNPLUG B clicks once and its plug slides out of the rail and drops, smoothly, to rest",
    cues.filter((c) => c === "click").length === 1 && mid < plugIn && mid > out && out < plugIn - 0.3 && low < y0 - 0.2, `${plugIn} ${mid} ${out}`);
  d("ADD A"); def.update(1 / 60, 0, state);
  const flying = [0, 1, 2].map((k) => mo.packets[k].visible);
  step(0.7);
  record("desk: ADD A sends a packet to each plugged-in terminal (not the unplugged one), and the packets arrive",
    flying[0] && !flying[1] && flying[2] && mo.packets.every((p) => !p.visible), JSON.stringify(flying));
  cues.length = 0;
  d("PLUG B"); def.update(1 / 60, 0, state);
  const toB = mo.packets[1].visible;
  step(0.7);
  record("desk: PLUG B clicks, its plug slides home, and the record it lacked travels to it",
    cues.includes("click") && toB && Math.abs(mo.plugs[1].position.x - plugIn) < 1e-9 && Math.abs(mo.plugs[1].position.y - y0) < 1e-9 && /All three hold the same history/.test(d("COMPARE")));
  cues.length = 0;
  d("BAD"); def.update(1 / 60, 0, state);
  const flash = mo.refuse.visible;
  step(1);
  record("desk: BAD beeps once and flashes red at the rail's end, then goes dark", cues.filter((c) => c === "beep").length === 1 && flash && !mo.refuse.visible);
  d("UNPLUG C"); def.update(1 / 60, 0, { ...state, calm: true });
  record("desk: under Calm an unplugged plug is at rest out of the rail at once", mo.plugs[2].position.x < plugIn - 0.3);
  d("RESET"); step(1);
}
// --- The Peer Sync cabinet ---
{
  const sy = term("e7-sync");
  sy("RESET"); step(0.1); cues.length = 0;
  let out = "";
  for (let k = 0; k < 40 && !/link dropped/.test(out); k++) out = sy("WAIT");
  def.update(1 / 60, 0, state);
  const m = out.match(/Terminal ([ABC])'s link dropped/), name = m ? m[1] : "A";
  const off = v.cparts.winOff["ABC".indexOf(name)].visible;
  sy(`PLUG ${name}`); def.update(1 / 60, 0, state);
  record("Peer Sync cabinet: a dropped link greys its window and clicks; plugging it back clicks and lights it",
    !!m && off && cues.filter((c) => c === "click").length === 2 && !v.cparts.winOff["ABC".indexOf(name)].visible, `${out} ${cues}`);
  sy("RESET"); step(0.1);
}
// --- The counting frame and its conservation bar ---
{
  const f = term("e7-frame"), B = mo.barAt, total = () => mo.bar[0] + mo.bar[1] + mo.bar[2];
  const length = () => mo.barNodes.reduce((n, nd) => n + (nd.visible ? nd.scale.z : 0), 0);
  f("RESET"); step(1);
  cues.length = 0;
  f("MOVE 10 TO 1");
  let kept = true, moving = false;
  for (let k = 0; k < 90; k++) { def.update(1 / 60, 0, state); if (Math.abs(total() - 50) > 0.05) kept = false; if (mo.bar[1] > 0.5 && mo.bar[1] < 9.5) moving = true; }
  f("MOVE 40 TO 2"); step(1.5);
  record("frame: the conservation bar re-divides smoothly as beads move, its total length 50 units at every frame",
    kept && moving && Math.abs(mo.bar[1] - 10) < 1e-9 && Math.abs(mo.bar[2] - 40) < 1e-9 && mo.bar[0] === 0 && Math.abs(length() - 50 * B.unit) < 1e-6, `${Array.from(mo.bar)}`);
  record("frame: each move clacks, and reaching block 170's 10 + 40 chimes once", cues.filter((c) => c === "clack").length === 2 && cues.filter((c) => c === "chime").length === 1, cues.join(","));
  f("RESET"); def.update(1 / 60, 0, { ...state, calm: true });
  record("frame: RESET under Calm puts the whole bar back on the input at once", mo.bar[0] === 50 && mo.bar[1] === 0 && mo.bar[2] === 0);
}
// --- The computer corner ---
{
  const pc = E7.CL.pc, near = { ...state, x: pc.x - 1.2, z: pc.z }, far = { ...state, x: pc.x - 9, z: pc.z };
  cues.length = 0;
  step(0.5, 1 / 60, far);
  const r0 = mo.fan.rotation.x;
  step(0.5, 1 / 60, near); step(0.5, 1 / 60, near);
  const turned = mo.fan.rotation.x !== r0, blinkOn = [], c0 = mo.fan.rotation.x;
  for (let k = 0; k < 120; k++) { def.update(1 / 60, 0, near); blinkOn.push(mo.cursor.visible); }
  step(0.5, 1 / 60, far);
  record("computer corner: the fan turns, the cursor blinks, and the hum starts once on approach and stops once on leaving",
    turned && blinkOn.includes(true) && blinkOn.includes(false) && cues.join(",") === "hum-start,hum-stop", cues.join(","));
  const r1 = mo.fan.rotation.x;
  step(1, 1 / 60, { ...near, calm: true });
  record("computer corner: Calm holds the fan still and the cursor steady", mo.fan.rotation.x === r1 && mo.cursor.visible);
  cues.length = 0; step(0.2, 1 / 60, near); def.active(false, near);
  record("computer corner: leaving the cave stops the hum (it was on from the Calm visit)", cues.join(",") === "hum-stop" && mo.hum === false, cues.join(","));
}
// --- Idle, sound and records ---
{
  step(2);
  const busy = E7.animate(mo, v.live, v.cl, v.parts, v.cparts, 1 / 60, { ...state, x: 1e6, z: 1e6 });
  cues.length = 0; step(3, 1 / 60, { ...state, x: 1e6, z: 1e6 });
  record("idle: once everything has settled, animate reports nothing moving and asks for no sound", busy === false && cues.length === 0);
  const NAMES = new Set(["whir", "click", "clack", "relay", "chime", "thunk", "rustle-paper", "beep", "hum-start", "hum-stop"]);
  const src = await readFile(join(root, "src/js/genesis-era-7.js"), "utf8"), asked = [...src.matchAll(/say\("([a-z-]+)"\)/g)].map((m) => m[1]);
  record("sound: every cue asked for is one of the host's ten names", asked.length > 0 && asked.every((n) => NAMES.has(n)), asked.join(","));
  const BLn = await load(), Kn = makeKit(BLn, null);
  let quiet = true;
  try { BLn.genesisExhibits.eras[7].build(Kn.kit); Kn.props["e7-genesis"].onUse({}).terminal.run("TEXT"); for (let k = 0; k < 120; k++) BLn.genesisExhibits.eras[7].update(1 / 60, 0, state); } catch (e) { quiet = false; }
  record("sound: a kit without cue builds and animates silently", quiet && BLn.genesisEra7.visit.mo.words.every((n) => n.visible));
  const R = makeKit(BL, null);
  E7.buildMotion(R.kit, v.live, v.cl, v.parts, v.cparts);
  console.log(`records: the motion and light layer adds ${R.records()} scene records`);
  record("records: the motion and light layer adds a bounded number of scene records", R.records() > 0 && R.records() <= 60, String(R.records()));
}
// --- Nothing removed or reworded ---
{
  let base = null;
  try { base = execFileSync("git", ["-C", root, "show", `${BASE}:src/js/genesis-era-7.js`], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }); } catch (e) { base = null; }
  if (!base) record("unchanged: the base file could not be read from git (skipped)", true);
  else {
    const B0 = await load((f) => f === "genesis-era-7" ? base : readFile(join(root, `src/js/${f}.js`), "utf8")), O = B0.genesisEra7;
    const words = (E) => JSON.stringify({ sources: E.SOURCES, overview: E.OVERVIEW, exhibits: E.EXHIBITS, cluster: E.CLUSTER, split: E.SPLIT_EX, genesis: E.GENESIS, b170: E.B170, release: E.RELEASE, rows: E.ROWS });
    record("unchanged: every exhibit's text, date, source, connection and how-to is identical to the base", words(O) === words(E7));
    const K0 = makeKit(B0, null); B0.genesisExhibits.eras[7].build(K0.kit);
    const ids = (P) => Object.keys(P).sort().join(","), terms = (P) => Object.keys(P).sort().map((id) => { const r = P[id].onUse({}); return r.terminal ? r.terminal.banner.join("\n") : JSON.stringify(r.board || r.caption); }).join("\n---\n");
    record("unchanged: the same exhibit ids as the base", ids(K0.props) === ids(K.props), ids(K.props));
    const K1 = makeKit(BL, null), BLb = await load(); BLb.genesisExhibits.eras[7].build(K1.kit);
    record("unchanged: a fresh build's terminals and panels match the base word for word", terms(K0.props) === terms(K1.props));
  }
}
const passed = results.filter(Boolean).length;
console.log(`${passed}/${results.length} Era 7 upgrade 2 checks passed`);
process.exit(passed === results.length ? 0 : 1);
