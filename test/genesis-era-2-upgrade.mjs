// Era 2's upgrade cluster: rule checks for genesis-era-2-four.js and genesis-era-2-cluster.js, and their build through
// the exhibit kit with genesis-era-2.js. Run from the repository root: `node test/genesis-era-2-upgrade.mjs`.
// (A builder's own file; the suite's runner is the integrator's. It needs no Chrome and no build.)
import { readFile } from "node:fs/promises";
import { runInNewContext } from "node:vm";
import { join } from "node:path";

const root = process.cwd();
const load = async (context, files) => { for (const f of files) runInNewContext(await readFile(join(root, `src/js/${f}.js`), "utf8"), context); };
const results = {};
const check = (name, ok) => { results[name] = !!ok; };

// A canvas stand-in for the cabinet game's draw: every 2D call is a no-op, so draw runs end to end without a DOM.
const fakeCtx = () => new Proxy({}, { get: (t, k) => (k in t ? t[k] : () => {}), set: (t, k, v) => { t[k] = v; return true; } });
const fakeDocument = { createElement: () => ({ width: 0, height: 0, getContext: () => fakeCtx() }) };

const context = { window: {}, document: fakeDocument, crypto: globalThis.crypto };
await load(context, ["math", "scene", "models", "genesis-voyage", "genesis-world", "genesis-props", "genesis-exhibits", "genesis-era-2-four", "genesis-era-2-cluster", "genesis-era-2"]);
const BL = context.window.BL, F = BL.genesisEra2Four, C = BL.genesisEra2Cluster, E2 = BL.genesisEra2, W = BL.genesisWorld, P = BL.genesisProps, EX = BL.genesisExhibits;

// --- Four in a row: the rules and the computer -----------------------------------------------------------------------
{
  const g = F.createGame(7);
  // You 1,2,3 along the bottom with the computer answering on top: a horizontal four for you.
  for (const [you, it] of [[0, 0], [1, 1], [2, 2]]) { g.drop(you); g.drop(it); }
  g.drop(3);
  check("fourAcross", g.winner === F.YOU && [...g.line].sort((a, b) => a - b).join() === "0,1,2,3");
  const v = F.createGame(1);
  for (let i = 0; i < 3; i++) { v.drop(0); v.drop(1); }
  v.drop(0);
  check("fourUp", v.winner === F.YOU);
  // A slant: you at (0,0),(1,1),(2,2),(3,3) with filler.
  const d = F.createGame(1), seq = [0, 1, 1, 2, 2, 3, 2, 3, 3, 6, 3];
  for (const c of seq) d.drop(c);
  check("fourSlant", d.winner === F.YOU);
  // A full column is refused and the turn does not pass.
  const f = F.createGame(1);
  for (let i = 0; i < 6; i++) f.drop(0);
  const turn = f.turn;
  check("fullColumn", f.drop(0) === -1 && f.turn === turn && f.moves === 6);
  // A draw: a known no-win fill (columns in this order), every space taken and nobody's four.
  const dr = F.createGame(1), fill = [0, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 0, 2, 3, 2, 3, 2, 3, 3, 2, 3, 2, 3, 2, 4, 5, 4, 5, 4, 5, 5, 4, 5, 4, 5, 4, 6, 6, 6, 6, 6, 6];
  for (const c of fill) dr.drop(c);
  check("draw", dr.winner === 3 && dr.moves === 42);
  // The computer takes a win when it has one, blocks yours, and avoids handing you one.
  const w = F.createGame(1);
  for (const c of [6, 0, 6, 1, 5, 2]) w.drop(c);
  // You (O) 6,6,5; computer (X) 0,1,2: now your move; you play elsewhere and the computer must take column 3.
  w.drop(6);
  check("takesWin", w.choose() === 3);
  // Your three up the edge column: only a block explains the computer choosing it over the middle it prefers.
  const b = F.createGame(1);
  for (const c of [6, 1, 6, 2, 6]) b.drop(c);
  check("blocks", b.choose() === 6);
  // Seeded: two games on one seed play the same against the same moves; another seed may differ but stays legal.
  const replay = (seed) => { const x = F.createGame(seed), out = []; for (let i = 0; i < 6 && !x.winner; i++) { x.drop([3, 3, 2, 4, 1, 5][i]); if (!x.winner) { const c = x.choose(); out.push(c); x.drop(c); } } return out.join(); };
  check("seeded", replay(11) === replay(11) && replay(12).split(",").every((c) => +c >= 0 && +c < 7));
  const t = F.terminal(F.createGame(1));
  check("fourHowTo", /^FOUR IN A ROW TABLE/.test(t.banner[0]) && t.banner[1] === "HOW TO USE" && /^1\. /.test(t.banner[2]) && t.banner.slice(2, 6).every((l) => /^\d\. /.test(l)));
  const r1 = t.run("4"), r2 = t.run("DROP 9"), r3 = t.run("MORE");
  check("fourTerminal", r1.moved && r1.lines.some((l) => /computer drops/.test(l)) && /1 to 7/.test(r2.lines[0]) && r3.lines.some((l) => /HOLD/.test(l)) && r3.lines.some((l) => /modern museum homage/.test(l)));
  const rs = t.run("RESET");
  check("fourReset", rs.reset && rs.lines.some((l) => /Your move/.test(l)) && !rs.lines.join("").includes("O"));
}

// --- Four in a row: the cabinet game (retro-games.js factory interface) ------------------------------------------
{
  // retro-games.js reads the jumbotron's font at load; Node gets a stand-in with the same shape.
  BL.jumbotron = { text: { glyphOf: () => [], GLYPH_W: 5, GLYPH_H: 7, TRACKING: 1 } };
  await load(context, ["retro-games"]);
  const calls = { over: 0, end: 0, score: -1 };
  const aim = { x: 0, hold: 0, steps: 0, y: 0, stepsY: 0 };
  const host = { best: 0, aim, still: false, onEnd: (s) => { calls.end++; calls.score = s; }, over: () => { calls.over++; } };
  const game = F.make(host);
  const shape = ["kind", "name", "help", "coach", "stars", "tickets", "status", "start", "act", "stop", "update", "draw"].every((k) => k in game) && game.aims === true && typeof game.playing === "boolean";
  game.start(5);
  aim.steps = 10; game.update(1 / 60);
  const right = game.game && game.playing;
  // Always drop in the chosen column; step the frames until the run is decided and its beat is done.
  const ctx = fakeCtx();
  let frames = 0;
  while (calls.end === 0 && frames < 20000) {
    game.act(); game.update(1 / 60); game.draw(ctx); frames++;
    if (frames % 40 === 0) aim.steps += (frames / 40) % 2 ? -3 : 2;
  }
  check("factoryShape", shape && right);
  check("factoryRun", calls.over === 1 && calls.end === 1 && calls.score === game.status.score && game.game.winner > 0 && !game.playing);
  const replayScore = (seed) => { const c2 = { end: 0, s: 0 }, a2 = { x: 0, hold: 0, steps: 0, y: 0, stepsY: 0 }, g2 = F.make({ aim: a2, onEnd: (s) => { c2.end++; c2.s = s; }, over: () => {} }); g2.start(seed); let n = 0; while (!c2.end && n < 20000) { g2.act(); g2.update(1 / 60); n++; if (n % 40 === 0) a2.steps += (n / 40) % 2 ? -3 : 2; } return `${c2.s}:${g2.game.moves}:${[...g2.game.cells].join("")}`; };
  check("factorySeeded", replayScore(9) === replayScore(9));
  game.stop();
  check("factoryStop", !game.playing && game.game.moves === 0);
}

// --- The colour screen ------------------------------------------------------------------------------------------
{
  const s = C.createScreen();
  const lit = () => { let n = 0; for (let i = 0; i < C.PIC_W * C.PIC_H; i++) if (s.colourOf(i)) n++; return n; };
  const redOnly = lit();
  s.set("g", 4); s.set("b", 4);
  const all = lit() === C.PIC_W * C.PIC_H;
  const white = (() => { for (let i = 0; i < C.PIC_W * C.PIC_H; i++) if (C.PICTURE[(i / C.PIC_W) | 0][i % C.PIC_W] === "W" && s.colourOf(i) !== 124) return false; return true; })();
  check("screenMix", redOnly > 0 && redOnly < C.PIC_W * C.PIC_H && all && white && s.nameOf(4, 4, 0) === "yellow" && s.nameOf(4, 0, 4) === "magenta" && s.nameOf(2, 2, 2) === "dim white" && s.nameOf(0, 0, 0) === "black");
  check("screenBounds", !s.set("r", 5) && !s.set("r", -1) && !s.set("r", 1.5) && s.r === 4);
  const t = C.screenTerminal(C.createScreen());
  const a = t.run("G 4"), bad = t.run("B 9"), mix = t.run("MIX 4 4 0"), rs = t.run("RESET");
  check("screenTerminal", t.banner[1] === "HOW TO USE" && a.lines[0].includes("Green 4") && /0 to 4/.test(bad.lines[0]) && /yellow/.test(mix.lines[0]) && rs.reset && rs.lines.some((l) => /Red 4  Green 0  Blue 0/.test(l)));
  check("screenHonest", C.SCREEN_DEEPER.some((l) => /simplifies/.test(l)) && C.SCREEN_DEEPER.some((l) => /HOLD/.test(l)) && !C.SCREEN_DEEPER.join(" ").match(/\b1[89]\d\d\b/));
}

// --- The cassette player ----------------------------------------------------------------------------------------
{
  const t = C.createCassette();
  t.play();
  for (let i = 0; i < 60 * 60; i++) t.step(1 / 60, false);
  const ended = t.pos === 1 && t.mode === "stop";
  const spun = t.spinR !== 0 && t.spinL !== 0;
  t.rew(); for (let i = 0; i < 60 * 10; i++) t.step(1 / 60, false);
  const back = t.pos === 0 && t.mode === "stop";
  t.play(); t.step(0.5, false); t.stop(); const held = t.pos; t.step(5, false);
  const stopHolds = t.pos === held && t.mode === "stop";
  const calm = C.createCassette(); calm.play(); calm.step(2, true);
  check("cassetteRun", ended && spun && back && stopHolds && calm.pos > 0 && calm.spinL === 0 && calm.spinR === 0 && t.radius(0) < t.radius(0.5) && t.radius(1) === 1);
  const term = C.cassetteTerminal(C.createCassette());
  const p = term.run("PLAY"), st = term.run("STATUS"), s2 = term.run("STOP"), rw = term.run("REW"), rs = term.run("RESET");
  check("cassetteTerminal", term.banner[1] === "HOW TO USE" && /no sound/i.test(p.lines[0]) && /Playing/.test(st.lines[0]) && /stand still/.test(s2.lines[0]) && /REW|already/.test(rw.lines[0]) && rs.reset);
  const words = [...C.CASSETTE_DEEPER, ...term.banner].join(" ");
  check("cassetteHonest", !/\bminutes?\b|\bseconds? of\b|\bhours?\b|\bMB\b|\bcapacity of\b|\b1[89]\d\d\b/i.test(words) && /no running time/i.test(words) && /HOLD/.test(words));
}

// --- The cluster through the kit, with Era 2 ----------------------------------------------------------------------
const buildEra2 = (BLx) => {
  const { createNode, addChild } = BLx.scene, M = BLx.models, Wx = BLx.genesisWorld, parent = createNode(), reg = BLx.genesisProps.createRegistry();
  const obs = [], solids = [], defs = [], placed = [];
  const label = () => ({ back: M.box({ w: 1, h: 0.3, d: 0.05, color: "#000000" }), face: M.box({ w: 1, h: 0.3, d: 0.01, color: "#ffffff" }), width: 1, height: 0.3 });
  const place = (n) => { addChild(parent, n); placed.push(n); return n; };
  const era = Wx.ERAS[2];
  const kit = { era, top: Wx.BANK_TOP, channel: Wx.CHANNEL, M, createNode, addChild, place, label,
    solid: (w, h, d, color, x, y, z, emissive = 0) => { solids.push({ x0: x - w / 2, x1: x + w / 2, z0: z - d / 2, z1: z + d / 2, top: y + h / 2, x, z }); return place(createNode({ geometry: M.box({ w, h, d, color, emissive }), position: { x, y, z } })); },
    sign: (t, sub, x, y, z, yaw = 0) => { const l = label(), n = place(createNode({ position: { x, y, z }, rotation: { x: 0, y: yaw, z: 0 } })); addChild(n, createNode({ geometry: l.back }), createNode({ geometry: l.face })); return n; },
    obstacle: (x0, x1, z0, z1) => { obs.push({ x0, x1, z0, z1 }); }, prop: (d) => { defs.push(d); return reg.register({ ...d, era: 2 }); } };
  BLx.genesisExhibits.eras[2].build(kit);
  return { parent, reg, obs, solids, defs, era, def: BLx.genesisExhibits.eras[2] };
};
const count = (n) => 1 + n.children.reduce((s, c) => s + count(c), 0);
{
  const B = buildEra2(BL), ids = B.defs.map((d) => d.id);
  check("eightProps", ids.length === 8 && ["e2-merkle", "e2-blind", "e2-pc", "e2-floppy", "e2-maze", "e2-four", "e2-crt", "e2-cassette"].every((id) => ids.includes(id)));
  const mine = B.defs.filter((d) => C.KEYS.some((k) => C.EXHIBITS[k].id === d.id));
  check("contextOnly", mine.length === 3 && mine.every((d) => d.connection === "context" && d.ref === undefined && EX.checkProp(2, d) === null && d.year === "1980s" && d.label.includes("1980s") && /museum homage/.test(d.date) && /HOLD|claimed/.test(d.date)));
  check("sources", mine.every((d) => d.sourceKeys.every((k) => { const s = P.sourceOf(k); return s && /^https:\/\//.test(s.href); })));
  check("opensTerminal", mine.every((d) => { const r = d.onUse({}); return r.terminal && typeof r.terminal.run === "function" && r.terminal.banner.includes("HOW TO USE"); }));
  // Plots: the reserved zones, the old stream and 1.5 m beside it, the height limit, and Era 2's gallery.
  const bay = W.MUSEUM.bays[2], reserved = W.reservedZones(2), hit = (a, b) => a.x0 < b.x1 && a.x1 > b.x0 && a.z0 < b.z1 && a.z1 > b.z0;
  const inGallery = (b) => b.x0 >= bay.x0 && b.x1 <= bay.x1 && b.z0 >= B.era.z1 - bay.depth && b.z1 <= B.era.z1 - W.MUSEUM.OPEN;
  const cl = C.footprints();
  check("plots", cl.every((b) => inGallery(b) && !reserved.some((r) => hit(b, r)) && b.x1 <= W.CHANNEL.x0 - W.BANK.FRONT) && B.solids.every((s) => s.top <= W.BANK_TOP + W.BANK.MAX_H));
  // The cluster takes no existing exhibit's floor, and stays off the old ramp's walkway.
  const old = E2.footprints();
  check("noOverlap", cl.every((b) => !old.some((o) => hit(b, o)) && !hit(b, { x0: -16.5, x1: W.CHANNEL.x0, z0: B.era.z - 2.6, z1: B.era.z + 2.6 })) && cl.every((a, i) => cl.every((b, j) => i === j || !hit(a, b))));
  // The FUD Patrol floor: about 3 x 3 m, inside the gallery near the arch, clear of every Era 2 solid, obstacle and use point.
  const Z = E2.FUD_PATROL_ZONE;
  const fud = Math.abs(Z.x1 - Z.x0 - 3) < 1e-9 && Math.abs(Z.z1 - Z.z0 - 3) < 1e-9 && inGallery(Z) && B.era.z1 - Z.z1 >= W.MUSEUM.OPEN && B.era.z1 - Z.z1 <= 12 && !reserved.some((r) => hit(Z, r))
    && !B.solids.some((s) => hit(s, Z)) && !B.obs.some((o) => hit(o, Z)) && !B.defs.some((d) => d.at.x > Z.x0 - 0.3 && d.at.x < Z.x1 + 0.3 && d.at.z > Z.z0 - 0.3 && d.at.z < Z.z1 + 0.3);
  check("fudZoneClear", fud);
  // Taps and walk-ups: each tap box over its model's footprint, each walk-up point in front of it toward the old stream.
  check("picks", mine.every((d) => { const o = B.obs.find((b) => Math.abs((b.x0 + b.x1) / 2 - d.pick.x) < 1e-9 && Math.abs((b.z0 + b.z1) / 2 - d.pick.z) < 1e-9); return o && d.at.x >= o.x1 + 0.6 && d.at.z > o.z0 && d.at.z < o.z1; }));
  // Every Era 2 exhibit, old and new, can still be walked to: a breadth-first walk on a 0.2 m grid over the left bank
  // from the gallery's way in, a 0.3 m body against every obstacle and lamp post.
  const lamps = W.lampPosts(2).map((l) => ({ x0: l.x0, x1: l.x1, z0: l.z0, z1: l.z1 }));
  const blockers = [...B.obs, ...lamps], cell = 0.2, pad = 0.3, x0 = bay.x0, x1 = W.CHANNEL.x0, zTop = B.era.z1 - W.MUSEUM.OPEN, zBot = B.era.z1 - bay.depth;
  const nx = Math.round((x1 - x0) / cell), nz = Math.round((zTop - zBot) / cell);
  const free = (x, z) => x > x0 + pad && x < x1 - pad && z > zBot + pad && z < zTop - pad && !blockers.some((o) => x > o.x0 - pad && x < o.x1 + pad && z > o.z0 - pad && z < o.z1 + pad);
  const seen = new Uint8Array(nx * nz), q = [], idx = (x, z) => Math.round((x - x0) / cell) * nz + Math.round((z - zBot) / cell);
  const s0 = idx(x1 - 1, zTop - 1); seen[s0] = 1; q.push(s0);
  for (let h = 0; h < q.length; h++) { const i = q[h], ix = (i / nz) | 0, iz = i % nz; for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const jx = ix + dx, jz = iz + dz, j = jx * nz + jz; if (jx < 0 || jz < 0 || jx >= nx || jz >= nz || seen[j] || !free(x0 + jx * cell, zBot + jz * cell)) continue; seen[j] = 1; q.push(j); } }
  check("reachable", B.defs.every((d) => { for (let i = 0; i < seen.length; i++) if (seen[i] && Math.hypot(x0 + ((i / nz) | 0) * cell - d.at.x, zBot + (i % nz) * cell - d.at.z) <= (d.reach || 1.4) - 0.05) return true; return false; }));
  // Scene records the cluster adds (nodes in its graph), and that the graph holds steady over many frames.
  const nodes = count(B.parent), v = E2.visit, live = v.cluster.live;
  live.game.drop(3); live.screen.set("g", 4); live.tape.play();
  for (let i = 0; i < 1000; i++) B.def.update(1 / 60, i / 60, { era: 2, walking: true, reading: false, x: -14, z: B.era.z - 8, calm: i > 600 });
  const posed = v.cluster.parts.holes[3].geometry !== v.cluster.parts.holeGeo[0] && v.cluster.parts.pixels.some((p) => p.geometry === v.cluster.parts.colours[0 * 25 + 4 * 5 + 0]) && live.tape.pos > 0;
  check("steady", count(B.parent) === nodes && posed && v.cluster.parts.colours.filter(Boolean).length <= 125);
  results.clusterRecords = 0;
  // Era 2 without the cluster file builds its five props as before (the hook is optional).
  const plain = { window: {}, document: fakeDocument, crypto: globalThis.crypto };
  await load(plain, ["math", "scene", "models", "genesis-voyage", "genesis-world", "genesis-props", "genesis-exhibits", "genesis-era-2"]);
  const P2 = buildEra2(plain.window.BL);
  const baseNodes = count(P2.parent);
  check("withoutCluster", P2.defs.length === 5 && plain.window.BL.genesisEra2.visit.cluster === null);
  results.clusterRecords = nodes - baseNodes;
  check("recordBudget", nodes - baseNodes > 0 && nodes - baseNodes <= 150);
  P2.def.dispose(); B.def.dispose();
  check("disposed", E2.visit === null && plain.window.BL.genesisEra2.visit === null);
}

const failed = Object.entries(results).filter(([k, v]) => k !== "clusterRecords" && !v).map(([k]) => k);
console.log(JSON.stringify(results));
console.log(failed.length ? `FAILED: ${failed.join(", ")}` : `PASS: ${Object.keys(results).length - 1} checks · cluster scene records ${results.clusterRecords}`);
process.exit(failed.length ? 1 : 0);
