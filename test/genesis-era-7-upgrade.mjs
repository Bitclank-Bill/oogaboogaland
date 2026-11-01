// Era 7's launch cluster (gv/upgrade-era-7): rule checks in Node, no Chrome and no build. Run: node test/genesis-era-7-upgrade.mjs
// It loads the Genesis modules as the page does (genesis-era-7-sync.js before genesis-era-7.js, the order the
// integrator is asked for) and checks, through the modules' own functions:
// - placement: every piece of Era 7 stands in its own museum gallery, clear of the old stream and reserved plots, and
//   the cluster adds at most 150 scene records;
// - identity: the six existing exhibit ids stay, the three new ones join, all context, each with a hint;
// - Peer Sync: a seed replays a run, a plugged terminal catches up exactly, refused records change nothing, a run is
//   bounded and winnable, the terminal answers bad input without throwing, and make(host) keeps the retro interface;
// - the counting frame: every move conserves the 50 beads, a refused move changes nothing, RESET restores, CHECK
//   matches 10 + 40;
// - without the sync module the era still builds, leaving only the cabinet out.
import { readFile } from "node:fs/promises";
import { runInNewContext } from "node:vm";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const results = [];
const record = (name, ok, detail = "") => { results.push({ name, ok }); if (!ok || process.env.VERBOSE) console.log(`${ok ? "PASS" : "FAIL"} ${name}${ok ? "" : ` · ${detail}`}`); };

const load = async (withSync) => {
  const context = { window: {}, crypto: globalThis.crypto };
  const files = ["genesis-voyage", "genesis-world", "genesis-props", "genesis-exhibits", ...Array.from({ length: 7 }, (_, n) => `genesis-era-${n}`), ...(withSync ? ["genesis-era-7-sync"] : []), "genesis-era-7"];
  for (const f of files) runInNewContext(await readFile(join(root, `src/js/${f}.js`), "utf8"), context);
  return context.window.BL;
};

// A recording kit: counts scene records (solid, placed node, sign's three), checks each piece against gallery 7 and the
// reserved plots, and keeps the props.
const buildEra7 = (BL) => {
  const W = BL.genesisWorld, M = W.MUSEUM, EX = BL.genesisExhibits, r = M.rects[7], reserved = W.reservedZones(7), bad = [], props = {};
  let records = 0;
  const inBay = (x, z, what) => { const p = M.toMuseum(7, x, z, {}); if (p.x < r.x0 - 0.05 || p.x > r.x1 + 0.05 || p.z < r.z0 - 0.05 || p.z > r.z1 + 0.05) bad.push(`${what} at ${x.toFixed(1)},${z.toFixed(1)} outside gallery 7`); };
  const clash = (x0, x1, z0, z1, what) => { for (const q of reserved) if (x0 < q.x1 && x1 > q.x0 && z0 < q.z1 && z1 > q.z0) bad.push(`${what} in the ${q.why} plot`); };
  const clearOfStream = (x0, x1) => x1 <= W.CHANNEL.x0 - 1.5 || x0 >= W.CHANNEL.x1 + 1.5;
  const node = (o = {}) => Object.assign({ position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 }, visible: true, children: [] }, o);
  const kit = { era: W.ERAS[7], top: W.BANK_TOP, channel: W.CHANNEL, M: { box: (o) => o }, createNode: (o = {}) => node(o), addChild: () => {},
    place: (n) => { records++; return n; }, label: () => ({ face: {}, back: {}, width: 1, height: 1 }), notify() {},
    solid: (w, h, d, c, x, y, z) => { records++; inBay(x - w / 2, z - d / 2, "a solid"); inBay(x + w / 2, z + d / 2, "a solid"); if (!clearOfStream(x - w / 2, x + w / 2)) bad.push(`a solid at ${x},${z} by the stream`); clash(x - w / 2, x + w / 2, z - d / 2, z + d / 2, `a solid at ${x.toFixed(1)},${z.toFixed(1)}`); if (y + h / 2 > W.BANK_TOP + 8) bad.push("too tall"); return node(); },
    sign: (t, sub, x, y, z) => { records += 3; inBay(x, z, `sign ${t}`); return node(); },
    obstacle: (x0, x1, z0, z1) => { inBay(x0, z0, "an obstacle"); inBay(x1, z1, "an obstacle"); clash(x0, x1, z0, z1, "an obstacle"); },
    prop: (d) => { const p = EX.checkProp(7, d); if (p) bad.push(p); inBay(d.at.x, d.at.z, d.id); clash(d.at.x - 0.3, d.at.x + 0.3, d.at.z - 0.3, d.at.z + 0.3, `${d.id}'s use point`); props[d.id] = d; return d; } };
  EX.eras[7].build(kit);
  return { props, bad, records: () => records, kit };
};

const BL = await load(true), E7 = BL.genesisEra7, S7 = BL.genesisEra7Sync;
const built = buildEra7(BL);
record("placement: every Era 7 piece stands in its own gallery, clear of the stream and reserved plots", built.bad.length === 0, built.bad.slice(0, 5).join("; "));

// The cluster's own records, built alone on the same kit.
let before = built.records();
E7.buildCluster(built.kit, E7.createClusterLive());
const clusterRecords = built.records() - before;
record(`records: the cluster adds ${clusterRecords} scene records (at most 150)`, clusterRecords > 0 && clusterRecords <= 150, String(clusterRecords));

const OLD = ["e7-genesis", "e7-genesis-panel", "e7-desk", "e7-desk-panel", "e7-payment", "e7-payment-panel"], NEW = ["e7-sync", "e7-pc", "e7-frame"];
const ids = Object.keys(built.props);
record("identity: the six existing exhibits stay and the three new ones join, all context with a hint and a dated label",
  OLD.concat(NEW).every((id) => ids.includes(id)) && ids.length === 9 && NEW.every((id) => { const d = built.props[id]; return d.connection === "context" && d.hint && d.label.includes(String(d.year)) && d.date; }), ids.join(","));
record("identity: the genesis text and header timestamps are unchanged",
  E7.GENESIS.headline === "The Times 03/Jan/2009 Chancellor on brink of second bailout for banks" && E7.GENESIS.time === 1231006505 && E7.B170.time === 1231731025 && E7.stamp(E7.GENESIS.time) === "2009-01-03 18:15:05");
const labels = NEW.map((id) => built.props[id].label + " " + built.props[id].date).join(" ");
record("labels: Peer Sync says it is a modern homage; the corner says January 2009 context", /homage/i.test(built.props["e7-sync"].date) && /not historical software/i.test(built.props["e7-sync"].date) && /January 2009 context/.test(built.props["e7-pc"].date), labels);

// --- Peer Sync rules ---
const run = (seed, policy) => {
  const R = S7.createRules(); R.start(seed);
  const trace = [];
  while (!R.done) { R.beat(); trace.push(R.last, R.by, R.head); if (policy) for (let i = 0; i < 3; i++) if (!R.online[i]) R.plug(i); }
  return { R, trace: trace.join(",") };
};
const a = run(77, true), b = run(77, true);
record("Peer Sync: a seed replays a run exactly", a.trace === b.trace && a.R.score() === b.R.score());
let winnable = true, bounded = true, scores = true;
for (let seed = 1; seed <= 200; seed++) {
  const g = run(seed, true), idle = run(seed, false);
  if (!g.R.won) winnable = false;
  if (g.R.beats > S7.BEATS || idle.R.beats > S7.BEATS || !idle.R.done) bounded = false;
  if (!(g.R.score() >= 300 && g.R.score() <= 1000) || (!idle.R.won && idle.R.score() > 30 * S7.TARGET)) scores = false;
}
record("Peer Sync: a visitor who plugs every dropped terminal always wins within the beats; doing nothing always ends", winnable && bounded);
record("Peer Sync: scores stay in range, and a won run outscores an unfinished one", scores);
{
  const R = S7.createRules(); R.start(5);
  let guard = 0;
  while (R.last !== 2 && guard++ < 200) R.beat();
  const off = R.by, had = R.len[off];
  let refusedSeen = 0, refusedKept = true, more = 0;
  while (R.head < 6 && !R.done && more++ < 100) {
    const snap = Array.from(R.len), e = R.beat();
    if (e === 3) { refusedSeen++; if (Array.from(R.len).some((v, i) => v !== snap[i])) refusedKept = false; }
  }
  const lenBefore = R.len[off], copied = R.plug(off);
  record("Peer Sync: an unplugged terminal misses new records and, plugged back in, copies exactly what it lacks",
    lenBefore === had && copied === R.head - had && R.len[off] === R.head && R.plug(off) === -1 && R.plug(7) === -1);
  let refusals = 0;
  for (let seed = 1; seed <= 60; seed++) {
    const Q = S7.createRules(); Q.start(seed);
    while (!Q.done) { const snap = Array.from(Q.len), e = Q.beat(); if (e === 3) { refusals++; if (Array.from(Q.len).some((v, i) => v !== snap[i])) refusedKept = false; } for (let i = 0; i < 3; i++) if (!Q.online[i]) Q.plug(i); }
  }
  record("Peer Sync: a refused broken record changes no terminal's records", refusedKept && refusals > 0, String(refusals));
}
{
  const t = S7.terminal(S7.createRules());
  const said = (l) => t.run(l).lines.join(" | ");
  const robust = [said("X".repeat(400)), said(""), said("PLUG"), said("PLUG Z"), said("plug a")].every((x) => typeof x === "string");
  said("RESET"); const first = said("WAIT"); said("RESET"); const again = said("WAIT");
  record("Peer Sync terminal: bad input answers without throwing, and RESET replays the same run", robust && first === again && /Unknown command/.test(said("DANCE")));
  const ex = built.props["e7-sync"].onUse({}).terminal;
  record("Peer Sync exhibit: its terminal opens with How to use and a hint, and answers MORE and SOURCES",
    /HOW TO USE/.test(ex.banner.join(" ")) && /HINT:/.test(ex.banner.join(" ")) && /homage/i.test(ex.run("MORE").lines.join(" ")) && /E7-REL/.test(ex.run("SOURCES").lines.join(" ")));
}
{
  // make(host) on a stub kit with the retro kit's shape: start, act, update to the end, over and onEnd once each.
  const noop = () => {};
  const ctx = new Proxy({}, { get: (o, k) => (k in o ? o[k] : noop), set: (o, k, v) => { o[k] = v; return true; } });
  BL.retroGames = { kit: { W: 160, H: 120, INK: new Proxy({}, { get: () => "#000" }), TEXT: new Proxy({}, { get: () => 0 }), text: noop, centre: noop, number: noop,
    hooks: (h) => ({ popup: noop, cue: noop, shake: noop, crack: noop, flop: noop, aim: h.aim, onEnd: h.onEnd, over: h.over }),
    makeStatus: (label) => ({ score: 0, left: 0, label, round: 1, target: 0, meter: -1, streak: 0, fire: false, verb: "", mult: 0, note: "" }),
    juice: () => ({ shake: noop, flash: noop, update: noop, begin: noop, end: noop, reset: noop }),
    rng: () => ({ fresh: () => 1 }), stepper: (step) => { const A = { acc: 0 }; return (dt) => { A.acc += dt; while (A.acc >= 1 / 120) { A.acc -= 1 / 120; step(1 / 120); } }; } } };
  let ends = 0, overs = 0, endScore = -1;
  const aim = { x: 0, hold: 0, steps: 0, y: 0, stepsY: 0 };
  const g = S7.make({ aim, still: false, onEnd: (s) => { ends++; endScore = s; }, over: () => overs++ });
  const shape = ["kind", "name", "help", "coach", "stars", "tickets", "status", "start", "act", "stop", "update", "draw"].every((k) => g[k] !== undefined) && g.aims === true;
  g.draw(ctx); g.start(42);
  for (let f = 0; f < 60 * 120 && ends === 0; f++) {
    // Step the selection to each unplugged terminal and plug it, as a visitor would.
    for (let i = 0; i < 3; i++) if (g.playing && !g.rules.online[i] && !g.rules.done) { aim.steps += (i - g.selected + 3) % 3; g.update(1 / 120); if (g.selected === i) g.act(); }
    g.update(1 / 60); g.draw(ctx);
  }
  record("Peer Sync make(host): keeps the retro interface, ends its run once with over() then onEnd(score)", shape && ends === 1 && overs === 1 && endScore === g.rules.score() && !g.playing, `${shape} ${ends} ${overs}`);
}

// --- The counting frame ---
{
  const f = E7.createFrame(), total = () => f.count(0) + f.count(1) + f.count(2);
  let conserved = true, refusedKeep = true;
  let seed = 9;
  const rnd = (n) => { seed = (seed * 1103515245 + 12345) >>> 0; return seed % n; };
  for (let i = 0; i < 500; i++) {
    const snap = Array.from(f.zone), n = rnd(60) - 5, from = rnd(4) - 0, to = rnd(4);
    const r = f.move(n, from, to);
    if (total() !== 50) conserved = false;
    if (r.error && Array.from(f.zone).some((v, k) => v !== snap[k])) refusedKeep = false;
  }
  f.reset();
  const reset = f.count(0) === 50 && !f.matches();
  f.move(10, 0, 1); f.move(40, 0, 2);
  record("Counting frame: every move keeps all 50 beads, a refused move changes nothing, RESET puts them back, 10 + 40 matches block 170",
    conserved && refusedKeep && reset && f.matches() && f.count(0) === 0);
  const t = built.props["e7-frame"].onUse({}).terminal, said = (l) => t.run(l).lines.join(" | ");
  said("RESET");
  const ok = /= 50 beads/.test(said("MOVE 10 TO 1")) && /matches block 170/.test(said("MOVE 40 TO 2")) && /lamp is lit/.test(said("CHECK"))
    && /Only 0 bead/.test(said("MOVE 5 TO 1")) && /Nothing moved/.test(said("MOVE 99 TO 1")) && /= 50 beads/.test(said("MOVE 5 FROM 2 TO 1"))
    && /back to the input/.test(said("RESET")) && typeof said("Z".repeat(300)) === "string";
  record("Counting frame terminal: every reply shows the 50-bead total, bad moves are refused, CHECK and RESET answer", ok);
}

// --- Without the sync module ---
{
  const BL2 = await load(false), b2 = buildEra7(BL2), ids2 = Object.keys(b2.props);
  record("Without genesis-era-7-sync.js the era still builds, leaving only the cabinet out", b2.bad.length === 0 && ids2.length === 8 && !ids2.includes("e7-sync") && ids2.includes("e7-frame"), ids2.join(","));
}

const passed = results.filter((r) => r.ok).length;
console.log(`${passed}/${results.length} Era 7 upgrade checks passed`);
process.exit(passed === results.length ? 0 : 1);
