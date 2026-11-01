// Era 5 upgrade checks (the period-gear cluster): node test/genesis-era-5-upgrade.mjs. Node only, no Chrome, no build.
// Rule checks on the two new games' own modules, their retro-games.js factories driven through a stub host and the real
// kit, the era file building with and without the modules, the cluster staying in its plot and its record count.
import { readFile } from "node:fs/promises";
import { runInNewContext } from "node:vm";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const results = [];
const record = (name, ok, detail = "") => { results.push({ name, ok }); console.log(`${ok ? "PASS" : "FAIL"} ${name}${ok ? "" : ` · ${detail}`}`); };
const src = (f) => readFile(join(root, `src/js/${f}.js`), "utf8");

// A canvas stand-in that counts the calls a frame makes (retro-games.js builds its atlas and screen from it).
const ctx2d = () => { const c = { calls: 0 }; for (const k of ["fillRect", "strokeRect", "drawImage", "clearRect", "getImageData", "putImageData", "setTransform", "fillText", "beginPath", "fill", "stroke", "moveTo", "lineTo", "arc", "rect", "save", "restore", "translate", "scale"]) c[k] = () => { c.calls++; }; c.measureText = () => ({ width: 0 }); return c; };
const contextWith = async (files, extra = {}) => {
  const document = { createElement: () => ({ width: 0, height: 0, getContext: () => ctx2d() }) };
  const context = { window: { BL: {} }, document, crypto: globalThis.crypto, console, ...extra };
  context.window.document = document;
  for (const f of files) runInNewContext(await src(f), context);
  return context.window.BL;
};

// ---- Peer Patchwork rules ----------------------------------------------------------------------------------------
const { genesisEra5Patchwork: PW } = await contextWith(["genesis-era-5-patchwork"]);
// A plain strategy: rarest piece first, from a free holder to a peer that lacks it. If every deal falls to it inside
// the round limit, every deal is winnable.
const solve = (p, onSend) => {
  for (let guard = 0; guard < 200 && !p.P.won && !p.P.lost; guard++) {
    let best = null, rarity = 9;
    for (let piece = 0; piece < PW.PIECES; piece++) {
      let holders = 0; for (let s = 0; s < 3; s++) holders += p.holds(s, piece) ? 1 : 0;
      for (let s = 0; s < 3; s++) if (p.holds(s, piece) && !p.used[s]) for (let d = 0; d < 3; d++) if (!p.holds(d, piece) && holders < rarity) { rarity = holders; best = [s, d, piece]; }
    }
    if (!best) { p.pass(); continue; }
    const code = p.send(...best);
    if (onSend) onSend(best, code);
  }
};
{
  const p = PW.puzzle(); p.deal(7);
  const snap = Array.from(p.have).join(""), q = PW.puzzle(); q.deal(7);
  const deterministic = snap === Array.from(q.have).join("");
  let wins = 0, boundHolds = true, spread = true;
  for (let seed = 1; seed <= 500; seed++) {
    p.deal(seed);
    for (let d = 0; d < 3; d++) { const n = p.count(d); if (n < 2 || n > 6) spread = false; }
    for (let piece = 0; piece < 9; piece++) if (!(p.holds(0, piece) || p.holds(1, piece) || p.holds(2, piece))) spread = false;
    const bound = p.P.bound; solve(p);
    if (p.P.won) wins++;
    if (p.P.won && p.P.round < bound) boundHolds = false;
  }
  record("patchwork: a seed replays its deal, every piece is held by someone, each peer starts with 2 to 6", deterministic && spread);
  record("patchwork: all 500 seeded deals are winnable inside the round limit, never in fewer rounds than the bound", wins === 500 && boundHolds, `wins ${wins}`);
  // The refusals change nothing.
  p.deal(11);
  const before = Array.from(p.have).join("");
  let s0 = -1, piece0 = -1, d0 = -1;
  for (let s = 0; s < 3 && s0 < 0; s++) for (let i = 0; i < 9 && s0 < 0; i++) if (p.holds(s, i)) for (let d = 0; d < 3; d++) if (d !== s && !p.holds(d, i)) { s0 = s; piece0 = i; d0 = d; break; }
  const lacks = [0, 1, 2].find((s) => !p.holds(s, piece0));
  const holder = [0, 1, 2].find((s) => s !== s0 && p.holds(s, piece0));
  const refusals = p.send(s0, s0, piece0) === 2 && p.send(lacks, s0, piece0) === 3 && (holder === undefined || p.send(s0, holder, piece0) === 4) && p.send(9, 0, 0) === 2 && p.send(0, 1, 9) === 2;
  const unchanged = Array.from(p.have).join("") === before && p.P.moves === 0;
  const sent = p.send(s0, d0, piece0) === 0 && p.holds(d0, piece0) && p.used[s0] === 1;
  const other = (piece0 + 1) % 9;
  const slot = !p.holds(s0, other) || p.holds((s0 + 1) % 3, other) || p.used[s0] === 0 || p.send(s0, (s0 + 1) % 3, other) === 5;
  record("patchwork: a self-send, a missing piece, a duplicate and out-of-range input are refused and change nothing; a send uses the sender's slot", refusals && unchanged && sent && slot);
  // Over the limit: passing every round loses, and nothing more is accepted.
  p.deal(13); for (let i = 0; i < 9; i++) p.pass();
  record("patchwork: passing through every round loses and accepts no more sends", p.P.lost && !p.P.won && p.send(0, 1, 0) === 6 && p.stars() === 0);
  // The terminal over the same rules.
  p.deal(21);
  const t = PW.terminal(p, ["era words"]);
  const banner = t.banner.join(" ");
  const words = t.run("BOARD").lines.join(" ");
  const bad = t.run("SEND A A 1").lines[0], junk = t.run("X".repeat(400)).lines.length > 0, empty = t.run("").lines.length > 0;
  const lim = t.run("LIMITS").lines.join(" ");
  t.run("SEND A B 1"); const resetTo = (t.run("RESET"), Array.from(p.have).join(""));
  const fresh = PW.puzzle(); fresh.deal(21);
  record("patchwork terminal: labelled a modern museum homage, shows the era's words, refuses bad sends, explains the analogy's limits, RESET replays the deal",
    /modern museum homage/.test(banner) && /not historical software/.test(banner) && banner.includes("era words") && /Peer A: /.test(words) && /two different peers/.test(bad)
    && junk && empty && /not agreeing who owns/.test(lim) && /checks each piece/.test(lim) && resetTo === Array.from(fresh.have).join(""));
}

// ---- Pattern Pocket rules ----------------------------------------------------------------------------------------
const { genesisEra5Mixtape: MX } = await contextWith(["genesis-era-5-mixtape"]);
{
  const m = MX.player();
  // Spiral 4 + Rings 3 + Dots 3 is exactly the budget; then nothing more fits.
  const a = m.add(4) === 0 && m.add(4) === 2 && m.add(1) === 0 && m.used() === 7;
  const fill = m.add(5) === 0 && m.used() === 10 && m.add(3) === 4 && m.used() === 10 && m.score() === 10 * 10 + 3 * 10 + 100;
  const moved = m.move(0, 1) === 0 && Array.from(m.list).join() === "1,4,5,-1" && m.move(0, -1) === 1 && m.move(2, 1) === 1;
  const removed = m.remove(4) === 0 && Array.from(m.list).join() === "1,5,-1,-1" && m.M.length === 2 && m.remove(4) === 5;
  // Four small ones fill the four slots under the budget; a fifth is refused for the slots.
  const slots = (m.reset(), m.add(3), m.add(0), m.add(2), m.add(1), m.M.length === 4 && m.used() === 8 && m.add(5) === 3);
  const badId = m.add(9) === 1 && m.add(-1) === 1 && m.remove(9) === 5;
  record("pocket: the budget and the four slots hold, a pattern loads once, moves stay in range, removal closes the gap, a perfect fit pays",
    a && fill && moved && removed && slots && badId);
  m.reset();
  const t = MX.terminal(m, ["context words"]);
  const banner = t.banner.join(" "), add = t.run("ADD 5").lines.join(" "), big = (t.run("ADD 2"), t.run("ADD 1"), t.run("ADD 6").lines.join(" ")), play = t.run("PLAY").lines.join(" ");
  const budget = t.run("BUDGET").lines.join(" ");
  record("pocket terminal: labelled a homage with no recordings or brand, enforces the budget, plays the list in order, says toy units are not a real capacity",
    /modern museum homage/.test(banner) && /no recordings or brand/.test(banner) && banner.includes("context words") && /Slot 1: Spiral/.test(add) && /pass the 10-unit budget/.test(big)
    && /^1\. Spiral/.test(play) && /2\. Rings/.test(play) && /3\. Bars/.test(play) && /1 units still free/.test(play) && /Toy units only/.test(budget) && t.run("X".repeat(400)).lines.length > 0 && (t.run("RESET"), m.M.length === 0));
}

// ---- The retro factories, on the real kit with a stub host ----------------------------------------------------------
{
  const jumbotron = { text: { glyphOf: () => [], GLYPH_W: 5, GLYPH_H: 7, TRACKING: 1 } };
  const BLk = await contextWith(["genesis-era-5-patchwork", "genesis-era-5-mixtape"]);
  BLk.jumbotron = jumbotron; BLk.math = { mulberry32: () => () => 0.5 };
  const ctx = { window: { BL: BLk }, document: { createElement: () => ({ width: 0, height: 0, getContext: () => ctx2d() }) }, crypto: globalThis.crypto };
  runInNewContext(await src("retro-games"), ctx);
  const host = () => { const h = { best: 0, still: false, aim: { x: 0, hold: 0, steps: 0, y: 0, stepsY: 0 }, ended: -1, overs: 0, cues: [] };
    Object.assign(h, { onEnd: (s) => { h.ended = s; }, over: () => { h.overs++; }, popup() {}, cue: (n) => { h.cues.push(n); }, shake() {}, crack() {}, flop() {} }); return h; };
  const iface = (g) => ["kind", "name", "help", "coach", "stars", "tickets", "status", "start", "act", "stop", "update", "draw"].every((k) => g[k] !== undefined) && g.aims === true && Array.isArray(g.coach) && g.coach.length === 2;
  const frames = (g, h, n) => { const c = ctx2d(); for (let i = 0; i < n; i++) { g.update(1 / 60); g.draw(c); } return c.calls; };

  // Patchwork, played through the cursor: the same plan the solver finds, as cursor steps and presses.
  const h1 = host(), g1 = BLk.genesisEra5Patchwork.make(h1);
  const plan = []; { const q = BLk.genesisEra5Patchwork.puzzle(); q.deal(42); solve(q, (s) => plan.push(s)); }
  g1.start(42);
  let col = 0, row = 0;
  const go = (c, r) => { h1.aim.steps += c - col; h1.aim.stepsY += r - row; col = c; row = r; frames(g1, h1, 2); };
  for (const [s, d, piece] of plan) {
    if (piece < 0) continue;
    go(s * 3 + piece % 3, Math.floor(piece / 3)); g1.act();
    go(d * 3 + piece % 3, Math.floor(piece / 3)); g1.act();
  }
  const drew = frames(g1, h1, 240);
  const cuesKnown = h1.cues.every((c) => ["tick", "bonk", "buzzer", "win", "round"].includes(c));
  record("patchwork game: the retro-games interface, a seeded deal won through cursor steps and Space, over() once, onEnd with the score, and only known cue names",
    iface(g1) && h1.overs === 1 && h1.ended > 0 && h1.ended === g1.status.score && !g1.playing && drew > 0 && cuesKnown, JSON.stringify({ overs: h1.overs, ended: h1.ended, plan: plan.length, cues: [...new Set(h1.cues)] }));
  // Interruption drops a held piece; reduced motion still draws.
  const h2 = host(); h2.still = true; const g2 = BLk.genesisEra5Patchwork.make(h2); g2.start(5); g2.act(); g2.stop();
  record("patchwork game: stop() ends play and a still (Calm) host still draws its screen", !g2.playing && frames(g2, h2, 3) > 0);

  // Pocket, played through the cursor: load Spiral, Rings and Dots (exactly the budget), then PLAY.
  const h3 = host(), g3 = BLk.genesisEra5Mixtape.make(h3);
  g3.start(1);
  let r3 = 0;
  const row3 = (r) => { h3.aim.stepsY += r - r3; r3 = r; frames(g3, h3, 2); };
  for (const id of [4, 1, 5]) { row3(id); g3.act(); }
  const fit = g3.status.left === 0;
  h3.aim.steps += 2; frames(g3, h3, 2); g3.act();
  const playing = g3.playing;
  frames(g3, h3, 60 * 10);
  const cues3 = h3.cues.every((c) => ["tick", "click", "buzzer", "win", "round"].includes(c));
  record("pocket game: the retro-games interface, a perfect-fit playlist made with cursor steps, played through to over() once and onEnd with its score",
    iface(g3) && fit && playing && h3.overs === 1 && h3.ended === 10 * 10 + 3 * 10 + 100 && !g3.playing && cues3, JSON.stringify({ fit, overs: h3.overs, ended: h3.ended }));
}

// ---- The era file: with and without the modules, its plot and its record count -----------------------------------
{
  const kitFiles = ["genesis-voyage", "genesis-world", "genesis-props", "genesis-exhibits"];
  const build = async (withModules, eraText = null) => {
    const BLe = await contextWith([...kitFiles, ...(withModules ? ["genesis-era-5-patchwork", "genesis-era-5-mixtape"] : []), ...(eraText ? [] : ["genesis-era-5"])]);
    if (eraText) runInNewContext(eraText, { window: { BL: BLe }, console });
    const W = BLe.genesisWorld, e = W.ERAS[5], props = {}, recs = [], node = () => ({ position: { x: 0, y: 0, z: 0 }, rotation: {}, scale: { x: 1, y: 1, z: 1 }, visible: true });
    const kit = { era: e, top: W.BANK_TOP, channel: W.CHANNEL, M: { box: () => ({}) }, createNode: node, addChild() {}, place: (x) => x, label: () => ({}),
      sign: (t, s, x, y, z) => { recs.push({ kind: "sign", x, z, y }); return node(); },
      obstacle: (x0, x1, z0, z1) => { recs.push({ kind: "obstacle", x: (x0 + x1) / 2, z: (z0 + z1) / 2, x0, x1, z0, z1 }); },
      solid: (w, h, d, c, x, y, z) => { const n = node(); recs.push({ kind: "solid", x, z, y, w, d, top: y + h / 2, node: n }); return n; },
      prop: (d) => { const p = BLe.genesisExhibits.checkProp(5, d); if (p) throw new Error(p); props[d.id] = d; recs.push({ kind: "prop", x: d.at.x, z: d.at.z }); return d; } };
    BLe.genesisExhibits.eras[5].build(kit);
    return { BLe, W, e, props, recs };
  };
  const A = await build(true), B = await build(false);
  // The base commit's era file, for the count and for "moves nothing else" (skipped outside a git checkout).
  let baseText = null;
  try { baseText = execFileSync("git", ["show", "cb2b0b9405a2d6363c9f284146b4c0aab6d3b34f:src/js/genesis-era-5.js"], { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }); } catch { baseText = null; }
  const Z0 = baseText ? await build(false, baseText) : null;
  const NEW = ["e5-patchwork", "e5-displays", "e5-pocket"];
  const OLD = ["e5-chord", "e5-ring", "e5-hashcash", "e5-stamp", "e5-rpow", "e5-rpow-desk", "e5-cabinet", "e5-bitgold", "e5-bitgold-bench", "e5-gps", "e5-wiki", "e5-player", "e5-bittorrent", "e5-mosaic", "e5-loft-trust", "e5-loft-route"];
  const kept = OLD.every((id) => A.props[id]) && A.props["e5-hashcash"].connection === "citation" && A.props["e5-hashcash"].ref === "[6]" && A.props["e5-bitgold"].connection === "influence";
  const contextOnly = NEW.every((id) => A.props[id] && A.props[id].connection === "context" && String(A.props[id].label).includes(String(A.props[id].year)));
  record("era file: every existing exhibit keeps its id and connection; the three new ones are context and show their year", kept && contextOnly);
  // The cluster's plot: x 13 to 33, u 57 to 63 on the right side; nothing else of Era 5's stands in it, nothing of it
  // is in the stream's 1.5 m, a reserved plot, or above 8 m.
  const z0 = A.e.z1 - 63.5, z1 = A.e.z1 - 57;
  const inPlot = (r) => r.x >= 12.9 && r.x <= 33.1 && r.z >= z0 && r.z <= z1;
  const cluster = A.recs.filter(inPlot), added = Z0 ? A.recs.length - Z0.recs.length : cluster.length;
  const reserved = A.W.reservedZones(5);
  const clear = cluster.every((r) => (r.kind !== "solid" || (r.x - r.w / 2 >= A.W.CHANNEL.x1 + 1.5 && r.top <= A.W.BANK_TOP + A.W.BANK.MAX_H))
    && !reserved.some((q) => r.x > q.x0 && r.x < q.x1 && r.z > q.z0 && r.z < q.z1));
  const key = (r) => `${r.kind}:${r.x.toFixed(3)}:${r.z.toFixed(3)}`;
  const sameElsewhere = !Z0 || (Z0.recs.filter(inPlot).length === 0 && JSON.stringify(A.recs.filter((r) => !inPlot(r)).map(key)) === JSON.stringify(Z0.recs.map(key)));
  record(`era file: the cluster adds ${added} scene records (budget about 150), all inside its plot, clear of the stream's strip, reserved plots and the height limit, and moves nothing else`,
    added > 0 && added <= 150 && cluster.length === added && clear && sameElsewhere, JSON.stringify({ added, cluster: cluster.length, base: !!Z0 }));
  // Without the modules the stations still open something honest; with them, terminals that move the model.
  const missing = ["e5-patchwork", "e5-pocket"].every((id) => /not on this page yet/.test(B.props[id].onUse({}).board.pages[0].title));
  const term = A.props["e5-patchwork"].onUse({}).terminal, banner = term.banner.join(" ");
  const reuse = banner.includes("BitTorrent lectern") && banner.includes("RPOW desk") && banner.includes("Bitcoin does not use Chord");
  const disp = A.props["e5-displays"].onUse({}).board, dispText = disp.pages.map((p) => p.text.join(" ")).join(" ");
  const schematic = /^[A-Za-z0-9 \/:!?+\-.]+$/.test(disp.room) && /schematic/i.test(disp.room) && !/\d+\s?(cm|mm|kg|inch|in\b|")/i.test(dispText) && /not verified any particular display/.test(dispText);
  record("era file: without the modules both games' stations say they aren't loaded; with them the puzzle reuses the era's peer and RPOW words; the display board is schematic with no figures",
    missing && reuse && schematic);
  const lit = (w) => A.recs.filter((r) => r.kind === "solid" && r.w === w && r.node.visible).length;
  const pt = A.props["e5-pocket"].onUse({}).terminal;
  const bar0 = lit(0.035); pt.run("ADD 5"); const bar4 = lit(0.035); pt.run("RESET"); const barR = lit(0.035);
  const tt = A.props["e5-patchwork"].onUse({}).terminal, tiles0 = lit(0.22);
  const send = tt.run("BOARD").lines.slice(0, 3);
  // The first piece one peer holds and the next lacks, sent: one more tile lights.
  let cmd = "";
  for (let i = 0; i < 9 && !cmd; i++) for (const [a, b] of [[0, 1], [1, 2], [2, 0]]) if (!cmd) { const ha = send[a].slice(8, 19).replace(/ /g, "")[i], hb = send[b].slice(8, 19).replace(/ /g, "")[i]; if (ha !== "." && hb === ".") cmd = `SEND ${"ABC"[a]} ${"ABC"[b]} ${i + 1}`; }
  tt.run(cmd); const tiles1 = lit(0.22); tt.run("RESET");
  record("era file: a pocket command fills the cluster's storage-bar model and RESET empties it; a patchwork send lights one more tile and RESET restores it",
    bar0 === 0 && bar4 === 4 && barR === 0 && tiles1 === tiles0 + 1 && lit(0.22) === tiles0, JSON.stringify({ bar0, bar4, barR, tiles0, tiles1, cmd }));
}

const failed = results.filter((r) => !r.ok).length;
console.log(`${results.length - failed}/${results.length} checks passed`);
process.exit(failed ? 1 : 0);
