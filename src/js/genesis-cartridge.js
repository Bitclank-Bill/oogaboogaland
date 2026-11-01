// The Genesis museum's cartridge console: era games played on a console panel, the future home of FUD Patrol.
//
// An era file registers a game, as the era tabs were told:
//
//   (BL.genesisCartridges = BL.genesisCartridges || { list: [] }).list.push({ id, era, title, label, make })
//
// - `id` is stable (letters, digits and -); `era` 0..7; `title` the game's name; `label` the sign text, which must say
//   it is a modern original game in the spirit of its era (the words "modern" and "original"); never a date on the
//   timeline, never an exhibit connection.
// - `make(host)` follows retro-games.js's header contract: it returns { start(seed), act(), stop(), update(dt),
//   draw(ctx), playing, status, help?, coach? } and may read BL.retroGames.kit (read-only). The console passes the
//   same host the carnival scene does: { best, aim, still, onEnd(score), over(), popup(text, big), cue(name, gain),
//   shake(k), crack(big), flop() }, with `aim` { x, hold, steps, y, stepsY } written by the console's keys and touch.
// - Optional, for adapters (FUD Patrol's repaired package plugs in this way, through a small wrapper, once its maker's
//   repairs land): `screen: { w, h }` (the canvas size; 160 x 120 without it, the retro games' screen) and
//   `host.held` { left, right, up, down, act }, the buttons as held now, for a game that reads buttons rather than
//   `aim` (FUD Patrol's left / right / jump / shoot map onto left, right, up and act).
//
// A cabinet or board prop's onUse may return `{ cartridge: "<id>" }`; scene-genesis.js then opens the console on it.
// The console holds the scene as the workbench and menu do (genesis-world.js holdsFor `console`), so nothing else
// moves while it is up. Keys on the console's own panel (never document or window): arrows or W A S D steer, Space or
// Enter starts and acts, P pauses, M mutes (the page-wide environment mute, sound.js), Escape closes; touch has the
// same buttons. Close puts the camera back exactly (the scene owns that); focus returns to the scene's canvas.
//
// While open it also listens for the tab being hidden and the window losing focus (added on open, removed on close):
// either lets go of every held button and pauses a running game.
//
// `create({ root, onClose, still })` → { open(id, { still }), close(), update(dt), key(type, code, repeat), get isOpen, get id,
// get paused, game, aim, held, stats(), dispose() }. `root` is the panel's element (null in Node: the console then runs
// headless, for checks). `update` allocates nothing; the console's synthesized blips use a fixed bank of voices built
// on the first gesture and closed with the console.
(() => {
  "use strict";
  const BL = window.BL = window.BL || {};
  const registry = BL.genesisCartridges = BL.genesisCartridges || { list: [] };
  const SCREEN = { w: 160, h: 120 };
  // What is wrong with a cartridge entry, or null.
  const validate = (c, list = registry.list) => {
    if (!c || typeof c !== "object") return "a cartridge is an object";
    if (typeof c.id !== "string" || !/^[a-z0-9][a-z0-9-]{1,40}$/.test(c.id)) return `cartridge id "${c && c.id}" must be lower-case letters, digits and -`;
    if (list.filter((x) => x && x.id === c.id).length > 1) return `cartridge ${c.id} is registered twice`;
    if (!Number.isInteger(c.era) || c.era < 0 || c.era > 7) return `${c.id}: era must be 0 to 7`;
    if (typeof c.title !== "string" || !c.title) return `${c.id}: a title is required`;
    if (typeof c.label !== "string" || !/modern/i.test(c.label) || !/original/i.test(c.label)) return `${c.id}: the label must say it is a modern original game in the spirit of its era`;
    if (typeof c.make !== "function") return `${c.id}: make(host) is required`;
    if (c.screen !== undefined && !(c.screen && c.screen.w > 0 && c.screen.h > 0)) return `${c.id}: screen must be { w, h }`;
    return null;
  };
  const find = (id) => registry.list.find((c) => c && c.id === id) || null;
  // Every registered cartridge, checked; throws on the first bad one (the scene calls this once a visit).
  const checkAll = () => { for (const c of registry.list) { const bad = validate(c); if (bad) throw new Error(`genesis cartridges: ${bad}`); } return registry.list.length; };

  // Keys the console takes on its panel: steering, act, pause, mute, close.
  const KEYS = { ArrowLeft: "left", KeyA: "left", ArrowRight: "right", KeyD: "right", ArrowUp: "up", KeyW: "up", ArrowDown: "down", KeyS: "down",
    Space: "act", Enter: "act", NumpadEnter: "act", KeyP: "pause", KeyM: "mute", Escape: "close" };
  const STEER = 2.2;

  const create = ({ root = null, onClose = null, still = false } = {}) => {
    const aim = { x: 0, hold: 0, steps: 0, y: 0, stepsY: 0 };
    const held = { left: false, right: false, up: false, down: false, act: false };
    const touchHeld = { left: 0, right: 0, up: 0, down: 0, act: 0 };
    const st = { open: false, id: null, entry: null, paused: false, ended: false, lastScore: 0, best: 0, updates: 0, cues: 0, w: SCREEN.w, h: SCREEN.h };
    let game = null, ctx2d = null, el = null;
    const ac = new AbortController();
    // --- Sound: a fixed bank of four voices on the first gesture, gated by the page-wide mute ---------------------
    const audio = { ctx: null, out: null, voices: null, next: 0 };
    const wake = () => {
      if (audio.ctx || typeof window === "undefined") return;
      const Ctx = window.AudioContext || window.webkitAudioContext, act = window.navigator && window.navigator.userActivation;
      if (!Ctx || (act && !act.isActive)) return;
      audio.ctx = new Ctx();
      audio.out = BL.sound ? BL.sound.output(audio.ctx) : audio.ctx.destination;
      audio.voices = [];
      for (let i = 0; i < 4; i++) {
        const osc = audio.ctx.createOscillator(), gain = audio.ctx.createGain();
        osc.type = "square"; gain.gain.value = 0; osc.connect(gain); gain.connect(audio.out); osc.start();
        audio.voices.push({ osc, gain });
      }
    };
    const PITCH = new Map();
    const pitchOf = (name) => {
      let p = PITCH.get(name);
      if (p === undefined) { let h = 2166136261; for (let i = 0; i < name.length; i++) h = Math.imul(h ^ name.charCodeAt(i), 16777619); p = 220 * Math.pow(2, ((h >>> 0) % 24) / 12); PITCH.set(name, p); }
      return p;
    };
    const cue = (name, gain = 1) => {
      st.cues++;
      if (!audio.voices || !name) return;
      const v = audio.voices[audio.next++ & 3], t = audio.ctx.currentTime, g = v.gain.gain;
      v.osc.frequency.setValueAtTime(pitchOf(String(name)), t);
      g.cancelScheduledValues(t); g.setValueAtTime(0.06 * Math.min(1, gain), t); g.exponentialRampToValueAtTime(0.0001, t + 0.12);
    };
    const host = {
      best: 0, aim, held, still,
      onEnd: (score) => { st.ended = true; st.lastScore = score | 0; if (score > st.best) st.best = score | 0; host.best = st.best; },
      over: () => {}, popup: () => {}, cue, shake: () => {}, crack: () => {}, flop: () => {}
    };
    // --- The panel ------------------------------------------------------------------------------------------------
    const build = () => {
      if (!root || el) return;
      el = root;
      el.replaceChildren();
      const make = (tag, cls, text, attrs) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text) n.textContent = text; for (const k in attrs || {}) n.setAttribute(k, attrs[k]); return n; };
      const head = make("div", "cart-head"), titles = make("div", "cart-titles");
      titles.append(make("p", "cart-kicker", "", { id: "genesis-cart-kicker" }), make("h2", "", "Console", { id: "genesis-cart-title" }));
      const bar = make("div", "cart-bar");
      bar.append(make("button", "", "Pause", { type: "button", "data-cart": "pause" }), make("button", "", "Sound", { type: "button", "data-cart": "mute" }), make("button", "cart-close", "Close ×", { type: "button", "data-cart": "close" }));
      head.append(titles, bar);
      const screen = make("canvas", "cart-screen", "", { id: "genesis-cart-screen", width: String(SCREEN.w), height: String(SCREEN.h), role: "img", "aria-label": "The console's screen", tabindex: "0" });
      const status = make("p", "cart-status", "", { id: "genesis-cart-status", "aria-live": "polite" });
      const pad = make("div", "cart-pad", "", { "aria-label": "Console buttons" });
      for (const [b, t] of [["left", "◀"], ["up", "▲"], ["down", "▼"], ["right", "▶"], ["act", "A"]]) pad.append(make("button", "", t, { type: "button", "data-hold": b, "aria-label": b }));
      const note = make("p", "cart-note", "", { id: "genesis-cart-note" });
      el.append(head, screen, status, pad, note);
      ctx2d = screen.getContext("2d");
      ctx2d.imageSmoothingEnabled = false;
      const signal = ac.signal;
      el.addEventListener("keydown", (e) => { if (key("down", e.code, e.repeat)) { e.preventDefault(); e.stopPropagation(); } }, { signal });
      el.addEventListener("keyup", (e) => { if (key("up", e.code, false)) { e.preventDefault(); e.stopPropagation(); } }, { signal });
      el.addEventListener("click", (e) => {
        const b = e.target.closest("button");
        if (!b || !st.open) return;
        wake();
        if (b.dataset.cart === "close") close();
        else if (b.dataset.cart === "pause") togglePause();
        else if (b.dataset.cart === "mute") toggleMute();
        screen.focus({ preventScroll: true });
      }, { signal });
      // Every press on the panel is a gesture: it unlocks the console's sound, whatever it lands on.
      el.addEventListener("pointerdown", (e) => {
        wake();
        const b = e.target.closest("[data-hold]");
        if (e.target === screen) { press(); return; }
        if (!b) return;
        e.preventDefault();
        if (b.setPointerCapture) b.setPointerCapture(e.pointerId);
        touch(b.dataset.hold, true);
      }, { signal });
      const lift = (e) => { const b = e.target.closest && e.target.closest("[data-hold]"); if (b) touch(b.dataset.hold, false); };
      el.addEventListener("pointerup", lift, { signal });
      el.addEventListener("pointercancel", lift, { signal });
    };
    const paintText = () => {
      if (!el) return;
      const c = st.entry;
      el.querySelector("#genesis-cart-kicker").textContent = c ? c.label : "";
      el.querySelector("#genesis-cart-title").textContent = c ? c.title : "Console";
      el.querySelector("#genesis-cart-note").textContent = "Arrows or W A S D steer · Space or Enter: start and act · P pause · M sound · Esc close";
      const s = el.querySelector("#genesis-cart-status");
      s.textContent = st.paused ? "Paused · P carries on" : game && game.playing ? "" : st.ended ? `Score ${st.lastScore} · best ${st.best} · Space to play again` : "Press Space or A to start";
      const pb = el.querySelector('[data-cart="pause"]'); pb.textContent = st.paused ? "Carry on" : "Pause"; pb.setAttribute("aria-pressed", String(st.paused));
      const mb = el.querySelector('[data-cart="mute"]'); mb.textContent = BL.sound && BL.sound.muted ? "Muted" : "Sound";
    };
    const syncHeld = () => {
      const k = keysHeld;
      held.left = k.left || touchHeld.left > 0; held.right = k.right || touchHeld.right > 0; held.up = k.up || touchHeld.up > 0; held.down = k.down || touchHeld.down > 0; held.act = k.act || touchHeld.act > 0;
      aim.hold = held.left === held.right ? 0 : held.right ? 1 : -1;
      aim.y = held.down ? 1 : held.up ? -1 : 0;
    };
    const keysHeld = { left: false, right: false, up: false, down: false, act: false };
    // Start a run (from the attract screen or after one ended), else act.
    const press = () => {
      if (!game || st.paused) return;
      if (!game.playing) { st.ended = false; aim.x = 0; game.start((Date.now() % 2147483646) + 1); }
      else game.act();
      paintText();
    };
    // A touch button pressed or let go (the pad's ◀ ▲ ▼ ▶ and A): wakes the sound on a press, counts a step or acts,
    // and holds the button while a pointer is on it.
    const touch = (button, down) => {
      if (!st.open || touchHeld[button] === undefined) return false;
      if (down) {
        wake();
        touchHeld[button]++;
        if (button === "act") press();
        else if (button === "left") aim.steps--;
        else if (button === "right") aim.steps++;
        else if (button === "up") aim.stepsY--;
        else if (button === "down") aim.stepsY++;
      } else if (touchHeld[button] > 0) touchHeld[button]--;
      syncHeld();
      return true;
    };
    const togglePause = () => { if (!st.open) return; st.paused = !st.paused; clearHeld(); paintText(); };
    const toggleMute = () => { if (BL.sound) BL.sound.toggle(); paintText(); };
    const clearHeld = () => { for (const k in keysHeld) keysHeld[k] = false; for (const k in touchHeld) touchHeld[k] = 0; syncHeld(); };
    // A key on the panel: true when the console took it.
    const key = (type, code, repeat) => {
      const what = KEYS[code];
      if (!what || !st.open) return false;
      if (type === "down") wake();
      if (what === "left" || what === "right" || what === "up" || what === "down" || what === "act") {
        if (type === "down" && !repeat) {
          if (what === "left") aim.steps--; else if (what === "right") aim.steps++;
          else if (what === "up") aim.stepsY--; else if (what === "down") aim.stepsY++;
          else press();
        }
        keysHeld[what] = type === "down"; syncHeld();
        return true;
      }
      if (type !== "down" || repeat) return true;
      if (what === "pause") togglePause();
      else if (what === "mute") toggleMute();
      else if (what === "close") close();
      return true;
    };
    // An interruption (the tab hidden, the window losing focus) lets go of every held button and pauses, while open.
    let watch = null;
    const interrupted = () => { if (!st.open) return; clearHeld(); if (game && game.playing && !st.paused) st.paused = true; paintText(); };
    const open = (id, opts = {}) => {
      const c = find(id);
      if (!c) return false;
      const bad = validate(c);
      if (bad) throw new Error(`genesis cartridges: ${bad}`);
      if (st.open) close(true);
      build();
      st.entry = c; st.id = id; st.open = true; st.paused = false; st.ended = false; st.lastScore = 0;
      st.w = c.screen ? c.screen.w : SCREEN.w; st.h = c.screen ? c.screen.h : SCREEN.h;
      aim.x = aim.hold = aim.steps = aim.y = aim.stepsY = 0; clearHeld();
      host.best = st.best = 0;
      host.still = opts.still !== undefined ? !!opts.still : still;
      game = c.make(host);
      if (typeof window !== "undefined" && window.addEventListener) {
        watch = new AbortController();
        window.addEventListener("blur", interrupted, { signal: watch.signal });
        if (typeof document !== "undefined") document.addEventListener("visibilitychange", () => { if (document.hidden) interrupted(); }, { signal: watch.signal });
      }
      if (el) {
        const screen = el.querySelector("#genesis-cart-screen");
        if (screen.width !== st.w) screen.width = st.w;
        if (screen.height !== st.h) screen.height = st.h;
        ctx2d.imageSmoothingEnabled = false;
        el.hidden = false;
        document.body.classList.add("genesis-cart-open");
        paintText();
        screen.focus({ preventScroll: true });
      }
      return true;
    };
    // Close: the game stops, held buttons are let go, the panel hides and the scene takes its view back (`onClose`).
    const close = (quiet = false) => {
      if (!st.open) return;
      // The game cleans up whatever state it is in (idle, running or finished), exactly once: the console lets go of
      // it first, so a second close finds nothing to stop.
      const g = game;
      game = null;
      if (g && typeof g.stop === "function") g.stop();
      st.open = false; st.paused = false; st.entry = null; st.id = null;
      if (watch) { watch.abort(); watch = null; }
      clearHeld();
      if (audio.ctx) { audio.ctx.close(); audio.ctx = audio.voices = audio.out = null; }
      if (el) { el.hidden = true; document.body.classList.remove("genesis-cart-open"); if (document.activeElement && el.contains(document.activeElement)) document.activeElement.blur(); }
      if (!quiet && onClose) onClose();
    };
    // Each frame while open: steering eases, the game steps (unless paused) and draws. Allocation-free.
    let wasPlaying = false;
    const update = (dt) => {
      if (!st.open || !game) return;
      if (!st.paused) {
        if (aim.hold) aim.x = Math.max(-1, Math.min(1, aim.x + aim.hold * dt * STEER));
        game.update(dt);
        st.updates++;
      }
      if (ctx2d) game.draw(ctx2d);
      if (game.playing !== wasPlaying) { wasPlaying = game.playing; paintText(); }
    };
    return {
      open, close, update, key, touch, interrupted,
      get isOpen() { return st.open; }, get id() { return st.id; }, get paused() { return st.paused; }, get game() { return game; },
      aim, held,
      stats: () => ({ open: st.open, id: st.id, paused: st.paused, updates: st.updates, cues: st.cues, best: st.best, w: st.w, h: st.h, audio: !!audio.ctx }),
      dispose: () => { close(true); ac.abort(); if (el) el.replaceChildren(); el = ctx2d = null; }
    };
  };
  BL.genesisCartridge = { create, validate, find, checkAll, KEYS, SCREEN, registry };
})();
