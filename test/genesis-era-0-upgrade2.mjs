// Era 0's second upgrade (gv/upgrade2-era-0): the exhibits' motion. Run with
//   node test/genesis-era-0-upgrade2.mjs
// Builds Era 0 on a kit with real node fields (position, rotation, scale, visible, glow, children) and a model stub,
// drives every exhibit through its own terminal, then steps the era's own `update` to check: each command's end state,
// that the shown model moves between the two, Calm showing the end at once, holds (no update) freezing it,
// `active(false)` finishing it, nothing running while idle, and only the cue names the host accepts. It also counts
// the scene records the build adds against 3901b004 (git show), which it prints.
import { readFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { runInNewContext } from "node:vm";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const BASE_SHA = "3901b004e1a7fe895e9b0bdb6d7c97dcab84c41f";
const CUES = new Set(["whir", "click", "clack", "relay", "chime", "thunk", "rustle-paper", "beep", "hum-start", "hum-stop"]);
const FILES = ["genesis-voyage", "genesis-world", "genesis-props", "genesis-exhibits", "genesis-era-0-nim", "genesis-era-0-crt", "genesis-era-0-pointer", "genesis-era-0-lamps", "genesis-era-0"];
const load = async (source = (f) => readFile(join(root, `src/js/${f}.js`), "utf8")) => {
  const context = { window: { BL: {} } };
  for (const f of FILES) runInNewContext(await source(f), context);
  return context.window.BL;
};
const results = [];
const check = (name, ok, detail = "") => { results.push(!!ok); console.log(`${ok ? "ok  " : "FAIL"} ${name}${ok || !detail ? "" : ` :: ${detail}`}`); };

// A kit whose nodes carry what the scene's do, a model stub that counts parts, and a cue that records names.
const build = (BL) => {
  const W = BL.genesisWorld, nodes = [], records = { solid: 0, sign: 0, placed: 0, child: 0 }, props = {}, cues = [];
  const node = (o = {}) => { const n = { position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 }, visible: true, glow: 1, children: [], ...o }; n.position = { ...{ x: 0, y: 0, z: 0 }, ...(o.position || {}) }; nodes.push(n); return n; };
  const geo = () => ({ verts: [] });
  const M = { box: geo, lathe: geo, bevelBox: geo, merge: geo, moved: (g) => g, turnedY: (g) => g, turnedX: (g) => g, turnedZ: (g) => g };
  const kit = { era: W.ERAS[0], top: W.BANK_TOP, channel: W.CHANNEL, M, createNode: node, label: () => ({ face: {}, back: {}, width: 1, height: 1 }), notify() {},
    addChild: (p, c) => { records.child++; p.children.push(c); return p; },
    place: (n) => { records.placed++; return n; },
    solid: (w, h, d, color, x, y, z, emissive = 0) => { records.solid++; return node({ color, emissive, w, position: { x, y, z } }); },
    sign: () => { records.sign++; return node(); }, obstacle() {},
    prop: (d) => { props[d.id] = d; return d; }, cue: (name) => cues.push(name) };
  const def = BL.genesisExhibits.eras[0];
  def.build(kit);
  const term = (id) => { const r = props[id].onUse({}); return (line) => r.terminal.run(line).lines.join(" | "); };
  const run = (seconds, state = {}) => { for (let t = 0; t < seconds; t += 1 / 60) def.update(1 / 60, t, { calm: false, ...state }); };
  const running = () => def.motion.running;
  return { def, kit, nodes, records, props, cues, term, run, running, top: W.BANK_TOP };
};

const BL = await load(), A = build(BL), top = A.top;
const byColor = (c) => A.nodes.filter((n) => n.color === c);
const settle = () => { A.run(8); return A.running(); };

// ---- the disk record finder --------------------------------------------------------------------------------------
const seek = A.term("e0-disk-seek"), arm = byColor("#ffd276").at(-1);
const reply = seek("SEEK 49"), to = top + 0.45 + 49 * 0.05;
const final = Math.abs(arm.position.y - to) < 1e-9;
A.run(0.2);
const between = arm.position.y > top + 0.45 + 1e-3 && arm.position.y < to - 1e-3;
A.run(0.5);
const arrived = Math.abs(arm.position.y - to) < 1e-9 && A.cues.includes("whir") && A.cues.includes("click");
check("SEEK sets the arm's final height at once, the shown arm glides there (~0.6 s, eased) and says so in its reply", final && between && arrived && /watch it glide to that height in the live model/.test(reply) && !/after closing this window/.test(reply));
const platters = A.nodes.find((n) => n.position && n.position.y === top && n.children.length === 0 && n.rotation.y !== 0);
check("the round platters turn while the arm seeks, then coast to a stop", !!platters && settle() === 0 && (() => { const r = platters.rotation.y; A.run(1); return platters.rotation.y === r; })());
check("the fifty square silhouettes stay as nodes, hidden behind the round platters", byColor("#707a7f").length === 25 && byColor("#9aa2a5").length === 25 && [...byColor("#707a7f"), ...byColor("#9aa2a5")].every((n) => !n.visible));

// ---- punch a message ---------------------------------------------------------------------------------------------
const punch = A.term("e0-punch"), holes = byColor("#20292c"), card = byColor("#e4d4a1").at(-1);
const pattern = () => holes.map((h) => h.visible ? 1 : 0).join("");
punch("PUNCH OOGA");
const want = pattern();
A.run(0.2);
const travelling = card.scale.x < 0.99 && holes.every((h) => !h.visible);
A.run(1.3);
const partial = pattern() !== want && pattern() !== "0".repeat(56);
const done = settle() === 0 && pattern() === want && Math.abs(card.position.x - holes[0].position.x - 1.35) < 1e-9 && card.scale.x === 1;
check("PUNCH swaps the card (out to the stacker, in from the hopper), punches column by column, and ends with the command's holes", travelling && partial && done && A.cues.includes("rustle-paper") && A.cues.filter((c) => c === "clack").length >= 4);
punch("FLIP 1 7"); const flipWant = pattern(); settle();
check("FLIP punches one column and ends on the flipped card", pattern() === flipWant && /^Read: /.test(punch("READ")));
check("the card prints its eight column numbers and the punch head carries pins", card.children.length === 1);

// ---- the probability race ----------------------------------------------------------------------------------------
const race = A.term("e0-race"), gold = byColor("#f2c14e").at(-1), blue = byColor("#68c6ed").at(-1), start0 = gold.position.x;
race("ODDS 100"); race("STEP 64");
const goldTo = gold.position.x;
A.run(0.3);
const easing = gold.position.x > start0 + 1e-3 && gold.position.x < goldTo - 1e-3;
settle();
const flag = A.nodes.find((n) => n.children.length === 0 && n.visible && n.position.y > top + 1.3 && n.rotation.y === 0 && Math.abs(n.position.x - (start0 + 6.7)) < 0.01);
check("STEP sets the racers' final places at once, the shown racers ease there, and a won race raises the finish flag with a chime", easing && gold.position.x === goldTo && blue.position.x === start0 && !!flag && A.cues.includes("chime"), JSON.stringify({ easing, gx: gold.position.x, goldTo, flag: !!flag }));
const board = A.nodes.find((n) => n.children.length === 16 && n.rotation.x === 0);
check("the counting lamp board lights a lamp each eight steps: all eight gold, no blue after 64 gold steps", !!board && board.children.slice(0, 8).every((l) => l.visible) && board.children.slice(8).every((l) => !l.visible));
race("RESET"); settle();
check("RESET brings both racers home, the lamps out and the flag down", gold.position.x === start0 && blue.position.x === start0 && board.children.every((l) => !l.visible) && !flag.visible);

// ---- ARPANET's login ---------------------------------------------------------------------------------------------
const login = A.term("e0-login"), lamp = byColor("#8effab").at(-1);
const light = A.nodes.find((n) => n.children.length === 6), printer = A.nodes.find((n) => n.children.length === 8);
const typed = () => printer.children.map((c) => c.visible ? 1 : 0).join("");
login("LOGIN");
const lampFinal = lamp.visible === false;
A.run(0.5);
const carrying = light.visible && light.children[1].visible && !light.children[2].visible && lamp.visible && typed() === "00000000";
A.run(0.6);
const typedL = typed() === "10000000" && light.children[2].visible;
settle();
check("LOGIN: the light carries L, then O, each typed as it arrives, then stops red and the console lamp goes out", lampFinal && carrying && typedL && typed() === "11100000" && !light.visible && !lamp.visible && A.cues.includes("relay") && A.cues.includes("thunk"));
login("RETRY"); settle();
check("RETRY sends L O G I N down the line, typed on the sheet's second line, the lamp lit and a chime", typed() === "11111111" && lamp.visible && !light.visible);
login("RESET");
check("RESET clears the sheet and the line", typed() === "00000000" && !light.visible && lamp.visible && A.running() === 0 || (settle() === 0 && typed() === "00000000"));

// ---- Feller's book -----------------------------------------------------------------------------------------------
const book = A.nodes.find((n) => n.children.length === 16 && n.rotation.x > 0);
A.props["e0-feller"].onUse({});
A.run(1);
const drawing = book.children.filter((c) => c.visible).length;
settle();
check("opening Feller's shelf draws the book's random walk a step at a time, to all sixteen steps", drawing > 2 && drawing < 16 && book.children.every((c) => c.visible) && book.rotation.x > 0);

// ---- the toys: Nim, the CRT, the pointer, the lamp panel ---------------------------------------------------------
const nim = A.term("e0-nim"), counters = byColor("#e8dcc0").slice(0, 15);
const heapsLeft = (line) => { const m = /A (\d+), B (\d+), C (\d+)/.exec(line); return +m[1] + +m[2] + +m[3]; };
const nimFinal = heapsLeft(nim("TAKE C 3"));
const shownAt = counters.filter((c) => c.visible).length;
A.run(0.1);
const sliding = counters.some((c) => c.visible && c.position.y > top + 0.886);
settle();
check("Nim: taken counters slide off the table's end and go; the rest stand home", sliding && counters.filter((c) => c.visible).length <= shownAt && counters.every((c) => !c.visible || Math.abs(c.position.y - (top + 0.885)) < 1e-9) && counters.filter((c) => c.visible).length === nimFinal);
const crt = A.term("e0-crt"), strips = byColor("#0f1a12");
crt("BRIGHT 4");
A.run(0.15);
const scanning = strips.some((s) => s.visible) && !strips.every((s) => s.visible);
settle();
check("CRT: a change redraws the frame line by line, ending with every line drawn", scanning && strips.every((s) => s.visible));
crt("BRIGHT 0"); crt("CONTRAST 0"); settle();
check("CRT: the tube hums down when it goes dark and up when it lights", A.cues.includes("hum-stop") && (crt("CONTRAST 4"), settle(), A.cues.includes("hum-start")));
const pt = A.term("e0-pointer"), cursor = byColor("#f4f4f4").at(-1), x0 = cursor.position.x;
pt("MOVE 1 0"); const xTo = cursor.position.x;
A.run(0.1);
const gliding = cursor.position.x > x0 + 1e-4 && cursor.position.x < xTo - 1e-4;
settle();
check("pointer: the cursor glides to its cell", gliding && cursor.position.x === xTo);
const panel = A.term("e0-lamps"), bulbs = byColor("#ffcf5a").slice(-8);
panel("SET 255");
A.run(0.1);
const warming = bulbs.every((b) => b.visible && b.glow > 0 && b.glow < 1);
settle();
check("lamp panel: the switches throw and the lamps warm up to full", warming && bulbs.every((b) => b.visible && b.glow === 1));

// ---- Calm, holds, leaving, idle, cues ----------------------------------------------------------------------------
seek("SEEK 3"); punch("PUNCH CALM"); race("STEP 10"); nim("RESET");
A.def.update(1 / 60, 0, { calm: true });
check("Calm: one update shows every command's end at once", A.running() === 0 && Math.abs(arm.position.y - (top + 0.45 + 3 * 0.05)) < 1e-9 && card.scale.x === 1);
seek("SEEK 40"); A.run(0.15);
const held = arm.position.y;
// A pause, the menu or the console holds the era (the scene calls no update): nothing moves.
check("holds: with no update the shown model stays where it was", arm.position.y === held && A.running() > 0);
A.def.active(false, {});
check("leaving the gallery finishes the motion at its end, nothing left running", A.running() === 0 && Math.abs(arm.position.y - (top + 0.45 + 40 * 0.05)) < 1e-9);
A.def.active(true, {}); settle();
const snap = JSON.stringify(A.nodes.map((n) => [n.position.x, n.position.y, n.rotation.y, n.visible, n.glow]));
A.run(2);
check("idle: with nothing running a frame changes nothing", A.running() === 0 && JSON.stringify(A.nodes.map((n) => [n.position.x, n.position.y, n.rotation.y, n.visible, n.glow])) === snap);
check(`cues: only the host's names (${[...new Set(A.cues)].join(", ")})`, A.cues.length > 0 && A.cues.every((c) => CUES.has(c)));
const B2 = build(BL);
check("a second visit starts fresh: its own animators and nodes, none running", B2.running() === 0 && B2.nodes.every((n) => !A.nodes.includes(n)));

// ---- records against 3901b004 ------------------------------------------------------------------------------------
try {
  const base = await load(async (f) => execFileSync("git", ["show", `${BASE_SHA}:src/js/${f}.js`], { cwd: root, encoding: "utf8" }));
  const R0 = build(base).records, R1 = build(await load()).records;
  const sum = (r) => r.solid + r.sign + r.placed + r.child;
  console.log(`records at 3901b004: ${JSON.stringify(R0)} (${sum(R0)}); now: ${JSON.stringify(R1)} (${sum(R1)}); added ${sum(R1) - sum(R0)}`);
  check("no solid or sign records added (new parts are placed nodes and their children)", R1.solid === R0.solid && R1.sign === R0.sign);
} catch (e) { console.log(`records: base not available (${e.message.split("\n")[0]})`); }

const failed = results.filter((r) => !r).length;
console.log(`\n${results.length - failed}/${results.length} Era 0 upgrade2 checks passed`);
process.exit(failed ? 1 : 0);
