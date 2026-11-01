// Rule checks for Era 1's upgrade cluster (the home TV, the Ooga paddle console and the pocket calculator), through
// genesis-era-1.js and genesis-era-1-paddle.js themselves in Node. Run: node test/genesis-era-1-upgrade.mjs
// Prints one line per check and exits non-zero on any failure. Not part of test/run.mjs (the integrator may hook it in).
import { readFile } from "node:fs/promises";
import { runInNewContext } from "node:vm";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const results = [];
const record = (name, ok, detail = "") => { results.push({ name, ok: !!ok, detail }); console.log(`${ok ? "PASS" : "FAIL"} ${name}${ok || !detail ? "" : ` · ${detail}`}`); };
const load = async (files, extra = {}) => {
  const context = { window: {}, ...extra };
  context.window.BL = {};
  for (const f of files) runInNewContext(await readFile(join(root, `src/js/${f}.js`), "utf8"), context);
  return context.window.BL;
};

// The base's scene records for Era 1 (commit cb2b0b9, measured with the same counting kit): the cluster may add at
// most about 150.
const BASE_RECORDS = 1408, BUDGET = 150;
const OLD_IDS = ["e1-gateway-puzzle", "e1-gateway", "e1-puzzle-post", "e1-merkle", "e1-dh-table", "e1-dh", "e1-rsa-desk", "e1-rsa", "e1-floppy-toy", "e1-floppy", "e1-panel-toy", "e1-panel", "e1-coupler-toy", "e1-coupler", "e1-timeline"];
const NEW_IDS = ["e1-tv", "e1-paddle", "e1-calc"];

const BL = await load(["genesis-voyage", "genesis-world", "genesis-props", "genesis-exhibits", "genesis-era-1"]);
const W = BL.genesisWorld, P = BL.genesisProps, EX = BL.genesisExhibits, E1 = EX.eras[1], era = W.ERAS[1], top = W.BANK_TOP;

// A recording kit: every node, solid (with its box), obstacle and prop, in the era's old coordinates.
const build = () => {
  const nodes = [], solids = [], obstacles = [], props = {};
  let records = 0;
  const node = (o = {}) => {
    const n = { position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 }, visible: o.visible !== false, children: [] };
    for (const k of ["position", "rotation", "scale"]) if (o[k]) Object.assign(n[k], o[k]);
    nodes.push(n);
    return n;
  };
  const kit = { era, top, channel: W.CHANNEL, M: new Proxy({}, { get: () => () => ({}) }), createNode: (o) => { records++; return node(o); }, addChild: () => {}, place: (n) => n,
    label: () => ({ face: {}, back: {}, width: 1, height: 1 }),
    solid: (w, h, d, c, x, y, z) => { records++; solids.push({ w, h, d, x, y, z }); return node({ position: { x, y, z } }); },
    sign: () => { records += 3; return node(); }, obstacle: (x0, x1, z0, z1) => { obstacles.push({ x0, x1, z0, z1 }); },
    prop: (d) => { records++; props[d.id] = d; return d; } };
  E1.build(kit);
  return { nodes, solids, obstacles, props, records };
};
const B = build();
const snap = () => JSON.stringify(B.nodes.map((n) => [n.position.x, n.position.y, n.position.z, n.rotation.x, n.scale.y, n.visible]));
const term = (id) => B.props[id].onUse({}).terminal;
const run = (t, line) => t.run(line).lines.join("\n");
let clock = 0;
const frames = (seconds, calm) => { const state = { era: 1, walking: true, reading: false, x: 0, z: 0, calm }; for (let i = 0; i < Math.round(seconds * 30); i++) { clock += 1 / 30; E1.update(1 / 30, clock, state); } };

// --- Identity, labels and sources -----------------------------------------------------------------------------
record("existing Era 1 exhibits keep their ids", OLD_IDS.every((id) => B.props[id]), OLD_IDS.filter((id) => !B.props[id]).join(","));
record("the cluster's three exhibits are registered", NEW_IDS.every((id) => B.props[id]));
record("each new exhibit is context, with a date, a hint and its year on its label", NEW_IDS.every((id) => { const d = B.props[id]; return d.connection === "context" && d.date && d.hint && String(d.label).includes(String(d.year)) && !EX.checkProp(1, d); }));
record("each new exhibit's source resolves to an https link marked unverified (the HOLD notes)", NEW_IDS.every((id) => B.props[id].sourceKeys.every((k) => { const s = P.sourceOf(k); return s && /^https:\/\//.test(s.href) && s.verified === false; })));
const visible = NEW_IDS.map((id) => { const t = term(id); return [B.props[id].label, B.props[id].title, B.props[id].date, ...t.banner, run(t, "HELP"), run(t, "MORE"), run(t, "SOURCES")].join("\n"); }).join("\n");
record("each new exhibit says its history is on HOLD (MORE), and claims no historical date, maker or model", NEW_IDS.every((id) => /on HOLD/.test(run(term(id), "MORE"))) && !/\b(19[0-9]{2})\b/.test(visible.replace(/1970s/g, "")));
record("no brand, product or trade name appears in the cluster's words", !/\b(atari|magnavox|odyssey|texas instruments|casio|sinclair|bowmar|hewlett|sharp|canon|sony|zenith|rca|philips|pong)\b/i.test(visible.replace(/Ooga Pong/g, "")));
record("the paddle game is labelled a modern museum homage, not historical software", /modern museum homage/.test(visible) && /not historical software/i.test(visible));
record("the TV names no particular period connection", !/\bRF\b|channel 3|channel 4|coax|aerial switch|antenna switch|modulator/i.test(visible));

// --- Placement --------------------------------------------------------------------------------------------------
const MU = W.MUSEUM, bay = MU.bays[1], uOf = (z) => era.z1 - z;
const cluster = (x, z) => x > 21 && x < 34.5 && uOf(z) > 47.5 && uOf(z) < 57;
const inGallery = (x, z) => x >= bay.x0 && x <= bay.x1 && uOf(z) >= MU.OPEN && uOf(z) <= bay.depth;
const newSolids = B.solids.filter((s) => cluster(s.x, s.z));
record("everything in the living room stands inside Era 1's gallery, back from the walk (x >= 21) and below 8 m",
  newSolids.length > 0 && newSolids.every((s) => inGallery(s.x, s.z) && s.x - s.w / 2 >= 21 && s.y + s.h / 2 <= top + W.BANK.MAX_H));
const reachable = NEW_IDS.every((id) => { const a = B.props[id].at; return !B.obstacles.some((o) => a.x > o.x0 - 0.3 && a.x < o.x1 + 0.3 && a.z > o.z0 - 0.3 && a.z < o.z1 + 0.3) && inGallery(a.x, a.z); });
record("each new exhibit's walk-up point is in the gallery and clear of every obstacle", reachable);
const all = Object.values(B.props), far = NEW_IDS.every((id) => all.every((d) => d.id === id || Math.hypot(d.at.x - B.props[id].at.x, d.at.z - B.props[id].at.z) >= 2));
record("each new walk-up point is at least 2 m from every other exhibit's", far);
const reserved = W.reservedZones(1), clash = B.obstacles.filter((o) => cluster(o.x0, o.z0)).some((o) => reserved.some((r) => o.x0 < r.x1 && o.x1 > r.x0 && o.z0 < r.z1 && o.z1 > r.z0));
record("the living room's obstacles miss the reserved plots", !clash);
record(`scene records added stay within about ${BUDGET}`, B.records - BASE_RECORDS <= BUDGET, `${B.records - BASE_RECORDS}`);
console.log(`INFO scene records: base ${BASE_RECORDS}, head ${B.records}, added ${B.records - BASE_RECORDS}`);

// --- Ooga Paddle ------------------------------------------------------------------------------------------------
{
  const script = ["S", "UUW", "DDDD", "WWWWWWWW", "UUUU", "WWWWWWWW", "S", "WWWWWWWW", "WWWWWWWW", "DDWW"];
  const play = () => { const t = term("e1-paddle"); run(t, "RESET"); return script.map((l) => run(t, l)).join("\n"); };
  record("the paddle game replays the same from RESET (seeded)", play() === play());
  const t = term("e1-paddle");
  run(t, "RESET");
  record("moves need a serve first, and bad or overlong lines change nothing", /Served/.test(run(t, "S")) && /U, D and W/.test(run(t, "UUUUUUUUU")) && /U, D and W/.test(run(t, "UXD")));
  // Play on with a simple player that follows the ball, up to a whole game, keeping the ball inside the court.
  const s = { lines: 0, inside: true };
  let out = "", won = false;
  for (let i = 0; i < 600 && !won; i++) {
    out = run(t, i % 9 === 0 ? "S" : ["U", "D", "W"][i % 3].repeat(4));
    const rows = out.split("\n").filter((r) => /^\|/.test(r));
    if (rows.length !== 9 || rows.some((r) => r.length !== 22)) s.inside = false;
    won = /win/.test(out);
  }
  record("a game reaches its end (first to 5) and the court stays 20 x 9 throughout", won && s.inside, out.slice(-120));
  record("after a win, S starts a new game at 0-0", /Served/.test(run(t, "S")) && /YOU 0 {3}OOGA 0/.test(run(t, "W")));
  const fresh = run(t, "RESET");
  record("RESET returns to 0-0 and the first serve", /YOU 0 {3}OOGA 0/.test(fresh));
}

// --- Home TV ----------------------------------------------------------------------------------------------------
{
  const t = term("e1-tv");
  run(t, "RESET");
  const off = run(t, "WHAT");
  run(t, "POWER");
  const five = run(t, "DIAL 5"), console5 = /Ooga console/.test(five);
  run(t, "SWITCH B");
  const moved = /snow/.test(run(t, "WHAT")) && /Ooga console/.test(run(t, "DIAL 6"));
  record("tuning: off until POWER; the console comes in on its selector's channel (A: 5, B: 6), other dials are snow or invented programmes", /dark/.test(off) && console5 && moved && /test card/.test(run(t, "DIAL 2")) && /snow/.test(run(t, "DIAL 3")));
  const fuzzy = /fuzzy/.test(run(t, "DIAL 2")), clear = /clear/.test(run(t, "FINE -")), console0 = (run(t, "SWITCH A"), /clear/.test(run(t, "DIAL 5")));
  record("fine tuning: a station is fuzzy until its fine setting is found; the console comes in clear", fuzzy && clear && console0);
  record("the dial wraps 12 to 1 and refuses channels outside 1-12", /dial 1\./.test((run(t, "DIAL 12"), run(t, "UP"))) && /1 to 12/.test(run(t, "DIAL 13")));
  record("PATH describes the toy's signal path and keeps the real connection on HOLD", /selector box/.test(run(t, "PATH")) && /HOLD/.test(run(t, "PATH")));
  run(t, "RESET");
  record("RESET switches the TV off on dial 2, selector A", /dark/.test(run(t, "WHAT")) && /dial 5/.test(run(t, "PATH")));
}

// --- Pocket calculator -----------------------------------------------------------------------------------------
{
  const t = term("e1-calc"), shows = (line) => (run(t, "C"), run(t, line));
  const disp = (out) => (out.match(/\[\s*([^\]]*)\]/) || [])[1];
  record("12+30= shows 42", disp(shows("12+30=")) === "42");
  record("2+3X4= works left to right: 20", disp(shows("2+3X4=")) === "20");
  record("2/3= is cut (not rounded) to 8 places and says so", disp(shows("2/3=")) === "0.6666666" && /Cut to fit/.test(run(t, "C") && shows("2/3=")));
  record("3-8= shows -5", disp(shows("3-8=")) === "-5");
  record("a ninth digit is refused", disp(shows("123456789")) === "12345678" && /full/.test(shows("123456789")));
  record("an answer too big shows E until C", disp(shows("99999999X9=")) === "E" && disp(run(t, "5")) === "E" && disp(run(t, "C")) === "0");
  record("dividing by zero shows E", disp(shows("7/0=")) === "E");
  record("after =, a new digit starts a new sum", disp(shows("5+5=7+1=")) === "8");
  record("bad keys are refused", /Use digits/.test(run(t, "12#4")));
}

// --- Motion: idle still, Calm still, results at once -----------------------------------------------------------
{
  for (const id of NEW_IDS) run(term(id), "RESET");
  frames(1, false);
  const a = snap(); frames(2, false);
  record("idle (TV off), the living room does not move", snap() === a);
  const tv = term("e1-tv"); run(tv, "POWER"); run(tv, "DIAL 3");
  frames(0.1, false); const b = snap(); frames(0.5, false);
  record("snow flickers on an empty channel", snap() !== b);
  frames(1 / 30, true); const c = snap(); frames(2, true);
  record("Calm holds the snow still", snap() === c);
  run(tv, "DIAL 5"); frames(1 / 30, true);
  const d = snap();
  record("in Calm a command's result shows at once", d !== c);
  run(term("e1-calc"), "C"); run(term("e1-calc"), "8="); frames(1 / 30, true);
  record("the calculator's display follows its answer at once", snap() !== d);
  run(tv, "OFF"); frames(1 / 30, false);
}

// --- Allocation (a stable heap is evidence, not proof, of no per-frame allocation) -------------------------------
if (global.gc) {
  run(term("e1-tv"), "POWER"); run(term("e1-tv"), "DIAL 3");
  global.gc(); const h0 = process.memoryUsage().heapUsed;
  frames(20000 / 30, false);
  global.gc(); const h1 = process.memoryUsage().heapUsed;
  console.log(`INFO heap delta over 20,000 frames with snow flickering: ${h1 - h0} bytes (evidence only; it does not prove zero per-frame allocation)`);
} else console.log("INFO heap check skipped: run with node --expose-gc for it");

// --- The live console adapter (genesis-era-1-paddle.js) over a stand-in Ooga Pong -------------------------------
{
  const calls = [];
  const fake = { kind: "pong", name: "Ooga Pong", aims: true, status: {}, playing: false, help: "", coach: ["", ""], stars: [], tickets: () => 0, start() {}, act() {}, stop() {}, update() {}, draw() {} };
  const ctx = { window: { BL: { retroGames: { pong: (host) => { calls.push(host); return { ...fake }; } } } } };
  runInNewContext(await readFile(join(root, "src/js/genesis-era-1-paddle.js"), "utf8"), ctx);
  const A = ctx.window.BL.genesisEra1Paddle, host = { best: 0 }, g = A.make(host);
  const keys = ["kind", "name", "help", "coach", "stars", "tickets", "status", "playing", "start", "act", "stop", "update", "draw", "aims"];
  record("the live console adapter hands its host to Ooga Pong and keeps the retro-games interface", calls[0] === host && keys.every((k) => k in g) && g.museum.homage && /homage/.test(g.name) && A.id === "e1-paddle");
  record("the adapter lists the console hooks it needs (load, screen, input, pause, calm, mute, clear)", ["load", "screen", "input", "pause", "calm", "mute", "clear"].every((k) => typeof A.needs[k] === "string"));
}

// --- Disposal -----------------------------------------------------------------------------------------------------
E1.dispose();
let threw = false;
try { E1.update(1 / 30, 0, { era: 1, calm: false }); } catch { threw = true; }
record("dispose drops the visit; update after it does nothing", !threw);

const failed = results.filter((r) => !r.ok).length;
console.log(`${results.length - failed}/${results.length} checks passed`);
process.exit(failed ? 1 : 0);
