// Genesis museum: a mini node network on a table by the statue. Seven small node towers joined by cables: glowing
// dots carry transactions from neighbour to neighbour all the time, and now and then a new block appears at one node
// and spreads hop by hop, each node flashing gold as it checks the block and keeps it. A toy, said so on its board:
// real nodes check every rule of every block and transaction. Nodes are built once; update allocates nothing.
(() => {
  "use strict";
  const BL = window.BL = window.BL || {};
  // The towers' places on the table (metres in its frame, +z toward the visitor) and the cables between them.
  const SPOTS = [[0, 0], [-0.85, -0.45], [0.85, -0.45], [-0.9, 0.4], [0.9, 0.4], [-0.3, -0.62], [0.35, 0.6]];
  const LINKS = [[0, 1], [0, 2], [0, 3], [0, 4], [1, 5], [2, 5], [3, 6], [4, 6], [1, 3], [2, 4], [5, 0], [6, 0]];
  const PULSES = 16, DOT_SPEED = 1.2;
  const PAGES = [
    { caption: "Nodes", title: "What a node does", text: ["A node is a computer that keeps its own full copy of the chain and checks every block and every transaction against the rules, by itself.", "It passes what it has checked on to its neighbours, and refuses anything that breaks a rule, whoever sent it."] },
    { caption: "Nodes", title: "How a block spreads", text: ["When a miner finds a block it sends it to its neighbours. Each one checks it, keeps it and passes it on: in seconds it has crossed the network.", "If two blocks race, each node follows the chain with the most work behind it, so they all end up agreeing."] },
    { caption: "Nodes", title: "Anyone can run one", text: ["No one is in charge of the network. Anyone can run a node on an ordinary computer and check the whole history for themselves.", "This table is a toy: seven towers and glowing dots, where the real network has many thousands of nodes."] }
  ];
  // The network as a terminal for the "Now running" panel: SEND a transaction, MINE a block, STATUS.
  const terminal = (net) => ({
    banner: ["A toy network of seven nodes: dots are transactions passed from neighbour to neighbour.", "When a block is found, watch it spread: each node turns gold once it has checked the block."],
    prompt: "NODES>",
    run: (line) => {
      const cmd = String(line).trim().toUpperCase().split(/\s+/)[0];
      if (cmd === "HELP") return { lines: ["SEND     a transaction from a random node", "MINE     a block found at a random node", "STATUS   how many nodes hold the newest block", "RESET    start again"] };
      if (cmd === "SEND") { const k = net.send(); return { lines: [`Node ${k + 1} sends a transaction to its neighbours; each checks it and passes it on.`] }; }
      if (cmd === "MINE") { const k = net.mine(); return { lines: [`Node ${k + 1} found block ${net.height}. It goes out hop by hop; every node checks it before passing it on.`] }; }
      if (cmd === "STATUS") return { lines: [`${net.holding} of ${SPOTS.length} nodes hold block ${net.height}.`] };
      if (cmd === "RESET") { net.reset(); return { lines: ["Reset: every node holds block 1."] }; }
      return { lines: ["Unknown command. Type HELP."] };
    }
  });
  const build = ({ M, createNode, addChild, place, top, at }) => {
    const root = place(createNode({ position: { x: at.x, y: top, z: at.z }, rotation: { x: 0, y: at.ry || 0, z: 0 } }));
    const TY = 0.95, parts = [
      M.box({ w: 2.6, h: 0.08, d: 1.7, color: "#3b2a1a", offset: { x: 0, y: TY - 0.04, z: 0 } }),
      M.box({ w: 2.5, h: 0.01, d: 1.6, color: "#16241c", offset: { x: 0, y: TY + 0.005, z: 0 } }),
      ...[[-1.15, -0.7], [1.15, -0.7], [-1.15, 0.7], [1.15, 0.7]].map(([x, z]) => M.box({ w: 0.1, h: TY - 0.08, d: 0.1, color: "#2b1f14", offset: { x, y: (TY - 0.08) / 2, z } }))
    ];
    for (const [a, b] of LINKS) {
      const [ax, az] = SPOTS[a], [bx, bz] = SPOTS[b], len = Math.hypot(bx - ax, bz - az);
      parts.push(M.moved(M.turnedY(M.box({ w: 0.025, h: 0.015, d: len, color: "#2f6b3e" }), Math.atan2(bx - ax, bz - az)), (ax + bx) / 2, TY + 0.015, (az + bz) / 2));
    }
    addChild(root, createNode({ geometry: M.merge(...parts) }));
    // The towers: a small dark case with a light on top, the light's node its own so it can glow.
    const tower = M.merge(M.box({ w: 0.16, h: 0.26, d: 0.16, color: "#2b2e33" }), M.box({ w: 0.12, h: 0.02, d: 0.01, color: "#5cff7a", emissive: 1.2, offset: { x: 0, y: 0.05, z: 0.085 } }));
    const lamp = M.box({ w: 0.12, h: 0.04, d: 0.12, color: "#ffd23a", emissive: 1.6 }), dot = M.box({ w: 0.05, h: 0.05, d: 0.05, color: "#7fe8ff", emissive: 2 });
    const lamps = [];
    for (const [x, z] of SPOTS) {
      addChild(root, createNode({ geometry: tower, position: { x, y: TY + 0.13, z } }));
      const l = createNode({ geometry: lamp, position: { x, y: TY + 0.29, z } });
      addChild(root, l); lamps.push(l);
    }
    // A fixed pool of dots riding the cables: `kind` 0 a transaction, 1 a block; `from`, `to` the towers, `t` 0..1.
    const pool = [];
    for (let i = 0; i < PULSES; i++) { const n = createNode({ geometry: dot, visible: false }); addChild(root, n); pool.push({ n, live: false, from: 0, to: 0, t: 0, kind: 0 }); }
    const has = new Uint8Array(SPOTS.length), lit = new Float32Array(SPOTS.length);
    const st = { height: 1, holding: SPOTS.length, txIn: 0.6, blockIn: 6 };
    const launch = (from, to, kind) => {
      for (const p of pool) if (!p.live) { p.live = true; p.from = from; p.to = to; p.t = 0; p.kind = kind; p.n.visible = true; p.n.scale.x = p.n.scale.y = p.n.scale.z = kind ? 1.8 : 1; return true; }
      return false;
    };
    const neighbours = (k, kind, skip) => { for (let i = 0; i < LINKS.length; i++) { const a = LINKS[i][0], b = LINKS[i][1]; if (a === k && b !== skip) launch(a, b, kind); else if (b === k && a !== skip) launch(b, a, kind); } };
    const net = {
      get height() { return st.height; }, get holding() { return st.holding; },
      send: () => { const k = Math.floor(Math.random() * SPOTS.length); neighbours(k, 0, -1); return k; },
      mine: () => { const k = Math.floor(Math.random() * SPOTS.length); st.height++; has.fill(0); has[k] = 1; st.holding = 1; lit[k] = 1; neighbours(k, 1, -1); return k; },
      reset: () => { st.height = 1; has.fill(1); st.holding = SPOTS.length; for (const p of pool) { p.live = false; p.n.visible = false; } }
    };
    has.fill(1);
    const update = (dt, calm) => {
      const k = calm ? 0.4 : 1;
      if ((st.txIn -= dt) <= 0) { st.txIn = 0.9 + Math.random() * 1.4; net.send(); }
      if ((st.blockIn -= dt) <= 0) { st.blockIn = 9 + Math.random() * 6; net.mine(); }
      for (const p of pool) {
        if (!p.live) continue;
        const A = SPOTS[p.from], Bp = SPOTS[p.to];
        p.t += dt * DOT_SPEED * k / Math.max(0.3, Math.hypot(Bp[0] - A[0], Bp[1] - A[1]));
        if (p.t >= 1) {
          p.live = false; p.n.visible = false;
          // A block arriving at a node that lacks it: checked, kept and passed on (not back where it came from).
          if (p.kind === 1 && !has[p.to]) { has[p.to] = 1; st.holding++; lit[p.to] = 1; neighbours(p.to, 1, p.from); }
          continue;
        }
        p.n.position.x = A[0] + (Bp[0] - A[0]) * p.t; p.n.position.z = A[1] + (Bp[1] - A[1]) * p.t; p.n.position.y = TY + 0.05;
      }
      for (let i = 0; i < lamps.length; i++) { lit[i] = Math.max(0, lit[i] - dt * 0.7); lamps[i].glow = 0.25 + lit[i] * 2; }
    };
    return { root, update, net, terminal: terminal(net), footprint: { w: 2.7, d: 1.8 } };
  };
  BL.genesisNodes = { build, PAGES, SPOTS, LINKS, terminal };
})();
