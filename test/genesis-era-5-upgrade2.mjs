// Era 5 upgrade 2 checks: node test/genesis-era-5-upgrade2.mjs. Node only, no Chrome, no build.
// End states, motion, Calm, holds and leaving for the exhibits' new motion; the cue names; and the scene records added
// against 3901b004 (skipped outside a git checkout).
import { readFile } from "node:fs/promises";
import { runInNewContext } from "node:vm";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const BASE = "3901b004e1a7fe895e9b0bdb6d7c97dcab84c41f";
const ALLOWED = ["whir", "click", "clack", "relay", "chime", "thunk", "rustle-paper", "beep", "hum-start", "hum-stop"];
const results = [];
const record = (name, ok, detail = "") => { results.push(ok); console.log(`${ok ? "PASS" : "FAIL"} ${name}${ok ? "" : ` · ${detail}`}`); };
const src = (f) => readFile(join(root, `src/js/${f}.js`), "utf8");

// The era built on a recording kit: every node it makes (solid, place) with its geometry's options, every kit call.
const build = async (eraText = null, withCue = true) => {
  const context = { window: { BL: {} }, console };
  for (const f of ["genesis-voyage", "genesis-world", "genesis-props", "genesis-exhibits", "genesis-era-5-patchwork", "genesis-era-5-mixtape", "genesis-era-5-chain"]) runInNewContext(await src(f), context);
  runInNewContext(eraText || await src("genesis-era-5"), context);
  const BL = context.window.BL, W = BL.genesisWorld, e = W.ERAS[5], props = {}, nodes = [], calls = { solid: 0, sign: 0, obstacle: 0, prop: 0, place: 0 }, cues = [];
  const node = (o = {}) => Object.assign({ position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 }, visible: true, children: [] }, o);
  const kit = { era: e, top: W.BANK_TOP, channel: W.CHANNEL, M: { box: (o) => ({ ...o }), lathe: (o) => ({ ...o, lathe: true }) }, addChild() {}, label: () => ({}), notify() {},
    createNode: (o = {}) => node({ ...o, position: { x: 0, y: 0, z: 0, ...(o.position || {}) } }),
    place: (n) => { calls.place++; nodes.push(n); return n; },
    sign: () => { calls.sign++; return node(); },
    obstacle: () => { calls.obstacle++; },
    solid: (w, h, d, color, x, y, z, emissive = 0) => { calls.solid++; const n = node({ geometry: { w, h, d, color, emissive } }); n.position.x = x; n.position.y = y; n.position.z = z; nodes.push(n); return n; },
    prop: (d) => { calls.prop++; props[d.id] = d; return d; } };
  if (withCue) kit.cue = (name) => cues.push(name);
  const def = BL.genesisExhibits.eras[5];
  def.build(kit);
  const term = (id) => { const t = props[id].onUse({}).terminal; return (line) => t.run(line).lines.join(" "); };
  const state = { era: 5, walking: true, reading: true, x: 0, z: 0, calm: false };
  const step = (seconds, calm = false) => { state.calm = calm; for (let t = 0; t < seconds; t += 1 / 60) def.update(1 / 60, t, state); };
  const find = (pred) => nodes.filter((n) => n.geometry && pred(n.geometry));
  const at = (n) => `${n.position.x.toFixed(3)},${n.position.y.toFixed(3)},${n.position.z.toFixed(3)},${n.scale.x.toFixed(3)}`;
  return { BL, W, e, def, props, nodes, calls, cues, term, step, find, at, state };
};

const V = await build();
const top = V.W.BANK_TOP;
const hopper = V.find((g) => g.color === "#fff2b0")[0];
const caps = V.find((g) => g.w === 0.2 && g.h === 0.06 && g.color === "#e8c35a");
const [tokIn, tokOut] = [V.find((g) => g.w === 0.16 && g.h === 0.035 && g.color === "#9cb8d8")[0], V.find((g) => g.w === 0.16 && g.h === 0.035 && g.color === "#7fc9c4")[0]];
const meter = V.find((g) => g.w === 0.28 && g.d === 0.28), stampTile = V.find((g) => g.w === 0.7 && g.d === 0.5 && g.color === "#e8c35a")[0];
const bars = V.find((g) => g.w === 0.42 && g.h === 0.16), tiles = V.find((g) => g.w === 0.7 && g.h === 0.04 && g.d === 0.5);
const patchTiles = V.find((g) => g.w === 0.22 && g.h === 0.03), cells = V.find((g) => g.w === 0.07 && g.h === 0.06), depthBars = V.find((g) => g.w === 0.06 && g.h === 0.02 && g.color === "#d9e36a");
const pools = V.nodes.filter((n) => n.geometry && n.geometry.lathe);
record("the parts the motion moves were all built: hop token, ring caps, two RPOW tokens, meter, stamp, bars, mosaic tiles, patch tiles, pocket cells, depth bars; light pools placed",
  !!hopper && caps.length === 16 && !!tokIn && !!tokOut && meter.length === 10 && !!stampTile && bars.length === 6 && tiles.length === 12 && patchTiles.length === 27 && cells.length === 16 && depthBars.length === 2 && pools.length >= 18,
  JSON.stringify({ caps: caps.length, meter: meter.length, bars: bars.length, tiles: tiles.length, patch: patchTiles.length, cells: cells.length, depth: depthBars.length, pools: pools.length }));
record("light pools are emissive floor discs only: flat, on the floor, within the 8 m limit, gold under Hashcash and bit gold",
  pools.every((n) => Math.abs(n.position.y - top) < 0.01 && n.geometry.emissive > 0) && pools.filter((n) => n.geometry.color === "#f0c860").length === 4);

// ---- The Chord ring: the token hops the route; the owner's cap pops at the end ---------------------------------------
{
  const ring = V.term("e5-ring"), out = ring("LOOKUP 10");
  const owner = +out.match(/Peer (\d+) holds/)[1], hops = +out.match(/; (\d+) hop/)[1];
  const capNow = caps[owner].visible, start = V.at(hopper);
  V.step(0.15); const mid = V.at(hopper), moving = hopper.visible && mid !== start;
  V.step(hops * 0.32 + 0.6);
  record("Chord LOOKUP: the owner's cap shows at once (end state); the token hops while time runs, then hides; the cap ends full size at home",
    capNow && hops >= 1 && moving && !hopper.visible && caps[owner].scale.x === 1, JSON.stringify({ hops, moving, vis: hopper.visible, s: caps[owner].scale.x }));
  ring("RESET");
}
// ---- Hashcash: the meter climbs, the stamp drops, a check lifts it ---------------------------------------------------
{
  const st = V.term("e5-stamp"), home = stampTile.position.y;
  st("BITS 6"); st("MAKE");
  const lit = meter.filter((m) => m.visible).length, grows = meter.some((m) => m.visible && m.scale.x < 1), up = stampTile.position.y > home + 0.3;
  V.step(2);
  const settled = meter.every((m) => m.scale.x === 1) && Math.abs(stampTile.position.y - home) < 1e-6;
  st("CHECK"); V.step(0.15); const lifted = stampTile.position.y > home; V.step(1);
  record("Hashcash MAKE: meter segments grow in and the stamp starts above the bench, both ending at rest; CHECK lifts the stamp and settles it",
    lit > 0 && grows && up && settled && lifted && Math.abs(stampTile.position.y - home) < 1e-6);
}
// ---- RPOW: a spent token goes in and a fresh one comes out; a reused one bounces ------------------------------------
{
  const rp = V.term("e5-rpow-desk"), homeIn = V.at(tokIn), homeOut = V.at(tokOut);
  rp("WORK"); rp("EXCHANGE W1"); V.step(0.4);
  const inMoved = V.at(tokIn) !== homeIn; V.step(0.5); const outMoved = V.at(tokOut) !== homeOut; V.step(1.2);
  const back = V.at(tokIn) === homeIn && V.at(tokOut) === homeOut;
  rp("EXCHANGE W1"); V.step(0.35); const bounced = V.at(tokIn) !== homeIn; V.step(1); const home2 = V.at(tokIn) === homeIn;
  record("RPOW EXCHANGE: the spent token travels to the slot and the fresh one out, both ending on their trays; a refused reuse bounces and returns",
    inMoved && outMoved && back && bounced && home2);
  rp("RESET");
}
// ---- Bit gold: the new string rises onto the shelf -------------------------------------------------------------------
{
  const gd = V.term("e5-bitgold-bench"), b0 = V.at(bars[0]);
  gd("MINT"); const shown = bars[0].visible, low = V.at(bars[0]) !== b0; V.step(1);
  record("bit gold MINT: the new bar shows at once and rises from below the shelf to its place", shown && low && V.at(bars[0]) === b0);
  gd("RESET");
}
// ---- BitTorrent mosaic: the piece flies in from its peer ---------------------------------------------------------------
{
  const homes = tiles.map((t) => ({ x: t.position.x, z: t.position.z }));
  const mo = V.term("e5-mosaic"), out = mo("FETCH AMBER"), piece = +out.match(/piece (\d+)/)[1], t = tiles[piece], home = homes[piece];
  V.step(0); // no time yet: still where it starts
  const fromPeer = t.visible && Math.abs(t.position.x - home.x) > 0.5; V.step(1);
  record("mosaic FETCH: the piece's tile shows at once, starting at its peer's box and ending on its place", fromPeer && t.position.x === home.x && t.position.z === home.z);
  mo("RESET");
}
// ---- Peer Patchwork: a sent tile slides across from the sender's board ----------------------------------------------
{
  const pt = V.props["e5-patchwork"].onUse({}).terminal, board = pt.run("BOARD").lines.slice(0, 3);
  let cmd = "", dest = -1;
  for (let i = 0; i < 9 && !cmd; i++) for (const [a, b] of [[0, 1], [1, 2], [2, 0]]) if (!cmd) { const ha = board[a].slice(8, 19).replace(/ /g, "")[i], hb = board[b].slice(8, 19).replace(/ /g, "")[i]; if (ha !== "." && hb === ".") { cmd = `SEND ${"ABC"[a]} ${"ABC"[b]} ${i + 1}`; dest = b * 9 + i; } }
  const d = patchTiles[dest], homeX = d.position.x;
  pt.run(cmd);
  const startsAway = d.visible && Math.abs(d.position.x - homeX) > 0.5; V.step(1);
  record("Peer Patchwork SEND: the received tile shows at once, starting on the sender's board and sliding home", startsAway && d.position.x === homeX, cmd);
  pt.run("RESET");
}
// ---- The display comparison reveals; Pattern Pocket's screen plays -------------------------------------------------
{
  V.props["e5-displays"].onUse({}); const small = depthBars.every((b) => b.scale.x < 0.2); V.step(1.5);
  record("display comparison: opening it grows each model's depth bar out in turn, ending full size", small && depthBars.every((b) => b.scale.x === 1));
  const pk = V.props["e5-pocket"].onUse({}).terminal;
  pk.run("ADD 5"); pk.run("ADD 2"); pk.run("PLAY");
  const frames = new Set(); for (let i = 0; i < 40; i++) { V.step(0.1); frames.add(cells.map((c) => +c.visible).join("")); }
  V.step(3);
  const still = cells.map((c) => +c.visible).join("");
  V.step(1); const stays = cells.map((c) => +c.visible).join("") === still;
  record("Pattern Pocket PLAY: the screen's cells animate through several frames, then hold one still frame (the first pattern)", frames.size >= 4 && still.includes("1") && stays, `${frames.size} frames`);
  pk.run("RESET"); V.step(0.1);
  record("Pattern Pocket RESET: an empty playlist leaves the screen dark", cells.every((c) => !c.visible));
}
// ---- Calm: final states at once, nothing moves ---------------------------------------------------------------------
{
  const C = await build(), hop = C.find((g) => g.color === "#fff2b0")[0], bar = C.find((g) => g.w === 0.42 && g.h === 0.16)[0], b0 = C.at(bar);
  C.step(1 / 60, true); // the host passes Calm in on its next frame
  const ring = C.term("e5-ring"); ring("LOOKUP 10"); C.term("e5-bitgold-bench")("MINT");
  const atOnce = !hop.visible && C.at(bar) === b0;
  C.step(0.5, true);
  // Calm switched on mid-motion snaps it.
  C.step(1 / 60, false); C.term("e5-bitgold-bench")("MINT"); const bar1 = C.find((g) => g.w === 0.42 && g.h === 0.16)[1], h1 = C.at(bar1);
  C.step(1 / 60, false); const moving = C.at(bar1) !== h1;
  C.step(1 / 60, true);
  const bh = C.find((g) => g.w === 0.42 && g.h === 0.16)[1];
  record("Calm: a command shows its final state at once with nothing moving; Calm switched on mid-motion puts it at its end", atOnce && moving && bh.scale.x === 1, JSON.stringify({ atOnce, moving }));
}
// ---- Holds and leaving: no update, no motion; active(false) settles; coming back never resumes ----------------------
{
  const H = await build(), bar = H.find((g) => g.w === 0.42 && g.h === 0.16)[0];
  H.term("e5-bitgold-bench")("MINT"); H.step(0.1);
  const frozen = H.at(bar); // the host stops calling update (pause, menu, console): nothing moves however long
  const held = H.at(bar) === frozen && bar.scale.x < 1;
  H.def.active(false, H.state);
  const settled = bar.scale.x === 1 && bar.position.y > 0;
  const there = H.at(bar);
  H.def.active(true, H.state); H.step(1);
  record("holds and leaving: without updates the motion stays frozen; active(false) puts it at its end; coming back never resumes it", held && settled && H.at(bar) === there);
  // Idle: with nothing moving, frames change nothing the motion owns.
  const before = H.nodes.map(H.at).join("|"); H.step(1); const after = H.nodes.map(H.at).join("|");
  const changed = before.split("|").filter((s, i) => s !== after.split("|")[i]).length;
  record("idle: once settled, frames move only the era's existing decoration (the ring's beacon and the two satellites)", changed <= 3, `${changed} nodes moved`);
}
// ---- Cues: only the Genesis tab's names, sparingly; none without a kit cue ------------------------------------------
{
  record("cues: only the allowed names, at most a few a command", V.cues.length > 0 && V.cues.every((c) => ALLOWED.includes(c)) && V.cues.length < 40, JSON.stringify(V.cues));
  const Q = await build(null, false); Q.term("e5-ring")("LOOKUP 10"); Q.step(2);
  record("cues: a kit without `cue` builds and plays silently", Q.cues.length === 0);
}
// ---- Scene records added against 3901b004 ---------------------------------------------------------------------------
{
  let baseText = null;
  try { baseText = execFileSync("git", ["show", `${BASE}:src/js/genesis-era-5.js`], { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }); } catch { baseText = null; }
  if (!baseText) record("records against 3901b004: skipped (no git checkout)", true);
  else {
    const B0 = await build(baseText), d = {};
    for (const k of Object.keys(V.calls)) d[k] = V.calls[k] - B0.calls[k];
    const ids = Object.keys(B0.props).every((id) => V.props[id]) && Object.keys(V.props).length === Object.keys(B0.props).length;
    console.log(`  records added against 3901b004: ${JSON.stringify(d)}`);
    record("records against 3901b004: no exhibit added or removed, no solid, sign or obstacle added; only placed parts and pools", ids && d.solid === 0 && d.sign === 0 && d.obstacle === 0 && d.prop === 0 && d.place > 0 && d.place <= 60, JSON.stringify(d));
  }
}

const failed = results.filter((ok) => !ok).length;
console.log(`${results.length - failed}/${results.length} checks passed`);
process.exit(failed ? 1 : 0);
