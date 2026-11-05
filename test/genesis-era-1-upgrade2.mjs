// Rule checks for Era 1's second upgrade (moving mechanisms, eased reveals, light pools, cues), through
// genesis-era-1.js itself in Node: each exhibit's end state, Calm showing it at once, holds freezing motion, nothing
// per frame while idle, active(false) stopping everything, cues only from the Genesis tab's list, the story text
// unchanged, and the scene records against 3901b004. Run: node --expose-gc test/genesis-era-1-upgrade2.mjs
import { readFile } from "node:fs/promises";
import { runInNewContext } from "node:vm";
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const BASE = "3901b004e1a7fe895e9b0bdb6d7c97dcab84c41f", BASE_RECORDS = 1574;
const CUE_NAMES = ["whir", "click", "clack", "relay", "chime", "thunk", "rustle-paper", "beep", "hum-start", "hum-stop"];
const results = [];
const record = (name, ok, detail = "") => { results.push(!!ok); console.log(`${ok ? "PASS" : "FAIL"} ${name}${ok || !detail ? "" : ` · ${detail}`}`); };
const near = (a, b, e = 1e-6) => Math.abs(a - b) <= e;

const load = async (source) => {
  const context = { window: {} };
  context.window.BL = {};
  for (const f of ["genesis-voyage", "genesis-world", "genesis-props", "genesis-exhibits"]) runInNewContext(await readFile(join(root, `src/js/${f}.js`), "utf8"), context);
  runInNewContext(source, context);
  return context.window.BL;
};
const headSource = await readFile(join(root, "src/js/genesis-era-1.js"), "utf8");
const BL = await load(headSource), W = BL.genesisWorld, E1 = BL.genesisExhibits.eras[1];

// A recording kit, packed as the scene packs it: nodes count writes to their transforms, so idle frames can be shown to
// write nothing; cues are recorded.
let writes = 0, records = 0;
const cues = [];
const watched = (o) => new Proxy(o, { set(t, k, v) { if (t[k] !== v) writes++; t[k] = v; return true; } });
const build = (withCue = true) => {
  const nodes = [], props = {};
  const node = (o = {}) => {
    const n = { position: watched({ x: 0, y: 0, z: 0 }), rotation: watched({ x: 0, y: 0, z: 0 }), scale: watched({ x: 1, y: 1, z: 1 }), visible: o.visible !== false, children: [] };
    for (const k of ["position", "rotation", "scale"]) if (o[k]) Object.assign(n[k], o[k]);
    const p = new Proxy(n, { set(t, k, v) { if (t[k] !== v) writes++; t[k] = v; return true; } });
    nodes.push(p);
    return p;
  };
  records = 0;
  const kit = { era: W.ERAS[1], top: W.BANK_TOP, channel: W.CHANNEL, M: new Proxy({}, { get: () => () => ({}) }), createNode: (o) => { records++; return node(o); }, addChild: () => {}, place: (n) => n,
    label: () => ({ face: {}, back: {}, width: 1, height: 1 }), solid: (w, h, d, c, x, y, z) => { records++; return node({ position: { x, y, z } }); },
    sign: () => { records += 3; return node(); }, obstacle: () => {}, prop: (d) => { records++; props[d.id] = d; return d; } };
  if (withCue) kit.cue = (name) => cues.push(name);
  E1.build(W.packedKit(kit, 1, E1.build));
  const S = E1.inspect();
  return { nodes, props, S, N: S.n, records };
};
let clock = 0;
const frames = (seconds, calm = false, reading = false) => { for (let i = 0; i < Math.round(seconds * 30); i++) { clock += 1 / 30; E1.update(1 / 30, clock, { era: 1, walking: true, reading, x: 0, z: 0, calm }); } };
const run = (V, id, line) => V.props[id].onUse({}).terminal.run(line);
const snap = (V) => JSON.stringify(V.nodes.map((n) => [n.position.x, n.position.y, n.position.z, n.rotation.x, n.rotation.y, n.rotation.z, n.scale.x, n.scale.y, n.visible]));

// --- Scene records ---------------------------------------------------------------------------------------------
{
  const V = build();
  record(`scene records within the base's (${BASE_RECORDS} at ${BASE.slice(0, 7)})`, V.records <= BASE_RECORDS, `${V.records}`);
  console.log(`INFO scene records: base ${BASE_RECORDS}, head ${V.records}, added ${V.records - BASE_RECORDS}`);
}

// --- Story text and commands unchanged ---------------------------------------------------------------------------
{
  let base = null;
  try { base = execFileSync("git", ["show", `${BASE}:src/js/genesis-era-1.js`], { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }); } catch { base = null; }
  if (!base) console.log("INFO story-text comparison skipped: the base commit is not in this checkout");
  else {
    const BB = await load(base), EB = BB.genesisExhibits.eras[1];
    const texts = (E) => {
      const props = {}, kit = { era: W.ERAS[1], top: W.BANK_TOP, channel: W.CHANNEL, M: new Proxy({}, { get: () => () => ({}) }), createNode: () => ({ position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 }, children: [] }), addChild: () => {}, place: (n) => n,
        label: () => ({ face: {}, back: {} }), solid: () => ({ position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } }), sign: () => ({}), obstacle: () => {}, prop: (d) => { props[d.id] = d; return d; } };
      E.build(kit);
      const out = {};
      for (const [id, d] of Object.entries(props)) {
        const r = d.onUse({}), t = r && r.terminal;
        out[id] = JSON.stringify({ title: d.title, label: d.label, date: d.date, year: d.year, sources: d.sourceKeys, connection: d.connection, hint: d.hint,
          board: r && r.board ? r.board : null, banner: t ? t.banner : null, help: t ? t.run("HELP").lines : null, more: t ? t.run("MORE").lines : null });
      }
      return { out, overview: JSON.stringify(E.overview), sources: JSON.stringify(E.sources) };
    };
    const a = texts(EB), b = texts(E1), ids = Object.keys(a.out), changed = ids.filter((id) => a.out[id] !== b.out[id]);
    record("every exhibit, id, label, date, source, connection, hint, panel, banner, HELP and MORE is unchanged", ids.length > 0 && changed.length === 0 && ids.every((id) => b.out[id]), changed.join(","));
    record("the overview and the source register are unchanged", a.overview === b.overview && a.sources === b.sources);
    // Nothing relocated: the gallery's packing (genesis-world.js packEra) puts every exhibit's walk-up point where it
    // was, and every solid the base built stands where it stood (the coupler's case lid excepted: its two upright
    // slabs became one lid tilted back on its hinge).
    const layout = (E) => {
      const props = {}, solids = new Set(), nd = () => ({ position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 }, children: [] });
      const kit = { era: W.ERAS[1], top: W.BANK_TOP, channel: W.CHANNEL, M: new Proxy({}, { get: () => () => ({}) }), createNode: (o = {}) => Object.assign(nd(), o, { children: [] }), addChild: () => {}, place: (n) => n,
        label: () => ({ face: {}, back: {} }), solid: (w, h, d, c, x, y, z) => { solids.add([w, h, d, c, x.toFixed(4), y.toFixed(4), z.toFixed(4)].join(",")); return nd(); }, sign: () => nd(), obstacle: () => {},
        prop: (d) => { props[d.id] = `${d.at.x.toFixed(4)},${d.at.z.toFixed(4)}`; return d; } };
      E.build(W.packedKit(kit, 1, E.build));
      return { props, solids };
    };
    const la = layout(EB), lb = layout(E1), movedIds = Object.keys(la.props).filter((id) => la.props[id] !== lb.props[id]);
    const lost = [...la.solids].filter((x) => !lb.solids.has(x) && !/^0\.(78,0\.42,0\.05,#4a3020|7,0\.34,0\.02,#c4b79a),/.test(x));
    record("nothing relocated: every exhibit's packed walk-up point and every base solid stand where they did", movedIds.length === 0 && lost.length === 0, `${movedIds.join(",")} ${lost.slice(0, 3).join(" | ")}`);
  }
}

// --- End states (played through without Calm) ----------------------------------------------------------------------
const V = build();
frames(1);
{
  run(V, "e1-dh-table", "PICK 4"); run(V, "e1-dh-table", "SEND"); run(V, "e1-dh-table", "SHARE");
  frames(0.5); const mid = V.S.ease.mix;
  frames(4);
  const N = V.N, E = V.S.ease;
  record("key exchange: PICK opens both tins and fills the jars (mixture), SHARE fills both the same brown; the tokens are home",
    mid < 1 && near(N.lids[0].rotation.x, -1.9) && near(N.mixFill[0].scale.y, 1) && near(N.sharedFill[1].scale.y, 1) && !N.dhTokens[0].visible && E.lid === 1);
}
{
  run(V, "e1-rsa-desk", "SIGN 5"); frames(0.25);
  const turning = Math.abs(V.N.keys[0].rotation.z) > 0.3;
  run(V, "e1-rsa-desk", "VERIFY 14 5"); frames(3);
  const N = V.N;
  record("signature desk: SIGN turns the private key and raises the signed card; VERIFY turns the public key and grows in the green lamp; keys come back",
    turning && near(N.keys[0].rotation.z, 0) && near(N.keys[1].rotation.z, 0) && near(N.sigCard.position.y, N.sigCardY + 0.15) && N.verdict[0].visible && near(N.verdict[0].scale.y, 1));
}
{
  const F = V.props["e1-floppy-toy"];
  F.onUse({}); F.onUse({}); F.onUse({});
  frames(1); const spinning = V.S.ease.spin > 1, cardsMid = V.N.cards.filter((c) => c.visible).length;
  frames(6);
  const N = V.N, E = V.S.ease;
  record("floppy: loading spins the disk up behind its window and lights the cards in turn, then it spins down with all three lit and the lamp steady",
    spinning && cardsMid < 3 && E.spin === 0 && N.cards.every((c) => c.visible) && N.diskLamp.visible && near(N.door.rotation.x, -1.2));
}
{
  for (const l of ["SET 01001111", "DEPOSIT", "DEPOSIT", "SET 01000111", "DEPOSIT", "SET 01000001", "DEPOSIT"]) run(V, "e1-panel-toy", l);
  frames(0.2); const sweeping = V.S.ease.sweep < 1;
  run(V, "e1-panel-toy", "RUN"); frames(2);
  const N = V.N;
  record("front panel: a sweep runs across the lamps and down the tray, ending on the stored bytes, the levers on the switches and the OOGA lamp",
    sweeping && V.S.ease.sweep === 1 && N.tray.slice(0, 4).every((t) => t.visible) && !N.tray[4].visible && N.wonLamp.visible && near(N.levers[0].rotation.x, 0.5) && near(N.levers[1].rotation.x, -0.5));
}
{
  cues.length = 0;
  run(V, "e1-coupler-toy", "SEND HI"); frames(0.2);
  const lifted = V.N.handset.position.y > V.N.handsetY + 0.05;
  frames(4);
  record("coupler: SEND lifts the handset and seats it with a thunk; after the run the lamps are out and the handset rests",
    lifted && cues.includes("thunk") && near(V.N.handset.position.y, V.N.handsetY) && !V.N.bitLamps[0].visible && !V.N.bitLamps[1].visible);
}
{
  run(V, "e1-tv", "POWER"); run(V, "e1-tv", "DIAL 5"); frames(0.15);
  const snowy = V.N.specks.some((s) => s.visible) && V.N.court[0].visible;
  frames(1.5);
  const N = V.N;
  record("TV: the dial turns to its channel, snow lies over the new picture and thins out to a clear court",
    snowy && near(N.tvDial.rotation.x, 2.5, 1e-3) && N.court[0].visible && !N.snowBg.visible && N.specks.every((s) => !s.visible));
  run(V, "e1-paddle", "S"); run(V, "e1-paddle", "UUW"); frames(0.15);
  const replaying = V.S.paddle.pathT < V.S.paddle.pathN - 1;
  frames(2);
  const pd = V.S.paddle, Sc = N.screen;
  record("console: the line replays on the TV a tick at a time and ends where the game is; your controller's knob turns with your paddle",
    replaying && near(N.youPad.position.y, Sc.sy + 0.21 - (pd.py + 1) * Sc.rowH) && near(N.knobs[0].rotation.y, N.knobs[0].baseY + (pd.py - 3) * 0.6, 1e-3));
}
{
  run(V, "e1-calc", "C"); run(V, "e1-calc", "12+30="); frames(0.05);
  const partial = V.N.segs[6].every((s) => !s.visible) && V.N.segs[7].some((s) => s.visible);
  frames(1);
  const lit = (i) => V.N.segs[i].filter((s) => s.visible).length;
  record("calculator: the places light in turn from the right, ending on 42", partial && lit(6) === 4 && lit(7) === 5 && lit(5) === 0);
}

// --- Nothing per frame while idle ---------------------------------------------------------------------------------
{
  frames(3);
  writes = 0; frames(3);
  record("idle (every model settled, the TV on a clear channel): update writes nothing", writes === 0, `${writes} writes`);
}

// --- Calm: each command's result at once ---------------------------------------------------------------------------
{
  const C = build();
  frames(1, true);
  run(C, "e1-dh-table", "PICK 4"); run(C, "e1-dh-table", "SEND"); run(C, "e1-dh-table", "SHARE");
  run(C, "e1-rsa-desk", "SIGN 5"); run(C, "e1-rsa-desk", "VERIFY 14 5");
  const F = C.props["e1-floppy-toy"]; F.onUse({}); F.onUse({}); F.onUse({});
  for (const l of ["SET 01001111", "DEPOSIT", "RUN"]) run(C, "e1-panel-toy", l);
  run(C, "e1-coupler-toy", "SEND HI"); run(C, "e1-tv", "POWER"); run(C, "e1-tv", "DIAL 5"); run(C, "e1-calc", "12+30=");
  run(C, "e1-paddle", "S"); run(C, "e1-paddle", "UUW");
  frames(1 / 30, true);
  const N = C.N, E = C.S.ease;
  const final = near(N.lids[0].rotation.x, -1.9) && near(N.sharedFill[0].scale.y, 1) && near(N.sigCard.position.y, N.sigCardY + 0.15) && near(N.verdict[0].scale.y, 1)
    && E.spin === 0 && N.cards.every((c) => c.visible) && E.sweep === 1 && N.tray[0].visible && near(E.seat, 1) && near(N.tvDial.rotation.x, 2.5) && N.specks.every((s) => !s.visible)
    && C.S.paddle.pathT === C.S.paddle.pathN - 1 && E.reveal === 8;
  record("Calm: one frame after the commands every model shows its final state", final);
  // The coupler's bit lamps are a readout of the data, which the contract lets run on in Calm: let its run end first.
  frames(2, true);
  const held = snap(C); frames(2, true);
  record("Calm: then nothing moves", snap(C) === held);
}

// --- Holds and leaving -----------------------------------------------------------------------------------------------
{
  const H = build();
  frames(1);
  run(H, "e1-dh-table", "PICK 4"); const F = H.props["e1-floppy-toy"]; F.onUse({}); F.onUse({}); F.onUse({});
  frames(0.3);
  const a = snap(H);
  // The scene's pause and its bench, menu and console holds simply stop calling update; dt 0 is the same moment.
  for (let i = 0; i < 30; i++) E1.update(0, clock, { era: 1, calm: false });
  record("a hold (no update, or dt 0) freezes every motion where it is", snap(H) === a);
  frames(0.3);
  record("released, motion carries on from there", snap(H) !== a);
  run(H, "e1-coupler-toy", "SEND HI"); run(H, "e1-tv", "POWER"); run(H, "e1-tv", "DIAL 2"); run(H, "e1-calc", "99999999X9=");
  frames(0.1);
  E1.active(false, { era: 2, calm: false });
  const left = snap(H);
  E1.active(true, { era: 1, calm: false });
  writes = 0; frames(2);
  record("active(false) stops everything in its final state; coming back resumes nothing", snap(H) === left && writes === 0, `${writes} writes`);
}

// --- Cues --------------------------------------------------------------------------------------------------------------
{
  cues.length = 0;
  const Q = build();
  const script = [["e1-gateway-puzzle", "PING G1"], ["e1-gateway-puzzle", "ROUTE G1"], ["e1-gateway-puzzle", "SEND"], ["e1-dh-table", "PICK 3"], ["e1-dh-table", "SEND"], ["e1-dh-table", "SHARE"],
    ["e1-rsa-desk", "SIGN 5"], ["e1-rsa-desk", "VERIFY 14 6"], ["e1-panel-toy", "FLIP 3"], ["e1-panel-toy", "DEPOSIT"], ["e1-tv", "POWER"], ["e1-tv", "UP"], ["e1-calc", "7/0="], ["e1-coupler-toy", "SEND A"]];
  for (const [id, l] of script) { run(Q, id, l); frames(0.6); }
  frames(5);
  const quiet = cues.length; frames(3);
  record("cues use only the Genesis tab's names", cues.every((c) => CUE_NAMES.includes(c)), cues.filter((c) => !CUE_NAMES.includes(c)).join(","));
  record("cues are sparing: at most one or two a command, none while idle", cues.length <= script.length * 2 && cues.length === quiet, `${cues.length} cues for ${script.length} commands`);
  const before = cues.length, NQ = build(false);
  run(NQ, "e1-tv", "POWER"); frames(1);
  record("without the kit's cue nothing is called and nothing breaks", cues.length === before);
}

// --- Allocation (evidence only) ---------------------------------------------------------------------------------------
if (global.gc) {
  const A = build(); frames(1);
  run(A, "e1-tv", "POWER"); run(A, "e1-tv", "DIAL 3");
  global.gc(); const h0 = process.memoryUsage().heapUsed;
  for (let r = 0; r < 200; r++) { run(A, "e1-calc", "12+30="); run(A, "e1-panel-toy", "DEPOSIT"); frames(1); }
  global.gc(); const h1 = process.memoryUsage().heapUsed;
  console.log(`INFO heap delta over 6,000 busy frames (snow, sweeps, reveals): ${h1 - h0} bytes · evidence only, a stable heap does not prove zero per-frame allocation`);
} else console.log("INFO heap evidence skipped: run with node --expose-gc");

E1.dispose();
const failed = results.filter((ok) => !ok).length;
console.log(`${results.length - failed}/${results.length} checks passed`);
process.exit(failed ? 1 : 0);
