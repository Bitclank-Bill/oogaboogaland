// Genesis museum: "After Genesis", the mining corner in the atrium: the story's epilogue. A rack of original,
// unbranded miners (fans turning, lights blinking), a toy miner that runs itself (it tries numbers until a toy
// fingerprint starts with enough zeros, the idea of proof of work) and a board on how mining grew after January 2009.
// The toy's fingerprint is FNV-1a, not SHA-256, and says so. Nodes are built once; update allocates nothing.
(() => {
  "use strict";
  const BL = window.BL = window.BL || {};
  const fnv = (text, nonce) => {
    let h = 0x811c9dc5;
    for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
    for (let k = 0; k < 4; k++) { h ^= (nonce >>> (k * 8)) & 255; h = Math.imul(h, 0x01000193) >>> 0; }
    return h >>> 0;
  };
  const hex = (h) => (h >>> 0).toString(16).padStart(8, "0");
  // The toy miner as a terminal ({ banner, prompt, run }): TARGET sets how many leading zeros the fingerprint needs,
  // MINE searches from the last nonce, BLOCK shows the toy block, RESET starts again.
  const terminal = () => {
    const st = { zeros: 2, nonce: 0, height: 1, prev: "00000000", found: 0 };
    const block = () => `block ${st.height} | previous ${st.prev} | "pay Ooga 1 banana"`;
    const run = (line) => {
      const [cmd, arg] = String(line).trim().toUpperCase().split(/\s+/);
      if (cmd === "HELP") return { lines: ["TARGET 1..4   how many zeros the fingerprint must start with", "MINE          try numbers until one fits", "BLOCK         show the block being mined", "RESET         start again"] };
      if (cmd === "RESET") { st.zeros = 2; st.nonce = 0; st.height = 1; st.prev = "00000000"; st.found = 0; return { lines: ["Reset: block 1, target 2 zeros."] }; }
      if (cmd === "BLOCK") return { lines: [block(), `Its fingerprint must start with ${st.zeros} zero${st.zeros > 1 ? "s" : ""}.`] };
      if (cmd === "TARGET") {
        const z = Math.max(1, Math.min(4, parseInt(arg, 10) || 2));
        st.zeros = z;
        return { lines: [`Target: ${z} leading zero${z > 1 ? "s" : ""}. Each extra zero means about 16 times more tries.`] };
      }
      if (cmd === "MINE") {
        const text = block(), need = "0".repeat(st.zeros), from = st.nonce;
        for (let tries = 1; tries <= 2000000; tries++) {
          const h = hex(fnv(text, st.nonce));
          if (h.startsWith(need)) {
            const n = st.nonce;
            st.prev = h; st.height++; st.nonce = 0; st.found++;
            return { lines: [`Found it after ${(n - from + 1).toLocaleString()} tries: number ${n} gives ${h}.`, `Anyone can check it with one try. Block ${st.height - 1} joins the chain; the next block names ${h}.`] };
          }
          st.nonce++;
        }
        return { lines: ["No luck in two million tries; MINE again carries on."] };
      }
      return { lines: ["Unknown command. Type HELP."] };
    };
    return {
      banner: ["A toy miner: it tries numbers until the block's fingerprint starts with enough zeros.", "Its fingerprint is a toy (FNV-1a); real Bitcoin mining uses SHA-256, twice."],
      prompt: "MINER>", run
    };
  };
  // The board's pages: plain facts, each page short.
  const PAGES = [
    { caption: "After Genesis", title: "Mining in one line", text: ["Miners gather waiting transactions into a block, then search for a number (the nonce) that makes the block's fingerprint, its SHA-256 hash taken twice, fall below a target.", "Finding that number takes an enormous number of tries. Checking it takes one. That is proof of work, section 4 of the 2008 paper."] },
    { caption: "After Genesis", title: "Ten minutes, on purpose", text: ["Every 2016 blocks, about two weeks, the target adjusts so that a block takes about ten minutes on average however many miners there are.", "More miners make the search harder, fewer make it easier: the pace stays steady."] },
    { caption: "After Genesis", title: "The reward halves", text: ["The first blocks paid 50 bitcoin to whoever found them. The reward halves every 210,000 blocks, about every four years, so new bitcoin slows toward a fixed total of 21 million.", "Miners are also paid the fees of the transactions they include."] },
    { caption: "After Genesis", title: "From CPU to ASIC", text: ["2009: ordinary computers' processors (CPUs) did the work, as on this museum's first-block desk.", "Around 2010: graphics cards (GPUs) took over, many times faster.", "Around 2011: programmable chips (FPGAs) cut the power each try cost.", "From 2013: ASICs, chips built only to compute SHA-256, made every earlier machine uncompetitive. The rack here is an original, unbranded illustration of them."] },
    { caption: "After Genesis", title: "Why the work matters", text: ["To rewrite a past block an attacker must redo its work and all the work after it, faster than everyone else adds new blocks.", "The energy spent is what makes the chain's history expensive to change."] }
  ];
  // The rack (in its own frame, facing +z): a steel frame with three shelves of four miners, each with two fan rings
  // and a light; the fans and lights are nodes so update can turn and blink them.
  const build = ({ M, createNode, addChild, place, top, at }) => {
    const root = place(createNode({ position: { x: at.x, y: top, z: at.z }, rotation: { x: 0, y: at.ry || 0, z: 0 } }));
    const parts = [M.box({ w: 3.2, h: 0.08, d: 1.0, color: "#3a3d42", offset: { x: 0, y: 0.04, z: 0 } })];
    for (const x of [-1.55, 1.55]) for (const z of [-0.45, 0.45]) parts.push(M.box({ w: 0.08, h: 2.3, d: 0.08, color: "#5a5f66", offset: { x, y: 1.15, z } }));
    const fans = [], lights = [], blade = M.merge(M.box({ w: 0.2, h: 0.03, d: 0.02, color: "#1b1d22" }), M.box({ w: 0.03, h: 0.2, d: 0.02, color: "#1b1d22" }));
    const led = M.box({ w: 0.04, h: 0.04, d: 0.02, color: "#5cff7a", emissive: 1.6 });
    for (let r = 0; r < 3; r++) {
      const y = 0.35 + r * 0.7;
      parts.push(M.box({ w: 3.1, h: 0.04, d: 0.95, color: "#4a4f57", offset: { x: 0, y: y - 0.16, z: 0 } }));
      for (let c = 0; c < 4; c++) {
        const x = -1.12 + c * 0.75;
        parts.push(M.box({ w: 0.62, h: 0.28, d: 0.8, color: c % 2 ? "#8e98a6" : "#7c8796", offset: { x, y, z: 0 } }));
        for (const fx of [-0.15, 0.15]) {
          parts.push(M.moved(M.turnedX(M.lathe({ profile: [[0.1, 0], [0.12, 0], [0.12, 0.02], [0.1, 0.02]], segments: 12, color: "#2b2e33" }), Math.PI / 2), x + fx, y, 0.41));
          const f = createNode({ geometry: blade, position: { x: x + fx, y, z: 0.42 } });
          addChild(root, f); fans.push(f);
        }
        const l = createNode({ geometry: led, position: { x: x + 0.25, y: y + 0.09, z: 0.41 } });
        addChild(root, l); lights.push(l);
      }
    }
    // A cable tray along the top and a power strip.
    parts.push(M.box({ w: 3.0, h: 0.1, d: 0.3, color: "#2b2e33", offset: { x: 0, y: 2.3, z: -0.2 } }), M.box({ w: 2.6, h: 0.06, d: 0.1, color: "#e0452b", emissive: 0.4, offset: { x: 0, y: 0.12, z: 0.42 } }));
    addChild(root, createNode({ geometry: M.merge(...parts) }));
    // "Inside an ASIC": a screen on posts over the rack, a picture of what one chip does, repainted ten times a second
    // (a canvas-backed surface, its version bumped).
    const CW = 480, CH = 270, screen = document.createElement("canvas");
    screen.width = CW; screen.height = CH;
    const sw = 3.0, sh = sw * CH / CW;
    const face = { verts: [-sw / 2, -sh / 2, 0.03, sw / 2, -sh / 2, 0.03, sw / 2, sh / 2, 0.03, -sw / 2, sh / 2, 0.03], faces: [{ i: [0, 1, 2, 3], color: [0, 0, 0], emissive: 0 }], lines: [], castShadow: false };
    face.imageSurface = { canvas: screen, version: 1, rect: [-sw / 2, -sh / 2, sw, sh] };
    const panel = createNode({ position: { x: 0, y: 3.85, z: 0.2 } });
    addChild(panel, createNode({ geometry: M.box({ w: sw + 0.2, h: sh + 0.2, d: 0.08, color: "#1b1d22" }) }), createNode({ geometry: face }));
    addChild(root, panel);
    addChild(root, createNode({ geometry: M.merge(M.box({ w: 0.08, h: 1.6, d: 0.08, color: "#5a5f66", offset: { x: -1.4, y: 3.1, z: 0.2 } }), M.box({ w: 0.08, h: 1.6, d: 0.08, color: "#5a5f66", offset: { x: 1.4, y: 3.1, z: 0.2 } })) }));
    const asic = { t: 0, tries: 0, nonce: 0, found: 0, flash: 0, paintIn: 0, hash: 0 };
    const HEX = "0123456789abcdef";
    const paintAsic = () => {
      const g = screen.getContext("2d");
      g.fillStyle = "#07110b"; g.fillRect(0, 0, CW, CH);
      g.fillStyle = "#7dff9e"; g.font = "bold 18px monospace"; g.textAlign = "left"; g.textBaseline = "top";
      g.fillText("INSIDE AN ASIC: ONE JOB, BILLIONS OF TIMES", 14, 10);
      // The block header going in, its nonce counting.
      g.font = "13px monospace"; g.fillStyle = "#cfe8d6";
      g.fillText("BLOCK HEADER", 14, 44);
      g.fillStyle = "#1c3a26"; g.fillRect(14, 62, 150, 70);
      g.fillStyle = "#9cff9c"; g.fillText("version  prev hash", 20, 68); g.fillText("merkle   time  bits", 20, 86);
      g.fillStyle = "#ffd23a"; g.fillText(`nonce ${asic.nonce >>> 0}`, 20, 108);
      // The two SHA-256 passes as a pipeline of rounds, a pulse running through them.
      const k = (asic.t * 3) % 1;
      for (let pass = 0; pass < 2; pass++) {
        const x0 = 190 + pass * 120;
        g.fillStyle = "#cfe8d6"; g.fillText(`SHA-256 #${pass + 1}`, x0, 44);
        for (let r = 0; r < 8; r++) { g.fillStyle = Math.floor(k * 8) === r ? "#7dff9e" : "#1c3a26"; g.fillRect(x0 + (r % 4) * 24, 64 + Math.floor(r / 4) * 26, 20, 20); }
        g.fillStyle = "#6a8f74"; g.fillText("64 rounds", x0, 120);
      }
      // The result against the target.
      const h = asic.hash >>> 0;
      let hs = ""; for (let i = 7; i >= 0; i--) hs += HEX[(h >>> (i * 4)) & 15];
      g.fillStyle = "#cfe8d6"; g.fillText("RESULT", 14, 150);
      g.font = "bold 20px monospace"; g.fillStyle = asic.flash > 0 ? "#ffd23a" : "#9cff9c"; g.fillText(`${hs}…`, 14, 168);
      g.font = "13px monospace"; g.fillStyle = "#cfe8d6"; g.fillText("TARGET  0000…  (must be smaller)", 14, 198);
      g.fillStyle = asic.flash > 0 ? "#ffd23a" : "#ff6a5a"; g.font = "bold 16px monospace";
      g.fillText(asic.flash > 0 ? "FOUND ONE!  The block can be sent out." : "too big: try the next nonce", 14, 222);
      // The cores, all doing the same at once, and the count.
      g.font = "13px monospace"; g.fillStyle = "#cfe8d6"; g.fillText("CORES", 330, 150);
      for (let c = 0; c < 24; c++) { g.fillStyle = ((c * 7 + Math.floor(asic.t * 20)) % 5) ? "#2f6b3e" : "#7dff9e"; g.fillRect(330 + (c % 8) * 17, 168 + Math.floor(c / 8) * 17, 13, 13); }
      g.fillStyle = "#9cff9c"; g.fillText(`tries shown: ${asic.tries.toLocaleString()}`, 330, 222);
      g.fillStyle = "#6a8f74"; g.fillText(`blocks found here: ${asic.found}`, 330, 240);
      g.fillText("A real chip makes trillions of tries a second.", 14, 248);
      face.imageSurface.version++;
    };
    paintAsic();
    const st = { t: 0 };
    const update = (dt, calm) => {
      st.t += dt;
      if (!calm) for (let i = 0; i < fans.length; i++) fans[i].rotation.z += dt * (14 + (i % 3) * 3);
      for (let i = 0; i < lights.length; i++) lights[i].glow = ((Math.floor(st.t * 5) + i * 7) % 11) < 2 ? 0.3 : 1.4;
      // The ASIC's screen: tries tick on, a fingerprint each, a find now and then (a toy pace, said on the screen).
      asic.t += dt; asic.flash = Math.max(0, asic.flash - dt);
      if (!calm || asic.paintIn <= 0) {
        const n = 37 + Math.floor(Math.random() * 20);
        asic.tries += n; asic.nonce += n; asic.hash = fnv("ooga block", asic.nonce);
        if (asic.flash <= 0 && Math.random() < dt * 0.12) { asic.flash = 2.2; asic.found++; asic.hash = asic.hash >>> 16; }
      }
      if ((asic.paintIn -= dt) <= 0) { asic.paintIn = 0.1; paintAsic(); }
    };
    return { root, update, footprint: { w: 3.4, d: 1.2 } };
  };
  BL.genesisMining = { terminal, PAGES, build, fnv };
})();
