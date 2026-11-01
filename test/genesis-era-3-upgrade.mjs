// Era 3's upgrade cluster, checked in Node through the modules' own functions (no browser, no build):
//   node test/genesis-era-3-upgrade.mjs        prints one line a check and the scene-record count; exit 1 on a failure.
// Owned by the Era 3 builder; the integrator may call `era3UpgradeProof` from the unit tier (see
// docs/genesis-voyage/exhibits/era-3.md, integration requests). Nothing here re-implements a rule as its oracle: the live
// game is checked against the cabinet's own rules, the buttons against the workbench's own `actionsFrom`.
import { readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

// A canvas and 2D context that only count what is asked of them, for drawing in Node.
const stubCtx = () => {
  const calls = { fill: 0, image: 0, text: 0 };
  const ctx = new Proxy({ calls }, { get: (t, k) => k in t ? t[k] : k === "fillRect" ? () => { calls.fill++; } : k === "drawImage" ? () => { calls.image++; } : k === "fillText" ? () => { calls.text++; }
    : k === "createRadialGradient" || k === "createLinearGradient" ? () => ({ addColorStop: () => {} }) : typeof k === "string" && /^[a-z]/.test(k) ? () => {} : undefined, set: () => true });
  return ctx;
};
const stubDocument = { createElement: () => ({ width: 0, height: 0, getContext: () => stubCtx() }) };

export const era3UpgradeProof = async () => {
  const context = { window: {}, document: stubDocument, crypto: globalThis.crypto };
  // The jumbotron's font, as the retro kit reads it: every glyph a 5 by 7 block of nothing, enough to draw.
  context.window.BL = { jumbotron: { text: { glyphOf: () => [0, 0, 0, 0, 0, 0, 0], GLYPH_W: 5, GLYPH_H: 7, TRACKING: 1 } } };
  for (const f of ["genesis-voyage", "genesis-world", "genesis-props", "genesis-exhibits", "genesis-bench", "genesis-era-3", "retro-games", "genesis-era-3-rally"]) runInNewContext(await readFile(join(root, `src/js/${f}.js`), "utf8"), context);
  const BLc = context.window.BL, W = BLc.genesisWorld, EX = BLc.genesisExhibits, E = BLc.genesisEra3, GN = BLc.genesisBench, LIVE = BLc.genesisEra3Rally, def = EX.eras[3];
  const r = {};

  // --- Building: still five exhibits, the cluster inside the dial-up corner's own footprint, records counted. -------
  const solids = [], obstacles = [], props = {};
  let records = 0;
  const node = () => ({ position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 }, children: [], visible: true, glow: 1 });
  const kit = { era: W.ERAS[3], top: W.BANK_TOP, channel: W.CHANNEL, M: { box: () => ({}), merge: () => ({}), moved: (g) => g, turnedX: (g) => g, turnedZ: (g) => g },
    createNode: (o = {}) => { records++; return Object.assign(node(), o, { children: [] }); }, addChild: () => {}, place: (n) => n,
    label: () => ({ face: {}, back: {}, width: 1, height: 1 }),
    solid: (w, h, d, c, x, y, z) => { records++; solids.push({ x0: x - w / 2, x1: x + w / 2, z0: z - d / 2, z1: z + d / 2, top: y + h / 2 }); return node(); },
    sign: () => { records += 3; return node(); }, obstacle: (x0, x1, z0, z1) => { obstacles.push({ x0, x1, z0, z1 }); },
    notify: () => {}, prop: (d) => { if (EX.checkProp(3, d)) throw new Error(EX.checkProp(3, d)); props[d.id] = d; return { ...d, era: 3 }; } };
  def.build(kit);
  const inside = (b, o) => b.x0 >= o.x0 - 1e-9 && b.x1 <= o.x1 + 1e-9 && b.z0 >= o.z0 - 1e-9 && b.z1 <= o.z1 + 1e-9;
  const overlaps = (p, q, pad = 0) => p.x0 < q.x1 + pad && p.x1 > q.x0 - pad && p.z0 < q.z1 + pad && p.z1 > q.z0 - pad;
  const B = E.LAYOUT.bbs, corner = obstacles.find((o) => o.x0 < B.x && o.x1 > B.x && o.z0 < B.z && o.z1 > B.z);
  r.fiveExhibits = Object.keys(props).join() === "e3-press,e3-padlock,e3-bbs,e3-pager,e3-rally" && props["e3-press"].connection === "demonstration";
  r.cartInsideCorner = !!corner && solids.filter((s) => s.z0 > B.z + 0.9).length >= 4 && solids.every((s) => obstacles.some((o) => inside(s, o)))
    && obstacles.every((o, i) => obstacles.every((q, j) => i === j || !overlaps(o, q, 2.5)));

  // --- 1. Tick-Tock Rally: the prompt's buttons, and the live game on the cabinet's own rules. ----------------------
  const rally = props["e3-rally"].onUse({}).terminal, rallyButtons = GN.actionsFrom(rally.run("HELP").lines).map((a) => a.cmd);
  r.rallyButtons = ["SERVE", "LEFT", "RIGHT", "WAIT"].every((c) => rallyButtons.includes(c)) && rally.banner[0] === "HOW TO USE";
  const g = E.visit.rally, p0 = g.paddle;
  rally.run("SERVE"); const t1 = g.time; rally.run("LEFT");
  r.rallyTick = g.state === "play" && g.paddle < p0 && Math.abs(g.time - t1 - E.TICK) < 1e-9 && rally.run("LLW").lines.length > 3 && rally.run("RESET").reset && g.state === "serve";
  // A stub console host; the retro kit's `hooks` takes its functions loose, so they close over the record `h`.
  const host = (opts = {}) => {
    const h = { best: 0, still: false, aim: { x: 0, hold: 0, steps: 0, y: 0, stepsY: 0 }, cues: [], ends: [], overs: 0, popups: [], ...opts };
    Object.assign(h, { cue: (name) => h.cues.push(name), popup: (t) => h.popups.push(t), over: () => { h.overs++; }, onEnd: (score) => h.ends.push(score), shake: () => {}, crack: () => {}, flop: () => {} });
    return h;
  };
  // The live game against a twin of the cabinet's own rules, fed the same inputs in lockstep: the same score at 30 and
  // 120 frames a second.
  const twin = (fps, seconds) => {
    const h = host(), game = LIVE.make(h), rules = E.createRally();
    game.start(7); game.act(); rules.serve();
    let same = true;
    for (let f = 0; f < fps * seconds; f++) {
      h.aim.x = Math.max(-1, Math.min(1, rules.x * 2 - 1));
      rules.input.aim = (h.aim.x + 1) / 2;
      game.update(1 / fps); rules.update(1 / fps);
      if (rules.state === "serve") { rules.serve(); game.act(); }
      if (game.status.score !== rules.score) same = false;
    }
    return { same, score: rules.score, game, h };
  };
  const a = twin(30, 25), b = twin(120, 25);
  r.liveMatchesRules = a.same && b.same && a.score === b.score && a.score >= 5 && a.h.cues.includes("hit");
  const idle = host(), lose = LIVE.make(idle), status0 = lose.status;
  lose.start(3);
  const ctx = stubCtx();
  for (let n = 0; n < 4000 && idle.ends.length === 0; n++) { if (lose.status.verb === "Serve!") lose.act(); lose.update(1 / 60); if (n % 5 === 0) lose.draw(ctx); }
  r.liveEnds = idle.overs === 1 && idle.ends.length === 1 && lose.status === status0 && lose.status.left === 0 && !lose.playing && ctx.calls.image + ctx.calls.fill > 0;
  const fields = ["kind", "name", "help", "coach", "stars", "tickets", "status", "start", "act", "stop", "update", "draw"];
  r.liveInterface = fields.every((k) => lose[k] !== undefined) && lose.aims === true && /museum homage/i.test(lose.help) && lose.tickets(25) === 5;
  // Calm: the attract's demo holds still; without Calm it plays.
  const calmHost = host({ still: true }), calmGame = LIVE.make(calmHost), d1 = stubCtx();
  for (let f = 0; f < 120; f++) calmGame.update(1 / 60);
  calmGame.draw(d1);
  const liveHost = host(), liveGame = LIVE.make(liveHost);
  for (let f = 0; f < 120; f++) liveGame.update(1 / 60);
  r.calmAttract = calmGame.demoTime === 0 && liveGame.demoTime > 1.5;

  // --- 2. The CRT test screen: four illustrative grids, one button, reset, nothing claimed. -------------------------
  const bbs = props["e3-bbs"].onUse({}).terminal, bbsButtons = GN.actionsFrom(bbs.run("HELP").lines).map((x) => x.cmd), crt = E.visit.bbs.crt;
  r.crtButton = ["DIAL", "CRT", "READ", "POST", "HANGUP"].every((c) => bbsButtons.includes(c)) && bbsButtons.length <= GN.MAX_ACTIONS;
  const levels = [];
  for (let i = 0; i < 4; i++) { bbs.run("CRT"); levels.push(crt.level); }
  const said = bbs.run("CRT 1").lines;
  r.crtCycles = levels.join() === "2,3,0,1" && crt.level === 0 && said.some((l) => /20 by 15/.test(l)) && said.some((l) => /Illustrative setting/.test(l)) && said.slice(-15).every((l) => l.length === 20)
    && /Pick a sample grid/.test(bbs.run("CRT 9").lines[0]) && (bbs.run("RESET"), crt.level === 1) && E.pcRun("CRT") === null;
  const inks = new Set(); for (let y = 0; y < 60; y++) for (let x = 0; x < 80; x++) inks.add(E.crtPixel((x + 0.5) / 80, (y + 0.5) / 60));
  r.crtPicture = inks.size >= 8 && E.GRIDS.every(([w, h], i) => i === 0 || w > E.GRIDS[i - 1][0] && w / h === 4 / 3) && E.EXHIBITS.bbs.deeper.some((p) => /illustrative settings/.test(p) && /verified no display specification/.test(p));
  // The frame notices a new grid at once (the screen repaints only then).
  const st = { era: 3, walking: true, reading: true, calm: false, x: -30, z: -340 };
  def.update(1 / 30, 1, st); const shown = E.visit.crtShown; bbs.run("CRT"); def.update(1 / 30, 1.1, st);
  r.crtRepaintsOnChange = E.visit.crtShown === crt.version && shown !== crt.version && (def.update(1 / 30, 1.2, st), E.visit.crtShown === crt.version);

  // --- 3. The pager: one-button pages to Bea, her reply at once, bounded, CLEAR. -------------------------------------
  const pagerT = props["e3-pager"].onUse({}).terminal, pagerButtons = GN.actionsFrom(pagerT.run("HELP").lines).map((x) => x.cmd), pg = E.visit.pager;
  r.pagerButtons = ["HELLO", "MEET", "LATE", "THANKS", "READ", "CLEAR"].every((c) => pagerButtons.includes(c)) && pagerButtons.every((c) => !/[a-z]/.test(c));
  const before = pg.received, sent = pagerT.run("MEET"), slot = {};
  r.pagerReplies = sent.sent === "MEET" && pg.received === before + 2 && pg.at(0, slot).text === "BEA: OK, AT THE PRESS" && pg.at(1, slot).text === "YOU: MEET AT THE PRESS" && pg.unread === 1;
  for (let i = 0; i < 20; i++) pagerT.run(["HELLO", "LATE", "THANKS"][i % 3]);
  st.calm = true; def.update(1 / 30, 2, st); const g1 = E.visit.pagerLamp.glow; def.update(1 / 30, 2.2, st);
  r.pagerBounded = pg.count === pg.capacity && pg.capacity === 6 && g1 > 0.4 && E.visit.pagerLamp.glow === g1 && (pagerT.run("CLEAR"), pg.count === 0)
    && E.visit.triggers.armed.every((x) => x === 1) && /Unknown/.test(pagerT.run("SHOUT").lines[0]);
  r.howTo = ["e3-press", "e3-padlock", "e3-bbs", "e3-pager", "e3-rally"].every((id) => { const b = props[id].onUse({}).terminal.banner; const i = b.indexOf(""); return b[0] === "HOW TO USE" && i >= 3 && i <= 5; });

  def.dispose();
  r.disposed = E.visit === null;
  return r;
};

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const r = await era3UpgradeProof();
  let ok = true;
  for (const [k, v] of Object.entries(r)) { if (k === "records") continue; console.log(`${v ? "PASS" : "FAIL"} ${k}`); if (!v) ok = false; }
  console.log(ok ? "era 3 upgrade: all checks passed" : "era 3 upgrade: FAILED");
  process.exit(ok ? 0 : 1);
}
