// Era 6's second upgrade (gv/upgrade2-era-6): motion, light and sound on the existing exhibits, checked in Node through
// the era file itself with a recording stand-in kit. End states, Calm, the holds, leaving the gallery, idle frames and
// the cues. Run: node test/genesis-era-6-upgrade2.mjs (one line a check; exit 1 on any failure; changes no file).
import { readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const results = [];
const check = (name, ok, detail = "") => { results.push({ name, ok: !!ok }); console.log(`${ok ? "PASS" : "FAIL"} ${name}${!ok && detail ? ` · ${detail}` : ""}`); };

const context = { window: {}, crypto: globalThis.crypto, Math };
context.window.window = context.window;
context.window.BL = {};
for (const f of ["genesis-voyage", "genesis-world", "genesis-props", "genesis-exhibits", ...Array.from({ length: 8 }, (_, n) => `genesis-era-${n}`)])
  runInNewContext(await readFile(join(root, `src/js/${f}.js`), "utf8"), context);
const BL = context.window.BL, W = BL.genesisWorld, EX = BL.genesisExhibits, E6 = BL.genesisEra6, def = EX.eras[6];

// A recording kit: every node keeps position, rotation, scale, visibility and glow; `cue` records names.
const build = () => {
  const rec = { solid: 0, sign: 0, obstacle: 0, prop: 0, place: 0 }, props = {}, nodes = [], cues = [];
  const node = (x = 0, y = 0, z = 0) => { const n = { position: { x, y, z }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 }, visible: true }; nodes.push(n); return n; };
  def.build({
    era: W.ERAS[6], top: W.BANK_TOP, channel: W.CHANNEL, M: {}, createNode: () => node(), addChild() {}, label: () => ({}), notify() {},
    place: (n) => { rec.place++; return n; }, cue: (name) => cues.push(name),
    solid: (w, h, d, c, x, y, z) => { rec.solid++; return node(x, y, z); }, sign: () => { rec.sign++; return node(); },
    obstacle: () => { rec.obstacle++; }, prop: (d) => { rec.prop++; props[d.id] = d; return d; }
  });
  const term = (id) => props[id].onUse({}).terminal;
  return { rec, props, nodes, cues, term };
};
const snap = (nodes) => nodes.map((n) => [n.position.x, n.position.y, n.position.z, n.rotation.x, n.rotation.y, n.rotation.z, n.scale.x, n.scale.y, n.visible ? 1 : 0, n.glow === undefined ? 1 : n.glow].map((v) => (+v).toFixed(4)).join(",")).join(";");
const state = { era: 6, walking: true, reading: true, x: 0, z: 0, calm: false };
const frames = (n, dt = 1 / 60, s = state) => { for (let i = 0; i < n; i++) def.update(dt, 0, s); };

const A = build();
// Scene records: the unit tier's Era 6 suite caps solids, signs, obstacles and props at 346 (196 + 150); the upgrade adds
// none of those. Placed detail nodes (merged meshes and the new moving parts): 10 at 3901b004.
const total = A.rec.solid + A.rec.sign + A.rec.obstacle + A.rec.prop;
console.log(`records: ${JSON.stringify(A.rec)} (3901b004: solid 262, sign 19, obstacle 12, prop 18, place 10)`);
check("rule: no new solids, signs, obstacles or exhibits (311 as at 3901b004), within the suite's 346 cap; 33 placed detail nodes added",
  total === 311 && A.rec.place === 43, JSON.stringify(A.rec));
check("rule: every exhibit id is still built", ["e6-announce", "e6-paper", ...[1, 2, 3, 4, 5, 6, 7, 8].map((n) => `e6-ref-${n}`), "e6-not-listed", "e6-laptop", "e6-payments", "e6-january",
  "e6-argument", "e6-layout", "e6-workstation", "e6-catch"].every((id) => A.props[id]));
check("rule: building starts no transition and sounds no cue", E6.motion.running === 0 && A.cues.length === 0);

// End states: a command writes its end state at once (a reader sees it before any frame), the next frames show the
// way there, and when the transition is done the model stands exactly in that end state.
{
  const t = A.term("e6-argument"), before = snap(A.nodes);
  ["SIGN", "TIME", "WORK", "NODE", "COIN", "ODDS"].forEach((c, k) => t.run(`PLACE ${c} ${k + 1}`));
  t.run("CHECK");
  const end = snap(A.nodes), running = E6.motion.running;
  frames(6);
  const mid = snap(A.nodes);
  frames(240);
  const settled = snap(A.nodes);
  check("rule: a command's end state is written at once; frames ease toward it and settle exactly on it, then stop",
    end !== before && running > 0 && mid !== end && settled === end && E6.motion.running === 0, `running ${running}`);
  t.run("RESET"); frames(240);
  check("rule: RESET eases back and lands exactly where the visit began", snap(A.nodes) === before);
}
// Each upgraded exhibit's commands and openings move its model and settle.
{
  const before = snap(A.nodes), starts = E6.motion.started;
  const pay = A.term("e6-payments"); pay.run("SIGN BO"); pay.run("SIGN CY"); pay.run("ORDER BO CY");
  const lap = A.term("e6-laptop"); lap.run("FILE R3 CITED"); lap.run("FILE RPOW NOT");
  const lay = A.term("e6-layout"); lay.run("COMPARE 3 7");
  const ws = A.term("e6-workstation"); ws.run("STORAGE 50"); ws.run("PAGE 4"); ws.run("LAMP");
  const cat = A.term("e6-catch"); cat.run("PULL R3");
  A.props["e6-paper"].onUse({}); A.props["e6-ref-4"].onUse({}); A.props["e6-january"].onUse({});
  const moved = E6.motion.started - starts;
  frames(300);
  check("rule: payments, laptop, layout, workstation, catalogue, paper, shelf slot and January door each start transitions and all settle",
    moved >= 30 && E6.motion.running === 0 && snap(A.nodes) !== before, `${moved} started`);
  for (const [id, line] of [["e6-payments", "RESET"], ["e6-laptop", "RESET"], ["e6-layout", "RESET"], ["e6-workstation", "RESET"], ["e6-catch", "RESET"]]) A.term(id).run(line);
  frames(300);
}
// Calm: no transition starts, and one already running ends at once in its end state.
{
  const t = A.term("e6-layout"), before = E6.motion.started;
  t.run("SHOW 4");
  const end = snap(A.nodes);
  def.update(1 / 60, 0, { ...state, calm: true });
  const calmNow = snap(A.nodes) === end && E6.motion.running === 0;
  const s2 = E6.motion.started;
  t.run("COMPARE 3 7");
  check("rule: Calm ends a running transition at once in its end state and starts none for later commands",
    s2 > before && calmNow && E6.motion.started === s2 && E6.motion.running === 0);
  t.run("RESET");
  frames(1, 1 / 60, { ...state, calm: false });
}
// The holds: pause, the menu and the console stop the era's update (scene-genesis.js through genesis-world.js holdsFor);
// what is mid-transition stays where it is, and carries on to its end once the hold lifts.
{
  const t = A.term("e6-workstation"), out = {};
  t.run("STORAGE 100");
  frames(10);
  const held = snap(A.nodes);
  for (const hold of [{ paused: true, bench: false, menu: false, console: false }, { paused: false, bench: false, menu: true, console: false }, { paused: false, bench: false, menu: false, console: true }]) {
    for (let i = 0; i < 30; i++) if (W.holdsFor(hold, out).exhibit) def.update(1 / 60, 0, state);
  }
  const frozen = snap(A.nodes) === held && E6.motion.running > 0;
  const bench = W.holdsFor({ paused: false, bench: true, menu: false, console: false }, out).exhibit;
  frames(240);
  check("rule: pause, menu and console holds freeze a transition mid-way; an open workbench keeps it running to its end",
    frozen && bench && E6.motion.running === 0);
  t.run("RESET"); frames(240);
}
// Leaving the gallery finishes every transition; nothing resumes on return.
{
  const t = A.term("e6-argument");
  t.run("PLACE WORK 1");
  const end = snap(A.nodes);
  frames(5);
  def.active(false, state);
  check("rule: leaving the gallery (active false) puts every model in its end state at once", snap(A.nodes) === end && E6.motion.running === 0);
  def.active(true, state); frames(10);
  check("rule: coming back starts nothing", E6.motion.running === 0 && snap(A.nodes) === end);
  t.run("RESET"); frames(240);
}
// Idle: with nothing running, frames change nothing (the cursor's blink is held while reading, as before).
{
  const before = snap(A.nodes);
  frames(600);
  check("rule: idle frames move nothing", snap(A.nodes) === before && E6.motion.running === 0);
}
// Cues: only the agreed names, at most one a command, none from frames.
{
  const n0 = A.cues.length, t = A.term("e6-argument");
  t.run("PLACE SIGN 1"); const one = A.cues.length - n0;
  frames(120); const none = A.cues.length - n0 - one;
  t.run("RESET"); frames(120);
  check("rule: cues use only the agreed names, one per command at most, none from frames",
    A.cues.every((c) => E6.motion.CUES.has(c)) && one === 1 && none === 0, A.cues.join());
}
// The one-shot openings: a page turns over (and back next time), a slot's arrow lights alone, the seal's glint ends
// faded, the laptop's piles grow with filed cards.
{
  const findNear = (pred) => A.nodes.filter(pred);
  const over = () => findNear((n) => Math.abs(n.rotation.z - Math.PI) < 1e-4).length;
  const was = over();
  A.props["e6-paper"].onUse({}); frames(120);
  const turned = over() === 1 - was;
  A.props["e6-paper"].onUse({}); frames(120);
  const back = over() === was;
  check("rule: opening the paper turns a page over, and the next opening turns it back", turned && back);
  A.props["e6-ref-2"].onUse({}); frames(120);
  const lit2 = findNear((n) => n.visible && n.glow > 1.1 && n.glow < 1.3 && Math.abs(n.position.y - (W.BANK_TOP + 1.75)) < 1e-4).length;
  A.props["e6-ref-6"].onUse({}); frames(120);
  const lit6 = findNear((n) => n.visible && n.glow > 1.1 && n.glow < 1.3 && Math.abs(n.position.y - (W.BANK_TOP + 1.75)) < 1e-4).length;
  check("rule: opening a shelf slot lights its own arrow and darkens the last one", lit2 === 1 && lit6 === 1);
  A.props["e6-january"].onUse({}); frames(120);
  check("rule: the seal's glint sweeps and ends faded out", findNear((n) => n.visible && n.glow === 0).length >= 1 && E6.motion.running === 0);
}

const failed = results.filter((r) => !r.ok).length;
console.log(`${results.length - failed}/${results.length} checks passed`);
process.exit(failed ? 1 : 0);
