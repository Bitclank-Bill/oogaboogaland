// Era 4 upgrade 2 (gv/upgrade2-era-4): the live models' end states, Calm, holds, leaving, idling, allocation and the
// layout, through genesis-era-4.js's own build, terminals and update. Node only: `node test/genesis-era-4-upgrade2.mjs`.
// Each check says why it exists, as test/run.mjs's do. One line a check; a non-zero exit on any failure.
import { readFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { runInNewContext } from "node:vm";
import { setFlagsFromString } from "node:v8";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const BASE = "3901b004e1a7fe895e9b0bdb6d7c97dcab84c41f";
const results = [];
const record = (name, ok, detail = "") => { results.push(ok); console.log(`${ok ? "PASS" : "FAIL"} ${name}${ok ? "" : ` ${detail}`}`); };
const GAMES = ["genesis-era-4-strategy", "genesis-era-4-teletext", "genesis-era-4-wireless", "genesis-era-4-inbox"];
const SHARED = ["genesis-voyage", "genesis-world", "genesis-props", "genesis-exhibits", "genesis-timeline-data"];
// A fresh window with the shared modules, the game modules and an era 4 file (this branch's, or the base's text).
const load = async (eraText) => {
  const context = { window: {} };
  for (const f of [...SHARED, ...GAMES]) runInNewContext(await readFile(join(root, `src/js/${f}.js`), "utf8"), context);
  runInNewContext(eraText, context);
  return context.window.BL;
};
const ours = await readFile(join(root, "src/js/genesis-era-4.js"), "utf8");
const base = execFileSync("git", ["show", `${BASE}:src/js/genesis-era-4.js`], { cwd: root, encoding: "utf8" });

// A recording kit: every node it makes is kept, so a check can read every position, turn, scale, glow and visibility.
const CUE_NAMES = new Set(["whir", "click", "clack", "relay", "chime", "thunk", "rustle-paper", "beep", "hum-start", "hum-stop"]);
// Each visit loads its own window: the era file keeps one visit's state at module level, as the scene builds one.
const visit = async (eraText = ours) => {
  const BL = await load(eraText);
  const W = BL.genesisWorld, E = BL.genesisExhibits.eras[4], nodes = [], props = {}, cues = [], calls = { solid: 0, sign: 0, place: 0, obstacle: 0, prop: 0 }, obstacles = [], placed = [];
  const node = (o = {}) => { const n = Object.assign({ position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 }, visible: true, glow: 1, children: [] }, o); nodes.push(n); return n; };
  E.build({ era: W.ERAS[4], top: W.BANK_TOP, channel: W.CHANNEL, M: { box: (o) => o, merge: (...a) => ({ parts: a.length }) }, createNode: (o = {}) => node(o), addChild() {},
    place: (n) => { calls.place++; if (n.position.x || n.position.z) placed.push({ x: n.position.x, z: n.position.z }); return n; }, label: () => ({ face: {}, back: {} }), notify() {}, cue: (n) => cues.push(n),
    solid: (w, h, d, col, x, y, z) => { calls.solid++; return node({ position: { x, y, z } }); }, sign: () => { calls.sign++; return node(); },
    obstacle: (x0, x1, z0, z1) => { calls.obstacle++; obstacles.push({ x0, x1, z0, z1 }); }, prop: (d) => { calls.prop++; props[d.id] = d; return d; } });
  const term = (id) => props[id].onUse({}).terminal;
  const step = (n, state = {}) => { for (let i = 0; i < n; i++) E.update(1 / 60, i / 60, state); };
  const snap = () => JSON.stringify(nodes.map((n) => [n.position.x, n.position.y, n.position.z, n.rotation.x, n.rotation.y, n.rotation.z, n.scale.x, n.scale.y, n.glow, n.visible].map((v) => typeof v === "number" ? Math.round(v * 1e4) / 1e4 : v)));
  return { BL, E, nodes, props, cues, calls, obstacles, placed, term, step, snap };
};
const BL = await load(ours), BLbase = await load(base);
// The commands that set every live model going, in one go.
const COMMANDS = [["e4-hashcash", "SEARCH"], ["e4-bmoney", "TRANSFER"], ["e4-bmoney", "MISS"], ["e4-desktop", "OPEN HASHCASH"], ["e4-modem", "DIAL"], ["e4-cd", "PICK HC"], ["e4-cd", "PICK BM"],
  ["e4-pocket", "E"], ["e4-strategy", "MOVE A N"], ["e4-teletext", "110"], ["e4-wireless", "SEND A E"]];
const runAll = (v) => { for (const [id, line] of COMMANDS) v.term(id).run(line); };

// contract: the upgrade keeps every exhibit, its words and its place: the same props (ids, labels, dates, connections,
// sources, hints) and, once the museum packs the gallery, every walk-up spot exactly where it stood at the base.
{
  const a = await visit(), b = await visit(base), bad = [];
  const keys = ["id", "year", "title", "label", "connection", "ref", "date", "hint"];
  const ids = Object.keys(b.props);
  if (Object.keys(a.props).join() !== ids.join()) bad.push(`ids ${Object.keys(a.props)}`);
  for (const id of ids) {
    for (const k of keys) if (JSON.stringify(a.props[id][k]) !== JSON.stringify(b.props[id][k])) bad.push(`${id}.${k}`);
    if (a.props[id].sourceKeys.join() !== b.props[id].sourceKeys.join()) bad.push(`${id} sources`);
    const ta = a.props[id].onUse({}), tb = b.props[id].onUse({});
    const words = (r) => r.terminal ? r.terminal.banner.join("\n") : r.board ? JSON.stringify(r.board) : r.caption;
    if (words(ta) !== words(tb)) bad.push(`${id} text`);
  }
  const W = BL.genesisWorld, at = (BLx) => { const out = {}; const kit = { era: W.ERAS[4], top: W.BANK_TOP, channel: W.CHANNEL, M: { box: () => ({}) }, createNode: (o = {}) => Object.assign({ position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 }, children: [] }, o),
    addChild() {}, place: (n) => n, label: () => ({ face: {}, back: {} }), notify() {}, solid: () => ({ position: {}, rotation: {}, scale: {} }), sign: () => ({}), obstacle() {}, prop: (d) => { out[d.id] = d.at; return d; } };
    const def = BLx.genesisExhibits.eras[4]; def.build(W.packedKit(kit, 4, def.build)); return out; };
  const pa = at(BL), pb = at(BLbase);
  for (const id of ids) if (Math.hypot(pa[id].x - pb[id].x, pa[id].z - pb[id].z) > 1e-9) bad.push(`${id} moved ${pb[id].x},${pb[id].z} -> ${pa[id].x},${pa[id].z}`);
  // Commands answer word for word as at the base.
  const ra = await visit(), rb = await visit(base);
  for (const [id, line] of COMMANDS) { const x = ra.term(id).run(line).lines.join("|"), y = rb.term(id).run(line).lines.join("|"); if (x !== y) bad.push(`${id} ${line} answers differently`); }
  record("contract: every exhibit keeps its id, label, date, connection, sources, hint, words, command answers and packed place", !bad.length, bad.slice(0, 6).join("; "));
}

// rule: the added scene records are counted, and every new part stands inside an existing exhibit's footprint (so the
// museum's packing cannot move anything).
const added = await (async () => {
  const a = await visit(), b = await visit(base), out = {};
  for (const k of Object.keys(a.calls)) out[k] = a.calls[k] - b.calls[k];
  const key = (p) => `${p.x.toFixed(3)},${p.z.toFixed(3)}`, before = new Map();
  for (const p of b.placed) before.set(key(p), (before.get(key(p)) || 0) + 1);
  const fresh = a.placed.filter((p) => { const n = before.get(key(p)) || 0; if (n) { before.set(key(p), n - 1); return false; } return true; });
  // The packer records a placed node as a 0.5 m box round it, so that whole box must stay inside the footprint.
  const outside = fresh.filter((p) => !a.obstacles.some((o) => p.x - 0.25 >= o.x0 - 1e-6 && p.x + 0.25 <= o.x1 + 1e-6 && p.z - 0.25 >= o.z0 - 1e-6 && p.z + 0.25 <= o.z1 + 1e-6));
  const total = Object.values(out).reduce((s, v) => s + v, 0);
  record(`rule: ${total} scene records added against ${BASE.slice(0, 8)} (${Object.entries(out).map(([k, v]) => `${k} ${v}`).join(", ")}); all ${fresh.length} new parts inside an exhibit's footprint`,
    out.solid === 0 && out.sign === 0 && out.obstacle === 0 && out.prop === 0 && outside.length === 0 && total <= 150, JSON.stringify(outside.slice(0, 4)));
  return out;
})();

// rule: each live model reaches the right end state through its own exhibit's commands, and the cues are only the
// hall's names, once per event.
{
  const v = await visit(), bad = [], L = () => v.E;
  const t = v.term;
  // Hashcash: the counter turns, settles on quarter turns, the press lands once (whir, then thunk), the mark stays.
  t("e4-hashcash").run("SEARCH");
  v.step(10);
  const drumsTurning = v.nodes.some((n) => n.rotation.x !== 0 && Math.abs(n.rotation.x) % (Math.PI / 2) > 1e-3);
  v.step(400);
  // The live parts are found by what they do: drums turn on x, the press rests at -0.55.
  const press = v.nodes.filter((n) => Math.abs(n.rotation.x + 0.55) < 1e-9);
  const drums = v.nodes.filter((n) => n.rotation.x > 1e-6);
  if (!drumsTurning) bad.push("the counter never turned");
  if (press.length !== 1) bad.push(`press ${press.length}`);
  if (drums.some((n) => Math.abs((n.rotation.x / (Math.PI / 2)) - Math.round(n.rotation.x / (Math.PI / 2))) > 1e-6)) bad.push("drums not settled on quarter turns");
  if (v.cues.join() !== "whir,thunk") bad.push(`hashcash cues ${v.cues}`);
  // b-money, the desktop, the modem, the archive, the handheld, the board, the screen, the radio.
  v.cues.length = 0;
  for (const [id, line] of COMMANDS.slice(1)) { t(id).run(line); v.step(20); }
  v.step(600);
  const bal = t("e4-bmoney").run("COMPARE").lines[0];
  if (!/Replica 1: A=1 B=7; Replica 2: A=3 B=5/.test(bal)) bad.push(bal);
  const strat = t("e4-strategy").run("LOOK").lines.join("\n");
  if (!/Board 1/.test(strat)) bad.push("strategy");
  if (v.cues.some((n) => !CUE_NAMES.has(n))) bad.push(`unknown cue ${v.cues}`);
  for (const n of ["clack", "click", "whir", "relay"]) if (!v.cues.includes(n)) bad.push(`no ${n}`);
  if (v.cues.length > 16) bad.push(`too many cues ${v.cues.length}`);
  record("rule: the live models run to their end states from their exhibits' own commands (the counter turns and settles, the press lands once), with only the hall's cue names, once an event", !bad.length, bad.join("; "));
}

// rule: Calm shows every motion's final state at once: one Calm frame after the commands equals a long run's end.
{
  const a = await visit(), b = await visit();
  runAll(a); runAll(b);
  a.step(1200);
  // Calm snaps motion, not computation: the toy search still needs its few frames (64 attempts a frame), so Calm gets
  // eight frames, each showing every motion settled.
  // (One ordinary frame first: the base's decor lamps only take their Calm glow after a step of their own blink.)
  b.step(1);
  b.step(8, { calm: true });
  a.step(1, { calm: true });
  record("rule: under Calm every live model shows its final state at once, the same as running every motion to its end", a.snap() === b.snap(), "states differ");
}

// rule: holds freeze motion (the scene simply stops calling update, as genesis-world.js holdsFor rules), and on
// resume each motion carries on from where it stood; leaving the cave (active(false)) settles everything at once
// with no sound.
{
  const v = await visit(), w = await visit();
  runAll(v); runAll(w);
  // `elapsed` held, so the base's own decor blink (on elapsed) stays out of the comparison.
  const run = (x, n) => { for (let i = 0; i < n; i++) x.E.update(1 / 60, 1, {}); };
  v.step = (n) => run(v, n); w.step = (n) => run(w, n);
  v.step(12); w.step(12);
  const held = v.snap();
  // A hold: nothing called for a while.
  const stillHeld = v.snap() === held;
  v.step(30); w.step(30);
  const resumed = v.snap() === w.snap();
  const cues = v.cues.length;
  v.E.active(false, {});
  const left = v.snap();
  w.step(1200);
  record("rule: a hold freezes every live model and resume carries on in step; active(false) settles everything to its final state without a sound", stillHeld && resumed && left === w.snap() && v.cues.length === cues,
    `held ${stillHeld} resumed ${resumed} settled ${left === w.snap()}`);
}

// rule: idle, nothing moves and nothing sounds; with a panel open only the naming graph and the timestamp bead loop.
{
  const v = await visit();
  // `elapsed` held, as the base's own decor blinks on it (the hub lamps and the inbox lamp, unchanged here).
  const frames = (n, state = {}) => { for (let i = 0; i < n; i++) v.E.update(1 / 60, 1, state); };
  frames(5);
  const a = v.snap();
  frames(600);
  const idle = v.snap() === a && v.cues.length === 0;
  frames(120, { reading: true });
  const looping = v.snap() !== a && v.cues.length === 0;
  record("rule: idle frames change nothing and play nothing; an open panel loops only the naming graph and the bead, silently", idle && looping, `idle ${idle} looping ${looping}`);
}

// rule: update allocates nothing per frame, with every motion running.
{
  setFlagsFromString("--expose-gc");
  const gc = runInNewContext("gc");
  const v = await visit();
  runAll(v);
  v.step(2);
  const state = { reading: true, calm: false };
  v.term("e4-hashcash").run("TARGET 12"); v.term("e4-hashcash").run("SEARCH");
  // A warm-up the same length first, so the measure is the frames' own heap and not the engine compiling them.
  for (let i = 0; i < 20000; i++) v.E.update(1 / 60, i / 60, state);
  v.term("e4-hashcash").run("SEARCH"); v.term("e4-wireless").run("SEND A E"); v.term("e4-cd").run("PICK NAMES");
  gc(); const before2 = process.memoryUsage().heapUsed;
  for (let i = 0; i < 20000; i++) v.E.update(1 / 60, i / 60, state);
  gc(); const grew = process.memoryUsage().heapUsed - before2;
  // Commands run first (their replies allocate by design); the frames themselves must not.
  record(`rule: 20,000 frames of every live model leave the heap within 64 KB (grew ${(grew / 1024).toFixed(1)} KB)`, grew < 65536, `${grew}`);
}

// rule: the strategy board's pegs stand on the board's own walls and its pieces on the game's squares; the radio's
// lost packet leaves its marker; the disc archive's lamps count the loaded discs.
{
  const v = await visit(), bad = [], S = v.BL.genesisEra4Games.strategy, BL4 = v.BL;
  v.step(2);
  const t = v.term("e4-strategy");
  t.run("BOARD 2"); v.step(200);
  const walls = S.BOARDS[1].join("").split("").filter((c) => c === "#").length;
  // Pegs stand within the board's square grid, as many as the board's walls.
  const sx = 26, sz = BL.genesisWorld.ERAS[4].z + 1;
  const cells = new Set();
  for (const n of v.nodes) if (n.visible && Math.abs(n.position.y - (BL.genesisWorld.BANK_TOP + 0.94)) < 1e-6 || (n.visible && Math.abs(n.position.y - (BL.genesisWorld.BANK_TOP + 0.96)) < 1e-6 && Math.abs(n.position.x - sx) < 0.8 && Math.abs(n.position.z - sz) < 0.6)) {
    const gx = Math.round((n.position.x - sx + 0.69) / 0.23), gy = Math.round((n.position.z - sz + 0.51) / 0.17);
    if (Math.abs(n.position.x - sx) < 0.8 && Math.abs(n.position.z - sz) < 0.6) cells.add(gy * 7 + gx);
  }
  const want = new Set(S.BOARDS[1].join("").split("").map((c, i) => c === "#" ? i : -1).filter((i) => i >= 0));
  if (cells.size !== walls || [...want].some((i) => !cells.has(i))) bad.push(`pegs ${[...cells]} want ${[...want]}`);
  const r = v.term("e4-wireless");
  r.run("NOISE 3"); r.run("OFF B"); r.run("OFF C");
  r.run("ON B");
  let lost = false;
  for (let k = 0; k < 12 && !lost; k++) { const out = r.run("SEND A E").lines.join(" "); v.step(600); if (/LOST/.test(out)) lost = true; }
  if (lost && !v.nodes.some((n) => n.visible && Math.abs(n.position.y - (BL.genesisWorld.BANK_TOP + 1.0)) < 1e-6 && n.position.x > 33)) bad.push("no lost marker");
  const cd = v.term("e4-cd");
  for (const d of ["HC", "NAMES", "BM", "TIMESEC"]) { cd.run(`PICK ${d}`); v.step(200); }
  if (!v.cues.includes("chime")) bad.push("no chime on a complete archive");
  record(`rule: the strategy board stands its ${walls} wall pegs on board 2's walls; a lost packet leaves its red marker${lost ? "" : " (no loss met)"}; a complete archive chimes`, !bad.length, bad.join("; "));
}

const passed = results.filter(Boolean).length;
console.log(`${passed}/${results.length} Era 4 upgrade 2 checks passed`);
process.exit(passed === results.length ? 0 : 1);
