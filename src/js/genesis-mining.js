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
    const st = { t: 0 };
    const update = (dt, calm) => {
      st.t += dt;
      if (!calm) for (let i = 0; i < fans.length; i++) fans[i].rotation.z += dt * (14 + (i % 3) * 3);
      for (let i = 0; i < lights.length; i++) lights[i].glow = ((Math.floor(st.t * 5) + i * 7) % 11) < 2 ? 0.3 : 1.4;
    };
    return { root, update, footprint: { w: 3.4, d: 1.2 } };
  };
  BL.genesisMining = { terminal, PAGES, build, fnv };
})();
