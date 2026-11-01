// Era 0 upgrade checks (the counting cluster: Nim, the scan-line CRT and the pointer station). Run with
//   node test/genesis-era-0-upgrade.mjs
// It loads the Genesis world, props, exhibits and every era file as the shared unit tier does, plus the three toy
// modules, builds Era 0 on a recording kit and drives each toy through its terminal and its console factory.
import { readFile } from "node:fs/promises";
import { runInNewContext } from "node:vm";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const TOYS = ["genesis-era-0-nim", "genesis-era-0-crt", "genesis-era-0-pointer"];
const BASE = ["genesis-voyage", "genesis-world", "genesis-props", "genesis-exhibits"];
const load = async (withToys) => {
  const context = { window: { BL: {} } };
  const files = [...BASE, ...(withToys ? TOYS : []), ...Array.from({ length: 8 }, (_, n) => `genesis-era-${n}`)];
  for (const f of files) runInNewContext(await readFile(join(root, `src/js/${f}.js`), "utf8"), context);
  return context.window.BL;
};
const results = [];
const check = (name, ok, detail = "") => { results.push({ name, ok: !!ok }); console.log(`${ok ? "ok  " : "FAIL"} ${name}${ok || !detail ? "" : ` :: ${detail}`}`); };

// A recording kit: every solid and sign in build order, obstacles, and props; `mark` notes where the cluster starts.
const build = (BL) => {
  const W = BL.genesisWorld, records = [], obstacles = [], props = {}, order = [];
  const kit = { era: W.ERAS[0], top: W.BANK_TOP, channel: W.CHANNEL, M: { box: () => ({}) },
    createNode: () => ({ position: { x: 0, y: 0, z: 0 }, children: [] }), addChild: () => {}, place: (x) => x,
    label: () => ({ face: {}, back: {}, width: 1, height: 1 }), notify() {},
    sign: (t, sub, x, y, z) => { const n = { kind: "sign", t, x, y, z, position: { x, y, z } }; records.push(n); return n; },
    solid: (w, h, d, color, x, y, z, emissive = 0) => { const n = { kind: "solid", w, h, d, color, emissive, position: { x, y, z }, visible: true, glow: 1 }; records.push(n); return n; },
    obstacle: (x0, x1, z0, z1) => obstacles.push({ x0, x1, z0, z1, after: order.length }),
    prop: (d) => { props[d.id] = d; order.push({ id: d.id, at: records.length }); return d; } };
  BL.genesisExhibits.eras[0].build(kit);
  const term = (id) => { const r = props[id].onUse({}); return r.terminal ? (line) => r.terminal.run(line).lines.join(" | ") : null; };
  return { W, kit, records, obstacles, props, order, term };
};

const BL = await load(true), A = build(BL), W = A.W, EX = BL.genesisExhibits, P = BL.genesisProps, G = BL.genesisEra0Games;
const ORIGINAL = ["e0-feller", "e0-arpanet", "e0-disk-seek", "e0-punch", "e0-race", "e0-login", "e0-compare"], NEW = ["e0-nim", "e0-crt", "e0-pointer"];

// ---- placement, labels, sources -----------------------------------------------------------------------------------
check("every original Era 0 exhibit keeps its id, in its original build order", ORIGINAL.every((id) => A.props[id]) && A.order.slice(0, 7).map((o) => o.id).join() === ["e0-feller", "e0-arpanet", "e0-disk-seek", "e0-punch", "e0-race", "e0-login", "e0-compare"].join());
check("the cluster adds exactly e0-nim, e0-crt and e0-pointer", Object.keys(A.props).length === 10 && NEW.every((id) => A.props[id]));
const clusterStart = A.order.find((o) => o.id === "e0-compare").at;
const added = A.records.length - clusterStart;
check(`the cluster adds at most 150 scene records (${added})`, added > 0 && added <= 150, String(added));
const bad = [];
for (const id of NEW) {
  const d = A.props[id];
  if (EX.checkProp(0, d)) bad.push(EX.checkProp(0, d));
  if (d.connection !== "context") bad.push(`${id} is not context`);
  if (!String(d.label).includes(String(d.year))) bad.push(`${id} label lacks its year`);
  if (!/modern/i.test(d.label) || !/modern/i.test(d.title) || !/no historical date/i.test(d.date)) bad.push(`${id} is not labelled a modern toy without a date`);
  for (const k of d.sourceKeys) { const s = P.sourceOf(k); if (!s || !/^https:\/\//.test(s.href)) bad.push(`${id}: source ${k}`); }
}
check("the new stations are context, labelled modern toys with no historical date, with resolving sources", !bad.length, bad.join("; "));
// No new record uses a colour the shared proof finds Era 0's models by (it takes the last node of each colour).
const watched = ["#ffd276", "#20292c", "#f2c14e", "#68c6ed", "#8effab"];
check("no cluster record reuses a colour the shared Era 0 proof looks up", A.records.slice(clusterStart).every((r) => !watched.includes(r.color)));
// Inside the gallery, clear of the old stream's walk, the reserved plots and every other exhibit's footprint; no
// taller than the limit; walk-up points free to stand on.
const M = W.MUSEUM, rect = M.rects[0], reserved = W.reservedZones(0), place = [];
const inGallery = (x, z) => { const p = M.toMuseum(0, x, z, {}); return p.x >= rect.x0 - 0.05 && p.x <= rect.x1 + 0.05 && p.z >= rect.z0 - 0.05 && p.z <= rect.z1 + 0.05; };
const overlap = (a, b) => a.x0 < b.x1 && a.x1 > b.x0 && a.z0 < b.z1 && a.z1 > b.z0;
for (const r of A.records.slice(clusterStart)) {
  const box = r.kind === "solid" ? { x0: r.position.x - r.w / 2, x1: r.position.x + r.w / 2, z0: r.position.z - r.d / 2, z1: r.position.z + r.d / 2 } : { x0: r.x, x1: r.x, z0: r.z, z1: r.z };
  if (!inGallery(box.x0, box.z0) || !inGallery(box.x1, box.z1)) place.push("a record outside the gallery");
  if (!(box.x1 <= W.CHANNEL.x0 - 1.5 || box.x0 >= W.CHANNEL.x1 + 1.5)) place.push("a record on the old stream's walk");
  for (const z of reserved) if (overlap(box, z)) place.push(`a record in the ${z.why} plot`);
  if (r.kind === "solid" && r.position.y + r.h / 2 > W.BANK_TOP + W.BANK.MAX_H) place.push("a record too tall");
}
const mine = A.obstacles.filter((o) => o.after >= 7), theirs = A.obstacles.filter((o) => o.after < 7);
for (const o of mine) for (const t of theirs) if (overlap(o, t)) place.push("a cluster footprint overlaps an existing exhibit");
for (const id of NEW) {
  const at = A.props[id].at, r = 0.3;
  if (A.obstacles.some((o) => at.x > o.x0 - r && at.x < o.x1 + r && at.z > o.z0 - r && at.z < o.z1 + r)) place.push(`${id}'s walk-up point is blocked`);
  if (reserved.some((z) => at.x > z.x0 && at.x < z.x1 && at.z > z.z0 && at.z < z.z1)) place.push(`${id}'s walk-up point is reserved`);
  if (!inGallery(at.x, at.z)) place.push(`${id}'s walk-up point is outside the gallery`);
}
check("the cluster sits inside the gallery, off the walk, reserved plots and other footprints, walk-ups clear", !place.length, [...new Set(place)].join("; "));

// ---- Nim -----------------------------------------------------------------------------------------------------------
const nim = A.term("e0-nim"), counters = A.records.filter((r) => r.color === "#e8dcc0");
const lit = () => counters.filter((c) => c.visible).length;
check("Nim starts with 3, 5 and 7 counters standing", counters.length === 15 && lit() === 15 && /A 3, B 5, C 7/.test(nim("STATUS")));
const badNim = ["TAKE", "TAKE D 1", "TAKE A 0", "TAKE A 4", "TAKE A 1.5", "TAKE A -1", "TAKE A 1 2", "LEVEL 0", "LEVEL 4", "FLY"].map(nim);
check("bad Nim input changes nothing", lit() === 15 && /A 3, B 5, C 7/.test(nim("STATUS")), badNim.join(" / "));
const r1 = nim("TAKE C 2");
check("TAKE C 2 removes two, the computer answers once, counters follow", /You take 2 from C\./.test(r1) && /The computer takes \d from [ABC]\./.test(r1) && lit() < 13 && lit() >= 6);
// A perfect visitor always wins at every level (3-5-7 has a non-zero nim-sum, and the visitor moves first).
const perfect = (term, game) => {
  for (let guard = 0; guard < 40; guard++) {
    const s = term("STATUS");
    if (/you win/.test(s)) return true;
    if (/computer took the last/.test(s)) return false;
    const h = game.heaps, x = h[0] ^ h[1] ^ h[2];
    let move = null;
    for (let i = 0; i < 3 && !move; i++) if ((h[i] ^ x) < h[i]) move = [i, h[i] - (h[i] ^ x)];
    if (!move) for (let i = 0; i < 3 && !move; i++) if (h[i]) move = [i, 1];
    term(`TAKE ${"ABC"[move[0]]} ${move[1]}`);
  }
  return false;
};
let perfectWins = 0, greedyLosses = 0;
for (const level of [1, 2, 3]) {
  const g = G.nim.create(), t = G.nim.terminal(g), run = (l) => t.run(l).lines.join(" | ");
  run(`LEVEL ${level}`); if (perfect(run, g)) perfectWins++;
}
// A visitor who always takes one from heap C (then the next non-empty) loses to level 3 at least once.
{
  const g = G.nim.create(), t = G.nim.terminal(g), run = (l) => t.run(l).lines.join(" | ");
  run("LEVEL 3");
  for (let guard = 0; guard < 40 && g.state.winner < 0; guard++) { const h = [2, 1, 0].find((i) => g.heaps[i]); run(`TAKE ${"ABC"[h]} 1`); }
  if (g.state.winner === 1) greedyLosses++;
}
check("a perfect visitor wins at levels 1, 2 and 3; level 3 punishes a careless one", perfectWins === 3 && greedyLosses === 1);
{
  const g = G.nim.create(), run = (l) => G.nim.terminal(g).run(l).lines.join(" | ");
  run("TAKE C 2"); const first = Array.from(g.heaps).join(); run("RESET"); run("TAKE C 2"); const again = Array.from(g.heaps).join();
  // The computer's opponent looks only at the current position: one reply per visitor turn, none after a win.
  const ended = G.nim.create(); ended.heaps.set([0, 0, 1]); ended.take(2, 1);
  check("Nim RESET replays the seeded computer, and a finished game takes no more moves", first === again && ended.state.winner === 0 && !ended.reply() && ended.take(0, 1) === 1);
}
check("HINT names the nim-sum and INFO keeps the toy undated", /nim-sum is \d+/.test(nim("HINT")) && /No date is given/.test(nim("INFO")) && !/\b1[89]\d\d\b/.test(nim("INFO")));

// ---- the CRT -------------------------------------------------------------------------------------------------------
const crt = A.term("e0-crt"), strips = A.records.filter((r) => r.color === "#0f1a12"), runs = A.records.filter((r) => r.color === "#5fc47a" || r.color === "#b8ffcc");
check("the CRT draws twelve scan lines and the original picture's runs", strips.length === 12 && runs.length === G.crt.segments().length && runs.length >= 10);
const brightRun = runs.find((r) => r.color === "#b8ffcc");
crt("BRIGHT 0"); crt("CONTRAST 0");
const black = strips.every((s) => !s.visible) && runs.every((r) => !r.visible);
crt("CONTRAST 4"); const contrasty = strips.every((s) => !s.visible) && brightRun.visible && brightRun.glow > 2;
crt("BRIGHT 4"); const lifted = strips.every((s) => s.visible && s.glow > 0.9);
const badCrt = ["BRIGHT 5", "BRIGHT -1", "BRIGHT 2.5", "CONTRAST", "LINES 13"].every((c) => /needs one whole number/.test(crt(c)));
check("brightness and contrast change the tones: off at 0/0, black kept at 0/4, black lifted at 4/4; bad values refused", black && contrasty && lifted && badCrt && /Brightness 4, contrast 4/.test(crt("STATUS")));
crt("LINES 6");
const half = strips.filter((s) => s.visible).length === 6 && runs.every((r) => r.visible === (r.position.y > strips[6].position.y + 1e-9));
crt("RESET");
check("LINES draws only the first lines of the frame; RESET restores the defaults", half && strips.every((s) => s.visible) && /Brightness 2, contrast 2, 12 of 12/.test(crt("STATUS")));

// ---- the pointer station ------------------------------------------------------------------------------------------
const pt = A.term("e0-pointer"), targets = A.records.filter((r) => r.color === "#e0b84a"), cursor = A.records.find((r) => r.color === "#f4f4f4");
const litTarget = () => targets.findIndex((t) => t.glow > 1);
const name = (i) => G.pointer.nameOf(i);
const startX = cursor.position.x;
check("nine targets, one lit, the cursor in the middle", targets.length === 9 && targets.filter((t) => t.glow > 1).length === 1 && /cursor is on B2/.test(pt("STATUS")));
const badPt = ["SELECT", "SELECT D1", "SELECT A4", "MOVE 3 0", "MOVE 1", "MOVE a b", "MOVE 1.5 0"].every((c) => /needs/.test(pt(c)));
check("bad pointer input is refused and counts nothing", badPt && /Typed: 0 command\(s\), 0 characters\. Pointer: 0 move\(s\), 0 click\(s\)\. Misses: 0/.test(pt("STATUS")));
const first = litTarget(), typed = pt(`SELECT ${name(first)}`);
const second = litTarget();
const miss = pt(`SELECT ${name((second + 1) % 9)}`);
check("a typed SELECT of the lit target hits and lights the next; a wrong name misses", /hit/.test(typed) && second !== first && second >= 0 && /miss/.test(miss) && litTarget() === second);
const dx = second % 3 - 1, dy = Math.floor(second / 3) - 1;
pt(`MOVE ${dx} ${dy}`);
const moved = Math.abs(cursor.position.x - (startX + dx * 0.36)) < 1e-9;
const click = pt("CLICK");
pt("MOVE -2 -2"); const clamped = /cursor is on A1/.test(pt("STATUS"));
check("MOVE steers the cursor (clamped to the board) and CLICK chooses the cell under it", moved && /hit/.test(click) && clamped);
for (let guard = 0; guard < 10 && litTarget() >= 0 && !/All 5/.test(pt("STATUS")); guard++) pt(`SELECT ${name(litTarget())}`);
const done = pt("STATUS");
check("five targets finish the run with a tally of both methods; RESET starts again", /All 5 targets found/.test(done) && /Typed: \d+ command/.test(done) && /Pointer: 1 move|Pointer: 2 move/.test(done) && /New run/.test(pt("RESET")) && /Target 1 of 5/.test(pt("STATUS")));

// ---- long input, fresh visits, missing modules ---------------------------------------------------------------------
check("long and empty lines answer without throwing", [nim, crt, pt].every((t) => typeof t("X".repeat(400)) === "string" && typeof t("") === "string"));
nim("TAKE A 3");
const B = build(BL);
const fresh = /A 3, B 5, C 7/.test(B.term("e0-nim")("STATUS")) && B.records.every((r) => !A.records.includes(r));
B.term("e0-nim")("TAKE B 5");
check("a second visit starts fresh and shares no state or nodes", fresh && lit() < 15 && /A 0/.test(nim("STATUS")));
const bare = build(await load(false));
check("without the toy scripts the stations still stand, ids intact, and open a caption", NEW.every((id) => bare.props[id] && bare.props[id].onUse({}).caption) && ORIGINAL.every((id) => bare.props[id]));

// ---- the console factories (retro-games.js interface) on a stub kit ------------------------------------------------
const stubKit = () => {
  const makeStatus = (label) => ({ score: 0, left: 0, label, round: 1, target: 0, meter: -1, streak: 0, fire: false, verb: "", mult: 0, note: "" });
  const rng = () => { const s = new Uint32Array(1); const next = () => { s[0] += 0x6d2b79f5; let t = s[0]; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; return { seed: (n) => { s[0] = n >>> 0; }, next, int: (n) => Math.floor(next() * n) }; };
  const noop = () => {};
  return { W: 160, H: 120, INK: new Proxy({}, { get: () => "#000000" }), TEXT: new Proxy({}, { get: () => 0 }), text: noop, centre: noop, number: noop, makeStatus, rng,
    hooks: (host) => ({ popup: noop, cue: noop, shake: noop, crack: noop, flop: noop, aim: host.aim, onEnd: host.onEnd || noop, over: host.over || noop }) };
};
BL.retroGames = { kit: stubKit() };
const ctx = { fillStyle: "", fillRect() {}, drawImage() {} };
const face = (make, drive) => {
  const aim = { x: 0, hold: 0, steps: 0, y: 0, stepsY: 0 }, host = { aim, still: false, onEnd: (s) => { host.ended = s; }, over: () => { host.overs = (host.overs || 0) + 1; } };
  const g = make(host), shape = ["kind", "name", "help", "coach", "stars", "tickets", "status", "start", "act", "stop", "update", "draw"].every((k) => g[k] !== undefined) && g.aims === true;
  g.start(7); let frames = 0;
  for (; frames < 6000 && host.ended === undefined; frames++) { drive(g, aim, frames); g.update(1 / 60); g.draw(ctx); }
  return { shape, ended: host.ended, overs: host.overs, frames, playing: g.playing, tickets: g.tickets(1e6) };
};
// Nim: always take the whole heap the cursor is on after moving to the largest.
const nimRun = face(G.nim.make, (g, aim, f) => { if (f % 20 === 0) { aim.stepsY -= 7; g.act(); } if (f % 20 === 10) aim.steps++; });
check("the Nim console game keeps the factory shape, plays five games and ends once", nimRun.shape && nimRun.ended >= 0 && nimRun.overs === 1 && !nimRun.playing && nimRun.tickets === 0, JSON.stringify(nimRun));
const crtRun = face(G.crt.make, (g, aim, f) => { const t = g.target, S = g.crt.state; if (f % 10 === 0) { if (S.bright < t.tb) aim.steps++; else if (S.bright > t.tb) aim.steps--; else if (S.contrast < t.tc) aim.stepsY--; else if (S.contrast > t.tc) aim.stepsY++; else g.act(); } });
check("the CRT console game: matching the reference scores 100 a round over three rounds", crtRun.shape && crtRun.ended === 300 && crtRun.overs === 1, JSON.stringify(crtRun));
const ptRun = face(G.pointer.make, (g, aim) => {
  const b = g.board, C = g.round, t = b.target(); if (t < 0) return;
  if (C.mode === 0) { const tx = t % 3 + 0.5, ty = Math.floor(t / 3) + 0.5; aim.x = Math.max(-1, Math.min(1, (tx - C.px) * 4)); aim.y = Math.max(-1, Math.min(1, (ty - C.py) * 4)); if (Math.abs(tx - C.px) < 0.2 && Math.abs(ty - C.py) < 0.2) g.act(); }
  else { aim.x = aim.y = 0; if (C.col !== t % 3) aim.steps++; else if (C.row !== Math.floor(t / 3)) aim.stepsY++; else g.act(); }
});
check("the pointer console game times a pointer round and a typed round and ends once", ptRun.shape && ptRun.ended > 0 && ptRun.overs === 1, JSON.stringify(ptRun));

const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} Era 0 upgrade checks passed`);
process.exit(failed ? 1 : 0);
