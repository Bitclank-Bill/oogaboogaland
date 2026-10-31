// The Genesis Voyage (work in progress, `?wip=genesis`): a boat ride through the ideas that came before Bitcoin.
// Milestone 1 is the harbour, the tunnel and one room, Fingerprints and Time, where Tock the archivist Ooga runs a
// stamp desk: pages are fingerprinted, each stamp links to the last, the newest is published, and a changed page
// breaks every link after it. The ride's rules, words and sources are in genesis-voyage.js; this file builds the
// cavern, drives the boat, the demo, the camera, captions, the info panel and the effects.
//
// The visitor is a passenger: the boat sails only after Sail, pauses on Pause or Space, and skips on Skip. The camera
// rides in the boat, looks where the visitor drags and turns to the exhibit only at a stop; Fixed view swaps to a
// still vantage per area. Opening the panel pauses the ride and the desk; closing it carries on as before. Calm
// (reduced motion, on when the system asks for it) stills the boat's bob and the desk's flying tiles.
(() => {
  "use strict";
  const BL = window.BL = window.BL || {};
  const G = BL.genesisVoyage, M = BL.models;
  const { createNode, addChild, removeChild, createCamera } = BL.scene;
  const { clamp } = BL.math;
  const COARSE = window.matchMedia("(pointer: coarse)").matches;
  const PREFERS_CALM = window.matchMedia("(prefers-reduced-motion: reduce)");

  // The course on the water, [x, z]: out from the dock through the tunnel, round the stamp desk and back.
  const COURSE = [[0, 3], [0, -8], [0, -17], [-1.2, -25], [1.5, -33], [5.5, -29], [6, -18], [5.5, -6], [3, 1], [0.6, 3.6]];
  const STATIONS = [{ at: 3, dwell: G.STAMP_CYCLE + 1.5, exhibit: "fingerprints", look: { x: -7.2, y: 1.7, z: -25.2 } }];
  const DESK = { x: -7.2, y: 0.55, z: -25.2 }, CHAIN = { x: -10.55, y: 3.7, z0: -21.6, step: 1.75 }, PAPER = { x: -10.5, y: 2.2, z: -31.6 };
  const ROOM_Z = -9;
  const FIXED_VIEWS = { harbour: { eye: { x: 7.5, y: 5.2, z: 9 }, look: { x: -0.5, y: 0.8, z: -2.5 } },
    room: { eye: { x: 6.5, y: 5.8, z: -18.5 }, look: { x: -6.8, y: 1.6, z: -26.5 } } };
  const TILE_COLORS = (codes) => codes.map((c) => "#" + c.slice(0, 6));

  const renderOpts = { clear: [0.04, 0.05, 0.07], sky: [0.34, 0.38, 0.46], ground: [0.16, 0.15, 0.13],
    direct: [0.72, 0.68, 0.62], directStrength: 0.3, ambientFloor: 0.42, sun: { x: 0.25, y: 1, z: 0.4 },
    shadowCenter: { x: -2, y: 0, z: -14 }, shadowExtent: 34, bloomStrength: 0.35,
    lights: new Float32Array(BL.glRenderer.POINT_LIGHT_CAPACITY * 8), lightCount: 0 };
  const LIGHTS = [[-4, 3.2, 3, 11, 1.25, 0.95, 0.6], [4, 3.2, -2, 10, 1.1, 0.85, 0.55], [0, 3, -12, 9, 0.7, 0.8, 1.1],
    [-6.5, 3.4, -25, 12, 1.35, 1.05, 0.7], [-9, 3.2, -31.5, 7, 1, 0.9, 0.7], [3, 4, -30, 12, 0.6, 0.75, 1.2], [5.5, 3, -14, 8, 0.8, 0.8, 1]];

  let root = null, camera = null, input = null, hud = null, game = null, world = null, go = null, overlayCanvas = null;
  let ride = null, course = null, demo = null, built = null, board = null, audio = null;
  const targets = [];
  const view = { yaw: 0, pitch: 0, look: 0, fixed: false, calm: false, captions: true, voice: false, readingPaused: false, reading: false };
  const boat = { x: 0, z: 0, heading: 0 }, eye = { x: 0, y: 0, z: 0 };
  let sceneTime = 0, captionKey = "", lastStamps = 0, lastPhase = "", lastTiles = -1, lastBroken = false, overlayClean = false;
  const el = {};

  // --- Building -------------------------------------------------------------------------------------------------
  const place = (node) => { addChild(root, node); return node; };
  const solid = (w, h, d, color, x, y, z, emissive = 0) => place(createNode({ geometry: M.box({ w, h, d, color, emissive }), position: { x, y, z } }));
  const buildCavern = () => {
    // Dark glass under everything (the data current runs through it), the cavern's stone round it, and ledges.
    solid(26, 0.1, 50, "#0b1216", -1, -0.08, -15, 0.05);
    solid(26, 0.4, 50, "#18242c", -1, -0.6, -15);
    for (const [w, d, x, z] of [[1.2, 50, -12.6, -15], [1.2, 50, 10.6, -15], [26, 1.2, -1, 9.6], [26, 1.2, -1, -39.6]]) solid(w, 7, d, "#3a3530", x, 3.4, z);
    solid(26, 0.6, 50, "#2a2622", -1, 7.1, -15);
    // The tunnel: two walls between the harbour and the room, with arches every few metres.
    solid(14, 7, 1.2, "#3a3530", -6.5, 3.4, ROOM_Z);
    solid(5, 7, 1.2, "#3a3530", 9.5, 3.4, ROOM_Z);
    solid(1.4, 7, 6, "#3a3530", 2.8, 3.4, ROOM_Z - 3);
    for (let i = 0; i < 4; i++) solid(4.4, 0.5, 0.5, "#6b5a45", 0, 3.6, ROOM_Z - 1 - i * 2.4, 0);
    // The dock, the harbour's lanterns and the statue the visitor came through.
    solid(4.8, 0.35, 9, "#6b4a2b", -4.2, 0.18, 2.5);
    for (let i = 0; i < 6; i++) solid(4.8, 0.04, 0.08, "#4c331d", -4.2, 0.37, -1.6 + i * 1.6);
    const statue = place(createNode({ position: { x: -4.2, y: 0.36, z: 6.6 } }));
    addChild(statue, createNode({ geometry: M.bevelBox({ w: 2.2, h: 3.1, d: 0.4, color: "#ece6d6" }), position: { x: 0, y: 1.9, z: 0 } }));
    addChild(statue, createNode({ geometry: M.box({ w: 1.5, h: 2.3, d: 0.06, color: "#9ad8ff", emissive: 0.9 }), position: { x: 0, y: 1.75, z: -0.23 } }));
    addChild(statue, createNode({ geometry: M.box({ w: 2.8, h: 0.35, d: 0.9, color: "#8a8174" }), position: { x: 0, y: 0.17, z: 0 } }));
    built.portal = statue.children[1];
    for (const [x, z] of [[-1.6, -1.8], [-6.6, -1.8], [-6.6, 6], [7.5, 2], [7.5, -6]]) {
      solid(0.14, 2.4, 0.14, "#3b2a1a", x, 1.2, z);
      solid(0.36, 0.36, 0.36, "#ffcf7a", x, 2.55, z, 1.4);
    }
    // The room's ledge, the desk, the chain wall and the newspaper.
    solid(4.6, 0.55, 15, "#4a4038", -9.9, 0.27, -26.5);
    solid(2.6, 0.55, 5, "#4a4038", -6.3, 0.27, -25.2);
    const label = BL.factoryModels.label;
    const roomSign = label("FINGERPRINTS AND TIME", "Room 4 of the Genesis Voyage", { height: 1.4, style: "gold" });
    const sign = place(createNode({ position: { x: -1, y: 5.3, z: -38.9 } }));
    addChild(sign, createNode({ geometry: roomSign.back }), createNode({ geometry: roomSign.face }));
    const harbourSign = label("THE GENESIS VOYAGE", "Before the first block", { height: 1.4, style: "gold" });
    const hs = place(createNode({ position: { x: 1, y: 5.2, z: ROOM_Z + 0.65 }, rotation: { x: 0, y: Math.PI, z: 0 } }));
    addChild(hs, createNode({ geometry: harbourSign.back }), createNode({ geometry: harbourSign.face }));
    const paperSign = label("THE DAILY OOGA", "today's fingerprint", { height: 0.9, style: "plain" });
    const ps = place(createNode({ position: { x: PAPER.x + 0.05, y: PAPER.y + 1.25, z: PAPER.z }, rotation: { x: 0, y: Math.PI / 2, z: 0 } }));
    addChild(ps, createNode({ geometry: paperSign.back }), createNode({ geometry: paperSign.face }));
    solid(0.12, 1.8, 3, "#e9e1cc", PAPER.x, PAPER.y, PAPER.z);
    built.paperTile = place(createNode({ geometry: M.box({ w: 0.1, h: 0.7, d: 1.4, color: "#ffffff", emissive: 1 }), position: { x: PAPER.x + 0.1, y: PAPER.y, z: PAPER.z }, visible: false }));
  };
  const buildDesk = () => {
    const honest = G.chain(false), tampered = G.chain(true), plain = TILE_COLORS(honest), changed = TILE_COLORS(tampered);
    built.codes = { honest, tampered };
    solid(2.6, 0.12, 1.3, "#7a5534", DESK.x, DESK.y + 0.6, DESK.z);
    for (const [dx, dz] of [[-1.15, -0.55], [1.15, -0.55], [-1.15, 0.55], [1.15, 0.55]]) solid(0.12, 0.6, 0.12, "#4c331d", DESK.x + dz, DESK.y + 0.3, DESK.z + dx);
    // The fingerprint machine: a body, a glowing window and a plunger that drops on every stamp.
    solid(0.8, 0.8, 0.8, "#55606b", DESK.x - 0.2, DESK.y + 1.06, DESK.z + 0.6);
    solid(0.05, 0.3, 0.5, "#7fe0ff", DESK.x + 0.21, DESK.y + 1.15, DESK.z + 0.6, 1.2);
    built.plunger = place(createNode({ geometry: M.box({ w: 0.3, h: 0.5, d: 0.3, color: "#c9a64a" }), position: { x: DESK.x - 0.2, y: DESK.y + 1.7, z: DESK.z + 0.6 } }));
    built.page = place(createNode({ geometry: M.box({ w: 0.5, h: 0.02, d: 0.7, color: "#f5f0e2" }), position: { x: DESK.x, y: DESK.y + 0.67, z: DESK.z - 0.8 } }));
    built.pageInk = createNode({ geometry: M.box({ w: 0.36, h: 0.01, d: 0.04, color: "#3a3a3a" }), position: { x: 0, y: 0.015, z: 0 } });
    addChild(built.page, built.pageInk);
    built.redPage = createNode({ geometry: M.box({ w: 0.5, h: 0.025, d: 0.7, color: "#ff5a4a", emissive: 0.6 }), visible: false });
    addChild(built.page, built.redPage);
    // The chain on the wall: one tile per stamp in both versions, and links between them in gold or broken red.
    solid(0.15, 2.4, 9.6, "#2f2a25", CHAIN.x - 0.12, CHAIN.y, CHAIN.z0 - 3.5);
    built.tiles = []; built.links = [];
    for (let i = 0; i < G.PAGES.length; i++) {
      const z = CHAIN.z0 - i * CHAIN.step;
      const a = place(createNode({ geometry: M.box({ w: 0.12, h: 0.75, d: 0.95, color: plain[i], emissive: 0.8 }), position: { x: CHAIN.x, y: CHAIN.y, z }, visible: false }));
      const b = place(createNode({ geometry: M.box({ w: 0.12, h: 0.75, d: 0.95, color: changed[i], emissive: 0.8 }), position: { x: CHAIN.x, y: CHAIN.y, z }, visible: false }));
      built.tiles.push({ honest: a, tampered: b, z });
      if (i === 0) continue;
      const lz = z + CHAIN.step / 2;
      const ok = place(createNode({ geometry: M.box({ w: 0.08, h: 0.12, d: CHAIN.step - 0.95, color: "#e8c35a", emissive: 0.7 }), position: { x: CHAIN.x, y: CHAIN.y, z: lz }, visible: false }));
      const bad = place(createNode({ geometry: M.box({ w: 0.08, h: 0.12, d: (CHAIN.step - 0.95) * 0.35, color: "#ff3b30", emissive: 1.2 }), position: { x: CHAIN.x, y: CHAIN.y - 0.18, z: lz }, visible: false }));
      built.links.push({ ok, bad });
    }
    built.flyer = place(createNode({ geometry: M.box({ w: 0.12, h: 0.45, d: 0.6, color: "#ffffff", emissive: 1 }), visible: false }));
    // Tock, the invented archivist, stands behind the desk facing the water.
    built.guide = M.caveman(BL.contributors.traitsFor("Tock the Archivist"));
    if (built.guide.parts.club) built.guide.parts.club.visible = false;
    built.guide.root.position.x = DESK.x - 1.35; built.guide.root.position.y = DESK.y; built.guide.root.position.z = DESK.z - 0.55;
    built.guide.root.rotation.y = Math.PI / 2;
    built.guide.root.scale.x = built.guide.root.scale.y = built.guide.root.scale.z = 1.35;
    place(built.guide.root);
    // A lectern by the water: tap it (or press I) for the panel.
    built.lectern = place(createNode({ geometry: M.bevelBox({ w: 0.7, h: 1.1, d: 0.5, color: "#7a5534" }), position: { x: -4.3, y: 1.1, z: -22.6 } }));
    built.lecternLight = place(createNode({ geometry: M.box({ w: 0.5, h: 0.06, d: 0.35, color: "#ffe9a8", emissive: 1.3 }), position: { x: -4.3, y: 1.68, z: -22.6 } }));
  };
  // The data current: the boat is carried on a stream of messages, not water. A lit channel follows the course and
  // a fixed pool of glowing packets flows along it; `flowCurrent` moves them in place each frame.
  const PACKETS = 84, PACKET_SPEED = 2.6;
  const buildCurrent = () => {
    const strips = [], step = 0.9, probe = { x: 0, z: 0, heading: 0 };
    for (let d = 0; d < course.length; d += step) {
      course.sample(d, probe);
      strips.push(M.moved(M.turnedY(M.box({ w: 2.6, h: 0.04, d: step + 0.05, color: "#123a4a", emissive: 0.35 }), probe.heading), probe.x, -0.01, probe.z));
      for (const side of [-1, 1]) strips.push(M.moved(M.turnedY(M.box({ w: 0.08, h: 0.05, d: step + 0.05, color: "#3fd6ff", emissive: 1.1, offset: { x: side * 1.32 } }), probe.heading), probe.x, 0, probe.z));
    }
    place(createNode({ geometry: M.merge(...strips) }));
    const kinds = [M.box({ w: 0.16, h: 0.05, d: 0.42, color: "#5fe3ff", emissive: 1.4 }), M.box({ w: 0.16, h: 0.05, d: 0.3, color: "#ffd25f", emissive: 1.4 }), M.box({ w: 0.12, h: 0.05, d: 0.24, color: "#c98bff", emissive: 1.4 })];
    built.packets = [];
    for (let i = 0; i < PACKETS; i++) {
      const lane = ((i * 7) % 9) / 8 * 1.9 - 0.95;
      built.packets.push({ node: place(createNode({ geometry: kinds[i % 3] })), d: i * course.length / PACKETS, lane });
    }
  };
  const packetAt = { x: 0, z: 0, heading: 0 };
  const flowCurrent = (dt) => {
    const speed = ride.paused || view.reading ? 0 : view.calm ? PACKET_SPEED * 0.35 : PACKET_SPEED;
    for (let i = 0; i < built.packets.length; i++) {
      const p = built.packets[i];
      p.d += speed * dt;
      if (p.d >= course.length) p.d -= course.length;
      course.sample(p.d, packetAt);
      const n = p.node.position;
      n.x = packetAt.x + Math.cos(packetAt.heading) * p.lane; n.z = packetAt.z - Math.sin(packetAt.heading) * p.lane; n.y = 0.03;
      p.node.rotation.y = packetAt.heading;
    }
  };
  // The timeline wall in the harbour: one plaque per room of the voyage, oldest ideas first. A plaque for a built
  // room sails the boat straight there; the others say they are still being built.
  const buildTimeline = () => {
    const label = BL.factoryModels.label;
    solid(0.2, 2.6, 14.4, "#2f2a25", -11.9, 2.6, 0.2);
    const head = label("THE VOYAGE", "tap a room to sail there", { height: 0.8, style: "plain" });
    const hn = place(createNode({ position: { x: -11.72, y: 4.35, z: 0.2 }, rotation: { x: 0, y: Math.PI / 2, z: 0 } }));
    addChild(hn, createNode({ geometry: head.back }), createNode({ geometry: head.face }));
    built.plaques = [];
    G.ROOMS.forEach((room, i) => {
      const sign = label(`${i + 1}. ${room.title.toUpperCase()}`, room.built ? "open now · sail there" : room.optional ? "optional · being built" : "being built", { height: 0.5, style: room.built ? "gold" : "plain" });
      const node = place(createNode({ position: { x: -11.72, y: 3.5 - (i % 4) * 0.62, z: i < 4 ? 3.6 : -3.2 }, rotation: { x: 0, y: Math.PI / 2, z: 0 } }));
      const face = createNode({ geometry: sign.face });
      addChild(node, createNode({ geometry: sign.back }), face);
      built.plaques.push({ node, face, room, station: STATIONS.findIndex((s) => s.exhibit === room.id) });
    });
  };
  const jumpTo = (plaque) => {
    if (plaque.station < 0) { captionKey = ""; setCaption("unbuilt"); return; }
    audio.wake();
    ride.jump(plaque.station);
    setCaption("sailing");
    showControls();
  };
  const buildBoat = () => {
    const node = place(createNode());
    addChild(node, createNode({ geometry: M.bevelBox({ w: 1.7, h: 0.55, d: 3.4, color: "#7b4f2c" }), position: { x: 0, y: 0.2, z: 0 } }));
    addChild(node, createNode({ geometry: M.box({ w: 1.4, h: 0.12, d: 3, color: "#3b2717" }), position: { x: 0, y: 0.42, z: 0 } }));
    for (const z of [-0.8, 0.6]) addChild(node, createNode({ geometry: M.box({ w: 1.5, h: 0.1, d: 0.4, color: "#a77a4a" }), position: { x: 0, y: 0.62, z } }));
    addChild(node, createNode({ geometry: M.box({ w: 0.08, h: 1.3, d: 0.08, color: "#3b2717" }), position: { x: 0, y: 1.1, z: 1.55 } }));
    addChild(node, createNode({ geometry: M.box({ w: 0.26, h: 0.26, d: 0.26, color: "#ffd27a", emissive: 1.5 }), position: { x: 0, y: 1.8, z: 1.55 } }));
    built.boat = node;
  };

  // --- Panel ----------------------------------------------------------------------------------------------------
  const W = 960, H = 540;
  const wrap = (g, text, width) => {
    const words = text.split(" "), lines = [];
    let line = "";
    for (const w of words) {
      const next = line ? line + " " + w : w;
      if (g.measureText(next).width > width && line) { lines.push(line); line = w; } else line = next;
    }
    if (line) lines.push(line);
    return lines;
  };
  const paintPage = (canvas, page) => {
    const g = canvas.getContext("2d");
    g.fillStyle = "#16130f"; g.fillRect(0, 0, W, H);
    g.strokeStyle = "rgba(236,226,206,0.35)"; g.lineWidth = 3; g.strokeRect(10, 10, W - 20, H - 20);
    g.fillStyle = "#fbe3a4"; g.font = "bold 40px system-ui, sans-serif"; g.textBaseline = "top";
    g.fillText(page.title, 44, 38);
    g.fillStyle = "#efe8da"; g.font = "25px system-ui, sans-serif";
    let y = 104;
    for (const para of page.text) {
      for (const line of wrap(g, para, W - 88)) { g.fillText(line, 44, y); y += 33; }
      y += 14;
    }
  };
  const makeBoard = () => {
    const ex = G.FINGERPRINTS, canvas = document.createElement("canvas");
    canvas.width = W; canvas.height = H;
    const b = {
      title: ex.room, help: "Arrows page · Escape closes and the ride carries on", canvas, count: ex.pages.length, index: 0,
      caption: ex.pages[0].caption, note: ex.pages[0].text.join(" "), version: 0, wide: true,
      links: ex.sources.map((k) => ({ href: G.SOURCES[k].href, label: `${G.SOURCES[k].label} ↗` })),
      go(i) {
        b.index = i; b.caption = ex.pages[i].caption; b.note = ex.pages[i].text.join(" ");
        paintPage(canvas, ex.pages[i]); b.version++;
      }
    };
    paintPage(canvas, ex.pages[0]);
    return b;
  };
  const openInfo = () => {
    if (!hud || view.reading) return;
    view.readingPaused = !ride.paused;
    ride.pause(true);
    view.reading = true;
    stopVoice();
    board.go(0);
    hud.openBoard(board);
    showControls();
  };

  // --- Sound and voice --------------------------------------------------------------------------------------------
  // Short synthesized cues through the page's environment mute (M), made only after a gesture and closed on leave.
  const createAudio = () => {
    let context = null, out = null;
    const wake = () => {
      if (context || typeof AudioContext === "undefined") return;
      context = new AudioContext(); out = BL.sound.output(context);
    };
    const tone = (freq, length, type, gain, slide = 0) => {
      if (!context || context.state !== "running" || BL.sound.muted) return;
      const t = context.currentTime, o = context.createOscillator(), g = context.createGain();
      o.type = type; o.frequency.setValueAtTime(freq, t);
      if (slide) o.frequency.exponentialRampToValueAtTime(freq * slide, t + length);
      g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(0.0001, t + length);
      o.connect(g); g.connect(out); o.start(t); o.stop(t + length + 0.02);
    };
    return {
      wake,
      stamp: () => { tone(140, 0.18, "square", 0.08, 0.5); tone(70, 0.25, "sine", 0.14, 0.7); },
      link: () => tone(880, 0.35, "triangle", 0.05, 1.5),
      broken: () => { tone(220, 0.6, "sawtooth", 0.04, 0.6); tone(233, 0.6, "sawtooth", 0.04, 0.6); },
      dispose: () => { if (context) context.close().catch(() => {}); context = out = null; }
    };
  };
  const speech = typeof window.speechSynthesis !== "undefined" ? window.speechSynthesis : null;
  const stopVoice = () => { if (speech) speech.cancel(); };
  const say = (text) => {
    if (!view.voice || !speech || !text) return;
    speech.cancel();
    speech.speak(new SpeechSynthesisUtterance(text));
  };

  // --- HUD ------------------------------------------------------------------------------------------------------
  const setCaption = (key) => {
    if (key === captionKey) return;
    captionKey = key;
    const text = G.CAPTIONS[key] || "";
    el.caption.textContent = text;
    el.caption.hidden = !view.captions || !text;
    say(text);
  };
  const press = (button, on) => button && button.setAttribute("aria-pressed", String(!!on));
  const showControls = () => {
    el.sail.textContent = ride.state === "boarding" ? "Sail" : ride.state === "docked" ? "Ride again" : ride.paused ? "Carry on" : "Pause";
    press(el.sail, ride.paused);
    el.skip.disabled = ride.state === "boarding" || ride.state === "docked";
    press(el.cc, view.captions); press(el.voice, view.voice); press(el.view, view.fixed); press(el.calm, view.calm);
    el.voice.hidden = !speech;
    el.caption.hidden = !view.captions || !el.caption.textContent;
  };
  const paintChain = () => {
    const codes = demo.broken ? built.codes.tampered : built.codes.honest;
    const items = el.chain.children;
    for (let i = 0; i < items.length; i++) {
      const shown = i < demo.tiles, bad = demo.broken && i >= G.TAMPER_AT;
      items[i].hidden = !shown;
      items[i].textContent = shown ? codes[i] : "";
      items[i].classList.toggle("broken", shown && bad);
    }
    el.chainWrap.hidden = demo.tiles === 0 || !view.captions;
  };
  const sail = () => {
    audio.wake();
    if (ride.start()) { setCaption(ride.legs ? "sailing" : "current"); showControls(); return; }
    ride.pause();
    showControls();
    if (ride.paused) { stopVoice(); setCaption("paused"); } else captionKey = "";
  };
  const skip = () => { if (ride.skip()) showControls(); };
  const toggle = (key) => {
    view[key] = !view[key];
    if (key === "voice" && !view.voice) stopVoice();
    if (key === "captions") paintChain();
    showControls();
  };
  const leave = () => go("hub");

  const onKey = (e) => {
    if (view.reading || e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (k === "Escape") leave();
    else if (k === "Enter" || k === " " || k === "p") { e.preventDefault(); sail(); }
    else if (k === "n") skip();
    else if (k === "i") openInfo();
    else if (k === "c") toggle("captions");
    else if (k === "t") toggle("voice");
    else if (k === "v") toggle("fixed");
    else if (k === "r") toggle("calm");
    else if (k === "0") view.yaw = view.pitch = 0;
  };

  // --- Frame ----------------------------------------------------------------------------------------------------
  const stepDemo = (dt) => {
    if (!ride.paused && !view.reading) demo.update(dt);
    if (demo.stamps !== lastStamps) { lastStamps = demo.stamps; audio.stamp(); }
    if (demo.tiles !== lastTiles || demo.broken !== lastBroken) {
      if (demo.tiles > lastTiles && demo.tiles > 0) audio.link();
      if (demo.broken && !lastBroken) audio.broken();
      lastTiles = demo.tiles; lastBroken = demo.broken;
      for (let i = 0; i < built.tiles.length; i++) {
        const shown = i < demo.tiles, bad = demo.broken && i >= G.TAMPER_AT;
        built.tiles[i].honest.visible = shown && !bad;
        built.tiles[i].tampered.visible = shown && bad;
        if (i > 0) { built.links[i - 1].ok.visible = shown && !(demo.broken && i > G.TAMPER_AT); built.links[i - 1].bad.visible = shown && demo.broken && i > G.TAMPER_AT; }
      }
      paintChain();
    }
    const p = demo.phase, t = demo.t, calm = view.calm;
    // The page slides to the machine, waits under the plunger and leaves as its fingerprint flies to the wall.
    const page = built.page.position;
    page.z = DESK.z - 0.8 + (p === "feed" ? (calm ? 1 : Math.min(1, t * 1.4)) * 1.4 : p === "stamp" ? 1.4 : -9);
    built.page.visible = p === "feed" || p === "stamp" || p === "tamper";
    if (p === "tamper") page.z = DESK.z - 0.2;
    built.redPage.visible = p === "tamper";
    built.plunger.position.y = DESK.y + 1.7 - (p === "stamp" ? Math.sin(Math.min(1, t * 1.6) * Math.PI) * 0.42 : 0);
    built.paperTile.visible = p === "publish" || p === "tamper" || p === "restore";
    const fly = p === "link" && !calm;
    built.flyer.visible = fly;
    if (fly) {
      const target = built.tiles[demo.page];
      const sx = DESK.x - 0.2, sy = DESK.y + 1.15, sz = DESK.z + 0.6, e = t * t * (3 - 2 * t);
      built.flyer.position.x = sx + (CHAIN.x + 0.1 - sx) * e;
      built.flyer.position.y = sy + (CHAIN.y - sy) * e + Math.sin(e * Math.PI) * 0.9;
      built.flyer.position.z = sz + (target.z - sz) * e;
    }
    const arm = built.guide.parts.armR;
    if (arm) arm.rotation.x = p === "stamp" ? -1.2 + Math.sin(Math.min(1, t * 1.6) * Math.PI) * 0.6 : p === "tamper" ? -0.4 : -0.15;
    if (ride.state === "station" && !ride.paused && p !== lastPhase) setCaption(p);
    lastPhase = p;
  };
  const updateCamera = (dt) => {
    const bob = view.calm || ride.paused ? 0 : Math.sin(sceneTime * 1.7) * 0.05;
    built.boat.position.x = boat.x; built.boat.position.z = boat.z; built.boat.position.y = bob;
    built.boat.rotation.y = boat.heading;
    built.boat.rotation.z = view.calm ? 0 : Math.sin(sceneTime * 1.1) * 0.025;
    const c = camera.position, target = camera.target;
    if (view.fixed) {
      const v = boat.z > ROOM_Z ? FIXED_VIEWS.harbour : FIXED_VIEWS.room;
      c.x = v.eye.x; c.y = v.eye.y; c.z = v.eye.z;
      target.x = v.look.x; target.y = v.look.y; target.z = v.look.z;
      return;
    }
    // At a stop the view turns toward the exhibit; otherwise it looks along the boat's way. Calm cuts instead of easing.
    const stop = ride.state === "station" || ride.paused && ride.station >= 0 && ride.state !== "sailing" ? ride.stops[ride.station] : null;
    const want = stop ? 1 : 0;
    view.look = view.calm ? want : view.look + (want - view.look) * Math.min(1, dt * 1.6);
    eye.x = boat.x - Math.sin(boat.heading) * 1.1; eye.z = boat.z - Math.cos(boat.heading) * 1.1; eye.y = 1.75 + bob;
    let yaw = boat.heading;
    if (ride.station >= 0) {
      const look = ride.stops[ride.station].look;
      let toward = Math.atan2(look.x - eye.x, look.z - eye.z) - yaw;
      toward = Math.atan2(Math.sin(toward), Math.cos(toward));
      yaw += toward * view.look;
    }
    yaw += view.yaw;
    const pitch = view.pitch - 0.08 * (1 - view.look) - 0.04 * view.look;
    c.x = eye.x; c.y = eye.y; c.z = eye.z;
    target.x = eye.x + Math.sin(yaw) * Math.cos(pitch) * 6;
    target.y = eye.y + Math.sin(pitch) * 6;
    target.z = eye.z + Math.cos(yaw) * Math.cos(pitch) * 6;
  };
  const update = (dt) => {
    sceneTime += dt;
    // The panel's dialog closing (its button, Escape or a press outside) hands the ride back as it was.
    if (view.reading && !hud.el.board.open) {
      view.reading = false;
      if (view.readingPaused) ride.pause(false);
      captionKey = "";
      showControls();
    }
    const before = ride.state;
    if (!view.reading) ride.update(dt);
    course.sample(ride.d, boat);
    if (captionKey === "current" && boat.z < ROOM_Z) setCaption("sailing");
    if (ride.state !== before) {
      if (ride.state === "station") { demo.reset(); lastPhase = ""; lastTiles = -1; setCaption("arrive"); }
      else if (before === "station") setCaption("leaving");
      else if (ride.state === "docked") setCaption("docked");
      showControls();
    }
    stepDemo(dt);
    flowCurrent(dt);
    built.portal.glow = 1 + Math.sin(sceneTime * 1.3) * (view.calm ? 0 : 0.25);
    updateCamera(dt);
    hud.updateBoard(sceneTime);
  };
  const overlay = () => {
    // Nothing is drawn over the world here; the canvas is cleared once so the last scene's overlay does not linger.
    if (overlayClean) return;
    overlayClean = true;
    const g = overlayCanvas.getContext("2d");
    g.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
    hud.tooltip.beginFrame();
  };

  // --- Visit ----------------------------------------------------------------------------------------------------
  const tooltipFor = (hit) => hit && hit.owner.kind === "plaque" ? (hit.owner.plaque.station >= 0 ? `${hit.owner.plaque.room.title} · tap to sail there` : `${hit.owner.plaque.room.title} · being built`) : hit && hit.owner.kind === "exhibit" ? "Fingerprints and Time · tap to read" : hit && hit.owner.kind === "guide" ? "Tock, the archivist Ooga (an invented guide)" : "";
  const enter = (ctx) => {
    ({ game, world, go } = ctx);
    overlayCanvas = ctx.overlay;
    BL.hud.leaveTo("genesis", "hub");
    root = createNode();
    camera = createCamera({ fov: 62, near: 0.15, far: 120 });
    built = {};
    course = G.createCourse(COURSE);
    buildCavern(); buildCurrent(); buildTimeline(); buildDesk(); buildBoat();
    ride = G.createRide({ course, stations: STATIONS, speed: 1.7 });
    demo = G.createStampDemo();
    board = makeBoard();
    audio = createAudio();
    view.yaw = view.pitch = view.look = 0; view.reading = view.readingPaused = false; view.fixed = false;
    view.calm = PREFERS_CALM.matches;
    sceneTime = 0; captionKey = ""; lastStamps = 0; lastPhase = ""; lastTiles = -1; lastBroken = false; overlayClean = false;
    renderOpts.lightCount = LIGHTS.length;
    for (let i = 0; i < LIGHTS.length; i++) { const l = LIGHTS[i], o = i * 8; for (let k = 0; k < 7; k++) renderOpts.lights[o + k] = l[k]; renderOpts.lights[o + 7] = 0; }
    hud = BL.hud.create({ signal: ctx.signal, roster: BL.contributors.activeRoster, catalog: M.SWAG, tierColors: M.TIER_COLORS, renderIcon: BL.hud.renderIcon, lootEnabled: false });
    const hooks = {};
    input = BL.interact.create({ canvas: ctx.canvas, renderer: ctx.renderer, camera, hooks });
    const target = (node, owner) => { input.add(node, owner); targets.push(node); };
    target(built.lectern, { kind: "exhibit", priority: 1 });
    target(built.lecternLight, { kind: "exhibit", priority: 1 });
    target(built.guide.parts.torso, { kind: "guide" });
    target(built.guide.parts.head, { kind: "guide" });
    for (const plaque of built.plaques) target(plaque.face, { kind: "plaque", plaque });
    Object.assign(hooks, {
      onHover: (hit, p) => { const t = tooltipFor(hit); if (t) hud.tooltip.show(t, p.x, p.y); else hud.tooltip.hide(); },
      onHoverMove: (hit, p) => { const t = tooltipFor(hit); if (t) hud.tooltip.show(t, p.x, p.y); else hud.tooltip.hide(); },
      onTap: (hit) => {
        audio.wake();
        if (hit && hit.owner.kind === "exhibit") openInfo();
        else if (hit && hit.owner.kind === "plaque") jumpTo(hit.owner.plaque);
      },
      onOrbit: (dx, dy) => {
        if (view.fixed || view.reading) return;
        view.yaw = clamp(view.yaw - dx * 4e-3, -2.6, 2.6);
        view.pitch = clamp(view.pitch + dy * 3e-3, -0.7, 0.6);
      },
      onZoom: () => {}
    });
    hud.onAction((action) => {
      audio.wake();
      if (action === "genesis-sail") sail();
      else if (action === "genesis-skip") skip();
      else if (action === "genesis-info") openInfo();
      else if (action === "genesis-cc") toggle("captions");
      else if (action === "genesis-voice") toggle("voice");
      else if (action === "genesis-view") toggle("fixed");
      else if (action === "genesis-calm") toggle("calm");
      else if (action === "leave") leave();
    });
    for (const id of ["caption", "sail", "skip", "info", "cc", "voice", "view", "calm", "chain", "chainWrap"]) el[id] = document.getElementById(`genesis-${id === "chainWrap" ? "chain-wrap" : id}`);
    el.chain.replaceChildren(...G.PAGES.map(() => { const li = document.createElement("li"); li.hidden = true; return li; }));
    el.help = document.getElementById("genesis-help");
    el.help.textContent = COARSE ? "Drag to look · tap the lectern to read" : "Enter sail · Space pause · N skip · I info · C captions · T voice · V view · R calm · drag to look · Esc leave";
    window.addEventListener("pointerdown", audio.wake, { signal: ctx.signal });
    window.addEventListener("keydown", audio.wake, { signal: ctx.signal });
    course.sample(0, boat);
    setCaption("boarding");
    paintChain();
    showControls();
    hud.setStats(game.state);
    Object.assign(scene, { root, camera, input, debug: { get ride() { return ride; }, get demo() { return demo; }, view, built, board, sail, skip, openInfo, toggle, jumpTo } });
  };
  const onDonation = (donation, counted = null) => {
    game.recordDonation(donation, counted && counted.exact);
    const bananas = BL.game.bananasFor(donation.sats), shown = counted ? counted.rounded : bananas;
    world.level = Math.min(BL.pile.MAX_BANANAS, world.level + (counted ? counted.exact : bananas));
    hud.toast(`+${BL.game.formatLarge(donation.sats)} sats · ${BL.game.formatLarge(shown)} banana${shown === 1 ? "" : "s"} · ${donation.handle ? "@" + donation.handle : "anon"}`);
    hud.setStats(game.state);
  };
  const leaveScene = () => {
    stopVoice();
    if (view.reading) hud.closeBoard();
    audio.dispose();
    for (const node of targets) input.remove(node);
    targets.length = 0;
    const count = input.targetCount;
    input.dispose();
    hud.tooltip.hide();
    hud.dispose();
    while (root.children.length) removeChild(root, root.children[0]);
    el.caption.textContent = ""; el.chain.replaceChildren();
    for (const key of Object.keys(el)) el[key] = null;
    view.reading = false;
    ride = course = demo = board = audio = built = input = hud = game = world = go = overlayCanvas = null;
    scene.input = scene.debug = null;
    return { targets: count };
  };
  const stats = () => {
    let nodes = 0;
    const all = (n) => { nodes++; for (const c of n.children) all(c); };
    all(root);
    return { allNodes: nodes, targets: input.targetCount, ride: ride.state, station: ride.station, demo: demo.phase, paused: ride.paused, reading: view.reading };
  };
  const scene = BL.deferred.scene("genesis", {
    id: "genesis", wip: true, renderOpts, root: null, camera: null, input: null, debug: null,
    enter, update, overlay, onDonation, onKey, onLootCleared: () => {}, leave: leaveScene, stats,
    liveGeometry: (set) => { if (built && built.guide) set.add(built.guide.headOpen).add(built.guide.headClosed); },
    get inMotion() { return !!ride && !ride.paused && !view.reading && ride.state !== "boarding" && ride.state !== "docked"; }
  });
})();
