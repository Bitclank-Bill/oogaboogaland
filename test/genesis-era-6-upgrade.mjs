// Era 6's reading-corner cluster (gv/upgrade-era-6): rule checks run in Node, through the era file and the kit
// themselves, with a stand-in kit that records what the gallery builds. Run: node test/genesis-era-6-upgrade.mjs
// It prints one line a check and exits 1 on any failure. It loads no browser and changes no file.
import { readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const results = [];
const check = (name, ok, detail = "") => { results.push({ name, ok: !!ok }); console.log(`${ok ? "PASS" : "FAIL"} ${name}${!ok && detail ? ` · ${detail}` : ""}`); };

// A stand-in 2D context and canvas, enough for the retro kit's atlas and a game's draw (no pixels are checked).
const ctx2d = new Proxy({}, { get: (t, k) => k in t ? t[k] : () => {}, set: (t, k, v) => { t[k] = v; return true; } });
const context = {
  window: {}, crypto: globalThis.crypto, Math,
  document: { createElement: () => ({ width: 0, height: 0, getContext: () => ctx2d }) }
};
context.window.window = context.window;
context.window.document = context.document;
context.window.BL = { jumbotron: { text: { glyphOf: () => [0, 0, 0, 0, 0, 0, 0], GLYPH_W: 5, GLYPH_H: 7, TRACKING: 1 } } };
const load = async (f) => runInNewContext(await readFile(join(root, `src/js/${f}.js`), "utf8"), context);
for (const f of ["genesis-voyage", "genesis-world", "genesis-props", "genesis-exhibits", ...Array.from({ length: 8 }, (_, n) => `genesis-era-${n}`),
  "genesis-bench", "retro-games", "genesis-era-6-argument"]) await load(f);
const BL = context.window.BL, W = BL.genesisWorld, EX = BL.genesisExhibits, P = BL.genesisProps, E6 = BL.genesisEra6;

// Build Era 6 with a recording kit: every node keeps its position, scale and visibility so commands can be read back.
const build = () => {
  const rec = { solid: 0, sign: 0, obstacle: 0, prop: 0 }, props = {}, places = [], obstacles = [], solids = [];
  const node = (x = 0, y = 0, z = 0) => ({ position: { x, y, z }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 }, visible: true });
  EX.eras[6].build({
    era: W.ERAS[6], top: W.BANK_TOP, channel: W.CHANNEL, M: {}, createNode: () => node(), addChild() {}, place: (n) => n, label: () => ({}), notify() {},
    solid: (w, h, d, c, x, y, z) => { rec.solid++; const n = node(x, y, z); solids.push({ w, h, d, x, y, z, n }); return n; },
    sign: (t, sub, x, y, z) => { rec.sign++; places.push({ what: `sign ${t}`, x, z }); return node(x, y, z); },
    obstacle: (x0, x1, z0, z1) => { rec.obstacle++; obstacles.push({ x0, x1, z0, z1 }); },
    prop: (d) => { rec.prop++; props[d.id] = d; return d; }
  });
  return { rec, props, places, obstacles, solids };
};
const A = build();
const total = A.rec.solid + A.rec.sign + A.rec.obstacle + A.rec.prop;
const BASE = 196, NEW = ["e6-argument", "e6-layout", "e6-workstation"];
const KEPT = ["e6-announce", "e6-paper", ...[1, 2, 3, 4, 5, 6, 7, 8].map((n) => `e6-ref-${n}`), "e6-not-listed", "e6-laptop", "e6-payments", "e6-january"];
console.log(`scene records: ${total} (base ${BASE}, added ${total - BASE}) ${JSON.stringify(A.rec)}`);
check("rule: the cluster adds at most 150 scene records", total - BASE > 0 && total - BASE <= 150, `${total - BASE}`);
check("rule: every earlier Era 6 exhibit keeps its id and connection", KEPT.every((id) => A.props[id])
  && A.props["e6-paper"].connection === "anchor" && A.props["e6-payments"].connection === "demonstration"
  && [1, 2, 3, 4, 5, 6, 7, 8].every((n) => A.props[`e6-ref-${n}`].connection === "bibliography" && A.props[`e6-ref-${n}`].ref === `[${n}]`));
check("rule: the three new exhibits are context (no new trail step), label their year, carry a short hint and resolve their sources",
  NEW.every((id) => { const d = A.props[id]; return d && d.connection === "context" && !d.ref && String(d.label).includes(String(d.year)) && d.hint && d.hint.length <= 90 && !EX.checkProp(6, d)
    && d.sourceKeys.every((k) => { const s = P.sourceOf(k); return s && /^https:\/\//.test(s.href); }); }));
check("rule: the trail still has exactly one Era 6 stop (the paper)", Object.values(A.props).filter((d) => d.connection && EX.CONNECTIONS[d.connection].trail).map((d) => d.id).join() === "e6-paper");

// Placement: inside Era 6's gallery, clear of the walk (the old stream and 1.5 m beside it), the reserved plots and
// the earlier exhibits' obstacles; the new ones are the last three obstacles built.
const M = W.MUSEUM, r = M.rects[6], reserved = W.reservedZones(6);
const inGallery = (x, z) => { const p = M.toMuseum(6, x, z, {}); return p.x >= r.x0 - 0.05 && p.x <= r.x1 + 0.05 && p.z >= r.z0 - 0.05 && p.z <= r.z1 + 0.05; };
const fresh = A.obstacles.slice(-3), older = A.obstacles.slice(0, -3);
const overlap = (a, b) => a.x0 < b.x1 && a.x1 > b.x0 && a.z0 < b.z1 && a.z1 > b.z0;
check("rule: the cluster stands inside its gallery, off the walk and the reserved plots, and clear of every earlier exhibit",
  fresh.every((o) => inGallery(o.x0, o.z0) && inGallery(o.x1, o.z1) && o.x0 >= W.CHANNEL.x1 + 1.5 && !reserved.some((z) => overlap(o, z)) && !older.some((b) => overlap(o, b)))
  && NEW.every((id) => { const a = A.props[id].at; return inGallery(a.x, a.z) && !A.obstacles.some((o) => a.x > o.x0 - 0.3 && a.x < o.x1 + 0.3 && a.z > o.z0 - 0.3 && a.z < o.z1 + 0.3); }),
  JSON.stringify(fresh));
check("rule: nothing new is taller than the 8 m limit", A.solids.every((s) => s.y + s.h / 2 <= W.BANK_TOP + W.BANK.MAX_H));

// The terminals: HELP gives the workbench its buttons, MORE its deeper story, and no right-column line repeats.
const term = (id) => A.props[id].onUse({}).terminal;
const run = (t, line) => t.run(line).lines.join(" | ");
const G = BL.genesisBench;
check("rule: each new terminal's HELP lists its commands as workbench buttons and its story has no repeated line",
  NEW.every((id) => { const t = term(id), help = t.run("HELP").lines, acts = G.actionsFrom(help), more = t.run("MORE").lines;
    const secs = G.sections({ banner: t.banner, more, howTo: [], hint: A.props[id].hint }), lines = secs.flatMap((s) => s.lines);
    return acts.length >= 3 && more.some((l) => /STILL UNSOLVED/.test(l)) && new Set(lines).size === lines.length && secs.some((s) => s.title === "How to use"); }));
check("rule: long, empty and odd input answers without throwing", NEW.every((id) => { const t = term(id); return ["", "X".repeat(300), "PLACE", "SHOW 99", "STORAGE -4", "PAGE 0", "COMPARE 3 3", "DEAL x"].every((l) => Array.isArray(t.run(l).lines)); }));

// Assemble the argument: commands move its cards on the table; CHECK lights the lamps; RESET puts everything back.
const snap = (nodes) => nodes.map((n) => `${n.position.x.toFixed(4)},${n.position.y.toFixed(4)},${n.position.z.toFixed(4)},${n.scale.x.toFixed(4)},${n.visible}`).join(";");
{
  const t = term("e6-argument"), table = A.solids.filter((s) => s.z < 0 && Math.abs(s.z - (W.ERAS[6].z1 - 33)) < 1 && s.x > 13).map((s) => s.n), before = snap(table);
  const wrong = run(t, "PLACE WORK 1"), moved = snap(table) !== before;
  for (const [k, c] of ["SIGN", "TIME", "NODE", "COIN", "ODDS"].entries()) run(t, `PLACE ${c} ${k + 2}`);
  const partial = run(t, "CHECK");
  ["SIGN", "TIME", "WORK", "NODE", "COIN", "ODDS"].forEach((c, k) => run(t, `PLACE ${c} ${k + 1}`));
  const solved = run(t, "CHECK"), lit = snap(table);
  run(t, "RESET");
  check("rule: PLACE moves a card on the table, CHECK grades the order, the paper's order solves it and RESET restores the table exactly",
    moved && /slot 1/.test(wrong) && /\d\/6 in place/.test(partial) && /Solved/.test(solved) && lit !== before && snap(table) === before, `${partial} / ${solved}`);
  const g1 = E6.createArgument(), g2 = E6.createArgument();
  g1.deal(42); g2.deal(42); const same = g1.tray.join() === g2.tray.join(); g2.deal(43);
  check("rule: a seed deals the same tray every time", same && g1.tray.join() !== g2.tray.join() && [...g1.tray].sort().join() === "0,1,2,3,4,5");
}
// The document layout: SHOW lifts a tab, COMPARE adds the second marker and reports shared references, RESET lowers.
{
  const t = term("e6-layout"), board = A.solids.filter((s) => Math.abs(s.z - (W.ERAS[6].z1 - 41)) < 0.6 && s.x > 13).map((s) => s.n), before = snap(board);
  const show = run(t, "SHOW 4"), lifted = snap(board) !== before, cmp = run(t, "COMPARE 3 7"), page = run(t, "PAGE 2"), refs = run(t, "SHOW REFS");
  run(t, "RESET");
  check("rule: SHOW lifts a tab, COMPARE names both jobs and the references they share, PAGE lists a page and RESET lowers every tab exactly",
    lifted && /Proof-of-Work \(page 3\).*Cites: \[6\]/.test(show) && /Shared references: \[2\] \[5\]/.test(cmp) && /Transactions; 3 Timestamp Server/.test(page) && /References \(page 9\)/.test(refs) && snap(board) === before, cmp);
  check("rule: the sections are the paper's twelve plus its references, on pages 1 to 9 in order, and the cited numbers cover [1] to [8]",
    E6.SECTIONS.length === 13 && E6.SECTIONS.every((s, i) => s.n === i + 1 && (i === 0 || s.page >= E6.SECTIONS[i - 1].page) && s.page >= 1 && s.page <= 9)
    && [1, 2, 3, 4, 5, 6, 7, 8].every((n) => E6.SECTIONS.slice(0, 12).some((s) => s.refs.includes(n))));
}
// The workstation: STORAGE redoes the paper's section 7 sum (80 bytes x 6 x 24 x 365 = 4,204,800 bytes, about
// 4.2 MB a year) and fills the bar; PAGE lights a square; LAMP and RESET.
{
  const t = term("e6-workstation"), desk = A.solids.filter((s) => Math.abs(s.z - (W.ERAS[6].z1 - 49)) < 0.7 && s.x > 13).map((s) => s.n), before = snap(desk);
  const one = run(t, "STORAGE 1"), ten = run(t, "STORAGE 10"), filled = snap(desk) !== before, page = run(t, "PAGE 5"), lamp = run(t, "LAMP");
  run(t, "RESET");
  check("rule: STORAGE gives the paper's own 4.2 MB a year and fills the bar, PAGE and LAMP change the desk, RESET restores it exactly",
    E6.headerBytes(1) === 4204800 && /4,204,800 bytes, about 4\.2 MB/.test(one) && /42,048,000 bytes/.test(ten) && filled && /Simplified Payment Verification, Combining and Splitting Value/.test(page) && /off/.test(lamp) && snap(desk) === before, one);
}
// A fresh visit shares no state with the last.
{
  const B = build(), t = B.props["e6-argument"].onUse({}).terminal;
  check("rule: a second visit starts with an empty table", /0\/6 down|slot 1/.test(run(t, "PLACE SIGN 1")) && /1\/6 down/.test(run(t, "PLACE SIGN 1")));
}

// The screen game on the retro interface, played by its own act() and aim steps.
{
  const calls = { over: 0, end: [], popup: 0 }, aim = { x: 0, hold: 0, steps: 0, y: 0, stepsY: 0 };
  const host = { best: 0, aim, still: true, onEnd: (s) => calls.end.push(s), over: () => calls.over++, popup: () => calls.popup++ };
  const g = BL.genesisEra6Games.argument(host);
  const keys = ["kind", "name", "help", "coach", "stars", "tickets", "status", "start", "act", "stop", "update", "draw"];
  const shape = keys.every((k) => g[k] !== undefined) && g.aims === true && g.tickets(600) === 0 && Array.isArray(g.coach) && g.coach.length === 2;
  const move = (to, from) => { aim.steps += to - from; g.update(1 / 60); };
  const play = (seed, mistakes) => {
    g.start(seed);
    const E = BL.genesisEra6.createArgument(); E.deal(seed);
    let cur = 0;
    // Lay card k (the right one) or, for a planned mistake, swap the first two.
    const order = mistakes ? [1, 0, 2, 3, 4, 5] : [0, 1, 2, 3, 4, 5];
    for (let s = 0; s < 6; s++) {
      const k = order[s], t = [...E.tray].indexOf(k);
      move(t, cur); cur = t; g.act();
      move(s, cur); cur = s; g.act();
    }
    return cur;
  };
  play(7, false);
  for (let i = 0; i < 150; i++) g.update(1 / 60);
  const won = calls.over === 1 && calls.end.length === 1 && calls.end[0] === 600 && g.status.score === 600;
  g.draw(ctx2d);
  let cur = play(9, true);
  const retried = g.playing && g.status.left === 2 && calls.over === 1;
  const E = BL.genesisEra6.createArgument(); E.deal(9);
  for (const k of [0, 1]) { const t = [...E.tray].indexOf(k); move(t, cur); cur = t; g.act(); move(k, cur); cur = k; g.act(); }
  for (let i = 0; i < 150; i++) g.update(1 / 60);
  check("rule: the screen game keeps the retro interface; laying the paper's order wins once for 600, a wrong table sends the wrong cards back and costs 100",
    shape && won && retried && calls.over === 2 && calls.end[1] === 500, JSON.stringify({ shape, won, retried, calls }));
  g.stop();
  check("rule: stop leaves the game idle and drawable", !g.playing && (g.draw(ctx2d), true));
}

const failed = results.filter((r) => !r.ok).length;
console.log(`${results.length - failed}/${results.length} checks passed`);
process.exit(failed ? 1 : 0);
