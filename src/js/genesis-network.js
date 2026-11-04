// Genesis museum: the Bitcoin network round the Satoshi statue, life size and running. Eight node towers stand on the
// floor in a ring, joined by glowing cables laid along the floor; three of them have a miner beside it. Transactions
// (small blue lights) hop from node to node all the time; every so often a miner finds a block: its hash light
// flares, a gold beam goes up, the block drops into its node and races round the ring hop by hop, each node flashing
// gold and adding it to the stack of blocks on its roof as it checks and keeps it. Four large displays set in the
// floor between the towers say what is happening as it happens: sending, mining, spreading, and energy. A toy, and
// said so: real nodes check every rule of every block and transaction, and there are many thousands of them.
//
// `layout()` (pure, so Node can check it): where the towers, miners and floor displays stand, with the boxes a
// walker meets (towers and miners only: the displays are walked over). `build(...)` builds it under the scene's root
// once a visit and returns { update(dt, calm), net, pages, displays }: update allocates nothing, and repaints at most
// one floor display a frame, only when what it shows has changed.
(() => {
  "use strict";
  const BL = window.BL = window.BL || {};
  const CENTRE = { x: 0, z: -3 }, R = 8.5, COUNT = 8, MINERS = [1, 4, 6], DISPLAY_R = 6.3;
  const TOWER = { w: 1.1, h: 2.3, d: 0.9 }, MINER = { w: 1.0, h: 0.75, d: 0.75 }, SHOW = { w: 3.4, d: 1.9 }, STACK = 6;
  const PULSES = 28, TX_SPEED = 3.2, BLOCK_SPEED = 4.5;
  const deg = Math.PI / 180;
  const layout = () => {
    const nodes = [], miners = [], displays = [], boxes = [];
    for (let k = 0; k < COUNT; k++) {
      const a = (22.5 + 45 * k) * deg, x = CENTRE.x + Math.sin(a) * R, z = CENTRE.z + Math.cos(a) * R;
      nodes.push({ k, x, z, ry: a, box: { x0: x - 0.75, x1: x + 0.75, z0: z - 0.75, z1: z + 0.75 } });
    }
    for (const k of MINERS) {
      const a = (22.5 + 45 * k) * deg, r = R + 1.7, x = CENTRE.x + Math.sin(a) * r, z = CENTRE.z + Math.cos(a) * r;
      miners.push({ node: k, x, z, ry: a, box: { x0: x - 0.65, x1: x + 0.65, z0: z - 0.65, z1: z + 0.65 } });
    }
    // The displays between the towers, screens on posts facing out of the ring, so a visitor reads them from outside
    // the ring looking in; `at` is where one stands to read it, and each post's base is in the walkers' way.
    ["send", "mine", "spread", "energy"].forEach((id, i) => {
      const a = (45 + 90 * i) * deg, x = CENTRE.x + Math.sin(a) * DISPLAY_R, z = CENTRE.z + Math.cos(a) * DISPLAY_R;
      const ar = DISPLAY_R + SHOW.d / 2 + 0.9;
      const bx = CENTRE.x + Math.sin(a) * (DISPLAY_R - 0.2), bz = CENTRE.z + Math.cos(a) * (DISPLAY_R - 0.2);
      boxes.push({ x0: bx - 0.45, x1: bx + 0.45, z0: bz - 0.45, z1: bz + 0.45 });
      displays.push({ id, x, z, ry: a + Math.PI, at: { x: CENTRE.x + Math.sin(a) * ar, z: CENTRE.z + Math.cos(a) * ar } });
    });
    for (const n of nodes) boxes.push(n.box);
    for (const m of miners) boxes.push(m.box);
    return { centre: CENTRE, radius: R, nodes, miners, displays, boxes, links: nodes.map((n, i) => [i, (i + 1) % COUNT]) };
  };

  // The explainer: the window Space or a tap on a display opens.
  const RESOURCES = { href: "https://bitcoinguide.app/resources", label: "Bitcoin Guide · resources ↗" };
  const PAGES = [
    { caption: "How Bitcoin works", title: "A network with nobody in charge", text: ["Bitcoin is run by thousands of computers called nodes, each keeping its own copy of every payment ever made and checking every rule for itself.", "The towers round the statue are a toy network of eight. Watch the lights: blue is a payment, gold is a new block."] },
    { caption: "How Bitcoin works", title: "1 · Sending", text: ["A wallet signs a payment with its private key and hands it to a node. The signature proves the owner agreed, without showing the key.", "The node checks it: is the signature right, are the coins there and not already spent? If so, it passes it to its neighbours, who check it too."] },
    { caption: "How Bitcoin works", title: "2 · Waiting", text: ["Checked payments wait in each node's mempool, the queue for the next block.", "Payments that offer a higher fee usually go in first, because the miner who finds the block collects the fees."] },
    { caption: "How Bitcoin works", title: "3 · Mining", text: ["Miners gather waiting payments into a block and hash its header again and again, changing a number each time, until the hash comes out below a target.", "There is no shortcut: only trying works. Finding one takes the whole network about ten minutes; checking it takes a node an instant."] },
    { caption: "How Bitcoin works", title: "4 · Spreading", text: ["The winning miner sends its block to its node, and the block crosses the network hop by hop. Every node checks every payment in it and the proof of work before keeping it.", "A block that breaks any rule is refused, however much work went into it."] },
    { caption: "How Bitcoin works", title: "5 · One history", text: ["Each block names the one before it, so the blocks form a chain. If two blocks are found at once, nodes follow the chain with the most work behind it, and the network soon agrees again.", "To change an old payment, someone would have to redo that block's work and every block's after it, faster than everyone else."] },
    { caption: "Energy", title: "Energy is never free", text: ["The first law of thermodynamics: energy cannot be created or destroyed, only changed from one form to another.", "A miner changes electricity into heat (some miners heat homes and greenhouses). The block keeps a proof that the energy was really spent: it cannot be faked or printed."] },
    { caption: "Energy", title: "Why work makes history hard to undo", text: ["Rewriting a block means spending that energy again, and again for every block on top of it. The deeper a payment is buried, the more energy stands behind it.", "Nothing comes for free: the security of the chain is paid for in real energy, every ten minutes, by miners all over the world."] },
    { caption: "Learn more", title: "Keep going", text: ["Want to go deeper: wallets, keys, nodes, mining and how to start?", "The Bitcoin Guide's resources page collects good places to learn. The link is below."] }
  ];
  // Mining's own story after 2009, after the network's pages in the same window.
  const MINING_PAGES = [
    { caption: "After Genesis", title: "Mining in one line", text: ["Miners gather waiting transactions into a block, then search for a number (the nonce) that makes the block's fingerprint, its SHA-256 hash taken twice, fall below a target.", "Finding that number takes an enormous number of tries. Checking it takes one. That is proof of work, section 4 of the 2008 paper."] },
    { caption: "After Genesis", title: "Ten minutes, on purpose", text: ["Every 2016 blocks, about two weeks, the target adjusts so that a block takes about ten minutes on average however many miners there are.", "More miners make the search harder, fewer make it easier: the pace stays steady."] },
    { caption: "After Genesis", title: "The reward halves", text: ["The first blocks paid 50 bitcoin to whoever found them. The reward halves every 210,000 blocks, about every four years, so new bitcoin slows toward a fixed total of 21 million.", "Miners are also paid the fees of the transactions they include."] },
    { caption: "After Genesis", title: "From CPU to ASIC", text: ["2009: ordinary computers' processors (CPUs) did the work, as on this museum's first-block desk.", "Around 2010: graphics cards (GPUs) took over, many times faster.", "Around 2011: programmable chips (FPGAs) cut the power each try cost.", "From 2013: ASICs, chips built only to compute SHA-256, made every earlier machine uncompetitive. The miners round the statue are original, unbranded illustrations of them."] },
    { caption: "After Genesis", title: "Why the work matters", text: ["To rewrite a past block an attacker must redo its work and all the work after it, faster than everyone else adds new blocks.", "The energy spent is what makes the chain's history expensive to change."] }
  ];
  const HEX = "0123456789abcdef";

  // ---- The live readings of the real network from the page's own chain feed (chain.js: mempool.space and the price
  // socket), each with how fresh it is, a page at a time: the Bitcoin Guide hall's live screen paints them
  // (genesis-bitcoin-guide.js), PAGE_S seconds each.
  const SCREEN = { w: 5.2, h: 2.92, y: 11.6, x: 0, z: -15, CYCLE: 9 };
  const HALVING = 210000;
  const fmtInt = (n) => Math.round(n).toLocaleString("en-US");
  const SCREEN_PAGES = [
    { id: "hash", title: "NETWORK HASHRATE", ink: "#ff9a3a", read: (c) => c.hashrate > 0 ? [`${(c.hashrate / 1e18).toFixed(0)} EH/s`, `${fmtInt(c.hashrate / 1e18)} million million million hashes every second`, c.difficulty > 0 ? `difficulty ${(c.difficulty / 1e12).toFixed(1)} T${c.progressPercent ? ` · ${c.progressPercent.toFixed(0)}% through this epoch` : ""}` : ""] : null },
    { id: "height", title: "BLOCK HEIGHT", ink: "#ffd23a", read: (c) => c.height > 0 ? [fmtInt(c.height), c.lastBlockAt ? `last block ${Math.max(0, Math.floor((Date.now() - c.lastBlockAt) / 60000))} min ago` : "", `${fmtInt(HALVING - c.height % HALVING)} blocks to the next halving`] : null },
    { id: "fees", title: "FEES · MEMPOOL", ink: "#7fe8ff", read: (c) => c.feesAt || c.count ? [`${c.fastestFee || c.nextFee || 0} sat/vB`, `next block · half hour ${c.halfHourFee || 0} · hour ${c.hourFee || 0}`, c.count ? `${fmtInt(c.count)} payments waiting · ${c.deep.toFixed(1)} MvB` : ""] : null },
    { id: "epoch", title: "DIFFICULTY ADJUSTMENT", ink: "#b98cff", read: (c) => c.remainingBlocks > 0 || c.progressPercent > 0 ? [`${c.progressPercent.toFixed(1)}%`, `${fmtInt(c.remainingBlocks)} blocks to the next retarget, about ${(c.remainingBlocks / 144).toFixed(1)} days`, `expected change ${c.difficultyChange >= 0 ? "+" : ""}${c.difficultyChange.toFixed(2)}% · every 2,016 blocks`] : null },
    { id: "supply", title: "BITCOIN MINED", ink: "#ffd27a", read: (c) => {
      if (!(c.height > 0)) return null;
      let mined = 0, left = c.height + 1, reward = 50;
      while (left > 0) { const n = Math.min(left, HALVING); mined += n * reward; left -= n; if (left > 0) reward /= 2; }
      return [`${fmtInt(mined)} BTC`, `${(mined / 21e6 * 100).toFixed(2)}% of 21,000,000 · ${reward} BTC a block now`, `next halving at block ${fmtInt(Math.ceil((c.height + 1) / HALVING) * HALVING)}`];
    } },
    { id: "price", title: "ONE BITCOIN", ink: "#5cff7a", read: (c) => c.priceUsd > 0 ? [`$${fmtInt(c.priceUsd)}`, `${fmtInt(1e8 / c.priceUsd)} sats to the dollar`, c.priceOpenUsd > 0 ? `${c.priceUsd >= c.priceOpenUsd ? "+" : ""}${((c.priceUsd / c.priceOpenUsd - 1) * 100).toFixed(1)}% today · 21,000,000 ever` : "21,000,000 ever"] : null }
  ];
  const paintScreen = (g, W, H, page) => {
    const c = BL.chain && BL.chain.snapshot, rows = c ? page.read(c) : null;
    g.fillStyle = "#05070a"; g.fillRect(0, 0, W, H);
    g.strokeStyle = page.ink; g.lineWidth = 8; g.strokeRect(12, 12, W - 24, H - 24);
    g.textAlign = "center"; g.textBaseline = "middle";
    g.fillStyle = page.ink; g.font = "bold 46px sans-serif"; g.fillText(page.title, W / 2, 70);
    if (!rows) {
      g.fillStyle = "#c9d4de"; g.font = "bold 60px sans-serif"; g.fillText("WAITING FOR THE NETWORK", W / 2, H / 2);
      g.font = "26px sans-serif"; g.fillStyle = "#8a96a3"; g.fillText("no reading yet this visit", W / 2, H / 2 + 64);
    } else {
      g.shadowColor = page.ink; g.shadowBlur = 24;
      g.fillStyle = "#ffffff"; g.font = "bold 132px sans-serif"; g.fillText(rows[0], W / 2, H / 2 - 10);
      g.shadowBlur = 0;
      g.fillStyle = "#dfe7ee"; g.font = "30px sans-serif"; g.fillText(rows[1], W / 2, H / 2 + 92);
      g.fillStyle = "#9fb3c8"; g.font = "26px sans-serif"; g.fillText(rows[2], W / 2, H / 2 + 136);
    }
    g.font = "20px sans-serif"; g.fillStyle = c && c.live ? "#5cff7a" : "#8a96a3";
    g.fillText(c && c.live ? `LIVE · ${c.source}` : c && c.at ? "STALE · the last reading, held" : "", W / 2, H - 38);
  };
  const keyScreen = (page) => { const c = BL.chain && BL.chain.snapshot, r = c ? page.read(c) : null; return `${page.id}|${r ? r.join("|") : "-"}|${c && c.live}`; };

  const build = ({ M, createNode, addChild, place, top }) => {
    const L = layout();
    const root = place(createNode({ position: { x: 0, y: top, z: 0 } }));
    // ---- The towers: a dark case on a plinth, rows of blinking lights, a screen, the lamp on top and the chain's
    // blocks stacked on its roof. One shared mesh; the lights are nodes of their own so they can glow.
    const caseGeo = M.merge(
      M.bevelBox({ w: TOWER.w + 0.2, h: 0.18, d: TOWER.d + 0.2, color: "#2a2d33", bevel: 0.04, offset: { x: 0, y: 0.09, z: 0 } }),
      M.bevelBox({ w: TOWER.w, h: TOWER.h, d: TOWER.d, color: "#1c1f25", bevel: 0.06, offset: { x: 0, y: 0.18 + TOWER.h / 2, z: 0 } }),
      M.box({ w: TOWER.w - 0.16, h: 0.05, d: TOWER.d + 0.02, color: "#3a3f48", offset: { x: 0, y: 0.18 + TOWER.h - 0.12, z: 0 } }),
      ...[0, 1, 2, 3, 4].map((r) => M.box({ w: TOWER.w - 0.24, h: 0.2, d: 0.02, color: "#0d0f12", offset: { x: 0, y: 0.5 + r * 0.3, z: TOWER.d / 2 + 0.005 } })));
    const ledGeo = M.merge(...[0, 1, 2, 3, 4].map((r) => M.merge(...[-0.3, -0.18, -0.06, 0.06].map((x) => M.box({ w: 0.06, h: 0.06, d: 0.02, color: "#5cff7a", emissive: 1.6, offset: { x, y: 0.5 + r * 0.3, z: TOWER.d / 2 + 0.02 } })))));
    const ledGeo2 = M.merge(...[0, 1, 2, 3, 4].map((r) => M.box({ w: 0.12, h: 0.06, d: 0.02, color: "#5ec8ff", emissive: 1.6, offset: { x: 0.3, y: 0.5 + r * 0.3, z: TOWER.d / 2 + 0.02 } })));
    const screenGeo = M.box({ w: TOWER.w - 0.24, h: 0.34, d: 0.02, color: "#7affd8", emissive: 1.2, offset: { x: 0, y: 2.1, z: TOWER.d / 2 + 0.015 } });
    const lampGeo = M.box({ w: TOWER.w - 0.3, h: 0.08, d: TOWER.d - 0.3, color: "#ffd23a", emissive: 1.8 });
    const chainGeo = M.bevelBox({ w: 0.34, h: 0.2, d: 0.34, color: "#f7b21a", emissive: 0.9, bevel: 0.03 });
    const ringGeo = M.turnedX(M.torus(0.9, 0.05, "#ffd23a", 2), Math.PI / 2);
    const towers = L.nodes.map((n) => {
      const t = createNode({ position: { x: n.x, y: 0, z: n.z }, rotation: { x: 0, y: n.ry, z: 0 } });
      const leds = createNode({ geometry: ledGeo }), leds2 = createNode({ geometry: ledGeo2 }), screen = createNode({ geometry: screenGeo });
      const lamp = createNode({ geometry: lampGeo, position: { x: 0, y: 0.18 + TOWER.h + 0.04, z: 0 } });
      const stack = [];
      for (let s = 0; s < STACK; s++) { const c = createNode({ geometry: chainGeo, position: { x: 0, y: 0.18 + TOWER.h + 0.2 + s * 0.22, z: 0 }, visible: false }); addChild(t, c); stack.push(c); }
      const ring = createNode({ geometry: ringGeo, position: { x: 0, y: 0.06, z: 0 }, visible: false });
      addChild(t, createNode({ geometry: caseGeo }), leds, leds2, screen, lamp, ring);
      addChild(root, t);
      return { t, leds, leds2, screen, lamp, stack, ring, flash: 0, burst: 0, has: 1, seed: n.k * 1.7 };
    });
    // ---- The cables: a glowing strip along the floor between neighbours, brightening while something rides it.
    const cables = L.links.map(([a, b]) => {
      const A = L.nodes[a], B = L.nodes[b], len = Math.hypot(B.x - A.x, B.z - A.z) - 1.4, yaw = Math.atan2(B.x - A.x, B.z - A.z);
      const n = createNode({ geometry: M.merge(M.box({ w: 0.34, h: 0.03, d: len, color: "#1a2c3a" }), M.box({ w: 0.12, h: 0.04, d: len, color: "#3aa8ff", emissive: 1 })), position: { x: (A.x + B.x) / 2, y: 0.015, z: (A.z + B.z) / 2 }, rotation: { x: 0, y: yaw, z: 0 }, sightHidden: true });
      addChild(root, n);
      return { n, busy: 0 };
    });
    // ---- The miners: a grey hashing box with two spinning fans and an orange hash light, a cable to its node, and
    // the beam that goes up when it finds a block.
    const minerGeo = M.merge(
      M.bevelBox({ w: MINER.w, h: MINER.h, d: MINER.d, color: "#8e98a6", bevel: 0.05, offset: { x: 0, y: MINER.h / 2 + 0.05, z: 0 } }),
      M.box({ w: MINER.w + 0.1, h: 0.05, d: MINER.d + 0.1, color: "#3a3d42", offset: { x: 0, y: 0.025, z: 0 } }),
      ...[-0.25, 0.25].map((x) => M.moved(M.turnedX(M.lathe({ profile: [[0, 0], [0.2, 0], [0.2, 0.03], [0, 0.03]], segments: 16, color: "#2b2e33" }), Math.PI / 2), x, 0.43, MINER.d / 2 + 0.01)));
    const fanGeo = M.merge(M.box({ w: 0.34, h: 0.05, d: 0.02, color: "#5a5f66" }), M.box({ w: 0.05, h: 0.34, d: 0.02, color: "#5a5f66" }));
    const hashGeo = M.box({ w: MINER.w - 0.2, h: 0.06, d: 0.02, color: "#ff9a3a", emissive: 1.8, offset: { x: 0, y: 0.15, z: MINER.d / 2 + 0.02 } });
    const beamGeo = M.box({ w: 0.16, h: 1, d: 0.16, color: "#ffe08a", emissive: 2.4 });
    const blockGeo = M.bevelBox({ w: 0.42, h: 0.3, d: 0.42, color: "#ffc23a", emissive: 1.4, bevel: 0.04 });
    const miners = L.miners.map((m) => {
      const t = createNode({ position: { x: m.x, y: 0, z: m.z }, rotation: { x: 0, y: m.ry, z: 0 } });
      const fans = [-0.25, 0.25].map((x) => createNode({ geometry: fanGeo, position: { x, y: 0.43, z: MINER.d / 2 + 0.03 } }));
      const hash = createNode({ geometry: hashGeo }), beam = createNode({ geometry: beamGeo, position: { x: 0, y: 0.8, z: 0 }, visible: false });
      addChild(t, createNode({ geometry: minerGeo }), ...fans, hash, beam);
      addChild(root, t);
      const N = L.nodes[m.node], len = Math.hypot(N.x - m.x, N.z - m.z) - 1.2;
      addChild(root, createNode({ geometry: M.merge(M.box({ w: 0.26, h: 0.03, d: len, color: "#2a1f14" }), M.box({ w: 0.08, h: 0.04, d: len, color: "#ff9a3a", emissive: 0.8 })), position: { x: (N.x + m.x) / 2, y: 0.015, z: (N.z + m.z) / 2 }, rotation: { x: 0, y: Math.atan2(N.x - m.x, N.z - m.z), z: 0 }, sightHidden: true }));
      return { t, fans, hash, beam, node: m.node, x: m.x, z: m.z, found: 0, rate: 0.8 + m.node * 0.07 };
    });
    // ---- The lights riding the cables: a fixed pool. `kind` 0 a payment, 1 a block; along link `link` from tower
    // `from` to `to`, `t` 0..1. A found block first rises out of its miner (`kind` 2) and drops into its node.
    const txGeo = M.box({ w: 0.2, h: 0.2, d: 0.2, color: "#7fe8ff", emissive: 2.2 });
    const pool = [];
    for (let i = 0; i < PULSES; i++) { const n = createNode({ visible: false }); addChild(root, n); pool.push({ n, live: false, kind: 0, from: 0, to: 0, link: 0, t: 0, miner: 0 }); }
    const st = { height: 1, holding: COUNT, txIn: 0.4, mineIn: 5, relayed: 0, mempool: 0, nonce: 0, finder: -1, flash: 0, work: 1, t: 0, tries: 0 };
    const launch = (from, to, kind) => {
      for (const p of pool) if (!p.live) {
        p.live = true; p.kind = kind; p.from = from; p.to = to; p.t = 0; p.n.visible = true; p.n.geometry = kind ? blockGeo : txGeo;
        if (kind < 2) { const d = (to - from + COUNT) % COUNT; p.link = d === 1 ? from : to; cables[p.link].busy = 1; }
        return true;
      }
      return false;
    };
    const relay = (k, kind, skip) => { const l = (k + COUNT - 1) % COUNT, r = (k + 1) % COUNT; if (l !== skip) launch(k, l, kind); if (r !== skip) launch(k, r, kind); };
    const keep = (k) => { const T = towers[k]; T.has = 1; T.flash = 1; T.burst = 1; st.holding++; };
    const net = {
      get height() { return st.height; }, get holding() { return st.holding; },
      send: () => { const k = Math.floor(Math.random() * COUNT); st.relayed++; st.mempool = Math.min(99, st.mempool + 1); relay(k, 0, -1); return k; },
      mine: (i = Math.floor(Math.random() * miners.length)) => {
        const m = miners[i]; m.found = 1; st.finder = i; st.flash = 1;
        for (const p of pool) if (!p.live) { p.live = true; p.kind = 2; p.miner = i; p.t = 0; p.n.visible = true; p.n.geometry = blockGeo; break; }
        return m.node;
      }
    };
    // A block lands in its miner's node: a new height, that node keeps it first, and it goes out both ways.
    const arrive = (i) => {
      const k = miners[i].node; st.height++; st.work++; st.holding = 0; st.mempool = Math.max(0, st.mempool - 12);
      for (const T of towers) T.has = 0;
      keep(k); relay(k, 1, -1);
    };
    // ---- The floor displays: a canvas each, laid flat in a lit frame. Painted when their numbers change.
    const DW = 768, DH = 432;
    const displays = L.displays.map((d) => {
      const canvas = document.createElement("canvas"); canvas.width = DW; canvas.height = DH;
      const w = SHOW.w, h = SHOW.d;
      const face = { verts: [-w / 2, -h / 2, 0, w / 2, -h / 2, 0, w / 2, h / 2, 0, -w / 2, h / 2, 0], faces: [{ i: [0, 1, 2, 3], color: [255, 255, 255], emissive: 0.9 }], lines: [], castShadow: false };
      face.imageSurface = { canvas, version: 1, rect: [-w / 2, -h / 2, w, h] };
      // A screen on a post, tipped back a little toward the statue, facing out of the ring (the frame turned half
      // round from the display's own facing, so its +z points outward) at a visitor walking round the statue, its lower edge at waist height so it reads at a glance and hides nothing.
      const frame = createNode({ position: { x: d.x, y: 0, z: d.z }, rotation: { x: 0, y: d.ry + Math.PI, z: 0 }, sightHidden: true });
      const stand = createNode({ geometry: M.merge(
        M.bevelBox({ w: 1.0, h: 0.12, d: 0.7, color: "#15181d", bevel: 0.04, offset: { x: 0, y: 0.06, z: -0.2 } }),
        M.box({ w: 0.18, h: 1.3, d: 0.18, color: "#22262c", offset: { x: 0, y: 0.75, z: -0.32 } }),
        M.box({ w: 0.9, h: 0.03, d: 0.03, color: "#ffd23a", emissive: 1.2, offset: { x: 0, y: 0.13, z: 0.16 } })) });
      const panel = createNode({ position: { x: 0, y: 1.05 + h / 2, z: 0 }, rotation: { x: -0.32, y: 0, z: 0 } });
      const edge = createNode({ geometry: M.merge(
        M.box({ w: w + 0.3, h: h + 0.3, d: 0.08, color: "#15181d", offset: { x: 0, y: 0, z: -0.05 } }),
        M.box({ w: w + 0.3, h: 0.06, d: 0.06, color: "#ffd23a", emissive: 1.4, offset: { x: 0, y: (h + 0.3) / 2, z: 0 } }),
        M.box({ w: w + 0.3, h: 0.06, d: 0.06, color: "#ffd23a", emissive: 1.4, offset: { x: 0, y: -(h + 0.3) / 2, z: 0 } }),
        M.box({ w: 0.06, h: h + 0.3, d: 0.06, color: "#ffd23a", emissive: 1.4, offset: { x: -(w + 0.3) / 2, y: 0, z: 0 } }),
        M.box({ w: 0.06, h: h + 0.3, d: 0.06, color: "#ffd23a", emissive: 1.4, offset: { x: (w + 0.3) / 2, y: 0, z: 0 } })) });
      const pic = createNode({ geometry: face, position: { x: 0, y: 0, z: 0.012 } });
      addChild(panel, edge, pic); addChild(frame, stand, panel); addChild(root, frame);
      return { id: d.id, canvas, face, edge, key: "" };
    });
    const bar = (g, x, y, w, h, k, c) => { g.fillStyle = "#1d2630"; g.fillRect(x, y, w, h); g.fillStyle = c; g.fillRect(x, y, w * Math.max(0, Math.min(1, k)), h); };
    const head = (g, n, title, c) => {
      g.fillStyle = "#06090d"; g.fillRect(0, 0, DW, DH);
      g.strokeStyle = c; g.lineWidth = 6; g.strokeRect(10, 10, DW - 20, DH - 20);
      g.fillStyle = c; g.font = "bold 46px sans-serif"; g.textAlign = "left"; g.textBaseline = "top"; g.fillText(`${n} · ${title}`, 34, 28);
      g.font = "26px sans-serif"; g.fillStyle = "#e9eef5";
    };
    const lines = (g, list, y) => { for (let i = 0; i < list.length; i++) g.fillText(list[i], 34, y + i * 34); };
    const PAINT = {
      send: (g) => {
        head(g, 1, "SEND", "#7fe8ff");
        lines(g, ["A wallet signs a payment and hands it to a node.", "Each node checks it, then passes it on.", "Blue lights: payments crossing the network."], 100);
        g.font = "bold 34px monospace"; g.fillStyle = "#7fe8ff";
        g.fillText(`relayed ${st.relayed}`, 34, 230); g.fillText(`waiting ${st.mempool}`, 34, 280);
        bar(g, 34, 340, DW - 68, 26, st.mempool / 40, "#3aa8ff");
        g.font = "20px sans-serif"; g.fillStyle = "#9fb3c8"; g.fillText("the mempool: payments waiting for the next block", 34, 376);
      },
      mine: (g) => {
        head(g, 2, "MINE", "#ff9a3a");
        lines(g, ["Miners hash the next block again and again,", "changing a number each time, until the result", "falls below a target. Only trying works."], 100);
        g.font = "bold 30px monospace"; g.fillStyle = "#ffd23a"; g.fillText(`nonce  ${st.nonce >>> 0}`, 34, 220);
        let s = "";
        for (let i = 0; i < 24; i++) s += HEX[(st.nonce * 7 + i * 13 + (i * st.nonce >>> 3)) & 15];
        g.fillStyle = st.flash > 0 ? "#5cff7a" : "#c9d4de"; g.fillText(`hash   ${st.flash > 0 ? "0000000000" + s.slice(10) : s}`, 34, 262);
        g.fillStyle = "#8a96a3"; g.fillText("target 0000000000ffffffffffff", 34, 304);
        g.font = "bold 40px sans-serif"; g.fillStyle = st.flash > 0 ? "#5cff7a" : "#ff9a3a";
        g.fillText(st.flash > 0 ? `FOUND! block ${st.height}` : `tries ${st.tries}`, 34, 352);
      },
      spread: (g) => {
        head(g, 3, "SPREAD", "#ffd23a");
        lines(g, ["The block races from node to node.", "Every node checks it before keeping it:", "a block that breaks a rule is refused."], 100);
        g.font = "bold 34px monospace"; g.fillStyle = "#ffd23a"; g.fillText(`block ${st.height}: ${st.holding} of ${COUNT} nodes`, 34, 228);
        for (let k = 0; k < COUNT; k++) { g.fillStyle = towers[k].has ? "#ffd23a" : "#2a2f36"; g.beginPath(); g.arc(70 + k * 86, 312, 26, 0, 7); g.fill(); }
        g.font = "20px sans-serif"; g.fillStyle = "#9fb3c8"; g.fillText("each tower keeps the chain on its roof: one block on top of the last", 34, 370);
      },
      energy: (g) => {
        head(g, 4, "ENERGY", "#ff5f6a");
        lines(g, ["Energy is never created or destroyed: it only changes", "form (the first law of thermodynamics). Mining turns", "electricity into heat, and each block is proof it was spent.", "To undo a block, spend it all again, and for every", "block after it."], 96);
        g.font = "bold 30px monospace"; g.fillStyle = "#ff8a5a"; g.fillText(`blocks of work in this chain: ${st.work}`, 34, 290);
        for (let i = 0; i < 24; i++) { g.fillStyle = `hsl(${12 + (i * 7 + st.t * 40) % 40}, 95%, ${42 + ((i * 37 + Math.floor(st.t * 6)) % 5) * 5}%)`; g.fillRect(34 + i * 29, 340, 24, 34); }
      }
    };
    const keyOf = (id) => id === "send" ? `${st.relayed}|${st.mempool}` : id === "mine" ? `${st.tries}|${st.flash > 0}|${st.height}` : id === "spread" ? `${st.height}|${st.holding}` : `${st.work}|${Math.floor(st.t * 3)}`;
    let paintNext = 0, paintIn = 0;
    const paint = (dt) => {
      if ((paintIn -= dt) > 0) return;
      paintIn = 0.08;
      const d = displays[paintNext]; paintNext = (paintNext + 1) % displays.length;
      const k = keyOf(d.id);
      if (k === d.key) return;
      d.key = k; PAINT[d.id](d.canvas.getContext("2d")); d.face.imageSurface.version++;
    };
    const update = (dt, calm) => {
      const s = calm ? 0.35 : 1;
      st.t += dt;
      if ((st.txIn -= dt) <= 0) { st.txIn = calm ? 1.6 : 0.35 + Math.random() * 0.6; net.send(); }
      if ((st.mineIn -= dt) <= 0) { st.mineIn = calm ? 20 : 9 + Math.random() * 5; net.mine(); }
      st.nonce = (st.nonce + Math.floor(dt * 9137)) >>> 0; st.tries += Math.floor(dt * 40) || 1;
      if (st.flash > 0 && (st.flash -= dt * 0.35) <= 0) { st.flash = 0; st.tries = 0; }
      for (const p of pool) {
        if (!p.live) continue;
        if (p.kind === 2) {
          // Up out of the miner, then over and down into its node.
          const m = miners[p.miner], N = L.nodes[m.node];
          p.t += dt * 0.7 * s;
          if (p.t >= 1) { p.live = false; p.n.visible = false; arrive(p.miner); continue; }
          const up = Math.min(1, p.t / 0.45), over = Math.max(0, (p.t - 0.45) / 0.55);
          p.n.position.x = m.x + (N.x - m.x) * over; p.n.position.z = m.z + (N.z - m.z) * over;
          p.n.position.y = 1 + up * 2.2 - over * over * 0.4 + Math.sin(over * Math.PI) * 0.6;
          p.n.rotation.y += dt * 3;
          continue;
        }
        const A = L.nodes[p.from], B = L.nodes[p.to], len = Math.hypot(B.x - A.x, B.z - A.z);
        p.t += dt * (p.kind ? BLOCK_SPEED : TX_SPEED) * s / len;
        cables[p.link].busy = Math.max(cables[p.link].busy, p.kind ? 1 : 0.5);
        if (p.t >= 1) {
          p.live = false; p.n.visible = false;
          if (p.kind === 1 && !towers[p.to].has) { keep(p.to); relay(p.to, 1, p.from); }
          else if (p.kind === 0) towers[p.to].flash = Math.max(towers[p.to].flash, 0.25);
          continue;
        }
        p.n.position.x = A.x + (B.x - A.x) * p.t; p.n.position.z = A.z + (B.z - A.z) * p.t;
        p.n.position.y = p.kind ? 0.35 + Math.sin(p.t * Math.PI) * 0.25 : 0.2;
        if (p.kind) p.n.rotation.y += dt * 4;
      }
      for (let k = 0; k < COUNT; k++) {
        const T = towers[k], blink = calm ? 0.5 : (Math.sin(st.t * (5 + k) + T.seed) > 0 ? 1 : 0.35);
        T.flash = Math.max(0, T.flash - dt * 1.2);
        T.leds.glow = 0.4 + blink * 0.9; T.leds2.glow = 0.4 + (calm ? 0.5 : (Math.sin(st.t * 7.3 + T.seed * 2) > 0.3 ? 1 : 0.2));
        T.screen.glow = 0.7 + T.flash * 1.5; T.lamp.glow = 0.3 + T.flash * 2.4;
        const n = T.has ? Math.min(STACK, st.height) : Math.min(STACK, st.height - 1);
        for (let i = 0; i < STACK; i++) { T.stack[i].visible = i < n; T.stack[i].glow = i === n - 1 ? 0.8 + T.flash * 1.5 : 0.5; }
        if (T.burst > 0) { T.burst = Math.max(0, T.burst - dt * 1.4); const r = 1 + (1 - T.burst) * 2.2; T.ring.visible = true; T.ring.scale.x = T.ring.scale.z = r; T.ring.scale.y = 1; T.ring.glow = T.burst * 2.5; }
        else T.ring.visible = false;
      }
      for (const c of cables) { c.busy = Math.max(0, c.busy - dt * 1.5); c.n.glow = 0.5 + c.busy * 1.5; }
      for (const m of miners) {
        if (!calm) for (const f of m.fans) f.rotation.z += dt * 14;
        m.hash.glow = m.found > 0 ? 2.5 : 0.6 + (Math.sin(st.t * 23 * m.rate) > 0 ? 0.9 : 0.2);
        if (m.found > 0) { m.found = Math.max(0, m.found - dt * 0.6); m.beam.visible = true; m.beam.scale.y = 6 * m.found; m.beam.position.y = 0.8 + 3 * m.found; m.beam.glow = 1 + m.found * 2; }
        else m.beam.visible = false;
      }
      for (const d of displays) d.edge.glow = 0.8 + Math.sin(st.t * 2 + d.id.length) * 0.3;
      paint(dt);

    };
    return { root, update, net, layout: L, displays };
  };
  BL.genesisNetwork = { layout, build, PAGES, MINING_PAGES, RESOURCES, SCREEN_PAGES, SCREEN, paintScreen, keyScreen };
})();
