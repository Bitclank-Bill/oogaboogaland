// Era 3's second upgrade (motion, light and sound cues), checked in Node through the era file's own build, terminals
// and update, with a stand-in kit and canvas that only record what is asked of them:
//   node test/genesis-era-3-upgrade2.mjs     one line a check; exit 1 on a failure.
// It checks end states (every motion lands where the command says), Calm (end states at once, blinking steady), holds
// (a frame not run moves nothing; the next frame carries on from where it was, no jump) and active(false) (everything
// settled). Owned by the Era 3 builder; the integrator may call `era3Upgrade2Proof` from the unit tier.
import { readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

export const era3Upgrade2Proof = async () => {
  // Each canvas its own context, counting its fills.
  const ctx2d = () => { const c = { fills: 0 }; return new Proxy(c, { get: (t, k) => k === "fills" ? c.fills : k === "fillRect" ? () => { c.fills++; } : typeof k === "string" && /^[a-z]/.test(k) ? () => ({ addColorStop: () => {} }) : undefined, set: () => true }); };
  const context = { window: {}, document: { createElement: () => { const g = ctx2d(); return { width: 0, height: 0, getContext: () => g }; } } };
  for (const f of ["genesis-voyage", "genesis-world", "genesis-props", "genesis-exhibits", "genesis-era-3"]) runInNewContext(await readFile(join(root, `src/js/${f}.js`), "utf8"), context);
  const BLc = context.window.BL, W = BLc.genesisWorld, EX = BLc.genesisExhibits, E = BLc.genesisEra3, def = EX.eras[3];
  const node = (o = {}) => ({ position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 }, children: [], visible: true, glow: 1, ...o });
  const cues = [], every = [], props = {};
  const kit = { era: W.ERAS[3], top: W.BANK_TOP, channel: W.CHANNEL, M: { box: () => ({}), merge: () => ({}), moved: (g) => g, turnedX: (g) => g, turnedZ: (g) => g },
    createNode: (o = {}) => node({ ...o, position: { x: 0, y: 0, z: 0, ...(o.position || {}) }, scale: { x: 1, y: 1, z: 1 }, children: [] }), addChild: () => {}, place: (n) => n,
    label: () => ({ face: {}, back: {}, width: 1, height: 1 }),
    solid: (w, h, d, c, x, y, z) => node({ position: { x, y, z } }), sign: () => node(), obstacle: () => {}, notify: () => {},
    cue: (name) => { cues.push(name); every.push(name); }, prop: (d) => { props[d.id] = d; return { ...d, era: 3 }; } };
  def.build(kit);
  const V = E.visit, far = { era: 3, walking: true, reading: true, calm: false, x: -30, z: -340 };
  let t = 0;
  const run = (seconds, state = far, step = 1 / 60) => { for (let s = 0; s < seconds - 1e-9; s += step) { t += step; def.update(step, t, state); } };
  const term = (id) => props[id].onUse({}).terminal;
  const shown = () => Array.from(V.tileShown).join("");
  const r = {};
  run(0.2);
  const ALLOWED = new Set(["whir", "click", "clack", "relay", "chime", "thunk", "rustle-paper", "beep", "hum-start", "hum-stop"]);

  // --- The press: the links turn one after another from the changed page, then the printed box; a clack, a chime back.
  cues.length = 0;
  const press = term("e3-press");
  press.run("EDIT 2 Ooga trades ten shells");
  run(1 / 60);
  const first = shown();
  run(0.1);
  const mid = shown();
  // A hold (the frame not run: a pause, a workbench elsewhere) then one frame: it carries on, no jump to the end.
  // Ten seconds pass with no frame run (a pause, or a workbench elsewhere): nothing moved, and the next frame carries on
  // from where the cascade was rather than jumping to the end.
  const held = shown();
  t += 10;
  run(1 / 60);
  const afterHold = shown();
  run(1.2);
  r.pressCascade = first === "01000" && mid === "01000" && held === mid && afterHold !== "01111" && shown() === "01111" && V.printedBad.visible && !V.printedOk.visible
    && V.pressClock === -1 && cues.filter((c) => c === "clack").length === 1;
  press.run("RESET"); run(1.5);
  r.pressRestores = shown() === "00000" && V.printedOk.visible && cues.includes("chime") && V.tilePop.every((p) => p === 0) && V.tiles.every((x) => x.ok.scale.y === 1);
  // Calm: the end state at once.
  press.run("EDIT 4 Day 4: Ooga lends TWO shells"); def.update(1 / 60, t += 1 / 60, { ...far, calm: true });
  r.pressCalm = shown() === "00011" && V.printedBad.visible && V.pressClock === -1;
  press.run("RESET"); def.update(1 / 60, t += 1 / 60, { ...far, calm: true });

  // --- The padlock: the shackle eases down, then shows shut with a click; Calm shuts it at once.
  cues.length = 0;
  const pad = term("e3-padlock"), y0 = V.shackleBaseY;
  pad.run("LOCK meet at the dock"); run(0.1);
  const easing = V.shackleOpen.visible && V.shackleOpen.position.y < y0 && !V.shackleShut.visible;
  run(0.4);
  r.shackleEases = easing && V.shackleShut.visible && !V.shackleOpen.visible && cues.includes("click");
  pad.run("RESET"); def.update(1 / 60, t += 1 / 60, { ...far, calm: true });
  r.shackleCalm = V.shackleOpen.visible && V.shackleOpen.position.y === y0 && V.shackleT === 0;

  // --- The modem: a chase while dialling (one lamp lit at a time), then sequence blinking; hum-start, hum-stop.
  cues.length = 0;
  const bbs = term("e3-bbs");
  bbs.run("DIAL"); run(0.3);
  const lit = V.modemLeds.filter((l) => l.glow > 1).length;
  run(2);
  const glows = new Set(); for (let k = 0; k < 20; k++) { run(1 / 20); glows.add(V.modemLeds.map((l) => l.glow).join()); }
  r.modemSequence = lit === 1 && V.dialT === 0 && glows.size > 1 && cues.join() === "beep,hum-start";
  def.update(1 / 60, t += 1 / 60, { ...far, calm: true });
  r.modemCalm = V.modemLeds.every((l) => l.glow === 1.2);
  bbs.run("HANGUP"); run(0.1);
  const dark = V.modemLeds.map((l) => l.glow).join(); V.modemLeds[2].glow = 9; run(0.1);
  r.modemIdle = cues.includes("hum-stop") && dark === "0.6,0.08,0.08,0.08,0.08" && V.ledsIdle && V.modemLeds[2].glow === 9;
  V.modemLeds[2].glow = 0.08;

  // --- The pager: a page buzzes it (body and lamp shake, the lamp at full), then it settles; Calm doesn't shake.
  cues.length = 0;
  const pager = term("e3-pager"), z0 = V.buzzBase[0];
  pager.run("MEET"); run(0.05);
  const zs = []; for (let k = 0; k < 10; k++) { run(1 / 60); zs.push(V.pagerBody.position.z); }
  const buzzing = new Set(zs).size > 1 && V.pagerLamp.glow === 2 && cues.includes("beep");
  run(1);
  r.pagerBuzz = buzzing && V.buzzT === 0 && V.pagerBody.position.z === z0 && V.pagerLamp.position.z === V.buzzBase[1];
  pager.run("HELLO"); def.update(1 / 60, t += 1 / 60, { ...far, calm: true });
  r.pagerCalm = V.buzzT === 0 && V.pagerBody.position.z === z0;

  // --- The test screen: the next grid wipes down from the top, a band at a time, then its label; Calm at once.
  cues.length = 0;
  bbs.run("CRT"); run(1 / 60);
  const gh = E.GRIDS[V.bbs.crt.level][1], part = V.crtRow;
  run(0.1);
  const more = V.crtRow;
  run(1);
  r.crtWipe = part > 0 && part < gh && more > part && more < gh && V.crtRow === gh && V.crtClock === -1 && cues.includes("click");
  const before = V.crtCtx.fills; run(0.5);
  r.crtIdle = V.crtCtx.fills === before && V.crtClock === -1;
  bbs.run("CRT"); def.update(1 / 60, t += 1 / 60, { ...far, calm: true });
  r.crtCalm = V.crtRow === E.GRIDS[V.bbs.crt.level][1] && V.crtClock === -1;

  // --- The cabinet: the marquee chases while nobody plays, steady in Calm.
  const chase = new Set(); for (let k = 0; k < 16; k++) { run(1 / 16); chase.add(V.bulbs.map((b) => b.glow).join()); }
  def.update(1 / 60, t += 1 / 60, { ...far, calm: true });
  const steady = V.bulbs.map((b) => b.glow).join(); def.update(1 / 60, t += 0.4, { ...far, calm: true });
  r.marquee = chase.size > 2 && V.bulbs.length === 7 && steady === V.bulbs.map((b) => b.glow).join() && V.bulbs.every((b) => b.glow === 1.1);

  // --- The courier: the shut padlock's lamp eases on.
  const courier = term("e3-courier");
  courier.run("SEND TOCK hello"); run(0.1);
  const easingLamp = V.courierGlow[1] > 0 && V.courierGlow[1] < 1;
  run(0.5);
  r.courierLamp = easingLamp && V.courierGlow[1] === 1 && V.courierLamps[1].visible && !V.courierLamps[0].visible;

  // --- active(false) mid-motion: everything lands at its end state, and an open line's hum is told to stop.
  bbs.run("DIAL"); press.run("EDIT 3 Ooga plants two trees"); pad.run("LOCK note"); pager.run("THANKS"); bbs.run("CRT");
  run(1 / 60);
  cues.length = 0;
  def.active(false, far);
  r.activeSettles = shown() === "00111" && V.pressClock === -1 && V.shackleShut.visible && V.dialT === 0 && V.buzzT === 0 && V.crtClock === -1 && V.pagerBody.position.z === z0 && cues.includes("hum-stop");

  // Every cue asked for in the whole run is one of the Genesis tab's names.
  r.cuesAllowed = every.length > 0 && every.every((c) => ALLOWED.has(c));
  def.dispose();
  r.disposed = E.visit === null;
  return r;
};

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const r = await era3Upgrade2Proof();
  let ok = true;
  for (const [k, v] of Object.entries(r)) { console.log(`${v ? "PASS" : "FAIL"} ${k}`); if (!v) ok = false; }
  console.log(ok ? `era 3 upgrade 2: all ${Object.keys(r).length} checks passed` : "era 3 upgrade 2: FAILED");
  process.exit(ok ? 0 : 1);
}
