// Era 4 upgrade cluster checks (gv/upgrade-era-4): the strategy board, the information screen and the wireless packet
// toy, through their own modules and the era file's real build. Node only, no Chrome: `node test/genesis-era-4-upgrade.mjs`.
// Each check says why it exists, as test/run.mjs's do. Prints one line a check and exits non-zero on any failure.
import { readFile } from "node:fs/promises";
import { runInNewContext } from "node:vm";
import { webcrypto } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const results = [];
const record = (name, ok, detail = "") => { results.push(ok); console.log(`${ok ? "PASS" : "FAIL"} ${name}${ok ? "" : ` ${detail}`}`); };
const load = async (files, context) => { for (const f of files) runInNewContext(await readFile(join(root, `src/js/${f}.js`), "utf8"), context); return context.window.BL; };

// A canvas whose context draws nothing, and the jumbotron's font stubbed (its glyphs blank), so retro-games.js's real
// kit loads in Node and the consoles run their own update and draw.
const ctx2d = new Proxy({}, { get: (t, k) => (k in t ? t[k] : () => ({ addColorStop() {} })), set: (t, k, v) => { t[k] = v; return true; } });
const document = { createElement: () => ({ width: 0, height: 0, getContext: () => ctx2d }) };
const context = () => ({ window: { BL: { jumbotron: { text: { glyphOf: () => [0, 0, 0, 0, 0, 0, 0], GLYPH_W: 5, GLYPH_H: 7, TRACKING: 1 } } } }, document, crypto: webcrypto });
const MODULES = ["genesis-era-4-strategy", "genesis-era-4-teletext", "genesis-era-4-wireless"];
const BL = await load(["math", "retro-games", "genesis-voyage", "genesis-world", "genesis-props", "genesis-exhibits", "genesis-timeline-data", "genesis-bench", ...MODULES, "genesis-era-4"], context());
const W = BL.genesisWorld, EX = BL.genesisExhibits, TD = BL.genesisTimelineData, GAMES = BL.genesisEra4Games, B = BL.genesisBench;

// Build Era 4 on a recording kit.
const build = (BLx) => {
  const W2 = BLx.genesisWorld, e = W2.ERAS[4], out = { solids: [], signs: [], obstacles: [], props: [] };
  const node = () => ({ position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 }, children: [], glow: 1 });
  BLx.genesisExhibits.eras[4].build({ era: e, top: W2.BANK_TOP, channel: W2.CHANNEL, M: { box: () => ({}) }, createNode: (o = {}) => Object.assign(node(), o), addChild: () => {}, place: (n) => n,
    label: () => ({ face: {}, back: {}, width: 1, height: 1 }), notify() {},
    solid: (w, h, d, c, x, y, z) => { const n = node(); out.solids.push({ w, h, d, x, y, z, n }); return n; },
    sign: (t, sub, x, y, z) => { out.signs.push({ t, sub, x, z }); return node(); },
    obstacle: (x0, x1, z0, z1) => out.obstacles.push({ x0, x1, z0, z1 }),
    prop: (d) => { out.props.push(d); return { ...d, era: 4 }; } });
  return out;
};
const built = build(BL), era = W.ERAS[4], NEW = ["e4-strategy", "e4-teletext", "e4-wireless"];
const OLD = ["e4-hashcash", "e4-bmoney", "e4-names", "e4-timesec", "e4-desktop", "e4-modem", "e4-cd", "e4-pocket", "e4-loft"];
const byId = Object.fromEntries(built.props.map((p) => [p.id, p]));
const term = (id) => byId[id].onUse({}).terminal;
const text = (r) => r.lines.join("\n");

// rule: the existing exhibits keep their ids and connections; the three new ones are context, dated, sourced.
{
  const ids = built.props.map((p) => p.id), bad = [];
  if (ids.length !== OLD.length + NEW.length || [...OLD, ...NEW].some((id) => !ids.includes(id))) bad.push(`ids ${ids}`);
  const trail = { "e4-hashcash": "influence", "e4-bmoney": "citation", "e4-names": "citation", "e4-timesec": "citation" };
  for (const p of built.props) {
    const want = trail[p.id] || "context";
    if (p.connection !== want) bad.push(`${p.id} is ${p.connection}`);
    if (EX.checkProp(4, p)) bad.push(EX.checkProp(4, p));
    if (!String(p.label).includes(String(p.year))) bad.push(`${p.id} label lacks its year`);
    for (const k of p.sourceKeys) { const s = BL.genesisProps.sourceOf(k); if (!s || !/^https:\/\//.test(s.href)) bad.push(`${p.id} source ${k}`); }
    if (NEW.includes(p.id) && (!p.hint || !p.date)) bad.push(`${p.id} needs a hint and a date that says what it marks`);
  }
  record("rule: Era 4 keeps its nine exhibits and trail entries; the cluster adds three context exhibits, each dated, hinted and sourced", !bad.length, bad.join("; "));
}

// rule: the cluster stands inside Era 4's gallery, off the old stream's walk, and overlaps no other obstacle or lamp;
// it adds at most about 150 scene records.
{
  const bad = [], r = W.MUSEUM.rects[4], inGallery = (x, z) => { const p = W.MUSEUM.toMuseum(4, x, z, {}); return p.x >= r.x0 && p.x <= r.x1 && p.z >= r.z0 && p.z <= r.z1; };
  const zone = { x0: 24.5, x1: 36.5, z0: era.z - 1, z1: era.z + 3.2 }, inZone = (x, z) => x >= zone.x0 && x <= zone.x1 && z >= zone.z0 && z <= zone.z1;
  const mine = built.obstacles.filter((o) => inZone((o.x0 + o.x1) / 2, (o.z0 + o.z1) / 2)), others = built.obstacles.filter((o) => !mine.includes(o));
  if (mine.length !== 3) bad.push(`${mine.length} cluster obstacles`);
  for (const o of mine) {
    if (others.some((q) => o.x0 < q.x1 && o.x1 > q.x0 && o.z0 < q.z1 && o.z1 > q.z0)) bad.push("overlaps another obstacle");
    if (!inGallery(o.x0, o.z0) || !inGallery(o.x1, o.z1)) bad.push("outside the gallery");
    if (o.x0 < W.CHANNEL.x1 + 1.5) bad.push("on the old stream's walk");
    for (const z of W.reservedZones(4)) if (o.x0 < z.x1 && o.x1 > z.x0 && o.z0 < z.z1 && o.z1 > z.z0) bad.push(`in the ${z.why} plot`);
  }
  for (const id of NEW) {
    const at = byId[id].at;
    if (!inGallery(at.x, at.z) || others.concat(mine).some((q) => at.x > q.x0 - 0.3 && at.x < q.x1 + 0.3 && at.z > q.z0 - 0.3 && at.z < q.z1 + 0.3)) bad.push(`${id}'s walk-up spot is blocked or outside`);
  }
  const records = built.solids.filter((s) => inZone(s.x, s.z)).length + built.signs.filter((s) => inZone(s.x, s.z)).length + mine.length + NEW.length;
  record(`rule: the cluster stands inside the gallery, clear of walkways, lamps and other exhibits, in ${records} scene records (at most about 150)`, !bad.length && records <= 150, bad.join("; "));
}

// rule: every new terminal answers HELP, MORE and RESET, and the workbench finds buttons in its HELP with no line
// repeated in its right column.
{
  const bad = [];
  for (const id of NEW) {
    const t = term(id), help = t.run("HELP").lines, more = t.run("MORE").lines, reset = t.run("RESET");
    if (!help.length || !more.length || !reset.reset) bad.push(`${id} HELP/MORE/RESET`);
    if (!B.actionsFrom(help).length) bad.push(`${id} has no buttons`);
    const all = B.sections({ banner: t.banner, more, hint: byId[id].hint }).flatMap((s) => s.lines);
    if (new Set(all).size !== all.length) bad.push(`${id} repeats a line`);
  }
  const cmds = (id) => B.actionsFrom(term(id).run("HELP").lines).map((a) => a.cmd).join(" ");
  if (!/MOVE/.test(cmds("e4-strategy")) || !/SEND/.test(cmds("e4-wireless")) || !/NEXT/.test(cmds("e4-teletext"))) bad.push(`buttons ${cmds("e4-strategy")} / ${cmds("e4-wireless")} / ${cmds("e4-teletext")}`);
  record("rule: the new terminals answer HELP, MORE and RESET, and the workbench reads buttons from each HELP without repeating a line", !bad.length, bad.join("; "));
}

// rule: every strategy board can be won within its move limit (a search over positions through the module's own
// moves), a caught piece goes home, walls and taken squares refuse, and the limit ends the board.
const S = GAMES.strategy;
const solve = (n) => {
  const core = S.create(); core.load(n);
  const s = core.s, start = [s.at[0], s.at[1], s.guard], prev = new Map([[start.join(), null]]);
  let frontier = [start];
  for (let depth = 0; depth < S.MOVES && frontier.length; depth++) {
    const next = [];
    for (const st of frontier) for (let p = 0; p < 2; p++) for (let d = 0; d < 4; d++) {
      core.set(st[0], st[1], st[2], depth);
      const r = core.move(p, d);
      if (r === "won") { const line = [[p, d]]; for (let k = st.join(); prev.get(k); k = prev.get(k).from) line.unshift(prev.get(k).move); return line; }
      if (r !== "ok" && r !== "caught") continue;
      const key = [s.at[0], s.at[1], s.guard].join();
      if (!prev.has(key)) { prev.set(key, { from: st.join(), move: [p, d] }); next.push([s.at[0], s.at[1], s.guard]); }
    }
    frontier = next;
  }
  return null;
};
const lines = S.BOARDS.map((_, n) => solve(n));
{
  const bad = [];
  lines.forEach((l, n) => { if (!l || l.length > S.MOVES) bad.push(`board ${n + 1} unwinnable`); });
  const core = S.create(); core.load(0);
  const s = core.s;
  if (core.move(0, 3) !== "wall") bad.push("edge not refused");
  // Stalling never wins: B steps north and back until the limit ends the board.
  core.load(0);
  for (let k = 0; k < 200 && !s.lost && !s.won; k++) for (const d of [0, 2, 1, 3]) { const r = core.move(1, d); if (r !== "wall" && r !== "blocked") break; }
  if (!s.lost || s.used !== S.MOVES) bad.push(`limit: used ${s.used}, lost ${s.lost}`);
  const t = term("e4-strategy"); t.run("RESET");
  const solvedBoard1 = lines[0].every(([p, d]) => !/wall|taken/i.test(text(t.run(`MOVE ${"AB"[p]} ${"NESW"[d]}`))));
  if (!solvedBoard1 || !/GOAL REACHED/.test(text(t.run("LOOK")))) bad.push("the winning line through the terminal does not reach the goal");
  const caught = (() => { const c = S.create(); c.load(1); for (let k = 0; k < 20; k++) { for (let d = 0; d < 4; d++) { const r2 = c.move(0, d); if (r2 === "caught") return c.s.at[0] === c.s.home[0] || c.s.at[1] === c.s.home[1]; if (r2 !== "wall" && r2 !== "blocked") break; } if (c.s.won || c.s.lost) break; } return null; })();
  if (caught === false) bad.push("a caught piece did not go home");
  record(`rule: each strategy board is winnable within ${S.MOVES} moves (shortest ${lines.map((l) => l && l.length).join(", ")}), edges refuse, the limit ends a board, a capture sends a piece home${caught === null ? " (no capture met on this probe)" : ""}`, !bad.length, bad.join("; "));
}

// playthrough: the strategy console (retro-games.js factory interface) reaches its result, shown and scored.
const host = () => {
  const h = { best: 0, still: false, aim: { x: 0, hold: 0, steps: 0, y: 0, stepsY: 0 }, overs: 0, ends: [], popup() {}, cue() {}, shake() {}, crack() {}, flop() {} };
  h.over = () => { h.overs++; }; h.onEnd = (score) => { h.ends.push(score); };
  return h;
};
const keys = ["kind", "name", "help", "coach", "stars", "tickets", "status", "playing", "start", "act", "stop", "update", "draw", "aims"];
{
  const h = host(), g = S.make(h), bad = [];
  if (keys.some((k) => !(k in g))) bad.push("interface incomplete");
  h.aim.steps = 5; g.start(0);
  g.update(1 / 60);
  if (g.status.left !== S.MOVES) bad.push("a step held before start moved a piece");
  let piece = 0;
  for (const [p, d] of lines[0]) {
    if (p !== piece) { g.act(); piece = p; }
    if (d === 1) h.aim.steps++; else if (d === 3) h.aim.steps--; else if (d === 2) h.aim.stepsY++; else h.aim.stepsY--;
    g.update(1 / 60); g.draw(ctx2d);
  }
  for (let k = 0; k < 200; k++) g.update(1 / 60);
  g.draw(ctx2d);
  if (h.overs !== 1 || h.ends.length !== 1 || !(h.ends[0] > 0) || g.playing) bad.push(`over ${h.overs}, ends ${h.ends}`);
  if (!(g.tickets(h.ends[0]) > 0)) bad.push("no tickets for a win");
  record("playthrough: the strategy console plays a winning line from its own input to one over(), one onEnd with a score and tickets; a step held before start moves nothing", !bad.length, bad.join("; "));
}

// rule: the information screen ships only READY context records, word for word, names no real service, and its
// remote reaches every page; the HOLD stays on the screen's own About page.
const T = GAMES.teletext;
{
  const bad = [], core = T.create(TD.records), t = term("e4-teletext");
  const want = TD.records.filter((r) => r.era === 4 && r.connection.contextOnly);
  for (const r of want) {
    const p = core.pages.find((q) => q.title === r.sign);
    if (!p) { bad.push(`no page for ${r.id}`); continue; }
    const words = p.rows.join(" ");
    for (const part of [r.kid, r.marks]) for (const w of part.toUpperCase().split(/\s+/)) if (!words.includes(w.slice(0, 26))) bad.push(`${r.id} lost "${w}"`);
  }
  if (core.pages.some((p) => /HASHCASH|B-MONEY|TIMESEC|SECURE NAMES/.test(p.rows.join(" ")))) bad.push("a citation's record leaked onto the screen");
  const all = core.pages.map((p) => `${p.title} ${p.rows.join(" ")}`).join(" ").toUpperCase();
  if (/CEEFAX|ORACLE|TELETEXT|VIDEOTEX|WI-FI|WIFI/.test(all)) bad.push("names a service or brand");
  if (!/ON HOLD/.test(all)) bad.push("the HOLD is not stated");
  if (!/Page 999 is not/.test(text(t.run("999")))) bad.push("a missing page is not refused");
  if (!/P110/.test(text(t.run("110"))) || !/REVEAL/.test(text(t.run("190"))) || !/CAME FIRST/.test(text(t.run("REVEAL")))) bad.push("pages or reveal");
  for (const p of core.pages) if (p.rows.some((row) => row.length > T.COLS)) bad.push(`P${p.number} row too wide`);
  record(`rule: the information screen shows ${want.length} READY context records word for word, no citation, service name or brand, refuses a missing page, reveals its quiz, and states the HOLD`, !bad.length, bad.join("; "));
}
{
  const h = host(), g = T.make(h), bad = [];
  if (keys.some((k) => !(k in g))) bad.push("interface incomplete");
  g.start(1);
  for (let k = 0; k < 20 && g.playing; k++) { h.aim.steps++; g.update(1 / 60); g.draw(ctx2d); h.aim.stepsY++; g.update(1 / 60); }
  for (let k = 0; k < 200; k++) g.update(1 / 60);
  const pages = T.create(TD.records).pages.length;
  if (h.overs !== 1 || h.ends.length !== 1 || h.ends[0] !== pages || g.playing) bad.push(`over ${h.overs}, ends ${h.ends}, pages ${pages}`);
  record("playthrough: the information screen's console turns through every page to one over() and one onEnd scoring the pages read", !bad.length, bad.join("; "));
}

// rule: the packet toy is seeded (a seed replays its tries), bounds retries per hop and packets per session, routes
// round a switched-off box, reports no route when none remains, and its dates are the READY record's.
const R = GAMES.wireless;
{
  const bad = [], run = (seed) => { const c = R.create(); c.seed(seed); c.reset(); c.setNoise(2); const out = []; for (let k = 0; k < 8; k++) { out.push(c.send(0, 4), Array.from(c.log.tries.slice(0, c.log.hops)).join("")); } return out.join(); };
  if (run(7) !== run(7) || run(7) === run(8)) bad.push("seeding");
  const c = R.create(); c.setNoise(3);
  for (let k = 0; k < 30; k++) { c.send(0, 4); for (let h2 = 0; h2 < c.log.hops; h2++) if (c.log.tries[h2] > R.RETRIES + 1) bad.push("too many tries"); }
  if (c.s.sent !== R.SESSION || c.send(0, 4) !== "full") bad.push("session cap");
  c.reset(); c.setNoise(0); c.power(1, false);
  let via = ""; for (let k = 0; k < 5 && !via; k++) if (c.send(0, 4) === "delivered") via = Array.from(c.log.to.slice(0, c.log.hops)).join("");
  if (via !== "234") bad.push(`route round B was ${via}`);
  c.power(3, false);
  if (c.send(0, 4) !== "noroute") bad.push("no route not reported");
  const rec = TD.records.find((r) => r.id === "tl-4-wifi"), banner = term("e4-wireless").banner.join(" ");
  if (!rec || rec.date !== "1997-06-26" || !/18 November 1997/.test(rec.marks) || !/1 and 2 Mbit\/s/.test(rec.marks)) bad.push("the READY record changed");
  if (!/26 June 1997/.test(banner) || !/18 November 1997/.test(banner) || !/1 and 2 Mbit\/s/.test(banner) || /Wi-Fi/i.test(banner)) bad.push("the banner's dates or names");
  const t = term("e4-wireless");
  const sent = text(t.run("SEND A E"));
  if (!/A -> /.test(sent) || !/(DELIVERED|LOST)/.test(sent)) bad.push("no visible delivery result");
  record("rule: the packet toy replays from its seed, caps retries and packets, routes round a switched-off box, reports no route, shows each hop's result, and dates 802.11 from the READY record (approved 26 June, published 18 November 1997, 1 and 2 Mbit/s)", !bad.length, bad.join("; "));
}
{
  const h = host(), g = R.make(h), bad = [];
  if (keys.some((k) => !(k in g))) bad.push("interface incomplete");
  h.still = true; g.start(3);
  for (let k = 0; k < 12 && g.playing; k++) { g.act(); for (let f = 0; f < 30; f++) g.update(1 / 60); g.draw(ctx2d); }
  for (let k = 0; k < 200; k++) g.update(1 / 60);
  if (h.overs !== 1 || h.ends.length !== 1 || g.playing) bad.push(`over ${h.overs}, ends ${h.ends}`);
  // The era's box lamps follow the toy's switches.
  const radio = byId["e4-wireless"].onUse({}).terminal;
  radio.run("OFF C");
  EX.eras[4].update(1 / 60, 0, { calm: false, reading: true });
  const lamps = built.solids.filter((s) => s.n.glow !== 1 && s.z > era.z && s.x > 33);
  if (lamps.length !== 1 || !(lamps[0].n.glow < 0.5)) bad.push(`lamps ${lamps.length}`);
  record("playthrough: the packet console sends its ten packets to one over() and one onEnd; the stand's lamp shows a switched-off box", !bad.length, bad.join("; "));
}

// contract: disposing Era 4 drops the cluster's state; a rebuild starts fresh.
{
  term("e4-strategy").run("MOVE A N");
  EX.eras[4].dispose();
  const again = build(BL), t = again.props.find((p) => p.id === "e4-strategy").onUse({}).terminal;
  record("contract: dispose drops the cluster's games; a fresh visit starts each from its first board, page and session", /20 of 20 moves left/.test(text(t.run("LOOK"))), text(t.run("LOOK")));
}

// rule: without the game modules on the page, each stand still opens something (a caption), so the integrator can
// land the era file before the script tags.
{
  const BL2 = await load(["genesis-voyage", "genesis-world", "genesis-props", "genesis-exhibits", "genesis-era-4"], context());
  const b = build(BL2), opened = NEW.map((id) => b.props.find((p) => p.id === id).onUse({}));
  record("rule: without the game modules each new stand opens a caption, never nothing", opened.every((r) => r && typeof r.caption === "string"), JSON.stringify(opened));
}

const passed = results.filter(Boolean).length;
console.log(`${passed}/${results.length} Era 4 upgrade checks passed`);
process.exit(passed === results.length ? 0 : 1);
