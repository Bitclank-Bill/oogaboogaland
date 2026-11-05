// Era 2's second upgrade (gv/upgrade2-era-2): end states, Calm, holds, active(false), idle frames, the agreed sound cues
// and the scene records added, through genesis-era-2.js and its cluster themselves on a real kit (the engine's models
// and scene graph, a stub label). Run from the repository root: `node test/genesis-era-2-upgrade2.mjs [base-dir]`,
// where base-dir (optional) holds the base commit's src/js files for the record count.
import { readFile } from "node:fs/promises";
import { runInNewContext } from "node:vm";
import { join } from "node:path";

const root = process.cwd(), baseDir = process.argv[2] || null;
const FILES = ["math", "scene", "models", "genesis-voyage", "genesis-world", "genesis-props", "genesis-exhibits", "genesis-era-2-four", "genesis-era-2-cluster", "genesis-era-2-spent", "genesis-era-2"];
const ALLOWED = ["whir", "click", "clack", "relay", "chime", "thunk", "rustle-paper", "beep", "hum-start", "hum-stop"];
const results = {}, info = {};
const check = (name, ok) => { results[name] = !!ok; };

const boot = async (dir) => {
  const context = { window: {}, crypto: globalThis.crypto };
  for (const f of FILES) {
    let src;
    try { src = await readFile(join(dir, `src/js/${f}.js`), "utf8"); } catch (_) { continue; }
    runInNewContext(src, context);
  }
  const BL = context.window.BL, { createNode, addChild } = BL.scene, M = BL.models, W = BL.genesisWorld, parent = createNode(), cues = [], signs = [];
  const label = () => ({ back: M.box({ w: 1, h: 0.3, d: 0.05, color: "#000000" }), face: M.box({ w: 1, h: 0.3, d: 0.01, color: "#ffffff" }), width: 2.4, height: 0.6 });
  const place = (n) => { addChild(parent, n); return n; };
  const kit = { era: W.ERAS[2], top: W.BANK_TOP, channel: W.CHANNEL, M, createNode, addChild, place, label, cue: (name) => cues.push(name),
    solid: (w, h, d, color, x, y, z, emissive = 0) => place(createNode({ geometry: M.box({ w, h, d, color, emissive }), position: { x, y, z } })),
    sign: (t, sub, x, y, z, yaw = 0, height = 0.6) => { signs.push({ t, x, y, z, height }); const l = label(), n = place(createNode({ position: { x, y, z }, rotation: { x: 0, y: yaw, z: 0 } })); addChild(n, createNode({ geometry: l.back }), createNode({ geometry: l.face })); return n; },
    obstacle: () => {}, prop: (d) => d };
  const def = BL.genesisExhibits.eras[2];
  def.build(kit);
  return { BL, def, parent, cues, signs, Y: W.BANK_TOP };
};
const count = (n) => 1 + n.children.reduce((s, c) => s + count(c), 0);
const S = (calm = false) => ({ era: 2, walking: true, reading: false, x: -10, z: 0, calm });
const run = (def, seconds, calm = false, dt = 1 / 60) => { for (let t = 0; t < seconds - 1e-9; t += dt) def.update(dt, t, S(calm)); };
const snapshot = (n) => { const rows = []; const v = (q) => { rows.push(q.position.x, q.position.y, q.position.z, q.rotation.x, q.scale.y, q.visible ? 1 : 0, q.geometry ? 1 : 0); q.children.forEach(v); }; v(n); return rows.join(","); };

const A = await boot(root), BL = A.BL, E2 = BL.genesisEra2, C = BL.genesisEra2Cluster, v = E2.visit, P = v.parts, L = v.live, cp = v.cluster.parts, cl = v.cluster.live;

// --- The Merkle board: the hash wave climbs leaf to root, and the root lamp waits for it ------------------------------
{
  A.cues.length = 0;
  L.merkle.change(2, "Mallory's key");
  run(A.def, 1 / 60);
  const start = P.lit[10].visible && !P.lit[5].visible && !P.lit[1].visible && P.rootOk.visible && !P.rootBad.visible && P.lit[10].scale.y > 1.2;
  // Level 1 lights at 0.22 s and level 2 at 0.44 s; the root (0.66 s) not yet.
  run(A.def, 0.5);
  const middle = P.lit[5].visible && P.lit[2].visible && !P.lit[1].visible && P.rootOk.visible;
  run(A.def, 0.3);
  const root = P.lit[1].visible && P.rootBad.visible && !P.rootOk.visible;
  run(A.def, 0.4);
  check("merkleWave", start && middle && root && [10, 5, 2, 1].every((k) => P.lit[k].scale.y === 1) && !E2.moving(P, L) && A.cues.includes("click") && A.cues.includes("relay"));
  // VERIFY after TRUST: the proof lights up the tree in order and the root answers with a chime.
  A.cues.length = 0;
  const t = L.merkle;
  t.trust(); run(A.def, 1);
  // Record 6 is leaf node 13; its proof is nodes 12, 7 and 2, lit one level at a time.
  E2.merkleTerminal(t).run("VERIFY 6");
  run(A.def, 1 / 60);
  const proofStart = P.lit[13].visible && P.proofs[12].visible && !P.proofs[7].visible && !P.proofs[2].visible;
  run(A.def, 1);
  check("merkleVerify", proofStart && P.proofs[12].visible && P.proofs[7].visible && P.proofs[2].visible && A.cues.includes("chime"));
  // Calm: one frame shows the whole path and the root at once.
  t.change(5, "calm key"); run(A.def, 1 / 60, true);
  check("merkleCalm", [13, 6, 3, 1].every((k) => P.lit[k].visible && P.lit[k].scale.y === 1) && P.rootBad.visible && !E2.moving(P, L));
  t.reset(); run(A.def, 1);
}

// --- The blind-stamp desk as a sequence ------------------------------------------------------------------------------
{
  const b = L.blind, R = P.slipRest, En = P.envRest;
  A.cues.length = 0;
  b.write("token"); run(A.def, 1 / 60);
  const sliding = P.slip.visible && P.slip.position.x > R.x + 0.3;
  run(A.def, 0.5);
  const written = P.slip.visible && Math.abs(P.slip.position.x - R.x) < 1e-9;
  b.seal(); run(A.def, 0.2);
  const into = P.slip.visible && !P.envelope.visible && P.slip.position.z < R.z && P.slip.position.z > En.z;
  run(A.def, 0.6);
  const sealed = !P.slip.visible && P.envelope.visible && P.carbon.visible && Math.abs(P.envelope.position.y - En.y) < 1e-9;
  b.stamp(); run(A.def, 0.07);
  const falling = P.stamp.position.y < P.stampRest && !P.envMark.visible;
  run(A.def, 0.1);
  const landed = P.envMark.visible && A.cues.includes("thunk");
  run(A.def, 1);
  const lifted = P.stamp.position.y === P.stampRest && P.envMark.visible;
  b.open(); run(A.def, 0.2);
  const opening = P.envelope.visible && P.envelope.position.x < En.x;
  run(A.def, 1);
  const opened = !P.envelope.visible && P.slip.visible && P.slipMark.visible && Math.abs(P.slip.position.x - R.x) < 1e-9 && Math.abs(P.slip.position.z - R.z) < 1e-9;
  check("blindSequence", sliding && written && into && sealed && falling && landed && lifted && opening && opened && A.cues.filter((c) => c === "rustle-paper").length === 2);
  b.check(); run(A.def, 1 / 60);
  check("blindCheck", P.okLamp.visible && A.cues.includes("chime"));
  // Calm: a whole sequence in one frame.
  b.reset(); run(A.def, 1 / 60, true); b.write("t2"); b.seal(); b.stamp(); run(A.def, 1 / 60, true);
  check("blindCalm", P.envelope.visible && P.envMark.visible && !P.slip.visible && P.stamp.position.y === P.stampRest && !E2.moving(P, L));
  b.reset(); run(A.def, 1);
}

// --- The disks glide and lift; the maze's player walks its trail -----------------------------------------------------
{
  const f = L.floppy, l = E2.LAYOUT.floppy;
  A.cues.length = 0;
  const d0 = f.order[0], d1 = f.order[1];
  f.swap(0, 1); run(A.def, 0.05);
  const mid = P.disks[d0].position.z > l.z - 0.32 && P.disks[d0].position.z < l.z - 0.16;
  run(A.def, 1.5);
  const placed = Math.abs(P.disks[d0].position.z - (l.z - 0.16)) < 1e-9 && Math.abs(P.disks[d1].position.z - (l.z - 0.32)) < 1e-9;
  f.load(2); run(A.def, 0.15);
  const out = !P.disks[f.loaded].visible && P.driveLight.visible && A.cues.includes("whir");
  f.eject(); run(A.def, 1);
  check("floppyMotion", mid && placed && out && P.disks.every((n) => n.visible) && !E2.moving(P, L));
  f.reset(); run(A.def, 2);
  const z = L.maze;
  z.reset(0); run(A.def, 0.1);
  A.cues.length = 0;
  const mz = z.maze(), cell = { x: 0, y: 0, z: 0 };
  const moved = z.runMoves("DDSSAASSDDDDWW");
  run(A.def, 1 / 60);
  P.mazeCell(z.at, cell);
  const notYet = moved > 2 && Math.hypot(P.player.position.x - cell.x, P.player.position.z - cell.z) > 1e-6;
  run(A.def, moved / 12 + 0.3);
  check("mazeWalk", notYet && Math.hypot(P.player.position.x - cell.x, P.player.position.z - cell.z) < 1e-9 && !E2.moving(P, L)
    && A.cues.filter((c) => c === "beep").length === z.held() && P.leaves.every((n, i) => n.visible === !z.got[i]));
  z.reset(0); run(A.def, 0.1); z.runMoves("DDSS"); run(A.def, 1 / 60, true);
  P.mazeCell(z.at, cell);
  check("mazeCalm", Math.hypot(P.player.position.x - cell.x, P.player.position.z - cell.z) < 1e-9);
  z.reset(0); run(A.def, 0.2);
}

// --- The cluster: counters drop, knobs turn and colours climb, reels spin up and coast -------------------------------
{
  A.cues.length = 0;
  const g = cl.game, G = cp.fourGrid;
  const t4 = BL.genesisEra2Four.terminal(g);
  t4.run("4");
  run(A.def, 1 / 60);
  const yours = g.cells.findIndex((c, i) => c === 1), its = g.cells.findIndex((c) => c === 2);
  const rest = (i) => G.gy + 0.05 + ((i / 7) | 0) * G.cell + G.cell / 2;
  const falling = cp.holes[yours].position.y > rest(yours) + 0.1 && cp.holes[its].geometry === cp.holeGeo[0];
  // The first counter lands after about 0.44 s; the second starts 0.35 s after it.
  run(A.def, 0.55);
  const firstDown = Math.abs(cp.holes[yours].position.y - rest(yours)) < 1e-9 && A.cues.filter((c) => c === "clack").length === 1;
  run(A.def, 1.2);
  check("fourDrops", falling && firstDown && Math.abs(cp.holes[its].position.y - rest(its)) < 1e-9 && cp.holes[its].geometry === cp.holeGeo[2] && A.cues.filter((c) => c === "clack").length === 2 && cp.lastMark.visible);
  t4.run("RESET"); run(A.def, 1 / 60);
  check("fourReset", cp.holes.every((h, i) => h.geometry === cp.holeGeo[0] && Math.abs(h.position.y - rest(i)) < 1e-9));
  // The colour screen.
  A.cues.length = 0;
  const sc = cl.screen;
  sc.set("g", 4); run(A.def, 0.25);
  const turning = cp.anim.level[1] > 0.5 && cp.anim.level[1] < 3.5 && cp.anim.shownLevel[1] > 0 && cp.anim.shownLevel[1] < 4;
  run(A.def, 1);
  check("screenKnobs", turning && cp.anim.level[1] === 4 && cp.anim.shownLevel[1] === 4 && Math.abs(cp.knobs[1].rotation.x + 2.4) < 1e-9 && A.cues.includes("click"));
  sc.set("b", 4); run(A.def, 1 / 60, true);
  check("screenCalm", cp.anim.level[2] === 4 && cp.anim.shownLevel[2] === 4);
  sc.reset(); run(A.def, 1);
  // The cassette.
  A.cues.length = 0;
  const tape = cl.tape;
  tape.play(); run(A.def, 1 / 60);
  const spinUp = cp.anim.omegaR > 0 && cp.anim.omegaR < 0.5 * (C.PLAY_RATE * 6 / tape.radius(tape.pos));
  run(A.def, 2);
  const full = Math.abs(cp.anim.omegaR - C.PLAY_RATE * 6 / tape.radius(tape.pos)) < 0.05 * Math.abs(cp.anim.omegaR) + 1e-3 && cp.anim.press[0] === 0.02;
  tape.stop(); run(A.def, 0.1);
  const coasting = cp.anim.omegaR > 0;
  run(A.def, 3);
  check("tapeMotion", spinUp && full && coasting && cp.anim.omegaR === 0 && cp.anim.omegaL === 0 && cp.anim.press[1] === 0.02 && cp.anim.press[0] === 0 && !C.moving(v.cluster)
    && A.cues.includes("whir") && A.cues.includes("click"));
  tape.reset(); run(A.def, 1);
  tape.play(); const before = [cp.reels[0].rotation.x, cp.reels[1].rotation.x]; run(A.def, 1, true);
  check("tapeCalm", cp.reels[0].rotation.x === before[0] && cp.reels[1].rotation.x === before[1] && tape.pos > 0);
  tape.reset(); run(A.def, 1);
}

// --- active(false), holds, idle frames ------------------------------------------------------------------------------
{
  // Everything mid-motion, then the visitor leaves the gallery.
  L.merkle.change(1, "x"); L.blind.write("y"); L.blind.seal(); L.floppy.swap(0, 3); L.maze.runMoves("DDSS");
  BL.genesisEra2Four.terminal(cl.game).run("3"); cl.screen.set("r", 1); cl.tape.play();
  run(A.def, 1 / 60);
  const wasMoving = E2.moving(P, L) && C.moving(v.cluster);
  A.def.active(false, S());
  check("activeFalse", wasMoving && !E2.moving(P, L) && !C.moving(v.cluster) && cl.tape.mode === "stop" && P.envelope.visible && P.lit[9].visible && P.lit[1].visible);
  // Holds and pause: the host stops calling update; nothing in these files moves on its own (no timers or frames).
  const sources = await Promise.all(["genesis-era-2", "genesis-era-2-cluster", "genesis-era-2-four", "genesis-era-2-spent"].map((f) => readFile(join(root, `src/js/${f}.js`), "utf8")));
  check("noTimers", sources.every((s) => !/setTimeout|setInterval|requestAnimationFrame|performance\.now|Date\.now/.test(s)));
  L.merkle.change(3, "held"); run(A.def, 1 / 60);
  const frozen = snapshot(A.parent);
  // (no update calls: a hold)
  check("holdFreezes", snapshot(A.parent) === frozen && E2.moving(P, L));
  run(A.def, 2);
  // Idle: settled, a hundred frames change nothing in the graph and do no work: a sample of each exhibit's animated
  // transforms is wrapped in write counters, and none is written.
  const idle = snapshot(A.parent);
  const writes = { n: 0 }, watch = (node, key) => { const real = node[key]; node[key] = new Proxy(real, { set: (o, k, val) => { writes.n++; o[k] = val; return true; } }); return () => { node[key] = real; }; };
  const undo = [watch(P.player, "position"), watch(P.lit[1], "scale"), watch(P.stamp, "position"), watch(P.slip, "position"), watch(P.disks[0], "position"),
    watch(cp.reels[0], "rotation"), watch(cp.holes[0], "position"), watch(cp.knobs[0], "rotation"), watch(cp.buttons[0], "position")];
  run(A.def, 100 / 60);
  undo.forEach((f) => f());
  info.idleWrites = writes.n;
  check("idleStill", snapshot(A.parent) === idle && writes.n === 0 && !E2.moving(P, L) && !C.moving(v.cluster));
}

// --- Cues and labels ------------------------------------------------------------------------------------------------
{
  const used = new Set();
  const capture = A.cues; capture.forEach((c) => used.add(c));
  const src = await Promise.all(["genesis-era-2", "genesis-era-2-cluster"].map((f) => readFile(join(root, `src/js/${f}.js`), "utf8")));
  for (const s of src) for (const m of s.matchAll(/cue\(parts, "([a-z-]+)"\)/g)) used.add(m[1]);
  check("cuesAgreed", [...used].every((c) => ALLOWED.includes(c)) && used.size >= 6);
  info.cues = [...used].sort();
  // The moved labels stand clear of what they label: the blind desk's above its sequence, the disks' above the lifted
  // disks, the maze's behind the table.
  const Ly = E2.LAYOUT, sign = (re) => A.signs.find((g) => re.test(g.t)), grow = 1.4;
  const blind = sign(/BLIND-STAMP/), disks = sign(/DISK/), maze = sign(/LEAVES TO ROOT/);
  check("labelsClear", blind.y - blind.height * grow / 2 > A.Y + 2.35 && disks.y - disks.height * grow / 2 > P.diskY + 0.35 + 0.13 && maze.x < Ly.maze.x - 0.8);
}

// --- Scene records added against the base ------------------------------------------------------------------------
{
  const head = count(A.parent);
  info.records = { head };
  if (baseDir) {
    const B = await boot(baseDir), base = count(B.parent);
    info.records.base = base; info.records.added = head - base;
    check("recordBudget", head - base >= 0 && head - base <= 150);
  }
}

const failed = Object.entries(results).filter(([, ok]) => !ok).map(([k]) => k);
console.log(JSON.stringify({ results, info }));
console.log(failed.length ? `FAILED: ${failed.join(", ")}` : `PASS: ${Object.keys(results).length} checks · cues ${info.cues.join(", ")} · records ${JSON.stringify(info.records)}`);
process.exit(failed.length ? 1 : 0);
